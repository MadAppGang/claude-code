# Clauder Architecture Analysis

> Analysis of [github.com/ZohaibAhmed/clauder](https://github.com/ZohaibAhmed/clauder) — how it handles Claude Code real-time output, user input, and states.

## Architecture Overview

Clauder is a Go-based wrapper that turns Claude Code (or Goose/Aider/Codex) into an HTTP-accessible service with real-time streaming. It works by running the CLI agent inside a **pseudo-terminal (PTY)**, scraping the terminal screen, diffing screens to extract messages, and exposing everything via an HTTP API + SSE.

## 1. Real-Time Output (Screen Capture Pipeline)

The output pipeline has 4 layers:

### Layer 1: PTY Process (`lib/termexec/termexec.go`)

- Spawns the CLI agent (e.g. `claude`) inside an **xpty pseudo-terminal** with `TERM=vt100`
- A background goroutine continuously reads runes from the PTY's `PassthroughPipe` and writes them to a VT100 terminal emulator (`xp.Term.WriteRune(r)`)
- Tracks `lastScreenUpdate` timestamp with a `RWMutex` to know when output last changed
- **`ReadScreen()`** implements a "vsync" mechanism: waits for the screen to be stable for 16ms (up to 48ms max) before returning the terminal state, to avoid capturing mid-redraw artifacts

### Layer 2: Snapshot Loop (`lib/screentracker/conversation.go`)

- Runs a goroutine that calls `ReadScreen()` every **25ms** (~40 FPS)
- Stores snapshots in a **ring buffer** sized to the stability threshold
- On each snapshot, calls `updateLastAgentMessage()` which:
  - Diffs the current screen against `screenBeforeLastUserMessage` using `FindNewMessage()` (line-by-line diff)
  - Strips the echoed user input via `RemoveUserInput()` (fuzzy rune-matching algorithm)
  - Removes terminal UI "message boxes"
  - Updates or appends to the `messages[]` conversation history

### Layer 3: Event Emitter (`lib/httpapi/events.go`)

- A second goroutine (in `server.go:StartSnapshotLoop`) polls every 25ms and feeds changes to `EventEmitter`:
  - `UpdateMessagesAndEmitChanges()` — diffs message array, emits `message_update` events for changed/new messages
  - `UpdateStatusAndEmitChanges()` — emits `status_change` when status transitions
  - `UpdateScreenAndEmitChanges()` — emits `screen_update` for raw screen (internal endpoint)
- Uses buffered channels (1024) per subscriber; full channels get closed (backpressure)

### Layer 4: SSE Delivery (`lib/httpapi/server.go`)

- **`GET /events`** — SSE endpoint sending `message_update` and `status_change` events (filters out `screen_update`)
- **`GET /internal/screen`** — SSE endpoint sending raw screen content (used by `attach` command)
- On subscribe, sends full current state as initial events, then streams deltas

## 2. User Input (Two Input Paths)

### Path A: Structured "user" Messages (`POST /message` with `type: "user"`)

1. Validates agent is in `stable` status (not processing)
2. Formats message using **bracketed paste mode** (`\x1b[200~`...`\x1b[201~`) — a terminal protocol that tells the agent "this is pasted text, not typed keystrokes"
3. Prepends a hack: `"x\b"` (type 'x' then backspace) to prevent Claude Code from echoing the paste start sequence
4. **`writeMessageWithConfirmation()`** implements a two-phase write:
   - **Phase 1**: Write the message text, then wait up to 15s for the screen to change and stabilize (screen changed + stable for 1s)
   - **Phase 2**: Send carriage return `\r`, then wait up to 15s for the screen to change (confirming the agent started processing). Retries `\r` every 3s if nothing happens
5. Records the screen state before the message as `screenBeforeLastUserMessage` (used later for diffing the response)
6. Appends user message to conversation history

### Path B: Raw Terminal Input (`POST /message` with `type: "raw"`)

- Writes bytes directly to the PTY pipe — no formatting, no conversation tracking
- Used for control keys (Ctrl+C, arrows, Tab, etc.) and the `attach` command

### Frontend Input (`chat/src/components/message-input.tsx`)

- **Text mode**: Collects full message, sends as `type: "user"` on Enter
- **Control mode**: Captures individual keystrokes, maps them to terminal escape sequences (e.g. `ArrowUp` → `\x1b[A`, `Ctrl+C` → `\x03`), sends each as `type: "raw"` immediately

## 3. State Machine

### Conversation Status (`lib/screentracker/conversation.go`)

Three states determined by the snapshot ring buffer:

| Status | Condition |
|---|---|
| **`initializing`** | Buffer not yet full (not enough snapshots collected) |
| **`changing`** | Last message was from user (agent hasn't responded yet), OR any snapshot in the buffer differs from the others |
| **`stable`** | All snapshots in the buffer are identical (screen hasn't changed for `ScreenStabilityLength` = 2 seconds) |

The stability check: the ring buffer holds `threshold` snapshots (calculated as `ceil(2000ms / 25ms) + 1 = 81`). If all 81 snapshots are identical, the screen has been unchanged for ~2 seconds → agent is idle.

### HTTP API Status (mapped in `lib/httpapi/events.go`)

Simplified to two values for consumers:

- **`running`** = `initializing` or `changing` (agent is working)
- **`stable`** = `stable` (agent is waiting for input)

### Frontend Status (`chat/src/components/chat-provider.tsx`)

Three values: `online` (maps from `running`/`stable`), `offline` (SSE connection lost), `unknown` (initial)

## 4. Message Extraction Algorithm

The core challenge: Claude Code is a TUI app that redraws the entire screen. Clauder must extract just the new response text.

1. **`FindNewMessage(oldScreen, newScreen)`** — compares lines of the screen before the user message vs current screen, finds the first non-matching line, returns everything from there down (trimmed)
2. **`RemoveUserInput(message, userInput)`** — agents echo user input back. This uses a fuzzy matching algorithm:
   - Normalizes both strings (strips whitespace, keeps runes with line positions)
   - Searches the first 5 lines / 25 runes of the message for the first 6 runes of user input
   - Walks forward through both strings with a 5x5 lookahead window to find matching runes (handles agents that mangle input, like Codex stripping backticks)
   - Returns everything after the last matched line
3. **`removeMessageBox()`** — strips TUI chrome (box-drawing characters like `│`, `─`, `╭`, `╮`)

## 5. Attach Mode (`cmd/attach/attach.go`)

A terminal client that mirrors the remote session locally using Bubble Tea:

- Subscribes to `GET /internal/screen` via SSE for real-time screen updates
- Captures local stdin keystrokes and sends them as `POST /message` with `type: "raw"`
- Skips Ctrl+C (handled locally to quit attach)
- Uses `term.MakeRaw()` for raw terminal mode

## 6. Quickstart / Remote Access (`cmd/quickstart/`)

- Starts Claude Code + Clauder server + tunnel (cloudflared/bore/ngrok)
- Generates a 6-char passcode and auth token
- Registers with a Cloudflare Workers coordinator for mobile app discovery
- Server uses Bearer token auth middleware when tunnel is active

## Key Design Decisions

1. **PTY-based, not API-based** — wraps the CLI as-is rather than using Claude's API directly. This means it works with any terminal agent (Goose, Aider, Codex, custom).
2. **Screen diffing for message extraction** — fragile but universal approach. The 2-second stability threshold and vsync-like ReadScreen prevent capturing mid-render states.
3. **Bracketed paste mode** for input — prevents agents from interpreting message text as individual keystrokes.
4. **Two input modes** — structured messages (tracked in conversation) vs raw keystrokes (direct PTY pass-through).
5. **Ring buffer stability detection** — elegant approach: if N consecutive screenshots are identical, the agent is idle.

## Data Flow Diagram

```
User Input                          Real-Time Output
─────────                          ─────────────────

POST /message                      claude CLI (PTY process)
  │                                      │
  ├─ type:"user"                         │ runes via PassthroughPipe
  │   │                                  ▼
  │   ├─ Validate status=stable     VT100 Terminal Emulator
  │   ├─ Format (bracketed paste)     (xp.Term.WriteRune)
  │   ├─ Write to PTY                   │
  │   ├─ Wait for screen change         ▼
  │   ├─ Send \r                    ReadScreen() [vsync 16ms]
  │   ├─ Wait for processing start      │
  │   └─ Record in messages[]           ▼
  │                                 Snapshot Loop [25ms]
  └─ type:"raw"                      │
      └─ Write bytes to PTY          ├─ Ring Buffer (81 slots)
                                     ├─ FindNewMessage (screen diff)
                                     ├─ RemoveUserInput (fuzzy match)
                                     └─ Update messages[]
                                          │
                                          ▼
                                     EventEmitter
                                      │
                                      ├─ message_update events
                                      ├─ status_change events
                                      └─ screen_update events
                                          │
                                          ▼
                                     GET /events (SSE)
                                      │
                                      ├─ Web Chat (Next.js)
                                      ├─ iOS App
                                      └─ attach CLI
```

# Claude Code Protocol Specification

> **COMPREHENSIVE DOCUMENTATION** of Claude Code's communication protocol with Anthropic API
>
> Based on deep analysis of monitor mode logs and real-world traffic patterns.

---

## Table of Contents

1. [Protocol Overview](#protocol-overview)
2. [Request Structure](#request-structure)
3. [Multi-Call Pattern](#multi-call-pattern)
4. [Streaming Protocol](#streaming-protocol)
5. [Thinking Mode](#thinking-mode)
6. [Tool Call Protocol](#tool-call-protocol)
7. [Prompt Caching](#prompt-caching)
8. [Beta Features](#beta-features)
9. [Complete Examples](#complete-examples)

---

## Protocol Overview

### Core Characteristics

Claude Code communicates with Anthropic API using:

- **Transport:** HTTPS with Server-Sent Events (SSE) for streaming
- **Format:** JSON for requests, SSE for responses
- **Authentication:** API key via `x-api-key` header
- **Streaming:** Always enabled (`stream: true`)
- **Caching:** Extensive prompt caching with ephemeral cache controls

### Key Specifications

```
API Version: 2023-06-01
User Agent: claude-cli/2.0.36 (external, cli)
Timeout: 600 seconds (10 minutes)
Max Tokens: 32000 (configurable)
Beta Features: claude-code-20250219, interleaved-thinking-2025-05-14, fine-grained-tool-streaming-2025-05-14
```

---

## Request Structure

### HTTP Headers

Claude Code sends comprehensive metadata in every request:

```json
{
  "accept": "application/json",
  "accept-encoding": "gzip, deflate, br, zstd",
  "anthropic-beta": "claude-code-20250219,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14",
  "anthropic-dangerous-direct-browser-access": "true",
  "anthropic-version": "2023-06-01",
  "content-type": "application/json",
  "user-agent": "claude-cli/2.0.36 (external, cli)",
  "x-api-key": "sk-ant-api03-...",
  "x-app": "cli",
  "x-stainless-arch": "arm64",
  "x-stainless-helper-method": "stream",
  "x-stainless-lang": "js",
  "x-stainless-os": "MacOS",
  "x-stainless-package-version": "0.68.0",
  "x-stainless-retry-count": "0",
  "x-stainless-runtime": "node",
  "x-stainless-runtime-version": "v24.3.0",
  "x-stainless-timeout": "600"
}
```

#### Critical Headers

| Header | Purpose | Example Value |
|--------|---------|---------------|
| `anthropic-beta` | Enable beta features | `claude-code-20250219,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14` |
| `anthropic-version` | API version | `2023-06-01` |
| `x-api-key` | Authentication | `sk-ant-api03-...` |
| `x-stainless-timeout` | Request timeout (seconds) | `600` |
| `x-stainless-helper-method` | Streaming flag | `stream` |

### Request Body Structure

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "<system-reminder>...CLAUDE.md content...</system-reminder>",
          "cache_control": { "type": "ephemeral" }
        },
        {
          "type": "text",
          "text": "User's actual query",
          "cache_control": { "type": "ephemeral" }
        }
      ]
    }
  ],
  "system": [
    {
      "type": "text",
      "text": "You are Claude Code, Anthropic's official CLI...",
      "cache_control": { "type": "ephemeral" }
    },
    {
      "type": "text",
      "text": "Agent-specific instructions and environment info...",
      "cache_control": { "type": "ephemeral" }
    }
  ],
  "tools": [...],  // Array of 80+ tool definitions
  "metadata": {
    "user_id": "user_f925af13bf4d0fe65c090d75dbee55fca59693b4c4cbeb48994578dda58eb051_account__session_5faaad4e-780f-4f05-b320-49a85727901b"
  },
  "max_tokens": 32000,
  "stream": true
}
```

### Message Content Types

#### 1. Text Block (Standard)

```json
{
  "type": "text",
  "text": "Content here"
}
```

#### 2. Text Block with Caching

```json
{
  "type": "text",
  "text": "Large content to cache",
  "cache_control": {
    "type": "ephemeral"
  }
}
```

#### 3. Tool Result Block

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01ABC123",
  "content": "Tool execution result"
}
```

#### 4. System Reminder Block

```json
{
  "type": "text",
  "text": "<system-reminder>\n# Context\nProject-specific information...\n</system-reminder>",
  "cache_control": { "type": "ephemeral" }
}
```

---

## Multi-Call Pattern

Claude Code makes **multiple sequential API calls** for each user request:

### Call Sequence

```
User Request
    ↓
┌─────────────────────────────────────┐
│ Call 1: Warmup (Haiku 4.5)         │
│ - Fast, cheap model                 │
│ - Context loading                   │
│ - No tools                          │
│ - Returns planning/warmup info      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Call 2: Main Execution (Sonnet 4.5)│
│ - Primary model                     │
│ - Full tool definitions (80+)      │
│ - Can execute tools                 │
│ - Returns response or tool calls    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Call 3+: Tool Results (if needed)  │
│ - Contains tool_result blocks       │
│ - Continues conversation            │
│ - May trigger more tool calls       │
└─────────────────────────────────────┘
```

### Call 1: Warmup Phase

**Purpose:** Fast context loading and preparation

**Model:** `claude-haiku-4-5-20251001` (fast, cheap)

**Characteristics:**
- ✅ System prompts included
- ✅ Project context (CLAUDE.md)
- ✅ Agent instructions
- ❌ No tools
- ❌ No actual execution

**Request Size:** ~20-50 KB

**Example:**
```json
{
  "model": "claude-haiku-4-5-20251001",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "<system-reminder>...project context...</system-reminder>",
          "cache_control": { "type": "ephemeral" }
        },
        {
          "type": "text",
          "text": "Warmup",
          "cache_control": { "type": "ephemeral" }
        }
      ]
    }
  ],
  "system": [...],
  "tools": [],  // NO TOOLS
  "max_tokens": 32000,
  "stream": true
}
```

### Call 2: Main Execution

**Purpose:** Actual task execution with tools

**Model:** `claude-sonnet-4-5-20250929` (powerful)

**Characteristics:**
- ✅ System prompts (cached from Call 1)
- ✅ Project context (cached from Call 1)
- ✅ Agent instructions (cached from Call 1)
- ✅ Full tool definitions (80+ tools)
- ✅ Can execute tools
- ✅ User's actual query

**Request Size:** ~70-100 KB (due to tool definitions)

**Example:**
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "<system-reminder>...same as Call 1...</system-reminder>",
          "cache_control": { "type": "ephemeral" }
        },
        {
          "type": "text",
          "text": "What is 2+2?",
          "cache_control": { "type": "ephemeral" }
        }
      ]
    }
  ],
  "system": [...],  // Same as Call 1
  "tools": [
    {
      "name": "Task",
      "description": "Launch specialized agents...",
      "input_schema": {...}
    },
    {
      "name": "Bash",
      "description": "Execute shell commands...",
      "input_schema": {...}
    },
    // ... 80+ more tools
  ],
  "max_tokens": 32000,
  "stream": true
}
```

### Call 3+: Tool Execution Loop

**Purpose:** Continue conversation with tool results

**Model:** Same as Call 2 (Sonnet 4.5)

**Pattern:**
```
1. Model responds with tool_use blocks
2. Claude Code executes tools
3. Claude Code sends tool_result blocks
4. Model processes results
5. Repeat if more tools needed
```

**Example Request with Tool Results:**
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "messages": [
    {
      "role": "user",
      "content": [...]  // Original query
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "tool_use",
          "id": "toolu_01ABC123",
          "name": "Read",
          "input": {
            "file_path": "/path/to/file.ts"
          }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_01ABC123",
          "content": "// File contents here..."
        }
      ]
    }
  ],
  "system": [...],
  "tools": [...],
  "max_tokens": 32000,
  "stream": true
}
```

---

## Streaming Protocol

### Overview

Claude Code **ALWAYS** uses streaming (`stream: true`). Responses are Server-Sent Events (SSE).

### SSE Format

```
event: message_start
data: {"type":"message_start","message":{...}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{...}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{...}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{...},"usage":{...}}

event: message_stop
data: {"type":"message_stop"}
```

### Event Types

#### 1. `message_start`

**When:** First event in stream

**Purpose:** Initialize message metadata

**Example:**
```json
{
  "type": "message_start",
  "message": {
    "id": "msg_01ABC123",
    "type": "message",
    "role": "assistant",
    "content": [],
    "model": "claude-sonnet-4-5-20250929",
    "stop_reason": null,
    "stop_sequence": null,
    "usage": {
      "input_tokens": 1234,
      "cache_creation_input_tokens": 0,
      "cache_read_input_tokens": 5000,
      "output_tokens": 0
    }
  }
}
```

**Key Fields:**
- `id` - Unique message ID (format: `msg_XXXXX`)
- `usage.cache_read_input_tokens` - Tokens read from cache
- `usage.cache_creation_input_tokens` - Tokens written to cache

#### 2. `content_block_start`

**When:** Starting a new content block (text or tool_use)

**Purpose:** Declare block type and metadata

**Example (Text Block):**
```json
{
  "type": "content_block_start",
  "index": 0,
  "content_block": {
    "type": "text",
    "text": ""
  }
}
```

**Example (Tool Use Block):**
```json
{
  "type": "content_block_start",
  "index": 1,
  "content_block": {
    "type": "tool_use",
    "id": "toolu_01ABC123",
    "name": "Read",
    "input": {}
  }
}
```

#### 3. `content_block_delta`

**When:** Streaming content within a block

**Purpose:** Incrementally send text or tool input

**Example (Text Delta):**
```json
{
  "type": "content_block_delta",
  "index": 0,
  "delta": {
    "type": "text_delta",
    "text": "The answer is "
  }
}
```

**Example (Tool Input Delta):**
```json
{
  "type": "content_block_delta",
  "index": 1,
  "delta": {
    "type": "input_json_delta",
    "partial_json": "{\"file_path\":\"/path/"
  }
}
```

**Note:** Tool inputs are streamed as partial JSON strings that must be concatenated.

#### 4. `ping`

**When:** Periodically during long streams

**Purpose:** Keep connection alive

**Example:**
```json
{
  "type": "ping"
}
```

#### 5. `content_block_stop`

**When:** Finishing a content block

**Purpose:** Signal block completion

**Example:**
```json
{
  "type": "content_block_stop",
  "index": 0
}
```

#### 6. `message_delta`

**When:** Message metadata updates (usually at end)

**Purpose:** Provide stop_reason and final usage

**Example:**
```json
{
  "type": "message_delta",
  "delta": {
    "stop_reason": "end_turn",
    "stop_sequence": null
  },
  "usage": {
    "output_tokens": 145
  }
}
```

**Stop Reasons:**
- `end_turn` - Normal completion
- `max_tokens` - Hit token limit
- `tool_use` - Waiting for tool execution
- `stop_sequence` - Hit stop sequence

#### 7. `message_stop`

**When:** Final event in stream

**Purpose:** Signal stream completion

**Example:**
```json
{
  "type": "message_stop"
}
```

### Complete Streaming Sequence

#### Example 1: Simple Text Response

```
event: message_start
data: {"type":"message_start","message":{"id":"msg_01ABC","role":"assistant",...}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: ping
data: {"type":"ping"}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"2"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" + "}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"2"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" equals "}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"4"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":12}}

event: message_stop
data: {"type":"message_stop"}
```

#### Example 2: Tool Use Response

```
event: message_start
data: {"type":"message_start",...}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"I'll read the file."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: content_block_start
data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_01ABC","name":"Read","input":{}}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\"file"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"_path\":\"/Users/jack/"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"test.ts\"}"}}

event: content_block_stop
data: {"type":"content_block_stop","index":1}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"tool_use"},"usage":{"output_tokens":87}}

event: message_stop
data: {"type":"message_stop"}
```

---

## Thinking Mode

### Overview

**Feature:** `interleaved-thinking-2025-05-14`

Thinking mode allows the model to include internal reasoning blocks in responses.

### Thinking Block Structure

**NOT YET OBSERVED IN LOGS** - Placeholder for when we capture it.

Expected format based on beta feature:

```json
{
  "type": "thinking",
  "thinking": "Internal reasoning here..."
}
```

Expected in streaming:

```
event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"thinking"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"Let me think..."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: content_block_start
data: {"type":"content_block_start","index":1,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"Based on my analysis..."}}

...
```

### Interleaved Pattern

Thinking blocks appear **before** text/tool blocks:

```
[thinking] → [text]
[thinking] → [tool_use]
[thinking] → [thinking] → [text]
```

**To capture:** Need to run monitor mode with tasks that trigger extended reasoning.

---

## Tool Call Protocol

### Tool Definition Format

Each tool has complete JSON Schema:

```json
{
  "name": "Read",
  "description": "Reads a file from the local filesystem...",
  "input_schema": {
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string",
        "description": "The absolute path to the file to read"
      },
      "limit": {
        "type": "number",
        "description": "The number of lines to read..."
      },
      "offset": {
        "type": "number",
        "description": "The line number to start reading from..."
      }
    },
    "required": ["file_path"],
    "additionalProperties": false,
    "$schema": "http://json-schema.org/draft-07/schema#"
  }
}
```

### Available Tools

Claude Code provides **16 core tools**:

1. **Task** - Launch specialized agents
2. **Bash** - Execute shell commands
3. **Glob** - File pattern matching
4. **Grep** - Content search
5. **ExitPlanMode** - Exit planning mode
6. **Read** - Read files
7. **Edit** - Edit files
8. **Write** - Write files
9. **NotebookEdit** - Edit Jupyter notebooks
10. **WebFetch** - Fetch web content
11. **TodoWrite** - Manage task list
12. **WebSearch** - Search the web
13. **BashOutput** - Get background shell output
14. **KillShell** - Kill background shell
15. **Skill** - Execute skills
16. **SlashCommand** - Execute slash commands

### Tool Use Request (from Model)

```json
{
  "type": "tool_use",
  "id": "toolu_01ABC123XYZ",
  "name": "Read",
  "input": {
    "file_path": "/Users/jack/test.ts"
  }
}
```

**Key Fields:**
- `id` - Unique tool call ID (format: `toolu_XXXXX`)
- `name` - Tool name (must match definition)
- `input` - Tool parameters (validated against schema)

### Tool Result Response (from Claude Code)

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01ABC123XYZ",
  "content": "const x = 42;\nfunction test() {\n  return x;\n}"
}
```

**Key Fields:**
- `tool_use_id` - References original tool_use.id
- `content` - Tool execution result (string or JSON)

### Tool Error Response

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01ABC123XYZ",
  "content": "Error: File not found",
  "is_error": true
}
```

### Fine-Grained Tool Streaming

**Feature:** `fine-grained-tool-streaming-2025-05-14`

Tool inputs are streamed incrementally as partial JSON:

```
event: content_block_start
data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_01ABC","name":"Read","input":{}}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\"file"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"_path\":\""}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"/Users/jack/test.ts\"}"}}

event: content_block_stop
data: {"type":"content_block_stop","index":1}
```

**Reconstructing Input:**
```javascript
let input = "";
// For each delta event:
input += delta.partial_json;
// Final: input = "{\"file_path\":\"/Users/jack/test.ts\"}"
const params = JSON.parse(input);
```

---

## Prompt Caching

### Overview

Claude Code uses **extensive prompt caching** to reduce costs and latency.

### Cache Control Format

```json
{
  "type": "text",
  "text": "Large content to cache",
  "cache_control": {
    "type": "ephemeral"
  }
}
```

### What Gets Cached

1. **System Prompts** - Agent instructions
2. **Project Context** - CLAUDE.md contents
3. **Tool Definitions** - All 80+ tools
4. **User Messages** - Some user inputs

### Cache Lifecycle

- **Type:** Ephemeral (5 minutes TTL)
- **Scope:** Per user, per conversation
- **Hit Rate:** Very high on subsequent calls

### Cache Usage Metrics

From `message_start` event:

```json
{
  "usage": {
    "input_tokens": 1234,
    "cache_creation_input_tokens": 8500,  // Tokens written to cache (Call 1)
    "cache_read_input_tokens": 8500,      // Tokens read from cache (Call 2+)
    "output_tokens": 0
  }
}
```

**Cost Impact:**
- Writing to cache: 1.25x input cost
- Reading from cache: 0.1x input cost (90% savings!)

### Caching Strategy

```
Call 1 (Warmup):
- Creates cache with system prompts + context
- cache_creation_input_tokens: ~8500

Call 2 (Main):
- Reads from cache
- cache_read_input_tokens: ~8500
- Adds tool definitions (not cached initially)

Call 3+ (Tool Results):
- Reads from cache
- cache_read_input_tokens: ~8500
- Only tool results are new tokens
```

**Total Token Savings:**
```
Without caching: 8500 tokens * 3 calls = 25,500 tokens input
With caching: 8500 + (8500 * 0.1 * 2) = 10,200 effective tokens
Savings: 60% reduction in input costs
```

---

## Beta Features

### Required Beta Header

```
anthropic-beta: claude-code-20250219,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14
```

### Feature Breakdown

#### 1. `claude-code-20250219`

**Purpose:** Claude Code-specific features

**Enables:**
- Enhanced tool calling
- CLI-specific optimizations
- Agent framework support

#### 2. `interleaved-thinking-2025-05-14`

**Purpose:** Thinking mode (extended reasoning)

**Enables:**
- Thinking blocks in responses
- Internal reasoning visible to user
- Better complex problem solving

**Block Types:**
- `thinking` - Internal reasoning
- `text` - Final answer

**Pattern:**
```
<thinking>Analyzing the problem...</thinking>
<text>Here's my solution...</text>
```

#### 3. `fine-grained-tool-streaming-2025-05-14`

**Purpose:** Stream tool inputs incrementally

**Enables:**
- `input_json_delta` events
- Progressive tool parameter revelation
- Better UX for slow tool calls

**Without:** Tool inputs appear only when complete
**With:** Tool inputs stream character by character

---

## Complete Examples

### Example 1: Simple Query (No Tools)

**User Request:** "What is 2+2?"

**Call 1: Warmup**
```json
POST /v1/messages
{
  "model": "claude-haiku-4-5-20251001",
  "messages": [{
    "role": "user",
    "content": [{
      "type": "text",
      "text": "<system-reminder>...CLAUDE.md...</system-reminder>",
      "cache_control": {"type": "ephemeral"}
    }, {
      "type": "text",
      "text": "Warmup",
      "cache_control": {"type": "ephemeral"}
    }]
  }],
  "system": [...],
  "max_tokens": 32000,
  "stream": true
}
```

**Response:** Authentication error (in our logs - API key was placeholder)

**Call 2: Main Execution**
```json
POST /v1/messages
{
  "model": "claude-sonnet-4-5-20250929",
  "messages": [{
    "role": "user",
    "content": [{
      "type": "text",
      "text": "<system-reminder>...CLAUDE.md...</system-reminder>",
      "cache_control": {"type": "ephemeral"}
    }, {
      "type": "text",
      "text": "What is 2+2?",
      "cache_control": {"type": "ephemeral"}
    }]
  }],
  "system": [...],
  "tools": [...],  // 80+ tools
  "max_tokens": 32000,
  "stream": true
}
```

**Expected Response Stream:**
```
event: message_start
data: {"type":"message_start","message":{"id":"msg_01ABC",...}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"2 + 2 equals 4."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":8}}

event: message_stop
data: {"type":"message_stop"}
```

### Example 2: Tool Use (Read File)

**User Request:** "Read package.json and tell me the version"

**Call 2: Main Execution** (after warmup)
```json
POST /v1/messages
{
  "model": "claude-sonnet-4-5-20250929",
  "messages": [{
    "role": "user",
    "content": [{
      "type": "text",
      "text": "Read package.json and tell me the version"
    }]
  }],
  "tools": [...],
  "max_tokens": 32000,
  "stream": true
}
```

**Response Stream (Tool Call):**
```
event: message_start
data: {"type":"message_start",...}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"I'll read the package.json file."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: content_block_start
data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_01ABC123","name":"Read","input":{}}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\"file_path\":\"/Users/jack/mag/claude-code/mcp/claudish/package.json\"}"}}

event: content_block_stop
data: {"type":"content_block_stop","index":1}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"tool_use"},"usage":{"output_tokens":45}}

event: message_stop
data: {"type":"message_stop"}
```

**Call 3: Tool Result**
```json
POST /v1/messages
{
  "model": "claude-sonnet-4-5-20250929",
  "messages": [{
    "role": "user",
    "content": [{"type": "text", "text": "Read package.json and tell me the version"}]
  }, {
    "role": "assistant",
    "content": [{
      "type": "tool_use",
      "id": "toolu_01ABC123",
      "name": "Read",
      "input": {"file_path": "/Users/jack/mag/claude-code/mcp/claudish/package.json"}
    }]
  }, {
    "role": "user",
    "content": [{
      "type": "tool_result",
      "tool_use_id": "toolu_01ABC123",
      "content": "{\"name\":\"claudish\",\"version\":\"1.0.8\",...}"
    }]
  }],
  "tools": [...],
  "max_tokens": 32000,
  "stream": true
}
```

**Response Stream (Final Answer):**
```
event: message_start
data: {"type":"message_start",...}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"The version is 1.0.8."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":10}}

event: message_stop
data: {"type":"message_stop"}
```

---

## Summary

### Key Takeaways

1. **Always Streaming** - No non-streaming mode exists
2. **Multi-Call Pattern** - Warmup → Main → Tool Loop
3. **Extensive Caching** - 60%+ cost savings
4. **Beta Features Required** - claude-code-20250219, thinking, tool streaming
5. **Fine-Grained Streaming** - Even tool inputs stream incrementally
6. **16 Core Tools** - Task, Bash, Read, Edit, Write, etc.
7. **Thinking Mode** - Supported but not yet observed in simple queries
8. **Robust Error Handling** - Authentication errors gracefully handled

### For Proxy Implementers

**Must Support:**
- ✅ Server-Sent Events (SSE) streaming
- ✅ All beta features in header
- ✅ Prompt caching (ephemeral)
- ✅ Multi-turn conversations
- ✅ Tool calling protocol
- ✅ Fine-grained tool streaming
- ✅ 600s timeout minimum
- ✅ 32000 max_tokens default

**Nice to Have:**
- ⭐ Thinking mode block recognition
- ⭐ Cache analytics
- ⭐ Request/response logging
- ⭐ Token usage tracking

---

**Last Updated:** 2025-11-10
**Based On:** Monitor mode logs from Claudish v1.0.8
**Status:** ⚠️ **INCOMPLETE** - Need streaming response capture with real API key

**TODO:**
- [ ] Capture actual streaming responses
- [ ] Document thinking mode blocks in detail
- [ ] Test multi-tool sequences
- [ ] Document error response formats
- [ ] Add timing/latency metrics

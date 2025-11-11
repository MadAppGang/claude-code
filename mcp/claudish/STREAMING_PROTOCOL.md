# Claudish Streaming Protocol Documentation

## Overview

Claudish implements the Anthropic Messages API streaming protocol to translate between OpenRouter/various model APIs and Claude Code's expected format. This document details the streaming event sequence, content block types, and how thinking/reasoning content is handled.

## Anthropic Messages API Streaming Specification

### Core Concepts

1. **Server-Sent Events (SSE)**: Stream uses SSE format with `event:` and `data:` lines
2. **Content Blocks**: Responses are composed of multiple content blocks (thinking, text, tool_use)
3. **Sequential Indices**: Each content block gets a unique sequential index (0, 1, 2, ...)
4. **Block Lifecycle**: Each block follows start → delta(s) → stop pattern

### Event Types

#### Session Events
- `message_start`: Initial event with message metadata and usage
- `message_delta`: Updates to message (stop_reason, final usage)
- `message_stop`: End of message
- `ping`: Keep-alive events

#### Content Block Events
- `content_block_start`: Begin new content block (thinking, text, or tool_use)
- `content_block_delta`: Stream content into current block
- `content_block_stop`: Close content block

### ⚠️ CRITICAL: Event Order Requirements

**The Anthropic Messages API has STRICT event ordering requirements:**

```
message_start
→ content_block_start (MUST BE IMMEDIATE!)
→ ping
→ content_block_delta...
```

**❌ WRONG - This breaks Claude Code UI:**
```
message_start
→ ping (sent before content block exists!)
→ [wait for data...]
→ content_block_start (too late!)
```

**Why This Matters:**
1. Claude Code expects a content block to exist before ping
2. The UI initializes message structure from content_block_start
3. Delaying content_block_start breaks message headers/structure
4. Results in missing UI elements and broken display

**Implementation Rule:**
- ✅ **ALWAYS** send `content_block_start` immediately after `message_start`
- ✅ **THEN** send `ping`
- ✅ **THEN** stream deltas
- ❌ **NEVER** delay content_block_start until first delta arrives

**Handling Reasoning Models:**
1. Send initial `content_block_start` (text, index=0) for protocol compliance
2. If reasoning arrives, close index 0 immediately
3. Open thinking block (index=1)
4. After thinking, open new text block (index=2)

See `PROTOCOL_FIX_V2.md` for detailed explanation.

---

## Complete Streaming Sequence

### Standard Response (No Thinking)

```
1. message_start
   - Contains: id, model, role, usage (input_tokens, cache stats)

2. content_block_start (text, index=0)  ← IMMEDIATE after message_start!
   - content_block: { type: "text", text: "" }

3. ping  ← AFTER content block starts
   - Keep-alive to prevent connection timeout

4. content_block_delta × N (text_delta)
   - delta: { type: "text_delta", text: "content..." }

5. content_block_stop (index=0)

6. message_delta
   - delta: { stop_reason: "end_turn" }
   - usage: { output_tokens: N }

7. message_stop
```

### Response With Thinking (e.g., Grok, o1)

**V2 Implementation:** Always create initial text block for protocol compliance, close if reasoning arrives.

```
1. message_start
   - usage: { input_tokens, cache_creation_input_tokens, ... }

2. content_block_start (text, index=0)  ← Initial block (protocol compliance)
   - content_block: { type: "text", text: "" }

3. ping

4. [Reasoning arrives] content_block_stop (index=0)  ← Close initial block
   - Initial text block immediately closed

5. content_block_start (thinking, index=1)  ← CRITICAL
   - content_block: {
       type: "thinking",
       thinking: "",
       signature: ""
     }

6. content_block_delta × N (thinking_delta)  ← Uses thinking_delta!
   - delta: { type: "thinking_delta", thinking: "reasoning..." }

7. content_block_stop (index=1)
   - Closes thinking block

8. content_block_start (text, index=2)  ← NEW text block (not reusing index 0)
   - content_block: { type: "text", text: "" }

9. content_block_delta × M (text_delta)
   - delta: { type: "text_delta", text: "response..." }

10. content_block_stop (index=2)

11. message_delta
    - stop_reason, final usage

12. message_stop
```

### Response With Tool Calls

```
1. message_start
2. ping
3. content_block_start (text, index=0)
4. content_block_delta × N (text_delta)
5. content_block_stop (index=0)

6. content_block_start (tool_use, index=1)  ← Tool block
   - content_block: {
       type: "tool_use",
       id: "toolu_xxx",
       name: "ToolName"
     }

7. content_block_delta × K (input_json_delta)  ← Tool arguments
   - delta: {
       type: "input_json_delta",
       partial_json: "{\"param\":..."
     }

8. content_block_stop (index=1)

9. message_delta
   - stop_reason: "tool_use"  ← Different stop reason

10. message_stop
```

### Complex Response (Thinking + Text + Tools)

```
Sequence:
1. message_start
2. ping
3. Thinking block (index=0)
   - content_block_start (thinking)
   - thinking_delta × N
   - content_block_stop

4. Text block (index=1)
   - content_block_start (text)
   - text_delta × M
   - content_block_stop

5. Tool block 1 (index=2)
   - content_block_start (tool_use)
   - input_json_delta × K
   - content_block_stop

6. Tool block 2 (index=3)
   - content_block_start (tool_use)
   - input_json_delta × J
   - content_block_stop

7. message_delta
8. message_stop
```

---

## Content Block Types

### 1. Thinking Block

**Purpose**: Contains model's internal reasoning process (not final output)

**Start Event:**
```json
{
  "type": "content_block_start",
  "index": 0,
  "content_block": {
    "type": "thinking",
    "thinking": "",
    "signature": ""
  }
}
```

**Delta Event:**
```json
{
  "type": "content_block_delta",
  "index": 0,
  "delta": {
    "type": "thinking_delta",
    "thinking": "Let me analyze this step by step..."
  }
}
```

**Stop Event:**
```json
{
  "type": "content_block_stop",
  "index": 0
}
```

**UI Behavior:**
- Claude Code typically collapses/hides thinking content
- Shows "Claude is thinking..." indicator
- User can expand to see reasoning

### 2. Text Block

**Purpose**: Contains actual response text (final output)

**Start Event:**
```json
{
  "type": "content_block_start",
  "index": 1,
  "content_block": {
    "type": "text",
    "text": ""
  }
}
```

**Delta Event:**
```json
{
  "type": "content_block_delta",
  "index": 1,
  "delta": {
    "type": "text_delta",
    "text": "Here's my response..."
  }
}
```

**Stop Event:**
```json
{
  "type": "content_block_stop",
  "index": 1
}
```

**UI Behavior:**
- Displayed as main response
- Streams incrementally
- Fully visible to user

### 3. Tool Use Block

**Purpose**: Contains tool/function call request

**Start Event:**
```json
{
  "type": "content_block_start",
  "index": 2,
  "content_block": {
    "type": "tool_use",
    "id": "toolu_01abc123",
    "name": "get_weather"
  }
}
```

**Delta Event:**
```json
{
  "type": "content_block_delta",
  "index": 2,
  "delta": {
    "type": "input_json_delta",
    "partial_json": "{\"location\":\"San Francisco\",\"unit\":\"celsius\"}"
  }
}
```

**Stop Event:**
```json
{
  "type": "content_block_stop",
  "index": 2
}
```

**UI Behavior:**
- Shows tool being called
- Displays progress
- Waits for execution

---

## Delta Types by Block Type

| Block Type  | Delta Type          | Field Name   |
|-------------|---------------------|--------------|
| thinking    | thinking_delta      | thinking     |
| text        | text_delta          | text         |
| tool_use    | input_json_delta    | partial_json |

**CRITICAL**: Do NOT send `text_delta` for thinking blocks! This causes thinking content to be visible as regular text.

---

## Model-Specific Behavior

### OpenRouter Models

OpenRouter uses OpenAI's streaming format:
- `delta.content` → Regular response content
- `delta.reasoning` → Thinking/reasoning content (Grok, o1)
- `delta.tool_calls` → Tool call streaming

### Grok (xAI)

- Sends reasoning in `delta.reasoning` field
- May also have `reasoning_details` array
- `reasoning_details[].type === "reasoning.encrypted"` → Encrypted thinking
- Uses XML format for tool calls (handled by GrokAdapter)

### OpenAI o1

- Sends reasoning in `delta.reasoning` field
- Similar pattern to Grok

### Standard Models (GPT-4, Claude via OR, etc.)

- Only use `delta.content` (no reasoning)
- Should NOT create thinking blocks

---

## Claudish Implementation

### Translation Logic

```typescript
// 1. Separate reasoning from content (DO NOT MIX!)
const hasReasoning = !!delta?.reasoning;
const hasContent = !!delta?.content;
const reasoningText = delta?.reasoning || "";
const contentText = delta?.content || "";

// 2. Handle reasoning → thinking block
if (hasReasoning && reasoningText) {
  if (!reasoningBlockStarted) {
    // Create thinking block
    sendSSE("content_block_start", {
      type: "content_block_start",
      index: reasoningBlockIndex,
      content_block: {
        type: "thinking",
        thinking: "",
        signature: ""
      }
    });
    reasoningBlockStarted = true;
  }

  // Send thinking_delta
  sendSSE("content_block_delta", {
    type: "content_block_delta",
    index: reasoningBlockIndex,
    delta: {
      type: "thinking_delta",
      thinking: reasoningText
    }
  });
}

// 3. Handle transition: reasoning → content
if (reasoningBlockStarted && hasContent && !hasReasoning) {
  // Close thinking block
  sendSSE("content_block_stop", {
    type: "content_block_stop",
    index: reasoningBlockIndex
  });
  reasoningBlockStarted = false;
}

// 4. Handle content → text block
if (hasContent && contentText) {
  if (!textBlockStarted) {
    // Create text block
    sendSSE("content_block_start", {
      type: "content_block_start",
      index: textBlockIndex,
      content_block: {
        type: "text",
        text: ""
      }
    });
    textBlockStarted = true;
  }

  // Send text_delta
  sendSSE("content_block_delta", {
    type: "content_block_delta",
    index: textBlockIndex,
    delta: {
      type: "text_delta",
      text: contentText
    }
  });
}
```

### State Management

```typescript
// Track block indices
let currentBlockIndex = 0;          // Auto-increment for each new block
let textBlockIndex = -1;            // Index of text block (-1 = not created)
let reasoningBlockIndex = -1;       // Index of thinking block (-1 = not created)

// Track block state
let textBlockStarted = false;       // Is text block open?
let reasoningBlockStarted = false;  // Is thinking block open?
```

### Block Finalization

All open blocks MUST be closed on stream end:

```typescript
// Close thinking block if open
if (reasoningBlockStarted) {
  sendSSE("content_block_stop", {
    index: reasoningBlockIndex
  });
}

// Close text block if open
if (textBlockStarted) {
  sendSSE("content_block_stop", {
    index: textBlockIndex
  });
}

// Close tool blocks if open
for (const toolState of toolCalls.values()) {
  if (toolState.started && !toolState.closed) {
    sendSSE("content_block_stop", {
      index: toolState.blockIndex
    });
  }
}
```

---

## Common Issues & Solutions

### Issue #1: Thinking Content Visible in Output

**Symptom:** User sees reasoning text mixed with response

**Cause:** Sending thinking content as `text_delta` instead of `thinking_delta`

**Fix:** Separate `delta.reasoning` and `delta.content`, send to different blocks

```typescript
// ❌ WRONG
const textContent = delta?.content || delta?.reasoning || "";
sendSSE("content_block_delta", {
  delta: { type: "text_delta", text: textContent }
});

// ✅ CORRECT
if (delta?.reasoning) {
  sendSSE("content_block_delta", {
    index: reasoningBlockIndex,
    delta: { type: "thinking_delta", thinking: delta.reasoning }
  });
}
if (delta?.content) {
  sendSSE("content_block_delta", {
    index: textBlockIndex,
    delta: { type: "text_delta", text: delta.content }
  });
}
```

### Issue #2: Messages Update "All At Once"

**Symptom:** No incremental streaming, content appears in batches

**Cause:** Missing block boundaries, UI waits for `content_block_stop`

**Fix:** Ensure proper block lifecycle (start → deltas → stop)

### Issue #3: No Progress Indicators

**Symptom:** "Claude is thinking..." never shows, no running items

**Cause:** No thinking blocks created, or blocks never properly closed

**Fix:** Create thinking blocks for reasoning, close all blocks on completion

### Issue #4: Duplicate Block Events

**Symptom:** Multiple `content_block_start` with same index

**Cause:** Not tracking block state properly

**Fix:** Check `reasoningBlockStarted`/`textBlockStarted` before creating blocks

### Issue #5: Wrong Block Indices

**Symptom:** Claude Code rejects events, crashes, or shows wrong content

**Cause:** Non-sequential indices, gaps in sequence

**Fix:** Use `currentBlockIndex++` for each NEW block

```typescript
// ❌ WRONG
textBlockIndex = 0;
reasoningBlockIndex = 0;  // Collision!

// ✅ CORRECT
reasoningBlockIndex = currentBlockIndex++;  // 0
textBlockIndex = currentBlockIndex++;       // 1
toolBlockIndex = currentBlockIndex++;       // 2
```

---

## Testing Checklist

### Basic Streaming
- [ ] Text-only response streams correctly
- [ ] Multiple text deltas arrive incrementally
- [ ] Block index = 0 for first (and only) text block
- [ ] Proper start → delta(s) → stop sequence

### Thinking Support
- [ ] Reasoning creates thinking block (index=0)
- [ ] Thinking uses `thinking_delta` not `text_delta`
- [ ] Thinking block closed before text block starts
- [ ] Text block gets index=1 (after thinking)
- [ ] No thinking content visible in final output

### Transitions
- [ ] Reasoning → content transition clean
- [ ] Thinking block properly closed
- [ ] Text block created on first content
- [ ] No gap or overlap in indices

### Tool Calls
- [ ] Text block closed before tool blocks
- [ ] Tool blocks get sequential indices
- [ ] Tool arguments streamed as `input_json_delta`
- [ ] Multiple tools get unique indices

### Complex Scenarios
- [ ] Thinking + text + tools all in one response
- [ ] Indices: 0=thinking, 1=text, 2=tool1, 3=tool2
- [ ] All blocks properly closed
- [ ] No duplicate events
- [ ] Correct stop_reason

### Edge Cases
- [ ] Empty reasoning text handled
- [ ] Empty content text handled
- [ ] Encrypted reasoning handled
- [ ] Stream errors close all blocks
- [ ] User interruption (Ctrl+C) handled gracefully

---

## Debugging

### Enable Debug Logging

```bash
claudish --debug <model>
```

Logs written to: `logs/claudish_YYYY-MM-DD_HH-MM-SS.log`

### Key Log Patterns

**Thinking block creation:**
```
[Proxy] Started thinking block at index 0
```

**Thinking delta:**
```
[Thinking Delta] {
  "thinking": "Let me analyze...",
  "blockIndex": 0
}
```

**Transition:**
```
[Proxy] Closed thinking block at index 0, transitioning to content
[Proxy] Started text block at index 1
```

**Content delta:**
```
[Content Delta] {
  "text": "Here's my response",
  "blockIndex": 1
}
```

### Verification Commands

```bash
# Count thinking deltas
grep 'thinking_delta' logs/*.log | wc -l

# Count text deltas
grep 'text_delta' logs/*.log | wc -l

# Check block indices used
grep '"blockIndex":' logs/*.log | sort -u

# Check for block starts
grep 'content_block_start' logs/*.log | grep -o 'index":[0-9]*' | sort -u

# Look for issues
grep -i 'error\|warning\|duplicate' logs/*.log
```

---

## References

- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages-streaming)
- [Extended Thinking API](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking) (`anthropic-beta: interleaved-thinking-2025-05-14`)
- [OpenRouter Documentation](https://openrouter.ai/docs#streaming)
- [Grok API (xAI)](https://docs.x.ai/api)
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Claudish Version:** 1.1.0+
**Anthropic API Version:** 2023-06-01
**Extended Thinking Beta:** interleaved-thinking-2025-05-14

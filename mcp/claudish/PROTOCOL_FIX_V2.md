# Protocol Fix V2 - Immediate Block Start Required

## Issue Discovered

After implementing thinking blocks support, the UI was still broken showing:
1. Missing message structure/headers
2. Thinking content visible as regular output (not collapsed)

## Root Cause

**Critical Protocol Violation:** The Anthropic Messages API requires `content_block_start` **immediately** after `message_start`, **before** `ping`.

### What We Did Wrong (V1)

```typescript
sendSSE("message_start", { ... });

// ❌ REMOVED initial block creation - WRONG!
// "Let the dynamic logic create thinking or text block based on first delta"

sendSSE("ping", { ... });  // ← Ping sent BEFORE any content block!

// Wait for first delta to arrive...
// Then create thinking or text block
```

**This breaks the protocol!** Claude Code expects:
```
message_start
→ content_block_start (IMMEDIATELY!)
→ ping
→ content_block_delta...
```

But we were sending:
```
message_start
→ ping (wrong order!)
→ [wait for delta...]
→ content_block_start (too late!)
```

### Evidence from Native Claude Log

```
event: message_start
event: content_block_start  ← IMMEDIATELY after message_start
event: content_block_delta
event: ping  ← Ping comes AFTER content starts, not before
```

## The Fix (V2)

### Restore Initial Block Creation

```typescript
sendSSE("message_start", { ... });

// ✅ MUST send content_block_start IMMEDIATELY for protocol compliance
textBlockIndex = currentBlockIndex++;
sendSSE("content_block_start", {
  type: "content_block_start",
  index: textBlockIndex,
  content_block: {
    type: "text",
    text: "",
  },
});
textBlockStarted = true;

// Now send ping (correct order)
sendSSE("ping", {
  type: "ping",
});
```

### Handle Reasoning Arriving After Initial Block

The initial block is always a text block (for protocol compliance). If reasoning arrives first, we:

1. **Close the initial text block** (index 0)
2. **Open thinking block** (index 1)
3. **Stream thinking_delta** events
4. **Close thinking block**
5. **Open NEW text block** (index 2)
6. **Stream text_delta** events

**Code (lines 987-996):**
```typescript
if (!reasoningBlockStarted) {
  // Close initial text block if reasoning arrives first
  if (textBlockStarted) {
    sendSSE("content_block_stop", {
      type: "content_block_stop",
      index: textBlockIndex,
    });
    textBlockStarted = false;
    log(`[Proxy] Closed initial text block to start thinking block`);
  }

  // Start thinking block
  reasoningBlockIndex = currentBlockIndex++;
  sendSSE("content_block_start", {
    type: "content_block_start",
    index: reasoningBlockIndex,
    content_block: {
      type: "thinking",
      thinking: "",
      signature: ""
    },
  });
  reasoningBlockStarted = true;
}
```

## Event Sequences

### Scenario 1: Grok (with reasoning)

```
1. message_start
2. content_block_start (text, index=0)  ← Initial block (empty)
3. ping
4. [Reasoning delta arrives]
5. content_block_stop (index=0)         ← Close empty text block
6. content_block_start (thinking, index=1)
7. thinking_delta × 500
8. content_block_stop (index=1)
9. content_block_start (text, index=2)  ← New text block
10. text_delta × 200
11. content_block_stop (index=2)
12. message_delta
13. message_stop
```

**Block Index Sequence:** 0 (empty text) → 1 (thinking) → 2 (actual text)

### Scenario 2: GPT-4o (no reasoning)

```
1. message_start
2. content_block_start (text, index=0)  ← Initial block (used)
3. ping
4. [Content delta arrives]
5. text_delta × 200                     ← Uses index 0
6. content_block_stop (index=0)
7. message_delta
8. message_stop
```

**Block Index Sequence:** 0 (text only)

### Scenario 3: With Tool Calls

```
1. message_start
2. content_block_start (text, index=0)
3. ping
4. [Reasoning arrives]
5. content_block_stop (index=0)
6. content_block_start (thinking, index=1)
7. thinking_delta × N
8. content_block_stop (index=1)
9. content_block_start (text, index=2)
10. text_delta × M
11. content_block_stop (index=2)
12. content_block_start (tool_use, index=3)  ← Tool block
13. input_json_delta × K
14. content_block_stop (index=3)
15. content_block_start (tool_use, index=4)  ← Second tool
16. input_json_delta × J
17. content_block_stop (index=4)
18. message_delta
19. message_stop
```

**Block Index Sequence:** 0 (empty) → 1 (thinking) → 2 (text) → 3 (tool1) → 4 (tool2)

## Trade-offs

### Why Not Detect Model Type First?

We could check if the model supports reasoning (is Grok/o1) and only create thinking blocks initially for those models. However:

**Cons:**
- More complex logic
- Need to maintain model capability database
- Breaks with new reasoning models
- Race condition if detection is async

**Pros of Current Approach:**
- ✅ Simple and predictable
- ✅ Works with all models
- ✅ Protocol compliant
- ✅ Only one empty block (minimal overhead)
- ✅ Future-proof (works with new reasoning models)

The cost of one empty text block (immediately closed) is negligible compared to the complexity of model detection.

## Files Modified

1. **src/proxy-server.ts**
   - Line 859-871: Restored initial block creation
   - Line 987-996: Updated comment about closing initial block

## Testing

### Test Command

```bash
# Rebuild
bun run build

# Test with Grok (reasoning)
claudish --debug --model x-ai/grok-code-fast-1 "explain how auth works"

# Verify logs
grep -E "(message_start|content_block_start|ping)" logs/*.log | head -20
```

### Expected Log Sequence

```
message_start
content_block_start (text, index=0)
ping
content_block_stop (index=0)         ← If reasoning arrives
content_block_start (thinking, index=1)
thinking_delta × N
content_block_stop (index=1)
content_block_start (text, index=2)
text_delta × M
```

### Expected UI Behavior

✅ **Should now work:**
- Message structure/headers visible
- Thinking content collapsed (not visible as output)
- "Thinking..." indicator shows properly
- Smooth incremental streaming
- Tool calls display correctly

## Verification Commands

```bash
# Check initial block sequence
grep -A5 "message_start" logs/*.log | head -30

# Verify thinking blocks
grep "thinking_delta" logs/*.log | wc -l

# Verify text blocks
grep "text_delta" logs/*.log | wc -l

# Check block indices
grep "content_block_start" logs/*.log | grep -o '"index":[0-9]*' | sort -u
```

## Key Learnings

1. **Protocol compliance is strict** - Event order matters!
2. **Can't delay required events** - message_start + content_block_start must be immediate
3. **Empty blocks are OK** - Better than violating protocol
4. **Simple > Complex** - Creating/closing empty block is simpler than model detection

## References

- Anthropic Messages API: Event sequence requirements
- STREAMING_PROTOCOL.md: Complete protocol documentation
- Native Claude logs: `claudish_2025-11-11_10-28-09.log`
- Issue logs: `claudish_2025-11-11_10-50-14.log`

---

**Status:** ✅ **FIXED**
**Version:** v1.1.1
**Date:** 2025-11-11
**Lines Changed:** 15 lines
**Impact:** Critical protocol compliance fix

# Protocol Compliance Plan: Achieving 1:1 Claude Code Compatibility

**Goal**: Ensure Claudish proxy provides identical user experience to official Claude Code, regardless of which model is used.

**Status**: Testing framework complete ✅ | Proxy fixes pending ⏳

---

## Executive Summary

We have built a comprehensive snapshot testing system that captures real Claude Code protocol interactions and validates proxy responses. The current proxy implementation is **60-70% compliant** with critical gaps in streaming protocol, tool handling, and cache metrics.

### What's Complete ✅

1. **Monitor Mode** - Pass-through proxy with complete logging
2. **Fixture Capture** - Tool to extract test cases from monitor logs
3. **Snapshot Tests** - Automated validation of protocol compliance
4. **Protocol Validators** - Event sequence, block indices, tool streaming, usage, stop reasons
5. **Example Fixtures** - Documented examples for text and tool use
6. **Workflow Scripts** - End-to-end capture → test automation

### What's Pending ⏳

1. **Fix content block index management** (CRITICAL)
2. **Add tool input JSON validation** (CRITICAL)
3. **Implement continuous ping events** (MEDIUM)
4. **Add cache metrics emulation** (MEDIUM)
5. **Capture comprehensive fixture library** (20+ scenarios)
6. **Run full test suite and fix remaining issues**

---

## Testing System Architecture

```
╔══════════════════════════════════════════════════════════════╗
║                   MONITOR MODE (Capture)                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Run: ./dist/index.js --monitor "query"                  ║
║  2. Captures: Request + Response (SSE events)               ║
║  3. Logs: Complete Anthropic API traffic                    ║
║                                                              ║
║  Output: logs/capture_*.log                                 ║
╚══════════════════════════════════════════════════════════════╝
                           ↓
╔══════════════════════════════════════════════════════════════╗
║                FIXTURE GENERATION (Extract)                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Parse: bun tests/capture-fixture.ts logs/file.log       ║
║  2. Normalize: Dynamic values (IDs, timestamps)             ║
║  3. Analyze: Build assertions (blocks, sequence, usage)     ║
║                                                              ║
║  Output: tests/fixtures/*.json                              ║
╚══════════════════════════════════════════════════════════════╝
                           ↓
╔══════════════════════════════════════════════════════════════╗
║              SNAPSHOT TESTING (Validate)                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Replay: Request through proxy                           ║
║  2. Capture: Actual SSE response                            ║
║  3. Validate: Against captured fixture                      ║
║  4. Report: Pass/Fail with detailed errors                  ║
║                                                              ║
║  Run: bun test tests/snapshot.test.ts                       ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Protocol Requirements (From Analysis)

### Streaming Events (7 Types)

Claude Code **ALWAYS** uses streaming. Complete sequence:

1. **message_start** → Initialize message with usage
2. **content_block_start** → Begin text or tool block
3. **content_block_delta** → Stream content incrementally
4. **ping** → Keep-alive (every 15s)
5. **content_block_stop** → End content block
6. **message_delta** → Stop reason + final usage
7. **message_stop** → Stream complete

### Content Block Management

Blocks must have **sequential indices**:

```
Expected:  [text @ 0] [tool @ 1] [tool @ 2]
Current:   [text @ 0] [tool @ 0] [tool @ 1]  ❌ WRONG
```

### Fine-Grained Tool Streaming

Tool input must stream as partial JSON:

```json
// Chunk 1: {"event": "content_block_delta", "data": {"delta": {"partial_json": "{\"file"}}}
// Chunk 2: {"event": "content_block_delta", "data": {"delta": {"partial_json": "_path\":\"test.ts\""}}}
// Chunk 3: {"event": "content_block_delta", "data": {"delta": {"partial_json": "}"}}}
// Result:  {"file_path":"test.ts"} ✅ Valid JSON
```

### Usage Metrics

Must include cache metrics:

```json
{
  "usage": {
    "input_tokens": 150,
    "cache_creation_input_tokens": 5501,    // NEW
    "cache_read_input_tokens": 0,           // NEW
    "output_tokens": 50,
    "cache_creation": {                     // OPTIONAL
      "ephemeral_5m_input_tokens": 5501
    }
  }
}
```

### Required Headers

```
anthropic-version: 2023-06-01
anthropic-beta: oauth-2025-04-20,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14
```

---

## Critical Fixes Required

### 1. Content Block Index Management (CRITICAL)

**File**: `src/proxy-server.ts:600-850`

**Current Problem**:

```typescript
// Line 750 - Text block delta
sendSSE("content_block_delta", {
  index: 0,  // ❌ Hardcoded!
  delta: { type: "text_delta", text: delta.content }
});

// Line 787 - Text block stop
sendSSE("content_block_stop", {
  index: 0,  // ❌ Hardcoded!
});
```

**Fix Required**:

```typescript
// Initialize block tracking
let currentBlockIndex = 0;
let textBlockIndex = -1;
const toolBlocks = new Map<number, number>(); // toolIndex → blockIndex

// Start text block
textBlockIndex = currentBlockIndex++;
sendSSE("content_block_start", {
  index: textBlockIndex,
  content_block: { type: "text", text: "" }
});

// Text delta
sendSSE("content_block_delta", {
  index: textBlockIndex,  // ✅ Correct
  delta: { type: "text_delta", text: delta.content }
});

// Start tool block
const toolBlockIndex = currentBlockIndex++;
toolBlocks.set(toolIndex, toolBlockIndex);
sendSSE("content_block_start", {
  index: toolBlockIndex,  // ✅ Sequential
  content_block: { type: "tool_use", id: toolId, name: toolName }
});
```

**Impact**: HIGH - Claude Code may reject responses with incorrect indices

**Complexity**: MEDIUM - Need to track state across stream

---

### 2. Tool Input JSON Validation (CRITICAL)

**File**: `src/proxy-server.ts:829`

**Current Problem**:

```typescript
// Line 829 - Close tool block immediately
if (choice?.finish_reason === "tool_calls") {
  sendSSE("content_block_stop", {
    index: toolState.blockIndex  // No validation!
  });
}
```

**Fix Required**:

```typescript
// Validate JSON before closing
if (choice?.finish_reason === "tool_calls") {
  for (const [toolIndex, toolState] of toolCalls.entries()) {
    // Validate JSON is complete
    try {
      JSON.parse(toolState.args);
      log(`[Proxy] Tool ${toolState.name} arguments valid JSON`);
      sendSSE("content_block_stop", {
        index: toolState.blockIndex
      });
    } catch (e) {
      log(`[Proxy] WARNING: Tool ${toolState.name} has incomplete JSON!`);
      log(`[Proxy] Args so far: ${toolState.args}`);
      // Don't close block yet - wait for more chunks
    }
  }
}
```

**Impact**: HIGH - Malformed tool calls will fail execution

**Complexity**: LOW - Simple JSON.parse check

---

### 3. Continuous Ping Events (MEDIUM)

**File**: `src/proxy-server.ts:636`

**Current Problem**:

```typescript
// Line 636 - One ping at start
sendSSE("ping", {
  type: "ping",
});
// No more pings!
```

**Fix Required**:

```typescript
// Send ping every 15 seconds
const pingInterval = setInterval(() => {
  if (!isClosed) {
    sendSSE("ping", { type: "ping" });
  }
}, 15000);

// Clear interval when done
try {
  // ... streaming logic ...
} finally {
  clearInterval(pingInterval);
  if (!isClosed) {
    controller.close();
    isClosed = true;
  }
}
```

**Impact**: MEDIUM - Long streams may timeout without pings

**Complexity**: LOW - Simple setInterval

---

### 4. Cache Metrics Emulation (MEDIUM)

**File**: `src/proxy-server.ts:614`

**Current Problem**:

```typescript
// Line 614 - Missing cache fields
usage: {
  input_tokens: 0,
  cache_creation_input_tokens: 0,  // Present but always 0
  cache_read_input_tokens: 0,      // Present but always 0
  output_tokens: 0
}
```

**Fix Required**:

```typescript
// Estimate cache metrics from multi-turn conversations
// First turn: All tokens go to cache_creation
// Subsequent turns: Most tokens come from cache_read

let isFirstTurn = /* detect from conversation history */;
let estimatedCacheTokens = Math.floor(inputTokens * 0.8);

usage: {
  input_tokens: inputTokens,
  cache_creation_input_tokens: isFirstTurn ? estimatedCacheTokens : 0,
  cache_read_input_tokens: isFirstTurn ? 0 : estimatedCacheTokens,
  output_tokens: outputTokens,
  cache_creation: {
    ephemeral_5m_input_tokens: isFirstTurn ? estimatedCacheTokens : 0
  }
}
```

**Impact**: MEDIUM - Inaccurate cost tracking in Claude Code UI

**Complexity**: MEDIUM - Need conversation state tracking

---

### 5. Stop Reason Validation (LOW)

**File**: `src/proxy-server.ts:695`

**Current Check**:

```typescript
// Line 695 - Basic mapping exists
stop_reason: "end_turn",  // From mapStopReason()
```

**Verify Mapping**:

```typescript
function mapStopReason(finishReason: string | undefined): string {
  switch (finishReason) {
    case "stop":       return "end_turn";     // ✅
    case "length":     return "max_tokens";   // ✅
    case "tool_calls": return "tool_use";     // ✅
    case "content_filter": return "stop_sequence"; // ⚠️ Not quite right
    default:           return "end_turn";     // ✅ Safe fallback
  }
}
```

**Impact**: LOW - Already mostly correct

**Complexity**: LOW - Verify edge cases

---

## Testing Workflow

### Phase 1: Capture Fixtures (2-3 hours)

Capture comprehensive test cases:

```bash
# Build
bun run build

# Capture scenarios
./tests/snapshot-workflow.sh --capture
```

**Scenarios to Capture** (20+ fixtures):

- [x] Simple text (2+2)
- [ ] Long text (explain quantum physics)
- [ ] Read file
- [ ] Grep search
- [ ] Glob pattern
- [ ] Write file
- [ ] Edit file
- [ ] Bash command
- [ ] Multi-tool (Read + Edit)
- [ ] Tool with error
- [ ] Multi-turn conversation
- [ ] All 16 official tools
- [ ] Thinking mode (if supported)
- [ ] Max tokens reached
- [ ] Content filter

### Phase 2: Run Baseline Tests (30 mins)

Run tests to identify failures:

```bash
bun test tests/snapshot.test.ts --verbose > test-results.txt 2>&1
```

**Expected Failures** (before fixes):
- ❌ Content block indices
- ❌ Tool JSON validation
- ⚠️  Ping events (may pass if short)
- ⚠️  Cache metrics (present but zero)

### Phase 3: Fix Proxy (1-2 days)

Implement fixes in order:

1. **Day 1 Morning**: Fix content block indices
2. **Day 1 Afternoon**: Add tool JSON validation
3. **Day 2 Morning**: Add continuous ping events
4. **Day 2 Afternoon**: Add cache metrics estimation

### Phase 4: Validate (1-2 hours)

Re-run tests after each fix:

```bash
# After each fix
bun test tests/snapshot.test.ts

# Expected progression:
# After fix #1: 70-80% pass
# After fix #2: 85-90% pass
# After fix #3: 90-95% pass
# After fix #4: 95-100% pass
```

### Phase 5: Integration Testing (2-3 hours)

Test with real Claude Code:

```bash
# Start proxy
./dist/index.js --model "anthropic/claude-sonnet-4.5"

# In another terminal, use real Claude Code
# Point it to localhost:8337
# Perform various tasks

# Validate:
# - No errors in Claude Code UI
# - Tools execute correctly
# - Multi-turn conversations work
# - Cost tracking accurate
```

---

## Success Criteria

For 1:1 compatibility:

- ✅ **100% test coverage** for critical paths
- ✅ **All snapshot tests pass**
- ✅ **Event sequences match** protocol spec
- ✅ **Block indices sequential** (0, 1, 2, ...)
- ✅ **Tool JSON validates** before block close
- ✅ **Ping events sent** every 15 seconds
- ✅ **Cache metrics present** (even if estimated)
- ✅ **Stop reason valid** in all cases
- ✅ **No Claude Code errors** in real usage
- ✅ **Multi-turn works** perfectly

---

## Risk Mitigation

### If OpenRouter Models Don't Support Feature X

**Problem**: Model doesn't provide thinking mode, cache metrics, etc.

**Solution**: Implement graceful degradation

```typescript
// Example: Thinking mode emulation
if (modelSupportsThinking(model)) {
  // Use real thinking blocks
} else {
  // Convert to text blocks with prefix
  sendSSE("content_block_delta", {
    index: textBlockIndex,
    delta: {
      type: "text_delta",
      text: "[Thinking: " + thinkingContent + "]\n\n"
    }
  });
}
```

### If Tests Fail on Specific Models

**Problem**: Model behaves differently than Claude

**Solution**: Model-specific adapters

```typescript
// tests/model-adapters.ts
export const modelAdapters = {
  "openai/gpt-4": {
    // GPT-4 specific quirks
    requiresSpecialToolFormat: true,
    maxToolsPerCall: 5
  },
  "anthropic/claude-sonnet-4.5": {
    // Should be 100% compatible
    requiresSpecialToolFormat: false
  }
};
```

### If Proxy Performance Issues

**Problem**: Snapshot tests timeout

**Solution**: Optimize streaming

```typescript
// Batch small deltas
let deltaBuffer = "";
let bufferTimeout: Timer;

function sendDelta(text: string) {
  deltaBuffer += text;

  clearTimeout(bufferTimeout);
  bufferTimeout = setTimeout(() => {
    if (deltaBuffer) {
      sendSSE("content_block_delta", { /* ... */ });
      deltaBuffer = "";
    }
  }, 50); // Batch deltas every 50ms
}
```

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Testing Framework | 1 day | ✅ Complete |
| Fixture Capture | 2-3 hours | ⏳ Pending |
| Proxy Fixes | 1-2 days | ⏳ Pending |
| Validation | 2-3 hours | ⏳ Pending |
| **Total** | **2-3 days** | **In Progress** |

---

## Next Steps

1. **Immediate** (Today):
   - Run `./tests/snapshot-workflow.sh --capture` to build fixture library
   - Run `bun test tests/snapshot.test.ts` to see current failures
   - Start with Fix #1 (content block indices)

2. **Tomorrow**:
   - Complete Fixes #1-2 (critical)
   - Re-run tests, validate improvements
   - Implement Fixes #3-4 (medium priority)

3. **Day 3**:
   - Run full test suite
   - Fix any remaining issues
   - Integration test with real Claude Code
   - Document model-specific limitations

---

## Files Created

| File | Purpose |
|------|---------|
| `tests/capture-fixture.ts` | Extract fixtures from monitor logs |
| `tests/snapshot.test.ts` | Snapshot test runner with validators |
| `tests/fixtures/README.md` | Fixture format documentation |
| `tests/fixtures/example_simple_text.json` | Example text fixture |
| `tests/fixtures/example_tool_use.json` | Example tool use fixture |
| `tests/snapshot-workflow.sh` | End-to-end workflow automation |
| `SNAPSHOT_TESTING.md` | Testing system documentation |
| `PROTOCOL_COMPLIANCE_PLAN.md` | This file |

---

## References

- [Protocol Specification](./PROTOCOL_SPECIFICATION.md) - Complete protocol docs
- [Snapshot Testing Guide](./SNAPSHOT_TESTING.md) - Testing system docs
- [Monitor Mode Guide](./MONITOR_MODE_COMPLETE.md) - Monitor mode usage
- [Streaming Protocol](./STREAMING_PROTOCOL_EXPLAINED.md) - SSE event details

---

**Status**: Framework complete, ready for fixture capture and proxy fixes
**Next Action**: Run `./tests/snapshot-workflow.sh --capture`
**Owner**: Jack Rudenko @ MadAppGang
**Last Updated**: 2025-01-15

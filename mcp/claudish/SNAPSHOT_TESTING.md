# Snapshot Testing for Protocol Compliance

This document describes the snapshot testing system for ensuring 1:1 compatibility between Claudish proxy and the official Claude Code protocol.

## Overview

The snapshot testing system captures real Claude Code ↔ Anthropic API interactions (using monitor mode) and replays them through the proxy to validate protocol compliance.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPTURE PHASE                             │
│                                                              │
│  Claude Code → Claudish Monitor → Anthropic API             │
│       │                                         │            │
│       └─── Request captured ────────────────────┘            │
│                                         │                    │
│                                         ▼                    │
│                              Monitor logs (SSE events)       │
│                                         │                    │
│                                         ▼                    │
│                              capture-fixture.ts              │
│                                         │                    │
│                                         ▼                    │
│                              Fixture JSON files              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     TEST PHASE                               │
│                                                              │
│  snapshot.test.ts → Claudish Proxy → OpenRouter             │
│       │                                         │            │
│       └─── Replay captured request ─────────────┘            │
│                                         │                    │
│                                         ▼                    │
│                              Actual SSE events               │
│                                         │                    │
│                                         ▼                    │
│                              Validators                      │
│                                         │                    │
│                                         ▼                    │
│                         ✅ Pass / ❌ Fail                    │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Capture Fixtures

Run monitor mode to capture real Claude Code traffic:

```bash
# Build first
bun run build

# Capture a simple query
./dist/index.js --monitor --debug "What is 2+2?" 2>&1 | tee logs/simple.log

# Convert to fixture
bun tests/capture-fixture.ts logs/simple.log --name "simple_text"
```

### 2. Run Snapshot Tests

```bash
# Run all snapshot tests
bun test tests/snapshot.test.ts

# Run specific fixture
bun test tests/snapshot.test.ts -t "simple_text"
```

### 3. Automated Workflow

Use the workflow script for the complete process:

```bash
# Make executable
chmod +x tests/snapshot-workflow.sh

# Capture fixtures
./tests/snapshot-workflow.sh --capture

# Run tests only
./tests/snapshot-workflow.sh --test

# Full workflow (capture + test)
./tests/snapshot-workflow.sh --full
```

## Fixture Format

Fixtures are JSON files containing:

```json
{
  "name": "fixture_name",
  "description": "What this fixture tests",
  "category": "text|tool_use|multi_tool|streaming|error",
  "captured_at": "ISO 8601 timestamp",

  "request": {
    "headers": { /* Anthropic API headers */ },
    "body": { /* Request payload */ }
  },

  "response": {
    "type": "streaming",
    "events": [
      {"event": "message_start", "data": {...}},
      {"event": "content_block_start", "data": {...}},
      /* ... more events ... */
    ]
  },

  "assertions": {
    "eventSequence": ["message_start", "content_block_start", ...],
    "contentBlocks": [
      {"index": 0, "type": "text", "hasContent": true},
      {"index": 1, "type": "tool_use", "name": "Read", "hasContent": true}
    ],
    "stopReason": "end_turn",
    "hasUsage": true,
    "minInputTokens": 100,
    "minOutputTokens": 50
  },

  "notes": "Additional context"
}
```

### Normalized Values

Dynamic values are normalized for reproducibility:

| Original | Normalized |
|----------|-----------|
| `msg_01ABC123XYZ` | `msg_***NORMALIZED***` |
| `toolu_01XYZ789ABC` | `toolu_***NORMALIZED***` |
| Tool call IDs | `toolu_***NORMALIZED***` |

## Validators

The test suite includes comprehensive validators:

### 1. Event Sequence Validator

Ensures events occur in correct order:

```typescript
✅ Required events present: message_start, message_delta, message_stop
✅ message_start is first event
✅ message_stop is last event
✅ content_block_start/stop pairs match
```

### 2. Content Block Index Validator

Validates block indices are sequential:

```typescript
✅ Indices are sequential: 0, 1, 2, ...
✅ Block types match expected (text, tool_use)
✅ Tool names match (if tool_use)
```

### 3. Tool Input Streaming Validator

Validates fine-grained tool input streaming:

```typescript
✅ Tool deltas use input_json_delta type
✅ Partial JSON concatenates to complete JSON
✅ JSON is valid before content_block_stop
```

### 4. Usage Metrics Validator

Ensures usage stats are present:

```typescript
✅ message_start includes usage object
✅ message_delta includes usage object
✅ input_tokens is a number
✅ output_tokens is a number
```

### 5. Stop Reason Validator

Validates stop_reason is correct:

```typescript
✅ stop_reason is present in message_delta
✅ stop_reason is one of: end_turn, max_tokens, tool_use, stop_sequence
```

## Test Scenarios

Build a comprehensive fixture library covering:

### Basic Scenarios
- ✅ Simple text query (no tools)
- ✅ Text with streaming (long response)
- ✅ Text with ping events

### Tool Use Scenarios
- ✅ Single tool call (Read, Grep, etc.)
- ✅ Multiple sequential tools
- ✅ Fine-grained tool input streaming
- ✅ All 16 official tools individually

### Advanced Scenarios
- ✅ Multi-turn conversation
- ✅ Tool use → tool result → continuation
- ✅ Cache metrics (creation + read)
- ✅ Thinking mode blocks (if supported)

### Error Scenarios
- ✅ Malformed requests
- ✅ Stream interruptions
- ✅ Invalid tool arguments
- ✅ API errors

## Known Issues & Fixes

Based on the plan analysis, these are critical fixes needed:

### 1. Content Block Indices (CRITICAL)

**Issue**: Hardcoded `index: 0` in proxy-server.ts:750

```typescript
// ❌ Current
sendSSE("content_block_delta", {
  index: 0,  // Always 0!
  delta: { type: "text_delta", text: delta.content }
});
```

**Fix**: Track block indices properly

```typescript
// ✅ Fixed
let currentBlockIndex = 0;
let textBlockIndex = currentBlockIndex++;

sendSSE("content_block_delta", {
  index: textBlockIndex,  // Correct index
  delta: { type: "text_delta", text: delta.content }
});
```

**Location**: `src/proxy-server.ts:600-800` (streaming section)

### 2. Tool Input JSON Validation (CRITICAL)

**Issue**: No validation before closing tool blocks

**Fix**: Validate JSON is complete

```typescript
// Before sending content_block_stop for tool
try {
  JSON.parse(toolState.args);
  sendSSE("content_block_stop", { index: toolState.blockIndex });
} catch (e) {
  // Wait for more chunks
}
```

**Location**: `src/proxy-server.ts:829` (tool block closing)

### 3. Ping Events (MEDIUM)

**Issue**: Only one ping at start, not continuous

**Fix**: Add ping interval

```typescript
const pingInterval = setInterval(() => {
  sendSSE("ping", { type: "ping" });
}, 15000); // Every 15 seconds

// Clear on completion
clearInterval(pingInterval);
```

**Location**: `src/proxy-server.ts:636` (after initial ping)

### 4. Cache Metrics (MEDIUM)

**Issue**: Missing cache metrics in usage

**Fix**: Add cache fields to message_start

```typescript
usage: {
  input_tokens: 0,
  cache_creation_input_tokens: 0,  // Add
  cache_read_input_tokens: 0,      // Add
  output_tokens: 0,
  cache_creation: {                // Add (optional)
    ephemeral_5m_input_tokens: 0
  }
}
```

**Location**: `src/proxy-server.ts:614` (message_start usage)

## Running Tests

### Run All Tests

```bash
bun test tests/snapshot.test.ts
```

### Run Specific Category

```bash
bun test tests/snapshot.test.ts -t "tool_use"
```

### Run Single Fixture

```bash
bun test tests/snapshot.test.ts -t "example_simple_text"
```

### Verbose Output

```bash
bun test tests/snapshot.test.ts --verbose
```

## Debugging Failed Tests

When tests fail, check the error output:

```
❌ Content block errors:
  - Block 1: expected index 1, got 0
  - Block 2: expected index 2, got 0

❌ Tool input streaming errors:
  - Tool at index 1: incomplete or malformed JSON: {"file_path":"/te
```

### Common Failures

| Error | Cause | Fix |
|-------|-------|-----|
| Block indices wrong | Hardcoded index | Fix block tracking (proxy-server.ts:750) |
| Malformed tool JSON | No validation | Add JSON.parse check (proxy-server.ts:829) |
| Missing events | Incomplete sequence | Verify event flow (proxy-server.ts:604-715) |
| Missing usage | No cache fields | Add cache metrics (proxy-server.ts:614) |
| Missing ping events | No interval | Add setInterval (proxy-server.ts:636) |

## Best Practices

### Capturing Fixtures

1. **Use Real Queries**: Capture actual Claude Code usage patterns
2. **Diverse Scenarios**: Cover all tool types, multi-tool, errors
3. **Name Descriptively**: `grep_multi_file`, `read_with_error`, etc.
4. **Document Purpose**: Add clear descriptions and notes

### Writing Assertions

1. **Flexible Matching**: Use minimums for token counts (models vary)
2. **Structural Focus**: Assert structure, not exact content
3. **Essential Checks**: Focus on protocol compliance, not model behavior

### Maintaining Fixtures

1. **Version Control**: Commit fixtures to git
2. **Update Regularly**: Refresh when protocol changes
3. **Remove Duplicates**: Keep library focused and manageable
4. **Document Changes**: Note why fixtures were updated

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run snapshot tests
  run: |
    bun run build
    bun test tests/snapshot.test.ts
  env:
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

## Roadmap

- [x] Fixture capture system
- [x] Snapshot test runner
- [x] Protocol validators
- [ ] Fix critical proxy issues
- [ ] Capture comprehensive fixture library (20+ scenarios)
- [ ] Run full test suite
- [ ] Achieve 100% protocol compliance
- [ ] Document model-specific limitations

## References

- [Protocol Documentation](./PROTOCOL_SPECIFICATION.md)
- [Monitor Mode Guide](./MONITOR_MODE_COMPLETE.md)
- [Fixture README](./tests/fixtures/README.md)
- [Streaming Protocol Explained](./STREAMING_PROTOCOL_EXPLAINED.md)

---

**Last Updated**: 2025-01-15
**Status**: Testing framework complete, proxy fixes pending

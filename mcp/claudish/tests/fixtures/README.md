# Test Fixtures for Snapshot Testing

This directory contains captured Claude Code protocol interactions for snapshot-based integration testing.

## Fixture Structure

Each fixture is a JSON file representing a complete request-response cycle:

```json
{
  "name": "simple_text_query",
  "description": "Basic text query with no tools",
  "category": "text|tool_use|multi_tool|streaming",
  "captured_at": "2025-01-15T10:30:00Z",
  "request": {
    "headers": {
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "oauth-2025-04-20,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14",
      "content-type": "application/json"
    },
    "body": {
      "model": "claude-sonnet-4.5",
      "max_tokens": 4096,
      "messages": [...],
      "tools": [...],
      "stream": true
    }
  },
  "response": {
    "type": "streaming",
    "events": [
      {
        "event": "message_start",
        "data": {
          "type": "message_start",
          "message": {
            "id": "msg_***NORMALIZED***",
            "type": "message",
            "role": "assistant",
            "content": [],
            "model": "claude-sonnet-4.5",
            "stop_reason": null,
            "stop_sequence": null,
            "usage": {
              "input_tokens": 0,
              "cache_creation_input_tokens": 0,
              "cache_read_input_tokens": 0,
              "output_tokens": 0
            }
          }
        }
      },
      {
        "event": "content_block_start",
        "data": {
          "type": "content_block_start",
          "index": 0,
          "content_block": {
            "type": "text",
            "text": ""
          }
        }
      },
      {
        "event": "content_block_delta",
        "data": {
          "type": "content_block_delta",
          "index": 0,
          "delta": {
            "type": "text_delta",
            "text": "Hello"
          }
        }
      },
      {
        "event": "content_block_stop",
        "data": {
          "type": "content_block_stop",
          "index": 0
        }
      },
      {
        "event": "message_delta",
        "data": {
          "type": "message_delta",
          "delta": {
            "stop_reason": "end_turn",
            "stop_sequence": null
          },
          "usage": {
            "input_tokens": 100,
            "output_tokens": 50
          }
        }
      },
      {
        "event": "message_stop",
        "data": {
          "type": "message_stop"
        }
      }
    ]
  },
  "assertions": {
    "eventSequence": [
      "message_start",
      "content_block_start",
      "content_block_delta",
      "content_block_stop",
      "message_delta",
      "message_stop"
    ],
    "contentBlocks": [
      {
        "index": 0,
        "type": "text",
        "hasContent": true
      }
    ],
    "stopReason": "end_turn",
    "hasUsage": true,
    "minInputTokens": 50,
    "minOutputTokens": 10
  },
  "notes": "Captured from real Claude Code interaction"
}
```

## Normalized Values

Dynamic values are normalized during capture for reproducible tests:

- **IDs**: `msg_***NORMALIZED***`, `toolu_***NORMALIZED***`
- **Timestamps**: ISO 8601 format
- **Token counts**: Preserved but assertions use minimums
- **Text content**: Can vary by model, asserted structurally

## Fixture Categories

1. **text** - Simple text responses, no tools
2. **tool_use** - Single tool call scenarios
3. **multi_tool** - Multiple tool calls in one response
4. **streaming** - Long streaming responses with ping events
5. **error** - Error scenarios and edge cases

## Generating Fixtures

Run monitor mode to capture traffic:

```bash
bun run build
./dist/index.js --monitor --debug "Your query here" 2>&1 | tee logs/capture.log
```

Then extract fixtures:

```bash
bun tests/capture-fixture.ts logs/capture.log --output tests/fixtures/my_test.json
```

## Running Snapshot Tests

```bash
bun test tests/snapshot.test.ts
```

This will:
1. Load all fixtures from this directory
2. Replay requests through the proxy
3. Compare responses to captured snapshots
4. Report any protocol violations

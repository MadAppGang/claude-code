---
name: debug-mode
description: |
  Enable, disable, and manage debug mode for agentdev sessions.
  Records all tool invocations, skill activations, hook triggers, and agent delegations to JSONL.
  Use when debugging agent behavior, optimizing workflows, or analyzing session performance.
---
plugin: agentdev
updated: 2026-01-20

# AgentDev Debug Mode

Debug mode captures detailed session information for analysis, debugging, and optimization.
All events are recorded to a JSONL file in `claude-code-session-debug/`.

## Configuration

Debug mode uses **per-project configuration** stored in `.claude/agentdev-debug.json`.

### Config File Format

Location: `.claude/agentdev-debug.json` (in project root)

```json
{
  "enabled": true,
  "level": "standard",
  "created_at": "2026-01-09T07:00:00Z"
}
```

**Fields:**
- `enabled`: boolean - Whether debug mode is active
- `level`: string - Debug level (minimal, standard, verbose)
- `created_at`: string - ISO timestamp when config was created

## Enabling Debug Mode

Use the command to create the config file:

```
/agentdev:debug-enable
```

This creates `.claude/agentdev-debug.json` with `enabled: true`.

Or manually create the file:

```bash
mkdir -p .claude
cat > .claude/agentdev-debug.json << 'EOF'
{
  "enabled": true,
  "level": "standard",
  "created_at": "2026-01-09T07:00:00Z"
}
EOF
```

## Debug Levels

| Level | Captured Events |
|-------|-----------------|
| `minimal` | Phase transitions, errors, session start/end |
| `standard` | All of minimal + tool invocations, agent delegations |
| `verbose` | All of standard + skill activations, hook triggers, full parameters |

Default level is `standard`.

### Changing Debug Level

Using jq:
```bash
jq '.level = "verbose"' .claude/agentdev-debug.json > tmp.json && mv tmp.json .claude/agentdev-debug.json
```

## Output Location

Debug sessions are saved to:

```
claude-code-session-debug/agentdev-{slug}-{timestamp}-{id}.jsonl
```

Example:
```
claude-code-session-debug/agentdev-graphql-reviewer-20260109-063623-ba71.jsonl
```

## JSONL Format

Each line in the JSONL file is a complete JSON event object. This append-only format is:
- Crash-resilient (no data loss on unexpected termination)
- Easy to process with `jq`
- Streamable during the session

### Event Schema (v1.0.0)

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440001",
  "correlation_id": null,
  "timestamp": "2026-01-09T06:40:00Z",
  "type": "tool_invocation",
  "data": { ... }
}
```

**Fields:**
- `event_id`: Unique UUID for this event
- `correlation_id`: Links related events (e.g., tool_invocation -> tool_result)
- `timestamp`: ISO 8601 timestamp
- `type`: Event type (see below)
- `data`: Type-specific payload

### Event Types

| Type | Description |
|------|-------------|
| `session_start` | Session initialization with metadata |
| `session_end` | Session completion |
| `tool_invocation` | Tool called with parameters |
| `tool_result` | Tool execution result |
| `skill_activation` | Skill loaded by agent |
| `hook_trigger` | PreToolUse/PostToolUse hook fired |
| `agent_delegation` | Task delegated to sub-agent |
| `agent_response` | Sub-agent returned result |
| `phase_transition` | Workflow phase changed |
| `user_interaction` | User approval/input requested |
| `proxy_mode_request` | External model request via Claudish |
| `proxy_mode_response` | External model response |
| `error` | Error occurred |

## What Gets Captured

### Session Metadata
- Session ID and path
- User request
- Environment (Claudish availability, plugin version)
- Start/end timestamps

### Tool Invocations
- Tool name
- Parameters (sanitized - credentials redacted)
- Execution context (phase, agent)
- Duration and result size

### Agent Delegations
- Target agent name
- Prompt preview (first 200 chars)
- Proxy mode model if used
- Session path

### Proxy Mode
- Model ID
- Request/response duration
- Success/failure status

### Phase Transitions
- From/to phase numbers and names
- Transition reason (completed, skipped, failed)
- Quality gate results

### Errors
- Error type (tool_error, hook_error, agent_error, etc.)
- Message and stack trace
- Context (phase, agent, tool)
- Recoverability

## Sensitive Data Protection

Debug mode automatically sanitizes sensitive data:

**Redacted Patterns:**
- API keys (`sk-*`, `ghp_*`, `AKIA*`, etc.)
- Tokens (bearer, access, auth)
- Passwords and secrets
- AWS credentials
- Slack tokens (`xox*`)
- Google API keys (`AIza*`)

## Analyzing Debug Output

### Prerequisites

Install `jq` for JSON processing:
```bash
# macOS
brew install jq

# Linux
apt-get install jq
```

### Quick Statistics

```bash
# Count events by type
cat session.jsonl | jq -s 'group_by(.type) | map({type: .[0].type, count: length})'
```

### Tool Usage Analysis

```bash
# Tool invocation counts
cat session.jsonl | jq -s '
  [.[] | select(.type == "tool_invocation") | .data.tool_name]
  | group_by(.)
  | map({tool: .[0], count: length})
  | sort_by(-.count)'
```

### Failed Operations

```bash
# Find all errors and failed tool results
cat session.jsonl | jq 'select(.type == "error" or (.type == "tool_result" and .data.success == false))'
```

### Timeline View

```bash
# Chronological event summary
cat session.jsonl | jq '"\(.timestamp) [\(.type)] \(.data | keys | join(", "))"'
```

### Event Correlation

```bash
# Find tool invocation and its result
INVOCATION_ID="550e8400-e29b-41d4-a716-446655440001"
cat session.jsonl | jq "select(.event_id == \"$INVOCATION_ID\" or .correlation_id == \"$INVOCATION_ID\")"
```

### Phase Duration Analysis

```bash
# Calculate time between phase transitions
cat session.jsonl | jq -s '
  [.[] | select(.type == "phase_transition")]
  | sort_by(.timestamp)
  | .[]
  | {phase: .data.to_name, timestamp: .timestamp}'
```

### Agent Delegation Timing

```bash
# Find slowest agent delegations
cat session.jsonl | jq -s '
  [.[] | select(.type == "agent_response")]
  | sort_by(-.data.duration_ms)
  | .[:5]
  | .[]
  | {agent: .data.agent, duration_sec: (.data.duration_ms / 1000)}'
```

### Proxy Mode Performance

```bash
# External model response times
cat session.jsonl | jq -s '
  [.[] | select(.type == "proxy_mode_response")]
  | .[]
  | {model: .data.model_id, success: .data.success, duration_sec: (.data.duration_ms / 1000)}'
```

## Disabling Debug Mode

Use the command:
```
/agentdev:debug-disable
```

Or manually update:
```bash
jq '.enabled = false' .claude/agentdev-debug.json > tmp.json && mv tmp.json .claude/agentdev-debug.json
```

Or delete the config file:
```bash
rm -f .claude/agentdev-debug.json
```

## Cleaning Up Debug Files

### Remove All Debug Files

```bash
rm -rf claude-code-session-debug/
```

### Remove Files Older Than 7 Days

```bash
find claude-code-session-debug/ -name "*.jsonl" -mtime +7 -delete
```

### Remove Files Larger Than 10MB

```bash
find claude-code-session-debug/ -name "*.jsonl" -size +10M -delete
```

## File Permissions

Debug files are created with restrictive permissions:
- Directory: `0o700` (owner only)
- Files: `0o600` (owner read/write only)

This prevents other users from reading potentially sensitive session data.

## Example Session Output

```jsonl
{"event_id":"init-1736408183","timestamp":"2026-01-09T06:36:23Z","type":"session_start","data":{"schema_version":"1.0.0","session_id":"agentdev-graphql-reviewer-20260109-063623-ba71","user_request":"Create an agent that reviews GraphQL schemas","session_path":"ai-docs/sessions/agentdev-graphql-reviewer-20260109-063623-ba71","environment":{"claudish_available":true,"plugin_version":"1.4.0","jq_available":true}}}
{"event_id":"550e8400-e29b-41d4-a716-446655440001","timestamp":"2026-01-09T06:36:25Z","type":"tool_invocation","data":{"tool_name":"TodoWrite","parameters":{"todos":"[REDACTED]"},"context":{"phase":0,"agent":null}}}
{"event_id":"550e8400-e29b-41d4-a716-446655440002","correlation_id":"550e8400-e29b-41d4-a716-446655440001","timestamp":"2026-01-09T06:36:25Z","type":"tool_result","data":{"tool_name":"TodoWrite","success":true,"result_size_bytes":156,"duration_ms":12}}
{"event_id":"550e8400-e29b-41d4-a716-446655440003","timestamp":"2026-01-09T06:36:26Z","type":"phase_transition","data":{"from_phase":null,"to_phase":0,"from_name":null,"to_name":"Init","transition_reason":"completed","quality_gate_result":true}}
{"event_id":"550e8400-e29b-41d4-a716-446655440004","timestamp":"2026-01-09T06:36:30Z","type":"agent_delegation","data":{"target_agent":"agentdev:architect","prompt_preview":"SESSION_PATH: ai-docs/sessions/agentdev-graphql-reviewer...","prompt_length":1456,"proxy_mode":null,"session_path":"ai-docs/sessions/agentdev-graphql-reviewer-20260109-063623-ba71"}}
{"event_id":"end-1736408565","timestamp":"2026-01-09T06:42:45Z","type":"session_end","data":{"success":true}}
```

## Troubleshooting

### Debug File Not Created

1. Check if debug mode is enabled:
   ```bash
   /agentdev:debug-status
   ```

2. Verify config file:
   ```bash
   cat .claude/agentdev-debug.json
   ```

3. Verify the directory is writable:
   ```bash
   ls -la claude-code-session-debug/
   ```

### jq Commands Not Working

1. Install jq: `brew install jq` or `apt-get install jq`
2. Verify JSONL format (each line should be valid JSON):
   ```bash
   head -1 session.jsonl | jq .
   ```

### Large Debug Files

Debug files can grow large in verbose mode. Use `minimal` level for lighter capture:

Update config:
```bash
jq '.level = "minimal"' .claude/agentdev-debug.json > tmp.json && mv tmp.json .claude/agentdev-debug.json
```

Or clean up old files regularly:
```bash
find claude-code-session-debug/ -name "*.jsonl" -mtime +3 -delete
```

## Integration with Other Tools

### Viewing in VS Code

The JSONL format works with JSON syntax highlighting. For better viewing:
1. Install "JSON Lines" VS Code extension
2. Use "Format Document" on each line individually

### Importing to Analytics

```bash
# Convert to CSV for spreadsheet import
cat session.jsonl | jq -rs '
  (.[0] | keys_unsorted) as $keys
  | ($keys | @csv),
  (.[] | [.[$keys[]]] | @csv)' > session.csv
```

### Streaming to External Service

```bash
# Tail and send to logging service
tail -f session.jsonl | while read line; do
  curl -X POST -d "$line" https://logging.example.com/ingest
done
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `/agentdev:debug-enable` | Enable debug mode (creates config file) |
| `/agentdev:debug-disable` | Disable debug mode (updates config file) |
| `/agentdev:debug-status` | Check current debug mode status |

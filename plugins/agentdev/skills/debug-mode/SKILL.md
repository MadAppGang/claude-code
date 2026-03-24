---
name: debug-mode
description: "Records tool invocations, skill activations, hook triggers, and agent delegations to JSONL files in claude-code-session-debug/. Manages per-project debug configuration with three capture levels and provides jq-based session analysis. Use when debugging agent behavior, profiling workflow performance, or auditing session event sequences."
---

# AgentDev Debug Mode

Captures session events to append-only JSONL files for debugging, profiling, and auditing agent workflows.

## Workflow

1. **Enable debug mode** — run `/agentdev:debug-enable` or create `.claude/agentdev-debug.json` with `{"enabled": true, "level": "standard"}`.
2. **Run agent workflow** — all events (tool calls, delegations, phase transitions, errors) are appended to `claude-code-session-debug/agentdev-{slug}-{timestamp}-{id}.jsonl`.
3. **Analyze session** — use jq queries to extract statistics, find failures, trace delegations.
4. **Adjust capture level** — switch between minimal/standard/verbose as needed.
5. **Disable or clean up** — run `/agentdev:debug-disable` or delete old JSONL files.

## Debug Levels

| Level | Captures |
|-------|----------|
| `minimal` | Phase transitions, errors, session start/end |
| `standard` | + tool invocations, agent delegations |
| `verbose` | + skill activations, hook triggers, full parameters |

## Example: Enable and Configure

```bash
# Create config (or use /agentdev:debug-enable)
mkdir -p .claude
cat > .claude/agentdev-debug.json << 'EOF'
{"enabled": true, "level": "standard", "created_at": "2026-01-09T07:00:00Z"}
EOF

# Change level
jq '.level = "verbose"' .claude/agentdev-debug.json > tmp.json && mv tmp.json .claude/agentdev-debug.json
```

**Verification:** Run `/agentdev:debug-status` to confirm debug mode is active and at the expected level.

## Example: Analyze Session

```bash
# Count events by type
cat session.jsonl | jq -s 'group_by(.type) | map({type: .[0].type, count: length})'

# Find all errors and failed tool results
cat session.jsonl | jq 'select(.type == "error" or (.type == "tool_result" and .data.success == false))'

# Tool invocation frequency
cat session.jsonl | jq -s '[.[] | select(.type == "tool_invocation") | .data.tool_name] | group_by(.) | map({tool: .[0], count: length}) | sort_by(-.count)'

# Slowest agent delegations
cat session.jsonl | jq -s '[.[] | select(.type == "agent_response")] | sort_by(-.data.duration_ms) | .[:5] | .[] | {agent: .data.agent, duration_sec: (.data.duration_ms / 1000)}'
```

## Event Types

| Type | Description |
|------|-------------|
| `session_start` / `session_end` | Session lifecycle with metadata |
| `tool_invocation` / `tool_result` | Tool calls with parameters and outcomes |
| `skill_activation` | Skill loaded by agent |
| `hook_trigger` | PreToolUse/PostToolUse hook fired |
| `agent_delegation` / `agent_response` | Sub-agent task lifecycle |
| `phase_transition` | Workflow phase changes with quality gate results |
| `error` | Errors with type, context, and recoverability |

Events link via `correlation_id` (e.g., tool_invocation to its tool_result).

## Sensitive Data Protection

API keys (`sk-*`, `ghp_*`, `AKIA*`), tokens, passwords, and credentials are automatically redacted in captured events.

## Commands

| Command | Description |
|---------|-------------|
| `/agentdev:debug-enable` | Enable debug mode |
| `/agentdev:debug-disable` | Disable debug mode |
| `/agentdev:debug-status` | Check current status |

## Notes

- JSONL format is crash-resilient — no data loss on unexpected termination
- Debug files use restrictive permissions (directory 0o700, files 0o600)
- Clean old files: `find claude-code-session-debug/ -name "*.jsonl" -mtime +7 -delete`
- Use `minimal` level to reduce file size in long sessions
- Process with jq, import to CSV, or stream to external logging services

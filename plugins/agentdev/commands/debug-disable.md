---
description: Disable debug mode for agentdev sessions. Stops recording tool invocations and agent delegations.
allowed-tools: Bash
---

# Disable Debug Mode

Disable agentdev debug mode by updating the per-project configuration file.

## Instructions

1. Check if config file exists
2. Update `.claude/agentdev-debug.json` with enabled: false
3. Show confirmation

## Implementation

Execute the following to disable debug mode:

```bash
echo "=== Disabling Debug Mode ==="
echo ""

# Check if config file exists
if [ -f ".claude/agentdev-debug.json" ]; then
  # Update enabled to false using jq if available
  if command -v jq &> /dev/null; then
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    jq --arg ts "$TIMESTAMP" '.enabled = false | .disabled_at = $ts' .claude/agentdev-debug.json > .claude/agentdev-debug.json.tmp
    mv .claude/agentdev-debug.json.tmp .claude/agentdev-debug.json
    echo "Config updated: $(pwd)/.claude/agentdev-debug.json"
    cat .claude/agentdev-debug.json
  else
    # Fallback: delete and recreate with enabled: false
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    cat > .claude/agentdev-debug.json << EOF
{
  "enabled": false,
  "level": "standard",
  "disabled_at": "$TIMESTAMP"
}
EOF
    echo "Config updated: $(pwd)/.claude/agentdev-debug.json"
    cat .claude/agentdev-debug.json
  fi
else
  echo "No config file found at .claude/agentdev-debug.json"
  echo "Debug mode was not enabled."
fi
```

## Response Format

Display the following:

```
Debug Mode: DISABLED

Config: .claude/agentdev-debug.json
Status: enabled = false

Note: Existing debug files in claude-code-session-debug/ are preserved.

Use /agentdev:debug-status to verify debug mode is disabled.
```

## Alternative: Delete Config File

If you want to completely remove the config file instead of setting enabled: false:

```bash
rm -f .claude/agentdev-debug.json
echo "Config file removed."
```

## Cleanup Debug Files

If the user wants to clean up debug files, suggest:

```bash
# Remove all debug files
rm -rf claude-code-session-debug/

# Or remove files older than 7 days
find claude-code-session-debug/ -name "*.jsonl" -mtime +7 -delete
```

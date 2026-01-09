---
description: Check current debug mode status for agentdev sessions. Shows if enabled/disabled, debug level, and recent session files.
allowed-tools: Bash
---

# Debug Mode Status

Check the current status of agentdev debug mode by reading the per-project configuration file.

## Instructions

1. Check config file at `.claude/agentdev-debug.json`
2. Check debug directory and recent session files
3. Display status summary

## Implementation

Execute the following to gather status information:

```bash
echo "=== Debug Mode Status ==="
echo ""

# Determine effective debug status
CONFIG_ENABLED="false"
CONFIG_LEVEL="standard"

# Check config file
if [ -f ".claude/agentdev-debug.json" ]; then
  echo "Config File: $(pwd)/.claude/agentdev-debug.json"
  if command -v jq &> /dev/null; then
    CONFIG_ENABLED=$(jq -r '.enabled // false' .claude/agentdev-debug.json)
    CONFIG_LEVEL=$(jq -r '.level // "standard"' .claude/agentdev-debug.json)
    echo "  enabled: $CONFIG_ENABLED"
    echo "  level: $CONFIG_LEVEL"
    CREATED=$(jq -r '.created_at // "unknown"' .claude/agentdev-debug.json)
    echo "  created_at: $CREATED"
  else
    echo "  (install jq for detailed config parsing)"
    cat .claude/agentdev-debug.json
  fi
else
  echo "Config File: NOT FOUND"
  echo "  (Run /agentdev:debug-enable to create)"
fi

echo ""

# Determine effective status
echo "Status:"
if [ "$CONFIG_ENABLED" = "true" ]; then
  echo "  Debug Mode: ENABLED"
  echo "  Level: $CONFIG_LEVEL"
else
  echo "  Debug Mode: DISABLED"
fi

echo ""

# Check debug directory
if [ -d "claude-code-session-debug" ]; then
  echo "Debug Directory: EXISTS"
  echo "  Path: $(pwd)/claude-code-session-debug/"
  echo ""
  echo "Recent Session Files (last 5):"
  ls -lt claude-code-session-debug/*.jsonl 2>/dev/null | head -5 || echo "  No debug files found"
  echo ""
  FILE_COUNT=$(ls claude-code-session-debug/*.jsonl 2>/dev/null | wc -l | tr -d ' ')
  DIR_SIZE=$(du -sh claude-code-session-debug 2>/dev/null | cut -f1 || echo '0')
  echo "Total Files: $FILE_COUNT"
  echo "Total Size: $DIR_SIZE"
else
  echo "Debug Directory: NOT FOUND"
  echo "  (Will be created when debug mode is first used)"
fi
```

## Response Format

Based on the status, display one of:

### If Debug Mode is Enabled

```
Debug Mode Status
-----------------
Status: ENABLED
Config: .claude/agentdev-debug.json
Level: standard

Debug Directory: claude-code-session-debug/
Recent Sessions:
  - agentdev-{slug}-{timestamp}-{id}.jsonl (X KB)

Commands:
  /agentdev:debug-disable  - Disable debug mode
```

### If Debug Mode is Disabled

```
Debug Mode Status
-----------------
Status: DISABLED

Config: .claude/agentdev-debug.json (enabled: false)
  or
Config: NOT FOUND

Previous Sessions: {count} files ({size})

Commands:
  /agentdev:debug-enable  - Enable debug mode
```

## Additional Information

If the user wants more details about a specific session file:

```bash
# View session statistics
cat claude-code-session-debug/{filename}.jsonl | jq -s 'group_by(.type) | map({type: .[0].type, count: length})'

# View errors only
cat claude-code-session-debug/{filename}.jsonl | jq 'select(.type == "error")'

# View timeline
cat claude-code-session-debug/{filename}.jsonl | jq '"\(.timestamp) [\(.type)]"'
```

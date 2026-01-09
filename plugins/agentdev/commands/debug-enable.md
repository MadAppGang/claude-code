---
description: Enable debug mode for agentdev sessions. Records tool invocations, skill activations, and agent delegations to JSONL files.
allowed-tools: Bash
---

# Enable Debug Mode

Enable agentdev debug mode to capture detailed session information. Uses per-project configuration stored in `.claude/agentdev-debug.json`.

## Instructions

1. Create the `.claude/` directory if it does not exist
2. Create or update `.claude/agentdev-debug.json` with enabled: true
3. Create the debug output directory
4. Confirm debug mode is enabled

## Implementation

Execute the following steps:

```bash
# Create .claude directory if needed
mkdir -p .claude

# Create or update agentdev-debug.json config
cat > .claude/agentdev-debug.json << 'EOF'
{
  "enabled": true,
  "level": "standard",
  "created_at": "TIMESTAMP_PLACEHOLDER"
}
EOF

# Replace timestamp placeholder with actual ISO timestamp
if command -v jq &> /dev/null; then
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  jq --arg ts "$TIMESTAMP" '.created_at = $ts' .claude/agentdev-debug.json > .claude/agentdev-debug.json.tmp
  mv .claude/agentdev-debug.json.tmp .claude/agentdev-debug.json
else
  # Fallback without jq - use sed
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  sed -i.bak "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/" .claude/agentdev-debug.json
  rm -f .claude/agentdev-debug.json.bak
fi

# Create debug output directory with secure permissions
mkdir -p claude-code-session-debug
chmod 700 claude-code-session-debug

# Confirm setup
echo "=== Debug Mode Enabled ==="
echo ""
echo "Config file: $(pwd)/.claude/agentdev-debug.json"
cat .claude/agentdev-debug.json
echo ""
echo "Debug directory: $(pwd)/claude-code-session-debug/"
```

## Debug Levels

You can change the debug level by editing `.claude/agentdev-debug.json`:

- `minimal` - Phase transitions, errors, session start/end
- `standard` - All of minimal + tool invocations, agent delegations (default)
- `verbose` - All of standard + skill activations, hook triggers, full parameters

To change level:
```bash
# Using jq
jq '.level = "verbose"' .claude/agentdev-debug.json > tmp.json && mv tmp.json .claude/agentdev-debug.json

# Or manually edit .claude/agentdev-debug.json
```

## Output

Debug sessions are saved to:
```
claude-code-session-debug/agentdev-{slug}-{timestamp}-{id}.jsonl
```

## Response Format

After enabling, display:

```
Debug Mode: ENABLED

Config: .claude/agentdev-debug.json
Level: standard
Directory: claude-code-session-debug/

The config file is per-project and will persist across sessions.

See /agentdev:debug-status for current status.
```

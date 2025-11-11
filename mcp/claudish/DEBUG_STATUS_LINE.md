# Debug Status Line 100% Issue

## The Problem
Status line always shows 100% context remaining, even after using tokens.

## What We've Fixed
1. ✅ Changed from looking for `total_tokens` to `input_tokens` + `output_tokens`
2. ✅ Sum ALL occurrences (handles arrays in `modelUsage`)
3. ✅ Bash calculation logic works correctly

## Debug Steps

### Step 1: Capture the Actual JSON Claude Code Sends

Run this command to see what JSON Claude Code passes to the status line:

```bash
# Create a test settings file with debug logging
mkdir -p ~/.claude
cat > ~/.claude/debug-settings.json <<'EOF'
{
  "statusLine": {
    "type": "command",
    "command": "JSON=$(cat) && echo \"$JSON\" >> /tmp/claude-status-debug.log && echo \"===\" >> /tmp/claude-status-debug.log && echo 'DEBUG MODE'"
  }
}
EOF

# Run claudish with debug settings
claudish --settings ~/.claude/debug-settings.json -i

# After using Claude Code for a bit, check the log:
cat /tmp/claude-status-debug.log | tail -50
```

### Step 2: Check the JSON Structure

Look for these fields in the log:
- `input_tokens` - Should exist and have a number
- `output_tokens` - Should exist and have a number
- `total_cost_usd` - Should exist (this one works)
- `modelUsage` - Array that might contain per-model token counts

### Step 3: Manual Test

Test the calculation with your actual JSON:

```bash
# Replace with your actual JSON from Step 1
JSON='<paste your JSON here>'

INPUT=$(echo "$JSON" | grep -o '"input_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
OUTPUT=$(echo "$JSON" | grep -o '"output_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
TOTAL=$((INPUT + OUTPUT))

echo "INPUT tokens: $INPUT"
echo "OUTPUT tokens: $OUTPUT"
echo "TOTAL tokens: $TOTAL"

maxTokens=256000
CTX=$(echo "scale=0; ($maxTokens - $TOTAL) * 100 / $maxTokens" | bc 2>/dev/null)
echo "Context remaining: $CTX%"
```

## Possible Issues

1. **No token data at start**: If Claude Code doesn't send token data until after the first API call
2. **Different field names**: Claude Code might use different field names than we expect
3. **Nested structure**: Token data might be in a different location in the JSON
4. **Timing issue**: Status line might update before token data is available

## Current Implementation

The status line command (in `src/claude-runner.ts:56`):

```bash
INPUT=$(echo "$JSON" | grep -o '"input_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
OUTPUT=$(echo "$JSON" | grep -o '"output_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
TOTAL=$((INPUT + OUTPUT))
CTX=$(echo "scale=0; (${maxTokens} - $TOTAL) * 100 / ${maxTokens}" | bc 2>/dev/null)
```

This should:
- Find ALL occurrences of `"input_tokens":NUMBER`
- Extract the numbers
- Sum them with awk
- Do the same for output_tokens
- Calculate percentage remaining

## Next Steps

Please run Step 1 and share the output from `/tmp/claude-status-debug.log` so we can see what JSON Claude Code is actually sending!

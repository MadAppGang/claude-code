#!/bin/bash
# Debug script to capture what JSON Claude Code passes to status line
# Usage: Replace statusLine.command temporarily with this script's path

LOGFILE="/tmp/claudish-status-debug.log"

# Read JSON from stdin
JSON=$(cat)

# Append to log file with timestamp
echo "=== $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOGFILE"
echo "$JSON" >> "$LOGFILE"
echo "" >> "$LOGFILE"

# Extract tokens for display
INPUT=$(echo "$JSON" | grep -o '"input_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
OUTPUT=$(echo "$JSON" | grep -o '"output_tokens":[0-9]*' | grep -o '[0-9]*' | awk '{sum+=$1} END {print sum+0}')
TOTAL=$((INPUT + OUTPUT))
COST=$(echo "$JSON" | grep -o '"total_cost_usd":[0-9.]*' | cut -d: -f2)
COST=${COST:-0}

# Display debug info
printf "DEBUG: input=%d output=%d total=%d cost=\$%.3f\n" "$INPUT" "$OUTPUT" "$TOTAL" "$COST"

echo "==================================" >> "$LOGFILE"
echo "JSON saved to: $LOGFILE"

#!/bin/bash
# =============================================================================
# INTERCEPT BASH GREP/RG/FIND → REPLACE WITH CLAUDEMEM (v0.2.0)
# =============================================================================
# This hook intercepts Bash commands that run grep, rg, ripgrep, ag, ack,
# git grep, or find with grep. Replaces with claudemem semantic search.
#
# v0.2.0 Update: Uses --use-case navigation for agent-optimized weights
# =============================================================================

set -euo pipefail

# Read tool input from stdin
TOOL_INPUT=$(cat)
COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // empty')

# Skip if empty command
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Detect search commands: grep, rg, ripgrep, ag, ack, git grep, find with grep
# Pattern matches: grep, rg, etc. as standalone commands or with paths
if ! echo "$COMMAND" | grep -qiE '(^|\s|/|;|&&|\|)(grep|rg|ripgrep|ag|ack)(\s|$)|git\s+grep|find\s+.*-exec.*grep'; then
  # Not a search command - allow
  exit 0
fi

# Check if claudemem is installed
if ! command -v claudemem &>/dev/null; then
  exit 0
fi

# Check if claudemem is indexed
STATUS_OUTPUT=$(claudemem status 2>/dev/null || echo "")
if ! echo "$STATUS_OUTPUT" | grep -qE "[0-9]+ chunks"; then
  # Not indexed - allow with warning
  cat << 'EOF' >&3
{
  "additionalContext": "⚠️ **claudemem not indexed** - Search command allowed as fallback.\n\nFor semantic search with LLM enrichment, run:\n```bash\nclaudemem index --enrich\n```"
}
EOF
  exit 0
fi

# === CLAUDEMEM IS INDEXED - REPLACE BASH SEARCH ===

# Check enrichment status (v0.2.0)
FILE_SUMMARY_COUNT=$(echo "$STATUS_OUTPUT" | grep -oE "file_summary: [0-9]+" | grep -oE "[0-9]+" || echo "0")
SYMBOL_SUMMARY_COUNT=$(echo "$STATUS_OUTPUT" | grep -oE "symbol_summary: [0-9]+" | grep -oE "[0-9]+" || echo "0")

# Extract search pattern (best effort)
# Handles various patterns: grep "pattern", grep 'pattern', grep pattern, rg pattern
PATTERN=""

# Try to extract quoted pattern first
PATTERN=$(echo "$COMMAND" | grep -oE '"[^"]+"' | head -1 | tr -d '"')

# If no quoted pattern, try single quotes
if [ -z "$PATTERN" ]; then
  PATTERN=$(echo "$COMMAND" | grep -oE "'[^']+'" | head -1 | tr -d "'")
fi

# If still no pattern, try to get the argument after grep/rg
if [ -z "$PATTERN" ]; then
  PATTERN=$(echo "$COMMAND" | sed -E 's/.*(grep|rg|ag|ack)\s+(-[a-zA-Z]+\s+)*([^\s|>]+).*/\3/' | head -1)
fi

# Fallback
if [ -z "$PATTERN" ] || [ "$PATTERN" = "$COMMAND" ]; then
  PATTERN="code pattern"
fi

# Run claudemem search with navigation use case (optimized for agents)
# This prioritizes symbol_summary (35%) and file_summary (30%) over code_chunk (20%)
RESULTS=$(claudemem search "$PATTERN" -n 15 --use-case navigation 2>/dev/null || echo "No results found")

# Escape for JSON
RESULTS_ESCAPED=$(echo "$RESULTS" | jq -Rs .)
COMMAND_ESCAPED=$(echo "$COMMAND" | jq -Rs .)
PATTERN_ESCAPED=$(echo "$PATTERN" | jq -Rs .)

# Build enrichment status message
if [ "$FILE_SUMMARY_COUNT" != "0" ] && [ "$SYMBOL_SUMMARY_COUNT" != "0" ]; then
  ENRICHMENT_MSG="Fully enriched with file_summary + symbol_summary"
elif [ "$FILE_SUMMARY_COUNT" != "0" ]; then
  ENRICHMENT_MSG="Partial enrichment (file_summary only)"
else
  ENRICHMENT_MSG="Not enriched (code_chunk only). Run \`claudemem enrich\` for better results"
fi

# Return results and block
cat << EOF >&3
{
  "additionalContext": "🔍 **CLAUDEMEM SEARCH** (Bash search intercepted)\n\n**Blocked command:** ${COMMAND_ESCAPED}\n**Extracted query:** ${PATTERN_ESCAPED}\n**Mode:** navigation (agent-optimized weights)\n**Enrichment:** ${ENRICHMENT_MSG}\n\n${RESULTS_ESCAPED}\n\n---\n✅ Semantic search complete. Use \`claudemem search \"query\" --use-case navigation\` directly.",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "grep/rg/find blocked. claudemem semantic results (--use-case navigation) provided in context above."
  }
}
EOF

exit 0

#!/bin/bash
# =============================================================================
# INTERCEPT GREP → REPLACE WITH CLAUDEMEM SEMANTIC SEARCH (v0.2.0)
# =============================================================================
# This hook intercepts the Grep tool and replaces it with claudemem search.
# When claudemem is indexed, Grep is blocked and semantic results are returned.
# When claudemem is not indexed, Grep is allowed with a warning.
#
# v0.2.0 Update: Uses --use-case navigation for agent-optimized weights
# =============================================================================

set -euo pipefail

# Read tool input from stdin
TOOL_INPUT=$(cat)
PATTERN=$(echo "$TOOL_INPUT" | jq -r '.pattern // empty')

# Skip if empty pattern
if [ -z "$PATTERN" ]; then
  exit 0
fi

# Check if claudemem is installed
if ! command -v claudemem &>/dev/null; then
  # Not installed - allow grep
  exit 0
fi

# Check if claudemem is indexed
STATUS_OUTPUT=$(claudemem status 2>/dev/null || echo "")
if ! echo "$STATUS_OUTPUT" | grep -qE "[0-9]+ chunks"; then
  # Not indexed - allow grep with warning
  cat << 'EOF' >&3
{
  "additionalContext": "⚠️ **claudemem not indexed** - Grep allowed as fallback.\n\nFor semantic search with LLM enrichment, run:\n```bash\nclaudemem index --enrich\n```"
}
EOF
  exit 0
fi

# === CLAUDEMEM IS INDEXED - REPLACE GREP ===

# Check enrichment status (v0.2.0)
FILE_SUMMARY_COUNT=$(echo "$STATUS_OUTPUT" | grep -oE "file_summary: [0-9]+" | grep -oE "[0-9]+" || echo "0")
SYMBOL_SUMMARY_COUNT=$(echo "$STATUS_OUTPUT" | grep -oE "symbol_summary: [0-9]+" | grep -oE "[0-9]+" || echo "0")

# Run claudemem search with navigation use case (optimized for agents)
# This prioritizes symbol_summary (35%) and file_summary (30%) over code_chunk (20%)
RESULTS=$(claudemem search "$PATTERN" -n 15 --use-case navigation 2>/dev/null || echo "No results found")

# Escape special characters for JSON
RESULTS_ESCAPED=$(echo "$RESULTS" | jq -Rs .)
PATTERN_ESCAPED=$(echo "$PATTERN" | jq -Rs .)

# Build enrichment status message
if [ "$FILE_SUMMARY_COUNT" != "0" ] && [ "$SYMBOL_SUMMARY_COUNT" != "0" ]; then
  ENRICHMENT_MSG="Fully enriched with file_summary + symbol_summary"
elif [ "$FILE_SUMMARY_COUNT" != "0" ]; then
  ENRICHMENT_MSG="Partial enrichment (file_summary only)"
else
  ENRICHMENT_MSG="Not enriched (code_chunk only). Run \`claudemem enrich\` for better results"
fi

# Return results and block grep
cat << EOF >&3
{
  "additionalContext": "🔍 **CLAUDEMEM SEARCH** (Grep intercepted)\n\n**Query:** ${PATTERN_ESCAPED}\n**Mode:** navigation (agent-optimized weights)\n**Enrichment:** ${ENRICHMENT_MSG}\n\n${RESULTS_ESCAPED}\n\n---\n✅ Semantic search complete. Grep was blocked because claudemem is indexed.",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Grep replaced with claudemem semantic search (--use-case navigation). Results provided in context above."
  }
}
EOF

exit 0

#!/bin/bash
# =============================================================================
# SESSION START HOOK - CHECK CLAUDEMEM STATUS (v0.2.0)
# =============================================================================
# This hook runs at the start of each Claude Code session.
# It checks if claudemem is installed, indexed, AND enriched (v0.2.0).
# Provides guidance on enrichment for better semantic search.
# =============================================================================

set -euo pipefail

# Check if claudemem is installed
if ! command -v claudemem &>/dev/null; then
  cat << 'EOF' >&3
{
  "additionalContext": "⚠️ **claudemem not installed**\n\nThe code-analysis plugin uses semantic search with LLM enrichment. Install with:\n```bash\nnpm install -g claude-codemem\nclaudemem init              # Configure API key\nclaudemem index --enrich    # Index with enrichment\n```\n\nUntil indexed, Grep/Glob will work normally."
}
EOF
  exit 0
fi

# Check claudemem status
STATUS_OUTPUT=$(claudemem status 2>/dev/null || echo "")

# Check if indexed
if ! echo "$STATUS_OUTPUT" | grep -qE "[0-9]+ chunks"; then
  cat << 'EOF' >&3
{
  "additionalContext": "💡 **claudemem not indexed for this project**\n\nRun `claudemem index --enrich` to enable semantic search with LLM enrichment.\nOnce indexed, Grep will be automatically replaced with claudemem."
}
EOF
  exit 0
fi

# Get index stats
CHUNK_COUNT=$(echo "$STATUS_OUTPUT" | grep -oE "[0-9]+ chunks" | head -1 || echo "unknown")

# Check for enrichment status (v0.2.0)
FILE_SUMMARY_COUNT=$(echo "$STATUS_OUTPUT" | grep -oE "file_summary: [0-9]+" | grep -oE "[0-9]+" || echo "0")
SYMBOL_SUMMARY_COUNT=$(echo "$STATUS_OUTPUT" | grep -oE "symbol_summary: [0-9]+" | grep -oE "[0-9]+" || echo "0")

# Determine enrichment status
if [ "$FILE_SUMMARY_COUNT" = "0" ] && [ "$SYMBOL_SUMMARY_COUNT" = "0" ]; then
  # Not enriched - provide guidance
  cat << EOF >&3
{
  "additionalContext": "✅ **claudemem indexed** ($CHUNK_COUNT)\n\n⚡ **Enrichment recommended** - Run \`claudemem enrich\` for LLM-enhanced search.\nWith enrichment: file_summary + symbol_summary = better semantic understanding.\n\nCurrent: code_chunk only (v0.1.x behavior)\nGrep/rg/find will be replaced with semantic search automatically."
}
EOF
elif [ "$FILE_SUMMARY_COUNT" != "0" ] && [ "$SYMBOL_SUMMARY_COUNT" = "0" ]; then
  # Partially enriched
  cat << EOF >&3
{
  "additionalContext": "✅ **claudemem active** ($CHUNK_COUNT, $FILE_SUMMARY_COUNT file summaries)\n\n⚡ Symbol summaries missing - Run \`claudemem enrich\` to complete.\nGrep/rg/find will be replaced with semantic search using \`--use-case navigation\`."
}
EOF
else
  # Fully enriched (v0.2.0)
  cat << EOF >&3
{
  "additionalContext": "✅ **claudemem v0.2.0 active** ($CHUNK_COUNT, $FILE_SUMMARY_COUNT file summaries, $SYMBOL_SUMMARY_COUNT symbol summaries)\n\nFully enriched with LLM summaries. Grep/rg/find will be replaced with semantic search using \`--use-case navigation\`."
}
EOF
fi

exit 0

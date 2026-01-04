#!/bin/bash
# =============================================================================
# SEO PLUGIN - SESSION START HOOK
# =============================================================================
# Checks analytics API connectivity and displays status at session start
# =============================================================================

set -euo pipefail

# Check for GA4 configuration
GA4_STATUS="NOT CONFIGURED"
GA4_DETAILS=""
if [ -n "${GA_PROPERTY_ID:-}" ] && [ -n "${GOOGLE_CLIENT_EMAIL:-}" ]; then
  GA4_STATUS="CONFIGURED"
  GA4_DETAILS=" (Property: ${GA_PROPERTY_ID})"
fi

# Check for GSC configuration
GSC_STATUS="NOT CONFIGURED"
GSC_DETAILS=""
if [ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ] || [ -n "${GOOGLE_CLIENT_EMAIL:-}" ]; then
  GSC_STATUS="CONFIGURED"
  if [ -n "${GSC_SITE_URL:-}" ]; then
    GSC_DETAILS=" (Site: ${GSC_SITE_URL})"
  fi
fi

# Build status message
STATUS_MSG="### SEO Analytics Integrations\\n\\n"
STATUS_MSG+="| Service | Status | Details |\\n"
STATUS_MSG+="|---------|--------|---------|\\n"
STATUS_MSG+="| Google Analytics 4 | ${GA4_STATUS} | ${GA4_DETAILS:-N/A} |\\n"
STATUS_MSG+="| Google Search Console | ${GSC_STATUS} | ${GSC_DETAILS:-N/A} |\\n"

# Count configured services
CONFIGURED_COUNT=0
[ "$GA4_STATUS" = "CONFIGURED" ] && CONFIGURED_COUNT=$((CONFIGURED_COUNT + 1))
[ "$GSC_STATUS" = "CONFIGURED" ] && CONFIGURED_COUNT=$((CONFIGURED_COUNT + 1))

# Add guidance based on status
if [ "$CONFIGURED_COUNT" -eq 0 ]; then
  STATUS_MSG+="\\n**No analytics integrations configured.**\\n"
  STATUS_MSG+="Run \`/setup-analytics\` to configure GA4 or GSC.\\n"
elif [ "$CONFIGURED_COUNT" -lt 2 ]; then
  STATUS_MSG+="\\n**${CONFIGURED_COUNT}/2 integrations configured.**\\n"
  STATUS_MSG+="Run \`/setup-analytics\` to add more data sources.\\n"
else
  STATUS_MSG+="\\n**All analytics integrations configured!**\\n"
  STATUS_MSG+="Run \`/performance\` to analyze content performance.\\n"
fi

# Output JSON for Claude Code hook system
cat << EOF >&3
{
  "additionalContext": "${STATUS_MSG}"
}
EOF

exit 0

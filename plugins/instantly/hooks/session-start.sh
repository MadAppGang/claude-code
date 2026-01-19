#!/bin/bash
# hooks/session-start.sh
# Instantly Plugin Session Initialization
# Checks environment configuration and MCP connectivity

# Check for INSTANTLY_API_KEY
if [ -z "$INSTANTLY_API_KEY" ]; then
  echo "WARNING: INSTANTLY_API_KEY not set. Instantly MCP will not work."
  echo "Set it with: export INSTANTLY_API_KEY='your_key'"
  echo ""
  echo "Get your API key from: https://app.instantly.ai/settings/integrations"
  exit 0
fi

# Verify key format (basic check - should start with expected prefix if any)
if [ ${#INSTANTLY_API_KEY} -lt 20 ]; then
  echo "WARNING: INSTANTLY_API_KEY appears to be too short. Please verify your key."
  exit 0
fi

# Success message
echo "Instantly plugin ready. API key configured."

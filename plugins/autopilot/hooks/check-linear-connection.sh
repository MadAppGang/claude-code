#!/bin/bash
# Verify Linear API connection on session start

if [[ -z "$LINEAR_API_KEY" ]]; then
  echo "WARNING: LINEAR_API_KEY not set. Autopilot disabled."
  exit 0
fi

# Quick API test
response=$(curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ viewer { id } }"}')

if echo "$response" | grep -q '"errors"'; then
  echo "WARNING: Linear API connection failed. Check LINEAR_API_KEY."
  exit 0
fi

echo "Autopilot: Linear connection verified."

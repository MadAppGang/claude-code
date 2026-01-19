#!/bin/bash
# Check if webhook server is running

PORT="${AUTOPILOT_WEBHOOK_PORT:-3001}"

if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
  echo "Autopilot: Webhook server running on port $PORT"
else
  echo "INFO: Autopilot webhook server not running. Manual task execution only."
fi

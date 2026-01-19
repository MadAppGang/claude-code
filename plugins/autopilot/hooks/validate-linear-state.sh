#!/bin/bash
# Validate Linear state before task delegation
# This hook runs before Task tool to ensure Linear state is consistent

# Only validate for autopilot-related tasks
if [[ "$TASK_PROMPT" != *"autopilot"* ]]; then
  exit 0
fi

# Validate issue exists and is in correct state
# (Implementation would parse TASK_PROMPT for issue ID and validate)

exit 0

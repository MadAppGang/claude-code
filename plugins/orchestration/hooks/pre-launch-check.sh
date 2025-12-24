#!/bin/bash
# =============================================================================
# PRE-LAUNCH CHECK HOOK - VERIFY TRACKING BEFORE MULTI-MODEL TASK CALLS
# =============================================================================
# This hook runs before Task tool calls. It checks if the task looks like
# multi-model validation and warns if tracking infrastructure is missing.
#
# CONSENSUS FIX APPLIED: Uses file-based detection (/tmp/.claude-multi-model-active)
# instead of environment variables for reliable tracking detection.
# =============================================================================

set -euo pipefail

TOOL_INPUT=$(cat)

# Extract task description/prompt from Task tool input
TASK_PROMPT=$(echo "$TOOL_INPUT" | jq -r '.prompt // .description // empty' 2>/dev/null || echo "")

# Check if this looks like a multi-model review task
is_multi_model_task() {
  local prompt="$1"

  # Look for proxy mode indicators
  if echo "$prompt" | grep -qiE "PROXY_MODE:|codex-code-reviewer|external.*model|claudish"; then
    return 0
  fi

  # Look for multi-model keywords
  if echo "$prompt" | grep -qiE "multi-model|parallel.*review|consensus|multiple.*models"; then
    return 0
  fi

  return 1
}

# Check if pre-launch setup appears complete
# CONSENSUS FIX: Use file-based marker instead of environment variables
check_prelaunch_setup() {
  local tracking_marker="/tmp/.claude-multi-model-active"

  # Check for tracking marker file
  if [[ -f "$tracking_marker" ]]; then
    local session_dir
    session_dir=$(cat "$tracking_marker")

    # Verify tracking file exists in session directory
    if [[ -f "$session_dir/tracking.md" ]]; then
      return 0
    fi
  fi

  return 1
}

# Main logic
if is_multi_model_task "$TASK_PROMPT"; then
  if ! check_prelaunch_setup; then
    # Tracking setup missing - provide warning

    # Check if strict mode is enabled (optional blocking)
    if [[ "${CLAUDE_STRICT_TRACKING:-false}" == "true" ]]; then
      # Strict mode: BLOCK execution
      cat << 'EOF' >&3
{
  "error": "STRICT MODE: Tracking setup required before launching multi-model tasks. See orchestration:model-tracking-protocol skill for setup instructions."
}
EOF
      exit 1
    else
      # Normal mode: WARN but allow execution
      cat << 'EOF' >&3
{
  "additionalContext": "## PRE-LAUNCH WARNING: Tracking Setup Missing

This Task call appears to be launching an external model for multi-model validation, but tracking infrastructure was not detected.

**Before launching external models, you MUST:**

1. Create session directory:
   ```bash
   SESSION_ID=\"review-$(date +%Y%m%d-%H%M%S)-$(head -c 4 /dev/urandom | xxd -p)\"
   SESSION_DIR=\"/tmp/${SESSION_ID}\"
   mkdir -p \"$SESSION_DIR\"
   ```

2. Record start time:
   ```bash
   SESSION_START=$(date +%s)
   ```

3. Create tracking table:
   ```bash
   cat > \"$SESSION_DIR/tracking.md\" << 'TRACKING'
   | Model | Status | Time | Issues | Quality |
   |-------|--------|------|--------|---------|
   TRACKING
   ```

4. Create tracking marker:
   ```bash
   echo \"$SESSION_DIR\" > /tmp/.claude-multi-model-active
   ```

Without this setup, you will lose timing data and cannot create proper results.

**See:** `orchestration:model-tracking-protocol` skill for complete pre-launch checklist and templates.

**Optional Strict Mode:** Set `CLAUDE_STRICT_TRACKING=true` to BLOCK execution when tracking is missing."
}
EOF
    fi
  fi
fi

exit 0

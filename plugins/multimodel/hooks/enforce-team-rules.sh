#!/bin/bash
set -u
# ============================================================================
# enforce-team-rules.sh
# PreToolUse hook that blocks orchestration violations in /team workflows
#
# Intercepted tools: Task, Bash
# Protocol: reads JSON from stdin, writes JSON to fd3 (or stdout)
#
# Rules enforced:
#   1. /team Task calls must use dev:researcher agent (vote template detection)
#   2. claudish Bash calls must include --agent flag
#   3. Session files must not use /tmp/ paths
#
# Fail-open: parse errors default to ALLOW (never block due to own bugs)
# ============================================================================

# Read hook input from stdin
INPUT=$(cat)

# Parse tool name directly from raw input (avoids intermediate variable issues)
TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // empty' 2>/dev/null || true)

# If we can't parse, allow (never block due to own bugs)
if [ -z "${TOOL_NAME}" ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}' >&3 2>/dev/null || \
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
  exit 0
fi

# --------------------------------------------------------------------------
# Helper: output allow/deny decision
# --------------------------------------------------------------------------
allow() {
  local json='{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
  echo "${json}" >&3 2>/dev/null || echo "${json}"
  exit 0
}

deny() {
  local reason="$1"
  local json
  json=$(jq -nc --arg reason "${reason}" \
    '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":$reason}}')
  echo "${json}" >&3 2>/dev/null || echo "${json}"
  exit 0
}

# --------------------------------------------------------------------------
# RULE: Task tool validation
# --------------------------------------------------------------------------
if [ "${TOOL_NAME}" = "Task" ]; then
  # Parse directly from raw INPUT to avoid multi-line JSON issues
  SUBAGENT=$(echo "${INPUT}" | jq -r '.tool_input.subagent_type // empty' 2>/dev/null || true)
  PROMPT=$(echo "${INPUT}" | jq -r '.tool_input.prompt // empty' 2>/dev/null || true)

  # RULE 1: /team workflow enforcement (detect by vote block pattern in prompt)
  if echo "${PROMPT}" | grep -q "Team Vote: Independent Review Request\|VERDICT:.*APPROVE\|Required Vote Format"; then
    if [ -n "${SUBAGENT}" ] && [ "${SUBAGENT}" != "dev:researcher" ]; then
      deny "BLOCKED: /team workflow must use subagent_type 'dev:researcher', not '${SUBAGENT}'. The agent for /team internal models is always dev:researcher."
    fi
  fi

  # RULE 3: No /tmp/ paths in Task prompts (session directory enforcement)
  if echo "${PROMPT}" | grep -q "/tmp/"; then
    deny "BLOCKED: Task prompt contains /tmp/ path. Use ai-docs/sessions/ for session files."
  fi

  allow
fi

# --------------------------------------------------------------------------
# RULE: Bash tool validation (claudish --agent enforcement)
# --------------------------------------------------------------------------
if [ "${TOOL_NAME}" = "Bash" ]; then
  COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // empty' 2>/dev/null || true)

  # Only enforce on commands that invoke claudish
  if echo "${COMMAND}" | grep -qi "claudish"; then
    # Skip existence checks (which claudish, command -v claudish, type claudish)
    if echo "${COMMAND}" | grep -qE "^(which |command -v |type )"; then
      allow
    fi

    # RULE 2: claudish calls must include --agent
    if ! echo "${COMMAND}" | grep -q "\-\-agent"; then
      deny "BLOCKED: claudish invocation missing --agent flag. Always specify --agent for specialized agent capabilities."
    fi
  fi

  allow
fi

# --------------------------------------------------------------------------
# Default: allow all other tools
# --------------------------------------------------------------------------
allow

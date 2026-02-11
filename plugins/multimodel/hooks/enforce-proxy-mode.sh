#!/bin/bash
set -u
# ============================================================================
# enforce-proxy-mode.sh
# PreToolUse hook that blocks orchestration violations in /team workflows
#
# Intercepted tools: Task, Bash
# Protocol: reads JSON from stdin, writes JSON to fd3 (or stdout)
#
# Rules enforced:
#   1. PROXY_MODE in Task prompt requires PROXY_MODE-enabled agent
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
# PROXY_MODE-enabled agents list (must match resolve-agents.sh)
# Synced with plugins/multimodel/skills/proxy-mode-reference/SKILL.md
# --------------------------------------------------------------------------
PROXY_AGENTS="dev:researcher dev:developer dev:debugger dev:architect dev:test-architect dev:devops dev:ui agentdev:reviewer agentdev:architect agentdev:developer frontend:plan-reviewer frontend:reviewer frontend:architect frontend:designer frontend:developer frontend:ui-developer frontend:css-developer frontend:test-architect seo:analyst seo:editor seo:writer seo:researcher seo:data-analyst"

is_proxy_agent() {
  local agent="$1"
  for pa in ${PROXY_AGENTS}; do
    [ "${agent}" = "${pa}" ] && return 0
  done
  return 1
}

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

  # Only enforce on prompts that contain PROXY_MODE (scopes to /team usage)
  # Check both the jq-expanded prompt AND the raw input string
  HAS_PROXY=false
  if echo "${PROMPT}" | grep -qi "PROXY_MODE"; then
    HAS_PROXY=true
  elif echo "${INPUT}" | grep -qi "PROXY_MODE"; then
    HAS_PROXY=true
  fi

  if [ "${HAS_PROXY}" = true ]; then
    # RULE 1: PROXY_MODE requires a compatible agent
    if [ -n "${SUBAGENT}" ] && ! is_proxy_agent "${SUBAGENT}"; then
      deny "BLOCKED: PROXY_MODE used with incompatible agent '${SUBAGENT}'. Use dev:researcher as subagent_type."
    fi
  fi

  # RULE 1b: /team workflow enforcement (detect by vote block pattern in prompt)
  if echo "${PROMPT}" | grep -q "Team Vote: Independent Review Request\|VERDICT:.*APPROVE\|Required Vote Format"; then
    if [ -n "${SUBAGENT}" ] && [ "${SUBAGENT}" != "dev:researcher" ]; then
      deny "BLOCKED: /team workflow must use subagent_type 'dev:researcher', not '${SUBAGENT}'. The agent for /team is always dev:researcher."
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

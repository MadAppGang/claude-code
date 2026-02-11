#!/bin/bash
set -euo pipefail

# ============================================================================
# resolve-agents.sh
# Deterministic agent/method resolution for /team command
#
# Removes LLM decision-making from agent selection entirely.
# Takes model list + task type, returns JSON resolution per model.
#
# Usage:
#   bash resolve-agents.sh --models "internal,x-ai/grok-code-fast-1" --task-type "investigation"
#
# Output: JSON to stdout with resolved agent, method, and session directory
# ============================================================================

# --------------------------------------------------------------------------
# Parse arguments
# --------------------------------------------------------------------------
MODELS=""
TASK_TYPE="investigation"
TASK_SLUG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --models)    MODELS="$2"; shift 2 ;;
    --task-type) TASK_TYPE="$2"; shift 2 ;;
    --task-slug) TASK_SLUG="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [ -z "${MODELS}" ]; then
  echo '{"error": "Missing --models argument"}' >&2
  exit 1
fi

# --------------------------------------------------------------------------
# PROXY_MODE-enabled agents: single source of truth
# --------------------------------------------------------------------------

# Full list of all PROXY_MODE-enabled agents
# Synced with plugins/multimodel/skills/proxy-mode-reference/SKILL.md
# When adding agents: update this list, enforce-proxy-mode.sh, and analyze-team-transcript.sh
PROXY_AGENTS="dev:researcher dev:developer dev:debugger dev:architect dev:test-architect dev:devops dev:ui agentdev:reviewer agentdev:architect agentdev:developer frontend:plan-reviewer frontend:reviewer frontend:architect frontend:designer frontend:developer frontend:ui-developer frontend:css-developer frontend:test-architect seo:analyst seo:editor seo:writer seo:researcher seo:data-analyst"

# --------------------------------------------------------------------------
# Helper: check if agent is in PROXY_AGENTS list
# --------------------------------------------------------------------------
is_proxy_agent() {
  local agent="$1"
  for pa in ${PROXY_AGENTS}; do
    [ "${agent}" = "${pa}" ] && return 0
  done
  return 1
}

# --------------------------------------------------------------------------
# Resolve agent for task type (case statement for bash 3.2 compatibility)
# --------------------------------------------------------------------------
resolve_agent() {
  local task_type="$1"
  local normalized
  normalized=$(echo "${task_type}" | tr '[:upper:]' '[:lower:]')

  case "${normalized}" in
    investigation|research|analyze)
      echo "dev:researcher" ;;
    debugging|debug|trace)
      echo "dev:debugger" ;;
    review|audit|check|validate)
      echo "agentdev:reviewer" ;;
    architecture|design|plan)
      echo "dev:architect" ;;
    implementation|coding|build|create)
      echo "dev:developer" ;;
    testing|test|coverage)
      echo "dev:test-architect" ;;
    devops|infrastructure|deploy)
      echo "dev:devops" ;;
    ui|frontend|component)
      echo "dev:ui" ;;
    *)
      # Default: dev:researcher (always PROXY_MODE-enabled)
      echo "dev:researcher" ;;
  esac
}

# --------------------------------------------------------------------------
# Generate session directory
# --------------------------------------------------------------------------
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RANDOM_SUFFIX=$(head -c 4 /dev/urandom | xxd -p)

if [ -z "${TASK_SLUG}" ]; then
  TASK_SLUG="team"
fi

SESSION_DIR="ai-docs/sessions/team-${TASK_SLUG}-${TIMESTAMP}-${RANDOM_SUFFIX}"

# --------------------------------------------------------------------------
# Resolve each model
# --------------------------------------------------------------------------
AGENT=$(resolve_agent "${TASK_TYPE}")

# Build JSON output
RESOLUTIONS="["
FIRST=true

IFS=',' read -ra MODEL_ARRAY <<< "${MODELS}"
for model_id in "${MODEL_ARRAY[@]}"; do
  # Trim whitespace
  model_id=$(echo "${model_id}" | xargs)

  if [ -z "${model_id}" ]; then
    continue
  fi

  if [ "${FIRST}" = true ]; then
    FIRST=false
  else
    RESOLUTIONS+=","
  fi

  # Determine method based on model type
  if [ "${model_id}" = "internal" ]; then
    # "internal" = use the specialized agent directly (no PROXY_MODE, no claudish)
    METHOD="direct"
    REASON="Internal Claude via '${AGENT}' agent (no PROXY_MODE needed)"
  else
    # External models use PROXY_MODE with the specialized agent
    METHOD="proxy_mode"
    REASON="PROXY_MODE agent '${AGENT}' matches ${TASK_TYPE} task"
  fi

  RESOLUTIONS+=$(jq -nc \
    --arg modelId "${model_id}" \
    --arg method "${METHOD}" \
    --arg agent "${AGENT}" \
    --arg reason "${REASON}" \
    '{modelId: $modelId, method: $method, agent: $agent, reason: $reason}')
done

RESOLUTIONS+="]"

# --------------------------------------------------------------------------
# Output final JSON
# --------------------------------------------------------------------------
jq -nc \
  --arg sessionDir "${SESSION_DIR}" \
  --arg taskType "${TASK_TYPE}" \
  --argjson resolutions "${RESOLUTIONS}" \
  '{sessionDir: $sessionDir, taskType: $taskType, resolutions: $resolutions}'

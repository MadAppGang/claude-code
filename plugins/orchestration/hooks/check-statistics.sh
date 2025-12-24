#!/bin/bash
# =============================================================================
# SUBAGENT STOP HOOK - CHECK MULTI-MODEL VALIDATION COMPLETENESS (v2.0)
# =============================================================================
# Enhanced hook that checks for 5 required components:
# 1. Tracking table creation
# 2. Per-model timing data
# 3. Failure documentation (if any failed)
# 4. Consensus analysis
# 5. Statistics collection
#
# Version 2.0 provides more specific feedback on what's missing.
# =============================================================================

set -euo pipefail

# Read tool input (contains agent output and metadata)
TOOL_INPUT=$(cat)

# Extract agent output to check for multi-model patterns
AGENT_OUTPUT=$(echo "$TOOL_INPUT" | jq -r '.output // empty' 2>/dev/null || echo "")

# Check if this looks like a multi-model validation task
is_multi_model() {
  local output="$1"

  # Check for common multi-model indicators
  if echo "$output" | grep -qiE "grok|gemini|gpt-5|deepseek|claudish|multi-model|parallel.*review|consensus"; then
    return 0
  fi

  # Check for multiple model mentions
  local model_count=$(echo "$output" | grep -oiE "(grok|gemini|gpt-5|deepseek|qwen|mistral)" | wc -l)
  if [ "$model_count" -ge 2 ]; then
    return 0
  fi

  return 1
}

# Component 1: Check for tracking table
has_tracking_table() {
  local output="$1"
  echo "$output" | grep -qiE "Model.*Status.*Time|tracking\.md|Model Performance"
}

# Component 2: Check for timing data
has_timing_data() {
  local output="$1"
  echo "$output" | grep -qiE "[0-9]+s|Duration:|Speedup:|sequential.*parallel|parallel.*time"
}

# Component 3: Check for failure documentation (if failures exist)
has_failure_docs() {
  local output="$1"

  # Check if there were failures
  local total=$(echo "$output" | grep -oiE "([0-9]+) of ([0-9]+)|([0-9]+)/([0-9]+)" | head -1)
  if [[ -n "$total" ]]; then
    # Extract success and total counts
    local success=$(echo "$total" | grep -oE "^[0-9]+" | head -1)
    local requested=$(echo "$total" | grep -oE "[0-9]+$" | tail -1)

    if [[ "$success" -lt "$requested" ]]; then
      # Failures exist - check for documentation
      if echo "$output" | grep -qiE "Failed Models|Failure|Error.*:|timeout|API.*error|Failure Type"; then
        return 0
      else
        return 1
      fi
    fi
  fi

  # No failures detected, no documentation needed
  return 0
}

# Component 4: Check for consensus analysis
has_consensus() {
  local output="$1"
  echo "$output" | grep -qiE "consensus|UNANIMOUS|STRONG|DIVERGENT|agreement|[0-9]/[0-9].*model|Consensus Analysis|flagged by"
}

# Component 5: Check for statistics collection
has_statistics() {
  local output="$1"
  echo "$output" | grep -qiE "llm-performance\.json|track_model_performance|record_session_stats|Model Performance|Session Statistics|Speedup:|Statistics.*saved|Performance.*logged"
}

# Check if the performance file exists and was recently updated
check_perf_file() {
  local perf_file="ai-docs/llm-performance.json"

  if [ ! -f "$perf_file" ]; then
    return 1
  fi

  # Check if updated in last 5 minutes
  local now=$(date +%s)
  local file_mod=$(stat -f %m "$perf_file" 2>/dev/null || stat -c %Y "$perf_file" 2>/dev/null || echo 0)
  local age=$((now - file_mod))

  if [ "$age" -lt 300 ]; then
    return 0
  fi

  return 1
}

# Main logic
if [ -z "$AGENT_OUTPUT" ]; then
  # No output to analyze
  exit 0
fi

# Check if this was multi-model validation
if is_multi_model "$AGENT_OUTPUT"; then
  # This looks like multi-model work - check all 5 components

  missing=()

  has_tracking_table "$AGENT_OUTPUT" || missing+=("tracking table")
  has_timing_data "$AGENT_OUTPUT" || missing+=("timing data")
  has_failure_docs "$AGENT_OUTPUT" || missing+=("failure documentation")
  has_consensus "$AGENT_OUTPUT" || missing+=("consensus analysis")
  has_statistics "$AGENT_OUTPUT" || missing+=("statistics collection")

  # Double-check statistics with file timestamp if not in output
  if [[ " ${missing[@]} " =~ " statistics collection " ]]; then
    if check_perf_file; then
      # File was updated recently, remove from missing
      missing=("${missing[@]/statistics collection}")
    fi
  fi

  if [ ${#missing[@]} -gt 0 ]; then
    # Build comma-separated list
    missing_list=$(printf ", %s" "${missing[@]}")
    missing_list=${missing_list:2}  # Remove leading ", "

    cat << EOF >&3
{
  "additionalContext": "## INCOMPLETE MULTI-MODEL VALIDATION

This task appears to involve multi-model validation but is missing required components:

**Missing:** ${missing_list}

**Required for complete validation:**

1. **Tracking Table** - Per-model status, time, issues, quality
   - Template: \`$SESSION_DIR/tracking.md\`
   - Should contain: Model | Status | Time | Issues | Quality

2. **Timing Data** - Duration per model, parallel vs sequential
   - Record: \`SESSION_START=\$(date +%s)\` before launching
   - Calculate: Speedup = sequential / parallel

3. **Failure Documentation** - Why each failed model failed
   - For each failure: Model, Type, Error, Retry status
   - Write to: \`$SESSION_DIR/failures.md\`

4. **Consensus Analysis** - Which models agree on which issues
   - UNANIMOUS: All models agree
   - STRONG: ≥67% agree
   - MAJORITY: ≥50% agree
   - Write to: \`$SESSION_DIR/consensus.md\`

5. **Statistics** - Saved to ai-docs/llm-performance.json
   - Call: \`track_model_performance()\` for each model
   - Call: \`record_session_stats()\` for session

See \`orchestration:model-tracking-protocol\` skill for templates and complete protocols."
}
EOF
  else
    # All components present - provide positive feedback
    cat << 'EOF' >&3
{
  "additionalContext": "✓ Multi-model validation complete. All required components present (tracking, timing, failures, consensus, statistics)."
}
EOF
  fi
fi

exit 0

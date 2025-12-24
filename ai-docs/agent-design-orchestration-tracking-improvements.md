# Design: Orchestration Plugin Tracking Improvements v0.6.0

**Design Version:** 1.0.0
**Target Plugin Version:** 0.6.0
**Date:** 2025-12-24
**Status:** Design Complete - Ready for Implementation

## Executive Summary

This design addresses a critical failure mode in multi-model orchestration where agents launch external models but fail to properly track, collect, and present structured results. The user experienced:

- 8 models launched but only casual "2 of 8 succeeded" tracking
- No structured tracking table created before launch
- No consensus analysis or comparison of findings
- Failed models not reported with reasons
- No statistics collected (tokens, time, success rate)

**Solution:** Add MANDATORY pre-launch tracking templates, enhanced enforcement hooks, and a new `model-tracking-protocol` skill that makes proper tracking **unforgettable**.

---

## Table of Contents

1. [Problem Analysis](#problem-analysis)
2. [Current State Assessment](#current-state-assessment)
3. [Proposed Changes](#proposed-changes)
4. [New Skill: model-tracking-protocol](#new-skill-model-tracking-protocol)
5. [Hook Enhancements](#hook-enhancements)
6. [Multi-Model-Validation Skill Updates](#multi-model-validation-skill-updates)
7. [Implementation Priority](#implementation-priority)
8. [Migration Notes](#migration-notes)
9. [Testing Strategy](#testing-strategy)

---

## Problem Analysis

### User's Failure Analysis

| Expected Behavior | What Actually Happened |
|-------------------|------------------------|
| Create structured tracking of all 8 models | Launched agents without tracking framework |
| Collect statistics (tokens, time, success) | Only noted "2 of 8 succeeded" casually |
| Compare findings across models | Added feedback piecemeal, no comparison |
| Show consensus analysis | No identification of agreement/disagreement |
| Report failed models with reasons | Glossed over failures |
| Create consolidated results table | No unified view |

### Root Causes Identified

1. **No Upfront Tracking Structure** - Agent launched models without first creating a tracking table
2. **Ignored Skill Instructions** - The skill has result collection protocols, but they're guidance, not enforcement
3. **No Consensus Detection** - Even when models succeeded, no cross-model comparison happened
4. **Missing Statistics** - Timing, tokens, quality scores not captured even when available
5. **No Pre-Launch Checkpoint** - Nothing stopped the agent from proceeding without setup

### Key Insight

The current `multi-model-validation` skill is comprehensive (2,178 lines) but relies on the agent reading and following instructions. When agents are in "execution mode," they often skip to action without proper setup.

**Solution Principle:** Make tracking MANDATORY and UNFORGETTABLE through:
- Required pre-launch actions that block proceeding without completion
- Hook-based enforcement that intervenes during execution
- Templates that must be instantiated before model launches

---

## Current State Assessment

### What Exists (v0.5.0)

| Component | Status | Gap |
|-----------|--------|-----|
| `multi-model-validation` skill | 2,178 lines, comprehensive | Patterns exist but not enforced |
| `check-statistics.sh` SubagentStop hook | Checks for statistics mentions | Only warns AFTER completion, doesn't prevent proceeding |
| `session-start.sh` hook | Checks claudish availability | No tracking protocol reminder |
| Examples (3 files) | Show proper tracking | Not referenced during execution |
| CLAUDE.md injection | 4-Message Pattern rules | No tracking table requirement |

### What's Missing

1. **Pre-Launch Enforcement** - Nothing ensures tracking table exists before Task calls
2. **Per-Model Tracking During Execution** - No structured way to track as models complete
3. **Failure Reporting Template** - No standard format for failed model documentation
4. **Consensus Analysis Trigger** - Agent may skip consolidation entirely
5. **Results Presentation Template** - No required format for final output

---

## Proposed Changes

### Change Overview

| Change | Type | Priority | Effort |
|--------|------|----------|--------|
| New `model-tracking-protocol` skill | Skill | CRITICAL | High |
| Enhanced `check-statistics.sh` hook | Hook Update | HIGH | Medium |
| New `pre-launch-check.sh` PreToolUse hook | New Hook | HIGH | Medium |
| Updates to `multi-model-validation` skill | Skill Update | MEDIUM | Medium |
| Updates to `claude-md-rules.md` template | Template Update | LOW | Low |

### Architecture Decision: Separate Skill vs. Integrated

**Decision:** Create NEW separate skill `model-tracking-protocol` rather than expanding `multi-model-validation`.

**Rationale:**
- `multi-model-validation` is already 2,178 lines - adding more risks information overload
- Tracking protocol is distinct from execution patterns (separation of concerns)
- Agents can reference both skills when needed
- Easier to maintain and version independently
- Allows targeted loading (some agents need tracking without full validation knowledge)

---

## New Skill: model-tracking-protocol

### Skill Metadata

```yaml
---
name: model-tracking-protocol
description: MANDATORY tracking protocol for multi-model validation. Creates structured tracking tables BEFORE launching models, tracks progress during execution, and ensures complete results presentation. Use when running 2+ external AI models in parallel. Trigger keywords - "multi-model", "parallel review", "external models", "consensus", "model tracking".
version: 1.0.0
tags: [orchestration, tracking, multi-model, statistics, mandatory]
keywords: [tracking, mandatory, pre-launch, statistics, consensus, results, failures]
---
```

### Skill Content Structure

```
model-tracking-protocol/SKILL.md (~600-800 lines)

1. MANDATORY Pre-Launch Checklist
2. Tracking Table Templates
3. Per-Model Status Updates
4. Failure Documentation Protocol
5. Consensus Analysis Requirements
6. Results Presentation Template
7. Common Failures and Prevention
8. Integration Examples
```

### Key Sections

#### Section 1: MANDATORY Pre-Launch Checklist

```markdown
## MANDATORY: Pre-Launch Checklist

**You MUST complete ALL items before launching ANY external models.**

This is NOT optional. If you skip this, your multi-model validation is INCOMPLETE.

### Checklist (Copy and Complete)

```
PRE-LAUNCH VERIFICATION (complete before Task calls):

[ ] 1. SESSION_ID created: ________________________
[ ] 2. SESSION_DIR created: ________________________
[ ] 3. Tracking table written to: $SESSION_DIR/tracking.md
[ ] 4. Start time recorded: SESSION_START=$(date +%s)
[ ] 5. Model list confirmed (comma-separated): ________________________
[ ] 6. Per-model timing arrays initialized
[ ] 7. Code context written to session directory

If ANY item is unchecked, STOP and complete it before proceeding.
```

### Why Pre-Launch Matters

Without pre-launch setup, you will:
- Lose timing data (cannot calculate speed accurately)
- Miss failed model details (no structured place to record)
- Skip consensus analysis (no model list to compare)
- Present incomplete results (no tracking table to populate)

### Pre-Launch Script Template

```bash
#!/bin/bash
# Run this BEFORE launching any Task calls

# 1. Create unique session
SESSION_ID="review-$(date +%Y%m%d-%H%M%S)-$(head -c 4 /dev/urandom | xxd -p)"
SESSION_DIR="/tmp/${SESSION_ID}"
mkdir -p "$SESSION_DIR"

# 2. Record start time
SESSION_START=$(date +%s)

# 3. Create tracking table
cat > "$SESSION_DIR/tracking.md" << 'EOF'
# Multi-Model Tracking

## Session Info
- Session ID: ${SESSION_ID}
- Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- Models Requested: [FILL]

## Model Status

| Model | Agent ID | Status | Start | End | Duration | Issues | Quality | Notes |
|-------|----------|--------|-------|-----|----------|--------|---------|-------|
| [MODEL 1] | | pending | | | | | | |
| [MODEL 2] | | pending | | | | | | |
| [MODEL 3] | | pending | | | | | | |

## Failures

| Model | Failure Type | Error Message | Retry? |
|-------|--------------|---------------|--------|

## Consensus

| Issue | Model 1 | Model 2 | Model 3 | Agreement |
|-------|---------|---------|---------|-----------|

EOF

# 4. Initialize timing arrays
declare -A MODEL_START_TIMES
declare -A MODEL_END_TIMES
declare -A MODEL_STATUS

echo "Pre-launch setup complete. Session: $SESSION_ID"
echo "Tracking table: $SESSION_DIR/tracking.md"
```
```

#### Section 2: Tracking Table Templates

```markdown
## Tracking Table Templates

### Template A: Simple Model Tracking (3-5 models)

```markdown
| Model | Status | Time | Issues | Quality | Cost |
|-------|--------|------|--------|---------|------|
| claude-embedded | pending | - | - | - | FREE |
| x-ai/grok-code-fast-1 | pending | - | - | - | - |
| qwen/qwen3-coder:free | pending | - | - | - | FREE |
```

### Template B: Detailed Model Tracking (6+ models)

```markdown
## Model Execution Status

### Summary
- Total Requested: 8
- Completed: 0
- In Progress: 0
- Failed: 0
- Pending: 8

### Detailed Status

| # | Model | Provider | Status | Start | Duration | Issues | Quality | Cost | Error |
|---|-------|----------|--------|-------|----------|--------|---------|------|-------|
| 1 | claude-embedded | Anthropic | pending | - | - | - | - | FREE | - |
| 2 | x-ai/grok-code-fast-1 | X-ai | pending | - | - | - | - | - | - |
| 3 | qwen/qwen3-coder:free | Qwen | pending | - | - | - | - | FREE | - |
| 4 | google/gemini-3-pro | Google | pending | - | - | - | - | - | - |
| 5 | openai/gpt-5.1-codex | OpenAI | pending | - | - | - | - | - | - |
| 6 | mistralai/devstral | Mistral | pending | - | - | - | - | FREE | - |
| 7 | deepseek/deepseek-r1 | DeepSeek | pending | - | - | - | - | - | - |
| 8 | anthropic/claude-sonnet | Anthropic | pending | - | - | - | - | - | - |
```

### Update Protocol

As each model completes, IMMEDIATELY update:

1. Status: pending -> in_progress -> success/failed/timeout
2. Duration: Calculate from start time
3. Issues: Number of issues found
4. Quality: Percentage if calculable
5. Error: If failed, brief error message
```

#### Section 3: Per-Model Status Updates

```markdown
## Per-Model Status Update Protocol

### IMMEDIATELY After Each Model Completes

Do NOT wait until all models finish. Update tracking AS EACH COMPLETES.

### Update Script

```bash
# Call this when each model completes
update_model_status() {
  local model="$1"
  local status="$2"
  local issues="${3:-0}"
  local quality="${4:-}"
  local error="${5:-}"

  local end_time=$(date +%s)
  local start_time="${MODEL_START_TIMES[$model]}"
  local duration=$((end_time - start_time))

  # Update arrays
  MODEL_END_TIMES["$model"]=$end_time
  MODEL_STATUS["$model"]="$status"

  # Log update
  echo "Model: $model"
  echo "Status: $status"
  echo "Duration: ${duration}s"
  echo "Issues: $issues"
  echo "Quality: ${quality:-N/A}"
  [[ -n "$error" ]] && echo "Error: $error"

  # Track performance
  if [[ "$status" == "success" ]]; then
    track_model_performance "$model" "success" "$duration" "$issues" "$quality"
  else
    track_model_performance "$model" "$status" "$duration" 0 ""
  fi
}

# Usage examples:
update_model_status "claude-embedded" "success" 8 95
update_model_status "x-ai/grok-code-fast-1" "success" 6 87
update_model_status "some-model" "timeout" 0 "" "Exceeded 120s limit"
update_model_status "other-model" "failed" 0 "" "API 500 error"
```

### Status Values

| Status | Meaning | Action |
|--------|---------|--------|
| pending | Not started | Wait |
| in_progress | Currently executing | Monitor |
| success | Completed successfully | Collect results |
| failed | Error during execution | Document error |
| timeout | Exceeded time limit | Note timeout |
| cancelled | User cancelled | Note cancellation |
```

#### Section 4: Failure Documentation Protocol

```markdown
## Failure Documentation Protocol

**EVERY failed model MUST be documented with:**
1. Model name
2. Failure type (timeout, API error, parse error, etc.)
3. Error message (exact or summarized)
4. Whether retry was attempted

### Failure Report Template

```markdown
## Failed Models Report

### Model: x-ai/grok-code-fast-1
- **Failure Type:** API Error
- **Error Message:** "500 Internal Server Error from OpenRouter"
- **Retry Attempted:** Yes, 1 retry, same error
- **Impact:** Review results based on 2/3 models instead of 3

### Model: google/gemini-3-pro
- **Failure Type:** Timeout
- **Error Message:** "Exceeded 120s limit, response incomplete"
- **Retry Attempted:** No, time constraints
- **Impact:** Lost Gemini perspective, consensus based on remaining models
```

### Failure Categorization

| Category | Common Causes | Recovery |
|----------|---------------|----------|
| **Timeout** | Model slow, large input, network latency | Retry with extended timeout |
| **API Error** | Provider down, rate limit, auth issue | Wait and retry, check API status |
| **Parse Error** | Malformed response, encoding issue | Retry, simplify prompt |
| **Auth Error** | Invalid API key, expired token | Check credentials |
| **Context Limit** | Input too large for model | Reduce context, split task |

### Failure Summary Table

Always include this in final results:

```markdown
## Execution Summary

| Metric | Value |
|--------|-------|
| Models Requested | 8 |
| Successful | 5 (62.5%) |
| Failed | 3 (37.5%) |

### Failed Models

| Model | Failure | Recoverable? |
|-------|---------|--------------|
| grok-code-fast-1 | API 500 | Yes - retry later |
| gemini-3-pro | Timeout | Yes - extend limit |
| deepseek-r1 | Auth Error | No - check key |
```
```

#### Section 5: Consensus Analysis Requirements

```markdown
## Consensus Analysis Requirements

**After ALL models complete (or max wait time), you MUST perform consensus analysis.**

This is NOT optional. Even with 2 successful models, compare their findings.

### Minimum Viable Consensus (2 models)

With only 2 models, consensus is simple:
- AGREE: Both found the same issue
- DISAGREE: Only one found the issue

```markdown
| Issue | Model 1 | Model 2 | Consensus |
|-------|---------|---------|-----------|
| SQL injection | Yes | Yes | AGREE |
| Missing validation | Yes | No | Model 1 only |
| Weak hashing | No | Yes | Model 2 only |
```

### Standard Consensus (3-5 models)

```markdown
| Issue | Claude | Grok | Gemini | Agreement |
|-------|--------|------|--------|-----------|
| SQL injection | Yes | Yes | Yes | UNANIMOUS (3/3) |
| Missing validation | Yes | Yes | No | STRONG (2/3) |
| Rate limiting | Yes | No | No | DIVERGENT (1/3) |
```

### Extended Consensus (6+ models)

For 6+ models, add summary statistics:

```markdown
## Consensus Summary

- **Unanimous Issues (100%):** 3 issues
- **Strong Consensus (67%+):** 5 issues
- **Majority (50%+):** 2 issues
- **Divergent (<50%):** 4 issues

## Top 5 by Consensus

1. [6/6] SQL injection in search - FIX IMMEDIATELY
2. [6/6] Missing input validation - FIX IMMEDIATELY
3. [5/6] Weak password hashing - RECOMMENDED
4. [4/6] Missing rate limiting - CONSIDER
5. [3/6] Error handling gaps - INVESTIGATE
```

### NO Consensus Analysis = INCOMPLETE Review

If you present results without a consensus comparison, your review is INCOMPLETE.
```

#### Section 6: Results Presentation Template

```markdown
## Results Presentation Template

**Your final output MUST include ALL of these sections.**

### Required Output Format

```markdown
## Multi-Model Review Complete

### Execution Summary

| Metric | Value |
|--------|-------|
| Session ID | review-20251224-143052-a3f2 |
| Models Requested | 5 |
| Successful | 4 (80%) |
| Failed | 1 (20%) |
| Total Duration | 68s (parallel) |
| Sequential Equivalent | 245s |
| Speedup | 3.6x |

### Model Performance

| Model | Time | Issues | Quality | Status | Cost |
|-------|------|--------|---------|--------|------|
| claude-embedded | 32s | 8 | 95% | Success | FREE |
| x-ai/grok-code-fast-1 | 45s | 6 | 87% | Success | $0.002 |
| qwen/qwen3-coder:free | 52s | 5 | 82% | Success | FREE |
| openai/gpt-5.1-codex | 68s | 7 | 89% | Success | $0.015 |
| mistralai/devstral | - | - | - | Timeout | - |

### Failed Models

| Model | Failure | Error |
|-------|---------|-------|
| mistralai/devstral | Timeout | Exceeded 120s limit |

### Top Issues by Consensus

1. **[UNANIMOUS]** SQL injection in search endpoint
   - Flagged by: claude, grok, qwen, gpt-5 (4/4)
   - Severity: CRITICAL
   - Action: FIX IMMEDIATELY

2. **[UNANIMOUS]** Missing input validation
   - Flagged by: claude, grok, qwen, gpt-5 (4/4)
   - Severity: CRITICAL
   - Action: FIX IMMEDIATELY

3. **[STRONG]** Weak password hashing
   - Flagged by: claude, grok, gpt-5 (3/4)
   - Severity: HIGH
   - Action: RECOMMENDED

### Detailed Reports

- Consolidated review: $SESSION_DIR/consolidated-review.md
- Individual reviews: $SESSION_DIR/{model}-review.md

### Statistics Saved

- Performance data logged to: ai-docs/llm-performance.json
```

### Missing Section Detection

If ANY of these sections is missing, the review is INCOMPLETE:

- [ ] Execution Summary (models requested/successful/failed)
- [ ] Model Performance table (per-model times and quality)
- [ ] Failed Models section (if any failed)
- [ ] Top Issues by Consensus
- [ ] Statistics confirmation
```

#### Section 7: Common Failures and Prevention

```markdown
## Common Failures and Prevention

### Failure 1: No Tracking Table Created

**Symptom:** Results presented as prose, not structured data
**Prevention:** Always run pre-launch script FIRST
**Detection:** SubagentStop hook warns if no tracking found

### Failure 2: Timing Not Recorded

**Symptom:** "Duration: unknown" or missing speed stats
**Prevention:** Record SESSION_START before Task calls
**Detection:** Hook checks for timing data in output

### Failure 3: Failed Models Not Documented

**Symptom:** "2 of 8 succeeded" with no failure details
**Prevention:** Always check Task results and document failures
**Detection:** Hook checks for failure section when success < total

### Failure 4: No Consensus Analysis

**Symptom:** Individual model results listed without comparison
**Prevention:** After all complete, ALWAYS run consolidation
**Detection:** Hook checks for consensus keywords

### Failure 5: Statistics Not Saved

**Symptom:** No record in ai-docs/llm-performance.json
**Prevention:** Call track_model_performance() and record_session_stats()
**Detection:** Hook checks file modification time

### Prevention Checklist

Before presenting results, verify:

```
[ ] Tracking table exists and is populated
[ ] All model times recorded (or "timeout" noted)
[ ] All failures documented with error messages
[ ] Consensus analysis performed
[ ] Results match required output format
[ ] Statistics saved to llm-performance.json
```
```

---

## Hook Enhancements

### Enhancement 1: Pre-Launch Check Hook (NEW)

**Type:** PreToolUse hook for Task tool
**Purpose:** Intercept Task calls and verify tracking setup exists

```bash
#!/bin/bash
# =============================================================================
# PRE-LAUNCH CHECK HOOK - VERIFY TRACKING BEFORE MULTI-MODEL TASK CALLS
# =============================================================================
# This hook runs before Task tool calls. It checks if the task looks like
# multi-model validation and warns if tracking infrastructure is missing.
# =============================================================================

set -euo pipefail

TOOL_INPUT=$(cat)

# Extract task description/prompt
TASK_PROMPT=$(echo "$TOOL_INPUT" | jq -r '.prompt // .description // empty' 2>/dev/null || echo "")

# Check if this looks like a multi-model review task
is_multi_model_task() {
  local prompt="$1"

  # Look for proxy mode indicators
  if echo "$prompt" | grep -qiE "PROXY_MODE:|codex-code-reviewer|external.*model|claudish"; then
    return 0
  fi

  return 1
}

# Check if pre-launch setup appears complete
check_prelaunch_setup() {
  # Check for session directory
  if [[ -n "${SESSION_DIR:-}" ]] && [[ -d "$SESSION_DIR" ]]; then
    # Check for tracking file
    if [[ -f "$SESSION_DIR/tracking.md" ]]; then
      return 0
    fi
  fi

  # Check for timing variables
  if [[ -n "${SESSION_START:-}" ]]; then
    return 0
  fi

  return 1
}

# Main logic
if is_multi_model_task "$TASK_PROMPT"; then
  if ! check_prelaunch_setup; then
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
   echo \"| Model | Status | Time | Issues |\" > \"$SESSION_DIR/tracking.md\"
   ```

Without this setup, you will lose timing data and cannot create proper results.

See `orchestration:model-tracking-protocol` skill for complete setup."
}
EOF
  fi
fi

exit 0
```

### Enhancement 2: Improved check-statistics.sh

**Changes:**
- Check for tracking table presence
- Check for consensus analysis
- Check for failure documentation
- More specific warnings for each missing component

```bash
#!/bin/bash
# =============================================================================
# SUBAGENT STOP HOOK - CHECK MULTI-MODEL VALIDATION COMPLETENESS (v2.0)
# =============================================================================
# Enhanced hook that checks for:
# - Tracking table creation
# - Per-model statistics
# - Failure documentation
# - Consensus analysis
# - Results presentation format
# =============================================================================

set -euo pipefail

TOOL_INPUT=$(cat)
AGENT_OUTPUT=$(echo "$TOOL_INPUT" | jq -r '.output // empty' 2>/dev/null || echo "")

# Check if this was multi-model validation
is_multi_model() {
  if echo "$AGENT_OUTPUT" | grep -qiE "grok|gemini|gpt-5|deepseek|claudish|multi-model|parallel.*review|consensus"; then
    return 0
  fi
  local model_count=$(echo "$AGENT_OUTPUT" | grep -oiE "(grok|gemini|gpt-5|deepseek|qwen|mistral)" | wc -l)
  if [ "$model_count" -ge 2 ]; then
    return 0
  fi
  return 1
}

# Individual component checks
has_tracking_table() {
  echo "$AGENT_OUTPUT" | grep -qiE "Model.*Status.*Time|tracking\.md|Model Performance"
}

has_timing_data() {
  echo "$AGENT_OUTPUT" | grep -qiE "[0-9]+s|Duration:|Speedup:|sequential.*parallel"
}

has_failure_docs() {
  local total=$(echo "$AGENT_OUTPUT" | grep -oiE "([0-9]+) of ([0-9]+)" | head -1)
  if [[ -n "$total" ]]; then
    local success=$(echo "$total" | grep -oE "^[0-9]+")
    local requested=$(echo "$total" | grep -oE "[0-9]+$")
    if [[ "$success" -lt "$requested" ]]; then
      # Failures exist, check for documentation
      echo "$AGENT_OUTPUT" | grep -qiE "Failed Models|Failure|Error.*:|timeout|API.*error"
      return $?
    fi
  fi
  return 0  # No failures to document
}

has_consensus() {
  echo "$AGENT_OUTPUT" | grep -qiE "consensus|UNANIMOUS|STRONG|DIVERGENT|agreement|[0-9]/[0-9].*model"
}

has_statistics() {
  echo "$AGENT_OUTPUT" | grep -qiE "llm-performance\.json|track_model_performance|Statistics.*saved|Performance.*logged"
}

# Main logic
if [ -z "$AGENT_OUTPUT" ]; then
  exit 0
fi

if is_multi_model "$AGENT_OUTPUT"; then
  missing=()

  has_tracking_table || missing+=("tracking table")
  has_timing_data || missing+=("timing data")
  has_failure_docs || missing+=("failure documentation")
  has_consensus || missing+=("consensus analysis")
  has_statistics || missing+=("statistics collection")

  if [ ${#missing[@]} -gt 0 ]; then
    missing_list=$(printf ", %s" "${missing[@]}")
    missing_list=${missing_list:2}  # Remove leading ", "

    cat << EOF >&3
{
  "additionalContext": "## INCOMPLETE MULTI-MODEL VALIDATION

This task appears to involve multi-model validation but is missing required components:

**Missing:** ${missing_list}

**Required for complete validation:**

1. **Tracking Table** - Per-model status, time, issues, quality
2. **Timing Data** - Duration per model, parallel vs sequential
3. **Failure Documentation** - Why each failed model failed
4. **Consensus Analysis** - Which models agree on which issues
5. **Statistics** - Saved to ai-docs/llm-performance.json

See \`orchestration:model-tracking-protocol\` skill for templates and protocols."
}
EOF
  else
    cat << 'EOF' >&3
{
  "additionalContext": "Multi-model validation complete. All required components present."
}
EOF
  fi
fi

exit 0
```

### Enhancement 3: Session Start Reminder

**Add to session-start.sh:**

```bash
# Add after the claudish check section

# Remind about tracking protocol
cat << 'EOF' >&3
{
  "additionalContext": "## Multi-Model Tracking Protocol

When running multi-model validation, ALWAYS use the tracking protocol:

1. **Pre-Launch:** Create session, tracking table, record start time
2. **During:** Update status as each model completes
3. **Post:** Consensus analysis, failure docs, statistics

See \`orchestration:model-tracking-protocol\` for templates."
}
EOF
```

---

## Multi-Model-Validation Skill Updates

### Add Reference to New Skill

At the top of the skill, add:

```markdown
## Related Skills

- **orchestration:model-tracking-protocol** - MANDATORY tracking templates and protocols
- **orchestration:quality-gates** - Approval gates and severity classification
- **orchestration:todowrite-orchestration** - Progress tracking during execution
```

### Add Cross-Reference in Pattern 7

After the MANDATORY checklist section, add:

```markdown
### Complete Tracking Protocol

For the complete tracking protocol including:
- Pre-launch checklist
- Tracking table templates
- Failure documentation format
- Results presentation template

See: **orchestration:model-tracking-protocol**

The tracking protocol skill provides copy-paste templates that make compliance easy.
```

### Add Warning Box at Start

```markdown
> **CRITICAL: Tracking Protocol Required**
>
> Before using any patterns in this skill, ensure you have completed the
> pre-launch setup from `orchestration:model-tracking-protocol`.
>
> Launching models without tracking setup = INCOMPLETE validation.
```

---

## CLAUDE.md Template Updates

### Add to claude-md-rules.md

```markdown
## Multi-Model Tracking Protocol (NEW in v0.6.0)

When running multi-model validation:

### Pre-Launch (MANDATORY)

1. Create session directory: `SESSION_DIR=/tmp/review-{timestamp}`
2. Create tracking table: `$SESSION_DIR/tracking.md`
3. Record start time: `SESSION_START=$(date +%s)`

### During Execution

4. Update tracking as each model completes
5. Document any failures immediately

### Post-Completion (MANDATORY)

6. Create consensus analysis (compare model findings)
7. Document all failed models with reasons
8. Save statistics to `ai-docs/llm-performance.json`
9. Present results using required output format

**Missing any of these steps = INCOMPLETE validation**

See `orchestration:model-tracking-protocol` skill for complete templates.
```

---

## Implementation Priority

### Phase 1: Critical (Week 1)

| Item | Effort | Impact |
|------|--------|--------|
| Create `model-tracking-protocol` skill | High | Critical |
| Update `check-statistics.sh` hook | Medium | High |
| Add cross-references to existing skills | Low | Medium |

### Phase 2: High (Week 2)

| Item | Effort | Impact |
|------|--------|--------|
| Create `pre-launch-check.sh` hook | Medium | High |
| Update `session-start.sh` hook | Low | Medium |
| Update `claude-md-rules.md` template | Low | Medium |

### Phase 3: Polish (Week 3)

| Item | Effort | Impact |
|------|--------|--------|
| Add examples to skill | Medium | Medium |
| Update plugin README | Low | Low |
| Update plugin.json version | Low | Required |

---

## Migration Notes

### Backward Compatibility

**Fully Backward Compatible**

- New skill is additive, doesn't change existing behavior
- Hooks add warnings, don't block execution
- Existing commands continue to work
- New templates are opt-in until enforcement is proven

### For Existing Users

No changes required. New skill provides improved patterns that users can adopt incrementally.

### For Plugin Developers

Update command/agent frontmatter to reference new skill:

```yaml
skills: orchestration:multi-model-validation, orchestration:model-tracking-protocol
```

### Version Bump

Plugin version: 0.5.0 -> 0.6.0 (minor version, new features)

---

## Testing Strategy

### Test Case 1: Pre-Launch Hook Triggers

1. Launch Task with PROXY_MODE without setup
2. Verify hook warning appears
3. Verify execution continues (non-blocking)

### Test Case 2: Statistics Check Hook Detects Missing Components

1. Complete multi-model review without tracking
2. Verify hook identifies missing: tracking table, timing, consensus
3. Verify specific missing components are listed

### Test Case 3: Complete Happy Path

1. Follow full tracking protocol
2. Launch models with proper setup
3. Complete with consensus analysis
4. Verify hook confirms completeness

### Test Case 4: Partial Success Handling

1. Launch 5 models, 2 timeout
2. Verify failure documentation reminder if missing
3. Verify consensus works with partial data

---

## File Changes Summary

### New Files

| File | Type | Lines |
|------|------|-------|
| `skills/model-tracking-protocol/SKILL.md` | Skill | ~600-800 |
| `hooks/pre-launch-check.sh` | Hook | ~80 |

### Modified Files

| File | Changes |
|------|---------|
| `hooks/check-statistics.sh` | Enhanced detection (~100 -> ~150 lines) |
| `hooks/session-start.sh` | Add tracking reminder (~40 -> ~55 lines) |
| `skills/multi-model-validation/SKILL.md` | Add cross-references (~2,178 -> ~2,220 lines) |
| `templates/claude-md-rules.md` | Add tracking section (~70 -> ~100 lines) |
| `plugin.json` | Version bump, add new skill |
| `README.md` | Document new skill |

---

## Success Criteria

After implementation, the following scenarios should work correctly:

1. **Agent launches models without setup** -> Pre-launch hook warns, agent sets up tracking, proceeds correctly

2. **Agent completes with missing consensus** -> SubagentStop hook identifies missing consensus, agent adds it before presenting

3. **Agent follows protocol completely** -> SubagentStop hook confirms completeness, clean results presented

4. **Partial model success (3/5)** -> Failures documented, consensus based on successful models, statistics include failure info

5. **User sees structured results** -> Tracking table, per-model times, consensus analysis, failure documentation all present

---

## Design Completion Checklist

- [x] Problem analysis complete
- [x] Current state assessed
- [x] Solution architecture defined
- [x] New skill structure designed
- [x] Hook enhancements designed
- [x] Integration points identified
- [x] Migration notes provided
- [x] Testing strategy defined
- [x] Implementation priority established
- [x] Success criteria defined

---

**Design Status: READY FOR IMPLEMENTATION**

Next step: Implement using `agentdev:developer` or manually following this design document.

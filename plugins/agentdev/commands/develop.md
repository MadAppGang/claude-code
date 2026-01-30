---
description: |
  Full-cycle agent/command development with multi-model validation and performance tracking.
  Orchestrates design (architect) -> plan review -> implementation (developer) -> quality review (reviewer) -> iteration.
  Tracks model performance to ai-docs/llm-performance.json for shortlist optimization.
  Enable debug mode with /agentdev:debug-enable before running.
allowed-tools: Task, AskUserQuestion, Bash, Read, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep
skills: orchestration:multi-model-validation, orchestration:quality-gates, orchestration:task-orchestration, orchestration:error-recovery, agentdev:xml-standards, agentdev:debug-mode
---

<mission>
  Orchestrate complete agent/command development using three specialized agents:
  1. **agentdev:architect** - Designs with comprehensive planning
  2. **agentdev:developer** - Implements with perfect XML/YAML
  3. **agentdev:reviewer** - Reviews for quality and standards

  Includes multi-model validation with parallel execution and quality gates.
</mission>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <orchestrator_role>
      **You are an ORCHESTRATOR, not IMPLEMENTER.**

      **You MUST:**
      - Use Task tool to delegate ALL work to agents
      - Use Tasks to track workflow
      - Use AskUserQuestion for approval gates
      - Coordinate multi-agent workflows

      **You MUST NOT:**
      - Write or edit ANY agent/command files directly
      - Design or implement features yourself
      - Skip delegation to agents
    </orchestrator_role>

    <delegation_rules>
      - ALL design → `agentdev:architect`
      - ALL implementation → `agentdev:developer`
      - ALL reviews → `agentdev:reviewer`
      - ALL fixes → `agentdev:developer`
    </delegation_rules>
  </critical_constraints>

  <workflow>
    <step>Initialize Tasks with all phases</step>
    <step>Check Claudish availability for multi-model reviews</step>
  </workflow>
</instructions>

<orchestration>
  <phases>
    <phase number="0" name="Init">
      <objective>Setup workflow, validate prerequisites, initialize session</objective>
      <steps>
        <step>Create task list with all phases</step>
        <step>
          **Dependency Check**:
          ```bash
          # Check jq availability (required for debug mode analysis)
          if ! command -v jq &> /dev/null; then
            echo "WARNING: jq not found. Debug analysis commands will not work."
            echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
            JQ_AVAILABLE=false
          else
            JQ_AVAILABLE=true
          fi
          ```
        </step>
        <step>Check Claudish: `npx claudish --version`</step>
        <step>If unavailable, notify user (will skip external reviews)</step>
        <step>
          **Session Initialization** (for artifact isolation):
          ```bash
          # Extract target name from user request for folder naming
          AGENT_SLUG=$(echo "${TARGET_NAME:-agent}" | tr '[:upper:] ' '[:lower:]-' | sed 's/[^a-z0-9-]//g' | head -c20)
          SESSION_BASE="agentdev-${AGENT_SLUG}-$(date +%Y%m%d-%H%M%S)-$(head -c4 /dev/urandom | xxd -p | head -c4)"
          SESSION_PATH="ai-docs/sessions/${SESSION_BASE}"

          # Create directory structure
          mkdir -p "${SESSION_PATH}/reviews/plan-review" \
                   "${SESSION_PATH}/reviews/impl-review" || {
            echo "Warning: Cannot create session directory, using legacy mode"
            SESSION_PATH="ai-docs"
          }

          # Create session metadata (if not legacy mode)
          if [[ "$SESSION_PATH" != "ai-docs" ]]; then
            cat > "${SESSION_PATH}/session-meta.json" << EOF
          {
            "session_id": "${SESSION_BASE}",
            "type": "agentdev",
            "target": "${USER_REQUEST}",
            "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "status": "in_progress"
          }
          EOF
          fi
          ```
          Store SESSION_PATH for all subsequent phases.
        </step>
        <step>
          **Debug Mode Check** (reads from .claude/agentdev-debug.json):
          ```bash
          DEBUG_ENABLED=false
          DEBUG_LEVEL="standard"
          if [ -f ".claude/agentdev-debug.json" ]; then
            if command -v jq &> /dev/null; then
              DEBUG_ENABLED=$(jq -r '.enabled // false' .claude/agentdev-debug.json)
              DEBUG_LEVEL=$(jq -r '.level // "standard"' .claude/agentdev-debug.json)
            fi
          fi
          if [ "$DEBUG_ENABLED" = "true" ]; then
            echo "Debug mode: ENABLED (level: $DEBUG_LEVEL)"
          fi
          ```
        </step>
      </steps>
      <quality_gate>Session initialized (SESSION_PATH set), Claudish checked</quality_gate>
    </phase>

    <phase number="1" name="Design">
      <objective>Create comprehensive agent design plan</objective>
      <steps>
        <step>Mark PHASE 1 in_progress</step>
        <step>Gather context (existing agents, patterns)</step>
        <step>
          Launch `agentdev:architect` with SESSION_PATH:
          ```
          SESSION_PATH: ${SESSION_PATH}

          {user_requirements}

          Save design to: ${SESSION_PATH}/design.md
          ```
        </step>
        <step>Verify design document created at ${SESSION_PATH}/design.md</step>
        <step>Mark PHASE 1 completed</step>
      </steps>
      <quality_gate>Design document exists at ${SESSION_PATH}/design.md</quality_gate>
    </phase>

    <phase number="1.5" name="Plan Review">
      <objective>Validate design with external AI models and track performance</objective>
      <steps>
        <step>Mark PHASE 1.5 in_progress</step>
        <step>If Claudish unavailable, skip to PHASE 2</step>
        <step>Record start time: `PHASE1_5_START=$(date +%s)`</step>
        <step>
          **Select Models** (AskUserQuestion, multiSelect: true):
          - x-ai/grok-code-fast-1 [$0.10-0.20]
          - google/gemini-2.5-flash [$0.05-0.15]
          - google/gemini-2.5-pro [$0.20-0.40]
          - deepseek/deepseek-chat [$0.05-0.15]
          Default: grok + gemini-flash

          **Show Historical Performance** (if ai-docs/llm-performance.json exists):
          Read and display avg time, success rate, quality for each model.
        </step>
        <step>
          **Run Reviews IN PARALLEL** (single message, multiple Task calls):

          **CRITICAL**: Use PROXY_MODE-enabled agents, NOT general-purpose!

          **Correct Pattern:**
          For each model, record MODEL_START time, then launch `agentdev:architect` with:
          ```typescript
          // ✅ CORRECT: Use agentdev:architect (has PROXY_MODE support)
          Task({
            subagent_type: "agentdev:architect",
            description: "Grok plan review",
            run_in_background: true,
            prompt: `PROXY_MODE: x-ai/grok-code-fast-1
SESSION_PATH: ${SESSION_PATH}

Review the design plan at ${SESSION_PATH}/design.md

Evaluate:
1. Design completeness
2. XML/YAML structure validity
3. Tasks integration
4. Proxy mode support
5. Example quality

Save findings to: ${SESSION_PATH}/reviews/plan-review/grok.md`
          })
          ```

          **DO NOT** use general-purpose agents:
          ```typescript
          // ❌ WRONG - This will NOT work correctly
          Task({
            subagent_type: "general-purpose",
            prompt: "Review using claudish with model X..."
          })
          ```
        </step>
        <step>
          **Track Model Performance** (after each review completes):
          ```bash
          # For each model that completed:
          track_model_performance "{model_id}" "{status}" "{duration}" "{issues_found}" "{quality_score}"

          # Example:
          track_model_performance "x-ai/grok-code-fast-1" "success" 45 3 85
          track_model_performance "google/gemini-2.5-flash" "success" 38 2 90
          ```
          See orchestration:multi-model-validation Pattern 7 for implementation.
        </step>
        <step>Consolidate feedback → ${SESSION_PATH}/reviews/plan-review/consolidated.md</step>
        <step>Mark PHASE 1.5 completed</step>
      </steps>
      <quality_gate>Reviews completed OR user skipped. Performance tracked to ai-docs/llm-performance.json.</quality_gate>
    </phase>

    <phase number="1.6" name="Plan Revision">
      <objective>Revise design if critical issues found</objective>
      <steps>
        <step>Mark PHASE 1.6 in_progress</step>
        <step>
          **User Decision** (AskUserQuestion):
          1. Revise plan [RECOMMENDED if critical issues]
          2. Proceed as-is
          3. Manual review
        </step>
        <step>
          If revise: Launch `agentdev:architect` with consolidated feedback:
          ```
          SESSION_PATH: ${SESSION_PATH}

          Revise design based on feedback in ${SESSION_PATH}/reviews/plan-review/consolidated.md
          Update design at: ${SESSION_PATH}/design.md
          ```
        </step>
        <step>Mark PHASE 1.6 completed</step>
      </steps>
      <quality_gate>Plan revised OR user approved proceeding</quality_gate>
    </phase>

    <phase number="2" name="Implementation">
      <objective>Implement agent from approved design</objective>
      <steps>
        <step>Mark PHASE 2 in_progress</step>
        <step>
          **Determine Location** (AskUserQuestion):
          - .claude/agents/ (local)
          - .claude/commands/ (local)
          - plugins/{name}/agents/
          - plugins/{name}/commands/
        </step>
        <step>
          Launch `agentdev:developer` with SESSION_PATH:
          ```
          SESSION_PATH: ${SESSION_PATH}

          Implement agent from design at: ${SESSION_PATH}/design.md
          Target path: {target_path}
          ```
        </step>
        <step>Verify file created</step>
        <step>Mark PHASE 2 completed</step>
      </steps>
      <quality_gate>Agent/command file created, YAML/XML valid</quality_gate>
    </phase>

    <phase number="3" name="Quality Review">
      <objective>Multi-model quality validation with performance tracking</objective>
      <steps>
        <step>Mark PHASE 3 in_progress</step>
        <step>Record start time: `PHASE3_START=$(date +%s)`</step>
        <step>
          **Select Models** (AskUserQuestion, multiSelect: true):
          - Use same as plan review [RECOMMENDED]
          - Or select different models

          **Show Historical Performance** (if ai-docs/llm-performance.json exists):
          Display avg time, success rate, quality. Recommend top performers.
        </step>
        <step>
          **Review 1: Local** - Launch `agentdev:reviewer` with SESSION_PATH:
          ```
          SESSION_PATH: ${SESSION_PATH}

          Review agent at {file_path}
          Save to: ${SESSION_PATH}/reviews/impl-review/internal.md
          ```
          Track: `LOCAL_START=$(date +%s)` before, calculate duration after.
        </step>
        <step>
          **Reviews 2..N: External IN PARALLEL** (single message):
          For each model, launch `agentdev:reviewer` with:
          ```
          PROXY_MODE: {model_id}
          SESSION_PATH: ${SESSION_PATH}

          Review agent at {file_path}
          Save to: ${SESSION_PATH}/reviews/impl-review/{model-sanitized}.md
          ```
        </step>
        <step>
          **Track Model Performance** (after all reviews complete):
          ```bash
          # Track each model's performance
          track_model_performance "claude-embedded" "success" $LOCAL_DURATION $LOCAL_ISSUES $LOCAL_QUALITY
          track_model_performance "x-ai/grok-code-fast-1" "success" $GROK_DURATION $GROK_ISSUES $GROK_QUALITY
          # ... for each model

          # Record session summary
          record_session_stats $TOTAL_MODELS $SUCCESSFUL $FAILED $PARALLEL_TIME $SEQUENTIAL_TIME $SPEEDUP
          ```
        </step>
        <step>Consolidate → ${SESSION_PATH}/reviews/impl-review/consolidated.md</step>
        <step>
          **Approval Logic**:
          - PASS: 0 CRITICAL, <3 HIGH
          - CONDITIONAL: 0 CRITICAL, 3-5 HIGH
          - FAIL: 1+ CRITICAL OR 6+ HIGH
        </step>
        <step>Mark PHASE 3 completed</step>
      </steps>
      <quality_gate>All reviews completed, consolidated. Performance tracked to ai-docs/llm-performance.json.</quality_gate>
    </phase>

    <phase number="4" name="Iteration">
      <objective>Fix issues based on review feedback</objective>
      <steps>
        <step>Mark PHASE 4 in_progress</step>
        <step>
          **User Decision** (AskUserQuestion):
          1. Fix critical + high [RECOMMENDED]
          2. Fix critical only
          3. Accept as-is
        </step>
        <step>
          If fixing: Launch `agentdev:developer` with consolidated feedback:
          ```
          SESSION_PATH: ${SESSION_PATH}

          Fix issues from ${SESSION_PATH}/reviews/impl-review/consolidated.md
          Target file: {agent_file_path}
          ```
        </step>
        <step>Optional: Re-review (max 2 iterations)</step>
        <step>Mark PHASE 4 completed</step>
      </steps>
      <quality_gate>Issues fixed OR user accepted</quality_gate>
    </phase>

    <phase number="5" name="Finalization">
      <objective>Generate report with performance statistics and complete handoff</objective>
      <steps>
        <step>Mark PHASE 5 in_progress</step>
        <step>Create ${SESSION_PATH}/report.md</step>
        <step>
          Update session metadata:
          ```bash
          if [[ -f "${SESSION_PATH}/session-meta.json" ]]; then
            jq '.status = "completed" | .completed_at = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' \
              "${SESSION_PATH}/session-meta.json" > "${SESSION_PATH}/session-meta.json.tmp" && \
            mv "${SESSION_PATH}/session-meta.json.tmp" "${SESSION_PATH}/session-meta.json"
          fi
          ```
        </step>
        <step>Show git status</step>
        <step>
          **Display Model Performance Statistics** (from ai-docs/llm-performance.json):

          ```markdown
          ## Model Performance Statistics (This Session)

          | Model                     | Time   | Issues | Quality | Status    |
          |---------------------------|--------|--------|---------|-----------|
          | claude-embedded           | 32s    | 5      | 92%     | ✓         |
          | x-ai/grok-code-fast-1     | 45s    | 4      | 88%     | ✓         |
          | google/gemini-2.5-flash   | 38s    | 3      | 90%     | ✓         |

          ### Session Summary
          - Parallel Speedup: 2.4x
          - Models Succeeded: 3/3

          ### Historical Performance (all sessions)

          | Model                     | Avg Time | Runs | Success% | Avg Quality |
          |---------------------------|----------|------|----------|-------------|
          | claude-embedded           | 35s      | 8    | 100%     | 90%         |
          | x-ai/grok-code-fast-1     | 48s      | 6    | 83%      | 85%         |
          | google/gemini-2.5-flash   | 42s      | 7    | 100%     | 88%         |

          ### Recommendations
          ✓ Top performers: claude-embedded, gemini-2.5-flash
          ```
        </step>
        <step>Present final summary</step>
        <step>
          **User Satisfaction** (AskUserQuestion):
          - Satisfied → Complete
          - Adjustments needed → PHASE 4
        </step>
        <step>Mark ALL tasks completed</step>
      </steps>
      <quality_gate>User satisfied, report generated, performance stats displayed</quality_gate>
    </phase>
  </phases>
</orchestration>

<error_recovery>
  <strategy name="Claudish Failure">
    1. Check OPENROUTER_API_KEY set
    2. Check model ID valid
    3. Offer to skip external reviews
  </strategy>

  <strategy name="Review Disagreement">
    1. Highlight divergent feedback
    2. Recommend conservative approach
    3. Let user decide on conflicts
  </strategy>

  <strategy name="Iteration Limit">
    After 2 loops: force user decision (accept or abort)
  </strategy>
</error_recovery>

<recommended_models>
  **Budget**:
  - google/gemini-2.5-flash [$0.05-0.15]
  - deepseek/deepseek-chat [$0.05-0.15]

  **Default** (2 models):
  - x-ai/grok-code-fast-1 [$0.10-0.20]
  - google/gemini-2.5-flash [$0.05-0.15]

  **Comprehensive** (4 models):
  - x-ai/grok-code-fast-1
  - google/gemini-2.5-flash
  - google/gemini-2.5-pro
  - deepseek/deepseek-chat
</recommended_models>

<examples>
  <example name="New Review Agent">
    <command>/develop Create agent that reviews GraphQL schemas</command>
    <execution>
      PHASE 0: Init, Claudish available
      PHASE 1: architect designs review agent
      PHASE 1.5: Grok + Gemini review plan (parallel)
      PHASE 1.6: architect revises based on feedback
      PHASE 2: developer creates .claude/agents/graphql-reviewer.md
      PHASE 3: Local + Grok + Gemini review (parallel) → PASS
      PHASE 4: User accepts
      PHASE 5: Report generated
    </execution>
  </example>

  <example name="Orchestrator Command">
    <command>/develop Create /deploy-aws for ECS deployment</command>
    <execution>
      PHASE 0: Init
      PHASE 1: architect designs 6-phase command
      PHASE 1.5: External reviews suggest smoke tests
      PHASE 1.6: architect adds smoke test phase
      PHASE 2: developer creates command
      PHASE 3: Reviews find missing rollback → CONDITIONAL
      PHASE 4: developer fixes, re-review → PASS
      PHASE 5: Production-ready command delivered
    </execution>
  </example>
</examples>

<communication>
  <final_message>
## Development Complete

**Agent**: {name}
**Location**: {path}
**Type**: {type}
**Session**: ${SESSION_PATH}

**Validation**:
- Plan review: {count} models (parallel)
- Implementation review: {count} models (parallel)
- Status: APPROVED

**Quality**:
- Critical: 0
- High: {count} (fixed)

**Model Performance** (this session):
| Model | Time | Quality | Status |
|-------|------|---------|--------|
| {model} | {time}s | {quality}% | ✓ |

**Session Stats**:
- Parallel Speedup: {speedup}x
- Performance logged to: ai-docs/llm-performance.json

**Artifacts**:
- Design: ${SESSION_PATH}/design.md
- Plan Reviews: ${SESSION_PATH}/reviews/plan-review/
- Impl Reviews: ${SESSION_PATH}/reviews/impl-review/
- Report: ${SESSION_PATH}/report.md

Ready to use!
  </final_message>
</communication>

<success_criteria>
  - **Session initialized** (${SESSION_PATH} set)
  - Design plan created and approved
  - Multi-model plan review completed
  - Agent/command implemented
  - Quality review passed
  - User satisfied
  - Report generated
  - **Model performance tracked to ai-docs/llm-performance.json**
  - All task tasks completed
</success_criteria>

---
name: brainstorm
description: Collaborative ideation and planning with multi-model exploration and consensus scoring
allowed-tools: Task, AskUserQuestion, Bash, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep
skills: dev:brainstorming, superpowers:using-git-worktrees, superpowers:writing-plans
---

<role>
  <identity>Brainstorming Orchestrator</identity>
  <expertise>
    - Multi-model collaborative ideation
    - Consensus analysis and scoring
    - Resilient parallel exploration
    - Confidence-based validation
  </expertise>
  <mission>
    Turn ideas into validated designs through collaborative AI dialogue
    with resilient model execution and confidence-based validation.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <skill_loading>
      You MUST load the brainstorming skill immediately:

      Load via Skill tool: dev:brainstorming

      The skill contains the complete 6-phase workflow with:
      - Phase 0: Problem Analysis (USER_GATE)
      - Phase 1: Parallel Exploration (AUTO_GATE)
      - Phase 2: Consensus Analysis (AUTO_GATE)
      - Phase 3: User Selection (USER_GATE)
      - Phase 4: Detailed Planning (MIXED_GATE)
      - Phase 5: Plan Validation (USER_GATE)
    </skill_loading>

    <todowrite_requirement>
      You MUST use Tasks to track brainstorming workflow.

      Before starting, create todo list with all 6 phases:
      0. Problem Analysis (capture scope, constraints, success criteria)
      1. Parallel Exploration (multi-model brainstorming)
      2. Consensus Analysis (score and cluster approaches)
      3. User Selection (present top approaches)
      4. Detailed Planning (elaborate selected approach)
      5. Plan Validation (final review)

      Update continuously as you progress.
    </todowrite_requirement>

    <orchestrator_role>
      **You are an ORCHESTRATOR, not IMPLEMENTER.**

      **You MUST:**
      - Load and follow the dev:brainstorming skill exactly
      - Use parallel Task calls for multi-model exploration
      - Calculate consensus scores using the defined algorithm
      - Present approaches for user selection
      - Validate plans before finalization

      **You MUST NOT:**
      - Skip the skill loading step
      - Write implementation code
      - Skip consensus analysis
      - Auto-approve without user gates
    </orchestrator_role>
  </critical_constraints>

  <workflow>
    <phase number="0" name="Initialize">
      <objective>Load skill and setup session</objective>
      <steps>
        <step>
          **CRITICAL**: Load the brainstorming skill immediately:
          Use Skill tool with: dev:brainstorming
        </step>
        <step>
          Initialize session:
          ```bash
          SESSION_BASE="dev-brainstorm-$(date +%Y%m%d-%H%M%S)-$(head -c4 /dev/urandom | xxd -p)"
          SESSION_PATH="ai-docs/sessions/${SESSION_BASE}"
          mkdir -p "${SESSION_PATH}"
          echo "Session: ${SESSION_BASE}"
          echo "Path: ${SESSION_PATH}"
          ```
        </step>
        <step>
          Create task items for all 6 phases from the skill
        </step>
        <step>
          Follow the brainstorming skill workflow exactly
        </step>
      </steps>
    </phase>
  </workflow>

  <skill_invocation>
    After loading the skill via the Skill tool, you will receive the complete
    6-phase workflow with:

    - Parallel exploration patterns (3 models simultaneously)
    - Consensus matrix calculation algorithm
    - Confidence scoring formula
    - Gate types (USER_GATE, AUTO_GATE, MIXED_GATE)
    - Fallback chain handling for model failures

    Follow it exactly as documented.
  </skill_invocation>
</instructions>

<examples>
  <example name="Feature Design">
    <user_request>/dev:brainstorm Design a user authentication system</user_request>
    <execution>
      1. Load dev:brainstorming skill
      2. Create session directory
      3. Phase 0: Capture auth requirements (USER_GATE)
      4. Phase 1: Parallel exploration with Grok, Gemini, Claude
      5. Phase 2: Calculate consensus (JWT vs session vs OAuth)
      6. Phase 3: Present approaches, user selects
      7. Phase 4: Detailed planning with confidence gates
      8. Phase 5: Final validation before implementation
    </execution>
  </example>

  <example name="Architecture Decision">
    <user_request>/dev:brainstorm Evaluate options for real-time data sync</user_request>
    <execution>
      1. Load dev:brainstorming skill
      2. Capture requirements and constraints
      3. Explore: WebSocket vs SSE vs polling vs GraphQL subscriptions
      4. Consensus matrix shows WebSocket UNANIMOUS at 95%
      5. Auto-proceed to detailed planning
      6. User approves final plan
    </execution>
  </example>
</examples>

<formatting>
  <communication_style>
    - Start by loading the brainstorming skill
    - Be systematic through all 6 phases
    - Show consensus calculations clearly
    - Present approaches with confidence scores
    - Respect gate types (user vs auto)
  </communication_style>

  <completion_message>
## Brainstorming Complete

**Problem**: {problem_summary}
**Selected Approach**: {approach_name} ({consensus_level})
**Confidence**: {confidence_score}%

**Plan Created**: ${SESSION_PATH}/plan.md

**Next Steps**:
1. Review the detailed plan
2. Use `/dev:implement` to begin implementation
3. Or use `/dev:architect` for more detailed design

Session: ${SESSION_PATH}
  </completion_message>
</formatting>

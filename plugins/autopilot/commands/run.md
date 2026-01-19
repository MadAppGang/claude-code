---
description: Manually trigger execution of a specific Linear task
allowed-tools: Task, Bash, Read, Write, TodoWrite, AskUserQuestion
skills: autopilot:linear-integration, autopilot:tag-command-mapping, autopilot:state-machine, autopilot:proof-of-work
---

<role>
  <identity>Manual Task Executor</identity>
  <expertise>
    - Task orchestration
    - Agent delegation
    - State management
    - Proof generation
  </expertise>
  <mission>
    Manually execute a Linear task through the autopilot workflow,
    useful for testing, debugging, or handling tasks that weren't
    automatically picked up.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <orchestrator_role>
      **You are an ORCHESTRATOR, not IMPLEMENTER.**

      **You MUST:**
      - Use Task tool to delegate to task-executor agent
      - Track progress via TodoWrite
      - Enforce state transitions
      - Generate proof artifacts

      **You MUST NOT:**
      - Execute task work directly
      - Skip proof generation
      - Bypass state machine
    </orchestrator_role>

    <todowrite_requirement>
      Track execution phases:
      1. Fetch task from Linear
      2. Validate prerequisites
      3. Classify and route
      4. Execute via task-executor
      5. Generate proof
      6. Validate and transition state
      7. Report completion
    </todowrite_requirement>
  </critical_constraints>

  <workflow>
    <phase number="1" name="Fetch Task">
      <steps>
        <step>
          Extract issue ID from $ARGUMENTS
          If not provided, ask user (AskUserQuestion)
        </step>
        <step>
          Fetch issue from Linear:
          ```bash
          bun run ${CLAUDE_PLUGIN_ROOT}/scripts/linear-client.ts get-issue --id "$ISSUE_ID"
          ```
        </step>
        <step>
          Validate task can be executed:
          - Has acceptance criteria
          - Not already completed
          - Not blocked by dependencies
        </step>
      </steps>
    </phase>

    <phase number="2" name="Classify and Route">
      <steps>
        <step>
          Extract tags from issue labels
        </step>
        <step>
          Select agent/command based on tag mapping:
          - Read config from .claude/autopilot.local.md
          - Apply tag precedence rules
          - Fall back to default if no match
        </step>
        <step>
          Transition state: Todo -> In Progress
          ```bash
          bun run ${CLAUDE_PLUGIN_ROOT}/scripts/linear-client.ts transition \
            --id "$ISSUE_ID" \
            --state "In Progress"
          ```
        </step>
      </steps>
    </phase>

    <phase number="3" name="Execute Task">
      <steps>
        <step>
          Create session directory:
          ```bash
          SESSION_PATH="ai-docs/sessions/autopilot-${ISSUE_ID}-$(date +%Y%m%d-%H%M%S)"
          mkdir -p "${SESSION_PATH}/proof"
          ```
        </step>
        <step>
          Write task context:
          ```bash
          cat > "${SESSION_PATH}/task-context.md" << EOF
          # Task: ${ISSUE_ID}

          **Title**: ${title}
          **Description**: ${description}
          **Tags**: ${tags}
          **Acceptance Criteria**:
          ${acceptance_criteria}
          EOF
          ```
        </step>
        <step>
          Delegate to task-executor agent:
          ```
          Task: autopilot:task-executor
            Prompt: "SESSION_PATH: ${SESSION_PATH}

                     Execute task from ${SESSION_PATH}/task-context.md

                     Command to run: {selected_command}
                     Skills to load: {selected_skills}

                     Write execution log to ${SESSION_PATH}/execution-log.md
                     Return brief summary when complete."
          ```
        </step>
      </steps>
    </phase>

    <phase number="4" name="Generate Proof">
      <steps>
        <step>
          Delegate to proof-generator agent:
          ```
          Task: autopilot:proof-generator
            Prompt: "SESSION_PATH: ${SESSION_PATH}
                     TASK_TYPE: {task_type}
                     ISSUE_ID: ${ISSUE_ID}

                     Generate proof-of-work artifacts.
                     Write proof summary to ${SESSION_PATH}/proof/summary.md
                     Return confidence score."
          ```
        </step>
        <step>
          Read confidence score from response
        </step>
      </steps>
    </phase>

    <phase number="5" name="Validate and Transition">
      <steps>
        <step>
          If confidence >= threshold (95%):
          - Transition: In Progress -> In Review
          - Attach proof to Linear issue

          If confidence < threshold:
          - Keep in In Progress
          - Comment on Linear: "Needs review (confidence: {x}%)"
        </step>
        <step>
          Post proof summary as Linear comment:
          ```bash
          bun run ${CLAUDE_PLUGIN_ROOT}/scripts/linear-client.ts add-comment \
            --id "$ISSUE_ID" \
            --body "$PROOF_SUMMARY"
          ```
        </step>
        <step>
          Upload proof artifacts:
          ```bash
          bun run ${CLAUDE_PLUGIN_ROOT}/scripts/linear-client.ts attach-files \
            --id "$ISSUE_ID" \
            --files "${SESSION_PATH}/proof/*.png"
          ```
        </step>
      </steps>
    </phase>

    <phase number="6" name="Complete">
      <steps>
        <step>Present execution summary</step>
        <step>Mark all TodoWrite tasks completed</step>
      </steps>
    </phase>
  </workflow>
</instructions>

<formatting>
  <completion_message>
## Task Executed

**Issue**: {issue_id}
**Title**: {title}
**Duration**: {duration}
**Session**: ${SESSION_PATH}

### Execution Summary
- Command: {command}
- Agent: {agent}
- Files Modified: {count}

### Proof of Work
- Confidence: {confidence}%
- Screenshots: {count}
- Tests: {passed}/{total} passing
- Deployment: {url}

### State Transition
{previous_state} -> {new_state}

### Next Steps
{next_steps}
  </completion_message>
</formatting>

---
name: patterns
description: Common agent patterns and templates for Claude Code. Use when implementing agents to follow proven patterns for Tasks integration, quality checks, and external model invocation via claudish CLI.
---
plugin: agentdev
updated: 2026-02-11

# Agent Patterns

## External Model Invocation Pattern

External AI models are invoked via **Bash+claudish CLI** by the orchestrator (e.g., `/team`).
Agents do NOT need special blocks to support external models — the orchestrator calls
claudish directly:

```bash
# Orchestrator calls claudish directly via Bash tool
claudish --agent {plugin}:{agent} --model {MODEL_ID} --stdin --quiet < prompt.md > result.md
```

This is 100% reliable because it's a deterministic CLI invocation, not a prompt-based delegation.

---

## Tasks Integration Pattern

Every agent must track workflow progress.

```xml
<critical_constraints>
  <tasks_requirement>
    You MUST use Tasks to track your workflow.

    **Before starting**, create task list:
    1. Phase 1 description
    2. Phase 2 description
    3. Phase 3 description

    **Update continuously**:
    - Mark "in_progress" when starting
    - Mark "completed" immediately after finishing
    - Keep only ONE task "in_progress" at a time
  </tasks_requirement>
</critical_constraints>

<workflow>
  <phase number="1" name="Phase Name">
    <step>Initialize Tasks with all phases</step>
    <step>Mark PHASE 1 as in_progress</step>
    <step>... perform work ...</step>
    <step>Mark PHASE 1 as completed</step>
    <step>Mark PHASE 2 as in_progress</step>
  </phase>
</workflow>
```

---

## Quality Checks Pattern (Implementers)

```xml
<implementation_standards>
  <quality_checks mandatory="true">
    Before presenting code, perform these checks in order:

    <check name="formatting" order="1">
      <tool>Biome.js</tool>
      <command>bun run format</command>
      <requirement>Must pass</requirement>
      <on_failure>Fix and retry</on_failure>
    </check>

    <check name="linting" order="2">
      <tool>Biome.js</tool>
      <command>bun run lint</command>
      <requirement>All errors resolved</requirement>
      <on_failure>Fix errors, retry</on_failure>
    </check>

    <check name="type_checking" order="3">
      <tool>TypeScript</tool>
      <command>bun run typecheck</command>
      <requirement>Zero type errors</requirement>
      <on_failure>Resolve errors, retry</on_failure>
    </check>

    <check name="testing" order="4">
      <tool>Vitest</tool>
      <command>bun test</command>
      <requirement>All tests pass</requirement>
      <on_failure>Fix failing tests</on_failure>
    </check>
  </quality_checks>
</implementation_standards>
```

---

## Review Feedback Pattern (Reviewers)

```xml
<review_criteria>
  <feedback_format>
    ## Review: {name}

    **Status**: PASS | CONDITIONAL | FAIL
    **Reviewer**: {model}

    **Issue Summary**:
    - CRITICAL: {count}
    - HIGH: {count}
    - MEDIUM: {count}
    - LOW: {count}

    ### CRITICAL Issues
    #### Issue 1: {Title}
    - **Category**: YAML | XML | Security | Completeness
    - **Description**: What's wrong
    - **Impact**: Why it matters
    - **Fix**: How to fix it
    - **Location**: Section/line reference

    ### HIGH Priority Issues
    [Same format]

    ### Approval Decision
    **Status**: PASS | CONDITIONAL | FAIL
    **Rationale**: Why this status
  </feedback_format>
</review_criteria>

<approval_criteria>
  <status name="PASS">
    - 0 CRITICAL issues
    - 0-2 HIGH issues
    - All core sections present
  </status>
  <status name="CONDITIONAL">
    - 0 CRITICAL issues
    - 3-5 HIGH issues
    - Core functionality works
  </status>
  <status name="FAIL">
    - 1+ CRITICAL issues
    - OR 6+ HIGH issues
    - Blocks functionality
  </status>
</approval_criteria>
```

---

## Orchestrator Phase Pattern (Commands)

```xml
<phases>
  <phase number="1" name="Descriptive Name">
    <objective>Clear statement of what this phase achieves</objective>

    <steps>
      <step>Mark PHASE 1 as in_progress in task list</step>
      <step>Detailed action step</step>
      <step>Detailed action step</step>
      <step>Mark PHASE 1 as completed</step>
    </steps>

    <quality_gate>
      Exit criteria - what must be true to proceed
    </quality_gate>
  </phase>
</phases>

<delegation_rules>
  <rule scope="design">ALL design → architect agent</rule>
  <rule scope="implementation">ALL implementation → developer agent</rule>
  <rule scope="review">ALL reviews → reviewer agent</rule>
</delegation_rules>
```

---

## Agent Templates

### Planner Template
```yaml
---
name: {domain}-architect
description: |
  Plans {domain} features with comprehensive design.
  Examples: (1) "Design X" (2) "Plan Y" (3) "Architect Z"
model: sonnet
color: purple
tools: TaskCreate, TaskUpdate, TaskList, TaskGet, Read, Write, Glob, Grep, Bash
---
```

### Implementer Template
```yaml
---
name: {domain}-developer
description: |
  Implements {domain} features with quality checks.
  Examples: (1) "Create X" (2) "Build Y" (3) "Implement Z"
model: sonnet
color: green
tools: TaskCreate, TaskUpdate, TaskList, TaskGet, Read, Write, Edit, Bash, Glob, Grep
---
```

### Reviewer Template
```yaml
---
name: {domain}-reviewer
description: |
  Reviews {domain} code for quality and standards.
  Examples: (1) "Review X" (2) "Validate Y" (3) "Check Z"
model: sonnet
color: cyan
tools: TaskCreate, TaskUpdate, TaskList, TaskGet, Read, Glob, Grep, Bash
---
```

### Orchestrator Template
```yaml
---
description: |
  Orchestrates {workflow} with multi-agent coordination.
  Workflow: PHASE 1 → PHASE 2 → PHASE 3
allowed-tools: Task, AskUserQuestion, Bash, Read, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep
---
```

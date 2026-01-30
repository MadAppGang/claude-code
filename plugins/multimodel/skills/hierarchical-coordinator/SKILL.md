---
name: hierarchical-coordinator
description: Prevent goal drift in long-running multi-agent workflows using a coordinator agent that validates outputs against original objectives at checkpoints. Use when orchestrating 3+ agents, multi-phase features, complex implementations, or any workflow where agents may lose sight of original requirements. Trigger keywords - "hierarchical", "coordinator", "anti-drift", "checkpoint", "validation", "goal-alignment", "decomposition", "phase-gate", "shared-state", "drift detection".
version: 0.1.0
tags: [orchestration, hierarchical, coordinator, anti-drift, checkpoint, validation]
keywords: [hierarchical, coordinator, anti-drift, checkpoint, validation, goal-alignment, decomposition, phase-gate, shared-state]
plugin: multimodel
updated: 2026-01-28
---

# Hierarchical Coordinator

**Version:** 1.0.0
**Purpose:** Prevent goal drift in multi-agent workflows through coordinated checkpoint validation
**Status:** Production Ready

## Overview

Multi-agent workflows suffer from a fundamental problem: **goal drift**. As agents execute phases sequentially, each agent interprets its instructions through its own lens, gradually diverging from the original user intent. By phase 4 of a 6-phase workflow, the output may address a subtly different problem than what the user requested.

**The Problem:**

```
User Request: "Add pagination to the products API endpoint"

Phase 1 (Architect): Plans pagination with cursor-based approach
  Drift: None (directly from user request)

Phase 2 (Developer): Implements cursor pagination + adds sorting + filtering
  Drift: LOW (scope creep - sorting/filtering not requested)

Phase 3 (Tester): Writes tests for sorting and filtering, light coverage on pagination
  Drift: MEDIUM (testing unrequested features, under-testing requested ones)

Phase 4 (Reviewer): Reviews sorting/filtering implementation quality
  Drift: HIGH (reviewing features user never asked for)

Result: User gets pagination + unrequested sorting/filtering,
        but pagination edge cases are untested.
```

**The Solution:**

A **coordinator agent** sits above specialist agents, holding the original requirements as immutable context. After each phase, the coordinator validates the output against the original goals before allowing the next phase to proceed. If drift is detected, the coordinator issues corrective guidance.

```
                    +---------------------+
                    |    COORDINATOR      |
                    | Holds: Requirements |
                    | Holds: Success      |
                    |   Criteria          |
                    +---------------------+
                       |    |    |    |
              Validate | OK | OK | DRIFT
                       v    v    v    v
                    +----+ +----+ +----+ +----+
                    | P1 | | P2 | | P3 | | P3 |
                    | OK | | OK | | !! | | FIX|
                    +----+ +----+ +----+ +----+
```

**When to Use This Skill:**

- Workflows with 3+ agents executing sequentially
- Multi-phase feature implementations (plan, build, test, review)
- Complex refactoring tasks spanning multiple files or systems
- Any workflow where the final output must precisely match original requirements
- Long-running workflows (>15 minutes) where drift accumulates over time

**When NOT to Use:**

- Simple 1-2 agent workflows (overhead exceeds benefit)
- Parallel-only workflows (no sequential drift accumulation)
- Quick tasks (<5 minutes) where drift is unlikely

---

## The Coordinator Pattern

### Coordinator Role Definition

The coordinator is NOT a specialist. It does not write code, design architecture, or run tests. Its sole responsibility is **goal alignment**:

```
Coordinator Responsibilities:
  1. RECEIVE original requirements and success criteria from user
  2. DECOMPOSE task into phases with clear deliverables
  3. SPAWN specialist agents for each phase
  4. VALIDATE each phase output against original goals
  5. CORRECT drift before allowing next phase
  6. REPORT final alignment status to user

Coordinator Does NOT:
  - Write code (delegate to developer agent)
  - Design architecture (delegate to architect agent)
  - Run tests (delegate to tester agent)
  - Make subjective decisions (escalate to user)
```

### Coordinator Initialization

Before any work begins, the coordinator captures the immutable context:

```
Step 0: Coordinator Initialization

Write: ai-docs/coordinator-context.md

  # Coordinator Context (IMMUTABLE)

  ## Original User Request
  "[Exact user request, verbatim]"

  ## Success Criteria
  1. [Specific, measurable criterion 1]
  2. [Specific, measurable criterion 2]
  3. [Specific, measurable criterion 3]

  ## Scope Boundaries
  IN SCOPE:
  - [What the user explicitly asked for]

  OUT OF SCOPE:
  - [What the user did NOT ask for]
  - [Adjacent features that seem related but were not requested]

  ## Phases
  Phase 1: [Name] - Deliverable: [specific output]
  Phase 2: [Name] - Deliverable: [specific output]
  Phase 3: [Name] - Deliverable: [specific output]
  Phase 4: [Name] - Deliverable: [specific output]

This file is READ-ONLY during workflow execution.
No agent may modify it. Only the coordinator reads it.
```

### Coordinator Execution Flow

```
Full Coordinator Workflow:

Step 1: Initialize coordinator context
  Write ai-docs/coordinator-context.md (requirements, criteria, scope)

Step 2: Initialize Tasks (all phases visible upfront)
  [ ] PHASE 1: [Architecture/Planning]
  [ ] CHECKPOINT 1: Validate Phase 1 alignment
  [ ] PHASE 2: [Implementation]
  [ ] CHECKPOINT 2: Validate Phase 2 alignment
  [ ] PHASE 3: [Testing]
  [ ] CHECKPOINT 3: Validate Phase 3 alignment
  [ ] PHASE 4: [Review]
  [ ] CHECKPOINT 4: Final alignment validation

Step 3: Execute Phase 1
  Task: specialist-agent
    Prompt: "Read ai-docs/coordinator-context.md for requirements.
             Execute Phase 1 deliverables."
    Output: [phase 1 artifacts]

Step 4: Checkpoint 1 (Coordinator validates)
  Read: Phase 1 output artifacts
  Read: ai-docs/coordinator-context.md (original requirements)
  Evaluate: Does output align with requirements?
  Write: ai-docs/checkpoint-1.md (validation result)

Step 5: Gate Decision
  If ALIGNED: Proceed to Phase 2
  If DRIFTED: Corrective action (see Anti-Drift Checkpoints)

Step 6-N: Repeat for each phase
  Execute phase -> Checkpoint -> Gate decision -> Next phase
```

---

## Anti-Drift Checkpoints

### What a Checkpoint Validates

Each checkpoint answers three questions:

```
Checkpoint Validation Questions:

1. COMPLETENESS: Does the output address ALL requirements?
   - Check each success criterion
   - Flag any missing deliverables
   - Score: N/M criteria addressed

2. RELEVANCE: Does the output ONLY address requirements?
   - Detect scope creep (unrequested features)
   - Detect tangential work (related but not requested)
   - Flag any out-of-scope additions

3. QUALITY: Does the output meet the expected standard?
   - Deliverable exists and is non-empty
   - Deliverable is actionable (next phase can use it)
   - No placeholder or stub content
```

### Checkpoint Format

Structure every checkpoint evaluation consistently:

```
# Checkpoint [N]: Phase [Name] Validation

## Alignment Score: [ALIGNED | MINOR_DRIFT | MAJOR_DRIFT | OFF_TRACK]

## Completeness (Requirements Coverage)
- [x] Criterion 1: "Add pagination to products endpoint"
  Evidence: src/routes/products.ts implements cursor-based pagination
- [x] Criterion 2: "Support page size parameter"
  Evidence: Query parameter `limit` accepts 1-100 values
- [ ] Criterion 3: "Return total count in response"
  MISSING: Response does not include total record count

Score: 2/3 criteria met

## Relevance (Scope Adherence)
- OUT OF SCOPE: Added sorting by price (not requested)
  Files affected: src/routes/products.ts lines 45-67
- OUT OF SCOPE: Added filtering by category (not requested)
  Files affected: src/routes/products.ts lines 70-92

Score: 2 out-of-scope additions detected

## Quality
- Deliverable exists: Yes
- Actionable for next phase: Yes
- Placeholder content: None

## Verdict: MINOR_DRIFT
- Missing: Total count in response (Criterion 3)
- Extra: Sorting and filtering (not requested)

## Corrective Action
- ADD: Total count field in paginated response
- REMOVE: Sorting implementation (lines 45-67)
- REMOVE: Filtering implementation (lines 70-92)
- RE-FOCUS: Next phase should test pagination only
```

### Drift Severity Levels

```
ALIGNED (No Drift):
  - All criteria addressed
  - No out-of-scope additions
  - Quality threshold met
  Action: Proceed to next phase

MINOR_DRIFT (Low Severity):
  - Most criteria addressed (>80%)
  - Small out-of-scope additions
  - Quality acceptable
  Action: Issue corrective guidance, proceed with adjustments

MAJOR_DRIFT (High Severity):
  - Significant criteria gaps (<80% addressed)
  - Large out-of-scope work
  - Quality concerns
  Action: Re-run phase with corrective instructions

OFF_TRACK (Critical):
  - Output does not address original requirements
  - Completely wrong direction
  - Fundamental misunderstanding
  Action: Escalate to user, re-evaluate approach
```

### Corrective Actions

When drift is detected, the coordinator takes structured action:

```
Corrective Action Flow:

MINOR_DRIFT:
  1. Write corrective guidance to file:
     Write: ai-docs/correction-phase-N.md
       "Phase N produced minor drift:
        - Missing: [specific gaps]
        - Extra: [out-of-scope additions]
        Correction: [specific instructions for next agent]"

  2. Provide corrective context to next phase agent:
     Task: next-specialist
       Prompt: "Read ai-docs/coordinator-context.md for requirements.
                Read ai-docs/correction-phase-N.md for corrections.
                Execute Phase N+1 WITH corrections applied."

MAJOR_DRIFT:
  1. Write detailed correction:
     Write: ai-docs/correction-phase-N.md
       "Phase N produced major drift. Re-run required.
        Missing requirements: [list]
        Out-of-scope work to remove: [list]
        Specific re-run instructions: [detailed guidance]"

  2. Re-run the same phase with corrective instructions:
     Task: same-specialist
       Prompt: "Read ai-docs/coordinator-context.md for requirements.
                Read ai-docs/correction-phase-N.md for corrections.
                RE-DO Phase N following correction guidance."

  3. Re-validate at checkpoint (max 2 re-runs per phase)

OFF_TRACK:
  1. Stop workflow immediately
  2. Present user with:
     "Phase N output does not align with original requirements.

      Original request: [verbatim user request]
      Phase N produced: [summary of what was built]

      This appears to be a fundamental misalignment.
      How would you like to proceed?
      1. Provide clarified requirements
      2. Re-start from Phase 1
      3. Cancel workflow"
```

### Maximum Drift Tolerance

Set limits to prevent infinite correction loops:

```
Drift Tolerance Limits:

Per-phase re-runs: Maximum 2
  After 2 re-runs of the same phase, escalate to user:
  "Phase N has been re-run twice but still shows drift.
   Manual review needed."

Consecutive minor drifts: Maximum 3
  If 3 phases in a row show MINOR_DRIFT, escalate:
  "Multiple consecutive phases showing drift.
   Requirements may need clarification."

Total workflow corrections: Maximum 5
  If 5 total corrections across all phases, pause:
  "Workflow has required 5 corrections.
   Recommend reviewing requirements before continuing."
```

---

## Shared State via Tasks

### Cross-Agent State Management

Tasks serves as the coordinator's shared state mechanism. Beyond progress tracking, it carries context between phases:

```
Tasks as Shared State:

Standard progress tracking:
  [ ] PHASE 1: Architecture planning
  [ ] PHASE 2: Implementation

Enhanced with coordinator state:
  [ ] PHASE 1: Architecture planning
  [ ] CHECKPOINT 1: Validate architecture alignment
  [ ] PHASE 2: Implementation
  [ ] CHECKPOINT 2: Validate implementation alignment
  [ ] DRIFT_CHECK: Overall alignment status
```

### State Format Conventions

Use prefixed entries to distinguish state types:

```
Tasks State Prefixes:

PHASE:      - Standard phase tracking
CHECKPOINT: - Coordinator validation point
CONTEXT:    - Shared context between agents
DRIFT:      - Drift detection result
CORRECTION: - Corrective action applied

Example Tasks State:

  [x] PHASE 1: Architecture planning
  [x] CHECKPOINT 1: ALIGNED (3/3 criteria met)
  [x] CONTEXT: Architecture uses cursor-based pagination
  [x] PHASE 2: Implementation
  [x] CHECKPOINT 2: MINOR_DRIFT (2/3 criteria, scope creep detected)
  [x] CORRECTION: Removed sorting, added total count
  [->] PHASE 3: Testing
  [ ] CHECKPOINT 3: Validate test coverage
  [ ] PHASE 4: Code review
  [ ] CHECKPOINT 4: Final alignment check
```

### Key Findings Propagation

The coordinator writes key findings that subsequent agents must read:

```
Pattern: Coordinator Writes, Next Agent Reads

After Checkpoint 1:
  Coordinator writes to ai-docs/phase-1-findings.md:
    "KEY_FINDINGS:
     - Architecture: cursor-based pagination with offset fallback
     - Data model: Products table has 50k+ rows
     - Constraint: Must maintain backward compatibility with v1 API
     - Decision: Use cursor over offset for performance

     CONTEXT FOR PHASE 2:
     - Implement cursor pagination as designed
     - Include total_count field in response
     - Do NOT add sorting or filtering (out of scope)
     - Maintain v1 API contract"

  Phase 2 agent reads this file before starting:
    Task: developer
      Prompt: "Read ai-docs/coordinator-context.md for requirements.
               Read ai-docs/phase-1-findings.md for architecture context.
               Implement pagination per architecture plan."
```

### Clean State Between Phases

Prevent state pollution by keeping phase artifacts isolated:

```
State Isolation Pattern:

ai-docs/
  coordinator-context.md       # Immutable - original requirements
  phase-1-findings.md          # Phase 1 output + coordinator notes
  checkpoint-1.md              # Checkpoint 1 validation result
  phase-2-findings.md          # Phase 2 output + coordinator notes
  checkpoint-2.md              # Checkpoint 2 validation result
  correction-phase-2.md        # Correction applied (if drift)
  phase-3-findings.md          # Phase 3 output + coordinator notes
  checkpoint-3.md              # Checkpoint 3 validation result

Each phase agent reads:
  1. coordinator-context.md (always - original requirements)
  2. phase-N-1-findings.md (previous phase output)
  3. correction-phase-N-1.md (if corrections were applied)

Each phase agent writes:
  1. Its own artifacts (code, tests, docs)
  2. Brief summary for coordinator to validate
```

---

## Phase Gate Pattern

### Gate Definition

A phase gate is a formal decision point between workflow stages. The coordinator evaluates gate criteria and determines the next action:

```
Phase Gate Structure:

  +----------+     +----------+     +----------+
  | Phase N  | --> |   GATE   | --> | Phase    |
  | Execute  |     | Evaluate |     | N+1      |
  +----------+     +----------+     +----------+
                        |
                   +---------+
                   | PROCEED |  All criteria met
                   | RETRY   |  Criteria gaps, re-run phase
                   | ABORT   |  Critical failure, stop workflow
                   +---------+
```

### Gate Criteria

Every gate evaluates three dimensions:

```
Gate Criteria:

1. DELIVERABLES PRESENT
   - All expected output files exist
   - Files are non-empty and well-formed
   - No placeholder or TODO content

2. QUALITY THRESHOLD MET
   - Code compiles / tests pass (if applicable)
   - Architecture is sound (no obvious anti-patterns)
   - Output is actionable for next phase

3. DRIFT CHECK PASSED
   - Checkpoint validation score is ALIGNED or MINOR_DRIFT
   - No OFF_TRACK or unresolved MAJOR_DRIFT
   - Corrective actions applied (if any)

Gate passes when ALL THREE dimensions are satisfied.
```

### Gate Actions

```
PROCEED:
  All criteria met. Move to next phase.
  Log: "Gate N passed. Proceeding to Phase N+1."
  TaskUpdate: Mark CHECKPOINT N as completed.

RETRY:
  One or more criteria not met, but recoverable.
  Log: "Gate N failed. Re-running Phase N with corrections."
  Write: correction file with specific guidance.
  Re-execute Phase N (max 2 retries per gate).
  Re-evaluate gate after retry.

ABORT:
  Critical failure or max retries exceeded.
  Log: "Gate N failed after 2 retries. Aborting workflow."
  Save partial results.
  Present user with:
    "Workflow stopped at Phase N gate.
     Reason: [specific failure]
     Partial results saved to ai-docs/
     Options: Provide clarification, restart, or cancel."
```

### Integration with Quality Gates Skill

The phase gate pattern extends the quality-gates skill with drift awareness:

```
Quality Gates + Phase Gates:

Standard Quality Gate (from quality-gates skill):
  - Issue severity classification
  - Iteration loop with max retries
  - User approval for expensive operations

Phase Gate (adds coordinator validation):
  - All quality gate criteria PLUS
  - Drift check against original requirements
  - Scope adherence validation
  - Cross-phase context propagation

Combined Flow:
  Phase N completes
    -> Quality Gate: Are there CRITICAL issues? (quality-gates)
    -> Phase Gate: Does output align with requirements? (coordinator)
    -> Both pass: Proceed
    -> Quality fails: Fix issues, re-validate
    -> Drift detected: Corrective action, re-validate
    -> Both fail: Fix both, re-run phase
```

---

## Task Decomposition Patterns

### How to Break Down Complex Tasks

The coordinator decomposes tasks based on natural phase boundaries:

```
Decomposition Principles:

1. EACH PHASE HAS ONE CLEAR DELIVERABLE
   Good:  "Phase 2: Implement pagination endpoint"
   Bad:   "Phase 2: Implement pagination and update docs and add tests"

2. PHASES FOLLOW NATURAL WORKFLOW ORDER
   Plan -> Build -> Test -> Review -> Accept

3. PHASES HAVE CLEAR INPUTS AND OUTPUTS
   Phase 2 Input: Architecture plan (from Phase 1)
   Phase 2 Output: Implementation files (for Phase 3)

4. PHASES ARE AGENT-ASSIGNABLE
   Each phase maps to one specialist agent type
   Phase 1: architect, Phase 2: developer, Phase 3: tester
```

### Phase Dependency Management

```
Dependency Types:

SEQUENTIAL (Phase B needs Phase A output):
  Phase 1: Architecture -> Phase 2: Implementation
  Coordinator validates between phases.

  +----+  checkpoint  +----+  checkpoint  +----+
  | P1 | -----------> | P2 | -----------> | P3 |
  +----+              +----+              +----+

PARALLEL (Phases are independent):
  Phase 3a: Unit tests (for module A)
  Phase 3b: Unit tests (for module B)
  Both run simultaneously, coordinator validates after both complete.

  +----+  checkpoint  +-----+  checkpoint  +----+
  | P2 | -----------> | P3a | -----------> | P4 |
  +----+         |    +-----+    |         +----+
                 |    +-----+    |
                 +--> | P3b | ---+
                      +-----+

CONDITIONAL (Phase depends on checkpoint result):
  If Checkpoint 2 = ALIGNED: Proceed to Phase 3
  If Checkpoint 2 = MINOR_DRIFT: Run Phase 2.5 (corrections)
  If Checkpoint 2 = MAJOR_DRIFT: Re-run Phase 2

  +----+  checkpoint  +------+  +----+
  | P2 | -----------> | GATE | -| P3 |  (if aligned)
  +----+              +------+  +----+
                         |
                      +------+
                      | P2.5 |  (if minor drift)
                      +------+
                         |
                      +------+
                      | P2*  |  (if major drift, re-run)
                      +------+
```

### Example Decompositions

**Feature Implementation (4 phases):**

```
Task: "Add user authentication with JWT"

Phase 1: Architecture Planning
  Agent: architect
  Input: User requirements
  Output: ai-docs/auth-architecture.md
  Checkpoint: Does plan cover all auth requirements?

Phase 2: Implementation
  Agent: developer
  Input: Architecture plan
  Output: src/auth/*.ts files
  Checkpoint: Does implementation match architecture?

Phase 3: Testing
  Agent: tester
  Input: Implementation files
  Output: tests/auth/*.test.ts files
  Checkpoint: Do tests cover all auth requirements?

Phase 4: Code Review
  Agent: reviewer
  Input: All source and test files
  Output: ai-docs/auth-review.md
  Checkpoint: Does review focus on auth requirements?
```

**Complex Refactoring (5 phases):**

```
Task: "Migrate database from MySQL to PostgreSQL"

Phase 1: Impact Analysis
  Agent: analyst
  Input: Current codebase
  Output: ai-docs/migration-impact.md
  Checkpoint: Are all affected files identified?

Phase 2: Schema Migration
  Agent: developer
  Input: Impact analysis
  Output: migration scripts, new schema files
  Checkpoint: Does schema preserve all data relationships?

Phase 3: Code Migration
  Agent: developer
  Input: Schema changes, impact analysis
  Output: Updated source files
  Checkpoint: Do code changes align with schema migration?

Phase 4: Testing
  Agent: tester
  Input: Migrated code
  Output: Test suite for new database layer
  Checkpoint: Do tests verify data integrity post-migration?

Phase 5: Validation
  Agent: reviewer
  Input: All migration artifacts
  Output: Migration validation report
  Checkpoint: Final alignment with migration requirements
```

**Multi-Agent Code Review (3 phases with parallel):**

```
Task: "Review authentication module for security issues"

Phase 1: Context Gathering
  Agent: analyst
  Input: Auth module source files
  Output: ai-docs/review-context.md
  Checkpoint: Is all relevant code captured?

Phase 2: Parallel Review (3 agents simultaneously)
  Agent A: security-reviewer (focus: vulnerabilities)
  Agent B: code-reviewer (focus: quality)
  Agent C: architecture-reviewer (focus: design)
  Output: 3 review reports
  Checkpoint: Do all reviews address auth security?

Phase 3: Consolidation
  Agent: coordinator (self)
  Input: 3 review reports + original requirements
  Output: Consolidated review with consensus
  Checkpoint: Final report covers all security requirements
```

---

## Best Practices

**Do:**
- Initialize coordinator context BEFORE any agent execution
- Write immutable requirements file (no agent may modify it)
- Validate at EVERY phase boundary (not just at the end)
- Use structured checkpoint format (consistent, parseable)
- Propagate key findings to next phase via files
- Set maximum re-runs per phase (2) and total corrections (5)
- Keep coordinator lightweight (validate, don't implement)
- Use file-based communication between coordinator and agents
- Track drift history across phases to detect patterns

**Don't:**
- Skip checkpoints for "simple" phases (drift is subtle)
- Let the coordinator write code or make implementation decisions
- Re-run phases indefinitely (set limits, then escalate)
- Embed all requirements in Task prompts (use file references)
- Ignore MINOR_DRIFT (it accumulates across phases)
- Over-decompose into too many micro-phases (5-7 phases is typical)
- Use the coordinator for 1-2 agent workflows (unnecessary overhead)
- Modify the coordinator-context.md during execution
- Batch all checkpoints at the end (validate between each phase)

**Overhead Considerations:**

```
Coordinator Overhead:

Per checkpoint: ~30s (read artifacts, validate, write result)
Per correction: ~1-3 min (write guidance, re-run phase)

Workflow overhead estimate:
  4-phase workflow: 4 checkpoints x 30s = 2 min overhead
  With 1 correction: 2 min + 2 min = 4 min overhead
  With 2 corrections: 2 min + 4 min = 6 min overhead

Break-even analysis:
  Without coordinator: 15 min workflow, 30% chance of drift
  With coordinator: 17-21 min workflow, <5% chance of drift

  Value: 2-6 min overhead prevents 30-60 min rework from drift
```

**Anti-Patterns:**

```
Over-Decomposition:
  10+ phases for a simple feature
  Problem: More checkpoints than actual work
  Fix: Combine related phases (plan+design, implement+refactor)

Coordinator as Bottleneck:
  Coordinator does extensive analysis at each checkpoint
  Problem: 5+ min per checkpoint, workflow stalls
  Fix: Keep checkpoints lightweight (30s validation, not deep analysis)

Checkpoint Theater:
  Checkpoints always pass without real validation
  Problem: Drift goes undetected, false sense of alignment
  Fix: Check specific criteria against specific artifacts

Scope Creep in Corrections:
  Corrections add new requirements not in original request
  Problem: Coordinator itself introduces drift
  Fix: Corrections only reference original coordinator-context.md
```

---

## Examples

### Example 1: 4-Phase Feature Implementation with Coordinator

**Scenario:** User requests "Add pagination to the products API endpoint with cursor-based navigation and total count in response"

**Execution:**

```
Step 0: Coordinator Initialization

Write: ai-docs/coordinator-context.md
  # Coordinator Context (IMMUTABLE)

  ## Original User Request
  "Add pagination to the products API endpoint with cursor-based
   navigation and total count in response"

  ## Success Criteria
  1. Products endpoint supports cursor-based pagination
  2. Response includes total_count field
  3. Page size is configurable via query parameter
  4. Backward compatible with existing v1 API

  ## Scope Boundaries
  IN SCOPE: Pagination, cursor navigation, total count, page size
  OUT OF SCOPE: Sorting, filtering, search, new endpoints

Tasks:
  [ ] PHASE 1: Architecture planning
  [ ] CHECKPOINT 1: Validate architecture alignment
  [ ] PHASE 2: Implementation
  [ ] CHECKPOINT 2: Validate implementation alignment
  [ ] PHASE 3: Testing
  [ ] CHECKPOINT 3: Validate test coverage alignment
  [ ] PHASE 4: Code review
  [ ] CHECKPOINT 4: Final alignment validation

---

Step 1: PHASE 1 - Architecture Planning
  Task: architect
    Prompt: "Read ai-docs/coordinator-context.md.
             Design pagination architecture for products endpoint."
    Output: ai-docs/pagination-architecture.md
    Return: "Architecture plan complete. Cursor-based with total count."

Step 2: CHECKPOINT 1
  Coordinator reads ai-docs/pagination-architecture.md
  Validates against ai-docs/coordinator-context.md

  Result:
    Criterion 1: Cursor pagination designed      [MET]
    Criterion 2: Total count field planned        [MET]
    Criterion 3: Page size parameter defined      [MET]
    Criterion 4: v1 backward compat addressed     [MET]
    Out-of-scope additions: None

  Verdict: ALIGNED (4/4 criteria, no drift)
  Action: PROCEED to Phase 2

  Write: ai-docs/checkpoint-1.md
  Write: ai-docs/phase-1-findings.md

---

Step 3: PHASE 2 - Implementation
  Task: developer
    Prompt: "Read ai-docs/coordinator-context.md.
             Read ai-docs/phase-1-findings.md.
             Implement pagination per architecture plan."
    Output: src/routes/products.ts (modified)
    Return: "Implementation complete. Pagination with cursor and total count."

Step 4: CHECKPOINT 2
  Coordinator reads implementation diff
  Validates against requirements

  Result:
    Criterion 1: Cursor pagination implemented    [MET]
    Criterion 2: Total count field present         [MET]
    Criterion 3: Page size parameter works         [MET]
    Criterion 4: v1 backward compat maintained     [MET]
    Out-of-scope: Added sorting by createdAt       [DRIFT]

  Verdict: MINOR_DRIFT (4/4 criteria met, but scope creep)

  Corrective Action:
    Write: ai-docs/correction-phase-2.md
      "Remove sorting by createdAt (lines 45-52).
       Not in original requirements. Keep focus on pagination."

  Note to Phase 3:
    Write: ai-docs/phase-2-findings.md
      "Implementation complete with correction applied.
       CONTEXT: Sorting code removed. Test pagination only."

---

Step 5: PHASE 3 - Testing
  Task: tester
    Prompt: "Read ai-docs/coordinator-context.md.
             Read ai-docs/phase-2-findings.md.
             Write tests for pagination implementation."
    Output: tests/products-pagination.test.ts
    Return: "20 tests covering cursor pagination, total count, page size."

Step 6: CHECKPOINT 3
  Coordinator reads test file
  Validates test coverage against requirements

  Result:
    Criterion 1: Cursor pagination tests          [MET] (8 tests)
    Criterion 2: Total count tests                 [MET] (4 tests)
    Criterion 3: Page size tests                   [MET] (5 tests)
    Criterion 4: Backward compat tests             [MET] (3 tests)
    Out-of-scope tests: None

  Verdict: ALIGNED (4/4 criteria, all tests on-target)
  Action: PROCEED to Phase 4

---

Step 7: PHASE 4 - Code Review
  Task: reviewer
    Prompt: "Read ai-docs/coordinator-context.md.
             Review pagination implementation and tests."
    Output: ai-docs/pagination-review.md
    Return: "Review complete. 1 MEDIUM issue found."

Step 8: CHECKPOINT 4 (Final)
  Coordinator validates review focused on requirements

  Verdict: ALIGNED
  Action: Workflow complete

  Final Report:
    "Pagination feature implemented and validated.
     4/4 success criteria met.
     1 drift correction applied (Phase 2: removed scope creep).
     1 MEDIUM review issue to address.
     Total checkpoints: 4 (3 ALIGNED, 1 MINOR_DRIFT corrected)"
```

---

### Example 2: Multi-Agent Code Review with Drift Detection

**Scenario:** User requests "Review the auth module for SQL injection vulnerabilities"

**Execution:**

```
Step 0: Coordinator Initialization

Write: ai-docs/coordinator-context.md
  ## Original User Request
  "Review the auth module for SQL injection vulnerabilities"

  ## Success Criteria
  1. All database queries in auth module are analyzed
  2. SQL injection vectors identified (if any)
  3. Remediation recommendations provided for each finding
  4. Risk severity classified per finding

  ## Scope
  IN SCOPE: SQL injection in auth module only
  OUT OF SCOPE: XSS, CSRF, other modules, general code quality

Tasks:
  [ ] PHASE 1: Gather auth module context
  [ ] CHECKPOINT 1: Validate context completeness
  [ ] PHASE 2a: Security reviewer (SQL injection focus)
  [ ] PHASE 2b: Code reviewer (query pattern analysis)
  [ ] CHECKPOINT 2: Validate reviews address SQL injection
  [ ] PHASE 3: Consolidation
  [ ] CHECKPOINT 3: Final alignment

---

Step 1: PHASE 1 - Context Gathering
  Task: analyst
    Output: ai-docs/auth-review-context.md (all auth DB queries)

  CHECKPOINT 1: ALIGNED (all auth queries captured)

---

Step 2: PHASE 2 - Parallel Review
  Task A: security-reviewer
    Prompt: "Focus on SQL injection vulnerabilities ONLY."
    Output: ai-docs/security-review.md

  Task B: code-reviewer
    Prompt: "Analyze query patterns for injection risks ONLY."
    Output: ai-docs/query-review.md

  CHECKPOINT 2:
    Security review: Focused on SQL injection         [ALIGNED]
    Code review: Focused on SQL injection             [ALIGNED]
    BUT code reviewer also flagged N+1 query issues   [MINOR_DRIFT]

    Verdict: MINOR_DRIFT
    Correction: "Phase 3 consolidation should exclude N+1 query findings.
                 Focus consolidation on SQL injection only."

---

Step 3: PHASE 3 - Consolidation (with correction applied)
  Coordinator consolidates reviews, excluding off-topic findings

  CHECKPOINT 3: ALIGNED
    Consolidated report covers SQL injection only
    All queries analyzed, findings classified by severity

  Final Report:
    "Auth module SQL injection review complete.
     3 queries analyzed, 1 injection risk found (HIGH severity).
     Remediation: Use parameterized query in login endpoint.
     1 drift correction applied (excluded off-topic findings)."
```

---

### Example 3: Complex Refactoring with Checkpoint Validation

**Scenario:** User requests "Refactor the payment module to use the Strategy pattern for payment providers"

**Execution:**

```
Step 0: Coordinator Initialization

Write: ai-docs/coordinator-context.md
  ## Original User Request
  "Refactor payment module to use Strategy pattern for payment providers"

  ## Success Criteria
  1. PaymentStrategy interface defined
  2. Each provider implements PaymentStrategy
  3. PaymentService uses strategy injection (no switch/case)
  4. All existing tests pass after refactoring
  5. No behavior change (pure refactoring)

  ## Scope
  IN SCOPE: Strategy pattern refactoring of payment providers
  OUT OF SCOPE: New payment providers, API changes, new features

Tasks:
  [ ] PHASE 1: Impact analysis
  [ ] CHECKPOINT 1: Validate analysis completeness
  [ ] PHASE 2: Interface design
  [ ] CHECKPOINT 2: Validate Strategy pattern correctness
  [ ] PHASE 3: Implementation
  [ ] CHECKPOINT 3: Validate refactoring alignment
  [ ] PHASE 4: Test validation
  [ ] CHECKPOINT 4: Verify no behavior change
  [ ] PHASE 5: Final review
  [ ] CHECKPOINT 5: Final alignment

---

PHASE 1: Impact Analysis
  Agent: analyst
  Output: 8 files affected, 3 payment providers, 45 tests
  CHECKPOINT 1: ALIGNED

PHASE 2: Interface Design
  Agent: architect
  Output: PaymentStrategy interface + provider contracts
  CHECKPOINT 2: ALIGNED

PHASE 3: Implementation
  Agent: developer
  Output: Refactored files with Strategy pattern
  CHECKPOINT 3:
    Criterion 1: PaymentStrategy interface defined        [MET]
    Criterion 2: Providers implement interface             [MET]
    Criterion 3: No switch/case in PaymentService          [MET]
    Criterion 4: (Tested in Phase 4)                       [PENDING]
    Criterion 5: No behavior change                        [CONCERN]
      Developer added a retry mechanism to StripeStrategy
      This is a BEHAVIOR CHANGE (not pure refactoring)

    Verdict: MAJOR_DRIFT
    Action: Re-run Phase 3

    Correction: "Remove retry mechanism from StripeStrategy.
                 This is a behavior change, not a refactoring.
                 Pure refactoring only: same behavior, new structure."

  PHASE 3 (Re-run):
    Agent: developer (with correction)
    Output: Clean refactoring without behavior changes
    CHECKPOINT 3 (Re-validate): ALIGNED

PHASE 4: Test Validation
  Agent: tester
  Output: All 45 tests pass, no behavior changes detected
  CHECKPOINT 4: ALIGNED

PHASE 5: Final Review
  Agent: reviewer
  Output: Clean Strategy pattern implementation
  CHECKPOINT 5: ALIGNED

Final Report:
  "Payment module refactored to Strategy pattern.
   5/5 success criteria met.
   1 major drift corrected (Phase 3: removed behavior change).
   All 45 existing tests pass. No behavior changes."
```

---

## Troubleshooting

**Problem: Coordinator context file gets modified during execution**

Cause: An agent edited coordinator-context.md

Solution: Make the file explicitly immutable in instructions

```
In every agent prompt, include:
  "WARNING: Do NOT modify ai-docs/coordinator-context.md.
   This file contains immutable requirements."

Validation: Coordinator can checksum the file after each phase
  to detect unauthorized modifications.
```

---

**Problem: Checkpoints always pass (no drift detected)**

Cause: Checkpoint validation is too superficial

Solution: Check specific criteria against specific artifacts

```
Superficial (catches nothing):
  "Does this output look correct?" -> "Yes"

Specific (catches drift):
  "Criterion 2 requires total_count in response.
   Search implementation for 'total_count' or 'totalCount'.
   Found: No. DRIFT DETECTED."
```

---

**Problem: Too many corrections, workflow takes too long**

Cause: Requirements are ambiguous, causing repeated drift

Solution: Pause and clarify requirements with user

```
After 3+ corrections:
  "Requirements may be ambiguous. Found drift in phases 2, 3, and 4.

   Current understanding:
   - [coordinator's interpretation]

   Is this correct, or should requirements be clarified?"
```

---

**Problem: Coordinator adds scope during corrections**

Cause: Corrective actions introduce new requirements

Solution: Corrections must only reference original coordinator-context.md

```
Correction validation rule:
  Every corrective instruction must trace back to a specific
  criterion in coordinator-context.md.

  "Remove sorting" -> traces to OUT OF SCOPE list
  "Add caching" -> does NOT trace to any criterion -> INVALID
```

---

## Summary

The hierarchical coordinator prevents goal drift through:

- **Immutable context** (requirements captured once, never modified)
- **Phase decomposition** (complex tasks split into agent-assignable phases)
- **Checkpoint validation** (structured alignment check after each phase)
- **Drift detection** (ALIGNED, MINOR_DRIFT, MAJOR_DRIFT, OFF_TRACK)
- **Corrective actions** (specific guidance to fix drift before next phase)
- **Phase gates** (formal proceed/retry/abort decisions)
- **Shared state** (Tasks + files for cross-agent context)
- **Escalation limits** (max re-runs and corrections before user intervention)

The overhead is 2-6 minutes per workflow, but prevents 30-60 minutes of rework from undetected drift. Use this pattern for any workflow with 3+ agents where the final output must precisely match the original request.

---

**Inspired By:**
- claude-flow queen-worker hierarchy (simplified for Claude Code plugins)
- `/implement` command multi-phase workflows
- `/review` command validation patterns
- quality-gates skill (extended with drift awareness)
- task-orchestration skill (enhanced with coordinator state)

---
name: task-orchestration
description: Track progress in multi-phase workflows with Tasks system. Use when orchestrating 5+ phase commands, managing iteration loops, tracking parallel tasks, or providing real-time progress visibility. Trigger keywords - "phase tracking", "progress", "workflow", "multi-step", "multi-phase", "tasks", "tracking", "status".
version: 2.0.0
tags: [orchestration, tasks, progress, tracking, workflow, multi-phase]
keywords: [phase-tracking, progress, workflow, multi-step, multi-phase, tasks, tracking, status, visibility]
plugin: multimodel
updated: 2026-01-31
---

# Task Orchestration

**Version:** 2.0.0
**Purpose:** Patterns for using Tasks system in complex multi-phase workflows
**Status:** Production Ready

## Overview

Task orchestration is the practice of using the Tasks system (TaskCreate, TaskUpdate, TaskList, TaskGet) to provide **real-time progress visibility** in complex multi-phase workflows. It transforms opaque "black box" workflows into transparent, trackable processes where users can see:

- What phase is currently executing
- How many phases remain
- Which tasks are pending, in-progress, or completed
- Overall progress percentage
- Iteration counts in loops
- Task dependencies and blocking relationships

This skill provides battle-tested patterns for:
- **Phase initialization** (create complete task list before starting)
- **Task granularity** (how to break phases into trackable tasks)
- **Status transitions** (pending → in_progress → completed)
- **Real-time updates** (mark complete immediately, not batched)
- **Iteration tracking** (progress through loops)
- **Parallel task tracking** (multiple agents executing simultaneously)
- **Task dependencies** (blockedBy/blocks relationships)
- **Cross-session persistence** (resume work across sessions)

Task orchestration is especially valuable for workflows with >5 phases or >10 minutes duration, where users need progress feedback.

## Tasks System API

The Tasks system provides 4 tools:

**TaskCreate**: Create a new task
```
TaskCreate:
  subject: "PHASE 1: Gather requirements"
  description: "Ask user for feature requirements"
  activeForm: "Gathering requirements"
  status: "pending"
  blockedBy: ["prerequisite-task-id"]  // Optional
  owner: "agent-name"                   // Optional
```

**TaskUpdate**: Update task status or fields
```
TaskUpdate: taskId="task-123", status="in_progress"
TaskUpdate: taskId="task-123", status="completed"
TaskUpdate: taskId="task-123", description="Updated description"
```

**TaskList**: View all tasks
```
TaskList  // Shows all tasks with statuses
```

**TaskGet**: Get specific task details
```
TaskGet: taskId="task-123"
```

## Core Patterns

### Pattern 1: Phase Initialization

**Create Tasks BEFORE Starting:**

Initialize Tasks as **step 0** of your workflow, before any actual work begins:

```
✅ CORRECT - Initialize First:

Step 0: Initialize Tasks
  TaskCreate:
    subject: "PHASE 1: Gather user inputs"
    activeForm: "Gathering inputs"

  TaskCreate:
    subject: "PHASE 1: Validate inputs"
    activeForm: "Validating inputs"
    blockedBy: ["phase-1-gather-id"]

  TaskCreate:
    subject: "PHASE 2: Select AI models"
    activeForm: "Selecting models"

  TaskCreate:
    subject: "PHASE 2: Estimate costs"
    activeForm: "Estimating costs"

  TaskCreate:
    subject: "PHASE 3: Launch parallel reviews"
    activeForm: "Launching reviews"
    blockedBy: ["phase-2-approve-id"]

  TaskCreate:
    subject: "PHASE 4: Consolidate reviews"
    activeForm: "Consolidating"

  TaskCreate:
    subject: "PHASE 5: Present results"
    activeForm: "Presenting"

Step 1: Start actual work (PHASE 1)
  TaskUpdate: taskId="phase-1-gather-id", status="in_progress"
  ... do work ...
  TaskUpdate: taskId="phase-1-gather-id", status="completed"

  TaskUpdate: taskId="phase-1-validate-id", status="in_progress"
  ... do work ...

❌ WRONG - Create During Workflow:

Step 1: Do some work
  ... work happens ...
  TaskCreate: subject="Did some work", status="completed"

Step 2: Do more work
  ... work happens ...
  TaskCreate: subject="Did more work", status="completed"

Problem: User has no visibility into upcoming phases
```

**List All Phases Upfront:**

When initializing, create **all tasks** in the workflow, not just the current phase:

```
✅ CORRECT - Complete Visibility:

TaskCreate: subject="PHASE 1: Gather user inputs"
TaskCreate: subject="PHASE 1: Validate inputs"
TaskCreate: subject="PHASE 2: Architecture planning"
TaskCreate: subject="PHASE 3: Implementation"
TaskCreate: subject="PHASE 3: Run quality checks"
TaskCreate: subject="PHASE 4: Code review"
TaskCreate: subject="PHASE 5: User acceptance"
TaskCreate: subject="PHASE 6: Generate report"

User sees: "8 tasks total, 0 complete, Phase 1 starting"

❌ WRONG - Incremental Discovery:

TaskCreate: subject="PHASE 1: Gather user inputs"
TaskCreate: subject="PHASE 1: Validate inputs"

(User thinks workflow is 2 tasks, then surprised by 6 more phases)
```

**Why Initialize First:**

1. **User expectation setting:** User knows workflow scope (8 phases, ~20 minutes)
2. **Progress visibility:** User can see % complete (3/8 = 37.5%)
3. **Time estimation:** User can estimate remaining time based on progress
4. **Transparency:** No hidden phases or surprises

---

### Pattern 2: Task Granularity Guidelines

**One Task Per Significant Operation:**

Each task should represent a **significant operation** (1-5 minutes of work):

```
✅ CORRECT - Significant Operations:

TaskCreate: subject="PHASE 1: Ask user for inputs", activeForm="Asking user"
TaskCreate: subject="PHASE 2: Generate architecture plan", activeForm="Generating plan"
TaskCreate: subject="PHASE 3: Implement feature", activeForm="Implementing"
TaskCreate: subject="PHASE 4: Run tests", activeForm="Running tests"
TaskCreate: subject="PHASE 5: Code review", activeForm="Reviewing"

Each task = meaningful unit of work

❌ WRONG - Too Granular:

TaskCreate: subject="PHASE 1: Ask user question 1"
TaskCreate: subject="PHASE 1: Ask user question 2"
TaskCreate: subject="PHASE 1: Ask user question 3"
TaskCreate: subject="PHASE 2: Read file A"
TaskCreate: subject="PHASE 2: Read file B"
... (50 micro-tasks)

Problem: Too many updates, clutters user interface
```

**Multi-Step Phases: Break Into 2-3 Sub-Tasks:**

For complex phases (>5 minutes), break into 2-3 sub-tasks:

```
✅ CORRECT - Sub-Task Breakdown:

PHASE 3: Implementation (15 min total)
  → Sub-tasks:
    TaskCreate: subject="PHASE 3: Implement core logic", activeForm="Implementing core"
    TaskCreate: subject="PHASE 3: Add error handling", activeForm="Adding error handling"
    TaskCreate: subject="PHASE 3: Write tests", activeForm="Writing tests"

User sees progress within phase: "PHASE 3: 2/3 complete"

❌ WRONG - Single Monolithic Task:

TaskCreate: subject="PHASE 3: Implementation"

Problem: User sees "in_progress" for 15 min with no updates
```

**Avoid Too Many Tasks:**

Limit to **max 15-20 tasks** for readability:

```
✅ CORRECT - 12 Tasks (readable):

10-phase workflow:
  TaskCreate: subject="PHASE 1: Ask user"
  TaskCreate: subject="PHASE 2: Plan architecture"
  TaskCreate: subject="PHASE 2: Review plan"
  TaskCreate: subject="PHASE 3: Implement core"
  TaskCreate: subject="PHASE 3: Add error handling"
  TaskCreate: subject="PHASE 3: Write tests"
  TaskCreate: subject="PHASE 4: Test"
  TaskCreate: subject="PHASE 5: Review code"
  TaskCreate: subject="PHASE 5: Fix issues"
  TaskCreate: subject="PHASE 6: Re-review"
  TaskCreate: subject="PHASE 7: Accept"
  TaskCreate: subject="PHASE 8: Document"

Total: 12 tasks (clean, trackable)

❌ WRONG - 50 Tasks (overwhelming):

Every single action as separate task:
  TaskCreate: subject="Read file 1"
  TaskCreate: subject="Read file 2"
  TaskCreate: subject="Write file 3"
  ... (50 tasks)

Problem: User overwhelmed, can't see forest for trees
```

**Guideline by Workflow Duration:**

```
Workflow Duration → Task Count:

< 5 minutes:    3-5 tasks
5-15 minutes:   8-12 tasks
15-30 minutes:  12-18 tasks
> 30 minutes:   15-20 tasks (if more, group into phases)

Example:
  5-minute workflow (3 phases):
    TaskCreate: subject="PHASE 1: Prepare"
    TaskCreate: subject="PHASE 2: Execute"
    TaskCreate: subject="PHASE 3: Present"
  Total: 3 tasks ✓

  20-minute workflow (6 phases):
    TaskCreate: subject="PHASE 1: Ask user"
    TaskCreate: subject="PHASE 2: Plan architecture"
    TaskCreate: subject="PHASE 2: Review plan"
    TaskCreate: subject="PHASE 3: Implement core"
    TaskCreate: subject="PHASE 3: Add error handling"
    TaskCreate: subject="PHASE 3: Write tests"
    TaskCreate: subject="PHASE 4: Test"
    TaskCreate: subject="PHASE 5: Review code"
    TaskCreate: subject="PHASE 5: Fix issues"
    TaskCreate: subject="PHASE 6: Re-review"
    TaskCreate: subject="PHASE 7: Accept"
  Total: 11 tasks ✓
```

---

### Pattern 3: Status Transitions

**Exactly ONE Task In Progress at a Time:**

Maintain the invariant: **exactly one task in_progress** at any moment:

```
✅ CORRECT - One In-Progress:

State at time T1:
  [✓] PHASE 1: Ask user (completed)
  [✓] PHASE 2: Plan (completed)
  [→] PHASE 3: Implement (in_progress)  ← Only one
  [ ] PHASE 4: Test (pending)
  [ ] PHASE 5: Review (pending)

State at time T2 (after PHASE 3 completes):
  [✓] PHASE 1: Ask user (completed)
  [✓] PHASE 2: Plan (completed)
  [✓] PHASE 3: Implement (completed)
  [→] PHASE 4: Test (in_progress)  ← Only one
  [ ] PHASE 5: Review (pending)

❌ WRONG - Multiple In-Progress:

State:
  [✓] PHASE 1: Ask user (completed)
  [→] PHASE 2: Plan (in_progress)  ← Two in-progress?
  [→] PHASE 3: Implement (in_progress)  ← Confusing!
  [ ] PHASE 4: Test (pending)

Problem: User confused about current phase
```

**Status Transition Sequence:**

```
Lifecycle of a Task:

1. Created: pending
   TaskCreate: subject="PHASE 1: Gather inputs", status="pending"

2. Started: pending → in_progress
   TaskUpdate: taskId="phase-1-id", status="in_progress"

3. Completed: in_progress → completed
   TaskUpdate: taskId="phase-1-id", status="completed"

4. Next task: Mark next task as in_progress
   TaskUpdate: taskId="phase-2-id", status="in_progress"

Example Timeline:

T=0s:  TaskUpdate: taskId="task-1-id", status="in_progress"
       [→] Task 1 (in_progress), [ ] Task 2 (pending)

T=30s: TaskUpdate: taskId="task-1-id", status="completed"
       TaskUpdate: taskId="task-2-id", status="in_progress"
       [✓] Task 1 (completed), [→] Task 2 (in_progress)

T=60s: TaskUpdate: taskId="task-2-id", status="completed"
       [✓] Task 1 (completed), [✓] Task 2 (completed)
```

**NEVER Batch Completions:**

Mark tasks completed **immediately** after finishing, not at end of phase:

```
✅ CORRECT - Immediate Updates:

TaskUpdate: taskId="phase-1-ask-id", status="in_progress"
... do work (30s) ...
TaskUpdate: taskId="phase-1-ask-id", status="completed"  ← Immediate

TaskUpdate: taskId="phase-1-validate-id", status="in_progress"
... do work (20s) ...
TaskUpdate: taskId="phase-1-validate-id", status="completed"  ← Immediate

User sees real-time progress

❌ WRONG - Batched Updates:

TaskUpdate: taskId="phase-1-ask-id", status="in_progress"
... do work (30s) ...

TaskUpdate: taskId="phase-1-validate-id", status="in_progress"
... do work (20s) ...

(At end of PHASE 1, batch update both to completed)

Problem: User doesn't see progress for 50s, thinks workflow is stuck
```

---

### Pattern 4: Real-Time Progress Tracking

**TaskUpdate As Work Progresses:**

Tasks should reflect **current state**, not past state:

```
✅ CORRECT - Real-Time Updates:

T=0s:  Initialize Tasks (8 tasks, all pending)
T=5s:  TaskUpdate: taskId="phase-1-id", status="in_progress"
T=35s: TaskUpdate: taskId="phase-1-id", status="completed"
       TaskUpdate: taskId="phase-2-id", status="in_progress"
T=90s: TaskUpdate: taskId="phase-2-id", status="completed"
       TaskUpdate: taskId="phase-3-id", status="in_progress"
...

User always sees accurate current state

❌ WRONG - Delayed Updates:

T=0s:   Initialize Tasks
T=300s: Workflow completes
T=301s: Update all tasks to completed

Problem: No progress visibility for 5 minutes
```

**Add New Tasks If Discovered During Execution:**

If you discover additional work during execution, create new tasks:

```
Scenario: During implementation, realize refactoring needed

Initial Tasks:
  [✓] PHASE 1: Plan (completed)
  [→] PHASE 2: Implement (in_progress)
  [ ] PHASE 3: Test (pending)
  [ ] PHASE 4: Review (pending)

During PHASE 2, discover:
  "Implementation requires refactoring legacy code"

TaskUpdate: taskId="phase-2-id", status="completed"
TaskCreate: subject="PHASE 2: Refactor legacy code", activeForm="Refactoring"
TaskUpdate: taskId="new-refactor-id", status="in_progress"

Updated Tasks:
  [✓] PHASE 1: Plan
  [✓] PHASE 2: Implement core logic
  [→] PHASE 2: Refactor legacy code (in_progress)  ← New task
  [ ] PHASE 3: Test
  [ ] PHASE 4: Review

User sees: "Additional work discovered: refactoring. Total now 5 tasks."
```

**User Can See Current Progress at Any Time:**

With real-time updates, user can check progress:

```
User checks at T=120s:

TaskList shows:
  [✓] PHASE 1: Ask user
  [✓] PHASE 2: Plan architecture
  [→] PHASE 3: Implement core logic (in_progress)
  [ ] PHASE 3: Add error handling
  [ ] PHASE 3: Write tests
  [ ] PHASE 4: Code review
  [ ] PHASE 5: Accept

User sees: "3/7 tasks complete (42.8%), currently implementing core logic"
```

---

### Pattern 5: Iteration Loop Tracking

**Create Task Per Iteration:**

For iteration loops, create a task for each iteration:

```
✅ CORRECT - Iteration Tasks:

Design Validation Loop (max 10 iterations):

Initial Tasks:
  TaskCreate: subject="Iteration 1/10: Designer validation"
  TaskCreate: subject="Iteration 2/10: Designer validation"
  TaskCreate: subject="Iteration 3/10: Designer validation"
  ... (create all 10 upfront)

Progress:
  [✓] Iteration 1/10: Designer validation (NEEDS IMPROVEMENT)
  [✓] Iteration 2/10: Designer validation (NEEDS IMPROVEMENT)
  [→] Iteration 3/10: Designer validation (in_progress)
  [ ] Iteration 4/10: Designer validation
  ...

User sees: "Iteration 3/10 in progress, 2 complete"

❌ WRONG - Single Loop Task:

TaskCreate: subject="Design validation loop"

Problem: User sees "in_progress" for 10 minutes, no iteration visibility
```

**Mark Iteration Complete When Done:**

```
Iteration Lifecycle:

Iteration 1:
  TaskUpdate: taskId="iter-1-id", status="in_progress"
  Run designer validation
  If NEEDS IMPROVEMENT: Run developer fixes
  TaskUpdate: taskId="iter-1-id", status="completed"

Iteration 2:
  TaskUpdate: taskId="iter-2-id", status="in_progress"
  Run designer validation
  If PASS: Exit loop early
  TaskUpdate: taskId="iter-2-id", status="completed"

Result: Loop exited after 2 iterations
  [✓] Iteration 1/10 (completed)
  [✓] Iteration 2/10 (completed)
  [ ] Iteration 3/10 (not needed, loop exited)
  ...

User sees: "Loop completed in 2/10 iterations"
```

**Track Total Iterations vs Max Limit:**

```
Iteration Progress:

Max: 10 iterations
Current: 5

TaskList shows:
  [✓] Iteration 1/10
  [✓] Iteration 2/10
  [✓] Iteration 3/10
  [✓] Iteration 4/10
  [→] Iteration 5/10
  [ ] Iteration 6/10
  ...

User sees: "Iteration 5/10 (50% through max)"

Warning at Iteration 8:
  "Iteration 8/10 - approaching max, may escalate to user if not PASS"
```

---

### Pattern 6: Parallel Task Tracking

**Multiple Agents Executing Simultaneously:**

When running agents in parallel, track each separately:

```
✅ CORRECT - Separate Tasks for Parallel Agents:

Multi-Model Review (3 models in parallel):

TaskCreate: subject="PHASE 1: Prepare review context"
TaskCreate: subject="PHASE 2: Claude review", owner="claude-agent"
TaskCreate: subject="PHASE 2: Grok review", owner="grok-agent"
TaskCreate: subject="PHASE 2: Gemini review", owner="gemini-agent"
TaskCreate: subject="PHASE 3: Consolidate reviews"

Launch parallel reviews:
  TaskUpdate: taskId="claude-review-id", status="in_progress"
  TaskUpdate: taskId="grok-review-id", status="in_progress"
  TaskUpdate: taskId="gemini-review-id", status="in_progress"

State:
  [✓] PHASE 1: Prepare review context
  [→] PHASE 2: Claude review (in_progress)
  [→] PHASE 2: Grok review (in_progress)
  [→] PHASE 2: Gemini review (in_progress)
  [ ] PHASE 3: Consolidate reviews

Note: 3 tasks "in_progress" is OK for parallel execution
      (Exception to "one in_progress" rule)

As models complete:
  [✓] PHASE 1: Prepare review context
  [✓] PHASE 2: Claude review (completed)  ← First to finish
  [→] PHASE 2: Grok review (in_progress)
  [→] PHASE 2: Gemini review (in_progress)
  [ ] PHASE 3: Consolidate reviews

User sees: "1/3 reviews complete, 2 in progress"

❌ WRONG - Single Task for Parallel Work:

TaskCreate: subject="PHASE 2: Run 3 reviews"

Problem: No visibility into which reviews are complete
```

**Update As Each Agent Completes:**

```
Parallel Execution Timeline:

T=0s:  Launch 3 reviews in parallel
  TaskUpdate: taskId="claude-id", status="in_progress"
  TaskUpdate: taskId="grok-id", status="in_progress"
  TaskUpdate: taskId="gemini-id", status="in_progress"

  [→] Claude review (in_progress)
  [→] Grok review (in_progress)
  [→] Gemini review (in_progress)

T=60s: Claude completes first
  TaskUpdate: taskId="claude-id", status="completed"

  [✓] Claude review (completed)
  [→] Grok review (in_progress)
  [→] Gemini review (in_progress)

T=120s: Gemini completes
  TaskUpdate: taskId="gemini-id", status="completed"

  [✓] Claude review (completed)
  [→] Grok review (in_progress)
  [✓] Gemini review (completed)

T=180s: Grok completes
  TaskUpdate: taskId="grok-id", status="completed"

  [✓] Claude review (completed)
  [✓] Grok review (completed)
  [✓] Gemini review (completed)

User sees real-time completion updates
```

---

### Pattern 7: Task Dependencies

**Use blockedBy for Phase Dependencies:**

Track which tasks must complete before others can start:

```
✅ CORRECT - Dependency Tracking:

TaskCreate:
  subject: "PHASE 1: Gather requirements"
  activeForm: "Gathering requirements"
  // Returns taskId: "phase-1-id"

TaskCreate:
  subject: "PHASE 2: Design architecture"
  activeForm: "Designing"
  blockedBy: ["phase-1-id"]  ← Blocks until PHASE 1 complete

TaskCreate:
  subject: "PHASE 3: Implementation"
  activeForm: "Implementing"
  blockedBy: ["phase-2-id"]  ← Blocks until PHASE 2 complete

When PHASE 1 completes:
  TaskUpdate: taskId="phase-1-id", status="completed"
  → PHASE 2 automatically unblocked

Benefits:
- System prevents starting PHASE 2 before PHASE 1 complete
- User sees dependency chain
- Automatic unblocking when prerequisites complete
```

**Parallel Tasks with Shared Blocker:**

Multiple tasks can depend on same prerequisite:

```
TaskCreate:
  subject: "PHASE 1: Prepare context"
  // Returns: "context-id"

TaskCreate:
  subject: "PHASE 2: Claude review"
  owner: "claude-agent"
  blockedBy: ["context-id"]

TaskCreate:
  subject: "PHASE 2: Grok review"
  owner: "grok-agent"
  blockedBy: ["context-id"]

TaskCreate:
  subject: "PHASE 2: Gemini review"
  owner: "gemini-agent"
  blockedBy: ["context-id"]

When context preparation completes:
  TaskUpdate: taskId="context-id", status="completed"
  → All 3 reviews automatically unblocked and can start in parallel
```

**Complex Dependency Chains:**

```
Sequential with parallel phases:

TaskCreate: subject="PHASE 1: Requirements"
  → phase-1-id

TaskCreate: subject="PHASE 2: Design"
  blockedBy: ["phase-1-id"]
  → phase-2-id

TaskCreate: subject="PHASE 3: Implement Backend"
  owner: "backend-developer"
  blockedBy: ["phase-2-id"]
  → backend-id

TaskCreate: subject="PHASE 3: Implement Frontend"
  owner: "frontend-developer"
  blockedBy: ["phase-2-id"]
  → frontend-id

TaskCreate: subject="PHASE 4: Integration Tests"
  blockedBy: ["backend-id", "frontend-id"]  ← Waits for both
  → integration-id

Execution:
1. PHASE 1 completes → Unblocks PHASE 2
2. PHASE 2 completes → Unblocks Backend + Frontend (parallel)
3. Both Backend + Frontend complete → Unblocks Integration Tests
```

---

### Pattern 8: Cross-Session Persistence

**Resume Work Across Sessions:**

Tasks persist across Claude Code sessions when using CLAUDE_CODE_TASK_LIST_ID:

```
Session 1 (Initial Implementation):

# Set task list ID for this feature
export CLAUDE_CODE_TASK_LIST_ID=feature-auth
claude

# Create tasks
TaskCreate: subject="PHASE 1: Design auth flow"
TaskCreate: subject="PHASE 2: Implement backend"
TaskCreate: subject="PHASE 3: Implement frontend"
TaskCreate: subject="PHASE 4: Testing"

# Complete PHASE 1
TaskUpdate: taskId="phase-1-id", status="in_progress"
... work ...
TaskUpdate: taskId="phase-1-id", status="completed"

# Start PHASE 2 (not finished)
TaskUpdate: taskId="phase-2-id", status="in_progress"
... partial work ...
exit

---

Session 2 (Resume Later):

# Same task list ID
export CLAUDE_CODE_TASK_LIST_ID=feature-auth
claude

# Tasks still visible!
TaskList shows:
  [✓] PHASE 1: Design auth flow (completed)
  [→] PHASE 2: Implement backend (in_progress)  ← Resume here
  [ ] PHASE 3: Implement frontend
  [ ] PHASE 4: Testing

# Continue where left off
... complete PHASE 2 ...
TaskUpdate: taskId="phase-2-id", status="completed"

# Start PHASE 3
TaskUpdate: taskId="phase-3-id", status="in_progress"
```

**Benefits:**

- Work on large features across multiple sessions
- Never lose progress tracking
- Team members can see task status
- Clear handoff points between sessions

**Best Practices:**

```
✅ Use meaningful task list IDs:
  export CLAUDE_CODE_TASK_LIST_ID=feature-auth
  export CLAUDE_CODE_TASK_LIST_ID=bug-payment-failure
  export CLAUDE_CODE_TASK_LIST_ID=refactor-api

❌ Avoid generic IDs:
  export CLAUDE_CODE_TASK_LIST_ID=work
  export CLAUDE_CODE_TASK_LIST_ID=tasks
```

---

## Integration with Other Skills

**task-orchestration + multi-agent-coordination:**

```
Use Case: Multi-phase implementation workflow

Step 1: Initialize Tasks (task-orchestration)
  TaskCreate: subject="PHASE 1: Requirements"
  TaskCreate: subject="PHASE 2: Architecture"
  TaskCreate: subject="PHASE 3: Backend Implementation"
  TaskCreate: subject="PHASE 4: Frontend Implementation"
  TaskCreate: subject="PHASE 5: Testing"
  ... (8 total phases)

Step 2: Sequential Agent Delegation (multi-agent-coordination)
  Phase 1: api-architect
    TaskUpdate: taskId="phase-1-id", status="in_progress"
    Delegate to api-architect
    TaskUpdate: taskId="phase-1-id", status="completed"

  Phase 2: backend-developer
    TaskUpdate: taskId="phase-2-id", status="in_progress"
    Delegate to backend-developer
    TaskUpdate: taskId="phase-2-id", status="completed"

  ... continue for all phases
```

**task-orchestration + multi-model-validation:**

```
Use Case: Multi-model review with progress tracking

Step 1: Initialize Tasks (task-orchestration)
  TaskCreate: subject="PHASE 1: Prepare context"
  TaskCreate: subject="PHASE 2: Claude review", owner="claude"
  TaskCreate: subject="PHASE 2: Grok review", owner="grok"
  TaskCreate: subject="PHASE 2: Gemini review", owner="gemini"
  TaskCreate: subject="PHASE 2: GPT-5 review", owner="gpt"
  TaskCreate: subject="PHASE 2: DeepSeek review", owner="deepseek"
  TaskCreate: subject="PHASE 3: Consolidate results"

Step 2: Parallel Execution (multi-model-validation)
  TaskUpdate: taskId="phase-1-id", status="in_progress"
  ... prepare context ...
  TaskUpdate: taskId="phase-1-id", status="completed"

  Launch all 5 models simultaneously
  TaskUpdate: taskId="claude-id", status="in_progress"
  TaskUpdate: taskId="grok-id", status="in_progress"
  ... (all 5 in_progress)

  As each completes: TaskUpdate with status="completed"

Step 3: Real-Time Visibility (task-orchestration)
  User sees: "PHASE 2: 3/5 reviews complete..."
```

**task-orchestration + quality-gates:**

```
Use Case: Iteration loop with Tasks tracking

Step 1: Initialize Tasks (task-orchestration)
  TaskCreate: subject="Iteration 1/10: Designer validation"
  TaskCreate: subject="Iteration 2/10: Designer validation"
  TaskCreate: subject="Iteration 3/10: Designer validation"
  ... (10 iterations)

Step 2: Iteration Loop (quality-gates)
  For i = 1 to 10:
    TaskUpdate: taskId="iter-i-id", status="in_progress"
    Run designer validation
    If PASS: Exit loop
    TaskUpdate: taskId="iter-i-id", status="completed"

Step 3: Progress Visibility
  User sees: "Iteration 5/10 complete, 5 remaining"
```

---

## Best Practices

**Do:**
- ✅ Initialize Tasks BEFORE starting work (step 0)
- ✅ Create ALL phase tasks upfront (user sees complete scope)
- ✅ Use 8-15 tasks for typical workflows (readable)
- ✅ TaskUpdate to completed IMMEDIATELY after finishing (real-time)
- ✅ Keep exactly ONE task in_progress (except parallel tasks)
- ✅ Track iterations separately (Iteration 1/10, 2/10, ...)
- ✅ Update as work progresses (not batched at end)
- ✅ Create new tasks if discovered during execution
- ✅ Use blockedBy for dependencies
- ✅ Use owner field for parallel agent tracking
- ✅ Use CLAUDE_CODE_TASK_LIST_ID for cross-session work

**Don't:**
- ❌ Create tasks during workflow (initialize first)
- ❌ Hide phases from user (create all upfront)
- ❌ Create too many tasks (>20 overwhelms user)
- ❌ Batch completions at end of phase (update real-time)
- ❌ Leave multiple tasks in_progress (pick one, except parallel)
- ❌ Use single task for loop (track iterations separately)
- ❌ Update only at start/end (update during execution)

**Performance:**
- TaskUpdate overhead: <1s per update (negligible)
- User visibility benefit: Reduces perceived wait time 30-50%
- Workflow confidence: User knows progress, less likely to cancel

---

## Examples

### Example 1: 8-Phase Implementation Workflow

**Scenario:** Full-cycle implementation with Tasks tracking

**Execution:**

```
Step 0: Initialize Tasks

TaskCreate:
  subject: "PHASE 1: Ask user for requirements"
  activeForm: "Asking user"
  // Returns: "phase-1-id"

TaskCreate:
  subject: "PHASE 2: Generate architecture plan"
  activeForm: "Generating plan"
  blockedBy: ["phase-1-id"]
  // Returns: "phase-2-id"

TaskCreate:
  subject: "PHASE 3: Implement core logic"
  activeForm: "Implementing core"
  blockedBy: ["phase-2-id"]
  // Returns: "phase-3a-id"

TaskCreate:
  subject: "PHASE 3: Add error handling"
  activeForm: "Adding error handling"
  blockedBy: ["phase-3a-id"]
  // Returns: "phase-3b-id"

TaskCreate:
  subject: "PHASE 3: Write tests"
  activeForm: "Writing tests"
  blockedBy: ["phase-3b-id"]
  // Returns: "phase-3c-id"

TaskCreate:
  subject: "PHASE 4: Run test suite"
  activeForm: "Running tests"
  blockedBy: ["phase-3c-id"]
  // Returns: "phase-4-id"

TaskCreate:
  subject: "PHASE 5: Code review"
  activeForm: "Reviewing"
  blockedBy: ["phase-4-id"]
  // Returns: "phase-5-id"

TaskCreate:
  subject: "PHASE 6: Fix review issues"
  activeForm: "Fixing issues"
  blockedBy: ["phase-5-id"]
  // Returns: "phase-6-id"

TaskCreate:
  subject: "PHASE 7: User acceptance"
  activeForm: "User validating"
  blockedBy: ["phase-6-id"]
  // Returns: "phase-7-id"

TaskCreate:
  subject: "PHASE 8: Generate report"
  activeForm: "Generating report"
  blockedBy: ["phase-7-id"]
  // Returns: "phase-8-id"

User sees: "10 tasks, 0 complete, Phase 1 starting..."

---

Step 1: PHASE 1

TaskUpdate: taskId="phase-1-id", status="in_progress"
... gather requirements (30s) ...
TaskUpdate: taskId="phase-1-id", status="completed"
→ Automatically unblocks PHASE 2

User sees: "1/10 tasks complete (10%)"

---

Step 2: PHASE 2

TaskUpdate: taskId="phase-2-id", status="in_progress"
... generate plan (2 min) ...
TaskUpdate: taskId="phase-2-id", status="completed"
→ Automatically unblocks PHASE 3

User sees: "2/10 tasks complete (20%)"

---

Step 3: PHASE 3 (3 sub-tasks)

TaskUpdate: taskId="phase-3a-id", status="in_progress"
... implement core (3 min) ...
TaskUpdate: taskId="phase-3a-id", status="completed"
→ Automatically unblocks "Add error handling"

User sees: "3/10 tasks complete (30%)"

TaskUpdate: taskId="phase-3b-id", status="in_progress"
... add error handling (2 min) ...
TaskUpdate: taskId="phase-3b-id", status="completed"
→ Automatically unblocks "Write tests"

User sees: "4/10 tasks complete (40%)"

TaskUpdate: taskId="phase-3c-id", status="in_progress"
... write tests (3 min) ...
TaskUpdate: taskId="phase-3c-id", status="completed"
→ Automatically unblocks PHASE 4

User sees: "5/10 tasks complete (50%)"

---

... continue through all phases ...

---

Final State:

TaskList shows:
  [✓] PHASE 1: Ask user for requirements
  [✓] PHASE 2: Generate architecture plan
  [✓] PHASE 3: Implement core logic
  [✓] PHASE 3: Add error handling
  [✓] PHASE 3: Write tests
  [✓] PHASE 4: Run test suite
  [✓] PHASE 5: Code review
  [✓] PHASE 6: Fix review issues
  [✓] PHASE 7: User acceptance
  [✓] PHASE 8: Generate report

User sees: "10/10 tasks complete (100%). Workflow finished!"

Total Duration: ~15 minutes
User Experience: Continuous progress updates every 1-3 minutes
```

---

### Example 2: Iteration Loop with Progress Tracking

**Scenario:** Design validation with 10 max iterations

**Execution:**

```
Step 0: Initialize Tasks

TaskCreate:
  subject: "PHASE 1: Gather design reference"
  activeForm: "Gathering design"
  // Returns: "phase-1-id"

TaskCreate:
  subject: "Iteration 1/10: Designer validation"
  activeForm: "Designer validating (iter 1)"
  blockedBy: ["phase-1-id"]
  // Returns: "iter-1-id"

TaskCreate:
  subject: "Iteration 2/10: Designer validation"
  activeForm: "Designer validating (iter 2)"
  // Returns: "iter-2-id"

TaskCreate:
  subject: "Iteration 3/10: Designer validation"
  activeForm: "Designer validating (iter 3)"
  // Returns: "iter-3-id"

... (create all 10 iterations) ...

TaskCreate:
  subject: "PHASE 3: User validation gate"
  activeForm: "User validating"
  // Returns: "phase-3-id"

---

Step 1: PHASE 1

TaskUpdate: taskId="phase-1-id", status="in_progress"
... gather design (20s) ...
TaskUpdate: taskId="phase-1-id", status="completed"
→ Unblocks Iteration 1

---

Step 2: Iteration Loop

Iteration 1:
  TaskUpdate: taskId="iter-1-id", status="in_progress"
  Designer: "NEEDS IMPROVEMENT - 5 issues"
  Developer: Fix 5 issues
  TaskUpdate: taskId="iter-1-id", status="completed"
  User sees: "Iteration 1/10 complete, 5 issues fixed"

Iteration 2:
  TaskUpdate: taskId="iter-2-id", status="in_progress"
  Designer: "NEEDS IMPROVEMENT - 3 issues"
  Developer: Fix 3 issues
  TaskUpdate: taskId="iter-2-id", status="completed"
  User sees: "Iteration 2/10 complete, 3 issues fixed"

Iteration 3:
  TaskUpdate: taskId="iter-3-id", status="in_progress"
  Designer: "NEEDS IMPROVEMENT - 1 issue"
  Developer: Fix 1 issue
  TaskUpdate: taskId="iter-3-id", status="completed"
  User sees: "Iteration 3/10 complete, 1 issue fixed"

Iteration 4:
  TaskUpdate: taskId="iter-4-id", status="in_progress"
  Designer: "PASS ✓"
  TaskUpdate: taskId="iter-4-id", status="completed"
  Exit loop (early exit)
  User sees: "Loop completed in 4/10 iterations"

---

Step 3: PHASE 3

TaskUpdate: taskId="phase-3-id", status="in_progress"
... user validates ...
TaskUpdate: taskId="phase-3-id", status="completed"

---

Final State:

TaskList shows:
  [✓] PHASE 1: Gather design
  [✓] Iteration 1/10 (5 issues fixed)
  [✓] Iteration 2/10 (3 issues fixed)
  [✓] Iteration 3/10 (1 issue fixed)
  [✓] Iteration 4/10 (PASS)
  [ ] Iteration 5/10 (not needed)
  [ ] Iteration 6/10 (not needed)
  ... (iterations 5-10 skipped)
  [✓] PHASE 3: User validation

User Experience: Clear iteration progress, early exit visible
```

---

### Example 3: Parallel Multi-Model Review

**Scenario:** 5 AI models reviewing code in parallel

**Execution:**

```
Step 0: Initialize Tasks

TaskCreate:
  subject: "PHASE 1: Prepare review context"
  activeForm: "Preparing context"
  // Returns: "phase-1-id"

TaskCreate:
  subject: "PHASE 2: Claude review"
  owner: "claude-agent"
  activeForm: "Claude reviewing"
  blockedBy: ["phase-1-id"]
  // Returns: "claude-id"

TaskCreate:
  subject: "PHASE 2: Grok review"
  owner: "grok-agent"
  activeForm: "Grok reviewing"
  blockedBy: ["phase-1-id"]
  // Returns: "grok-id"

TaskCreate:
  subject: "PHASE 2: Gemini review"
  owner: "gemini-agent"
  activeForm: "Gemini reviewing"
  blockedBy: ["phase-1-id"]
  // Returns: "gemini-id"

TaskCreate:
  subject: "PHASE 2: GPT-5 review"
  owner: "gpt-agent"
  activeForm: "GPT-5 reviewing"
  blockedBy: ["phase-1-id"]
  // Returns: "gpt-id"

TaskCreate:
  subject: "PHASE 2: DeepSeek review"
  owner: "deepseek-agent"
  activeForm: "DeepSeek reviewing"
  blockedBy: ["phase-1-id"]
  // Returns: "deepseek-id"

TaskCreate:
  subject: "PHASE 3: Consolidate reviews"
  activeForm: "Consolidating"
  blockedBy: ["claude-id", "grok-id", "gemini-id", "gpt-id", "deepseek-id"]
  // Returns: "phase-3-id"

TaskCreate:
  subject: "PHASE 4: Present results"
  activeForm: "Presenting"
  blockedBy: ["phase-3-id"]
  // Returns: "phase-4-id"

---

Step 1: PHASE 1

TaskUpdate: taskId="phase-1-id", status="in_progress"
... prepare context (30s) ...
TaskUpdate: taskId="phase-1-id", status="completed"
→ Unblocks all 5 review tasks

---

Step 2: PHASE 2 (Parallel Execution)

Launch all 5 in parallel:
  TaskUpdate: taskId="claude-id", status="in_progress"
  TaskUpdate: taskId="grok-id", status="in_progress"
  TaskUpdate: taskId="gemini-id", status="in_progress"
  TaskUpdate: taskId="gpt-id", status="in_progress"
  TaskUpdate: taskId="deepseek-id", status="in_progress"

TaskList shows:
  [✓] PHASE 1: Prepare context
  [→] PHASE 2: Claude review (in_progress)
  [→] PHASE 2: Grok review (in_progress)
  [→] PHASE 2: Gemini review (in_progress)
  [→] PHASE 2: GPT-5 review (in_progress)
  [→] PHASE 2: DeepSeek review (in_progress)
  [ ] PHASE 3: Consolidate reviews (blocked)
  [ ] PHASE 4: Present results (blocked)

Launch all 5 models (4-Message Pattern for parallel execution)

As each completes:

T=60s:  Claude completes first
  TaskUpdate: taskId="claude-id", status="completed"
  User sees: "1/5 reviews complete"

T=90s:  Gemini completes
  TaskUpdate: taskId="gemini-id", status="completed"
  User sees: "2/5 reviews complete"

T=120s: GPT-5 completes
  TaskUpdate: taskId="gpt-id", status="completed"
  User sees: "3/5 reviews complete"

T=150s: Grok completes
  TaskUpdate: taskId="grok-id", status="completed"
  User sees: "4/5 reviews complete"

T=180s: DeepSeek completes
  TaskUpdate: taskId="deepseek-id", status="completed"
  User sees: "5/5 reviews complete!"
  → Automatically unblocks PHASE 3

---

Step 3: PHASE 3

TaskUpdate: taskId="phase-3-id", status="in_progress"
... consolidate reviews (30s) ...
TaskUpdate: taskId="phase-3-id", status="completed"
→ Automatically unblocks PHASE 4

---

Step 4: PHASE 4

TaskUpdate: taskId="phase-4-id", status="in_progress"
... present results (10s) ...
TaskUpdate: taskId="phase-4-id", status="completed"

---

Final State:

TaskList shows:
  [✓] PHASE 1: Prepare review context
  [✓] PHASE 2: Claude review
  [✓] PHASE 2: Grok review
  [✓] PHASE 2: Gemini review
  [✓] PHASE 2: GPT-5 review
  [✓] PHASE 2: DeepSeek review
  [✓] PHASE 3: Consolidate reviews
  [✓] PHASE 4: Present results

User sees: "Multi-model review complete in 3 minutes"

User Experience:
  - Real-time progress as each model completes
  - Clear visibility: "3/5 reviews complete"
  - Automatic phase progression when all reviews done
  - Reduces perceived wait time (user knows progress)
```

---

## Troubleshooting

**Problem: User thinks workflow is stuck**

Cause: No task updates for >1 minute

Solution: TaskUpdate more frequently, or add sub-tasks

```
❌ Wrong:
  [→] PHASE 3: Implementation (in_progress for 10 minutes)

✅ Correct:
  [✓] PHASE 3: Implement core logic (2 min)
  [✓] PHASE 3: Add error handling (3 min)
  [→] PHASE 3: Write tests (in_progress, 2 min so far)

User sees progress every 2-3 minutes
```

---

**Problem: Too many tasks (>20), overwhelming**

Cause: Too granular task breakdown

Solution: Group micro-tasks into larger operations

```
❌ Wrong (25 tasks):
  TaskCreate: subject="Read file 1"
  TaskCreate: subject="Read file 2"
  TaskCreate: subject="Write file 3"
  ... (25 micro-tasks)

✅ Correct (8 tasks):
  TaskCreate: subject="PHASE 1: Gather inputs" (includes reading files)
  TaskCreate: subject="PHASE 2: Process data"
  ... (8 significant operations)
```

---

**Problem: Multiple tasks "in_progress" (not parallel execution)**

Cause: Forgot to mark previous task as completed

Solution: Always TaskUpdate to completed before starting next

```
❌ Wrong:
  [→] PHASE 1: Ask user (in_progress)
  [→] PHASE 2: Plan (in_progress)  ← Both in_progress?

✅ Correct:
  TaskUpdate: taskId="phase-1-id", status="completed"
  TaskUpdate: taskId="phase-2-id", status="in_progress"

  [✓] PHASE 1: Ask user (completed)
  [→] PHASE 2: Plan (in_progress)  ← Only one
```

---

## Summary

Task orchestration provides real-time progress visibility through:

- **Phase initialization** (create task list before starting with TaskCreate)
- **Appropriate granularity** (8-15 tasks, significant operations)
- **Real-time updates** (TaskUpdate to completed immediately)
- **Exactly one in_progress** (except parallel execution)
- **Iteration tracking** (separate task per iteration)
- **Parallel task tracking** (update as each completes with owner field)
- **Task dependencies** (blockedBy/blocks for automatic phase management)
- **Cross-session persistence** (CLAUDE_CODE_TASK_LIST_ID for resumable work)

Master these patterns and users will always know:
- What's happening now
- What's coming next
- How much progress has been made
- How much remains
- Which tasks are blocked and why

This transforms "black box" workflows into transparent, trackable processes.

---

**Extracted From:**
- `/review` command (10-task initialization, phase-based tracking)
- `/implement` command (8-phase workflow with sub-tasks)
- `/validate-ui` command (iteration tracking, user feedback rounds)
- All multi-phase orchestration workflows

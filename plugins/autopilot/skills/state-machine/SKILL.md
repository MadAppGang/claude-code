---
name: state-machine
description: Task lifecycle state transitions with validation gates. Defines states, triggers, and required proofs.
version: 0.1.0
tags: [state-machine, workflow, transitions, gates]
keywords: [state, transition, gate, validation, workflow, lifecycle]
---

# Task Lifecycle State Machine

**Version:** 0.1.0
**Purpose:** Manage task state transitions with validation gates
**Status:** Phase 1

## When to Use

Use this skill when you need to:
- Understand valid state transitions for tasks
- Implement validation gates before state changes
- Handle iteration loops (In Review -> In Progress)
- Manage escalation to blocked state
- Enforce iteration limits

## States

```
Todo ──→ In Progress ──→ In Review ──→ Done
                 ↑           │
                 └───────────┘
                 (iteration)

In Progress ──→ Blocked (escalation)
```

## State Definitions

| State | Description | Entry Condition |
|-------|-------------|-----------------|
| Todo | Task queued for execution | Created with @autopilot label |
| In Progress | Task being executed | Passed start gate |
| In Review | Awaiting validation | Proof generated |
| Done | Task completed | Auto-approved or user approved |
| Blocked | Cannot proceed | Dependency issue or escalation |

## Transition Triggers

| From | To | Trigger | Gate |
|------|----|---------|------|
| Todo | In Progress | Label @autopilot added | Has acceptance criteria |
| In Progress | In Review | Work complete | Proof >= 80% confidence |
| In Review | Done | Confidence >= 95% | Auto-approval |
| In Review | Done | User approves | User feedback = APPROVAL |
| In Review | In Progress | Confidence < 80% | Validation failed |
| In Review | In Progress | User requests changes | Feedback = REQUESTED_CHANGES |
| In Progress | Blocked | Max iterations | Escalation |
| * | Blocked | Unresolvable blocker | Manual trigger |

## Validation Gates

### Gate 1: Start Work (Todo -> In Progress)

```typescript
async function canStartWork(issue: Issue): Promise<boolean> {
  const checks = [
    // Has acceptance criteria
    extractAcceptanceCriteria(issue.description).length > 0,

    // No blocking dependencies
    (await getBlockingIssues(issue)).length === 0,

    // Assigned to autopilot
    issue.assignee?.id === AUTOPILOT_BOT_USER_ID,
  ];

  return checks.every(c => c);
}
```

### Gate 2: Submit for Review (In Progress -> In Review)

```typescript
async function canSubmitForReview(proof: Proof): Promise<boolean> {
  const checks = [
    // All tests pass
    proof.testResults.passed === proof.testResults.total,

    // Build successful
    proof.buildSuccessful,

    // No lint errors
    proof.lintErrors === 0,

    // Has proof artifacts
    proof.screenshots.length > 0 || proof.deploymentUrl,
  ];

  return checks.every(c => c);
}
```

### Gate 3: Complete (In Review -> Done)

```typescript
async function canComplete(proof: Proof): Promise<{
  canProceed: boolean;
  autoApproved: boolean;
}> {
  if (proof.confidence >= 95) {
    return { canProceed: true, autoApproved: true };
  }

  if (proof.confidence >= 80) {
    return { canProceed: false, autoApproved: false };
    // Wait for user approval
  }

  return { canProceed: false, autoApproved: false };
  // Validation failed, should iterate
}
```

## Iteration Limits

| Loop Type | Max Iterations | Escalation |
|-----------|----------------|------------|
| Execution retry | 2 | Block task |
| Feedback rounds | 5 | Manual intervention |
| Quality check fixes | 2 | Report to user |

## Implementation

```typescript
class StateMachine {
  async transition(
    issueId: string,
    targetState: string,
    proof?: Proof
  ): Promise<void> {
    const issue = await linear.issue(issueId);
    const currentState = issue.state.name;

    // Validate transition
    const isValid = this.validateTransition(currentState, targetState, proof);

    if (!isValid) {
      throw new Error(`Invalid transition: ${currentState} -> ${targetState}`);
    }

    // Execute transition
    await linear.issueUpdate(issueId, {
      stateId: await this.getStateId(issue.team.id, targetState),
    });

    // Log transition
    await this.logTransition(issueId, currentState, targetState, proof);
  }

  private validateTransition(
    from: string,
    to: string,
    proof?: Proof
  ): boolean {
    const validTransitions: Record<string, string[]> = {
      'Todo': ['In Progress', 'Blocked'],
      'In Progress': ['In Review', 'Blocked'],
      'In Review': ['Done', 'In Progress'],
      'Blocked': ['Todo', 'In Progress'],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}
```

## State Transition Diagram

```
                    ┌─────────────────────────────┐
                    │                             │
                    ▼                             │
┌──────┐       ┌─────────────┐       ┌───────────┴───┐       ┌──────┐
│ Todo │ ────► │ In Progress │ ────► │   In Review   │ ────► │ Done │
└──────┘       └─────────────┘       └───────────────┘       └──────┘
    │               │                        │
    │               │                        │
    │               ▼                        │
    │          ┌─────────┐                   │
    └────────► │ Blocked │ ◄─────────────────┘
               └─────────┘
```

## Examples

### Example 1: Happy Path

```typescript
// Task created
await transitionState(issueId, 'In Progress');  // Gate: Has acceptance criteria

// Work complete, proof generated
await transitionState(issueId, 'In Review');    // Gate: Proof >= 80%

// High confidence auto-approval
await transitionState(issueId, 'Done');         // Gate: Confidence >= 95%
```

### Example 2: Iteration Loop

```typescript
// First attempt
await transitionState(issueId, 'In Progress');
await transitionState(issueId, 'In Review');    // Confidence: 85%

// User requests changes
await transitionState(issueId, 'In Progress');  // Feedback: REQUESTED_CHANGES

// Second attempt
await transitionState(issueId, 'In Review');    // Confidence: 97%
await transitionState(issueId, 'Done');         // Auto-approved
```

### Example 3: Escalation

```typescript
// After 5 feedback rounds
if (iterationCount >= MAX_FEEDBACK_ROUNDS) {
  await transitionState(issueId, 'Blocked');
  await addComment(issueId, "Escalated: Max iterations reached");
}
```

## Best Practices

- Always validate before transitioning
- Log all transitions for audit trail
- Include proof artifacts when transitioning to In Review
- Enforce iteration limits to prevent infinite loops
- Escalate gracefully rather than failing silently
- Comment on Linear when state changes for visibility

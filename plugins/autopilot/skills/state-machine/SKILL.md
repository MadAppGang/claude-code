---
name: state-machine
description: "Manages task lifecycle state transitions (Todo, In Progress, In Review, Done, Blocked) with validation gates and iteration limits. Enforces entry conditions, confidence thresholds, and escalation rules. Use when transitioning task states or implementing validation gates."
---

# Task Lifecycle State Machine

Manages task state transitions with validation gates, ensuring tasks move through the lifecycle correctly with proper checks at each boundary.

## States and Transitions

```
Todo ──→ In Progress ──→ In Review ──→ Done
                 ↑           │
                 └───────────┘ (iteration)

In Progress ──→ Blocked (escalation)
```

## Workflow

1. **Determine current state** - read the task's current state from Linear
2. **Validate transition** - check that the target state is reachable and all gate conditions are met
3. **Execute transition** - update the state in Linear via API
4. **Log transition** - record the state change for audit trail

## State Definitions

| State | Entry Condition |
|-------|----------------|
| Todo | Created with `@autopilot` label |
| In Progress | Has acceptance criteria, no blocking dependencies, assigned to autopilot |
| In Review | All tests pass, build successful, no lint errors, proof artifacts exist |
| Done | Confidence >= 95% (auto-approve) OR user explicitly approves |
| Blocked | Max iterations reached, unresolvable dependency, or manual trigger |

## Validation Gates

### Gate 1: Start Work (Todo -> In Progress)
```typescript
async function canStartWork(issue: Issue): Promise<boolean> {
  return [
    extractAcceptanceCriteria(issue.description).length > 0,
    (await getBlockingIssues(issue)).length === 0,
    issue.assignee?.id === AUTOPILOT_BOT_USER_ID,
  ].every(c => c);
}
```

### Gate 2: Submit for Review (In Progress -> In Review)
```typescript
async function canSubmitForReview(proof: Proof): Promise<boolean> {
  return [
    proof.testResults.passed === proof.testResults.total,
    proof.buildSuccessful,
    proof.lintErrors === 0,
    proof.screenshots.length > 0 || proof.deploymentUrl,
  ].every(c => c);
}
```

### Gate 3: Complete (In Review -> Done)
- Confidence >= 95%: auto-approve, transition to Done
- Confidence 80-94%: wait for user approval
- Confidence < 80%: validation failed, iterate back to In Progress

## Iteration Limits

| Loop Type | Max Iterations | Escalation Action |
|-----------|----------------|-------------------|
| Execution retry | 2 | Block task |
| Feedback rounds | 5 | Manual intervention |
| Quality check fixes | 2 | Report to user |

## Examples

### Happy path
```typescript
await transitionState(issueId, 'In Progress');  // Gate: has acceptance criteria
await transitionState(issueId, 'In Review');     // Gate: proof >= 80%
await transitionState(issueId, 'Done');          // Gate: confidence >= 95%
```

### Iteration loop
```typescript
await transitionState(issueId, 'In Progress');
await transitionState(issueId, 'In Review');     // Confidence: 85%
// User requests changes → back to In Progress
await transitionState(issueId, 'In Progress');
await transitionState(issueId, 'In Review');     // Confidence: 97% → auto-approved
await transitionState(issueId, 'Done');
```

### Escalation
```typescript
if (iterationCount >= MAX_FEEDBACK_ROUNDS) {
  await transitionState(issueId, 'Blocked');
  await addComment(issueId, "Escalated: Max iterations reached");
}
```

## Verification

After each transition, confirm:
- [ ] State was updated in Linear
- [ ] Transition was logged for audit trail
- [ ] Gate conditions were checked before transition
- [ ] Iteration count was incremented (if applicable)

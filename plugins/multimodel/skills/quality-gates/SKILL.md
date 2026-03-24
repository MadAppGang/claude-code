---
name: quality-gates
description: "Implements approval checkpoints, iteration loops, severity classification, and test-driven validation in multi-agent workflows. Pauses execution for user review, runs fix-test cycles until passing, and enforces quality thresholds. Use when adding user approval gates, building feedback loops, running TDD iterations, or classifying issue severity in pipelines."
---

# Quality Gates

Checkpoints in workflows where execution pauses for validation before proceeding. Prevents low-quality work from advancing through the pipeline.

## Workflow

1. **Define gate criteria** — what must be true to pass (tests green, user approves, score above threshold).
2. **Execute the work phase** — agent implements, reviews, or generates output.
3. **Evaluate at the gate** — run checks, present to user, or score results.
4. **Branch on outcome** — pass (continue), fail (iterate), or abort (stop workflow).
5. **Log gate results** — record pass/fail, iteration count, and feedback for performance tracking.

## Gate Types

| Gate Type | Mechanism | Example |
|-----------|-----------|---------|
| User approval | AskUserQuestion | "Review this plan before I implement it" |
| Test-driven | Run tests, check results | Fix code until `bun test` passes |
| Score threshold | Evaluate output quality | Design fidelity score must be >= 40/50 |
| Consensus | Multiple reviewers agree | 2 of 3 AI reviewers flag the same issue |
| Severity filter | Classify and filter | Only block on CRITICAL/HIGH issues |

## Example: Test-Driven Iteration Loop

```
max_iterations = 5

for iteration in 1..max_iterations:
  1. Run tests: bun test
  2. If all pass → GATE PASSED, continue to next phase
  3. If failures:
     a. Parse test output for failing tests
     b. Fix identified issues
     c. Continue loop
  4. If max_iterations reached → GATE FAILED, ask user
```

**Verification:** Confirm tests pass before marking the gate as passed. Never skip the final test run.

## Example: User Approval Gate

```typescript
// Present plan for approval before implementation
AskUserQuestion({
  questions: [{
    question: "Review the architecture plan. Approve to proceed with implementation?",
    header: "Quality Gate: Plan Review",
    options: [
      { label: "Approve", description: "Proceed with implementation" },
      { label: "Request changes", description: "I have feedback" },
      { label: "Reject", description: "Start over with different approach" }
    ]
  }]
})
```

## Severity Classification

| Severity | Impact | Gate Action |
|----------|--------|-------------|
| CRITICAL | Breaks functionality, security risk | Block — must fix before proceeding |
| HIGH | Significant quality issue | Block — fix recommended |
| MEDIUM | Minor quality concern | Warn — proceed with note |
| LOW | Cosmetic or suggestion | Log — proceed without blocking |

## Notes

- Always set max iterations to prevent infinite loops (default: 5)
- User approval gates should show enough context for informed decisions
- Log all gate outcomes for performance tracking and workflow optimization
- Consensus gates work well with multi-model review (2 of 3 agreement threshold)

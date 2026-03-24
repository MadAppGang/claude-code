---
name: revert
description: "Performs git-aware logical undo at track, phase, or task level with impact preview and confirmation gates. Creates revert commits to preserve history and validates state consistency after rollback. Use when needing to undo completed work or roll back a phase."
---

# Conductor Revert

Enables safe, logical rollback of development work at meaningful granularity (track/phase/task) while maintaining git history integrity and project consistency.

## Workflow

1. **Select revert scope**
   - Ask user: What to revert? (Track / Phase / Task)
   - For Track: ask which track
   - For Phase: ask which track and which phase
   - For Task: ask which track and which task

2. **Analyze impact**
   - Read `metadata.json` to find related commits
   - Search git log for `[{track_id}]` pattern
   - List all commits, affected files, and plan.md status changes

3. **Present impact and confirm**
   - Show exact commits to revert, files affected, and status changes
   - Ask for explicit user confirmation before proceeding
   - If declined, abort with no changes

4. **Execute revert**
   - Create revert commits for each original commit (preserves history)
   - Update plan.md task statuses back to `[ ]`
   - Update `metadata.json` to reflect revert

5. **Validate consistency**
   - Verify plan.md matches git state
   - Verify `metadata.json` is consistent
   - Run project quality checks
   - Report final state to user

## Revert Levels

| Level | Scope | Effect |
|-------|-------|--------|
| Task | Single task's commits | Reverts task commits, sets status to `[ ]`, preserves other tasks |
| Phase | All tasks in a phase | Reverts all phase commits, resets all task statuses |
| Track | Entire track | Reverts all commits, optionally deletes track files, updates `tracks.md` |

## Constraints

- ALWAYS require explicit user confirmation before reverting any commits
- Default to creating revert commits (non-destructive); only hard-reset if user explicitly requests
- Never leave project in inconsistent state - if full revert fails, offer partial options
- Show exact changes BEFORE executing them

## Examples

### Revert a single task
```
User: Undo task 2.3

Agent:
1. Finds commits for task 2.3 from metadata.json
2. Shows impact:
   "Will revert 2 commits:
    - abc123: [feature_auth] Implement login form
    - def456: [feature_auth] Add login validation
    Files affected: src/login.tsx, src/auth.ts"
3. Asks confirmation → user confirms
4. Creates revert commits
5. Updates plan.md: 2.3 [x] → [ ]
6. Validates state consistency
```

### Revert an entire phase
```
User: Roll back Phase 2 of the auth feature

Agent:
1. Finds all tasks in Phase 2 (5 tasks, 8 commits)
2. Shows impact with file count and task list
3. Asks: "This will undo significant work. Proceed?"
4. Creates revert commits in reverse order
5. Resets all Phase 2 task statuses to [ ]
6. Validates state consistency
```

## Verification

After every revert, confirm:
- [ ] Plan.md statuses match git state
- [ ] metadata.json is consistent
- [ ] Project quality checks pass
- [ ] No uncommitted changes remain

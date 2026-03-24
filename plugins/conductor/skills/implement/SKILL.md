---
name: implement
description: "Executes tasks from a track plan using TDD red/green/refactor workflow with git commit integration. Manages task status progression, creates traceable commits with git notes, and runs phase completion verification. Use when ready to start coding tasks from a plan."
---

# Conductor Implement

Guides systematic implementation of track tasks using TDD methodology, maintaining clear status visibility, creating traceable git commits, and executing phase completion verification at phase boundaries.

## Workflow

1. **Load context**
   - Verify `conductor/` exists with required files
   - Ask which track to work on (if multiple active)
   - Load track's `spec.md`, `plan.md`, and `conductor/workflow.md`

2. **Select task**
   - Find first pending `[ ]` task (or ask user preference)
   - Mark task as `[~]` in progress in plan.md
   - Only ONE task can be `[~]` at a time

3. **TDD implementation cycle**
   - **Red:** Write failing tests for the task, run tests to confirm they FAIL
   - **Green:** Write minimum code to pass tests, run tests to confirm they PASS
   - **Refactor:** Improve code quality, run tests to confirm they still PASS
   - Verify coverage meets >80% requirement

4. **Commit and update**
   - Run quality checks (lint, typecheck, test)
   - Stage changes and commit with format: `<type>(<scope>): <description>`
   - Add git note: `git notes add -m "Task: {phase}.{task} - {title}\nSummary: ...\nFiles Changed: ..."`
   - Mark task as `[x]` in plan.md, update `metadata.json` with commit SHA

5. **Phase transition check**
   - If phase incomplete, continue to next pending task
   - If phase complete, execute Phase Completion Protocol (see below)

## Task Status Progression

| Symbol | Status | Meaning |
|--------|--------|---------|
| `[ ]` | pending | Not started |
| `[~]` | in_progress | Currently working (only one at a time) |
| `[x]` | complete | Finished and committed |
| `[!]` | blocked | Blocked by issue (add note with reason) |

## Commit Message Format

```
<type>(<scope>): <description>

- Detail 1
- Detail 2

Task: {phase}.{task} ({task_title})
```

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

## Phase Completion Protocol

Execute when all tasks in a phase are `[x]`:

1. Announce: "Phase {N} complete. Starting verification protocol."
2. Check test coverage for all files changed in this phase
3. Run full test suite: `CI=true npm test`
4. Present manual verification steps to user
5. **PAUSE** - await explicit user confirmation before proceeding
6. Create checkpoint commit: `conductor(checkpoint): End of Phase {N}`
7. Attach verification report via git notes
8. Add `[checkpoint: {sha}]` to phase heading in plan.md

## Human Approval Gates

Pause and ask for user approval:
- Before starting each new phase
- When encountering blockers
- Before marking phase complete (step 5 of Protocol)

## Examples

### Complete a task with TDD
```
User: Start implementing the auth feature

Agent:
1. Loads feature_auth track, finds first pending task: 1.1 Create user table
2. Marks 1.1 as [~] in plan.md
3. Red: Creates test file, writes schema tests, runs → FAIL
4. Green: Creates migration, defines schema, runs → PASS
5. Refactor: Cleans up, runs → PASS
6. Commits: "feat(db): Create user table schema"
7. Adds git note, marks 1.1 as [x], moves to 1.2
```

### Handle a blocker
```
User: Continue implementing auth

Agent:
1. Starts task 2.1, encounters missing database credentials
2. Marks 2.1 as [!] with note: "BLOCKED: Need database credentials"
3. Asks user: "(A) Provide credentials (B) Skip to 2.2 (C) Pause"
4. User provides credentials → removes blocker, continues TDD cycle
```

## Verification

After each task completion, confirm:
- [ ] Tests pass with >80% coverage
- [ ] Commit follows type convention with task reference
- [ ] Git note attached with task summary
- [ ] plan.md status updated to `[x]`
- [ ] metadata.json updated with commit SHA

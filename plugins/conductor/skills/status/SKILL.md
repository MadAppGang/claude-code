---
name: status
description: "Reads conductor tracks, calculates completion percentages, identifies blockers, and recommends next actions. Parses plan.md and metadata.json across all active tracks. Use when checking project progress or asking what to work on next."
---

# Conductor Status

Provides clear, actionable status reports showing project progress, blockers, and recommended next actions. This is a read-only skill that never modifies conductor files.

## Workflow

1. **Collect data**
   - Verify `conductor/` directory exists
   - Read `conductor/tracks.md` for track list
   - For each track, read `plan.md` and `metadata.json`

2. **Analyze progress**
   - Count tasks by status: `[ ]` pending, `[~]` in progress, `[x]` complete, `[!]` blocked
   - Calculate completion percentage per track: `(completed / total) * 100`
   - Identify current phase and active task
   - Find any blocked tasks

3. **Present status report**
   - Display overview summary (active tracks, total progress, blocker count)
   - Show per-track details with progress bars
   - Highlight blockers prominently at the top
   - Recommend specific next action

## Display Priority

1. BLOCKED tasks (need immediate attention)
2. IN_PROGRESS tasks (current work)
3. Active tracks summary
4. Completed tracks (brief mention)

## Constraints

- Read-only: never modify any conductor files
- Always end with a clear "Next Action" recommendation
- Parse ALL tracks, not just the first one found

## Examples

### Single active track
```
User: What's my status?

Agent displays:
## Conductor Status

### Active Tracks: 1

**feature_auth_20260105** - User Authentication
- Progress: [========------] 53% (8/15 tasks)
- Phase: 2/4 - Core Authentication
- Current: 2.3 Create login endpoint
- Blockers: None

### Next Action
Continue task 2.3 (Create login endpoint). Run: `conductor:implement`
```

### Multiple tracks with blocker
```
User: Show me the status

Agent displays:
## Conductor Status

### BLOCKERS (1)
- **feature_auth** Task 2.4: "Waiting for API key from team lead"

### Active Tracks: 2

**feature_auth_20260105** - Progress: 47% (7/15) - BLOCKED at 2.4
**bugfix_login_20260104** - Progress: 100% (5/5) - Ready for review

### Next Action
Resolve blocker in feature_auth (Task 2.4) or review bugfix_login.
```

## Verification

Confirm the status report includes:
- [ ] Completion percentages for all tracks
- [ ] Any blocked tasks highlighted
- [ ] Clear next action recommendation

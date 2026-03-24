---
name: new-track
description: "Creates a development track by generating spec.md and hierarchical plan.md through interactive Q&A. Reads project context from product.md and tech-stack.md to inform planning. Use when planning a new feature, bugfix, or refactor."
---

# Conductor New Track

Transforms user requirements into structured, actionable development plans with clear phases, tasks, and subtasks that enable systematic implementation.

## Workflow

1. **Validate conductor setup**
   - Check `conductor/` directory exists with `product.md`, `tech-stack.md`, `workflow.md`
   - If missing, halt and guide user to run `conductor:setup` first

2. **Load project context**
   - Read `conductor/product.md` (project goals)
   - Read `conductor/tech-stack.md` (technical constraints)
   - Read `conductor/tracks.md` (existing tracks)

3. **Define track type and ID**
   - Ask: What type of work? (Feature / Bugfix / Refactor / Task)
   - Ask: Short name for this track? (3-10 chars, lowercase)
   - Generate track ID: `{type}_{shortname}_{YYYYMMDD}`

4. **Generate specification**
   - Ask: What is the goal? (1-2 sentences)
   - Ask: Acceptance criteria? (3-5 items)
   - Ask: Technical constraints or dependencies?
   - Ask: Edge cases or error scenarios?
   - Create `conductor/tracks/{track_id}/spec.md`

5. **Generate plan**
   - Propose 2-6 phases based on spec
   - Ask user to confirm or modify phases
   - Generate 2-5 tasks per phase with optional subtasks
   - Create `conductor/tracks/{track_id}/plan.md`

6. **Finalize**
   - Create `conductor/tracks/{track_id}/metadata.json`
   - Update `conductor/tracks.md` index
   - Present summary with phase/task counts

## Plan Structure

```markdown
# Plan: {Track Title}

Track ID: {track_id}
Type: Feature
Created: 2026-01-05
Status: Active

## Phase 1: {Phase Name}
- [ ] 1.1 {Task description}
- [ ] 1.2 {Task description}
  - [ ] 1.2.1 {Subtask}
- [ ] 1.3 {Task description}

## Phase 2: {Phase Name}
- [ ] 2.1 {Task description}
```

## Constraints

- Always create spec.md BEFORE plan.md (spec defines WHAT, plan defines HOW)
- Plans must have 2-6 phases, 2-5 tasks per phase, 0-3 subtasks per task
- Each task should be specific, estimable (1-4 hours), and minimally dependent
- Conductor setup MUST exist before creating tracks

## Track Types

| Type | Typical Phases | Scope |
|------|---------------|-------|
| Feature | 4-6 phases (includes testing/docs) | New functionality |
| Bugfix | 2-3 phases (reproduce, fix, verify) | Fix existing issue |
| Refactor | 3-4 phases (includes before/after comparison) | Code improvement |
| Task | Variable | General work item |

## Examples

### New feature track
```
User: I want to add user authentication

Agent:
1. Validates conductor/ exists, loads context
2. Track type: Feature, short name: "auth"
3. Generates ID: feature_auth_20260105
4. Gathers spec: goal, criteria, constraints, edge cases
5. Proposes phases: Database, Core Auth, Sessions, Testing
6. User confirms → generates plan.md with tasks
7. Updates tracks.md index, presents summary
```

### Bugfix track
```
User: Login page keeps redirecting in a loop

Agent:
1. Track type: Bugfix, short name: "login-loop"
2. ID: bugfix_login-loop_20260105
3. Spec: Reproduction steps, root cause hypothesis
4. Plan: Phase 1 (Reproduce), Phase 2 (Fix), Phase 3 (Verify)
```

## Verification

After track creation, confirm:
- [ ] `conductor/tracks/{track_id}/spec.md` exists with acceptance criteria
- [ ] `conductor/tracks/{track_id}/plan.md` exists with phases and tasks
- [ ] `conductor/tracks/{track_id}/metadata.json` exists
- [ ] `conductor/tracks.md` updated with new track entry

# Tasks System Migration Design

**Date:** 2026-01-30
**Status:** Approved
**Author:** Brainstorming session dev-brainstorm-20260130-172337-68801ffa

---

## Summary

Migrate all MAG Claude Plugins from TodoWrite to the new Tasks system to align with Claude Code platform evolution and unlock new capabilities (dependencies, cross-session persistence, task ownership).

## Context

Claude Code introduced the Tasks system as a replacement for TodoWrite:
- **File-based persistence** in `~/.claude/tasks/`
- **Cross-session collaboration** via `CLAUDE_CODE_TASK_LIST_ID` env var
- **Task dependencies** with `blocks`/`blockedBy` fields
- **4 tools** instead of 1: TaskCreate, TaskUpdate, TaskList, TaskGet

Our plugins have 115 files referencing TodoWrite across 12 plugins.

## Decision

**Full migration** - Replace all TodoWrite references with Tasks patterns.

## Pattern Mapping

### Initialization

```markdown
# OLD
TodoWrite: Create task list
  - PHASE 1: Gather requirements (pending)
  - PHASE 2: Design architecture (pending)

# NEW
TaskCreate:
  subject: "PHASE 1: Gather requirements"
  description: "Collect user requirements through clarifying questions"
  activeForm: "Gathering requirements"

TaskCreate:
  subject: "PHASE 2: Design architecture"
  description: "Create architecture plan based on requirements"
  activeForm: "Designing architecture"
```

### Status Transitions

```markdown
# OLD
Update TodoWrite: Mark "PHASE 1" as in_progress
... work ...
Update TodoWrite: Mark "PHASE 1" as completed

# NEW
TaskUpdate: taskId="1", status="in_progress"
... work ...
TaskUpdate: taskId="1", status="completed"
```

### New: Dependencies

```markdown
TaskCreate:
  subject: "PHASE 3: Implementation"
  description: "Implement the feature"

TaskUpdate:
  taskId: "3"
  addBlockedBy: ["2"]  # Blocked until PHASE 2 completes
```

### New: Ownership for Parallel Agents

```markdown
TaskCreate: subject="Claude review", owner="claude-agent"
TaskCreate: subject="Grok review", owner="grok-agent"
TaskCreate: subject="Gemini review", owner="gemini-agent"
# Each agent updates only its task
```

### New: Cross-Session

```bash
# Start work
CLAUDE_CODE_TASK_LIST_ID=feature-auth claude

# Resume later (tasks persist)
CLAUDE_CODE_TASK_LIST_ID=feature-auth claude
```

## Migration Order

| Phase | Plugin | Files | Priority |
|-------|--------|-------|----------|
| 1 | multimodel | 7 | CRITICAL - foundation |
| 2 | dev | 29 | HIGH - heaviest user |
| 3 | frontend | 16 | MEDIUM |
| 4 | seo | 13 | MEDIUM |
| 5 | conductor | 11 | MEDIUM |
| 6 | agentdev | 9 | MEDIUM |
| 7 | instantly | 8 | LOW |
| 8 | video-editing | 6 | LOW |
| 9 | bun | 6 | LOW |
| 10 | nanobanana | 5 | LOW |
| 11 | autopilot | 4 | LOW |
| 12 | code-analysis | 1 | LOW |

## Key Changes

### Skill Rename

```
OLD: plugins/multimodel/skills/todowrite-orchestration/
NEW: plugins/multimodel/skills/task-orchestration/
```

### Files by Plugin

**multimodel (7 files):**
- `skills/todowrite-orchestration/SKILL.md` → `skills/task-orchestration/SKILL.md`
- `skills/multi-agent-coordination/SKILL.md`
- `skills/multi-model-validation/SKILL.md`
- `skills/hierarchical-coordinator/SKILL.md`
- `skills/model-tracking-protocol/SKILL.md`
- `skills/batching-patterns/SKILL.md`
- `commands/team.md`

**dev (29 files):**
- 12 commands
- 14 agents
- 3 discipline skills

## Implementation Tasks

```
1. Create task-orchestration skill (rewrite of todowrite-orchestration)
2. Update multimodel plugin references
3. Update dev plugin (29 files)
4. Update frontend plugin (16 files)
5. Update remaining plugins (63 files)
6. Update documentation and CLAUDE.md
7. Test workflows end-to-end
```

## Testing

1. **Basic workflow:** `/dev:implement "Add hello world"`
2. **Multi-phase:** `/dev:feature "Add authentication"`
3. **Parallel agents:** `/multimodel:team "Review code"`
4. **Cross-session:** Start/resume with `CLAUDE_CODE_TASK_LIST_ID`

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing workflows | TodoWrite still works - gradual rollout |
| Large changeset | Phase by plugin priority |
| Missing edge cases | Manual testing per phase |

## Timeline

- **Week 1:** multimodel + dev plugins
- **Week 2:** Remaining plugins + testing

## Success Criteria

- [ ] All 115 files migrated
- [ ] `task-orchestration` skill documented
- [ ] Cross-session workflows tested
- [ ] Dependency tracking working
- [ ] No regressions in existing commands

---

## References

- [Claude Code Tasks Announcement](https://medium.com/@joe.njenga/claude-code-tasks-are-here-new-update-turns-claude-code-todos-to-tasks-a0be00e70847)
- [Session artifacts](../ai-docs/sessions/dev-brainstorm-20260130-172337-68801ffa/)

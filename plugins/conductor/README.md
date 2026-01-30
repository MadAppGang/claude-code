# Conductor Plugin

**Version:** 1.0.0
**License:** MIT

Context-Driven Development workflow for Claude Code. Implements the philosophy of managing project context as a first-class artifact, enabling structured development through: **Context → Spec & Plan → Implement**.

## Philosophy

**Context as a Managed Artifact:**
Your project context (goals, tech stack, workflow) is documented and maintained alongside your code in the `conductor/` directory.

**Pre-Implementation Planning:**
Before coding, create a spec (WHAT) and plan (HOW) with phases, tasks, and subtasks.

**Safe Iteration:**
Human approval gates at key points. Git-linked commits for traceability. Easy rollback when needed.

## Features

- **Project Context Management:** Maintain product.md, tech-stack.md, and workflow.md
- **Track-Based Planning:** Create tracks (features/bugfixes) with specs and hierarchical plans
- **Task Execution:** Execute tasks with status tracking ([ ] → [~] → [x])
- **Git Integration:** Commits linked to track/phase/task with traceable history
- **Progress Tracking:** View overall and per-track progress
- **Git-Aware Revert:** Undo work at Track, Phase, or Task level

## Quick Start

### 1. Initialize Conductor

```
Use conductor:setup skill
```

This creates the `conductor/` directory with:
- `product.md` - Project vision and goals
- `tech-stack.md` - Technical preferences
- `workflow.md` - Development procedures
- `tracks.md` - Track index (initially empty)

### 2. Create Your First Track

```
Use conductor:new-track skill
```

Guides you through:
1. Track type (Feature/Bugfix/Refactor/Task)
2. Requirements specification (spec.md)
3. Hierarchical plan generation (plan.md)

### 3. Implement Tasks

```
Use conductor:implement skill
```

Executes tasks from your plan:
- Updates status: [ ] pending → [~] in progress → [x] complete
- Creates git commits linked to track/task
- Follows workflow.md procedures

### 4. Check Progress

```
Use conductor:status skill
```

Shows:
- Overall completion percentage
- Current task and blockers
- Multi-track overview

### 5. Undo Work (if needed)

```
Use conductor:revert skill
```

Git-aware logical undo at Track, Phase, or Task level.

## Directory Structure

```
conductor/
├── product.md              # Project vision and goals
├── product-guidelines.md   # Standards and conventions
├── tech-stack.md          # Technical preferences
├── workflow.md            # Development procedures
├── tracks.md              # Index of all tracks
├── setup_state.json       # Resume interrupted setups
├── code_styleguides/      # Language-specific conventions
│   ├── typescript.md
│   └── ...
└── tracks/
    └── {track_id}/
        ├── spec.md        # Requirements specification
        ├── plan.md        # Hierarchical task plan
        └── metadata.json  # Track state and history
```

## Available Skills

### conductor:setup
Initialize Conductor for your project.
- Creates conductor/ directory structure
- Generates product.md, tech-stack.md, workflow.md
- Interactive Q&A with resume capability

### conductor:new-track
Create a new development track.
- Generates spec.md with requirements
- Creates hierarchical plan.md (phases → tasks)
- Updates tracks.md index

### conductor:implement
Execute tasks from your plan.
- Status progression: [ ] → [~] → [x]
- Git commits linked to track/task
- Follows workflow.md procedures

### conductor:status
View project progress.
- Overall completion percentage
- Current task and blockers
- Multi-track overview

### conductor:revert
Git-aware logical undo.
- Revert at Track, Phase, or Task level
- Preview before executing
- State validation after revert

### conductor:help
Get help with Conductor.
- Available skills and usage
- Best practices
- Troubleshooting

## Track Types

- **Feature:** New functionality (larger scope, 4-6 phases typical)
- **Bugfix:** Fix existing issue (smaller scope, 2-3 phases typical)
- **Refactor:** Code improvement (medium scope, 3-4 phases typical)
- **Task:** General work item (variable scope)

## Plan Structure

Plans use hierarchical organization:

```markdown
## Phase 1: Database Setup
- [ ] 1.1 Create user table schema
- [ ] 1.2 Add migration scripts
- [~] 1.3 Set up database connection
  - [x] 1.3.1 Install dependencies
  - [ ] 1.3.2 Configure connection

## Phase 2: Core Authentication
- [ ] 2.1 Implement password hashing
- [ ] 2.2 Create login endpoint
```

Status symbols:
- `[ ]` pending - Not started
- `[~]` in_progress - Currently working
- `[x]` complete - Finished
- `[!]` blocked - Blocked by issue

## Git Integration

Commits follow this format:

```
[{track_id}] Brief task description

- Detail 1
- Detail 2

Task: {phase}.{task} ({task_title})
```

Example:
```
[feature_auth_20260105] Implement password hashing

- Added bcrypt dependency
- Created hashPassword utility function
- Added unit tests for hashing

Task: 2.1 (Implement password hashing)
```

## Best Practices

1. **Keep Context Updated:** Review product.md and tech-stack.md periodically
2. **One Task at a Time:** Focus on completing tasks fully before moving on
3. **Commit Often:** Each task should result in at least one commit
4. **Use Blockers:** Mark tasks as [!] blocked rather than skipping silently
5. **Review Before Proceeding:** Use phase gates to verify quality

## Integration with Other Plugins

Conductor works alongside:
- **orchestration plugin:** Leverages task-orchestration, quality-gates
- **frontend plugin:** Can manage frontend development workflows
- **bun plugin:** Can manage backend development workflows

## Troubleshooting

**"Conductor not initialized"**
Run `conductor:setup` to initialize the conductor/ directory.

**"Track not found"**
Check tracks.md for available tracks. Track IDs are case-sensitive.

**"Revert failed"**
Check for uncommitted changes. Commit or stash before reverting.

## Requirements

- Git installed and initialized in project
- No special dependencies (uses Claude Code built-in tools)

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check `conductor:help` for reference
- Review project documentation
- File an issue on GitHub

---

**Maintained by:** MadAppGang
**Homepage:** https://github.com/MadAppGang/claude-code

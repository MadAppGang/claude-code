---
name: help
description: "Displays Conductor commands, usage examples, directory structure, and troubleshooting tips. Provides quick-start guide and best practices for context-driven development. Use when asking how Conductor works or what commands are available."
---

# Conductor Help

Conductor implements Context-Driven Development for Claude Code - your project context (goals, tech stack, workflow) is documented and maintained alongside your code.

## Workflow

1. **Identify user need** - determine if user wants command reference, troubleshooting help, or conceptual guidance
2. **Present relevant section** - show the specific information requested rather than the entire reference
3. **Suggest next action** - recommend the appropriate Conductor command to run

## Available Commands

| Command | Purpose |
|---------|---------|
| `conductor:setup` | Initialize Conductor - creates `conductor/` with product.md, tech-stack.md, workflow.md |
| `conductor:new-track` | Create a development track with spec.md and hierarchical plan.md |
| `conductor:implement` | Execute tasks from plan with TDD workflow and git commits |
| `conductor:status` | View progress, current tasks, and blockers across all tracks |
| `conductor:revert` | Git-aware logical undo at track, phase, or task level |
| `conductor:help` | Show this reference |

## Quick Start

```bash
# 1. Initialize project context
conductor:setup

# 2. Plan your first feature
conductor:new-track

# 3. Start implementing
conductor:implement

# 4. Check progress anytime
conductor:status

# 5. Roll back if needed
conductor:revert
```

## Directory Structure

```
conductor/
├── product.md          # Project vision and goals
├── tech-stack.md       # Technical preferences
├── workflow.md         # Development procedures
├── tracks.md           # Index of all tracks
└── tracks/
    └── {track_id}/
        ├── spec.md     # Requirements specification
        ├── plan.md     # Hierarchical task plan
        └── metadata.json
```

## Best Practices

1. **Keep context updated** - review product.md and tech-stack.md periodically
2. **One task at a time** - complete tasks fully before moving on
3. **Commit often** - each task should produce at least one commit
4. **Use blockers** - mark tasks as `[!]` blocked rather than skipping silently
5. **Review at phase gates** - verify quality before proceeding to next phase

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Conductor not initialized" | Run `conductor:setup` to create the conductor/ directory |
| "Track not found" | Check `tracks.md` for available tracks (IDs are case-sensitive) |
| "Revert failed" | Commit or stash uncommitted changes before reverting |

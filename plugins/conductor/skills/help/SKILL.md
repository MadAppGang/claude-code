---
name: help
description: Get help with Conductor - commands, usage examples, and best practices
version: 1.0.0
tags: [conductor, help, documentation, guide]
keywords: [help, guide, usage, commands, reference]
---
plugin: conductor
updated: 2026-01-20

# Conductor Help

Conductor implements Context-Driven Development for Claude Code.

## Philosophy

**Context as a Managed Artifact:**
Your project context (goals, tech stack, workflow) is documented and maintained alongside your code. This context guides all development work.

**Pre-Implementation Planning:**
Before coding, create a spec (WHAT) and plan (HOW). This ensures clear direction and traceable progress.

**Safe Iteration:**
Human approval gates at key points. Git-linked commits for traceability. Easy rollback when needed.

## Available Skills

### conductor:setup
Initialize Conductor for your project.
- Creates conductor/ directory structure
- Generates product.md, tech-stack.md, workflow.md
- Interactive Q&A with resume capability

### conductor:new-track
Create a new development track.
- Generates spec.md with requirements
- Creates hierarchical plan.md (phases -> tasks)
- Updates tracks.md index

### conductor:implement
Execute tasks from your plan.
- Status progression: [ ] -> [~] -> [x]
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

## Quick Start

1. **Initialize:** Run `conductor:setup` to create context files
2. **Plan:** Run `conductor:new-track` to create your first track
3. **Implement:** Run `conductor:implement` to start working
4. **Check:** Run `conductor:status` to see progress
5. **Undo:** Run `conductor:revert` if you need to roll back

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

1. **Keep Context Updated:** Review product.md and tech-stack.md periodically
2. **One Task at a Time:** Focus on completing tasks fully before moving on
3. **Commit Often:** Each task should result in at least one commit
4. **Use Blockers:** Mark tasks as [!] blocked rather than skipping silently
5. **Review Before Proceeding:** Use phase gates to verify quality

## Troubleshooting

**"Conductor not initialized"**
Run `conductor:setup` to initialize the conductor/ directory.

**"Track not found"**
Check tracks.md for available tracks. Track IDs are case-sensitive.

**"Revert failed"**
Check for uncommitted changes. Commit or stash before reverting.

## Getting Help

Use `conductor:help` anytime for this reference.
For issues, check the project documentation or file an issue.

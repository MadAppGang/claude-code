---
name: conductor-help
description: Show Conductor commands, philosophy, and quick start guide
allowed-tools: Read, Glob
---

<role>
  <identity>Conductor Help Guide</identity>
  <expertise>
    - Conductor philosophy and methodology
    - Command documentation
    - Best practices guidance
    - Troubleshooting support
  </expertise>
  <mission>
    Provide clear, comprehensive help information that enables users
    to effectively use Conductor for Context-Driven Development.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <no_tasks>
      Simple informational command.
      Tasks are NOT required.
    </no_tasks>

    <read_only>
      This command ONLY displays information.
      No modifications to any files.
    </read_only>

    <minimal_tools>
      Uses only Read and Glob tools for optional context loading.
    </minimal_tools>
  </critical_constraints>

  <workflow>
    <phase number="1" name="Display Help">
      <step>Show Conductor philosophy</step>
      <step>List available commands</step>
      <step>Provide quick start guide</step>
      <step>Show directory structure</step>
      <step>Display best practices</step>
      <step>Include troubleshooting tips</step>
    </phase>
  </workflow>
</instructions>

<output_format>
# Conductor Help

Conductor implements Context-Driven Development for Claude Code.

## Philosophy

**Context as a Managed Artifact:**
Your project context (goals, tech stack, workflow) is documented and
maintained alongside your code. This context guides all development work.

**Pre-Implementation Planning:**
Before coding, create a spec (WHAT) and plan (HOW). This ensures clear
direction and traceable progress.

**Safe Iteration:**
Human approval gates at key points. Git-linked commits for traceability.
Easy rollback when needed.

## Available Commands

| Command | Description |
|---------|-------------|
| `/conductor:setup` | Initialize Conductor for your project |
| `/conductor:new-track` | Create a new development track |
| `/conductor:implement` | Execute tasks from your plan |
| `/conductor:status` | View project progress |
| `/conductor:revert` | Git-aware logical undo |
| `/conductor:help` | Show this help |

## Quick Start

1. **Initialize:** Run `/conductor:setup` to create context files
2. **Plan:** Run `/conductor:new-track` to create your first track
3. **Implement:** Run `/conductor:implement` to start working
4. **Check:** Run `/conductor:status` to see progress
5. **Undo:** Run `/conductor:revert` if you need to roll back

## Directory Structure

```
conductor/
|-- product.md          # Project vision and goals
|-- tech-stack.md       # Technical preferences
|-- workflow.md         # Development procedures
|-- tracks.md           # Index of all tracks
|-- code_styleguides/   # Coding style guides
    |-- general.md
    |-- typescript.md   # (if applicable)
    |-- python.md       # (if applicable)
|-- tracks/
    |-- {track_id}/
        |-- spec.md     # Requirements specification
        |-- plan.md     # Hierarchical task plan
        |-- metadata.json
```

## Best Practices

1. **Keep Context Updated:** Review product.md and tech-stack.md periodically
2. **One Task at a Time:** Focus on completing tasks fully before moving on
3. **Commit Often:** Each task should result in at least one commit
4. **Use Blockers:** Mark tasks as [!] blocked rather than skipping silently
5. **Review Before Proceeding:** Use phase gates to verify quality

## Troubleshooting

**"Conductor not initialized"**
Run `/conductor:setup` to initialize the conductor/ directory.

**"Track not found"**
Check tracks.md for available tracks. Track IDs are case-sensitive.

**"Revert failed"**
Check for uncommitted changes. Commit or stash before reverting.

## Getting Help

Use `/conductor:help` anytime for this reference.
For issues, check the project documentation or file an issue.
</output_format>

<examples>
  <example name="Display Help">
    <user_request>/conductor:help</user_request>
    <correct_approach>
      Display the complete help information including:
      - Philosophy section
      - Available commands table
      - Quick start guide
      - Directory structure
      - Best practices
      - Troubleshooting tips
    </correct_approach>
  </example>
</examples>

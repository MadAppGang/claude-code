---
name: autopilot-help
description: Show comprehensive help for the Autopilot plugin
allowed-tools: Read
---

<role>
  <identity>Autopilot Help Assistant</identity>
  <mission>
    Provide comprehensive help about autopilot plugin commands,
    configuration, and workflow.
  </mission>
</role>

<instructions>
  <workflow>
    <step>Display help message (see formatting)</step>
  </workflow>
</instructions>

<formatting>
  <help_message>
# Autopilot Plugin Help

**Version**: 0.1.0
**Purpose**: Autonomous task execution with Linear integration

## Commands

| Command | Description |
|---------|-------------|
| `/autopilot:create-task` | Create Linear task and assign to autopilot |
| `/autopilot:status [id]` | Check status, queue, and progress |
| `/autopilot:config` | Configure Linear integration |
| `/autopilot:run <id>` | Manually trigger task execution |
| `/autopilot:help` | Show this help |

## Quick Start

1. **Configure**: `/autopilot:config`
   - Set up Linear API key
   - Select team and project
   - Customize tag mappings

2. **Create Task**: `/autopilot:create-task Add user profile page`
   - Classifies task type
   - Generates acceptance criteria
   - Creates Linear issue with autopilot assignment

3. **Monitor**: `/autopilot:status`
   - View queue and active tasks
   - Check task progress
   - See recent completions

## Tag-to-Command Mapping

| Tag | Command | Use Case |
|-----|---------|----------|
| @frontend | /dev:feature | React/Vue implementation |
| @backend | /dev:implement | API/database work |
| @debug | /dev:debug | Bug investigation |
| @test | /dev:test-architect | Test creation |
| @review | /commit-commands:commit-push-pr | Code review + PR |
| @ui | /dev:ui | Design validation |

## Workflow

```
Linear Issue (with @autopilot label)
        |
        v
   Tag Detection --> Command Selection
        |
        v
   Task Execution (via appropriate agent)
        |
        v
   Proof Generation (screenshots, tests, deployment)
        |
        v
   Validation (confidence score)
        |
        v
   State Transition (Todo -> In Progress -> In Review -> Done)
```

## Configuration Files

- `.env`: LINEAR_API_KEY, LINEAR_WEBHOOK_SECRET
- `.claude/autopilot.local.md`: Team/project settings, tag mappings

## Requirements

- Linear API key (personal or OAuth)
- @linear/sdk installed
- playwright (for screenshots)
- Webhook server running (for automatic pickup)

## More Information

- Plugin README: plugins/autopilot/README.md
- Skills: `/autopilot:linear-integration`, `/autopilot:tag-command-mapping`
  </help_message>
</formatting>

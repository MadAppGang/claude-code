# Autopilot Plugin

**Version**: 0.1.0
**Category**: Automation
**Status**: Phase 1 (Core Linear Integration)

Autonomous task execution with Linear integration. Picks tasks from Linear, routes to appropriate agents via tag-to-command mapping, generates proof-of-work artifacts, and handles feedback loops.

## Features

- **Linear Integration**: Create, query, and manage Linear issues directly from Claude Code
- **Tag-Based Routing**: Automatically route tasks to appropriate commands based on Linear labels
- **Proof-of-Work**: Generate validation artifacts (screenshots, test results, coverage)
- **Feedback Loops**: Process Linear comments and iterate on implementations
- **State Machine**: Manage task lifecycle with validation gates

## Quick Start

### 1. Install Dependencies

```bash
# Install npm dependencies
bun add @linear/sdk playwright

# Install Playwright browsers
npx playwright install chromium
```

### 2. Configure Linear Connection

```bash
# Set environment variables
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"
export LINEAR_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"  # Optional for webhooks
export AUTOPILOT_BOT_USER_ID="user_xxxxxxxxxxxxx"   # Your Linear user ID

# Run configuration wizard
/autopilot:config
```

### 3. Create Your First Task

```bash
# Create a task from CLI
/autopilot:create-task Add user profile page with avatar upload
```

### 4. Check Status

```bash
# View queue and active tasks
/autopilot:status

# View specific task
/autopilot:status ISS-123
```

## Commands

| Command | Description |
|---------|-------------|
| `/autopilot:create-task` | Create Linear task and assign to autopilot |
| `/autopilot:status [id]` | Check status, queue, and progress |
| `/autopilot:config` | Configure Linear integration |
| `/autopilot:run <id>` | Manually trigger task execution |
| `/autopilot:help` | Show help |

## Tag-to-Command Mapping

When autopilot picks up a task, it routes to the appropriate command based on Linear labels:

| Tag | Command | Use Case |
|-----|---------|----------|
| @frontend | /dev:feature | React/Vue/TypeScript implementation |
| @backend | /dev:implement | API/database work |
| @debug | /dev:debug | Bug investigation and fixing |
| @test | /dev:test-architect | Test creation |
| @review | /commit-commands:commit-push-pr | Code review + PR |
| @refactor | /dev:implement | Code improvement |
| @research | /dev:deep-research | Investigation tasks |
| @ui | /dev:ui | Design validation |

### Precedence Rules

When multiple tags are present:
1. @debug (highest)
2. @test
3. @ui
4. @frontend
5. @backend
6. @review
7. @refactor
8. @research (lowest)

## Workflow

```
Linear Issue (with @autopilot label)
        │
        ▼
   Tag Detection ──► Command Selection
        │
        ▼
   Task Execution (via task-executor agent)
        │
        ▼
   Proof Generation (screenshots, tests, deployment)
        │
        ▼
   Validation (confidence scoring)
        │
        ▼
   State Transition (Todo → In Progress → In Review → Done)
        │
        ▼
   Feedback Loop (if changes requested)
```

## Proof-of-Work

Every completed task includes proof artifacts:

### Bug Fix
- Git diff summary
- All tests passing
- Regression test

### Feature
- Screenshots (desktop, mobile, tablet)
- Test results
- Coverage report (>= 80%)
- Build output

### UI Change
- Multi-viewport screenshots
- Accessibility score
- Visual regression (optional)

### Confidence Scoring

| Component | Points |
|-----------|--------|
| Tests Pass | 40 |
| Build Success | 20 |
| Coverage >= 80% | 20 |
| 3 Screenshots | 10 |
| Lint Clean | 10 |

**Thresholds:**
- >= 95%: Auto-approve
- 80-94%: Manual review
- < 80%: Iterate

## Configuration

### Environment Variables

```bash
# Required
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxx       # Linear API key
LINEAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Webhook signature secret
AUTOPILOT_BOT_USER_ID=user_xxxxxxxxxxxxx   # Bot user ID

# Optional
AUTOPILOT_WEBHOOK_PORT=3001                # Webhook server port
AUTOPILOT_MAX_FEEDBACK_ROUNDS=5            # Max iterations
AUTOPILOT_CONFIDENCE_THRESHOLD=95          # Auto-approval threshold
```

### Settings File (.claude/autopilot.local.md)

```yaml
---
linear:
  team_id: "TEAM_xxxxx"
  project_id: "PROJECT_xxxxx"

proof:
  confidence_threshold: 95
  max_feedback_rounds: 5
  require_screenshots: true
  require_coverage: 80

tag_mappings:
  "@frontend":
    command: "/dev:feature"
    agent: "developer"
    skills: ["react-typescript"]
---
```

## Agents

| Agent | Purpose |
|-------|---------|
| task-executor | Executes tasks using ReAct pattern |
| proof-generator | Generates proof artifacts |
| feedback-processor | Handles Linear comments |

## Skills

| Skill | Description |
|-------|-------------|
| linear-integration | Linear API patterns |
| tag-command-mapping | Routing rules |
| proof-of-work | Artifact generation |
| state-machine | Lifecycle management |

## Webhook Server (Optional)

For automatic task pickup, run the webhook server:

```bash
# Start webhook server
bun run plugins/autopilot/scripts/webhook-server.ts

# Server endpoints:
# - POST /webhook  - Linear webhook receiver
# - GET /health    - Health check
# - GET /queue     - View task queue
```

Configure Linear webhook to point to your server URL.

## Dependencies

### Plugin Dependencies
- dev@mag-claude-plugins ^1.13.0
- orchestration@mag-claude-plugins ^0.9.0

### NPM Dependencies
- @linear/sdk ^26.0.0
- playwright ^1.40.0

## Roadmap

### Phase 1 (Current)
- [x] Linear API integration
- [x] Basic commands
- [x] Tag-to-command mapping
- [x] State machine

### Phase 2
- [ ] Task executor agent
- [ ] Session management
- [ ] Quality checks

### Phase 3
- [ ] Proof generation
- [ ] Screenshot capture
- [ ] Confidence scoring

### Phase 4
- [ ] Feedback processing
- [ ] Iteration loops
- [ ] Escalation

### Phase 5
- [ ] Webhook server
- [ ] Automatic pickup
- [ ] Real-time sync

## License

MIT - See LICENSE file

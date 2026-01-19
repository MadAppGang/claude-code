# Autopilot Server

Autonomous task execution server with Linear integration, powered by Claude Agent SDK V2.

## Overview

The Autopilot Server receives tasks via Linear webhooks or HTTP API, queues them with priority ordering, and executes them using Claude's agentic capabilities. Each task runs in a Claude session with access to file operations, shell commands, and other tools.

## Features

- **Linear Webhook Integration**: Automatically process issues assigned to the autopilot bot
- **Priority Queue**: Tasks are processed in priority order (critical > high > normal > low)
- **Persistent State**: Queue and session state survives server restarts
- **Configurable Concurrency**: Control how many tasks run in parallel
- **Webhook Security**: HMAC-SHA256 signature verification with replay protection
- **Retry Logic**: Exponential backoff for transient failures
- **HTTP API**: Control queue, check status, manually trigger tasks

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# ANTHROPIC_API_KEY is required
# LINEAR_* variables are optional

# Start the server
bun run start

# Or in development mode with hot reload
bun run dev
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Claude API key |
| `LINEAR_API_KEY` | No | - | Linear API key for posting updates |
| `LINEAR_TEAM_ID` | No | - | Linear team ID |
| `LINEAR_WEBHOOK_SECRET` | No | - | Webhook signature secret |
| `AUTOPILOT_BOT_USER_ID` | No | - | Filter tasks by assignee |
| `AUTOPILOT_PORT` | No | 3456 | HTTP server port |
| `AUTOPILOT_MAX_CONCURRENT` | No | 3 | Max parallel tasks |
| `AUTOPILOT_MODEL` | No | claude-sonnet-4-20250514 | Claude model to use |
| `AUTOPILOT_DEV_MODE` | No | false | Enable dev mode (relaxed security) |

## API Endpoints

### Health & Status

```bash
# Health check
GET /health

# Detailed status with queue stats
GET /status
```

### Tasks

```bash
# List all tasks (optional: ?status=pending|active|completed|failed)
GET /tasks

# Get single task
GET /tasks/:id

# Create task manually
POST /tasks
Content-Type: application/json
{
  "issueId": "issue-123",
  "title": "Fix the bug",
  "description": "Details...",
  "tags": ["@debug"],
  "priority": "high"
}
```

### Queue Control

```bash
# Pause processing (finish current, don't start new)
POST /queue/pause

# Resume processing
POST /queue/resume
```

### Webhooks

```bash
# Linear webhook endpoint
POST /webhook
X-Linear-Signature: <hmac-signature>
X-Linear-Delivery: <timestamp>
```

## Linear Setup

1. Create a webhook in Linear: Settings → API → Webhooks
2. Set URL to `https://your-server/webhook`
3. Select events: Issue created, Issue updated
4. Copy the webhook secret to `LINEAR_WEBHOOK_SECRET`
5. Create a bot user and set `AUTOPILOT_BOT_USER_ID`
6. Assign issues to the bot user to trigger processing

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Autopilot Server                      │
├─────────────────────────────────────────────────────────┤
│  HTTP Server (Bun.serve)                                │
│  ├── /webhook    → WebhookVerifier → Queue.enqueue()   │
│  ├── /tasks      → API handlers                         │
│  └── /status     → Queue status                         │
├─────────────────────────────────────────────────────────┤
│  Priority Queue                                          │
│  ├── Disk persistence (queue.json)                      │
│  ├── Worker pool (configurable concurrency)             │
│  └── Retry with exponential backoff                     │
├─────────────────────────────────────────────────────────┤
│  Claude Session Manager                                  │
│  ├── SDK V2: createSession → send → stream             │
│  ├── Session persistence (sessions/*.json)              │
│  └── Tool execution (read/write/bash/etc)               │
├─────────────────────────────────────────────────────────┤
│  Linear Client                                           │
│  ├── Post comments on task completion/failure           │
│  └── Update issue state                                  │
└─────────────────────────────────────────────────────────┘
```

## Claude SDK V2 Pattern

The server uses the correct SDK V2 API pattern:

```typescript
// Create session
const session = await unstable_v2_createSession({
  model: "claude-sonnet-4-20250514",
  instructions: systemPrompt,
  tools: toolDefinitions,
});

// Send message (returns void!)
await session.send({ message: taskDescription });

// Stream response (called AFTER send)
for await (const chunk of session.stream()) {
  switch (chunk.type) {
    case "message": // Text content
    case "tool_use": // Tool call request
    case "tool_result": // Tool call result
    case "done": // Stream complete
  }
}
```

## Testing

```bash
# Run all tests
bun test

# Run unit tests only
bun test tests/unit

# Run E2E tests (requires ANTHROPIC_API_KEY)
bun test tests/e2e

# Type check
bun run typecheck
```

### E2E Tests

E2E tests use real Claude API calls but mock Linear. They validate:
- Task execution creates files correctly
- Session management works
- Tool calls are executed
- Linear is notified of completion

Set `ANTHROPIC_API_KEY` to run E2E tests.

## Development

```bash
# Install dependencies
bun install

# Start with hot reload
bun run dev

# Format code
bun run format

# Lint
bun run lint
```

## Tag Mapping

Tasks with specific tags get enhanced prompts:

| Tag | Command | Focus |
|-----|---------|-------|
| `@debug` | /dev:debug | Debugging, root cause analysis |
| `@test` | /dev:implement | Test writing and coverage |
| `@ui` | /frontend:review | UI implementation, accessibility |
| `@frontend` | /frontend:implement | React/TypeScript frontend |
| `@review` | /frontend:multi-review | Code review |
| `@refactor` | /dev:implement | Code refactoring |
| `@research` | /dev:deep-research | Deep research |

## Security Considerations

**This is an autonomous agent system with intentional access to:**

- File system read/write operations
- Shell command execution (with 60s timeout)
- Network access (via Claude API)

**Production Deployment Recommendations:**

1. **Run in isolated environment** (container, VM, or sandboxed process)
2. **Restrict network access** to only required endpoints
3. **Use dedicated service account** with minimal permissions
4. **Set up audit logging** for all executed commands
5. **Never run as root** or with elevated privileges
6. **Review tasks before auto-execution** in high-risk environments

The webhook endpoint validates Linear signatures to prevent unauthorized task injection. Dev mode (`AUTOPILOT_DEV_MODE=true`) bypasses some security checks and should only be used for local testing.

## License

MIT

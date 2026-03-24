---
name: linear-integration
description: "Provides Linear API patterns for authentication, webhook handling, issue CRUD, state transitions, file attachments, and comment posting. Includes signature verification and SDK usage examples. Use when integrating with Linear API or handling Linear webhook events."
---

# Linear Integration

Provides patterns and examples for integrating with the Linear API in autopilot workflows, covering authentication, webhooks, issue management, and state transitions.

## Workflow

1. **Authenticate** - initialize LinearClient with API key
2. **Set up webhook handler** - configure HTTP server with signature verification
3. **Route events** - process incoming webhook payloads by action type
4. **Execute operations** - create/read/update issues, transition states, attach files, post comments

## Core Patterns

### Pattern 1: Authentication

```typescript
import { LinearClient } from '@linear/sdk';

const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

// Verify connection
const me = await linear.viewer;
console.log(`Connected as: ${me.name}`);
```

### Pattern 2: Webhook Handler with Signature Verification

```typescript
import { serve } from 'bun';
import { createHmac } from 'crypto';

serve({
  port: process.env.AUTOPILOT_WEBHOOK_PORT || 3001,
  async fetch(req: Request): Promise<Response> {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const signature = req.headers.get('Linear-Signature');
    const body = await req.text();

    // Verify HMAC-SHA256 signature
    const hmac = createHmac('sha256', process.env.LINEAR_WEBHOOK_SECRET!);
    if (signature !== hmac.update(body).digest('hex')) {
      return new Response('Unauthorized', { status: 401 });
    }

    await routeWebhook(JSON.parse(body));
    return new Response('OK', { status: 200 });
  }
});
```

### Pattern 3: Issue CRUD

```typescript
// Create issue
const result = await linear.createIssue({
  teamId, title, description,
  labelIds: await resolveLabelIds(labels),
  assigneeId: process.env.AUTOPILOT_BOT_USER_ID,
  priority: 2,
});
const issueId = (await result.issue)!.id;

// Query autopilot tasks
const issues = await linear.issues({
  filter: {
    team: { id: { eq: teamId } },
    assignee: { id: { eq: process.env.AUTOPILOT_BOT_USER_ID } },
    state: { name: { in: ['Todo', 'In Progress'] } },
  },
});
```

### Pattern 4: State Transitions

```typescript
async function transitionState(issueId: string, newStateName: string): Promise<void> {
  const issue = await linear.issue(issueId);
  const states = await (await issue.team).states();
  const targetState = states.nodes.find(s => s.name === newStateName);
  if (!targetState) throw new Error(`State "${newStateName}" not found`);
  await linear.updateIssue(issueId, { stateId: targetState.id });
}
```

### Pattern 5: File Attachments

```typescript
async function attachFile(issueId: string, filePath: string, fileName: string): Promise<void> {
  const uploadPayload = await linear.fileUpload(getMimeType(filePath), fileName, getFileSize(filePath));
  await fetch(uploadPayload.uploadUrl, {
    method: 'PUT',
    body: await Bun.file(filePath).arrayBuffer(),
    headers: { 'Content-Type': getMimeType(filePath) },
  });
  await linear.attachmentCreate({ issueId, url: uploadPayload.assetUrl, title: fileName });
}
```

### Pattern 6: Comments

```typescript
await linear.createComment({ issueId, body: "Implementation complete. See attached proof." });
```

## Examples

### Full issue lifecycle
```typescript
const issueId = await createIssue(teamId, "Add user profile page", "...", ["frontend"]);
await transitionState(issueId, "In Progress");
// ... work happens ...
await attachFile(issueId, "screenshot.png", "Desktop Screenshot");
await addComment(issueId, "Implementation complete.");
await transitionState(issueId, "In Review");
```

### Query autopilot queue
```typescript
const tasks = await getAutopilotTasks(teamId);
for (const task of tasks) {
  console.log(`- ${task.identifier}: ${task.title} (${task.state.name})`);
}
```

## Verification

When using these patterns, confirm:
- [ ] Webhook signatures are verified before processing payloads
- [ ] API rate limits are handled with exponential backoff
- [ ] Team/state/label IDs are cached to reduce API calls
- [ ] All state transitions are logged for audit

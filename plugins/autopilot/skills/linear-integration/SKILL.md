---
name: linear-integration
description: Linear API patterns and examples for autopilot. Includes authentication, webhooks, issue CRUD, state transitions, file attachments, and comment handling.
version: 0.1.0
tags: [linear, api, webhook, integration]
keywords: [linear, api, webhook, issue, comment, state, attachment]
---
plugin: autopilot
updated: 2026-01-20

# Linear Integration

**Version:** 0.1.0
**Purpose:** Patterns for Linear API integration in autopilot workflows
**Status:** Phase 1

## When to Use

Use this skill when you need to:
- Authenticate with Linear API
- Set up webhook handlers for Linear events
- Create, read, update, or delete Linear issues
- Transition issue states in Linear workflows
- Attach files to Linear issues
- Add comments to Linear issues

## Overview

This skill provides patterns for:
- Linear API authentication
- Webhook handler setup
- Issue CRUD operations
- State transitions
- File attachments
- Comment handling

## Core Patterns

### Pattern 1: Authentication

**Personal API Key (MVP):**
```typescript
import { LinearClient } from '@linear/sdk';

const linear = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY
});
```

**Verification:**
```typescript
async function verifyConnection(): Promise<boolean> {
  try {
    const me = await linear.viewer;
    console.log(`Connected as: ${me.name}`);
    return true;
  } catch (error) {
    console.error('Linear connection failed:', error);
    return false;
  }
}
```

### Pattern 2: Webhook Handler

**Bun HTTP Server:**
```typescript
import { serve } from 'bun';
import { createHmac } from 'crypto';

interface LinearWebhookPayload {
  action: 'created' | 'updated' | 'deleted';
  type: 'Issue' | 'Comment' | 'Label';
  data: {
    id: string;
    title?: string;
    description?: string;
    state: { id: string; name: string };
    labels: Array<{ id: string; name: string }>;
  };
}

serve({
  port: process.env.AUTOPILOT_WEBHOOK_PORT || 3001,

  async fetch(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Verify signature
    const signature = req.headers.get('Linear-Signature');
    const body = await req.text();

    if (!verifySignature(body, signature)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const payload: LinearWebhookPayload = JSON.parse(body);

    // Route to handler
    await routeWebhook(payload);

    return new Response('OK', { status: 200 });
  }
});

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const hmac = createHmac('sha256', process.env.LINEAR_WEBHOOK_SECRET!);
  const expectedSignature = hmac.update(body).digest('hex');

  return signature === expectedSignature;
}
```

### Pattern 3: Issue Operations

**Create Issue:**
```typescript
async function createIssue(
  teamId: string,
  title: string,
  description: string,
  labels: string[]
): Promise<string> {
  // Note: Linear SDK uses linear.createIssue() method
  const result = await linear.createIssue({
    teamId,
    title,
    description,
    labelIds: await resolveLabelIds(labels),
    assigneeId: process.env.AUTOPILOT_BOT_USER_ID,
    priority: 2,
  });

  const issue = await result.issue;
  return issue!.id;
}
```

**Query Issues:**
```typescript
async function getAutopilotTasks(teamId: string) {
  const issues = await linear.issues({
    filter: {
      team: { id: { eq: teamId } },
      assignee: { id: { eq: process.env.AUTOPILOT_BOT_USER_ID } },
      state: { name: { in: ['Todo', 'In Progress'] } },
    },
  });

  return issues.nodes;
}
```

### Pattern 4: State Transitions

**Transition State:**
```typescript
async function transitionState(
  issueId: string,
  newStateName: string
): Promise<void> {
  // Get workflow states for the issue's team
  const issue = await linear.issue(issueId);
  const team = await issue.team;
  const states = await team.states();

  const targetState = states.nodes.find(s => s.name === newStateName);

  if (!targetState) {
    throw new Error(`State "${newStateName}" not found`);
  }

  // Note: Linear SDK uses linear.updateIssue() method
  await linear.updateIssue(issueId, {
    stateId: targetState.id,
  });
}
```

### Pattern 5: File Attachments

**Upload and Attach:**
```typescript
async function attachFile(
  issueId: string,
  filePath: string,
  fileName: string
): Promise<void> {
  // Request upload URL
  const uploadPayload = await linear.fileUpload(
    getMimeType(filePath),
    fileName,
    getFileSize(filePath)
  );

  // Upload to storage
  const fileContent = await Bun.file(filePath).arrayBuffer();
  await fetch(uploadPayload.uploadUrl, {
    method: 'PUT',
    body: fileContent,
    headers: { 'Content-Type': getMimeType(filePath) },
  });

  // Attach to issue
  await linear.attachmentCreate({
    issueId,
    url: uploadPayload.assetUrl,
    title: fileName,
  });
}
```

### Pattern 6: Comments

**Add Comment:**
```typescript
async function addComment(
  issueId: string,
  body: string
): Promise<void> {
  // Note: Linear SDK uses linear.createComment() method
  await linear.createComment({
    issueId,
    body,
  });
}
```

## Best Practices

- Always verify webhook signatures
- Use exponential backoff for API rate limits
- Cache team/state/label IDs to reduce API calls
- Handle webhook delivery failures gracefully
- Log all state transitions for audit

## Examples

### Example 1: Full Issue Lifecycle

```typescript
// Create issue
const issueId = await createIssue(
  teamId,
  "Add user profile page",
  "Implement user profile with avatar upload",
  ["frontend", "feature"]
);

// Transition to In Progress
await transitionState(issueId, "In Progress");

// ... work happens ...

// Attach proof artifacts
await attachFile(issueId, "screenshot.png", "Desktop Screenshot");

// Add completion comment
await addComment(issueId, "Implementation complete. See attached proof.");

// Transition to In Review
await transitionState(issueId, "In Review");
```

### Example 2: Query Autopilot Queue

```typescript
const tasks = await getAutopilotTasks(teamId);

console.log(`Autopilot queue: ${tasks.length} tasks`);
for (const task of tasks) {
  console.log(`- ${task.identifier}: ${task.title} (${task.state.name})`);
}
```

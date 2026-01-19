#!/usr/bin/env bun
/**
 * Linear Webhook Server for Autopilot
 *
 * Receives webhooks from Linear and triggers autopilot task execution.
 *
 * Usage:
 *   bun run webhook-server.ts
 *
 * Environment Variables:
 *   AUTOPILOT_WEBHOOK_PORT - Port to listen on (default: 3001)
 *   LINEAR_WEBHOOK_SECRET - Secret for signature verification
 *   AUTOPILOT_BOT_USER_ID - Linear user ID for autopilot bot
 */

import { serve } from "bun";
import { createHmac } from "crypto";

const PORT = parseInt(process.env.AUTOPILOT_WEBHOOK_PORT || "3001");
const WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET;
const BOT_USER_ID = process.env.AUTOPILOT_BOT_USER_ID;
const DEV_MODE = process.env.AUTOPILOT_DEV_MODE === "true";

// Types for Linear webhook payloads
interface LinearWebhookPayload {
  action: "create" | "update" | "remove";
  type: "Issue" | "Comment" | "Label" | "IssueLabel";
  data: {
    id: string;
    title?: string;
    description?: string;
    state?: { id: string; name: string };
    labels?: Array<{ id: string; name: string }>;
    assignee?: { id: string; name: string };
    body?: string; // For comments
    issue?: { id: string; title: string }; // For comments
  };
  url?: string;
  createdAt: string;
  organizationId: string;
  webhookId?: string;
  webhookTimestamp?: number;
}

// Task queue for autopilot execution
interface QueuedTask {
  issueId: string;
  action: "execute" | "process_feedback";
  payload: LinearWebhookPayload;
  queuedAt: Date;
}

const taskQueue: QueuedTask[] = [];

// Verify webhook signature
function verifySignature(body: string, signature: string | null): boolean {
  // Only allow bypass if AUTOPILOT_DEV_MODE is explicitly set to "true"
  if (!WEBHOOK_SECRET) {
    if (DEV_MODE) {
      console.warn("Warning: Webhook signature verification disabled (DEV_MODE=true)");
      return true;
    }
    console.error("Error: LINEAR_WEBHOOK_SECRET not set. Set AUTOPILOT_DEV_MODE=true to bypass in development.");
    return false;
  }

  if (!signature) {
    console.error("Error: Missing Linear-Signature header");
    return false;
  }

  const hmac = createHmac("sha256", WEBHOOK_SECRET);
  const expectedSignature = hmac.update(body).digest("hex");

  return signature === expectedSignature;
}

// Check if issue has @autopilot label
function hasAutopilotLabel(labels: Array<{ id: string; name: string }> | undefined): boolean {
  if (!labels) return false;
  return labels.some((l) => l.name.toLowerCase() === "@autopilot" || l.name.toLowerCase() === "autopilot");
}

// Check if assigned to autopilot bot
function isAssignedToAutopilot(assignee: { id: string; name: string } | undefined): boolean {
  if (!BOT_USER_ID || !assignee) return false;
  return assignee.id === BOT_USER_ID;
}

// Route webhook to appropriate handler
async function routeWebhook(payload: LinearWebhookPayload): Promise<void> {
  const { action, type, data } = payload;

  console.log(`Webhook received: ${type} ${action}`);

  switch (type) {
    case "Issue":
      await handleIssueWebhook(action, data, payload);
      break;

    case "Comment":
      await handleCommentWebhook(action, data, payload);
      break;

    case "IssueLabel":
      await handleLabelWebhook(action, data, payload);
      break;

    default:
      console.log(`Ignoring webhook type: ${type}`);
  }
}

// Handle issue webhooks
async function handleIssueWebhook(
  action: string,
  data: LinearWebhookPayload["data"],
  payload: LinearWebhookPayload
): Promise<void> {
  // Check if this is an autopilot-managed issue
  if (!hasAutopilotLabel(data.labels) && !isAssignedToAutopilot(data.assignee)) {
    console.log(`Ignoring issue ${data.id}: not autopilot-managed`);
    return;
  }

  if (action === "create") {
    // New issue assigned to autopilot - queue for execution
    console.log(`New autopilot task: ${data.title}`);
    queueTask(data.id, "execute", payload);
  } else if (action === "update") {
    // Issue updated - check state changes
    const state = data.state?.name;
    if (state === "Todo") {
      // Task moved back to Todo - queue for execution
      console.log(`Task ${data.id} returned to Todo - requeuing`);
      queueTask(data.id, "execute", payload);
    }
  }
}

// Handle comment webhooks
async function handleCommentWebhook(
  action: string,
  data: LinearWebhookPayload["data"],
  payload: LinearWebhookPayload
): Promise<void> {
  if (action !== "create") return;

  // Only process comments on autopilot issues
  // TODO: Check if parent issue is autopilot-managed

  if (data.body && data.issue) {
    console.log(`New comment on ${data.issue.id}: ${data.body.substring(0, 50)}...`);
    queueTask(data.issue.id, "process_feedback", payload);
  }
}

// Handle label webhooks
async function handleLabelWebhook(
  action: string,
  data: LinearWebhookPayload["data"],
  payload: LinearWebhookPayload
): Promise<void> {
  // Label added to issue
  if (action === "create") {
    // Check if @autopilot label was added
    // This would trigger task pickup
    console.log(`Label change detected - checking for autopilot trigger`);
  }
}

// Queue a task for execution
function queueTask(
  issueId: string,
  action: "execute" | "process_feedback",
  payload: LinearWebhookPayload
): void {
  // Check if task already queued
  const existing = taskQueue.find(
    (t) => t.issueId === issueId && t.action === action
  );
  if (existing) {
    console.log(`Task ${issueId} already queued for ${action}`);
    return;
  }

  taskQueue.push({
    issueId,
    action,
    payload,
    queuedAt: new Date(),
  });

  console.log(`Queued task: ${issueId} for ${action} (queue size: ${taskQueue.length})`);

  // TODO: Trigger Claude Code execution
  // This would typically:
  // 1. Start a new Claude Code session
  // 2. Run /autopilot:run <issueId> for execute
  // 3. Run feedback-processor for process_feedback
}

// Process queued tasks (placeholder)
async function processQueue(): Promise<void> {
  if (taskQueue.length === 0) return;

  const task = taskQueue.shift()!;
  console.log(`Processing task: ${task.issueId} (${task.action})`);

  // TODO: Implement actual execution
  // This requires integrating with Claude Code CLI or API
}

// Start the server
const server = serve({
  port: PORT,

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          queueSize: taskQueue.length,
          port: PORT,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Webhook endpoint
    if (req.method === "POST" && url.pathname === "/webhook") {
      const signature = req.headers.get("Linear-Signature");
      const body = await req.text();

      // Verify signature
      if (!verifySignature(body, signature)) {
        console.error("Invalid webhook signature");
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        const payload: LinearWebhookPayload = JSON.parse(body);
        await routeWebhook(payload);
        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("Error processing webhook:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    // Queue status endpoint
    if (url.pathname === "/queue") {
      return new Response(
        JSON.stringify({
          size: taskQueue.length,
          tasks: taskQueue.map((t) => ({
            issueId: t.issueId,
            action: t.action,
            queuedAt: t.queuedAt.toISOString(),
          })),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Autopilot webhook server running on port ${PORT}`);
console.log(`- Webhook URL: http://localhost:${PORT}/webhook`);
console.log(`- Health check: http://localhost:${PORT}/health`);
console.log(`- Queue status: http://localhost:${PORT}/queue`);

// Process queue periodically
setInterval(processQueue, 5000);

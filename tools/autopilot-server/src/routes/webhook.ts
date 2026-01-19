/**
 * Linear webhook handler
 *
 * NOTE: Linear webhooks send labelIds (UUIDs), not label names.
 * We use LinearClient's label cache to resolve IDs to names.
 */

import type { LinearWebhookPayload, Priority, Task } from "../types";
import type { PriorityQueue } from "../services/priority-queue";
import type { WebhookVerifier } from "../services/webhook-verifier";
import type { LinearClient } from "../services/linear-client";
import { logger } from "../utils/logger";

// Webhook payload issue structure (different from GraphQL response)
interface WebhookIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  stateId?: string;
  state?: { id: string; name: string; type: string }; // Some webhooks include state object
  labelIds?: string[]; // Webhook sends IDs, not nested objects!
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

// Only process issues in these state types
const ALLOWED_STATE_TYPES = ["unstarted", "backlog"]; // Linear state types for Todo-like states

// Label name that triggers autopilot (case-insensitive)
const AUTOPILOT_LABEL = "autopilot";

// Child labels under Autopilot group that trigger processing
const AUTOPILOT_CHILD_LABELS = ["debug", "research", "implement"];

/**
 * Check if issue has autopilot label (using resolved label names)
 */
function hasAutopilotLabel(labelNames: string[]): boolean {
  return labelNames.some((name) => {
    const lowerName = name.toLowerCase();
    return lowerName === AUTOPILOT_LABEL || AUTOPILOT_CHILD_LABELS.includes(lowerName);
  });
}

/**
 * Handle incoming Linear webhook
 *
 * Linear webhook verification:
 * - Header: "Linear-Signature" contains HMAC-SHA256 hex signature
 * - Body: "webhookTimestamp" field contains UNIX timestamp in milliseconds
 * - Docs: https://linear.app/developers/webhooks
 */
export async function handleWebhook(
  req: Request,
  queue: PriorityQueue,
  verifier: WebhookVerifier,
  linearClient: LinearClient
): Promise<Response> {
  // Get raw body for signature verification
  const body = await req.text();
  const signature = req.headers.get("Linear-Signature");

  // Step 1: Verify signature FIRST (before parsing JSON)
  // This proves the webhook came from Linear
  if (!verifier.verifySignature(body, signature)) {
    logger.warn("Webhook signature verification failed");
    return jsonResponse({ error: "Invalid signature" }, 401);
  }

  // Step 2: Parse payload (safe now that signature is verified)
  let payload: LinearWebhookPayload & { webhookTimestamp?: number };
  try {
    payload = JSON.parse(body);
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  // Step 3: Check timestamp for replay protection
  if (!verifier.checkTimestamp(payload.webhookTimestamp)) {
    logger.warn("Webhook timestamp check failed");
    return jsonResponse({ error: "Invalid timestamp" }, 401);
  }

  // Step 4: Check for duplicate webhook (replay attack)
  if (!verifier.checkReplay(signature!)) {
    logger.warn("Duplicate webhook rejected");
    return jsonResponse({ error: "Duplicate webhook" }, 401);
  }

  logger.debug("Webhook received", {
    action: payload.action,
    type: payload.type,
  });

  // Handle different webhook types
  try {
    switch (payload.type) {
      case "Issue":
        await handleIssueWebhook(payload, queue, linearClient);
        break;

      case "Comment":
        // Future: handle feedback comments
        logger.debug("Comment webhook received (not implemented)");
        break;

      case "IssueLabel":
        // Future: handle label changes
        logger.debug("Label webhook received (not implemented)");
        break;

      default:
        logger.debug("Unknown webhook type", { type: payload.type });
    }

    return jsonResponse({ success: true });
  } catch (error) {
    logger.error("Webhook processing error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ error: "Processing failed" }, 500);
  }
}

/**
 * Handle issue webhooks
 */
async function handleIssueWebhook(
  payload: LinearWebhookPayload,
  queue: PriorityQueue,
  linearClient: LinearClient
): Promise<void> {
  const issue = payload.data as WebhookIssue;

  // Ensure caches are fresh
  await linearClient.ensureFreshCache();

  // Resolve labelIds to label names
  const labelIds = issue.labelIds || [];
  const labelNames = linearClient.getLabelNames(labelIds);

  logger.debug("Resolved labels", {
    issueId: issue.id,
    labelIds,
    labelNames,
  });

  // Only process if issue has Autopilot label
  if (!hasAutopilotLabel(labelNames)) {
    logger.debug("Issue does not have autopilot label, skipping", {
      issueId: issue.id,
      labelNames,
    });
    return;
  }

  // Check issue state - only process issues in Todo/Backlog state
  let stateType: string | undefined;
  let stateName: string | undefined;

  if (issue.state) {
    // State included in webhook
    stateType = issue.state.type?.toLowerCase();
    stateName = issue.state.name;
  } else {
    // Need to fetch issue to get state
    const fullIssue = await linearClient.getIssue(issue.id);
    if (fullIssue) {
      stateType = fullIssue.state.type?.toLowerCase();
      stateName = fullIssue.state.name;
    }
  }

  logger.debug("Issue state", {
    issueId: issue.id,
    stateName,
    stateType,
  });

  // Only enqueue if in an allowed state type (unstarted = Todo, backlog = Backlog)
  if (!stateType || !ALLOWED_STATE_TYPES.includes(stateType)) {
    logger.info("Issue not in Todo state, skipping", {
      issueId: issue.id,
      identifier: issue.identifier,
      stateName,
      stateType,
      allowedTypes: ALLOWED_STATE_TYPES,
    });
    return;
  }

  if (payload.action === "create" || payload.action === "update") {
    const task = issueToTask(issue, labelNames);
    await queue.enqueue(task);
    logger.info("Task enqueued from webhook", {
      issueId: issue.id,
      identifier: issue.identifier,
      priority: task.priority,
      stateName,
      labelNames,
    });
  }
}

/**
 * Convert Linear issue to Task
 */
function issueToTask(issue: WebhookIssue, labelNames: string[]): Task {
  const tags = labelNames.map((name) => `@${name.toLowerCase()}`);
  const priority = mapLinearPriority(issue.priority);

  return {
    id: crypto.randomUUID(),
    issueId: issue.id,
    title: issue.title,
    description: issue.description || "",
    tags,
    priority,
    status: "pending",
    attempt: 0,
    maxAttempts: 3,
    createdAt: new Date(issue.createdAt),
    updatedAt: new Date(issue.updatedAt),
  };
}

/**
 * Map Linear priority (0-4) to our priority levels
 */
function mapLinearPriority(linearPriority: number): Priority {
  switch (linearPriority) {
    case 0:
      return "low"; // No priority
    case 1:
      return "critical"; // Urgent
    case 2:
      return "high"; // High
    case 3:
      return "normal"; // Medium
    case 4:
      return "low"; // Low
    default:
      return "normal";
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

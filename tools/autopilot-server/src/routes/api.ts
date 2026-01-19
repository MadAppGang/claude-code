/**
 * HTTP API routes for queue control and status
 */

import type { Priority, StatusResponse, Task, TaskStatus } from "../types";
import type { PriorityQueue } from "../services/priority-queue";
import { logger } from "../utils/logger";

const VERSION = "1.0.0";

/**
 * Handle API requests
 */
export async function handleApi(
  req: Request,
  queue: PriorityQueue
): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  try {
    // GET /health - Health check
    if (method === "GET" && path === "/health") {
      return handleHealth(queue);
    }

    // GET /status - Detailed status
    if (method === "GET" && path === "/status") {
      return handleStatus(queue);
    }

    // GET /tasks - List tasks
    if (method === "GET" && path === "/tasks") {
      const status = url.searchParams.get("status") as TaskStatus | null;
      return handleListTasks(queue, status);
    }

    // GET /tasks/:id - Get single task
    if (method === "GET" && path.startsWith("/tasks/")) {
      const id = path.slice("/tasks/".length);
      return handleGetTask(queue, id);
    }

    // POST /tasks - Create task manually
    if (method === "POST" && path === "/tasks") {
      return handleCreateTask(req, queue);
    }

    // POST /queue/pause - Pause queue
    if (method === "POST" && path === "/queue/pause") {
      queue.pause();
      return jsonResponse({ success: true, paused: true });
    }

    // POST /queue/resume - Resume queue
    if (method === "POST" && path === "/queue/resume") {
      queue.resume();
      return jsonResponse({ success: true, paused: false });
    }

    // 404 for unknown routes
    return jsonResponse({ error: "Not found" }, 404);
  } catch (error) {
    logger.error("API error", {
      path,
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ error: "Internal error" }, 500);
  }
}

/**
 * Simple health check
 */
function handleHealth(queue: PriorityQueue): Response {
  const status = queue.getStatus();
  return jsonResponse({
    status: "healthy",
    version: VERSION,
  });
}

/**
 * Detailed status with queue stats
 */
function handleStatus(queue: PriorityQueue): Response {
  const queueStatus = queue.getStatus();

  const response: StatusResponse = {
    status: queueStatus.active > 0 ? "healthy" : "healthy",
    queue: {
      pending: queueStatus.pending,
      active: queueStatus.active,
      completed: queueStatus.completed,
      failed: queueStatus.failed,
    },
    paused: queueStatus.paused,
    uptime: queueStatus.uptime,
    version: VERSION,
  };

  return jsonResponse(response);
}

/**
 * List tasks with optional status filter
 */
function handleListTasks(
  queue: PriorityQueue,
  status: TaskStatus | null
): Response {
  const tasks = queue.getTasks(status || undefined);

  const response = tasks.map((t) => ({
    id: t.id,
    issueId: t.issueId,
    title: t.title,
    status: t.status,
    priority: t.priority,
    attempt: t.attempt,
    createdAt: t.createdAt,
    error: t.error,
  }));

  return jsonResponse({ tasks: response });
}

/**
 * Get single task by ID
 */
function handleGetTask(queue: PriorityQueue, id: string): Response {
  const task = queue.getTask(id);

  if (!task) {
    return jsonResponse({ error: "Task not found" }, 404);
  }

  return jsonResponse({ task });
}

/**
 * Create task manually (without webhook)
 */
async function handleCreateTask(
  req: Request,
  queue: PriorityQueue
): Promise<Response> {
  let body: {
    issueId: string;
    title: string;
    description?: string;
    tags?: string[];
    priority?: Priority;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  // Validate required fields
  if (!body.issueId || !body.title) {
    return jsonResponse({ error: "Missing required fields: issueId, title" }, 400);
  }

  const task: Task = {
    id: crypto.randomUUID(),
    issueId: body.issueId,
    title: body.title,
    description: body.description || "",
    tags: body.tags || [],
    priority: body.priority || "normal",
    status: "pending",
    attempt: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await queue.enqueue(task);

  logger.info("Task created via API", {
    id: task.id,
    issueId: task.issueId,
  });

  return jsonResponse({ task: { id: task.id, issueId: task.issueId } }, 201);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

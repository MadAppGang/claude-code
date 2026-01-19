/**
 * Unit tests for API routes
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { rmSync, mkdirSync } from "fs";
import { PriorityQueue } from "../../src/services/priority-queue";
import { handleApi } from "../../src/routes/api";
import type { Config } from "../../src/types";

const TEST_DATA_DIR = "./test-data-api";

// Type helper for JSON responses
interface ApiTask {
  id: string;
  issueId: string;
  status: string;
  priority: string;
}

function createTestConfig(): Config {
  return {
    port: 3456,
    host: "localhost",
    dataDir: TEST_DATA_DIR,
    maxConcurrent: 2,
    maxQueueSize: 100,
    retryAttempts: 3,
    retryDelayMs: 100,
    webhookSecret: "test-secret",
    linearApiKey: "",
    linearTeamId: "",
    botUserId: "",
    anthropicApiKey: "test-key",
    model: "claude-sonnet-4-20250514",
    devMode: true,
    enableMultiModelReview: false,
    reviewModels: [],
  };
}

describe("API Routes", () => {
  let queue: PriorityQueue;

  beforeEach(async () => {
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DATA_DIR, { recursive: true });
    queue = new PriorityQueue(createTestConfig());
    await queue.initialize();
  });

  afterEach(() => {
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  });

  test("GET /health returns healthy status", async () => {
    const req = new Request("http://localhost/health", { method: "GET" });
    const res = await handleApi(req, queue);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string };
    expect(data.status).toBe("healthy");
  });

  test("GET /status returns queue statistics", async () => {
    const req = new Request("http://localhost/status", { method: "GET" });
    const res = await handleApi(req, queue);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { queue: { pending: number; active: number } };
    expect(data.queue).toBeDefined();
    expect(data.queue.pending).toBe(0);
    expect(data.queue.active).toBe(0);
  });

  test("POST /tasks creates a new task", async () => {
    const req = new Request("http://localhost/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueId: "test-123",
        title: "Test Task",
        description: "A test task",
        tags: ["@debug"],
        priority: "high",
      }),
    });

    const res = await handleApi(req, queue);

    expect(res.status).toBe(201);
    const data = (await res.json()) as { task: ApiTask };
    expect(data.task).toBeDefined();
    expect(data.task.issueId).toBe("test-123");
  });

  test("POST /tasks rejects missing required fields", async () => {
    const req = new Request("http://localhost/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Missing issueId and title",
      }),
    });

    const res = await handleApi(req, queue);

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Missing required fields");
  });

  test("GET /tasks returns list of tasks", async () => {
    // Create a task first
    const createReq = new Request("http://localhost/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueId: "list-test-123",
        title: "List Test Task",
      }),
    });
    await handleApi(createReq, queue);

    const listReq = new Request("http://localhost/tasks", { method: "GET" });
    const res = await handleApi(listReq, queue);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { tasks: ApiTask[] };
    expect(data.tasks).toBeDefined();
    expect(data.tasks.length).toBe(1);
    expect(data.tasks[0].issueId).toBe("list-test-123");
  });

  test("GET /tasks?status=pending filters by status", async () => {
    const createReq = new Request("http://localhost/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueId: "filter-test-123",
        title: "Filter Test Task",
      }),
    });
    await handleApi(createReq, queue);

    const listReq = new Request("http://localhost/tasks?status=pending", {
      method: "GET",
    });
    const res = await handleApi(listReq, queue);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { tasks: ApiTask[] };
    expect(data.tasks.length).toBe(1);

    // Active filter should return 0
    const activeReq = new Request("http://localhost/tasks?status=active", {
      method: "GET",
    });
    const activeRes = await handleApi(activeReq, queue);
    const activeData = (await activeRes.json()) as { tasks: ApiTask[] };
    expect(activeData.tasks.length).toBe(0);
  });

  test("GET /tasks/:id returns single task", async () => {
    const createReq = new Request("http://localhost/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueId: "single-test-123",
        title: "Single Test Task",
      }),
    });
    const createRes = await handleApi(createReq, queue);
    const createData = (await createRes.json()) as { task: ApiTask };

    const getReq = new Request(`http://localhost/tasks/${createData.task.id}`, {
      method: "GET",
    });
    const res = await handleApi(getReq, queue);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { task: ApiTask };
    expect(data.task.issueId).toBe("single-test-123");
  });

  test("GET /tasks/:id returns 404 for missing task", async () => {
    const req = new Request("http://localhost/tasks/nonexistent-id", {
      method: "GET",
    });
    const res = await handleApi(req, queue);

    expect(res.status).toBe(404);
  });

  test("POST /queue/pause pauses the queue", async () => {
    const req = new Request("http://localhost/queue/pause", { method: "POST" });
    const res = await handleApi(req, queue);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { paused: boolean };
    expect(data.paused).toBe(true);
    expect(queue.getStatus().paused).toBe(true);
  });

  test("POST /queue/resume resumes the queue", async () => {
    queue.pause();

    const req = new Request("http://localhost/queue/resume", { method: "POST" });
    const res = await handleApi(req, queue);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { paused: boolean };
    expect(data.paused).toBe(false);
    expect(queue.getStatus().paused).toBe(false);
  });

  test("unknown route returns 404", async () => {
    const req = new Request("http://localhost/unknown", { method: "GET" });
    const res = await handleApi(req, queue);

    expect(res.status).toBe(404);
  });
});

/**
 * Unit tests for PriorityQueue
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { rmSync, mkdirSync } from "fs";
import { PriorityQueue } from "../../src/services/priority-queue";
import type { Config, Task } from "../../src/types";

const TEST_DATA_DIR = "./test-data-queue";

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

function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    issueId: `issue-${Date.now()}`,
    title: "Test Task",
    description: "Test description",
    tags: [],
    priority: "normal",
    status: "pending",
    attempt: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("PriorityQueue", () => {
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

  test("enqueue adds task to queue", async () => {
    const task = createTestTask();
    await queue.enqueue(task);

    const status = queue.getStatus();
    expect(status.pending).toBe(1);
  });

  test("enqueue respects priority ordering", async () => {
    const lowTask = createTestTask({ issueId: "low-1", priority: "low", title: "Low" });
    const highTask = createTestTask({ issueId: "high-1", priority: "high", title: "High" });
    const criticalTask = createTestTask({ issueId: "critical-1", priority: "critical", title: "Critical" });

    await queue.enqueue(lowTask);
    await queue.enqueue(highTask);
    await queue.enqueue(criticalTask);

    const tasks = queue.getTasks("pending");
    expect(tasks.length).toBe(3);
    expect(tasks[0].priority).toBe("critical");
    expect(tasks[1].priority).toBe("high");
    expect(tasks[2].priority).toBe("low");
  });

  test("enqueue rejects duplicates", async () => {
    const task = createTestTask();
    await queue.enqueue(task);
    await queue.enqueue({ ...task, id: crypto.randomUUID() }); // Same issueId

    const status = queue.getStatus();
    expect(status.pending).toBe(1);
  });

  test("enqueue throws when queue full", async () => {
    const config = createTestConfig();
    config.maxQueueSize = 2;
    const smallQueue = new PriorityQueue(config);
    await smallQueue.initialize();

    await smallQueue.enqueue(createTestTask({ issueId: "1" }));
    await smallQueue.enqueue(createTestTask({ issueId: "2" }));

    await expect(smallQueue.enqueue(createTestTask({ issueId: "3" }))).rejects.toThrow(
      "QUEUE_FULL"
    );
  });

  test("getStatus returns correct counts", async () => {
    const status = queue.getStatus();
    expect(status.pending).toBe(0);
    expect(status.active).toBe(0);
    expect(status.completed).toBe(0);
    expect(status.failed).toBe(0);
    expect(status.paused).toBe(false);
  });

  test("pause and resume work", () => {
    expect(queue.getStatus().paused).toBe(false);

    queue.pause();
    expect(queue.getStatus().paused).toBe(true);

    queue.resume();
    expect(queue.getStatus().paused).toBe(false);
  });

  test("getTask retrieves task by id", async () => {
    const task = createTestTask();
    await queue.enqueue(task);

    const retrieved = queue.getTask(task.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(task.id);
    expect(retrieved?.title).toBe(task.title);
  });

  test("getTasks filters by status", async () => {
    const task = createTestTask();
    await queue.enqueue(task);

    const pending = queue.getTasks("pending");
    expect(pending.length).toBe(1);

    const active = queue.getTasks("active");
    expect(active.length).toBe(0);
  });
});

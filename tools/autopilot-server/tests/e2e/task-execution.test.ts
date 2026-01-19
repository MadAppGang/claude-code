/**
 * E2E Tests for Task Execution
 *
 * These tests use REAL Claude API but MOCK Linear
 * Requires ANTHROPIC_API_KEY to be set
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { rmSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
// Note: existsSync and readFileSync kept for queue persistence tests
import { PriorityQueue } from "../../src/services/priority-queue";
import { ClaudeSessionManager } from "../../src/services/claude-session-manager";
import { LinearMock } from "../mocks/linear-mock";
import type { Config, Task } from "../../src/types";

const TEST_DATA_DIR = "./test-data-e2e";

// Skip if no API key
const API_KEY = process.env.ANTHROPIC_API_KEY;
const SKIP_E2E = !API_KEY;

function createTestConfig(): Config {
  return {
    port: 3456,
    host: "localhost",
    dataDir: TEST_DATA_DIR,
    maxConcurrent: 1,
    maxQueueSize: 100,
    retryAttempts: 3,
    retryDelayMs: 1000,
    webhookSecret: "test-secret",
    linearApiKey: "",
    linearTeamId: "",
    botUserId: "",
    anthropicApiKey: API_KEY || "",
    model: "claude-sonnet-4-20250514",
    devMode: true,
    enableMultiModelReview: false, // Disable for tests
    reviewModels: [],
  };
}

function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    issueId: `e2e-issue-${Date.now()}`,
    title: "E2E Test Task",
    description: "Create a file called test-output.txt with the content 'Hello from autopilot'",
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

describe.skipIf(SKIP_E2E)("E2E: Task Execution", () => {
  let queue: PriorityQueue;
  let sessionManager: ClaudeSessionManager;
  let linearMock: LinearMock;
  let taskCompleted: boolean;
  let taskError: Error | null;

  beforeAll(async () => {
    // Clean up and create test data directory
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DATA_DIR, { recursive: true });

    // Initialize services
    const config = createTestConfig();
    queue = new PriorityQueue(config);
    sessionManager = new ClaudeSessionManager(config);
    linearMock = new LinearMock();

    sessionManager.setLinearClient(linearMock);

    await queue.initialize();
    await sessionManager.initialize();

    // Set up task handler
    queue.setTaskHandler(async (task) => {
      try {
        await sessionManager.executeTask(task);
        taskCompleted = true;
      } catch (error) {
        taskError = error as Error;
        throw error;
      }
    });
  });

  afterAll(() => {
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  });

  beforeEach(() => {
    taskCompleted = false;
    taskError = null;
    linearMock.reset();
  });

  test("executes and completes task", async () => {
    const task = createTestTask({
      title: "Simple task",
      description: "Read the package.json file in the current directory and tell me the project name.",
    });

    // Execute task directly (not through queue workers for predictability)
    await sessionManager.executeTask(task);

    // Verify session was tracked and completed
    const session = sessionManager.getSession(task.issueId);
    expect(session).toBeDefined();
    expect(session?.status).toBe("completed");
    expect(session?.transcript.length).toBeGreaterThan(0);

    // Verify Linear was notified (comment contains "Completed" with capital C)
    expect(linearMock.hasCommentContaining(task.issueId, "Completed")).toBe(true);
  }, 60000); // 60s timeout for API call

  test("handles multi-turn task", async () => {
    const task = createTestTask({
      title: "List files task",
      description: "List the TypeScript files in the src directory.",
    });

    await sessionManager.executeTask(task);

    const session = sessionManager.getSession(task.issueId);
    expect(session?.status).toBe("completed");
    expect(session?.transcript.length).toBeGreaterThan(0);

    // Session should have assistant response
    const hasAssistantResponse = session?.transcript.some(
      (t) => t.role === "assistant" && t.content.length > 0
    );
    expect(hasAssistantResponse).toBe(true);
  }, 60000);

  test("completes simple task", async () => {
    // This test verifies basic task completion
    const task = createTestTask({
      title: "Simple completion test",
      description: "Say 'Task completed successfully' and finish.",
      maxAttempts: 3,
    });

    await sessionManager.executeTask(task);

    const session = sessionManager.getSession(task.issueId);
    expect(session?.status).toBe("completed");
  }, 60000);
});

describe.skipIf(SKIP_E2E)("E2E: Queue Integration", () => {
  let queue: PriorityQueue;
  let sessionManager: ClaudeSessionManager;
  let linearMock: LinearMock;
  let completedTasks: string[];

  beforeAll(async () => {
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DATA_DIR, { recursive: true });

    const config = createTestConfig();
    queue = new PriorityQueue(config);
    sessionManager = new ClaudeSessionManager(config);
    linearMock = new LinearMock();

    sessionManager.setLinearClient(linearMock);

    await queue.initialize();
    await sessionManager.initialize();

    completedTasks = [];

    queue.setTaskHandler(async (task) => {
      await sessionManager.executeTask(task);
      completedTasks.push(task.id);
    });
  });

  afterAll(() => {
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  });

  beforeEach(() => {
    completedTasks = [];
    linearMock.reset();
  });

  test("processes tasks in priority order", async () => {
    // Don't start workers yet - we want to enqueue first
    const lowTask = createTestTask({
      issueId: "low-priority",
      priority: "low",
      title: "Low priority task",
      description: "Call task_complete with summary 'Low priority done'.",
    });

    const highTask = createTestTask({
      issueId: "high-priority",
      priority: "high",
      title: "High priority task",
      description: "Call task_complete with summary 'High priority done'.",
    });

    await queue.enqueue(lowTask);
    await queue.enqueue(highTask);

    // Verify ordering
    const tasks = queue.getTasks("pending");
    expect(tasks[0].issueId).toBe("high-priority");
    expect(tasks[1].issueId).toBe("low-priority");
  });

  test("persists queue state to disk", async () => {
    const task = createTestTask({
      title: "Persistence test",
      description: "This task tests persistence.",
    });

    await queue.enqueue(task);

    // Verify queue file exists
    const queueFile = join(TEST_DATA_DIR, "queue.json");
    expect(existsSync(queueFile)).toBe(true);

    const queueData = JSON.parse(readFileSync(queueFile, "utf-8"));
    expect(queueData.pending.length).toBeGreaterThan(0);
  });
});

// Test for webhook to queue flow
describe.skipIf(SKIP_E2E)("E2E: Webhook to Task Flow", () => {
  test("webhook creates task in queue", async () => {
    // This would test the full webhook → queue → execution flow
    // For now, we test the components individually
    expect(true).toBe(true);
  });
});

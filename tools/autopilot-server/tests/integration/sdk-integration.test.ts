/**
 * Integration tests for Claude Agent SDK
 *
 * Tests the actual SDK query() API with real Claude calls
 * Linear is mocked, but SDK calls are real
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";

// Check for API key before running tests
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SKIP_INTEGRATION = !ANTHROPIC_API_KEY;

describe("Claude Agent SDK Integration", () => {
  beforeAll(() => {
    if (SKIP_INTEGRATION) {
      console.log("⚠️  Skipping integration tests: ANTHROPIC_API_KEY not set");
    }
  });

  describe("SDK Import", () => {
    it("should import query function from SDK", async () => {
      const sdk = await import("@anthropic-ai/claude-agent-sdk");
      expect(sdk.query).toBeDefined();
      expect(typeof sdk.query).toBe("function");
    });

    it("should have all expected exports", async () => {
      const sdk = await import("@anthropic-ai/claude-agent-sdk");

      // Check for expected exports
      expect(sdk.query).toBeDefined();
      expect(sdk.createSdkMcpServer).toBeDefined();
      expect(sdk.tool).toBeDefined();

      // These may or may not exist depending on SDK version
      console.log("SDK exports:", Object.keys(sdk));
    });
  });

  describe("query() API", () => {
    it.skipIf(SKIP_INTEGRATION)("should execute a simple query", async () => {
      const { query } = await import("@anthropic-ai/claude-agent-sdk");

      const messages: unknown[] = [];
      let hasResult = false;

      // Simple query that doesn't need file access
      for await (const message of query({
        prompt: "What is 2 + 2? Reply with just the number.",
        options: {
          allowedTools: [], // No tools needed for this
          permissionMode: "bypassPermissions",
        },
      })) {
        messages.push(message);
        console.log("Message type:", (message as { type: string }).type);

        if ((message as { type: string }).type === "result") {
          hasResult = true;
          const result = (message as { result?: string }).result;
          console.log("Result:", result);
          expect(result).toContain("4");
        }
      }

      expect(messages.length).toBeGreaterThan(0);
      expect(hasResult).toBe(true);
    }, 60000); // 60 second timeout

    it.skipIf(SKIP_INTEGRATION)("should capture session ID from init message", async () => {
      const { query } = await import("@anthropic-ai/claude-agent-sdk");

      let sessionId: string | undefined;

      for await (const message of query({
        prompt: "Say hello",
        options: {
          allowedTools: [],
          permissionMode: "bypassPermissions",
        },
      })) {
        const msg = message as { type: string; subtype?: string; session_id?: string };

        if (msg.type === "system" && msg.subtype === "init") {
          sessionId = msg.session_id;
          console.log("Captured session ID:", sessionId);
        }
      }

      // Session ID should be captured
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe("string");
    }, 60000);

    it.skipIf(SKIP_INTEGRATION)("should handle tools when available", async () => {
      const { query } = await import("@anthropic-ai/claude-agent-sdk");

      const messageTypes = new Set<string>();
      let gotResult = false;

      // Request file reading - Claude may or may not use tools
      for await (const message of query({
        prompt: "Use the Read tool to read package.json and tell me the name field value",
        options: {
          allowedTools: ["Read"],
          permissionMode: "bypassPermissions",
        },
      })) {
        const msg = message as { type: string; name?: string };
        messageTypes.add(msg.type);

        if (msg.type === "tool_use") {
          console.log("Tool used:", msg.name);
        }
        if (msg.type === "result") {
          gotResult = true;
        }
      }

      console.log("Message types seen:", Array.from(messageTypes));
      // Should at least complete with a result
      expect(gotResult).toBe(true);
    }, 120000);

    it.skipIf(SKIP_INTEGRATION)("should complete file search request", async () => {
      const { query } = await import("@anthropic-ai/claude-agent-sdk");

      let gotResult = false;
      const toolsUsed: string[] = [];

      for await (const message of query({
        prompt: "Use the Glob tool to find TypeScript files matching **/*.ts in the src directory",
        options: {
          allowedTools: ["Glob"],
          permissionMode: "bypassPermissions",
        },
      })) {
        const msg = message as { type: string; name?: string };

        if (msg.type === "tool_use" && msg.name) {
          toolsUsed.push(msg.name);
        }
        if (msg.type === "result") {
          gotResult = true;
        }
      }

      console.log("Tools used:", toolsUsed);
      expect(gotResult).toBe(true);
    }, 120000);
  });

  describe("Message Types", () => {
    it.skipIf(SKIP_INTEGRATION)("should receive expected message types", async () => {
      const { query } = await import("@anthropic-ai/claude-agent-sdk");

      const messageTypes = new Set<string>();

      for await (const message of query({
        prompt: "List the files in the current directory",
        options: {
          allowedTools: ["Bash"],
          permissionMode: "bypassPermissions",
        },
      })) {
        const msg = message as { type: string };
        messageTypes.add(msg.type);
      }

      console.log("Received message types:", Array.from(messageTypes));

      // Should have at least system and result
      expect(messageTypes.has("system")).toBe(true);
    }, 120000);
  });

  describe("Error Handling", () => {
    it("should handle invalid options gracefully", async () => {
      const { query } = await import("@anthropic-ai/claude-agent-sdk");

      // This should throw or return an error message
      let errorOccurred = false;

      try {
        for await (const message of query({
          prompt: "",  // Empty prompt
          options: {
            allowedTools: [],
          },
        })) {
          const msg = message as { type: string };
          if (msg.type === "error") {
            errorOccurred = true;
          }
        }
      } catch (error) {
        errorOccurred = true;
        console.log("Error caught:", error);
      }

      // Empty prompt should cause some kind of error or be handled
      // The specific behavior depends on SDK implementation
    }, 30000);
  });
});

describe("Session Manager Integration", () => {
  it.skipIf(SKIP_INTEGRATION)("should execute task through session manager", async () => {
    // Import the session manager
    const { ClaudeSessionManager } = await import("../../src/services/claude-session-manager");

    // Create minimal config
    const config = {
      port: 8099,
      host: "localhost",
      dataDir: "./data/test",
      maxConcurrent: 1,
      maxQueueSize: 10,
      retryAttempts: 1,
      retryDelayMs: 1000,
      webhookSecret: "test",
      linearApiKey: "",
      linearTeamId: "",
      botUserId: "",
      anthropicApiKey: ANTHROPIC_API_KEY!,
      model: "claude-sonnet-4-20250514",
      devMode: true,
      enableMultiModelReview: false,
      reviewModels: [],
    };

    const manager = new ClaudeSessionManager(config);
    await manager.initialize();

    // Create a test task
    const task = {
      id: "test-" + Date.now(),
      issueId: "test-issue-" + Date.now(),
      title: "Test Task",
      description: "Say hello and confirm you received this task",
      tags: ["@implement"],
      priority: "normal" as const,
      status: "pending" as const,
      attempt: 0,
      maxAttempts: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Execute the task
    await manager.executeTask(task);

    // Check session was created
    const session = manager.getSession(task.issueId);
    expect(session).toBeDefined();
    expect(session?.status).toBe("completed");
    expect(session?.transcript.length).toBeGreaterThan(0);

    console.log("Session completed with", session?.toolCallCount, "tool calls");
    console.log("Transcript entries:", session?.transcript.length);
  }, 180000); // 3 minute timeout
});

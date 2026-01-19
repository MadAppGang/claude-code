/**
 * Manual Integration Test
 *
 * Run this script to test the full autopilot server flow:
 * 1. Starts the server
 * 2. Creates a task via HTTP API
 * 3. Waits for execution
 * 4. Verifies completion
 *
 * Usage:
 *   ANTHROPIC_API_KEY=xxx bun run tests/integration/manual-test.ts
 */

const SERVER_PORT = 13456; // Use different port for tests
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

async function waitForServer(maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${SERVER_URL}/health`);
      if (res.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Server failed to start");
}

async function waitForTaskCompletion(
  taskId: string,
  maxAttempts = 60
): Promise<{ status: string; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${SERVER_URL}/tasks/${taskId}`);
    const data = (await res.json()) as { task: { status: string; error?: string } };

    if (data.task.status === "completed" || data.task.status === "failed") {
      return data.task;
    }

    console.log(`  Task status: ${data.task.status} (attempt ${i + 1}/${maxAttempts})`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("Task did not complete in time");
}

async function main(): Promise<void> {
  console.log("=== Autopilot Server Integration Test ===\n");

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  // Start server in background
  console.log("1. Starting server...");
  const server = Bun.spawn(["bun", "run", "src/index.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AUTOPILOT_PORT: String(SERVER_PORT),
      AUTOPILOT_DEV_MODE: "true",
      AUTOPILOT_MAX_CONCURRENT: "1",
      LOG_LEVEL: "info",
    },
    stdout: "inherit",
    stderr: "inherit",
  });

  try {
    await waitForServer();
    console.log("   Server started successfully\n");

    // Create a simple task
    console.log("2. Creating test task...");
    const createRes = await fetch(`${SERVER_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueId: `test-${Date.now()}`,
        title: "Integration Test Task",
        description:
          'Create a file called "test-output.txt" in the current directory with the content "Hello from autopilot integration test". Then call task_complete with a summary.',
        tags: [],
        priority: "high",
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create task: ${createRes.status}`);
    }

    const createData = (await createRes.json()) as { task: { id: string; issueId: string } };
    console.log(`   Task created: ${createData.task.id}\n`);

    // Wait for completion
    console.log("3. Waiting for task completion...");
    const result = await waitForTaskCompletion(createData.task.id);

    if (result.status === "completed") {
      console.log("\n✅ Task completed successfully!");
    } else {
      console.log(`\n❌ Task failed: ${result.error}`);
      process.exit(1);
    }

    // Check status
    console.log("\n4. Final server status:");
    const statusRes = await fetch(`${SERVER_URL}/status`);
    const status = await statusRes.json();
    console.log(JSON.stringify(status, null, 2));
  } finally {
    // Cleanup
    console.log("\n5. Stopping server...");
    server.kill();
    await server.exited;
    console.log("   Server stopped\n");
  }

  console.log("=== Test Complete ===");
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});

/**
 * Autopilot Server - Main Entry Point
 *
 * Autonomous task execution server with Linear integration
 * Uses Claude Agent SDK V2 for session management
 */

import { loadConfig } from "./utils/config";
import { logger } from "./utils/logger";
import { PriorityQueue } from "./services/priority-queue";
import { ClaudeSessionManager } from "./services/claude-session-manager";
import { LinearClient } from "./services/linear-client";
import { WebhookVerifier } from "./services/webhook-verifier";
import { handleWebhook } from "./routes/webhook";
import { handleApi } from "./routes/api";

async function main(): Promise<void> {
  logger.info("Starting Autopilot Server...");

  // Load configuration
  const config = loadConfig();

  logger.info("Configuration loaded", {
    port: config.port,
    maxConcurrent: config.maxConcurrent,
    devMode: config.devMode,
    workingDirectory: config.workingDirectory || process.cwd(),
  });

  // Initialize services
  const queue = new PriorityQueue(config);
  const sessionManager = new ClaudeSessionManager(config);
  const linearClient = new LinearClient(config);
  const webhookVerifier = new WebhookVerifier(config.webhookSecret, config.devMode);

  // Wire up dependencies
  sessionManager.setLinearClient(linearClient);

  // Initialize
  await queue.initialize();
  await sessionManager.initialize();
  await linearClient.initializeLabelCache();

  // Set task handler - this is where Claude executes tasks
  queue.setTaskHandler(async (task) => {
    await sessionManager.executeTask(task);
  });

  // Start workers
  queue.startWorkers();

  // Create HTTP server
  const server = Bun.serve({
    port: config.port,
    hostname: config.host,

    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      logger.debug("Request received", { method, path });

      // Handle OPTIONS for CORS preflight
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      }

      let response: Response;

      // Route requests
      if (path === "/webhook" && method === "POST") {
        response = await handleWebhook(req, queue, webhookVerifier, linearClient);
      } else {
        response = await handleApi(req, queue);
      }

      // Add CORS headers to response
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    },
  });

  logger.info(`Server running on http://${config.host}:${config.port}`);

  // Graceful shutdown handling
  const shutdown = async () => {
    logger.info("Shutdown signal received");
    await queue.shutdownGracefully();
    server.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// Run
main().catch((error) => {
  logger.error("Fatal error", { error: error.message });
  process.exit(1);
});

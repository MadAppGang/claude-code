/**
 * Configuration loader with environment variable support
 */

import type { Config } from "../types";
import { logger } from "./logger";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

function optionalIntEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    logger.warn(`Invalid integer for ${name}, using default`, { value, default: defaultValue });
    return defaultValue;
  }
  return parsed;
}

function optionalBoolEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.toLowerCase();
  if (!value) return defaultValue;
  return value === "true" || value === "1" || value === "yes";
}

export function loadConfig(): Config {
  const devMode = optionalBoolEnv("AUTOPILOT_DEV_MODE", false);

  // In dev mode, some variables are optional
  const webhookSecret = devMode
    ? optionalEnv("LINEAR_WEBHOOK_SECRET", "dev-secret")
    : requireEnv("LINEAR_WEBHOOK_SECRET");

  const linearApiKey = devMode
    ? optionalEnv("LINEAR_API_KEY", "")
    : requireEnv("LINEAR_API_KEY");

  const anthropicApiKey = requireEnv("ANTHROPIC_API_KEY");

  // Working directory for Claude Code (where CLAUDE.md, plugins, etc. are loaded from)
  const workingDirectory = process.env.AUTOPILOT_WORKING_DIR || undefined;

  // Multi-model review configuration
  const enableMultiModelReview = optionalBoolEnv("AUTOPILOT_MULTI_MODEL_REVIEW", true);
  // Model IDs for review:
  // - "internal" = Claude via SDK
  // - OpenRouter: "google/gemini-3-pro-preview", "openai/gpt-5.2" (no prefix needed)
  // - Direct APIs: "mm/minimax-m2.1" (MiniMax), "glm/glm-4.7" (GLM)
  const reviewModelsStr = optionalEnv(
    "AUTOPILOT_REVIEW_MODELS",
    "internal,mm/minimax-m2.1,glm/glm-4.7,google/gemini-3-pro-preview,openai/gpt-5.2"
  );
  const reviewModels = reviewModelsStr.split(",").map((m) => m.trim()).filter(Boolean);

  return {
    port: optionalIntEnv("AUTOPILOT_PORT", 3456),
    host: optionalEnv("AUTOPILOT_HOST", "0.0.0.0"),
    dataDir: optionalEnv("AUTOPILOT_DATA_DIR", "./data"),
    maxConcurrent: optionalIntEnv("AUTOPILOT_MAX_CONCURRENT", 3),
    maxQueueSize: optionalIntEnv("AUTOPILOT_MAX_QUEUE_SIZE", 1000),
    retryAttempts: optionalIntEnv("AUTOPILOT_RETRY_ATTEMPTS", 3),
    retryDelayMs: optionalIntEnv("AUTOPILOT_RETRY_DELAY_MS", 5000),
    webhookSecret,
    linearApiKey,
    linearTeamId: optionalEnv("LINEAR_TEAM_ID", ""),
    botUserId: optionalEnv("AUTOPILOT_BOT_USER_ID", ""),
    anthropicApiKey,
    model: optionalEnv("AUTOPILOT_MODEL", "claude-sonnet-4-20250514"),
    devMode,
    workingDirectory,
    enableMultiModelReview,
    reviewModels,
  };
}

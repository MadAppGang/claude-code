/**
 * Claude Session Manager using Agent SDK
 *
 * Uses the correct query() API from @anthropic-ai/claude-agent-sdk
 * SDK handles tool execution internally - no need to implement tools ourselves
 *
 * @see https://platform.claude.com/docs/en/agent-sdk/overview
 */

import { mkdir, readFile, writeFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { Config, SessionRecord, Task, TranscriptEntry } from "../types";
import { logger } from "../utils/logger";
import { MultiModelReviewer, type ModelPlanFeedback } from "./multi-model-reviewer";

// Tag to command/prompt mapping
const TAG_MAPPINGS: Record<
  string,
  { command: string; promptAddition: string }
> = {
  "@debug": {
    command: "/dev:debug",
    promptAddition:
      "Focus on debugging and root cause analysis. Use systematic debugging approach.",
  },
  "@test": {
    command: "/dev:implement",
    promptAddition:
      "Focus on writing and running tests. Ensure comprehensive test coverage.",
  },
  "@ui": {
    command: "/frontend:review",
    promptAddition:
      "Focus on UI implementation and design review. Pay attention to accessibility and UX.",
  },
  "@frontend": {
    command: "/frontend:implement",
    promptAddition:
      "Focus on React/TypeScript frontend implementation following project patterns.",
  },
  "@review": {
    command: "/dev:architect",
    promptAddition:
      "Conduct thorough architecture review. Analyze design, patterns, and trade-offs.",
  },
  "@refactor": {
    command: "/dev:implement",
    promptAddition:
      "Focus on code refactoring. Improve code quality while maintaining functionality.",
  },
  "@research": {
    command: "/dev:deep-research",
    promptAddition:
      "Conduct deep research on the topic. Gather comprehensive information before acting.",
  },
  "@implement": {
    command: "/dev:feature",
    promptAddition:
      "Implement the requested feature following project patterns and best practices.",
  },
};

export class ClaudeSessionManager {
  private readonly config: Config;
  private readonly sessionsDir: string;
  private sessions: Map<string, SessionRecord> = new Map();
  private promptCache: Map<string, string> = new Map();

  // Track tool_use_id → tool_name per session (not persisted)
  // Key: issueId, Value: Map of tool_use_id → tool_name
  private toolIdMap: Map<string, Map<string, string>> = new Map();

  // Linear client for posting updates (injected for testability)
  private linearClient: LinearClientInterface | null = null;

  // Multi-model reviewer for post-completion validation
  private readonly multiModelReviewer: MultiModelReviewer;

  constructor(config: Config) {
    this.config = config;
    this.sessionsDir = join(config.dataDir, "sessions");
    this.multiModelReviewer = new MultiModelReviewer(config);
  }

  /**
   * Set Linear client for posting updates
   */
  setLinearClient(client: LinearClientInterface): void {
    this.linearClient = client;
  }

  /**
   * Initialize session manager - load existing sessions and cache prompts
   */
  async initialize(): Promise<void> {
    await mkdir(this.sessionsDir, { recursive: true });
    await this.loadSessions();
    await this.loadPromptCache();

    logger.info("Session manager initialized", {
      sessions: this.sessions.size,
      prompts: this.promptCache.size,
    });
  }

  /**
   * Execute a task using the Claude Agent SDK query() API
   */
  async executeTask(task: Task): Promise<void> {
    const existingSession = this.sessions.get(task.issueId);

    // Only resume if session exists, has an ID, and is still active
    if (existingSession?.sessionId && existingSession.status === "active") {
      // Resume existing session
      await this.resumeSession(task, existingSession);
    } else {
      // Create new session (also handles failed/completed sessions by starting fresh)
      if (existingSession?.status === "failed" || existingSession?.status === "completed") {
        logger.info("Previous session ended, starting fresh", {
          issueId: task.issueId,
          previousStatus: existingSession.status,
        });
      }
      await this.createSession(task);
    }
  }

  /**
   * Get session for an issue
   */
  getSession(issueId: string): SessionRecord | undefined {
    return this.sessions.get(issueId);
  }

  /**
   * Create a new Claude session for a task using query() API
   */
  private async createSession(task: Task): Promise<void> {
    const prompt = this.constructTaskPrompt(task);
    const systemPrompt = this.constructSystemPrompt(task.tags);

    // Create session record
    const record: SessionRecord = {
      issueId: task.issueId,
      sessionId: "",
      status: "active",
      transcript: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      toolCallCount: 0,
    };

    this.sessions.set(task.issueId, record);

    const cwd = this.config.workingDirectory || process.cwd();
    logger.info("Creating new Claude session", {
      issueId: task.issueId,
      tags: task.tags,
      cwd,
    });

    // Transition to "In Progress" and post starting comment to Linear
    if (this.linearClient) {
      try {
        await this.linearClient.transitionToState(task.issueId, "In Progress");
      } catch (error) {
        logger.warn("Failed to transition to In Progress", {
          issueId: task.issueId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      await this.linearClient.createComment(
        task.issueId,
        `🤖 **Autopilot Started**\n\nProcessing task: ${task.title}\n\nTags: ${task.tags.join(", ")}`
      );
    }

    try {
      // Import SDK dynamically
      const { query } = await import("@anthropic-ai/claude-agent-sdk");

      // Build execution prompt with multi-model review instructions if enabled
      const executionPrompt = this.config.enableMultiModelReview
        ? this.constructMultiModelPrompt(task, prompt)
        : prompt;

      // Record user prompt
      record.transcript.push({
        role: "user",
        content: executionPrompt,
        timestamp: new Date(),
      });

      // Use query() API with FULL Claude Code capabilities
      // - cwd: working directory (project to load settings from)
      // - No tool restrictions (all tools, skills, agents, MCP servers available)
      // - bypassPermissions: auto-accept all tool calls
      // - settingSources: ["project"] loads CLAUDE.md, skills, commands, plugins
      for await (const message of query({
        prompt: executionPrompt,
        options: {
          systemPrompt,
          cwd, // Use the cwd logged above
          permissionMode: "bypassPermissions", // Allow ALL tools without prompts
          model: this.config.model,
          settingSources: ["project"], // Load project CLAUDE.md, skills, agents, plugins
        },
      })) {
        record.lastActivity = new Date();

        // Capture session ID from init message
        if (
          message.type === "system" &&
          (message as SystemMessage).subtype === "init"
        ) {
          record.sessionId = (message as SystemMessage).session_id || "";
          logger.debug("Session ID captured", { sessionId: record.sessionId });
        }

        // Handle different message types
        await this.handleMessage(message, record, task);
      }

      // Mark as completed if we got through without error
      if (record.status === "active") {
        record.status = "completed";
      }

      await this.persistSession(record);

      // Post success to Linear
      if (this.linearClient && record.status === "completed") {
        await this.postSuccessToLinear(task, record);
      }

      // Clean up tool ID map for this session
      this.toolIdMap.delete(task.issueId);

      logger.info("Session completed", {
        issueId: task.issueId,
        toolCalls: record.toolCallCount,
        status: record.status,
      });
    } catch (error) {
      // Clean up tool ID map on error too
      this.toolIdMap.delete(task.issueId);

      record.status = "failed";
      await this.persistSession(record);

      logger.error("Session failed", {
        issueId: task.issueId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Post error to Linear
      if (this.linearClient) {
        await this.postErrorToLinear(task, error);
      }

      throw error;
    }
  }

  /**
   * Resume an existing session using query() with resume option
   */
  private async resumeSession(
    task: Task,
    record: SessionRecord
  ): Promise<void> {
    const cwd = this.config.workingDirectory || process.cwd();
    logger.info("Resuming Claude session", {
      issueId: task.issueId,
      sessionId: record.sessionId,
      previousMessages: record.transcript.length,
      cwd,
    });

    const continuationPrompt = this.constructContinuationPrompt(task);

    try {
      const { query } = await import("@anthropic-ai/claude-agent-sdk");

      record.transcript.push({
        role: "user",
        content: continuationPrompt,
        timestamp: new Date(),
      });

      // Resume with session ID - full capabilities
      logger.debug("Starting SDK resume query", { sessionId: record.sessionId });

      for await (const message of query({
        prompt: continuationPrompt,
        options: {
          resume: record.sessionId,
          cwd, // Use the cwd logged above
          permissionMode: "bypassPermissions",
          settingSources: ["project"], // Load project CLAUDE.md, skills, agents, plugins
        },
      })) {
        record.lastActivity = new Date();
        await this.handleMessage(message, record, task);
      }

      logger.debug("SDK resume query completed", {
        issueId: task.issueId,
        toolCalls: record.toolCallCount,
        transcriptLength: record.transcript.length,
      });

      if (record.status === "active") {
        record.status = "completed";
      }

      await this.persistSession(record);

      if (this.linearClient && record.status === "completed") {
        await this.postSuccessToLinear(task, record);
      }

      // Clean up tool ID map for this session
      this.toolIdMap.delete(task.issueId);
    } catch (error) {
      // Session expired - create new one
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("session_not_found") ||
        errorMessage.includes("session_expired")
      ) {
        logger.warn("Session expired, creating new session", {
          issueId: task.issueId,
          oldSessionId: record.sessionId,
        });
        record.sessionId = "";
        // Don't clean up tool ID map - createSession will set up its own
        return this.createSession(task);
      }

      // Clean up tool ID map on error
      this.toolIdMap.delete(task.issueId);

      record.status = "failed";
      await this.persistSession(record);

      if (this.linearClient) {
        await this.postErrorToLinear(task, error);
      }

      throw error;
    }
  }

  /**
   * Handle a message from the query() stream
   */
  private async handleMessage(
    message: QueryMessage,
    record: SessionRecord,
    task: Task
  ): Promise<void> {
    switch (message.type) {
      case "assistant": {
        // Claude's text response
        const content = (message as AssistantMessage).content;
        if (content) {
          const preview = content.slice(0, 120) + (content.length > 120 ? "..." : "");
          logger.badge("assistant", preview);
          record.transcript.push({
            role: "assistant",
            content,
            timestamp: new Date(),
          });
        }
        break;
      }

      case "tool_use": {
        // Tool being used
        const toolMsg = message as ToolUseMessage;
        record.toolCallCount++;
        record.transcript.push({
          role: "tool_use",
          content: JSON.stringify(toolMsg.input),
          timestamp: new Date(),
          toolName: toolMsg.name,
          toolInput: toolMsg.input,
        });

        // Store tool_use_id → tool_name mapping for later result matching
        if (toolMsg.id) {
          let sessionToolMap = this.toolIdMap.get(task.issueId);
          if (!sessionToolMap) {
            sessionToolMap = new Map();
            this.toolIdMap.set(task.issueId, sessionToolMap);
          }
          sessionToolMap.set(toolMsg.id, toolMsg.name);
        }

        // Log tool usage with badge - special handling for Task tool
        if (toolMsg.name === "Task") {
          const input = toolMsg.input as { subagent_type?: string; prompt?: string; description?: string };
          const agentType = input.subagent_type || "unknown";
          const desc = input.description || "";
          // Check for PROXY_MODE in prompt
          const prompt = input.prompt || "";
          const proxyMatch = prompt.match(/PROXY_MODE:\s*(\S+)/);
          const proxyModel = proxyMatch ? proxyMatch[1] : null;

          if (proxyModel) {
            logger.badge("tool", `Task[${agentType}] → PROXY: ${proxyModel} - ${desc}`);
          } else {
            logger.badge("tool", `Task[${agentType}] → ${desc}`);
          }
        } else {
          const inputStr = JSON.stringify(toolMsg.input);
          const inputPreview = inputStr.slice(0, 80) + (inputStr.length > 80 ? "..." : "");
          logger.badge("tool", `${toolMsg.name} → ${inputPreview}`);
        }
        break;
      }

      case "tool_result": {
        // Tool result (SDK provides this)
        const toolContent = (message as ToolResultMessage).content;
        record.transcript.push({
          role: "tool_result",
          content:
            typeof toolContent === "string"
              ? toolContent
              : JSON.stringify(toolContent),
          timestamp: new Date(),
        });
        break;
      }

      case "result": {
        // Final result from Claude
        const resultContent = (message as ResultMessage).result;
        if (resultContent) {
          const preview = resultContent.slice(0, 100) + (resultContent.length > 100 ? "..." : "");
          logger.badge("assistant", `✓ DONE: ${preview}`);
          record.transcript.push({
            role: "assistant",
            content: resultContent,
            timestamp: new Date(),
          });
        }
        break;
      }

      case "error":
        // Error during execution
        logger.badge("system", `✗ ERROR: ${(message as ErrorMessage).error?.message || "Unknown"}`);
        logger.error("Query error", {
          issueId: task.issueId,
          error: (message as ErrorMessage).error,
        });
        throw new Error((message as ErrorMessage).error?.message || "Unknown error");

      case "system": {
        // System messages (init, etc.)
        const subtype = (message as SystemMessage).subtype || "unknown";
        logger.badge("system", subtype);
        break;
      }

      case "user": {
        // User messages contain tool results from SDK
        const userMsg = message as {
          type: string;
          message?: {
            content?: Array<{
              type: string;
              tool_use_id?: string;
              content?: string;
            }>;
          };
        };

        // Extract tool result info if present
        const toolResults = userMsg.message?.content?.filter(c => c.type === "tool_result") || [];
        if (toolResults.length > 0) {
          // Get the tool ID map for this session
          const sessionToolMap = this.toolIdMap.get(task.issueId);

          for (const result of toolResults) {
            // Look up tool name from the mapping (set when tool_use was received)
            const toolName = result.tool_use_id && sessionToolMap
              ? sessionToolMap.get(result.tool_use_id)
              : undefined;

            // Ensure content is always a string - handle objects properly
            let content: string;
            if (typeof result.content === 'string') {
              content = result.content;
            } else if (result.content && typeof result.content === 'object') {
              content = JSON.stringify(result.content, null, 2);
            } else {
              content = String(result.content || "(empty)");
            }

            // Check for errors - be more comprehensive
            const isError = content.includes("<tool_use_error>") ||
              content.includes("error:") ||
              content.includes("Error:") ||
              content.includes("Exit code 1") ||
              content.includes("BLOCKED") ||
              content.includes("failed");

            // Use the actual tool name from the mapping, or try to extract from content
            let toolLabel = toolName || "subagent";

            // For errors, show more context (up to 200 chars, multi-line)
            let preview: string;
            if (isError) {
              // Show more for errors - first 200 chars
              preview = content.slice(0, 200).replace(/\n/g, " ") + (content.length > 200 ? "..." : "");
            } else {
              // Clean preview - single line, max 100 chars
              const firstLine = content.split("\n")[0] || "(empty)";
              preview = firstLine.slice(0, 100) + (firstLine.length > 100 ? "..." : "");
            }

            // Use error badge for errors, result badge otherwise
            if (isError) {
              logger.badge("error", `[${toolLabel}] ${preview}`);
              // Also log full error for debugging
              logger.debug("Full error content", { toolLabel, content: content.slice(0, 1000) });
            } else {
              logger.badge("result", `[${toolLabel}] ${preview}`);
            }
          }
        } else {
          // Other user messages (prompts, etc.)
          const msgStr = JSON.stringify(message).slice(0, 100);
          logger.badge("user", msgStr);
        }
        break;
      }

      default:
        // Unknown message type - log for debugging
        logger.debug("Unknown message type", { type: message.type, message });
    }

    // Periodic persistence
    if (record.toolCallCount > 0 && record.toolCallCount % 5 === 0) {
      await this.persistSession(record);
    }
  }

  /**
   * Construct system prompt with tag-specific additions
   */
  private constructSystemPrompt(tags: string[]): string {
    const basePrompt = this.promptCache.get("__base__") || DEFAULT_BASE_PROMPT;

    const tagAdditions = tags
      .filter((t) => t.startsWith("@") && TAG_MAPPINGS[t])
      .map((t) => TAG_MAPPINGS[t].promptAddition)
      .join("\n\n");

    return `${basePrompt}\n\n${tagAdditions}`.trim();
  }

  /**
   * Construct initial task prompt with slash command based on tags
   */
  private constructTaskPrompt(task: Task): string {
    // Find the first matching tag with a command
    const matchingTag = task.tags.find((t) => t.startsWith("@") && TAG_MAPPINGS[t]?.command);
    const command = matchingTag ? TAG_MAPPINGS[matchingTag].command : null;

    const basePrompt = `# Task: ${task.title}

## Issue ID
${task.issueId}

## Description
${task.description}

## Instructions
Please complete this task. Analyze the codebase, make necessary changes, and provide a summary when done.`;

    // Prepend slash command if tag mapping exists
    if (command) {
      return `${command}

${basePrompt}`;
    }

    return basePrompt;
  }

  /**
   * Construct continuation prompt for resumed sessions
   */
  private constructContinuationPrompt(task: Task): string {
    return `Continue working on task: ${task.title}

The session was interrupted. Please review the previous context and continue where you left off.`;
  }

  /**
   * Construct prompt with multi-model orchestration instructions
   * Claude will use its Task tool with PROXY_MODE to get plan reviews from external models
   */
  private constructMultiModelPrompt(task: Task, basePrompt: string): string {
    const models = this.config.reviewModels.filter(m => m !== "internal").join(", ");

    return `${basePrompt}

## Multi-Model Plan Review Required

Before implementing this task, you MUST:

1. **Create a detailed implementation plan** covering:
   - Analysis of what needs to be understood
   - Strategy and approach
   - Numbered steps with specific actions
   - Files to create/modify
   - Testing approach
   - Potential risks

2. **Get plan reviewed by external AI models** using the Task tool.
   Launch these reviews IN PARALLEL (single message, multiple Task calls):

   For each of these models: ${models}

   Use this EXACT pattern for each Task call:
   - subagent_type: "general-purpose"
   - model: "haiku" (use haiku as base, PROXY_MODE overrides it)
   - prompt: Start with "PROXY_MODE: <model-name>" on the first line, then your review request

   Example prompt for openai/gpt-5.2:
   "PROXY_MODE: openai/gpt-5.2

   Review this implementation plan and provide feedback:

   <your-plan-here>

   Respond with: APPROVE, SUGGEST, or REJECT. Include specific feedback."

3. **Analyze the consensus**:
   - If majority approve: proceed with execution
   - If suggestions: refine plan and re-review (max 3 iterations)
   - If majority reject: explain why and stop

4. **Execute the approved plan** after consensus is reached.

IMPORTANT: Run all model reviews in parallel using multiple Task tool calls in a single message for speed.`;
  }

  /**
   * Post error to Linear as a comment
   */
  private async postErrorToLinear(task: Task, error: unknown): Promise<void> {
    if (!this.linearClient) return;

    const errorMessage =
      error instanceof Error ? error.message : String(error);
    await this.linearClient.createComment(
      task.issueId,
      `⚠️ **Autopilot Error**\n\nTask execution failed:\n\`\`\`\n${errorMessage}\n\`\`\`\n\nAttempt ${task.attempt + 1} of ${task.maxAttempts}.`
    );
  }

  /**
   * Post success to Linear as a comment, run multi-model review, and transition to Review
   */
  private async postSuccessToLinear(
    task: Task,
    record: SessionRecord
  ): Promise<void> {
    if (!this.linearClient) return;

    // Get last assistant message as summary
    const lastAssistant = [...record.transcript]
      .reverse()
      .find((t) => t.role === "assistant");
    const summary = lastAssistant?.content || "Task completed successfully.";

    await this.linearClient.createComment(
      task.issueId,
      `✅ **Task Completed**\n\n${summary.slice(0, 4000)}${summary.length > 4000 ? "..." : ""}\n\n*Tool calls: ${record.toolCallCount}*`
    );

    // Run multi-model review if enabled
    if (this.config.enableMultiModelReview) {
      try {
        logger.badge("system", "Starting multi-model review...");
        const reviewResults = await this.multiModelReviewer.runReviews(task, record);

        if (reviewResults.length > 0) {
          const report = this.multiModelReviewer.generateReport(reviewResults);

          // Post review report to Linear
          await this.linearClient.createComment(task.issueId, report);

          logger.info("Multi-model review posted", {
            issueId: task.issueId,
            models: reviewResults.map((r) => r.model),
            verdicts: reviewResults.map((r) => r.verdict),
          });
        }
      } catch (error) {
        logger.warn("Multi-model review failed", {
          issueId: task.issueId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Transition to Review state
    try {
      await this.linearClient.transitionToState(task.issueId, "In Review");
      logger.info("Issue transitioned to Review", { issueId: task.issueId });
    } catch (error) {
      logger.warn("Failed to transition to Review", {
        issueId: task.issueId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async persistSession(record: SessionRecord): Promise<void> {
    const filePath = join(this.sessionsDir, `${record.issueId}.json`);
    await writeFile(filePath, JSON.stringify(record, null, 2));
  }

  private async loadSessions(): Promise<void> {
    if (!existsSync(this.sessionsDir)) return;

    const files = await readdir(this.sessionsDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      try {
        const data = await readFile(join(this.sessionsDir, file), "utf-8");
        const record = JSON.parse(data) as SessionRecord;
        this.sessions.set(record.issueId, record);
      } catch (error) {
        logger.warn("Failed to load session", { file, error });
      }
    }
  }

  private async loadPromptCache(): Promise<void> {
    this.promptCache.set("__base__", DEFAULT_BASE_PROMPT);
  }
}

// Default base prompt for task execution
const DEFAULT_BASE_PROMPT = `You are an autonomous task executor for the Autopilot system. Your job is to complete software development tasks assigned via Linear issues.

## Guidelines
1. Read the task description carefully
2. Explore the codebase to understand the context
3. Make necessary changes using the available tools
4. Test your changes when possible
5. Provide a clear summary when done

## Important
- Provide a clear summary of changes at the end
- List all files that were modified`;

// Message types from query() stream
interface QueryMessage {
  type: string;
}

interface SystemMessage extends QueryMessage {
  type: "system";
  subtype?: "init";
  session_id?: string;
}

interface AssistantMessage extends QueryMessage {
  type: "assistant";
  content: string;
}

interface ToolUseMessage extends QueryMessage {
  type: "tool_use";
  id: string; // tool_use_id for matching with tool_result
  name: string;
  input: unknown;
}

interface ToolResultMessage extends QueryMessage {
  type: "tool_result";
  content: string | unknown;
}

interface ResultMessage extends QueryMessage {
  type: "result";
  result: string;
}

interface ErrorMessage extends QueryMessage {
  type: "error";
  error?: { message: string };
}

// Linear client interface for dependency injection
export interface LinearClientInterface {
  createComment(issueId: string, body: string): Promise<void>;
  updateIssue(
    issueId: string,
    update: { stateId?: string; labelIds?: string[] }
  ): Promise<void>;
  transitionToState(issueId: string, stateName: string): Promise<void>;
}

// Custom error for non-retryable failures
export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableError";
  }
}

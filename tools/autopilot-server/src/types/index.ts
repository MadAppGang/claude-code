/**
 * Autopilot Server Types
 */

// Task states
export type TaskStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "blocked";

// Priority levels for queue ordering
export type Priority = "critical" | "high" | "normal" | "low";

// Task representation
export interface Task {
  id: string;
  issueId: string;
  title: string;
  description: string;
  tags: string[];
  priority: Priority;
  status: TaskStatus;
  attempt: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  sessionId?: string;
}

// Queue state persisted to disk
export interface QueueState {
  pending: Task[];
  active: Map<string, Task>;
  completed: Task[];
  failed: Task[];
  lastUpdated: Date;
}

// Session transcript entry
export interface TranscriptEntry {
  role: "user" | "assistant" | "tool_use" | "tool_result";
  content: string;
  timestamp: Date;
  toolName?: string;
  toolInput?: unknown;
}

// Session record for persistence
export interface SessionRecord {
  issueId: string;
  sessionId: string;
  status: "active" | "completed" | "failed";
  transcript: TranscriptEntry[];
  createdAt: Date;
  lastActivity: Date;
  toolCallCount: number;
}

// Linear webhook payload types
export interface LinearWebhookPayload {
  action: "create" | "update" | "remove";
  type: "Issue" | "Comment" | "IssueLabel";
  data: LinearIssue | LinearComment;
  createdAt: string;
  organizationId?: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  state: { id: string; name: string; type: string };
  labels: { nodes: Array<{ id: string; name: string }> };
  assignee?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface LinearComment {
  id: string;
  body: string;
  issueId: string;
  userId: string;
  createdAt: string;
}

// Server configuration
export interface Config {
  port: number;
  host: string;
  dataDir: string;
  maxConcurrent: number;
  maxQueueSize: number;
  retryAttempts: number;
  retryDelayMs: number;
  webhookSecret: string;
  linearApiKey: string;
  linearTeamId: string;
  botUserId: string;
  anthropicApiKey: string;
  model: string;
  devMode: boolean;
  workingDirectory?: string; // Directory for Claude Code to run in (loads CLAUDE.md, plugins, etc.)
  // Multi-model review configuration
  enableMultiModelReview: boolean;
  reviewModels: string[]; // e.g., ["internal", "mm/minimax-m2.1", "glm/glm-4.7"]
}

// Multi-model review result
export interface ModelReviewResult {
  model: string;
  verdict: "approve" | "needs_changes" | "reject" | "error";
  summary: string;
  issues: string[];
  suggestions: string[];
  responseTimeMs: number;
  error?: string;
}

// HTTP response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StatusResponse {
  status: "healthy" | "degraded" | "unhealthy";
  queue: {
    pending: number;
    active: number;
    completed: number;
    failed: number;
  };
  paused: boolean;
  uptime: number;
  version: string;
}

export interface TaskResponse {
  id: string;
  issueId: string;
  status: TaskStatus;
  priority: Priority;
  attempt: number;
  createdAt: string;
}

// Tag to command mapping
export interface TagMapping {
  command: string;
  systemPromptAddition?: string;
  priority: Priority;
}

// Tool definitions for Claude SDK
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Chunk types from Claude SDK V2 stream
export type StreamChunk =
  | { type: "message"; content: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string }
  | { type: "error"; error: { message: string; code?: string } }
  | { type: "done" };

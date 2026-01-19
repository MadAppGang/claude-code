/**
 * Mock Claude SDK for unit testing
 * Simulates SDK V2 behavior without making real API calls
 */

import type { StreamChunk, ToolDefinition } from "../../src/types";

export interface MockSessionOptions {
  model: string;
  instructions: string;
  tools: ToolDefinition[];
}

export interface MockSession {
  id: string;
  messages: Array<{ role: string; content: string }>;
  tools: ToolDefinition[];
  streamResponse: StreamChunk[];
}

/**
 * Mock Claude SDK that follows V2 API pattern
 */
export class ClaudeSDKMock {
  private sessions: Map<string, MockSession> = new Map();
  private defaultResponse: StreamChunk[] = [];
  private toolResponses: Map<string, string> = new Map();

  /**
   * Set the default response chunks for new sessions
   */
  setDefaultResponse(chunks: StreamChunk[]): void {
    this.defaultResponse = chunks;
  }

  /**
   * Set response for a specific tool
   */
  setToolResponse(toolName: string, response: string): void {
    this.toolResponses.set(toolName, response);
  }

  /**
   * Create a new session (SDK V2 pattern)
   */
  async unstable_v2_createSession(options: MockSessionOptions): Promise<MockSessionHandle> {
    const sessionId = `mock_session_${crypto.randomUUID()}`;

    const session: MockSession = {
      id: sessionId,
      messages: [],
      tools: options.tools,
      streamResponse: [...this.defaultResponse],
    };

    this.sessions.set(sessionId, session);

    return new MockSessionHandle(session, this.toolResponses);
  }

  /**
   * Resume an existing session (SDK V2 pattern)
   */
  async unstable_v2_resumeSession(options: { sessionId: string }): Promise<MockSessionHandle> {
    const session = this.sessions.get(options.sessionId);

    if (!session) {
      const error = new Error("Session not found") as Error & { code: string };
      error.code = "session_not_found";
      throw error;
    }

    return new MockSessionHandle(session, this.toolResponses);
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): MockSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Reset all sessions
   */
  reset(): void {
    this.sessions.clear();
    this.defaultResponse = [];
    this.toolResponses.clear();
  }
}

/**
 * Mock session handle - matches SDK V2 API
 */
class MockSessionHandle {
  readonly id: string;
  private session: MockSession;
  private toolResponses: Map<string, string>;
  private pendingMessage: string | null = null;

  constructor(session: MockSession, toolResponses: Map<string, string>) {
    this.id = session.id;
    this.session = session;
    this.toolResponses = toolResponses;
  }

  /**
   * Send a message (SDK V2: returns void, not response)
   */
  async send(options: { message: string }): Promise<void> {
    this.session.messages.push({
      role: "user",
      content: options.message,
    });
    this.pendingMessage = options.message;
  }

  /**
   * Stream response (SDK V2: async iterable)
   */
  async *stream(): AsyncIterable<StreamChunk> {
    // Yield the configured response chunks
    for (const chunk of this.session.streamResponse) {
      // If it's a tool_use, we might have a configured response
      if (chunk.type === "tool_use") {
        yield chunk;

        // Yield tool result if configured
        const toolResponse = this.toolResponses.get(chunk.name);
        if (toolResponse) {
          yield {
            type: "tool_result",
            tool_use_id: chunk.id,
            content: toolResponse,
          };
        }
      } else {
        yield chunk;
      }
    }

    // End with done
    yield { type: "done" };
  }
}

/**
 * Create a simple successful task completion response
 */
export function createSuccessResponse(summary: string): StreamChunk[] {
  return [
    { type: "message", content: "I'll complete this task now." },
    {
      type: "tool_use",
      id: "tool_1",
      name: "task_complete",
      input: { summary, files_changed: [] },
    },
  ];
}

/**
 * Create a response with file operations
 */
export function createFileOperationResponse(
  filePath: string,
  content: string,
  summary: string
): StreamChunk[] {
  return [
    { type: "message", content: `I'll create ${filePath} now.` },
    {
      type: "tool_use",
      id: "tool_1",
      name: "write_file",
      input: { file_path: filePath, content },
    },
    { type: "message", content: "File written. Completing task." },
    {
      type: "tool_use",
      id: "tool_2",
      name: "task_complete",
      input: { summary, files_changed: [filePath] },
    },
  ];
}

/**
 * Create an error response
 */
export function createErrorResponse(message: string): StreamChunk[] {
  return [{ type: "error", error: { message } }];
}

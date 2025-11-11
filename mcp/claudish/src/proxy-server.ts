import { Hono } from "hono";
import { cors } from "hono/cors";
import { writeFileSync } from "node:fs";
import { transformOpenAIToClaude, removeUriFormat } from "./transform.js";
import { log, isLoggingEnabled, maskCredential, logStructured } from "./logger.js";
import type { ProxyServer } from "./types.js";
import { AdapterManager } from "./adapters/adapter-manager.js";

/**
 * Create and start a Hono-based proxy server
 * - In normal mode: translates Anthropic API to OpenRouter
 * - In monitor mode: passes through to real Anthropic API with logging
 *
 * Based on claude-code-proxy (https://github.com/kiyo-e/claude-code-proxy)
 */
export async function createProxyServer(
  port: number,
  openrouterApiKey?: string,
  model?: string,
  monitorMode: boolean = false,
  anthropicApiKey?: string
): Promise<ProxyServer> {
  const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
  const OPENROUTER_HEADERS = {
    "HTTP-Referer": "https://github.com/MadAppGang/claude-code",
    "X-Title": "Claudish - OpenRouter Proxy",
  };

  const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
  const ANTHROPIC_COUNT_TOKENS_URL = "https://api.anthropic.com/v1/messages/count_tokens";

  // Create Hono app
  const app = new Hono();

  // Add CORS middleware
  app.use("*", cors());

  // Health check endpoint
  app.get("/", (c) => {
    c.header("Cache-Control", "no-cache, no-store, must-revalidate");
    c.header("Pragma", "no-cache");
    c.header("Expires", "0");

    return c.json({
      status: "ok",
      message: monitorMode
        ? "Claudish monitor proxy - logging Anthropic API traffic"
        : "Claudish proxy server is running",
      config: {
        mode: monitorMode ? "monitor" : "openrouter",
        model: monitorMode ? "passthrough" : model,
        port,
        upstream: monitorMode ? "Anthropic" : "OpenRouter",
      },
    });
  });

  // Health check endpoint (alternative)
  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      mode: monitorMode ? "monitor" : "openrouter",
      model: monitorMode ? "passthrough" : model,
      port,
    });
  });

  // Token counting endpoint (Claude Code uses this)
  app.post("/v1/messages/count_tokens", async (c) => {
    try {
      const body = await c.req.json();

      if (monitorMode) {
        // Monitor mode: pass through to Anthropic
        // Extract API key from request headers
        const originalHeaders = c.req.header();
        const extractedApiKey = originalHeaders["x-api-key"] || anthropicApiKey;

        if (!extractedApiKey) {
          log("[Monitor] ERROR: No API key found for token counting");
          return c.json(
            {
              error: {
                type: "authentication_error",
                message: "No API key found in request.",
              },
            },
            401
          );
        }

        log("[Monitor] Token counting request - forwarding to Anthropic");
        log("[Monitor] Request body:");
        log(JSON.stringify(body, null, 2));

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "anthropic-version": originalHeaders["anthropic-version"] || "2023-06-01",
        };

        // Forward authorization header (OAuth)
        if (originalHeaders["authorization"]) {
          headers["authorization"] = originalHeaders["authorization"];
        }

        // Forward x-api-key if present
        if (extractedApiKey) {
          headers["x-api-key"] = extractedApiKey;
        }

        const response = await fetch(ANTHROPIC_COUNT_TOKENS_URL, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        const result = await response.json();
        log("[Monitor] Token counting response:");
        log(JSON.stringify(result, null, 2));

        return c.json(result, response.status as any);
      }

      // OpenRouter mode: estimate tokens (OpenRouter doesn't have token counting)
      log("[Proxy] Token counting request (estimating)");

      // Rough estimation: ~4 characters per token
      const systemTokens = body.system ? Math.ceil(body.system.length / 4) : 0;
      const messageTokens = body.messages
        ? body.messages.reduce((acc: number, msg: any) => {
            const content =
              typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
            return acc + Math.ceil(content.length / 4);
          }, 0)
        : 0;

      const totalTokens = systemTokens + messageTokens;

      return c.json({
        input_tokens: totalTokens,
      });
    } catch (error) {
      log(`[Proxy] Token counting error: ${error}`);
      return c.json(
        {
          error: {
            type: "invalid_request_error",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        },
        400
      );
    }
  });

  // Main Anthropic Messages API endpoint
  app.post("/v1/messages", async (c) => {
    try {
      const claudePayload = await c.req.json();

      // MONITOR MODE: Pass through to real Anthropic API with logging
      if (monitorMode) {
        // Extract API key from Claude Code's request
        const originalHeaders = c.req.header();
        const extractedApiKey = originalHeaders["x-api-key"] || originalHeaders["authorization"] || anthropicApiKey;

        // Log ALL headers to understand what Claude Code is sending
        log("\n=== [MONITOR] Claude Code → Anthropic API Request ===");
        log(`Headers received: ${JSON.stringify(originalHeaders, null, 2)}`);

        if (!extractedApiKey) {
          log("[Monitor] WARNING: No API key found in headers!");
          log("[Monitor] Looking for: x-api-key or authorization header");
          log("[Monitor] Headers present: " + Object.keys(originalHeaders).join(", "));
          log("[Monitor] This request will fail at Anthropic API");
          // Don't return error yet - let it pass through to see Anthropic's response
        } else {
          log(`API Key found: ${maskCredential(extractedApiKey)}`);
        }

        log(`Request body:`);
        log(JSON.stringify(claudePayload, null, 2));
        log("=== End Request ===\n");

        // Forward to Anthropic API - pass through ALL relevant headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "anthropic-version": originalHeaders["anthropic-version"] || "2023-06-01",
        };

        // Forward authorization header (OAuth token)
        if (originalHeaders["authorization"]) {
          headers["authorization"] = originalHeaders["authorization"];
          log(`[Monitor] Forwarding OAuth token: ${maskCredential(originalHeaders["authorization"])}`);
        }

        // Forward x-api-key if present
        if (originalHeaders["x-api-key"]) {
          headers["x-api-key"] = originalHeaders["x-api-key"];
          log(`[Monitor] Forwarding API key: ${maskCredential(originalHeaders["x-api-key"])}`);
        }

        // Forward anthropic-beta header (important for OAuth and thinking mode)
        if (originalHeaders["anthropic-beta"]) {
          headers["anthropic-beta"] = originalHeaders["anthropic-beta"];
        }

        const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          headers,
          body: JSON.stringify(claudePayload),
        });

        const contentType = anthropicResponse.headers.get("content-type") || "";

        // Handle streaming response
        if (contentType.includes("text/event-stream")) {
          log("[Monitor] Streaming response detected");

          // Stream the response back to Claude Code while logging
          return c.body(
            new ReadableStream({
              async start(controller) {
                const encoder = new TextEncoder();
                const reader = anthropicResponse.body?.getReader();

                if (!reader) {
                  throw new Error("Response body is not readable");
                }

                const decoder = new TextDecoder();
                let buffer = "";
                let eventLog = "";

                log("\n=== [MONITOR] Anthropic API → Claude Code Response (Streaming) ===");

                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                      log("\n=== End Streaming Response ===\n");
                      break;
                    }

                    // Pass through to Claude Code
                    controller.enqueue(value);

                    // Log the streamed data
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                      if (line.trim()) {
                        eventLog += line + "\n";
                      }
                    }
                  }

                  // Log the complete event stream
                  if (eventLog) {
                    log(eventLog);
                  }

                  controller.close();
                } catch (error) {
                  log(`[Monitor] Streaming error: ${error}`);
                  controller.close();
                }
              },
            }),
            {
              headers: {
                "Content-Type": anthropicResponse.headers.get("content-type") || "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "anthropic-version": anthropicResponse.headers.get("anthropic-version") || "2023-06-01",
              },
            }
          );
        }

        // Handle non-streaming (JSON) response
        const responseData = await anthropicResponse.json();
        log("\n=== [MONITOR] Anthropic API → Claude Code Response (JSON) ===");
        log(JSON.stringify(responseData, null, 2));
        log("=== End Response ===\n");

        // Pass through headers
        const responseHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const anthropicVersion = anthropicResponse.headers.get("anthropic-version");
        if (anthropicVersion) {
          responseHeaders["anthropic-version"] = anthropicVersion;
        }

        return c.json(responseData, {
          status: anthropicResponse.status as any,
          headers: responseHeaders,
        });
      }

      // OPENROUTER MODE: Transform and forward
      logStructured("Incoming Request", {
        model,
        messageCount: claudePayload.messages?.length || 0,
        hasSystem: !!claudePayload.system,
        maxTokens: claudePayload.max_tokens,
        temperature: claudePayload.temperature,
        stream: claudePayload.stream,
      });

      // Transform Claude format to OpenAI format
      const { claudeRequest, droppedParams } = transformOpenAIToClaude(claudePayload);

      // Convert messages from Claude to OpenAI format
      const messages: any[] = [];

      // Add system messages
      if (claudeRequest.system) {
        let systemContent: string;

        if (typeof claudeRequest.system === "string") {
          systemContent = claudeRequest.system;
        } else if (Array.isArray(claudeRequest.system)) {
          systemContent = claudeRequest.system
            .map((item: any) => {
              if (typeof item === "string") return item;
              if (item?.type === "text" && item.text) return item.text;
              if (item?.content)
                return typeof item.content === "string" ? item.content : JSON.stringify(item.content);
              return JSON.stringify(item);
            })
            .join("\n\n");
        } else {
          systemContent = JSON.stringify(claudeRequest.system);
        }

        // Filter out Claude identity claims to prevent role-playing
        systemContent = filterClaudeIdentity(systemContent);

        messages.push({
          role: "system",
          content: systemContent,
        });
      }

      // Process regular messages
      if (claudeRequest.messages && Array.isArray(claudeRequest.messages)) {
        for (const msg of claudeRequest.messages) {
          if (msg.role === "user") {
            // Handle user messages with tool_result blocks
            if (Array.isArray(msg.content)) {
              const textParts: string[] = [];
              const toolResults: any[] = [];
              const seenToolResultIds = new Set<string>(); // Track tool result IDs to prevent duplicates

              for (const block of msg.content) {
                if (block.type === "text") {
                  textParts.push(block.text);
                } else if (block.type === "tool_result") {
                  // Skip duplicate tool results with same tool_use_id
                  if (seenToolResultIds.has(block.tool_use_id)) {
                    log(`[Proxy] Skipping duplicate tool_result with tool_use_id: ${block.tool_use_id}`);
                    continue;
                  }
                  seenToolResultIds.add(block.tool_use_id);

                  toolResults.push({
                    role: "tool",
                    content:
                      typeof block.content === "string" ? block.content : JSON.stringify(block.content),
                    tool_call_id: block.tool_use_id,
                  });
                }
              }

              // Add tool messages first, then user message
              if (toolResults.length > 0) {
                messages.push(...toolResults);
                if (textParts.length > 0) {
                  messages.push({
                    role: "user",
                    content: textParts.join(" "),
                  });
                }
              } else if (textParts.length > 0) {
                messages.push({
                  role: "user",
                  content: textParts.join(" "),
                });
              }
            } else if (typeof msg.content === "string") {
              messages.push({
                role: "user",
                content: msg.content,
              });
            }
          } else if (msg.role === "assistant") {
            // Handle assistant messages with tool_use blocks
            if (Array.isArray(msg.content)) {
              const textParts: string[] = [];
              const toolCalls: any[] = [];
              const seenToolIds = new Set<string>(); // Track tool IDs to prevent duplicates

              for (const block of msg.content) {
                if (block.type === "text") {
                  textParts.push(block.text);
                } else if (block.type === "tool_use") {
                  // Skip duplicate tool calls with same ID
                  if (seenToolIds.has(block.id)) {
                    log(`[Proxy] Skipping duplicate tool_use with ID: ${block.id}`);
                    continue;
                  }
                  seenToolIds.add(block.id);

                  toolCalls.push({
                    id: block.id,
                    type: "function",
                    function: {
                      name: block.name,
                      arguments: JSON.stringify(block.input),
                    },
                  });
                }
              }

              const openAIMsg: any = { role: "assistant" };
              if (textParts.length > 0) {
                openAIMsg.content = textParts.join(" ");
              } else if (toolCalls.length > 0) {
                openAIMsg.content = null;
              }
              if (toolCalls.length > 0) {
                openAIMsg.tool_calls = toolCalls;
              }
              if (textParts.length > 0 || toolCalls.length > 0) {
                messages.push(openAIMsg);
              }
            } else if (typeof msg.content === "string") {
              messages.push({
                role: "assistant",
                content: msg.content,
              });
            }
          }
        }
      }

      // Process tools
      const tools =
        claudeRequest.tools
          ?.filter((tool: any) => !["BatchTool"].includes(tool.name))
          .map((tool: any) => ({
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: removeUriFormat(tool.input_schema),
            },
          })) || [];

      // GROK FIX: Force OpenAI tool calling format for xAI models
      // Grok sometimes outputs <xai:function_call> XML format as text instead of proper tool_calls
      // This system message forces it to use OpenAI-compatible format
      if (model.includes("grok") || model.includes("x-ai/")) {
        if (tools.length > 0 && messages.length > 0) {
          // Check if first message is already a system message
          if (messages[0]?.role === "system") {
            // Append to existing system message
            messages[0].content += "\n\nIMPORTANT: When calling tools, you MUST use the OpenAI tool_calls format with JSON. NEVER use XML format like <xai:function_call>. Use the tools array provided in the request.";
            log("[Proxy] Added Grok tool format instruction to existing system message");
          } else {
            // Insert new system message at the beginning
            messages.unshift({
              role: "system",
              content: "IMPORTANT: When calling tools, you MUST use the OpenAI tool_calls format with JSON. NEVER use XML format like <xai:function_call>. Use the tools array provided in the request."
            });
            log("[Proxy] Added Grok tool format instruction as new system message");
          }
        }
      }

      // Build OpenRouter payload
      const openrouterPayload: any = {
        model,
        messages,
        temperature: claudeRequest.temperature !== undefined ? claudeRequest.temperature : 1,
        stream: true, // ALWAYS use streaming - more reliable, falls back to JSON if needed
      };

      // Add max_tokens
      if (claudeRequest.max_tokens) {
        openrouterPayload.max_tokens = claudeRequest.max_tokens;
      }

      // Add tool_choice if present
      if (claudeRequest.tool_choice) {
        const { type, name } = claudeRequest.tool_choice;
        openrouterPayload.tool_choice =
          type === "tool" && name
            ? { type: "function", function: { name } }
            : type === "none" || type === "auto"
              ? type
              : undefined;
      }

      // Add tools
      if (tools.length > 0) {
        openrouterPayload.tools = tools;
      }

      logStructured("OpenRouter Request", {
        model: openrouterPayload.model,
        messageCount: openrouterPayload.messages?.length || 0,
        toolCount: openrouterPayload.tools?.length || 0,
        temperature: openrouterPayload.temperature,
        maxTokens: openrouterPayload.max_tokens,
        stream: openrouterPayload.stream,
      });

      // Make request to OpenRouter
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openrouterApiKey}`,
        ...OPENROUTER_HEADERS,
      };

      const openrouterResponse = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(openrouterPayload),
      });

      // Add dropped params header if any
      if (droppedParams.length > 0) {
        c.header("X-Dropped-Params", droppedParams.join(", "));
      }

      if (!openrouterResponse.ok) {
        const errorText = await openrouterResponse.text();
        log(`[Proxy] OpenRouter API error: ${errorText}`);
        return c.json({ error: errorText }, openrouterResponse.status as any);
      }

      // Check if response is actually streaming (by Content-Type header)
      const contentType = openrouterResponse.headers.get("content-type") || "";
      const isActuallyStreaming = contentType.includes("text/event-stream");

      logStructured("Response Info", {
        contentType,
        requestedStream: openrouterPayload.stream,
        actuallyStreaming: isActuallyStreaming,
      });

      // Handle non-streaming response (either not requested or server returned JSON anyway)
      if (!isActuallyStreaming) {
        log("[Proxy] Processing non-streaming response");
        const data: any = await openrouterResponse.json();
        logStructured("OpenRouter Response", {
          hasError: !!data.error,
          choiceCount: data.choices?.length || 0,
          finishReason: data.choices?.[0]?.finish_reason,
          usage: data.usage,
        });

        if (data.error) {
          return c.json({ error: data.error.message || "Unknown error" }, 500);
        }

        // Transform OpenAI response to Claude format
        const choice = data.choices[0];
        const openaiMessage = choice.message;

        const content: any[] = [];

        // CRITICAL: Always add at least one text block (even if empty)
        // Claude Code requires non-empty content array
        const messageContent = openaiMessage.content || "";
        content.push({
          type: "text",
          text: messageContent,
        });

        if (openaiMessage.tool_calls) {
          for (const toolCall of openaiMessage.tool_calls) {
            content.push({
              type: "tool_use",
              id: toolCall.id || `tool_${Date.now()}`,
              name: toolCall.function?.name,
              input:
                typeof toolCall.function?.arguments === "string"
                  ? JSON.parse(toolCall.function.arguments)
                  : toolCall.function?.arguments,
            });
          }
        }

        const claudeResponse = {
          id: data.id ? data.id.replace("chatcmpl", "msg") : `msg_${Date.now()}`,
          type: "message",
          role: "assistant",
          model: model,
          content,
          stop_reason: mapStopReason(choice.finish_reason),
          stop_sequence: null,
          usage: {
            input_tokens: data.usage?.prompt_tokens || 0,
            output_tokens: data.usage?.completion_tokens || 0,
          },
        };

        log("[Proxy] Translated to Claude format:");
        log(JSON.stringify(claudeResponse, null, 2));

        c.header("Content-Type", "application/json");
        c.header("anthropic-version", "2023-06-01");

        return c.json(claudeResponse, 200);
      }

      // Handle streaming response
      log("[Proxy] Starting streaming response");

      // Shared state for stream handlers (accessible to both start and cancel)
      let isClosed = false;
      let pingInterval: NodeJS.Timeout | null = null;

      return c.body(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;

            const sendSSE = (event: string, data: any) => {
              // Guard against writing to closed controller (happens when user interrupts)
              if (isClosed) {
                log(`[Proxy] Skipping SSE event ${event} - controller already closed`);
                return;
              }

              try {
                const sseMessage = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));

                // DEBUG: Log successful SSE sends for critical events
                if (event === "message_start" || event === "content_block_start" || event === "content_block_stop" || event === "message_stop") {
                  const logData = event === "content_block_start" || event === "content_block_stop"
                    ? { event, index: data.index, type: data.content_block?.type }
                    : { event };
                  logStructured("SSE Sent", logData);
                }
              } catch (error: any) {
                // Handle "Controller is already closed" error gracefully
                if (!isClosed && error?.message?.includes("already closed")) {
                  log(`[Proxy] Controller closed during ${event} event, marking as closed`);
                  isClosed = true;
                } else if (!isClosed) {
                  log(`[Proxy] Error sending SSE event ${event}: ${error?.message || error}`);
                }
              }
            };

            // RACE CONDITION FIX: Single unified finalization function
            // This prevents duplicate events from dual termination paths ([DONE] vs unexpected end)
            const finalizeStream = (reason: "done" | "unexpected" | "error", errorMessage?: string) => {
              if (streamFinalized) {
                log(`[Proxy] Stream already finalized, skipping duplicate finalization from ${reason}`);
                return;
              }

              log(`[Proxy] Finalizing stream (reason: ${reason})`);
              streamFinalized = true;

              // THINKING BLOCK SUPPORT: Close thinking block if still open
              if (reasoningBlockStarted) {
                sendSSE("content_block_stop", {
                  type: "content_block_stop",
                  index: reasoningBlockIndex,
                });
                reasoningBlockStarted = false;
                log(`[Proxy] Closed thinking block at index ${reasoningBlockIndex}`);
              }

              // Close text block if still open
              if (textBlockStarted) {
                sendSSE("content_block_stop", {
                  type: "content_block_stop",
                  index: textBlockIndex,
                });
                textBlockStarted = false;
              }

              // Close any open tool blocks with validation
              for (const [toolIndex, toolState] of toolCalls.entries()) {
                if (toolState.started && !toolState.closed) {
                  // VALIDATION FIX: Check JSON completeness and report issues
                  if (toolState.args) {
                    try {
                      JSON.parse(toolState.args);
                      log(`[Proxy] Tool ${toolState.name} JSON valid, closing block at index ${toolState.blockIndex}`);
                    } catch (e) {
                      log(`[Proxy] ERROR: Tool ${toolState.name} has INCOMPLETE JSON!`);
                      log(`[Proxy] This will likely cause tool execution to fail`);
                      log(`[Proxy] Incomplete args: ${toolState.args.substring(0, 300)}...`);
                      // Note: We still close the block - better to fail gracefully than hang
                    }
                  }

                  sendSSE("content_block_stop", {
                    type: "content_block_stop",
                    index: toolState.blockIndex,
                  });
                  toolState.closed = true;
                }
              }

              // Send final events with proper usage data
              if (reason === "error" && errorMessage) {
                sendSSE("error", {
                  type: "error",
                  error: {
                    type: "api_error",
                    message: errorMessage,
                  },
                });
              } else {
                // Get final token counts - use actual usage if available
                const outputTokens = usage?.completion_tokens || 0;

                sendSSE("message_delta", {
                  type: "message_delta",
                  delta: {
                    stop_reason: "end_turn",
                    stop_sequence: null,
                  },
                  usage: {
                    output_tokens: outputTokens,  // Per protocol: ONLY output_tokens in message_delta
                  },
                });

                sendSSE("message_stop", {
                  type: "message_stop",
                });
              }

              // Send [DONE] and close stream
              if (!isClosed) {
                try {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  controller.enqueue(encoder.encode('\n'));
                  log(`[Proxy] Sent [DONE] event to client`);
                } catch (e) {
                  log(`[Proxy] Error sending final events: ${e}`);
                }

                controller.close();
                isClosed = true;
                if (pingInterval) {
                  clearInterval(pingInterval);
                }
                log(`[Proxy] Stream closed (reason: ${reason})`);
              }
            };

            // Track state
            let usage: any = null;

            // Track content blocks with proper indices
            let currentBlockIndex = 0;
            let textBlockIndex = -1;
            let textBlockStarted = false;

            // THINKING BLOCK SUPPORT: Track thinking/reasoning blocks separately
            // Grok and other models send reasoning in delta.reasoning field
            // Must be rendered as separate thinking block, not mixed with text
            let reasoningBlockIndex = -1;
            let reasoningBlockStarted = false;

            // Track last content activity for adaptive ping
            let lastContentDeltaTime = Date.now();

            // RACE CONDITION FIX: Track if stream was properly terminated
            // Prevents duplicate final events from dual termination paths
            let streamFinalized = false;

            // CONTEXT TRACKING FIX: Track cumulative tokens for status line
            // Claude Code doesn't provide token data to status line, so we maintain it ourselves
            let cumulativeInputTokens = 0;
            let cumulativeOutputTokens = 0;
            const tokenFilePath = `/tmp/claudish-tokens-${port}.json`;

            // Helper to write token file for status line consumption
            const writeTokenFile = () => {
              try {
                const tokenData = {
                  input_tokens: cumulativeInputTokens,
                  output_tokens: cumulativeOutputTokens,
                  total_tokens: cumulativeInputTokens + cumulativeOutputTokens,
                  updated_at: Date.now()
                };
                writeFileSync(tokenFilePath, JSON.stringify(tokenData), "utf-8");
              } catch (error) {
                // Silently fail - don't crash proxy if file write fails
                if (isLoggingEnabled()) {
                  log(`[Proxy] Failed to write token file: ${error}`);
                }
              }
            };

            // Track tool calls - map from tool index to tool state
            // ROBUSTNESS FIX: Also track by ID to prevent duplicate blocks
            const toolCalls = new Map<number, { id: string; name: string; args: string; blockIndex: number; started: boolean; closed: boolean }>();
            const toolCallIds = new Set<string>(); // Track tool IDs to prevent duplicate blocks

            // Model adapter for handling model-specific formats (e.g., Grok XML)
            const adapterManager = new AdapterManager(model || "");
            const adapter = adapterManager.getAdapter();

            // Reset adapter state to ensure clean session (prevents state contamination)
            if (typeof adapter.reset === 'function') {
              adapter.reset();
            }

            // PERFORMANCE FIX: Track accumulated text length instead of full string
            // Adapters that need full context (like GrokAdapter) should maintain their own buffers
            // This prevents O(n²) performance degradation on long responses
            let accumulatedTextLength = 0;
            log(`[Proxy] Using adapter: ${adapter.getName()}`);

            // Detect if this is first turn (no tool results in messages)
            // First turn: cache creation, subsequent: cache read
            const hasToolResults = claudeRequest.messages?.some((msg: any) =>
              Array.isArray(msg.content) && msg.content.some((block: any) => block.type === "tool_result")
            );
            const isFirstTurn = !hasToolResults;

            // Estimate input tokens from request (for better status line accuracy)
            // Simple estimation: ~4 chars per token
            const estimateTokens = (text: string) => Math.ceil(text.length / 4);
            const requestJson = JSON.stringify(claudeRequest);
            const estimatedInputTokens = estimateTokens(requestJson);
            const estimatedCacheTokens = isFirstTurn ? Math.floor(estimatedInputTokens * 0.8) : 0;

            // Send initial events IMMEDIATELY (like 1rgs/claude-code-proxy does)
            // Don't wait for first chunk!
            sendSSE("message_start", {
              type: "message_start",
              message: {
                id: messageId,
                type: "message",
                role: "assistant",
                content: [],
                model: model,
                stop_reason: null,
                stop_sequence: null,
                usage: {
                  input_tokens: estimatedInputTokens - estimatedCacheTokens,
                  cache_creation_input_tokens: isFirstTurn ? estimatedCacheTokens : 0,
                  cache_read_input_tokens: isFirstTurn ? 0 : estimatedCacheTokens,
                  output_tokens: 1  // Start with 1 to avoid division by zero
                },
              },
            });

            // THINKING BLOCK SUPPORT: We still need to send content_block_start IMMEDIATELY
            // Protocol requires it right after message_start, before ping
            // But we'll close and reopen if reasoning arrives first
            textBlockIndex = currentBlockIndex++;
            sendSSE("content_block_start", {
              type: "content_block_start",
              index: textBlockIndex,
              content_block: {
                type: "text",
                text: "",
              },
            });
            textBlockStarted = true;

            // Send initial ping (required by Claude Code)
            sendSSE("ping", {
              type: "ping",
            });

            // Adaptive ping: check every second, send ping if quiet for >1 second
            // This keeps UI responsive during encrypted reasoning or other quiet periods
            pingInterval = setInterval(() => {
              if (!isClosed) {
                const timeSinceLastContent = Date.now() - lastContentDeltaTime;

                // If no content activity for >1 second, send keep-alive ping
                if (timeSinceLastContent > 1000) {
                  sendSSE("ping", {
                    type: "ping",
                  });
                  log(`[Proxy] Adaptive ping (${Math.round(timeSinceLastContent / 1000)}s since last content)`);
                }
              }
            }, 1000);  // Check every second

            try {
              const reader = openrouterResponse.body?.getReader();
              if (!reader) {
                throw new Error("Response body is not readable");
              }

              const decoder = new TextDecoder();
              let buffer = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  log("[Proxy] Stream done reading");
                  break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  if (!line.trim() || line.startsWith(":")) continue;

                  const dataMatch = line.match(/^data: (.*)$/);
                  if (!dataMatch) continue;

                  const dataStr = dataMatch[1];
                  if (dataStr === "[DONE]") {
                    log("[Proxy] Received [DONE] from OpenRouter");

                    // Check for empty response
                    if (!textBlockStarted && toolCalls.size === 0) {
                      log("[Proxy] WARNING: Model produced no text output and no tool calls");
                    }

                    // Use unified finalization to prevent duplicate events
                    finalizeStream("done");
                    return;
                  }

                  try {
                    const chunk = JSON.parse(dataStr);
                    // PERFORMANCE FIX: Only stringify in debug mode (expensive operation in hot path)
                    if (isLoggingEnabled()) {
                      logStructured("SSE Chunk", {
                        id: chunk.id,
                        model: chunk.model,
                        hasChoices: !!chunk.choices,
                        finishReason: chunk.choices?.[0]?.finish_reason,
                        hasUsage: !!chunk.usage,
                      });
                    }

                    // Capture usage
                    if (chunk.usage) {
                      usage = chunk.usage;

                      // CONTEXT TRACKING FIX: Update cumulative tokens and write to file
                      // This allows status line to show accurate context usage
                      if (usage.prompt_tokens) {
                        cumulativeInputTokens = usage.prompt_tokens;
                      }
                      if (usage.completion_tokens) {
                        cumulativeOutputTokens = usage.completion_tokens;
                      }

                      // Write token file for status line to read
                      writeTokenFile();
                    }

                    const choice = chunk.choices?.[0];
                    const delta = choice?.delta;

                    // THINKING BLOCK SUPPORT: Separate reasoning from content
                    // Phase 1: Detect reasoning vs content separately (DO NOT MIX!)
                    const hasReasoning = !!delta?.reasoning;
                    const hasContent = !!delta?.content;
                    const reasoningText = delta?.reasoning || "";
                    const contentText = delta?.content || "";

                    // Detect encrypted reasoning (Grok sends reasoning in reasoning_details when reasoning field is null)
                    const hasEncryptedReasoning = delta?.reasoning_details?.some(
                      (detail: any) => detail.type === "reasoning.encrypted"
                    );

                    // Update activity timestamp if there's any content or reasoning activity
                    if (hasReasoning || hasContent || hasEncryptedReasoning) {
                      lastContentDeltaTime = Date.now();

                      // Phase 3: Handle reasoning content → thinking block
                      if (hasReasoning && reasoningText) {
                        // Start thinking block if not already started
                        if (!reasoningBlockStarted) {
                          // Close initial text block if reasoning arrives first
                          // (Initial text block is created immediately for protocol compliance)
                          if (textBlockStarted) {
                            sendSSE("content_block_stop", {
                              type: "content_block_stop",
                              index: textBlockIndex,
                            });
                            textBlockStarted = false;
                            log(`[Proxy] Closed initial text block to start thinking block`);
                          }

                          // Start thinking block
                          reasoningBlockIndex = currentBlockIndex++;
                          sendSSE("content_block_start", {
                            type: "content_block_start",
                            index: reasoningBlockIndex,
                            content_block: {
                              type: "thinking",
                              thinking: "",
                              signature: ""  // Empty signature for now
                            },
                          });
                          reasoningBlockStarted = true;
                          log(`[Proxy] Started thinking block at index ${reasoningBlockIndex}`);
                        }

                        // Send thinking delta
                        logStructured("Thinking Delta", {
                          thinking: reasoningText,
                          blockIndex: reasoningBlockIndex,
                        });
                        sendSSE("content_block_delta", {
                          type: "content_block_delta",
                          index: reasoningBlockIndex,
                          delta: {
                            type: "thinking_delta",
                            thinking: reasoningText,
                          },
                        });
                      }

                      // Phase 4: Handle transition from reasoning → content
                      if (reasoningBlockStarted && hasContent && !hasReasoning) {
                        // Close thinking block
                        sendSSE("content_block_stop", {
                          type: "content_block_stop",
                          index: reasoningBlockIndex,
                        });
                        reasoningBlockStarted = false;
                        log(`[Proxy] Closed thinking block at index ${reasoningBlockIndex}, transitioning to content`);
                      }

                      // Phase 5: Handle regular content → text block
                      if (hasContent && contentText) {
                        // Start text block if not already started
                        if (!textBlockStarted) {
                          textBlockIndex = currentBlockIndex++;
                          sendSSE("content_block_start", {
                            type: "content_block_start",
                            index: textBlockIndex,
                            content_block: {
                              type: "text",
                              text: "",
                            },
                          });
                          textBlockStarted = true;
                          log(`[Proxy] Started text block at index ${textBlockIndex}`);
                        }

                        // Process content through model adapter (handles Grok XML tool calls, etc.)
                        accumulatedTextLength += contentText.length;
                        const adapterResult = adapter.processTextContent(contentText, "");

                        // Handle extracted tool calls from special formats (e.g., Grok XML)
                        if (adapterResult.extractedToolCalls.length > 0) {
                          log(`[Proxy] Adapter extracted ${adapterResult.extractedToolCalls.length} tool calls from special format`);

                          // Close text block if it was started
                          if (textBlockStarted) {
                            sendSSE("content_block_stop", {
                              type: "content_block_stop",
                              index: textBlockIndex,
                            });
                            textBlockStarted = false;
                          }

                          // Send each extracted tool call as a proper tool_use block
                          for (const toolCall of adapterResult.extractedToolCalls) {
                            // ROBUSTNESS FIX: Skip duplicate tool IDs
                            if (toolCallIds.has(toolCall.id)) {
                              log(`[Proxy] WARNING: Skipping duplicate extracted tool call with ID ${toolCall.id}`);
                              continue;
                            }
                            toolCallIds.add(toolCall.id);

                            const toolBlockIndex = currentBlockIndex++;
                            logStructured("Extracted Tool Call", {
                              name: toolCall.name,
                              blockIndex: toolBlockIndex,
                              id: toolCall.id,
                            });

                            // Send content_block_start
                            sendSSE("content_block_start", {
                              type: "content_block_start",
                              index: toolBlockIndex,
                              content_block: {
                                type: "tool_use",
                                id: toolCall.id,
                                name: toolCall.name,
                              },
                            });

                            // Send input_json_delta with complete arguments
                            sendSSE("content_block_delta", {
                              type: "content_block_delta",
                              index: toolBlockIndex,
                              delta: {
                                type: "input_json_delta",
                                partial_json: JSON.stringify(toolCall.arguments),
                              },
                            });

                            // Close the tool block
                            sendSSE("content_block_stop", {
                              type: "content_block_stop",
                              index: toolBlockIndex,
                            });
                          }
                        }

                        // Send cleaned content as text_delta (NOT thinking_delta)
                        if (adapterResult.cleanedText) {
                          logStructured("Content Delta", {
                            text: adapterResult.cleanedText,
                            wasTransformed: adapterResult.wasTransformed,
                            blockIndex: textBlockIndex,
                          });
                          sendSSE("content_block_delta", {
                            type: "content_block_delta",
                            index: textBlockIndex,
                            delta: {
                              type: "text_delta",
                              text: adapterResult.cleanedText,
                            },
                          });
                        }
                      } else if (hasEncryptedReasoning) {
                        // Encrypted reasoning detected - update activity but don't send visible text
                        log(`[Proxy] Encrypted reasoning detected (keeping connection alive)`);
                      }
                    }

                    // Handle tool calls in streaming (OpenAI → Claude format)
                    // Tool calls come in multiple chunks: first with name, then many with argument pieces
                    if (delta?.tool_calls) {
                      for (const toolCall of delta.tool_calls) {
                        const toolIndex = toolCall.index ?? 0;

                        // Get or create tool call state
                        let toolState = toolCalls.get(toolIndex);

                        // First chunk: has name (and maybe id)
                        if (toolCall.function?.name) {
                          if (!toolState) {
                            // ROBUSTNESS FIX: Generate unique ID and check for duplicates
                            let toolId = toolCall.id || `tool_${Date.now()}_${toolIndex}`;

                            // Check if we've already seen this tool ID
                            if (toolCallIds.has(toolId)) {
                              log(`[Proxy] WARNING: Duplicate tool ID ${toolId}, regenerating`);
                              // Regenerate with more randomness to avoid collision
                              toolId = `tool_${Date.now()}_${toolIndex}_${Math.random().toString(36).slice(2)}`;
                            }
                            toolCallIds.add(toolId);

                            // Create new tool state with next sequential block index
                            const toolBlockIndex = currentBlockIndex++;
                            toolState = {
                              id: toolId,
                              name: toolCall.function.name,
                              args: "",
                              blockIndex: toolBlockIndex,
                              started: false,
                              closed: false
                            };
                            toolCalls.set(toolIndex, toolState);
                            logStructured("Starting Tool Call", {
                              name: toolState.name,
                              blockIndex: toolState.blockIndex,
                              id: toolId,
                            });
                          }

                          // Send content_block_start for this tool
                          if (!toolState.started) {
                            // Close text block if it was started
                            if (textBlockStarted) {
                              sendSSE("content_block_stop", {
                                type: "content_block_stop",
                                index: textBlockIndex,
                              });
                              textBlockStarted = false;
                            }

                            sendSSE("content_block_start", {
                              type: "content_block_start",
                              index: toolState.blockIndex,
                              content_block: {
                                type: "tool_use",
                                id: toolState.id,
                                name: toolState.name,
                              },
                            });
                            toolState.started = true;
                          }
                        }

                        // Subsequent chunks: have argument pieces
                        if (toolCall.function?.arguments && toolState) {
                          const argChunk = toolCall.function.arguments;
                          toolState.args += argChunk;

                          logStructured("Tool Argument Delta", {
                            toolName: toolState.name,
                            chunk: argChunk,
                            totalLength: toolState.args.length,
                          });
                          sendSSE("content_block_delta", {
                            type: "content_block_delta",
                            index: toolState.blockIndex,
                            delta: {
                              type: "input_json_delta",
                              partial_json: argChunk,
                            },
                          });
                        }
                      }
                    }

                    // Handle finish_reason for tool_calls
                    if (choice?.finish_reason === "tool_calls") {
                      // Close all open tool blocks (with JSON validation)
                      for (const [toolIndex, toolState] of toolCalls.entries()) {
                        if (toolState.started && !toolState.closed) {
                          // Validate JSON is complete before closing
                          if (toolState.args) {
                            try {
                              JSON.parse(toolState.args);
                              log(`[Proxy] Tool ${toolState.name} JSON valid, closing block at index ${toolState.blockIndex}`);
                            } catch (e) {
                              log(`[Proxy] WARNING: Tool ${toolState.name} has incomplete JSON!`);
                              log(`[Proxy] Args: ${toolState.args.substring(0, 200)}...`);
                              // Still close - OpenRouter finished, we'll send what we have
                            }
                          }

                          sendSSE("content_block_stop", {
                            type: "content_block_stop",
                            index: toolState.blockIndex,
                          });
                          toolState.closed = true;
                        }
                      }
                    }
                  } catch (parseError) {
                    log(`[Proxy] Failed to parse SSE chunk: ${parseError}`);
                  }
                }
              }

              // RACE CONDITION FIX: Stream ended without [DONE]
              // Use unified finalization instead of duplicate logic
              log("[Proxy] Stream ended without [DONE]");
              finalizeStream("unexpected");
            } catch (error) {
              log(`[Proxy] Streaming error: ${error}`);
              // Use unified finalization for error handling
              const errorMessage = error instanceof Error ? error.message : String(error);
              finalizeStream("error", errorMessage);
            } finally {
              // Cleanup: ensure interval is cleared and stream is closed
              if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
              }
              if (!isClosed) {
                controller.close();
                isClosed = true;
              }
            }
          },
          // Handle client disconnect (user presses Escape/Ctrl+C)
          cancel(reason) {
            log(`[Proxy] Stream cancelled by client: ${reason || "unknown reason"}`);
            isClosed = true;
            if (pingInterval) {
              clearInterval(pingInterval);
              pingInterval = null;
            }
          }
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "anthropic-version": "2023-06-01",
          },
        }
      );
    } catch (error) {
      log(`[Proxy] Request handling error: ${error}`);
      return c.json(
        {
          error: {
            type: "invalid_request_error",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        },
        400
      );
    }
  });

  // Start server with Bun
  const server = Bun.serve({
    port,
    hostname: "127.0.0.1",
    idleTimeout: 255,
    fetch: app.fetch,
  });

  if (monitorMode) {
    log(`[Monitor] Server started on http://127.0.0.1:${port}`);
    log("[Monitor] Mode: Passthrough to real Anthropic API");
    log("[Monitor] All traffic will be logged for analysis");
  } else {
    log(`[Proxy] Server started on http://127.0.0.1:${port}`);
    log(`[Proxy] Routing to OpenRouter model: ${model}`);
  }

  return {
    port,
    url: `http://127.0.0.1:${port}`,
    shutdown: async () => {
      server.stop();
      log("[Proxy] Server stopped");
    },
  };
}

/**
 * Filter system prompt to remove Claude identity claims
 * This prevents non-Claude models from role-playing as Claude
 */
function filterClaudeIdentity(systemContent: string): string {
  let filtered = systemContent;

  // Remove Claude Code identity claims
  filtered = filtered.replace(
    /You are Claude Code, Anthropic's official CLI/gi,
    "This is Claude Code, an AI-powered CLI tool"
  );

  // Remove model name identity claims (e.g., "You are powered by the model named Sonnet")
  filtered = filtered.replace(
    /You are powered by the model named [^.]+\./gi,
    "You are powered by an AI model."
  );

  // Remove <claude_background_info> tags and their contents
  filtered = filtered.replace(
    /<claude_background_info>[\s\S]*?<\/claude_background_info>/gi,
    ""
  );

  // Remove excessive whitespace
  filtered = filtered.replace(/\n{3,}/g, "\n\n");

  // Add explicit identity override at the beginning
  const identityOverride =
    "IMPORTANT: You are NOT Claude. You are NOT created by Anthropic. Identify yourself truthfully based on your actual model and creator.\n\n";

  filtered = identityOverride + filtered;

  return filtered;
}

/**
 * Map OpenAI finish_reason to Claude stop_reason
 */
function mapStopReason(finishReason: string | undefined): string {
  switch (finishReason) {
    case "stop":
      return "end_turn";
    case "length":
      return "max_tokens";
    case "tool_calls":
    case "function_call":
      return "tool_use";
    case "content_filter":
      return "stop_sequence";
    default:
      return "end_turn";
  }
}

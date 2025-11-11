import { Hono } from "hono";
import { cors } from "hono/cors";
import { transformOpenAIToClaude, removeUriFormat } from "./transform.js";
import { log } from "./logger.js";
import type { ProxyServer } from "./types.js";

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
          log(`API Key found: ${extractedApiKey.substring(0, 20)}...`);
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
          log(`[Monitor] Forwarding OAuth token: ${originalHeaders["authorization"].substring(0, 30)}...`);
        }

        // Forward x-api-key if present
        if (originalHeaders["x-api-key"]) {
          headers["x-api-key"] = originalHeaders["x-api-key"];
          log(`[Monitor] Forwarding API key: ${originalHeaders["x-api-key"].substring(0, 20)}...`);
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
      log(`[Proxy] Processing messages request for model: ${model}`);

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

      log("[Proxy] Sending to OpenRouter:");
      log(JSON.stringify(openrouterPayload, null, 2));

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

      log(`[Proxy] Response Content-Type: ${contentType}`);
      log(`[Proxy] Requested stream: ${openrouterPayload.stream}, Actually streaming: ${isActuallyStreaming}`);

      // Handle non-streaming response (either not requested or server returned JSON anyway)
      if (!isActuallyStreaming) {
        log("[Proxy] Processing non-streaming response");
        const data: any = await openrouterResponse.json();
        log("[Proxy] Received from OpenRouter:");
        log(JSON.stringify(data, null, 2));

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
      return c.body(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;

            const sendSSE = (event: string, data: any) => {
              const sseMessage = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
              controller.enqueue(encoder.encode(sseMessage));
            };

            // Track state
            let usage: any = null;
            let isClosed = false;

            // Track content blocks with proper indices
            let currentBlockIndex = 0;
            let textBlockIndex = -1;
            let textBlockStarted = false;

            // Track tool calls - map from tool index to tool state
            const toolCalls = new Map<number, { id: string; name: string; args: string; blockIndex: number; started: boolean; closed: boolean }>();

            // Detect if this is first turn (no tool results in messages)
            // First turn: cache creation, subsequent: cache read
            const hasToolResults = claudeRequest.messages?.some((msg: any) =>
              Array.isArray(msg.content) && msg.content.some((block: any) => block.type === "tool_result")
            );
            const isFirstTurn = !hasToolResults;

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
                  input_tokens: 0,
                  cache_creation_input_tokens: 0,
                  cache_read_input_tokens: 0,
                  output_tokens: 0
                },
              },
            });

            // Send content_block_start immediately (for index 0 text block)
            // Claude Code expects this IMMEDIATELY after message_start
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

            // Send ping every 15 seconds to keep connection alive
            const pingInterval = setInterval(() => {
              if (!isClosed) {
                sendSSE("ping", {
                  type: "ping",
                });
              }
            }, 15000);

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

                    // Finalize the stream
                    if (!textBlockStarted && toolCalls.size === 0) {
                      log("[Proxy] WARNING: Model produced no text output and no tool calls");
                    }

                    // Close text block if still open
                    if (textBlockStarted) {
                      sendSSE("content_block_stop", {
                        type: "content_block_stop",
                        index: textBlockIndex,
                      });
                      textBlockStarted = false;
                    }

                    // Close any open tool blocks (with JSON validation)
                    for (const [toolIndex, toolState] of toolCalls.entries()) {
                      if (toolState.started && !toolState.closed) {
                        // Validate JSON is complete
                        if (toolState.args) {
                          try {
                            JSON.parse(toolState.args);
                            log(`[Proxy] Tool ${toolState.name} JSON valid, closing from [DONE] at index ${toolState.blockIndex}`);
                          } catch (e) {
                            log(`[Proxy] WARNING: Tool ${toolState.name} has incomplete JSON at [DONE]!`);
                            log(`[Proxy] Args: ${toolState.args.substring(0, 200)}...`);
                          }
                        }

                        sendSSE("content_block_stop", {
                          type: "content_block_stop",
                          index: toolState.blockIndex,
                        });
                        toolState.closed = true;
                      }
                    }

                    // Calculate cache metrics
                    const inputTokens = usage?.prompt_tokens || 0;
                    const outputTokens = usage?.completion_tokens || 0;

                    // Estimate: 80% of input tokens go to/from cache
                    const estimatedCacheTokens = Math.floor(inputTokens * 0.8);

                    sendSSE("message_delta", {
                      type: "message_delta",
                      delta: {
                        stop_reason: "end_turn",
                        stop_sequence: null,
                      },
                      usage: {
                        input_tokens: inputTokens,
                        output_tokens: outputTokens,
                        // First turn: create cache, subsequent: read from cache
                        cache_creation_input_tokens: isFirstTurn ? estimatedCacheTokens : 0,
                        cache_read_input_tokens: isFirstTurn ? 0 : estimatedCacheTokens,
                      },
                    });

                    sendSSE("message_stop", {
                      type: "message_stop",
                    });

                    // Send [DONE] event (like Python proxy does)
                    if (!isClosed) {
                      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                      log("[Proxy] Sent [DONE] event to client");
                    }

                    // Send explicit end signal and close
                    if (!isClosed) {
                      controller.enqueue(encoder.encode('\n'));
                      controller.close();
                      isClosed = true;
                      clearInterval(pingInterval);
                      log("[Proxy] Stream closed properly");
                    }
                    return;
                  }

                  try {
                    const chunk = JSON.parse(dataStr);
                    log(`[Proxy] SSE chunk: ${JSON.stringify(chunk)}`);

                    // Capture usage
                    if (chunk.usage) {
                      usage = chunk.usage;
                    }

                    const choice = chunk.choices?.[0];
                    const delta = choice?.delta;

                    // Send content deltas (text block already started in initial events)
                    // Support both regular content and reasoning field (Grok, o1, etc.)
                    const textContent = delta?.content || delta?.reasoning || "";
                    if (textContent) {
                      log(`[Proxy] Sending content delta: ${textContent}${delta?.reasoning ? ' (reasoning)' : ''}`);
                      sendSSE("content_block_delta", {
                        type: "content_block_delta",
                        index: textBlockIndex,
                        delta: {
                          type: "text_delta",
                          text: textContent,
                        },
                      });
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
                            // Create new tool state with next sequential block index
                            const toolBlockIndex = currentBlockIndex++;
                            toolState = {
                              id: toolCall.id || `tool_${Date.now()}_${toolIndex}`,
                              name: toolCall.function.name,
                              args: "",
                              blockIndex: toolBlockIndex,
                              started: false,
                              closed: false
                            };
                            toolCalls.set(toolIndex, toolState);
                            log(`[Proxy] Starting tool call: ${toolState.name} at block index ${toolState.blockIndex}`);
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

                          log(`[Proxy] Tool argument delta: ${argChunk}`);
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

              // If we reach here without [DONE], stream ended unexpectedly
              log("[Proxy] Stream ended without [DONE], sending final events");
              if (textBlockStarted) {
                sendSSE("content_block_stop", {
                  type: "content_block_stop",
                  index: textBlockIndex,
                });
                textBlockStarted = false;
              }

              // Calculate cache metrics
              const finalInputTokens = usage?.prompt_tokens || 0;
              const finalOutputTokens = usage?.completion_tokens || 0;
              const finalCacheTokens = Math.floor(finalInputTokens * 0.8);

              sendSSE("message_delta", {
                type: "message_delta",
                delta: {
                  stop_reason: "end_turn",
                  stop_sequence: null,
                },
                usage: {
                  input_tokens: finalInputTokens,
                  output_tokens: finalOutputTokens,
                  cache_creation_input_tokens: isFirstTurn ? finalCacheTokens : 0,
                  cache_read_input_tokens: isFirstTurn ? 0 : finalCacheTokens,
                },
              });

              sendSSE("message_stop", {
                type: "message_stop",
              });

              if (!isClosed) {
                controller.enqueue(encoder.encode('\n'));
                controller.close();
                isClosed = true;
                clearInterval(pingInterval);
              }
            } catch (error) {
              log(`[Proxy] Streaming error: ${error}`);
              if (!isClosed) {
                sendSSE("error", {
                  type: "error",
                  error: {
                    type: "api_error",
                    message: error instanceof Error ? error.message : String(error),
                  },
                });
                controller.close();
                isClosed = true;
                clearInterval(pingInterval);
              }
            } finally {
              clearInterval(pingInterval);
              if (!isClosed) {
                controller.close();
                isClosed = true;
              }
            }
          },
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

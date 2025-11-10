import { Hono } from "hono";
import { cors } from "hono/cors";
import { transformOpenAIToClaude, removeUriFormat } from "./transform.js";
import { log } from "./logger.js";
import type { ProxyServer } from "./types.js";

/**
 * Create and start a Hono-based proxy server that translates Anthropic API to OpenRouter
 * Based on claude-code-proxy (https://github.com/kiyo-e/claude-code-proxy)
 * Simplified for OpenRouter usage with our custom model selection
 */
export async function createProxyServer(
  port: number,
  openrouterApiKey: string,
  model: string
): Promise<ProxyServer> {
  const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
  const OPENROUTER_HEADERS = {
    "HTTP-Referer": "https://github.com/MadAppGang/claude-code",
    "X-Title": "Claudish - OpenRouter Proxy",
  };

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
      message: "Claudish proxy server is running",
      config: {
        model,
        port,
        upstream: "OpenRouter",
      },
    });
  });

  // Health check endpoint (alternative)
  app.get("/health", (c) => {
    return c.json({ status: "ok", model, port });
  });

  // Token counting endpoint (Claude Code uses this)
  app.post("/v1/messages/count_tokens", async (c) => {
    try {
      const body = await c.req.json();
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
      log(`[Proxy] Processing messages request for model: ${model}`);
      const claudePayload = await c.req.json();

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

              for (const block of msg.content) {
                if (block.type === "text") {
                  textParts.push(block.text);
                } else if (block.type === "tool_result") {
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

              for (const block of msg.content) {
                if (block.type === "text") {
                  textParts.push(block.text);
                } else if (block.type === "tool_use") {
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
        stream: true, // ALWAYS use streaming - it's more reliable than non-streaming
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
            let textBlockStarted = false;
            let usage: any = null;
            let isClosed = false;

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

            // Send ping (required by Claude Code)
            sendSSE("ping", {
              type: "ping",
            });

            // NOTE: We don't send content_block_start here anymore!
            // We'll send it lazily when we receive the first actual content delta.
            // This prevents Claude Code from seeing an empty text block when models
            // (like Grok) send only reasoning deltas with no text content.

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
                    if (!textBlockStarted) {
                      log("[Proxy] WARNING: Model produced no text output (only reasoning deltas)");
                    }

                    if (textBlockStarted) {
                      sendSSE("content_block_stop", {
                        type: "content_block_stop",
                        index: 0,
                      });
                    }

                    sendSSE("message_delta", {
                      type: "message_delta",
                      delta: {
                        stop_reason: "end_turn",
                        stop_sequence: null,
                      },
                      usage: usage
                        ? {
                            input_tokens: usage.prompt_tokens || 0,
                            output_tokens: usage.completion_tokens || 0,
                          }
                        : {
                            input_tokens: 0,
                            output_tokens: 0,
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

                    // Send content deltas (lazy start text block on first content)
                    if (delta?.content) {
                      // Send content_block_start on first content (lazy initialization)
                      if (!textBlockStarted) {
                        sendSSE("content_block_start", {
                          type: "content_block_start",
                          index: 0,
                          content_block: {
                            type: "text",
                            text: "",
                          },
                        });
                        textBlockStarted = true;
                      }

                      log(`[Proxy] Sending content delta: ${delta.content}`);
                      sendSSE("content_block_delta", {
                        type: "content_block_delta",
                        index: 0,
                        delta: {
                          type: "text_delta",
                          text: delta.content,
                        },
                      });
                    }

                    // Handle tool calls in streaming
                    if (delta?.tool_calls) {
                      for (const toolCall of delta.tool_calls) {
                        if (toolCall.function?.name) {
                          sendSSE("content_block_start", {
                            type: "content_block_start",
                            index: 1,
                            content_block: {
                              type: "tool_use",
                              id: toolCall.id || `tool_${Date.now()}`,
                              name: toolCall.function.name,
                            },
                          });
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
                  index: 0,
                });
              }

              sendSSE("message_delta", {
                type: "message_delta",
                delta: {
                  stop_reason: "end_turn",
                  stop_sequence: null,
                },
                usage: usage
                  ? {
                      input_tokens: usage.prompt_tokens || 0,
                      output_tokens: usage.completion_tokens || 0,
                    }
                  : {
                      input_tokens: 0,
                      output_tokens: 0,
                    },
              });

              sendSSE("message_stop", {
                type: "message_stop",
              });

              if (!isClosed) {
                controller.enqueue(encoder.encode('\n'));
                controller.close();
                isClosed = true;
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
              }
            } finally {
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

  log(`[Proxy] Server started on http://127.0.0.1:${port}`);
  log(`[Proxy] Routing to OpenRouter model: ${model}`);

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

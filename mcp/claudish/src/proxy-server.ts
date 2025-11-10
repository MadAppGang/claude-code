import {
  createStreamHeaders,
  translateAnthropicToOpenRouter,
  translateOpenRouterToAnthropic,
  translateStreamChunk,
} from "./api-translator.js";
import { OPENROUTER_API_URL, OPENROUTER_HEADERS } from "./config.js";
import { log } from "./logger.js";
import type { AnthropicRequest, OpenRouterResponse, ProxyServer } from "./types.js";

/**
 * Create and start a local proxy server that translates Anthropic API to OpenRouter
 */
export async function createProxyServer(
  port: number,
  openrouterApiKey: string,
  model: string
): Promise<ProxyServer> {
  let server: ReturnType<typeof Bun.serve>;

  const serverPromise = new Promise<ReturnType<typeof Bun.serve>>((resolve, reject) => {
    try {
      server = Bun.serve({
        port,
        hostname: "127.0.0.1",
        // Increase timeout for long-running requests (streaming can take a while)
        // Note: Bun.serve max is 255 seconds (~4.25 minutes)
        idleTimeout: 255,
        async fetch(req) {
          const url = new URL(req.url);
          log(`[Proxy] ${req.method} ${url.pathname}`);

          // Handle Anthropic Messages API endpoint
          if (url.pathname === "/v1/messages" && req.method === "POST") {
            return handleMessagesRequest(req, openrouterApiKey, model);
          }

          // Handle token counting endpoint (Claude Code uses this)
          if (url.pathname === "/v1/messages/count_tokens" && req.method === "POST") {
            return handleCountTokensRequest(req);
          }

          // Health check endpoint
          if (url.pathname === "/health" && req.method === "GET") {
            return new Response(JSON.stringify({ status: "ok", model, port }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // CORS preflight
          if (req.method === "OPTIONS") {
            return new Response(null, {
              status: 204,
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "*",
              },
            });
          }

          log(`[Proxy] 404 Not Found: ${req.method} ${url.pathname}`);
          return new Response("Not Found", { status: 404 });
        },
        error(error) {
          log(`[Proxy Error] ${error}`);
          return new Response("Internal Server Error", { status: 500 });
        },
      });

      resolve(server);
    } catch (error) {
      reject(error);
    }
  });

  server = await serverPromise;

  log(`[Proxy] Server started on http://127.0.0.1:${port}`);
  log(`[Proxy] Routing to OpenRouter model: ${model}`);

  return {
    port,
    url: `http://127.0.0.1:${port}`,
    shutdown: async () => {
      server.stop();
    },
  };
}

/**
 * Handle Anthropic /v1/messages requests
 */
async function handleMessagesRequest(
  req: Request,
  apiKey: string,
  model: string
): Promise<Response> {
  try {
    log(`[Proxy] Processing messages request for model: ${model}`);
    const anthropicReq = (await req.json()) as AnthropicRequest;

    // Translate to OpenRouter format
    const openrouterReq = translateAnthropicToOpenRouter(anthropicReq, model);

    // Handle streaming
    if (anthropicReq.stream) {
      log("[Proxy] Starting streaming request to OpenRouter");
      return handleStreamingRequest(openrouterReq, apiKey, anthropicReq.model);
    }

    // Handle non-streaming
    log("[Proxy] Starting non-streaming request to OpenRouter");
    return handleNonStreamingRequest(openrouterReq, apiKey, anthropicReq.model);
  } catch (error) {
    log(`[Proxy] Request handling error: ${error}`);
    return new Response(
      JSON.stringify({
        error: {
          type: "invalid_request_error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Handle non-streaming requests
 */
async function handleNonStreamingRequest(
  openrouterReq: unknown,
  apiKey: string,
  originalModel: string
): Promise<Response> {
  log("[Proxy] Sending to OpenRouter:");
  log(JSON.stringify(openrouterReq, null, 2));

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...OPENROUTER_HEADERS,
    },
    body: JSON.stringify(openrouterReq),
  });

  if (!response.ok) {
    const error = await response.text();
    log(`[Proxy] OpenRouter API error: ${error}`);
    return new Response(error, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const openrouterRes = (await response.json()) as OpenRouterResponse;
  log("[Proxy] Received from OpenRouter:");
  log(JSON.stringify(openrouterRes, null, 2));

  const anthropicRes = translateOpenRouterToAnthropic(openrouterRes, originalModel);
  log("[Proxy] Translated to Anthropic format:");
  log(JSON.stringify(anthropicRes, null, 2));

  return new Response(JSON.stringify(anthropicRes), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Handle streaming requests
 */
async function handleStreamingRequest(
  openrouterReq: unknown,
  apiKey: string,
  originalModel: string
): Promise<Response> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...OPENROUTER_HEADERS,
    },
    body: JSON.stringify(openrouterReq),
  });

  if (!response.ok) {
    const error = await response.text();
    log(`[Proxy] OpenRouter streaming error: ${error}`);
    return new Response(error, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      let isControllerClosed = false;

      const safeEnqueue = (data: Uint8Array) => {
        if (!isControllerClosed) {
          try {
            controller.enqueue(data);
          } catch (error) {
            // Controller was closed externally
            isControllerClosed = true;
          }
        }
      };

      const safeClose = () => {
        if (!isControllerClosed) {
          try {
            controller.close();
            isControllerClosed = true;
          } catch {
            // Already closed
            isControllerClosed = true;
          }
        }
      };

      // Send message_start event
      const startEvent = {
        type: "message_start",
        message: {
          id: messageId,
          type: "message",
          role: "assistant",
          content: [],
          model: originalModel,
          usage: { input_tokens: 0, output_tokens: 0 },
        },
      };
      safeEnqueue(
        new TextEncoder().encode(`event: message_start\ndata: ${JSON.stringify(startEvent)}\n\n`)
      );

      try {
        let hasSentStopEvent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              const translated = translateStreamChunk(line);
              if (translated) {
                // Check if this is a stop event from translateStreamChunk
                if (translated.includes('message_stop')) {
                  hasSentStopEvent = true;
                }
                safeEnqueue(new TextEncoder().encode(translated));
              }
            }
          }
        }

        // Only send message_stop if translateStreamChunk didn't already send it
        if (!hasSentStopEvent) {
          safeEnqueue(
            new TextEncoder().encode('event: message_stop\ndata: {"type":"message_stop"}\n\n')
          );
        }
      } catch (error) {
        log(`[Proxy] Streaming error: ${error}`);
      } finally {
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: createStreamHeaders(),
  });
}

/**
 * Handle token counting requests
 * Claude Code uses this to estimate token usage before sending requests
 */
async function handleCountTokensRequest(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    log("[Proxy] Token counting request (estimating)");

    // Rough estimation: ~4 characters per token
    // This is a simplification - real tokenization is model-specific
    const systemTokens = body.system ? Math.ceil(body.system.length / 4) : 0;
    const messageTokens = body.messages
      ? body.messages.reduce((acc: number, msg: any) => {
          const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
          return acc + Math.ceil(content.length / 4);
        }, 0)
      : 0;

    const totalTokens = systemTokens + messageTokens;

    return new Response(
      JSON.stringify({
        input_tokens: totalTokens,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    log(`[Proxy] Token counting error: ${error}`);
    return new Response(
      JSON.stringify({
        error: {
          type: "invalid_request_error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

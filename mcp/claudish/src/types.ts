// OpenRouter Models - Top Recommended for Development (Priority Order)
export const OPENROUTER_MODELS = [
  "x-ai/grok-code-fast-1",
  "openai/gpt-5-codex",
  "minimax/minimax-m2",
  "z-ai/glm-4.6",
  "qwen/qwen3-vl-235b-a22b-instruct",
  "anthropic/claude-sonnet-4.5",
  "custom",
] as const;

export type OpenRouterModel = (typeof OPENROUTER_MODELS)[number];

// CLI Configuration
export interface ClaudishConfig {
  model?: OpenRouterModel | string; // Optional - will prompt if not provided
  port?: number;
  autoApprove: boolean;
  dangerous: boolean;
  interactive: boolean;
  debug: boolean;
  quiet: boolean; // Suppress [claudish] log messages (default true in single-shot mode)
  jsonOutput: boolean; // Output in JSON format for tool integration
  openrouterApiKey: string;
  claudeArgs: string[];
}

// Anthropic API Types
export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: "text" | "image";
  text?: string;
  source?: {
    type: "base64";
    media_type: string;
    data: string;
  };
}

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  system?: string;
}

export interface AnthropicResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: ContentBlock[];
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// OpenRouter API Types
export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Proxy Server
export interface ProxyServer {
  port: number;
  url: string;
  shutdown: () => Promise<void>;
}

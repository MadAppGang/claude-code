#!/usr/bin/env node
/**
 * Claudish MCP Server
 *
 * Provides MCP tools for calling external AI models via OpenRouter.
 * This replaces the need for separate Codex agents by providing tools
 * that can invoke external AI models (Codex, Grok, GPT-5, etc.) for
 * specialized tasks like code review and design validation.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Helper model aliases - third-party AI models used to assist Claude with specialized tasks
// Maps convenient shortcut names to OpenRouter model IDs
// Users can also pass OpenRouter model IDs directly (e.g., "x-ai/grok-code-fast-1")
const HELPER_MODEL_ALIASES: Record<string, string> = {
  'code-review': 'openai/gpt-5-codex',
  'ui-review': 'openai/gpt-5-codex',
  'design-review': 'openai/gpt-5-codex',
  'grok-fast': 'x-ai/grok-code-fast-1',
  'minimax': 'minimax/minimax-m2',
  'qwen-vision': 'qwen/qwen3-vl-235b-a22b-instruct',
};

// MCP Tools
const tools: Tool[] = [
  {
    name: 'call_external_ai',
    description:
      'Call an external AI model via OpenRouter for specialized tasks like code review, design validation, or technical analysis. Use this when you need a second opinion or specialized expertise.',
    inputSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          description: 'OpenRouter model ID (e.g., "x-ai/grok-code-fast-1", "openai/gpt-5-codex") or shortcut name (e.g., "grok-fast", "code-review"). See https://openrouter.ai/models for all available models.',
        },
        prompt: {
          type: 'string',
          description: 'The prompt/task to send to the AI model',
        },
        system_prompt: {
          type: 'string',
          description: 'Optional system prompt to set context and role for the AI',
        },
        max_tokens: {
          type: 'number',
          description: 'Maximum tokens in response (default: 4000)',
          default: 4000,
        },
      },
      required: ['model', 'prompt'],
    },
  },
  {
    name: 'list_available_models',
    description: 'List all available AI models and their recommended use cases',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Call OpenRouter API
 */
async function callOpenRouter(
  model: string,
  prompt: string,
  systemPrompt?: string,
  maxTokens = 4000,
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  // Check if model is a helper alias (e.g., "grok-fast") or direct OpenRouter ID (e.g., "x-ai/grok-code-fast-1")
  // If it's an alias, resolve it to the actual model ID
  // If it contains a slash, assume it's already an OpenRouter model ID
  const modelId = model.includes('/') ? model : HELPER_MODEL_ALIASES[model];

  if (!modelId) {
    const aliases = Object.keys(HELPER_MODEL_ALIASES).join(', ');
    throw new Error(
      `Unknown helper model alias: "${model}". Use an OpenRouter model ID (e.g., "x-ai/grok-code-fast-1") or a helper alias (${aliases}). See https://openrouter.ai/models for all available models.`,
    );
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://github.com/MadAppGang/claude-code',
      'X-Title': 'Claudish MCP Server',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Main MCP Server
 */
async function main() {
  const server = new Server(
    {
      name: 'claudish-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'list_available_models') {
        const aliasList = Object.entries(HELPER_MODEL_ALIASES)
          .map(([key, value]) => `- ${key} → ${value}`)
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `**Helper Model Aliases** (third-party AI assistants):\n\n${aliasList}\n\n**You can use ANY OpenRouter model ID!**\n\nPopular coding models from OpenRouter (2025):\n- x-ai/grok-code-fast-1 - xAI Grok (fast)\n- openai/gpt-5-codex - OpenAI GPT-5 Codex\n- deepseek/deepseek-chat - DeepSeek (reasoning)\n- anthropic/claude-opus-4 - Claude Opus 4\n- google/gemini-2.0-flash-thinking-exp - Google Gemini 2.0\n- qwen/qwq-32b-preview - Alibaba QwQ (reasoning)\n\nSee full list: https://openrouter.ai/models\n\nUsage:\n- Helper aliases: call_external_ai(model="grok-fast", ...)\n- Direct IDs: call_external_ai(model="x-ai/grok-code-fast-1", ...)`,
            },
          ],
        };
      }

      if (name === 'call_external_ai') {
        const { model, prompt, system_prompt, max_tokens } = args as {
          model: string;
          prompt: string;
          system_prompt?: string;
          max_tokens?: number;
        };

        const response = await callOpenRouter(model, prompt, system_prompt, max_tokens);

        return {
          content: [
            {
              type: 'text',
              text: response,
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Claudish MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

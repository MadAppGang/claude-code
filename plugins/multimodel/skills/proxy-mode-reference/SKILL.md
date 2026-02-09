---
name: proxy-mode-reference
version: 1.2.0
description: Reference guide for using PROXY_MODE with external AI models. Use when running multi-model reviews, understanding which agents support PROXY_MODE, or debugging external model integration issues. Includes routing prefixes for MiniMax, Kimi, GLM direct APIs.
keywords: [proxy-mode, external-models, multi-model, claudish, routing-prefixes, minimax, kimi, glm, gemini, openai, agent-support]
plugin: multimodel
updated: 2026-01-20
---

# PROXY_MODE Reference Guide

## ⚠️ Learn and Reuse Model Preferences

Models are learned per context and reused automatically:

```bash
cat .claude/multimodel-team.json 2>/dev/null
```

1. Detect context from task keywords (debug/research/coding/review)
2. If `contextPreferences[context]` exists → **USE IT** (no asking)
3. If empty (first time) → ASK user → SAVE for that context
4. User says "change models" → UPDATE preferences

---

## What is PROXY_MODE?

PROXY_MODE is a directive that tells an agent to delegate its task to an external AI model via Claudish.

## How It Works

1. **Orchestrator** launches Task with PROXY_MODE-enabled agent
2. **Agent** detects `PROXY_MODE: {model}` at start of prompt
3. **Agent** extracts model ID and actual task
4. **Agent** runs `claudish --model {model}` with the task
5. **Agent** returns external model's response

## Multi-Backend Routing

Claudish routes to different backends based on model ID prefix:

| Prefix | Backend | Required Key | Example |
|--------|---------|--------------|---------|
| (none) | OpenRouter | `OPENROUTER_API_KEY` | `openai/gpt-5.2` |
| `g/` `gemini/` | Google Gemini API | `GEMINI_API_KEY` | `g/gemini-2.0-flash` |
| `oai/` | OpenAI Direct API | `OPENAI_API_KEY` | `oai/gpt-4o` |
| `mmax/` `mm/` | MiniMax Direct API | `MINIMAX_API_KEY` | `mmax/MiniMax-M2.1` |
| `kimi/` `moonshot/` | Kimi Direct API | `KIMI_API_KEY` | `kimi/kimi-k2-thinking-turbo` |
| `glm/` `zhipu/` | GLM Direct API | `GLM_API_KEY` | `glm/glm-4.7` |
| `ollama/` | Ollama (local) | None | `ollama/llama3.2` |
| `lmstudio/` | LM Studio (local) | None | `lmstudio/qwen` |
| `vllm/` | vLLM (local) | None | `vllm/model` |
| `mlx/` | MLX (local) | None | `mlx/model` |
| `http://...` | Custom endpoint | None | `http://localhost:8000/model` |

### ⚠️ Prefix Collision Warning

OpenRouter model IDs may collide with routing prefixes. Check the prefix table above.

**Collision-free models (safe for OpenRouter):**
- `x-ai/grok-*` ✅
- `deepseek/*` ✅
- `minimax/*` ✅ (use `mmax/` for MiniMax Direct)
- `qwen/*` ✅
- `mistralai/*` ✅
- `moonshotai/*` ✅ (use `kimi/` for Kimi Direct)
- `anthropic/*` ✅
- `z-ai/*` ✅ (use `glm/` for GLM Direct)
- `google/*` ✅ (use `g/` for Gemini Direct)
- `openai/*` ✅ (use `oai/` for OpenAI Direct)

**Direct API prefixes for cost savings:**
| OpenRouter Model | Direct API Prefix | Notes |
|------------------|-------------------|-------|
| `openai/gpt-*` | `oai/gpt-*` | OpenAI Direct API |
| `google/gemini-*` | `g/gemini-*` | Gemini Direct API |
| `minimax/*` | `mmax/*` or `mm/*` | MiniMax Direct API |
| `moonshotai/*` | `kimi/*` or `moonshot/` | Kimi Direct API |
| `z-ai/glm-*` | `glm/*` or `zhipu/*` | GLM Direct API |

**Workaround for collisions:**
1. Use collision-free OpenRouter models (recommended for simplicity)
2. Use direct API prefix for cost savings (e.g., `oai/gpt-4o` instead of `openai/gpt-4o`)
3. Set up the corresponding API key for direct access

## The PROXY_MODE Directive

Format:
```
PROXY_MODE: {model_id}

{actual task}
```

Example:
```
PROXY_MODE: x-ai/grok-code-fast-1

Review the architecture plan at ai-docs/plan.md
```

## Approach Selection

**Preference Order:**
1. ✅ **First**: Use PROXY_MODE if agent supports it (see Supported Agents below)
2. ✅ **Fallback**: Use Bash + CLI if agent lacks PROXY_MODE support

## Alternative: Bash + CLI (Works with ANY Agent)

Use the CLI directly when an agent doesn't support PROXY_MODE:

```bash
# Pattern
echo "{PROMPT}" | npx claudish --agent {PLUGIN}:{AGENT} --model {MODEL_ID} --stdin --quiet

# Examples
echo "Research React hooks" | npx claudish --agent dev:researcher --model x-ai/grok-code-fast-1 --stdin --quiet
echo "Debug this error" | npx claudish --agent dev:debugger --model google/gemini-3-pro-preview --stdin --quiet
```

This approach works with **ALL agents**, not just PROXY_MODE-enabled ones.

---

## Supported Agents (for PROXY_MODE Directive)

**Total: 25+ PROXY_MODE-enabled agents across 4 plugins**

### agentdev plugin (3 agents)

| Agent | subagent_type | Best For |
|-------|---------------|----------|
| reviewer | `agentdev:reviewer` | Implementation quality reviews |
| architect | `agentdev:architect` | Design plan reviews |
| developer | `agentdev:developer` | Implementation with external models |

### frontend plugin (8 agents)

| Agent | subagent_type | Best For |
|-------|---------------|----------|
| plan-reviewer | `frontend:plan-reviewer` | Architecture plan validation |
| reviewer | `frontend:reviewer` | Code reviews |
| architect | `frontend:architect` | Architecture design |
| designer | `frontend:designer` | Design reviews |
| developer | `frontend:developer` | Full-stack implementation |
| ui-developer | `frontend:ui-developer` | UI implementation reviews |
| css-developer | `frontend:css-developer` | CSS architecture & styling |
| test-architect | `frontend:test-architect` | Testing strategy & implementation |

### seo plugin (5 agents)

| Agent | subagent_type | Best For |
|-------|---------------|----------|
| editor | `seo:editor` | SEO content reviews |
| writer | `seo:writer` | Content generation |
| analyst | `seo:analyst` | Analysis tasks |
| researcher | `seo:researcher` | Research & data gathering |
| data-analyst | `seo:data-analyst` | Data analysis & insights |

### dev plugin (7 agents)

| Agent | subagent_type | Best For |
|-------|---------------|----------|
| researcher | `dev:researcher` | Research and exploration |
| developer | `dev:developer` | Implementation tasks |
| debugger | `dev:debugger` | Error analysis and debugging |
| devops | `dev:devops` | Infrastructure and DevOps |
| architect | `dev:architect` | Architecture design |
| test-architect | `dev:test-architect` | Test strategy and design |
| ui | `dev:ui` | UI/UX design reviews |

## Common Mistakes

### Mistake 1: Using general-purpose (THE #1 FAILURE MODE)

> **⚠️ CRITICAL:** `general-purpose` **DOES NOT** support PROXY_MODE.
> It will **silently run Claude Sonnet** instead of the external model.
> The response will look normal, but no external model was called.
> This produces fake "diverse perspectives" from a single model.

```typescript
// ❌ WRONG - SILENTLY RUNS CLAUDE SONNET
Task({
  subagent_type: "general-purpose",
  prompt: "PROXY_MODE: x-ai/grok-code-fast-1\n\nReview this code..."
})
// Response comes from Claude Sonnet, NOT Grok!
```

**Fix A (preferred):** Use a PROXY_MODE-enabled agent:
```typescript
Task({
  subagent_type: "dev:researcher",  // ← Supports PROXY_MODE
  prompt: "PROXY_MODE: x-ai/grok-code-fast-1\n\nReview this code..."
})
```

**Fix B (fallback):** Use the Bash + CLI approach with `--agent` flag:
```bash
echo "Your task" | npx claudish --agent dev:researcher --model x-ai/grok-code-fast-1 --stdin --quiet
```

### Mistake 2: Instructing agent to run claudish

```typescript
// ❌ WRONG
Task({
  subagent_type: "general-purpose",
  prompt: "Run claudish with model X to review..."
})
```

The agent doesn't know the claudish pattern. Use PROXY_MODE instead.

### Mistake 3: Wrong prompt format

```typescript
// ❌ WRONG - PROXY_MODE must be first line
Task({
  subagent_type: "agentdev:reviewer",
  prompt: "Please review this plan.
PROXY_MODE: grok..."
})
```

The directive must be at the START of the prompt.

## Correct Usage Pattern

```typescript
// ✅ CORRECT
Task({
  subagent_type: "agentdev:reviewer",
  description: "Grok review",
  run_in_background: true,
  prompt: `PROXY_MODE: x-ai/grok-code-fast-1

Review the implementation at path/to/file.ts

Focus on:
1. Code quality
2. Error handling
3. Performance
4. Security`
})
```

## Checking Agent Support

To verify if an agent supports PROXY_MODE:

```bash
# Find agents with PROXY_MODE support
grep -l "proxy_mode_support" plugins/*/agents/*.md

# Check specific agent
grep "proxy_mode_support" plugins/agentdev/agents/reviewer.md
```

## Troubleshooting

### "Agent didn't use external model"

**Cause:** Agent doesn't support PROXY_MODE
**Fix:** Use a PROXY_MODE-enabled agent (see table above)

### "Got Claude response instead of Grok response"

**Cause:** `general-purpose` or other non-PROXY_MODE agent was used
**Fix:** Switch to `agentdev:reviewer` or similar

### "PROXY_MODE directive in output"

**Cause:** Agent treated directive as content, not instruction
**Fix:** Use correct agent; ensure directive is first line

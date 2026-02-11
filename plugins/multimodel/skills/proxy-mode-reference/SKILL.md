---
name: proxy-mode-reference
version: 2.0.0
description: Reference guide for using external AI models via claudish CLI. Use when running multi-model reviews, understanding how /team invokes external models, or debugging external model integration issues. Includes routing prefixes for MiniMax, Kimi, GLM direct APIs.
keywords: [external-models, multi-model, claudish, routing-prefixes, minimax, kimi, glm, gemini, openai, bash-claudish]
plugin: multimodel
updated: 2026-02-11
---

# External Models via Claudish CLI — Reference Guide

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

## How External Models Work

External models are invoked **deterministically** via the claudish CLI. The orchestrator
(e.g., `/team` command) calls claudish directly through Bash — no LLM delegation needed.

```
Orchestrator → Bash(claudish --model {MODEL_ID} --agent {AGENT} --stdin) → External Model
```

This approach is 100% reliable because it's a direct CLI invocation, not a prompt-based delegation.

## Invoking External Models

### From /team Command (Automatic)

The `/team` command handles this automatically:
- **Internal models** → Task(dev:researcher)
- **External models** → Bash(claudish --agent dev:researcher --model {MODEL_ID} --stdin)

### Direct CLI Usage

```bash
# Pattern
claudish --agent {PLUGIN}:{AGENT} --model {MODEL_ID} --stdin --quiet < prompt-file.md > result.md

# Examples
claudish --agent dev:researcher --model x-ai/grok-code-fast-1 --stdin --quiet < task.md > grok-result.md
claudish --agent dev:debugger --model google/gemini-3-pro-preview --stdin --quiet < task.md > gemini-result.md
```

**Required flags:**
- `--agent` — Specifies the specialized agent for the task
- `--model` — The external model to use
- `--stdin` — Read prompt from stdin (for large prompts)
- `--quiet` — Suppress log messages (for clean output capture)

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

---

## Agent Selection for --agent Flag

| Task Type | Recommended Agent | Alternatives |
|-----------|------------------|--------------|
| Investigation/Research | `dev:researcher` | `dev:debugger` |
| Code Review | `agentdev:reviewer` | `frontend:reviewer` |
| Architecture | `dev:architect` | `frontend:architect` |
| Implementation | `dev:developer` | `frontend:developer` |
| Testing | `dev:test-architect` | `frontend:test-architect` |
| DevOps | `dev:devops` | — |
| UI/Design | `dev:ui` | `frontend:designer` |

## Correct Usage Patterns

### Single External Model

```bash
claudish --agent dev:researcher --model x-ai/grok-code-fast-1 --stdin --quiet < task.md > result.md
```

### Parallel External Models (in /team)

```bash
# All launched in a single message with run_in_background: true
Bash("claudish --agent dev:researcher --model x-ai/grok-code-fast-1 --stdin --quiet < vote-prompt.md > grok-result.md 2>grok-stderr.log; echo $? > grok.exit")
Bash("claudish --agent dev:researcher --model google/gemini-3-pro-preview --stdin --quiet < vote-prompt.md > gemini-result.md 2>gemini-stderr.log; echo $? > gemini.exit")
```

### Verifying Results

```bash
# Check exit code
cat grok.exit  # 0 = success

# Check output size
wc -c < grok-result.md  # Should be >50 bytes

# Check stderr for errors
cat grok-stderr.log
```

## Common Mistakes

### Mistake 1: Missing --agent flag

```bash
# ❌ WRONG - no agent specialization
claudish --model x-ai/grok-code-fast-1 --stdin < task.md

# ✅ CORRECT
claudish --agent dev:researcher --model x-ai/grok-code-fast-1 --stdin < task.md
```

### Mistake 2: Not capturing exit code

```bash
# ❌ WRONG - no way to detect failures
claudish --agent dev:researcher --model grok --stdin < task.md > result.md

# ✅ CORRECT - capture exit code
claudish --agent dev:researcher --model grok --stdin < task.md > result.md 2>stderr.log; echo $? > result.exit
```

## Troubleshooting

### "claudish: command not found"
**Fix:** `npm install -g claudish`

### "OPENROUTER_API_KEY not set"
**Fix:** `export OPENROUTER_API_KEY=your-key`

### Non-zero exit code
**Fix:** Check stderr log for error details. Common causes: rate limits, invalid model ID, API key issues.

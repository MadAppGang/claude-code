---
name: task-external-models
version: 1.1.0
description: Quick-reference for using external AI models with Task tool. CRITICAL - PROXY_MODE is NOT a Task parameter - it goes in the PROMPT. Use when confused about "Task tool external model", "PROXY_MODE parameter", "how to specify external model", "Task doesn't have model parameter", "only accepts sonnet/opus/haiku", or "minimax/grok/gemini with Task". Trigger keywords - "Task tool parameter", "PROXY_MODE not working", "external model Task", "external LLM", "claudish directly", "claudish with Task", "model parameter missing".
tags: [task, proxy-mode, external-model, quick-reference, bash, agent-cli]
keywords: [task tool, proxy_mode, external model, grok, gemini, gpt-5, minimax, claudish, parameter, prompt, external LLM, --agent, cli]
plugin: orchestration
updated: 2026-01-20
---

# Task Tool + External Models: Quick Reference

## The Simple Truth

There are **TWO ways** to run any agent with external AI models:

| Approach | Works With | When to Use |
|----------|-----------|-------------|
| **Task + PROXY_MODE** | PROXY_MODE-enabled agents | **PREFERRED** - Use first if agent supports it |
| **Bash + CLI** | ANY agent | Fallback when agent lacks PROXY_MODE support |

**Preference Order:**
1. ✅ **First**: Check if agent supports PROXY_MODE (see table below)
2. ✅ **If yes**: Use Task + PROXY_MODE approach
3. ✅ **If no**: Use Bash + CLI approach with `--agent` flag

---

## Approach 1: Bash + CLI (Simplest, Universal)

**Works with ANY agent** - no PROXY_MODE support required!

```bash
# Pattern
echo "{PROMPT}" | npx claudish --agent {PLUGIN}:{AGENT} --model {MODEL_ID} --stdin --quiet
# Examples
# dev plugin agents
echo "Research React hooks best practices" | npx claudish --agent dev:researcher --model x-ai/grok-code-fast-1 --stdin --quiet
echo "Debug this error: TypeError undefined" | npx claudish --agent dev:debugger --model google/gemini-3-pro-preview --stdin --quiet
echo "Design a microservices architecture" | npx claudish --agent dev:architect --model openai/gpt-5.2 --stdin --quiet
# Any agent from any plugin
echo "Review the code at src/utils.ts" | npx claudish --agent frontend:reviewer --model deepseek/deepseek-chat --stdin --quiet
```

**CLI Reference:**
```
claudish [options]

--agent <name>       Specify an agent (e.g., dev:researcher, agentdev:reviewer)
--model <id>         AI model to use (e.g., x-ai/grok-code-fast-1)
--stdin              Read prompt from stdin
--quiet              Minimal output
--no-auto-approve    Disable auto-approve (prompts enabled) - rarely needed
```

**Parallel Execution via Bash:**

```bash
# Run multiple agents/models in parallel (auto-approve is default, no flag needed)
echo "Review plan.md" | npx claudish --agent dev:architect --model x-ai/grok-code-fast-1 --stdin --quiet > /tmp/grok-review.md &
echo "Review plan.md" | npx claudish --agent dev:architect --model google/gemini-3-pro-preview --stdin --quiet > /tmp/gemini-review.md &
echo "Review plan.md" | npx claudish --agent dev:architect --model openai/gpt-5.2 --stdin --quiet > /tmp/gpt5-review.md &
wait

# All 3 run in parallel!
```

---

## Approach 2: Task + PROXY_MODE (Within Orchestration)

**Requires agents with `<proxy_mode_support>` blocks.**

**PROXY_MODE is NOT a Task tool parameter. It goes IN THE PROMPT.**

The Task tool's `model` parameter only accepts: `sonnet`, `opus`, `haiku` (Claude models).

*Tool call shape (illustrative):*

```javascript
// CORRECT - PROXY_MODE in prompt, not as parameter
Task({
  description: "Grok code review",
  subagent_type: "agentdev:reviewer",  // Must support PROXY_MODE
  run_in_background: true,
  prompt: `PROXY_MODE: x-ai/grok-code-fast-1

Review the implementation at /path/to/file.ts

Focus on:
1. Error handling
2. Performance
3. Security`
})
```

---

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|--------------|-----|
| `model: "grok"` as Task parameter | Task's `model` only accepts sonnet/opus/haiku | Put PROXY_MODE in prompt, or use Bash approach |
| `subagent_type: "general-purpose"` | general-purpose doesn't support PROXY_MODE | Use Bash + CLI approach instead |
| PROXY_MODE not on first line | Agent won't detect the directive | Ensure PROXY_MODE is first line of prompt |
| Agent doesn't support PROXY_MODE | Agent ignores the directive | Use Bash + CLI approach instead |

---

## Which Agents Support PROXY_MODE?

**For Task + PROXY_MODE approach** (Approach 2), only these agents work:

| Plugin | Agents |
|--------|--------|
| agentdev | reviewer, architect, developer |
| frontend | plan-reviewer, reviewer, architect, designer, developer, ui-developer, css-developer, test-architect |
| seo | editor, writer, analyst, researcher, data-analyst |
| dev | researcher, developer, debugger, devops, ui, architect, test-architect |

**For Bash + CLI approach** (Approach 1): **ALL agents work!**

---

## Model IDs

> **Note:** Model IDs change frequently. Use `claudish --top-models` for current list.

```bash
# Get current available models
claudish --top-models    # Best value paid models
claudish --free          # Free models

# Example model IDs (verify with commands above)
x-ai/grok-code-fast-1       # Grok (fast coding)
minimax/minimax-m2.1        # MiniMax
google/gemini-3-pro-preview # Gemini Pro
openai/gpt-5.2              # GPT-5.2
deepseek/deepseek-chat-v3   # DeepSeek
qwen/qwen3-coder:free       # Free Qwen coder
```

> **Prefix routing:** Use direct API prefixes for cost savings: `oai/` (OpenAI), `g/` (Gemini), `mmax/` (MiniMax), `kimi/` (Kimi), `glm/` (GLM).

---

## When to Use Which Approach

**Default**: Use PROXY_MODE if agent supports it.

| Scenario | Approach |
|----------|----------|
| Agent supports PROXY_MODE | **Task + PROXY_MODE** (preferred) |
| Within Task-based orchestration workflow | **Task + PROXY_MODE** |
| Need agent's error handling in Task context | **Task + PROXY_MODE** |
| Agent doesn't have PROXY_MODE support | **Bash + CLI** (fallback) |
| Quick one-off external model run | **Bash + CLI** |

---

## Parallel Multi-Model Review (Task Approach)

*Tool call shape (illustrative):*

```javascript
// Launch multiple models in parallel (same message)
Task({
  description: "Grok review",
  subagent_type: "agentdev:reviewer",
  run_in_background: true,
  prompt: `PROXY_MODE: x-ai/grok-code-fast-1
Review /path/to/plan.md`
})

Task({
  description: "GPT-5 review",
  subagent_type: "agentdev:reviewer",
  run_in_background: true,
  prompt: `PROXY_MODE: openai/gpt-5.2
Review /path/to/plan.md`
})

Task({
  description: "Gemini review",
  subagent_type: "agentdev:reviewer",
  run_in_background: true,
  prompt: `PROXY_MODE: google/gemini-3-pro-preview
Review /path/to/plan.md`
})
```

---

## Summary

**If agent doesn't support PROXY_MODE (or you want simpler approach):**

```bash
echo "Your task" | npx claudish --agent {plugin}:{agent} --model {model-id} --stdin --quiet
```

**If using Task tool within orchestration:**

```
Put PROXY_MODE: {model-id} on the FIRST LINE of the prompt.
Use a PROXY_MODE-enabled agent (see table above).
```

---

## Related Skills

- **orchestration:proxy-mode-reference** - Complete PROXY_MODE documentation
- **orchestration:multi-model-validation** - Full parallel validation patterns
- **orchestration:model-tracking-protocol** - Progress tracking during reviews
- **orchestration:error-recovery** - Handle PROXY_MODE failures and timeouts

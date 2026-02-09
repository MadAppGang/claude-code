---
name: task-external-models
version: 1.2.0
description: Quick-reference for using external AI models with Task tool. CRITICAL - PROXY_MODE is NOT a Task parameter - it goes in the PROMPT. Use when confused about "Task tool external model", "PROXY_MODE parameter", "how to specify external model", "Task doesn't have model parameter", "only accepts sonnet/opus/haiku", or "minimax/grok/gemini with Task". Trigger keywords - "Task tool parameter", "PROXY_MODE not working", "external model Task", "external LLM", "claudish directly", "claudish with Task", "model parameter missing".
tags: [task, proxy-mode, external-model, quick-reference, bash, agent-cli]
keywords: [task tool, proxy_mode, external model, grok, gemini, gpt-5, minimax, claudish, parameter, prompt, external LLM, --agent, cli]
plugin: multimodel
updated: 2026-01-20
---

# Task Tool + External Models: Quick Reference

## ⚠️ Learn and Reuse Model Preferences

Models are learned per context and reused automatically:

```bash
cat .claude/multimodel-team.json 2>/dev/null
```

**Flow:**
1. Detect context from task keywords (debug/research/coding/review)
2. If `contextPreferences[context]` has models → **USE THEM** (no asking)
3. If empty (first time for context) → ASK user → SAVE to that context
4. User says "use different models" → ASK and UPDATE

**Override triggers:** "use different models", "change models", "update preferences"

---

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

> **⚠️ CRITICAL WARNING: The #1 failure mode in multi-model workflows**
>
> `subagent_type: "general-purpose"` **DOES NOT support PROXY_MODE**.
> Putting `PROXY_MODE: model-id` in a `general-purpose` prompt will **silently run Claude Sonnet**.
> The response will look normal but NO external model was actually called.
> All "diverse" perspectives will come from the same Claude Sonnet model.
>
> **Fix:** Use a PROXY_MODE-enabled agent (see table below), or use Bash + CLI approach.

| Mistake | Why It Fails | Fix |
|---------|--------------|-----|
| `model: "grok"` as Task parameter | Task's `model` only accepts sonnet/opus/haiku | Put PROXY_MODE in prompt, or use Bash approach |
| `subagent_type: "general-purpose"` with PROXY_MODE | **general-purpose silently ignores PROXY_MODE** - runs Claude Sonnet instead | Use PROXY_MODE-enabled agent, or Bash + CLI |
| PROXY_MODE not on first line | Agent won't detect the directive | Ensure PROXY_MODE is first line of prompt |
| Agent doesn't support PROXY_MODE | Agent ignores the directive silently | Use Bash + CLI approach instead |
| `$(cat /tmp/file.md)` in Task prompt | Shell expansion doesn't work in JSON string parameters | Read file content first, then include in prompt |
| Missing `--agent` flag with claudish CLI | External model gets default instance with no specialized tools | Always specify `--agent {plugin}:{agent}` |

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
minimax/minimax-m2.5        # MiniMax M2.5
google/gemini-3-pro-preview # Gemini Pro
openai/gpt-5.2-codex        # GPT-5.2 Codex
z-ai/glm-4.7                # GLM 4.7
deepseek/deepseek-v3.2      # DeepSeek v3.2
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

## Verifying Models Actually Ran

After collecting results from multi-model execution, **always verify** the response came from the intended model:

**For PROXY_MODE Task approach:**
- Check the Task agent's response for model identification
- If response metadata shows `claude-sonnet-*` when expecting an external model → the PROXY_MODE was silently ignored
- Report which models ACTUALLY ran vs which were requested

**For Bash + CLI approach:**
- Check claudish exit code (0 = success)
- Parse claudish cost/model output for confirmation
- If no cost is reported → external model likely didn't run

**Verification checklist:**
```
For each model result:
  ☐ Response contains substantive analysis (not just acknowledgment)
  ☐ Response style/format differs from other models (genuine diversity)
  ☐ If using PROXY_MODE: metadata doesn't show claude-sonnet-*
  ☐ If using CLI: claudish reported non-zero cost for paid models
```

---

## Related Skills

- **orchestration:proxy-mode-reference** - Complete PROXY_MODE documentation
- **orchestration:multi-model-validation** - Full parallel validation patterns
- **orchestration:model-tracking-protocol** - Progress tracking during reviews
- **orchestration:error-recovery** - Handle PROXY_MODE failures and timeouts

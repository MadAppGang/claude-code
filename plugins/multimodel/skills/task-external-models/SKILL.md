---
name: task-external-models
version: 2.0.0
description: Quick-reference for using external AI models in orchestration workflows. External models are invoked via Bash+claudish CLI (deterministic, 100% reliable). Use when confused about how to run external models, "claudish with Bash", "external model in /team", or "how to specify external model". Trigger keywords - "external model", "claudish", "Bash claudish", "external LLM", "model parameter".
tags: [external-model, quick-reference, bash, claudish, agent-cli]
keywords: [external model, grok, gemini, gpt-5, minimax, claudish, bash, external LLM, --agent, cli]
plugin: multimodel
updated: 2026-02-11
---

# External Models: Quick Reference

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

External AI models are invoked via **Bash+claudish CLI**. This is deterministic and 100% reliable.

```bash
claudish --agent {PLUGIN}:{AGENT} --model {MODEL_ID} --stdin --quiet < prompt.md > result.md
```

**In /team orchestration:**
- **Internal model** (Claude) → `Task(subagent_type: "dev:researcher")`
- **External models** (Grok, Gemini, etc.) → `Bash(claudish --agent dev:researcher --model {MODEL_ID} --stdin)`

---

## Bash + claudish Pattern

**Works with ANY agent** — deterministic, no LLM compliance needed.

```bash
# Pattern
claudish --agent {PLUGIN}:{AGENT} --model {MODEL_ID} --stdin --quiet < prompt.md > result.md 2>stderr.log; echo $? > result.exit

# Examples
claudish --agent dev:researcher --model x-ai/grok-code-fast-1 --stdin --quiet < task.md > grok.md 2>grok-err.log; echo $? > grok.exit
claudish --agent dev:debugger --model google/gemini-3-pro-preview --stdin --quiet < task.md > gemini.md 2>gemini-err.log; echo $? > gemini.exit
claudish --agent dev:architect --model openai/gpt-5.2-codex --stdin --quiet < task.md > gpt5.md 2>gpt5-err.log; echo $? > gpt5.exit
```

**CLI Reference:**
```
claudish [options]

--agent <name>       Specify an agent (e.g., dev:researcher, agentdev:reviewer)
--model <id>         AI model to use (e.g., x-ai/grok-code-fast-1)
--stdin              Read prompt from stdin
--quiet              Minimal output
```

**Parallel Execution in /team:**

All Bash calls are launched in a SINGLE message with `run_in_background: true`:

```javascript
// Internal model via Task
Task({
  subagent_type: "dev:researcher",
  description: "Internal Claude vote",
  run_in_background: true,
  prompt: "{VOTE_PROMPT}\n\nWrite to: {SESSION_DIR}/internal-result.md"
})

// External models via Bash+claudish (all in same message)
Bash({
  command: "claudish --agent dev:researcher --model x-ai/grok-code-fast-1 --stdin --quiet < {SESSION_DIR}/vote-prompt.md > {SESSION_DIR}/grok-result.md 2>{SESSION_DIR}/grok-stderr.log; echo $? > {SESSION_DIR}/grok.exit",
  run_in_background: true
})

Bash({
  command: "claudish --agent dev:researcher --model google/gemini-3-pro-preview --stdin --quiet < {SESSION_DIR}/vote-prompt.md > {SESSION_DIR}/gemini-result.md 2>{SESSION_DIR}/gemini-stderr.log; echo $? > {SESSION_DIR}/gemini.exit",
  run_in_background: true
})
```

---

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|--------------|-----|
| Missing `--agent` flag | External model gets default instance with no specialized tools | Always specify `--agent {plugin}:{agent}` |
| Missing `--stdin` flag | claudish expects prompt as argument, truncated for large prompts | Use `--stdin` with `< prompt-file.md` |
| Not capturing exit code | No way to detect failures | Add `; echo $? > result.exit` |
| Not capturing stderr | Error details lost | Add `2>stderr.log` |
| `$(cat file.md)` in Task prompt | Shell expansion doesn't work in JSON string parameters | Read file content first, then include in prompt |

---

## Agent Selection for --agent Flag

| Task Type | Recommended Agent |
|-----------|------------------|
| Investigation/Research | `dev:researcher` |
| Code Review | `agentdev:reviewer` |
| Architecture | `dev:architect` |
| Implementation | `dev:developer` |
| Testing | `dev:test-architect` |
| Debugging | `dev:debugger` |
| DevOps | `dev:devops` |
| UI/Design | `dev:ui` |

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
```

> **Prefix routing:** Use direct API prefixes for cost savings: `oai/` (OpenAI), `g/` (Gemini), `mmax/` (MiniMax), `kimi/` (Kimi), `glm/` (GLM).

---

## Verifying Models Actually Ran

After collecting results from external models, **always verify**:

1. **Check exit code:** `cat {model-slug}.exit` → should be `0`
2. **Check output size:** `wc -c < {model-slug}-result.md` → should be >50 bytes
3. **Check stderr:** `cat {model-slug}-stderr.log` → should be empty or just info
4. **Record in verification table** for /team results display

**Verification checklist:**
```
For each external model result:
  ☐ Exit code is 0
  ☐ Result file exists and has >50 bytes
  ☐ Response contains substantive analysis (not just acknowledgment)
  ☐ No error messages in stderr log
```

---

## Related Skills

- **multimodel:proxy-mode-reference** - Complete claudish CLI documentation with routing prefixes
- **multimodel:multi-model-validation** - Full parallel validation patterns
- **multimodel:model-tracking-protocol** - Progress tracking during reviews
- **multimodel:error-recovery** - Handle failures and timeouts

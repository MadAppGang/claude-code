---
name: agent-enforcement
description: |
  Multi-agent orchestration enforcement for /team command. Prevents PROXY_MODE violations,
  enforces claudish --agent usage, and validates session directory paths.
  Use when debugging /team orchestration failures or adding new PROXY_MODE agents.
triggers:
  - "team enforcement"
  - "proxy mode violation"
  - "agent selection"
  - "orchestration failure"
  - "add proxy agent"
---

# Agent Enforcement Skill

## Overview

Three-layer defense against orchestration violations in `/team`:

1. **Pre-processor** (`scripts/resolve-agents.sh`) — deterministic agent selection
2. **PreToolUse hook** (`hooks/enforce-proxy-mode.sh`) — runtime violation blocker
3. **Model upgrade** (`team.md: model: opus`) — better instruction following

## How It Works

### Layer 1: Pre-processor (resolve-agents.sh)

The `/team` command calls `resolve-agents.sh` BEFORE launching any model. The script:
- Takes `--models` and `--task-type` arguments
- Returns JSON with the exact agent and method for each model
- Removes LLM decision-making from agent selection entirely

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-agents.sh" \
  --models "internal,x-ai/grok-code-fast-1" \
  --task-type "investigation"
```

Output:
```json
{
  "sessionDir": "ai-docs/sessions/team-slug-timestamp-random",
  "taskType": "investigation",
  "resolutions": [
    { "modelId": "internal", "method": "proxy_mode", "agent": "dev:researcher" },
    { "modelId": "x-ai/grok-code-fast-1", "method": "proxy_mode", "agent": "dev:researcher" }
  ]
}
```

### Layer 2: PreToolUse Hook (enforce-proxy-mode.sh)

Intercepts Task and Bash tool calls at runtime. Blocks:

| Rule | Condition | Action |
|------|-----------|--------|
| 1 | PROXY_MODE + non-proxy agent | DENY |
| 2 | claudish without --agent | DENY |
| 3 | /tmp/ in Task prompt | DENY |

### Layer 3: model: opus

The `/team` command uses `model: opus` (Opus 4.6) which follows complex XML instructions
much more reliably than Sonnet (~90% vs ~33% compliance).

## PROXY_MODE-Enabled Agents

These agents have `<proxy_mode_support>` blocks and can handle PROXY_MODE directives:

| Task Type | Primary Agent | Alternatives |
|-----------|--------------|--------------|
| Investigation | dev:researcher | dev:debugger |
| Review | agentdev:reviewer | frontend:reviewer |
| Architecture | dev:architect | frontend:architect, agentdev:architect |
| Implementation | dev:developer | frontend:developer, agentdev:developer |
| Testing | dev:test-architect | frontend:test-architect |
| DevOps | dev:devops | - |
| UI/Design | dev:ui | frontend:designer, frontend:ui-developer |

## Adding a New PROXY_MODE Agent

1. Add `<proxy_mode_support>` block to the agent definition
2. Add agent name to BOTH:
   - `scripts/resolve-agents.sh` → `PROXY_AGENTS` list + `resolve_agent()` case
   - `hooks/enforce-proxy-mode.sh` → `PROXY_AGENTS` list

## Validation

Run the validation suite to test enforcement:

```bash
# Run 5 /team invocations
bash scripts/validate-team-orchestration.sh

# Analyze transcripts
bash scripts/analyze-team-transcript.sh ai-docs/sessions/team-validation-*/
```

Target: >90% compliance across all checks.

## Troubleshooting

**Hook blocking legitimate calls:**
The hook ONLY triggers when `PROXY_MODE` appears in the Task prompt. Normal Task usage
(without PROXY_MODE) is never affected.

**resolve-agents.sh not found:**
The `/team` command falls back to its original decision tree. The hook still provides
runtime protection.

**False positive on claudish --agent:**
The hook skips existence checks (`which claudish`, `command -v claudish`). If you see
a false positive, check if the command starts with a detection pattern.

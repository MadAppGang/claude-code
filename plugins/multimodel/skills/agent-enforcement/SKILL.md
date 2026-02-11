---
name: agent-enforcement
description: |
  Multi-agent orchestration enforcement for /team command. Enforces claudish --agent usage,
  validates session directory paths, and ensures /team internal Tasks use dev:researcher.
  Use when debugging /team orchestration failures.
triggers:
  - "team enforcement"
  - "agent selection"
  - "orchestration failure"
  - "claudish agent flag"
---

# Agent Enforcement Skill

## Overview

Two-layer defense against orchestration violations in `/team`:

1. **PreToolUse hook** (`hooks/enforce-team-rules.sh`) — runtime violation blocker
2. **Model upgrade** (`team.md: model: opus`) — better instruction following

## How /team Invokes Models

| Model Type | Method | Tool | Reliability |
|------------|--------|------|-------------|
| Internal (Claude) | Task(dev:researcher) | Task tool | High (same process) |
| External (Grok, Gemini, etc.) | Bash(claudish --agent --model) | Bash tool | 100% (deterministic CLI) |

External models are called via claudish CLI directly from Bash — no LLM delegation needed.

## Hook Rules (enforce-team-rules.sh)

The PreToolUse hook intercepts Task and Bash tool calls at runtime:

| Rule | Condition | Action |
|------|-----------|--------|
| 1 | /team Task with wrong agent | DENY (must be dev:researcher) |
| 2 | claudish without --agent | DENY |
| 3 | /tmp/ in Task prompt | DENY |

### Layer 1: PreToolUse Hook

Detects /team workflows by vote template pattern in Task prompts. Blocks:

- **Wrong agent for /team Tasks:** Only `dev:researcher` is allowed for internal model Tasks
- **Missing --agent on claudish:** All claudish CLI calls must specify `--agent`
- **Insecure paths:** No `/tmp/` paths in Task prompts (use `ai-docs/sessions/`)

### Layer 2: model: opus

The `/team` command uses `model: opus` (Opus 4.6) which follows complex XML instructions
much more reliably than Sonnet (~90% vs ~33% compliance).

## Agent Selection for --agent Flag

| Task Type | Primary Agent | Alternatives |
|-----------|--------------|--------------|
| Investigation | dev:researcher | dev:debugger |
| Review | agentdev:reviewer | frontend:reviewer |
| Architecture | dev:architect | frontend:architect, agentdev:architect |
| Implementation | dev:developer | frontend:developer, agentdev:developer |
| Testing | dev:test-architect | frontend:test-architect |
| DevOps | dev:devops | — |
| UI/Design | dev:ui | frontend:designer, frontend:ui-developer |

## Pre-processor (resolve-agents.sh)

The `/team` command can optionally call `resolve-agents.sh` to determine agent and method
for each model before launching:

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
    { "modelId": "internal", "method": "direct", "agent": "dev:researcher" },
    { "modelId": "x-ai/grok-code-fast-1", "method": "cli", "agent": "dev:researcher" }
  ]
}
```

Methods:
- `"direct"` — Internal Claude via Task(agent)
- `"cli"` — External model via Bash(claudish --agent --model)

## Validation

Run the test suite to verify enforcement:

```bash
cd autotest/team && bash run-tests.sh
```

## Troubleshooting

**Hook blocking legitimate calls:**
The hook triggers on /team vote template patterns in Task prompts and claudish in Bash commands.
Normal Task usage (without vote templates) is never affected.

**resolve-agents.sh not found:**
The `/team` command uses its own built-in logic. The hook still provides runtime protection.

**False positive on claudish --agent:**
The hook skips existence checks (`which claudish`, `command -v claudish`). If you see
a false positive, check if the command starts with a detection pattern.

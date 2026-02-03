---
name: agentdev-help
description: Show comprehensive help for the Agent Development Plugin - lists agents, commands, skills, and usage examples
allowed-tools: Read
---

# Agent Development Plugin Help

Present the following help information to the user:

---

## Agent Development Plugin v1.1.0

**Create, implement, and review Claude Code agents and commands with multi-model validation.**

### Quick Start

```bash
/agentdev:develop Design a GraphQL code reviewer agent
```

---

## Agents (3)

| Agent | Description | Model |
|-------|-------------|-------|
| **architect** | Designs agent/command architecture, creates comprehensive design plans | Sonnet |
| **developer** | Implements agents/commands from approved design plans | Sonnet |
| **reviewer** | Reviews implemented agents for quality, completeness, standards compliance | Sonnet |

---

## Commands (2)

| Command | Description |
|---------|-------------|
| **/agentdev:develop** | Full-cycle agent development: design → plan review → implement → quality review |
| **/help** | Show this help |

### /develop Workflow

1. **Design Phase** - Architect creates comprehensive design plan
2. **Plan Review** - Multi-model validation of architecture (Grok, Gemini, etc.)
3. **Implementation** - Developer builds the agent from approved plan
4. **Quality Review** - Reviewer validates against standards

### Example

```bash
/agentdev:develop Create a database migration reviewer agent that checks SQL migrations for safety issues
```

---

## Skills (3)

| Skill | Description |
|-------|-------------|
| **xml-standards** | XML tag structure patterns following Anthropic best practices |
| **patterns** | Common agent patterns: proxy mode, Tasks integration, quality checks |
| **schemas** | YAML frontmatter schemas for agent/command files |

---

## Agent File Structure

```yaml
---
name: my-agent
description: When to use this agent with examples
model: sonnet  # or opus, haiku
color: blue
tools: TaskCreate, TaskUpdate, TaskList, TaskGet, Read, Write, Edit, Bash
---

# Agent Instructions

[System prompt and instructions here]
```

---

## Key Patterns

### Proxy Mode
Allows agents to delegate to external AI models:
```
PROXY_MODE: x-ai/grok-code-fast-1
[actual task here]
```

### Tasks Integration
Agents should track progress:
```markdown
1. Create task list at start with TaskCreate
2. Mark tasks in_progress when starting with TaskUpdate
3. Mark completed immediately when done with TaskUpdate
```

### Quality Checks
- YAML frontmatter validation
- XML structure compliance
- Description with examples
- Tool permissions

---

## LLM Performance Tracking (v1.1.0)

Tracks external model performance to `ai-docs/llm-performance.json`:
- Plan review execution times
- Quality review scores
- Model reliability metrics

---

## Dependencies

Requires orchestration plugin:
```json
{
  "dependencies": {
    "orchestration@mag-claude-plugins": "^0.2.0"
  }
}
```

---

## Installation

```bash
# Add marketplace (one-time)
/plugin marketplace add MadAppGang/claude-code

# Install plugin
/plugin install agentdev@mag-claude-plugins
```

**Note**: Automatically installs orchestration plugin as dependency.

---

## More Info

- **Repo**: https://github.com/MadAppGang/claude-code
- **Author**: Jack Rudenko @ MadAppGang

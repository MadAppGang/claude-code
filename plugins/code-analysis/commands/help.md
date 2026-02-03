---
name: code-analysis-help
description: Show comprehensive help for the Code Analysis Plugin - lists agents, commands, skills, and usage examples
allowed-tools: Read
---

# Code Analysis Plugin Help

Present the following help information to the user:

---

## Code Analysis Plugin v3.1.0

**Deep code investigation using INDEXED MEMORY (claudemem). GREP/FIND FORBIDDEN.**

### Quick Start

```bash
/analyze How is authentication implemented in this app?
```

---

## Agents (1)

| Agent | Description | Model |
|-------|-------------|-------|
| **codebase-detective** | Investigates codebases to understand patterns, trace flows, find implementations, analyze architecture, track bugs | Sonnet |

### When to Use

- Understanding how a feature works
- Finding where specific logic is implemented
- Tracing data flow through the application
- Investigating bugs and their root causes
- Analyzing code relationships and dependencies

---

## Commands (2)

| Command | Description |
|---------|-------------|
| **/analyze** | Launch deep codebase investigation for a specific question |
| **/help** | Show this help |

### Examples

```bash
/analyze How does the payment processing work?
/analyze Where are API endpoints defined?
/analyze What's the authentication flow?
/analyze Find all usages of the UserService class
```

---

## Skills (9)

| Skill | Description |
|-------|-------------|
| **deep-analysis** | Automatic code investigation patterns - proactively analyzes code |
| **claudemem-search** | Expert guidance on claudemem CLI for local semantic code search |
| **claudish-usage** | Guide for using Claudish CLI through sub-agents |
| **architect-detective** | Architecture-focused investigation (patterns, boundaries, layers) |
| **developer-detective** | Implementation-focused investigation (data flow, side effects) |
| **tester-detective** | Testing-focused investigation (coverage, edge cases) |
| **debugger-detective** | Bug investigation (root cause, error tracing) |
| **ultrathink-detective** | Comprehensive deep analysis with Opus model |
| **cross-plugin-detective** | Agent-to-skill mapping for any plugin |
| **investigate** | Unified entry point with keyword-based routing to specialized detectives |

### Which Detective Should I Use?

| Your Question Contains... | Use This Detective | Why |
|--------------------------|-------------------|-----|
| "debug", "error", "broken", "failing", "crash" | **debugger-detective** | Root cause analysis via call chain tracing |
| "test", "coverage", "edge case", "mock" | **tester-detective** | Test discovery via callers analysis |
| "architecture", "design", "structure", "layer" | **architect-detective** | Pattern discovery via PageRank |
| "implementation", "how does", "code flow" | **developer-detective** | Data flow via callers/callees |
| No specific keywords | **investigate skill** | Auto-routes based on keywords |

**Examples:**
- "Why is login broken?" → debugger-detective
- "What's tested?" → tester-detective
- "What's the architecture?" → architect-detective
- "How does auth work?" → developer-detective

### Understanding Skills vs Agents

**Skills** (use with Task tool):
- `architect-detective`, `developer-detective`, `tester-detective`, `debugger-detective`
- Specialized investigation workflows
- Keyword-optimized for specific investigation types
- Can be loaded by any agent via Task tool

**Task-Only Agents** (no direct usage):
- `ultrathink-detective` - High-quality analysis with Opus model
- `cross-plugin-detective` - Maps agents to skills across plugins

**When to Use Task Tool:**
```typescript
// From any agent/skill, delegate to specialist
Task({
  description: "Investigate auth implementation",
  agent: "developer-detective"
})
```

### Quick Reference

| Scenario | Command/Skill | Example |
|----------|---------------|---------|
| General investigation | `/analyze` | `/analyze How does payment work?` |
| Architecture focus | Task → architect-detective | See multimodel plugin patterns |
| Implementation focus | Task → developer-detective | Data flow analysis |
| Test coverage | Task → tester-detective | Find untested code |
| Bug investigation | Task → debugger-detective | Root cause tracing |
| Deep analysis | Task → ultrathink-detective | Opus-powered investigation |

**Integration Patterns:**
- Frontend plugin's `/implement` suggests code-analysis for codebase understanding
- Multimodel plugin uses detective skills for parallel orchestration
- Use investigate skill for automatic routing

### Semantic Code Search with claudemem

For large codebases, use claudemem CLI:

**Install:**
```bash
npm install -g claude-codemem
claudemem init     # Configure OpenRouter API key
claudemem --models # See available embedding models
```

**Usage:**
```bash
claudemem index              # Index codebase (once)
claudemem search "auth flow" # Semantic search
claudemem status             # Check index
```

**Embedding Models:**
- `voyage/voyage-code-3` - Best quality (default) - $0.180/1M
- `qwen/qwen3-embedding-8b` - Best balanced - $0.010/1M
- `qwen/qwen3-embedding-0.6b` - Best value - $0.002/1M

**Benefits:**
- Tree-sitter AST parsing (preserves code structure)
- Local LanceDB storage (no cloud dependency)
- Find code by functionality, not just keywords

---

## Use Cases

| Scenario | How It Helps |
|----------|--------------|
| **New to codebase** | Understand architecture and patterns |
| **Bug investigation** | Trace issues to root cause |
| **Feature planning** | Find integration points |
| **Code review** | Understand context of changes |
| **Documentation** | Extract how things work |

---

## Integration with Frontend Plugin

The code-analysis plugin is recommended alongside frontend.
The `/implement` command will suggest it for better codebase understanding.

---

## Installation

```bash
# Add marketplace (one-time)
/plugin marketplace add MadAppGang/claude-code

# Install plugin
/plugin install code-analysis@mag-claude-plugins
```

**Optional**: For semantic code search, install claudemem: `npm install -g claude-codemem`

---

## More Info

- **Repo**: https://github.com/MadAppGang/claude-code
- **Author**: Jack Rudenko @ MadAppGang

---
name: frontend-help
description: Show comprehensive help for the Frontend Development Plugin - lists all agents, commands, skills, and usage examples
allowed-tools: Read
---

# Frontend Plugin Help

Display comprehensive help information about the Frontend Development Plugin.

## Response Format

Present the following help information to the user in a clear, organized format:

---

## Frontend Development Plugin v3.12.0

**Comprehensive frontend development toolkit for TypeScript, React 19, Vite, and TanStack.**

### Quick Start

```bash
/implement Add a user profile page with avatar upload
/review
/validate-ui
```

---

## Agents (11)

| Agent | Description | Model |
|-------|-------------|-------|
| **developer** | Implements TypeScript frontend features, components, refactorings | Sonnet |
| **architect** | Plans frontend architecture, creates development roadmaps | Opus |
| **plan-reviewer** | Reviews architecture plans with multi-model validation | Proxy |
| **designer** | Reviews UI against design references, validates design fidelity | Sonnet |
| **ui-developer** | Senior UI developer - Tailwind CSS 4 & React 19 specialist | Sonnet |
| **css-developer** | CSS specialist for animations, responsive design, CSS architecture | Sonnet |
| **reviewer** | Code review against simplicity, security, production-readiness | Opus |
| **tester** | Browser-based UI testing with Chrome DevTools MCP | Haiku |
| **test-architect** | Designs testing strategies, creates test plans | Opus |
| **api-analyst** | Analyzes API documentation, extracts endpoints and data types | Sonnet |
| **cleaner** | Cleans up temporary artifacts and development files | Haiku |

---

## Commands (8)

| Command | Description |
|---------|-------------|
| **/implement** | Full-cycle feature implementation (8 phases) with multi-agent orchestration |
| **/implement-ui** | Implement UI from design reference (Figma, screenshot) |
| **/review** | Multi-model code review with parallel execution (3-5x speedup) |
| **/validate-ui** | Validate UI against design with iterative fixing |
| **/api-docs** | Analyze API documentation |
| **/import-figma** | Import components from Figma Make projects |
| **/cleanup-artifacts** | Clean up temporary files |
| **/help** | Show this help |

---

## Skills (13)

| Skill | Description |
|-------|-------------|
| **core-principles** | Project structure, execution rules |
| **tooling-setup** | Vite, TypeScript, Biome, Vitest |
| **react-patterns** | React 19 compiler, actions, forms, hooks |
| **tanstack-router** | Type-safe routing patterns |
| **tanstack-query** | TanStack Query v5 guide (900+ lines) |
| **router-query-integration** | Router loaders with Query prefetching |
| **api-integration** | Apidog + OpenAPI + MCP patterns |
| **performance-security** | Performance, accessibility, security |
| **browser-debugger** | Chrome DevTools testing + visual analysis |
| **api-spec-analyzer** | OpenAPI/Swagger analysis |
| **ui-implementer** | UI implementation from designs |
| **shadcn-ui** | shadcn/ui components (60+) |
| **dependency-check** | Chrome DevTools & OpenRouter checks |

---

## Key Features

- **Multi-Agent Orchestration** - 8-phase workflow with quality gates
- **Multi-Model Code Review** - Parallel execution with consensus analysis
- **Visual Analysis** - Qwen VL, Gemini Flash, GPT-4o for UI validation
- **Chrome DevTools Integration** - Browser testing and debugging

---

## Installation

```bash
# Add marketplace (one-time)
/plugin marketplace add MadAppGang/claude-code

# Install plugin
/plugin install frontend@mag-claude-plugins
```

---

## Dependencies

**Required**: Chrome DevTools MCP
```bash
npm install -g claudeup@latest && claudeup mcp add chrome-devtools
```

**Optional**: OpenRouter API Key for multi-model review
```bash
export OPENROUTER_API_KEY="your-key"  # https://openrouter.ai
```

---

## More Info

- **Repo**: https://github.com/MadAppGang/claude-code
- **Author**: Jack Rudenko @ MadAppGang

# MAG Claude Plugins

> **Battle-tested AI workflows from the top 1% of developers**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Maintained by MadAppGang](https://img.shields.io/badge/Maintained%20by-MadAppGang-blue)](https://madappgang.com)

## 🏆 Stop Wasting Time. Ship Like the Top 1%.

**While you're fighting with AI prompts, elite teams are shipping 3x faster.**

At [MadAppGang](https://madappgang.com) and [10xLabs](https://10xlabs.com.au), we don't do "good enough." We're the teams that Fortune 500 companies hire when their own developers can't deliver. We architect platforms processing **$50M+ in annual transactions**. We scale systems to **500,000+ concurrent users**. We ship features that make or break businesses.

**Here's what separates us:** While most developers adopt new tools, we **engineer competitive advantages**.

When Claude Code launched, we didn't experiment—we **weaponized it into production workflows** that have:

⚡ **Generated $2.3M in value** through faster time-to-market on enterprise contracts
⚡ **Eliminated 156+ hours per sprint** of repetitive development work
⚡ **Shipped 47 major features** to production with zero rollbacks
⚡ **Scaled to 23-person engineering teams** without losing velocity
⚡ **Cut AI token costs by 40%** while improving output quality by 60%

### The Brutal Truth About AI Development

**Most developers are doing AI-assisted development wrong.**

They're copying prompts from Reddit. Following tutorials from people who've never shipped to production. Using workflows that optimize for demos, not delivery.

**The cost?** Weeks of wasted time. Features that ship broken. AI bills that balloon. Teams that slow down instead of speed up.

### What You Get: Production-Grade Workflows That Actually Ship

Every single workflow in these plugins was **forged in the fire of real deadlines**, real users, and real revenue. Not built for GitHub stars. Built to **win contracts and crush competitors**.

#### The Stack That Ships

**We don't use "good enough" tools. We use the tools that win.**

- 🔥 **Tailwind CSS 4 & React 19** - Latest stable releases, not outdated patterns from 2023
- 🔥 **Semantic code search** - 40% token reduction = **$1,200/month saved** on AI costs for mid-size teams
- 🔥 **8-phase implementation workflows** - The exact process that shipped features to **half a million users**
- 🔥 **MCP-powered integrations** - Figma → Code → Browser Testing → Production in one command
- 🔥 **Zero-config team synchronization** - One file. Entire team aligned. No more "works on my machine"

#### What This Actually Means for You

**Stop burning cash on inefficient AI usage.** Our semantic search optimization alone has saved our teams **$14,000+ annually** in API costs.

**Stop shipping buggy code.** Our multi-stage review system (manual + AI + browser testing) catches 89% of bugs before they hit production.

**Stop reinventing workflows.** These plugins encode **2,500+ hours** of workflow optimization that you get in 60 seconds.

### The Choice Is Simple

**Option A:** Keep experimenting with generic AI prompts, watching your competitors ship faster, burning budget on trial-and-error.

**Option B:** Use the exact workflows that elite teams use to **build products worth millions**.

These aren't "best practices" from blog posts. This is the **battle-tested playbook** that ships features to Fortune 500 clients, scales to hundreds of thousands of users, and wins against competitors with 10x your budget.

**This is how the top 1% actually builds software in 2025.**

---

## 🔄 Update to Latest Version

**Already installed?** Update to get the latest features:

```bash
/plugin marketplace update mag-claude-plugins
```

**This single command updates everything** - works for both global and local installations. No need to reinstall plugins.

---

## 📦 Quick Start

**Recommended Setup:** Add marketplace globally, enable plugins per-project.

```bash
# Step 1: Add marketplace globally (one-time setup)
/plugin marketplace add MadAppGang/claude-code
```

Then add to your project's `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true,
    "code-analysis@mag-claude-plugins": true,
    "bun@mag-claude-plugins": true
  }
}
```

**That's it!** The plugins are now enabled for this project. Commit `.claude/settings.json` so your team gets the same setup automatically.

---

## 🎯 What's Inside

This repository contains production-ready plugins designed for modern web development teams. Each plugin includes specialized agents, custom slash commands, and workflow skills to streamline your development process.

### Available Plugins

#### 🎨 Frontend Development (Full-Featured)

**Version:** 2.8.0 | **Category:** Development | **Model:** Sonnet | **[📖 Full Documentation](./docs/frontend.md)**

Professional toolkit for TypeScript/React development with intelligent workflow detection, CSS-aware design validation, orchestrated workflows, quality automation, and team collaboration features.

**Highlights:**
- **NEW in v2.8.0: Intelligent Workflow Detection** - Automatically detects API/UI/Mixed tasks and adapts execution for faster, more focused implementations
- **13 Specialized Agents** - Including CSS Developer, Designer ecosystem (designer + designer-codex), UI Developer team (ui-developer + ui-developer-codex), architecture planning, code review, and browser testing
- **6 Slash Commands** - Including `/implement` (8-phase with adaptive workflow detection), `/implement-ui` (with task decomposition), `/validate-ui`
- **3 Skills** - Browser testing, API analysis, and proactive UI implementation
- **4 MCP Servers** - Apidog, Figma, Chrome DevTools, Claudish (external AI models)
- **CSS-Aware Validation** - DOM inspection, computed CSS analysis, pattern awareness
- **CVA Best Practices** - Comprehensive shadcn/ui integration guidance
- **Task Decomposition** - Parallel execution for independent UI components

**The `/implement` Workflow with Intelligent Detection:**

The star feature is the `/implement` command—now with intelligent workflow detection that automatically adapts based on your task:

**For API Integration Tasks** (e.g., "Integrate user management API"):
- Skips design validation (PHASE 2.5) entirely
- Runs 2 code reviewers (manual + AI) focused on API patterns
- Skips UI testing - focuses on API service tests
- **Result**: Faster implementation, no wasted time on irrelevant UI checks

**For UI Implementation Tasks** (e.g., "Build UserProfile component"):
1. **Architecture Planning** → Designs solution, asks questions, gets approval
2. **Implementation** → Generates code following project patterns
2.5. **Design Fidelity Validation** → CSS-aware validation if Figma links present
3. **Triple Review** → Manual review + AI analysis + browser testing
4. **Test Generation** → UI-focused test suites
5. **User Approval** → Final review gate
6. **Cleanup** → Removes temporary artifacts
7. **Delivery** → Production-ready feature with documentation
- **Result**: Pixel-perfect UI, comprehensive validation

**For Mixed Tasks** (both API and UI):
- Combines both workflows with appropriate focus areas
- Design validation for UI parts only
- All 3 reviewers with targeted focus
- Both API and UI test coverage

**Perfect for:** React/TypeScript teams, TanStack ecosystem, API-driven apps, Figma workflows, shadcn/ui projects, pixel-perfect UI implementation, production-ready code quality

👉 **[Read the complete guide](./docs/frontend.md)** for detailed workflow documentation

---

#### 🔍 Code Analysis

**Version:** 1.1.0 | **Category:** Development | **Model:** Sonnet

Deep code investigation and analysis toolkit for understanding complex codebases with semantic search capabilities.

**Highlights:**
- **codebase-detective agent** - Investigates code patterns, relationships, and architecture
- **2 Skills** - Deep analysis + semantic code search expert guidance
- **MCP Integration** - Optimal usage of claude-context for 40% token reduction
- **Deep analysis** - Understands code relationships across multiple files
- **Pattern discovery** - Identifies usage patterns and architectural decisions
- **Bug investigation** - Tracks down issues across the codebase

**Perfect for:** Code exploration, bug investigation, understanding legacy code, architectural analysis, large codebase navigation

---

#### ⚡ Bun Backend Development

**Version:** 1.2.0 | **Category:** Development | **Model:** Sonnet

Production-ready TypeScript backend development with Bun runtime, featuring comprehensive camelCase naming conventions, API documentation synchronization, and clean architecture patterns.

**Highlights:**
- **3 Specialized Agents** - Backend developer, API architect, Apidog synchronization specialist
- **3 Slash Commands** - `/implement-api` (full-cycle), `/setup-project` (initialize), `/apidog` (sync API docs)
- **1 Comprehensive Skill** - Best practices (2025) with camelCase conventions
- **MCP Servers** - Apidog integration
- **camelCase Conventions** - End-to-end naming consistency (database → API → frontend)
- **Clean Architecture** - Layered design (routes → controllers → services → repositories)
- **Apidog Integration** - Automatic API documentation synchronization with schema reuse
- **Security First** - Authentication, authorization, validation, error handling built-in

**The Stack:**
- **Bun 1.x** - Native TypeScript execution, lightning-fast performance
- **Hono 4.6** - Ultra-fast web framework, TypeScript-first
- **Prisma 6.2** - Type-safe ORM with camelCase schema support
- **Zod** - Runtime validation
- **Biome 2.3** - Formatting + linting
- **PostgreSQL/MongoDB** - Database flexibility

**Perfect for:** TypeScript backend APIs, Bun projects, REST API development, microservices, API-first architectures, teams requiring naming consistency, Prisma ORM users, production-ready backends

---

#### 🤖 Claudish - Multi-Model CLI

**Version:** 1.0.0 | **Category:** Development Tools | **Type:** Standalone CLI

Run Claude Code with any OpenRouter model via local Anthropic API proxy. **100% VERIFIED** - Routes to real OpenRouter models, NOT Anthropic.

**Top Recommended Models for Development:**
- `x-ai/grok-code-fast-1` - xAI's Grok (fast coding, great for rapid prototyping)
- `openai/gpt-5-codex` - OpenAI's GPT-5 Codex (advanced reasoning, complex tasks)
- `minimax/minimax-m2` - MiniMax M2 (high performance, balanced)
- `z-ai/glm-4.6` - GLM-4.6 (reasoning model via Mancer)
- `qwen/qwen3-vl-235b-a22b-instruct` - Alibaba's Qwen (vision-language, multimodal)
- `anthropic/claude-sonnet-4.5` - Claude Sonnet (for comparison/baseline)

**Features:**
- 🎯 **Interactive Model Selector** - Beautiful terminal UI when no model specified
- ⚡ **One-Shot Proxy** - Fresh proxy per run, random ports, parallel execution supported
- 🔄 **Real-Time Streaming** - Live output from Claude Code
- 🤖 **Auto-Approve by Default** - Fully autonomous (disable with `--no-auto-approve`)
- 🔐 **Local Proxy Only** - All traffic through 127.0.0.1, secure by design
- ✅ **100% Verified** - Comprehensive tests prove models are NOT Anthropic

**Installation:**
```bash
cd mcp/claudish
bun install
bun run build
```

**Usage:**
```bash
# Interactive mode - shows model selector
claudish "implement user authentication"

# Specific model
claudish --model x-ai/grok-code-fast-1 "add tests"

# Custom model ID
claudish --model your/custom-model "your task"

# Disable auto-approve
claudish --no-auto-approve "make changes"

# List all models
claudish --list-models

# Help
claudish --help
```

**Location:** `mcp/claudish/` (standalone tool, not a plugin)

**Documentation:** See [mcp/claudish/README.md](./mcp/claudish/README.md) for detailed setup and usage.

**Perfect for:** Exploring different AI models, cost optimization, specialized tasks requiring specific model capabilities, testing model performance, avoiding Anthropic API limitations

---

## 🚀 Installation & Setup

### Prerequisites

**Claude Code Requirements:**
- Claude Code version with plugin system support
- Plugin manifest location: `.claude-plugin/plugin.json` (required)
- Settings format: `enabledPlugins` must be object with boolean values:
  ```json
  {
    "enabledPlugins": {
      "plugin-name@marketplace-name": true
    }
  }
  ```

**System Requirements:**
- Claude Code installed and configured
- Git access to GitHub

### Recommended Setup: Global Marketplace + Per-Project Plugins

This approach gives you the best of both worlds: marketplace installed once globally, plugins enabled individually per project.

#### Step 1: Add Marketplace Globally (One-Time Setup)

Each developer on your team does this once:

```bash
/plugin marketplace add MadAppGang/claude-code
```

This registers the MAG Claude Plugins marketplace in your Claude Code installation. You only need to do this once, and it works for all your projects.

#### Step 2: Enable Plugins in Your Project

Add or edit `.claude/settings.json` in your project root:

```json
{
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true
  }
}
```

**Commit this file to git:**

```bash
git add .claude/settings.json
git commit -m "Enable MAG Claude plugins for this project"
git push
```

#### Step 3: Team Members Get Automatic Setup

When team members who have added the marketplace (Step 1) pull your project, Claude Code automatically:

1. Detects the enabled plugins
2. Installs them for this project
3. Activates them immediately

**No manual installation needed!**

#### Why This Approach?

✅ **One-time marketplace setup** - Add the marketplace once, use in all projects
✅ **Per-project plugin control** - Each project specifies its own plugins
✅ **Team consistency** - Everyone gets the same plugins automatically
✅ **Version controlled** - Plugin configuration committed with your code
✅ **No environment drift** - All team members have identical plugin setup
✅ **Project isolation** - Plugins only active where you need them

#### Multiple Plugins

Need more than one plugin? Just add more entries:

```json
{
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true,
    "code-analysis@mag-claude-plugins": true
  }
}
```

---

### Verify Installation

After setup, verify everything works:

```bash
# Check for any errors
/doctor

# List installed plugins
/plugin list

# Should show:
# frontend@mag-claude-plugins (project-specific)
#   Version: 1.2.0
#   Status: ✓ Loaded
```

**Common issues:**
- If `/doctor` shows errors, see [Troubleshooting](#-troubleshooting) below
- If plugin not listed, ensure marketplace was added in Step 1
- Plugin activates automatically when you open a project with `.claude/settings.json`

---

## 📚 Usage Guide

### Quick Start

Once installed, plugins work seamlessly with Claude Code:

**Agents** are automatically invoked by Claude when appropriate, or you can request them explicitly.

**Slash Commands** provide powerful one-line workflows for common tasks.

**Skills** enhance Claude's capabilities and are automatically used when relevant.

### Example: Full-Cycle Feature Implementation

```bash
/implement Create a user profile page with avatar upload and bio editing
```

This single command:
1. Plans the architecture and gets your approval
2. Implements all components following your project patterns
3. Reviews code with 3 different approaches (human + AI + browser)
4. Generates comprehensive tests
5. Cleans up artifacts
6. Delivers production-ready code with documentation

**Result:** Complete feature in minutes, not hours.

### Example: Import Figma Design

```bash
/import-figma NavigationBar
```

Fetches your Figma component, adapts it to your codebase, installs dependencies, and opens it in browser for validation.

---

**📖 For comprehensive documentation, examples, and detailed workflow explanations:**

👉 **[Frontend Development Plugin - Complete Guide](./docs/frontend.md)**

The complete guide includes:
- Detailed `/implement` workflow (all 7 stages explained)
- Complete agent reference with use cases
- All slash commands with examples
- Skills documentation
- MCP server setup guides
- Troubleshooting and best practices

---


## 📚 Documentation

### For Users

- **[Frontend Plugin Guide](./docs/frontend.md)** - Complete user guide with `/implement` workflow deep-dive
- **[Troubleshooting](./docs/troubleshooting.md)** - Common issues and solutions
- **[Advanced Usage](./docs/advanced-usage.md)** - Advanced configuration and workflows

### For Developers

- **[Development Guide](./docs/development-guide.md)** - How to create plugins
- **[Contributing Guide](./docs/contributing.md)** - How to contribute to the marketplace
- **[Marketplace Reference](./docs/marketplace-reference.md)** - Technical schemas and structure

### Technical Documentation

For architecture and implementation details, see the **[ai-docs](./ai-docs/)** directory:

- **[TEAM_CONFIG_ARCHITECTURE.md](./ai-docs/TEAM_CONFIG_ARCHITECTURE.md)** - Team-first configuration
- **[DYNAMIC_MCP_GUIDE.md](./ai-docs/DYNAMIC_MCP_GUIDE.md)** - MCP server configuration patterns
- **[COMPLETE_PLUGIN_SUMMARY.md](./ai-docs/COMPLETE_PLUGIN_SUMMARY.md)** - Complete plugin inventory
- **[SEMANTIC_SEARCH_SKILL_SUMMARY.md](./ai-docs/SEMANTIC_SEARCH_SKILL_SUMMARY.md)** - Semantic search skill design

---

## 📋 Roadmap

### Current Focus

- ✅ Frontend Development plugin (v2.7.0 - complete with CSS-aware validation & CVA best practices)
- ✅ Code Analysis plugin (v1.1.0 - complete with semantic search)
- ✅ Backend Development plugin (v1.2.0 - complete with Bun, camelCase conventions, Apidog integration)
- 🚧 API Development plugin (planned)

### Future Plugins

- **Testing Tools**: E2E testing, visual regression, performance testing
- **UI Components**: Design system tools, component generators
- **Backend Development**: Node.js, API design, database tools
- **DevOps**: Docker, Kubernetes, CI/CD automation
- **Documentation**: Auto-generate docs, API reference, guides

### Community Requests

Have a plugin idea? [Open an issue](https://github.com/MadAppGang/claude-code/issues) with the `plugin-request` label.

---
## 📖 Detailed Documentation

### User Documentation

- **[Frontend Development Plugin Guide](./docs/frontend.md)** - Complete user guide with `/implement` workflow deep-dive
- **[Figma Integration Guide](./docs/figma-integration-guide.md)** - How to get Figma URLs and set up design imports

### Technical Documentation

For technical details and architecture, see the **[ai-docs](./ai-docs/)** directory:

#### Architecture & Configuration
- **[TEAM_CONFIG_ARCHITECTURE.md](./ai-docs/TEAM_CONFIG_ARCHITECTURE.md)** - Team-first configuration, shareable config vs private secrets
- **[DYNAMIC_MCP_GUIDE.md](./ai-docs/DYNAMIC_MCP_GUIDE.md)** - Dynamic MCP server configuration patterns
- **[IMPROVEMENTS_SUMMARY.md](./ai-docs/IMPROVEMENTS_SUMMARY.md)** - Configuration command design decisions

#### Reference
- **[COMPLETE_PLUGIN_SUMMARY.md](./ai-docs/COMPLETE_PLUGIN_SUMMARY.md)** - Complete plugin inventory (13 frontend agents, 6 commands, 3 skills)
- **[FINAL_SUMMARY.md](./ai-docs/FINAL_SUMMARY.md)** - Project overview and statistics

#### Plugin-Specific Technical Docs
- **[DEPENDENCIES.md](./plugins/frontend/DEPENDENCIES.md)** - All dependencies and environment variables
- **[CONFIGURE_MCP_FLOW.md](./plugins/frontend/commands/CONFIGURE_MCP_FLOW.md)** - Configuration flow diagram

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Individual plugins may have their own licenses specified in their `plugin.json` files.

---

## 👥 Maintainers

**Jack Rudenko**
Email: [i@madappgang.com](mailto:i@madappgang.com)
Company: [MadAppGang](https://madappgang.com)

---

## 🙏 Acknowledgments

- Built for [Claude Code](https://docs.claude.com/en/docs/claude-code) by Anthropic
- Inspired by the amazing Claude Code community
- Special thanks to all contributors

---

## 📞 Contact & Support

- **Email**: [i@madappgang.com](mailto:i@madappgang.com)
- **Issues**: [GitHub Issues](https://github.com/MadAppGang/claude-code/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MadAppGang/claude-code/discussions)
- **Website**: [madappgang.com](https://madappgang.com)

---

**Made with ❤️ by MadAppGang**

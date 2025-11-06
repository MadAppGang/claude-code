# Frontend Development Plugin

Professional frontend development toolkit for Claude Code with TypeScript, React, Vite, TanStack Router & Query support. Features intelligent workflow detection (API/UI/Mixed), CSS-aware design validation, CVA best practices for shadcn/ui, and modern UI development workflows.

**Version:** 2.8.0

## Quick Start

### Installation

```bash
# Add marketplace
/plugin marketplace add MadAppGang/claude-code

# Install plugin
/plugin install frontend@mag-claude-plugins
```

### Setup

1. **Configure environment variables** (required for MCP servers):
   ```bash
   # Copy example
   cp .env.example .env

   # Edit with your tokens
   APIDOG_API_TOKEN=your-token
   FIGMA_ACCESS_TOKEN=your-token
   ```

2. **Run configuration wizard**:
   ```bash
   /configure-mcp
   ```

## Available Tools

### Agents (13)

**Development:**
- `developer` - TypeScript/React implementation with best practices
- `architect` - Architecture planning and system design
- `test-architect` - Testing strategy and implementation

**UI Development & Design:**
- `ui-developer` - Senior UI/UX developer specializing in pixel-perfect implementation (React 19, Tailwind CSS 4, WCAG 2.1 AA)
- `ui-developer-codex` - Expert UI review proxy via external Codex AI
- `designer` - Senior UX/UI design review specialist with CSS-aware validation (DOM inspection, computed CSS analysis)
- `designer-codex` - Expert design validation proxy via external Codex AI
- `css-developer` - CSS architecture specialist maintaining CSS knowledge files (.ai-docs/css-knowledge/), preventing breaking changes, enforcing modern CSS + Tailwind CSS 4 best practices

**Quality Assurance:**
- `tester` - Browser-based UI testing and validation
- `reviewer` - Manual code review
- `codex-reviewer` - AI-powered code review with Codex

**Analysis:**
- `api-analyst` - API docs analysis and integration

**Utilities:**
- `cleaner` - Cleanup temporary files and artifacts

### Commands (6)

**Development Workflows:**
- `/implement` - **NEW in v2.8.0**: Full-cycle feature implementation with intelligent workflow detection and adaptive execution (8 phases)
  - Automatically detects API-focused, UI-focused, or Mixed workflows
  - API workflows: Skips design validation, runs 2 code reviewers, focuses on API testing
  - UI workflows: Full design validation, runs 3 reviewers (code + codex + UI tester)
  - Mixed workflows: Both workflows combined with appropriate focus
- `/implement-ui` - Implement UI components from scratch with task decomposition and intelligent agent switching
- `/import-figma` - Import Figma designs as React components
- `/api-docs` - Analyze and integrate API documentation

**UI Validation:**
- `/validate-ui` - UI validation workflow with designer & ui-developer agents

**Configuration:**
- `/configure-mcp` - Configure MCP servers (Apidog, Figma, GitHub)

**Maintenance:**
- `/cleanup-artifacts` - Clean temporary files, build artifacts, and caches

### Skills (3)

**Browser Integration:**
- `browser-debugger` - Interactive UI testing and debugging in Chrome

**API Analysis:**
- `api-spec-analyzer` - OpenAPI/Swagger specification analysis

**UI Implementation:**
- `ui-implementer` - Proactive UI implementation from design references (automatically triggers on Figma links)

### MCP Servers (3)

**Integrated Services:**
- **Apidog** - API documentation and testing platform
- **Figma** - Design file access and component extraction
- **GitHub** - Repository integration and PR management

## Key Features

### Intelligent Workflow Detection (v2.8.0+)

**Automatically adapts implementation workflow based on task type:**

#### API-Focused Workflows
For tasks like "Integrate tenant management API" or "Add error handling to API calls":
- **PHASE 2.5 (Design Validation)**: Completely skipped - no UI changes to validate
- **PHASE 3 (Code Review)**: Runs 2 reviewers in parallel (code + codex)
  - Focus: API patterns, type safety, error handling, HTTP security
  - UI tester skipped - no UI to test
- **PHASE 4 (Testing)**: API-focused tests
  - Unit tests for services, integration tests, mock responses, error scenarios
  - Skips UI component tests

**Benefits**: Faster implementation, focused reviews, no time wasted on irrelevant UI validation

#### UI-Focused Workflows
For tasks like "Implement UserProfile component" or "Style the Dashboard screen":
- **PHASE 2.5 (Design Validation)**: Full design fidelity validation (if Figma present)
  - Designer agent validates visual accuracy
  - UI Developer fixes discrepancies
- **PHASE 3 (Code Review)**: Runs 3 reviewers in parallel (code + codex + UI tester)
  - Focus: Component quality, accessibility, responsive design, visual consistency
- **PHASE 4 (Testing)**: UI-focused tests
  - Component tests, interaction tests, accessibility tests

**Benefits**: Pixel-perfect UI, comprehensive validation, high design fidelity

#### Mixed Workflows
For tasks with both API and UI work:
- **PHASE 2.5**: Design validation for UI components only
- **PHASE 3**: All 3 reviewers with appropriate focus areas
- **PHASE 4**: Both API and UI test coverage

**How It Works:**
1. Analyzes your feature request for indicators (keywords, patterns)
2. Classifies as API_FOCUSED, UI_FOCUSED, or MIXED
3. If unclear, asks you to confirm
4. Adapts all subsequent phases based on workflow type
5. Logs workflow type in final summary for transparency

### CSS-Aware Design Validation (v2.6.0+)
- **DOM Inspection** - Designers inspect actual rendered elements via Chrome DevTools MCP
- **Computed CSS Analysis** - Get real browser-computed styles (actual values, not just class names)
- **Pattern Awareness** - Consult CSS Developer to understand existing CSS patterns before suggesting fixes
- **Safe Fix Recommendations** - Impact assessment (LOCAL/GLOBAL) for each suggested change
- **Benefits:** No more guessing why UI looks different, understand which CSS rules apply, prevent breaking changes

### CVA Best Practices for shadcn/ui (v2.6.1+)
- **Comprehensive CVA Guidance** in CSS Developer and UI Developer agents
- **Type-Safe Component Variants** with IDE autocomplete
- **Decision Trees** for when to use className vs variant props
- **Troubleshooting Guide** for common CVA issues
- **No Anti-Patterns** - Prevents !important usage and CSS class conflicts
- **Benefits:** Centralized style management, reusable patterns, consistent with shadcn/ui best practices

### Task Decomposition (v2.5.0+)
- **PHASE 1.5** in `/implement-ui` - Architect analyzes design and splits into independent tasks
- **Parallel Execution** - Tasks with no dependencies run simultaneously
- **Per-Task Validation** - Each task gets focused validation loop (max 5 iterations)
- **Isolated Changes** - Changes to Task A can't break Task B
- **Benefits:** Faster implementation, clearer progress tracking, no cascade failures

### CSS Knowledge Management (v2.5.0+)
- **Automatic Documentation** - CSS Developer maintains `.ai-docs/css-knowledge/` directory
- **7 Knowledge Files** - design-tokens, component-patterns, utility-patterns, element-rules, global-styles, change-log
- **Change Impact Assessment** - HIGH/MEDIUM/LOW risk levels for CSS modifications
- **Pattern Tracking** - Knows what CSS patterns exist and where they're used
- **Benefits:** Prevents breaking changes, maintains consistent CSS architecture, enforces modern patterns

### Modern Best Practices (2025)
- **Tailwind CSS 4** - CSS-first configuration with @theme, container queries, :has() pseudo-class
- **React 19** - Functional components, modern hooks, Server Components
- **Accessibility** - WCAG 2.1 AA compliance, color contrast, keyboard navigation
- **Performance** - 5x faster full builds, 100x faster incremental (Tailwind CSS 4)

## Environment Variables

### Required

```bash
# Apidog (API documentation)
APIDOG_API_TOKEN=your-personal-token

# Figma (design imports)
FIGMA_ACCESS_TOKEN=your-personal-token
```

### Optional

```bash
# GitHub integration
GITHUB_PERSONAL_ACCESS_TOKEN=your-token

# Chrome for UI testing (auto-detected)
CHROME_EXECUTABLE_PATH=/path/to/chrome

# Codex code review
CODEX_API_KEY=your-codex-key
```

## Usage Examples

### Full Feature Implementation

```bash
/implement

# Claude will:
# 1. Plan architecture with architect
# 2. Implement with developer
# 2.5. Validate design fidelity with designer (if Figma links present)
# 3. Write tests with test-architect
# 4. Review code with reviewer
# 5. Validate UI with tester
# 6. Clean up artifacts
# 7. Deliver production-ready code
```

### UI Implementation from Design

```bash
/implement-ui

# Claude will:
# 1. Analyze design reference (Figma URL, screenshot, mockup)
# 1.5. Decompose into independent tasks with dependencies
# 2. Implement each task with ui-developer
# 3. Validate with designer (CSS-aware validation)
# 4. Auto-switch to ui-developer-codex if needed (after 2 consecutive failures)
# 5. Iterate until design fidelity >= 54/60 (max 10 iterations)
# 6. Complete all tasks with comprehensive metrics
```

### Design Validation Workflow

```bash
/validate-ui

# Claude will:
# 1. Capture screenshot of current implementation
# 2. Inspect DOM elements and get computed CSS
# 3. Consult css-developer for pattern analysis
# 4. Compare design vs implementation with CSS awareness
# 5. Generate CSS-aware report with safe fix recommendations
# 6. Optionally use designer-codex for expert validation
```

### Import Figma Design

```bash
/import-figma

# Imports components from Figma Dev Mode
# See: docs/figma-integration-guide.md for URL setup
```

**Need help getting Figma URLs?** See the [Figma Integration Guide](../../docs/figma-integration-guide.md) for:
- How to get Figma Make URLs from Dev Mode
- Setting up CLAUDE.md with Figma links
- Troubleshooting common issues

### API Documentation Workflow

```bash
/api-docs

# Options:
# - Fetch from Apidog
# - Analyze OpenAPI spec
# - Generate TypeScript types
# - Create API client code
```

### Configure MCP Servers

```bash
/configure-mcp

# Interactive wizard:
# - Validates existing configuration
# - Prompts for missing credentials
# - Tests connections
# - Saves to .claude/settings.json
```

## Team Setup

### Project Configuration

Add to your project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "mag-claude-plugins": {
      "source": {
        "source": "github",
        "repo": "MadAppGang/claude-code"
      }
    }
  },
  "enabledPlugins": {
    "frontend@mag-claude-plugins": true
  },
  "env": {
    "APIDOG_PROJECT_ID": "your-project-id",
    "APIDOG_API_TOKEN": "${APIDOG_API_TOKEN}"
  }
}
```

### Environment Variables (.env)

Each developer creates their own `.env`:

```bash
# .env (gitignored, per-developer)
APIDOG_API_TOKEN=personal-token
FIGMA_ACCESS_TOKEN=personal-token
GITHUB_PERSONAL_ACCESS_TOKEN=personal-token
```

## Dependencies

### System Requirements

- **Node.js** v18+ (with npm/npx)
- **Chrome** browser (for UI testing)
- **Git** (for version control)

### Optional

- **Codex CLI** (for AI code review)

## Architecture

### Stack Support

**Frontend:**
- TypeScript
- React 18+
- Vite
- TanStack Router
- TanStack Query
- Tailwind CSS

**Testing:**
- Vitest
- Testing Library
- Playwright (via browser-debugger)

**Code Quality:**
- ESLint
- Prettier
- TypeScript strict mode

## Troubleshooting

### MCP Servers Not Available

```bash
# Check configuration
cat .claude/settings.json

# Verify environment variables
echo $APIDOG_API_TOKEN

# Reconfigure
/configure-mcp
```

### UI Testing Not Working

```bash
# Check Chrome installation
which google-chrome-stable

# Set explicit path
export CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome
```

### Codex Review Not Working

```bash
# Install Codex CLI
npm install -g @codexdata/cli

# Verify installation
codex --version

# Set API key
export CODEX_API_KEY=your-key
```

## Documentation

**Plugin Documentation:**
- [Team Configuration Architecture](../../ai-docs/TEAM_CONFIG_ARCHITECTURE.md)
- [Dynamic MCP Guide](../../ai-docs/DYNAMIC_MCP_GUIDE.md)
- [Complete Plugin Summary](../../ai-docs/COMPLETE_PLUGIN_SUMMARY.md)

**External Resources:**
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Plugin Development Guide](https://docs.claude.com/en/docs/claude-code/plugins)

## License

MIT License - see [LICENSE](../../LICENSE) for details

## Author

**Jack Rudenko**
Email: i@madappgang.com
Company: MadAppGang

## Support

- **Issues**: [GitHub Issues](https://github.com/madappgang/claude-plugins/issues)
- **Discussions**: [GitHub Discussions](https://github.com/madappgang/claude-plugins/discussions)

---

**Version**: 2.6.1
**Last Updated**: November 6, 2025

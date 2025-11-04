# Frontend Development Plugin

Professional frontend development toolkit for Claude Code with TypeScript, React, Vite, TanStack Router & Query support.

## Quick Start

### Installation

```bash
# Add marketplace
/plugin marketplace add madappgang/claude-plugins

# Install plugin
/plugin install frontend-development@mag-claude-plugins
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

### Agents (8)

**Development:**
- `typescript-frontend-dev` - TypeScript/React implementation with best practices
- `frontend-architect-planner` - Architecture planning and system design
- `vitest-test-architect` - Testing strategy and implementation

**Quality Assurance:**
- `ui-manual-tester` - Browser-based UI testing and validation
- `senior-code-reviewer` - Manual code review
- `senior-code-reviewer-codex` - AI-powered code review with Codex

**Analysis:**
- `api-documentation-analyzer` - API docs analysis and integration

**Utilities:**
- `project-cleaner` - Cleanup temporary files and artifacts

### Commands (5)

**Development Workflows:**
- `/implement` - Full-cycle feature implementation (plan → code → test → review)
- `/import-figma` - Import Figma designs as React components
- `/api-docs` - Analyze and integrate API documentation

**Configuration:**
- `/configure-mcp` - Configure MCP servers (Apidog, Figma, GitHub, PostgreSQL)

**Maintenance:**
- `/cleanup-artifacts` - Clean temporary files, build artifacts, and caches

### Skills (2)

**Browser Integration:**
- `browser-debugger` - Interactive UI testing and debugging in Chrome

**API Analysis:**
- `api-spec-analyzer` - OpenAPI/Swagger specification analysis

### MCP Servers (4)

**Integrated Services:**
- **Apidog** - API documentation and testing platform
- **Figma** - Design file access and component extraction
- **GitHub** - Repository integration and PR management
- **PostgreSQL** - Database query and schema inspection

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

# PostgreSQL database
POSTGRES_CONNECTION_STRING=postgresql://localhost/db

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
# 1. Plan architecture with frontend-architect-planner
# 2. Implement with typescript-frontend-dev
# 3. Write tests with vitest-test-architect
# 4. Review code with senior-code-reviewer
# 5. Validate UI with ui-manual-tester
```

### Import Figma Design

```bash
/import-figma

# Provide Figma URL when prompted
# Claude extracts components and generates React code
```

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
        "repo": "madappgang/claude-plugins"
      }
    }
  },
  "enabledPlugins": [
    "frontend-development@mag-claude-plugins"
  ],
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

**Version**: 1.0.0
**Last Updated**: November 4, 2024

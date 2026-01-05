# claudeup

TUI tool for managing Claude Code plugins, MCPs, and configuration.

## Installation

```bash
# Using pnpm
pnpm add -g claudeup

# Using pnpx (no install)
pnpx claudeup

# Using npm
npm install -g claudeup

# Using Bun
bun add -g claudeup
```

## Features

### 1. MCP Server Setup
Configure Model Context Protocol servers with a curated list:
- **File System** - Read/write files, search directories
- **Database** - SQLite, PostgreSQL connections
- **Developer Tools** - GitHub, GitLab, Chrome DevTools, Puppeteer
- **API & Web** - HTTP requests, Brave Search
- **Productivity** - Google Drive, Slack, Memory
- **AI & Intelligence** - Claude Context (semantic search), Sequential Thinking

### 2. Plugin Marketplaces
Add official and community plugin marketplaces:
- **Anthropic Official** - Official Claude Code plugins
- **MadAppGang** - Frontend, Backend, Code Analysis plugins

### 3. Manage Plugins
Install and configure plugins from added marketplaces:
- Frontend Development (React/TypeScript)
- Code Analysis (Deep investigation)
- Bun Backend (TypeScript backend)
- Orchestration (Multi-agent patterns)
- Agent Development (Create agents)

### 4. Status Line Configuration
Configure the Claude Code status line with presets:
- Minimal, Standard, Detailed
- Git-aware, Token-focused
- Time-tracking, Developer

## Usage

```bash
# Launch TUI
claudeup

# Or with npx
npx claudeup
```

### Navigation
- `↑/↓` or `j/k` - Move selection
- `Enter` - Select item
- `Escape/q` - Go back / Exit
- `?` - Show help
- `1-4` - Quick jump to screens

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development
pnpm start:bun  # With Bun
pnpm start      # With Node
```

## Configuration Files

claudeup modifies these Claude Code configuration files:

- `.claude/settings.json` - Shared settings (plugins, marketplaces)
- `.claude/settings.local.json` - Local settings (MCP servers, allowMcp)

## Release Process

Releases are automated via GitHub Actions using [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) with OIDC - no tokens required.

### One-Time Setup

1. **Publish first version manually** (required for new packages):
   ```bash
   npm run build
   npm publish --access public
   ```

2. **Configure Trusted Publisher on npmjs.com** (already done):
   - Repository: `MadAppGang/claude-code`
   - Workflow: `claudeup-release.yml`

### Releasing New Versions

```bash
# 1. Update version in package.json
npm version patch  # or minor, major

# 2. Push the tag
git push origin main --tags
```

This triggers:
1. **claudeup-release.yml** - Builds and publishes to npm via OIDC (no tokens needed)
2. **create-release.yml** - Creates a GitHub release with changelog

### Manual Release

```bash
npm run build
npm publish --access public
```

## License

MIT

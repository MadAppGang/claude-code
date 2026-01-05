# Dev Plugin

**Version:** 1.1.0
**Type:** General-Purpose Development Plugin
**License:** MIT

## Overview

The **Dev Plugin** is a universal, language-agnostic development assistant that automatically loads framework-specific skills based on project context. Unlike specialized plugins (frontend, bun), this plugin adapts to ANY technology stack by detecting project type and loading appropriate skills dynamically.

**Key Innovation:** Context-aware skill auto-loading based on file extensions, config files, and project structure patterns.

## Features

- **Automatic Stack Detection**: Detects React, Vue, Go, Bun, Python, Rust projects
- **Multi-Stack Support**: Recognizes fullstack projects (e.g., React + Go)
- **Context-Aware Skills**: Loads relevant skills automatically based on detected stack
- **5 Orchestrator Commands**: help, implement, debug, feature, architect
- **15+ Technology Skills**: Frontend, backend, and language-specific patterns
- **Multi-Model Validation**: External AI model reviews via Claudish (optional)
- **Quality Gate Enforcement**: Automatic format, lint, typecheck, test checks

## Installation

### Via Plugin Marketplace

```bash
# Install from MadAppGang marketplace
/plugin marketplace add MadAppGang/claude-code
```

### Enable in Settings

Add to `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "dev@mag-claude-plugins": true,
    "orchestration@mag-claude-plugins": true
  }
}
```

### Local Development

```bash
# Clone repository
git clone https://github.com/MadAppGang/claude-code.git
cd claude-code

# Add as local marketplace
/plugin marketplace add /path/to/claude-code

# Enable in .claude/settings.json
{
  "enabledPlugins": {
    "dev@mag-claude-plugins": true,
    "orchestration@mag-claude-plugins": true
  }
}
```

## Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/dev:help` | Show plugin help and detected stack | `/dev:help` |
| `/dev:implement` | Implement features with auto-detected stack | `/dev:implement Create user authentication` |
| `/dev:debug` | Debug errors and investigate issues | `/dev:debug TypeError in UserProfile` |
| `/dev:feature` | Full feature development lifecycle | `/dev:feature Add OAuth2 login` |
| `/dev:architect` | Architecture planning and design | `/dev:architect Design microservice for users` |

## Stack Detection

The plugin automatically detects your project's technology stack by analyzing:

1. **Configuration Files**: `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `bun.lockb`
2. **File Extensions**: `.tsx`, `.go`, `.rs`, `.py`, `.vue`
3. **Directory Structure**: `src/routes/`, `cmd/`, `src/main.rs`
4. **Multi-Stack**: Detects fullstack projects (e.g., React frontend + Go backend)

### Supported Stacks

| Stack | Detection | Skills Loaded |
|-------|-----------|---------------|
| **React + TypeScript** | `package.json` with React | react-typescript, state-management, testing-frontend |
| **Vue + TypeScript** | `package.json` with Vue | vue-typescript, state-management, testing-frontend |
| **Go** | `go.mod` | golang, api-design, database-patterns |
| **Rust** | `Cargo.toml` | rust, api-design |
| **Python** | `pyproject.toml` | python, api-design |
| **Bun** | `bun.lockb` | bunjs, api-design |
| **Fullstack** | Multiple stacks | Merged skill set |

## Configuration

### Override Auto-Detection

Create `.claude/settings.json`:

```json
{
  "pluginSettings": {
    "dev": {
      "stack": ["react-typescript", "golang"],
      "features": {
        "testing": "vitest",
        "api": "rest",
        "database": "prisma"
      },
      "qualityChecks": {
        "format": true,
        "lint": true,
        "typecheck": true,
        "test": true
      },
      "multiModelReview": {
        "enabled": true,
        "models": ["x-ai/grok-code-fast-1", "google/gemini-2.5-flash"]
      }
    }
  }
}
```

## Usage Examples

### 1. Check Detected Stack

```bash
/dev:help
```

Output:
```
Dev Plugin Help

Detected Stack: react-typescript
Mode: frontend

Available Commands:
- /dev:help - Show this help message
- /dev:implement - Implement features with auto-detected stack
- /dev:debug - Debug errors and investigate issues
- /dev:feature - Full feature development lifecycle
- /dev:architect - Architecture planning and design

Recommended Skills for Your Project:
- react-typescript - React 19 + TypeScript patterns
- state-management - State management with TanStack Query
- testing-frontend - Vitest and React Testing Library
```

### 2. Implement a Feature

```bash
/dev:implement Create a user profile component with avatar upload
```

Workflow:
1. Detects React stack
2. Loads react-typescript and testing-frontend skills
3. Creates implementation plan
4. Implements component with best practices
5. Runs quality checks (format, lint, typecheck, test)
6. Presents results

### 3. Debug an Error

```bash
/dev:debug TypeError: Cannot read property 'map' of undefined
```

Workflow:
1. Detects stack from error context
2. Analyzes error and stack trace
3. Identifies root cause (likely missing loading state)
4. Proposes fix
5. Applies fix after user approval
6. Validates fix with tests

### 4. Full Feature Development

```bash
/dev:feature Add OAuth2 login with Google
```

Workflow:
1. Detects stack (e.g., fullstack React + Go)
2. Creates architecture document
3. Optional: Multi-model architecture review
4. Implements backend OAuth2 flow
5. Implements frontend login UI
6. Runs tests for both frontend and backend
7. Multi-model code review (optional)
8. Presents complete feature

### 5. Architecture Planning

```bash
/dev:architect Design user microservice with CRUD endpoints
```

Workflow:
1. Analyzes requirements
2. Generates 2-3 design alternatives
3. Trade-off analysis
4. User selects approach
5. Creates detailed architecture document
6. Optional: External model validation

## Quality Checks by Stack

### React/TypeScript
```bash
bun run format    # Biome formatter
bun run lint      # Biome linter
bun run typecheck # TypeScript compiler
bun test          # Vitest tests
```

### Go
```bash
go fmt ./...              # Format
go vet ./...              # Static analysis
golangci-lint run         # Linting
go test ./...             # Tests
```

### Rust
```bash
cargo fmt --check         # Format check
cargo clippy -- -D warnings  # Linting
cargo test                # Tests
```

### Python
```bash
black --check .           # Format check
ruff check .              # Linting
mypy .                    # Type checking
pytest                    # Tests
```

## Multi-Model Validation

When [Claudish CLI](https://github.com/MadAppGang/claudish) is installed, the plugin can use external AI models for reviews:

```bash
# Install Claudish (optional)
npm install -g claudish

# Dev plugin will detect Claudish and offer multi-model reviews
/dev:feature Add user authentication
# → Offers model selection (Grok, Gemini, GPT-5, etc.)
# → Runs parallel reviews with consensus analysis
```

## Skills Included

### Core Skills (Always Loaded)
- **universal-patterns**: Language-agnostic development patterns
- **testing-strategies**: Universal testing approaches
- **debugging-strategies**: Cross-language debugging techniques

### Frontend Skills
- **react-typescript**: React 19 + TypeScript patterns
- **vue-typescript**: Vue 3 + TypeScript patterns
- **state-management**: State management strategies
- **testing-frontend**: Frontend testing with Vitest

### Backend Skills
- **api-design**: RESTful API design patterns
- **database-patterns**: Database design and access patterns
- **auth-patterns**: Authentication/authorization patterns
- **error-handling**: Backend error handling strategies
- **golang**: Go language idioms and patterns
- **bunjs**: Bun runtime backend patterns
- **python**: Python backend patterns (FastAPI)
- **rust**: Rust backend patterns (Axum)

## Dependencies

### Required
- **orchestration@mag-claude-plugins** (^0.8.0) - Multi-model validation and quality gates

### Optional
- **code-analysis@mag-claude-plugins** - Semantic code search
- **Claudish CLI** - External AI model reviews

## Troubleshooting

### Stack Not Detected

If auto-detection fails:

1. **Manual Selection**: Run `/dev:help` and it will prompt for manual stack selection
2. **Configuration**: Add explicit stack to `.claude/settings.json`:
   ```json
   {
     "pluginSettings": {
       "dev": {
         "stack": ["react-typescript"]
       }
     }
   }
   ```

### Quality Checks Fail

If quality check scripts are missing:

```bash
# React/TypeScript
npm install -D @biomejs/biome vitest

# Go
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Python
pip install black ruff mypy pytest

# Rust
rustup component add rustfmt clippy
```

### Missing Skills

If you see "skill not found":

1. Ensure plugin is enabled in `.claude/settings.json`
2. Restart Claude Code
3. Check plugin version matches dependencies

## Architecture

The Dev Plugin uses an **agent-driven skill loading pattern**:

1. **Stack Detector Agent** analyzes project and outputs skill paths to `${SESSION_PATH}/context.json`
2. **Orchestrator Commands** read context.json and include skill paths in agent prompts
3. **Implementation Agents** use Read tool to load skill files before implementing
4. **Skills** are lightweight markdown files with patterns and best practices

This approach keeps agents lightweight while providing full access to framework-specific knowledge.

## Related Plugins

| Plugin | Relationship |
|--------|--------------|
| **orchestration** | Core dependency (multi-model validation, quality gates) |
| **frontend** | Specialized React plugin (dev can delegate to frontend agents) |
| **bun** | Specialized Bun backend plugin (dev can delegate to bun agents) |
| **code-analysis** | Optional semantic code search integration |

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

To add a new technology stack:

1. Create skill file: `plugins/dev/skills/backend/{technology}/SKILL.md`
2. Add to `plugin.json`: `./skills/backend/{technology}`
3. Add detection pattern to `context-detection` skill
4. Update stack-detector agent

## License

MIT License - see [LICENSE](../../LICENSE)

## Author

**Jack Rudenko** @ MadAppGang
- Email: i@madappgang.com
- GitHub: [@MadAppGang](https://github.com/MadAppGang)

## Support

- Issues: [GitHub Issues](https://github.com/MadAppGang/claude-code/issues)
- Discussions: [GitHub Discussions](https://github.com/MadAppGang/claude-code/discussions)
- Documentation: [docs/](../../docs/)

---

**Version:** 1.1.0
**Last Updated:** January 5, 2026

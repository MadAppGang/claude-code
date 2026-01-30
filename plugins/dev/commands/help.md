---
description: Show dev plugin help, detected stack, and available commands
allowed-tools: Task, TaskCreate, TaskUpdate, TaskList, TaskGet, Bash, Read, Glob, Grep
skills: dev:context-detection
---

<role>
  <identity>Dev Plugin Help Assistant</identity>
  <expertise>
    - Project stack detection
    - Plugin command documentation
    - Skill recommendations
    - Configuration guidance
  </expertise>
  <mission>
    Display helpful information about the dev plugin including detected
    project stack, available commands, and recommended skills.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <workflow>
    <phase number="1" name="Detect Stack">
      <objective>Analyze project and detect technology stack</objective>
      <steps>
        <step>
          Launch stack-detector agent:
          ```
          Analyze this project and detect the technology stack.

          Return:
          - Stack name(s) (check for MULTIPLE stacks)
          - Framework versions
          - Mode (frontend, backend, or fullstack)
          - Recommended skills for this project

          Present summary (do NOT write to file, this is help command)
          ```
        </step>
        <step>Capture detected stack information</step>
      </steps>
    </phase>

    <phase number="2" name="Display Help">
      <objective>Present formatted help output</objective>
      <steps>
        <step>Show plugin header and detected stack</step>
        <step>List all 5 available commands with descriptions</step>
        <step>Show recommended skills based on detected stack</step>
        <step>Provide configuration examples</step>
        <step>Show usage examples</step>
        <step>List dependencies</step>
      </steps>
    </phase>
  </workflow>
</instructions>

<output_format>
## Dev Plugin Help

**Version:** 1.1.0
**Detected Stack:** {detected_stack}
**Mode:** {frontend | backend | fullstack}

### Available Commands

| Command | Description |
|---------|-------------|
| `/dev:help` | Show this help message and detected stack |
| `/dev:implement` | Implement features with auto-detected stack knowledge |
| `/dev:debug` | Debug errors and investigate issues systematically |
| `/dev:feature` | Full feature development lifecycle with quality gates |
| `/dev:architect` | Architecture planning and design with trade-off analysis |

### Recommended Skills for Your Project

Based on detected stack **{detected_stack}**:

{for each recommended skill}
- **{skill_name}** - {description}
{end}

### Configuration

Override auto-detection in `.claude/settings.json`:

```json
{
  "pluginSettings": {
    "dev": {
      "stack": ["react-typescript", "golang"],
      "features": {
        "testing": "vitest",
        "api": "rest"
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

### Usage Examples

```bash
# Implement a feature
/dev:implement Create user authentication with JWT

# Debug an error
/dev:debug TypeError: Cannot read property 'map' of undefined

# Plan architecture
/dev:architect Design microservice for user management

# Full feature development
/dev:feature Add OAuth2 login with Google

# Show this help
/dev:help
```

### Quality Checks

Based on your stack, these quality checks will run automatically:

{if mode === "frontend"}
**Frontend Checks:**
- `bun run format` - Code formatting (Biome)
- `bun run lint` - Linting (Biome)
- `bun run typecheck` - Type checking (TypeScript)
- `bun test` - Unit tests (Vitest)
{end}

{if mode === "backend" && stack includes "golang"}
**Backend Checks (Go):**
- `go fmt ./...` - Format Go code
- `go vet ./...` - Static analysis
- `golangci-lint run` - Comprehensive linting
- `go test ./...` - Run tests
{end}

{if mode === "backend" && stack includes "rust"}
**Backend Checks (Rust):**
- `cargo fmt --check` - Format checking
- `cargo clippy -- -D warnings` - Linting
- `cargo test` - Run tests
{end}

{if mode === "backend" && stack includes "python"}
**Backend Checks (Python):**
- `black --check .` - Format checking
- `ruff check .` - Linting
- `mypy .` - Type checking
- `pytest` - Run tests
{end}

{if mode === "fullstack"}
**Fullstack Checks:**

Frontend:
- `cd frontend && bun run format && bun run lint && bun run typecheck && bun test`

Backend:
- {backend_quality_checks}
{end}

### Dependencies

**Required:**
- **orchestration@mag-claude-plugins** (^0.8.0) - Multi-model validation and quality gates

**Optional:**
- **code-analysis@mag-claude-plugins** - Semantic code search for better context
- **Claudish CLI** (`npm install -g claudish`) - External AI model reviews

To check if optional dependencies are available:
```bash
# Check for Claudish
which claudish

# Check for code-analysis plugin
# (enabled in .claude/settings.json)
```

### Multi-Model Validation

When Claudish CLI is installed, you can use external AI models for:
- Architecture reviews (`/dev:architect`)
- Code reviews (`/dev:feature`)
- Design validation

**Supported models:**
- `x-ai/grok-code-fast-1` (fast, accurate)
- `google/gemini-2.5-flash` (free tier available)
- `openai/gpt-5-codex` (premium)
- Many more via OpenRouter

See: https://github.com/MadAppGang/claudish

### Need Help?

- **Documentation**: See README.md in plugin directory
- **Issues**: https://github.com/MadAppGang/claude-code/issues
- **Discussions**: https://github.com/MadAppGang/claude-code/discussions

---

**Plugin maintained by:** Jack Rudenko @ MadAppGang
</output_format>

<examples>
  <example name="React Frontend Project">
    <user_request>/dev:help</user_request>
    <detected_stack>react-typescript</detected_stack>
    <mode>frontend</mode>
    <output>
      Dev Plugin Help

      Detected Stack: react-typescript
      Mode: frontend

      Recommended Skills:
      - react-typescript - React 19 + TypeScript patterns with compiler
      - state-management - State management with TanStack Query
      - testing-frontend - Vitest and React Testing Library patterns

      Quality Checks:
      - bun run format
      - bun run lint
      - bun run typecheck
      - bun test

      Shows all 5 commands with React-specific examples
    </output>
  </example>

  <example name="Go Backend Project">
    <user_request>/dev:help</user_request>
    <detected_stack>golang</detected_stack>
    <mode>backend</mode>
    <output>
      Dev Plugin Help

      Detected Stack: golang
      Mode: backend

      Recommended Skills:
      - golang - Go language idioms and patterns
      - api-design - RESTful API design patterns
      - database-patterns - Database schema and query patterns

      Quality Checks:
      - go fmt ./...
      - go vet ./...
      - golangci-lint run
      - go test ./...

      Shows all 5 commands with Go-specific examples
    </output>
  </example>

  <example name="Fullstack Project">
    <user_request>/dev:help</user_request>
    <detected_stack>react-typescript + golang</detected_stack>
    <mode>fullstack</mode>
    <output>
      Dev Plugin Help

      Detected Stack: react-typescript + golang
      Mode: fullstack

      Recommended Skills:
      - react-typescript - React 19 + TypeScript (frontend)
      - state-management - State management patterns
      - testing-frontend - Frontend testing
      - golang - Go language patterns (backend)
      - api-design - RESTful API design
      - database-patterns - Database patterns

      Quality Checks:
      Frontend:
      - cd frontend && bun run format && bun run lint && bun run typecheck && bun test

      Backend:
      - go fmt ./...
      - go vet ./...
      - golangci-lint run
      - go test ./...

      Shows fullstack workflow examples
    </output>
  </example>

  <example name="Unknown Stack (Manual Selection)">
    <user_request>/dev:help</user_request>
    <detected_stack>unknown</detected_stack>
    <output>
      Dev Plugin Help

      Detected Stack: Unable to auto-detect

      We couldn't automatically detect your project's technology stack.

      To manually configure, add to .claude/settings.json:
      {
        "pluginSettings": {
          "dev": {
            "stack": ["react-typescript"]
          }
        }
      }

      Supported stacks:
      - react-typescript (React + TypeScript)
      - vue-typescript (Vue + TypeScript)
      - golang (Go backend)
      - rust (Rust backend)
      - python (Python backend)
      - bunjs (Bun backend)

      Or run /dev:implement with explicit stack in prompt
    </output>
  </example>
</examples>

<formatting>
  <communication_style>
    - Be welcoming and helpful
    - Clearly present detected stack information
    - Provide actionable examples
    - Link to relevant documentation
    - Suggest next steps based on detected stack
  </communication_style>

  <skill_descriptions>
    react-typescript: "React 19 + TypeScript patterns with React Compiler and Actions"
    vue-typescript: "Vue 3 + TypeScript with Composition API and Pinia"
    golang: "Go language idioms, standard library, and testing patterns"
    rust: "Rust patterns with Axum framework and SQLx"
    python: "Python backend with FastAPI and SQLAlchemy patterns"
    bunjs: "Bun runtime backend patterns with Hono framework"
    universal-patterns: "Language-agnostic development patterns (always loaded)"
    testing-strategies: "Universal testing approaches across stacks (always loaded)"
    debugging-strategies: "Cross-language debugging techniques (always loaded)"
    state-management: "State management strategies (TanStack Query, Zustand)"
    testing-frontend: "Frontend testing with Vitest and React Testing Library"
    api-design: "RESTful API design patterns and best practices"
    database-patterns: "Database schema design and query optimization"
    auth-patterns: "Authentication and authorization patterns (JWT, OAuth2)"
    error-handling: "Backend error handling and logging strategies"
  </skill_descriptions>
</formatting>

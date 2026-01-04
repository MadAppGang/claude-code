# Plugin Marketplace Reference

Technical reference for Claude Code plugin marketplace structure, schemas, and configuration.

---

## 📁 Marketplace Structure

### Directory Layout

```
.claude-plugin/
└── marketplace.json                    # Marketplace configuration

plugins/
├── frontend/                           # Plugin directory
│   ├── plugin.json                    # Plugin manifest (required)
│   ├── README.md                       # Plugin documentation (required)
│   ├── agents/                        # Specialized agents (optional)
│   │   ├── architect.md
│   │   ├── developer.md
│   │   └── reviewer.md
│   ├── commands/                      # Slash commands (optional)
│   │   ├── implement.md
│   │   └── review.md
│   ├── skills/                        # Workflow skills (optional)
│   │   ├── browser-debugger/
│   │   │   └── SKILL.md
│   │   └── api-analyzer/
│   │       └── SKILL.md
│   └── mcp-servers/                   # MCP server configurations (optional)
│       └── mcp-config.json
│
├── code-analysis/                      # Another plugin
│   ├── plugin.json
│   ├── README.md
│   └── agents/
│       └── detective.md
│
└── your-plugin/
    └── ...
```

---

## 📋 Marketplace Schema

### marketplace.json

The `marketplace.json` file in `.claude-plugin/` directory defines the marketplace and its plugins.

**Location:** `.claude-plugin/marketplace.json`

```json
{
  "name": "marketplace-name",
  "owner": {
    "name": "Owner Name",
    "email": "owner@example.com",
    "company": "Company Name"
  },
  "metadata": {
    "description": "Marketplace description",
    "version": "1.0.0",
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "plugin-name",
      "source": "./plugins/plugin-name",
      "description": "Plugin description",
      "version": "1.0.0",
      "author": {
        "name": "Author Name",
        "email": "author@example.com"
      },
      "category": "development",
      "tags": ["tag1", "tag2"],
      "strict": true
    }
  ]
}
```

### Fields Reference

#### Marketplace Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Unique marketplace identifier |
| `owner` | object | ✅ | Marketplace owner information |
| `owner.name` | string | ✅ | Owner's full name |
| `owner.email` | string | ✅ | Owner's email address |
| `owner.company` | string | ❌ | Company name |
| `metadata` | object | ✅ | Marketplace metadata |
| `metadata.description` | string | ✅ | Brief description |
| `metadata.version` | string | ✅ | Marketplace version (semver) |
| `metadata.pluginRoot` | string | ✅ | Relative path to plugins directory |
| `plugins` | array | ✅ | Array of plugin definitions |

#### Plugin Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Plugin identifier (kebab-case) |
| `source` | string | ✅ | Relative path to plugin directory |
| `description` | string | ✅ | Brief plugin description |
| `version` | string | ✅ | Plugin version (semver) |
| `author` | object | ✅ | Plugin author information |
| `author.name` | string | ✅ | Author's full name |
| `author.email` | string | ✅ | Author's email |
| `author.company` | string | ❌ | Company name |
| `category` | string | ✅ | Plugin category |
| `tags` | array | ❌ | Search tags (optional) |
| `strict` | boolean | ❌ | Enable strict validation (recommended: `true`) |

---

## 🔧 Plugin Schema

### plugin.json

Each plugin must have a `plugin.json` manifest in its root directory.

**Location:** `plugins/your-plugin/plugin.json`

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "company": "Company Name"
  },
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "category": "development",
  "agents": ["./agents/agent-name.md"],
  "commands": ["./commands/command-name.md"],
  "skills": ["./skills/skill-name"],
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-name"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

### Fields Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Plugin identifier (must match marketplace entry) |
| `version` | string | ✅ | Plugin version (semver) |
| `description` | string | ✅ | Brief description (1-2 sentences) |
| `author` | object | ✅ | Author information |
| `license` | string | ✅ | License identifier (e.g., "MIT") |
| `keywords` | array | ✅ | Search keywords (3-10 recommended) |
| `category` | string | ✅ | Plugin category |
| `agents` | array | ❌ | Paths to agent markdown files |
| `commands` | array | ❌ | Paths to command markdown files |
| `skills` | array | ❌ | Paths to skill directories |
| `mcpServers` | object/string | ❌ | MCP server configuration (inline or file path) |

---

## 🎯 Plugin Categories

Choose the most appropriate category for your plugin:

| Category | Description | Examples |
|----------|-------------|----------|
| `development` | Code generation, refactoring | TypeScript helpers, React generators |
| `testing` | Testing frameworks, E2E testing | Playwright integration, test generators |
| `devops` | CI/CD, deployment, infrastructure | Docker helpers, Kubernetes tools |
| `documentation` | Docs generation, API reference | API doc generators, changelog tools |
| `analysis` | Code analysis, security scanning | ESLint integration, security scanners |
| `design` | UI/UX tools, design systems | Figma integration, component generators |
| `database` | Migrations, queries, ORM | Prisma helpers, migration tools |
| `api` | REST, GraphQL, API clients | OpenAPI generators, GraphQL tools |

---

## 🌐 MCP Server Configuration

### Inline Configuration

Define MCP servers directly in `plugin.json`:

```json
{
  "mcpServers": {
    "custom-tools": {
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/custom-mcp",
      "args": ["--plugin-root", "${CLAUDE_PLUGIN_ROOT}"],
      "env": {
        "CUSTOM_API_KEY": "${CUSTOM_API_KEY}"
      }
    },
    "external-service": {
      "command": "npx",
      "args": ["-y", "@your-org/mcp-server"],
      "env": {
        "SERVICE_TOKEN": "${SERVICE_TOKEN}"
      }
    }
  }
}
```

### External Configuration File

Reference an external MCP configuration file:

**In plugin.json:**

```json
{
  "mcpServers": "./mcp-servers/mcp-config.json"
}
```

**In mcp-servers/mcp-config.json:**

```json
{
  "figma": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-figma"],
    "env": {
      "FIGMA_ACCESS_TOKEN": "${FIGMA_ACCESS_TOKEN}"
    }
  },
  "browser": {
    "command": "npx",
    "args": [
      "-y",
      "@automatalabs/mcp-server-chrome",
      "${CHROME_EXECUTABLE_PATH}"
    ]
  }
}
```

### Environment Variables

**Plugin-relative paths:**
- Use `${CLAUDE_PLUGIN_ROOT}` for paths within the plugin
- Example: `${CLAUDE_PLUGIN_ROOT}/bin/server`

**User environment variables:**
- Use `${VARIABLE_NAME}` for user-provided environment variables
- Example: `${FIGMA_ACCESS_TOKEN}`

**Best Practices:**
- ✅ Document all required environment variables in plugin README
- ✅ Provide `.env.example` file
- ✅ Use descriptive variable names
- ✅ Never hardcode secrets or API keys

---

## 📦 Agent Configuration

### Agent Frontmatter

Agents use YAML frontmatter for configuration:

```markdown
---
name: agent-name
description: Brief description of when to use this agent
model: sonnet
color: blue
tools: [Read, Write, Edit, Bash]
---

Agent instructions go here...
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Agent identifier (kebab-case) |
| `description` | string | ✅ | When to use this agent |
| `model` | string | ❌ | Model to use (`haiku`, `sonnet`, `opus`) |
| `color` | string | ❌ | UI color identifier |
| `tools` | array | ❌ | Allowed tools for this agent |

### Model Selection

- **haiku**: Fast, cost-effective, simple tasks
- **sonnet**: Balanced, most tasks (default)
- **opus**: Complex reasoning, critical tasks

---

## 🎮 Command Configuration

### Command Frontmatter

Commands use YAML frontmatter:

```markdown
---
name: command-name
description: What this command does
allowed-tools: [Task, Read, Write, Edit]
---

Command workflow goes here...
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Command name (will be `/name`) |
| `description` | string | ✅ | Command description |
| `allowed-tools` | array | ❌ | Tools this command can use |

---

## 🎨 Skill Configuration

### Skill Frontmatter

Skills use YAML frontmatter in `SKILL.md`:

```markdown
---
name: skill-name
description: When this skill should automatically trigger
allowed-tools: [Task]
---

Skill instructions go here...
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Skill identifier (kebab-case) |
| `description` | string | ✅ | Auto-trigger conditions |
| `allowed-tools` | array | ❌ | Tools this skill can use |

**Note:** Skills should primarily use the `Task` tool to invoke agents rather than performing actions directly.

---

## 🔢 Semantic Versioning

Follow semantic versioning (semver) for all versions:

### Version Format

`MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (1.0.0 → 1.0.1)

### When to Bump

**MAJOR (x.0.0)**
- Removing agents, commands, or skills
- Changing command arguments or behavior
- Removing required environment variables
- Breaking changes to plugin structure

**MINOR (0.x.0)**
- Adding new agents, commands, or skills
- New features that don't break existing usage
- New optional environment variables

**PATCH (0.0.x)**
- Bug fixes
- Documentation improvements
- Performance improvements
- Refactoring without behavior changes

---

## ✅ Validation

### marketplace.json Validation

Required validation checks:

- ✅ Valid JSON syntax
- ✅ All required fields present
- ✅ Valid semver versions
- ✅ Unique plugin names
- ✅ Valid email addresses
- ✅ Plugin sources point to existing directories

### plugin.json Validation

Required validation checks:

- ✅ Valid JSON syntax
- ✅ Name matches marketplace entry
- ✅ Version matches marketplace entry
- ✅ All referenced files exist
- ✅ Valid category
- ✅ Valid license identifier

---

## 📖 Examples

### Minimal Plugin

Smallest valid plugin with one agent:

**plugin.json:**
```json
{
  "name": "simple-helper",
  "version": "1.0.0",
  "description": "A simple helper agent",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT",
  "keywords": ["helper", "utility"],
  "category": "development",
  "agents": ["./agents/helper.md"]
}
```

### Full-Featured Plugin

Complete plugin with all components:

**plugin.json:**
```json
{
  "name": "full-featured",
  "version": "2.1.0",
  "description": "Complete plugin example",
  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "company": "Your Company"
  },
  "license": "MIT",
  "keywords": ["complete", "example", "full"],
  "category": "development",
  "agents": [
    "./agents/architect.md",
    "./agents/developer.md",
    "./agents/reviewer.md"
  ],
  "commands": [
    "./commands/implement.md",
    "./commands/review.md"
  ],
  "skills": [
    "./skills/auto-review",
    "./skills/auto-test"
  ],
  "mcpServers": "./mcp-servers/mcp-config.json"
}
```

---

## 🔗 Related Documentation

- **[Development Guide](./development-guide.md)** - How to create plugins
- **[Contributing Guide](./contributing.md)** - How to contribute
- **[Advanced Usage](./advanced-usage.md)** - Advanced configuration

---

## 📞 Questions?

- **Issues**: [GitHub Issues](https://github.com/MadAppGang/claude-code/issues)
- **Email**: [i@madappgang.com](mailto:i@madappgang.com)

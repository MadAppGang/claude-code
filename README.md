# MAG Claude Plugins

> **Curated collection of Claude Code plugins for modern frontend development**

A comprehensive plugin marketplace created and maintained by [MadAppGang](https://madappgang.com) to supercharge your development workflow with Claude Code.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Maintained by MadAppGang](https://img.shields.io/badge/Maintained%20by-MadAppGang-blue)](https://madappgang.com)

---

## 📦 Quick Start

Add this marketplace to your Claude Code instance and start using our curated plugins:

```bash
# Add the marketplace from GitHub
/plugin marketplace add MadAppGang/claude-code

# Install a plugin
/plugin install frontend-development@mag-claude-plugins
```

---

## 🎯 What's Inside

This repository contains production-ready plugins designed for modern web development teams. Each plugin includes specialized agents, custom slash commands, and workflow skills to streamline your development process.

### Available Plugins

#### 🎨 Frontend Development

**Version:** 1.0.0 | **Category:** Development | **[📖 Full Documentation](./docs/frontend-development.md)**

Professional toolkit for TypeScript/React development with orchestrated workflows, quality automation, and team collaboration features.

**Highlights:**
- **8 Specialized Agents** - From architecture planning to code review
- **5 Slash Commands** - Including `/implement` for full-cycle orchestration
- **2 Skills** - Browser testing and API analysis
- **4 MCP Servers** - Apidog, Figma, GitHub, PostgreSQL

**The `/implement` Workflow:**

The star feature is the `/implement` command—a complete 7-stage orchestration that takes you from idea to production-ready code:

1. **Architecture Planning** → Designs solution, asks questions, gets approval
2. **Implementation** → Generates code following project patterns
3. **Triple Review** → Manual review + AI analysis + browser testing
4. **Test Generation** → Creates comprehensive test suites
5. **User Approval** → Final review gate
6. **Cleanup** → Removes temporary artifacts
7. **Delivery** → Production-ready feature with documentation

**Perfect for:** React/TypeScript teams, TanStack ecosystem, API-driven apps, Figma workflows

👉 **[Read the complete guide](./docs/frontend-development.md)** for detailed workflow documentation

---

## 🚀 Installation

### Prerequisites

- Claude Code installed and configured
- Git access to GitHub

### Option A: Global Installation

Install plugins globally to use across all your projects:

```bash
# Add the marketplace from GitHub
/plugin marketplace add MadAppGang/claude-code

# Install the frontend development plugin
/plugin install frontend-development@mag-claude-plugins

# Verify installation
/plugin list
```

**Result:** Plugin available in all your projects ✅

**Best for:**
- Individual developers
- Testing the plugin
- Using across multiple projects

---

### Option B: Project-Specific Installation (Recommended for Teams)

Install plugins for a specific project. Team members get automatic setup!

**Step 1: Add to Project Settings**

Create or edit `.claude/settings.json` in your project root:

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
    "frontend-development@mag-claude-plugins": true
  }
}
```

**Step 2: Commit to Git**

```bash
git add .claude/settings.json
git commit -m "Add MAG Claude plugins configuration"
git push
```

**Step 3: Team Members Trust the Folder**

When team members pull and open the project, Claude Code prompts:

```
🔒 Trust this folder?
   Folder: /path/to/your/project
   Plugins: frontend-development@mag-claude-plugins

   [Trust] [Don't Trust]
```

After trusting, plugins install automatically!

**Result:** Consistent plugin setup across entire team ✅

**Benefits:**
- ✅ Zero manual setup for team members
- ✅ Configuration in version control
- ✅ No environment drift
- ✅ Project-specific, doesn't affect other projects

---

### Verify Installation

After installing, verify everything works:

```bash
# Check for any errors
/doctor

# List installed plugins
/plugin list

# Should show:
# frontend-development@mag-claude-plugins (global or project)
#   Version: 1.1.0
#   Status: ✓ Loaded
```

**Common issues:**
- If `/doctor` shows errors, see [Troubleshooting](#-troubleshooting) below
- If plugin not listed, ensure marketplace was added first
- For project-specific installation, you must trust the folder when prompted

---

### Local Development

**Testing plugins locally or contributing?**

See the **[Local Development Guide](./docs/local-development.md)** for detailed instructions on:
- Testing changes before publishing
- Debugging plugins
- Development workflow
- Contributing guidelines

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

### Example: Configure API Access

```bash
/configure-mcp apidog
```

Smart setup that checks existing configuration, validates credentials, and only asks for what's missing.

---

**📖 For comprehensive documentation, examples, and detailed workflow explanations:**

👉 **[Frontend Development Plugin - Complete Guide](./docs/frontend-development.md)**

The complete guide includes:
- Detailed `/implement` workflow (all 7 stages explained)
- Complete agent reference with use cases
- All slash commands with examples
- Skills documentation
- MCP server setup guides
- Troubleshooting and best practices

---

## 🛠️ Development Guide

### Creating a New Plugin

1. **Create plugin directory structure:**

```bash
mkdir -p .claude-plugin/plugins/your-plugin-name/{agents,commands,skills,mcp-servers}
```

2. **Add your artifacts:**

```
your-plugin-name/
├── plugin.json              # Plugin manifest
├── agents/                  # Specialized agents
│   └── your-agent.md
├── commands/                # Slash commands
│   └── your-command.md
├── skills/                  # Workflow skills
│   └── your-skill/
│       └── SKILL.md
└── mcp-servers/            # MCP server configurations
    └── mcp-config.json
```

3. **Create plugin.json manifest:**

```json
{
  "name": "your-plugin-name",
  "version": "1.0.0",
  "description": "Brief description of your plugin",
  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "company": "Your Company"
  },
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "category": "development",
  "agents": ["./agents/your-agent.md"],
  "commands": ["./commands/your-command.md"],
  "skills": ["./skills/your-skill"],
  "mcpServers": "./mcp-servers/mcp-config.json"
}
```

4. **Add to marketplace.json:**

```json
{
  "plugins": [
    {
      "name": "your-plugin-name",
      "source": "./plugins/your-plugin-name",
      "description": "Brief description",
      "version": "1.0.0",
      "author": {
        "name": "Your Name",
        "email": "you@example.com"
      },
      "category": "development",
      "keywords": ["keyword1", "keyword2"],
      "strict": true
    }
  ]
}
```

5. **Test locally:**

```bash
/plugin marketplace add /path/to/claude-code
/plugin install your-plugin-name@mag-claude-plugins
```

### Plugin Development Best Practices

#### Agents

- **Clear descriptions**: Use the `description` frontmatter field to explain when the agent should be used
- **Include examples**: Provide concrete usage examples in descriptions
- **Define tools**: Specify required tools in frontmatter `tools` field
- **Use TodoWrite**: All agents should use TodoWrite for task tracking
- **Set appropriate model**: Use `haiku` for quick tasks, `sonnet` for complex work

#### Commands

- **Single responsibility**: Each command should do one thing well
- **Allowed tools**: Specify exactly which tools the command can use
- **Clear arguments**: Document expected input format
- **Error handling**: Include comprehensive error handling
- **User feedback**: Provide clear progress updates

#### Skills

- **Proactive invocation**: Define when Claude should automatically use the skill
- **Comprehensive instructions**: Include detailed step-by-step workflows
- **Agent delegation**: Skills should primarily invoke agents via Task tool
- **Clear output format**: Specify expected report structures

#### MCP Servers

- **Environment variables**: Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths
- **Clear purpose**: Each MCP server should provide specific, well-defined functionality
- **Configuration**: Document required environment variables and setup steps
- **Dependencies**: List any system dependencies or prerequisites
- **Error handling**: Provide clear error messages for configuration issues

**Example MCP Server Configuration:**

```json
{
  "database-tools": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "POSTGRES_CONNECTION_STRING": "postgresql://user:password@localhost/db"
    }
  },
  "custom-server": {
    "command": "${CLAUDE_PLUGIN_ROOT}/bin/custom-mcp-server",
    "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config/server.json"],
    "env": {
      "CUSTOM_API_KEY": "${CUSTOM_API_KEY}"
    }
  }
}
```

**MCP Server Best Practices:**

1. **Use plugin-relative paths**: Always use `${CLAUDE_PLUGIN_ROOT}` for files within the plugin
2. **Document environment variables**: Clearly list all required env vars in plugin README
3. **Provide setup instructions**: Include step-by-step setup in plugin documentation
4. **Handle missing dependencies**: Check for required tools (npx, node, etc.) and provide helpful error messages
5. **Test thoroughly**: Verify MCP servers work across different environments
6. **Include examples**: Provide example configurations and usage scenarios

**Common MCP Server Use Cases:**

- **Database Access**: PostgreSQL, MySQL, MongoDB, Redis connections
- **API Integration**: Custom API clients, third-party service integrations
- **File System Operations**: Advanced file operations, project scaffolding
- **Development Tools**: Linters, formatters, code generators
- **Cloud Services**: AWS, Azure, GCP integrations
- **Custom Tooling**: Project-specific automation and utilities

### Quality Standards

All contributions must meet these standards:

- ✅ **Documented**: Clear README and inline documentation
- ✅ **Tested**: Verified in real-world projects
- ✅ **Focused**: Single, well-defined purpose
- ✅ **Reusable**: Works across different projects
- ✅ **Maintained**: Kept up-to-date with Claude Code changes

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to contribute:

### Contribution Process

1. **Fork this repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-plugin-name
   ```

3. **Develop your plugin**
   - Follow the development guide above
   - Test thoroughly in real projects
   - Document everything

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add your-plugin-name plugin"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-plugin-name
   ```

6. **Create Pull Request**
   - Describe what your plugin does
   - Include usage examples
   - Note any dependencies or requirements

### Contribution Guidelines

- **Be specific**: Plugins should solve specific, well-defined problems
- **Be compatible**: Work with standard Claude Code installations
- **Be documented**: Include comprehensive README and examples
- **Be tested**: Verify functionality before submitting
- **Be collaborative**: Respond to feedback and iterate

### Plugin Ideas We're Looking For

- **Code Quality Tools**: Linting, formatting, security scanning
- **API Development**: REST API, GraphQL, OpenAPI tooling
- **Database Tools**: Migration helpers, query builders, ORM utilities
- **DevOps Automation**: CI/CD, deployment, infrastructure
- **Documentation Generators**: API docs, component docs, guides
- **Performance Tools**: Profiling, optimization, monitoring
- **Security Tools**: Vulnerability scanning, auth helpers

---

## 📖 Plugin Marketplace Reference

### Marketplace Structure

```
.claude-plugin/
├── marketplace.json                    # Marketplace configuration
└── plugins/
    ├── frontend-development/          # Plugin directory
    │   ├── plugin.json               # Plugin manifest
    │   ├── agents/                   # Specialized agents
    │   ├── commands/                 # Slash commands
    │   ├── skills/                   # Workflow skills
    │   └── mcp-servers/              # MCP server configurations
    │       └── mcp-config.json
    └── your-plugin/
        └── ...
```

### Marketplace Schema

**marketplace.json**

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
      "keywords": ["keyword1", "keyword2"],
      "strict": true
    }
  ]
}
```

### Plugin Schema

**plugin.json**

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

**Alternative: External MCP Config File**

You can also reference an external MCP configuration file:

```json
{
  "name": "plugin-name",
  "mcpServers": "./mcp-servers/mcp-config.json"
}
```

**mcp-servers/mcp-config.json:**

```json
{
  "database-server": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "POSTGRES_CONNECTION_STRING": "${POSTGRES_CONNECTION_STRING}"
    }
  },
  "custom-tools": {
    "command": "${CLAUDE_PLUGIN_ROOT}/bin/custom-mcp",
    "args": ["--plugin-root", "${CLAUDE_PLUGIN_ROOT}"]
  }
}
```

---

## 🔧 Advanced Usage

### Team Distribution

**GitHub Distribution (Recommended)**

Team members add the marketplace once:

```bash
/plugin marketplace add MadAppGang/claude-code
/plugin install frontend-development@mag-claude-plugins
```

**Project-Level Auto-Install (Best for Teams)**

Add to your project's `.claude/settings.json` and commit to git:

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
    "frontend-development@mag-claude-plugins": true
  }
}
```

When team members pull and trust the folder, plugins auto-install. Zero manual setup!

### Version Management

**Specify versions in marketplace.json:**

```json
{
  "plugins": [
    {
      "name": "frontend-development",
      "version": "1.0.0",
      "source": "./plugins/frontend-development"
    }
  ]
}
```

**Install specific versions:**

```bash
/plugin install frontend-development@mag-claude-plugins@1.0.0
```

### Plugin Updates

**Update marketplace metadata:**

```bash
/plugin marketplace update mag-claude-plugins
```

**Reinstall plugin to get latest:**

```bash
/plugin remove frontend-development@mag-claude-plugins
/plugin install frontend-development@mag-claude-plugins
```

---

## 📋 Roadmap

### Current Focus

- ✅ Frontend Development plugin (complete)
- 🚧 Code Quality plugin (in progress)
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

## 🐛 Troubleshooting

### Common Issues

**Settings format error:**
```json
// ✅ CORRECT
"enabledPlugins": {
  "frontend-development@mag-claude-plugins": true
}

// ❌ WRONG
"enabledPlugins": ["frontend-development@mag-claude-plugins"]
```

**Plugin not loading:**
- Ensure marketplace added: `/plugin marketplace add MadAppGang/claude-code`
- For project-specific: Trust folder when prompted
- Refresh marketplace: `/plugin marketplace update mag-claude-plugins`

**Need help?**
- [Local Development Guide](./docs/local-development.md) - Detailed debugging
- [Open an issue](https://github.com/MadAppGang/claude-code/issues)
- Email: [i@madappgang.com](mailto:i@madappgang.com)

---

## 📖 Detailed Documentation

### User Documentation

- **[Frontend Development Plugin Guide](./docs/frontend-development.md)** - Complete user guide with `/implement` workflow deep-dive

### Technical Documentation

For technical details and architecture, see the **[ai-docs](./ai-docs/)** directory:

#### Architecture & Configuration
- **[TEAM_CONFIG_ARCHITECTURE.md](./ai-docs/TEAM_CONFIG_ARCHITECTURE.md)** - Team-first configuration, shareable config vs private secrets
- **[DYNAMIC_MCP_GUIDE.md](./ai-docs/DYNAMIC_MCP_GUIDE.md)** - Dynamic MCP server configuration patterns
- **[IMPROVEMENTS_SUMMARY.md](./ai-docs/IMPROVEMENTS_SUMMARY.md)** - Configuration command design decisions

#### Reference
- **[COMPLETE_PLUGIN_SUMMARY.md](./ai-docs/COMPLETE_PLUGIN_SUMMARY.md)** - Complete plugin inventory (8 agents, 5 commands, 2 skills)
- **[FINAL_SUMMARY.md](./ai-docs/FINAL_SUMMARY.md)** - Project overview and statistics

#### Plugin-Specific Technical Docs
- **[DEPENDENCIES.md](./.claude-plugin/plugins/frontend-development/DEPENDENCIES.md)** - All dependencies and environment variables
- **[CONFIGURE_MCP_FLOW.md](./.claude-plugin/plugins/frontend-development/commands/CONFIGURE_MCP_FLOW.md)** - Configuration flow diagram

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

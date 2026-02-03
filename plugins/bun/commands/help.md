---
name: bun-help
description: Show comprehensive help for the Bun Backend Plugin - lists agents, commands, skills, and usage examples
allowed-tools: Read
---

# Bun Backend Plugin Help

Present the following help information to the user:

---

## Bun Backend Plugin v1.5.2

**Production-ready TypeScript backend development with Bun runtime.**

### Quick Start

```bash
/setup-project my-api
/implement-api Add user CRUD endpoints with authentication
/apidog sync
```

---

## Agents (3)

| Agent | Description | Model |
|-------|-------------|-------|
| **backend-developer** | Implements TypeScript backend features with Bun, Hono, Prisma | Sonnet |
| **api-architect** | Designs backend API architecture, database schemas, system design | Opus |
| **apidog** | Synchronizes API specifications with Apidog documentation | Sonnet |

---

## Commands (4)

| Command | Description |
|---------|-------------|
| **/implement-api** | Full-cycle API implementation with multi-agent orchestration |
| **/setup-project** | Initialize new Bun + TypeScript backend project |
| **/apidog** | Synchronize API specs with Apidog |
| **/help** | Show this help |

### Examples

```bash
/setup-project my-service
/implement-api Create REST endpoints for product catalog with search
/apidog sync --project-id abc123
```

---

## Skills (1)

| Skill | Description |
|-------|-------------|
| **best-practices** | Comprehensive TypeScript backend best practices (2025) |

### Best Practices Include

- **camelCase naming** for API and database
- **Clean architecture** (routes → controllers → services → repositories)
- **Security** - OWASP compliance, input validation, auth patterns
- **Prisma ORM** patterns and migrations
- **Testing** strategies with Vitest
- **Docker** containerization
- **AWS ECS** deployment guidance

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Bun** | Runtime (fast, TypeScript-native) |
| **Hono** | Web framework (lightweight, fast) |
| **Prisma** | ORM (type-safe database access) |
| **Biome** | Linter/formatter |
| **Vitest** | Testing framework |
| **Docker** | Containerization |

---

## MCP Servers

| Server | Purpose |
|--------|---------|
| **Apidog** | API documentation sync |

### Apidog Setup

```bash
export APIDOG_PROJECT_ID="your-project-id"
export APIDOG_API_TOKEN="your-token"
```

---

## Architecture Pattern

```
src/
├── routes/          # HTTP route definitions
├── controllers/     # Request handling
├── services/        # Business logic
├── repositories/    # Data access
├── middleware/      # Auth, validation, logging
├── types/           # TypeScript types
└── utils/           # Helpers
```

---

## Installation

```bash
# Add marketplace (one-time)
/plugin marketplace add MadAppGang/claude-code

# Install plugin
/plugin install bun@mag-claude-plugins
```

**Optional**: Configure Apidog integration for API documentation sync.

---

## More Info

- **Repo**: https://github.com/MadAppGang/claude-code
- **Author**: Jack Rudenko @ MadAppGang

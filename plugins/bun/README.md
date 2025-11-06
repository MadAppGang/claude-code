# Bun Backend Development Plugin

**Production-ready TypeScript backend development with Bun runtime.** This plugin provides specialized agents, slash commands, and best practices for building secure, performant, and maintainable REST APIs using modern TypeScript backend tools.

## 🚀 Overview

The Bun plugin equips you with everything needed for professional backend API development:

- **🎯 Specialized Agents** - Expert agents for backend development and API architecture
- **⚡ Slash Commands** - Automated workflows for project setup and feature implementation
- **📚 Best Practices** - Comprehensive 2025 best practices skill for Bun + TypeScript
- **🏗️ Clean Architecture** - Enforced layered architecture (routes → controllers → services → repositories)
- **🔒 Security First** - Authentication, authorization, validation, and security best practices
- **✅ Production Ready** - Testing, Docker, CI/CD, and AWS ECS deployment guidance

## 📦 What's Included

### Agents (3)

#### `backend-developer` (Sonnet)
Expert TypeScript backend developer for implementing API features, services, and database integrations.

**Use when:**
- Implementing new API endpoints
- Creating services and repositories
- Adding authentication/authorization
- Writing tests
- Integrating with databases (Prisma)

**Key capabilities:**
- Layered architecture (routes → controllers → services → repositories)
- Security-first development (JWT, validation, error handling)
- Type-safe implementation (TypeScript strict + Zod + Prisma)
- Comprehensive testing (unit + integration)
- Quality checks (format, lint, typecheck)

#### `api-architect` (Sonnet)
Elite backend architecture specialist for planning and designing API systems.

**Use when:**
- Starting a new API project
- Planning complex features
- Designing database schemas
- Architecting authentication systems
- Creating implementation roadmaps

**Key capabilities:**
- Comprehensive architecture planning
- Database schema design (Prisma)
- API endpoint specification
- Authentication & authorization design
- Implementation phase planning
- Documentation generation

#### `apidog` (Sonnet)
API documentation synchronization specialist for managing Apidog integration.

**Use when:**
- Creating new API endpoints in Apidog
- Importing OpenAPI specifications to Apidog
- Synchronizing API changes to Apidog
- Updating API documentation

**Key capabilities:**
- Environment validation (APIDOG_PROJECT_ID, APIDOG_API_TOKEN)
- Existing schema analysis and reuse
- OpenAPI 3.0 spec generation with Apidog extensions
- Temporary spec file creation
- Apidog MCP server integration
- Validation URL generation

### Commands (3)

#### `/implement-api`
Full-cycle API implementation with multi-agent orchestration and quality gates.

**What it does:**
1. **Architecture Planning** - Launches api-architect to design comprehensive plan
2. **User Approval** - Waits for architecture approval before implementation
3. **Implementation** - Launches backend-developer to build features
4. **Quality Checks** - Runs format, lint, typecheck automatically
5. **Testing** - Runs unit and integration tests
6. **Code Review** - Optional expert code review (if review agents available)
7. **User Acceptance** - Presents implementation for final approval
8. **Finalization** - Prepares for deployment

**Usage:**
```
/implement-api Create a user management API with registration, login, and profile endpoints
```

#### `/setup-project`
Initialize a new Bun + TypeScript backend project with best practices setup.

**What it does:**
1. Initializes Bun project
2. Installs dependencies (Hono, Prisma, Biome, Zod, etc.)
3. Configures TypeScript (strict mode)
4. Configures Biome (format + lint)
5. Sets up Prisma ORM
6. Creates project structure
7. Implements core utilities (errors, logger, config)
8. Sets up Hono app and middleware
9. Creates Docker configuration (optional)
10. Initializes testing infrastructure
11. Creates comprehensive README

**Usage:**
```
/setup-project Set up a new backend API for my task management app
```

#### `/apidog`
Synchronize API specifications with Apidog by analyzing schemas and importing OpenAPI specs.

**What it does:**
1. **Environment Validation** - Verifies APIDOG_PROJECT_ID and APIDOG_API_TOKEN
2. **Fetch Current Spec** - Gets existing API specification from Apidog
3. **Schema Analysis** - Identifies reusable schemas vs. new ones needed
4. **Spec Generation** - Creates OpenAPI 3.0 spec with Apidog extensions
5. **Temporary Storage** - Saves spec to /tmp directory
6. **Import to Apidog** - Uses Apidog REST API to import
7. **Validation** - Provides Apidog project URL for review

**Usage:**
```
/apidog Add POST /api/users endpoint with email, password, and role fields
```

### MCP Servers (1)

#### `apidog`
Apidog MCP Server for API documentation synchronization and OpenAPI spec management.

**Configuration:**
```json
{
  "apidog": {
    "command": "npx",
    "args": ["-y", "@apidog/mcp-server"],
    "env": {
      "APIDOG_PROJECT_ID": "${APIDOG_PROJECT_ID}",
      "APIDOG_API_TOKEN": "${APIDOG_API_TOKEN}"
    }
  }
}
```

**Required Environment Variables:**
- `APIDOG_PROJECT_ID`: Your Apidog project ID (get from project settings)
- `APIDOG_API_TOKEN`: Your personal API token (get from account settings)

### Skills (1)

#### `best-practices`
Comprehensive TypeScript backend best practices with Bun (2025 Edition).

**Covers:**
- Project structure and architecture
- TypeScript configuration (strict mode)
- Code quality with Biome
- Error handling patterns
- Request validation with Zod
- Database integration with Prisma
- Authentication & security (JWT, bcrypt)
- Structured logging (Pino)
- Testing with Bun
- Performance optimization (Redis caching)
- Docker & production deployment
- CI/CD with GitHub Actions
- AWS ECS deployment

**Accessed automatically** by agents during development.

## 🛠️ Technology Stack

This plugin is optimized for the modern Bun backend stack:

- **Runtime**: Bun 1.x (native TypeScript, hot reload)
- **Framework**: Hono 4.6 (ultra-fast, TypeScript-first)
- **Database**: PostgreSQL 17 + Prisma 6.2 (type-safe ORM)
- **Validation**: Zod (runtime schema validation)
- **Code Quality**: Biome 2.3 (formatting + linting)
- **Testing**: Bun's native test runner
- **Logging**: Pino (structured, high-performance)
- **Authentication**: JWT + bcrypt
- **Caching**: Redis (optional, for performance)
- **Containerization**: Docker
- **Deployment**: AWS ECS Fargate

## 📋 Quick Start

### 1. Prerequisites

**Required:**
- Bun 1.x or later
- Node.js 18+ (for MCP servers)

**Optional (for Apidog integration):**
- Apidog account
- APIDOG_PROJECT_ID (from project settings)
- APIDOG_API_TOKEN (from account settings)

**Set environment variables in `.env`:**
```bash
# Optional: For Apidog integration
APIDOG_PROJECT_ID=your-project-id
APIDOG_API_TOKEN=your-api-token
```

### 2. Install the Plugin

**Global marketplace + project-specific plugin (recommended for teams):**

```bash
# One-time: Add marketplace globally
/plugin marketplace add MadAppGang/claude-code

# Per-project: Enable in .claude/settings.json
{
  "enabledPlugins": {
    "bun@mag-claude-plugins": true
  }
}
```

Commit `.claude/settings.json` and team members get automatic setup!

**Alternative: Global installation:**
```bash
/plugin marketplace add MadAppGang/claude-code
/plugin install bun@mag-claude-plugins
```

### 3. Set Up a New Project

```bash
/setup-project Create a new REST API for my e-commerce platform
```

Follow the interactive prompts to configure:
- Project name
- Database (PostgreSQL, MySQL, SQLite)
- JWT authentication (yes/no)
- Docker (yes/no)
- Additional features (Redis, file uploads, etc.)

### 4. Implement Features

```bash
/implement-api Add product catalog with CRUD operations and search
```

The command orchestrates the complete workflow:
- Architecture planning → User approval → Implementation → Testing → Review → Deployment ready

### 5. Synchronize with Apidog (Optional)

If you have Apidog configured, sync your API documentation:

```bash
/apidog Import my OpenAPI spec to Apidog
```

Or use the agent directly:
```
@apidog Create a new POST /api/products endpoint in Apidog with name, price, and description fields
```

### 6. Use Agents Directly

For specific tasks, invoke agents directly:

**Architecture planning:**
```
@api-architect Plan the authentication system with JWT, refresh tokens, and role-based access control
```

**Implementation:**
```
@backend-developer Implement the user repository with Prisma, including password hashing and email uniqueness check
```

## 🏗️ Architecture Principles

This plugin enforces **clean architecture** with strict separation of concerns:

```
Routes Layer (src/routes/)
  └─> Define API routes, attach middleware

Controllers Layer (src/controllers/)
  └─> Handle HTTP requests/responses
  └─> NO business logic

Services Layer (src/services/)
  └─> Implement business logic
  └─> NO HTTP concerns

Repositories Layer (src/database/repositories/)
  └─> Encapsulate database access
  └─> NO business logic
```

**Key principles:**
- Controllers handle HTTP, services contain business logic
- Repositories are the ONLY layer that touches the database
- Each layer depends only on layers below it
- Easy to test components in isolation

## 🔒 Security Best Practices

All implementations follow security-first principles:

- ✅ **Input Validation** - Zod schemas for all inputs (body, query, params)
- ✅ **Authentication** - JWT with access + refresh tokens
- ✅ **Authorization** - Role-based access control (RBAC)
- ✅ **Password Security** - bcrypt hashing (never plaintext)
- ✅ **Error Handling** - Custom error classes (never expose internals)
- ✅ **CORS** - Restricted to known origins
- ✅ **Security Headers** - X-Frame-Options, CSP, etc.
- ✅ **Rate Limiting** - Prevent abuse
- ✅ **Logging** - Structured logging (never log sensitive data)

## 🧪 Testing Strategy

Comprehensive testing is built-in:

- **Unit Tests** - Service layer, utilities (`tests/unit/`)
- **Integration Tests** - API endpoints with database (`tests/integration/`)
- **E2E Tests** - Full workflows (optional, `tests/e2e/`)
- **Bun Test Runner** - Fast, built-in, Jest-like API
- **Coverage** - Track test coverage

**Run tests:**
```bash
bun test              # All tests
bun test --watch      # Watch mode
bun test --coverage   # With coverage
```

## 🐳 Docker & Deployment

Production-ready Docker configuration included:

**Multi-stage Dockerfile:**
- Base stage
- Dependencies stage
- Build stage
- Runner stage (non-root user)
- Health checks

**docker-compose.yml** for local development:
- App service
- PostgreSQL service
- Redis service (if selected)
- Volume mounts
- Health checks

**AWS ECS deployment guidance:**
- Application Load Balancer setup
- Secrets management (AWS Secrets Manager)
- Auto-scaling configuration
- CloudWatch logging & monitoring

## 📖 Example Workflow

**1. Set up a new project:**
```
/setup-project Create a blog API with users, posts, and comments
```

**2. Plan the architecture:**
```
@api-architect Design the blog API with user authentication, post CRUD, comments, and search
```

**3. Review and approve the plan** (interactive approval gate)

**4. Implement the features:**
```
@backend-developer Implement the architecture plan from ai-docs/blog-api-architecture.md
```

**5. Quality checks run automatically:**
- Biome format
- Biome lint
- TypeScript type check
- Bun tests

**6. Review implementation** (interactive approval gate)

**7. Deploy:**
```bash
docker build -t blog-api .
# Push to ECR, deploy to ECS
```

## 🔗 Integration with Other Plugins

**Works great with:**

- **frontend plugin** (`frontend@mag-claude-plugins`)
  - Share OpenAPI specs
  - Type-safe API clients
  - End-to-end type safety

- **code-analysis plugin** (`code-analysis@mag-claude-plugins`)
  - Semantic code search
  - Codebase investigation
  - Pattern discovery

**Enable multiple plugins:**
```json
{
  "enabledPlugins": {
    "bun@mag-claude-plugins": true,
    "frontend@mag-claude-plugins": true,
    "code-analysis@mag-claude-plugins": true
  }
}
```

## 📚 Learning Resources

- **Best Practices Skill** - Comprehensive guide built into the plugin
- **Agent Templates** - See agents for code examples and patterns
- **Command Workflows** - Study commands for orchestration patterns
- **Official Bun Docs** - https://bun.sh/docs
- **Hono Docs** - https://hono.dev/
- **Prisma Docs** - https://www.prisma.io/docs

## 🤝 Contributing

This plugin is part of the MAG Claude Plugins marketplace.

**Repository:** https://github.com/MadAppGang/claude-code

**Issues & Feedback:** https://github.com/MadAppGang/claude-code/issues

## 📄 License

MIT License - See LICENSE file in repository

## 👤 Author

**Jack Rudenko**
- Email: i@madappgang.com
- Company: MadAppGang

---

**Last Updated:** November 2025
**Plugin Version:** 1.1.0
**Bun Version:** 1.x
**Tool Versions:** TypeScript 5.7, Prisma 6.2, Hono 4.6, Biome 2.3

**Status:** ✅ Production Ready

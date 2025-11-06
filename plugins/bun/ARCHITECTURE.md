# Bun Plugin Architecture Guide

**Visual documentation of components, workflows, and interactions**

---

## 📦 Plugin Components Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      BUN BACKEND PLUGIN                          │
│                         (v1.2.0)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   AGENTS     │  │   COMMANDS   │  │    SKILLS    │
    │     (3)      │  │     (3)      │  │     (1)      │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   MCP SERVERS    │
                    │       (1)        │
                    └──────────────────┘
```

### Components Summary

| Component | Count | Purpose |
|-----------|-------|---------|
| **Agents** | 3 | Specialized implementation experts |
| **Commands** | 3 | Workflow orchestration |
| **Skills** | 1 | Shared knowledge base |
| **MCP Servers** | 1 | External service integration |

---

## 🤖 Agents (The Specialists)

### Agent Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                   best-practices Skill                           │
│           (Shared knowledge - referenced by all)                 │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│ api-architect  │   │ backend-       │   │    apidog      │
│                │   │ developer      │   │                │
│ 🎨 PLANS       │   │ 💻 BUILDS      │   │ 📡 SYNCS       │
│                │   │                │   │                │
│ Creates:       │   │ Creates:       │   │ Creates:       │
│ • Architecture │   │ • Routes       │   │ • OpenAPI spec │
│ • Database     │   │ • Controllers  │   │                │
│   schema       │   │ • Services     │   │ Syncs to:      │
│ • API specs    │   │ • Repositories │   │ • Apidog       │
│ • Roadmap      │   │ • Schemas      │   │                │
│                │   │ • Tests        │   │ Uses:          │
│ Outputs:       │   │                │   │ • Apidog MCP   │
│ ai-docs/*.md   │   │ Reads:         │   │   (optional)   │
│                │   │ ai-docs/*.md   │   │                │
└────────────────┘   └────────────────┘   └────────────────┘
```

---

### 1️⃣ api-architect (The Planner)

**Model**: Sonnet
**Color**: Blue
**Role**: Creates comprehensive API architecture plans

#### When to Use

```
✅ USE api-architect when:
  • Starting a new API project
  • Planning complex features
  • Designing database schemas
  • Architecting authentication systems
  • Creating implementation roadmaps

❌ DON'T use for:
  • Writing actual code
  • Fixing bugs
  • Running tests
```

#### What It Does

```
INPUT: Feature requirements
  │
  ├─> STEP 1: Discover & analyze
  │     • Reviews existing codebase
  │     • Asks clarifying questions
  │     • Identifies requirements
  │
  ├─> STEP 2: Design architecture
  │     • Database schema (Prisma)
  │     • API endpoints (REST)
  │     • Authentication & authorization
  │     • Validation strategy (Zod)
  │     • Error handling
  │     • Layered architecture design
  │
  ├─> STEP 3: Create roadmap
  │     • Phase 1: Foundation
  │     • Phase 2: Database
  │     • Phase 3: Infrastructure
  │     • Phase 4: Authentication
  │     • Phase 5: Features
  │     • Phase 6: Testing
  │
  ├─> STEP 4: Generate docs
  │     • ai-docs/architecture-overview.md
  │     • ai-docs/database-schema.md
  │     • ai-docs/api-specification.md
  │     • ai-docs/auth-security.md
  │     • ai-docs/implementation-roadmap.md
  │
OUTPUT: Comprehensive plan ready for implementation
```

#### Example Usage

```bash
# Direct agent call
@api-architect Design a blog API with user authentication, post CRUD,
comments, and search functionality

# Via command (recommended)
/implement-api Create a blog API
  → Command will launch api-architect automatically
```

---

### 2️⃣ backend-developer (The Builder)

**Model**: Sonnet
**Color**: Purple
**Role**: Implements production-ready TypeScript backend code

#### When to Use

```
✅ USE backend-developer when:
  • Implementing API endpoints
  • Creating services and repositories
  • Adding authentication/authorization
  • Writing tests
  • Integrating databases (Prisma)
  • Fixing bugs in backend code

❌ DON'T use for:
  • Planning architecture (use api-architect)
  • Frontend code
  • DevOps/deployment scripts
```

#### What It Does

```
INPUT: Architecture plan (from ai-docs/)
  │
  ├─> PHASE 1: Analysis
  │     • Reads existing patterns
  │     • Identifies required layers
  │     • Creates TodoWrite task list
  │
  ├─> PHASE 2: Database layer
  │     • Updates Prisma schema
  │     • Creates repositories
  │     • Generates Prisma client
  │     • Creates migrations
  │
  ├─> PHASE 3: Validation layer
  │     • Defines Zod schemas
  │     • Exports TypeScript types
  │
  ├─> PHASE 4: Business logic
  │     • Implements services
  │     • Uses repositories
  │     • Implements business rules
  │     • Error handling (custom classes)
  │
  ├─> PHASE 5: HTTP layer
  │     • Creates controllers
  │     • Extracts validated data
  │     • Calls services
  │     • Formats responses
  │
  ├─> PHASE 6: Routing layer
  │     • Defines routes
  │     • Attaches middleware
  │     • Maps to controllers
  │
  ├─> PHASE 7: Testing
  │     • Unit tests (services)
  │     • Integration tests (APIs)
  │
  ├─> PHASE 8: Quality checks
  │     • bun run format
  │     • bun run lint
  │     • bun run typecheck
  │     • bun test
  │
OUTPUT: Production-ready code with all quality checks passing
```

#### Layered Architecture (ALWAYS follows)

```
┌────────────────────────────────────────────────────┐
│  Routes (src/routes/)                              │
│  • Define API routes                               │
│  • Attach middleware                               │
│  • Map to controllers                              │
└────────────────────────────────────────────────────┘
                    ↓ calls
┌────────────────────────────────────────────────────┐
│  Controllers (src/controllers/)                    │
│  • Handle HTTP requests/responses                  │
│  • Extract validated data                          │
│  • Call services                                   │
│  • ❌ NO business logic                           │
└────────────────────────────────────────────────────┘
                    ↓ calls
┌────────────────────────────────────────────────────┐
│  Services (src/services/)                          │
│  • Implement business logic                        │
│  • Orchestrate repositories                        │
│  • Handle transactions                             │
│  • ❌ NO HTTP concerns                            │
└────────────────────────────────────────────────────┘
                    ↓ calls
┌────────────────────────────────────────────────────┐
│  Repositories (src/database/repositories/)         │
│  • Encapsulate database access                     │
│  • Use Prisma client                               │
│  • Type-safe queries                               │
│  • ❌ NO business logic                           │
└────────────────────────────────────────────────────┘
```

#### Example Usage

```bash
# Direct agent call (with existing plan)
@backend-developer Implement the architecture plan from
ai-docs/blog-api-architecture.md

# Via command (recommended)
/implement-api Create user management API
  → Command will launch backend-developer automatically after planning
```

---

### 3️⃣ apidog (The Synchronizer)

**Model**: Sonnet
**Color**: Purple
**Role**: Synchronizes API specifications with Apidog

#### When to Use

```
✅ USE apidog when:
  • Creating new API endpoints in Apidog
  • Importing OpenAPI specs to Apidog
  • Synchronizing API changes
  • Updating API documentation

❌ DON'T use for:
  • Writing backend code
  • Planning architecture
  • Testing APIs
```

#### What It Does

```
INPUT: API specification request
  │
  ├─> STEP 1: Validate environment
  │     • Check APIDOG_PROJECT_ID
  │     • Check APIDOG_API_TOKEN
  │     • Provide setup guidance if missing
  │
  ├─> STEP 2: Fetch current spec (optional)
  │     • Uses Apidog MCP server
  │     • Gets existing schemas
  │     • Gets existing parameters
  │     • Gets existing responses
  │
  ├─> STEP 3: Schema analysis
  │     • Identify reusable schemas
  │     • Decide: reuse, extend, or create
  │     • Create schema mapping
  │
  ├─> STEP 4: Create OpenAPI spec
  │     • OpenAPI 3.0 structure
  │     • Reference existing schemas ($ref)
  │     • Add new schemas (minimal)
  │     • Apply camelCase naming
  │     • Add Apidog extensions (x-apidog-*)
  │
  ├─> STEP 5: Save to temp
  │     • /tmp/apidog-specs/api-spec-{timestamp}.json
  │
  ├─> STEP 6: Import to Apidog ⚠️ NEEDS FIX
  │     • POST to Apidog REST API
  │     • AUTO_MERGE behavior
  │     • Parse import statistics
  │
  ├─> STEP 7: Validation
  │     • Provide project URL
  │     • Show import statistics
  │     • List any errors
  │
OUTPUT: API spec synchronized to Apidog
```

#### Environment Setup

```bash
# Required environment variables
APIDOG_PROJECT_ID=your-project-id    # From Apidog project settings
APIDOG_API_TOKEN=your-api-token      # From Apidog account settings

# Add to .env file
echo "APIDOG_PROJECT_ID=123456" >> .env
echo "APIDOG_API_TOKEN=apd_xxx" >> .env
```

#### Example Usage

```bash
# Via command (recommended)
/apidog Add POST /api/users endpoint with email, password, name fields

# Direct agent call
@apidog Create a new POST /api/products endpoint in Apidog with
name, price, and description fields
```

---

## ⚡ Commands (The Orchestrators)

### Command Comparison

| Command | Pattern | Agents Used | Best For |
|---------|---------|-------------|----------|
| `/implement-api` | Multi-agent orchestration | api-architect + backend-developer | Full-cycle feature implementation |
| `/setup-project` | Direct implementation | None | New project initialization |
| `/apidog` | Single agent launcher | apidog | API documentation sync |

---

### 1️⃣ /implement-api (Full-Cycle Orchestrator)

**Pattern**: Multi-agent orchestration with approval gates

#### Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    /implement-api WORKFLOW                       │
└─────────────────────────────────────────────────────────────────┘

USER: /implement-api Create user management API
  │
  ├─> PRELIMINARY: Check plugins
  │     • Detect code-analysis plugin (recommended)
  │     • Detect frontend plugin (for code review)
  │     • Inform user of benefits
  │
  ├─> STEP 0: Initialize TodoWrite
  │     • PHASE 1: Architecture planning
  │     • PHASE 1: User approval gate
  │     • PHASE 2: Implementation
  │     • PHASE 3: Quality checks
  │     • PHASE 4: Testing
  │     • PHASE 5: Code review
  │     • PHASE 6: User acceptance
  │     • PHASE 7: Finalization
  │
  ├─> PHASE 1: Architecture Planning
  │     ┌──────────────────────────────────────┐
  │     │  Launch: api-architect               │
  │     │                                      │
  │     │  1. Gather context                   │
  │     │  2. Ask clarifying questions         │
  │     │  3. Design architecture              │
  │     │  4. Generate documentation           │
  │     │     • ai-docs/architecture.md        │
  │     │     • ai-docs/database-schema.md     │
  │     │     • ai-docs/api-spec.md            │
  │     │  5. Present plan                     │
  │     └──────────────────────────────────────┘
  │            │
  │            ▼
  │     ┌──────────────────────────────────────┐
  │     │  ⏸️  USER APPROVAL GATE              │
  │     │                                      │
  │     │  Options:                            │
  │     │  ✅ Approve → Continue               │
  │     │  🔄 Request changes → Re-plan        │
  │     │  ❌ Cancel → Stop                    │
  │     └──────────────────────────────────────┘
  │            │
  │            ▼ (if approved)
  │
  ├─> PHASE 2: Implementation
  │     ┌──────────────────────────────────────┐
  │     │  Launch: backend-developer           │
  │     │                                      │
  │     │  Reads: ai-docs/architecture.md      │
  │     │                                      │
  │     │  Creates:                            │
  │     │  • Prisma schema updates             │
  │     │  • Zod validation schemas            │
  │     │  • Repositories                      │
  │     │  • Services                          │
  │     │  • Controllers                       │
  │     │  • Routes                            │
  │     │  • Middleware (if needed)            │
  │     │  • Unit tests                        │
  │     │  • Integration tests                 │
  │     └──────────────────────────────────────┘
  │            │
  │            ▼
  │
  ├─> PHASE 3: Quality Checks
  │     ┌──────────────────────────────────────┐
  │     │  Run (orchestrator does this):       │
  │     │                                      │
  │     │  ✓ bun run format                    │
  │     │  ✓ bun run lint                      │
  │     │  ✓ bun run typecheck                 │
  │     │                                      │
  │     │  ❌ If any fail → Re-launch          │
  │     │     backend-developer to fix         │
  │     └──────────────────────────────────────┘
  │            │
  │            ▼
  │
  ├─> PHASE 4: Testing
  │     ┌──────────────────────────────────────┐
  │     │  Run (orchestrator does this):       │
  │     │                                      │
  │     │  ✓ bun test tests/unit               │
  │     │  ✓ bun test tests/integration        │
  │     │  ✓ bun test (all)                    │
  │     │                                      │
  │     │  ❌ If any fail → Re-launch          │
  │     │     backend-developer to fix         │
  │     └──────────────────────────────────────┘
  │            │
  │            ▼
  │
  ├─> PHASE 5: Code Review (optional)
  │     ┌──────────────────────────────────────┐
  │     │  If available:                       │
  │     │  • senior-code-reviewer (frontend)   │
  │     │  • codex-reviewer (frontend)         │
  │     │                                      │
  │     │  Launch review for:                  │
  │     │  • Security                          │
  │     │  • Architecture                      │
  │     │  • Error handling                    │
  │     │  • Type safety                       │
  │     │  • Testing                           │
  │     │  • Performance                       │
  │     │                                      │
  │     │  Apply critical fixes if needed      │
  │     └──────────────────────────────────────┘
  │            │
  │            ▼
  │
  ├─> PHASE 6: User Acceptance
  │     ┌──────────────────────────────────────┐
  │     │  ⏸️  USER ACCEPTANCE GATE            │
  │     │                                      │
  │     │  Presents:                           │
  │     │  • Implementation summary            │
  │     │  • Files created/modified            │
  │     │  • Quality check results             │
  │     │  • Test results                      │
  │     │  • git status / git diff             │
  │     │                                      │
  │     │  Options:                            │
  │     │  ✅ Accept → Finalize                │
  │     │  🔄 Request changes → Re-implement   │
  │     │  ⏸️  Manual testing → Pause          │
  │     └──────────────────────────────────────┘
  │            │
  │            ▼ (if accepted)
  │
  ├─> PHASE 7: Finalization
  │     ┌──────────────────────────────────────┐
  │     │  Final steps:                        │
  │     │                                      │
  │     │  • Confirm all checks pass           │
  │     │  • Review git status                 │
  │     │  • Check documentation               │
  │     │  • Offer deployment guidance         │
  │     │  • Present completion summary        │
  │     │                                      │
  │     │  Ready for:                          │
  │     │  • git commit                        │
  │     │  • Pull request                      │
  │     │  • Deployment                        │
  │     └──────────────────────────────────────┘
  │
OUTPUT: Production-ready, tested, reviewed implementation
```

#### Error Recovery

```
If ANY phase fails:

  1. Identify issue
       ↓
  2. Delegate fix to appropriate agent
     • Implementation bugs → backend-developer
     • Architecture issues → api-architect
     • Test failures → backend-developer
       ↓
  3. Re-run affected phases
     • Quality checks
     • Tests
     • Code review (if applicable)
       ↓
  4. Never skip phases
     • Each builds on previous
     • Skipping risks broken implementation
```

---

### 2️⃣ /setup-project (Project Initializer)

**Pattern**: Direct implementation (no agents)

#### Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  /setup-project WORKFLOW                         │
└─────────────────────────────────────────────────────────────────┘

USER: /setup-project Create a new REST API for task management
  │
  ├─> STEP 1: Gather Requirements
  │     ┌──────────────────────────────────────┐
  │     │  AskUserQuestion:                    │
  │     │                                      │
  │     │  1. Project name?                    │
  │     │  2. Database?                        │
  │     │     • PostgreSQL (recommended)       │
  │     │     • MySQL                          │
  │     │     • SQLite                         │
  │     │  3. JWT authentication?              │
  │     │     • Yes                            │
  │     │     • No                             │
  │     │  4. Docker?                          │
  │     │     • Yes                            │
  │     │     • No                             │
  │     │  5. Additional features?             │
  │     │     □ Redis caching                  │
  │     │     □ File upload handling           │
  │     │     □ Email service                  │
  │     │     □ Health check endpoint          │
  │     └──────────────────────────────────────┘
  │            │
  │            ▼
  │
  ├─> STEP 2: Initialize Bun Project
  │     • bun init -y
  │     • bun add hono zod @prisma/client bcrypt jsonwebtoken pino
  │     • bun add -d typescript prisma @biomejs/biome
  │     • (+ conditional deps based on selections)
  │
  ├─> STEP 3: Configure TypeScript
  │     • tsconfig.json (strict mode)
  │     • Path aliases (@core/*, @services/*, etc.)
  │
  ├─> STEP 4: Configure Biome
  │     • bunx @biomejs/biome init
  │     • biome.json (format + lint rules)
  │
  ├─> STEP 5: Set Up Prisma
  │     • bunx prisma init
  │     • Update DATABASE_URL in .env
  │     • Create initial schema with User model
  │
  ├─> STEP 6: Create Project Structure
  │     src/
  │     ├── core/              # Core utilities
  │     ├── database/
  │     │   ├── client.ts
  │     │   └── repositories/
  │     ├── services/
  │     ├── controllers/
  │     ├── middleware/
  │     ├── routes/
  │     ├── schemas/
  │     ├── types/
  │     └── utils/
  │     tests/
  │     ├── unit/
  │     ├── integration/
  │     └── e2e/
  │
  ├─> STEP 7: Create Core Utilities
  │     • src/core/errors.ts (custom error classes)
  │     • src/core/logger.ts (Pino setup)
  │     • src/core/config.ts (env var validation)
  │
  ├─> STEP 8: Set Up Hono App
  │     • src/app.ts (Hono initialization)
  │     • src/server.ts (entry point)
  │     • CORS, security headers, logging
  │     • Global error handler
  │
  ├─> STEP 9: Create Middleware
  │     • src/middleware/errorHandler.ts
  │     • src/middleware/validator.ts
  │     • src/middleware/requestLogger.ts
  │     • src/middleware/security.ts
  │     • src/middleware/auth.ts (if JWT selected)
  │
  ├─> STEP 10: Environment Configuration
  │     • .env.example
  │     • .env (copy from example)
  │     • .gitignore (exclude .env)
  │
  ├─> STEP 11: Docker Configuration (if selected)
  │     • Dockerfile (multi-stage build)
  │     • docker-compose.yml
  │     • .dockerignore
  │
  ├─> STEP 12: Testing Infrastructure
  │     • tests/setup.ts
  │     • tests/unit/example.test.ts
  │     • tests/integration/health.test.ts
  │
  ├─> STEP 13: Package.json Scripts
  │     {
  │       "dev": "bun --hot src/server.ts",
  │       "start": "NODE_ENV=production bun src/server.ts",
  │       "test": "bun test",
  │       "lint": "biome lint --write",
  │       "format": "biome format --write",
  │       "typecheck": "tsc --noEmit",
  │       "db:generate": "prisma generate",
  │       "db:migrate": "prisma migrate dev"
  │     }
  │
  ├─> STEP 14: Configuration Files
  │     • .gitignore
  │     • .editorconfig
  │     • .vscode/settings.json
  │
  ├─> STEP 15: Create README.md
  │     • Project description
  │     • Technology stack
  │     • Installation instructions
  │     • Development commands
  │
  ├─> STEP 16: Initialize Git
  │     • git init
  │     • git add .
  │     • git commit -m "Initial project setup"
  │
  ├─> STEP 17: Quality Checks
  │     • bunx prisma generate
  │     • bun run format
  │     • bun run lint
  │     • bun run typecheck
  │     • bun test
  │
OUTPUT: Production-ready project foundation
```

#### What Gets Created

```
project-name/
├── 📁 src/
│   ├── 📄 server.ts              ← Entry point
│   ├── 📄 app.ts                 ← Hono app
│   ├── 📄 config.ts              ← Environment config
│   ├── 📁 core/                  ← Core utilities
│   │   ├── 📄 errors.ts          ← Custom error classes
│   │   ├── 📄 logger.ts          ← Pino logger
│   │   └── 📄 responses.ts       ← Response helpers
│   ├── 📁 database/
│   │   ├── 📄 client.ts          ← Prisma client
│   │   └── 📁 repositories/      ← Data access layer
│   ├── 📁 services/              ← Business logic
│   ├── 📁 controllers/           ← HTTP handlers
│   ├── 📁 middleware/            ← Middleware functions
│   │   ├── 📄 auth.ts            ← JWT auth (if selected)
│   │   ├── 📄 validator.ts       ← Zod validation
│   │   ├── 📄 errorHandler.ts    ← Global error handler
│   │   ├── 📄 requestLogger.ts   ← Request logging
│   │   └── 📄 security.ts        ← Security headers
│   ├── 📁 routes/                ← API routes
│   ├── 📁 schemas/               ← Zod schemas
│   ├── 📁 types/                 ← TypeScript types
│   └── 📁 utils/                 ← Utility functions
├── 📁 tests/
│   ├── 📄 setup.ts               ← Test utilities
│   ├── 📁 unit/                  ← Unit tests
│   ├── 📁 integration/           ← Integration tests
│   └── 📁 e2e/                   ← E2E tests
├── 📁 prisma/
│   └── 📄 schema.prisma          ← Database schema
├── 🐳 Dockerfile                 ← (if selected)
├── 🐳 docker-compose.yml         ← (if selected)
├── ⚙️ tsconfig.json              ← TypeScript config
├── ⚙️ biome.json                 ← Biome config
├── 📄 package.json               ← Dependencies + scripts
├── 📄 .env                       ← Environment variables
├── 📄 .env.example               ← Template
├── 📄 .gitignore                 ← Git ignores
└── 📄 README.md                  ← Documentation
```

---

### 3️⃣ /apidog (Documentation Synchronizer)

**Pattern**: Single agent launcher

#### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     /apidog WORKFLOW                             │
└─────────────────────────────────────────────────────────────────┘

USER: /apidog Add POST /api/users endpoint
  │
  └─> Launches: apidog agent
          │
          └─> (See apidog agent workflow above)
          │
          └─> Returns: Import statistics + validation URL
```

**This is a thin wrapper** - all logic is in the apidog agent.

---

## 📚 Skill (The Knowledge Base)

### best-practices Skill

**Type**: Comprehensive guide (942 lines)
**Purpose**: Shared knowledge base for consistent patterns

#### What It Contains

```
┌─────────────────────────────────────────────────────────────────┐
│                    best-practices Skill                          │
│                        (942 lines)                               │
└─────────────────────────────────────────────────────────────────┘
         │
         ├─> Stack Overview (Bun, Hono, Prisma, Biome)
         │
         ├─> Project Structure
         │     • Directory organization
         │     • Layer responsibilities
         │
         ├─> TypeScript Configuration
         │     • tsconfig.json (strict mode)
         │     • Path aliases
         │
         ├─> Code Quality (Biome)
         │     • biome.json configuration
         │     • Format + lint rules
         │
         ├─> Error Handling
         │     • Custom error classes
         │     • Global error handler
         │     • Error response format
         │
         ├─> Request Validation (Zod)
         │     • Schema definitions
         │     • Validation middleware
         │     • Type inference
         │
         ├─> API Naming Convention: camelCase ⭐
         │     • Why camelCase (industry standard)
         │     • Request/response examples
         │     • Database mapping with Prisma @map()
         │
         ├─> Database with Prisma
         │     • Client setup
         │     • Repository pattern
         │     • Service layer patterns
         │     • Migration commands
         │
         ├─> Authentication & Security
         │     • JWT authentication flow
         │     • Auth middleware
         │     • Security headers
         │     • CORS configuration
         │
         ├─> Logging with Pino
         │     • Logger setup
         │     • Request logging middleware
         │     • Structured logging
         │
         ├─> Testing with Bun
         │     • Unit test examples
         │     • Integration test examples
         │     • Test commands
         │
         ├─> Performance (Redis)
         │     • Cache utilities
         │     • Cached function pattern
         │
         ├─> Docker & Production
         │     • Multi-stage Dockerfile
         │     • Graceful shutdown
         │     • Health checks
         │
         └─> Production Readiness Checklist
               • Security
               • Performance
               • Reliability
               • Quality
               • Deployment
```

#### Who Uses It

```
┌─────────────────────────────────────────────────────────────────┐
│                   Skill Usage Pattern                            │
└─────────────────────────────────────────────────────────────────┘

api-architect
  ├─> References: Architecture patterns
  ├─> References: Database schema patterns (Prisma)
  ├─> References: API design patterns
  └─> References: camelCase naming convention

backend-developer
  ├─> References: Code templates (routes, controllers, services, repos)
  ├─> References: Error handling patterns
  ├─> References: Validation patterns (Zod)
  ├─> References: Testing patterns
  ├─> References: Security best practices
  └─> References: camelCase naming convention

apidog
  ├─> References: OpenAPI spec structure
  └─> References: camelCase naming convention ⭐

/setup-project command
  ├─> References: Project structure
  ├─> References: Configuration templates
  ├─> References: Core utility templates
  └─> References: Middleware templates
```

#### Key Sections Referenced

| Section | Referenced By | Frequency |
|---------|---------------|-----------|
| camelCase Convention | All agents | ⭐⭐⭐⭐⭐ |
| Layered Architecture | backend-developer, api-architect | ⭐⭐⭐⭐⭐ |
| Error Handling | backend-developer | ⭐⭐⭐⭐ |
| Validation (Zod) | backend-developer, api-architect | ⭐⭐⭐⭐ |
| Testing Patterns | backend-developer | ⭐⭐⭐ |
| Security Patterns | backend-developer, api-architect | ⭐⭐⭐⭐ |
| Docker/Deployment | /setup-project | ⭐⭐⭐ |

---

## 🔌 MCP Server (External Integration)

### Apidog MCP Server

**Purpose**: Integrates with Apidog for API documentation management

#### Configuration

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

#### Required Environment Variables

```bash
# Add to .env file
APIDOG_PROJECT_ID=your-project-id    # From Apidog project settings
APIDOG_API_TOKEN=your-api-token      # From Apidog account settings
```

#### How It's Used

```
apidog agent
    │
    ├─> STEP 2: Fetch current spec
    │     │
    │     ├─> Check if MCP server configured
    │     │
    │     ├─> If available:
    │     │     • Use mcp__apidog__read_project_oas_*
    │     │     • Get existing schemas
    │     │     • Get existing parameters
    │     │     • Get existing responses
    │     │     • Maximize schema reuse
    │     │
    │     └─> If NOT available:
    │           • Create spec from scratch
    │           • No schema reuse optimization
    │
    └─> STEP 6: Import to Apidog
          │
          └─> ⚠️ CRITICAL GAP: Not implemented
              Should use Apidog REST API directly
              (not via MCP server)
```

#### MCP vs REST API

| Operation | Method | Status |
|-----------|--------|--------|
| **Fetch existing spec** | MCP Server | ✅ Optional (agent has fallback) |
| **Import new spec** | REST API | ⚠️ Documented but not implemented |

---

## 🔄 Complete Workflow Examples

### Example 1: New Project Setup → Feature Implementation

```
SCENARIO: Create a new blog API from scratch

┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Initialize Project                                      │
└─────────────────────────────────────────────────────────────────┘

/setup-project Create a blog API
  │
  ├─> Project name: blog-api
  ├─> Database: PostgreSQL
  ├─> JWT auth: Yes
  ├─> Docker: Yes
  ├─> Features: Redis caching, Health check
  │
  └─> Creates complete project foundation

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Implement Blog Features                                 │
└─────────────────────────────────────────────────────────────────┘

/implement-api Create user authentication, post CRUD, comments, and search
  │
  ├─> PHASE 1: api-architect plans
  │     • Database schema (User, Post, Comment models)
  │     • API endpoints (auth, posts, comments)
  │     • Authentication (JWT with refresh tokens)
  │     • Search strategy (Prisma fullText)
  │     → Creates ai-docs/blog-api-architecture.md
  │     → User approves
  │
  ├─> PHASE 2: backend-developer implements
  │     • Updates Prisma schema
  │     • Creates repositories (user, post, comment)
  │     • Creates services (auth, post, comment)
  │     • Creates controllers
  │     • Creates routes
  │     • Writes tests
  │
  ├─> PHASE 3-4: Quality checks + tests (all pass)
  │
  ├─> PHASE 5: Code review (senior-code-reviewer)
  │     • Reviews security (JWT, validation)
  │     • Reviews architecture (clean separation)
  │     • Approves with minor suggestions
  │
  ├─> PHASE 6: User acceptance → Approved
  │
  └─> PHASE 7: Finalized
        → Ready for deployment

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Sync to Apidog (optional)                               │
└─────────────────────────────────────────────────────────────────┘

/apidog Import my blog API endpoints
  │
  └─> apidog agent
        • Fetches existing Apidog schemas
        • Creates OpenAPI spec for blog API
        • Reuses User schema (already exists)
        • Creates Post, Comment schemas
        • Imports to Apidog
        → API documentation up to date
```

**Timeline**:
- Setup: ~10 minutes
- Implementation: ~30-45 minutes (with agent)
- Documentation: ~5 minutes

---

### Example 2: Add Feature to Existing Project

```
SCENARIO: Add payment processing to existing e-commerce API

┌─────────────────────────────────────────────────────────────────┐
│ EXISTING: E-commerce API with products and cart                 │
└─────────────────────────────────────────────────────────────────┘

/implement-api Add Stripe payment processing with order tracking
  │
  ├─> PRELIMINARY: Detects code-analysis plugin
  │     → Uses codebase-detective to find existing patterns
  │     → Uses semantic-code-search to find service architecture
  │
  ├─> PHASE 1: api-architect plans
  │     • Reviews existing codebase
  │     • Identifies integration points
  │     • Designs Payment and Order models
  │     • Plans Stripe integration
  │     • Creates security strategy (webhooks, idempotency)
  │     → Creates ai-docs/payment-architecture.md
  │     → User approves
  │
  ├─> PHASE 2: backend-developer implements
  │     • Updates Prisma schema (Payment, Order models)
  │     • Creates payment service (Stripe SDK)
  │     • Creates order service
  │     • Implements webhook handler (Stripe events)
  │     • Creates payment routes
  │     • Writes comprehensive tests (includes Stripe mocks)
  │
  ├─> PHASE 3-4: Quality checks + tests
  │     • All format, lint, typecheck pass
  │     • Unit tests: 100% coverage on payment service
  │     • Integration tests: webhook handling, order flow
  │     • All pass
  │
  ├─> PHASE 5: Code review
  │     • Reviews Stripe integration security
  │     • Reviews webhook signature validation
  │     • Reviews idempotency handling
  │     • Approves
  │
  ├─> PHASE 6: User acceptance
  │     • Reviews implementation
  │     • Tests manually with Stripe test mode
  │     → Approved
  │
  └─> PHASE 7: Finalized
        • Provides deployment checklist
        • Stripe webhook URL setup
        • Environment variables needed
        → Ready for staging deployment

┌─────────────────────────────────────────────────────────────────┐
│ OPTIONAL: Update API Documentation                              │
└─────────────────────────────────────────────────────────────────┘

/apidog Add payment endpoints to Apidog
  │
  └─> apidog agent
        • Fetches existing e-commerce schemas
        • Adds Payment, Order schemas
        • References existing Product, Cart schemas
        • Imports to Apidog with AUTO_MERGE
        → Documentation updated without breaking existing
```

---

## 🎯 Quick Reference

### When to Use Each Component

```
┌─────────────────────────────────────────────────────────────────┐
│ DECISION TREE: Which component should I use?                    │
└─────────────────────────────────────────────────────────────────┘

START: What do you want to do?
  │
  ├─> Create a NEW project from scratch
  │     → Use: /setup-project
  │
  ├─> Implement a COMPLETE feature (plan + code + test)
  │     → Use: /implement-api
  │     → Launches: api-architect → backend-developer
  │
  ├─> Just PLAN an API (no implementation)
  │     → Use: @api-architect
  │
  ├─> Just IMPLEMENT code (plan already exists)
  │     → Use: @backend-developer
  │
  └─> Sync API docs to Apidog
        → Use: /apidog
        → Launches: apidog agent
```

### Command Comparison Matrix

| Feature | /setup-project | /implement-api | /apidog |
|---------|---------------|----------------|---------|
| **Creates new project** | ✅ | ❌ | ❌ |
| **Plans architecture** | ❌ | ✅ (PHASE 1) | ❌ |
| **Implements code** | Partial (foundation) | ✅ (PHASE 2) | ❌ |
| **Runs quality checks** | ✅ | ✅ (PHASE 3) | ❌ |
| **Runs tests** | ✅ | ✅ (PHASE 4) | ❌ |
| **Code review** | ❌ | ✅ (PHASE 5) | ❌ |
| **User approval gates** | ❌ | ✅ (2 gates) | ❌ |
| **Syncs to Apidog** | ❌ | ❌ | ✅ |
| **Time estimate** | 10-15 min | 30-60 min | 5 min |
| **Agents launched** | 0 | 2+ | 1 |
| **Best for** | New projects | Complete features | API docs |

---

## 🔗 Cross-Plugin Integration

### Integration with Other Plugins

```
┌─────────────────────────────────────────────────────────────────┐
│                    Plugin Ecosystem                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  code-analysis   │       │    bun (this)    │       │    frontend      │
│     Plugin       │       │      Plugin      │       │      Plugin      │
│                  │       │                  │       │                  │
│ • codebase-      │◄──────│ /implement-api   │       │ • code-reviewer  │
│   detective      │ uses  │   checks for     │       │   agents         │
│ • semantic-      │       │   plugin         │       │                  │
│   code-search    │       │                  │──────►│ PHASE 5 uses     │
│                  │       │ • backend-       │ uses  │   for review     │
│ Used for:        │       │   developer      │       │                  │
│ • Find existing  │       │ • api-architect  │       │ Used for:        │
│   patterns       │       │ • apidog         │       │ • Code review    │
│ • Understand     │       │                  │       │ • Security       │
│   architecture   │       │ Shares:          │◄──────│   validation     │
│                  │       │ • OpenAPI specs  │ shares│                  │
│                  │       │ • TypeScript     │ types │                  │
│                  │       │   types (Prisma) │       │                  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### Shared Assets Between Plugins

| Asset | Generated By | Used By | Benefit |
|-------|-------------|---------|---------|
| **OpenAPI specs** | bun (apidog agent) | frontend | Type-safe API clients |
| **TypeScript types** | bun (Prisma) | frontend | End-to-end type safety |
| **camelCase convention** | bun (all agents) | frontend | Consistent naming |
| **Code review insights** | frontend (reviewers) | bun (/implement-api) | Quality assurance |
| **Pattern discovery** | code-analysis | bun (api-architect) | Architecture insights |

---

## ⚠️ Known Issues & Limitations

### Critical Issues

```
┌─────────────────────────────────────────────────────────────────┐
│ ISSUE 1: Apidog REST API Integration Incomplete                 │
└─────────────────────────────────────────────────────────────────┘

Location: plugins/bun/agents/apidog.md (STEP 6)
Status: ⚠️ DOCUMENTED BUT NOT IMPLEMENTED

What's missing:
  • Actual HTTP POST request to Apidog REST API
  • Error handling for API failures
  • Response parsing

Workaround:
  • Agent creates OpenAPI spec in /tmp/apidog-specs/
  • User can manually import to Apidog

Fix required:
  • Add Bash tool usage with curl
  • POST to https://api.apidog.com/v1/projects/{ID}/import-openapi
  • Parse import statistics from response
```

```
┌─────────────────────────────────────────────────────────────────┐
│ ISSUE 2: Environment Variable Validation Missing                │
└─────────────────────────────────────────────────────────────────┘

Location: All commands
Status: ⚠️ NO VALIDATION

What's missing:
  • DATABASE_URL format validation
  • JWT_SECRET existence check
  • APIDOG_* variables validation

Impact:
  • Cryptic errors during setup
  • Confusing failure messages

Fix required:
  • Add validation step at start of commands
  • Provide clear setup instructions on failure
```

---

## 🎓 Best Practices for Using This Plugin

### 1. Recommended Workflow

```
For new projects:
  /setup-project → /implement-api → (optional) /apidog

For existing projects:
  /implement-api → (optional) /apidog

For architecture planning only:
  @api-architect

For implementation only (plan exists):
  @backend-developer
```

### 2. Always Use TodoWrite

All agents and commands use TodoWrite. You'll see:
- Task lists during execution
- Progress tracking
- Clear completion status

### 3. Respect Approval Gates

`/implement-api` has 2 approval gates:
- **After planning** (PHASE 1): Review architecture before implementation
- **After implementation** (PHASE 6): Review code before finalization

Don't skip these - they save time by catching issues early.

### 4. Install Recommended Plugins

```
code-analysis plugin:
  ✅ Semantic code search
  ✅ Pattern discovery
  ✅ 40% faster investigation

frontend plugin:
  ✅ Code review agents
  ✅ Security validation
  ✅ Shared types and specs
```

### 5. Use camelCase Consistently

The plugin enforces camelCase for:
- API request fields
- API response fields
- Query parameters
- OpenAPI specs

This ensures frontend compatibility.

### 6. Follow Layered Architecture

Always maintain:
```
Routes → Controllers → Services → Repositories
```

- Controllers: HTTP only (no business logic)
- Services: Business logic (no HTTP)
- Repositories: Database only (no business logic)

---

## 📖 Additional Resources

### Internal Documentation

- **README.md** - Plugin overview and installation
- **best-practices.md** - Comprehensive guide (942 lines)
- **agents/*.md** - Individual agent specifications
- **commands/*.md** - Command workflows

### External Resources

- [Bun Docs](https://bun.sh/docs)
- [Hono Docs](https://hono.dev/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Biome Docs](https://biomejs.dev/)
- [Apidog Docs](https://apidog.com/help/)

---

## 🚀 Getting Started

```bash
# 1. Install the plugin
/plugin marketplace add MadAppGang/claude-code
/plugin install bun@mag-claude-plugins

# 2. Set up environment (if using Apidog)
echo "APIDOG_PROJECT_ID=your-id" >> .env
echo "APIDOG_API_TOKEN=your-token" >> .env

# 3. Create a new project
/setup-project Create a new REST API for [your use case]

# 4. Implement features
/implement-api Create [feature description]

# 5. (Optional) Sync to Apidog
/apidog Import my API endpoints

# 6. Deploy
git add .
git commit -m "feat: implement [feature]"
# Push to your deployment platform
```

---

**Last Updated**: November 2025
**Plugin Version**: 1.2.0
**Status**: ✅ Production Ready (with known issues)

---

*For issues or feedback, visit: https://github.com/MadAppGang/claude-code/issues*

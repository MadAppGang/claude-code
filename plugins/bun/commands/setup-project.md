---
name: setup-project
description: Initialize a new Bun + TypeScript backend project with best practices setup (Hono, Prisma, Biome, testing, Docker)
allowed-tools: Bash, Write, AskUserQuestion, TaskCreate, TaskUpdate, TaskList, TaskGet, Read
---

## Mission

Set up a production-ready Bun + TypeScript backend project from scratch with all necessary tooling, configuration, and project structure. This creates a solid foundation following industry best practices.

## Project Setup Request

$ARGUMENTS

## Workflow

### STEP 0: Initialize Todo List (MANDATORY FIRST STEP)

Create a todo list to track the setup process:

```
TaskCreate with the following items:
- content: "Gather project requirements and configuration preferences"
  status: "in_progress"
  activeForm: "Gathering project requirements"
- content: "Initialize Bun project and install dependencies"
  status: "pending"
  activeForm: "Initializing Bun project"
- content: "Configure TypeScript (strict mode)"
  status: "pending"
  activeForm: "Configuring TypeScript"
- content: "Configure Biome (formatter + linter)"
  status: "pending"
  activeForm: "Configuring Biome"
- content: "Set up Prisma with PostgreSQL"
  status: "pending"
  activeForm: "Setting up Prisma"
- content: "Create project structure (folders)"
  status: "pending"
  activeForm: "Creating project structure"
- content: "Create core utilities (errors, logger, config)"
  status: "pending"
  activeForm: "Creating core utilities"
- content: "Set up Hono app and server"
  status: "pending"
  activeForm: "Setting up Hono app"
- content: "Create middleware (error handler, logging, validation)"
  status: "pending"
  activeForm: "Creating middleware"
- content: "Set up environment variables and configuration"
  status: "pending"
  activeForm: "Setting up environment configuration"
- content: "Create Docker configuration"
  status: "pending"
  activeForm: "Creating Docker configuration"
- content: "Set up testing infrastructure"
  status: "pending"
  activeForm: "Setting up testing"
- content: "Create package.json scripts"
  status: "pending"
  activeForm: "Creating npm scripts"
- content: "Create .gitignore and other config files"
  status: "pending"
  activeForm: "Creating config files"
- content: "Create README.md with project documentation"
  status: "pending"
  activeForm: "Creating README"
- content: "Initialize git repository"
  status: "pending"
  activeForm: "Initializing git"
- content: "Run initial quality checks"
  status: "pending"
  activeForm: "Running quality checks"
```

### STEP 1: Gather Requirements

Ask the user for project configuration preferences:

```
Use AskUserQuestion with the following questions:

1. Project Name:
   Question: "What is the name of your backend project?"
   Options: [Let user type custom name]

2. Database:
   Question: "Which database will you use?"
   Options:
   - "PostgreSQL (recommended)"
   - "MySQL"
   - "SQLite (development only)"

3. Authentication:
   Question: "Do you need JWT authentication set up from the start?"
   Options:
   - "Yes, set up JWT authentication"
   - "No, I'll add it later"

4. Docker:
   Question: "Include Docker configuration for containerization?"
   Options:
   - "Yes, include Dockerfile and docker-compose.yml"
   - "No, skip Docker"

5. Additional Features:
   Question: "Which additional features would you like included?"
   Multi-select: true
   Options:
   - "Redis caching utilities"
   - "File upload handling"
   - "Email service integration"
   - "Health check endpoint"
```

**Store answers** for use in setup steps.

### STEP 2: Initialize Bun Project

1. **Initialize project**
   ```bash
   bun init -y
   ```

2. **Install runtime dependencies**
   ```bash
   bun add hono @hono/node-server
   bun add zod @prisma/client bcrypt jsonwebtoken pino
   ```

   If JWT authentication selected:
   ```bash
   bun add bcrypt jsonwebtoken
   ```

   If Redis caching selected:
   ```bash
   bun add ioredis
   ```

3. **Install dev dependencies**
   ```bash
   bun add -d @types/node @types/bun typescript prisma @biomejs/biome
   ```

   If JWT authentication selected:
   ```bash
   bun add -d @types/bcrypt @types/jsonwebtoken
   ```

### STEP 3: Configure TypeScript

Create `tsconfig.json` with strict configuration:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["bun-types"],
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@database/*": ["src/database/*"],
      "@services/*": ["src/services/*"],
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### STEP 4: Configure Biome

1. **Initialize Biome**
   ```bash
   bunx @biomejs/biome init
   ```

2. **Update biome.json**
   ```json
   {
     "$schema": "https://raw.githubusercontent.com/biomejs/biome/main/configuration_schema.json",
     "files": { "ignore": ["node_modules", "dist"] },
     "formatter": {
       "indentStyle": "space",
       "indentSize": 2,
       "lineWidth": 100,
       "quoteStyle": "single",
       "semicolons": "always"
     },
     "organizeImports": true,
     "javascript": { "formatter": { "trailingComma": "es5" } },
     "typescript": {
       "formatter": { "trailingComma": "es5" }
     }
   }
   ```

### STEP 5: Set Up Prisma

1. **Initialize Prisma**
   ```bash
   bunx prisma init
   ```

2. **Update DATABASE_URL in .env** (based on database selection)

   For PostgreSQL:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
   ```

   For MySQL:
   ```
   DATABASE_URL="mysql://user:password@localhost:3306/dbname"
   ```

   For SQLite:
   ```
   DATABASE_URL="file:./dev.db"
   ```

3. **Create initial Prisma schema** in `prisma/schema.prisma`:
   - Update datasource provider based on database selection
   - Add example User model
   - Add Session model if JWT auth selected

### STEP 6: Create Project Structure

Create directory structure:

```bash
mkdir -p src/{core,database/repositories,services,controllers,middleware,routes,schemas,types,utils}
mkdir -p tests/{unit,integration,e2e}
```

Result:
```
src/
├── core/              # Core utilities
├── database/
│   ├── client.ts
│   └── repositories/  # Data access layer
├── services/          # Business logic
├── controllers/       # HTTP handlers
├── middleware/        # Middleware functions
├── routes/            # API routes
├── schemas/           # Zod validation schemas
├── types/             # TypeScript types
└── utils/             # Utility functions
tests/
├── unit/
├── integration/
└── e2e/
```

### STEP 7: Create Core Utilities

1. **Error classes** (`src/core/errors.ts`)
   - ApiError base class
   - BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, ValidationError

2. **Logger** (`src/core/logger.ts`)
   - Pino logger with development/production config
   - Pretty printing in development

3. **Config** (`src/core/config.ts`)
   - Environment variable loading
   - Type-safe configuration object
   - Validation for required env vars

### STEP 8: Set Up Hono App

1. **Create Hono app** (`src/app.ts`)
   - Initialize Hono
   - Add CORS middleware
   - Add security headers middleware
   - Add request logging middleware
   - Add global error handler
   - Mount health check route (if selected)

2. **Create server** (`src/server.ts`)
   - Import Hono app
   - Set up graceful shutdown
   - Start server on configured port

### STEP 9: Create Middleware

1. **Error handler** (`src/middleware/errorHandler.ts`)
   - Global error handling
   - ApiError response formatting
   - Logging

2. **Validation middleware** (`src/middleware/validator.ts`)
   - validate() for request body
   - validateQuery() for query params

3. **Request logger** (`src/middleware/requestLogger.ts`)
   - Log incoming requests
   - Log responses with duration

4. **Security headers** (`src/middleware/security.ts`)
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Strict-Transport-Security

5. **Authentication middleware** (if JWT selected) (`src/middleware/auth.ts`)
   - authenticate() middleware
   - authorize() middleware for role-based access

### STEP 10: Set Up Environment Configuration

1. **Create .env.example**
   ```
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   JWT_SECRET=your-secret-key-change-in-production
   LOG_LEVEL=debug
   # Add REDIS_URL if Redis selected
   # Add other env vars based on selections
   ```

2. **Create .env** (copy from .env.example)

3. **Update .gitignore** to exclude .env

### STEP 11: Create Docker Configuration (if selected)

1. **Create Dockerfile** (multi-stage build)
   - Base stage
   - Dependencies stage
   - Build stage
   - Runner stage
   - Health check

2. **Create docker-compose.yml**
   - App service
   - PostgreSQL service
   - Redis service (if selected)
   - Health checks
   - Volume mounts

3. **Create .dockerignore**

### STEP 12: Set Up Testing

1. **Create test utilities** (`tests/setup.ts`)
   - Test database connection
   - Test data factories
   - Cleanup utilities

2. **Create example tests**
   - Unit test example (`tests/unit/example.test.ts`)
   - Integration test example (`tests/integration/health.test.ts`)

### STEP 13: Create Package.json Scripts

Update `package.json` with comprehensive scripts:

```json
{
  "scripts": {
    "dev": "bun --hot src/server.ts",
    "start": "NODE_ENV=production bun src/server.ts",
    "build": "bun build src/server.ts --target bun --outdir dist",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    "lint": "biome lint --write",
    "format": "biome format --write",
    "check": "biome check --write",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "bun run src/database/seed.ts",
    "docker:build": "docker build -t [project-name] .",
    "docker:run": "docker-compose up",
    "docker:down": "docker-compose down"
  }
}
```

### STEP 14: Create Configuration Files

1. **Create .gitignore**
   ```
   node_modules/
   dist/
   .env
   .env.local
   *.log
   .DS_Store
   coverage/
   prisma/migrations/
   bun.lockb
   ```

2. **Create .editorconfig** (optional)

3. **Create .vscode/settings.json** (Biome integration)
   ```json
   {
     "editor.defaultFormatter": "biomejs.biome",
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.organizeImports.biome": true,
       "source.fixAll.biome": true
     }
   }
   ```

### STEP 15: Create README.md

Create comprehensive README with:
- Project description
- Technology stack
- Project structure
- Prerequisites
- Installation instructions
- Development commands
- Testing instructions
- Docker instructions
- Environment variables
- API documentation (placeholder)
- Contributing guidelines
- License

### STEP 16: Initialize Git Repository

1. **Initialize git**
   ```bash
   git init
   ```

2. **Create initial commit**
   ```bash
   git add .
   git commit -m "Initial project setup: Bun + TypeScript + Hono + Prisma"
   ```

### STEP 17: Run Quality Checks

1. **Run Prisma generate**
   ```bash
   bunx prisma generate
   ```

2. **Run formatter**
   ```bash
   bun run format
   ```

3. **Run linter**
   ```bash
   bun run lint
   ```

4. **Run type checker**
   ```bash
   bun run typecheck
   ```

5. **Run tests**
   ```bash
   bun test
   ```

**Verify all checks pass** before finalizing.

### STEP 18: Completion Summary

Present final summary:

```
✅ Project Setup Complete!

Project: [project-name]
Stack: Bun + TypeScript + Hono + Prisma + [database]

Created:
- ✅ Project structure (src/, tests/)
- ✅ TypeScript configuration (strict mode)
- ✅ Biome configuration (format + lint)
- ✅ Prisma ORM setup ([database])
- ✅ Hono web framework
- ✅ Core utilities (errors, logger, config)
- ✅ Middleware (validation, auth, logging, security)
- ✅ Environment configuration
- ✅ Testing infrastructure
- ✅ [Docker configuration] (if selected)
- ✅ [JWT authentication] (if selected)
- ✅ [Redis caching] (if selected)
- ✅ Git repository initialized

Next steps:
1. Review .env and update with your database credentials
2. Run database migration: bun run db:migrate
3. Start development server: bun run dev
4. Open http://localhost:3000/health to verify setup
5. Begin implementing your API features!

Useful commands:
- bun run dev          # Start dev server with hot reload
- bun run test         # Run tests
- bun run check        # Format + lint
- bun run db:studio    # Open Prisma Studio
- bun run docker:run   # Start with Docker

Documentation:
- See README.md for full documentation
- See best-practices skill for development guidelines
- Use /implement-api command to build features
```

## Success Criteria

Project setup is complete when:

- ✅ All dependencies installed
- ✅ TypeScript configured (strict mode)
- ✅ Biome configured (format + lint)
- ✅ Prisma set up with database connection
- ✅ Project structure created
- ✅ Core utilities implemented
- ✅ Hono app and server created
- ✅ Middleware set up
- ✅ Environment configuration created
- ✅ Testing infrastructure ready
- ✅ Docker configuration created (if selected)
- ✅ All quality checks pass
- ✅ Git repository initialized
- ✅ README.md created

## Error Handling

If any step fails:

1. **Identify the issue**
   - Read error message
   - Check what command failed

2. **Common issues:**
   - Bun not installed → Install Bun first
   - Database connection failed → Update DATABASE_URL in .env
   - Port already in use → Change PORT in .env
   - Missing dependencies → Run `bun install`

3. **Recovery:**
   - Fix the issue
   - Re-run the failed step
   - Continue with remaining steps

## Remember

This command creates a **production-ready foundation**. After setup:
- Use `/implement-api` to build features
- Use `backend-developer` agent for implementation
- Use `api-architect` agent for planning
- Follow the best-practices skill for guidelines

The result is a clean, well-structured, fully-configured Bun backend project ready for feature development.

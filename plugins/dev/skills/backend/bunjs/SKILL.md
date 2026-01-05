# Bun.js Backend Patterns

**Skill**: bunjs
**Plugin**: dev
**Version**: 2.0.0

## Overview

Bun runtime patterns for building fast TypeScript backend services. This skill covers core Bun features, HTTP servers with Hono, database access with Prisma, validation with Zod, error handling, testing, and configuration patterns.

**When to use this skill:**
- Implementing basic HTTP endpoints and route handlers
- Setting up middleware patterns (CORS, logging, auth)
- Working with SQLite or PostgreSQL databases
- Implementing request validation with Zod
- Writing tests with Bun's native test runner
- Basic file operations and WebSocket handling

**For advanced topics, see:**
- **dev:bunjs-architecture** - Layered architecture, clean code patterns, camelCase conventions
- **dev:bunjs-production** - Docker, AWS, Redis caching, security, CI/CD
- **dev:bunjs-apidog** - OpenAPI specs and Apidog integration

## Why Bun

Bun fundamentally transforms TypeScript backend development by:
- **Native TypeScript execution** - No build steps in development
- **Lightning-fast performance** - 3-4x faster than Node.js for many operations
- **Unified toolkit** - Built-in test runner, bundler, and transpiler
- **Drop-in compatibility** - Most Node.js APIs and npm packages work
- **Developer experience** - Hot reload with `--hot`, instant feedback

## Stack Overview

- **Bun 1.x** (runtime, package manager, test runner, bundler)
- **TypeScript 5.7** (strict mode)
- **Hono 4.6** (ultra-fast web framework, TypeScript-first)
- **Prisma 6.2** (type-safe ORM)
- **Biome 2.3** (formatting + linting, replaces ESLint + Prettier)
- **Zod** (runtime validation)
- **PostgreSQL 17 / SQLite** (database)

## Project Structure

```
project-root/
├── src/
│   ├── server.ts              # Entry point (starts server)
│   ├── app.ts                 # Hono app initialization & middleware
│   ├── config.ts              # Environment configuration
│   ├── core/                  # Core utilities (errors, logger, responses)
│   ├── database/
│   │   ├── client.ts          # Prisma client setup
│   │   └── repositories/      # Data access layer (Prisma queries)
│   ├── services/              # Business logic layer
│   ├── controllers/           # HTTP handlers (calls services)
│   ├── middleware/            # Hono middleware (auth, validation, etc.)
│   ├── routes/                # API route definitions
│   ├── schemas/               # Zod validation schemas
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── tests/
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests (API + DB)
├── prisma/                    # Prisma schema & migrations
├── tsconfig.json              # TypeScript config
├── biome.json                 # Biome config
├── package.json               # Bun-managed dependencies
└── bun.lockb                  # Bun lockfile
```

**Key Principles:**
- Structure by **technical capability**, not by feature
- Each layer has **single responsibility**
- No HTTP handling in services, no business logic in controllers
- Easy to test components in isolation

## Quick Start

```bash
# Initialize project
bun init

# Install dependencies
bun add hono @hono/node-server zod @prisma/client bcrypt jsonwebtoken
bun add -d @types/node @types/jsonwebtoken @types/bcrypt typescript prisma @biomejs/biome @types/bun

# Initialize tools
bunx tsc --init
bunx prisma init
bunx @biomejs/biome init
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "bun --hot src/server.ts",
    "start": "NODE_ENV=production bun src/server.ts",
    "build": "bun build src/server.ts --target bun --outdir dist",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "lint": "biome lint --write",
    "format": "biome format --write",
    "check": "biome check --write",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

## TypeScript Configuration

**tsconfig.json (key settings):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "types": ["bun-types"],
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@database/*": ["src/database/*"],
      "@services/*": ["src/services/*"],
      "@/*": ["src/*"]
    }
  }
}
```

**Critical settings:**
- `"strict": true` - Enable all strict checks
- `"moduleResolution": "bundler"` - Aligns with Bun's resolver
- Use `paths` for clean imports (`@core/*`, `@services/*`)

## HTTP Server with Hono

### Basic Server Setup

**Entry point (src/server.ts):**
```typescript
import { serve } from '@hono/node-server';
import { app } from './app';

const PORT = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port: PORT });
console.log(`🚀 Server running on port ${PORT}`);
```

**App initialization (src/app.ts):**
```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import userRouter from './routes/user.routes';

export const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// API routes
app.route('/api/users', userRouter);
```

### Route Handlers

**Routes (src/routes/user.routes.ts):**
```typescript
import { Hono } from 'hono';
import * as userController from '../controllers/user.controller';
import { validate } from '../middleware/validator';
import { createUserSchema } from '../schemas/user.schema';

const userRouter = new Hono();

userRouter.get('/', userController.getUsers);
userRouter.get('/:id', userController.getUserById);
userRouter.post('/', validate(createUserSchema), userController.createUser);
userRouter.put('/:id', userController.updateUser);
userRouter.delete('/:id', userController.deleteUser);

export default userRouter;
```

**Controllers (src/controllers/user.controller.ts):**
```typescript
import type { Context } from 'hono';
import * as userService from '../services/user.service';

export const createUser = async (c: Context) => {
  const data = c.get('validatedData');
  const user = await userService.createUser(data);
  return c.json(user, 201);
};

export const getUserById = async (c: Context) => {
  const id = c.req.param('id');
  const user = await userService.getUserById(id);
  return c.json(user);
};

export const getUsers = async (c: Context) => {
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;
  const result = await userService.getUsers({ page, limit });
  return c.json(result);
};

export const updateUser = async (c: Context) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const user = await userService.updateUser(id, data);
  return c.json(user);
};

export const deleteUser = async (c: Context) => {
  const id = c.req.param('id');
  await userService.deleteUser(id);
  return c.json({ message: 'User deleted' });
};
```

## Middleware Patterns

### Validation Middleware

**src/middleware/validator.ts:**
```typescript
import { z, ZodSchema } from 'zod';
import type { Context, Next } from 'hono';

export const validate = (schema: ZodSchema) => async (c: Context, next: Next) => {
  try {
    const body = await c.req.json();
    c.set('validatedData', schema.parse(body));
    await next();
  } catch (e) {
    if (e instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: e.issues }, 422);
    }
    throw e;
  }
};

export const validateQuery = (schema: ZodSchema) => async (c: Context, next: Next) => {
  try {
    c.set('validatedQuery', schema.parse(c.req.query()));
    await next();
  } catch (e) {
    if (e instanceof z.ZodError) {
      return c.json({ error: 'Invalid query parameters', details: e.issues }, 422);
    }
    throw e;
  }
};
```

### Authentication Middleware

**src/middleware/auth.ts:**
```typescript
import type { Context, Next } from 'hono';
import { verifyToken } from '../services/auth.service';

export const authenticate = async (c: Context, next: Next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid token' }, 401);
  }

  try {
    const token = header.slice(7);
    const payload = await verifyToken(token);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};

export const authorize = (...roles: string[]) => async (c: Context, next: Next) => {
  const user = c.get('user') as { role: string } | undefined;
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  if (!roles.includes(user.role)) {
    return c.json({ error: 'Insufficient permissions' }, 403);
  }
  await next();
};
```

### Logging Middleware

**src/middleware/requestLogger.ts:**
```typescript
import type { Context, Next } from 'hono';

export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);

  console.log(`[${requestId}] ${c.req.method} ${c.req.path}`);

  await next();

  const duration = Date.now() - start;
  console.log(`[${requestId}] ${c.res.status} ${duration}ms`);
};
```

## Database Access

### SQLite with Bun

```typescript
import { Database } from 'bun:sqlite';

const db = new Database('app.db');

// Enable WAL mode for better performance
db.exec('PRAGMA journal_mode = WAL');

// Prepared statements
const findUserById = db.prepare<{ id: string }, [string]>(
  'SELECT * FROM users WHERE id = ?'
);

const createUser = db.prepare<void, [string, string, string]>(
  'INSERT INTO users (id, name, email) VALUES (?, ?, ?)'
);

// Repository
export const userRepository = {
  findById(id: string) {
    return findUserById.get(id);
  },

  create(user: { id: string; name: string; email: string }) {
    createUser.run(user.id, user.name, user.email);
    return user;
  },

  findAll(options: { limit: number; offset: number }) {
    return db.prepare(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(options.limit, options.offset);
  },
};
```

### PostgreSQL with Prisma

**Prisma client setup (src/database/client.ts):**
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

**Repository pattern (src/database/repositories/user.repository.ts):**
```typescript
import { prisma } from '../client';
import type { Prisma, User } from '@prisma/client';

export class UserRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.user.delete({ where: { id } });
  }

  async exists(email: string) {
    return (await prisma.user.count({ where: { email } })) > 0;
  }

  async findMany(options: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany(options),
      prisma.user.count({ where: options.where })
    ]);
    return { users, total };
  }
}

export const userRepository = new UserRepository();
```

**Prisma commands:**
```bash
bunx prisma generate         # Generate client
bunx prisma migrate dev      # Create migration
bunx prisma migrate deploy   # Apply migrations (prod)
bunx prisma studio          # GUI for DB
bunx prisma db seed         # Seed database
bunx prisma format          # Format schema
```

## Validation with Zod

**Validation schemas (src/schemas/user.schema.ts):**
```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  name: z.string().min(2).max(100),
  role: z.enum(['user', 'admin', 'moderator']).default('user')
});

export const updateUserSchema = createUserSchema.partial();

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'name', 'email']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  role: z.enum(['user', 'admin', 'moderator']).optional()
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
```

**Why Zod:**
- Runtime type validation (catches invalid data at boundaries)
- TypeScript type inference (`z.infer<typeof schema>`)
- Clear error messages for users
- Composable schemas (`.partial()`, `.extend()`, `.pick()`)

## Error Handling

**Custom error classes (src/core/errors.ts):**
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors: any) {
    super(message, 'VALIDATION_ERROR', 422);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}
```

**Global error handler (src/middleware/errorHandler.ts):**
```typescript
import type { Context } from 'hono';
import { AppError } from '../core/errors';

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json({
      error: {
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError && { details: err.errors })
      }
    }, err.statusCode);
  }

  console.error('Unexpected error:', err);
  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  }, 500);
}

// In app.ts
app.onError(errorHandler);
```

## Testing with Bun

Bun includes a fast, built-in test runner with Jest-like APIs.

**Unit test example (tests/unit/services/user.service.test.ts):**
```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createUser, getUserById } from '../../../src/services/user.service';
import { prisma } from '../../../src/database/client';

describe('UserService', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  test('createUser creates a user and strips password', async () => {
    const user = await createUser({
      email: 'test@example.com',
      password: 'Abcdef1!',
      name: 'Test User',
      role: 'user'
    });

    expect(user).toHaveProperty('email', 'test@example.com');
    expect(user).toHaveProperty('name', 'Test User');
    expect(user).not.toHaveProperty('password');
  });

  test('getUserById throws NotFoundError for missing user', async () => {
    await expect(getUserById('nonexistent')).rejects.toThrow('User not found');
  });
});
```

**Integration test example (tests/integration/api/user.test.ts):**
```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { app } from '../../../src/app';
import { prisma } from '../../../src/database/client';

describe('User API', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  test('POST /api/users creates a user', async () => {
    const res = await app.request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'Abcdef1!',
        name: 'New User'
      })
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.email).toBe('new@example.com');
    expect(body).not.toHaveProperty('password');
  });

  test('POST /api/users validates input', async () => {
    const res = await app.request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'J' }) // Invalid
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  test('GET /api/users/:id returns user', async () => {
    const created = await app.request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'get@example.com',
        password: 'Abcdef1!',
        name: 'Get User'
      })
    });
    const createdBody = await created.json();

    const res = await app.request(`http://localhost/api/users/${createdBody.id}`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(createdBody.id);
  });
});
```

**Test commands:**
```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test --coverage   # With coverage
bun test user.test.ts # Specific file
```

## Configuration

**Environment configuration (src/config.ts):**
```typescript
const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgres://localhost/app',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};

export default config;
```

**.env files:**
```bash
# Development
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_SECRET="dev-secret"
NODE_ENV="development"

# Production (use secrets manager)
DATABASE_URL="postgresql://user:password@prod-host:5432/mydb"
JWT_SECRET="strong-random-secret"
NODE_ENV="production"
```

## File Operations

**File uploads:**
```typescript
router.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Invalid file type' }, 400);
  }

  // Save file
  const filename = `${crypto.randomUUID()}-${file.name}`;
  await Bun.write(`./uploads/${filename}`, file);

  return c.json({
    data: { filename, size: file.size, type: file.type }
  });
});
```

**Reading files:**
```typescript
const data = await Bun.file('data.json').json();
const text = await Bun.file('README.md').text();
const buffer = await Bun.file('image.png').arrayBuffer();
```

## WebSocket

```typescript
const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    if (req.url.endsWith('/ws')) {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return undefined;
    }
    return app.fetch(req);
  },
  websocket: {
    open(ws) {
      console.log('Client connected');
    },
    message(ws, message) {
      console.log('Received:', message);
      ws.send(`Echo: ${message}`);
    },
    close(ws) {
      console.log('Client disconnected');
    },
  },
});
```

## Quality Checks

Before presenting code, run these checks:

```bash
# 1. Format code
bun run format

# 2. Lint code
bun run lint

# 3. Type check
bun run typecheck

# 4. Run tests
bun test

# 5. Generate Prisma client (if schema changed)
bunx prisma generate
```

## Code Quality with Biome

**biome.json:**
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.3/schema.json",
  "files": {
    "ignore": ["node_modules", "dist", ".next"]
  },
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5",
      "semicolons": "always"
    }
  }
}
```

**Commands:**
```bash
bun run check        # format + lint with autofix
bun run lint         # lint only
bun run format       # format only
```

---

*Bun.js patterns for fast TypeScript backend development. For advanced architecture patterns, see dev:bunjs-architecture. For production deployment, see dev:bunjs-production.*

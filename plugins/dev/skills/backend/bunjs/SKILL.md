# Bun.js Backend Patterns

**Skill**: bunjs
**Plugin**: dev
**Version**: 1.0.0

## Overview

Bun runtime patterns for building fast TypeScript backend services.

## Project Structure

```
project/
├── src/
│   ├── index.ts              # Entry point
│   ├── routes/               # Route handlers
│   │   ├── index.ts
│   │   └── users.ts
│   ├── services/             # Business logic
│   ├── repositories/         # Data access
│   ├── middleware/           # HTTP middleware
│   ├── lib/                  # Utilities
│   └── types/                # TypeScript types
├── tests/                    # Test files
├── package.json
├── tsconfig.json
└── bunfig.toml
```

## HTTP Server

### Basic Server

```typescript
const server = Bun.serve({
  port: process.env.PORT || 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok' });
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
```

### Router Pattern

```typescript
// routes/index.ts
type Handler = (req: Request, params: Record<string, string>) => Response | Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

class Router {
  private routes: Route[] = [];

  private addRoute(method: string, path: string, handler: Handler) {
    const paramNames: string[] = [];
    const pattern = new RegExp(
      '^' + path.replace(/:(\w+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      }) + '$'
    );
    this.routes.push({ method, pattern, paramNames, handler });
  }

  get(path: string, handler: Handler) { this.addRoute('GET', path, handler); }
  post(path: string, handler: Handler) { this.addRoute('POST', path, handler); }
  put(path: string, handler: Handler) { this.addRoute('PUT', path, handler); }
  delete(path: string, handler: Handler) { this.addRoute('DELETE', path, handler); }

  handle(req: Request): Response | Promise<Response> {
    const url = new URL(req.url);

    for (const route of this.routes) {
      if (route.method !== req.method) continue;

      const match = url.pathname.match(route.pattern);
      if (!match) continue;

      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });

      return route.handler(req, params);
    }

    return new Response('Not Found', { status: 404 });
  }
}

export const router = new Router();
```

### Route Handlers

```typescript
// routes/users.ts
import { router } from './index';
import { userService } from '../services/user';
import { validateBody, createUserSchema } from '../lib/validation';

router.get('/api/users', async (req) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  const users = await userService.findAll({ page, limit });
  return Response.json({ data: users });
});

router.get('/api/users/:id', async (req, params) => {
  const user = await userService.findById(params.id);
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }
  return Response.json({ data: user });
});

router.post('/api/users', async (req) => {
  const body = await req.json();
  const validated = validateBody(createUserSchema, body);

  const user = await userService.create(validated);
  return Response.json({ data: user }, { status: 201 });
});
```

## Middleware Pattern

```typescript
// middleware/index.ts
type Middleware = (
  req: Request,
  next: () => Response | Promise<Response>
) => Response | Promise<Response>;

function compose(middlewares: Middleware[], handler: () => Response | Promise<Response>) {
  return middlewares.reduceRight(
    (next, middleware) => () => middleware(req, next),
    handler
  );
}

// Logging middleware
const logger: Middleware = async (req, next) => {
  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;

  console.log(`${req.method} ${req.url} ${response.status} ${duration.toFixed(2)}ms`);
  return response;
};

// CORS middleware
const cors: Middleware = async (req, next) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const response = await next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
};

// Auth middleware
const auth: Middleware = async (req, next) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token);
    req.user = payload;
    return next();
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
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

### PostgreSQL with Bun

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

export const db = {
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  },

  async execute(sql: string, params?: unknown[]): Promise<void> {
    await pool.query(sql, params);
  },
};
```

## Validation with Zod

```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export function validateBody<T>(schema: z.Schema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.errors);
  }
  return result.data;
}
```

## Error Handling

```typescript
// lib/errors.ts
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
  constructor(public errors: z.ZodIssue[]) {
    super('Validation failed', 'VALIDATION_ERROR', 400);
  }
}

// Error handler
export function handleError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError && { details: error.errors }),
      },
    }, { status: error.statusCode });
  }

  console.error('Unexpected error:', error);
  return Response.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  }, { status: 500 });
}
```

## Testing

```typescript
// tests/users.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { server } from '../src/index';

describe('Users API', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup
  });

  test('GET /api/users returns users', async () => {
    const response = await fetch(`http://localhost:${server.port}/api/users`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('POST /api/users creates user', async () => {
    const response = await fetch(`http://localhost:${server.port}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data.name).toBe('John Doe');
  });

  test('POST /api/users validates input', async () => {
    const response = await fetch(`http://localhost:${server.port}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'J' }), // Invalid
    });

    expect(response.status).toBe(400);
  });
});
```

## Configuration

```typescript
// lib/config.ts
const config = {
  port: parseInt(process.env.PORT || '3000'),
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

## File Uploads

```typescript
router.post('/api/upload', async (req) => {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // Save file
  const filename = `${crypto.randomUUID()}-${file.name}`;
  await Bun.write(`./uploads/${filename}`, file);

  return Response.json({
    data: { filename, size: file.size, type: file.type },
  });
});
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
    return router.handle(req);
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

---

*Bun.js patterns for fast TypeScript backend development*

---
name: bunjs-production
version: 1.0.0
description: Use when deploying Bun.js to production, containerizing with Docker, setting up AWS ECS/Fargate, implementing Redis caching, hardening security, or configuring CI/CD pipelines. See bunjs for basics, bunjs-architecture for patterns.
keywords:
  - production deployment
  - Docker
  - AWS ECS
  - Redis
  - caching
  - security
  - CI/CD
  - logging
  - monitoring
  - rate limiting
plugin: dev
updated: 2026-01-20
---

# Bun.js Production Deployment Patterns

## Overview

This skill covers production deployment patterns for Bun.js TypeScript backend applications, including Docker containerization, AWS ECS deployment, Redis caching, security hardening, structured logging, CI/CD pipelines, and production readiness checklists.

**When to use this skill:**
- Containerizing applications with Docker
- Deploying to AWS ECS/Fargate
- Implementing Redis caching strategies
- Hardening security (headers, CORS, rate limiting)
- Setting up CI/CD pipelines
- Preparing for production deployment

**See also:**
- **dev:bunjs** - Core Bun patterns, HTTP servers, database access
- **dev:bunjs-architecture** - Layered architecture, camelCase conventions
- **dev:bunjs-apidog** - OpenAPI specifications and Apidog integration

## Docker Multi-Stage Build

### Production Dockerfile

```dockerfile
# Stage 1: Base
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json bun.lockb ./
COPY prisma ./prisma/
RUN bun install --frozen-lockfile --production

# Stage 3: Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
RUN bun run build  # Optional: if you have a build step

# Stage 4: Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 bungroup && \
    adduser -D -u 1001 -G bungroup bunuser

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json bun.lockb ./

# Set ownership
RUN chown -R bunuser:bungroup /app

USER bunuser
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["bun", "src/server.ts"]
```

### docker-compose.yml (Local Development)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@postgres:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./src:/app/src
    command: bun --hot src/server.ts

  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

### Build and Run Commands

```bash
# Build image
docker build -t myapp:latest .

# Run locally
docker-compose up -d

# Run migrations
docker-compose exec app bunx prisma migrate deploy

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

## Graceful Shutdown

### Server with Shutdown Handling

```typescript
// src/server.ts
import { serve } from '@hono/node-server';
import { app } from './app';
import { prisma } from '@/database/client';
import { logger } from '@core/logger';

const PORT = Number(process.env.PORT) || 3000;

// Start server
const server = serve({
  fetch: app.fetch,
  port: PORT
});

logger.info(`🚀 Server running on port ${PORT}`);

// Graceful shutdown handler
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, initiating graceful shutdown...`);

  try {
    // Close HTTP server (stop accepting new requests)
    server.close();
    logger.info('HTTP server closed');

    // Close database connections
    await prisma.$disconnect();
    logger.info('Database connections closed');

    // Close Redis connections (if used)
    // await redis.quit();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
}

// Handle termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  shutdown('UNCAUGHT_EXCEPTION');
});
```

## AWS ECS Deployment

### Task Definition (JSON)

```json
{
  "family": "myapp",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "myapp",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:myapp/DATABASE_URL"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:myapp/JWT_SECRET"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/myapp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 30
      }
    }
  ]
}
```

### Service Definition (JSON)

```json
{
  "serviceName": "myapp",
  "cluster": "production-cluster",
  "taskDefinition": "myapp:1",
  "desiredCount": 2,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-12345678",
        "subnet-87654321"
      ],
      "securityGroups": [
        "sg-12345678"
      ],
      "assignPublicIp": "DISABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/myapp/1234567890123456",
      "containerName": "myapp",
      "containerPort": 3000
    }
  ],
  "healthCheckGracePeriodSeconds": 60
}
```

### Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

# Variables
AWS_REGION="us-east-1"
ECR_REGISTRY="123456789012.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_NAME="myapp"
IMAGE_TAG="${GITHUB_SHA:0:7}"
CLUSTER_NAME="production-cluster"
SERVICE_NAME="myapp"

# 1. Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# 2. Build image
docker build -t $IMAGE_NAME:$IMAGE_TAG .

# 3. Tag image
docker tag $IMAGE_NAME:$IMAGE_TAG $ECR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG
docker tag $IMAGE_NAME:$IMAGE_TAG $ECR_REGISTRY/$IMAGE_NAME:latest

# 4. Push to ECR
docker push $ECR_REGISTRY/$IMAGE_NAME:$IMAGE_TAG
docker push $ECR_REGISTRY/$IMAGE_NAME:latest

# 5. Update ECS service (force new deployment)
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region $AWS_REGION

echo "Deployment initiated. Check ECS console for status."
```

## Caching with Redis

### Redis Client Setup

```typescript
// src/utils/redis.ts
import Redis from 'ioredis';
import { logger } from '@core/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    logger.error({ error: err }, 'Redis connection error');
    return true;
  }
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error({ error: err }, 'Redis error');
});

// Graceful shutdown
export async function closeRedis() {
  await redis.quit();
  logger.info('Redis connection closed');
}
```

### Cache Utilities

```typescript
// src/utils/cache.ts
import { redis } from './redis';

export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds: number
): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDelete(key: string): Promise<void> {
  await redis.del(key);
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Cache-aside pattern
export async function cached<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit) return hit;

  const value = await fn();
  await cacheSet(key, value, ttl);
  return value;
}
```

### Usage in Services

```typescript
// src/services/user.service.ts
import { cached, cacheDelete } from '@utils/cache';
import { userRepository } from '@/database/repositories/user.repository';

export const getUserById = async (id: string) => {
  return cached(`user:${id}`, 300, async () => {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User');
    const { password, ...withoutPassword } = user;
    return withoutPassword;
  });
};

export const updateUser = async (id: string, data: UpdateUserDto) => {
  const user = await userRepository.update(id, data);

  // Invalidate cache after update
  await cacheDelete(`user:${id}`);

  const { password, ...withoutPassword } = user;
  return withoutPassword;
};
```

### Cache Key Conventions

```typescript
// ✅ CORRECT: Namespaced keys
const keys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  userOrders: (id: string) => `user:${id}:orders`,
  orderList: (page: number) => `orders:page:${page}`,
};

// Cache TTLs
const ttl = {
  short: 60,        // 1 minute
  medium: 300,      // 5 minutes
  long: 3600,       // 1 hour
  veryLong: 86400,  // 1 day
};
```

## Security Best Practices

### Security Headers Middleware

```typescript
// src/middleware/security.ts
import type { Context, Next } from 'hono';

export const securityHeaders = async (c: Context, next: Next) => {
  await next();

  // Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  c.header('X-Frame-Options', 'DENY');

  // Enable XSS filter
  c.header('X-XSS-Protection', '1; mode=block');

  // Force HTTPS
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Content Security Policy
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'");

  // Referrer Policy
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
};
```

### CORS Configuration

```typescript
// src/app.ts
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: (origin) => {
    // Whitelist approach
    const allowedOrigins = [
      'https://yourapp.com',
      'https://www.yourapp.com',
      'https://admin.yourapp.com'
    ];

    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
      allowedOrigins.push('http://localhost:5173');
    }

    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 86400
}));
```

### Rate Limiting

```typescript
// src/middleware/rateLimit.ts
import { redis } from '@utils/redis';
import type { Context, Next } from 'hono';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: Context) => string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator = (c) => c.req.header('x-forwarded-for') || 'unknown' } = options;

  return async (c: Context, next: Next) => {
    const key = `ratelimit:${keyGenerator(c)}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }

    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - current).toString());

    if (current > maxRequests) {
      return c.json({ error: 'Too many requests' }, 429);
    }

    await next();
  };
}

// Usage in routes
app.use('/api/*', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 100
}));

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5  // Stricter for login
}));
```

### Password Hashing

```typescript
// src/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### JWT Token Security

```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
```

## Structured Logging with Pino

### Logger Setup

```typescript
// src/core/logger.ts
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

  // Pretty print in development
  transport: isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,

  // Remove pid and hostname in production
  base: isDev ? undefined : {},

  // Custom formatters
  formatters: {
    level: (label) => ({ level: label })
  },

  // Redact sensitive fields
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie'],
    censor: '[REDACTED]'
  }
});
```

### Request Logging Middleware

```typescript
// src/middleware/requestLogger.ts
import type { Context, Next } from 'hono';
import { logger } from '@core/logger';

export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  c.set('requestId', requestId);

  logger.info({
    type: 'request',
    requestId,
    method: c.req.method,
    path: c.req.path,
    query: c.req.query(),
    userAgent: c.req.header('user-agent')
  });

  await next();

  const duration = Date.now() - start;

  logger.info({
    type: 'response',
    requestId,
    status: c.res.status,
    duration: `${duration}ms`
  });
};
```

### Logging Best Practices

```typescript
// ✅ CORRECT: Structured logging
logger.info({ userId: '123', action: 'login' }, 'User logged in');

// ✅ CORRECT: Error logging with context
logger.error({ error: err, userId: '123' }, 'Failed to create order');

// ❌ WRONG: String-only logs (not queryable)
logger.info('User 123 logged in');

// ❌ WRONG: Logging sensitive data
logger.info({ password: 'secret123' }, 'User created');  // BAD!
```

## CI/CD with GitHub Actions

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('bun.lockb') }}
          restore-keys: |
            ${{ runner.os }}-bun-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run Biome check
        run: bun run check

      - name: TypeScript type check
        run: bun run typecheck

      - name: Generate Prisma client
        run: bunx prisma generate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Run migrations
        run: bunx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Run tests
        run: bun test --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
          NODE_ENV: test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions:
      id-token: write  # Required for AWS OIDC
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: myapp
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster production-cluster \
            --service myapp \
            --force-new-deployment
```

## Production Readiness Checklist

### Security
- [ ] No secrets in code (use AWS Secrets Manager or Parameter Store)
- [ ] Password hashing with bcrypt (10+ rounds)
- [ ] JWT with reasonable expiries (15m access, 7d refresh)
- [ ] CORS restricted to known origins (no wildcards)
- [ ] Rate limiting enabled (per endpoint and global)
- [ ] Security headers configured (CSP, X-Frame-Options, HSTS, etc.)
- [ ] Least-privilege database user (no superuser)
- [ ] Input validation on all endpoints (Zod schemas)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (escape user input, CSP headers)

### Performance
- [ ] Database indexes on frequently queried fields
- [ ] Query optimization (select only needed fields)
- [ ] Redis caching for expensive operations
- [ ] Compression enabled (gzip/brotli)
- [ ] Connection pooling configured (Prisma)
- [ ] Pagination implemented for list endpoints
- [ ] N+1 query prevention (Prisma includes)

### Reliability
- [ ] Health checks implemented (`/health` endpoint)
- [ ] Graceful shutdown handling (SIGTERM, SIGINT)
- [ ] Structured logging with Pino
- [ ] Error tracking configured (Sentry, CloudWatch)
- [ ] Database backups & disaster recovery plan
- [ ] Zero-downtime deployments (rolling updates)
- [ ] Auto-scaling configured (CPU/memory thresholds)

### Monitoring
- [ ] CloudWatch logs enabled
- [ ] CloudWatch metrics (CPU, memory, request count)
- [ ] CloudWatch alarms (high error rate, high latency)
- [ ] Application metrics (request duration, DB query time)
- [ ] Log aggregation configured
- [ ] Uptime monitoring (external service)

### Quality
- [ ] Tests passing with >80% coverage
- [ ] Biome checks passing (format + lint)
- [ ] TypeScript strict mode enabled
- [ ] No console.log in production code (use logger)
- [ ] Error handling comprehensive
- [ ] API documentation up to date (OpenAPI/Swagger)

### Deployment
- [ ] CI/CD pipeline working (GitHub Actions)
- [ ] Migrations tested and reversible
- [ ] Rollback strategy defined
- [ ] Staging environment with prod parity
- [ ] Load testing performed
- [ ] Security audit completed

## Environment Variables

### Development (.env)
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-in-prod
LOG_LEVEL=debug
```

### Production (AWS Secrets Manager)
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=<from-secrets-manager>
REDIS_URL=<from-elasticache>
JWT_SECRET=<from-secrets-manager>
LOG_LEVEL=info
```

**NEVER commit `.env` files to git. Use `.env.example` template instead.**

## Performance Optimization Tips

### 1. Database Query Optimization

```typescript
// ❌ WRONG: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const orders = await prisma.order.findMany({ where: { userId: user.userId } });
}

// ✅ CORRECT: Include relations
const users = await prisma.user.findMany({
  include: { orders: true }
});

// ✅ CORRECT: Select only needed fields
const users = await prisma.user.findMany({
  select: { userId: true, firstName: true, emailAddress: true }
});
```

### 2. Redis Caching Strategy

```typescript
// Cache frequently accessed, rarely changing data
const popularProducts = await cached('products:popular', 3600, () =>
  productRepository.findPopular(10)
);

// Short TTL for data that changes frequently
const userProfile = await cached(`user:${userId}:profile`, 300, () =>
  userRepository.findById(userId)
);

// Invalidate cache on updates
await cacheDelete(`user:${userId}:profile`);
```

### 3. Connection Pooling

```typescript
// Prisma connection pool (in schema.prisma)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool parameters
  // postgresql://user:password@host:5432/db?connection_limit=10&pool_timeout=60
}
```

---

*Production deployment patterns for Bun.js TypeScript backend. For core patterns, see dev:bunjs. For architecture, see dev:bunjs-architecture.*

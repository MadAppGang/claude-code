# Error Handling Patterns

**Skill**: error-handling
**Plugin**: dev
**Version**: 1.0.0

## Overview

Backend error handling patterns for building robust and debuggable services.

## Error Types

### Custom Error Classes

```typescript
// Base application error
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      'NOT_FOUND',
      404
    );
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

class RateLimitError extends AppError {
  constructor(public retryAfter: number) {
    super('Too many requests', 'RATE_LIMIT', 429);
  }
}
```

## Error Response Format

### Standard Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;  // Only in development
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

function formatError(error: AppError, requestId: string): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (error instanceof ValidationError && error.fields) {
    response.error.details = error.fields;
  }

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
}
```

### Example Responses

```json
// Validation error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format",
      "password": "Must be at least 8 characters"
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// Not found error
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User with id 123 not found"
  },
  "meta": {
    "requestId": "req_def456",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// Server error (production)
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  },
  "meta": {
    "requestId": "req_ghi789",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Error Handling Middleware

### Express Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

// Async handler wrapper
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Error handler middleware
function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.headers['x-request-id'] as string || generateId();

  // Log error
  logger.error('Request failed', {
    requestId,
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(
      formatError(error, requestId)
    );
  }

  // Handle unknown errors
  const internalError = new AppError(
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
    'INTERNAL_ERROR',
    500,
    false  // Not operational
  );

  res.status(500).json(formatError(internalError, requestId));
}

// Usage
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) throw new NotFoundError('User', req.params.id);
  res.json({ data: user });
}));

app.use(errorHandler);
```

## Validation Errors

### Zod Validation

```typescript
import { z, ZodError } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

function validateBody<T>(schema: z.Schema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields = error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {} as Record<string, string>);
        throw new ValidationError('Invalid input data', fields);
      }
      throw error;
    }
  };
}

// Usage
app.post('/users', validateBody(createUserSchema), createUser);
```

## Database Error Handling

```typescript
import { DatabaseError, UniqueConstraintError } from 'pg';

function handleDatabaseError(error: Error): AppError {
  if (error instanceof UniqueConstraintError) {
    return new ConflictError('Resource already exists');
  }

  if (error.message.includes('foreign key')) {
    return new ValidationError('Referenced resource does not exist');
  }

  // Log unexpected database errors
  logger.error('Database error', { error: error.message });
  return new AppError('Database operation failed', 'DATABASE_ERROR', 500);
}

// Repository example
async function createUser(data: CreateUserInput): Promise<User> {
  try {
    return await db.users.create(data);
  } catch (error) {
    throw handleDatabaseError(error);
  }
}
```

## External Service Errors

```typescript
class ExternalServiceError extends AppError {
  constructor(
    service: string,
    public originalError?: Error
  ) {
    super(
      `External service ${service} failed`,
      'EXTERNAL_SERVICE_ERROR',
      503
    );
  }
}

async function callExternalAPI(url: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ExternalServiceError('API', new Error('Timeout'));
    }
    throw new ExternalServiceError('API', error);
  }
}
```

## Retry Logic

```typescript
interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  shouldRetry?: (error: Error) => boolean;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay, shouldRetry } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const canRetry = shouldRetry?.(error) ?? true;

      if (!canRetry || attempt === maxAttempts) {
        throw error;
      }

      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1),
        maxDelay
      );

      logger.warn('Retrying operation', {
        attempt,
        maxAttempts,
        delay,
        error: error.message,
      });

      await sleep(delay);
    }
  }

  throw new Error('Unreachable');
}

// Usage
const result = await withRetry(
  () => externalAPI.call(),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    shouldRetry: (error) => error instanceof ExternalServiceError,
  }
);
```

## Logging Best Practices

```typescript
// Structured logging
interface LogContext {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

const logger = {
  info: (message: string, context?: LogContext) => {
    console.log(JSON.stringify({ level: 'info', message, ...context }));
  },

  warn: (message: string, context?: LogContext) => {
    console.log(JSON.stringify({ level: 'warn', message, ...context }));
  },

  error: (message: string, context?: LogContext & { error?: string; stack?: string }) => {
    console.error(JSON.stringify({ level: 'error', message, ...context }));
  },
};

// Error logging middleware
function logErrors(error: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Request error', {
    requestId: req.headers['x-request-id'] as string,
    userId: req.user?.id,
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
  });
  next(error);
}
```

## Graceful Shutdown

```typescript
async function gracefulShutdown(signal: string) {
  logger.info('Shutdown signal received', { signal });

  // Stop accepting new requests
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connections
  await db.close();
  logger.info('Database connections closed');

  // Close other resources
  await redis.quit();
  logger.info('Redis connection closed');

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
  gracefulShutdown('unhandledRejection');
});
```

---

*Error handling patterns for robust backend services*

# TypeScript Backend Best Practices with Bun (2025 Edition)

This skill provides production-ready best practices for building TypeScript backend applications using Bun runtime. Use this guidance when implementing features, reviewing code, or making architectural decisions. **Updated November 2025** with the latest tool versions and patterns.

## Why Bun

Bun fundamentally transforms TypeScript backend development by:
- **Native TypeScript execution** - No build steps in development
- **Lightning-fast performance** - 3-4x faster than Node.js for many operations
- **Unified toolkit** - Built-in test runner, bundler, and transpiler
- **Drop-in compatibility** - Most Node.js APIs and npm packages work out of the box
- **Developer experience** - Hot reload with `--hot`, instant feedback

## Stack Overview

- **Bun 1.x** (runtime, package manager, test runner, bundler)
- **TypeScript 5.7** (strict mode)
- **Hono 4.6** (ultra-fast web framework, TypeScript-first)
- **Prisma 6.2** (type-safe ORM)
- **Biome 2.3** (formatting + linting, replaces ESLint + Prettier)
- **Zod** (runtime validation)
- **Pino** (structured logging)
- **PostgreSQL 17** (database)
- **Redis** (caching)
- **Docker** (containerization)
- **AWS ECS** (deployment)

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
│   ├── integration/           # Integration tests (API + DB)
│   └── e2e/                   # End-to-end tests
├── prisma/                    # Prisma schema & migrations
├── .github/workflows/         # CI/CD pipelines
├── Dockerfile                 # Production container
├── docker-compose.yml         # Local dev environment
├── tsconfig.json              # TypeScript config
├── biome.json                 # Biome config
├── package.json               # Bun-managed dependencies
└── bun.lockb                  # Bun lockfile
```

**Key Principles:**
- Structure by **technical capability**, not by feature
- Each layer has **single responsibility**: controllers handle HTTP, services contain business logic, repositories encapsulate DB access
- No HTTP handling in services, no business logic in controllers
- Easy to test components in isolation

## Quick Start

```bash
# Initialize project
bun init

# Install dependencies
bun add hono @hono/node-server zod @prisma/client bcrypt jsonwebtoken pino
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

**Critical settings:**
- `"strict": true` - Enable all strict checks
- `"moduleResolution": "bundler"` - Aligns with Bun's resolver
- Use `paths` for clean imports (`@core/*`, `@services/*`)
- `"types": ["bun-types"]` - Bun type definitions

## Code Quality with Biome

Biome replaces ESLint + Prettier with a single, fast tool.

**biome.json:**
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
    "formatter": { "trailingComma": "es5" },
    "lint": { "files": { "ignore": ["src/**/__generated__/*"] } }
  }
}
```

**Commands:**
```bash
bun run check        # format + lint with autofix
bun run lint         # lint only
bun run format       # format only
biome check --changed --write  # only changed files
```

## Error Handling Architecture

**Custom error classes (src/core/errors.ts):**
```typescript
export enum ErrorType {
  BAD_REQUEST = 'BadRequestError',
  UNAUTHORIZED = 'UnauthorizedError',
  FORBIDDEN = 'ForbiddenError',
  NOT_FOUND = 'NotFoundError',
  CONFLICT = 'ConflictError',
  VALIDATION = 'ValidationError',
  INTERNAL = 'InternalError',
  RATE_LIMIT = 'RateLimitError'
}

export abstract class ApiError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
  toJSON() {
    return {
      statusCode: this.statusCode,
      type: this.type,
      message: this.message,
      ...(process.env.NODE_ENV === 'development' && this.details ? { details: this.details } : {})
    };
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', details?: any) {
    super(ErrorType.BAD_REQUEST, message, 400, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', details?: any) {
    super(ErrorType.UNAUTHORIZED, message, 401, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, details?: any) {
    super(ErrorType.NOT_FOUND, `${resource} not found`, 404, details);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details?: any) {
    super(ErrorType.CONFLICT, message, 409, details);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: any) {
    super(ErrorType.VALIDATION, message, 422, details);
  }
}
```

**Global error handler (src/middleware/errorHandler.ts):**
```typescript
import type { Context } from 'hono';
import { ApiError } from '@core/errors';
import { logger } from '@core/logger';

export function errorHandler(err: Error, c: Context) {
  if (err instanceof ApiError) {
    logger.warn({ type: err.type, path: c.req.path, method: c.req.method, status: err.statusCode });
    return c.json(err.toJSON(), err.statusCode);
  }
  logger.error({ error: err.message, stack: err.stack, path: c.req.path, method: c.req.method });
  return c.json({ statusCode: 500, type: 'InternalError', message: 'Internal server error' }, 500);
}

// In app.ts
import { Hono } from 'hono';
import { errorHandler } from '@middleware/errorHandler';
export const app = new Hono();
app.onError(errorHandler);
```

## Request Validation with Zod

**Validation middleware (src/middleware/validator.ts):**
```typescript
import { z, ZodSchema } from 'zod';
import type { Context, Next } from 'hono';
import { ValidationError } from '@core/errors';

export const validate = (schema: ZodSchema) => async (c: Context, next: Next) => {
  try {
    const body = await c.req.json();
    c.set('validatedData', schema.parse(body));
    await next();
  } catch (e) {
    if (e instanceof z.ZodError) throw new ValidationError('Invalid request data', e.issues);
    throw e;
  }
};

export const validateQuery = (schema: ZodSchema) => async (c: Context, next: Next) => {
  try {
    c.set('validatedQuery', schema.parse(c.req.query()));
    await next();
  } catch (e) {
    if (e instanceof z.ZodError) throw new ValidationError('Invalid query parameters', e.issues);
    throw e;
  }
};
```

**Example schemas (src/schemas/user.schema.ts):**
```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
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

**Routes (src/routes/user.routes.ts):**
```typescript
import { Hono } from 'hono';
import * as userController from '@/controllers/user.controller';
import { validate, validateQuery } from '@middleware/validator';
import { createUserSchema, updateUserSchema, getUsersQuerySchema } from '@/schemas/user.schema';

const userRouter = new Hono();
userRouter.get('/', validateQuery(getUsersQuerySchema), userController.getUsers);
userRouter.get('/:id', userController.getUserById);
userRouter.post('/', validate(createUserSchema), userController.createUser);
userRouter.patch('/:id', validate(updateUserSchema), userController.updateUser);
userRouter.delete('/:id', userController.deleteUser);
export default userRouter;
```

## API Field Naming Convention: camelCase

**CRITICAL: Always use camelCase for JSON REST API field names.**

**Why camelCase:**
- ✅ **Native to JavaScript/JSON** - No transformation needed in frontend code
- ✅ **Industry standard** - Google, Microsoft, Facebook, AWS all use camelCase
- ✅ **TypeScript friendly** - Direct mapping to TypeScript interfaces
- ✅ **OpenAPI/Swagger convention** - Most OpenAPI examples use camelCase
- ✅ **Auto-generated clients** - API client generators expect camelCase by default

**Examples:**

```typescript
// ✅ CORRECT: camelCase
{
  "userId": "123",
  "firstName": "John",
  "lastName": "Doe",
  "emailAddress": "john@example.com",
  "createdAt": "2025-01-06T12:00:00Z",
  "isActive": true,
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-01"
}

// ❌ WRONG: snake_case (Python/Ruby convention)
{
  "user_id": "123",
  "first_name": "John",
  "last_name": "Doe",
  "email_address": "john@example.com",
  "created_at": "2025-01-06T12:00:00Z",
  "is_active": true
}

// ❌ WRONG: PascalCase (C# convention)
{
  "UserId": "123",
  "FirstName": "John",
  "LastName": "Doe",
  "EmailAddress": "john@example.com"
}

// ❌ WRONG: kebab-case (not valid in JavaScript)
{
  "user-id": "123",
  "first-name": "John",
  "last-name": "Doe"
}
```

**Consistent Application:**

1. **Request Bodies**: All fields in camelCase
   ```typescript
   POST /api/users
   {
     "email": "user@example.com",
     "firstName": "Jane",
     "lastName": "Smith",
     "dateOfBirth": "1995-05-15"
   }
   ```

2. **Response Bodies**: All fields in camelCase
   ```typescript
   GET /api/users/123
   {
     "id": "123",
     "email": "user@example.com",
     "firstName": "Jane",
     "lastName": "Smith",
     "createdAt": "2025-01-06T12:00:00Z",
     "updatedAt": "2025-01-06T12:00:00Z"
   }
   ```

3. **Query Parameters**: Use camelCase
   ```typescript
   GET /api/users?pageSize=20&sortBy=createdAt&orderBy=desc
   ```

4. **Zod Schemas**: Define fields in camelCase
   ```typescript
   export const userSchema = z.object({
     firstName: z.string(),
     lastName: z.string(),
     emailAddress: z.string().email(),
     phoneNumber: z.string().optional(),
     dateOfBirth: z.string().datetime()
   });
   ```

5. **TypeScript Interfaces**: Match API camelCase
   ```typescript
   interface User {
     id: string;
     firstName: string;
     lastName: string;
     emailAddress: string;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

**Database vs API Naming:**

While Prisma schema uses camelCase by default (matching JavaScript conventions), if you inherit a database with snake_case columns, use Prisma's `@map()` to transform:

```prisma
model User {
  id        String   @id @default(cuid())
  firstName String   @map("first_name")  // DB: first_name → API: firstName
  lastName  String   @map("last_name")   // DB: last_name → API: lastName
  createdAt DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

**Key Takeaway:** camelCase is the JavaScript/TypeScript/JSON ecosystem standard. Using it ensures seamless integration with frontend code, API tools, and the broader JavaScript ecosystem.

## Database Naming Conventions: camelCase

**CRITICAL: All database identifiers (tables, columns, indexes, constraints) use camelCase.**

**Why camelCase in Databases:**
- ✅ **Stack consistency** - TypeScript is our primary language across backend and frontend
- ✅ **Zero translation layer** - Database names map 1:1 with TypeScript types
- ✅ **Reduced complexity** - No snake_case ↔ camelCase conversion needed
- ✅ **Modern ORM compatibility** - Prisma, Drizzle, TypeORM work seamlessly with camelCase
- ✅ **Team productivity** - Full-stack TypeScript developers think in camelCase

**Yes, we know:** PostgreSQL traditionally uses `snake_case`. We're deliberately deviating because our technology stack is TypeScript-first, and the benefits of consistency across all layers outweigh adherence to legacy SQL conventions.

### Naming Rules

**1. Tables:** Use singular, camelCase
```sql
-- ✅ Good
users
orderItems
userPreferences

-- ❌ Bad
user_profiles
OrderItems
```

**2. Columns:** Use camelCase
```sql
-- ✅ Good
userId, firstName, emailAddress, createdAt, isActive

-- ❌ Bad
user_id, first_name, email_address, created_at, is_active
```

**3. Primary Keys:** `{tableName}Id`
```sql
userId    -- in users table
orderId   -- in orders table
productId -- in products table
```

**4. Foreign Keys:** Same as the referenced primary key
```sql
-- orders table references users table
userId  -- references users.userId
```

**5. Boolean Fields:** Prefix with is/has/can
```sql
isActive, isDeleted, isPublic
hasPermission, hasAccess
canEdit, canDelete
```

**6. Timestamps:** Consistent suffixes
```sql
createdAt      -- creation time
updatedAt      -- last modification
deletedAt      -- soft delete time
lastLoginAt    -- specific event times
publishedAt
verifiedAt
```

**7. Indexes:** `idx{TableName}{ColumnName}`
```sql
idxUsersEmailAddress
idxOrdersUserIdCreatedAt
idxProductsCreatedAt
```

**8. Constraints:**
```sql
-- Foreign keys: fk{TableName}{ColumnName}
fkOrdersUserId

-- Unique constraints: unq{TableName}{ColumnName}
unqUsersEmailAddress

-- Check constraints: chk{TableName}{Description}
chkUsersAgePositive
```

### PostgreSQL Schema Example

```sql
CREATE TABLE users (
  userId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emailAddress VARCHAR(255) NOT NULL,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  phoneNumber VARCHAR(20),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastLoginAt TIMESTAMP
);

CREATE INDEX idxUsersEmailAddress ON users(emailAddress);
CREATE INDEX idxUsersCreatedAt ON users(createdAt);

CREATE TABLE orders (
  orderId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL,
  totalAmount DECIMAL(10,2),
  orderStatus VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fkOrdersUserId FOREIGN KEY (userId) REFERENCES users(userId)
);

ALTER TABLE users ADD CONSTRAINT unqUsersEmailAddress UNIQUE (emailAddress);
```

### Prisma Schema Example

```prisma
model User {
  userId       String   @id @default(cuid())
  emailAddress String   @unique
  firstName    String?
  lastName     String?
  phoneNumber  String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  lastLoginAt  DateTime?

  orders       Order[]

  @@index([emailAddress])
  @@index([createdAt])
  @@map("users")
}

model Order {
  orderId      String   @id @default(cuid())
  userId       String
  totalAmount  Decimal  @db.Decimal(10, 2)
  orderStatus  String
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [userId])

  @@index([userId])
  @@index([createdAt])
  @@map("orders")
}
```

### TypeScript Types (Perfect Match)

```typescript
// Exact 1:1 mapping with database
interface User {
  userId: string;
  emailAddress: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

interface Order {
  orderId: string;
  userId: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: Date;
}
```

### MongoDB Collection Example

```javascript
// users collection
{
  userId: "550e8400-e29b-41d4-a716-446655440000",
  emailAddress: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+1234567890",
  isActive: true,
  createdAt: ISODate("2025-11-06T10:00:00Z"),
  updatedAt: ISODate("2025-11-06T10:00:00Z"),
  lastLoginAt: ISODate("2025-11-06T12:30:00Z")
}
```

### Special Cases

**Acronyms:** Keep as proper words
```typescript
userId      // not userID
apiKey      // not APIKey
htmlContent // not HTMLContent
urlPath     // not URLPath

// Exception: When acronym is the entire word
id, api     // acceptable
```

**Reserved Keywords:** Avoid them, but if unavoidable:
```sql
-- Quote in PostgreSQL if needed
CREATE TABLE orders (
  "order" UUID,
  "group" VARCHAR(50)
);

-- Better: Use more descriptive names
orderType, orderGroup
```

**JSONB Columns:** Column and content both use camelCase
```sql
CREATE TABLE users (
  userId UUID PRIMARY KEY,
  metadata JSONB  -- column name: camelCase
);

-- JSONB content also camelCase
{
  "preferredLanguage": "en",
  "notificationSettings": {
    "emailEnabled": true,
    "pushEnabled": false
  }
}
```

### Migration from snake_case

If migrating from snake_case databases, use Prisma's `@map()`:

```prisma
model User {
  userId    String @id @map("user_id")       // DB: user_id → App: userId
  firstName String @map("first_name")        // DB: first_name → App: firstName
  createdAt DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

Eventually migrate the actual database columns to camelCase and remove `@map()`.

### Benefits of This Approach

**Single Convention Everywhere:**
```typescript
// Database column
userId

// Prisma model
userId

// TypeScript type
userId

// API response
userId

// Frontend state
userId

// No translation needed anywhere ✓
```

**Eliminates Entire Class of Bugs:**
- No mapping errors between layers
- No "which convention am I using now?" confusion
- Autocomplete works perfectly everywhere
- Type safety maintained end-to-end

**Key Takeaway:** While this deviates from traditional PostgreSQL conventions, it's optimal for TypeScript-first full-stack development. Consistency and productivity gains far outweigh adherence to legacy SQL naming conventions.

## Database with Prisma

**Prisma client setup (src/database/client.ts):**
```typescript
import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
process.on('beforeExit', async () => prisma.$disconnect());
```

**Repository pattern (src/database/repositories/user.repository.ts):**
```typescript
import { prisma } from '@/database/client';
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
    skip?: number; take?: number;
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

**Service layer (src/services/user.service.ts):**
```typescript
import { userRepository } from '@/database/repositories/user.repository';
import { NotFoundError, ConflictError } from '@core/errors';
import type { CreateUserDto, GetUsersQuery } from '@/schemas/user.schema';
import bcrypt from 'bcrypt';

export const createUser = async (data: CreateUserDto) => {
  if (await userRepository.exists(data.email)) throw new ConflictError('Email already exists');
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await userRepository.create({ ...data, password: hashedPassword });
  const { password, ...withoutPassword } = user;
  return withoutPassword;
};

export const getUserById = async (id: string) => {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError('User');
  const { password, ...withoutPassword } = user;
  return withoutPassword;
};

export const getUsers = async (query: GetUsersQuery) => {
  const { page, limit, sortBy, order, role } = query;
  const { users, total } = await userRepository.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where: role ? { role } : undefined,
    orderBy: sortBy ? { [sortBy]: order } : { createdAt: order }
  });
  return {
    data: users.map(({ password, ...u }) => u),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};
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

## Authentication & Security

**JWT Authentication (src/services/auth.service.ts):**
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userRepository } from '@/database/repositories/user.repository';
import { prisma } from '@/database/client';
import { UnauthorizedError } from '@core/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

interface TokenPayload { userId: string; email: string; role: string; }

export const generateAccessToken = (p: TokenPayload) =>
  jwt.sign(p, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });

export const generateRefreshToken = (p: TokenPayload) =>
  jwt.sign(p, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

export const verifyToken = (t: string) => jwt.verify(t, JWT_SECRET) as TokenPayload;

export const login = async (email: string, password: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new UnauthorizedError('Invalid credentials');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new UnauthorizedError('Invalid credentials');
  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await prisma.session.create({
    data: { userId: user.id, token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  });
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  };
};
```

**Auth middleware (src/middleware/auth.ts):**
```typescript
import type { Context, Next } from 'hono';
import { verifyToken } from '@/services/auth.service';
import { UnauthorizedError, ForbiddenError } from '@core/errors';

export const authenticate = async (c: Context, next: Next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('Missing or invalid token');
  try { c.set('user', verifyToken(header.slice(7))); await next(); }
  catch { throw new UnauthorizedError('Invalid or expired token'); }
};

export const authorize = (...roles: string[]) => async (c: Context, next: Next) => {
  const user = c.get('user') as { role: string } | undefined;
  if (!user) throw new UnauthorizedError('Authentication required');
  if (!roles.includes(user.role)) throw new ForbiddenError('Insufficient permissions');
  await next();
};
```

**Security headers (src/middleware/security.ts):**
```typescript
import type { Context, Next } from 'hono';

export const securityHeaders = async (c: Context, next: Next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
};
```

**CORS (in app.ts):**
```typescript
import { cors } from 'hono/cors';
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://yourapp.com'],
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 86400
}));
```

## Structured Logging with Pino

**Logger setup (src/core/logger.ts):**
```typescript
import pino from 'pino';
const isDev = process.env.NODE_ENV === 'development';
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' }
  } : undefined,
  base: undefined,
  formatters: { level: (label) => ({ level: label }) }
});
```

**Request logging (src/middleware/requestLogger.ts):**
```typescript
import type { Context, Next } from 'hono';
import { logger } from '@core/logger';

export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const reqId = crypto.randomUUID();
  c.set('requestId', reqId);
  logger.info({ type: 'request', reqId, method: c.req.method, path: c.req.path, query: c.req.query() });
  await next();
  logger.info({ type: 'response', reqId, status: c.res.status, duration: `${Date.now() - start}ms` });
};
```

## Testing with Bun

Bun includes a fast, built-in test runner with Jest-like APIs.

**Unit test example:**
```typescript
// tests/unit/services/user.service.test.ts
import { describe, it, expect } from 'bun:test';
import { createUser } from '@/services/user.service';

describe('UserService', () => {
  it('creates a user and strips password', async () => {
    const user = await createUser({ email: 'a@b.com', password: 'Abcdef1!', name: 'A', role: 'user' });
    expect(user).toHaveProperty('email', 'a@b.com');
    expect(user).not.toHaveProperty('password');
  });
});
```

**Integration test example:**
```typescript
// tests/integration/api/user.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { app } from '@/app';
import { prisma } from '@/database/client';

describe('User API', () => {
  beforeAll(async () => { await prisma.$connect(); await prisma.user.deleteMany(); });
  afterAll(async () => { await prisma.user.deleteMany(); await prisma.$disconnect(); });

  it('POST /api/users creates a user', async () => {
    const res = await app.request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com', password: 'Abcdef1!', name: 'New User' })
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.email).toBe('new@example.com');
  });
});
```

**Commands:**
```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test --coverage   # With coverage
```

## Performance: Caching with Redis

**Cache utilities (src/utils/cache.ts):**
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function cacheGet<T>(key: string): Promise<T | null> {
  const v = await redis.get(key);
  return v ? JSON.parse(v) : null;
}

export async function cacheSet(key: string, value: any, ttlSeconds: number) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit) return hit;
  const val = await fn();
  await cacheSet(key, val, ttl);
  return val;
}
```

**Usage:**
```typescript
export const getUserProfile = (userId: string) =>
  cached(`userProfile:${userId}`, 300, async () => {
    const u = await userRepository.findById(userId);
    if (!u) throw new NotFoundError('User');
    const { password, ...profile } = u;
    return profile;
  });
```

## Docker & Production

**Production Dockerfile (multi-stage):**
```dockerfile
# Stage 1: Base
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Stage 2: Deps
FROM base AS deps
COPY package.json bun.lockb ./
COPY prisma ./prisma/
RUN bun install --frozen-lockfile --production

# Stage 3: Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate

# Stage 4: Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 bungroup && adduser -D -u 1001 -G bungroup bunuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY package.json bun.lockb ./
USER bunuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
CMD ["bun", "src/server.ts"]
```

**Server with graceful shutdown (src/server.ts):**
```typescript
import { serve } from '@hono/node-server';
import { app } from './app';
import { prisma } from '@/database/client';
import { logger } from '@core/logger';

const PORT = Number(process.env.PORT) || 3000;
const server = serve({ fetch: app.fetch, port: PORT });
logger.info(`🚀 Server running on port ${PORT}`);

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down...`);
  try { await prisma.$disconnect(); } catch {}
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

## Production Readiness Checklist

### Security
- ✅ No secrets in code (use AWS Secrets Manager/SSM)
- ✅ Password hashing with bcrypt
- ✅ JWT with reasonable expiries (15m access, 7d refresh)
- ✅ CORS restricted to known origins
- ✅ Rate limiting enabled
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Least-privilege DB user

### Performance
- ✅ DB indexes on frequently queried fields
- ✅ Query optimization (select only needed fields)
- ✅ Redis caching for expensive operations
- ✅ Compression enabled (gzip/brotli)
- ✅ Connection pooling configured

### Reliability
- ✅ Health checks (`/health` endpoint)
- ✅ Graceful shutdown handling
- ✅ Structured logging (Pino)
- ✅ Monitoring & alerts (CloudWatch)
- ✅ Database backups & DR plan

### Quality
- ✅ Tests passing with good coverage
- ✅ Biome checks passing (format + lint)
- ✅ TypeScript strict mode enabled
- ✅ No console.log in production code
- ✅ Error handling comprehensive

### Deployment
- ✅ CI/CD pipeline working
- ✅ Migrations tested and reversible
- ✅ Rollback strategy defined
- ✅ Zero-downtime deployments
- ✅ Staging environment with prod parity

## Environment Variables

**.env files:**
```bash
# Development
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-secret"
NODE_ENV="development"
LOG_LEVEL="debug"

# Test
DATABASE_URL="postgresql://user:password@localhost:5432/mydb_test?schema=public"
NODE_ENV="test"

# Production (use Secrets Manager)
DATABASE_URL="postgresql://user:password@prod-host:5432/mydb_prod?schema=public&connection_limit=10&pool_timeout=60"
REDIS_URL="redis://prod-elasticache:6379"
JWT_SECRET="<strong-random-secret>"
NODE_ENV="production"
LOG_LEVEL="info"
```

## CI/CD with GitHub Actions

**Key principles:**
- Run on every push and PR
- Test with real services (PostgreSQL, Redis)
- Cache dependencies for speed
- Fail fast on errors

**.github/workflows/ci.yml** should include:
- Bun setup
- Biome check
- TypeScript type check
- Prisma generate + migrate
- Run tests with coverage
- Build Docker image (on main)

## AWS ECS Deployment

**Best practices:**
- Run behind Application Load Balancer
- Use health checks on `/health` endpoint
- Store secrets in AWS Secrets Manager
- Use private subnets + security groups
- Enable CloudWatch logs & Container Insights
- Configure Auto Scaling (CPU/Memory/Requests)
- Use Fargate for serverless containers

## Bun-Specific Tips

- Use `bun --hot` for dev (preserves state)
- `bun build` for production bundles (optional)
- Run `.ts` files directly (no build step needed)
- Check compatibility tracker for new packages
- Leverage Workers for CPU-heavy tasks
- WebSockets supported natively

## Key Takeaways

1. **Architecture**: Clean separation of concerns (routes → controllers → services → repositories)
2. **Type Safety**: TypeScript strict + Zod + Prisma = end-to-end type safety
3. **Error Handling**: Custom error classes + global error handler + structured logging
4. **Validation**: Zod schemas for all inputs (body, query, params)
5. **Security**: Auth middleware, CORS, rate limiting, security headers, password hashing
6. **Testing**: Bun's native test runner for unit + integration tests
7. **Performance**: Redis caching, DB indexes, query optimization
8. **Production**: Docker multi-stage builds, health checks, graceful shutdown, secrets management
9. **Developer Experience**: Bun's speed + hot reload + unified tooling = fast iteration

---

**Last Updated:** November 2025
**Tool Versions:** Bun 1.x, TypeScript 5.7, Prisma 6.2, Hono 4.6, Biome 2.3, PostgreSQL 17
**Target Environment:** AWS ECS Fargate, GitHub Actions CI, Docker, Redis (ElastiCache), RDS PostgreSQL

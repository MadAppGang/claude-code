---
name: bunjs-architecture
version: 1.0.0
description: Use when implementing clean architecture (routes/controllers/services/repositories), establishing camelCase conventions, designing Prisma schemas, or planning structured workflows for Bun.js applications. See bunjs for basics, bunjs-production for deployment.
keywords:
  - clean architecture
  - layered architecture
  - camelCase
  - naming conventions
  - Prisma schema
  - repository pattern
  - separation of concerns
  - code organization
plugin: dev
updated: 2026-01-20
---

# Bun.js Clean Architecture Patterns

## Overview

This skill covers layered architecture, clean code patterns, camelCase naming conventions, and structured implementation workflows for Bun.js TypeScript backend applications. Use this skill when building complex, maintainable applications that require strict separation of concerns.

**When to use this skill:**
- Implementing layered architecture (routes → controllers → services → repositories)
- Establishing coding conventions and naming standards
- Designing database schemas with Prisma
- Creating API endpoint specifications
- Planning implementation workflows

**See also:**
- **dev:bunjs** - Core Bun patterns, HTTP servers, basic database access
- **dev:bunjs-production** - Production deployment, Docker, AWS, Redis
- **dev:bunjs-apidog** - OpenAPI specifications and Apidog integration

## Clean Architecture Principles

### 1. Layered Architecture

**ALWAYS** separate concerns into distinct layers with single responsibilities:

```
┌─────────────────────────────────────┐
│         Routes Layer                │  ← Define API routes, attach middleware
│    (src/routes/)                    │     Map to controllers
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Controllers Layer             │  ← Handle HTTP requests/responses
│    (src/controllers/)               │     Call services, no business logic
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Services Layer               │  ← Implement business logic
│    (src/services/)                  │     Orchestrate repositories
└──────────────┬──────────────────────┘     No HTTP concerns
               │
┌──────────────▼──────────────────────┐
│      Repositories Layer             │  ← Encapsulate database access
│  (src/database/repositories/)       │     Use Prisma, type-safe queries
└─────────────────────────────────────┘     No business logic
```

**Critical Rules:**
- Controllers NEVER contain business logic (only HTTP handling)
- Services NEVER access HTTP context (no `req`, `res`, `Context`)
- Repositories are the ONLY layer that touches Prisma/database
- Each layer depends only on layers below it

### 2. Dependency Flow

```typescript
// ✅ CORRECT: Downward dependency flow
Routes → Controllers → Services → Repositories → Database

// ❌ WRONG: Upward dependency (service accessing controller)
Service imports from Controller  // NEVER DO THIS

// ❌ WRONG: Skip layers (controller accessing repository directly)
Controller → Repository  // Should go through Service
```

### 3. Separation of Concerns

| Layer | Responsibilities | Forbidden |
|-------|------------------|-----------|
| **Routes** | Define endpoints, attach middleware, map to controllers | Business logic, DB access |
| **Controllers** | Extract data from HTTP, call services, format responses | Business logic, DB access, validation logic |
| **Services** | Business logic, orchestrate operations, manage transactions | HTTP handling, direct DB access |
| **Repositories** | Database queries, type-safe Prisma operations | Business logic, HTTP handling |

## camelCase Conventions (CRITICAL)

### Why camelCase Everywhere?

**TypeScript-first full-stack development requires ONE naming convention across all layers:**
- ✅ Database → Prisma → TypeScript → API → Frontend (1:1 mapping)
- ✅ Zero translation layer = zero mapping bugs
- ✅ Autocomplete works perfectly everywhere
- ✅ Type safety maintained end-to-end

**This is non-negotiable for our stack.**

### API Field Naming: camelCase

**CRITICAL: All JSON REST API field names MUST use camelCase.**

**Why:**
- ✅ Native to JavaScript/JSON - No transformation needed
- ✅ Industry standard - Google, Microsoft, Facebook, AWS use camelCase
- ✅ TypeScript friendly - Direct mapping to interfaces
- ✅ OpenAPI/Swagger convention - Standard for API specs
- ✅ Auto-generated clients - Expected by code generation tools

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
  "phoneNumber": "+1234567890"
}

// ❌ WRONG: snake_case
{
  "user_id": "123",
  "first_name": "John",
  "created_at": "2025-01-06T12:00:00Z"
}

// ❌ WRONG: PascalCase
{
  "UserId": "123",
  "FirstName": "John"
}
```

**Consistent Application:**

1. **Request Bodies**: All fields in camelCase
2. **Response Bodies**: All fields in camelCase
3. **Query Parameters**: Use camelCase (`pageSize`, `sortBy`, `orderBy`)
4. **Zod Schemas**: Define fields in camelCase
5. **TypeScript Interfaces**: Match API camelCase

### Database Naming: camelCase

**CRITICAL: All database identifiers (tables, columns, indexes, constraints) use camelCase.**

**Why:**
- ✅ Stack consistency - TypeScript is our primary language
- ✅ Zero translation layer - Database names map 1:1 with TypeScript types
- ✅ Reduced complexity - No snake_case ↔ camelCase conversion
- ✅ Modern ORM compatibility - Prisma, Drizzle, TypeORM work seamlessly
- ✅ Team productivity - Full-stack TypeScript developers think in camelCase

**Naming Rules:**

**1. Tables:** Singular, camelCase with `@@map()` to plural
```prisma
model User {
  userId String @id
  // ...
  @@map("users")  // Table name: users
}
```

**2. Columns:** camelCase
```prisma
userId, firstName, emailAddress, createdAt, isActive
```

**3. Primary Keys:** `{tableName}Id`
```prisma
userId    // in users table
orderId   // in orders table
productId // in products table
```

**4. Foreign Keys:** Same as referenced primary key
```prisma
model Order {
  orderId String @id
  userId  String  // references users.userId
  user    User    @relation(fields: [userId], references: [userId])
}
```

**5. Boolean Fields:** Prefix with is/has/can
```prisma
isActive, isDeleted, isPublic
hasPermission, hasAccess
canEdit, canDelete
```

**6. Timestamps:** Consistent suffixes
```prisma
createdAt      // creation time
updatedAt      // last modification
deletedAt      // soft delete time
lastLoginAt    // specific event times
publishedAt
verifiedAt
```

**7. Indexes:** `idx{TableName}{ColumnName}`
```prisma
@@index([emailAddress], name: "idxUsersEmailAddress")
@@index([userId, createdAt], name: "idxOrdersUserIdCreatedAt")
```

**8. Constraints:**
```prisma
// Foreign keys (Prisma auto-generates, but can specify)
@@index([userId], map: "fkOrdersUserId")

// Unique constraints
@@unique([emailAddress], name: "unqUsersEmailAddress")
```

### Prisma Schema Example (Perfect Mapping)

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
  sessions     Session[]

  @@index([emailAddress], name: "idxUsersEmailAddress")
  @@index([createdAt], name: "idxUsersCreatedAt")
  @@map("users")
}

model Order {
  orderId      String   @id @default(cuid())
  userId       String
  totalAmount  Decimal  @db.Decimal(10, 2)
  orderStatus  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [userId])
  orderItems   OrderItem[]

  @@index([userId], name: "idxOrdersUserId")
  @@index([createdAt], name: "idxOrdersCreatedAt")
  @@map("orders")
}

model OrderItem {
  orderItemId String   @id @default(cuid())
  orderId     String
  productId   String
  quantity    Int
  unitPrice   Decimal  @db.Decimal(10, 2)

  order       Order    @relation(fields: [orderId], references: [orderId])

  @@index([orderId], name: "idxOrderItemsOrderId")
  @@map("orderItems")
}
```

### TypeScript Types (Perfect Match)

```typescript
// Exact 1:1 mapping with database and API
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
  updatedAt: Date;
}
```

### Benefits of Single Convention

**No Translation Needed:**
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

// All identical → zero translation → zero bugs ✓
```

## Layer Templates

### Route Template

```typescript
// src/routes/user.routes.ts
import { Hono } from 'hono';
import * as userController from '@/controllers/user.controller';
import { validate, validateQuery } from '@middleware/validator';
import { authenticate, authorize } from '@middleware/auth';
import { createUserSchema, updateUserSchema, getUsersQuerySchema } from '@/schemas/user.schema';

const userRouter = new Hono();

// Public routes
userRouter.get('/', validateQuery(getUsersQuerySchema), userController.getUsers);
userRouter.get('/:id', userController.getUserById);
userRouter.post('/', validate(createUserSchema), userController.createUser);

// Protected routes
userRouter.patch('/:id', authenticate, validate(updateUserSchema), userController.updateUser);
userRouter.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

export default userRouter;
```

### Controller Template

```typescript
// src/controllers/user.controller.ts
import type { Context } from 'hono';
import * as userService from '@/services/user.service';
import type { CreateUserDto, UpdateUserDto, GetUsersQuery } from '@/schemas/user.schema';

export const createUser = async (c: Context) => {
  const data = c.get('validatedData') as CreateUserDto;
  const user = await userService.createUser(data);
  return c.json(user, 201);
};

export const getUserById = async (c: Context) => {
  const id = c.req.param('id');
  const user = await userService.getUserById(id);
  return c.json(user);
};

export const getUsers = async (c: Context) => {
  const query = c.get('validatedQuery') as GetUsersQuery;
  const result = await userService.getUsers(query);
  return c.json(result);
};

export const updateUser = async (c: Context) => {
  const id = c.req.param('id');
  const data = c.get('validatedData') as UpdateUserDto;
  const user = await userService.updateUser(id, data);
  return c.json(user);
};

export const deleteUser = async (c: Context) => {
  const id = c.req.param('id');
  await userService.deleteUser(id);
  return c.json({ message: 'User deleted successfully' });
};
```

**Controller Rules:**
- ✅ Extract validated data from context
- ✅ Call service layer functions
- ✅ Format HTTP responses
- ❌ NO business logic
- ❌ NO database access
- ❌ NO validation logic (use middleware)

### Service Template

```typescript
// src/services/user.service.ts
import { userRepository } from '@/database/repositories/user.repository';
import { NotFoundError, ConflictError } from '@core/errors';
import type { CreateUserDto, UpdateUserDto, GetUsersQuery } from '@/schemas/user.schema';
import bcrypt from 'bcrypt';

export const createUser = async (data: CreateUserDto) => {
  // Check for conflicts
  if (await userRepository.exists(data.emailAddress)) {
    throw new ConflictError('Email already exists');
  }

  // Hash password (business logic)
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user via repository
  const user = await userRepository.create({
    ...data,
    password: hashedPassword
  });

  // Strip sensitive data before returning
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
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const updateUser = async (id: string, data: UpdateUserDto) => {
  const existing = await userRepository.findById(id);
  if (!existing) throw new NotFoundError('User');

  // Hash password if provided
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const user = await userRepository.update(id, data);
  const { password, ...withoutPassword } = user;
  return withoutPassword;
};

export const deleteUser = async (id: string) => {
  const existing = await userRepository.findById(id);
  if (!existing) throw new NotFoundError('User');

  await userRepository.delete(id);
};
```

**Service Rules:**
- ✅ Implement business logic
- ✅ Orchestrate multiple repository calls
- ✅ Handle transactions
- ✅ Throw custom errors
- ❌ NO HTTP handling (no Context, Request, Response)
- ❌ NO direct Prisma calls (use repositories)

### Repository Template

```typescript
// src/database/repositories/user.repository.ts
import { prisma } from '@/database/client';
import type { Prisma, User } from '@prisma/client';

export class UserRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { userId: id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { emailAddress: email } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { userId: id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { userId: id } });
  }

  async exists(email: string): Promise<boolean> {
    return (await prisma.user.count({ where: { emailAddress: email } })) > 0;
  }

  async findMany(options: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<{ users: User[]; total: number }> {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany(options),
      prisma.user.count({ where: options.where })
    ]);
    return { users, total };
  }
}

export const userRepository = new UserRepository();
```

**Repository Rules:**
- ✅ Encapsulate ALL database access
- ✅ Use Prisma's type-safe API
- ✅ Handle transactions when needed
- ✅ Return Prisma types
- ❌ NO business logic
- ❌ NO HTTP handling

### Schema Template (Zod)

```typescript
// src/schemas/user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  emailAddress: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  phoneNumber: z.string().optional(),
  role: z.enum(['user', 'admin', 'moderator']).default('user')
});

export const updateUserSchema = createUserSchema.partial();

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'firstName', 'emailAddress']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  role: z.enum(['user', 'admin', 'moderator']).optional()
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
```

**Schema Rules:**
- ✅ Use camelCase for all field names
- ✅ Export TypeScript types via `z.infer`
- ✅ Provide clear error messages
- ✅ Use `.partial()` for update schemas
- ✅ Use `.default()` for query parameters

## Implementation Workflow

When implementing a new feature, follow this 9-phase workflow:

### Phase 1: Analysis & Planning
1. Read existing codebase to understand patterns
2. Identify required layers (routes, controllers, services, repositories)
3. Check for existing utilities/middleware to reuse
4. Plan database schema changes (if needed)

### Phase 2: Database Schema (if needed)
1. Design Prisma schema with camelCase conventions
2. Define models, relations, indexes
3. Create migration: `bunx prisma migrate dev --name <name>`
4. Generate Prisma client: `bunx prisma generate`

### Phase 3: Validation Layer
1. Define Zod schemas in `src/schemas/` with camelCase fields
2. Export TypeScript types from schemas
3. Ensure all request data is validated (body, query, params)

### Phase 4: Repository Layer (if needed)
1. Create/update repository class in `src/database/repositories/`
2. Implement methods (findById, create, update, delete, findMany)
3. Use Prisma types (`Prisma.UserCreateInput`, etc.)
4. Handle transactions where needed

### Phase 5: Business Logic Layer
1. Implement service functions in `src/services/`
2. Use repositories for data access
3. Implement business rules and orchestration
4. Handle errors with custom error classes
5. NEVER access HTTP context in services

### Phase 6: HTTP Layer
1. Create controller functions in `src/controllers/`
2. Extract validated data from context
3. Call service functions
4. Format responses (success/error)
5. NEVER implement business logic in controllers

### Phase 7: Routing Layer
1. Define routes in `src/routes/`
2. Attach middleware (validation, auth, etc.)
3. Map routes to controller functions
4. Group related routes in route files

### Phase 8: Testing
1. Write unit tests for services (`tests/unit/services/`)
2. Write integration tests for API endpoints (`tests/integration/api/`)
3. Test error cases and edge cases
4. Use Bun's test runner: `bun test`

### Phase 9: Quality Assurance
1. Run formatter: `bun run format`
2. Run linter: `bun run lint`
3. Run type checker: `bun run typecheck`
4. Run tests: `bun test`
5. Review code for security issues
6. Check logging is appropriate (no sensitive data)

## Database Schema Design Best Practices

### 1. Primary Keys

```prisma
// ✅ CORRECT: Use cuid() for user-facing IDs
model User {
  userId String @id @default(cuid())
}

// ✅ CORRECT: Use uuid() for internal IDs
model Order {
  orderId String @id @default(uuid())
}

// ❌ WRONG: Auto-incrementing integers expose system info
model User {
  userId Int @id @default(autoincrement())
}
```

### 2. Timestamps

```prisma
// ✅ CORRECT: Always include created and updated timestamps
model User {
  userId    String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ✅ CORRECT: Add specific event timestamps when needed
model User {
  lastLoginAt   DateTime?
  verifiedAt    DateTime?
  deletedAt     DateTime?  // For soft deletes
}
```

### 3. Relations

```prisma
// ✅ CORRECT: Bidirectional relations
model User {
  userId String  @id @default(cuid())
  orders Order[]
}

model Order {
  orderId String @id @default(cuid())
  userId  String
  user    User   @relation(fields: [userId], references: [userId])
}

// ✅ CORRECT: Many-to-many with explicit join table
model Post {
  postId String     @id @default(cuid())
  tags   PostTag[]
}

model Tag {
  tagId String    @id @default(cuid())
  posts PostTag[]
}

model PostTag {
  postId String
  tagId  String
  post   Post   @relation(fields: [postId], references: [postId])
  tag    Tag    @relation(fields: [tagId], references: [tagId])

  @@id([postId, tagId])
}
```

### 4. Indexes

```prisma
// ✅ CORRECT: Index frequently queried fields
model User {
  emailAddress String @unique
  firstName    String
  createdAt    DateTime @default(now())

  @@index([emailAddress])        // For lookups
  @@index([createdAt])           // For sorting
  @@index([firstName, lastName]) // Compound index for searches
}
```

### 5. Enums

```prisma
// ✅ CORRECT: Use enums for constrained values
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

model User {
  role UserRole @default(USER)
}

// ❌ WRONG: Using strings without constraints
model User {
  role String  // Can be anything, no validation
}
```

## API Endpoint Design Patterns

### 1. RESTful Resource Naming

```
✅ CORRECT:
GET    /api/users           → List users
POST   /api/users           → Create user
GET    /api/users/:id       → Get user
PATCH  /api/users/:id       → Update user (partial)
PUT    /api/users/:id       → Replace user (full)
DELETE /api/users/:id       → Delete user

GET    /api/users/:id/orders       → User's orders (nested resource)
POST   /api/users/:id/orders       → Create order for user

❌ WRONG:
GET /api/getUsers
POST /api/createUser
GET /api/user/:id  (singular)
```

### 2. Query Parameters (camelCase)

```typescript
// ✅ CORRECT
GET /api/users?pageSize=20&sortBy=createdAt&orderBy=desc&isActive=true

// Query schema
const getUsersQuerySchema = z.object({
  pageSize: z.coerce.number().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'firstName', 'emailAddress']).optional(),
  orderBy: z.enum(['asc', 'desc']).default('desc'),
  isActive: z.coerce.boolean().optional()
});
```

### 3. Response Formats

```typescript
// ✅ CORRECT: List response with pagination
{
  "data": [
    { "userId": "123", "firstName": "John", "emailAddress": "john@example.com" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}

// ✅ CORRECT: Single resource response
{
  "data": {
    "userId": "123",
    "firstName": "John",
    "emailAddress": "john@example.com",
    "createdAt": "2025-01-06T12:00:00Z"
  }
}

// ✅ CORRECT: Error response
{
  "statusCode": 422,
  "type": "ValidationError",
  "message": "Invalid request data",
  "details": [
    { "field": "emailAddress", "message": "Invalid email format" }
  ]
}
```

## Consistency Checklist

Before implementing any feature, ensure consistency with the existing codebase:

- [ ] Reviewed existing route patterns
- [ ] Checked naming conventions (all camelCase)
- [ ] Verified error handling approach
- [ ] Confirmed middleware usage patterns
- [ ] Validated layering approach (routes → controllers → services → repositories)
- [ ] Checked for reusable utilities
- [ ] Confirmed validation patterns (Zod schemas)
- [ ] Verified test structure

**NEVER introduce new patterns without explicit approval.**

---

*Clean architecture patterns for Bun.js TypeScript backend. For core patterns, see dev:bunjs. For production deployment, see dev:bunjs-production.*

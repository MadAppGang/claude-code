# Universal Development Patterns

**Skill**: universal-patterns
**Plugin**: dev
**Version**: 1.0.0

## Overview

Language-agnostic development patterns and best practices applicable across all technology stacks.

## Architecture Patterns

### Layered Architecture

```
┌─────────────────────────────┐
│     Presentation Layer      │  UI, API handlers, CLI
├─────────────────────────────┤
│     Application Layer       │  Use cases, services
├─────────────────────────────┤
│       Domain Layer          │  Business logic, entities
├─────────────────────────────┤
│    Infrastructure Layer     │  DB, cache, external APIs
└─────────────────────────────┘
```

**When to Use**: Most applications benefit from clear separation of concerns.

### Clean Architecture

```
         ┌─────────────────┐
         │   Frameworks    │  (outermost)
         │   & Drivers     │
     ┌───┴─────────────────┴───┐
     │    Interface Adapters    │
     │   (Controllers, Gateways)│
 ┌───┴─────────────────────────┴───┐
 │        Application Business      │
 │           Rules (Use Cases)      │
 ┌─────────────────────────────────┐
 │    Enterprise Business Rules     │  (innermost)
 │         (Entities)               │
 └─────────────────────────────────┘
```

**Dependency Rule**: Dependencies point inward. Inner layers don't know about outer layers.

### Component-Based Architecture (Frontend)

```
src/
├── components/
│   ├── common/         # Shared UI components
│   ├── layout/         # Layout components
│   └── features/       # Feature-specific components
├── hooks/              # Custom hooks
├── stores/             # State management
├── services/           # API services
└── utils/              # Utilities
```

## Code Organization Principles

### Single Responsibility

Each module/function should do ONE thing well.

```
// BAD: Multiple responsibilities
function processUser(user) {
  validateUser(user);
  saveToDatabase(user);
  sendEmail(user);
  logAnalytics(user);
}

// GOOD: Single responsibility
function validateUser(user) { /* validation only */ }
function saveUser(user) { /* persistence only */ }
function notifyUser(user) { /* notification only */ }
```

### Dependency Injection

Inject dependencies rather than creating them internally.

```
// BAD: Hard dependency
class UserService {
  constructor() {
    this.db = new Database(); // Hard-coded
  }
}

// GOOD: Injected dependency
class UserService {
  constructor(db) {
    this.db = db; // Injected
  }
}
```

### Interface Segregation

Prefer many specific interfaces over one general interface.

```
// BAD: Fat interface
interface Worker {
  work();
  eat();
  sleep();
}

// GOOD: Segregated interfaces
interface Workable { work(); }
interface Eatable { eat(); }
interface Sleepable { sleep(); }
```

## Error Handling Patterns

### Fail Fast

Validate inputs early and fail immediately on invalid data.

```
function processOrder(order) {
  // Validate early
  if (!order) throw new Error('Order required');
  if (!order.items?.length) throw new Error('Order must have items');
  if (!order.customerId) throw new Error('Customer ID required');

  // Process only after validation passes
  return executeOrder(order);
}
```

### Error Boundaries

Contain errors at appropriate boundaries.

```
// API boundary - catch and format errors
async function apiHandler(req, res) {
  try {
    const result = await processRequest(req);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}
```

### Result Types (Where Supported)

Use Result/Either types instead of exceptions for expected failures.

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function parseConfig(input: string): Result<Config, ParseError> {
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (e) {
    return { ok: false, error: new ParseError(e.message) };
  }
}
```

## Data Flow Patterns

### Unidirectional Data Flow

Data flows in one direction through the application.

```
Action → Dispatcher → Store → View → Action
```

### Event-Driven Architecture

Decouple components through events.

```
// Publisher
eventBus.emit('user.created', { userId: '123' });

// Subscriber
eventBus.on('user.created', async (event) => {
  await sendWelcomeEmail(event.userId);
});
```

### Command Query Separation (CQS)

Separate commands (mutations) from queries (reads).

```
// Query - returns data, no side effects
function getUser(id) { return db.users.find(id); }

// Command - mutates data, returns void/status
function updateUser(id, data) { db.users.update(id, data); }
```

## Naming Conventions

### Functions

| Type | Convention | Examples |
|------|------------|----------|
| Actions | verb + noun | `createUser`, `deleteOrder`, `validateInput` |
| Queries | get/find/is/has + noun | `getUser`, `findOrders`, `isValid`, `hasPermission` |
| Handlers | handle + event | `handleClick`, `handleSubmit`, `handleError` |
| Callbacks | on + event | `onSuccess`, `onError`, `onChange` |

### Variables

| Type | Convention | Examples |
|------|------------|----------|
| Booleans | is/has/can/should | `isActive`, `hasAccess`, `canEdit`, `shouldRefresh` |
| Collections | plural | `users`, `orders`, `items` |
| Counts | count/num/total | `userCount`, `numItems`, `totalPrice` |

### Files

| Type | Convention | Examples |
|------|------------|----------|
| Components | PascalCase | `UserProfile.tsx`, `OrderList.vue` |
| Utilities | camelCase/kebab | `formatDate.ts`, `string-utils.ts` |
| Constants | SCREAMING_SNAKE | `API_ENDPOINTS.ts`, `ERROR_CODES.ts` |
| Tests | name.test/spec | `user.test.ts`, `order.spec.ts` |

## Code Quality Checklist

Before committing code, verify:

- [ ] Single responsibility - each function does one thing
- [ ] Clear naming - intent is obvious from names
- [ ] Error handling - failures are handled gracefully
- [ ] No magic numbers - constants are named and documented
- [ ] DRY - no unnecessary duplication (but don't over-abstract)
- [ ] Tests - critical paths are tested
- [ ] Documentation - complex logic is explained

## Anti-Patterns to Avoid

### God Objects
Objects that know too much or do too much. Split into focused components.

### Premature Optimization
Don't optimize before measuring. Write clear code first, optimize proven bottlenecks.

### Stringly Typed
Using strings where enums/types would be safer. Use type systems.

### Copy-Paste Programming
Duplicating code instead of abstracting. But: prefer duplication over wrong abstraction.

### Boolean Parameters
Functions with boolean flags that change behavior. Split into explicit functions.

```
// BAD
function process(data, isAdmin) { /* behaves differently based on flag */ }

// GOOD
function processUserData(data) { /* user logic */ }
function processAdminData(data) { /* admin logic */ }
```

## Performance Principles

1. **Measure First**: Profile before optimizing
2. **Lazy Loading**: Load resources only when needed
3. **Caching**: Cache expensive computations and API calls
4. **Pagination**: Don't load everything at once
5. **Batch Operations**: Combine multiple operations when possible
6. **Async/Parallel**: Use concurrency for independent operations

## Security Principles

1. **Input Validation**: Never trust user input
2. **Output Encoding**: Encode data for its context (HTML, SQL, etc.)
3. **Least Privilege**: Request minimum permissions needed
4. **Defense in Depth**: Multiple layers of security
5. **Fail Secure**: Default to denying access on errors
6. **Secrets Management**: Never hardcode secrets, use environment variables

---

*Universal patterns applicable to all technology stacks*

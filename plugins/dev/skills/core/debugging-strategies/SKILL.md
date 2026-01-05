# Universal Debugging Strategies

**Skill**: debugging-strategies
**Plugin**: dev
**Version**: 1.0.0

## Overview

Language-agnostic debugging techniques and strategies applicable across all technology stacks.

## Debugging Methodology

### The Scientific Method for Debugging

1. **Observe**: Gather information about the bug
2. **Hypothesize**: Form theories about the cause
3. **Predict**: What would confirm/refute each theory?
4. **Test**: Run experiments to validate
5. **Conclude**: Identify root cause and fix

### Systematic Approach

```
1. Reproduce the bug reliably
2. Isolate the failing code path
3. Trace backwards from the error
4. Identify the root cause
5. Verify the fix
6. Add tests to prevent regression
```

## Error Analysis

### Stack Trace Reading

Read stack traces **bottom to top**:

```
Error: Cannot read property 'name' of undefined
    at formatUser (src/utils/format.ts:42)      ← Error thrown here
    at processUsers (src/services/user.ts:28)    ← Called from here
    at UserList.render (src/components/UserList.tsx:15)
    at App.render (src/App.tsx:8)                ← Entry point
```

**Focus on YOUR code** - skip framework/library internals initially.

### Error Categories

| Category | Examples | Common Causes |
|----------|----------|---------------|
| **Null/Undefined** | `Cannot read property 'x' of undefined` | Missing data, async timing |
| **Type Errors** | `x is not a function` | Wrong type, typo |
| **Logic Errors** | Wrong output, no error | Incorrect conditions |
| **Runtime Errors** | Out of bounds, division by zero | Invalid input |
| **Async Errors** | Unhandled promise rejection | Missing error handler |
| **Network Errors** | Timeout, connection refused | API down, wrong URL |

## Debugging Techniques

### Binary Search (Bisection)

When the bug is somewhere in a large codebase:

```
1. Find a known good state (commit, version)
2. Find current bad state
3. Test the midpoint
4. Narrow to half with bug
5. Repeat until found
```

**Git bisect**:
```bash
git bisect start
git bisect bad                    # Current commit is broken
git bisect good v1.0.0           # v1.0.0 was working
# Git checks out midpoint, test it
git bisect good/bad              # Mark and continue
```

### Wolf Fence Algorithm

Split the code into sections and determine which section contains the bug:

```
┌─────────────────────────────────────┐
│           Code Section A            │ ← Test: Bug here?
├─────────────────────────────────────┤
│           Code Section B            │ ← Test: Bug here?
├─────────────────────────────────────┤
│           Code Section C            │ ← Test: Bug here?
└─────────────────────────────────────┘
```

Add logging/breakpoints at section boundaries, narrow down.

### Rubber Duck Debugging

Explain the code line by line (to a rubber duck, colleague, or yourself):

1. Explain what the code SHOULD do
2. Explain what it ACTUALLY does
3. The discrepancy reveals the bug

### Change One Thing at a Time

When experimenting:
- Make ONE change
- Test
- Observe result
- Revert if no improvement
- Repeat

## Data Flow Tracing

### Backwards Tracing

Start at the error, trace backwards:

```
1. Error occurs at line 42: user.name is undefined
2. Where does `user` come from? Line 38: const user = getUser(id)
3. What does getUser return? Check function...
4. getUser queries database, returns undefined if not found
5. Root cause: No null check after getUser
```

### Forward Tracing

Start at input, trace forward:

```
1. User enters email: "test@example"
2. Form submits to /api/register
3. API validates email... passes (bug: missing TLD check)
4. Saves to database with invalid email
5. Later processes fail on invalid email
```

## Logging Strategies

### Strategic Log Placement

```typescript
function processOrder(order) {
  console.log('processOrder START', { orderId: order.id });

  try {
    const validated = validateOrder(order);
    console.log('Validation passed', { orderId: order.id });

    const result = saveOrder(validated);
    console.log('processOrder SUCCESS', { orderId: order.id, result });

    return result;
  } catch (error) {
    console.error('processOrder FAILED', {
      orderId: order.id,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

### Log Levels

| Level | Use For | Example |
|-------|---------|---------|
| **ERROR** | Failures requiring attention | `Failed to save order: DB connection lost` |
| **WARN** | Potential issues | `Retry 2/3 for API call` |
| **INFO** | Significant events | `User logged in: user123` |
| **DEBUG** | Detailed diagnostics | `Validating email: test@example.com` |
| **TRACE** | Very verbose | `Entering function processOrder` |

### Structured Logging

```typescript
// BAD: Unstructured
console.log('User ' + userId + ' ordered ' + items.length + ' items');

// GOOD: Structured
logger.info('Order placed', {
  userId,
  itemCount: items.length,
  total: order.total,
  timestamp: new Date().toISOString()
});
```

## Breakpoint Strategies

### Types of Breakpoints

| Type | Use Case |
|------|----------|
| **Line** | Stop at specific line |
| **Conditional** | Stop only when condition is true |
| **Logpoint** | Log without stopping |
| **Exception** | Stop on thrown exception |
| **DOM** | Stop on DOM modification (browser) |

### Effective Breakpoint Placement

1. **Before the error** - See state leading to failure
2. **At decision points** - Check which branch executes
3. **At data boundaries** - API calls, DB queries
4. **In loops** - Check iteration values

## Common Bug Patterns

### Off-by-One Errors

```typescript
// BUG: Index out of bounds
for (let i = 0; i <= array.length; i++) {
  console.log(array[i]); // Fails on last iteration
}

// FIX
for (let i = 0; i < array.length; i++) {
  console.log(array[i]);
}
```

### Race Conditions

```typescript
// BUG: Race condition
async function getData() {
  fetchData().then(data => { this.data = data; });
  processData(this.data); // May run before fetch completes!
}

// FIX: Await the result
async function getData() {
  this.data = await fetchData();
  processData(this.data);
}
```

### Null Reference

```typescript
// BUG: Accessing property of undefined
const name = user.profile.name;

// FIX: Optional chaining or guard
const name = user?.profile?.name;
// or
if (user && user.profile) {
  const name = user.profile.name;
}
```

### State Mutation

```typescript
// BUG: Mutating input
function addTax(price) {
  price.total = price.amount * 1.2; // Mutates input!
  return price;
}

// FIX: Return new object
function addTax(price) {
  return {
    ...price,
    total: price.amount * 1.2
  };
}
```

### Closure Pitfalls

```javascript
// BUG: All callbacks share same i
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // Logs: 3, 3, 3
}

// FIX: Use let (block scope) or capture value
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // Logs: 0, 1, 2
}
```

## Environment-Specific Debugging

### Browser (JavaScript)

- DevTools Console
- Network tab for API calls
- Elements tab for DOM
- Sources tab for breakpoints
- Performance tab for bottlenecks
- Application tab for storage

### Node.js

```bash
# Start with inspector
node --inspect app.js

# Break on first line
node --inspect-brk app.js
```

### Backend APIs

- Request/response logging
- Database query logging
- Trace IDs for distributed tracing
- Health check endpoints

## Debugging Checklist

When stuck, verify:

- [ ] **Input**: Is input data correct?
- [ ] **Config**: Are environment variables set?
- [ ] **Dependencies**: Are all services running?
- [ ] **Versions**: Is the correct version deployed?
- [ ] **Cache**: Is stale data being used?
- [ ] **Permissions**: Does the code have required access?
- [ ] **Timing**: Are async operations completing?
- [ ] **State**: Is application state as expected?

## Prevention

### Defensive Coding

```typescript
function processUser(user) {
  // Guard clauses
  if (!user) throw new Error('User is required');
  if (!user.email) throw new Error('User email is required');

  // Type assertions (TypeScript)
  const email = user.email as string;

  // Proceed with validated data
  return formatUser(user);
}
```

### Assertions

```typescript
// Development-time checks
function divide(a, b) {
  console.assert(b !== 0, 'Division by zero');
  return a / b;
}
```

### Error Boundaries

```typescript
try {
  riskyOperation();
} catch (error) {
  // Log with context
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { userId, operation: 'riskyOperation' }
  });

  // Recover or rethrow
  throw new OperationError('Failed to complete operation', { cause: error });
}
```

---

*Debugging strategies applicable to all technology stacks*

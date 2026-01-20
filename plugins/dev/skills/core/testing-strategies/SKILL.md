---
name: testing-strategies
version: 1.0.0
description: Use when writing tests, setting up test frameworks, implementing mocking strategies, or establishing testing best practices (unit, integration, E2E) across any technology stack.
keywords:
  - testing
  - unit tests
  - integration tests
  - E2E testing
  - mocking
  - test coverage
  - test-driven development
  - TDD
  - test pyramid
plugin: dev
updated: 2026-01-20
---

# Universal Testing Strategies

## Overview

Language-agnostic testing patterns and strategies applicable across all technology stacks.

## Testing Pyramid

```
          ┌───────┐
          │  E2E  │  Few, slow, expensive
         ─┴───────┴─
        ┌───────────┐
        │Integration│  Some, medium speed
       ─┴───────────┴─
      ┌───────────────┐
      │     Unit      │  Many, fast, cheap
     ─┴───────────────┴─
```

### Unit Tests (70-80%)

- Test individual functions/methods in isolation
- Mock external dependencies
- Fast execution (< 10ms per test)
- High volume, run on every save

### Integration Tests (15-20%)

- Test component interactions
- Real database/API calls (often with test containers)
- Medium speed (100ms - 1s per test)
- Run on commit/PR

### End-to-End Tests (5-10%)

- Test complete user flows
- Real browser/environment
- Slow (seconds to minutes)
- Run before deployment

## Test Structure: AAA Pattern

```
// Arrange - Set up test data and conditions
const user = createTestUser({ email: 'test@example.com' });
const service = new UserService(mockDb);

// Act - Execute the code under test
const result = await service.createUser(user);

// Assert - Verify the expected outcome
expect(result.id).toBeDefined();
expect(result.email).toBe('test@example.com');
```

## Naming Conventions

### Test File Names

```
component.test.ts       # Unit tests
component.spec.ts       # Alternative convention
component.integration.ts # Integration tests
component.e2e.ts        # End-to-end tests
```

### Test Case Names

Use descriptive names that explain the scenario:

```
// Pattern: should [expected behavior] when [condition]
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user when valid data provided', () => {});
    it('should throw ValidationError when email is invalid', () => {});
    it('should throw DuplicateError when email already exists', () => {});
  });
});
```

### BDD Style (Given-When-Then)

```
describe('User Registration', () => {
  describe('given a valid email and password', () => {
    describe('when the user submits the form', () => {
      it('then creates a new account', () => {});
      it('then sends a welcome email', () => {});
    });
  });
});
```

## Mocking Strategies

### Test Doubles Overview

| Type | Purpose | Example |
|------|---------|---------|
| **Stub** | Returns predetermined values | `stub.returns(42)` |
| **Mock** | Verifies interactions | `expect(mock).toHaveBeenCalled()` |
| **Spy** | Wraps real implementation | `spy(realFunction)` |
| **Fake** | Working implementation (simplified) | In-memory database |
| **Dummy** | Placeholder (not used) | Required parameter |

### When to Mock

**DO Mock:**
- External services (APIs, databases)
- Time-dependent functions
- Random number generators
- File system operations
- Network requests

**DON'T Mock:**
- The code under test
- Simple value objects
- Pure functions with no side effects

### Mock Example

```typescript
// Mock external API
const mockApi = {
  getUser: jest.fn().mockResolvedValue({ id: '1', name: 'Test' })
};

// Inject mock
const service = new UserService(mockApi);
const result = await service.getUser('1');

// Verify interaction
expect(mockApi.getUser).toHaveBeenCalledWith('1');
expect(result.name).toBe('Test');
```

## Test Data Management

### Test Factories

Create reusable factory functions for test data:

```typescript
// factories/user.ts
export function createTestUser(overrides = {}) {
  return {
    id: randomUUID(),
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    createdAt: new Date(),
    ...overrides
  };
}

// In tests
const user = createTestUser({ name: 'Custom Name' });
```

### Fixtures

Static test data for consistent testing:

```typescript
// fixtures/users.ts
export const validUser = {
  email: 'valid@example.com',
  password: 'SecurePass123!'
};

export const invalidEmails = [
  'no-at-sign',
  '@no-local.com',
  'no-domain@',
  'spaces in@email.com'
];
```

## Assertion Best Practices

### Be Specific

```typescript
// BAD - vague assertion
expect(result).toBeTruthy();

// GOOD - specific assertion
expect(result.success).toBe(true);
expect(result.data.id).toBe('expected-id');
```

### One Logical Assertion Per Test

```typescript
// BAD - multiple unrelated assertions
it('should process order', () => {
  expect(order.id).toBeDefined();
  expect(order.total).toBe(100);
  expect(emailService.send).toHaveBeenCalled();
  expect(inventory.reduce).toHaveBeenCalled();
});

// GOOD - focused tests
it('should assign an order ID', () => {
  expect(order.id).toBeDefined();
});

it('should calculate correct total', () => {
  expect(order.total).toBe(100);
});

it('should send confirmation email', () => {
  expect(emailService.send).toHaveBeenCalled();
});
```

### Custom Matchers

Create domain-specific matchers for readability:

```typescript
expect.extend({
  toBeValidEmail(received) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass,
      message: () => `expected ${received} to be a valid email`
    };
  }
});

// Usage
expect('user@example.com').toBeValidEmail();
```

## Edge Cases to Test

### Input Validation

- Empty/null/undefined inputs
- Boundary values (0, -1, MAX_INT)
- Invalid types
- Malformed data

### State Transitions

- Initial state
- After single operation
- After multiple operations
- After error and recovery

### Async Operations

- Successful completion
- Timeout
- Network errors
- Concurrent operations
- Race conditions

### Error Handling

- Expected errors (validation)
- Unexpected errors (system)
- Error recovery
- Error propagation

## Code Coverage Guidelines

### Coverage Targets

| Type | Target | Notes |
|------|--------|-------|
| Line Coverage | 80% | Minimum acceptable |
| Branch Coverage | 75% | Test all conditionals |
| Function Coverage | 90% | All public APIs |
| Critical Paths | 100% | Auth, payments, data integrity |

### Coverage Pitfalls

**High coverage ≠ good tests**

```typescript
// 100% coverage but useless test
it('should run without error', () => {
  processOrder(order); // No assertions!
});
```

**Focus on:**
- Business-critical paths
- Edge cases and error handling
- Integration points

## Test Performance

### Keep Tests Fast

| Test Type | Target Time |
|-----------|-------------|
| Unit test | < 10ms |
| Integration test | < 1s |
| E2E test | < 30s |
| Full suite | < 5min |

### Parallelization

```bash
# Run tests in parallel
vitest --pool=threads
jest --maxWorkers=4
pytest -n auto
go test -parallel 4
```

### Test Isolation

Tests should not depend on each other:

```typescript
// BAD - shared state
let counter = 0;
it('test 1', () => { counter++; });
it('test 2', () => { expect(counter).toBe(1); }); // Fragile!

// GOOD - isolated state
beforeEach(() => { counter = 0; });
it('test 1', () => { counter++; expect(counter).toBe(1); });
it('test 2', () => { counter++; expect(counter).toBe(1); });
```

## CI/CD Integration

### Pre-commit

- Lint checks
- Type checks
- Unit tests (fast)

### Pull Request

- Full unit test suite
- Integration tests
- Coverage report

### Pre-deployment

- E2E tests
- Performance tests
- Security scans

## Test Maintenance

### Avoid Flaky Tests

- Don't depend on timing
- Don't depend on external services
- Use deterministic data
- Retry with care (hide real issues)

### Keep Tests Readable

- Clear naming
- Minimal setup
- Obvious assertions
- Helpful failure messages

### Review Test Code

- Test code is production code
- Apply same quality standards
- Refactor when needed

---

*Testing strategies applicable to all technology stacks*

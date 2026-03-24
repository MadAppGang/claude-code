---
name: test-coverage
description: "Measures line, branch, and function coverage metrics, identifies untested critical code paths prioritized by risk, and generates gap analysis reports with specific test recommendations. Use when measuring coverage, finding test gaps before deployment, or identifying untested security-critical code."
---

# Test Coverage Skill

## Overview

The test-coverage skill provides comprehensive on-demand test coverage analysis for your codebase. It identifies untested code paths, measures coverage metrics, finds test gaps, evaluates test quality, and provides actionable recommendations for improving test coverage across all supported technology stacks.

**When to Use**:
- Measuring current test coverage
- Identifying untested critical code paths
- Finding gaps before deployment
- Improving test suite quality
- Compliance requirements (80% coverage)
- Refactoring with confidence
- Onboarding new team members

**Technology Coverage**:
- React/TypeScript/JavaScript (Jest, Vitest, React Testing Library)
- Go (go test with coverage)
- Rust (cargo test with tarpaulin)
- Python (pytest with coverage.py)
- Full-stack applications

## Coverage Metrics

### 1. Line Coverage

**Definition**: Percentage of executable lines that are executed by tests.

**Example**:
```typescript
function divide(a: number, b: number): number {
  if (b === 0) {              // Line 1: COVERED
    throw new Error('Div 0'); // Line 2: NOT COVERED
  }
  return a / b;               // Line 3: COVERED
}

// Test only covers normal case
test('divides numbers', () => {
  expect(divide(10, 2)).toBe(5);
});

// Line Coverage: 66% (2/3 lines)
```

**Interpretation**:
- 100%: All lines executed (ideal for critical code)
- 80-99%: Good coverage, some edge cases missed
- 60-79%: Moderate, needs improvement
- <60%: Poor, significant gaps

### 2. Branch Coverage

**Definition**: Percentage of decision branches (if/else, switch, ternary) that are tested.

**Example**:
```typescript
function getUserStatus(user: User): string {
  if (user.isActive) {     // Branch 1: true (COVERED)
    if (user.isPremium) {  // Branch 2: true (NOT COVERED)
      return 'premium';    // NOT COVERED
    }
    return 'active';       // COVERED
  }
  return 'inactive';       // Branch 1: false (NOT COVERED)
}

// Test only covers active non-premium
test('returns status', () => {
  expect(getUserStatus({ isActive: true, isPremium: false })).toBe('active');
});

// Branch Coverage: 33% (1/3 branches)
// Line Coverage: 60% (3/5 lines)
```

**Why Important**: Higher than line coverage, catches edge cases.

### 3. Function Coverage

**Definition**: Percentage of functions that are called at least once in tests.

**Example**:
```typescript
// auth.ts
export function login(user: string, pass: string) { ... }    // COVERED
export function logout() { ... }                             // COVERED
export function resetPassword(email: string) { ... }         // NOT COVERED
export function changePassword(old: string, new: string) { ... } // NOT COVERED

// Function Coverage: 50% (2/4 functions)
```

**Red Flag**: Exported functions with 0% coverage.

### 4. Statement Coverage

**Definition**: Percentage of statements executed (similar to line coverage but more granular).

**Difference from Line Coverage**:
```typescript
// Single line, multiple statements
const x = 1, y = 2, z = 3;

// Line coverage: 1 line
// Statement coverage: 3 statements
```

**Use Case**: More precise for minified or compact code.

## Gap Analysis

### Identifying Untested Code

**Priority Levels**:

**CRITICAL** (Must Test):
- Authentication and authorization logic
- Payment processing
- Data validation
- Security checks
- Error handling
- Database transactions

**HIGH** (Should Test):
- Business logic
- API endpoints
- Data transformations
- State management
- Integration points

**MEDIUM** (Nice to Test):
- Utility functions
- Formatters
- Constants
- Simple getters/setters

**LOW** (Optional):
- Type definitions
- Configuration files
- Mock data

### Gap Report Format

```markdown
# Test Coverage Gap Analysis

**Generated**: 2026-01-28 14:32:00
**Coverage**: 68% (Target: 80%)
**Files Analyzed**: 247
**Critical Gaps**: 12 files

## Executive Summary

**Overall Coverage**:
- Line Coverage: 68% (Target: 80%) - 12% below
- Branch Coverage: 54% (Target: 75%) - 21% below
- Function Coverage: 71% (Target: 85%) - 14% below

**Risk Assessment**: MEDIUM-HIGH
- 12 critical files under 50% coverage
- 23 high-priority functions untested
- 47 error handling branches untested

## Critical Gaps (Priority 1)

### [GAP-001] Authentication Module
**File**: src/auth/AuthService.ts
**Line Coverage**: 34% (Target: 95%+)
**Branch Coverage**: 22%
**Risk**: CRITICAL

**Untested Code Paths**:
```typescript
// CRITICAL: No tests for password reset flow
async resetPassword(email: string): Promise<void> {
  const user = await this.userRepo.findByEmail(email);
  if (!user) {
    throw new NotFoundError('User not found'); // UNTESTED
  }
  const token = generateResetToken();           // UNTESTED
  await this.emailService.sendResetEmail(       // UNTESTED
    user.email,
    token
  );
}

// CRITICAL: No tests for token expiry
validateResetToken(token: string): boolean {
  const decoded = jwt.verify(token, SECRET);
  if (Date.now() > decoded.exp) {              // UNTESTED
    return false;
  }
  return true;
}
```

**Impact**: Security vulnerability, potential for unauthorized access.

**Recommendation**: Add comprehensive tests for all auth flows.

**Required Tests**:
1. resetPassword with valid email
2. resetPassword with invalid email
3. resetPassword with malformed email
4. validateResetToken with expired token
5. validateResetToken with invalid token
6. validateResetToken with valid token

**Estimated Coverage After**: 88%

---

### [GAP-002] Payment Processing
**File**: src/payments/PaymentService.ts
**Line Coverage**: 41% (Target: 99%+)
**Branch Coverage**: 29%
**Risk**: CRITICAL

**Untested Code Paths**:
```typescript
async processPayment(order: Order): Promise<PaymentResult> {
  try {
    const charge = await stripe.charges.create({ // TESTED
      amount: order.total,
      currency: 'usd',
      source: order.paymentToken
    });

    if (charge.status === 'failed') {            // UNTESTED
      await this.handleFailedPayment(order);     // UNTESTED
      throw new PaymentError('Payment failed');
    }

    await this.fulfillOrder(order);              // TESTED
    return { success: true, chargeId: charge.id };
  } catch (error) {
    if (error.code === 'card_declined') {        // UNTESTED
      await this.notifyCardDeclined(order);      // UNTESTED
    }
    throw error;                                 // UNTESTED
  }
}
```

**Impact**: Financial loss, failed orders without proper handling.

**Recommendation**: Mock Stripe, test all payment scenarios.

**Required Tests**:
1. Successful payment flow
2. Failed payment (charge.status === 'failed')
3. Card declined error
4. Network error during payment
5. Order fulfillment failure after charge

**Estimated Coverage After**: 94%

## High Priority Gaps (Priority 2)

### [GAP-003] User Registration Validation
**File**: src/users/UserService.ts
**Line Coverage**: 62%
**Branch Coverage**: 48%
**Risk**: HIGH

**Untested Validation Logic**:
```typescript
validateUserData(data: UserInput): ValidationResult {
  const errors: string[] = [];

  if (!data.email || !data.email.includes('@')) {  // Partially tested
    errors.push('Invalid email');
  }

  if (data.password.length < 8) {                  // UNTESTED
    errors.push('Password too short');
  }

  if (!/[A-Z]/.test(data.password)) {              // UNTESTED
    errors.push('Password needs uppercase');
  }

  if (!/[0-9]/.test(data.password)) {              // UNTESTED
    errors.push('Password needs number');
  }

  return { valid: errors.length === 0, errors };
}
```

**Recommendation**: Test all validation branches.

### [GAP-004] API Error Handling
**File**: src/api/handlers/UserHandler.ts
**Line Coverage**: 59%
**Branch Coverage**: 41%
**Risk**: HIGH

**Untested Error Paths**:
```typescript
async getUser(req: Request, res: Response) {
  try {
    const user = await this.userService.getById(req.params.id);
    res.json(user);                                 // TESTED
  } catch (error) {
    if (error instanceof NotFoundError) {           // UNTESTED
      res.status(404).json({ error: 'Not found' });
    } else if (error instanceof ValidationError) {  // UNTESTED
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Server error' }); // UNTESTED
    }
  }
}
```

**Recommendation**: Test all error types and status codes.

## Medium Priority Gaps

### Files Under 70% Coverage

| File | Coverage | Untested Lines | Priority |
|------|----------|----------------|----------|
| src/utils/DateFormatter.ts | 67% | 12 | MEDIUM |
| src/services/EmailService.ts | 65% | 23 | MEDIUM |
| src/middleware/RateLimiter.ts | 63% | 18 | MEDIUM |
| src/database/Migrations.ts | 58% | 34 | LOW |

## Coverage by Module

```
Module Coverage Breakdown:

├── src/auth/               34% (CRITICAL - needs work)
├── src/payments/           41% (CRITICAL - needs work)
├── src/users/              62% (below target)
├── src/api/handlers/       59% (below target)
├── src/services/           72% (above target ✓)
├── src/utils/              84% (good ✓)
├── src/database/           91% (excellent ✓)
└── src/components/         77% (good ✓)

Overall: 68%
Target: 80%
Gap: -12%
```

## Untested Critical Scenarios

**Authentication**:
- [ ] Password reset with expired token
- [ ] Login with locked account
- [ ] Session expiry handling
- [ ] OAuth failure scenarios

**Payments**:
- [ ] Card declined
- [ ] Payment timeout
- [ ] Refund processing
- [ ] Webhook validation

**Data Validation**:
- [ ] SQL injection attempts
- [ ] XSS in user input
- [ ] Max length validation
- [ ] Special character handling

**Error Handling**:
- [ ] Network failures
- [ ] Database connection loss
- [ ] External API timeouts
- [ ] Rate limit exceeded

## Recommendations

### Immediate Actions (This Week)

1. **Add auth module tests** - Priority: CRITICAL
   - Target: 34% → 90% coverage
   - Estimated effort: 1 day
   - Tests needed: 12 scenarios

2. **Add payment processing tests** - Priority: CRITICAL
   - Target: 41% → 95% coverage
   - Estimated effort: 1 day
   - Tests needed: 8 scenarios

3. **Test all error handling paths** - Priority: HIGH
   - Focus on API handlers
   - Estimated effort: 0.5 days

**Expected Coverage After**: 68% → 76%

### Short Term (This Month)

1. Improve user validation tests
2. Add integration tests for critical flows
3. Test edge cases in business logic
4. Add E2E tests for happy paths

**Expected Coverage After**: 76% → 82%

### Long Term (This Quarter)

1. Achieve 85%+ coverage target
2. Add mutation testing
3. Improve test quality metrics
4. Automate coverage checks in CI/CD

**Target Coverage**: 85%

## Test Quality Assessment

Coverage is not the only metric. Test quality matters:

### Test Smells Detected

**1. Tests Without Assertions** (4 tests)
```typescript
// BAD: No assertion
test('creates user', async () => {
  await createUser({ name: 'John' });
});

// GOOD: Verify behavior
test('creates user', async () => {
  const user = await createUser({ name: 'John' });
  expect(user.id).toBeDefined();
  expect(user.name).toBe('John');
});
```

**2. Tests That Don't Test Anything** (7 tests)
```typescript
// BAD: Always passes
test('validates email', () => {
  const result = validateEmail('test@example.com');
  expect(result).toBeTruthy(); // Any truthy value passes
});

// GOOD: Specific assertion
test('validates email', () => {
  expect(validateEmail('test@example.com')).toBe(true);
  expect(validateEmail('invalid')).toBe(false);
});
```

**3. Overly Broad Mocks** (12 tests)
```typescript
// BAD: Mocks everything, tests nothing
jest.mock('../UserService');

// GOOD: Mock only external dependencies
jest.mock('../EmailService');
// UserService tested with real implementation
```

**4. Flaky Tests** (3 tests)
```typescript
// BAD: Depends on timing
test('debounces input', async () => {
  fireEvent.change(input, { target: { value: 'test' } });
  await new Promise(resolve => setTimeout(resolve, 100)); // Flaky!
  expect(mockFn).toHaveBeenCalledTimes(1);
});

// GOOD: Use fake timers
test('debounces input', () => {
  jest.useFakeTimers();
  fireEvent.change(input, { target: { value: 'test' } });
  jest.advanceTimersByTime(300);
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```
```

## Coverage Report Format

### Standard Coverage Output

**Jest/Vitest**:
```
----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------|---------|----------|---------|---------|-------------------
All files       |   68.23 |    54.12 |   71.45 |   68.23 |
 auth/          |   34.56 |    22.31 |   41.23 |   34.56 |
  AuthService   |   34.56 |    22.31 |   41.23 |   34.56 | 42-67,89-102
 payments/      |   41.23 |    29.45 |   50.00 |   41.23 |
  PaymentSvc    |   41.23 |    29.45 |   50.00 |   41.23 | 23-34,56-78
 users/         |   62.34 |    48.12 |   65.23 |   62.34 |
  UserService   |   62.34 |    48.12 |   65.23 |   62.34 | 112-123,145
----------------|---------|----------|---------|---------|-------------------
```

**Go**:
```
coverage: 68.2% of statements

ok      github.com/user/project/auth      0.234s  coverage: 34.5% of statements
ok      github.com/user/project/payments  0.156s  coverage: 41.2% of statements
ok      github.com/user/project/users     0.189s  coverage: 62.3% of statements
```

**Rust (tarpaulin)**:
```
|| Tested/Total Lines:
|| src/auth.rs: 23/67 (34.3%)
|| src/payments.rs: 34/82 (41.5%)
|| src/users.rs: 89/143 (62.2%)
||
68.23% coverage, 146/214 lines covered
```

## Integration with Dev Plugin

### With Test Architect Agent

Request comprehensive test creation:

```
Analyze test coverage and generate tests for all critical gaps
```

The test-architect agent will:
1. Identify gaps using this skill
2. Generate test files
3. Run tests and verify coverage improvement

### With Audit Skill

Combine coverage with security:

```
Identify untested security-critical code paths
```

### With Optimize Skill

Balance coverage with performance:

```
Check test coverage impact on build time
```

## Best Practices

### 1. Set Coverage Targets by Risk

**Critical Code** (95%+ coverage):
- Authentication and authorization
- Payment processing
- Data validation
- Security checks

**Business Logic** (80%+ coverage):
- Core features
- API endpoints
- State management

**Utilities** (70%+ coverage):
- Helper functions
- Formatters
- Parsers

**Infrastructure** (50%+ coverage):
- Configuration
- Build scripts
- Tooling

### 2. Focus on Untested Branches

Branch coverage > line coverage for finding bugs.

**Example**:
```typescript
// 100% line coverage, 50% branch coverage
function process(data: Data | null) {
  const result = data ? data.value : 0; // Both branches needed
  return result * 2;
}

// Test only null case - 100% lines, 50% branches
test('handles null', () => {
  expect(process(null)).toBe(0);
});

// Need both cases
test('handles data', () => {
  expect(process({ value: 5 })).toBe(10);
});
```

### 3. Test Behavior, Not Implementation

**Bad** (tests implementation):
```typescript
test('calls getUserById', () => {
  const spy = jest.spyOn(service, 'getUserById');
  component.loadUser(123);
  expect(spy).toHaveBeenCalledWith(123);
});
```

**Good** (tests behavior):
```typescript
test('displays user name after loading', async () => {
  render(<UserProfile userId={123} />);
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 4. Use Coverage to Find Gaps, Not as Goal

Coverage is a tool, not a target.

**Anti-pattern**: Writing useless tests to hit 100%
**Better**: Writing meaningful tests, accepting 85-90%

### 5. Automate Coverage Checks

**CI/CD Integration**:
```yaml
# .github/workflows/test.yml
- name: Run tests with coverage
  run: npm test -- --coverage

- name: Check coverage threshold
  run: |
    COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% below 80%"
      exit 1
    fi
```

**Pre-commit Hook**:
```bash
#!/bin/bash
# Run tests on changed files
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$')
if [ -n "$CHANGED_FILES" ]; then
  npm test -- --findRelatedTests $CHANGED_FILES --coverage
fi
```

## Examples

### Example 1: New Feature Coverage Check

**Request**:
```
I just added user profile editing. Check test coverage for this feature.
```

**Analysis Process**:
1. Find related files (UserProfile.tsx, useUserProfile.ts, updateUser API)
2. Run coverage for those files
3. Identify untested paths
4. Generate test recommendations

**Report**:
```
User Profile Feature Coverage: 58%

Files:
- UserProfile.tsx: 72% (needs: error handling tests)
- useUserProfile.ts: 45% (needs: loading state, error state)
- updateUser.ts: 67% (needs: validation error cases)

Critical Gaps:
- No test for update failure
- No test for network error
- No test for validation errors

Recommended Tests: 8
Estimated Coverage After: 89%
```

### Example 2: Pre-Deployment Coverage Gate

**Request**:
```
Check if we meet 80% coverage threshold for deployment
```

**Analysis**:
```
Current Coverage: 76% (Target: 80%)
Status: BLOCKED

Modules Below Target:
- auth/: 34% (need +46%)
- payments/: 41% (need +39%)
- api/handlers/: 59% (need +21%)

Quickest Path to 80%:
1. Add auth error handling tests (+8%)
2. Add payment failure tests (+6%)
3. Add API validation tests (+4%)

Estimated Effort: 2 days
```

### Example 3: Identify Regression Risk

**Request**:
```
We're refactoring the auth module. What's our test coverage there?
```

**Analysis**:
```
Auth Module Coverage: 34%

Risk Assessment: HIGH
- 66% of code is untested
- No tests for password reset
- No tests for session expiry
- Limited tests for error cases

Recommendation: STOP
Before refactoring:
1. Increase coverage to 80%+ (add 23 tests)
2. Add integration tests for auth flow
3. Document expected behavior

Refactoring without tests = high regression risk
```

## Stack-Specific Patterns

### React/TypeScript (Jest + RTL)

**Coverage Command**:
```bash
npm test -- --coverage --collectCoverageFrom='src/**/*.{ts,tsx}'
```

**Common Gaps**:
- Error boundaries not triggered
- Loading states not tested
- useEffect cleanup not tested
- Event handlers not tested

### Go

**Coverage Command**:
```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

**Common Gaps**:
- Error return paths
- Defer cleanup functions
- Context cancellation
- Goroutine error handling

### Rust

**Coverage Command**:
```bash
cargo tarpaulin --out Html --output-dir coverage
```

**Common Gaps**:
- Error enum variants
- Match arm branches
- Panic paths
- Unsafe blocks (should be 100%)

## Conclusion

Test coverage analysis identifies gaps, prioritizes testing efforts, and ensures code quality. Use this skill regularly to maintain high coverage, catch regressions early, and ship with confidence.

**Key Takeaways**:
- Measure coverage regularly (every commit)
- Focus on critical code paths first
- Branch coverage > line coverage
- Coverage is a tool, not a goal
- Automate coverage checks in CI/CD

For security analysis, see the `audit` skill. For performance optimization, see the `optimize` skill.

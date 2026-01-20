---
name: test-driven-development
description: "Use when writing production code. Enforces RED-GREEN-REFACTOR cycle: write failing test, make it pass, improve design. Prevents test-after development and ensures verified behavior."
keywords: [TDD, test-driven, red-green-refactor, failing-test, unit-test, integration-test, test-first, jest, vitest, pytest, bun-test, go-test, test-coverage, test-cases, behavior-verification, implementation-without-tests]
created: 2026-01-20
updated: 2026-01-20
plugin: dev
type: discipline
difficulty: beginner
---

# Test-Driven Development (TDD)

**Iron Law:** "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"

## When to Use

Use this skill when:
- Writing new functions, methods, or classes
- Adding features to existing code
- Fixing bugs (write test that reproduces bug first)
- Refactoring code (tests verify behavior preservation)
- Implementing API endpoints or business logic
- Creating UI components with testable behavior

## Red Flags (Violation Indicators)

Watch for these patterns that indicate TDD violations:

- [ ] **Implementation First** - Writing production code before any test exists ("I'll write the function, then add tests")
- [ ] **"Tests After" Promise** - Planning to write tests later ("Let me implement this quickly, I'll add tests after")
- [ ] **"Same Purpose" Rationalization** - Claiming manual testing is equivalent ("I tested it manually, that's the same thing")
- [ ] **Skipping "Simple" Code** - Avoiding tests for "obvious" logic ("This function is too simple to test")
- [ ] **Happy Path Only** - Writing tests only for success cases, ignoring errors ("The normal case works, that's enough")
- [ ] **No Test for Changes** - Modifying code without adding corresponding test ("Just a small change, doesn't need a test")
- [ ] **"Just a Small Fix"** - Bypassing TDD for "quick fixes" ("It's only one line, I don't need a test")

**Violation Detection:** If you find yourself saying "I'll test this after I get it working," you're violating TDD.

## RED-GREEN-REFACTOR Cycle

TDD follows a strict 3-phase workflow:

### Phase 1: RED (Write a Failing Test)

**Objective:** Specify desired behavior through a test that fails

**Steps:**
1. **Write the test first** - Before any production code exists
2. **Define expected behavior** - What should the code do?
3. **Use API you wish existed** - Test the interface you want
4. **Run the test** - Verify it fails (if it passes, you didn't test new behavior)
5. **Check failure reason** - Ensure it fails for the right reason (missing code, not syntax error)

**Example (TypeScript/Jest):**
```typescript
// tests/user-validator.test.ts
describe('UserValidator', () => {
  it('rejects email without @ symbol', () => {
    const validator = new UserValidator();
    const result = validator.validateEmail('invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email must contain @ symbol');
  });
});

// Run: npm test
// Result: FAIL - UserValidator is not defined ✓ (correct failure)
```

**Red Phase Complete When:** Test fails with expected error message

---

### Phase 2: GREEN (Make the Test Pass)

**Objective:** Write minimal code to make test pass

**Steps:**
1. **Write minimal code** - Just enough to pass the test
2. **Don't optimize yet** - Resist the urge to add "nice-to-have" features
3. **Run the test** - Verify it passes
4. **Commit frequently** - Small, passing test = commit point

**Example (TypeScript):**
```typescript
// src/user-validator.ts
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class UserValidator {
  validateEmail(email: string): ValidationResult {
    if (!email.includes('@')) {
      return { isValid: false, error: 'Email must contain @ symbol' };
    }
    return { isValid: true };
  }
}

// Run: npm test
// Result: PASS ✓
```

**Green Phase Complete When:** Test passes consistently

---

### Phase 3: REFACTOR (Improve Design)

**Objective:** Improve code quality while keeping tests green

**Steps:**
1. **Look for duplication** - Extract repeated code
2. **Improve naming** - Make intent clearer
3. **Simplify logic** - Reduce complexity
4. **Run tests after each change** - Ensure behavior preserved
5. **Commit when satisfied** - Refactored code + passing tests = commit

**Example (TypeScript - Refactored):**
```typescript
// src/user-validator.ts
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class UserValidator {
  private static readonly EMAIL_REQUIRED_CHARS = '@';
  private static readonly EMAIL_ERROR = 'Email must contain @ symbol';

  validateEmail(email: string): ValidationResult {
    if (!this.containsRequiredChars(email)) {
      return this.createError(UserValidator.EMAIL_ERROR);
    }
    return this.createSuccess();
  }

  private containsRequiredChars(email: string): boolean {
    return email.includes(UserValidator.EMAIL_REQUIRED_CHARS);
  }

  private createError(message: string): ValidationResult {
    return { isValid: false, error: message };
  }

  private createSuccess(): ValidationResult {
    return { isValid: true };
  }
}

// Run: npm test
// Result: PASS ✓ (behavior unchanged)
```

**Refactor Phase Complete When:** Code is clean AND tests still pass

---

## Anti-patterns Table

| Anti-pattern | ✗ Wrong Approach | ✓ Correct TDD Approach |
|--------------|------------------|------------------------|
| **Test-After** | Write `calculateTotal()` function, then write tests | Write test for `calculateTotal()`, see it fail, implement function |
| **Empty Tests** | Write test that always passes: `expect(true).toBe(true)` | Write test that fails until production code is correct |
| **Happy-Path-Only** | Test only valid inputs: `validateEmail('user@example.com')` | Test invalid inputs too: `validateEmail('no-at-sign')`, `validateEmail('')` |
| **Skip-Simple** | Skip test for "obvious" `add(a, b) { return a + b }` | Write test: `expect(add(2, 3)).toBe(5)` - bugs hide in "simple" code |
| **Change-Then-Test** | Modify `calculateDiscount()`, run app manually, then add test | Write failing test showing bug, modify code until test passes |

## Testing Strategy by Code Type

### Pure Functions

**Pattern:** 1 happy path + 3 edge cases minimum

**Example (TypeScript):**
```typescript
describe('calculateDiscount', () => {
  it('applies 10% discount to $100 purchase', () => {
    expect(calculateDiscount(100, 0.1)).toBe(90);
  });

  it('returns 0 for negative amounts', () => {
    expect(calculateDiscount(-50, 0.1)).toBe(0);
  });

  it('returns original amount for 0 discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  it('throws error for discount > 1', () => {
    expect(() => calculateDiscount(100, 1.5)).toThrow('Discount must be <= 1');
  });
});
```

---

### Error Handlers

**Pattern:** 1 test per error type + 1 success case

**Example (Python/pytest):**
```python
def test_divide_by_zero_raises_error():
    with pytest.raises(ZeroDivisionError, match="Cannot divide by zero"):
        divide(10, 0)

def test_divide_non_numeric_raises_error():
    with pytest.raises(TypeError, match="Arguments must be numbers"):
        divide("10", 5)

def test_divide_returns_float():
    result = divide(10, 3)
    assert result == pytest.approx(3.333, rel=1e-3)
```

---

### UI Components

**Pattern:** 1 render test + 3 interaction tests

**Example (TypeScript/React Testing Library):**
```typescript
describe('LoginForm', () => {
  it('renders email and password inputs', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows error for invalid email', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'invalid');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('disables submit button while loading', async () => {
    render(<LoginForm onSubmit={async () => await delay(1000)} />);
    const submitButton = screen.getByRole('button', { name: 'Login' });
    await userEvent.click(submitButton);
    expect(submitButton).toBeDisabled();
  });

  it('calls onSubmit with form data', async () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123'
    });
  });
});
```

---

### API Endpoints

**Pattern:** 1 success test + 2 error tests

**Example (Go/testing):**
```go
func TestGetUser(t *testing.T) {
  t.Run("returns user for valid ID", func(t *testing.T) {
    req := httptest.NewRequest("GET", "/users/123", nil)
    w := httptest.NewRecorder()

    handler := NewUserHandler(mockUserRepo)
    handler.GetUser(w, req)

    assert.Equal(t, http.StatusOK, w.Code)
    assert.Contains(t, w.Body.String(), `"id":"123"`)
  })

  t.Run("returns 404 for non-existent user", func(t *testing.T) {
    req := httptest.NewRequest("GET", "/users/999", nil)
    w := httptest.NewRecorder()

    handler := NewUserHandler(mockUserRepo)
    handler.GetUser(w, req)

    assert.Equal(t, http.StatusNotFound, w.Code)
  })

  t.Run("returns 400 for invalid ID format", func(t *testing.T) {
    req := httptest.NewRequest("GET", "/users/invalid", nil)
    w := httptest.NewRecorder()

    handler := NewUserHandler(mockUserRepo)
    handler.GetUser(w, req)

    assert.Equal(t, http.StatusBadRequest, w.Code)
  })
}
```

---

## Examples

### Example 1: Bug Fix with TDD (TypeScript)

**Scenario:** User reports: "App crashes when searching with empty query"

**Step 1 (RED): Write test that reproduces bug**
```typescript
// tests/search.test.ts
describe('searchProducts', () => {
  it('returns empty array for empty query', () => {
    const result = searchProducts('');
    expect(result).toEqual([]);
  });
});

// Run: npm test
// Result: FAIL - TypeError: Cannot read property 'toLowerCase' of undefined
```

**Step 2 (GREEN): Fix the bug**
```typescript
// src/search.ts
export function searchProducts(query: string): Product[] {
  if (!query || query.trim() === '') {
    return [];
  }
  return products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
}

// Run: npm test
// Result: PASS ✓
```

**Step 3 (REFACTOR): Add more edge cases**
```typescript
describe('searchProducts', () => {
  it('returns empty array for empty query', () => {
    expect(searchProducts('')).toEqual([]);
  });

  it('returns empty array for whitespace-only query', () => {
    expect(searchProducts('   ')).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(searchProducts('LAPTOP')).toHaveLength(3);
  });
});
```

---

### Example 2: New Feature with TDD (Python)

**Scenario:** Add email validation to user registration

**Step 1 (RED): Write test for feature that doesn't exist**
```python
# tests/test_user.py
def test_user_creation_validates_email():
    with pytest.raises(ValidationError, match="Invalid email format"):
        User.create(email="not-an-email", password="secret123")

# Run: pytest
# Result: FAIL - ValidationError not raised
```

**Step 2 (GREEN): Implement validation**
```python
# src/user.py
import re

class ValidationError(Exception):
    pass

class User:
    @classmethod
    def create(cls, email: str, password: str):
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            raise ValidationError("Invalid email format")
        return cls(email, password)

# Run: pytest
# Result: PASS ✓
```

**Step 3 (REFACTOR): Extract validation logic**
```python
# src/validators.py
class EmailValidator:
    PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    @classmethod
    def validate(cls, email: str) -> bool:
        return bool(re.match(cls.PATTERN, email))

# src/user.py
class User:
    @classmethod
    def create(cls, email: str, password: str):
        if not EmailValidator.validate(email):
            raise ValidationError("Invalid email format")
        return cls(email, password)

# Run: pytest
# Result: PASS ✓ (behavior unchanged)
```

---

### Example 3: API Development with TDD (Go)

**Scenario:** Implement POST /api/orders endpoint

**Step 1 (RED): Write test for non-existent endpoint**
```go
// handlers/orders_test.go
func TestCreateOrder(t *testing.T) {
  t.Run("creates order with valid data", func(t *testing.T) {
    payload := `{"user_id": "123", "items": [{"product_id": "456", "quantity": 2}]}`
    req := httptest.NewRequest("POST", "/api/orders", strings.NewReader(payload))
    w := httptest.NewRecorder()

    handler := NewOrderHandler(mockOrderRepo)
    handler.CreateOrder(w, req)

    assert.Equal(t, http.StatusCreated, w.Code)
    assert.Contains(t, w.Body.String(), `"order_id"`)
  })
}

// Run: go test
// Result: FAIL - handler.CreateOrder undefined
```

**Step 2 (GREEN): Implement handler**
```go
// handlers/orders.go
func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
  var req CreateOrderRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "Invalid request", http.StatusBadRequest)
    return
  }

  order, err := h.orderRepo.Create(req.UserID, req.Items)
  if err != nil {
    http.Error(w, "Failed to create order", http.StatusInternalServerError)
    return
  }

  w.WriteHeader(http.StatusCreated)
  json.NewEncoder(w).Encode(map[string]string{"order_id": order.ID})
}

// Run: go test
// Result: PASS ✓
```

**Step 3 (REFACTOR): Add error handling tests**
```go
func TestCreateOrder(t *testing.T) {
  t.Run("creates order with valid data", func(t *testing.T) {
    // ... existing test
  })

  t.Run("returns 400 for invalid JSON", func(t *testing.T) {
    req := httptest.NewRequest("POST", "/api/orders", strings.NewReader("invalid"))
    w := httptest.NewRecorder()
    handler.CreateOrder(w, req)
    assert.Equal(t, http.StatusBadRequest, w.Code)
  })

  t.Run("returns 400 for missing user_id", func(t *testing.T) {
    payload := `{"items": [{"product_id": "456", "quantity": 2}]}`
    req := httptest.NewRequest("POST", "/api/orders", strings.NewReader(payload))
    w := httptest.NewRecorder()
    handler.CreateOrder(w, req)
    assert.Equal(t, http.StatusBadRequest, w.Code)
  })
}
```

---

## Integration

This skill integrates with:

- **verification-before-completion**: Test output is primary evidence for completion claims
- **systematic-debugging**: When test fails, use debugging workflow to find root cause
- **code-review**: Tests serve as executable documentation and specification
- **refactoring**: Tests enable safe refactoring (verify behavior preservation)

---

## Common Objections & Responses

**Objection:** "TDD is too slow, I can code faster without tests"
**Response:** Writing tests first actually saves time by catching bugs early. Debugging later is far more expensive than preventing bugs upfront.

**Objection:** "This code is too simple to test"
**Response:** Simple code is fastest to test. If it's truly simple, the test takes 30 seconds. If you can't write a fast test, the code isn't simple.

**Objection:** "I'll write tests after I figure out the design"
**Response:** Tests ARE the design. Writing tests first forces you to think about API usability before implementation locks you in.

**Objection:** "I need to see if my approach works before committing to tests"
**Response:** That's what the RED phase is for - write a test describing your desired approach, then implement it. If approach changes, update test first.

---

## Summary

**Core Principle:** Tests first, code second, refactor third.

**Workflow:**
1. RED: Write failing test
2. GREEN: Make test pass
3. REFACTOR: Improve design

**Benefits:**
- Catches bugs before they ship
- Documents expected behavior
- Enables fearless refactoring
- Forces good API design

**Remember:** If you wrote production code without a failing test first, you violated TDD. Delete the code and start over with a test.

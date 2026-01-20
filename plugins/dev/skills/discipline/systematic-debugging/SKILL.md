---
name: systematic-debugging
description: "Use when debugging failures, errors, or unexpected behavior. Covers root cause investigation, data flow tracing, hypothesis-driven debugging, and fix verification to prevent trial-and-error approaches."
keywords: [debugging, root-cause, trace-data-flow, divergence, hypothesis, fix-verification, stack-trace, error-analysis, profiling, logging, TypeError, null-undefined, race-condition, promise-not-awaited, validation-failed, wrong-condition, env-var, stale-cache, format-changed, early-return, service-not-running]
created: 2026-01-20
updated: 2026-01-20
plugin: dev
type: discipline
difficulty: beginner
---

# Systematic Debugging

**Iron Law:** "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"

## When to Use

Use this skill when:
- A test fails and you need to understand why
- An error is thrown and you need to find the cause
- A feature behaves unexpectedly
- Performance degrades and you need to identify bottlenecks
- Data corruption occurs and you need to trace the source
- A bug reappears after "fixing" it

## Red Flags (Violation Indicators)

Detect these patterns that indicate skipping root cause investigation:

- [ ] **Fix without understanding** - "I'll just add a null check" (why is it null?)
- [ ] **Skip to solution** - "Let me try wrapping this in setTimeout" (why does timing matter?)
- [ ] **Restart tools** - "Let me restart the dev server" (what state is corrupted?)
- [ ] **Clear cache** - "Let me clear the cache" (what cache entry is stale?)
- [ ] **Change multiple things** - "Let me update these 3 files" (which one fixes it?)
- [ ] **Shouldn't cause problem** - "This change shouldn't affect that" (but it does, why?)
- [ ] **Assume cause** - "Must be a race condition" (what evidence supports this?)

## Key Concepts

### 1. Root Cause vs. Symptom

**Symptom:** What you observe (test fails, error thrown, wrong output)
**Root Cause:** Why it happens (null value, wrong condition, missing await)

**Example:**
```
Symptom: "TypeError: Cannot read property 'name' of undefined"
Root Cause: API returns null when user not found, but code expects object
```

**Bad approach:** Add `user?.name` (fixes symptom, not cause)
**Good approach:** Add validation `if (!user) throw new NotFoundError()` (fixes cause)

### 2. Data Flow Tracing

**Principle:** Follow data from source to error point

**Steps:**
1. Identify error location (stack trace line number)
2. Identify data involved (variable name, object property)
3. Trace backwards: Where does this data come from?
4. Find divergence: Where does actual differ from expected?

**Example:**
```
Error: "Expected 'active' but got 'inactive'"
Location: user.test.ts:42 - expect(user.status).toBe('active')
Data: user.status = 'inactive'
Trace: user.status ← updateUser() ← API response ← database
Divergence: Database has status='inactive' (expected 'active')
Root Cause: Test setup didn't create user with active status
```

### 3. Hypothesis-Driven Debugging

**Principle:** Form hypothesis, test with evidence, refine

**Process:**
1. **Observe:** What is the symptom? (error message, wrong output)
2. **Hypothesize:** What could cause this? (list 2-3 possibilities)
3. **Predict:** If hypothesis is true, what else should I see?
4. **Test:** Add logging, check state, run minimal reproduction
5. **Conclude:** Does evidence support hypothesis? If no, try next hypothesis

**Example:**
```
Symptom: API request times out after 30s
Hypothesis 1: Database query is slow
  Prediction: Should see long query time in logs
  Test: Add query timing logs
  Result: Queries complete in <100ms ✗ Hypothesis rejected

Hypothesis 2: Network connection is hanging
  Prediction: Should see connection delay, not query delay
  Test: Add request timing logs (connect time vs. query time)
  Result: Connection takes 31s, query never runs ✓ Hypothesis confirmed

Root Cause: Firewall blocks connection, causing timeout
```

### 4. Fix Verification

**Principle:** Verify fix addresses root cause, not just symptom

**Checklist:**
- [ ] Test that was failing now passes
- [ ] Test passes for the reason you expect (not coincidence)
- [ ] Test fails if you revert the fix (confirms fix is necessary)
- [ ] Related tests still pass (no regressions)
- [ ] Root cause is addressed in fix (not just symptom)

## 4-Phase Debugging Process

### Phase 1: TRACE DATA FLOW

**Objective:** Identify where actual diverges from expected

**Steps:**
1. Read error message (what failed?)
2. Read stack trace (where failed?)
3. Identify data involved (what value is wrong?)
4. Trace backwards from error to source
5. Log intermediate values to find divergence point

**Example (TypeScript):**
```typescript
// Error: "Expected user email, got undefined"
// Stack trace: user-service.ts:42

// Phase 1: Trace data flow
console.log('1. API response:', response);           // { data: { user: {...} } }
console.log('2. Extracted user:', response.data);     // { user: {...} }
console.log('3. User object:', response.data.user);   // { id: 1, name: 'Alice' }
console.log('4. Email field:', response.data.user.email); // undefined

// Divergence found: response.data.user has no email field
```

### Phase 2: IDENTIFY DIVERGENCE

**Objective:** Determine why actual differs from expected

**Questions:**
- What is the expected value? (from spec, test, documentation)
- What is the actual value? (from logs, debugger, state inspection)
- Where does the divergence occur? (which function, which line)
- What changed recently? (git diff, recent commits)

**Example (Python):**
```python
# Expected: parse_csv() returns list of dicts with 'email' key
# Actual: parse_csv() returns list of dicts without 'email' key

# Check input CSV file
with open('users.csv') as f:
    print(f.readline())  # id,name,phone  ← Missing 'email' column!

# Divergence: CSV file format changed, missing 'email' column
```

### Phase 3: HYPOTHESIZE ROOT CAUSE

**Objective:** Form testable hypothesis about why divergence occurred

**Hypothesis Template:**
```
"I believe [divergence] occurs because [root cause].
If this is true, I should see [evidence].
I can test this by [action]."
```

**Example (Go):**
```go
// Divergence: user.Email is empty string when fetched from cache

// Hypothesis 1: Cache serialization drops empty fields
// Evidence: Other empty fields (phone, address) also missing
// Test: Check cached JSON structure
// Result: {"id":1,"name":"Alice"} ← Empty fields missing ✓

// Root Cause: JSON serialization omits empty fields (omitempty tag)
```

### Phase 4: VERIFY FIX

**Objective:** Confirm fix addresses root cause

**Verification Steps:**
1. Write test that reproduces the bug (fails before fix)
2. Apply fix
3. Run test (should pass)
4. Explain why fix works (addresses root cause)
5. Run regression tests (no side effects)

**Example (TypeScript):**
```typescript
// Root Cause: JSON serialization omits fields with undefined values

// Before fix:
JSON.stringify({ id: 1, email: undefined }) // {"id":1}

// Fix: Filter out undefined before serialization
const filtered = Object.fromEntries(
  Object.entries(user).filter(([_, v]) => v !== undefined)
);

// Verification:
expect(filtered).toEqual({ id: 1 }); // ✓ Correct behavior
expect(JSON.stringify(filtered)).toBe('{"id":1}'); // ✓ Serialized correctly
```

## Debugging Strategies by Problem Type

### Test Fails

**Strategy:** Identify assertion, trace data, find divergence

```typescript
// Test fails: expect(result).toBe(5)
test('calculates total', () => {
  const result = calculateTotal([1, 2, 2]);
  console.log('Input:', [1, 2, 2]);        // Input data
  console.log('Expected:', 5);              // Expected result
  console.log('Actual:', result);           // Actual result (6)
  console.log('Divergence:', result - 5);   // Difference (1)
  expect(result).toBe(5);
});

// Trace: calculateTotal() sums array incorrectly
// Root Cause: Off-by-one error in loop (includes index 0 twice)
```

### Performance Slow

**Strategy:** Profile execution, identify bottleneck

```python
import time

def slow_function():
    start = time.time()

    # Phase 1: Identify slow section
    data = fetch_data()  # 0.1s
    print(f"Fetch: {time.time() - start:.2f}s")

    processed = process_data(data)  # 5.2s ← Bottleneck!
    print(f"Process: {time.time() - start:.2f}s")

    save_data(processed)  # 0.05s
    print(f"Save: {time.time() - start:.2f}s")

# Root Cause: process_data() has O(n²) algorithm
```

### Data Corruption

**Strategy:** Trace data mutations, find unexpected write

```go
// Symptom: User email changes unexpectedly

// Phase 1: Add logging to all mutation points
func UpdateUser(user *User) {
    log.Printf("Before: %+v", user)
    user.Email = normalizeEmail(user.Email)
    log.Printf("After normalize: %+v", user)
    db.Save(user)
    log.Printf("After save: %+v", user)
}

// Logs show: Email changes in normalizeEmail()
// Root Cause: normalizeEmail() lowercases domain incorrectly
```

### Error Thrown

**Strategy:** Read stack trace, identify throw location, trace backwards

```typescript
// Error: "TypeError: Cannot read property 'length' of null"
// Stack trace:
//   at validateInput (validator.ts:12)
//   at handleSubmit (form.ts:45)
//   at onClick (button.tsx:8)

// Phase 1: Find throw location (validator.ts:12)
function validateInput(input: string) {
  if (input.length < 3) {  // ← Line 12, input is null
    throw new Error('Too short');
  }
}

// Phase 2: Trace backwards (form.ts:45)
function handleSubmit() {
  const input = getInputValue();  // Returns null when field empty
  validateInput(input);  // ← Passes null to validateInput
}

// Root Cause: getInputValue() returns null, but validateInput expects string
// Fix: Add null check or change return type to empty string
```

### Feature Broken

**Strategy:** Identify last working state, compare changes

```bash
# Find last working commit
git bisect start
git bisect bad HEAD           # Current state (broken)
git bisect good v1.2.0        # Last known working version

# Git bisect identifies commit abc123 as first bad commit
git show abc123               # Shows changes

# Root Cause: Commit abc123 changed API response format
```

## Common Root Causes

### Type Issues
- **Null/undefined:** Value is null when code expects object
- **String vs. number:** "42" treated as string, not number
- **Array vs. object:** Iterating object as array
- **Promise vs. value:** Forgot to await async function

### Async Issues
- **Race condition:** Two async operations modify same state
- **Promise not awaited:** Code continues before async completes
- **Callback hell:** Nested callbacks lose error context
- **Event ordering:** Events fire in unexpected order

### Data Issues
- **Validation failed:** Input doesn't match expected format
- **Format changed:** API response structure changed
- **Stale cache:** Cached data is outdated
- **Encoding mismatch:** UTF-8 vs. ASCII, JSON vs. string

### Logic Issues
- **Wrong condition:** if (x > 5) should be if (x >= 5)
- **Early return:** Function returns before reaching correct code
- **Off-by-one:** Loop iterates n-1 or n+1 times
- **Short-circuit:** && or || causes early exit

### Environment Issues
- **Env var not set:** Missing API_KEY environment variable
- **Service not running:** Database or API server is down
- **Version mismatch:** Dependency version incompatibility
- **Permission denied:** File or directory not accessible

## Examples

### Example 1: React Test Failure (TypeScript)

**Symptom:**
```typescript
// Test fails: "Expected button to be disabled"
test('disables submit when invalid', () => {
  render(<Form />);
  const button = screen.getByRole('button');
  expect(button).toBeDisabled();  // ✗ Fails, button is enabled
});
```

**Phase 1: Trace Data Flow**
```typescript
// Add logging to Form component
function Form() {
  const [isValid, setIsValid] = useState(false);
  console.log('isValid:', isValid);  // false (expected)

  return (
    <button disabled={!isValid}>Submit</button>
    // disabled={!false} → disabled={true} → Button should be disabled
  );
}
```

**Phase 2: Identify Divergence**
```typescript
// Check actual DOM state
const button = screen.getByRole('button');
console.log('Disabled attribute:', button.disabled);  // false (actual)
console.log('Button HTML:', button.outerHTML);
// <button>Submit</button> ← Missing 'disabled' attribute!
```

**Phase 3: Hypothesize Root Cause**
```typescript
// Hypothesis: disabled={!isValid} is not setting attribute
// Evidence: Check if React is updating DOM correctly
// Test: Add explicit disabled={true} to verify React works

return <button disabled={true}>Submit</button>;
// Result: Button is NOW disabled ✓
// Conclusion: disabled={!isValid} expression is wrong
```

**Phase 4: Verify Fix**
```typescript
// Root Cause: !isValid evaluates to true, but disabled expects boolean
// Wait... that IS boolean. Let me re-check the initial state.

// Re-trace: Where is isValid initialized?
const [isValid, setIsValid] = useState(false);  // ✓ Correct

// Check component rendering
console.log('Rendering with isValid:', isValid);
// Logs: "Rendering with isValid: undefined" ← FOUND IT!

// Root Cause: useState(false) runs AFTER first render in test
// Fix: Set initial state before render (or use initialProps)
test('disables submit when invalid', () => {
  render(<Form initialValid={false} />);  // ✓ Now works
});
```

### Example 2: Python API Timeout

**Symptom:**
```python
# API request times out after 30 seconds
response = requests.get('https://api.example.com/users')
# Raises: requests.exceptions.Timeout
```

**Phase 1: Trace Data Flow**
```python
import time

start = time.time()
try:
    response = requests.get('https://api.example.com/users', timeout=30)
    print(f"Request took: {time.time() - start:.2f}s")
except requests.exceptions.Timeout:
    print(f"Timeout after: {time.time() - start:.2f}s")  # 30.01s
```

**Phase 2: Identify Divergence**
```python
# Expected: Request completes in <1s (normal API response time)
# Actual: Request times out at 30s
# Divergence: Something delays request for 30+ seconds

# Hypothesis: Network issue, DNS resolution, or connection hang
# Test: Add connection timing
response = requests.get(
    'https://api.example.com/users',
    timeout=(5, 30)  # (connect timeout, read timeout)
)
# Result: Raises timeout after 5s ← Connection timeout!
```

**Phase 3: Hypothesize Root Cause**
```python
# Hypothesis: DNS resolution fails or connection refused
# Test: Try IP address instead of domain
response = requests.get('http://192.168.1.100/users')
# Result: Works! ✓

# Root Cause: DNS resolution for api.example.com fails
# Verification: Check DNS
import socket
socket.gethostbyname('api.example.com')  # Raises: gaierror (DNS failure)
```

**Phase 4: Verify Fix**
```python
# Fix: Use IP address or fix DNS configuration
# Updated code:
API_HOST = os.getenv('API_HOST', '192.168.1.100')
response = requests.get(f'http://{API_HOST}/users')

# Verification:
assert response.status_code == 200  # ✓ Works
assert response.elapsed.total_seconds() < 1  # ✓ Fast
```

### Example 3: Go Data Corruption

**Symptom:**
```go
// User email is corrupted after update
user := User{ID: 1, Email: "Alice@Example.com"}
UpdateUser(&user)
fmt.Println(user.Email)  // Prints: "alice@example.com" (unexpected lowercase)
```

**Phase 1: Trace Data Flow**
```go
func UpdateUser(user *User) {
    log.Printf("Before: %+v", user)  // Email: "Alice@Example.com"

    user.Email = normalizeEmail(user.Email)
    log.Printf("After normalize: %+v", user)  // Email: "alice@example.com"

    db.Save(user)
    log.Printf("After save: %+v", user)  // Email: "alice@example.com"
}

// Divergence: normalizeEmail() changes case
```

**Phase 2: Identify Divergence**
```go
// Expected: Email preserves original case
// Actual: Email is lowercased
// Divergence: normalizeEmail() function

func normalizeEmail(email string) string {
    return strings.ToLower(email)  // ← Root cause!
}
```

**Phase 3: Hypothesize Root Cause**
```go
// Hypothesis: normalizeEmail() should only lowercase domain, not entire email
// Expected behavior: Alice@Example.com → Alice@example.com
// Test: Check email RFC standards

// Verification: Email local part (before @) is case-sensitive
// Email domain (after @) is case-insensitive
// Root Cause: normalizeEmail() lowercases entire email, should only lowercase domain
```

**Phase 4: Verify Fix**
```go
// Fix: Only lowercase domain part
func normalizeEmail(email string) string {
    parts := strings.Split(email, "@")
    if len(parts) != 2 {
        return email  // Invalid email, return as-is
    }
    return parts[0] + "@" + strings.ToLower(parts[1])
}

// Verification:
assert.Equal(t, "Alice@example.com", normalizeEmail("Alice@Example.com"))
assert.Equal(t, "alice@example.com", normalizeEmail("alice@EXAMPLE.COM"))
```

## Integration with Other Skills

### With verification-before-completion
After debugging and fixing, use verification-before-completion to confirm:
- Test that was failing now passes (evidence: test output)
- Root cause is addressed in fix (evidence: code review)
- No regressions introduced (evidence: full test suite passes)

### With test-driven-development
When debugging reveals a bug:
1. Write test that reproduces the bug (RED phase)
2. Debug to find root cause (this skill)
3. Implement fix (GREEN phase)
4. Refactor if needed (REFACTOR phase)

### With agent-coordination-discipline
For complex debugging requiring multiple investigations:
- Use agent delegation when debugging spans multiple services
- Use PROXY_MODE for external debugging expertise
- Define clear success criteria: "Find root cause of timeout"

## Enforcement Checklist

Before marking debugging task complete:

- [ ] Root cause identified (not just symptom)
- [ ] Data flow traced from source to error
- [ ] Hypothesis tested with evidence
- [ ] Fix verified to address root cause
- [ ] Test added to prevent regression
- [ ] Related tests still pass (no side effects)
- [ ] Can explain WHY fix works (not just THAT it works)

**If any checkbox is unchecked, continue debugging. Do not apply fix until root cause is understood.**

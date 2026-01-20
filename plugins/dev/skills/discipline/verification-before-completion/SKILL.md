---
name: verification-before-completion
description: "Use when claiming task completion or marking items as done. Covers completion evidence requirements, verification methods, and anti-rationalization patterns."
keywords: [completion, done, working, ready, verification, evidence, test-output, grep-verification, ci-cd, build-logs, git-diff, screenshot, should-work, probably-works, seems-to, rationalization, todo-complete]
created: 2026-01-20
updated: 2026-01-20
plugin: dev
type: discipline
difficulty: beginner
---

# Verification Before Completion

**Iron Law:** "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"

## When to Use

This skill applies whenever you:
- Mark a todo item as complete
- Claim a bug is fixed
- Report a feature is ready
- State implementation is done
- Close a task or issue
- Prepare to commit changes

## Red Flags (Violation Indicators)

- [ ] "should be done" / "should work now" (assumed completion)
- [ ] "probably works" / "likely fixed" (uncertainty without verification)
- [ ] "seems to work" / "appears correct" (observation without test)
- [ ] "Great!" / "Perfect!" / "All set!" (celebration without evidence)
- [ ] "I already tested this earlier" (stale evidence)
- [ ] Completion claim without test output shown
- [ ] Completion claim without grep verification for file changes
- [ ] Completion claim without screenshot for UI changes
- [ ] Completion claim without git diff for code changes
- [ ] Completion claim without build logs for configuration changes
- [ ] Completion claim without CI link for deployment changes
- [ ] "Just a small change, no need to verify" (size-based rationalization)

## Key Concepts

### Fresh Verification Principle

Verification must be **fresh** (performed after the claimed change) and **explicit** (evidence shown, not described).

**Wrong:**
```
Fixed the login bug in auth.ts. Should be working now.
```

**Correct:**
```
Fixed the login bug in auth.ts line 42:

git diff src/auth.ts:
-  if (user.token == null) {
+  if (user.token === undefined || user.token === null) {

Test output:
✓ should reject undefined token (15ms)
✓ should reject null token (12ms)
✓ should accept valid token (8ms)
```

### Evidence Types by Change Type

| Change Type | Required Evidence | Tool/Method |
|-------------|-------------------|-------------|
| Logic/algorithm | Test output showing pass | `bun test`, `pytest`, `go test` |
| File creation | Grep verification or ls output | `grep -r "pattern" .` or `ls -la path/` |
| UI/styling | Screenshot or video | Browser DevTools screenshot |
| Configuration | Build logs showing success | `npm run build`, `cargo build` |
| Deployment | CI link or deployment logs | GitHub Actions URL, kubectl logs |
| API changes | API test output or curl result | `curl -X POST ...` |
| Data migration | Row count or sample query | `SELECT COUNT(*) FROM ...` |
| Performance fix | Benchmark comparison (before/after) | `hyperfine`, `go test -bench` |

## Enforcement Mechanism

### TodoWrite Integration

When marking a todo as `completed`:
1. **BEFORE** changing status to `completed`, gather fresh evidence
2. **IN THE SAME MESSAGE** that marks it complete, show the evidence
3. **NEVER** mark complete in one message, then show evidence later

**Violation Pattern:**
```
Message 1: "Fixed the validator. Marking todo complete."
Message 2: "Here's the test output..."
```

**Correct Pattern:**
```
Message 1:
"Fixed the validator. Test output:
✓ should validate email (5ms)
✓ should reject invalid format (3ms)

Marking todo complete."
```

### Rationalization Detection

Common rationalizations and their counters:

| Rationalization | Counter |
|-----------------|---------|
| "It's a trivial change" | Trivial = fast to verify, not skip |
| "I tested this before" | Code changed since then, verify again |
| "Same pattern as working code" | Different context = different bugs |
| "Just fixing a typo" | Typos can break builds, verify |
| "Only changed comments" | Comments can break doc generation |
| "Can't test without production data" | Use test fixtures or staging environment |

## Examples

### Example 1: React Component Fix (TypeScript)

**Scenario:** Fixed useState initialization bug

**Wrong Completion:**
```
Fixed the counter initialization bug. Should be good now!
```

**Correct Completion:**
```
Fixed the counter initialization bug in Counter.tsx line 8:

git diff:
-  const [count, setCount] = useState();
+  const [count, setCount] = useState<number>(0);

Test output:
 PASS  src/Counter.test.tsx
   Counter component
     ✓ renders with initial value 0 (23ms)
     ✓ increments on button click (15ms)

Build check:
✓ Type checking passed (1.2s)
✓ No lint errors
```

### Example 2: Python API Endpoint (FastAPI)

**Scenario:** Fixed validation error in POST /users

**Wrong Completion:**
```
Added email validation to the users endpoint. Tested locally, works fine.
```

**Correct Completion:**
```
Added email validation to the users endpoint in api/users.py line 45:

git diff:
 @app.post("/users")
 def create_user(user: UserCreate):
+    if not re.match(r"[^@]+@[^@]+\.[^@]+", user.email):
+        raise HTTPException(400, "Invalid email format")
     return db.create_user(user)

Test output:
test_create_user.py::test_valid_email PASSED
test_create_user.py::test_invalid_email_rejected PASSED
test_create_user.py::test_missing_at_sign PASSED

Manual curl test:
$ curl -X POST http://localhost:8000/users -d '{"email":"invalid"}'
{"detail":"Invalid email format"}
```

### Example 3: Go Configuration Change

**Scenario:** Updated Docker build configuration

**Wrong Completion:**
```
Updated the Dockerfile to use Go 1.22. Build should work now.
```

**Correct Completion:**
```
Updated the Dockerfile to use Go 1.22:

git diff:
-FROM golang:1.21-alpine
+FROM golang:1.22-alpine

Build verification:
$ docker build -t myapp:test .
[+] Building 45.3s (12/12) FINISHED
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 234B
 => [1/6] FROM golang:1.22-alpine
 => [2/6] WORKDIR /app
 => [3/6] COPY go.mod go.sum ./
 => [4/6] RUN go mod download
 => [5/6] COPY . .
 => [6/6] RUN go build -o /app/server
 => exporting to image
 => => writing image sha256:abc123...

Run verification:
$ docker run myapp:test --version
v1.0.0 (go1.22.0)
```

## Integration with Other Skills

- **test-driven-development:** TDD provides the tests you'll use as verification evidence
- **systematic-debugging:** Debug process ends with fix verification (this skill)
- **agent-coordination-discipline:** Agents must return verification evidence, not just claims
- **quality-gates:** Quality gate checks are verification evidence types

## Quick Reference

**Before marking ANY task complete:**

1. ✅ Run relevant tests → capture output
2. ✅ Check file changes → show git diff or grep
3. ✅ Verify build → show build logs
4. ✅ For UI changes → take screenshot
5. ✅ For deployments → link CI run
6. ✅ Show evidence in completion message
7. ✅ Only then mark todo as completed

**Remember:** If you can't show fresh evidence, the task isn't complete yet.

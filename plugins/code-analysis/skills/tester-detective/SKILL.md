---
name: tester-detective
description: "⚡ PRIMARY TOOL for: 'what's tested', 'find test coverage', 'audit test quality', 'missing tests', 'edge cases', 'test patterns'. REPLACES grep/glob for test analysis. Uses claudemem v0.2.0 INDEXED MEMORY with LLM enrichment. GREP/FIND/GLOB ARE FORBIDDEN."
allowed-tools: Bash, Task, Read, AskUserQuestion
---

# ⛔⛔⛔ CRITICAL: INDEXED MEMORY ONLY ⛔⛔⛔

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🧠 THIS SKILL USES INDEXED MEMORY (claudemem v0.2.0) EXCLUSIVELY           ║
║                                                                              ║
║   ❌ GREP IS FORBIDDEN                                                       ║
║   ❌ FIND IS FORBIDDEN                                                       ║
║   ❌ GLOB IS FORBIDDEN                                                       ║
║   ❌ Grep tool IS FORBIDDEN                                                  ║
║   ❌ Glob tool IS FORBIDDEN                                                  ║
║                                                                              ║
║   ✅ claudemem search "query" --use-case navigation IS THE ONLY WAY         ║
║                                                                              ║
║   ⭐ v0.2.0: Leverages symbol_summary for understanding test purpose        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

# Tester Detective Skill

**Version:** 2.0.0
**Role:** QA Engineer / Test Specialist
**Purpose:** Test coverage investigation using INDEXED MEMORY with LLM enrichment

## Role Context

You are investigating this codebase as a **QA Engineer**. Your focus is on:
- **Test coverage** - What is tested vs. untested
- **Edge cases** - Boundary conditions, error paths
- **Testing patterns** - Mocks, fixtures, assertions
- **Test quality** - Meaningful assertions, isolation
- **Testability** - Code that's hard to test (tight coupling, side effects)

## Claudemem v0.2.0 Integration

<skill name="claudemem" version="0.2.0">
<purpose>
Semantic code search using vector embeddings WITH LLM enrichment.
Finds code by MEANING AND PURPOSE, not just text matching.
Use INSTEAD of grep/find for: test discovery, coverage analysis, edge case identification.
</purpose>

<document_types>
- **code_chunk**: Raw AST code (functions, classes, methods)
- **file_summary**: LLM-generated file purpose, exports, patterns
- **symbol_summary** ⭐KEY: LLM-generated docs showing what each test verifies
</document_types>

<search_mode>
ALWAYS use --use-case navigation for agent tasks.
Weights: symbol_summary (35%) + file_summary (30%) + code_chunk (20%)
This prioritizes TEST PURPOSE understanding over raw code.
</search_mode>

<tools>
CLI:
  claudemem index --enrich            # Index with LLM enrichment
  claudemem enrich                     # Run enrichment on existing index
  claudemem search "query" --use-case navigation  # Agent-optimized search
  claudemem status                     # Check index AND enrichment status
  claudemem ai tester                  # Get tester-focused instructions
</tools>
</skill>

## Why symbol_summary is Perfect for Testing

The `symbol_summary` document type contains:
- **Summary**: "Tests user registration with valid data succeeds"
- **Parameters**: What test inputs are used
- **Side effects**: "Mocks database, verifies email sent"
- **Usage context**: "Integration test for registration flow"

This tells you exactly WHAT each test verifies.

## Tester-Focused Search Patterns (v0.2.0)

### Finding Existing Tests (symbol_summary shows what they test)
```bash
# Find test files for a feature
claudemem search "test spec describe it user authentication" --use-case navigation

# Find integration tests
claudemem search "integration test API endpoint database" --use-case navigation

# Find unit tests
claudemem search "unit test mock stub isolated function" --use-case navigation

# Find E2E tests
claudemem search "end to end test browser playwright cypress" --use-case navigation
```

### Test Infrastructure
```bash
# Find test setup/teardown
claudemem search "beforeEach afterEach setup teardown test" --use-case navigation

# Find test fixtures
claudemem search "fixture test data factory mock" --use-case navigation

# Find mocking patterns
claudemem search "mock jest vi spyOn stub fake" --use-case navigation

# Find test utilities
claudemem search "test helper utility render query" --use-case navigation
```

### Coverage Analysis (symbol_summary shows what's tested)
```bash
# Find tested functions (have corresponding tests)
claudemem search "describe test should [function name]" --use-case navigation

# Find assertion patterns
claudemem search "expect assert toEqual toBe throw" --use-case navigation

# Find coverage configuration
claudemem search "coverage threshold jest vitest" --use-case navigation
```

### Edge Case Discovery
```bash
# Find error handling tests
claudemem search "test throw error exception invalid" --use-case navigation

# Find boundary condition tests
claudemem search "test edge case boundary null undefined empty" --use-case navigation

# Find timeout/async tests
claudemem search "test async timeout promise reject" --use-case navigation

# Find race condition tests
claudemem search "test concurrent race condition parallel" --use-case navigation
```

### Testability Issues
```bash
# Find hard-to-mock dependencies
claudemem search "new Date Math.random process.env global" --use-case navigation

# Find side effects
claudemem search "database write file system external API" --use-case navigation

# Find tight coupling
claudemem search "new SomeClass direct instantiation" --use-case navigation
```

## Workflow: Test Coverage Analysis (v0.2.0)

### Phase 0: Verify Enrichment Status ⭐CRITICAL

```bash
# Check if enriched (must have symbol_summary > 0)
claudemem status

# If symbol_summary = 0, run enrichment first
claudemem enrich
```

**Test analysis relies heavily on symbol_summary to understand WHAT tests verify.**

### Phase 1: Map Test Infrastructure
```bash
# 1. Ensure enriched index exists
claudemem status || claudemem index --enrich

# 2. Find test configuration
claudemem search "jest vitest mocha test config setup" -n 5 --use-case navigation

# 3. Find test utilities
claudemem search "test helper utility factory builder" -n 10 --use-case navigation

# 4. Find mocking setup
claudemem search "mock module setup vi.mock jest.mock" -n 10 --use-case navigation
```

### Phase 2: Analyze Feature Coverage
```bash
# For a specific feature, find:

# Implementation (symbol_summary shows what it does)
claudemem search "[feature] service implementation" -n 5 --use-case navigation

# Corresponding tests (symbol_summary shows what's tested)
claudemem search "describe test [feature]" -n 10 --use-case navigation

# Edge case tests
claudemem search "test [feature] error invalid edge" -n 5 --use-case navigation
```

### Phase 3: Find Coverage Gaps
```bash
# Find complex functions (symbol_summary shows complexity)
claudemem search "complex logic conditional if else switch" -n 10 --use-case navigation

# Find error paths
claudemem search "throw error reject catch" -n 10 --use-case navigation

# Check for error path tests
claudemem search "test error throw expect reject" -n 10 --use-case navigation
```

### Phase 4: Identify Testability Issues
```bash
# Find code that's hard to test
claudemem search "global state singleton shared mutable" -n 5 --use-case navigation
claudemem search "new dependency tight coupling" -n 5 --use-case navigation
claudemem search "setTimeout setInterval timer" -n 5 --use-case navigation
```

## Output Format: Test Coverage Report

### 1. Test Infrastructure Summary
```
┌─────────────────────────────────────────────────────────┐
│                   TEST INFRASTRUCTURE                    │
├─────────────────────────────────────────────────────────┤
│  Framework: Vitest 2.x                                  │
│  Test Files: 156 files (*.spec.ts, *.test.ts)          │
│  Test Utils: src/__tests__/utils/                       │
│  Fixtures: src/__tests__/fixtures/                      │
│  Mocking: vi.mock, MSW for API                          │
│  Search Method: claudemem v0.2.0 (enriched)            │
│  Enrichment: ✅ symbol_summary available               │
└─────────────────────────────────────────────────────────┘
```

### 2. Coverage by Feature (from symbol_summary)
```
| Feature           | Unit | Integration | E2E | Overall |
|-------------------|------|-------------|-----|---------|
| Authentication    | ✅ 85%| ✅ 90%      | ✅  | 🟢 High |
| User Management   | ✅ 70%| ⚠️ 40%      | ❌  | 🟡 Medium|
| Payment Processing| ✅ 95%| ✅ 80%      | ✅  | 🟢 High |
| File Upload       | ⚠️ 30%| ❌ 0%       | ❌  | 🔴 Low  |
| Notifications     | ✅ 60%| ⚠️ 20%      | ❌  | 🟡 Medium|
```

### 3. Untested Code Paths (cross-reference implementation vs tests)
```
🔴 HIGH PRIORITY - No Tests Found:
   └── src/services/payment/refund.ts:45 refundPayment()
       └── symbol_summary: "Processes refund with Stripe API"
   └── src/services/notification/sms.ts:23 sendSMS()
       └── symbol_summary: "Sends SMS via Twilio"
   └── src/utils/encryption.ts:12 encryptPII()
       └── symbol_summary: "Encrypts PII using AES-256"

⚠️ MEDIUM PRIORITY - Partial Coverage:
   └── src/services/user/profile.ts - Missing error cases
   └── src/controllers/admin.ts - Missing auth checks

📝 LOW PRIORITY - Edge Cases Missing:
   └── Empty array handling in listUsers()
   └── Concurrent request handling in checkout()
```

### 4. Test Quality Issues (from symbol_summary analysis)
```
⚠️ Test Smells Found:

1. No assertions (src/__tests__/user.test.ts:45)
   └── symbol_summary: "Calls function but no expect statements"

2. Snapshot overuse (src/__tests__/ui/*.test.tsx)
   └── 47 snapshot tests, consider more specific assertions

3. Mocking too much (src/__tests__/payment.test.ts)
   └── symbol_summary: "Mocks internal implementation details"

4. Flaky test (src/__tests__/async.test.ts:23)
   └── symbol_summary: "Uses setTimeout instead of proper async"
```

## Integration with Detective Agent

When using the codebase-detective agent with this skill:

```typescript
Task({
  subagent_type: "code-analysis:detective",
  description: "Test coverage investigation",
  prompt: `
## Tester Investigation (v0.2.0)

Use claudemem with testing-focused queries:
1. First run: claudemem status (verify enrichment)
2. If symbol_summary = 0, run: claudemem enrich
3. Search with: --use-case navigation

Focus on:
1. Map the test infrastructure (framework, utilities, mocks)
2. Analyze coverage for [feature/module] using symbol_summary
3. Find untested code paths
4. Identify missing edge case tests
5. Spot testability issues

Leverage symbol_summary to understand WHAT each test verifies.

Generate a Test Coverage Report with:
- Test infrastructure summary
- Coverage by feature matrix
- Untested code paths (prioritized, with function summaries)
- Missing edge cases
- Testability improvement recommendations
  `
})
```

## Best Practices for Test Investigation (v0.2.0)

1. **Verify enrichment first**
   - Run `claudemem status`
   - symbol_summary tells you what tests verify
   - Without enrichment, you only see test code (not purpose)

2. **Use symbol_summary to match tests with code**
   - Implementation symbol_summary: "Creates user with validation"
   - Test symbol_summary: "Verifies user creation with valid data"
   - Gap: No test with "Verifies user creation fails with invalid email"

3. **Prioritize by risk**
   - Focus on business-critical paths first
   - Error handling in payments, auth > minor features

4. **Look for test smells in symbol_summary**
   - No assertions: summary doesn't mention "verifies" or "expects"
   - Over-mocked: summary mentions mocking implementation details
   - Flaky: summary mentions timing or retry

5. **Check edge cases systematically**
   - Null/undefined inputs
   - Empty collections
   - Boundary values
   - Error conditions
   - Concurrent operations

## Notes

- Requires claudemem CLI v0.2.0+ installed and configured
- **Test analysis relies heavily on symbol_summary**
- Without enrichment, results show only code_chunk (no test purpose)
- Works best on indexed + enriched codebases
- Focuses on test quality over implementation
- Pairs well with developer-detective for understanding what to test

---

**Maintained by:** MadAppGang
**Plugin:** code-analysis v2.4.0
**Last Updated:** December 2025

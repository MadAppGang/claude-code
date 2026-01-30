---
description: Full-cycle API implementation with multi-agent orchestration, architecture planning, implementation, testing, and quality gates
allowed-tools: Task, AskUserQuestion, Bash, Read, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep
---

## Mission

Orchestrate a complete API feature implementation workflow using specialized agents with built-in quality gates and feedback loops. This command manages the entire lifecycle from API architecture planning through implementation, code review, testing, user approval, and project cleanup.

## CRITICAL: Orchestrator Constraints

**You are an ORCHESTRATOR, not an IMPLEMENTER.**

**✅ You MUST:**
- Use Task tool to delegate ALL implementation work to agents
- Use Bash to run git commands (status, diff, log)
- Use Read/Glob/Grep to understand context
- Use Tasks to track workflow progress
- Use AskUserQuestion for user approval gates
- Coordinate agent workflows and feedback loops

**❌ You MUST NOT:**
- Write or edit ANY code files directly (no Write, no Edit tools)
- Implement features yourself
- Fix bugs yourself
- Create new files yourself
- Modify existing code yourself
- "Quickly fix" small issues - always delegate to backend-developer

**Delegation Rules:**
- ALL architecture planning → api-architect agent
- ALL code changes → backend-developer agent
- ALL code reviews → senior-code-reviewer agent (if available from frontend plugin)
- ALL testing → backend-developer agent (or test-architect if available)
- If you find yourself about to use Write or Edit tools, STOP and delegate to the appropriate agent instead.

## Feature Request

$ARGUMENTS

## Multi-Agent Orchestration Workflow

### PRELIMINARY: Check for Code Analysis Tools (Recommended)

**Before starting implementation, check if the code-analysis plugin is available:**

Try to detect if `code-analysis` plugin is installed by checking if codebase-detective agent or semantic-code-search tools are available.

**If code-analysis plugin is NOT available:**

Inform the user with this message:

```
💡 Recommendation: Install Code Analysis Plugin

For best results investigating existing code patterns, services, and architecture,
we recommend installing the code-analysis plugin.

Benefits:
- 🔍 Semantic code search (find services/repositories by functionality)
- 🕵️ Codebase detective agent (understand existing patterns)
- 📊 40% faster codebase investigation
- 🎯 Better understanding of where to integrate new features

Installation (2 commands):
/plugin marketplace add MadAppGang/claude-code
/plugin install code-analysis@mag-claude-plugins

Repository: https://github.com/MadAppGang/claude-code

You can continue without it, but investigation of existing code will be less efficient.
```

**If code-analysis plugin IS available:**

Great! You can use the codebase-detective agent and semantic-code-search skill during
architecture planning to investigate existing patterns and find the best integration points.

**Then proceed with the implementation workflow regardless of plugin availability.**

---

### STEP 0: Initialize Global Workflow Todo List (MANDATORY FIRST STEP)

**BEFORE** starting any phase, you MUST create a global workflow todo list using Tasks to track the entire implementation lifecycle:

```
TaskCreate with the following items:
- content: "PHASE 1: Launch api-architect for API architecture planning"
  status: "in_progress"
  activeForm: "PHASE 1: Launching api-architect for API architecture planning"
- content: "PHASE 1: User approval gate - wait for plan approval"
  status: "pending"
  activeForm: "PHASE 1: Waiting for user approval of architecture plan"
- content: "PHASE 2: Launch backend-developer for implementation"
  status: "pending"
  activeForm: "PHASE 2: Launching backend-developer for implementation"
- content: "PHASE 3: Run quality checks (format, lint, typecheck)"
  status: "pending"
  activeForm: "PHASE 3: Running quality checks"
- content: "PHASE 4: Run tests (unit and integration)"
  status: "pending"
  activeForm: "PHASE 4: Running tests"
- content: "PHASE 5: Launch code review (if available)"
  status: "pending"
  activeForm: "PHASE 5: Launching code review"
- content: "PHASE 6: User acceptance - present implementation for approval"
  status: "pending"
  activeForm: "PHASE 6: Presenting implementation for user approval"
- content: "PHASE 7: Finalize implementation"
  status: "pending"
  activeForm: "PHASE 7: Finalizing implementation"
```

**Update this todo list** as you progress through phases:
- Mark items as "completed" immediately after finishing each phase
- Mark the next phase as "in_progress" before starting it
- Add new items if additional steps are discovered

---

### PHASE 1: Architecture Planning with api-architect

**Objective:** Create comprehensive API architecture plan before implementation.

**Steps:**

1. **Gather Context**
   - Read existing API structure (if any)
   - Review database schema (Prisma schema)
   - Check for existing patterns and conventions

2. **Launch api-architect Agent**
   ```
   Use Task tool with agent: api-architect
   Prompt: "Create a comprehensive API architecture plan for: [feature description]

   Context:
   - Existing API patterns: [summarize from codebase]
   - Database schema: [summarize existing models]
   - Authentication: [current auth strategy]

   Please design:
   1. Database schema (Prisma models)
   2. API endpoints (routes, methods, request/response contracts)
   3. Authentication & authorization requirements
   4. Validation schemas (Zod)
   5. Error handling strategy
   6. Implementation roadmap

   Save documentation to ai-docs/ for reference during implementation."
   ```

3. **Review Architecture Plan**
   - Agent will create comprehensive plan in ai-docs/
   - Review database schema design
   - Review API endpoint specifications
   - Review implementation phases

4. **User Approval Gate**
   ```
   Use AskUserQuestion:
   - Question: "The api-architect has created a comprehensive plan (see ai-docs/).
     Do you approve this architecture, or should we make adjustments?"
   - Options:
     * "Approve and proceed with implementation"
     * "Request changes to the plan"
     * "Cancel implementation"
   ```

   **If "Request changes":**
   - Get user feedback
   - Re-launch api-architect with adjusted requirements
   - Return to approval gate

   **If "Cancel":**
   - Stop workflow
   - Clean up any created files

   **If "Approve":**
   - Mark PHASE 1 as completed
   - Proceed to PHASE 2

---

### PHASE 2: Implementation with backend-developer

**Objective:** Implement the API features according to the approved architecture plan.

**Steps:**

1. **Prepare Implementation Context**
   - Read architecture plan from ai-docs/
   - Prepare database schema (Prisma)
   - Identify implementation phases from plan

2. **Launch backend-developer Agent**
   ```
   Use Task tool with agent: backend-developer
   Prompt: "Implement the API feature according to the architecture plan in ai-docs/[plan-file].

   Implementation checklist:
   1. Update Prisma schema (if database changes needed)
   2. Run prisma generate and create migration
   3. Create Zod validation schemas (src/schemas/)
   4. Implement repository layer (src/database/repositories/)
   5. Implement service layer (src/services/)
   6. Implement controller layer (src/controllers/)
   7. Create routes (src/routes/)
   8. Add authentication/authorization middleware (if needed)
   9. Write unit tests (tests/unit/)
   10. Write integration tests (tests/integration/)

   Follow these principles:
   - Layered architecture: routes → controllers → services → repositories
   - Security: validate all inputs, hash passwords, use JWT
   - Error handling: use custom error classes
   - Type safety: strict TypeScript, Zod schemas
   - Testing: comprehensive unit and integration tests

   Run quality checks (format, lint, typecheck, tests) before completing."
   ```

3. **Monitor Implementation**
   - backend-developer will work through implementation phases
   - Each layer will be created following best practices
   - Quality checks will be run automatically

4. **Review Implementation Results**
   - Check that all files were created
   - Verify layered architecture was followed
   - Confirm quality checks passed

**Mark PHASE 2 as completed, proceed to PHASE 3**

---

### PHASE 3: Quality Checks

**Objective:** Ensure code quality through automated checks.

**Steps:**

1. **Run Biome Format**
   ```bash
   bun run format
   ```
   - Verify no formatting issues
   - All code should be consistently formatted

2. **Run Biome Lint**
   ```bash
   bun run lint
   ```
   - Verify no linting errors or warnings
   - If issues found, delegate fixes to backend-developer

3. **Run TypeScript Type Check**
   ```bash
   bun run typecheck
   ```
   - Verify no type errors
   - If issues found, delegate fixes to backend-developer

**If any check fails:**
- Re-launch backend-developer to fix issues
- Re-run quality checks
- Do NOT proceed until all checks pass

**Mark PHASE 3 as completed, proceed to PHASE 4**

---

### PHASE 4: Testing

**Objective:** Run tests to verify functionality.

**Steps:**

1. **Run Unit Tests**
   ```bash
   bun test tests/unit
   ```
   - Verify all unit tests pass
   - Check test coverage (if configured)

2. **Run Integration Tests**
   ```bash
   bun test tests/integration
   ```
   - Verify all integration tests pass
   - Ensure API endpoints work correctly

3. **Run All Tests**
   ```bash
   bun test
   ```
   - Verify complete test suite passes

**If any test fails:**
- Re-launch backend-developer to investigate and fix
- Re-run tests
- Do NOT proceed until all tests pass

**Mark PHASE 4 as completed, proceed to PHASE 5**

---

### PHASE 5: Code Review (Optional)

**Objective:** Get expert code review if review agents are available.

**Steps:**

1. **Check for Review Agents**
   - Check if senior-code-reviewer agent is available (from frontend plugin)
   - Check if codex-reviewer agent is available (from frontend plugin)

2. **Launch Code Review (if available)**
   ```
   Use Task tool with agent: senior-code-reviewer (or codex-reviewer)
   Prompt: "Review the backend API implementation focusing on:
   1. Security (authentication, authorization, validation)
   2. Architecture (layered design, separation of concerns)
   3. Error handling (custom errors, global handler)
   4. Type safety (TypeScript strict mode, Zod schemas)
   5. Testing (coverage, test quality)
   6. Performance (database queries, caching)
   7. Best practices (Bun, Hono, Prisma patterns)

   Provide actionable feedback for improvements."
   ```

3. **Review Feedback**
   - Read review agent's feedback
   - Identify critical vs. optional improvements

4. **Apply Critical Improvements**
   - If critical issues found, re-launch backend-developer to fix
   - Re-run quality checks and tests

**Mark PHASE 5 as completed, proceed to PHASE 6**

---

### PHASE 6: User Acceptance

**Objective:** Present implementation to user for final approval.

**Steps:**

1. **Prepare Summary**
   - List all files created/modified
   - Summarize implementation (what was built)
   - Highlight key features
   - Confirm all quality checks passed
   - Confirm all tests passed

2. **Git Status Check**
   ```bash
   git status
   git diff
   ```
   - Show user what changed
   - Provide context for review

3. **User Approval Gate**
   ```
   Use AskUserQuestion:
   - Question: "The API implementation is complete. All quality checks and tests passed.

     Summary:
     [List key features implemented]

     Files modified: [count]
     Tests: [passing]
     Quality checks: [all passed]

     What would you like to do next?"
   - Options:
     * "Accept and finalize"
     * "Request changes or improvements"
     * "Manual testing needed - pause here"
   ```

   **If "Request changes":**
   - Get user feedback on specific changes
   - Re-launch backend-developer with change requests
   - Re-run quality checks and tests
   - Return to approval gate

   **If "Manual testing needed":**
   - Provide instructions for manual testing
   - Pause workflow
   - Wait for user to continue

   **If "Accept":**
   - Mark PHASE 6 as completed
   - Proceed to PHASE 7

---

### PHASE 7: Finalization

**Objective:** Finalize implementation and prepare for deployment.

**Steps:**

1. **Final Verification**
   - Confirm all quality checks still pass
   - Confirm all tests still pass
   - Review git status

2. **Documentation Check**
   - Verify API documentation is up to date
   - Check that ai-docs/ contains architecture plan
   - Ensure README or API docs reflect new endpoints

3. **Deployment Readiness** (Optional)
   ```
   Ask user: "Would you like guidance on deploying this API to production?"

   If yes, provide:
   - Docker build command
   - Prisma migration deployment command
   - Environment variables needed
   - AWS ECS deployment steps (if applicable)
   ```

4. **Completion Summary**
   Present final summary:
   ```
   ✅ API Implementation Complete

   What was built:
   [List features]

   Files created/modified:
   [List key files]

   Database changes:
   [List Prisma migrations]

   Tests:
   Unit: [count] passing
   Integration: [count] passing

   Quality:
   ✅ Formatted (Biome)
   ✅ Linted (Biome)
   ✅ Type-checked (TypeScript)
   ✅ Tested (Bun)

   Next steps:
   - Review and commit changes: git add . && git commit
   - Create pull request (if using git workflow)
   - Deploy to staging/production
   - Update API documentation
   ```

**Mark PHASE 7 as completed**

---

## Error Recovery

If any phase fails:

1. **Identify the issue**
   - Read error messages
   - Check logs
   - Review what went wrong

2. **Delegate fix to appropriate agent**
   - Implementation bugs → backend-developer
   - Architecture issues → api-architect
   - Test failures → backend-developer

3. **Re-run affected phases**
   - After fix, re-run quality checks
   - Re-run tests
   - Ensure everything passes before proceeding

4. **Never skip phases**
   - Each phase builds on previous phases
   - Skipping phases risks incomplete or broken implementation

## Success Criteria

Implementation is complete when:

- ✅ Architecture plan approved by user
- ✅ All code implemented following layered architecture
- ✅ Database schema updated (if needed) and migrated
- ✅ All inputs validated with Zod schemas
- ✅ Authentication/authorization implemented correctly
- ✅ Custom error handling in place
- ✅ All quality checks pass (format, lint, typecheck)
- ✅ All tests pass (unit + integration)
- ✅ Code review completed (if available)
- ✅ User acceptance obtained
- ✅ Documentation updated

## Remember

You are the **orchestrator**, not the implementer. Your job is to:
- Coordinate specialized agents
- Enforce quality gates
- Manage user approvals
- Ensure systematic completion
- Never write code yourself - always delegate

The result should be production-ready, well-tested, secure API code that follows all best practices.

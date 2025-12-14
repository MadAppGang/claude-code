---
name: developer-detective
description: "⚡ PRIMARY TOOL for: 'how does X work', 'find implementation of', 'trace data flow', 'where is X defined', 'audit integrations', 'find all usages'. REPLACES grep/glob for code understanding. Uses claudemem v0.2.0 INDEXED MEMORY with LLM enrichment. GREP/FIND/GLOB ARE FORBIDDEN."
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
║   ⭐ v0.2.0: Leverages symbol_summary for function behavior discovery       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

# Developer Detective Skill

**Version:** 2.0.0
**Role:** Software Developer
**Purpose:** Implementation investigation using INDEXED MEMORY with LLM enrichment

## Role Context

You are investigating this codebase as a **Software Developer**. Your focus is on:
- **Implementation details** - How code actually works
- **Data flow** - How data moves through the system
- **Function signatures** - APIs, parameters, return types
- **Error handling** - How errors are caught and propagated
- **Side effects** - Database writes, API calls, file operations

## Claudemem v0.2.0 Integration

<skill name="claudemem" version="0.2.0">
<purpose>
Semantic code search using vector embeddings WITH LLM enrichment.
Finds code by MEANING AND BEHAVIOR, not just text matching.
Use INSTEAD of grep/find for: implementation discovery, API exploration, data flow tracing.
</purpose>

<document_types>
- **code_chunk**: Raw AST code (functions, classes, methods)
- **file_summary**: LLM-generated file purpose, exports, patterns
- **symbol_summary** ⭐KEY: LLM-generated function docs with params, returns, side effects
</document_types>

<search_mode>
ALWAYS use --use-case navigation for agent tasks.
Weights: symbol_summary (35%) + file_summary (30%) + code_chunk (20%)
This prioritizes BEHAVIOR understanding over raw code.
</search_mode>

<tools>
CLI:
  claudemem index --enrich            # Index with LLM enrichment
  claudemem enrich                     # Run enrichment on existing index
  claudemem search "query" --use-case navigation  # Agent-optimized search
  claudemem status                     # Check index AND enrichment status
  claudemem ai developer               # Get developer-focused instructions

MCP (Claude Code integration):
  search_code        query, limit?, language?, autoIndex?
  index_codebase     path?, force?, model?
  get_status         path?
</tools>
</skill>

## Why symbol_summary is Perfect for Developers

The `symbol_summary` document type contains:
- **Summary**: "Creates a new user with validation and sends welcome email"
- **Parameters**: name, description for each param
- **Returns**: What the function returns
- **Side effects**: "Writes to database, sends email, emits event"
- **Usage context**: "Called from user registration endpoint"

This is exactly what developers need to understand function behavior.

## Developer-Focused Search Patterns (v0.2.0)

### Finding Implementations (Leveraging symbol_summary)
```bash
# Find function/method implementation
claudemem search "function implementation create user account" --use-case navigation

# Find class implementation
claudemem search "class UserService implementation methods" --use-case navigation

# Find interface implementations
claudemem search "implements interface repository save" --use-case navigation

# Find specific logic
claudemem search "calculate price discount percentage logic" --use-case navigation
```

### Data Flow Tracing (symbol_summary shows side effects)
```bash
# Find where data is created
claudemem search "create new user object entity instantiation" --use-case navigation

# Find where data is transformed
claudemem search "map transform convert request to response" --use-case navigation

# Find where data is persisted
claudemem search "save insert update database persist" --use-case navigation

# Find where data is retrieved
claudemem search "find get fetch load query database" --use-case navigation
```

### API and Endpoint Discovery (symbol_summary shows params/returns)
```bash
# Find HTTP endpoints
claudemem search "POST endpoint handler create resource" --use-case navigation

# Find GraphQL resolvers
claudemem search "resolver mutation query GraphQL" --use-case navigation

# Find WebSocket handlers
claudemem search "websocket socket message handler event" --use-case navigation

# Find middleware processing
claudemem search "middleware request processing next" --use-case navigation
```

### Error Handling (symbol_summary shows error paths)
```bash
# Find error handling patterns
claudemem search "try catch error handling exception" --use-case navigation

# Find custom error classes
claudemem search "class extends Error custom exception" --use-case navigation

# Find error responses
claudemem search "error response status code message" --use-case navigation

# Find validation errors
claudemem search "validation error invalid input check" --use-case navigation
```

### Side Effects (symbol_summary explicitly lists these)
```bash
# Find database operations
claudemem search "transaction commit rollback database" --use-case navigation

# Find external API calls
claudemem search "fetch axios http external API call" --use-case navigation

# Find file operations
claudemem search "read write file filesystem" --use-case navigation

# Find event emissions
claudemem search "emit publish event notification" --use-case navigation
```

## Workflow: Implementation Discovery (v0.2.0)

### Phase 0: Verify Enrichment Status ⭐CRITICAL

```bash
# Check if enriched (must have symbol_summary > 0)
claudemem status

# If symbol_summary = 0, run enrichment first
claudemem enrich
```

**Implementation discovery relies heavily on symbol_summary. Without enrichment, you miss function behavior context.**

### Phase 1: Find Entry Point
```bash
# 1. Ensure enriched index exists
claudemem status || claudemem index --enrich

# 2. Find where the feature starts (file_summary helps locate files)
claudemem search "route handler endpoint [feature]" -n 5 --use-case navigation

# 3. Identify the controller/handler (symbol_summary shows what it does)
claudemem search "controller handle process [feature]" -n 5 --use-case navigation
```

### Phase 2: Trace the Flow
```bash
# Follow the call chain (symbol_summary shows what each function does)
claudemem search "[controller] calls [service]" -n 5 --use-case navigation
claudemem search "[service] method implementation" -n 10 --use-case navigation
claudemem search "[service] uses [repository]" -n 5 --use-case navigation
```

### Phase 3: Understand Data Transformations
```bash
# Find DTOs and mappings (symbol_summary shows params/returns)
claudemem search "DTO data transfer object [entity]" -n 5 --use-case navigation
claudemem search "mapper convert transform [entity]" -n 5 --use-case navigation
```

### Phase 4: Identify Side Effects
```bash
# Find what the code writes/affects (symbol_summary lists side effects)
claudemem search "save update delete [entity]" -n 5 --use-case navigation
claudemem search "emit event after [action]" -n 5 --use-case navigation
claudemem search "call external service API" -n 5 --use-case navigation
```

## Output Format: Implementation Report

### 1. Entry Point
```
📍 Entry Point: src/controllers/user.controller.ts:45
   └── POST /api/users → createUser()
   └── Validates: CreateUserDto
   └── Returns: UserResponse
   └── symbol_summary: "Creates user with validation, sends welcome email"
```

### 2. Call Chain (with symbol_summary context)
```
createUser() [controller]
   │  └── symbol_summary: "HTTP handler for user creation"
   │
   ├── validate(dto) [validator]
   │      └── symbol_summary: "Validates email format, password strength"
   │
   ├── userService.create(dto) [service]
   │      │  └── symbol_summary: "Orchestrates user creation with side effects"
   │      │
   │      ├── hashPassword(dto.password) [utility]
   │      │      └── symbol_summary: "Hashes password using bcrypt"
   │      │
   │      ├── userRepository.save(user) [repository]
   │      │      └── symbol_summary: "Persists user to database"
   │      │      └── side_effects: "Database INSERT"
   │      │
   │      └── eventEmitter.emit('user.created') [event]
   │             └── side_effects: "Triggers email, analytics"
   │
   └── return UserResponse.from(user) [mapper]
          └── symbol_summary: "Transforms User entity to response DTO"
```

### 3. Data Transformations
```
Input: CreateUserDto
   │
   └── { email, password, name }
          │
          ▼
Internal: User Entity
   │
   └── { id, email, passwordHash, name, createdAt }
          │
          ▼
Output: UserResponse
   │
   └── { id, email, name, createdAt }
```

### 4. Side Effects (from symbol_summary)
```
| Action              | Location                  | Effect                    |
|---------------------|---------------------------|---------------------------|
| Database INSERT     | userRepository.save:34    | users table               |
| Event emission      | userService.create:67     | 'user.created' event      |
| Email notification  | userCreatedHandler:12     | Welcome email sent        |
```

### 5. Error Paths
```
❌ Validation Error (400)
   └── Invalid email format → ValidationError
   └── Weak password → ValidationError

❌ Conflict Error (409)
   └── Email exists → DuplicateEmailError

❌ Server Error (500)
   └── Database failure → DatabaseError
   └── Email service down → EmailServiceError
```

## Integration with Detective Agent

When using the codebase-detective agent with this skill:

```typescript
Task({
  subagent_type: "code-analysis:detective",
  description: "Implementation investigation",
  prompt: `
## Developer Investigation (v0.2.0)

Use claudemem with implementation-focused queries:
1. First run: claudemem status (verify enrichment)
2. If symbol_summary = 0, run: claudemem enrich
3. Search with: --use-case navigation

Focus on:
1. Find where [feature] is implemented
2. Trace the data flow from input to output
3. Identify all side effects (database, APIs, events)
4. Map the error handling paths

Focus on HOW the code works, not just WHAT it does.
Leverage symbol_summary for function behavior context.

Generate an Implementation Report with:
- Entry point and function signatures
- Complete call chain (with symbol_summary context)
- Data transformations
- Side effects catalog (from symbol_summary)
- Error handling paths
  `
})
```

## Best Practices for Implementation Discovery (v0.2.0)

1. **Verify enrichment first**
   - Run `claudemem status`
   - symbol_summary count should be > 0
   - Without enrichment, you miss function behavior context

2. **Leverage symbol_summary for behavior**
   - symbol_summary contains params, returns, side effects
   - Perfect for understanding what functions DO
   - Use `--use-case navigation` to prioritize summaries

3. **Start at the boundary**
   - Find the API endpoint or UI handler first
   - Work inward from user-facing to internal

4. **Follow the data**
   - Track how input transforms to output
   - Note where data is validated, transformed, persisted

5. **Catalog side effects**
   - symbol_summary explicitly lists side effects
   - Database operations (CRUD)
   - External API calls
   - Event emissions
   - File operations

6. **Map error paths**
   - What can fail?
   - How are errors handled?
   - What does the user see?

## Practical Search Examples (v0.2.0)

### Example: "How does user login work?"
```bash
# 1. Find login endpoint (symbol_summary shows what it does)
claudemem search "login endpoint POST session authentication" --use-case navigation

# 2. Find auth service (symbol_summary shows behavior)
claudemem search "authenticate user password verification" --use-case navigation

# 3. Find token generation (symbol_summary shows side effects)
claudemem search "generate JWT token session create" --use-case navigation

# 4. Find password verification (symbol_summary shows params/returns)
claudemem search "compare hash password bcrypt verify" --use-case navigation
```

### Example: "Where is the payment processed?"
```bash
# 1. Find payment entry
claudemem search "payment process charge handler" --use-case navigation

# 2. Find payment service
claudemem search "PaymentService process charge create" --use-case navigation

# 3. Find Stripe/payment gateway integration
claudemem search "stripe charge payment gateway API" --use-case navigation

# 4. Find transaction recording
claudemem search "transaction record payment database save" --use-case navigation
```

### Example: "How are files uploaded?"
```bash
# 1. Find upload endpoint
claudemem search "file upload handler multipart form" --use-case navigation

# 2. Find storage logic
claudemem search "file storage S3 disk save" --use-case navigation

# 3. Find validation
claudemem search "file validation size type extension" --use-case navigation

# 4. Find metadata recording
claudemem search "file metadata record database save" --use-case navigation
```

## Notes

- Requires claudemem CLI v0.2.0+ installed and configured
- **Implementation discovery relies heavily on symbol_summary**
- Without enrichment, results show only code_chunk (no behavior context)
- Works best on indexed + enriched codebases
- Focuses on implementation over architecture
- Pairs well with architect-detective for structural context

---

**Maintained by:** MadAppGang
**Plugin:** code-analysis v2.4.0
**Last Updated:** December 2025

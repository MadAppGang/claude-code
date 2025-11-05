---
name: semantic-code-search
description: Expert guidance on using the claude-context MCP for semantic code search. Provides best practices for indexing large codebases, formulating effective search queries, optimizing performance, and integrating vector-based code retrieval into investigation workflows. Use when working with large codebases, optimizing token usage, or when grep/ripgrep searches are insufficient.
allowed-tools: Task
---

# Semantic Code Search Expert

This Skill provides comprehensive guidance on leveraging the claude-context MCP server for efficient, semantic code search across large codebases using hybrid vector retrieval (BM25 + dense embeddings).

## When to use this Skill

Claude should invoke this Skill when:

- Working with large codebases (10k+ lines of code)
- Need semantic understanding beyond keyword matching
- Want to optimize token consumption (reduce context usage by ~40%)
- Traditional grep/ripgrep searches return too many false positives
- Need to find functionality by concept rather than exact keywords
- User asks: "index this codebase", "search semantically", "find where authentication is handled"
- Before launching codebase-detective for large-scale investigations
- User mentions: "claude-context", "vector search", "semantic search", "index code"
- Token budget is constrained and need efficient code retrieval

## Core Capabilities of Claude-Context MCP

### Available Tools

1. **mcp__claude-context__index_codebase** - Index a directory with configurable splitter
2. **mcp__claude-context__search_code** - Natural language semantic search
3. **mcp__claude-context__clear_index** - Remove search indexes
4. **mcp__claude-context__get_indexing_status** - Check indexing progress

### Key Benefits

- **40% Token Reduction**: Retrieve only relevant code snippets vs loading entire directories
- **Semantic Understanding**: Find code by what it does, not just what it's named
- **Scale**: Handle millions of lines of code efficiently
- **Hybrid Search**: Combines BM25 keyword matching with dense vector embeddings
- **Multi-Round Avoidance**: Get relevant results in one query vs multiple grep attempts

## Instructions

### Phase 1: Decide If Claude-Context Is Appropriate

**Use Claude-Context When:**

✅ Codebase is large (10k+ lines)
✅ Need to find functionality by concept ("authentication logic", "payment processing")
✅ Working with unfamiliar codebase
✅ Token budget is limited
✅ Need to search across multiple languages/frameworks
✅ grep returns hundreds of matches and you need the most relevant ones
✅ Investigation requires understanding semantic relationships

**DON'T Use Claude-Context When:**

❌ Searching for exact string matches (use grep/ripgrep instead)
❌ Codebase is small (<5k lines) - overhead not worth it
❌ Looking for specific file names (use find/glob instead)
❌ Searching within 2-3 known files (use Read tool instead)
❌ Need regex pattern matching (use grep/ripgrep instead)
❌ Time-sensitive quick lookup (indexing takes time)

### Phase 2: Indexing Best Practices

#### 2.1 Initial Indexing

**Standard Indexing (Recommended):**

```typescript
mcp__claude-context__index_codebase with:
{
  path: "/absolute/path/to/project",
  splitter: "ast",  // Syntax-aware with automatic fallback
  force: false       // Don't re-index if already indexed
}
```

**Why AST Splitter?**
- Preserves code structure (functions, classes stay intact)
- Automatically falls back to character-based for non-code files
- Better semantic coherence in search results

**When to Use LangChain Splitter:**

```typescript
mcp__claude-context__index_codebase with:
{
  path: "/absolute/path/to/project",
  splitter: "langchain",  // Character-based splitting
  force: false
}
```

Use LangChain when:
- Codebase has many configuration/data files (JSON, YAML, XML)
- Documentation-heavy projects (Markdown, text files)
- AST parsing fails frequently for your languages

#### 2.2 Custom File Extensions

**Include Additional Extensions:**

```typescript
mcp__claude-context__index_codebase with:
{
  path: "/absolute/path/to/project",
  splitter: "ast",
  customExtensions: [".vue", ".svelte", ".astro", ".prisma", ".proto"]
}
```

**Common Custom Extensions by Framework:**

- Vue.js: `[".vue"]`
- Svelte: `[".svelte"]`
- Astro: `[".astro"]`
- Prisma: `[".prisma"]`
- GraphQL: `[".graphql", ".gql"]`
- Protocol Buffers: `[".proto"]`
- Terraform: `[".tf", ".tfvars"]`

#### 2.3 Ignore Patterns

**Default Ignored (Automatic):**
- `node_modules/`, `dist/`, `build/`, `.git/`
- `vendor/`, `target/`, `__pycache__/`

**Add Custom Ignore Patterns:**

```typescript
mcp__claude-context__index_codebase with:
{
  path: "/absolute/path/to/project",
  splitter: "ast",
  ignorePatterns: [
    "generated/**",      // Generated code
    "*.min.js",          // Minified files
    "*.bundle.js",       // Bundled files
    "test-data/**",      // Large test fixtures
    "docs/api/**",       // Auto-generated docs
    ".storybook/**",     // Storybook config
    "*.lock",            // Lock files
    "static/vendor/**"   // Third-party static files
  ]
}
```

**When to Use ignorePatterns:**
- Generated code clutters search results
- Large static assets slow indexing
- Third-party code isn't relevant to your investigation
- Test fixtures create noise

⚠️ **IMPORTANT**: Only use `ignorePatterns` when user explicitly requests custom filtering. Don't add it by default.

#### 2.4 Force Re-Indexing

**When to Force Re-Index:**

```typescript
mcp__claude-context__index_codebase with:
{
  path: "/absolute/path/to/project",
  splitter: "ast",
  force: true  // ⚠️ Overwrites existing index
}
```

Use `force: true` when:
- Codebase has changed significantly
- Previous indexing was interrupted
- Switching between splitters (ast ↔ langchain)
- Search results seem outdated
- Adding/removing custom extensions or ignore patterns

**Conflict Handling:**
If indexing is attempted on an already indexed path, ALWAYS:
1. Inform the user that the path is already indexed
2. Ask if they want to force re-index
3. Explain the trade-off (time vs freshness)
4. Only proceed with `force: true` if user confirms

#### 2.5 Monitor Indexing Progress

**Check Status:**

```typescript
mcp__claude-context__get_indexing_status with:
{
  path: "/absolute/path/to/project"
}
```

**Status Indicators:**
- `Indexing... (45%)` - Still processing
- `Indexed: 1,234 chunks from 567 files` - Complete
- `Not indexed` - Never indexed or cleared

**Best Practice:**
For large codebases (100k+ lines), check status every 30 seconds to provide user updates.

### Phase 3: Search Query Formulation

#### 3.1 Effective Query Patterns

**Concept-Based Queries (Best for Claude-Context):**

```typescript
// ✅ GOOD - Semantic concepts
search_code with query: "user authentication login flow with JWT tokens"
search_code with query: "database connection pooling initialization"
search_code with query: "error handling middleware for HTTP requests"
search_code with query: "WebSocket connection establishment and message handling"
search_code with query: "payment processing with Stripe integration"
```

**Why These Work:**
- Natural language describes WHAT the code does
- Multiple related concepts improve relevance ranking
- Captures intent, not just syntax

**Keyword Queries (Better for grep):**

```typescript
// ⚠️ OKAY - Works but not optimal
search_code with query: "authenticateUser function"
search_code with query: "UserRepository class"
```

**Why Less Optimal:**
- Assumes you know exact naming
- Misses semantically similar code with different names
- Better handled by grep if you know the exact term

**Avoid These:**

```typescript
// ❌ BAD - Too generic
search_code with query: "user"
search_code with query: "function"

// ❌ BAD - Too specific/technical
search_code with query: "express.Router().post('/api/users')"
search_code with query: "class UserService extends BaseService implements IUserService"

// ❌ BAD - Regex patterns (use grep instead)
search_code with query: "func.*Handler|HandlerFunc"
```

#### 3.2 Query Templates by Use Case

**Finding Authentication/Authorization:**
```typescript
"user login authentication with password validation and session creation"
"JWT token generation and validation middleware"
"OAuth2 authentication flow with Google provider"
"role-based access control permission checking"
"API key authentication verification"
```

**Finding Database Operations:**
```typescript
"user data persistence save to database"
"SQL query execution with prepared statements"
"MongoDB collection find and update operations"
"database transaction commit and rollback handling"
"ORM model definition for user entity"
```

**Finding API Endpoints:**
```typescript
"HTTP POST endpoint for creating new users"
"GraphQL resolver for user queries and mutations"
"REST API handler for updating user profile"
"WebSocket event handler for chat messages"
```

**Finding Business Logic:**
```typescript
"shopping cart calculation with tax and discounts"
"email notification sending after user registration"
"file upload processing with virus scanning"
"report generation with PDF export"
```

**Finding Configuration:**
```typescript
"environment variable configuration loading"
"database connection string setup"
"API rate limiting configuration"
"CORS policy definition for cross-origin requests"
```

**Finding Error Handling:**
```typescript
"global error handler for uncaught exceptions"
"validation error formatting for API responses"
"retry logic for failed HTTP requests"
"logging critical errors to monitoring service"
```

#### 3.3 Extension Filtering

**Filter by File Type:**

```typescript
// Only search TypeScript files
search_code with:
{
  path: "/absolute/path/to/project",
  query: "user authentication",
  extensionFilter: [".ts", ".tsx"]
}

// Only search Go files
search_code with:
{
  path: "/absolute/path/to/project",
  query: "HTTP handler implementation",
  extensionFilter: [".go"]
}

// Search configs only
search_code with:
{
  path: "/absolute/path/to/project",
  query: "database connection settings",
  extensionFilter: [".json", ".yaml", ".env"]
}
```

**When to Use Extension Filters:**
- Multi-language projects (frontend + backend)
- Avoid irrelevant results from wrong language
- Focus on specific layer (e.g., only database layer .go files)
- Search configuration vs code separately

#### 3.4 Result Limiting

**Default Limit:**
```typescript
search_code with:
{
  path: "/absolute/path/to/project",
  query: "authentication logic",
  limit: 10  // Default: 10 results
}
```

**Adjust Based on Use Case:**

```typescript
// Quick overview - fewest results
limit: 5

// Standard investigation - balanced
limit: 10  // Recommended default

// Comprehensive search - more results
limit: 20

// Exhaustive - find everything
limit: 50  // Maximum allowed
```

**Guideline:**
- Start with 10 results
- If too many false positives → refine query
- If missing relevant code → increase limit
- Never go below 5 (might miss important code)

### Phase 4: Performance Optimization Strategies

#### 4.1 Token Optimization

**Technique 1: Targeted Searches vs Full Directory Reads**

```typescript
// ❌ WASTEFUL - Loads entire directory into context
Read with path: "/project/src/**/*.ts"

// ✅ EFFICIENT - Returns only relevant snippets
search_code with:
{
  query: "user authentication flow",
  extensionFilter: [".ts"],
  limit: 10
}
```

**Token Savings:**
- Full directory: ~50,000 tokens
- Semantic search: ~5,000 tokens (10 snippets × ~500 tokens each)
- **Savings: 90%**

**Technique 2: Iterative Refinement**

```typescript
// First search - broad
search_code with query: "user authentication"
// Returns 10 results, review them

// Second search - refined based on findings
search_code with query: "JWT token generation in authentication service"
// Returns more specific results
```

**Why This Works:**
- First search gives context
- Second search uses insights from first search
- Total tokens < loading entire codebase

**Technique 3: Combine with Targeted Reads**

```typescript
// 1. Semantic search to find relevant files
search_code with query: "payment processing logic"
// Returns: src/services/paymentService.ts:45-89

// 2. Read specific file for full context
Read with path: "/project/src/services/paymentService.ts"
```

**Workflow:**
1. Search semantically → get file locations
2. Read specific files → get full context
3. Only load what you need

#### 4.2 Indexing Performance

**Optimize Indexing Time:**

1. **Index Once, Search Many**
   - Don't re-index unless code changed significantly
   - Check status before re-indexing

2. **Use Appropriate Splitter**
   - AST splitter: Slower indexing, better search results
   - LangChain splitter: Faster indexing, more general results

3. **Strategic Ignore Patterns**
   - Exclude generated code, vendor files
   - Reduces indexing time by 30-50%

4. **Incremental Approach**
   - For massive projects, index subdirectories separately
   - Example: Index `src/`, `lib/`, `api/` separately

**Indexing Time Expectations:**

| Codebase Size | Splitter | Expected Time |
|--------------|----------|---------------|
| 10k lines    | AST      | 30-60 sec     |
| 50k lines    | AST      | 2-5 min       |
| 100k lines   | AST      | 5-10 min      |
| 500k lines   | AST      | 20-30 min     |
| 10k lines    | LangChain| 15-30 sec     |
| 100k lines   | LangChain| 2-4 min       |

### Phase 5: Integration with Code Investigation Workflows

#### 5.1 With Codebase-Detective Agent

**Recommended Workflow:**

```markdown
# When user asks: "How does authentication work?"

## Step 1: Index (if not already indexed)
mcp__claude-context__index_codebase

## Step 2: Semantic Search
search_code with query: "user authentication login flow"
search_code with query: "password validation and hashing"
search_code with query: "session token generation and storage"

## Step 3: Launch Codebase-Detective
Task tool with subagent_type: "codebase-detective"
Provide detective with:
- Search results (file locations)
- User's question
- Specific files to investigate

## Step 4: Deep Dive
Detective uses semantic search results as starting points
Reads specific files
Traces code flow
Provides comprehensive analysis
```

**Why This Workflow?**
- Semantic search narrows scope (saves tokens)
- Detective focuses on relevant files (saves time)
- Combined approach: breadth (search) + depth (detective)

#### 5.2 Semantic Search → Grep → Read Pattern

**For Complex Investigations:**

```typescript
// 1. Semantic search for general area
search_code with query: "HTTP request middleware authentication"
// Results: 10 files in middleware/

// 2. Grep for specific patterns in those files
Grep with pattern: "req\.user|req\.auth" in middleware/

// 3. Read exact implementations
Read specific files identified above
```

**When to Use This Pattern:**
- Need both semantic understanding AND exact syntax
- Want to verify search results with grep
- Investigating specific implementation details

### Phase 6: Troubleshooting and Common Pitfalls

#### 6.1 Indexing Issues

**Problem: "Indexing stuck at 0%"**

Solutions:
1. Check Node.js version (must be 20.x, NOT 24.x)
2. Verify OPENAI_API_KEY is set
3. Verify MILVUS_TOKEN is set
4. Check path is absolute, not relative
5. Ensure directory exists and is readable

**Problem: "Indexing failed halfway through"**

Solutions:
1. Clear index: `clear_index`
2. Re-index with `force: true`
3. Check for corrupted files in codebase
4. Try LangChain splitter instead of AST

**Problem: "Already indexed but want to update"**

Solution:
1. Ask user if they want to force re-index
2. Explain trade-off: time vs freshness
3. Use `force: true` if confirmed

#### 6.2 Search Quality Issues

**Problem: "Search returns irrelevant results"**

Solutions:
1. Make query more specific:
   - ❌ "user" → ✅ "user login authentication with password"
2. Add extension filter to narrow scope
3. Reduce limit to see top results only
4. Try different query phrasing (synonyms, related concepts)

**Problem: "Search misses relevant code"**

Solutions:
1. Broaden query:
   - ❌ "JWT token validation middleware" → ✅ "authentication verification"
2. Increase limit (try 20 or 30)
3. Try multiple searches with different keywords
4. Check if file is actually indexed (might be in ignore patterns)

**Problem: "Too many results, all seem relevant"**

Solutions:
1. Use extension filters to focus on specific files
2. Combine with follow-up searches:
   - First: Broad search
   - Second: Specific search based on first results
3. Use limit: 5 to see only top matches

#### 6.3 Performance Issues

**Problem: "Indexing takes too long"**

Solutions:
1. Add ignore patterns for generated/vendor code
2. Use LangChain splitter (faster but less accurate)
3. Index subdirectories separately
4. Check for very large files (>10MB) and exclude them

**Problem: "Search is slow"**

Solutions:
1. Reduce limit (fewer results = faster)
2. Use extension filters (smaller search space)
3. Check indexing status (still indexing = slow search)

**Problem: "Using too many tokens"**

Solutions:
1. Reduce search limit
2. Use extension filters
3. Make queries more specific (fewer but better results)
4. Combine search with targeted reads (not full directory reads)

### Phase 7: Real-World Workflow Examples

#### Example 1: Investigating New Codebase

```markdown
User: "I'm new to this project, help me understand the architecture"

## Workflow:

1. Index the codebase
mcp__claude-context__index_codebase with path: "/project"

2. Search for entry points
search_code with query: "application startup initialization main function"

3. Search for architecture patterns
search_code with query: "dependency injection container service registration"
search_code with query: "routing configuration API endpoint definitions"
search_code with query: "database connection setup and migrations"

4. Search for domain models
search_code with query: "core business entities data models"

5. Launch codebase-detective with findings
Task tool with all search results as context

6. Provide architecture overview to user
```

#### Example 2: Finding and Fixing a Bug

```markdown
User: "Users can't reset their passwords, investigate"

## Workflow:

1. Ensure codebase is indexed
get_indexing_status with path: "/project"

2. Search for password reset functionality
search_code with query: "password reset request token generation email"
search_code with query: "password reset verification token validation"
search_code with query: "update user password after reset"

3. Find related error handling
search_code with query: "password reset error handling validation"

4. Narrow down to specific files
extensionFilter: [".ts", ".tsx"] to focus on TypeScript

5. Read specific implementations
Read files identified in search

6. Identify bug and propose fix

7. Search for tests
search_code with query: "password reset test cases" to find where to add tests
```

#### Example 3: Adding New Feature to Existing System

```markdown
User: "Add two-factor authentication to login"

## Workflow:

1. Index codebase (if needed)

2. Find existing authentication
search_code with query: "user login authentication password verification"

3. Find similar security features
search_code with query: "token generation validation security verification"

4. Find where to integrate
search_code with query: "login flow user session creation after authentication"

5. Find database models
search_code with query: "user model schema database table"

6. Find configuration patterns
search_code with query: "feature flags configuration settings"

7. Launch codebase-detective with context
Provide all search results to guide implementation

8. Implement 2FA based on existing patterns
```

#### Example 4: Security Audit

```markdown
User: "Audit the codebase for security issues"

## Workflow:

1. Index entire codebase

2. Search for authentication weaknesses
search_code with query: "password storage hashing bcrypt authentication"
search_code with query: "SQL query construction user input database"

3. Search for authorization issues
search_code with query: "access control permission checking authorization"
search_code with query: "API endpoint authentication middleware protection"

4. Search for input validation
search_code with query: "user input validation sanitization XSS prevention"
search_code with query: "file upload handling validation security"

5. Search for sensitive data handling
search_code with query: "environment variables secrets API keys configuration"
search_code with query: "logging sensitive data personal information"

6. Launch codebase-detective for deep analysis
Investigate each suspicious finding

7. Generate security report
```

#### Example 5: Migration Planning

```markdown
User: "Plan migration from Express to Fastify"

## Workflow:

1. Index codebase

2. Find all Express usage
search_code with query: "Express router middleware application setup"
search_code with extensionFilter: [".ts", ".js"], limit: 50

3. Find route definitions
search_code with query: "HTTP route handlers GET POST PUT DELETE endpoints"

4. Find middleware usage
search_code with query: "middleware authentication error handling CORS"

5. Find specific Express features
search_code with query: "express static file serving"
search_code with query: "express session management"
search_code with query: "express body parser request parsing"

6. Document all findings
Create migration checklist with file locations

7. Estimate effort
Count occurrences, identify complex migrations
```

### Phase 8: Best Practices Summary

#### Indexing Best Practices

✅ **DO:**
- Use AST splitter for better semantic coherence
- Index once, search many times
- Check status before re-indexing
- Use absolute paths
- Add custom extensions for framework-specific files
- Use ignore patterns to exclude generated/vendor code

❌ **DON'T:**
- Re-index unnecessarily (wastes time)
- Use relative paths (causes errors)
- Index without checking Node.js version (v20.x required)
- Include minified/bundled files (creates noise)
- Force re-index without user confirmation

#### Search Best Practices

✅ **DO:**
- Use natural language concept queries
- Start with limit: 10, adjust as needed
- Use extension filters for multi-language projects
- Refine queries based on results
- Combine semantic search with targeted file reads

❌ **DON'T:**
- Use overly generic queries ("user", "function")
- Use regex patterns (use grep instead)
- Assume exact naming (defeats semantic search purpose)
- Set limit too low (<5) or too high (>30 usually)
- Load entire directories when search would suffice

#### Performance Best Practices

✅ **DO:**
- Use semantic search to reduce token usage
- Combine search → read specific files
- Monitor indexing progress for large codebases
- Use extension filters to narrow search space
- Clear old indexes when project structure changes significantly

❌ **DON'T:**
- Read entire directories when searching would work
- Index multiple times for the same investigation
- Use limit: 50 when 10 would suffice
- Search without specifying path (searches everything)

#### Workflow Best Practices

✅ **DO:**
- Index at start of investigation
- Use semantic search before launching agents
- Provide search results to codebase-detective
- Combine semantic search with grep for precision
- Iterate on queries based on results

❌ **DON'T:**
- Skip indexing for large codebases
- Launch detective without search context
- Rely solely on semantic search (combine tools)
- Give up after first search (iterate and refine)

## Integration with This Plugin

This Skill works seamlessly with:

1. **Codebase-Detective Agent** (`plugins/code-analysis/agents/codebase-detective.md`)
   - Use semantic search to find starting points
   - Provide search results as context to detective
   - Detective does deep dive investigation

2. **Deep Analysis Skill** (`plugins/code-analysis/skills/deep-analysis/SKILL.md`)
   - Deep analysis invokes detective
   - Detective uses semantic search (from this skill)
   - Full workflow: deep-analysis → detective → semantic-search → investigation

3. **Analyze Command** (`plugins/code-analysis/commands/analyze.md`)
   - Command triggers deep analysis skill
   - Skill guides semantic search usage
   - Complete workflow automation

## Success Criteria

This Skill is successful when:

1. ✅ Codebase is indexed efficiently with appropriate settings
2. ✅ Search queries are formulated semantically for best results
3. ✅ Token usage is optimized (40% reduction achieved)
4. ✅ Search results are relevant and actionable
5. ✅ User understands when to use semantic search vs grep
6. ✅ Integration with other tools (detective, grep, read) is seamless
7. ✅ Performance is optimized (indexing time, search speed, token usage)

## Quality Checklist

Before completing a semantic search workflow, ensure:

- ✅ Checked if path is already indexed (avoid unnecessary re-indexing)
- ✅ Used appropriate splitter (AST for code, LangChain for docs)
- ✅ Formulated queries using natural language concepts
- ✅ Set reasonable result limits (10-20 typically)
- ✅ Used extension filters when appropriate
- ✅ Provided search results as context to agents
- ✅ Explained to user why semantic search was beneficial
- ✅ Documented file locations for follow-up investigation

## Notes

- Claude-Context MCP requires Node.js v20.x (NOT v24.x)
- Requires OPENAI_API_KEY for embeddings
- Requires MILVUS_TOKEN for Zilliz Cloud vector database
- Achieves ~40% token reduction vs full directory reads
- Uses hybrid search: BM25 (keyword) + dense embeddings (semantic)
- AST splitter preserves code structure better than character-based
- Always use absolute paths, never relative paths
- Semantic search complements grep/ripgrep, doesn't replace it
- Best for "what does this do?" queries, not "show me line 45"
- Integration with codebase-detective creates powerful investigation workflow

---

**Maintained by:** Jack Rudenko @ MadAppGang
**Plugin:** code-analysis v1.0.0
**Last Updated:** November 5, 2024

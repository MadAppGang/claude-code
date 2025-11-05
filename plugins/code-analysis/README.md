# Code Analysis Plugin

Deep code investigation and analysis toolkit for Claude Code. Understand complex codebases, trace functionality, find implementations, and analyze architectural patterns with the power of the codebase-detective agent.

## Quick Start

### Installation

```bash
# Add marketplace
/plugin marketplace add MadAppGang/claude-code

# Install plugin
/plugin install code-analysis@mag-claude-plugins
```

That's it! No additional configuration required.

## Available Tools

### Agent (1)

**Code Investigation:**
- `codebase-detective` - Expert code navigation specialist for finding implementations, tracing code flow, and understanding architecture

### Command (1)

**Analysis Workflow:**
- `/analyze [question]` - Launch deep codebase investigation to answer questions about code structure, functionality, and patterns

### Skills (2)

**Proactive Analysis:**
- `deep-analysis` - Automatically triggered when you ask about code structure, implementations, or need to understand how features work
- `semantic-code-search` - Expert guidance on using claude-context MCP for semantic code search with best practices for indexing, query formulation, and performance optimization

## What This Plugin Does

The Code Analysis plugin helps you:

1. **Understand Architecture** - "How is authentication implemented?" → Get complete flow with file locations
2. **Find Implementations** - "Where is user registration logic?" → Exact files and line numbers
3. **Trace Functionality** - "What happens when I click submit?" → Complete code flow from UI to backend
4. **Debug Issues** - "Why is profile showing undefined?" → Root cause analysis with fix suggestions
5. **Analyze Patterns** - "Where are all API calls made?" → Comprehensive pattern analysis
6. **Navigate Codebases** - Quickly understand unfamiliar code with guided exploration

## How It Works

### Method 1: Using the /analyze Command

```bash
# Ask any code-related question
/analyze How does authentication work in this app?
/analyze Where is the payment processing logic?
/analyze Why is the dashboard showing undefined for user name?
/analyze What happens when I submit the login form?
```

The command will:
1. Launch the codebase-detective agent
2. Use semantic search (MCP claude-context) if available
3. Fall back to grep/ripgrep/find if needed
4. Provide exact file locations with line numbers
5. Explain code flow and relationships
6. Show relevant code snippets
7. Offer navigation guidance

### Method 2: Natural Conversation (Skill Auto-triggers)

The `deep-analysis` skill automatically activates when you ask:
- "How does [feature] work?"
- "Where is [functionality] implemented?"
- "Can you explain the [component/service] architecture?"
- "What's the structure of the data layer?"

Just ask naturally, and Claude will investigate for you.

### Method 3: Direct Agent Use (Advanced)

For complex investigations, launch the agent directly:

```bash
# In Claude Code conversation
I need to investigate authentication. Can you launch the codebase-detective agent?
```

## Examples

### Example 1: Understanding Authentication

```bash
/analyze How does login work in this app?
```

**Result:**
```
📍 Location Report: User Login Flow

Primary Files:
- src/api/auth/login.ts:34-78 - Login API endpoint handler
- src/services/authService.ts:12-45 - JWT token generation
- src/middleware/authMiddleware.ts:23-56 - Token validation
- src/hooks/useAuth.ts:89-120 - React authentication hook

Code Flow:
1. User submits form → LoginForm.tsx:45
2. Calls login API → api/auth/login.ts:34
3. Validates credentials → authService.validateUser():78
4. Generates JWT → authService.generateToken():102
5. Stores in localStorage → hooks/useAuth.ts:95
6. Redirects to dashboard → LoginForm.tsx:67

Architecture:
UI Layer (React) → API Layer (Express) → Service Layer → Database
```

### Example 2: Debugging Undefined Error

```bash
/analyze The dashboard shows "undefined" for user name
```

**Result:**
```
📍 Location Report: Undefined User Name Bug

Issue Found:
- src/components/Dashboard.tsx:156 renders {user.name}
- src/hooks/useUser.ts:45 fetches user data from API
- API returns "full_name" but code expects "name"

Root Cause:
API response structure mismatch at useUser.ts:67

Fix:
Map "full_name" to "name" in the useUser hook:

const user = {
  ...response.data,
  name: response.data.full_name  // Add this mapping
}
```

### Example 3: Finding All API Calls

```bash
/analyze Where are all the API calls made?
```

**Result:**
```
📍 Location Report: API Call Locations

Summary: 23 API calls across 8 service files

Primary Services:
- src/services/userService.ts - 5 calls (CRUD operations)
- src/services/authService.ts - 3 calls (login, logout, refresh)
- src/services/orderService.ts - 7 calls (order management)
- src/services/productService.ts - 4 calls (catalog)
- src/services/paymentService.ts - 4 calls (Stripe integration)

Pattern: Centralized API client
- Base client: src/config/apiClient.ts
- Uses axios with interceptors
- Base URL: configured in .env
- Error handling: src/utils/errorHandler.ts

All endpoints follow REST conventions:
GET /api/users, POST /api/users, etc.
```

## Features

### Semantic Search (MCP Integration)

When the `claude-context` MCP server is available, the plugin uses semantic search:
- Natural language queries: "authentication logic"
- Understands concepts, not just keywords
- Finds related code across the codebase
- Indexes codebase for fast searches
- **NEW: `semantic-code-search` skill** provides expert guidance on optimal usage:
  - Best practices for indexing (AST vs LangChain splitters)
  - Query formulation strategies for maximum relevance
  - Performance optimization (40% token reduction)
  - Troubleshooting and common pitfalls
  - Real-world workflow examples

### Fallback Mode

Without MCP, the plugin uses traditional tools:
- `ripgrep` (rg) for fast pattern matching
- `grep` for text search
- `find` for file location
- `git grep` for repository-wide search

Both modes work effectively!

## Use Cases

### For Developers

**Onboarding:**
- Quickly understand new codebases
- Learn project architecture and patterns
- Find where to make changes

**Development:**
- Locate similar implementations for reference
- Understand dependencies before refactoring
- Find all usages of a component/service

**Debugging:**
- Trace bugs across multiple files
- Understand error propagation
- Find root causes quickly

### For Code Review

**Review Preparation:**
- Understand PR context by analyzing related code
- Find similar patterns in the codebase
- Verify architectural consistency

**Impact Analysis:**
- Find all affected components
- Check dependency implications
- Identify potential breaking changes

### For Refactoring

**Planning:**
- Map out current architecture
- Find all code that needs updating
- Understand coupling between modules

**Execution:**
- Verify all references are updated
- Check for missed dependencies
- Ensure pattern consistency

## Technical Details

### Agent: codebase-detective

**Model:** Sonnet (for complex reasoning)

**Capabilities:**
- Semantic code search (with MCP)
- Pattern matching (grep/ripgrep)
- Multi-file code tracing
- Architecture analysis
- Dependency mapping
- Flow diagram generation

**Output Format:**
- Exact file paths with line numbers
- Code snippets showing implementations
- Flow diagrams for complex logic
- Navigation commands
- Actionable insights

### Command: /analyze

**Orchestrator:** Launches agent with user's question
**Context Awareness:** Uses current working directory
**Output:** Comprehensive analysis report

### Skill: deep-analysis

**Trigger:** Automatically when users ask about code
**Mode:** Proactive assistance
**Integration:** Works with other MCP tools

## Best Practices

### Asking Effective Questions

**Good Questions:**
- "How does user authentication work?"
- "Where is the payment processing logic?"
- "What happens when I submit the form?"
- "Find all API calls to the users endpoint"

**Less Effective:**
- "Analyze the codebase" (too broad)
- "Show me code" (not specific)
- "Find stuff" (unclear goal)

### Using Results

1. **Verify Findings:** Check the reported file paths
2. **Read Context:** Look at surrounding code
3. **Follow Links:** Explore related files mentioned
4. **Ask Follow-ups:** Drill deeper into specific parts

### Integration Tips

- Use with MCP claude-context for best results
- Combine with gopls for Go projects
- Works great with git commands
- Integrates with project search tools

## Requirements

### System

- Node.js v18+ (optional, for some MCP servers)
- Git (for repository analysis)

### Optional but Recommended

- **MCP claude-context server** - For semantic search (faster, more accurate)
- **ripgrep (rg)** - For fast fallback search
- **The Silver Searcher (ag)** - Alternative search tool

### Claude Code

- Claude Code v1.0.0 or higher
- Plugin system enabled

## Troubleshooting

### "No results found"

1. Check your query is specific enough
2. Try different keywords or synonyms
3. Verify you're in the correct directory
4. Use `/analyze` with more context

### "MCP server not available"

This is normal! The plugin works fine without MCP using grep/find.

To enable MCP semantic search:
```bash
# Install claude-context MCP server
npm install -g @claude/context-server
```

### Slow searches

1. Use more specific queries to narrow scope
2. Consider indexing with claude-context MCP
3. Exclude irrelevant directories (node_modules, etc)

## Contributing

This plugin is part of the MAG Claude Plugins collection. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Repository: https://github.com/MadAppGang/claude-code

## Support

- Issues: https://github.com/MadAppGang/claude-code/issues
- Email: i@madappgang.com

## License

MIT License - see LICENSE file for details

## Credits

**Author:** Jack Rudenko @ MadAppGang
**Email:** i@madappgang.com
**Plugin Version:** 1.1.0
**Marketplace:** mag-claude-plugins

## Related Plugins

- **frontend-development** - Complete frontend development toolkit with 8 agents, 5 commands, and 2 skills

---

**Made with ❤️ by MadAppGang**

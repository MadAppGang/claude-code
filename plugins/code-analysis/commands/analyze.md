---
description: Deep codebase investigation to understand architecture, trace functionality, find implementations, and analyze code patterns
allowed-tools: Task, AskUserQuestion, Bash, Read, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep
---

## Mission

Launch the codebase-detective agent to perform comprehensive code analysis, investigation, and navigation across complex codebases. This command helps understand how code works, find specific implementations, trace functionality flow, and analyze architectural patterns.

## Analysis Request

$ARGUMENTS

## When to Use This Command

Use `/analyze` when you need to:

- **Understand Architecture**: How is authentication implemented? What's the database layer structure?
- **Find Implementations**: Where is the user registration logic? Which file handles payments?
- **Trace Functionality**: Follow the flow from API endpoint to database
- **Debug Issues**: Why isn't the login working? Where is this error coming from?
- **Find Patterns**: Where are all the API calls made? What components use Redux?
- **Analyze Dependencies**: What uses this service? Where is this utility imported?

## How It Works

This command launches the **codebase-detective** agent, which:

1. Uses semantic code search (claudemem CLI) when available
2. Falls back to standard grep/find/rg tools when needed
3. Traces imports and dependencies across files
4. Analyzes code structure and patterns
5. Provides exact file locations with line numbers
6. Explains code relationships and flow

## Instructions

### Step 1: Understand the Request

Parse the user's analysis request from $ARGUMENTS:

- What are they trying to understand?
- What specific code/functionality are they looking for?
- What's the context (debugging, learning, refactoring)?

### Step 2: Launch codebase-detective Agent

Use the Task tool to launch the agent:

```
Task(
  subagent_type: "code-analysis:detective",
  description: "Analyze codebase for [brief description]",
  prompt: `
    Investigate the following in the codebase:

    [User's analysis request from $ARGUMENTS]

    Working directory: [current working directory]

    Please provide:
    1. Exact file locations with line numbers
    2. Code snippets showing the implementation
    3. Explanation of how the code works
    4. Related files and dependencies
    5. Code flow/architecture diagram if complex

    Use semantic search (claudemem CLI) if available, otherwise
    use grep/ripgrep/find for pattern matching.
  `
)
```

### Step 3: Present Results

After the agent completes:

1. **Summarize Findings**: Key files, main implementation locations
2. **Show Code Structure**: How components relate to each other
3. **Provide Next Steps**: Suggestions for what to do with this information
4. **Offer Follow-up**: Ask if they want deeper analysis of specific parts

## Example Usage

### Example 1: Finding Authentication Logic

```
User: /analyze Where is user authentication handled?

Agent launches with prompt:
"Find and explain the authentication implementation. Include:
- Login endpoint/handler
- Token generation/validation
- Authentication middleware
- Session management
- Related security code"

Results:
- src/auth/login.handler.ts:23-67 (login endpoint)
- src/middleware/auth.middleware.ts:12-45 (JWT validation)
- src/services/token.service.ts:89-120 (token generation)
```

### Example 2: Tracing Bug

```
User: /analyze The user profile page shows "undefined" for email field

Agent launches with prompt:
"Trace the user profile email display issue:
1. Find the profile page component
2. Locate where email data is fetched
3. Check how email is passed to the component
4. Identify where 'undefined' might be introduced"

Results:
- Identified missing null check in ProfilePage.tsx:156
- Found API returns 'e-mail' but code expects 'email'
- Provided exact line numbers for the mismatch
```

### Example 3: Understanding Architecture

```
User: /analyze How does the payment processing flow work?

Agent launches with prompt:
"Map out the complete payment processing flow:
1. Entry point (API endpoint or UI trigger)
2. Validation and business logic
3. Payment gateway integration
4. Database persistence
5. Success/failure handling
6. Related services and utilities"

Results:
- Flow diagram from checkout button to confirmation
- 7 key files involved with their roles
- External dependencies (Stripe SDK)
- Error handling strategy
```

## Tips for Effective Analysis

1. **Be Specific**: Instead of "analyze the codebase", ask "where is the email validation logic?"
2. **Provide Context**: Mention if you're debugging, refactoring, or learning
3. **Ask Follow-ups**: After initial results, drill deeper into specific files
4. **Use for Navigation**: Get oriented in unfamiliar codebases quickly

## Output Format

The agent will provide:

```
📍 Location Report: [What was analyzed]

**Primary Files**:
- path/to/main/file.ts:45-67 - [Brief description]
- path/to/related/file.ts:23 - [Brief description]

**Code Flow**:
1. Entry point: [File:line]
2. Processing: [File:line]
3. Result: [File:line]

**Related Components**:
- [Component name] - [Purpose]
- [Service name] - [Purpose]

**How to Navigate**:
[Commands to explore the code further]

**Recommendations**:
[Suggestions based on analysis]
```

## Success Criteria

The command is successful when:

1. ✅ User's question is fully answered with exact locations
2. ✅ Code relationships and flow are clearly explained
3. ✅ File paths and line numbers are provided
4. ✅ User can navigate to the code and understand it
5. ✅ Follow-up questions are anticipated and addressed

## Notes

- The codebase-detective agent is optimized for speed and accuracy
- It will use the best available tools (claudemem search or grep/ripgrep)
- Results include actionable next steps
- Can handle complex, multi-file investigations
- Excellent for onboarding to new codebases
- claudemem requires OpenRouter API key (https://openrouter.ai)
- Run `claudemem --models` to see embedding model options and pricing

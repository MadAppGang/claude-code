---
name: api-docs
description: Analyze API documentation for endpoints, data types, and request/response formats
allowed-tools: Task, Read, Bash
---

## Mission

Provide comprehensive API documentation analysis for the Tenant Management Portal API by leveraging the api-analyst agent. Answer questions about endpoints, data structures, authentication, and usage patterns.

## User Query

{{ARGS}}

## Workflow

### STEP 1: Parse User Query

Analyze the user's question to determine what they need:

- **Endpoint information**: Specific API routes, methods, parameters
- **Data type clarification**: TypeScript interfaces, field types, validation rules
- **Authentication/Authorization**: How to authenticate requests, required headers
- **Error handling**: Expected error responses, status codes
- **Integration guidance**: How to integrate with the API, example requests
- **General overview**: High-level API structure and available resources

### STEP 2: Launch API Documentation Analyzer

Use the Task tool with `subagent_type: "frontend:api-analyst"` and provide a detailed prompt:

```
The user is asking: {{ARGS}}

Please analyze the Tenant Management Portal API documentation to answer this query.

Provide:
1. **Relevant Endpoints**: List all endpoints related to the query with HTTP methods
2. **Request Format**: Show request body/query parameters with types
3. **Response Format**: Show response structure with data types
4. **TypeScript Types**: Generate TypeScript interfaces for request/response
5. **Authentication**: Specify any auth requirements
6. **Examples**: Include example requests/responses
7. **Error Handling**: List possible error responses
8. **Usage Notes**: Any important considerations or best practices

Context:
- This is for a React + TypeScript frontend application
- We use TanStack Query for data fetching
- We need type-safe API integration
- Current mock API will be replaced with real API calls
```

### STEP 3: Format and Present Results

After the agent returns its analysis:

1. **Structure the output clearly** with section headers
2. **Include code examples** in TypeScript
3. **Highlight important notes** about authentication, validation, etc.
4. **Provide actionable guidance** for implementation

## Expected Output Format

The agent should provide documentation analysis structured like:

```markdown
# API Documentation: [Topic]

## Endpoints

### [HTTP METHOD] /api/[resource]
- **Purpose**: [Description]
- **Authentication**: [Required/Optional + method]
- **Request Parameters**: [Details]
- **Response**: [Structure]

## TypeScript Types

\`\`\`typescript
interface [Resource] {
  id: string;
  // ... fields with types
}

interface [ResourceRequest] {
  // ... request body structure
}
\`\`\`

## Example Usage

\`\`\`typescript
// Example request with TanStack Query
const { data } = useQuery({
  queryKey: ['resource', params],
  queryFn: () => api.getResource(params)
})
\`\`\`

## Error Responses

- **400 Bad Request**: [When this occurs]
- **401 Unauthorized**: [When this occurs]
- **404 Not Found**: [When this occurs]

## Implementation Notes

- [Important considerations]
- [Best practices]
```

## Special Cases

### Vague Query
If the query is general (e.g., "show me the API"), provide an overview of all major resource groups and suggest specific queries.

### Multiple Endpoints
If multiple endpoints are relevant, prioritize by:
1. Exact match to query
2. Most commonly used
3. Related operations (CRUD set)

### Missing Documentation
If documentation is incomplete or unclear, note this explicitly and provide best-effort analysis based on available information.

## Notes

- Always use the latest API documentation from the OpenAPI spec
- Prefer TypeScript types over generic JSON examples
- Include practical usage examples with TanStack Query when relevant
- Highlight any breaking changes or deprecations
- Consider the frontend context (React + TypeScript) when providing guidance

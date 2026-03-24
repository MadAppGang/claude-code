---
name: yaml-agent-format
description: "Defines the YAML schema for Claude Code agent definitions as an alternative to markdown. Covers required fields, validation rules, and markdown-to-YAML conversion patterns. Use when creating agents in YAML format, converting existing markdown agents to YAML, or validating YAML agent schemas."
---

# YAML Agent Format

## Overview

### Why YAML for Agents?

YAML provides an alternative format for defining Claude Code agents with several advantages:

**Benefits:**
- **Machine-parseable**: Easy to validate, transform, and generate programmatically
- **Less verbose**: No markdown headers, cleaner structure
- **Schema validation**: Strong typing with JSON Schema or Zod
- **Tooling support**: Better IDE autocomplete, linting, formatting
- **Data-first**: Natural for configuration management

**Trade-offs:**
- **Less readable**: Markdown is better for long-form documentation
- **Indentation-sensitive**: YAML whitespace can be error-prone
- **No rich formatting**: Can't use markdown tables, code blocks in descriptions

### When to Use YAML vs Markdown

**Use YAML when:**
- Generating agents programmatically
- Agent definitions are data-heavy (many examples, tools, rules)
- You need strong schema validation
- Agent is simple and concise
- Working in automation/CI pipelines

**Use Markdown when:**
- Agent has extensive documentation needs
- You want rich formatting (tables, diagrams, code examples)
- Agent is tutorial-like with explanations
- Human readability is priority
- Agent includes narrative instructions

### Compatibility with Claude Code

YAML agents are **fully compatible** with Claude Code:
- Placed in `agents/` directory with `.agent.yaml` extension
- Registered in `plugin.json` identically to markdown agents
- Loaded and executed the same way
- Can mix YAML and markdown agents in same plugin

---

## YAML Agent Schema

### Complete Schema Definition

```yaml
# Required fields
name: string                    # Agent name (kebab-case)
description: string             # Brief description (1-2 sentences)
version: string                 # Semver version (e.g., "1.0.0")

# Optional but recommended
role:
  identity: string              # Agent's role/identity
  expertise: string[]           # List of expertise areas
  mission: string               # Primary mission statement

tools: string[]                 # Available tools (Read, Write, Edit, Bash, etc.)

instructions:
  constraints: string[]         # Critical constraints/rules
  workflow:                     # Step-by-step workflow
    - phase: string             # Phase name
      objective: string         # Phase objective
      steps: string[]           # List of steps

knowledge:                      # Knowledge base entries
  - topic: string               # Knowledge topic
    content: string             # Knowledge content

examples:                       # Usage examples
  - name: string                # Example name
    user: string                # User message
    assistant: string           # Assistant response

formatting:
  style: string                 # Communication style
  templates:                    # Output templates
    success: string
    error: string
```

### Field Details

**Required Fields:**
- `name`: Agent identifier (must match filename without extension)
- `description`: Shown in agent list, used for agent selection
- `version`: Semver for tracking changes

**Role Section:**
- `identity`: Who the agent is (e.g., "React Component Builder")
- `expertise`: Array of skills (e.g., ["React 19", "TypeScript", "Testing"])
- `mission`: What the agent does (e.g., "Build production-ready React components")

**Tools Array:**
Standard Claude Code tools:
```yaml
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
```

**Workflow Structure:**
```yaml
instructions:
  workflow:
    - phase: "Phase 1: Discovery"
      objective: "Find relevant files"
      steps:
        - "Use Glob to find components"
        - "Use Grep to search for patterns"
        - "Read existing implementations"
```

---

## YAML vs Markdown Comparison

### Simple Agent: Side-by-Side

**Markdown (`simple-agent.md`):**
```markdown
---
name: simple-agent
description: A simple example agent
version: 1.0.0
---

<role>
  <identity>Code Formatter</identity>
  <mission>Format code files according to standards</mission>
</role>

<instructions>
  1. Read the file
  2. Format using appropriate tool
  3. Write back to file
</instructions>
```

**YAML (`simple-agent.agent.yaml`):**
```yaml
name: simple-agent
description: A simple example agent
version: 1.0.0

role:
  identity: Code Formatter
  mission: Format code files according to standards

instructions:
  workflow:
    - phase: Format
      steps:
        - Read the file
        - Format using appropriate tool
        - Write back to file
```

### Complex Agent: Side-by-Side

**Markdown (`react-builder.md`):**
```markdown
---
name: react-builder
description: Build React components with tests
version: 2.1.0
---

<role>
  <identity>React Component Builder</identity>
  <expertise>
    - React 19 with TypeScript
    - React Testing Library
    - Component patterns
  </expertise>
</role>

<instructions>
  <workflow>
    <phase number="1" name="Create Component">
      <steps>
        <step>Create component file with TypeScript types</step>
        <step>Implement component logic</step>
      </steps>
    </phase>
  </workflow>
</instructions>

<examples>
  <example name="Button Component">
    <user>Create a button component</user>
    <assistant>I'll create Button.tsx with props...</assistant>
  </example>
</examples>
```

**YAML (`react-builder.agent.yaml`):**
```yaml
name: react-builder
description: Build React components with tests
version: 2.1.0

role:
  identity: React Component Builder
  expertise:
    - React 19 with TypeScript
    - React Testing Library
    - Component patterns

instructions:
  workflow:
    - phase: "Phase 1: Create Component"
      steps:
        - Create component file with TypeScript types
        - Implement component logic

examples:
  - name: Button Component
    user: Create a button component
    assistant: I'll create Button.tsx with props...
```

**Key Difference:** YAML is ~30% shorter for structured data.

---

## Conversion Patterns

### Markdown to YAML Conversion

**Conversion Rules:**
1. Extract frontmatter YAML as base
2. Parse XML-style tags to nested objects
3. Convert numbered lists to arrays
4. Flatten markdown formatting to plain strings

**Example Conversion:**

**Input (Markdown):**
```markdown
---
name: test-agent
version: 1.0.0
---

<role>
  <identity>Tester</identity>
  <expertise>
    - Unit testing
    - Integration testing
  </expertise>
</role>

<instructions>
  <constraints>
    - Always write tests first
    - Use TypeScript
  </constraints>
</instructions>
```

**Output (YAML):**
```yaml
name: test-agent
version: 1.0.0

role:
  identity: Tester
  expertise:
    - Unit testing
    - Integration testing

instructions:
  constraints:
    - Always write tests first
    - Use TypeScript
```

### YAML to Markdown Conversion

**Conversion Rules:**
1. Create frontmatter from top-level fields
2. Convert nested objects to XML-style tags
3. Convert arrays to markdown lists
4. Wrap in appropriate markdown structure

**Example Conversion:**

**Input (YAML):**
```yaml
name: docs-agent
version: 1.0.0
role:
  identity: Documentation Writer
  mission: Create comprehensive docs
```

**Output (Markdown):**
```markdown
---
name: docs-agent
version: 1.0.0
---

<role>
  <identity>Documentation Writer</identity>
  <mission>Create comprehensive docs</mission>
</role>
```

### Automated Conversion Tools

**TypeScript Conversion Function:**
```typescript
import yaml from 'yaml';
import { z } from 'zod';

// Convert markdown agent to YAML
function markdownToYaml(markdownPath: string): string {
  const content = fs.readFileSync(markdownPath, 'utf-8');

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = yaml.parse(frontmatterMatch?.[1] || '');

  // Parse XML-like tags
  const role = extractRoleSection(content);
  const instructions = extractInstructionsSection(content);

  const agent = {
    ...frontmatter,
    role,
    instructions
  };

  return yaml.stringify(agent);
}

// Convert YAML agent to markdown
function yamlToMarkdown(yamlPath: string): string {
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const agent = yaml.parse(content);

  const { name, description, version, role, instructions, ...rest } = agent;

  let md = `---\n${yaml.stringify({ name, description, version })}---\n\n`;

  if (role) {
    md += `<role>\n${objectToXml(role)}</role>\n\n`;
  }

  if (instructions) {
    md += `<instructions>\n${objectToXml(instructions)}</instructions>\n\n`;
  }

  return md;
}
```

---

## Validation

### Schema Validation with Zod

**Define Zod Schema:**
```typescript
import { z } from 'zod';

const AgentSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(200),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),

  role: z.object({
    identity: z.string(),
    expertise: z.array(z.string()).optional(),
    mission: z.string()
  }).optional(),

  tools: z.array(z.enum([
    'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'
  ])).optional(),

  instructions: z.object({
    constraints: z.array(z.string()).optional(),
    workflow: z.array(z.object({
      phase: z.string(),
      objective: z.string().optional(),
      steps: z.array(z.string())
    })).optional()
  }).optional(),

  examples: z.array(z.object({
    name: z.string(),
    user: z.string(),
    assistant: z.string()
  })).optional()
});

// Validate YAML agent
function validateAgent(yamlPath: string): boolean {
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const agent = yaml.parse(content);

  try {
    AgentSchema.parse(agent);
    return true;
  } catch (error) {
    console.error('Validation failed:', error);
    return false;
  }
}
```

### Common Validation Errors

**1. Invalid Name Format:**
```yaml
# BAD
name: "My Agent"  # Spaces not allowed

# GOOD
name: my-agent
```

**2. Missing Required Fields:**
```yaml
# BAD - missing version
name: test-agent
description: Test agent

# GOOD
name: test-agent
description: Test agent
version: 1.0.0
```

**3. Invalid Semver:**
```yaml
# BAD
version: "1.0"  # Not semver

# GOOD
version: "1.0.0"
```

**4. Invalid Tool Names:**
```yaml
# BAD
tools:
  - ReadFile  # Wrong name

# GOOD
tools:
  - Read
  - Write
```

**5. Incorrect Array Format:**
```yaml
# BAD
expertise: Unit testing, Integration testing

# GOOD
expertise:
  - Unit testing
  - Integration testing
```

### Validation Tools

**CLI Validator:**
```bash
# Create validation script
cat > validate-agent.ts <<'EOF'
#!/usr/bin/env bun
import { AgentSchema } from './agent-schema';
import yaml from 'yaml';

const file = process.argv[2];
const content = await Bun.file(file).text();
const agent = yaml.parse(content);

const result = AgentSchema.safeParse(agent);
if (result.success) {
  console.log('✓ Valid agent definition');
} else {
  console.error('✗ Validation errors:');
  result.error.issues.forEach(issue => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}
EOF

chmod +x validate-agent.ts

# Usage
./validate-agent.ts agents/my-agent.agent.yaml
```

---

## File Naming

### YAML Agent Naming Convention

**Format:** `{agent-name}.agent.yaml`

**Examples:**
- `code-reviewer.agent.yaml`
- `react-builder.agent.yaml`
- `test-generator.agent.yaml`

**Rules:**
- Use `.agent.yaml` extension (not `.yaml` or `.yml`)
- Name must match the `name` field in YAML
- Use kebab-case for names
- Place in `agents/` directory

### Directory Structure

```
plugin-name/
├── agents/
│   ├── builder.agent.yaml       # YAML agent
│   ├── reviewer.md              # Markdown agent
│   └── tester.agent.yaml        # YAML agent
├── plugin.json
└── README.md
```

### Plugin.json Registration

**Register YAML agents identically to markdown agents:**

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "agents": [
    {
      "name": "builder",
      "file": "agents/builder.agent.yaml",
      "description": "Build components"
    },
    {
      "name": "reviewer",
      "file": "agents/reviewer.md",
      "description": "Review code"
    }
  ]
}
```

**Note:** Claude Code detects format from file extension.

---

## Best Practices

### Do

- Use YAML for data-heavy agents with many examples
- Validate YAML syntax before committing
- Keep descriptions concise (YAML has no rich formatting)
- Use consistent indentation (2 spaces recommended)
- Add comments for complex sections
- Version agents with semver
- Test agent loading after creation

### Don't

- Don't mix tabs and spaces in YAML
- Don't use YAML for agents with extensive documentation
- Don't forget required fields (name, description, version)
- Don't use complex YAML features (anchors, aliases) - keep it simple
- Don't embed long code examples (use markdown for that)
- Don't use special characters in names without quoting

### When YAML is Better

**YAML excels for:**
- Agents with many structured examples
- Programmatic agent generation
- Configuration-heavy agents
- Agents used in automation
- Simple, data-focused agents
- Agents needing strong validation

**Example use case:**
```yaml
# API endpoint agent with 20+ examples
name: api-endpoint-generator
examples:
  - name: GET endpoint
    user: Create GET /users
    assistant: "..."
  - name: POST endpoint
    user: Create POST /users
    assistant: "..."
  # 18 more examples...
```

### When Markdown is Better

**Markdown excels for:**
- Agents with extensive tutorials
- Agents with rich formatting needs
- Agents requiring code examples with syntax highlighting
- Agents with diagrams or tables
- Human-focused documentation
- Narrative instructions

**Example use case:**
```markdown
## Complex Workflow Explanation

This agent follows a sophisticated workflow...

| Phase | Duration | Tools |
|-------|----------|-------|
| Discovery | 5 min | Grep, Glob |

```typescript
// Example implementation
const component = buildComponent();
```
```

---

## Examples

### Example 1: Simple Code Formatter

**File:** `agents/formatter.agent.yaml`

```yaml
name: formatter
description: Format code files according to project standards
version: 1.0.0

role:
  identity: Code Formatter
  mission: Ensure consistent code formatting across the project

tools:
  - Read
  - Write
  - Bash

instructions:
  constraints:
    - Always backup files before formatting
    - Use project-specific formatter configuration
    - Preserve file permissions

  workflow:
    - phase: Read and Analyze
      objective: Understand file and detect language
      steps:
        - Read the target file
        - Detect programming language from extension
        - Check for project formatter config

    - phase: Format
      objective: Apply formatting
      steps:
        - Run appropriate formatter (prettier, black, gofmt)
        - Capture formatted output

    - phase: Write
      objective: Save formatted file
      steps:
        - Write formatted content back to file
        - Report formatting changes

formatting:
  style: Concise and direct
  templates:
    success: "Formatted {file} ({changes} changes)"
    error: "Failed to format {file}: {reason}"
```

### Example 2: Complex React Component Builder

**File:** `agents/react-builder.agent.yaml`

```yaml
name: react-builder
description: Build production-ready React components with TypeScript and tests
version: 2.1.0

role:
  identity: React Component Architect
  expertise:
    - React 19 with TypeScript
    - React Testing Library
    - Component composition patterns
    - Accessibility (a11y)
    - Performance optimization
  mission: Create maintainable, tested, accessible React components

tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep

instructions:
  constraints:
    - Always use TypeScript strict mode
    - Export component as named export
    - Include JSDoc comments for props
    - Follow project naming conventions
    - Add accessibility attributes

  workflow:
    - phase: "Phase 1: Discovery"
      objective: Understand existing patterns
      steps:
        - Use Glob to find similar components
        - Use Grep to search for patterns
        - Read component examples

    - phase: "Phase 2: Create Component"
      objective: Write component file
      steps:
        - Define TypeScript props interface
        - Implement component with hooks
        - Add error boundaries if needed
        - Include accessibility attributes

    - phase: "Phase 3: Create Tests"
      objective: Write comprehensive tests
      steps:
        - Create test file with RTL
        - Test rendering
        - Test user interactions
        - Test accessibility

    - phase: "Phase 4: Validate"
      objective: Run quality checks
      steps:
        - Run TypeScript compiler
        - Run tests
        - Check formatting

examples:
  - name: Button Component
    user: Create a button component with loading state
    assistant: |
      I'll create a Button component with TypeScript props and loading state.
      Creating Button.tsx with type-safe props and Button.test.tsx with RTL tests.

  - name: Form Input
    user: Build a form input with validation
    assistant: |
      Creating FormInput component with validation, error display, and accessibility.
      Including tests for validation logic and error states.

formatting:
  style: Professional and detailed
  templates:
    success: |
      Component created successfully:
      - {component}.tsx ({lines} lines)
      - {component}.test.tsx ({tests} tests)
      All quality checks passed.
```

### Example 3: Conversion from Markdown

**Before (Markdown):**
```markdown
---
name: test-generator
description: Generate tests for existing code
version: 1.0.0
---

<role>
  <identity>Test Generator</identity>
</role>

<instructions>
  1. Read source file
  2. Generate test cases
  3. Write test file
</instructions>
```

**After (YAML):**
```yaml
name: test-generator
description: Generate tests for existing code
version: 1.0.0

role:
  identity: Test Generator

instructions:
  workflow:
    - phase: Generate Tests
      steps:
        - Read source file
        - Generate test cases
        - Write test file
```

---

## Summary

YAML agents provide a **cleaner, more structured** alternative to markdown for agent definitions:

**Key Benefits:**
- Machine-parseable with schema validation
- Less verbose for structured data
- Better tooling support (autocomplete, linting)
- Ideal for programmatic generation

**Use YAML when:**
- Agent is data-heavy (many examples, rules)
- You need strong validation
- Agent is simple and concise
- Working in automation pipelines

**Use Markdown when:**
- Agent has extensive documentation
- You need rich formatting
- Human readability is priority

Both formats are **fully compatible** with Claude Code and can be mixed within the same plugin.

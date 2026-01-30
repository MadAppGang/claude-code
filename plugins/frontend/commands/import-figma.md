---
description: Intelligently clean up temporary artifacts and development files from the project
allowed-tools: Task, TaskCreate, TaskUpdate, TaskList, TaskGet, Read, Write, Edit, Glob, Bash, AskUserQuestion, mcp__figma__get_design_context
---

# Import Figma Make Component

Automates importing UI components from **Figma Make** projects into your React project with validation and iterative fixing.

**Important:** This command works with **Figma Make** projects (URLs with `/make/` path), not regular Figma design files. Make projects contain actual working React/TypeScript code that can be imported directly.

## Prerequisites

- **Figma Make project URL** must be in CLAUDE.md under "Design Resources"
- Component must exist in your Make project
- Development server should be running: `pnpm dev`
- Figma MCP server must be authenticated (run `/configure-mcp` if needed)
- **MCP Resources support** must be available (required for fetching Make files)

## Getting the Figma Make URL

**Need help getting Figma Make URLs?** See the complete guide: [docs/figma-integration-guide.md](../../../docs/figma-integration-guide.md)

### Quick Instructions

1. **Create or open a Make project** in Figma (figma.com/make)
2. **Select the component** you want to export in your Make project
3. **Copy the URL** from the browser address bar
4. **Ensure the URL includes `/make/` in the path**

Expected URL format:
```
https://www.figma.com/make/{projectId}/{projectName}?node-id={nodeId}
```

**Real Example:**
```
https://www.figma.com/make/DfMjRj4FzWcDHHIGRsypcM/Implement-Screen-in-Shadcn?node-id=0-1&t=GZmiQgdDkZ6PjFRG-1
```

Add this URL to your `CLAUDE.md` under the "Design Resources" section:

```markdown
## Design Resources

**Figma Make Project**: https://www.figma.com/make/DfMjRj4FzWcDHHIGRsypcM/Implement-Screen-in-Shadcn?node-id=0-1&t=GZmiQgdDkZ6PjFRG-1
```

**Important:** The URL must contain `/make/` not `/file/` or `/design/` - only Make projects have importable code.

## Workflow Overview

This command will:
1. Read CLAUDE.md and extract Figma Make project URL
2. Fetch component files from Make using **MCP Resources**
3. List available files from Make project
4. Select component code to import
5. Analyze and adapt component code for your project structure
6. Check for name collisions and prompt user if needed
7. Install any missing dependencies via pnpm
8. Create component file in appropriate location
9. Create test route at /playground/{component-name}
10. Invoke tester agent for validation
11. Apply fixes if validation fails (up to 5 iterations)
12. Update CLAUDE.md with component mapping
13. Present comprehensive summary

**What makes this different:** Unlike traditional Figma design imports, Make projects contain real working code. The MCP Resources integration fetches actual React/TypeScript implementations with styles, interactions, and behaviors already defined.

## Implementation Instructions

### STEP 0: Discover Project Structure

Before doing anything else, discover the project structure dynamically:

1. **Get current working directory** using Bash `pwd` command
2. **Find components directory** using Glob pattern `**/components/**/*.tsx` (exclude node_modules)
3. **Find routes directory** using Glob pattern `**/routes/**/*.tsx` (exclude node_modules)
4. **Analyze discovered paths** to determine:
   - Where components are stored (e.g., `src/components/`)
   - Where UI components are stored (e.g., `src/components/ui/`)
   - Where routes are stored (e.g., `src/routes/`)
   - Whether a playground directory exists in routes

Example discovery logic:
```typescript
// Get project root
const projectRoot = await Bash({ command: 'pwd' })

// Find existing components
const componentFiles = await Glob({ pattern: 'src/components/**/*.tsx' })
const uiComponentFiles = await Glob({ pattern: 'src/components/ui/**/*.tsx' })
const routeFiles = await Glob({ pattern: 'src/routes/**/*.tsx' })

// Determine paths based on discoveries
const hasComponentsDir = componentFiles.length > 0
const hasUiDir = uiComponentFiles.length > 0
const hasRoutesDir = routeFiles.length > 0

// Set paths based on what exists
const componentsBasePath = hasComponentsDir ? 'src/components' : 'components'
const uiComponentsPath = hasUiDir ? 'src/components/ui' : 'src/components'
const routesBasePath = hasRoutesDir ? 'src/routes' : 'routes'
const playgroundPath = `${routesBasePath}/playground`
```

5. **Store discovered paths** in variables for use throughout the command
6. **Detect package manager**:
   - Check for `pnpm-lock.yaml` → use pnpm
   - Check for `package-lock.json` → use npm
   - Check for `yarn.lock` → use yarn
   - Default to pnpm if none found

7. **Check for path aliases**:
   - Read tsconfig.json to check for `paths` configuration
   - Look for `@/*` or `~/*` aliases
   - Store whether aliases exist and what prefix to use

### Constants and Setup

```typescript
const MAX_ITERATIONS = 5
// All paths will be determined dynamically in STEP 0:
// - projectRoot
// - componentsBasePath
// - uiComponentsPath
// - routesBasePath
// - playgroundPath
// - claudeMdPath
// - packageManager ('pnpm' | 'npm' | 'yarn')
// - pathAlias ({ exists: boolean, prefix: string })
```

### STEP 1: Initialize Todo Tracking

Use Tasks to create a comprehensive task list for tracking progress:

```typescript
TaskCreate({
  todos: [
    { content: 'Discover project structure', status: 'completed', activeForm: 'Discovering project structure' },
    { content: 'Read CLAUDE.md and extract Figma URL', status: 'in_progress', activeForm: 'Reading CLAUDE.md and extracting Figma URL' },
    { content: 'Fetch component from Figma', status: 'pending', activeForm: 'Fetching component from Figma' },
    { content: 'Analyze and adapt component code', status: 'pending', activeForm: 'Analyzing and adapting component code' },
    { content: 'Check for name collisions', status: 'pending', activeForm: 'Checking for name collisions' },
    { content: 'Install required dependencies', status: 'pending', activeForm: 'Installing required dependencies' },
    { content: 'Create component file', status: 'pending', activeForm: 'Creating component file' },
    { content: 'Create test route', status: 'pending', activeForm: 'Creating test route' },
    { content: 'Run validation tests', status: 'pending', activeForm: 'Running validation tests' },
    { content: 'Update CLAUDE.md with mapping', status: 'pending', activeForm: 'Updating CLAUDE.md with mapping' },
    { content: 'Present summary to user', status: 'pending', activeForm: 'Presenting summary to user' }
  ]
})
```

### STEP 2: Read and Parse CLAUDE.md

1. **Locate CLAUDE.md** using Glob pattern: `**/CLAUDE.md` (search from project root)
   - If not found, check common locations: `./CLAUDE.md`, `./docs/CLAUDE.md`, `./.claude/CLAUDE.md`
   - If still not found, create it in project root with template structure

2. **Read CLAUDE.md file**
3. **Extract Figma URL** from "Design Resources" section
4. **Parse file key and node ID** from URL
5. **Handle errors** if URL is missing or malformed

Expected Figma URL format:
```
**Figma Make URL**: https://www.figma.com/make/{fileKey}/{fileName}?node-id={nodeId}
```

Error handling:
- If Figma URL not found, instruct user to add it to CLAUDE.md with format example
- If URL format invalid, provide correct format and ask user to fix it

Once successfully parsed:
- Extract `fileKey` from URL
- Extract `nodeId` and convert format from `123-456` to `123:456`
- Update todo: mark "Read CLAUDE.md" as completed, mark "Fetch component" as in_progress

### STEP 3: Fetch Component from Figma

Use the Figma MCP tool to fetch component design context:

```typescript
mcp__figma__get_design_context({
  fileKey: fileKey,
  nodeId: nodeId,
  clientFrameworks: 'react',
  clientLanguages: 'typescript'
})
```

Extract the `code` field from the response, which contains the component implementation.

Error handling:
- If component not found: Verify URL, node ID, and access permissions
- If unauthorized: Check Figma authentication status
- If API error: Display error message and suggest retrying

Once component code is fetched successfully:
- Store the code in a variable for adaptation
- Update todo: mark "Fetch component" as completed, mark "Analyze and adapt" as in_progress

### STEP 4: Analyze and Adapt Component Code

#### 4.1 Extract Component Name

Parse the component code to find the exported component name using regex:
```regex
/export\s+(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/
```

If component name cannot be extracted, throw error explaining that the component must have a PascalCase exported name.

#### 4.2 Adapt Imports

Apply these import transformations to adapt Figma code to our project structure:

1. **Utils import**: `from "./utils"` → `from "@/lib/utils"`
2. **Component imports**: `from "./button"` → `from "@/components/ui/button"`
3. **React namespace imports**: Add `type` keyword: `import type * as React from "react"`

#### 4.3 Ensure cn() Import

If the component uses the `cn()` utility function but doesn't import it:
- Find the React import line
- Insert `import { cn } from "@/lib/utils"` right after the React import

#### 4.4 Determine Component Location

Use this logic to determine where to save the component (using discovered paths from STEP 0):

```typescript
const usesRadixUI = code includes "@radix-ui"
const uiPrimitives = ['Button', 'Input', 'Card', 'Badge', 'Avatar', 'Alert', 'Checkbox',
                      'Select', 'Dialog', 'Dropdown', 'Menu', 'Popover', 'Tooltip',
                      'Toast', 'Tabs', 'Table', 'Form', 'Label', 'Switch', 'Slider', 'Progress']
const isPrimitive = componentName matches any uiPrimitives

if (usesRadixUI || isPrimitive) {
  // UI primitive component → use discovered uiComponentsPath
  const kebabName = toKebabCase(componentName)
  componentPath = `${projectRoot}/${uiComponentsPath}/${kebabName}.tsx`
} else {
  // Feature component → use discovered componentsBasePath
  componentPath = `${projectRoot}/${componentsBasePath}/${componentName}.tsx`
}
```

Convert PascalCase to kebab-case: `UserCard` → `user-card`

**Important**: Use the paths discovered in STEP 0, don't hardcode `src/components/`

Once adaptation is complete:
- Update todo: mark "Analyze and adapt" as completed, mark "Check for name collisions" as in_progress

### STEP 5: Check for Name Collisions

#### 5.1 Check if Component Exists

Use Glob to check if a file already exists at the determined component path.

#### 5.2 If Collision Found, Ask User

Use AskUserQuestion to prompt the user:

```typescript
AskUserQuestion({
  questions: [{
    question: `A component named "${componentName}" already exists at ${componentPath}. What would you like to do?`,
    header: "Name Collision",
    multiSelect: false,
    options: [
      { label: "Overwrite existing", description: "Replace the existing component with the new one from Figma" },
      { label: "Create versioned copy", description: `Save as ${componentName}V2.tsx (or next available version)` },
      { label: "Cancel import", description: "Abort the import process without making changes" }
    ]
  }]
})
```

#### 5.3 Handle User Decision

- **Cancel import**: Throw error to stop execution
- **Overwrite existing**: Continue with same componentPath (file will be replaced)
- **Create versioned copy**:
  - Find next available version number (V2, V3, ..., up to V99)
  - Update componentPath to versioned name
  - Update component name in the code to match versioned name

Once collision is resolved:
- Update todo: mark "Check for name collisions" as completed, mark "Install required dependencies" as in_progress

### STEP 6: Install Required Dependencies

#### 6.1 Extract Required Packages

Parse all import statements from the adapted code:
```regex
/^import\s+.*$/gm
```

For each import line, extract the module name from `from "..."`

Filter to only external packages (exclude):
- Imports starting with `@/` (our project)
- Imports starting with `.` (relative imports)
- `react` and `react-dom` (always installed)

Common packages that might be needed:
- `@radix-ui/*`
- `class-variance-authority`
- `lucide-react`
- `cmdk`
- `embla-carousel-react`
- `recharts`

#### 6.2 Check What's Already Installed

Read package.json and check both `dependencies` and `devDependencies` sections.

Filter the required packages list to only those not already installed.

#### 6.3 Install Missing Dependencies

If there are packages to install:

```bash
cd {projectRoot} && {packageManager} add {package1} {package2} ...
```

Use the detected package manager from STEP 0 (pnpm/npm/yarn).
Use Bash tool with timeout of 60000ms (1 minute).

Error handling:
- If installation fails, provide clear error message with manual installation command
- Suggest user runs `pnpm add {packages}` manually and then re-runs /import-figma

Once dependencies are installed (or confirmed already installed):
- Update todo: mark "Install required dependencies" as completed, mark "Create component file" as in_progress

### STEP 7: Create Component File

#### 7.1 Write Component File

Use Write tool to create the component file with the adapted code at the determined componentPath.

#### 7.2 Apply Code Formatting

Check which formatter is configured:
- Look for `biome.json` → use Biome
- Look for `.eslintrc*` → use ESLint
- Look for `.prettierrc*` → use Prettier

Run the appropriate formatter:

```bash
# If Biome exists:
cd {projectRoot} && {packageManager} run lint:fix {componentPath}

# If ESLint exists:
cd {projectRoot} && {packageManager} run lint {componentPath} --fix

# If Prettier exists:
cd {projectRoot} && {packageManager} run format {componentPath}
```

If formatting fails, log warning but continue (non-critical).

Once component file is created:
- Update todo: mark "Create component file" as completed, mark "Create test route" as in_progress

### STEP 8: Create Test Route

#### 8.1 Determine Test Route Path

Use the discovered routes path from STEP 0:

```typescript
const kebabName = toKebabCase(componentName) // UserCard -> user-card

// Check if playground directory exists
const playgroundExists = await Glob({ pattern: `${playgroundPath}/**` })

// Create playground directory if it doesn't exist
if (playgroundExists.length === 0) {
  await Bash({ command: `mkdir -p ${projectRoot}/${playgroundPath}` })
}

const testRoutePath = `${projectRoot}/${playgroundPath}/${kebabName}.tsx`
```

**Important**: Use the `playgroundPath` discovered in STEP 0, don't hardcode `src/routes/playground/`

#### 8.2 Analyze Component Props

Check if component has props by looking for interface/type definitions:
```regex
/(?:interface|type)\s+\w+Props\s*=?\s*{([^}]+)}/
```

#### 8.3 Generate Test Route Content

Create a test route that:
- Imports the component correctly (use discovered paths, not hardcoded @/ aliases)
- Uses TanStack Router's `createFileRoute`
- Renders the component in an isolated playground environment
- Includes heading, description, and test sections
- Uses dummy data if component has props (add TODO comment for user to customize)

**Determine import path dynamically**:
```typescript
// Calculate relative import path from test route to component
// Example: if component is in src/components/ui/button.tsx
// and test route is in src/routes/playground/button.tsx
// then import path is "../../components/ui/button"

const importPath = calculateRelativePath(testRoutePath, componentPath)
// OR use project's alias if it exists (@/ or ~/)
const hasPathAlias = await checkForPathAlias() // Check tsconfig.json or vite.config
const importStatement = hasPathAlias
  ? `import { ${componentName} } from "@/${componentsBasePath}/${componentName}"`
  : `import { ${componentName} } from "${importPath}"`
```

Template structure (with dynamic import):
```typescript
import { createFileRoute } from "@tanstack/react-router"
${importStatement}

export const Route = createFileRoute("/playground/${kebabName}")({
  component: PlaygroundComponent,
})

function PlaygroundComponent() {
  // Sample data if component has props

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">${componentName} Playground</h1>
          <p className="text-muted-foreground">Testing playground for ${componentName} imported from Figma</p>
        </div>

        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Default Variant</h2>
            <div className="p-6 border rounded-lg bg-card">
              <${componentName} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
```

**Important**: Don't hardcode `@/components/` - use the discovered path or calculate relative import

#### 8.4 Write and Format Test Route

- Use Write tool to create the test route file
- Run Biome formatting on the test route file

Once test route is created:
- Update todo: mark "Create test route" as completed, mark "Run validation tests" as in_progress

### STEP 9: Run Validation Tests

This is a critical step that uses an iterative validation loop with the tester agent.

#### 9.1 Initialize Loop Variables

```typescript
iteration = 0
testPassed = false
testResult = ''
```

#### 9.2 Validation Loop (Max 5 Iterations)

While `iteration < MAX_ITERATIONS` and `!testPassed`:

**A. Invoke tester Agent**

Use Task tool to invoke the tester agent with comprehensive testing instructions:

```typescript
Task({
  subagent_type: 'frontend:tester',
  description: `Test ${componentName} component`,
  prompt: `Test the ${componentName} component at /playground/${kebabName}

## Component Details
- **Name**: ${componentName}
- **Location**: ${componentPath.replace(projectRoot + '/', '')}
- **Test Route**: /playground/${kebabName}
- **Test URL**: http://localhost:5173/playground/${kebabName}

Note: Use relative paths in the test instructions, not absolute paths

## Test Scenarios

1. **Navigation Test**
   - Navigate to http://localhost:5173/playground/${kebabName}
   - Verify page loads without errors

2. **Console Check**
   - Open browser DevTools console
   - Verify no errors or warnings
   - Check for missing imports or type errors

3. **Visual Rendering**
   - Verify component renders correctly
   - Check spacing, colors, typography
   - Ensure no layout issues

4. **Interaction Testing** (if applicable)
   - Test any buttons, inputs, or interactive elements
   - Verify event handlers work correctly

5. **Responsive Testing**
   - Test at mobile (375px), tablet (768px), desktop (1440px)
   - Verify layout adapts correctly

## Pass Criteria

- ✓ No console errors
- ✓ Component renders without crashes
- ✓ Visual appearance is acceptable
- ✓ All interactions work as expected

## Report Format

Please provide:
1. **Overall Status**: PASS or FAIL
2. **Errors Found**: List any console errors
3. **Visual Issues**: Describe rendering problems (if any)
4. **Recommendations**: Suggest fixes if issues found

This is iteration ${iteration + 1} of ${MAX_ITERATIONS}.`
})
```

**B. Parse Test Result**

Check if the test result contains "Overall Status" with "PASS" (case-insensitive).

If PASS:
- Set `testPassed = true`
- Break out of loop

If FAIL and not at max iterations yet:
- Continue to fix strategy

**C. Apply Automated Fixes**

Identify common error patterns and attempt to fix them automatically:

**Fix Pattern 1: Missing Imports**

If error contains `"Cannot find module"` or `"Failed to resolve import"`:
- Extract the missing module name
- If it's a relative import (`./{name}`), convert to absolute: `@/components/ui/{name}`
- Use Edit tool to replace the import path

**Fix Pattern 2: Missing cn Import**

If error contains `"cn is not defined"` or `"Cannot find name 'cn'"`:
- Read the component file
- Check if cn is already imported
- If not, add `import { cn } from "@/lib/utils"` after React import
- Use Write tool to update file

**Fix Pattern 3: Wrong Import Path**

If error suggests component not found:
- Check if the imported component exists in a different location
- Try alternative paths: `@/components/ui/{name}`, `@/components/{Name}`, etc.
- Use Edit tool to fix the import

**Fix Pattern 4: Missing Dependency**

If error mentions a missing package:
- Use pnpm to install the package
- Rebuild if necessary

**Fix Pattern 5: Type Errors**

If error mentions missing properties or type mismatches:
- Consider extending the component props interface
- Add React.ComponentProps extension if needed

After applying fixes:
- Reformat the file with Biome
- Increment iteration counter
- Loop back to invoke tester again

#### 9.3 Max Iterations Exceeded

If `iteration >= MAX_ITERATIONS` and `!testPassed`:

Use AskUserQuestion to prompt the user:

```typescript
AskUserQuestion({
  questions: [{
    question: `The ${componentName} component still has validation issues after ${MAX_ITERATIONS} fix attempts. What would you like to do?`,
    header: "Validation Failed",
    multiSelect: false,
    options: [
      { label: "Continue trying", description: "Attempt more fix iterations (may not resolve issues)" },
      { label: "Keep as-is", description: "Save component despite issues for manual fixing later" },
      { label: "Rollback changes", description: "Delete the imported component and test route" }
    ]
  }]
})
```

Handle user decision:
- **Continue trying**: Reset MAX_ITERATIONS and continue loop
- **Keep as-is**: Break loop and continue to next step (component saved with issues)
- **Rollback changes**: Delete component file and test route using Bash `rm` command, then throw error

Once validation is complete (either passed or user decided to keep/continue):
- Update todo: mark "Run validation tests" as completed, mark "Update CLAUDE.md with mapping" as in_progress

### STEP 10: Update CLAUDE.md with Mapping

#### 10.1 Prepare Mapping Entry

```typescript
const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
const status = testPassed ? '✓ Validated' : '⚠ Needs Review'
```

#### 10.2 Check if Mappings Section Exists

Read CLAUDE.md and check if it contains "## Figma Component Mappings"

**If section doesn't exist:**

Add the complete section to the end of CLAUDE.md:

```markdown

## Figma Component Mappings

Imported components from Figma with their file locations and node IDs:

| Component Name | File Path | Figma Node ID | Import Date | Status |
|----------------|-----------|---------------|-------------|--------|
| {componentName} | {relativePath} | {nodeId} | {today} | {status} |

**Note**: This registry is automatically maintained by the `/import-figma` command.
```

**If section exists:**

Find the table and append a new row:

```markdown
| {componentName} | {relativePath} | {nodeId} | {today} | {status} |
```

Use Edit tool to insert the new row.

Important: Use relative path (remove PROJECT_ROOT from path) for readability.

Once CLAUDE.md is updated:
- Update todo: mark "Update CLAUDE.md with mapping" as completed, mark "Present summary to user" as in_progress

### STEP 11: Present Summary to User

Generate and present a comprehensive summary of the import operation.

#### Summary Structure:

```markdown
# Figma Import Summary: {ComponentName}

## Status: {STATUS} {EMOJI}

### Component Details
- **Name**: {componentName}
- **Location**: {componentPath}
- **Type**: {UI Component or Feature Component}
- **Import Date**: {today}

### Test Route
- **URL**: http://localhost:5173/playground/{kebab-name}
- **File**: {testRoutePath}

### Dependencies
{If packages installed}
**Installed ({count} packages)**:
- {package1}
- {package2}
...
{Otherwise}
No new dependencies required.

### Validation Results
**Test Status**: {PASS ✓ or FAIL ✗}
**Iterations**: {iteration} of {MAX_ITERATIONS}

{If passed}
✓ All tests passed
✓ No console errors
✓ Component renders correctly

{If failed}
⚠ Validation completed with issues

Please review the component at /playground/{kebab-name} and fix any remaining issues manually.

**Test Output**:
{testResult}

### Next Steps
{If passed}
1. Visit /playground/{kebab-name} to view the component
2. Review the component code at {componentPath}
3. Integrate into your application as needed

{If failed}
1. Visit /playground/{kebab-name} to review the component
2. Check browser console for any errors
3. Manually fix issues in {componentPath}
4. Test thoroughly before production use

### Files Modified
- Created: {componentPath}
- Created: {testRoutePath}
- Updated: CLAUDE.md (component mapping added)
{If dependencies installed}
- Updated: package.json (dependencies)
- Updated: pnpm-lock.yaml (lockfile)
```

#### Final Todo Update

Mark "Present summary to user" as completed.

All 10 steps should now be marked as completed in the todo list.

---

## Error Handling Reference

Throughout execution, handle these common errors gracefully:

1. **CLAUDE.md not found**: Provide instructions to create it with Figma URL
2. **Figma URL missing**: Show exact format needed and where to add it
3. **Invalid Figma URL**: Explain correct format with example
4. **Figma API errors**: Check authentication, access, and retry
5. **Component not found**: Verify node ID and file access
6. **Name collision**: Always ask user (covered in Step 5)
7. **Dependency installation failure**: Provide manual installation command
8. **Write failures**: Check file permissions and paths
9. **Validation failures**: Use iterative fixing (covered in Step 9)
10. **Max iterations exceeded**: Always ask user (covered in Step 9)

## Helper Functions for Dynamic Path Resolution

### toKebabCase(str)
Convert PascalCase to kebab-case:
```typescript
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}
// Example: UserCard → user-card
```

### discoverProjectStructure()
Returns object with all discovered paths:
```typescript
{
  projectRoot: '/absolute/path/to/project',
  componentsBasePath: 'src/components',
  uiComponentsPath: 'src/components/ui',
  routesBasePath: 'src/routes',
  playgroundPath: 'src/routes/playground',
  hasPathAlias: true,  // @/ exists in tsconfig
  claudeMdPath: '/absolute/path/to/CLAUDE.md'
}
```

### calculateRelativePath(from, to)
Calculate relative import path between two files:
```typescript
// from: /project/src/routes/playground/button.tsx
// to: /project/src/components/ui/button.tsx
// returns: ../../components/ui/button
```

### checkForPathAlias()
Check if project uses path alias (@/ or ~/) by reading tsconfig.json or vite.config:
```typescript
// Returns: { exists: true, prefix: '@/' } or { exists: false, prefix: null }
```

## Important Notes

- **DO NOT hardcode any paths** - always use discovered paths from STEP 0
- **All file paths must be absolute** when using tools (construct using projectRoot + relativePath)
- **Use package manager from project** - detect pnpm/npm/yarn by checking lock files
- Apply Biome formatting after all file creation/edits
- Keep user informed via task updates throughout
- Use Task tool only for tester agent (no other agents)
- Maximum 5 validation iterations before asking user
- Always provide clear, actionable error messages
- Preserve user control via AskUserQuestion for critical decisions
- **Adapt to project conventions** - use existing import patterns, component structure, etc.

## Testing Checklist

Before marking complete, verify:
- [ ] Component file created at correct location
- [ ] Test route accessible at /playground/{name}
- [ ] No console errors in browser
- [ ] Component renders without crashing
- [ ] CLAUDE.md updated with mapping entry
- [ ] Summary presented to user
- [ ] All todos marked as completed

---

**Command complete when all 10 steps are successfully executed and summary is presented to user.**

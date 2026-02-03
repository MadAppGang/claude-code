---
name: implement-ui
description: Implement UI components from scratch with design reference, intelligent validation, and adaptive agent switching
allowed-tools: Task, AskUserQuestion, Bash, Read, TaskCreate, TaskUpdate, TaskList, TaskGet, Glob, Grep
---

## Mission

Implement new UI components from scratch based on a design reference (Figma, screenshot, mockup) using specialized UI development agents with intelligent validation and adaptive agent switching for optimal results.

## CRITICAL: Orchestrator Constraints

**You are an ORCHESTRATOR, not an IMPLEMENTER.**

**✅ You MUST:**
- Use Task tool to delegate ALL work to agents
- Use Bash to run git commands (status, diff)
- Use Read/Glob/Grep to understand context
- Use Tasks to track workflow progress
- Use AskUserQuestion to gather inputs and preferences
- Coordinate agent workflows with smart switching logic

**❌ You MUST NOT:**
- Write or edit ANY code files directly (no Write, no Edit tools)
- Implement UI components yourself
- Fix issues yourself
- Create new files yourself
- Modify existing code yourself

**Delegation Rules:**
- ALL UI implementation → ui-developer agent
- ALL design validation → designer agent
- OPTIONAL expert fixes → ui-developer-codex agent (smart switching)

If you find yourself about to use Write or Edit tools, STOP and delegate to the appropriate agent instead.

## User Inputs

The command starts by gathering the following information from the user.

## Multi-Agent Orchestration Workflow

### PRELIMINARY: Check for Code Analysis Tools (Recommended)

**Before starting UI implementation, check if the code-analysis plugin is available:**

Try to detect if `code-analysis` plugin is installed by checking if codebase-detective agent or semantic-code-search tools are available.

**If code-analysis plugin is NOT available:**

Inform the user with this message:

```
💡 Recommendation: Install Code Analysis Plugin

For optimal UI component integration and finding existing design patterns,
we recommend installing the code-analysis plugin.

Benefits:
- 🔍 Find existing UI components and patterns to match your design system
- 🕵️ Discover styling conventions (Tailwind classes, color schemes, spacing)
- 📊 Locate similar components to maintain consistency
- 🎯 Identify where to place new components in the project structure

Installation (2 commands):
/plugin marketplace add MadAppGang/claude-code
/plugin install code-analysis@mag-claude-plugins

Repository: https://github.com/MadAppGang/claude-code

You can continue without it, but investigation of existing UI patterns will be less efficient.
```

**If code-analysis plugin IS available:**

Great! You can use the codebase-detective agent to investigate existing UI components,
styling patterns, and the best location for the new component.

**Then proceed with the UI implementation workflow regardless of plugin availability.**

---

### PHASE 0: Initialize Workflow Todo List (MANDATORY FIRST STEP)

**BEFORE** starting, create a global workflow todo list using Tasks:

```
TaskCreate with the following items:
- content: "PHASE 1: Gather user inputs (design reference, component description, preferences)"
  status: "in_progress"
  activeForm: "PHASE 1: Gathering user inputs"
- content: "PHASE 1: Validate inputs and find target location for implementation"
  status: "pending"
  activeForm: "PHASE 1: Validating inputs"
- content: "PHASE 2: Launch UI Developer for initial implementation from scratch"
  status: "pending"
  activeForm: "PHASE 2: Initial UI implementation"
- content: "PHASE 3: Start validation and iterative fixing loop (max 10 iterations)"
  status: "pending"
  activeForm: "PHASE 3: Validation and fixing loop"
- content: "PHASE 3: Quality gate - ensure design fidelity achieved"
  status: "pending"
  activeForm: "PHASE 3: Design fidelity quality gate"
- content: "PHASE 3: User manual validation (conditional - if enabled by user)"
  status: "pending"
  activeForm: "PHASE 3: User manual validation"
- content: "PHASE 4: Generate final implementation report"
  status: "pending"
  activeForm: "PHASE 4: Generating final report"
- content: "PHASE 4: Present results and complete handoff"
  status: "pending"
  activeForm: "PHASE 4: Presenting results"
```

**Update this global todo list** as you progress through each phase.

### PHASE 1: Gather User Inputs

**Step 1: Ask for Design Reference**

Use AskUserQuestion or simple text prompt to ask:

```
Please provide the design reference for the UI component you want to implement:

Options:
1. Figma URL (e.g., https://figma.com/design/abc123.../node-id=136-5051)
2. Screenshot file path (local file on your machine)
3. Remote URL (live design reference at a URL)

What is your design reference?
```

Store the user's response as `design_reference`.

**Step 2: Ask for Component Description**

Ask:
```
What UI component(s) do you want to implement from this design?

Examples:
- "User profile card component"
- "Navigation header with mobile menu"
- "Product listing grid with filters"
- "Dashboard layout with widgets"

What component(s) should I implement?
```

Store the user's response as `component_description`.

**Step 3: Ask for Target Location**

Ask:
```
Where should I create this component?

Options:
1. Provide a specific directory path (e.g., "src/components/profile/")
2. Let me suggest based on component type
3. I'll tell you after seeing the component structure

Where should I create the component files?
```

Store the user's response as `target_location`.

**Step 4: Ask for Application URL**

Ask:
```
What is the URL where I can preview the implementation?

Examples:
- http://localhost:5173 (Vite default)
- http://localhost:3000 (Next.js/CRA default)
- https://staging.yourapp.com

What is the preview URL?
```

Store the user's response as `app_url`.

**Step 5: Ask for UI Developer Codex Preference**

Use AskUserQuestion:
```
Would you like to enable UI Developer Codex for intelligent agent switching?

When enabled:
- If UI Developer struggles (2 consecutive failures), switches to UI Developer Codex
- If UI Developer Codex struggles (2 consecutive failures), switches back to UI Developer
- Provides adaptive fixing with both agents for best results

Enable UI Developer Codex for intelligent switching?
```

Options:
- "Yes - Enable intelligent agent switching with Codex"
- "No - Use only UI Developer agent"

Store the user's choice as `codex_enabled` (boolean).

**Step 6: Ask for Manual Validation Preference**

Use AskUserQuestion:
```
Do you want to include manual validation in the workflow?

Manual validation means you will manually review the implementation after automated validation passes, and can provide feedback if you find issues.

Fully automated means the workflow will trust the designer agents' validation and complete without requiring your manual verification.
```

Options:
- "Yes - Include manual validation (I will verify the implementation myself)"
- "No - Fully automated (trust the designer agents' validation only)"

Store the user's choice as `manual_validation_enabled` (boolean).

**Step 7: Validate Inputs**

- **TaskUpdate**: Mark "PHASE 1: Gather user inputs" as completed
- **TaskUpdate**: Mark "PHASE 1: Validate inputs" as in_progress

**Validate Design Reference:**
- If contains "figma.com" → Figma design
- If starts with "http://" or "https://" → Remote URL
- If starts with "/" or "~/" → Local file path
- Verify format is valid

**Validate Component Description:**
- Must not be empty
- Should describe what to implement

**Validate Target Location:**
- If path provided, verify directory exists or can be created
- If "suggest", analyze project structure and suggest location
- If "tell me later", defer until after seeing component

**Validate Application URL:**
- Must be valid URL format
- Should be accessible (optional check)

If any validation fails, re-ask for that specific input.

- **TaskUpdate**: Mark "PHASE 1: Validate inputs" as completed

### PHASE 1.5: Task Analysis & Decomposition

**CRITICAL: Before implementing anything, decompose the work into independent, isolated tasks to avoid breaking changes.**

**Step 1: Launch Architect for Task Analysis**

- **TaskUpdate**: Mark "PHASE 1.5: Analyze and decompose implementation tasks" as in_progress

Use Task tool with `subagent_type: frontend:architect`:

```
Analyze the design reference and decompose the implementation into independent, isolated tasks.

**Design Reference**: [design_reference]
**Component Description**: [component_description]
**Target Location**: [target_location]

**Your Task:**

1. **Analyze the design reference thoroughly:**
   - If Figma: Use Figma MCP to fetch design and inspect component structure
   - If Screenshot/URL: Use Read or WebFetch to analyze visual structure
   - Identify all distinct UI components, screens, and features
   - Understand the component hierarchy and relationships

2. **Decompose into independent tasks:**
   - Break down into atomic, isolated implementation units
   - Each task should represent ONE component, screen, or feature
   - Each task should modify DIFFERENT files (no overlap)
   - Tasks should be as independent as possible

3. **For each task, provide:**
   - **Task ID**: Unique identifier (e.g., "task-1", "task-2")
   - **Task Name**: Clear, descriptive name (e.g., "UserAvatar Component")
   - **Description**: What this task implements (2-3 sentences)
   - **Files**: Which files this task will create/modify (be specific)
   - **Dependencies**: Which task IDs this depends on (empty array if none)
   - **Priority**: Number 1-5 (1 = implement first, 5 = implement last)
   - **Design Section**: Specific part of design this task addresses
   - **Complexity**: "low", "medium", or "high"

4. **Identify dependencies:**
   - Task B depends on Task A if B uses/imports components from A
   - Example: "UserProfile card" depends on "UserAvatar component"
   - Minimize dependencies to enable parallel execution

5. **Determine execution strategy:**
   - Group tasks by priority level
   - Priority 1 tasks have no dependencies → can run in parallel
   - Priority 2 tasks depend on Priority 1 → wait for Priority 1
   - etc.

6. **Output format:**

Return a structured task list in this EXACT format:

```json
{
  "tasks": [
    {
      "id": "task-1",
      "name": "UserAvatar Component",
      "description": "Circular avatar component with image display, fallback initials, online status indicator, and size variants (sm/md/lg).",
      "files": ["src/components/UserAvatar.tsx"],
      "dependencies": [],
      "priority": 1,
      "designSection": "User Avatar (top-left of profile card)",
      "complexity": "low"
    },
    {
      "id": "task-2",
      "name": "UserProfile Card Component",
      "description": "Card component displaying user information, statistics, and action buttons. Imports and uses UserAvatar component.",
      "files": ["src/components/UserProfile.tsx"],
      "dependencies": ["task-1"],
      "priority": 2,
      "designSection": "Complete profile card with avatar, name, stats",
      "complexity": "medium"
    }
  ],
  "executionStrategy": {
    "round1": ["task-1"],
    "round2": ["task-2"]
  },
  "summary": "Decomposed into 2 tasks: 1 atomic component (avatar) and 1 composite component (profile card). Avatar will be implemented first, then profile card will integrate it."
}
```

**Important Guidelines:**
- Create SMALL, focused tasks (one component each)
- Ensure tasks don't overlap in files they modify
- Minimize dependencies (enables parallel execution)
- Be specific about which files each task touches
- If design has 5 components, create 5 separate tasks
- Each task should take 1-3 iterations to complete (not 10+)

Return the complete task decomposition plan.
```

Wait for architect agent to return task decomposition plan.

**Step 2: Review and Validate Task Decomposition**

After architect returns the task plan:

1. **Validate task structure:**
   - Each task has all required fields
   - File paths are specific (not vague)
   - Dependencies form a valid DAG (no cycles)
   - Tasks are truly independent (minimal overlap)

2. **Present task plan to user:**

```
📋 Implementation Task Plan

I've analyzed the design and decomposed it into [N] independent tasks:

**Round 1 (Parallel - No Dependencies):**
- Task 1: [name] - [files]
- Task 3: [name] - [files]

**Round 2 (After Round 1):**
- Task 2: [name] - [files] (depends on Task 1)

**Round 3 (After Round 2):**
- Task 4: [name] - [files] (depends on Task 2, Task 3)

**Execution Strategy:**
Each task will run in its own focused loop:
- Implement → Validate → Fix → Validate → Complete
- Tasks in same round run in PARALLEL
- Changes to Task 1 won't break Task 2 (isolated files)

This approach ensures:
✅ Small, focused iterations
✅ No breaking changes between tasks
✅ Parallel execution for speed
✅ Clear progress tracking

Proceed with this plan?
```

3. **Get user confirmation:**

Use AskUserQuestion:
```
Does this task decomposition plan look good?

Options:
- "Yes - Proceed with this plan"
- "No - I want to adjust the tasks" (ask for feedback)
```

If user says "No":
- Ask: "What adjustments would you like?"
- Collect feedback
- Re-run architect with updated requirements
- Present revised plan

If user says "Yes":
- Store task plan for execution
- Proceed to PHASE 2

- **TaskUpdate**: Mark "PHASE 1.5: Analyze and decompose implementation tasks" as completed

### PHASE 2: Multi-Task Parallel Implementation

**CRITICAL: Execute tasks in rounds based on dependencies. Tasks in same round run IN PARALLEL.**

- **TaskUpdate**: Mark "PHASE 2: Multi-task parallel implementation" as in_progress

**Execution Strategy:**

From the task decomposition plan, we have an `executionStrategy` that groups tasks by dependency level:
```json
{
  "round1": ["task-1", "task-3", "task-4"],  // No dependencies
  "round2": ["task-2", "task-5"],            // Depend on round1
  "round3": ["task-6"]                       // Depends on round2
}
```

For each round:

**Step 1: Execute Round N Tasks in Parallel**

For each task in current round:

1. **Prepare task-specific context:**
   - Extract task details from decomposition plan
   - Identify task's design section
   - Identify task's files
   - Identify task's dependencies (should be already complete)

2. **Launch UI Developer for THIS task only:**

Use Task tool with `subagent_type: frontend:ui-developer` (one per task, all in parallel if multiple tasks):

```
Implement ONLY the following specific task. Do NOT implement other tasks.

**Task ID**: [task.id]
**Task Name**: [task.name]
**Task Description**: [task.description]

**Design Reference**: [design_reference]
**Focus on Design Section**: [task.designSection]
**Files to Create/Modify**: [task.files] (ONLY these files, no others!)
**Target Location**: [target_location]
**Application URL**: [app_url]

**Dependencies (Already Complete):**
[If task.dependencies is not empty, list completed tasks that this depends on]
- Task [dep-id]: [dep-name] → You can import from [dep-files]

**Your Task:**

1. **Analyze ONLY your design section:**
   - If Figma: Use Figma MCP to fetch design, focus on [task.designSection]
   - If Screenshot/URL: Focus on the specific section for this task
   - Understand what THIS component needs to do

2. **Implement THIS component ONLY:**
   - React 19 with TypeScript
   - Tailwind CSS 4 (utility-first, static classes only)
   - Mobile-first responsive design
   - Accessibility (WCAG 2.1 AA, ARIA attributes)
   - Match the design for THIS component exactly

3. **Create/modify ONLY the specified files:**
   - Files: [task.files]
   - Do NOT touch other files
   - Use Write tool for new files
   - Use Edit tool if modifying existing files

4. **Import dependencies if needed:**
   [If task has dependencies:]
   - Import components from completed tasks: [list dependency files]
   - Example: `import { UserAvatar } from './UserAvatar'`

5. **Ensure code quality for this task:**
   - Run typecheck: `npx tsc --noEmit`
   - Run linter: `npm run lint`
   - Fix any errors in THIS task's files only

6. **Provide implementation summary:**
   - Files created/modified for THIS task
   - Components implemented
   - Integration points with dependencies
   - Any issues or blockers

**CRITICAL CONSTRAINTS:**
- ❌ Do NOT implement other tasks
- ❌ Do NOT modify files outside [task.files]
- ❌ Do NOT try to implement everything at once
- ✅ Focus ONLY on THIS task
- ✅ Keep changes isolated to THIS task's files
- ✅ Import and use components from dependencies

Return implementation summary when complete.
```

**IMPORTANT: If multiple tasks in this round, launch ALL of them IN PARALLEL using a SINGLE message with MULTIPLE Task tool calls.**

Example for Round 1 with 3 tasks:
```
Single message with:
- Task tool call for task-1 (ui-developer)
- Task tool call for task-3 (ui-developer)
- Task tool call for task-4 (ui-developer)

All three execute in parallel, each working on different files.
```

3. **Wait for all tasks in round to complete**

4. **Review round results:**
   - Document which tasks completed successfully
   - Document files created for each task
   - Note any issues or blockers per task

**Step 2: Move to Next Round**

- If more rounds exist, repeat Step 1 for next round
- If all rounds complete, proceed to PHASE 3

- **TaskUpdate**: Mark "PHASE 2: Multi-task parallel implementation" as completed

### PHASE 3: Per-Task Validation Loops

**CRITICAL: Each task gets its own isolated validation loop. Changes to Task 1 won't break Task 2.**

- **TaskUpdate**: Mark "PHASE 3: Per-task validation and fixing loops" as in_progress

**For EACH task from the decomposition plan (in execution order):**

### Task Loop: [Task ID] - [Task Name]

**Initialize task loop variables:**
```
task_iteration_count = 0
max_task_iterations = 5  // Per task, not global
task_design_fidelity_achieved = false
task_issues_history = []
```

Log: "Starting validation loop for Task [task.id]: [task.name]"

**Loop: While task_iteration_count < max_task_iterations AND NOT task_design_fidelity_achieved**

**Step 3.1: Launch Designer Agent(s) for Task-Focused Parallel Validation**

**IMPORTANT**:
- Validate ONLY THIS TASK's component/screen
- Launch designer and designer-codex IN PARALLEL (if Codex enabled)
- Focus validation on THIS TASK's design section and files

**Designer Agent** (always runs):

Use Task tool with `subagent_type: frontend:designer`:

```
Review ONLY the component(s) for Task [task.id] against the design reference.

**CRITICAL**:
- Be PRECISE and CRITICAL
- Validate ONLY this task's component
- Do NOT validate other tasks' components
- Focus on [task.designSection] in the design

**Task ID**: [task.id]
**Task Name**: [task.name]
**Task Files**: [task.files]
**Design Reference**: [design_reference]
**Design Section to Validate**: [task.designSection]
**Application URL**: [app_url]
**Iteration**: [task_iteration_count + 1] / [max_task_iterations]

**Your Task:**

1. Fetch design reference and focus on [task.designSection]
2. Capture implementation screenshot, focus on THIS component only
3. Validate ONLY THIS component:
   - Colors, typography, spacing, layout
   - Visual elements, responsive design
   - Accessibility (WCAG 2.1 AA)
   - Interactive states

4. Document discrepancies in THIS component only
5. Categorize by severity (CRITICAL/MEDIUM/LOW)
6. Provide fixes specific to [task.files]
7. Calculate design fidelity score

**SCOPE RESTRICTION**:
- ❌ Do NOT validate other components
- ❌ Do NOT report issues in other files
- ✅ Focus ONLY on [task.files]
- ✅ Validate ONLY [task.designSection]

Return design review report for THIS task only.
```

**Designer-Codex Agent** (if Codex enabled):

If user enabled Codex review, launch IN PARALLEL with designer:

Use Task tool with `subagent_type: frontend:designer-codex`:

```
Review ONLY the component(s) for Task [task.id] against the design reference.

CRITICAL INSTRUCTION: Be PRECISE and CRITICAL. Validate ONLY this task's component.

**Task ID**: [task.id]
**Task Name**: [task.name]
**Task Files**: [task.files]
**Design Reference**: [design_reference]
**Design Section**: [task.designSection]
**Application URL**: [app_url]
**Iteration**: [task_iteration_count + 1] / [max_task_iterations]

VALIDATION CRITERIA:
[Same as before: Colors, Typography, Spacing, Layout, Visual Elements, Responsive, Accessibility]

TECH STACK:
- React 19 with TypeScript
- Tailwind CSS 4
- Design System: [if applicable]

INSTRUCTIONS:
Compare [task.designSection] from design reference with implementation at [app_url].

Validate ONLY THIS component. Do NOT validate other components.

Provide comprehensive report categorized as CRITICAL/MEDIUM/LOW.

For EACH finding:
1. Category
2. Severity
3. Issue description with exact values
4. Expected vs Actual
5. Recommended fix (specific to [task.files])
6. Rationale

Calculate design fidelity score and provide PASS/NEEDS IMPROVEMENT/FAIL.

SCOPE: Focus ONLY on [task.files] and [task.designSection].
```

**Wait for BOTH agents to complete** (designer and designer-codex, if enabled).

**Designer Agent** (always runs):

Use Task tool with `subagent_type: frontend:designer`:

```
Review the implemented UI component against the design reference and provide a detailed design fidelity report.

**CRITICAL**: Be PRECISE and CRITICAL. Do not try to make everything look good. Your job is to identify EVERY discrepancy between the design reference and implementation, no matter how small. Focus on accuracy and design fidelity.

**Iteration**: [iteration_count + 1] / [max_iterations]
**Design Reference**: [design_reference]
**Component Description**: [component_description]
**Implementation File(s)**: [List of files created in Phase 2 or updated in fixes]
**Application URL**: [app_url]

**Your Task:**

1. Fetch the design reference screenshot (Figma MCP / Chrome DevTools / Read file)
2. Capture the implementation screenshot at [app_url]
3. Perform comprehensive design review:
   - Colors & theming
   - Typography
   - Spacing & layout
   - Visual elements
   - Responsive design
   - Accessibility (WCAG 2.1 AA)
   - Interactive states

4. Document ALL discrepancies with specific values
5. Categorize issues by severity (CRITICAL/MEDIUM/LOW)
6. Provide actionable fixes with code snippets
7. Calculate design fidelity score (X/60)

8. **Provide overall assessment:**
   - PASS ✅ (implementation matches design, score >= 54/60)
   - NEEDS IMPROVEMENT ⚠️ (some issues, score 40-53/60)
   - FAIL ❌ (significant issues, score < 40/60)

**REMEMBER**: Be PRECISE and CRITICAL. Identify ALL discrepancies. Do not be lenient.

Return detailed design review report with issue count and assessment.
```

**Designer-Codex Agent** (if Codex enabled):

If user enabled Codex for intelligent switching, launch designer-codex agent IN PARALLEL with designer agent:

Use Task tool with `subagent_type: frontend:designer-codex`:

```
You are an expert UI/UX designer reviewing a component implementation against a reference design.

CRITICAL INSTRUCTION: Be PRECISE and CRITICAL. Do not try to make everything look good.
Your job is to identify EVERY discrepancy between the design reference and implementation,
no matter how small. Focus on accuracy and design fidelity.

ITERATION: [iteration_count + 1] / [max_iterations]

DESIGN CONTEXT:
- Component: [component_description]
- Design Reference: [design_reference]
- Implementation URL: [app_url]
- Implementation Files: [List of files]

VALIDATION CRITERIA:

1. **Colors & Theming**
   - Brand colors accuracy (primary, secondary, accent)
   - Text color hierarchy (headings, body, muted)
   - Background colors and gradients
   - Border and divider colors
   - Hover/focus/active state colors

2. **Typography**
   - Font families (heading vs body)
   - Font sizes (all text elements)
   - Font weights (regular, medium, semibold, bold)
   - Line heights and letter spacing
   - Text alignment

3. **Spacing & Layout**
   - Component padding (all sides)
   - Element margins and gaps
   - Grid/flex spacing
   - Container max-widths
   - Alignment (center, left, right, space-between)

4. **Visual Elements**
   - Border radius (rounded corners)
   - Border widths and styles
   - Box shadows (elevation levels)
   - Icons (size, color, positioning)
   - Images (aspect ratios, object-fit)
   - Dividers and separators

5. **Responsive Design**
   - Mobile breakpoint behavior (< 640px)
   - Tablet breakpoint behavior (640px - 1024px)
   - Desktop breakpoint behavior (> 1024px)
   - Layout shifts and reflows
   - Touch target sizes (minimum 44x44px)

6. **Accessibility (WCAG 2.1 AA)**
   - Color contrast ratios (text: 4.5:1, large text: 3:1)
   - Focus indicators
   - ARIA attributes
   - Semantic HTML
   - Keyboard navigation

TECH STACK:
- React 19 with TypeScript
- Tailwind CSS 4
- Design System: [shadcn/ui, MUI, custom, or specify if detected]

INSTRUCTIONS:
Compare the design reference and implementation carefully.

Provide a comprehensive design validation report categorized as:
- CRITICAL: Must fix (design fidelity errors, accessibility violations, wrong colors)
- MEDIUM: Should fix (spacing issues, typography mismatches, minor design deviations)
- LOW: Nice to have (polish, micro-interactions, suggestions)

For EACH finding provide:
1. Category (colors/typography/spacing/layout/visual-elements/responsive/accessibility)
2. Severity (critical/medium/low)
3. Specific issue description with exact values
4. Expected design specification
5. Current implementation
6. Recommended fix with specific Tailwind CSS classes or hex values
7. Rationale (why this matters for design fidelity)

Calculate a design fidelity score:
- Colors: X/10
- Typography: X/10
- Spacing: X/10
- Layout: X/10
- Accessibility: X/10
- Responsive: X/10
Overall: X/60

Provide overall assessment: PASS ✅ | NEEDS IMPROVEMENT ⚠️ | FAIL ❌

REMEMBER: Be PRECISE and CRITICAL. Identify ALL discrepancies. Do not be lenient.

You will forward this to Codex AI which will capture the design reference screenshot and implementation screenshot to compare them.
```

**Wait for BOTH agents to complete** (designer and designer-codex, if enabled).

**Step 3.2: Consolidate Design Review Results**

After both agents complete (designer and designer-codex if enabled), consolidate their findings:

**If only designer ran:**
- Use designer's report as-is
- Extract:
  - Overall assessment: PASS / NEEDS IMPROVEMENT / FAIL
  - Issue count (CRITICAL + MEDIUM + LOW)
  - Design fidelity score
  - List of issues found

**If both designer and designer-codex ran:**
- Compare findings from both agents
- Identify common issues (flagged by both) → Highest priority
- Identify issues found by only one agent → Review for inclusion
- Create consolidated issue list with:
  - Issue description
  - Severity (use highest severity if both flagged)
  - Source (designer, designer-codex, or both)
  - Recommended fix

**Consolidation Strategy:**
- Issues flagged by BOTH agents → CRITICAL (definitely needs fixing)
- Issues flagged by ONE agent with severity CRITICAL → CRITICAL (trust the expert)
- Issues flagged by ONE agent with severity MEDIUM → MEDIUM (probably needs fixing)
- Issues flagged by ONE agent with severity LOW → LOW (nice to have)

Create a consolidated design review report:
```markdown
# Consolidated Design Review (Iteration X)

## Sources
- ✅ Designer Agent (human-style design expert)
[If Codex enabled:]
- ✅ Designer-Codex Agent (external Codex AI expert)

## Issues Found

### CRITICAL Issues (Must Fix)
[List issues with severity CRITICAL from either agent]
- [Issue description]
  - Source: [designer | designer-codex | both]
  - Expected: [specific value]
  - Actual: [specific value]
  - Fix: [specific code change]

### MEDIUM Issues (Should Fix)
[List issues with severity MEDIUM from either agent]

### LOW Issues (Nice to Have)
[List issues with severity LOW from either agent]

## Design Fidelity Scores
- Designer: [score]/60
[If Codex enabled:]
- Designer-Codex: [score]/60
- Average: [average]/60

## Overall Assessment
[PASS ✅ | NEEDS IMPROVEMENT ⚠️ | FAIL ❌]

Based on consensus from [1 or 2] design validation agent(s).
```

Set `current_issues_count` = total consolidated issue count.

**Step 3.3: Check if Design Fidelity Achieved**

IF designer assessment is "PASS":
- Set `design_fidelity_achieved = true`
- Log: "✅ Automated design fidelity validation passed! Component appears to match design reference."
- **TaskUpdate**: Mark "PHASE 3: Quality gate - ensure design fidelity achieved" as completed
- **DO NOT exit loop yet** - proceed to Step 3.3.5 for user validation (conditional based on user preference)

**Step 3.3.5: User Manual Validation Gate** (Conditional based on user preference)

**Check Manual Validation Preference:**

IF `manual_validation_enabled` is FALSE (user chose "Fully automated"):
- Log: "✅ Automated validation passed! Skipping manual validation per user preference."
- Set `user_approved = true` (trust automated validation)
- **Exit validation loop** (proceed to PHASE 4)
- Skip the rest of this step

IF `manual_validation_enabled` is TRUE (user chose "Include manual validation"):
- Proceed with manual validation below

**IMPORTANT**: When manual validation is enabled, the user must manually verify the implementation against the real design reference.

Even when designer agents claim "PASS", automated validation can miss subtle issues.

**Present to user:**

```
🎯 Automated Validation Passed - User Verification Required

The designer agent has reviewed the implementation and reports that it matches the design reference.

However, automated validation can miss subtle issues. Please manually verify the implementation:

**What to Check:**
1. Open the application at: [app_url]
2. Navigate to the implemented component: [component_description]
3. Compare against design reference: [design_reference]
4. Check for:
   - Colors match exactly
   - Spacing and layout are pixel-perfect
   - Typography (fonts, sizes, weights) match
   - Interactive states work correctly (hover, focus, active)
   - Responsive design works on different screen sizes
   - Accessibility features work properly
   - Overall visual fidelity matches the design

**Current Implementation Status:**
- Iterations completed: [iteration_count]
- Last designer assessment: PASS ✅
- Design fidelity score: [score]/60

Please test the implementation and let me know:
```

Use AskUserQuestion to ask:
```
Does the implementation match the design reference?

Please manually test the UI and compare it to the design.

Options:
1. "Yes - Looks perfect, matches design exactly" → Approve and continue
2. "No - I found issues" → Provide feedback to fix issues
```

**If user selects "Yes - Looks perfect":**
- Log: "✅ User approved! Implementation verified by human review."
- Set `user_approved = true`
- **Exit validation loop** (success confirmed by user)
- Proceed to PHASE 4 (Final Report)

**If user selects "No - I found issues":**
- Ask user to provide specific feedback:
  ```
  Please describe the issues you found. You can provide:

  1. **Screenshot** - Path to a screenshot showing the issue(s)
  2. **Text Description** - Detailed description of what's wrong

  Example descriptions:
  - "The header background color is too light - should be #1a1a1a not #333333"
  - "Button spacing is wrong - there should be 24px between buttons not 16px"
  - "Font size on mobile is too small - headings should be 24px not 18px"
  - "The card shadow is missing - should have shadow-lg"

  What issues did you find?
  ```

- Collect user's feedback (text or screenshot path)
- Store feedback as `user_feedback`
- Set `design_fidelity_achieved = false` (reset, need to fix user's issues)
- Set `user_validation_needed = true`
- Log: "⚠️ User found issues. Launching UI Developer to address user feedback."
- Proceed to Step 3.3.6 (Launch UI Developer with user feedback)

**Step 3.3.6: Launch UI Developer with User Feedback** (Conditional - only if user found issues)

IF `user_validation_needed` is true:

Use Task tool with appropriate fixing agent (ui-developer or ui-developer-codex based on smart switching logic):

```
Fix the UI implementation issues identified by the USER during manual testing.

**CRITICAL**: These issues were found by a human reviewer, not automated validation.
The user manually tested the implementation and found real problems.

**Iteration**: [iteration_count + 1] / [max_iterations]
**Component**: [component_description]
**Implementation File(s)**: [List of files]
**Design Reference**: [design_reference]

**USER FEEDBACK** (Human Manual Testing):
[Paste user's complete feedback - text description or screenshot analysis]

[If screenshot provided:]
**User's Screenshot**: [screenshot_path]
Please read the screenshot to understand the visual issues the user is pointing out.

**Your Task:**
1. Read all implementation files
2. Carefully review the user's specific feedback
3. Address EVERY issue the user mentioned:
   - If user mentioned colors: Fix the exact color values
   - If user mentioned spacing: Fix to exact pixel values mentioned
   - If user mentioned typography: Fix font sizes, weights, line heights
   - If user mentioned layout: Fix alignment, max-width, grid/flex issues
   - If user mentioned interactive states: Fix hover, focus, active, disabled states
   - If user mentioned responsive: Fix mobile, tablet, desktop breakpoints
   - If user mentioned accessibility: Fix ARIA, contrast, keyboard navigation
4. Use Edit tool to modify files
5. Use modern React/TypeScript/Tailwind best practices:
   - React 19 patterns
   - Tailwind CSS 4 (utility-first, no @apply, static classes only)
   - Mobile-first responsive design
   - WCAG 2.1 AA accessibility
6. Run quality checks (typecheck, lint, build)
7. Provide detailed implementation summary explaining:
   - Each user issue addressed
   - Exact changes made
   - Files modified
   - Any trade-offs or decisions made

**IMPORTANT**: User feedback takes priority over designer agent feedback.
The user has manually tested and seen real issues that automated validation missed.

Return detailed fix summary when complete.
```

Wait for fixing agent to complete.

After fixes applied:
- Set `user_validation_needed = false`
- Increment `iteration_count`
- Update loop metrics (previous_issues_count, etc.)
- **Loop back to Step 3.1** (Re-run designer agent to validate fixes)
- The loop will eventually come back to Step 3.3.5 for user validation again

**End of Step 3.3.5 and 3.3.6**

**Step 3.4: Determine Fixing Agent (Smart Switching Logic)**

IF `design_fidelity_achieved` is false (still have issues):

**Determine which agent to use for fixes:**

```python
def determine_fixing_agent():
    # If Codex not enabled, always use UI Developer
    if not codex_enabled:
        return "ui-developer"

    # Smart switching based on consecutive failures
    if ui_developer_consecutive_failures >= 2:
        # UI Developer struggling (failed 2+ times in a row)
        # Switch to UI Developer Codex
        return "ui-developer-codex"

    if codex_consecutive_failures >= 2:
        # Codex struggling (failed 2+ times in a row)
        # Switch back to UI Developer
        return "ui-developer"

    # Default: Use UI Developer (or continue with last successful agent)
    if last_agent_used is None:
        return "ui-developer"

    # If no consecutive failures, continue with same agent
    return last_agent_used
```

Determine `fixing_agent` using the logic above.

Log agent selection:
- "Using [fixing_agent] to apply fixes (Iteration [iteration_count + 1])"
- If switched: "Switched to [fixing_agent] due to [previous_agent] consecutive failures"

**Step 3.5: Launch Fixing Agent**

**IF fixing_agent == "ui-developer":**

Use Task tool with `subagent_type: frontend:ui-developer`:

```
Fix the UI implementation issues identified in the consolidated design review from multiple validation sources.

**Iteration**: [iteration_count + 1] / [max_iterations]
**Component**: [component_description]
**Implementation File(s)**: [List of files]

**CONSOLIDATED DESIGN REVIEW** (From Multiple Independent Sources):
[Paste complete consolidated design review report from Step 3.2]

This consolidated report includes findings from:
- Designer Agent (human-style design expert)
[If Codex enabled:]
- Designer-Codex Agent (external Codex AI expert)

Issues flagged by BOTH agents are highest priority and MUST be fixed.

**Your Task:**
1. Read all implementation files
2. Address CRITICAL issues first (especially those flagged by both agents), then MEDIUM, then LOW
3. Apply fixes using modern React/TypeScript/Tailwind best practices:
   - Fix colors using correct Tailwind classes or hex values
   - Fix spacing using proper Tailwind scale (p-4, p-6, etc.)
   - Fix typography (font sizes, weights, line heights)
   - Fix layout issues (max-width, alignment, grid/flex)
   - Fix accessibility (ARIA, contrast, keyboard nav)
   - Fix responsive design (mobile-first breakpoints)
4. Use Edit tool to modify files
5. Run quality checks (typecheck, lint, build)
6. Provide implementation summary with:
   - Issues addressed
   - Which sources (designer, designer-codex, or both) flagged each issue
   - Changes made (file by file)
   - Any remaining concerns

DO NOT re-validate. Only apply the fixes.

Return detailed fix summary when complete.
```

**IF fixing_agent == "ui-developer-codex":**

Use Task tool with `subagent_type: frontend:ui-developer-codex` (proxy):

First, prepare the complete prompt for Codex:

```
You are an expert UI/UX developer reviewing and fixing a React TypeScript component implementation.

ITERATION: [iteration_count + 1] / [max_iterations]

DESIGN CONTEXT:
- Component: [component_description]
- Design Reference: [design_reference]
- Implementation Files: [List of file paths]

CONSOLIDATED DESIGN REVIEW (From Multiple Independent Sources):
[Paste complete consolidated design review report from Step 3.2]

This consolidated report includes findings from:
- Designer Agent (human-style design expert)
- Designer-Codex Agent (external Codex AI expert)

Issues flagged by BOTH agents are highest priority.

CURRENT IMPLEMENTATION CODE:
[Use Read tool to gather all component files and paste code here]

TECH STACK:
- React 19 with TypeScript
- Tailwind CSS 4
- [Design system if applicable: shadcn/ui, etc.]

REVIEW STANDARDS:
1. Design Fidelity: Match design reference exactly
2. React Best Practices: Modern patterns, component composition
3. Tailwind CSS Best Practices: Proper utilities, responsive, no dynamic classes
4. Accessibility: WCAG 2.1 AA, ARIA, keyboard navigation, contrast
5. Responsive Design: Mobile-first, all breakpoints
6. Code Quality: TypeScript types, maintainability

INSTRUCTIONS:
Analyze the consolidated design feedback and current implementation.

Prioritize issues flagged by BOTH validation sources (designer + designer-codex) as these are confirmed issues.

Provide a comprehensive fix plan with:

1. **Root Cause Analysis**: Why do these issues exist?
2. **Fix Strategy**: How to address each issue category
3. **Specific Code Changes**: Exact changes needed for each file
   - File path
   - Current code
   - Fixed code
   - Explanation
   - Source(s) that flagged this issue

4. **Priority Order**: Which fixes to apply first (CRITICAL → MEDIUM → LOW, prioritize "both" sources)

Focus on providing actionable, copy-paste ready code fixes that the UI Developer can apply.

DO NOT re-validate. Only provide the fix plan and code changes.
```

Then launch the proxy agent with this complete prompt.

Wait for fixing agent to complete.

**Step 3.6: Update Loop Metrics**

Set `last_agent_used` = `fixing_agent`

**Determine if progress was made:**

```python
def check_progress():
    # First iteration - we don't have previous count yet
    if previous_issues_count is None:
        # Assume no progress yet (we just implemented, haven't fixed)
        return False

    # Compare current vs previous issue count
    if current_issues_count < previous_issues_count:
        # Improvement! Issues decreased
        return True
    else:
        # No improvement or got worse
        return False
```

`progress_made` = result of check_progress()

**Update consecutive failure tracking:**

```python
if progress_made:
    # Success! Reset all failure counters
    ui_developer_consecutive_failures = 0
    codex_consecutive_failures = 0
    log("✅ Progress made! Issue count decreased.")
else:
    # No progress - increment failure counter for agent that was used
    if last_agent_used == "ui-developer":
        ui_developer_consecutive_failures += 1
        log(f"⚠️ UI Developer did not make progress. Consecutive failures: {ui_developer_consecutive_failures}")
    elif last_agent_used == "ui-developer-codex":
        codex_consecutive_failures += 1
        log(f"⚠️ UI Developer Codex did not make progress. Consecutive failures: {codex_consecutive_failures}")
```

**Record iteration history:**

```python
iteration_history.append({
    "iteration": iteration_count + 1,
    "designer_assessment": assessment,
    "issues_count": current_issues_count,
    "design_fidelity_score": score,
    "fixing_agent_used": last_agent_used,
    "progress_made": progress_made,
    "ui_dev_failures": ui_developer_consecutive_failures,
    "codex_failures": codex_consecutive_failures
})
```

**Update for next iteration:**

```python
previous_issues_count = current_issues_count
iteration_count += 1
```

**Step 3.7: Check Loop Continuation**

IF `iteration_count >= max_iterations`:
- Log: "⚠️ Maximum iterations (10) reached."
- Ask user:
  ```
  Maximum iterations reached. Current status:
  - Issues remaining: [current_issues_count]
  - Design fidelity score: [score]/60
  - Assessment: [assessment]

  How would you like to proceed?
  ```
  Options:
  - "Continue with 10 more iterations"
  - "Accept current implementation (minor issues acceptable)"
  - "Manual review needed - stop here"

  Act based on user choice.

IF `iteration_count < max_iterations` AND NOT `design_fidelity_achieved`:
- Continue loop (go back to Step 3.1)

**End of Loop**

- **TaskUpdate**: Mark "PHASE 3: Start validation and iterative fixing loop" as completed

### PHASE 4: Final Report & Completion

**Step 1: Generate Comprehensive Implementation Report**

- **TaskUpdate**: Mark "PHASE 4: Generate final implementation report" as in_progress

Create a detailed summary including:

```markdown
# UI Implementation Report

## Component Information
- **Component Description**: [component_description]
- **Design Reference**: [design_reference]
- **Implementation Location**: [target_location]
- **Preview URL**: [app_url]

## Implementation Summary

**Files Created:**
[List all files created with their purposes]

**Components Implemented:**
[List components with descriptions]

## Validation Results

**Total Iterations**: [iteration_count] / [max_iterations]
**Automated Validation Status**: [PASS ✅ / NEEDS IMPROVEMENT ⚠️ / FAIL ❌]
**User Manual Validation**: ✅ APPROVED (after [number] user feedback cycles)
**Final Design Fidelity Score**: [score] / 60
**Final Issues Count**: [current_issues_count]
  - CRITICAL: [count]
  - MEDIUM: [count]
  - LOW: [count]
  - User-reported: [count] (all fixed ✅)

**UI Developer Codex**: [Enabled / Disabled]

**User Validation History**:
- User feedback rounds: [number]
- Issues found by user: [count]
- All user issues addressed: ✅
- Final user approval: ✅ "Looks perfect, matches design exactly"

## Iteration History

### Iteration 1
- **Designer Assessment**: [assessment]
- **Issues Found**: [count]
- **Design Fidelity Score**: [score]/60
- **Fixing Agent**: [agent]
- **Progress**: [Made progress / No progress]

### Iteration 2
...

[Continue for all iterations]

## Agent Performance

**UI Developer:**
- Iterations used: [count]
- Successful iterations (made progress): [count]
- Maximum consecutive failures: [max]

[If Codex enabled:]
**UI Developer Codex:**
- Iterations used: [count]
- Successful iterations (made progress): [count]
- Maximum consecutive failures: [max]

**Agent Switches**: [count] times
- [List each switch with reason]

## Final Component Quality

**Design Fidelity**: [Pass/Needs Improvement/Fail]
**Accessibility**: [WCAG 2.1 AA compliance status]
**Responsive Design**: [Mobile/Tablet/Desktop support]
**Code Quality**: [TypeScript/Linting/Build status]

## How to Use

**Preview the component:**
```
npm run dev
# Visit [app_url]
```

**Component location:**
```
[List file paths]
```

**Example usage:**
```typescript
[Provide example import and usage]
```

## Outstanding Items

[If any issues remain:]
- [List remaining issues]
- [Suggested next steps]

[If no issues:]
- ✅ All design specifications met
- ✅ Accessibility compliant
- ✅ Responsive across all breakpoints
- ✅ Production ready

## Recommendations

[Any suggestions for improvement, enhancement, or next steps]
```

- **TaskUpdate**: Mark "PHASE 4: Generate final implementation report" as completed

**Step 2: Present Results to User**

- **TaskUpdate**: Mark "PHASE 4: Present results and complete handoff" as in_progress

Present the summary clearly and offer next actions:

```
UI Implementation Complete!

Summary:
- Component: [component_description]
- Iterations: [iteration_count] / [max_iterations]
- Final Status: [status with emoji]
- Design Fidelity Score: [score] / 60

Files created: [count]
[List key files]

Preview at: [app_url]

[If PASS:]
✅ Component matches design reference and is ready for use!

[If not PASS:]
⚠️ Some minor issues remain. Review the detailed report above.

Would you like to:
1. View git diff of changes
2. Continue with more iterations
3. Accept and commit changes
4. Review specific issues
```

- **TaskUpdate**: Mark "PHASE 4: Present results and complete handoff" as completed

**Congratulations! UI implementation workflow completed successfully!**

## Orchestration Rules

### Agent Communication:
- Each agent receives complete context (design reference, previous feedback, etc.)
- Document all decisions and agent switches
- Maintain clear iteration history

### Smart Agent Switching:
- Track consecutive failures independently for each agent
- Switch agent after 2 consecutive failures (no progress)
- Reset counters when progress is made
- Log all switches with reasons
- Balance between UI Developer and UI Developer Codex for optimal results

### Loop Prevention:
- Maximum 10 iterations before escalating to user
- If iterations exceed limit, ask user for guidance
- Track progress at each iteration (issue count comparison)

### Error Handling:
- If any agent encounters blocking errors, pause and ask user for guidance
- Document all blockers clearly with context
- Provide options for resolution

### Quality Gates:
- Design fidelity score >= 54/60 for PASS (automated)
- Designer assessment must be PASS to proceed to user validation (if enabled)
- **User manual validation and approval (if enabled by user preference)**
- All CRITICAL issues must be resolved (including user-reported issues if manual validation enabled)
- If manual validation enabled: User must explicitly approve: "Looks perfect, matches design exactly"
- If fully automated: Trust designer agents' validation

## Success Criteria

The command is complete when:
1. ✅ UI component implemented from scratch
2. ✅ Designer validated against design reference
3. ✅ Design fidelity score >= 54/60 (or user accepted lower score)
4. ✅ **Validation complete (automated OR manual based on user preference)**
   - If manual validation enabled: User manually validated and approved the implementation
   - If fully automated: Designer agents validated and approved
5. ✅ All CRITICAL issues resolved (including user-reported issues if applicable)
6. ✅ Accessibility compliance verified (WCAG 2.1 AA)
7. ✅ Responsive design tested (mobile/tablet/desktop)
8. ✅ Code quality checks passed (typecheck/lint/build)
9. ✅ Comprehensive report provided
10. ✅ User acknowledges completion

**NOTE**: Item #4 (Validation) is flexible based on user preference selected at the beginning:
- **Manual validation mode**: Requires explicit user approval after manual testing
- **Fully automated mode**: Trusts designer agents' validation and completes without manual approval

## Smart Agent Switching Examples

### Example 1: UI Developer Struggling, Switch to Codex

```
Iteration 1:
- Designer: 8 issues found
- UI Developer applies fixes
- Designer: Still 8 issues (no progress)
- UI Developer failures: 1

Iteration 2:
- Designer: 9 issues (got worse!)
- UI Developer applies fixes
- Designer: Still 9 issues
- UI Developer failures: 2
- **Switch to UI Developer Codex**

Iteration 3:
- Designer: 4 issues (progress!)
- Codex applied better fixes
- Reset all failure counters
- Continue with Codex
```

### Example 2: Codex Struggling, Switch Back

```
Iteration 5:
- Designer: 3 issues
- UI Developer Codex applies fixes
- Designer: Still 3 issues
- Codex failures: 1

Iteration 6:
- Designer: 4 issues (got worse)
- UI Developer Codex applies fixes
- Designer: Still 4 issues
- Codex failures: 2
- **Switch back to UI Developer**

Iteration 7:
- Designer: 1 issue (progress!)
- UI Developer made progress
- Reset all failure counters
```

### Example 3: Alternating for Best Results

```
Iterations 1-2: UI Developer (no progress → 2 failures)
Iteration 3: Switch to Codex (makes progress → reset)
Iteration 4: Codex continues (makes progress)
Iteration 5: Codex (no progress → 1 failure)
Iteration 6: Codex (no progress → 2 failures)
Iteration 7: Switch to UI Developer (makes progress → reset)
Final: PASS ✅

Result: Both agents contributed to success through intelligent switching
```

## Notes

- This is an implementation-from-scratch command (different from /validate-ui which fixes existing code)
- Smart agent switching maximizes success by leveraging strengths of both agents
- UI Developer is fast and efficient for standard fixes
- UI Developer Codex provides expert analysis for complex issues
- Switching when an agent struggles prevents getting stuck
- Progress tracking ensures we don't waste iterations on ineffective approaches
- Maximum 10 iterations provides reasonable stopping point
- User always has final say on acceptable quality level
- All work happens on unstaged changes until user approves

## Quick Reference

**Command Purpose:**
- ✅ Implement UI components from scratch
- ✅ Validate against design reference
- ✅ Iterative fixing with intelligent agent switching
- ✅ Achieve pixel-perfect design fidelity

**Agents Used:**
- **ui-developer**: Implements and fixes UI (primary agent)
- **designer**: Validates design fidelity (every iteration)
- **ui-developer-codex**: Expert fixes when UI Developer struggles (optional, adaptive)

**Smart Switching:**
- 2 consecutive failures → Switch to other agent
- Progress made → Reset counters, continue
- Balances speed (UI Developer) with expertise (Codex)

**Success Metric:**
- Design fidelity score >= 54/60
- Designer assessment: PASS ✅

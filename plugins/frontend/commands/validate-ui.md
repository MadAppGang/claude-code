---
description: Multi-agent orchestrated UI design validation with iterative fixes and optional external AI expert review
---

## Task

**Multi-agent orchestration command** - coordinate between designer agent (reviews UI fidelity), ui-developer agent (fixes UI issues), and optional external AI models (GPT-5 Codex, Grok) for independent expert review via Claudish MCP to iteratively validate and fix UI implementation against design references.

### Phase 1: Gather User Inputs

Ask the user directly for the following information:

**Ask user to provide:**

1. **Design reference** (Figma URL, local file path, or remote URL)
   - Example Figma: `https://figma.com/design/abc123/...?node-id=136-5051`
   - Example remote: `http://localhost:5173/users`
   - Example local: `/Users/you/Downloads/design.png`

2. **Component description** (what are you validating?)
   - Example: "user profile page", "main dashboard", "product card component"

3. **Use external AI expert review?** (yes or no)
   - "yes" to enable external AI model review (GPT-5 Codex via Claudish MCP) on each iteration
   - "no" to use only Claude Sonnet designer review

**Auto-detect reference type from user's input:**
- Contains "figma.com" → Figma design
- Starts with "http://localhost" or "http://127.0.0.1" → Remote URL (live component)
- Otherwise → Local file path (screenshot)

### Phase 2: Parse Inputs and Find Implementation

Parse the user's text responses:
- Extract design reference (user's answer to question 1)
- Extract component description (user's answer to question 2)
- Extract external AI review preference (user's answer to question 3: "yes" or "no")

Auto-detect reference type from the reference string:
- Contains "figma.com" → Figma design
- Starts with "http://localhost" or "http://127.0.0.1" → Remote URL (live component)
- Otherwise → Local file path (screenshot)

Validate inputs:
- Check reference is not empty
- Check component description is not empty
- If either is empty: Ask user to provide that information

Validate reference:
- If Figma detected: Parse URL to extract fileKey and nodeId, verify format
- If Remote URL detected: Verify URL format is valid
- If Local file detected: Verify file path exists and is readable

Find implementation files based on description:
- Use the description to search for relevant files in the codebase
- Search strategies:
  - Convert description to likely component names (e.g., "user profile page" → "UserProfile", "UserProfilePage")
  - Search for matching files in src/components/, src/routes/, src/pages/
  - Use Glob to find files like `**/User*Profile*.tsx`, `**/user*profile*.tsx`
  - Use Grep to search for component exports matching the description
- If multiple files found: Choose most relevant or ask user to clarify
- If no files found: Ask user to provide file path manually

Store the found implementation file(s) for use in validation loop.

If any validation fails, re-ask for that specific input with clarification.

### Phase 3: Multi-Agent Iteration Loop

Run up to **10 iterations** of the following sequence:

#### Step 3.1: Launch Designer Agent(s) for Parallel Design Validation

**IMPORTANT**: If external AI review is enabled, launch TWO designer agents IN PARALLEL using a SINGLE message with TWO Task tool calls (one normal, one with PROXY_MODE for external AI).

**Designer Agent** (always runs):

Pass inputs to designer agent using the Task tool:

```
Review the [Component Name] implementation against the design reference and provide a detailed design fidelity report.

**CRITICAL**: Be PRECISE and CRITICAL. Do not try to make everything look good. Your job is to identify EVERY discrepancy between the design reference and implementation, no matter how small. Focus on accuracy and design fidelity.

**Design Reference**: [Figma URL | file path | remote URL]
**Component Description**: [user description, e.g., "user profile page"]
**Implementation File(s)**: [found file paths, e.g., "src/components/UserProfile.tsx"]
**Application URL**: [e.g., "http://localhost:5173" or staging URL]

**Your Tasks:**
1. Fetch the design reference:
   - If Figma: Use Figma MCP to fetch the design screenshot
   - If Remote URL: Use chrome-devtools MCP to take screenshot of the URL
   - If Local file: Read the provided file path

2. Capture implementation screenshot:
   - Navigate to application URL
   - Use Chrome DevTools MCP to capture implementation screenshot
   - Use same viewport size as reference for fair comparison

3. Read implementation files to understand code structure

4. Perform comprehensive design review comparing:
   - Colors & theming
   - Typography
   - Spacing & layout
   - Visual elements (borders, shadows, icons)
   - Responsive design
   - Accessibility (WCAG 2.1 AA)
   - Interactive states

5. Document ALL discrepancies with specific values
6. Categorize issues by severity (CRITICAL/MEDIUM/LOW)
7. Provide actionable fixes with code snippets
8. Calculate design fidelity score

**REMEMBER**: Be PRECISE and CRITICAL. Identify ALL discrepancies. Do not be lenient.

Return detailed design review report.
```

**External AI Designer Review** (if enabled):

If user selected "Yes" for external AI review, launch designer agent WITH PROXY_MODE IN PARALLEL with the normal designer agent:

Use Task tool with `subagent_type: frontend:designer` and start the prompt with:
```
PROXY_MODE: design-review

Review the [Component Name] implementation against the design reference and provide a detailed design fidelity report.

**CRITICAL**: Be PRECISE and CRITICAL. Do not try to make everything look good. Your job is to identify EVERY discrepancy between the design reference and implementation, no matter how small. Focus on accuracy and design fidelity.

**Design Reference**: [Figma URL | file path | remote URL]
**Component Description**: [user description, e.g., "user profile page"]
**Implementation File(s)**: [found file paths, e.g., "src/components/UserProfile.tsx"]
**Application URL**: [e.g., "http://localhost:5173" or staging URL]

**Your Tasks:**
[Same validation tasks as Designer Agent above - full design review with same criteria]

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

#### Step 3.2: Consolidate Design Review Results

After both agents complete, consolidate their findings:

**If only designer ran:**
- Use designer's report as-is

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

Create a consolidated design review report that includes:
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

#### Step 3.3: Launch UI Developer Agent to Apply Fixes

Use Task tool with `subagent_type: frontend:ui-developer`:

```
Fix the UI implementation issues identified in the consolidated design review from multiple validation sources.

**Component**: [Component Name]
**Implementation File(s)**: [found file paths, e.g., "src/components/UserProfile.tsx"]

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
   - Fix colors using correct Tailwind classes or exact hex values
   - Fix spacing using proper Tailwind scale (p-4, p-6, etc.)
   - Fix typography (font sizes, weights, line heights)
   - Fix layout issues (max-width, alignment, grid/flex)
   - Fix accessibility (ARIA, contrast, keyboard nav)
   - Fix responsive design (mobile-first breakpoints)
4. Use Edit tool to modify files
5. Run quality checks (typecheck, lint, build)
6. Provide implementation summary indicating:
   - Which issues were fixed
   - Which sources (designer, designer-codex, or both) flagged each issue
   - Files modified
   - Changes made

DO NOT re-validate. Only apply the fixes.
```

Wait for ui-developer agent to return summary of applied changes.

#### Step 3.4: Check Loop Status

After ui-developer agent completes:
- Increment iteration count
- If designer assessment is NOT "PASS" AND iteration < 10:
  * Go back to Step 3.1 (re-run designer agent)
- If designer assessment is "PASS" OR iteration = 10:
  * Log: "Automated validation complete. Proceeding to user validation."
  * Exit loop and proceed to Phase 3.5 (User Manual Validation)

Track and display progress: "Iteration X/10 complete"

### Phase 3.5: MANDATORY User Manual Validation Gate

**IMPORTANT**: This step is MANDATORY before generating the final report. Never skip this step.

Even when designer agent claims "PASS", the user must manually verify the implementation against the real design reference.

**Present to user:**

```
🎯 Automated Validation Complete - User Verification Required

After [iteration_count] iterations, the designer agent has completed its review.

**Validation Summary:**
- Component: [component_description]
- Iterations completed: [iteration_count] / 10
- Last designer assessment: [PASS ✅ / NEEDS IMPROVEMENT ⚠️ / FAIL ❌]
- Final design fidelity score: [score] / 60
- Issues remaining (automated): [count]

However, automated validation can miss subtle issues. Please manually verify the implementation:

**What to Check:**
1. Open the application at: [app_url or remote URL]
2. View the component: [component_description]
3. Compare against design reference: [design_reference]
4. Check for:
   - Colors match exactly (backgrounds, text, borders)
   - Spacing and layout are pixel-perfect
   - Typography (fonts, sizes, weights, line heights) match
   - Visual elements (shadows, borders, icons) match
   - Interactive states work correctly (hover, focus, active, disabled)
   - Responsive design works on mobile, tablet, desktop
   - Accessibility features work properly (keyboard nav, ARIA)
   - Overall visual fidelity matches the design

Please manually test the implementation and let me know:
```

Use AskUserQuestion to ask:
```
Does the implementation match the design reference?

Please manually test the UI and compare it to the design.

Options:
1. "Yes - Looks perfect, matches design exactly" → Approve and generate report
2. "No - I found issues" → Provide feedback to continue fixing
```

**If user selects "Yes - Looks perfect":**
- Log: "✅ User approved! Implementation verified by human review."
- Proceed to Phase 4 (Generate Final Report)

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
  - "Profile avatar should be 64px not 48px"
  - "Text alignment is off-center, should be centered"

  What issues did you find?
  ```

- Collect user's feedback (text or screenshot path)
- Store feedback as `user_feedback`
- Check if we've exceeded max total iterations (10 automated + 5 user feedback rounds = 15 total):
  * If exceeded: Ask user if they want to continue or accept current state
  * If not exceeded: Proceed with user feedback fixes

- Log: "⚠️ User found issues. Launching UI Developer to address user feedback."
- Use Task tool with appropriate fixing agent (ui-developer or ui-developer-codex):

  ```
  Fix the UI implementation issues identified by the USER during manual testing.

  **CRITICAL**: These issues were found by a human reviewer, not automated validation.
  The user manually tested the implementation and found real problems.

  **Component**: [component_description]
  **Design Reference**: [design_reference]
  **Implementation File(s)**: [found file paths]
  **Application URL**: [app_url or remote URL]

  **USER FEEDBACK** (Human Manual Testing):
  [Paste user's complete feedback - text description or screenshot analysis]

  [If screenshot provided:]
  **User's Screenshot**: [screenshot_path]
  Please read the screenshot to understand the visual issues the user is pointing out.

  **Your Task:**
  1. Fetch design reference (Figma MCP / Chrome DevTools / Read file)
  2. Read all implementation files
  3. Carefully review the user's specific feedback
  4. Address EVERY issue the user mentioned:
     - If user mentioned colors: Fix to exact hex values or Tailwind classes
     - If user mentioned spacing: Fix to exact pixel values mentioned
     - If user mentioned typography: Fix font sizes, weights, line heights
     - If user mentioned layout: Fix alignment, max-width, grid/flex issues
     - If user mentioned visual elements: Fix shadows, borders, border-radius
     - If user mentioned interactive states: Fix hover, focus, active, disabled
     - If user mentioned responsive: Fix mobile, tablet, desktop breakpoints
     - If user mentioned accessibility: Fix ARIA, contrast, keyboard navigation
  5. Use Edit tool to modify files
  6. Use modern React/TypeScript/Tailwind best practices:
     - React 19 patterns
     - Tailwind CSS 4 (utility-first, no @apply, static classes only)
     - Mobile-first responsive design
     - WCAG 2.1 AA accessibility
  7. Run quality checks (typecheck, lint, build)
  8. Provide detailed implementation summary explaining:
     - Each user issue addressed
     - Exact changes made
     - Files modified
     - Any trade-offs or decisions made

  **IMPORTANT**: User feedback takes priority over designer agent feedback.
  The user has manually tested and seen real issues that automated validation missed.

  Return detailed fix summary when complete.
  ```

- Wait for fixing agent to complete

- After fixes applied:
  * Log: "User-reported issues addressed. Re-running designer validation."
  * Increment `user_feedback_round` counter
  * Re-run designer agent (Step 3.1) to validate fixes
  * Loop back to Phase 3.5 (User Manual Validation) to verify with user again
  * Continue until user approves

**End of Phase 3.5 (User Manual Validation Gate)**

### Phase 4: Generate Final Report

After loop completes (10 iterations OR designer reports no issues):

1. Create temp directory: `/tmp/ui-validation-[timestamp]/`

2. Save iteration history to `report.md`:
   ```markdown
   # UI Validation Report

   ## Validating: [user description, e.g., "user profile page"]
   ## Implementation: [file path(s)]
   ## Automated Iterations: [count]/10
   ## User Feedback Rounds: [count]
   ## Third-Party Review: [Enabled/Disabled]
   ## User Manual Validation: ✅ APPROVED

   ## Iteration History:

   ### Iteration 1 (Automated)
   **Designer Review Report:**
   [issues found]

   [If Codex enabled:]
   **Codex Expert Review:**
   [expert opinion]

   **UI Developer Changes:**
   [fixes applied]

   ### Iteration 2 (Automated)
   ...

   ### User Validation Round 1
   **User Feedback:**
   [user's description or screenshot reference]

   **Issues Reported by User:**
   - [Issue 1]
   - [Issue 2]
   ...

   **UI Developer Fixes:**
   [fixes applied based on user feedback]

   **Designer Re-validation:**
   [designer assessment after user-requested fixes]

   ### User Validation Round 2
   ...

   ## Final Status:
   **Automated Validation**: [PASS ✅ / NEEDS IMPROVEMENT ⚠️ / FAIL ❌]
   **User Manual Validation**: ✅ APPROVED
   **Overall**: Success - Implementation matches design reference

   ## Summary:
   - Total automated iterations: [count]
   - Total user feedback rounds: [count]
   - Issues found by automation: X
   - Issues found by user: Y
   - Total issues fixed: Z
   - User approval: ✅ "Looks perfect, matches design exactly"
   ```

3. Save final screenshots:
   - `reference.png` (original design screenshot from Figma/URL/file)
   - `implementation-final.png` (final implementation screenshot from app URL)

4. Generate `comparison.html` with side-by-side visual comparison:
   - **MUST display both screenshots side-by-side** (not text)
   - Left side: `reference.png` (design reference)
   - Right side: `implementation-final.png` (final implementation)
   - Include zoom/pan controls for detailed inspection
   - Show validation summary below screenshots
   - Format:
     ```html
     <!DOCTYPE html>
     <html>
     <head>
       <title>UI Validation - Side-by-Side Comparison</title>
       <style>
         .comparison-container { display: flex; gap: 20px; }
         .screenshot-panel { flex: 1; }
         .screenshot-panel img { width: 100%; border: 1px solid #ccc; }
         .screenshot-panel h3 { text-align: center; }
       </style>
     </head>
     <body>
       <h1>UI Validation: [component_description]</h1>
       <div class="comparison-container">
         <div class="screenshot-panel">
           <h3>Design Reference</h3>
           <img src="reference.png" alt="Design Reference">
         </div>
         <div class="screenshot-panel">
           <h3>Final Implementation</h3>
           <img src="implementation-final.png" alt="Final Implementation">
         </div>
       </div>
       <div class="summary">
         [Include validation summary with user approval]
       </div>
     </body>
     </html>
     ```

### Phase 5: Present Results to User

Display summary:
- Total automated iterations run
- Total user feedback rounds
- User manual validation status: ✅ APPROVED
- Final status (success/needs review)
- Path to detailed report
- Link to comparison HTML

Present:
```
✅ UI Validation Complete!

**Validation Summary:**
- Component: [component_description]
- Automated iterations: [count] / 10
- User feedback rounds: [count]
- User manual validation: ✅ APPROVED

**Results:**
- Issues found by automation: [count]
- Issues found by user: [count]
- Total issues fixed: [count]
- Final designer assessment: [PASS/NEEDS IMPROVEMENT/FAIL]
- **User approval**: ✅ "Looks perfect, matches design exactly"

**Report Location:**
- Detailed report: /tmp/ui-validation-[timestamp]/report.md
- Side-by-side comparison: /tmp/ui-validation-[timestamp]/comparison.html

The implementation has been validated and approved by human review!
```

Ask user for next action:
- "View detailed report" → Open report directory
- "View git diff" → Show git diff of changes
- "Accept and commit changes" → Commit with validation report
- "Done" → Exit

### Implementation Notes

**Command Responsibilities (Orchestration Only):**
- Ask user for 3 pieces of information (text prompts)
  1. Design reference (Figma URL, remote URL, or local file path)
  2. Component description
  3. Use Codex helper? (yes/no)
- Parse user's text responses
- Auto-detect reference type (Figma/Remote URL/Local file)
- Validate reference (file exists, URL format)
- Find implementation files from description using Glob/Grep
- Track iteration count (1-10)
- Orchestrate the multi-agent loop:
  - Launch designer agent
  - Optionally launch ui-developer-codex proxy for expert review
  - Launch ui-developer agent
  - Repeat up to 10 times
- Generate final report with iteration history
- Save screenshots and comparison HTML
- Present results to user
- Handle next action choice

**Designer Agent Responsibilities:**
- Fetch design reference screenshot (Figma MCP or Chrome DevTools)
- Capture implementation screenshot via Chrome DevTools
- Read implementation files to understand code structure
- Perform comprehensive design review:
  - Colors & theming
  - Typography
  - Spacing & layout
  - Visual elements
  - Responsive design
  - Accessibility (WCAG 2.1 AA)
  - Interactive states
- Return detailed design review report with:
  - Specific issues found with exact values
  - Actionable fixes with code snippets
  - Severity categorization (CRITICAL/MEDIUM/LOW)
  - File paths and line numbers
  - Design fidelity score
- **DOES NOT apply fixes - only reviews and reports**

**UI Developer Codex Agent Responsibilities (Optional Proxy):**
- Receive designer's review report from orchestrator
- Forward complete prompt to Codex AI via mcp__codex-cli__ask-codex
- Return Codex's expert analysis verbatim
- Provides independent third-party validation
- **Does NOT do any preparation - pure proxy**

**UI Developer Agent Responsibilities:**
- Receive designer feedback (and optional Codex review)
- Read implementation files
- Apply fixes using modern React/TypeScript/Tailwind best practices:
  - Fix colors with correct Tailwind classes
  - Fix spacing with proper scale
  - Fix typography
  - Fix layout issues
  - Fix accessibility issues
  - Fix responsive design
- Use Edit tool to modify files
- Run quality checks (typecheck, lint, build)
- Provide implementation summary
- **DOES NOT re-validate - only implements fixes**

**Key Principles:**
1. Command orchestrates the loop, does NOT do the work
2. Designer ONLY reviews design fidelity and reports, does NOT fix
3. UI Developer ONLY implements fixes, does NOT validate
4. UI Developer Codex (optional) provides expert third-party review
5. Loop continues until 10 iterations OR designer reports no issues (PASS)
6. **MANDATORY: User manual validation required after automated loop completes**
7. User can provide feedback with screenshots or text descriptions
8. User feedback triggers additional fixing rounds until user approves

### Example User Flow

```
User: /validate-ui

Command: "Please provide the following information:"

Command: "1. Design reference (Figma URL, local file path, or remote URL):"
User: "https://figma.com/design/abc123.../node-id=136-5051"

Command: "2. Component description (what are you validating?):"
User: "user profile page"

Command: "3. Use Codex agent helper? (yes/no):"
User: "yes"

Command: [Parses responses]
Command: [Auto-detects: Figma design ✓]
Command: [Searches codebase for "user profile page"]
Command: [Finds: src/components/UserProfile.tsx]
Command: "✓ Reference type: Figma (auto-detected)"
Command: "✓ Component: user profile page"
Command: "✓ Found implementation: src/components/UserProfile.tsx"
Command: "✓ Codex agent helper: Enabled"
Command: "Starting validation loop (max 10 iterations)..."

━━━ Iteration 1/10 ━━━

Command: [Launches designer agent]
Designer: [Performs design review, returns report with 5 issues]

Command: [Launches ui-developer-codex proxy]
Codex: [Provides expert recommendations via proxy]

Command: [Launches ui-developer agent]
UI Developer: [Applies fixes, returns summary]

Command: "Iteration 1/10 complete. 5 issues addressed."

━━━ Iteration 2/10 ━━━

Command: [Re-runs designer agent]
Designer: [Finds 2 remaining issues]

Command: [Launches ui-developer-codex]
Codex: [Provides recommendations]

Command: [Launches ui-developer]
UI Developer: [Applies fixes]

Command: "Iteration 2/10 complete. 2 more issues addressed."

━━━ Iteration 3/10 ━━━

Command: [Re-runs designer agent]
Designer: [Reports: "Assessment: PASS - No issues found, implementation matches design"]

Command: "Automated validation passed! Proceeding to user manual validation."
Command: [Exits automated loop - 3 iterations completed]

━━━ User Manual Validation ━━━

Command: "🎯 Automated Validation Passed - User Verification Required"
Command: [Explains what to check and asks user to verify]

User: [Tests the UI manually, compares to Figma design]
User: "No - I found issues"

Command: "Please describe the issues you found."
User: "The button text color is too light on the blue background - hard to read. Should be white #ffffff not gray #cccccc. Also the spacing between the header and content is too tight - should be 32px not 16px."

Command: [Stores user feedback]
Command: "⚠️ User found 2 issues. Launching UI Developer."

Command: [Launches ui-developer with user's specific feedback]
UI Developer: [Fixes the text color to #ffffff and spacing to 32px, runs quality checks]
UI Developer: "Fixed button text color and header spacing as requested."

Command: "User-reported issues addressed. Re-running designer validation."
Command: [Launches designer agent]
Designer: [Validates fixes, reports: "PASS - Issues resolved"]

Command: "I've addressed all the issues you reported. Please verify the fixes."
User: "Yes - Looks perfect, matches design exactly"

Command: "✅ User approved! Implementation verified by human review."

━━━ Final Report ━━━

Command: [Creates /tmp/ui-validation-20251104-235623/]
Command: [Saves report.md, screenshots, comparison.html]

Command: [Displays summary]
"✅ UI Validation Complete!

**Validation Summary:**
- Component: user profile page
- Automated iterations: 3 / 10
- User feedback rounds: 1
- User manual validation: ✅ APPROVED

**Results:**
- Issues found by automation: 7
- Issues found by user: 2
- Total issues fixed: 9
- Final designer assessment: PASS ✅
- **User approval**: ✅ "Looks perfect, matches design exactly"

**Report Location:**
- Detailed report: /tmp/ui-validation-20251104-235623/report.md
- Side-by-side comparison: /tmp/ui-validation-20251104-235623/comparison.html

The implementation has been validated and approved by human review!"

Command: [Asks for next action]
```

### Arguments

$ARGUMENTS - Optional: Can provide design reference path, Figma URL, or component name directly to skip some questions

### Quick Reference

**Command does (Orchestration):**
- ✅ Ask user 3 questions via text prompts
- ✅ Parse responses and auto-detect reference type
- ✅ Find implementation files from description
- ✅ Track iteration count (1-10)
- ✅ Launch designer agent (each iteration)
- ✅ Launch ui-developer-codex proxy (if enabled)
- ✅ Launch ui-developer agent (each iteration)
- ✅ Generate final report
- ✅ Present results

**Designer Agent does:**
- ✅ Fetch design reference screenshots (Figma/remote/local)
- ✅ Capture implementation screenshots
- ✅ Perform comprehensive design review
- ✅ Compare and identify all UI discrepancies
- ✅ Categorize by severity (CRITICAL/MEDIUM/LOW)
- ✅ Calculate design fidelity score
- ✅ Provide actionable fixes with code snippets
- ✅ Return detailed design review report
- ❌ Does NOT apply fixes

**UI Developer Codex Agent does (Optional Proxy):**
- ✅ Receive complete prompt from orchestrator
- ✅ Forward to Codex AI via mcp__codex-cli__ask-codex
- ✅ Return Codex's expert analysis verbatim
- ✅ Provide third-party validation
- ❌ Does NOT prepare context (pure proxy)

**UI Developer Agent does:**
- ✅ Receive designer feedback (+ optional Codex review)
- ✅ Apply fixes using React/TypeScript/Tailwind best practices
- ✅ Fix colors, spacing, typography, layout, accessibility
- ✅ Update Tailwind CSS classes
- ✅ Run quality checks (typecheck, lint, build)
- ✅ Return implementation summary
- ❌ Does NOT re-validate

**Loop Flow:**
```
1. Designer → Design Review Report
2. (Optional) UI Developer Codex → Expert Opinion (via Codex AI)
3. UI Developer → Apply Fixes
4. Repeat steps 1-3 up to 10 times
5. Generate final report
```

### Important Details

**Early Exit:**
- If designer reports "Assessment: PASS" at any iteration, exit loop immediately
- Display total iterations used (e.g., "Complete after 3/10 iterations")

**Error Handling:**
- If agent fails 3 times consecutively: Exit loop and report to user
- Log errors but continue iterations when possible

**MCP Usage:**
- Figma MCP: Fetch design screenshots (once at start)
- Chrome DevTools MCP: Capture implementation screenshots (every iteration)
- Codex CLI MCP: Expert review (every iteration if enabled)

**Best Practices:**
- Keep validator reports concise but specific
- Include file paths and line numbers
- Prioritize issues by severity
- Track issues found vs fixed in final report

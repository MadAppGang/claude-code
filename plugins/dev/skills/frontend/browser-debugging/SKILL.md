---
name: browser-debugging
description: Systematically tests UI functionality, validates design fidelity with AI visual analysis, monitors console output, tracks network requests, and provides debugging reports using Chrome Extension MCP tools. Use after implementing UI features, for design validation, when investigating console errors, for regression testing, or when user mentions testing, browser bugs, console errors, or UI verification.
---

# Browser Debugging

This Skill provides comprehensive browser-based UI testing, visual analysis, and debugging capabilities using Claude-in-Chrome Extension MCP tools and optional external vision models via Claudish.

## When to Use This Skill

Claude and agents (developer, reviewer, tester, ui-developer) should invoke this Skill when:

- **Validating Own Work**: After implementing UI features, agents should verify their work in a real browser
- **Design Fidelity Checks**: Comparing implementation screenshots against design references
- **Visual Regression Testing**: Detecting layout shifts, styling issues, or visual bugs
- **Console Error Investigation**: User reports console errors or warnings
- **Form/Interaction Testing**: Verifying user interactions work correctly
- **Pre-Commit Verification**: Before committing or deploying code
- **Bug Reproduction**: User describes UI bugs that need investigation

## Prerequisites

### Required: Claude-in-Chrome Extension

This skill requires Claude-in-Chrome Extension MCP. The extension provides browser automation tools directly through Claude.

**Check if available**:
The tools are available when the extension is installed and active. Look for `mcp__claude-in-chrome__*` tools in your available MCP tools.

### Optional: External Vision Models (via OpenRouter)

For advanced visual analysis, use external vision-language models via Claudish:

```bash
# Check OpenRouter API key
[[ -n "${OPENROUTER_API_KEY}" ]] && echo "OpenRouter configured" || echo "Not configured"

# Install claudish
npm install -g claudish
```

---

## Visual Analysis Models (Recommended)

For best visual analysis of UI screenshots, use these models via Claudish:

### Tier 1: Best Quality (Recommended for Design Validation)

| Model | Strengths | Cost | Best For |
|-------|-----------|------|----------|
| **qwen/qwen3-vl-32b-instruct** | Best OCR, spatial reasoning, GUI automation, 32+ languages | ~$0.06/1M input | Design fidelity, OCR, element detection |
| **google/gemini-2.5-flash** | Fast, excellent price/performance, 1M context | ~$0.05/1M input | Real-time validation, large pages |
| **openai/gpt-4o** | Most fluid multimodal, strong all-around | ~$0.15/1M input | Complex visual reasoning |

### Tier 2: Fast & Affordable

| Model | Strengths | Cost | Best For |
|-------|-----------|------|----------|
| **qwen/qwen3-vl-30b-a3b-instruct** | Good balance, MoE architecture | ~$0.04/1M input | Quick checks, multiple iterations |
| **google/gemini-2.5-flash-lite** | Ultrafast, very cheap | ~$0.01/1M input | High-volume testing |

### Tier 3: Free Options

| Model | Notes |
|-------|-------|
| **openrouter/polaris-alpha** | FREE, good for testing workflows |

### Model Selection Guide

```
Design Fidelity Validation → qwen/qwen3-vl-32b-instruct (best OCR & spatial)
Quick Smoke Tests → google/gemini-2.5-flash (fast & cheap)
Complex Layout Analysis → openai/gpt-4o (best reasoning)
High Volume Testing → google/gemini-2.5-flash-lite (ultrafast)
Budget Conscious → openrouter/polaris-alpha (free)
```

---

## Recipe 1: Agent Self-Validation (After Implementation)

**Use Case**: Developer/UI-Developer agent validates their own work after implementing a feature.

### Pattern: Implement → Screenshot → Analyze → Report

```markdown
## After Implementing UI Feature

1. **Save file changes** (Edit tool)

2. **Capture implementation screenshot**:
   \`\`\`
   mcp__claude-in-chrome__navigate(url: "http://localhost:5173/your-route")
   # Wait for page load
   mcp__claude-in-chrome__computer(action: "screenshot")
   \`\`\`

3. **Analyze with embedded Claude** (always available):
   - Describe what you see in the screenshot
   - Check for obvious layout issues
   - Verify expected elements are present

4. **Optional: Enhanced analysis with vision model**:
   \`\`\`bash
   # Use Qwen VL for detailed visual analysis
   npx claudish --model qwen/qwen3-vl-32b-instruct --stdin --quiet <<EOF
   Analyze this UI screenshot and identify any visual issues:

   IMAGE: [screenshot from previous step]

   Check for:
   - Layout alignment issues
   - Spacing inconsistencies
   - Typography problems (font sizes, weights)
   - Color contrast issues
   - Missing or broken elements
   - Responsive design problems

   Provide specific, actionable feedback.
   EOF
   \`\`\`

5. **Check console for errors**:
   \`\`\`
   mcp__claude-in-chrome__read_console_messages()
   # Filter for errors in response
   \`\`\`

6. **Check network for failures**:
   \`\`\`
   mcp__claude-in-chrome__read_network_requests()
   # Look for failed requests (status >= 400)
   \`\`\`

7. **Report results to orchestrator**
```

### Quick Self-Check (5-Point Validation)

Agents should perform this quick check after any UI implementation:

```markdown
## Quick Self-Validation Checklist

□ 1. Screenshot shows expected UI elements
□ 2. No console errors (check: mcp__claude-in-chrome__read_console_messages)
□ 3. No network failures (check: mcp__claude-in-chrome__read_network_requests)
□ 4. Interactive elements respond correctly
□ 5. Visual styling matches expectations
```

---

## Recipe 2: Design Fidelity Validation

**Use Case**: Compare implementation against Figma design or design reference.

### Pattern: Design Reference → Implementation → Visual Diff

```markdown
## Design Fidelity Check

### Step 1: Capture Implementation
\`\`\`
mcp__claude-in-chrome__navigate(url: "http://localhost:5173/component")
mcp__claude-in-chrome__resize_window(width: 1440, height: 900)
mcp__claude-in-chrome__computer(action: "screenshot")
\`\`\`

### Step 2: Visual Analysis with Vision Model

\`\`\`bash
npx claudish --model qwen/qwen3-vl-32b-instruct --stdin --quiet <<EOF
Compare these two UI screenshots and identify design fidelity issues:

DESIGN REFERENCE: /tmp/design-reference.png
IMPLEMENTATION: [screenshot from step 1]

Analyze and report differences in:

## Colors & Theming
- Background colors (exact hex values)
- Text colors (headings, body, muted)
- Border and divider colors
- Button/interactive element colors

## Typography
- Font families
- Font sizes (px values)
- Font weights (regular, medium, bold)
- Line heights
- Letter spacing

## Spacing & Layout
- Padding (top, right, bottom, left)
- Margins between elements
- Gap spacing in flex/grid
- Container max-widths
- Alignment (center, left, right)

## Visual Elements
- Border radius values
- Box shadows (blur, spread, color)
- Icon sizes and colors
- Image aspect ratios

## Component Structure
- Missing elements
- Extra elements
- Wrong element order

For EACH difference found, provide:
1. Category (colors/typography/spacing/visual/structure)
2. Severity (CRITICAL/MEDIUM/LOW)
3. Expected value (from design)
4. Actual value (from implementation)
5. Specific Tailwind CSS fix

Output as structured markdown.
EOF
\`\`\`

### Step 3: Generate Fix Recommendations

Parse vision model output and create actionable fixes for ui-developer agent.
```

---

## Recipe 3: Interactive Element Testing

**Use Case**: Verify buttons, forms, and interactive components work correctly.

### Pattern: Snapshot → Interact → Verify → Report

```markdown
## Interactive Testing Flow

### Step 1: Get Page Structure
\`\`\`
mcp__claude-in-chrome__read_page()
# Returns DOM structure with element references
\`\`\`

### Step 2: Test Each Interactive Element

**Button Test**:
\`\`\`
# Before
mcp__claude-in-chrome__computer(action: "screenshot")

# Find and click button (natural language)
mcp__claude-in-chrome__find(description: "submit button")
mcp__claude-in-chrome__computer(action: "left_click", coordinate: [x, y])

# OR click by reference
mcp__claude-in-chrome__computer(action: "click", ref: "button[type=submit]")

# After (wait for response)
# Wait a moment for response
mcp__claude-in-chrome__computer(action: "screenshot")

# Check results
mcp__claude-in-chrome__read_console_messages()
mcp__claude-in-chrome__read_network_requests()
\`\`\`

**Form Test**:
\`\`\`
# Fill form fields
mcp__claude-in-chrome__form_input(
  selector: "#email",
  value: "test@example.com"
)
mcp__claude-in-chrome__form_input(
  selector: "#password",
  value: "SecurePass123!"
)

# Submit (click button)
mcp__claude-in-chrome__find(description: "submit button")
mcp__claude-in-chrome__computer(action: "left_click", coordinate: [x, y])

# Verify success
mcp__claude-in-chrome__read_page()
# Check for success indicators
\`\`\`

**Hover State Test**:
\`\`\`
mcp__claude-in-chrome__computer(action: "screenshot")
mcp__claude-in-chrome__find(description: "primary button")
mcp__claude-in-chrome__computer(action: "hover", coordinate: [x, y])
mcp__claude-in-chrome__computer(action: "screenshot")
# Compare screenshots for hover state changes
\`\`\`

### Step 3: Analyze Interaction Results

Use vision model to compare before/after screenshots:
\`\`\`bash
npx claudish --model google/gemini-2.5-flash --stdin --quiet <<EOF
Compare these before/after screenshots and verify the interaction worked:

BEFORE: [screenshot before interaction]
AFTER: [screenshot after interaction]

Expected behavior: [describe what should happen]

Verify:
1. Did the expected UI change occur?
2. Are there any error states visible?
3. Did loading states appear/disappear correctly?
4. Is the final state correct?

Report: PASS/FAIL with specific observations.
EOF
\`\`\`
```

---

## Recipe 4: Responsive Design Validation

**Use Case**: Verify UI works across different screen sizes.

### Pattern: Resize → Screenshot → Analyze

```markdown
## Responsive Testing

### Breakpoints to Test

| Breakpoint | Width | Description |
|------------|-------|-------------|
| Mobile | 375px | iPhone SE |
| Mobile L | 428px | iPhone 14 Pro Max |
| Tablet | 768px | iPad |
| Desktop | 1280px | Laptop |
| Desktop L | 1920px | Full HD |

### Automated Responsive Check

\`\`\`bash
#!/bin/bash
# Test all breakpoints

BREAKPOINTS=(375 428 768 1280 1920)
URL="http://localhost:5173/your-route"

for width in "\${BREAKPOINTS[@]}"; do
  echo "Testing \${width}px..."

  # Navigate (once)
  mcp__claude-in-chrome__navigate(url: "$URL")

  # Resize and screenshot
  mcp__claude-in-chrome__resize_window(width: $width, height: 900)
  mcp__claude-in-chrome__computer(action: "screenshot")
  # Save/analyze screenshot
done
\`\`\`

### Visual Analysis for Responsive Issues

\`\`\`bash
npx claudish --model qwen/qwen3-vl-32b-instruct --stdin --quiet <<EOF
Analyze these responsive screenshots for layout issues:

MOBILE (375px): [screenshot 1]
TABLET (768px): [screenshot 2]
DESKTOP (1280px): [screenshot 3]

Check for:
1. Text overflow or truncation
2. Elements overlapping
3. Improper stacking on mobile
4. Touch targets too small (<44px)
5. Hidden content that shouldn't be hidden
6. Horizontal scroll issues
7. Image scaling problems

Report issues by breakpoint with specific CSS fixes.
EOF
\`\`\`
```

---

## Recipe 5: Accessibility Validation

**Use Case**: Verify accessibility standards (WCAG 2.1 AA).

### Pattern: Snapshot → Analyze → Check Contrast

```markdown
## Accessibility Check

### Automated A11y Testing

\`\`\`
# Get full page content for accessibility tree analysis
mcp__claude-in-chrome__read_page()

# Get all text content
mcp__claude-in-chrome__get_page_text()

# Check for common issues:
# - Missing alt text (look for img without alt in read_page)
# - Missing ARIA labels
# - Incorrect heading hierarchy
# - Missing form labels
\`\`\`

### Visual Contrast Analysis

\`\`\`bash
npx claudish --model qwen/qwen3-vl-32b-instruct --stdin --quiet <<EOF
Analyze this screenshot for accessibility issues:

IMAGE: [screenshot]

Check WCAG 2.1 AA compliance:

1. **Color Contrast**
   - Text contrast ratio (need 4.5:1 for normal, 3:1 for large)
   - Interactive element contrast
   - Focus indicator visibility

2. **Visual Cues**
   - Do links have underlines or other visual differentiation?
   - Are error states clearly visible?
   - Are required fields indicated?

3. **Text Readability**
   - Font size (minimum 16px for body)
   - Line height (minimum 1.5)
   - Line length (max 80 characters)

4. **Touch Targets**
   - Minimum 44x44px for interactive elements
   - Adequate spacing between targets

Report violations with severity and specific fixes.
EOF
\`\`\`
```

---

## Recipe 6: Console & Network Debugging

**Use Case**: Investigate runtime errors and API issues.

### Pattern: Monitor → Capture → Analyze

```markdown
## Debug Session

### Real-Time Console Monitoring

\`\`\`
# Get all console messages
mcp__claude-in-chrome__read_console_messages()

# Response includes:
# - Type (log, warn, error, info)
# - Message content
# - Timestamp
# - Stack trace (for errors)
\`\`\`

### Network Request Analysis

\`\`\`
# Get all network requests
mcp__claude-in-chrome__read_network_requests()

# Response includes:
# - URL
# - Method (GET, POST, etc.)
# - Status code
# - Response time
# - Request/response headers
# - Request/response body (if available)
\`\`\`

### Error Pattern Analysis

Common error patterns to look for:

| Error Type | Pattern | Common Cause |
|------------|---------|--------------|
| React Error | "Cannot read property" | Missing null check |
| React Error | "Invalid hook call" | Hook rules violation |
| Network Error | "CORS" | Missing CORS headers |
| Network Error | "401" | Auth token expired |
| Network Error | "404" | Wrong API endpoint |
| Network Error | "500" | Server error |
```

---

## Quick Reference: Claude-in-Chrome MCP Tools

### Navigation
- `navigate(url)` - Load URL in current tab
- `tabs_create_mcp(url)` - Open new tab
- `tabs_context_mcp()` - List all tabs

### Inspection
- `read_page()` - Get DOM structure with element references
- `get_page_text()` - Extract all visible text
- `computer(action: "screenshot")` - Capture visual state

### Interaction
- `computer(action: "left_click", coordinate: [x, y])` - Click at coordinates
- `computer(action: "click", ref: "selector")` - Click by CSS selector
- `computer(action: "hover", coordinate: [x, y])` - Hover at coordinates
- `form_input(selector, value)` - Fill input field
- `computer(action: "type", text: "...")` - Type text
- `computer(action: "key", key: "Enter")` - Press key

### Console & Network
- `read_console_messages()` - Get console output
- `read_network_requests()` - Get network activity

### Advanced
- `javascript_tool(script)` - Execute JavaScript in page
- `resize_window(width, height)` - Change viewport size
- `find(description)` - Find element by natural language
- `gif_creator(start/stop)` - Record interactions as GIF
- `upload_image(selector, imagePath)` - Upload image file
- `shortcuts_list()` - List keyboard shortcuts
- `shortcuts_execute(shortcut)` - Execute keyboard shortcut

---

## Integration with Agents

### For Developer Agent

After implementing any UI feature, the developer agent should:

```markdown
## Developer Self-Validation Protocol

1. Save code changes
2. Navigate to the page: \`mcp__claude-in-chrome__navigate\`
3. Take screenshot: \`mcp__claude-in-chrome__computer(action: "screenshot")\`
4. Check console: \`mcp__claude-in-chrome__read_console_messages()\`
5. Check network: \`mcp__claude-in-chrome__read_network_requests()\`
6. Report: "Implementation verified - [X] console errors, [Y] network failures"
```

### For Reviewer Agent

When reviewing UI changes:

```markdown
## Reviewer Validation Protocol

1. Read the code changes
2. Navigate to affected pages
3. Take screenshots of all changed components
4. Use vision model for visual analysis (if design reference available)
5. Check console for new errors introduced
6. Verify no regression in existing functionality
7. Report: "Visual review complete - [findings]"
```

### For Tester Agent

Comprehensive testing:

```markdown
## Tester Validation Protocol

1. Navigate to test target
2. Get page structure for element references
3. Execute test scenarios (interactions, forms, navigation)
4. Capture before/after screenshots for each action
5. Monitor console throughout
6. Monitor network throughout
7. Use vision model for visual regression detection
8. Generate detailed test report
```

### For UI-Developer Agent

After fixing UI issues:

```markdown
## UI-Developer Validation Protocol

1. Apply CSS/styling fixes
2. Take screenshot of fixed component
3. Compare with design reference using vision model
4. Verify fix doesn't break other viewports (responsive check)
5. Check console for any styling-related errors
6. Report: "Fix applied and verified - [before/after comparison]"
```

---

## Related Skills

- **react-typescript** - React component patterns
- **tanstack-router** - Navigation and routing
- **shadcn-ui** - Component library usage
- **testing-frontend** - Automated testing strategies

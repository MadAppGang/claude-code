---
name: ui-design-review
version: 1.0.0
description: |
  Prompting patterns and review templates for UI design analysis with Gemini multimodal capabilities.
  Use when conducting design reviews, accessibility audits, or design system validation.
---

# UI Design Review Skill

## Overview

This skill provides prompting patterns, checklists, and templates for conducting UI design reviews using Gemini's multimodal vision capabilities.

## When to Use

- Reviewing screenshots, wireframes, or mockups
- Conducting accessibility audits
- Validating design system consistency
- Comparing implementation to design reference
- Analyzing UI patterns and usability

## Model Routing

### Gemini API Key Detection

```bash
# Check API key availability and select model
determine_gemini_model() {
  if [[ -n "$GEMINI_API_KEY" ]]; then
    echo "g/gemini-3-pro-preview"  # Direct Gemini API
  elif [[ -n "$OPENROUTER_API_KEY" ]]; then
    echo "or/google/gemini-3-pro-preview"  # OpenRouter
  else
    echo "ERROR: No API key available (need GEMINI_API_KEY or OPENROUTER_API_KEY)"
    return 1
  fi
}

GEMINI_MODEL=$(determine_gemini_model)
```

### Why `or/` Prefix for OpenRouter

The model ID `google/gemini-3-pro-preview` collides with Claudish's automatic routing:

| Model ID | Routes To | Requires |
|----------|-----------|----------|
| `google/gemini-*` | Gemini Direct | GEMINI_API_KEY |
| `or/google/gemini-*` | OpenRouter | OPENROUTER_API_KEY |
| `g/gemini-*` | Gemini Direct (explicit) | GEMINI_API_KEY |

**Rule**: Always use `or/` prefix when routing Google models through OpenRouter.

## Passing Images to Claudish

### Method 1: Image File Path (Recommended)

```bash
# Pass image file directly with --image flag
npx claudish --model "$GEMINI_MODEL" --image "$IMAGE_PATH" --quiet --auto-approve <<< "$ANALYSIS_PROMPT"

# Example
npx claudish --model "g/gemini-3-pro-preview" --image "screenshots/dashboard.png" --quiet --auto-approve <<< "Analyze this UI for usability issues."
```

### Method 2: Base64 Encoded (For Inline Images)

```bash
# Encode image to base64
IMAGE_B64=$(base64 -i "$IMAGE_PATH")

# Include in prompt with data URI
printf '%s' "[Image: data:image/png;base64,$IMAGE_B64]

Analyze this UI for usability issues." | npx claudish --stdin --model "$GEMINI_MODEL" --quiet --auto-approve
```

### Method 3: URL Reference (For Remote Images)

```bash
# Reference image by URL
printf '%s' "[Image: https://example.com/screenshot.png]

Analyze this UI for usability issues." | npx claudish --stdin --model "$GEMINI_MODEL" --quiet --auto-approve
```

## Prompting Patterns

### Pattern 1: General Usability Review

```markdown
Analyze this UI screenshot for usability issues.

**Image**: [attached or path]

**Focus Areas**:
1. Visual hierarchy - Is the most important content prominent?
2. Affordances - Do interactive elements look clickable/tappable?
3. Feedback - Is system status clearly communicated?
4. Consistency - Do similar elements behave similarly?
5. Error prevention - Are destructive actions guarded?

**Output Format**:
For each issue found:
- **Location**: Where in the UI
- **Issue**: What the problem is
- **Principle**: Which design principle it violates
- **Severity**: CRITICAL/HIGH/MEDIUM/LOW
- **Recommendation**: Specific fix
```

### Pattern 2: WCAG Accessibility Audit

```markdown
Audit this UI for WCAG 2.1 AA compliance.

**Image**: [attached or path]

**Checklist**:
1. **Perceivable**
   - [ ] Text contrast >= 4.5:1 (WCAG 1.4.3)
   - [ ] Non-text contrast >= 3:1 (WCAG 1.4.11)
   - [ ] Information not conveyed by color alone (WCAG 1.4.1)
   - [ ] Text resizable to 200% (WCAG 1.4.4)

2. **Operable**
   - [ ] Keyboard accessible (WCAG 2.1.1)
   - [ ] No keyboard traps (WCAG 2.1.2)
   - [ ] Focus visible (WCAG 2.4.7)
   - [ ] Touch targets >= 44x44px (WCAG 2.5.5)

3. **Understandable**
   - [ ] Labels present for inputs (WCAG 3.3.2)
   - [ ] Error identification clear (WCAG 3.3.1)
   - [ ] Instructions available (WCAG 3.3.2)

4. **Robust**
   - [ ] Valid structure implied (headings, regions)

**Output Format**:
| Criterion | Status | Notes | Fix |
|-----------|--------|-------|-----|
| 1.4.3 | PASS/FAIL | Details | Recommendation |
```

### Pattern 3: Design System Consistency Check

```markdown
Compare this implementation against the design system.

**Implementation Image**: [attached or path]
**Design System Reference**: [tokens, components, patterns]

**Validation Points**:
1. **Colors**
   - Primary, secondary, accent colors
   - Semantic colors (success, warning, error)
   - Background and surface colors

2. **Typography**
   - Font family usage
   - Size scale adherence
   - Weight usage (regular, medium, bold)
   - Line height consistency

3. **Spacing**
   - Margin scale (4, 8, 16, 24, 32, 48...)
   - Padding consistency
   - Gap between elements

4. **Components**
   - Button variants (primary, secondary, ghost)
   - Input styles (default, focus, error, disabled)
   - Card patterns

5. **Elevation**
   - Shadow levels
   - Border usage
   - Layer hierarchy

**Output Format**:
| Element | Expected | Actual | Deviation |
|---------|----------|--------|-----------|
| Button BG | #2563EB | #3B82F6 | Wrong shade |
```

### Pattern 4: Comparative Design Review

```markdown
Compare the implementation screenshot to the original design.

**Design Reference**: [Figma export or mockup]
**Implementation**: [Screenshot of built UI]

**Comparison Points**:
1. Layout and positioning accuracy
2. Color fidelity
3. Typography matching
4. Spacing precision
5. Component rendering
6. Responsive behavior (if multiple sizes)

**Output Format**:
## Match Analysis

**Overall Fidelity**: X/10

### Exact Matches
- [List elements that match perfectly]

### Deviations
| Element | Design | Implementation | Impact | Fix |
|---------|--------|----------------|--------|-----|
| CTA Button | #2563EB | #3B82F6 | Visual | Change to design color |

### Missing Elements
- [Elements in design but not in implementation]

### Extra Elements
- [Elements in implementation but not in design]
```

## Review Templates

### Quick Review (5 minutes)

Focus on critical issues only:
1. Can users complete the primary task?
2. Are there any major accessibility barriers?
3. Is the visual hierarchy clear?
4. Are interactive elements obviously interactive?

### Standard Review (15 minutes)

Full heuristic evaluation:
1. All Nielsen's 10 heuristics
2. WCAG AA key criteria
3. Visual design quality
4. Interaction design

### Comprehensive Review (30+ minutes)

Deep analysis including:
1. Full heuristic evaluation
2. Complete WCAG AA audit
3. Design system consistency
4. Competitive analysis context
5. User flow mapping

## Severity Guidelines

| Severity | User Impact | Examples | Action |
|----------|-------------|----------|--------|
| **CRITICAL** | Blocks task completion | Invisible submit button, broken flow | Fix immediately |
| **HIGH** | Major barrier | Fails WCAG AA, confusing navigation | Fix before release |
| **MEDIUM** | Noticeable friction | Inconsistent spacing, unclear labels | Fix in next sprint |
| **LOW** | Polish opportunity | Minor alignment, shade variance | Backlog |

## Integration with Multi-Model Validation

The ui-designer agent supports PROXY_MODE for multi-model design reviews:

```
Task: ui-designer PROXY_MODE: or/google/gemini-3-pro-preview

Review the dashboard screenshot at screenshots/dashboard.png

Focus on usability and accessibility.
Write review to: ${SESSION_PATH}/reviews/design-review/gemini.md
```

This enables:
- Running multiple design reviewers in parallel
- Consensus analysis on design issues
- Different model perspectives (Gemini vision, Claude reasoning)

## Best Practices

### DO
- Always validate image inputs exist before analysis
- Cite specific design principles for every issue
- Provide actionable, specific recommendations
- Prioritize by severity (CRITICAL first)
- Use Gemini for visual analysis (not guessing)

### DON'T
- Give vague aesthetic opinions ("looks bad")
- Overwhelm with LOW severity items
- Forget accessibility considerations
- Skip the principle citation
- Assume implementation details without seeing

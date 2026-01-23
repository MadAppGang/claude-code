---
name: ui-implement
version: 1.0.0
description: |
  Patterns for implementing UI improvements based on design analysis.
  Works with review documents from dev:ui-analyse or /dev:ui command.
  Includes Anti-AI design rules and visual verification.
---

# UI Implementation Skill

## Overview

This skill provides patterns for implementing UI improvements based on design analysis. It transforms review findings into code changes following Anti-AI design principles.

## Relationship to Other Skills

| Skill | Purpose | Modifies Code? |
|-------|---------|----------------|
| dev:ui-analyse | Visual analysis, issue detection | No |
| dev:ui-implement | Apply improvements from analysis | Yes |
| dev:ui-style-format | Style file specification | No |
| dev:design-references | Reference image management | No |

## Prerequisite

This skill assumes analysis has been completed using:
- `dev:ui-analyse` skill
- `/dev:ui` command output
- External design review

Before implementing, ensure you have:
1. A review document with identified issues
2. Component path(s) to modify
3. Understanding of the visual metaphor to apply

## Implementation Workflow

### Phase 1: Parse Review Document

Extract actionable items from the review document.

```bash
# Extract actionable items from review
parse_review() {
  local review_path="$1"

  # Extract CRITICAL and HIGH issues
  grep -A 2 "^\[CRITICAL\]" "$review_path"
  grep -A 2 "^\[HIGH\]" "$review_path"
}
```

**What to Look For**:
- CRITICAL issues (fix immediately)
- HIGH issues (fix before release)
- Specific component locations
- Recommended changes

### Phase 2: Visual Context (Optional)

If Gemini available and screenshot provided, understand the current visual state.

```bash
# Understand current visual state
npx claudish --model "$GEMINI_MODEL" --image "$CURRENT_SCREENSHOT" --quiet --auto-approve <<< "
Describe the current UI implementation:
1. Layout structure
2. Color scheme
3. Typography
4. Animation presence
5. Areas needing improvement

Output as structured data for implementation."
```

**Provider Detection**:

```bash
# Check providers in priority order
if [[ -n "$GEMINI_API_KEY" ]]; then
  GEMINI_MODEL="g/gemini-3-pro-preview"
elif [[ -n "$OPENROUTER_API_KEY" ]]; then
  GEMINI_MODEL="or/google/gemini-3-pro-preview"
elif [[ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]]; then
  GEMINI_MODEL="vertex/gemini-3-pro-preview"
else
  GEMINI_MODEL=""  # Text-only mode
fi
```

### Phase 3: Apply Anti-AI Improvements

Apply the five core Anti-AI design rules to transform generic UI into distinctive design.

See **Anti-AI Design Rules** section below for detailed patterns.

### Phase 4: Visual Verification (Optional)

If Gemini available after changes, verify improvements were applied correctly.

```bash
# Verify improvements
npx claudish --model "$GEMINI_MODEL" --image "$NEW_SCREENSHOT" --quiet --auto-approve <<< "
Verify these improvements were applied:
1. Asymmetric layout: {expected}
2. Texture/depth: {expected}
3. Typography drama: {expected}
4. Micro-interactions: {expected}
5. Bespoke colors: {expected}

Score 1-10 and note any remaining issues."
```

## Anti-AI Design Rules

These rules transform generic, AI-generated looking UI into distinctive, human-crafted designs.

### Rule 1: Break Symmetry

Rigid symmetric grids look AI-generated. Break them with asymmetric bento layouts.

```tsx
// BEFORE: Symmetric grid
<div className="grid grid-cols-3 gap-4">

// AFTER: Asymmetric bento
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-7 row-span-2" />
  <div className="col-span-5" />
  <div className="col-span-3" />
  <div className="col-span-2 -mt-8" />
</div>
```

**Key Techniques**:
- Use 12-column grids for flexibility
- Vary column spans (7+5, not 6+6)
- Use negative margins for overlap
- Vary row heights
- Break alignment intentionally

### Rule 2: Add Texture

Flat solid colors look AI-generated. Add gradients, glass effects, and depth.

```tsx
// BEFORE: Flat
<div className="bg-white rounded-lg">

// AFTER: Textured
<div className="
  bg-gradient-to-br from-white/80 to-white/40
  backdrop-blur-xl
  border border-white/20
  shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]
">
```

**Key Techniques**:
- Gradient backgrounds (subtle, directional)
- Glassmorphism (backdrop-blur + semi-transparent)
- Complex shadows with inset highlights
- Border with alpha for subtle edges
- Noise texture overlays

### Rule 3: Dramatic Typography

Generic typography looks AI-generated. Create dramatic visual hierarchy.

```tsx
// BEFORE: Generic
<h1 className="text-2xl font-bold">Welcome</h1>

// AFTER: Dramatic
<h1 className="
  text-[clamp(4rem,15vw,12rem)]
  font-serif font-thin tracking-[-0.04em]
  leading-[0.85]
  bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900
  bg-clip-text text-transparent
">
  Welcome
</h1>
```

**Key Techniques**:
- Fluid typography with clamp()
- Extreme size contrasts (body 16px, hero 120px+)
- Tight line-height for headlines (0.85-0.95)
- Negative letter-spacing for large text
- Gradient text with bg-clip-text
- Mix serif/sans-serif for contrast

### Rule 4: Micro-Interactions

Static elements look AI-generated. Add motion and feedback.

```tsx
// BEFORE: Static
<button className="bg-blue-500 hover:bg-blue-600">

// AFTER: Reactive
<motion.button
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
  className="
    bg-gradient-to-r from-violet-600 to-indigo-600
    hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]
    transition-shadow duration-300
  "
>
```

**Key Techniques**:
- Spring physics for natural feel
- Subtle scale on hover (1.02-1.05)
- Y-axis lift effect
- Shadow glow expansion
- Staggered animations for lists
- Exit animations (not just enter)

### Rule 5: Bespoke Colors

Default Tailwind colors look AI-generated. Create custom palettes.

```tsx
// BEFORE: Default palette
<div className="bg-blue-500 text-white">

// AFTER: Bespoke palette
<div className="
  bg-[#0D0D0D]
  text-[#E8E4DD]
  bg-gradient-to-br
  from-[#1a1a2e] via-[#16213e] to-[#0f3460]
">
```

**Key Techniques**:
- Custom hex colors (not Tailwind defaults)
- Off-whites instead of pure white (#E8E4DD, #FAF9F6)
- Rich blacks instead of pure black (#0D0D0D, #1a1a2e)
- Color gradients across multiple stops
- Consistent palette derived from style guide

## Visual Metaphor Library

When implementing, select an appropriate visual metaphor to guide decisions.

| Metaphor | Use Case | Key Characteristics |
|----------|----------|---------------------|
| Cyberpunk Glass | Dashboards, tech | Neon accents + glassmorphism + dark backgrounds |
| Swiss Minimalist | Professional, B2B | Strict grid + high contrast + precise spacing |
| Neo-Brutalism | Creative, bold | Thick borders + clashing colors + raw shapes |
| Organic Luxury | Premium, fashion | Warm neutrals + serif typography + slow motion |
| Editorial Magazine | Marketing, content | Large display type + asymmetric images + whitespace |

**Applying a Metaphor**:
1. Choose based on brand/context
2. Apply consistent characteristics across all changes
3. Document choice in implementation log
4. Verify consistency in visual check

## Required Dependencies

Ensure these are installed before implementing micro-interactions:

```bash
npm install framer-motion lucide-react
# or
bun add framer-motion lucide-react
```

**Dependency Usage**:
- `framer-motion`: All animation and gesture handling
- `lucide-react`: Icon library (consistent, customizable)

## Implementation Log Format

When completing implementation, create a log documenting all changes.

```markdown
## Implementation Log

**Component**: {component_path}
**Session**: {session_id}
**Date**: {timestamp}

### Changes Applied

1. **{Issue from Review}**
   - Before: {description}
   - After: {description}
   - Code: {file:line}

2. **{Issue from Review}**
   - Before: {description}
   - After: {description}
   - Code: {file:line}

### Visual Metaphor

{metaphor_name}: {brief explanation of why chosen and how applied}

### Anti-AI Rules Applied

- [x] Rule 1: Break Symmetry - {how applied}
- [x] Rule 2: Add Texture - {how applied}
- [x] Rule 3: Dramatic Typography - {how applied}
- [ ] Rule 4: Micro-Interactions - {not applicable or how applied}
- [x] Rule 5: Bespoke Colors - {how applied}

### Dependencies Added

{list if any, or "None"}

### Verification Status

- [ ] Visual verified with Gemini
- [ ] Manual testing recommended
- [ ] Responsive breakpoints checked
- [ ] Accessibility preserved
```

## Best Practices

### DO
- Read the full review document before starting
- Apply changes systematically (one rule at a time)
- Preserve existing accessibility features
- Test responsive behavior after changes
- Document all changes in implementation log
- Use Gemini verification when available

### DON'T
- Apply all Anti-AI rules blindly (assess what's needed)
- Break existing functionality for aesthetics
- Ignore accessibility for visual appeal
- Skip the implementation log
- Forget to install required dependencies
- Mix multiple visual metaphors inconsistently

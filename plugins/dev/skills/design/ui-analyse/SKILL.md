---
name: ui-analyse
version: 2.0.0
description: |
  UI visual analysis patterns using Gemini 3 Pro Preview multimodal capabilities.
  Analysis-only - no code changes. Use dev:ui-implement for applying improvements.
  Includes provider detection, prompting patterns, and severity guidelines.
---

# UI Analysis Skill

## Overview

This skill provides patterns for analyzing UI designs visually using Gemini 3 Pro Preview. It is **analysis-only** - for implementing improvements, use `dev:ui-implement`.

## Relationship to Other Skills

| Skill | Purpose | Modifies Code? |
|-------|---------|----------------|
| dev:ui-analyse | Visual analysis, issue detection | No |
| dev:ui-implement | Apply improvements from analysis | Yes |
| dev:ui-style-format | Style file specification | No |
| dev:design-references | Reference image management | No |

## Provider Selection

### Detection Logic

```bash
detect_gemini_provider() {
  # Priority 1: Gemini Direct API (lowest latency)
  if [[ -n "$GEMINI_API_KEY" ]]; then
    echo "g/gemini-3-pro-preview"
    return 0
  fi

  # Priority 2: OpenRouter (requires or/ prefix)
  if [[ -n "$OPENROUTER_API_KEY" ]]; then
    echo "or/google/gemini-3-pro-preview"
    return 0
  fi

  # Priority 3: Vertex AI
  if [[ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]]; then
    echo "vertex/gemini-3-pro-preview"
    return 0
  fi

  # Priority 4: Gemini OAuth (check claudish)
  if npx claudish --list-accounts 2>/dev/null | grep -q "gemini"; then
    echo "g/gemini-3-pro-preview"
    return 0
  fi

  # No provider
  return 1
}
```

### Model Prefix Reference

| Prefix | Provider | Env Var | Notes |
|--------|----------|---------|-------|
| `g/` | Gemini Direct | GEMINI_API_KEY | Lowest latency |
| `or/` | OpenRouter | OPENROUTER_API_KEY | Avoids google/ collision |
| `vertex/` | Vertex AI | GOOGLE_APPLICATION_CREDENTIALS | Enterprise |

### Error Messages by Provider

| Provider | Missing | Error Message | Setup Instructions |
|----------|---------|---------------|-------------------|
| gemini_direct | GEMINI_API_KEY | "Gemini API key not found" | `export GEMINI_API_KEY="your-key"` from aistudio.google.com |
| openrouter | OPENROUTER_API_KEY | "OpenRouter API key not found" | `export OPENROUTER_API_KEY="your-key"` from openrouter.ai |
| vertex_ai | GOOGLE_APPLICATION_CREDENTIALS | "Google Cloud credentials not configured" | `gcloud auth application-default login` |
| gemini_oauth | OAuth session | "No Gemini OAuth session" | `claudish auth gemini` |

## Analysis Patterns

### Pattern 1: Quick Usability Scan

```markdown
Analyze this UI screenshot for usability issues.

**Focus Areas**:
1. Visual hierarchy - Is the most important content prominent?
2. Affordances - Do interactive elements look clickable?
3. Consistency - Do similar elements behave similarly?

**Output**: Top 5 issues with severity and location.
```

**Usage**:
```bash
npx claudish --model "$GEMINI_MODEL" --image "$SCREENSHOT_PATH" --quiet --auto-approve <<< "
Analyze this UI screenshot for usability issues.

Focus Areas:
1. Visual hierarchy - Is the most important content prominent?
2. Affordances - Do interactive elements look clickable?
3. Consistency - Do similar elements behave similarly?

Output: Top 5 issues with severity and location."
```

### Pattern 2: Accessibility Audit

```markdown
Audit this UI for WCAG 2.1 AA compliance.

**Checklist**:
- [ ] Text contrast >= 4.5:1 (WCAG 1.4.3)
- [ ] Non-text contrast >= 3:1 (WCAG 1.4.11)
- [ ] Touch targets >= 44x44px (WCAG 2.5.5)
- [ ] Focus visible (WCAG 2.4.7)

**Output**: Pass/Fail per criterion with evidence.
```

**Usage**:
```bash
npx claudish --model "$GEMINI_MODEL" --image "$SCREENSHOT_PATH" --quiet --auto-approve <<< "
Audit this UI for WCAG 2.1 AA compliance.

Checklist:
- Text contrast >= 4.5:1 (WCAG 1.4.3)
- Non-text contrast >= 3:1 (WCAG 1.4.11)
- Touch targets >= 44x44px (WCAG 2.5.5)
- Focus visible (WCAG 2.4.7)

Output as: Pass/Fail per criterion with visual evidence."
```

### Pattern 3: Anti-AI Design Audit

```markdown
Analyze this UI for "AI-generated" patterns that should be avoided.

**Check for**:
1. Rigid symmetric grids (should be asymmetric)
2. Flat solid colors (should have gradients/texture)
3. Generic typography (should have dramatic hierarchy)
4. Static elements (should have micro-interactions)
5. Default Tailwind colors (should be bespoke palette)

**Output**: List violations with specific recommendations.
```

**Usage**:
```bash
npx claudish --model "$GEMINI_MODEL" --image "$SCREENSHOT_PATH" --quiet --auto-approve <<< "
Analyze this UI for AI-generated patterns that should be avoided.

Check for:
1. Rigid symmetric grids (should be asymmetric)
2. Flat solid colors (should have gradients/texture)
3. Generic typography (should have dramatic hierarchy)
4. Static elements (should have micro-interactions)
5. Default Tailwind colors (should be bespoke palette)

List each violation found with specific recommendations for improvement."
```

### Pattern 4: Comparative Analysis

```markdown
Compare these two images:
- Image 1: Design reference
- Image 2: Implementation

**Validate**:
1. Layout accuracy
2. Color fidelity
3. Typography matching
4. Spacing precision
5. Component rendering

**Output**: Match score (1-10) and deviation list.
```

**Usage**:
```bash
npx claudish --model "$GEMINI_MODEL" \
  --image "$REFERENCE_PATH" \
  --image "$IMPLEMENTATION_PATH" \
  --quiet --auto-approve <<< "
Compare these two images:
- Image 1: Design reference (target)
- Image 2: Current implementation

Validate:
1. Layout accuracy
2. Color fidelity
3. Typography matching
4. Spacing precision
5. Component rendering

Output: Match score (1-10) and list of specific deviations."
```

## Severity Guidelines

| Severity | Impact | Examples | Action |
|----------|--------|----------|--------|
| CRITICAL | Blocks task | Invisible button, broken flow | Fix immediately |
| HIGH | Major barrier | WCAG fail, confusing nav | Fix before release |
| MEDIUM | Friction | Inconsistent spacing | Next sprint |
| LOW | Polish | Minor alignment | Backlog |

## Output Format

Analysis results should follow this structure:

```markdown
## UI Analysis Results

**Target**: {image_path}
**Provider**: {gemini_model}
**Date**: {timestamp}
**Score**: {X}/10

### Issues by Severity

#### CRITICAL
{issues or "None found"}

#### HIGH
{issues or "None found"}

#### MEDIUM
{issues or "None found"}

#### LOW
{issues or "None found"}

### Strengths
{positive observations}

### Recommendations
{actionable improvements}
```

## Integration with /dev:ui Command

The `/dev:ui` command uses this skill when:
1. User requests analysis only ("review", "audit", "check")
2. User provides image without implementation request
3. As first step before `dev:ui-implement`

### Intent Triggers for Analysis

**Primary triggers** (route to ui-analyse):
- review, analyze, analyse, audit, check, evaluate, assess, score
- inspect, critique, rate, examine

**Pattern triggers** (route to ui-analyse):
- "what's wrong with", "problems with", "issues with"
- "accessibility", "usability", "wcag"

### Workflow Integration

When used via `/dev:ui`:
1. Command detects analysis intent
2. Detects Gemini provider
3. Runs visual analysis with Gemini
4. Writes review to: `${SESSION_PATH}/reviews/design-review/gemini.md`
5. Presents summary to user

## Pattern 5: Fallback Mode (Text-Only)

If no Gemini provider is available:
1. Note in output: "Visual verification unavailable - manual review recommended"
2. Proceed with text-based analysis if component code is available
3. Use code analysis to infer potential issues
4. Recommend user provide API key for full visual analysis

## Best Practices

### DO
- Always validate image inputs exist before analysis
- Cite specific design principles for every issue
- Provide actionable, specific recommendations
- Prioritize by severity (CRITICAL first)
- Use Gemini for visual analysis (not guessing)

### DON'T
- Make code changes (use dev:ui-implement for that)
- Give vague aesthetic opinions ("looks bad")
- Overwhelm with LOW severity items
- Forget accessibility considerations
- Skip the principle citation
- Assume implementation details without seeing

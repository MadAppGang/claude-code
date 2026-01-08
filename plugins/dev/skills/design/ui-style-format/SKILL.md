---
name: ui-style-format
version: 1.0.0
description: |
  UI design style file format specification with reference image support.
  Defines the schema for .claude/design-style.md and .claude/design-references/.
  Use when creating, validating, or parsing project design styles.
---

# UI Style Format Specification

## Overview

The UI Style system provides a standardized way to define project design preferences
that the `ui` agent uses during design reviews. It supports both text-based style
definitions and visual reference images.

## File Structure

```
{project}/
  .claude/
    design-style.md              # Main style configuration
    design-references/           # Visual reference images
      {image}.png                # PNG or JPG screenshots
      MANIFEST.md                # Optional metadata
```

## design-style.md Schema

### Required Sections

| Section | Purpose |
|---------|---------|
| Header | Version, dates, base reference |
| Reference Images | Links to visual references (v2.0+) |
| Brand Colors | Color palette with light/dark modes |
| Typography | Fonts and type scale |
| Spacing | Base unit and scale |
| Component Patterns | Button, input, card styles |
| Design Rules | DO and DON'T guidelines |

### Optional Sections

| Section | Purpose |
|---------|---------|
| Reference URLs | External style guides |
| Style History | Change log |
| MANIFEST.md | Detailed image descriptions |

## Reference Images Integration

### Storage Location

All reference images MUST be stored in `.claude/design-references/`.

### Supported Formats

| Format | Extension | Recommended Use |
|--------|-----------|-----------------|
| PNG | .png | Screenshots, UI components |
| JPEG | .jpg, .jpeg | Photos, complex imagery |
| WebP | .webp | Modern alternative to PNG/JPEG |

### Image Table Format

In the style file, reference images are listed in a table:

```markdown
## Reference Images

| Image | Description | Captured | Mode |
|-------|-------------|----------|------|
| hero-section.png | Homepage hero | 2026-01-08 | light |
```

### Usage Guidelines Section

Each image should have usage notes:

```markdown
### Usage Guidelines

- **hero-section.png**: Reference for hero layout, gradient, CTA placement
```

## Parsing the Style File

### Section Extraction

1. Read `.claude/design-style.md` with Read tool
2. Split by `## ` headers
3. Parse tables using Markdown table regex
4. Extract key-value pairs from tables

### Reference Image Resolution

```
Image Name -> .claude/design-references/{image_name}
```

Example:
```
hero-section.png -> .claude/design-references/hero-section.png
```

### Validation Checklist

Before using a style file, validate:

1. File exists at `.claude/design-style.md`
2. Required sections present
3. Referenced images exist in `.claude/design-references/`
4. Colors are valid hex codes
5. Spacing values are numbers

## Integration with ui Agent

### Style-Aware Review Flow

When the ui agent performs a review:

1. **Load Style**: Read `.claude/design-style.md`
2. **Load References**: List `.claude/design-references/`
3. **Match Components**: Find relevant reference images for review target
4. **Comparative Analysis**: Pass reference image + target to Gemini
5. **Validate Tokens**: Check colors, typography, spacing against style

### Gemini Prompt with References

```
Compare this implementation screenshot against the project design reference.

**Reference Image**: .claude/design-references/hero-section.png
**Implementation**: screenshots/current-hero.png

**Style Tokens** (from .claude/design-style.md):
- Primary Color: #2563EB
- Font: Inter 16px
- Spacing: 4px base

**Validate**:
1. Layout matches reference
2. Colors match defined palette
3. Typography follows scale
4. Spacing uses defined tokens
```

## Version Compatibility

| Version | Features |
|---------|----------|
| 1.x | Text-only style (legacy) |
| 2.x | Reference images + text style |

Version 2.x is backward compatible - the ui agent handles missing
`## Reference Images` section gracefully.

## Best Practices

### Capturing Reference Images

1. **Consistent viewport**: Use same browser width (e.g., 1440px)
2. **Clean state**: No modals, tooltips unless intentional
3. **Both modes**: Capture light and dark variants
4. **Component isolation**: Crop to relevant area

### Writing Usage Guidelines

Be specific about what each image demonstrates:

**Good**: "Reference for button padding (12px), border-radius (8px), and hover state"
**Bad**: "Button reference"

### Updating Styles

When UI changes:

1. Capture new screenshot
2. Replace old image (same name) or add new
3. Update Reference Images table
4. Add entry to Style History

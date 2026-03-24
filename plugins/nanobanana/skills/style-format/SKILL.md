---
name: style-format
description: "Defines the markdown-based style template format for AI image generation. Specifies file structure, color palettes, technical rendering notes, and security validation rules. Use when creating style templates, customizing artistic direction for image generation, or combining styles with reference images."
---

# Style Format Specification

Styles are single markdown files in the `styles/` directory. The entire file content is prepended to the user's prompt to define artistic direction.

## File Location

```
{project}/
  styles/
    glass.md
    watercolor.md
    cyberpunk.md
```

## Template Structure

```markdown
# Style Name

{Overall description of the visual style — mood, atmosphere, key visual characteristics.}

## Color Palette
- Primary: {color} ({hex})
- Secondary: {color} ({hex})
- Background: {color} ({hex})

## Technical Notes
{Rendering style, lighting, materials, post-processing}
```

## Example: Blue Glass 3D

```markdown
# Blue Glass 3D Style

A photorealistic 3D render with blue glass material. Objects should have:
- Glossy, translucent blue glass surface
- Subtle reflections and refractions
- Solid black background
- Soft studio lighting from above-left

## Color Palette
- Primary: Deep blue (#1a4b8c)
- Highlights: Light cyan (#7fdbff)
- Background: Pure black (#000000)

## Technical Notes
- Use ray-traced rendering appearance
- Include caustic light effects
```

## Usage

```bash
# Apply style to generation
uv run python main.py out.png "gear icon" --style styles/glass.md

# Combine style with reference image
uv run python main.py out.png "cube" --style styles/glass.md --ref prev.png
```

**Verification:** Confirm the style file exists at the specified path before passing to the generator.

## Style vs Reference

| Concept | Type | Purpose |
|---------|------|---------|
| Style | Text (.md) | Artistic direction via description |
| Reference | Image | Visual example for consistency |

Both can be combined for best results.

## Security

Style files are validated for injection patterns (no shell code blocks, variable expansion, or command substitution). Suspicious patterns generate warnings.

## Notes

- Be specific: "Soft watercolor washes with visible paper texture"
- Include hex color codes for consistency
- Describe mood and atmosphere explicitly
- One style per file for clarity

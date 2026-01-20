---
name: style-format
description: Style template format specification. Single markdown files that describe artistic direction.
---
plugin: nanobanana
updated: 2026-01-20

# Style Format Specification

## Overview

Styles are **single markdown files** in the `styles/` directory.
The entire file content is prepended to the user's prompt.

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

{Overall description of the visual style. Be vivid and specific.
Include mood, atmosphere, key visual characteristics.}

## Color Palette
- Primary: {color} ({hex})
- Secondary: {color} ({hex})
- Background: {color} ({hex})
- Accents: {colors}

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
- Sharp shadows

## Color Palette
- Primary: Deep blue (#1a4b8c)
- Highlights: Light cyan (#7fdbff)
- Background: Pure black (#000000)

## Technical Notes
- Use ray-traced rendering appearance
- Include caustic light effects
- Maintain consistent material across objects
```

## Usage

```bash
# Apply style to generation
uv run python main.py out.png "gear icon" --style styles/glass.md

# Combine with reference
uv run python main.py out.png "cube" --style styles/glass.md --ref prev.png
```

## Style vs Reference

| Concept | Type | Purpose |
|---------|------|---------|
| Style | Text (.md) | Artistic direction via description |
| Reference | Image | Visual example for consistency |

Both can be combined for best results.

## Security Notes

Style files are validated for potential injection patterns:
- No bash/shell code blocks
- No variable expansion (${ })
- No command substitution ($( ))
- No shell operators (& | ; `)

Suspicious patterns generate warnings but don't block creation.

## Writing Effective Styles

1. **Be Specific**: "Soft watercolor washes with visible paper texture"
2. **Include Colors**: Hex codes ensure consistency
3. **Describe Mood**: "Mysterious, slightly unsettling"
4. **Technical Details**: Lighting, camera angle, rendering style
5. **Keep It Focused**: One style per file

# Nano Banana Plugin

AI image generation and editing using Google Gemini 3 Pro Image API.

**Version:** 2.2.0
**Category:** media
**License:** MIT

## Features

- **Text-to-Image**: Generate images from text prompts
- **Style Templates**: Apply markdown-based style templates
- **Batch Generation**: Generate multiple variations at once
- **Image Editing**: Modify existing images with natural language
- **Reference Images**: Use reference images for style consistency
- **Aspect Ratios**: Support for 1:1, 3:4, 4:3, 9:16, 16:9, 21:9, and more
- **Node.js Native**: No Python required, uses Node.js (already installed for Claude Code)

## Installation

1. **Install the plugin** via Claude Code:
   ```bash
   /plugin marketplace add MadAppGang/claude-code
   ```

2. **Enable in `.claude/settings.json`**:
   ```json
   {
     "enabledPlugins": {
       "nanobanana@mag-claude-plugins": true
     }
   }
   ```

3. **Set up your Gemini API key**:
   ```bash
   export GEMINI_API_KEY="your-api-key"
   ```

   Get your API key from: https://makersuite.google.com/app/apikey

4. **Install dependencies**:
   ```bash
   cd plugins/nanobanana
   npm install
   ```

## Quick Start

### Generate an Image

```bash
/nb-generate "A minimal 3D cube on black background"
```

### Create and Use a Style

```bash
# Create a style
/nb-style create glass
# Describe: "3D glass material with blue tint, reflections, black background"

# Generate with style
/nb-generate "gear icon" --style glass
```

### Batch Generation

```bash
/nb-generate "cube" "sphere" "pyramid" --style glass
# Creates: generated/cube_001.png, generated/cube_002.png, generated/cube_003.png
```

### Edit an Image

```bash
/nb-edit photo.jpg "Make the sky more dramatic"
```

### With Reference Image

```bash
/nb-generate "Same style but with a sphere" --ref previous_output.png
```

## Commands

### `/nb-generate`

Generate images from text prompts.

**Usage:**
```
/nb-generate "prompt" [--style name] [--aspect ratio] [--ref image]
```

**Examples:**
```bash
/nb-generate "A serene mountain lake at sunset"
/nb-generate "gear icon" --style glass
/nb-generate "cube" "sphere" "pyramid" --style glass --aspect 1:1
/nb-generate "landscape" --aspect 16:9
```

### `/nb-edit`

Edit existing images with natural language instructions.

**Usage:**
```
/nb-edit <image> "instruction" [--ref image]
```

**Examples:**
```bash
/nb-edit photo.jpg "Add dramatic sunset colors to the sky"
/nb-edit logo.png "Change colors to blue and gold"
/nb-edit scene.jpg "Add a rainbow" --ref rainbow_style.png
```

### `/nb-style`

Manage style templates.

**Usage:**
```
/nb-style <action> [name]
```

**Actions:**
- `create` - Create a new style
- `list` - List all available styles
- `show` - Display style contents
- `update` - Update existing style
- `delete` - Delete style (with confirmation)

**Examples:**
```bash
/nb-style create watercolor
/nb-style list
/nb-style show glass
/nb-style delete minimalist
```

## Aspect Ratios

| Ratio | Use Case |
|-------|----------|
| 1:1 | Social media, icons |
| 3:4 | Portrait photos |
| 4:3 | Traditional photos |
| 4:5 | Instagram portrait |
| 5:4 | Landscape photos |
| 9:16 | Mobile wallpapers, stories |
| 16:9 | YouTube thumbnails, desktop |
| 21:9 | Ultrawide, cinematic |

## Style System

Styles are simple markdown files stored in `styles/` directory. The entire file content is used to enhance your prompts.

### Style Template

```markdown
# Style Name

{Vivid description of the visual style. Include:
- Overall aesthetic and mood
- Key visual characteristics
- Lighting and atmosphere
- Material properties if applicable}

## Color Palette
- Primary: {color} ({hex})
- Secondary: {color} ({hex})
- Background: {color} ({hex})

## Technical Notes
{Rendering style, camera angles, post-processing}
```

### Example: Blue Glass 3D

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

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI API key for Gemini |

**Setup:**
```bash
# macOS/Linux
export GEMINI_API_KEY="your-api-key"

# Add to shell profile for persistence
echo 'export GEMINI_API_KEY="your-key"' >> ~/.zshrc
```

## Example Workflows

### Workflow 1: Icon Set with Consistent Style

```bash
# 1. Create style
/nb-style create glass
# Describe: "3D glass material with blue tint"

# 2. Generate first icon
/nb-generate "home icon" --style glass

# 3. Use as reference for consistency
/nb-generate "settings icon" --style glass --ref generated/home_icon.png
/nb-generate "user icon" --style glass --ref generated/home_icon.png
```

### Workflow 2: Photo Enhancement

```bash
# 1. Edit photo
/nb-edit landscape.jpg "Add dramatic sunset sky"

# 2. Further refinement
/nb-edit landscape_edited.png "Add birds flying in the distance"

# 3. Apply artistic style
/nb-edit landscape_edited.png "Make it look painted" --ref painting_style.jpg
```

### Workflow 3: YouTube Thumbnails

```bash
# Create style for consistent branding
/nb-style create youtube_thumb
# Describe: "Bold text overlay, dramatic lighting, vibrant colors"

# Generate thumbnails at 16:9
/nb-generate "Tech review" "Gaming" "Tutorial" --style youtube_thumb --aspect 16:9
```

## Error Handling

The plugin includes robust error handling:

- **Automatic Retries**: Transient errors (rate limits, network issues) are automatically retried with exponential backoff
- **Structured Error Codes**: Clear error messages with actionable recovery steps
- **Partial Batch Support**: If some images in a batch fail, successful ones are still saved
- **Input Validation**: All inputs are sanitized before execution

## Security

- All user inputs are validated and sanitized
- Style files are checked for injection patterns
- Destructive operations require user confirmation
- No secrets stored in files

## Troubleshooting

### "GEMINI_API_KEY not set"

Set your API key:
```bash
export GEMINI_API_KEY="your-key"
```

### "Style file not found"

List available styles:
```bash
/nb-style list
```

### Rate Limit Errors

The plugin automatically retries with exponential backoff. You can increase retry attempts:
```bash
# Via CLI: --max-retries 5
node main.js out.png "prompt" --max-retries 5
```

## Direct CLI Usage

You can use the Node.js script directly:

```bash
# Simple generation
node plugins/nanobanana/main.js output.png "A minimal 3D cube"

# With style
node plugins/nanobanana/main.js out.png "gear" --style styles/glass.md

# Batch generation
node plugins/nanobanana/main.js out.png "cube" "sphere" "pyramid"

# Edit image
node plugins/nanobanana/main.js edited.png "Make sky blue" --edit photo.jpg

# With reference
node plugins/nanobanana/main.js out.png "prompt" --ref style.png

# Aspect ratio
node plugins/nanobanana/main.js out.png "prompt" --aspect 16:9

# Show help
node plugins/nanobanana/main.js --help
```

## Development

### Requirements

- Node.js 18+
- Google Gemini API key

### Running Tests

```bash
cd plugins/nanobanana

# Install dependencies
npm install

# Test API key setup
echo $GEMINI_API_KEY

# Test simple generation
node main.js test.png "A simple red circle"
```

## License

MIT License - see LICENSE file for details.

## Author

Jack Rudenko (i@madappgang.com)
MadAppGang

## Support

For issues and questions:
- GitHub: https://github.com/MadAppGang/claude-code
- Email: i@madappgang.com

## Changelog

### v2.2.0 (2026-01-05)

**Initial Release**
- Node.js implementation using @google/generative-ai
- Uses Node.js (already available for Claude Code users)
- Simple CLI: `node main.js output.png "prompt" [options]`

**Features:**
- Text-to-image generation with Gemini 3 Pro Image
- Markdown-based style system
- Batch generation with multiple prompts
- Image editing with natural language
- Reference image support
- Configurable aspect ratios

**Security & Reliability:**
- Input sanitization with injection detection
- Exponential backoff retry logic
- Structured error codes
- Destructive operation confirmation

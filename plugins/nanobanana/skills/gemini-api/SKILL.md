---
name: gemini-api
description: Google Gemini 3 Pro Image API reference. Covers text-to-image, editing, reference images, aspect ratios, and error handling.
---
plugin: nanobanana
updated: 2026-01-20

# Gemini Image API Reference

## Quick Start

```bash
# Set API key
export GEMINI_API_KEY="your-key"

# Generate image
uv run python main.py output.png "A minimal 3D cube"
```

## API Key Setup

1. Visit: https://makersuite.google.com/app/apikey
2. Create new API key
3. Set environment variable:
   ```bash
   export GEMINI_API_KEY="your-api-key"
   ```

## Supported Models

| Model | Resolution | Best For |
|-------|------------|----------|
| gemini-3-pro-image-preview | Up to 4K | High quality |
| gemini-2.5-flash-image | Up to 1K | Quick iterations |

## Aspect Ratios

| Ratio | Use Case |
|-------|----------|
| 1:1 | Social media, icons |
| 3:4 | Portrait photos |
| 4:3 | Traditional photos |
| 4:5 | Instagram portrait |
| 5:4 | Landscape photos |
| 9:16 | Mobile, stories |
| 16:9 | YouTube, desktop |
| 21:9 | Cinematic, ultrawide |

## CLI Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--style` | Apply style template | `--style styles/glass.md` |
| `--edit` | Edit existing image | `--edit photo.jpg` |
| `--ref` | Reference image | `--ref style.png` |
| `--aspect` | Aspect ratio | `--aspect 16:9` |
| `--model` | Model ID | `--model gemini-2.5-flash-image` |
| `--max-retries` | Retry attempts | `--max-retries 5` |

## Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `SUCCESS` | Operation completed | N/A |
| `API_KEY_MISSING` | GEMINI_API_KEY not set | Export the variable |
| `FILE_NOT_FOUND` | Referenced file missing | Check path |
| `INVALID_INPUT` | Bad prompt or argument | Fix input |
| `RATE_LIMITED` | Too many requests | Wait, uses auto-retry |
| `NETWORK_ERROR` | Connection failed | Check network, auto-retry |
| `API_ERROR` | Gemini API error | Check logs |
| `CONTENT_POLICY` | Blocked prompt | Adjust content |
| `TIMEOUT` | Request timed out | Retry |
| `PARTIAL_FAILURE` | Some batch items failed | Check individual results |

## Retry Behavior

The script automatically retries on transient errors:
- Rate limits (429)
- Server errors (502, 503)
- Connection timeouts
- Network errors

Retry uses exponential backoff: 1s, 2s, 4s, 8s, etc.
Maximum retries configurable with `--max-retries` (default: 3)

## Best Practices

1. **Prompts**: Be specific about style, lighting, composition
2. **Styles**: Use markdown templates for consistent results
3. **References**: Provide visual examples for style matching
4. **Batch**: Generate variations to pick the best
5. **Iteration**: Edit results to refine
6. **Retries**: Increase `--max-retries` for unreliable connections

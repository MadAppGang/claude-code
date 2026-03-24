---
name: gemini-api
description: "Google Gemini 3 Pro Image API reference for text-to-image generation, image editing, and reference-based styling. Covers API key setup, CLI flags, aspect ratios, error codes, and retry behavior. Use when generating images with Gemini, configuring image generation parameters, or troubleshooting API errors."
---

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
| 16:9 | YouTube, desktop |
| 9:16 | Mobile, stories |

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
| `API_KEY_MISSING` | GEMINI_API_KEY not set | Export the variable |
| `RATE_LIMITED` | Too many requests | Wait, uses auto-retry |
| `CONTENT_POLICY` | Blocked prompt | Adjust content |
| `NETWORK_ERROR` | Connection failed | Check network, auto-retry |

## Retry Behavior

Automatically retries on rate limits (429), server errors (502, 503), and connection timeouts using exponential backoff (1s, 2s, 4s, 8s). Configure max retries with `--max-retries` (default: 3).

## Notes

- Be specific about style, lighting, and composition in prompts
- Use markdown style templates for consistent results
- Provide visual reference images for style matching
- Increase `--max-retries` for unreliable connections

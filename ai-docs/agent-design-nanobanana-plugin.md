# Nano Banana Plugin Design Document

**Plugin Name:** nanobanana
**Version:** 2.1.0
**Category:** media
**Description:** AI image generation and editing using Google Gemini 3 Pro Image API. Features a simple CLI pattern, markdown-based styles, and batch generation support.

---

## Changelog

### v2.1.0 (2025-01-04)

**Security & Validation:**
- Added Input Validation section with sanitization functions
- Added injection pattern detection for style file content
- Added path validation rules

**Error Handling:**
- Added exponential backoff retry logic in main.py
- Added structured error response format with error codes
- Added batch failure reporting protocol

**XML Tag Compliance:**
- Refactored all commands from `<workflow>` to `<orchestration>` tags
- Added `<phases>`, `<delegation_rules>`, `<error_recovery>` to commands
- Added `<implementation_standards>` and `<quality_checks>` to agents

**Safety:**
- Added confirmation phase for destructive operations in /nb-style
- style-manager now shows file contents before overwrite/delete
- Added AskUserQuestion for destructive operation confirmation

**Tool Updates:**
- Added Write/Edit tools to image-generator agent for error recovery
- Documented when agents can run remedial commands

### v2.0.0 (2025-01-04)
- Initial v2 design with simplified style format
- Changed from folder-based to single .md file styles
- Added batch generation support
- Added reference image separation (`--ref` flag)

---

## Table of Contents

1. [Plugin Overview](#plugin-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Input Validation](#input-validation)
4. [CLI Pattern](#cli-pattern)
5. [Style System Specification](#style-system-specification)
6. [Plugin Manifest](#plugin-manifest)
7. [Core Python Script](#core-python-script)
8. [Agents Design](#agents-design)
   - [style-manager](#agent-style-manager)
   - [image-generator](#agent-image-generator)
9. [Commands Design](#commands-design)
   - [/nb-generate](#command-nb-generate)
   - [/nb-edit](#command-nb-edit)
   - [/nb-style](#command-nb-style)
10. [Skills Design](#skills-design)
    - [gemini-api](#skill-gemini-api)
    - [style-format](#skill-style-format)
11. [Environment Variables](#environment-variables)
12. [Example Workflows](#example-workflows)

---

## Plugin Overview

Nano Banana is a Claude Code plugin for AI-powered image generation and editing using Google's Gemini 3 Pro Image model. It follows a **simple CLI pattern** where a single Python script handles all image operations.

### Key Changes from v1.0

| Feature | v1.0 (Old) | v2.0 (New) |
|---------|------------|------------|
| **Style Format** | Folder with description.md + images | Single `.md` file |
| **Reference Images** | Bundled in style folder | Separate `--ref` flag |
| **Batch Generation** | Not supported | Multiple prompts in one command |
| **Execution** | pip + python | `uv run` (modern Python) |
| **Architecture** | Complex agents | Simple script + thin wrappers |

### Features

| Feature | Description |
|---------|-------------|
| Text-to-Image | Generate images from text prompts |
| Style Templates | Apply markdown-based style templates |
| Batch Generation | Generate multiple variations at once |
| Image Editing | Modify existing images via `--edit` |
| Reference Images | Use `--ref` for style consistency |
| Aspect Ratios | Support for 1:1, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 |

---

## Architecture Diagram

```
+------------------------------------------------------------------+
|                      NANO BANANA PLUGIN                          |
+------------------------------------------------------------------+
|                                                                  |
|  COMMANDS (Thin Wrappers)                                        |
|  +------------------+  +------------------+  +------------------+|
|  | /nb-generate     |  | /nb-edit         |  | /nb-style        ||
|  | Wraps main.py    |  | Wraps main.py    |  | Style CRUD       ||
|  +--------+---------+  +--------+---------+  +--------+---------+|
|           |                     |                     |          |
|           v                     v                     v          |
|  INPUT VALIDATION LAYER                                          |
|  +-----------------------------------------------------------+  |
|  |  sanitize_prompt(), validate_path(), validate_style()      |  |
|  +-----------------------------------------------------------+  |
|           |                     |                     |          |
|           v                     v                     v          |
|  CORE SCRIPT                                                     |
|  +-----------------------------------------------------------+  |
|  |                        main.py                             |  |
|  |  - Text-to-image generation                                |  |
|  |  - Image editing (--edit)                                  |  |
|  |  - Style application (--style)                             |  |
|  |  - Reference images (--ref)                                |  |
|  |  - Batch generation (multiple prompts)                     |  |
|  |  - Retry logic with exponential backoff                    |  |
|  +-----------------------------------------------------------+  |
|                                |                                 |
|                                v                                 |
|  AGENTS (Orchestrators)                                          |
|  +------------------+  +------------------+                      |
|  | style-manager    |  | image-generator  |                      |
|  | Manages .md      |  | Orchestrates     |                      |
|  | style files      |  | main.py calls    |                      |
|  +------------------+  +------------------+                      |
|                                                                  |
+------------------------------------------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                    EXTERNAL RESOURCES                            |
|  +------------------+  +------------------+  +------------------+|
|  | styles/          |  | Gemini API       |  | pyproject.toml   ||
|  | *.md files       |  | GEMINI_API_KEY   |  | Dependencies     ||
|  +------------------+  +------------------+  +------------------+|
+------------------------------------------------------------------+
```

---

## Input Validation

### Sanitization Functions

All user input MUST be validated before being passed to bash commands or the Gemini API.

```python
import re
import shlex
from pathlib import Path

# Characters that could be used for shell injection
SHELL_DANGEROUS_CHARS = re.compile(r'[;&|`$(){}[\]<>\\!]')

# Patterns that indicate potential injection in style content
INJECTION_PATTERNS = [
    re.compile(r'```\s*bash', re.IGNORECASE),       # Bash code blocks
    re.compile(r'```\s*shell', re.IGNORECASE),      # Shell code blocks
    re.compile(r'\$\{.*\}'),                         # Variable expansion
    re.compile(r'\$\(.*\)'),                         # Command substitution
    re.compile(r'[;&|`]'),                           # Shell operators
    re.compile(r'<script', re.IGNORECASE),          # Script tags
    re.compile(r'javascript:', re.IGNORECASE),      # JS protocol
]


def sanitize_prompt(prompt: str) -> str:
    """
    Sanitize user prompt for safe use in shell commands.

    Args:
        prompt: Raw user prompt

    Returns:
        Sanitized prompt safe for shell use

    Raises:
        ValueError: If prompt contains dangerous characters
    """
    if not prompt or not prompt.strip():
        raise ValueError("Prompt cannot be empty")

    # Check for shell-dangerous characters
    if SHELL_DANGEROUS_CHARS.search(prompt):
        # Use shlex.quote to safely escape
        return shlex.quote(prompt)

    return prompt


def validate_path(path: str, must_exist: bool = False,
                  allowed_extensions: list[str] | None = None) -> Path:
    """
    Validate a file path for security and existence.

    Args:
        path: Path string to validate
        must_exist: Whether the path must exist
        allowed_extensions: List of allowed extensions (e.g., ['.png', '.jpg'])

    Returns:
        Validated Path object

    Raises:
        ValueError: If path is invalid or doesn't meet requirements
    """
    if not path:
        raise ValueError("Path cannot be empty")

    # Convert to Path object
    p = Path(path).resolve()

    # Check for path traversal attempts
    try:
        # Ensure the resolved path is under a safe directory
        cwd = Path.cwd().resolve()
        p.relative_to(cwd)
    except ValueError:
        # Path is outside current directory - check if it's in a known safe location
        safe_prefixes = ['/tmp/', str(Path.home())]
        if not any(str(p).startswith(prefix) for prefix in safe_prefixes):
            raise ValueError(f"Path traversal detected: {path}")

    # Check existence if required
    if must_exist and not p.exists():
        raise ValueError(f"Path does not exist: {path}")

    # Check extension if specified
    if allowed_extensions:
        if p.suffix.lower() not in [ext.lower() for ext in allowed_extensions]:
            raise ValueError(
                f"Invalid extension {p.suffix}. Allowed: {allowed_extensions}"
            )

    return p


def validate_style_content(content: str) -> tuple[bool, list[str]]:
    """
    Validate style file content for injection patterns.

    Args:
        content: Raw style file content

    Returns:
        Tuple of (is_valid, list_of_warnings)
    """
    warnings = []

    for pattern in INJECTION_PATTERNS:
        matches = pattern.findall(content)
        if matches:
            warnings.append(f"Suspicious pattern found: {matches[0][:50]}...")

    return (len(warnings) == 0, warnings)


def escape_for_bash(value: str) -> str:
    """
    Safely escape a value for use in bash commands.

    Args:
        value: String to escape

    Returns:
        Properly quoted string for bash
    """
    return shlex.quote(value)
```

### Validation Rules

| Input Type | Validation Rules |
|------------|------------------|
| **Prompts** | - Non-empty after stripping whitespace<br>- Shell-escape dangerous characters<br>- Max length: 10,000 chars |
| **Paths** | - Must resolve to valid path<br>- No path traversal (`../`)<br>- Allowed extensions only<br>- Existence check when required |
| **Style Content** | - No shell command patterns<br>- No code block injections<br>- Warn on suspicious patterns |
| **Aspect Ratio** | - Must be from allowed list<br>- Format: `N:M` where N,M are integers |

### Agent Validation Integration

Commands MUST validate all user input before passing to agents:

```xml
<phase number="1" name="Input Validation">
  <objective>Validate and sanitize all user inputs</objective>
  <steps>
    <step>Extract prompts from $ARGUMENTS</step>
    <step>Validate each prompt with sanitize_prompt()</step>
    <step>Validate paths with validate_path()</step>
    <step>If --style specified, validate style content</step>
  </steps>
  <quality_gate>
    All inputs pass validation without security warnings
  </quality_gate>
</phase>
```

---

## CLI Pattern

The plugin uses a simple, elegant CLI pattern based on a single Python script.

### Basic Usage

```bash
# Generate from prompt
uv run python main.py output.png "A minimal 3D cube on solid black background"

# Use a style template (reads prompt enhancement from .md file)
uv run python main.py output.png "A gear icon" --style styles/blue_glass_3d.md

# Generate multiple variations with style
uv run python main.py output.png "cube" "sphere" "pyramid" --style styles/blue_glass_3d.md

# Edit existing image
uv run python main.py output.png "Change the background to blue" --edit input.png

# Use reference images for style consistency
uv run python main.py output.png "Same style but with a sphere" --ref style.png

# Specify aspect ratio
uv run python main.py output.png "Prompt" --aspect 16:9
```

### Command Syntax

```
uv run python main.py <output> <prompt>... [options]

Arguments:
  output                Output image path (e.g., output.png)
  prompt                One or more generation prompts (quoted strings)

Options:
  --style PATH          Apply style from .md file
  --edit PATH           Edit existing image instead of generating
  --ref PATH            Use reference image(s) for style consistency
  --aspect RATIO        Aspect ratio (1:1, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9)
  --model MODEL         Model ID (default: gemini-3-pro-image-preview)
  --max-retries N       Maximum retry attempts (default: 3)
  --timeout SECONDS     Request timeout in seconds (default: 60)
```

### Supported Aspect Ratios

| Ratio | Use Case |
|-------|----------|
| 1:1 | Social media, app icons |
| 3:4 | Portrait photos |
| 4:3 | Traditional photos |
| 4:5 | Instagram portrait |
| 5:4 | Landscape photos |
| 9:16 | Mobile wallpapers, stories |
| 16:9 | YouTube thumbnails, desktop |
| 21:9 | Ultrawide, cinematic |

---

## Style System Specification

### Simplified Style Format (v2.0)

Styles are now **single markdown files** stored in `styles/` directory.

```
{project_root}/
  styles/
    blue_glass_3d.md      # Style template
    watercolor.md         # Style template
    cyberpunk_neon.md     # Style template
```

### Style File Format

`styles/blue_glass_3d.md`:

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

### Style Application

When a style is applied, the **entire markdown content** is prepended to the user's prompt after validation:

```python
def apply_style(prompt: str, style_path: str) -> str:
    style_content = Path(style_path).read_text()

    # Validate style content for injection patterns
    is_valid, warnings = validate_style_content(style_content)
    if not is_valid:
        print(f"WARNING: Style file contains suspicious patterns:")
        for warning in warnings:
            print(f"  - {warning}")
        # Continue but log the warning

    return f"{style_content}\n\nGenerate: {prompt}"
```

### Reference Images vs Styles

| Concept | Purpose | Usage |
|---------|---------|-------|
| **Style** (`--style`) | Text-based artistic direction | `--style styles/watercolor.md` |
| **Reference** (`--ref`) | Visual example for consistency | `--ref previous_output.png` |

Both can be combined:
```bash
uv run python main.py out.png "A sphere" --style styles/glass.md --ref ref_cube.png
```

---

## Plugin Manifest

**File:** `plugins/nanobanana/plugin.json`

```json
{
  "name": "nanobanana",
  "version": "2.1.0",
  "description": "AI image generation and editing using Google Gemini 3 Pro Image API. Simple CLI pattern with markdown styles, batch generation, and reference image support.",
  "author": {
    "name": "Jack Rudenko",
    "email": "i@madappgang.com",
    "company": "MadAppGang"
  },
  "license": "MIT",
  "keywords": [
    "image-generation",
    "ai-art",
    "gemini",
    "text-to-image",
    "image-editing",
    "style-transfer"
  ],
  "category": "media",
  "agents": [
    "./agents/style-manager.md",
    "./agents/image-generator.md"
  ],
  "commands": [
    "./commands/nb-generate.md",
    "./commands/nb-edit.md",
    "./commands/nb-style.md"
  ],
  "skills": [
    "./skills/gemini-api",
    "./skills/style-format"
  ]
}
```

---

## Plugin Structure

```
plugins/nanobanana/
  plugin.json             # Plugin manifest
  pyproject.toml          # Python dependencies (uv)
  main.py                 # Core Python script
  README.md               # User documentation
  agents/
    style-manager.md      # Create/edit style .md files
    image-generator.md    # Orchestrates main.py calls
  commands/
    nb-generate.md        # Generate images
    nb-edit.md            # Edit images
    nb-style.md           # Manage styles
  skills/
    gemini-api/
      SKILL.md            # API reference
    style-format/
      SKILL.md            # Style format reference
```

---

## Core Python Script

**File:** `plugins/nanobanana/main.py`

```python
#!/usr/bin/env python3
"""
Nano Banana - AI Image Generation via Gemini API

Usage:
    uv run python main.py output.png "prompt"
    uv run python main.py output.png "prompt1" "prompt2" --style styles/glass.md
    uv run python main.py output.png "edit instruction" --edit input.png
    uv run python main.py output.png "prompt" --ref reference.png --aspect 16:9
"""
import os
import sys
import re
import time
import base64
import json
import shlex
import argparse
from pathlib import Path
from datetime import datetime
from typing import TypedDict

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("ERROR: google-genai not installed.")
    print("Run: uv add google-genai")
    sys.exit(1)


# ============================================================================
# ERROR CODES AND STRUCTURED RESPONSES
# ============================================================================

class ErrorCode:
    """Structured error codes for consistent error handling."""
    SUCCESS = "SUCCESS"
    API_KEY_MISSING = "API_KEY_MISSING"
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    INVALID_INPUT = "INVALID_INPUT"
    RATE_LIMITED = "RATE_LIMITED"
    NETWORK_ERROR = "NETWORK_ERROR"
    API_ERROR = "API_ERROR"
    CONTENT_POLICY = "CONTENT_POLICY"
    TIMEOUT = "TIMEOUT"
    PARTIAL_FAILURE = "PARTIAL_FAILURE"


class ResultDict(TypedDict, total=False):
    """Type definition for result dictionary."""
    success: bool
    error_code: str
    error: str
    results: list
    total: int
    succeeded: int
    failed: int
    retries_used: int


# ============================================================================
# INPUT VALIDATION
# ============================================================================

SHELL_DANGEROUS_CHARS = re.compile(r'[;&|`$(){}[\]<>\\!]')

INJECTION_PATTERNS = [
    re.compile(r'```\s*bash', re.IGNORECASE),
    re.compile(r'```\s*shell', re.IGNORECASE),
    re.compile(r'\$\{.*\}'),
    re.compile(r'\$\(.*\)'),
    re.compile(r'[;&|`]'),
    re.compile(r'<script', re.IGNORECASE),
    re.compile(r'javascript:', re.IGNORECASE),
]


def sanitize_prompt(prompt: str) -> str:
    """Sanitize user prompt for safe use."""
    if not prompt or not prompt.strip():
        raise ValueError("Prompt cannot be empty")

    if SHELL_DANGEROUS_CHARS.search(prompt):
        return shlex.quote(prompt)

    return prompt


def validate_style_content(content: str) -> tuple[bool, list[str]]:
    """Validate style file content for injection patterns."""
    warnings = []

    for pattern in INJECTION_PATTERNS:
        matches = pattern.findall(content)
        if matches:
            warnings.append(f"Suspicious pattern: {matches[0][:50]}...")

    return (len(warnings) == 0, warnings)


# ============================================================================
# RETRY LOGIC WITH EXPONENTIAL BACKOFF
# ============================================================================

ASPECT_RATIOS = ["1:1", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]
DEFAULT_MODEL = "gemini-3-pro-image-preview"
DEFAULT_MAX_RETRIES = 3
DEFAULT_TIMEOUT = 60

# Errors that are worth retrying
RETRYABLE_ERRORS = [
    "rate limit",
    "429",
    "503",
    "502",
    "connection",
    "timeout",
    "temporarily unavailable",
]


def is_retryable_error(error_str: str) -> bool:
    """Check if an error is worth retrying."""
    error_lower = error_str.lower()
    return any(pattern in error_lower for pattern in RETRYABLE_ERRORS)


def calculate_backoff(attempt: int, base_delay: float = 1.0, max_delay: float = 60.0) -> float:
    """
    Calculate exponential backoff delay.

    Args:
        attempt: Current attempt number (0-indexed)
        base_delay: Base delay in seconds
        max_delay: Maximum delay in seconds

    Returns:
        Delay in seconds
    """
    delay = base_delay * (2 ** attempt)
    return min(delay, max_delay)


def retry_with_backoff(func, max_retries: int = DEFAULT_MAX_RETRIES):
    """
    Decorator for retrying functions with exponential backoff.

    Args:
        func: Function to wrap
        max_retries: Maximum number of retry attempts

    Returns:
        Wrapped function that retries on failure
    """
    def wrapper(*args, **kwargs):
        last_error = None
        retries_used = 0

        for attempt in range(max_retries + 1):
            try:
                result = func(*args, **kwargs)
                result['retries_used'] = retries_used
                return result
            except Exception as e:
                last_error = str(e)

                if not is_retryable_error(last_error):
                    # Non-retryable error, fail immediately
                    return {
                        'success': False,
                        'error_code': ErrorCode.API_ERROR,
                        'error': last_error,
                        'retries_used': retries_used
                    }

                if attempt < max_retries:
                    delay = calculate_backoff(attempt)
                    print(f"Retry {attempt + 1}/{max_retries} after {delay:.1f}s: {last_error}")
                    time.sleep(delay)
                    retries_used += 1

        # All retries exhausted
        return {
            'success': False,
            'error_code': ErrorCode.RATE_LIMITED if 'rate' in last_error.lower() else ErrorCode.NETWORK_ERROR,
            'error': f"Failed after {max_retries} retries: {last_error}",
            'retries_used': retries_used
        }

    return wrapper


# ============================================================================
# CORE FUNCTIONS
# ============================================================================

def load_style(style_path: str) -> str:
    """Load style template from markdown file with validation."""
    path = Path(style_path)
    if not path.exists():
        print(f"ERROR: Style file not found: {style_path}")
        sys.exit(1)

    content = path.read_text()

    # Validate for injection patterns
    is_valid, warnings = validate_style_content(content)
    if not is_valid:
        print(f"WARNING: Style file contains suspicious patterns:")
        for warning in warnings:
            print(f"  - {warning}")

    return content


def load_image(image_path: str) -> types.Part:
    """Load image file as Gemini Part."""
    path = Path(image_path)
    if not path.exists():
        print(f"ERROR: Image not found: {image_path}")
        sys.exit(1)

    suffix = path.suffix.lower()
    mime_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif"
    }
    mime_type = mime_map.get(suffix, "image/png")

    return types.Part.from_bytes(
        data=path.read_bytes(),
        mime_type=mime_type
    )


def generate_single_image(
    client,
    prompt: str,
    output_path: Path,
    style_text: str,
    edit_part,
    ref_parts: list,
    aspect_ratio: str,
    model: str
) -> dict:
    """Generate a single image (used internally)."""
    # Build final prompt
    if style_text:
        final_prompt = f"{style_text}\n\nGenerate: {prompt}"
    else:
        final_prompt = prompt

    # Build contents
    contents = [final_prompt]

    if edit_part:
        contents.append(edit_part)

    contents.extend(ref_parts)

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(
            response_modalities=['IMAGE'],
            image_config=types.ImageConfig(
                aspect_ratio=aspect_ratio
            )
        )
    )

    # Extract image from response
    for part in response.candidates[0].content.parts:
        if hasattr(part, 'inline_data') and part.inline_data:
            img_data = base64.b64decode(part.inline_data.data)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(img_data)
            return {
                "prompt": prompt,
                "output": str(output_path),
                "success": True,
                "error_code": ErrorCode.SUCCESS
            }

    return {
        "prompt": prompt,
        "error": "No image in response",
        "success": False,
        "error_code": ErrorCode.API_ERROR
    }


def generate_image(
    prompts: list[str],
    output_path: str,
    style_path: str | None = None,
    edit_path: str | None = None,
    ref_paths: list[str] | None = None,
    aspect_ratio: str = "1:1",
    model: str = DEFAULT_MODEL,
    max_retries: int = DEFAULT_MAX_RETRIES
) -> ResultDict:
    """
    Generate or edit image(s) with retry logic.

    Args:
        prompts: List of prompts (batch generation if multiple)
        output_path: Output file path (will add suffix for batch)
        style_path: Path to style .md file
        edit_path: Path to image to edit (mutually exclusive with generation)
        ref_paths: Paths to reference images
        aspect_ratio: Aspect ratio
        model: Gemini model ID
        max_retries: Maximum retry attempts per image

    Returns:
        ResultDict with success/error, results, and statistics
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "success": False,
            "error_code": ErrorCode.API_KEY_MISSING,
            "error": "GEMINI_API_KEY not set",
            "results": [],
            "total": len(prompts),
            "succeeded": 0,
            "failed": len(prompts)
        }

    client = genai.Client(api_key=api_key)

    # Load style if provided
    style_text = ""
    if style_path:
        style_text = load_style(style_path)

    # Load reference images if provided
    ref_parts = []
    if ref_paths:
        for ref_path in ref_paths:
            ref_parts.append(load_image(ref_path))

    # Load edit source if editing
    edit_part = None
    if edit_path:
        edit_part = load_image(edit_path)

    results = []
    output_base = Path(output_path)
    total_retries = 0

    for i, prompt in enumerate(prompts):
        # Sanitize prompt
        try:
            safe_prompt = sanitize_prompt(prompt)
        except ValueError as e:
            results.append({
                "prompt": prompt,
                "error": str(e),
                "success": False,
                "error_code": ErrorCode.INVALID_INPUT
            })
            continue

        # Generate output filename
        if len(prompts) > 1:
            out_path = output_base.parent / f"{output_base.stem}_{i+1:03d}{output_base.suffix}"
        else:
            out_path = output_base

        # Retry wrapper for single image generation
        @retry_with_backoff
        def generate_with_retry():
            return generate_single_image(
                client, safe_prompt, out_path, style_text,
                edit_part, ref_parts, aspect_ratio, model
            )

        result = generate_with_retry()
        total_retries += result.get('retries_used', 0)

        if result['success']:
            print(f"Generated: {out_path}")
        else:
            print(f"ERROR: {result.get('error', 'Unknown error')}")

        results.append(result)

    succeeded = sum(1 for r in results if r["success"])
    failed = len(results) - succeeded

    return {
        "success": failed == 0,
        "error_code": ErrorCode.SUCCESS if failed == 0 else ErrorCode.PARTIAL_FAILURE,
        "results": results,
        "total": len(prompts),
        "succeeded": succeeded,
        "failed": failed,
        "retries_used": total_retries
    }


def main():
    parser = argparse.ArgumentParser(
        description="Nano Banana - AI Image Generation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Simple generation
  uv run python main.py out.png "A minimal 3D cube"

  # With style template
  uv run python main.py out.png "gear icon" --style styles/glass.md

  # Batch generation
  uv run python main.py out.png "cube" "sphere" "pyramid"

  # Edit existing image
  uv run python main.py out.png "Make sky blue" --edit photo.jpg

  # With reference image
  uv run python main.py out.png "Same style, sphere" --ref cube.png

Exit Codes:
  0 - All images generated successfully
  1 - Some or all images failed
  2 - Invalid arguments or configuration
        """
    )

    parser.add_argument("output", help="Output image path")
    parser.add_argument("prompts", nargs="+", help="Generation prompt(s)")
    parser.add_argument("--style", help="Style template (.md file)")
    parser.add_argument("--edit", help="Edit existing image")
    parser.add_argument("--ref", action="append", help="Reference image(s)")
    parser.add_argument("--aspect", default="1:1", choices=ASPECT_RATIOS,
                        help="Aspect ratio (default: 1:1)")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Model ID (default: {DEFAULT_MODEL})")
    parser.add_argument("--max-retries", type=int, default=DEFAULT_MAX_RETRIES,
                        help=f"Max retry attempts (default: {DEFAULT_MAX_RETRIES})")

    args = parser.parse_args()

    result = generate_image(
        prompts=args.prompts,
        output_path=args.output,
        style_path=args.style,
        edit_path=args.edit,
        ref_paths=args.ref,
        aspect_ratio=args.aspect,
        model=args.model,
        max_retries=args.max_retries
    )

    if result.get("error_code") == ErrorCode.API_KEY_MISSING:
        print(f"ERROR: {result['error']}")
        sys.exit(2)

    # Print summary
    print(f"\nCompleted: {result['succeeded']}/{result['total']} images")
    if result['retries_used'] > 0:
        print(f"Retries used: {result['retries_used']}")

    if result['failed'] > 0:
        print(f"\nFailed images:")
        for r in result['results']:
            if not r['success']:
                print(f"  - {r.get('prompt', 'Unknown')}: {r.get('error', 'Unknown error')}")

    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
```

---

## pyproject.toml

**File:** `plugins/nanobanana/pyproject.toml`

```toml
[project]
name = "nanobanana"
version = "2.1.0"
description = "AI image generation via Gemini API"
requires-python = ">=3.10"
dependencies = [
    "google-genai>=0.4.0",
]

[tool.uv]
dev-dependencies = []
```

---

## Agents Design

### Agent: style-manager

**File:** `plugins/nanobanana/agents/style-manager.md`

**Type:** Implementer
**Color:** green
**Model:** sonnet

#### Frontmatter

```yaml
---
name: style-manager
description: |
  Use this agent when managing image generation styles. Examples:
  (1) "Create a watercolor style" - creates styles/watercolor.md
  (2) "Update the cyberpunk style" - modifies existing .md file
  (3) "List available styles" - shows all .md files in styles/
  (4) "Show the glass style" - displays style file contents
  (5) "Delete the minimalist style" - removes style .md file (with confirmation)
model: sonnet
color: green
tools: TodoWrite, Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
skills: nanobanana:style-format
---
```

#### Full Agent Definition

```xml
<role>
  <identity>Style Template Specialist</identity>

  <expertise>
    - Markdown style file creation
    - Artistic direction description
    - Color palette definition
    - Style listing and management
    - Safe destructive operations
  </expertise>

  <mission>
    Manage the lifecycle of style template files (.md) including
    creation, editing, deletion, and listing. Ensure all styles
    follow the simplified markdown format. Enforce safety for
    destructive operations.
  </mission>
</role>

<instructions>
  <critical_constraints>
    <todowrite_requirement>
      You MUST use TodoWrite to track style operations:

      **Before starting**, create todo list:
      1. Validate operation request
      2. Check existing styles
      3. Perform style operation
      4. Validate result
      5. Report completion

      **Update continuously** as tasks progress.
    </todowrite_requirement>

    <style_directory>
      Styles are stored as individual .md files in `styles/` directory.
      ALWAYS use absolute paths based on the working directory.
      NEVER hardcode paths.
    </style_directory>

    <simplified_format>
      Style files are simple markdown with:
      - Title (# Style Name)
      - Description paragraphs
      - Optional sections (## Color Palette, ## Technical Notes)
      NO frontmatter required. Keep it simple.
    </simplified_format>

    <destructive_operation_safety>
      For DELETE and OVERWRITE operations:
      1. ALWAYS show current file contents first
      2. ALWAYS use AskUserQuestion for confirmation
      3. NEVER proceed without explicit user approval
    </destructive_operation_safety>
  </critical_constraints>

  <core_principles>
    <principle name="Simplicity" priority="critical">
      Styles are just markdown files. No complex structure.
      The entire file content is used as prompt enhancement.
    </principle>

    <principle name="Descriptive Writing" priority="high">
      Style descriptions should be vivid and specific.
      Include visual characteristics, colors, mood, lighting.
    </principle>

    <principle name="Safety" priority="critical">
      NEVER delete without user confirmation.
      ALWAYS show file contents before overwriting.
      Use AskUserQuestion for all destructive operations.
    </principle>
  </core_principles>

  <workflow>
    <phase number="1" name="Request Parsing">
      <step>Initialize TodoWrite</step>
      <step>Determine operation (create/update/delete/list/show)</step>
      <step>Extract style name</step>
    </phase>

    <phase number="2" name="Pre-Operation Checks">
      <step>Check if styles/ directory exists</step>
      <step>For create: verify style doesn't exist</step>
      <step>For update/delete/show: verify style exists</step>
    </phase>

    <phase number="3" name="Safety Checks (Destructive Operations)">
      <step>For DELETE: Read and display current file contents</step>
      <step>For UPDATE (overwrite): Read and display current file contents</step>
      <step>Use AskUserQuestion to confirm destructive action</step>
      <step>If not confirmed: abort and report cancellation</step>
    </phase>

    <phase number="4" name="Execute Operation">
      <step>CREATE: Write new .md file with template</step>
      <step>UPDATE: Read existing, apply changes</step>
      <step>DELETE: Remove file (after confirmation)</step>
      <step>LIST: Glob for styles/*.md, show names</step>
      <step>SHOW: Read and display file contents</step>
    </phase>

    <phase number="5" name="Report">
      <step>Summarize what was done</step>
      <step>Show file path</step>
      <step>Suggest next steps</step>
    </phase>
  </workflow>
</instructions>

<implementation_standards>
  <quality_checks mandatory="true">
    <check name="path_validation" order="1">
      <description>Validate all paths before file operations</description>
      <requirement>Path must be within styles/ directory</requirement>
      <on_failure>Report error, do not proceed</on_failure>
    </check>

    <check name="content_validation" order="2">
      <description>Validate style content for injection patterns</description>
      <requirement>No shell commands or suspicious patterns</requirement>
      <on_failure>Warn user but allow creation with explicit consent</on_failure>
    </check>

    <check name="destructive_confirmation" order="3">
      <description>Confirm destructive operations with user</description>
      <requirement>User must explicitly approve delete/overwrite</requirement>
      <on_failure>Abort operation, preserve existing file</on_failure>
    </check>
  </quality_checks>
</implementation_standards>

<knowledge>
  <style_template>
```markdown
# {Style Name}

{Vivid description of the visual style. Include:
- Overall aesthetic and mood
- Key visual characteristics
- Lighting and atmosphere
- Material properties if applicable}

## Color Palette
- Primary: {color} ({hex})
- Secondary: {color} ({hex})
- Background: {color} ({hex})
- Accents: {colors}

## Technical Notes
{Any specific technical requirements:
- Rendering style
- Camera angle preferences
- Post-processing effects}
```
  </style_template>

  <operations>
    **CREATE**: Write styles/{name}.md with template
    **UPDATE**: Read existing, merge changes (confirm overwrite)
    **DELETE**: Confirm, rm styles/{name}.md
    **LIST**: glob styles/*.md, extract names
    **SHOW**: cat styles/{name}.md
  </operations>

  <confirmation_prompts>
    **DELETE**: "Are you sure you want to delete the '{name}' style? This cannot be undone."
    **OVERWRITE**: "The style '{name}' already exists. Do you want to overwrite it?"
  </confirmation_prompts>
</knowledge>

<examples>
  <example name="Create Style">
    <user_request>Create a watercolor painting style</user_request>
    <correct_approach>
      1. Parse: operation=create, name="watercolor"
      2. Check styles/watercolor.md doesn't exist
      3. Write styles/watercolor.md:
         ```markdown
         # Watercolor Style

         Soft, flowing watercolor painting aesthetic with:
         - Transparent color washes
         - Visible paper texture showing through
         - Soft edges and color bleeding
         - Organic, hand-painted feel

         ## Color Palette
         - Primary: Muted earth tones
         - Secondary: Soft blues and greens
         - Background: Cream paper (#f5f0e8)

         ## Technical Notes
         - Colors should blend naturally
         - Include subtle water blooms
         - Avoid hard edges
         ```
      4. Report: "Created watercolor style at styles/watercolor.md"
    </correct_approach>
  </example>

  <example name="Delete Style (with confirmation)">
    <user_request>Delete the minimalist style</user_request>
    <correct_approach>
      1. Parse: operation=delete, name="minimalist"
      2. Verify styles/minimalist.md exists
      3. Read and display current contents:
         "Current contents of styles/minimalist.md:
          # Minimalist Style
          Clean, simple designs with..."
      4. AskUserQuestion: "Are you sure you want to delete 'minimalist' style? This cannot be undone."
         Options: ["Yes, delete it", "No, keep it"]
      5. If "No": Report "Deletion cancelled. Style preserved."
      6. If "Yes": rm styles/minimalist.md
      7. Report: "Deleted minimalist style"
    </correct_approach>
  </example>

  <example name="List Styles">
    <user_request>What styles are available?</user_request>
    <correct_approach>
      1. Glob: styles/*.md
      2. Extract style names from filenames
      3. Present as list:
         Available styles:
         - blue_glass_3d
         - watercolor
         - cyberpunk_neon
    </correct_approach>
  </example>
</examples>

<formatting>
  <completion_template>
## Style Operation Complete

**Operation:** {create|update|delete|list|show}
**Style:** {style_name}
**Path:** styles/{style_name}.md

**Next Steps:**
- Generate: `uv run python main.py out.png "prompt" --style styles/{style_name}.md`
- View: Read the style file to see contents
- Edit: Update the style with more details
  </completion_template>
</formatting>
```

---

### Agent: image-generator

**File:** `plugins/nanobanana/agents/image-generator.md`

**Type:** Implementer
**Color:** green
**Model:** sonnet

#### Frontmatter

```yaml
---
name: image-generator
description: |
  Use this agent when generating or editing images. Examples:
  (1) "Generate a 3D cube" - runs main.py with prompt
  (2) "Create icons for cube, sphere, pyramid" - batch generation
  (3) "Edit this photo to add sunset" - image editing with --edit
  (4) "Generate using the glass style" - applies style template
  (5) "Make it look like this reference" - uses --ref flag
model: sonnet
color: green
tools: TodoWrite, Read, Write, Edit, Bash, Glob, Grep
skills: nanobanana:gemini-api, nanobanana:style-format
---
```

#### Full Agent Definition

```xml
<role>
  <identity>AI Image Generation Specialist</identity>

  <expertise>
    - Gemini Image API via main.py script
    - Prompt crafting and optimization
    - Batch generation orchestration
    - Style and reference image application
    - Aspect ratio selection
    - Error diagnosis and recovery
  </expertise>

  <mission>
    Generate high-quality images by orchestrating calls to main.py.
    Handle batch generation, style application, reference images,
    and image editing operations. Recover from errors when possible.
  </mission>
</role>

<instructions>
  <critical_constraints>
    <todowrite_requirement>
      You MUST use TodoWrite to track generation workflow:

      **Before starting**, create todo list:
      1. Parse generation request
      2. Validate inputs
      3. Check API key and dependencies
      4. Build main.py command
      5. Execute generation
      6. Handle errors (if any)
      7. Report results

      **Update continuously** as tasks progress.
    </todowrite_requirement>

    <api_key_requirement>
      GEMINI_API_KEY environment variable must be set.
      Check before running main.py.
      If missing, show setup instructions.
    </api_key_requirement>

    <script_execution>
      All image operations go through main.py:
      ```bash
      uv run python "${CLAUDE_PLUGIN_ROOT}/main.py" [options]
      ```
      Use absolute path to plugin's main.py.
    </script_execution>

    <input_sanitization>
      All user prompts MUST be properly quoted when passed to bash.
      Use single quotes for prompts containing special characters.
      Validate all file paths before use.
    </input_sanitization>
  </critical_constraints>

  <core_principles>
    <principle name="Simple CLI" priority="critical">
      Use the simple CLI pattern. Don't overcomplicate.
      Single command for generation, editing, and batch operations.
    </principle>

    <principle name="Prompt Quality" priority="high">
      Help users craft effective prompts.
      Add detail and specificity when needed.
    </principle>

    <principle name="Error Recovery" priority="critical">
      If generation fails, diagnose and attempt recovery.
      Use Write/Edit tools to fix configuration issues.
      Report clear error messages with actionable fixes.
    </principle>

    <principle name="Input Validation" priority="critical">
      Validate and sanitize all inputs before execution.
      Quote all arguments properly for bash.
    </principle>
  </core_principles>

  <workflow>
    <phase number="1" name="Request Analysis">
      <step>Initialize TodoWrite</step>
      <step>Identify operation type:
        - Generate: new image from text
        - Edit: modify existing image (--edit)
        - Batch: multiple prompts
      </step>
      <step>Extract prompts, style, references</step>
      <step>Determine output path</step>
    </phase>

    <phase number="2" name="Input Validation">
      <step>Validate prompts are non-empty</step>
      <step>Escape special characters in prompts</step>
      <step>Validate all file paths exist (style, edit, ref)</step>
      <step>Validate aspect ratio is in allowed list</step>
    </phase>

    <phase number="3" name="Pre-Flight Checks">
      <step>Verify GEMINI_API_KEY is set:
        ```bash
        [ -n "$GEMINI_API_KEY" ] && echo "OK" || echo "MISSING"
        ```
      </step>
      <step>Verify uv is installed:
        ```bash
        which uv || echo "uv not found"
        ```
      </step>
      <step>If style specified, verify .md file exists and validate content</step>
      <step>If edit specified, verify source image exists</step>
      <step>If ref specified, verify reference images exist</step>
    </phase>

    <phase number="4" name="Command Construction">
      <step>Build base command with properly quoted arguments:
        ```bash
        uv run python "${CLAUDE_PLUGIN_ROOT}/main.py" output.png 'prompt'
        ```
      </step>
      <step>Add options as needed:
        - --style path/to/style.md
        - --edit path/to/source.png
        - --ref path/to/reference.png (can repeat)
        - --aspect 16:9
        - --max-retries 3
      </step>
      <step>For batch, add multiple quoted prompts</step>
    </phase>

    <phase number="5" name="Execute">
      <step>Run the command</step>
      <step>Capture output and exit code</step>
      <step>Parse results JSON if available</step>
    </phase>

    <phase number="6" name="Error Handling">
      <step>If exit code != 0, analyze error output</step>
      <step>For recoverable errors (missing dirs), use Write to fix</step>
      <step>For API errors, report with suggestions</step>
      <step>For partial failures, report which succeeded/failed</step>
    </phase>

    <phase number="7" name="Report">
      <step>Show generated file path(s)</step>
      <step>Report any errors with clear explanations</step>
      <step>Suggest follow-up actions</step>
    </phase>
  </workflow>
</instructions>

<implementation_standards>
  <quality_checks mandatory="true">
    <check name="input_validation" order="1">
      <description>Validate all user inputs</description>
      <requirement>Prompts non-empty, paths valid, aspect ratio allowed</requirement>
      <on_failure>Report specific validation error</on_failure>
    </check>

    <check name="api_key_check" order="2">
      <tool>Bash</tool>
      <command>[ -n "$GEMINI_API_KEY" ] && echo "OK" || echo "MISSING"</command>
      <requirement>Must output "OK"</requirement>
      <on_failure>Show API key setup instructions</on_failure>
    </check>

    <check name="dependency_check" order="3">
      <tool>Bash</tool>
      <command>which uv</command>
      <requirement>uv must be installed</requirement>
      <on_failure>Show uv installation instructions</on_failure>
    </check>

    <check name="file_existence" order="4">
      <description>Check all referenced files exist</description>
      <requirement>Style, edit source, references must exist</requirement>
      <on_failure>Report which files are missing</on_failure>
    </check>
  </quality_checks>

  <error_recovery_procedures>
    <procedure name="missing_directory">
      <trigger>Output directory does not exist</trigger>
      <action>Use Bash to create: mkdir -p {directory}</action>
    </procedure>

    <procedure name="rate_limit">
      <trigger>Error contains "rate limit" or "429"</trigger>
      <action>Wait and retry with --max-retries flag</action>
    </procedure>

    <procedure name="content_policy">
      <trigger>Error contains "content policy"</trigger>
      <action>Suggest rephrasing prompt, offer alternatives</action>
    </procedure>

    <procedure name="partial_batch_failure">
      <trigger>Some batch items failed</trigger>
      <action>Report which succeeded, offer to retry failed items</action>
    </procedure>
  </error_recovery_procedures>
</implementation_standards>

<knowledge>
  <command_patterns>
    **Simple generation:**
    ```bash
    uv run python main.py output.png 'A serene mountain lake'
    ```

    **With style:**
    ```bash
    uv run python main.py output.png 'gear icon' --style styles/glass.md
    ```

    **Batch generation:**
    ```bash
    uv run python main.py output.png 'cube' 'sphere' 'pyramid' --style styles/glass.md
    # Creates: output_001.png, output_002.png, output_003.png
    ```

    **Edit existing:**
    ```bash
    uv run python main.py edited.png 'Add dramatic clouds' --edit photo.jpg
    ```

    **With reference:**
    ```bash
    uv run python main.py output.png 'Same style, new subject' --ref reference.png
    ```

    **Combined:**
    ```bash
    uv run python main.py out.png 'icon' --style styles/glass.md --ref prev.png --aspect 1:1
    ```
  </command_patterns>

  <aspect_ratios>
    | Ratio | Best For |
    |-------|----------|
    | 1:1 | Social media, icons |
    | 16:9 | YouTube thumbnails |
    | 9:16 | Mobile, stories |
    | 4:3 | Traditional photos |
    | 21:9 | Cinematic, ultrawide |
  </aspect_ratios>

  <error_codes>
    | Code | Meaning | Recovery |
    |------|---------|----------|
    | API_KEY_MISSING | GEMINI_API_KEY not set | Show setup instructions |
    | FILE_NOT_FOUND | Referenced file missing | Check path, suggest fixes |
    | RATE_LIMITED | Too many requests | Wait, retry with backoff |
    | CONTENT_POLICY | Blocked by safety | Rephrase prompt |
    | PARTIAL_FAILURE | Some batch items failed | Report details, offer retry |
  </error_codes>
</knowledge>

<examples>
  <example name="Simple Generation">
    <user_request>Generate a minimal 3D cube on black background</user_request>
    <correct_approach>
      1. Parse: prompt="minimal 3D cube on black background"
      2. Validate: prompt non-empty, no special chars needing escape
      3. Check: API key present
      4. Build command:
         ```bash
         uv run python "${CLAUDE_PLUGIN_ROOT}/main.py" \
           generated/cube.png \
           'A minimal 3D cube on solid black background'
         ```
      5. Execute
      6. Report: "Generated: generated/cube.png"
    </correct_approach>
  </example>

  <example name="Batch with Style">
    <user_request>Create icons for cube, sphere, and pyramid using the glass style</user_request>
    <correct_approach>
      1. Parse: prompts=["cube", "sphere", "pyramid"], style="glass"
      2. Validate: all prompts non-empty
      3. Verify styles/glass.md exists
      4. Build command:
         ```bash
         uv run python "${CLAUDE_PLUGIN_ROOT}/main.py" \
           generated/icons.png \
           'cube' 'sphere' 'pyramid' \
           --style styles/glass.md
         ```
      5. Execute
      6. Report:
         - Generated: generated/icons_001.png (cube)
         - Generated: generated/icons_002.png (sphere)
         - Generated: generated/icons_003.png (pyramid)
    </correct_approach>
  </example>

  <example name="Error Recovery">
    <user_request>Generate an image (but output dir doesn't exist)</user_request>
    <correct_approach>
      1. Execute command, get error "No such directory"
      2. Identify recovery: missing output directory
      3. Use Bash to create: mkdir -p generated/
      4. Retry command
      5. Report success
    </correct_approach>
  </example>
</examples>

<formatting>
  <completion_template>
## Image Generation Complete

**Output:** `{output_path}`
**Prompt:** {prompt}

**Options Used:**
- Style: {style or "None"}
- Edit Source: {edit or "None"}
- Reference: {ref or "None"}
- Aspect Ratio: {aspect}

**Next Steps:**
- View: Open the generated image
- Edit: `uv run python main.py new.png "change X" --edit {output_path}`
- Batch: Add more prompts for variations
  </completion_template>
</formatting>
```

---

## Commands Design

### Command: /nb-generate

**File:** `plugins/nanobanana/commands/nb-generate.md`

**Type:** Orchestrator

```yaml
---
description: |
  Generate images from text prompts.
  Usage: /nb-generate "prompt" [--style name] [--aspect ratio]
  Examples:
    /nb-generate "A minimal 3D cube"
    /nb-generate "cube" "sphere" "pyramid" --style glass
    /nb-generate "landscape" --aspect 16:9
  Workflow: VALIDATE -> SANITIZE -> GENERATE -> PRESENT
allowed-tools: Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep
skills: nanobanana:gemini-api
---
```

```xml
<role>
  <identity>Image Generation Command</identity>
  <mission>
    Parse user arguments, validate and sanitize inputs,
    and delegate to image-generator agent.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<orchestration>
  <allowed_tools>Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep</allowed_tools>
  <forbidden_tools>Write, Edit</forbidden_tools>

  <delegation_rules>
    <rule scope="generation">ALL image generation -> image-generator agent</rule>
    <rule scope="style_lookup">Style path resolution -> local validation</rule>
    <rule scope="error_display">Error presentation -> direct output</rule>
  </delegation_rules>

  <phases>
    <phase number="1" name="Input Validation">
      <objective>Validate and sanitize all user inputs</objective>
      <steps>
        <step>Extract quoted prompts from $ARGUMENTS</step>
        <step>Validate each prompt is non-empty</step>
        <step>Escape special characters in prompts</step>
        <step>Parse --style flag (resolve to styles/{name}.md)</step>
        <step>Parse --aspect flag, validate against allowed list</step>
        <step>Determine output path (default: generated/{slug}.png)</step>
      </steps>
      <quality_gate>
        All prompts are valid and properly escaped.
        Style path exists (if specified).
        Aspect ratio is valid.
      </quality_gate>
    </phase>

    <phase number="2" name="Pre-Flight Validation">
      <objective>Verify environment is ready</objective>
      <steps>
        <step>Check GEMINI_API_KEY is set</step>
        <step>If --style, verify styles/{name}.md exists</step>
        <step>Validate style content for injection patterns</step>
      </steps>
      <quality_gate>
        API key present.
        All referenced files exist.
        No security warnings.
      </quality_gate>
    </phase>

    <phase number="3" name="Generate">
      <objective>Execute image generation</objective>
      <steps>
        <step>Task image-generator with sanitized arguments</step>
        <step>Wait for completion</step>
        <step>Capture results</step>
      </steps>
      <quality_gate>
        Generation task completes (success or failure).
      </quality_gate>
    </phase>

    <phase number="4" name="Present Results">
      <objective>Report outcome to user</objective>
      <steps>
        <step>Show generated file path(s)</step>
        <step>Report any errors with explanations</step>
        <step>Suggest follow-up actions</step>
      </steps>
      <quality_gate>
        User receives clear outcome report.
      </quality_gate>
    </phase>
  </phases>

  <error_recovery>
    <strategy name="missing_api_key">
      Show setup instructions for GEMINI_API_KEY.
      Link to Google AI Studio.
    </strategy>
    <strategy name="style_not_found">
      List available styles.
      Suggest creating new style with /nb-style create.
    </strategy>
    <strategy name="invalid_prompt">
      Report specific validation error.
      Suggest corrected prompt format.
    </strategy>
    <strategy name="partial_failure">
      Report which images succeeded.
      Offer to retry failed items.
    </strategy>
  </error_recovery>
</orchestration>

<argument_parsing>
  **Prompt Extraction:**
  - Single: "A mountain lake" -> ["A mountain lake"]
  - Multiple: "cube" "sphere" -> ["cube", "sphere"]
  - Escape special chars: "Hello & world" -> 'Hello & world'

  **Style Resolution:**
  - --style glass -> styles/glass.md
  - --style styles/glass.md -> styles/glass.md (pass through)

  **Output Path:**
  - If not specified, generate from first prompt slug
  - Batch adds _001, _002 suffixes
</argument_parsing>

<examples>
  <example name="Simple">
    <input>/nb-generate "A serene mountain lake at sunset"</input>
    <flow>
      1. Parse: prompts=["A serene mountain lake at sunset"]
      2. Validate: prompt non-empty, no special chars
      3. Output: generated/a_serene_mountain.png
      4. Task image-generator: run main.py
    </flow>
  </example>

  <example name="With Style">
    <input>/nb-generate "gear icon" --style glass</input>
    <flow>
      1. Parse: prompts=["gear icon"], style="glass"
      2. Resolve: styles/glass.md
      3. Validate: file exists, content is safe
      4. Task image-generator: run main.py --style styles/glass.md
    </flow>
  </example>

  <example name="Batch">
    <input>/nb-generate "cube" "sphere" "pyramid" --style glass --aspect 1:1</input>
    <flow>
      1. Parse: prompts=["cube", "sphere", "pyramid"]
      2. Validate: all prompts valid, style exists
      3. Output: generated/cube_001.png, etc.
      4. Task image-generator: batch generation
    </flow>
  </example>
</examples>
```

---

### Command: /nb-edit

**File:** `plugins/nanobanana/commands/nb-edit.md`

**Type:** Orchestrator

```yaml
---
description: |
  Edit existing images with natural language.
  Usage: /nb-edit <image> "instruction" [--ref image]
  Examples:
    /nb-edit photo.jpg "Make the sky more dramatic"
    /nb-edit logo.png "Change colors to blue and gold"
    /nb-edit scene.jpg "Add a rainbow" --ref rainbow_style.png
  Workflow: VALIDATE -> SANITIZE -> EDIT -> PRESENT
allowed-tools: Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep
skills: nanobanana:gemini-api
---
```

```xml
<role>
  <identity>Image Editing Command</identity>
  <mission>
    Parse edit arguments, validate inputs, and delegate to
    image-generator agent with --edit flag.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<orchestration>
  <allowed_tools>Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep</allowed_tools>
  <forbidden_tools>Write, Edit</forbidden_tools>

  <delegation_rules>
    <rule scope="editing">ALL image editing -> image-generator agent</rule>
    <rule scope="validation">Path validation -> local checks</rule>
  </delegation_rules>

  <phases>
    <phase number="1" name="Input Validation">
      <objective>Validate and sanitize edit request</objective>
      <steps>
        <step>Extract source image path</step>
        <step>Extract edit instruction (quoted text)</step>
        <step>Validate instruction is non-empty</step>
        <step>Escape special characters in instruction</step>
        <step>Parse --ref flag if present</step>
        <step>Generate output path: {source}_edited.png</step>
      </steps>
      <quality_gate>
        Source path extracted.
        Instruction is valid and sanitized.
        Output path determined.
      </quality_gate>
    </phase>

    <phase number="2" name="Pre-Flight Validation">
      <objective>Verify files and environment</objective>
      <steps>
        <step>Check source image exists</step>
        <step>Check GEMINI_API_KEY is set</step>
        <step>If --ref, verify reference exists</step>
      </steps>
      <quality_gate>
        All required files exist.
        API key present.
      </quality_gate>
    </phase>

    <phase number="3" name="Edit">
      <objective>Execute image edit</objective>
      <steps>
        <step>Task image-generator with edit command:
          uv run python main.py output.png "instruction" --edit source.jpg
        </step>
      </steps>
      <quality_gate>
        Edit operation completes.
      </quality_gate>
    </phase>

    <phase number="4" name="Present Results">
      <objective>Report edit outcome</objective>
      <steps>
        <step>Show before/after paths</step>
        <step>Report any errors</step>
        <step>Suggest further edits</step>
      </steps>
      <quality_gate>
        User sees clear outcome.
      </quality_gate>
    </phase>
  </phases>

  <error_recovery>
    <strategy name="source_not_found">
      Report: "Source image not found: {path}"
      Suggest: Check path, list available images
    </strategy>
    <strategy name="content_policy">
      Report: "Edit blocked by content policy"
      Suggest: Rephrase instruction
    </strategy>
  </error_recovery>
</orchestration>

<examples>
  <example name="Simple Edit">
    <input>/nb-edit photo.jpg "Add sunset colors to the sky"</input>
    <flow>
      1. Parse: source=photo.jpg, instruction="Add sunset colors to the sky"
      2. Validate: instruction non-empty, sanitize
      3. Verify photo.jpg exists
      4. Output: photo_edited.png
      5. Command: main.py photo_edited.png "Add sunset..." --edit photo.jpg
    </flow>
  </example>

  <example name="With Reference">
    <input>/nb-edit logo.png "Make it look like this style" --ref style.png</input>
    <flow>
      1. Parse: source=logo.png, instruction, ref=style.png
      2. Verify both files exist
      3. Command: main.py logo_edited.png "..." --edit logo.png --ref style.png
    </flow>
  </example>
</examples>
```

---

### Command: /nb-style

**File:** `plugins/nanobanana/commands/nb-style.md`

**Type:** Orchestrator

```yaml
---
description: |
  Manage image generation style templates.
  Usage: /nb-style <action> [name]
  Actions: create, list, show, delete, update
  Examples:
    /nb-style create watercolor
    /nb-style list
    /nb-style show glass
    /nb-style delete minimalist (with confirmation)
    /nb-style update glass
  Workflow: PARSE -> VALIDATE -> CONFIRM (if destructive) -> EXECUTE -> REPORT
allowed-tools: Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep
skills: nanobanana:style-format
---
```

```xml
<role>
  <identity>Style Management Command</identity>
  <mission>
    Parse style management requests, enforce safety for destructive
    operations, and delegate to style-manager agent.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<orchestration>
  <allowed_tools>Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep</allowed_tools>
  <forbidden_tools>Write, Edit</forbidden_tools>

  <delegation_rules>
    <rule scope="file_operations">ALL file operations -> style-manager agent</rule>
    <rule scope="confirmation">Destructive operations -> AskUserQuestion first</rule>
    <rule scope="listing">List operation -> style-manager agent</rule>
  </delegation_rules>

  <phases>
    <phase number="1" name="Parse Request">
      <objective>Extract action and parameters</objective>
      <steps>
        <step>Extract action from $ARGUMENTS (create/list/show/delete/update)</step>
        <step>Extract style name if applicable</step>
        <step>Validate action is recognized</step>
      </steps>
      <quality_gate>
        Valid action identified.
        Style name extracted (if required).
      </quality_gate>
    </phase>

    <phase number="2" name="Pre-Operation Validation">
      <objective>Validate operation can proceed</objective>
      <steps>
        <step>For delete/show/update: Verify style exists</step>
        <step>For create: Verify style doesn't exist (or will need overwrite)</step>
      </steps>
      <quality_gate>
        Operation prerequisites met.
      </quality_gate>
    </phase>

    <phase number="3" name="Destructive Operation Confirmation">
      <objective>Get user approval for destructive actions</objective>
      <conditions>
        <applies_to>delete, update (when overwriting)</applies_to>
        <skip_for>create (new), list, show</skip_for>
      </conditions>
      <steps>
        <step>Read current style file contents</step>
        <step>Display current contents to user</step>
        <step>Use AskUserQuestion for confirmation:
          - DELETE: "Are you sure you want to delete '{name}'? This cannot be undone."
          - UPDATE: "The style '{name}' exists. Do you want to overwrite it?"
        </step>
        <step>If user declines: Abort and report cancellation</step>
      </steps>
      <quality_gate>
        User explicitly approves destructive action.
        Or operation is non-destructive.
      </quality_gate>
    </phase>

    <phase number="4" name="Gather Input (Create/Update)">
      <objective>Collect style description from user</objective>
      <conditions>
        <applies_to>create, update</applies_to>
      </conditions>
      <steps>
        <step>AskUserQuestion: "Describe the visual style for '{name}'"</step>
        <step>Capture user's description</step>
      </steps>
      <quality_gate>
        Style description received.
      </quality_gate>
    </phase>

    <phase number="5" name="Execute Operation">
      <objective>Perform the style operation</objective>
      <steps>
        <step>Task style-manager with operation and details</step>
      </steps>
      <quality_gate>
        Operation completes successfully.
      </quality_gate>
    </phase>

    <phase number="6" name="Report Results">
      <objective>Present outcome to user</objective>
      <steps>
        <step>Show operation result</step>
        <step>For create: Show usage example</step>
        <step>Suggest next steps</step>
      </steps>
      <quality_gate>
        User understands outcome.
      </quality_gate>
    </phase>
  </phases>

  <error_recovery>
    <strategy name="style_not_found">
      For show/delete/update: Report style doesn't exist.
      Suggest: List available styles, create new one.
    </strategy>
    <strategy name="style_already_exists">
      For create: Offer to update instead.
      Use confirmation flow for overwrite.
    </strategy>
    <strategy name="user_cancelled">
      Report: "Operation cancelled. Style '{name}' preserved."
      No further action needed.
    </strategy>
  </error_recovery>
</orchestration>

<action_handlers>
  <handler action="create">
    1. Check if style exists
    2. If exists: Ask to overwrite (confirmation flow)
    3. Ask: "Describe the visual style for '{name}'"
    4. Task style-manager: Create styles/{name}.md with description
  </handler>

  <handler action="list">
    1. Task style-manager: List all styles/*.md
    2. Present formatted list
  </handler>

  <handler action="show">
    1. Verify style exists
    2. Task style-manager: Display styles/{name}.md contents
  </handler>

  <handler action="delete">
    1. Verify style exists
    2. Read and display current contents
    3. AskUserQuestion: "Are you sure you want to delete '{name}'? This cannot be undone."
       Options: ["Yes, delete it", "No, keep it"]
    4. If "No": Report cancellation
    5. If "Yes": Task style-manager: Delete
  </handler>

  <handler action="update">
    1. Verify style exists
    2. Read and display current contents
    3. AskUserQuestion: "Do you want to overwrite the existing style?"
       Options: ["Yes, overwrite", "No, cancel"]
    4. If "No": Report cancellation
    5. If "Yes": Ask for new description
    6. Task style-manager: Update with new content
  </handler>
</action_handlers>

<examples>
  <example name="Create">
    <input>/nb-style create glass</input>
    <flow>
      1. Parse: action=create, name=glass
      2. Check styles/glass.md doesn't exist
      3. Ask: "Describe the glass style"
      4. User: "3D glass material with blue tint, reflections, black background"
      5. Task style-manager: Create styles/glass.md
      6. Report: "Created. Use: --style glass"
    </flow>
  </example>

  <example name="Delete (with confirmation)">
    <input>/nb-style delete minimalist</input>
    <flow>
      1. Parse: action=delete, name=minimalist
      2. Verify styles/minimalist.md exists
      3. Read and display contents:
         "Current style 'minimalist':
          # Minimalist Style
          Clean, simple designs..."
      4. AskUserQuestion: "Are you sure you want to delete 'minimalist'?"
      5. User selects: "Yes, delete it"
      6. Task style-manager: Delete file
      7. Report: "Deleted style 'minimalist'"
    </flow>
  </example>

  <example name="Delete (cancelled)">
    <input>/nb-style delete watercolor</input>
    <flow>
      1. Parse: action=delete, name=watercolor
      2. Verify exists, display contents
      3. AskUserQuestion: confirmation
      4. User selects: "No, keep it"
      5. Report: "Deletion cancelled. Style 'watercolor' preserved."
    </flow>
  </example>

  <example name="List">
    <input>/nb-style list</input>
    <flow>
      1. Parse: action=list
      2. Task style-manager: List styles
      3. Show: glass, watercolor, cyberpunk
    </flow>
  </example>
</examples>
```

---

## Skills Design

### Skill: gemini-api

**Directory:** `plugins/nanobanana/skills/gemini-api/SKILL.md`

```yaml
---
name: gemini-api
description: Google Gemini 3 Pro Image API reference. Covers text-to-image, editing, reference images, aspect ratios, and error handling.
---
```

```markdown
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
```

---

### Skill: style-format

**Directory:** `plugins/nanobanana/skills/style-format/SKILL.md`

```yaml
---
name: style-format
description: Style template format specification. Single markdown files that describe artistic direction.
---
```

```markdown
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
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI API key for Gemini |

### Setup

```bash
# macOS/Linux
export GEMINI_API_KEY="your-api-key"

# Add to shell profile for persistence
echo 'export GEMINI_API_KEY="your-key"' >> ~/.zshrc
```

---

## Example Workflows

### Workflow 1: Create Style and Generate

```bash
# 1. Create style
/nb-style create glass
# Describe: "3D glass material with blue tint, reflections, black background"

# 2. View style
/nb-style show glass

# 3. Generate with style
/nb-generate "gear icon" --style glass

# 4. Generate batch
/nb-generate "cube" "sphere" "pyramid" --style glass
```

### Workflow 2: Edit Existing Image

```bash
# 1. Start with photo
/nb-edit landscape.jpg "Add dramatic sunset sky"

# 2. Further edits
/nb-edit landscape_edited.png "Add birds flying"

# 3. Apply style
/nb-edit landscape_edited.png "Make it look painted" --ref painting.jpg
```

### Workflow 3: Consistent Icon Set

```bash
# 1. Create first icon
/nb-generate "home icon" --style glass

# 2. Use as reference for consistency
/nb-generate "settings icon" --style glass --ref generated/home_icon.png
/nb-generate "user icon" --style glass --ref generated/home_icon.png
/nb-generate "search icon" --style glass --ref generated/home_icon.png
```

### Workflow 4: YouTube Thumbnails

```bash
# 1. Generate thumbnail at 16:9
/nb-generate "Tech review thumbnail with laptop" --aspect 16:9

# 2. Create variations
/nb-generate "laptop" "phone" "tablet" --aspect 16:9 --style tech_review
```

---

## Key Design Decisions

### 1. Single Python Script
- All image operations go through `main.py`
- Commands are thin wrappers that parse arguments
- Agents orchestrate but don't implement

### 2. Markdown Styles
- Simple `.md` files instead of folders
- No frontmatter required
- Entire file is used as prompt enhancement

### 3. Separate Reference Images
- `--ref` flag for visual references
- Not bundled in style files
- Can use any image as reference

### 4. uv for Python
- Modern dependency management
- Simple: `uv run python main.py`
- Clean: `pyproject.toml` defines deps

### 5. Batch Generation
- Multiple prompts in one command
- Automatic suffixing: `_001`, `_002`, etc.
- Same options apply to all

### 6. Input Validation (v2.1.0)
- All user inputs sanitized before bash execution
- Style content validated for injection patterns
- Proper quoting for shell arguments

### 7. Retry Logic (v2.1.0)
- Exponential backoff for transient errors
- Configurable max retries
- Automatic rate limit handling

### 8. Destructive Operation Safety (v2.1.0)
- Confirmation required for delete/overwrite
- File contents shown before destruction
- Clear cancellation path

---

## Tool Recommendations

### Agents

| Agent | Tools | Justification |
|-------|-------|---------------|
| style-manager | TodoWrite, Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion | Full file management + user confirmation |
| image-generator | TodoWrite, Read, Write, Edit, Bash, Glob, Grep | Script execution + error recovery (Write/Edit for fixing issues) |

### Commands

| Command | Tools | Justification |
|---------|-------|---------------|
| /nb-generate | Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep | Orchestration |
| /nb-edit | Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep | Orchestration |
| /nb-style | Task, AskUserQuestion, Bash, Read, TodoWrite, Glob, Grep | User interaction + delegation |

---

## Model Recommendations

| Component | Model | Justification |
|-----------|-------|---------------|
| style-manager | sonnet | File operations, user interaction |
| image-generator | sonnet | CLI orchestration, error handling |

---

## Implementation Notes

### Dependencies

```bash
# Install uv (if not present)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install plugin dependencies
cd plugins/nanobanana
uv sync
```

### Directory Creation

```bash
# Ensure styles and generated directories exist
mkdir -p styles generated
```

### Quick Test

```bash
# Test API key
echo $GEMINI_API_KEY

# Test generation
uv run python main.py test.png "A simple red circle"
```

---

## Migration from v1.0

If you have v1.0 style folders, convert them:

```bash
# Old structure (v1.0):
styles/
  cyberpunk/
    description.md
    reference-01.png

# New structure (v2.0):
styles/
  cyberpunk.md          # Content from description.md

# Reference images: Use --ref flag instead
```

---

**Document Version:** 2.1.0
**Created:** 2025-01-04
**Updated:** 2025-01-04
**Author:** Agent Design System

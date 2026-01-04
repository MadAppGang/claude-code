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

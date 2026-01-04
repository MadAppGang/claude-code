#!/usr/bin/env node
/**
 * Nano Banana - AI Image Generation via Gemini API
 *
 * Usage:
 *   node main.js output.png "prompt"
 *   node main.js output.png "prompt1" "prompt2" --style styles/glass.md
 *   node main.js output.png "edit instruction" --edit input.png
 *   node main.js output.png "prompt" --ref reference.png --aspect 16:9
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, basename, extname, join } from "path";
import { parseArgs } from "util";

// ============================================================================
// ERROR CODES AND CONSTANTS
// ============================================================================

const ErrorCode = {
  SUCCESS: "SUCCESS",
  API_KEY_MISSING: "API_KEY_MISSING",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  RATE_LIMITED: "RATE_LIMITED",
  NETWORK_ERROR: "NETWORK_ERROR",
  API_ERROR: "API_ERROR",
  CONTENT_POLICY: "CONTENT_POLICY",
  TIMEOUT: "TIMEOUT",
  PARTIAL_FAILURE: "PARTIAL_FAILURE",
};

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
const DEFAULT_MODEL = "gemini-2.0-flash-exp";
const DEFAULT_MAX_RETRIES = 3;

const RETRYABLE_ERRORS = [
  "rate limit",
  "429",
  "503",
  "502",
  "connection",
  "timeout",
  "temporarily unavailable",
];

// ============================================================================
// INPUT VALIDATION
// ============================================================================

const SHELL_DANGEROUS_CHARS = /[;&|`$(){}[\]<>\\!]/;

const INJECTION_PATTERNS = [
  /```\s*bash/i,
  /```\s*shell/i,
  /\$\{.*\}/,
  /\$\(.*\)/,
  /[;&|`]/,
  /<script/i,
  /javascript:/i,
];

function sanitizePrompt(prompt) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt cannot be empty");
  }

  if (SHELL_DANGEROUS_CHARS.test(prompt)) {
    // Escape dangerous characters
    return prompt.replace(/'/g, "'\\''");
  }

  return prompt;
}

function validateStyleContent(content) {
  const warnings = [];

  for (const pattern of INJECTION_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      warnings.push(`Suspicious pattern: ${match[0].slice(0, 50)}...`);
    }
  }

  return { isValid: warnings.length === 0, warnings };
}

// ============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================================================

function isRetryableError(errorStr) {
  const errorLower = errorStr.toLowerCase();
  return RETRYABLE_ERRORS.some((pattern) => errorLower.includes(pattern));
}

function calculateBackoff(attempt, baseDelay = 1.0, maxDelay = 60.0) {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn, maxRetries = DEFAULT_MAX_RETRIES) {
  let lastError = null;
  let retriesUsed = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      result.retriesUsed = retriesUsed;
      return result;
    } catch (e) {
      lastError = e.message || String(e);

      if (!isRetryableError(lastError)) {
        return {
          success: false,
          errorCode: ErrorCode.API_ERROR,
          error: lastError,
          retriesUsed,
        };
      }

      if (attempt < maxRetries) {
        const delay = calculateBackoff(attempt);
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay.toFixed(1)}s: ${lastError}`);
        await sleep(delay * 1000);
        retriesUsed++;
      }
    }
  }

  return {
    success: false,
    errorCode: lastError.toLowerCase().includes("rate") ? ErrorCode.RATE_LIMITED : ErrorCode.NETWORK_ERROR,
    error: `Failed after ${maxRetries} retries: ${lastError}`,
    retriesUsed,
  };
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

function loadStyle(stylePath) {
  if (!existsSync(stylePath)) {
    console.error(`ERROR: Style file not found: ${stylePath}`);
    process.exit(1);
  }

  const content = readFileSync(stylePath, "utf-8");

  const { isValid, warnings } = validateStyleContent(content);
  if (!isValid) {
    console.warn("WARNING: Style file contains suspicious patterns:");
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  return content;
}

function loadImage(imagePath) {
  if (!existsSync(imagePath)) {
    console.error(`ERROR: Image not found: ${imagePath}`);
    process.exit(1);
  }

  const ext = extname(imagePath).toLowerCase();
  const mimeMap = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  const mimeType = mimeMap[ext] || "image/png";

  const data = readFileSync(imagePath);
  return {
    inlineData: {
      data: data.toString("base64"),
      mimeType,
    },
  };
}

async function generateSingleImage(model, prompt, outputPath, styleText, editPart, refParts, aspectRatio) {
  // Build final prompt
  let finalPrompt = styleText ? `${styleText}\n\nGenerate: ${prompt}` : prompt;

  // Build contents array
  const contents = [finalPrompt];

  if (editPart) {
    contents.push(editPart);
  }

  contents.push(...refParts);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: contents.map((c) => (typeof c === "string" ? { text: c } : c)) }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  const response = result.response;

  // Extract image from response
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        const imgData = Buffer.from(part.inlineData.data, "base64");
        const dir = dirname(outputPath);
        if (dir && !existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        writeFileSync(outputPath, imgData);
        return {
          prompt,
          output: outputPath,
          success: true,
          errorCode: ErrorCode.SUCCESS,
        };
      }
    }
  }

  return {
    prompt,
    error: "No image in response",
    success: false,
    errorCode: ErrorCode.API_ERROR,
  };
}

async function generateImage({
  prompts,
  outputPath,
  stylePath = null,
  editPath = null,
  refPaths = [],
  aspectRatio = "1:1",
  modelId = DEFAULT_MODEL,
  maxRetries = DEFAULT_MAX_RETRIES,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      errorCode: ErrorCode.API_KEY_MISSING,
      error: "GEMINI_API_KEY not set",
      results: [],
      total: prompts.length,
      succeeded: 0,
      failed: prompts.length,
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelId });

  // Load style if provided
  const styleText = stylePath ? loadStyle(stylePath) : "";

  // Load reference images
  const refParts = refPaths.map((p) => loadImage(p));

  // Load edit source
  const editPart = editPath ? loadImage(editPath) : null;

  const results = [];
  let totalRetries = 0;

  const outputBase = basename(outputPath, extname(outputPath));
  const outputExt = extname(outputPath);
  const outputDir = dirname(outputPath);

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];

    // Sanitize prompt
    let safePrompt;
    try {
      safePrompt = sanitizePrompt(prompt);
    } catch (e) {
      results.push({
        prompt,
        error: e.message,
        success: false,
        errorCode: ErrorCode.INVALID_INPUT,
      });
      continue;
    }

    // Generate output filename
    const outPath =
      prompts.length > 1
        ? join(outputDir, `${outputBase}_${String(i + 1).padStart(3, "0")}${outputExt}`)
        : outputPath;

    const result = await retryWithBackoff(
      () => generateSingleImage(model, safePrompt, outPath, styleText, editPart, refParts, aspectRatio),
      maxRetries
    );

    totalRetries += result.retriesUsed || 0;

    if (result.success) {
      console.log(`Generated: ${outPath}`);
    } else {
      console.error(`ERROR: ${result.error || "Unknown error"}`);
    }

    results.push(result);
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.length - succeeded;

  return {
    success: failed === 0,
    errorCode: failed === 0 ? ErrorCode.SUCCESS : ErrorCode.PARTIAL_FAILURE,
    results,
    total: prompts.length,
    succeeded,
    failed,
    retriesUsed: totalRetries,
  };
}

// ============================================================================
// CLI
// ============================================================================

function printHelp() {
  console.log(`
Nano Banana - AI Image Generation

Usage:
  node main.js <output> <prompt...> [options]

Arguments:
  output              Output image path
  prompt              Generation prompt(s) - multiple for batch

Options:
  --style <path>      Style template (.md file)
  --edit <path>       Edit existing image
  --ref <path>        Reference image(s) - can be used multiple times
  --aspect <ratio>    Aspect ratio: ${ASPECT_RATIOS.join(", ")} (default: 1:1)
  --model <id>        Model ID (default: ${DEFAULT_MODEL})
  --max-retries <n>   Max retry attempts (default: ${DEFAULT_MAX_RETRIES})
  --help              Show this help

Examples:
  # Simple generation
  node main.js out.png "A minimal 3D cube"

  # With style template
  node main.js out.png "gear icon" --style styles/glass.md

  # Batch generation
  node main.js out.png "cube" "sphere" "pyramid"

  # Edit existing image
  node main.js out.png "Make sky blue" --edit photo.jpg

  # With reference image
  node main.js out.png "Same style, sphere" --ref cube.png

Exit Codes:
  0 - All images generated successfully
  1 - Some or all images failed
  2 - Invalid arguments or configuration
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  // Parse arguments manually for flexibility
  const options = {
    style: null,
    edit: null,
    ref: [],
    aspect: "1:1",
    model: DEFAULT_MODEL,
    maxRetries: DEFAULT_MAX_RETRIES,
  };

  const positional = [];
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg === "--style" && args[i + 1]) {
      options.style = args[++i];
    } else if (arg === "--edit" && args[i + 1]) {
      options.edit = args[++i];
    } else if (arg === "--ref" && args[i + 1]) {
      options.ref.push(args[++i]);
    } else if (arg === "--aspect" && args[i + 1]) {
      options.aspect = args[++i];
      if (!ASPECT_RATIOS.includes(options.aspect)) {
        console.error(`ERROR: Invalid aspect ratio. Valid: ${ASPECT_RATIOS.join(", ")}`);
        process.exit(2);
      }
    } else if (arg === "--model" && args[i + 1]) {
      options.model = args[++i];
    } else if (arg === "--max-retries" && args[i + 1]) {
      options.maxRetries = parseInt(args[++i], 10);
    } else if (!arg.startsWith("--")) {
      positional.push(arg);
    }

    i++;
  }

  if (positional.length < 2) {
    console.error("ERROR: Requires output path and at least one prompt");
    printHelp();
    process.exit(2);
  }

  const [outputPath, ...prompts] = positional;

  const result = await generateImage({
    prompts,
    outputPath,
    stylePath: options.style,
    editPath: options.edit,
    refPaths: options.ref,
    aspectRatio: options.aspect,
    modelId: options.model,
    maxRetries: options.maxRetries,
  });

  if (result.errorCode === ErrorCode.API_KEY_MISSING) {
    console.error(`ERROR: ${result.error}`);
    process.exit(2);
  }

  // Print summary
  console.log(`\nCompleted: ${result.succeeded}/${result.total} images`);
  if (result.retriesUsed > 0) {
    console.log(`Retries used: ${result.retriesUsed}`);
  }

  if (result.failed > 0) {
    console.log("\nFailed images:");
    result.results.forEach((r) => {
      if (!r.success) {
        console.log(`  - ${r.prompt || "Unknown"}: ${r.error || "Unknown error"}`);
      }
    });
  }

  process.exit(result.success ? 0 : 1);
}

main().catch((e) => {
  console.error(`Fatal error: ${e.message}`);
  process.exit(1);
});

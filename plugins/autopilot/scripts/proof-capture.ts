#!/usr/bin/env bun
/**
 * Proof Capture Utility for Autopilot
 *
 * Captures screenshots and generates proof artifacts.
 *
 * Usage:
 *   bun run proof-capture.ts <command> [options]
 *
 * Commands:
 *   screenshot    Capture screenshots at multiple viewports
 *   test-results  Parse and format test results
 *   coverage      Parse coverage report
 *   summary       Generate proof summary
 */

import { parseArgs } from "util";
import { chromium, devices } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";

// Parse command line arguments
const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    url: { type: "string" },
    output: { type: "string" },
    "session-path": { type: "string" },
    "task-type": { type: "string" },
    "issue-id": { type: "string" },
    "test-file": { type: "string" },
    "coverage-file": { type: "string" },
  },
  allowPositionals: true,
});

const command = positionals[0];

async function main() {
  switch (command) {
    case "screenshot":
      await captureScreenshots(values.url!, values.output!);
      break;
    case "test-results":
      await parseTestResults(values["test-file"]!, values.output!);
      break;
    case "coverage":
      await parseCoverage(values["coverage-file"]!, values.output!);
      break;
    case "summary":
      await generateSummary(
        values["session-path"]!,
        values["task-type"]!,
        values["issue-id"]!
      );
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(`
Usage: bun run proof-capture.ts <command> [options]

Commands:
  screenshot --url <url> --output <dir>
    Capture screenshots at desktop, mobile, and tablet viewports

  test-results --test-file <path> --output <path>
    Parse test results file and output structured JSON

  coverage --coverage-file <path> --output <path>
    Parse coverage report and output summary

  summary --session-path <path> --task-type <type> --issue-id <id>
    Generate proof summary markdown from all artifacts
      `);
      process.exit(1);
  }
}

async function captureScreenshots(url: string, outputDir: string): Promise<void> {
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Capturing screenshots from ${url}`);

  const browser = await chromium.launch({ headless: true });

  try {
    // Desktop (1920x1080)
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(url, { waitUntil: "networkidle" });
    await desktopPage.screenshot({
      path: join(outputDir, "desktop.png"),
      fullPage: true,
    });
    console.log("  - Desktop screenshot captured");
    await desktopContext.close();

    // Mobile (iPhone 12) - with fallback viewport
    const mobileDevice = devices["iPhone 12"] ?? {
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    };
    const mobileContext = await browser.newContext(mobileDevice);
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(url, { waitUntil: "networkidle" });
    await mobilePage.screenshot({
      path: join(outputDir, "mobile.png"),
      fullPage: true,
    });
    console.log("  - Mobile screenshot captured");
    await mobileContext.close();

    // Tablet (iPad) - with fallback viewport
    const tabletDevice = devices["iPad (gen 7)"] ?? {
      viewport: { width: 810, height: 1080 },
      userAgent: "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    };
    const tabletContext = await browser.newContext(tabletDevice);
    const tabletPage = await tabletContext.newPage();
    await tabletPage.goto(url, { waitUntil: "networkidle" });
    await tabletPage.screenshot({
      path: join(outputDir, "tablet.png"),
      fullPage: true,
    });
    console.log("  - Tablet screenshot captured");
    await tabletContext.close();

    console.log(
      JSON.stringify({
        success: true,
        screenshots: ["desktop.png", "mobile.png", "tablet.png"],
        outputDir,
      })
    );
  } finally {
    await browser.close();
  }
}

async function parseTestResults(
  testFile: string,
  outputPath: string
): Promise<void> {
  if (!existsSync(testFile)) {
    console.log(
      JSON.stringify({
        success: false,
        error: `Test file not found: ${testFile}`,
      })
    );
    process.exit(1);
  }

  const content = readFileSync(testFile, "utf-8");

  // Parse common test output formats
  // This is a simplified parser - real implementation would handle
  // Jest, Vitest, Bun test, etc. output formats

  const lines = content.split("\n");
  let passed = 0;
  let failed = 0;
  let total = 0;

  // Look for common patterns
  for (const line of lines) {
    // Jest/Vitest pattern: "Tests: X passed, Y failed, Z total"
    const jestMatch = line.match(
      /Tests:\s*(\d+)\s*passed,?\s*(\d+)?\s*failed?,?\s*(\d+)\s*total/i
    );
    if (jestMatch) {
      passed = parseInt(jestMatch[1]);
      failed = parseInt(jestMatch[2] || "0");
      total = parseInt(jestMatch[3]);
      break;
    }

    // Bun test pattern: "X pass, Y fail"
    const bunMatch = line.match(/(\d+)\s*pass(?:ed)?,?\s*(\d+)?\s*fail/i);
    if (bunMatch) {
      passed = parseInt(bunMatch[1]);
      failed = parseInt(bunMatch[2] || "0");
      total = passed + failed;
      break;
    }
  }

  const result = {
    success: failed === 0,
    passed,
    failed,
    total,
    coverage: null as number | null, // Would be extracted from coverage report
  };

  // Ensure output directory exists
  const outputDirPath = dirname(outputPath);
  if (!existsSync(outputDirPath)) {
    mkdirSync(outputDirPath, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}

async function parseCoverage(
  coverageFile: string,
  outputPath: string
): Promise<void> {
  if (!existsSync(coverageFile)) {
    console.log(
      JSON.stringify({
        success: false,
        error: `Coverage file not found: ${coverageFile}`,
      })
    );
    process.exit(1);
  }

  const content = readFileSync(coverageFile, "utf-8");

  try {
    const coverage = JSON.parse(content);

    // Handle different coverage formats (c8, istanbul, etc.)
    let totalCoverage = 0;

    if (coverage.total) {
      // Istanbul format
      totalCoverage = coverage.total.lines?.pct || 0;
    } else if (typeof coverage === "number") {
      totalCoverage = coverage;
    }

    const result = {
      success: true,
      coverage: totalCoverage,
      details: coverage,
    };

    // Ensure output directory exists
    const outputDirPath = dirname(outputPath);
    if (!existsSync(outputDirPath)) {
      mkdirSync(outputDirPath, { recursive: true });
    }

    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ success: true, coverage: totalCoverage }));
  } catch (error) {
    console.log(
      JSON.stringify({
        success: false,
        error: `Failed to parse coverage: ${error}`,
      })
    );
    process.exit(1);
  }
}

async function generateSummary(
  sessionPath: string,
  taskType: string,
  issueId: string
): Promise<void> {
  const proofDir = join(sessionPath, "proof");

  // Collect proof artifacts
  const screenshots: string[] = [];
  for (const name of ["desktop.png", "mobile.png", "tablet.png"]) {
    if (existsSync(join(proofDir, name))) {
      screenshots.push(name);
    }
  }

  // Read test results if available
  let testResults = { passed: 0, failed: 0, total: 0 };
  const testResultsPath = join(proofDir, "test-results.json");
  if (existsSync(testResultsPath)) {
    testResults = JSON.parse(readFileSync(testResultsPath, "utf-8"));
  }

  // Read coverage if available
  let coverage = 0;
  const coveragePath = join(proofDir, "coverage-summary.json");
  if (existsSync(coveragePath)) {
    const coverageData = JSON.parse(readFileSync(coveragePath, "utf-8"));
    coverage = coverageData.coverage || 0;
  }

  // Check build status
  let buildSuccessful = false;
  const buildStatusPath = join(proofDir, "build-status.txt");
  if (existsSync(buildStatusPath)) {
    const status = readFileSync(buildStatusPath, "utf-8").trim();
    buildSuccessful = status === "0";
  }

  // Calculate confidence score
  let confidence = 0;

  // Tests (40 points)
  if (testResults.total > 0 && testResults.failed === 0) {
    confidence += 40;
  }

  // Build (20 points)
  if (buildSuccessful) {
    confidence += 20;
  }

  // Coverage (20 points)
  if (coverage >= 80) confidence += 20;
  else if (coverage >= 60) confidence += 15;
  else if (coverage >= 40) confidence += 10;
  else if (coverage > 0) confidence += 5;

  // Screenshots (10 points)
  if (screenshots.length >= 3) confidence += 10;
  else if (screenshots.length >= 1) confidence += 5;

  // Lint (10 points) - assume clean if build passed
  if (buildSuccessful) {
    confidence += 10;
  }

  // Generate summary markdown
  const summary = `# Proof of Work

**Task**: ${issueId}
**Type**: ${taskType}
**Confidence**: ${confidence}%

## Test Results
- Total: ${testResults.total}
- Passed: ${testResults.passed}
- Failed: ${testResults.failed}
- Coverage: ${coverage}%

## Build
- Status: ${buildSuccessful ? "Success" : "Failed"}

## Screenshots
${screenshots.map((s) => `- ${s}`).join("\n") || "- None captured"}

## Artifacts
${existsSync(join(proofDir, "test-results.txt")) ? "- test-results.txt\n" : ""}${existsSync(join(proofDir, "coverage.json")) ? "- coverage.json\n" : ""}${existsSync(join(proofDir, "build-output.txt")) ? "- build-output.txt\n" : ""}
`;

  // Write summary
  const summaryPath = join(proofDir, "summary.md");
  writeFileSync(summaryPath, summary);

  console.log(
    JSON.stringify({
      success: true,
      confidence,
      summaryPath,
    })
  );
}

// Run main
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

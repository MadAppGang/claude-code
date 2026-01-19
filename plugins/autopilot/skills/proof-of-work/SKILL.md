---
name: proof-of-work
description: Proof artifact generation patterns for task validation. Covers screenshots, test results, deployments, and confidence scoring.
version: 0.1.0
tags: [proof, validation, screenshots, tests, deployment]
keywords: [proof, artifact, screenshot, test, deployment, confidence, validation]
---

# Proof-of-Work

**Version:** 0.1.0
**Purpose:** Generate validation artifacts for autonomous task completion
**Status:** Phase 1

## When to Use

Use this skill when you need to:
- Generate proof artifacts after task completion
- Capture screenshots for UI verification
- Parse and report test results
- Calculate confidence scores for task validation
- Determine if a task can be auto-approved

## Overview

Proof-of-work is the mechanism that validates task completion. Every finished task must include verifiable artifacts that demonstrate the work was done correctly.

## Proof Types by Task

### Bug Fix Proof

| Artifact | Required | Purpose |
|----------|----------|---------|
| Git diff | Yes | Show minimal, focused changes |
| Test results | Yes | All tests passing |
| Regression test | Yes | Specific test for the bug |
| Error log (before/after) | Optional | Visual evidence |

### Feature Proof

| Artifact | Required | Purpose |
|----------|----------|---------|
| Screenshots | Yes | Visual verification |
| Test results | Yes | Functionality works |
| Coverage report | Yes | >= 80% coverage |
| Build output | Yes | Builds successfully |
| Deployment URL | Optional | Live demo |

### UI Change Proof

| Artifact | Required | Purpose |
|----------|----------|---------|
| Desktop screenshot | Yes | 1920x1080 view |
| Mobile screenshot | Yes | 375x667 view |
| Tablet screenshot | Yes | 768x1024 view |
| Accessibility score | Yes | >= 80 Lighthouse |
| Visual regression | Optional | BackstopJS diff |

## Screenshot Capture

**Playwright Pattern:**

```typescript
import { chromium } from 'playwright';

async function captureScreenshots(url: string, outputDir: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: `${outputDir}/desktop.png`,
    fullPage: true,
  });

  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: `${outputDir}/mobile.png`,
    fullPage: true,
  });

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: `${outputDir}/tablet.png`,
    fullPage: true,
  });

  await browser.close();
}
```

## Confidence Scoring

**Algorithm:**

```typescript
interface ProofArtifacts {
  testResults?: { passed: number; total: number };
  buildSuccessful?: boolean;
  lintErrors?: number;
  screenshots?: string[];
  testCoverage?: number;
  performanceScore?: number;
}

function calculateConfidence(artifacts: ProofArtifacts): number {
  let score = 0;

  // Tests (40 points)
  if (artifacts.testResults) {
    if (artifacts.testResults.passed === artifacts.testResults.total) {
      score += 40;
    }
  }

  // Build (20 points)
  if (artifacts.buildSuccessful) {
    score += 20;
  }

  // Coverage (20 points)
  if (artifacts.testCoverage) {
    if (artifacts.testCoverage >= 80) score += 20;
    else if (artifacts.testCoverage >= 60) score += 15;
    else if (artifacts.testCoverage >= 40) score += 10;
    else score += 5;
  }

  // Screenshots (10 points)
  if (artifacts.screenshots) {
    if (artifacts.screenshots.length >= 3) score += 10;
    else if (artifacts.screenshots.length >= 1) score += 5;
  }

  // Lint (10 points)
  if (artifacts.lintErrors === 0) {
    score += 10;
  }

  return score;
}
```

## Confidence Thresholds

| Confidence | Action |
|------------|--------|
| >= 95% | Auto-approve (In Review -> Done) |
| 80-94% | Manual review required |
| < 80% | Validation failed, iterate |

## Proof Summary Template

```markdown
# Proof of Work

**Task**: {issue_id}
**Type**: {task_type}
**Confidence**: {score}%

## Test Results
- Total: {total}
- Passed: {passed}
- Failed: {failed}
- Coverage: {coverage}%

## Build
- Status: {status}
- Duration: {duration}

## Screenshots
- Desktop: proof/desktop.png
- Mobile: proof/mobile.png
- Tablet: proof/tablet.png

## Artifacts
- test-results.txt
- coverage.json
- build-output.txt
```

## Examples

### Example 1: Feature Proof Generation

```typescript
const proof = {
  testResults: { passed: 15, total: 15 },
  buildSuccessful: true,
  lintErrors: 0,
  screenshots: ['desktop.png', 'mobile.png', 'tablet.png'],
  testCoverage: 85,
};

const confidence = calculateConfidence(proof);
// 40 (tests) + 20 (build) + 20 (coverage) + 10 (screenshots) + 10 (lint) = 100%
```

### Example 2: Partial Proof

```typescript
const proof = {
  testResults: { passed: 12, total: 15 },  // Some failing
  buildSuccessful: true,
  lintErrors: 2,
  screenshots: ['desktop.png'],
  testCoverage: 65,
};

const confidence = calculateConfidence(proof);
// 0 (tests fail) + 20 (build) + 15 (coverage) + 5 (1 screenshot) + 0 (lint errors) = 40%
// Result: Validation failed, must iterate
```

## Best Practices

- Always capture screenshots for UI work
- Run full test suite, not just affected tests
- Include coverage report for features
- Build must pass before any proof is valid
- Store proofs in session directory for debugging
- Generate proof summary in markdown for Linear comments

---
name: proof-of-work
description: "Generates validation artifacts (screenshots, test results, coverage reports) after task completion and calculates confidence scores for auto-approval decisions. Supports bug fix, feature, and UI change proof types. Use when validating task completion or determining if work can be auto-approved."
---

# Proof-of-Work

Generates verifiable artifacts that demonstrate task completion and calculates confidence scores to determine whether tasks can be auto-approved or need manual review.

## Workflow

1. **Determine proof type** based on task classification (bug fix, feature, or UI change)
2. **Collect artifacts** - run tests, capture screenshots, check coverage, verify build
3. **Calculate confidence score** using the weighted scoring algorithm
4. **Generate proof summary** in markdown format for Linear comments
5. **Return approval decision** based on confidence thresholds

## Required Artifacts by Task Type

| Artifact | Bug Fix | Feature | UI Change |
|----------|---------|---------|-----------|
| Git diff | Required | - | - |
| Test results | Required | Required | - |
| Regression test | Required | - | - |
| Coverage report | - | Required (>=80%) | - |
| Build output | - | Required | - |
| Desktop screenshot (1920x1080) | - | - | Required |
| Mobile screenshot (375x667) | - | - | Required |
| Tablet screenshot (768x1024) | - | - | Required |
| Accessibility score | - | - | Required (>=80) |
| Deployment URL | Optional | Optional | Optional |

## Confidence Scoring Algorithm

```typescript
function calculateConfidence(artifacts: ProofArtifacts): number {
  let score = 0;
  // Tests: 40 points (all must pass)
  if (artifacts.testResults?.passed === artifacts.testResults?.total) score += 40;
  // Build: 20 points
  if (artifacts.buildSuccessful) score += 20;
  // Coverage: 20 points (>=80% full marks, >=60% partial)
  if (artifacts.testCoverage >= 80) score += 20;
  else if (artifacts.testCoverage >= 60) score += 15;
  // Screenshots: 10 points (3+ full marks)
  if (artifacts.screenshots?.length >= 3) score += 10;
  else if (artifacts.screenshots?.length >= 1) score += 5;
  // Lint: 10 points (zero errors)
  if (artifacts.lintErrors === 0) score += 10;
  return score;
}
```

## Confidence Thresholds

| Score | Action |
|-------|--------|
| >= 95% | Auto-approve (In Review -> Done) |
| 80-94% | Manual review required |
| < 80% | Validation failed, must iterate |

## Screenshot Capture Pattern

```typescript
import { chromium } from 'playwright';

async function captureScreenshots(url: string, outputDir: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(ctx => ctx.newPage());

  for (const [name, width, height] of [
    ['desktop', 1920, 1080],
    ['mobile', 375, 667],
    ['tablet', 768, 1024],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${outputDir}/${name}.png`, fullPage: true });
  }
  await browser.close();
}
```

## Examples

### Full confidence proof
```typescript
const proof = {
  testResults: { passed: 15, total: 15 },
  buildSuccessful: true,
  lintErrors: 0,
  screenshots: ['desktop.png', 'mobile.png', 'tablet.png'],
  testCoverage: 85,
};
calculateConfidence(proof); // 40+20+20+10+10 = 100% → auto-approve
```

### Partial proof requiring iteration
```typescript
const proof = {
  testResults: { passed: 12, total: 15 },  // some failing
  buildSuccessful: true,
  lintErrors: 2,
  screenshots: ['desktop.png'],
  testCoverage: 65,
};
calculateConfidence(proof); // 0+20+15+5+0 = 40% → validation failed, iterate
```

## Verification

After generating proof, confirm:
- [ ] All required artifacts for the task type are present
- [ ] Confidence score calculated correctly
- [ ] Proof summary generated in markdown format
- [ ] Approval decision matches threshold table

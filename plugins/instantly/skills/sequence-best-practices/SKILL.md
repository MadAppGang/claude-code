---
name: sequence-best-practices
description: "Build and optimize cold email sequences with step-by-step timing, copy structure, personalization tokens, and CTA progression. Use when creating a new outreach sequence or improving reply rates on existing campaigns."
---

# Sequence Best Practices

## Workflow

1. **Choose sequence length** -- select 5-step or 7-step based on lead volume
2. **Set timing** -- configure delays between steps
3. **Write copy** -- follow length and structure guidelines per step
4. **Add personalization** -- apply tokens and custom opening lines
5. **Review for spam triggers** -- remove risky words and formatting
6. **Launch and monitor** -- track reply rates by step to identify weak emails

## Step 1: Choose Sequence Structure

### Standard 5-Step Sequence

| Step | Day | Purpose | Email Type |
|------|-----|---------|------------|
| 1 | 0 | Initial outreach | Problem + value prop |
| 2 | 3 | Social proof | Case study / results |
| 3 | 7 | Alternative angle | Different value prop |
| 4 | 10 | Soft breakup | "If not a fit..." |
| 5 | 14 | Breakup | Last attempt, value-add |

### Extended 7-Step Sequence (high volume)

| Step | Day | Purpose | Email Type |
|------|-----|---------|------------|
| 1 | 0 | Initial outreach | Problem + value prop |
| 2 | 2 | Quick follow-up | Bump + new angle |
| 3 | 5 | Social proof | Case study |
| 4 | 8 | Value-add | Free resource |
| 5 | 12 | Alternative angle | Different ICP pain |
| 6 | 16 | Soft breakup | Check-in |
| 7 | 21 | Breakup | Final attempt |

## Step 2: Set Timing

| Gap | Delay | Reasoning |
|-----|-------|-----------|
| Email 1 → 2 | 2-3 days | Stay top of mind |
| Email 2 → 3 | 3-4 days | Let social proof sink in |
| Email 3 → 4 | 3-4 days | Give time to consider |
| Email 4 → 5 | 4-5 days | Breakup needs space |
| After breakup | 30+ days | Cool-off period |

Best send windows: Tue-Thu, 8-10am or 2-4pm recipient local time. Avoid Monday morning and Friday afternoon.

## Step 3: Write Copy by Step

### Copy Length Guidelines

| Email Type | Words | Lines |
|------------|-------|-------|
| Cold outreach | 50-100 | 5-8 |
| Follow-up | 30-60 | 3-5 |
| Case study | 100-150 | 8-12 |
| Breakup | 40-80 | 4-6 |

### Email Structure Template

```
[Personalized opening - 1 line]
[Problem statement or insight - 2-3 lines]
[Brief value proposition - 1-2 lines]
[Single CTA - 1 line]
[Signature]
```

### CTA Progression

| Step | CTA Type | Example |
|------|----------|---------|
| Early | Soft | "Thoughts?" |
| Middle | Medium | "Worth a quick chat?" |
| After engagement | Direct | "15 min this week?" |
| Final | Breakup | "Should I close the loop?" |

One CTA per email. Never give multiple options.

### Subject Line Examples

- Good: `{{first_name}}, quick question` (short, personal, curiosity)
- Good: `idea for {{company}}'s Q2` (specific, relevant)
- Bad: `RE: Our meeting` (deceptive fake reply)
- Bad: `FREE TRIAL INSIDE!!!` (spam trigger)

## Step 4: Add Personalization

| Token | Example | Priority |
|-------|---------|----------|
| `{{first_name}}` | "Hey Sarah," | Required |
| `{{company}}` | "saw {{company}}'s recent..." | Recommended |
| `{{title}}` | "As a {{title}}, you..." | If relevant |
| `{{industry}}` | "In {{industry}}, we see..." | For segmented lists |

Rule: Always personalize the opening line. The rest can be templated.

## Step 5: Spam Trigger Checklist

| Practice | Reason |
|----------|--------|
| No images in cold emails | Triggers spam filters |
| Max 1 link per email | Multiple links = spam |
| No HTML formatting | Plain text performs better |
| No attachments | Major spam trigger |
| Avoid: FREE, GUARANTEE, URGENT, ALL CAPS, !!!! | Known spam keywords |

## Example: 5-Step SaaS Outreach Sequence

```
Step 1 (Day 0): "{{first_name}}, quick question about {{company}}"
  → 75 words, problem-focused opening, soft CTA "Thoughts?"

Step 2 (Day 3): "re: {{company}}"
  → 60 words, case study: "We helped [Similar Co] increase X by 30%"

Step 3 (Day 7): "different approach for {{company}}"
  → 70 words, alternative pain point, medium CTA

Step 4 (Day 10): "not sure if this is a fit"
  → 45 words, soft breakup, permission-based close

Step 5 (Day 14): "closing the loop"
  → 50 words, free resource attached, final CTA
```

## Validation Checklist

- [ ] Each email has exactly one CTA
- [ ] Opening line is personalized with at least `{{first_name}}`
- [ ] No spam trigger words in subject or body
- [ ] Delays between emails follow recommended ranges
- [ ] Copy stays within word count guidelines per email type
- [ ] Reply rates tracked per step to identify underperformers

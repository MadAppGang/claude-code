---
name: email-deliverability
version: 1.0.0
description: Email deliverability best practices and troubleshooting
---
plugin: instantly
updated: 2026-01-20

# Email Deliverability

## Deliverability Fundamentals

### Key Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Bounce Rate | <2% | 2-5% | >5% |
| Spam Complaint Rate | <0.1% | 0.1-0.5% | >0.5% |
| Inbox Placement | >95% | 80-95% | <80% |
| Sender Score | >80 | 60-80 | <60 |

### Deliverability Components

```
DELIVERABILITY =
  Sender Reputation (40%)
  + Content Quality (30%)
  + Technical Setup (20%)
  + List Quality (10%)
```

## Sender Reputation

### Warm-Up Schedule

| Day | Emails/Day | Total Sent |
|-----|------------|------------|
| 1-7 | 10-20 | 70-140 |
| 8-14 | 30-50 | 280-490 |
| 15-21 | 75-100 | 805-1190 |
| 22-28 | 150-200 | 1855-2590 |
| 29+ | Scale gradually | - |

### Reputation Signals

| Positive Signals | Negative Signals |
|------------------|------------------|
| Opens | Spam complaints |
| Replies | Hard bounces |
| Clicks | Low engagement |
| Forwards | Unsubscribes |
| Non-spam marking | Spam trap hits |

## Content Quality

### Spam Filter Triggers

**High-Risk Words:**
```
FREE, GUARANTEE, WINNER, CASH, PRIZE
URGENT, ACT NOW, LIMITED TIME
Click here, Click below, Don't miss
Make money, Extra income, Work from home
```

**Formatting Red Flags:**
- ALL CAPS in subject or body
- Multiple exclamation marks!!!
- Colored fonts
- Excessive links (>1)
- Images (especially in cold email)
- Attachments

### Safe Practices

| Do | Don't |
|----|-------|
| Plain text emails | HTML-heavy templates |
| Single link (if any) | Multiple CTAs |
| Conversational tone | Salesy language |
| Short sentences | Long paragraphs |
| Proper grammar | Typos and errors |

## Technical Setup

### Required DNS Records

| Record | Purpose | Status Check |
|--------|---------|--------------|
| SPF | Authorize sending servers | `nslookup -type=TXT domain` |
| DKIM | Email signature verification | Check in email headers |
| DMARC | Policy for failed checks | `nslookup -type=TXT _dmarc.domain` |

### Recommended Settings

```
SPF: v=spf1 include:_spf.instantly.ai ~all
DKIM: Configure via Instantly dashboard
DMARC: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

## List Quality

### Email Verification

| Verification Level | Description | Bounce Rate |
|--------------------|-------------|-------------|
| Syntax check | Valid format | Reduces 5-10% |
| Domain check | Valid domain | Reduces 10-20% |
| Mailbox check | Exists | Reduces 20-40% |
| Engagement check | Active | Reduces 5-15% |

### List Hygiene

| Practice | Frequency | Impact |
|----------|-----------|--------|
| Remove hard bounces | Immediately | Critical |
| Remove soft bounces | After 3 attempts | High |
| Remove unsubscribes | Immediately | Critical |
| Re-verify list | Every 3 months | Medium |

## Troubleshooting

### High Bounce Rate (>5%)

**Diagnosis Steps:**
1. Check bounce types (hard vs soft)
2. Identify source (specific list segment?)
3. Verify emails before adding to campaign

**Remediation:**
1. Pause campaign immediately
2. Remove all hard bounces
3. Re-verify remaining list
4. Resume with verified emails only

### Low Open Rate (<15%)

**Possible Causes:**
1. Poor sender reputation
2. Landing in spam/promotions
3. Bad subject lines
4. Wrong send time

**Diagnosis:**
1. Check sender score
2. Send test emails to Gmail/Outlook
3. Review recent changes to sending

### Spam Complaints (>0.1%)

**Immediate Actions:**
1. Pause campaign
2. Review targeting (wrong ICP?)
3. Check email frequency
4. Review unsubscribe visibility

**Long-term:**
1. Improve list sourcing
2. Better qualification
3. Add clear opt-out

## Recovery Playbook

### Reputation Recovery

| Day | Action | Expected Outcome |
|-----|--------|------------------|
| 1-3 | Pause all sending | Stop damage |
| 4-7 | Remove problem addresses | Clean list |
| 8-14 | Warm up from scratch | Rebuild slowly |
| 15-21 | Monitor metrics closely | Catch issues early |
| 22+ | Gradually scale | Sustainable growth |

### Blacklist Removal

1. Identify which blacklists (MXToolbox)
2. Fix underlying issue first
3. Request removal from each list
4. Wait 24-72 hours
5. Re-check and repeat if needed

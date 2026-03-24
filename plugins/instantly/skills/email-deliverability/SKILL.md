---
name: email-deliverability
description: "Diagnose and fix email deliverability issues by auditing DNS records, sender reputation, content quality, and list hygiene. Use when bounce rates spike, emails land in spam, or warming up a new sending domain."
---

# Email Deliverability

## Workflow

1. **Check health metrics** -- assess bounce rate, spam complaints, inbox placement, sender score
2. **Audit technical setup** -- verify SPF, DKIM, and DMARC records
3. **Evaluate content quality** -- scan for spam triggers in copy and formatting
4. **Assess list quality** -- verify email addresses and remove bad contacts
5. **Troubleshoot issues** -- match symptoms to known patterns and remediate
6. **Verify fixes** -- confirm metrics return to healthy thresholds

## Step 1: Check Health Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Bounce Rate | <2% | 2-5% | >5% |
| Spam Complaint Rate | <0.1% | 0.1-0.5% | >0.5% |
| Inbox Placement | >95% | 80-95% | <80% |
| Sender Score | >80 | 60-80 | <60 |

Deliverability formula: Sender Reputation (40%) + Content Quality (30%) + Technical Setup (20%) + List Quality (10%).

## Step 2: Audit Technical Setup

| Record | Purpose | How to Check |
|--------|---------|--------------|
| SPF | Authorize sending servers | `nslookup -type=TXT domain` |
| DKIM | Email signature verification | Check in email headers |
| DMARC | Policy for failed checks | `nslookup -type=TXT _dmarc.domain` |

Required DNS settings for Instantly:

```
SPF:   v=spf1 include:_spf.instantly.ai ~all
DKIM:  Configure via Instantly dashboard
DMARC: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

## Step 3: Evaluate Content Quality

**Spam trigger words to avoid:** FREE, GUARANTEE, WINNER, URGENT, ACT NOW, Click here, LIMITED TIME.

| Do | Don't |
|----|-------|
| Plain text emails | HTML-heavy templates |
| Single link (if any) | Multiple CTAs |
| Conversational tone | Salesy language |
| Short sentences | Long paragraphs |
| Proper grammar | ALL CAPS or !!! |

## Step 4: Assess List Quality

| Verification Level | Bounce Rate Reduction |
|--------------------|----------------------|
| Syntax check | 5-10% |
| Domain check | 10-20% |
| Mailbox check | 20-40% |
| Engagement check | 5-15% |

Hygiene rules: Remove hard bounces and unsubscribes immediately. Remove soft bounces after 3 attempts. Re-verify full list every 3 months.

## Step 5: Troubleshoot by Symptom

**High Bounce Rate (>5%):**
1. Pause campaign immediately
2. Separate hard vs soft bounces
3. Remove all hard bounces
4. Re-verify remaining list
5. Resume with verified emails only

**Low Open Rate (<15%):**
1. Check sender score at senderscore.org
2. Send test emails to Gmail/Outlook -- check spam folder
3. If landing in spam: start reputation recovery (see below)
4. If inbox: A/B test subject lines

**Spam Complaints (>0.1%):**
1. Pause campaign
2. Review targeting -- wrong ICP?
3. Add clear unsubscribe link
4. Improve list sourcing and qualification

## Warm-Up Schedule for New Domains

| Day | Emails/Day | Cumulative |
|-----|------------|------------|
| 1-7 | 10-20 | ~140 |
| 8-14 | 30-50 | ~490 |
| 15-21 | 75-100 | ~1,190 |
| 22-28 | 150-200 | ~2,590 |
| 29+ | Scale gradually | -- |

## Reputation Recovery Playbook

| Day | Action | Expected Outcome |
|-----|--------|------------------|
| 1-3 | Pause all sending | Stop further damage |
| 4-7 | Remove problem addresses | Clean list |
| 8-14 | Warm up from scratch | Rebuild reputation |
| 15-21 | Monitor metrics closely | Catch issues early |
| 22+ | Gradually scale | Sustainable growth |

For blacklist removal: check MXToolbox, fix root cause, request removal, wait 24-72 hours, re-check.

## Validation Checklist

- [ ] SPF, DKIM, and DMARC records all pass verification
- [ ] Bounce rate below 2%
- [ ] Spam complaint rate below 0.1%
- [ ] Test email reaches inbox (not spam) on Gmail and Outlook
- [ ] Warm-up completed before scaling volume

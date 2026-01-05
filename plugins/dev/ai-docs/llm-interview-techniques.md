# LLM-Based Interview Techniques for Requirements Elicitation

Based on research paper: "LLMREI: Automating Requirements Elicitation Interviews with LLMs" (Korn, Gorsch, Vogelsang - 2025)

## Executive Summary

This document describes proven approaches for conducting automated requirements elicitation interviews using LLMs, based on empirical research with 33 simulated stakeholder interviews. The techniques can be adapted for product discovery, user research, and feature specification interviews.

## Key Findings

| Metric | Result |
|--------|--------|
| Requirements Captured | Up to 73.7% (60.94% fully + 12.76% partially) |
| Error Rate | Comparable to trained human interviewers |
| Context Adaptation | ~60% of questions were context-dependent |
| Best Approach | Zero-shot prompting (LLMREI-short) for requirements coverage |

---

## Three Approaches Tested

### 1. Zero-Shot Prompting (LLMREI-short) - RECOMMENDED

**Performance:** Best for requirements elicitation coverage

**System Prompt:**
```
You are an interviewer, called LLMREI, who assists a requirements engineer
in eliciting requirements. Bombard the stakeholder with questions about
his/her business and his/her project to find out everything the stakeholder
envisions! Act like a real-world interviewer, so only ask one question at
a time or only ask two questions if it is about one specific topic.
```

**Why it works:**
- Leverages LLM's pre-trained knowledge of interview best practices
- Minimal prompt = fewer constraints = more adaptive questioning
- Generated more context-enhancing questions (15.3% vs 10.4%)
- Generated more context-deepening questions (44.4% vs 32.3%)
- Successfully elicited ALL requirements at least once across interviews

**Question Distribution:**
| Category | Percentage |
|----------|------------|
| Context-independent | 27.3% |
| Parameterized | 12.8% |
| Context-deepening | 44.4% |
| Context-enhancing | 15.3% |

---

### 2. Least-to-Most Prompting (LLMREI-long) - Best for Structure

**Performance:** Better at avoiding common interview mistakes, more methodical

**System Prompt Structure:**
```
You are an interviewer, called LLMREI, who assists a requirements engineer
in eliciting requirements.

Goal: The purpose of this chat bot is to conduct comprehensive and effective
requirements elicitation interviews with stakeholders, ensuring all necessary
information is gathered to support project development.

{Interview Cookbook - detailed guidelines}

Maintain professionalism throughout the interview. Adjust questions based on
the stakeholder's role, education level, and domain knowledge. Adapt questioning
style to fit the flow of the stakeholder's responses. Actively listen to
differentiate between stated needs and actual needs. Let the customer create
scenarios. Example: "Please visualize the first page of your application and
explain how you would interact with it step-by-step."
```

**Three Key Components:**
1. **Role Description** - Clear definition of interviewer role
2. **Interview Guidelines** - Five-step structured process
3. **Error Handling** - Adaptability and professional conduct rules

**Question Distribution:**
| Category | Percentage |
|----------|------------|
| Context-independent | 28.3% |
| Parameterized | 28.9% |
| Context-deepening | 32.3% |
| Context-enhancing | 10.4% |

**Advantages:**
- 64.23% of reviewers found fewer mistakes vs 59.1% for short prompt
- Better at generating final summaries
- Better at avoiding very long questions
- More structured, professional interactions
- Reduces interviewer influence on responses

---

### 3. Fine-Tuning (ABANDONED)

**Result:** Poor performance - not recommended

**Why it failed:**
- Training data quality was insufficient (student interviewers, not professionals)
- Non-native English speakers in training data
- Spoken-language transcripts caused informal/unstructured behavior
- Model produced incoherent responses, lost track of interview purpose
- Sometimes switched languages unexpectedly

**Lesson:** Fine-tuning requires high-quality, professional interview transcripts. Prompt engineering is more effective for this use case.

---

## Common Interview Mistakes to Avoid

Based on Bano et al.'s framework, these mistakes were evaluated:

### Question Formulation
- Asking vague questions
- Asking technical questions (inappropriate for stakeholder)
- Asking irrelevant questions
- Asking customer for solutions (instead of problems)
- Asking very long questions
- Incorrect formulation of questions

### Question Omission
- Not identifying stakeholders
- No probing questions
- Not asking about the existing system
- Not asking about feature prioritization
- Not asking about the problem domain
- Not identifying success criteria
- Missing relevant questions

### Order of Interview
- No final summary
- Opening with direct questions
- Incorrect order of questions
- Repeating the questions

### Communication Skills
- Unnatural dialogue style
- Poor communication skills
- Poor listening skills
- No rapport with customer

---

## Question Categories (Adaptability Metrics)

### 1. Context-Independent (Low Value)
General questions from a standard set - no adaptation needed.
```
Example: "How would you describe the project we're discussing today
in two to four sentences?"
```

### 2. Parameterized (Low-Medium Value)
General questions with basic context placeholders.
```
Example: "Let's start by gathering detailed requirements for the
{customer portal}. Could you please elaborate on what you want this
online customer portal to accomplish?"
```

### 3. Context-Deepening (High Value)
Questions directly informed by prior answers - medium adaptation.
```
Example: "For managing supplies, do you want the software to track
inventory levels, alert you when stock is low, or even manage orders
from suppliers? How do you manage your supply level presently?"
```

### 4. Context-Enhancing (Highest Value)
Questions that introduce new ideas based on context - high adaptation.
```
Example: "In terms of customer interaction, would you like any
additional features, such as appointment reminders, loyalty programs,
or feedback collection?"
```

---

## Implementation Guidelines

### Interview Structure (Five Steps)

1. **Preparation**
   - Identify stakeholders
   - Formulate initial questions
   - Define interview goals

2. **Introduction**
   - Establish rapport
   - Explain interview purpose
   - Set expectations for duration

3. **Core Elicitation**
   - Ask open-ended questions first
   - Follow up with probing questions
   - Use scenario-based questions
   - Ask about existing systems

4. **Prioritization & Validation**
   - Feature prioritization questions
   - Identify success criteria
   - Validate understanding

5. **Conclusion**
   - Summarize key points
   - Ask about other stakeholders
   - Thank participant

### Best Practices

**DO:**
- Ask one question at a time (or two closely related)
- Adapt to stakeholder's education level and domain knowledge
- Differentiate between stated needs and actual needs
- Let customers create scenarios
- Generate a final summary
- Ask about feature prioritization

**DON'T:**
- Ask multiple unrelated questions simultaneously
- Use overly technical language
- Skip probing questions
- Forget to ask about existing systems
- End without a summary

---

## Prompt Engineering Tips

### For Requirements Interviews

1. **Start Simple** - Zero-shot often works surprisingly well
2. **Add Structure Incrementally** - Only add guidelines for specific problems
3. **Limit Questions Per Turn** - Explicitly instruct "one question at a time"
4. **Include Scenario Prompts** - "Please visualize the first page..."
5. **Request Summaries** - Include explicit instruction for final summary

### Addressing Common Issues

| Issue | Solution |
|-------|----------|
| Multiple questions at once | Add: "only ask one question at a time" |
| No final summary | Add: "conclude with a summary of requirements" |
| Too technical | Add: "adjust language to stakeholder's level" |
| Missing probing | Add: "always follow up with clarifying questions" |
| Vague questions | Add: "be specific and concrete in questions" |

---

## Limitations & Considerations

### What LLMs Cannot Do

1. **Non-verbal cues** - Cannot read body language, facial expressions, tone
2. **Emotional intelligence** - May miss implicit needs and concerns
3. **Complex scenarios** - Human-led interviews better for sensitive/complex cases
4. **Real stakeholder interest** - Simulated stakeholders may differ from real ones

### Privacy & Ethics

- Data handling unclear with cloud-based LLMs
- Consider self-hosted models for sensitive domains
- Avoid collecting personal information (email, phone)
- Be transparent about AI-conducted interviews

### Hallucination Risk

- LLMs may provide incorrect information (e.g., estimated prices)
- Always validate generated summaries
- Don't rely on LLM-generated technical specifications

---

## Application to Product Development

This research applies directly to:

1. **User Research Interviews** - Discover user needs and pain points
2. **Product Discovery** - Understand market requirements
3. **Feature Specification** - Elicit detailed feature requirements
4. **Stakeholder Alignment** - Gather diverse perspectives at scale
5. **Training Tool** - Practice interview skills with AI feedback

### Scalability Advantage

The greatest benefit is enabling (semi-)automated interviews with large numbers of stakeholders, gathering initial requirements with minimal human effort. These can then inform focused manual interviews for critical/nuanced requirements.

---

## References

- Korn, A., Gorsch, S., & Vogelsang, A. (2025). LLMREI: Automating Requirements Elicitation Interviews with LLMs. arXiv:2507.02564
- Bano, M., et al. (2019). Teaching requirements elicitation interviews: an empirical study of learning from mistakes. Requirements Engineering, 24(3), 259-289.
- Ferrari, A., et al. (2020). SaPeer and ReverseSaPeer: teaching requirements elicitation interviews. Requirements Engineering, 25(4), 417-438.
- Zhou, D., et al. (2023). Least-to-most prompting enables complex reasoning in large language models. arXiv:2205.10625

---

*Document created: January 2026*
*Based on: IEEE paper from University of Duisburg-Essen*

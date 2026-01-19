/**
 * Multi-Model Reviewer Service
 *
 * Runs parallel reviews across multiple AI models and generates a comparison report.
 * Uses claudish CLI for external models and direct Claude API for internal.
 *
 * Supports both:
 * - Plan consensus: Before execution, models discuss and approve the plan
 * - Review consensus: After execution, models review the completed work
 */

import { spawn } from "child_process";
import type { Config, ModelReviewResult, SessionRecord, Task } from "../types";
import { logger } from "../utils/logger";

// Plan feedback from a model
export interface ModelPlanFeedback {
  model: string;
  verdict: "approve" | "suggest_changes" | "reject";
  feedback: string;
  concerns: string[];
  suggestions: string[];
  responseTimeMs: number;
  error?: string;
}

export class MultiModelReviewer {
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Run reviews across all configured models in parallel
   */
  async runReviews(
    task: Task,
    record: SessionRecord
  ): Promise<ModelReviewResult[]> {
    if (!this.config.enableMultiModelReview || this.config.reviewModels.length === 0) {
      return [];
    }

    logger.info("Starting multi-model review", {
      issueId: task.issueId,
      models: this.config.reviewModels,
    });

    // Prepare the review prompt with task context
    const reviewPrompt = this.constructReviewPrompt(task, record);

    // Run all reviews in parallel
    const reviewPromises = this.config.reviewModels.map((model) =>
      this.runSingleReview(model, reviewPrompt, task)
    );

    const results = await Promise.all(reviewPromises);

    logger.info("Multi-model review completed", {
      issueId: task.issueId,
      results: results.map((r) => ({
        model: r.model,
        verdict: r.verdict,
        responseTimeMs: r.responseTimeMs,
      })),
    });

    return results;
  }

  /**
   * Run plan consensus across all models before execution
   */
  async runPlanConsensus(
    task: Task,
    plan: string
  ): Promise<ModelPlanFeedback[]> {
    if (!this.config.enableMultiModelReview || this.config.reviewModels.length === 0) {
      return [];
    }

    logger.info("Starting multi-model plan consensus", {
      issueId: task.issueId,
      models: this.config.reviewModels,
    });

    const planPrompt = this.constructPlanPrompt(task, plan);

    // Run all plan reviews in parallel
    const feedbackPromises = this.config.reviewModels.map((model) =>
      this.runSinglePlanReview(model, planPrompt, task)
    );

    const results = await Promise.all(feedbackPromises);

    logger.info("Multi-model plan consensus completed", {
      issueId: task.issueId,
      results: results.map((r) => ({
        model: r.model,
        verdict: r.verdict,
        responseTimeMs: r.responseTimeMs,
      })),
    });

    return results;
  }

  /**
   * Run a single model's plan review
   */
  private async runSinglePlanReview(
    model: string,
    prompt: string,
    task: Task
  ): Promise<ModelPlanFeedback> {
    const startTime = Date.now();

    try {
      let response: string;

      if (model === "internal") {
        response = await this.runInternalReview(prompt);
      } else {
        response = await this.runClaudishReview(model, prompt);
      }

      const result = this.parsePlanResponse(model, response, Date.now() - startTime);

      logger.badge("result", `[${model}] Plan: ${result.verdict} - ${result.feedback.slice(0, 50)}...`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Plan review failed for model ${model}`, { error: errorMessage });

      // Return with error flag - consensus counting will exclude this result
      return {
        model,
        verdict: "suggest_changes", // Placeholder - won't be counted due to error field
        feedback: `Review failed: ${errorMessage}`,
        concerns: [],
        suggestions: [],
        responseTimeMs: Date.now() - startTime,
        error: errorMessage, // This flags it as an error result
      };
    }
  }

  /**
   * Parse plan review response
   */
  private parsePlanResponse(
    model: string,
    response: string,
    responseTimeMs: number
  ): ModelPlanFeedback {
    const lowerResponse = response.toLowerCase();

    // Determine verdict
    let verdict: ModelPlanFeedback["verdict"] = "approve";
    if (lowerResponse.includes("reject") || lowerResponse.includes("do not proceed") || lowerResponse.includes("fundamentally flawed")) {
      verdict = "reject";
    } else if (lowerResponse.includes("suggest") || lowerResponse.includes("consider") || lowerResponse.includes("recommend") || lowerResponse.includes("concern")) {
      verdict = "suggest_changes";
    }

    // Extract concerns
    const concerns: string[] = [];
    const concernMatches = response.match(/concern[s]?:?\s*[-•*]?\s*(.+?)(?=\n|$)/gi) || [];
    for (const match of concernMatches.slice(0, 3)) {
      const cleaned = match.replace(/concern[s]?:?\s*[-•*]?\s*/i, "").trim();
      if (cleaned.length > 10) concerns.push(cleaned);
    }

    // Extract suggestions
    const suggestions: string[] = [];
    const lines = response.split("\n");
    for (const line of lines) {
      if ((line.toLowerCase().includes("suggest") || line.toLowerCase().includes("recommend") || line.toLowerCase().includes("should")) &&
          line.length > 15 && line.length < 250) {
        suggestions.push(line.trim());
        if (suggestions.length >= 3) break;
      }
    }

    // Get main feedback (first substantial paragraph)
    const paragraphs = response.split(/\n\n+/).filter((p) => p.trim().length > 30);
    const feedback = paragraphs[0]?.slice(0, 400) || response.slice(0, 400);

    return {
      model,
      verdict,
      feedback,
      concerns,
      suggestions,
      responseTimeMs,
    };
  }

  /**
   * Construct prompt for plan review
   */
  private constructPlanPrompt(task: Task, plan: string): string {
    return `You are reviewing an implementation plan before execution begins.

## Task
**Title:** ${task.title}
**Description:** ${task.description}

## Proposed Plan
${plan}

## Instructions
Review this plan and provide:
1. **Verdict**: APPROVE, SUGGEST_CHANGES, or REJECT
2. **Feedback**: Your overall assessment (2-3 sentences)
3. **Concerns**: Any risks or issues with this approach (if any)
4. **Suggestions**: Improvements to consider (if any)

Focus on:
- Is the plan complete and well-structured?
- Are there any security concerns?
- Is this the right approach for the task?
- Are there edge cases or risks not addressed?

Be concise and actionable.`;
  }

  /**
   * Generate formatted plan consensus report
   */
  generatePlanReport(task: Task, plan: string, results: ModelPlanFeedback[]): string {
    if (results.length === 0) return "";

    // Count verdicts
    const verdictCounts = { approve: 0, suggest_changes: 0, reject: 0 };
    for (const r of results) {
      if (r.verdict in verdictCounts) verdictCounts[r.verdict]++;
    }

    // Determine consensus
    const total = results.filter((r) => !r.error).length;
    let consensus = "🤔 Mixed";
    let consensusDetail = "Models have different opinions";

    if (verdictCounts.reject >= Math.ceil(total / 2)) {
      consensus = "❌ Rejected";
      consensusDetail = "Majority recommend not proceeding with this plan";
    } else if (verdictCounts.approve >= Math.ceil(total * 0.6)) {
      consensus = "✅ Approved";
      consensusDetail = "Majority approve the plan";
    } else if (verdictCounts.suggest_changes >= Math.ceil(total / 2)) {
      consensus = "⚠️ Approved with Suggestions";
      consensusDetail = "Plan approved but consider the suggestions below";
    }

    // Build report
    let report = `## 🎯 Multi-Model Plan Consensus\n\n`;
    report += `**Consensus:** ${consensus}\n`;
    report += `*${consensusDetail}*\n\n`;

    // Plan summary
    report += `### 📋 Proposed Plan\n\n`;
    report += `${plan.slice(0, 1500)}${plan.length > 1500 ? "..." : ""}\n\n`;

    // Model verdicts table
    report += `### 🤖 Model Verdicts\n\n`;
    report += `| Model | Verdict | Response Time |\n`;
    report += `|-------|---------|---------------|\n`;

    for (const r of results) {
      const emoji = r.verdict === "approve" ? "✅" : r.verdict === "reject" ? "❌" : "⚠️";
      const time = r.responseTimeMs < 1000
        ? `${r.responseTimeMs}ms`
        : `${(r.responseTimeMs / 1000).toFixed(1)}s`;
      report += `| ${r.model} | ${emoji} ${r.verdict} | ${time} |\n`;
    }

    // Discussion section - each model's feedback
    report += `\n### 💬 Model Discussion\n\n`;

    for (const r of results) {
      if (r.error) {
        report += `**${r.model}:** ⚡ Error - ${r.error}\n\n`;
        continue;
      }

      const emoji = r.verdict === "approve" ? "✅" : r.verdict === "reject" ? "❌" : "⚠️";
      report += `<details>\n<summary><b>${r.model}</b> ${emoji}</summary>\n\n`;
      report += `${r.feedback}\n\n`;

      if (r.concerns.length > 0) {
        report += `**Concerns:**\n`;
        for (const concern of r.concerns) {
          report += `- ${concern}\n`;
        }
        report += `\n`;
      }

      if (r.suggestions.length > 0) {
        report += `**Suggestions:**\n`;
        for (const suggestion of r.suggestions) {
          report += `- ${suggestion}\n`;
        }
        report += `\n`;
      }

      report += `</details>\n\n`;
    }

    // Aggregate suggestions if any
    const allSuggestions = results.flatMap((r) => r.suggestions).filter(Boolean);
    if (allSuggestions.length > 0) {
      report += `### 💡 Key Suggestions\n\n`;
      const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, 5);
      for (const suggestion of uniqueSuggestions) {
        report += `- ${suggestion}\n`;
      }
      report += `\n`;
    }

    // Performance
    const avgTime = results.reduce((sum, r) => sum + r.responseTimeMs, 0) / results.length;
    report += `---\n*Average response time: ${(avgTime / 1000).toFixed(1)}s*\n`;

    return report;
  }

  /**
   * Run a single model review
   */
  private async runSingleReview(
    model: string,
    prompt: string,
    task: Task
  ): Promise<ModelReviewResult> {
    const startTime = Date.now();

    try {
      let response: string;

      if (model === "internal") {
        // Use Claude directly via SDK
        response = await this.runInternalReview(prompt);
      } else {
        // Use claudish CLI for external models
        response = await this.runClaudishReview(model, prompt);
      }

      const result = this.parseReviewResponse(model, response, Date.now() - startTime);

      logger.badge("result", `[${model}] ${result.verdict}: ${result.summary.slice(0, 60)}...`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Review failed for model ${model}`, { error: errorMessage });

      return {
        model,
        verdict: "error",
        summary: `Review failed: ${errorMessage}`,
        issues: [],
        suggestions: [],
        responseTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Run review using internal Claude (via SDK)
   */
  private async runInternalReview(prompt: string): Promise<string> {
    const { query } = await import("@anthropic-ai/claude-agent-sdk");

    let response = "";

    for await (const message of query({
      prompt,
      options: {
        cwd: this.config.workingDirectory || process.cwd(),
        permissionMode: "bypassPermissions",
        model: this.config.model,
        systemPrompt: "You are a code reviewer. Analyze and provide feedback only. Do NOT make any changes to files.",
      },
    })) {
      if (message.type === "assistant") {
        const content = (message as unknown as { content?: string }).content;
        if (content) response += content;
      } else if (message.type === "result") {
        const result = (message as unknown as { result?: string }).result;
        if (result) response = result;
      }
    }

    return response;
  }

  /**
   * Run review using claudish CLI for external models
   */
  private async runClaudishReview(model: string, prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const cwd = this.config.workingDirectory || process.cwd();

      // Use claudish with the specified model
      // --print: output result and exit (single-shot mode)
      // Prompt is piped via stdin for large prompts and special character handling
      const claudish = spawn("claudish", ["-m", model, "--print"], {
        cwd,
        env: { ...process.env },
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Write prompt to stdin and close it
      claudish.stdin.write(prompt);
      claudish.stdin.end();

      let stdout = "";
      let stderr = "";

      claudish.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      claudish.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      claudish.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`claudish exited with code ${code}: ${stderr}`));
        }
      });

      claudish.on("error", (error) => {
        reject(new Error(`Failed to run claudish: ${error.message}`));
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        claudish.kill();
        reject(new Error("Review timed out after 5 minutes"));
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Parse model response into structured review result
   */
  private parseReviewResponse(
    model: string,
    response: string,
    responseTimeMs: number
  ): ModelReviewResult {
    // Extract verdict from response
    let verdict: ModelReviewResult["verdict"] = "needs_changes";

    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes("approve") || lowerResponse.includes("lgtm") || lowerResponse.includes("looks good")) {
      verdict = "approve";
    } else if (lowerResponse.includes("reject") || lowerResponse.includes("major issues") || lowerResponse.includes("critical")) {
      verdict = "reject";
    }

    // Extract issues (lines starting with - or * or numbered)
    const issueMatches = response.match(/^[\s]*[-*•]\s*(.+)$/gm) || [];
    const issues = issueMatches
      .map((m) => m.replace(/^[\s]*[-*•]\s*/, "").trim())
      .filter((i) => i.length > 10 && i.length < 200)
      .slice(0, 5);

    // Extract suggestions (look for "suggest" or "recommend")
    const suggestions: string[] = [];
    const lines = response.split("\n");
    for (const line of lines) {
      if (
        (line.toLowerCase().includes("suggest") ||
          line.toLowerCase().includes("recommend") ||
          line.toLowerCase().includes("consider")) &&
        line.length > 20 &&
        line.length < 300
      ) {
        suggestions.push(line.trim());
        if (suggestions.length >= 3) break;
      }
    }

    // Get first meaningful paragraph as summary
    const paragraphs = response.split(/\n\n+/).filter((p) => p.trim().length > 50);
    const summary = paragraphs[0]?.slice(0, 500) || response.slice(0, 500);

    return {
      model,
      verdict,
      summary,
      issues,
      suggestions,
      responseTimeMs,
    };
  }

  /**
   * Construct review prompt from task and session
   */
  private constructReviewPrompt(task: Task, record: SessionRecord): string {
    // Get the assistant's final output
    const lastAssistant = [...record.transcript]
      .reverse()
      .find((t) => t.role === "assistant");
    const taskOutput = lastAssistant?.content || "No output recorded.";

    // Get tool calls summary
    const toolCalls = record.transcript
      .filter((t) => t.role === "tool_use")
      .map((t) => `- ${t.toolName}: ${JSON.stringify(t.toolInput).slice(0, 100)}`)
      .slice(-10)
      .join("\n");

    return `You are a code reviewer. Review the following task completion and provide your assessment.

## Task
**Title:** ${task.title}
**Description:** ${task.description}

## Work Completed
${taskOutput.slice(0, 3000)}

## Recent Tool Calls
${toolCalls || "No tool calls recorded."}

## Instructions
Please provide:
1. **Verdict**: One of: APPROVE, NEEDS_CHANGES, or REJECT
2. **Summary**: Brief assessment of the work quality (2-3 sentences)
3. **Issues Found**: List any bugs, security issues, or problems (if any)
4. **Suggestions**: Recommendations for improvement (if any)

Focus on:
- Code quality and best practices
- Security vulnerabilities
- Completeness of the implementation
- Following project conventions

Be concise and direct in your assessment.`;
  }

  /**
   * Generate a formatted comparison report
   */
  generateReport(results: ModelReviewResult[]): string {
    if (results.length === 0) {
      return "";
    }

    // Count verdicts
    const verdictCounts = {
      approve: 0,
      needs_changes: 0,
      reject: 0,
      error: 0,
    };
    for (const r of results) {
      verdictCounts[r.verdict]++;
    }

    // Determine consensus
    let consensus = "Mixed";
    const total = results.filter((r) => r.verdict !== "error").length;
    if (verdictCounts.approve >= total * 0.6) consensus = "✅ Approved";
    else if (verdictCounts.reject >= total * 0.4) consensus = "❌ Rejected";
    else if (verdictCounts.needs_changes >= total * 0.5) consensus = "⚠️ Needs Changes";

    // Build report
    let report = `## 🤖 Multi-Model Review Report\n\n`;
    report += `**Consensus:** ${consensus}\n\n`;
    report += `| Model | Verdict | Time | Key Finding |\n`;
    report += `|-------|---------|------|-------------|\n`;

    for (const r of results) {
      const verdictEmoji =
        r.verdict === "approve" ? "✅" :
        r.verdict === "reject" ? "❌" :
        r.verdict === "error" ? "⚡" : "⚠️";
      const time = r.responseTimeMs < 1000
        ? `${r.responseTimeMs}ms`
        : `${(r.responseTimeMs / 1000).toFixed(1)}s`;
      const keyFinding = r.issues[0] || r.summary.slice(0, 50) || "-";

      report += `| ${r.model} | ${verdictEmoji} ${r.verdict} | ${time} | ${keyFinding.slice(0, 40)}... |\n`;
    }

    // Add detailed findings
    report += `\n### Detailed Findings\n\n`;

    for (const r of results) {
      if (r.verdict === "error") {
        report += `**${r.model}:** ⚡ Error - ${r.error}\n\n`;
        continue;
      }

      report += `<details>\n<summary><b>${r.model}</b> - ${r.verdict.toUpperCase()}</summary>\n\n`;
      report += `${r.summary}\n\n`;

      if (r.issues.length > 0) {
        report += `**Issues:**\n`;
        for (const issue of r.issues) {
          report += `- ${issue}\n`;
        }
        report += `\n`;
      }

      if (r.suggestions.length > 0) {
        report += `**Suggestions:**\n`;
        for (const suggestion of r.suggestions) {
          report += `- ${suggestion}\n`;
        }
        report += `\n`;
      }

      report += `</details>\n\n`;
    }

    // Performance summary
    const avgTime = results.reduce((sum, r) => sum + r.responseTimeMs, 0) / results.length;
    const fastestModel = results.reduce((a, b) => (a.responseTimeMs < b.responseTimeMs ? a : b));
    const slowestModel = results.reduce((a, b) => (a.responseTimeMs > b.responseTimeMs ? a : b));

    report += `### ⏱️ Performance\n\n`;
    report += `- **Fastest:** ${fastestModel.model} (${(fastestModel.responseTimeMs / 1000).toFixed(1)}s)\n`;
    report += `- **Slowest:** ${slowestModel.model} (${(slowestModel.responseTimeMs / 1000).toFixed(1)}s)\n`;
    report += `- **Average:** ${(avgTime / 1000).toFixed(1)}s\n`;

    return report;
  }
}

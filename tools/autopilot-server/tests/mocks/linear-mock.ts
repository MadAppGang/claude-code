/**
 * Mock Linear client for testing
 * Stores all interactions for verification
 */

import type { LinearClientInterface } from "../../src/services/claude-session-manager";

export interface MockComment {
  id: string;
  issueId: string;
  body: string;
  createdAt: Date;
}

export interface MockIssueUpdate {
  issueId: string;
  update: { stateId?: string; labelIds?: string[] };
  timestamp: Date;
}

export class LinearMock implements LinearClientInterface {
  private comments: Map<string, MockComment[]> = new Map();
  private issueUpdates: MockIssueUpdate[] = [];
  private issues: Map<string, MockIssue> = new Map();

  /**
   * Create a comment on an issue
   */
  async createComment(issueId: string, body: string): Promise<void> {
    const comment: MockComment = {
      id: crypto.randomUUID(),
      issueId,
      body,
      createdAt: new Date(),
    };

    const comments = this.comments.get(issueId) || [];
    comments.push(comment);
    this.comments.set(issueId, comments);
  }

  /**
   * Update an issue
   */
  async updateIssue(
    issueId: string,
    update: { stateId?: string; labelIds?: string[] }
  ): Promise<void> {
    this.issueUpdates.push({
      issueId,
      update,
      timestamp: new Date(),
    });

    // Update mock issue state if exists
    const issue = this.issues.get(issueId);
    if (issue && update.stateId) {
      issue.stateId = update.stateId;
    }
  }

  /**
   * Transition issue to a state by name
   */
  async transitionToState(issueId: string, stateName: string): Promise<void> {
    // Simulate state transition
    this.issueUpdates.push({
      issueId,
      update: { stateId: `mock-state-${stateName.toLowerCase().replace(/\s+/g, "-")}` },
      timestamp: new Date(),
    });

    const issue = this.issues.get(issueId);
    if (issue) {
      issue.stateId = stateName;
    }
  }

  // ---- Test helpers ----

  /**
   * Add a mock issue for testing
   */
  addIssue(issue: MockIssue): void {
    this.issues.set(issue.id, issue);
  }

  /**
   * Get all comments for an issue
   */
  getComments(issueId: string): MockComment[] {
    return this.comments.get(issueId) || [];
  }

  /**
   * Get all issue updates
   */
  getIssueUpdates(): MockIssueUpdate[] {
    return this.issueUpdates;
  }

  /**
   * Get a specific issue
   */
  getIssue(issueId: string): MockIssue | undefined {
    return this.issues.get(issueId);
  }

  /**
   * Check if a comment contains specific text
   */
  hasCommentContaining(issueId: string, text: string): boolean {
    const comments = this.getComments(issueId);
    return comments.some((c) => c.body.includes(text));
  }

  /**
   * Reset all mock data
   */
  reset(): void {
    this.comments.clear();
    this.issueUpdates.length = 0;
    this.issues.clear();
  }
}

export interface MockIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  stateId?: string;
}

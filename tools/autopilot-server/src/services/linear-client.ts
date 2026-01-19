/**
 * Linear API client for interacting with Linear issues
 */

import type { Config } from "../types";
import { logger } from "../utils/logger";
import type { LinearClientInterface } from "./claude-session-manager";

const LINEAR_API_URL = "https://api.linear.app/graphql";

export class LinearClient implements LinearClientInterface {
  private readonly apiKey: string;
  private readonly teamId: string;

  // Label cache: ID -> name mapping
  private labelCache: Map<string, string> = new Map();
  private labelCacheTime: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // State cache: name -> ID mapping (for quick lookups)
  private stateCache: Map<string, { id: string; type: string }> = new Map();
  private stateCacheTime: number = 0;

  constructor(config: Config) {
    this.apiKey = config.linearApiKey;
    this.teamId = config.linearTeamId;
  }

  /**
   * Initialize caches on startup
   */
  async initializeLabelCache(): Promise<void> {
    await this.refreshLabelCache();
    await this.refreshStateCache();
    logger.info("Caches initialized", {
      labels: this.labelCache.size,
      states: this.stateCache.size,
    });
  }

  /**
   * Refresh state cache from API
   */
  async refreshStateCache(): Promise<void> {
    try {
      const states = await this.getWorkflowStates();
      this.stateCache.clear();
      for (const state of states) {
        this.stateCache.set(state.name.toLowerCase(), { id: state.id, type: state.type });
      }
      this.stateCacheTime = Date.now();
      logger.debug("State cache refreshed", {
        count: this.stateCache.size,
        states: Array.from(this.stateCache.keys()),
      });
    } catch (error) {
      logger.error("Failed to refresh state cache", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get state ID by name (from cache)
   */
  getStateId(stateName: string): string | undefined {
    return this.stateCache.get(stateName.toLowerCase())?.id;
  }

  /**
   * Check if a state name matches a type (e.g., "todo", "started", "completed")
   */
  isStateType(stateName: string, type: string): boolean {
    const state = this.stateCache.get(stateName.toLowerCase());
    return state?.type?.toLowerCase() === type.toLowerCase();
  }

  /**
   * Get label name by ID (from cache)
   */
  getLabelName(labelId: string): string | undefined {
    return this.labelCache.get(labelId);
  }

  /**
   * Get label names for an array of label IDs
   */
  getLabelNames(labelIds: string[]): string[] {
    return labelIds
      .map(id => this.labelCache.get(id))
      .filter((name): name is string => !!name);
  }

  /**
   * Refresh label cache from API
   */
  async refreshLabelCache(): Promise<void> {
    const query = `
      query OrgLabels {
        organization {
          labels {
            nodes {
              id
              name
            }
          }
        }
      }
    `;

    try {
      const result = await this.request<{
        organization: { labels: { nodes: Array<{ id: string; name: string }> } };
      }>(query, {});

      if (result?.organization?.labels?.nodes) {
        this.labelCache.clear();
        for (const label of result.organization.labels.nodes) {
          this.labelCache.set(label.id, label.name);
        }
        this.labelCacheTime = Date.now();
        logger.debug("Label cache refreshed", {
          count: this.labelCache.size,
          labels: Array.from(this.labelCache.values())
        });
      }
    } catch (error) {
      logger.error("Failed to refresh label cache", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Ensure caches are fresh, refresh if stale
   */
  async ensureFreshCache(): Promise<void> {
    const now = Date.now();
    if (now - this.labelCacheTime > this.CACHE_TTL_MS) {
      await this.refreshLabelCache();
    }
    if (now - this.stateCacheTime > this.CACHE_TTL_MS) {
      await this.refreshStateCache();
    }
  }

  /**
   * Fast transition using cached state ID
   */
  async transitionToState(issueId: string, stateName: string): Promise<void> {
    const stateId = this.getStateId(stateName);
    if (!stateId) {
      // Refresh cache and try again
      await this.refreshStateCache();
      const refreshedId = this.getStateId(stateName);
      if (!refreshedId) {
        throw new Error(`State not found: ${stateName}`);
      }
      await this.updateIssue(issueId, { stateId: refreshedId });
    } else {
      await this.updateIssue(issueId, { stateId });
    }
    logger.info("Issue transitioned", { issueId, newState: stateName });
  }

  /**
   * Create a comment on an issue
   */
  async createComment(issueId: string, body: string): Promise<void> {
    const mutation = `
      mutation CreateComment($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          success
          comment {
            id
          }
        }
      }
    `;

    await this.request(mutation, { issueId, body });
    logger.debug("Comment created", { issueId, bodyLength: body.length });
  }

  /**
   * Update an issue (state, labels, etc.)
   */
  async updateIssue(
    issueId: string,
    update: { stateId?: string; labelIds?: string[] }
  ): Promise<void> {
    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            state {
              name
            }
          }
        }
      }
    `;

    const input: Record<string, unknown> = {};
    if (update.stateId) input.stateId = update.stateId;
    if (update.labelIds) input.labelIds = update.labelIds;

    await this.request(mutation, { id: issueId, input });
    logger.debug("Issue updated", { issueId, update });
  }

  /**
   * Get an issue by ID
   */
  async getIssue(issueId: string): Promise<LinearIssueDetails | null> {
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          identifier
          title
          description
          priority
          state {
            id
            name
            type
          }
          labels {
            nodes {
              id
              name
            }
          }
          assignee {
            id
            name
            email
          }
        }
      }
    `;

    const result = await this.request<{ issue: LinearIssueDetails }>(query, {
      id: issueId,
    });
    return result?.issue || null;
  }

  /**
   * Get workflow states for the team
   */
  async getWorkflowStates(): Promise<
    Array<{ id: string; name: string; type: string }>
  > {
    const query = `
      query GetStates($teamId: String!) {
        team(id: $teamId) {
          states {
            nodes {
              id
              name
              type
            }
          }
        }
      }
    `;

    const result = await this.request<{
      team: { states: { nodes: Array<{ id: string; name: string; type: string }> } };
    }>(query, { teamId: this.teamId });

    return result?.team?.states?.nodes || [];
  }

  /**
   * Transition issue to a new state by state name
   */
  async transitionIssue(
    issueId: string,
    targetStateName: string
  ): Promise<void> {
    const states = await this.getWorkflowStates();
    const targetState = states.find(
      (s) => s.name.toLowerCase() === targetStateName.toLowerCase()
    );

    if (!targetState) {
      throw new Error(`State not found: ${targetStateName}`);
    }

    await this.updateIssue(issueId, { stateId: targetState.id });
    logger.info("Issue transitioned", { issueId, newState: targetStateName });
  }

  private async request<T = unknown>(
    query: string,
    variables: Record<string, unknown>
  ): Promise<T | null> {
    if (!this.apiKey) {
      logger.warn("Linear API key not configured, skipping request");
      return null;
    }

    try {
      const response = await fetch(LINEAR_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.apiKey,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`Linear API error: ${response.status}`);
      }

      const json = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string }>;
      };

      if (json.errors?.length) {
        throw new Error(json.errors.map((e) => e.message).join(", "));
      }

      return json.data || null;
    } catch (error) {
      logger.error("Linear API request failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

interface LinearIssueDetails {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  state: { id: string; name: string; type: string };
  labels: { nodes: Array<{ id: string; name: string }> };
  assignee?: { id: string; name: string; email: string };
}

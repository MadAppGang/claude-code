#!/usr/bin/env bun
/**
 * Linear API Client for Autopilot
 *
 * Unified CLI for all Linear operations.
 *
 * Usage:
 *   bun run linear-client.ts <command> [options]
 *
 * Commands:
 *   test-connection       Test Linear API connection
 *   list-teams           List available teams
 *   get-issue            Get issue details
 *   create-issue         Create a new issue
 *   query-tasks          Query autopilot tasks
 *   transition           Transition issue state
 *   add-comment          Add comment to issue
 *   attach-files         Attach files to issue
 */

import { LinearClient } from "@linear/sdk";
import { parseArgs } from "util";

// Initialize Linear client
const linear = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY!,
});

// Parse command line arguments
const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    team: { type: "string" },
    labels: { type: "string" },
    assignee: { type: "string" },
    state: { type: "string" },
    states: { type: "string" },
    body: { type: "string" },
    files: { type: "string" },
  },
  allowPositionals: true,
});

const command = positionals[0];

// Validation helper
function requireArgs(args: Record<string, string | undefined>, required: string[]): void {
  const missing = required.filter((arg) => !args[arg]);
  if (missing.length > 0) {
    console.error(
      JSON.stringify({
        success: false,
        error: `Missing required arguments: ${missing.map((a) => `--${a}`).join(", ")}`,
        command,
      })
    );
    process.exit(1);
  }
}

async function main() {
  switch (command) {
    case "test-connection":
      await testConnection();
      break;
    case "list-teams":
      await listTeams();
      break;
    case "get-issue":
      requireArgs(values, ["id"]);
      await getIssue(values.id!);
      break;
    case "create-issue":
      requireArgs(values, ["team", "title"]);
      await createIssue(
        values.team!,
        values.title!,
        values.description || "",
        values.labels?.split(",") || [],
        values.assignee
      );
      break;
    case "query-tasks":
      requireArgs(values, ["assignee"]);
      await queryTasks(values.assignee!, values.states?.split(",") || []);
      break;
    case "transition":
      requireArgs(values, ["id", "state"]);
      await transitionState(values.id!, values.state!);
      break;
    case "add-comment":
      requireArgs(values, ["id", "body"]);
      await addComment(values.id!, values.body!);
      break;
    case "attach-files":
      requireArgs(values, ["id", "files"]);
      await attachFiles(values.id!, values.files!);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(`
Usage: bun run linear-client.ts <command> [options]

Commands:
  test-connection                    Test Linear API connection
  list-teams                         List available teams
  get-issue --id <id>                Get issue details
  create-issue --team <id> --title <title> [--description <desc>] [--labels <labels>] [--assignee <id>]
  query-tasks --assignee <id> --states <states>
  transition --id <id> --state <state>
  add-comment --id <id> --body <body>
  attach-files --id <id> --files <glob>  (NOT YET IMPLEMENTED)
      `);
      process.exit(1);
  }
}

async function testConnection(): Promise<void> {
  try {
    const viewer = await linear.viewer;
    console.log(
      JSON.stringify(
        {
          success: true,
          user: {
            id: viewer.id,
            name: viewer.name,
            email: viewer.email,
          },
        },
        null,
        2
      )
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    process.exit(1);
  }
}

async function listTeams(): Promise<void> {
  const teams = await linear.teams();
  const result = teams.nodes.map((team) => ({
    id: team.id,
    name: team.name,
    key: team.key,
  }));
  console.log(JSON.stringify(result, null, 2));
}

async function getIssue(issueId: string): Promise<void> {
  const issue = await linear.issue(issueId);

  const state = await issue.state;
  const team = await issue.team;
  const labels = await issue.labels();
  const assignee = await issue.assignee;

  console.log(
    JSON.stringify(
      {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        state: state ? { id: state.id, name: state.name } : null,
        team: team ? { id: team.id, name: team.name } : null,
        labels: labels.nodes.map((l) => ({ id: l.id, name: l.name })),
        assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
        url: issue.url,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      },
      null,
      2
    )
  );
}

async function createIssue(
  teamId: string,
  title: string,
  description: string,
  labels: string[],
  assigneeId?: string
): Promise<void> {
  // Resolve label IDs if label names provided
  const labelIds = await resolveLabelIds(teamId, labels);

  const result = await linear.createIssue({
    teamId,
    title,
    description,
    labelIds,
    assigneeId,
    priority: 2,
  });

  const issue = await result.issue;
  if (issue) {
    console.log(
      JSON.stringify(
        {
          success: true,
          id: issue.id,
          identifier: issue.identifier,
          url: issue.url,
        },
        null,
        2
      )
    );
  } else {
    console.log(JSON.stringify({ success: false, error: "Failed to create issue" }));
    process.exit(1);
  }
}

async function queryTasks(assigneeId: string, states: string[]): Promise<void> {
  const issues = await linear.issues({
    filter: {
      assignee: { id: { eq: assigneeId } },
      state: states.length > 0 ? { name: { in: states } } : undefined,
    },
    first: 50,
  });

  const result = await Promise.all(
    issues.nodes.map(async (issue) => {
      const state = await issue.state;
      const labels = await issue.labels();
      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        state: state?.name,
        labels: labels.nodes.map((l) => l.name),
        priority: issue.priority,
        createdAt: issue.createdAt,
      };
    })
  );

  console.log(JSON.stringify(result, null, 2));
}

async function transitionState(issueId: string, newStateName: string): Promise<void> {
  // Get the issue and its team
  const issue = await linear.issue(issueId);
  const team = await issue.team;

  if (!team) {
    console.log(JSON.stringify({ success: false, error: "Issue has no team" }));
    process.exit(1);
  }

  // Get workflow states for the team
  const states = await team.states();
  const targetState = states.nodes.find(
    (s) => s.name.toLowerCase() === newStateName.toLowerCase()
  );

  if (!targetState) {
    const availableStates = states.nodes.map((s) => s.name).join(", ");
    console.log(
      JSON.stringify({
        success: false,
        error: `State "${newStateName}" not found. Available: ${availableStates}`,
      })
    );
    process.exit(1);
  }

  // Update the issue state
  await linear.updateIssue(issueId, {
    stateId: targetState.id,
  });

  const currentState = await issue.state;
  console.log(
    JSON.stringify({
      success: true,
      previousState: currentState?.name,
      newState: targetState.name,
    })
  );
}

async function addComment(issueId: string, body: string): Promise<void> {
  const result = await linear.createComment({
    issueId,
    body,
  });

  const comment = await result.comment;
  console.log(
    JSON.stringify({
      success: true,
      commentId: comment?.id,
    })
  );
}

// TODO: File attachment not yet implemented
// Requires implementing:
// 1. Resolving the glob pattern
// 2. Uploading each file via linear.fileUpload()
// 3. Creating attachments via linear.attachmentCreate()
// See Linear API docs: https://developers.linear.app/docs/sdk/file-uploads
async function attachFiles(issueId: string, filesGlob: string): Promise<void> {
  console.log(
    JSON.stringify({
      success: false,
      error: "File attachment not yet implemented. Use Linear web UI to attach files manually.",
      issueId,
      filesGlob,
    })
  );
  process.exit(1);
}

async function resolveLabelIds(teamId: string, labelNames: string[]): Promise<string[]> {
  if (labelNames.length === 0) return [];

  const team = await linear.team(teamId);
  const labels = await team.labels();

  const labelIds: string[] = [];
  for (const name of labelNames) {
    const label = labels.nodes.find(
      (l) => l.name.toLowerCase() === name.toLowerCase()
    );
    if (label) {
      labelIds.push(label.id);
    }
  }

  return labelIds;
}

// Run main
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

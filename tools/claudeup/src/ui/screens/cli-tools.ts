import blessed from 'neo-blessed';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import type { AppState } from '../app.js';
import { createHeader, createFooter, showMessage, showLoading } from '../app.js';
import { cliTools, type CliTool } from '../../data/cli-tools.js';

const execAsync = promisify(exec);

interface ToolStatus {
  tool: CliTool;
  installed: boolean;
  installedVersion?: string;
  latestVersion?: string;
  hasUpdate?: boolean;
  checking: boolean;
}

// Session-level cache for tool statuses (persists until explicit refresh)
let cachedToolStatuses: ToolStatus[] | null = null;
let cacheInitialized = false;

export function clearCliToolsCache(): void {
  cachedToolStatuses = null;
  cacheInitialized = false;
}

function parseVersion(versionOutput: string): string | undefined {
  // Extract version number from various formats like "v1.2.3", "1.2.3", "aider 0.82.0"
  const match = versionOutput.match(/v?(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
  return match ? match[1] : undefined;
}

async function isInstalledViaHomebrew(toolName: string): Promise<boolean> {
  try {
    // Get list of installed Homebrew formulas (no shell interpolation for safety)
    const { stdout } = await execAsync('brew list --formula 2>/dev/null', {
      timeout: 2000,
      shell: '/bin/bash',
    });
    // Programmatic matching instead of shell grep to avoid injection risk
    const formulas = stdout.trim().split('\n');
    return formulas.some((f) => f.trim() === toolName);
  } catch {
    return false;
  }
}

async function getInstalledVersion(tool: CliTool): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync(tool.checkCommand, { timeout: 5000 });
    return parseVersion(stdout.trim());
  } catch {
    return undefined;
  }
}

async function getLatestNpmVersion(packageName: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} version 2>/dev/null`, { timeout: 10000 });
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

async function getLatestPipVersion(packageName: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync(`pip index versions ${packageName} 2>/dev/null | head -1`, {
      timeout: 10000,
      shell: '/bin/bash',
    });
    const match = stdout.trim().match(/\(([^)]+)\)/);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

async function getLatestVersion(tool: CliTool): Promise<string | undefined> {
  if (tool.packageManager === 'npm') {
    return getLatestNpmVersion(tool.packageName);
  } else {
    return getLatestPipVersion(tool.packageName);
  }
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(/[-.]/).map((p) => parseInt(p, 10) || 0);
  const parts2 = v2.split(/[-.]/).map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

export async function createCliToolsScreen(state: AppState): Promise<void> {
  createHeader(state, 'CLI Tools');

  // Use cached tool statuses if available, otherwise initialize
  const toolStatuses: ToolStatus[] = cachedToolStatuses || cliTools.map((tool) => ({
    tool,
    installed: false,
    installedVersion: undefined,
    checking: true,
  }));

  // Store reference for caching
  if (!cachedToolStatuses) {
    cachedToolStatuses = toolStatuses;
  }

  // Build list items
  const buildListItems = (): string[] => {
    return toolStatuses.map((status) => {
      let icon: string;
      let versionInfo = '';
      let badge = '';

      if (!status.installed) {
        icon = '{gray-fg}○{/gray-fg}';
        if (status.checking) {
          badge = ' {gray-fg}...{/gray-fg}';
        } else if (status.latestVersion) {
          versionInfo = ` {gray-fg}v${status.latestVersion}{/gray-fg}`;
        }
      } else if (status.checking) {
        icon = '{green-fg}●{/green-fg}';
        versionInfo = ` {green-fg}v${status.installedVersion}{/green-fg}`;
        badge = ' {gray-fg}...{/gray-fg}';
      } else if (status.hasUpdate) {
        icon = '{yellow-fg}↑{/yellow-fg}';
        versionInfo = ` {yellow-fg}v${status.installedVersion}{/yellow-fg}`;
        badge = ` {cyan-fg}→ v${status.latestVersion}{/cyan-fg}`;
      } else {
        icon = '{green-fg}●{/green-fg}';
        versionInfo = ` {green-fg}v${status.installedVersion}{/green-fg}`;
        badge = ' {cyan-fg}(up-to-date){/cyan-fg}';
      }

      return `${icon} {bold}${status.tool.displayName}{/bold}${versionInfo}${badge}`;
    });
  };

  // List
  const list = blessed.list({
    parent: state.screen,
    top: 3,
    left: 2,
    width: '50%-2',
    height: '100%-5',
    items: buildListItems(),
    keys: true,
    vi: false,
    mouse: true,
    tags: true,
    scrollable: true,
    border: { type: 'line' },
    style: {
      selected: { bg: 'magenta', fg: 'white' },
      border: { fg: 'gray' },
    },
    scrollbar: { ch: '|', style: { bg: 'gray' } },
    label: ' AI Coding Tools ',
  });

  // Detail panel
  const detailBox = blessed.box({
    parent: state.screen,
    top: 3,
    right: 2,
    width: '50%-2',
    height: '100%-5',
    content: '',
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: 'gray' } },
    label: ' Details ',
  });

  // Update detail panel
  const updateDetail = (): void => {
    const selected = list.selected as number;
    const status = toolStatuses[selected];
    if (!status) return;

    const { tool, installed, installedVersion, latestVersion, hasUpdate, checking } = status;

    let statusText: string;
    if (!installed) {
      statusText = '{gray-fg}Not installed{/gray-fg}';
    } else if (checking) {
      statusText = '{green-fg}Installed{/green-fg} {gray-fg}(checking for updates...){/gray-fg}';
    } else if (hasUpdate) {
      statusText = '{yellow-fg}Update available{/yellow-fg}';
    } else {
      statusText = '{green-fg}Up to date{/green-fg}';
    }

    let versionText = '';
    if (installedVersion) {
      versionText += `{bold}Installed:{/bold} {green-fg}v${installedVersion}{/green-fg}\n`;
    }
    if (latestVersion) {
      versionText += `{bold}Latest:{/bold} {cyan-fg}v${latestVersion}{/cyan-fg}\n`;
    } else if (checking) {
      versionText += `{bold}Latest:{/bold} {gray-fg}checking...{/gray-fg}\n`;
    }

    let actionText: string;
    if (!installed) {
      actionText = '{green-fg}Press Enter to install{/green-fg}';
    } else if (hasUpdate) {
      actionText = '{yellow-fg}Press Enter to update{/yellow-fg}';
    } else {
      actionText = '{gray-fg}Press Enter to reinstall{/gray-fg}';
    }

    const content = `
{bold}{cyan-fg}${tool.displayName}{/cyan-fg}{/bold}

${tool.description}

{bold}Status:{/bold} ${statusText}
${versionText}
{bold}Install:{/bold}
{gray-fg}${tool.installCommand}{/gray-fg}

{bold}Website:{/bold}
{cyan-fg}${tool.website}{/cyan-fg}

${actionText}
    `.trim();

    detailBox.setContent(content);
    state.screen.render();
  };

  list.on('select item', updateDetail);
  setTimeout(updateDetail, 0);

  // Refresh list display
  const refreshList = (): void => {
    const items = buildListItems();
    for (let i = 0; i < items.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (list as any).setItem(i, items[i]);
    }
    updateDetail();
    state.screen.render();
  };

  // Fetch all version info asynchronously
  const fetchVersionInfo = async (): Promise<void> => {
    // First, check installed versions in parallel (fast, local)
    const installedChecks = toolStatuses.map(async (status) => {
      const installed = await getInstalledVersion(status.tool);
      status.installedVersion = installed;
      status.installed = installed !== undefined;
      refreshList();
    });

    // Don't wait for all installed checks - start fetching latest versions immediately
    // This runs both in parallel for maximum speed
    const latestChecks = toolStatuses.map(async (status) => {
      try {
        const latest = await getLatestVersion(status.tool);
        status.latestVersion = latest;
        status.checking = false;
        if (status.installedVersion && latest) {
          status.hasUpdate = compareVersions(status.installedVersion, latest) < 0;
        }
      } catch {
        status.checking = false;
      }
      refreshList();
    });

    // Wait for all to complete
    await Promise.all([...installedChecks, ...latestChecks]);
  };

  // Start async version fetching only if not already cached
  if (!cacheInitialized) {
    cacheInitialized = true;
    fetchVersionInfo();
  }

  // Install/Update on Enter - with Homebrew detection
  list.on('select', async (_item: unknown, index: number) => {
    const status = toolStatuses[index];
    if (!status) return;

    const { tool, installed, hasUpdate } = status;
    const action = !installed ? 'Installing' : hasUpdate ? 'Updating' : 'Reinstalling';

    // Detect installation method for existing installations
    const viaHomebrew = installed ? await isInstalledViaHomebrew(tool.name) : false;

    // Choose appropriate command
    let command: string;
    if (!installed) {
      // New installations always use npm
      command = tool.installCommand;
    } else if (viaHomebrew) {
      // Homebrew-installed tools use brew upgrade
      command = `brew upgrade ${tool.name}`;
    } else {
      // npm-installed tools use npm install -g (handles updates)
      command = tool.installCommand;
    }

    const loading = showLoading(state, `${action} ${tool.displayName}...`);

    try {
      execSync(command, {
        encoding: 'utf-8',
        stdio: 'inherit',
        shell: '/bin/bash',
      });
    } catch (error) {
      loading.stop();
      // Keep error messages - critical for user to see failures
      await showMessage(
        state,
        'Error',
        `Failed to ${action.toLowerCase()} ${tool.displayName}.\n\nTry running manually:\n${command}`,
        'error'
      );
      return; // Don't refresh on error
    }

    loading.stop();
    // Success: immediate refresh, no confirmation needed
    clearCliToolsCache();
    createCliToolsScreen(state);
  });

  // Navigation
  list.key(['j'], () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (list as any).down();
    state.screen.render();
  });
  list.key(['k'], () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (list as any).up();
    state.screen.render();
  });

  // Refresh - clear cache and reload
  list.key(['r'], () => {
    clearCliToolsCache();
    createCliToolsScreen(state);
  });

  // Update all - with Homebrew detection, no confirmations
  list.key(['a'], async () => {
    const updatable = toolStatuses.filter((s) => s.hasUpdate);
    if (updatable.length === 0) {
      return; // Silent no-op if all up-to-date
    }

    const loading = showLoading(state, `Updating ${updatable.length} tool(s)...`);

    for (const status of updatable) {
      // Detect installation method per tool
      const viaHomebrew = await isInstalledViaHomebrew(status.tool.name);
      const command = viaHomebrew
        ? `brew upgrade ${status.tool.name}`
        : status.tool.installCommand;

      try {
        execSync(command, {
          encoding: 'utf-8',
          stdio: 'inherit',
          shell: '/bin/bash',
        });
      } catch {
        // Continue with other updates (silent failure)
      }
    }

    loading.stop();
    clearCliToolsCache();
    createCliToolsScreen(state);
  });

  // Legend
  blessed.box({
    parent: state.screen,
    bottom: 1,
    right: 2,
    width: 55,
    height: 1,
    content: '{green-fg}●{/green-fg} Up-to-date  {yellow-fg}↑{/yellow-fg} Update available  {gray-fg}○{/gray-fg} Not installed',
    tags: true,
  });

  createFooter(state, '↑↓ Navigate │ Enter Install/Update │ a Update All │ r Refresh │ q Back');

  list.focus();
  state.screen.render();
}

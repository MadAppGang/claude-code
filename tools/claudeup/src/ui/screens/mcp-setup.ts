import blessed from 'neo-blessed';
import type { AppState } from '../app.js';
import {
  createHeader,
  createFooter,
  showMessage,
  showConfirm,
  showInput,
} from '../app.js';
import {
  getMcpServersByCategory,
  getCategoryDisplayName,
  categoryOrder,
  getAllMcpServers,
} from '../../data/mcp-servers.js';
import { searchMcpServers } from '../../services/mcp-registry.js';
import {
  addMcpServer,
  removeMcpServer,
  getInstalledMcpServers,
  getEnabledMcpServers,
  setAllowMcp,
} from '../../services/claude-settings.js';
import type { McpServer, McpServerConfig, McpRegistryServer } from '../../types/index.js';

// Search results screen
export async function createMcpSearchScreen(state: AppState, query: string): Promise<void> {
  createHeader(state, 'MCP Servers');

  const installedServers = await getInstalledMcpServers(state.projectPath);
  const enabledServers = await getEnabledMcpServers(state.projectPath);
  const allServers = getAllMcpServers();

  // Search both local and remote sources
  const q = query.toLowerCase();

  // Search local curated servers
  const localFilteredServers = allServers.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    (s.category && s.category.toLowerCase().includes(q))
  );

  // Search remote MCP registry
  let remoteServers: McpRegistryServer[] = [];
  let remoteError = null;
  try {
    const response = await searchMcpServers({ query, limit: 50 });
    remoteServers = response.servers || [];
  } catch (err) {
    // Remote search failed, will show local results only
    remoteError = err;
    remoteServers = [];
  }

  // Combine and deduplicate results (prioritize local/curated)
  const allResults = new Map<string, { server: McpServer; source: 'local' | 'remote' }>();

  // Add local results first (they have more metadata)
  for (const server of localFilteredServers) {
    allResults.set(server.name, { server, source: 'local' });
  }

  // Add remote results, converting McpRegistryServer to McpServer format
  for (const remote of remoteServers) {
    if (!allResults.has(remote.name)) {
      // Convert remote server to our format
      const convertedServer: McpServer = {
        name: remote.name,
        description: remote.short_description || 'No description',
        type: 'http',
        url: remote.url,
        category: 'productivity', // Default category for remote servers
        requiresConfig: false,
      };
      allResults.set(remote.name, { server: convertedServer, source: 'remote' });
    }
  }

  const combinedResults = Array.from(allResults.values());

  const localCount = localFilteredServers.length;
  let searchInfo = `${combinedResults.length} found`;

  if (localCount > 0) {
    searchInfo += ` ({cyan-fg}${localCount} local{/cyan-fg})`;
  }

  if (remoteError) {
    searchInfo += ` | {red-fg}Remote search failed{/red-fg}`;
  }

  // Search header
  blessed.box({
    parent: state.screen,
    top: 3,
    left: 2,
    width: '50%-2',
    height: 3,
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: 'green' } },
    label: ' 🔍 Search Results ',
    content: `{white-fg}${query}{/white-fg} {gray-fg}(${searchInfo}){/gray-fg}`,
  });

  // Build list items
  const listItems = combinedResults.map(({ server, source }) => {
    const isInstalled = installedServers[server.name] !== undefined;
    const isEnabled = enabledServers[server.name] === true;

    let status = '{gray-fg}○{/gray-fg}';
    if (isInstalled && isEnabled) {
      status = '{green-fg}●{/green-fg}';
    } else if (isInstalled) {
      status = '{yellow-fg}●{/yellow-fg}';
    }

    return {
      label: `${status} {bold}${server.name}{/bold}`,
      server,
      source,
    };
  });

  if (listItems.length === 0) {
    listItems.push({
      label: '{gray-fg}No servers match your search{/gray-fg}',
      server: undefined as unknown as McpServer,
      source: 'local' as const,
    });
  }

  const listLabels = listItems.map((item) => item.label);

  const list = blessed.list({
    parent: state.screen,
    top: 6,
    left: 2,
    width: '50%-2',
    height: '100%-9',
    items: listLabels,
    keys: true,
    mouse: true,
    tags: true,
    scrollable: true,
    border: { type: 'line' },
    style: {
      selected: { bg: 'green', fg: 'white' },
      border: { fg: 'gray' },
    },
  });

  // Detail panel
  const detailBox = blessed.box({
    parent: state.screen,
    top: 3,
    right: 2,
    width: '50%-2',
    height: '100%-5',
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: 'gray' } },
    label: ' Details ',
  });

  const updateDetail = (): void => {
    const selected = list.selected as number;
    const item = listItems[selected];

    if (!item?.server) {
      detailBox.setContent('{gray-fg}No server selected{/gray-fg}');
      state.screen.render();
      return;
    }

    const server = item.server;
    const isInstalled = installedServers[server.name] !== undefined;
    const sourceTag = item.source === 'remote' ? '\n{bold}Source:{/bold} {cyan-fg}MCP Registry{/cyan-fg}' : '';

    detailBox.setContent(`
{bold}{cyan-fg}${server.name}{/cyan-fg}{/bold}

${server.description}
${sourceTag}

${isInstalled
  ? '{red-fg}Press Enter to remove{/red-fg}'
  : '{green-fg}Press Enter to install{/green-fg}'}
    `.trim());
    state.screen.render();
  };

  list.on('select item', updateDetail);
  setTimeout(updateDetail, 0);

  // Handle selection
  list.on('select', async (_item: unknown, index: number) => {
    const item = listItems[index];
    if (!item?.server) return;

    const server = item.server;
    const isInstalled = installedServers[server.name] !== undefined;

    if (isInstalled) {
      const remove = await showConfirm(state, `Remove ${server.name}?`, 'Remove MCP server?');
      if (remove) {
        await removeMcpServer(server.name, state.projectPath);
        await showMessage(state, 'Removed', `${server.name} removed.`, 'success');
        createMcpSearchScreen(state, query);
      }
    } else {
      await installMcpServer(state, server);
      createMcpSearchScreen(state, query);
    }
  });

  // Back to main MCP screen
  list.key(['escape', 'q'], () => {
    createMcpScreen(state);
  });

  // New search
  list.key(['/'], async () => {
    const newQuery = await showInput(state, '🔍 Search', 'Search MCP servers:', query);
    if (newQuery !== null && newQuery.trim()) {
      createMcpSearchScreen(state, newQuery);
    }
  });

  createFooter(state, '↑↓ Navigate │ Enter Install/Remove │ / New Search │ Esc Back');

  list.focus();
  state.screen.render();
}

// Main MCP screen (no search filtering)
export async function createMcpScreen(state: AppState): Promise<void> {
  createHeader(state, 'MCP Servers');

  const installedServers = await getInstalledMcpServers(state.projectPath);
  const enabledServers = await getEnabledMcpServers(state.projectPath);
  const serversByCategory = getMcpServersByCategory();

  // Search box - just shows hint
  blessed.box({
    parent: state.screen,
    top: 3,
    left: 2,
    width: '50%-2',
    height: 3,
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: 'cyan' } },
    label: ' 🔍 Search ',
    content: '{gray-fg}Press / to search...{/gray-fg}',
  });

  // Build list items with categories
  type ListItem = { label: string; server?: McpServer; isCategory?: boolean };
  const listItems: ListItem[] = [];

  for (const category of categoryOrder) {
    const servers = serversByCategory[category];
    if (!servers || servers.length === 0) continue;

    listItems.push({
      label: `{bold}{cyan-fg}${getCategoryDisplayName(category)}{/cyan-fg}{/bold}`,
      isCategory: true,
    });

    for (const server of servers) {
      const isInstalled = installedServers[server.name] !== undefined;
      const isEnabled = enabledServers[server.name] === true;

      let status = '{gray-fg}○{/gray-fg}';
      if (isInstalled && isEnabled) {
        status = '{green-fg}●{/green-fg}';
      } else if (isInstalled) {
        status = '{yellow-fg}●{/yellow-fg}';
      }

      const configTag = server.requiresConfig ? ' {yellow-fg}*{/yellow-fg}' : '';

      listItems.push({
        label: `  ${status} {bold}${server.name}{/bold}${configTag}`,
        server,
      });
    }
  }

  const list = blessed.list({
    parent: state.screen,
    top: 6,
    left: 2,
    width: '50%-2',
    height: '100%-9',
    items: listItems.map((item) => item.label),
    keys: true,
    mouse: true,
    tags: true,
    scrollable: true,
    border: { type: 'line' },
    style: {
      selected: { bg: 'blue', fg: 'white' },
      border: { fg: 'gray' },
    },
    scrollbar: { ch: '|', style: { bg: 'gray' } },
  });

  // Detail panel on the right
  const detailBox = blessed.box({
    parent: state.screen,
    top: 3,
    right: 2,
    width: '50%-2',
    height: '100%-5',
    content: '',
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: 'gray',
      },
    },
    label: ' Details ',
  });

  // Update detail panel on selection change
  const updateDetail = (): void => {
    const selected = list.selected as number;
    const item = listItems[selected];

    if (!item || item.isCategory || !item.server) {
      detailBox.setContent('{gray-fg}Select a server to see details{/gray-fg}');
      state.screen.render();
      return;
    }

    const server = item.server;
    const isInstalled = installedServers[server.name] !== undefined;
    const isEnabled = enabledServers[server.name] === true;

    let statusText = '{gray-fg}Not installed{/gray-fg}';
    if (isInstalled && isEnabled) {
      statusText = '{green-fg}● Installed & Enabled{/green-fg}';
    } else if (isInstalled) {
      statusText = '{yellow-fg}● Installed (disabled){/yellow-fg}';
    }

    let typeInfo = '';
    if (server.type === 'http') {
      typeInfo = `{bold}URL:{/bold} {cyan-fg}${server.url}{/cyan-fg}`;
    } else {
      typeInfo = `{bold}Command:{/bold} {cyan-fg}${server.command} ${(server.args || []).join(' ')}{/cyan-fg}`;
    }

    let configInfo = '';
    if (server.requiresConfig && server.configFields) {
      configInfo = `\n\n{bold}Configuration:{/bold}\n`;
      for (const field of server.configFields) {
        const req = field.required ? '{red-fg}*{/red-fg}' : '';
        configInfo += `  ${req} ${field.label}\n`;
      }
    }

    const content = `
{bold}{cyan-fg}${server.name}{/cyan-fg}{/bold}

${server.description}

{bold}Status:{/bold} ${statusText}

${typeInfo}${configInfo}

${isInstalled
  ? '{red-fg}Press Enter to remove{/red-fg}'
  : '{green-fg}Press Enter to install{/green-fg}'}
    `.trim();

    detailBox.setContent(content);
    state.screen.render();
  };

  list.on('select item', updateDetail);

  // Initial update
  setTimeout(updateDetail, 0);

  // Handle selection
  list.on('select', async (_item: unknown, index: number) => {
    const selected = listItems[index];
    if (!selected || selected.isCategory || !selected.server) {
      return;
    }

    const server = selected.server;
    const isInstalled = installedServers[server.name] !== undefined;

    if (isInstalled) {
      const remove = await showConfirm(
        state,
        `Remove ${server.name}?`,
        'This will remove the MCP server configuration.'
      );

      if (remove) {
        await removeMcpServer(server.name, state.projectPath);
        await showMessage(state, 'Removed', `${server.name} has been removed.`, 'success');
        createMcpScreen(state);
      }
    } else {
      await installMcpServer(state, server);
    }
  });

  // Manual j/k navigation (since vi mode is disabled)
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

  // Search with / key - opens search screen
  list.key(['/'], async () => {
    const query = await showInput(state, '🔍 Search', 'Search MCP servers:');
    if (query !== null && query.trim()) {
      createMcpSearchScreen(state, query);
    }
  });

  // Switch to registry search with r
  list.key(['r'], async () => {
    const { navigateTo } = await import('../app.js');
    navigateTo(state, 'mcp-registry');
  });

  createFooter(
    state,
    '↑↓ Navigate │ Enter Install/Remove │ / Search │ r Registry │ q Back'
  );

  list.focus();
  state.screen.render();
}

async function installMcpServer(state: AppState, server: McpServer): Promise<void> {
  let config: McpServerConfig;

  if (server.type === 'http') {
    // HTTP-based MCP server
    config = {
      type: 'http',
      url: server.url!,
    };
  } else {
    // Command-based MCP server
    config = {
      command: server.command!,
      args: server.args ? [...server.args] : undefined,
      env: server.env ? { ...server.env } : undefined,
    };
  }

  // Collect configuration if required
  if (server.requiresConfig && server.configFields) {
    for (const field of server.configFields) {
      const value = await showInput(
        state,
        `Configure ${server.name}`,
        `${field.label}${field.required ? ' (required)' : ''}:`,
        field.default
      );

      if (value === null) {
        // User cancelled
        return;
      }

      if (field.required && !value) {
        await showMessage(
          state,
          'Required Field',
          `${field.label} is required.`,
          'error'
        );
        return;
      }

      if (value) {
        // Replace placeholder in args
        if (config.args) {
          config.args = config.args.map((arg) =>
            arg.replace(`\${${field.name}}`, value)
          );
        }

        // Replace placeholder in env or add new env var
        if (field.envVar) {
          config.env = config.env || {};
          config.env[field.envVar] = value;
        }
      }
    }
  }

  // Enable MCP and add server
  await setAllowMcp(true, state.projectPath);
  await addMcpServer(server.name, config, state.projectPath);

  await showMessage(
    state,
    'Installed',
    `${server.name} has been configured.\n\nRestart Claude Code to activate.`,
    'success'
  );

  createMcpScreen(state);
}

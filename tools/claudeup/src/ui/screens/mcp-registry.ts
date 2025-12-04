import blessed from 'neo-blessed';
import type { AppState } from '../app.js';
import {
  createHeader,
  createFooter,
  showMessage,
} from '../app.js';
import {
  searchMcpServers,
  formatDate,
} from '../../services/mcp-registry.js';
import {
  addMcpServer,
  setAllowMcp,
} from '../../services/claude-settings.js';
import type { McpRegistryServer, McpServerConfig } from '../../types/index.js';

interface RegistryState {
  servers: McpRegistryServer[];
  error: string | null;
  loaded: boolean;
}

export async function createMcpRegistryScreen(
  state: AppState,
  initialSearch: string = '',
  registryState?: RegistryState
): Promise<void> {
  createHeader(state, 'MCP Registry');

  let searchQuery = initialSearch;
  let servers = registryState?.servers || [];
  const error = registryState?.error || null;
  const loaded = registryState?.loaded || false;
  let searchTimeout: NodeJS.Timeout | null = null;

  // Search box
  const searchBox = blessed.box({
    parent: state.screen,
    top: 3,
    left: 2,
    width: '50%-2',
    height: 3,
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: 'cyan',
      },
    },
    label: ' 🌐 MCP Registry ',
  });

  const updateSearchBox = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const box = searchBox as any;
    if (state.isSearching) {
      searchBox.setContent(`{white-fg}${searchQuery}{/white-fg}{inverse} {/inverse}`);
      box.style.border.fg = 'green';
    } else if (searchQuery) {
      searchBox.setContent(`{white-fg}${searchQuery}{/white-fg}`);
      box.style.border.fg = 'magenta';
    } else {
      searchBox.setContent('{gray-fg}Press / to search...{/gray-fg}');
      box.style.border.fg = 'magenta';
    }
  };
  updateSearchBox();

  // Build list items from servers
  const buildListItems = (): string[] => {
    if (!loaded) {
      return ['{gray-fg}Loading...{/gray-fg}'];
    } else if (error) {
      return [`{red-fg}Error: ${error}{/red-fg}`];
    } else if (servers.length === 0) {
      return ['{gray-fg}No servers found{/gray-fg}'];
    } else {
      return servers.map((server) => {
        const version = server.version ? `{green-fg}v${server.version}{/green-fg}` : '';
        return `{bold}${server.name}{/bold} ${version}`;
      });
    }
  };

  // List
  const list = blessed.list({
    parent: state.screen,
    top: 6,
    left: 2,
    width: '50%-2',
    height: '100%-9',
    items: buildListItems(),
    keys: true,
    vi: false,
    mouse: true,
    tags: true,
    scrollable: true,
    border: {
      type: 'line',
    },
    style: {
      selected: {
        bg: 'magenta',
        fg: 'white',
      },
      border: {
        fg: 'gray',
      },
    },
    scrollbar: {
      ch: '|',
      style: {
        bg: 'gray',
      },
    },
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
    const server = servers[selected];

    if (!server) {
      detailBox.setContent('{gray-fg}Select a server to see details{/gray-fg}');
      state.screen.render();
      return;
    }

    const dateDisplay = server.published_at
      ? `{cyan-fg}${formatDate(server.published_at)}{/cyan-fg}`
      : '{gray-fg}unknown{/gray-fg}';

    const versionDisplay = server.version
      ? `{green-fg}v${server.version}{/green-fg}`
      : '{gray-fg}unknown{/gray-fg}';

    const content = `
{bold}{magenta-fg}${server.name}{/magenta-fg}{/bold}

${server.short_description}

{bold}Version:{/bold} ${versionDisplay}
{bold}Published:{/bold} ${dateDisplay}

{bold}URL:{/bold}
{cyan-fg}${server.url}{/cyan-fg}
${server.source_code_url ? `\n{bold}Source:{/bold}\n{gray-fg}${server.source_code_url}{/gray-fg}` : ''}

{green-fg}Press Enter to install{/green-fg}
    `.trim();

    detailBox.setContent(content);
    state.screen.render();
  };

  list.on('select item', updateDetail);

  // Initial detail update
  setTimeout(updateDetail, 0);

  // Load servers function with debounce
  const loadServers = async (query: string): Promise<void> => {
    try {
      const response = await searchMcpServers({
        query,
        limit: 50,
      });

      // Validate response structure
      if (!response || !Array.isArray(response.servers)) {
        throw new Error('Invalid response from MCP Registry API');
      }

      servers = response.servers;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (list as any).setItems(buildListItems());
      state.screen.render();
      setTimeout(updateDetail, 0);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load servers';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (list as any).setItems([`{red-fg}Error: ${errorMsg}{/red-fg}`]);
      state.screen.render();
    }
  };

  // Debounced search
  const debouncedSearch = (query: string): void => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      // Ensure we're still in the MCP registry screen and in search mode
      if (state.isSearching && state.currentScreen === 'mcp') {
        loadServers(query);
      }
    }, 300);
  };

  // Handle selection - install server
  list.on('select', async (_item: unknown, index: number) => {
    if (state.isSearching) return; // Don't install while searching
    const server = servers[index];
    if (!server) return;

    const config: McpServerConfig = {
      type: 'http',
      url: server.url,
    };

    await setAllowMcp(true, state.projectPath);
    await addMcpServer(server.name, config, state.projectPath);

    await showMessage(
      state,
      'Installed',
      `${server.name} has been configured.\n\nRestart Claude Code to activate.`,
      'success'
    );

    createMcpRegistryScreen(state, searchQuery, {
      servers,
      error: null,
      loaded: true,
    });
  });

  // Create a search input box that grabs focus during search
  // Use textbox instead of box to properly capture all keyboard input
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchInput = blessed.textbox({
    parent: state.screen,
    top: 3,
    left: 2,
    width: '50%-2',
    height: 3,
    hidden: true,
    input: true,
    keys: true,
  } as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchInputAny = searchInput as any;

  const startSearch = (): void => {
    state.isSearching = true;
    updateSearchBox();
    searchInputAny.show();
    searchInput.focus();
    // Clear and set initial value
    searchInput.setValue(searchQuery || '');
    state.screen.render();
  };

  const endSearch = (): void => {
    state.isSearching = false;
    updateSearchBox();
    searchInputAny.hide();
    list.focus();
    state.screen.render();
  };

  // Update search when text changes
  let lastSearchValue = searchQuery;
  const updateSearchFromInput = (): void => {
    const value = searchInput.getValue() || '';
    if (value !== lastSearchValue) {
      lastSearchValue = value;
      searchQuery = value;
      updateSearchBox();
      debouncedSearch(searchQuery);
    }
  };

  // Handle text changes in the textbox
  searchInput.on('keypress', () => {
    // Use setImmediate to get the updated value after the key is processed
    setImmediate(updateSearchFromInput);
  });

  // Handle submit and cancel
  searchInput.on('submit', () => {
    endSearch();
  });

  searchInput.key(['escape'], () => {
    endSearch();
    return false; // Prevent propagation
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

  // Start search with / key
  list.key(['/'], startSearch);

  // Clear search with Ctrl+U
  list.key(['C-u'], () => {
    if (searchQuery) {
      searchQuery = '';
      updateSearchBox();
      loadServers('');
    }
  });

  // Refresh with R
  list.key(['R'], () => {
    createMcpRegistryScreen(state, searchQuery);
  });

  // Switch to local MCP list with l
  list.key(['l'], async () => {
    const { createMcpScreen } = await import('./mcp-setup.js');
    createMcpScreen(state);
  });

  // Attribution
  blessed.box({
    parent: state.screen,
    bottom: 1,
    right: 2,
    width: 28,
    height: 1,
    content: '{gray-fg}Powered by {/gray-fg}{cyan-fg}MCP Registry{/cyan-fg}',
    tags: true,
  });

  createFooter(
    state,
    '↑↓ Navigate │ Enter Install │ / Search │ Ctrl+U Clear │ l Local │ q Back'
  );

  list.focus();
  state.screen.render();

  // Initial load if not loaded yet
  if (!loaded) {
    loadServers(searchQuery);
  }
}

import blessed from 'neo-blessed';
import type { AppState } from '../app.js';
import { createHeader, createFooter, showMessage, showProgress, hideProgress, showLoading, navigateTo } from '../app.js';
import { getAllMarketplaces } from '../../data/marketplaces.js';
import {
  addMarketplace,
  removeMarketplace,
  getConfiguredMarketplaces,
  enablePlugin,
  addGlobalMarketplace,
  removeGlobalMarketplace,
  getGlobalConfiguredMarketplaces,
  enableGlobalPlugin,
  saveGlobalInstalledPluginVersion,
  removeGlobalInstalledPluginVersion,
} from '../../services/claude-settings.js';
import {
  saveInstalledPluginVersion,
  removeInstalledPluginVersion,
  getAvailablePlugins,
  getGlobalAvailablePlugins,
  getLocalMarketplacesInfo,
  refreshAllMarketplaces,
  type PluginInfo,
} from '../../services/plugin-manager.js';

import type { Marketplace } from '../../types/index.js';

interface ListItem {
  label: string;
  type: 'marketplace' | 'plugin' | 'empty';
  marketplace?: Marketplace;
  marketplaceEnabled?: boolean;
  plugin?: PluginInfo;
}

// Track current scope - persists across screen refreshes
let currentScope: 'project' | 'global' = 'project';

// Track collapsed marketplaces - persists across screen refreshes
const collapsedMarketplaces = new Set<string>();

// Track current selection - persists across screen refreshes
let currentSelection = 0;

// Helper to clean up screen-level key bindings before re-registering
// This prevents handler accumulation when createPluginsScreen is called recursively
function cleanupPluginScreenKeys(screen: blessed.Screen): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scr = screen as any;
  if (scr.unkey && typeof scr.unkey === 'function') {
    try {
      scr.unkey(['g']);
      scr.unkey(['u']);
      scr.unkey(['d']);
      scr.unkey(['r']);
      scr.unkey(['a']);
      scr.unkey(['n']);
      scr.unkey(['j']);
      scr.unkey(['k']);
    } catch {
      // Ignore errors if keys weren't bound
    }
  }
}

export async function createPluginsScreen(state: AppState): Promise<void> {
  // Clean up any existing screen-level key handlers to prevent accumulation
  cleanupPluginScreenKeys(state.screen);

  createHeader(state, 'Plugins');

  const isGlobal = currentScope === 'global';

  // Scope tabs - visible tab bar for switching between Project and Global
  const projectTab = isGlobal
    ? '{gray-fg}[ Project ]{/gray-fg}'
    : '{cyan-fg}{bold}[ Project ]{/bold}{/cyan-fg}';
  const globalTab = isGlobal
    ? '{magenta-fg}{bold}[ Global ]{/bold}{/magenta-fg}'
    : '{gray-fg}[ Global ]{/gray-fg}';

  blessed.box({
    parent: state.screen,
    top: 1,
    left: 2,
    width: '100%-4',
    height: 1,
    content: `${projectTab}  ${globalTab}  {gray-fg}(press g to switch){/gray-fg}`,
    tags: true,
    style: { fg: 'white' },
  });

  // Fetch configured marketplaces based on scope (for enabled status)
  const configuredMarketplaces = isGlobal
    ? await getGlobalConfiguredMarketplaces()
    : await getConfiguredMarketplaces(state.projectPath);

  // Get local marketplace cache (single source of truth)
  const localMarketplaces = await getLocalMarketplacesInfo();

  // Get all marketplaces from local cache + hardcoded defaults (deduped by repo)
  const allMarketplaces = getAllMarketplaces(localMarketplaces);

  // Fetch all available plugins based on scope
  let allPlugins: PluginInfo[] = [];
  try {
    allPlugins = isGlobal
      ? await getGlobalAvailablePlugins()
      : await getAvailablePlugins(state.projectPath);
  } catch {
    // Continue with empty plugins
  }

  // Group plugins by marketplace
  const pluginsByMarketplace = new Map<string, PluginInfo[]>();
  for (const plugin of allPlugins) {
    const existing = pluginsByMarketplace.get(plugin.marketplace) || [];
    existing.push(plugin);
    pluginsByMarketplace.set(plugin.marketplace, existing);
  }

  // Build unified list
  const listItems: ListItem[] = [];

  for (const marketplace of allMarketplaces) {
    // Marketplace is enabled if it's in local cache (actually cloned) or explicitly configured
    const isInLocalCache = localMarketplaces.has(marketplace.name);
    const isConfigured = configuredMarketplaces[marketplace.name] !== undefined;
    const isEnabled = isInLocalCache || isConfigured;
    const plugins = pluginsByMarketplace.get(marketplace.name) || [];
    const isCollapsed = collapsedMarketplaces.has(marketplace.name);

    // Marketplace header with expand/collapse indicator
    const expandIcon = isEnabled && plugins.length > 0
      ? (isCollapsed ? '{gray-fg}▶{/gray-fg}' : '{gray-fg}▼{/gray-fg}')
      : ' ';
    const enabledBadge = isEnabled ? '{green-fg}✓{/green-fg}' : '{gray-fg}○{/gray-fg}';
    const officialBadge = marketplace.official ? ' {cyan-fg}[Official]{/cyan-fg}' : '';
    const pluginCount = plugins.length > 0 ? ` {gray-fg}(${plugins.length}){/gray-fg}` : '';

    listItems.push({
      label: `${expandIcon} ${enabledBadge} {bold}${marketplace.displayName}{/bold}${officialBadge}${pluginCount}`,
      type: 'marketplace',
      marketplace,
      marketplaceEnabled: isEnabled,
    });

    // Plugins under this marketplace (if enabled and not collapsed)
    if (isEnabled && plugins.length > 0 && !isCollapsed) {
      for (const plugin of plugins) {
        let status = '{gray-fg}○{/gray-fg}';
        if (plugin.enabled) {
          status = '{green-fg}●{/green-fg}';
        } else if (plugin.installedVersion) {
          status = '{yellow-fg}●{/yellow-fg}';
        }

        let versionDisplay = `{gray-fg}v${plugin.version}{/gray-fg}`;
        if (plugin.hasUpdate) {
          versionDisplay = `{yellow-fg}v${plugin.installedVersion} → v${plugin.version}{/yellow-fg}`;
        } else if (plugin.installedVersion) {
          versionDisplay = `{green-fg}v${plugin.installedVersion}{/green-fg}`;
        }

        const updateBadge = plugin.hasUpdate ? ' {yellow-fg}⬆{/yellow-fg}' : '';

        listItems.push({
          label: `      ${status} ${plugin.name} ${versionDisplay}${updateBadge}`,
          type: 'plugin',
          plugin,
        });
      }
    } else if (isEnabled && !isCollapsed) {
      listItems.push({
        label: '      {gray-fg}No plugins available{/gray-fg}',
        type: 'empty',
      });
    }

    // Empty line between marketplaces (only if expanded)
    if (!isCollapsed) {
      listItems.push({ label: '', type: 'empty' });
    }
  }

  // List label (simplified since we have tab bar)
  const scopeLabel = ' Marketplaces & Plugins ';

  // Ensure currentSelection is within bounds
  if (currentSelection >= listItems.length) {
    currentSelection = Math.max(0, listItems.length - 1);
  }

  // List
  const list = blessed.list({
    parent: state.screen,
    top: 4,
    left: 2,
    width: '50%-2',
    height: '100%-6',
    items: listItems.map((item) => item.label),
    keys: true,
    vi: false,
    mouse: true,
    tags: true,
    scrollable: true,
    border: { type: 'line' },
    style: {
      fg: 'white',
      selected: { bg: isGlobal ? 'magenta' : 'blue', fg: 'white' },
      border: { fg: isGlobal ? 'magenta' : 'gray' },
    },
    scrollbar: { ch: '│', style: { bg: 'gray' } },
    label: scopeLabel,
  });

  // Restore selection position
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listAny = list as any;
  if (currentSelection > 0 && currentSelection < listItems.length) {
    listAny.select(currentSelection);
    listAny.scrollTo(currentSelection);
  }

  // Detail panel
  const detailBox = blessed.box({
    parent: state.screen,
    top: 4,
    right: 2,
    width: '50%-2',
    height: '100%-6',
    content: '',
    tags: true,
    border: { type: 'line' },
    style: {
      fg: 'white',
      border: { fg: 'gray' },
    },
    label: ' {white-fg}Details{/white-fg} ',
  });

  // Update detail panel
  const updateDetail = (): void => {
    const selected = list.selected as number;
    const item = listItems[selected];

    if (!item || item.type === 'empty') {
      detailBox.setContent('{gray-fg}Select an item to see details{/gray-fg}');
      state.screen.render();
      return;
    }

    if (item.type === 'marketplace' && item.marketplace) {
      const mp = item.marketplace;

      const statusText = item.marketplaceEnabled
        ? '{green-fg}● Enabled{/green-fg}'
        : '{gray-fg}○ Not added{/gray-fg}';

      const plugins = pluginsByMarketplace.get(mp.name) || [];
      const pluginInfo = plugins.length > 0
        ? `{bold}Plugins:{/bold} ${plugins.length} available`
        : '{gray-fg}Enable to see plugins{/gray-fg}';

      const actionText = item.marketplaceEnabled
        ? '{red-fg}Press Enter to remove{/red-fg}'
        : '{green-fg}Press Enter to add{/green-fg}';

      const scopeInfo = isGlobal
        ? '{magenta-fg}Scope: Global (~/.claude){/magenta-fg}'
        : `{cyan-fg}Scope: Project (${state.projectPath}){/cyan-fg}`;

      const sourceDisplay = mp.source.repo
        ? `{bold}Source:{/bold}\n{gray-fg}github.com/${mp.source.repo}{/gray-fg}`
        : `{bold}Source:{/bold}\n{gray-fg}Local cache{/gray-fg}`;

      const content = `
{bold}{cyan-fg}${mp.displayName}{/cyan-fg}{/bold}${mp.official ? ' {cyan-fg}[Official]{/cyan-fg}' : ''}

${mp.description}

{bold}Status:{/bold} ${statusText}
${pluginInfo}

${sourceDisplay}

${scopeInfo}

${actionText}
      `.trim();

      detailBox.setContent(content);
    } else if (item.type === 'plugin' && item.plugin) {
      const plugin = item.plugin;

      let statusText = '{gray-fg}Not installed{/gray-fg}';
      if (plugin.enabled) {
        statusText = '{green-fg}● Enabled{/green-fg}';
      } else if (plugin.installedVersion) {
        statusText = '{yellow-fg}● Installed (disabled){/yellow-fg}';
      }

      let versionInfo = `{bold}Latest:{/bold} v${plugin.version}`;
      if (plugin.installedVersion) {
        versionInfo = `{bold}Installed:{/bold} v${plugin.installedVersion}\n{bold}Latest:{/bold} v${plugin.version}`;
        if (plugin.hasUpdate) {
          versionInfo += '\n{yellow-fg}⬆ Update available{/yellow-fg}';
        }
      }

      let actions = '';
      // Check both enabled and installedVersion - plugin can be enabled without version tracking
      const isInstalled = plugin.enabled || plugin.installedVersion;
      if (isInstalled) {
        actions = plugin.enabled
          ? '{cyan-fg}[Enter]{/cyan-fg} Disable'
          : '{cyan-fg}[Enter]{/cyan-fg} Enable';
        if (plugin.hasUpdate) {
          actions += '  {green-fg}[u]{/green-fg} Update';
        }
        actions += '  {red-fg}[d]{/red-fg} Uninstall';
      } else {
        actions = '{green-fg}[Enter]{/green-fg} Install & Enable';
      }

      const scopeInfo = isGlobal
        ? '{magenta-fg}Scope: Global{/magenta-fg}'
        : '{cyan-fg}Scope: Project{/cyan-fg}';

      const content = `
{bold}{cyan-fg}${plugin.name}{/cyan-fg}{/bold}

${plugin.description}

{bold}Status:{/bold} ${statusText}

${versionInfo}

{bold}ID:{/bold} ${plugin.id}
${scopeInfo}

${actions}
      `.trim();

      detailBox.setContent(content);
    }

    state.screen.render();
  };

  list.on('select item', () => {
    currentSelection = list.selected as number;
    updateDetail();
  });
  setTimeout(updateDetail, 0);

  // Handle selection (Enter)
  list.on('select', async (_item: unknown, index: number) => {
    const selected = listItems[index];
    if (!selected || selected.type === 'empty') return;

    if (selected.type === 'marketplace' && selected.marketplace) {
      const mp = selected.marketplace;

      if (selected.marketplaceEnabled) {
        // Remove marketplace - immediate, no confirmation
        const loading = showLoading(state, `Removing ${mp.displayName}...`);
        try {
          if (isGlobal) {
            await removeGlobalMarketplace(mp.name);
          } else {
            await removeMarketplace(mp.name, state.projectPath);
          }
        } finally {
          loading.stop();
        }
        await navigateTo(state, 'plugins');
      } else {
        // Add marketplace - immediate, no confirmation
        const loading = showLoading(state, `Adding ${mp.displayName}...`);
        try {
          if (isGlobal) {
            await addGlobalMarketplace(mp);
          } else {
            await addMarketplace(mp, state.projectPath);
          }
        } finally {
          loading.stop();
        }
        await navigateTo(state, 'plugins');
      }
    } else if (selected.type === 'plugin' && selected.plugin) {
      const plugin = selected.plugin;
      const isInstalled = plugin.enabled || plugin.installedVersion;

      if (plugin.hasUpdate) {
        // Update plugin - immediate when update available
        const loading = showLoading(state, `Updating ${plugin.name}...`);
        try {
          if (isGlobal) {
            await saveGlobalInstalledPluginVersion(plugin.id, plugin.version);
          } else {
            await saveInstalledPluginVersion(plugin.id, plugin.version, state.projectPath);
          }
        } finally {
          loading.stop();
        }
        await navigateTo(state, 'plugins');
      } else if (isInstalled) {
        // Toggle enabled/disabled - immediate
        const newState = !plugin.enabled;
        const loading = showLoading(state, `${newState ? 'Enabling' : 'Disabling'} ${plugin.name}...`);
        try {
          if (isGlobal) {
            await enableGlobalPlugin(plugin.id, newState);
          } else {
            await enablePlugin(plugin.id, newState, state.projectPath);
          }
        } finally {
          loading.stop();
        }
        await navigateTo(state, 'plugins');
      } else {
        // Install plugin - immediate
        const loading = showLoading(state, `Installing ${plugin.name}...`);
        try {
          if (isGlobal) {
            await enableGlobalPlugin(plugin.id, true);
            await saveGlobalInstalledPluginVersion(plugin.id, plugin.version);
          } else {
            await enablePlugin(plugin.id, true, state.projectPath);
            await saveInstalledPluginVersion(plugin.id, plugin.version, state.projectPath);
          }
        } finally {
          loading.stop();
        }
        await navigateTo(state, 'plugins');
      }
    }
  });

  // Toggle scope (g key) - don't clear cache, just switch view
  list.key(['g'], async () => {
    if (state.isSearching) return;
    currentScope = currentScope === 'project' ? 'global' : 'project';
    currentSelection = 0; // Reset selection when scope changes
    await navigateTo(state, 'plugins');
  });

  // Update plugin (u key) - immediate, no confirmation
  list.key(['u'], async () => {
    if (state.isSearching) return;
    const selected = list.selected as number;
    const item = listItems[selected];
    if (!item || item.type !== 'plugin' || !item.plugin) return;

    const plugin = item.plugin;
    if (!plugin.hasUpdate) {
      return; // Silent no-op if no update available
    }

    const loading = showLoading(state, `Updating ${plugin.name}...`);
    try {
      if (isGlobal) {
        await saveGlobalInstalledPluginVersion(plugin.id, plugin.version);
      } else {
        await saveInstalledPluginVersion(plugin.id, plugin.version, state.projectPath);
      }
    } finally {
      loading.stop();
    }
    await navigateTo(state, 'plugins');
  });

  // Uninstall plugin (d key) - immediate, no confirmation
  list.key(['d'], async () => {
    if (state.isSearching) return;
    const selected = list.selected as number;
    const item = listItems[selected];
    if (!item || item.type !== 'plugin' || !item.plugin) return;

    const plugin = item.plugin;
    const isInstalled = plugin.enabled || plugin.installedVersion;
    if (!isInstalled) {
      await showMessage(state, 'Not Installed', `${plugin.name} is not installed.`, 'info');
      return;
    }

    const loading = showLoading(state, `Uninstalling ${plugin.name}...`);
    try {
      if (isGlobal) {
        await enableGlobalPlugin(plugin.id, false);
        await removeGlobalInstalledPluginVersion(plugin.id);
      } else {
        await enablePlugin(plugin.id, false, state.projectPath);
        await removeInstalledPluginVersion(plugin.id, state.projectPath);
      }
    } finally {
      loading.stop();
    }
    await navigateTo(state, 'plugins');
  });

  // Refresh (r key) - git pull all marketplaces and clear cache
  state.screen.key(['r'], async () => {
    if (state.isSearching || state.isRefreshing) return;

    // Show progress bar
    showProgress(state, 'Refreshing marketplaces...');

    // Git pull all local marketplaces and clear cache with progress updates
    const results = await refreshAllMarketplaces((progress) => {
      showProgress(state, `Refreshing ${progress.name}...`, progress.current, progress.total);
    });

    // Hide progress bar
    hideProgress(state);

    // Build summary message
    const updated = results.filter((r) => r.updated);
    const failed = results.filter((r) => !r.success);

    let message = '';
    if (updated.length > 0) {
      message += `Updated: ${updated.map((r) => r.name).join(', ')}\n`;
    }
    if (failed.length > 0) {
      message += `Failed: ${failed.map((r) => r.name).join(', ')}\n`;
    }
    if (updated.length === 0 && failed.length === 0) {
      message = 'All marketplaces up to date.';
    }

    await showMessage(state, 'Refreshed', message.trim(), updated.length > 0 ? 'success' : 'info');
    await navigateTo(state, 'plugins');
  });

  // Update all plugins (a key) - immediate, no confirmation
  list.key(['a'], async () => {
    if (state.isSearching) return;
    const updatable = allPlugins.filter((p) => p.hasUpdate);
    if (updatable.length === 0) {
      return; // Silent no-op if all up-to-date
    }

    const loading = showLoading(state, `Updating ${updatable.length} plugin(s)...`);
    try {
      for (const plugin of updatable) {
        if (isGlobal) {
          await saveGlobalInstalledPluginVersion(plugin.id, plugin.version);
        } else {
          await saveInstalledPluginVersion(plugin.id, plugin.version, state.projectPath);
        }
      }
    } finally {
      loading.stop();
    }
    await navigateTo(state, 'plugins');
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

  // Expand/collapse marketplace (left/right arrows or </> keys)
  const toggleCollapse = (collapse: boolean) => {
    const selected = list.selected as number;
    const item = listItems[selected];

    // Find the marketplace for the current item
    let targetMarketplace: Marketplace | undefined;
    if (item?.type === 'marketplace' && item.marketplace) {
      targetMarketplace = item.marketplace;
    } else if (item?.type === 'plugin' && item.plugin) {
      // Find parent marketplace
      targetMarketplace = allMarketplaces.find((mp) => mp.name === item.plugin?.marketplace);
    }

    if (targetMarketplace) {
      if (collapse) {
        collapsedMarketplaces.add(targetMarketplace.name);
      } else {
        collapsedMarketplaces.delete(targetMarketplace.name);
      }
      createPluginsScreen(state);
    }
  };

  list.key(['left', '<'], () => toggleCollapse(true));
  list.key(['right', '>'], () => toggleCollapse(false));

  // Legend (scope now visible in tab bar)
  blessed.box({
    parent: state.screen,
    bottom: 1,
    right: 2,
    width: 50,
    height: 1,
    content: `{green-fg}●{/green-fg} Enabled  {yellow-fg}●{/yellow-fg} Disabled  {gray-fg}○{/gray-fg} Not installed`,
    tags: true,
    style: { fg: 'white' },
  });

  createFooter(state, '↑↓ Navigate │ ←→ Collapse/Expand │ Enter Toggle │ g Scope │ u Update │ d Uninstall │ r Refresh');

  list.focus();
  state.screen.render();
}

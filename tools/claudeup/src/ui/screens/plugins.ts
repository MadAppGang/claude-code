import blessed from 'neo-blessed';
import type { AppState } from '../app.js';
import { createHeader, createFooter, showMessage, showConfirm, showLoading } from '../app.js';
import { defaultMarketplaces } from '../../data/marketplaces.js';
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
  clearMarketplaceCache,
  getAvailablePlugins,
  getGlobalAvailablePlugins,
  type PluginInfo,
} from '../../services/plugin-manager.js';

interface ListItem {
  label: string;
  type: 'marketplace' | 'plugin' | 'empty';
  marketplace?: (typeof defaultMarketplaces)[0];
  marketplaceEnabled?: boolean;
  plugin?: PluginInfo;
}

// Track current scope - persists across screen refreshes
let currentScope: 'project' | 'global' = 'project';
// Track current selection - persists across screen refreshes
let currentSelection = 0;

export async function createPluginsScreen(state: AppState): Promise<void> {
  createHeader(state, 'Plugins');

  const isGlobal = currentScope === 'global';

  // Fetch marketplaces based on scope
  const configuredMarketplaces = isGlobal
    ? await getGlobalConfiguredMarketplaces()
    : await getConfiguredMarketplaces(state.projectPath);

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

  for (const marketplace of defaultMarketplaces) {
    const isEnabled = configuredMarketplaces[marketplace.name] !== undefined;
    const plugins = pluginsByMarketplace.get(marketplace.name) || [];

    // Marketplace header
    const enabledBadge = isEnabled ? '{green-fg}✓{/green-fg}' : '{gray-fg}○{/gray-fg}';
    const officialBadge = marketplace.official ? ' {cyan-fg}[Official]{/cyan-fg}' : '';
    const pluginCount = plugins.length > 0 ? ` {gray-fg}(${plugins.length}){/gray-fg}` : '';

    listItems.push({
      label: `${enabledBadge} {bold}${marketplace.displayName}{/bold}${officialBadge}${pluginCount}`,
      type: 'marketplace',
      marketplace,
      marketplaceEnabled: isEnabled,
    });

    // Plugins under this marketplace (if enabled)
    if (isEnabled && plugins.length > 0) {
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
          label: `    ${status} ${plugin.name} ${versionDisplay}${updateBadge}`,
          type: 'plugin',
          plugin,
        });
      }
    } else if (isEnabled) {
      listItems.push({
        label: '    {gray-fg}No plugins available{/gray-fg}',
        type: 'empty',
      });
    }

    // Empty line between marketplaces
    listItems.push({ label: '', type: 'empty' });
  }

  // Scope indicator
  const scopeLabel = isGlobal
    ? ' {magenta-fg}{bold}[GLOBAL]{/bold}{/magenta-fg} Marketplaces & Plugins '
    : ' {cyan-fg}{bold}[PROJECT]{/bold}{/cyan-fg} Marketplaces & Plugins ';

  // Ensure currentSelection is within bounds
  if (currentSelection >= listItems.length) {
    currentSelection = Math.max(0, listItems.length - 1);
  }

  // List
  const list = blessed.list({
    parent: state.screen,
    top: 3,
    left: 2,
    width: '50%-2',
    height: '100%-5',
    items: listItems.map((item) => item.label),
    keys: true,
    vi: false,
    mouse: true,
    tags: true,
    scrollable: true,
    border: { type: 'line' },
    style: {
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

      const content = `
{bold}{cyan-fg}${mp.displayName}{/cyan-fg}{/bold}${mp.official ? ' {cyan-fg}[Official]{/cyan-fg}' : ''}

${mp.description}

{bold}Status:{/bold} ${statusText}
${pluginInfo}

{bold}Source:{/bold}
{gray-fg}github.com/${mp.source.repo}{/gray-fg}

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
      if (plugin.installedVersion) {
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
        // Remove marketplace
        const confirm = await showConfirm(
          state,
          `Remove ${mp.displayName}?`,
          `Plugins from this marketplace will no longer be available.\n(${isGlobal ? 'Global' : 'Project'} scope)`
        );

        if (confirm) {
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
          await showMessage(state, 'Removed', `${mp.displayName} removed.`, 'success');
          createPluginsScreen(state);
        }
      } else {
        // Add marketplace
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
        await showMessage(
          state,
          'Added',
          `${mp.displayName} added.\nPlugins are now available below.`,
          'success'
        );
        createPluginsScreen(state);
      }
    } else if (selected.type === 'plugin' && selected.plugin) {
      const plugin = selected.plugin;

      if (plugin.installedVersion) {
        // Toggle enabled/disabled
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
        await showMessage(
          state,
          newState ? 'Enabled' : 'Disabled',
          `${plugin.name} ${newState ? 'enabled' : 'disabled'}.\nRestart Claude Code to apply.`,
          'success'
        );
        createPluginsScreen(state);
      } else {
        // Install plugin
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
        await showMessage(
          state,
          'Installed',
          `${plugin.name} v${plugin.version} installed.\nRestart Claude Code to apply.`,
          'success'
        );
        createPluginsScreen(state);
      }
    }
  });

  // Toggle scope (g key) - don't clear cache, just switch view
  list.key(['g'], async () => {
    if (state.isSearching) return;
    currentScope = currentScope === 'project' ? 'global' : 'project';
    currentSelection = 0; // Reset selection when scope changes
    createPluginsScreen(state);
  });

  // Update plugin (u key)
  list.key(['u'], async () => {
    if (state.isSearching) return;
    const selected = list.selected as number;
    const item = listItems[selected];
    if (!item || item.type !== 'plugin' || !item.plugin) return;

    const plugin = item.plugin;
    if (!plugin.hasUpdate) {
      await showMessage(state, 'No Update', `${plugin.name} is at the latest version.`, 'info');
      return;
    }

    const confirm = await showConfirm(
      state,
      'Update Plugin?',
      `Update ${plugin.name} to v${plugin.version}?`
    );

    if (confirm) {
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
      await showMessage(state, 'Updated', `${plugin.name} updated.\nRestart Claude Code to apply.`, 'success');
      createPluginsScreen(state);
    }
  });

  // Uninstall plugin (d key)
  list.key(['d'], async () => {
    if (state.isSearching) return;
    const selected = list.selected as number;
    const item = listItems[selected];
    if (!item || item.type !== 'plugin' || !item.plugin) return;

    const plugin = item.plugin;
    if (!plugin.installedVersion) {
      await showMessage(state, 'Not Installed', `${plugin.name} is not installed.`, 'info');
      return;
    }

    const confirm = await showConfirm(state, 'Uninstall?', `Remove ${plugin.name}?`);

    if (confirm) {
      const loading = showLoading(state, `Uninstalling ${plugin.name}...`);
      try {
        if (isGlobal) {
          await removeGlobalInstalledPluginVersion(plugin.id);
        } else {
          await enablePlugin(plugin.id, false, state.projectPath);
          await removeInstalledPluginVersion(plugin.id, state.projectPath);
        }
      } finally {
        loading.stop();
      }
      await showMessage(state, 'Uninstalled', `${plugin.name} removed.\nRestart Claude Code to apply.`, 'success');
      createPluginsScreen(state);
    }
  });

  // Refresh (r key)
  list.key(['r'], async () => {
    if (state.isSearching) return;
    clearMarketplaceCache();
    createPluginsScreen(state);
  });

  // Update all plugins (a key)
  list.key(['a'], async () => {
    if (state.isSearching) return;
    const updatable = allPlugins.filter((p) => p.hasUpdate);
    if (updatable.length === 0) {
      await showMessage(state, 'All Up to Date', 'All plugins are at the latest version.', 'info');
      return;
    }

    const confirm = await showConfirm(state, 'Update All?', `Update ${updatable.length} plugin(s)?`);

    if (confirm) {
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
      await showMessage(state, 'Updated', `Updated ${updatable.length} plugin(s).\nRestart Claude Code to apply.`, 'success');
      createPluginsScreen(state);
    }
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

  // Legend with scope indicator
  const scopeText = isGlobal
    ? '{magenta-fg}[g] Global{/magenta-fg}'
    : '{cyan-fg}[g] Project{/cyan-fg}';

  blessed.box({
    parent: state.screen,
    bottom: 1,
    right: 2,
    width: 60,
    height: 1,
    content: `${scopeText}  {green-fg}●{/green-fg} Enabled  {yellow-fg}●{/yellow-fg} Disabled  {gray-fg}○{/gray-fg} Not installed`,
    tags: true,
  });

  createFooter(state, '↑↓ Navigate │ Enter Toggle │ g Scope │ u Update │ d Uninstall │ a Update All │ r Refresh');

  list.focus();
  state.screen.render();
}

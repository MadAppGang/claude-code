import blessed from 'neo-blessed';
import type { AppState } from '../app.js';
import { createHeader, createFooter, showMessage, showConfirm } from '../app.js';
import {
  getConfiguredMarketplaces,
  enablePlugin,
} from '../../services/claude-settings.js';
import {
  getAvailablePlugins,
  saveInstalledPluginVersion,
  removeInstalledPluginVersion,
  clearMarketplaceCache,
  type PluginInfo,
} from '../../services/plugin-manager.js';

export async function createPluginsScreen(state: AppState): Promise<void> {
  createHeader(state, 'Manage Plugins');

  const configuredMarketplaces = await getConfiguredMarketplaces(state.projectPath);

  // Check if any marketplaces are configured
  if (Object.keys(configuredMarketplaces).length === 0) {
    blessed.box({
      parent: state.screen,
      top: 'center',
      left: 'center',
      width: 50,
      height: 7,
      content: `{center}{bold}No Marketplaces Configured{/bold}{/center}

Go to Plugin Marketplaces to add one first.

{center}{gray-fg}Press Esc to go back{/gray-fg}{/center}`,
      tags: true,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'yellow',
        },
      },
    });

    createFooter(state, 'Esc Back');
    state.screen.render();
    return;
  }

  // Show loading message
  const loadingBox = blessed.box({
    parent: state.screen,
    top: 'center',
    left: 'center',
    width: 30,
    height: 3,
    content: '{center}Fetching plugins...{/center}',
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: 'cyan',
      },
    },
  });
  state.screen.render();

  // Fetch available plugins
  let plugins: PluginInfo[];
  try {
    plugins = await getAvailablePlugins(state.projectPath);
  } catch (error) {
    loadingBox.destroy();
    blessed.box({
      parent: state.screen,
      top: 'center',
      left: 'center',
      width: 50,
      height: 5,
      content: `{center}{bold}{red-fg}Error Fetching Plugins{/red-fg}{/bold}{/center}

{center}${error instanceof Error ? error.message : 'Unknown error'}{/center}`,
      tags: true,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'red',
        },
      },
    });
    createFooter(state, 'Esc Back');
    state.screen.render();
    return;
  }

  loadingBox.destroy();

  if (plugins.length === 0) {
    blessed.box({
      parent: state.screen,
      top: 'center',
      left: 'center',
      width: 50,
      height: 5,
      content: `{center}{bold}No Plugins Found{/bold}{/center}

{center}No plugins available from configured marketplaces.{/center}`,
      tags: true,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'yellow',
        },
      },
    });
    createFooter(state, 'Esc Back');
    state.screen.render();
    return;
  }

  // Group by marketplace
  const byMarketplace = new Map<string, PluginInfo[]>();
  for (const plugin of plugins) {
    const existing = byMarketplace.get(plugin.marketplaceDisplay) || [];
    existing.push(plugin);
    byMarketplace.set(plugin.marketplaceDisplay, existing);
  }

  // Build list items
  const listItems: { label: string; plugin?: PluginInfo; isHeader?: boolean }[] = [];

  for (const [marketplace, marketplacePlugins] of byMarketplace) {
    listItems.push({
      label: `{bold}── ${marketplace} ──{/bold}`,
      isHeader: true,
    });

    for (const plugin of marketplacePlugins) {
      // Status indicators
      let status = '{gray-fg}○{/gray-fg}';
      if (plugin.enabled) {
        status = '{green-fg}●{/green-fg}';
      } else if (plugin.installedVersion) {
        status = '{yellow-fg}●{/yellow-fg}';
      }

      // Version display
      let versionDisplay = `v${plugin.version}`;
      if (plugin.hasUpdate) {
        versionDisplay = `{red-fg}v${plugin.installedVersion}{/red-fg} → {green-fg}v${plugin.version}{/green-fg}`;
      } else if (plugin.installedVersion) {
        versionDisplay = `{cyan-fg}v${plugin.installedVersion}{/cyan-fg}`;
      }

      // Update badge
      const updateBadge = plugin.hasUpdate ? ' {yellow-fg}⬆{/yellow-fg}' : '';

      listItems.push({
        label: `  ${status} {bold}${plugin.name}{/bold} ${versionDisplay}${updateBadge}`,
        plugin,
      });
    }

    listItems.push({ label: '', isHeader: true });
  }

  const list = blessed.list({
    parent: state.screen,
    top: 3,
    left: 2,
    width: '50%-2',
    height: '100%-6',
    items: listItems.map((item) => item.label),
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    scrollable: true,
    border: {
      type: 'line',
    },
    style: {
      selected: {
        bg: 'blue',
        fg: 'white',
      },
      border: {
        fg: 'gray',
      },
    },
    scrollbar: {
      ch: '│',
      style: {
        bg: 'gray',
      },
    },
  });

  // Detail panel
  const detailBox = blessed.box({
    parent: state.screen,
    top: 3,
    right: 2,
    width: '50%-2',
    height: '100%-6',
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

  // Update detail panel
  const updateDetail = (): void => {
    const selected = list.selected as number;
    const item = listItems[selected];

    if (!item || item.isHeader || !item.plugin) {
      detailBox.setContent('{gray-fg}Select a plugin to see details{/gray-fg}');
      state.screen.render();
      return;
    }

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
        versionInfo += '\n{yellow-fg}⬆ Update available!{/yellow-fg}';
      }
    }

    let actions = '';
    if (plugin.installedVersion) {
      if (plugin.enabled) {
        actions = '{cyan-fg}[Enter]{/cyan-fg} Disable';
      } else {
        actions = '{cyan-fg}[Enter]{/cyan-fg} Enable';
      }
      if (plugin.hasUpdate) {
        actions += '  {green-fg}[u]{/green-fg} Update';
      }
      actions += '  {red-fg}[d]{/red-fg} Uninstall';
    } else {
      actions = '{green-fg}[Enter]{/green-fg} Install & Enable';
    }

    const content = `
{bold}{cyan-fg}${plugin.name}{/cyan-fg}{/bold}

${plugin.description}

{bold}Status:{/bold} ${statusText}

${versionInfo}

{bold}Marketplace:{/bold} ${plugin.marketplaceDisplay}
{bold}Plugin ID:{/bold} ${plugin.id}

${actions}
    `.trim();

    detailBox.setContent(content);
    state.screen.render();
  };

  list.on('select item', updateDetail);
  setTimeout(updateDetail, 0);

  // Handle selection (Enter)
  list.on('select', async (_item: unknown, index: number) => {
    const selected = listItems[index];
    if (!selected || selected.isHeader || !selected.plugin) {
      return;
    }

    const plugin = selected.plugin;

    if (plugin.installedVersion) {
      // Toggle enabled/disabled
      const newState = !plugin.enabled;
      await enablePlugin(plugin.id, newState, state.projectPath);
      await showMessage(
        state,
        newState ? 'Enabled' : 'Disabled',
        `${plugin.name} has been ${newState ? 'enabled' : 'disabled'}.\n\nRestart Claude Code to apply.`,
        'success'
      );
      clearMarketplaceCache();
      createPluginsScreen(state);
    } else {
      // Install plugin
      await enablePlugin(plugin.id, true, state.projectPath);
      await saveInstalledPluginVersion(plugin.id, plugin.version, state.projectPath);
      await showMessage(
        state,
        'Installed',
        `${plugin.name} v${plugin.version} has been installed and enabled.\n\nRestart Claude Code to apply.`,
        'success'
      );
      clearMarketplaceCache();
      createPluginsScreen(state);
    }
  });

  // Update plugin (u key) - disabled during search
  state.screen.key(['u'], async () => {
    if (state.isSearching) return;
    const selected = list.selected as number;
    const item = listItems[selected];
    if (!item || item.isHeader || !item.plugin) return;

    const plugin = item.plugin;
    if (!plugin.hasUpdate) {
      await showMessage(state, 'No Update', `${plugin.name} is already at the latest version.`, 'info');
      return;
    }

    const confirm = await showConfirm(
      state,
      'Update Plugin?',
      `Update ${plugin.name} from v${plugin.installedVersion} to v${plugin.version}?`
    );

    if (confirm) {
      await saveInstalledPluginVersion(plugin.id, plugin.version, state.projectPath);
      await showMessage(
        state,
        'Updated',
        `${plugin.name} updated to v${plugin.version}.\n\nRestart Claude Code to apply.`,
        'success'
      );
      clearMarketplaceCache();
      createPluginsScreen(state);
    }
  });

  // Uninstall plugin (d key) - disabled during search
  state.screen.key(['d'], async () => {
    if (state.isSearching) return;
    const selected = list.selected as number;
    const item = listItems[selected];
    if (!item || item.isHeader || !item.plugin) return;

    const plugin = item.plugin;
    if (!plugin.installedVersion) {
      await showMessage(state, 'Not Installed', `${plugin.name} is not installed.`, 'info');
      return;
    }

    const confirm = await showConfirm(
      state,
      'Uninstall Plugin?',
      `Remove ${plugin.name} from this project?`
    );

    if (confirm) {
      await enablePlugin(plugin.id, false, state.projectPath);
      await removeInstalledPluginVersion(plugin.id, state.projectPath);
      await showMessage(
        state,
        'Uninstalled',
        `${plugin.name} has been removed.\n\nRestart Claude Code to apply.`,
        'success'
      );
      clearMarketplaceCache();
      createPluginsScreen(state);
    }
  });

  // Refresh (r key) - disabled during search
  state.screen.key(['r'], async () => {
    if (state.isSearching) return;
    clearMarketplaceCache();
    createPluginsScreen(state);
  });

  // Update all (a key) - disabled during search
  state.screen.key(['a'], async () => {
    if (state.isSearching) return;
    const updatable = plugins.filter((p) => p.hasUpdate);
    if (updatable.length === 0) {
      await showMessage(state, 'All Up to Date', 'All plugins are at the latest version.', 'info');
      return;
    }

    const confirm = await showConfirm(
      state,
      'Update All?',
      `Update ${updatable.length} plugin(s) to latest versions?`
    );

    if (confirm) {
      for (const plugin of updatable) {
        await saveInstalledPluginVersion(plugin.id, plugin.version, state.projectPath);
      }
      await showMessage(
        state,
        'Updated',
        `Updated ${updatable.length} plugin(s).\n\nRestart Claude Code to apply.`,
        'success'
      );
      clearMarketplaceCache();
      createPluginsScreen(state);
    }
  });

  createFooter(
    state,
    '↑↓ Navigate │ Enter Toggle │ u Update │ d Uninstall │ a Update All │ r Refresh │ q Back'
  );

  list.focus();
  state.screen.render();
}

import React, { useEffect, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useApp, useModal, useProgress } from '../state/AppContext.js';
import { useDimensions } from '../state/DimensionsContext.js';
import { ScreenLayout } from '../components/layout/index.js';
import { CategoryHeader } from '../components/CategoryHeader.js';
import { ScrollableList } from '../components/ScrollableList.js';
import { fuzzyFilter, highlightMatches } from '../../utils/fuzzy-search.js';
import { getAllMarketplaces } from '../../data/marketplaces.js';
import {
  getAvailablePlugins,
  refreshAllMarketplaces,
  clearMarketplaceCache,
  saveInstalledPluginVersion,
  removeInstalledPluginVersion,
  getLocalMarketplacesInfo,
  type PluginInfo,
} from '../../services/plugin-manager.js';
import {
  addMarketplace,
  removeMarketplace,
  addGlobalMarketplace,
  removeGlobalMarketplace,
  enablePlugin,
  enableGlobalPlugin,
  enableLocalPlugin,
  saveGlobalInstalledPluginVersion,
  removeGlobalInstalledPluginVersion,
  saveLocalInstalledPluginVersion,
  removeLocalInstalledPluginVersion,
  setMcpEnvVar,
  getMcpEnvVars,
} from '../../services/claude-settings.js';
import {
  getPluginEnvRequirements,
  getPluginSourcePath,
} from '../../services/plugin-mcp-config.js';
import {
  cloneMarketplace,
  deleteMarketplace,
  addToKnownMarketplaces,
  removeFromKnownMarketplaces,
} from '../../services/local-marketplace.js';
import type { Marketplace } from '../../types/index.js';

interface ListItem {
  id: string;
  type: 'category' | 'plugin';
  label: string;
  marketplace?: Marketplace;
  marketplaceEnabled?: boolean;
  plugin?: PluginInfo;
  pluginCount?: number;
  isExpanded?: boolean;
}

export function PluginsScreen(): React.ReactElement {
  const { state, dispatch } = useApp();
  const { plugins: pluginsState } = state;
  const modal = useModal();
  const progress = useProgress();
  const dimensions = useDimensions();

  const isSearchActive = state.isSearching && state.currentRoute.screen === 'plugins' && !state.modal;

  // Fetch data (always fetches all scopes)
  const fetchData = useCallback(async () => {
    dispatch({ type: 'PLUGINS_DATA_LOADING' });
    try {
      const localMarketplaces = await getLocalMarketplacesInfo();
      const allMarketplaces = getAllMarketplaces(localMarketplaces);

      // Always use getAvailablePlugins which fetches all scope data
      const pluginData = await getAvailablePlugins(state.projectPath);

      dispatch({
        type: 'PLUGINS_DATA_SUCCESS',
        marketplaces: allMarketplaces,
        plugins: pluginData,
      });
    } catch (error) {
      dispatch({
        type: 'PLUGINS_DATA_ERROR',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [dispatch, state.projectPath]);

  // Load data on mount or when dataRefreshVersion changes
  useEffect(() => {
    fetchData();
  }, [fetchData, state.dataRefreshVersion]);

  // Build list items (categories + plugins)
  const allItems = useMemo((): ListItem[] => {
    if (pluginsState.marketplaces.status !== 'success' || pluginsState.plugins.status !== 'success') {
      return [];
    }

    const marketplaces = pluginsState.marketplaces.data;
    const plugins = pluginsState.plugins.data;
    const collapsed = pluginsState.collapsedMarketplaces;

    const pluginsByMarketplace = new Map<string, PluginInfo[]>();
    for (const plugin of plugins) {
      const existing = pluginsByMarketplace.get(plugin.marketplace) || [];
      existing.push(plugin);
      pluginsByMarketplace.set(plugin.marketplace, existing);
    }

    // Sort marketplaces: deprecated ones go to the bottom
    const sortedMarketplaces = [...marketplaces].sort((a, b) => {
      const aDeprecated = a.name === 'claude-code-plugins' ? 1 : 0;
      const bDeprecated = b.name === 'claude-code-plugins' ? 1 : 0;
      return aDeprecated - bDeprecated;
    });

    const items: ListItem[] = [];

    for (const marketplace of sortedMarketplaces) {
      const marketplacePlugins = pluginsByMarketplace.get(marketplace.name) || [];
      const isCollapsed = collapsed.has(marketplace.name);
      const isEnabled = marketplacePlugins.length > 0 || marketplace.official;
      const hasPlugins = marketplacePlugins.length > 0;

      // Category header (marketplace)
      items.push({
        id: `mp:${marketplace.name}`,
        type: 'category',
        label: marketplace.displayName,
        marketplace,
        marketplaceEnabled: isEnabled,
        pluginCount: marketplacePlugins.length,
        isExpanded: !isCollapsed && hasPlugins,
      });

      // Plugins under this marketplace (if expanded)
      if (isEnabled && hasPlugins && !isCollapsed) {
        for (const plugin of marketplacePlugins) {
          items.push({
            id: `pl:${plugin.id}`,
            type: 'plugin',
            label: plugin.name,
            plugin,
          });
        }
      }
    }

    return items;
  }, [pluginsState.marketplaces, pluginsState.plugins, pluginsState.collapsedMarketplaces]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    const query = pluginsState.searchQuery.trim();
    if (!query) return allItems;

    // Only search plugins, not categories
    const pluginItems = allItems.filter(item => item.type === 'plugin');
    const fuzzyResults = fuzzyFilter(pluginItems, query, item => item.label);

    // Include parent categories for matched plugins
    const matchedMarketplaces = new Set<string>();
    for (const result of fuzzyResults) {
      if (result.item.plugin) {
        matchedMarketplaces.add(result.item.plugin.marketplace);
      }
    }

    const result: ListItem[] = [];
    let currentMarketplace: string | null = null;

    for (const item of allItems) {
      if (item.type === 'category' && item.marketplace) {
        if (matchedMarketplaces.has(item.marketplace.name)) {
          result.push(item);
          currentMarketplace = item.marketplace.name;
        } else {
          currentMarketplace = null;
        }
      } else if (item.type === 'plugin' && item.plugin) {
        if (currentMarketplace === item.plugin.marketplace) {
          // Check if this plugin matched
          const matched = fuzzyResults.find(r => r.item.id === item.id);
          if (matched) {
            result.push({ ...item, _matches: matched.matches } as ListItem & { _matches?: number[] });
          }
        }
      }
    }

    return result;
  }, [allItems, pluginsState.searchQuery]);

  // Only selectable items (plugins, not categories)
  const selectableItems = useMemo(() => {
    return filteredItems.filter(item => item.type === 'plugin' || item.type === 'category');
  }, [filteredItems]);

  // Keyboard handling
  useInput((input, key) => {
    // Handle search mode
    if (isSearchActive) {
      if (key.escape) {
        dispatch({ type: 'SET_SEARCHING', isSearching: false });
        dispatch({ type: 'PLUGINS_SET_SEARCH', query: '' });
      } else if (key.return) {
        dispatch({ type: 'SET_SEARCHING', isSearching: false });
        // Keep the search query, just exit search mode
      } else if (key.backspace || key.delete) {
        dispatch({ type: 'PLUGINS_SET_SEARCH', query: pluginsState.searchQuery.slice(0, -1) });
      } else if (input && !key.ctrl && !key.meta) {
        dispatch({ type: 'PLUGINS_SET_SEARCH', query: pluginsState.searchQuery + input });
      }
      return;
    }

    if (state.modal) return;

    // Start search with /
    if (input === '/') {
      dispatch({ type: 'SET_SEARCHING', isSearching: true });
      return;
    }

    // Navigation
    if (key.upArrow || input === 'k') {
      const newIndex = Math.max(0, pluginsState.selectedIndex - 1);
      dispatch({ type: 'PLUGINS_SELECT', index: newIndex });
    } else if (key.downArrow || input === 'j') {
      const newIndex = Math.min(selectableItems.length - 1, pluginsState.selectedIndex + 1);
      dispatch({ type: 'PLUGINS_SELECT', index: newIndex });
    }

    // Collapse/expand marketplace
    else if ((key.leftArrow || key.rightArrow || input === '<' || input === '>') && selectableItems[pluginsState.selectedIndex]?.marketplace) {
      const item = selectableItems[pluginsState.selectedIndex];
      if (item?.marketplace) {
        dispatch({ type: 'PLUGINS_TOGGLE_MARKETPLACE', name: item.marketplace.name });
      }
    }

    // Refresh
    else if (input === 'r') {
      handleRefresh();
    }

    // New marketplace
    else if (input === 'n') {
      handleAddMarketplace();
    }

    // Scope-specific toggle shortcuts (u/p/l)
    else if (input === 'u') {
      handleScopeToggle('user');
    } else if (input === 'p') {
      handleScopeToggle('project');
    } else if (input === 'l') {
      handleScopeToggle('local');
    }

    // Update plugin (Shift+U)
    else if (input === 'U') {
      handleUpdate();
    }

    // Update all
    else if (input === 'a') {
      handleUpdateAll();
    }

    // Delete/uninstall
    else if (input === 'd') {
      handleUninstall();
    }

    // Enter for selection
    else if (key.return) {
      handleSelect();
    }
  });

  // Handle actions
  const handleRefresh = async () => {
    progress.show('Refreshing marketplaces...');
    try {
      await refreshAllMarketplaces((p) => {
        progress.show(`Refreshing ${p.name}...`, p.current, p.total);
      });
      clearMarketplaceCache();
      progress.hide();
      await modal.message('Refreshed', 'Marketplaces refreshed successfully.', 'success');
      fetchData();
    } catch (error) {
      progress.hide();
      await modal.message('Error', `Refresh failed: ${error}`, 'error');
    }
  };

  const handleAddMarketplace = async () => {
    const repo = await modal.input('Add Marketplace', 'GitHub repo (owner/repo):');
    if (!repo || !repo.trim()) return;

    progress.show('Cloning marketplace...');
    try {
      const result = await cloneMarketplace(repo.trim());
      if (result.success) {
        const normalizedRepo = repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
        const marketplace: Marketplace = {
          name: result.name,
          displayName: result.name,
          source: { source: 'github', repo: normalizedRepo },
          description: '',
          official: false,
        };

        if (pluginsState.scope === 'global') {
          await addGlobalMarketplace(marketplace);
        } else {
          await addMarketplace(marketplace, state.projectPath);
        }

        await addToKnownMarketplaces(result.name, normalizedRepo);
        clearMarketplaceCache();
        progress.hide();
        await modal.message('Added', `${result.name} marketplace added.`, 'success');
        fetchData();
      } else {
        progress.hide();
        await modal.message('Failed', result.error || 'Clone failed', 'error');
      }
    } catch (error) {
      progress.hide();
      await modal.message('Error', `Failed to add marketplace: ${error}`, 'error');
    }
  };

  /**
   * Collect environment variables required by a plugin's MCP servers
   * Prompts user for missing values and saves to local settings
   */
  const collectPluginEnvVars = async (
    pluginName: string,
    marketplace: string
  ): Promise<boolean> => {
    try {
      // Get plugin source path from marketplace manifest
      const pluginSource = await getPluginSourcePath(marketplace, pluginName);
      if (!pluginSource) return true; // No source path, nothing to configure

      // Get env var requirements from plugin's MCP config
      const requirements = await getPluginEnvRequirements(marketplace, pluginSource);
      if (requirements.length === 0) return true; // No env vars needed

      // Get existing env vars
      const existingEnvVars = await getMcpEnvVars(state.projectPath);
      const missingVars = requirements.filter(
        req => !existingEnvVars[req.name] && !process.env[req.name]
      );

      if (missingVars.length === 0) return true; // All vars already configured

      // Ask user if they want to configure MCP server env vars now
      const serverNames = [...new Set(missingVars.map(v => v.serverName))];
      const wantToConfigure = await modal.confirm(
        'Configure MCP Servers?',
        `This plugin includes MCP servers (${serverNames.join(', ')}) that need ${missingVars.length} environment variable(s).\n\nConfigure now?`
      );

      if (!wantToConfigure) {
        await modal.message(
          'Skipped Configuration',
          'You can configure these variables later in the Environment Variables screen (press 4).',
          'info'
        );
        return true; // Still installed, just not configured
      }

      // Collect each missing env var
      for (const req of missingVars) {
        // Check if value exists in process.env
        const existingProcessEnv = process.env[req.name];
        if (existingProcessEnv) {
          const useExisting = await modal.confirm(
            `Use ${req.name}?`,
            `${req.name} is already set in your environment.\n\nUse the existing value?`
          );
          if (useExisting) {
            // Store reference to env var instead of literal value
            await setMcpEnvVar(req.name, `\${${req.name}}`, state.projectPath);
            continue;
          }
        }

        // Prompt for value
        const value = await modal.input(
          `Configure ${req.serverName}`,
          `${req.label} (required):`,
          ''
        );

        if (value === null) {
          // User cancelled
          await modal.message(
            'Configuration Incomplete',
            `Skipped remaining configuration.\nYou can configure these later in Environment Variables (press 4).`,
            'info'
          );
          return true; // Still installed
        }

        if (value) {
          await setMcpEnvVar(req.name, value, state.projectPath);
        }
      }

      return true;
    } catch (error) {
      console.error('Error collecting plugin env vars:', error);
      return true; // Don't block installation on config errors
    }
  };

  const handleSelect = async () => {
    const item = selectableItems[pluginsState.selectedIndex];
    if (!item) return;

    if (item.type === 'category' && item.marketplace) {
      const mp = item.marketplace;
      const isGlobal = pluginsState.scope === 'global';

      if (item.marketplaceEnabled) {
        const isCollapsed = pluginsState.collapsedMarketplaces.has(mp.name);

        // If collapsed, expand first (even if no plugins - they might load)
        if (isCollapsed) {
          dispatch({ type: 'PLUGINS_TOGGLE_MARKETPLACE', name: mp.name });
        } else if (item.pluginCount && item.pluginCount > 0) {
          // If expanded with plugins, collapse
          dispatch({ type: 'PLUGINS_TOGGLE_MARKETPLACE', name: mp.name });
        } else {
          // If expanded with no plugins, offer to remove
          const confirmed = await modal.confirm(
            `Remove ${mp.displayName}?`,
            'Plugins from this marketplace will no longer be available.'
          );
          if (confirmed) {
            modal.loading(`Removing ${mp.displayName}...`);
            try {
              if (isGlobal) {
                await removeGlobalMarketplace(mp.name);
              } else {
                await removeMarketplace(mp.name, state.projectPath);
              }
              await deleteMarketplace(mp.name);
              await removeFromKnownMarketplaces(mp.name);
              clearMarketplaceCache();
              modal.hideModal();
              await modal.message('Removed', `${mp.displayName} removed.`, 'success');
              fetchData();
            } catch (error) {
              modal.hideModal();
              await modal.message('Error', `Failed to remove: ${error}`, 'error');
            }
          }
        }
      } else {
        // Add marketplace
        modal.loading(`Adding ${mp.displayName}...`);
        try {
          if (isGlobal) {
            await addGlobalMarketplace(mp);
          } else {
            await addMarketplace(mp, state.projectPath);
          }
          modal.hideModal();
          fetchData();
        } catch (error) {
          modal.hideModal();
          await modal.message('Error', `Failed to add: ${error}`, 'error');
        }
      }
    } else if (item.type === 'plugin' && item.plugin) {
      const plugin = item.plugin;
      const latestVersion = plugin.version || '0.0.0';

      // Build scope options with status info
      const buildScopeLabel = (
        name: string,
        scope: { enabled?: boolean; version?: string } | undefined,
        desc: string
      ) => {
        const installed = scope?.enabled;
        const ver = scope?.version;
        const hasUpdate = ver && latestVersion && ver !== latestVersion && latestVersion !== '0.0.0';

        let label = installed ? `● ${name}` : `○ ${name}`;
        label += ` (${desc})`;
        if (ver) label += ` v${ver}`;
        if (hasUpdate) label += ` → v${latestVersion}`;
        return label;
      };

      const scopeOptions = [
        { label: buildScopeLabel('User', plugin.userScope, 'global'), value: 'user' },
        { label: buildScopeLabel('Project', plugin.projectScope, 'team'), value: 'project' },
        { label: buildScopeLabel('Local', plugin.localScope, 'private'), value: 'local' },
      ];

      const scopeValue = await modal.select(
        plugin.name,
        `Select scope to toggle:`,
        scopeOptions
      );

      if (scopeValue === null) return; // Cancelled

      // Determine action based on selected scope's current state
      const selectedScope = scopeValue === 'user' ? plugin.userScope :
                           scopeValue === 'project' ? plugin.projectScope :
                           plugin.localScope;
      const isInstalledInScope = selectedScope?.enabled;
      const installedVersion = selectedScope?.version;
      const scopeLabel = scopeValue === 'user' ? 'User' : scopeValue === 'project' ? 'Project' : 'Local';

      // Check if this scope has an update available
      const hasUpdateInScope = isInstalledInScope && installedVersion &&
                               latestVersion !== '0.0.0' &&
                               installedVersion !== latestVersion;

      // Determine action: update if available, otherwise toggle
      let action: 'update' | 'install' | 'uninstall';
      if (isInstalledInScope && hasUpdateInScope) {
        action = 'update';
      } else if (isInstalledInScope) {
        action = 'uninstall';
      } else {
        action = 'install';
      }

      const actionLabel = action === 'update' ? `Updating ${scopeLabel}` :
                          action === 'install' ? `Installing to ${scopeLabel}` :
                          `Uninstalling from ${scopeLabel}`;
      modal.loading(`${actionLabel}...`);

      try {
        if (action === 'uninstall') {
          // Uninstall from this scope
          if (scopeValue === 'user') {
            await enableGlobalPlugin(plugin.id, false);
            await removeGlobalInstalledPluginVersion(plugin.id);
          } else if (scopeValue === 'project') {
            await enablePlugin(plugin.id, false, state.projectPath);
            await removeInstalledPluginVersion(plugin.id, state.projectPath);
          } else {
            await enableLocalPlugin(plugin.id, false, state.projectPath);
            await removeLocalInstalledPluginVersion(plugin.id, state.projectPath);
          }
        } else {
          // Install or update (both save the latest version)
          if (scopeValue === 'user') {
            await enableGlobalPlugin(plugin.id, true);
            await saveGlobalInstalledPluginVersion(plugin.id, latestVersion);
          } else if (scopeValue === 'project') {
            await enablePlugin(plugin.id, true, state.projectPath);
            await saveInstalledPluginVersion(plugin.id, latestVersion, state.projectPath);
          } else {
            await enableLocalPlugin(plugin.id, true, state.projectPath);
            await saveLocalInstalledPluginVersion(plugin.id, latestVersion, state.projectPath);
          }

          // On fresh install, prompt for MCP server env vars if needed
          if (action === 'install') {
            modal.hideModal();
            await collectPluginEnvVars(plugin.name, plugin.marketplace);
          }
        }
        if (action !== 'install') {
          modal.hideModal();
        }
        fetchData();
      } catch (error) {
        modal.hideModal();
        await modal.message('Error', `Failed: ${error}`, 'error');
      }
    }
  };

  const handleUpdate = async () => {
    const item = selectableItems[pluginsState.selectedIndex];
    if (!item || item.type !== 'plugin' || !item.plugin?.hasUpdate) return;

    const plugin = item.plugin;
    const isGlobal = pluginsState.scope === 'global';

    modal.loading(`Updating ${plugin.name}...`);
    try {
      const versionToSave = plugin.version || '0.0.0';
      if (isGlobal) {
        await saveGlobalInstalledPluginVersion(plugin.id, versionToSave);
      } else {
        await saveInstalledPluginVersion(plugin.id, versionToSave, state.projectPath);
      }
      modal.hideModal();
      fetchData();
    } catch (error) {
      modal.hideModal();
      await modal.message('Error', `Failed to update: ${error}`, 'error');
    }
  };

  const handleUpdateAll = async () => {
    if (pluginsState.plugins.status !== 'success') return;

    const updatable = pluginsState.plugins.data.filter((p) => p.hasUpdate);
    if (updatable.length === 0) return;

    const isGlobal = pluginsState.scope === 'global';
    modal.loading(`Updating ${updatable.length} plugin(s)...`);

    try {
      for (const plugin of updatable) {
        const versionToSave = plugin.version || '0.0.0';
        if (isGlobal) {
          await saveGlobalInstalledPluginVersion(plugin.id, versionToSave);
        } else {
          await saveInstalledPluginVersion(plugin.id, versionToSave, state.projectPath);
        }
      }
      modal.hideModal();
      fetchData();
    } catch (error) {
      modal.hideModal();
      await modal.message('Error', `Failed to update: ${error}`, 'error');
    }
  };

  // Scope-specific toggle (install if not installed, uninstall if installed)
  const handleScopeToggle = async (scope: 'user' | 'project' | 'local') => {
    const item = selectableItems[pluginsState.selectedIndex];
    if (!item || item.type !== 'plugin' || !item.plugin) return;

    const plugin = item.plugin;
    const latestVersion = plugin.version || '0.0.0';
    const scopeLabel = scope === 'user' ? 'User' : scope === 'project' ? 'Project' : 'Local';

    // Check if installed in this scope
    const scopeData = scope === 'user' ? plugin.userScope :
                      scope === 'project' ? plugin.projectScope :
                      plugin.localScope;
    const isInstalledInScope = scopeData?.enabled;
    const installedVersion = scopeData?.version;

    // Check if this scope has an update available
    const hasUpdateInScope = isInstalledInScope && installedVersion &&
                             latestVersion !== '0.0.0' &&
                             installedVersion !== latestVersion;

    // Determine action: update if available, otherwise toggle install/uninstall
    let action: 'update' | 'install' | 'uninstall';
    if (isInstalledInScope && hasUpdateInScope) {
      action = 'update';
    } else if (isInstalledInScope) {
      action = 'uninstall';
    } else {
      action = 'install';
    }

    const actionLabel = action === 'update' ? `Updating ${scopeLabel}` :
                        action === 'install' ? `Installing to ${scopeLabel}` :
                        `Uninstalling from ${scopeLabel}`;
    modal.loading(`${actionLabel}...`);

    try {
      if (action === 'uninstall') {
        // Uninstall from this scope
        if (scope === 'user') {
          await enableGlobalPlugin(plugin.id, false);
          await removeGlobalInstalledPluginVersion(plugin.id);
        } else if (scope === 'project') {
          await enablePlugin(plugin.id, false, state.projectPath);
          await removeInstalledPluginVersion(plugin.id, state.projectPath);
        } else {
          await enableLocalPlugin(plugin.id, false, state.projectPath);
          await removeLocalInstalledPluginVersion(plugin.id, state.projectPath);
        }
      } else {
        // Install or update to this scope (both save the latest version)
        if (scope === 'user') {
          await enableGlobalPlugin(plugin.id, true);
          await saveGlobalInstalledPluginVersion(plugin.id, latestVersion);
        } else if (scope === 'project') {
          await enablePlugin(plugin.id, true, state.projectPath);
          await saveInstalledPluginVersion(plugin.id, latestVersion, state.projectPath);
        } else {
          await enableLocalPlugin(plugin.id, true, state.projectPath);
          await saveLocalInstalledPluginVersion(plugin.id, latestVersion, state.projectPath);
        }

        // On fresh install, prompt for MCP server env vars if needed
        if (action === 'install') {
          modal.hideModal();
          await collectPluginEnvVars(plugin.name, plugin.marketplace);
        }
      }
      if (action !== 'install') {
        modal.hideModal();
      }
      fetchData();
    } catch (error) {
      modal.hideModal();
      await modal.message('Error', `Failed: ${error}`, 'error');
    }
  };

  const handleUninstall = async () => {
    const item = selectableItems[pluginsState.selectedIndex];
    if (!item || item.type !== 'plugin' || !item.plugin) return;

    const plugin = item.plugin;

    // Build list of scopes where plugin is installed
    const installedScopes: { label: string; value: string }[] = [];
    if (plugin.userScope?.enabled) {
      const ver = plugin.userScope.version ? ` v${plugin.userScope.version}` : '';
      installedScopes.push({ label: `User (global)${ver}`, value: 'user' });
    }
    if (plugin.projectScope?.enabled) {
      const ver = plugin.projectScope.version ? ` v${plugin.projectScope.version}` : '';
      installedScopes.push({ label: `Project${ver}`, value: 'project' });
    }
    if (plugin.localScope?.enabled) {
      const ver = plugin.localScope.version ? ` v${plugin.localScope.version}` : '';
      installedScopes.push({ label: `Local${ver}`, value: 'local' });
    }

    if (installedScopes.length === 0) {
      await modal.message('Not Installed', `${plugin.name} is not installed in any scope.`, 'info');
      return;
    }

    const scopeValue = await modal.select(
      `Uninstall ${plugin.name}`,
      `Installed in ${installedScopes.length} scope(s):`,
      installedScopes
    );

    if (scopeValue === null) return; // Cancelled

    modal.loading(`Uninstalling ${plugin.name}...`);

    try {
      if (scopeValue === 'user') {
        await enableGlobalPlugin(plugin.id, false);
        await removeGlobalInstalledPluginVersion(plugin.id);
      } else if (scopeValue === 'project') {
        await enablePlugin(plugin.id, false, state.projectPath);
        await removeInstalledPluginVersion(plugin.id, state.projectPath);
      } else {
        // local scope
        await enableLocalPlugin(plugin.id, false, state.projectPath);
        await removeLocalInstalledPluginVersion(plugin.id, state.projectPath);
      }
      modal.hideModal();
      fetchData();
    } catch (error) {
      modal.hideModal();
      await modal.message('Error', `Failed to uninstall: ${error}`, 'error');
    }
  };

  // Render loading state
  if (pluginsState.marketplaces.status === 'loading' || pluginsState.plugins.status === 'loading') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="#7e57c2" bold>claudeup Plugins</Text>
        <Text color="gray">Loading...</Text>
      </Box>
    );
  }

  // Render error state
  if (pluginsState.marketplaces.status === 'error' || pluginsState.plugins.status === 'error') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="#7e57c2" bold>claudeup Plugins</Text>
        <Text color="red">Error loading data</Text>
      </Box>
    );
  }

  // Get selected item for detail panel
  const selectedItem = selectableItems[pluginsState.selectedIndex];

  // Render item with fuzzy highlight support
  const renderListItem = (item: ListItem, _idx: number, isSelected: boolean) => {
    if (item.type === 'category' && item.marketplace) {
      const mp = item.marketplace;
      // Differentiate marketplace types with appropriate badges
      let statusText = '';
      let statusColor = 'green';
      if (item.marketplaceEnabled) {
        if (mp.name === 'claude-plugins-official') {
          statusText = '★ Official';
          statusColor = 'yellow';
        } else if (mp.name === 'claude-code-plugins') {
          statusText = '⚠ Deprecated';
          statusColor = 'gray';
        } else if (mp.official) {
          statusText = '★ Official';
          statusColor = 'yellow';
        } else {
          statusText = '✓ Added';
          statusColor = 'green';
        }
      }

      if (isSelected) {
        const arrow = item.isExpanded ? '▼' : '▶';
        const count = item.pluginCount !== undefined && item.pluginCount > 0 ? ` (${item.pluginCount})` : '';
        return (
          <Text backgroundColor="magenta" color="white" bold>
            {` ${arrow} ${mp.displayName}${count} `}
          </Text>
        );
      }

      return (
        <CategoryHeader
          title={mp.displayName}
          expanded={item.isExpanded}
          count={item.pluginCount}
          status={statusText}
          statusColor={statusColor}
        />
      );
    }

    if (item.type === 'plugin' && item.plugin) {
      const plugin = item.plugin;
      let statusIcon = '○';
      let statusColor = 'gray';

      if (plugin.enabled) {
        statusIcon = '●';
        statusColor = 'green';
      } else if (plugin.installedVersion) {
        statusIcon = '●';
        statusColor = 'yellow';
      }

      // Build version string
      let versionStr = '';
      if (plugin.installedVersion && plugin.installedVersion !== '0.0.0') {
        versionStr = ` v${plugin.installedVersion}`;
        if (plugin.hasUpdate && plugin.version) {
          versionStr += ` → v${plugin.version}`;
        }
      }

      // Get fuzzy match highlights if available
      const matches = (item as ListItem & { _matches?: number[] })._matches;
      const segments = matches ? highlightMatches(plugin.name, matches) : null;

      if (isSelected) {
        const displayText = `   ${statusIcon} ${plugin.name}${versionStr} `;
        return (
          <Text backgroundColor="magenta" color="white" wrap="truncate">
            {displayText}
          </Text>
        );
      }

      // For non-selected, render with colors
      const displayName = segments
        ? segments.map(seg => seg.text).join('')
        : plugin.name;
      return (
        <Text wrap="truncate">
          <Text color={statusColor}>{'   '}{statusIcon} </Text>
          <Text>{displayName}</Text>
          <Text color={plugin.hasUpdate ? 'yellow' : 'gray'}>{versionStr}</Text>
        </Text>
      );
    }

    return <Text color="gray">{item.label}</Text>;
  };

  // Render detail content - compact to fit in available space
  const renderDetail = () => {
    if (!selectedItem) {
      return <Text color="gray">Select an item</Text>;
    }

    if (selectedItem.type === 'category' && selectedItem.marketplace) {
      const mp = selectedItem.marketplace;
      const isEnabled = selectedItem.marketplaceEnabled;

      // Get appropriate badge for marketplace type
      const getBadge = () => {
        if (mp.name === 'claude-plugins-official') return ' ★';
        if (mp.name === 'claude-code-plugins') return ' ⚠';
        if (mp.official) return ' ★';
        return '';
      };

      // Determine action hint based on state
      const isCollapsed = pluginsState.collapsedMarketplaces.has(mp.name);
      const hasPlugins = (selectedItem.pluginCount || 0) > 0;
      let actionHint = 'Add';
      if (isEnabled) {
        if (isCollapsed) {
          actionHint = 'Expand';
        } else if (hasPlugins) {
          actionHint = 'Collapse';
        } else {
          actionHint = 'Remove';
        }
      }

      return (
        <Box flexDirection="column">
          <Text bold color="cyan">{mp.displayName}{getBadge()}</Text>
          <Text color="gray" wrap="wrap">{mp.description || 'No description'}</Text>
          <Text color={isEnabled ? 'green' : 'gray'}>{isEnabled ? '● Added' : '○ Not added'}</Text>
          <Text color="blue" wrap="wrap">github.com/{mp.source.repo}</Text>
          <Text>Plugins: {selectedItem.pluginCount || 0}</Text>
          <Box marginTop={1}>
            <Text backgroundColor={isEnabled ? 'cyan' : 'green'} color="black"> Enter </Text>
            <Text color="gray"> {actionHint}</Text>
          </Box>
          {isEnabled && (
            <Box>
              <Text color="gray">← → to expand/collapse</Text>
            </Box>
          )}
        </Box>
      );
    }

    if (selectedItem.type === 'plugin' && selectedItem.plugin) {
      const plugin = selectedItem.plugin;
      const isInstalled = plugin.enabled || plugin.installedVersion;

      // Build component counts
      const components: string[] = [];
      if (plugin.agents?.length) components.push(`${plugin.agents.length} agents`);
      if (plugin.commands?.length) components.push(`${plugin.commands.length} commands`);
      if (plugin.skills?.length) components.push(`${plugin.skills.length} skills`);
      if (plugin.mcpServers?.length) components.push(`${plugin.mcpServers.length} MCP`);
      if (plugin.lspServers && Object.keys(plugin.lspServers).length) {
        components.push(`${Object.keys(plugin.lspServers).length} LSP`);
      }

      // Show version only if valid (not null, not 0.0.0)
      const showVersion = plugin.version && plugin.version !== '0.0.0';
      const showInstalledVersion = plugin.installedVersion && plugin.installedVersion !== '0.0.0';

      return (
        <Box flexDirection="column">
          {/* Plugin name header - centered */}
          <Box justifyContent="center">
            <Text backgroundColor="magenta" color="white" bold>
              {` ${plugin.name}${plugin.hasUpdate ? ' ⬆' : ''} `}
            </Text>
          </Box>

          {/* Status line */}
          <Box marginTop={1}>
            {isInstalled ? (
              <Text color={plugin.enabled ? 'green' : 'yellow'}>
                {plugin.enabled ? '● Enabled' : '● Disabled'}
              </Text>
            ) : (
              <Text color="gray">○ Not installed</Text>
            )}
          </Box>

          {/* Description */}
          <Box marginTop={1} marginBottom={1}>
            <Text color="white" wrap="wrap">{plugin.description}</Text>
          </Box>

          {/* Metadata */}
          {showVersion && (
            <Text><Text dimColor>Version  </Text><Text color="blue">v{plugin.version}</Text>{showInstalledVersion && plugin.installedVersion !== plugin.version && <Text dimColor> (v{plugin.installedVersion} installed)</Text>}</Text>
          )}
          {plugin.category && (
            <Text><Text dimColor>Category </Text><Text color="magenta">{plugin.category}</Text></Text>
          )}
          {plugin.author && (
            <Text><Text dimColor>Author   </Text><Text>{plugin.author.name}</Text></Text>
          )}
          {components.length > 0 && (
            <Text><Text dimColor>Contains </Text><Text color="yellow">{components.join(' · ')}</Text></Text>
          )}

          {/* Scope Status with shortcuts - each scope has its own color */}
          <Box flexDirection="column" marginTop={1}>
            <Text dimColor>────────────────────────</Text>
            <Text bold>Scopes:</Text>
            <Box marginTop={1} flexDirection="column">
              <Box>
                <Text backgroundColor="cyan" color="black"> u </Text>
                <Text color={plugin.userScope?.enabled ? 'cyan' : 'gray'}>
                  {plugin.userScope?.enabled ? ' ● ' : ' ○ '}
                </Text>
                <Text color="cyan">User</Text>
                <Text dimColor> global</Text>
                {plugin.userScope?.version && <Text color="cyan"> v{plugin.userScope.version}</Text>}
              </Box>
              <Box>
                <Text backgroundColor="green" color="black"> p </Text>
                <Text color={plugin.projectScope?.enabled ? 'green' : 'gray'}>
                  {plugin.projectScope?.enabled ? ' ● ' : ' ○ '}
                </Text>
                <Text color="green">Project</Text>
                <Text dimColor> team</Text>
                {plugin.projectScope?.version && <Text color="green"> v{plugin.projectScope.version}</Text>}
              </Box>
              <Box>
                <Text backgroundColor="yellow" color="black"> l </Text>
                <Text color={plugin.localScope?.enabled ? 'yellow' : 'gray'}>
                  {plugin.localScope?.enabled ? ' ● ' : ' ○ '}
                </Text>
                <Text color="yellow">Local</Text>
                <Text dimColor> private</Text>
                {plugin.localScope?.version && <Text color="yellow"> v{plugin.localScope.version}</Text>}
              </Box>
            </Box>
          </Box>

          {/* Additional actions */}
          {isInstalled && (
            <Box flexDirection="column" marginTop={1}>
              {plugin.hasUpdate && (
                <Box><Text backgroundColor="magenta" color="white"> U </Text><Text> Update to v{plugin.version}</Text></Box>
              )}
              <Box><Text backgroundColor="red" color="white"> d </Text><Text> Uninstall</Text></Box>
            </Box>
          )}
        </Box>
      );
    }

    return null;
  };

  const footerHints = isSearchActive
    ? 'Type to search │ Enter Confirm │ Esc Cancel'
    : 'u/p/l:scope │ U:update │ a:all │ d:remove │ /:search';

  // Calculate status for subtitle
  const scopeLabel = pluginsState.scope === 'global' ? 'Global' : 'Project';
  const plugins = pluginsState.plugins.status === 'success' ? pluginsState.plugins.data : [];
  const installedCount = plugins.filter(p => p.enabled).length;
  const updateCount = plugins.filter(p => p.hasUpdate).length;
  const subtitle = `${scopeLabel} │ ${installedCount} installed${updateCount > 0 ? ` │ ${updateCount} updates` : ''}`;

  // Search placeholder shows status when not searching
  const searchPlaceholder = `${scopeLabel} │ ${installedCount} installed${updateCount > 0 ? ` │ ${updateCount} ⬆` : ''} │ / to search`;

  return (
    <ScreenLayout
      title="claudeup Plugins"
      subtitle={subtitle}
      currentScreen="plugins"
      search={{
        isActive: isSearchActive,
        query: pluginsState.searchQuery,
        placeholder: searchPlaceholder,
      }}
      footerHints={footerHints}
      listPanel={
        <ScrollableList
          items={selectableItems}
          selectedIndex={pluginsState.selectedIndex}
          renderItem={renderListItem}
          maxHeight={dimensions.listPanelHeight}
        />
      }
      detailPanel={renderDetail()}
    />
  );
}

export default PluginsScreen;

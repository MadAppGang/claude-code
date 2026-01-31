import React, { useEffect, useCallback, useMemo } from "react";
import { useApp, useModal, useProgress } from "../state/AppContext.js";
import { useDimensions } from "../state/DimensionsContext.js";
import { useKeyboard } from "../hooks/useKeyboard.js";
import { ScreenLayout } from "../components/layout/index.js";
import { CategoryHeader } from "../components/CategoryHeader.js";
import { ScrollableList } from "../components/ScrollableList.js";
import { fuzzyFilter, highlightMatches } from "../../utils/fuzzy-search.js";
import { getAllMarketplaces } from "../../data/marketplaces.js";
import {
	getAvailablePlugins,
	refreshAllMarketplaces,
	clearMarketplaceCache,
	saveInstalledPluginVersion,
	removeInstalledPluginVersion,
	getLocalMarketplacesInfo,
	type PluginInfo,
} from "../../services/plugin-manager.js";
import {
	enablePlugin,
	enableGlobalPlugin,
	enableLocalPlugin,
	saveGlobalInstalledPluginVersion,
	removeGlobalInstalledPluginVersion,
	saveLocalInstalledPluginVersion,
	removeLocalInstalledPluginVersion,
	setMcpEnvVar,
	getMcpEnvVars,
} from "../../services/claude-settings.js";
import {
	getPluginEnvRequirements,
	getPluginSourcePath,
} from "../../services/plugin-mcp-config.js";
import type { Marketplace } from "../../types/index.js";

interface ListItem {
	id: string;
	type: "category" | "plugin";
	label: string;
	marketplace?: Marketplace;
	marketplaceEnabled?: boolean;
	plugin?: PluginInfo;
	pluginCount?: number;
	isExpanded?: boolean;
}

export function PluginsScreen() {
	const { state, dispatch } = useApp();
	const { plugins: pluginsState } = state;
	const modal = useModal();
	const progress = useProgress();
	const dimensions = useDimensions();

	const isSearchActive =
		state.isSearching &&
		state.currentRoute.screen === "plugins" &&
		!state.modal;

	// Fetch data (always fetches all scopes)
	const fetchData = useCallback(async () => {
		dispatch({ type: "PLUGINS_DATA_LOADING" });
		try {
			const localMarketplaces = await getLocalMarketplacesInfo();
			const allMarketplaces = getAllMarketplaces(localMarketplaces);

			// Always use getAvailablePlugins which fetches all scope data
			const pluginData = await getAvailablePlugins(state.projectPath);

			dispatch({
				type: "PLUGINS_DATA_SUCCESS",
				marketplaces: allMarketplaces,
				plugins: pluginData,
			});
		} catch (error) {
			dispatch({
				type: "PLUGINS_DATA_ERROR",
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
		if (
			pluginsState.marketplaces.status !== "success" ||
			pluginsState.plugins.status !== "success"
		) {
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
			const aDeprecated = a.name === "claude-code-plugins" ? 1 : 0;
			const bDeprecated = b.name === "claude-code-plugins" ? 1 : 0;
			return aDeprecated - bDeprecated;
		});

		const items: ListItem[] = [];

		for (const marketplace of sortedMarketplaces) {
			const marketplacePlugins =
				pluginsByMarketplace.get(marketplace.name) || [];
			const isCollapsed = collapsed.has(marketplace.name);
			const isEnabled = marketplacePlugins.length > 0 || marketplace.official;
			const hasPlugins = marketplacePlugins.length > 0;

			// Category header (marketplace)
			items.push({
				id: `mp:${marketplace.name}`,
				type: "category",
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
						type: "plugin",
						label: plugin.name,
						plugin,
					});
				}
			}
		}

		return items;
	}, [
		pluginsState.marketplaces,
		pluginsState.plugins,
		pluginsState.collapsedMarketplaces,
	]);

	// Filter items by search query
	const filteredItems = useMemo(() => {
		const query = pluginsState.searchQuery.trim();
		if (!query) return allItems;

		// Only search plugins, not categories
		const pluginItems = allItems.filter((item) => item.type === "plugin");
		const fuzzyResults = fuzzyFilter(pluginItems, query, (item) => item.label);

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
			if (item.type === "category" && item.marketplace) {
				if (matchedMarketplaces.has(item.marketplace.name)) {
					result.push(item);
					currentMarketplace = item.marketplace.name;
				} else {
					currentMarketplace = null;
				}
			} else if (item.type === "plugin" && item.plugin) {
				if (currentMarketplace === item.plugin.marketplace) {
					// Check if this plugin matched
					const matched = fuzzyResults.find((r) => r.item.id === item.id);
					if (matched) {
						result.push({ ...item, _matches: matched.matches } as ListItem & {
							_matches?: number[];
						});
					}
				}
			}
		}

		return result;
	}, [allItems, pluginsState.searchQuery]);

	// Only selectable items (plugins, not categories)
	const selectableItems = useMemo(() => {
		return filteredItems.filter(
			(item) => item.type === "plugin" || item.type === "category",
		);
	}, [filteredItems]);

	// Keyboard handling
	useKeyboard((event) => {
		// Handle search mode
		if (isSearchActive) {
			if (event.name === "escape") {
				dispatch({ type: "SET_SEARCHING", isSearching: false });
				dispatch({ type: "PLUGINS_SET_SEARCH", query: "" });
			} else if (event.name === "enter") {
				dispatch({ type: "SET_SEARCHING", isSearching: false });
				// Keep the search query, just exit search mode
			} else if (event.name === "backspace" || event.name === "delete") {
				dispatch({
					type: "PLUGINS_SET_SEARCH",
					query: pluginsState.searchQuery.slice(0, -1),
				});
			} else if (event.name.length === 1 && !event.ctrl && !event.meta) {
				dispatch({
					type: "PLUGINS_SET_SEARCH",
					query: pluginsState.searchQuery + event.name,
				});
			}
			return;
		}

		if (state.modal) return;

		// Start search with /
		if (event.name === "/") {
			dispatch({ type: "SET_SEARCHING", isSearching: true });
			return;
		}

		// Navigation
		if (event.name === "up" || event.name === "k") {
			const newIndex = Math.max(0, pluginsState.selectedIndex - 1);
			dispatch({ type: "PLUGINS_SELECT", index: newIndex });
		} else if (event.name === "down" || event.name === "j") {
			const newIndex = Math.min(
				selectableItems.length - 1,
				pluginsState.selectedIndex + 1,
			);
			dispatch({ type: "PLUGINS_SELECT", index: newIndex });
		}

		// Collapse/expand marketplace
		else if (
			(event.name === "left" || event.name === "right" || event.name === "<" || event.name === ">") &&
			selectableItems[pluginsState.selectedIndex]?.marketplace
		) {
			const item = selectableItems[pluginsState.selectedIndex];
			if (item?.marketplace) {
				dispatch({
					type: "PLUGINS_TOGGLE_MARKETPLACE",
					name: item.marketplace.name,
				});
			}
		}

		// Refresh
		else if (event.name === "r") {
			handleRefresh();
		}

		// New marketplace (show instructions)
		else if (event.name === "n") {
			handleShowAddMarketplaceInstructions();
		}

		// Team config help
		else if (event.name === "t") {
			handleShowTeamConfigHelp();
		}

		// Scope-specific toggle shortcuts (u/p/l)
		else if (event.name === "u") {
			handleScopeToggle("user");
		} else if (event.name === "p") {
			handleScopeToggle("project");
		} else if (event.name === "l") {
			handleScopeToggle("local");
		}

		// Update plugin (Shift+U)
		else if (event.name === "U") {
			handleUpdate();
		}

		// Update all
		else if (event.name === "a") {
			handleUpdateAll();
		}

		// Delete/uninstall
		else if (event.name === "d") {
			handleUninstall();
		}

		// Enter for selection
		else if (event.name === "enter") {
			handleSelect();
		}
	});

	// Handle actions
	const handleRefresh = async () => {
		progress.show("Refreshing cache...");
		try {
			const result = await refreshAllMarketplaces((p) => {
				progress.show(`${p.name}`, p.current, p.total);
			});
			clearMarketplaceCache();
			progress.hide();

			// Build message
			let message =
				"Cache refreshed.\n\n" +
				"To update marketplaces from GitHub, run in Claude Code:\n" +
				"  /plugin marketplace update\n\n" +
				"Then refresh claudeup again with 'r'.";

			if (result.repair.length > 0) {
				const totalRepaired = result.repair.reduce(
					(sum, r) => sum + r.repaired.length,
					0,
				);
				message += `\n\nAuto-repaired ${totalRepaired} plugin(s) with missing agents/commands.`;
			}

			await modal.message("Refreshed", message, "success");
			fetchData();
		} catch (error) {
			progress.hide();
			await modal.message("Error", `Refresh failed: ${error}`, "error");
		}
	};

	const handleShowAddMarketplaceInstructions = async () => {
		await modal.message(
			"Add Marketplace",
			"To add a marketplace, run this command in your terminal:\n\n" +
				"  claude marketplace add owner/repo\n\n" +
				"Examples:\n" +
				"  claude marketplace add MadAppGang/claude-code\n" +
				"  claude marketplace add anthropics/claude-plugins-official\n\n" +
				"Auto-update is enabled by default for new marketplaces.\n\n" +
				"After adding, refresh claudeup with 'r' to see the new marketplace.",
			"info",
		);
	};

	const handleShowTeamConfigHelp = async () => {
		const helpText =
			"TEAM CONFIGURATION FOR MARKETPLACES\n\n" +
			"To configure marketplaces for your entire team:\n\n" +
			"1. Add to .claude/settings.json (committed to git):\n\n" +
			"   {\n" +
			'     "extraKnownMarketplaces": {\n' +
			'       "company-tools": {\n' +
			'         "source": {\n' +
			'           "source": "github",\n' +
			'           "repo": "your-org/claude-plugins"\n' +
			"         }\n" +
			"       }\n" +
			"     },\n" +
			'     "enabledPlugins": {\n' +
			'       "code-formatter@company-tools": true\n' +
			"     }\n" +
			"   }\n\n" +
			"2. Team members get prompted to install when they trust the folder\n\n" +
			"3. Marketplaces are GLOBAL ONLY (managed by Claude Code)\n" +
			"   - Not project-specific\n" +
			"   - All team members share the same marketplace cache\n\n" +
			"NOTE: Individual plugin enablement is still project-specific.\n" +
			'Use "Project" scope in claudeup to enable for the team.';

		await modal.message("Team Configuration", helpText, "info");
	};

	/**
	 * Collect environment variables required by a plugin's MCP servers
	 * Prompts user for missing values and saves to local settings
	 */
	const collectPluginEnvVars = async (
		pluginName: string,
		marketplace: string,
	): Promise<boolean> => {
		try {
			// Get plugin source path from marketplace manifest
			const pluginSource = await getPluginSourcePath(marketplace, pluginName);
			if (!pluginSource) return true; // No source path, nothing to configure

			// Get env var requirements from plugin's MCP config
			const requirements = await getPluginEnvRequirements(
				marketplace,
				pluginSource,
			);
			if (requirements.length === 0) return true; // No env vars needed

			// Get existing env vars
			const existingEnvVars = await getMcpEnvVars(state.projectPath);
			const missingVars = requirements.filter(
				(req) => !existingEnvVars[req.name] && !process.env[req.name],
			);

			if (missingVars.length === 0) return true; // All vars already configured

			// Ask user if they want to configure MCP server env vars now
			const serverNames = [...new Set(missingVars.map((v) => v.serverName))];
			const wantToConfigure = await modal.confirm(
				"Configure MCP Servers?",
				`This plugin includes MCP servers (${serverNames.join(", ")}) that need ${missingVars.length} environment variable(s).\n\nConfigure now?`,
			);

			if (!wantToConfigure) {
				await modal.message(
					"Skipped Configuration",
					"You can configure these variables later in the Environment Variables screen (press 4).",
					"info",
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
						`${req.name} is already set in your environment.\n\nUse the existing value?`,
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
					"",
				);

				if (value === null) {
					// User cancelled
					await modal.message(
						"Configuration Incomplete",
						`Skipped remaining configuration.\nYou can configure these later in Environment Variables (press 4).`,
						"info",
					);
					return true; // Still installed
				}

				if (value) {
					await setMcpEnvVar(req.name, value, state.projectPath);
				}
			}

			return true;
		} catch (error) {
			console.error("Error collecting plugin env vars:", error);
			return true; // Don't block installation on config errors
		}
	};

	const handleSelect = async () => {
		const item = selectableItems[pluginsState.selectedIndex];
		if (!item) return;

		if (item.type === "category" && item.marketplace) {
			const mp = item.marketplace;

			if (item.marketplaceEnabled) {
				const isCollapsed = pluginsState.collapsedMarketplaces.has(mp.name);

				// If collapsed, expand first (even if no plugins - they might load)
				if (isCollapsed) {
					dispatch({ type: "PLUGINS_TOGGLE_MARKETPLACE", name: mp.name });
				} else if (item.pluginCount && item.pluginCount > 0) {
					// If expanded with plugins, collapse
					dispatch({ type: "PLUGINS_TOGGLE_MARKETPLACE", name: mp.name });
				} else {
					// If expanded with no plugins, show removal instructions
					await modal.message(
						`Remove ${mp.displayName}?`,
						`To remove this marketplace, run in Claude Code:\n\n` +
							`  /plugin marketplace remove ${mp.name}\n\n` +
							`After removing, refresh claudeup with 'r' to update the display.`,
						"info",
					);
				}
			} else {
				// Show add marketplace instructions
				await modal.message(
					`Add ${mp.displayName}?`,
					`To add this marketplace, run in your terminal:\n\n` +
						`  claude marketplace add ${mp.source.repo || mp.name}\n\n` +
						`Auto-update is enabled by default.\n\n` +
						`After adding, refresh claudeup with 'r' to see it.`,
					"info",
				);
			}
		} else if (item.type === "plugin" && item.plugin) {
			const plugin = item.plugin;
			const latestVersion = plugin.version || "0.0.0";

			// Build scope options with status info
			const buildScopeLabel = (
				name: string,
				scope: { enabled?: boolean; version?: string } | undefined,
				desc: string,
			) => {
				const installed = scope?.enabled;
				const ver = scope?.version;
				const hasUpdate =
					ver &&
					latestVersion &&
					ver !== latestVersion &&
					latestVersion !== "0.0.0";

				let label = installed ? `● ${name}` : `○ ${name}`;
				label += ` (${desc})`;
				if (ver) label += ` v${ver}`;
				if (hasUpdate) label += ` → v${latestVersion}`;
				return label;
			};

			const scopeOptions = [
				{
					label: buildScopeLabel("User", plugin.userScope, "global"),
					value: "user",
				},
				{
					label: buildScopeLabel("Project", plugin.projectScope, "team"),
					value: "project",
				},
				{
					label: buildScopeLabel("Local", plugin.localScope, "private"),
					value: "local",
				},
			];

			const scopeValue = await modal.select(
				plugin.name,
				`Select scope to toggle:`,
				scopeOptions,
			);

			if (scopeValue === null) return; // Cancelled

			// Determine action based on selected scope's current state
			const selectedScope =
				scopeValue === "user"
					? plugin.userScope
					: scopeValue === "project"
						? plugin.projectScope
						: plugin.localScope;
			const isInstalledInScope = selectedScope?.enabled;
			const installedVersion = selectedScope?.version;
			const scopeLabel =
				scopeValue === "user"
					? "User"
					: scopeValue === "project"
						? "Project"
						: "Local";

			// Check if this scope has an update available
			const hasUpdateInScope =
				isInstalledInScope &&
				installedVersion &&
				latestVersion !== "0.0.0" &&
				installedVersion !== latestVersion;

			// Determine action: update if available, otherwise toggle
			let action: "update" | "install" | "uninstall";
			if (isInstalledInScope && hasUpdateInScope) {
				action = "update";
			} else if (isInstalledInScope) {
				action = "uninstall";
			} else {
				action = "install";
			}

			const actionLabel =
				action === "update"
					? `Updating ${scopeLabel}`
					: action === "install"
						? `Installing to ${scopeLabel}`
						: `Uninstalling from ${scopeLabel}`;
			modal.loading(`${actionLabel}...`);

			try {
				if (action === "uninstall") {
					// Uninstall from this scope
					if (scopeValue === "user") {
						await enableGlobalPlugin(plugin.id, false);
						await removeGlobalInstalledPluginVersion(plugin.id);
					} else if (scopeValue === "project") {
						await enablePlugin(plugin.id, false, state.projectPath);
						await removeInstalledPluginVersion(plugin.id, state.projectPath);
					} else {
						await enableLocalPlugin(plugin.id, false, state.projectPath);
						await removeLocalInstalledPluginVersion(
							plugin.id,
							state.projectPath,
						);
					}
				} else {
					// Install or update (both save the latest version)
					if (scopeValue === "user") {
						await enableGlobalPlugin(plugin.id, true);
						await saveGlobalInstalledPluginVersion(plugin.id, latestVersion);
					} else if (scopeValue === "project") {
						await enablePlugin(plugin.id, true, state.projectPath);
						await saveInstalledPluginVersion(
							plugin.id,
							latestVersion,
							state.projectPath,
						);
					} else {
						await enableLocalPlugin(plugin.id, true, state.projectPath);
						await saveLocalInstalledPluginVersion(
							plugin.id,
							latestVersion,
							state.projectPath,
						);
					}

					// On fresh install, prompt for MCP server env vars if needed
					if (action === "install") {
						modal.hideModal();
						await collectPluginEnvVars(plugin.name, plugin.marketplace);
					}
				}
				if (action !== "install") {
					modal.hideModal();
				}
				fetchData();
			} catch (error) {
				modal.hideModal();
				await modal.message("Error", `Failed: ${error}`, "error");
			}
		}
	};

	const handleUpdate = async () => {
		const item = selectableItems[pluginsState.selectedIndex];
		if (!item || item.type !== "plugin" || !item.plugin?.hasUpdate) return;

		const plugin = item.plugin;
		const isGlobal = pluginsState.scope === "global";

		modal.loading(`Updating ${plugin.name}...`);
		try {
			const versionToSave = plugin.version || "0.0.0";
			if (isGlobal) {
				await saveGlobalInstalledPluginVersion(plugin.id, versionToSave);
			} else {
				await saveInstalledPluginVersion(
					plugin.id,
					versionToSave,
					state.projectPath,
				);
			}
			modal.hideModal();
			fetchData();
		} catch (error) {
			modal.hideModal();
			await modal.message("Error", `Failed to update: ${error}`, "error");
		}
	};

	const handleUpdateAll = async () => {
		if (pluginsState.plugins.status !== "success") return;

		const updatable = pluginsState.plugins.data.filter((p) => p.hasUpdate);
		if (updatable.length === 0) return;

		const isGlobal = pluginsState.scope === "global";
		modal.loading(`Updating ${updatable.length} plugin(s)...`);

		try {
			for (const plugin of updatable) {
				const versionToSave = plugin.version || "0.0.0";
				if (isGlobal) {
					await saveGlobalInstalledPluginVersion(plugin.id, versionToSave);
				} else {
					await saveInstalledPluginVersion(
						plugin.id,
						versionToSave,
						state.projectPath,
					);
				}
			}
			modal.hideModal();
			fetchData();
		} catch (error) {
			modal.hideModal();
			await modal.message("Error", `Failed to update: ${error}`, "error");
		}
	};

	// Scope-specific toggle (install if not installed, uninstall if installed)
	const handleScopeToggle = async (scope: "user" | "project" | "local") => {
		const item = selectableItems[pluginsState.selectedIndex];
		if (!item || item.type !== "plugin" || !item.plugin) return;

		const plugin = item.plugin;
		const latestVersion = plugin.version || "0.0.0";
		const scopeLabel =
			scope === "user" ? "User" : scope === "project" ? "Project" : "Local";

		// Check if installed in this scope
		const scopeData =
			scope === "user"
				? plugin.userScope
				: scope === "project"
					? plugin.projectScope
					: plugin.localScope;
		const isInstalledInScope = scopeData?.enabled;
		const installedVersion = scopeData?.version;

		// Check if this scope has an update available
		const hasUpdateInScope =
			isInstalledInScope &&
			installedVersion &&
			latestVersion !== "0.0.0" &&
			installedVersion !== latestVersion;

		// Determine action: update if available, otherwise toggle install/uninstall
		let action: "update" | "install" | "uninstall";
		if (isInstalledInScope && hasUpdateInScope) {
			action = "update";
		} else if (isInstalledInScope) {
			action = "uninstall";
		} else {
			action = "install";
		}

		const actionLabel =
			action === "update"
				? `Updating ${scopeLabel}`
				: action === "install"
					? `Installing to ${scopeLabel}`
					: `Uninstalling from ${scopeLabel}`;
		modal.loading(`${actionLabel}...`);

		try {
			if (action === "uninstall") {
				// Uninstall from this scope
				if (scope === "user") {
					await enableGlobalPlugin(plugin.id, false);
					await removeGlobalInstalledPluginVersion(plugin.id);
				} else if (scope === "project") {
					await enablePlugin(plugin.id, false, state.projectPath);
					await removeInstalledPluginVersion(plugin.id, state.projectPath);
				} else {
					await enableLocalPlugin(plugin.id, false, state.projectPath);
					await removeLocalInstalledPluginVersion(plugin.id, state.projectPath);
				}
			} else {
				// Install or update to this scope (both save the latest version)
				if (scope === "user") {
					await enableGlobalPlugin(plugin.id, true);
					await saveGlobalInstalledPluginVersion(plugin.id, latestVersion);
				} else if (scope === "project") {
					await enablePlugin(plugin.id, true, state.projectPath);
					await saveInstalledPluginVersion(
						plugin.id,
						latestVersion,
						state.projectPath,
					);
				} else {
					await enableLocalPlugin(plugin.id, true, state.projectPath);
					await saveLocalInstalledPluginVersion(
						plugin.id,
						latestVersion,
						state.projectPath,
					);
				}

				// On fresh install, prompt for MCP server env vars if needed
				if (action === "install") {
					modal.hideModal();
					await collectPluginEnvVars(plugin.name, plugin.marketplace);
				}
			}
			if (action !== "install") {
				modal.hideModal();
			}
			fetchData();
		} catch (error) {
			modal.hideModal();
			await modal.message("Error", `Failed: ${error}`, "error");
		}
	};

	const handleUninstall = async () => {
		const item = selectableItems[pluginsState.selectedIndex];
		if (!item || item.type !== "plugin" || !item.plugin) return;

		const plugin = item.plugin;

		// Build list of scopes where plugin is installed
		const installedScopes: { label: string; value: string }[] = [];
		if (plugin.userScope?.enabled) {
			const ver = plugin.userScope.version
				? ` v${plugin.userScope.version}`
				: "";
			installedScopes.push({ label: `User (global)${ver}`, value: "user" });
		}
		if (plugin.projectScope?.enabled) {
			const ver = plugin.projectScope.version
				? ` v${plugin.projectScope.version}`
				: "";
			installedScopes.push({ label: `Project${ver}`, value: "project" });
		}
		if (plugin.localScope?.enabled) {
			const ver = plugin.localScope.version
				? ` v${plugin.localScope.version}`
				: "";
			installedScopes.push({ label: `Local${ver}`, value: "local" });
		}

		if (installedScopes.length === 0) {
			await modal.message(
				"Not Installed",
				`${plugin.name} is not installed in any scope.`,
				"info",
			);
			return;
		}

		const scopeValue = await modal.select(
			`Uninstall ${plugin.name}`,
			`Installed in ${installedScopes.length} scope(s):`,
			installedScopes,
		);

		if (scopeValue === null) return; // Cancelled

		modal.loading(`Uninstalling ${plugin.name}...`);

		try {
			if (scopeValue === "user") {
				await enableGlobalPlugin(plugin.id, false);
				await removeGlobalInstalledPluginVersion(plugin.id);
			} else if (scopeValue === "project") {
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
			await modal.message("Error", `Failed to uninstall: ${error}`, "error");
		}
	};

	// Render loading state
	if (
		pluginsState.marketplaces.status === "loading" ||
		pluginsState.plugins.status === "loading"
	) {
		return (
			<box flexDirection="column" paddingLeft={1} paddingRight={1}>
				<text fg="#7e57c2"><strong>claudeup Plugins</strong></text>
				<text fg="gray">Loading...</text>
			</box>
		);
	}

	// Render error state
	if (
		pluginsState.marketplaces.status === "error" ||
		pluginsState.plugins.status === "error"
	) {
		return (
			<box flexDirection="column" paddingLeft={1} paddingRight={1}>
				<text fg="#7e57c2"><strong>claudeup Plugins</strong></text>
				<text fg="red">Error loading data</text>
			</box>
		);
	}

	// Get selected item for detail panel
	const selectedItem = selectableItems[pluginsState.selectedIndex];

	// Render item with fuzzy highlight support
	const renderListItem = (
		item: ListItem,
		_idx: number,
		isSelected: boolean,
	) => {
		if (item.type === "category" && item.marketplace) {
			const mp = item.marketplace;
			// Differentiate marketplace types with appropriate badges
			let statusText = "";
			let statusColor = "green";
			if (item.marketplaceEnabled) {
				if (mp.name === "claude-plugins-official") {
					statusText = "★ Official";
					statusColor = "yellow";
				} else if (mp.name === "claude-code-plugins") {
					statusText = "⚠ Deprecated";
					statusColor = "gray";
				} else if (mp.official) {
					statusText = "★ Official";
					statusColor = "yellow";
				} else {
					statusText = "✓ Added";
					statusColor = "green";
				}
			}

			if (isSelected) {
				const arrow = item.isExpanded ? "▼" : "▶";
				const count =
					item.pluginCount !== undefined && item.pluginCount > 0
						? ` (${item.pluginCount})`
						: "";
				return (
					<text bg="magenta" fg="white"><strong> {arrow} {mp.displayName}{count} </strong></text>
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

		if (item.type === "plugin" && item.plugin) {
			const plugin = item.plugin;
			let statusIcon = "○";
			let statusColor = "gray";

			if (plugin.enabled) {
				statusIcon = "●";
				statusColor = "green";
			} else if (plugin.installedVersion) {
				statusIcon = "●";
				statusColor = "yellow";
			}

			// Build version string
			let versionStr = "";
			if (plugin.installedVersion && plugin.installedVersion !== "0.0.0") {
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
					<text bg="magenta" fg="white">
						{displayText}
					</text>
				);
			}

			// For non-selected, render with colors
			const displayName = segments
				? segments.map((seg) => seg.text).join("")
				: plugin.name;
			return (
				<text>
					<span fg={statusColor}>{"   "}{statusIcon} </span>
					<span>{displayName}</span>
					<span fg={plugin.hasUpdate ? "yellow" : "gray"}>{versionStr}</span>
				</text>
			);
		}

		return <text fg="gray">{item.label}</text>;
	};

	// Render detail content - compact to fit in available space
	const renderDetail = () => {
		if (!selectedItem) {
			return <text fg="gray">Select an item</text>;
		}

		if (selectedItem.type === "category" && selectedItem.marketplace) {
			const mp = selectedItem.marketplace;
			const isEnabled = selectedItem.marketplaceEnabled;

			// Get appropriate badge for marketplace type
			const getBadge = () => {
				if (mp.name === "claude-plugins-official") return " ★";
				if (mp.name === "claude-code-plugins") return " ⚠";
				if (mp.official) return " ★";
				return "";
			};

			// Determine action hint based on state
			const isCollapsed = pluginsState.collapsedMarketplaces.has(mp.name);
			const hasPlugins = (selectedItem.pluginCount || 0) > 0;
			let actionHint = "Add";
			if (isEnabled) {
				if (isCollapsed) {
					actionHint = "Expand";
				} else if (hasPlugins) {
					actionHint = "Collapse";
				} else {
					actionHint = "Remove";
				}
			}

			return (
				<box flexDirection="column">
					<text fg="cyan"><strong>{mp.displayName}{getBadge()}</strong></text>
					<text fg="gray">{mp.description || "No description"}</text>
					<text fg={isEnabled ? "green" : "gray"}>
						{isEnabled ? "● Added" : "○ Not added"}
					</text>
					<text fg="blue">github.com/{mp.source.repo}</text>
					<text>Plugins: {selectedItem.pluginCount || 0}</text>
					<box marginTop={1}>
						<text bg={isEnabled ? "cyan" : "green"} fg="black"> Enter </text>
						<text fg="gray"> {actionHint}</text>
					</box>
					{isEnabled && (
						<box>
							<text fg="gray">← → to expand/collapse</text>
						</box>
					)}
				</box>
			);
		}

		if (selectedItem.type === "plugin" && selectedItem.plugin) {
			const plugin = selectedItem.plugin;
			const isInstalled = plugin.enabled || plugin.installedVersion;

			// Build component counts
			const components: string[] = [];
			if (plugin.agents?.length)
				components.push(`${plugin.agents.length} agents`);
			if (plugin.commands?.length)
				components.push(`${plugin.commands.length} commands`);
			if (plugin.skills?.length)
				components.push(`${plugin.skills.length} skills`);
			if (plugin.mcpServers?.length)
				components.push(`${plugin.mcpServers.length} MCP`);
			if (plugin.lspServers && Object.keys(plugin.lspServers).length) {
				components.push(`${Object.keys(plugin.lspServers).length} LSP`);
			}

			// Show version only if valid (not null, not 0.0.0)
			const showVersion = plugin.version && plugin.version !== "0.0.0";
			const showInstalledVersion =
				plugin.installedVersion && plugin.installedVersion !== "0.0.0";

			return (
				<box flexDirection="column">
					{/* Plugin name header - centered */}
					<box justifyContent="center">
						<text bg="magenta" fg="white"><strong> {plugin.name}{plugin.hasUpdate ? " ⬆" : ""} </strong></text>
					</box>

					{/* Status line */}
					<box marginTop={1}>
						{isInstalled ? (
							<text fg={plugin.enabled ? "green" : "yellow"}>
								{plugin.enabled ? "● Enabled" : "● Disabled"}
							</text>
						) : (
							<text fg="gray">○ Not installed</text>
						)}
					</box>

					{/* Description */}
					<box marginTop={1} marginBottom={1}>
						<text fg="white">{plugin.description}</text>
					</box>

					{/* Metadata */}
					{showVersion && (
						<text>
							<span>Version </span>
							<span fg="blue">v{plugin.version}</span>
							{showInstalledVersion &&
								plugin.installedVersion !== plugin.version && (
									<span> (v{plugin.installedVersion} installed)</span>
								)}
						</text>
					)}
					{plugin.category && (
						<text>
							<span>Category </span>
							<span fg="magenta">{plugin.category}</span>
						</text>
					)}
					{plugin.author && (
						<text>
							<span>Author </span>
							<span>{plugin.author.name}</span>
						</text>
					)}
					{components.length > 0 && (
						<text>
							<span>Contains </span>
							<span fg="yellow">{components.join(" · ")}</span>
						</text>
					)}

					{/* Scope Status with shortcuts - each scope has its own color */}
					<box flexDirection="column" marginTop={1}>
						<text>────────────────────────</text>
						<text><strong>Scopes:</strong></text>
						<box marginTop={1} flexDirection="column">
							<text>
								<span bg="cyan" fg="black"> u </span>
								<span fg={plugin.userScope?.enabled ? "cyan" : "gray"}>
									{plugin.userScope?.enabled ? " ● " : " ○ "}
								</span>
								<span fg="cyan">User</span>
								<span> global</span>
								{plugin.userScope?.version && (
									<span fg="cyan"> v{plugin.userScope.version}</span>
								)}
							</text>
							<text>
								<span bg="green" fg="black"> p </span>
								<span fg={plugin.projectScope?.enabled ? "green" : "gray"}>
									{plugin.projectScope?.enabled ? " ● " : " ○ "}
								</span>
								<span fg="green">Project</span>
								<span> team</span>
								{plugin.projectScope?.version && (
									<span fg="green"> v{plugin.projectScope.version}</span>
								)}
							</text>
							<text>
								<span bg="yellow" fg="black"> l </span>
								<span fg={plugin.localScope?.enabled ? "yellow" : "gray"}>
									{plugin.localScope?.enabled ? " ● " : " ○ "}
								</span>
								<span fg="yellow">Local</span>
								<span> private</span>
								{plugin.localScope?.version && (
									<span fg="yellow"> v{plugin.localScope.version}</span>
								)}
							</text>
						</box>
					</box>

					{/* Additional actions */}
					{isInstalled && (
						<box flexDirection="column" marginTop={1}>
							{plugin.hasUpdate && (
								<box>
									<text bg="magenta" fg="white"> U </text>
									<text> Update to v{plugin.version}</text>
								</box>
							)}
							<box>
								<text bg="red" fg="white"> d </text>
								<text> Uninstall</text>
							</box>
						</box>
					)}
				</box>
			);
		}

		return null;
	};

	const footerHints = isSearchActive
		? "Type to search │ Enter Confirm │ Esc Cancel"
		: "u/p/l:scope │ U:update │ a:all │ d:remove │ n:add │ t:team │ /:search";

	// Calculate status for subtitle
	const scopeLabel = pluginsState.scope === "global" ? "Global" : "Project";
	const plugins =
		pluginsState.plugins.status === "success" ? pluginsState.plugins.data : [];
	const installedCount = plugins.filter((p) => p.enabled).length;
	const updateCount = plugins.filter((p) => p.hasUpdate).length;
	const subtitle = `${scopeLabel} │ ${installedCount} installed${updateCount > 0 ? ` │ ${updateCount} updates` : ""}`;

	// Search placeholder shows status when not searching
	const searchPlaceholder = `${scopeLabel} │ ${installedCount} installed${updateCount > 0 ? ` │ ${updateCount} ⬆` : ""} │ / to search`;

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

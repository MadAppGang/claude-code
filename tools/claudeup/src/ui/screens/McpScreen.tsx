import React, { useEffect, useCallback, useMemo } from "react";
import { useApp, useModal, useNavigation } from "../state/AppContext.js";
import { useDimensions } from "../state/DimensionsContext.js";
import { useKeyboard } from "../hooks/useKeyboard.js";
import { ScreenLayout } from "../components/layout/index.js";
import { ScrollableList } from "../components/ScrollableList.js";
import {
	getMcpServersByCategory,
	getCategoryDisplayName,
	categoryOrder,
} from "../../data/mcp-servers.js";
import {
	addMcpServer,
	removeMcpServer,
	getInstalledMcpServers,
	getEnabledMcpServers,
} from "../../services/claude-settings.js";
import type { McpServer, McpServerConfig } from "../../types/index.js";

interface ListItem {
	label: string;
	server?: McpServer;
	isCategory?: boolean;
}

export function McpScreen() {
	const { state, dispatch } = useApp();
	const { mcp } = state;
	const modal = useModal();
	const { navigateToScreen } = useNavigation();
	const dimensions = useDimensions();

	// Fetch data
	const fetchData = useCallback(async () => {
		dispatch({ type: "MCP_DATA_LOADING" });
		try {
			const serversByCategory = getMcpServersByCategory();
			const installedServers = await getInstalledMcpServers(state.projectPath);
			const enabledServers = await getEnabledMcpServers(state.projectPath);

			// Build flat list of all servers
			const servers: McpServer[] = [];
			for (const category of categoryOrder) {
				const categoryServers = serversByCategory[category];
				if (categoryServers) {
					servers.push(...categoryServers);
				}
			}

			// Convert McpServerConfig to boolean - server exists = installed
			const installedAsBooleans: Record<string, boolean> = {};
			for (const name of Object.keys(installedServers)) {
				installedAsBooleans[name] = true;
			}

			dispatch({
				type: "MCP_DATA_SUCCESS",
				servers,
				installedServers: { ...installedAsBooleans, ...enabledServers },
			});
		} catch (error) {
			dispatch({
				type: "MCP_DATA_ERROR",
				error: error instanceof Error ? error : new Error(String(error)),
			});
		}
	}, [dispatch, state.projectPath]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Build list items with categories
	const allListItems = useMemo((): ListItem[] => {
		if (mcp.servers.status !== "success") return [];

		const serversByCategory = getMcpServersByCategory();
		const items: ListItem[] = [];

		for (const category of categoryOrder) {
			const servers = serversByCategory[category];
			if (!servers || servers.length === 0) continue;

			items.push({
				label: getCategoryDisplayName(category),
				isCategory: true,
			});

			for (const server of servers) {
				const isInstalled = mcp.installedServers[server.name] !== undefined;
				const isEnabled = mcp.installedServers[server.name] === true;

				let status = "○";
				if (isInstalled && isEnabled) {
					status = "●";
				} else if (isInstalled) {
					status = "●";
				}

				const configTag = server.requiresConfig ? " *" : "";

				items.push({
					label: `  ${status} ${server.name}${configTag}`,
					server,
				});
			}
		}

		return items;
	}, [mcp.servers.status, mcp.installedServers]);

	// Use all items - search goes to global registry, not local filter
	const listItems = allListItems;

	// Keyboard handling
	useKeyboard((event) => {
		if (state.isSearching || state.modal) return;

		// Start search - navigate to registry with search mode active
		if (event.name === "/") {
			dispatch({ type: "SET_SEARCHING", isSearching: true });
			navigateToScreen("mcp-registry");
			return;
		}

		if (event.name === "up" || event.name === "k") {
			const newIndex = Math.max(0, mcp.selectedIndex - 1);
			dispatch({ type: "MCP_SELECT", index: newIndex });
		} else if (event.name === "down" || event.name === "j") {
			const newIndex = Math.min(listItems.length - 1, mcp.selectedIndex + 1);
			dispatch({ type: "MCP_SELECT", index: newIndex });
		} else if (event.name === "r") {
			navigateToScreen("mcp-registry");
		} else if (event.name === "enter") {
			handleSelect();
		}
	});

	const handleSelect = async () => {
		const item = listItems[mcp.selectedIndex];
		if (!item || item.isCategory || !item.server) return;

		const server = item.server;
		const isInstalled = mcp.installedServers[server.name] !== undefined;

		if (isInstalled) {
			const confirmed = await modal.confirm(
				`Remove ${server.name}?`,
				"This will remove the MCP server configuration.",
			);
			if (confirmed) {
				modal.loading(`Removing ${server.name}...`);
				try {
					await removeMcpServer(server.name, state.projectPath);
					modal.hideModal();
					await modal.message(
						"Removed",
						`${server.name} has been removed.`,
						"success",
					);
					fetchData();
				} catch (error) {
					modal.hideModal();
					await modal.message("Error", `Failed to remove: ${error}`, "error");
				}
			}
		} else {
			// Install server
			await installMcpServer(server);
		}
	};

	const installMcpServer = async (server: McpServer) => {
		let config: McpServerConfig;

		if (server.type === "http") {
			config = { type: "http", url: server.url! };
		} else {
			config = {
				command: server.command!,
				args: server.args ? [...server.args] : undefined,
				env: server.env ? { ...server.env } : undefined,
			};
		}

		// Handle configuration fields if required
		if (server.requiresConfig && server.configFields) {
			for (const field of server.configFields) {
				const envVarName = field.envVar || field.name;
				const existingValue = process.env[envVarName];

				if (existingValue) {
					const useExisting = await modal.confirm(
						`Use ${envVarName}?`,
						`${envVarName} is set in your environment. Use the existing value?`,
					);
					if (useExisting) {
						config.env = config.env || {};
						config.env[envVarName] = `\${${envVarName}}`;
						continue;
					}
				}

				const value = await modal.input(
					`Configure ${server.name}`,
					`${field.label}${field.required ? " (required)" : ""}:`,
					field.default,
				);

				if (value === null) return; // User cancelled

				if (field.required && !value) {
					await modal.message(
						"Required Field",
						`${field.label} is required.`,
						"error",
					);
					return;
				}

				if (value) {
					config.env = config.env || {};
					config.env[envVarName] = value;
				}
			}
		}

		modal.loading(`Installing ${server.name}...`);
		try {
			await addMcpServer(server.name, config, state.projectPath);
			modal.hideModal();
			await modal.message(
				"Installed",
				`${server.name} has been configured.\n\nRestart Claude Code to activate.`,
				"success",
			);
			fetchData();
		} catch (error) {
			modal.hideModal();
			await modal.message("Error", `Failed to install: ${error}`, "error");
		}
	};

	// Get selected item
	const selectedItem = listItems[mcp.selectedIndex];

	const renderDetail = () => {
		if (mcp.servers.status === "loading") {
			return <text fg="gray">Loading MCP servers...</text>;
		}

		if (!selectedItem || selectedItem.isCategory || !selectedItem.server) {
			return (
				<box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					flexGrow={1}
				>
					<text fg="gray">Select a server to see details</text>
				</box>
			);
		}

		const server = selectedItem.server;
		const isInstalled = mcp.installedServers[server.name] !== undefined;
		const isEnabled = mcp.installedServers[server.name] === true;

		return (
			<box flexDirection="column">
				<box marginBottom={1}>
					<text fg="cyan"><strong>⚡ {server.name}</strong></text>
					{server.requiresConfig && <text fg="yellow"> ⚙</text>}
				</box>

				<text fg="gray">{server.description}</text>

				<box marginTop={1} flexDirection="column">
					<box>
						<text fg="gray">Status </text>
						{isInstalled && isEnabled ? (
							<text fg="green">● Installed</text>
						) : isInstalled ? (
							<text fg="yellow">● Disabled</text>
						) : (
							<text fg="gray">○ Not installed</text>
						)}
					</box>
					<box>
						<text fg="gray">Type </text>
						<text fg="white">
							{server.type === "http" ? "HTTP" : "Command"}
						</text>
					</box>
					{server.type === "http" ? (
						<box>
							<text fg="gray">URL </text>
							<text fg="blue">{server.url}</text>
						</box>
					) : (
						<box>
							<text fg="gray">Command </text>
							<text fg="cyan">{server.command}</text>
						</box>
					)}
					{server.requiresConfig && (
						<box>
							<text fg="gray">Config </text>
							<text fg="yellow">
								{server.configFields?.length || 0} fields required
							</text>
						</box>
					)}
				</box>

				<box marginTop={2}>
					{isInstalled ? (
						<box>
							<text bg="red" fg="white"> Enter </text>
							<text fg="gray"> Remove server</text>
						</box>
					) : (
						<box>
							<text bg="green" fg="black"> Enter </text>
							<text fg="gray"> Install server</text>
						</box>
					)}
				</box>
			</box>
		);
	};

	const renderListItem = (
		item: ListItem,
		_idx: number,
		isSelected: boolean,
	) => {
		// Category header
		if (item.isCategory) {
			return (
				<text fg="magenta"><strong>▸ {item.label}</strong></text>
			);
		}

		// Server item
		const server = item.server;
		const isInstalled =
			server && mcp.installedServers[server.name] !== undefined;
		const icon = isInstalled ? "●" : "○";
		const iconColor = isInstalled ? "green" : "gray";

		return isSelected ? (
			<text bg="magenta" fg="white">
				{" "}
				{icon} {server?.name || ""}{" "}
			</text>
		) : (
			<text>
				<span fg={iconColor}>{icon}</span>
				<span fg="white"> {server?.name || ""}</span>
				{server?.requiresConfig && <span fg="yellow"> ⚙</span>}
			</text>
		);
	};

	// Calculate status counts
	const installedCount = Object.keys(mcp.installedServers).length;
	const enabledCount = Object.values(mcp.installedServers).filter(
		(v) => v === true,
	).length;
	const subtitle = `${enabledCount} enabled │ ${installedCount} configured │ / to search`;

	return (
		<ScreenLayout
			title="claudeup MCP Servers"
			subtitle={subtitle}
			currentScreen="mcp"
			footerHints="↑↓:nav │ Enter:toggle │ /:search │ r:registry"
			listPanel={
				<ScrollableList
					items={listItems}
					selectedIndex={mcp.selectedIndex}
					renderItem={renderListItem}
					maxHeight={dimensions.listPanelHeight}
				/>
			}
			detailPanel={renderDetail()}
		/>
	);
}

export default McpScreen;

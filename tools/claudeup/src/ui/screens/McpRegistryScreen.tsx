import React, { useEffect, useCallback, useState, useRef } from "react";
import { useApp, useModal, useNavigation } from "../state/AppContext.js";
import { useDimensions } from "../state/DimensionsContext.js";
import { useKeyboard } from "../hooks/useKeyboard.js";
import { ScreenLayout } from "../components/layout/index.js";
import { ScrollableList } from "../components/ScrollableList.js";
import { searchMcpServers, formatDate } from "../../services/mcp-registry.js";
import { addMcpServer, setAllowMcp } from "../../services/claude-settings.js";
import type { McpRegistryServer, McpServerConfig } from "../../types/index.js";

/**
 * Deduplicate servers by name, keeping only the latest version.
 * Uses version string comparison, falling back to published_at date.
 */
function deduplicateServers(servers: McpRegistryServer[]): McpRegistryServer[] {
	const serverMap = new Map<string, McpRegistryServer>();

	for (const server of servers) {
		const existing = serverMap.get(server.name);
		if (!existing) {
			serverMap.set(server.name, server);
			continue;
		}

		// Compare versions - keep the newer one
		const isNewer = compareVersions(server, existing) > 0;
		if (isNewer) {
			serverMap.set(server.name, server);
		}
	}

	return Array.from(serverMap.values());
}

/**
 * Compare two servers by version. Returns:
 *  > 0 if a is newer
 *  < 0 if b is newer
 *  0 if equal or cannot determine
 */
function compareVersions(a: McpRegistryServer, b: McpRegistryServer): number {
	// Try semver comparison first
	if (a.version && b.version) {
		const aParts = a.version.split(".").map((n) => parseInt(n, 10) || 0);
		const bParts = b.version.split(".").map((n) => parseInt(n, 10) || 0);

		for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
			const aVal = aParts[i] || 0;
			const bVal = bParts[i] || 0;
			if (aVal !== bVal) {
				return aVal - bVal;
			}
		}
	}

	// Fall back to published_at date
	if (a.published_at && b.published_at) {
		return (
			new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
		);
	}

	// If one has a date and other doesn't, prefer the one with date
	if (a.published_at && !b.published_at) return 1;
	if (!a.published_at && b.published_at) return -1;

	return 0;
}

export function McpRegistryScreen() {
	const { state, dispatch } = useApp();
	const { mcpRegistry } = state;
	const modal = useModal();
	const { navigateToScreen } = useNavigation();
	const dimensions = useDimensions();

	const [servers, setServers] = useState<McpRegistryServer[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState(mcpRegistry.searchQuery || "");

	const isSearchActive =
		state.isSearching &&
		state.currentRoute.screen === "mcp-registry" &&
		!state.modal;

	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Load servers
	const loadServers = useCallback(async (query: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await searchMcpServers({ query, limit: 50 });
			if (!response || !Array.isArray(response.servers)) {
				throw new Error("Invalid response from MCP Registry API");
			}
			// Deduplicate to show only latest version of each server
			const deduplicated = deduplicateServers(response.servers);
			setServers(deduplicated);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load servers");
			setServers([]);
		}
		setIsLoading(false);
	}, []);

	// Debounced search
	const debouncedSearch = useCallback(
		(query: string) => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
			searchTimeoutRef.current = setTimeout(() => {
				loadServers(query);
			}, 300);
		},
		[loadServers],
	);

	useEffect(() => {
		loadServers(searchQuery);
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, []);

	// Keyboard handling
	useKeyboard((event) => {
		// Handle search mode
		if (isSearchActive) {
			if (event.name === "escape") {
				dispatch({ type: "SET_SEARCHING", isSearching: false });
			} else if (event.name === "enter") {
				// Exit search mode and stay on list for navigation
				dispatch({ type: "SET_SEARCHING", isSearching: false });
			} else if (event.name === "up") {
				// Allow navigation while searching
				const newIndex = Math.max(0, mcpRegistry.selectedIndex - 1);
				dispatch({ type: "MCPREGISTRY_SELECT", index: newIndex });
			} else if (event.name === "down") {
				// Allow navigation while searching
				const newIndex = Math.min(
					Math.max(0, servers.length - 1),
					mcpRegistry.selectedIndex + 1,
				);
				dispatch({ type: "MCPREGISTRY_SELECT", index: newIndex });
			} else if (event.name === "backspace" || event.name === "delete") {
				const newQuery = searchQuery.slice(0, -1);
				setSearchQuery(newQuery);
				dispatch({ type: "MCPREGISTRY_SEARCH", query: newQuery });
				debouncedSearch(newQuery);
			} else if (event.name.length === 1 && !event.ctrl && !event.meta) {
				const newQuery = searchQuery + event.name;
				setSearchQuery(newQuery);
				dispatch({ type: "MCPREGISTRY_SEARCH", query: newQuery });
				debouncedSearch(newQuery);
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
			const newIndex = Math.max(0, mcpRegistry.selectedIndex - 1);
			dispatch({ type: "MCPREGISTRY_SELECT", index: newIndex });
		} else if (event.name === "down" || event.name === "j") {
			const newIndex = Math.min(
				Math.max(0, servers.length - 1),
				mcpRegistry.selectedIndex + 1,
			);
			dispatch({ type: "MCPREGISTRY_SELECT", index: newIndex });
		} else if (event.name === "l") {
			navigateToScreen("mcp");
		} else if (event.name === "R") {
			loadServers(searchQuery);
		} else if (event.name === "enter") {
			handleInstall();
		}
	});

	const handleInstall = async () => {
		const server = servers[mcpRegistry.selectedIndex];
		if (!server) return;

		const config: McpServerConfig = {
			type: "http",
			url: server.url,
		};

		modal.loading(`Installing ${server.name}...`);
		try {
			await setAllowMcp(true, state.projectPath);
			await addMcpServer(server.name, config, state.projectPath);
			modal.hideModal();
			await modal.message(
				"Installed",
				`${server.name} has been configured.\n\nRestart Claude Code to activate.`,
				"success",
			);
		} catch (error) {
			modal.hideModal();
			await modal.message("Error", `Failed to install: ${error}`, "error");
		}
	};

	// Get selected server
	const selectedServer = servers[mcpRegistry.selectedIndex];

	const renderDetail = () => {
		if (isLoading) {
			return <text fg="gray">Loading...</text>;
		}

		if (error) {
			return <text fg="red">Error: {error}</text>;
		}

		if (!selectedServer) {
			return <text fg="gray">Select a server to see details</text>;
		}

		const dateDisplay = selectedServer.published_at
			? formatDate(selectedServer.published_at)
			: "unknown";

		const versionDisplay = selectedServer.version
			? `v${selectedServer.version}`
			: "unknown";

		return (
			<box flexDirection="column">
				<text fg="magenta"><strong>{selectedServer.name}</strong></text>
				<box marginTop={1}>
					<text>{selectedServer.short_description}</text>
				</box>
				<box marginTop={1}>
					<text><strong>Version: </strong></text>
					<text fg="green">{versionDisplay}</text>
				</box>
				<box>
					<text><strong>Published: </strong></text>
					<text fg="cyan">{dateDisplay}</text>
				</box>
				<box marginTop={1} flexDirection="column">
					<text><strong>URL:</strong></text>
					<text fg="cyan">{selectedServer.url}</text>
				</box>
				{selectedServer.source_code_url && (
					<box marginTop={1} flexDirection="column">
						<text><strong>Source:</strong></text>
						<text fg="gray">{selectedServer.source_code_url}</text>
					</box>
				)}
				<box marginTop={1}>
					<text fg="green">Press Enter to install</text>
				</box>
			</box>
		);
	};

	const renderListItem = (
		server: McpRegistryServer,
		_idx: number,
		isSelected: boolean,
	) => {
		const version = server.version ? ` v${server.version}` : "";
		return isSelected ? (
			<text bg="magenta" fg="white">
				{" "}
				{server.name}
				{version}{" "}
			</text>
		) : (
			<text>
				<span><strong>{server.name}</strong></span>
				<span fg="green">{version}</span>
			</text>
		);
	};

	// Footer hints
	const footerHints = isSearchActive
		? "Type to search │ ↑↓:nav │ Enter:done │ Esc:cancel"
		: "↑↓:nav │ Enter:install │ /:search │ R:refresh │ l:local";

	// Status for search placeholder
	const searchPlaceholder = `${servers.length} servers │ / to search`;

	return (
		<ScreenLayout
			title="claudeup MCP Registry"
			subtitle="Powered by MCP Registry"
			currentScreen="mcp-registry"
			search={{
				isActive: isSearchActive,
				query: searchQuery,
				placeholder: searchPlaceholder,
			}}
			footerHints={footerHints}
			listPanel={
				isLoading ? (
					<text fg="gray">Loading...</text>
				) : error ? (
					<text fg="red">Error: {error}</text>
				) : servers.length === 0 ? (
					<text fg="gray">No servers found</text>
				) : (
					<ScrollableList
						items={servers}
						selectedIndex={mcpRegistry.selectedIndex}
						renderItem={renderListItem}
						maxHeight={dimensions.listPanelHeight}
					/>
				)
			}
			detailPanel={renderDetail()}
		/>
	);
}

export default McpRegistryScreen;

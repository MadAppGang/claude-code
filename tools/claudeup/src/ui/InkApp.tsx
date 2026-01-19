import React, { useEffect, useState } from "react";
import { Box, Text, useApp as useInkApp, useInput, useStdout } from "ink";
import fs from "node:fs";
import {
	AppProvider,
	useApp,
	useNavigation,
	useModal,
} from "./state/AppContext.js";
import {
	DimensionsProvider,
	useDimensions,
} from "./state/DimensionsContext.js";
// Header removed as per new design
import { ModalContainer } from "./components/modals/index.js";
import {
	PluginsScreen,
	McpScreen,
	McpRegistryScreen,
	StatusLineScreen,
	EnvVarsScreen,
	CliToolsScreen,
} from "./screens/index.js";
import type { Screen } from "./state/types.js"; // Import Screen type
import {
	refreshLocalMarketplaces,
	repairAllMarketplaces,
} from "../services/local-marketplace.js";
import {
	checkForUpdates,
	getCurrentVersion,
	type VersionCheckResult,
} from "../services/version-check.js";

export const VERSION = getCurrentVersion();

function Router(): React.ReactElement {
	const { state } = useApp();
	const { currentRoute } = state;

	switch (currentRoute.screen) {
		case "plugins":
			return <PluginsScreen />;
		case "mcp":
			return <McpScreen />;
		case "mcp-registry":
			return <McpRegistryScreen />;
		case "statusline":
			return <StatusLineScreen />;
		case "env-vars":
			return <EnvVarsScreen />;
		case "cli-tools":
			return <CliToolsScreen />;
		default:
			return <PluginsScreen />;
	}
}

function GlobalKeyHandler({
	onDebugToggle,
}: { onDebugToggle: () => void }): null {
	const { state } = useApp();
	const { navigateToScreen } = useNavigation();
	const { exit } = useInkApp();
	const modal = useModal();
	const { stdout } = useStdout();

	useInput((input, key) => {
		// Debug key - always available
		if (input === "D" && key.shift) {
			onDebugToggle();
			// Also write debug info to file
			const debugInfo = {
				timestamp: new Date().toISOString(),
				terminal: { rows: stdout?.rows, columns: stdout?.columns },
				state: {
					currentRoute: state.currentRoute,
					isSearching: state.isSearching,
					modal: state.modal ? { type: state.modal.type } : null,
					plugins: {
						scope: state.plugins.scope,
						selectedIndex: state.plugins.selectedIndex,
						searchQuery: state.plugins.searchQuery,
						marketplacesStatus: state.plugins.marketplaces.status,
						pluginsStatus: state.plugins.plugins.status,
					},
				},
			};
			fs.writeFileSync(
				"/tmp/claudeup-debug.json",
				JSON.stringify(debugInfo, null, 2),
			);
			return;
		}

		// Don't handle keys when modal is open or searching
		if (state.modal || state.isSearching) return;

		// Global navigation shortcuts (1-5) - include mcp-registry as it's a sub-screen of mcp
		const isTopLevel = [
			"plugins",
			"mcp",
			"mcp-registry",
			"statusline",
			"env-vars",
			"cli-tools",
		].includes(state.currentRoute.screen);

		if (isTopLevel) {
			if (input === "1") navigateToScreen("plugins");
			else if (input === "2") navigateToScreen("mcp");
			else if (input === "3") navigateToScreen("statusline");
			else if (input === "4") navigateToScreen("env-vars");
			else if (input === "5") navigateToScreen("cli-tools");

			// Tab navigation cycling
			if (key.tab) {
				const screens: Screen[] = [
					"plugins",
					"mcp",
					"statusline",
					"env-vars",
					"cli-tools",
				];
				const currentIndex = screens.indexOf(
					state.currentRoute.screen as Screen,
				);
				if (currentIndex !== -1) {
					const nextIndex = key.shift
						? (currentIndex - 1 + screens.length) % screens.length
						: (currentIndex + 1) % screens.length;
					navigateToScreen(screens[nextIndex]);
				}
			}
		}

		// Escape/q to go back or exit
		if (key.escape || input === "q") {
			if (state.currentRoute.screen === "plugins") {
				// On home screen, exit immediately
				exit();
			} else if (state.currentRoute.screen === "mcp-registry") {
				// Go back to MCP from registry
				navigateToScreen("mcp");
			} else {
				// Go back to plugins (home)
				navigateToScreen("plugins");
			}
		}

		// ? for help
		if (input === "?") {
			modal.message(
				"claudeup Help",
				`Navigation
  ↑/↓ or j/k    Move selection
  Enter         Select / Toggle
  Escape or q   Back / Quit
  ?             This help

Quick Navigation
  1  Plugins      4  Env Vars
  2  MCP Servers  5  CLI Tools
  3  Status Line

Plugin Actions
  u  Update        d  Uninstall
  a  Update All    r  Refresh

MCP Servers
  /  Search local + remote
  r  Browse MCP registry`,
				"info",
			);
		}
	});

	return null;
}

interface ProgressIndicatorProps {
	message: string;
	current?: number;
	total?: number;
}

function ProgressIndicator({
	message,
	current,
	total,
}: ProgressIndicatorProps): React.ReactElement {
	let progressText = message;

	if (current !== undefined && total !== undefined && total > 0) {
		const barWidth = 20;
		const filled = Math.round((current / total) * barWidth);
		const empty = barWidth - filled;
		progressText += ` [${"█".repeat(filled)}${"░".repeat(empty)}] ${current}/${total}`;
	}

	return (
		<Box paddingX={1}>
			<Text color="cyan">⟳ </Text>
			<Text>{progressText}</Text>
		</Box>
	);
}

function UpdateBanner({
	result,
}: { result: VersionCheckResult }): React.ReactElement | null {
	if (!result.updateAvailable) return null;

	return (
		<Box paddingX={1} marginBottom={0}>
			<Text backgroundColor="yellow" color="black" bold>
				{" "}
				UPDATE{" "}
			</Text>
			<Text color="yellow">
				{" "}
				v{result.currentVersion} → v{result.latestVersion}
			</Text>
			<Text color="gray"> Run: </Text>
			<Text color="cyan">npm i -g claudeup</Text>
		</Box>
	);
}

interface AppContentInnerProps {
	showDebug: boolean;
	onDebugToggle: () => void;
	updateInfo: VersionCheckResult | null;
}

function AppContentInner({
	showDebug,
	onDebugToggle,
	updateInfo,
}: AppContentInnerProps): React.ReactElement {
	const { state, dispatch } = useApp();
	const { progress } = state;
	const dimensions = useDimensions();

	// Auto-refresh marketplaces on startup
	useEffect(() => {
		const noRefresh = process.argv.includes("--no-refresh");
		if (noRefresh) return;

		dispatch({
			type: "SHOW_PROGRESS",
			state: { message: "Syncing marketplaces..." },
		});

		refreshLocalMarketplaces((prog) => {
			dispatch({
				type: "UPDATE_PROGRESS",
				state: {
					message: `Syncing ${prog.name}...`,
					current: prog.current,
					total: prog.total,
				},
			});
		})
			.then(async () => {
				// Auto-repair plugin.json files with missing agents/commands/skills
				await repairAllMarketplaces();
				dispatch({ type: "HIDE_PROGRESS" });
				dispatch({ type: "DATA_REFRESH_COMPLETE" });
			})
			.catch(() => {
				dispatch({ type: "HIDE_PROGRESS" });
			});
	}, [dispatch]);

	return (
		<Box flexDirection="column" height={dimensions.terminalHeight}>
			{updateInfo?.updateAvailable && <UpdateBanner result={updateInfo} />}
			{showDebug && (
				<Box paddingX={1}>
					<Text color="yellow" dimColor>
						DEBUG: {dimensions.terminalWidth}x{dimensions.terminalHeight} |
						content={dimensions.contentHeight} | screen=
						{state.currentRoute.screen}
					</Text>
				</Box>
			)}
			{progress && <ProgressIndicator {...progress} />}
			<Box
				flexDirection="column"
				height={dimensions.contentHeight}
				paddingX={1}
				overflow="hidden"
			>
				<Router />
			</Box>
			<GlobalKeyHandler onDebugToggle={onDebugToggle} />
			<ModalContainer />
		</Box>
	);
}

function AppContent(): React.ReactElement {
	const { state } = useApp();
	const { progress } = state;
	const [showDebug, setShowDebug] = useState(false);
	const [updateInfo, setUpdateInfo] = useState<VersionCheckResult | null>(null);

	// Check for updates on startup (non-blocking)
	useEffect(() => {
		checkForUpdates()
			.then(setUpdateInfo)
			.catch(() => {});
	}, []);

	return (
		<DimensionsProvider
			showProgress={!!progress}
			showDebug={showDebug}
			showUpdateBanner={!!updateInfo?.updateAvailable}
		>
			<AppContentInner
				showDebug={showDebug}
				onDebugToggle={() => setShowDebug((s) => !s)}
				updateInfo={updateInfo}
			/>
		</DimensionsProvider>
	);
}

export function App(): React.ReactElement {
	return (
		<AppProvider>
			<AppContent />
		</AppProvider>
	);
}

export default App;

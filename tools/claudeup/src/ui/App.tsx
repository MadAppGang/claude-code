import React, { useEffect, useState } from "react";
import { useRenderer } from "@opentui/react";
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
import { ModalContainer } from "./components/modals/index.js";
import {
	PluginsScreen,
	McpScreen,
	McpRegistryScreen,
	StatusLineScreen,
	EnvVarsScreen,
	CliToolsScreen,
	ModelSelectorScreen,
} from "./screens/index.js";
import type { Screen } from "./state/types.js";
import { repairAllMarketplaces } from "../services/local-marketplace.js";
import {
	checkForUpdates,
	getCurrentVersion,
	type VersionCheckResult,
} from "../services/version-check.js";
import { useKeyboardHandler } from "./hooks/useKeyboardHandler.js";
import { ProgressBar } from "./components/layout/ProgressBar.js";

export const VERSION = getCurrentVersion();

/**
 * Router Component
 * Renders the current screen based on route
 */
function Router() {
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
		case "model-selector":
			return <ModelSelectorScreen />;
		default:
			return <PluginsScreen />;
	}
}

/**
 * GlobalKeyHandler Component
 * Handles global keyboard shortcuts (1-5, Tab, Escape, q, ?, Shift+D)
 * Does not render anything (returns null)
 */
function GlobalKeyHandler({
	onDebugToggle,
	onExit,
}: { onDebugToggle: () => void; onExit: () => void }): null {
	const { state } = useApp();
	const { navigateToScreen } = useNavigation();
	const modal = useModal();
	const renderer = useRenderer();

	useKeyboardHandler((input, key) => {
		// Debug key (Shift+D) - always available
		if (input === "D" && key.shift) {
			onDebugToggle();
			// Write debug info to file
			const debugInfo = {
				timestamp: new Date().toISOString(),
				terminal: { rows: renderer.height, columns: renderer.width },
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
			"model-selector",
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
				onExit();
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

/**
 * UpdateBanner Component
 * Shows version update notification
 */
function UpdateBanner({
	result,
}: { result: VersionCheckResult }) {
	if (!result.updateAvailable) return null;

	return (
		<box paddingLeft={1} paddingRight={1} >
			<text bg="yellow" fg="black">
				<strong> UPDATE </strong>
			</text>
			<text fg="yellow">
				{" "}
				v{result.currentVersion} → v{result.latestVersion}
			</text>
			<text fg="gray"> Run: </text>
			<text fg="cyan">npm i -g claudeup</text>
		</box>
	);
}

/**
 * ProgressIndicator Component
 * Shows progress bar when operations are running
 */
function ProgressIndicator({
	message,
	current,
	total,
}: {
	message: string;
	current?: number;
	total?: number;
}) {
	return (
		<box paddingLeft={1} paddingRight={1}>
			<ProgressBar message={message} current={current} total={total} />
		</box>
	);
}

/**
 * AppContentInner Component
 * Main app layout with all UI elements
 */
interface AppContentInnerProps {
	showDebug: boolean;
	onDebugToggle: () => void;
	updateInfo: VersionCheckResult | null;
	onExit: () => void;
}

function AppContentInner({
	showDebug,
	onDebugToggle,
	updateInfo,
	onExit,
}: AppContentInnerProps) {
	const { state, dispatch } = useApp();
	const { progress } = state;
	const dimensions = useDimensions();

	// Auto-refresh marketplaces on startup
	useEffect(() => {
		const noRefresh = process.argv.includes("--no-refresh");
		if (noRefresh) return;

		dispatch({
			type: "SHOW_PROGRESS",
			state: { message: "Scanning marketplaces..." },
		});

		// Note: Marketplace updates should be done via Claude Code's /plugin marketplace update
		// Just repair plugin.json files
		repairAllMarketplaces()
			.then(async () => {
				dispatch({ type: "HIDE_PROGRESS" });
				dispatch({ type: "DATA_REFRESH_COMPLETE" });
			})
			.catch(() => {
				dispatch({ type: "HIDE_PROGRESS" });
			});
	}, [dispatch]);

	return (
		<box flexDirection="column" height={dimensions.terminalHeight}>
			{updateInfo?.updateAvailable && <UpdateBanner result={updateInfo} />}
			{showDebug && (
				<box paddingLeft={1} paddingRight={1}>
					<text fg="#888888">
						DEBUG: {dimensions.terminalWidth}x{dimensions.terminalHeight} |
						content={dimensions.contentHeight} | screen=
						{state.currentRoute.screen}
					</text>
				</box>
			)}
			{progress && <ProgressIndicator {...progress} />}
			<box
				flexDirection="column"
				height={dimensions.contentHeight}
				paddingLeft={1} paddingRight={1}
			>
				<Router />
			</box>
			<GlobalKeyHandler onDebugToggle={onDebugToggle} onExit={onExit} />
			<ModalContainer />
		</box>
	);
}

/**
 * AppContent Component
 * Wraps app with DimensionsProvider and manages state for debug/updates
 */
interface AppContentProps {
	onExit: () => void;
}

function AppContent({ onExit }: AppContentProps) {
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
				onExit={onExit}
			/>
		</DimensionsProvider>
	);
}

/**
 * App Component (Root)
 * Entry point for the OpenTUI application
 * Wraps everything with AppProvider
 */
interface AppProps {
	onExit: () => void;
}

export function App({ onExit }: AppProps) {
	return (
		<AppProvider>
			<AppContent onExit={onExit} />
		</AppProvider>
	);
}

export default App;

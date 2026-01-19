import React from "react";
import { Box, Text } from "ink";
import type { Screen } from "../state/types.js";

interface Tab {
	key: string;
	label: string;
	screen: Screen;
}

const TABS: Tab[] = [
	{ key: "1", label: "Plugins", screen: "plugins" },
	{ key: "2", label: "MCP", screen: "mcp" },
	{ key: "3", label: "Status", screen: "statusline" },
	{ key: "4", label: "Env", screen: "env-vars" },
	{ key: "5", label: "CLI", screen: "cli-tools" },
];

interface TabBarProps {
	currentScreen: Screen;
}

export function TabBar({ currentScreen }: TabBarProps): React.ReactElement {
	return (
		<Box flexDirection="row" gap={0}>
			{TABS.map((tab, index) => {
				const isSelected = tab.screen === currentScreen;
				const isLast = index === TABS.length - 1;

				return (
					<Box key={tab.key} flexDirection="row">
						{/* Tab content */}
						{isSelected ? (
							<Box>
								<Text backgroundColor="#7e57c2" color="white" bold>
									{" "}
									{tab.key}:{tab.label}{" "}
								</Text>
							</Box>
						) : (
							<Box>
								<Text color="gray">
									{" "}
									{tab.key}:{tab.label}{" "}
								</Text>
							</Box>
						)}
						{/* Separator */}
						{!isLast && (
							<Text color="gray" dimColor>
								│
							</Text>
						)}
					</Box>
				);
			})}
		</Box>
	);
}

export default TabBar;

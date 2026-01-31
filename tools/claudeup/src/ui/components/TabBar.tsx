import React from 'react';
import { useKeyboardHandler } from '../hooks/useKeyboardHandler';
import type { Screen } from '../state/types.js';

interface Tab {
	key: string;
	label: string;
	screen: Screen;
}

const TABS: Tab[] = [
	{ key: '1', label: 'Plugins', screen: 'plugins' },
	{ key: '2', label: 'MCP', screen: 'mcp' },
	{ key: '3', label: 'Status', screen: 'statusline' },
	{ key: '4', label: 'Env', screen: 'env-vars' },
	{ key: '5', label: 'CLI', screen: 'cli-tools' },
];

interface TabBarProps {
	currentScreen: Screen;
	onTabChange?: (screen: Screen) => void;
}

export function TabBar({
	currentScreen,
	onTabChange,
}: TabBarProps) {
	// Handle number key shortcuts (1-5)
	useKeyboardHandler((input, key) => {
		if (!onTabChange) return;

		// Number keys 1-5
		const tabIndex = Number.parseInt(input, 10);
		if (tabIndex >= 1 && tabIndex <= TABS.length) {
			const tab = TABS[tabIndex - 1];
			if (tab && tab.screen !== currentScreen) {
				onTabChange(tab.screen);
			}
		}

		// Tab key to cycle through tabs
		if (key.tab) {
			const currentIndex = TABS.findIndex((t) => t.screen === currentScreen);
			const nextIndex = key.shift
				? (currentIndex - 1 + TABS.length) % TABS.length
				: (currentIndex + 1) % TABS.length;
			onTabChange(TABS[nextIndex].screen);
		}
	});

	return (
		<box flexDirection="row" gap={0}>
			{TABS.map((tab, index) => {
				const isSelected = tab.screen === currentScreen;
				const isLast = index === TABS.length - 1;

				return (
					<box key={tab.key} flexDirection="row">
						{/* Tab content */}
						{isSelected ? (
							<box>
								<text bg="#7e57c2" fg="white">
									<strong>
										{' '}
										{tab.key}:{tab.label}{' '}
									</strong>
								</text>
							</box>
						) : (
							<box>
								<text fg="gray">
									{' '}
									{tab.key}:{tab.label}{' '}
								</text>
							</box>
						)}
						{/* Separator */}
						{!isLast && (
							<text fg="#666666">│</text>
						)}
					</box>
				);
			})}
		</box>
	);
}

export default TabBar;

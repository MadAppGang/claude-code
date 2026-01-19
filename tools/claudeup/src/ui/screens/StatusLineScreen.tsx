import React, { useEffect, useCallback, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useApp, useModal } from "../state/AppContext.js";
import { useDimensions } from "../state/DimensionsContext.js";
import { ScreenLayout } from "../components/layout/index.js";
import { ScrollableList } from "../components/ScrollableList.js";
import { statusLineCategories } from "../../data/statuslines.js";
import type { StatusLineConfig } from "../../types/index.js";
import {
	setStatusLine,
	getStatusLine,
	setGlobalStatusLine,
	getGlobalStatusLine,
} from "../../services/claude-settings.js";

interface ListItem {
	label: string;
	preset?: StatusLineConfig;
	isCustom?: boolean;
	isCategory?: boolean;
}

export function StatusLineScreen(): React.ReactElement {
	const { state, dispatch } = useApp();
	const { statusline: statusLine } = state;
	const modal = useModal();
	const dimensions = useDimensions();

	const [projectStatusLine, setProjectStatusLineState] = useState<
		string | undefined
	>();
	const [globalStatusLine, setGlobalStatusLineState] = useState<
		string | undefined
	>();
	const [isLoading, setIsLoading] = useState(true);

	// Fetch data
	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const [project, global] = await Promise.all([
				getStatusLine(state.projectPath),
				getGlobalStatusLine(),
			]);
			setProjectStatusLineState(project);
			setGlobalStatusLineState(global);
		} catch (error) {
			// Silent error handling - show empty state
		}
		setIsLoading(false);
	}, [state.projectPath]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Get current status line based on scope
	const getCurrentStatusLine = (): string | undefined => {
		return statusLine.scope === "project"
			? projectStatusLine
			: globalStatusLine;
	};

	// Build list items with categories
	const buildListItems = (): ListItem[] => {
		const currentForScope = getCurrentStatusLine();
		const items: ListItem[] = [];

		for (const category of statusLineCategories) {
			items.push({
				label: category.name,
				isCategory: true,
			});

			for (const preset of category.presets) {
				const isActive = currentForScope === preset.template;
				const status = isActive ? "●" : "○";
				items.push({
					label: `  ${status} ${preset.name}`,
					preset,
				});
			}
		}

		// Add custom option at the end
		items.push({
			label: "+ Custom Status Line",
			isCustom: true,
		});

		return items;
	};

	const listItems = buildListItems();

	// Keyboard handling
	useInput((input, key) => {
		if (state.isSearching || state.modal) return;

		if (key.upArrow || input === "k") {
			const newIndex = Math.max(0, statusLine.selectedIndex - 1);
			dispatch({ type: "STATUSLINE_SELECT", index: newIndex });
		} else if (key.downArrow || input === "j") {
			const newIndex = Math.min(
				listItems.length - 1,
				statusLine.selectedIndex + 1,
			);
			dispatch({ type: "STATUSLINE_SELECT", index: newIndex });
		} else if (input === "p") {
			dispatch({ type: "STATUSLINE_SET_SCOPE", scope: "project" });
		} else if (input === "g") {
			dispatch({ type: "STATUSLINE_SET_SCOPE", scope: "global" });
		} else if (input === "r") {
			handleReset();
		} else if (key.return) {
			handleSelect();
		}
	});

	const saveStatusLine = async (template: string): Promise<void> => {
		if (statusLine.scope === "global") {
			await setGlobalStatusLine(template);
		} else {
			await setStatusLine(template, state.projectPath);
		}
	};

	const handleSelect = async () => {
		const item = listItems[statusLine.selectedIndex];
		if (!item || item.isCategory) return;

		const scopeLabel = statusLine.scope === "global" ? "Global" : "Project";

		if (item.isCustom) {
			const template = await modal.input(
				`Custom Status Line (${scopeLabel})`,
				"Enter template (use {model}, {cost}, etc.):",
				getCurrentStatusLine() || "",
			);

			if (template !== null) {
				modal.loading(`Saving custom status line...`);
				try {
					await saveStatusLine(template);
					modal.hideModal();
					await modal.message(
						"Saved",
						`Custom status line saved to ${scopeLabel}.\n\nRestart Claude Code to apply changes.`,
						"success",
					);
					fetchData();
				} catch (error) {
					modal.hideModal();
					await modal.message("Error", `Failed to save: ${error}`, "error");
				}
			}
		} else if (item.preset) {
			modal.loading(`Applying ${item.preset.name}...`);
			try {
				await saveStatusLine(item.preset.template);
				modal.hideModal();
				await modal.message(
					"Applied",
					`"${item.preset.name}" applied to ${scopeLabel}.\n\nRestart Claude Code to apply changes.`,
					"success",
				);
				fetchData();
			} catch (error) {
				modal.hideModal();
				await modal.message("Error", `Failed to apply: ${error}`, "error");
			}
		}
	};

	const handleReset = async () => {
		const scopeLabel = statusLine.scope === "global" ? "Global" : "Project";
		const confirmed = await modal.confirm(
			"Reset Status Line",
			`Clear the ${scopeLabel} status line configuration?`,
		);

		if (confirmed) {
			modal.loading("Resetting...");
			try {
				await saveStatusLine("");
				modal.hideModal();
				await modal.message(
					"Reset",
					`${scopeLabel} status line has been cleared.`,
					"success",
				);
				fetchData();
			} catch (error) {
				modal.hideModal();
				await modal.message("Error", `Failed to reset: ${error}`, "error");
			}
		}
	};

	// Get selected item
	const selectedItem = listItems[statusLine.selectedIndex];

	// Build preview
	const renderPreview = () => {
		if (isLoading) {
			return <Text color="gray">Loading status line settings...</Text>;
		}

		if (!selectedItem || selectedItem.isCategory) {
			return (
				<Box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					flexGrow={1}
				>
					<Text color="gray">Select a theme to see preview</Text>
				</Box>
			);
		}

		if (selectedItem.isCustom) {
			return (
				<Box flexDirection="column">
					<Text bold color="cyan">
						✨ Custom Status Line
					</Text>
					<Text color="gray">Create your own unique status line!</Text>

					<Box marginTop={1} flexDirection="column">
						<Text bold color="yellow">
							Available variables:
						</Text>
						<Box marginTop={1} flexDirection="column">
							<Text>
								<Text color="green" bold>
									{"{model}"}
								</Text>{" "}
								<Text color="gray">→</Text> Model name
							</Text>
							<Text>
								<Text color="green" bold>
									{"{model_short}"}
								</Text>{" "}
								<Text color="gray">→</Text> Short name
							</Text>
							<Text>
								<Text color="yellow" bold>
									{"{cost}"}
								</Text>{" "}
								<Text color="gray">→</Text> Session cost
							</Text>
							<Text>
								<Text color="blue" bold>
									{"{cwd}"}
								</Text>{" "}
								<Text color="gray">→</Text> Working directory
							</Text>
							<Text>
								<Text color="magenta" bold>
									{"{git_branch}"}
								</Text>{" "}
								<Text color="gray">→</Text> Git branch
							</Text>
							<Text>
								<Text color="cyan" bold>
									{"{input_tokens}"}
								</Text>{" "}
								<Text color="gray">→</Text> Input tokens
							</Text>
							<Text>
								<Text color="cyan" bold>
									{"{output_tokens}"}
								</Text>{" "}
								<Text color="gray">→</Text> Output tokens
							</Text>
							<Text>
								<Text color="red" bold>
									{"{session_duration}"}
								</Text>
								<Text color="gray">→</Text> Duration
							</Text>
						</Box>
					</Box>
				</Box>
			);
		}

		if (selectedItem.preset) {
			const example = selectedItem.preset.template
				.replace("{model}", "claude-sonnet-4")
				.replace("{model_short}", "sonnet")
				.replace("{cost}", "0.42")
				.replace("{cwd}", "~/myapp")
				.replace("{git_branch}", "main")
				.replace("{input_tokens}", "1.2k")
				.replace("{output_tokens}", "850")
				.replace("{session_duration}", "12m");

			return (
				<Box flexDirection="column">
					<Text bold color="cyan">
						◆ {selectedItem.preset.name}
					</Text>
					<Text color="gray">{selectedItem.preset.description}</Text>

					<Box marginTop={1} flexDirection="column">
						<Text color="yellow" bold>
							Preview:
						</Text>
						<Box
							marginTop={1}
							paddingX={1}
							borderStyle="round"
							borderColor="green"
						>
							<Text color="white">{example}</Text>
						</Box>
					</Box>

					<Box marginTop={1} flexDirection="column">
						<Text color="gray" dimColor>
							Template:
						</Text>
						<Text color="gray">{selectedItem.preset.template}</Text>
					</Box>
				</Box>
			);
		}

		return null;
	};

	const renderListItem = (
		item: ListItem,
		_idx: number,
		isSelected: boolean,
	) => {
		if (item.isCategory) {
			return (
				<Text bold color="magenta" wrap="truncate">
					▸ {item.label}
				</Text>
			);
		}

		if (item.isCustom) {
			return isSelected ? (
				<Text backgroundColor="cyan" color="black" bold wrap="truncate">
					{" "}
					➕ Custom Status Line{" "}
				</Text>
			) : (
				<Text color="cyan" bold wrap="truncate">
					{"  "}➕ Custom Status Line
				</Text>
			);
		}

		const currentForScope = getCurrentStatusLine();
		const isActive = item.preset && currentForScope === item.preset.template;

		return isSelected ? (
			<Text backgroundColor="magenta" color="white" wrap="truncate">
				{" "}
				{isActive ? "●" : "○"} {item.preset?.name || ""}{" "}
			</Text>
		) : (
			<Text color={isActive ? "green" : "white"} wrap="truncate">
				{"  "}
				{isActive ? "●" : "○"} {item.preset?.name || ""}
			</Text>
		);
	};

	// Build status line content
	const scopeLabel = statusLine.scope === "project" ? "Project" : "Global";
	const currentValue = getCurrentStatusLine();
	const statusContent = (
		<>
			<Text color="gray">Scope: </Text>
			<Text color="cyan">{scopeLabel}</Text>
			<Text color="gray"> │ Current: </Text>
			<Text color="green">
				{currentValue
					? currentValue.slice(0, 35) + (currentValue.length > 35 ? "..." : "")
					: "(not set)"}
			</Text>
		</>
	);

	return (
		<ScreenLayout
			title="claudeup Status Line"
			currentScreen="statusline"
			statusLine={statusContent}
			footerHints="↑↓:nav │ Enter:apply │ p:project │ g:global │ r:reset"
			listPanel={
				<ScrollableList
					items={listItems}
					selectedIndex={statusLine.selectedIndex}
					renderItem={renderListItem}
					maxHeight={dimensions.listPanelHeight}
				/>
			}
			detailPanel={renderPreview()}
		/>
	);
}

export default StatusLineScreen;

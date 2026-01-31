import React, { useEffect, useCallback, useState } from "react";
import { useApp, useModal } from "../state/AppContext.js";
import { useDimensions } from "../state/DimensionsContext.js";
import { useKeyboard } from "../hooks/useKeyboard.js";
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

export function StatusLineScreen() {
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
	useKeyboard((event) => {
		if (state.isSearching || state.modal) return;

		if (event.name === "up" || event.name === "k") {
			const newIndex = Math.max(0, statusLine.selectedIndex - 1);
			dispatch({ type: "STATUSLINE_SELECT", index: newIndex });
		} else if (event.name === "down" || event.name === "j") {
			const newIndex = Math.min(
				listItems.length - 1,
				statusLine.selectedIndex + 1,
			);
			dispatch({ type: "STATUSLINE_SELECT", index: newIndex });
		} else if (event.name === "p") {
			dispatch({ type: "STATUSLINE_SET_SCOPE", scope: "project" });
		} else if (event.name === "g") {
			dispatch({ type: "STATUSLINE_SET_SCOPE", scope: "global" });
		} else if (event.name === "r") {
			handleReset();
		} else if (event.name === "enter") {
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
			return <text fg="gray">Loading status line settings...</text>;
		}

		if (!selectedItem || selectedItem.isCategory) {
			return (
				<box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					flexGrow={1}
				>
					<text fg="gray">Select a theme to see preview</text>
				</box>
			);
		}

		if (selectedItem.isCustom) {
			return (
				<box flexDirection="column">
					<text fg="cyan">
						<strong>✨ Custom Status Line</strong>
					</text>
					<text fg="gray">Create your own unique status line!</text>

					<box marginTop={1} flexDirection="column">
						<text fg="yellow">
							<strong>Available variables:</strong>
						</text>
						<box marginTop={1} flexDirection="column">
							<text>
								<span fg="green">
									<strong>{"{model}"}</strong>
								</span>{" "}
								<span fg="gray">→</span> Model name
							</text>
							<text>
								<span fg="green">
									<strong>{"{model_short}"}</strong>
								</span>{" "}
								<span fg="gray">→</span> Short name
							</text>
							<text>
								<span fg="yellow">
									<strong>{"{cost}"}</strong>
								</span>{" "}
								<span fg="gray">→</span> Session cost
							</text>
							<text>
								<span fg="blue">
									<strong>{"{cwd}"}</strong>
								</span>{" "}
								<span fg="gray">→</span> Working directory
							</text>
							<text>
								<span fg="magenta">
									<strong>{"{git_branch}"}</strong>
								</span>{" "}
								<span fg="gray">→</span> Git branch
							</text>
							<text>
								<span fg="cyan">
									<strong>{"{input_tokens}"}</strong>
								</span>{" "}
								<span fg="gray">→</span> Input tokens
							</text>
							<text>
								<span fg="cyan">
									<strong>{"{output_tokens}"}</strong>
								</span>{" "}
								<span fg="gray">→</span> Output tokens
							</text>
							<text>
								<span fg="red">
									<strong>{"{session_duration}"}</strong>
								</span>
								<span fg="gray">→</span> Duration
							</text>
						</box>
					</box>
				</box>
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
				<box flexDirection="column">
					<text fg="cyan">
						<strong>◆ {selectedItem.preset.name}</strong>
					</text>
					<text fg="gray">{selectedItem.preset.description}</text>

					<box marginTop={1} flexDirection="column">
						<text fg="yellow">
							<strong>Preview:</strong>
						</text>
						<box
							marginTop={1}
							paddingLeft={1} paddingRight={1}
							borderStyle="rounded"
							borderColor="green"
						>
							<text fg="white">{example}</text>
						</box>
					</box>

					<box marginTop={1} flexDirection="column">
						<text fg="#666666">Template:</text>
						<text fg="gray">{selectedItem.preset.template}</text>
					</box>
				</box>
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
				<text fg="magenta" >
					<strong>▸ {item.label}</strong>
				</text>
			);
		}

		if (item.isCustom) {
			return isSelected ? (
				<text bg="cyan" fg="black" >
					<strong>
						{" "}
						➕ Custom Status Line{" "}
					</strong>
				</text>
			) : (
				<text fg="cyan" >
					<strong>{"  "}➕ Custom Status Line</strong>
				</text>
			);
		}

		const currentForScope = getCurrentStatusLine();
		const isActive = item.preset && currentForScope === item.preset.template;

		return isSelected ? (
			<text bg="magenta" fg="white" >
				{" "}
				{isActive ? "●" : "○"} {item.preset?.name || ""}{" "}
			</text>
		) : (
			<text fg={isActive ? "green" : "white"} >
				{"  "}
				{isActive ? "●" : "○"} {item.preset?.name || ""}
			</text>
		);
	};

	// Build status line content
	const scopeLabel = statusLine.scope === "project" ? "Project" : "Global";
	const currentValue = getCurrentStatusLine();
	const statusContent = (
		<>
			<text fg="gray">Scope: </text>
			<text fg="cyan">{scopeLabel}</text>
			<text fg="gray"> │ Current: </text>
			<text fg="green">
				{currentValue
					? currentValue.slice(0, 35) + (currentValue.length > 35 ? "..." : "")
					: "(not set)"}
			</text>
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

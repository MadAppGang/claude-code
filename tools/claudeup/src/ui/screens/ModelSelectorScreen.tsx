import React, { useMemo, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useApp } from "../state/AppContext.js";
import { useDimensions } from "../state/DimensionsContext.js";
import { ScrollableList } from "../components/ScrollableList.js";
import { fuzzyFilter, highlightMatches } from "../../utils/fuzzy-search.js";

interface ModelItem {
	id: string;
	type: "header" | "model";
	label: string;
	provider?: string;
	configured?: boolean;
	modelId?: string;
	description?: string;
}

const RECENT_MODELS: ModelItem[] = [
	{
		id: "recent-1",
		type: "model",
		label: "MoonshotAI: Kimi K2 0905 (exacto)",
		provider: "OpenRouter",
		modelId: "moonshot/kimi-k2-0905",
		configured: true,
	},
];

const ANTHROPIC_MODELS: ModelItem[] = [
	{
		id: "claude-opus-4",
		type: "model",
		label: "Claude Opus 4",
		provider: "Anthropic",
		modelId: "anthropic/claude-opus-4",
		configured: true,
	},
	{
		id: "claude-sonnet-4",
		type: "model",
		label: "Claude Sonnet 4",
		provider: "Anthropic",
		modelId: "anthropic/claude-sonnet-4",
		configured: true,
	},
	{
		id: "claude-opus-4.1",
		type: "model",
		label: "Claude Opus 4.1",
		provider: "Anthropic",
		modelId: "anthropic/claude-opus-4.1",
		configured: true,
	},
	{
		id: "claude-opus-4.5",
		type: "model",
		label: "Claude Opus 4.5",
		provider: "Anthropic",
		modelId: "anthropic/claude-opus-4.5",
		configured: true,
	},
	{
		id: "claude-3.5-haiku",
		type: "model",
		label: "Claude 3.5 Haiku",
		provider: "Anthropic",
		modelId: "anthropic/claude-3.5-haiku",
		configured: true,
	},
	{
		id: "claude-4.5-haiku",
		type: "model",
		label: "Claude 4.5 Haiku",
		provider: "Anthropic",
		modelId: "anthropic/claude-4.5-haiku",
		configured: true,
	},
	{
		id: "claude-3.7-sonnet",
		type: "model",
		label: "Claude 3.7 Sonnet",
		provider: "Anthropic",
		modelId: "anthropic/claude-3.7-sonnet",
		configured: true,
	},
	{
		id: "claude-sonnet-4.5",
		type: "model",
		label: "Claude Sonnet 4.5",
		provider: "Anthropic",
		modelId: "anthropic/claude-sonnet-4.5",
		configured: true,
	},
	{
		id: "claude-3.5-sonnet-new",
		type: "model",
		label: "Claude 3.5 Sonnet (New)",
		provider: "Anthropic",
		modelId: "anthropic/claude-3-5-sonnet-new",
		configured: true,
	},
	{
		id: "claude-3.5-sonnet-old",
		type: "model",
		label: "Claude 3.5 Sonnet (Old)",
		provider: "Anthropic",
		modelId: "anthropic/claude-3-5-sonnet-old",
		configured: true,
	},
];

const OPENAI_MODELS: ModelItem[] = [
	{
		id: "gpt-5-codex",
		type: "model",
		label: "GPT-5 Codex",
		provider: "OpenAI",
		modelId: "openai/gpt-5-codex",
		configured: true,
	},
	{
		id: "gpt-5.1-codex",
		type: "model",
		label: "GPT-5.1 Codex",
		provider: "OpenAI",
		modelId: "openai/gpt-5.1-codex",
		configured: true,
	},
	{
		id: "gpt-5.1-codex-max",
		type: "model",
		label: "GPT-5.1 Codex Max",
		provider: "OpenAI",
		modelId: "openai/gpt-5.1-codex-max",
		configured: true,
	},
	{
		id: "gpt-5.1-codex-mini",
		type: "model",
		label: "GPT-5.1 Codex Mini",
		provider: "OpenAI",
		modelId: "openai/gpt-5.1-codex-mini",
		configured: true,
	},
];

const XAI_MODELS: ModelItem[] = [
	{
		id: "grok-code-fast",
		type: "model",
		label: "Grok Code Fast",
		provider: "xAI",
		modelId: "xai/grok-code-fast",
		configured: false,
	}, // Configured check missing in reference image? No, line is very faint. Assuming not configured or just separator missing.
];

export function ModelSelectorScreen(): React.ReactElement {
	const { state, dispatch } = useApp();
	const { modelSelector } = state;
	const dimensions = useDimensions();

	// Combine items into display list
	const allItems = useMemo<ModelItem[]>(() => {
		return [
			{
				id: "header-recent",
				type: "header",
				label: "Recently used",
				provider: "OpenRouter",
			}, // Provider column used for right text
			...RECENT_MODELS,
			{
				id: "header-anthropic",
				type: "header",
				label: "Anthropic",
				configured: true,
			},
			...ANTHROPIC_MODELS,
			{
				id: "header-openai",
				type: "header",
				label: "OpenAI",
				configured: true,
			},
			...OPENAI_MODELS,
			{ id: "header-xai", type: "header", label: "xAI" },
			...XAI_MODELS,
		];
	}, []);

	// Filter items
	const filteredItems = useMemo(() => {
		if (!modelSelector.searchQuery) return allItems;

		// Filter only models
		const models = allItems.filter((i) => i.type === "model");
		const fuzzyResults = fuzzyFilter(
			models,
			modelSelector.searchQuery,
			(item) => item.label,
		);

		// If searching, just show matched models without headers to keep it clean, or keep hierarchy?
		// "Switch Model" TUI usually flattens on search.
		return fuzzyResults.map(
			(r) =>
				({ ...r.item, _matches: r.matches }) as ModelItem & {
					_matches?: number[];
				},
		);
	}, [allItems, modelSelector.searchQuery]);

	// Ensure selection is valid (not a header) on mount or search change
	useEffect(() => {
		// If current selection is a header or out of bounds, find first model
		const current = filteredItems[modelSelector.selectedIndex];
		if (!current || current.type === "header") {
			const firstModelIndex = filteredItems.findIndex(
				(i) => i.type === "model",
			);
			if (
				firstModelIndex !== -1 &&
				firstModelIndex !== modelSelector.selectedIndex
			) {
				dispatch({ type: "MODEL_SELECTOR_SELECT", index: firstModelIndex });
			}
		}
	}, [filteredItems, modelSelector.selectedIndex, dispatch]);

	// Handle keyboard
	useInput((input, key) => {
		// Search input handling
		if (key.backspace || key.delete) {
			dispatch({
				type: "MODEL_SELECTOR_SET_SEARCH",
				query: modelSelector.searchQuery.slice(0, -1),
			});
			return;
		}

		if (
			input &&
			!key.ctrl &&
			!key.meta &&
			!key.upArrow &&
			!key.downArrow &&
			!key.leftArrow &&
			!key.rightArrow &&
			!key.return &&
			!key.tab &&
			!key.escape
		) {
			dispatch({
				type: "MODEL_SELECTOR_SET_SEARCH",
				query: modelSelector.searchQuery + input,
			});
			return;
		}

		// Toggle Task Size
		if (key.tab) {
			const newSize = modelSelector.taskSize === "large" ? "small" : "large";
			dispatch({ type: "MODEL_SELECTOR_SET_TASK_SIZE", size: newSize });
			return;
		}

		// Navigation
		if (key.upArrow || (key.ctrl && input === "p")) {
			// Standard navigation
			let newIndex = modelSelector.selectedIndex - 1;
			// Skip headers while moving up
			while (newIndex >= 0 && filteredItems[newIndex]?.type === "header") {
				newIndex--;
			}
			if (newIndex >= 0) {
				dispatch({ type: "MODEL_SELECTOR_SELECT", index: newIndex });
			}
		} else if (key.downArrow || (key.ctrl && input === "n")) {
			let newIndex = modelSelector.selectedIndex + 1;
			// Skip headers while moving down
			while (
				newIndex < filteredItems.length &&
				filteredItems[newIndex]?.type === "header"
			) {
				newIndex++;
			}
			if (newIndex < filteredItems.length) {
				dispatch({ type: "MODEL_SELECTOR_SELECT", index: newIndex });
			}
		} else if (key.return) {
			// Just log selection for now or exit
			// dispatch({ type: 'NAVIGATE', route: { screen: 'plugins' } });
		}
	});

	// Render list item
	const renderItem = (item: ModelItem, _index: number, isSelected: boolean) => {
		if (item.type === "header") {
			// Header style: "Name ----------------------------- Status"
			const status = item.configured ? "✔ Configured" : "";

			return (
				<Box marginY={0}>
					<Text color="gray">{item.label} </Text>
					<Text color="gray" dimColor>
						⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
					</Text>
					{status && <Text color="green"> {status}</Text>}
					{item.provider && <Text color="blue"> {item.provider}</Text>}
				</Box>
			);
		}

		// Model item
		// Matches highlighting
		const matches = (item as ModelItem & { _matches?: number[] })._matches;
		const labelSegment = matches ? highlightMatches(item.label, matches) : null;

		const Label = () => (
			<Text color={isSelected ? "white" : "white"}>
				{labelSegment
					? labelSegment.map((seg, i) => (
							<Text
								key={i}
								color={
									seg.highlighted
										? isSelected
											? "white"
											: "cyan"
										: isSelected
											? "white"
											: "white"
								}
								underline={seg.highlighted}
								bold={seg.highlighted}
							>
								{seg.text}
							</Text>
						))
					: item.label}
			</Text>
		);

		if (isSelected) {
			return (
				<Box overflow="hidden">
					<Text backgroundColor="magenta" color="white">
						{" "}
					</Text>
					<Text backgroundColor="magenta" color="white">
						<Label />
					</Text>
					<Box flexGrow={1}>
						<Text backgroundColor="magenta"> </Text>
					</Box>
					{item.provider && (
						<Text backgroundColor="magenta" color="white">
							{item.provider}{" "}
						</Text>
					)}
				</Box>
			);
		} else {
			return (
				<Box overflow="hidden">
					<Label />
					<Box flexGrow={1} />
					{item.provider && <Text color="gray">{item.provider}</Text>}
				</Box>
			);
		}
	};

	const footerHints = "↑↓ choose • tab toggle type • enter choose • esc exit";
	// Available height calculation
	// Header: 1 line (title) + 1 line (search) + 1 line (separator) = 3 lines?
	// Title line: Switch Model /// (o) Large
	// Cursor line: > c
	// Separator: handled by list? or explicit?

	const listHeight = Math.max(5, dimensions.contentHeight - 5);

	return (
		<Box flexDirection="column" height={dimensions.contentHeight}>
			{/* Top Bar */}
			<Box
				flexDirection="row"
				borderStyle="single"
				borderColor="#7e57c2"
				paddingX={1}
				marginBottom={0}
			>
				<Box flexDirection="column" flexGrow={1}>
					<Box flexDirection="row" justifyContent="space-between">
						<Box>
							<Text color="#7e57c2">Switch Model </Text>
							<Text
								color={modelSelector.taskSize === "large" ? "white" : "gray"}
							>
								{modelSelector.taskSize === "large" ? "◎" : "○"} Large Task
								{"  "}
							</Text>
							<Text
								color={modelSelector.taskSize === "small" ? "white" : "gray"}
							>
								{modelSelector.taskSize === "small" ? "◎" : "○"} Small Task
							</Text>
						</Box>
					</Box>
					<Box flexDirection="row" marginTop={1}>
						<Text color="green">{"> "}</Text>
						<Text>{modelSelector.searchQuery}</Text>
						<Text inverse color="gray">
							{" "}
						</Text>
					</Box>
				</Box>
			</Box>

			{/* Initial selection ensurement */}
			{/* (Handled in reducer or manually here if needed to avoid index -1) */}

			<Box flexGrow={1} paddingX={1}>
				<ScrollableList
					items={filteredItems}
					selectedIndex={modelSelector.selectedIndex}
					renderItem={renderItem}
					maxHeight={listHeight}
					showScrollIndicators={false}
				/>
			</Box>

			<Box
				height={1}
				borderStyle="single"
				borderTop={false}
				borderLeft={false}
				borderRight={false}
				borderBottom={false}
				marginTop={0}
			>
				<Text dimColor>{footerHints}</Text>
			</Box>
		</Box>
	);
}

export default ModelSelectorScreen;

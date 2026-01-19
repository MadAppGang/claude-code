import React, { useEffect, useCallback, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useApp, useModal } from "../state/AppContext.js";
import { useDimensions } from "../state/DimensionsContext.js";
import { ScreenLayout } from "../components/layout/index.js";
import { ScrollableList } from "../components/ScrollableList.js";
import {
	getMcpEnvVars,
	setMcpEnvVar,
	removeMcpEnvVar,
} from "../../services/claude-settings.js";

interface EnvVar {
	name: string;
	value: string;
}

export function EnvVarsScreen(): React.ReactElement {
	const { state, dispatch } = useApp();
	const { envVars } = state;
	const modal = useModal();
	const dimensions = useDimensions();

	const [envVarList, setEnvVarList] = useState<EnvVar[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch data
	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const vars = await getMcpEnvVars(state.projectPath);
			const list = Object.entries(vars).map(([name, value]) => ({
				name,
				value,
			}));
			setEnvVarList(list);
		} catch (error) {
			setEnvVarList([]);
		}
		setIsLoading(false);
	}, [state.projectPath]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Keyboard handling
	useInput((input, key) => {
		if (state.isSearching || state.modal) return;

		if (key.upArrow || input === "k") {
			const newIndex = Math.max(0, envVars.selectedIndex - 1);
			dispatch({ type: "ENVVARS_SELECT", index: newIndex });
		} else if (key.downArrow || input === "j") {
			const newIndex = Math.min(
				Math.max(0, envVarList.length - 1),
				envVars.selectedIndex + 1,
			);
			dispatch({ type: "ENVVARS_SELECT", index: newIndex });
		} else if (input === "a") {
			handleAdd();
		} else if (input === "e" || key.return) {
			handleEdit();
		} else if (input === "d") {
			handleDelete();
		}
	});

	const handleAdd = async () => {
		const varName = await modal.input("Add Variable", "Variable name:");
		if (varName === null || !varName.trim()) return;

		const cleanName = varName
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9_]/g, "_");

		// Check if already exists
		const existing = envVarList.find((v) => v.name === cleanName);
		if (existing) {
			const overwrite = await modal.confirm(
				`${cleanName} exists`,
				"Overwrite existing value?",
			);
			if (!overwrite) return;
		}

		const value = await modal.input(`Set ${cleanName}`, "Value:");
		if (value === null) return;

		modal.loading(`Adding ${cleanName}...`);
		try {
			await setMcpEnvVar(cleanName, value, state.projectPath);
			modal.hideModal();
			await modal.message(
				"Added",
				`${cleanName} added.\nRestart Claude Code to apply.`,
				"success",
			);
			fetchData();
		} catch (error) {
			modal.hideModal();
			await modal.message("Error", `Failed to add: ${error}`, "error");
		}
	};

	const handleEdit = async () => {
		if (envVarList.length === 0) return;
		const envVar = envVarList[envVars.selectedIndex];
		if (!envVar) return;

		const newValue = await modal.input(
			`Edit ${envVar.name}`,
			"New value:",
			envVar.value,
		);
		if (newValue === null) return;

		modal.loading(`Updating ${envVar.name}...`);
		try {
			await setMcpEnvVar(envVar.name, newValue, state.projectPath);
			modal.hideModal();
			await modal.message(
				"Updated",
				`${envVar.name} updated.\nRestart Claude Code to apply.`,
				"success",
			);
			fetchData();
		} catch (error) {
			modal.hideModal();
			await modal.message("Error", `Failed to update: ${error}`, "error");
		}
	};

	const handleDelete = async () => {
		if (envVarList.length === 0) return;
		const envVar = envVarList[envVars.selectedIndex];
		if (!envVar) return;

		const confirmed = await modal.confirm(
			`Delete ${envVar.name}?`,
			"This will remove the variable from configuration.",
		);

		if (confirmed) {
			modal.loading(`Deleting ${envVar.name}...`);
			try {
				await removeMcpEnvVar(envVar.name, state.projectPath);
				modal.hideModal();
				await modal.message("Deleted", `${envVar.name} removed.`, "success");
				fetchData();
			} catch (error) {
				modal.hideModal();
				await modal.message("Error", `Failed to delete: ${error}`, "error");
			}
		}
	};

	// Get selected item
	const selectedVar = envVarList[envVars.selectedIndex];

	const renderDetail = () => {
		if (isLoading) {
			return <Text color="gray">Loading environment variables...</Text>;
		}

		if (envVarList.length === 0) {
			return (
				<Box flexDirection="column">
					<Text color="gray">No environment variables configured.</Text>
					<Box marginTop={1}>
						<Text color="green">Press 'a' to add a new variable</Text>
					</Box>
				</Box>
			);
		}

		if (!selectedVar) {
			return <Text color="gray">Select a variable to see details</Text>;
		}

		return (
			<Box flexDirection="column">
				<Text bold color="cyan">
					{selectedVar.name}
				</Text>
				<Box marginTop={1}>
					<Text color="gray">Value: </Text>
					<Text>
						{selectedVar.value.length > 50
							? selectedVar.value.slice(0, 50) + "..."
							: selectedVar.value}
					</Text>
				</Box>
				<Box marginTop={2} flexDirection="column">
					<Box>
						<Text backgroundColor="magenta" color="white">
							{" "}
							Enter{" "}
						</Text>
						<Text color="gray"> Edit value</Text>
					</Box>
					<Box marginTop={1}>
						<Text backgroundColor="red" color="white">
							{" "}
							d{" "}
						</Text>
						<Text color="gray"> Delete variable</Text>
					</Box>
				</Box>
			</Box>
		);
	};

	const renderListItem = (
		envVar: EnvVar,
		_idx: number,
		isSelected: boolean,
	) => {
		const masked =
			envVar.value.length > 20
				? envVar.value.slice(0, 20) + "..."
				: envVar.value;
		return isSelected ? (
			<Text backgroundColor="magenta" color="white" wrap="truncate">
				{" "}
				{envVar.name} = "{masked}"{" "}
			</Text>
		) : (
			<Text wrap="truncate">
				<Text color="cyan">{envVar.name}</Text>
				<Text color="gray"> = "{masked}"</Text>
			</Text>
		);
	};

	const statusContent = (
		<>
			<Text color="gray">Variables: </Text>
			<Text color="cyan">{envVarList.length}</Text>
			<Text color="gray"> │ Location: </Text>
			<Text color="green">.claude/settings.local.json</Text>
		</>
	);

	return (
		<ScreenLayout
			title="claudeup Environment Variables"
			currentScreen="env-vars"
			statusLine={statusContent}
			footerHints="↑↓:nav │ Enter/e:edit │ a:add │ d:delete"
			listPanel={
				envVarList.length === 0 ? (
					<Text color="gray">No environment variables configured</Text>
				) : (
					<ScrollableList
						items={envVarList}
						selectedIndex={envVars.selectedIndex}
						renderItem={renderListItem}
						maxHeight={dimensions.listPanelHeight}
					/>
				)
			}
			detailPanel={renderDetail()}
		/>
	);
}

export default EnvVarsScreen;

import React, { useEffect, useCallback, useState } from "react";
import { useApp, useModal } from "../state/AppContext.js";
import { useDimensions } from "../state/DimensionsContext.js";
import { useKeyboard } from "../hooks/useKeyboard.js";
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

export function EnvVarsScreen() {
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
	useKeyboard((event) => {
		if (state.isSearching || state.modal) return;

		if (event.name === "up" || event.name === "k") {
			const newIndex = Math.max(0, envVars.selectedIndex - 1);
			dispatch({ type: "ENVVARS_SELECT", index: newIndex });
		} else if (event.name === "down" || event.name === "j") {
			const newIndex = Math.min(
				Math.max(0, envVarList.length - 1),
				envVars.selectedIndex + 1,
			);
			dispatch({ type: "ENVVARS_SELECT", index: newIndex });
		} else if (event.name === "a") {
			handleAdd();
		} else if (event.name === "e" || event.name === "enter") {
			handleEdit();
		} else if (event.name === "d") {
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
			return <text fg="gray">Loading environment variables...</text>;
		}

		if (envVarList.length === 0) {
			return (
				<box flexDirection="column">
					<text fg="gray">No environment variables configured.</text>
					<box marginTop={1}>
						<text fg="green">Press 'a' to add a new variable</text>
					</box>
				</box>
			);
		}

		if (!selectedVar) {
			return <text fg="gray">Select a variable to see details</text>;
		}

		return (
			<box flexDirection="column">
				<text fg="cyan">
					<strong>{selectedVar.name}</strong>
				</text>
				<box marginTop={1}>
					<text fg="gray">Value: </text>
					<text>
						{selectedVar.value.length > 50
							? selectedVar.value.slice(0, 50) + "..."
							: selectedVar.value}
					</text>
				</box>
				<box marginTop={2} flexDirection="column">
					<box>
						<text bg="magenta" fg="white">
							{" "}
							Enter{" "}
						</text>
						<text fg="gray"> Edit value</text>
					</box>
					<box marginTop={1}>
						<text bg="red" fg="white">
							{" "}
							d{" "}
						</text>
						<text fg="gray"> Delete variable</text>
					</box>
				</box>
			</box>
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
			<text bg="magenta" fg="white">
				{" "}
				{envVar.name} = "{masked}"{" "}
			</text>
		) : (
			<text>
				<span fg="cyan">{envVar.name}</span>
				<span fg="gray"> = "{masked}"</span>
			</text>
		);
	};

	const statusContent = (
		<>
			<text fg="gray">Variables: </text>
			<text fg="cyan">{envVarList.length}</text>
			<text fg="gray"> │ Location: </text>
			<text fg="green">.claude/settings.local.json</text>
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
					<text fg="gray">No environment variables configured</text>
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

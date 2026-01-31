import React, { useState } from "react";
import { useKeyboard } from "../../hooks/useKeyboard.js";
import type { SelectOption } from "../../state/types.js";

interface SelectModalProps {
	/** Modal title */
	title: string;
	/** Modal message */
	message: string;
	/** Select options */
	options: SelectOption[];
	/** Callback when option selected */
	onSelect: (value: string) => void;
	/** Callback when cancelled */
	onCancel: () => void;
}

export function SelectModal({
	title,
	message,
	options,
	onSelect,
	onCancel,
}: SelectModalProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	useKeyboard((key) => {
		if (key.name === "enter") {
			onSelect(options[selectedIndex].value);
		} else if (key.name === "escape" || key.name === "q") {
			onCancel();
		} else if (key.name === "up" || key.name === "k") {
			setSelectedIndex((prev) => Math.max(0, prev - 1));
		} else if (key.name === "down" || key.name === "j") {
			setSelectedIndex((prev) => Math.min(options.length - 1, prev + 1));
		}
	});

	return (
		<box
			flexDirection="column"
			border
			borderStyle="rounded"
			borderColor="cyan"
			paddingLeft={2}
			paddingRight={2}
			paddingTop={1}
			paddingBottom={1}
			width={50}
		>
			<text>
				<strong>{title}</strong>
			</text>

			<box marginTop={1} marginBottom={1}>
				<text>{message}</text>
			</box>

			<box flexDirection="column">
				{options.map((option, idx) => {
					const isSelected = idx === selectedIndex;
					const label = isSelected ? `> ${option.label}` : `  ${option.label}`;
					return (
						<text
							key={option.value}
							fg={isSelected ? "cyan" : "#666666"}
						>
							{isSelected && <strong>{label}</strong>}
							{!isSelected && label}
						</text>
					);
				})}
			</box>

			<box marginTop={1}>
				<text fg="#666666">↑↓ Select • Enter • Esc</text>
			</box>
		</box>
	);
}

export default SelectModal;

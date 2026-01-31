import React, { useState } from "react";
import { useKeyboard } from "../../hooks/useKeyboard.js";

interface InputModalProps {
	/** Modal title */
	title: string;
	/** Input label */
	label: string;
	/** Default input value */
	defaultValue?: string;
	/** Callback when submitted */
	onSubmit: (value: string) => void;
	/** Callback when cancelled */
	onCancel: () => void;
}

export function InputModal({
	title,
	label,
	defaultValue = "",
	onSubmit,
	onCancel,
}: InputModalProps) {
	const [value, setValue] = useState(defaultValue);

	useKeyboard((key) => {
		if (key.name === "enter") {
			onSubmit(value);
		} else if (key.name === "escape") {
			onCancel();
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
			width={60}
		>
			<text>
				<strong>{title}</strong>
			</text>

			<box marginTop={1} marginBottom={1}>
				<text>{label}</text>
			</box>

			<input
				value={value}
				onChange={setValue}
				focused
				width={54}
			/>

			<box marginTop={1}>
				<text fg="#666666">Enter to confirm • Escape to cancel</text>
			</box>
		</box>
	);
}

export default InputModal;

import React from "react";
import { useKeyboard } from "../../hooks/useKeyboard.js";

interface ConfirmModalProps {
	/** Modal title */
	title: string;
	/** Modal message */
	message: string;
	/** Callback when confirmed */
	onConfirm: () => void;
	/** Callback when cancelled */
	onCancel: () => void;
}

export function ConfirmModal({
	title,
	message,
	onConfirm,
	onCancel,
}: ConfirmModalProps) {
	useKeyboard((key) => {
		if (key.name === "y" || key.name === "Y") {
			onConfirm();
		} else if (key.name === "n" || key.name === "N" || key.name === "escape") {
			onCancel();
		}
	});

	return (
		<box
			flexDirection="column"
			border
			borderStyle="rounded"
			borderColor="yellow"
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
				<text>{message}</text>
			</box>
			<box>
				<text>
					<span fg="green">[Y]</span>
					<span>es </span>
					<span fg="red">[N]</span>
					<span>o</span>
				</text>
			</box>
		</box>
	);
}

export default ConfirmModal;

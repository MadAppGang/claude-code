import React from "react";
import { useKeyboard } from "../../hooks/useKeyboard.js";

interface MessageModalProps {
	/** Modal title */
	title: string;
	/** Modal message */
	message: string;
	/** Message variant */
	variant: "info" | "success" | "error";
	/** Callback when dismissed */
	onDismiss: () => void;
}

const variantConfig = {
	info: { icon: "ℹ", color: "cyan" },
	success: { icon: "✓", color: "green" },
	error: { icon: "✗", color: "red" },
} as const;

export function MessageModal({
	title,
	message,
	variant,
	onDismiss,
}: MessageModalProps) {
	const config = variantConfig[variant];

	useKeyboard(() => {
		// Any key dismisses
		onDismiss();
	});

	return (
		<box
			flexDirection="column"
			border
			borderStyle="rounded"
			borderColor={config.color}
			paddingLeft={2}
			paddingRight={2}
			paddingTop={1}
			paddingBottom={1}
			width={60}
		>
			<box>
				<text fg={config.color}>{config.icon} </text>
				<text>
					<strong>{title}</strong>
				</text>
			</box>

			<box marginTop={1} marginBottom={1}>
				<text>{message}</text>
			</box>

			<box>
				<text fg="#666666">Press any key to continue</text>
			</box>
		</box>
	);
}

export default MessageModal;

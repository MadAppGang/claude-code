import React from "react";
import { Box, Text } from "ink";

interface ProgressBarProps {
	/** Progress message */
	message: string;
	/** Current progress (if determinate) */
	current?: number;
	/** Total items (if determinate) */
	total?: number;
}

export function ProgressBar({
	message,
	current,
	total,
}: ProgressBarProps): React.ReactElement {
	const isDeterminate =
		current !== undefined && total !== undefined && total > 0;

	if (isDeterminate) {
		const barWidth = 20;
		const filled = Math.round((current / total) * barWidth);
		const empty = barWidth - filled;
		const bar = "█".repeat(filled) + "░".repeat(empty);

		return (
			<Box>
				<Text color="cyan">⟳</Text>
				<Text> {message} </Text>
				<Text color="cyan">
					[{bar}] {current}/{total}
				</Text>
			</Box>
		);
	}

	// Indeterminate progress
	return (
		<Box>
			<Text color="cyan">⟳</Text>
			<Text> {message}</Text>
			<Text color="gray"> ...</Text>
		</Box>
	);
}

export default ProgressBar;

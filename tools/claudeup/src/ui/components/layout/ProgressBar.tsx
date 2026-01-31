import React from "react";

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
}: ProgressBarProps) {
	const isDeterminate =
		current !== undefined && total !== undefined && total > 0;

	if (isDeterminate) {
		const barWidth = 20;
		const filled = Math.round((current / total) * barWidth);
		const empty = barWidth - filled;
		const bar = "█".repeat(filled) + "░".repeat(empty);

		return (
			<box>
				<text fg="cyan">⟳</text>
				<text> {message} </text>
				<text fg="cyan">
					[{bar}] {current}/{total}
				</text>
			</box>
		);
	}

	// Indeterminate progress
	return (
		<box>
			<text fg="cyan">⟳</text>
			<text> {message}</text>
			<text fg="gray"> ...</text>
		</box>
	);
}

export default ProgressBar;

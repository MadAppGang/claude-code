import React from "react";
import { Text } from "ink";

interface CategoryHeaderProps {
	/** Category title */
	title: string;
	/** Status badge (e.g., "✓ Configured", "3 plugins") */
	status?: string;
	/** Status badge color */
	statusColor?: string;
	/** Whether category is expanded */
	expanded?: boolean;
	/** Number of items in category */
	count?: number;
}

export function CategoryHeader({
	title,
	status,
	statusColor = "green",
	expanded = true,
	count,
}: CategoryHeaderProps): React.ReactElement {
	const expandIcon = expanded ? "▼" : "▶";
	const countBadge = count !== undefined ? ` (${count})` : "";
	const statusText = status ? ` ${status}` : "";

	// Simple format without dynamic line calculation
	return (
		<Text>
			<Text color="gray" dimColor>
				{expandIcon}
			</Text>
			<Text color="white" bold>
				{" "}
				{title}
			</Text>
			<Text color="gray" dimColor>
				{countBadge}
			</Text>
			<Text color="gray" dimColor>
				{" "}
				────
			</Text>
			<Text color={statusColor}>{statusText}</Text>
		</Text>
	);
}

export default CategoryHeader;

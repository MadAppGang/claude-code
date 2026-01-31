import React from "react";

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
}: CategoryHeaderProps) {
	const expandIcon = expanded ? "▼" : "▶";
	const countBadge = count !== undefined ? ` (${count})` : "";
	const statusText = status ? ` ${status}` : "";

	// Simple format without dynamic line calculation
	return (
		<text>
			<span fg="#666666">{expandIcon}</span>
			<span fg="white">
				<strong> {title}</strong>
			</span>
			<span fg="#666666">{countBadge}</span>
			<span fg="#666666"> ────</span>
			<span fg={statusColor}>{statusText}</span>
		</text>
	);
}

export default CategoryHeader;

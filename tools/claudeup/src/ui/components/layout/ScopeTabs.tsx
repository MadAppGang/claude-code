import React from "react";

interface ScopeTabsProps {
	/** Current scope */
	scope: "project" | "global";
	/** Callback when scope changes */
	onToggle?: () => void;
	/** Hint text for toggle key */
	toggleHint?: string;
}

export function ScopeTabs({
	scope,
	onToggle: _onToggle,
	toggleHint,
}: ScopeTabsProps) {
	const isProject = scope === "project";

	return (
		<box marginBottom={1} flexDirection="row" gap={1}>
			{/* Project tab */}
			<box>
				{isProject ? (
					<text bg="cyan" fg="black">
						<strong> ◆ Project </strong>
					</text>
				) : (
					<text fg="gray"> ○ Project </text>
				)}
			</box>

			{/* Global tab */}
			<box>
				{!isProject ? (
					<text bg="magenta" fg="white">
						<strong> ◆ Global </strong>
					</text>
				) : (
					<text fg="gray"> ○ Global </text>
				)}
			</box>

			{/* Toggle hint */}
			{toggleHint && (
				<box marginLeft={2}>
					<text fg="#666666">({toggleHint})</text>
				</box>
			)}
		</box>
	);
}

export default ScopeTabs;

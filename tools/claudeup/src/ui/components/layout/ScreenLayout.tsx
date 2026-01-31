import React from "react";
import { useDimensions } from "../../state/DimensionsContext.js";
import { TabBar } from "../TabBar.js";
import type { Screen } from "../../state/types.js";

interface ScreenLayoutProps {
	/** Screen title (e.g., "claudeup Plugins") */
	title: string;
	/** Optional subtitle shown to the right of title */
	subtitle?: string;
	/** Current screen for tab highlighting */
	currentScreen: Screen;
	/** Search bar configuration (for screens with search) */
	search?: {
		/** Is search currently active */
		isActive: boolean;
		/** Current search query */
		query: string;
		/** Placeholder when not searching (default: "/") */
		placeholder?: string;
	};
	/** Status line content (for screens without search) - shown in second row */
	statusLine?: React.ReactNode;
	/** Footer hints (left side) */
	footerHints: string;
	/** Left panel content */
	listPanel: React.ReactNode;
	/** Right panel content (detail view) */
	detailPanel: React.ReactNode;
}

const HEADER_COLOR = "#7e57c2";

export function ScreenLayout({
	title,
	subtitle,
	currentScreen,
	search,
	statusLine,
	footerHints,
	listPanel,
	detailPanel,
}: ScreenLayoutProps) {
	const dimensions = useDimensions();

	// Calculate panel heights
	// Header: 4 lines (border + title + status/search + border)
	// Footer: 2 lines (border-top + content)
	const headerHeight = 4;
	const footerHeight = 2;
	const panelHeight = Math.max(
		5,
		dimensions.contentHeight - headerHeight - footerHeight,
	);

	return (
		<box flexDirection="column" height={dimensions.contentHeight}>
			{/* Header */}
			<box
				flexDirection="column"
				border
				borderStyle="single"
				borderColor={HEADER_COLOR}
				padding={1}
				marginBottom={0}
			>
				{/* Title row */}
				<box flexDirection="row" justifyContent="space-between">
					<text fg={HEADER_COLOR}>
						<strong>{title}</strong>
					</text>
					{subtitle && <text fg="gray">{subtitle}</text>}
				</box>

				{/* Status/Search row - always present */}
				<box flexDirection="row" marginTop={0}>
					{search ? (
						// Search mode
						<>
							<text fg="green">{"> "}</text>
							{search.isActive ? (
								<>
									<text fg="white">{search.query}</text>
									<text bg="white" fg="black"> </text>
								</>
							) : (
								<text fg="gray">
									{search.query || search.placeholder || "/"}
								</text>
							)}
						</>
					) : statusLine ? (
						// Custom status line
						statusLine
					) : (
						// Default empty status
						<text fg="gray">─</text>
					)}
				</box>
			</box>

			{/* Main content area */}
			<box flexDirection="row" height={panelHeight}>
				{/* List panel */}
				<box
					flexDirection="column"
					width="49%"
					height={panelHeight}
					paddingRight={1}
				>
					{listPanel}
				</box>

				{/* Vertical separator */}
				<box
					flexDirection="column"
					width={1}
					height={panelHeight}
				>
					<text fg="#444444">{"│".repeat(panelHeight)}</text>
				</box>

				{/* Detail panel */}
				<box
					flexDirection="column"
					width="50%"
					height={panelHeight}
					paddingLeft={1}
				>
					{detailPanel}
				</box>
			</box>

			{/* Footer */}
			<box
				height={1}
				flexDirection="row"
				justifyContent="space-between"
			>
				<text fg="gray">{footerHints}</text>
				<TabBar currentScreen={currentScreen} />
			</box>
		</box>
	);
}

export default ScreenLayout;

import React from "react";

interface PanelProps {
	/** Panel title */
	title?: string;
	/** Panel content */
	children: React.ReactNode;
	/** Border color */
	borderColor?: string;
	/** Title color */
	titleColor?: string;
	/** Panel width - number or percentage like "50%" */
	width?: number | `${number}%` | "auto";
	/** Panel height - number or percentage like "50%" */
	height?: number | `${number}%` | "auto";
	/** Whether to use flexGrow */
	flexGrow?: number;
	/** Whether panel is focused/active */
	focused?: boolean;
}

export function Panel({
	title,
	children,
	borderColor = "#7e57c2",
	titleColor = "#7e57c2",
	width,
	height,
	flexGrow = 1,
	focused = false,
}: PanelProps) {
	const activeColor = focused ? "#7e57c2" : borderColor;

	return (
		<box
			flexDirection="column"
			width={width}
			height={height}
			flexGrow={flexGrow}
			border
			borderStyle="single"
			borderColor={activeColor}
			padding={1}
		>
			{/* Title row */}
			{title && (
				<box marginBottom={0}>
					<text fg={titleColor}>
						<strong>{title}</strong>
					</text>
				</box>
			)}

			{/* Content */}
			<box flexDirection="column" flexGrow={1}>
				{children}
			</box>
		</box>
	);
}

export default Panel;

import React from "react";

interface StyledTextProps {
	/** Text content */
	children: React.ReactNode;
	/** Bold text */
	bold?: boolean;
	/** Foreground color */
	color?: string;
	/** Background color */
	bgColor?: string;
	/** Dimmed text */
	dim?: boolean;
	/** Italic text */
	italic?: boolean;
	/** Underlined text */
	underline?: boolean;
	/** Inverse colors */
	inverse?: boolean;
}

/**
 * StyledText - Utility component to simplify text styling with OpenTUI
 *
 * Converts props to nested tag pattern required by OpenTUI.
 *
 * Example:
 *   <StyledText bold color="green">Success</StyledText>
 *   becomes: <text fg="green"><strong>Success</strong></text>
 */
export function StyledText({
	children,
	bold = false,
	color,
	bgColor,
	dim = false,
	italic = false,
	underline = false,
	inverse = false,
}: StyledTextProps) {
	let content: React.ReactNode = children;

	// Apply text modifiers (innermost to outermost)
	if (bold) {
		content = <strong>{content}</strong>;
	}
	if (italic) {
		content = <em>{content}</em>;
	}
	if (underline) {
		content = <u>{content}</u>;
	}
	// Note: dim and inverse use span with colors since OpenTUI doesn't have these as React elements
	if (dim) {
		content = <span fg="#666666">{content}</span>;
	}
	if (inverse) {
		// Inverse effect approximated with contrasting colors
		content = <span fg="black" bg="white">{content}</span>;
	}

	// Apply colors (outer layer)
	const textProps: { fg?: string; bg?: string } = {};
	if (color) textProps.fg = color;
	if (bgColor) textProps.bg = bgColor;

	return <text {...textProps}>{content}</text>;
}

export default StyledText;

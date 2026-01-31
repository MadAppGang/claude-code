/**
 * Type declarations for OpenTUI React
 *
 * These declarations extend OpenTUI's types to be compatible with React 19's
 * more permissive return types. React 19 allows components to return ReactNode
 * (which includes undefined), while OpenTUI's intrinsic elements expect
 * ReactElement | null.
 */

import type { ReactNode } from "react";

declare global {
	namespace JSX {
		interface IntrinsicElements {
			box: BoxProps & { children?: ReactNode };
			text: TextProps & { children?: ReactNode };
			input: InputProps;
			select: SelectProps;
			"tab-select": TabSelectProps;
			scrollbox: ScrollboxProps & { children?: ReactNode };
			"ascii-font": AsciiFontProps;
			code: CodeProps;
			"line-number": LineNumberProps;
			diff: DiffProps;
			br: Record<string, never>;
			strong: { children?: ReactNode };
			em: { children?: ReactNode };
			u: { children?: ReactNode };
			dim: { children?: ReactNode };
			a: { href?: string; children?: ReactNode };
			span: { fg?: string; bg?: string; children?: ReactNode };
		}
	}
}

interface BaseBoxProps {
	// Borders
	border?: boolean;
	borderStyle?: "single" | "double" | "rounded" | "bold";
	borderColor?: string;
	title?: string;
	titleAlignment?: "left" | "center" | "right";

	// Colors
	backgroundColor?: string;

	// Layout (Flexbox)
	flexDirection?: "row" | "column";
	justifyContent?:
		| "flex-start"
		| "flex-end"
		| "center"
		| "space-between"
		| "space-around";
	alignItems?: "flex-start" | "flex-end" | "center" | "stretch";
	flexWrap?: "wrap" | "nowrap";
	gap?: number;

	// Spacing
	padding?: number;
	paddingTop?: number;
	paddingBottom?: number;
	paddingLeft?: number;
	paddingRight?: number;
	margin?: number;
	marginTop?: number;
	marginBottom?: number;
	marginLeft?: number;
	marginRight?: number;

	// Dimensions
	width?: number | `${number}%` | "auto";
	height?: number | `${number}%` | "auto";
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	flexGrow?: number;
	flexShrink?: number;
	flexBasis?: number | `${number}%` | "auto";

	// Overflow
	overflow?: "hidden" | "visible";

	// Events
	onMouseDown?: (e: MouseEvent) => void;
	onMouseUp?: (e: MouseEvent) => void;
	onMouseMove?: (e: MouseEvent) => void;
}

interface BoxProps extends BaseBoxProps {
	children?: ReactNode;
}

interface TextProps {
	content?: string;
	fg?: string;
	bg?: string;
	selectable?: boolean;
	children?: ReactNode;
}

interface InputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	focused?: boolean;
	width?: number;
	backgroundColor?: string;
	textColor?: string;
	cursorColor?: string;
	focusedBackgroundColor?: string;
}

interface SelectOption {
	name: string;
	description?: string;
	value?: string;
}

interface SelectProps {
	options: SelectOption[];
	onChange?: (index: number, option: SelectOption) => void;
	onSelect?: (index: number, option: SelectOption) => void;
	selectedIndex?: number;
	focused?: boolean;
	showScrollIndicator?: boolean;
	height?: number;
}

interface TabSelectProps {
	options: { name: string; description?: string }[];
	onChange?: (index: number, option: { name: string }) => void;
	tabWidth?: number;
	focused?: boolean;
}

interface ScrollboxProps {
	focused?: boolean;
	style?: {
		rootOptions?: Record<string, unknown>;
		wrapperOptions?: Record<string, unknown>;
		viewportOptions?: Record<string, unknown>;
		contentOptions?: Record<string, unknown>;
		scrollbarOptions?: {
			showArrows?: boolean;
			trackOptions?: {
				foregroundColor?: string;
				backgroundColor?: string;
			};
		};
	};
	children?: ReactNode;
}

interface AsciiFontProps {
	text: string;
	font?: "tiny" | "block" | "slick" | "shade";
	color?: string;
}

interface CodeProps {
	code: string;
	language?: string;
	showLineNumbers?: boolean;
	highlightLines?: number[];
}

interface LineNumberProps {
	code: string;
	language?: string;
	startLine?: number;
	highlightedLines?: number[];
	diagnostics?: { line: number; severity: string; message: string }[];
}

interface DiffProps {
	oldCode: string;
	newCode: string;
	language?: string;
	mode?: "unified" | "split";
	showLineNumbers?: boolean;
}

interface MouseEvent {
	x: number;
	y: number;
	button: number;
}

export {};

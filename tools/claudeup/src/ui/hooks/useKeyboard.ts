import { useKeyboard as useOpenTUIKeyboard } from "@opentui/react";

/**
 * OpenTUI keyboard event type
 */
export interface KeyEvent {
	name: string;
	ctrl?: boolean;
	shift?: boolean;
	meta?: boolean;
}

/**
 * Simple re-export of OpenTUI's useKeyboard hook
 * Used by modals for direct keyboard event handling
 *
 * Key names in OpenTUI:
 * - Single characters: "a", "1", etc.
 * - Arrow keys: "up", "down", "left", "right"
 * - Special: "enter", "escape", "tab", "backspace", "delete"
 */
export function useKeyboard(
	handler: (event: KeyEvent) => void,
): void {
	useOpenTUIKeyboard(handler);
}

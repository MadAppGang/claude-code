import React from 'react';
import { useKeyboardHandler } from '../hooks/useKeyboardHandler.js';

interface SearchInputProps {
	/** Current search value */
	value: string;
	/** Called when value changes */
	onChange: (value: string) => void;
	/** Placeholder text when empty */
	placeholder?: string;
	/** Whether the input is focused/active */
	isActive: boolean;
	/** Called when user presses escape to exit search */
	onExit?: () => void;
	/** Called when user presses enter */
	onSubmit?: () => void;
}

export function SearchInput({
	value,
	onChange,
	placeholder = 'Search...',
	isActive,
	onExit,
	onSubmit,
}: SearchInputProps) {
	// Handle keyboard shortcuts when active
	useKeyboardHandler((_input, key) => {
		if (!isActive) return;

		if (key.escape) {
			onExit?.();
			return;
		}

		if (key.return) {
			onSubmit?.();
			return;
		}
	});

	return (
		<box flexDirection="row">
			<text fg="cyan">❯ </text>
			<input
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				focused={isActive}
				width={40}
			/>
		</box>
	);
}

export default SearchInput;

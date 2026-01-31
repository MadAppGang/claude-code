import React, { useState, useEffect, useMemo } from 'react';
import { useKeyboardHandler } from '../hooks/useKeyboardHandler';

interface ScrollableListProps<T> {
	/** Array of items to display */
	items: T[];
	/** Currently selected index */
	selectedIndex: number;
	/** Render function for each item */
	renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
	/** Maximum visible height (number of lines) - REQUIRED for proper rendering */
	maxHeight: number;
	/** Show scroll indicators */
	showScrollIndicators?: boolean;
	/** Called when selection changes (arrow keys) */
	onSelect?: (index: number) => void;
	/** Whether this list should receive keyboard input */
	focused?: boolean;
}

export function ScrollableList<T>({
	items,
	selectedIndex,
	renderItem,
	maxHeight,
	showScrollIndicators = true,
	onSelect,
	focused = false,
}: ScrollableListProps<T>) {
	const [scrollOffset, setScrollOffset] = useState(0);

	// Handle keyboard navigation
	useKeyboardHandler((input, key) => {
		if (!focused || !onSelect) return;

		if (key.upArrow || input === 'k') {
			const newIndex = Math.max(0, selectedIndex - 1);
			onSelect(newIndex);
		} else if (key.downArrow || input === 'j') {
			const newIndex = Math.min(items.length - 1, selectedIndex + 1);
			onSelect(newIndex);
		}
	});

	// Account for scroll indicators in available space
	const hasItemsAbove = scrollOffset > 0;
	const hasItemsBelow = scrollOffset + maxHeight < items.length;
	const indicatorLines =
		(showScrollIndicators && hasItemsAbove ? 1 : 0) +
		(showScrollIndicators && hasItemsBelow ? 1 : 0);
	const effectiveMaxHeight = Math.max(1, maxHeight - indicatorLines);

	// Adjust scroll offset to keep selected item visible
	useEffect(() => {
		if (selectedIndex < scrollOffset) {
			// Selected is above viewport - scroll up
			setScrollOffset(selectedIndex);
		} else if (selectedIndex >= scrollOffset + effectiveMaxHeight) {
			// Selected is below viewport - scroll down
			setScrollOffset(selectedIndex - effectiveMaxHeight + 1);
		}
	}, [selectedIndex, effectiveMaxHeight, scrollOffset]);

	// Calculate visible items - strictly limited to effectiveMaxHeight
	const visibleItems = useMemo(() => {
		const start = scrollOffset;
		const end = Math.min(scrollOffset + effectiveMaxHeight, items.length);
		return items.slice(start, end).map((item, idx) => ({
			item,
			originalIndex: start + idx,
		}));
	}, [items, scrollOffset, effectiveMaxHeight]);

	const itemsBelow = items.length - scrollOffset - effectiveMaxHeight;

	return (
		<box flexDirection="column">
			{/* Scroll up indicator */}
			{showScrollIndicators && hasItemsAbove && (
				<text fg="cyan">↑ {scrollOffset} more</text>
			)}

			{/* Visible items - strictly limited */}
			{visibleItems.map(({ item, originalIndex }) => (
				<box key={originalIndex} width="100%" overflow="hidden">
					{renderItem(item, originalIndex, originalIndex === selectedIndex)}
				</box>
			))}

			{/* Scroll down indicator */}
			{showScrollIndicators && hasItemsBelow && (
				<text fg="cyan">↓ {itemsBelow} more</text>
			)}
		</box>
	);
}

export default ScrollableList;

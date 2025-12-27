import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';

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
}

export function ScrollableList<T>({
  items,
  selectedIndex,
  renderItem,
  maxHeight,
  showScrollIndicators = true,
}: ScrollableListProps<T>): React.ReactElement {
  const [scrollOffset, setScrollOffset] = useState(0);

  // Account for scroll indicators in available space
  const hasItemsAbove = scrollOffset > 0;
  const hasItemsBelow = scrollOffset + maxHeight < items.length;
  const indicatorLines = (showScrollIndicators && hasItemsAbove ? 1 : 0) + (showScrollIndicators && hasItemsBelow ? 1 : 0);
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
    <Box flexDirection="column">
      {/* Scroll up indicator */}
      {showScrollIndicators && hasItemsAbove && (
        <Text color="cyan">↑ {scrollOffset} more</Text>
      )}

      {/* Visible items - strictly limited */}
      {visibleItems.map(({ item, originalIndex }) => (
        <Box key={originalIndex} width="100%" overflow="hidden">
          {renderItem(item, originalIndex, originalIndex === selectedIndex)}
        </Box>
      ))}

      {/* Scroll down indicator */}
      {showScrollIndicators && hasItemsBelow && (
        <Text color="cyan">↓ {itemsBelow} more</Text>
      )}
    </Box>
  );
}

export default ScrollableList;

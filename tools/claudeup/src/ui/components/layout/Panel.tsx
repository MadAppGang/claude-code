import React from 'react';
import { Box, Text } from 'ink';

interface PanelProps {
  /** Panel title */
  title?: string;
  /** Panel content */
  children: React.ReactNode;
  /** Border color */
  borderColor?: string;
  /** Title color */
  titleColor?: string;
  /** Panel width */
  width?: number | string;
  /** Panel height */
  height?: number | string;
  /** Whether to use flexGrow */
  flexGrow?: number;
  /** Whether panel is focused/active */
  focused?: boolean;
}

export function Panel({
  title,
  children,
  borderColor = '#7e57c2',
  titleColor = '#7e57c2',
  width,
  height,
  flexGrow = 1,
  focused = false,
}: PanelProps): React.ReactElement {
  const activeColor = focused ? '#7e57c2' : borderColor;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      flexGrow={flexGrow}
      borderStyle="single"
      borderColor={activeColor}
      paddingX={1}
      overflow="hidden"
    >
      {/* Title row */}
      {title && (
        <Box marginBottom={0}>
          <Text color={titleColor} bold>
            {title}
          </Text>
        </Box>
      )}

      {/* Content - overflow hidden to clip content that exceeds panel */}
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {children}
      </Box>
    </Box>
  );
}

export default Panel;

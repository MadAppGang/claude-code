import React from 'react';
import { Box, Text } from 'ink';
import { useDimensions } from '../../state/DimensionsContext.js';
import { TabBar } from '../TabBar.js';
import type { Screen } from '../../state/types.js';

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

const HEADER_COLOR = '#7e57c2';

export function ScreenLayout({
  title,
  subtitle,
  currentScreen,
  search,
  statusLine,
  footerHints,
  listPanel,
  detailPanel,
}: ScreenLayoutProps): React.ReactElement {
  const dimensions = useDimensions();

  // Calculate panel heights
  // Header: 4 lines (border + title + status/search + border)
  // Footer: 2 lines (border-top + content)
  const headerHeight = 4;
  const footerHeight = 2;
  const panelHeight = Math.max(5, dimensions.contentHeight - headerHeight - footerHeight);

  return (
    <Box flexDirection="column" height={dimensions.contentHeight}>
      {/* Header */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor={HEADER_COLOR}
        paddingX={1}
        marginBottom={0}
      >
        {/* Title row */}
        <Box flexDirection="row" justifyContent="space-between">
          <Text color={HEADER_COLOR} bold>{title}</Text>
          {subtitle && <Text color="gray">{subtitle}</Text>}
        </Box>

        {/* Status/Search row - always present */}
        <Box flexDirection="row" marginTop={0}>
          {search ? (
            // Search mode
            <>
              <Text color="green">{'> '}</Text>
              {search.isActive ? (
                <>
                  <Text color="white">{search.query}</Text>
                  <Text inverse color="gray"> </Text>
                </>
              ) : (
                <Text color="gray">{search.query || search.placeholder || '/'}</Text>
              )}
            </>
          ) : statusLine ? (
            // Custom status line
            statusLine
          ) : (
            // Default empty status
            <Text color="gray">─</Text>
          )}
        </Box>
      </Box>

      {/* Main content area */}
      <Box flexDirection="row" height={panelHeight}>
        {/* List panel */}
        <Box
          flexDirection="column"
          width="50%"
          height={panelHeight}
          paddingRight={1}
          borderStyle="single"
          borderTop={false}
          borderBottom={false}
          borderColor="gray"
          overflow="hidden"
        >
          {listPanel}
        </Box>

        {/* Detail panel */}
        <Box flexDirection="column" width="50%" height={panelHeight} paddingLeft={1} overflow="hidden">
          {detailPanel}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        height={1}
        borderStyle="single"
        borderTop={true}
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        borderColor="gray"
        flexDirection="row"
        justifyContent="space-between"
      >
        <Text dimColor>{footerHints}</Text>
        <TabBar currentScreen={currentScreen} />
      </Box>
    </Box>
  );
}

export default ScreenLayout;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStdout } from 'ink';

interface Dimensions {
  /** Terminal width */
  terminalWidth: number;
  /** Terminal height */
  terminalHeight: number;
  /** Available height for main content (excluding header, footer, margins) */
  contentHeight: number;
  /** Available width for content (excluding borders, padding) */
  contentWidth: number;
  /** Available lines for ScrollableList in list panels */
  listPanelHeight: number;
}

const DimensionsContext = createContext<Dimensions | null>(null);

// Fixed heights for layout elements
const SCREEN_HEADER_HEIGHT = 4; // ScreenLayout: border + title row + status/search row + border
const SCREEN_FOOTER_HEIGHT = 2; // ScreenLayout: border-top + footer content
const APP_MARGINS = 1; // buffer for margins/padding
const PROGRESS_HEIGHT = 1; // when visible

interface DimensionsProviderProps {
  children: React.ReactNode;
  /** Whether progress bar is visible */
  showProgress?: boolean;
  /** Whether debug bar is visible */
  showDebug?: boolean;
}

function calculateDimensions(
  columns: number,
  rows: number,
  showProgress: boolean,
  showDebug: boolean
): Dimensions {
  const terminalWidth = columns;
  const terminalHeight = rows;

  // Calculate total available height for ScreenLayout (includes its header, panels, footer)
  let contentHeight = terminalHeight - APP_MARGINS;
  if (showProgress) contentHeight -= PROGRESS_HEIGHT;
  if (showDebug) contentHeight -= 1;
  contentHeight = Math.max(10, contentHeight); // Minimum 10 lines for full layout

  // Calculate available content width (accounting for padding)
  const contentWidth = Math.max(40, terminalWidth - 4);

  // Calculate list panel height for ScrollableList
  // ScreenLayout uses: panelHeight = contentHeight - 4 (header) - 1 (footer)
  // The ScrollableList sits inside the panel
  const listPanelHeight = Math.max(3, contentHeight - SCREEN_HEADER_HEIGHT - SCREEN_FOOTER_HEIGHT);

  return {
    terminalWidth,
    terminalHeight,
    contentHeight,
    contentWidth,
    listPanelHeight,
  };
}

export function DimensionsProvider({
  children,
  showProgress = false,
  showDebug = false,
}: DimensionsProviderProps): React.ReactElement {
  const { stdout } = useStdout();

  const [dimensions, setDimensions] = useState<Dimensions>(() =>
    calculateDimensions(
      stdout?.columns ?? 80,
      stdout?.rows ?? 24,
      showProgress,
      showDebug
    )
  );

  // Handle terminal resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions(
        calculateDimensions(
          stdout?.columns ?? 80,
          stdout?.rows ?? 24,
          showProgress,
          showDebug
        )
      );
    };

    stdout?.on('resize', handleResize);
    return () => {
      stdout?.off('resize', handleResize);
    };
  }, [stdout, showProgress, showDebug]);

  // Update when showProgress/showDebug changes
  useEffect(() => {
    setDimensions(
      calculateDimensions(
        stdout?.columns ?? 80,
        stdout?.rows ?? 24,
        showProgress,
        showDebug
      )
    );
  }, [stdout?.columns, stdout?.rows, showProgress, showDebug]);

  return (
    <DimensionsContext.Provider value={dimensions}>
      {children}
    </DimensionsContext.Provider>
  );
}

export function useDimensions(): Dimensions {
  const context = useContext(DimensionsContext);
  if (!context) {
    // Return sensible defaults if used outside provider
    return {
      terminalWidth: 80,
      terminalHeight: 24,
      contentHeight: 23, // 24 - 1 margin
      contentWidth: 76,
      listPanelHeight: 17, // 23 - 4 header - 2 footer
    };
  }
  return context;
}

export default DimensionsContext;

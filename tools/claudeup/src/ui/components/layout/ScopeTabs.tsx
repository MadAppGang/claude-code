import React from 'react';
import { Box, Text } from 'ink';

interface ScopeTabsProps {
  /** Current scope */
  scope: 'project' | 'global';
  /** Callback when scope changes */
  onToggle?: () => void;
  /** Hint text for toggle key */
  toggleHint?: string;
}

export function ScopeTabs({
  scope,
  onToggle: _onToggle,
  toggleHint,
}: ScopeTabsProps): React.ReactElement {
  const isProject = scope === 'project';

  return (
    <Box marginBottom={1} flexDirection="row" gap={1}>
      {/* Project tab */}
      <Box>
        {isProject ? (
          <Text backgroundColor="cyan" color="black" bold>
            {' '}◆ Project{' '}
          </Text>
        ) : (
          <Text color="gray">
            {' '}○ Project{' '}
          </Text>
        )}
      </Box>

      {/* Global tab */}
      <Box>
        {!isProject ? (
          <Text backgroundColor="magenta" color="white" bold>
            {' '}◆ Global{' '}
          </Text>
        ) : (
          <Text color="gray">
            {' '}○ Global{' '}
          </Text>
        )}
      </Box>

      {/* Toggle hint */}
      {toggleHint && (
        <Box marginLeft={2}>
          <Text color="gray" dimColor>
            ({toggleHint})
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default ScopeTabs;

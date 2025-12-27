import React from 'react';
import { Box, Text } from 'ink';
import { useNavigation } from '../../state/AppContext.js';
import type { Screen } from '../../state/types.js';

const VERSION = '0.7.0';

interface Tab {
  key: string;
  label: string;
  screen: Screen;
  icon: string;
}

const tabs: Tab[] = [
  { key: '1', label: 'Plugins', screen: 'plugins', icon: '◈' },
  { key: '2', label: 'MCP', screen: 'mcp', icon: '⚡' },
  { key: '3', label: 'Status', screen: 'statusline', icon: '◐' },
  { key: '4', label: 'Env', screen: 'env-vars', icon: '◉' },
  { key: '5', label: 'Tools', screen: 'cli-tools', icon: '⚙' },
];

export function Header(): React.ReactElement {
  const { currentScreen } = useNavigation();

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="magenta"
      paddingX={1}
    >
      {/* Title and nav row */}
      <Box justifyContent="space-between">
        {/* Logo */}
        <Box>
          <Text bold color="magenta">claudeup</Text>
          <Text color="gray"> v{VERSION}</Text>
        </Box>

        {/* Navigation tabs */}
        <Box>
          {tabs.map((tab, idx) => {
            const isActive = currentScreen === tab.screen;
            const isLast = idx === tabs.length - 1;

            if (isActive) {
              return (
                <React.Fragment key={tab.key}>
                  <Text backgroundColor="magenta" color="white" bold>
                    {' '}{tab.icon} {tab.key}:{tab.label}{' '}
                  </Text>
                  {!isLast && <Text color="gray"> </Text>}
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={tab.key}>
                <Text color="gray">{tab.icon} </Text>
                <Text color="white" dimColor>{tab.key}:{tab.label}</Text>
                {!isLast && <Text color="gray">  </Text>}
              </React.Fragment>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

export default Header;

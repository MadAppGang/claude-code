import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import { useApp, useModal } from '../state/AppContext.js';
import { useDimensions } from '../state/DimensionsContext.js';
import { ScreenLayout } from '../components/layout/index.js';
import { ScrollableList } from '../components/ScrollableList.js';
import { cliTools, type CliTool } from '../../data/cli-tools.js';

const execAsync = promisify(exec);

interface ToolStatus {
  tool: CliTool;
  installed: boolean;
  installedVersion?: string;
  latestVersion?: string;
  hasUpdate?: boolean;
  checking: boolean;
}

// Session-level cache
let cachedToolStatuses: ToolStatus[] | null = null;
let cacheInitialized = false;

function clearCliToolsCache(): void {
  cachedToolStatuses = null;
  cacheInitialized = false;
}

function parseVersion(versionOutput: string): string | undefined {
  const match = versionOutput.match(/v?(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
  return match ? match[1] : undefined;
}

async function isInstalledViaHomebrew(toolName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync('brew list --formula 2>/dev/null', {
      timeout: 2000,
      shell: '/bin/bash',
    });
    const formulas = stdout.trim().split('\n');
    return formulas.some((f) => f.trim() === toolName);
  } catch {
    return false;
  }
}

async function getInstalledVersion(tool: CliTool): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync(tool.checkCommand, { timeout: 5000 });
    return parseVersion(stdout.trim());
  } catch {
    return undefined;
  }
}

async function getLatestNpmVersion(packageName: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} version 2>/dev/null`, { timeout: 10000 });
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

async function getLatestPipVersion(packageName: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync(`pip index versions ${packageName} 2>/dev/null | head -1`, {
      timeout: 10000,
      shell: '/bin/bash',
    });
    const match = stdout.trim().match(/\(([^)]+)\)/);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

async function getLatestVersion(tool: CliTool): Promise<string | undefined> {
  if (tool.packageManager === 'npm') {
    return getLatestNpmVersion(tool.packageName);
  } else {
    return getLatestPipVersion(tool.packageName);
  }
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(/[-.]/).map((p) => parseInt(p, 10) || 0);
  const parts2 = v2.split(/[-.]/).map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

export function CliToolsScreen(): React.ReactElement {
  const { state, dispatch } = useApp();
  const { cliTools: cliToolsState } = state;
  const modal = useModal();
  const dimensions = useDimensions();

  const [toolStatuses, setToolStatuses] = useState<ToolStatus[]>(() => {
    return cachedToolStatuses || cliTools.map((tool) => ({
      tool,
      installed: false,
      installedVersion: undefined,
      checking: true,
    }));
  });

  const statusesRef = useRef(toolStatuses);
  statusesRef.current = toolStatuses;

  // Update single tool status
  const updateToolStatus = useCallback((index: number, updates: Partial<ToolStatus>) => {
    setToolStatuses((prev) => {
      const newStatuses = [...prev];
      newStatuses[index] = { ...newStatuses[index], ...updates };
      cachedToolStatuses = newStatuses;
      return newStatuses;
    });
  }, []);

  // Fetch all version info
  const fetchVersionInfo = useCallback(async () => {
    // Check installed versions
    for (let i = 0; i < cliTools.length; i++) {
      const tool = cliTools[i];
      getInstalledVersion(tool).then((version) => {
        updateToolStatus(i, {
          installedVersion: version,
          installed: version !== undefined,
        });
      });

      getLatestVersion(tool).then((latest) => {
        const current = statusesRef.current[i];
        updateToolStatus(i, {
          latestVersion: latest,
          checking: false,
          hasUpdate: current.installedVersion && latest
            ? compareVersions(current.installedVersion, latest) < 0
            : false,
        });
      });
    }
  }, [updateToolStatus]);

  useEffect(() => {
    if (!cacheInitialized) {
      cacheInitialized = true;
      cachedToolStatuses = toolStatuses;
      fetchVersionInfo();
    }
  }, [fetchVersionInfo, toolStatuses]);

  // Keyboard handling
  useInput((input, key) => {
    if (state.isSearching || state.modal) return;

    if (key.upArrow || input === 'k') {
      const newIndex = Math.max(0, cliToolsState.selectedIndex - 1);
      dispatch({ type: 'CLITOOLS_SELECT', index: newIndex });
    } else if (key.downArrow || input === 'j') {
      const newIndex = Math.min(toolStatuses.length - 1, cliToolsState.selectedIndex + 1);
      dispatch({ type: 'CLITOOLS_SELECT', index: newIndex });
    } else if (input === 'r') {
      handleRefresh();
    } else if (input === 'a') {
      handleUpdateAll();
    } else if (key.return) {
      handleInstall();
    }
  });

  const handleRefresh = () => {
    clearCliToolsCache();
    setToolStatuses(cliTools.map((tool) => ({
      tool,
      installed: false,
      installedVersion: undefined,
      checking: true,
    })));
    cacheInitialized = false;
    fetchVersionInfo();
  };

  const handleInstall = async () => {
    const status = toolStatuses[cliToolsState.selectedIndex];
    if (!status) return;

    const { tool, installed, hasUpdate } = status;
    const action = !installed ? 'Installing' : hasUpdate ? 'Updating' : 'Reinstalling';

    const viaHomebrew = installed ? await isInstalledViaHomebrew(tool.name) : false;

    let command: string;
    if (!installed) {
      command = tool.installCommand;
    } else if (viaHomebrew) {
      command = `brew upgrade ${tool.name}`;
    } else {
      command = tool.installCommand;
    }

    modal.loading(`${action} ${tool.displayName}...`);

    try {
      execSync(command, {
        encoding: 'utf-8',
        stdio: 'pipe',
        shell: '/bin/bash',
      });
      modal.hideModal();
      handleRefresh();
    } catch (error) {
      modal.hideModal();
      await modal.message(
        'Error',
        `Failed to ${action.toLowerCase()} ${tool.displayName}.\n\nTry running manually:\n${command}`,
        'error'
      );
    }
  };

  const handleUpdateAll = async () => {
    const updatable = toolStatuses.filter((s) => s.hasUpdate);
    if (updatable.length === 0) {
      await modal.message('Up to Date', 'All tools are already up to date.', 'info');
      return;
    }

    modal.loading(`Updating ${updatable.length} tool(s)...`);

    for (const status of updatable) {
      const viaHomebrew = await isInstalledViaHomebrew(status.tool.name);
      const command = viaHomebrew
        ? `brew upgrade ${status.tool.name}`
        : status.tool.installCommand;

      try {
        execSync(command, {
          encoding: 'utf-8',
          stdio: 'pipe',
          shell: '/bin/bash',
        });
      } catch {
        // Continue with other updates
      }
    }

    modal.hideModal();
    handleRefresh();
  };

  // Get selected item
  const selectedStatus = toolStatuses[cliToolsState.selectedIndex];

  const renderDetail = () => {
    if (!selectedStatus) {
      return (
        <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
          <Text color="gray">Select a tool to see details</Text>
        </Box>
      );
    }

    const { tool, installed, installedVersion, latestVersion, hasUpdate, checking } = selectedStatus;

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="cyan">⚙ {tool.displayName}</Text>
          {hasUpdate && <Text color="yellow"> ⬆</Text>}
        </Box>

        <Text color="gray">{tool.description}</Text>

        <Box marginTop={1} flexDirection="column">
          <Box>
            <Text color="gray">Status    </Text>
            {!installed ? (
              <Text color="gray">○ Not installed</Text>
            ) : checking ? (
              <Text color="green">● Checking...</Text>
            ) : hasUpdate ? (
              <Text color="yellow">● Update available</Text>
            ) : (
              <Text color="green">● Up to date</Text>
            )}
          </Box>
          {installedVersion && (
            <Box>
              <Text color="gray">Installed </Text>
              <Text color="green">v{installedVersion}</Text>
            </Box>
          )}
          {latestVersion && (
            <Box>
              <Text color="gray">Latest    </Text>
              <Text color="white">v{latestVersion}</Text>
            </Box>
          )}
          <Box>
            <Text color="gray">Website   </Text>
            <Text color="blue">{tool.website}</Text>
          </Box>
        </Box>

        <Box marginTop={2}>
          {!installed ? (
            <Box>
              <Text backgroundColor="green" color="black">{' '}Enter{' '}</Text>
              <Text color="gray"> Install</Text>
            </Box>
          ) : hasUpdate ? (
            <Box>
              <Text backgroundColor="yellow" color="black">{' '}Enter{' '}</Text>
              <Text color="gray"> Update to v{latestVersion}</Text>
            </Box>
          ) : (
            <Box>
              <Text backgroundColor="gray" color="white">{' '}Enter{' '}</Text>
              <Text color="gray"> Reinstall</Text>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderListItem = (status: ToolStatus, _idx: number, isSelected: boolean) => {
    const { tool, installed, installedVersion, hasUpdate, checking } = status;

    let icon: string;
    let iconColor: string;

    if (!installed) {
      icon = '○';
      iconColor = 'gray';
    } else if (hasUpdate) {
      icon = '⬆';
      iconColor = 'yellow';
    } else {
      icon = '●';
      iconColor = 'green';
    }

    const versionText = installedVersion ? `v${installedVersion}` : '';

    return isSelected ? (
      <Text backgroundColor="magenta" color="white" wrap="truncate">
        {' '}{icon} {tool.displayName} {versionText}{checking ? '...' : ''}{' '}
      </Text>
    ) : (
      <Text wrap="truncate">
        <Text color={iconColor}>{icon}</Text>
        <Text color="white"> {tool.displayName}</Text>
        {versionText && <Text color="green"> {versionText}</Text>}
        {checking && <Text color="gray">...</Text>}
      </Text>
    );
  };

  // Calculate stats for status line
  const installedCount = toolStatuses.filter(s => s.installed).length;
  const updateCount = toolStatuses.filter(s => s.hasUpdate).length;
  const statusContent = (
    <>
      <Text color="gray">Installed: </Text>
      <Text color="cyan">{installedCount}/{toolStatuses.length}</Text>
      {updateCount > 0 && (
        <>
          <Text color="gray"> │ Updates: </Text>
          <Text color="yellow">{updateCount}</Text>
        </>
      )}
    </>
  );

  return (
    <ScreenLayout
      title="claudeup CLI Tools"
      currentScreen="cli-tools"
      statusLine={statusContent}
      footerHints="↑↓:nav │ Enter:install │ a:update all │ r:refresh"
      listPanel={
        <ScrollableList
          items={toolStatuses}
          selectedIndex={cliToolsState.selectedIndex}
          renderItem={renderListItem}
          maxHeight={dimensions.listPanelHeight}
        />
      }
      detailPanel={renderDetail()}
    />
  );
}

export default CliToolsScreen;

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { useApp, useModal, useNavigation } from '../state/AppContext.js';
import { useDimensions } from '../state/DimensionsContext.js';
import { ScreenLayout } from '../components/layout/index.js';
import { ScrollableList } from '../components/ScrollableList.js';
import { searchMcpServers, formatDate } from '../../services/mcp-registry.js';
import { addMcpServer, setAllowMcp } from '../../services/claude-settings.js';
import type { McpRegistryServer, McpServerConfig } from '../../types/index.js';

/**
 * Deduplicate servers by name, keeping only the latest version.
 * Uses version string comparison, falling back to published_at date.
 */
function deduplicateServers(servers: McpRegistryServer[]): McpRegistryServer[] {
  const serverMap = new Map<string, McpRegistryServer>();

  for (const server of servers) {
    const existing = serverMap.get(server.name);
    if (!existing) {
      serverMap.set(server.name, server);
      continue;
    }

    // Compare versions - keep the newer one
    const isNewer = compareVersions(server, existing) > 0;
    if (isNewer) {
      serverMap.set(server.name, server);
    }
  }

  return Array.from(serverMap.values());
}

/**
 * Compare two servers by version. Returns:
 *  > 0 if a is newer
 *  < 0 if b is newer
 *  0 if equal or cannot determine
 */
function compareVersions(a: McpRegistryServer, b: McpRegistryServer): number {
  // Try semver comparison first
  if (a.version && b.version) {
    const aParts = a.version.split('.').map(n => parseInt(n, 10) || 0);
    const bParts = b.version.split('.').map(n => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      if (aVal !== bVal) {
        return aVal - bVal;
      }
    }
  }

  // Fall back to published_at date
  if (a.published_at && b.published_at) {
    return new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
  }

  // If one has a date and other doesn't, prefer the one with date
  if (a.published_at && !b.published_at) return 1;
  if (!a.published_at && b.published_at) return -1;

  return 0;
}

export function McpRegistryScreen(): React.ReactElement {
  const { state, dispatch } = useApp();
  const { mcpRegistry } = state;
  const modal = useModal();
  const { navigateToScreen } = useNavigation();
  const dimensions = useDimensions();

  const [servers, setServers] = useState<McpRegistryServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(mcpRegistry.searchQuery || '');

  const isSearchActive = state.isSearching && state.currentRoute.screen === 'mcp-registry' && !state.modal;

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load servers
  const loadServers = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchMcpServers({ query, limit: 50 });
      if (!response || !Array.isArray(response.servers)) {
        throw new Error('Invalid response from MCP Registry API');
      }
      // Deduplicate to show only latest version of each server
      const deduplicated = deduplicateServers(response.servers);
      setServers(deduplicated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
      setServers([]);
    }
    setIsLoading(false);
  }, []);

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      loadServers(query);
    }, 300);
  }, [loadServers]);

  useEffect(() => {
    loadServers(searchQuery);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard handling
  useInput((input, key) => {
    // Handle search mode
    if (isSearchActive) {
      if (key.escape) {
        dispatch({ type: 'SET_SEARCHING', isSearching: false });
      } else if (key.return) {
        // Exit search mode and stay on list for navigation
        dispatch({ type: 'SET_SEARCHING', isSearching: false });
      } else if (key.upArrow) {
        // Allow navigation while searching
        const newIndex = Math.max(0, mcpRegistry.selectedIndex - 1);
        dispatch({ type: 'MCPREGISTRY_SELECT', index: newIndex });
      } else if (key.downArrow) {
        // Allow navigation while searching
        const newIndex = Math.min(Math.max(0, servers.length - 1), mcpRegistry.selectedIndex + 1);
        dispatch({ type: 'MCPREGISTRY_SELECT', index: newIndex });
      } else if (key.backspace || key.delete) {
        const newQuery = searchQuery.slice(0, -1);
        setSearchQuery(newQuery);
        dispatch({ type: 'MCPREGISTRY_SEARCH', query: newQuery });
        debouncedSearch(newQuery);
      } else if (input && !key.ctrl && !key.meta) {
        const newQuery = searchQuery + input;
        setSearchQuery(newQuery);
        dispatch({ type: 'MCPREGISTRY_SEARCH', query: newQuery });
        debouncedSearch(newQuery);
      }
      return;
    }

    if (state.modal) return;

    // Start search with /
    if (input === '/') {
      dispatch({ type: 'SET_SEARCHING', isSearching: true });
      return;
    }

    // Navigation
    if (key.upArrow || input === 'k') {
      const newIndex = Math.max(0, mcpRegistry.selectedIndex - 1);
      dispatch({ type: 'MCPREGISTRY_SELECT', index: newIndex });
    } else if (key.downArrow || input === 'j') {
      const newIndex = Math.min(Math.max(0, servers.length - 1), mcpRegistry.selectedIndex + 1);
      dispatch({ type: 'MCPREGISTRY_SELECT', index: newIndex });
    } else if (input === 'l') {
      navigateToScreen('mcp');
    } else if (input === 'R') {
      loadServers(searchQuery);
    } else if (key.return) {
      handleInstall();
    }
  });

  const handleInstall = async () => {
    const server = servers[mcpRegistry.selectedIndex];
    if (!server) return;

    const config: McpServerConfig = {
      type: 'http',
      url: server.url,
    };

    modal.loading(`Installing ${server.name}...`);
    try {
      await setAllowMcp(true, state.projectPath);
      await addMcpServer(server.name, config, state.projectPath);
      modal.hideModal();
      await modal.message(
        'Installed',
        `${server.name} has been configured.\n\nRestart Claude Code to activate.`,
        'success'
      );
    } catch (error) {
      modal.hideModal();
      await modal.message('Error', `Failed to install: ${error}`, 'error');
    }
  };

  // Get selected server
  const selectedServer = servers[mcpRegistry.selectedIndex];

  const renderDetail = () => {
    if (isLoading) {
      return <Text color="gray">Loading...</Text>;
    }

    if (error) {
      return <Text color="red">Error: {error}</Text>;
    }

    if (!selectedServer) {
      return <Text color="gray">Select a server to see details</Text>;
    }

    const dateDisplay = selectedServer.published_at
      ? formatDate(selectedServer.published_at)
      : 'unknown';

    const versionDisplay = selectedServer.version
      ? `v${selectedServer.version}`
      : 'unknown';

    return (
      <Box flexDirection="column">
        <Text bold color="magenta">{selectedServer.name}</Text>
        <Box marginTop={1}>
          <Text>{selectedServer.short_description}</Text>
        </Box>
        <Box marginTop={1}>
          <Text bold>Version: </Text>
          <Text color="green">{versionDisplay}</Text>
        </Box>
        <Box>
          <Text bold>Published: </Text>
          <Text color="cyan">{dateDisplay}</Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text bold>URL:</Text>
          <Text color="cyan">{selectedServer.url}</Text>
        </Box>
        {selectedServer.source_code_url && (
          <Box marginTop={1} flexDirection="column">
            <Text bold>Source:</Text>
            <Text color="gray">{selectedServer.source_code_url}</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text color="green">Press Enter to install</Text>
        </Box>
      </Box>
    );
  };

  const renderListItem = (server: McpRegistryServer, _idx: number, isSelected: boolean) => {
    const version = server.version ? ` v${server.version}` : '';
    return isSelected ? (
      <Text backgroundColor="magenta" color="white" wrap="truncate">
        {' '}{server.name}{version}{' '}
      </Text>
    ) : (
      <Text wrap="truncate">
        <Text bold>{server.name}</Text>
        <Text color="green">{version}</Text>
      </Text>
    );
  };

  // Footer hints
  const footerHints = isSearchActive
    ? 'Type to search │ ↑↓:nav │ Enter:done │ Esc:cancel'
    : '↑↓:nav │ Enter:install │ /:search │ R:refresh │ l:local';

  // Status for search placeholder
  const searchPlaceholder = `${servers.length} servers │ / to search`;

  return (
    <ScreenLayout
      title="claudeup MCP Registry"
      subtitle="Powered by MCP Registry"
      currentScreen="mcp-registry"
      search={{
        isActive: isSearchActive,
        query: searchQuery,
        placeholder: searchPlaceholder,
      }}
      footerHints={footerHints}
      listPanel={
        isLoading ? (
          <Text color="gray">Loading...</Text>
        ) : error ? (
          <Text color="red">Error: {error}</Text>
        ) : servers.length === 0 ? (
          <Text color="gray">No servers found</Text>
        ) : (
          <ScrollableList
            items={servers}
            selectedIndex={mcpRegistry.selectedIndex}
            renderItem={renderListItem}
            maxHeight={dimensions.listPanelHeight}
          />
        )
      }
      detailPanel={renderDetail()}
    />
  );
}

export default McpRegistryScreen;

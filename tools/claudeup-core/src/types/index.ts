/**
 * Core types for claudeup-core package
 */

// Logger callback for UI-independent logging
export type Logger = (message: string) => void;

// Progress callback for long-running operations
export interface ProgressCallback {
  (percent: number, status: string): void;
}

// Options for service operations
export interface ServiceOptions {
  projectPath?: string;
  logger?: Logger;
  onProgress?: ProgressCallback;
}

// Plugin scope
export type PluginScope = 'global' | 'project';

// MCP server configuration
export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

// Claude settings structure
export interface ClaudeSettings {
  enabledPlugins?: Record<string, boolean>;
  mcpServers?: Record<string, McpServerConfig>;
  installedPluginVersions?: Record<string, string>;
  extraKnownMarketplaces?: Record<string, MarketplaceSource>;
  [key: string]: unknown;
}

// Local settings structure (project-specific, not committed to git)
export interface ClaudeLocalSettings {
  enabledPlugins?: Record<string, boolean>;
  installedPluginVersions?: Record<string, string>;
  [key: string]: unknown;
}

// Marketplace configuration
export interface MarketplaceSource {
  source: 'github' | 'directory';
  repo?: string;
  path?: string;
}

export interface Marketplace {
  name: string;
  displayName: string;
  source: MarketplaceSource;
  official?: boolean;
  featured?: boolean;
}

export interface DiscoveredMarketplace {
  name: string;
  displayName: string;
  source: MarketplaceSource;
}

// Installed plugins registry
export interface InstalledPluginEntry {
  pluginName: string;
  version: string;
  marketplace: string;
  scope: 'user' | 'project' | 'local';
  projectPath?: string;
  installedAt: string;
}

export interface InstalledPluginsRegistry {
  version: number;
  plugins: Record<string, InstalledPluginEntry[]>;
}

// Error codes for RPC communication
export enum ErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  FILE_NOT_FOUND = -32001,
  PERMISSION_DENIED = -32002,
  NETWORK_ERROR = -32003,
  VALIDATION_ERROR = -32004,
  OPERATION_CANCELLED = -32005,
}

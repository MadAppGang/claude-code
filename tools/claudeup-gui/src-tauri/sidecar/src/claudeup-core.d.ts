// Type declarations for claudeup-core
// These are simplified declarations to allow the sidecar to compile

declare module '../../../../../claudeup-core/dist/index.js' {
  export interface PluginInfo {
    id: string;
    name: string;
    version: string | null;
    description: string;
    marketplace: string;
    marketplaceDisplay: string;
    enabled: boolean;
    installedVersion?: string;
    hasUpdate?: boolean;
    userScope?: ScopeStatus;
    projectScope?: ScopeStatus;
    localScope?: ScopeStatus;
    category?: string;
    author?: { name: string; email?: string };
    homepage?: string;
    tags?: string[];
    agents?: string[];
    commands?: string[];
    skills?: string[];
    mcpServers?: string[];
    lspServers?: Record<string, unknown>;
  }

  export interface ScopeStatus {
    enabled: boolean;
    version?: string;
  }

  export type LoggerCallback = (level: 'info' | 'warn' | 'error', message: string, ...args: unknown[]) => void;
  export type ProgressCallback = (percent: number, status: string) => void;

  export function getAvailablePlugins(projectPath?: string, logger?: LoggerCallback): Promise<PluginInfo[]>;
  export function getGlobalAvailablePlugins(logger?: LoggerCallback): Promise<PluginInfo[]>;
  export function saveInstalledPluginVersion(pluginId: string, version: string, projectPath?: string): Promise<void>;
  export function removeInstalledPluginVersion(pluginId: string, projectPath?: string): Promise<void>;
  export function refreshAllMarketplaces(onProgress?: ProgressCallback): Promise<unknown>;
  export function enablePlugin(pluginId: string, enabled: boolean, projectPath: string): Promise<void>;
  export function enableGlobalPlugin(pluginId: string, enabled: boolean): Promise<void>;
  export function enableLocalPlugin(pluginId: string, enabled: boolean, projectPath: string): Promise<void>;
  export function saveGlobalInstalledPluginVersion(pluginId: string, version: string, logger?: LoggerCallback): Promise<void>;
  export function removeGlobalInstalledPluginVersion(pluginId: string, logger?: (message: string) => void): Promise<void>;
  export function saveLocalInstalledPluginVersion(pluginId: string, version: string, projectPath: string, logger?: LoggerCallback): Promise<void>;
  export function removeLocalInstalledPluginVersion(pluginId: string, projectPath: string, logger?: (message: string) => void): Promise<void>;
}

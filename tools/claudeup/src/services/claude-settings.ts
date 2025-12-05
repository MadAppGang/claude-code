import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import type {
  ClaudeSettings,
  ClaudeLocalSettings,
  McpServerConfig,
  Marketplace,
  MarketplaceSource,
  DiscoveredMarketplace,
} from '../types/index.js';
import { parsePluginId } from '../utils/string-utils.js';

const CLAUDE_DIR = '.claude';
const SETTINGS_FILE = 'settings.json';
const LOCAL_SETTINGS_FILE = 'settings.local.json';
const MCP_CONFIG_FILE = '.mcp.json';

// MCP config file types
interface McpConfigFile {
  mcpServers?: Record<string, McpServerConfig>;
}

export function getClaudeDir(projectPath?: string): string {
  const base = projectPath || process.cwd();
  return path.join(base, CLAUDE_DIR);
}

export function getGlobalClaudeDir(): string {
  return path.join(os.homedir(), CLAUDE_DIR);
}

export async function ensureClaudeDir(projectPath?: string): Promise<string> {
  const claudeDir = getClaudeDir(projectPath);
  await fs.ensureDir(claudeDir);
  return claudeDir;
}

export async function readSettings(projectPath?: string): Promise<ClaudeSettings> {
  const settingsPath = path.join(getClaudeDir(projectPath), SETTINGS_FILE);
  try {
    if (await fs.pathExists(settingsPath)) {
      return await fs.readJson(settingsPath);
    }
  } catch {
    // Return empty settings on error
  }
  return {};
}

export async function writeSettings(
  settings: ClaudeSettings,
  projectPath?: string
): Promise<void> {
  const claudeDir = await ensureClaudeDir(projectPath);
  const settingsPath = path.join(claudeDir, SETTINGS_FILE);
  await fs.writeJson(settingsPath, settings, { spaces: 2 });
}

export async function readLocalSettings(projectPath?: string): Promise<ClaudeLocalSettings> {
  const localPath = path.join(getClaudeDir(projectPath), LOCAL_SETTINGS_FILE);
  try {
    if (await fs.pathExists(localPath)) {
      return await fs.readJson(localPath);
    }
  } catch {
    // Return empty settings on error
  }
  return {};
}

export async function writeLocalSettings(
  settings: ClaudeLocalSettings,
  projectPath?: string
): Promise<void> {
  const claudeDir = await ensureClaudeDir(projectPath);
  const localPath = path.join(claudeDir, LOCAL_SETTINGS_FILE);
  await fs.writeJson(localPath, settings, { spaces: 2 });
}

// MCP config file management (.mcp.json at project root)
export function getMcpConfigPath(projectPath?: string): string {
  const base = projectPath || process.cwd();
  return path.join(base, MCP_CONFIG_FILE);
}

export async function readMcpConfig(projectPath?: string): Promise<McpConfigFile> {
  const mcpPath = getMcpConfigPath(projectPath);
  try {
    if (await fs.pathExists(mcpPath)) {
      return await fs.readJson(mcpPath);
    }
  } catch {
    // Return empty config on error
  }
  return {};
}

export async function writeMcpConfig(
  config: McpConfigFile,
  projectPath?: string
): Promise<void> {
  const mcpPath = getMcpConfigPath(projectPath);
  await fs.writeJson(mcpPath, config, { spaces: 2 });
}

export async function readGlobalSettings(): Promise<ClaudeSettings> {
  const settingsPath = path.join(getGlobalClaudeDir(), SETTINGS_FILE);
  try {
    if (await fs.pathExists(settingsPath)) {
      return await fs.readJson(settingsPath);
    }
  } catch {
    // Return empty settings on error
  }
  return {};
}

export async function writeGlobalSettings(settings: ClaudeSettings): Promise<void> {
  await fs.ensureDir(getGlobalClaudeDir());
  const settingsPath = path.join(getGlobalClaudeDir(), SETTINGS_FILE);
  await fs.writeJson(settingsPath, settings, { spaces: 2 });
}

// MCP Server management (writes to .mcp.json at project root)
export async function addMcpServer(
  name: string,
  config: McpServerConfig,
  projectPath?: string
): Promise<void> {
  // Extract env vars from config - they go to settings.local.json, not .mcp.json
  const envVars = config.env || {};
  const configWithoutEnv: McpServerConfig = { ...config };
  delete configWithoutEnv.env;

  // Add to .mcp.json (without env vars)
  const mcpConfig = await readMcpConfig(projectPath);
  mcpConfig.mcpServers = mcpConfig.mcpServers || {};
  mcpConfig.mcpServers[name] = configWithoutEnv;
  await writeMcpConfig(mcpConfig, projectPath);

  // Enable in settings.local.json and add env vars
  const localSettings = await readLocalSettings(projectPath);
  const enabledServers = localSettings.enabledMcpjsonServers || [];
  if (!enabledServers.includes(name)) {
    enabledServers.push(name);
  }
  localSettings.enabledMcpjsonServers = enabledServers;
  localSettings.enableAllProjectMcpServers = true;

  // Add env vars to settings.local.json
  if (Object.keys(envVars).length > 0) {
    localSettings.env = localSettings.env || {};
    for (const [key, value] of Object.entries(envVars)) {
      // Only add non-reference values (references like ${VAR} don't need to be stored)
      if (!value.startsWith('${') || !value.endsWith('}')) {
        localSettings.env[key] = value;
      }
    }
  }

  await writeLocalSettings(localSettings, projectPath);
}

export async function removeMcpServer(name: string, projectPath?: string): Promise<void> {
  // Remove from .mcp.json
  const mcpConfig = await readMcpConfig(projectPath);
  if (mcpConfig.mcpServers) {
    delete mcpConfig.mcpServers[name];
  }
  await writeMcpConfig(mcpConfig, projectPath);

  // Remove from settings.local.json
  const localSettings = await readLocalSettings(projectPath);
  if (localSettings.enabledMcpjsonServers) {
    localSettings.enabledMcpjsonServers = localSettings.enabledMcpjsonServers.filter(
      (s) => s !== name
    );
    await writeLocalSettings(localSettings, projectPath);
  }
}

export async function toggleMcpServer(
  name: string,
  enabled: boolean,
  projectPath?: string
): Promise<void> {
  // Toggle is now a remove operation since .mcp.json doesn't have enabled/disabled state
  // If disabled, remove from config; if enabled, the server should already be in config
  if (!enabled) {
    await removeMcpServer(name, projectPath);
  }
  // If enabling, the server should already exist in the config
}

export async function setAllowMcp(_allow: boolean, _projectPath?: string): Promise<void> {
  // .mcp.json doesn't have an allowMcp setting - servers are either in the file or not
  // This function is kept for API compatibility but is now a no-op
}

// Marketplace management
export async function addMarketplace(
  marketplace: Marketplace,
  projectPath?: string
): Promise<void> {
  const settings = await readSettings(projectPath);
  settings.extraKnownMarketplaces = settings.extraKnownMarketplaces || {};
  settings.extraKnownMarketplaces[marketplace.name] = { source: marketplace.source };
  await writeSettings(settings, projectPath);
}

export async function removeMarketplace(name: string, projectPath?: string): Promise<void> {
  const settings = await readSettings(projectPath);
  if (settings.extraKnownMarketplaces) {
    delete settings.extraKnownMarketplaces[name];
  }
  await writeSettings(settings, projectPath);
}

// Plugin management
export async function enablePlugin(
  pluginId: string,
  enabled: boolean,
  projectPath?: string
): Promise<void> {
  const settings = await readSettings(projectPath);
  settings.enabledPlugins = settings.enabledPlugins || {};
  settings.enabledPlugins[pluginId] = enabled;
  await writeSettings(settings, projectPath);
}

export async function getEnabledPlugins(projectPath?: string): Promise<Record<string, boolean>> {
  const settings = await readSettings(projectPath);
  return settings.enabledPlugins || {};
}

// Status line management
export async function setStatusLine(template: string, projectPath?: string): Promise<void> {
  const settings = await readSettings(projectPath);
  settings.statusLine = template;
  await writeSettings(settings, projectPath);
}

export async function getStatusLine(projectPath?: string): Promise<string | undefined> {
  const settings = await readSettings(projectPath);
  return settings.statusLine;
}

// Global status line management
export async function setGlobalStatusLine(template: string): Promise<void> {
  const settings = await readGlobalSettings();
  settings.statusLine = template;
  await writeGlobalSettings(settings);
}

export async function getGlobalStatusLine(): Promise<string | undefined> {
  const settings = await readGlobalSettings();
  return settings.statusLine;
}

// Get effective status line (project overrides global)
export async function getEffectiveStatusLine(projectPath?: string): Promise<{
  template: string | undefined;
  source: 'project' | 'global' | 'default';
}> {
  const projectStatusLine = await getStatusLine(projectPath);
  if (projectStatusLine) {
    return { template: projectStatusLine, source: 'project' };
  }

  const globalStatusLine = await getGlobalStatusLine();
  if (globalStatusLine) {
    return { template: globalStatusLine, source: 'global' };
  }

  return { template: undefined, source: 'default' };
}

// Check if .claude directory exists
export async function hasClaudeDir(projectPath?: string): Promise<boolean> {
  return fs.pathExists(getClaudeDir(projectPath));
}

// Get installed MCP servers (from .mcp.json)
export async function getInstalledMcpServers(
  projectPath?: string
): Promise<Record<string, McpServerConfig>> {
  const mcpConfig = await readMcpConfig(projectPath);
  return mcpConfig.mcpServers || {};
}

// Get env vars for MCP servers (from settings.local.json)
export async function getMcpEnvVars(projectPath?: string): Promise<Record<string, string>> {
  const localSettings = await readLocalSettings(projectPath);
  return localSettings.env || {};
}

// Set an env var for MCP servers (in settings.local.json)
export async function setMcpEnvVar(
  name: string,
  value: string,
  projectPath?: string
): Promise<void> {
  const localSettings = await readLocalSettings(projectPath);
  localSettings.env = localSettings.env || {};
  localSettings.env[name] = value;
  await writeLocalSettings(localSettings, projectPath);
}

// Remove an env var (from settings.local.json)
export async function removeMcpEnvVar(name: string, projectPath?: string): Promise<void> {
  const localSettings = await readLocalSettings(projectPath);
  if (localSettings.env) {
    delete localSettings.env[name];
    await writeLocalSettings(localSettings, projectPath);
  }
}

// Get enabled MCP servers (all servers in .mcp.json are considered enabled)
export async function getEnabledMcpServers(
  projectPath?: string
): Promise<Record<string, boolean>> {
  const mcpConfig = await readMcpConfig(projectPath);
  const servers = mcpConfig.mcpServers || {};
  const enabled: Record<string, boolean> = {};
  for (const name of Object.keys(servers)) {
    enabled[name] = true;
  }
  return enabled;
}

// Get all configured marketplaces
export async function getConfiguredMarketplaces(
  projectPath?: string
): Promise<Record<string, MarketplaceSource>> {
  const settings = await readSettings(projectPath);
  return settings.extraKnownMarketplaces || {};
}

// Global marketplace management
export async function addGlobalMarketplace(marketplace: Marketplace): Promise<void> {
  const settings = await readGlobalSettings();
  settings.extraKnownMarketplaces = settings.extraKnownMarketplaces || {};
  settings.extraKnownMarketplaces[marketplace.name] = { source: marketplace.source };
  await writeGlobalSettings(settings);
}

export async function removeGlobalMarketplace(name: string): Promise<void> {
  const settings = await readGlobalSettings();
  if (settings.extraKnownMarketplaces) {
    delete settings.extraKnownMarketplaces[name];
  }
  await writeGlobalSettings(settings);
}

export async function getGlobalConfiguredMarketplaces(): Promise<Record<string, MarketplaceSource>> {
  const settings = await readGlobalSettings();
  return settings.extraKnownMarketplaces || {};
}

// Global plugin management
export async function enableGlobalPlugin(pluginId: string, enabled: boolean): Promise<void> {
  const settings = await readGlobalSettings();
  settings.enabledPlugins = settings.enabledPlugins || {};
  settings.enabledPlugins[pluginId] = enabled;
  await writeGlobalSettings(settings);
}

export async function getGlobalEnabledPlugins(): Promise<Record<string, boolean>> {
  const settings = await readGlobalSettings();
  return settings.enabledPlugins || {};
}

export async function getGlobalInstalledPluginVersions(): Promise<Record<string, string>> {
  const settings = await readGlobalSettings();
  return settings.installedPluginVersions || {};
}

export async function saveGlobalInstalledPluginVersion(
  pluginId: string,
  version: string
): Promise<void> {
  const settings = await readGlobalSettings();
  settings.installedPluginVersions = settings.installedPluginVersions || {};
  settings.installedPluginVersions[pluginId] = version;
  await writeGlobalSettings(settings);
}

export async function removeGlobalInstalledPluginVersion(pluginId: string): Promise<void> {
  const settings = await readGlobalSettings();
  if (settings.installedPluginVersions) {
    delete settings.installedPluginVersions[pluginId];
  }
  if (settings.enabledPlugins) {
    delete settings.enabledPlugins[pluginId];
  }
  await writeGlobalSettings(settings);
}

// Shared logic for discovering marketplaces from settings
function discoverMarketplacesFromSettings(settings: ClaudeSettings): DiscoveredMarketplace[] {
  const discovered = new Map<string, DiscoveredMarketplace>();

  // 1. From extraKnownMarketplaces (explicitly configured)
  for (const [name, config] of Object.entries(settings.extraKnownMarketplaces || {})) {
    discovered.set(name, { name, source: 'configured', config });
  }

  // 2. From enabledPlugins (infer marketplace from plugin ID format: pluginName@marketplaceName)
  for (const pluginId of Object.keys(settings.enabledPlugins || {})) {
    const parsed = parsePluginId(pluginId);
    if (parsed && !discovered.has(parsed.marketplace)) {
      discovered.set(parsed.marketplace, { name: parsed.marketplace, source: 'inferred' });
    }
  }

  // 3. From installedPluginVersions (same format)
  for (const pluginId of Object.keys(settings.installedPluginVersions || {})) {
    const parsed = parsePluginId(pluginId);
    if (parsed && !discovered.has(parsed.marketplace)) {
      discovered.set(parsed.marketplace, { name: parsed.marketplace, source: 'inferred' });
    }
  }

  return Array.from(discovered.values());
}

// Discover all marketplaces from settings (configured + inferred from plugins)
export async function discoverAllMarketplaces(
  projectPath?: string
): Promise<DiscoveredMarketplace[]> {
  try {
    const settings = await readSettings(projectPath);
    return discoverMarketplacesFromSettings(settings);
  } catch (error) {
    // Graceful degradation - return empty array instead of crashing
    console.error('Failed to discover project marketplaces:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

// Discover all marketplaces from global settings
export async function discoverAllGlobalMarketplaces(): Promise<DiscoveredMarketplace[]> {
  try {
    const settings = await readGlobalSettings();
    return discoverMarketplacesFromSettings(settings);
  } catch (error) {
    // Graceful degradation - return empty array instead of crashing
    console.error('Failed to discover global marketplaces:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

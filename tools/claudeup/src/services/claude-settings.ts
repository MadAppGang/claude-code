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

// MCP Server management
export async function addMcpServer(
  name: string,
  config: McpServerConfig,
  projectPath?: string
): Promise<void> {
  const settings = await readLocalSettings(projectPath);
  settings.mcpServers = settings.mcpServers || {};
  settings.mcpServers[name] = config;
  settings.enabledMcpServers = settings.enabledMcpServers || {};
  settings.enabledMcpServers[name] = true;
  settings.allowMcp = true;
  await writeLocalSettings(settings, projectPath);
}

export async function removeMcpServer(name: string, projectPath?: string): Promise<void> {
  const settings = await readLocalSettings(projectPath);
  if (settings.mcpServers) {
    delete settings.mcpServers[name];
  }
  if (settings.enabledMcpServers) {
    delete settings.enabledMcpServers[name];
  }
  await writeLocalSettings(settings, projectPath);
}

export async function toggleMcpServer(
  name: string,
  enabled: boolean,
  projectPath?: string
): Promise<void> {
  const settings = await readLocalSettings(projectPath);
  settings.enabledMcpServers = settings.enabledMcpServers || {};
  settings.enabledMcpServers[name] = enabled;
  await writeLocalSettings(settings, projectPath);
}

export async function setAllowMcp(allow: boolean, projectPath?: string): Promise<void> {
  const settings = await readLocalSettings(projectPath);
  settings.allowMcp = allow;
  await writeLocalSettings(settings, projectPath);
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

// Get installed MCP servers
export async function getInstalledMcpServers(
  projectPath?: string
): Promise<Record<string, McpServerConfig>> {
  const localSettings = await readLocalSettings(projectPath);
  return localSettings.mcpServers || {};
}

// Get enabled MCP servers
export async function getEnabledMcpServers(
  projectPath?: string
): Promise<Record<string, boolean>> {
  const localSettings = await readLocalSettings(projectPath);
  return localSettings.enabledMcpServers || {};
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

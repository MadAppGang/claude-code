import {
  getConfiguredMarketplaces,
  getEnabledPlugins,
  readSettings,
  writeSettings,
  getGlobalConfiguredMarketplaces,
  getGlobalEnabledPlugins,
  getGlobalInstalledPluginVersions,
  getLocalEnabledPlugins,
  getLocalInstalledPluginVersions,
} from './claude-settings.js';
import { defaultMarketplaces } from '../data/marketplaces.js';
import { scanLocalMarketplaces, refreshLocalMarketplaces, repairAllMarketplaces, type LocalMarketplace, type RefreshResult, type ProgressCallback, type RepairMarketplaceResult } from './local-marketplace.js';
import { formatMarketplaceName, isValidGitHubRepo, parsePluginId } from '../utils/string-utils.js';

// Cache for local marketplaces (session-level) - Promise-based to prevent race conditions
let localMarketplacesPromise: Promise<Map<string, LocalMarketplace>> | null = null;

export interface ScopeStatus {
  enabled: boolean;
  version?: string;
}

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
  // Per-scope installation status
  userScope?: ScopeStatus;
  projectScope?: ScopeStatus;
  localScope?: ScopeStatus;
  // Extended info
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

export interface MarketplacePlugin {
  name: string;
  version: string | null;
  description: string;
  category?: string;
  author?: { name: string; email?: string };
  homepage?: string;
  tags?: string[];
}

// Session-level cache for fetched marketplace data (no TTL - persists until explicit refresh)
const marketplaceCache = new Map<string, MarketplacePlugin[]>();

export async function fetchMarketplacePlugins(
  marketplaceName: string,
  repo: string
): Promise<MarketplacePlugin[]> {
  // Check cache first - session-level, no TTL
  const cached = marketplaceCache.get(marketplaceName);
  if (cached) {
    return cached;
  }

  // Validate repo format to prevent SSRF
  if (!isValidGitHubRepo(repo)) {
    console.error(`Invalid GitHub repo format: ${repo}`);
    return [];
  }

  try {
    // Fetch marketplace.json from GitHub
    const url = `https://raw.githubusercontent.com/${repo}/main/.claude-plugin/marketplace.json`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.error(`Failed to fetch marketplace: ${response.status}`);
      return [];
    }

    // Validate content-type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
      console.error(`Invalid content-type for marketplace: ${contentType}`);
      return [];
    }

    interface RawPlugin {
      name: string;
      version?: string | null;
      description?: string;
      category?: string;
      author?: { name: string; email?: string };
      homepage?: string;
      tags?: string[];
    }
    const data = (await response.json()) as { plugins?: RawPlugin[] };
    const plugins: MarketplacePlugin[] = [];

    if (data.plugins && Array.isArray(data.plugins)) {
      for (const plugin of data.plugins) {
        plugins.push({
          name: plugin.name,
          version: plugin.version || null,
          description: plugin.description || '',
          category: plugin.category,
          author: plugin.author,
          homepage: plugin.homepage,
          tags: plugin.tags,
        });
      }
    }

    // Cache the result (session-level)
    marketplaceCache.set(marketplaceName, plugins);

    return plugins;
  } catch (error) {
    console.error(`Error fetching marketplace ${marketplaceName}:`, error);
    return [];
  }
}

export async function getAvailablePlugins(projectPath?: string): Promise<PluginInfo[]> {
  const configuredMarketplaces = await getConfiguredMarketplaces(projectPath);
  const enabledPlugins = await getEnabledPlugins(projectPath);
  const installedVersions = await getInstalledPluginVersions(projectPath);

  // Fetch all scopes for per-scope status
  const userEnabledPlugins = await getGlobalEnabledPlugins();
  const userInstalledVersions = await getGlobalInstalledPluginVersions();
  const projectEnabledPlugins = await getEnabledPlugins(projectPath);
  const projectInstalledVersions = await getInstalledPluginVersions(projectPath);
  const localEnabledPlugins = await getLocalEnabledPlugins(projectPath);
  const localInstalledVersions = await getLocalInstalledPluginVersions(projectPath);

  const plugins: PluginInfo[] = [];
  const seenPluginIds = new Set<string>();

  // Helper to build scope status
  const buildScopeStatus = (pluginId: string) => ({
    userScope: userEnabledPlugins[pluginId] !== undefined
      ? { enabled: userEnabledPlugins[pluginId], version: userInstalledVersions[pluginId] }
      : undefined,
    projectScope: projectEnabledPlugins[pluginId] !== undefined
      ? { enabled: projectEnabledPlugins[pluginId], version: projectInstalledVersions[pluginId] }
      : undefined,
    localScope: localEnabledPlugins[pluginId] !== undefined
      ? { enabled: localEnabledPlugins[pluginId], version: localInstalledVersions[pluginId] }
      : undefined,
  });

  // Get all marketplace names (configured + official/featured defaults)
  // Always include official and featured marketplaces so users can browse them
  const marketplaceNames = new Set<string>();
  for (const mp of defaultMarketplaces) {
    if (configuredMarketplaces[mp.name] || mp.official || mp.featured) {
      marketplaceNames.add(mp.name);
    }
  }

  // Fetch plugins from each configured marketplace
  for (const mpName of marketplaceNames) {
    const marketplace = defaultMarketplaces.find((m) => m.name === mpName);
    if (!marketplace) continue;

    const marketplacePlugins = await fetchMarketplacePlugins(mpName, marketplace.source.repo);

    for (const plugin of marketplacePlugins) {
      const pluginId = `${plugin.name}@${mpName}`;
      const installedVersion = installedVersions[pluginId];
      const isEnabled = enabledPlugins[pluginId] === true;
      const scopeStatus = buildScopeStatus(pluginId);

      seenPluginIds.add(pluginId);
      plugins.push({
        id: pluginId,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        marketplace: mpName,
        marketplaceDisplay: marketplace.displayName,
        enabled: isEnabled,
        installedVersion: installedVersion,
        hasUpdate: installedVersion && plugin.version ? compareVersions(plugin.version, installedVersion) > 0 : false,
        ...scopeStatus,
        category: plugin.category,
        author: plugin.author,
        homepage: plugin.homepage,
        tags: plugin.tags,
      });
    }
  }

  // Fetch ALL plugins from local marketplace caches (for marketplaces not in defaults)
  const localMarketplaces = await getLocalMarketplaces();

  for (const [mpName, localMp] of localMarketplaces) {
    // Skip if already fetched from defaults
    if (marketplaceNames.has(mpName)) continue;

    // Add ALL plugins from this local marketplace cache
    for (const localPlugin of localMp.plugins) {
      const pluginId = `${localPlugin.name}@${mpName}`;
      if (seenPluginIds.has(pluginId)) continue;

      const installedVersion = installedVersions[pluginId];
      const isEnabled = enabledPlugins[pluginId] === true;
      const scopeStatus = buildScopeStatus(pluginId);

      seenPluginIds.add(pluginId);
      plugins.push({
        id: pluginId,
        name: localPlugin.name,
        version: localPlugin.version,
        description: localPlugin.description || '',
        marketplace: mpName,
        marketplaceDisplay: localMp.name || formatMarketplaceName(mpName),
        enabled: isEnabled,
        installedVersion: installedVersion,
        hasUpdate: installedVersion ? compareVersions(localPlugin.version, installedVersion) > 0 : false,
        ...scopeStatus,
        category: localPlugin.category,
        author: localPlugin.author,
        agents: localPlugin.agents,
        commands: localPlugin.commands,
        skills: localPlugin.skills,
        mcpServers: localPlugin.mcpServers,
        lspServers: localPlugin.lspServers,
      });
    }
  }

  // Add orphaned plugins (enabled/installed but not in any cache)
  const allPluginIds = new Set([
    ...Object.keys(enabledPlugins),
    ...Object.keys(installedVersions),
  ]);

  for (const pluginId of allPluginIds) {
    if (seenPluginIds.has(pluginId)) continue;

    const parsed = parsePluginId(pluginId);
    if (!parsed) continue;

    const { pluginName, marketplace: mpName } = parsed;
    const installedVersion = installedVersions[pluginId];
    const isEnabled = enabledPlugins[pluginId] === true;
    const scopeStatus = buildScopeStatus(pluginId);

    // Try to get plugin info from local marketplace cache (fallback)
    const localMp = localMarketplaces.get(mpName);
    const localPlugin = localMp?.plugins.find((p) => p.name === pluginName);

    const latestVersion = localPlugin?.version || installedVersion || 'unknown';
    const description = localPlugin?.description || 'Installed plugin';
    const hasUpdate =
      installedVersion && localPlugin?.version
        ? compareVersions(localPlugin.version, installedVersion) > 0
        : false;

    plugins.push({
      id: pluginId,
      name: pluginName,
      version: latestVersion,
      description,
      marketplace: mpName,
      marketplaceDisplay: localMp?.name || formatMarketplaceName(mpName),
      enabled: isEnabled,
      installedVersion: installedVersion,
      hasUpdate,
      ...scopeStatus,
    });
  }

  return plugins;
}

export async function getGlobalAvailablePlugins(): Promise<PluginInfo[]> {
  const configuredMarketplaces = await getGlobalConfiguredMarketplaces();
  const enabledPlugins = await getGlobalEnabledPlugins();
  const installedVersions = await getGlobalInstalledPluginVersions();

  // Fetch all scopes for per-scope status display
  const userEnabledPlugins = await getGlobalEnabledPlugins();
  const userInstalledVersions = await getGlobalInstalledPluginVersions();
  // Also fetch project and local scope for complete status display
  const projectEnabledPlugins = await getEnabledPlugins();
  const projectInstalledVersions = await getInstalledPluginVersions();
  const localEnabledPlugins = await getLocalEnabledPlugins();
  const localInstalledVersions = await getLocalInstalledPluginVersions();

  const plugins: PluginInfo[] = [];
  const seenPluginIds = new Set<string>();

  // Helper to build scope status (show all scopes)
  const buildScopeStatus = (pluginId: string) => ({
    userScope: userEnabledPlugins[pluginId] !== undefined
      ? { enabled: userEnabledPlugins[pluginId], version: userInstalledVersions[pluginId] }
      : undefined,
    projectScope: projectEnabledPlugins[pluginId] !== undefined
      ? { enabled: projectEnabledPlugins[pluginId], version: projectInstalledVersions[pluginId] }
      : undefined,
    localScope: localEnabledPlugins[pluginId] !== undefined
      ? { enabled: localEnabledPlugins[pluginId], version: localInstalledVersions[pluginId] }
      : undefined,
  });

  // Get all marketplace names (configured + official/featured defaults)
  // Always include official and featured marketplaces so users can browse them
  const marketplaceNames = new Set<string>();
  for (const mp of defaultMarketplaces) {
    if (configuredMarketplaces[mp.name] || mp.official || mp.featured) {
      marketplaceNames.add(mp.name);
    }
  }

  // Fetch plugins from each configured marketplace
  for (const mpName of marketplaceNames) {
    const marketplace = defaultMarketplaces.find((m) => m.name === mpName);
    if (!marketplace) continue;

    const marketplacePlugins = await fetchMarketplacePlugins(mpName, marketplace.source.repo);

    for (const plugin of marketplacePlugins) {
      const pluginId = `${plugin.name}@${mpName}`;
      const installedVersion = installedVersions[pluginId];
      const isEnabled = enabledPlugins[pluginId] === true;
      const scopeStatus = buildScopeStatus(pluginId);

      seenPluginIds.add(pluginId);
      plugins.push({
        id: pluginId,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        marketplace: mpName,
        marketplaceDisplay: marketplace.displayName,
        enabled: isEnabled,
        installedVersion: installedVersion,
        hasUpdate: installedVersion && plugin.version ? compareVersions(plugin.version, installedVersion) > 0 : false,
        ...scopeStatus,
        category: plugin.category,
        author: plugin.author,
        homepage: plugin.homepage,
        tags: plugin.tags,
      });
    }
  }

  // Fetch ALL plugins from local marketplace caches (for marketplaces not in defaults)
  const localMarketplaces = await getLocalMarketplaces();

  for (const [mpName, localMp] of localMarketplaces) {
    // Skip if already fetched from defaults
    if (marketplaceNames.has(mpName)) continue;

    // Add ALL plugins from this local marketplace cache
    for (const localPlugin of localMp.plugins) {
      const pluginId = `${localPlugin.name}@${mpName}`;
      if (seenPluginIds.has(pluginId)) continue;

      const installedVersion = installedVersions[pluginId];
      const isEnabled = enabledPlugins[pluginId] === true;
      const scopeStatus = buildScopeStatus(pluginId);

      seenPluginIds.add(pluginId);
      plugins.push({
        id: pluginId,
        name: localPlugin.name,
        version: localPlugin.version,
        description: localPlugin.description || '',
        marketplace: mpName,
        marketplaceDisplay: localMp.name || formatMarketplaceName(mpName),
        enabled: isEnabled,
        installedVersion: installedVersion,
        hasUpdate: installedVersion ? compareVersions(localPlugin.version, installedVersion) > 0 : false,
        ...scopeStatus,
        category: localPlugin.category,
        author: localPlugin.author,
        agents: localPlugin.agents,
        commands: localPlugin.commands,
        skills: localPlugin.skills,
        mcpServers: localPlugin.mcpServers,
        lspServers: localPlugin.lspServers,
      });
    }
  }

  // Add orphaned plugins (enabled/installed but not in any cache)
  const allPluginIds = new Set([
    ...Object.keys(enabledPlugins),
    ...Object.keys(installedVersions),
  ]);

  for (const pluginId of allPluginIds) {
    if (seenPluginIds.has(pluginId)) continue;

    const parsed = parsePluginId(pluginId);
    if (!parsed) continue;

    const { pluginName, marketplace: mpName } = parsed;
    const installedVersion = installedVersions[pluginId];
    const isEnabled = enabledPlugins[pluginId] === true;
    const scopeStatus = buildScopeStatus(pluginId);

    // Try to get plugin info from local marketplace cache (fallback)
    const localMp = localMarketplaces.get(mpName);
    const localPlugin = localMp?.plugins.find((p) => p.name === pluginName);

    const latestVersion = localPlugin?.version || installedVersion || 'unknown';
    const description = localPlugin?.description || 'Installed plugin';
    const hasUpdate =
      installedVersion && localPlugin?.version
        ? compareVersions(localPlugin.version, installedVersion) > 0
        : false;

    plugins.push({
      id: pluginId,
      name: pluginName,
      version: latestVersion,
      description,
      marketplace: mpName,
      marketplaceDisplay: localMp?.name || formatMarketplaceName(mpName),
      enabled: isEnabled,
      ...scopeStatus,
      installedVersion: installedVersion,
      hasUpdate,
    });
  }

  return plugins;
}

// Simple version comparison (returns 1 if a > b, -1 if a < b, 0 if equal)
function compareVersions(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0;
  const partsA = a.replace(/^v/, '').split('.').map(Number);
  const partsB = b.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

// Get installed plugin versions from settings.json (shared, not secret)
async function getInstalledPluginVersions(
  projectPath?: string
): Promise<Record<string, string>> {
  const settings = await readSettings(projectPath);
  return settings.installedPluginVersions || {};
}

// Save installed plugin version to settings.json
export async function saveInstalledPluginVersion(
  pluginId: string,
  version: string,
  projectPath?: string
): Promise<void> {
  const settings = await readSettings(projectPath);
  settings.installedPluginVersions = settings.installedPluginVersions || {};
  settings.installedPluginVersions[pluginId] = version;
  await writeSettings(settings, projectPath);
}

// Remove installed plugin version from settings.json
export async function removeInstalledPluginVersion(
  pluginId: string,
  projectPath?: string
): Promise<void> {
  const settings = await readSettings(projectPath);
  if (settings.installedPluginVersions) {
    delete settings.installedPluginVersions[pluginId];
    await writeSettings(settings, projectPath);
  }
}

// Clear marketplace cache
export function clearMarketplaceCache(): void {
  marketplaceCache.clear();
  localMarketplacesPromise = null;
}

// Get local marketplaces (with Promise-based caching to prevent race conditions)
async function getLocalMarketplaces(): Promise<Map<string, LocalMarketplace>> {
  if (localMarketplacesPromise === null) {
    localMarketplacesPromise = scanLocalMarketplaces();
  }
  return localMarketplacesPromise;
}

// Export local marketplaces for use in other modules
export async function getLocalMarketplacesInfo(): Promise<Map<string, LocalMarketplace>> {
  return getLocalMarketplaces();
}

export interface RefreshAndRepairResult {
  refresh: RefreshResult[];
  repair: RepairMarketplaceResult[];
}

/**
 * Refresh all marketplace data:
 * 1. Git pull on all local marketplaces
 * 2. Auto-repair plugin.json files (add missing agents/commands/skills arrays)
 * 3. Clear all caches (forces re-fetch from GitHub and re-scan of local)
 * Returns results from git pull and repair operations
 * @param onProgress - Optional callback for progress updates
 */
export async function refreshAllMarketplaces(
  onProgress?: ProgressCallback
): Promise<RefreshAndRepairResult> {
  // First, git pull all local marketplaces
  const refreshResults = await refreshLocalMarketplaces(onProgress);

  // Auto-repair plugin.json files with missing agents/commands/skills
  const repairResults = await repairAllMarketplaces();

  // Then clear all caches to force fresh data
  clearMarketplaceCache();

  return {
    refresh: refreshResults,
    repair: repairResults,
  };
}

// Re-export types for consumers
export type { RefreshResult, ProgressCallback };

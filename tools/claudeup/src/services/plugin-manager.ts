import {
  getConfiguredMarketplaces,
  getEnabledPlugins,
  readSettings,
  writeSettings,
  getGlobalConfiguredMarketplaces,
  getGlobalEnabledPlugins,
  getGlobalInstalledPluginVersions,
} from './claude-settings.js';
import { defaultMarketplaces } from '../data/marketplaces.js';

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  marketplace: string;
  marketplaceDisplay: string;
  enabled: boolean;
  installedVersion?: string;
  hasUpdate?: boolean;
}

export interface MarketplacePlugin {
  name: string;
  version: string;
  description: string;
}

// Cache for fetched marketplace data
const marketplaceCache = new Map<string, { plugins: MarketplacePlugin[]; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchMarketplacePlugins(
  marketplaceName: string,
  repo: string
): Promise<MarketplacePlugin[]> {
  // Check cache first
  const cached = marketplaceCache.get(marketplaceName);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.plugins;
  }

  try {
    // Fetch marketplace.json from GitHub
    const url = `https://raw.githubusercontent.com/${repo}/main/.claude-plugin/marketplace.json`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch marketplace: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as { plugins?: Array<{ name: string; version?: string; description?: string }> };
    const plugins: MarketplacePlugin[] = [];

    if (data.plugins && Array.isArray(data.plugins)) {
      for (const plugin of data.plugins) {
        plugins.push({
          name: plugin.name,
          version: plugin.version || '0.0.0',
          description: plugin.description || '',
        });
      }
    }

    // Cache the result
    marketplaceCache.set(marketplaceName, { plugins, fetchedAt: Date.now() });

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

  const plugins: PluginInfo[] = [];

  // Get all marketplace names (configured + defaults)
  const marketplaceNames = new Set<string>();
  for (const mp of defaultMarketplaces) {
    if (configuredMarketplaces[mp.name]) {
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

      plugins.push({
        id: pluginId,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        marketplace: mpName,
        marketplaceDisplay: marketplace.displayName,
        enabled: isEnabled,
        installedVersion: installedVersion,
        hasUpdate: installedVersion ? compareVersions(plugin.version, installedVersion) > 0 : false,
      });
    }
  }

  return plugins;
}

export async function getGlobalAvailablePlugins(): Promise<PluginInfo[]> {
  const configuredMarketplaces = await getGlobalConfiguredMarketplaces();
  const enabledPlugins = await getGlobalEnabledPlugins();
  const installedVersions = await getGlobalInstalledPluginVersions();

  const plugins: PluginInfo[] = [];

  // Get all marketplace names (configured + defaults)
  const marketplaceNames = new Set<string>();
  for (const mp of defaultMarketplaces) {
    if (configuredMarketplaces[mp.name]) {
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

      plugins.push({
        id: pluginId,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        marketplace: mpName,
        marketplaceDisplay: marketplace.displayName,
        enabled: isEnabled,
        installedVersion: installedVersion,
        hasUpdate: installedVersion ? compareVersions(plugin.version, installedVersion) > 0 : false,
      });
    }
  }

  return plugins;
}

// Simple version comparison (returns 1 if a > b, -1 if a < b, 0 if equal)
function compareVersions(a: string, b: string): number {
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
}

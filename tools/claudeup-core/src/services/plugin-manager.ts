/**
 * UI-independent plugin manager service
 *
 * Manages plugin discovery, installation, and version tracking across:
 * - Remote GitHub marketplaces
 * - Local marketplace caches
 * - Per-scope (user/project/local) plugin states
 *
 * UI-agnostic design:
 * - No console.log or chalk dependencies
 * - Optional logger callback for messages
 * - Optional progress callback for long operations
 * - Explicit projectPath parameter (no process.cwd())
 * - All types and interfaces exported
 */

import path from "node:path";
import os from "node:os";
import {
  getConfiguredMarketplaces,
  getEnabledPlugins,
  readSettings,
  writeSettings,
  readGlobalSettings,
  writeGlobalSettings,
  getGlobalConfiguredMarketplaces,
  getGlobalEnabledPlugins,
  getGlobalInstalledPluginVersions,
  getLocalEnabledPlugins,
  getLocalInstalledPluginVersions,
  updateInstalledPluginsRegistry,
  removeFromInstalledPluginsRegistry,
} from "./claude-settings.js";

// Path constants for local marketplaces
const MARKETPLACES_DIR = path.join(os.homedir(), ".claude", "plugins", "marketplaces");
const KNOWN_MARKETPLACES_FILE = path.join(os.homedir(), ".claude", "plugins", "known_marketplaces.json");
import { defaultMarketplaces } from "../data/marketplaces.js";
import {
  scanLocalMarketplaces,
  refreshLocalMarketplaces,
  repairAllMarketplaces,
  type LocalMarketplace,
  type RefreshResult,
  type ProgressCallback,
  type RepairMarketplaceResult,
  type ComponentMeta,
} from "./local-marketplace.js";
import {
  formatMarketplaceName,
  isValidGitHubRepo,
  parsePluginId,
} from "../utils/string-utils.js";
import { validatePluginId } from "../utils/validators.js";

// Export types for consumers
export type { RefreshResult, ProgressCallback, RepairMarketplaceResult };

// Logger callback for UI-independent logging
export type LoggerCallback = (level: "info" | "warn" | "error", message: string, ...args: unknown[]) => void;

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
  agents?: ComponentMeta[];
  commands?: ComponentMeta[];
  skills?: ComponentMeta[];
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

/**
 * Fetch plugins from a remote GitHub marketplace
 * @param marketplaceName - Display name of marketplace
 * @param repo - GitHub repository (format: "owner/repo")
 * @param logger - Optional logger callback
 * @returns Array of marketplace plugins (empty on error)
 */
export async function fetchMarketplacePlugins(
  marketplaceName: string,
  repo: string,
  logger?: LoggerCallback,
): Promise<MarketplacePlugin[]> {
  // Check cache first - session-level, no TTL
  const cached = marketplaceCache.get(marketplaceName);
  if (cached) {
    return cached;
  }

  // Validate repo format to prevent SSRF
  if (!isValidGitHubRepo(repo)) {
    logger?.("error", `Invalid GitHub repo format: ${repo}`);
    return [];
  }

  try {
    // Fetch marketplace.json from GitHub
    const url = `https://raw.githubusercontent.com/${repo}/main/.claude-plugin/marketplace.json`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      logger?.("error", `Failed to fetch marketplace: ${response.status}`);
      return [];
    }

    // Validate content-type
    const contentType = response.headers.get("content-type");
    if (
      contentType &&
      !contentType.includes("application/json") &&
      !contentType.includes("text/plain")
    ) {
      logger?.("error", `Invalid content-type for marketplace: ${contentType}`);
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
          description: plugin.description || "",
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
    logger?.("error", `Error fetching marketplace ${marketplaceName}:`, error);
    return [];
  }
}

/**
 * Get all available plugins across all marketplaces (with per-scope status)
 * @param projectPath - Absolute path to project (optional, uses global scope if not provided)
 * @param logger - Optional logger callback
 * @returns Array of plugin info with scope-specific status
 */
export async function getAvailablePlugins(
  projectPath?: string,
  logger?: LoggerCallback,
): Promise<PluginInfo[]> {
  const configuredMarketplaces = projectPath
    ? await getConfiguredMarketplaces(projectPath)
    : await getGlobalConfiguredMarketplaces();
  const enabledPlugins = projectPath
    ? await getEnabledPlugins(projectPath)
    : await getGlobalEnabledPlugins();
  const installedVersions = projectPath
    ? await getInstalledPluginVersions(projectPath)
    : await getGlobalInstalledPluginVersions();

  // Fetch all scopes for per-scope status
  const userEnabledPlugins = await getGlobalEnabledPlugins();
  const userInstalledVersions = await getGlobalInstalledPluginVersions();
  const projectEnabledPlugins = projectPath
    ? await getEnabledPlugins(projectPath)
    : {};
  const projectInstalledVersions = projectPath
    ? await getInstalledPluginVersions(projectPath)
    : {};
  const localEnabledPlugins = projectPath
    ? await getLocalEnabledPlugins(projectPath)
    : {};
  const localInstalledVersions = projectPath
    ? await getLocalInstalledPluginVersions(projectPath)
    : {};

  const plugins: PluginInfo[] = [];
  const seenPluginIds = new Set<string>();

  // Helper to build scope status
  const buildScopeStatus = (pluginId: string) => ({
    userScope:
      userEnabledPlugins[pluginId] !== undefined
        ? {
            enabled: userEnabledPlugins[pluginId],
            version: userInstalledVersions[pluginId],
          }
        : undefined,
    projectScope:
      projectEnabledPlugins[pluginId] !== undefined
        ? {
            enabled: projectEnabledPlugins[pluginId],
            version: projectInstalledVersions[pluginId],
          }
        : undefined,
    localScope:
      localEnabledPlugins[pluginId] !== undefined
        ? {
            enabled: localEnabledPlugins[pluginId],
            version: localInstalledVersions[pluginId],
          }
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

  // Pre-fetch local marketplaces for merging detailed plugin info (agents, commands, skills, mcpServers)
  const localMarketplaces = await getLocalMarketplaces();

  // Fetch plugins from each configured marketplace
  for (const mpName of marketplaceNames) {
    const marketplace = defaultMarketplaces.find((m) => m.name === mpName);
    if (!marketplace || !marketplace.source.repo) continue;

    const marketplacePlugins = await fetchMarketplacePlugins(
      mpName,
      marketplace.source.repo,
      logger,
    );

    // Check if we have a local clone for this marketplace (for detailed plugin info)
    const localMp = localMarketplaces.get(mpName);

    for (const plugin of marketplacePlugins) {
      const pluginId = `${plugin.name}@${mpName}`;
      const installedVersion = installedVersions[pluginId];
      const isEnabled = enabledPlugins[pluginId] === true;
      const scopeStatus = buildScopeStatus(pluginId);

      // Try to get detailed info from local marketplace clone
      const localPlugin = localMp?.plugins.find((p) => p.name === plugin.name);

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
        hasUpdate:
          installedVersion && plugin.version
            ? compareVersions(plugin.version, installedVersion) > 0
            : false,
        ...scopeStatus,
        category: plugin.category,
        author: plugin.author,
        homepage: plugin.homepage,
        tags: plugin.tags,
        // Merge detailed info from local marketplace clone if available
        agents: localPlugin?.agents,
        commands: localPlugin?.commands,
        skills: localPlugin?.skills,
        mcpServers: localPlugin?.mcpServers,
        lspServers: localPlugin?.lspServers,
      });
    }
  }

  // Fetch ALL plugins from local marketplace caches (for marketplaces not in defaults)

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
        description: localPlugin.description || "",
        marketplace: mpName,
        marketplaceDisplay: localMp.name || formatMarketplaceName(mpName),
        enabled: isEnabled,
        installedVersion: installedVersion,
        hasUpdate: installedVersion
          ? compareVersions(localPlugin.version, installedVersion) > 0
          : false,
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

    const latestVersion = localPlugin?.version || installedVersion || "unknown";
    const description = localPlugin?.description || "Installed plugin";
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

/**
 * Get all available plugins in global scope (user-level)
 * @param logger - Optional logger callback
 * @returns Array of plugin info with scope-specific status
 */
export async function getGlobalAvailablePlugins(
  logger?: LoggerCallback,
): Promise<PluginInfo[]> {
  const configuredMarketplaces = await getGlobalConfiguredMarketplaces();
  const enabledPlugins = await getGlobalEnabledPlugins();
  const installedVersions = await getGlobalInstalledPluginVersions();

  // Fetch global scope status only (no project context available)
  const userEnabledPlugins = await getGlobalEnabledPlugins();
  const userInstalledVersions = await getGlobalInstalledPluginVersions();
  // Project and local scope not available without projectPath
  const projectEnabledPlugins: Record<string, boolean> = {};
  const projectInstalledVersions: Record<string, string> = {};
  const localEnabledPlugins: Record<string, boolean> = {};
  const localInstalledVersions: Record<string, string> = {};

  const plugins: PluginInfo[] = [];
  const seenPluginIds = new Set<string>();

  // Helper to build scope status (show all scopes)
  const buildScopeStatus = (pluginId: string) => ({
    userScope:
      userEnabledPlugins[pluginId] !== undefined
        ? {
            enabled: userEnabledPlugins[pluginId],
            version: userInstalledVersions[pluginId],
          }
        : undefined,
    projectScope:
      projectEnabledPlugins[pluginId] !== undefined
        ? {
            enabled: projectEnabledPlugins[pluginId],
            version: projectInstalledVersions[pluginId],
          }
        : undefined,
    localScope:
      localEnabledPlugins[pluginId] !== undefined
        ? {
            enabled: localEnabledPlugins[pluginId],
            version: localInstalledVersions[pluginId],
          }
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

  // Pre-fetch local marketplaces for merging detailed plugin info (agents, commands, skills, mcpServers)
  const localMarketplaces = await getLocalMarketplaces();

  // Fetch plugins from each configured marketplace
  for (const mpName of marketplaceNames) {
    const marketplace = defaultMarketplaces.find((m) => m.name === mpName);
    if (!marketplace || !marketplace.source.repo) continue;

    const marketplacePlugins = await fetchMarketplacePlugins(
      mpName,
      marketplace.source.repo,
      logger,
    );

    // Check if we have a local clone for this marketplace (for detailed plugin info)
    const localMp = localMarketplaces.get(mpName);

    for (const plugin of marketplacePlugins) {
      const pluginId = `${plugin.name}@${mpName}`;
      const installedVersion = installedVersions[pluginId];
      const isEnabled = enabledPlugins[pluginId] === true;
      const scopeStatus = buildScopeStatus(pluginId);

      // Try to get detailed info from local marketplace clone
      const localPlugin = localMp?.plugins.find((p) => p.name === plugin.name);

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
        hasUpdate:
          installedVersion && plugin.version
            ? compareVersions(plugin.version, installedVersion) > 0
            : false,
        ...scopeStatus,
        category: plugin.category,
        author: plugin.author,
        homepage: plugin.homepage,
        tags: plugin.tags,
        // Merge detailed info from local marketplace clone if available
        agents: localPlugin?.agents,
        commands: localPlugin?.commands,
        skills: localPlugin?.skills,
        mcpServers: localPlugin?.mcpServers,
        lspServers: localPlugin?.lspServers,
      });
    }
  }

  // Fetch ALL plugins from local marketplace caches (for marketplaces not in defaults)
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
        description: localPlugin.description || "",
        marketplace: mpName,
        marketplaceDisplay: localMp.name || formatMarketplaceName(mpName),
        enabled: isEnabled,
        installedVersion: installedVersion,
        hasUpdate: installedVersion
          ? compareVersions(localPlugin.version, installedVersion) > 0
          : false,
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

    const latestVersion = localPlugin?.version || installedVersion || "unknown";
    const description = localPlugin?.description || "Installed plugin";
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

/**
 * Simple version comparison
 * @param a - Version string (with optional "v" prefix)
 * @param b - Version string (with optional "v" prefix)
 * @returns 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  if (!a || !b) return 0;
  const partsA = a.replace(/^v/, "").split(".").map(Number);
  const partsB = b.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

/**
 * Get installed plugin versions from settings.json (shared, not secret)
 * @param projectPath - Absolute path to project (optional, uses global scope if not provided)
 * @returns Record of plugin IDs to version strings
 */
async function getInstalledPluginVersions(
  projectPath?: string,
): Promise<Record<string, string>> {
  const settings = projectPath
    ? await readSettings(projectPath)
    : await readGlobalSettings();
  return settings.installedPluginVersions || {};
}

/**
 * Save installed plugin version to settings.json
 * @param pluginId - Plugin ID (format: "plugin-name@marketplace-name")
 * @param version - Version string
 * @param projectPath - Absolute path to project (optional, uses global scope if not provided)
 * @throws Error if plugin ID format is invalid
 */
export async function saveInstalledPluginVersion(
  pluginId: string,
  version: string,
  projectPath?: string,
): Promise<void> {
  // Validate plugin ID format
  validatePluginId(pluginId);

  if (projectPath) {
    const settings = await readSettings(projectPath);
    settings.installedPluginVersions = settings.installedPluginVersions || {};
    settings.installedPluginVersions[pluginId] = version;
    await writeSettings(settings, projectPath);
  } else {
    const settings = await readGlobalSettings();
    settings.installedPluginVersions = settings.installedPluginVersions || {};
    settings.installedPluginVersions[pluginId] = version;
    await writeGlobalSettings(settings);
  }

  // Update installed_plugins.json registry
  await updateInstalledPluginsRegistry(
    pluginId,
    version,
    projectPath ? "project" : "user",
    projectPath ? path.resolve(projectPath) : undefined,
  );
}

/**
 * Remove installed plugin version from settings.json
 * @param pluginId - Plugin ID (format: "plugin-name@marketplace-name")
 * @param projectPath - Absolute path to project (optional, uses global scope if not provided)
 * @throws Error if plugin ID format is invalid
 */
export async function removeInstalledPluginVersion(
  pluginId: string,
  projectPath?: string,
): Promise<void> {
  // Validate plugin ID format
  validatePluginId(pluginId);

  if (projectPath) {
    const settings = await readSettings(projectPath);
    if (settings.installedPluginVersions) {
      delete settings.installedPluginVersions[pluginId];
      await writeSettings(settings, projectPath);
    }
  } else {
    const settings = await readGlobalSettings();
    if (settings.installedPluginVersions) {
      delete settings.installedPluginVersions[pluginId];
      await writeGlobalSettings(settings);
    }
  }

  // Remove from installed_plugins.json registry
  await removeFromInstalledPluginsRegistry(
    pluginId,
    projectPath ? "project" : "user",
    projectPath ? path.resolve(projectPath) : undefined,
  );
}

/**
 * Clear all marketplace caches (session-level)
 * Forces re-fetch from GitHub and re-scan of local marketplaces
 */
export function clearMarketplaceCache(): void {
  marketplaceCache.clear();
  localMarketplacesPromise = null;
}

/**
 * Get local marketplaces (with Promise-based caching to prevent race conditions)
 * @returns Map of marketplace names to LocalMarketplace objects
 */
async function getLocalMarketplaces(): Promise<Map<string, LocalMarketplace>> {
  if (localMarketplacesPromise === null) {
    localMarketplacesPromise = scanLocalMarketplaces(MARKETPLACES_DIR, KNOWN_MARKETPLACES_FILE);
  }
  return localMarketplacesPromise;
}

/**
 * Export local marketplaces info for use in other modules
 * @returns Map of marketplace names to LocalMarketplace objects
 */
export async function getLocalMarketplacesInfo(): Promise<
  Map<string, LocalMarketplace>
> {
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
 * @returns Results from git pull and auto-repair operations
 */
export async function refreshAllMarketplaces(
  onProgress?: ProgressCallback,
): Promise<RefreshAndRepairResult> {
  // First, git pull all local marketplaces
  const refreshResults = await refreshLocalMarketplaces(MARKETPLACES_DIR, KNOWN_MARKETPLACES_FILE, onProgress);

  // Auto-repair plugin.json files with missing agents/commands/skills
  const repairResults = await repairAllMarketplaces(MARKETPLACES_DIR);

  // Then clear all caches to force fresh data
  clearMarketplaceCache();

  return {
    refresh: refreshResults,
    repair: repairResults,
  };
}

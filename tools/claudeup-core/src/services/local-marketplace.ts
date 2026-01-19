/**
 * Local marketplace service - UI-independent
 *
 * Manages local marketplace operations:
 * - Scanning and loading marketplace manifests
 * - Cloning and refreshing repositories
 * - Plugin validation and repair
 * - Known marketplace tracking
 *
 * All operations accept explicit paths and optional callbacks for logging/progress.
 */

import fs from 'fs-extra';
import path from 'node:path';
import { execSync, exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import { validateFilePath } from '../utils/validators.js';

const execAsync = promisify(execCb);

/**
 * Metadata extracted from component markdown frontmatter
 */
export interface ComponentMeta {
  name: string;
  description?: string;
  allowedTools?: string[];
  disableModelInvocation?: boolean;
  // Additional frontmatter fields
  [key: string]: unknown;
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): Record<string, unknown> {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return {};

  const frontmatter: Record<string, unknown> = {};
  const lines = frontmatterMatch[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: string | boolean | string[] = line.slice(colonIndex + 1).trim();

    // Strip surrounding quotes from YAML strings
    if (typeof value === 'string' && value.length >= 2) {
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
    }

    // Parse boolean values
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // Parse comma-separated lists (like allowed-tools)
    else if (key === 'allowed-tools' && typeof value === 'string') {
      value = value.split(',').map(s => s.trim()).filter(Boolean);
    }

    frontmatter[key] = value;
  }

  return frontmatter;
}

/**
 * Truncate description to a reasonable length for UI display
 */
function truncateDescription(desc: string | undefined, maxLength = 100): string | undefined {
  if (!desc) return undefined;
  // Remove newlines, escape sequences, and excessive whitespace
  const cleaned = desc
    .replace(/\\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  // Truncate at word boundary
  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxLength * 0.7 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

/**
 * Extract component metadata from a markdown file
 */
async function extractComponentMeta(filePath: string, name: string): Promise<ComponentMeta> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    // Only extract specific known fields, don't spread all frontmatter
    return {
      name,
      description: truncateDescription(frontmatter['description'] as string | undefined),
      allowedTools: frontmatter['allowed-tools'] as string[] | undefined,
      disableModelInvocation: frontmatter['disable-model-invocation'] as boolean | undefined,
    };
  } catch {
    return { name };
  }
}

export interface LocalMarketplacePlugin {
  name: string;
  version: string;
  description: string;
  source?: string;
  category?: string;
  author?: { name: string; email?: string };
  strict?: boolean;
  lspServers?: Record<string, unknown>;
  agents?: ComponentMeta[];
  commands?: ComponentMeta[];
  skills?: ComponentMeta[];
  mcpServers?: string[];
}

export interface LocalMarketplace {
  name: string;
  description: string;
  plugins: LocalMarketplacePlugin[];
  gitRepo?: string;
}

interface KnownMarketplaceEntry {
  source: { source: string; url?: string; repo?: string };
  installLocation: string;
  lastUpdated: string;
}

type KnownMarketplaces = Record<string, KnownMarketplaceEntry>;

export type LogCallback = (message: string) => void;
export type ProgressCallback = (progress: { current: number; total: number; name: string }) => void;

/**
 * Read known_marketplaces.json
 */
async function readKnownMarketplaces(knownMarketplacesPath: string): Promise<KnownMarketplaces> {
  try {
    if (await fs.pathExists(knownMarketplacesPath)) {
      return await fs.readJson(knownMarketplacesPath);
    }
  } catch {
    // Return empty if can't read
  }
  return {};
}

/**
 * Write known_marketplaces.json
 */
async function writeKnownMarketplaces(
  knownMarketplacesPath: string,
  data: KnownMarketplaces,
): Promise<void> {
  await fs.ensureDir(path.dirname(knownMarketplacesPath));
  await fs.writeJson(knownMarketplacesPath, data, { spaces: 2 });
}

/**
 * Add a marketplace to known_marketplaces.json
 */
export async function addToKnownMarketplaces(
  knownMarketplacesPath: string,
  marketplacesDir: string,
  name: string,
  repo: string,
): Promise<void> {
  const known = await readKnownMarketplaces(knownMarketplacesPath);
  known[name] = {
    source: { source: 'github', repo },
    installLocation: path.join(marketplacesDir, name),
    lastUpdated: new Date().toISOString(),
  };
  await writeKnownMarketplaces(knownMarketplacesPath, known);
}

/**
 * Remove a marketplace from known_marketplaces.json
 */
export async function removeFromKnownMarketplaces(
  knownMarketplacesPath: string,
  name: string,
): Promise<void> {
  const known = await readKnownMarketplaces(knownMarketplacesPath);
  if (known[name]) {
    delete known[name];
    await writeKnownMarketplaces(knownMarketplacesPath, known);
  }
}

/**
 * Get git remote URL from a marketplace directory
 */
function getGitRemote(marketplacePath: string): string | undefined {
  try {
    const gitDir = path.join(marketplacePath, '.git');
    if (!fs.existsSync(gitDir)) return undefined;

    const result = execSync('git remote get-url origin', {
      cwd: marketplacePath,
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();

    // Convert SSH URL to HTTPS format: git@github.com:user/repo.git -> user/repo
    if (result.startsWith('git@github.com:')) {
      return result.replace('git@github.com:', '').replace(/\.git$/, '');
    }
    // HTTPS URL: https://github.com/user/repo -> user/repo
    if (result.includes('github.com')) {
      const match = result.match(/github\.com[/:]([^/]+\/[^/\s.]+)/);
      if (match) return match[1].replace(/\.git$/, '');
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Scan a single marketplace directory and return marketplace info
 */
async function scanSingleMarketplace(
  marketplacePath: string,
  marketplaceName: string,
  log?: LogCallback,
): Promise<LocalMarketplace | null> {
  const manifestPath = path.join(marketplacePath, '.claude-plugin', 'marketplace.json');

  if (!(await fs.pathExists(manifestPath))) return null;

  try {
    const manifest = await fs.readJson(manifestPath);
    const gitRepo = getGitRemote(marketplacePath);

    const plugins: LocalMarketplacePlugin[] = [];
    const validManifestPlugins: typeof manifest.plugins = [];
    let manifestModified = false;

    if (manifest.plugins && Array.isArray(manifest.plugins)) {
      for (const plugin of manifest.plugins) {
        let agents: ComponentMeta[] = [];
        let commands: ComponentMeta[] = [];
        let skills: ComponentMeta[] = [];
        let mcpServers: string[] = [];

        const sourceStr = typeof plugin.source === 'string' ? plugin.source : null;

        if (sourceStr) {
          const pluginPath = path.join(marketplacePath, sourceStr.replace('./', ''));

          if (!(await fs.pathExists(pluginPath))) {
            manifestModified = true;
            log?.(`Removed missing plugin: ${plugin.name}`);
            continue;
          }

          try {
            // Scan for agents with metadata
            const agentsDir = path.join(pluginPath, 'agents');
            if (await fs.pathExists(agentsDir)) {
              const agentFiles = await fs.readdir(agentsDir);
              const mdFiles = agentFiles.filter((f) => f.endsWith('.md'));
              agents = await Promise.all(
                mdFiles.map((f) => extractComponentMeta(path.join(agentsDir, f), f.replace('.md', '')))
              );
            }
            // Scan for commands with metadata
            const commandsDir = path.join(pluginPath, 'commands');
            if (await fs.pathExists(commandsDir)) {
              const cmdFiles = await fs.readdir(commandsDir);
              const mdFiles = cmdFiles.filter((f) => f.endsWith('.md'));
              commands = await Promise.all(
                mdFiles.map((f) => extractComponentMeta(path.join(commandsDir, f), f.replace('.md', '')))
              );
            }
            // Scan for skills with metadata
            const skillsDir = path.join(pluginPath, 'skills');
            if (await fs.pathExists(skillsDir)) {
              const entries = await fs.readdir(skillsDir, { withFileTypes: true });
              const skillItems = entries.filter((e) => e.name.endsWith('.md') || e.isDirectory());
              skills = await Promise.all(
                skillItems.map(async (e) => {
                  const skillPath = e.isDirectory()
                    ? path.join(skillsDir, e.name, 'SKILL.md')
                    : path.join(skillsDir, e.name);
                  const name = e.name.replace('.md', '');
                  if (await fs.pathExists(skillPath)) {
                    return extractComponentMeta(skillPath, name);
                  }
                  return { name };
                })
              );
            }
            // Scan for MCP servers
            const mcpDir = path.join(pluginPath, 'mcp-servers');
            if (await fs.pathExists(mcpDir)) {
              const mcpFiles = await fs.readdir(mcpDir);
              mcpServers = mcpFiles.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
            }
          } catch {
            // Ignore scan errors
          }
        }

        validManifestPlugins.push(plugin);
        plugins.push({
          name: plugin.name,
          version: plugin.version || '0.0.0',
          description: plugin.description || '',
          source: plugin.source,
          category: plugin.category,
          author: plugin.author,
          strict: plugin.strict,
          lspServers: plugin.lspServers,
          agents,
          commands,
          skills,
          mcpServers,
        });
      }
    }

    // Update marketplace.json if we removed invalid plugins
    if (manifestModified) {
      manifest.plugins = validManifestPlugins;
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
      log?.(`Updated marketplace manifest: ${marketplaceName}`);
    }

    return {
      name: manifest.name || marketplaceName,
      description: manifest.description || manifest.metadata?.description || '',
      plugins,
      gitRepo,
    };
  } catch {
    return null;
  }
}

/**
 * Scan local marketplace cache and return marketplace info
 */
export async function scanLocalMarketplaces(
  marketplacesDir: string,
  knownMarketplacesPath: string,
  log?: LogCallback,
): Promise<Map<string, LocalMarketplace>> {
  const marketplaces = new Map<string, LocalMarketplace>();

  // 1. Scan marketplaces from the standard directory
  if (await fs.pathExists(marketplacesDir)) {
    try {
      const entries = await fs.readdir(marketplacesDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const marketplacePath = path.join(marketplacesDir, entry.name);
        const marketplace = await scanSingleMarketplace(marketplacePath, entry.name, log);
        if (marketplace) {
          marketplaces.set(entry.name, marketplace);
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  // 2. Add directory-based marketplaces from known_marketplaces.json
  try {
    const known = await readKnownMarketplaces(knownMarketplacesPath);
    for (const [name, entry] of Object.entries(known)) {
      if (
        entry.source.source === 'directory' &&
        entry.installLocation &&
        !marketplaces.has(name)
      ) {
        if (await fs.pathExists(entry.installLocation)) {
          const marketplace = await scanSingleMarketplace(entry.installLocation, name, log);
          if (marketplace) {
            marketplaces.set(name, marketplace);
          }
        }
      }
    }
  } catch {
    // Ignore errors reading known_marketplaces
  }

  return marketplaces;
}

/**
 * Get a specific local marketplace by name
 */
export async function getLocalMarketplace(
  marketplacesDir: string,
  knownMarketplacesPath: string,
  name: string,
  log?: LogCallback,
): Promise<LocalMarketplace | undefined> {
  const marketplaces = await scanLocalMarketplaces(marketplacesDir, knownMarketplacesPath, log);
  return marketplaces.get(name);
}

/**
 * Check if a marketplace exists in local cache
 */
export async function hasLocalMarketplace(
  marketplacesDir: string,
  name: string,
): Promise<boolean> {
  const marketplacePath = path.join(marketplacesDir, name);
  const manifestPath = path.join(marketplacePath, '.claude-plugin', 'marketplace.json');
  return fs.pathExists(manifestPath);
}

export interface RefreshResult {
  name: string;
  success: boolean;
  updated: boolean;
  error?: string;
}

/**
 * Get the GitHub repo for a marketplace from known_marketplaces.json or defaults
 */
async function getMarketplaceRepo(
  knownMarketplacesPath: string,
  name: string,
): Promise<string | undefined> {
  const known = await readKnownMarketplaces(knownMarketplacesPath);
  if (known[name]?.source?.repo) {
    return known[name].source.repo;
  }

  // Fallback to hardcoded defaults
  const defaults: Record<string, string> = {
    'claude-plugins-official': 'anthropics/claude-plugins-official',
    'claude-code-plugins': 'anthropics/claude-code',
    'mag-claude-plugins': 'MadAppGang/claude-code',
  };

  return defaults[name];
}

/**
 * Re-clone a corrupted marketplace (missing .git folder)
 */
async function recloneCorruptedMarketplace(
  marketplacePath: string,
  repo: string,
  onProgress?: (stage: string) => void,
): Promise<{ success: boolean; error?: string }> {
  try {
    onProgress?.('Removing corrupted directory');
    await fs.remove(marketplacePath);

    onProgress?.('Cloning repository');
    const cloneUrl = `https://github.com/${repo}.git`;
    await execAsync(`git clone --depth 1 "${cloneUrl}" "${marketplacePath}" >/dev/null 2>&1`, {
      timeout: 60000,
      shell: '/bin/bash',
    });

    const gitDir = path.join(marketplacePath, '.git');
    if (!fs.existsSync(gitDir)) {
      return {
        success: false,
        error: 'Re-clone failed: .git folder not created',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Re-clone failed',
    };
  }
}

/**
 * Refresh a single local marketplace by running git pull
 */
async function refreshSingleMarketplace(
  marketplacePath: string,
  name: string,
  knownMarketplacesPath: string,
  onProgress?: (stage: string) => void,
): Promise<RefreshResult> {
  try {
    const gitDir = path.join(marketplacePath, '.git');
    if (!fs.existsSync(gitDir)) {
      const repo = await getMarketplaceRepo(knownMarketplacesPath, name);
      if (!repo) {
        return {
          name,
          success: false,
          updated: false,
          error: 'Corrupted (missing .git) - unknown repo, cannot auto-repair',
        };
      }

      const recloneResult = await recloneCorruptedMarketplace(marketplacePath, repo, onProgress);
      if (recloneResult.success) {
        return {
          name,
          success: true,
          updated: true,
          error: 'Auto-repaired: re-cloned corrupted marketplace',
        };
      }
      return {
        name,
        success: false,
        updated: false,
        error: `Auto-repair failed: ${recloneResult.error}`,
      };
    }

    onProgress?.('Checking current state');
    const { stdout: beforeHead } = await execAsync('git rev-parse HEAD', {
      cwd: marketplacePath,
      timeout: 5000,
    });

    onProgress?.('Pulling updates');
    await execAsync('git pull --ff-only >/dev/null 2>&1', {
      cwd: marketplacePath,
      timeout: 30000,
      shell: '/bin/bash',
    });

    const { stdout: afterHead } = await execAsync('git rev-parse HEAD', {
      cwd: marketplacePath,
      timeout: 5000,
    });

    return {
      name,
      success: true,
      updated: beforeHead.trim() !== afterHead.trim(),
    };
  } catch (error) {
    return {
      name,
      success: false,
      updated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refresh all local marketplaces by running git pull on each
 */
export async function refreshLocalMarketplaces(
  marketplacesDir: string,
  knownMarketplacesPath: string,
  onProgress?: ProgressCallback,
  onStageProgress?: (name: string, stage: string) => void,
): Promise<RefreshResult[]> {
  const results: RefreshResult[] = [];
  const marketplacesToRefresh: { name: string; path: string }[] = [];

  // 1. Add marketplaces from the standard directory
  if (await fs.pathExists(marketplacesDir)) {
    try {
      const entries = await fs.readdir(marketplacesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          marketplacesToRefresh.push({
            name: entry.name,
            path: path.join(marketplacesDir, entry.name),
          });
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  // 2. Add directory-based marketplaces from known_marketplaces.json
  try {
    const known = await readKnownMarketplaces(knownMarketplacesPath);
    for (const [name, entry] of Object.entries(known)) {
      if (
        entry.source.source === 'directory' &&
        entry.installLocation &&
        !marketplacesToRefresh.some((m) => m.name === name)
      ) {
        const gitDir = path.join(entry.installLocation, '.git');
        if (fs.existsSync(gitDir)) {
          marketplacesToRefresh.push({
            name,
            path: entry.installLocation,
          });
        }
      }
    }
  } catch {
    // Ignore errors reading known_marketplaces
  }

  if (marketplacesToRefresh.length === 0) {
    return results;
  }

  const total = marketplacesToRefresh.length;
  let completed = 0;

  const promises = marketplacesToRefresh.map(async ({ name, path: mpPath }) => {
    const result = await refreshSingleMarketplace(
      mpPath,
      name,
      knownMarketplacesPath,
      (stage) => onStageProgress?.(name, stage),
    );
    completed++;
    onProgress?.({ current: completed, total, name });
    return result;
  });

  const settled = await Promise.all(promises);
  results.push(...settled);

  return results;
}

export interface CloneResult {
  success: boolean;
  name: string;
  error?: string;
}

/**
 * Clone a marketplace from GitHub repo
 */
export async function cloneMarketplace(
  marketplacesDir: string,
  repo: string,
  onProgress?: (stage: string) => void,
): Promise<CloneResult> {
  let normalizedRepo = repo.trim();

  if (normalizedRepo.includes('github.com')) {
    const match = normalizedRepo.match(/github\.com[/:]([^/]+\/[^/\s.]+)/);
    if (match) {
      normalizedRepo = match[1].replace(/\.git$/, '');
    }
  }

  if (!normalizedRepo.match(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/)) {
    return {
      success: false,
      name: '',
      error: 'Invalid repo format. Use owner/repo (letters, numbers, hyphens, underscores only)',
    };
  }

  const repoName = normalizedRepo.split('/')[1];

  if (repoName.includes('..') || repoName.includes('/') || repoName.includes('\\')) {
    return { success: false, name: '', error: 'Invalid repository name' };
  }

  await fs.ensureDir(marketplacesDir);

  const marketplacePath = path.join(marketplacesDir, repoName);

  try {
    validateFilePath(marketplacePath, marketplacesDir);
  } catch (error) {
    return {
      success: false,
      name: '',
      error: error instanceof Error ? error.message : 'Invalid path detected',
    };
  }

  if (await fs.pathExists(marketplacePath)) {
    return {
      success: false,
      name: repoName,
      error: 'Marketplace already exists',
    };
  }

  try {
    onProgress?.('Cloning repository');
    const cloneUrl = `https://github.com/${normalizedRepo}.git`;
    await execAsync(`git clone --depth 1 "${cloneUrl}" "${marketplacePath}" >/dev/null 2>&1`, {
      timeout: 60000,
      shell: '/bin/bash',
    });

    onProgress?.('Validating marketplace');
    const manifestPath = path.join(marketplacePath, '.claude-plugin', 'marketplace.json');
    if (!(await fs.pathExists(manifestPath))) {
      await fs.remove(marketplacePath);
      return {
        success: false,
        name: repoName,
        error: 'Not a valid marketplace (no .claude-plugin/marketplace.json)',
      };
    }

    return { success: true, name: repoName };
  } catch (error) {
    await fs.remove(marketplacePath).catch(() => {});
    return {
      success: false,
      name: repoName,
      error: error instanceof Error ? error.message : 'Clone failed',
    };
  }
}

/**
 * Delete a marketplace directory from local cache
 */
export async function deleteMarketplace(marketplacesDir: string, name: string): Promise<void> {
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    throw new Error('Invalid marketplace name');
  }

  const marketplacePath = path.join(marketplacesDir, name);

  try {
    validateFilePath(marketplacePath, marketplacesDir);
  } catch {
    throw new Error('Invalid marketplace path');
  }

  if (await fs.pathExists(marketplacePath)) {
    await fs.remove(marketplacePath);
  }
}

export interface RepairResult {
  repaired: boolean;
  pluginName: string;
  added: {
    agents: string[];
    commands: string[];
    skills: string[];
  };
}

/**
 * Repair a plugin's plugin.json by adding missing arrays
 */
export async function repairPluginJson(
  pluginPath: string,
  log?: LogCallback,
): Promise<RepairResult> {
  const pluginJsonPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');
  const pluginName = path.basename(pluginPath);

  const result: RepairResult = {
    repaired: false,
    pluginName,
    added: { agents: [], commands: [], skills: [] },
  };

  if (!(await fs.pathExists(pluginJsonPath))) {
    return result;
  }

  try {
    const pluginJson = await fs.readJson(pluginJsonPath);
    let modified = false;

    // Scan and add agents if array is missing
    const agentsDir = path.join(pluginPath, 'agents');
    if (await fs.pathExists(agentsDir)) {
      const files = (await fs.readdir(agentsDir))
        .filter((f) => f.endsWith('.md'))
        .map((f) => `./agents/${f}`);

      if (files.length > 0 && !pluginJson.agents) {
        pluginJson.agents = files;
        result.added.agents = files;
        modified = true;
      }
    }

    // Scan and add commands if array is missing
    const commandsDir = path.join(pluginPath, 'commands');
    if (await fs.pathExists(commandsDir)) {
      const files = (await fs.readdir(commandsDir))
        .filter((f) => f.endsWith('.md'))
        .map((f) => `./commands/${f}`);

      if (files.length > 0 && !pluginJson.commands) {
        pluginJson.commands = files;
        result.added.commands = files;
        modified = true;
      }
    }

    // Scan and add skills if array is missing
    const skillsDir = path.join(pluginPath, 'skills');
    if (await fs.pathExists(skillsDir)) {
      const entries = await fs.readdir(skillsDir, { withFileTypes: true });
      const skills = entries
        .filter((e) => e.isDirectory() || e.name.endsWith('.md'))
        .map((e) => `./skills/${e.name}`);

      if (skills.length > 0 && !pluginJson.skills) {
        pluginJson.skills = skills;
        result.added.skills = skills;
        modified = true;
      }
    }

    if (modified) {
      await fs.writeJson(pluginJsonPath, pluginJson, { spaces: 2 });
      result.repaired = true;
      log?.(`Repaired plugin: ${pluginName}`);
    }
  } catch {
    // Ignore repair errors for individual plugins
  }

  return result;
}

export interface RepairMarketplaceResult {
  marketplace: string;
  repaired: RepairResult[];
}

/**
 * Repair all plugins in a marketplace
 */
export async function repairMarketplacePlugins(
  marketplacesDir: string,
  marketplaceName: string,
  log?: LogCallback,
): Promise<RepairMarketplaceResult> {
  const result: RepairMarketplaceResult = {
    marketplace: marketplaceName,
    repaired: [],
  };

  const marketplacePath = path.join(marketplacesDir, marketplaceName);
  const manifestPath = path.join(marketplacePath, '.claude-plugin', 'marketplace.json');

  if (!(await fs.pathExists(manifestPath))) {
    return result;
  }

  try {
    const manifest = await fs.readJson(manifestPath);

    if (manifest.plugins && Array.isArray(manifest.plugins)) {
      for (const plugin of manifest.plugins) {
        if (plugin.source) {
          const pluginPath = path.join(marketplacePath, plugin.source.replace('./', ''));
          const repairResult = await repairPluginJson(pluginPath, log);

          if (repairResult.repaired) {
            result.repaired.push(repairResult);
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return result;
}

/**
 * Repair all plugins in all marketplaces
 */
export async function repairAllMarketplaces(
  marketplacesDir: string,
  log?: LogCallback,
): Promise<RepairMarketplaceResult[]> {
  const results: RepairMarketplaceResult[] = [];

  if (!(await fs.pathExists(marketplacesDir))) {
    return results;
  }

  try {
    const entries = await fs.readdir(marketplacesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const repairResult = await repairMarketplacePlugins(marketplacesDir, entry.name, log);
      if (repairResult.repaired.length > 0) {
        results.push(repairResult);
      }
    }
  } catch {
    // Return empty on error
  }

  return results;
}

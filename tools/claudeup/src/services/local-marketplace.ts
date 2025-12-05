import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { execSync, exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(execCb);

export interface LocalMarketplacePlugin {
  name: string;
  version: string;
  description: string;
  source?: string;
  category?: string;
  author?: { name: string; email?: string };
}

export interface LocalMarketplace {
  name: string;
  description: string;
  plugins: LocalMarketplacePlugin[];
  gitRepo?: string; // Extracted from git remote
}

const CLAUDE_PLUGINS_DIR = path.join(os.homedir(), '.claude', 'plugins', 'marketplaces');

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
 * Scan local marketplace cache and return marketplace info
 */
export async function scanLocalMarketplaces(): Promise<Map<string, LocalMarketplace>> {
  const marketplaces = new Map<string, LocalMarketplace>();

  if (!(await fs.pathExists(CLAUDE_PLUGINS_DIR))) {
    return marketplaces;
  }

  try {
    const entries = await fs.readdir(CLAUDE_PLUGINS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const marketplacePath = path.join(CLAUDE_PLUGINS_DIR, entry.name);
      const manifestPath = path.join(marketplacePath, '.claude-plugin', 'marketplace.json');

      if (!(await fs.pathExists(manifestPath))) continue;

      try {
        const manifest = await fs.readJson(manifestPath);
        const gitRepo = getGitRemote(marketplacePath);

        const plugins: LocalMarketplacePlugin[] = [];
        if (manifest.plugins && Array.isArray(manifest.plugins)) {
          for (const plugin of manifest.plugins) {
            plugins.push({
              name: plugin.name,
              version: plugin.version || '0.0.0',
              description: plugin.description || '',
              source: plugin.source,
              category: plugin.category,
              author: plugin.author,
            });
          }
        }

        marketplaces.set(entry.name, {
          name: manifest.name || entry.name,
          description: manifest.description || manifest.metadata?.description || '',
          plugins,
          gitRepo,
        });
      } catch {
        // Skip invalid marketplace
      }
    }
  } catch {
    // Return empty if can't read directory
  }

  return marketplaces;
}

/**
 * Get a specific local marketplace by name
 */
export async function getLocalMarketplace(name: string): Promise<LocalMarketplace | undefined> {
  const marketplaces = await scanLocalMarketplaces();
  return marketplaces.get(name);
}

/**
 * Check if a marketplace exists in local cache
 */
export async function hasLocalMarketplace(name: string): Promise<boolean> {
  const marketplacePath = path.join(CLAUDE_PLUGINS_DIR, name);
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
 * Refresh a single local marketplace by running git pull (async, non-blocking)
 */
async function refreshSingleMarketplace(marketplacePath: string, name: string): Promise<RefreshResult> {
  try {
    const gitDir = path.join(marketplacePath, '.git');
    if (!fs.existsSync(gitDir)) {
      return { name, success: false, updated: false, error: 'Not a git repository' };
    }

    // Get current HEAD before pull (async)
    const { stdout: beforeHead } = await execAsync('git rev-parse HEAD', {
      cwd: marketplacePath,
      timeout: 5000,
    });

    // Run git pull (async)
    await execAsync('git pull --ff-only', {
      cwd: marketplacePath,
      timeout: 30000, // 30s timeout for network operation
    });

    // Get HEAD after pull (async)
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

export interface RefreshProgress {
  current: number;
  total: number;
  name: string;
}

export type ProgressCallback = (progress: RefreshProgress) => void;

/**
 * Refresh all local marketplaces by running git pull on each
 * Returns results for each marketplace
 * @param onProgress - Optional callback for progress updates
 */
export async function refreshLocalMarketplaces(
  onProgress?: ProgressCallback
): Promise<RefreshResult[]> {
  const results: RefreshResult[] = [];

  if (!(await fs.pathExists(CLAUDE_PLUGINS_DIR))) {
    return results;
  }

  try {
    const entries = await fs.readdir(CLAUDE_PLUGINS_DIR, { withFileTypes: true });
    const directories = entries.filter((entry) => entry.isDirectory());
    const total = directories.length;
    let completed = 0;

    // Run git pull on all marketplaces in parallel, but track progress
    const promises = directories.map(async (entry) => {
      const marketplacePath = path.join(CLAUDE_PLUGINS_DIR, entry.name);
      const result = await refreshSingleMarketplace(marketplacePath, entry.name);
      completed++;
      onProgress?.({ current: completed, total, name: entry.name });
      return result;
    });

    const settled = await Promise.all(promises);
    results.push(...settled);
  } catch {
    // Return empty results if can't read directory
  }

  return results;
}

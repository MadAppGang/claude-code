import type { Marketplace } from '../types/index.js';
import type { LocalMarketplace } from '../services/local-marketplace.js';
import { formatMarketplaceName } from '../utils/string-utils.js';

export const defaultMarketplaces: Marketplace[] = [
  {
    name: 'claude-code-plugins',
    displayName: 'Anthropic Official',
    source: {
      source: 'github',
      repo: 'anthropics/claude-code',
    },
    description: 'Official Anthropic plugins for Claude Code',
    official: true,
  },
  {
    name: 'mag-claude-plugins',
    displayName: 'MadAppGang Plugins',
    source: {
      source: 'github',
      repo: 'MadAppGang/claude-code',
    },
    description: 'Professional plugins for frontend, backend, and code analysis',
    official: false,
  },
];

export function getMarketplaceByName(name: string): Marketplace | undefined {
  return defaultMarketplaces.find((m) => m.name === name);
}

// Get all available marketplaces from local cache + hardcoded defaults
// Local cache is primary source of truth, defaults are fallback
// Deduplicates by repo URL to avoid showing same marketplace twice
export function getAllMarketplaces(
  localMarketplaces?: Map<string, LocalMarketplace>
): Marketplace[] {
  const all = new Map<string, Marketplace>();
  const seenRepos = new Set<string>();

  // Primary source: local cache (what's actually cloned)
  if (localMarketplaces) {
    for (const [name, local] of localMarketplaces) {
      const repo = local.gitRepo || '';
      if (repo) seenRepos.add(repo.toLowerCase());

      all.set(name, {
        name,
        displayName: local.name || formatMarketplaceName(name),
        source: { source: 'github' as const, repo },
        description: local.description || '',
        official: repo.toLowerCase().includes('anthropics/'),
      });
    }
  }

  // Fallback: hardcoded defaults (only if their repo isn't already represented)
  for (const mp of defaultMarketplaces) {
    const repo = mp.source.repo?.toLowerCase() || '';
    if (!all.has(mp.name) && !seenRepos.has(repo)) {
      all.set(mp.name, mp);
      if (repo) seenRepos.add(repo);
    }
  }

  return Array.from(all.values());
}

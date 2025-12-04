import type { Marketplace } from '../types/index.js';

export const defaultMarketplaces: Marketplace[] = [
  {
    name: 'anthropic-plugins',
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

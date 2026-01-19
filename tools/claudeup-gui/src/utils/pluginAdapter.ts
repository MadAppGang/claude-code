import { Plugin as BackendPlugin } from '../hooks/usePlugins';
import { Plugin as FrontendPlugin } from '../types';

/**
 * Get display name for marketplace ID
 */
export function getMarketplaceName(id: string): string {
  const knownMarketplaces: Record<string, string> = {
    'mag-claude-plugins': 'MAG Claude Plugins',
    'community': 'Community Registry',
    'official': 'Official Plugins',
  };
  return knownMarketplaces[id] || id;
}

/**
 * Transforms backend plugin data to frontend format
 */
export function adaptPluginFromBackend(
  backendPlugin: BackendPlugin
): FrontendPlugin {
  // Debug: log raw backend data
  if (backendPlugin.name === 'dev' || backendPlugin.name === 'code-analysis') {
    console.log('[adaptPluginFromBackend] Sample plugin:', backendPlugin.name, {
      hasAgents: !!(backendPlugin as any).agents?.length,
      agents: (backendPlugin as any).agents?.slice(0, 3),
      hasCommands: !!(backendPlugin as any).commands?.length,
      hasSkills: !!(backendPlugin as any).skills?.length,
    });
  }

  // The backend now provides per-scope status directly
  const userScope = (backendPlugin as any).userScope || null;
  const projectScope = (backendPlugin as any).projectScope || null;
  const localScope = (backendPlugin as any).localScope || null;

  // Transform backend component data to Capability objects
  // Backend may return either strings (old format) or ComponentMeta objects (new format)
  const mapToCapabilities = (items?: unknown[]): { name: string; description?: string; allowedTools?: string[]; disableModelInvocation?: boolean }[] => {
    if (!items) return [];
    return items.map(item => {
      if (typeof item === 'string') {
        // Old format: just the name
        return { name: item };
      }
      // New format: ComponentMeta object
      const meta = item as Record<string, unknown>;
      return {
        name: meta.name as string,
        description: meta.description as string | undefined,
        allowedTools: meta.allowedTools as string[] | undefined,
        disableModelInvocation: meta.disableModelInvocation as boolean | undefined,
      };
    });
  };

  return {
    // Core fields (direct mapping)
    id: backendPlugin.id,
    name: backendPlugin.name,
    version: backendPlugin.version,
    description: backendPlugin.description,
    enabled: backendPlugin.enabled,
    marketplace: backendPlugin.marketplace,

    // Computed fields
    marketplaceDisplay: getMarketplaceName(backendPlugin.marketplace),
    installedVersion: backendPlugin.version,
    hasUpdate: (backendPlugin as any).hasUpdate || false,

    // Metadata from backend
    category: (backendPlugin as any).category || 'development',
    author: (backendPlugin as any).author,
    homepage: (backendPlugin as any).homepage,
    license: (backendPlugin as any).license,
    keywords: (backendPlugin as any).tags || [],

    // Per-scope status from backend
    userScope,
    projectScope,
    localScope,

    // Components from backend (transform string arrays to Capability objects)
    agents: mapToCapabilities((backendPlugin as any).agents),
    commands: mapToCapabilities((backendPlugin as any).commands),
    skills: mapToCapabilities((backendPlugin as any).skills),
    mcpServers: (backendPlugin as any).mcpServers || [],
    hooks: undefined,
  };
}

/**
 * Transforms multiple backend plugins to frontend format
 */
export function adaptPluginsFromBackend(
  backendPlugins: BackendPlugin[]
): FrontendPlugin[] {
  return backendPlugins.map(adaptPluginFromBackend);
}

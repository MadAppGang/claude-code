export type Scope = 'global' | 'project' | 'local';

export interface ScopeStatus {
  enabled: boolean;
  version?: string;
}

export interface Installation {
  pluginId: string;
  scope: Scope;
  installedVersion: string;
}

export interface Author {
  name: string;
  email?: string;
  company?: string;
}

export interface Capability {
  name: string;
  description?: string;
  allowedTools?: string[];
  disableModelInvocation?: boolean;
  // Additional frontmatter fields
  [key: string]: unknown;
}

export interface Plugin {
  // Core Identification
  id: string;                    // "plugin-name@marketplace"
  name: string;                  // "plugin-name"
  version: string | null;        // "1.2.3" (Current Catalog Version)
  description: string;           // Full description text

  // Marketplace info
  marketplace: string;           // "marketplace-id"
  marketplaceDisplay: string;    // "Marketplace Name"

  // Overall Status
  enabled: boolean;              // Current aggregated state
  installedVersion?: string;     // Currently installed version (if any)
  hasUpdate?: boolean;           // Update available

  // Per-scope status
  userScope?: ScopeStatus | null;       // Global scope
  projectScope?: ScopeStatus | null;    // Project scope
  localScope?: ScopeStatus | null;      // Local dev scope

  // Metadata
  category: 'development' | 'media' | 'workflow' | 'content' | string;
  author?: Author;
  homepage?: string;             // URL
  license?: string;              // "MIT"
  keywords?: string[];           // ["keyword1", "keyword2"]

  // Components
  agents?: Capability[];             // Agent names and descriptions
  commands?: Capability[];           // Command names and descriptions
  skills?: Capability[];             // Skill names and descriptions
  mcpServers?: string[];         // MCP server names
  hooks?: string;                // Hooks config path
}

export interface Project {
  id: string;
  name: string;
  path: string;
  lastOpened: string;
}

export interface Marketplace {
  id: string;
  name: string;
  count: string;
  icon: string;
}

export interface AppState {
  activeMarketplace: string;
  activeProjectId: string;
  searchQuery: string;
  selectedPluginId: string | null;
}

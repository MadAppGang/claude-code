export interface McpServer {
	name: string;
	description: string;
	// Command-based MCP server
	command?: string;
	args?: string[];
	env?: Record<string, string>;
	// HTTP-based MCP server
	type?: "http";
	url?: string;
	// Common fields
	category:
		| "browser"
		| "ai"
		| "design"
		| "dev-tools"
		| "cloud"
		| "database"
		| "productivity"
		| "seo";
	requiresConfig?: boolean;
	configFields?: ConfigField[];
}

export interface ConfigField {
	name: string;
	label: string;
	type: "string" | "path" | "url" | "boolean";
	required: boolean;
	default?: string;
	envVar?: string;
}

export interface Marketplace {
	name: string;
	displayName: string;
	source: {
		source: "github";
		repo: string;
	};
	description: string;
	official?: boolean;
	featured?: boolean; // Featured marketplaces have plugins fetched by default (like official)
}

export interface DiscoveredMarketplace {
	name: string;
	source: "default" | "configured" | "inferred";
	config?: MarketplaceSource;
}

export interface Plugin {
	name: string;
	version: string;
	description: string;
	marketplace: string;
	installed: boolean;
	availableVersion?: string;
	hasUpdate?: boolean;
}

export interface StatusLineConfig {
	name: string;
	description: string;
	template: string;
}

export interface MarketplaceSource {
	source: {
		source: "github";
		repo: string;
	};
	autoUpdate?: boolean; // Enable auto-update for this marketplace (default: true for new marketplaces)
}

export interface ClaudeSettings {
	enabledMcpServers?: Record<string, boolean>;
	mcpServers?: Record<string, McpServerConfig>;
	enabledPlugins?: Record<string, boolean>;
	extraKnownMarketplaces?: Record<string, MarketplaceSource>;
	installedPluginVersions?: Record<string, string>;
	statusLine?: string;
}

export interface McpServerConfig {
	// Command-based
	command?: string;
	args?: string[];
	env?: Record<string, string>;
	// HTTP-based
	type?: "http";
	url?: string;
}

export interface ClaudeLocalSettings extends ClaudeSettings {
	allowMcp?: boolean;
	enabledMcpjsonServers?: string[];
	enableAllProjectMcpServers?: boolean;
	env?: Record<string, string>;
}

export type Screen =
	| "main"
	| "mcp"
	| "mcp-registry"
	| "plugins"
	| "statusline"
	| "cli-tools"
	| "env-vars";

// MCP Registry Types (registry.modelcontextprotocol.io)
export interface McpRegistryServer {
	name: string;
	url: string;
	short_description: string;
	version?: string;
	source_code_url?: string;
	package_registry?: string;
	published_at?: string;
}

export interface McpRegistryResponse {
	servers: McpRegistryServer[];
	next_cursor?: string;
}

// installed_plugins.json registry types
export interface InstalledPluginEntry {
	scope: "user" | "project" | "local";
	projectPath?: string;
	installPath: string;
	version: string;
	installedAt: string;
	lastUpdated: string;
	gitCommitSha?: string;
}

export interface InstalledPluginsRegistry {
	version: number;
	plugins: Record<string, InstalledPluginEntry[]>;
}

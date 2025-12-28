import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';

const CLAUDE_PLUGINS_DIR = path.join(os.homedir(), '.claude', 'plugins', 'marketplaces');

/**
 * Represents a required environment variable for a plugin's MCP server
 */
export interface PluginEnvRequirement {
  /** The environment variable name (e.g., "FIGMA_ACCESS_TOKEN") */
  name: string;
  /** User-friendly label (defaults to name if not provided) */
  label: string;
  /** The MCP server name this env var is for */
  serverName: string;
  /** Whether this env var is required (all detected vars are considered required) */
  required: boolean;
}

/**
 * Extract ${VAR_NAME} patterns from a value
 * @param value - The value to search for env var references
 * @returns Array of env var names found
 */
function extractEnvVarReferences(value: unknown): string[] {
  if (typeof value !== 'string') return [];

  const matches = value.match(/\$\{([A-Z_][A-Z0-9_]*)\}/g);
  if (!matches) return [];

  return matches.map(match => {
    // Extract VAR_NAME from ${VAR_NAME}
    const innerMatch = match.match(/\$\{([A-Z_][A-Z0-9_]*)\}/);
    return innerMatch ? innerMatch[1] : '';
  }).filter(Boolean);
}

/**
 * Recursively extract all env var references from an object
 */
function extractAllEnvVarReferences(obj: unknown): string[] {
  const vars: string[] = [];

  if (typeof obj === 'string') {
    vars.push(...extractEnvVarReferences(obj));
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      vars.push(...extractAllEnvVarReferences(item));
    }
  } else if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      vars.push(...extractAllEnvVarReferences(value));
    }
  }

  return vars;
}

interface McpServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  type?: 'http';
  url?: string;
}

/**
 * Get the path to a plugin's mcp-config.json in the marketplace cache
 * @param marketplaceName - Name of the marketplace (e.g., "mag-claude-plugins")
 * @param pluginSource - Plugin source path from marketplace.json (e.g., "./plugins/frontend")
 * @returns Full path to mcp-config.json or undefined if not found
 */
function getPluginMcpConfigPath(
  marketplaceName: string,
  pluginSource?: string
): string | undefined {
  if (!pluginSource) return undefined;

  const marketplacePath = path.join(CLAUDE_PLUGINS_DIR, marketplaceName);
  const pluginPath = path.join(marketplacePath, pluginSource.replace(/^\.\//, ''));
  const mcpConfigPath = path.join(pluginPath, 'mcp-servers', 'mcp-config.json');

  return mcpConfigPath;
}

/**
 * Read and parse a plugin's MCP configuration
 * @param marketplaceName - Name of the marketplace
 * @param pluginSource - Plugin source path from marketplace.json
 * @returns Parsed MCP config or empty object if not found
 */
export async function readPluginMcpConfig(
  marketplaceName: string,
  pluginSource?: string
): Promise<Record<string, McpServerConfig>> {
  const configPath = getPluginMcpConfigPath(marketplaceName, pluginSource);
  if (!configPath) return {};

  try {
    if (await fs.pathExists(configPath)) {
      const content = await fs.readJson(configPath);
      // Filter out comment fields (keys starting with _)
      const filtered: Record<string, McpServerConfig> = {};
      for (const [key, value] of Object.entries(content)) {
        if (!key.startsWith('_') && value && typeof value === 'object') {
          filtered[key] = value as McpServerConfig;
        }
      }
      return filtered;
    }
  } catch (error) {
    console.error(`Failed to read plugin MCP config: ${error}`);
  }

  return {};
}

/**
 * Generate user-friendly label from env var name
 * @param varName - Environment variable name (e.g., "FIGMA_ACCESS_TOKEN")
 * @returns Human-readable label (e.g., "Figma Access Token")
 */
function generateLabel(varName: string): string {
  return varName
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get all environment variable requirements for a plugin
 * Extracts ${VAR_NAME} patterns from the plugin's mcp-config.json
 *
 * @param marketplaceName - Name of the marketplace (e.g., "mag-claude-plugins")
 * @param pluginSource - Plugin source path from marketplace.json (e.g., "./plugins/frontend")
 * @returns Array of required env vars with metadata
 */
export async function getPluginEnvRequirements(
  marketplaceName: string,
  pluginSource?: string
): Promise<PluginEnvRequirement[]> {
  const mcpConfig = await readPluginMcpConfig(marketplaceName, pluginSource);
  const requirements: PluginEnvRequirement[] = [];
  const seenVars = new Set<string>();

  for (const [serverName, config] of Object.entries(mcpConfig)) {
    // Extract from env object
    if (config.env) {
      for (const value of Object.values(config.env)) {
        const vars = extractEnvVarReferences(value);
        for (const varName of vars) {
          if (!seenVars.has(varName)) {
            seenVars.add(varName);
            requirements.push({
              name: varName,
              label: generateLabel(varName),
              serverName,
              required: true,
            });
          }
        }
      }
    }

    // Also check args array for env var references (e.g., sqlite with ${DATABASE_PATH})
    if (config.args) {
      const argsVars = extractAllEnvVarReferences(config.args);
      for (const varName of argsVars) {
        if (!seenVars.has(varName)) {
          seenVars.add(varName);
          requirements.push({
            name: varName,
            label: generateLabel(varName),
            serverName,
            required: true,
          });
        }
      }
    }
  }

  return requirements;
}

/**
 * Get plugin source path from local marketplace cache
 * @param marketplaceName - Name of the marketplace
 * @param pluginName - Name of the plugin
 * @returns Plugin source path or undefined
 */
export async function getPluginSourcePath(
  marketplaceName: string,
  pluginName: string
): Promise<string | undefined> {
  const marketplacePath = path.join(CLAUDE_PLUGINS_DIR, marketplaceName);
  const manifestPath = path.join(marketplacePath, '.claude-plugin', 'marketplace.json');

  try {
    if (await fs.pathExists(manifestPath)) {
      const manifest = await fs.readJson(manifestPath);
      if (manifest.plugins && Array.isArray(manifest.plugins)) {
        const plugin = manifest.plugins.find(
          (p: { name: string }) => p.name === pluginName
        );
        return plugin?.source;
      }
    }
  } catch {
    // Return undefined if can't read
  }

  return undefined;
}

/**
 * Get all MCP server names from a plugin's config
 * @param marketplaceName - Name of the marketplace
 * @param pluginSource - Plugin source path
 * @returns Array of MCP server names
 */
export async function getPluginMcpServerNames(
  marketplaceName: string,
  pluginSource?: string
): Promise<string[]> {
  const mcpConfig = await readPluginMcpConfig(marketplaceName, pluginSource);
  return Object.keys(mcpConfig);
}

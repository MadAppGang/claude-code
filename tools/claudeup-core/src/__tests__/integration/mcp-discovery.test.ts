/**
 * Integration tests for MCP server discovery
 *
 * Tests cover:
 * - MCP config file discovery
 * - Config merging from multiple plugins
 * - Environment variable handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createIsolatedEnv, type IsolatedEnv } from '../utils/isolated-env.js';
import { validateMcpConfig } from '../utils/parsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..');
const PLUGINS_DIR = join(REPO_ROOT, 'plugins');

interface McpServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

describe('mcp-discovery integration', () => {
  let env: IsolatedEnv;

  afterEach(async () => {
    if (env) {
      await env.cleanup();
    }
  });

  describe('real plugin MCP config discovery', () => {
    it('should find all MCP config files in plugins', async () => {
      const entries = await readdir(PLUGINS_DIR, { withFileTypes: true });
      const pluginDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

      const mcpConfigs: Array<{ plugin: string; path: string }> = [];

      for (const pluginName of pluginDirs) {
        const pluginJsonPath = join(PLUGINS_DIR, pluginName, 'plugin.json');

        if (!existsSync(pluginJsonPath)) {
          continue;
        }

        const content = await readFile(pluginJsonPath, 'utf-8');
        const pluginJson = JSON.parse(content);

        if (pluginJson.mcpServers) {
          const mcpPath = join(PLUGINS_DIR, pluginName, pluginJson.mcpServers);
          if (existsSync(mcpPath)) {
            mcpConfigs.push({ plugin: pluginName, path: mcpPath });
          }
        }
      }

      // Should find at least some MCP configs
      expect(mcpConfigs.length).toBeGreaterThan(0);
    });

    it('should validate all discovered MCP configs', async () => {
      const entries = await readdir(PLUGINS_DIR, { withFileTypes: true });
      const pluginDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

      const results: Array<{ plugin: string; valid: boolean; errors?: string[] }> = [];

      for (const pluginName of pluginDirs) {
        const pluginJsonPath = join(PLUGINS_DIR, pluginName, 'plugin.json');

        if (!existsSync(pluginJsonPath)) {
          continue;
        }

        const pluginContent = await readFile(pluginJsonPath, 'utf-8');
        const pluginJson = JSON.parse(pluginContent);

        if (!pluginJson.mcpServers) {
          continue;
        }

        const mcpPath = join(PLUGINS_DIR, pluginName, pluginJson.mcpServers);
        if (!existsSync(mcpPath)) {
          results.push({
            plugin: pluginName,
            valid: false,
            errors: [`MCP config file not found: ${pluginJson.mcpServers}`],
          });
          continue;
        }

        const mcpContent = await readFile(mcpPath, 'utf-8');
        const mcpConfig = JSON.parse(mcpContent);
        const result = validateMcpConfig(mcpConfig);

        results.push({
          plugin: pluginName,
          valid: result.valid,
          errors: result.valid ? undefined : result.errors,
        });
      }

      // All configs should be valid
      for (const result of results) {
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('MCP config merging', () => {
    beforeEach(async () => {
      env = await createIsolatedEnv();
    });

    it('should merge MCP configs from multiple plugins', async () => {
      // Simulate two plugin MCP configs
      const plugin1Config: Record<string, McpServerConfig> = {
        'plugin1-server': {
          command: 'npx',
          args: ['-y', '@plugin1/mcp-server'],
          env: { API_KEY: '${PLUGIN1_API_KEY}' },
        },
      };

      const plugin2Config: Record<string, McpServerConfig> = {
        'plugin2-server': {
          command: 'npx',
          args: ['-y', '@plugin2/mcp-server'],
        },
        'shared-server': {
          url: 'http://localhost:3000',
        },
      };

      // Merge configs
      const mergedConfig: Record<string, McpServerConfig> = {
        ...plugin1Config,
        ...plugin2Config,
      };

      expect(Object.keys(mergedConfig)).toHaveLength(3);
      expect(mergedConfig['plugin1-server']).toBeDefined();
      expect(mergedConfig['plugin2-server']).toBeDefined();
      expect(mergedConfig['shared-server']).toBeDefined();
    });

    it('should handle server name conflicts during merge', () => {
      const plugin1Config: Record<string, McpServerConfig> = {
        'common-server': {
          command: 'plugin1-cmd',
        },
      };

      const plugin2Config: Record<string, McpServerConfig> = {
        'common-server': {
          command: 'plugin2-cmd',
        },
      };

      // Later plugin wins (simple merge strategy)
      const mergedConfig = {
        ...plugin1Config,
        ...plugin2Config,
      };

      expect(mergedConfig['common-server'].command).toBe('plugin2-cmd');
    });

    it('should preserve unique servers during merge', () => {
      const configs: Array<Record<string, McpServerConfig>> = [
        { 'server-a': { command: 'cmd-a' } },
        { 'server-b': { command: 'cmd-b' } },
        { 'server-c': { command: 'cmd-c' } },
      ];

      const merged = configs.reduce((acc, config) => ({ ...acc, ...config }), {});

      expect(Object.keys(merged)).toHaveLength(3);
    });
  });

  describe('environment variable handling', () => {
    it('should identify environment variables in MCP config', async () => {
      const config: Record<string, McpServerConfig> = {
        'env-server': {
          command: 'npx',
          args: ['-y', '@test/mcp-server'],
          env: {
            API_KEY: '${API_KEY}',
            PROJECT_ID: '${PROJECT_ID}',
            ENDPOINT: '${CUSTOM_ENDPOINT}',
          },
        },
      };

      const envVars = config['env-server'].env;
      expect(envVars).toBeDefined();

      const varPattern = /^\$\{(\w+)\}$/;
      const extractedVars: string[] = [];

      for (const [_key, value] of Object.entries(envVars!)) {
        const match = value.match(varPattern);
        if (match) {
          extractedVars.push(match[1]);
        }
      }

      expect(extractedVars).toContain('API_KEY');
      expect(extractedVars).toContain('PROJECT_ID');
      expect(extractedVars).toContain('CUSTOM_ENDPOINT');
    });

    it('should handle CLAUDE_PLUGIN_ROOT variable', async () => {
      const config: Record<string, McpServerConfig> = {
        'local-server': {
          command: 'node',
          args: ['${CLAUDE_PLUGIN_ROOT}/mcp-server/index.js'],
        },
      };

      const pluginRoot = '/Users/test/.claude/plugins/test-plugin';
      const args = config['local-server'].args!.map((arg) =>
        arg.replace('${CLAUDE_PLUGIN_ROOT}', pluginRoot),
      );

      expect(args[0]).toBe(`${pluginRoot}/mcp-server/index.js`);
    });

    it('should resolve environment variables for runtime', () => {
      const template: Record<string, string> = {
        API_KEY: '${API_KEY}',
        PROJECT_ID: '${PROJECT_ID}',
      };

      const envValues: Record<string, string> = {
        API_KEY: 'secret-key-123',
        PROJECT_ID: 'proj-456',
      };

      const resolved: Record<string, string> = {};

      for (const [key, template_] of Object.entries(template)) {
        const varMatch = template_.match(/^\$\{(\w+)\}$/);
        if (varMatch) {
          const envVarName = varMatch[1];
          resolved[key] = envValues[envVarName] || '';
        } else {
          resolved[key] = template_;
        }
      }

      expect(resolved.API_KEY).toBe('secret-key-123');
      expect(resolved.PROJECT_ID).toBe('proj-456');
    });
  });

  describe('MCP server types', () => {
    it('should identify stdio-based servers', () => {
      const config: McpServerConfig = {
        command: 'npx',
        args: ['-y', '@test/mcp-server'],
      };

      const isStdio = config.command !== undefined;
      const isHttp = config.url !== undefined;

      expect(isStdio).toBe(true);
      expect(isHttp).toBe(false);
    });

    it('should identify HTTP-based servers', () => {
      const config: McpServerConfig = {
        url: 'http://localhost:3000/mcp',
      };

      const isStdio = config.command !== undefined;
      const isHttp = config.url !== undefined;

      expect(isStdio).toBe(false);
      expect(isHttp).toBe(true);
    });

    it('should handle hybrid server config', () => {
      // Some servers might have both for fallback
      const config: McpServerConfig = {
        command: 'npx',
        args: ['-y', '@test/mcp-server'],
        url: 'http://fallback:3000',
      };

      // Prefer command if both present
      const connectionType = config.command ? 'stdio' : 'http';
      expect(connectionType).toBe('stdio');
    });
  });

  describe('real-world MCP config examples', () => {
    it('should validate frontend plugin MCP config pattern', async () => {
      const frontendMcpPath = join(PLUGINS_DIR, 'frontend', 'mcp-servers', 'mcp-config.json');

      if (!existsSync(frontendMcpPath)) {
        return; // Skip if frontend plugin not present
      }

      const content = await readFile(frontendMcpPath, 'utf-8');
      const config = JSON.parse(content);

      const result = validateMcpConfig(config);
      expect(result.valid).toBe(true);

      // Check expected servers
      if (result.valid) {
        // Frontend typically has apidog, figma, chrome-devtools
        const serverNames = Object.keys(result.data);
        expect(serverNames.length).toBeGreaterThan(0);
      }
    });
  });
});

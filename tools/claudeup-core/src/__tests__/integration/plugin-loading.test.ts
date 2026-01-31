/**
 * Integration tests for plugin discovery and loading
 *
 * Tests cover:
 * - Full plugin discovery flow
 * - Component loading from valid plugins
 * - Error handling for invalid plugins
 */

import { describe, it, expect, afterEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  createIsolatedEnv,
  createEnvWithValidPlugin,
  type IsolatedEnv,
} from '../utils/isolated-env.js';
import {
  getValidPluginPath,
  loadPluginJson,
  loadHooksJson,
  loadMcpConfig,
  listMarkdownFiles,
  listSkillDirs,
} from '../utils/fixture-loader.js';
import {
  validatePluginManifest,
  parseFrontmatter,
  validateAgentFrontmatter,
  validateCommandFrontmatter,
  validateSkillFrontmatter,
  validateHooksConfig,
  validateMcpConfig,
} from '../utils/parsers.js';

describe('plugin-loading integration', () => {
  let env: IsolatedEnv;

  afterEach(async () => {
    if (env) {
      await env.cleanup();
    }
  });

  describe('valid plugin discovery', () => {
    it('should discover and load valid plugin manifest', async () => {
      const pluginPath = getValidPluginPath();

      // Step 1: Load and validate plugin.json
      const manifest = await loadPluginJson(pluginPath);
      const manifestResult = validatePluginManifest(manifest);

      expect(manifestResult.valid).toBe(true);
      if (manifestResult.valid) {
        expect(manifestResult.data.name).toBe('test-plugin');
        expect(manifestResult.data.version).toBe('1.0.0');
      }
    });

    it('should load all agents from valid plugin', async () => {
      const pluginPath = getValidPluginPath();
      const manifest = await loadPluginJson(pluginPath);

      if (!manifest.agents) {
        return;
      }

      for (const agentRelPath of manifest.agents) {
        const agentPath = join(pluginPath, agentRelPath);
        expect(existsSync(agentPath)).toBe(true);

        const content = await readFile(agentPath, 'utf-8');
        const parsed = parseFrontmatter(content);

        expect(parsed).not.toBeNull();
        if (parsed) {
          const result = validateAgentFrontmatter(parsed.frontmatter);
          expect(result.valid).toBe(true);
        }
      }
    });

    it('should load all commands from valid plugin', async () => {
      const pluginPath = getValidPluginPath();
      const manifest = await loadPluginJson(pluginPath);

      if (!manifest.commands) {
        return;
      }

      for (const cmdRelPath of manifest.commands) {
        const cmdPath = join(pluginPath, cmdRelPath);
        expect(existsSync(cmdPath)).toBe(true);

        const content = await readFile(cmdPath, 'utf-8');
        const parsed = parseFrontmatter(content);

        expect(parsed).not.toBeNull();
        if (parsed) {
          const result = validateCommandFrontmatter(parsed.frontmatter);
          expect(result.valid).toBe(true);
        }
      }
    });

    it('should load all skills from valid plugin', async () => {
      const pluginPath = getValidPluginPath();
      const manifest = await loadPluginJson(pluginPath);

      if (!manifest.skills) {
        return;
      }

      for (const skillRelPath of manifest.skills) {
        const skillDir = join(pluginPath, skillRelPath);
        const skillMdPath = join(skillDir, 'SKILL.md');

        expect(existsSync(skillMdPath)).toBe(true);

        const content = await readFile(skillMdPath, 'utf-8');
        const parsed = parseFrontmatter(content);

        expect(parsed).not.toBeNull();
        if (parsed) {
          const result = validateSkillFrontmatter(parsed.frontmatter);
          expect(result.valid).toBe(true);
        }
      }
    });

    it('should load hooks config from valid plugin', async () => {
      const pluginPath = getValidPluginPath();
      const hooksConfig = await loadHooksJson(pluginPath);

      if (hooksConfig) {
        const result = validateHooksConfig(hooksConfig);
        expect(result.valid).toBe(true);
      }
    });

    it('should load MCP config from valid plugin', async () => {
      const pluginPath = getValidPluginPath();
      const mcpConfig = await loadMcpConfig(pluginPath);

      if (mcpConfig) {
        const result = validateMcpConfig(mcpConfig);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('full plugin validation workflow', () => {
    it('should validate complete plugin structure', async () => {
      const pluginPath = getValidPluginPath();
      const errors: string[] = [];

      // 1. Validate plugin.json
      const manifest = await loadPluginJson(pluginPath);
      const manifestResult = validatePluginManifest(manifest);

      if (!manifestResult.valid) {
        errors.push(...manifestResult.errors);
      }

      // 2. Validate all agents
      if (manifest.agents) {
        for (const agentRelPath of manifest.agents) {
          const agentPath = join(pluginPath, agentRelPath);

          if (!existsSync(agentPath)) {
            errors.push(`Agent file not found: ${agentRelPath}`);
            continue;
          }

          const content = await readFile(agentPath, 'utf-8');
          const parsed = parseFrontmatter(content);

          if (!parsed) {
            errors.push(`Agent missing frontmatter: ${agentRelPath}`);
            continue;
          }

          const result = validateAgentFrontmatter(parsed.frontmatter);
          if (!result.valid) {
            errors.push(...result.errors.map((e) => `${agentRelPath}: ${e}`));
          }
        }
      }

      // 3. Validate all commands
      if (manifest.commands) {
        for (const cmdRelPath of manifest.commands) {
          const cmdPath = join(pluginPath, cmdRelPath);

          if (!existsSync(cmdPath)) {
            errors.push(`Command file not found: ${cmdRelPath}`);
            continue;
          }

          const content = await readFile(cmdPath, 'utf-8');
          const parsed = parseFrontmatter(content);

          if (!parsed) {
            errors.push(`Command missing frontmatter: ${cmdRelPath}`);
            continue;
          }

          const result = validateCommandFrontmatter(parsed.frontmatter);
          if (!result.valid) {
            errors.push(...result.errors.map((e) => `${cmdRelPath}: ${e}`));
          }
        }
      }

      // 4. Validate all skills
      if (manifest.skills) {
        for (const skillRelPath of manifest.skills) {
          const skillDir = join(pluginPath, skillRelPath);
          const skillMdPath = join(skillDir, 'SKILL.md');

          if (!existsSync(skillMdPath)) {
            errors.push(`Skill SKILL.md not found: ${skillRelPath}`);
            continue;
          }

          const content = await readFile(skillMdPath, 'utf-8');
          const parsed = parseFrontmatter(content);

          if (!parsed) {
            errors.push(`Skill missing frontmatter: ${skillRelPath}`);
            continue;
          }

          const result = validateSkillFrontmatter(parsed.frontmatter);
          if (!result.valid) {
            errors.push(...result.errors.map((e) => `${skillRelPath}: ${e}`));
          }
        }
      }

      // 5. Validate hooks if present
      if (manifest.hooks) {
        const hooksPath = join(pluginPath, manifest.hooks);

        if (!existsSync(hooksPath)) {
          errors.push(`Hooks file not found: ${manifest.hooks}`);
        } else {
          const content = await readFile(hooksPath, 'utf-8');
          const config = JSON.parse(content);
          const result = validateHooksConfig(config);

          if (!result.valid) {
            errors.push(...result.errors.map((e) => `hooks.json: ${e}`));
          }
        }
      }

      // 6. Validate MCP servers if present
      if (manifest.mcpServers) {
        const mcpPath = join(pluginPath, manifest.mcpServers);

        if (!existsSync(mcpPath)) {
          errors.push(`MCP config file not found: ${manifest.mcpServers}`);
        } else {
          const content = await readFile(mcpPath, 'utf-8');
          const config = JSON.parse(content);
          const result = validateMcpConfig(config);

          if (!result.valid) {
            errors.push(...result.errors.map((e) => `mcp-config.json: ${e}`));
          }
        }
      }

      // Final assertion
      expect(errors).toEqual([]);
    });
  });

  describe('plugin loading in isolated environment', () => {
    it('should copy and load plugin in isolated env', async () => {
      const envWithPlugin = await createEnvWithValidPlugin();
      env = envWithPlugin;

      const manifest = await loadPluginJson(envWithPlugin.pluginPath);
      expect(manifest.name).toBe('test-plugin');
    });

    it('should handle plugin with settings', async () => {
      env = await createIsolatedEnv();

      // Set up settings
      await env.writeJson('.claude/settings.json', {
        enabledPlugins: {
          'test-plugin@test-marketplace': true,
        },
        installedPluginVersions: {
          'test-plugin@test-marketplace': '1.0.0',
        },
      });

      // Read back settings
      const settingsPath = join(env.rootDir, '.claude/settings.json');
      const content = await readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);

      expect(settings.enabledPlugins['test-plugin@test-marketplace']).toBe(true);
      expect(settings.installedPluginVersions['test-plugin@test-marketplace']).toBe('1.0.0');
    });
  });

  describe('component discovery patterns', () => {
    it('should discover agents by directory listing', async () => {
      const pluginPath = getValidPluginPath();
      const agentsDir = join(pluginPath, 'agents');

      const files = await listMarkdownFiles(agentsDir);
      expect(files.length).toBeGreaterThan(0);

      for (const file of files) {
        expect(file.endsWith('.md')).toBe(true);
      }
    });

    it('should discover skills by SKILL.md presence', async () => {
      const pluginPath = getValidPluginPath();
      const skillDirs = await listSkillDirs(pluginPath);

      expect(skillDirs.length).toBeGreaterThan(0);

      for (const skillDir of skillDirs) {
        const skillMdPath = join(skillDir, 'SKILL.md');
        expect(existsSync(skillMdPath)).toBe(true);
      }
    });

    it('should match manifest components with discovered files', async () => {
      const pluginPath = getValidPluginPath();
      const manifest = await loadPluginJson(pluginPath);

      // Check agents
      if (manifest.agents) {
        const agentFiles = await listMarkdownFiles(join(pluginPath, 'agents'));
        expect(manifest.agents.length).toBeLessThanOrEqual(agentFiles.length);
      }

      // Check skills
      if (manifest.skills) {
        const skillDirs = await listSkillDirs(pluginPath);
        expect(manifest.skills.length).toBeLessThanOrEqual(skillDirs.length);
      }
    });
  });
});

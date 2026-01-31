/**
 * Test fixture loader utilities
 *
 * Provides easy access to test fixtures for unit and integration tests.
 * Fixtures represent real plugin structures for validation testing.
 */

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base path for fixtures
export const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

/**
 * Get path to a valid plugin fixture
 */
export function getValidPluginPath(): string {
  return join(FIXTURES_DIR, 'valid-plugin');
}

/**
 * Get path to an invalid plugin fixture
 * @param type - Type of invalid fixture ('missing-version', 'invalid-agents', 'bad-frontmatter')
 */
export function getInvalidPluginPath(
  type: 'missing-version' | 'invalid-agents' | 'bad-frontmatter',
): string {
  return join(FIXTURES_DIR, 'invalid-plugin', type);
}

/**
 * Get all fixture paths for a specific category
 */
export async function getFixturePaths(category: 'valid-plugin' | 'invalid-plugin'): Promise<string[]> {
  const basePath = join(FIXTURES_DIR, category);
  if (!existsSync(basePath)) {
    return [];
  }

  const entries = await readdir(basePath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(basePath, entry.name));
}

/**
 * Load a JSON fixture file
 */
export async function loadJsonFixture<T = unknown>(relativePath: string): Promise<T> {
  const fullPath = join(FIXTURES_DIR, relativePath);
  const content = await readFile(fullPath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Load a markdown fixture file (raw content)
 */
export async function loadMarkdownFixture(relativePath: string): Promise<string> {
  const fullPath = join(FIXTURES_DIR, relativePath);
  return readFile(fullPath, 'utf-8');
}

/**
 * Check if a fixture exists
 */
export function fixtureExists(relativePath: string): boolean {
  return existsSync(join(FIXTURES_DIR, relativePath));
}

/**
 * Get the plugin.json from a fixture plugin
 */
export async function loadPluginJson(pluginPath: string): Promise<PluginManifest> {
  const content = await readFile(join(pluginPath, 'plugin.json'), 'utf-8');
  return JSON.parse(content) as PluginManifest;
}

/**
 * Get hooks.json from a fixture plugin (if exists)
 */
export async function loadHooksJson(pluginPath: string): Promise<HooksConfig | null> {
  const hooksPath = join(pluginPath, 'hooks', 'hooks.json');
  if (!existsSync(hooksPath)) {
    return null;
  }
  const content = await readFile(hooksPath, 'utf-8');
  return JSON.parse(content) as HooksConfig;
}

/**
 * Get mcp-config.json from a fixture plugin (if exists)
 */
export async function loadMcpConfig(pluginPath: string): Promise<McpConfig | null> {
  const mcpPath = join(pluginPath, 'mcp-servers', 'mcp-config.json');
  if (!existsSync(mcpPath)) {
    return null;
  }
  const content = await readFile(mcpPath, 'utf-8');
  return JSON.parse(content) as McpConfig;
}

/**
 * List all markdown files in a directory
 */
export async function listMarkdownFiles(dirPath: string): Promise<string[]> {
  if (!existsSync(dirPath)) {
    return [];
  }

  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => join(dirPath, e.name));
}

/**
 * List all skill directories (containing SKILL.md)
 */
export async function listSkillDirs(pluginPath: string): Promise<string[]> {
  const skillsDir = join(pluginPath, 'skills');
  if (!existsSync(skillsDir)) {
    return [];
  }

  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skillDirs: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillMdPath = join(skillsDir, entry.name, 'SKILL.md');
      if (existsSync(skillMdPath)) {
        skillDirs.push(join(skillsDir, entry.name));
      }
    }
  }

  return skillDirs;
}

// Types for loaded fixtures

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: {
    name: string;
    email?: string;
    company?: string;
  };
  license?: string;
  keywords?: string[];
  category?: string;
  agents?: string[];
  commands?: string[];
  skills?: string[];
  hooks?: string;
  mcpServers?: string;
  lspServers?: Record<string, unknown>;
}

export interface HooksConfig {
  description?: string;
  hooks: {
    SessionStart?: HookEntry[];
    PreToolUse?: HookEntry[];
    PostToolUse?: HookEntry[];
    Notification?: HookEntry[];
    Stop?: HookEntry[];
  };
}

export interface HookEntry {
  matcher?: string;
  hooks: Hook[];
}

export interface Hook {
  type: 'command';
  command: string;
  timeout?: number;
}

export interface McpConfig {
  [serverName: string]: {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
  };
}

#!/usr/bin/env node
/**
 * Skill Discovery Script for Claude Code
 *
 * Searches all 7 official Claude Code skill locations and outputs JSON.
 *
 * Usage:
 *   node discover-skills.js [project-path]
 *   bun discover-skills.js [project-path]
 *
 * Output: JSON array of discovered skills with metadata
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get project path from args or use cwd
const projectPath = process.argv[2] || process.cwd();
const homeDir = os.homedir();

/**
 * Recursively find all SKILL.md files matching a glob pattern
 */
function findSkillFiles(basePath, pattern = '') {
  const results = [];

  function walkDir(dir, depth = 0) {
    if (depth > 10) return; // Prevent infinite recursion

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip common directories that shouldn't contain skills
        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'vendor'].includes(entry.name)) {
            continue;
          }
          walkDir(fullPath, depth + 1);
        } else if (entry.name === 'SKILL.md') {
          results.push(fullPath);
        } else if (entry.name.endsWith('.md') && dir.includes('.claude/commands')) {
          // Legacy commands support
          results.push(fullPath);
        }
      }
    } catch (err) {
      // Permission denied or other errors - skip silently
    }
  }

  if (fs.existsSync(basePath)) {
    walkDir(basePath);
  }

  return results;
}

/**
 * Parse YAML frontmatter from a markdown file
 */
function parseFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return {};

  const yaml = frontmatterMatch[1];
  const result = {};

  // Simple YAML parsing for common fields
  const lines = yaml.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w[\w-]*)\s*:\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Handle booleans
      if (value === 'true') value = true;
      else if (value === 'false') value = false;

      result[key] = value;
    }
  }

  return result;
}

/**
 * Extract skill info from a SKILL.md file
 */
function extractSkillInfo(filePath, source) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    // Get name from frontmatter or directory name
    let name = frontmatter.name;
    if (!name) {
      const dir = path.dirname(filePath);
      name = path.basename(dir);
      // For legacy commands, use filename without extension
      if (filePath.includes('.claude/commands')) {
        name = path.basename(filePath, '.md');
      }
    }

    // Get description from frontmatter or first paragraph
    let description = frontmatter.description;
    if (!description) {
      const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/, '');
      const firstParagraph = contentWithoutFrontmatter.trim().split('\n\n')[0];
      description = firstParagraph.replace(/^#+\s*/, '').slice(0, 200);
    }

    // Categorize by keywords
    const categories = [];
    const textToCheck = `${name} ${description}`.toLowerCase();

    const categoryKeywords = {
      testing: ['test', 'tdd', 'spec', 'coverage', 'assertion', 'mock'],
      debugging: ['debug', 'trace', 'diagnose', 'log', 'breakpoint', 'error'],
      frontend: ['react', 'vue', 'component', 'ui', 'css', 'style', 'layout', 'tailwind'],
      backend: ['api', 'server', 'endpoint', 'route', 'handler', 'middleware'],
      database: ['sql', 'query', 'migration', 'schema', 'orm', 'repository'],
      workflow: ['pipeline', 'process', 'automation', 'ci', 'cd', 'deploy'],
      documentation: ['doc', 'readme', 'comment', 'jsdoc', 'tsdoc'],
      security: ['auth', 'jwt', 'oauth', 'permission', 'encryption'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => textToCheck.includes(kw))) {
        categories.push(category);
      }
    }

    return {
      name,
      description: description || 'No description',
      path: filePath,
      source,
      categories,
      userInvocable: frontmatter['user-invocable'] !== false,
      modelInvocable: frontmatter['disable-model-invocation'] !== true,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Parse enabledPlugins from .claude/settings.json
 */
function getEnabledPlugins(projectPath) {
  const settingsPath = path.join(projectPath, '.claude', 'settings.json');
  const plugins = [];

  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      const enabledPlugins = settings.enabledPlugins || {};

      for (const [pluginKey, enabled] of Object.entries(enabledPlugins)) {
        if (enabled === true) {
          // Parse "dev@mag-claude-plugins" → { plugin: "dev", marketplace: "mag-claude-plugins" }
          const match = pluginKey.match(/^(.+)@(.+)$/);
          if (match) {
            plugins.push({ plugin: match[1], marketplace: match[2] });
          }
        }
      }
    }
  } catch (err) {
    // Ignore parse errors
  }

  return plugins;
}

/**
 * Main discovery function
 */
function discoverSkills() {
  const skills = [];
  const seen = new Set(); // Dedupe by path

  function addSkills(files, source) {
    for (const file of files) {
      if (seen.has(file)) continue;
      seen.add(file);

      const skill = extractSkillInfo(file, source);
      if (skill) {
        skills.push(skill);
      }
    }
  }

  // 1. Personal skills: ~/.claude/skills/
  const personalPath = path.join(homeDir, '.claude', 'skills');
  addSkills(findSkillFiles(personalPath), 'personal');

  // 2. Project skills: .claude/skills/
  const projectSkillsPath = path.join(projectPath, '.claude', 'skills');
  addSkills(findSkillFiles(projectSkillsPath), 'project');

  // 3. Nested skills (monorepos): **/.claude/skills/
  // Search common monorepo patterns
  const monorepoPatterns = ['packages', 'apps', 'libs', 'modules', 'services'];
  for (const pattern of monorepoPatterns) {
    const packagesDir = path.join(projectPath, pattern);
    if (fs.existsSync(packagesDir)) {
      try {
        const packages = fs.readdirSync(packagesDir, { withFileTypes: true });
        for (const pkg of packages) {
          if (pkg.isDirectory()) {
            const nestedSkillsPath = path.join(packagesDir, pkg.name, '.claude', 'skills');
            addSkills(findSkillFiles(nestedSkillsPath), `nested:${pattern}/${pkg.name}`);
          }
        }
      } catch (err) {}
    }
  }

  // 4. Legacy commands: .claude/commands/
  const legacyCommandsPath = path.join(projectPath, '.claude', 'commands');
  addSkills(findSkillFiles(legacyCommandsPath), 'legacy-command');

  // 5. Marketplace-installed plugins
  const enabledPlugins = getEnabledPlugins(projectPath);
  for (const { plugin, marketplace } of enabledPlugins) {
    const marketplacePath = path.join(
      homeDir, '.claude', 'plugins', 'marketplaces',
      marketplace, 'plugins', plugin, 'skills'
    );
    addSkills(findSkillFiles(marketplacePath), `plugin:${plugin}@${marketplace}`);
  }

  // 6. Local plugins: .claude-plugin/skills/, plugins/*/skills/
  const localPluginPath = path.join(projectPath, '.claude-plugin', 'skills');
  addSkills(findSkillFiles(localPluginPath), 'local-plugin');

  const pluginsDir = path.join(projectPath, 'plugins');
  if (fs.existsSync(pluginsDir)) {
    try {
      const localPlugins = fs.readdirSync(pluginsDir, { withFileTypes: true });
      for (const lp of localPlugins) {
        if (lp.isDirectory()) {
          const lpSkillsPath = path.join(pluginsDir, lp.name, 'skills');
          addSkills(findSkillFiles(lpSkillsPath), `local-plugin:${lp.name}`);
        }
      }
    } catch (err) {}
  }

  return skills;
}

// Run and output JSON
const skills = discoverSkills();

// Summary stats
const summary = {
  total: skills.length,
  bySource: {},
  byCategory: {},
};

for (const skill of skills) {
  summary.bySource[skill.source] = (summary.bySource[skill.source] || 0) + 1;
  for (const cat of skill.categories) {
    summary.byCategory[cat] = (summary.byCategory[cat] || 0) + 1;
  }
}

const output = {
  projectPath: path.resolve(projectPath),
  discoveredAt: new Date().toISOString(),
  summary,
  skills,
};

console.log(JSON.stringify(output, null, 2));

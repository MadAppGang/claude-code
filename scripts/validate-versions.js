#!/usr/bin/env node

/**
 * Version Validation Script
 *
 * Validates that plugin versions in marketplace.json match their plugin.json files.
 * Run this before releases to prevent version mismatches.
 *
 * Usage:
 *   node scripts/validate-versions.js
 *   npm run validate:versions
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

function validateVersions() {
  log('\n🔍 Validating plugin versions...', 'cyan');
  log('━'.repeat(60), 'cyan');

  const repoRoot = path.resolve(__dirname, '..');
  const marketplaceJsonPath = path.join(repoRoot, '.claude-plugin', 'marketplace.json');

  // Read marketplace.json
  let marketplaceData;
  try {
    marketplaceData = readJSON(marketplaceJsonPath);
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    process.exit(1);
  }

  log(`\n📦 Marketplace: ${marketplaceData.name} v${marketplaceData.metadata.version}`, 'blue');
  log(`   Plugin root: ${marketplaceData.metadata.pluginRoot}\n`);

  const errors = [];
  const warnings = [];
  const checks = [];

  // Validate each plugin
  for (const plugin of marketplaceData.plugins) {
    const pluginName = plugin.name;
    log(`\n🔧 Checking plugin: ${pluginName}`, 'bold');

    // Construct plugin.json path
    const pluginJsonPath = path.join(repoRoot, plugin.source, 'plugin.json');

    // Check if plugin.json exists
    if (!fs.existsSync(pluginJsonPath)) {
      errors.push({
        plugin: pluginName,
        message: `plugin.json not found at ${pluginJsonPath}`,
        severity: 'error',
      });
      log(`   ❌ plugin.json not found`, 'red');
      continue;
    }

    // Read plugin.json
    let pluginData;
    try {
      pluginData = readJSON(pluginJsonPath);
    } catch (error) {
      errors.push({
        plugin: pluginName,
        message: `Failed to parse plugin.json: ${error.message}`,
        severity: 'error',
      });
      log(`   ❌ Failed to parse plugin.json`, 'red');
      continue;
    }

    // Validate plugin name matches
    if (pluginData.name !== plugin.name) {
      errors.push({
        plugin: pluginName,
        message: `Name mismatch: marketplace="${plugin.name}", plugin.json="${pluginData.name}"`,
        severity: 'error',
      });
      log(`   ❌ Name mismatch: "${plugin.name}" vs "${pluginData.name}"`, 'red');
    }

    // Validate version matches (CRITICAL)
    if (pluginData.version !== plugin.version) {
      errors.push({
        plugin: pluginName,
        message: `Version mismatch: marketplace="${plugin.version}", plugin.json="${pluginData.version}"`,
        severity: 'error',
        fix: `Update marketplace.json line for "${pluginName}" version to "${pluginData.version}"`,
      });
      log(`   ❌ Version mismatch:`, 'red');
      log(`      marketplace.json: ${plugin.version}`, 'red');
      log(`      plugin.json:      ${pluginData.version}`, 'green');
    } else {
      log(`   ✅ Version matches: v${plugin.version}`, 'green');
      checks.push({
        plugin: pluginName,
        version: plugin.version,
        status: 'ok',
      });
    }

    // Check description length (warning only)
    if (plugin.description.length > 200) {
      warnings.push({
        plugin: pluginName,
        message: `Description is ${plugin.description.length} chars (recommended < 200 for better UX)`,
        severity: 'warning',
      });
      log(`   ⚠️  Description is long (${plugin.description.length} chars)`, 'yellow');
    }

    // Check if author matches
    if (pluginData.author && plugin.author) {
      if (pluginData.author.email !== plugin.author.email) {
        warnings.push({
          plugin: pluginName,
          message: `Author email mismatch: marketplace="${plugin.author.email}", plugin.json="${pluginData.author.email}"`,
          severity: 'warning',
        });
        log(`   ⚠️  Author email differs`, 'yellow');
      }
    }
  }

  // Print summary
  log('\n' + '━'.repeat(60), 'cyan');
  log('\n📊 Validation Summary:', 'bold');
  log(`   ✅ Passed: ${checks.length}`, 'green');
  log(`   ⚠️  Warnings: ${warnings.length}`, 'yellow');
  log(`   ❌ Errors: ${errors.length}`, errors.length > 0 ? 'red' : 'green');

  // Print detailed errors
  if (errors.length > 0) {
    log('\n❌ ERRORS FOUND:', 'red');
    errors.forEach((error, index) => {
      log(`\n${index + 1}. [${error.plugin}] ${error.message}`, 'red');
      if (error.fix) {
        log(`   Fix: ${error.fix}`, 'yellow');
      }
    });
  }

  // Print detailed warnings
  if (warnings.length > 0) {
    log('\n⚠️  WARNINGS:', 'yellow');
    warnings.forEach((warning, index) => {
      log(`\n${index + 1}. [${warning.plugin}] ${warning.message}`, 'yellow');
    });
  }

  // Final result
  log('\n' + '━'.repeat(60), 'cyan');
  if (errors.length === 0) {
    log('\n✅ All version checks passed!', 'green');
    log('   Safe to release.\n', 'green');
    process.exit(0);
  } else {
    log('\n❌ Validation failed! Please fix the errors above.', 'red');
    log('   Run this script again after fixing.\n', 'red');
    process.exit(1);
  }
}

// Run validation
try {
  validateVersions();
} catch (error) {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
}

import { UpdateCache } from '../services/update-cache.js';
import { refreshLocalMarketplaces } from '../services/local-marketplace.js';
import { getAvailablePlugins, clearMarketplaceCache } from '../services/plugin-manager.js';
import { runClaude } from '../services/claude-runner.js';

/**
 * Prerun orchestration: Check for updates, apply them, then run claude
 * @param claudeArgs - Arguments to pass to claude CLI
 * @returns Exit code from claude process
 */
export async function prerunClaude(claudeArgs: string[]): Promise<number> {
  const cache = new UpdateCache();

  try {
    // STEP 1: Check if we should update (time-based cache)
    const shouldUpdate = await cache.shouldCheckForUpdates();

    if (shouldUpdate) {
      // STEP 2: Refresh all marketplaces (git pull)
      const refreshResults = await refreshLocalMarketplaces();

      // STEP 3: Clear cache to force fresh plugin info
      clearMarketplaceCache();

      // STEP 4: Get updated plugin info (to detect versions)
      const plugins = await getAvailablePlugins();
      const enabledPlugins = plugins.filter(p => p.enabled);

      // STEP 5: Build summary
      const updated: string[] = [];
      const failed: string[] = [];

      for (const result of refreshResults) {
        if (result.success && result.updated) {
          // Find plugin info for this marketplace
          const mpPlugins = enabledPlugins.filter(p =>
            p.marketplace === result.name
          );
          if (mpPlugins.length > 0) {
            updated.push(...mpPlugins.map(p => `${p.name}@${p.marketplace} v${p.version}`));
          }
        } else if (!result.success) {
          failed.push(result.name);
        }
      }

      // STEP 6: Save cache
      await cache.saveCheck({
        lastUpdateCheck: new Date().toISOString(),
        lastUpdateResult: { updated, failed },
      });

      // STEP 7: Display summary (only if updates happened)
      if (updated.length > 0) {
        console.log(`Updated ${updated.length} plugin(s): ${updated.join(', ')}`);
      }
      if (failed.length > 0) {
        console.warn(`Warning: Failed to update: ${failed.join(', ')}`);
      }
    }
    // If !shouldUpdate → silent (no output)

  } catch (error) {
    // Non-fatal errors - warn and continue
    console.warn('Warning: Plugin update check failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // STEP 8: Always run claude (even if update failed)
  return runClaude(claudeArgs);
}

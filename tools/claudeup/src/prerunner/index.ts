import { UpdateCache } from "../services/update-cache.js";
import { refreshLocalMarketplaces } from "../services/local-marketplace.js";
import {
	getAvailablePlugins,
	clearMarketplaceCache,
	saveInstalledPluginVersion,
} from "../services/plugin-manager.js";
import { runClaude } from "../services/claude-runner.js";

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

			// STEP 4.5: Auto-update enabled plugins with available updates
			const autoUpdatedPlugins: Array<{
				pluginId: string;
				oldVersion: string;
				newVersion: string;
			}> = [];

			for (const plugin of plugins) {
				// Only update if:
				// 1. Plugin is enabled
				// 2. Plugin has an update available
				// 3. Plugin has both installedVersion and version (newVersion)
				if (plugin.enabled && plugin.hasUpdate && plugin.installedVersion && plugin.version) {
					try {
						// Save new version - this will:
						// 1. Update settings.json
						// 2. Call updateInstalledPluginsRegistry()
						// 3. Copy plugin files to cache (via copyPluginToCache())
						await saveInstalledPluginVersion(plugin.id, plugin.version);

						autoUpdatedPlugins.push({
							pluginId: plugin.id,
							oldVersion: plugin.installedVersion,
							newVersion: plugin.version,
						});
					} catch (error) {
						// Non-fatal: Log warning and continue
						console.warn(
							`⚠ Failed to auto-update ${plugin.id}:`,
							error instanceof Error ? error.message : "Unknown error"
						);
					}
				}
			}

			// STEP 5: Build summary - show all updated plugins (not just enabled)
			const updatedMarketplaces: string[] = [];
			const updatedPlugins: string[] = [];
			const failed: string[] = [];

			for (const result of refreshResults) {
				if (result.success && result.updated) {
					updatedMarketplaces.push(result.name);
					// Find ALL plugins from this marketplace (regardless of enabled state)
					const mpPlugins = plugins.filter(
						(p) => p.marketplace === result.name,
					);
					if (mpPlugins.length > 0) {
						updatedPlugins.push(
							...mpPlugins.map((p) => `${p.name} v${p.version}`),
						);
					}
				} else if (!result.success) {
					failed.push(
						`${result.name}${result.error ? ` (${result.error})` : ""}`,
					);
				}
			}

			// STEP 6: Save cache
			await cache.saveCheck({
				lastUpdateCheck: new Date().toISOString(),
				lastUpdateResult: { updated: updatedPlugins, failed, autoUpdated: autoUpdatedPlugins },
			});

			// STEP 7: Display summary (marketplace-level and plugin-level)
			if (updatedMarketplaces.length > 0) {
				console.log(
					`✓ Updated marketplace(s): ${updatedMarketplaces.join(", ")}`,
				);
				if (updatedPlugins.length > 0) {
					console.log(`  Plugins: ${updatedPlugins.join(", ")}`);
				}
			}
			if (failed.length > 0) {
				console.warn(`⚠ Failed to update: ${failed.join(", ")}`);
			}

			// Display auto-update summary
			if (autoUpdatedPlugins.length > 0) {
				console.log(`✓ Auto-updated ${autoUpdatedPlugins.length} plugin(s):`);
				for (const { pluginId, oldVersion, newVersion } of autoUpdatedPlugins) {
					console.log(`  - ${pluginId}: ${oldVersion} → ${newVersion}`);
				}
			}
		}
		// If !shouldUpdate → silent (no output)
	} catch (error) {
		// Non-fatal errors - warn and continue
		console.warn(
			"Warning: Plugin update check failed:",
			error instanceof Error ? error.message : "Unknown error",
		);
	}

	// STEP 8: Always run claude (even if update failed)
	return runClaude(claudeArgs);
}

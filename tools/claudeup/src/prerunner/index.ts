import { UpdateCache } from "../services/update-cache.js";
import {
	getAvailablePlugins,
	clearMarketplaceCache,
	saveInstalledPluginVersion,
} from "../services/plugin-manager.js";
import { runClaude } from "../services/claude-runner.js";
import { recoverMarketplaceSettings } from "../services/claude-settings.js";

export interface PrerunOptions {
	force?: boolean; // Bypass cache and force update check
}

/**
 * Prerun orchestration: Check for updates, apply them, then run claude
 * @param claudeArgs - Arguments to pass to claude CLI
 * @param options - Prerun options (force, etc.)
 * @returns Exit code from claude process
 */
export async function prerunClaude(
	claudeArgs: string[],
	options: PrerunOptions = {},
): Promise<number> {
	const cache = new UpdateCache();

	try {
		// STEP 1: Check if we should update (time-based cache, or forced)
		const shouldUpdate = options.force || (await cache.shouldCheckForUpdates());

		if (options.force) {
			console.log("⟳ Forcing plugin update check...");
		}

		if (shouldUpdate) {
			// STEP 1.5: Recover marketplace settings (enable autoUpdate, remove stale entries)
			const recovery = await recoverMarketplaceSettings();
			if (recovery.enabledAutoUpdate.length > 0) {
				console.log(
					`✓ Enabled auto-update for: ${recovery.enabledAutoUpdate.join(", ")}`,
				);
			}
			if (recovery.removed.length > 0) {
				console.log(
					`✓ Removed stale marketplaces: ${recovery.removed.join(", ")}`,
				);
			}

			// STEP 2: Clear cache to force fresh plugin info
			// Note: Marketplace updates should be done via Claude Code's /plugin marketplace update
			clearMarketplaceCache();

			// STEP 3: Get updated plugin info (to detect versions)
			const plugins = await getAvailablePlugins();

			// STEP 4: Auto-update enabled plugins with available updates
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
				if (
					plugin.enabled &&
					plugin.hasUpdate &&
					plugin.installedVersion &&
					plugin.version
				) {
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
							error instanceof Error ? error.message : "Unknown error",
						);
					}
				}
			}

			// STEP 5: Save cache
			await cache.saveCheck({
				lastUpdateCheck: new Date().toISOString(),
				lastUpdateResult: {
					updated: [],
					failed: [],
					autoUpdated: autoUpdatedPlugins,
				},
			});

			// STEP 6: Display auto-update summary
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

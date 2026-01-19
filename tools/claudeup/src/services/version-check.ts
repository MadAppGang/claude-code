import { createRequire } from "node:module";
import semver from "semver";

const require = createRequire(import.meta.url);

// Cache the result for the session
let cachedResult: VersionCheckResult | null = null;

export interface VersionCheckResult {
	currentVersion: string;
	latestVersion: string;
	updateAvailable: boolean;
	updateType?: "major" | "minor" | "patch";
}

/**
 * Get the current version from package.json
 */
export function getCurrentVersion(): string {
	try {
		const pkg = require("../../package.json");
		return pkg.version;
	} catch {
		return "0.0.0";
	}
}

/**
 * Fetch the latest version from npm registry
 * Uses a short timeout to avoid blocking startup
 */
async function fetchLatestVersion(): Promise<string | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

		const response = await fetch("https://registry.npmjs.org/claudeup/latest", {
			signal: controller.signal,
			headers: {
				Accept: "application/json",
			},
		});

		clearTimeout(timeout);

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as { version?: string };
		return data.version || null;
	} catch {
		// Network error, timeout, or parse error - silently fail
		return null;
	}
}

/**
 * Determine the type of update (major, minor, patch)
 */
function getUpdateType(
	current: string,
	latest: string,
): "major" | "minor" | "patch" | undefined {
	const currentParsed = semver.parse(current);
	const latestParsed = semver.parse(latest);

	if (!currentParsed || !latestParsed) return undefined;

	if (latestParsed.major > currentParsed.major) return "major";
	if (latestParsed.minor > currentParsed.minor) return "minor";
	if (latestParsed.patch > currentParsed.patch) return "patch";

	return undefined;
}

/**
 * Check if a new version is available
 * Returns cached result if already checked this session
 */
export async function checkForUpdates(): Promise<VersionCheckResult> {
	// Return cached result if available
	if (cachedResult) {
		return cachedResult;
	}

	const currentVersion = getCurrentVersion();
	const latestVersion = await fetchLatestVersion();

	if (!latestVersion) {
		// Couldn't fetch, assume no update
		cachedResult = {
			currentVersion,
			latestVersion: currentVersion,
			updateAvailable: false,
		};
		return cachedResult;
	}

	const updateAvailable = semver.gt(latestVersion, currentVersion);

	cachedResult = {
		currentVersion,
		latestVersion,
		updateAvailable,
		updateType: updateAvailable
			? getUpdateType(currentVersion, latestVersion)
			: undefined,
	};

	return cachedResult;
}

/**
 * Format update message for display
 */
export function formatUpdateMessage(result: VersionCheckResult): string {
	if (!result.updateAvailable) return "";

	const typeLabel = result.updateType ? ` (${result.updateType})` : "";
	return `Update available: v${result.currentVersion} → v${result.latestVersion}${typeLabel}. Run: npm i -g claudeup`;
}

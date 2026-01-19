/**
 * Shared string utilities for claudeup
 */

/**
 * Format marketplace name for display
 * e.g., "mag-claude-plugins" -> "Mag Claude Plugins"
 */
export function formatMarketplaceName(name: string): string {
	return name
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Validate GitHub repository format (org/repo)
 * Prevents SSRF via malicious repo strings
 */
export function isValidGitHubRepo(repo: string): boolean {
	if (!repo || typeof repo !== "string") {
		return false;
	}

	// Must match GitHub username/repo format
	// Username: alphanumeric, hyphens (no consecutive, not start/end)
	// Repo: alphanumeric, hyphens, underscores, dots
	const GITHUB_REPO_PATTERN =
		/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\/[a-zA-Z0-9_.-]+$/;

	// Allow single-char usernames too
	const GITHUB_REPO_PATTERN_SHORT = /^[a-zA-Z0-9]\/[a-zA-Z0-9_.-]+$/;

	if (
		!GITHUB_REPO_PATTERN.test(repo) &&
		!GITHUB_REPO_PATTERN_SHORT.test(repo)
	) {
		return false;
	}

	// Blocklist suspicious patterns
	const BLOCKLIST = [
		/\.\./, // Path traversal
		/@/, // URL authority injection
		/:/, // Port specification
		/\s/, // Whitespace
		/%/, // URL encoding
		/\\/, // Backslash
	];

	return !BLOCKLIST.some((pattern) => pattern.test(repo));
}

/**
 * Parse plugin ID into components
 * Format: pluginName@marketplaceName
 */
export interface ParsedPluginId {
	pluginName: string;
	marketplace: string;
	raw: string;
}

export function parsePluginId(pluginId: string): ParsedPluginId | null {
	if (!pluginId || typeof pluginId !== "string") {
		return null;
	}

	const trimmed = pluginId.trim();
	const atIndex = trimmed.lastIndexOf("@");

	if (atIndex <= 0) {
		return null;
	}

	const pluginName = trimmed.slice(0, atIndex).trim();
	const marketplace = trimmed.slice(atIndex + 1).trim();

	if (!pluginName || !marketplace) {
		return null;
	}

	return {
		pluginName,
		marketplace,
		raw: trimmed,
	};
}

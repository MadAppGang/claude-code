import type { Marketplace } from "../types/index.js";
import type { LocalMarketplace } from "../services/local-marketplace.js";
import { formatMarketplaceName } from "../utils/string-utils.js";

export const defaultMarketplaces: Marketplace[] = [
	{
		name: "mag-claude-plugins",
		displayName: "MadAppGang Plugins",
		source: {
			source: "github",
			repo: "MadAppGang/claude-code",
		},
		description:
			"Professional plugins for frontend, backend, and code analysis",
		official: false,
		featured: true, // Always show plugins (expanded by default)
	},
	{
		name: "claude-plugins-official",
		displayName: "Anthropic Official",
		source: {
			source: "github",
			repo: "anthropics/claude-plugins-official",
		},
		description:
			"Official Anthropic-managed directory of high quality Claude Code plugins",
		official: true,
	},
	{
		name: "claude-code-plugins",
		displayName: "Anthropic Deprecated",
		source: {
			source: "github",
			repo: "anthropics/claude-code",
		},
		description:
			"Legacy demo plugins from Anthropic (deprecated - use Official instead)",
		official: true,
	},
];

export function getMarketplaceByName(name: string): Marketplace | undefined {
	return defaultMarketplaces.find((m) => m.name === name);
}

// Get all available marketplaces from local cache + hardcoded defaults
// Local cache is primary source of truth, defaults are fallback
// Deduplicates by repo URL to avoid showing same marketplace twice
export function getAllMarketplaces(
	localMarketplaces?: Map<string, LocalMarketplace>,
): Marketplace[] {
	const all = new Map<string, Marketplace>();
	const seenRepos = new Set<string>();

	// Primary source: local cache (what's actually cloned)
	if (localMarketplaces) {
		for (const [name, local] of localMarketplaces) {
			const repo = local.gitRepo || "";
			if (repo) seenRepos.add(repo.toLowerCase());

			// Check if this marketplace has defaults (for official/featured flags)
			const defaultMp = defaultMarketplaces.find((m) => m.name === name);

			all.set(name, {
				name,
				displayName: local.name || formatMarketplaceName(name),
				source: { source: "github" as const, repo },
				description: local.description || "",
				official:
					defaultMp?.official ?? repo.toLowerCase().includes("anthropics/"),
				featured: defaultMp?.featured,
			});
		}
	}

	// Fallback: hardcoded defaults (only if their repo isn't already represented)
	for (const mp of defaultMarketplaces) {
		const repo = mp.source.repo?.toLowerCase() || "";
		if (!all.has(mp.name) && !seenRepos.has(repo)) {
			all.set(mp.name, mp);
			if (repo) seenRepos.add(repo);
		}
	}

	// Sort: MadAppGang first, then alphabetically
	return Array.from(all.values()).sort((a, b) => {
		// MadAppGang always first
		const aIsMag = a.source.repo?.toLowerCase().includes("madappgang/");
		const bIsMag = b.source.repo?.toLowerCase().includes("madappgang/");
		if (aIsMag && !bIsMag) return -1;
		if (!aIsMag && bIsMag) return 1;
		// Then alphabetically by display name
		return (a.displayName || a.name).localeCompare(b.displayName || b.name);
	});
}

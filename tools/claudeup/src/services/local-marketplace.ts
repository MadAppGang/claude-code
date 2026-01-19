import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { execSync, exec as execCb } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(execCb);

export interface LocalMarketplacePlugin {
	name: string;
	version: string;
	description: string;
	source?: string;
	category?: string;
	author?: { name: string; email?: string };
	// Extended info from plugin.json or marketplace.json
	strict?: boolean;
	lspServers?: Record<string, unknown>;
	agents?: string[];
	commands?: string[];
	skills?: string[];
	mcpServers?: string[];
}

export interface LocalMarketplace {
	name: string;
	description: string;
	plugins: LocalMarketplacePlugin[];
	gitRepo?: string; // Extracted from git remote
}

const CLAUDE_PLUGINS_DIR = path.join(
	os.homedir(),
	".claude",
	"plugins",
	"marketplaces",
);
const KNOWN_MARKETPLACES_FILE = path.join(
	os.homedir(),
	".claude",
	"plugins",
	"known_marketplaces.json",
);

interface KnownMarketplaceEntry {
	source: { source: string; url?: string; repo?: string };
	installLocation: string;
	lastUpdated: string;
}

type KnownMarketplaces = Record<string, KnownMarketplaceEntry>;

/**
 * Read known_marketplaces.json (Claude Code's internal marketplace tracking)
 */
async function readKnownMarketplaces(): Promise<KnownMarketplaces> {
	try {
		if (await fs.pathExists(KNOWN_MARKETPLACES_FILE)) {
			return await fs.readJson(KNOWN_MARKETPLACES_FILE);
		}
	} catch {
		// Return empty if can't read
	}
	return {};
}

/**
 * Write known_marketplaces.json
 */
async function writeKnownMarketplaces(data: KnownMarketplaces): Promise<void> {
	await fs.ensureDir(path.dirname(KNOWN_MARKETPLACES_FILE));
	await fs.writeJson(KNOWN_MARKETPLACES_FILE, data, { spaces: 2 });
}

/**
 * Add a marketplace to known_marketplaces.json
 */
export async function addToKnownMarketplaces(
	name: string,
	repo: string,
): Promise<void> {
	const known = await readKnownMarketplaces();
	known[name] = {
		source: { source: "github", repo },
		installLocation: path.join(CLAUDE_PLUGINS_DIR, name),
		lastUpdated: new Date().toISOString(),
	};
	await writeKnownMarketplaces(known);
}

/**
 * Remove a marketplace from known_marketplaces.json
 */
export async function removeFromKnownMarketplaces(name: string): Promise<void> {
	const known = await readKnownMarketplaces();
	if (known[name]) {
		delete known[name];
		await writeKnownMarketplaces(known);
	}
}

/**
 * Get git remote URL from a marketplace directory
 */
function getGitRemote(marketplacePath: string): string | undefined {
	try {
		const gitDir = path.join(marketplacePath, ".git");
		if (!fs.existsSync(gitDir)) return undefined;

		const result = execSync("git remote get-url origin", {
			cwd: marketplacePath,
			encoding: "utf-8",
			timeout: 5000,
		}).trim();

		// Convert SSH URL to HTTPS format: git@github.com:user/repo.git -> user/repo
		if (result.startsWith("git@github.com:")) {
			return result.replace("git@github.com:", "").replace(/\.git$/, "");
		}
		// HTTPS URL: https://github.com/user/repo -> user/repo
		if (result.includes("github.com")) {
			const match = result.match(/github\.com[/:]([^/]+\/[^/\s.]+)/);
			if (match) return match[1].replace(/\.git$/, "");
		}
		return undefined;
	} catch {
		return undefined;
	}
}

/**
 * Scan a single marketplace directory and return marketplace info
 */
async function scanSingleMarketplace(
	marketplacePath: string,
	marketplaceName: string,
): Promise<LocalMarketplace | null> {
	const manifestPath = path.join(
		marketplacePath,
		".claude-plugin",
		"marketplace.json",
	);

	if (!(await fs.pathExists(manifestPath))) return null;

	try {
		const manifest = await fs.readJson(manifestPath);
		const gitRepo = getGitRemote(marketplacePath);

		const plugins: LocalMarketplacePlugin[] = [];
		const validManifestPlugins: typeof manifest.plugins = [];
		let manifestModified = false;

		if (manifest.plugins && Array.isArray(manifest.plugins)) {
			for (const plugin of manifest.plugins) {
				// Try to scan plugin directory for component counts
				let agents: string[] = [];
				let commands: string[] = [];
				let skills: string[] = [];
				let mcpServers: string[] = [];

				// Handle both string sources (local paths) and object sources (remote URLs)
				const sourceStr =
					typeof plugin.source === "string" ? plugin.source : null;

				if (sourceStr) {
					const pluginPath = path.join(
						marketplacePath,
						sourceStr.replace("./", ""),
					);

					// Remove plugins whose source directory doesn't exist
					if (!(await fs.pathExists(pluginPath))) {
						manifestModified = true;
						continue;
					}

					try {
						// Scan for agents
						const agentsDir = path.join(pluginPath, "agents");
						if (await fs.pathExists(agentsDir)) {
							const agentFiles = await fs.readdir(agentsDir);
							agents = agentFiles
								.filter((f) => f.endsWith(".md"))
								.map((f) => f.replace(".md", ""));
						}
						// Scan for commands
						const commandsDir = path.join(pluginPath, "commands");
						if (await fs.pathExists(commandsDir)) {
							const cmdFiles = await fs.readdir(commandsDir);
							commands = cmdFiles
								.filter((f) => f.endsWith(".md"))
								.map((f) => f.replace(".md", ""));
						}
						// Scan for skills
						const skillsDir = path.join(pluginPath, "skills");
						if (await fs.pathExists(skillsDir)) {
							const skillFiles = await fs.readdir(skillsDir);
							skills = skillFiles.filter(
								(f) =>
									f.endsWith(".md") ||
									fs.statSync(path.join(skillsDir, f)).isDirectory(),
							);
						}
						// Scan for MCP servers
						const mcpDir = path.join(pluginPath, "mcp-servers");
						if (await fs.pathExists(mcpDir)) {
							const mcpFiles = await fs.readdir(mcpDir);
							mcpServers = mcpFiles
								.filter((f) => f.endsWith(".json"))
								.map((f) => f.replace(".json", ""));
						}
					} catch {
						// Ignore scan errors
					}
				}

				validManifestPlugins.push(plugin);
				plugins.push({
					name: plugin.name,
					version: plugin.version || "0.0.0",
					description: plugin.description || "",
					source: plugin.source,
					category: plugin.category,
					author: plugin.author,
					strict: plugin.strict,
					lspServers: plugin.lspServers,
					agents,
					commands,
					skills,
					mcpServers,
				});
			}
		}

		// Update marketplace.json if we removed invalid plugins
		if (manifestModified) {
			manifest.plugins = validManifestPlugins;
			await fs.writeJson(manifestPath, manifest, { spaces: 2 });
		}

		return {
			name: manifest.name || marketplaceName,
			description: manifest.description || manifest.metadata?.description || "",
			plugins,
			gitRepo,
		};
	} catch {
		return null;
	}
}

/**
 * Scan local marketplace cache and return marketplace info
 * Includes both:
 * - Marketplaces in ~/.claude/plugins/marketplaces/
 * - Directory-based marketplaces from known_marketplaces.json
 */
export async function scanLocalMarketplaces(): Promise<
	Map<string, LocalMarketplace>
> {
	const marketplaces = new Map<string, LocalMarketplace>();

	// 1. Scan marketplaces from the standard directory
	if (await fs.pathExists(CLAUDE_PLUGINS_DIR)) {
		try {
			const entries = await fs.readdir(CLAUDE_PLUGINS_DIR, {
				withFileTypes: true,
			});

			for (const entry of entries) {
				if (!entry.isDirectory()) continue;

				const marketplacePath = path.join(CLAUDE_PLUGINS_DIR, entry.name);
				const marketplace = await scanSingleMarketplace(
					marketplacePath,
					entry.name,
				);
				if (marketplace) {
					marketplaces.set(entry.name, marketplace);
				}
			}
		} catch {
			// Ignore read errors
		}
	}

	// 2. Add directory-based marketplaces from known_marketplaces.json
	try {
		const known = await readKnownMarketplaces();
		for (const [name, entry] of Object.entries(known)) {
			// Only add if it's a directory source AND not already in the map
			if (
				entry.source.source === "directory" &&
				entry.installLocation &&
				!marketplaces.has(name)
			) {
				if (await fs.pathExists(entry.installLocation)) {
					const marketplace = await scanSingleMarketplace(
						entry.installLocation,
						name,
					);
					if (marketplace) {
						marketplaces.set(name, marketplace);
					}
				}
			}
		}
	} catch {
		// Ignore errors reading known_marketplaces
	}

	return marketplaces;
}

/**
 * Get a specific local marketplace by name
 */
export async function getLocalMarketplace(
	name: string,
): Promise<LocalMarketplace | undefined> {
	const marketplaces = await scanLocalMarketplaces();
	return marketplaces.get(name);
}

/**
 * Check if a marketplace exists in local cache
 */
export async function hasLocalMarketplace(name: string): Promise<boolean> {
	const marketplacePath = path.join(CLAUDE_PLUGINS_DIR, name);
	const manifestPath = path.join(
		marketplacePath,
		".claude-plugin",
		"marketplace.json",
	);
	return fs.pathExists(manifestPath);
}

export interface RefreshResult {
	name: string;
	success: boolean;
	updated: boolean;
	error?: string;
}

/**
 * Get the GitHub repo for a marketplace from known_marketplaces.json or defaults
 */
async function getMarketplaceRepo(name: string): Promise<string | undefined> {
	// Check known_marketplaces.json first
	const known = await readKnownMarketplaces();
	if (known[name]?.source?.repo) {
		return known[name].source.repo;
	}

	// Fallback to hardcoded defaults
	const defaults: Record<string, string> = {
		"claude-plugins-official": "anthropics/claude-plugins-official",
		"claude-code-plugins": "anthropics/claude-code",
		"mag-claude-plugins": "MadAppGang/claude-code",
	};

	return defaults[name];
}

/**
 * Re-clone a corrupted marketplace (missing .git folder)
 */
async function recloneCorruptedMarketplace(
	marketplacePath: string,
	_name: string,
	repo: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		// Remove corrupted directory
		await fs.remove(marketplacePath);

		// Re-clone
		const cloneUrl = `https://github.com/${repo}.git`;
		await execAsync(
			`git clone --depth 1 "${cloneUrl}" "${marketplacePath}" >/dev/null 2>&1`,
			{
				timeout: 60000, // 60s timeout for clone
				shell: "/bin/bash",
			},
		);

		// Verify clone succeeded
		const gitDir = path.join(marketplacePath, ".git");
		if (!fs.existsSync(gitDir)) {
			return {
				success: false,
				error: "Re-clone failed: .git folder not created",
			};
		}

		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Re-clone failed",
		};
	}
}

/**
 * Refresh a single local marketplace by running git pull (async, non-blocking)
 * Auto-repairs corrupted marketplaces (missing .git folder) by re-cloning
 */
async function refreshSingleMarketplace(
	marketplacePath: string,
	name: string,
): Promise<RefreshResult> {
	try {
		const gitDir = path.join(marketplacePath, ".git");
		if (!fs.existsSync(gitDir)) {
			// Corrupted marketplace - attempt auto-repair by re-cloning
			const repo = await getMarketplaceRepo(name);
			if (!repo) {
				return {
					name,
					success: false,
					updated: false,
					error: "Corrupted (missing .git) - unknown repo, cannot auto-repair",
				};
			}

			const recloneResult = await recloneCorruptedMarketplace(
				marketplacePath,
				name,
				repo,
			);
			if (recloneResult.success) {
				return {
					name,
					success: true,
					updated: true,
					error: "Auto-repaired: re-cloned corrupted marketplace",
				};
			}
			return {
				name,
				success: false,
				updated: false,
				error: `Auto-repair failed: ${recloneResult.error}`,
			};
		}

		// Get current HEAD before pull (async)
		const { stdout: beforeHead } = await execAsync("git rev-parse HEAD", {
			cwd: marketplacePath,
			timeout: 5000,
		});

		// Run git pull (async) - suppress all output to prevent interference with TUI
		await execAsync("git pull --ff-only >/dev/null 2>&1", {
			cwd: marketplacePath,
			timeout: 30000, // 30s timeout for network operation
			shell: "/bin/bash",
		});

		// Get HEAD after pull (async)
		const { stdout: afterHead } = await execAsync("git rev-parse HEAD", {
			cwd: marketplacePath,
			timeout: 5000,
		});

		return {
			name,
			success: true,
			updated: beforeHead.trim() !== afterHead.trim(),
		};
	} catch (error) {
		return {
			name,
			success: false,
			updated: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export interface RefreshProgress {
	current: number;
	total: number;
	name: string;
}

export type ProgressCallback = (progress: RefreshProgress) => void;

/**
 * Refresh all local marketplaces by running git pull on each
 * Returns results for each marketplace
 * Includes both:
 * - Marketplaces in ~/.claude/plugins/marketplaces/
 * - Directory-based marketplaces from known_marketplaces.json (if they're git repos)
 * @param onProgress - Optional callback for progress updates
 */
export async function refreshLocalMarketplaces(
	onProgress?: ProgressCallback,
): Promise<RefreshResult[]> {
	const results: RefreshResult[] = [];

	// Collect all marketplace paths to refresh
	const marketplacesToRefresh: { name: string; path: string }[] = [];

	// 1. Add marketplaces from the standard directory
	if (await fs.pathExists(CLAUDE_PLUGINS_DIR)) {
		try {
			const entries = await fs.readdir(CLAUDE_PLUGINS_DIR, {
				withFileTypes: true,
			});
			for (const entry of entries) {
				if (entry.isDirectory()) {
					marketplacesToRefresh.push({
						name: entry.name,
						path: path.join(CLAUDE_PLUGINS_DIR, entry.name),
					});
				}
			}
		} catch {
			// Ignore read errors
		}
	}

	// 2. Add directory-based marketplaces from known_marketplaces.json
	try {
		const known = await readKnownMarketplaces();
		for (const [name, entry] of Object.entries(known)) {
			// Only add if it's a directory source AND not already in the list
			if (
				entry.source.source === "directory" &&
				entry.installLocation &&
				!marketplacesToRefresh.some((m) => m.name === name)
			) {
				// Check if it exists and is a git repo
				const gitDir = path.join(entry.installLocation, ".git");
				if (fs.existsSync(gitDir)) {
					marketplacesToRefresh.push({
						name,
						path: entry.installLocation,
					});
				}
			}
		}
	} catch {
		// Ignore errors reading known_marketplaces
	}

	if (marketplacesToRefresh.length === 0) {
		return results;
	}

	const total = marketplacesToRefresh.length;
	let completed = 0;

	// Run git pull on all marketplaces in parallel, but track progress
	const promises = marketplacesToRefresh.map(async ({ name, path: mpPath }) => {
		const result = await refreshSingleMarketplace(mpPath, name);
		completed++;
		onProgress?.({ current: completed, total, name });
		return result;
	});

	const settled = await Promise.all(promises);
	results.push(...settled);

	return results;
}

export interface CloneResult {
	success: boolean;
	name: string;
	error?: string;
}

/**
 * Clone a marketplace from GitHub repo
 * @param repo - GitHub repo in format "owner/repo" or "https://github.com/owner/repo"
 */
export async function cloneMarketplace(repo: string): Promise<CloneResult> {
	// Normalize repo format: extract "owner/repo" from various inputs
	let normalizedRepo = repo.trim();

	// Handle full URL: https://github.com/owner/repo or https://github.com/owner/repo.git
	if (normalizedRepo.includes("github.com")) {
		const match = normalizedRepo.match(/github\.com[/:]([^/]+\/[^/\s.]+)/);
		if (match) {
			normalizedRepo = match[1].replace(/\.git$/, "");
		}
	}

	// Validate format: owner/repo with alphanumeric, underscore, hyphen only (NO dots to prevent ..)
	if (!normalizedRepo.match(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/)) {
		return {
			success: false,
			name: "",
			error:
				"Invalid repo format. Use owner/repo (letters, numbers, hyphens, underscores only)",
		};
	}

	// Extract marketplace name from repo (last part)
	const repoName = normalizedRepo.split("/")[1];

	// Defense in depth: explicitly reject path traversal attempts
	if (
		repoName.includes("..") ||
		repoName.includes("/") ||
		repoName.includes("\\")
	) {
		return { success: false, name: "", error: "Invalid repository name" };
	}

	// Ensure plugins directory exists
	await fs.ensureDir(CLAUDE_PLUGINS_DIR);

	const marketplacePath = path.join(CLAUDE_PLUGINS_DIR, repoName);

	// Verify resolved path is within expected directory (defense in depth)
	const resolvedPath = path.resolve(marketplacePath);
	if (!resolvedPath.startsWith(path.resolve(CLAUDE_PLUGINS_DIR))) {
		return { success: false, name: "", error: "Invalid path detected" };
	}

	// Check if already exists
	if (await fs.pathExists(marketplacePath)) {
		return {
			success: false,
			name: repoName,
			error: "Marketplace already exists",
		};
	}

	try {
		// Clone the repository - suppress output to prevent TUI interference
		const cloneUrl = `https://github.com/${normalizedRepo}.git`;
		await execAsync(
			`git clone --depth 1 "${cloneUrl}" "${marketplacePath}" >/dev/null 2>&1`,
			{
				timeout: 60000, // 60s timeout for clone
				shell: "/bin/bash",
			},
		);

		// Verify it's a valid marketplace (has .claude-plugin/marketplace.json)
		const manifestPath = path.join(
			marketplacePath,
			".claude-plugin",
			"marketplace.json",
		);
		if (!(await fs.pathExists(manifestPath))) {
			// Not a valid marketplace, clean up
			await fs.remove(marketplacePath);
			return {
				success: false,
				name: repoName,
				error: "Not a valid marketplace (no .claude-plugin/marketplace.json)",
			};
		}

		return { success: true, name: repoName };
	} catch (error) {
		// Clean up on failure
		await fs.remove(marketplacePath).catch(() => {});
		return {
			success: false,
			name: repoName,
			error: error instanceof Error ? error.message : "Clone failed",
		};
	}
}

/**
 * Delete a marketplace directory from local cache
 */
export async function deleteMarketplace(name: string): Promise<void> {
	// Validate name doesn't contain path traversal
	if (name.includes("..") || name.includes("/") || name.includes("\\")) {
		throw new Error("Invalid marketplace name");
	}

	const marketplacePath = path.join(CLAUDE_PLUGINS_DIR, name);

	// Verify path is within expected directory (defense in depth)
	const resolvedPath = path.resolve(marketplacePath);
	if (!resolvedPath.startsWith(path.resolve(CLAUDE_PLUGINS_DIR))) {
		throw new Error("Invalid marketplace path");
	}

	if (await fs.pathExists(marketplacePath)) {
		await fs.remove(marketplacePath);
	}
}

export interface RepairResult {
	repaired: boolean;
	pluginName: string;
	added: {
		agents: string[];
		commands: string[];
		skills: string[];
	};
}

/**
 * Repair a plugin's plugin.json by adding missing agents/commands/skills arrays
 * based on what files exist on disk.
 *
 * This fixes plugins where the author forgot to add the arrays to plugin.json,
 * causing Claude Code to not load the agents/commands even though files exist.
 */
export async function repairPluginJson(
	pluginPath: string,
): Promise<RepairResult> {
	const pluginJsonPath = path.join(pluginPath, ".claude-plugin", "plugin.json");
	const pluginName = path.basename(pluginPath);

	const result: RepairResult = {
		repaired: false,
		pluginName,
		added: { agents: [], commands: [], skills: [] },
	};

	if (!(await fs.pathExists(pluginJsonPath))) {
		return result;
	}

	try {
		const pluginJson = await fs.readJson(pluginJsonPath);
		let modified = false;

		// Scan and add agents if array is missing
		const agentsDir = path.join(pluginPath, "agents");
		if (await fs.pathExists(agentsDir)) {
			const files = (await fs.readdir(agentsDir))
				.filter((f) => f.endsWith(".md"))
				.map((f) => `./agents/${f}`);

			if (files.length > 0 && !pluginJson.agents) {
				pluginJson.agents = files;
				result.added.agents = files;
				modified = true;
			}
		}

		// Scan and add commands if array is missing
		const commandsDir = path.join(pluginPath, "commands");
		if (await fs.pathExists(commandsDir)) {
			const files = (await fs.readdir(commandsDir))
				.filter((f) => f.endsWith(".md"))
				.map((f) => `./commands/${f}`);

			if (files.length > 0 && !pluginJson.commands) {
				pluginJson.commands = files;
				result.added.commands = files;
				modified = true;
			}
		}

		// Scan and add skills if array is missing
		const skillsDir = path.join(pluginPath, "skills");
		if (await fs.pathExists(skillsDir)) {
			const entries = await fs.readdir(skillsDir, { withFileTypes: true });
			const skills = entries
				.filter((e) => e.isDirectory() || e.name.endsWith(".md"))
				.map((e) => `./skills/${e.name}`);

			if (skills.length > 0 && !pluginJson.skills) {
				pluginJson.skills = skills;
				result.added.skills = skills;
				modified = true;
			}
		}

		if (modified) {
			await fs.writeJson(pluginJsonPath, pluginJson, { spaces: 2 });
			result.repaired = true;
		}
	} catch {
		// Ignore repair errors for individual plugins
	}

	return result;
}

export interface RepairMarketplaceResult {
	marketplace: string;
	repaired: RepairResult[];
}

/**
 * Repair all plugins in a marketplace
 */
export async function repairMarketplacePlugins(
	marketplaceName: string,
): Promise<RepairMarketplaceResult> {
	const result: RepairMarketplaceResult = {
		marketplace: marketplaceName,
		repaired: [],
	};

	const marketplacePath = path.join(CLAUDE_PLUGINS_DIR, marketplaceName);
	const manifestPath = path.join(
		marketplacePath,
		".claude-plugin",
		"marketplace.json",
	);

	if (!(await fs.pathExists(manifestPath))) {
		return result;
	}

	try {
		const manifest = await fs.readJson(manifestPath);

		if (manifest.plugins && Array.isArray(manifest.plugins)) {
			for (const plugin of manifest.plugins) {
				if (plugin.source) {
					const pluginPath = path.join(
						marketplacePath,
						plugin.source.replace("./", ""),
					);
					const repairResult = await repairPluginJson(pluginPath);

					if (repairResult.repaired) {
						result.repaired.push(repairResult);
					}
				}
			}
		}
	} catch {
		// Ignore errors
	}

	return result;
}

/**
 * Repair all plugins in all marketplaces
 */
export async function repairAllMarketplaces(): Promise<
	RepairMarketplaceResult[]
> {
	const results: RepairMarketplaceResult[] = [];

	if (!(await fs.pathExists(CLAUDE_PLUGINS_DIR))) {
		return results;
	}

	try {
		const entries = await fs.readdir(CLAUDE_PLUGINS_DIR, {
			withFileTypes: true,
		});

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;

			const repairResult = await repairMarketplacePlugins(entry.name);
			if (repairResult.repaired.length > 0) {
				results.push(repairResult);
			}
		}
	} catch {
		// Return empty on error
	}

	return results;
}

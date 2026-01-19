import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Check if a command exists in PATH
 * Uses execFile (not exec) to avoid shell injection vulnerabilities
 * @param command - Command name to check
 * @returns Path to command if found, null otherwise
 */
export async function which(command: string): Promise<string | null> {
	try {
		// Use execFile with argument array to prevent command injection
		const { stdout } = await execFileAsync("which", [command]);
		return stdout.trim() || null;
	} catch {
		return null;
	}
}

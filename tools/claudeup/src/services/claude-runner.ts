import { spawn } from 'node:child_process';
import { which } from '../utils/command-utils.js';

/**
 * Execute claude CLI with provided arguments
 * @param args - Arguments to pass to claude
 * @returns Exit code from claude process
 */
export async function runClaude(args: string[]): Promise<number> {
  // Check if claude exists
  const claudePath = await which('claude');
  if (!claudePath) {
    console.error('Error: claude CLI not found in PATH');
    console.error('Install with: npm install -g @anthropic-ai/claude-code');
    return 1;
  }

  // Spawn claude with full TTY inheritance using the resolved path
  return new Promise((resolve) => {
    const proc = spawn(claudePath, args, {
      stdio: 'inherit', // Pass through stdin, stdout, stderr
      shell: false, // Use full path, no shell needed (fixes DEP0190)
    });

    proc.on('exit', (code) => resolve(code || 0));
    proc.on('error', (err) => {
      console.error('Failed to run claude:', err.message);
      resolve(1);
    });
  });
}

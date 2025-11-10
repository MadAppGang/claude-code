import { writeFileSync, appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

let logFilePath: string | null = null;

/**
 * Initialize file logging for this session
 */
export function initLogger(debugMode: boolean): void {
  if (!debugMode) {
    logFilePath = null;
    return;
  }

  // Create logs directory if it doesn't exist
  const logsDir = join(process.cwd(), "logs");
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  // Create log file with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T").join("_").slice(0, -5);
  logFilePath = join(logsDir, `claudish_${timestamp}.log`);

  // Write header
  writeFileSync(
    logFilePath,
    `Claudish Debug Log - ${new Date().toISOString()}\n${"=".repeat(80)}\n\n`
  );

  console.log(`[claudish] Debug mode enabled - logging to: ${logFilePath}`);
}

/**
 * Log a message (to file if debug mode, otherwise to console)
 */
export function log(message: string, forceConsole = false): void {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;

  if (logFilePath) {
    // Debug mode - write to file only
    appendFileSync(logFilePath, logLine);
    // Don't write to console unless forced
  } else {
    // No debug mode - write to console
    console.log(message);
  }

  // Force console output (for critical messages even in debug mode)
  if (forceConsole && logFilePath) {
    console.log(message);
  }
}

/**
 * Get the current log file path
 */
export function getLogFilePath(): string | null {
  return logFilePath;
}

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
 * Log a message (to file only in debug mode, silent otherwise)
 */
export function log(message: string, forceConsole = false): void {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;

  if (logFilePath) {
    // Debug mode - write to file
    appendFileSync(logFilePath, logLine);
  } else {
    // No debug mode - silent (no console spam)
    // Do nothing
  }

  // Force console output (for critical messages even when not in debug mode)
  if (forceConsole) {
    console.log(message);
  }
}

/**
 * Get the current log file path
 */
export function getLogFilePath(): string | null {
  return logFilePath;
}

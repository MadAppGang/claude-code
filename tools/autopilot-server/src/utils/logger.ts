/**
 * Simple structured logger for autopilot server
 * With colorful badge support for terminal output
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  // Foreground
  black: "\x1b[30m",
  white: "\x1b[37m",
  // Background colors for badges
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgRed: "\x1b[41m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  // Text colors
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

class Logger {
  private minLevel: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
    this.minLevel = envLevel && LOG_LEVELS[envLevel] !== undefined ? envLevel : "info";
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private format(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      console.debug(this.format("debug", message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.info(this.format("info", message, context));
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      console.warn(this.format("warn", message, context));
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("error")) {
      console.error(this.format("error", message, context));
    }
  }

  // Colorful badge-style logging for Claude session events
  badge(type: "tool" | "assistant" | "user" | "system" | "result" | "error", content: string): void {
    if (!this.shouldLog("info")) return;

    const badges: Record<string, string> = {
      tool: `${colors.bgGreen}${colors.black}${colors.bright} TOOL ${colors.reset}`,
      assistant: `${colors.bgBlue}${colors.white}${colors.bright} CLAUDE ${colors.reset}`,
      user: `${colors.bgYellow}${colors.black}${colors.bright} USER ${colors.reset}`,
      system: `${colors.bgMagenta}${colors.white}${colors.bright} SYSTEM ${colors.reset}`,
      result: `${colors.bgCyan}${colors.black}${colors.bright} RESULT ${colors.reset}`,
      error: `${colors.bgRed}${colors.white}${colors.bright} ERROR ${colors.reset}`,
    };

    const badge = badges[type] || `[${type.toUpperCase()}]`;
    const timestamp = `${colors.gray}${new Date().toISOString()}${colors.reset}`;

    console.log(`${timestamp} ${badge} ${content}`);
  }
}

export const logger = new Logger();

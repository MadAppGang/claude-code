import { createInterface } from "readline";
import type { OpenRouterModel } from "./types.js";
import { loadModelInfo, getAvailableModels } from "./model-loader.js";

/**
 * Prompt user for OpenRouter API key interactively
 * Uses readline with proper stdin cleanup
 */
export async function promptForApiKey(): Promise<string> {
  return new Promise((resolve) => {
    console.log("\n\x1b[1m\x1b[36mOpenRouter API Key Required\x1b[0m\n");
    console.log("\x1b[2mGet your free API key from: https://openrouter.ai/keys\x1b[0m\n");
    console.log("Enter your OpenRouter API key:");
    console.log("\x1b[2m(it will not be saved, only used for this session)\x1b[0m\n");

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false, // CRITICAL: Don't use terminal mode to avoid stdin interference
    });

    let apiKey: string | null = null;

    rl.on("line", (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        console.log("\x1b[31mError: API key cannot be empty\x1b[0m");
        return;
      }

      // Basic validation: should start with sk-or-v1- (OpenRouter format)
      if (!trimmed.startsWith("sk-or-v1-")) {
        console.log("\x1b[33mWarning: OpenRouter API keys usually start with 'sk-or-v1-'\x1b[0m");
        console.log("\x1b[2mContinuing anyway...\x1b[0m");
      }

      apiKey = trimmed;
      rl.close();
    });

    rl.on("close", () => {
      // CRITICAL: Only resolve AFTER readline has fully closed
      if (apiKey) {
        // Force stdin to clean state
        process.stdin.pause();
        process.stdin.removeAllListeners("data");
        process.stdin.removeAllListeners("end");
        process.stdin.removeAllListeners("error");
        process.stdin.removeAllListeners("readable");

        // Ensure not in raw mode
        if (process.stdin.isTTY && process.stdin.setRawMode) {
          process.stdin.setRawMode(false);
        }

        // Wait for stdin to fully detach
        setTimeout(() => {
          resolve(apiKey);
        }, 200);
      } else {
        console.error("\x1b[31mError: API key is required\x1b[0m");
        process.exit(1);
      }
    });
  });
}

/**
 * Simple console-based model selector (no Ink/React)
 * Uses readline which properly cleans up stdin
 */
export async function selectModelInteractively(): Promise<OpenRouterModel | string> {
  // Load models at function start so they're available throughout
  const models = getAvailableModels();
  const modelInfo = loadModelInfo();

  return new Promise((resolve) => {
    console.log("\n\x1b[1m\x1b[36mSelect an OpenRouter model:\x1b[0m\n");

    // Display models

    models.forEach((model, index) => {
      const info = modelInfo[model as keyof typeof modelInfo];
      const displayName = info ? info.name : model;
      const description = info ? info.description : "Custom model entry";
      const provider = info ? info.provider : "";

      console.log(`  ${index + 1}. \x1b[1m${displayName}\x1b[0m`);
      if (provider && provider !== "Custom") {
        console.log(`     \x1b[2m${provider} - ${description}\x1b[0m`);
      } else {
        console.log(`     \x1b[2m${description}\x1b[0m`);
      }
      console.log("");
    });

    console.log(`\x1b[2mEnter number (1-${models.length}) or 'q' to quit:\x1b[0m`);

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false, // CRITICAL: Don't use terminal mode to avoid stdin interference
    });

    let selectedModel: string | null = null;

    rl.on("line", (input) => {
      const trimmed = input.trim();

      // Handle quit
      if (trimmed.toLowerCase() === "q") {
        rl.close();
        process.exit(0);
      }

      // Parse selection
      const selection = parseInt(trimmed, 10);
      if (isNaN(selection) || selection < 1 || selection > models.length) {
        console.log(`\x1b[31mInvalid selection. Please enter 1-${models.length}\x1b[0m`);
        return;
      }

      const model = models[selection - 1];

      // Handle custom model
      if (model === "custom") {
        rl.close();

        console.log("\n\x1b[1m\x1b[36mEnter custom OpenRouter model ID:\x1b[0m");
        const customRl = createInterface({
          input: process.stdin,
          output: process.stdout,
          terminal: false,
        });

        let customModel: string | null = null;

        customRl.on("line", (customInput) => {
          customModel = customInput.trim();
          customRl.close();
        });

        customRl.on("close", () => {
          // CRITICAL: Wait for readline to fully detach before resolving
          // Force stdin to clean state
          process.stdin.pause();
          process.stdin.removeAllListeners("data");
          process.stdin.removeAllListeners("end");
          process.stdin.removeAllListeners("error");
          process.stdin.removeAllListeners("readable");

          if (process.stdin.isTTY && process.stdin.setRawMode) {
            process.stdin.setRawMode(false);
          }

          setTimeout(() => {
            if (customModel) {
              resolve(customModel);
            } else {
              console.error("\x1b[31mError: Model ID cannot be empty\x1b[0m");
              process.exit(1);
            }
          }, 200);
        });
      } else {
        selectedModel = model;
        rl.close();
      }
    });

    rl.on("close", () => {
      // CRITICAL: Only resolve AFTER readline has fully closed
      // This ensures stdin is completely detached before spawning Claude Code
      if (selectedModel) {
        // Force stdin to clean state
        // Pause to stop all event processing
        process.stdin.pause();

        // Remove ALL readline-related listeners
        process.stdin.removeAllListeners("data");
        process.stdin.removeAllListeners("end");
        process.stdin.removeAllListeners("error");
        process.stdin.removeAllListeners("readable");

        // Ensure not in raw mode
        if (process.stdin.isTTY && process.stdin.setRawMode) {
          process.stdin.setRawMode(false);
        }

        // Wait for stdin to fully detach (longer delay)
        setTimeout(() => {
          resolve(selectedModel);
        }, 200); // 200ms delay for complete cleanup
      }
    });
  });
}

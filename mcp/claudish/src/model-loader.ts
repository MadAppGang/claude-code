import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OpenRouterModel } from "./types.js";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ModelMetadata {
	name: string;
	description: string;
	priority: number;
	provider: string;
}

interface RecommendedModelsJSON {
	version: string;
	lastUpdated: string;
	source: string;
	models: Array<{
		id: string;
		name: string;
		description: string;
		provider: string;
		category: string;
		priority: number;
		pricing: {
			input: string;
			output: string;
			average: string;
		};
		context: string;
		recommended: boolean;
	}>;
}

// Cache loaded data to avoid reading file multiple times
let _cachedModelInfo: Record<string, ModelMetadata> | null = null;
let _cachedModelIds: string[] | null = null;

/**
 * Load model metadata from recommended-models.json if available,
 * otherwise fall back to build-time generated config
 */
export function loadModelInfo(): Record<OpenRouterModel, ModelMetadata> {
	// Return cached data if available
	if (_cachedModelInfo) {
		return _cachedModelInfo as Record<OpenRouterModel, ModelMetadata>;
	}

	const jsonPath = join(__dirname, "../recommended-models.json");

	// Try to load from JSON first (runtime, latest)
	if (existsSync(jsonPath)) {
		try {
			const jsonContent = readFileSync(jsonPath, "utf-8");
			const data: RecommendedModelsJSON = JSON.parse(jsonContent);

			const modelInfo: Record<string, ModelMetadata> = {};

			// Convert JSON models to MODEL_INFO format
			for (const model of data.models) {
				modelInfo[model.id] = {
					name: model.name,
					description: model.description,
					priority: model.priority,
					provider: model.provider,
				};
			}

			// Add custom option
			modelInfo.custom = {
				name: "Custom Model",
				description: "Enter any OpenRouter model ID manually",
				priority: 999,
				provider: "Custom",
			};

			_cachedModelInfo = modelInfo;
			return modelInfo as Record<OpenRouterModel, ModelMetadata>;
		} catch (error) {
			console.warn(
				"⚠️  Failed to load recommended-models.json, falling back to build-time config",
			);
			console.warn(`   Error: ${error}`);
		}
	}

	// Fallback to build-time generated config
	const { MODEL_INFO } = require("./config.js");
	_cachedModelInfo = MODEL_INFO;
	return MODEL_INFO;
}

/**
 * Get list of available model IDs from recommended-models.json if available
 */
export function getAvailableModels(): OpenRouterModel[] {
	// Return cached data if available
	if (_cachedModelIds) {
		return _cachedModelIds as OpenRouterModel[];
	}

	const jsonPath = join(__dirname, "../recommended-models.json");

	// Try to load from JSON first
	if (existsSync(jsonPath)) {
		try {
			const jsonContent = readFileSync(jsonPath, "utf-8");
			const data: RecommendedModelsJSON = JSON.parse(jsonContent);

			// Extract model IDs sorted by priority
			const modelIds = data.models
				.sort((a, b) => a.priority - b.priority)
				.map((m) => m.id);

			const result = [...modelIds, "custom"];
			_cachedModelIds = result;
			return result as OpenRouterModel[];
		} catch (error) {
			console.warn(
				"⚠️  Failed to load model list from JSON, falling back to build-time config",
			);
		}
	}

	// Fallback to build-time generated config
	const { OPENROUTER_MODELS } = require("./types.js");
	_cachedModelIds = [...OPENROUTER_MODELS];
	return [...OPENROUTER_MODELS];
}

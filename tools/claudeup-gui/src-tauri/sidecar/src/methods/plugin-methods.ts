/**
 * Plugin RPC Methods
 * Implements plugin management operations using claudeup-core services
 */

import { RpcMethodHandler, ProgressParams, JSON_RPC_ERRORS } from '../types.js';
import {
  // Plugin listing
  getAvailablePlugins,
  getGlobalAvailablePlugins,
  // Plugin version management
  saveInstalledPluginVersion,
  removeInstalledPluginVersion,
  // Marketplace operations
  refreshAllMarketplaces,
  // Settings management
  enablePlugin,
  enableGlobalPlugin,
  enableLocalPlugin,
  saveGlobalInstalledPluginVersion,
  removeGlobalInstalledPluginVersion,
  saveLocalInstalledPluginVersion,
  removeLocalInstalledPluginVersion,
  // Types
  type PluginInfo,
  type LoggerCallback,
  type ProgressCallback,
} from '../../../../../claudeup-core/dist/index.js';

type Scope = 'global' | 'project' | 'local';

/**
 * Emit a progress notification via stdout (JSON-RPC 2.0 notification)
 */
function emitProgress(operation: string, percent: number, status: string, cancellable = false): void {
  const notification = {
    jsonrpc: '2.0',
    method: 'progress',
    params: {
      operation,
      percent,
      status,
      cancellable,
    } as ProgressParams,
  };
  console.log(JSON.stringify(notification));
}

/**
 * Create a logger callback that emits progress notifications
 */
function createLogger(operationId: string): LoggerCallback {
  return (level: 'info' | 'warn' | 'error', message: string) => {
    // Only emit info level as progress, warn/error go to stderr
    if (level === 'info') {
      emitProgress(operationId, -1, message, false);
    } else {
      console.error(`[${level}] ${message}`);
    }
  };
}

/**
 * Map core errors to JSON-RPC errors
 */
function mapCoreErrorToRpc(error: unknown): { code: number; message: string; data?: unknown } {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Validation errors
  if (errorMessage.includes('Invalid plugin ID')) {
    return {
      code: JSON_RPC_ERRORS.VALIDATION_ERROR,
      message: 'Invalid plugin ID format. Expected: "plugin-name@marketplace-name"',
      data: { originalError: errorMessage },
    };
  }

  if (errorMessage.includes('projectPath is required') || errorMessage.includes('Invalid project path')) {
    return {
      code: JSON_RPC_ERRORS.INVALID_PARAMS,
      message: 'projectPath is required and must be a valid absolute path',
      data: { originalError: errorMessage },
    };
  }

  // File not found
  if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
    return {
      code: JSON_RPC_ERRORS.FILE_NOT_FOUND,
      message: 'Required file or directory not found',
      data: { originalError: errorMessage },
    };
  }

  // Permission denied
  if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
    return {
      code: JSON_RPC_ERRORS.PERMISSION_DENIED,
      message: 'Permission denied',
      data: { originalError: errorMessage },
    };
  }

  // Network errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return {
      code: JSON_RPC_ERRORS.NETWORK_ERROR,
      message: 'Network operation failed',
      data: { originalError: errorMessage },
    };
  }

  // Default: Internal error
  return {
    code: JSON_RPC_ERRORS.INTERNAL_ERROR,
    message: 'Internal server error',
    data: { originalError: errorMessage },
  };
}

/**
 * Validate scope parameter
 */
function validateScope(scope: unknown): asserts scope is Scope {
  if (!['global', 'project', 'local'].includes(scope as string)) {
    throw {
      code: JSON_RPC_ERRORS.INVALID_PARAMS,
      message: `Invalid scope: ${scope}. Must be 'global', 'project', or 'local'`,
    };
  }
}

/**
 * Validate projectPath for non-global scopes
 */
function validateProjectPath(scope: Scope, projectPath: unknown): asserts projectPath is string {
  if ((scope === 'project' || scope === 'local') && (!projectPath || typeof projectPath !== 'string')) {
    throw {
      code: JSON_RPC_ERRORS.INVALID_PARAMS,
      message: 'projectPath is required when scope is "project" or "local"',
    };
  }
}

/**
 * Plugin method handlers
 */
export const pluginMethods: Record<string, RpcMethodHandler> = {
  /**
   * List all plugins
   * @param params.scope - 'global' | 'project' | 'local'
   * @param params.projectPath - Required if scope is 'project' or 'local'
   */
  'plugin.list': async (params: unknown) => {
    const { scope = 'global', projectPath } = (params || {}) as { scope?: Scope; projectPath?: string };

    validateScope(scope);
    if (scope !== 'global') {
      validateProjectPath(scope, projectPath);
    }

    try {
      let plugins: PluginInfo[];

      if (scope === 'global') {
        // Global scope: use global function
        plugins = await getGlobalAvailablePlugins();
      } else {
        // Project or local scope: use project-aware function
        plugins = await getAvailablePlugins(projectPath);
      }

      return {
        plugins,
        scope,
      };
    } catch (error) {
      throw mapCoreErrorToRpc(error);
    }
  },

  /**
   * Install a plugin
   * @param params.name - Plugin ID (format: "plugin-name@marketplace-name")
   * @param params.scope - 'global' | 'project' | 'local'
   * @param params.projectPath - Required if scope is 'project' or 'local'
   * @param params.operationId - Optional operation ID for progress tracking
   */
  'plugin.install': async (params: unknown) => {
    const { name, scope = 'global', projectPath, operationId } = (params || {}) as {
      name?: string;
      scope?: Scope;
      projectPath?: string;
      operationId?: string;
    };

    // Validate plugin name
    if (!name || typeof name !== 'string') {
      throw {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: 'Plugin name is required and must be a string',
      };
    }

    validateScope(scope);
    if (scope !== 'global') {
      validateProjectPath(scope, projectPath);
    }

    const opId = operationId || `install-${name}-${Date.now()}`;
    const logger = createLogger(opId);

    try {
      emitProgress(opId, 0, 'Starting installation...', true);

      // Fetch plugin metadata to get version
      emitProgress(opId, 25, 'Fetching plugin metadata...');

      const plugins = scope === 'global'
        ? await getGlobalAvailablePlugins(logger)
        : await getAvailablePlugins(projectPath, logger);

      const pluginInfo = plugins.find((p: PluginInfo) => p.id === name);

      if (!pluginInfo) {
        throw {
          code: JSON_RPC_ERRORS.FILE_NOT_FOUND,
          message: `Plugin not found: ${name}`,
        };
      }

      if (!pluginInfo.version) {
        throw {
          code: JSON_RPC_ERRORS.VALIDATION_ERROR,
          message: `Plugin ${name} has no version information`,
        };
      }

      // Install plugin (save version + enable)
      emitProgress(opId, 50, 'Saving plugin version...');

      if (scope === 'global') {
        await saveGlobalInstalledPluginVersion(name, pluginInfo.version, logger);
        emitProgress(opId, 75, 'Enabling plugin...');
        await enableGlobalPlugin(name, true);
      } else if (scope === 'project') {
        await saveInstalledPluginVersion(name, pluginInfo.version, projectPath);
        emitProgress(opId, 75, 'Enabling plugin...');
        await enablePlugin(name, true, projectPath!);
      } else if (scope === 'local') {
        await saveLocalInstalledPluginVersion(name, pluginInfo.version, projectPath!, logger);
        emitProgress(opId, 75, 'Enabling plugin...');
        await enableLocalPlugin(name, true, projectPath!);
      }

      emitProgress(opId, 100, 'Installation complete');

      return {
        success: true,
        name,
        version: pluginInfo.version,
        scope,
      };
    } catch (error: unknown) {
      // If error is already an RPC error, re-throw
      if (error && typeof error === 'object' && 'code' in error) {
        emitProgress(opId, 0, `Installation failed: ${(error as { message?: string }).message || 'Unknown error'}`);
        throw error;
      }

      const rpcError = mapCoreErrorToRpc(error);
      emitProgress(opId, 0, `Installation failed: ${rpcError.message}`);
      throw rpcError;
    }
  },

  /**
   * Update a plugin
   * @param params.name - Plugin ID
   * @param params.scope - 'global' | 'project' | 'local'
   * @param params.projectPath - Required if scope is 'project' or 'local'
   * @param params.operationId - Optional operation ID
   */
  'plugin.update': async (params: unknown) => {
    const { name, scope = 'global', projectPath, operationId } = (params || {}) as {
      name?: string;
      scope?: Scope;
      projectPath?: string;
      operationId?: string;
    };

    if (!name || typeof name !== 'string') {
      throw {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: 'Plugin name is required',
      };
    }

    validateScope(scope);
    if (scope !== 'global') {
      validateProjectPath(scope, projectPath);
    }

    const opId = operationId || `update-${name}-${Date.now()}`;
    const logger = createLogger(opId);

    try {
      emitProgress(opId, 0, 'Checking for updates...', true);

      // Fetch latest plugin info
      const plugins = scope === 'global'
        ? await getGlobalAvailablePlugins(logger)
        : await getAvailablePlugins(projectPath, logger);

      const pluginInfo = plugins.find((p: PluginInfo) => p.id === name);

      if (!pluginInfo) {
        throw {
          code: JSON_RPC_ERRORS.FILE_NOT_FOUND,
          message: `Plugin not found: ${name}`,
        };
      }

      // Check if update is needed
      if (!pluginInfo.hasUpdate) {
        emitProgress(opId, 100, 'Plugin is already up to date');
        return {
          success: true,
          message: 'Plugin is already up to date',
          name,
          version: pluginInfo.installedVersion || pluginInfo.version,
          scope,
        };
      }

      // Update plugin (same as install - overwrites version)
      emitProgress(opId, 50, 'Updating plugin...');

      if (scope === 'global') {
        await saveGlobalInstalledPluginVersion(name, pluginInfo.version!, logger);
      } else if (scope === 'project') {
        await saveInstalledPluginVersion(name, pluginInfo.version!, projectPath);
      } else if (scope === 'local') {
        await saveLocalInstalledPluginVersion(name, pluginInfo.version!, projectPath!, logger);
      }

      emitProgress(opId, 100, 'Update complete');

      return {
        success: true,
        name,
        version: pluginInfo.version,
        previousVersion: pluginInfo.installedVersion,
        scope,
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        emitProgress(opId, 0, `Update failed: ${(error as { message?: string }).message || 'Unknown error'}`);
        throw error;
      }

      const rpcError = mapCoreErrorToRpc(error);
      emitProgress(opId, 0, `Update failed: ${rpcError.message}`);
      throw rpcError;
    }
  },

  /**
   * Enable a plugin
   * @param params.name - Plugin ID
   * @param params.scope - 'global' | 'project' | 'local'
   * @param params.projectPath - Required if scope is 'project' or 'local'
   */
  'plugin.enable': async (params: unknown) => {
    const { name, scope = 'global', projectPath } = (params || {}) as {
      name?: string;
      scope?: Scope;
      projectPath?: string;
    };

    if (!name || typeof name !== 'string') {
      throw {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: 'Plugin name is required',
      };
    }

    validateScope(scope);
    if (scope !== 'global') {
      validateProjectPath(scope, projectPath);
    }

    try {
      if (scope === 'global') {
        await enableGlobalPlugin(name, true);
      } else if (scope === 'project') {
        await enablePlugin(name, true, projectPath!);
      } else if (scope === 'local') {
        await enableLocalPlugin(name, true, projectPath!);
      }

      return { success: true, name, scope, enabled: true };
    } catch (error) {
      throw mapCoreErrorToRpc(error);
    }
  },

  /**
   * Disable a plugin
   * @param params.name - Plugin ID
   * @param params.scope - 'global' | 'project' | 'local'
   * @param params.projectPath - Required if scope is 'project' or 'local'
   */
  'plugin.disable': async (params: unknown) => {
    const { name, scope = 'global', projectPath } = (params || {}) as {
      name?: string;
      scope?: Scope;
      projectPath?: string;
    };

    if (!name || typeof name !== 'string') {
      throw {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: 'Plugin name is required',
      };
    }

    validateScope(scope);
    if (scope !== 'global') {
      validateProjectPath(scope, projectPath);
    }

    try {
      if (scope === 'global') {
        await enableGlobalPlugin(name, false);
      } else if (scope === 'project') {
        await enablePlugin(name, false, projectPath!);
      } else if (scope === 'local') {
        await enableLocalPlugin(name, false, projectPath!);
      }

      return { success: true, name, scope, enabled: false };
    } catch (error) {
      throw mapCoreErrorToRpc(error);
    }
  },

  /**
   * Uninstall a plugin
   * @param params.name - Plugin ID
   * @param params.scope - 'global' | 'project' | 'local'
   * @param params.projectPath - Required if scope is 'project' or 'local'
   */
  'plugin.uninstall': async (params: unknown) => {
    const { name, scope = 'global', projectPath } = (params || {}) as {
      name?: string;
      scope?: Scope;
      projectPath?: string;
    };

    if (!name || typeof name !== 'string') {
      throw {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: 'Plugin name is required',
      };
    }

    validateScope(scope);
    if (scope !== 'global') {
      validateProjectPath(scope, projectPath);
    }

    try {
      // Disable and remove version
      if (scope === 'global') {
        await enableGlobalPlugin(name, false);
        await removeGlobalInstalledPluginVersion(name);
      } else if (scope === 'project') {
        await enablePlugin(name, false, projectPath!);
        await removeInstalledPluginVersion(name, projectPath);
      } else if (scope === 'local') {
        await enableLocalPlugin(name, false, projectPath!);
        await removeLocalInstalledPluginVersion(name, projectPath!);
      }

      return { success: true, name, scope };
    } catch (error) {
      throw mapCoreErrorToRpc(error);
    }
  },

  /**
   * Refresh all marketplaces
   * @param params.operationId - Optional operation ID for progress tracking
   */
  'plugin.refreshMarketplaces': async (params: unknown) => {
    const { operationId } = (params || {}) as { operationId?: string };
    const opId = operationId || `refresh-marketplaces-${Date.now()}`;

    try {
      emitProgress(opId, 0, 'Starting marketplace refresh...', true);

      // Create progress adapter for core's callback
      const onProgress: ProgressCallback = (percent: number, status: string) => {
        emitProgress(opId, percent, status, true);
      };

      const results = await refreshAllMarketplaces(onProgress);

      emitProgress(opId, 100, 'Refresh complete');

      return {
        success: true,
        results,
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        emitProgress(opId, 0, `Refresh failed: ${(error as { message?: string }).message || 'Unknown error'}`);
        throw error;
      }

      const rpcError = mapCoreErrorToRpc(error);
      emitProgress(opId, 0, `Refresh failed: ${rpcError.message}`);
      throw rpcError;
    }
  },
};

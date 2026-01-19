import { useTauriQuery, useTauriCommand } from "./useTauriCommand";
import { useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  scope: "global" | "project";
  marketplace: string;
}

export interface InstallPluginParams {
  name: string;
  scope: "global" | "project" | "local";
  marketplace?: string;
  projectPath?: string;
}

export interface TogglePluginParams {
  pluginId: string;
  enabled: boolean;
  scope: "global" | "project" | "local";
  projectPath?: string;
}

export interface UpdatePluginParams {
  name: string;
  scope: "global" | "project" | "local";
  projectPath?: string;
}

export interface UninstallPluginParams {
  name: string;
  scope: "global" | "project" | "local";
  projectPath?: string;
}

export function usePlugins(scope?: "global" | "project", projectPath?: string) {
  // Build params based on scope
  const params = scope === 'project'
    ? { scope, projectPath }
    : scope === 'global'
    ? { scope }
    : undefined;

  return useTauriQuery<Plugin[]>(
    ["plugins", scope || "all", projectPath || ""],
    "list_plugins",
    params,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      // Only enable project query if we have a projectPath
      enabled: scope !== 'project' || !!projectPath,
    }
  );
}

export function useInstallPlugin() {
  const queryClient = useQueryClient();

  return useTauriCommand<{ success: boolean }, InstallPluginParams>(
    "install_plugin",
    {
      onSuccess: async (_data, variables) => {
        try {
          // Find the active plugins query to get the projectPath
          const queries = queryClient.getQueryCache().findAll({ queryKey: ["plugins"] });

          // Get projectPath from the first active query or from variables
          let projectPath = variables.projectPath;
          for (const query of queries) {
            const key = query.queryKey as string[];
            if (key[2] && key[2] !== "") {
              projectPath = key[2];
              break;
            }
          }

          if (!projectPath) {
            console.error('[useInstallPlugin] No projectPath found, cannot refetch');
            return;
          }

          // Manually fetch fresh data from backend
          const params = { scope: 'project' as const, projectPath };
          const freshData = await invoke<Plugin[]>("list_plugins", params);

          // Update the cache with fresh data
          const queryKey = ["plugins", "project", projectPath];
          queryClient.setQueryData(queryKey, freshData);
        } catch (error) {
          console.error('[useInstallPlugin] Error fetching fresh data:', error);
        }
      },
    }
  );
}

export function useEnablePlugin() {
  const queryClient = useQueryClient();

  return useTauriCommand<{ success: boolean }, TogglePluginParams>(
    "enable_plugin",
    {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: ["plugins"] });

        const previousPlugins = queryClient.getQueryData<Plugin[]>(["plugins", variables.scope]);

        queryClient.setQueryData<Plugin[]>(["plugins", variables.scope], (old) =>
          old?.map((plugin) =>
            plugin.id === variables.pluginId
              ? { ...plugin, enabled: variables.enabled }
              : plugin
          )
        );

        return { previousPlugins } as { previousPlugins: Plugin[] | undefined };
      },
      onError: (_error, variables, context) => {
        const ctx = context as { previousPlugins?: Plugin[] } | undefined;
        if (ctx?.previousPlugins) {
          queryClient.setQueryData(["plugins", variables.scope], ctx.previousPlugins);
        }
      },
      onSettled: (_data, _error, variables) => {
        queryClient.invalidateQueries({ queryKey: ["plugins", variables.scope] });
      },
    }
  );
}

export function useDisablePlugin() {
  const queryClient = useQueryClient();

  return useTauriCommand<{ success: boolean }, TogglePluginParams>(
    "disable_plugin",
    {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: ["plugins"] });

        const previousPlugins = queryClient.getQueryData<Plugin[]>(["plugins", variables.scope]);

        queryClient.setQueryData<Plugin[]>(["plugins", variables.scope], (old) =>
          old?.map((plugin) =>
            plugin.id === variables.pluginId
              ? { ...plugin, enabled: variables.enabled }
              : plugin
          )
        );

        return { previousPlugins } as { previousPlugins: Plugin[] | undefined };
      },
      onError: (_error, variables, context) => {
        const ctx = context as { previousPlugins?: Plugin[] } | undefined;
        if (ctx?.previousPlugins) {
          queryClient.setQueryData(["plugins", variables.scope], ctx.previousPlugins);
        }
      },
      onSettled: (_data, _error, variables) => {
        queryClient.invalidateQueries({ queryKey: ["plugins", variables.scope] });
      },
    }
  );
}

export function useRefreshMarketplaces() {
  const queryClient = useQueryClient();

  return useTauriCommand<{ success: boolean }, void>(
    "refresh_marketplaces",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["plugins"] });
      },
    }
  );
}

export function useUpdatePlugin() {
  const queryClient = useQueryClient();

  return useTauriCommand<{ success: boolean }, UpdatePluginParams>(
    "update_plugin",
    {
      onSuccess: async (_data, variables) => {
        try {
          // Find the active plugins query to get the projectPath
          const queries = queryClient.getQueryCache().findAll({ queryKey: ["plugins"] });

          // Get projectPath from the first active query or from variables
          let projectPath = variables.projectPath;
          for (const query of queries) {
            const key = query.queryKey as string[];
            if (key[2] && key[2] !== "") {
              projectPath = key[2];
              break;
            }
          }

          if (!projectPath) {
            console.error('[useUpdatePlugin] No projectPath found, cannot refetch');
            return;
          }

          // Manually fetch fresh data from backend
          const params = { scope: 'project' as const, projectPath };
          const freshData = await invoke<Plugin[]>("list_plugins", params);

          // Update the cache with fresh data
          const queryKey = ["plugins", "project", projectPath];
          queryClient.setQueryData(queryKey, freshData);
        } catch (error) {
          console.error('[useUpdatePlugin] Error fetching fresh data:', error);
        }
      },
    }
  );
}

export function useUninstallPlugin() {
  const queryClient = useQueryClient();

  return useTauriCommand<{ success: boolean }, UninstallPluginParams>(
    "uninstall_plugin",
    {
      onSuccess: async (_data, variables) => {
        try {
          // Find the active plugins query to get the projectPath
          const queries = queryClient.getQueryCache().findAll({ queryKey: ["plugins"] });

          // Get projectPath from the first active query or from variables
          let projectPath = variables.projectPath;
          for (const query of queries) {
            const key = query.queryKey as string[];
            if (key[2] && key[2] !== "") {
              projectPath = key[2];
              break;
            }
          }

          if (!projectPath) {
            console.error('[useUninstallPlugin] No projectPath found, cannot refetch');
            return;
          }

          // Manually fetch fresh data from backend
          const params = { scope: 'project' as const, projectPath };
          const freshData = await invoke<Plugin[]>("list_plugins", params);

          // Update the cache with fresh data
          const queryKey = ["plugins", "project", projectPath];
          queryClient.setQueryData(queryKey, freshData);
        } catch (error) {
          console.error('[useUninstallPlugin] Error fetching fresh data:', error);
        }
      },
    }
  );
}

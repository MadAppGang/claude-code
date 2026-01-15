import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectStorage } from "../utils/projectStorage.js";
import { Project } from "../types.js";

// List all projects
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => ProjectStorage.getProjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get current project
export function useCurrentProject() {
  return useQuery<Project | null>({
    queryKey: ["current-project"],
    queryFn: () => ProjectStorage.getCurrentProject(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Add new project
export function useAddProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, { path: string; name?: string }>({
    mutationFn: async ({ path, name }) => {
      return ProjectStorage.addProject(path, name);
    },
    onSuccess: () => {
      // Invalidate queries to trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["current-project"] });
      queryClient.invalidateQueries({ queryKey: ["plugins"] }); // Re-fetch plugins for new project
    },
  });
}

// Switch project
export function useSwitchProject() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { projectId: string }>({
    mutationFn: async ({ projectId }) => {
      ProjectStorage.setCurrentProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["current-project"] });
      queryClient.invalidateQueries({ queryKey: ["plugins"] });
    },
  });
}

// Remove project
export function useRemoveProject() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { projectId: string }>({
    mutationFn: async ({ projectId }) => {
      ProjectStorage.removeProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["current-project"] });
    },
  });
}

// Export old API for backwards compatibility
export function useRecentProjects() {
  return useProjects();
}

// Export type for backwards compatibility
export type { Project };

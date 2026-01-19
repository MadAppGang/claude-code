import React, { useState, useMemo, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Search, Package, Globe, Activity, Layout, Store,
  HelpCircle, ChevronDown, FolderOpen, Plus, Trash2, Folder, History, Check
} from 'lucide-react';
import { Plugin, AppState } from './types';
import PluginRow from './components/plugins/PluginRow';
import RightSidebar from './components/plugins/RightSidebar';
import { usePlugins } from './hooks/usePlugins';
import { adaptPluginsFromBackend } from './utils/pluginAdapter';
import { useMarketplaces, useAddMarketplace, useRemoveMarketplace, Marketplace } from './hooks/useMarketplaces';
import { useProjects, useCurrentProject, useSwitchProject, useAddProject, useRemoveProject, Project } from './hooks/useProjects';
import { useProjectDialog } from './hooks/useProjectDialog';
import { ToastProvider, useToast, ToastContainer } from './components/Toast';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import { WelcomeScreen } from './components/WelcomeScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const toast = useToast();

  // --- Backend Data ---
  // Fetch current project first to get the path
  const { data: currentProject, isLoading: currentProjectLoading } = useCurrentProject();

  // Fetch plugins for project scope (backend returns all scope data for each plugin)
  const { data: projectPlugins, isLoading: projectLoading, error: projectError, refetch: refetchProject } = usePlugins('project', currentProject?.path);

  // Transform backend data - no merging needed, just use project plugins
  const backendPlugins = useMemo(() => {
    // Safely extract arrays from potentially wrapped responses
    const toArray = <T,>(data: T[] | { plugins?: T[]; data?: T[] } | undefined | null): T[] => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (typeof data === 'object') {
        if ('plugins' in data && Array.isArray(data.plugins)) return data.plugins;
        if ('data' in data && Array.isArray(data.data)) return data.data;
      }
      return [];
    };

    return toArray(projectPlugins);
  }, [projectPlugins]);

  const pluginsLoading = projectLoading;
  const pluginsError = projectError;
  const refetchPlugins = () => {
    refetchProject();
  };
  const { data: marketplacesData, isLoading: marketplacesLoading, error: marketplacesError, refetch: refetchMarketplaces } = useMarketplaces();
  const { data: projectsData, isLoading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects();

  const addMarketplaceMutation = useAddMarketplace();
  const removeMarketplaceMutation = useRemoveMarketplace();
  const switchProjectMutation = useSwitchProject();
  const addProjectMutation = useAddProject();
  const removeProjectMutation = useRemoveProject();
  const { selectProjectFolder } = useProjectDialog();

  // Transform backend data to frontend format
  const plugins = useMemo(() => {
    if (!backendPlugins || backendPlugins.length === 0) {
      return [];
    }
    return adaptPluginsFromBackend(backendPlugins);
  }, [backendPlugins]);

  const marketplaces: Marketplace[] = Array.isArray(marketplacesData) ? marketplacesData : [];
  const projects: Project[] = Array.isArray(projectsData) ? projectsData : [];

  // --- State ---
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<AppState>({
    activeMarketplace: marketplaces[0]?.id || '',
    activeProjectId: currentProject?.id || '',
    searchQuery: '',
    selectedPluginId: null
  });

  // Update active marketplace when data loads
  useEffect(() => {
    if (marketplaces.length > 0 && !state.activeMarketplace) {
      setState(prev => ({ ...prev, activeMarketplace: marketplaces[0].id }));
    }
  }, [marketplaces, state.activeMarketplace]);

  // Update active project when current project loads
  useEffect(() => {
    if (currentProject && currentProject.id !== state.activeProjectId) {
      setState(prev => ({ ...prev, activeProjectId: currentProject.id }));
    }
  }, [currentProject, state.activeProjectId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Default selection
  useEffect(() => {
    if (!state.selectedPluginId && filteredPlugins.length > 0) {
      setState(prev => ({ ...prev, selectedPluginId: filteredPlugins[0].id }));
    }
  }, [state.activeMarketplace]);

  // --- Handlers ---

  // Handle updates from the Detail View (Scope toggles, installs, etc.)
  // Note: Updates now handled by TanStack Query invalidation
  const handlePluginUpdate = (_updatedPlugin: Plugin) => {
    // No-op: Backend mutations auto-refresh via query invalidation
    // Keeping this for interface compatibility
  };

  // Marketplace Management
  const handleAddMarketplace = async () => {
    const url = window.prompt("Enter Marketplace URL or local path:");
    if (!url) return;

    try {
      await addMarketplaceMutation.mutateAsync({ url });
      toast.addToast('Marketplace added successfully', 'success');
    } catch (error) {
      toast.addToast(
        `Failed to add marketplace: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    }
  };

  const handleRemoveMarketplace = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Remove this marketplace?")) return;

    try {
      await removeMarketplaceMutation.mutateAsync({ id });
      toast.addToast('Marketplace removed successfully', 'success');

      if (state.activeMarketplace === id && marketplaces.length > 0) {
        setState(prev => ({ ...prev, activeMarketplace: marketplaces[0].id }));
      }
    } catch (error) {
      toast.addToast(
        `Failed to remove marketplace: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    }
  };

  const handleAddProject = async () => {
    console.log('[handleAddProject] Starting folder selection...');
    const path = await selectProjectFolder();
    console.log('[handleAddProject] Selected path:', path);
    if (!path) {
      console.log('[handleAddProject] User cancelled');
      return;
    }

    try {
      console.log('[handleAddProject] Adding project with path:', path);
      const result = await addProjectMutation.mutateAsync({ path });
      console.log('[handleAddProject] Mutation result:', result);
      toast.addToast('Project added successfully', 'success');
    } catch (error) {
      console.error('[handleAddProject] Error:', error);
      toast.addToast(
        `Failed to add project: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    }
  };

  const handleSwitchProject = async (projectId: string) => {
    try {
      await switchProjectMutation.mutateAsync({ projectId });
      setIsProjectMenuOpen(false);
    } catch (error) {
      toast.addToast(
        `Failed to switch project: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    }
  };

  const handleRemoveProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!window.confirm("Remove this project?")) return;

    try {
      await removeProjectMutation.mutateAsync({ projectId });
      toast.addToast('Project removed successfully', 'success');
    } catch (error) {
      toast.addToast(
        `Failed to remove project: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    }
  };

  // --- Derived ---
  const activeProject = currentProject || projects.find(p => p.id === state.activeProjectId) || projects[0];

  const filteredPlugins = useMemo(() => {
    let result = plugins;

    // Filter by marketplace
    if (state.activeMarketplace) {
       result = result.filter(p => p.marketplace === state.activeMarketplace);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.keywords?.some(k => k.toLowerCase().includes(q))
      );
    }
    return result;
  }, [plugins, state.activeMarketplace, state.searchQuery]);

  const selectedPlugin = useMemo(() => plugins.find(p => p.id === state.selectedPluginId), [plugins, state.selectedPluginId]);

  const getMarketplaceUpdateCount = (marketplaceId: string) => {
    // Count plugins in this marketplace that have updates
    return plugins.filter(p => p.marketplace === marketplaceId && p.hasUpdate).length;
  };

  const getMarketplacePluginCount = (marketplaceId: string) => {
    // Count total plugins in this marketplace
    const count = plugins.filter(p => p.marketplace === marketplaceId).length;
    return `${count} plugin${count !== 1 ? 's' : ''}`;
  };

  // Loading state
  const isLoading = pluginsLoading || marketplacesLoading || projectsLoading || currentProjectLoading;
  console.log('[App] Loading states:', { pluginsLoading, marketplacesLoading, projectsLoading, currentProjectLoading, isLoading });
  console.log('[App] Data:', { currentProject, projectPlugins: projectPlugins?.length, marketplacesData: marketplacesData?.length, projectsData: projectsData?.length });
  if (isLoading) {
    return <LoadingSpinner message="Loading data..." />;
  }

  // Show welcome screen if no project selected
  if (!currentProject) {
    return <WelcomeScreen onAddProject={handleAddProject} />;
  }

  // Helper to extract error message from various error types
  const getErrorMessage = (error: unknown): string => {
    if (!error) return 'Unknown error';
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'object') {
      const err = error as Record<string, unknown>;
      if (err.message) return String(err.message);
      if (err.error) return String(err.error);
      try {
        return JSON.stringify(error);
      } catch {
        return 'Unknown error object';
      }
    }
    return String(error);
  };

  // Error state - show error if any critical data failed to load
  const hasError = pluginsError || marketplacesError || projectsError;
  if (hasError) {
    const errorMessage = pluginsError
      ? `Failed to load plugins: ${getErrorMessage(pluginsError)}`
      : marketplacesError
      ? `Failed to load marketplaces: ${getErrorMessage(marketplacesError)}`
      : `Failed to load projects: ${getErrorMessage(projectsError)}`;

    return (
      <ErrorDisplay
        message={errorMessage}
        onRetry={() => {
          refetchPlugins();
          refetchMarketplaces();
          refetchProjects();
        }}
      />
    );
  }

  // No data state
  if (plugins.length === 0 && marketplaces.length === 0) {
    return (
      <ErrorDisplay
        message="No plugins or marketplaces found. Add a marketplace to get started."
        onRetry={() => {
          refetchPlugins();
          refetchMarketplaces();
        }}
      />
    );
  }

  const getIcon = (name: string) => {
    switch (name) {
      case 'package': return <Package size={18} />;
      case 'chrome': return <Store size={18} />;
      case 'activity': return <Activity size={18} />;
      case 'globe': return <Globe size={18} />;
      case 'layout': return <Layout size={18} />;
      default: return <Package size={18} />;
    }
  }

  return (
    <div className="flex h-screen bg-bgBase text-textMain font-sans overflow-hidden select-none">

      {/* 1. LEFT SIDEBAR - PROJECT & MARKETPLACES */}
      <aside className="w-[240px] flex flex-col bg-bgBase border-r border-borderSubtle shrink-0">

        {/* Project Switcher Header */}
        <div ref={projectMenuRef} className="relative z-50">
          <button
            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
            className="w-full h-14 flex items-center justify-between px-4 border-b border-borderSubtle hover:bg-white/[0.02] transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-accent bg-accent/10 p-1.5 rounded-md shrink-0">
                <Folder size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-medium text-textMain truncate leading-tight">{activeProject?.name || 'No Project'}</span>
                <span className="text-[10px] text-textFaint truncate font-mono leading-tight opacity-70">
                  {activeProject?.path.split('/').pop() || '—'}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className={`text-textFaint transition-transform duration-200 ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isProjectMenuOpen && (
            <div className="absolute top-full left-2 right-2 mt-1 bg-bgSurface border border-borderSubtle rounded-lg shadow-float p-1 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100 origin-top">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-textFaint uppercase tracking-wider">Recent Projects</div>

              {projects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => handleSwitchProject(proj.id)}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded text-left transition-colors group relative ${
                    proj.id === activeProject?.id ? 'bg-accent/10 text-textMain' : 'hover:bg-white/5 text-textMuted hover:text-textMain'
                  }`}
                >
                  <History size={13} className={proj.id === activeProject?.id ? 'text-accent' : 'text-textFaint'} />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[12px] font-medium truncate">{proj.name}</span>
                    <span className="text-[10px] text-textFaint truncate">{proj.path}</span>
                  </div>
                  {proj.id === activeProject?.id && <Check size={12} className="text-accent" />}

                  {/* Delete Button */}
                  <div
                    onClick={(e) => handleRemoveProject(e, proj.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-500/20 text-textFaint hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Remove Project"
                  >
                    <Trash2 size={10} />
                  </div>
                </button>
              ))}

              <div className="h-px bg-borderSubtle my-1" />

              <button
                onClick={handleAddProject}
                className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-white/5 text-textMain text-left transition-colors"
              >
                <FolderOpen size={13} className="text-textFaint" />
                <span className="text-[12px] font-medium">Open Folder...</span>
              </button>
            </div>
          )}
        </div>

        {/* Marketplace List */}
        <div className="flex-1 py-2 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] font-semibold text-textFaint uppercase tracking-wider flex items-center justify-between">
            <span>Registries</span>
          </div>

          {marketplaces.map(mp => {
            const updateCount = getMarketplaceUpdateCount(mp.id);
            const isActive = state.activeMarketplace === mp.id;

            return (
              <button
                key={mp.id}
                onClick={() => setState(prev => ({ ...prev, activeMarketplace: mp.id }))}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all border-l-2 group relative ${
                  isActive
                    ? 'bg-white/[0.03] border-accent text-textMain'
                    : 'border-transparent text-textMuted hover:text-textMain hover:bg-white/[0.02]'
                }`}
              >
                <div className={`relative ${isActive ? 'text-accent' : 'text-textFaint'}`}>
                  {getIcon(mp.icon)}
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[13px] font-medium leading-none mb-1 truncate">{mp.name}</span>
                    {updateCount > 0 && (
                      <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-accent text-[9px] font-bold text-white shadow-glow">
                        {updateCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-textFaint leading-none">{getMarketplacePluginCount(mp.id)}</span>
                </div>

                {/* Delete Button (Hidden unless hover) */}
                <div
                   onClick={(e) => handleRemoveMarketplace(e, mp.id)}
                   className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-red-500/20 text-textFaint hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                   title="Remove Registry"
                >
                   <Trash2 size={12} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Add Marketplace Footer */}
        <div className="p-3 border-t border-borderSubtle mt-auto">
          <button
             onClick={handleAddMarketplace}
             className="w-full flex items-center justify-center gap-2 py-2 rounded border border-dashed border-borderSubtle text-textMuted hover:text-textMain hover:bg-white/5 hover:border-textFaint transition-all text-[12px]"
          >
            <Plus size={14} />
            <span>Add Registry</span>
          </button>
        </div>

      </aside>

      {/* 2. MIDDLE COLUMN - PLUGIN LIST */}
      <div className="w-[380px] flex flex-col bg-bgBase border-r border-borderSubtle shrink-0">

        {/* Search Header */}
        <div className="h-14 flex items-center px-4 shrink-0 border-b border-borderSubtle">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textFaint" size={15} />
            <input
              type="text"
              placeholder={`Search in ${marketplaces.find(m => m.id === state.activeMarketplace)?.name}...`}
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full bg-bgSidebar border border-borderSubtle rounded-[4px] pl-9 pr-3 py-1.5 text-[13px] text-textMain placeholder:text-textFaint focus:outline-none focus:border-borderFocus transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPlugins.map(plugin => (
            <PluginRow
              key={plugin.id}
              plugin={plugin}
              selected={state.selectedPluginId === plugin.id}
              onClick={() => setState(prev => ({ ...prev, selectedPluginId: plugin.id }))}
            />
          ))}
          {filteredPlugins.length === 0 && (
             <div className="flex flex-col items-center justify-center h-40 text-textFaint">
                <Package size={24} className="mb-2 opacity-50" />
                <span className="text-xs">No plugins found</span>
             </div>
          )}
        </div>

        {/* Footer Handle */}
        <div className="h-4 flex items-center justify-center border-t border-borderSubtle cursor-ns-resize hover:bg-white/5 bg-bgBase">
             <div className="w-10 h-1 rounded-full bg-borderSubtle"></div>
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR - DETAILS */}
      <main className="flex-1 flex flex-col bg-bgSidebar min-w-0 relative z-10">
        <RightSidebar
          plugin={selectedPlugin}
          onUpdatePlugin={handlePluginUpdate}
          projectPath={currentProject?.path}
        />

        {/* Help Button */}
        <div className="absolute bottom-6 right-6">
          <button className="w-8 h-8 rounded-full bg-bgSurface border border-borderSubtle flex items-center justify-center text-textMuted hover:text-textMain shadow-lg hover:bg-bgSurfaceHover transition-all">
            <HelpCircle size={16} />
          </button>
        </div>
      </main>

    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppContent />
        <ToastContainer />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;

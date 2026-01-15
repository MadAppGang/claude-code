import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types.js';

interface ProjectsStorage {
  version: 1;
  currentProjectId: string | null;
  projects: Project[];
}

const STORAGE_KEY = 'claudeup-gui:projects';

// Default empty state
const DEFAULT_STORAGE: ProjectsStorage = {
  version: 1,
  currentProjectId: null,
  projects: [],
};

export const ProjectStorage = {
  // Load projects from localStorage
  load(): ProjectsStorage {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return DEFAULT_STORAGE;

      const parsed = JSON.parse(data) as ProjectsStorage;

      // Validate schema
      if (parsed.version !== 1) {
        console.warn('Unknown storage version, resetting');
        return DEFAULT_STORAGE;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load projects:', error);
      return DEFAULT_STORAGE;
    }
  },

  // Save projects to localStorage
  save(storage: ProjectsStorage): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to save projects:', error);
      throw new Error('Failed to save projects to storage');
    }
  },

  // Add new project
  addProject(path: string, name?: string): Project {
    const storage = this.load();

    // Check if project already exists
    const existing = storage.projects.find(p => p.path === path);
    if (existing) {
      // Update lastOpened and set as current
      existing.lastOpened = new Date().toISOString();
      storage.currentProjectId = existing.id;
      this.save(storage);
      return existing;
    }

    // Create new project
    const folderName = path.split('/').pop() || 'Unknown';
    const project: Project = {
      id: uuidv4(),
      name: name || folderName,
      path,
      lastOpened: new Date().toISOString(),
    };

    storage.projects.push(project);
    storage.currentProjectId = project.id; // Auto-switch to new project
    this.save(storage);

    return project;
  },

  // Switch current project
  setCurrentProject(projectId: string): void {
    const storage = this.load();
    const project = storage.projects.find(p => p.id === projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Update lastOpened timestamp
    project.lastOpened = new Date().toISOString();
    storage.currentProjectId = projectId;
    this.save(storage);
  },

  // Get current project
  getCurrentProject(): Project | null {
    const storage = this.load();
    if (!storage.currentProjectId) return null;

    return storage.projects.find(p => p.id === storage.currentProjectId) || null;
  },

  // Get all projects sorted by lastOpened
  getProjects(): Project[] {
    const storage = this.load();
    return [...storage.projects].sort((a, b) =>
      new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
    );
  },

  // Remove project
  removeProject(projectId: string): void {
    const storage = this.load();
    storage.projects = storage.projects.filter(p => p.id !== projectId);

    // If removed project was current, clear selection
    if (storage.currentProjectId === projectId) {
      storage.currentProjectId = null;
    }

    this.save(storage);
  },
};

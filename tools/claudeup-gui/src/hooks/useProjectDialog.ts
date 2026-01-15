import { open } from '@tauri-apps/plugin-dialog';
import { homeDir } from '@tauri-apps/api/path';

export function useProjectDialog() {
  const selectProjectFolder = async (): Promise<string | null> => {
    try {
      const defaultPath = await homeDir();
      const result = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Folder',
        defaultPath,
      });

      // Result can be string (path) or null (cancelled)
      if (typeof result === 'string') {
        return result;
      }
      return null;
    } catch (error) {
      console.error('Failed to open folder dialog:', error);
      throw new Error('Failed to open folder selection dialog');
    }
  };

  return { selectProjectFolder };
}

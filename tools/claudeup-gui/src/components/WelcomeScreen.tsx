import React from 'react';
import { FolderOpen, Plus } from 'lucide-react';

interface WelcomeScreenProps {
  onAddProject: () => Promise<void>;
  isLoading?: boolean;
}

export function WelcomeScreen({ onAddProject, isLoading = false }: WelcomeScreenProps) {
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAddProject = async () => {
    setIsAdding(true);
    try {
      await onAddProject();
    } catch (error) {
      console.error('Failed to add project:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bgBase text-textMain">
      <div className="max-w-md text-center space-y-6 p-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <FolderOpen size={40} className="text-accent" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-textMain">
          Welcome to claudeup
        </h1>

        {/* Description */}
        <p className="text-textMuted text-sm leading-relaxed">
          Get started by selecting a project folder. Your plugins and settings
          will be stored per-project.
        </p>

        {/* CTA Button */}
        <button
          onClick={handleAddProject}
          disabled={isAdding || isLoading}
          className="w-full py-3 px-4 bg-accent hover:bg-accent/90 disabled:bg-accent/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isAdding || isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Opening...</span>
            </>
          ) : (
            <>
              <Plus size={18} />
              <span>Select Project Folder</span>
            </>
          )}
        </button>

        {/* Help Text */}
        <p className="text-textFaint text-xs">
          Tip: You can switch projects anytime from the top-left corner
        </p>
      </div>
    </div>
  );
}

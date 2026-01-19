import React from 'react';
import { Plugin } from '../../types';
import { Zap, Terminal, Box, ArrowUpCircle, CheckCircle } from 'lucide-react';

interface PluginRowProps {
  plugin: Plugin;
  selected: boolean;
  onClick: () => void;
}

// Category Color Mapping
const getCategoryColor = (cat: string) => {
  switch (cat) {
    case 'development': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'media': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'workflow': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'content': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    default: return 'bg-white/5 text-textMuted border-white/10';
  }
};

const PluginRow: React.FC<PluginRowProps> = ({ plugin, selected, onClick }) => {
  const isInstalled = !!plugin.installedVersion;

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col justify-center gap-1.5 px-4 py-3 border-b border-borderSubtle cursor-pointer transition-colors ${
        selected
          ? 'bg-bgSurface/40'
          : 'bg-bgBase hover:bg-bgSurface/20'
      }`}
    >
      {/* Line 1: Name, Badge, Status */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[13px] font-semibold text-textMain truncate">{plugin.name}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0 rounded border uppercase tracking-wider ${getCategoryColor(plugin.category)}`}>
            {plugin.category}
          </span>
        </div>

        {/* Status Badge */}
        <div className="shrink-0 ml-2">
          {plugin.hasUpdate ? (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent">
              <ArrowUpCircle size={10} /> Update
            </span>
          ) : isInstalled ? (
            plugin.enabled ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <CheckCircle size={10} /> v{plugin.installedVersion}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-textFaint">
                Disabled
              </span>
            )
          ) : (
            <span className="text-[10px] font-medium text-textFaint border border-white/5 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Get
            </span>
          )}
        </div>
      </div>

      {/* Line 2: Description + Capabilities */}
      <div className="flex items-center justify-between min-w-0 gap-3">
        <p className="text-[11px] text-textMuted truncate flex-1">
          {plugin.description}
        </p>

        <div className="flex items-center gap-2 text-[10px] text-textFaint shrink-0">
          {(plugin.agents?.length || 0) > 0 && (
             <div className="flex items-center gap-1" title="Agents">
                <Box size={10} className="text-blue-400/70" />
                <span>{plugin.agents?.length}</span>
             </div>
          )}
          {(plugin.commands?.length || 0) > 0 && (
             <div className="flex items-center gap-1" title="Slash Commands">
                <Terminal size={10} className="text-emerald-400/70" />
                <span>{plugin.commands?.length}</span>
             </div>
          )}
          {(plugin.skills?.length || 0) > 0 && (
             <div className="flex items-center gap-1" title="Skills">
                <Zap size={10} className="text-amber-400/70" />
                <span>{plugin.skills?.length}</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PluginRow;

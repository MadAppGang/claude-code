import type { StatusLineConfig } from '../types/index.js';

export interface StatusLineCategory {
  name: string;
  color: string;
  presets: StatusLineConfig[];
}

export const statusLineCategories: StatusLineCategory[] = [
  {
    name: '🎨 Color Themes',
    color: 'magenta',
    presets: [
      {
        name: '🌸 Catppuccin',
        description: 'Soothing pastel (most popular 2024)',
        template: '* {model} | {git_branch} | {input_tokens}v {output_tokens}^ | ${cost} | {cwd}',
      },
      {
        name: '🧛 Dracula',
        description: 'Classic dark with purple vibes',
        template: '{model} > {git_branch} > {input_tokens}v {output_tokens}^ > ${cost} > {cwd}',
      },
      {
        name: '❄️ Nord',
        description: 'Arctic, bluish & clean',
        template: '~ {model} | {git_branch} | {input_tokens}< {output_tokens}> | ${cost} | {cwd}',
      },
      {
        name: '🍂 Gruvbox',
        description: 'Warm retro terminal feel',
        template: '>> {model} :: {git_branch} :: {input_tokens}v {output_tokens}^ :: ${cost} :: {cwd}',
      },
      {
        name: '🌃 Tokyo Night',
        description: 'Neon city vibes',
        template: '> {model} | {git_branch} | {input_tokens}v {output_tokens}^ | ${cost} | {cwd}',
      },
      {
        name: '🌹 Rose Pine',
        description: 'Soft, romantic & elegant',
        template: '@ {model} : {git_branch} : {input_tokens}v {output_tokens}^ : ${cost} : {cwd}',
      },
    ],
  },
  {
    name: '🚀 Shell Prompts',
    color: 'cyan',
    presets: [
      {
        name: '⭐ Starship',
        description: 'Blazing fast, minimal & smart',
        template: '-> {model} | {git_branch} | {input_tokens}v {output_tokens}^ | ${cost} | {cwd}',
      },
      {
        name: '⚡ Powerline',
        description: 'Classic powerline segments',
        template: '{model} > {git_branch} > {input_tokens}v {output_tokens}^ > ${cost} > {cwd}',
      },
    ],
  },
  {
    name: '💻 Developer',
    color: 'green',
    presets: [
      {
        name: '🖥️ Hacker',
        description: 'Matrix-inspired with all metrics',
        template: '[{model}] [{git_branch}] [v{input_tokens} ^{output_tokens}] [${cost}] [{cwd}]',
      },
      {
        name: '🔧 DevOps',
        description: 'Infrastructure-focused',
        template: '# {model} | {git_branch} | {input_tokens}/{output_tokens} | ${cost} | {cwd}',
      },
      {
        name: '📊 Metrics',
        description: 'Data-focused with stats',
        template: '* {model} | {session_duration} | v{input_tokens} ^{output_tokens} | ${cost}',
      },
      {
        name: '🌿 Git First',
        description: 'Branch name prominent',
        template: '[{git_branch}] {model} | ${cost} | {cwd}',
      },
    ],
  },
  {
    name: '✨ Minimal',
    color: 'white',
    presets: [
      {
        name: '🧘 Zen',
        description: 'Minimalist & distraction-free',
        template: '{model_short} - ${cost}',
      },
      {
        name: '💎 Clean',
        description: 'Simple & elegant',
        template: '{model} -- ${cost} -- {cwd}',
      },
      {
        name: '➡️ Arrow',
        description: 'Compact with direction',
        template: '> {model} > ${cost} > {git_branch}',
      },
    ],
  },
  {
    name: '🎮 Fun',
    color: 'yellow',
    presets: [
      {
        name: '👾 Retro',
        description: '8-bit gaming aesthetic',
        template: '[ {model} ] * {git_branch} * v{input_tokens} ^{output_tokens} * ${cost}',
      },
      {
        name: '📦 Brackets',
        description: 'Everything in brackets',
        template: '[{model}] [{git_branch}] [in:{input_tokens}] [out:{output_tokens}] [${cost}] [{cwd}]',
      },
      {
        name: '🔀 Pipes',
        description: 'Unix pipe style',
        template: '{model} | {git_branch} | in:{input_tokens} out:{output_tokens} | ${cost} | {cwd}',
      },
    ],
  },
  {
    name: '📱 Compact',
    color: 'blue',
    presets: [
      {
        name: '🔬 Micro',
        description: 'Ultra-compact essentials',
        template: '{model_short} ${cost}',
      },
      {
        name: '〉Chevron',
        description: 'Chevron separators',
        template: '{model_short} > ${cost} > {git_branch}',
      },
    ],
  },
  {
    name: '⏱️ Time',
    color: 'red',
    presets: [
      {
        name: '⏰ Timer',
        description: 'Session time focused',
        template: '[{session_duration}] {model} | v{input_tokens} ^{output_tokens} | ${cost}',
      },
      {
        name: '📅 Session',
        description: 'Full session overview',
        template: '{model} | {session_duration} | {input_tokens}/{output_tokens} | ${cost} | {cwd}',
      },
    ],
  },
];

// Flatten for backward compatibility
export const statusLinePresets: StatusLineConfig[] = statusLineCategories.flatMap(cat => cat.presets);

export function getStatusLineByName(name: string): StatusLineConfig | undefined {
  return statusLinePresets.find((s) => s.name === name);
}

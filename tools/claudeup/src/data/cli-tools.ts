export interface CliTool {
  name: string;
  displayName: string;
  description: string;
  installCommand: string;
  checkCommand: string;
  website: string;
  category: 'ai-coding' | 'utility';
  packageManager: 'npm' | 'pip';
  packageName: string;
}

export const cliTools: CliTool[] = [
  {
    name: 'claude',
    displayName: 'Claude Code',
    description: 'Anthropic official agentic coding tool',
    installCommand: 'npm install -g @anthropic-ai/claude-code',
    checkCommand: 'claude --version',
    website: 'https://claude.ai/code',
    category: 'ai-coding',
    packageManager: 'npm',
    packageName: '@anthropic-ai/claude-code',
  },
  {
    name: 'claudish',
    displayName: 'Claudish',
    description: 'Run Claude Code with OpenRouter models (Grok, GPT-5, Gemini)',
    installCommand: 'npm install -g claudish',
    checkCommand: 'claudish --version',
    website: 'https://github.com/MadAppGang/claudish',
    category: 'ai-coding',
    packageManager: 'npm',
    packageName: 'claudish',
  },
  {
    name: 'codex',
    displayName: 'OpenAI Codex',
    description: 'Lightweight coding agent from OpenAI that runs in your terminal',
    installCommand: 'npm install -g @openai/codex',
    checkCommand: 'codex --version',
    website: 'https://github.com/openai/codex',
    category: 'ai-coding',
    packageManager: 'npm',
    packageName: '@openai/codex',
  },
  {
    name: 'gemini',
    displayName: 'Gemini CLI',
    description: 'Google AI agent with 1M token context, free tier available',
    installCommand: 'npm install -g @google/gemini-cli',
    checkCommand: 'gemini --version',
    website: 'https://github.com/google-gemini/gemini-cli',
    category: 'ai-coding',
    packageManager: 'npm',
    packageName: '@google/gemini-cli',
  },
  {
    name: 'qwen',
    displayName: 'Qwen Code',
    description: 'Alibaba coding agent optimized for Qwen3-Coder models',
    installCommand: 'npm install -g @qwen-code/qwen-code',
    checkCommand: 'qwen --version',
    website: 'https://github.com/QwenLM/qwen-code',
    category: 'ai-coding',
    packageManager: 'npm',
    packageName: '@qwen-code/qwen-code',
  },
  {
    name: 'cline',
    displayName: 'Cline',
    description: 'Autonomous coding agent with plan & act, checkpoints, browser use',
    installCommand: 'npm install -g cline',
    checkCommand: 'cline --version',
    website: 'https://cline.bot',
    category: 'ai-coding',
    packageManager: 'npm',
    packageName: 'cline',
  },
  {
    name: 'opencode',
    displayName: 'OpenCode',
    description: 'Open source AI coding agent trusted by 400k+ developers',
    installCommand: 'npm install -g opencode-ai',
    checkCommand: 'opencode --version',
    website: 'https://opencode.ai',
    category: 'ai-coding',
    packageManager: 'npm',
    packageName: 'opencode-ai',
  },
  {
    name: 'aider',
    displayName: 'Aider',
    description: 'AI pair programming - works with Claude, GPT-4, local models',
    installCommand: 'pip install aider-install && aider-install',
    checkCommand: 'aider --version',
    website: 'https://aider.chat',
    category: 'ai-coding',
    packageManager: 'pip',
    packageName: 'aider-chat',
  },
];

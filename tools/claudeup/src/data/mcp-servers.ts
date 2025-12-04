import type { McpServer } from '../types/index.js';

export const curatedMcpServers: McpServer[] = [
  // ═══════════════════════════════════════════════════════════════
  // BROWSER & AUTOMATION
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'chrome-devtools',
    description: 'Control Chrome browser, inspect DOM, debug JavaScript, capture screenshots',
    command: 'npx',
    args: ['chrome-devtools-mcp@latest'],
    category: 'browser',
    requiresConfig: false,
  },
  {
    name: 'puppeteer',
    description: 'Headless browser automation for testing and scraping',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-puppeteer'],
    category: 'browser',
    requiresConfig: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // AI & SEARCH
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'claude-context',
    description: 'Semantic code search with vector embeddings (Zilliz/Milvus)',
    command: 'npx',
    args: ['@zilliz/claude-context-mcp@latest'],
    env: {
      OPENAI_API_KEY: '${OPENAI_API_KEY}',
      MILVUS_ADDRESS: '${MILVUS_ADDRESS}',
      MILVUS_TOKEN: '${MILVUS_TOKEN}',
    },
    category: 'ai',
    requiresConfig: true,
    configFields: [
      {
        name: 'OPENAI_API_KEY',
        label: 'OpenAI API Key (for embeddings)',
        type: 'string',
        required: true,
        envVar: 'OPENAI_API_KEY',
      },
      {
        name: 'MILVUS_ADDRESS',
        label: 'Zilliz Cloud Public Endpoint',
        type: 'url',
        required: true,
        envVar: 'MILVUS_ADDRESS',
      },
      {
        name: 'MILVUS_TOKEN',
        label: 'Zilliz Cloud API Key',
        type: 'string',
        required: true,
        envVar: 'MILVUS_TOKEN',
      },
    ],
  },
  {
    name: 'exa',
    description: 'AI-powered web search with neural search capabilities',
    type: 'http',
    url: 'https://mcp.exa.ai/mcp',
    category: 'ai',
    requiresConfig: false,
  },
  {
    name: 'sequential-thinking',
    description: 'Enhanced reasoning with step-by-step thinking',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-sequential-thinking'],
    category: 'ai',
    requiresConfig: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // DESIGN & CREATIVE
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'figma',
    description: 'Access Figma designs, components, and design tokens',
    type: 'http',
    url: 'https://mcp.figma.com/mcp',
    category: 'design',
    requiresConfig: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // CLOUD & INFRASTRUCTURE (AWS)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'aws-kb-retrieval',
    description: 'AWS Bedrock Knowledge Base retrieval and RAG',
    command: 'uvx',
    args: ['awslabs.aws-kb-retrieval-mcp-server@latest'],
    env: {
      AWS_PROFILE: '${AWS_PROFILE}',
      AWS_REGION: '${AWS_REGION}',
    },
    category: 'cloud',
    requiresConfig: true,
    configFields: [
      {
        name: 'AWS_PROFILE',
        label: 'AWS Profile Name',
        type: 'string',
        required: false,
        default: 'default',
        envVar: 'AWS_PROFILE',
      },
      {
        name: 'AWS_REGION',
        label: 'AWS Region',
        type: 'string',
        required: true,
        default: 'us-east-1',
        envVar: 'AWS_REGION',
      },
    ],
  },
  {
    name: 'aws-cdk',
    description: 'AWS CDK infrastructure as code assistance',
    command: 'uvx',
    args: ['awslabs.cdk-mcp-server@latest'],
    env: {
      AWS_PROFILE: '${AWS_PROFILE}',
      AWS_REGION: '${AWS_REGION}',
    },
    category: 'cloud',
    requiresConfig: true,
    configFields: [
      {
        name: 'AWS_PROFILE',
        label: 'AWS Profile Name',
        type: 'string',
        required: false,
        default: 'default',
        envVar: 'AWS_PROFILE',
      },
      {
        name: 'AWS_REGION',
        label: 'AWS Region',
        type: 'string',
        required: true,
        default: 'us-east-1',
        envVar: 'AWS_REGION',
      },
    ],
  },
  {
    name: 'aws-cloudwatch-logs',
    description: 'Query and analyze AWS CloudWatch Logs',
    command: 'uvx',
    args: ['awslabs.cloudwatch-logs-mcp-server@latest'],
    env: {
      AWS_PROFILE: '${AWS_PROFILE}',
      AWS_REGION: '${AWS_REGION}',
    },
    category: 'cloud',
    requiresConfig: true,
    configFields: [
      {
        name: 'AWS_PROFILE',
        label: 'AWS Profile Name',
        type: 'string',
        required: false,
        default: 'default',
        envVar: 'AWS_PROFILE',
      },
      {
        name: 'AWS_REGION',
        label: 'AWS Region',
        type: 'string',
        required: true,
        default: 'us-east-1',
        envVar: 'AWS_REGION',
      },
    ],
  },
  {
    name: 'aws-cost-analysis',
    description: 'AWS cost analysis and optimization recommendations',
    command: 'uvx',
    args: ['awslabs.cost-analysis-mcp-server@latest'],
    env: {
      AWS_PROFILE: '${AWS_PROFILE}',
      AWS_REGION: '${AWS_REGION}',
    },
    category: 'cloud',
    requiresConfig: true,
    configFields: [
      {
        name: 'AWS_PROFILE',
        label: 'AWS Profile Name',
        type: 'string',
        required: false,
        default: 'default',
        envVar: 'AWS_PROFILE',
      },
      {
        name: 'AWS_REGION',
        label: 'AWS Region',
        type: 'string',
        required: true,
        default: 'us-east-1',
        envVar: 'AWS_REGION',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // DATABASE
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'postgres',
    description: 'Query PostgreSQL databases with read-only access',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-postgres'],
    env: {
      DATABASE_URL: '${DATABASE_URL}',
    },
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'DATABASE_URL',
        label: 'PostgreSQL Connection URL',
        type: 'url',
        required: true,
        envVar: 'DATABASE_URL',
      },
    ],
  },
  {
    name: 'sqlite',
    description: 'Query SQLite databases locally',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-sqlite', '${DATABASE_PATH}'],
    category: 'database',
    requiresConfig: true,
    configFields: [
      {
        name: 'DATABASE_PATH',
        label: 'SQLite Database File Path',
        type: 'path',
        required: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // DEVELOPER TOOLS
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'github',
    description: 'Manage GitHub repos, issues, PRs, and actions',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-github'],
    env: {
      GITHUB_TOKEN: '${GITHUB_TOKEN}',
    },
    category: 'dev-tools',
    requiresConfig: true,
    configFields: [
      {
        name: 'GITHUB_TOKEN',
        label: 'GitHub Personal Access Token',
        type: 'string',
        required: true,
        envVar: 'GITHUB_TOKEN',
      },
    ],
  },
  {
    name: 'gitlab',
    description: 'Manage GitLab repos, merge requests, and pipelines',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-gitlab'],
    env: {
      GITLAB_TOKEN: '${GITLAB_TOKEN}',
      GITLAB_URL: '${GITLAB_URL}',
    },
    category: 'dev-tools',
    requiresConfig: true,
    configFields: [
      {
        name: 'GITLAB_TOKEN',
        label: 'GitLab Personal Access Token',
        type: 'string',
        required: true,
        envVar: 'GITLAB_TOKEN',
      },
      {
        name: 'GITLAB_URL',
        label: 'GitLab URL (self-hosted)',
        type: 'url',
        required: false,
        default: 'https://gitlab.com',
        envVar: 'GITLAB_URL',
      },
    ],
  },
  {
    name: 'filesystem',
    description: 'Read, write, and search files in allowed directories',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-filesystem', '${ALLOWED_PATH}'],
    category: 'dev-tools',
    requiresConfig: true,
    configFields: [
      {
        name: 'ALLOWED_PATH',
        label: 'Allowed Directory Path',
        type: 'path',
        required: true,
        default: '.',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PRODUCTIVITY
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'slack',
    description: 'Send messages and interact with Slack channels',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-slack'],
    env: {
      SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}',
    },
    category: 'productivity',
    requiresConfig: true,
    configFields: [
      {
        name: 'SLACK_BOT_TOKEN',
        label: 'Slack Bot Token (xoxb-...)',
        type: 'string',
        required: true,
        envVar: 'SLACK_BOT_TOKEN',
      },
    ],
  },
  {
    name: 'google-drive',
    description: 'Access and search Google Drive files',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-google-drive'],
    category: 'productivity',
    requiresConfig: true,
    configFields: [
      {
        name: 'GOOGLE_CREDENTIALS',
        label: 'Google OAuth Credentials JSON Path',
        type: 'path',
        required: true,
        envVar: 'GOOGLE_APPLICATION_CREDENTIALS',
      },
    ],
  },
  {
    name: 'memory',
    description: 'Persistent memory storage across conversations',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-memory'],
    category: 'productivity',
    requiresConfig: false,
  },
  {
    name: 'fetch',
    description: 'Make HTTP requests to external APIs',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-fetch'],
    category: 'productivity',
    requiresConfig: false,
  },
];

export function getMcpServersByCategory(): Record<string, McpServer[]> {
  const categories: Record<string, McpServer[]> = {};
  for (const server of curatedMcpServers) {
    if (!categories[server.category]) {
      categories[server.category] = [];
    }
    categories[server.category].push(server);
  }
  return categories;
}

export const categoryOrder = [
  'browser',
  'ai',
  'design',
  'dev-tools',
  'cloud',
  'database',
  'productivity',
];

export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    browser: '🌐 Browser & Automation',
    ai: '🤖 AI & Search',
    design: '🎨 Design & Creative',
    'dev-tools': '🛠️  Developer Tools',
    cloud: '☁️  Cloud & Infrastructure',
    database: '🗄️  Database',
    productivity: '📋 Productivity',
  };
  return names[category] || category;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    browser: '🌐',
    ai: '🤖',
    design: '🎨',
    'dev-tools': '🛠️',
    cloud: '☁️',
    database: '🗄️',
    productivity: '📋',
  };
  return icons[category] || '📦';
}

export function getAllMcpServers(): McpServer[] {
  return curatedMcpServers;
}

import type { McpRegistryServer, McpRegistryResponse } from '../types/index.js';

// Official Model Context Protocol Registry
// API Docs: https://registry.modelcontextprotocol.io
const MCP_REGISTRY_API = 'https://registry.modelcontextprotocol.io/v0';

export interface SearchOptions {
  query?: string;
  limit?: number;
  cursor?: string;
}

export async function searchMcpServers(options: SearchOptions = {}): Promise<McpRegistryResponse> {
  const { query = '', limit = 20, cursor } = options;

  const params = new URLSearchParams();
  if (query) params.set('query', query);
  params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);

  const url = `${MCP_REGISTRY_API}/servers?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`MCP Registry API error: ${response.status} ${response.statusText}`);
  }

  const data: any = await response.json();

  // The official registry returns data in a nested format:
  // { servers: [{ server: {...}, _meta: {...} }] }
  // Convert it to match our expected McpRegistryResponse format
  const servers: McpRegistryServer[] = (data.servers || [])
    .map((item: any) => {
      const server = item.server || item; // Handle both nested and flat structures
      const meta = item._meta?.['io.modelcontextprotocol.registry/official'];

      // Get URL from remotes (HTTP) or construct from packages
      let url = '';
      if (server.remotes?.length > 0) {
        url = server.remotes[0].url;
      } else if (server.packages?.length > 0) {
        // For package-based servers, use the package identifier as reference
        const pkg = server.packages[0];
        url = `${pkg.registryType}:${pkg.identifier}`;
      }

      return {
        name: server.name,
        url,
        short_description: server.description || 'No description',
        version: server.version,
        source_code_url: server.repository?.url,
        package_registry: server.packages?.[0]?.registryType,
        published_at: meta?.publishedAt,
      };
    })
    // Filter out servers without name or URL
    .filter((s: McpRegistryServer) => s.name && s.url)
    // Sort by publish date (newest first)
    .sort((a: McpRegistryServer, b: McpRegistryServer) => {
      if (!a.published_at) return 1;
      if (!b.published_at) return -1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

  return {
    servers,
    next_cursor: data.metadata?.nextCursor || data.next_cursor,
  };
}

export async function getPopularServers(limit = 20): Promise<McpRegistryServer[]> {
  const response = await searchMcpServers({ limit });
  // Already sorted by publish date in searchMcpServers
  return response.servers;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

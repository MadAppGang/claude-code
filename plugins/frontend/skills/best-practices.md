# Best Practices for Development

This skill provides production-ready best practices for building SPA React applications. Use this guidance when implementing features, reviewing code, or making architectural decisions.

## Stack Overview

- **React 19** with React Compiler (auto-memoization)
- **TypeScript** (strict mode)
- **Vite** (bundler)
- **Biome** (formatting + linting)
- **TanStack Query** (server state)
- **TanStack Router** (file-based routing)
- **Vitest** (testing with jsdom)
- **Apidog MCP** (API spec source of truth)

## Project Structure

```
/src
  /app/               # App shell, providers, global styles
  /routes/            # TanStack Router file-based routes
  /components/        # Reusable, pure UI components (no data-fetch)
  /features/          # Feature folders (UI + hooks local to a feature)
  /api/               # Generated API types & client (from OpenAPI)
  /lib/               # Utilities (zod schemas, date, formatting, etc.)
  /test/              # Test utilities
```

**Key Principles:**
- One responsibility per file
- UI components don't fetch server data
- Put queries/mutations in feature hooks
- Co-locate tests next to files

## Tooling Configuration

### 1. Vite + React 19 + React Compiler

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        // React Compiler must run first:
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
})
```

**Verify:** Check DevTools for "Memo ✨" badge on optimized components.

### 2. TypeScript (strict + bundler mode)

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client", "vitest"]
  },
  "include": ["src", "vitest-setup.ts"]
}
```

### 3. Biome (formatter + linter)

```bash
npx @biomejs/biome init
npx @biomejs/biome check --write .
```

```json
// biome.json
{
  "formatter": { "enabled": true, "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "style": { "noUnusedVariables": "error" }
    }
  }
}
```

### 4. Environment Variables

- Read via `import.meta.env`
- Prefix all app-exposed vars with `VITE_`
- Never place secrets in the client bundle

## Testing Setup (Vitest)

```typescript
// vitest-setup.ts
import '@testing-library/jest-dom/vitest'

// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
    coverage: { reporter: ['text', 'html'] }
  }
})
```

- Use React Testing Library for DOM assertions
- Use msw for API mocks
- Add `types: ["vitest", "vitest/jsdom"]` for jsdom globals

## React 19 Guidelines

### Compiler-Friendly Code

- Keep components pure and props serializable
- Derive values during render (don't stash in refs unnecessarily)
- Keep event handlers inline unless they close over large mutable objects
- Verify compiler is working (DevTools ✨)
- Opt-out problematic components with `"use no memo"` while refactoring

### Actions & Forms

For SPA mutations, choose one per feature:
- **React 19 Actions:** `<form action={fn}>`, `useActionState`, `useOptimistic`
- **TanStack Query:** `useMutation`

Don't duplicate logic between both approaches.

### `use` Hook

- Primarily useful with Suspense/data primitives and RSC
- For SPA-only apps, prefer Query + Router loaders

## Routing (TanStack Router)

### Installation

```bash
pnpm add @tanstack/react-router
pnpm add -D @tanstack/router-plugin
```

```typescript
// vite.config.ts
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
})
```

### Bootstrap

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })
declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode><RouterProvider router={router} /></StrictMode>
)
```

### File-Based Routes

```
src/routes/__root.tsx      // layout (Outlet, providers)
src/routes/index.tsx       // "/"
src/routes/users/index.tsx // "/users"
src/routes/users/$id.tsx   // "/users/:id"
```

- Supports typed search params (JSON-first)
- Validate at route boundaries

## Server State (TanStack Query)

### Client Setup

```typescript
// src/app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,          // set per-query
      gcTime: 5 * 60_000,    // v5: formerly cacheTime
      retry: 1,
    },
  },
})

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

### Best Practices

1. **Key Factories:** Define `queryKey` helpers (as const) per resource
   ```typescript
   export const usersKeys = {
     all: ['users'] as const,
     detail: (id: string) => [...usersKeys.all, id] as const,
   }
   ```

2. **Cache Timing:**
   - `staleTime`: Controls when data becomes "stale" (triggers background refetch)
   - `gcTime`: Controls how long inactive caches stay before garbage-collected
   - Tune them explicitly per query

3. **Mutations:**
   - Use `useMutation` with `onSuccess` invalidations or targeted updates
   - Consider optimistic updates when UX benefits

4. **Prefetch with Router:**
   - In route files, prefetch queries in a loader
   - Or on hover via Link preload
   - Ensures instant navigation

5. **Persisting Cache (Optional):**
   - If you persist, increase `gcTime` for hydration

## Router × Query Integration

### Route Loader + Query Prefetch

```typescript
// src/routes/users/$id.tsx
import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/app/queryClient'
import { usersKeys, fetchUser } from '@/features/users/queries'

export const Route = createFileRoute('/users/$id')({
  loader: async ({ params }) => {
    const id = params.id
    return queryClient.ensureQueryData({
      queryKey: usersKeys.detail(id),
      queryFn: () => fetchUser(id),
      staleTime: 30_000,
    })
  },
  component: UserPage,
})
```

**Benefits:**
- Loaders run before render, eliminating waterfall
- Fast SPA navigations
- Add Router & Query DevTools during development (auto-hide in production)

## API Integration (Apidog + MCP)

### Goal
The AI agent always uses the latest API.

### Process

1. **Expose OpenAPI from Apidog** (3.0/3.1 export or URL)

2. **Wire MCP:**
   ```json
   // mcp.json
   {
     "mcpServers": {
       "API specification": {
         "command": "npx",
         "args": ["-y", "apidog-mcp-server@latest", "--oas=https://your.domain/openapi.json"]
       }
     }
   }
   ```
   - Supports remote URL or local file
   - Multiple specs via multiple MCP entries

3. **Generate Types & Client** in `/src/api`:
   - Lightweight: hand-rolled fetch with zod parsing
   - Codegen: OpenAPI TS generator + import client

4. **Query Layer:**
   - Build `queryOptions`/mutation wrappers
   - Accept typed params, return parsed data
   - Keep all HTTP details under `/api`

## Performance, Accessibility, Security

### Performance
- **Code-splitting:** TanStack Router file-based routing + Vite `dynamic import()`
- **React Compiler first:** Keep components pure for auto-memoization
- **Images & assets:** Use Vite asset pipeline; prefer modern formats

### Accessibility
- Use semantic elements
- Test with RTL queries (by role/label)

### Security
- Never ship secrets
- Only `VITE_*` envs are exposed
- Validate all untrusted data at boundaries (server → zod parse)
- Pin/renovate deps; avoid known compromised packages
- Run CI with `--ignore-scripts` when possible

## Agent Execution Rules

**Always do this when you add or modify code:**

1. **API Spec:** Fetch latest via Apidog MCP and regenerate `/src/api` types if changed

2. **Data Access:** Wire only through feature hooks that wrap TanStack Query. Never fetch inside UI components.

3. **New Routes:**
   - Create file under `/src/routes/**` (file-based routing)
   - If needs data at navigation, add loader that prefetches with Query

4. **Server Mutations:**
   - Use React 19 Actions OR TanStack Query `useMutation` (choose one per feature)
   - Use optimistic UI via `useOptimistic` (Actions) or Query's optimistic updates
   - Invalidate/selectively update cache on success

5. **Compiler-Friendly:**
   - Keep code pure (pure components, minimal effects)
   - If compiler flags something, fix it or add `"use no memo"` temporarily

6. **Tests:**
   - Add Vitest tests for new logic
   - Component tests use RTL
   - Stub network with msw

7. **Before Committing:**
   - Run `biome check --write`
   - Ensure Vite build passes

## "Done" Checklist per PR

- [ ] Route file added/updated; loader prefetch (if needed) present
- [ ] Query keys are stable (`as const`), `staleTime`/`gcTime` tuned
- [ ] Component remains pure; no unnecessary effects; compiler ✨ visible
- [ ] API calls typed from `/src/api`; inputs/outputs validated at boundaries
- [ ] Tests cover new logic; Vitest jsdom setup passes
- [ ] `biome check --write` clean; Vite build ok

## Authoritative Sources

- **React 19 & Compiler:**
  - React v19 overview
  - React Compiler: overview + installation + verification
  - `<form action>` / Actions API; `useOptimistic`; `use`
  - CRA deprecation & guidance

- **Vite:**
  - Getting started; env & modes; TypeScript targets

- **TypeScript:**
  - `moduleResolution: "bundler"` (for bundlers like Vite)

- **Biome:**
  - Formatter/Linter configuration & CLI usage

- **TanStack Query:**
  - Caching & important defaults; v5 migration notes; devtools/persisting cache

- **TanStack Router:**
  - Install with Vite plugin; file-based routing; search params; devtools

- **Vitest:**
  - Getting started & config (jsdom)

- **Apidog + MCP:**
  - Apidog docs (import/export, OpenAPI); MCP server usage

## Final Notes

- Favor compile-friendly React patterns
- Let the compiler and Query/Router handle perf and data orchestration
- Treat Apidog's OpenAPI (via MCP) as the single source of truth for network shapes
- Keep this doc as your "contract"—don't add heavy frameworks or configs beyond what's here unless explicitly requested

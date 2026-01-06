# TanStack Skills Enhancement Research

**Session:** agentdev-tanstack-skills-enhancement-20260106-113916-431a
**Date:** January 6, 2026

## Research Findings

### TanStack Router - Latest Updates (2026)

**Key Features to Add:**

1. **Automatic Code Splitting** (New Pattern)
   ```ts
   // vite.config.ts
   tanstackRouter({
     autoCodeSplitting: true,
   })
   ```
   - Separates "critical route configuration" (loaders, validation) from "non-critical" (components)
   - Recommended approach for all new projects

2. **Virtual File Routes**
   - Alternative to physical file-based routing
   - Auto-generated virtual routes for lazy files
   - Delete empty route files - router auto-generates anchors

3. **`.lazy.tsx` Pattern (Manual Code Splitting)**
   ```tsx
   // Critical (posts.tsx)
   export const Route = createFileRoute('/posts')({
     loader: fetchPosts,
   })

   // Lazy (posts.lazy.tsx)
   export const Route = createLazyFileRoute('/posts')({
     component: Posts,
   })
   ```
   - Only supports: component, errorComponent, pendingComponent, notFoundComponent

4. **`getRouteApi` Helper** (Type-Safe Data Access)
   ```tsx
   const route = getRouteApi('/my-route')
   const loaderData = route.useLoaderData()
   ```
   - Access type-safe route data in separate files without importing route

5. **v2 Changes** (Upcoming)
   - Splat routes: `*` → `_splat` key
   - Some default value changes

6. **TanStack Start** (New Framework)
   - Full-stack framework using TanStack Router, Vite, Nitro, Vinxi
   - Alternative to Next.js and Remix
   - Stronger type safety and modularity

### TanStack Query v5 - Latest Patterns

**Already Comprehensive in Skill, Minor Additions:**

1. **Experimental Streaming** (`@tanstack/react-query-next-experimental`)
   - Skip prefetching, stream from server to client
   - `useSuspenseQuery` in Client Components

2. **Server Components Integration**
   - React Query still valuable for:
     - Client-side mutations
     - Background refetching
     - Optimistic updates
     - Real-time updates after initial load
   - "Think of Server Components as another framework loader"

3. **Retry Defaults for SSR**
   - Server: retry defaults to 0 (not 3)
   - Prevents retry loops on server

### Production Best Practices (2025-2026)

From [Swizec's 8 Months Production Experience](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/):

1. **File Structure = URL Structure**
   - Collocate everything page needs in page folder
   - Components/functions at nearest shared space in hierarchy

2. **Router Handles Loading/Error States**
   - Components focus on happy path
   - Suspense and pendingComponent at router level

3. **Recommended Stack (2026)**
   - TanStack Router + Query for custom Vite apps
   - Type safety investment pays off at scale

### Sources

- [TanStack Router Docs - File-Based Routing](https://tanstack.com/router/latest/docs/api/file-based-routing)
- [TanStack Router - The Future of React Routing 2025](https://dev.to/rigalpatel001/tanstack-router-the-future-of-react-routing-in-2025-421p)
- [Tips from 8 Months TanStack Router in Production](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)
- [React Stack Patterns 2026](https://www.patterns.dev/react/react-2026/)
- [TanStack Query v5 Advanced SSR](https://tanstack.com/query/v5/docs/react/guides/advanced-ssr)
- [Server Components with TanStack Query](https://www.wisp.blog/blog/should-i-use-tanstack-query-when-most-of-my-components-are-server-components)

## Existing Skills Analysis

### tanstack-router/SKILL.md (438 lines)
**Current Coverage:**
- Installation and Vite plugin
- File-based routes structure
- Root layout, basic routes
- Dynamic routes with params
- Typed search params with Zod
- Navigation (Link, useNavigate)
- Route loaders
- Layouts and route guards
- Preloading and DevTools

**Missing (To Add):**
- ❌ Automatic code splitting (`autoCodeSplitting`)
- ❌ Virtual file routes
- ❌ `.lazy.tsx` pattern details
- ❌ `getRouteApi` helper
- ❌ v2 migration notes
- ❌ TanStack Start mention
- ❌ Route groups (`(group)` syntax)
- ❌ Splat routes update

### tanstack-query/SKILL.md (1134 lines)
**Current Coverage:**
- Comprehensive v5 patterns
- Breaking changes
- Query key factories
- Data transformation
- Mutations and optimistic updates
- Authentication integration
- Testing with MSW
- Router integration

**Missing (To Add):**
- ❌ Streaming SSR patterns
- ❌ `@tanstack/react-query-next-experimental`
- ❌ Server Components guidance
- ❌ Server-side retry defaults

### react-typescript/SKILL.md
- General React patterns
- Could reference TanStack as default choice

## Enhancement Scope

**Primary Goal:** Enrich TanStack Router and Query skills with 2025-2026 best practices

**Skills to Update:**
1. `plugins/dev/skills/frontend/tanstack-router/SKILL.md`
2. `plugins/dev/skills/frontend/tanstack-query/SKILL.md`

**Consider Creating:**
- Combined "TanStack Stack" skill? (Router + Query together as default)

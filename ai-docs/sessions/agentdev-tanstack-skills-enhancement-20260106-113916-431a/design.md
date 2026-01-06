# TanStack Skills Enhancement Design

**Session:** agentdev-tanstack-skills-enhancement-20260106-113916-431a
**Date:** January 6, 2026
**Author:** Agent Designer

## Executive Summary

This document outlines comprehensive enhancements to the TanStack Router and TanStack Query skills in the dev plugin. The goal is to make TanStack Router + Query the default, recommended frontend stack by incorporating 2025-2026 best practices, production insights, and advanced patterns.

---

## Part 1: TanStack Router Skill Enhancement

**Current State:** 438 lines, covers basics well
**Target State:** ~650-700 lines with advanced 2026 patterns

### Section 1.1: Automatic Code Splitting (NEW SECTION)

**Location:** Add after "Installation" section, before "Bootstrap"
**Lines to Add:** ~50 lines

**Content:**

```markdown
## Automatic Code Splitting (Recommended)

**TanStack Router v1.x+ (2025)** introduces automatic code splitting that separates critical route configuration from non-critical components.

```typescript
// vite.config.ts
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite({
      autoCodeSplitting: true, // NEW: Enable automatic splitting
    }),
  ],
})
```

**What Gets Split:**

| Critical (Always Loaded) | Non-Critical (Lazy Loaded) |
|--------------------------|---------------------------|
| Route configuration | Component |
| Loaders | Error component |
| Search params validation | Pending component |
| beforeLoad | Not-found component |

**Benefits:**
- Smaller initial bundle (route config without components)
- Automatic optimization (no manual `.lazy.tsx` files needed)
- Better perceived performance (loaders start immediately)

**When to Use:**
- **Recommended for all new projects**
- Existing projects: Enable and test bundle sizes
- Large apps benefit most (many routes)
```

### Section 1.2: Virtual File Routes (NEW SECTION)

**Location:** Add after "File-Based Routes" section
**Lines to Add:** ~40 lines

**Content:**

```markdown
## Virtual File Routes

Virtual file routes allow the router to auto-generate route anchors without physical files:

```
src/routes/
├── __root.tsx           # Root layout
├── index.tsx            # "/" (physical file)
├── about.lazy.tsx       # "/about" (virtual route, lazy only)
└── users/
    ├── index.tsx        # "/users" (physical)
    └── $userId.lazy.tsx # "/users/:userId" (virtual, lazy only)
```

**Key Insight:** If you only need a component (no loader, no search validation), you can delete the base route file. The router auto-generates a virtual anchor for `.lazy.tsx` files.

**Example - Minimal About Page:**
```typescript
// src/routes/about.lazy.tsx
// No about.tsx needed! Router creates virtual anchor
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/about')({
  component: () => <div>About Us</div>,
})
```

**When Virtual Routes Make Sense:**
- Static pages with no data fetching
- Simple UI components
- When you want maximum code splitting
```

### Section 1.3: Manual Code Splitting with `.lazy.tsx` (EXPAND EXISTING)

**Location:** Expand the existing lazy loading mention in "Naming Conventions"
**Lines to Add:** ~60 lines

**Content:**

```markdown
## Manual Code Splitting (`.lazy.tsx` Pattern)

For fine-grained control over code splitting, split routes into critical and lazy files:

**Critical Route File (posts.tsx):**
```typescript
// src/routes/posts.tsx - Loaded immediately
import { createFileRoute } from '@tanstack/react-router'
import { postsQueryOptions } from '@/features/posts/queries'
import { queryClient } from '@/app/queryClient'

export const Route = createFileRoute('/posts')({
  // Critical: loaders, search validation, beforeLoad
  loader: () => queryClient.ensureQueryData(postsQueryOptions()),
  validateSearch: (search) => postsSearchSchema.parse(search),
})
```

**Lazy Route File (posts.lazy.tsx):**
```typescript
// src/routes/posts.lazy.tsx - Code-split, loaded on navigation
import { createLazyFileRoute } from '@tanstack/react-router'
import { Posts } from '@/features/posts/components/Posts'

export const Route = createLazyFileRoute('/posts')({
  // Non-critical: component, error/pending/notFound
  component: Posts,
  pendingComponent: () => <PostsSkeleton />,
  errorComponent: ({ error }) => <PostsError error={error} />,
})
```

**Lazy-Only Properties:**
- `component` - The main route component
- `errorComponent` - Error boundary UI
- `pendingComponent` - Loading/suspense UI
- `notFoundComponent` - 404 UI for this route

**Critical-Only Properties (NOT in lazy):**
- `loader` / `loaderDeps`
- `beforeLoad`
- `validateSearch`
- `search` (search middleware)
- `context`

**Best Practice:** Use automatic code splitting (`autoCodeSplitting: true`) unless you need specific control over what goes in each file.
```

### Section 1.4: `getRouteApi` Helper (NEW SECTION)

**Location:** Add after "Route Loaders" section
**Lines to Add:** ~45 lines

**Content:**

```markdown
## Type-Safe Route Data Access (`getRouteApi`)

When building components outside the route file, use `getRouteApi` for type-safe access:

```typescript
// src/features/posts/components/PostHeader.tsx
import { getRouteApi } from '@tanstack/react-router'

// Get typed route API without importing the route
const routeApi = getRouteApi('/posts/$postId')

export function PostHeader() {
  // All these are fully typed!
  const { postId } = routeApi.useParams()
  const { post } = routeApi.useLoaderData()
  const { view } = routeApi.useSearch()
  const context = routeApi.useRouteContext()

  return (
    <header>
      <h1>{post.title}</h1>
      <span>Viewing: {view}</span>
    </header>
  )
}
```

**Available Methods:**
- `useParams()` - Route parameters
- `useSearch()` - Search/query params
- `useLoaderData()` - Data from loader
- `useRouteContext()` - Route context
- `useMatch()` - Full route match object

**When to Use:**
- Components in separate files from route definition
- Shared components used across routes
- Avoiding circular imports
- Cleaner separation of concerns

**Important:** The route path string must exactly match the route definition.
```

### Section 1.5: Route Groups (NEW SECTION)

**Location:** Add after "Layouts" section
**Lines to Add:** ~35 lines

**Content:**

```markdown
## Route Groups

Route groups organize files without affecting URLs using parentheses:

```
src/routes/
├── (auth)/                    # Group (not in URL)
│   ├── login.tsx              # "/login"
│   ├── register.tsx           # "/register"
│   └── forgot-password.tsx    # "/forgot-password"
├── (dashboard)/               # Group (not in URL)
│   ├── _layout.tsx            # Shared dashboard layout
│   ├── index.tsx              # "/" (or maybe "/dashboard"?)
│   ├── analytics.tsx          # "/analytics"
│   └── settings.tsx           # "/settings"
└── __root.tsx
```

**Benefits:**
- Organize related routes without nesting URLs
- Apply shared layouts to grouped routes
- Better file organization in large apps
- No URL pollution

**Example - Auth Group Layout:**
```typescript
// src/routes/(auth)/_layout.tsx
export const Route = createFileRoute('/(auth)/_layout')({
  component: () => (
    <div className="auth-layout">
      <Logo />
      <Outlet />
    </div>
  ),
})
```
```

### Section 1.6: Splat Routes (UPDATE EXISTING + v2 NOTES)

**Location:** Update existing "Catch-All Route" section
**Lines to Add:** ~25 lines

**Content:**

```markdown
## Catch-All (Splat) Routes

**v1.x Syntax:**
```typescript
// src/routes/files/$.tsx - Catches all paths under /files/
export const Route = createFileRoute('/files/$')({
  component: FileViewer,
})

function FileViewer() {
  // Access splat via '_splat' key (v1.x+)
  const { _splat } = Route.useParams()
  // '/files/docs/readme.md' → _splat = 'docs/readme.md'

  return <div>File: {_splat}</div>
}
```

**v2 Migration Note:**
In TanStack Router v2 (upcoming), splat routes use `_splat` key consistently:
- v1: `params['*']` or `params._splat` (both work)
- v2: Only `params._splat` (star deprecated)

**Prepare for v2:**
```typescript
// ✅ Future-proof
const { _splat } = Route.useParams()

// ⚠️ Works in v1, deprecated in v2
const splat = Route.useParams()['*']
```
```

### Section 1.7: TanStack Start Mention (NEW SECTION)

**Location:** Add at end, before "Related Skills"
**Lines to Add:** ~30 lines

**Content:**

```markdown
## TanStack Start (Full-Stack Framework)

**TanStack Start** is the full-stack meta-framework built on TanStack Router:

**Stack:**
- TanStack Router (routing)
- Vite (bundler)
- Nitro (server)
- Vinxi (dev server)

**When to Consider Start:**
- New full-stack projects
- Need SSR/SSG out of the box
- Want alternatives to Next.js/Remix
- Prefer TanStack's type-safety approach

**When to Stick with Router + Vite:**
- SPAs without server requirements
- Existing Vite projects
- When you need maximum control

**Resources:**
- [TanStack Start Docs](https://tanstack.com/start)
- [Start vs Router](https://tanstack.com/start/latest/docs/framework/react/comparison)

**Note:** Start is still maturing. For production SPAs in 2026, TanStack Router + Query + Vite remains the recommended stack.
```

### Section 1.8: Production Best Practices (NEW SECTION)

**Location:** Add after "Best Practices", before TanStack Start
**Lines to Add:** ~50 lines

**Content:**

```markdown
## Production Best Practices (2026)

Insights from large-scale TanStack Router deployments:

### 1. File Structure = URL Structure

Colocate everything a page needs within its route folder:

```
src/routes/users/
├── $userId/
│   ├── index.tsx           # Route definition
│   ├── index.lazy.tsx      # Lazy component
│   ├── UserProfile.tsx     # Page-specific component
│   └── useUserActions.ts   # Page-specific hooks
└── index.tsx
```

Components/functions belong at the **nearest shared ancestor** in the hierarchy.

### 2. Let Router Handle Loading States

```typescript
// ✅ Recommended - Router handles loading/error
export const Route = createFileRoute('/users/$userId')({
  loader: fetchUser,
  pendingComponent: UserSkeleton,
  errorComponent: UserError,
  component: UserProfile, // Only handles happy path!
})

// ❌ Avoid - Manual loading in component
function UserProfile() {
  const { data, isLoading, error } = useUser()
  if (isLoading) return <Spinner />  // Router should handle this
  if (error) return <Error />         // Router should handle this
  return <div>{data.name}</div>
}
```

### 3. Preload Strategy

```typescript
// List views → preload detail on hover
<Link
  to="/users/$userId"
  params={{ userId }}
  preload="intent"  // Preload on hover
>
  {user.name}
</Link>

// Critical navigation → preload on render
<Link to="/dashboard" preload="render">
  Dashboard
</Link>
```

### 4. Search Params for Everything Shareable

If users should be able to share or bookmark a specific view, use search params:

```typescript
const searchSchema = z.object({
  tab: z.enum(['overview', 'activity', 'settings']).default('overview'),
  page: z.number().default(1),
  sort: z.enum(['name', 'date', 'score']).optional(),
})
```
```

---

## Part 2: TanStack Query Skill Enhancement

**Current State:** 1134 lines, comprehensive v5 coverage
**Target State:** ~1250 lines with SSR/RSC patterns

### Section 2.1: Server-Side Rendering Defaults (NEW SECTION)

**Location:** Add after "Client Setup" section
**Lines to Add:** ~40 lines

**Content:**

```markdown
## Server-Side Rendering Configuration

When using TanStack Query with SSR (Next.js, Remix, TanStack Start), configure server-specific defaults:

```typescript
// Server-side QueryClient configuration
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server: Don't retry on server (fail fast)
        retry: typeof window === 'undefined' ? 0 : 3,
        // Server: Data is always fresh when rendered
        staleTime: 60_000, // 1 minute
      },
    },
  })
}
```

**Server vs Client Defaults:**

| Option | Client Default | Server Recommended | Why |
|--------|---------------|-------------------|-----|
| `retry` | 3 | 0 | Server should fail fast, not retry loops |
| `staleTime` | 0 | 60_000+ | Server-rendered data is fresh |
| `gcTime` | 5 min | Infinity | No garbage collection needed on server |
| `refetchOnWindowFocus` | true | false | No window on server |
| `refetchOnReconnect` | true | false | No reconnect on server |

**Important:** In SPA-only apps (TanStack Router + Vite), you don't need these server defaults. They're only relevant for SSR frameworks.
```

### Section 2.2: Streaming SSR (NEW SECTION)

**Location:** Add after Server-Side Rendering section
**Lines to Add:** ~55 lines

**Content:**

```markdown
## Streaming SSR (Experimental)

For Next.js App Router, `@tanstack/react-query-next-experimental` enables streaming:

```bash
pnpm add @tanstack/react-query-next-experimental
```

**Setup:**
```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000 },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient() // Server: always new
  }
  return (browserQueryClient ??= makeQueryClient()) // Browser: singleton
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
    </QueryClientProvider>
  )
}
```

**Usage in Client Components:**
```typescript
'use client'

import { useSuspenseQuery } from '@tanstack/react-query'

export function UserProfile({ userId }: { userId: string }) {
  // No prefetch needed! Data streams from server
  const { data: user } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  return <div>{user.name}</div>
}
```

**Benefits:**
- Skip manual prefetching in Server Components
- Data streams to client as it resolves
- Suspense boundaries show loading states naturally

**Limitations:**
- Next.js App Router only (experimental)
- Not for TanStack Router SPAs (use route loaders instead)
```

### Section 2.3: Server Components Integration (NEW SECTION)

**Location:** Add after Streaming SSR section
**Lines to Add:** ~60 lines

**Content:**

```markdown
## Server Components Integration

**When you have React Server Components (RSC)**, how does TanStack Query fit?

### The Mental Model

Think of Server Components as **another framework loader** (like route loaders):

| Feature | Server Components | TanStack Query |
|---------|-------------------|----------------|
| Initial data fetch | Yes (server) | Yes (client prefetch) |
| Client mutations | No | Yes |
| Background refetch | No | Yes |
| Optimistic updates | No | Yes |
| Real-time updates | No | Yes |
| Cache management | No | Yes |

### When TanStack Query is Still Valuable

Even in RSC-heavy apps, Query remains essential for:

1. **Client-Side Mutations**
   ```typescript
   // Server Component fetches, Client handles mutations
   export default async function PostPage({ params }) {
     const post = await fetchPost(params.id) // Server fetch
     return <PostWithComments post={post} /> // Client mutations
   }

   'use client'
   function PostWithComments({ post }) {
     const addComment = useMutation({ ... }) // Still need Query!
     // ...
   }
   ```

2. **Background Refetching After Initial Load**
   ```typescript
   // Initial: Server Component renders with fresh data
   // After: Query keeps data fresh on client
   ```

3. **Optimistic Updates**
   ```typescript
   // Can't do optimistic updates with Server Components alone
   const likeMutation = useMutation({
     mutationFn: likePost,
     onMutate: async () => {
       // Optimistic update - only possible with Query
     },
   })
   ```

4. **Real-Time Updates**
   ```typescript
   // WebSocket data, polling, etc. - client-only
   useQuery({
     queryKey: ['notifications'],
     queryFn: fetchNotifications,
     refetchInterval: 30_000, // Real-time polling
   })
   ```

### Recommended Pattern

```typescript
// Server Component: Initial fetch
export default async function DashboardPage() {
  const initialData = await fetchDashboard()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient initialData={initialData} />
    </HydrationBoundary>
  )
}

// Client Component: Mutations + real-time
'use client'
function DashboardClient({ initialData }) {
  // Query hydrates from server data, then manages client state
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    initialData,
  })

  const updateWidget = useMutation({ ... })
  // ...
}
```

### SPA Recommendation

**For SPA-only apps (TanStack Router + Vite)**: Server Components don't apply. Use TanStack Query as your primary data layer with route loaders for prefetching.
```

### Section 2.4: Query with Actions Pattern (NEW SECTION)

**Location:** Add after Server Components section
**Lines to Add:** ~40 lines

**Content:**

```markdown
## Query + React 19 Actions

When using React 19 Actions alongside Query, keep responsibilities clear:

### Complementary Usage

```typescript
// Query: Fetching and caching
const { data: posts } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

// Action: Form submission with built-in validation
async function createPostAction(formData: FormData) {
  'use server'
  const result = await createPost(formData)
  return result
}

// After action succeeds, invalidate Query cache
const [state, formAction] = useActionState(async (prev, formData) => {
  const result = await createPostAction(formData)
  if (result.success) {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }
  return result
}, { success: false })
```

### Decision Matrix

| Use Case | Recommendation |
|----------|----------------|
| Data fetching | Query (`useQuery`) |
| List caching | Query |
| Form submission | Action (`useActionState`) + Query invalidation |
| Button click mutation | Query (`useMutation`) |
| Optimistic update with rollback | Query (`useMutation`) |
| Server-side validation | Action |
| Complex multi-step mutations | Query (`useMutation`) |

### Rule of Thumb

- **Actions** for form submissions with server-side validation
- **Query** for everything else (fetching, caching, complex mutations)
- **Both** when forms need to update Query cache after success
```

---

## Part 3: Cross-Skill Integration Updates

### 3.1: Updated Related Skills Sections

**tanstack-router/SKILL.md:**
```markdown
## Related Skills

- **tanstack-query** - Server state management, caching, and route loader integration
- **react-typescript** - React 19 patterns, component composition, and Actions
- **shadcn-ui** - UI components with proper route integration
- **browser-debugging** - DevTools and debugging TanStack Router
- **testing-frontend** - Testing routes and navigation
```

**tanstack-query/SKILL.md:**
```markdown
## Related Skills

- **tanstack-router** - File-based routing with loader prefetching
- **react-typescript** - React 19 patterns, Actions vs Mutations decision guide
- **state-management** - Zustand for client state, Query for server state
- **testing-frontend** - Testing queries with MSW
- **api-integration** - Backend API patterns with Apidog
```

**react-typescript/SKILL.md:**
```markdown
## Related Skills

- **tanstack-query** - Server state management (recommended default)
- **tanstack-router** - Type-safe file-based routing (recommended default)
- **shadcn-ui** - Component library patterns
- **state-management** - Zustand for client-only state
- **browser-debugging** - Browser testing and debugging
- **testing-frontend** - Testing React components
```

### 3.2: TanStack as Default Stack (react-typescript update)

Add to **react-typescript/SKILL.md** Overview section:

```markdown
## Recommended Stack (2026)

For new React applications, the recommended stack is:

| Layer | Technology | Why |
|-------|------------|-----|
| **Routing** | TanStack Router | Type-safe, file-based, code-splitting |
| **Server State** | TanStack Query | Caching, background updates, mutations |
| **Client State** | Zustand | Simple, performant, React-friendly |
| **UI Components** | shadcn/ui + Tailwind | Composable, accessible, customizable |
| **Forms** | React Hook Form + Zod | Validation, performance, type-safety |
| **Testing** | Vitest + RTL + MSW | Fast, React-native, network mocking |

See individual skills for detailed patterns.
```

---

## Part 4: Implementation Summary

### Files to Modify

| File | Changes | Estimated Lines |
|------|---------|-----------------|
| `tanstack-router/SKILL.md` | 8 new/expanded sections | +230 lines |
| `tanstack-query/SKILL.md` | 4 new sections | +195 lines |
| `react-typescript/SKILL.md` | Recommended stack section + related skills | +30 lines |

### New Sections by Skill

**TanStack Router (8 sections):**
1. Automatic Code Splitting (~50 lines)
2. Virtual File Routes (~40 lines)
3. Manual Code Splitting `.lazy.tsx` (~60 lines)
4. `getRouteApi` Helper (~45 lines)
5. Route Groups (~35 lines)
6. Splat Routes v2 Update (~25 lines)
7. TanStack Start Mention (~30 lines)
8. Production Best Practices (~50 lines)

**TanStack Query (4 sections):**
1. Server-Side Rendering Defaults (~40 lines)
2. Streaming SSR (~55 lines)
3. Server Components Integration (~60 lines)
4. Query + React 19 Actions (~40 lines)

### Code Examples to Add

| Pattern | File | Description |
|---------|------|-------------|
| `autoCodeSplitting` config | tanstack-router | Vite config with auto splitting |
| Virtual routes | tanstack-router | Lazy-only route pattern |
| Critical/lazy split | tanstack-router | Full example of split files |
| `getRouteApi` usage | tanstack-router | Type-safe data access |
| Route groups | tanstack-router | `(group)` folder structure |
| Server QueryClient | tanstack-query | SSR-specific configuration |
| Streaming hydration | tanstack-query | Next.js experimental setup |
| RSC + Query | tanstack-query | Server fetch + client mutations |
| Actions + Query | tanstack-query | Form actions with cache invalidation |

---

## Part 5: Design Decisions

### Decision 1: No Combined "TanStack Stack" Skill

**Decision:** Keep Router and Query as separate skills, don't create combined skill.

**Rationale:**
- Skills should be atomic and focused
- Router Integration section already exists in Query skill
- Cross-references via Related Skills are sufficient
- Users may use one without the other

### Decision 2: SSR Sections are Informational

**Decision:** Include SSR/RSC patterns but emphasize SPA as primary use case.

**Rationale:**
- Dev plugin primarily targets Vite SPAs
- Users need to understand where Query fits with RSC
- Clear guidance: "For SPAs, use route loaders"
- Covers all use cases without confusion

### Decision 3: v2 Migration Notes are Minimal

**Decision:** Include v2 notes where relevant but don't create migration guide.

**Rationale:**
- v2 not yet released
- Splat route change is main breaking change
- Future skill update can add full migration guide
- Current guidance is future-proof

### Decision 4: Production Insights from Real Usage

**Decision:** Include production best practices section with real-world insights.

**Rationale:**
- 8 months production article provides valuable patterns
- File structure recommendations are actionable
- Preload strategies improve UX
- Differentiates from official docs

---

## Part 6: Quality Checklist

Before implementation, verify:

- [ ] All code examples compile and follow TypeScript best practices
- [ ] Consistent formatting with existing skill structure
- [ ] No duplicate content between Router and Query skills
- [ ] Related Skills sections properly cross-reference
- [ ] v2 notes are clearly marked as "upcoming"
- [ ] SPA-first guidance is maintained
- [ ] All imports use the correct package names
- [ ] Examples follow the project's code style conventions

---

## Appendix: Source References

1. [TanStack Router Docs - File-Based Routing](https://tanstack.com/router/latest/docs/api/file-based-routing)
2. [TanStack Router - Code Splitting](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting)
3. [TanStack Query v5 - Advanced SSR](https://tanstack.com/query/v5/docs/react/guides/advanced-ssr)
4. [Tips from 8 Months TanStack Router in Production](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)
5. [Should I Use TanStack Query with Server Components?](https://www.wisp.blog/blog/should-i-use-tanstack-query-when-most-of-my-components-are-server-components)
6. [React Stack Patterns 2026](https://www.patterns.dev/react/react-2026/)

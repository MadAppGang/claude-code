---
name: tanstack-router
description: TanStack Router patterns for type-safe, file-based routing. Covers installation, route configuration, typed params/search, layouts, and navigation. Use when setting up routes, implementing navigation, or configuring route loaders.
---

# TanStack Router Patterns

Type-safe, file-based routing for React applications with TanStack Router.

## Installation

```bash
pnpm add @tanstack/react-router
pnpm add -D @tanstack/router-plugin
```

```typescript
// vite.config.ts
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(), // Generates route tree
  ],
})
```

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

## Bootstrap

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
```

## File-Based Routes

```
src/routes/
├── __root.tsx                 # Root layout (Outlet, providers)
├── index.tsx                  # "/" route
├── about.tsx                  # "/about" route
├── users/
│   ├── index.tsx              # "/users" route
│   └── $userId.tsx            # "/users/:userId" route (dynamic)
└── posts/
    ├── $postId/
    │   ├── index.tsx          # "/posts/:postId" route
    │   └── edit.tsx           # "/posts/:postId/edit" route
    └── index.tsx              # "/posts" route
```

**Naming Conventions:**
- `__root.tsx` - Root layout (contains `<Outlet />`)
- `index.tsx` - Index route for that path
- `$param.tsx` - Dynamic parameter (e.g., `$userId` → `:userId`)
- `_layout.tsx` - Layout route (no URL segment)
- `route.lazy.tsx` - Lazy-loaded route

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

## Root Layout

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/users">Users</Link>
      </nav>

      <main>
        <Outlet /> {/* Child routes render here */}
      </main>

      <TanStackRouterDevtools /> {/* Auto-hides in production */}
    </>
  ),
})
```

## Basic Route

```typescript
// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  return <div>About Page</div>
}
```

## Dynamic Routes with Params

```typescript
// src/routes/users/$userId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/$userId')({
  component: UserComponent,
})

function UserComponent() {
  const { userId } = Route.useParams() // Fully typed!

  return <div>User ID: {userId}</div>
}
```

## Typed Search Params

```typescript
// src/routes/users/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const userSearchSchema = z.object({
  page: z.number().default(1),
  filter: z.enum(['active', 'inactive', 'all']).default('all'),
  search: z.string().optional(),
})

export const Route = createFileRoute('/users/')({
  validateSearch: userSearchSchema,
  component: UsersComponent,
})

function UsersComponent() {
  const { page, filter, search } = Route.useSearch() // Fully typed!

  return (
    <div>
      <p>Page: {page}</p>
      <p>Filter: {filter}</p>
      {search && <p>Search: {search}</p>}
    </div>
  )
}
```

## Navigation with Link

```typescript
import { Link } from '@tanstack/react-router'

// Basic navigation
<Link to="/about">About</Link>

// With params
<Link to="/users/$userId" params={{ userId: '123' }}>
  View User
</Link>

// With search params
<Link
  to="/users"
  search={{ page: 2, filter: 'active' }}
>
  Users Page 2
</Link>

// With state
<Link to="/details" state={{ from: 'home' }}>
  Details
</Link>

// Active link styling
<Link
  to="/about"
  activeProps={{ className: 'text-blue-600 font-bold' }}
  inactiveProps={{ className: 'text-gray-600' }}
>
  About
</Link>
```

## Programmatic Navigation

```typescript
import { useNavigate } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()

  const handleClick = () => {
    // Navigate to route
    navigate({ to: '/users' })

    // With params
    navigate({ to: '/users/$userId', params: { userId: '123' } })

    // With search
    navigate({ to: '/users', search: { page: 2 } })

    // Replace history
    navigate({ to: '/login', replace: true })

    // Go back
    navigate({ to: '..' }) // Relative navigation
  }

  return <button onClick={handleClick}>Navigate</button>
}
```

## Route Loaders (Data Fetching)

**Basic Loader:**
```typescript
// src/routes/users/$userId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId)
    return { user }
  },
  component: UserComponent,
})

function UserComponent() {
  const { user } = Route.useLoaderData() // Fully typed!

  return <div>{user.name}</div>
}
```

**With TanStack Query Integration** (see **tanstack-query** skill for details):
```typescript
import { queryClient } from '@/app/queryClient'
import { userQueryOptions } from '@/features/users/queries'

export const Route = createFileRoute('/users/$userId')({
  loader: ({ params }) =>
    queryClient.ensureQueryData(userQueryOptions(params.userId)),
  component: UserComponent,
})
```

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

## Layouts

**Layout Route** (`_layout.tsx` - no URL segment):
```typescript
// src/routes/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="content">
        <Outlet /> {/* Child routes */}
      </div>
    </div>
  )
}

// Child routes
// src/routes/_layout/dashboard.tsx → "/dashboard"
// src/routes/_layout/settings.tsx → "/settings"
```

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
│   ├── index.tsx              # "/" (or "/dashboard")
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

## Loading States

```typescript
export const Route = createFileRoute('/users')({
  loader: async () => {
    const users = await fetchUsers()
    return { users }
  },
  pendingComponent: () => <Spinner />,
  errorComponent: ({ error }) => <ErrorMessage>{error.message}</ErrorMessage>,
  component: UsersComponent,
})
```

## Error Handling

```typescript
import { ErrorComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/users')({
  loader: async () => {
    const users = await fetchUsers()
    if (!users) throw new Error('Failed to load users')
    return { users }
  },
  errorComponent: ({ error, reset }) => (
    <div>
      <h1>Error loading users</h1>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  ),
  component: UsersComponent,
})
```

## Route Context

**Providing Context:**
```typescript
// src/routes/__root.tsx
export const Route = createRootRoute({
  beforeLoad: () => ({
    user: getCurrentUser(),
  }),
  component: RootComponent,
})

// Access in child routes
export const Route = createFileRoute('/dashboard')({
  component: function Dashboard() {
    const { user } = Route.useRouteContext()
    return <div>Welcome, {user.name}</div>
  },
})
```

## Route Guards / Auth

```typescript
// src/routes/_authenticated.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: Outlet,
})

// Protected routes
// src/routes/_authenticated/dashboard.tsx
// src/routes/_authenticated/profile.tsx
```

## Preloading

**Hover Preload:**
```typescript
<Link
  to="/users/$userId"
  params={{ userId: '123' }}
  preload="intent" // Preload on hover
>
  View User
</Link>
```

**Options:**
- `preload="intent"` - Preload on hover/focus
- `preload="render"` - Preload when link renders
- `preload={false}` - No preload (default)

## DevTools

```typescript
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

// Add to root layout
<TanStackRouterDevtools position="bottom-right" />
```

Auto-hides in production builds.

## Best Practices

1. **Use Type-Safe Navigation** - Let TypeScript catch routing errors at compile time
2. **Validate Search Params** - Use Zod schemas for search params
3. **Prefetch Data in Loaders** - Integrate with TanStack Query for optimal data fetching
4. **Use Layouts for Shared UI** - Avoid duplicating layout code across routes
5. **Lazy Load Routes** - Use `route.lazy.tsx` for code splitting
6. **Leverage Route Context** - Share data down the route tree efficiently

## Common Patterns

**Catch-All (Splat) Routes:**

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

**404 Not Found Route:**
```typescript
// src/routes/$.tsx
export const Route = createFileRoute('/$')({
  component: () => <div>404 Not Found</div>,
})
```

**Optional Params:**
```typescript
// Use search params for optional data
const searchSchema = z.object({
  optional: z.string().optional(),
})
```

**Multi-Level Dynamic Routes:**
```
/posts/$postId/comments/$commentId
```

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

## Related Skills

- **tanstack-query** - Server state management, caching, and route loader integration
- **react-typescript** - React 19 patterns, component composition, and Actions
- **shadcn-ui** - UI components with proper route integration
- **browser-debugging** - DevTools and debugging TanStack Router
- **testing-frontend** - Testing routes and navigation

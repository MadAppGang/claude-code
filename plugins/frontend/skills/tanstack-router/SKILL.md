---
name: tanstack-router
description: Use when setting up routes, implementing navigation, or configuring route loaders. TanStack Router patterns for type-safe, file-based routing. Covers installation, route configuration, typed params/search, layouts, and navigation.
updated: 2026-01-20
keywords: tanstack-router, routing, file-based-routing, type-safe, navigation, layouts, params
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

**With TanStack Query Integration** (see **router-query-integration** skill for details):
```typescript
import { queryClient } from '@/app/queryClient'
import { userQuery Options } from '@/features/users/queries'

export const Route = createFileRoute('/users/$userId')({
  loader: ({ params }) =>
    queryClient.ensureQueryData(userQueryOptions(params.userId)),
  component: UserComponent,
})
```

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

**Catch-All Route:**
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

## Related Skills

- **tanstack-query** - Data fetching and caching
- **router-query-integration** - Integrating Router loaders with Query
- **core-principles** - Project structure with routes

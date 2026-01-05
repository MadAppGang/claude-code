---
name: tanstack-query
description: Comprehensive TanStack Query v5 patterns for async state management. Covers breaking changes, query key factories, data transformation, mutations, optimistic updates, authentication, testing with MSW, and anti-patterns. Use for all server state management, data fetching, and cache invalidation tasks.
---

# TanStack Query v5 - Complete Guide


**TanStack Query v5** (October 2023) is the async state manager for this project. It requires React 18+, features first-class Suspense support, improved TypeScript inference, and a 20% smaller bundle. This section covers production-ready patterns based on official documentation and community best practices.

### Breaking Changes in v5

**Key updates you need to know:**

1. **Single Object Signature**: All hooks now accept one configuration object:
   ```typescript
   // ✅ v5 - single object
   useQuery({ queryKey, queryFn, ...options })

   // ❌ v4 - multiple overloads (deprecated)
   useQuery(queryKey, queryFn, options)
   ```

2. **Renamed Options**:
   - `cacheTime` → `gcTime` (garbage collection time)
   - `keepPreviousData` → `placeholderData: keepPreviousData`
   - `isLoading` now means `isPending && isFetching`

3. **Callbacks Removed from useQuery**:
   - `onSuccess`, `onError`, `onSettled` removed from `useQuery`
   - Use global QueryCache callbacks instead
   - Prevents duplicate executions

4. **Infinite Queries Require initialPageParam**:
   - No default value provided
   - Must explicitly set `initialPageParam` (e.g., `0` or `null`)

5. **First-Class Suspense**:
   - New dedicated hooks: `useSuspenseQuery`, `useSuspenseInfiniteQuery`
   - No experimental flag needed
   - Data is never undefined at type level

**Migration**: Use the official codemod for automatic migration: `npx @tanstack/query-codemods v5/replace-import-specifier`

### Smart Defaults

Query v5 ships with production-ready defaults:

```typescript
{
  staleTime: 0,              // Data instantly stale (refetch on mount)
  gcTime: 5 * 60_000,        // Keep unused cache for 5 minutes
  retry: 3,                  // 3 retries with exponential backoff
  refetchOnWindowFocus: true,// Refetch when user returns to tab
  refetchOnReconnect: true,  // Refetch when network reconnects
}
```

**Philosophy**: React Query is an **async state manager, not a data fetcher**. You provide the Promise; Query manages caching, background updates, and synchronization.

### Client Setup

```typescript
// src/app/providers.tsx
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { toast } from './toast' // Your notification system

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,          // Adjust per-query
      gcTime: 5 * 60_000,    // 5 minutes (v5: formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 401 (authentication errors)
        if (error?.response?.status === 401) return false
        return failureCount < 3
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show toast for background errors (when data exists)
      if (query.state.data !== undefined) {
        toast.error(`Something went wrong: ${error.message}`)
      }
    },
  }),
})

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**DevTools Setup** (auto-excluded in production):

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Architecture: Feature-Based Colocation

**Recommended pattern**: Group queries with related features, not by file type.

```
src/features/
├── Todos/
│   ├── index.tsx           # Feature entry point
│   ├── queries.ts          # All React Query logic (keys, functions, hooks)
│   ├── types.ts            # TypeScript types
│   └── components/         # Feature-specific components
```

**Export only custom hooks** from query files. Keep query functions and keys private:

```typescript
// features/todos/queries.ts

// 1. Query Key Factory (hierarchical structure)
const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
}

// 2. Query Function (private)
const fetchTodos = async (filters: string): Promise<Todo[]> => {
  const response = await axios.get('/api/todos', { params: { filters } })
  return response.data
}

// 3. Custom Hook (public API)
export const useTodosQuery = (filters: string) => {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: () => fetchTodos(filters),
    staleTime: 30_000, // Fresh for 30 seconds
  })
}
```

**Benefits**:
- Prevents key/function mismatches
- Clean public API
- Encapsulation and maintainability
- Easy to locate all query logic for a feature

### Query Key Factories (Essential)

**Structure keys hierarchically** from generic to specific:

```typescript
// ✅ Correct hierarchy
['todos']                          // Invalidates everything
['todos', 'list']                  // Invalidates all lists
['todos', 'list', { filters }]     // Invalidates specific list
['todos', 'detail', 1]             // Invalidates specific detail

// ❌ Wrong - flat structure
['todos-list-active']              // Can't partially invalidate
```

**Critical rule**: Query keys must include **ALL variables used in queryFn**. Treat query keys like dependency arrays:

```typescript
// ✅ Correct - includes all variables
const { data } = useQuery({
  queryKey: ['todos', filters, sortBy],
  queryFn: () => fetchTodos(filters, sortBy),
})

// ❌ Wrong - missing variables
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: () => fetchTodos(filters, sortBy), // filters/sortBy not in key!
})
```

**Type consistency matters**: `['todos', '1']` and `['todos', 1]` are **different keys**. Be consistent with types.

### Query Options API (Type Safety)

**The modern pattern** for maximum type safety across your codebase:

```typescript
import { queryOptions } from '@tanstack/react-query'

function todoOptions(id: number) {
  return queryOptions({
    queryKey: ['todos', id],
    queryFn: () => fetchTodo(id),
    staleTime: 5000,
  })
}

// ✅ Use everywhere with full type safety
useQuery(todoOptions(1))
queryClient.prefetchQuery(todoOptions(5))
queryClient.setQueryData(todoOptions(42).queryKey, newTodo)
queryClient.getQueryData(todoOptions(42).queryKey) // Fully typed!
```

**Benefits**:
- Single source of truth for query configuration
- Full TypeScript inference for imperatively accessed data
- Reusable across hooks and imperative methods
- Prevents key/function mismatches

### Data Transformation Strategies

Choose the right approach based on your use case:

**1. Transform in queryFn** - Simple cases where cache should store transformed data:

```typescript
const fetchTodos = async (): Promise<Todo[]> => {
  const response = await axios.get('/api/todos')
  return response.data.map(todo => ({
    ...todo,
    name: todo.name.toUpperCase()
  }))
}
```

**2. Transform with `select` option (RECOMMENDED)** - Enables partial subscriptions:

```typescript
// Only re-renders when filtered data changes
export const useTodosQuery = (filters: string) =>
  useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (data) => data.filter(todo => todo.status === filters),
  })

// Only re-renders when count changes
export const useTodosCount = () =>
  useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (data) => data.length,
  })
```

**⚠️ Memoize select functions** to prevent running on every render:

```typescript
// ✅ Stable reference
const transformTodos = (data: Todo[]) => expensiveTransform(data)

const query = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: transformTodos, // Stable function reference
})

// ❌ Runs on every render
const query = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (data) => expensiveTransform(data), // New function every render
})
```

### TypeScript Best Practices

**Let TypeScript infer types** from queryFn rather than specifying generics:

```typescript
// ✅ Recommended - inference
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos, // Returns Promise<Todo[]>
})
// data is Todo[] | undefined

// ❌ Unnecessary - explicit generics
const { data } = useQuery<Todo[]>({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})
```

**Discriminated unions** automatically narrow types:

```typescript
const { data, isSuccess, isError, error } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})

if (isSuccess) {
  // data is Todo[] (never undefined)
}

if (isError) {
  // error is defined
}
```

Use `queryOptions` helper for maximum type safety across imperative methods.

### Custom Hooks Pattern

**Always create custom hooks** even for single queries:

```typescript
// ✅ Recommended - custom hook with encapsulation
export function usePost(
  id: number,
  options?: Omit<UseQueryOptions<Post>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: () => getPost(id),
    ...options,
  })
}

// Usage: allows callers to override any option except key/fn
const { data } = usePost(42, { staleTime: 10_000 })
```

**Benefits**:
- Centralizes query logic
- Easy to update all usages
- Consistent configuration
- Better testing

### Error Handling (Multi-Layer Strategy)

**Layer 1: Component-Level** - Specific user feedback:

```typescript
function TodoList() {
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  if (isLoading) return <Spinner />
  if (isError) return <ErrorAlert>{error.message}</ErrorAlert>

  return <ul>{data.map(todo => <TodoItem key={todo.id} {...todo} />)}</ul>
}
```

**Layer 2: Global Error Handling** - Background errors via QueryCache:

```typescript
// Already configured in client setup above
queryCache: new QueryCache({
  onError: (error, query) => {
    if (query.state.data !== undefined) {
      toast.error(`Background error: ${error.message}`)
    }
  },
})
```

**Layer 3: Error Boundaries** - Catch render errors:

```typescript
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      <TodoList />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

### Suspense Integration

**First-class Suspense support** in v5 with dedicated hooks:

```typescript
import { useSuspenseQuery } from '@tanstack/react-query'

function TodoList() {
  // data is NEVER undefined (type-safe)
  const { data } = useSuspenseQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return <ul>{data.map(todo => <TodoItem key={todo.id} {...todo} />)}</ul>
}

// Wrap with Suspense boundary
function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <TodoList />
    </Suspense>
  )
}
```

**Benefits**:
- Eliminates loading state management
- Data always defined (TypeScript enforced)
- Cleaner component code
- Works with React.lazy for code-splitting

### Mutations with Optimistic Updates

**Basic mutation** with cache invalidation:

```typescript
export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newTodo: CreateTodoDTO) =>
      api.post('/todos', newTodo).then(res => res.data),
    onSuccess: (data) => {
      // Set detail query immediately
      queryClient.setQueryData(['todos', data.id], data)
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['todos', 'list'] })
    },
  })
}
```

**Simple optimistic updates** using `variables`:

```typescript
const addTodoMutation = useMutation({
  mutationFn: (newTodo: string) => axios.post('/api/todos', { text: newTodo }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

const { isPending, variables, mutate } = addTodoMutation

return (
  <ul>
    {todoQuery.data?.map(todo => <li key={todo.id}>{todo.text}</li>)}
    {isPending && <li style={{ opacity: 0.5 }}>{variables}</li>}
  </ul>
)
```

**Advanced optimistic updates** with rollback:

```typescript
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // Cancel outgoing queries (prevent race conditions)
    await queryClient.cancelQueries({ queryKey: ['todos'] })

    // Snapshot current data
    const previousTodos = queryClient.getQueryData(['todos'])

    // Optimistically update cache
    queryClient.setQueryData(['todos'], (old: Todo[]) =>
      old?.map(todo => todo.id === newTodo.id ? newTodo : todo)
    )

    // Return context for rollback
    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    // Rollback on error
    queryClient.setQueryData(['todos'], context?.previousTodos)
    toast.error('Update failed. Changes reverted.')
  },
  onSettled: () => {
    // Always refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

**Key principles**:
- Cancel ongoing queries in `onMutate` to prevent race conditions
- Snapshot previous data before updating
- Restore snapshot on error
- Always invalidate in `onSettled` for eventual consistency
- **Never mutate cached data directly** - always use immutable updates

### Authentication Integration

**Handle token refresh at HTTP client level** (not React Query):

```typescript
// src/lib/api-client.ts
import axios from 'axios'
import createAuthRefreshInterceptor from 'axios-auth-refresh'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh token on 401
const refreshAuth = async (failedRequest: any) => {
  try {
    const newToken = await fetchNewToken()
    failedRequest.response.config.headers.Authorization = `Bearer ${newToken}`
    setAccessToken(newToken)
    return Promise.resolve()
  } catch {
    removeAccessToken()
    window.location.href = '/login'
    return Promise.reject()
  }
}

createAuthRefreshInterceptor(apiClient, refreshAuth, {
  statusCodes: [401],
  pauseInstanceWhileRefreshing: true,
})
```

**Protected queries** use the `enabled` option:

```typescript
const useTodos = () => {
  const { user } = useUser() // Get current user from auth context

  return useQuery({
    queryKey: ['todos', user?.id],
    queryFn: () => fetchTodos(user.id),
    enabled: !!user, // Only execute when user exists
  })
}
```

**On logout**: Clear the entire cache with `queryClient.clear()` (not `invalidateQueries()` which triggers refetches):

```typescript
const logout = () => {
  removeAccessToken()
  queryClient.clear() // Clear all cached data
  navigate('/login')
}
```

### Advanced Patterns

**Prefetching** - Eliminate loading states:

```typescript
// Hover prefetching
function ShowDetailsButton() {
  const queryClient = useQueryClient()

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ['details'],
      queryFn: getDetailsData,
      staleTime: 60_000, // Consider fresh for 1 minute
    })
  }

  return (
    <button onMouseEnter={prefetch} onClick={showDetails}>
      Show Details
    </button>
  )
}

// Route-level prefetching (see Router × Query Integration section)
```

**Infinite Queries** - Infinite scrolling/pagination:

```typescript
function Projects() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0, // Required in v5
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  if (isLoading) return <Spinner />

  return (
    <>
      {data.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.data.map(project => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </React.Fragment>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </>
  )
}
```

**Offset-Based Pagination** with `placeholderData`:

```typescript
import { keepPreviousData } from '@tanstack/react-query'

function Posts() {
  const [page, setPage] = useState(0)

  const { data, isPending, isPlaceholderData } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => fetchPosts(page),
    placeholderData: keepPreviousData, // Show previous data while fetching
  })

  return (
    <>
      {data.posts.map(post => <PostCard key={post.id} {...post} />)}

      <button
        onClick={() => setPage(p => Math.max(0, p - 1))}
        disabled={page === 0}
      >
        Previous
      </button>

      <button
        onClick={() => setPage(p => p + 1)}
        disabled={isPlaceholderData || !data.hasMore}
      >
        Next
      </button>
    </>
  )
}
```

**Dependent Queries** - Sequential data fetching:

```typescript
function UserProjects({ email }: { email: string }) {
  // First query
  const { data: user } = useQuery({
    queryKey: ['user', email],
    queryFn: () => getUserByEmail(email),
  })

  // Second query waits for first
  const { data: projects } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: () => getProjectsByUser(user.id),
    enabled: !!user?.id, // Only runs when user.id exists
  })

  return <div>{/* render projects */}</div>
}
```

### Performance Optimization

**staleTime is your primary control** - adjust this, not `gcTime`:

```typescript
// Real-time data (default)
staleTime: 0 // Always considered stale, refetch on mount

// User profiles (changes infrequently)
staleTime: 1000 * 60 * 2 // Fresh for 2 minutes

// Static reference data
staleTime: 1000 * 60 * 10 // Fresh for 10 minutes
```

**Query deduplication** happens automatically - multiple components mounting with identical query keys result in a single network request, but all components receive data.

**Prevent request waterfalls**:

```typescript
// ❌ Waterfall - each query waits for previous
function Dashboard() {
  const { data: user } = useQuery(userQuery)
  const { data: posts } = useQuery(postsQuery(user?.id))
  const { data: stats } = useQuery(statsQuery(user?.id))
}

// ✅ Parallel - all queries start simultaneously
function Dashboard() {
  const { data: user } = useQuery(userQuery)
  const { data: posts } = useQuery({
    ...postsQuery(user?.id),
    enabled: !!user?.id,
  })
  const { data: stats } = useQuery({
    ...statsQuery(user?.id),
    enabled: !!user?.id,
  })
}

// ✅ Best - prefetch in route loader (see Router × Query Integration)
```

**Never copy server state to local state** - this opts out of background updates:

```typescript
// ❌ Wrong - copies to state, loses reactivity
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
const [todos, setTodos] = useState(data)

// ✅ Correct - use query data directly
const { data: todos } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
```

### Testing with Mock Service Worker (MSW)

**MSW is the recommended approach** - mock the network layer:

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/todos', () => {
    return HttpResponse.json([
      { id: 1, text: 'Test todo', completed: false },
    ])
  }),

  http.post('/api/todos', async ({ request }) => {
    const newTodo = await request.json()
    return HttpResponse.json({ id: 2, ...newTodo })
  }),
]

// src/test/setup.ts
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

export const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**Create test wrappers** with proper QueryClient:

```typescript
// src/test/utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Prevent retries in tests
        gcTime: Infinity,
      },
    },
  })
}

export function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient()

  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  )
}
```

**Test queries**:

```typescript
import { renderWithClient } from '@/test/utils'
import { screen } from '@testing-library/react'

test('displays todos', async () => {
  renderWithClient(<TodoList />)

  // Wait for data to load
  expect(await screen.findByText('Test todo')).toBeInTheDocument()
})

test('shows error state', async () => {
  // Override handler for this test
  server.use(
    http.get('/api/todos', () => {
      return HttpResponse.json(
        { message: 'Failed to fetch' },
        { status: 500 }
      )
    })
  )

  renderWithClient(<TodoList />)

  expect(await screen.findByText(/failed/i)).toBeInTheDocument()
})
```

**Critical testing principles**:
- Create new QueryClient per test for isolation
- Set `retry: false` to prevent timeouts
- Use async queries (`findBy*`) for data that loads
- Silence console.error for expected errors

### Anti-Patterns to Avoid

**❌ Don't store query data in Redux/Context**:
- Creates dual sources of truth
- Loses automatic cache invalidation
- Triggers unnecessary renders

**❌ Don't call refetch() with different parameters**:
```typescript
// ❌ Wrong - breaks declarative pattern
const { data, refetch } = useQuery({
  queryKey: ['todos'],
  queryFn: () => fetchTodos(filters),
})
// Later: refetch with different filters??? Won't work!

// ✅ Correct - include params in key
const [filters, setFilters] = useState('all')
const { data } = useQuery({
  queryKey: ['todos', filters],
  queryFn: () => fetchTodos(filters),
})
// Changing filters automatically refetches
```

**❌ Don't use queries for local state**:
- Query Cache expects refetchable data
- Use useState/useReducer for client-only state

**❌ Don't create QueryClient inside components**:
```typescript
// ❌ Wrong - new cache every render
function App() {
  const client = new QueryClient()
  return <QueryClientProvider client={client}>...</QueryClientProvider>
}

// ✅ Correct - stable instance
const queryClient = new QueryClient()
function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```

**❌ Don't ignore loading and error states** - always handle both

**❌ Don't transform data by copying to state** - use `select` option

**❌ Don't mismatch query keys** - be consistent with types (`'1'` vs `1`)

### Cache Timing Guidelines

**staleTime** - How long data is considered fresh:
- `0` (default) - Always stale, refetch on mount/focus
- `30_000` (30s) - Good for user-generated content
- `120_000` (2min) - Good for profile data
- `600_000` (10min) - Good for static reference data

**gcTime** (formerly cacheTime) - How long unused data stays in cache:
- `300_000` (5min, default) - Good for most cases
- `Infinity` - Keep forever (useful with persistence)
- `0` - Immediate garbage collection (not recommended)

**Relationship**: `staleTime` controls refetch frequency, `gcTime` controls memory cleanup.

## Related Skills

- **router-query-integration** - Integrating Query with TanStack Router loaders
- **api-integration** - Apidog + OpenAPI integration
- **react-patterns** - Choose between Query mutations vs React Actions
- **testing-strategy** - Advanced MSW patterns

---

## Router Integration (TanStack Router)

Seamlessly integrate TanStack Router with TanStack Query for optimal SPA performance and instant navigation.

### Route Loader + Query Prefetch

The key pattern: Use route loaders to prefetch queries BEFORE navigation completes.

**Benefits:**
- Loaders run before render, eliminating waterfall
- Fast SPA navigations (instant perceived performance)
- Queries still benefit from cache deduplication
- Add Router & Query DevTools during development (auto-hide in production)

### Basic Pattern

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
      staleTime: 30_000, // Fresh for 30 seconds
    })
  },
  component: UserPage,
})

function UserPage() {
  const { id } = Route.useParams()
  const { data: user } = useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => fetchUser(id),
  })

  // Data is already loaded from loader, so this returns instantly
  return <div>{user.name}</div>
}
```

### Using Query Options Pattern (Recommended)

**Query Options** provide maximum type safety and DRY:

```typescript
// features/users/queries.ts
import { queryOptions } from '@tanstack/react-query'

export function userQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 30_000,
  })
}

export function useUser(userId: string) {
  return useQuery(userQueryOptions(userId))
}

// src/routes/users/$userId.tsx
import { userQueryOptions } from '@/features/users/queries'
import { queryClient } from '@/app/queryClient'

export const Route = createFileRoute('/users/$userId')({
  loader: ({ params }) =>
    queryClient.ensureQueryData(userQueryOptions(params.userId)),
  component: UserPage,
})

function UserPage() {
  const { userId } = Route.useParams()
  const { data: user } = useUser(userId)

  return <div>{user.name}</div>
}
```

### Multiple Queries in Loader

```typescript
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // Run in parallel
    await Promise.all([
      queryClient.ensureQueryData(userQueryOptions()),
      queryClient.ensureQueryData(statsQueryOptions()),
      queryClient.ensureQueryData(postsQueryOptions()),
    ])
  },
  component: Dashboard,
})

function Dashboard() {
  const { data: user } = useUser()
  const { data: stats } = useStats()
  const { data: posts } = usePosts()

  // All data pre-loaded, renders instantly
  return (
    <div>
      <UserHeader user={user} />
      <StatsPanel stats={stats} />
      <PostsList posts={posts} />
    </div>
  )
}
```

### Dependent Queries in Loaders

```typescript
export const Route = createFileRoute('/users/$userId/posts')({
  loader: async ({ params }) => {
    // First ensure user data
    const user = await queryClient.ensureQueryData(
      userQueryOptions(params.userId)
    )

    // Then fetch user's posts
    return queryClient.ensureQueryData(
      userPostsQueryOptions(user.id)
    )
  },
  component: UserPostsPage,
})
```

### Prefetch vs Ensure

**`prefetchQuery`** - Fire and forget, don't wait:
```typescript
loader: ({ params }) => {
  // Don't await - just start fetching
  queryClient.prefetchQuery(userQueryOptions(params.userId))
  // Navigation continues immediately
}
```

**`ensureQueryData`** - Wait for data (recommended):
```typescript
loader: async ({ params }) => {
  // Await - navigation waits until data is ready
  return await queryClient.ensureQueryData(userQueryOptions(params.userId))
}
```

**`fetchQuery`** - Always fetches fresh:
```typescript
loader: async ({ params }) => {
  // Ignores cache, always fetches
  return await queryClient.fetchQuery(userQueryOptions(params.userId))
}
```

**Recommendation:** Use `ensureQueryData` for most cases - respects cache and staleTime.

### Preloading on Link Hover

```typescript
import { Link } from '@tanstack/react-router'

<Link
  to="/users/$userId"
  params={{ userId: '123' }}
  preload="intent" // Preload on hover/focus
>
  View User
</Link>
```

### Search Params + Queries

```typescript
// src/routes/users/index.tsx
import { z } from 'zod'

const searchSchema = z.object({
  page: z.number().default(1),
  filter: z.enum(['active', 'all']).default('all'),
})

export const Route = createFileRoute('/users/')({
  validateSearch: searchSchema,
  loader: ({ search }) => {
    return queryClient.ensureQueryData(
      usersQueryOptions({ page: search.page, filter: search.filter })
    )
  },
  component: UsersPage,
})

function UsersPage() {
  const { page, filter } = Route.useSearch()
  const { data: users } = useUsers({ page, filter })

  return <UsersList users={users} />
}
```

---

## Related Skills

- **tanstack-router** - File-based routing and navigation
- **react-typescript** - React component patterns
- **state-management** - Client state management (Zustand)
- **testing-frontend** - Testing queries with MSW

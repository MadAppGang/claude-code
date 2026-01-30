---
name: react-typescript
description: Modern React 19+ patterns with TypeScript including function components, hooks, state management, TanStack Query integration, form handling with Zod, error boundaries, and performance optimization. Use when building React applications, implementing components, or setting up state management.
---

# React + TypeScript Patterns

## Overview

Modern React 19+ patterns with TypeScript for building robust frontend applications.

## Component Patterns

### Function Components with TypeScript

```tsx
interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
  className?: string;
}

export function UserCard({ user, onSelect, className }: UserCardProps) {
  return (
    <div className={className} onClick={() => onSelect?.(user)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

### Props with Children

```tsx
interface ContainerProps {
  children: React.ReactNode;
  title?: string;
}

export function Container({ children, title }: ContainerProps) {
  return (
    <div className="container">
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}
```

### Generic Components

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

## Hooks Patterns

### Custom Hook with TypeScript

```tsx
interface UseCounterOptions {
  initialValue?: number;
  min?: number;
  max?: number;
}

export function useCounter({ initialValue = 0, min, max }: UseCounterOptions = {}) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(c => (max !== undefined ? Math.min(c + 1, max) : c + 1));
  }, [max]);

  const decrement = useCallback(() => {
    setCount(c => (min !== undefined ? Math.max(c - 1, min) : c - 1));
  }, [min]);

  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  return { count, increment, decrement, reset };
}
```

### Data Fetching Hook

```tsx
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

## State Management

### Context with TypeScript

```tsx
interface AuthContextValue {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: Credentials) => {
    const user = await authService.login(credentials);
    setUser(user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Zustand Store

```tsx
interface StoreState {
  count: number;
  users: User[];
  increment: () => void;
  setUsers: (users: User[]) => void;
}

export const useStore = create<StoreState>((set) => ({
  count: 0,
  users: [],
  increment: () => set((state) => ({ count: state.count + 1 })),
  setUsers: (users) => set({ users }),
}));
```

## TanStack Query Patterns

### Basic Query

```tsx
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;

  return <UserCard user={user} />;
}
```

### Mutation with Optimistic Updates

```tsx
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserInput) => api.updateUser(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['user', newData.id] });
      const previous = queryClient.getQueryData(['user', newData.id]);
      queryClient.setQueryData(['user', newData.id], (old: User) => ({
        ...old,
        ...newData,
      }));
      return { previous };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['user', newData.id], context?.previous);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });
}
```

## Form Handling

### React Hook Form with Zod

```tsx
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older'),
});

type UserFormData = z.infer<typeof userSchema>;

export function UserForm({ onSubmit }: { onSubmit: (data: UserFormData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Name" />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} type="email" placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register('age', { valueAsNumber: true })} type="number" />
      {errors.age && <span>{errors.age.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

## Error Handling

### Error Boundary

```tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## Performance Optimization

### Memoization

```tsx
// Memoize expensive computations
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// Memoize callbacks
const handleClick = useCallback((id: string) => {
  setSelectedId(id);
}, []);

// Memoize components
const MemoizedUserCard = memo(UserCard);
```

### Code Splitting

```tsx
// Lazy load components
const AdminPanel = lazy(() => import('./AdminPanel'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminPanel />
    </Suspense>
  );
}
```

## File Structure

```
src/
├── components/
│   ├── common/           # Shared components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── Input/
│   ├── features/         # Feature components
│   │   ├── auth/
│   │   └── users/
│   └── layout/           # Layout components
├── hooks/                # Custom hooks
├── stores/               # State management
├── services/             # API services
├── types/                # TypeScript types
├── utils/                # Utilities
└── App.tsx
```

## Type Definitions

### API Response Types

```tsx
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### Event Handler Types

```tsx
type ClickHandler = React.MouseEventHandler<HTMLButtonElement>;
type ChangeHandler = React.ChangeEventHandler<HTMLInputElement>;
type SubmitHandler = React.FormEventHandler<HTMLFormElement>;
```

---

*React + TypeScript patterns for modern frontend development*

---

## React 19 Features

### Compiler-Friendly Code

The React Compiler automatically optimizes components for performance. Write code that works well with it:

**Best Practices:**
- Keep components pure and props serializable
- Derive values during render (don't stash in refs unnecessarily)
- Keep event handlers inline unless they close over large mutable objects
- Verify compiler is working (DevTools ✨ badge)
- Opt-out problematic components with `"use no memo"` while refactoring

**Example - Pure Component:**
```typescript
// ✅ Compiler-friendly - pure function
function UserCard({ user }: { user: User }) {
  const displayName = `${user.firstName} ${user.lastName}`
  const isVIP = user.points > 1000

  return (
    <div>
      <h2>{displayName}</h2>
      {isVIP && <Badge>VIP</Badge>}
    </div>
  )
}

// ❌ Avoid - unnecessary effects
function UserCard({ user }: { user: User }) {
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    setDisplayName(`${user.firstName} ${user.lastName}`)
  }, [user])

  return <div><h2>{displayName}</h2></div>
}
```

**Verification:**
- Open React DevTools
- Look for "Memo ✨" badge on components
- If missing, component wasn't optimized (check for violations)

**Opt-Out When Needed:**
```typescript
'use no memo'

// Component code that can't be optimized yet
function ProblematicComponent() {
  // ... code with compiler issues
}
```

### Actions & Forms

For SPA mutations, choose **one approach per feature**:
- **React 19 Actions:** `<form action={fn}>`, `useActionState`, `useOptimistic`
- **TanStack Query:** `useMutation`

Don't duplicate logic between both approaches.

#### React 19 Actions (Form-Centric)

**Best for:**
- Form submissions
- Simple CRUD operations
- When you want form validation built-in

**Basic Action:**
```typescript
async function createTodoAction(formData: FormData) {
  const text = formData.get('text') as string

  // Validation
  if (!text || text.length < 3) {
    return { error: 'Text must be at least 3 characters' }
  }

  // API call
  await api.post('/todos', { text })

  return { success: true }
}

// Component
function TodoForm() {
  return (
    <form action={createTodoAction}>
      <input name="text" required />
      <button type="submit">Add Todo</button>
    </form>
  )
}
```

**With State (useActionState):**
```typescript
import { useActionState } from 'react'

function TodoForm() {
  const [state, formAction, isPending] = useActionState(
    createTodoAction,
    { error: null, success: false }
  )

  return (
    <form action={formAction}>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
      <input name="text" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  )
}
```

**With Optimistic Updates (useOptimistic):**
```typescript
import { useOptimistic } from 'react'

function TaskList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    initialTodos,
    (state, newTodo: string) => [
      ...state,
      { id: `temp-${Date.now()}`, text: newTodo, completed: false }
    ]
  )

  async function handleSubmit(formData: FormData) {
    const text = formData.get('text') as string
    addOptimisticTodo(text)

    await createTodoAction(formData)
  }

  return (
    <>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.id.startsWith('temp-') ? 0.5 : 1 }}>
            {todo.text}
          </li>
        ))}
      </ul>
      <form action={handleSubmit}>
        <input name="text" required />
        <button type="submit">Add</button>
      </form>
    </>
  )
}
```

### The use() Hook

The `use` hook unwraps Promises and Context, enabling new patterns.

**With Promises:**
```typescript
import { use, Suspense } from 'react'

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise)

  return <div>{user.name}</div>
}

// Usage
function App() {
  const userPromise = fetchUser(1)

  return (
    <Suspense fallback={<Spinner />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  )
}
```

**With Context:**
```typescript
import { use, createContext } from 'react'

const ThemeContext = createContext<string>('light')

function Button() {
  const theme = use(ThemeContext)
  return <button className={theme}>Click me</button>
}
```

**When to Use:**
- Primarily useful with Suspense/data primitives and RSC (React Server Components)
- **For SPA-only apps**, prefer **TanStack Query + Router loaders** for data fetching
- `use` shines when you already have a Promise from a parent component

### Component Composition Patterns

**Compound Components:**
```typescript
// ✅ Good - composable, flexible
<Card>
  <Card.Header>
    <Card.Title>Dashboard</Card.Title>
  </Card.Header>
  <Card.Content>
    {/* content */}
  </Card.Content>
</Card>

// Implementation
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <header className="card-header">{children}</header>
}

Card.Title = function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="card-title">{children}</h2>
}

Card.Content = function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="card-content">{children}</div>
}
```

### Decision Guide: Actions vs Query Mutations

| Scenario | Recommendation |
|----------|---------------|
| Form submission with validation | React Actions |
| Button click mutation | TanStack Query |
| Needs optimistic updates + rollback | TanStack Query |
| Integrates with existing cache | TanStack Query |
| SSR/RSC application | React Actions |
| SPA with complex data flow | TanStack Query |
| Simple CRUD with forms | React Actions |

**Rule of Thumb:** For SPAs with TanStack Query already in use, prefer Query mutations for consistency. Only use Actions for form-heavy features where the form-centric API is beneficial.

---

## Performance Best Practices

### Security

**XSS Prevention:**
```typescript
// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Sanitize first
import DOMPurify from 'dompurify'

<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userInput) 
}} />

// ✅ Best - avoid dangerouslySetInnerHTML
<div>{userInput}</div>
```

**Environment Variables:**
```typescript
// ❌ Exposes secrets
const API_KEY = process.env.VITE_SECRET_API_KEY

// ✅ Separate public/private
// Public (can be in client): VITE_PUBLIC_API_URL
// Private (server only): SECRET_API_KEY
```

## Related Skills

- **tanstack-query** - Server state management and data fetching
- **tanstack-router** - Type-safe file-based routing
- **shadcn-ui** - Component library patterns
- **browser-debugging** - Browser testing and debugging
- **state-management** - Zustand and other state management patterns
- **testing-frontend** - Testing React components with Vitest and RTL

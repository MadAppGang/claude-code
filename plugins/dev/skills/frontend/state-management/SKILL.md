# Frontend State Management

**Skill**: state-management
**Plugin**: dev
**Version**: 1.0.0

## Overview

Patterns and best practices for managing state in frontend applications across different frameworks.

## State Categories

### Local vs Global State

| Type | Scope | Examples | Solution |
|------|-------|----------|----------|
| **Local UI** | Single component | Form inputs, modals, dropdowns | useState, ref |
| **Shared UI** | Component subtree | Theme, sidebar state | Context, provide/inject |
| **Server** | Cached API data | Users, products, orders | TanStack Query, SWR |
| **Global App** | Entire app | Auth, settings, notifications | Zustand, Pinia, Redux |
| **URL** | Browser URL | Filters, pagination, search | Router params/query |

### When to Use What

```
┌─────────────────────────────────────────────────────────┐
│ Does only this component need it?                       │
│   YES → Local state (useState/ref)                      │
│   NO ↓                                                  │
├─────────────────────────────────────────────────────────┤
│ Is it server data that needs caching/sync?              │
│   YES → Server state library (TanStack Query)           │
│   NO ↓                                                  │
├─────────────────────────────────────────────────────────┤
│ Is it in the URL (shareable state)?                     │
│   YES → URL state (router)                              │
│   NO ↓                                                  │
├─────────────────────────────────────────────────────────┤
│ Is it needed across unrelated components?               │
│   YES → Global store (Zustand/Pinia)                    │
│   NO → Lift state up or Context                         │
└─────────────────────────────────────────────────────────┘
```

## Server State (TanStack Query)

### Basic Query Pattern

```tsx
// Define query
function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => api.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
  });
}

// Use in component
function UserList() {
  const [filters, setFilters] = useState<UserFilters>({});
  const { data, isLoading, error } = useUsers(filters);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <List items={data} />;
}
```

### Mutation Pattern

```tsx
function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) => api.createUser(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Usage
const createUser = useCreateUser();
await createUser.mutateAsync({ name: 'John', email: 'john@example.com' });
```

### Optimistic Updates

```tsx
function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserInput) => api.updateUser(data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user', newData.id] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['user', newData.id]);

      // Optimistically update
      queryClient.setQueryData(['user', newData.id], (old: User) => ({
        ...old,
        ...newData,
      }));

      return { previous };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['user', newData.id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

## Global State (Zustand)

### Store Definition

```tsx
interface AppStore {
  // State
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  theme: 'light',
  sidebarOpen: true,
  notifications: [],

  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
```

### Selectors for Performance

```tsx
// BAD: Re-renders on any store change
const { theme, notifications } = useAppStore();

// GOOD: Only re-renders when theme changes
const theme = useAppStore((state) => state.theme);

// GOOD: Multiple selectors with shallow comparison
const { theme, sidebarOpen } = useAppStore(
  (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
  shallow
);
```

### Computed/Derived State

```tsx
const useAppStore = create<AppStore>((set, get) => ({
  notifications: [],

  // Derived state as selector
  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  // Or compute in selector
}));

// Usage with computed
const unreadCount = useAppStore((state) =>
  state.notifications.filter((n) => !n.read).length
);
```

## Global State (Pinia for Vue)

```ts
export const useAppStore = defineStore('app', () => {
  // State
  const theme = ref<'light' | 'dark'>('light');
  const sidebarOpen = ref(true);
  const notifications = ref<Notification[]>([]);

  // Getters (computed)
  const unreadCount = computed(() =>
    notifications.value.filter((n) => !n.read).length
  );

  // Actions
  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme;
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  return {
    theme,
    sidebarOpen,
    notifications,
    unreadCount,
    setTheme,
    toggleSidebar,
  };
});
```

## URL State

### Search Params

```tsx
// React with react-router
function useSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      page: parseInt(searchParams.get('page') || '1'),
      search: searchParams.get('search') || '',
      sort: searchParams.get('sort') || 'name',
    }),
    [searchParams]
  );

  const setFilters = (newFilters: Partial<typeof filters>) => {
    setSearchParams((prev) => {
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) prev.set(key, String(value));
        else prev.delete(key);
      });
      return prev;
    });
  };

  return [filters, setFilters] as const;
}
```

### Benefits of URL State

- Shareable links
- Browser back/forward works
- Bookmarkable
- SEO-friendly
- Survives refresh

## Best Practices

### 1. Colocate State

Keep state as close to where it's used as possible.

```tsx
// BAD: Global state for local concern
const useGlobalStore = create(() => ({
  isModalOpen: false,
  toggleModal: () => {},
}));

// GOOD: Local state for local concern
function UserProfile() {
  const [isModalOpen, setModalOpen] = useState(false);
}
```

### 2. Single Source of Truth

Don't duplicate state across stores.

```tsx
// BAD: Duplicated user in multiple places
const authStore = { user: { id: 1, name: 'John' } };
const profileStore = { user: { id: 1, name: 'John' } }; // Duplicated!

// GOOD: Reference by ID
const authStore = { userId: 1 };
const usersCache = { 1: { id: 1, name: 'John' } };
```

### 3. Derive Don't Store

Compute derived data instead of storing it.

```tsx
// BAD: Storing derived state
const store = {
  items: [],
  itemCount: 0,           // Derived!
  filteredItems: [],      // Derived!
  totalPrice: 0,          // Derived!
};

// GOOD: Compute on demand
const store = {
  items: [],
};

// Compute when needed
const itemCount = items.length;
const filteredItems = items.filter(predicate);
const totalPrice = items.reduce((sum, i) => sum + i.price, 0);
```

### 4. Normalize Complex Data

```tsx
// BAD: Nested data
const store = {
  orders: [
    {
      id: 1,
      user: { id: 1, name: 'John' },
      items: [{ id: 1, product: { id: 1, name: 'Widget' } }],
    },
  ],
};

// GOOD: Normalized
const store = {
  orders: { 1: { id: 1, userId: 1, itemIds: [1] } },
  users: { 1: { id: 1, name: 'John' } },
  items: { 1: { id: 1, productId: 1, orderId: 1 } },
  products: { 1: { id: 1, name: 'Widget' } },
};
```

### 5. Handle Loading/Error States

```tsx
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// Always handle all three states
function UserList({ state }: { state: AsyncState<User[]> }) {
  if (state.loading) return <Spinner />;
  if (state.error) return <Error error={state.error} />;
  if (!state.data?.length) return <Empty />;
  return <List items={state.data} />;
}
```

## Anti-Patterns

### 1. Prop Drilling (Instead: Context or Store)

```tsx
// BAD: Passing through many levels
<App theme={theme}>
  <Layout theme={theme}>
    <Sidebar theme={theme}>
      <MenuItem theme={theme} />  // 4 levels deep!
    </Sidebar>
  </Layout>
</App>

// GOOD: Context or store
const theme = useTheme();  // Access anywhere
```

### 2. Storing Server Data in Global State

```tsx
// BAD: Manual cache management
const store = {
  users: [],
  fetchUsers: async () => {
    const users = await api.getUsers();
    set({ users });
  },
};

// GOOD: Use server state library
const { data: users } = useQuery(['users'], api.getUsers);
```

### 3. Mutating State Directly

```tsx
// BAD: Direct mutation
state.users.push(newUser);
state.users[0].name = 'Updated';

// GOOD: Immutable updates
set({ users: [...state.users, newUser] });
set({
  users: state.users.map((u) =>
    u.id === id ? { ...u, name: 'Updated' } : u
  ),
});
```

---

*State management patterns for frontend applications*

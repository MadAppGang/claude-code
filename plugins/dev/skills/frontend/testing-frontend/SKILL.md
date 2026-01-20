---
name: testing-frontend
version: 1.0.0
description: Use when writing component tests, testing user interactions, mocking APIs, or setting up Vitest/React Testing Library/Vue Test Utils for frontend applications.
keywords:
  - frontend testing
  - Vitest
  - React Testing Library
  - Vue Test Utils
  - component testing
  - user event testing
  - mocking
  - accessibility testing
plugin: dev
updated: 2026-01-20
---

# Frontend Testing Patterns

## Overview

Testing patterns for frontend applications using Vitest and React Testing Library / Vue Test Utils.

## Testing Philosophy

### User-Centric Testing

Test behavior, not implementation. Query elements the way users would find them.

```tsx
// BAD: Testing implementation
expect(wrapper.state('isOpen')).toBe(true);
expect(wrapper.find('.modal-class').exists()).toBe(true);

// GOOD: Testing behavior
expect(screen.getByRole('dialog')).toBeInTheDocument();
expect(screen.getByText('Modal Title')).toBeVisible();
```

### Query Priority

Use queries in this order (most to least preferred):

1. `getByRole` - Accessible to everyone
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Inputs
4. `getByText` - Non-interactive elements
5. `getByDisplayValue` - Form current values
6. `getByAltText` - Images
7. `getByTestId` - Last resort

## Component Testing (React)

### Basic Component Test

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const user = { id: '1', name: 'John Doe', email: 'john@example.com' };

  it('renders user information', () => {
    render(<UserCard user={user} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    const userEvt = userEvent.setup();

    render(<UserCard user={user} onSelect={onSelect} />);

    await userEvt.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith(user);
  });
});
```

### Testing Async Components

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserList } from './UserList';

// Mock API
vi.mock('@/api', () => ({
  getUsers: vi.fn(),
}));

describe('UserList', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient.clear();
  });

  it('shows loading state', () => {
    api.getUsers.mockImplementation(() => new Promise(() => {}));

    render(<UserList />, { wrapper });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows users when loaded', async () => {
    api.getUsers.mockResolvedValue([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ]);

    render(<UserList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    api.getUsers.mockRejectedValue(new Error('Network error'));

    render(<UserList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Forms

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();

    render(<LoginForm onSubmit={vi.fn()} />);

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();

    render(
      <LoginForm
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 100))}
      />
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
  });
});
```

## Component Testing (Vue)

### Basic Component Test

```ts
import { mount } from '@vue/test-utils';
import UserCard from './UserCard.vue';

describe('UserCard', () => {
  const user = { id: '1', name: 'John Doe', email: 'john@example.com' };

  it('renders user information', () => {
    const wrapper = mount(UserCard, {
      props: { user },
    });

    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('john@example.com');
  });

  it('emits select event when clicked', async () => {
    const wrapper = mount(UserCard, {
      props: { user },
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0]).toEqual([user]);
  });
});
```

### Testing with Pinia

```ts
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import UserList from './UserList.vue';
import { useUserStore } from '@/stores/userStore';

describe('UserList', () => {
  it('renders users from store', () => {
    const wrapper = mount(UserList, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              user: {
                users: [
                  { id: '1', name: 'John' },
                  { id: '2', name: 'Jane' },
                ],
              },
            },
          }),
        ],
      },
    });

    expect(wrapper.text()).toContain('John');
    expect(wrapper.text()).toContain('Jane');
  });

  it('calls fetchUsers on mount', () => {
    mount(UserList, {
      global: {
        plugins: [createTestingPinia()],
      },
    });

    const store = useUserStore();
    expect(store.fetchUsers).toHaveBeenCalled();
  });
});
```

## Hook Testing

```tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter({ initial: 10 }));

    expect(result.current.count).toBe(10);
  });

  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('respects max limit', () => {
    const { result } = renderHook(() => useCounter({ initial: 9, max: 10 }));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(10);
  });
});
```

## Mocking

### API Mocking

```tsx
// __mocks__/api.ts
export const api = {
  getUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
};

// In test
vi.mock('@/api');

beforeEach(() => {
  vi.clearAllMocks();
});

it('fetches users', async () => {
  api.getUsers.mockResolvedValue([{ id: '1', name: 'John' }]);

  render(<UserList />);

  await waitFor(() => {
    expect(api.getUsers).toHaveBeenCalledTimes(1);
  });
});
```

### Module Mocking

```tsx
// Mock entire module
vi.mock('@/utils/date', () => ({
  formatDate: vi.fn(() => '2024-01-01'),
}));

// Mock specific export
vi.mock('@/config', async () => {
  const actual = await vi.importActual('@/config');
  return {
    ...actual,
    API_URL: 'http://test-api.com',
  };
});
```

### Timer Mocking

```tsx
describe('Debounced search', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces search input', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<SearchInput onSearch={onSearch} debounceMs={300} />);

    await user.type(screen.getByRole('searchbox'), 'test');

    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(onSearch).toHaveBeenCalledWith('test');
  });
});
```

## Integration Testing

### Testing Page Flow

```tsx
describe('User Registration Flow', () => {
  it('completes registration successfully', async () => {
    const user = userEvent.setup();

    render(<App />);

    // Navigate to registration
    await user.click(screen.getByRole('link', { name: /register/i }));

    // Fill form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

    // Submit
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Verify redirect to dashboard
    await waitFor(() => {
      expect(screen.getByText(/welcome, john/i)).toBeInTheDocument();
    });
  });
});
```

## Test Organization

### File Structure

```
src/
├── components/
│   └── UserCard/
│       ├── UserCard.tsx
│       ├── UserCard.test.tsx
│       └── index.ts
├── hooks/
│   └── useAuth/
│       ├── useAuth.ts
│       └── useAuth.test.ts
└── __tests__/
    └── integration/
        └── auth.test.tsx
```

### Test Setup

```ts
// vitest.setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

## Performance Testing

```tsx
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';

describe('UserList Performance', () => {
  it('renders 1000 items within 100ms', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: String(i),
      name: `User ${i}`,
    }));

    const start = performance.now();
    render(<UserList items={items} />);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
```

## Accessibility Testing

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<LoginForm />);

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
```

---

*Frontend testing patterns for React and Vue applications*

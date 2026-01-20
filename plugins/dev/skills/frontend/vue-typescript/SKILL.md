---
name: vue-typescript
version: 1.0.0
description: Use when building Vue 3 applications with TypeScript, implementing Composition API components, setting up Pinia stores, or working with Vue Router. Covers script setup, composables, and reactive state.
keywords:
  - Vue 3
  - TypeScript
  - Composition API
  - Pinia
  - Vue Router
  - composables
  - reactive
  - script setup
plugin: dev
updated: 2026-01-20
---

# Vue 3 + TypeScript Patterns

## Overview

Modern Vue 3 patterns with TypeScript and Composition API for building robust applications.

## Component Patterns

### Script Setup with TypeScript

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
});

const emit = defineEmits<{
  (e: 'update', value: number): void;
  (e: 'close'): void;
}>();

const localCount = ref(props.count);

const doubled = computed(() => localCount.value * 2);

function increment() {
  localCount.value++;
  emit('update', localCount.value);
}
</script>

<template>
  <div>
    <h2>{{ title }}</h2>
    <p>Count: {{ localCount }} (doubled: {{ doubled }})</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

### Generic Components

```vue
<script setup lang="ts" generic="T">
interface Props {
  items: T[];
  selected?: T;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'select', item: T): void;
}>();
</script>

<template>
  <ul>
    <li
      v-for="(item, index) in items"
      :key="index"
      :class="{ selected: item === selected }"
      @click="emit('select', item)"
    >
      <slot :item="item" />
    </li>
  </ul>
</template>
```

## Composables

### Basic Composable

```ts
// composables/useCounter.ts
import { ref, computed } from 'vue';

interface UseCounterOptions {
  initial?: number;
  min?: number;
  max?: number;
}

export function useCounter(options: UseCounterOptions = {}) {
  const { initial = 0, min, max } = options;
  const count = ref(initial);

  const increment = () => {
    if (max === undefined || count.value < max) {
      count.value++;
    }
  };

  const decrement = () => {
    if (min === undefined || count.value > min) {
      count.value--;
    }
  };

  const reset = () => {
    count.value = initial;
  };

  const isAtMin = computed(() => min !== undefined && count.value <= min);
  const isAtMax = computed(() => max !== undefined && count.value >= max);

  return {
    count,
    increment,
    decrement,
    reset,
    isAtMin,
    isAtMax,
  };
}
```

### Data Fetching Composable

```ts
// composables/useFetch.ts
import { ref, watchEffect, type Ref } from 'vue';

interface UseFetchReturn<T> {
  data: Ref<T | null>;
  error: Ref<Error | null>;
  loading: Ref<boolean>;
  refetch: () => Promise<void>;
}

export function useFetch<T>(url: string | Ref<string>): UseFetchReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<Error | null>(null);
  const loading = ref(false);

  async function fetchData() {
    const urlValue = typeof url === 'string' ? url : url.value;
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(urlValue);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data.value = await response.json();
    } catch (e) {
      error.value = e instanceof Error ? e : new Error('Unknown error');
    } finally {
      loading.value = false;
    }
  }

  watchEffect(() => {
    fetchData();
  });

  return { data, error, loading, refetch: fetchData };
}
```

## State Management (Pinia)

### Store Definition

```ts
// stores/userStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<User[]>([]);
  const currentUserId = ref<string | null>(null);
  const loading = ref(false);

  // Getters
  const currentUser = computed(() =>
    users.value.find(u => u.id === currentUserId.value)
  );

  const userCount = computed(() => users.value.length);

  // Actions
  async function fetchUsers() {
    loading.value = true;
    try {
      const response = await api.getUsers();
      users.value = response.data;
    } finally {
      loading.value = false;
    }
  }

  function setCurrentUser(userId: string) {
    currentUserId.value = userId;
  }

  return {
    users,
    currentUserId,
    loading,
    currentUser,
    userCount,
    fetchUsers,
    setCurrentUser,
  };
});
```

### Using Store in Components

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/userStore';

const store = useUserStore();
// Destructure reactive state
const { users, loading, currentUser } = storeToRefs(store);
// Actions don't need storeToRefs
const { fetchUsers, setCurrentUser } = store;

onMounted(() => {
  fetchUsers();
});
</script>
```

## Router with TypeScript

### Route Definitions

```ts
// router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/users/:id',
    name: 'user',
    component: () => import('@/views/UserView.vue'),
    props: true,
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

### Typed Route Params

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// Typed param access
const userId = computed(() => route.params.id as string);

function goToUser(id: string) {
  router.push({ name: 'user', params: { id } });
}
</script>
```

## Form Handling

### VeeValidate with Zod

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

const schema = toTypedSchema(
  z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
);

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: schema,
});

const [email, emailAttrs] = defineField('email');
const [password, passwordAttrs] = defineField('password');

const onSubmit = handleSubmit((values) => {
  console.log('Form submitted:', values);
});
</script>

<template>
  <form @submit="onSubmit">
    <input v-model="email" v-bind="emailAttrs" type="email" />
    <span v-if="errors.email">{{ errors.email }}</span>

    <input v-model="password" v-bind="passwordAttrs" type="password" />
    <span v-if="errors.password">{{ errors.password }}</span>

    <button type="submit">Submit</button>
  </form>
</template>
```

## Provide/Inject with TypeScript

```ts
// Injection key with type
import type { InjectionKey } from 'vue';

interface ThemeContext {
  theme: Ref<'light' | 'dark'>;
  toggleTheme: () => void;
}

export const themeKey: InjectionKey<ThemeContext> = Symbol('theme');

// Provider component
const theme = ref<'light' | 'dark'>('light');
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
};
provide(themeKey, { theme, toggleTheme });

// Consumer component
const themeContext = inject(themeKey);
if (!themeContext) throw new Error('Theme context not provided');
```

## Performance

### Lazy Loading Components

```ts
import { defineAsyncComponent } from 'vue';

const AsyncModal = defineAsyncComponent(() =>
  import('@/components/Modal.vue')
);

const AsyncModalWithOptions = defineAsyncComponent({
  loader: () => import('@/components/Modal.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,
  timeout: 3000,
});
```

## File Structure

```
src/
├── components/
│   ├── common/
│   │   ├── BaseButton.vue
│   │   └── BaseInput.vue
│   ├── layout/
│   │   ├── AppHeader.vue
│   │   └── AppSidebar.vue
│   └── features/
│       └── users/
├── composables/
│   ├── useAuth.ts
│   └── useFetch.ts
├── stores/
│   ├── userStore.ts
│   └── appStore.ts
├── views/
│   ├── HomeView.vue
│   └── UserView.vue
├── router/
│   └── index.ts
├── types/
│   └── index.ts
└── App.vue
```

---

*Vue 3 + TypeScript patterns for modern frontend development*

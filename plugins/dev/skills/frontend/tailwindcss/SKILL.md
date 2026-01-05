---
name: tailwindcss
description: |
  TailwindCSS v4 patterns with CSS-first configuration using @theme, @source, and modern CSS features.
  Covers design tokens, CSS variables, container queries, dark mode, and Vite integration.
  Use when configuring Tailwind, defining design tokens, or leveraging modern CSS with Tailwind utilities.
---

# TailwindCSS v4 Patterns

## Overview

TailwindCSS v4 introduces a CSS-first approach, eliminating the need for JavaScript configuration files. All customization happens directly in CSS using new directives.

## Key Changes from v3 to v4

| Feature | v3 | v4 |
|---------|-----|-----|
| Configuration | `tailwind.config.js` | CSS `@theme` directive |
| Content detection | JS array | `@source` directive |
| Plugin loading | `require()` in JS | `@plugin` directive |
| Custom variants | JS API | `@custom-variant` directive |
| Custom utilities | JS API | `@utility` directive |

## Browser Support

TailwindCSS v4 requires modern browsers:
- Safari 16.4+
- Chrome 111+
- Firefox 128+

**Important**: No CSS preprocessors (Sass/Less) needed - Tailwind IS the preprocessor.

---

## Documentation Index

### Core Documentation

| Topic | URL | Description |
|-------|-----|-------------|
| Installation | https://tailwindcss.com/docs/installation | Setup guides by framework |
| Using Vite | https://tailwindcss.com/docs/installation/vite | Vite integration (recommended) |
| Editor Setup | https://tailwindcss.com/docs/editor-setup | VS Code IntelliSense |
| Upgrade Guide | https://tailwindcss.com/docs/upgrade-guide | v3 to v4 migration |
| Browser Support | https://tailwindcss.com/docs/browser-support | Compatibility requirements |

### Configuration Reference

| Directive | URL | Description |
|-----------|-----|-------------|
| @theme | https://tailwindcss.com/docs/theme | Define design tokens |
| @source | https://tailwindcss.com/docs/content-configuration | Content detection |
| @import | https://tailwindcss.com/docs/import | Import Tailwind layers |
| @config | https://tailwindcss.com/docs/configuration | Legacy JS config |

### CSS Features

| Feature | URL | Description |
|---------|-----|-------------|
| Dark Mode | https://tailwindcss.com/docs/dark-mode | Dark mode strategies |
| Responsive Design | https://tailwindcss.com/docs/responsive-design | Breakpoint utilities |
| Hover & Focus | https://tailwindcss.com/docs/hover-focus-and-other-states | State variants |
| Container Queries | https://tailwindcss.com/docs/container-queries | Component-responsive design |

### Customization

| Topic | URL | Description |
|-------|-----|-------------|
| Theme Configuration | https://tailwindcss.com/docs/theme | Token customization |
| Adding Custom Styles | https://tailwindcss.com/docs/adding-custom-styles | Extending Tailwind |
| Functions & Directives | https://tailwindcss.com/docs/functions-and-directives | CSS functions |
| Plugins | https://tailwindcss.com/docs/plugins | Plugin system |

---

## CSS-First Configuration

### Basic Setup

```css
/* src/index.css */
@import "tailwindcss";
```

This single import replaces the v3 directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).

### @theme Directive - Design Tokens

The `@theme` directive defines design tokens as CSS custom properties:

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: hsl(221 83% 53%);
  --color-primary-dark: hsl(224 76% 48%);
  --color-secondary: hsl(215 14% 34%);
  --color-accent: hsl(328 85% 70%);

  /* With oklch (modern color space) */
  --color-success: oklch(0.723 0.191 142.5);
  --color-warning: oklch(0.828 0.189 84.429);
  --color-error: oklch(0.637 0.237 25.331);

  /* Typography */
  --font-display: "Satoshi", "sans-serif";
  --font-body: "Inter", "sans-serif";
  --font-mono: "JetBrains Mono", "monospace";

  /* Spacing */
  --spacing-page: 2rem;
  --spacing-section: 4rem;

  /* Custom breakpoints */
  --breakpoint-xs: 480px;
  --breakpoint-3xl: 1920px;

  /* Animation timing */
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
}
```

**Generated utilities from above:**
- Colors: `bg-primary`, `text-primary-dark`, `border-accent`
- Fonts: `font-display`, `font-body`, `font-mono`
- Animations: `ease-spring`, `duration-fast`

### @theme inline Pattern

Use `@theme inline` to reference existing CSS variables without generating new utilities:

```css
/* Define CSS variables normally */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
}

/* Map to Tailwind utilities */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
}
```

**When to use `@theme inline`:**
- Theming with CSS variables (light/dark mode)
- Shadcn/ui integration
- Dynamic theme switching

### @source Directive - Content Detection

```css
@import "tailwindcss";

/* Default: Tailwind scans all git-tracked files */

/* Add additional sources */
@source "../node_modules/my-ui-library/src/**/*.{html,js}";
@source "../shared-components/**/*.tsx";

/* Safelist specific utilities */
@source inline("bg-red-500 text-white p-4");
```

### @custom-variant - Custom Variants

```css
@import "tailwindcss";

/* Dark mode variant (class-based) */
@custom-variant dark (&:is(.dark *));

/* RTL variant */
@custom-variant rtl ([dir="rtl"] &);

/* Print variant */
@custom-variant print (@media print { & });

/* Hover on desktop only */
@custom-variant hover-desktop (@media (hover: hover) { &:hover });
```

### @utility - Custom Utilities

```css
@import "tailwindcss";

/* Text balance utility */
@utility text-balance {
  text-wrap: balance;
}

/* Scrollbar hide */
@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

/* Flex center shorthand */
@utility flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### @plugin - Plugin Configuration

```css
@import "tailwindcss";

/* Load a plugin */
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";
@plugin "@tailwindcss/container-queries";

/* Plugin with options */
@plugin "@tailwindcss/typography" {
  className: prose;
}
```

### @config - Legacy JS Configuration

When you need JS configuration (rare in v4):

```css
@import "tailwindcss";
@config "./tailwind.config.ts";
```

---

## Vite Integration

### Installation

```bash
npm install tailwindcss @tailwindcss/vite
```

### Vite Configuration

```typescript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### CSS Entry Point

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* Your design tokens */
}
```

### TypeScript Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Modern CSS Features with Tailwind v4

### Native CSS Variables

Tailwind v4 uses native CSS variables without wrapper functions:

```css
/* v3 - Required hsl wrapper */
--primary: 221 83% 53%;
background-color: hsl(var(--primary));

/* v4 - Direct CSS value */
--color-primary: hsl(221 83% 53%);
/* Used as: bg-primary */
```

### oklch Color Format

```css
@theme {
  /* oklch: lightness, chroma, hue */
  --color-brand: oklch(0.65 0.2 250);
  --color-brand-light: oklch(0.85 0.15 250);
  --color-brand-dark: oklch(0.45 0.25 250);
}
```

**Benefits of oklch:**
- Perceptually uniform
- Consistent lightness across hues
- Better for generating color scales
- Native browser support

### Container Queries

```html
<!-- Parent needs @container -->
<div class="@container">
  <!-- Child responds to container width -->
  <div class="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3">
    <!-- Content -->
  </div>
</div>
```

```css
/* Named containers */
.sidebar {
  container-name: sidebar;
  container-type: inline-size;
}

/* Target named container */
@container sidebar (min-width: 300px) {
  .nav-item { /* expanded styles */ }
}
```

### :has() Pseudo-Class

```html
<!-- Style parent based on child state -->
<label class="group has-[:invalid]:border-red-500 has-[:focus]:ring-2">
  <input type="email" class="peer" />
</label>
```

```css
/* Card with image gets different padding */
.card:has(> img) {
  @apply p-0;
}

/* Form with invalid fields */
.form:has(:invalid) {
  @apply border-red-500;
}
```

### Native CSS Nesting

```css
.card {
  @apply rounded-lg bg-white shadow-md;

  .header {
    @apply border-b p-4;
  }

  .content {
    @apply p-6;
  }

  &:hover {
    @apply shadow-lg;
  }

  &.featured {
    @apply border-2 border-primary;
  }
}
```

---

## Utility Patterns

### Responsive Design (Mobile-First)

```html
<!-- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px) -->
<div class="
  p-4 text-sm               /* Mobile */
  sm:p-6 sm:text-base       /* Tablet */
  lg:p-8 lg:text-lg         /* Desktop */
  2xl:p-12 2xl:text-xl      /* Large screens */
">
```

### State Variants

```html
<!-- Hover, focus, active -->
<button class="
  bg-primary text-white
  hover:bg-primary-dark
  focus:ring-2 focus:ring-primary focus:ring-offset-2
  active:scale-95
  disabled:opacity-50 disabled:cursor-not-allowed
">

<!-- Group hover -->
<div class="group">
  <span class="group-hover:underline">Label</span>
  <span class="opacity-0 group-hover:opacity-100">Icon</span>
</div>

<!-- Peer focus -->
<input class="peer" />
<span class="invisible peer-focus:visible">Hint text</span>
```

### Dark Mode

**Strategy 1: Class-based (recommended)**

```css
@custom-variant dark (&:is(.dark *));
```

```html
<html class="dark">
<body class="bg-white dark:bg-gray-900 text-black dark:text-white">
```

**Strategy 2: Media query**

```css
@custom-variant dark (@media (prefers-color-scheme: dark) { & });
```

### Animation Utilities

```html
<!-- Built-in animations -->
<div class="animate-spin" />
<div class="animate-pulse" />
<div class="animate-bounce" />

<!-- Custom animation -->
<div class="animate-[fadeIn_0.5s_ease-out]" />
```

```css
@theme {
  --animate-fade-in: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Size Utility (v4)

```html
<!-- v3: Two classes -->
<div class="w-10 h-10">

<!-- v4: Single class -->
<div class="size-10">
```

---

## Best Practices

### When to Use @apply

Use `@apply` sparingly for true component abstraction:

```css
/* Good: Repeated pattern across many components */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded-md;
    @apply hover:bg-primary-dark focus:ring-2 focus:ring-primary;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
    @apply transition-colors duration-fast;
  }
}

/* Bad: One-off styling (just use utilities in HTML) */
.my-special-div {
  @apply mt-4 p-6 bg-gray-100; /* Just put these in className */
}
```

**Rule**: Only extract patterns when reused 3+ times.

### Design Token Naming

```css
@theme {
  /* Semantic naming (preferred) */
  --color-primary: hsl(221 83% 53%);
  --color-primary-foreground: hsl(0 0% 100%);

  /* Not: --color-blue-600: ... */

  /* Scale naming when needed */
  --color-gray-50: oklch(0.985 0 0);
  --color-gray-100: oklch(0.970 0 0);
  --color-gray-900: oklch(0.145 0 0);
}
```

### Performance

1. **Use Vite plugin** - Automatic dead code elimination
2. **Avoid dynamic class names** - Static analysis can't optimize them
3. **Purge unused styles** - Automatic with proper @source config

```html
<!-- Good: Static class names -->
<div class={isActive ? "bg-primary" : "bg-gray-100"}>

<!-- Bad: Dynamic class construction -->
<div class={`bg-${color}-500`}> <!-- Can't be purged -->
```

### CSS Layers Order

Tailwind v4 uses CSS cascade layers:

```
1. @layer base - Reset, typography defaults
2. @layer components - Reusable components
3. @layer utilities - Utility classes (highest priority)
```

Custom styles should go in appropriate layers:

```css
@layer components {
  .card { /* component styles */ }
}

@layer utilities {
  .text-shadow { /* utility styles */ }
}
```

---

## Related Skills

- **shadcn-ui** - Component library using Tailwind (CSS variables, theming)
- **css-modules** - Alternative: scoped CSS for complex components
- **react-typescript** - React patterns with Tailwind className
- **design-references** - Design system guidelines (Tailwind UI reference)

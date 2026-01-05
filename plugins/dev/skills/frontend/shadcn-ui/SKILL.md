---
name: shadcn-ui
description: shadcn/ui component library patterns. Covers CLI usage, installation, component categories, theming with CSS variables, dark mode setup, and integration with React Hook Form + Zod. Use when adding UI components, setting up design systems, or implementing forms with shadcn/ui.
---

# shadcn/ui Component Library

> shadcn/ui is a collection of beautifully-designed, accessible components and a code distribution platform. It is built with TypeScript, Tailwind CSS, and Radix UI primitives. It supports multiple frameworks including Next.js, Vite, Remix, Astro, and more. Open Source. Open Code. AI-Ready. It also comes with a command-line tool to install and manage components and a registry system to publish and distribute code.

## Key Principles

- **Open Code**: Components are copied into your project, not installed as dependencies
- **Composition**: Build complex UIs by composing simple components
- **Distribution**: CLI and registry system for easy component management
- **Beautiful Defaults**: Production-ready styling out of the box
- **AI-Ready**: Designed to work well with AI assistants

## Quick Reference

### CLI Commands

```bash
# Initialize shadcn/ui in your project
npx shadcn@latest init

# Add a component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button card dialog

# Add all components
npx shadcn@latest add --all

# Update components
npx shadcn@latest diff

# List available components
npx shadcn@latest add
```

### Configuration (components.json)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## Documentation Index

### Overview

| Topic | URL | Description |
|-------|-----|-------------|
| Introduction | https://ui.shadcn.com/docs | Core principles and getting started |
| CLI | https://ui.shadcn.com/docs/cli | Command-line tool reference |
| components.json | https://ui.shadcn.com/docs/components-json | Configuration file documentation |
| Theming | https://ui.shadcn.com/docs/theming | Colors, typography, design tokens |
| Changelog | https://ui.shadcn.com/docs/changelog | Release notes and version history |
| About | https://ui.shadcn.com/docs/about | Credits and project information |

### Installation by Framework

| Framework | URL | Notes |
|-----------|-----|-------|
| **Vite** | https://ui.shadcn.com/docs/installation/vite | Recommended for this plugin |
| **TanStack Router** | https://ui.shadcn.com/docs/installation/tanstack-router | Works with TanStack ecosystem |
| TanStack Start | https://ui.shadcn.com/docs/installation/tanstack | Full-stack TanStack framework |
| Next.js | https://ui.shadcn.com/docs/installation/next | App Router and Pages Router |
| Remix | https://ui.shadcn.com/docs/installation/remix | Remix framework |
| Astro | https://ui.shadcn.com/docs/installation/astro | Astro framework |
| React Router | https://ui.shadcn.com/docs/installation/react-router | React Router v7+ |
| Laravel | https://ui.shadcn.com/docs/installation/laravel | Laravel Inertia |
| Gatsby | https://ui.shadcn.com/docs/installation/gatsby | Gatsby framework |
| Manual | https://ui.shadcn.com/docs/installation/manual | Without CLI |

---

## Installation Instructions

### TanStack Router (Recommended)

The fastest way to get started with shadcn/ui and TanStack Router:

```bash
# Create new project with shadcn/ui pre-configured
npx create-tsrouter-app@latest my-app --template file-router --tailwind --add-ons shadcn
```

Then add components:

```bash
npx shadcn@latest add button
```

Usage in routes:

```tsx
// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  return (
    <div>
      <Button>Click me</Button>
    </div>
  )
}
```

### Vite Installation

**Step 1: Create project**

```bash
npm create vite@latest
# Select: React + TypeScript
```

**Step 2: Add Tailwind CSS**

```bash
npm install tailwindcss @tailwindcss/vite
```

Replace `src/index.css`:

```css
@import "tailwindcss";
```

**Step 3: Configure TypeScript paths**

Edit `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Edit `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 4: Configure Vite**

```bash
npm install -D @types/node
```

Edit `vite.config.ts`:

```typescript
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
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

**Step 5: Initialize shadcn/ui**

```bash
npx shadcn@latest init
# Select: Neutral as base color
```

**Step 6: Add components**

```bash
npx shadcn@latest add button
```

Usage:

```tsx
// src/App.tsx
import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button>Click me</Button>
    </div>
  )
}

export default App
```

### Manual Installation (Without CLI)

**Step 1: Add Tailwind CSS**

Follow the [Tailwind CSS installation guide](https://tailwindcss.com/docs/installation).

**Step 2: Add dependencies**

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react tw-animate-css
```

**Step 3: Configure path aliases**

In `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Step 4: Configure styles**

Create `src/styles/globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 5: Add cn() helper**

Create `lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 6: Create components.json**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Step 7: Add components**

```bash
npx shadcn@latest add button
```

---

## Components Reference

### Form & Input Components

| Component | URL | Description |
|-----------|-----|-------------|
| **Form** | https://ui.shadcn.com/docs/components/form | React Hook Form + Zod validation |
| **Field** | https://ui.shadcn.com/docs/components/field | Form field with label and error |
| **Button** | https://ui.shadcn.com/docs/components/button | Multiple variants (default, destructive, outline, secondary, ghost, link) |
| Button Group | https://ui.shadcn.com/docs/components/button-group | Group multiple buttons |
| **Input** | https://ui.shadcn.com/docs/components/input | Text input |
| Input Group | https://ui.shadcn.com/docs/components/input-group | Input with prefix/suffix |
| Input OTP | https://ui.shadcn.com/docs/components/input-otp | One-time password input |
| **Textarea** | https://ui.shadcn.com/docs/components/textarea | Multi-line text input |
| **Checkbox** | https://ui.shadcn.com/docs/components/checkbox | Checkbox input |
| **Radio Group** | https://ui.shadcn.com/docs/components/radio-group | Radio button group |
| **Select** | https://ui.shadcn.com/docs/components/select | Select dropdown |
| **Switch** | https://ui.shadcn.com/docs/components/switch | Toggle switch |
| Slider | https://ui.shadcn.com/docs/components/slider | Slider input |
| **Calendar** | https://ui.shadcn.com/docs/components/calendar | Date selection |
| **Date Picker** | https://ui.shadcn.com/docs/components/date-picker | Input + calendar |
| **Combobox** | https://ui.shadcn.com/docs/components/combobox | Searchable select with autocomplete |
| Label | https://ui.shadcn.com/docs/components/label | Form label |

### Layout & Navigation Components

| Component | URL | Description |
|-----------|-----|-------------|
| **Accordion** | https://ui.shadcn.com/docs/components/accordion | Collapsible sections |
| **Breadcrumb** | https://ui.shadcn.com/docs/components/breadcrumb | Navigation breadcrumbs |
| **Navigation Menu** | https://ui.shadcn.com/docs/components/navigation-menu | Accessible nav with dropdowns |
| **Sidebar** | https://ui.shadcn.com/docs/components/sidebar | Collapsible app sidebar |
| **Tabs** | https://ui.shadcn.com/docs/components/tabs | Tabbed interface |
| Separator | https://ui.shadcn.com/docs/components/separator | Visual divider |
| Scroll Area | https://ui.shadcn.com/docs/components/scroll-area | Custom scrollable area |
| Resizable | https://ui.shadcn.com/docs/components/resizable | Resizable panel layout |

### Overlay & Dialog Components

| Component | URL | Description |
|-----------|-----|-------------|
| **Dialog** | https://ui.shadcn.com/docs/components/dialog | Modal dialog |
| **Alert Dialog** | https://ui.shadcn.com/docs/components/alert-dialog | Confirmation prompts |
| **Sheet** | https://ui.shadcn.com/docs/components/sheet | Slide-out panel (drawer) |
| **Drawer** | https://ui.shadcn.com/docs/components/drawer | Mobile-friendly drawer (Vaul) |
| **Popover** | https://ui.shadcn.com/docs/components/popover | Floating popover |
| **Tooltip** | https://ui.shadcn.com/docs/components/tooltip | Additional context on hover |
| Hover Card | https://ui.shadcn.com/docs/components/hover-card | Card on hover |
| Context Menu | https://ui.shadcn.com/docs/components/context-menu | Right-click menu |
| **Dropdown Menu** | https://ui.shadcn.com/docs/components/dropdown-menu | Dropdown menu |
| Menubar | https://ui.shadcn.com/docs/components/menubar | Horizontal menubar |
| **Command** | https://ui.shadcn.com/docs/components/command | Command palette (cmdk) |

### Feedback & Status Components

| Component | URL | Description |
|-----------|-----|-------------|
| **Alert** | https://ui.shadcn.com/docs/components/alert | Messages and notifications |
| **Toast** | https://ui.shadcn.com/docs/components/toast | Toast notifications (Sonner) |
| Progress | https://ui.shadcn.com/docs/components/progress | Progress bar |
| Spinner | https://ui.shadcn.com/docs/components/spinner | Loading spinner |
| **Skeleton** | https://ui.shadcn.com/docs/components/skeleton | Loading placeholder |
| **Badge** | https://ui.shadcn.com/docs/components/badge | Labels and status indicators |
| Empty | https://ui.shadcn.com/docs/components/empty | Empty state |

### Display & Media Components

| Component | URL | Description |
|-----------|-----|-------------|
| **Avatar** | https://ui.shadcn.com/docs/components/avatar | User profile images |
| **Card** | https://ui.shadcn.com/docs/components/card | Card container |
| **Table** | https://ui.shadcn.com/docs/components/table | Data display table |
| **Data Table** | https://ui.shadcn.com/docs/components/data-table | Advanced table with TanStack Table |
| Chart | https://ui.shadcn.com/docs/components/chart | Charts (Recharts) |
| Carousel | https://ui.shadcn.com/docs/components/carousel | Carousel (Embla) |
| Aspect Ratio | https://ui.shadcn.com/docs/components/aspect-ratio | Maintains aspect ratio |
| Typography | https://ui.shadcn.com/docs/components/typography | Typography styles |
| Item | https://ui.shadcn.com/docs/components/item | Generic list item |
| Kbd | https://ui.shadcn.com/docs/components/kbd | Keyboard shortcut display |

### Miscellaneous Components

| Component | URL | Description |
|-----------|-----|-------------|
| Collapsible | https://ui.shadcn.com/docs/components/collapsible | Collapsible container |
| Toggle | https://ui.shadcn.com/docs/components/toggle | Toggle button |
| Toggle Group | https://ui.shadcn.com/docs/components/toggle-group | Group of toggles |
| **Pagination** | https://ui.shadcn.com/docs/components/pagination | Pagination controls |

---

## Dark Mode Setup

| Framework | URL |
|-----------|-----|
| Overview | https://ui.shadcn.com/docs/dark-mode |
| **Vite** | https://ui.shadcn.com/docs/dark-mode/vite |
| Next.js | https://ui.shadcn.com/docs/dark-mode/next |
| Astro | https://ui.shadcn.com/docs/dark-mode/astro |
| Remix | https://ui.shadcn.com/docs/dark-mode/remix |

---

## Forms Integration

| Topic | URL | Description |
|-------|-----|-------------|
| Overview | https://ui.shadcn.com/docs/forms | Forms guide |
| **React Hook Form** | https://ui.shadcn.com/docs/forms/react-hook-form | Recommended for this plugin |
| TanStack Form | https://ui.shadcn.com/docs/forms/tanstack-form | Alternative form library |
| Next.js Server Actions | https://ui.shadcn.com/docs/forms/next | Server-side forms |

---

## Advanced Topics

| Topic | URL | Description |
|-------|-----|-------------|
| Monorepo | https://ui.shadcn.com/docs/monorepo | Monorepo setup |
| **React 19** | https://ui.shadcn.com/docs/react-19 | React 19 support |
| **Tailwind CSS v4** | https://ui.shadcn.com/docs/tailwind-v4 | Tailwind v4 setup |
| JavaScript | https://ui.shadcn.com/docs/javascript | Non-TypeScript usage |
| Figma | https://ui.shadcn.com/docs/figma | Design resources |
| v0 | https://ui.shadcn.com/docs/v0 | AI UI generation |

---

## MCP Server Integration

shadcn/ui provides an MCP (Model Context Protocol) server for AI integrations:

**URL**: https://ui.shadcn.com/docs/mcp

**Features**:
- Browse components from registries
- Search components by name or description
- Install components using natural language
- Works with Claude Code, Cursor, VS Code, Codex

**Setup for Claude Code**:
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "shadcn@canary", "mcp"]
    }
  }
}
```

---

## Registry System

| Topic | URL | Description |
|-------|-----|-------------|
| Overview | https://ui.shadcn.com/docs/registry | Creating registries |
| Getting Started | https://ui.shadcn.com/docs/registry/getting-started | Setup guide |
| Examples | https://ui.shadcn.com/docs/registry/examples | Example registries |
| FAQ | https://ui.shadcn.com/docs/registry/faq | Common questions |
| Authentication | https://ui.shadcn.com/docs/registry/authentication | Auth for registries |
| Registry MCP | https://ui.shadcn.com/docs/registry/mcp | MCP integration |

### Registry Schemas

| Schema | URL |
|--------|-----|
| Registry Index | https://ui.shadcn.com/schema/registry.json |
| Registry Item | https://ui.shadcn.com/schema/registry-item.json |

---

## Common Patterns

### Installing Components for a Feature

```bash
# Authentication flow
npx shadcn@latest add button input form label card

# Dashboard layout
npx shadcn@latest add sidebar navigation-menu breadcrumb avatar dropdown-menu

# Data display
npx shadcn@latest add table data-table pagination skeleton

# Forms
npx shadcn@latest add form field input select checkbox radio-group switch calendar date-picker combobox

# Feedback
npx shadcn@latest add alert toast dialog alert-dialog
```

### File Structure After Installation

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
├── lib/
│   └── utils.ts          # cn() utility function
└── index.css             # Tailwind + CSS variables
```

### The `cn()` Utility

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<Button className={cn("w-full", isLoading && "opacity-50")} />
```

### Button Variants

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconName /></Button>
```

### Form with React Hook Form + Zod

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Data Table with TanStack Table

```tsx
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

type User = {
  id: string
  name: string
  email: string
}

const columns: ColumnDef<User>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
]

export function UsersTable({ data }: { data: User[] }) {
  return <DataTable columns={columns} data={data} />
}
```

---

## Theming

### CSS Variables

```css
/* index.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... dark mode values */
  }
}
```

### Using Theme Colors

```tsx
// In components
<div className="bg-background text-foreground" />
<div className="bg-primary text-primary-foreground" />
<div className="bg-secondary text-secondary-foreground" />
<div className="bg-muted text-muted-foreground" />
<div className="bg-accent text-accent-foreground" />
<div className="bg-destructive text-destructive-foreground" />
<div className="border-border" />
<div className="ring-ring" />
```

---

## Best Practices

### 1. Component Organization

```
src/components/
├── ui/                 # shadcn/ui components (don't modify directly)
│   ├── button.tsx
│   └── ...
├── forms/              # Form-specific compositions
│   ├── login-form.tsx
│   └── ...
├── layout/             # Layout components
│   ├── header.tsx
│   └── sidebar.tsx
└── features/           # Feature-specific components
    └── dashboard/
```

### 2. Extending Components

```tsx
// components/ui/button.tsx is the base
// Create variants in your own components:

import { Button } from "@/components/ui/button"

export function LoadingButton({ loading, children, ...props }) {
  return (
    <Button disabled={loading} {...props}>
      {loading ? <Spinner className="mr-2" /> : null}
      {children}
    </Button>
  )
}
```

### 3. Consistent Spacing

```tsx
// Use Tailwind's spacing scale
<div className="space-y-4">      {/* 1rem gap */}
  <Card className="p-6">          {/* 1.5rem padding */}
    <CardHeader className="pb-4"> {/* 1rem bottom padding */}
    <CardContent className="pt-0">
  </Card>
</div>
```

### 4. Responsive Design

```tsx
<Dialog>
  <DialogContent className="sm:max-w-[425px]">
    {/* Mobile: full width, Desktop: max 425px */}
  </DialogContent>
</Dialog>

<Sheet side="left" className="w-[300px] sm:w-[400px]">
  {/* Responsive sidebar width */}
</Sheet>
```

---

## Integration with This Plugin

This skill complements other frontend plugin skills:

- **react-patterns**: React 19 patterns work with shadcn/ui components
- **tanstack-router**: Type-safe routing with shadcn/ui layouts
- **tanstack-query**: Data fetching for Data Tables and forms
- **api-integration**: API types for form validation schemas
- **tooling-setup**: Vite + Tailwind setup for shadcn/ui

### Recommended Installation Order

1. Set up Vite + React + TypeScript + Tailwind (tooling-setup skill)
2. Initialize shadcn/ui: `npx shadcn@latest init`
3. Install base components: `npx shadcn@latest add button card`
4. Set up TanStack Router (tanstack-router skill)
5. Add form components as needed

---

## Troubleshooting

### Common Issues

**"Cannot find module '@/components/ui/button'"**
- Check `tsconfig.json` paths alias matches `components.json` aliases

**Components look unstyled**
- Ensure Tailwind CSS is properly configured
- Check that `index.css` imports are correct
- Verify CSS variables are defined in `:root`

**Dark mode not working**
- Add `dark` class to `<html>` element
- Use a theme provider (next-themes for Next.js)

**TypeScript errors with form components**
- Install `@hookform/resolvers` and `zod`
- Ensure `react-hook-form` is installed

---
name: css-modules
description: |
  CSS Modules with Lightning CSS and PostCSS for component-scoped styling.
  Covers *.module.css patterns, TypeScript integration, Vite configuration, and composition.
  Use when building complex animations, styling third-party components, or migrating legacy CSS.
---

# CSS Modules

## Overview

CSS Modules provide locally-scoped CSS by automatically generating unique class names at build time. This prevents style conflicts and enables true component encapsulation.

## When to Use CSS Modules

| Use Case | CSS Modules | Tailwind |
|----------|-------------|----------|
| Complex animations | Best | Good |
| Third-party component styling | Best | Harder |
| Legacy CSS migration | Best | Refactor needed |
| Rapid prototyping | Slower | Best |
| Design system utilities | Not ideal | Best |
| Component encapsulation | Best | N/A |
| Team with CSS expertise | Best | Either |

**Hybrid Approach**: Use both together - Tailwind for utilities, CSS Modules for complex components.

---

## Documentation Index

### Vite Integration

| Topic | URL | Description |
|-------|-----|-------------|
| CSS Modules in Vite | https://vite.dev/guide/features#css-modules | Vite's built-in support |
| Lightning CSS | https://vite.dev/guide/features#lightning-css | Fast CSS transforms |
| PostCSS | https://vite.dev/guide/features#postcss | PostCSS configuration |

### Lightning CSS

| Topic | URL | Description |
|-------|-----|-------------|
| Documentation | https://lightningcss.dev/docs.html | Official docs |
| CSS Modules | https://lightningcss.dev/css-modules.html | Module support |
| Transpilation | https://lightningcss.dev/transpilation.html | Browser targeting |
| Bundling | https://lightningcss.dev/bundling.html | CSS bundling |

### CSS Modules Spec

| Topic | URL | Description |
|-------|-----|-------------|
| CSS Modules | https://github.com/css-modules/css-modules | Specification |
| Composition | https://github.com/css-modules/css-modules#composition | Composing classes |
| Scoping | https://github.com/css-modules/css-modules#naming | Local vs global |

### TypeScript Integration

| Topic | URL | Description |
|-------|-----|-------------|
| typed-css-modules | https://github.com/Quramy/typed-css-modules | Generate .d.ts files |
| vite-plugin-css-modules-dts | https://github.com/mrcjkb/vite-plugin-css-modules-dts | Vite plugin |

---

## CSS Modules Fundamentals

### File Naming Convention

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css      # CSS Module
│   │   └── Button.test.tsx
│   └── Card/
│       ├── Card.tsx
│       ├── Card.module.css        # CSS Module
│       └── index.ts
```

Files ending in `.module.css` are automatically processed as CSS Modules.

### Basic Usage

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 150ms ease;
}

.primary {
  background-color: hsl(221, 83%, 53%);
  color: white;
}

.primary:hover {
  background-color: hsl(224, 76%, 48%);
}

.secondary {
  background-color: hsl(0, 0%, 96%);
  color: hsl(0, 0%, 9%);
}
```

```tsx
// Button.tsx
import styles from './Button.module.css'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  )
}
```

### Generated Class Names

```html
<!-- Input -->
<button class="${styles.button} ${styles.primary}">

<!-- Output (generated) -->
<button class="Button_button_x7d9f Button_primary_a3k2j">
```

### Local vs Global Scope

```css
/* Local by default */
.button {
  /* Generates: Button_button_hash */
}

/* Explicit local */
:local(.button) {
  /* Same as above */
}

/* Global (escape hatch) */
:global(.external-library-class) {
  /* Kept as-is: .external-library-class */
}

/* Global within local */
.card :global(.markdown-body) {
  /* Scoped parent, global child */
}
```

---

## Composition

### composes Keyword

Share styles between classes:

```css
/* base.module.css */
.flexCenter {
  display: flex;
  align-items: center;
  justify-content: center;
}

.interactive {
  cursor: pointer;
  transition: all 150ms ease;
}
```

```css
/* Button.module.css */
.button {
  composes: flexCenter from './base.module.css';
  composes: interactive from './base.module.css';
  padding: 0.5rem 1rem;
}
```

### Multiple Compositions

```css
.primaryButton {
  composes: button;
  composes: primary from './colors.module.css';
  composes: rounded from './shapes.module.css';
}
```

### Usage in React

```tsx
// Composed class automatically includes all composed classes
<button className={styles.primaryButton}>
  {/* Renders: Button_primaryButton_x Button_button_y colors_primary_z shapes_rounded_w */}
</button>
```

---

## Vite Configuration

### Lightning CSS (Recommended)

Lightning CSS is 100x faster than PostCSS for transforms:

```bash
npm install lightningcss browserslist
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import browserslistToTargets from 'lightningcss/browserslist'
import browserslist from 'browserslist'

export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist('>= 0.25%')),
      cssModules: {
        // Class name pattern
        pattern: '[name]__[local]_[hash:5]',
        // Or for production:
        // pattern: '[hash:8]'
      }
    }
  },
  build: {
    cssMinify: 'lightningcss'
  }
})
```

### Class Name Patterns

| Pattern | Example Output |
|---------|----------------|
| `[name]__[local]_[hash:5]` | `Button__primary_a3k2j` |
| `[local]_[hash:8]` | `primary_a3k2j9x1` |
| `[hash:8]` | `a3k2j9x1` (production) |

### Lightning CSS Features (Included)

Lightning CSS automatically handles:
- Vendor prefixing (replaces autoprefixer)
- Modern syntax transpilation
- Nesting
- Custom media queries
- Color functions (oklch, lab, lch)

### PostCSS Configuration (When Needed)

For plugins Lightning CSS doesn't support:

```javascript
// postcss.config.js
export default {
  plugins: {
    'postcss-import': {},
    'postcss-custom-media': {},
    // Don't use: autoprefixer (Lightning CSS handles this)
    // Don't use: postcss-nested (Lightning CSS handles this)
  }
}
```

**Note**: Use Lightning CSS for transforms, PostCSS only for unsupported plugins.

---

## TypeScript Integration

### Type Declarations

Without types, TypeScript doesn't know the shape of CSS modules:

```typescript
// This would error without declarations
import styles from './Button.module.css'
styles.button  // TS error: Property 'button' does not exist
```

### Option 1: Wildcard Declaration (Simple)

```typescript
// src/vite-env.d.ts or src/types/css-modules.d.ts
declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}
```

**Pros**: No extra tooling
**Cons**: No autocomplete, no type safety

### Option 2: Generated Declarations (Recommended)

```bash
npm install -D vite-plugin-css-modules-dts
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssModulesDts from 'vite-plugin-css-modules-dts'

export default defineConfig({
  plugins: [
    react(),
    cssModulesDts({
      // Generate .d.ts next to .module.css files
      outputDir: '.',
    })
  ]
})
```

Generated files:

```typescript
// Button.module.css.d.ts (auto-generated)
declare const styles: {
  readonly button: string
  readonly primary: string
  readonly secondary: string
}
export default styles
```

**Pros**: Full autocomplete, type safety, catches typos
**Cons**: Generated files in source (add to .gitignore)

### Option 3: CLI Generation

```bash
npm install -D typed-css-modules

# Generate declarations
npx tcm src --pattern '**/*.module.css'

# Watch mode
npx tcm src --pattern '**/*.module.css' --watch
```

Add to `package.json`:

```json
{
  "scripts": {
    "css:types": "tcm src --pattern '**/*.module.css'",
    "css:types:watch": "tcm src --pattern '**/*.module.css' --watch"
  }
}
```

---

## Patterns

### Component-Scoped Styling

```css
/* Card.module.css */
.card {
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header {
  padding: 1rem;
  border-bottom: 1px solid hsl(0, 0%, 90%);
}

.content {
  padding: 1.5rem;
}

.footer {
  padding: 1rem;
  background: hsl(0, 0%, 98%);
}
```

```tsx
// Card.tsx
import styles from './Card.module.css'

export function Card({ children }: { children: React.ReactNode }) {
  return <div className={styles.card}>{children}</div>
}

Card.Header = ({ children }: { children: React.ReactNode }) => (
  <header className={styles.header}>{children}</header>
)

Card.Content = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.content}>{children}</div>
)

Card.Footer = ({ children }: { children: React.ReactNode }) => (
  <footer className={styles.footer}>{children}</footer>
)
```

### CSS Variables with Modules

```css
/* theme.css (global) */
:root {
  --color-primary: hsl(221, 83%, 53%);
  --color-primary-dark: hsl(224, 76%, 48%);
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
}

/* Button.module.css */
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
}

.button:hover {
  background-color: var(--color-primary-dark);
}
```

### Theming with CSS Variables

```css
/* theme.module.css */
.light {
  --bg: white;
  --text: hsl(0, 0%, 9%);
  --border: hsl(0, 0%, 90%);
}

.dark {
  --bg: hsl(0, 0%, 9%);
  --text: hsl(0, 0%, 98%);
  --border: hsl(0, 0%, 20%);
}

/* Component.module.css */
.component {
  background-color: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
}
```

### Complex Animations

CSS Modules excel at complex animations:

```css
/* Modal.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 200ms ease;
}

.overlayVisible {
  composes: overlay;
  opacity: 1;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  opacity: 0;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modalVisible {
  composes: modal;
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

@keyframes slideIn {
  from {
    transform: translate(-50%, -50%) translateY(20px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) translateY(0) scale(1);
    opacity: 1;
  }
}

.modalAnimated {
  animation: slideIn 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## Hybrid Approach: CSS Modules + Tailwind

Use both together for maximum flexibility:

```tsx
import styles from './ComplexCard.module.css'

function ComplexCard({ title, children }: Props) {
  return (
    // Tailwind for layout, CSS Module for complex styles
    <div className={`${styles.card} p-4 md:p-6`}>
      <h2 className={`${styles.title} text-lg font-semibold mb-2`}>
        {title}
      </h2>
      <div className={styles.animatedContent}>
        {children}
      </div>
    </div>
  )
}
```

### When to Use Which

| Scenario | Approach |
|----------|----------|
| Layout utilities (flex, grid, spacing) | Tailwind |
| Responsive utilities | Tailwind |
| State variants (hover, focus) | Tailwind |
| Complex animations | CSS Modules |
| Keyframe animations | CSS Modules |
| Third-party component overrides | CSS Modules |
| Component state classes | CSS Modules |
| Design system utilities | Tailwind |
| One-off complex styles | CSS Modules |

---

## Performance Benefits

### Lightning CSS Advantages

| Feature | Speed Improvement |
|---------|-------------------|
| CSS parsing | 100x faster than PostCSS |
| Vendor prefixing | Built-in, instant |
| Minification | Faster than cssnano |
| Bundling | Parallel processing |

### Dead Code Elimination

Vite automatically eliminates unused CSS:
- CSS Modules are naturally tree-shaken (only imported classes included)
- Lightning CSS removes unused selectors

### Bundle Size Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    cssMinify: 'lightningcss',
    cssCodeSplit: true,  // Separate CSS per chunk
  }
})
```

---

## Related Skills

- **tailwindcss** - Utility-first CSS (complementary approach)
- **shadcn-ui** - Component library using CSS variables
- **react-typescript** - Component patterns with className
- **testing-frontend** - Testing styled components

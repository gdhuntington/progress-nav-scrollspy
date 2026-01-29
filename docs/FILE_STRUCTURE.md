# File Structure

This document describes every file in the Progress Nav Scrollspy project, explaining its purpose and contents.

## Project Root

```
progress_nav_scrollspy/
├── .git/                    # Git repository data
├── .gitignore               # Git ignore rules
├── demo/                    # Demo application
├── dist/                    # Compiled distribution files
├── docs/                    # Documentation
├── node_modules/            # Dependencies (not committed)
├── src/                     # Source code
├── test_docs/               # Test markdown documents
├── package.json             # Package configuration
├── package-lock.json        # Dependency lock file
├── README.md                # Main readme
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration for demo
```

---

## Source Files (`src/`)

### `src/index.ts`

**Purpose:** Package entry point that re-exports all public APIs.

**Contents:**
- Default export of `ProgressNavScrollspy` component
- Named export of `ProgressNavScrollspy` component
- Type exports (`TocItem`, `ProgressNavScrollspyProps`, etc.)
- Hook exports for advanced usage
- Utility function exports

**Why:** Provides a clean public API surface. Consumers import from the package root and this file determines what's accessible.

---

### `src/ProgressNavScrollspy.tsx`

**Purpose:** Main React component implementation.

**Contents:**
- Component props destructuring with defaults
- Hook integrations (`useAutoExtractHeadings`, `useVisibleSections`, etc.)
- Callback effect handlers
- Click handler with accessibility focus management
- Nested item rendering logic
- Loading skeleton state
- SVG rendering with gradient support
- TOC link rendering

**Key Exports:**
- `ProgressNavScrollspy` - Named export
- `default` - Default export (same component)

**Why:** Separates the UI composition from the business logic (hooks). The component orchestrates hooks and renders the visual output.

---

### `src/hooks.ts`

**Purpose:** Custom React hooks containing the core logic.

**Contents:**

#### `findScrollParent(element)`
Internal helper that traverses DOM to find the nearest scrollable ancestor by checking `overflow` and `overflow-y` CSS properties.

#### `useVisibleSections(items, options)`
The most complex hook - handles:
- Scroll container detection
- Scroll velocity calculation
- Active section determination
- Direct DOM updates for SVG indicator
- Active class toggling on links
- TOC auto-scroll behavior
- Cache management for link positions

#### `useAutoExtractHeadings(contentSelector, headingSelector, minLevel, maxLevel, providedItems)`
Extracts headings from DOM on mount with a small delay (50ms) to ensure DOM is ready. Returns items array and loading state.

#### `usePathSegments(items, activeItems, containerRef)`
Calculates SVG path geometry:
- Measures link positions relative to list container
- Computes track start/end coordinates
- Calculates active segment position
- Returns dash array values for SVG animation

#### `useReadingProgress(contentSelector, enabled)`
Tracks scroll progress as percentage using throttled scroll listener.

#### `useHashUpdate(activeItems, enabled)`
Updates browser URL hash using `history.replaceState()` when active section changes.

**Why:** Hooks encapsulate reusable stateful logic. Each hook has a single responsibility, making them composable and testable.

---

### `src/utils.ts`

**Purpose:** Pure utility functions with no React dependencies.

**Contents:**

#### `generateSlug(text)`
Converts text to URL-friendly slug (lowercase, hyphenated, no special chars).

#### `extractHeadingsFromDOM(container, selector, minLevel, maxLevel)`
Queries DOM for headings, ensures unique IDs, assigns IDs to elements missing them.

#### `extractHeadingsFromMarkdown(markdown, minLevel, maxLevel)`
Parses markdown string for ATX-style headers (`# Header`).

#### `buildNestedStructure(items)`
Converts flat heading list to nested tree using stack-based algorithm.

#### `flattenStructure(items)`
Inverse of `buildNestedStructure` - flattens tree to list via depth-first traversal.

#### `calculateReadingProgress(scrollContainer, contentContainer)`
Pure function calculating scroll percentage (used internally by `useReadingProgress`).

#### `findScrollableParent(element)`
Internal helper similar to `findScrollParent` in hooks.ts (could be deduplicated).

#### `scrollToElement(elementId, offset, behavior)`
Programmatic smooth scroll that works with nested scroll containers, not just window.

#### `debounce(fn, delay)`
Standard debounce implementation - delays execution until `delay` ms after last call.

#### `throttle(fn, limit)`
Standard throttle implementation - limits execution to once per `limit` ms.

**Why:** Pure functions are easy to test and can be used outside React. Separating them from hooks keeps the codebase modular.

---

### `src/types.ts`

**Purpose:** TypeScript type definitions.

**Contents:**

#### `TocItem`
Core data structure for TOC entries with `id`, `text`, `level`, and optional `children`.

#### `ProgressNavScrollspyProps`
Full props interface for the main component with JSDoc comments for all properties.

#### `VisibilityState`
Internal type for tracking visibility state of sections (used in earlier implementation, kept for compatibility).

#### `PathSegment`
Type for SVG path segment data.

**Why:** Centralized types provide single source of truth. JSDoc comments enable IDE intellisense.

---

### `src/styles.css`

**Purpose:** Component styles using CSS variables for theming.

**Contents:**
- CSS custom properties (variables) on `.pns-container`
- Dark mode overrides (`.pns-dark`, `[data-theme="dark"]`, `.dark`)
- Header styles (title, progress percentage)
- Content wrapper and SVG positioning
- Link styles (base, hover, active, level-specific)
- Focus styles for accessibility
- Loading skeleton with shimmer animation
- Fade-in animation for indicator
- Responsive adjustments
- Print styles (hidden)
- High contrast mode support
- Reduced motion support

**Why:** CSS-in-JS alternatives would add dependencies. Plain CSS with variables provides flexibility without build complexity.

---

## Distribution Files (`dist/`)

The `dist/` folder contains compiled JavaScript and TypeScript declaration files.

### `dist/index.js`

Compiled entry point that re-exports from other modules.

### `dist/index.d.ts`

TypeScript declarations for the entry point.

### `dist/ProgressNavScrollspy.js`

Compiled component code (ESM format).

### `dist/ProgressNavScrollspy.d.ts`

TypeScript declarations for the component.

### `dist/hooks.js`

Compiled hooks code.

### `dist/hooks.d.ts`

TypeScript declarations for hooks.

### `dist/utils.js`

Compiled utility functions.

### `dist/utils.d.ts`

TypeScript declarations for utilities.

### `dist/types.js`

Nearly empty file (types are compile-time only).

### `dist/types.d.ts`

TypeScript declarations for all types.

### `dist/styles.css`

Copy of `src/styles.css` for distribution.

### `*.d.ts.map` files

Source maps linking declarations back to TypeScript source.

**Why:** Separate files allow tree-shaking. Declaration files enable TypeScript support for consumers.

---

## Demo Application (`demo/`)

### `demo/App.tsx`

**Purpose:** Demo application showcasing the component.

**Contents:**
- Document selector dropdown with multiple test documents
- Dark mode toggle
- Progress and hash update toggles
- Markdown-to-HTML converter (basic implementation)
- Split layout with sidebar and content area
- ProgressNavScrollspy integration with all options

**Why:** Provides visual testing environment and usage example.

### `demo/index.html`

Basic HTML shell for Vite to inject the React app.

### `demo/main.tsx`

React DOM render entry point.

### `demo/styles.css`

Demo-specific styles (layout, header, content formatting).

---

## Test Documents (`test_docs/`)

Markdown files used for testing the component:

- `sql-conventions.md` - SQL coding standards document
- `Project Presentation.md` - Project overview
- `Project Proposal.md` - Project proposal document
- `Private Enterprise AI Platform.md` - Technical specification

**Why:** Real-world documents with varying heading depths and content lengths for thorough testing.

---

## Configuration Files

### `package.json`

**Purpose:** NPM package configuration.

**Key Fields:**
- `name`: `@webzicon/progress-nav-scrollspy`
- `version`: `1.0.0`
- `type`: `module` (ESM)
- `main`/`module`: Point to `dist/index.js`
- `types`: Points to `dist/index.d.ts`
- `exports`: Modern exports map including styles
- `files`: Specifies what to include in npm package
- `peerDependencies`: React 17+
- `scripts`: Build, dev, and demo commands

### `tsconfig.json`

**Purpose:** TypeScript compiler configuration.

**Key Settings:**
- `target`: ES2020
- `module`: ESNext
- `declaration`: true (generates .d.ts files)
- `declarationMap`: true (generates .d.ts.map files)
- `outDir`: `./dist`
- `strict`: true
- `jsx`: react-jsx

### `vite.config.ts`

**Purpose:** Vite configuration for the demo application.

**Contents:**
- React plugin configuration
- Root set to `demo/` directory

### `.gitignore`

**Purpose:** Specifies files Git should ignore.

**Contents:**
- `node_modules/`
- Build artifacts
- IDE files
- OS files

---

## Build Output

When you run `npm run build`:

1. TypeScript compiles `src/*.ts(x)` to `dist/*.js`
2. Declaration files are generated as `dist/*.d.ts`
3. Source maps are generated as `dist/*.d.ts.map`
4. `npm run copy-css` copies `src/styles.css` to `dist/styles.css`

The resulting `dist/` folder is what gets published to npm (along with `README.md`).

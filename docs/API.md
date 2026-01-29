# API Reference

Complete API documentation for the Progress Nav Scrollspy component.

## Table of Contents

1. [Installation](#installation)
2. [Component](#component)
3. [Types](#types)
4. [Hooks](#hooks)
5. [Utility Functions](#utility-functions)
6. [CSS Classes](#css-classes)
7. [CSS Variables](#css-variables)

---

## Installation

```bash
npm install @webzicon/progress-nav-scrollspy
```

### Import Styles

```tsx
// Import in your entry file
import '@webzicon/progress-nav-scrollspy/styles';

// Or in CSS
@import '@webzicon/progress-nav-scrollspy/styles';
```

---

## Component

### ProgressNavScrollspy

The main component for rendering the table of contents with progress indicator.

```tsx
import { ProgressNavScrollspy } from '@webzicon/progress-nav-scrollspy';
```

#### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `items` | `TocItem[]` | `undefined` | No | Manually provide TOC items. If not provided, headings are auto-extracted from the DOM. |
| `contentSelector` | `string` | `'.content'` | No | CSS selector for the scrollable content container containing headings. |
| `headingSelector` | `string` | `'h1, h2, h3, h4, h5, h6'` | No | CSS selector for heading elements to include in the TOC. |
| `activeColor` | `string \| string[]` | `'var(--pns-active-color, #3b82f6)'` | No | Color for the active indicator. Pass an array for gradient effect. |
| `trackColor` | `string` | `'var(--pns-track-color, #e5e7eb)'` | No | Color for the background track line. |
| `strokeWidth` | `number` | `2` | No | Width of the SVG stroke in pixels. |
| `offset` | `number` | `100` | No | Pixel offset from viewport top for determining active sections. |
| `showProgress` | `boolean` | `false` | No | Whether to display reading progress percentage. |
| `updateHash` | `boolean` | `false` | No | Whether to update URL hash as user scrolls. |
| `title` | `string` | `'On this page'` | No | Title text displayed above the TOC. |
| `showTitle` | `boolean` | `true` | No | Whether to show the title section. |
| `className` | `string` | `''` | No | Additional CSS class(es) for the container element. |
| `animationDuration` | `number` | `150` | No | Duration of CSS transitions in milliseconds. |
| `minLevel` | `number` | `1` | No | Minimum heading level to include (1-6). |
| `maxLevel` | `number` | `6` | No | Maximum heading level to include (1-6). |
| `onItemClick` | `(item: TocItem) => void` | `undefined` | No | Callback fired when a TOC link is clicked. |
| `onActiveChange` | `(activeItems: TocItem[]) => void` | `undefined` | No | Callback fired when active sections change. |
| `onProgressChange` | `(progress: number) => void` | `undefined` | No | Callback fired when reading progress changes (only if `showProgress` is true). |
| `intersectionThreshold` | `number` | `0` | No | Legacy prop (not currently used). |
| `intersectionRootMargin` | `string` | `'-100px 0px -66% 0px'` | No | Legacy prop (not currently used). |

#### Basic Example

```tsx
<ProgressNavScrollspy
  contentSelector=".article-content"
  headingSelector="h2, h3, h4"
  showProgress={true}
  title="Contents"
/>
```

#### Advanced Example

```tsx
<ProgressNavScrollspy
  items={customItems}
  activeColor={['#3b82f6', '#8b5cf6']}
  trackColor="#1f2937"
  strokeWidth={3}
  offset={80}
  showProgress={true}
  updateHash={true}
  title="On this page"
  showTitle={true}
  className="my-custom-toc"
  animationDuration={200}
  minLevel={2}
  maxLevel={4}
  onItemClick={(item) => {
    console.log('Clicked:', item.text);
    analytics.track('toc_click', { section: item.id });
  }}
  onActiveChange={(items) => {
    console.log('Active sections:', items.map(i => i.text));
  }}
  onProgressChange={(progress) => {
    console.log(`Reading progress: ${progress}%`);
  }}
/>
```

---

## Types

### TocItem

Represents a single item in the table of contents.

```typescript
interface TocItem {
  /** Unique identifier for the heading (used for scroll targeting) */
  id: string;

  /** Display text for the heading */
  text: string;

  /** Heading level (1-6, corresponds to h1-h6) */
  level: number;

  /** Optional child items for nested structure */
  children?: TocItem[];
}
```

#### Example

```typescript
const item: TocItem = {
  id: 'getting-started',
  text: 'Getting Started',
  level: 2,
  children: [
    { id: 'installation', text: 'Installation', level: 3 },
    { id: 'configuration', text: 'Configuration', level: 3 },
  ],
};
```

### ProgressNavScrollspyProps

Full props interface for the component. See [Props](#props) section above.

### VisibilityState

Internal state for tracking section visibility.

```typescript
interface VisibilityState {
  [id: string]: {
    isVisible: boolean;
    ratio: number;
    top: number;
  };
}
```

### PathSegment

Represents a segment of the SVG path.

```typescript
interface PathSegment {
  itemId: string;
  top: number;
  height: number;
  isActive: boolean;
}
```

---

## Hooks

All hooks can be imported for custom implementations:

```typescript
import {
  useVisibleSections,
  useAutoExtractHeadings,
  usePathSegments,
  useReadingProgress,
  useHashUpdate,
} from '@webzicon/progress-nav-scrollspy';
```

### useAutoExtractHeadings

Extracts headings from the DOM and returns them as `TocItem[]`.

```typescript
function useAutoExtractHeadings(
  contentSelector: string,
  headingSelector: string,
  minLevel: number,
  maxLevel: number,
  providedItems?: TocItem[]
): { items: TocItem[]; isLoading: boolean }
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `contentSelector` | `string` | CSS selector for the content container |
| `headingSelector` | `string` | CSS selector for heading elements |
| `minLevel` | `number` | Minimum heading level (1-6) |
| `maxLevel` | `number` | Maximum heading level (1-6) |
| `providedItems` | `TocItem[]` | Optional pre-defined items (skips extraction) |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `items` | `TocItem[]` | Extracted or provided TOC items |
| `isLoading` | `boolean` | True during extraction delay |

#### Example

```tsx
function MyComponent() {
  const { items, isLoading } = useAutoExtractHeadings(
    '.content',
    'h2, h3',
    2,
    3
  );

  if (isLoading) return <Skeleton />;
  return <ul>{items.map(item => <li key={item.id}>{item.text}</li>)}</ul>;
}
```

### useVisibleSections

Tracks which sections are currently visible based on scroll position.

```typescript
function useVisibleSections(
  items: TocItem[],
  options?: {
    offset?: number;
    svgIndicatorRef?: React.RefObject<SVGPathElement | null>;
    tocContainerRef?: React.RefObject<HTMLElement | null>;
    velocityThreshold?: number;
    tocScrollPadding?: number;
    viewportThreshold?: number;
  }
): { activeItems: TocItem[] }
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `items` | `TocItem[]` | - | TOC items to track |
| `options.offset` | `number` | `100` | Offset from viewport top |
| `options.svgIndicatorRef` | `RefObject` | - | Ref for direct SVG updates |
| `options.tocContainerRef` | `RefObject` | - | Ref for TOC container |
| `options.velocityThreshold` | `number` | `2` | Pixels/ms threshold for fast scroll detection |
| `options.tocScrollPadding` | `number` | `20` | Padding when auto-scrolling TOC |
| `options.viewportThreshold` | `number` | `0.8` | Viewport percentage for visibility |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `activeItems` | `TocItem[]` | Currently visible/active items |

#### Example

```tsx
function MyTOC() {
  const indicatorRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  const { activeItems } = useVisibleSections(items, {
    offset: 120,
    svgIndicatorRef: indicatorRef,
    tocContainerRef: containerRef,
    velocityThreshold: 3,
  });

  return (
    <nav ref={containerRef}>
      <svg>
        <path ref={indicatorRef} />
      </svg>
      {/* ... */}
    </nav>
  );
}
```

### usePathSegments

Calculates SVG path geometry for the progress indicator.

```typescript
function usePathSegments(
  items: TocItem[],
  activeItems: TocItem[],
  containerRef: React.RefObject<HTMLElement | null>
): {
  trackPath: string;
  pathData: { totalLength: number; activeStart: number; activeLength: number };
  updateSegments: () => void;
  segments: PathSegment[];
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `items` | `TocItem[]` | All TOC items |
| `activeItems` | `TocItem[]` | Currently active items |
| `containerRef` | `RefObject` | Ref to the nav container |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `trackPath` | `string` | SVG path `d` attribute value |
| `pathData.totalLength` | `number` | Total track length in pixels |
| `pathData.activeStart` | `number` | Start position of active segment |
| `pathData.activeLength` | `number` | Length of active segment |
| `updateSegments` | `() => void` | Function to force recalculation |
| `segments` | `PathSegment[]` | Individual path segments (legacy) |

### useReadingProgress

Tracks reading progress as a percentage (0-100).

```typescript
function useReadingProgress(
  contentSelector: string,
  enabled?: boolean
): number
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `contentSelector` | `string` | - | CSS selector for content container |
| `enabled` | `boolean` | `true` | Whether to track progress |

#### Returns

`number` - Progress percentage from 0 to 100.

#### Example

```tsx
function ProgressBar() {
  const progress = useReadingProgress('.article', true);
  return <div style={{ width: `${progress}%` }} />;
}
```

### useHashUpdate

Updates the URL hash based on the currently active section.

```typescript
function useHashUpdate(
  activeItems: TocItem[],
  enabled?: boolean
): void
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `activeItems` | `TocItem[]` | - | Currently active items |
| `enabled` | `boolean` | `false` | Whether to update hash |

#### Example

```tsx
function MyTOC() {
  const { activeItems } = useVisibleSections(items);
  useHashUpdate(activeItems, true);  // URL updates as you scroll
  // ...
}
```

---

## Utility Functions

```typescript
import {
  generateSlug,
  extractHeadingsFromDOM,
  extractHeadingsFromMarkdown,
  buildNestedStructure,
  flattenStructure,
  calculateReadingProgress,
  scrollToElement,
  debounce,
  throttle,
} from '@webzicon/progress-nav-scrollspy';
```

### generateSlug

Generates a URL-friendly slug from text.

```typescript
function generateSlug(text: string): string
```

#### Example

```typescript
generateSlug('Hello World!')      // 'hello-world'
generateSlug('API Reference')     // 'api-reference'
generateSlug('  Multiple   Spaces  ') // 'multiple-spaces'
```

### extractHeadingsFromDOM

Extracts headings from a DOM container element.

```typescript
function extractHeadingsFromDOM(
  container: Element,
  selector?: string,
  minLevel?: number,
  maxLevel?: number
): TocItem[]
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `container` | `Element` | - | DOM element to search within |
| `selector` | `string` | `'h1, h2, h3, h4, h5, h6'` | Heading selector |
| `minLevel` | `number` | `1` | Minimum level |
| `maxLevel` | `number` | `6` | Maximum level |

#### Example

```typescript
const container = document.querySelector('.content');
const headings = extractHeadingsFromDOM(container, 'h2, h3', 2, 3);
```

### extractHeadingsFromMarkdown

Extracts headings from a markdown string.

```typescript
function extractHeadingsFromMarkdown(
  markdown: string,
  minLevel?: number,
  maxLevel?: number
): TocItem[]
```

#### Example

```typescript
const markdown = `
# Title
## Section 1
### Subsection 1.1
## Section 2
`;

const headings = extractHeadingsFromMarkdown(markdown, 2, 3);
// [
//   { id: 'section-1', text: 'Section 1', level: 2 },
//   { id: 'subsection-11', text: 'Subsection 1.1', level: 3 },
//   { id: 'section-2', text: 'Section 2', level: 2 },
// ]
```

### buildNestedStructure

Converts a flat list of items into a nested tree structure.

```typescript
function buildNestedStructure(items: TocItem[]): TocItem[]
```

#### Example

```typescript
const flat = [
  { id: 'a', text: 'A', level: 1 },
  { id: 'b', text: 'B', level: 2 },
  { id: 'c', text: 'C', level: 2 },
  { id: 'd', text: 'D', level: 1 },
];

const nested = buildNestedStructure(flat);
// [
//   { id: 'a', text: 'A', level: 1, children: [
//     { id: 'b', text: 'B', level: 2, children: [] },
//     { id: 'c', text: 'C', level: 2, children: [] },
//   ]},
//   { id: 'd', text: 'D', level: 1, children: [] },
// ]
```

### flattenStructure

Converts a nested tree back to a flat list.

```typescript
function flattenStructure(items: TocItem[]): TocItem[]
```

### scrollToElement

Smoothly scrolls to an element by ID.

```typescript
function scrollToElement(
  elementId: string,
  offset?: number,
  behavior?: ScrollBehavior
): void
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `elementId` | `string` | - | ID of target element |
| `offset` | `number` | `0` | Offset from top |
| `behavior` | `ScrollBehavior` | `'smooth'` | Scroll behavior |

#### Example

```typescript
// Scroll to element with 100px offset
scrollToElement('introduction', 100);

// Instant scroll
scrollToElement('section-2', 0, 'instant');
```

### debounce

Creates a debounced version of a function.

```typescript
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void
```

### throttle

Creates a throttled version of a function.

```typescript
function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void
```

---

## CSS Classes

All classes use the `pns-` prefix (Progress Nav Scrollspy).

| Class | Description |
|-------|-------------|
| `.pns-container` | Root container element |
| `.pns-loading` | Applied during loading state |
| `.pns-dark` | Dark theme modifier |
| `.pns-header` | Header containing title and progress |
| `.pns-title` | Title element |
| `.pns-progress` | Progress percentage display |
| `.pns-content` | Wrapper for SVG and links |
| `.pns-svg` | SVG element container |
| `.pns-track` | Background track path |
| `.pns-indicator` | Active indicator path |
| `.pns-links` | Links container |
| `.pns-list` | Unordered list element |
| `.pns-list--nested` | Nested list modifier |
| `.pns-item` | List item element |
| `.pns-link` | Anchor link element |
| `.pns-link--active` | Active link modifier |
| `.pns-link--level-{1-6}` | Level-specific modifiers |
| `.pns-skeleton` | Loading skeleton container |
| `.pns-skeleton-line` | Skeleton line element |
| `.pns-skeleton-line--long` | Long skeleton line |
| `.pns-skeleton-line--medium` | Medium skeleton line |
| `.pns-skeleton-line--short` | Short skeleton line |

---

## CSS Variables

Override these on `.pns-container` or a parent element.

| Variable | Default (Light) | Default (Dark) | Description |
|----------|----------------|----------------|-------------|
| `--pns-active-color` | `#3b82f6` | `#60a5fa` | Active indicator and link color |
| `--pns-track-color` | `#e5e7eb` | `#4b5563` | Background track color |
| `--pns-track-hover-color` | `#d1d5db` | `#6b7280` | Track hover color |
| `--pns-text-color` | `#374151` | `#d1d5db` | Primary text color |
| `--pns-text-muted` | `#6b7280` | `#9ca3af` | Muted text color |
| `--pns-text-hover` | `#111827` | `#f9fafb` | Text hover color |
| `--pns-hover-bg` | `#f3f4f6` | `#374151` | Hover background color |
| `--pns-font-size` | `0.875rem` | - | Base font size |
| `--pns-line-height` | `1.5` | - | Line height |
| `--pns-spacing` | `0.5rem` | - | Base spacing unit |
| `--pns-indent` | `0.75rem` | - | Indentation per level |
| `--pns-border-radius` | `0.25rem` | - | Border radius |
| `--pns-transition-duration` | `150ms` | - | Transition duration |
| `--pns-transition-timing` | `cubic-bezier(0.4, 0, 0.2, 1)` | - | Easing function |

### Example Override

```css
.my-toc .pns-container {
  --pns-active-color: #10b981;
  --pns-track-color: #d1fae5;
  --pns-font-size: 0.8rem;
  --pns-indent: 1rem;
}
```

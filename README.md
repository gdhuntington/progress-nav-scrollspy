# Progress Nav Scrollspy

A React component that creates a sticky table of contents with an animated SVG progress indicator. As users scroll through your content, the indicator highlights which sections are currently visible, providing an intuitive navigation experience.

## Features

- **Animated SVG Progress Indicator** - A vertical line that dynamically highlights active sections as you scroll
- **Real-time Scroll Tracking** - Updates instantly during scrolling, even at high speeds
- **Auto-scroll TOC** - The table of contents automatically scrolls to keep the active indicator visible
- **Automatic Heading Extraction** - Automatically finds and extracts headings from your content
- **Click-to-Navigate** - Click any item to smoothly scroll to that section
- **Dark Mode Support** - Built-in light and dark theme support via CSS variables
- **Reading Progress** - Optional percentage indicator showing how far through the document you've read
- **URL Hash Updates** - Optionally update the URL hash as you scroll through sections
- **Gradient Support** - Use gradient colors for the active indicator
- **Accessibility** - ARIA labels, keyboard navigation, focus management, and reduced motion support
- **Customizable** - Extensive CSS variables and props for theming and behavior

## Installation

```bash
npm install @webzicon/progress-nav-scrollspy
```

## Quick Start

```tsx
import { ProgressNavScrollspy } from '@webzicon/progress-nav-scrollspy';
import '@webzicon/progress-nav-scrollspy/styles';

function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <ProgressNavScrollspy
          contentSelector=".content"
          headingSelector="h1, h2, h3"
        />
      </aside>

      <main className="content">
        <h1>Introduction</h1>
        <p>Your content here...</p>

        <h2>Getting Started</h2>
        <p>More content...</p>

        <h3>Prerequisites</h3>
        <p>Even more content...</p>
      </main>
    </div>
  );
}
```

## How It Works

1. **Heading Detection** - The component scans your content container for heading elements (h1-h6) and builds a table of contents
2. **Scroll Monitoring** - As the user scrolls, the component tracks which headings are visible in the viewport
3. **SVG Animation** - An SVG path element uses `stroke-dasharray` and `stroke-dashoffset` to create the animated indicator effect
4. **Direct DOM Updates** - For smooth real-time performance, the indicator updates directly via DOM manipulation, bypassing React's render cycle during fast scrolling

## Basic Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `contentSelector` | `string` | `'.content'` | CSS selector for the scrollable content container |
| `headingSelector` | `string` | `'h1, h2, h3, h4, h5, h6'` | CSS selector for headings to include |
| `items` | `TocItem[]` | - | Manually provide TOC items instead of auto-extraction |
| `title` | `string` | `'On this page'` | Title shown above the TOC |
| `showTitle` | `boolean` | `true` | Whether to show the title |
| `showProgress` | `boolean` | `false` | Show reading progress percentage |
| `updateHash` | `boolean` | `false` | Update URL hash on scroll |
| `offset` | `number` | `100` | Pixel offset for determining active sections |
| `minLevel` | `number` | `1` | Minimum heading level to include (1-6) |
| `maxLevel` | `number` | `6` | Maximum heading level to include (1-6) |

## Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeColor` | `string \| string[]` | `'#3b82f6'` | Color for active indicator (array for gradient) |
| `trackColor` | `string` | `'#e5e7eb'` | Color for the background track |
| `strokeWidth` | `number` | `2` | Width of the progress indicator stroke |
| `animationDuration` | `number` | `150` | Animation duration in milliseconds |
| `className` | `string` | - | Additional CSS class for the container |

## Callback Props

| Prop | Type | Description |
|------|------|-------------|
| `onItemClick` | `(item: TocItem) => void` | Called when a TOC item is clicked |
| `onActiveChange` | `(activeItems: TocItem[]) => void` | Called when active sections change |
| `onProgressChange` | `(progress: number) => void` | Called when reading progress changes |

## CSS Customization

The component uses CSS variables for easy theming:

```css
.pns-container {
  --pns-active-color: #3b82f6;    /* Active indicator and text color */
  --pns-track-color: #e5e7eb;     /* Background track color */
  --pns-text-color: #374151;      /* Primary text color */
  --pns-text-muted: #6b7280;      /* Muted text color */
  --pns-hover-bg: #f3f4f6;        /* Hover background color */
  --pns-font-size: 0.875rem;      /* Base font size */
  --pns-spacing: 0.5rem;          /* Base spacing unit */
  --pns-indent: 0.75rem;          /* Indentation per heading level */
  --pns-border-radius: 0.25rem;   /* Border radius for hover states */
}
```

### Dark Mode

Dark mode is automatically applied when:
- The container has the `pns-dark` class
- A parent element has `data-theme="dark"`
- A parent element has the `dark` class

```tsx
<ProgressNavScrollspy className="pns-dark" />
```

Or use your app's theme context:

```tsx
<div className={isDark ? 'dark' : ''}>
  <ProgressNavScrollspy />
</div>
```

## Advanced Usage

### Manual TOC Items

Instead of auto-extraction, provide your own items:

```tsx
const items = [
  { id: 'intro', text: 'Introduction', level: 1 },
  { id: 'setup', text: 'Setup', level: 2 },
  { id: 'config', text: 'Configuration', level: 2 },
];

<ProgressNavScrollspy items={items} />
```

### Gradient Indicator

Use an array of colors for a gradient effect:

```tsx
<ProgressNavScrollspy
  activeColor={['#3b82f6', '#8b5cf6', '#ec4899']}
/>
```

### Using Individual Hooks

For advanced customization, use the hooks directly:

```tsx
import {
  useVisibleSections,
  useAutoExtractHeadings,
  usePathSegments,
  useReadingProgress,
} from '@webzicon/progress-nav-scrollspy';

function CustomTOC() {
  const { items } = useAutoExtractHeadings('.content', 'h1, h2, h3', 1, 3);
  const { activeItems } = useVisibleSections(items, { offset: 100 });
  const progress = useReadingProgress('.content', true);

  // Build your own UI...
}
```

### Using Utility Functions

```tsx
import {
  extractHeadingsFromMarkdown,
  buildNestedStructure,
  scrollToElement,
} from '@webzicon/progress-nav-scrollspy';

// Extract headings from markdown string
const headings = extractHeadingsFromMarkdown(markdownContent);

// Build nested tree structure
const nested = buildNestedStructure(headings);

// Programmatically scroll to a section
scrollToElement('section-id', 100);
```

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

Requires React 17.0.0 or higher.

## Accessibility

The component includes:
- Semantic `<nav>` element with `aria-label`
- `role="list"` on the TOC list
- `aria-current="location"` on active items
- `aria-live` regions for progress announcements
- Keyboard navigation support
- Focus management when clicking items
- Respects `prefers-reduced-motion` for users who prefer less animation
- High contrast mode support

## Performance

The component is optimized for smooth scrolling:
- Uses `requestAnimationFrame` for scroll updates
- Direct DOM manipulation bypasses React during fast scrolling
- Velocity detection disables CSS transitions during rapid scrolling
- Link positions are cached and only recalculated on resize
- Passive scroll event listeners

## Documentation

- [API Reference](./docs/API.md) - Complete API documentation
- [Technical Documentation](./docs/TECHNICAL.md) - In-depth technical details
- [File Structure](./docs/FILE_STRUCTURE.md) - Project file descriptions

## License

MIT

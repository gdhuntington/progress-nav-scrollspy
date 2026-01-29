# Technical Documentation

This document provides an in-depth technical explanation of how the Progress Nav Scrollspy component works internally.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [SVG Progress Indicator](#svg-progress-indicator)
3. [Scroll Detection System](#scroll-detection-system)
4. [Performance Optimizations](#performance-optimizations)
5. [Auto-scroll TOC Behavior](#auto-scroll-toc-behavior)
6. [Heading Extraction](#heading-extraction)
7. [State Management](#state-management)
8. [CSS Architecture](#css-architecture)

---

## Architecture Overview

The component is built with a modular architecture separating concerns into:

```
ProgressNavScrollspy (Main Component)
├── useAutoExtractHeadings (Hook) - Extracts headings from DOM
├── useVisibleSections (Hook) - Tracks scroll position and active sections
├── usePathSegments (Hook) - Calculates SVG path geometry
├── useReadingProgress (Hook) - Tracks reading progress percentage
└── useHashUpdate (Hook) - Updates URL hash on scroll
```

### Data Flow

```
DOM Headings → extractHeadingsFromDOM() → TocItem[]
                                              ↓
                                    buildNestedStructure()
                                              ↓
                                    Nested TocItem[] for rendering
                                              ↓
Scroll Events → useVisibleSections() → activeItems[]
                                              ↓
                              Direct DOM Updates (SVG + Classes)
                                              ↓
                              React State Update (for callbacks)
```

---

## SVG Progress Indicator

### How the Animation Works

The progress indicator uses SVG's `stroke-dasharray` and `stroke-dashoffset` properties to create the illusion of a line segment moving along a track.

#### The Math

Given a vertical path from `startY` to `endY`:

```
Total Length = endY - startY
Active Start = position of first active item - startY
Active Length = position of last active item bottom - position of first active item top
```

The SVG path is drawn as a simple vertical line:

```svg
<path d="M 8 {startY} L 8 {endY}" />
```

#### stroke-dasharray Explained

`stroke-dasharray` defines a pattern of dashes and gaps. When set to `"activeLength totalLength"`:

- The first value (`activeLength`) is the visible dash
- The second value (`totalLength`) creates a gap that hides the rest

#### stroke-dashoffset Explained

`stroke-dashoffset` shifts where the dash pattern begins. By setting it to `-activeStart`:

- Negative values shift the pattern forward
- This positions the visible dash at exactly the active section

#### Visual Example

```
Track:     |========================|  (full path)
Pattern:   [===]--------------------   (dasharray: 3 20)
Offset:    -----[===]---------------   (dashoffset: -5)
Result:    |----[===]---------------|  (visible indicator at position 5)
```

### Gradient Support

When `activeColor` is an array, the component creates an SVG `<linearGradient>`:

```jsx
<linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
  {activeColor.map((color, index) => (
    <stop
      offset={`${(index / (activeColor.length - 1)) * 100}%`}
      stopColor={color}
    />
  ))}
</linearGradient>
```

The gradient ID is generated using React 18's `useId()` hook for stability across renders and uniqueness across multiple component instances.

---

## Scroll Detection System

### Finding the Scroll Container

The component doesn't assume `window` is the scroll container. Instead, it traverses the DOM to find the actual scrollable parent:

```typescript
function findScrollParent(element: Element | null): Element | null {
  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflow = style.overflow + style.overflowY;
    if (overflow.includes('auto') || overflow.includes('scroll')) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}
```

This allows the component to work in:
- Full-page scroll layouts
- Sidebar/content split layouts with independent scroll containers
- Modal dialogs with scrollable content
- Any nested scroll container

### Determining Visible Sections

A heading is considered "visible" when:

```typescript
const isVisible = headingTop < (viewportHeight * viewportThreshold) && headingBottom > -offset;
```

Where:
- `headingTop` = distance from heading to container top
- `viewportHeight` = container's visible height
- `viewportThreshold` = how far down the viewport a heading can be (default: 0.8 = 80%)
- `offset` = buffer zone above the viewport (default: 100px)

### Fallback Logic

When no headings are in the viewport (user scrolled past content):

1. Find the closest heading above the viewport
2. If none found, default to the first heading

```typescript
if (visibleItems.length === 0) {
  let closestItem = null;
  let closestDistance = Infinity;

  items.forEach((item) => {
    const headingTop = /* calculate position */;
    if (headingTop < 0) {  // Above viewport
      const distance = Math.abs(headingTop);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestItem = item;
      }
    }
  });

  if (closestItem) visibleItems.push(closestItem);
  else if (items.length > 0) visibleItems.push(items[0]);
}
```

---

## Performance Optimizations

### Direct DOM Manipulation

During scrolling, React's reconciliation can cause visible lag. The component bypasses React for scroll-sensitive updates:

```typescript
// Direct DOM update - no React re-render needed
svgIndicatorRef.current.style.strokeDasharray = `${activeLength} ${totalLength}`;
svgIndicatorRef.current.style.strokeDashoffset = `-${activeStart}`;

// Update active classes directly
positions.forEach((pos, id) => {
  if (activeIds.includes(id)) {
    pos.element.classList.add('pns-link--active');
  } else {
    pos.element.classList.remove('pns-link--active');
  }
});
```

React state is still updated for callback consumers, but the visual updates don't wait for React.

### Velocity-Based Transition Control

CSS transitions create smoothness but cause lag during fast scrolling. The component detects scroll velocity:

```typescript
// Calculate velocity in pixels per millisecond
const velocity = deltaTime > 0 ? deltaScroll / deltaTime : 0;

// Disable transitions during fast scrolling
if (velocity > velocityThreshold) {
  svgIndicatorRef.current.style.transition = 'none';
}

// Re-enable after scrolling stops (150ms debounce)
scrollTimeoutRef.current = setTimeout(() => {
  svgIndicatorRef.current.style.transition = '';
}, 150);
```

### Position Caching

Link positions are expensive to calculate (requires `getBoundingClientRect()`). The component caches positions:

```typescript
const linkPositionsCacheRef = useRef<Map<string, PositionData> | null>(null);
const cacheInvalidatedRef = useRef<boolean>(true);

// Only recalculate when cache is invalid
if (!cacheInvalidatedRef.current && linkPositionsCacheRef.current) {
  return { positions: linkPositionsCacheRef.current, listElement };
}

// Invalidate on resize
window.addEventListener('resize', () => {
  cacheInvalidatedRef.current = true;
});
```

### requestAnimationFrame

Scroll events fire rapidly (60+ times per second). Using `requestAnimationFrame` ensures updates are batched with the browser's repaint cycle:

```typescript
const handleScroll = () => {
  requestAnimationFrame(updateActiveItems);
};

scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
```

The `{ passive: true }` option tells the browser we won't call `preventDefault()`, allowing scroll optimizations.

---

## Auto-scroll TOC Behavior

### Keeping the Indicator Visible

When the active indicator moves outside the TOC's visible area, the TOC container scrolls to keep it visible:

```typescript
// Check if first active is above visible area
if (firstActiveRect.top < tocRect.top + scrollPadding) {
  const scrollAmount = firstActiveRect.top - tocRect.top - scrollPadding;
  tocScrollContainer.scrollTop += scrollAmount;
}

// Check if last active is below visible area
if (lastActiveRect.bottom > tocRect.bottom - scrollPadding) {
  const scrollAmount = lastActiveRect.bottom - tocRect.bottom + scrollPadding;
  tocScrollContainer.scrollTop += scrollAmount;
}
```

### Extreme Position Synchronization

When the document reaches its top or bottom, the TOC syncs:

```typescript
const docMaxScroll = container.scrollHeight - container.clientHeight;
const tocMaxScroll = tocScrollContainer.scrollHeight - tocScrollContainer.clientHeight;

// Document at top → TOC at top
if (docScrollTop <= 0) {
  tocScrollContainer.scrollTop = 0;
}

// Document at bottom → TOC at bottom
if (docScrollTop >= docMaxScroll - 1) {
  tocScrollContainer.scrollTop = tocMaxScroll;
}
```

---

## Heading Extraction

### From DOM

The `extractHeadingsFromDOM` function:

1. Queries all heading elements matching the selector
2. Filters by heading level (minLevel to maxLevel)
3. Extracts or generates unique IDs
4. Assigns IDs to elements that don't have them

```typescript
elements.forEach((element) => {
  const tagName = element.tagName.toLowerCase();
  const levelMatch = tagName.match(/^h(\d)$/);
  if (!levelMatch) return;

  const level = parseInt(levelMatch[1], 10);
  if (level < minLevel || level > maxLevel) return;

  let id = element.id || generateSlug(text);

  // Ensure unique IDs
  while (usedIds.has(id)) {
    id = `${baseId}-${counter++}`;
  }
  usedIds.add(id);

  // Assign ID to element if missing
  if (!element.id) {
    element.id = id;
  }

  headings.push({ id, text, level });
});
```

### From Markdown

The `extractHeadingsFromMarkdown` function parses ATX-style headers:

```typescript
const match = line.match(/^(#{1,6})\s+(.+)$/);
if (match) {
  const level = match[1].length;  // Number of # characters
  const text = match[2].trim();
  // ...
}
```

### Building Nested Structure

The `buildNestedStructure` function converts a flat list into a tree using a stack-based algorithm:

```typescript
for (const item of items) {
  const newItem = { ...item, children: [] };

  // Pop items at same or lower level (they can't be parents)
  while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
    stack.pop();
  }

  if (stack.length === 0) {
    result.push(newItem);  // Top-level item
  } else {
    stack[stack.length - 1].children.push(newItem);  // Child of stack top
  }

  stack.push(newItem);
}
```

---

## State Management

### React State

Used for:
- `activeItems` - exposed via callbacks
- `items` - extracted headings
- `isLoading` - loading state during extraction
- `progress` - reading progress percentage
- `pathInfo` - SVG path geometry

### Refs

Used for:
- `containerRef` - reference to nav element
- `svgRef` - reference to SVG element
- `indicatorRef` - reference to indicator path for direct updates
- `scrollContainerRef` - cached scroll container
- `lastActiveIdsRef` - prevents redundant updates
- `linkPositionsCacheRef` - cached position data
- Velocity tracking refs

### Why This Split?

- **State** triggers React re-renders, needed for callbacks and derived calculations
- **Refs** persist across renders without causing re-renders, ideal for:
  - DOM references
  - Mutable values updated during scroll
  - Caches

---

## CSS Architecture

### BEM Naming

The component uses BEM (Block Element Modifier) naming:

```
.pns-container          (Block)
.pns-header             (Element)
.pns-title              (Element)
.pns-content            (Element)
.pns-link               (Element)
.pns-link--active       (Modifier)
.pns-link--level-2      (Modifier)
.pns-list--nested       (Modifier)
```

### CSS Variables

All customizable values use CSS custom properties:

```css
.pns-container {
  --pns-active-color: #3b82f6;
  --pns-track-color: #e5e7eb;
  --pns-text-color: #374151;
  --pns-text-muted: #6b7280;
  --pns-hover-bg: #f3f4f6;
  --pns-font-size: 0.875rem;
  --pns-spacing: 0.5rem;
  --pns-indent: 0.75rem;
  --pns-border-radius: 0.25rem;
  --pns-transition-duration: 150ms;
  --pns-transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Dark Mode

Dark mode overrides CSS variables without changing selectors:

```css
.pns-container.pns-dark,
[data-theme="dark"] .pns-container,
.dark .pns-container {
  --pns-active-color: #60a5fa;
  --pns-track-color: #4b5563;
  /* ... */
}
```

### Accessibility Media Queries

```css
/* High contrast mode */
@media (prefers-contrast: high) {
  .pns-track { opacity: 0.3; }
  .pns-link--active { text-decoration: underline; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .pns-link, .pns-indicator, .pns-track {
    transition: none;
  }
  .pns-indicator { animation: none; }
}
```

---

## Lifecycle

### Mount

1. `useAutoExtractHeadings` extracts headings (50ms delay for DOM readiness)
2. `useVisibleSections` finds scroll container and attaches listener
3. `usePathSegments` calculates initial path geometry
4. Initial `updateActiveItems()` call sets first active state

### Scroll

1. `requestAnimationFrame` schedules update
2. Velocity calculated from position/time delta
3. Visible sections determined from positions
4. Direct DOM updates (SVG dasharray, active classes)
5. TOC auto-scrolled if needed
6. React state updated (triggers callbacks)

### Unmount

1. Scroll listener removed
2. Resize listener removed
3. Pending timeouts cleared

### Props Change

- `items` change: Re-extract headings, recalculate paths
- Color/styling changes: React re-render updates SVG attributes
- `contentSelector` change: Re-find scroll container, re-extract headings

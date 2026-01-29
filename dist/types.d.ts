/**
 * @fileoverview Type definitions for the Progress Nav Scrollspy component.
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the component library. Types are organized into:
 * - Public types (exported for consumer use)
 * - Internal types (used within the component implementation)
 *
 * @module types
 */
/**
 * Represents a single item in the table of contents.
 *
 * Each TocItem corresponds to a heading element in the document content.
 * Items can be nested to represent document hierarchy (h1 > h2 > h3, etc.).
 *
 * @example
 * // Basic item
 * const item: TocItem = {
 *   id: 'introduction',
 *   text: 'Introduction',
 *   level: 1
 * };
 *
 * @example
 * // Item with children (nested structure)
 * const item: TocItem = {
 *   id: 'getting-started',
 *   text: 'Getting Started',
 *   level: 1,
 *   children: [
 *     { id: 'installation', text: 'Installation', level: 2 },
 *     { id: 'configuration', text: 'Configuration', level: 2 }
 *   ]
 * };
 */
export interface TocItem {
    /**
     * Unique identifier for the heading element.
     * This is used as the `id` attribute on the heading element and as the
     * hash fragment in the URL (e.g., `#introduction`).
     *
     * If auto-extracting headings, this will be:
     * 1. The existing `id` attribute of the heading element, or
     * 2. A generated slug from the heading text
     */
    id: string;
    /**
     * Display text for the heading.
     * This is the text content shown in the table of contents link.
     * Typically extracted from the heading element's `textContent`.
     */
    text: string;
    /**
     * Heading level (1-6), corresponding to h1-h6 HTML elements.
     *
     * - Level 1: Top-level sections (h1)
     * - Level 2: Major subsections (h2)
     * - Level 3: Minor subsections (h3)
     * - Levels 4-6: Deeper nesting
     *
     * The level is used for:
     * - Visual indentation in the TOC
     * - Building the nested tree structure
     * - CSS class assignment (`.pns-link--level-{n}`)
     */
    level: number;
    /**
     * Optional array of child items for nested structure.
     *
     * When using `buildNestedStructure()`, items are organized into
     * a tree based on their levels. A level-2 heading following a
     * level-1 heading becomes its child.
     *
     * @default undefined (flat structure)
     */
    children?: TocItem[];
}
/**
 * Configuration options for the ProgressNavScrollspy component.
 *
 * All props are optional with sensible defaults. The component works
 * out of the box with zero configuration if your content uses standard
 * heading elements with a `.content` class on the container.
 *
 * @example
 * // Minimal usage (auto-extract headings)
 * <ProgressNavScrollspy />
 *
 * @example
 * // Customized usage
 * <ProgressNavScrollspy
 *   contentSelector=".article"
 *   headingSelector="h2, h3"
 *   activeColor="#10b981"
 *   showProgress={true}
 *   onActiveChange={(items) => console.log(items)}
 * />
 */
export interface ProgressNavScrollspyProps {
    /**
     * Array of table of contents items to display.
     *
     * When provided, the component skips automatic heading extraction
     * and uses these items directly. Useful when:
     * - You have a custom data source
     * - You want to filter/transform headings before display
     * - The content is dynamically loaded
     *
     * @default undefined (auto-extract from DOM)
     */
    items?: TocItem[];
    /**
     * CSS selector for the scrollable content container.
     *
     * This selector identifies the element that:
     * 1. Contains the heading elements to extract
     * 2. Is the scroll container (or ancestor of) for detecting visibility
     *
     * The component traverses up from the first heading to find the
     * actual scrollable ancestor (element with `overflow: auto/scroll`).
     *
     * @default '.content'
     */
    contentSelector?: string;
    /**
     * CSS selector for headings within the content container.
     *
     * Only elements matching this selector will be included in the TOC.
     * Use this to filter which heading levels appear.
     *
     * @default 'h1, h2, h3, h4, h5, h6'
     *
     * @example
     * // Only include h2 and h3 headings
     * headingSelector="h2, h3"
     *
     * @example
     * // Include headings with a specific class
     * headingSelector="h2.toc-heading, h3.toc-heading"
     */
    headingSelector?: string;
    /**
     * Color for the active/highlighted portion of the progress indicator.
     *
     * Can be:
     * - A single color string (hex, rgb, hsl, CSS variable, etc.)
     * - An array of colors to create a gradient effect
     *
     * @default 'var(--pns-active-color, #3b82f6)'
     *
     * @example
     * // Solid color
     * activeColor="#10b981"
     *
     * @example
     * // Gradient (top to bottom)
     * activeColor={['#3b82f6', '#8b5cf6', '#ec4899']}
     */
    activeColor?: string | string[];
    /**
     * Color for the background track of the progress indicator.
     *
     * This is the thin line that spans the full height of the TOC,
     * showing the "inactive" portions.
     *
     * @default 'var(--pns-track-color, #e5e7eb)'
     */
    trackColor?: string;
    /**
     * Width of the progress indicator stroke in pixels.
     *
     * The active indicator is rendered 1px thicker than this value
     * to create visual emphasis.
     *
     * @default 2
     */
    strokeWidth?: number;
    /**
     * Pixel offset from the top of the viewport for determining active sections.
     *
     * A heading is considered "visible" when its top edge crosses below
     * this offset from the container top. Higher values mean headings
     * become active sooner (before reaching the very top).
     *
     * Use this to account for fixed headers or desired scroll position.
     *
     * @default 100
     */
    offset?: number;
    /**
     * Whether to show reading progress percentage.
     *
     * When enabled, displays a percentage (0-100%) in the header showing
     * how far through the document the user has scrolled.
     *
     * @default false
     */
    showProgress?: boolean;
    /**
     * Whether to update the URL hash as the user scrolls.
     *
     * When enabled, the URL hash (e.g., `#section-name`) updates to
     * reflect the currently active section. Uses `history.replaceState()`
     * to avoid polluting browser history.
     *
     * @default false
     */
    updateHash?: boolean;
    /**
     * Title displayed above the table of contents.
     *
     * Rendered as an `<h2>` element with the `.pns-title` class.
     *
     * @default 'On this page'
     */
    title?: string;
    /**
     * Whether to show the title header section.
     *
     * Set to `false` to hide the title and progress display entirely.
     *
     * @default true
     */
    showTitle?: boolean;
    /**
     * Custom class name(s) for the container element.
     *
     * Added to the root `<nav>` element alongside the default `.pns-container`.
     * Use this for:
     * - Scoped styling overrides
     * - Theme classes (e.g., `.pns-dark`)
     * - Layout positioning
     */
    className?: string;
    /**
     * Callback fired when a TOC item is clicked.
     *
     * Called after the scroll animation begins but before it completes.
     * The default click behavior (scroll to section) still occurs.
     *
     * @param item - The clicked TocItem
     *
     * @example
     * onItemClick={(item) => {
     *   analytics.track('toc_click', { section: item.id });
     * }}
     */
    onItemClick?: (item: TocItem) => void;
    /**
     * Callback fired when active items change during scroll.
     *
     * Called whenever the set of visible/active sections changes.
     * The array contains all currently visible sections (can be multiple
     * if several short sections are in view simultaneously).
     *
     * @param activeItems - Array of currently active TocItems
     *
     * @example
     * onActiveChange={(items) => {
     *   console.log('Viewing:', items.map(i => i.text).join(', '));
     * }}
     */
    onActiveChange?: (activeItems: TocItem[]) => void;
    /**
     * Callback fired when reading progress changes.
     *
     * Only called if `showProgress` is `true`. Fires on scroll events
     * (throttled to prevent excessive calls).
     *
     * @param progress - Progress percentage (0-100)
     *
     * @example
     * onProgressChange={(progress) => {
     *   document.title = `${progress}% - Article Title`;
     * }}
     */
    onProgressChange?: (progress: number) => void;
    /**
     * IntersectionObserver threshold for detecting visible sections.
     *
     * @deprecated Not currently used. Kept for API compatibility.
     * The component now uses scroll position calculation instead of
     * IntersectionObserver for more reliable detection.
     *
     * @default 0
     */
    intersectionThreshold?: number;
    /**
     * IntersectionObserver root margin.
     *
     * @deprecated Not currently used. Kept for API compatibility.
     *
     * @default '-100px 0px -66% 0px'
     */
    intersectionRootMargin?: string;
    /**
     * Animation duration for progress indicator transitions in milliseconds.
     *
     * Controls the CSS transition duration for:
     * - stroke-dasharray changes
     * - stroke-dashoffset changes
     *
     * Set to 0 for instant updates (no animation).
     *
     * Note: During fast scrolling, transitions are automatically disabled
     * for responsive updates, then re-enabled when scrolling slows/stops.
     *
     * @default 150
     */
    animationDuration?: number;
    /**
     * Minimum heading level to include (1-6).
     *
     * Headings with a level below this value are excluded.
     * Use with `maxLevel` to filter the heading range.
     *
     * @default 1
     *
     * @example
     * // Only include h2-h4 headings
     * minLevel={2}
     * maxLevel={4}
     */
    minLevel?: number;
    /**
     * Maximum heading level to include (1-6).
     *
     * Headings with a level above this value are excluded.
     *
     * @default 6
     */
    maxLevel?: number;
}
/**
 * Internal state for tracking visible sections.
 *
 * Used internally by the visibility tracking system. Maps section IDs
 * to their visibility state including intersection ratio and position.
 *
 * @internal
 * @deprecated This type was used with the IntersectionObserver approach.
 * The current implementation uses a simpler active items array.
 */
export interface VisibilityState {
    [id: string]: {
        /** Whether the section is currently visible in the viewport */
        isVisible: boolean;
        /** Intersection ratio (0-1) from IntersectionObserver */
        ratio: number;
        /** Top position relative to scroll container */
        top: number;
    };
}
/**
 * Represents a segment of the SVG progress path.
 *
 * Used internally when calculating the path geometry. Each segment
 * corresponds to a TOC item's position in the rendered list.
 *
 * @internal
 */
export interface PathSegment {
    /** ID of the corresponding TocItem */
    itemId: string;
    /** Top position of the segment in pixels (relative to list container) */
    top: number;
    /** Height of the segment in pixels */
    height: number;
    /** Whether this segment is currently active/highlighted */
    isActive: boolean;
}
//# sourceMappingURL=types.d.ts.map
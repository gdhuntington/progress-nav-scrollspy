/**
 * @fileoverview Utility functions for the Progress Nav Scrollspy component.
 *
 * This module contains pure functions with no React dependencies, making them
 * suitable for use in any JavaScript/TypeScript context. Functions are organized
 * into categories:
 *
 * - Slug Generation: Converting text to URL-friendly identifiers
 * - Heading Extraction: Parsing headings from DOM or Markdown
 * - Structure Manipulation: Converting between flat and nested formats
 * - Scroll Utilities: Programmatic scrolling and progress calculation
 * - Function Helpers: Debounce and throttle implementations
 *
 * @module utils
 */
import type { TocItem } from './types';
/**
 * Generates a URL-friendly slug from arbitrary text.
 *
 * The slug generation process:
 * 1. Convert to lowercase for consistency
 * 2. Remove special characters (keep only word chars, spaces, hyphens)
 * 3. Replace spaces with hyphens
 * 4. Collapse multiple consecutive hyphens into one
 * 5. Remove leading/trailing hyphens
 *
 * @param text - The input text to convert to a slug
 * @returns A URL-safe slug string
 *
 * @example
 * generateSlug('Hello World!')        // 'hello-world'
 * generateSlug('API Reference')       // 'api-reference'
 * generateSlug('  Multiple   Spaces') // 'multiple-spaces'
 * generateSlug('Special @#$ Chars')   // 'special-chars'
 * generateSlug('Already-Hyphenated')  // 'already-hyphenated'
 */
export declare function generateSlug(text: string): string;
/**
 * Extracts heading elements from a DOM container and converts them to TocItems.
 *
 * This function:
 * 1. Queries the container for elements matching the selector
 * 2. Filters by heading level (minLevel to maxLevel)
 * 3. Extracts or generates unique IDs for each heading
 * 4. Assigns generated IDs back to DOM elements that lack them
 *
 * The ID assignment is important: it ensures that clicking a TOC link will
 * scroll to the correct element, even if the original HTML didn't have IDs.
 *
 * @param container - The DOM element to search within
 * @param selector - CSS selector for heading elements (default: all h1-h6)
 * @param minLevel - Minimum heading level to include (1 = h1)
 * @param maxLevel - Maximum heading level to include (6 = h6)
 * @returns Array of TocItem objects representing the headings
 *
 * @example
 * const article = document.querySelector('.article');
 * const headings = extractHeadingsFromDOM(article, 'h2, h3', 2, 3);
 *
 * @remarks
 * - Empty headings (no text content) are skipped
 * - Duplicate IDs are made unique by appending `-1`, `-2`, etc.
 * - The function modifies the DOM by adding `id` attributes to elements
 */
export declare function extractHeadingsFromDOM(container: Element, selector?: string, minLevel?: number, maxLevel?: number): TocItem[];
/**
 * Extracts headings from a Markdown string and converts them to TocItems.
 *
 * Parses ATX-style headers (# syntax) from markdown content. This is useful
 * when you have the raw markdown source and want to generate a TOC before
 * or without rendering the HTML.
 *
 * Supported syntax:
 * - `# Heading 1` (level 1)
 * - `## Heading 2` (level 2)
 * - etc. up to `###### Heading 6`
 *
 * @param markdown - The markdown string to parse
 * @param minLevel - Minimum heading level to include
 * @param maxLevel - Maximum heading level to include
 * @returns Array of TocItem objects
 *
 * @example
 * const md = `
 * # Introduction
 * ## Getting Started
 * ### Prerequisites
 * ## Configuration
 * `;
 * const items = extractHeadingsFromMarkdown(md, 1, 3);
 * // Returns 4 items with levels 1, 2, 3, 2
 *
 * @remarks
 * - Only ATX-style headers are supported (not Setext underline style)
 * - Code blocks containing # lines may be incorrectly parsed as headings
 * - IDs are generated from text, not extracted from markdown extensions
 */
export declare function extractHeadingsFromMarkdown(markdown: string, minLevel?: number, maxLevel?: number): TocItem[];
/**
 * Converts a flat list of TocItems into a nested tree structure.
 *
 * The algorithm uses a stack to track the current parent chain:
 * 1. For each item, pop stack items at same or lower level (they can't be parents)
 * 2. If stack is empty, item is a root-level entry
 * 3. Otherwise, item becomes a child of the current stack top
 * 4. Push the new item onto the stack for potential future children
 *
 * @param items - Flat array of TocItems (typically from extraction)
 * @returns Nested array where items contain their children
 *
 * @example
 * const flat = [
 *   { id: 'a', text: 'A', level: 1 },
 *   { id: 'b', text: 'B', level: 2 },
 *   { id: 'c', text: 'C', level: 3 },
 *   { id: 'd', text: 'D', level: 2 },
 *   { id: 'e', text: 'E', level: 1 },
 * ];
 *
 * const nested = buildNestedStructure(flat);
 * // Result:
 * // [
 * //   { id: 'a', level: 1, children: [
 * //     { id: 'b', level: 2, children: [
 * //       { id: 'c', level: 3, children: [] }
 * //     ]},
 * //     { id: 'd', level: 2, children: [] }
 * //   ]},
 * //   { id: 'e', level: 1, children: [] }
 * // ]
 *
 * @remarks
 * - Items are cloned to avoid mutating the input array
 * - All items get a `children` array (empty if no children)
 * - The algorithm is O(n) where n is the number of items
 */
export declare function buildNestedStructure(items: TocItem[]): TocItem[];
/**
 * Flattens a nested TocItem tree back into a flat list.
 *
 * Performs a depth-first traversal of the tree, visiting each item
 * before its children. This is the inverse of `buildNestedStructure`.
 *
 * @param items - Nested array of TocItems
 * @returns Flat array in depth-first order
 *
 * @example
 * const nested = [
 *   { id: 'a', level: 1, children: [
 *     { id: 'b', level: 2, children: [] }
 *   ]},
 *   { id: 'c', level: 1, children: [] }
 * ];
 *
 * const flat = flattenStructure(nested);
 * // [{ id: 'a', ... }, { id: 'b', ... }, { id: 'c', ... }]
 *
 * @remarks
 * - The children arrays remain on the items (they're not removed)
 * - Order matches reading order (parent before children, left before right)
 */
export declare function flattenStructure(items: TocItem[]): TocItem[];
/**
 * Calculates reading progress as a percentage (0-100).
 *
 * Progress is based on scroll position relative to the scrollable range.
 * At the top, progress is 0%. When scrolled to the bottom, progress is 100%.
 *
 * Formula: progress = (scrollTop / maxScroll) * 100
 * Where: maxScroll = scrollHeight - clientHeight
 *
 * @param scrollContainer - The element that scrolls (has the scrollbar)
 * @param contentContainer - The element containing the content (used for height)
 * @returns Progress percentage from 0 to 100, clamped to valid range
 *
 * @example
 * const sidebar = document.querySelector('.sidebar');
 * const content = document.querySelector('.content');
 * const progress = calculateReadingProgress(sidebar, content);
 * console.log(`${progress}% complete`);
 *
 * @remarks
 * - Returns 100 if content is shorter than container (nothing to scroll)
 * - Result is clamped to 0-100 range
 */
export declare function calculateReadingProgress(scrollContainer: Element, contentContainer: Element): number;
/**
 * Smoothly scrolls to an element by ID, positioning it at the top of the viewport.
 *
 * This function handles the complexity of scrolling within nested scroll containers:
 * 1. Finds the target element by ID
 * 2. Finds the scrollable ancestor (not assuming window scroll)
 * 3. Calculates the correct scroll position accounting for current offset
 * 4. Performs the scroll with specified behavior
 *
 * @param elementId - The ID of the target element (without # prefix)
 * @param offset - Pixels from the top to position the element (default: 0)
 * @param behavior - Scroll behavior: 'smooth' for animation, 'instant' for immediate
 *
 * @example
 * // Scroll to element with 100px offset (for fixed header)
 * scrollToElement('introduction', 100);
 *
 * // Instant scroll without animation
 * scrollToElement('section-2', 80, 'instant');
 *
 * @remarks
 * - If element not found, function returns silently
 * - Falls back to window scroll if no scrollable ancestor found
 * - The offset accounts for fixed headers or desired positioning
 */
export declare function scrollToElement(elementId: string, offset?: number, behavior?: ScrollBehavior): void;
/**
 * Creates a debounced version of a function.
 *
 * The debounced function delays invoking `fn` until `delay` milliseconds
 * have elapsed since the last call. Each call resets the timer.
 *
 * Use debounce when you want to wait for a "pause" in events before acting.
 * Common use cases: search input, window resize handlers.
 *
 * @typeParam T - The function type
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced version of the function
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   fetchResults(query);
 * }, 300);
 *
 * // Rapidly called, but fetchResults only runs once 300ms after last call
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export declare function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Creates a throttled version of a function.
 *
 * The throttled function invokes `fn` at most once per `limit` milliseconds.
 * The first call executes immediately; subsequent calls within the limit
 * period are ignored.
 *
 * Use throttle when you want to limit the rate of execution.
 * Common use cases: scroll handlers, mousemove handlers.
 *
 * @typeParam T - The function type
 * @param fn - The function to throttle
 * @param limit - Minimum time between invocations in milliseconds
 * @returns A throttled version of the function
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   updateScrollIndicator();
 * }, 100);
 *
 * // Called on every scroll event, but handler runs at most every 100ms
 * window.addEventListener('scroll', throttledScroll);
 *
 * @remarks
 * This is a "leading edge" throttle - the function executes on the first
 * call, then ignores calls until the limit period passes.
 */
export declare function throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=utils.d.ts.map
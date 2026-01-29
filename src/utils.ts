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
export function generateSlug(text: string): string {
  return text
    .toLowerCase()                    // Normalize to lowercase
    .replace(/[^\w\s-]/g, '')         // Remove special characters (keep word chars, spaces, hyphens)
    .replace(/\s+/g, '-')             // Replace whitespace sequences with single hyphen
    .replace(/-+/g, '-')              // Collapse consecutive hyphens
    .replace(/^-|-$/g, '');           // Trim leading/trailing hyphens
}

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
export function extractHeadingsFromDOM(
  container: Element,
  selector: string = 'h1, h2, h3, h4, h5, h6',
  minLevel: number = 1,
  maxLevel: number = 6
): TocItem[] {
  const headings: TocItem[] = [];
  const elements = container.querySelectorAll(selector);

  // Track used IDs to ensure uniqueness within this extraction
  const usedIds = new Set<string>();

  elements.forEach((element) => {
    // Extract heading level from tag name (h1 -> 1, h2 -> 2, etc.)
    const tagName = element.tagName.toLowerCase();
    const levelMatch = tagName.match(/^h(\d)$/);
    if (!levelMatch) return; // Skip non-heading elements

    const level = parseInt(levelMatch[1], 10);

    // Filter by level range
    if (level < minLevel || level > maxLevel) return;

    // Extract text content, skip empty headings
    const text = element.textContent?.trim() || '';
    if (!text) return;

    // Use existing id or generate one from text
    let id = element.id || generateSlug(text);

    // Ensure unique IDs by appending counter if needed
    let counter = 1;
    const baseId = id;
    while (usedIds.has(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }
    usedIds.add(id);

    // IMPORTANT: Assign the ID to the DOM element if it doesn't have one
    // This is necessary for scroll-to-element functionality to work
    if (!element.id) {
      element.id = id;
    }

    headings.push({ id, text, level });
  });

  return headings;
}

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
export function extractHeadingsFromMarkdown(
  markdown: string,
  minLevel: number = 1,
  maxLevel: number = 6
): TocItem[] {
  const headings: TocItem[] = [];
  const lines = markdown.split('\n');
  const usedIds = new Set<string>();

  for (const line of lines) {
    // Match ATX-style headers: 1-6 # characters followed by space and text
    // Regex: ^(#{1,6})\s+(.+)$
    // - ^ : Start of line
    // - (#{1,6}) : 1 to 6 hash characters (capture group 1)
    // - \s+ : One or more whitespace characters
    // - (.+)$ : Remaining text to end of line (capture group 2)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length; // Number of # = heading level

      // Filter by level range
      if (level < minLevel || level > maxLevel) continue;

      const text = match[2].trim();
      let id = generateSlug(text);

      // Ensure unique IDs
      let counter = 1;
      const baseId = id;
      while (usedIds.has(id)) {
        id = `${baseId}-${counter}`;
        counter++;
      }
      usedIds.add(id);

      headings.push({ id, level, text });
    }
  }

  return headings;
}

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
export function buildNestedStructure(items: TocItem[]): TocItem[] {
  if (items.length === 0) return [];

  const result: TocItem[] = [];

  // Stack tracks the current parent chain
  // Stack top is the most recent potential parent
  const stack: TocItem[] = [];

  for (const item of items) {
    // Clone item and initialize children array
    const newItem: TocItem = { ...item, children: [] };

    // Pop items from stack that are at same or lower level
    // These cannot be parents of the current item
    // e.g., if current is h2, pop all h2+ items (they're siblings or cousins)
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // No potential parent = root level item
      result.push(newItem);
    } else {
      // Add as child of stack top (the most recent higher-level heading)
      const parent = stack[stack.length - 1];
      if (!parent.children) parent.children = [];
      parent.children.push(newItem);
    }

    // Push current item as potential parent for subsequent items
    stack.push(newItem);
  }

  return result;
}

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
export function flattenStructure(items: TocItem[]): TocItem[] {
  const result: TocItem[] = [];

  /**
   * Recursive helper for depth-first traversal
   * @param list - Current level of items to process
   */
  const traverse = (list: TocItem[]) => {
    for (const item of list) {
      result.push(item);
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    }
  };

  traverse(items);
  return result;
}

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
export function calculateReadingProgress(
  scrollContainer: Element,
  contentContainer: Element
): number {
  const scrollTop = scrollContainer.scrollTop;
  const scrollHeight = contentContainer.scrollHeight;
  const clientHeight = scrollContainer.clientHeight;

  // Maximum scroll position (when scrolled to bottom)
  const maxScroll = scrollHeight - clientHeight;

  // If content fits without scrolling, we're at 100%
  if (maxScroll <= 0) return 100;

  // Calculate and clamp progress
  const progress = (scrollTop / maxScroll) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Finds the nearest scrollable ancestor of an element.
 *
 * Traverses up the DOM tree looking for an element with CSS overflow
 * set to 'auto' or 'scroll' (on either overflow or overflow-y property).
 *
 * @param element - The element to start searching from
 * @returns The scrollable ancestor element, or null if none found
 *
 * @internal Used by scrollToElement to find the correct scroll container
 */
function findScrollableParent(element: Element): Element | null {
  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    // Check both overflow and overflow-y properties
    const overflow = style.overflow + style.overflowY;
    if (overflow.includes('auto') || overflow.includes('scroll')) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

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
export function scrollToElement(
  elementId: string,
  offset: number = 0,
  behavior: ScrollBehavior = 'smooth'
): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Find the scrollable container (might not be window)
  const scrollContainer = findScrollableParent(element);

  if (scrollContainer) {
    // Calculate position relative to the scroll container
    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // How far is the element from the top of the visible container area?
    const elementOffsetFromContainerTop = elementRect.top - containerRect.top;

    // Target scroll = current scroll + element's visual offset - desired offset from top
    // This positions the element at `offset` pixels from the container top
    const targetScroll = scrollContainer.scrollTop + elementOffsetFromContainerTop - offset;

    scrollContainer.scrollTo({
      top: Math.max(0, targetScroll), // Don't scroll above 0
      behavior
    });
  } else {
    // Fallback: scroll the window
    const elementRect = element.getBoundingClientRect();
    const targetScroll = window.scrollY + elementRect.top - offset;

    window.scrollTo({
      top: Math.max(0, targetScroll),
      behavior
    });
  }
}

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
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    // Clear any pending invocation
    clearTimeout(timeoutId);
    // Schedule new invocation
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

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
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);                                    // Execute immediately
      inThrottle = true;                              // Start throttle period
      setTimeout(() => (inThrottle = false), limit);  // End throttle period
    }
    // If inThrottle is true, the call is ignored
  };
}

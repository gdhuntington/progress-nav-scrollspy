import type { TocItem } from './types';

/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
}

/**
 * Extract headings from a DOM container element
 */
export function extractHeadingsFromDOM(
  container: Element,
  selector: string = 'h1, h2, h3, h4, h5, h6',
  minLevel: number = 1,
  maxLevel: number = 6
): TocItem[] {
  const headings: TocItem[] = [];
  const elements = container.querySelectorAll(selector);
  const usedIds = new Set<string>();

  elements.forEach((element) => {
    const tagName = element.tagName.toLowerCase();
    const levelMatch = tagName.match(/^h(\d)$/);
    if (!levelMatch) return;

    const level = parseInt(levelMatch[1], 10);
    if (level < minLevel || level > maxLevel) return;

    const text = element.textContent?.trim() || '';
    if (!text) return;

    // Use existing id or generate one
    let id = element.id || generateSlug(text);

    // Ensure unique IDs
    let counter = 1;
    const baseId = id;
    while (usedIds.has(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }
    usedIds.add(id);

    // Set the id on the element if it doesn't have one
    if (!element.id) {
      element.id = id;
    }

    headings.push({ id, text, level });
  });

  return headings;
}

/**
 * Extract headings from markdown content string
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
    // Match ATX-style headers (# Header)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
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
 * Build a nested tree structure from flat headings list
 */
export function buildNestedStructure(items: TocItem[]): TocItem[] {
  if (items.length === 0) return [];

  const result: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const item of items) {
    const newItem: TocItem = { ...item, children: [] };

    // Pop items from stack that are at the same or lower level
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(newItem);
    } else {
      const parent = stack[stack.length - 1];
      if (!parent.children) parent.children = [];
      parent.children.push(newItem);
    }

    stack.push(newItem);
  }

  return result;
}

/**
 * Flatten nested structure back to flat list
 */
export function flattenStructure(items: TocItem[]): TocItem[] {
  const result: TocItem[] = [];

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
 * Calculate reading progress as a percentage (0-100)
 */
export function calculateReadingProgress(
  scrollContainer: Element,
  contentContainer: Element
): number {
  const scrollTop = scrollContainer.scrollTop;
  const scrollHeight = contentContainer.scrollHeight;
  const clientHeight = scrollContainer.clientHeight;
  const maxScroll = scrollHeight - clientHeight;

  if (maxScroll <= 0) return 100;

  const progress = (scrollTop / maxScroll) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Smooth scroll to an element by ID
 */
export function scrollToElement(
  elementId: string,
  offset: number = 0,
  behavior: ScrollBehavior = 'smooth'
): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const scrollContainer = element.closest('.workspace-content')
    || element.closest('[data-scroll-container]')
    || document.documentElement;

  const elementTop = element.offsetTop;
  const targetScroll = elementTop - offset;

  if (scrollContainer === document.documentElement) {
    window.scrollTo({ top: targetScroll, behavior });
  } else {
    scrollContainer.scrollTo({ top: targetScroll, behavior });
  }
}

/**
 * Debounce function for scroll handlers
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for scroll handlers
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

import type { TocItem } from './types';
/**
 * Generate a URL-friendly slug from text
 */
export declare function generateSlug(text: string): string;
/**
 * Extract headings from a DOM container element
 */
export declare function extractHeadingsFromDOM(container: Element, selector?: string, minLevel?: number, maxLevel?: number): TocItem[];
/**
 * Extract headings from markdown content string
 */
export declare function extractHeadingsFromMarkdown(markdown: string, minLevel?: number, maxLevel?: number): TocItem[];
/**
 * Build a nested tree structure from flat headings list
 */
export declare function buildNestedStructure(items: TocItem[]): TocItem[];
/**
 * Flatten nested structure back to flat list
 */
export declare function flattenStructure(items: TocItem[]): TocItem[];
/**
 * Calculate reading progress as a percentage (0-100)
 */
export declare function calculateReadingProgress(scrollContainer: Element, contentContainer: Element): number;
/**
 * Smooth scroll to an element by ID, positioning it at the top of the viewport
 */
export declare function scrollToElement(elementId: string, offset?: number, behavior?: ScrollBehavior): void;
/**
 * Debounce function for scroll handlers
 */
export declare function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Throttle function for scroll handlers
 */
export declare function throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=utils.d.ts.map
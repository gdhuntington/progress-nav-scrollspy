import type { TocItem, VisibilityState, PathSegment } from './types';
/**
 * Hook to observe which sections are visible using IntersectionObserver
 */
export declare function useVisibleSections(items: TocItem[], options?: {
    threshold?: number;
    rootMargin?: string;
    contentSelector?: string;
}): {
    visibilityState: VisibilityState;
    activeItems: TocItem[];
};
/**
 * Hook to auto-extract headings from a content container
 */
export declare function useAutoExtractHeadings(contentSelector: string, headingSelector: string, minLevel: number, maxLevel: number, providedItems?: TocItem[]): TocItem[];
/**
 * Hook to calculate SVG path segments based on TOC link positions
 */
export declare function usePathSegments(items: TocItem[], activeItems: TocItem[], containerRef: React.RefObject<HTMLElement | null>): {
    segments: PathSegment[];
    pathData: {
        totalLength: number;
        activeStart: number;
        activeEnd: number;
    };
    updateSegments: () => void;
};
/**
 * Hook to track reading progress
 */
export declare function useReadingProgress(contentSelector: string, enabled?: boolean): number;
/**
 * Hook to update URL hash on scroll
 */
export declare function useHashUpdate(activeItems: TocItem[], enabled?: boolean): void;
//# sourceMappingURL=hooks.d.ts.map
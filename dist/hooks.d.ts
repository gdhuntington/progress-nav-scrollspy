import type { TocItem, PathSegment } from './types';
/**
 * Hook to track which sections are visible based on scroll position
 * Uses direct DOM updates for real-time performance during fast scrolling
 */
export declare function useVisibleSections(items: TocItem[], options?: {
    offset?: number;
    svgIndicatorRef?: React.RefObject<SVGPathElement | null>;
    tocContainerRef?: React.RefObject<HTMLElement | null>;
    /** Scroll velocity threshold (pixels/ms) for disabling transitions. @default 2 */
    velocityThreshold?: number;
    /** Padding (px) to keep indicator away from TOC viewport edges. @default 20 */
    tocScrollPadding?: number;
    /** Viewport height percentage for determining visible sections. @default 0.8 */
    viewportThreshold?: number;
}): {
    activeItems: TocItem[];
};
/**
 * Hook to auto-extract headings from a content container
 * Returns items array and loading state
 */
export declare function useAutoExtractHeadings(contentSelector: string, headingSelector: string, minLevel: number, maxLevel: number, providedItems?: TocItem[]): {
    items: TocItem[];
    isLoading: boolean;
};
/**
 * Hook to calculate SVG path and active indicator position
 */
export declare function usePathSegments(items: TocItem[], activeItems: TocItem[], containerRef: React.RefObject<HTMLElement | null>): {
    trackPath: string;
    pathData: {
        totalLength: number;
        activeStart: number;
        activeLength: number;
    };
    updateSegments: () => void;
    segments: PathSegment[];
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
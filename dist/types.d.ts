/**
 * Represents a heading item in the table of contents
 */
export interface TocItem {
    /** Unique identifier for the heading (used for scroll targeting) */
    id: string;
    /** Display text for the heading */
    text: string;
    /** Heading level (1-6, corresponds to h1-h6) */
    level: number;
    /** Optional child items for nested structure */
    children?: TocItem[];
}
/**
 * Configuration options for the ProgressNavScrollspy component
 */
export interface ProgressNavScrollspyProps {
    /**
     * Array of table of contents items to display.
     * If not provided, headings will be auto-extracted from the content container.
     */
    items?: TocItem[];
    /**
     * CSS selector for the scrollable content container.
     * Used to observe scroll position and extract headings if items not provided.
     * @default '.content'
     */
    contentSelector?: string;
    /**
     * CSS selector for headings within the content container.
     * Used when auto-extracting headings.
     * @default 'h1, h2, h3, h4, h5, h6'
     */
    headingSelector?: string;
    /**
     * Color for the active/highlighted portion of the progress indicator.
     * Can be a single color or array for gradient effect.
     * @default 'var(--pns-active-color, #3b82f6)'
     */
    activeColor?: string | string[];
    /**
     * Color for the background track of the progress indicator.
     * @default 'var(--pns-track-color, #e5e7eb)'
     */
    trackColor?: string;
    /**
     * Width of the progress indicator stroke in pixels.
     * @default 2
     */
    strokeWidth?: number;
    /**
     * Pixel offset from the top of the viewport for determining active sections.
     * A heading is considered active when it crosses this threshold.
     * @default 100
     */
    offset?: number;
    /**
     * Whether to show reading progress percentage.
     * @default false
     */
    showProgress?: boolean;
    /**
     * Whether to update the URL hash as the user scrolls.
     * @default false
     */
    updateHash?: boolean;
    /**
     * Title displayed above the table of contents.
     * @default 'On this page'
     */
    title?: string;
    /**
     * Whether to show the title.
     * @default true
     */
    showTitle?: boolean;
    /**
     * Custom class name for the container element.
     */
    className?: string;
    /**
     * Callback fired when a TOC item is clicked.
     */
    onItemClick?: (item: TocItem) => void;
    /**
     * Callback fired when active items change during scroll.
     */
    onActiveChange?: (activeItems: TocItem[]) => void;
    /**
     * Callback fired when reading progress changes.
     * Only called if showProgress is true.
     */
    onProgressChange?: (progress: number) => void;
    /**
     * IntersectionObserver threshold for detecting visible sections.
     * @default 0
     */
    intersectionThreshold?: number;
    /**
     * IntersectionObserver root margin.
     * @default '-100px 0px -66% 0px'
     */
    intersectionRootMargin?: string;
    /**
     * Animation duration for progress indicator transitions in milliseconds.
     * @default 150
     */
    animationDuration?: number;
    /**
     * Minimum heading level to include (1-6).
     * @default 1
     */
    minLevel?: number;
    /**
     * Maximum heading level to include (1-6).
     * @default 6
     */
    maxLevel?: number;
}
/**
 * Internal state for tracking visible sections
 */
export interface VisibilityState {
    [id: string]: {
        isVisible: boolean;
        ratio: number;
        top: number;
    };
}
/**
 * Path segment for SVG rendering
 */
export interface PathSegment {
    itemId: string;
    top: number;
    height: number;
    isActive: boolean;
}
//# sourceMappingURL=types.d.ts.map
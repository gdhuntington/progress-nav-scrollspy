import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { useVisibleSections, useAutoExtractHeadings, usePathSegments, useReadingProgress, useHashUpdate, } from './hooks';
import { scrollToElement, buildNestedStructure } from './utils';
/**
 * Progress Nav Scrollspy Component
 *
 * A sticky table of contents with animated SVG progress indicator
 * that highlights currently visible sections as the user scrolls.
 */
export function ProgressNavScrollspy({ items: providedItems, contentSelector = '.content', headingSelector = 'h1, h2, h3, h4, h5, h6', activeColor = 'var(--pns-active-color, #3b82f6)', trackColor = 'var(--pns-track-color, #e5e7eb)', strokeWidth = 2, offset = 100, showProgress = false, updateHash = false, title = 'On this page', showTitle = true, className = '', onItemClick, onActiveChange, onProgressChange, animationDuration = 150, minLevel = 1, maxLevel = 6, }) {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const indicatorRef = useRef(null);
    // Auto-extract headings if not provided
    const { items, isLoading } = useAutoExtractHeadings(contentSelector, headingSelector, minLevel, maxLevel, providedItems);
    // Track visible sections using scroll position
    // Pass refs for direct DOM manipulation (bypasses React for real-time performance)
    const { activeItems } = useVisibleSections(items, {
        offset,
        svgIndicatorRef: indicatorRef,
        tocContainerRef: containerRef,
    });
    // Calculate path segments
    const { trackPath, pathData, updateSegments } = usePathSegments(items, activeItems, containerRef);
    // Track reading progress
    const progress = useReadingProgress(contentSelector, showProgress);
    // Update URL hash
    useHashUpdate(activeItems, updateHash);
    // Notify callbacks
    useEffect(() => {
        onActiveChange?.(activeItems);
    }, [activeItems, onActiveChange]);
    useEffect(() => {
        if (showProgress) {
            onProgressChange?.(progress);
        }
    }, [progress, showProgress, onProgressChange]);
    // Handle item click with focus management for accessibility
    const handleItemClick = useCallback((e, item) => {
        e.preventDefault();
        scrollToElement(item.id, offset);
        // Move focus to the target heading for screen readers
        // Use preventScroll to avoid browser's default centering behavior
        const targetElement = document.getElementById(item.id);
        if (targetElement) {
            targetElement.setAttribute('tabindex', '-1');
            targetElement.focus({ preventScroll: true });
            // Remove tabindex after focus to restore natural tab order
            setTimeout(() => targetElement.removeAttribute('tabindex'), 0);
        }
        onItemClick?.(item);
    }, [offset, onItemClick]);
    // Build nested structure for rendering
    const nestedItems = useMemo(() => buildNestedStructure(items), [items]);
    // Generate stable gradient ID using React's useId hook
    const instanceId = useId();
    const gradientId = useMemo(() => {
        if (Array.isArray(activeColor) && activeColor.length > 1) {
            return `pns-gradient-${instanceId.replace(/:/g, '')}`;
        }
        return null;
    }, [activeColor, instanceId]);
    // Calculate SVG dash array for active indicator
    const { activeDashArray, activeDashOffset } = useMemo(() => {
        const { totalLength, activeStart, activeLength } = pathData;
        if (totalLength <= 0) {
            return { activeDashArray: '0', activeDashOffset: '0' };
        }
        // stroke-dasharray: activeLength, totalLength
        // stroke-dashoffset: -activeStart
        const activeDashArray = `${activeLength} ${totalLength}`;
        const activeDashOffset = `-${activeStart}`;
        return { activeDashArray, activeDashOffset };
    }, [pathData]);
    // Update segments when container mounts or items change
    useEffect(() => {
        const timeoutId = setTimeout(updateSegments, 50);
        return () => clearTimeout(timeoutId);
    }, [items, updateSegments]);
    // Render TOC items recursively
    const renderItems = (itemList, depth = 0) => {
        const activeIds = new Set(activeItems.map((a) => a.id));
        return (_jsx("ul", { className: `pns-list ${depth > 0 ? 'pns-list--nested' : ''}`, role: "list", children: itemList.map((item) => {
                const isActive = activeIds.has(item.id);
                const hasChildren = item.children && item.children.length > 0;
                return (_jsxs("li", { className: "pns-item", children: [_jsx("a", { href: `#${item.id}`, className: `pns-link pns-link--level-${item.level} ${isActive ? 'pns-link--active' : ''}`, "data-item-id": item.id, onClick: (e) => handleItemClick(e, item), "aria-current": isActive ? 'location' : undefined, children: item.text }), hasChildren && renderItems(item.children, depth + 1)] }, item.id));
            }) }));
    };
    // Show loading skeleton during extraction
    if (isLoading) {
        return (_jsxs("nav", { ref: containerRef, className: `pns-container pns-loading ${className}`, "aria-label": "Table of contents", "aria-busy": "true", children: [showTitle && title && (_jsx("div", { className: "pns-header", children: _jsx("h2", { className: "pns-title", children: title }) })), _jsx("div", { className: "pns-content", children: _jsxs("div", { className: "pns-skeleton", children: [_jsx("div", { className: "pns-skeleton-line pns-skeleton-line--long" }), _jsx("div", { className: "pns-skeleton-line pns-skeleton-line--medium" }), _jsx("div", { className: "pns-skeleton-line pns-skeleton-line--short" }), _jsx("div", { className: "pns-skeleton-line pns-skeleton-line--medium" })] }) })] }));
    }
    // Don't render if no items
    if (items.length === 0) {
        return null;
    }
    const resolvedActiveColor = Array.isArray(activeColor) ? `url(#${gradientId})` : activeColor;
    return (_jsxs("nav", { ref: containerRef, className: `pns-container ${className}`, "aria-label": "Table of contents", children: [showTitle && title && (_jsxs("div", { className: "pns-header", children: [_jsx("h2", { className: "pns-title", children: title }), showProgress && (_jsxs("span", { className: "pns-progress", role: "status", "aria-live": "polite", "aria-atomic": "true", "aria-label": `Reading progress: ${progress} percent`, children: [progress, "%"] }))] })), _jsxs("div", { className: "pns-content", children: [_jsxs("svg", { ref: svgRef, className: "pns-svg", "aria-hidden": "true", style: {
                            transition: `all ${animationDuration}ms ease-out`,
                        }, children: [gradientId && Array.isArray(activeColor) && (_jsx("defs", { children: _jsx("linearGradient", { id: gradientId, x1: "0%", y1: "0%", x2: "0%", y2: "100%", children: activeColor.map((color, index) => (_jsx("stop", { offset: `${(index / (activeColor.length - 1)) * 100}%`, stopColor: color }, index))) }) })), _jsx("path", { className: "pns-track", d: trackPath, stroke: trackColor, strokeWidth: strokeWidth, fill: "none", strokeLinecap: "round" }), _jsx("path", { ref: indicatorRef, className: "pns-indicator", d: trackPath, stroke: resolvedActiveColor, strokeWidth: strokeWidth + 1, fill: "none", strokeLinecap: "round", strokeDasharray: activeDashArray, strokeDashoffset: activeDashOffset, style: {
                                    transition: `stroke-dasharray ${animationDuration}ms ease-out, stroke-dashoffset ${animationDuration}ms ease-out`,
                                } })] }), _jsx("div", { className: "pns-links", children: renderItems(nestedItems) })] })] }));
}
export default ProgressNavScrollspy;

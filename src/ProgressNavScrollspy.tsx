import { useRef, useEffect, useCallback, useMemo, useId } from 'react';
import type { ProgressNavScrollspyProps, TocItem } from './types';
import {
  useVisibleSections,
  useAutoExtractHeadings,
  usePathSegments,
  useReadingProgress,
  useHashUpdate,
} from './hooks';
import { scrollToElement, buildNestedStructure } from './utils';

/**
 * Progress Nav Scrollspy Component
 *
 * A sticky table of contents with animated SVG progress indicator
 * that highlights currently visible sections as the user scrolls.
 */
export function ProgressNavScrollspy({
  items: providedItems,
  contentSelector = '.content',
  headingSelector = 'h1, h2, h3, h4, h5, h6',
  activeColor = 'var(--pns-active-color, #3b82f6)',
  trackColor = 'var(--pns-track-color, #e5e7eb)',
  strokeWidth = 2,
  offset = 100,
  showProgress = false,
  updateHash = false,
  title = 'On this page',
  showTitle = true,
  className = '',
  onItemClick,
  onActiveChange,
  onProgressChange,
  animationDuration = 150,
  minLevel = 1,
  maxLevel = 6,
}: ProgressNavScrollspyProps) {
  const containerRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const indicatorRef = useRef<SVGPathElement>(null);

  // Auto-extract headings if not provided
  const { items, isLoading } = useAutoExtractHeadings(
    contentSelector,
    headingSelector,
    minLevel,
    maxLevel,
    providedItems
  );

  // Track visible sections using scroll position
  // Pass refs for direct DOM manipulation (bypasses React for real-time performance)
  const { activeItems } = useVisibleSections(items, {
    offset,
    svgIndicatorRef: indicatorRef,
    tocContainerRef: containerRef,
  });

  // Calculate path segments
  const { trackPath, pathData, updateSegments } = usePathSegments(
    items,
    activeItems,
    containerRef
  );

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
  const handleItemClick = useCallback(
    (e: React.MouseEvent, item: TocItem) => {
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
    },
    [offset, onItemClick]
  );

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
  const renderItems = (itemList: TocItem[], depth: number = 0) => {
    const activeIds = new Set(activeItems.map((a) => a.id));

    return (
      <ul className={`pns-list ${depth > 0 ? 'pns-list--nested' : ''}`} role="list">
        {itemList.map((item) => {
          const isActive = activeIds.has(item.id);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <li key={item.id} className="pns-item">
              <a
                href={`#${item.id}`}
                className={`pns-link pns-link--level-${item.level} ${isActive ? 'pns-link--active' : ''}`}
                data-item-id={item.id}
                onClick={(e) => handleItemClick(e, item)}
                aria-current={isActive ? 'location' : undefined}
              >
                {item.text}
              </a>
              {hasChildren && renderItems(item.children!, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  // Show loading skeleton during extraction
  if (isLoading) {
    return (
      <nav
        ref={containerRef}
        className={`pns-container pns-loading ${className}`}
        aria-label="Table of contents"
        aria-busy="true"
      >
        {showTitle && title && (
          <div className="pns-header">
            <h2 className="pns-title">{title}</h2>
          </div>
        )}
        <div className="pns-content">
          <div className="pns-skeleton">
            <div className="pns-skeleton-line pns-skeleton-line--long" />
            <div className="pns-skeleton-line pns-skeleton-line--medium" />
            <div className="pns-skeleton-line pns-skeleton-line--short" />
            <div className="pns-skeleton-line pns-skeleton-line--medium" />
          </div>
        </div>
      </nav>
    );
  }

  // Don't render if no items
  if (items.length === 0) {
    return null;
  }

  const resolvedActiveColor = Array.isArray(activeColor) ? `url(#${gradientId})` : activeColor;

  return (
    <nav
      ref={containerRef}
      className={`pns-container ${className}`}
      aria-label="Table of contents"
    >
      {showTitle && title && (
        <div className="pns-header">
          <h2 className="pns-title">{title}</h2>
          {showProgress && (
            <span
              className="pns-progress"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Reading progress: ${progress} percent`}
            >
              {progress}%
            </span>
          )}
        </div>
      )}

      <div className="pns-content">
        {/* SVG Progress Indicator */}
        <svg
          ref={svgRef}
          className="pns-svg"
          aria-hidden="true"
          style={{
            transition: `all ${animationDuration}ms ease-out`,
          }}
        >
          {/* Gradient definition if needed */}
          {gradientId && Array.isArray(activeColor) && (
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                {activeColor.map((color, index) => (
                  <stop
                    key={index}
                    offset={`${(index / (activeColor.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </linearGradient>
            </defs>
          )}

          {/* Background track */}
          <path
            className="pns-track"
            d={trackPath}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />

          {/* Active indicator - ref used for direct DOM updates during scroll */}
          <path
            ref={indicatorRef}
            className="pns-indicator"
            d={trackPath}
            stroke={resolvedActiveColor}
            strokeWidth={strokeWidth + 1}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={activeDashArray}
            strokeDashoffset={activeDashOffset}
            style={{
              transition: `stroke-dasharray ${animationDuration}ms ease-out, stroke-dashoffset ${animationDuration}ms ease-out`,
            }}
          />
        </svg>

        {/* TOC Links */}
        <div className="pns-links">
          {renderItems(nestedItems)}
        </div>
      </div>
    </nav>
  );
}

export default ProgressNavScrollspy;

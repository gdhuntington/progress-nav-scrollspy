import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { extractHeadingsFromDOM, throttle } from './utils';
/**
 * Find the scrollable parent of an element
 */
function findScrollParent(element) {
    if (!element)
        return null;
    let parent = element.parentElement;
    while (parent) {
        const style = window.getComputedStyle(parent);
        const overflow = style.overflow + style.overflowY;
        if (overflow.includes('auto') || overflow.includes('scroll')) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}
/**
 * Hook to track which sections are visible based on scroll position
 * Uses direct DOM updates for real-time performance during fast scrolling
 */
export function useVisibleSections(items, options = {}) {
    const { offset = 100, svgIndicatorRef, tocContainerRef, velocityThreshold = 2, tocScrollPadding = 20, viewportThreshold = 0.8, } = options;
    const [activeItems, setActiveItems] = useState([]);
    const scrollContainerRef = useRef(null);
    const lastActiveIdsRef = useRef('');
    // Scroll velocity tracking for adaptive updates
    const lastScrollTopRef = useRef(0);
    const lastScrollTimeRef = useRef(0);
    const isFastScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);
    // Cached link positions (updated on resize/items change, not every scroll)
    const linkPositionsCacheRef = useRef(null);
    const cacheInvalidatedRef = useRef(true);
    useEffect(() => {
        if (items.length === 0)
            return;
        // Find the scroll container
        const firstHeading = document.getElementById(items[0]?.id);
        const scrollContainer = findScrollParent(firstHeading);
        scrollContainerRef.current = scrollContainer;
        // Get link positions (uses cache when valid, recalculates when invalidated)
        const getLinkPositions = () => {
            if (!tocContainerRef?.current)
                return null;
            const listElement = tocContainerRef.current.querySelector('.pns-list');
            if (!listElement)
                return null;
            // Return cached positions if still valid
            if (!cacheInvalidatedRef.current && linkPositionsCacheRef.current) {
                return { positions: linkPositionsCacheRef.current, listElement };
            }
            // Recalculate positions
            const listRect = listElement.getBoundingClientRect();
            const links = listElement.querySelectorAll('.pns-link');
            const positions = new Map();
            links.forEach((link) => {
                const itemId = link.getAttribute('data-item-id');
                if (!itemId)
                    return;
                const linkRect = link.getBoundingClientRect();
                positions.set(itemId, {
                    top: linkRect.top - listRect.top,
                    bottom: linkRect.bottom - listRect.top,
                    element: link,
                });
            });
            // Update cache
            linkPositionsCacheRef.current = positions;
            cacheInvalidatedRef.current = false;
            return { positions, listElement };
        };
        // Invalidate cache on resize
        const handleResize = () => {
            cacheInvalidatedRef.current = true;
        };
        window.addEventListener('resize', handleResize);
        const updateActiveItems = () => {
            const container = scrollContainerRef.current;
            if (!container)
                return;
            // Calculate scroll velocity
            const currentScrollTop = container.scrollTop;
            const currentTime = performance.now();
            const deltaScroll = Math.abs(currentScrollTop - lastScrollTopRef.current);
            const deltaTime = currentTime - lastScrollTimeRef.current;
            // Velocity in pixels per millisecond
            const velocity = deltaTime > 0 ? deltaScroll / deltaTime : 0;
            // Consider "fast scrolling" if velocity exceeds threshold (configurable)
            const wasFastScrolling = isFastScrollingRef.current;
            isFastScrollingRef.current = velocity > velocityThreshold;
            // Update tracking refs
            lastScrollTopRef.current = currentScrollTop;
            lastScrollTimeRef.current = currentTime;
            // Disable transitions during fast scroll for instant updates
            if (svgIndicatorRef?.current) {
                if (isFastScrollingRef.current && !wasFastScrolling) {
                    // Entering fast scroll mode - disable transitions
                    svgIndicatorRef.current.style.transition = 'none';
                }
                // Clear any existing timeout
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }
                // Re-enable transitions after scroll stops
                scrollTimeoutRef.current = setTimeout(() => {
                    if (svgIndicatorRef.current) {
                        svgIndicatorRef.current.style.transition = '';
                        isFastScrollingRef.current = false;
                    }
                }, 150);
            }
            const containerRect = container.getBoundingClientRect();
            const containerTop = containerRect.top;
            const viewportHeight = containerRect.height;
            const visibleItems = [];
            items.forEach((item) => {
                const element = document.getElementById(item.id);
                if (!element)
                    return;
                const rect = element.getBoundingClientRect();
                const headingTop = rect.top - containerTop;
                const headingBottom = rect.bottom - containerTop;
                const isVisible = headingTop < (viewportHeight * viewportThreshold) && headingBottom > -offset;
                if (isVisible) {
                    visibleItems.push(item);
                }
            });
            // If nothing is visible, find the closest section above the viewport
            if (visibleItems.length === 0) {
                let closestItem = null;
                let closestDistance = Infinity;
                items.forEach((item) => {
                    const element = document.getElementById(item.id);
                    if (!element)
                        return;
                    const rect = element.getBoundingClientRect();
                    const headingTop = rect.top - containerTop;
                    if (headingTop < 0) {
                        const distance = Math.abs(headingTop);
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestItem = item;
                        }
                    }
                });
                if (closestItem) {
                    visibleItems.push(closestItem);
                }
                else if (items.length > 0) {
                    visibleItems.push(items[0]);
                }
            }
            // Direct DOM update for SVG indicator (bypasses React for performance)
            const activeIds = visibleItems.map(v => v.id);
            const activeIdsStr = activeIds.join(',');
            if (svgIndicatorRef?.current && tocContainerRef?.current && activeIdsStr !== lastActiveIdsRef.current) {
                const linkData = getLinkPositions();
                if (linkData) {
                    const { positions } = linkData;
                    // Calculate track start and end
                    const allLinks = Array.from(positions.values());
                    if (allLinks.length > 0) {
                        const trackStart = allLinks[0].top;
                        const trackEnd = allLinks[allLinks.length - 1].bottom;
                        const totalLength = trackEnd - trackStart;
                        // Calculate active range
                        const activePositions = activeIds
                            .map(id => positions.get(id))
                            .filter(Boolean);
                        if (activePositions.length > 0) {
                            const activeStart = activePositions[0].top - trackStart;
                            const activeEnd = activePositions[activePositions.length - 1].bottom - trackStart;
                            const activeLength = activeEnd - activeStart;
                            // Direct DOM update - no React re-render needed
                            svgIndicatorRef.current.style.strokeDasharray = `${activeLength} ${totalLength}`;
                            svgIndicatorRef.current.style.strokeDashoffset = `-${activeStart}`;
                        }
                        // Update active classes on links directly
                        positions.forEach((pos, id) => {
                            if (activeIds.includes(id)) {
                                pos.element.classList.add('pns-link--active');
                            }
                            else {
                                pos.element.classList.remove('pns-link--active');
                            }
                        });
                        // Auto-scroll the TOC to keep active indicator in view
                        if (activePositions.length > 0 && tocContainerRef.current) {
                            // Find the scrollable parent of the TOC (could be the sidebar or a parent container)
                            const tocScrollContainer = findScrollParent(tocContainerRef.current) || tocContainerRef.current;
                            const tocMaxScroll = tocScrollContainer.scrollHeight - tocScrollContainer.clientHeight;
                            // Check if document is at scroll extremes and sync TOC accordingly
                            const docMaxScroll = container.scrollHeight - container.clientHeight;
                            const docScrollTop = container.scrollTop;
                            // If document is at the very top, scroll TOC to top
                            if (docScrollTop <= 0) {
                                tocScrollContainer.scrollTop = 0;
                            }
                            // If document is at the very bottom, scroll TOC to bottom
                            else if (docScrollTop >= docMaxScroll - 1) {
                                tocScrollContainer.scrollTop = tocMaxScroll;
                            }
                            // Otherwise, keep active indicator in view with padding
                            else {
                                const tocRect = tocScrollContainer.getBoundingClientRect();
                                const firstActiveElement = activePositions[0].element;
                                const lastActiveElement = activePositions[activePositions.length - 1].element;
                                const firstActiveRect = firstActiveElement.getBoundingClientRect();
                                const lastActiveRect = lastActiveElement.getBoundingClientRect();
                                // Padding to keep indicator away from edges
                                const scrollPadding = tocScrollPadding;
                                // Check if first active is above visible area
                                if (firstActiveRect.top < tocRect.top + scrollPadding) {
                                    const scrollAmount = firstActiveRect.top - tocRect.top - scrollPadding;
                                    tocScrollContainer.scrollTop += scrollAmount;
                                }
                                // Check if last active is below visible area
                                else if (lastActiveRect.bottom > tocRect.bottom - scrollPadding) {
                                    const scrollAmount = lastActiveRect.bottom - tocRect.bottom + scrollPadding;
                                    tocScrollContainer.scrollTop += scrollAmount;
                                }
                            }
                        }
                    }
                }
                lastActiveIdsRef.current = activeIdsStr;
            }
            // Update React state (for callbacks and other consumers)
            setActiveItems(visibleItems);
        };
        // Use requestAnimationFrame for every scroll event - no throttling
        const handleScroll = () => {
            requestAnimationFrame(updateActiveItems);
        };
        // Initial calculation
        updateActiveItems();
        // Listen for scroll events
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        }
        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [items, offset, svgIndicatorRef, tocContainerRef, velocityThreshold, tocScrollPadding, viewportThreshold]);
    return { activeItems };
}
/**
 * Hook to auto-extract headings from a content container
 * Returns items array and loading state
 */
export function useAutoExtractHeadings(contentSelector, headingSelector, minLevel, maxLevel, providedItems) {
    const [items, setItems] = useState(providedItems || []);
    const [isLoading, setIsLoading] = useState(!providedItems || providedItems.length === 0);
    useEffect(() => {
        // If items are provided, use them
        if (providedItems && providedItems.length > 0) {
            setItems(providedItems);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        // Extract from DOM once
        const extractHeadings = () => {
            const container = document.querySelector(contentSelector);
            if (container) {
                const extracted = extractHeadingsFromDOM(container, headingSelector, minLevel, maxLevel);
                setItems(extracted);
            }
            setIsLoading(false);
        };
        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(extractHeadings, 50);
        return () => clearTimeout(timeoutId);
    }, [contentSelector, headingSelector, minLevel, maxLevel, providedItems]);
    return { items, isLoading };
}
/**
 * Hook to calculate SVG path and active indicator position
 */
export function usePathSegments(items, activeItems, containerRef) {
    const [pathInfo, setPathInfo] = useState({
        trackPath: '',
        startY: 0,
        endY: 0,
        activeStartY: 0,
        activeEndY: 0,
    });
    const calculatePath = useCallback(() => {
        if (!containerRef.current || items.length === 0) {
            setPathInfo({ trackPath: '', startY: 0, endY: 0, activeStartY: 0, activeEndY: 0 });
            return;
        }
        const container = containerRef.current;
        const listElement = container.querySelector('.pns-list');
        if (!listElement)
            return;
        const listRect = listElement.getBoundingClientRect();
        const links = listElement.querySelectorAll('.pns-link');
        if (links.length === 0)
            return;
        // Get top and bottom positions of all links (full row height)
        const linkPositions = [];
        links.forEach((link) => {
            const itemId = link.getAttribute('data-item-id');
            if (!itemId)
                return;
            const linkRect = link.getBoundingClientRect();
            const top = linkRect.top - listRect.top;
            const bottom = linkRect.bottom - listRect.top;
            linkPositions.push({ id: itemId, top, bottom });
        });
        if (linkPositions.length === 0)
            return;
        // Track path spans from top of first link to bottom of last link
        const startY = linkPositions[0].top;
        const endY = linkPositions[linkPositions.length - 1].bottom;
        const trackPath = `M 8 ${startY} L 8 ${endY}`;
        // Find active range - from top of first active to bottom of last active
        const activeIds = new Set(activeItems.map((item) => item.id));
        const activePositions = linkPositions.filter((lp) => activeIds.has(lp.id));
        let activeStartY = startY;
        let activeEndY = startY;
        if (activePositions.length > 0) {
            // Top of first active row
            activeStartY = activePositions[0].top;
            // Bottom of last active row
            activeEndY = activePositions[activePositions.length - 1].bottom;
        }
        setPathInfo({ trackPath, startY, endY, activeStartY, activeEndY });
    }, [items, activeItems, containerRef]);
    // Recalculate when items or activeItems change - no delay for real-time updates
    useEffect(() => {
        calculatePath();
    }, [calculatePath]);
    // Also recalculate on window resize
    useEffect(() => {
        const handleResize = throttle(calculatePath, 100);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculatePath]);
    // Compute dash array values
    const pathData = useMemo(() => {
        const { startY, endY, activeStartY, activeEndY } = pathInfo;
        const totalLength = endY - startY;
        if (totalLength <= 0) {
            return { totalLength: 0, activeStart: 0, activeLength: 0 };
        }
        const activeStart = activeStartY - startY;
        const activeLength = activeEndY - activeStartY;
        return { totalLength, activeStart, activeLength };
    }, [pathInfo]);
    return {
        trackPath: pathInfo.trackPath,
        pathData,
        updateSegments: calculatePath,
        segments: [], // Keep for compatibility
    };
}
/**
 * Hook to track reading progress
 */
export function useReadingProgress(contentSelector, enabled = true) {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        if (!enabled)
            return;
        const content = document.querySelector(contentSelector);
        if (!content)
            return;
        const scrollContainer = findScrollParent(content);
        if (!scrollContainer)
            return;
        const updateProgress = throttle(() => {
            const scrollTop = scrollContainer.scrollTop;
            const scrollHeight = scrollContainer.scrollHeight;
            const clientHeight = scrollContainer.clientHeight;
            const maxScroll = scrollHeight - clientHeight;
            if (maxScroll > 0) {
                setProgress(Math.min(100, Math.round((scrollTop / maxScroll) * 100)));
            }
        }, 50);
        scrollContainer.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
        return () => {
            scrollContainer.removeEventListener('scroll', updateProgress);
        };
    }, [contentSelector, enabled]);
    return progress;
}
/**
 * Hook to update URL hash on scroll
 */
export function useHashUpdate(activeItems, enabled = false) {
    const lastHashRef = useRef('');
    useEffect(() => {
        if (!enabled || activeItems.length === 0)
            return;
        const firstActiveId = activeItems[0].id;
        const newHash = `#${firstActiveId}`;
        if (newHash !== lastHashRef.current) {
            lastHashRef.current = newHash;
            window.history.replaceState(null, '', newHash);
        }
    }, [activeItems, enabled]);
}

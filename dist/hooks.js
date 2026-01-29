import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { extractHeadingsFromDOM, calculateReadingProgress, throttle, } from './utils';
/**
 * Hook to observe which sections are visible using IntersectionObserver
 */
export function useVisibleSections(items, options = {}) {
    const { threshold = 0, rootMargin = '-100px 0px -66% 0px', contentSelector = '.content', } = options;
    const [visibilityState, setVisibilityState] = useState({});
    const observerRef = useRef(null);
    useEffect(() => {
        // Cleanup previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }
        // Get the scroll container for root
        const scrollContainer = document.querySelector(contentSelector);
        const root = scrollContainer?.closest('.workspace-content')
            || scrollContainer?.closest('[data-scroll-container]')
            || null;
        // Create new observer
        observerRef.current = new IntersectionObserver((entries) => {
            setVisibilityState((prev) => {
                const next = { ...prev };
                entries.forEach((entry) => {
                    const id = entry.target.id;
                    if (id) {
                        next[id] = {
                            isVisible: entry.isIntersecting,
                            ratio: entry.intersectionRatio,
                            top: entry.boundingClientRect.top,
                        };
                    }
                });
                return next;
            });
        }, {
            root,
            threshold,
            rootMargin,
        });
        // Observe all heading elements
        items.forEach((item) => {
            const element = document.getElementById(item.id);
            if (element) {
                observerRef.current?.observe(element);
            }
        });
        return () => {
            observerRef.current?.disconnect();
        };
    }, [items, threshold, rootMargin, contentSelector]);
    // Derive active items from visibility state
    const activeItems = useMemo(() => {
        const visible = items.filter((item) => visibilityState[item.id]?.isVisible);
        // If nothing is visible, find the item closest to the top
        if (visible.length === 0 && items.length > 0) {
            let closestItem = null;
            let closestDistance = Infinity;
            items.forEach((item) => {
                const state = visibilityState[item.id];
                if (state) {
                    const distance = Math.abs(state.top);
                    if (state.top < 200 && distance < closestDistance) {
                        closestDistance = distance;
                        closestItem = item;
                    }
                }
            });
            if (closestItem) {
                return [closestItem];
            }
        }
        return visible;
    }, [items, visibilityState]);
    return { visibilityState, activeItems };
}
/**
 * Hook to auto-extract headings from a content container
 */
export function useAutoExtractHeadings(contentSelector, headingSelector, minLevel, maxLevel, providedItems) {
    const [items, setItems] = useState(providedItems || []);
    useEffect(() => {
        // If items are provided, use them
        if (providedItems && providedItems.length > 0) {
            setItems(providedItems);
            return;
        }
        // Otherwise, extract from DOM
        const extractHeadings = () => {
            const container = document.querySelector(contentSelector);
            if (container) {
                const extracted = extractHeadingsFromDOM(container, headingSelector, minLevel, maxLevel);
                setItems(extracted);
            }
        };
        // Initial extraction
        extractHeadings();
        // Re-extract when content changes (using MutationObserver)
        const container = document.querySelector(contentSelector);
        if (container) {
            const observer = new MutationObserver(extractHeadings);
            observer.observe(container, {
                childList: true,
                subtree: true,
                characterData: true,
            });
            return () => observer.disconnect();
        }
    }, [contentSelector, headingSelector, minLevel, maxLevel, providedItems]);
    return items;
}
/**
 * Hook to calculate SVG path segments based on TOC link positions
 */
export function usePathSegments(items, activeItems, containerRef) {
    const [segments, setSegments] = useState([]);
    const [pathData, setPathData] = useState({ totalLength: 0, activeStart: 0, activeEnd: 0 });
    const updateSegments = useCallback(() => {
        if (!containerRef.current || items.length === 0) {
            setSegments([]);
            setPathData({ totalLength: 0, activeStart: 0, activeEnd: 0 });
            return;
        }
        const container = containerRef.current;
        const listElement = container.querySelector('.pns-list');
        if (!listElement)
            return;
        const containerRect = listElement.getBoundingClientRect();
        const newSegments = [];
        const activeIds = new Set(activeItems.map((item) => item.id));
        // Get all link elements
        const links = listElement.querySelectorAll('.pns-link');
        links.forEach((link) => {
            const itemId = link.getAttribute('data-item-id');
            if (!itemId)
                return;
            const linkRect = link.getBoundingClientRect();
            const top = linkRect.top - containerRect.top + linkRect.height / 2;
            const height = linkRect.height;
            newSegments.push({
                itemId,
                top,
                height,
                isActive: activeIds.has(itemId),
            });
        });
        setSegments(newSegments);
        // Calculate path metrics
        if (newSegments.length > 0) {
            const firstSegment = newSegments[0];
            const lastSegment = newSegments[newSegments.length - 1];
            const totalLength = lastSegment.top - firstSegment.top;
            // Find active range
            const activeSegments = newSegments.filter((s) => s.isActive);
            let activeStart = 0;
            let activeEnd = 0;
            if (activeSegments.length > 0) {
                const firstActive = activeSegments[0];
                const lastActive = activeSegments[activeSegments.length - 1];
                activeStart = firstActive.top - firstSegment.top;
                activeEnd = lastActive.top - firstSegment.top;
            }
            setPathData({ totalLength, activeStart, activeEnd });
        }
    }, [items, activeItems, containerRef]);
    // Update segments on mount and when items change
    useEffect(() => {
        updateSegments();
        // Also update on resize
        const handleResize = throttle(updateSegments, 100);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [updateSegments]);
    return { segments, pathData, updateSegments };
}
/**
 * Hook to track reading progress
 */
export function useReadingProgress(contentSelector, enabled = true) {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        if (!enabled)
            return;
        const updateProgress = throttle(() => {
            const content = document.querySelector(contentSelector);
            const scrollContainer = content?.closest('.workspace-content')
                || content?.closest('[data-scroll-container]')
                || document.documentElement;
            if (content && scrollContainer) {
                const newProgress = calculateReadingProgress(scrollContainer, content);
                setProgress(Math.round(newProgress));
            }
        }, 50);
        const content = document.querySelector(contentSelector);
        const scrollContainer = content?.closest('.workspace-content')
            || content?.closest('[data-scroll-container]')
            || window;
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
            // Update hash without triggering scroll
            window.history.replaceState(null, '', newHash);
        }
    }, [activeItems, enabled]);
}

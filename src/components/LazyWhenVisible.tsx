import { useEffect, useState, useRef, Suspense, type ComponentType, type LazyExoticComponent } from "react";

interface LazyWhenVisibleProps {
  /** Lazy-loaded component (from React.lazy()) */
  children: LazyExoticComponent<ComponentType<unknown>>;
  /** Placeholder shown until section is near viewport */
  fallback?: React.ReactNode;
  /** Root margin for IntersectionObserver - load when within this distance of viewport (default: 200px) */
  rootMargin?: string;
  /** Minimum height to reserve space and avoid layout shift */
  minHeight?: string;
}

/**
 * Renders a lazy component only when it's near the viewport.
 * Uses IntersectionObserver to defer loading until the user scrolls close.
 * Reduces initial bundle load and improves LCP.
 */
const LazyWhenVisible = ({
  children: LazyComponent,
  fallback,
  rootMargin = "200px",
  minHeight = "200px",
}: LazyWhenVisibleProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (!isVisible) {
    return (
      <div ref={sentinelRef} style={{ minHeight }} className="flex items-center justify-center">
        {fallback}
      </div>
    );
  }

  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
};

export default LazyWhenVisible;

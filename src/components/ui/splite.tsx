'use client';

import { Suspense, lazy, useEffect, useRef, useState } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasSize, setHasSize] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setHasSize(true);
        }
      }
    });

    observer.observe(el);

    const { width, height } = el.getBoundingClientRect();
    if (width > 0 && height > 0) setHasSize(true);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ contain: 'strict' }}>
      {hasSize && (
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="spline-loader" />
            </div>
          }
        >
          <Spline scene={scene} className="w-full h-full" />
        </Suspense>
      )}
    </div>
  );
}

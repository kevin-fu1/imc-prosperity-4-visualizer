import { Center, Loader } from '@mantine/core';
import { ReactNode, useEffect, useRef, useState } from 'react';

export interface LazyMountProps {
  minHeight: number;
  rootMargin?: string;
  children: ReactNode;
}

// Defer mounting children until the placeholder scrolls within `rootMargin` of the viewport.
// `inViewport` flips first; `hasMounted` flips on the next animation frame so the spinner
// actually paints before the (synchronous, expensive) chart mount blocks the main thread.
// Once mounted, children stay mounted to preserve interactive state on scroll away.
export function LazyMount({ minHeight, rootMargin = '400px', children }: LazyMountProps): ReactNode {
  const [inViewport, setInViewport] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (inViewport || !ref.current) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setInViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [inViewport, rootMargin]);

  useEffect(() => {
    if (!inViewport || hasMounted) return;
    const id = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(id);
  }, [inViewport, hasMounted]);

  return (
    <div ref={ref} style={{ minHeight: hasMounted ? undefined : minHeight }}>
      {hasMounted ? (
        children
      ) : inViewport ? (
        <Center style={{ height: minHeight }}>
          <Loader />
        </Center>
      ) : null}
    </div>
  );
}

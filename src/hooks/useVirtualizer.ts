import { useState, useEffect, useCallback, useRef } from 'react';

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  key: string | number;
}

export interface UseVirtualizerOptions {
  count: number;
  getScrollElement: () => HTMLElement | null;
  estimateSize: (index: number) => number;
  overscan?: number;
}

/**
 * Hook de Virtualización Ligero y de Alto Rendimiento (60fps)
 * -----------------------------------------------------------
 * Implementa renderizado virtualizado por ventana deslizante (windowing),
 * minimizando el conteo de nodos en el DOM cuando la colección de contratos
 * o cotizaciones supera los 50-100 registros.
 */
export function useVirtualizer({
  count,
  getScrollElement,
  estimateSize,
  overscan = 5
}: UseVirtualizerOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const rafRef = useRef<number | null>(null);

  const defaultItemSize = estimateSize(0) || 52;
  const totalSize = count * defaultItemSize;

  const onScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = getScrollElement();
      if (el) {
        setScrollTop(el.scrollTop);
      }
    });
  }, [getScrollElement]);

  useEffect(() => {
    const el = getScrollElement();
    if (!el) return;

    setContainerHeight(el.clientHeight || 600);
    setScrollTop(el.scrollTop || 0);

    el.addEventListener('scroll', onScroll, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect) {
            setContainerHeight(entry.contentRect.height);
          }
        }
      });
      ro.observe(el);
    }

    return () => {
      el.removeEventListener('scroll', onScroll);
      if (ro) ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [getScrollElement, onScroll]);

  // Cálculo de índices visibles
  const startIndex = Math.max(0, Math.floor(scrollTop / defaultItemSize) - overscan);
  const endIndex = Math.min(
    count - 1,
    Math.ceil((scrollTop + containerHeight) / defaultItemSize) + overscan
  );

  const virtualItems: VirtualItem[] = [];
  if (count > 0) {
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        start: i * defaultItemSize,
        size: defaultItemSize,
        key: i
      });
    }
  }

  return {
    getVirtualItems: () => virtualItems,
    getTotalSize: () => totalSize,
    startIndex,
    endIndex,
  };
}

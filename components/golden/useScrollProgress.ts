import { useEffect } from 'react';

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** An element's layout box in page coordinates, ignoring CSS transforms (such as a reveal still sliding in). */
export const layoutBox = (el: HTMLElement) => {
  let top = 0;
  let left = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
    top += n.offsetTop;
    left += n.offsetLeft;
  }
  return { top, left, width: el.offsetWidth, height: el.offsetHeight };
};

interface ScrollProgressOptions {
  /** CSS custom property written on the target, e.g. '--halo-p'. */
  name: string;
  /** Progress reaches 1 when the end element's centre is this far down the window (0–1). */
  endLine?: number;
  /** Write a constant 1 (reduced motion or no animation): the finished composition. */
  still?: boolean;
}

/**
 * Scroll-linked progress for decorative transitions, written straight into a CSS variable so scrolling
 * never re-renders React (the same approach as the Golden Journey). 0 when the start element's top enters
 * the bottom of the window, 1 when the end element's centre reaches `endLine`. Positions are measured on
 * layout changes, not on every scroll.
 */
export const useScrollProgress = (
  targetRef: React.RefObject<HTMLElement | null>,
  startRef: React.RefObject<HTMLElement | null>,
  endRef: React.RefObject<HTMLElement | null>,
  { name, endLine = 0.6, still = false }: ScrollProgressOptions,
) => {
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    if (still) {
      target.style.setProperty(name, '1');
      return;
    }
    let start = 0;
    let end = 1;
    let last = -1;
    let frame = 0;

    const update = () => {
      frame = 0;
      const p = clamp((window.scrollY - start) / (end - start));
      if (Math.abs(p - last) > 0.002 || (p !== last && (p === 0 || p === 1))) {
        target.style.setProperty(name, p.toFixed(4));
        last = p;
      }
    };
    const measure = () => {
      if (!startRef.current || !endRef.current) return;
      const s = layoutBox(startRef.current);
      const e = layoutBox(endRef.current);
      const vh = window.innerHeight;
      start = s.top - vh;
      end = Math.max(start + 1, e.top + e.height / 2 - vh * endLine);
      update();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [targetRef, startRef, endRef, name, endLine, still]);
};

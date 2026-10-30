import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { JourneyLayout } from './GoldenScene';
import { gateCentre, gateShape } from './gateShape';

// three.js loads in its own chunk after the hero text has painted.
const GoldenScene = lazy(() => import('./GoldenScene'));

/** True when the browser can create a WebGL context. */
export const webglAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Scene errors hide the layer; the hero and gate fall back to their static compositions. */
class SceneBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  declare props: Readonly<{ onError: () => void; children: React.ReactNode }>;
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error('Golden Journey scene failed', error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface GoldenJourneyProps {
  /** The hero box the golden silk sits in. */
  artRef: React.RefObject<HTMLElement | null>;
  /** Wrapper around the concert carousel; the gate forms around its centred card. */
  gateRef: React.RefObject<HTMLElement | null>;
  /** The journey stays live until this element's bottom scrolls past the top of the window. */
  endRef: React.RefObject<HTMLElement | null>;
  motionOn: boolean;
  reduced: boolean;
  onUnavailable: () => void;
}

/**
 * Mounts the shared golden canvas as a fixed, click-through layer behind the landing content and keeps
 * its layout in sync with the page. Scroll and pointer only write to a ref; React re-renders only when the
 * journey enters or leaves the window.
 */
export const GoldenJourney: React.FC<GoldenJourneyProps> = ({ artRef, gateRef, endRef, motionOn, reduced, onUnavailable }) => {
  const layout = useRef<JourneyLayout>({
    art: { x: 0, y: 0, w: 0, h: 0 },
    gate: { x: 0, y: 0, w: 0, h: 0 },
    vw: 0,
    vh: 0,
    scrollY: 0,
    progress: 0,
    pointer: { x: 0, y: 0, active: false },
    version: 0,
  });
  const end = useRef(Infinity);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== 'hidden');
  const inViewRef = useRef(true);

  // Mount the scene once the browser is idle after first paint, so the headline is never held up by three.js.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 1200 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setReady(true), 300);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const L = layout.current;
    let lastGate = -1;
    let finish = 1;

    const onScroll = () => {
      L.scrollY = window.scrollY;
      L.progress = finish > 1 ? clamp(L.scrollY / finish) : 1;
      // Golden light behind the carousel (a CSS variable, so no React render)
      const light = reduced ? 1 : smooth(0.82, 1, L.progress);
      if (Math.abs(light - lastGate) > 0.01 || (light !== lastGate && (light === 0 || light === 1))) {
        gateRef.current?.style.setProperty('--gate-light', light.toFixed(3));
        lastGate = light;
      }
      const visible = L.scrollY < end.current;
      if (visible !== inViewRef.current) {
        inViewRef.current = visible;
        setInView(visible);
      }
      L.invalidate?.();
    };

    const measure = () => {
      const sy = window.scrollY;
      L.vw = window.innerWidth;
      L.vh = window.innerHeight;
      const art = artRef.current?.getBoundingClientRect();
      if (art) L.art = { x: art.left, y: art.top + sy, w: art.width, h: art.height };
      const track = gateRef.current?.querySelector<HTMLElement>('[data-carousel-track]');
      const slide = track?.querySelector<HTMLElement>('[data-carousel-slide]');
      if (track && slide) {
        const r = track.getBoundingClientRect();
        // offsetWidth/Height ignore the carousel's 3D transforms: the card's resting size
        L.gate = { x: r.left + r.width / 2 - slide.offsetWidth / 2, y: r.top + sy + (r.height - slide.offsetHeight) / 2, w: slide.offsetWidth, h: slide.offsetHeight };
      }
      const endEl = endRef.current?.getBoundingClientRect();
      end.current = endEl ? endEl.bottom + sy : Infinity;
      // The journey completes when the whole gate (apex note to column base) sits centred below the header.
      const header = 72;
      const centreY = L.gate.y + L.gate.h / 2 - gateCentre(gateShape(L.gate, L.vw));
      finish = centreY - header - (L.vh - header) / 2;
      if (gateRef.current) gateRef.current.dataset.journeyFinish = String(Math.round(finish));
      L.version++;
      onScroll();
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      L.pointer.x = e.clientX;
      L.pointer.y = e.clientY;
      L.pointer.active = true;
    };
    const onLeave = () => {
      L.pointer.active = false;
    };
    const onVisibility = () => setPageVisible(document.visibilityState !== 'hidden');

    measure();
    // Any layout change (fonts, images, viewport, orientation) changes the document's size.
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    if (artRef.current) ro.observe(artRef.current);
    if (gateRef.current) ro.observe(gateRef.current);
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [artRef, gateRef, endRef, reduced]);

  if (!ready) return null;
  const visible = inView && pageVisible;
  return (
    <div
      aria-hidden="true"
      data-golden-journey
      className="pointer-events-none fixed inset-0 z-0"
      style={{ visibility: visible ? 'visible' : 'hidden' }}
    >
      <SceneBoundary onError={onUnavailable}>
        <Suspense fallback={null}>
          <GoldenScene layout={layout} playing={motionOn && !reduced} still={reduced} visible={visible} onContextLost={onUnavailable} />
        </Suspense>
      </SceneBoundary>
    </div>
  );
};

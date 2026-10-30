import React, { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, RotateCw, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { FOCUS_LIGHT } from '../ui/tokens';
import { buttonClass } from '../ui/Button';
import { HALO_PRESETS, haloPreset, type HaloPresetId } from './haloPresets';
import type { HaloViewApi } from './HaloScene';
import haloStillImg from '../../src/assets/images/tavy_halo_hero_1792275821098.jpg';

// three.js and the 3D model live in their own chunk, fetched only when a viewer actually mounts it.
const HaloScene = lazy(() => import('./HaloScene'));

const ROTATE_STEP = 0.4;
const TILT_STEP = 0.2;
const ZOOM_STEP = 0.6;

const webglAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

/** Anything that goes wrong inside the 3D scene falls back to the still image instead of a blank box. */
class SceneBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  declare props: Readonly<{ onError: () => void; children: React.ReactNode }>;
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error('Halo 3D viewer failed', error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** True once the element is within `margin` of the viewport; stays true after that. */
const useNearViewport = (ref: React.RefObject<HTMLElement | null>, enabled: boolean, margin = '320px') => {
  const [near, setNear] = useState(!enabled);
  useEffect(() => {
    if (near || !ref.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setNear(true),
      { rootMargin: margin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [near, ref, margin]);
  return near;
};

const iconButton = `inline-flex size-11 items-center justify-center rounded-full border border-tv-line bg-tv-paper text-tv-navy transition-colors hover:border-tv-navy/30 hover:bg-tv-mist disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer ${FOCUS_LIGHT}`;

interface HaloViewerProps {
  /** Id of the text that explains this is a concept (read with the viewer). */
  conceptId: string;
  /** Wait until the viewer scrolls near the screen before downloading three.js (used on the landing page). */
  deferUntilVisible?: boolean;
}

/**
 * The interactive Halo concept viewer: the 3D model with drag, pinch and Ctrl/⌘-scroll, plus buttons and
 * keyboard for every action, three lighting presets, and a still-image fallback without WebGL.
 */
export const HaloViewer: React.FC<HaloViewerProps> = ({ conceptId, deferUntilVisible = false }) => {
  const reducedMotion = useReducedMotionPreference();
  const [presetId, setPresetId] = useState<HaloPresetId>('violet');
  const preset = haloPreset(presetId);
  const [use3d, setUse3d] = useState(webglAvailable);
  const [zoomLimits, setZoomLimits] = useState({ atMin: false, atMax: false });
  const viewApi = useRef<HaloViewApi | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(stageRef, deferUntilVisible);
  const hintId = useId();

  const fallBackToStill = useCallback(() => setUse3d(false), []);
  const onZoomLimits = useCallback((atMin: boolean, atMax: boolean) => setZoomLimits({ atMin, atMax }), []);

  const rotate = (yaw: number, pitch: number) => viewApi.current?.rotateBy(yaw, pitch);
  const zoom = (step: number) => viewApi.current?.zoomBy(step);
  const reset = () => viewApi.current?.reset();

  // Keyboard on the focused viewer: arrows rotate, + / − zoom, 0 or Home resets.
  const onViewerKey = (e: React.KeyboardEvent) => {
    const actions: Record<string, () => void> = {
      ArrowLeft: () => rotate(-ROTATE_STEP, 0),
      ArrowRight: () => rotate(ROTATE_STEP, 0),
      ArrowUp: () => rotate(0, -TILT_STEP),
      ArrowDown: () => rotate(0, TILT_STEP),
      '+': () => zoom(ZOOM_STEP),
      '=': () => zoom(ZOOM_STEP),
      '-': () => zoom(-ZOOM_STEP),
      '0': reset,
      Home: reset,
    };
    const action = actions[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  };

  const loading = (
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="text-sm text-tv-slate motion-safe:animate-pulse">Loading 3D model…</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div
        ref={stageRef}
        role="group"
        aria-label="Halo concept model, 3D view"
        aria-describedby={`${conceptId} ${hintId}`}
        tabIndex={use3d ? 0 : undefined}
        onKeyDown={use3d ? onViewerKey : undefined}
        className={`relative aspect-square w-full overflow-hidden rounded-tv-xl border border-tv-line bg-gradient-to-b from-tv-paper to-tv-mist shadow-tv-lift ${FOCUS_LIGHT}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-[background] duration-700 motion-reduce:transition-none"
          style={{ background: preset.backdrop }}
        />
        {use3d ? (
          near ? (
            <SceneBoundary onError={fallBackToStill}>
              <Suspense fallback={loading}>
                <HaloScene
                  preset={preset}
                  reducedMotion={reducedMotion}
                  apiRef={viewApi}
                  onZoomLimits={onZoomLimits}
                  onContextLost={fallBackToStill}
                />
              </Suspense>
            </SceneBoundary>
          ) : (
            loading
          )
        ) : (
          <figure className="absolute inset-0 m-0">
            <img
              src={haloStillImg}
              alt="Still render of the Halo concept: an open titanium-toned cuff with a glowing light window"
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-tv-navy/80 px-4 py-3 text-sm text-white">
              3D view isn't available on this device, so you're seeing a still render of the concept.
            </figcaption>
          </figure>
        )}
        <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-tv-line bg-tv-paper/90 px-3 py-1 text-xs font-medium text-tv-navy backdrop-blur-sm">
          Concept · not actual hardware
        </span>
      </div>

      {use3d && (
        <p id={hintId} className="text-xs leading-relaxed text-tv-slate">
          Drag or swipe sideways to turn it. Pinch, or Ctrl/⌘ + scroll, to zoom. Keyboard: focus the view, then use the arrow
          keys, + and −, and 0 to reset.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Lighting preset" className="flex flex-wrap gap-2">
          {HALO_PRESETS.map((p) => (
            <button
              key={p.id}
              aria-pressed={presetId === p.id}
              onClick={() => setPresetId(p.id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors cursor-pointer ${FOCUS_LIGHT} ${
                presetId === p.id
                  ? 'border-tv-navy bg-tv-navy text-white'
                  : 'border-tv-line bg-tv-paper text-tv-navy hover:border-tv-navy/30'
              }`}
            >
              <span aria-hidden="true" className="size-3 rounded-full ring-2 ring-white/70" style={{ background: p.rim }} />
              {p.label}
            </button>
          ))}
        </div>

        {use3d && (
          <div role="group" aria-label="View controls" className="flex flex-wrap gap-2">
            <button className={iconButton} onClick={() => rotate(-ROTATE_STEP, 0)} aria-label="Rotate left">
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
            <button className={iconButton} onClick={() => rotate(ROTATE_STEP, 0)} aria-label="Rotate right">
              <RotateCw className="w-4 h-4" aria-hidden="true" />
            </button>
            <button className={iconButton} onClick={() => rotate(0, -TILT_STEP)} aria-label="Tilt up">
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            </button>
            <button className={iconButton} onClick={() => rotate(0, TILT_STEP)} aria-label="Tilt down">
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </button>
            <button className={iconButton} onClick={() => zoom(-ZOOM_STEP)} disabled={zoomLimits.atMax} aria-label="Zoom out">
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
            </button>
            <button className={iconButton} onClick={() => zoom(ZOOM_STEP)} disabled={zoomLimits.atMin} aria-label="Zoom in">
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={reset} className={buttonClass('secondary')}>
              <Undo2 className="w-4 h-4" aria-hidden="true" />
              Reset view
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

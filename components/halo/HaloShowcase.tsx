import React, { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, Music2, RotateCcw, RotateCw, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { FOCUS_RING } from '../experience/ExperienceShell';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { HALO_PRESETS, haloPreset, type HaloPresetId } from './haloPresets';
import type { HaloViewApi } from './HaloScene';
import haloStillImg from '../../src/assets/images/tavy_halo_hero_1792275821098.jpg';

// three.js and the 3D model live in their own chunk, fetched only when this page opens.
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
  // The repo has no @types/react, so React.Component doesn't type `props` on its own.
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

interface HaloShowcaseProps {
  onBack: () => void;
  onEnterExperience: () => void;
}

const iconButton = `inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-100 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`;

export const HaloShowcase: React.FC<HaloShowcaseProps> = ({ onBack, onEnterExperience }) => {
  const reducedMotion = useReducedMotionPreference();
  const [presetId, setPresetId] = useState<HaloPresetId>('violet');
  const preset = haloPreset(presetId);
  const [use3d, setUse3d] = useState(webglAvailable);
  const [zoomLimits, setZoomLimits] = useState({ atMin: false, atMax: false });
  const viewApi = useRef<HaloViewApi | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hintId = useId();
  const conceptId = useId();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

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

  const enter = reducedMotion ? false : { opacity: 0, y: 18 };

  return (
    <div className="min-h-screen bg-[#070a1a] text-white relative overflow-x-hidden selection:bg-violet-400 selection:text-black">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-[background] duration-700 motion-reduce:transition-none"
        style={{ background: preset.backdrop }}
      />

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-3.5 border-b border-white/10 bg-[#0b1024]/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs sm:text-sm font-medium text-stone-200 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 min-h-11 rounded-full border border-white/10 cursor-pointer ${FOCUS_RING}`}
        >
          <ArrowLeft className="w-4 h-4 text-amber-300" aria-hidden="true" />
          Back to TΛVY Website
        </button>
        <span className="px-3 py-1 rounded-full border border-violet-300/40 bg-violet-400/10 text-violet-100 text-xs font-semibold">
          Concept model
        </span>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 sm:px-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <motion.div initial={enter} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="space-y-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Beyond the Sound</p>
          <h1 ref={headingRef} tabIndex={-1} className="text-5xl sm:text-6xl font-bold tracking-tight focus:outline-none">
            TΛVY <span className="font-halo font-medium text-violet-200">Halo</span>
          </h1>
          <p className="font-editorial-serif italic text-2xl sm:text-3xl text-stone-200">Feel the music. Together.</p>
          <p className="text-base sm:text-lg text-stone-300 font-light leading-relaxed max-w-xl">
            Explore the design concept for Halo: an open, titanium-toned cuff with a soft light window that glows
            with the music. Turn it, move in closer and try each lighting mood.
          </p>
          <p id={conceptId} className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-300 leading-relaxed">
            <strong className="text-stone-100">Concept visualisation.</strong> This model shows a design direction
            only. It is not manufactured hardware, and it does not represent final dimensions, materials or specifications.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onEnterExperience}
              className={`inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-400 px-6 text-sm font-bold uppercase tracking-wider text-stone-950 hover:bg-amber-300 transition-colors cursor-pointer ${FOCUS_RING}`}
            >
              <Music2 className="w-4 h-4" aria-hidden="true" />
              Enter Concert Experience
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="space-y-4"
        >
          <div
            role="group"
            aria-label="Halo concept model, 3D view"
            aria-describedby={`${conceptId} ${hintId}`}
            tabIndex={use3d ? 0 : undefined}
            onKeyDown={use3d ? onViewerKey : undefined}
            className={`relative aspect-square w-full overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#10163a] to-[#070a1a] shadow-[0_40px_120px_-40px_rgba(124,58,237,0.45)] ${FOCUS_RING}`}
          >
            {/* Glass reflection along the top edge */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.07] to-transparent z-10" />
            {use3d ? (
              <SceneBoundary onError={fallBackToStill}>
                <Suspense
                  fallback={
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm text-stone-300 motion-safe:animate-pulse">Loading 3D model…</p>
                    </div>
                  }
                >
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
              <figure className="absolute inset-0 m-0">
                <img src={haloStillImg} alt="Still render of the Halo concept: an open titanium-toned cuff with a glowing light window" className="h-full w-full object-cover" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-3 text-sm text-stone-100">
                  3D view isn't available on this device, so you're seeing a still render of the concept.
                </figcaption>
              </figure>
            )}
            <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-stone-100 backdrop-blur-sm">
              Concept · not actual hardware
            </span>
          </div>

          {use3d && (
            <p id={hintId} className="text-xs text-stone-400">
              Drag or swipe sideways to turn it. Pinch, or Ctrl/⌘ + scroll, to zoom. Keyboard: focus the view, then use the
              arrow keys, + and −, and 0 to reset.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="group" aria-label="Lighting preset" className="flex flex-wrap gap-2">
              {HALO_PRESETS.map((p) => (
                <button
                  key={p.id}
                  aria-pressed={presetId === p.id}
                  onClick={() => setPresetId(p.id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors cursor-pointer ${FOCUS_RING} ${
                    presetId === p.id ? 'border-white/40 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-stone-300 hover:bg-white/10'
                  }`}
                >
                  <span aria-hidden="true" className="size-3 rounded-full" style={{ background: p.rim, boxShadow: `0 0 10px ${p.rim}` }} />
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
                <button
                  onClick={reset}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-stone-100 hover:bg-white/15 transition-colors cursor-pointer ${FOCUS_RING}`}
                >
                  <Undo2 className="w-4 h-4" aria-hidden="true" />
                  Reset view
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default HaloShowcase;

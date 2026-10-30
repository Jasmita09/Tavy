import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Pause, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { Accent } from '../ui/SectionHeading';
import { CONTAINER, EYEBROW, FOCUS_LIGHT, MOTION } from '../ui/tokens';
import type { NoteKind } from './GoldenScene';

// three.js loads in its own chunk after the hero text has painted.
const GoldenScene = lazy(() => import('./GoldenScene'));

const WholeNote = <span className="inline-block h-2.5 w-3.5 -rotate-12 rounded-[50%] border-2 border-current" />;

const NOTES: Array<{ kind: NoteKind; label: string; glyph: React.ReactNode; caption: string }> = [
  { kind: 'whole', label: 'Whole', glyph: WholeNote, caption: 'Every beat begins with a feeling.' },
  { kind: 'eighth', label: 'Eighth', glyph: '♪', caption: 'Let the music lead you somewhere new.' },
  { kind: 'double', label: 'Beamed', glyph: '♫', caption: 'Different places. One shared rhythm.' },
];

const webglAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

/** Scene errors fall back to the static notes instead of an empty box. */
class SceneBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  declare props: Readonly<{ onError: () => void; children: React.ReactNode }>;
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error('Golden Overture scene failed', error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Static gold notes: shown while three.js loads, without WebGL, or if the scene fails. */
const StillNotes: React.FC = () => (
  <div aria-hidden="true" className="absolute inset-0 flex -rotate-12 items-center justify-center gap-[12%] text-[clamp(4.5rem,9vw,8.5rem)] text-tv-accent [text-shadow:0_18px_36px_rgb(201_160_99/0.35)]">
    <span>♪</span>
    <span className="translate-y-16">♫</span>
    <span className="-translate-y-10">♩</span>
  </div>
);

interface GoldenHeroProps {
  reduced: boolean;
  onExplore: () => void;
  onDiscover: () => void;
}

export const GoldenHero: React.FC<GoldenHeroProps> = ({ reduced, onExplore, onDiscover }) => {
  const section = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [selected, setSelected] = useState<NoteKind | null>(null);
  const [motionOn, setMotionOn] = useState(true);
  const [onScreen, setOnScreen] = useState(true);
  const [ready, setReady] = useState(false);
  const [use3d, setUse3d] = useState(webglAvailable);

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

  // Stop animating while the hero is off-screen; the canvas stays mounted so its GPU context is kept.
  useEffect(() => {
    const el = section.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => setOnScreen(entries.some((e) => e.isIntersecting)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll progress through the hero, stored in a ref so scrolling never re-renders React.
  useEffect(() => {
    const update = () => {
      const el = section.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      progressRef.current = Math.max(0, Math.min(1, -top / Math.max(1, height)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const fallBack = useCallback(() => setUse3d(false), []);
  const playing = motionOn && onScreen && !reduced;
  const caption = NOTES.find((n) => n.kind === selected)?.caption ?? 'A world of music awaits.';
  const enter = (delay: number) =>
    reduced ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: MOTION.slow, ease: MOTION.ease, delay } };

  return (
    <section ref={section} aria-labelledby="hero-title" className="relative overflow-hidden pt-24 sm:pt-28">
      {/* Warm champagne light behind the sculpture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_45%,rgb(245_230_201/0.9),rgb(251_247_239/0)_60%)]"
      />
      <div className={`${CONTAINER} relative grid items-center gap-6 lg:min-h-[640px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]`}>
        <div className="relative z-10 pt-6 lg:py-16">
          <motion.p {...enter(0)} className={EYEBROW}>
            TΛVY · Music without barriers
          </motion.p>
          <motion.h1
            id="hero-title"
            {...enter(0.04)}
            className="mt-5 text-[3.1rem] leading-[0.98] sm:text-7xl lg:text-[5.75rem] font-semibold tracking-[-0.05em] text-tv-navy"
          >
            Feel the music.{' '}
            <br className="hidden sm:block" />
            <span className="text-tv-accent-ink">
              <Accent>Together.</Accent>
            </span>
          </motion.h1>
          <motion.p {...enter(0.1)} className="mt-6 max-w-md text-lg sm:text-xl leading-relaxed text-tv-slate text-pretty">
            Two concert experiences. One more inclusive way to feel music — for everyone.
          </motion.p>
          <motion.div {...enter(0.16)} className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={onExplore}>
              Explore Experience
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button size="lg" variant="secondary" onClick={onDiscover}>
              Discover TΛVY
            </Button>
          </motion.div>
        </div>

        <div className="relative">
          <p aria-hidden="true" className="pointer-events-none absolute z-10 top-2 right-4 sm:right-2 font-serif italic text-base sm:text-xl text-tv-accent-ink/70">
            Each note, a new possibility.
          </p>
          <div className="relative h-[290px] sm:h-[440px] lg:h-[540px] -mx-4 sm:mx-0 [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
            {use3d && ready ? (
              <SceneBoundary onError={fallBack}>
                <Suspense fallback={<StillNotes />}>
                  <GoldenScene
                    playing={playing}
                    visible={onScreen}
                    reducedMotion={reduced}
                    active={selected}
                    onSelect={(kind) => setSelected((cur) => (cur === kind ? null : kind))}
                    progressRef={progressRef}
                    onContextLost={fallBack}
                  />
                </Suspense>
              </SceneBoundary>
            ) : (
              <StillNotes />
            )}
          </div>

          <p aria-live="polite" className="mt-2 min-h-8 text-center lg:text-right font-serif italic text-xl text-tv-accent-ink">
            {caption}
          </p>
          {/* Every note is also a real button, so the scene never requires a pointer */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 lg:justify-end">
            <div role="group" aria-label="Choose a note" className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {NOTES.map((n) => (
                <button
                  key={n.kind}
                  aria-pressed={selected === n.kind}
                  onClick={() => setSelected((cur) => (cur === n.kind ? null : n.kind))}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 sm:px-4 text-sm font-medium transition-colors cursor-pointer ${FOCUS_LIGHT} ${
                    selected === n.kind
                      ? 'border-tv-navy bg-tv-navy text-white'
                      : 'border-tv-line bg-tv-paper/80 text-tv-navy hover:border-tv-accent'
                  }`}
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    {n.glyph}
                  </span>
                  {n.label}
                </button>
              ))}
            </div>
            {!reduced && use3d && (
              <button
                onClick={() => setMotionOn((on) => !on)}
                aria-pressed={!motionOn}
                className={`inline-flex size-11 items-center justify-center rounded-full border border-tv-line bg-tv-paper/80 text-tv-navy hover:border-tv-accent cursor-pointer ${FOCUS_LIGHT}`}
              >
                {motionOn ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                <span className="sr-only">Pause background motion</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div aria-hidden="true" className={`${CONTAINER} hidden lg:flex items-center gap-3 pb-10 pt-4 text-[10px] font-semibold tracking-[0.23em] text-tv-slate`}>
        SCROLL TO EXPLORE <ArrowDown className="w-4 h-4" />
      </div>
    </section>
  );
};

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Clapperboard, Pause, Play, RotateCcw, SkipForward, X } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { buttonClass } from '../ui/Button';
import { EYEBROW, FOCUS_LIGHT } from '../ui/tokens';
import { STORY_ENDING, STORY_SCENES } from './StoryArt';
import './story.css';

/** How long each scene plays, and when the closing line appears in the last one. */
const SCENE_MS = 7000;
const ENDING_AT_MS = 2600;
const LAST = STORY_SCENES.length - 1;

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

interface StoryPlayerProps {
  onClose: () => void;
  onTryAtHome: () => void;
}

/**
 * "A Dream Beyond Distance": a short, optional story in four illustrated scenes. Silent (no audio at
 * all), captioned throughout, with Pause, Previous/Next, Skip, Close and a text version. It starts paused
 * and fully composed with reduced motion. A modal dialog: focus stays inside, Escape closes it, and focus
 * returns to whatever opened it.
 */
export const StoryPlayer: React.FC<StoryPlayerProps> = ({ onClose, onTryAtHome }) => {
  const reduced = useReducedMotionPreference();
  const [mode, setMode] = useState<'watch' | 'read'>('watch');
  const [scene, setScene] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(!reduced);
  const [ended, setEnded] = useState(false);
  // Scenes reached while paused (or with reduced motion) are shown finished and still
  const [still, setStill] = useState(reduced);
  const panel = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const captionId = useId();

  // Modal behaviour: the page behind is inert, the body doesn't scroll, focus comes back on close
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    return () => {
      root?.removeAttribute('inert');
      document.body.style.overflow = prevOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  // The clock: runs only while playing in the watch view
  const running = playing && mode === 'watch';
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      // Measure the step before queueing the update (the updater may run later)
      const now = performance.now();
      const step = now - last;
      last = now;
      setElapsed((e) => e + step);
    }, 100);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (elapsed < SCENE_MS) return;
    if (scene < LAST) {
      setScene((s) => s + 1);
      setElapsed(0);
    } else {
      setPlaying(false);
      setEnded(true);
      setElapsed(SCENE_MS);
    }
  }, [elapsed, scene]);

  // A hidden tab pauses the story rather than playing to nobody
  useEffect(() => {
    const onHide = () => document.hidden && setPlaying(false);
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  const goTo = useCallback(
    (to: number) => {
      const next = Math.max(0, Math.min(LAST, to));
      setScene(next);
      setElapsed(0);
      setEnded(false);
      if (!playing) setStill(true);
    },
    [playing],
  );

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (ended) {
      setScene(0);
      setEnded(false);
      setElapsed(0);
    } else if (still) {
      setElapsed(0);
    }
    setStill(reduced);
    setPlaying(true);
  };

  const skip = () => {
    setPlaying(false);
    setScene(LAST);
    setElapsed(SCENE_MS);
    setEnded(true);
    setStill(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (mode === 'watch' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      goTo(scene + (e.key === 'ArrowRight' ? 1 : -1));
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const current = STORY_SCENES[scene];
  const showEnding = scene === LAST && (ended || still || elapsed >= ENDING_AT_MS);
  const motionClass = still || mode === 'read' ? 'tvs-still' : playing ? '' : 'tvs-paused';
  const iconButton = `inline-flex size-11 items-center justify-center rounded-full border border-tv-line bg-tv-paper text-tv-navy hover:bg-tv-mist disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${FOCUS_LIGHT}`;

  const endActions = (
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" onClick={onTryAtHome} className={buttonClass('primary', 'lg')}>
        Try the At-home Concert
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={onClose} className={buttonClass('secondary', 'lg')}>
        Back to TΛVY
      </button>
    </div>
  );

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className={`tvs-player fixed inset-0 z-[120] overflow-y-auto bg-tv-canvas text-tv-navy ${motionClass}`}
      style={{ ['--tvs-scene-ms' as string]: `${SCENE_MS}ms` }}
    >
      {/* Soft champagne and blush light, as on the landing page */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgb(245_230_201/0.9),rgb(251_247_239/0)_60%),radial-gradient(ellipse_at_90%_90%,rgb(235_196_192/0.35),rgb(251_247_239/0)_50%)]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pb-8 pt-4 sm:px-8 sm:pt-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={EYEBROW}>Our story · No fan left behind</p>
            <h2 ref={titleRef} id={titleId} tabIndex={-1} className="mt-1 font-serif text-2xl leading-tight text-tv-navy focus:outline-none sm:text-3xl">
              A Dream Beyond Distance
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'watch' ? 'read' : 'watch'))}
              aria-pressed={mode === 'read'}
              className={`${buttonClass('ghost')} hidden sm:inline-flex`}
            >
              {mode === 'watch' ? <BookOpen className="w-4 h-4" aria-hidden="true" /> : <Clapperboard className="w-4 h-4" aria-hidden="true" />}
              {mode === 'watch' ? 'Read as text' : 'Watch'}
            </button>
            {mode === 'watch' && !ended && (
              <button type="button" onClick={skip} className={buttonClass('secondary')}>
                <SkipForward className="w-4 h-4" aria-hidden="true" />
                Skip
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close story" className={iconButton}>
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* The text version toggle on phones, where the header is narrow */}
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'watch' ? 'read' : 'watch'))}
          aria-pressed={mode === 'read'}
          className={`${buttonClass('ghost')} mt-2 self-start sm:hidden`}
        >
          {mode === 'watch' ? <BookOpen className="w-4 h-4" aria-hidden="true" /> : <Clapperboard className="w-4 h-4" aria-hidden="true" />}
          {mode === 'watch' ? 'Read as text' : 'Watch'}
        </button>

        {mode === 'watch' ? (
          <div className="mt-4 flex flex-1 flex-col sm:mt-6">
            {/* Scene markers: progress, and a way to jump to any scene */}
            <ol className="grid grid-cols-4 gap-2" aria-label="Scenes">
              {STORY_SCENES.map((s, i) => {
                const fill = i < scene || (i === scene && ended) ? 1 : i === scene ? Math.min(1, elapsed / SCENE_MS) : 0;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={i === scene ? 'step' : undefined}
                      className={`group block w-full cursor-pointer rounded py-2 text-left ${FOCUS_LIGHT}`}
                    >
                      <span className="tvs-segment block h-1 overflow-hidden rounded-full bg-tv-line">
                        <span className="block h-full rounded-full bg-tv-accent-ink" style={{ width: `${fill * 100}%` }} />
                      </span>
                      <span className={`mt-1.5 block text-[11px] font-semibold leading-tight tracking-wide sm:truncate sm:text-xs ${i === scene ? 'text-tv-navy' : 'text-tv-slate'}`}>
                        <span className="sr-only">Scene {i + 1}: </span>
                        {s.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* The picture */}
            <div className="tvs-frame relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-tv-lg bg-[#2b211d] shadow-tv-lift sm:max-h-[58vh]">
              <div
                key={`${scene}-${still}`}
                role="img"
                aria-label={current.description}
                className="tvs-scene-in absolute inset-0"
              >
                <div
                  className="tvs-camera h-full w-full"
                  style={{ ['--tvs-origin' as string]: current.camera.origin, ['--tvs-dx' as string]: current.camera.dx, ['--tvs-dy' as string]: current.camera.dy }}
                >
                  <current.Art />
                </div>
              </div>
            </div>

            {/* Captions: always on screen, and announced when the scene changes */}
            <div id={captionId} className="mx-auto mt-5 w-full max-w-2xl text-center" aria-live="polite" aria-atomic="true">
              <p className={EYEBROW}>
                Scene {scene + 1} of {STORY_SCENES.length} · {current.title}
              </p>
              <p className="mt-2 font-serif text-2xl leading-snug text-tv-navy sm:text-3xl">{current.caption}</p>
              <p className="mt-2 text-tv-slate">{current.detail}</p>
            </div>
            {showEnding && (
              <div className="mx-auto mt-6 max-w-2xl space-y-5 text-center">
                <p className="tvs-ending font-serif text-3xl italic text-tv-accent-ink sm:text-4xl" role="status">
                  {STORY_ENDING}
                </p>
                {ended && endActions}
              </div>
            )}

            {/* Controls */}
            <div className="mt-auto flex items-center justify-center gap-3 pt-6" role="group" aria-label="Story controls">
              <button type="button" onClick={() => goTo(scene - 1)} disabled={scene === 0} aria-label="Previous scene" className={iconButton}>
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={togglePlay} className={`${buttonClass('primary')} min-w-36`}>
                {playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : ended ? <RotateCcw className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                {playing ? 'Pause' : ended ? 'Watch again' : 'Play'}
              </button>
              <button type="button" onClick={() => goTo(scene + 1)} disabled={scene === LAST} aria-label="Next scene" className={iconButton}>
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-tv-slate">
              No sound: the captions tell the story. Use ← and → to move between scenes, Escape to close.
            </p>
          </div>
        ) : (
          /* The static text version: every scene, its picture described, and the ending */
          <article className="mx-auto mt-6 w-full max-w-3xl space-y-10" aria-label="A Dream Beyond Distance, as text">
            {STORY_SCENES.map((s, i) => (
              <section key={s.id} aria-labelledby={`${titleId}-${s.id}`} className="grid gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-center">
                <div role="img" aria-label={s.description} className="tvs-frame aspect-[16/10] overflow-hidden rounded-tv-md bg-[#2b211d] shadow-tv-soft">
                  <s.Art />
                </div>
                <div className="space-y-2">
                  <p className={EYEBROW}>Scene {i + 1}</p>
                  <h3 id={`${titleId}-${s.id}`} className="font-serif text-2xl text-tv-navy">
                    {s.title}
                  </h3>
                  <p className="text-lg leading-relaxed text-tv-navy">{s.caption}</p>
                  <p className="leading-relaxed text-tv-slate">{s.detail}</p>
                  <p className="text-sm leading-relaxed text-tv-slate">
                    <span className="font-semibold">In the picture: </span>
                    {s.description}
                  </p>
                </div>
              </section>
            ))}
            <div className="space-y-6 border-t border-tv-line pt-8 text-center">
              <p className="font-serif text-3xl italic text-tv-accent-ink">{STORY_ENDING}</p>
              {endActions}
            </div>
          </article>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default StoryPlayer;

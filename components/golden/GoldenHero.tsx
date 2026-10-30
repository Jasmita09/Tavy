import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Music2, Play } from 'lucide-react';
import { NOTE_TAP_SCALE } from '../audio/score';
import { noteTap } from '../audio/soundEngine';
import { useSound } from '../audio/useSound';
import { Button } from '../ui/Button';
import { Accent } from '../ui/SectionHeading';
import { CONTAINER, EYEBROW, FOCUS_LIGHT, MOTION } from '../ui/tokens';
import { MotionToggle } from './MotionToggle';

/** Static gold notes: the hero's composition without WebGL. */
const StillNotes: React.FC = () => (
  <div aria-hidden="true" className="absolute inset-0 flex -rotate-12 items-center justify-center gap-[12%] text-[clamp(4.5rem,9vw,8.5rem)] text-tv-accent [text-shadow:0_18px_36px_rgb(201_160_99/0.35)]">
    <span>♪</span>
    <span className="translate-y-16">♫</span>
    <span className="-translate-y-10">♩</span>
  </div>
);

interface GoldenHeroProps {
  reduced: boolean;
  /** WebGL is available: the golden silk and notes are drawn by the shared journey layer behind this box. */
  use3d: boolean;
  motionOn: boolean;
  onToggleMotion: () => void;
  artRef: React.RefObject<HTMLDivElement | null>;
  onExplore: () => void;
  onDiscover: () => void;
  /** Opens the optional story ("A Dream Beyond Distance"). */
  onWatchStory?: () => void;
}

export const GoldenHero: React.FC<GoldenHeroProps> = ({ reduced, use3d, motionOn, onToggleMotion, artRef, onExplore, onDiscover, onWatchStory }) => {
  // Living notes: with the music on, a deliberate tap (not hover, not a scroll) in the notes' space plays a
  // soft bell in the soundtrack's key, with a ripple where it was touched. Keyboard: "Play a note".
  const sound = useSound();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);
  const nextNote = useRef(0);
  const playNote = (index: number, x: number, y: number) => {
    if (!noteTap(index)) return;
    const id = ++rippleId.current;
    setRipples((r) => [...r.slice(-4), { id, x, y }]);
    window.setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 1200);
  };
  const onArtClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sound.site) return;
    const r = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    playNote(Math.floor(fx * NOTE_TAP_SCALE.length), e.clientX - r.left, e.clientY - r.top);
  };

  const enter = (delay: number) =>
    reduced ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: MOTION.slow, ease: MOTION.ease, delay } };

  return (
    <section aria-labelledby="hero-title" className="pt-24 sm:pt-28">
      {/* Warm champagne light behind the silk; below the journey layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] bg-[radial-gradient(ellipse_at_72%_45%,rgb(245_230_201/0.9),rgb(251_247_239/0)_60%)]"
      />
      <div className={`${CONTAINER} grid items-center gap-6 lg:min-h-[640px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]`}>
        <div className="relative pt-6 lg:py-16">
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
          {onWatchStory && (
            <motion.div {...enter(0.22)} className="mt-5">
              <button
                type="button"
                onClick={onWatchStory}
                className={`group inline-flex min-h-11 items-center gap-3 rounded-full pr-3 text-sm font-semibold text-tv-navy cursor-pointer ${FOCUS_LIGHT}`}
              >
                <span className="inline-flex size-10 items-center justify-center rounded-full border border-tv-accent/60 bg-tv-paper text-tv-accent-ink shadow-tv-soft transition-colors group-hover:bg-tv-mist">
                  <Play className="w-4 h-4 translate-x-px" aria-hidden="true" />
                </span>
                <span className="text-left">
                  Watch Our Story
                  <span className="block text-xs font-normal text-tv-slate">A 30-second story · sound optional, always captioned</span>
                </span>
              </button>
            </motion.div>
          )}
        </div>

        <div className="relative">
          <p aria-hidden="true" className="pointer-events-none absolute z-10 top-2 right-4 sm:right-2 font-serif italic text-base sm:text-xl text-tv-accent-ink">
            Each note, a new possibility.
          </p>
          {/* The silk is drawn into this box by the journey layer; the box only reserves its space */}
          {/* Taps here are optional and only make sound with the music on; nothing here is a control */}
          <div
            ref={artRef}
            onClick={onArtClick}
            className={`relative h-[290px] sm:h-[440px] lg:h-[540px] -mx-4 sm:mx-0 ${sound.site ? 'cursor-pointer' : ''}`}
          >
            {!use3d && <StillNotes />}
            {ripples.map((p) => (
              <span
                key={p.id}
                aria-hidden="true"
                className="tv-note-ripple pointer-events-none absolute size-40 rounded-full border border-tv-accent/70 bg-[radial-gradient(circle,rgb(246_220_169/0.45),rgb(246_220_169/0)_65%)]"
                style={{ left: p.x, top: p.y }}
              />
            ))}
          </div>
          {sound.site && (
            <div className="mt-2 flex justify-center lg:justify-end">
              <button
                type="button"
                onClick={(e) => {
                  const box = artRef.current?.getBoundingClientRect();
                  const i = nextNote.current++ % NOTE_TAP_SCALE.length;
                  // Keyboard presses ripple across the notes' space, left to right
                  if (box) playNote(i, ((i + 0.5) / NOTE_TAP_SCALE.length) * box.width, box.height * 0.5);
                  (e.currentTarget as HTMLButtonElement).focus();
                }}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-tv-accent-ink hover:bg-tv-mist cursor-pointer ${FOCUS_LIGHT}`}
              >
                <Music2 className="w-4 h-4" aria-hidden="true" />
                Play a note
                <span className="sr-only">(or tap the golden notes)</span>
              </button>
            </div>
          )}
          {use3d && !reduced && (
            <div className="mt-2 flex justify-center lg:justify-end">
              <MotionToggle motionOn={motionOn} onToggle={onToggleMotion} />
            </div>
          )}
        </div>
      </div>

      <div aria-hidden="true" className={`${CONTAINER} hidden lg:flex items-center gap-3 pb-10 pt-4 text-[10px] font-semibold tracking-[0.23em] text-tv-slate`}>
        SCROLL TO EXPLORE <ArrowDown className="w-4 h-4" />
      </div>
    </section>
  );
};

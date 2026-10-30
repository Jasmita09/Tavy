import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Accent } from '../ui/SectionHeading';
import { CONTAINER, EYEBROW, MOTION } from '../ui/tokens';
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
}

export const GoldenHero: React.FC<GoldenHeroProps> = ({ reduced, use3d, motionOn, onToggleMotion, artRef, onExplore, onDiscover }) => {
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
        </div>

        <div className="relative">
          <p aria-hidden="true" className="pointer-events-none absolute z-10 top-2 right-4 sm:right-2 font-serif italic text-base sm:text-xl text-tv-accent-ink">
            Each note, a new possibility.
          </p>
          {/* The silk is drawn into this box by the journey layer; the box only reserves its space */}
          <div ref={artRef} className="relative h-[290px] sm:h-[440px] lg:h-[540px] -mx-4 sm:mx-0">
            {!use3d && <StillNotes />}
          </div>
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

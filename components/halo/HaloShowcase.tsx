import React, { useEffect, useId, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { buttonClass } from '../ui/Button';
import { Accent } from '../ui/SectionHeading';
import { CONTAINER, EYEBROW, MOTION } from '../ui/tokens';
import { HaloViewer } from './HaloViewer';
import { HaloConceptDetails } from './HaloConceptDetails';

interface HaloShowcaseProps {
  onBack: () => void;
  onEnterExperience: () => void;
  onOpenCompanionApp: () => void;
}

export const HaloShowcase: React.FC<HaloShowcaseProps> = ({ onBack, onEnterExperience, onOpenCompanionApp }) => {
  const reducedMotion = useReducedMotionPreference();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const conceptId = useId();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const enter = reducedMotion ? false : { opacity: 0, y: 18 };

  return (
    <div className="min-h-screen bg-tv-canvas text-tv-navy overflow-x-hidden selection:bg-tv-violet/30">
      <header className="sticky top-0 z-40 border-b border-tv-line bg-tv-canvas/90 backdrop-blur-xl">
        <div className={`${CONTAINER} flex h-16 items-center justify-between gap-3`}>
          <button onClick={onBack} className={buttonClass('ghost')}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to TΛVY Website
          </button>
          <span className="rounded-full border border-tv-line bg-tv-paper px-3 py-1 text-xs font-semibold text-tv-violet-ink">
            Concept model
          </span>
        </div>
      </header>

      <main className={`${CONTAINER} space-y-24 py-12 sm:py-16`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <motion.div initial={enter} animate={{ opacity: 1, y: 0 }} transition={{ duration: MOTION.slow, ease: MOTION.ease }} className="space-y-6">
            <p className={EYEBROW}>Halo haptic concept</p>
            <h1 ref={headingRef} tabIndex={-1} className="text-5xl sm:text-7xl font-semibold tracking-[-0.04em] focus:outline-none">
              TΛVY <Accent>Halo</Accent>
            </h1>
            <p className="font-serif italic text-2xl sm:text-3xl text-tv-navy/80">A new way to feel music.</p>
            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-tv-slate">
              An open cuff with a soft light window, imagined to turn musical cues into gentle pulses on the wrist. Turn it,
              move in closer and try each lighting mood.
            </p>
            <p id={conceptId} className="max-w-xl rounded-tv-md border border-tv-line bg-tv-paper px-4 py-3 text-sm leading-relaxed text-tv-slate">
              <strong className="text-tv-navy">Concept visualisation.</strong> This model shows a design direction only. It
              is not manufactured hardware, and it does not represent final dimensions, materials or specifications.
            </p>
            <button onClick={onEnterExperience} className={buttonClass('primary', 'lg')}>
              Enter Concert Experience
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </motion.div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: MOTION.ease, delay: 0.1 }}
          >
            <HaloViewer conceptId={conceptId} />
          </motion.div>
        </div>

        <HaloConceptDetails onOpenCompanionApp={onOpenCompanionApp} />
      </main>
    </div>
  );
};

export default HaloShowcase;

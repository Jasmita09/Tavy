import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { buttonClass } from '../ui/Button';
import { CONTAINER, EYEBROW, MOTION } from '../ui/tokens';

/** Keyboard focus indicator for dark panels (the error screen). Light screens use FOCUS_LIGHT from ui/tokens. */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070a1a]';

interface ExperienceShellProps {
  eyebrow: string;
  title: string;
  backLabel: string;
  onBack: () => void;
  children: React.ReactNode;
}

/**
 * Common frame for the concert-experience selection screen: back navigation,
 * a persistent "simulated demo" label, and focus moved to the page heading
 * on mount so screen-reader and keyboard users land on the new view.
 */
export const ExperienceShell: React.FC<ExperienceShellProps> = ({
  eyebrow,
  title,
  backLabel,
  onBack,
  children,
}) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reducedMotion = useReducedMotionPreference();

  useEffect(() => {
    headingRef.current?.focus();
  }, [title]);

  return (
    <div className="min-h-screen bg-tv-canvas text-tv-navy flex flex-col overflow-x-hidden selection:bg-tv-accent/30">
      <header className="sticky top-0 z-50 border-b border-tv-line bg-tv-canvas/90 backdrop-blur-xl">
        <div className={`${CONTAINER} flex h-16 items-center justify-between gap-3`}>
          <button onClick={onBack} className={buttonClass('ghost')}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{backLabel}</span>
          </button>
          <span className="flex items-center gap-1.5 rounded-full border border-tv-line bg-tv-paper px-3 py-1 text-xs font-semibold text-tv-navy">
            <FlaskConical className="w-3.5 h-3.5 text-tv-accent-ink" aria-hidden="true" />
            Simulated demo
          </span>
        </div>
      </header>

      <motion.main
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.base, ease: MOTION.ease }}
        className={`${CONTAINER} flex-1 py-12 sm:py-16`}
      >
        <div className="mb-10 space-y-3 sm:mb-12">
          <p className={EYEBROW}>{eyebrow}</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-4xl sm:text-6xl font-semibold tracking-[-0.04em] text-balance focus:outline-none"
          >
            {title}
          </h1>
        </div>
        {children}
      </motion.main>
    </div>
  );
};

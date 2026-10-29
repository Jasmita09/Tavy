import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

/** Shared keyboard focus indicator for the dark experience screens. */
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
 * Common frame for every concert-experience screen: back navigation,
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
    <div className="min-h-screen bg-[#070a1a] text-white flex flex-col relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Midnight stage lighting: violet and electric-blue washes with a warm amber accent */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[640px] max-w-full h-[640px] bg-violet-600/20 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 -right-40 w-[520px] max-w-full h-[520px] bg-sky-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 w-[420px] max-w-full h-[420px] bg-amber-500/[0.07] rounded-full blur-[150px]" />
      </div>

      <header className="w-full bg-[#0b1024]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 sticky top-0 z-50 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs sm:text-sm font-medium text-stone-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 cursor-pointer shadow-sm group ${FOCUS_RING}`}
        >
          <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
          <span>{backLabel}</span>
        </button>

        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
          Simulated demo
        </span>
      </header>

      <motion.main
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-5xl mx-auto flex-1 px-4 sm:px-8 py-10 sm:py-16"
      >
        <div className="space-y-3 mb-10 sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">{eyebrow}</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl sm:text-5xl font-bold tracking-tight focus:outline-none"
          >
            {title}
          </h1>
        </div>
        {children}
      </motion.main>
    </div>
  );
};

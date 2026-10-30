import React from 'react';
import { Pause, Play } from 'lucide-react';
import { FOCUS_LIGHT, FOCUS_ON_DARK } from '../ui/tokens';

/** Pause / resume the decorative golden motion (WCAG 2.2.2). Every instance shares the same state. */
export const MotionToggle: React.FC<{ motionOn: boolean; onToggle: () => void; tone?: 'light' | 'dark' }> = ({ motionOn, onToggle, tone = 'light' }) => (
  <button
    onClick={onToggle}
    aria-pressed={!motionOn}
    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium cursor-pointer ${
      tone === 'dark'
        ? `border-white/25 text-white hover:bg-white/10 ${FOCUS_ON_DARK}`
        : `border-tv-line bg-tv-paper/80 text-tv-navy backdrop-blur-sm hover:border-tv-accent ${FOCUS_LIGHT}`
    }`}
  >
    {motionOn ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
    <span aria-hidden="true">{motionOn ? 'Pause motion' : 'Play motion'}</span>
    <span className="sr-only">Pause background motion</span>
  </button>
);

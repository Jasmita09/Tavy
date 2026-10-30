import React from 'react';
import { Pause, Play } from 'lucide-react';
import { FOCUS_LIGHT } from '../ui/tokens';

/** Pause / resume the decorative golden motion (WCAG 2.2.2). Every instance shares the same state. */
export const MotionToggle: React.FC<{ motionOn: boolean; onToggle: () => void }> = ({ motionOn, onToggle }) => (
  <button
    onClick={onToggle}
    aria-pressed={!motionOn}
    className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-tv-line bg-tv-paper/80 px-4 text-sm font-medium text-tv-navy backdrop-blur-sm hover:border-tv-accent cursor-pointer ${FOCUS_LIGHT}`}
  >
    {motionOn ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
    <span aria-hidden="true">{motionOn ? 'Pause motion' : 'Play motion'}</span>
    <span className="sr-only">Pause background motion</span>
  </button>
);

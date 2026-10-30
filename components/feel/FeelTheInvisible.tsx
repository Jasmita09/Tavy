import React, { useEffect, useId, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { MotionToggle } from '../golden/MotionToggle';

/**
 * Feel the Invisible: four ways music can be shown as light. A visual demonstration in CSS and SVG
 * (no WebGL, no audio, no music analysis). Every state is chosen with real buttons; the optional demo
 * steps through them on a fixed, simulated timer. Animations are slow (≥ 1.6 s) and never flash.
 */

export type CueState = 'beat' | 'bass' | 'build' | 'drop';

const CUES: Array<{ id: CueState; word: string; description: string }> = [
  { id: 'beat', word: 'BEAT', description: 'One soft ring marks each beat.' },
  { id: 'bass', word: 'BASS', description: 'A slower, deeper pulse for low notes.' },
  { id: 'build', word: 'BUILD', description: 'Waves stack up as the energy rises.' },
  { id: 'drop', word: 'DROP', description: 'One bold accent when the music lands.' },
];

/** Simulated demo timing: one state every 3.2 s. */
const DEMO_STEP_MS = 3200;

const GOLD = 'rgb(201 160 99)';
const SOFT_GOLD = 'rgb(246 220 169)';
const BLUSH = 'rgb(235 196 192)';

/** The visual for one state. `animate` false draws the same idea as a still composition. */
const CueVisual: React.FC<{ state: CueState; animate: boolean; replay: number }> = ({ state, animate, replay }) => {
  const a = (name: string, extra = '') => (animate ? `tv-cue-${name} ${extra}` : extra);
  switch (state) {
    case 'beat':
      return (
        <>
          <span className={`absolute size-[38%] rounded-full border-2 ${a('ring')}`} style={{ borderColor: GOLD, opacity: animate ? undefined : 0.7 }} />
          <span className="absolute size-[10%] rounded-full" style={{ background: SOFT_GOLD }} />
        </>
      );
    case 'bass':
      return (
        <>
          <span className={`absolute size-[46%] rotate-45 rounded-[22%] border-2 ${a('bass')}`} style={{ borderColor: GOLD }} />
          <span className={`absolute size-[30%] rotate-45 rounded-[22%] ${a('bass', '[animation-delay:300ms]')}`} style={{ background: `${BLUSH.replace(')', ' / 0.35)')}` }} />
        </>
      );
    case 'build':
      return (
        <>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`absolute rounded-full border ${a('build')}`}
              style={{
                width: `${30 + i * 16}%`,
                height: `${30 + i * 16}%`,
                borderColor: i % 2 ? BLUSH : GOLD,
                opacity: animate ? undefined : 0.85 - i * 0.18,
                animationDelay: animate ? `${i * 450}ms` : undefined,
              }}
            />
          ))}
          <span className="absolute size-[10%] rounded-full" style={{ background: SOFT_GOLD }} />
        </>
      );
    case 'drop':
      return (
        <span
          key={replay}
          className={`absolute size-[56%] rounded-full ${a('drop')}`}
          style={{ background: `radial-gradient(circle, ${SOFT_GOLD} 0%, ${GOLD} 38%, ${BLUSH.replace(')', ' / 0.5)')} 62%, transparent 72%)` }}
        />
      );
  }
};

interface FeelTheInvisibleProps {
  reduced: boolean;
  motionOn: boolean;
  onToggleMotion: () => void;
}

export const FeelTheInvisible: React.FC<FeelTheInvisibleProps> = ({ reduced, motionOn, onToggleMotion }) => {
  const [state, setState] = useState<CueState>('beat');
  const [demo, setDemo] = useState(false);
  const [replay, setReplay] = useState(0);
  const [announce, setAnnounce] = useState('');
  const titleId = useId();
  const noteId = useId();
  const cue = CUES.find((c) => c.id === state)!;
  const animate = !reduced && motionOn;

  // Demo: step through the states on a simulated timer; pausing motion pauses the demo too.
  useEffect(() => {
    if (!demo || !motionOn) return;
    const id = window.setInterval(() => {
      setState((s) => CUES[(CUES.findIndex((c) => c.id === s) + 1) % CUES.length].id);
      setReplay((r) => r + 1);
    }, DEMO_STEP_MS);
    return () => window.clearInterval(id);
  }, [demo, motionOn]);

  const choose = (next: CueState) => {
    setDemo(false);
    setState(next);
    setReplay((r) => r + 1);
    const c = CUES.find((x) => x.id === next)!;
    setAnnounce(`${c.word}: ${c.description}`);
  };

  return (
    <figure aria-labelledby={titleId} className="m-0 overflow-hidden rounded-tv-xl bg-tv-navy text-white">
      <div className="flex items-baseline justify-between gap-3 px-6 pt-6 sm:px-8 sm:pt-7">
        <h3 id={titleId} className="font-serif italic text-2xl text-white">
          Feel the invisible
        </h3>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Visual demo</span>
      </div>

      {/* The visual: decorative, described by the text below it */}
      <div aria-hidden="true" className={`relative mx-auto flex aspect-square max-w-[19rem] items-center justify-center ${motionOn ? '' : 'tv-cue-paused'}`}>
        <CueVisual state={state} animate={animate} replay={replay} />
        <span className="relative text-4xl sm:text-5xl font-black tracking-[0.08em] text-white">{cue.word}</span>
      </div>

      <div className="space-y-4 px-6 pb-6 sm:px-8 sm:pb-7">
        <p className="min-h-6 text-center text-sm text-white/85">{cue.description}</p>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        <div role="group" aria-label="Choose a visual cue" aria-describedby={noteId} className="grid grid-cols-4 gap-1.5 rounded-full bg-white/10 p-1">
          {CUES.map((c) => (
            <button
              key={c.id}
              aria-pressed={state === c.id}
              onClick={() => choose(c.id)}
              className={`min-h-11 rounded-full text-xs sm:text-sm font-semibold tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-tv-navy ${
                state === c.id ? 'bg-white text-tv-navy' : 'text-white/85 hover:bg-white/10'
              }`}
            >
              {c.word}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setDemo((d) => !d)}
            aria-pressed={demo}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-4 text-sm font-medium text-white hover:bg-white/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-tv-navy"
          >
            {demo ? <Square className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
            {demo ? 'Stop demo' : 'Play demo'}
          </button>
          {!reduced && (
            <MotionToggle motionOn={motionOn} onToggle={onToggleMotion} tone="dark" />
          )}
        </div>
        <p id={noteId} className="text-xs leading-relaxed text-white/70">
          A visual demonstration with simulated timing, not real-time music analysis. In Live Concert, cues follow a scripted
          show.
        </p>
      </div>
    </figure>
  );
};

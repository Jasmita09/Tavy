import React, { useEffect, useId, useRef, useState } from 'react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { useSound } from '../audio/useSound';

/**
 * The two concert worlds shown on the experience cards: hand-built SVG illustrations in one shared style
 * (warm espresso dusk, champagne gold, blush), layered for a little depth. No photos, no WebGL.
 *
 * Motion is small and finite: lights sweep and lightsticks sway for ~5 s when a card comes into view, and
 * while the pointer rests on it (WCAG 2.2.2), then hold still. Reduced motion draws the same scene still.
 * Stage lights and screens brighten with the Golden Gate's light (--gate-light, 1 when not on the landing).
 */

const C = {
  espresso: '#2b211d',
  espressoSoft: '#3d2f2a',
  umber: '#5a4038',
  mauve: '#6e534b',
  gold: '#c9a063',
  goldLight: '#f2d9a6',
  blush: '#ebc4c0',
  blushDeep: '#d9a6a2',
  ivory: '#fbf7ef',
  cream: '#f3e9d8',
};

/** The worlds' palette, shared with the story illustrations (components/story). */
export const WORLD_COLORS = C;

/** Light level that follows the Golden Gate: from a dim stage to full light. */
const lit = (min: number) => `calc(${min} + ${1 - min} * var(--gate-light, 1))`;

/** Parallax layer: shifts with the pointer by `depth` px. */
const layer = (depth: number): React.CSSProperties => ({
  transform: `translate(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth * 0.6}px))`,
  transition: 'transform 700ms cubic-bezier(0.2, 0.7, 0.2, 1)',
});

/** Timing for one swaying element (the pivot point is set by its CSS class). */
const timing = (delay: number, duration: number): React.CSSProperties => ({ animationDelay: `${delay}ms`, animationDuration: `${duration}ms` });

/** Deterministic crowd so both renders (and every visit) look the same. */
const crowd = (count: number, y: number, seed: number) =>
  Array.from({ length: count }, (_, i) => {
    const r = Math.sin((i + 1) * 12.9898 + seed) * 43758.5453;
    const j = r - Math.floor(r);
    return { x: 8 + (i * 464) / (count - 1) + (j - 0.5) * 14, y: y + (j - 0.5) * 8, s: 0.85 + j * 0.3, stick: i % 2 === (seed % 2) || j > 0.7, gold: j > 0.45 };
  });

const ROWS = [crowd(15, 262, 1), crowd(13, 286, 2)];

/** Shared frame: play-for-a-moment policy, pointer parallax, reduced motion. */
const WorldFrame: React.FC<{ label: string; kind: 'live' | 'home'; children: (ids: (name: string) => string) => React.ReactNode }> = ({ label, kind, children }) => {
  const reduced = useReducedMotionPreference();
  // While this mode's sound Preview plays, the world performs along with it
  const previewing = useSound().preview === kind && !reduced;
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const hovering = useRef(false);
  const stopTimer = useRef<number | undefined>(undefined);
  const uid = useId().replace(/:/g, '');
  const ids = (name: string) => `${uid}-${name}`;

  const playFor = (ms: number) => {
    if (reduced) return;
    setPlaying(true);
    window.clearTimeout(stopTimer.current);
    stopTimer.current = window.setTimeout(() => !hovering.current && setPlaying(false), ms);
  };

  // A short performance whenever the card comes into view.
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && playFor(5000), { threshold: 0.5 });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(stopTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    e.currentTarget.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-world
      data-playing={playing || previewing || undefined}
      className={`tv-world h-full w-full ${reduced ? 'tv-world-still' : ''}`}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return;
        hovering.current = true;
        playFor(5000);
      }}
      onPointerLeave={(e) => {
        hovering.current = false;
        e.currentTarget.style.setProperty('--px', '0');
        e.currentTarget.style.setProperty('--py', '0');
        playFor(0);
      }}
      onPointerMove={onMove}
    >
      <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true">
        {children(ids)}
      </svg>
    </div>
  );
};

/** Gradients both scenes share. */
const SharedDefs: React.FC<{ ids: (n: string) => string }> = ({ ids }) => (
  <>
    <linearGradient id={ids('dusk')} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.espresso} />
      <stop offset="0.7" stopColor={C.espressoSoft} />
      <stop offset="1" stopColor={C.umber} />
    </linearGradient>
    <radialGradient id={ids('glow')} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={C.goldLight} stopOpacity="0.75" />
      <stop offset="0.45" stopColor={C.blush} stopOpacity="0.28" />
      <stop offset="1" stopColor={C.blush} stopOpacity="0" />
    </radialGradient>
    <linearGradient id={ids('beam')} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.goldLight} stopOpacity="0.75" />
      <stop offset="1" stopColor={C.goldLight} stopOpacity="0" />
    </linearGradient>
    <linearGradient id={ids('screen')} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={C.blush} />
      <stop offset="1" stopColor={C.gold} />
    </linearGradient>
    <linearGradient id={ids('floor')} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.goldLight} stopOpacity="0.7" />
      <stop offset="1" stopColor={C.gold} stopOpacity="0.15" />
    </linearGradient>
    <radialGradient id={ids('tip')} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={C.ivory} stopOpacity="0.9" />
      <stop offset="1" stopColor={C.goldLight} stopOpacity="0" />
    </radialGradient>
  </>
);

/** The stage motif, drawn full size in Live and miniature on the At-home screen. */
const Stage: React.FC<{ ids: (n: string) => string; beams: boolean }> = ({ ids, beams }) => (
  <>
    <ellipse cx="240" cy="118" rx="190" ry="120" fill={`url(#${ids('glow')})`} style={{ opacity: lit(0.35) }} />
    {/* Proscenium */}
    <path d="M72 196 V64 Q72 40 96 40 H384 Q408 40 408 64 V196" fill="none" stroke={C.gold} strokeWidth="2" strokeOpacity="0.75" />
    {/* Screens: abstract light, no artwork */}
    <g style={{ opacity: lit(0.45) }}>
      <rect x="178" y="56" width="124" height="72" rx="8" fill={`url(#${ids('screen')})`} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={192 + i * 14} y={104 - [14, 26, 38, 30, 44, 24, 16][i]} width="6" height={[14, 26, 38, 30, 44, 24, 16][i]} rx="3" fill={C.ivory} opacity="0.6" />
      ))}
      <rect x="92" y="70" width="66" height="48" rx="6" fill={`url(#${ids('screen')})`} opacity="0.7" />
      <rect x="322" y="70" width="66" height="48" rx="6" fill={`url(#${ids('screen')})`} opacity="0.7" />
      <circle cx="125" cy="94" r="12" fill="none" stroke={C.ivory} strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="355" cy="94" r="12" fill="none" stroke={C.ivory} strokeOpacity="0.55" strokeWidth="1.5" />
    </g>
    {beams && (
      <g style={{ opacity: lit(0.1) }}>
        {[
          [130, 40, 0, 6200],
          [240, 34, 900, 7000],
          [350, 40, 400, 6600],
        ].map(([x, y, d, t]) => (
          <g key={x} className="tv-anim tv-world-sweep" style={timing(d, t)}>
            <path d={`M${x - 4} ${y} L${x + 4} ${y} L${x + 52} 200 L${x - 52} 200 Z`} fill={`url(#${ids('beam')})`} opacity="0.55" />
          </g>
        ))}
      </g>
    )}
    {/* Stage floor */}
    <ellipse cx="240" cy="198" rx="168" ry="14" fill={`url(#${ids('floor')})`} />
    {/* Performers: small, faceless silhouettes */}
    {[
      [212, 0.9],
      [240, 1.05],
      [268, 0.9],
    ].map(([x, s]) => (
      <g key={x} transform={`translate(${x} 194) scale(${s})`}>
        <path d="M-7 0 Q-8 -16 -5 -21 Q0 -24 5 -21 Q8 -16 7 0 Z" fill={C.espresso} stroke={C.goldLight} strokeOpacity="0.6" strokeWidth="0.8" />
        <circle cx="0" cy="-27" r="5" fill={C.espresso} stroke={C.goldLight} strokeOpacity="0.6" strokeWidth="0.8" />
      </g>
    ))}
  </>
);

/** A raised lightstick: a slow sway from its base. */
const Lightstick: React.FC<{ x: number; y: number; gold: boolean; delay: number; ids: (n: string) => string; length?: number }> = ({
  x,
  y,
  gold,
  delay,
  ids,
  length = 24,
}) => (
  <g className="tv-anim tv-world-sway" style={timing(delay, 3600 + (delay % 1400))}>
    <line x1={x} y1={y} x2={x + 3} y2={y - length} stroke={C.cream} strokeWidth="2" strokeLinecap="round" />
    <circle cx={x + 3} cy={y - length} r="9" fill={`url(#${ids('tip')})`} style={{ opacity: lit(0.4) }} />
    <circle cx={x + 3} cy={y - length} r="4" fill={gold ? C.goldLight : C.blush} />
  </g>
);

export const LiveWorld: React.FC = () => (
  <WorldFrame kind="live" label="Illustration: a concert stage with screens and spotlights, and a crowd raising glowing lightsticks">
    {(ids) => (
      <>
        <defs>
          <SharedDefs ids={ids} />
        </defs>
        <rect width="480" height="300" fill={`url(#${ids('dusk')})`} />
        <g style={layer(4)}>
          <Stage ids={ids} beams />
        </g>
        {/* Warm haze between stage and crowd */}
        <rect x="0" y="196" width="480" height="50" fill={C.blush} opacity="0.12" />
        {/* Crowd: back row lighter for depth, front row darker */}
        {ROWS.map((row, r) => (
          <g key={r} style={layer(r === 0 ? 8 : 12)}>
            {row.map((p, i) => (
              <g key={i}>
                {p.stick && <Lightstick x={p.x + 6} y={p.y - 6} gold={p.gold} delay={(i * 370 + r * 200) % 2400} ids={ids} />}
                <g transform={`translate(${p.x} ${p.y}) scale(${p.s})`} fill={r === 0 ? C.mauve : C.espressoSoft}>
                  <circle cx="0" cy="-14" r="9" />
                  <path d="M-17 30 Q-17 -2 0 -3 Q17 -2 17 30 Z" />
                </g>
              </g>
            ))}
          </g>
        ))}
      </>
    )}
  </WorldFrame>
);

export const HomeWorld: React.FC = () => (
  <WorldFrame kind="home" label="Illustration: a cosy room in the evening, a concert playing on the screen, a fan on the sofa with a lightstick">
    {(ids) => (
      <>
        <defs>
          <SharedDefs ids={ids} />
          <clipPath id={ids('tv')}>
            <rect x="186" y="66" width="156" height="88" rx="4" />
          </clipPath>
          <linearGradient id={ids('lamp')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.goldLight} stopOpacity="0.45" />
            <stop offset="1" stopColor={C.goldLight} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="480" height="300" fill={`url(#${ids('dusk')})`} />

        {/* Back wall: the concert's light spilling out, and the Golden Gate echoed as arches */}
        <g style={layer(4)}>
          <ellipse cx="264" cy="112" rx="200" ry="130" fill={`url(#${ids('glow')})`} className="tv-anim tv-world-breathe" style={{ opacity: lit(0.25), animationDuration: '5200ms' }} />
          <g fill="none" stroke={C.gold} style={{ opacity: lit(0.15) }}>
            <path d="M150 176 V96 A114 74 0 0 1 378 96 V176" strokeOpacity="0.45" strokeWidth="1.5" />
            <path d="M128 176 V92 A136 90 0 0 1 400 92 V176" strokeOpacity="0.22" strokeWidth="1" />
          </g>
          {/* Shelf with album-like objects (no artwork) */}
          <g transform="translate(0 22)">
          <line x1="34" y1="104" x2="138" y2="104" stroke={C.gold} strokeOpacity="0.6" strokeWidth="1.5" />
          <rect x="42" y="76" width="26" height="28" rx="2" fill={`url(#${ids('screen')})`} opacity="0.85" />
          <rect x="72" y="72" width="30" height="32" rx="2" fill={C.cream} opacity="0.85" />
          <circle cx="87" cy="88" r="9" fill="none" stroke={C.gold} strokeWidth="1.5" />
          <g transform="translate(108 80)">
            <rect width="24" height="24" rx="2" fill={C.espresso} stroke={C.gold} strokeOpacity="0.6" />
            <circle cx="12" cy="12" r="8" fill="none" stroke={C.blush} strokeOpacity="0.8" />
            <circle cx="12" cy="12" r="2" fill={C.goldLight} />
          </g>
          </g>
        </g>

        {/* Screen with the same stage, miniature */}
        <g style={layer(7)}>
          <rect x="180" y="60" width="168" height="100" rx="7" fill="#1d1613" />
          <g clipPath={`url(#${ids('tv')})`}>
            <rect x="186" y="66" width="156" height="88" fill={`url(#${ids('dusk')})`} />
            <g transform="translate(186 66) scale(0.325 0.36)">
              <Stage ids={ids} beams />
            </g>
            <g style={{ opacity: lit(0.4) }}>
              {Array.from({ length: 14 }, (_, i) => (
                <circle key={i} cx={192 + i * 11} cy={148 - (i % 2) * 3} r="1.6" fill={i % 3 ? C.goldLight : C.blush} />
              ))}
            </g>
          </g>
          <rect x="164" y="160" width="200" height="14" rx="3" fill={C.espresso} />
          <line x1="168" y1="160.5" x2="360" y2="160.5" stroke={C.gold} strokeOpacity="0.6" />
        </g>

        {/* Floor lamp */}
        <g style={layer(9)}>
          <path d="M424 112 L404 250 L476 250 L444 112 Z" fill={`url(#${ids('lamp')})`} className="tv-anim tv-world-breathe" style={{ animationDuration: '6400ms' }} />
          <line x1="434" y1="112" x2="434" y2="262" stroke={C.cream} strokeOpacity="0.7" strokeWidth="2" />
          <path d="M414 92 H454 L446 112 H422 Z" fill={C.blush} />
        </g>

        {/* Floor reflection of the screen */}
        <ellipse cx="264" cy="232" rx="150" ry="16" fill={C.goldLight} className="tv-anim tv-world-breathe" style={{ opacity: `calc(0.12 * var(--gate-light, 1))`, animationDuration: '5200ms' }} />

        {/* Foreground: sofa, a fan seen from behind, a lightstick on the table */}
        <g style={layer(13)}>
          {/* Sofa: back, cushions, arm, and the screen's glow along its top edge */}
          <path d="M30 300 V232 Q30 214 50 214 H330 Q350 214 350 232 V300 Z" fill={C.mauve} />
          <path d="M48 215 H332" stroke={C.blush} strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: lit(0.3) }} />
          <path d="M140 222 V250 M240 222 V250" stroke={C.espressoSoft} strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="30" y="250" width="320" height="50" fill={C.espressoSoft} opacity="0.55" />
          <rect x="14" y="238" width="34" height="62" rx="14" fill={C.umber} />
          <path d="M20 240 Q31 234 42 240" stroke={C.blush} strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
          <g fill={C.espresso}>
            <circle cx="232" cy="196" r="15" />
            <path d="M204 248 Q204 214 232 212 Q260 214 260 248 Z" />
          </g>
          <Lightstick x={262} y={222} gold delay={600} ids={ids} length={30} />
          <path d="M370 262 H462 L452 274 H380 Z" fill={C.espressoSoft} />
          <g transform="rotate(-12 404 256)">
            <line x1="388" y1="258" x2="414" y2="258" stroke={C.cream} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="419" cy="258" r="9" fill={`url(#${ids('tip')})`} style={{ opacity: lit(0.4) }} />
            <circle cx="419" cy="258" r="4" fill={C.blush} />
          </g>
          <rect x="430" y="248" width="16" height="14" rx="1.5" fill={C.cream} opacity="0.9" />
        </g>
      </>
    )}
  </WorldFrame>
);

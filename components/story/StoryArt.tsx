import React, { useId } from 'react';
import { HomeWorld, WORLD_COLORS as C } from '../worlds/ConcertWorlds';

/*
 * The story's illustrations: hand-drawn SVG in the Concert Worlds style (espresso dusk, champagne gold,
 * blush), 480×300 like the world cards. The fan is a small figure seen from behind: no face, no likeness,
 * no artist imagery. Motion is CSS only (story.css), so the player can pause it and reduced motion stills it.
 */

const STORM = { top: '#2c2a38', bottom: '#5b4d5c' };

/** Deterministic rain, so every visit draws the same window. */
const RAIN = Array.from({ length: 30 }, (_, i) => {
  const r = Math.sin((i + 1) * 78.233) * 43758.5453;
  const j = r - Math.floor(r);
  return { x: 300 + ((i * 151) % 150), y: 30 + j * 170, len: 8 + j * 8 };
});

/** A small figure from behind, sitting with her knees up, holding a lightstick. */
const SittingFan: React.FC<{ glow: boolean; tip: string }> = ({ glow, tip }) => (
  <g>
    {/* Hair, with a soft bun, and shoulders */}
    <circle cx="352" cy="140" r="14" fill={C.espresso} />
    <circle cx="361" cy="125" r="6.5" fill={C.espresso} />
    <path d="M330 202 Q328 164 352 156 Q376 164 374 202 Z" fill={C.espresso} />
    {/* Knees up, towards the window */}
    <path d="M366 202 Q380 170 402 182 Q406 194 398 204 Z" fill={C.umber} />
    {/* Lightstick resting across her knees */}
    <line x1="372" y1="180" x2="396" y2="164" stroke={C.cream} strokeWidth="3" strokeLinecap="round" />
    {glow && <circle cx="401" cy="160" r="16" fill={`url(#${tip})`} className="tvs-anim tvs-fade-slow" />}
    <circle cx="401" cy="160" r="5" fill={glow ? C.goldLight : C.cream} opacity={glow ? 1 : 0.55} />
  </g>
);

/** Her room at dusk. `invite` adds the golden ribbon and the warmth it brings (scene 2). */
const Room: React.FC<{ invite?: boolean }> = ({ invite = false }) => {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${uid}-${n}`;
  return (
    <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.espresso} />
          <stop offset="1" stopColor={C.espressoSoft} />
        </linearGradient>
        <linearGradient id={id('storm')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={STORM.top} />
          <stop offset="1" stopColor={STORM.bottom} />
        </linearGradient>
        <clipPath id={id('window')}>
          <rect x="296" y="30" width="156" height="166" rx="4" />
        </clipPath>
        <radialGradient id={id('lamp')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.goldLight} stopOpacity="0.35" />
          <stop offset="1" stopColor={C.goldLight} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('warm')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.goldLight} stopOpacity="0.55" />
          <stop offset="0.5" stopColor={C.blush} stopOpacity="0.2" />
          <stop offset="1" stopColor={C.blush} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('tip')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.ivory} stopOpacity="0.95" />
          <stop offset="1" stopColor={C.goldLight} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('ribbon')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.goldLight} />
          <stop offset="0.5" stopColor={C.gold} />
          <stop offset="1" stopColor={C.goldLight} />
        </linearGradient>
      </defs>

      <rect width="480" height="300" fill={`url(#${id('wall')})`} />

      {/* A small lamp's pool of light, top left */}
      <ellipse cx="70" cy="70" rx="120" ry="90" fill={`url(#${id('lamp')})`} />

      {/* Wall: a concert poster (abstract, no artwork), a calendar with the date circled, a ticket */}
      <g>
        <rect x="52" y="58" width="78" height="104" rx="3" fill={C.espressoSoft} stroke={C.gold} strokeOpacity="0.55" />
        <circle cx="91" cy="96" r="20" fill="none" stroke={C.gold} strokeWidth="2" />
        <circle cx="91" cy="96" r="6" fill={C.blush} />
        <rect x="66" y="128" width="50" height="4" rx="2" fill={C.goldLight} opacity="0.8" />
        <rect x="74" y="138" width="34" height="3" rx="1.5" fill={C.cream} opacity="0.45" />

        <rect x="150" y="70" width="74" height="66" rx="3" fill={C.cream} opacity="0.92" />
        <rect x="150" y="70" width="74" height="12" rx="3" fill={C.blushDeep} />
        {Array.from({ length: 20 }, (_, i) => (
          <rect key={i} x={156 + (i % 5) * 13.4} y={88 + Math.floor(i / 5) * 11.5} width="8" height="7" rx="1" fill={C.umber} opacity="0.28" />
        ))}
        <circle cx={160 + 3 * 13.4} cy={91.5 + 2 * 11.5} r="7.5" fill="none" stroke={C.blushDeep} strokeWidth="2" />

        <g transform="rotate(-8 214 168)">
          <rect x="186" y="154" width="58" height="26" rx="3" fill={C.goldLight} />
          <line x1="230" y1="156" x2="230" y2="178" stroke={C.espresso} strokeOpacity="0.4" strokeDasharray="2 2" />
          <rect x="192" y="161" width="26" height="3" rx="1.5" fill={C.espresso} opacity="0.55" />
          <rect x="192" y="169" width="18" height="3" rx="1.5" fill={C.espresso} opacity="0.35" />
        </g>
      </g>

      {/* Window: the storm outside, rain, and the faint lights of a distant city */}
      <g clipPath={`url(#${id('window')})`}>
        <rect x="296" y="30" width="156" height="166" fill={`url(#${id('storm')})`} />
        <g opacity="0.55">
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={306 + i * 17} cy={182 - (i % 3) * 4} r="1.4" fill={C.goldLight} />
          ))}
        </g>
        <g className="tvs-anim tvs-rain" stroke={C.cream} strokeOpacity="0.38" strokeWidth="1.1" strokeLinecap="round">
          {RAIN.map((d, i) => (
            <line key={i} x1={d.x} y1={d.y - 40} x2={d.x - 3} y2={d.y - 40 + d.len} />
          ))}
          {RAIN.map((d, i) => (
            <line key={`b${i}`} x1={d.x} y1={d.y + 130} x2={d.x - 3} y2={d.y + 130 + d.len} />
          ))}
        </g>
      </g>
      <rect x="296" y="30" width="156" height="166" rx="4" fill="none" stroke={C.cream} strokeOpacity="0.5" strokeWidth="3" />
      <path d="M374 30 V196 M296 110 H452" stroke={C.cream} strokeOpacity="0.4" strokeWidth="2" />

      {/* Window seat and floor */}
      <rect x="276" y="200" width="204" height="14" rx="2" fill={C.mauve} />
      <rect x="0" y="246" width="480" height="54" fill={C.umber} opacity="0.65" />

      {/* The ribbon's warmth fills the room */}
      {invite && <ellipse cx="300" cy="140" rx="230" ry="160" fill={`url(#${id('warm')})`} className="tvs-anim tvs-fade-slow" />}

      <SittingFan glow={invite} tip={id('tip')} />

      {/* The golden ribbon: in through the window, around her, and on towards the music */}
      {invite && (
        <g fill="none" strokeLinecap="round">
          <path
            pathLength={1}
            className="tvs-anim tvs-draw"
            d="M440 54 C 400 90, 330 70, 300 112 S 300 196, 352 196 S 430 150, 404 124 S 330 96, 250 120 S 150 170, 70 150"
            stroke={`url(#${id('ribbon')})`}
            strokeWidth="3.2"
          />
          <path
            pathLength={1}
            className="tvs-anim tvs-draw tvs-delay-1"
            d="M446 64 C 404 104, 336 84, 310 120 S 312 204, 360 202 S 440 152, 412 120"
            stroke={C.blush}
            strokeOpacity="0.8"
            strokeWidth="1.4"
          />
          <g fill={C.goldLight} fontSize="16" fontFamily="serif" className="tvs-anim tvs-fade tvs-delay-2">
            <text x="282" y="104" className="tvs-anim tvs-float">♪</text>
            <text x="224" y="124" className="tvs-anim tvs-float tvs-delay-1">♫</text>
            <text x="142" y="150" className="tvs-anim tvs-float tvs-delay-2">♪</text>
          </g>
        </g>
      )}
    </svg>
  );
};

/** The Golden Gate, as on the landing page, with the ribbon leading her to it. */
const Gate: React.FC = () => {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${uid}-${n}`;
  return (
    <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id={id('sky')} cx="0.5" cy="0.42" r="0.75">
          <stop offset="0" stopColor="#fdf4e3" />
          <stop offset="0.55" stopColor="#f5e6c9" />
          <stop offset="1" stopColor="#ecd9c8" />
        </radialGradient>
        <radialGradient id={id('inside')} cx="0.5" cy="0.6" r="0.5">
          <stop offset="0" stopColor="#fffaf0" stopOpacity="1" />
          <stop offset="0.6" stopColor={C.goldLight} stopOpacity="0.55" />
          <stop offset="1" stopColor={C.goldLight} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6dca9" />
          <stop offset="0.5" stopColor={C.gold} />
          <stop offset="1" stopColor="#e9cf9d" />
        </linearGradient>
      </defs>
      <rect width="480" height="300" fill={`url(#${id('sky')})`} />

      {/* Light inside the gate grows as she arrives */}
      <ellipse cx="240" cy="190" rx="120" ry="130" fill={`url(#${id('inside')})`} className="tvs-anim tvs-fade-slow" />

      {/* The arch: the same proportions and gold/blush double line as the landing page gate */}
      <g fill="none">
        <path pathLength={1} className="tvs-anim tvs-draw" d="M150 268 V140 A90 84 0 0 1 330 140 V268" stroke={`url(#${id('gold')})`} strokeWidth="4" />
        <path pathLength={1} className="tvs-anim tvs-draw tvs-delay-1" d="M162 268 V143 A78 72 0 0 1 318 143 V268" stroke={C.blush} strokeWidth="1.6" />
      </g>
      <circle cx="240" cy="40" r="4" fill={C.gold} className="tvs-anim tvs-fade tvs-delay-2" />

      {/* Notes resting on the arch */}
      <g fill={C.gold} fontSize="15" fontFamily="serif" className="tvs-anim tvs-fade tvs-delay-2">
        <text x="168" y="92">♪</text>
        <text x="232" y="66">♫</text>
        <text x="300" y="92">♩</text>
      </g>

      {/* The ribbon arriving from her room, flowing into the gate */}
      <path
        pathLength={1}
        className="tvs-anim tvs-draw"
        d="M-10 236 C 60 226, 96 262, 150 240 S 214 196, 240 214 S 270 178, 240 150"
        fill="none"
        stroke={`url(#${id('gold')})`}
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* Ground line and her small figure, from behind, walking towards the light */}
      <line x1="40" y1="268" x2="440" y2="268" stroke={C.gold} strokeOpacity="0.35" />
      <g className="tvs-anim tvs-walk">
        <ellipse cx="240" cy="270" rx="14" ry="2.5" fill={C.espresso} opacity="0.18" />
        <circle cx="240" cy="226" r="7.5" fill={C.espresso} />
        <circle cx="244" cy="218" r="3.6" fill={C.espresso} />
        <path d="M229 266 Q228 240 240 235 Q252 240 251 266 Z" fill={C.espresso} />
        <line x1="251" y1="246" x2="260" y2="232" stroke={C.cream} strokeWidth="2" strokeLinecap="round" />
        <circle cx="261.5" cy="230" r="3.2" fill={C.goldLight} />
      </g>
    </svg>
  );
};

export interface StoryScene {
  id: string;
  title: string;
  /** The line that tells the scene (always shown, and announced). */
  caption: string;
  detail: string;
  /** What the picture shows, for screen readers and the text version. */
  description: string;
  /** Where the slow camera move heads (CSS transform-origin), and how far it drifts. */
  camera: { origin: string; dx: string; dy: string };
  Art: React.FC;
}

export const STORY_ENDING = 'You were never far from the music.';

export const STORY_SCENES: StoryScene[] = [
  {
    id: 'dream',
    title: 'The Dream',
    caption: 'For three years, she has waited for this concert.',
    detail: 'Tonight, a storm has closed every road between her home and the stadium.',
    description: 'A fan sits on a window seat at dusk, seen from behind, an unlit lightstick across her knees. Rain runs down the window. On the wall: a concert poster, a calendar with tonight circled, and her ticket.',
    camera: { origin: '72% 48%', dx: '-1.5%', dy: '0%' },
    Art: () => <Room />,
  },
  {
    id: 'invitation',
    title: 'The Invitation',
    caption: 'Then a golden ribbon of music drifts into her room.',
    detail: 'It circles her gently, and the tip of her lightstick begins to glow.',
    description: 'A thin golden ribbon flows in through the window, loops around the fan and trails across the room with a few musical notes. The room turns warm, and her lightstick glows.',
    camera: { origin: '58% 52%', dx: '1.5%', dy: '-1%' },
    Art: () => <Room invite />,
  },
  {
    id: 'gate',
    title: 'The Golden Gate',
    caption: 'It leads her to a gate made of music.',
    detail: 'The same Golden Gate that opens every TΛVY concert.',
    description: 'On a warm ivory horizon, the golden ribbon flows into a tall gold-and-blush arch with notes resting on it. Light glows inside the gate, and the fan walks towards it, lightstick in hand.',
    camera: { origin: '50% 62%', dx: '0%', dy: '-1.5%' },
    Art: Gate,
  },
  {
    id: 'together',
    title: 'Together',
    caption: 'The lights, the lyrics and every beat reach her at home.',
    detail: 'Through the At-home Concert, she is part of the night.',
    description: 'In a cosy room in the evening, the concert plays on the screen, its golden light filling the room. The fan sits on the sofa, her lightstick raised with the music.',
    camera: { origin: '55% 45%', dx: '0%', dy: '0%' },
    Art: () => (
      <div aria-hidden="true" className="h-full w-full">
        <HomeWorld />
      </div>
    ),
  },
];

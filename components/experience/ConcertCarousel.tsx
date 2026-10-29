import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { FOCUS_RING } from './ExperienceShell';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

export interface ConcertMode {
  id: string;
  title: string;
  tagline: string;
  image: string;
  imageAlt: string;
  icon: React.ElementType;
  highlights: string[];
  /** Which decorative scene is layered over the card image. */
  scene: 'live' | 'home';
  onSelect: () => void;
}

interface ConcertCarouselProps {
  modes: ConcertMode[];
}

/** Drag distance (as a share of the card spacing) that commits to the next card. */
const SWIPE_COMMIT = 0.18;
/** Movement before a press counts as a drag, so taps on the Start button still work. */
const DRAG_SLOP = 8;

/** Decorative stage lighting layered over each card's photo. Static: it only brightens on hover. */
const SceneLayer: React.FC<{ scene: ConcertMode['scene'] }> = ({ scene }) =>
  scene === 'live' ? (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {[-28, 0, 28].map((angle, i) => (
        <span
          key={angle}
          className="absolute -top-10 left-1/2 h-[140%] w-24 origin-top opacity-50 transition-opacity duration-500 group-hover:opacity-80 motion-reduce:transition-none"
          style={{
            transform: `translateX(-50%) rotate(${angle}deg)`,
            background: `linear-gradient(to bottom, ${['rgba(139,92,246,0.55)', 'rgba(96,165,250,0.5)', 'rgba(139,92,246,0.55)'][i]}, transparent 70%)`,
            filter: 'blur(6px)',
          }}
        />
      ))}
      {/* Crowd lightsticks along the bottom */}
      <div className="absolute inset-x-6 bottom-5 flex justify-between">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]" style={{ opacity: 0.45 + (i % 3) * 0.2 }} />
        ))}
      </div>
    </div>
  ) : (
    <div aria-hidden="true" className="absolute inset-0">
      {/* A screen glowing in a dark room, with synced lyric lines */}
      <div className="absolute inset-[12%] rounded-2xl border border-sky-300/30 shadow-[0_0_60px_-10px_rgba(96,165,250,0.6)] transition-shadow duration-500 group-hover:shadow-[0_0_80px_-6px_rgba(96,165,250,0.75)] motion-reduce:transition-none" />
      <div className="absolute inset-x-[24%] bottom-[18%] space-y-1.5">
        <span className="block h-1.5 rounded-full bg-white/70" />
        <span className="mx-auto block h-1.5 w-2/3 rounded-full bg-violet-200/50" />
      </div>
    </div>
  );

/**
 * The concert-mode chooser as a 3D carousel: the centred card sits forward, the other tilts away.
 * Drag, swipe, arrow buttons, dots and the keyboard (← →) all move it; every action is a real button.
 */
export const ConcertCarousel: React.FC<ConcertCarouselProps> = ({ modes }) => {
  const reducedMotion = useReducedMotionPreference();
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [spacing, setSpacing] = useState(320);
  const cardRef = useRef<HTMLElement>(null);
  const startRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const gesture = useRef<{ id: number; x: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const focusAfterMove = useRef(false);
  const count = modes.length;

  // Spacing follows the rendered card width, so side cards peek in on phones and sit wider on desktop.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const measure = () => setSpacing(card.offsetWidth * 0.82);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(count - 1, next));
      if (clamped === index) return;
      // If focus is inside the card that is moving away, follow the user to the new card.
      focusAfterMove.current = Boolean(document.activeElement?.closest('[data-carousel-slide]'));
      setIndex(clamped);
      setAnnouncement(`${modes[clamped].title}, ${clamped + 1} of ${count}`);
    },
    [count, index, modes],
  );

  useEffect(() => {
    if (!focusAfterMove.current) return;
    focusAfterMove.current = false;
    startRefs.current[index]?.focus();
  }, [index]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') go(index - 1);
    else if (e.key === 'ArrowRight') go(index + 1);
    else return;
    e.preventDefault();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    gesture.current = { id: e.pointerId, x: e.clientX, dragging: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    if (!g.dragging) {
      if (Math.abs(dx) < DRAG_SLOP) return;
      g.dragging = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    // Resist past the first and last card.
    const atEdge = (dx > 0 && index === 0) || (dx < 0 && index === count - 1);
    setDrag(atEdge ? dx * 0.3 : dx);
  };
  const endGesture = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.dragging) return;
    suppressClick.current = true;
    const shift = drag / spacing;
    if (shift <= -SWIPE_COMMIT) go(index + 1);
    else if (shift >= SWIPE_COMMIT) go(index - 1);
    setDrag(0);
  };
  // A drag that ends over a button must not also press it.
  const onClickCapture = (e: React.MouseEvent) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const dragging = drag !== 0;
  const spring = reducedMotion || dragging ? { duration: 0 } : { type: 'spring' as const, stiffness: 240, damping: 30, mass: 0.9 };

  return (
    <section aria-roledescription="carousel" aria-label="Concert modes" onKeyDown={onKeyDown} className="relative">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {/* Clip horizontally only, so the side cards never cause page scroll; on wider screens they fade out at the edges */}
      <div className="overflow-x-clip py-4 sm:[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div
          data-carousel-track
          className="grid select-none [&>*]:col-start-1 [&>*]:row-start-1 justify-items-center"
          style={{ perspective: 1400, touchAction: 'pan-y' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onClickCapture={onClickCapture}
        >
          {modes.map((mode, i) => {
            const offset = i - index + drag / spacing;
            const distance = Math.min(Math.abs(offset), 1.5);
            const active = i === index;
            const Icon = mode.icon;
            const descriptionId = `${mode.id}-description`;
            return (
              <motion.div
                key={mode.id}
                ref={i === 0 ? (cardRef as React.Ref<HTMLDivElement>) : undefined}
                data-carousel-slide
                role="group"
                aria-roledescription="slide"
                aria-label={`${mode.title}, ${i + 1} of ${count}`}
                aria-hidden={!active || undefined}
                initial={false}
                animate={{
                  x: offset * spacing,
                  z: -distance * 200,
                  rotateY: Math.max(-32, Math.min(32, -offset * 26)),
                  scale: 1 - distance * 0.08,
                  opacity: 1 - Math.min(distance, 1) * 0.45,
                }}
                transition={spring}
                className="relative w-[min(84vw,30rem)]"
                style={{ zIndex: active ? 2 : 1, transformStyle: 'preserve-3d' }}
              >
                {/* Off-centre cards: a tap or click brings them forward (keyboard users have the arrows and dots) */}
                {!active && (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    onClick={() => go(i)}
                    className="absolute inset-0 z-20 cursor-pointer rounded-3xl bg-transparent"
                  />
                )}
                <article
                  inert={!active}
                  className={`group relative h-full rounded-3xl overflow-hidden bg-[#11162b] border flex flex-col transition-[border-color,box-shadow,transform] duration-300 motion-reduce:transition-none ${
                    active
                      ? 'border-white/15 hover:border-violet-300/50 hover:shadow-[0_30px_80px_-30px_rgba(139,92,246,0.55)] hover:-translate-y-1 focus-within:ring-2 focus-within:ring-amber-400 focus-within:ring-offset-2 focus-within:ring-offset-[#070a1a]'
                      : 'border-white/10'
                  }`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={mode.image} alt={mode.imageAlt} draggable={false} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#11162b] via-[#11162b]/30 to-[#070a1a]/20" />
                    <SceneLayer scene={mode.scene} />
                    {/* Glass sheen that glides across on hover */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-y-4 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-0 transition-transform duration-700 group-hover:translate-x-[300%] motion-reduce:hidden"
                    />
                    <span className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-amber-300" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="p-6 sm:p-7 flex-1 flex flex-col gap-4">
                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{mode.title}</h2>
                      <p id={descriptionId} className="text-sm sm:text-base text-stone-300 font-light leading-relaxed">
                        {mode.tagline}
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm text-stone-300">
                      {mode.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      ref={(el) => {
                        startRefs.current[i] = el;
                      }}
                      onClick={mode.onSelect}
                      aria-describedby={descriptionId}
                      className="mt-auto self-start inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-400 px-5 text-sm font-bold uppercase tracking-wider text-stone-950 hover:bg-amber-300 transition-colors cursor-pointer focus:outline-none"
                    >
                      Start {mode.title}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous concert mode"
          className={`inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-100 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer ${FOCUS_RING}`}
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-1" role="group" aria-label="Choose a concert mode">
          {modes.map((mode, i) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${mode.title}`}
              aria-current={i === index ? 'true' : undefined}
              className={`group inline-flex size-11 items-center justify-center rounded-full cursor-pointer ${FOCUS_RING}`}
            >
              <span
                aria-hidden="true"
                className={`block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${i === index ? 'w-7 bg-amber-300' : 'w-2 bg-white/35 group-hover:bg-white/60'}`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === count - 1}
          aria-label="Next concert mode"
          className={`inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-100 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer ${FOCUS_RING}`}
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-stone-400">Swipe, drag, or use the arrow keys to switch modes.</p>
    </section>
  );
};

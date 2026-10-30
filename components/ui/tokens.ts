/**
 * Shared design tokens for the bright TΛVY site. Colours, radii and shadows are CSS variables
 * (index.css) exposed as Tailwind classes (index.html); this file holds the class recipes and motion
 * values that components share, so no screen hard-codes its own.
 */

/** Keyboard focus indicator on light surfaces. */
export const FOCUS_LIGHT =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tv-accent-ink focus-visible:ring-offset-2 focus-visible:ring-offset-tv-canvas';

/** Keyboard focus indicator on dark photography or dark panels. */
export const FOCUS_ON_DARK =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-tv-navy';

/** Motion durations (seconds) and easing, shared by every reveal and transition. */
export const MOTION = {
  fast: 0.2,
  base: 0.45,
  slow: 0.7,
  ease: [0.22, 0.7, 0.2, 1] as [number, number, number, number],
};

/** Section rhythm: page gutter and vertical spacing. */
export const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-8';
export const SECTION_Y = 'py-20 sm:py-28';

/** Surfaces. */
export const CARD = 'rounded-tv-lg border border-tv-line bg-tv-paper shadow-tv-soft';
export const EYEBROW = 'text-xs font-semibold uppercase tracking-[0.22em] text-tv-accent-ink';

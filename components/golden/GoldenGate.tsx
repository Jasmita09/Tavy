import React from 'react';

/**
 * The Golden Gate's DOM side, behind the concert carousel: a warm light that brightens as the 3D gate
 * forms (driven by the --gate-light CSS variable, 0–1), and a static drawn arch for when WebGL is
 * unavailable. Decorative only; the carousel above it keeps every control.
 */
export const GoldenGateBackdrop: React.FC<{ drawArch: boolean }> = ({ drawArch }) => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-16 bottom-16">
    <div
      className="absolute left-1/2 top-1/2 h-[120%] w-[min(140vw,64rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgb(246_220_169/0.75),rgb(235_196_192/0.25)_45%,rgb(251_247_239/0)_70%)] transition-opacity duration-500 motion-reduce:transition-none"
      style={{ opacity: 'var(--gate-light, 1)' }}
    />
    {drawArch && (
      <svg
        viewBox="0 0 100 130"
        preserveAspectRatio="none"
        className="absolute left-1/2 top-0 h-full w-[min(96vw,37rem)] -translate-x-1/2"
      >
        <defs>
          <linearGradient id="gate-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6dca9" />
            <stop offset="0.5" stopColor="#c9a063" />
            <stop offset="1" stopColor="#e9cf9d" />
          </linearGradient>
        </defs>
        <path d="M4,128 V46 A46,42 0 0 1 96,46 V128" fill="none" stroke="url(#gate-gold)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <path d="M9,128 V48 A41,37 0 0 1 91,48 V128" fill="none" stroke="#ebc4c0" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <circle cx="50" cy="4" r="1.6" fill="#c9a063" />
      </svg>
    )}
  </div>
);

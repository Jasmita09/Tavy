import React, { useEffect, useState } from 'react';
import { layoutBox } from './useScrollProgress';

/*
 * Halo assembly on the landing page, driven by the --halo-p CSS variable (0–1) on the Halo section:
 *   0.00–0.55  golden waves draw in from the top of the section and converge on the viewer
 *   0.38–0.72  a gold outline traces the Halo's silhouette
 *   0.55–0.88  the existing 3D model fades in over it (CSS in index.css), and the outline fades away
 * Purely visual: the viewer's controls work at any point, and touching or focusing it shows the model at once.
 */

const range = (a: number, b: number) => `clamp(0, calc((var(--halo-p, 1) - ${a}) / ${b - a}), 1)`;

interface Point {
  x: number;
  y: number;
}

/** Golden waves from the top of the Halo section to the viewer's silhouette. */
export const GoldenWaves: React.FC<{
  sectionRef: React.RefObject<HTMLElement | null>;
  stageRef: React.RefObject<HTMLElement | null>;
}> = ({ sectionRef, stageRef }) => {
  const [geo, setGeo] = useState<{ w: number; h: number; c: Point; top: number; sw: number; stacked: boolean } | null>(null);

  // Re-measure on layout changes only (not on scroll).
  useEffect(() => {
    const measure = () => {
      const stage = stageRef.current?.querySelector<HTMLElement>('[aria-label="Halo concept model, 3D view"]') ?? stageRef.current;
      if (!sectionRef.current || !stage) return;
      const s = layoutBox(sectionRef.current);
      const v = layoutBox(stage);
      setGeo({ w: s.width, h: s.height, c: { x: v.left - s.left + v.width / 2, y: v.top - s.top + v.height / 2 }, top: v.top - s.top, sw: v.width, stacked: v.left - s.left < s.width * 0.25 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (sectionRef.current) ro.observe(sectionRef.current);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [sectionRef, stageRef]);

  if (!geo) return null;
  const { w, h, c, top, sw, stacked } = geo;
  // Three silk strands flow into the top of the viewer: from the top of the section beside the text on
  // wide layouts, or only through the gap above the viewer when the text sits on top, so they never cross words.
  const y0 = stacked ? Math.max(0, top - 44) : 0;
  const strands = [
    { from: { x: Math.max(16, c.x - w * 0.3), y: y0 }, to: { x: c.x - sw * 0.22, y: top + 2 }, color: 'url(#tv-wave-gold)', width: 2 },
    { from: { x: c.x + w * 0.06, y: y0 }, to: { x: c.x, y: top + 2 }, color: 'url(#tv-wave-blush)', width: 1.4 },
    { from: { x: Math.min(w - 16, c.x + w * 0.3), y: y0 }, to: { x: c.x + sw * 0.22, y: top + 2 }, color: 'url(#tv-wave-gold)', width: 2 },
  ];
  const draw = range(0, 0.55);

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="tv-wave-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9a063" stopOpacity="0" />
          <stop offset="0.35" stopColor="#c9a063" stopOpacity="0.55" />
          <stop offset="1" stopColor="#d9b77e" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="tv-wave-blush" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ebc4c0" stopOpacity="0" />
          <stop offset="1" stopColor="#ebc4c0" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {strands.map((s, i) => {
        // Vertical tangents at both ends: a soft S between the entry point and the viewer
        const dy = s.to.y - s.from.y;
        const d = `M ${s.from.x} ${s.from.y} C ${s.from.x} ${s.from.y + dy * 0.55}, ${s.to.x} ${s.to.y - dy * 0.55}, ${s.to.x} ${s.to.y}`;
        return (
          <path
            key={i}
            d={d}
            pathLength={1}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeDasharray="1 1"
            style={{ strokeDashoffset: `calc(1 - ${draw})`, opacity: `calc(1 - 0.6 * ${range(0.85, 1)})` }}
          />
        );
      })}
    </svg>
  );
};

/** Gold outline of the Halo silhouette over the viewer stage; it traces in, then gives way to the model. */
export const HaloSilhouette: React.FC = () => {
  const trace = range(0.38, 0.72);
  const fade = `calc(${range(0.38, 0.48)} * (1 - ${range(0.76, 0.9)}))`;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 aspect-square">
      <div
        className="absolute left-[10%] top-[22%] h-[50%] w-[82%] rounded-full bg-[radial-gradient(ellipse,rgb(246_220_169/0.55),rgb(251_247_239/0)_65%)]"
        style={{ opacity: `calc(${range(0.45, 0.7)} * (1 - 0.6 * ${range(0.85, 0.95)}))` }}
      />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ opacity: fade }}>
        {/* An open cuff seen from slightly above: two ellipses with a gap at the back */}
        {/* Traced from the viewer's initial camera: top rim with the opening at the back, front of the lower rim, sides, light window */}
        <path d="M 70 35.1 A 36 14 0 1 1 55 33.1" fill="none" stroke="#c9a063" strokeWidth="0.8" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" style={{ strokeDashoffset: `calc(1 - ${trace})` }} />
        <path d="M 15 47 L 15 58 A 36 14 0 0 0 87 58 L 87 47" fill="none" stroke="#d9b77e" strokeWidth="0.6" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" style={{ strokeDashoffset: `calc(1 - ${trace})` }} />
        <rect x="21" y="55" width="20" height="7" rx="3.5" fill="none" stroke="#ebc4c0" strokeWidth="0.6" pathLength={1} strokeDasharray="1 1" style={{ strokeDashoffset: `calc(1 - ${range(0.55, 0.72)})` }} />
      </svg>
    </div>
  );
};

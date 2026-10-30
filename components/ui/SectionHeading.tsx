import React from 'react';
import { EYEBROW } from './tokens';

interface SectionHeadingProps {
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
}

/** Eyebrow, headline and a short intro: the one heading pattern used by every section. */
export const SectionHeading: React.FC<SectionHeadingProps> = ({ id, eyebrow, title, intro, align = 'left', as: Tag = 'h2' }) => (
  <div className={`space-y-4 ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
    {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
    <Tag id={id} className="text-[2.1rem] leading-[1.08] sm:text-5xl font-semibold tracking-[-0.03em] text-tv-navy text-balance">
      {title}
    </Tag>
    {intro && <p className="text-base sm:text-lg leading-relaxed text-tv-slate text-pretty">{intro}</p>}
  </div>
);

/** The serif italic accent used for one or two words inside a headline. */
export const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-serif italic font-normal tracking-[-0.01em]">{children}</span>
);

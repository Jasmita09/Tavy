import React from 'react';
import { ArrowRight, ArrowUpRight, AudioWaveform, Bookmark, Captions, MapPin, SlidersHorizontal, Smartphone, Vibrate } from 'lucide-react';
import { buttonClass } from '../ui/Button';
import { EYEBROW, FOCUS_LIGHT } from '../ui/tokens';
import { companionTabHash, type CompanionTab } from '../companionTabs';

/** Where a tool lives. Every destination is an existing, working screen. */
export type ToolTarget =
  | { view: 'companion-app'; tab?: CompanionTab }
  | { view: 'live-venue' }
  | { view: 'at-home'; settings?: boolean };

interface Tool {
  id: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
  title: string;
  body: string;
  /** Where it opens, in plain words. */
  where: string;
  target: ToolTarget;
  href: string;
}

const TOOLS: Tool[] = [
  {
    id: 'tool-visual-beats',
    icon: AudioWaveform,
    title: 'Visual Beats',
    body: 'Watch the beat turn into light, with BASS, BUILD, CHORUS and DROP cues.',
    where: 'Live Concert',
    target: { view: 'live-venue' },
    href: '#/experience/live',
  },
  {
    id: 'tool-haptics',
    icon: Vibrate,
    title: 'Haptic Tools',
    body: 'Tune the Halo’s haptic frequency and lighting, and send a test pulse.',
    where: 'Companion App · Halo Device',
    target: { view: 'companion-app', tab: 'halo' },
    href: companionTabHash('halo'),
  },
  {
    id: 'tool-lyrics',
    icon: Captions,
    title: 'Lyrics & Captions',
    body: 'Follow the words as they’re sung, timed to the performance.',
    where: 'At-home Concert',
    target: { view: 'at-home' },
    href: '#/experience/home',
  },
  {
    id: 'tool-personalize',
    icon: SlidersHorizontal,
    title: 'Personalize',
    body: 'Reduce Motion, High Contrast, sound, haptics and lyrics, all in one panel.',
    where: 'At-home Concert · Your senses & accessibility',
    target: { view: 'at-home', settings: true },
    href: '#/experience/home',
  },
  {
    id: 'tool-venue',
    icon: MapPin,
    title: 'Venue Tools',
    body: 'Big-text messages for noisy rooms, a sound-level meter and a friend beacon.',
    where: 'Companion App · Live Venue',
    target: { view: 'companion-app', tab: 'venue' },
    href: companionTabHash('venue'),
  },
  {
    id: 'tool-safety',
    icon: Bookmark,
    title: 'Sound Safety & Saved Moments',
    body: 'Tonight’s sound exposure, and the moments you bookmarked.',
    where: 'Companion App · Safety & Log',
    target: { view: 'companion-app', tab: 'history' },
    href: companionTabHash('history'),
  },
];

/** Id of the Open Companion App link, so focus can come back to it. */
export const OPEN_COMPANION_ID = 'tool-open-companion';

interface CompanionToolsProps {
  /** `originId` is the link that was used, so returning can put focus back on it. */
  onOpen: (target: ToolTarget, originId: string) => void;
}

/** Plain clicks navigate in the app; modified clicks (new tab, new window) keep the browser's behaviour. */
const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, open: () => void) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  open();
};

/**
 * The Accessibility section's way into the real tools: each card opens the working screen it describes
 * (a Companion App tab or a concert mode). Nothing here duplicates those tools.
 */
export const CompanionTools: React.FC<CompanionToolsProps> = ({ onOpen }) => (
  <div
    aria-labelledby="companion-tools-title"
    role="region"
    className="relative mt-16 overflow-hidden rounded-tv-xl border border-tv-line bg-tv-canvas p-6 sm:mt-20 sm:p-10"
  >
    <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-tv-blush/35 blur-3xl" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full bg-tv-accent/15 blur-3xl" />

    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-xl space-y-3">
        <p className={EYEBROW}>Try the tools</p>
        <h3 id="companion-tools-title" className="text-3xl font-semibold tracking-[-0.03em] text-tv-navy sm:text-4xl">
          Explore Companion <span className="font-serif font-normal italic tracking-[-0.01em]">Tools</span>
        </h3>
        <p className="leading-relaxed text-tv-slate">
          Each feature above is a working tool. Open one to try it now. The Companion App runs on simulated Halo data, so no
          device is needed.
        </p>
      </div>
      <a
        id={OPEN_COMPANION_ID}
        href="#/app"
        onClick={(e) => handleClick(e, () => onOpen({ view: 'companion-app' }, OPEN_COMPANION_ID))}
        className={`${buttonClass('primary', 'lg')} shrink-0 self-start lg:self-auto`}
      >
        <Smartphone className="w-4 h-4" aria-hidden="true" />
        Open Companion App
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </a>
    </div>

    <ul className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TOOLS.map(({ id, icon: Icon, title, body, where, target, href }) => (
        <li key={id}>
          <a
            id={id}
            href={href}
            onClick={(e) => handleClick(e, () => onOpen(target, id))}
            className={`group flex h-full min-h-11 flex-col gap-3 rounded-tv-md border border-tv-line bg-tv-paper p-5 shadow-tv-soft transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-tv-accent/70 hover:shadow-tv-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${FOCUS_LIGHT}`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-tv-mist text-tv-accent-ink">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <ArrowUpRight className="w-4 h-4 text-tv-slate transition-colors group-hover:text-tv-accent-ink" aria-hidden="true" />
            </span>
            <span className="font-semibold text-tv-navy">{title}</span>
            <span className="text-sm leading-relaxed text-tv-slate">{body}</span>
            <span className="mt-auto pt-1 text-xs font-semibold text-tv-accent-ink">
              <span className="sr-only">Opens </span>
              {where}
            </span>
          </a>
        </li>
      ))}
    </ul>
  </div>
);

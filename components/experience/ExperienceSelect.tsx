import React from 'react';
import { ArrowRight, Home, Smartphone, Ticket } from 'lucide-react';
import { ExperienceShell, FOCUS_RING } from './ExperienceShell';

import cinematicStageImg from '../../src/assets/images/tavy_cinematic_stage_1792350376076.jpg';
import stageStreamImg from '../../src/assets/images/concert_stage_stream_1792160451262.jpg';

interface ExperienceSelectProps {
  onSelectLiveVenue: () => void;
  onSelectAtHome: () => void;
  onOpenCompanionApp: () => void;
  onBackToWebsite: () => void;
}

interface ExperienceOption {
  id: string;
  title: string;
  tagline: string;
  image: string;
  imageAlt: string;
  icon: React.ElementType;
  highlights: string[];
  onSelect: () => void;
}

export const ExperienceSelect: React.FC<ExperienceSelectProps> = ({
  onSelectLiveVenue,
  onSelectAtHome,
  onOpenCompanionApp,
  onBackToWebsite,
}) => {
  const options: ExperienceOption[] = [
    {
      id: 'live-venue',
      title: 'Live Concert',
      tagline: "You're in the arena. Turn your phone into a lightstick that follows the beat.",
      image: cinematicStageImg,
      imageAlt: 'Arena stage with warm lighting above a crowd',
      icon: Ticket,
      highlights: ['Full-screen lightstick with on/off and beat lighting', 'BASS, BUILD, CHORUS, DROP cue words and optional vibration', 'Runs on a simulated show: no venue or Halo needed'],
      onSelect: onSelectLiveVenue,
    },
    {
      id: 'at-home',
      title: 'At-home Concert',
      tagline: 'Watch a concert from home with synced lyrics, and wave or tap along with the music.',
      image: stageStreamImg,
      imageAlt: 'Concert stream showing a performer on stage',
      icon: Home,
      highlights: ['Concert video with play, pause, seek and restart', 'Lyrics timed to the video', 'Wave with the Music, scored on your timing'],
      onSelect: onSelectAtHome,
    },
  ];

  return (
    <ExperienceShell
      eyebrow="TΛVY Concert Experience"
      title="Where are you watching tonight?"
      backLabel="Back to TΛVY Website"
      onBack={onBackToWebsite}
    >
      <ul className="grid gap-6 md:grid-cols-2" aria-label="Experience modes">
        {options.map((option) => {
          const Icon = option.icon;
          const descriptionId = `${option.id}-description`;
          return (
            <li key={option.id}>
              {/* The Start button's ::after covers the card, so the whole card is clickable
                  while only the button is announced as interactive */}
              <article
                className="group relative w-full h-full rounded-3xl overflow-hidden bg-[#141520] border border-stone-800/90 hover:border-amber-500/50 transition-colors flex flex-col focus-within:ring-2 focus-within:ring-amber-400 focus-within:ring-offset-2 focus-within:ring-offset-[#090a0f]"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={option.image}
                    alt={option.imageAlt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141520] via-[#141520]/20 to-transparent" />
                  <span className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-300" aria-hidden="true" />
                  </span>
                </div>

                <div className="p-6 sm:p-7 flex-1 flex flex-col gap-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{option.title}</h2>
                    <p id={descriptionId} className="text-sm sm:text-base text-stone-300 font-light leading-relaxed">
                      {option.tagline}
                    </p>
                  </div>

                  <ul className="space-y-2 text-sm text-stone-400">
                    {option.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={option.onSelect}
                    aria-describedby={descriptionId}
                    className="mt-auto pt-2 self-start inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-300 bg-transparent border-0 p-0 cursor-pointer focus:outline-none after:content-[''] after:absolute after:inset-0"
                  >
                    Start {option.title}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform motion-reduce:transition-none" aria-hidden="true" />
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 p-5 sm:p-6 rounded-3xl bg-[#12131c] border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-stone-200">Looking for the companion app tools?</p>
          <p className="text-sm text-stone-400 font-light">
            The four companion tabs (Live Venue, Stage Stream, Halo Device, Safety &amp; Log) are still available.
          </p>
        </div>
        <button
          onClick={onOpenCompanionApp}
          className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-sm font-medium text-stone-200 transition-colors cursor-pointer ${FOCUS_RING}`}
        >
          <Smartphone className="w-4 h-4 text-amber-300" aria-hidden="true" />
          Open Companion App
        </button>
      </div>

      <p className="mt-8 text-xs text-stone-400 leading-relaxed max-w-3xl">
        This is a product demo. Halo hardware, Bluetooth connections, crowd and sound-level data, and safety
        features are simulated and do not connect to real devices or emergency services.
      </p>
    </ExperienceShell>
  );
};

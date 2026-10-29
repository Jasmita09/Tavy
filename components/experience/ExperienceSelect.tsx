import React from 'react';
import { Home, Smartphone, Sparkles, Ticket } from 'lucide-react';
import { ExperienceShell, FOCUS_RING } from './ExperienceShell';
import { ConcertCarousel, type ConcertMode } from './ConcertCarousel';

import cinematicStageImg from '../../src/assets/images/tavy_cinematic_stage_1792350376076.jpg';
import stageStreamImg from '../../src/assets/images/concert_stage_stream_1792160451262.jpg';

interface ExperienceSelectProps {
  onSelectLiveVenue: () => void;
  onSelectAtHome: () => void;
  onOpenCompanionApp: () => void;
  onBackToWebsite: () => void;
  onOpenHaloShowcase: () => void;
}

export const ExperienceSelect: React.FC<ExperienceSelectProps> = ({
  onSelectLiveVenue,
  onSelectAtHome,
  onOpenCompanionApp,
  onBackToWebsite,
  onOpenHaloShowcase,
}) => {
  // The two concert modes; each Start button navigates to the existing #/experience/live or #/experience/home.
  const modes: ConcertMode[] = [
    {
      id: 'live-venue',
      title: 'Live Concert',
      tagline: "You're in the arena. Turn your phone into a lightstick that follows the beat.",
      image: cinematicStageImg,
      imageAlt: 'Arena stage with warm lighting above a crowd',
      icon: Ticket,
      scene: 'live',
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
      scene: 'home',
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
      <ConcertCarousel modes={modes} />

      <div className="mt-10 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-violet-500/10 via-sky-500/5 to-transparent border border-violet-300/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-stone-100">Curious about the hardware?</p>
          <p className="text-sm text-stone-300 font-light">
            Explore a 3D design concept of the Halo wearable. It's a product preview, not a concert mode.
          </p>
        </div>
        <button
          onClick={onOpenHaloShowcase}
          className={`shrink-0 inline-flex min-h-11 items-center justify-center gap-2 px-5 rounded-full bg-violet-400/15 hover:bg-violet-400/25 border border-violet-300/40 text-sm font-medium text-violet-50 transition-colors cursor-pointer ${FOCUS_RING}`}
        >
          <Sparkles className="w-4 h-4 text-violet-200" aria-hidden="true" />
          Explore Halo in 3D
        </button>
      </div>

      <div className="mt-4 p-5 sm:p-6 rounded-3xl bg-[#0d1226] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-stone-200">Looking for the companion app tools?</p>
          <p className="text-sm text-stone-300 font-light">
            The four companion tabs (Live Venue, Stage Stream, Halo Device, Safety &amp; Log) are still available.
          </p>
        </div>
        <button
          onClick={onOpenCompanionApp}
          className={`shrink-0 inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-sm font-medium text-stone-200 transition-colors cursor-pointer ${FOCUS_RING}`}
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

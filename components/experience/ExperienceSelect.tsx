import React from 'react';
import { ArrowRight, Smartphone } from 'lucide-react';
import { ExperienceShell } from './ExperienceShell';
import { ConcertCarousel } from './ConcertCarousel';
import { concertModes } from './concertModes';
import { buttonClass } from '../ui/Button';
import { CARD } from '../ui/tokens';

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
}) => (
  <ExperienceShell
    eyebrow="TΛVY Concert Experience"
    title="Where are you watching tonight?"
    backLabel="Back to TΛVY Website"
    onBack={onBackToWebsite}
  >
    <ConcertCarousel modes={concertModes(onSelectLiveVenue, onSelectAtHome)} />

    <div className="mt-14 grid gap-4 md:grid-cols-2">
      <div className={`${CARD} flex flex-col justify-between gap-5 p-6 sm:p-7`}>
        <div className="space-y-1.5">
          <p className="font-semibold text-tv-navy">Curious about the hardware?</p>
          <p className="text-sm leading-relaxed text-tv-slate">
            Explore a 3D design concept of the Halo wearable. It's a product preview, not a concert mode.
          </p>
        </div>
        <button onClick={onOpenHaloShowcase} className={`${buttonClass('secondary')} self-start`}>
          Explore Halo in 3D
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className={`${CARD} flex flex-col justify-between gap-5 p-6 sm:p-7`}>
        <div className="space-y-1.5">
          <p className="font-semibold text-tv-navy">Looking for the companion app tools?</p>
          <p className="text-sm leading-relaxed text-tv-slate">
            The four companion tabs (Live Venue, Stage Stream, Halo Device, Safety &amp; Log) are still available.
          </p>
        </div>
        <button onClick={onOpenCompanionApp} className={`${buttonClass('secondary')} self-start`}>
          <Smartphone className="w-4 h-4" aria-hidden="true" />
          Open Companion App
        </button>
      </div>
    </div>

    <p className="mt-8 max-w-3xl text-xs leading-relaxed text-tv-slate">
      This is a product demo. Halo hardware, Bluetooth connections, crowd and sound-level data, and safety features are
      simulated and do not connect to real devices or emergency services.
    </p>
  </ExperienceShell>
);

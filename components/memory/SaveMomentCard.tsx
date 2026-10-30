import React, { useId } from 'react';
import { BookHeart } from 'lucide-react';
import { Polaroid } from './Polaroid';

interface SaveMomentCardProps {
  onSave: () => void;
}

/**
 * A quiet invitation shown on a concert screen only once the music has stopped (never during playback):
 * it opens the Memory Book's New memory form with the concert's details filled in. It saves nothing itself.
 */
export const SaveMomentCard: React.FC<SaveMomentCardProps> = ({ onSave }) => {
  const headingId = useId();
  const textId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="relative z-10 flex items-center gap-5 rounded-3xl border border-tv-accent/45 bg-[linear-gradient(135deg,rgb(58_44_39/0.55),rgb(20_21_32/0.92))] p-4 sm:p-5"
    >
      <div aria-hidden="true" className="hidden w-20 shrink-0 sm:block">
        <Polaroid caption="" tilt={-4} small />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-tv-accent">Memory Book</p>
        <h2 id={headingId} className="mt-1 font-serif text-2xl text-[#f2d9a6]">
          Keep this concert
        </h2>
        <p id={textId} className="mt-1 text-sm leading-relaxed text-ink-muted">
          Add a photo of your own and a few words. It stays on this device, and nothing is saved until you choose to.
        </p>
        <button
          type="button"
          onClick={onSave}
          aria-describedby={textId}
          className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-full bg-tv-canvas px-5 text-sm font-semibold text-tv-navy transition hover:bg-tv-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stage"
        >
          <BookHeart className="w-4 h-4 text-tv-accent-ink" aria-hidden="true" />
          Save this moment
        </button>
      </div>
    </section>
  );
};

import React from 'react';
import { Pause, Volume2, VolumeX, Waves } from 'lucide-react';
import { FOCUS_LIGHT } from '../ui/tokens';
import { playPreview, setSiteSound, soundSupported, stopPreview, type PreviewKind } from './soundEngine';
import { useSound } from './useSound';

/**
 * Sound on / Sound off for the landing page. Off on every visit; turning it on starts the Golden Overture
 * music, which the notes, silk and gate move with. The current state is in the button's name and
 * aria-pressed; problems (blocked, failed) are announced next to it.
 */
export const SoundToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const sound = useSound();
  if (!soundSupported()) return null;
  const on = sound.site;
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => void setSiteSound(!on)}
        aria-pressed={on}
        aria-label={compact ? (on ? 'Sound on' : 'Sound off') : undefined}
        title={on ? 'Turn the music off' : 'Turn on the Golden Symphony music'}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors cursor-pointer ${
          on ? 'border-tv-accent/70 bg-tv-mist text-tv-navy' : 'border-tv-line bg-tv-paper/80 text-tv-slate hover:text-tv-navy'
        } ${FOCUS_LIGHT}`}
      >
        {on ? <Volume2 className="w-4 h-4 text-tv-accent-ink" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
        {!compact && <span>{on ? 'Sound on' : 'Sound off'}</span>}
        {on && <SoundBars />}
      </button>
      <span role="status" className="sr-only">
        {sound.loading && on ? 'Loading music…' : ''}
      </span>
      {sound.error && (
        <span role="alert" className="absolute right-0 top-full mt-2 w-64 rounded-tv-sm border border-tv-line bg-tv-paper px-3 py-2 text-xs leading-relaxed text-tv-navy shadow-tv-soft">
          {sound.error}
        </span>
      )}
    </span>
  );
};

/** Three small bars that show music is playing (static with reduced motion). */
const SoundBars: React.FC = () => (
  <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
    {[0, 1, 2].map((i) => (
      <span key={i} className="tv-sound-bar w-[2px] rounded-full bg-tv-accent-ink" style={{ animationDelay: `${i * 140}ms` }} />
    ))}
  </span>
);

/**
 * "Preview" on a concert card: a few seconds of original music in that mode's mood, only when pressed.
 * The landing music (if on) pauses for it and returns after.
 */
export const PreviewButton: React.FC<{ kind: PreviewKind; label: string }> = ({ kind, label }) => {
  const sound = useSound();
  if (!soundSupported()) return null;
  const playing = sound.preview === kind;
  return (
    <button
      type="button"
      onClick={() => (playing ? stopPreview() : void playPreview(kind))}
      aria-pressed={playing}
      aria-label={playing ? `Stop the ${label} sound preview` : `Preview the ${label} sound`}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors cursor-pointer ${
        playing ? 'border-tv-accent/70 bg-tv-mist text-tv-navy' : 'border-tv-line bg-tv-paper text-tv-navy hover:bg-tv-mist/70'
      } ${FOCUS_LIGHT}`}
    >
      {playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Waves className="w-4 h-4 text-tv-accent-ink" aria-hidden="true" />}
      {playing ? 'Stop preview' : 'Preview'}
      {playing && <SoundBars />}
    </button>
  );
};

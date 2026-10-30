import { formatTime } from "../lib/beat";

interface PlayerControlsProps {
  time: number;
  duration: number;
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  /** Back to the start (and whatever else a fresh run resets, e.g. the score). */
  onRestart?: () => void;
}

export default function PlayerControls({ time, duration, playing, onPlay, onPause, onSeek, onRestart }: PlayerControlsProps) {
  const ended = !playing && time >= duration;

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={playing ? onPause : onPlay}
        className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-aura text-xl font-bold text-stage transition hover:brightness-110"
        aria-label={playing ? "Pause" : ended ? "Replay" : "Play"}
      >
        <span aria-hidden="true">{playing ? "❚❚" : ended ? "↺" : "▶"}</span>
      </button>
      <div className="flex flex-1 flex-col">
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={time}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Position in performance"
          aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
          className="h-11 w-full cursor-pointer accent-aura"
        />
        <div className="-mt-2 flex justify-between text-xs text-ink-muted tabular-nums">
          <span>{formatTime(time)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      {onRestart && (
        <button
          type="button"
          onClick={onRestart}
          aria-label="Restart from the beginning"
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg text-ink transition hover:border-white/40 hover:bg-white/5"
        >
          <span aria-hidden="true">⟲</span>
        </button>
      )}
    </div>
  );
}

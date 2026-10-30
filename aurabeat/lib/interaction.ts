import type { InteractionCue, Track } from "../types/performance";

export type InteractionPhase = "idle" | "get-ready" | "wave";

/** Where we are relative to the track's interaction moments at `time`. */
export function interactionAt(track: Track, time: number): { phase: InteractionPhase; cue: InteractionCue | null } {
  for (const cue of track.interactions) {
    if (time >= cue.start && time < cue.end) return { phase: "wave", cue };
    if (time >= cue.readyAt && time < cue.start) return { phase: "get-ready", cue };
  }
  return { phase: "idle", cue: null };
}

/** The next wave moment that hasn't started yet at `time`, from the track's own timing data. */
export function nextWave(track: Track, time: number): InteractionCue | null {
  return track.interactions.find((cue) => cue.start > time) ?? null;
}

/**
 * Where "Jump to next wave" lands: the GET READY point of the next wave that isn't already being
 * announced, so the jump still gives the run-up. Null after the last wave.
 */
export function nextWaveJump(track: Track, time: number): InteractionCue | null {
  return track.interactions.find((cue) => cue.readyAt > time + 0.5) ?? null;
}

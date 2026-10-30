/**
 * Golden Symphony timing: the single source of truth shared by the soundtrack renderer
 * (scripts/audio/render-soundtrack.mts, which writes public/audio/*.m4a) and the app (the story timeline,
 * beat-synced visuals and the sound engine). Change a number here, re-render, and both stay in step.
 *
 * Plain values only (no imports, no enums), so Node can load this file directly.
 */

export const BPM = 96;
export const BEAT = 60 / BPM; // 0.625 s
export const BAR = BEAT * 4; // 2.5 s

/** "The Sound of Dreams": the story soundtrack. Each scene is three bars. */
export const STORY = {
  /** Scene start times, seconds. */
  scenes: [0, 3 * BAR, 6 * BAR, 9 * BAR],
  /** When the story's timeline ends (the audio file rings on a little longer). */
  end: 12 * BAR, // 30 s
  /** The closing line appears on this bar. */
  ending: 10 * BAR, // 25 s
  /** Audio file length, including the final chord ringing out. */
  fileDuration: 12 * BAR + 3,
  /** Musical cues the visuals answer, seconds. */
  cues: {
    chime: 3 * BAR, // the golden ribbon appears
    gate: 6 * BAR, // the Golden Gate shimmer
    riser: 8 * BAR, // the build before the climax
    climax: 9 * BAR, // together: full band and crowd
    resolve: 12 * BAR, // the last chord
  },
} as const;

/** The landing page's optional music: eight bars that loop seamlessly. */
export const OVERTURE = { bars: 8, duration: 8 * BAR } as const; // 20 s

/** Short one-shot cues. */
export const GATE_CUE = { duration: 4 } as const;
export const PREVIEW = { duration: 6 } as const;

/** Files, relative to the site's base URL. */
export const TRACKS = {
  story: 'audio/sound-of-dreams.m4a',
  overture: 'audio/golden-overture-loop.m4a',
  gate: 'audio/golden-gate-cue.m4a',
  previewLive: 'audio/preview-live.m4a',
  previewHome: 'audio/preview-home.m4a',
} as const;

/** D major pentatonic for the hero's note taps (MIDI): D5 E5 F#5 A5 B5 D6. */
export const NOTE_TAP_SCALE = [74, 76, 78, 81, 83, 86] as const;

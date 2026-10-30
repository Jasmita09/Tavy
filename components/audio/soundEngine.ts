import { BEAT, GATE_CUE, NOTE_TAP_SCALE, OVERTURE, STORY, TRACKS } from './score';

/**
 * The Golden Symphony sound engine: one AudioContext and one music channel for the whole site, so two
 * soundtracks can never overlap. Nothing makes a sound until the user asks for it (Sound on, Play with
 * Sound, a Preview button); nothing is remembered as permission to play on a later visit. Only the
 * volume is saved.
 *
 * It is separate from the concerts: the At-home Concert keeps its own video clock and scoring, and
 * leaving the landing page stops everything here (stopAll).
 */

export type MusicId = 'overture' | 'story' | 'previewLive' | 'previewHome';
export type PreviewKind = 'live' | 'home';

export interface SoundState {
  /** The landing page's music is on (the user turned it on this visit). */
  site: boolean;
  story: 'off' | 'playing' | 'paused';
  preview: PreviewKind | null;
  muted: boolean;
  volume: number;
  /** Something is downloading or decoding. */
  loading: boolean;
  /** Plain-language problem to show (blocked by the browser, failed to load, unsupported). */
  error: string | null;
}

const VOLUME_KEY = 'tavy.sound.volume';
const savedVolume = () => {
  try {
    const v = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(v) && v > 0 && v <= 1 ? v : 0.8;
  } catch {
    return 0.8;
  }
};

let state: SoundState = { site: false, story: 'off', preview: null, muted: false, volume: savedVolume(), loading: false, error: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<SoundState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
export const getSoundState = () => state;
export const subscribeSound = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const soundSupported = () => typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);

export const MESSAGES = {
  blocked: 'Your browser blocked sound. Tap the button again to allow it.',
  failed: 'The music couldn’t load. Everything still works without sound.',
  unsupported: 'This browser can’t play TΛVY’s music. Everything still works without sound.',
};

/* ---------- Audio graph ---------- */

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let fxBus: GainNode;

const masterLevel = () => (state.muted ? 0 : state.volume);

const context = (): AudioContext | null => {
  if (ctx) return ctx;
  if (!soundSupported()) return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = masterLevel();
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.connect(master);
  fxBus = ctx.createGain();
  fxBus.gain.value = 0.55; // effects always sit under the music
  fxBus.connect(master);
  return ctx;
};

/** Start or wake the audio context. Must be called from a click or key press. */
const unlock = async (): Promise<boolean> => {
  const c = context();
  if (!c) {
    set({ error: MESSAGES.unsupported });
    return false;
  }
  if (c.state !== 'running') {
    try {
      await Promise.race([c.resume(), new Promise((r) => setTimeout(r, 800))]);
    } catch {
      // handled below
    }
  }
  if ((c.state as string) !== 'running') {
    set({ error: MESSAGES.blocked });
    return false;
  }
  if (state.error === MESSAGES.blocked) set({ error: null });
  return true;
};

/* ---------- Loading ---------- */

interface Track {
  buffer: AudioBuffer;
  /** Encoder priming some decoders leave at the start, seconds. */
  lead: number;
}
const tracks = new Map<MusicId | 'gate', Promise<Track>>();
/** Downloaded bytes, so a prefetch needs no AudioContext (decoding waits until sound is chosen). */
const bytes = new Map<MusicId | 'gate', Promise<ArrayBuffer>>();
const fetchBytes = (id: MusicId | 'gate') => {
  let p = bytes.get(id);
  if (!p) {
    p = fetch(url(FILES[id])).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.arrayBuffer();
    });
    p.catch(() => bytes.delete(id));
    bytes.set(id, p);
  }
  return p;
};
const url = (file: string) => `${import.meta.env.BASE_URL}${file}`;
const FILES: Record<MusicId | 'gate', string> = {
  overture: TRACKS.overture,
  story: TRACKS.story,
  previewLive: TRACKS.previewLive,
  previewHome: TRACKS.previewHome,
  gate: TRACKS.gate,
};

const load = (id: MusicId | 'gate'): Promise<Track> => {
  const c = context();
  if (!c) return Promise.reject(new Error('unsupported'));
  let p = tracks.get(id);
  if (!p) {
    p = fetchBytes(id)
      // decodeAudioData detaches its input, so decode a copy (the bytes stay cached)
      .then((data) => c.decodeAudioData(data.slice(0)))
      .then((buffer) => {
        // The loop and story files start with sound, so leading near-silence of about one AAC
        // priming block (~48 ms) is decoder padding: skip it to keep loops seamless and clocks exact.
        const ch = buffer.getChannelData(0);
        let i = 0;
        while (i < ch.length && i < 4096 && Math.abs(ch[i]) < 1e-4) i++;
        const lead = id === 'overture' || id === 'story' ? (i > 1024 && i < 4096 ? i / buffer.sampleRate : 0) : 0;
        return { buffer, lead };
      });
    p.catch(() => tracks.delete(id));
    tracks.set(id, p);
  }
  return p;
};

/** Start downloading a track early (e.g. when the story opens): no AudioContext, nothing plays. */
export const prefetch = (id: MusicId) => {
  if (!soundSupported()) return;
  fetchBytes(id).catch(() => {});
};

/* ---------- The music channel (one at a time) ---------- */

interface Playing {
  id: MusicId;
  source: AudioBufferSourceNode;
  gain: GainNode;
  /** Context time at which the track's position 0 would have played. */
  zero: number;
  loop: boolean;
  duration: number;
}
let current: Playing | null = null;
/** Bumps on every start/stop, so late async work can tell it has been superseded. */
let generation = 0;

const fadeOut = (p: Playing, seconds: number) => {
  const c = ctx!;
  const now = c.currentTime;
  p.gain.gain.cancelScheduledValues(now);
  p.gain.gain.setValueAtTime(p.gain.gain.value, now);
  p.gain.gain.linearRampToValueAtTime(0, now + Math.max(0.02, seconds));
  p.source.onended = null;
  try {
    p.source.stop(now + Math.max(0.02, seconds) + 0.02);
  } catch {
    // already stopped
  }
};

const stopMusic = (fade = 0.3) => {
  generation++;
  if (current && ctx) fadeOut(current, fade);
  current = null;
};

const startMusic = async (id: MusicId, { offset = 0, loop = false, fadeIn = 0.4, onEnd }: { offset?: number; loop?: boolean; fadeIn?: number; onEnd?: () => void } = {}) => {
  stopMusic(0.25);
  const gen = generation;
  set({ loading: true });
  let track: Track;
  try {
    track = await load(id);
  } catch {
    set({ loading: false, error: MESSAGES.failed });
    return false;
  }
  set({ loading: false });
  if (gen !== generation || !ctx) return false; // superseded while loading
  const c = ctx;
  const source = c.createBufferSource();
  source.buffer = track.buffer;
  const gain = c.createGain();
  source.connect(gain).connect(musicBus);
  const at = c.currentTime + 0.03;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(1, at + Math.max(0.02, fadeIn));
  const duration = id === 'overture' ? OVERTURE.duration : track.buffer.duration - track.lead;
  if (loop) {
    source.loop = true;
    source.loopStart = track.lead;
    source.loopEnd = track.lead + OVERTURE.duration;
  }
  source.start(at, track.lead + Math.max(0, offset) % (loop ? duration : Infinity));
  const playing: Playing = { id, source, gain, zero: at - offset, loop, duration };
  source.onended = () => {
    if (current === playing) {
      current = null;
      onEnd?.();
    }
  };
  current = playing;
  return true;
};

/**
 * Position in the current music as it reaches the listener's ears, seconds (null when nothing is playing
 * or it's another track). The device's output latency is taken off, so pictures meet the sound.
 */
export const musicTime = (id?: MusicId): number | null => {
  if (!current || !ctx || (id && current.id !== id)) return null;
  const latency = ctx.outputLatency || ctx.baseLatency || 0;
  const t = Math.max(0, ctx.currentTime - current.zero - latency);
  return current.loop ? t % current.duration : t;
};

/* ---------- Visual pulse (read every frame by the visuals) ---------- */

let tapPulse = 0;
let tapAt = 0;

/**
 * A soft 0–1 envelope on the beat of whatever music is playing (strongest on the bar's first beat),
 * plus a short swell after a note tap. 0 when the site is silent, so visuals behave exactly as before.
 */
export const musicPulse = (): number => {
  let beat = 0;
  const t = musicTime();
  if (t !== null && ctx?.state === 'running') {
    const b = t / BEAT;
    const phase = b - Math.floor(b);
    const down = Math.floor(b) % 4 === 0;
    beat = Math.exp(-phase * 5) * (down ? 1 : 0.55) * (current?.id === 'story' ? 1 : 0.7);
  }
  const since = (performance.now() - tapAt) / 1000;
  const tap = tapPulse * Math.exp(-since * 3);
  return Math.min(1, beat + tap);
};

/* ---------- Landing page music ---------- */

/** Turn the landing page's music on or off. Call from the Sound button. */
export const setSiteSound = async (on: boolean) => {
  if (!on) {
    if (current?.id === 'overture') stopMusic(0.6);
    set({ site: false });
    return;
  }
  if (!(await unlock())) return;
  set({ site: true, error: null });
  if (state.preview) return; // a preview is playing; the music follows when it ends
  const ok = await startMusic('overture', { loop: true, fadeIn: 1.6 });
  if (!ok) set({ site: false });
};

/* ---------- Previews of the two concert modes ---------- */

export const playPreview = async (kind: PreviewKind) => {
  if (!(await unlock())) return;
  const resumeSite = state.site;
  set({ preview: kind, error: null });
  const ok = await startMusic(kind === 'live' ? 'previewLive' : 'previewHome', {
    fadeIn: 0.2,
    onEnd: () => {
      set({ preview: null });
      // The landing music the user had on comes back gently
      if (resumeSite && state.site && !current) void startMusic('overture', { loop: true, fadeIn: 1.4 });
    },
  });
  if (!ok) set({ preview: null });
};

export const stopPreview = () => {
  if (!state.preview) return;
  const resumeSite = state.site;
  if (current && (current.id === 'previewLive' || current.id === 'previewHome')) stopMusic(0.3);
  set({ preview: null });
  if (resumeSite) void startMusic('overture', { loop: true, fadeIn: 1.4 });
};

/* ---------- The Golden Gate cue ---------- */

let gateArmed = true;
let lastGateCue = -Infinity;

/**
 * Called on every scroll with the journey's progress (0–1). When the landing music is on, reaching the
 * gate plays one shimmer over the music. It re-arms only after scrolling well back up, and has a
 * cooldown, so scrubbing or fast scrolling never repeats it or restarts the music.
 */
export const gateProgress = (p: number) => {
  if (p < 0.6) gateArmed = true;
  if (!gateArmed || p < 0.97) return;
  gateArmed = false;
  const now = performance.now();
  if (!state.site || state.preview || state.story !== 'off' || !ctx || ctx.state !== 'running' || now - lastGateCue < 20000) return;
  lastGateCue = now;
  load('gate')
    .then(({ buffer }) => {
      if (!state.site || !ctx) return;
      const c = ctx;
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.connect(fxBus);
      const at = c.currentTime + 0.02;
      // Lower the music under the shimmer, then bring it back
      musicBus.gain.cancelScheduledValues(at);
      musicBus.gain.setValueAtTime(musicBus.gain.value, at);
      musicBus.gain.linearRampToValueAtTime(0.4, at + 0.3);
      musicBus.gain.setValueAtTime(0.4, at + GATE_CUE.duration - 1.2);
      musicBus.gain.linearRampToValueAtTime(1, at + GATE_CUE.duration);
      src.start(at);
      tapPulse = 1;
      tapAt = performance.now();
    })
    .catch(() => {});
};

/* ---------- Note taps ---------- */

let lastTap = 0;

/**
 * A soft bell tone in the soundtrack's key, for a deliberate tap on a note. Only while the landing music
 * is on; rate-limited so a burst of taps can't turn into noise. Returns true when a tone played.
 */
export const noteTap = (index: number) => {
  const now = performance.now();
  if (!state.site || !ctx || ctx.state !== 'running' || now - lastTap < 120) return false;
  lastTap = now;
  const c = ctx;
  const midi = NOTE_TAP_SCALE[((index % NOTE_TAP_SCALE.length) + NOTE_TAP_SCALE.length) % NOTE_TAP_SCALE.length];
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const at = c.currentTime + 0.01;
  const out = c.createGain();
  out.gain.setValueAtTime(0, at);
  out.gain.linearRampToValueAtTime(0.32, at + 0.006);
  out.gain.exponentialRampToValueAtTime(0.001, at + 1.8);
  out.connect(fxBus);
  // Bell partials, as in the soundtrack
  for (const [ratio, amp] of [[1, 1], [2, 0.3], [2.76, 0.22], [4.07, 0.1]] as const) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = f * ratio;
    g.gain.value = amp;
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + 1.9);
  }
  tapPulse = 0.9;
  tapAt = now;
  return true;
};

/* ---------- The story ---------- */

let storyPausedAt = 0;

/** Play the story soundtrack from `offset` seconds (also used to seek). Resolves false if sound can't play. */
export const storyPlay = async (offset: number) => {
  if (!(await unlock())) return false;
  // The story takes over: the landing music and any preview stop (they don't come back on their own)
  set({ site: false, preview: null, error: null });
  storyPausedAt = offset;
  const ok = await startMusic('story', {
    offset,
    fadeIn: offset > 0 ? 0.25 : 0.05,
    onEnd: () => set({ story: 'off' }),
  });
  set({ story: ok ? 'playing' : 'off' });
  return ok;
};

/** The story's position: the audio clock while it plays. */
export const storyTime = () => musicTime('story') ?? storyPausedAt;

export const storyPause = () => {
  storyPausedAt = storyTime();
  if (current?.id === 'story') stopMusic(0.12);
  set({ story: 'paused' });
};

/** Stop the story's music (closing, skipping or finishing), with a gentle fade. */
export const storyStop = (fade = 0.5) => {
  if (current?.id === 'story') stopMusic(fade);
  storyPausedAt = 0;
  if (state.story !== 'off') set({ story: 'off' });
};

/* ---------- Volume ---------- */

const applyLevel = () => {
  if (!ctx) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(masterLevel(), now, 0.03);
};

export const setMuted = (muted: boolean) => {
  set({ muted });
  applyLevel();
};

export const setVolume = (volume: number) => {
  const v = Math.min(1, Math.max(0.05, volume));
  set({ volume: v, muted: false });
  applyLevel();
  try {
    localStorage.setItem(VOLUME_KEY, String(v));
  } catch {
    // not saved; applies for this visit
  }
};

/* ---------- Lifecycle ---------- */

/** Silence everything at once (leaving the landing page for a concert, for example). */
export const stopAll = () => {
  stopMusic(0.15);
  storyPausedAt = 0;
  if (state.site || state.preview || state.story !== 'off') set({ site: false, preview: null, story: 'off' });
};

// A hidden tab is silent: the whole context sleeps (which also holds every clock still) and wakes for
// the landing music or a preview when the tab returns. The story pauses itself and waits for Play.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend().catch(() => {});
    else if (state.site || state.preview) void ctx.resume().catch(() => {});
  });
}

export { STORY };

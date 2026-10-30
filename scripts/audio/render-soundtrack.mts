/**
 * Renders TΛVY's Golden Symphony audio from scratch: every sound is synthesised here (no samples, no
 * recordings), from an original score written for TΛVY. Deterministic (seeded noise), so the same script
 * always produces the same audio.
 *
 *   node scripts/audio/render-soundtrack.mts
 *
 * Writes 44.1 kHz stereo WAV to a temp folder, then encodes AAC .m4a into public/audio with macOS
 * `afconvert` (the WAVs are kept with --keep-wav). Timing comes from components/audio/score.ts.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BAR, BEAT, GATE_CUE, OVERTURE, PREVIEW, STORY, TRACKS } from '../../components/audio/score.ts';

const SR = 44100;
const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'public');
const KEEP_WAV = process.argv.includes('--keep-wav');

/* ---------------- utilities ---------------- */

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 1;
const rand = () => {
  // mulberry32
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = () => rand() * 2 - 1;

/** RBJ biquad, processed in place. */
const biquad = (x: Float32Array, type: 'lp' | 'hp' | 'bp', freq: number | ((i: number) => number), q = 0.707) => {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0, lastF = -1;
  for (let i = 0; i < x.length; i++) {
    const f = typeof freq === 'number' ? freq : freq(i);
    if (f !== lastF && (typeof freq === 'number' ? lastF < 0 : i % 32 === 0)) {
      lastF = f;
      const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
      const cs = Math.cos(w), al = Math.sin(w) / (2 * q);
      const a0 = 1 + al;
      if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; }
      else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; }
      else { b0 = al; b1 = 0; b2 = -al; }
      b0 /= a0; b1 /= a0; b2 /= a0; a1 = (-2 * cs) / a0; a2 = (1 - al) / a0;
    }
    const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
    x[i] = y;
  }
  return x;
};

/** A stereo mix bus with a reverb send. */
class Mix {
  L: Float32Array; R: Float32Array; send: Float32Array; seconds: number;
  constructor(seconds: number) {
    this.seconds = seconds;
    const n = Math.ceil(seconds * SR);
    this.L = new Float32Array(n); this.R = new Float32Array(n); this.send = new Float32Array(n);
  }
  /** Place a mono sound at `t` seconds: pan -1…1 (equal power), `wet` reverb send. */
  add(t: number, sig: Float32Array, { gain = 1, pan = 0, wet = 0.25 } = {}) {
    const start = Math.round(t * SR);
    const a = ((pan + 1) * Math.PI) / 4;
    const gl = Math.cos(a) * gain, gr = Math.sin(a) * gain;
    for (let i = 0; i < sig.length; i++) {
      const j = start + i;
      if (j < 0 || j >= this.L.length) continue;
      this.L[j] += sig[i] * gl; this.R[j] += sig[i] * gr; this.send[j] += sig[i] * gain * wet;
    }
  }
}

/** Freeverb-style room: 4 damped combs + 2 allpasses per side. */
const reverb = (mix: Mix, size = 0.82, damp = 0.25, level = 1) => {
  const side = (offset: number) => {
    const out = new Float32Array(mix.send.length);
    for (const d0 of [1116, 1188, 1277, 1356]) {
      const d = d0 + offset; const buf = new Float32Array(d); let k = 0, store = 0;
      for (let i = 0; i < out.length; i++) {
        const y = buf[k];
        store = y * (1 - damp) + store * damp;
        buf[k] = mix.send[i] + store * size;
        out[i] += y * 0.25;
        k = (k + 1) % d;
      }
    }
    for (const d0 of [556, 441]) {
      const d = d0 + offset; const buf = new Float32Array(d); let k = 0;
      for (let i = 0; i < out.length; i++) {
        const b = buf[k]; const y = -out[i] + b;
        buf[k] = out[i] + b * 0.5; out[i] = y; k = (k + 1) % d;
      }
    }
    return out;
  };
  const l = side(0), r = side(23);
  for (let i = 0; i < l.length; i++) { mix.L[i] += l[i] * level; mix.R[i] += r[i] * level; }
};

/* ---------------- instruments (mono, gain ~1 at vel 1) ---------------- */

const env = (n: number, attack: number, hold: number, release: number) => (i: number) => {
  const t = i / SR;
  if (t < attack) return t / attack;
  if (t < attack + hold) return 1;
  return Math.max(0, 1 - (t - attack - hold) / release);
};

/** Felt-piano: decaying, slightly inharmonic partials with a soft hammer. */
const piano = (m: number, dur: number, vel: number) => {
  const f = mtof(m); const n = Math.ceil((dur + 1.8) * SR); const x = new Float32Array(n);
  for (let h = 1; h <= 8; h++) {
    const fh = h * f * Math.sqrt(1 + 0.00035 * h * h);
    if (fh > 12000) break;
    const amp = (0.5 / Math.pow(h, 1.5)) * (h === 2 ? 0.7 : 1);
    const decay = 0.9 + h * 0.75 + f / 900;
    const w = (2 * Math.PI * fh) / SR;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const rel = t > dur ? Math.exp(-(t - dur) * 6) : 1;
      x[i] += Math.sin(w * i) * amp * Math.exp(-t * decay) * rel;
    }
  }
  for (let i = 0; i < 220; i++) x[i] *= i / 220; // soft attack
  for (let i = 0; i < 400; i++) x[i] += noise() * 0.03 * (1 - i / 400); // felt hammer
  biquad(x, 'lp', 4200);
  for (let i = 0; i < n; i++) x[i] *= vel;
  return x;
};

/** Bell / celesta: bright inharmonic partials, long ring. */
const bell = (m: number, vel: number, ring = 2.6) => {
  const f = mtof(m); const n = Math.ceil(ring * SR); const x = new Float32Array(n);
  const partials: [number, number, number][] = [[1, 1, 1.3], [2, 0.32, 2], [2.76, 0.28, 2.6], [4.07, 0.14, 3.6], [5.43, 0.08, 4.8]];
  for (const [r, a, d] of partials) {
    const w = (2 * Math.PI * f * r) / SR;
    for (let i = 0; i < n; i++) x[i] += Math.sin(w * i) * a * Math.exp((-i / SR) * d * (3 / ring));
  }
  for (let i = 0; i < 90; i++) x[i] *= i / 90;
  for (let i = 0; i < n; i++) x[i] *= vel * 0.5;
  return x;
};

/** Warm pad: three detuned band-limited saws per note, slow swell, low-passed. */
const pad = (notes: number[], dur: number, vel: number, bright: number) => {
  const attack = Math.min(1.2, dur * 0.4), release = 1.6;
  const n = Math.ceil((dur + release) * SR); const x = new Float32Array(n);
  const e = env(n, attack, Math.max(0, dur - attack), release);
  for (const m of notes) {
    for (const cents of [-8, 0, 7]) {
      const f = mtof(m) * Math.pow(2, cents / 1200);
      const H = Math.min(14, Math.floor(bright * 1.6 / f));
      const ph = rand() * Math.PI * 2;
      for (let h = 1; h <= H; h++) {
        const w = (2 * Math.PI * f * h) / SR; const a = 1 / h;
        for (let i = 0; i < n; i++) x[i] += Math.sin(w * i + ph * h) * a;
      }
    }
  }
  const scale = vel * 0.06 / Math.sqrt(notes.length);
  for (let i = 0; i < n; i++) x[i] *= e(i) * scale;
  biquad(x, 'lp', bright, 0.6);
  return x;
};

/** Round bass. */
const bass = (m: number, dur: number, vel: number) => {
  const f = mtof(m); const n = Math.ceil((dur + 0.25) * SR); const x = new Float32Array(n);
  const w = (2 * Math.PI * f) / SR;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const a = Math.min(1, t / 0.012) * (t < dur ? 0.75 + 0.25 * Math.exp(-t * 6) : Math.exp(-(t - dur) * 14));
    x[i] = (Math.sin(w * i) + 0.25 * Math.sin(2 * w * i) + 0.08 * Math.sin(3 * w * i)) * a * vel * 0.55;
  }
  return x;
};

const kick = (vel: number) => {
  const n = Math.ceil(0.45 * SR); const x = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR; const f = 44 + 80 * Math.exp(-t * 28);
    ph += (2 * Math.PI * f) / SR;
    x[i] = Math.sin(ph) * Math.exp(-t * 7.5) * vel;
  }
  for (let i = 0; i < 60; i++) x[i] += noise() * 0.25 * vel * (1 - i / 60);
  return x;
};

const clap = (vel: number) => {
  const n = Math.ceil(0.3 * SR); const x = new Float32Array(n);
  for (const off of [0, 0.011, 0.023]) {
    const s = Math.round(off * SR);
    for (let i = 0; i < 400 && s + i < n; i++) x[s + i] += noise() * (1 - i / 400);
  }
  for (let i = Math.round(0.03 * SR); i < n; i++) x[i] += noise() * Math.exp(-(i / SR - 0.03) * 18) * 0.6;
  biquad(x, 'bp', 1400, 0.9);
  for (let i = 0; i < n; i++) x[i] *= vel * 0.9;
  return x;
};

const hat = (vel: number, open = false) => {
  const n = Math.ceil((open ? 0.22 : 0.06) * SR); const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = noise() * Math.exp((-i / SR) * (open ? 14 : 70));
  biquad(x, 'hp', 7500);
  for (let i = 0; i < n; i++) x[i] *= vel * 0.5;
  return x;
};

/** Rain on a window: soft hiss with slow movement, and a few droplets. */
const rain = (seconds: number, level: (t: number) => number) => {
  const n = Math.ceil(seconds * SR); const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = noise();
  biquad(x, 'lp', 3200); biquad(x, 'hp', 500);
  for (let i = 0; i < n; i++) { const t = i / SR; x[i] *= level(t) * (0.8 + 0.2 * Math.sin(t * 1.3)) * 0.22; }
  for (let k = 0; k < seconds * 9; k++) {
    const s = Math.floor(rand() * n), f = 2200 + rand() * 2600, a = 0.02 + rand() * 0.03;
    for (let i = 0; i < 900 && s + i < n; i++) x[s + i] += Math.sin((2 * Math.PI * f * i) / SR) * Math.exp(-i / 140) * a * level((s + i) / SR);
  }
  return x;
};

/** A distant, friendly crowd: a breathing bed with scattered applause. */
const crowd = (seconds: number, level: (t: number) => number) => {
  const n = Math.ceil(seconds * SR); const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = noise();
  biquad(x, 'bp', 900, 0.5); biquad(x, 'lp', 2600);
  for (let i = 0; i < n; i++) { const t = i / SR; x[i] *= level(t) * (0.85 + 0.15 * Math.sin(t * 0.9 + Math.sin(t * 0.37))) * 0.5; }
  for (let k = 0; k < seconds * 26; k++) {
    const s = Math.floor(rand() * n); const c = clap(0.08 + rand() * 0.07);
    for (let i = 0; i < c.length && s + i < n; i++) x[s + i] += c[i] * level((s + i) / SR);
  }
  return x;
};

/** Filtered-noise swell whose band rises: the build into a big moment. */
const riser = (seconds: number, from = 400, to = 7000) => {
  const n = Math.ceil(seconds * SR); const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = noise();
  biquad(x, 'bp', (i) => from * Math.pow(to / from, i / n), 1.4);
  for (let i = 0; i < n; i++) { const p = i / n; x[i] *= Math.pow(p, 1.6) * 0.35 * (p > 0.96 ? (1 - p) / 0.04 : 1); }
  return x;
};

/** Upward bell arpeggio over a soft noise shimmer: a door of light opening. */
const shimmer = (mix: Mix, t: number, root: number, gain = 1) => {
  [0, 4, 7, 12, 16, 19, 24].forEach((iv, k) => mix.add(t + k * BEAT / 4, bell(root + iv, 0.5 - k * 0.03, 2.4), { gain: 0.55 * gain, pan: -0.5 + k * 0.17, wet: 0.5 }));
  const s = riser(1.6, 3000, 11000);
  for (let i = 0; i < s.length; i++) s[i] *= Math.sin((Math.PI * i) / s.length);
  mix.add(t, s, { gain: 0.5 * gain, wet: 0.6 });
};

/* ---------------- harmony ---------------- */

// MIDI voicings
const CH: Record<string, { pad: number[]; arp: number[]; root: number }> = {
  Bm9: { pad: [59, 62, 66, 73], arp: [59, 66, 69, 73, 74], root: 35 },
  Gmaj7: { pad: [55, 59, 62, 66], arp: [55, 62, 66, 71, 74], root: 31 },
  Asus: { pad: [57, 62, 64, 69], arp: [57, 64, 69, 71, 74], root: 33 },
  D: { pad: [62, 66, 69, 74], arp: [62, 69, 74, 76, 78], root: 38 },
  'A/C#': { pad: [61, 64, 69, 73], arp: [61, 69, 73, 76, 81], root: 37 },
  Bm: { pad: [59, 62, 66, 71], arp: [59, 66, 71, 74, 78], root: 35 },
  G: { pad: [55, 59, 62, 67], arp: [55, 62, 67, 71, 74], root: 31 },
  Em7: { pad: [52, 59, 62, 67], arp: [52, 59, 62, 67, 71], root: 40 },
  A: { pad: [57, 61, 64, 69], arp: [57, 64, 69, 73, 76], root: 33 },
};

/** The TΛVY motif (original): two bars, [beat, midi, beats]. */
const MOTIF_A: [number, number, number][] = [[0, 78, 1], [1, 81, 0.5], [1.5, 83, 0.5], [2, 81, 1], [3, 78, 1]];
const MOTIF_B: [number, number, number][] = [[0, 76, 1], [1, 74, 0.5], [1.5, 76, 0.5], [2, 78, 2]];
const MOTIF_END: [number, number, number][] = [[0, 74, 1], [1, 78, 0.5], [1.5, 76, 0.5], [2, 74, 2]];

const playMotif = (mix: Mix, bar0: number, phrase: [number, number, number][], { octave = 0, gain = 1, voice = 'bell' as 'bell' | 'piano' | 'both' } = {}) => {
  for (const [b, m, d] of phrase) {
    const t = bar0 * BAR + b * BEAT;
    if (voice !== 'piano') mix.add(t, bell(m + octave, 0.55, 2.4), { gain: 0.5 * gain, pan: 0.15, wet: 0.4 });
    if (voice !== 'bell') mix.add(t, piano(m + octave, d * BEAT, 0.5), { gain: 0.55 * gain, pan: 0.05, wet: 0.3 });
  }
};

/** Piano arpeggio across one bar: `pattern` is [beat, index into the chord's arp notes]. */
const arpeggio = (mix: Mix, bar: number, chord: string, pattern: [number, number][], vel: number, offset = 0) => {
  for (const [b, k] of pattern) {
    const m = CH[chord].arp[k % CH[chord].arp.length] + offset;
    mix.add(bar * BAR + b * BEAT, piano(m, BEAT * 1.5, vel * (0.85 + rand() * 0.2)), { gain: 0.6, pan: -0.25 + (k % 5) * 0.12, wet: 0.35 });
  }
};
const SPARSE: [number, number][] = [[0, 0], [1, 1], [1.5, 2], [2.5, 3], [3, 2]];
const FLOW: [number, number][] = [[0, 0], [0.5, 1], [1, 2], [1.5, 3], [2, 4], [2.5, 3], [3, 2], [3.5, 1]];

/* ---------------- master ---------------- */

const master = (mix: Mix, peak = 0.89, fadeIn = 0.02, fadeOut = 0.6) => {
  reverb(mix);
  const n = mix.L.length;
  for (let i = 0; i < n; i++) { mix.L[i] = Math.tanh(mix.L[i] * 1.1); mix.R[i] = Math.tanh(mix.R[i] * 1.1); }
  let max = 0;
  for (let i = 0; i < n; i++) max = Math.max(max, Math.abs(mix.L[i]), Math.abs(mix.R[i]));
  const g = peak / (max || 1);
  for (let i = 0; i < n; i++) {
    const t = i / SR, rem = (n - i) / SR;
    const f = Math.min(1, t / fadeIn, rem / fadeOut);
    mix.L[i] *= g * f; mix.R[i] *= g * f;
  }
};

const writeWav = (file: string, mix: Mix) => {
  const n = mix.L.length; const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mix.L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mix.R[i])) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
};

/* ---------------- pieces ---------------- */

/** "The Sound of Dreams": loneliness → hope → wonder → togetherness, 12 bars + the last chord ringing. */
const soundOfDreams = () => {
  seed = 11;
  const mix = new Mix(STORY.fileDuration);
  const chords = ['Bm9', 'Gmaj7', 'Asus', 'D', 'A/C#', 'Bm', 'Em7', 'G', 'A', 'D', 'A', 'Bm'];
  const scene = (bar: number) => Math.floor(bar / 3);

  // Rain: present in the dream, thinning as the ribbon arrives
  mix.add(0, rain(STORY.cues.gate + 1, (t) => (t < STORY.cues.chime ? Math.min(1, t / 1.5) : Math.max(0, 1 - (t - STORY.cues.chime) / (BAR * 2.2)))), { gain: 1, wet: 0.1 });

  chords.forEach((c, bar) => {
    const s = scene(bar);
    const t = bar * BAR;
    // Pad: dark and soft, then warmer and brighter with each scene
    const half = bar === 11;
    const padBright = [700, 1300, 2000, 3200][s];
    const padVel = [0.5, 0.6, 0.7 + (bar - 6) * 0.2, 1.25][s];
    if (half) {
      mix.add(t, pad(CH.Bm.pad, BAR / 2, padVel, padBright), { gain: 1, wet: 0.35 });
      mix.add(t + BAR / 2, pad(CH.G.pad, BAR / 2, padVel, padBright), { gain: 1, wet: 0.35 });
    } else mix.add(t, pad(CH[c].pad, BAR, padVel, padBright), { gain: 1, wet: 0.35 });

    // Piano: sparse in the dream, flowing from the invitation on
    if (s === 0) arpeggio(mix, bar, c, SPARSE, 0.42);
    else if (s === 1) arpeggio(mix, bar, c, FLOW, 0.3);
    else if (s === 2) arpeggio(mix, bar, c, FLOW, 0.3 + (bar - 6) * 0.07, 12);
    else arpeggio(mix, bar, half ? 'Bm' : c, FLOW, 0.4, 12);

    // Bass from the gate on
    if (s === 2) mix.add(t, bass(CH[c].root, BAR * 0.95, 0.45 + (bar - 6) * 0.15), { pan: 0, wet: 0.05 });
    if (s === 3) for (let k = 0; k < 8; k++) mix.add(t + k * BEAT / 2, bass(CH[half && k >= 4 ? 'G' : c].root + (k % 2 ? 12 : 0), BEAT * 0.42, 0.75), { wet: 0.04 });

    // Drums: a heartbeat at the gate, building, then the full concert groove
    if (s === 2) {
      mix.add(t, kick(0.35 + (bar - 6) * 0.15), { wet: 0.05 });
      mix.add(t + 2 * BEAT, kick(0.3 + (bar - 6) * 0.15), { wet: 0.05 });
      if (bar >= 7) for (let k = 0; k < 8; k++) mix.add(t + k * BEAT / 2, hat(0.35 + k * 0.02), { pan: 0.3, wet: 0.1 });
      if (bar === 8) for (let k = 0; k < 16; k++) mix.add(t + k * BEAT / 4, clap(0.12 + k * 0.035), { pan: -0.1, wet: 0.25 });
    }
    if (s === 3) {
      for (let k = 0; k < 4; k++) mix.add(t + k * BEAT, kick(0.85), { wet: 0.04 });
      for (const k of [1, 3]) mix.add(t + k * BEAT, clap(0.6), { pan: -0.05, wet: 0.3 });
      for (let k = 0; k < 8; k++) mix.add(t + k * BEAT / 2 + BEAT / 4, hat(0.4, k % 2 === 1), { pan: 0.35, wet: 0.1 });
    }
  });

  // The golden chime: the ribbon arrives
  mix.add(STORY.cues.chime, bell(86, 0.8, 3.4), { gain: 0.36, pan: 0.2, wet: 0.65 });
  mix.add(STORY.cues.chime + 0.03, bell(93, 0.5, 3), { gain: 0.22, pan: 0.35, wet: 0.65 });
  // Delicate shimmering accents through the invitation
  for (let k = 0; k < 6; k++) mix.add(STORY.cues.chime + BAR * 0.5 + k * BEAT * 1.5, bell([90, 93, 95, 98][k % 4], 0.25, 2), { gain: 0.35, pan: 0.6 - k * 0.2, wet: 0.7 });
  // The motif: first heard in the invitation, again at the gate, in full at the climax
  playMotif(mix, 3, MOTIF_A, { gain: 0.5 }); playMotif(mix, 4, MOTIF_B, { gain: 0.5 });
  playMotif(mix, 6, MOTIF_A, { voice: 'both', gain: 0.55 }); playMotif(mix, 7, MOTIF_B, { voice: 'both', gain: 0.85 });
  playMotif(mix, 9, MOTIF_A, { voice: 'both', gain: 1.1 }); playMotif(mix, 10, MOTIF_B, { voice: 'both', gain: 1.1 }); playMotif(mix, 11, MOTIF_END, { voice: 'both', gain: 1 });

  // The gate opens; the build; the crowd
  shimmer(mix, STORY.cues.gate, 74, 0.6);
  mix.add(STORY.cues.riser, riser(BAR, 300, 8000), { gain: 0.9, wet: 0.4 });
  mix.add(STORY.cues.climax - 0.2, hat(0.6, true), { gain: 1.2, wet: 0.5 });
  mix.add(STORY.cues.climax, crowd(STORY.fileDuration - STORY.cues.climax, (t) => Math.min(1, t / 0.6) * (t < 1.5 ? 1 : 0.55) * (t > BAR * 3 ? Math.max(0, 1 - (t - BAR * 3) / 2.5) : 1)), { gain: 0.9, wet: 0.3 });

  // Resolution: one warm chord, ringing out
  const r = STORY.cues.resolve;
  mix.add(r, pad(CH.D.pad, 2.2, 1.1, 2400), { wet: 0.5 });
  for (const [k, m] of [62, 69, 74, 78, 81].entries()) mix.add(r + k * 0.04, piano(m, 2.4, 0.55), { gain: 0.6, pan: -0.3 + k * 0.15, wet: 0.45 });
  mix.add(r, bell(86, 0.6, 3), { gain: 0.5, wet: 0.6 });
  mix.add(r, bass(38, 2, 0.8), { wet: 0.1 });
  mix.add(r, kick(0.6), { wet: 0.2 });

  master(mix, 0.89, 0.02, 1.2);
  return mix;
};

/** The landing page's eight-bar loop: calm, warm, with a soft pulse to move to. Seamless. */
const overtureLoop = () => {
  seed = 23;
  const tail = 3;
  const mix = new Mix(OVERTURE.duration + tail);
  const chords = ['D', 'A/C#', 'Bm', 'G', 'D', 'A/C#', 'Bm', 'Asus'];
  chords.forEach((c, bar) => {
    const t = bar * BAR;
    mix.add(t, pad(CH[c].pad, BAR, 0.7, 1300), { wet: 0.4 });
    arpeggio(mix, bar, c, bar % 2 ? FLOW : SPARSE, 0.34);
    mix.add(t, kick(0.32), { wet: 0.08 });
    mix.add(t + 2 * BEAT, kick(0.24), { wet: 0.08 });
    if (bar >= 4) for (let k = 0; k < 4; k++) mix.add(t + k * BEAT + BEAT / 2, hat(0.1 + (bar - 4) * 0.02), { pan: 0.4, wet: 0.15 });
    mix.add(t, bass(CH[c].root + 12, BAR * 0.9, 0.35), { wet: 0.05 });
  });
  playMotif(mix, 0, MOTIF_A, { gain: 0.7 }); playMotif(mix, 1, MOTIF_B, { gain: 0.7 });
  playMotif(mix, 4, MOTIF_A, { gain: 0.4, voice: 'piano', octave: -12 }); playMotif(mix, 5, MOTIF_B, { gain: 0.4, voice: 'piano', octave: -12 });
  reverb(mix);
  // Fold the tail back onto the start, so the loop point is seamless
  const n = Math.round(OVERTURE.duration * SR);
  const out = new Mix(OVERTURE.duration);
  for (let i = 0; i < mix.L.length; i++) { const j = i % n; out.L[j] += mix.L[i]; out.R[j] += mix.R[i]; }
  let max = 0;
  for (let i = 0; i < n; i++) { out.L[i] = Math.tanh(out.L[i]); out.R[i] = Math.tanh(out.R[i]); max = Math.max(max, Math.abs(out.L[i]), Math.abs(out.R[i])); }
  const g = 0.7 / max; // quieter than the story: background music
  for (let i = 0; i < n; i++) { out.L[i] *= g; out.R[i] *= g; }
  return out;
};

/** The Golden Gate: a shimmer and a warm swell, about four seconds. */
const gateCue = () => {
  seed = 37;
  const mix = new Mix(GATE_CUE.duration);
  shimmer(mix, 0.05, 74, 1);
  mix.add(0, pad(CH.D.pad, 1.6, 1.2, 2600), { wet: 0.5 });
  mix.add(0.05, bell(86, 0.6, 3.2), { gain: 0.5, wet: 0.6 });
  mix.add(0, bass(38, 1.8, 0.6), { wet: 0.1 });
  master(mix, 0.75, 0.01, 1.2);
  return mix;
};

/** Live preview: a crowd, a four-on-the-floor groove and bright chords. */
const previewLive = () => {
  seed = 41;
  const mix = new Mix(PREVIEW.duration);
  mix.add(0, crowd(PREVIEW.duration, (t) => Math.min(1, t / 0.8)), { gain: 1.1, wet: 0.35 });
  ['D', 'A'].forEach((c, bar) => {
    const t = 0.4 + bar * BAR;
    for (let k = 0; k < 4; k++) mix.add(t + k * BEAT, kick(0.8), { wet: 0.08 });
    for (const k of [1, 3]) mix.add(t + k * BEAT, clap(0.55), { wet: 0.35 });
    for (let k = 0; k < 8; k++) mix.add(t + k * BEAT / 2, bass(CH[c].root + (k % 2 ? 12 : 0), BEAT * 0.42, 0.7), { wet: 0.04 });
    for (const k of [0, 1.5, 3]) mix.add(t + k * BEAT, pad(CH[c].pad.map((m) => m + 12), BEAT * 0.6, 1.4, 3600), { gain: 0.9, wet: 0.35 });
  });
  playMotif(mix, 0.16, MOTIF_A, { voice: 'bell', gain: 0.8 });
  master(mix, 0.8, 0.3, 1.4);
  return mix;
};

/** At-home preview: warm room, soft keys and a gentle beat. */
const previewHome = () => {
  seed = 53;
  const mix = new Mix(PREVIEW.duration);
  ['D', 'Bm'].forEach((c, bar) => {
    const t = 0.3 + bar * BAR;
    mix.add(t, pad(CH[c].pad, BAR, 0.8, 1100), { wet: 0.5 });
    arpeggio(mix, bar + 0.12, c, FLOW, 0.34);
    mix.add(t, kick(0.35), { wet: 0.1 }); mix.add(t + 2 * BEAT, kick(0.3), { wet: 0.1 });
    for (const k of [1, 3]) mix.add(t + k * BEAT, clap(0.18), { wet: 0.4 });
  });
  playMotif(mix, 0.12, MOTIF_A, { voice: 'piano', gain: 0.7 });
  master(mix, 0.7, 0.4, 1.6);
  return mix;
};

/* ---------------- render ---------------- */

const pieces: [keyof typeof TRACKS, () => Mix, number][] = [
  ['story', soundOfDreams, 160000],
  ['overture', overtureLoop, 128000],
  ['gate', gateCue, 128000],
  ['previewLive', previewLive, 128000],
  ['previewHome', previewHome, 128000],
];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tavy-audio-'));
fs.mkdirSync(path.join(OUT, 'audio'), { recursive: true });
for (const [id, render, bitrate] of pieces) {
  const t0 = Date.now();
  const mix = render();
  const wav = path.join(tmp, `${id}.wav`);
  writeWav(wav, mix);
  const out = path.join(OUT, TRACKS[id]);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', String(bitrate), '-q', '127', wav, out]);
  console.log(`${TRACKS[id]}  ${(mix.L.length / SR).toFixed(2)} s  ${Math.round(fs.statSync(out).size / 1024)} KB  (${Date.now() - t0} ms)`);
  if (KEEP_WAV) console.log(`  wav: ${wav}`);
}
if (!KEEP_WAV) fs.rmSync(tmp, { recursive: true, force: true });

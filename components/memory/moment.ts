/**
 * "Save this moment": what a concert screen hands to the Memory Book. Only text the concert already
 * shows (mode, song title, artist) is passed, never media, images or anything about the user, and it
 * only ever fills in the New memory form: nothing is saved until the user presses Save.
 */

export type MomentMode = 'live' | 'at-home';

/** What a concert screen may offer. Every field is optional apart from the mode. */
export interface ConcertMoment {
  mode: MomentMode;
  title?: string;
  artist?: string;
}

/** Validated starting values for the New memory form. */
export interface MemoryPrefill {
  title: string;
  date: string;
  note: string;
  /** Plain-language source, shown in the form, e.g. "At-home Concert". */
  source: string;
}

export const TITLE_MAX = 80;
export const NOTE_MAX = 600;
const FIELD_MAX = 60;

/** Today on this device as YYYY-MM-DD. */
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const MODE_LABEL: Record<MomentMode, string> = { live: 'Live Concert', 'at-home': 'At-home Concert' };

/** A short single line of plain text, or undefined if the value isn't usable. */
const cleanText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  // eslint-disable-next-line no-control-regex
  const text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, FIELD_MAX).trim();
  return text || undefined;
};

/**
 * Turn whatever a concert screen passed into safe form values. Anything unexpected is ignored, and
 * missing details fall back to the concert mode's name, so the form always opens in a usable state.
 * Returns null when the input isn't a moment at all.
 */
export const momentPrefill = (input: unknown): MemoryPrefill | null => {
  if (!input || typeof input !== 'object') return null;
  const { mode, title, artist } = input as Record<string, unknown>;
  if (mode !== 'live' && mode !== 'at-home') return null;
  const source = MODE_LABEL[mode];
  const song = cleanText(title);
  const by = cleanText(artist);
  const heading = song ? (by ? `${song} · ${by}` : song) : source;
  const note = song ? `${source}: “${song}”${by ? ` by ${by}` : ''}.` : '';
  return { title: heading.slice(0, TITLE_MAX), date: todayIso(), note: note.slice(0, NOTE_MAX), source };
};

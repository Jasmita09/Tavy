/** Lighting moods for the Halo concept viewer. Colours only; the model itself never changes. */
export type HaloPresetId = 'violet' | 'electric-blue' | 'golden-beat';

export interface HaloPreset {
  id: HaloPresetId;
  label: string;
  /** Key light from the upper front. */
  key: string;
  /** Rim light from behind, separates the cuff from the background. */
  rim: string;
  /** The light window's gradient, left to right. */
  glow: [string, string];
  /** Soft tint behind the model on the light showcase stage (CSS). */
  backdrop: string;
}

export const HALO_PRESETS: HaloPreset[] = [
  {
    id: 'violet',
    label: 'Violet',
    key: '#e9e2ff',
    rim: '#8b5cf6',
    glow: ['#fdba74', '#c4b5fd'],
    backdrop: 'radial-gradient(ellipse at 50% 46%, rgba(141,114,232,0.26), rgba(242,238,250,0) 62%)',
  },
  {
    id: 'electric-blue',
    label: 'Electric Blue',
    key: '#e0f2ff',
    rim: '#3b82f6',
    glow: ['#93c5fd', '#a5b4fc'],
    backdrop: 'radial-gradient(ellipse at 50% 46%, rgba(96,165,250,0.26), rgba(242,238,250,0) 62%)',
  },
  {
    id: 'golden-beat',
    label: 'Golden Beat',
    key: '#fff4e0',
    rim: '#f59e0b',
    glow: ['#fcd34d', '#fb923c'],
    backdrop: 'radial-gradient(ellipse at 50% 46%, rgba(246,180,120,0.32), rgba(242,238,250,0) 62%)',
  },
];

export const haloPreset = (id: HaloPresetId): HaloPreset => HALO_PRESETS.find((p) => p.id === id) ?? HALO_PRESETS[0];

/**
 * Companion App tabs that other pages can open directly, as #/app/<slug> (plain #/app opens Live Venue).
 * Only these slugs are accepted; anything else falls back to the default tab.
 */
export type CompanionTab = 'venue' | 'stream' | 'halo' | 'history';

const SLUGS: Record<CompanionTab, string> = {
  venue: 'venue',
  stream: 'stream',
  halo: 'halo',
  history: 'safety',
};

export const COMPANION_TAB_LABELS: Record<CompanionTab, string> = {
  venue: 'Live Venue',
  stream: 'Stage Stream',
  halo: 'Halo Device',
  history: 'Safety & Log',
};

export const DEFAULT_COMPANION_TAB: CompanionTab = 'venue';

/** The sub-path for a tab (navigate('companion-app', slug)) and the full hash, for links. */
export const companionTabSlug = (tab: CompanionTab) => SLUGS[tab];
export const companionTabHash = (tab: CompanionTab) => `#/app/${SLUGS[tab]}`;

/** The tab named in a #/app/<slug> hash, or null when there is none (or it isn't a known tab). */
export const companionTabFromHash = (hash: string): CompanionTab | null => {
  const match = /^#\/app\/([a-z]+)$/.exec(hash);
  if (!match) return null;
  return (Object.keys(SLUGS) as CompanionTab[]).find((tab) => SLUGS[tab] === match[1]) ?? null;
};

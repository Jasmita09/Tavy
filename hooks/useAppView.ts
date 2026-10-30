import { useCallback, useEffect, useState } from 'react';

/**
 * Top-level views. Routing is hash-based so it works under the GitHub Pages
 * `/Tavy/` base path without server rewrites, and the browser back button
 * moves between views.
 */
export type AppView = 'website' | 'companion-app' | 'experience' | 'live-venue' | 'at-home' | 'halo' | 'memory-book';

const VIEW_HASHES: Record<AppView, string> = {
  website: '',
  'companion-app': '#/app',
  experience: '#/experience',
  'live-venue': '#/experience/live',
  'at-home': '#/experience/home',
  halo: '#/halo',
  'memory-book': '#/memories',
};

// Views that also accept a sub-path, e.g. #/app/halo opens the Companion App on its Halo tab.
const SUB_PATH_VIEWS: AppView[] = ['companion-app'];

const viewFromHash = (hash: string): AppView =>
  (Object.keys(VIEW_HASHES) as AppView[]).find(
    (view) => view !== 'website' && VIEW_HASHES[view] === hash
  ) ??
  SUB_PATH_VIEWS.find((view) => hash.startsWith(`${VIEW_HASHES[view]}/`)) ??
  'website';

export const useAppView = () => {
  const [view, setView] = useState<AppView>(() => viewFromHash(window.location.hash));

  useEffect(() => {
    const syncFromLocation = () => setView(viewFromHash(window.location.hash));
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  /** `sub` adds a sub-path for views that accept one (see SUB_PATH_VIEWS). */
  const navigate = useCallback((next: AppView, sub?: string) => {
    const hash = sub && SUB_PATH_VIEWS.includes(next) ? `${VIEW_HASHES[next]}/${sub}` : VIEW_HASHES[next];
    if (window.location.hash !== hash) {
      // pushState keeps the /Tavy/ path intact and adds a history entry
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    }
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  return { view, navigate };
};

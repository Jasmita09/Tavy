import { useCallback, useEffect, useState } from 'react';

/**
 * Top-level views. Routing is hash-based so it works under the GitHub Pages
 * `/Tavy/` base path without server rewrites, and the browser back button
 * moves between views.
 */
export type AppView = 'website' | 'companion-app' | 'experience' | 'live-venue' | 'at-home' | 'halo';

const VIEW_HASHES: Record<AppView, string> = {
  website: '',
  'companion-app': '#/app',
  experience: '#/experience',
  'live-venue': '#/experience/live',
  'at-home': '#/experience/home',
  halo: '#/halo',
};

const viewFromHash = (hash: string): AppView =>
  (Object.keys(VIEW_HASHES) as AppView[]).find(
    (view) => view !== 'website' && VIEW_HASHES[view] === hash
  ) ?? 'website';

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

  const navigate = useCallback((next: AppView) => {
    const hash = VIEW_HASHES[next];
    if (window.location.hash !== hash) {
      // pushState keeps the /Tavy/ path intact and adds a history entry
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    }
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  return { view, navigate };
};

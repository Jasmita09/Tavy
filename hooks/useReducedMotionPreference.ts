import { useEffect, useState } from 'react';

// Same key the concert modes save their accessibility settings under (aurabeat/hooks/useSettings.ts).
const CONCERT_SETTINGS_KEY = 'tavy.concert.settings';

const savedReduceMotion = (): boolean => {
  if (document.documentElement.dataset.reducedMotion === 'true') return true;
  try {
    const saved = JSON.parse(localStorage.getItem(CONCERT_SETTINGS_KEY) ?? 'null') as { reducedMotion?: unknown } | null;
    return saved?.reducedMotion === true;
  } catch {
    return false;
  }
};

/**
 * True when motion should be minimised: the OS "reduce motion" setting, or Reduce Motion saved in
 * the concert settings. Read-only, so it never writes preferences the user didn't choose.
 */
export const useReducedMotionPreference = (): boolean => {
  const [reduced, setReduced] = useState(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    return media.matches || savedReduceMotion();
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches || savedReduceMotion());
    media.addEventListener('change', sync);
    window.addEventListener('storage', sync);
    return () => {
      media.removeEventListener('change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return reduced;
};

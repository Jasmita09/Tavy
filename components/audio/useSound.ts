import { useSyncExternalStore } from 'react';
import { getSoundState, subscribeSound, type SoundState } from './soundEngine';

/** The sound engine's state, for components that show sound controls. */
export const useSound = (): SoundState => useSyncExternalStore(subscribeSound, getSoundState, getSoundState);

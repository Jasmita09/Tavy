import { Home, Ticket } from 'lucide-react';
import type { ConcertMode } from './ConcertCarousel';
import liveCrowdImg from '../../src/assets/images/web/live-crowd.jpg';
import homePerformerImg from '../../src/assets/images/web/home-performer.jpg';

/**
 * The two concert modes, shared by the landing page and the experience selection screen.
 * Each card's Start button calls the handler that navigates to #/experience/live or #/experience/home.
 */
export const concertModes = (onSelectLive: () => void, onSelectHome: () => void): ConcertMode[] => [
  {
    id: 'live-venue',
    title: 'Live Concert',
    tagline: 'Feel alive at concert.',
    image: liveCrowdImg,
    imageAlt: 'A crowd holding up lights in front of a bright arena stage',
    icon: Ticket,
    scene: 'live',
    highlights: ['Phone lightstick', 'Visual beat cues', 'BASS · BUILD · CHORUS · DROP', 'Optional haptics'],
    onSelect: onSelectLive,
  },
  {
    id: 'at-home',
    title: 'At-home Concert',
    tagline: 'Feel the concert at home.',
    image: homePerformerImg,
    imageAlt: 'A singer performing on stage, as seen on a concert stream',
    icon: Home,
    scene: 'home',
    highlights: ['Concert video', 'Synced lyrics', 'Virtual stage', 'Tap to Wave', 'Timing score'],
    onSelect: onSelectHome,
  },
];

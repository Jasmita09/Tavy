/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { GlobalNavbar } from './components/GlobalNavbar';
import { HomePortal, SiteFooter } from './components/HomePortal';
import { TavyCompanionApp } from './components/TavyCompanionApp';
import { ExperienceSelect } from './components/experience/ExperienceSelect';
import { ConcertErrorBoundary } from './components/experience/ConcertErrorBoundary';
import { useAppView } from './hooks/useAppView';

// The concert modes (ported from AuraBeat) load on demand so the landing page stays light.
const LiveConcert = lazy(() => import('./aurabeat/pages/LiveConcert'));
const AtHomeConcert = lazy(() => import('./aurabeat/pages/AtHomeConcert'));
// The Halo 3D showcase (and three.js with it) also loads only when opened.
const HaloShowcase = lazy(() => import('./components/halo/HaloShowcase'));
const concertFallback = <div className="min-h-screen bg-[#090a0f]" />;
const pageFallback = <div className="min-h-screen bg-tv-canvas" />;

const AppContent: React.FC = () => {
  const { view, navigate } = useAppView();

  // If in companion app view, render interactive mobile simulation
  if (view === 'companion-app') {
    return (
      <TavyCompanionApp
        onBackToWebsite={() => navigate('website')}
        onEnterExperience={() => navigate('experience')}
      />
    );
  }

  if (view === 'experience') {
    return (
      <ExperienceSelect
        onSelectLiveVenue={() => navigate('live-venue')}
        onSelectAtHome={() => navigate('at-home')}
        onOpenCompanionApp={() => navigate('companion-app')}
        onBackToWebsite={() => navigate('website')}
        onOpenHaloShowcase={() => navigate('halo')}
      />
    );
  }

  if (view === 'halo') {
    return (
      <ConcertErrorBoundary
        key={view}
        onBack={() => navigate('website')}
        title="The Halo showcase couldn't load"
        backLabel="Back to TΛVY Website"
      >
        <Suspense fallback={pageFallback}>
          <HaloShowcase
            onBack={() => navigate('website')}
            onEnterExperience={() => navigate('experience')}
            onOpenCompanionApp={() => navigate('companion-app')}
          />
        </Suspense>
      </ConcertErrorBoundary>
    );
  }

  if (view === 'live-venue') {
    return (
      <ConcertErrorBoundary key={view} onBack={() => navigate('experience')}>
        <Suspense fallback={concertFallback}>
          <LiveConcert onExit={() => navigate('experience')} onSwitchMode={() => navigate('at-home')} />
        </Suspense>
      </ConcertErrorBoundary>
    );
  }

  if (view === 'at-home') {
    return (
      <ConcertErrorBoundary key={view} onBack={() => navigate('experience')}>
        <Suspense fallback={concertFallback}>
          <AtHomeConcert onExit={() => navigate('experience')} onSwitchMode={() => navigate('live-venue')} />
        </Suspense>
      </ConcertErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-tv-canvas text-tv-navy overflow-x-hidden selection:bg-tv-accent/30">
      <GlobalNavbar onEnterExperience={() => navigate('experience')} />
      <main>
        <HomePortal
          onEnterExperience={() => navigate('experience')}
          onSelectLiveVenue={() => navigate('live-venue')}
          onSelectAtHome={() => navigate('at-home')}
          onOpenHaloShowcase={() => navigate('halo')}
          onOpenCompanionApp={() => navigate('companion-app')}
        />
      </main>
      <SiteFooter
        onEnterExperience={() => navigate('experience')}
        onOpenHaloShowcase={() => navigate('halo')}
        onOpenCompanionApp={() => navigate('companion-app')}
      />
    </div>
  );
};

// reducedMotion="user" makes every framer-motion animation honor prefers-reduced-motion
export const App: React.FC = () => (
  <MotionConfig reducedMotion="user">
    <AppContent />
  </MotionConfig>
);

export default App;

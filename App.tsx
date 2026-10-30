/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { GlobalNavbar } from './components/GlobalNavbar';
import { HomePortal, SiteFooter } from './components/HomePortal';
import { TavyCompanionApp } from './components/TavyCompanionApp';
import { ExperienceSelect } from './components/experience/ExperienceSelect';
import { ConcertErrorBoundary } from './components/experience/ConcertErrorBoundary';
import { useAppView, type AppView } from './hooks/useAppView';
import { momentPrefill, type MemoryPrefill } from './components/memory/moment';
import { companionTabSlug } from './components/companionTabs';
import { stopAll } from './components/audio/soundEngine';
import type { ToolTarget } from './components/home/CompanionTools';

// The concert modes (ported from AuraBeat) load on demand so the landing page stays light.
const LiveConcert = lazy(() => import('./aurabeat/pages/LiveConcert'));
const AtHomeConcert = lazy(() => import('./aurabeat/pages/AtHomeConcert'));
// The Halo 3D showcase (and three.js with it) also loads only when opened.
const HaloShowcase = lazy(() => import('./components/halo/HaloShowcase'));
// The Memory Book (IndexedDB storage and the book itself) loads only when opened.
const MemoryBook = lazy(() => import('./components/memory/MemoryBook'));
const concertFallback = <div className="min-h-screen bg-[#090a0f]" />;
const pageFallback = <div className="min-h-screen bg-tv-canvas" />;

const AppContent: React.FC = () => {
  const { view, navigate } = useAppView();
  // "Save this moment" from a concert: validated, held in memory only (a refresh drops it), used once.
  const [moment, setMoment] = useState<MemoryPrefill | null>(null);
  const saveMoment = (input: unknown) => {
    setMoment(momentPrefill(input));
    navigate('memory-book');
  };
  useEffect(() => {
    if (view !== 'memory-book') setMoment(null);
  }, [view]);

  // The Golden Symphony's music belongs to the landing page: leaving it (for a concert, the Companion
  // App, anything) silences it at once, so it never plays over a concert's own sound.
  useEffect(() => {
    if (view !== 'website') stopAll();
  }, [view]);

  // A tool opened from the Accessibility section: remember the link used, so coming back (the back
  // button or browser Back) returns to that link instead of the top of the page.
  const [returnTo, setReturnTo] = useState<{ via: AppView; originId: string } | null>(null);
  const [openSettings, setOpenSettings] = useState(false);
  const openTool = (target: ToolTarget, originId: string) => {
    setReturnTo({ via: target.view, originId });
    setOpenSettings(target.view === 'at-home' && !!target.settings);
    navigate(target.view, target.view === 'companion-app' && target.tab ? companionTabSlug(target.tab) : undefined);
  };
  useEffect(() => {
    if (view !== 'at-home') setOpenSettings(false);
    if (!returnTo || view === returnTo.via) return;
    setReturnTo(null);
    if (view !== 'website') return;
    // After the landing page has rendered: bring the link back into view and focus it
    requestAnimationFrame(() => {
      const origin = document.getElementById(returnTo.originId);
      origin?.scrollIntoView({ block: 'center' });
      origin?.focus({ preventScroll: true });
    });
    // Only a view change should run this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
  const fromAccessibility = returnTo?.via === view;

  // If in companion app view, render interactive mobile simulation
  if (view === 'companion-app') {
    return (
      <TavyCompanionApp
        onBackToWebsite={() => navigate('website')}
        backLabel={fromAccessibility ? 'Back to Accessibility' : undefined}
        onEnterExperience={() => navigate('experience')}
        onOpenMemoryBook={() => navigate('memory-book')}
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

  if (view === 'memory-book') {
    return (
      <ConcertErrorBoundary
        key={view}
        onBack={() => navigate('website')}
        title="The Memory Book couldn't load"
        backLabel="Back to TΛVY Website"
      >
        <Suspense fallback={pageFallback}>
          <MemoryBook prefill={moment} onBack={() => navigate('website')} />
        </Suspense>
      </ConcertErrorBoundary>
    );
  }

  if (view === 'live-venue') {
    return (
      <ConcertErrorBoundary key={view} onBack={() => navigate('experience')}>
        <Suspense fallback={concertFallback}>
          <LiveConcert
            onExit={() => navigate('experience')}
            onSwitchMode={() => navigate('at-home')}
            onSaveMoment={saveMoment}
          />
        </Suspense>
      </ConcertErrorBoundary>
    );
  }

  if (view === 'at-home') {
    return (
      <ConcertErrorBoundary key={view} onBack={() => navigate('experience')}>
        <Suspense fallback={concertFallback}>
          <AtHomeConcert
            onExit={() => navigate('experience')}
            onSwitchMode={() => navigate('live-venue')}
            onSaveMoment={saveMoment}
            openSettings={openSettings}
          />
        </Suspense>
      </ConcertErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-tv-canvas text-tv-navy overflow-x-hidden selection:bg-tv-accent/30">
      <GlobalNavbar onEnterExperience={() => navigate('experience')} onOpenCompanionApp={() => navigate('companion-app')} />
      <main>
        <HomePortal
          onEnterExperience={() => navigate('experience')}
          onSelectLiveVenue={() => navigate('live-venue')}
          onSelectAtHome={() => navigate('at-home')}
          onOpenHaloShowcase={() => navigate('halo')}
          onOpenCompanionApp={() => navigate('companion-app')}
          onOpenMemoryBook={() => navigate('memory-book')}
          onOpenTool={openTool}
        />
      </main>
      <SiteFooter
        onEnterExperience={() => navigate('experience')}
        onOpenHaloShowcase={() => navigate('halo')}
        onOpenCompanionApp={() => navigate('companion-app')}
        onOpenMemoryBook={() => navigate('memory-book')}
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

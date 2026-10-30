import React, { useCallback, useId, useRef, useState } from 'react';
import { ArrowRight, AudioWaveform, Captions, SlidersHorizontal, Vibrate } from 'lucide-react';
import { useReducedMotionPreference } from '../hooks/useReducedMotionPreference';
import { ConcertCarousel } from './experience/ConcertCarousel';
import { concertModes } from './experience/concertModes';
import { HaloViewer } from './halo/HaloViewer';
import { GoldenHero } from './golden/GoldenHero';
import { GoldenJourney, webglAvailable } from './golden/GoldenJourney';
import { GoldenGateBackdrop } from './golden/GoldenGate';
import { MotionToggle } from './golden/MotionToggle';
import { GoldenWaves, HaloSilhouette } from './golden/HaloAssembly';
import { useScrollProgress } from './golden/useScrollProgress';
import { FeelTheInvisible } from './feel/FeelTheInvisible';
import { goToSection } from './GlobalNavbar';
import { Button, buttonClass } from './ui/Button';
import { Accent, SectionHeading } from './ui/SectionHeading';
import { Reveal } from './ui/Reveal';
import { CONTAINER, EYEBROW, FOCUS_LIGHT, SECTION_Y } from './ui/tokens';
import stageLightsImg from '../src/assets/images/web/stage-lights.jpg';
import liveCrowdImg from '../src/assets/images/web/live-crowd.jpg';

interface HomePortalProps {
  onEnterExperience: () => void;
  onSelectLiveVenue: () => void;
  onSelectAtHome: () => void;
  onOpenHaloShowcase: () => void;
  onOpenCompanionApp: () => void;
  onOpenMemoryBook: () => void;
}

const ACCESS_FEATURES = [
  { icon: AudioWaveform, title: 'Visual Beats', body: 'See the beat as light, with cue words like BASS and DROP.' },
  { icon: Vibrate, title: 'Haptics', body: 'Optional vibration on supported phones. Off whenever you like.' },
  { icon: Captions, title: 'Lyrics', body: 'Lyrics and captions timed to the performance, where available.' },
  { icon: SlidersHorizontal, title: 'Personalize', body: 'Reduce Motion, High Contrast and sensory settings, shared by both modes.' },
];

/* ---------- 5. Beyond the concert: small illustrations ---------- */
const TicketArt: React.FC = () => (
  <div aria-hidden="true" className="flex h-full items-center justify-center bg-tv-peach/45">
    <div className="relative flex h-24 w-48 rotate-[-6deg] overflow-hidden rounded-xl bg-tv-paper shadow-tv-soft">
      <div className="flex-1 space-y-2 p-3.5">
        <span className="block h-2 w-16 rounded-full bg-tv-navy/80" />
        <span className="block h-1.5 w-24 rounded-full bg-tv-navy/20" />
        <span className="block h-1.5 w-20 rounded-full bg-tv-navy/20" />
      </div>
      <div className="w-12 border-l-2 border-dashed border-tv-line bg-tv-mist" />
    </div>
  </div>
);

const MemoryArt: React.FC = () => (
  <div aria-hidden="true" className="relative flex h-full items-center justify-center bg-tv-mist">
    <img src={stageLightsImg} alt="" loading="lazy" className="absolute h-24 w-32 rotate-[-8deg] translate-x-[-30%] rounded-lg border-4 border-white object-cover shadow-tv-soft" />
    <img src={liveCrowdImg} alt="" loading="lazy" className="absolute h-24 w-32 rotate-[6deg] translate-x-[25%] rounded-lg border-4 border-white object-cover shadow-tv-soft" />
  </div>
);

const ShareArt: React.FC = () => (
  <div aria-hidden="true" className="flex h-full items-center justify-center bg-tv-sky/50">
    <div className="flex -space-x-3">
      {['bg-tv-blush', 'bg-tv-accent', 'bg-tv-peach', 'bg-tv-navy'].map((c) => (
        <span key={c} className={`size-14 rounded-full border-4 border-white ${c}`} />
      ))}
    </div>
  </div>
);

const StatusTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="rounded-full border border-tv-line bg-tv-paper px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-tv-slate">
    {children}
  </span>
);

export const HomePortal: React.FC<HomePortalProps> = ({
  onEnterExperience,
  onSelectLiveVenue,
  onSelectAtHome,
  onOpenHaloShowcase,
  onOpenCompanionApp,
  onOpenMemoryBook,
}) => {
  const reduced = useReducedMotionPreference();
  const haloConceptId = useId();
  // One shared golden journey: silk in the hero, notes travelling to the gate around the concert carousel.
  const [use3d, setUse3d] = useState(webglAvailable);
  const [motionOn, setMotionOn] = useState(true);
  const toggleMotion = useCallback(() => setMotionOn((on) => !on), []);
  const artRef = useRef<HTMLDivElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLElement>(null);
  const showToggle = use3d && !reduced;
  // Halo assembly: golden waves and the silhouette, then the model (scroll-linked, written as --halo-p)
  const haloRef = useRef<HTMLElement>(null);
  const haloViewerRef = useRef<HTMLDivElement>(null);
  const [assembled, setAssembled] = useState(false);
  useScrollProgress(haloRef, haloRef, haloViewerRef, { name: '--halo-p', endLine: 0.6, still: reduced || !use3d });

  return (
    // isolate: the fixed journey layer (z-0) sits above the page background and below the content
    <div className="relative isolate w-full">
      {use3d && (
        <GoldenJourney
          artRef={artRef}
          gateRef={gateRef}
          endRef={experienceRef}
          motionOn={motionOn}
          reduced={reduced}
          onUnavailable={() => setUse3d(false)}
        />
      )}

      <div className="relative">
        <GoldenHero
          reduced={reduced}
          use3d={use3d}
          motionOn={motionOn}
          onToggleMotion={toggleMotion}
          artRef={artRef}
          onExplore={() => goToSection('experience')}
          onDiscover={() => goToSection('accessibility')}
        />
      </div>

      {/* 2. The two concert experiences, revealed by the golden gate */}
      <section ref={experienceRef} id="experience" aria-labelledby="experience-title" className={`relative ${SECTION_Y} scroll-mt-16`}>
        <div className={CONTAINER}>
          <Reveal>
            <SectionHeading
              id="experience-title"
              eyebrow="Choose your experience"
              title={
                <>
                  Same Music. <Accent>Different Places.</Accent>
                </>
              }
            />
          </Reveal>
          <div
            ref={gateRef}
            data-motion={motionOn ? undefined : 'off'}
            className="relative mt-28 sm:mt-32"
            style={{ '--gate-light': 1 } as React.CSSProperties}
          >
            <GoldenGateBackdrop drawArch={!use3d} />
            <div className="relative">
              <ConcertCarousel modes={concertModes(onSelectLiveVenue, onSelectAtHome)} titleAs="h3" />
            </div>
          </div>
          {showToggle && (
            <div className="relative mt-6 flex justify-center">
              <MotionToggle motionOn={motionOn} onToggle={toggleMotion} />
            </div>
          )}
        </div>
      </section>

      {/* 3. Accessibility for everyone */}
      <section id="accessibility" aria-labelledby="accessibility-title" className={`relative z-[1] ${SECTION_Y} scroll-mt-16 bg-tv-paper`}>
        <div className={`${CONTAINER} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
          <Reveal className="space-y-10">
            <SectionHeading
              id="accessibility-title"
              eyebrow="Accessibility for everyone"
              title={
                <>
                  Music Has More Than One Way to <Accent>Be Felt.</Accent>
                </>
              }
              intro="Designed with Deaf and hard-of-hearing audiences in mind. Built for everyone."
            />
            <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {ACCESS_FEATURES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="space-y-2 border-t border-tv-line pt-5">
                  <Icon className="w-5 h-5 text-tv-accent-ink" aria-hidden="true" />
                  <h3 className="font-semibold text-tv-navy">{title}</h3>
                  <p className="text-sm leading-relaxed text-tv-slate">{body}</p>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-tv-slate">
              Visual and haptic cues add to the music; they don't replace hearing it.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <FeelTheInvisible reduced={reduced} motionOn={motionOn} onToggleMotion={toggleMotion} />
          </Reveal>
        </div>
      </section>

      {/* 4. Halo haptic concept */}
      <section
        ref={haloRef}
        id="halo"
        aria-labelledby="halo-title"
        data-assembled={assembled || undefined}
        className={`tv-halo-assembly relative z-[1] ${SECTION_Y} scroll-mt-16 bg-tv-canvas`}
      >
        {use3d && <GoldenWaves sectionRef={haloRef} stageRef={haloViewerRef} />}
        <div className={`${CONTAINER} relative grid items-center gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16`}>
          <Reveal className="space-y-6">
            <SectionHeading
              id="halo-title"
              eyebrow="Halo haptic concept"
              title={
                <>
                  A New Way to <Accent>Feel Music.</Accent>
                </>
              }
              intro="Halo is a wearable concept that would turn musical cues into gentle pulses on the wrist. Turn it, zoom in and try each lighting mood."
            />
            <p id={haloConceptId} className="text-sm leading-relaxed text-tv-slate">
              <strong className="text-tv-navy">Concept visualisation.</strong> Not manufactured hardware; no final
              specifications.
            </p>
            <button onClick={onOpenHaloShowcase} className={buttonClass('primary', 'lg')}>
              Explore Halo
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </Reveal>
          <Reveal delay={0.1}>
            {/* Touching or focusing the viewer completes the assembly at once, so nothing waits on the animation */}
            <div ref={haloViewerRef} className="relative" onPointerDownCapture={() => setAssembled(true)} onFocusCapture={() => setAssembled(true)}>
              <HaloViewer conceptId={haloConceptId} deferUntilVisible />
              {use3d && !reduced && !assembled && <HaloSilhouette />}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. Beyond the concert */}
      <section id="memories" aria-labelledby="memories-title" className={`relative z-[1] ${SECTION_Y} scroll-mt-16 bg-tv-paper`}>
        <div className={CONTAINER}>
          <Reveal>
            <SectionHeading
              id="memories-title"
              eyebrow="Beyond the concert"
              title={
                <>
                  Every Concert Has <Accent>a Story.</Accent>
                </>
              }
            />
          </Reveal>
          <ul className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            <li className="flex">
              <Reveal className="flex h-full w-full flex-col">
                <div className="h-44 overflow-hidden rounded-tv-lg">
                  <TicketArt />
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-tv-navy">Concert Tickets</h3>
                  <StatusTag>Concept</StatusTag>
                </div>
                <p className="mt-1 text-tv-slate">Your journey starts here.</p>
              </Reveal>
            </li>
            <li className="flex">
              <Reveal delay={0.06} className="flex h-full w-full flex-col">
                <div className="h-44 overflow-hidden rounded-tv-lg">
                  <MemoryArt />
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-tv-navy">Memory Book</h3>
                  <StatusTag>On this device</StatusTag>
                </div>
                <p className="mt-1 text-tv-slate">Save and relive your moments.</p>
                <p className="mt-2 text-xs leading-relaxed text-tv-slate">
                  Add concert photos and notes as Polaroid pages. Saved in this browser only; nothing is uploaded.
                </p>
                <button onClick={onOpenMemoryBook} className={`${buttonClass('primary')} mt-4 self-start`}>
                  Open Memory Book
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button onClick={onOpenCompanionApp} className={`mt-1 inline-flex min-h-11 items-center self-start rounded text-sm font-medium text-tv-accent-ink underline-offset-4 hover:underline cursor-pointer ${FOCUS_LIGHT}`}>
                  Open Companion App (quick bookmarks demo)
                </button>
              </Reveal>
            </li>
            <li className="flex">
              <Reveal delay={0.12} className="flex h-full w-full flex-col">
                <div className="h-44 overflow-hidden rounded-tv-lg">
                  <ShareArt />
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-tv-navy">Share &amp; Connect</h3>
                  <StatusTag>Coming soon</StatusTag>
                </div>
                <p className="mt-1 text-tv-slate">Celebrate music together.</p>
              </Reveal>
            </li>
          </ul>
        </div>
      </section>

      {/* 6. Final call to action */}
      <section aria-labelledby="final-title" className="relative z-[1] py-20 sm:py-28 bg-tv-canvas">
        <div className={CONTAINER}>
          <Reveal>
            <div className="relative overflow-hidden rounded-tv-xl bg-tv-navy">
              <img src={stageLightsImg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-tv-navy/90 via-tv-navy/60 to-tv-navy/10" />
              <div className="relative max-w-xl space-y-6 px-6 py-16 sm:px-14 sm:py-24">
                <h2 id="final-title" className="text-4xl sm:text-6xl font-semibold tracking-[-0.04em] text-white">
                  Enter the <Accent>Experience.</Accent>
                </h2>
                <p className="text-lg text-white/80">Music brings us together — everywhere.</p>
                <button onClick={onEnterExperience} className={buttonClass('on-dark', 'lg')}>
                  Let's Go
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

/* ---------- Footer ---------- */
export const SiteFooter: React.FC<{
  onEnterExperience: () => void;
  onOpenHaloShowcase: () => void;
  onOpenCompanionApp: () => void;
  onOpenMemoryBook: () => void;
}> = ({ onEnterExperience, onOpenHaloShowcase, onOpenCompanionApp, onOpenMemoryBook }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const emailId = useId();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true);
      setTimeout(() => {
        setNewsletterEmail('');
        setNewsletterSubmitted(false);
      }, 4000);
    }
  };

  const footLink = `inline-flex min-h-11 items-center rounded text-sm text-tv-slate hover:text-tv-navy cursor-pointer text-left ${FOCUS_LIGHT}`;

  return (
    <footer className="border-t border-tv-line bg-tv-canvas">
      <div className={`${CONTAINER} grid gap-12 py-16 lg:grid-cols-[1.2fr_1fr_1fr]`}>
        <div className="space-y-5">
          <p className="text-2xl font-bold tracking-[-0.02em] text-tv-navy">TΛVY</p>
          <p className="font-serif italic text-xl text-tv-navy/80">Music without barriers.</p>
          <form onSubmit={handleNewsletterSubmit} className="max-w-sm space-y-2">
            <label htmlFor={emailId} className="text-sm font-medium text-tv-navy">
              Get updates from TΛVY
            </label>
            <div className="flex gap-2">
              <input
                id={emailId}
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="min-h-11 w-full rounded-full border border-tv-line bg-tv-paper px-4 text-sm text-tv-navy placeholder:text-tv-slate/70 focus:outline-none focus:ring-2 focus:ring-tv-accent-ink"
              />
              <Button type="submit">Subscribe</Button>
            </div>
            <p className="text-xs text-tv-slate" aria-live="polite">
              {newsletterSubmitted ? 'Thanks! (Demo only: no email is sent.)' : 'Demo form: no email is sent or stored.'}
            </p>
          </form>
        </div>

        <nav aria-label="Experiences" className="space-y-3">
          <p className={EYEBROW}>Experience</p>
          <ul>
            <li><button onClick={() => goToSection('experience')} className={footLink}>Live &amp; At-home Concert</button></li>
            <li><button onClick={() => goToSection('accessibility')} className={footLink}>Accessibility</button></li>
            <li><button onClick={onEnterExperience} className={footLink}>Enter Experience</button></li>
          </ul>
        </nav>

        <nav aria-label="Explore" className="space-y-3">
          <p className={EYEBROW}>Explore</p>
          <ul>
            <li><button onClick={onOpenHaloShowcase} className={footLink}>Halo concept in 3D</button></li>
            <li><button onClick={onOpenCompanionApp} className={footLink}>Companion App demo</button></li>
            <li><button onClick={onOpenMemoryBook} className={footLink}>Memory Book</button></li>
          </ul>
        </nav>
      </div>
      <div className={`${CONTAINER} space-y-3 border-t border-tv-line py-8 text-xs leading-relaxed text-tv-slate`}>
        <p>
          TΛVY Halo is a product concept. Device connections, sound-level readings, friend locations and SOS features shown on
          this site and in the demo apps are simulated. They are not medical or hearing-safety advice and do not contact
          emergency services.
        </p>
        <p>© 2026 TΛVY. All rights reserved.</p>
      </div>
    </footer>
  );
};

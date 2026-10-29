import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Maximize2, Plus, X } from 'lucide-react';
import { HaloDetailModal } from '../HaloDetailModal';
import { SectionHeading } from '../ui/SectionHeading';
import { buttonClass } from '../ui/Button';
import { CARD, EYEBROW, FOCUS_LIGHT } from '../ui/tokens';
import tavyHaloHeroImg from '../../src/assets/images/tavy_halo_hero_1792275821098.jpg';

// Moved here from the previous landing page so every interactive concept note stays available.

interface HotspotPin {
  id: string;
  name: string;
  badge: string;
  desc: string;
  top: string;
  left: string;
}

const HOTSPOTS: HotspotPin[] = [
  {
    id: 'fin',
    name: 'Pastel TIR Optical Waveguide',
    badge: 'Soft optical blade',
    desc: 'Channels light upward in soft pastel tones through a frosted optical blade, meant to read through haze without glaring at people nearby.',
    top: '55%',
    left: '54%',
  },
  {
    id: 'transducer',
    name: 'Dual Sub-Bass Haptic Actuators',
    badge: 'Wrist haptics',
    desc: 'Linear resonant actuators intended to turn kick and bass into pulses on the wrist, so rhythm can be felt as well as heard.',
    top: '46%',
    left: '44%',
  },
  {
    id: 'titanium',
    name: 'Titanium-toned Rim & SOS Switch',
    badge: 'Rim and hold switch',
    desc: 'A satin metal rim with a 3-second hold intended to send a proximity alert to nearby Halo wearers (concept; it does not contact emergency services).',
    top: '50%',
    left: '33%',
  },
  {
    id: 'antenna',
    name: 'Upper Arc & Mesh Radio',
    badge: 'Peer-to-peer radio',
    desc: 'An antenna along the upper arc intended to form a short-range cluster with nearby bands without cell signal or venue Wi-Fi.',
    top: '42%',
    left: '53%',
  },
];

const DESIGN_NOTES = [
  {
    title: 'Sub-bass you can feel',
    body: 'Dual actuators convert low-end frequencies into tactile pulses on the wrist, so Deaf and hard-of-hearing fans can follow the rhythm physically.',
    target: 'Target: 35–120 Hz kick and bass range',
  },
  {
    title: 'Soft crowd light',
    body: 'A frosted light blade glows in pastel tones in time with the show, instead of a harsh flashlight.',
    target: 'Target: anti-glare frosted acrylic',
  },
  {
    title: 'Offline friend mesh',
    body: 'When phone networks are overloaded, nearby bands could form a short-range radio cluster to ping friends.',
    target: 'Target: about 10 m peer-to-peer range',
  },
  {
    title: 'Sound exposure awareness',
    body: 'A microphone could track cumulative loudness and suggest a break, alongside big-text messages for noisy venues.',
    target: 'Target: readings up to 120 dB SPL',
  },
];

const SPEC_GROUPS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: 'Physical & acoustic',
    rows: [
      ['Chassis material', 'Titanium-toned metal'],
      ['Haptic actuator', 'Dual linear resonant actuators (35 Hz peak)'],
      ['Optical waveguide', 'Frosted acrylic light blade'],
      ['Sound sensor', 'Wide-range MEMS microphone (up to 120 dB SPL)'],
      ['Water & dust', 'IP68 target'],
    ],
  },
  {
    title: 'Connectivity & battery',
    rows: [
      ['Wireless', 'Bluetooth LE mesh (2.4 GHz)'],
      ['Mesh range', 'About 10 m peer-to-peer'],
      ['Battery', '42 h festival-mode target'],
      ['Charging', 'Magnetic contact charging'],
      ['Companion OS', 'iOS 16+ and Android 13+ target'],
    ],
  },
];

const disclosure = `group ${CARD} overflow-hidden`;
const summary = `flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 sm:px-7 py-4 text-left text-lg font-semibold text-tv-navy [&::-webkit-details-marker]:hidden ${FOCUS_LIGHT}`;
const chip = (on: boolean) =>
  `min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors cursor-pointer ${FOCUS_LIGHT} ${
    on ? 'border-tv-navy bg-tv-navy text-white' : 'border-tv-line bg-tv-paper text-tv-navy hover:border-tv-navy/30'
  }`;

const Disclosure: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <details className={disclosure}>
    <summary className={summary}>
      {title}
      <ChevronDown className="w-5 h-5 shrink-0 text-tv-slate transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
    </summary>
    <div className="border-t border-tv-line px-5 sm:px-7 py-6">{children}</div>
  </details>
);

export const HaloConceptDetails: React.FC<{ onOpenCompanionApp: () => void }> = ({ onOpenCompanionApp }) => {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeCam, setActiveCam] = useState<'main' | 'bias' | 'crowd'>('main');
  const [bigTextPreset, setBigTextPreset] = useState<'NEED WATER' | 'AT SOUNDBOOTH' | 'EXIT 4'>('NEED WATER');
  const [armAngleActive, setArmAngleActive] = useState<boolean>(true);
  const active = HOTSPOTS.find((pin) => pin.id === activeHotspot);

  return (
    <section aria-labelledby="concept-notes" className="space-y-10">
      <SectionHeading
        id="concept-notes"
        eyebrow="Concept notes"
        title="Inside the Halo concept"
        intro="The design intent behind Halo. Everything below is a concept target, not built or tested hardware."
      />

      {/* Anatomy: the hotspot explorer */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full select-none overflow-hidden bg-tv-mist">
          <img
            src={tavyHaloHeroImg}
            alt="Halo concept render on a warm stone pedestal"
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {HOTSPOTS.map((pin) => {
            const isActive = activeHotspot === pin.id;
            return (
              <div key={pin.id} className="absolute z-30" style={{ top: pin.top, left: pin.left }}>
                <button
                  onClick={() => setActiveHotspot(isActive ? null : pin.id)}
                  aria-expanded={isActive}
                  aria-label={pin.name}
                  className={`relative -translate-x-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full shadow-tv-soft transition-transform cursor-pointer ${FOCUS_LIGHT} ${
                    isActive ? 'bg-tv-navy text-white rotate-45' : 'bg-white/95 text-tv-navy hover:scale-105'
                  }`}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
        <AnimatePresence initial={false} mode="wait">
          {active && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-tv-line px-5 sm:px-7 py-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`${EYEBROW} text-[10px]`}>{active.badge}</span>
                  <h3 className="mt-1 font-semibold text-tv-navy">{active.name}</h3>
                </div>
                <button
                  onClick={() => setActiveHotspot(null)}
                  aria-label="Dismiss"
                  className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full text-tv-slate hover:bg-tv-mist cursor-pointer ${FOCUS_LIGHT}`}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tv-slate">{active.desc}</p>
              <button
                onClick={() => {
                  setActiveHotspot(null);
                  setIsDetailModalOpen(true);
                }}
                className={`mt-3 rounded text-sm font-semibold text-tv-violet-ink hover:underline cursor-pointer ${FOCUS_LIGHT}`}
              >
                Inspect Exploded View →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col gap-3 border-t border-tv-line px-5 sm:px-7 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-tv-slate">Select a + marker to read about each part.</p>
          <button onClick={() => setIsDetailModalOpen(true)} className={buttonClass('secondary')}>
            <Maximize2 className="w-4 h-4" aria-hidden="true" />
            Exploded View
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <Disclosure title="Design notes">
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {DESIGN_NOTES.map((note) => (
              <div key={note.title} className="space-y-2">
                <dt className="font-semibold text-tv-navy">{note.title}</dt>
                <dd className="text-sm leading-relaxed text-tv-slate">{note.body}</dd>
                <dd className="text-xs font-medium text-tv-violet-ink">{note.target}</dd>
              </div>
            ))}
          </dl>
        </Disclosure>

        <Disclosure title="Companion app previews">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Preview A: Virtual stage streaming */}
            <div className="space-y-4">
              <div className="rounded-[2rem] bg-tv-navy p-5 text-white space-y-4">
                <div className="flex items-center justify-between text-[11px] text-white/70">
                  <span>Virtual stage companion</span>
                  <span>Demo</span>
                </div>
                <div className="rounded-2xl bg-white/5 p-3.5">
                  <p className="text-sm font-bold">NOVA — &ldquo;Starlight Live&rdquo;</p>
                  <p className="text-[11px] text-white/70">Sample stream</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-white/70">Camera angle</span>
                  <div role="group" aria-label="Camera angle" className="grid grid-cols-3 gap-1.5">
                    {([['main', 'Main 4K'], ['bias', 'Bias Cam'], ['crowd', 'Dance Floor']] as const).map(([id, label]) => (
                      <button
                        key={id}
                        aria-pressed={activeCam === id}
                        onClick={() => setActiveCam(id)}
                        className={`min-h-10 rounded-xl border text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                          activeCam === id ? 'border-tv-violet bg-tv-violet/25 font-bold text-white' : 'border-white/15 bg-white/5 text-white/75'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex h-10 items-end justify-between gap-1 px-1" aria-hidden="true">
                  {[40, 70, 95, 60, 85, 100, 75, 90, 50, 80, 95, 65].map((h, i) => (
                    <span key={i} className="flex-1 rounded-full bg-tv-violet" style={{ height: `${h}%`, opacity: 0.45 + h / 220 }} />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-tv-navy">Virtual stage streaming</h3>
                <p className="text-sm leading-relaxed text-tv-slate">Switch camera angles while Halo pulses with the beat.</p>
              </div>
            </div>

            {/* Preview B: In-venue tools */}
            <div className="space-y-4">
              <div className="rounded-[2rem] bg-tv-navy p-5 text-white space-y-3.5">
                <div className="flex items-center justify-between text-[11px] text-white/70">
                  <span>Arena presence suite</span>
                  <span>Demo</span>
                </div>
                <div className="rounded-2xl bg-tv-peach p-3.5 text-center text-tv-navy">
                  <p className="text-[10px] font-bold uppercase tracking-wider">Big Text</p>
                  <p className="py-2 text-2xl font-black uppercase tracking-widest break-words" aria-live="polite">
                    {bigTextPreset}
                  </p>
                  <div role="group" aria-label="Big Text message" className="flex flex-wrap justify-center gap-1.5">
                    {(['NEED WATER', 'AT SOUNDBOOTH', 'EXIT 4'] as const).map((p) => (
                      <button
                        key={p}
                        aria-pressed={bigTextPreset === p}
                        onClick={() => setBigTextPreset(p)}
                        className={`min-h-9 rounded-lg border px-2 text-[10px] font-bold cursor-pointer ${FOCUS_LIGHT} ${
                          bigTextPreset === p ? 'border-tv-navy bg-tv-navy text-white' : 'border-tv-navy/20 bg-white/80 text-tv-navy'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Sound exposure (demo)</span>
                    <span className="font-bold">104 dB</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[64%] rounded-full bg-tv-peach" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/75">
                  <span>Arm-angle power saver</span>
                  <button
                    aria-pressed={armAngleActive}
                    onClick={() => setArmAngleActive(!armAngleActive)}
                    className="min-h-9 rounded-full border border-white/20 px-3 text-[11px] font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {armAngleActive ? 'Arm Raised (100%)' : 'Arm Down (20%)'}
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-tv-navy">In-venue tools</h3>
                <p className="text-sm leading-relaxed text-tv-slate">Big-text messages for loud rooms, and a sound-exposure gauge.</p>
              </div>
            </div>
          </div>
          <button onClick={onOpenCompanionApp} className={`${buttonClass('secondary')} mt-6`}>
            Open the Companion App demo
          </button>
        </Disclosure>

        <Disclosure title="Concept specification targets">
          <p className="mb-6 text-sm text-tv-slate">
            Early design targets for discussion. None of these have been manufactured or measured.
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            {SPEC_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className={EYEBROW}>{group.title}</h3>
                <dl className="mt-3 divide-y divide-tv-line text-sm">
                  {group.rows.map(([term, value]) => (
                    <div key={term} className="flex justify-between gap-4 py-2.5">
                      <dt className="text-tv-slate">{term}</dt>
                      <dd className="text-right font-medium text-tv-navy">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </Disclosure>
      </div>

      <HaloDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} />
    </section>
  );
};

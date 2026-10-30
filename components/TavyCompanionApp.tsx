import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Volume2,
  Radio,
  Sliders,
  Battery,
  Shield,
  Activity,
  Zap,
  Wifi,
  WifiOff,
  Compass,
  Maximize2,
  Minimize2,
  Sparkles,
  Camera,
  Play,
  Pause,
  AlertTriangle,
  Users,
  CheckCircle2,
  RefreshCw,
  Heart,
  Bookmark,
  Share2,
  ChevronRight,
  Bluetooth,
  Flame,
  Clock,
  Music,
  BarChart3,
  Thermometer,
  Disc3,
  Send
} from 'lucide-react';

import { buttonClass } from './ui/Button';
import { COMPANION_TAB_LABELS, DEFAULT_COMPANION_TAB, companionTabFromHash, companionTabHash, type CompanionTab } from './companionTabs';
import cinematicStageImg from '../src/assets/images/tavy_cinematic_stage_1792350376076.jpg';
import stageStreamImg from '../src/assets/images/concert_stage_stream_1792160451262.jpg';
import biasCamImg from '../src/assets/images/bias_focus_cam_1792160467203.jpg';
import danceCamImg from '../src/assets/images/dance_cam_1792160466135.jpg';
import tavyHaloHeroImg from '../src/assets/images/tavy_halo_hero_1792275821098.jpg';

interface TavyCompanionAppProps {
  onBackToWebsite: () => void;
  /** Label for the back button, e.g. "Back to Accessibility" when opened from that section. */
  backLabel?: string;
  onEnterExperience: () => void;
  onOpenMemoryBook: () => void;
}

export const TavyCompanionApp: React.FC<TavyCompanionAppProps> = ({
  onBackToWebsite,
  backLabel = 'Back to TΛVY Website',
  onEnterExperience,
  onOpenMemoryBook,
}) => {
  // Navigation tabs: venue | stream | halo | history. #/app/<tab> opens a tab directly (see companionTabs.ts).
  const [activeTab, setActiveTab] = useState<CompanionTab>(() => companionTabFromHash(window.location.hash) ?? DEFAULT_COMPANION_TAB);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Arriving (from a link, a reload or Back) puts keyboard and screen-reader focus on the app's heading
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Follow the address when it changes while the app is open (Back/Forward, an edited link)
  useEffect(() => {
    const sync = () => {
      if (window.location.hash.startsWith('#/app')) setActiveTab(companionTabFromHash(window.location.hash) ?? DEFAULT_COMPANION_TAB);
    };
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  // Choosing a tab updates the address in place (no extra history entries), so a reload keeps the tab
  const selectTab = (tab: CompanionTab) => {
    setActiveTab(tab);
    const hash = companionTabHash(tab);
    if (window.location.hash !== hash) window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${hash}`);
  };

  // Tab 1: Live Venue & Decibel States
  const [currentDecibel, setCurrentDecibel] = useState<number>(104.2);
  const [earplugsEquipped, setEarplugsEquipped] = useState<boolean>(false);
  const [isBigTextExpanded, setIsBigTextExpanded] = useState<boolean>(false);
  const [selectedBigText, setSelectedBigText] = useState<string>('NEED WATER');
  const [customBigTextInput, setCustomBigTextInput] = useState<string>('');
  const [isBroadcastingBeacon, setIsBroadcastingBeacon] = useState<boolean>(false);

  // Tab 2: Virtual Arena Stream States
  const [selectedCam, setSelectedCam] = useState<'main' | 'bias' | 'crowd'>('main');
  const [isAudioSynced, setIsAudioSynced] = useState<boolean>(true);
  const [hapticIntensity, setHapticIntensity] = useState<number>(85);
  const [isHapticSimulating, setIsHapticSimulating] = useState<boolean>(false);

  // Tab 3: Halo Device Diagnostics
  const [batteryLevel] = useState<number>(88);
  const [subBassCutoff, setSubBassCutoff] = useState<'35Hz' | '60Hz' | '120Hz'>('35Hz');
  const [ledMode, setLedMode] = useState<'stage-sync' | 'beat-ripple' | 'warm-amber' | 'beacon'>('stage-sync');
  const [lightColor, setLightColor] = useState<string>('#f59e0b');

  // Tab 4: History & Saved Moments
  const [savedMoments, setSavedMoments] = useState<Array<{ id: string; time: string; title: string; stage: string; peakDb: number }>>([
    { id: '1', time: '22:15', title: 'Sub-Bass Drop (Track ID 04)', stage: 'Neon Oasis Main', peakDb: 108.4 },
    { id: '2', time: '21:30', title: 'Crowd Chorus Acoustic Resonance', stage: 'Sunset Pavilion', peakDb: 99.2 },
    { id: '3', time: '20:45', title: 'Opening Synthesizer Haptic Sweep', stage: 'Neon Oasis Main', peakDb: 104.1 }
  ]);
  const [newMomentInput, setNewMomentInput] = useState<string>('');

  // Simulate realistic decibel micro-fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      const base = earplugsEquipped ? 86 : 103.5;
      const jitter = (Math.random() - 0.5) * 3.5;
      setCurrentDecibel(Number((base + jitter).toFixed(1)));
    }, 1200);
    return () => clearInterval(interval);
  }, [earplugsEquipped]);

  // Handle vibration trigger on supported mobile devices
  const triggerHaptic = () => {
    setIsHapticSimulating(true);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 60, 80]);
      } catch {
        // Fallback silently if blocked by permissions
      }
    }
    setTimeout(() => {
      setIsHapticSimulating(false);
    }, 600);
  };

  const handleAddMoment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMomentInput.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: newMomentInput.trim(),
      stage: 'Neon Oasis Main',
      peakDb: currentDecibel
    };
    setSavedMoments([newEntry, ...savedMoments]);
    setNewMomentInput('');
  };

  return (
    <div className="min-h-screen bg-[#090a0f] sm:bg-tv-canvas text-white flex flex-col items-center justify-start relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Top Banner Navigation Bar */}
      <header className="w-full bg-tv-canvas/95 backdrop-blur-xl border-b border-tv-line px-3 sm:px-8 py-2.5 sticky top-0 z-50 flex items-center justify-between gap-2 text-tv-navy">
        <button onClick={onBackToWebsite} className={`${buttonClass('ghost')} px-3 sm:px-5`}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{backLabel}</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full border border-tv-line bg-tv-paper text-xs font-semibold text-tv-navy">
            <span className="w-2 h-2 rounded-full bg-tv-accent" aria-hidden="true" />
            Interactive Companion App · Simulated Halo · Demo Data
          </span>

          <button onClick={onEnterExperience} className={`${buttonClass('primary')} px-4`}>
            <Music className="w-4 h-4" aria-hidden="true" />
            <span>Concert Experience</span>
          </button>
        </div>
      </header>

      {/* Main Container - Responsive Phone Mockup on Desktop, Edge-to-Edge on Mobile */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-0 sm:p-6 md:p-8">
        {/* Subtle Ambient Glow behind Phone on Desktop */}
        <div aria-hidden="true" className="hidden sm:block absolute top-1/4 w-[560px] max-w-full h-[560px] bg-tv-accent/15 rounded-full blur-[140px] pointer-events-none" />

        {/* Smartphone Shell Frame */}
        <div className="relative w-full max-w-[420px] bg-[#0c0d14] sm:border-[8px] sm:border-stone-800 sm:rounded-[48px] sm:shadow-[0_40px_90px_-30px_rgba(23,21,46,0.55)] overflow-hidden flex flex-col min-h-screen sm:min-h-[780px] sm:max-h-[860px]">
          {/* iOS Dynamic Island / Notch */}
          <div className="hidden sm:flex items-center justify-between px-7 pt-3.5 pb-2 text-[11px] font-medium text-stone-400 select-none z-30 bg-[#0c0d14]">
            <span>22:24</span>
            <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-1.5 border border-stone-800/60 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-stone-900 border border-stone-700" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 text-stone-300">
              <span className="text-[10px] font-mono">5G</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* App Header Status Bar */}
          <div className="px-5 pt-3 pb-2.5 bg-[#12131c] border-b border-stone-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider text-white">TΛVY</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Halo Link
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={triggerHaptic}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[10px] cursor-pointer transition-colors"
                title="Trigger Halo Test Pulse"
              >
                <Zap className={`w-3 h-3 ${isHapticSimulating ? 'text-amber-400 scale-125' : 'text-stone-400'} transition-transform`} />
                <span>Test Pulse</span>
              </button>
              <div className="flex items-center gap-1 text-[11px] text-stone-400 font-mono">
                <Bluetooth className="w-3 h-3 text-cyan-400" />
                <span>88%</span>
              </div>
            </div>
          </div>

          {/* App Content Body (Scrollable Screen) */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24 text-stone-100 scrollbar-none">
            <h1 ref={headingRef} tabIndex={-1} className="sr-only">
              TΛVY Companion App: {COMPANION_TAB_LABELS[activeTab]}
            </h1>
            {/* Demo disclosure: nothing in this app reads a real device, microphone or location */}
            <p role="note" className="px-3 py-2 rounded-2xl bg-stone-900/80 border border-stone-800 text-[11px] leading-relaxed text-stone-300">
              <span className="font-bold text-amber-300">Demo mode.</span> Halo, Bluetooth, sound-level, friend-location and SOS data are simulated. Nothing here contacts emergency services or gives hearing-safety advice. In an emergency, tell venue staff or call your local emergency number.
            </p>
            {/* ======================================================== */}
            {/* TAB 1: LIVE VENUE & DECIBEL DOSIMETER                     */}
            {/* ======================================================== */}
            {activeTab === 'venue' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Real-time Decibel Dosimeter Gauge Card */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-stone-900 to-[#141520] border border-stone-800/90 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Volume2 className="w-4 h-4 text-amber-400" />
                      Sound Level (Simulated)
                    </span>
                    <button
                      onClick={() => setEarplugsEquipped(!earplugsEquipped)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                        earplugsEquipped
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-stone-800 text-stone-400 border-stone-700'
                      }`}
                    >
                      {earplugsEquipped ? '✓ Filters On (-18 dB)' : '+ Add Ear Filters'}
                    </button>
                  </div>

                  {/* Meter readout */}
                  <div className="text-center py-2 relative">
                    <div className="text-5xl font-black tracking-tight text-white font-mono flex items-center justify-center gap-1">
                      <span>{currentDecibel}</span>
                      <span className="text-lg font-normal text-stone-400">dB</span>
                    </div>
                    <p className={`text-xs mt-1 font-semibold ${
                      currentDecibel > 100 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {currentDecibel > 100 ? 'High Energy Zone (demo reading)' : 'Lower Level (demo reading)'}
                    </p>

                    {/* NIOSH Dose Bar */}
                    <div className="mt-3.5 space-y-1 text-left">
                      <div className="flex justify-between text-[11px] text-stone-400">
                        <span>Daily Noise Dose (illustrative)</span>
                        <span className="text-amber-400 font-mono font-medium">64% Consumed</span>
                      </div>
                      <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full transition-all duration-500"
                          style={{ width: '64%' }}
                        />
                      </div>
                      <p className="text-[10px] text-stone-400 text-right">Demo values, not a measurement or hearing-safety advice</p>
                    </div>
                  </div>
                </div>

                {/* 110 dB Big Text Safety Communicator */}
                <div className="p-4 rounded-3xl bg-[#141520] border border-stone-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        110 dB Crowd Text
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        High-contrast silent communicator across loud crowd roar
                      </p>
                    </div>
                    <button
                      onClick={() => setIsBigTextExpanded(true)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 cursor-pointer"
                      title="Launch Full-Screen Flash Display"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active Selected Card Preview */}
                  <div
                    onClick={() => setIsBigTextExpanded(true)}
                    className="p-4 rounded-2xl bg-amber-400 text-stone-950 text-center font-black text-2xl tracking-tight shadow-md cursor-pointer hover:bg-amber-300 transition-colors flex items-center justify-center min-h-[64px]"
                  >
                    <span>{selectedBigText}</span>
                  </div>

                  {/* Preset Quick Chips */}
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {['NEED WATER', 'AT SOUNDBOOTH', 'NEED A MEDIC', 'STAGE LEFT BAR'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setSelectedBigText(preset)}
                        className={`px-2.5 py-1.5 rounded-xl border text-left text-[11px] font-medium transition-colors cursor-pointer truncate ${
                          selectedBigText === preset
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                            : 'bg-stone-800/80 text-stone-300 border-stone-700/60 hover:bg-stone-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Custom input */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Type custom text..."
                      value={customBigTextInput}
                      onChange={(e) => setCustomBigTextInput(e.target.value)}
                      className="flex-1 bg-stone-900 border border-stone-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => {
                        if (customBigTextInput.trim()) {
                          setSelectedBigText(customBigTextInput.trim().toUpperCase());
                          setIsBigTextExpanded(true);
                          setCustomBigTextInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Flash
                    </button>
                  </div>
                </div>

                {/* 10m Offline Peer Mesh Radar */}
                <div className="p-4 rounded-3xl bg-[#141520] border border-stone-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-stone-200">
                      <WifiOff className="w-4 h-4 text-emerald-400" />
                      10m Radar (Simulated)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      3 Demo Friends
                    </span>
                  </div>

                  {/* Radar Graphic */}
                  <div className="relative h-44 rounded-2xl bg-black border border-stone-800 overflow-hidden flex items-center justify-center">
                    {/* Concentric rings */}
                    <div className="absolute w-36 h-36 rounded-full border border-emerald-500/15" />
                    <div className="absolute w-24 h-24 rounded-full border border-emerald-500/25" />
                    <div className="absolute w-12 h-12 rounded-full border border-emerald-500/40" />
                    {/* Radar sweep */}
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(16,185,129,0.18)_360deg)] animate-spin origin-center" />

                    {/* Center User Dot */}
                    <div className="relative z-10 w-4 h-4 rounded-full bg-amber-400 border-2 border-stone-950 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />

                    {/* Friend Blips */}
                    <div className="absolute top-9 left-16 z-10 group cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 border border-black animate-pulse" />
                      <span className="absolute -top-4 -left-3 text-[9px] font-mono text-emerald-300 bg-black/80 px-1 rounded whitespace-nowrap">
                        Alex (3.2m)
                      </span>
                    </div>

                    <div className="absolute bottom-10 right-14 z-10 group cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 border border-black animate-pulse" />
                      <span className="absolute -top-4 -left-3 text-[9px] font-mono text-emerald-300 bg-black/80 px-1 rounded whitespace-nowrap">
                        Maya (6.8m)
                      </span>
                    </div>

                    <div className="absolute top-14 right-10 z-10 group cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-cyan-400 border border-black animate-pulse" />
                      <span className="absolute -top-4 -left-3 text-[9px] font-mono text-cyan-300 bg-black/80 px-1 rounded whitespace-nowrap">
                        Sam (8.4m)
                      </span>
                    </div>
                  </div>

                  {/* Beacon Button */}
                  <button
                    onClick={() => setIsBroadcastingBeacon(!isBroadcastingBeacon)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      isBroadcastingBeacon
                        ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 animate-pulse'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {isBroadcastingBeacon ? 'Simulated SOS Ping (No Emergency Call)' : 'Simulate Ping to Friends (Demo)'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: VIRTUAL ARENA STREAM                              */}
            {/* ======================================================== */}
            {activeTab === 'stream' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Live Stream Viewport */}
                <div className="rounded-3xl overflow-hidden bg-black border border-stone-800 relative shadow-xl">
                  <div className="relative aspect-video">
                    <img
                      src={
                        selectedCam === 'main'
                          ? cinematicStageImg
                          : selectedCam === 'bias'
                          ? biasCamImg
                          : danceCamImg
                      }
                      alt="Virtual Stage Feed"
                      className="w-full h-full object-cover"
                    />

                    {/* Stream overlays */}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-emerald-400 flex items-center gap-1 border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span>DEMO FEED · STILL IMAGES</span>
                    </div>

                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-amber-300 border border-white/10">
                      35Hz Sub-Bass Lock
                    </div>

                    {/* Audio Haptic Wave Ripple Simulation Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/90 to-transparent flex items-end justify-center pb-2 gap-1 px-4">
                      {[40, 75, 55, 90, 65, 85, 95, 70, 60, 80, 50, 95, 65, 45].map((h, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`] }}
                          transition={{ repeat: Infinity, duration: 0.8 + (i % 4) * 0.2, ease: 'easeInOut' }}
                          className="flex-1 bg-amber-400/90 rounded-t"
                          style={{ maxHeight: '24px' }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Multi-Angle Camera Switcher */}
                  <div className="p-3 bg-stone-900/90 border-t border-stone-800 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedCam('main')}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-semibold border transition-all cursor-pointer ${
                        selectedCam === 'main'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-stone-800 text-stone-400 border-stone-700/60'
                      }`}
                    >
                      Main Stage
                    </button>
                    <button
                      onClick={() => setSelectedCam('bias')}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-semibold border transition-all cursor-pointer ${
                        selectedCam === 'bias'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-stone-800 text-stone-400 border-stone-700/60'
                      }`}
                    >
                      Artist Bias Cam
                    </button>
                    <button
                      onClick={() => setSelectedCam('crowd')}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-semibold border transition-all cursor-pointer ${
                        selectedCam === 'crowd'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-stone-800 text-stone-400 border-stone-700/60'
                      }`}
                    >
                      Crowd Energy
                    </button>
                  </div>
                </div>

                {/* Haptic Telemetry Controls */}
                <div className="p-4 rounded-3xl bg-[#141520] border border-stone-800/80 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-200 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Tactile Sub-Bass Intensity
                    </span>
                    <span className="font-mono text-amber-300 font-bold">{hapticIntensity}%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={hapticIntensity}
                    onChange={(e) => setHapticIntensity(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                    <span>Gentle Pulse</span>
                    <span>Arena Chest-Thump</span>
                  </div>

                  <button
                    onClick={triggerHaptic}
                    className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs flex items-center justify-center gap-2 border border-stone-700 cursor-pointer transition-colors"
                  >
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Test Halo Transducer on Wrist</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: HALO HARDWARE DIAGNOSTICS & TUNING                */}
            {/* ======================================================== */}
            {activeTab === 'halo' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Device Status Card */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-[#181926] to-[#12131c] border border-stone-800 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-900 border border-stone-700 shrink-0">
                    <img
                      src={tavyHaloHeroImg}
                      alt="TΛVY Halo A Hardware"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">TΛVY Halo A</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Simulated
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">Titanium Grade 5 · BLE 5.4 Low Latency</p>
                    <div className="flex items-center gap-3 text-[11px] text-stone-300 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Battery className="w-3.5 h-3.5 text-emerald-400" />
                        88% (~14h)
                      </span>
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                        34.2°C
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-Bass Frequency Cutoff Selector */}
                <div className="p-4 rounded-3xl bg-[#141520] border border-stone-800/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Transducer Frequency Tuning
                  </h4>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Set acoustic bone-conduction low-pass filter fundamentals
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { hz: '35Hz', label: 'Sub-Bass Rumble' },
                      { hz: '60Hz', label: 'Kick Drum Punch' },
                      { hz: '120Hz', label: 'Bassline Detail' }
                    ].map((item) => (
                      <button
                        key={item.hz}
                        onClick={() => setSubBassCutoff(item.hz as any)}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          subBassCutoff === item.hz
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                            : 'bg-stone-800/80 text-stone-400 border-stone-700/60 hover:bg-stone-700'
                        }`}
                      >
                        <div className="text-sm font-mono">{item.hz}</div>
                        <div className="text-[9px] mt-0.5">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* LED Light Prism Controls */}
                <div className="p-4 rounded-3xl bg-[#141520] border border-stone-800/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Optical Prism Lighting
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { mode: 'stage-sync', label: 'Stage Sync (Artist)' },
                      { mode: 'beat-ripple', label: 'Beat Haptic Pulse' },
                      { mode: 'warm-amber', label: 'Editorial Amber' },
                      { mode: 'beacon', label: 'Safety Strobe' }
                    ].map((m) => (
                      <button
                        key={m.mode}
                        onClick={() => setLedMode(m.mode as any)}
                        className={`p-2 rounded-xl border text-left text-[11px] font-medium transition-colors cursor-pointer ${
                          ledMode === m.mode
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                            : 'bg-stone-800/80 text-stone-400 border-stone-700/60 hover:bg-stone-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Color Swatches */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">Wristband Light Tint:</span>
                    <div className="flex items-center gap-2">
                      {[
                        { color: '#f59e0b', name: 'Amber' },
                        { color: '#c084fc', name: 'Lavender' },
                        { color: '#34d399', name: 'Mint' },
                        { color: '#fb7185', name: 'Blush' }
                      ].map((swatch) => (
                        <button
                          key={swatch.color}
                          onClick={() => setLightColor(swatch.color)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                            lightColor === swatch.color ? 'scale-125 border-white' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: swatch.color }}
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: SOUND SAFETY & FESTIVAL MEMORIES                  */}
            {/* ======================================================== */}
            {activeTab === 'history' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Exposure Summary Card */}
                <div className="p-4 rounded-3xl bg-[#141520] border border-stone-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-200 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      Tonight's Acoustic Exposure
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Demo Data</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2.5 rounded-2xl bg-stone-900 border border-stone-800">
                      <p className="text-[10px] text-stone-400">Total Time</p>
                      <p className="text-sm font-bold font-mono text-white mt-0.5">3h 48m</p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-stone-900 border border-stone-800">
                      <p className="text-[10px] text-stone-400">Avg Level</p>
                      <p className="text-sm font-bold font-mono text-amber-400 mt-0.5">98.2 dB</p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-stone-900 border border-stone-800">
                      <p className="text-[10px] text-stone-400">Peak Surge</p>
                      <p className="text-sm font-bold font-mono text-rose-400 mt-0.5">108.4 dB</p>
                    </div>
                  </div>
                </div>

                {/* Saved Musical Moments */}
                <div className="p-4 rounded-3xl bg-[#141520] border border-stone-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-200 flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      Haptic Memory Bookmarks
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">{savedMoments.length} Saved</span>
                  </div>

                  {/* Add Bookmark form */}
                  <form onSubmit={handleAddMoment} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Tag current drop or moment..."
                      value={newMomentInput}
                      onChange={(e) => setNewMomentInput(e.target.value)}
                      className="flex-1 bg-stone-900 border border-stone-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer"
                    >
                      Pin
                    </button>
                  </form>

                  {/* List of bookmarks */}
                  <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
                    {savedMoments.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800/80 flex items-center justify-between text-xs hover:border-stone-700 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-stone-200">{item.title}</p>
                          <p className="text-[10px] text-stone-400">{item.stage} · {item.time}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {item.peakDb} dB
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* The lasting version of these bookmarks lives in the Memory Book */}
                  <div className="pt-2 border-t border-stone-800/80 space-y-2">
                    <p className="text-[10px] leading-relaxed text-stone-400">
                      Bookmarks here are a demo and disappear when you leave. To keep a moment with a photo and a note, add it to your Memory Book.
                    </p>
                    <button
                      onClick={onOpenMemoryBook}
                      className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                      Open Memory Book
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* App Bottom Navigation Bar (4 Native Tabs) */}
          <nav aria-label="Companion App tabs" className="absolute bottom-0 inset-x-0 bg-[#10111a]/95 backdrop-blur-lg border-t border-stone-800/80 px-2 py-2 flex items-center justify-around z-20">
            <button
              onClick={() => selectTab('venue')}
              aria-current={activeTab === 'venue' ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'venue' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Volume2 className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px]">Live Venue</span>
            </button>

            <button
              onClick={() => selectTab('stream')}
              aria-current={activeTab === 'stream' ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'stream' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Camera className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px]">Stage Stream</span>
            </button>

            <button
              onClick={() => selectTab('halo')}
              aria-current={activeTab === 'halo' ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'halo' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sliders className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px]">Halo Device</span>
            </button>

            <button
              onClick={() => selectTab('history')}
              aria-current={activeTab === 'history' ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'history' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Activity className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px]">Safety & Log</span>
            </button>
          </nav>
        </div>

        {/* Full-Screen 110 dB Big Text Flashing Modal */}
        <AnimatePresence>
          {isBigTextExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] bg-amber-400 text-stone-950 flex flex-col items-center justify-between p-6 sm:p-12 text-center select-none"
            >
              <div className="w-full flex items-center justify-between text-xs font-mono font-bold tracking-widest uppercase border-b-2 border-stone-900/30 pb-3">
                <span>TΛVY HIGH-CONTRAST SILENT BROADCAST</span>
                <button
                  onClick={() => setIsBigTextExpanded(false)}
                  className="px-4 py-1.5 rounded-full bg-stone-950 text-white hover:bg-stone-800 text-xs font-bold cursor-pointer transition-colors shadow-lg"
                >
                  Close [ ✕ ]
                </button>
              </div>

              {/* Big Text Content */}
              <div className="my-auto px-4 max-w-4xl">
                <p className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight leading-none break-words drop-shadow-sm">
                  {selectedBigText}
                </p>
                <p className="mt-8 text-sm sm:text-base font-bold text-stone-900/80 uppercase tracking-widest">
                  Hold phone high above head · Visible up to 25 feet across crowded festival arena
                </p>
              </div>

              <div className="w-full text-center text-xs font-bold uppercase tracking-widest opacity-75">
                Tap anywhere or press close to return
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

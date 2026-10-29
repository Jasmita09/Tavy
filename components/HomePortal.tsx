import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Zap, 
  Sparkles, 
  Volume2, 
  Radio, 
  Layers, 
  ShieldCheck, 
  Check, 
  WifiOff, 
  Smartphone,
  ChevronRight,
  Battery,
  Shield,
  Activity,
  Plus,
  X,
  Compass,
  Maximize2,
  Play,
  Pause,
  Sliders,
  ChevronDown,
  Music2
} from 'lucide-react';
import { HaloDetailModal } from './HaloDetailModal';
import { DownloadAppModal } from './DownloadAppModal';
import cinematicStageImg from '../src/assets/images/tavy_cinematic_stage_1792350376076.jpg';
import haloPhoneOverlapImg from '../src/assets/images/halo_leaning_phone_1792352465315.jpg';
import tavyHaloHeroImg from '../src/assets/images/tavy_halo_hero_1792275821098.jpg';

interface HomePortalProps {
  onOpenDownloadApp: () => void;
  onOpenArchitecture: () => void;
  onEnterExperience: () => void;
  onOpenHaloShowcase: () => void;
}

interface HotspotPin {
  id: string;
  name: string;
  badge: string;
  desc: string;
  top: string;
  left: string;
}

export const HomePortal: React.FC<HomePortalProps> = ({ 
  onOpenDownloadApp,
  onOpenArchitecture,
  onEnterExperience,
  onOpenHaloShowcase
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);

  // Phone Mockup A interactive states (Virtual Stage)
  const [activeCam, setActiveCam] = useState<'main' | 'bias' | 'crowd'>('main');

  // Phone Mockup B interactive states (Arena Presence)
  const [bigTextPreset, setBigTextPreset] = useState<'NEED WATER' | 'AT SOUNDBOOTH' | 'EXIT 4'>('NEED WATER');
  const [armAngleActive, setArmAngleActive] = useState<boolean>(true);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Calibrated Hotspot Pins matching exact user specifications
  const hotspots: HotspotPin[] = [
    {
      id: 'fin',
      name: 'Pastel TIR Optical Waveguide',
      badge: '16.8M Soft Optical Blade',
      desc: 'Channels micro-LED strobes upward in soft pastel tones through frosted optical PMMA, cutting through festival haze without blinding adjacent concert-goers.',
      top: '55%',
      left: '54%',
    },
    {
      id: 'transducer',
      name: 'Dual 35Hz Sub-Bass LRA Transducers',
      badge: 'Wrist Bone Conduction',
      desc: 'High-displacement linear resonant actuators tuned to 35Hz kick fundamental frequencies, delivering visceral concert bass directly to wrist bones for deaf & hard-of-hearing fans.',
      top: '46%',
      left: '44%',
    },
    {
      id: 'titanium',
      name: 'Left Titanium Rim & SOS Switch',
      badge: 'Grade 5 Aerospace Titanium',
      desc: 'Bead-blasted satin titanium chassis with an integrated 3-second tactile hold that sends a proximity alert to nearby Halo wearers over the offline mesh (concept; it does not contact emergency services).',
      top: '50%',
      left: '33%',
    },
    {
      id: 'antenna',
      name: 'Upper Arc & AuraMesh BLE 5.3',
      badge: '2.4 GHz Peer-to-Peer Array',
      desc: 'Omnidirectional high-gain conformal antenna array establishing a 10-meter ad-hoc cluster with surrounding bands without requiring cell signal or venue Wi-Fi.',
      top: '42%',
      left: '53%',
    },
  ];

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

  const scrollToEcosystem = () => {
    const el = document.getElementById('ecosystem');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      {/* 1. TOP HERO: TAVY COMPANY VISION (CINEMATIC BACKDROP) */}
      <section className="relative w-full min-h-[85vh] sm:min-h-[92vh] flex items-center justify-center overflow-hidden bg-stone-950 text-white">
        {/* Background Visual Loop / Cinematic Stage Lighting */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.img
            src={cinematicStageImg}
            alt="TΛVY Cinematic Stage Lights and Acoustic Haze"
            animate={isVideoPlaying ? { scale: [1, 1.04, 1], y: [0, -10, 0] } : { scale: 1, y: 0 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.08]"
          />

          {/* Dark Overlay (bg-black/40 with gentle gradient for high contrast) */}
          <div className="absolute inset-0 bg-black/45 bg-gradient-to-t from-[#faf7f2] via-black/35 to-black/60 z-10" />

          {/* Subtle Ambient Golden Beam Flares */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />
        </div>

        {/* Hero Content Overlay (Massive, clean Whoop-inspired typography) */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-12 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300 tracking-widest uppercase"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>TΛVY Systems Architecture</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.05]"
          >
            The sensory infrastructure for live sound.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-xl md:text-2xl text-stone-200 font-light max-w-3xl mx-auto leading-relaxed"
          >
            TΛVY engineers tactile resonance, synchronized optics, and offline crowd telemetry to make live music universally accessible and safer.
          </motion.p>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="pt-4 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={scrollToEcosystem}
              className="px-9 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#141312] hover:bg-stone-800 text-white border border-white/20 shadow-2xl transition-all cursor-pointer flex items-center gap-2.5 group"
            >
              <span>Discover TΛVY</span>
              <ChevronDown className="w-4 h-4 text-amber-300 group-hover:translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={onEnterExperience}
              className="px-8 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-2xl transition-all cursor-pointer flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <Music2 className="w-4 h-4" aria-hidden="true" />
              <span>Enter Concert Experience</span>
            </button>

            <button
              onClick={onOpenDownloadApp}
              className="px-8 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-amber-300" />
              <span>Get Companion App</span>
            </button>
          </motion.div>

          {/* Product exploration, kept separate from the concert entry */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5 }}>
            <button
              onClick={onOpenHaloShowcase}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/90 hover:text-white underline-offset-4 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <Sparkles className="w-4 h-4 text-violet-200" aria-hidden="true" />
              Explore the Halo concept in 3D
            </button>
          </motion.div>
        </div>

        {/* Bottom Right: Video Play/Pause Toggle Icon */}
        <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2">
          <button
            onClick={() => setIsVideoPlaying(!isVideoPlaying)}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg flex items-center gap-2 text-xs font-mono"
            title={isVideoPlaying ? 'Pause Ambient Backdrop Visual' : 'Resume Ambient Backdrop Visual'}
          >
            {isVideoPlaying ? <Pause className="w-4 h-4 text-amber-300" /> : <Play className="w-4 h-4 text-amber-300" />}
            <span className="hidden sm:inline text-[11px] text-stone-300">
              {isVideoPlaying ? 'Ambient Motion Active' : 'Motion Paused'}
            </span>
          </button>
        </div>
      </section>

      {/* Main Container for Subsequent Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-28 md:space-y-36">

        {/* 2. THE ECOSYSTEM SHOWCASE (MATCHING WHOOP IMAGE 2) */}
        <section id="ecosystem" className="space-y-12 pt-6">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#b45309] uppercase">
              THE TΛVY ECOSYSTEM
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#141312] tracking-tight">
              Hardware &amp; Software in Harmony
            </h2>
            <p className="text-stone-600 text-sm sm:text-base font-light">
              Engineered as a cohesive system. The Halo wearable and the companion app bridge physical stage presence with real-time biometric and acoustic telemetry.
            </p>
          </div>

          {/* 3-Column Ecosystem Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column (Text): Sensory Telemetry */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <div className="p-8 rounded-3xl bg-[#fefce8] border border-[#fef08a] space-y-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-[#b45309]">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#141312] leading-tight">
                  Sensory Telemetry at Your Fingertips
                </h3>
                <p className="text-stone-700 text-sm sm:text-base font-light leading-relaxed">
                  TΛVY synchronizes 35Hz bone-conduction haptics with live audio, letting fans physically feel the bass fundamentals while monitoring safe decibel exposure in real time.
                </p>

                <div className="pt-4 border-t border-amber-200/60 space-y-2 text-xs font-medium text-amber-900">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#b45309]" />
                    <span>0 ms tactile bone conduction latency</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#b45309]" />
                    <span>Sound-exposure tracking against NIOSH guidance (concept)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column: The Hardware + Software Composition */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 bg-stone-100 max-w-sm w-full group">
                <img
                  src={haloPhoneOverlapImg}
                  alt="TΛVY Companion App & Leaning Halo A Wristband Composition"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Floating telemetry callouts */}
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-mono text-white border border-white/20 flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Halo Sound Lock: 48 dB</span>
                </div>

                <div className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-full bg-stone-900/85 backdrop-blur-md text-[11px] font-medium text-amber-300 border border-white/20 shadow-md">
                  Titanium Halo A · 35Hz Transducer
                </div>
              </div>
            </div>

            {/* Right Column (Text): Decentralized Arena Safety */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <div className="p-8 rounded-3xl bg-[#f0fdf4] border border-[#bbf7d0] space-y-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <WifiOff className="w-5 h-5" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#141312] leading-tight">
                  Decentralized Arena Safety
                </h3>
                <p className="text-stone-700 text-sm sm:text-base font-light leading-relaxed">
                  When thousands gather, Halo establishes a zero-infrastructure 10-meter peer mesh. One 3-second hold activates an immediate offline safety halo across the crowd.
                </p>

                <div className="pt-4 border-t border-emerald-200/60 space-y-2 text-xs font-medium text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>2.4 GHz ad-hoc cluster with 0 cell coverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Proximity alert to nearby friends (concept)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 3. HALO HARDWARE DEEP-DIVE (HOTSPOTS ON STONE PEDESTAL) */}
        <section id="architecture" className="space-y-10 pt-4">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#b45309] uppercase">
              HARDWARE DEEP-DIVE
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-[#141312] tracking-tight">
              Anatomy of TΛVY <span className="font-editorial-serif italic text-[#b45309] font-normal">Halo A</span>
            </h2>
            <p className="text-stone-600 text-sm sm:text-base font-light leading-relaxed">
              Explore the precision engineering behind the world’s first concert-grade sensory wristband. Click any <span className="font-bold text-[#b45309]">+</span> marker to inspect component sub-systems.
            </p>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-stone-200/90 shadow-xl bg-[#faf7f2] group">
            {/* Studio Photo on Stone Pedestal */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-[#f5f0e8] flex items-center justify-center select-none">
              <img
                src={tavyHaloHeroImg}
                alt="TΛVY Halo A Smart Wearable on Warm Stone Pedestal"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Exact User-Calibrated Hotspot Pins */}
              {hotspots.map(pin => {
                const isActive = activeHotspot === pin.id;
                return (
                  <div
                    key={pin.id}
                    className="absolute z-30"
                    style={{ top: pin.top, left: pin.left }}
                  >
                    {/* Hotspot Pulse Ring & Plus Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveHotspot(isActive ? null : pin.id);
                      }}
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-md cursor-pointer border-0 ${
                        isActive
                          ? 'bg-[#b45309] text-white rotate-45'
                          : 'bg-white/95 text-[#141312] hover:bg-white'
                      }`}
                      title={pin.name}
                    >
                      {!isActive && (
                        <span className="absolute -inset-1 rounded-full bg-amber-400/50 animate-ping pointer-events-none" />
                      )}
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    {/* Floating Tooltip Card Anchored Beside Pin (Dismiss with 'x') */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-10 -top-10 w-72 sm:w-80 p-5 rounded-2xl bg-white/98 backdrop-blur-md border border-stone-200 shadow-2xl text-left z-40 text-[#141312]"
                        >
                          <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                            <div>
                              <span className="text-[10px] uppercase font-semibold text-[#b45309] tracking-wider block">
                                {pin.badge}
                              </span>
                              <h4 className="text-sm font-bold text-[#141312] mt-0.5">
                                {pin.name}
                              </h4>
                            </div>
                            <button
                              onClick={() => setActiveHotspot(null)}
                              className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer border-0 bg-transparent"
                              title="Dismiss"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-xs text-stone-600 font-light leading-relaxed mt-2.5">
                            {pin.desc}
                          </p>

                          <div className="pt-2.5 mt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                            <span>Hardware Hotspot</span>
                            <button
                              onClick={() => {
                                setActiveHotspot(null);
                                setIsDetailModalOpen(true);
                              }}
                              className="text-[#b45309] font-medium hover:underline bg-transparent border-0 cursor-pointer p-0"
                            >
                              Inspect Exploded View →
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Expand Architecture Badge in Bottom Right */}
              <button
                onClick={() => setIsDetailModalOpen(true)}
                className="absolute bottom-6 right-6 z-20 px-4 py-2 rounded-full bg-[#141312]/85 hover:bg-[#141312] text-white backdrop-blur-md text-xs font-medium flex items-center gap-2 border border-white/20 shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Exploded View</span>
              </button>
            </div>

            {/* TECHNICAL SPECS BAR: Horizontal strip */}
            <div className="p-6 sm:p-8 bg-[#f5f0e8] border-t border-stone-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#b45309]">35Hz Dual LRA</p>
                <p className="text-xs text-stone-600 font-light">Sub-bass wrist bone conduction</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#b45309]">Pastel TIR Prism</p>
                <p className="text-xs text-stone-600 font-light">Soft ambient crowd lightwaves</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#b45309]">BLE 5.3 Mesh</p>
                <p className="text-xs text-stone-600 font-light">Offline peer-to-peer alerts (concept)</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#b45309]">120 dB SPL Guard</p>
                <p className="text-xs text-stone-600 font-light">Real-time acoustic dosimetry</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FEATURES: 4 CLEAN PASTEL CARDS (No Fake Test Buttons) */}
        <section id="features" className="space-y-12">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs tracking-widest text-[#b45309] uppercase font-bold">
              FEATURES
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold text-[#141312] tracking-tight">
              Engineered for Sensory Immersion
            </h2>
            <p className="text-stone-600 text-base sm:text-lg font-light leading-relaxed">
              Every component inside the <span className="font-editorial-serif text-2xl font-normal text-[#b45309] italic">Halo</span> was designed from acoustic science to solve live music challenges: hearing fatigue, congested networks, and tactile auditory inclusion.
            </p>
          </div>

          {/* Four Pastel Cards (Clean technical specification cards with NO fake buttons) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card A: 35Hz Sub-Bass Bone Conduction
                Pale warm yellow/butter tint (#fefce8, border #fef08a) with an amber lightning icon. */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#fefce8] border border-[#fef08a] space-y-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-[#b45309]">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#b45309] uppercase tracking-wider block">
                    Dual Actuator Haptics
                  </span>
                  <h3 className="text-2xl font-bold text-[#141312] mt-1">
                    35Hz Sub-Bass Bone Conduction
                  </h3>
                </div>
                <p className="text-stone-700 text-sm leading-relaxed font-light">
                  Live music is meant to be felt, not just heard. Halo’s dual Linear Resonant Actuators convert low-end acoustic frequencies into visceral tactile pulses delivered straight through the wrist bones, empowering deaf and hard-of-hearing music fans to physically experience the live rhythm.
                </p>
              </div>

              <div className="pt-5 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900/80">
                <span className="font-medium">35Hz – 120Hz Kick Fundamental</span>
                <span className="font-bold text-[#b45309]">0 ms Tactile Latency</span>
              </div>
            </div>

            {/* Card B: Harmonized Crowd Optics
                Soft lilac/lavender tint (#faf5ff, border #e9d5ff) with a muted purple optics icon. */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#faf5ff] border border-[#e9d5ff] space-y-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider block">
                    Soft Prism Dispersion
                  </span>
                  <h3 className="text-2xl font-bold text-[#141312] mt-1">
                    Harmonized Crowd Optics
                  </h3>
                </div>
                <p className="text-stone-700 text-sm leading-relaxed font-light">
                  Unlike harsh blinding flashlights, Halo uses a frosted Total Internal Reflection (TIR) acrylic fin. It channels micro-LED strobes upward in soft pastel tones, cutting through festival haze and pyrotechnic smoke to unify tens of thousands of fans into one living visual rhythm.
                </p>
              </div>

              <div className="pt-5 border-t border-purple-200/60 flex items-center justify-between text-xs text-purple-900/80">
                <span className="font-medium">16.8M Pastel Palette</span>
                <span className="font-bold text-purple-800">Anti-Glare Frosted PMMA</span>
              </div>
            </div>

            {/* Card C: 100% Offline Festival Mesh
                Pale sage/mint tint (#f0fdf4, border #bbf7d0) with a muted emerald wireless icon. */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#f0fdf4] border border-[#bbf7d0] space-y-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <WifiOff className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                    AuraMesh 2.4 GHz
                  </span>
                  <h3 className="text-2xl font-bold text-[#141312] mt-1">
                    100% Offline Festival Mesh
                  </h3>
                </div>
                <p className="text-stone-700 text-sm leading-relaxed font-light">
                  When 80,000 festival-goers overwhelm cell towers, Halo’s AuraMesh protocol creates an instant peer-to-peer radio cluster. It maintains a 10-meter proximity bubble, lets you ping friends, and broadcasts an emergency safety perimeter without requiring internet access.
                </p>
              </div>

              <div className="pt-5 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900/80">
                <span className="font-medium">10m Bubble Radius</span>
                <span className="font-bold text-emerald-800">Zero Cellular Required</span>
              </div>
            </div>

            {/* Card D: Acoustic Dosimeter & Big Text
                Soft blush/peach tint (#fff1f2, border #fecdd3) with a coral audio icon. */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#fff1f2] border border-[#fecdd3] space-y-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider block">
                    NIOSH Hearing Health
                  </span>
                  <h3 className="text-2xl font-bold text-[#141312] mt-1">
                    Acoustic Dosimeter &amp; Big Text
                  </h3>
                </div>
                <p className="text-stone-700 text-sm leading-relaxed font-light">
                  Live arenas often reach 110 dB to 120 dB SPL. Halo tracks cumulative sound exposure in real time against NIOSH standards and alerts you to protect your ears. Combined with high-contrast screen communication, fans can coordinate effortlessly over extreme noise.
                </p>
              </div>

              <div className="pt-5 border-t border-rose-200/60 flex items-center justify-between text-xs text-rose-900/80">
                <span className="font-medium">Real-Time MEMS Sensing</span>
                <span className="font-bold text-rose-800">120 dB SPL Dynamic Range</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. TWO WORLDS, ONE RHYTHM: COMPANION APP MOCKUPS */}
        <section id="how-it-works" className="space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs tracking-widest text-[#b45309] uppercase font-bold">
              HOW IT WORKS
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold text-[#141312] tracking-tight">
              Two Worlds, One Rhythm
            </h2>
            <p className="text-stone-600 text-base font-light leading-relaxed">
              Hardware and software in seamless harmony. Just like how Oura connects the ring to your health metrics, TΛVY pairs the <span className="font-editorial-serif text-2xl font-normal text-[#b45309] italic">Halo</span> with bespoke mobile tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mockup A: Virtual Stage Streaming Companion */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#faf7f2] border border-stone-200 space-y-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#f5f0e8] text-stone-700 border border-stone-200">
                    VIRTUAL STAGE COMPANION
                  </span>
                  <span className="text-xs text-[#b45309] font-medium">
                    0 ms Audio-Haptic Lock
                  </span>
                </div>

                {/* Smartphone Mockup Frame A */}
                <div className="relative mx-auto w-full max-w-sm rounded-[38px] p-3 bg-stone-900 shadow-2xl border-4 border-stone-800">
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-stone-800" />
                  </div>

                  <div className="w-full bg-[#141312] rounded-[30px] p-5 pt-8 text-white space-y-4 overflow-hidden border border-stone-700/50">
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                      <span>9:41</span>
                      <span className="text-[#b45309]">TΛVY SYNC LOCK · 0ms</span>
                      <span>100%</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
                          Live Stage Telemetry
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-sm font-bold text-stone-100">NOVA — &ldquo;Starlight Live&rdquo;</p>
                      <p className="text-[11px] text-stone-400 font-light">Sphere Arena · Las Vegas (4K UHD)</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                        Multi-Angle Live Camera Switcher
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                        <button
                          onClick={() => setActiveCam('main')}
                          className={`py-2 px-1 rounded-xl transition-all cursor-pointer border ${
                            activeCam === 'main'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                              : 'bg-stone-800/80 text-stone-400 border-stone-700'
                          }`}
                        >
                          Main 4K
                        </button>
                        <button
                          onClick={() => setActiveCam('bias')}
                          className={`py-2 px-1 rounded-xl transition-all cursor-pointer border ${
                            activeCam === 'bias'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                              : 'bg-stone-800/80 text-stone-400 border-stone-700'
                          }`}
                        >
                          Bias Cam
                        </button>
                        <button
                          onClick={() => setActiveCam('crowd')}
                          className={`py-2 px-1 rounded-xl transition-all cursor-pointer border ${
                            activeCam === 'crowd'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                              : 'bg-stone-800/80 text-stone-400 border-stone-700'
                          }`}
                        >
                          Dance Floor
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-900/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-300 font-medium flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>35Hz Bone Haptics</span>
                        </span>
                        <span className="text-xs font-mono text-stone-300">84% Power</span>
                      </div>
                      <div className="flex items-end gap-1 h-8 justify-between px-1">
                        {[40, 70, 95, 60, 85, 100, 75, 90, 50, 80, 95, 65].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-amber-400 rounded-full transition-all duration-300"
                            style={{ height: `${h}%`, opacity: 0.5 + (h / 200) }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-stone-400">
                      <span>Audience Linked</span>
                      <span className="text-stone-200 font-medium">18,420 Halo Bands</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl sm:text-2xl font-bold text-[#141312]">
                    Virtual Stage Streaming
                  </h4>
                  <p className="text-stone-600 text-sm leading-relaxed font-light">
                    Stream live arena performances with low-latency audio-haptic feedback. Seamlessly toggle camera angles while your Halo pulses to the artist’s live kick drum fundamentals.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenDownloadApp}
                className="w-full py-3.5 rounded-full bg-[#141312] hover:bg-stone-800 text-[#faf7f2] font-medium text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm"
              >
                <span>Get Companion App</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mockup B: Arena Presence Suite */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#faf7f2] border border-stone-200 space-y-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-[#b45309] border border-amber-200">
                    ARENA PRESENCE SUITE
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">
                    10m AuraMesh Active
                  </span>
                </div>

                {/* Smartphone Mockup Frame B */}
                <div className="relative mx-auto w-full max-w-sm rounded-[38px] p-3 bg-stone-900 shadow-2xl border-4 border-stone-800">
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-stone-800" />
                  </div>

                  <div className="w-full bg-[#141312] rounded-[30px] p-5 pt-8 text-white space-y-3.5 overflow-hidden border border-stone-700/50">
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                      <span>10:14</span>
                      <span className="text-emerald-400">100% OFFLINE MESH</span>
                      <span>82%</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-400 text-stone-950 space-y-1.5 text-center shadow-md">
                      <div className="flex items-center justify-between text-[10px] text-stone-800 font-bold uppercase tracking-wider">
                        <span>110 dB Big Text</span>
                        <span>Visible 25ft</span>
                      </div>
                      <div className="py-2 text-2xl sm:text-3xl font-black tracking-widest break-words uppercase">
                        {bigTextPreset}
                      </div>
                      <div className="flex justify-center gap-1.5 pt-1">
                        {(['NEED WATER', 'AT SOUNDBOOTH', 'EXIT 4'] as const).map(preset => (
                          <button
                            key={preset}
                            onClick={() => setBigTextPreset(preset)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                              bigTextPreset === preset
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-white/80 text-stone-900 border-stone-300'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-300 font-medium flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Acoustic Dosimeter</span>
                        </span>
                        <span className="text-xs font-bold text-rose-400 font-mono">104 dB SPL</span>
                      </div>
                      <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full w-[64%] rounded-full" />
                      </div>
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span>Noise Dose (demo): 64%</span>
                        <span className="text-emerald-400 font-medium">Demo reading</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-200">10m Peer Radar</p>
                          <p className="text-[10px] text-stone-400">3 Halo friends detected nearby</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-900/70 text-emerald-300 text-[10px] border border-emerald-700">
                        Online (P2P)
                      </span>
                    </div>

                    <div className="pt-0.5 flex items-center justify-between text-[11px] text-stone-400">
                      <span>Arm-Angle Power Saver</span>
                      <button
                        onClick={() => setArmAngleActive(!armAngleActive)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium cursor-pointer border ${
                          armAngleActive
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-stone-800 text-stone-400 border-stone-700'
                        }`}
                      >
                        {armAngleActive ? 'Arm Raised (100%)' : 'Arm Down (20%)'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl sm:text-2xl font-bold text-[#141312]">
                    Arena Presence Suite
                  </h4>
                  <p className="text-stone-600 text-sm leading-relaxed font-light">
                    The in-venue companion app turns your device into a high-contrast festival tool: project messages silently over 110 dB roar, monitor ear safety, and locate companions via 10m offline radar.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenDownloadApp}
                className="w-full py-3.5 rounded-full bg-[#b45309] hover:bg-[#c2410c] text-white font-medium text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm"
              >
                <span>Download for In-Venue Tools</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 6. TECHNICAL SPECIFICATIONS & HARDWARE ARCHITECTURE */}
        <section id="tech-specs" className="space-y-10 pt-4">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs tracking-widest text-[#b45309] uppercase font-bold">
              TECH SPECS
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#141312] tracking-tight">
              Built with Surgical Precision
            </h2>
            <p className="text-stone-600 text-sm sm:text-base font-light leading-relaxed">
              Every millimeter of the TΛVY Halo is engineered for ergonomics, tactile acoustic fidelity, and multi-day festival reliability.
            </p>
          </div>

          <div className="rounded-3xl bg-[#faf7f2] border border-stone-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200 text-left">
              <div className="p-8 space-y-6">
                <h3 className="text-xs tracking-wider uppercase text-[#b45309] font-bold">
                  Physical &amp; Acoustic Architecture
                </h3>
                <dl className="space-y-4 text-xs">
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <dt className="text-stone-500 font-light">Chassis Material</dt>
                    <dd className="font-bold text-[#141312]">Grade 5 Aerospace Titanium</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <dt className="text-stone-500 font-light">Haptic Actuator</dt>
                    <dd className="font-bold text-[#141312]">Dual Linear Resonant Actuators (35Hz Peak)</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <dt className="text-stone-500 font-light">Optical Waveguide</dt>
                    <dd className="font-bold text-[#141312]">Frosted PMMA Total Internal Reflection (TIR)</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <dt className="text-stone-500 font-light">Sound Dosimetry Sensor</dt>
                    <dd className="font-bold text-[#141312]">Wide Dynamic Range MEMS (Up to 120 dB SPL)</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-stone-500 font-light">Water &amp; Dust Rating</dt>
                    <dd className="font-bold text-[#141312]">IP68 (Sweat, Beer &amp; Mud Proof)</dd>
                  </div>
                </dl>
              </div>

              <div className="p-8 space-y-6">
                <h3 className="text-xs tracking-wider uppercase text-[#b45309] font-bold">
                  Connectivity &amp; Battery
                </h3>
                <dl className="space-y-4 text-xs">
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <dt className="text-stone-500 font-light">Wireless Protocol</dt>
                    <dd className="font-bold text-[#141312]">AuraMesh BLE 5.3 (2.4 GHz Ad-Hoc)</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <dt className="text-stone-500 font-light">Mesh Proximity Radius</dt>
                    <dd className="font-bold text-[#141312]">10 Meters Peer-to-Peer (Zero Cell Tower)</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <dt className="text-stone-500 font-light">Battery Runtime</dt>
                    <dd className="font-bold text-[#141312]">42 Hours Active Festival Mode</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200/60">
                    <dt className="text-stone-500 font-light">Charging Mechanism</dt>
                    <dd className="font-bold text-[#141312]">Magnetic Contact Fast Charge (80% in 25m)</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-stone-500 font-light">Companion OS</dt>
                    <dd className="font-bold text-[#141312]">iOS 16+ &amp; Android 13+</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 7. OURA-STYLE LUXURY FOOTER (Full-Width, Deep Charcoal #141312) */}
      <footer className="w-full bg-[#141312] text-stone-300 pt-20 pb-14 mt-28 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
            
            {/* Left Column: Brand & Newsletter (Span 5) */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-3xl font-bold tracking-tight text-white">TΛVY</span>
              </div>

              <div className="space-y-3 max-w-md">
                <h3 className="font-editorial-serif text-2xl sm:text-3xl font-light text-white leading-snug">
                  Receive updates, acoustics research, and releases from TΛVY.
                </h3>
                <p className="text-xs text-stone-400 font-light">
                  Direct dispatches from our sound lab on bone conduction, crowd optics, and venue telemetry.
                </p>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="max-w-md space-y-2">
                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full py-3.5 pl-6 pr-14 rounded-full bg-stone-900 border border-stone-800 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#b45309] transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 p-2 rounded-full bg-white hover:bg-stone-200 text-stone-950 transition-colors cursor-pointer border-0"
                    title="Subscribe"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {newsletterSubmitted && (
                  <p className="text-xs text-amber-400 font-medium pl-4">
                    Thank you for subscribing to TΛVY Research Dispatches.
                  </p>
                )}

                <p className="text-[11px] text-stone-500 pl-4 font-light">
                  We care about protecting your data. Read our <a href="#privacy" className="underline hover:text-stone-300">Privacy Policy</a>.
                </p>
              </form>
            </div>

            {/* Right Columns: Multi-Column Navigation (Span 7) */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8 text-xs font-light">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-white uppercase tracking-wider">
                  Hardware &amp; Tech
                </p>
                <ul className="space-y-2.5 text-stone-400">
                  <li><a href="#architecture" className="hover:text-white transition-colors">Halo</a></li>
                  <li><a href="#features" className="hover:text-white transition-colors">HaloMesh Protocol</a></li>
                  <li><a href="#features" className="hover:text-white transition-colors">35Hz Bone Conduction</a></li>
                  <li><button onClick={onOpenDownloadApp} className="hover:text-white transition-colors bg-transparent border-0 p-0 text-left text-stone-400 cursor-pointer">Companion App</button></li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-white uppercase tracking-wider">
                  Company
                </p>
                <ul className="space-y-2.5 text-stone-400">
                  <li><a href="#about" className="hover:text-white transition-colors">About TΛVY</a></li>
                  <li><a href="#leadership" className="hover:text-white transition-colors">Leadership</a></li>
                  <li><a href="#accessibility" className="hover:text-white transition-colors">Music Accessibility</a></li>
                  <li><a href="#newsroom" className="hover:text-white transition-colors">Newsroom</a></li>
                  <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-white uppercase tracking-wider">
                  Support
                </p>
                <ul className="space-y-2.5 text-stone-400">
                  <li><a href="#support" className="hover:text-white transition-colors">Member Care</a></li>
                  <li><a href="#setup" className="hover:text-white transition-colors">Device Setup</a></li>
                  <li><a href="#sizing" className="hover:text-white transition-colors">Hardware Sizing</a></li>
                  <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-white uppercase tracking-wider">
                  Connect
                </p>
                <ul className="space-y-2.5 text-stone-400">
                  <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
                  <li><a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">X (Twitter)</a></li>
                  <li><a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">TikTok</a></li>
                  <li><a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">YouTube</a></li>
                  <li><a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Discord</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-4 text-[11px] text-stone-500 font-light">
            <div className="flex flex-wrap items-center gap-6">
              <a href="#terms" className="hover:text-stone-300 transition-colors">Terms &amp; Conditions</a>
              <a href="#privacy" className="hover:text-stone-300 transition-colors">Privacy Policy</a>
              <a href="#accessibility" className="hover:text-stone-300 transition-colors">Accessibility Statement</a>
              <a href="#fcc" className="hover:text-stone-300 transition-colors">FCC Compliance</a>
            </div>
            <p>
              Copyright © 2026 TΛVY Inc. All rights reserved.
            </p>
            <p className="basis-full text-[11px] leading-relaxed text-stone-500">
              TΛVY Halo is a product concept. Device connections, sound-level readings, friend locations and SOS
              features shown on this site and in the demo apps are simulated. They are not medical or hearing-safety
              advice and do not contact emergency services.
            </p>
          </div>
        </div>
      </footer>

      {/* Ford GT-Style Technical Pop-Up Architecture Modal */}
      <HaloDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};

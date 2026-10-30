import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Zap, 
  Sparkles, 
  Volume2, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Cpu, 
  Radio, 
  Maximize2 
} from 'lucide-react';
import haloExplodedImg from '../src/assets/images/halo_anatomy_popup_1792275835147.jpg';

interface HaloDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ComponentHotspot {
  id: string;
  name: string;
  badge: string;
  spec: string;
  desc: string;
  status: string;
}

export const HaloDetailModal: React.FC<HaloDetailModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activePart, setActivePart] = useState<string>('lra');

  const parts: Record<string, ComponentHotspot> = {
    lra: {
      id: 'lra',
      name: 'Resonant Sub-Bass Haptic Engine',
      badge: '35Hz - 120Hz Dual LRA',
      spec: 'Custom high-displacement linear resonant actuator tuned to 35Hz kick fundamental',
      desc: 'Converts low-frequency sound energy into visceral physical vibration delivered directly to wrist bones, empowering deaf, hard-of-hearing, and bass-loving attendees to feel the music physically.',
      status: 'Active 35Hz Resonance',
    },
    prism: {
      id: 'prism',
      name: 'Frosted Pastel Optical Prism',
      badge: '16.8M Soft Optical Waveguide',
      spec: 'Optical grade PMMA total internal reflection prism with frosted anti-glare finish',
      desc: 'Channels internal micro-LED pulses into a luminous blade visible through dense stage haze without blinding adjacent concert-goers. Synchronizes with thousands of crowd bands at 0 ms latency.',
      status: 'Calibrated Waveguide',
    },
    chassis: {
      id: 'chassis',
      name: 'Matte Titanium Unibody',
      badge: 'Aerospace Grade 5 Titanium',
      spec: 'Precision CNC-machined curved unibody with bead-blasted satin finish',
      desc: 'Designed for lightweight, all-weekend festival wearability. Hypoallergenic, sweat-resistant, and drop-proof up to 2 meters on festival grounds.',
      status: 'Grade 5 Certified',
    },
    pcb: {
      id: 'pcb',
      name: 'Micro Logic Board & AuraMesh',
      badge: 'BLE 5.3 Offline Mesh Array',
      spec: 'Aurora 7 dual-core processor with 2.4 GHz ad-hoc mesh transceiver',
      desc: 'Forms an offline localized mesh network up to 10 meters away without cellular data or venue Wi-Fi, sharing crowd density metrics and emergency safety halos.',
      status: '10m Mesh Active',
    },
    sensor: {
      id: 'sensor',
      name: 'Biometric & Acoustic Sensor Suite',
      badge: '120 dB Peak MEMS Dosimeter',
      spec: 'A-weighted SPL sound dosimetry sensor + photoplethysmography heart-rate sensor',
      desc: 'Continuously measures sound exposure against NIOSH safety limits and tracks live crowd energy, warning the user before auditory fatigue sets in.',
      status: 'Concept spec',
    },
  };

  const selectedPart = parts[activePart] || parts.lra;

  // Escape closes the dialog, like the Close button and the backdrop.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-tv-navy/50 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="halo-architecture-title"
          className="relative w-full max-w-4xl bg-tv-canvas rounded-tv-lg shadow-tv-lift border border-tv-line overflow-hidden text-tv-navy flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-tv-line bg-white/70">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono-tech tracking-wider uppercase text-tv-accent-ink font-semibold px-2.5 py-0.5 rounded-full bg-tv-mist border border-tv-line">
                  TECHNICAL ARCHITECTURE
                </span>
                <span className="text-xs text-tv-slate">· EXPLODED VIEW</span>
              </div>
              <h3 id="halo-architecture-title" className="text-xl sm:text-2xl font-bold tracking-tight text-tv-navy">
                TΛVY <span className="font-serif italic text-tv-accent-ink font-normal">Halo</span> Architecture
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-tv-line/80 text-tv-slate hover:text-tv-navy transition-colors cursor-pointer border-0 bg-transparent"
              title="Close"
              aria-label="Close"
              autoFocus
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
            {/* Exploded View Image */}
            <div className="relative rounded-2xl overflow-hidden border border-tv-line bg-tv-mist shadow-inner">
              <img
                src={haloExplodedImg}
                alt="TΛVY Halo Exploded View Technical Breakdown"
                className="w-full h-auto object-cover"
              />
              <div className="absolute bottom-3 left-4 text-xs font-medium text-tv-slate bg-white/90 px-3 py-1 rounded-full border border-tv-line backdrop-blur-sm shadow-sm">
                System-Level Component Separation
              </div>
            </div>

            {/* Component Selector Tabs */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-tv-slate tracking-wider">
                Select Sub-System to Inspect
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'lra', label: '01. Sub-Bass Haptic Engine' },
                  { id: 'prism', label: '02. Pastel Optical Prism' },
                  { id: 'chassis', label: '03. Titanium Unibody' },
                  { id: 'pcb', label: '04. AuraMesh BLE Board' },
                  { id: 'sensor', label: '05. Acoustic Dosimeter' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePart(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      activePart === tab.id
                        ? 'bg-tv-navy text-white border-tv-navy shadow-sm'
                        : 'bg-white hover:bg-tv-mist text-tv-slate border-tv-line'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Component Detail Drawer */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-tv-line space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-tv-line pb-3">
                <div>
                  <span className="text-xs font-semibold text-tv-accent-ink uppercase tracking-wider">
                    {selectedPart.badge}
                  </span>
                  <h4 className="text-lg sm:text-xl font-bold text-tv-navy mt-0.5">
                    {selectedPart.name}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{selectedPart.status}</span>
                </div>
              </div>

              <p className="text-tv-slate text-sm leading-relaxed ">
                {selectedPart.desc}
              </p>

              <div className="p-3.5 rounded-xl bg-tv-mist/60 border border-tv-line text-xs text-tv-navy">
                <span className="text-tv-slate font-semibold uppercase">Engineering Spec: </span>
                {selectedPart.spec}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="py-2.5 px-5 rounded-xl bg-tv-mist hover:bg-tv-line text-tv-navy text-xs font-medium transition-colors cursor-pointer border border-tv-line"
                >
                  Return to Overview
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

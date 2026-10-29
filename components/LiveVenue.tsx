import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Volume2, 
  ShieldAlert, 
  MessageSquare, 
  Mic, 
  Radio, 
  Sliders, 
  Sun, 
  AlertTriangle, 
  X, 
  Compass, 
  Cpu, 
  Terminal, 
  Maximize2,
  Minimize2,
  Users,
  Smartphone,
  Eye,
  Check,
  Zap,
  Activity
} from 'lucide-react';
import { LightstickPreset, DecibelTier, RadarNode, TelemetryLog, BrandName } from '../types';
import { audioSynth } from '../services/audioSynth';

interface LiveVenueProps {
  sponsorActive: boolean;
  onSetSponsorActive: (active: boolean) => void;
  sosTriggered: boolean;
  onTriggerSOS: () => void;
  onCancelSOS: () => void;
  decibelAlertActive: boolean;
  beatTick: number;
  brandName: BrandName;
}

export const LiveVenue: React.FC<LiveVenueProps> = ({
  sponsorActive,
  onSetSponsorActive,
  sosTriggered,
  onTriggerSOS,
  onCancelSOS,
  decibelAlertActive,
  beatTick,
  brandName,
}) => {
  // Panel 1: Digital Lightstick state
  const [lightPreset, setLightPreset] = useState<LightstickPreset>('kpop');
  const [sensitivity, setSensitivity] = useState(75);
  const [latencyOffset, setLatencyOffset] = useState(0); // -100ms to +100ms
  const [armRaised, setArmRaised] = useState(true); // Arm raised 100% vs arm down 20%
  const [isExpandedLightstick, setIsExpandedLightstick] = useState(false);

  // Device orientation / Gyroscope auto-detection
  const [gyroActive, setGyroActive] = useState(false);
  const [rawAngle, setRawAngle] = useState<number>(78);

  // Panel 2: Big Text Chat (AuraVision)
  const [bigText, setBigText] = useState('NEED WATER — MEET AT B');
  const [isListeningSTT, setIsListeningSTT] = useState(false);
  const [flashAssistActive, setFlashAssistActive] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isExpandedBigText, setIsExpandedBigText] = useState(false);
  const [bigTextColorMode, setBigTextColorMode] = useState<'yellow' | 'white' | 'red' | 'cyan' | 'black'>('yellow');

  // Panel 3: Hearing Health Guard
  const [dbLevel, setDbLevel] = useState(106);
  const [safeRemainingMins, setSafeRemainingMins] = useState(14);

  // Panel 4: Emergency Radar (AuraMesh) & Crowd Node Discovery
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crowdDensityPreset, setCrowdDensityPreset] = useState<'sparse' | 'medium' | 'surge'>('medium');
  const [nodeCount, setNodeCount] = useState(100);
  const [nodes, setNodes] = useState<RadarNode[]>([]);
  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const [isHoldingSos, setIsHoldingSos] = useState(false);
  const sosHoldTimer = useRef<number | null>(null);
  const [cancelCountdown, setCancelCountdown] = useState(5);
  const [surgeAlert, setSurgeAlert] = useState(true);

  // Panel 5: Watch Companion Telemetry Logs
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([
    { id: '1', timestamp: '21:04:12', direction: 'BLE_OUT', text: '[CMD: BEAT_PULSE, LRA_KICK]', type: 'pulse' },
    { id: '2', timestamp: '21:04:13', direction: 'BLE_OUT', text: '[CMD: HEALTH_WARN, DB: 106]', type: 'warn' },
    { id: '3', timestamp: '21:04:14', direction: 'BLE_IN', text: '[CMD: MESH_NODES_SYNC, COUNT: 100]', type: 'info' },
  ]);

  // Sync sponsor state with light preset
  useEffect(() => {
    if (sponsorActive) {
      setLightPreset('sponsor');
    }
  }, [sponsorActive]);

  // Decibel calculation
  useEffect(() => {
    if (decibelAlertActive) {
      setDbLevel(106);
      setSafeRemainingMins(14);
    } else {
      setDbLevel(82);
      setSafeRemainingMins(480);
    }
  }, [decibelAlertActive]);

  // Add telemetry helper
  const addTelemetry = (direction: 'BLE_OUT' | 'BLE_IN' | 'SYS', text: string, type: 'info' | 'warn' | 'alert' | 'pulse') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setTelemetryLogs(prev => [
      ...prev.slice(-12),
      { id: Math.random().toString(), timestamp: timeStr, direction, text, type }
    ]);
  };

  // Pulse telemetry on beat
  useEffect(() => {
    if (beatTick > 0) {
      addTelemetry('BLE_OUT', `[CMD: BEAT_PULSE, SYNC_${nodeCount}_NODES]`, 'pulse');
    }
  }, [beatTick, nodeCount]);

  // Device orientation (Gyroscope) listener to auto-detect if arm is up or down
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.beta !== undefined) {
        setGyroActive(true);
        const pitch = Math.round(e.beta);
        setRawAngle(pitch);
        // Arm raised in the air holds phone at pitch between 45° and 125°
        // Arm lowered to waist / down in pocket holds phone flat or downward (<40° or >140°)
        const isUp = pitch >= 45 && pitch <= 125;
        setArmRaised(isUp);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Request Gyro permission on iOS
  const requestGyro = async () => {
    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })?.requestPermission === 'function') {
      try {
        const resp = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (resp === 'granted') {
          setGyroActive(true);
        }
      } catch {
        // Fallback to manual
      }
    }
  };

  // Generate nodes based on crowd density
  useEffect(() => {
    let count = 100;
    if (crowdDensityPreset === 'sparse') count = 35;
    if (crowdDensityPreset === 'medium') count = 100;
    if (crowdDensityPreset === 'surge') count = 185;
    setNodeCount(count);

    const initialNodes: RadarNode[] = [];
    // User is center node (0, 0 in radar coordinates)
    initialNodes.push({
      id: 0,
      x: 150,
      y: 150,
      vx: 0,
      vy: 0,
      isUser: true,
      sector: 1,
      status: 'normal',
    });

    for (let i = 1; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 15 + Math.random() * 125;
      const sector = i > (count * 0.7) ? 2 : (i % 4) + 1;
      initialNodes.push({
        id: i,
        x: 150 + Math.cos(angle) * radius,
        y: 150 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        isUser: false,
        sector,
        status: sector === 2 && count > 120 ? 'surge' : 'normal',
      });
    }
    setNodes(initialNodes);
    setSurgeAlert(count > 120);

    addTelemetry('BLE_IN', `[CMD: MESH_DISCOVERY, ACTIVE_APPS: ${count}]`, 'info');
  }, [crowdDensityPreset]);

  // Color helper
  const getLightstickColor = () => {
    if (lightPreset === 'sponsor') return '#dc0032';
    if (lightPreset === 'cyber') return '#00f2fe';
    return '#ff007a'; // K-Pop neon
  };

  const getPresetLabel = () => {
    if (lightPreset === 'sponsor') return 'Sponsor Red Bull';
    if (lightPreset === 'cyber') return 'Cyber Blue';
    return 'K-Pop Neon';
  };

  // Radar canvas animation loop — dots correlate and flash the SAME color at the same time!
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Draw radar rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      [35, 70, 105, 140].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, 10);
      ctx.lineTo(cx, h - 10);
      ctx.moveTo(10, cy);
      ctx.lineTo(w - 10, cy);
      ctx.stroke();

      // Correlated flash color from lightstick
      const activeColor = getLightstickColor();
      const isBeatPulse = beatTick % 2 === 0;

      // 10m Red Halo when SOS active
      if (sosTriggered) {
        ctx.save();
        const haloRadius = 60; // 10m scale
        const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, haloRadius);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        gradient.addColorStop(0.7, 'rgba(239, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw mesh connections between nearby discovered devices
      nodes.forEach((n, idx) => {
        const dx = n.x - cx;
        const dy = n.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const inHalo = sosTriggered && dist <= 60;

        if (idx % 3 === 0) {
          ctx.strokeStyle = inHalo
            ? 'rgba(239, 68, 68, 0.5)'
            : isBeatPulse
            ? `${activeColor}40`
            : 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }

        // DRAW NODE DOT — Correlating and flashing the same color at the same time!
        ctx.beginPath();
        if (n.isUser) {
          // You
          ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = sosTriggered ? '#ef4444' : activeColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (inHalo) {
          // In 10m SOS halo
          ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        } else if (n.sector === 2 && n.status === 'surge') {
          // Surge node
          ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = isBeatPulse ? activeColor : '#f59e0b';
          ctx.fill();
        } else {
          // Other apps in the crowd flashing simultaneously!
          ctx.arc(n.x, n.y, isBeatPulse ? 3 : 2, 0, Math.PI * 2);
          // If on beat, pulse the EXACT lightstick color; otherwise subtle glow
          ctx.fillStyle = isBeatPulse ? activeColor : 'rgba(255, 255, 255, 0.45)';
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [nodes, sosTriggered, beatTick, lightPreset, sponsorActive]);

  // SOS button hold logic
  const handleSosMouseDown = () => {
    setIsHoldingSos(true);
    setSosHoldProgress(0);
    const start = Date.now();
    sosHoldTimer.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / 3000) * 100);
      setSosHoldProgress(pct);
      if (pct >= 100) {
        clearInterval(sosHoldTimer.current!);
        setIsHoldingSos(false);
        onTriggerSOS();
        audioSynth.playSOS();
        audioSynth.triggerHaptic([200, 100, 200, 100, 300]);
        addTelemetry('BLE_IN', '[CMD: WATCH_SOS_ACTIVE, RADIUS: 10M]', 'alert');
      }
    }, 50);
  };

  const handleSosMouseUp = () => {
    if (sosHoldTimer.current) {
      clearInterval(sosHoldTimer.current);
    }
    setIsHoldingSos(false);
    setSosHoldProgress(0);
  };

  // SOS cancel countdown
  useEffect(() => {
    let cancelTimer: number;
    if (sosTriggered) {
      setCancelCountdown(5);
      cancelTimer = window.setInterval(() => {
        setCancelCountdown(prev => {
          if (prev <= 1) {
            clearInterval(cancelTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(cancelTimer);
  }, [sosTriggered]);

  // STT simulation
  const handleHoldSTT = () => {
    setIsListeningSTT(true);
    audioSynth.playTap();
    const mockTranscripts = [
      'NEED WATER — MEET AT B',
      'LOST MY FRIEND BY EXIT 4',
      'MEET AT FIRST AID TENT',
      'HEAD TO MERCH BOOTH NOW',
    ];
    setTimeout(() => {
      const chosen = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setBigText(chosen);
      setIsListeningSTT(false);
      audioSynth.triggerHaptic([60]);
    }, 1500);
  };

  // Hazard Tier Badge styling
  const getHazardCategory = (): { text: string; color: string; badgeClass: string } => {
    if (dbLevel < 85) {
      return {
        text: 'Safe: < 85 dB',
        color: '#10b981',
        badgeClass: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300',
      };
    }
    if (dbLevel <= 100) {
      return {
        text: 'Caution: 85 - 100 dB',
        color: '#f59e0b',
        badgeClass: 'bg-amber-950/60 border-amber-500/30 text-amber-300',
      };
    }
    return {
      text: 'Hazard: > 100 dB',
      color: '#ef4444',
      badgeClass: 'bg-red-950/60 border-red-500/40 text-red-300 animate-pulse',
    };
  };

  const hazard = getHazardCategory();

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* 1. EXPANDED FULLSCREEN LIGHTSTICK MODAL (Covers whole phone screen) */}
      <AnimatePresence>
        {isExpandedLightstick && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none"
            style={{ touchAction: 'none' }}
          >
            {/* Edge-to-edge pulsing strobe surface */}
            <div
              className="absolute inset-0 transition-opacity duration-100"
              style={{
                backgroundColor: getLightstickColor(),
                opacity: (beatTick % 2 === 0 ? 0.98 : 0.25) * (armRaised ? 1.0 : 0.2),
              }}
            />

            {/* Powerful upward-projected optical beam cone cutting through arena haze */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 md:w-96 h-full bg-gradient-to-t from-white/95 via-white/30 to-transparent blur-xl pointer-events-none"
              style={{
                clipPath: 'polygon(35% 100%, 65% 100%, 95% 0%, 5% 0%)',
                opacity: armRaised ? 0.95 : 0.2,
              }}
            />

            {/* Top Bar with Synchronized Crowd Telemetry & Close Button */}
            <div className="relative z-20 p-5 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="font-heading font-black text-sm md:text-base tracking-widest text-white">
                    ARENA MESH CHOREOGRAPHY
                  </span>
                </div>
                <p className="text-xs font-mono-tech text-white/90">
                  Flashing {getPresetLabel()} with {nodeCount} nearby discovered apps
                </p>
              </div>

              <button
                onClick={() => setIsExpandedLightstick(false)}
                className="p-3 rounded-2xl bg-black/70 hover:bg-black/90 text-white cursor-pointer border border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Exit Fullscreen Lightstick"
              >
                <Minimize2 className="w-6 h-6" />
              </button>
            </div>

            {/* Center Content: State Indicator & Automatic Tilt Detection */}
            <div className="relative z-20 text-center px-4 space-y-4">
              <motion.div
                animate={{ scale: beatTick % 2 === 0 ? [1, 1.05, 1] : 1 }}
                className="space-y-2"
              >
                <p className="font-heading font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-widest uppercase drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
                  {lightPreset === 'sponsor' ? 'RED BULL TAKEOVER' : lightPreset.toUpperCase()}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/30 text-white font-mono-tech text-xs md:text-sm shadow-xl">
                  <span>Power Output:</span>
                  <span className={`font-bold ${armRaised ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {armRaised ? '100% (Arm Raised Up)' : '20% (Arm Down · Power Saver)'}
                  </span>
                </div>
              </motion.div>

              <p className="text-xs font-mono-tech text-white/80 max-w-md mx-auto bg-black/50 p-2.5 rounded-xl border border-white/15">
                {gyroActive
                  ? `Gyroscope Auto-Detecting (${rawAngle}°): Wave your phone in the air to boost brightness!`
                  : 'Tilt phone up to automatically jump to 100% brightness · Lower to dim to 20%'}
              </p>
            </div>

            {/* Bottom Controls: Preset Switcher & Arm-Angle Manual Override */}
            <div className="relative z-20 p-5 bg-gradient-to-t from-black/95 via-black/75 to-transparent space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 max-w-xl mx-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setLightPreset('kpop');
                      onSetSponsorActive(false);
                      audioSynth.playTap();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono-tech font-bold transition-all cursor-pointer border ${
                      lightPreset === 'kpop'
                        ? 'bg-[#ff007a] text-white border-pink-400 shadow-[0_0_15px_rgba(255,0,122,0.6)]'
                        : 'bg-black/60 text-slate-300 border-white/20'
                    }`}
                  >
                    K-Pop Neon
                  </button>
                  <button
                    onClick={() => {
                      setLightPreset('cyber');
                      onSetSponsorActive(false);
                      audioSynth.playTap();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono-tech font-bold transition-all cursor-pointer border ${
                      lightPreset === 'cyber'
                        ? 'bg-[#00f2fe] text-black border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.6)]'
                        : 'bg-black/60 text-slate-300 border-white/20'
                    }`}
                  >
                    Cyber Blue
                  </button>
                  <button
                    onClick={() => {
                      setLightPreset('sponsor');
                      onSetSponsorActive(true);
                      audioSynth.playTap();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono-tech font-bold transition-all cursor-pointer border ${
                      lightPreset === 'sponsor'
                        ? 'bg-gradient-to-r from-[#003882] to-[#dc0032] text-white border-red-400 shadow-[0_0_15px_rgba(220,0,50,0.6)]'
                        : 'bg-black/60 text-slate-300 border-white/20'
                    }`}
                  >
                    Sponsor
                  </button>
                </div>

                {/* Tilt Override Toggle */}
                <button
                  onClick={() => {
                    setArmRaised(!armRaised);
                    audioSynth.playTap();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono-tech font-bold bg-white/20 hover:bg-white/30 text-white border border-white/30 cursor-pointer"
                >
                  Toggle Tilt ({armRaised ? 'Up 100%' : 'Down 20%'})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. EXPANDED FULLSCREEN BIG TEXT CHAT MODAL (Readable across 15+ feet) */}
      <AnimatePresence>
        {isExpandedBigText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`fixed inset-0 z-50 flex flex-col justify-between p-6 select-none transition-colors duration-300 ${
              bigTextColorMode === 'yellow'
                ? 'bg-[#fffa65] text-black'
                : bigTextColorMode === 'cyan'
                ? 'bg-[#00f2fe] text-black'
                : bigTextColorMode === 'red'
                ? 'bg-[#dc0032] text-white'
                : 'bg-black text-white'
            }`}
          >
            {/* Top Bar with Title, Color Mode & Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-sm tracking-wider uppercase">
                  {brandName}VISION BIG TEXT
                </span>
                <span className="text-xs font-mono-tech opacity-75">
                  · High-Visibility Stadium Mode
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Color Schemes */}
                <button
                  onClick={() => setBigTextColorMode('yellow')}
                  className={`w-7 h-7 rounded-full bg-[#fffa65] border-2 cursor-pointer ${
                    bigTextColorMode === 'yellow' ? 'border-black scale-110' : 'border-black/30'
                  }`}
                  title="Neon Yellow Mode"
                />
                <button
                  onClick={() => setBigTextColorMode('cyan')}
                  className={`w-7 h-7 rounded-full bg-[#00f2fe] border-2 cursor-pointer ${
                    bigTextColorMode === 'cyan' ? 'border-black scale-110' : 'border-black/30'
                  }`}
                  title="Cyan Mode"
                />
                <button
                  onClick={() => setBigTextColorMode('black')}
                  className={`w-7 h-7 rounded-full bg-black border-2 cursor-pointer ${
                    bigTextColorMode === 'black' ? 'border-white scale-110' : 'border-white/30'
                  }`}
                  title="High-Contrast Black Mode"
                />
                <button
                  onClick={() => setBigTextColorMode('red')}
                  className={`w-7 h-7 rounded-full bg-[#dc0032] border-2 cursor-pointer ${
                    bigTextColorMode === 'red' ? 'border-white scale-110' : 'border-white/30'
                  }`}
                  title="Emergency Red Mode"
                />

                <button
                  onClick={() => setIsExpandedBigText(false)}
                  className="p-2.5 rounded-2xl bg-black/20 hover:bg-black/30 border border-current ml-2 cursor-pointer"
                  title="Minimize Big Text"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Massive Readable Typography */}
            <div className="flex-1 flex items-center justify-center text-center px-4">
              <p className="font-heading font-black text-5xl sm:text-7xl md:text-8xl tracking-tight leading-none uppercase break-words max-w-4xl select-all drop-shadow-sm">
                {bigText}
              </p>
            </div>

            {/* Quick Macro Switchers at the bottom */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-4xl mx-auto">
                {['Wait Here', 'Follow Me', 'Need Water', 'Restroom'].map(phrase => (
                  <button
                    key={phrase}
                    onClick={() => {
                      setBigText(phrase.toUpperCase());
                      audioSynth.playTap();
                      audioSynth.triggerHaptic([40]);
                    }}
                    className={`py-3.5 px-3 rounded-2xl font-heading font-black text-xs md:text-sm tracking-wider uppercase transition-all cursor-pointer border-2 ${
                      bigText.toLowerCase().includes(phrase.toLowerCase())
                        ? 'bg-current text-white invert border-transparent shadow-xl'
                        : 'bg-black/10 hover:bg-black/20 border-current/40'
                    }`}
                  >
                    [ {phrase} ]
                  </button>
                ))}
              </div>

              {/* Flash screen beacon */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setFlashAssistActive(true);
                    audioSynth.playTap();
                  }}
                  className="px-6 py-2.5 rounded-full font-mono-tech text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-slate-800 transition-colors cursor-pointer border-0 shadow-lg"
                >
                  Trigger Ultra-Bright Screen Beacon
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Flash Assist full screen overlay when triggered */}
      {flashAssistActive && (
        <div
          onClick={() => setFlashAssistActive(false)}
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center cursor-pointer select-none text-black animate-pulse"
        >
          <p className="font-heading font-black text-4xl sm:text-6xl text-center px-4 tracking-tighter">
            I AM HERE!
          </p>
          <p className="text-sm font-mono-tech mt-4 bg-black text-white px-4 py-2 rounded-xl">
            Tap anywhere to dismiss Flash Beacon
          </p>
        </div>
      )}

      {/* Main Grid of Panels 1-4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL 1: DIGITAL LIGHTSTICK PANEL */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-mono-tech uppercase tracking-wider text-white font-bold">
                PANEL 1: DIGITAL LIGHTSTICK
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-tech px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
                128 BPM Sync
              </span>
              <button
                onClick={() => setIsExpandedLightstick(true)}
                className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 cursor-pointer flex items-center gap-1 text-xs font-mono-tech"
                title="Expand to Fullscreen Phone Lightstick"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand Phone</span>
              </button>
            </div>
          </div>

          {/* Strobe Container & Optical Beam Indicator */}
          <div className="relative h-60 w-full rounded-2xl overflow-hidden border border-white/10 bg-black flex flex-col items-center justify-center p-6 group">
            {/* Pulsing Strobe Background */}
            <div
              className="absolute inset-0 transition-opacity duration-100"
              style={{
                backgroundColor: getLightstickColor(),
                opacity: (beatTick % 2 === 0 ? 0.95 : 0.2) * (armRaised ? 1.0 : 0.2),
              }}
            />

            {/* Optical Beam Indicator cutting through haze */}
            <div
              className="absolute bottom-0 w-36 h-full bg-gradient-to-t from-white/90 via-white/25 to-transparent blur-md pointer-events-none"
              style={{
                clipPath: 'polygon(30% 100%, 70% 100%, 95% 0%, 5% 0%)',
                opacity: armRaised ? 0.9 : 0.25,
              }}
            />

            {/* Foreground Telemetry Text */}
            <div className="relative z-10 text-center space-y-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              <p className="font-heading font-black text-2xl md:text-3xl text-white tracking-widest uppercase">
                {lightPreset === 'sponsor' ? 'RED BULL TAKEOVER' : lightPreset.toUpperCase() + ' STROBE'}
              </p>
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs font-mono-tech text-white/90 bg-black/60 px-3 py-1 rounded-full border border-white/20 inline-block">
                  Power: {armRaised ? '100% (Arm Raised)' : '20% (Arm Down - Power Save)'}
                </p>
                <p className="text-[11px] font-mono-tech text-cyan-300 bg-black/70 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  {nodeCount} crowd devices synchronized in real-time
                </p>
              </div>
            </div>

            {/* Hover expand button */}
            <button
              onClick={() => setIsExpandedLightstick(true)}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-mono-tech border border-white/20 opacity-90 group-hover:opacity-100 flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
            >
              <Smartphone className="w-3.5 h-3.5 text-pink-400" />
              <span>Use as Handheld Lightstick</span>
            </button>
          </div>

          {/* Presets Switcher */}
          <div className="space-y-2">
            <p className="text-xs font-mono-tech text-slate-400 uppercase">Lightstick Palette Presets</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setLightPreset('kpop');
                  onSetSponsorActive(false);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold font-mono-tech transition-all cursor-pointer border ${
                  lightPreset === 'kpop'
                    ? 'bg-[#ff007a] text-white border-pink-400 shadow-[0_0_15px_rgba(255,0,122,0.4)]'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                [ K-Pop Neon ]
              </button>
              <button
                onClick={() => {
                  setLightPreset('cyber');
                  onSetSponsorActive(false);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold font-mono-tech transition-all cursor-pointer border ${
                  lightPreset === 'cyber'
                    ? 'bg-[#00f2fe] text-black border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.4)]'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                [ Cyber Blue ]
              </button>
              <button
                onClick={() => {
                  setLightPreset('sponsor');
                  onSetSponsorActive(true);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold font-mono-tech transition-all cursor-pointer border ${
                  lightPreset === 'sponsor'
                    ? 'bg-gradient-to-r from-[#003882] to-[#dc0032] text-white border-red-400 shadow-[0_0_15px_rgba(220,0,50,0.5)]'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                [ Sponsor Takeover ]
              </button>
            </div>
          </div>

          {/* Calibration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs font-mono-tech text-slate-300">
                <span>Sensitivity</span>
                <span className="text-cyan-400">{sensitivity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={sensitivity}
                onChange={e => setSensitivity(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 font-mono-tech">Filters ambient crowd rumble</p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs font-mono-tech text-slate-300">
                <span>Acoustic Delay</span>
                <span className="text-pink-400">{latencyOffset > 0 ? `+${latencyOffset}` : latencyOffset} ms</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={latencyOffset}
                onChange={e => setLatencyOffset(Number(e.target.value))}
                className="w-full accent-pink-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 font-mono-tech">Arena acoustics alignment</p>
            </div>
          </div>

          {/* Arm-Angle Power Saver Toggle & Automatic Detection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white font-mono-tech">[ Arm-Angle Power Saver ]</p>
                {gyroActive && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    Gyro Auto ({rawAngle}°)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Dim to 20% when arm is down · 100% when raised (User does not need to stare at phone)
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setArmRaised(!armRaised);
                  audioSynth.playTap();
                  addTelemetry(
                    'BLE_OUT',
                    armRaised ? '[CMD: ARM_DOWN, POWER: 20%]' : '[CMD: ARM_UP, POWER: 100%]',
                    'info'
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono-tech font-bold transition-colors cursor-pointer border ${
                  armRaised
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {armRaised ? 'Arm Raised (100%)' : 'Arm Down (20%)'}
              </button>
            </div>
          </div>
        </div>

        {/* PANEL 2: IN-VENUE "BIG TEXT" CHAT (AURAVISION) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono-tech uppercase tracking-wider text-white font-bold">
                PANEL 2: BIG TEXT CHAT (110 dB)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-tech px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                {brandName}VISION
              </span>
              <button
                onClick={() => setIsExpandedBigText(true)}
                className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 cursor-pointer flex items-center gap-1 text-xs font-mono-tech"
                title="Expand Big Text to Full Screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand Text</span>
              </button>
            </div>
          </div>

          {/* Massive High-Contrast Typography Readout */}
          <div className="h-60 w-full rounded-2xl bg-black border-2 border-white p-6 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(255,255,255,0.15)] relative overflow-hidden group">
            <span className="absolute top-3 left-4 text-[10px] font-mono-tech text-white/50 tracking-widest uppercase">
              READABLE FROM 5+ FEET OVER 110 dB
            </span>
            <p className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight select-all">
              &ldquo;{bigText}&rdquo;
            </p>

            <button
              onClick={() => setIsExpandedBigText(true)}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono-tech border border-white/20 flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Screen Display</span>
            </button>
          </div>

          {/* Voice PTT & Flash Assist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onMouseDown={handleHoldSTT}
              onTouchStart={handleHoldSTT}
              className={`py-3.5 px-4 rounded-2xl font-bold font-mono-tech text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                isListeningSTT
                  ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{isListeningSTT ? 'LISTENING (HIGH-SPL)...' : '[ HOLD TO SPEAK (STT) ]'}</span>
            </button>

            <button
              onClick={() => {
                setFlashAssistActive(true);
                audioSynth.playTap();
              }}
              className="py-3.5 px-4 rounded-2xl font-bold font-mono-tech text-xs tracking-wider uppercase bg-white text-black hover:bg-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            >
              <Sun className="w-4 h-4" />
              <span>Screen Flash Assist</span>
            </button>
          </div>

          {/* 4 Large Quick-Reply Cards */}
          <div className="space-y-2">
            <p className="text-xs font-mono-tech text-slate-400 uppercase">Quick Reply Macro Cards</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Wait Here', 'Follow Me', 'Need Water', 'Restroom'].map(phrase => (
                <button
                  key={phrase}
                  onClick={() => {
                    setBigText(phrase.toUpperCase());
                    audioSynth.playTap();
                    audioSynth.triggerHaptic([40]);
                  }}
                  className={`py-3 px-2 rounded-xl text-xs font-bold font-mono-tech transition-all cursor-pointer border text-center ${
                    bigText.toLowerCase().includes(phrase.toLowerCase())
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  [ {phrase} ]
                </button>
              ))}
            </div>
          </div>

          {/* Custom Typing Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or type custom emergency text..."
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customInput.trim()) {
                  setBigText(customInput.toUpperCase());
                  setCustomInput('');
                }
              }}
              className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-2 text-xs font-mono-tech text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => {
                if (customInput.trim()) {
                  setBigText(customInput.toUpperCase());
                  setCustomInput('');
                }
              }}
              className="px-4 py-2 rounded-xl bg-cyan-400 text-black text-xs font-bold font-mono-tech cursor-pointer border-0"
            >
              Set
            </button>
          </div>
        </div>

        {/* PANEL 3: HEARING HEALTH & DECIBEL GUARD */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono-tech uppercase tracking-wider text-white font-bold">
                PANEL 3: HEARING HEALTH GUARD
              </span>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-mono-tech border ${hazard.badgeClass}`}>
              {hazard.text}
            </div>
          </div>

          {/* Decibel Level Gauge Display */}
          <div className="p-6 rounded-2xl bg-black/60 border border-white/10 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-heading font-black text-5xl md:text-6xl text-white tracking-tighter">
                  {dbLevel}
                </span>
                <span className="text-lg font-mono-tech text-slate-400 ml-2">dB SPL</span>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-mono-tech text-slate-400 uppercase">SAFE EXPOSURE REMAINING</p>
                <p className={`font-mono-tech text-lg font-bold ${dbLevel > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {safeRemainingMins} Mins Remaining
                </p>
              </div>
            </div>

            {/* Visual Gauge Bar */}
            <div className="space-y-1.5">
              <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dbLevel > 100
                      ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (dbLevel / 120) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono-tech text-slate-500">
                <span>0 dB</span>
                <span>85 dB (Safe)</span>
                <span>100 dB (Caution)</span>
                <span className="text-red-400">120 dB (Max SPL)</span>
              </div>
            </div>
          </div>

          {/* Intervention Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              dbLevel > 100
                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 shrink-0 ${dbLevel > 100 ? 'text-red-400' : 'text-emerald-400'}`} />
              <div className="space-y-1">
                <p className="text-xs font-bold font-mono-tech uppercase">
                  {dbLevel > 100 ? 'Hearing Protection Strongly Recommended' : 'Acoustic Pressure Within Safe Limits'}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {dbLevel > 100
                    ? 'Arena sound exceeds 100 dB threshold. Insert high-fidelity earplugs to avoid permanent auditory hair cell fatigue.'
                    : 'Arena acoustic exposure is healthy. Haptic monitoring remains actively armed.'}
                </p>
              </div>
            </div>
          </div>

          {/* Telemetry and Controls */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono-tech">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400">Haptic Threshold:</span>
              <p className="font-bold text-cyan-400 mt-0.5">ARMED (&gt;100 dB Pulse)</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400">Dosimeter Status:</span>
              <p className="font-bold text-white mt-0.5">Continuous Leq(A)</p>
            </div>
          </div>
        </div>

        {/* PANEL 4: OFFLINE EMERGENCY RADAR (AURAMESH) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="text-xs font-mono-tech uppercase tracking-wider text-white font-bold">
                PANEL 4: OFFLINE EMERGENCY RADAR
              </span>
            </div>
            <span className="text-xs font-mono-tech px-2.5 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-300">
              {brandName}MESH ({nodeCount} DISCOVERED APPS)
            </span>
          </div>

          {/* Radar Canvas with active attendee dots */}
          <div className="relative h-64 w-full rounded-2xl bg-black border border-white/10 overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={320}
              height={250}
              className="w-full h-full object-contain"
            />

            {/* Radar Corner Badges */}
            <div className="absolute top-3 left-3 text-[10px] font-mono-tech text-cyan-400 bg-black/70 px-2 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>{nodeCount} Apps Detected (Dots)</span>
              </div>
            </div>

            <div className="absolute top-3 right-3 text-[10px] font-mono-tech text-white/80 bg-black/70 px-2 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
              <span>All lights synced in unison</span>
            </div>

            {/* Crowd Density Alert */}
            {surgeAlert && !sosTriggered && (
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-amber-950/90 border border-amber-500/50 text-[11px] font-mono-tech text-amber-200 flex items-center justify-between shadow-lg">
                <span className="font-bold">⚠️ Warning: Surge Detected in Sector 2 ({nodeCount} apps clustering)</span>
                <button
                  onClick={() => setSurgeAlert(false)}
                  className="text-amber-400 hover:text-white cursor-pointer border-0 bg-transparent p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Active Distress Banner */}
            {sosTriggered && (
              <div className="absolute top-3 right-3 left-3 p-2.5 rounded-xl bg-red-950/95 border border-red-500 text-xs font-mono-tech text-white flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse">
                <span className="font-bold">🚨 Distress Beacon Active: 10m Safety Halo Lit</span>
                <span className="text-red-300">14 Nodes Responded</span>
              </div>
            )}
          </div>

          {/* Crowd Discovery Density Selector (More dots means more crowd) */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-tech">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Crowd Density Discovery (Dots = Other Apps):</span>
              </span>
              <span className="text-cyan-300 font-bold">{nodeCount} Nodes Detected</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setCrowdDensityPreset('sparse')}
                className={`py-1.5 px-2 rounded-xl text-xs font-mono-tech font-bold transition-all cursor-pointer border ${
                  crowdDensityPreset === 'sparse'
                    ? 'bg-cyan-500 text-black border-cyan-400'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Sparse (35)
              </button>
              <button
                onClick={() => setCrowdDensityPreset('medium')}
                className={`py-1.5 px-2 rounded-xl text-xs font-mono-tech font-bold transition-all cursor-pointer border ${
                  crowdDensityPreset === 'medium'
                    ? 'bg-cyan-500 text-black border-cyan-400'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Medium (100)
              </button>
              <button
                onClick={() => setCrowdDensityPreset('surge')}
                className={`py-1.5 px-2 rounded-xl text-xs font-mono-tech font-bold transition-all cursor-pointer border ${
                  crowdDensityPreset === 'surge'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Crowd Surge (185)
              </button>
            </div>
          </div>

          {/* SOS Hold Trigger Button or Cancel Bar */}
          {!sosTriggered ? (
            <div className="space-y-2">
              <button
                onMouseDown={handleSosMouseDown}
                onMouseUp={handleSosMouseUp}
                onTouchStart={handleSosMouseDown}
                onTouchEnd={handleSosMouseUp}
                className="relative w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-heading font-black text-sm tracking-wider uppercase transition-all overflow-hidden flex items-center justify-center gap-3 cursor-pointer border-0 shadow-[0_0_25px_rgba(239,68,68,0.4)]"
              >
                {/* Hold progress bar fill */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-red-900 transition-all duration-75"
                  style={{ width: `${sosHoldProgress}%` }}
                />
                <span className="relative z-10">
                  {isHoldingSos ? `HOLDING... ${Math.round(sosHoldProgress)}%` : '[ HOLD 3s FOR WATCH SOS ]'}
                </span>
              </button>
              <p className="text-[11px] text-center font-mono-tech text-slate-400">
                Transmits offline safety perimeter alert to all wristbands within 10 meters
              </p>
            </div>
          ) : (
            /* False-Alarm Cancel Bar */
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono-tech">
                <span className="text-red-300 font-bold">False-Alarm Cancel Window</span>
                <span className="text-white font-bold">{cancelCountdown}s remaining</span>
              </div>
              <button
                onClick={() => {
                  onCancelSOS();
                  audioSynth.playTap();
                  addTelemetry('BLE_OUT', '[CMD: WATCH_SOS_CANCELLED]', 'info');
                }}
                className="w-full py-3 rounded-xl bg-white text-black font-bold font-mono-tech text-xs tracking-wider uppercase hover:bg-slate-200 transition-colors cursor-pointer border-0"
              >
                [ CANCEL SOS BEACON ]
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PANEL 5: WATCH COMPANION CONSOLE (HARDWARE SIMULATOR) */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-950 border border-white/15 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="font-heading text-lg font-bold text-white tracking-wide">
              PANEL 5: TAVY HALO COMPANION CONSOLE
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono-tech text-slate-400">
            <span>DEVICE ID: TAVY-HALO-01</span>
            <span>·</span>
            <span className="text-emerald-400">BLE 5.3 LINKED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Hardware Twin Graphic & Orientation Tracker */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono-tech">
                <span className="text-slate-400">Visual Wristband: Acrylic Blade Glow</span>
                <span className="text-cyan-400 font-bold">Active Kick Waveform</span>
              </div>

              {/* Graphic representation of acrylic blade */}
              <div className="h-10 w-full rounded-xl bg-slate-900 border border-white/15 p-1 relative flex items-center justify-between overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-150"
                  style={{
                    backgroundColor: getLightstickColor(),
                    width: beatTick % 2 === 0 ? '100%' : '35%',
                    boxShadow: `0 0 20px ${getLightstickColor()}`,
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono-tech text-white font-bold tracking-widest pointer-events-none">
                  LRA SUB-BASS ACTUATOR (45Hz RESONANCE)
                </span>
              </div>

              {/* Automatic & Manual Orientation Tracker */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 text-xs font-mono-tech gap-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">
                    Tilt Status: {armRaised ? 'Arm Raised (100% Power)' : 'Arm Down (20% Power)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setArmRaised(!armRaised);
                      audioSynth.playTap();
                      addTelemetry(
                        'BLE_OUT',
                        !armRaised ? '[CMD: ARM_RAISED, OUTPUT: 100%]' : '[CMD: ARM_LOWERED, OUTPUT: 20%]',
                        'info'
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer border border-white/15"
                  >
                    Toggle Tilt
                  </button>
                  {!gyroActive && (
                    <button
                      onClick={requestGyro}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-pointer"
                    >
                      Enable Gyro
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Serial Telemetry Monitor Terminal */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-black border border-white/15 p-4 space-y-2 font-mono-tech">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SERIAL TELEMETRY MONITOR</span>
                </span>
                <span className="text-[10px] text-emerald-400">STREAMING</span>
              </div>

              <div className="h-32 overflow-y-auto space-y-1 text-xs">
                {telemetryLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-2">
                    <span className="text-slate-600 text-[10px]">{log.timestamp}</span>
                    <span
                      className={`text-[11px] font-bold ${
                        log.direction === 'BLE_OUT'
                          ? 'text-cyan-400'
                          : log.direction === 'BLE_IN'
                          ? 'text-pink-400'
                          : 'text-amber-400'
                      }`}
                    >
                      &gt;&gt; {log.direction}:
                    </span>
                    <span
                      className={`text-xs ${
                        log.type === 'alert'
                          ? 'text-red-400 font-bold'
                          : log.type === 'warn'
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

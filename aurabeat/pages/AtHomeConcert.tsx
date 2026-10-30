import { useEffect, useId, useRef, useState } from "react";
import ScreenHeader from "../components/ScreenHeader";
import PerformanceMedia from "../components/PerformanceMedia";
import AuraStage from "../components/AuraStage";
import LyricsDisplay from "../components/LyricsDisplay";
import Lightstick from "../components/Lightstick";
import PlayerControls from "../components/PlayerControls";
import SensoryToggle from "../components/SensoryToggle";
import BeatIndicator from "../components/BeatIndicator";
import CrowdAtmosphere from "../components/CrowdAtmosphere";
import AuraEnergy from "../components/AuraEnergy";
import CinematicInteraction from "../components/CinematicInteraction";
import VirtualPerformerStage from "../components/VirtualPerformerStage";
import { activePerformance as track, PERFORMANCE_CREDIT } from "../data/performance";
import { beatPosition, formatTime, intensityAt, sectionAt } from "../lib/beat";
import { isHighEnergy, stageLook, visualPulse } from "../lib/stage";
import { interactionAt, nextWave, nextWaveJump } from "../lib/interaction";
import { unlockAudio } from "../lib/audio";
import { scoreWave, type WaveGrade } from "../lib/scoring";
import { emitMovement, onMovement, phoneCanVibrate, sendHaptic, stopHaptics } from "../lib/watchBridge";
import { usePlayback } from "../hooks/usePlayback";
import { useMediaClock } from "../hooks/useMediaClock";
import { useSettings } from "../hooks/useSettings";
import { useBeatSound } from "../hooks/useBeatSound";
import { useWatchStatus } from "../hooks/useWatchStatus";
import type { LightstickState } from "../types/concert";
import type { SectionMood } from "../types/performance";
import { SaveMomentCard } from "../../components/memory/SaveMomentCard";
import type { ConcertMoment } from "../../components/memory/moment";

interface AtHomeConcertProps {
  onExit: () => void;
  onSwitchMode: () => void;
  /** TΛVY Memory Book: offered only while playback is stopped, after the performance has played. */
  onSaveMoment?: (moment: ConcertMoment) => void;
}

/** Presentation only: how much each mood adds to the visible energy of the concert. */
const MOOD_ENERGY: Record<SectionMood, number> = {
  restrained: 0.75,
  cool: 0.85,
  rising: 0.95,
  anticipation: 0.95,
  peak: 0.9,
  finale: 1,
};

/**
 * How the performance is presented. Both use the same media element as sound and clock:
 * "video" shows the recorded concert video, "virtual" draws an animated (simulated) performer over it.
 */
type PerformanceView = "virtual" | "video";
const VIEW_KEY = "tavy.concert.view";

function initialView(): PerformanceView {
  try {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === "virtual" || saved === "video") return saved;
  } catch {
    // Storage unavailable: fall through to the default.
  }
  return "video";
}

/** How long the concert stays "activated" after the audience moves with the music. */
const CELEBRATE_MS = 2600;

/** The result shown after a wave: a timing grade, or Miss when a wave moment passed without one. */
interface WaveFeedback {
  id: number;
  grade: WaveGrade | "Miss";
  points: number;
  detail: string;
}

/** A wave moment only counts as missed if playback ran through its end, not if the user seeked away. */
const MISS_GRACE_S = 0.75;

/**
 * At-home Concert (ported from AuraBeat). The performance video's currentTime is the single clock for
 * light, lyrics, haptics and the Wave with the Music moments. A wave counts only inside a wave window;
 * here it comes from the on-screen Tap button (or a connected wearable), and is scored by how close
 * it lands to the beat.
 */
export default function AtHomeConcert({ onExit, onSwitchMode, onSaveMoment }: AtHomeConcertProps) {
  const { settings, toggle } = useSettings();
  const wearable = useWatchStatus() === "connected";
  const sensesId = useId();
  const tapHintId = useId();
  const [sensesOpen, setSensesOpen] = useState(false);
  const [view, setView] = useState<PerformanceView>(initialView);
  const chooseView = (next: PerformanceView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
  };

  // Stage mode for TVs: the whole concert screen (not just the video) goes full screen, so the cue,
  // lyrics and lighting stay with the performance.
  const stageRef = useRef<HTMLDivElement>(null);
  const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stageRef.current?.requestFullscreen();
  };

  // Clock: the performance video is the source of truth; the mock timer runs only if it fails to load.
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaFailed, setMediaFailed] = useState(false);
  const hasMedia = Boolean(track.media) && !mediaFailed;
  const mediaClock = useMediaClock(videoRef, hasMedia, track.duration);
  const mockClock = usePlayback(track.duration);
  const clock = hasMedia ? mediaClock : { ...mockClock, duration: track.duration };
  const { time, playing, duration, getTime } = clock;
  // Presentation only: whether the performance has played at all this visit (for the Memory Book card).
  const [hasPlayed, setHasPlayed] = useState(false);
  useEffect(() => {
    if (playing) setHasPlayed(true);
  }, [playing]);

  // Generated beat only when the video is unavailable, so the timeline still has sound.
  useBeatSound(track, settings.sound && !hasMedia, playing, getTime);

  const { index: beatIndex, phase: beatPhase } = beatPosition(track, time);
  const section = sectionAt(track, time);
  const intensity = intensityAt(track, time);
  const { phase, cue } = interactionAt(track, time);
  const prompting = settings.playAlong && playing;
  const promptPhase = prompting ? phase : "idle";
  const visual = visualPulse(track, section, time, { gentle: settings.reducedMotion, cues: true });
  const beatPulse = playing ? visual.value : 0;
  const pulse = beatPulse * intensity;
  const stageMood = section.mood;
  const look = stageLook(stageMood, intensity, beatPulse, visual.downbeat);

  // Activation after a valid wave.
  const [celebration, setCelebration] = useState<number | null>(null);
  const celebrationCount = useRef(0);
  useEffect(() => {
    if (celebration === null) return;
    const timer = window.setTimeout(() => setCelebration(null), CELEBRATE_MS);
    return () => window.clearTimeout(timer);
  }, [celebration]);
  const celebrating = celebration !== null;

  // Demo scoring: points per accepted wave, by timing against the beat grid.
  const [score, setScore] = useState(0);
  const [waves, setWaves] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<WaveFeedback | null>(null);
  const feedbackCount = useRef(0);
  const [tapNote, setTapNote] = useState<string | null>(null);
  // A "why didn't that count" note only applies to the moment it was given in.
  useEffect(() => setTapNote(null), [phase, playing]);

  // Miss: when a wave moment closes by playing through its end with no accepted wave inside it.
  // Leaving it by seeking, or while paused, is not a miss.
  const waveCueId = phase === "wave" && cue ? cue.id : null;
  const openWave = useRef<{ id: string | null; hits: number }>({ id: null, hits: 0 });
  useEffect(() => {
    const prev = openWave.current;
    openWave.current = { id: waveCueId, hits: 0 };
    const closed = prev.id ? track.interactions.find((c) => c.id === prev.id) : undefined;
    if (!closed || prev.hits > 0 || !playing || !settings.playAlong) return;
    const now = getTime();
    if (now < closed.end || now - closed.end > MISS_GRACE_S) return;
    setMisses((n) => n + 1);
    setFeedback({ id: ++feedbackCount.current, grade: "Miss", points: 0, detail: "the wave moment ended without a tap" });
    // Only the cue changing should run this; the other values are read as they are at that moment.
  }, [waveCueId]);

  const ignoreReason = !settings.playAlong
    ? "Play Along is off"
    : !playing
      ? "Press play first"
      : phase !== "wave"
        ? "Wait for the WAVE moment"
        : celebrating
          ? "Nice! Wait for the next beat"
          : null;

  useEffect(
    () =>
      onMovement(() => {
        if (ignoreReason) {
          setTapNote(ignoreReason);
          return;
        }
        const result = scoreWave(track, getTime());
        openWave.current.hits++;
        setScore((s) => s + result.points);
        setWaves((n) => n + 1);
        setFeedback({
          id: ++feedbackCount.current,
          grade: result.grade,
          points: result.points,
          detail: result.offsetMs === 0 ? "on the beat" : `${Math.abs(result.offsetMs)} ms ${result.offsetMs < 0 ? "early" : "late"}`,
        });
        setTapNote(null);
        setCelebration(++celebrationCount.current);
        if (settings.watchHaptics) sendHaptic({ type: "celebrate" });
      }),
    [ignoreReason, settings.watchHaptics, getTime],
  );

  // Haptic cues follow the same clock as everything else.
  // One cue per visual pulse (half-beats too in double-time sections), weaker off the beat.
  const pulseIndex = visual.index;
  useEffect(() => {
    if (!settings.watchHaptics || !playing || pulseIndex < 0) return;
    // Read the moment itself so a ramp doesn't re-send cues between pulses.
    const now = getTime();
    const { onBeat, downbeat } = visualPulse(track, sectionAt(track, now), now, { gentle: false, cues: false });
    sendHaptic({ type: "beat", strength: intensityAt(track, now) * (onBeat ? 1 : 0.6), downbeat });
  }, [pulseIndex, playing, settings.watchHaptics, getTime]);

  useEffect(() => {
    if (!settings.watchHaptics || promptPhase === "idle") return;
    sendHaptic({ type: promptPhase });
  }, [promptPhase, settings.watchHaptics]);

  useEffect(() => () => stopHaptics(), []);

  const handlePlay = () => {
    if (!hasMedia) unlockAudio();
    clock.play();
  };

  // Moving the playhead makes the last result stale; the score itself is kept until Restart.
  const seekTo = (to: number) => {
    clock.seek(to);
    setFeedback(null);
    setTapNote(null);
  };

  const restart = () => {
    seekTo(0);
    setScore(0);
    setWaves(0);
    setMisses(0);
    setCelebration(null);
    if (!playing) handlePlay();
  };

  // Countdown and jump come straight from the track's wave timing, so they follow seeks and pauses.
  const upcoming = nextWave(track, time);
  const jumpTarget = nextWaveJump(track, time);
  const countdown =
    phase === "wave" && cue
      ? `Wave now · ${Math.max(0, Math.ceil(cue.end - time))}s left`
      : upcoming
        ? `Next wave in ${formatTime(Math.ceil(upcoming.start - time))}`
        : "No more wave moments in this song";
  const jumpToNextWave = () => {
    if (!jumpTarget) return;
    seekTo(jumpTarget.readyAt);
    if (!playing) handlePlay();
  };

  const leave = (then: () => void) => {
    clock.pause();
    stopHaptics();
    if (document.fullscreenElement) void document.exitFullscreen();
    then();
  };

  const lightstickState: LightstickState = !settings.visuals
    ? "off"
    : celebrating
      ? "celebrate"
      : promptPhase === "wave"
        ? "wave"
        : promptPhase === "get-ready"
          ? "ready"
          : playing && isHighEnergy(stageMood)
            ? "pulse"
            : "idle";

  // Presentation only — derived from existing state, never used for timing decisions.
  const energy = Math.round(Math.min(1, intensity * MOOD_ENERGY[stageMood]) * (playing ? 1 : 0.6) * 50) / 50;
  const crowdBeat =
    // The crowd only needs the beat while its lightsticks sway (wave, celebration, hooks).
    playing && beatIndex >= 0 && !settings.reducedMotion && (promptPhase === "wave" || celebrating || isHighEnergy(stageMood))
      ? beatIndex + beatPhase
      : -1;

  const waveOpen = promptPhase === "wave" && !celebrating;

  return (
    <div className="concert-root min-h-dvh overflow-x-clip bg-stage text-ink">
      <div
        ref={stageRef}
        className={`relative isolate mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 pt-6 pb-[18vh] sm:px-8 sm:pb-[24vh] xl:max-w-7xl ${
          fullscreen ? "overflow-y-auto bg-stage" : ""
        }`}
      >
        {view === "video" && (
          <CrowdAtmosphere
            mood={stageMood}
            phase={promptPhase}
            celebrating={celebrating}
            celebrationKey={celebration ?? undefined}
            energy={energy}
            beat={crowdBeat}
            lit={settings.visuals}
            reducedMotion={settings.reducedMotion}
          />
        )}
        <ScreenHeader
          label="At-home Concert"
          onExit={() => leave(onExit)}
          switchTo={{ label: "Live", onSelect: () => leave(onSwitchMode) }}
        />

        <main>
          {/* 1. The performance, with the interaction cue staged on it (tablet, desktop, TV) */}
          <div className="mt-4">
            <PerformanceMedia
              media={hasMedia ? track.media : undefined}
              mediaRef={videoRef}
              muted={!settings.sound}
              onMediaError={() => setMediaFailed(true)}
              light={settings.visuals ? look.level : 0}
              tone={promptPhase === "get-ready" ? "amber" : look.tone}
              accent={settings.visuals ? look.accent : 0}
              anticipation={settings.visuals && promptPhase === "get-ready"}
              activated={settings.visuals && celebrating}
              burstKey={celebration ?? undefined}
              scene={
                view === "virtual" ? (
                  <VirtualPerformerStage
                    mood={stageMood}
                    energy={energy}
                    beatPulse={beatPulse}
                    accent={settings.visuals ? look.accent : 0}
                    beat={playing && beatIndex >= 0 ? beatIndex + beatPhase : -1}
                    phase={promptPhase}
                    celebrating={celebrating}
                    celebrationKey={celebration ?? undefined}
                    lit={settings.visuals}
                    reducedMotion={settings.reducedMotion}
                  />
                ) : undefined
              }
              placeholder={
                view === "virtual" ? undefined : (
                  <AuraStage
                    beatIndex={beatIndex}
                    phase={beatPhase}
                    intensity={intensity}
                    amber={stageMood === "anticipation"}
                    playing={playing}
                    enabled={settings.visuals}
                    reducedMotion={settings.reducedMotion}
                  />
                )
              }
              overlay={
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 bg-gradient-to-b from-black/60 to-transparent p-4 sm:p-5">
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold sm:text-xl">{track.title}</p>
                      <p className="truncate text-xs text-ink-muted sm:text-sm">{track.artist}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs whitespace-nowrap text-ink">
                      {!hasMedia
                        ? "Video unavailable · timeline preview"
                        : view === "video"
                          ? "Recorded concert video"
                          : "Simulated virtual stage"}
                    </span>
                  </div>
                  {/* Stage cue: GET READY / WAVE / success in the lower centre of the performance */}
                  <div className="hidden sm:contents">
                    <CinematicInteraction
                      variant="overlay"
                      phase={promptPhase}
                      celebrating={celebrating}
                      celebrationKey={celebration ?? undefined}
                      lit={settings.visuals}
                      reducedMotion={settings.reducedMotion}
                      wearable={wearable}
                    />
                  </div>
                </>
              }
            />
          </div>

          {/* 2. Interaction cue under the video on phones, where the video is too small to overlay */}
          <div className="sm:hidden">
            <CinematicInteraction
              variant="inline"
              phase={promptPhase}
              celebrating={celebrating}
              celebrationKey={celebration ?? undefined}
              lit={settings.visuals}
              reducedMotion={settings.reducedMotion}
              wearable={wearable}
            />
          </div>

          {/* 3. Lyrics and musical context */}
          <div className="mt-3 sm:mt-5">
            <p className="text-center text-xs font-semibold tracking-[0.3em] text-ink-muted uppercase">{section.label}</p>
            {settings.lyrics && track.lyrics.length > 0 && (
              <div className="mt-1">
                <LyricsDisplay lyrics={track.lyrics} time={time} energetic={playing && isHighEnergy(stageMood)} />
              </div>
            )}
          </div>

          {/* 4. Wave with the Music: tap alternative + timing score */}
          {settings.playAlong && (
            <section
              aria-label="Wave with the Music"
              className={`relative z-10 mt-4 rounded-3xl border p-4 transition-colors sm:p-5 ${
                waveOpen ? "border-aura/70 bg-aura/10" : "border-white/10 bg-surface/90"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => emitMovement("tap")}
                  aria-describedby={tapHintId}
                  className={`min-h-16 rounded-2xl px-8 font-display text-xl font-bold transition sm:min-w-56 ${
                    waveOpen ? "bg-aura text-stage hover:brightness-110" : "border border-white/15 bg-transparent text-ink-muted"
                  }`}
                >
                  {waveOpen ? "Tap to wave" : "Wave (tap)"}
                </button>
                <div className="flex-1">
                  {/* Visual result; screen readers get the same words from the hint below */}
                  {feedback && (
                    <p
                      key={feedback.id}
                      aria-hidden="true"
                      className={`font-display text-2xl font-bold ${feedback.grade === "Miss" ? "text-alert" : "text-aura"} ${
                        settings.reducedMotion ? "" : "animate-rise"
                      }`}
                    >
                      {feedback.grade}
                      <span className="ml-2 text-sm font-semibold text-ink-muted tabular-nums">
                        {feedback.points > 0 ? `+${feedback.points} · ` : ""}
                        {feedback.detail}
                      </span>
                    </p>
                  )}
                  <p id={tapHintId} aria-live="polite" className="text-sm text-ink-muted">
                    {tapNote ??
                      (celebrating && feedback && feedback.grade !== "Miss"
                        ? `${feedback.grade}! +${feedback.points}, ${feedback.detail}.`
                        : feedback?.grade === "Miss" && phase === "idle"
                          ? `Miss: ${feedback.detail}.`
                          : waveOpen
                            ? wearable
                              ? "Tap on the beat, or wave your wrist."
                              : "Tap the Wave button on the beat. No wearable needed."
                            : phase === "get-ready" && playing
                              ? "Get ready: the WAVE moment is about to start."
                              : cue === null
                                ? "Wave moments light up during the hooks. Tapping the Wave button counts as a wave."
                                : "Keep going!")}
                  </p>
                  <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div className="flex gap-2">
                      <dt className="text-ink-muted">Score</dt>
                      <dd className="font-bold text-ink tabular-nums">{score}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-ink-muted">Waves</dt>
                      <dd className="font-bold text-ink tabular-nums">{waves}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-ink-muted">Missed</dt>
                      <dd className="font-bold text-ink tabular-nums">{misses}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Countdown (plain text, not announced every second) and the jump to the next wave */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                <p className="text-sm font-semibold text-ink tabular-nums">{countdown}</p>
                <button
                  type="button"
                  onClick={jumpToNextWave}
                  disabled={!jumpTarget}
                  className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-ink transition hover:border-white/40 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {jumpTarget ? "Jump to next wave" : "No more waves"}
                </button>
              </div>
            </section>
          )}

          {/* 5. Stage floor: the Aura Energy ribbon with the phone lightstick standing on it, and the bar count */}
          <div className="relative mt-1 flex flex-col items-center">
            {settings.visuals && (
              <div className="absolute inset-x-0 top-12">
                <AuraEnergy
                  energy={energy}
                  celebrating={celebrating}
                  celebrationKey={celebration ?? undefined}
                  reducedMotion={settings.reducedMotion}
                />
              </div>
            )}
            <Lightstick
              state={lightstickState}
              pulse={pulse}
              beat={playing && beatIndex >= 0 ? beatIndex + beatPhase : -1}
              reducedMotion={settings.reducedMotion}
            />
            {settings.visuals && (
              <div className="mt-2">
                <BeatIndicator beatIndex={beatIndex} playing={playing} />
              </div>
            )}
          </div>

          {/* 6. Controls — on a soft backing so the crowd behind never competes with them */}
          <div className="relative z-10 -mx-3 mt-6 flex flex-col gap-4 rounded-3xl bg-stage/90 p-3">
            <PlayerControls
              time={time}
              duration={duration}
              playing={playing}
              onPlay={handlePlay}
              onPause={clock.pause}
              onSeek={seekTo}
              onRestart={restart}
            />

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  aria-expanded={sensesOpen}
                  aria-controls={sensesId}
                  onClick={() => setSensesOpen((open) => !open)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-ink transition hover:border-white/40 hover:bg-white/5"
                >
                  Your senses &amp; accessibility
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className={`size-4 transition-transform ${sensesOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div role="group" aria-label="Performance view" className="inline-flex min-h-12 items-center rounded-full border border-white/15 p-1">
                  {(
                    [
                      ["video", "Concert video", "Recorded"],
                      ["virtual", "Virtual stage", "Simulated"],
                    ] as const
                  ).map(([value, label, kind]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={view === value}
                      onClick={() => chooseView(value)}
                      className={`min-h-11 rounded-full px-4 text-sm font-semibold transition ${
                        view === value ? "bg-white/10 text-ink" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {label} <span className="font-normal text-ink-muted">· {kind}</span>
                    </button>
                  ))}
                </div>
                {canFullscreen && (
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    aria-pressed={fullscreen}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-ink transition hover:border-white/40 hover:bg-white/5"
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                      {fullscreen ? (
                        <path d="M8 3v5H3M12 3v5h5M8 17v-5H3M12 17v-5h5" strokeLinecap="round" strokeLinejoin="round" />
                      ) : (
                        <path d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </svg>
                    {fullscreen ? "Exit full screen" : "Full screen"}
                  </button>
                )}
              </div>

              {sensesOpen && (
                <section
                  id={sensesId}
                  aria-label="Your senses and accessibility"
                  className="mt-3 rounded-3xl border border-white/10 bg-surface p-3 sm:p-4"
                >
                  <p className="px-3 pt-1 text-sm text-ink-muted">
                    Choose how the music reaches you. Reduce Motion and High Contrast also apply to the Live Concert.
                  </p>
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    <SensoryToggle
                      label="Light & beat indicator"
                      description="Stage light, lightstick and beat counter follow the music."
                      checked={settings.visuals}
                      onChange={() => toggle("visuals")}
                    />
                    <SensoryToggle label="Sound" description="Hear the performance." checked={settings.sound} onChange={() => toggle("sound")} />
                    <SensoryToggle
                      label="Haptics"
                      description={
                        phoneCanVibrate
                          ? "Your phone vibrates with the beat (no Halo needed)."
                          : "This browser can't vibrate — light and lyrics carry the beat instead."
                      }
                      checked={settings.watchHaptics}
                      onChange={() => toggle("watchHaptics")}
                    />
                    <SensoryToggle
                      label="Lyrics & captions"
                      description="Show lyrics as they're sung."
                      checked={settings.lyrics}
                      onChange={() => toggle("lyrics")}
                    />
                    <SensoryToggle
                      label="Play Along"
                      description="Wave or tap with the music at highlighted moments."
                      checked={settings.playAlong}
                      onChange={() => toggle("playAlong")}
                    />
                    <SensoryToggle
                      label="Reduce Motion"
                      description="Keep the light but stop it moving."
                      checked={settings.reducedMotion}
                      onChange={() => toggle("reducedMotion")}
                    />
                    <SensoryToggle
                      label="High Contrast"
                      description="Brighter text and stronger outlines."
                      checked={settings.highContrast}
                      onChange={() => toggle("highContrast")}
                    />
                  </div>
                </section>
              )}
            </div>

            {/* After (or paused in) the performance: an optional invitation to the Memory Book, never during playback */}
            {onSaveMoment && hasPlayed && !playing && (
              <SaveMomentCard
                onSave={() => leave(() => onSaveMoment({ mode: "at-home", title: track.title, artist: track.artist }))}
              />
            )}

            <p className="px-1 text-xs text-ink-muted">{PERFORMANCE_CREDIT}. Score and lighting are a demo; no Halo device is required.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

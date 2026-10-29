import { useEffect, useRef, useState } from "react";
import ScreenHeader from "../components/ScreenHeader";
import SensoryToggle from "../components/SensoryToggle";
import LiveStatusPanel from "../components/live/LiveStatusPanel";
import LiveCueDisplay from "../components/live/LiveCueDisplay";
import LiveLightstickView from "../components/live/LiveLightstickView";
import { startSimulatedVenue } from "../live/simulatedVenue";
import { useLiveConnection } from "../live/useLiveConnection";
import { useLiveSession, useLiveSettings } from "../live/useLiveSession";
import { useWatchStatus } from "../hooks/useWatchStatus";
import { useSettings } from "../hooks/useSettings";
import { phoneCanVibrate } from "../lib/watchBridge";

interface LiveConcertProps {
  onExit: () => void;
  onSwitchMode: () => void;
}

/**
 * Live Concert (ported from AuraBeat): the real stage is the show, so the phone stays minimal — a
 * synchronized lightstick, haptics, short accessibility cues, connection status, and an always-available
 * Stop. TΛVY has no venue backend, so a scripted show (simulatedVenue.ts) feeds the cues while live.
 */
export default function LiveConcert({ onExit, onSwitchMode }: LiveConcertProps) {
  const { settings, toggle } = useLiveSettings();
  const { settings: shared, toggle: toggleShared } = useSettings(); // shared accessibility preferences
  const reducedMotion = shared.reducedMotion;
  const connection = useLiveConnection();
  const watch = useWatchStatus();
  const session = useLiveSession(settings);
  const [lightstickOpen, setLightstickOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  // Leaving the full-screen lightstick returns keyboard focus to the button that reopens it.
  const closeLightstick = () => {
    setLightstickOpen(false);
    requestAnimationFrame(() => openButtonRef.current?.focus());
  };

  // The simulated show runs only while live mode is on.
  useEffect(() => (session.active ? startSimulatedVenue() : undefined), [session.active]);

  const start = () => {
    session.start();
    if (settings.lightstick) setLightstickOpen(true);
  };

  const stop = () => {
    session.stop();
    setLightstickOpen(false);
  };

  const exit = () => {
    stop();
    onExit();
  };

  const switchMode = () => {
    stop();
    onSwitchMode();
  };

  const statusLine = [
    connection.backend === "connected" ? "Simulated show" : "Offline",
    settings.watchHaptics ? "Haptics on" : "Haptics off",
  ].join(" · ");

  const showLightstick = lightstickOpen && session.active;

  return (
    <div className="concert-root min-h-dvh overflow-x-clip bg-stage text-ink">
      {/* Inert under the full-screen lightstick: without element full screen (iPhone), Tab would
          otherwise land on controls hidden behind it. */}
      <div inert={showLightstick} className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-6 sm:px-8">
        <ScreenHeader label="Live Concert" onExit={exit} switchTo={{ label: "At-home", onSelect: switchMode }} />

        <main>
          <p className="mt-6 text-lg text-ink-muted">Keep your eyes on the stage. TΛVY stays in your pocket.</p>

          {/* Primary action */}
          <div className="mt-6">
            {!session.active ? (
              <button
                type="button"
                onClick={start}
                className="flex min-h-20 w-full flex-col items-center justify-center rounded-3xl bg-aura text-stage transition hover:brightness-110"
              >
                <span className="font-display text-2xl font-bold">Start live mode</span>
                <span className="text-sm font-semibold opacity-80">
                  {settings.lightstick ? "Your screen becomes a lightstick" : "Haptics and cues only"}
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <button
                  ref={openButtonRef}
                  type="button"
                  onClick={() => setLightstickOpen(true)}
                  disabled={!settings.lightstick}
                  className="min-h-20 rounded-3xl border border-aura/60 bg-aura/15 font-display text-xl font-bold text-aura disabled:border-white/10 disabled:bg-transparent disabled:text-ink-muted"
                >
                  {settings.lightstick ? "Open lightstick" : "Lightstick off"}
                </button>
                <button type="button" onClick={stop} className="min-h-20 rounded-3xl bg-alert px-8 font-display text-xl font-bold text-stage">
                  Stop
                </button>
              </div>
            )}
            {session.active && (
              <p className="mt-2 text-center text-sm text-ink-muted">
                Live mode is on{settings.watchHaptics ? " · haptics on" : ""}. Stop ends it immediately.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <LiveStatusPanel connection={connection} watch={watch} />

            {settings.cues && session.active && (
              <LiveCueDisplay
                cue={session.lastCue}
                beats={session.beats}
                variant="card"
                reducedMotion={reducedMotion}
                announce={!showLightstick}
              />
            )}

            <section aria-label="Live settings" className="rounded-3xl border border-white/10 bg-surface p-3">
              <SensoryToggle
                label="Lightstick"
                description="Your screen glows with the music."
                checked={settings.lightstick}
                onChange={() => toggle("lightstick")}
              />
              <SensoryToggle
                label="Haptics"
                description={
                  phoneCanVibrate
                    ? "Your phone vibrates on the beat and big moments (no Halo needed)."
                    : "This browser can't vibrate — follow the light and cue words instead."
                }
                checked={settings.watchHaptics}
                onChange={() => toggle("watchHaptics")}
              />
              <SensoryToggle
                label="Visual beat cues"
                description="Short words like BASS, BUILD, CHORUS, DROP, plus a beat light."
                checked={settings.cues}
                onChange={() => toggle("cues")}
              />
            </section>

            <section aria-label="Accessibility" className="rounded-3xl border border-white/10 bg-surface p-3">
              <p className="px-3 pt-1 text-sm text-ink-muted">Accessibility — shared with the At-home Concert.</p>
              <SensoryToggle
                label="Reduce Motion"
                description="Steady light only: no flashes or spinning."
                checked={shared.reducedMotion}
                onChange={() => toggleShared("reducedMotion")}
              />
              <SensoryToggle
                label="High Contrast"
                description="Brighter text and stronger outlines."
                checked={shared.highContrast}
                onChange={() => toggleShared("highContrast")}
              />
            </section>
          </div>
        </main>
      </div>

      {showLightstick && (
        <LiveLightstickView
          mode={session.mode}
          tone={session.tone}
          flash={session.flash}
          reducedMotion={reducedMotion}
          status={statusLine}
          cue={
            settings.cues ? (
              <LiveCueDisplay cue={session.lastCue} beats={session.beats} variant="stage" reducedMotion={reducedMotion} announce />
            ) : undefined
          }
          onExit={closeLightstick}
          onStop={stop}
        />
      )}
    </div>
  );
}

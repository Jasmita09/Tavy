import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Headphones,
  Music2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { buttonClass } from '../ui/Button';
import { EYEBROW, FOCUS_LIGHT } from '../ui/tokens';
import { BEAT, STORY } from '../audio/score';
import { MESSAGES, getSoundState, prefetch, setMuted, setSiteSound, setVolume, soundSupported, storyPause, storyPlay, storyStop, storyTime } from '../audio/soundEngine';
import { useSound } from '../audio/useSound';
import { STORY_ENDING, STORY_SCENES } from './StoryArt';
import './story.css';

const LAST = STORY_SCENES.length - 1;
const SCENE_S = STORY.scenes[1] - STORY.scenes[0];
/** How strongly each scene's light moves with the beat: from stillness to the concert. */
const ENERGY = [0.12, 0.35, 0.65, 1];

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const sceneAt = (t: number) => {
  let i = 0;
  while (i < LAST && t >= STORY.scenes[i + 1]) i++;
  return i;
};

interface StoryPlayerProps {
  onClose: () => void;
  onTryAtHome: () => void;
}

/**
 * "The Sound of Dreams": a short, optional story in four illustrated scenes, with an original soundtrack
 * the viewer can choose to hear. One timeline drives everything: with sound it is the soundtrack's own
 * clock, silently it is a timer on the same score (components/audio/score.ts), so scene changes, the
 * ribbon, the gate, the light on the beat and the captions land on the music either way.
 *
 * Nothing plays until the viewer picks Play with Sound or Watch Silently; Skip Story closes it. Captions
 * and a description of every sound are always on screen; "Read as text" tells it all in words. Reduced
 * motion shows each scene finished and still (the music can still play). A modal dialog: focus stays
 * inside, Escape closes it, and focus returns to whatever opened it.
 */
export const StoryPlayer: React.FC<StoryPlayerProps> = ({ onClose, onTryAtHome }) => {
  const reduced = useReducedMotionPreference();
  const sound = useSound();
  const [phase, setPhase] = useState<'choose' | 'watch' | 'read'>('choose');
  const [withSound, setWithSound] = useState(false);
  const [notice, setNotice] = useState('');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  // Scenes reached while paused (or with reduced motion) are shown finished and still
  const [still, setStill] = useState(reduced);
  const panel = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const playButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const volumeId = useId();

  // The silent clock (also the position while paused): offset + time since `at`
  const clock = useRef({ offset: 0, at: 0 });
  const live = useRef({ playing, withSound });
  live.current = { playing, withSound };
  const readClock = useCallback(() => {
    const { playing: p, withSound: s } = live.current;
    if (!p) return clock.current.offset;
    return s ? storyTime() : clock.current.offset + (performance.now() - clock.current.at) / 1000;
  }, []);

  // Modal behaviour: the page behind is inert, the body doesn't scroll, focus comes back on close
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    // The landing music stops while the story is open (it doesn't come back on its own), and the
    // soundtrack starts downloading so "Play with Sound" starts promptly. Nothing plays yet.
    if (getSoundState().site) void setSiteSound(false);
    prefetch('story');
    return () => {
      storyStop(0.3);
      root?.removeAttribute('inert');
      document.body.style.overflow = prevOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  /* ---------- Timeline ---------- */

  const finish = useCallback(() => {
    clock.current.offset = STORY.end;
    setT(STORY.end);
    setPlaying(false);
    setEnded(true);
    // The soundtrack's last chord rings on and fades by itself; nothing else starts
  }, []);

  useEffect(() => {
    if (!playing || phase !== 'watch') return;
    let raf = 0;
    let shown = -1;
    let shownScene = -1;
    const tick = () => {
      const time = readClock();
      if (time >= STORY.end) {
        finish();
        return;
      }
      // React renders about ten times a second (and on the very frame a scene changes); the beat light
      // updates every frame without rendering
      const tenth = Math.floor(time * 10);
      const sc = sceneAt(time);
      if (tenth !== shown || sc !== shownScene) {
        shown = tenth;
        shownScene = sc;
        setT(time);
      }
      const b = time / BEAT;
      const pulse = Math.exp(-(b - Math.floor(b)) * 5) * (Math.floor(b) % 4 === 0 ? 1 : 0.6) * ENERGY[sceneAt(time)];
      panel.current?.style.setProperty('--tvs-beat', pulse.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      panel.current?.style.setProperty('--tvs-beat', '0');
    };
  }, [playing, phase, readClock, finish]);

  // If the soundtrack stops on its own before the timeline ends (it shouldn't), fall back to silent
  useEffect(() => {
    if (playing && withSound && sound.story === 'off' && !ended && readClock() < STORY.end - 0.5) {
      clock.current = { offset: storyTime(), at: performance.now() };
      setWithSound(false);
    }
  }, [sound.story, playing, withSound, ended, readClock]);

  /** Start (or continue) the timeline at `from`, with or without sound. */
  const run = async (from: number, audible: boolean) => {
    clock.current = { offset: from, at: performance.now() };
    setT(from);
    setEnded(false);
    let withAudio = audible;
    if (audible) {
      const ok = await storyPlay(from);
      if (!ok) {
        setNotice(
          getSoundState().error === MESSAGES.blocked
            ? 'Your browser blocked sound, so the story is playing silently with captions.'
            : 'The music couldn’t start, so the story is playing silently with captions.',
        );
        withAudio = false;
      }
      clock.current = { offset: from, at: performance.now() };
    }
    setWithSound(withAudio);
    setPlaying(true);
  };

  const begin = async (audible: boolean) => {
    setNotice('');
    setPhase('watch');
    setStill(reduced);
    await run(0, audible);
  };

  // The chosen button disappears with the choose screen: keyboard focus moves to Pause/Resume
  useEffect(() => {
    if (phase === 'watch' && !panel.current?.contains(document.activeElement)) playButton.current?.focus();
  }, [phase]);

  const pause = () => {
    const now = readClock();
    clock.current = { offset: now, at: performance.now() };
    if (withSound) storyPause();
    setPlaying(false);
    setT(now);
  };

  const resume = async () => {
    if (ended) {
      setStill(reduced);
      await run(0, withSound);
      return;
    }
    const from = clock.current.offset;
    // A scene reached while paused restarts from its beginning, so its motion and music line up again
    const start = still && !reduced ? STORY.scenes[sceneAt(from)] : from;
    setStill(reduced);
    await run(start, withSound);
  };

  const goTo = (i: number) => {
    const to = STORY.scenes[Math.max(0, Math.min(LAST, i))];
    setEnded(false);
    if (playing) void run(to, withSound);
    else {
      clock.current = { offset: to, at: performance.now() };
      setT(to);
      setStill(true);
    }
  };

  const skip = () => {
    if (withSound) storyStop(0.8);
    setStill(true);
    finish();
  };

  const turnSoundOn = async () => {
    const from = readClock();
    if (!playing) {
      setWithSound(true);
      return;
    }
    await run(from, true);
  };

  // A hidden tab pauses the story rather than playing to nobody
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  useEffect(() => {
    const onHide = () => document.hidden && live.current.playing && pauseRef.current();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (phase === 'watch' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !(e.target as HTMLElement).matches('input')) {
      e.preventDefault();
      goTo(sceneAt(t) + (e.key === 'ArrowRight' ? 1 : -1));
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  /* ---------- Render ---------- */

  const scene = ended ? LAST : sceneAt(t);
  const current = STORY_SCENES[scene];
  const showEnding = scene === LAST && (ended || still || t >= STORY.ending);
  const motionClass = still || phase !== 'watch' ? 'tvs-still' : playing ? '' : 'tvs-paused';
  const iconButton = `inline-flex size-11 items-center justify-center rounded-full border border-tv-line bg-tv-paper text-tv-navy hover:bg-tv-mist disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${FOCUS_LIGHT}`;
  const canSound = soundSupported();

  const endActions = (
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" onClick={onTryAtHome} className={buttonClass('primary', 'lg')}>
        Try the At-home Concert
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={onClose} className={buttonClass('secondary', 'lg')}>
        Back to TΛVY
      </button>
    </div>
  );

  const readToggle = (className = '') => (
    <button
      type="button"
      onClick={() => {
        if (playing) pause();
        setPhase((p) => (p === 'read' ? (clock.current.offset > 0 || ended ? 'watch' : 'choose') : 'read'));
      }}
      aria-pressed={phase === 'read'}
      className={`${buttonClass('ghost')} ${className}`}
    >
      {phase === 'read' ? <Clapperboard className="w-4 h-4" aria-hidden="true" /> : <BookOpen className="w-4 h-4" aria-hidden="true" />}
      {phase === 'read' ? 'Watch' : 'Read as text'}
    </button>
  );

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className={`tvs-player fixed inset-0 z-[120] overflow-y-auto bg-tv-canvas text-tv-navy ${motionClass}`}
      style={{ ['--tvs-scene-ms' as string]: `${SCENE_S * 1000}ms` }}
    >
      {/* Soft champagne and blush light, as on the landing page */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgb(245_230_201/0.9),rgb(251_247_239/0)_60%),radial-gradient(ellipse_at_90%_90%,rgb(235_196_192/0.35),rgb(251_247_239/0)_50%)]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pb-8 pt-4 sm:px-8 sm:pt-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={EYEBROW}>Our story · No fan left behind</p>
            <h2 ref={titleRef} id={titleId} tabIndex={-1} className="mt-1 font-serif text-2xl leading-tight text-tv-navy focus:outline-none sm:text-3xl">
              The Sound of Dreams
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {phase !== 'choose' && readToggle('hidden sm:inline-flex')}
            {phase === 'watch' && !ended && (
              <button type="button" onClick={skip} className={buttonClass('secondary')}>
                <SkipForward className="w-4 h-4" aria-hidden="true" />
                Skip
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close story" className={iconButton}>
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </header>
        {phase !== 'choose' && readToggle('mt-2 self-start sm:hidden')}

        {phase === 'choose' && (
          /* How to watch: nothing plays until one is chosen */
          <div className="mx-auto mt-6 flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-7 text-center sm:mt-10">
            <div className="tvs-frame relative aspect-[16/10] w-full max-w-2xl overflow-hidden rounded-tv-lg bg-[#2b211d] shadow-tv-lift" role="img" aria-label={STORY_SCENES[0].description}>
              <div className="h-full w-full opacity-90">{React.createElement(STORY_SCENES[0].Art)}</div>
              <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgb(43_33_29/0.55),transparent_55%)]" />
              <p aria-hidden="true" className="absolute inset-x-0 bottom-5 font-serif text-xl italic text-[#f2d9a6] sm:text-2xl">
                A 30-second story about distance, and music.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {canSound && (
                <button type="button" onClick={() => void begin(true)} className={buttonClass('primary', 'lg')}>
                  <Headphones className="w-4 h-4" aria-hidden="true" />
                  Play with Sound
                </button>
              )}
              <button type="button" onClick={() => void begin(false)} className={buttonClass(canSound ? 'secondary' : 'primary', 'lg')}>
                <Play className="w-4 h-4" aria-hidden="true" />
                Watch Silently
              </button>
              <button type="button" onClick={onClose} className={buttonClass('ghost', 'lg')}>
                <SkipForward className="w-4 h-4" aria-hidden="true" />
                Skip Story
              </button>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-tv-slate">
              Sound plays only if you choose it, with original music made for TΛVY. Captions tell the story and describe every
              sound either way.
            </p>
            {readToggle()}
          </div>
        )}

        {phase === 'watch' && (
          <div className="mt-4 flex flex-1 flex-col sm:mt-6">
            {/* Scene markers: progress, and a way to jump to any scene */}
            <ol className="grid grid-cols-4 gap-2" aria-label="Scenes">
              {STORY_SCENES.map((s, i) => {
                const fill = ended || i < scene ? 1 : i === scene ? Math.min(1, Math.max(0, (t - STORY.scenes[i]) / SCENE_S)) : 0;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={i === scene ? 'step' : undefined}
                      className={`group block w-full cursor-pointer rounded py-2 text-left ${FOCUS_LIGHT}`}
                    >
                      <span className="tvs-segment block h-1 overflow-hidden rounded-full bg-tv-line">
                        <span className="block h-full rounded-full bg-tv-accent-ink" style={{ width: `${fill * 100}%` }} />
                      </span>
                      <span className={`mt-1.5 block text-[11px] font-semibold leading-tight tracking-wide sm:truncate sm:text-xs ${i === scene ? 'text-tv-navy' : 'text-tv-slate'}`}>
                        <span className="sr-only">Scene {i + 1}: </span>
                        {s.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* The picture, with light that breathes on the beat */}
            <div className="tvs-frame relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-tv-lg bg-[#2b211d] shadow-tv-lift sm:max-h-[56vh]">
              <div key={`${scene}-${still}`} role="img" aria-label={current.description} className="tvs-scene-in absolute inset-0">
                <div
                  className="tvs-camera h-full w-full"
                  style={{ ['--tvs-origin' as string]: current.camera.origin, ['--tvs-dx' as string]: current.camera.dx, ['--tvs-dy' as string]: current.camera.dy }}
                >
                  <current.Art />
                </div>
              </div>
              <div aria-hidden="true" className="tvs-beat-glow pointer-events-none absolute inset-0" style={{ ['--tvs-glow-at' as string]: current.camera.origin }} />
            </div>

            {/* Captions and the sound, described: always on screen, announced when the scene changes */}
            <div className="mx-auto mt-5 w-full max-w-2xl text-center" aria-live="polite" aria-atomic="true">
              <p className={EYEBROW}>
                Scene {scene + 1} of {STORY_SCENES.length} · {current.title}
              </p>
              <p className="mt-2 font-serif text-2xl leading-snug text-tv-navy sm:text-3xl">{current.caption}</p>
              <p className="mt-2 text-tv-slate">{current.detail}</p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-tv-line bg-tv-paper/80 px-3 py-1 text-xs text-tv-slate">
                <Music2 className="w-3.5 h-3.5 text-tv-accent-ink" aria-hidden="true" />
                <span>
                  <span className="sr-only">Sound{withSound ? '' : ' (playing silently)'}: </span>
                  {current.sound}
                </span>
              </p>
            </div>
            {notice && (
              <p role="status" className="mx-auto mt-3 max-w-xl rounded-tv-sm border border-tv-line bg-tv-mist/70 px-3 py-2 text-center text-sm text-tv-navy">
                {notice}
              </p>
            )}
            {showEnding && (
              <div className="mx-auto mt-6 max-w-2xl space-y-5 text-center">
                <p className="tvs-ending font-serif text-3xl italic text-tv-accent-ink sm:text-4xl" role="status">
                  {STORY_ENDING}
                </p>
                {ended && endActions}
              </div>
            )}

            {/* Controls */}
            <div className="mt-auto flex flex-wrap items-center justify-center gap-3 pt-6" role="group" aria-label="Story controls">
              <button type="button" onClick={() => goTo(scene - 1)} disabled={scene === 0 || ended} aria-label="Previous scene" className={iconButton}>
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button ref={playButton} type="button" onClick={() => void (playing ? pause() : resume())} className={`${buttonClass('primary')} min-w-36`}>
                {playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : ended ? <RotateCcw className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                {playing ? 'Pause' : ended ? 'Replay' : 'Resume'}
              </button>
              <button type="button" onClick={() => goTo(scene + 1)} disabled={scene === LAST || ended} aria-label="Next scene" className={iconButton}>
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
              {canSound &&
                (withSound ? (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMuted(!sound.muted)}
                      aria-pressed={sound.muted}
                      aria-label={sound.muted ? 'Unmute' : 'Mute'}
                      className={iconButton}
                    >
                      {sound.muted ? <VolumeX className="w-5 h-5" aria-hidden="true" /> : <Volume2 className="w-5 h-5" aria-hidden="true" />}
                    </button>
                    <label htmlFor={volumeId} className="sr-only">
                      Volume
                    </label>
                    <input
                      id={volumeId}
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={Math.round((sound.muted ? 0 : sound.volume) * 100)}
                      onChange={(e) => setVolume(Number(e.target.value) / 100)}
                      className="h-11 w-24 cursor-pointer accent-[#85570f] sm:w-28"
                    />
                  </span>
                ) : (
                  <button type="button" onClick={() => void turnSoundOn()} className={buttonClass('secondary')}>
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                    Turn sound on
                  </button>
                ))}
            </div>
            <p className="mt-3 text-center text-xs text-tv-slate">
              {withSound ? 'Original music made for TΛVY.' : 'Playing silently.'} Use ← and → to move between scenes, Escape to close.
            </p>
          </div>
        )}

        {phase === 'read' && (
          /* The static text version: every scene, its picture and its sound described, and the ending */
          <article className="mx-auto mt-6 w-full max-w-3xl space-y-10" aria-label="The Sound of Dreams, as text">
            {STORY_SCENES.map((s, i) => (
              <section key={s.id} aria-labelledby={`${titleId}-${s.id}`} className="grid gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-center">
                <div role="img" aria-label={s.description} className="tvs-frame aspect-[16/10] overflow-hidden rounded-tv-md bg-[#2b211d] shadow-tv-soft">
                  <s.Art />
                </div>
                <div className="space-y-2">
                  <p className={EYEBROW}>Scene {i + 1}</p>
                  <h3 id={`${titleId}-${s.id}`} className="font-serif text-2xl text-tv-navy">
                    {s.title}
                  </h3>
                  <p className="text-lg leading-relaxed text-tv-navy">{s.caption}</p>
                  <p className="leading-relaxed text-tv-slate">{s.detail}</p>
                  <p className="text-sm leading-relaxed text-tv-slate">
                    <span className="font-semibold">In the picture: </span>
                    {s.description}
                  </p>
                  <p className="text-sm leading-relaxed text-tv-slate">
                    <span className="font-semibold">The music: </span>
                    {s.sound}
                  </p>
                </div>
              </section>
            ))}
            <div className="space-y-6 border-t border-tv-line pt-8 text-center">
              <p className="font-serif text-3xl italic text-tv-accent-ink">{STORY_ENDING}</p>
              {endActions}
            </div>
          </article>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default StoryPlayer;

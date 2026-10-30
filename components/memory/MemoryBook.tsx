import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, HardDrive, Pencil, Plus, Trash2 } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { buttonClass } from '../ui/Button';
import { CONTAINER, EYEBROW, FOCUS_LIGHT } from '../ui/tokens';
import { Dialog } from './Dialog';
import { MemoryEditor } from './MemoryEditor';
import { Polaroid } from './Polaroid';
import {
  MemoryStoreError,
  deleteMemory,
  errorMessage,
  getPhoto,
  listMemories,
  requestPersistence,
  saveMemory,
  type Memory,
  type MemoryDraft,
} from './memoryStore';

/*
 * Pages: -1 is the closed cover, 0 the contents, 1…n one memory each (photo on the left, story on the right).
 * A turn draws the destination underneath and a two-sided leaf rotating over the spine; with reduced motion
 * the page simply changes.
 */

type Side = 'left' | 'right' | 'single';
interface Turn {
  dir: 'next' | 'prev';
  from: number;
  to: number;
}

const TURN_MS = 850;
const EASE = [0.45, 0.05, 0.25, 1] as const;

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatches(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return matches;
};

const formatDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

const pageLabel = (page: number, count: number, memories: Memory[]) =>
  page < 0 ? 'Cover' : page === 0 ? 'Contents' : `Memory ${page} of ${count}: ${memories[page - 1]?.title ?? ''}`;

interface MemoryBookProps {
  onBack: () => void;
}

export const MemoryBook: React.FC<MemoryBookProps> = ({ onBack }) => {
  const reduced = useReducedMotionPreference();
  const wide = useMediaQuery('(min-width: 768px)');
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [page, setPage] = useState(-1);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [editing, setEditing] = useState<{ memory?: Memory } | null>(null);
  const [confirming, setConfirming] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [error, setError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const urls = useRef<Record<string, string>>({});
  const count = memories.length;
  const last = count;

  useEffect(() => {
    headingRef.current?.focus();
    return () => Object.values(urls.current).forEach((u) => URL.revokeObjectURL(u));
  }, []);

  /** Load (or reload) memories and their photos from this device. */
  const refresh = useCallback(async () => {
    try {
      const list = await listMemories();
      const next: Record<string, string> = {};
      for (const m of list) {
        if (!m.photoId) continue;
        if (urls.current[m.photoId]) {
          next[m.photoId] = urls.current[m.photoId];
          continue;
        }
        const blob = await getPhoto(m.photoId);
        if (blob) next[m.photoId] = URL.createObjectURL(blob);
      }
      Object.entries(urls.current).forEach(([id, u]) => !next[id] && URL.revokeObjectURL(u));
      urls.current = next;
      setPhotos(next);
      setMemories(list);
      setStatus('ready');
      return list;
    } catch (e) {
      setStatus('unavailable');
      setError(e instanceof MemoryStoreError ? e.message : errorMessage('unknown'));
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const go = useCallback(
    (to: number) => {
      if (turn || to === page || to < -1 || to > last) return;
      setAnnounce(pageLabel(to, count, memories));
      if (reduced) setPage(to);
      else setTurn({ dir: to > page ? 'next' : 'prev', from: page, to });
    },
    [turn, page, last, count, memories, reduced],
  );

  const finishTurn = () => {
    if (!turn) return;
    setPage(turn.to);
    setTurn(null);
  };

  // A turn can remove the focused control (e.g. the cover's "Open the book"): keep keyboard users in the book.
  useEffect(() => {
    if (turn || editing || confirming) return;
    const active = document.activeElement;
    if (active && active !== document.body && document.contains(active)) return;
    (nextRef.current && !nextRef.current.disabled ? nextRef.current : prevRef.current)?.focus();
  }, [page, turn, editing, confirming]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (editing || confirming || target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') go(page + 1);
    else if (e.key === 'ArrowLeft') go(page - 1);
    else return;
    e.preventDefault();
  };

  const save = async (draft: MemoryDraft) => {
    const saved = await saveMemory(draft, editing?.memory);
    setEditing(null);
    requestPersistence();
    const list = await refresh();
    const index = list ? list.findIndex((m) => m.id === saved.id) + 1 : 0;
    setPage(index);
    setAnnounce(`Saved “${saved.title}”. ${pageLabel(index, list?.length ?? 0, list ?? [])}`);
  };

  const remove = async () => {
    if (!confirming) return;
    setDeleting(true);
    try {
      await deleteMemory(confirming);
      const title = confirming.title;
      setConfirming(null);
      const list = await refresh();
      const nextPage = Math.min(page, list?.length ?? 0);
      setPage(nextPage);
      setAnnounce(`Deleted “${title}”. ${pageLabel(nextPage, list?.length ?? 0, list ?? [])}`);
    } catch (e) {
      setConfirming(null);
      setError(e instanceof MemoryStoreError ? e.message : errorMessage('unknown'));
    } finally {
      setDeleting(false);
    }
  };

  const addButton = (variant: 'primary' | 'secondary' = 'primary') => (
    <button onClick={() => setEditing({})} disabled={status !== 'ready'} className={buttonClass(variant)}>
      <Plus className="w-4 h-4" aria-hidden="true" />
      Add a memory
    </button>
  );

  /* ---------- Page content ---------- */

  const Cover = (
    <div className="relative flex h-full min-h-[inherit] flex-col items-center justify-center gap-6 rounded-r-[14px] bg-[linear-gradient(135deg,#3a2c27,#2b211d_55%,#241b18)] p-8 text-center shadow-[inset_8px_0_14px_-8px_rgb(0_0_0/0.6)]">
      <div className="pointer-events-none absolute inset-4 rounded-[10px] border border-tv-accent/60" />
      <div className="pointer-events-none absolute inset-6 rounded-[8px] border border-tv-accent/25" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-tv-accent">TΛVY</p>
      <h2 className="font-serif text-5xl text-[#f2d9a6] sm:text-6xl">Memory Book</h2>
      <p className="font-serif italic text-lg text-[#f3e9d8]/85">Every concert has a story.</p>
      <button onClick={() => go(0)} className={buttonClass('on-dark')}>
        Open the book
      </button>
      {status === 'ready' && (
        <p className="text-xs text-[#f3e9d8]/75">{count === 0 ? 'No memories yet' : `${count} ${count === 1 ? 'memory' : 'memories'} inside`}</p>
      )}
    </div>
  );

  const Intro = (
    <div className="flex h-full flex-col justify-center gap-4 p-7 sm:p-10">
      <p className={EYEBROW}>Inside cover</p>
      <h2 className="font-serif text-3xl leading-tight text-tv-navy sm:text-4xl">This book belongs to your music.</h2>
      <p className="text-sm leading-relaxed text-tv-slate">Add a photo and a few words after each show, and turn back to them whenever you like.</p>
      <ul className="space-y-1.5 text-xs leading-relaxed text-tv-slate">
        <li>· Saved only in this browser, on this device</li>
        <li>· Not uploaded, synced or shared</li>
        <li>· Clearing this site’s data removes it</li>
      </ul>
    </div>
  );

  const Contents =
    count === 0 ? (
      <div className="flex h-full flex-col items-center justify-center gap-5 p-7 text-center sm:p-10">
        <div className="w-36">
          <Polaroid caption="Your first show" tilt={3} small />
        </div>
        <h2 className="font-serif text-3xl text-tv-navy">Your first page is waiting.</h2>
        <p className="max-w-xs text-sm leading-relaxed text-tv-slate">Choose a photo from a concert you loved and write down what it felt like.</p>
        {addButton()}
      </div>
    ) : (
      <div className="flex h-full flex-col p-7 sm:p-10">
        <h2 className="font-serif text-3xl text-tv-navy">Contents</h2>
        <ol className="mt-4 flex-1 space-y-1 overflow-y-auto">
          {memories.map((m, i) => (
            <li key={m.id}>
              <button onClick={() => go(i + 1)} className={`flex w-full items-baseline justify-between gap-3 rounded px-1 py-2 text-left hover:bg-tv-mist/70 cursor-pointer ${FOCUS_LIGHT}`}>
                <span className="truncate font-medium text-tv-navy">{m.title}</span>
                <span className="shrink-0 text-xs text-tv-slate">{formatDate(m.date)}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="pt-4">{addButton('secondary')}</div>
      </div>
    );

  const MemoryPhoto = (m: Memory, index: number, small = false) => (
    <div className={`mx-auto w-full ${small ? 'max-w-[15rem]' : 'max-w-[19rem]'}`}>
      <Polaroid src={m.photoId ? photos[m.photoId] : undefined} caption={m.title} tilt={index % 2 ? 2 : -2} alt={m.photoId ? `Photo for “${m.title}”` : ''} />
    </div>
  );

  const MemoryStory = (m: Memory, index: number) => (
    <article className="flex h-full flex-col p-7 sm:p-10" aria-label={m.title}>
      <p className={EYEBROW}>{formatDate(m.date)}</p>
      <h2 className="mt-2 font-serif text-3xl leading-tight text-tv-navy sm:text-4xl">{m.title}</h2>
      <div className="mt-4 flex-1 overflow-y-auto">
        {m.note ? <p className="whitespace-pre-wrap leading-relaxed text-tv-navy/85">{m.note}</p> : <p className="text-sm italic text-tv-slate">No note yet.</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setEditing({ memory: m })} className={buttonClass('secondary')}>
          <Pencil className="w-4 h-4" aria-hidden="true" />
          Edit
        </button>
        <button onClick={() => setConfirming(m)} className={buttonClass('ghost')}>
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          Delete
        </button>
        <span className="ml-auto font-serif italic text-tv-slate">{index}</span>
      </div>
    </article>
  );

  const render = (p: number, side: Side): React.ReactNode => {
    if (p < 0) return side === 'left' ? null : Cover;
    if (p === 0) return side === 'left' ? Intro : side === 'right' ? Contents : <div className="flex min-h-[inherit] flex-col justify-center">{Contents}</div>;
    const m = memories[p - 1];
    if (!m) return null;
    if (side === 'left') return <div className="flex h-full items-center justify-center p-8 sm:p-12">{MemoryPhoto(m, p)}</div>;
    if (side === 'right') return MemoryStory(m, p);
    return (
      <div className="flex min-h-[inherit] flex-col">
        <div className="px-7 pt-9">{MemoryPhoto(m, p, true)}</div>
        <div className="flex flex-1 flex-col">{MemoryStory(m, p)}</div>
      </div>
    );
  };

  /** One page of paper (or the cover, which brings its own surface). */
  /** `flow` lets the page take its content's height (the single-page base on phones). */
  const paper = (p: number, side: Side, className = '', flow = false) => {
    if (p < 0 && side === 'left') return null;
    const isCover = p < 0;
    const spine = side === 'left' ? 'tv-paper-left rounded-l-[14px]' : side === 'right' ? 'tv-paper-right rounded-r-[14px]' : 'tv-paper-right rounded-[14px]';
    return <div className={`${flow ? 'relative min-h-[inherit]' : 'absolute inset-0'} overflow-hidden ${isCover ? '' : `tv-paper ${spine}`} ${className}`}>{render(p, side)}</div>;
  };

  /* ---------- The book ---------- */

  const leafTransition = { duration: TURN_MS / 1000, ease: EASE };
  const closed = page < 0 && !turn;
  const opening = turn?.from === -1 || turn?.to === -1;

  const spread = (() => {
    if (!wide) {
      // Single page: the destination underneath, the current page turning away on top
      return (
        <div className="relative mx-auto grid min-h-[min(150vw,40rem)] w-full max-w-md" style={{ perspective: 1800 }}>
          {paper(turn ? turn.to : page, 'single', '', true)}
          {turn && (
            <motion.div
              inert
              className="absolute inset-0 [transform-style:preserve-3d]"
              style={{ transformOrigin: turn.dir === 'next' ? 'left center' : 'right center' }}
              initial={{ rotateY: 0, opacity: 1 }}
              animate={{ rotateY: turn.dir === 'next' ? -100 : 100, opacity: 0 }}
              transition={leafTransition}
              onAnimationComplete={finishTurn}
            >
              {paper(turn.from, 'single', 'shadow-tv-lift')}
            </motion.div>
          )}
        </div>
      );
    }
    const baseLeft = turn ? (turn.dir === 'next' ? turn.from : turn.to) : page;
    const baseRight = turn ? (turn.dir === 'next' ? turn.to : turn.from) : page;
    return (
      <motion.div
        className="relative mx-auto aspect-[8/5]"
        // Fit the window: the page nav below the book stays on screen
        style={{ perspective: 2400, width: 'min(100%, 64rem, calc((100vh - 330px) * 1.6))' }}
        // A closed book lies centred; opening slides it so the spine sits in the middle
        animate={{ x: closed || (opening && turn?.dir === 'prev') ? '-25%' : '0%' }}
        initial={false}
        transition={reduced ? { duration: 0 } : leafTransition}
      >
        <div className="absolute inset-y-0 left-0 w-1/2">
          {paper(baseLeft, 'left')}
        </div>
        <div className="absolute inset-y-0 right-0 w-1/2">
          {paper(baseRight, 'right')}
        </div>
        {!closed && page >= 0 && !turn && <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgb(43_33_29/0.12),transparent)]" />}
        {turn && (
          <motion.div
            inert
            className={`absolute inset-y-0 w-1/2 [transform-style:preserve-3d] ${turn.dir === 'next' ? 'right-0' : 'left-0'}`}
            style={{ transformOrigin: turn.dir === 'next' ? 'left center' : 'right center' }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: turn.dir === 'next' ? -180 : 180 }}
            transition={leafTransition}
            onAnimationComplete={finishTurn}
          >
            <div className="absolute inset-0 [backface-visibility:hidden]">
              {paper(turn.from, turn.dir === 'next' ? 'right' : 'left')}
              <div className={`tv-leaf-shade absolute inset-0 ${turn.dir === 'next' ? 'tv-leaf-shade-front' : 'tv-leaf-shade-front-prev'}`} />
            </div>
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {paper(turn.to, turn.dir === 'next' ? 'left' : 'right')}
              <div className="tv-leaf-shade tv-leaf-shade-back absolute inset-0" />
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  })();

  return (
    <div className="min-h-screen overflow-x-hidden bg-tv-canvas text-tv-navy selection:bg-tv-accent/30">
      <header className="sticky top-0 z-40 border-b border-tv-line bg-tv-canvas/95 backdrop-blur-xl">
        <div className={`${CONTAINER} flex h-16 items-center justify-between gap-3`}>
          <button onClick={onBack} className={buttonClass('ghost')}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to TΛVY Website
          </button>
          <span className="flex items-center gap-1.5 rounded-full border border-tv-line bg-tv-paper px-3 py-1 text-xs font-semibold text-tv-navy">
            <HardDrive className="w-3.5 h-3.5 text-tv-accent-ink" aria-hidden="true" />
            Saved on this device
          </span>
        </div>
      </header>

      <main className={`${CONTAINER} py-8 sm:py-10`} onKeyDown={onKeyDown}>
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className={EYEBROW}>Beyond the concert</p>
            <h1 ref={headingRef} tabIndex={-1} className="text-4xl font-semibold tracking-[-0.04em] focus:outline-none sm:text-5xl">
              Memory <span className="font-serif font-normal italic tracking-[-0.01em]">Book</span>
            </h1>
            <p className="text-lg text-tv-slate">Every concert has a story. Keep yours.</p>
          </div>
          <div className="shrink-0">{addButton()}</div>
        </div>

        {error && (
          <p role="alert" className="mb-6 rounded-tv-sm border border-[#e7c1c1] bg-[#fdf2f2] px-4 py-3 text-sm text-[#7f1d1d]">
            {error}
          </p>
        )}

        <section aria-label="Memory Book" aria-busy={status === 'loading'} className="select-none">
          {status === 'loading' ? <div className="mx-auto aspect-[8/5] w-full max-w-[64rem] rounded-[14px] bg-tv-mist" style={{ width: 'min(100%, 64rem, calc((100vh - 330px) * 1.6))' }} /> : spread}
        </section>

        <nav aria-label="Pages" className="mt-6 flex items-center justify-center gap-3">
          <button ref={prevRef} onClick={() => go(page - 1)} disabled={page < 0 || !!turn} aria-label="Previous page" className={`inline-flex size-11 items-center justify-center rounded-full border border-tv-line bg-tv-paper text-tv-navy hover:bg-tv-mist disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${FOCUS_LIGHT}`}>
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <p className="min-w-40 text-center text-sm text-tv-slate" aria-hidden="true">
            {page < 0 ? 'Cover' : page === 0 ? 'Contents' : `Memory ${page} of ${count}`}
          </p>
          <button ref={nextRef} onClick={() => go(page + 1)} disabled={page >= last || !!turn || status !== 'ready'} aria-label={page < 0 ? 'Open the book' : 'Next page'} className={`inline-flex size-11 items-center justify-center rounded-full border border-tv-line bg-tv-paper text-tv-navy hover:bg-tv-mist disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${FOCUS_LIGHT}`}>
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </nav>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
        <p className="mt-2 text-center text-xs text-tv-slate">Use the arrows, or ← and → on your keyboard.</p>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-tv-slate">
          Your Memory Book is stored only in this browser on this device. Photos are resized here and never uploaded. There
          are no accounts, sync or sharing yet, so clearing this site’s data or switching browsers will not bring your
          memories with you.
        </p>
      </main>

      {editing && (
        <MemoryEditor
          memory={editing.memory}
          currentPhotoUrl={editing.memory?.photoId ? photos[editing.memory.photoId] : undefined}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {confirming && (
        <Dialog title="Delete this memory?" role="alertdialog" busy={deleting} onClose={() => setConfirming(null)}>
          <p className="text-tv-slate">
            “{confirming.title}” and its photo will be removed from this device. This can’t be undone.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button onClick={() => setConfirming(null)} disabled={deleting} className={buttonClass('ghost')}>
              Keep it
            </button>
            <button onClick={remove} disabled={deleting} className={`${buttonClass('primary')} !bg-[#8f2a2a] hover:!bg-[#7a2222]`}>
              {deleting ? 'Deleting…' : 'Delete memory'}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default MemoryBook;

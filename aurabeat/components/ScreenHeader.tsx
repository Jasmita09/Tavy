import { useEffect, useRef } from "react";

interface ScreenHeaderProps {
  label: string;
  onExit: () => void;
  /** Jump straight to the other concert mode. */
  switchTo?: { label: string; onSelect: () => void };
}

/**
 * Top bar shared by the concert screens: brand, mode label, mode switch, and an always-visible exit.
 * Focus moves to the heading once on mount, so keyboard and screen-reader users land on the new page.
 */
export default function ScreenHeader({ label, onExit, switchTo }: ScreenHeaderProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="flex items-center gap-2 font-display text-xs font-semibold tracking-[0.3em] text-aura">
          TΛVY CONCERT
          <span className="rounded-full border border-aura/40 px-2 py-0.5 text-[10px] tracking-normal normal-case">
            Simulated demo
          </span>
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-1 font-display text-lg font-bold tracking-wide uppercase">
          {label}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {switchTo && (
          <button
            type="button"
            onClick={switchTo.onSelect}
            className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-ink-muted transition hover:border-white/40 hover:bg-white/5 hover:text-ink"
          >
            {switchTo.label}
          </button>
        )}
        <button
          type="button"
          onClick={onExit}
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-ink transition hover:border-white/40 hover:bg-white/5"
        >
          <span aria-hidden="true">←</span>
          Exit
        </button>
      </div>
    </header>
  );
}

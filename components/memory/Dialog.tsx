import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { FOCUS_LIGHT } from '../ui/tokens';

interface DialogProps {
  title: string;
  /** alertdialog for confirmations. */
  role?: 'dialog' | 'alertdialog';
  /** Escape and the close button are ignored while true (e.g. while saving). */
  busy?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Element to focus when the dialog opens (defaults to the first focusable control). */
  initialFocus?: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal dialog: focus moves in and is kept inside, Escape closes it, the page behind is inert, and
 * focus returns to whatever opened it.
 */
export const Dialog: React.FC<DialogProps> = ({ title, role = 'dialog', busy = false, onClose, children, initialFocus }) => {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (initialFocus?.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    return () => {
      root?.removeAttribute('inert');
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !busyRef.current) {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Rendered outside #root, so making the page inert doesn't make the dialog inert too
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-tv-navy/45 p-0 sm:items-center sm:p-6" onKeyDown={onKeyDown}>
      <div
        ref={panel}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-tv-lg bg-tv-paper p-5 shadow-tv-lift sm:max-w-lg sm:rounded-tv-lg sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-serif text-3xl text-tv-navy">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full text-tv-slate hover:bg-tv-mist disabled:opacity-40 cursor-pointer ${FOCUS_LIGHT}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
};

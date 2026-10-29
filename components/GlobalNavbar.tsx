import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { buttonClass } from './ui/Button';
import { FOCUS_LIGHT } from './ui/tokens';

/** Landing-page sections the navigation can reach. Each id exists in HomePortal. */
export const NAV_SECTIONS = [
  { id: 'experience', label: 'Experience' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'halo', label: 'Halo' },
  { id: 'memories', label: 'Memories' },
] as const;

/** Scrolls to a landing section and moves keyboard focus to its heading. */
export const goToSection = (id: string) => {
  const section = document.getElementById(id);
  if (!section) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const heading = section.querySelector<HTMLElement>('h2');
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
};

interface GlobalNavbarProps {
  onEnterExperience: () => void;
}

export const GlobalNavbar: React.FC<GlobalNavbarProps> = ({ onEnterExperience }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Escape closes the mobile menu and returns focus to its button.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    goToSection(id);
  };

  const link = `inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-tv-slate hover:text-tv-navy transition-colors cursor-pointer ${FOCUS_LIGHT}`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
        isScrolled || menuOpen ? 'bg-tv-canvas/90 backdrop-blur-xl border-b border-tv-line' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 sm:h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`inline-flex min-h-11 items-center rounded-full px-1 text-xl font-bold tracking-[-0.02em] text-tv-navy cursor-pointer ${FOCUS_LIGHT}`}
          aria-label="TΛVY, back to top"
        >
          TΛVY
        </button>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_SECTIONS.map((s) => (
              <li key={s.id}>
                <button onClick={() => go(s.id)} className={link}>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={onEnterExperience} className={`${buttonClass('primary')} hidden sm:inline-flex`}>
            Enter Experience
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            ref={menuButton}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className={`md:hidden inline-flex size-11 items-center justify-center rounded-full text-tv-navy hover:bg-tv-mist cursor-pointer ${FOCUS_LIGHT}`}
          >
            {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id={menuId} aria-label="Menu" className="md:hidden border-t border-tv-line bg-tv-canvas px-4 pb-6 pt-2">
          <ul className="divide-y divide-tv-line">
            {NAV_SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => go(s.id)}
                  className={`flex min-h-12 w-full items-center justify-between rounded-lg text-left text-lg font-medium text-tv-navy cursor-pointer ${FOCUS_LIGHT}`}
                >
                  {s.label}
                  <ArrowRight className="w-4 h-4 text-tv-slate" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              setMenuOpen(false);
              onEnterExperience();
            }}
            className={`${buttonClass('primary', 'lg')} mt-4 w-full`}
          >
            Enter Experience
          </button>
        </nav>
      )}
    </header>
  );
};

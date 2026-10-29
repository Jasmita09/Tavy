import React from 'react';
import { FOCUS_RING } from './ExperienceShell';

interface ConcertErrorBoundaryProps {
  onBack: () => void;
  children: React.ReactNode;
}

interface ConcertErrorBoundaryState {
  failed: boolean;
}

/**
 * Catches a crash (or a failed lazy chunk download) inside a concert mode, so the user gets a
 * message and a way back instead of a blank page. Keyed by view in App, so it resets on navigation.
 */
export class ConcertErrorBoundary extends React.Component<ConcertErrorBoundaryProps, ConcertErrorBoundaryState> {
  // The repo has no @types/react, so React.Component doesn't type `props` on its own.
  declare props: Readonly<ConcertErrorBoundaryProps>;
  state: ConcertErrorBoundaryState = { failed: false };
  private headingRef = React.createRef<HTMLHeadingElement>();

  static getDerivedStateFromError(): ConcertErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Concert experience crashed', error, info.componentStack);
  }

  componentDidUpdate(_: ConcertErrorBoundaryProps, prev: ConcertErrorBoundaryState) {
    if (this.state.failed && !prev.failed) this.headingRef.current?.focus();
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 ref={this.headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
            This concert couldn't load
          </h1>
          <p className="text-stone-300">
            Something went wrong on our side. Check your connection, then try again or pick another mode.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={this.props.onBack}
              className={`min-h-12 px-5 rounded-full bg-amber-400 text-stone-950 font-semibold cursor-pointer ${FOCUS_RING}`}
            >
              Back to experience selection
            </button>
            <button
              onClick={() => window.location.reload()}
              className={`min-h-12 px-5 rounded-full border border-white/20 text-stone-200 font-semibold cursor-pointer ${FOCUS_RING}`}
            >
              Reload
            </button>
          </div>
        </div>
      </main>
    );
  }
}

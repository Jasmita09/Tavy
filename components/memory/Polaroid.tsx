import React from 'react';
import { Music2 } from 'lucide-react';

interface PolaroidProps {
  src?: string;
  caption: string;
  /** Slight hand-placed tilt, in degrees. */
  tilt?: number;
  small?: boolean;
  alt?: string;
}

/** A photo printed as a Polaroid and taped into the book. Without a photo, an empty frame waits for one. */
export const Polaroid: React.FC<PolaroidProps> = ({ src, caption, tilt = 0, small = false, alt = '' }) => (
  <figure
    className={`relative m-0 bg-white shadow-[0_1px_2px_rgb(43_33_29/0.12),0_14px_28px_-14px_rgb(43_33_29/0.45)] ${small ? 'p-2 pb-7' : 'p-3 pb-12 sm:p-3.5 sm:pb-14'}`}
    style={{ transform: `rotate(${tilt}deg)` }}
  >
    {/* Washi tape */}
    <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 -rotate-3 bg-tv-blush/70 ${small ? '-top-2 h-4 w-12' : '-top-3 h-6 w-20'}`} />
    <div className="aspect-square w-full overflow-hidden bg-tv-mist">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgb(246_220_169/0.6),rgb(245_237_224))]">
          <Music2 className={`${small ? 'w-6 h-6' : 'w-10 h-10'} text-tv-accent`} aria-hidden="true" />
        </div>
      )}
    </div>
    <figcaption className={`absolute inset-x-3 truncate text-center font-serif italic text-tv-navy/80 ${small ? 'bottom-1.5 text-sm' : 'bottom-3 text-lg sm:bottom-4 sm:text-xl'}`}>
      {caption}
    </figcaption>
  </figure>
);

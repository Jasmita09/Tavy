/**
 * Golden Gate geometry, shared by the scene (to draw it) and the scroll timeline (to centre it).
 * All values are CSS px relative to the centred concert card's centre, y up.
 */
export interface GateShape {
  /** Half the gap between the columns. */
  W: number;
  /** Where the columns turn into the arch. */
  spring: number;
  /** Arch rise above the spring line. */
  ry: number;
  apex: number;
  base: number;
  /** Rendered note size on the gate. */
  noteSize: number;
}

/** A low, wide arch that always clears the card's top corners, on any card size and viewport. */
export const gateShape = (card: { w: number; h: number }, vw: number): GateShape => {
  const W = Math.min(card.w * 0.72, vw * 0.48);
  const spring = card.h * 0.4;
  const corner = Math.min(0.97, card.w / 2 / W);
  const clear = (card.h / 2 - spring + 18) / Math.sqrt(1 - corner * corner);
  const ry = Math.max(W * 0.3, clear);
  const noteSize = Math.min(62, Math.max(32, card.w / 8)) * 0.8;
  return { W, spring, ry, apex: spring + ry, base: -card.h / 2 - 22, noteSize };
};

/** Vertical centre of the whole gate composition (apex note to column base), relative to the card centre. */
export const gateCentre = (s: GateShape) => (s.apex + s.noteSize * 1.4 + s.base) / 2;

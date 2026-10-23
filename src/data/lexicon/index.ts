// LETTER → dynamic import() map — the lazy per-letter seam
// (004c §9; R3: letter payloads never enter the initial bundle).
// Static content of this module: only these thunks + types.
import type { LexiconEntry } from './types';

export type LetterModule = { entries: LexiconEntry[] };

export const LETTER_MODULES: Record<string, () => Promise<LetterModule>> = {
  A: () => import('./a'),
  B: () => import('./b'),
  C: () => import('./c'),
  D: () => import('./d'),
  E: () => import('./e'),
  F: () => import('./f'),
  G: () => import('./g'),
  H: () => import('./h'),
  I: () => import('./i'),
  J: () => import('./j'),
  K: () => import('./k'),
  L: () => import('./l'),
  M: () => import('./m'),
  N: () => import('./n'),
  'Ñ': () => import('./ñ'),
  O: () => import('./o'),
  P: () => import('./p'),
  Q: () => import('./q'),
  R: () => import('./r'),
  S: () => import('./s'),
  T: () => import('./t'),
  U: () => import('./u'),
  V: () => import('./v'),
  W: () => import('./w'),
  X: () => import('./x'),
  Y: () => import('./y'),
  Z: () => import('./z'),
};

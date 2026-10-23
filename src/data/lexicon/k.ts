// Letter K — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "k-kilo", letter: "K", word: "kilo", syllables: "ki-lo", glossEN: "kilo", glossES: 'unidad de peso que vale mil gramos.', sentenceES: "Un kilo de manzanas.", sentenceEN: "A kilo of apples.", category: 'misc', level: 2, usefulness: 'mid', notes: 'Letter-level: la K se usa casi solo en extranjerismos y unidades; elección de vocabulario pendiente de revisión.', stage: 'published' },
  { id: "k-kiwi", letter: "K", word: "kiwi", syllables: "ki-wi", glossEN: "kiwi", glossES: 'fruta verde con pulpa suave.', sentenceES: "El kiwi es verde.", sentenceEN: "The kiwi is green.", category: 'food', level: 2, usefulness: 'mid', orthography: { accented: false }, notes: 'Extranjerismo aceptado por la RAE. En España «kiwi» también designa al ave; confirmar que el significado de fruta es el que busca el curso.', stage: 'published' },
  { id: "k-kiosco", letter: "K", word: "kiosco", syllables: "kios-co", glossEN: "kiosk", glossES: 'puesto en la calle para vender periódicos.', sentenceES: "Compro el periódico en el kiosco.", sentenceEN: "I buy the newspaper at the kiosk.", category: 'city', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
];

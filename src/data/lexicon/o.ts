// Letter O — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "o-ojo", letter: "O", word: "ojo", syllables: "o-jo", glossEN: "eye", glossES: 'parte de la cara que usas para ver.', sentenceES: "Cierra los ojos.", sentenceEN: "Close your eyes.", category: 'body', level: 2, usefulness: 'high', notes: 'La frase usa la forma plural "ojos"; decisión de regirse por el instructor (forma singular vs. frase natural).', stage: 'published' },
  { id: "o-oro", letter: "O", word: "oro", syllables: "o-ro", glossEN: "gold", glossES: 'metal amarillo y muy valioso.', sentenceES: "El oro es valioso.", sentenceEN: "Gold is valuable.", category: 'misc', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
  { id: "o-oveja", letter: "O", word: "oveja", syllables: "o-ve-ja", glossEN: "sheep", glossES: 'animal doméstico que produce lana.', sentenceES: "La oveja es blanca.", sentenceEN: "The sheep is white.", category: 'animals', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
];

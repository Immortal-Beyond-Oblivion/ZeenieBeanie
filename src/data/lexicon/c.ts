// Letter C — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "c-casa", letter: "C", word: "casa", syllables: "ca-sa", glossEN: "house", glossES: 'lugar donde vives con tu familia.', sentenceES: "Mi casa es pequeña.", sentenceEN: "My house is small.", category: 'home', level: 1, usefulness: 'high', stage: 'published' },
  { id: "c-comida", letter: "C", word: "comida", syllables: "co-mi-da", glossEN: "food", glossES: 'alimento que se come.', sentenceES: "La comida está rica.", sentenceEN: "The food is delicious.", category: 'food', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "c-cielo", letter: "C", word: "cielo", syllables: "cie-lo", glossEN: "sky", glossES: 'espacio azul que ves sobre la tierra.', sentenceES: "El cielo está azul.", sentenceEN: "The sky is blue.", category: 'nature', level: 2, usefulness: 'high', stage: 'published' },
];

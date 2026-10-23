// Letter Y — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "y-yo", letter: "Y", word: "yo", syllables: "yo", glossEN: "I", glossES: 'palabra que usas para hablar de ti.', sentenceES: "Yo hablo español.", sentenceEN: "I speak Spanish.", category: 'misc', level: 1, usefulness: 'high', stage: 'published' },
  { id: "y-yoga", letter: "Y", word: "yoga", syllables: "yo-ga", glossEN: "yoga", glossES: 'deporte que estira el cuerpo y relaja la mente.', sentenceES: "Hago yoga por la mañana.", sentenceEN: "I do yoga in the morning.", category: 'sports', level: 2, usefulness: 'mid', stage: 'published' },
  { id: "y-yogur", letter: "Y", word: "yogur", syllables: "yo-gur", glossEN: "yogurt", glossES: 'crema dulce de leche que se come con cuchara.', sentenceES: "Como yogur con fruta.", sentenceEN: "I eat yogurt with fruit.", category: 'food', level: 2, usefulness: 'mid', notes: 'Forma preferida por la RAE: "yogur" (también "yoghurt").', stage: 'published' },
];

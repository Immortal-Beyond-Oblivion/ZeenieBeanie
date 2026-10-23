// Letter F — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "f-flor", letter: "F", word: "flor", syllables: "flor", glossEN: "flower", glossES: 'parte bonita y coloreada de una planta.', sentenceES: "La flor es bonita.", sentenceEN: "The flower is pretty.", category: 'nature', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "f-fruta", letter: "F", word: "fruta", syllables: "fru-ta", glossEN: "fruit", glossES: 'alimento dulce que crece en una planta o en un árbol.', sentenceES: "Me gusta la fruta.", sentenceEN: "I like fruit.", category: 'food', level: 1, usefulness: 'high', stage: 'published' },
  { id: "f-fuego", letter: "F", word: "fuego", syllables: "fue-go", glossEN: "fire", glossES: 'lugar donde el calor ilumina y quema.', sentenceES: "El fuego es caliente.", sentenceEN: "The fire is hot.", category: 'nature', level: 2, usefulness: 'mid', stage: 'published' },
];

// Letter I — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "i-idea", letter: "I", word: "idea", syllables: "i-de-a", glossEN: "idea", glossES: 'pensamiento que se te ocurre para algo.', sentenceES: "Tengo una idea.", sentenceEN: "I have an idea.", category: 'misc', level: 1, usefulness: 'high', stage: 'published' },
  { id: "i-invierno", letter: "I", word: "invierno", syllables: "in-vier-no", glossEN: "winter", glossES: 'estación del año más fría que el verano.', sentenceES: "En invierno hace frío.", sentenceEN: "In winter it is cold.", category: 'weather', level: 2, usefulness: 'mid', stage: 'published' },
  { id: "i-isla", letter: "I", word: "isla", syllables: "is-la", glossEN: "island", glossES: 'tierra rodeada de agua.', sentenceES: "La isla es bonita.", sentenceEN: "The island is beautiful.", category: 'nature', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
];

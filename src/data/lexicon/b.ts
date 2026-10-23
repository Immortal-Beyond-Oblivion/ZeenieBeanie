// Letter B — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "b-bueno", letter: "B", word: "bueno", syllables: "bue-no", glossEN: "good", glossES: 'de buena calidad o que te gusta mucho.', sentenceES: "Este café es muy bueno.", sentenceEN: "This coffee is very good.", category: 'adjectives', level: 1, usefulness: 'high', stage: 'published' },
  { id: "b-beso", letter: "B", word: "beso", syllables: "be-so", glossEN: "kiss", glossES: 'caricio que das a alguien con la boca.', sentenceES: "Ella da un beso a su hijo.", sentenceEN: "She gives her son a kiss.", category: 'actions', level: 2, usefulness: 'mid', stage: 'published' },
  { id: "b-barco", letter: "B", word: "barco", syllables: "bar-co", glossEN: "boat", glossES: 'barco que viaja por el mar.', sentenceES: "El barco está en el mar.", sentenceEN: "The boat is in the sea.", category: 'travel', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
];

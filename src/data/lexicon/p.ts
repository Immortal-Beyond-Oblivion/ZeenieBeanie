// Letter P — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "p-pan", letter: "P", word: "pan", syllables: "pan", glossEN: "bread", glossES: 'alimento hecho con harina.', sentenceES: "El pan está fresco.", sentenceEN: "The bread is fresh.", category: 'food', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "p-perro", letter: "P", word: "perro", syllables: "pe-rro", glossEN: "dog", glossES: 'animal doméstico que ladra.', sentenceES: "El perro corre en el parque.", sentenceEN: "The dog runs in the park.", category: 'animals', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "p-playa", letter: "P", word: "playa", syllables: "pla-ya", glossEN: "beach", glossES: 'lugar de arena junto al mar.', sentenceES: "Vamos a la playa.", sentenceEN: "We go to the beach.", category: 'travel', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
];

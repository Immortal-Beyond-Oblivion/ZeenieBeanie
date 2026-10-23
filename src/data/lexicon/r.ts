// Letter R — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "r-raton", letter: "R", word: "ratón", syllables: "ra-tón", glossEN: "mouse", glossES: 'animal pequeño con cola que come queso.', sentenceES: "El ratón come queso.", sentenceEN: "The mouse eats cheese.", category: 'animals', level: 2, usefulness: 'mid', orthography: { accented: true, accentedVowels: ['ó'] }, stage: 'published' },
  { id: "r-reloj", letter: "R", word: "reloj", syllables: "re-loj", glossEN: "clock", glossES: 'objeto que marca las horas.', sentenceES: "Miro el reloj.", sentenceEN: "I look at the clock.", category: 'time', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
  { id: "r-rosa", letter: "R", word: "rosa", syllables: "ro-sa", glossEN: "rose", glossES: 'flor bonita y aromática.', sentenceES: "La rosa es roja.", sentenceEN: "The rose is red.", category: 'nature', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
];

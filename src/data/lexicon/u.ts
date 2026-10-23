// Letter U — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "u-universo", letter: "U", word: "universo", syllables: "u-ni-ver-so", glossEN: "universe", glossES: 'todo lo que existe: estrellas, planetas y todo.', sentenceES: "El universo es enorme.", sentenceEN: "The universe is huge.", category: 'nature', level: 3, usefulness: 'low', stage: 'published' },
  { id: "u-uniforme", letter: "U", word: "uniforme", syllables: "u-ni-for-me", glossEN: "uniform", glossES: 'conjunto de ropa para trabajar o estudiar.', sentenceES: "Mi uniforme es azul.", sentenceEN: "My uniform is blue.", category: 'clothing', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
  { id: "u-uva", letter: "U", word: "uva", syllables: "u-va", glossEN: "grape", glossES: 'fruta pequeña y dulce que crece en la vid.', sentenceES: "La uva es dulce.", sentenceEN: "The grape is sweet.", category: 'food', level: 2, usefulness: 'mid', stage: 'published' },
];

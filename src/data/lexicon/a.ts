// Letter A — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "a-arbol", letter: "A", word: "árbol", syllables: "ár-bol", glossEN: "tree", glossES: 'planta alta con tronco y ramas.', sentenceES: "El árbol es muy alto.", sentenceEN: "The tree is very tall.", category: 'nature', level: 1, usefulness: 'high', orthography: { accented: true, accentedVowels: ['á'] }, stage: 'published' },
  { id: "a-amiga", letter: "A", word: "amiga", syllables: "a-mi-ga", glossEN: "friend", glossES: 'persona que quieres mucho y con la que hablas.', sentenceES: "Mi amiga vive en Madrid.", sentenceEN: "My friend lives in Madrid.", category: 'family', level: 1, usefulness: 'high', stage: 'published' },
  { id: "a-agua", letter: "A", word: "agua", syllables: "a-gua", glossEN: "water", glossES: 'líquido transparente que bebemos todos los días.', sentenceES: "Quiero un vaso de agua.", sentenceEN: "I want a glass of water.", category: 'food', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
];

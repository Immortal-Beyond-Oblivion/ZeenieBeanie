// Letter H — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "h-hola", letter: "H", word: "hola", syllables: "ho-la", glossEN: "hello", glossES: 'saludo que usas cuando ves a alguien.', sentenceES: "Hola, ¿cómo estás?", sentenceEN: "Hello, how are you?", category: 'misc', level: 1, usefulness: 'high', stage: 'published' },
  { id: "h-hambre", letter: "H", word: "hambre", syllables: "ham-bre", glossEN: "hunger", glossES: 'ganas de comer que sientes en el estómago.', sentenceES: "Tengo hambre.", sentenceEN: "I am hungry.", category: 'food', level: 1, usefulness: 'high', stage: 'published' },
  { id: "h-hoja", letter: "H", word: "hoja", syllables: "ho-ja", glossEN: "leaf", glossES: 'parte verde y plana de un árbol.', sentenceES: "La hoja es verde.", sentenceEN: "The leaf is green.", category: 'nature', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
];

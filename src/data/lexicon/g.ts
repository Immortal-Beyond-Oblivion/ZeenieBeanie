// Letter G — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "g-gato", letter: "G", word: "gato", syllables: "ga-to", glossEN: "cat", glossES: 'animal doméstico que maúlla.', sentenceES: "El gato duerme en el sofá.", sentenceEN: "The cat sleeps on the sofa.", category: 'animals', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "g-guitarra", letter: "G", word: "guitarra", syllables: "gui-tar-ra", glossEN: "guitar", glossES: 'instrumento musical con seis cuerdas.', sentenceES: "Toco la guitarra.", sentenceEN: "I play the guitar.", category: 'music', level: 1, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
  { id: "g-gracias", letter: "G", word: "gracias", syllables: "gra-cias", glossEN: "thanks", glossES: 'palabra que usas para dar las gracias.', sentenceES: "Muchas gracias.", sentenceEN: "Thank you very much.", category: 'misc', level: 1, usefulness: 'high', stage: 'published' },
];

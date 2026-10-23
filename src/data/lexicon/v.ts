// Letter V — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "v-vaso", letter: "V", word: "vaso", syllables: "va-so", glossEN: "glass", glossES: 'recipiente para beber.', sentenceES: "El vaso está lleno.", sentenceEN: "The glass is full.", category: 'home', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "v-verde", letter: "V", word: "verde", syllables: "ver-de", glossEN: "green", glossES: 'color de la hierba y de las hojas.', sentenceES: "La hierba es verde.", sentenceEN: "The grass is green.", category: 'colors', level: 1, usefulness: 'high', stage: 'published' },
  { id: "v-viaje", letter: "V", word: "viaje", syllables: "via-je", glossEN: "trip", glossES: 'traslado a otro lugar.', sentenceES: "Voy de viaje en verano.", sentenceEN: "I go on a trip in the summer.", category: 'travel', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
];

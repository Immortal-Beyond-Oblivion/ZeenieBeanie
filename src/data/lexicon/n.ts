// Letter N — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "n-nino", letter: "N", word: "niño", syllables: "ni-ño", glossEN: "boy", glossES: 'varón pequeño que todavía aprende muchas cosas.', sentenceES: "El niño juega.", sentenceEN: "The boy plays.", category: 'family', level: 1, usefulness: 'high', orthography: { enye: true }, stage: 'published' },
  { id: "n-nube", letter: "N", word: "nube", syllables: "nu-be", glossEN: "cloud", glossES: 'masa de agua que flota en el cielo.', sentenceES: "La nube es blanca.", sentenceEN: "The cloud is white.", category: 'weather', level: 2, usefulness: 'mid', stage: 'published' },
  { id: "n-nombre", letter: "N", word: "nombre", syllables: "nom-bre", glossEN: "name", glossES: 'palabra con la que te llamas y te identificas.', sentenceES: "Escribe tu nombre.", sentenceEN: "Write your name.", category: 'school', level: 1, usefulness: 'high', stage: 'published' },
];

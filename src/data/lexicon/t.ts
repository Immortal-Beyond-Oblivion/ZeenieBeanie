// Letter T — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "t-tarde", letter: "T", word: "tarde", syllables: "tar-de", glossEN: "afternoon", glossES: 'parte del día después de la mañana.', sentenceES: "Buenas tardes.", sentenceEN: "Good afternoon.", category: 'time', level: 2, usefulness: 'mid', stage: 'published' },
  { id: "t-taza", letter: "T", word: "taza", syllables: "ta-za", glossEN: "cup", glossES: 'recipiente para beber café o té.', sentenceES: "La taza de café está caliente.", sentenceEN: "The coffee cup is hot.", category: 'home', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "t-tiempo", letter: "T", word: "tiempo", syllables: "tiem-po", glossEN: "weather", glossES: 'estado del aire, con sol, lluvia o frío.', sentenceES: "Hoy hace buen tiempo.", sentenceEN: "The weather is nice today.", category: 'weather', level: 2, usefulness: 'high', notes: 'La palabra "tiempo" también significa "time"; el gloss elige "weather" por la frase. Instructor puede ajustar.', stage: 'published' },
];

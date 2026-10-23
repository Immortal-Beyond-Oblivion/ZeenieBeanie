// Letter Z — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "z-zapato", letter: "Z", word: "zapato", syllables: "za-pa-to", glossEN: "shoe", glossES: 'calzado que cubre el pie.', sentenceES: "Me pongo los zapatos.", sentenceEN: "I put on my shoes.", category: 'clothing', level: 1, usefulness: 'high', orthography: { accented: false }, notes: 'La frase usa la forma plural «zapatos» mientras la entrada es el singular; decisión de regirse por el instructor (forma singular vs. frase natural).', stage: 'published' },
  { id: "z-zorro", letter: "Z", word: "zorro", syllables: "zo-rro", glossEN: "fox", glossES: 'animal pequeño y astuto.', sentenceES: "El zorro es listo.", sentenceEN: "The fox is clever.", category: 'animals', level: 2, usefulness: 'mid', orthography: { accented: false }, stage: 'published' },
  { id: "z-zona", letter: "Z", word: "zona", syllables: "zo-na", glossEN: "zone", glossES: 'parte de un lugar o de una ciudad.', sentenceES: "La zona es tranquila.", sentenceEN: "The area is quiet.", category: 'city', level: 2, usefulness: 'mid', stage: 'published' },
];

// Letter S — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "s-sol", letter: "S", word: "sol", syllables: "sol", glossEN: "sun", glossES: 'estrella que nos da luz y calor.', sentenceES: "El sol brilla.", sentenceEN: "The sun shines.", category: 'nature', level: 1, usefulness: 'high', stage: 'published' },
  { id: "s-silla", letter: "S", word: "silla", syllables: "si-lla", glossEN: "chair", glossES: 'mueble para sentarse.', sentenceES: "Me siento en la silla.", sentenceEN: "I sit on the chair.", category: 'home', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "s-semana", letter: "S", word: "semana", syllables: "se-ma-na", glossEN: "week", glossES: 'grupo de siete días que siempre se repite.', sentenceES: "La semana tiene siete días.", sentenceEN: "The week has seven days.", category: 'time', level: 2, usefulness: 'high', stage: 'published' },
];

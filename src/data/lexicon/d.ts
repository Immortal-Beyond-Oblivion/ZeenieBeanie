// Letter D — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "d-dedo", letter: "D", word: "dedo", syllables: "de-do", glossEN: "finger", glossES: 'cada uno de los dedos de la mano.', sentenceES: "Tengo diez dedos.", sentenceEN: "I have ten fingers.", category: 'body', level: 2, usefulness: 'mid', stage: 'published' },
  { id: "d-dia", letter: "D", word: "día", syllables: "dí-a", glossEN: "day", glossES: 'tiempo que pasa desde la mañana hasta la noche.', sentenceES: "Hoy es un buen día.", sentenceEN: "Today is a good day.", category: 'time', level: 1, usefulness: 'high', orthography: { accented: true, accentedVowels: ['í'] }, notes: 'Monosílabo ortográfico con hiato: sílabas dí-a (acento por diéresis/hiato).', stage: 'published' },
  { id: "d-dos", letter: "D", word: "dos", syllables: "dos", glossEN: "two", glossES: 'número que va justo después del uno.', sentenceES: "Tengo dos gatos.", sentenceEN: "I have two cats.", category: 'numbers', level: 1, usefulness: 'high', stage: 'published' },
];

// Letter E — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "e-escuela", letter: "E", word: "escuela", syllables: "es-cue-la", glossEN: "school", glossES: 'lugar donde los niños estudian.', sentenceES: "Voy a la escuela.", sentenceEN: "I go to school.", category: 'school', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "e-estrella", letter: "E", word: "estrella", syllables: "es-tre-lla", glossEN: "star", glossES: 'punto de luz que brilla en el cielo de noche.', sentenceES: "La estrella es brillante.", sentenceEN: "The star is bright.", category: 'nature', level: 2, usefulness: 'mid', stage: 'published' },
  { id: "e-espanol", letter: "E", word: "español", syllables: "es-pa-ñol", glossEN: "Spanish", glossES: 'idioma que se habla en España y en muchos países.', sentenceES: "Hablo español.", sentenceEN: "I speak Spanish.", category: 'misc', level: 1, usefulness: 'high', orthography: { enye: true }, stage: 'published' },
];

// Letter X — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "x-xilofono", letter: "X", word: "xilófono", syllables: "xi-ló-fo-no", glossEN: "xylophone", glossES: 'instrumento musical con láminas de madera.', sentenceES: "Toco el xilófono en clase.", sentenceEN: "I play the xylophone in class.", category: 'music', level: 2, usefulness: 'mid', orthography: { accented: true, accentedVowels: ['ó'] }, notes: 'Letter-level: las palabras con X inicial son raras y mayoritariamente especializadas o extranjerismos; instructor puede optar por omitir o sustituir.', stage: 'published' },
  { id: "x-xenofobia", letter: "X", word: "xenofobia", syllables: "xe-no-fo-bia", glossEN: "xenophobia", glossES: 'odio y rechazo hacia personas de otras culturas.', sentenceES: "La xenofobia es un problema.", sentenceEN: "Xenophobia is a problem.", category: 'misc', level: 3, usefulness: 'low', notes: 'Vocabulario abstracto/avanzado y tema sensible; confirmar idoneidad para nivel principiante.', stage: 'published' },
  { id: "x-xirimoia", letter: "X", word: "xirimoia", syllables: "xi-ri-mo-ia", glossEN: "pawpaw", glossES: 'fruta verde y dulce de pulpa cremosa.', sentenceES: "La xirimoia es una fruta.", sentenceEN: "The pawpaw is a fruit.", category: 'food', level: 3, usefulness: 'low', notes: 'Fruta poco común; variante regional de la chirimoya — revisar si se mantiene.', stage: 'published' },
];

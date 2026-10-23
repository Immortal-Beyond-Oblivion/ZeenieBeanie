// Letter W — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "w-wifi", letter: "W", word: "wifi", syllables: "wi-fi", glossEN: "Wi-Fi", glossES: 'red de internet sin cables.', sentenceES: "Me conecto al wifi.", sentenceEN: "I connect to the wifi.", category: 'misc', level: 2, usefulness: 'mid', notes: 'Letter-level: las palabras con W son casi todas extranjerismos; instructor puede preferir limitar esta letra. Extranjerismo aceptado por la RAE.', stage: 'published' },
  { id: "w-whisky", letter: "W", word: "whisky", syllables: "whis-ky", glossEN: "whisky", glossES: 'bebida de alcohol que se bebe sola o con hielo.', sentenceES: "El whisky es una bebida.", sentenceEN: "Whisky is a drink.", category: 'food', level: 3, usefulness: 'low', notes: 'Extranjerismo; pronunciación en español incierta (whis-ky / guis-ky) — requiere decisión del instructor.', stage: 'published' },
  { id: "w-wok", letter: "W", word: "wok", syllables: "wok", glossEN: "wok", glossES: 'sartén redonda con la que se cocina al fuego.', sentenceES: "Cocino el arroz en el wok.", sentenceEN: "I cook rice in the wok.", category: 'home', level: 3, usefulness: 'low', notes: 'Extranjerismo aceptado por la RAE.', stage: 'published' },
];

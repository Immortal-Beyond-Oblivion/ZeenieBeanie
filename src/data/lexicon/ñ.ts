// Letter Ñ — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "ñ-nandu", letter: "Ñ", word: "ñandú", syllables: "ñan-dú", glossEN: "rhea", glossES: 'ave grande de América del Sur que corre rápido.', sentenceES: "El ñandú corre rápido.", sentenceEN: "The rhea runs fast.", category: 'animals', level: 3, usefulness: 'low', orthography: { accented: true, accentedVowels: ['ú'], enye: true }, notes: 'Ave sudamericana; vocabulario especializado. El vocabulario inicial con ñ es limitado: palabras como niño (ver letra N), sueño o moño contienen ñ pero empiezan con otras letras. Instructor puede sustituir.', stage: 'published' },
  { id: "ñ-name", letter: "Ñ", word: "ñame", syllables: "ña-me", glossEN: "yam", glossES: 'tubérculo dulce que se come cocido o hervido.', sentenceES: "El ñame se come hervido.", sentenceEN: "The yam is eaten boiled.", category: 'food', level: 2, usefulness: 'mid', orthography: { enye: true }, notes: 'También frecuente en Canarias y América; verificar si encaja en el registro del curso.', stage: 'published' },
  { id: "ñ-nora", letter: "Ñ", word: "ñora", syllables: "ño-ra", glossEN: "ñora pepper", glossES: 'pimiento rojo y picante típico de España.', sentenceES: "La ñora es un pimiento.", sentenceEN: "The ñora is a pepper.", category: 'food', level: 2, usefulness: 'mid', orthography: { enye: true }, notes: 'Pimiento típico de España; vocabulario regional — revisar.', stage: 'published' },
];

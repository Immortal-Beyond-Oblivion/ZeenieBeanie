// Letter Q — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "q-queso", letter: "Q", word: "queso", syllables: "que-so", glossEN: "cheese", glossES: 'alimento hecho con leche cuajada.', sentenceES: "Me gusta el queso.", sentenceEN: "I like cheese.", category: 'food', level: 1, usefulness: 'high', orthography: { accented: false }, notes: 'Letter-level: la Q aparece casi siempre con U (que, quí); instructor puede preferir otra palabra.', stage: 'published' },
  { id: "q-que", letter: "Q", word: "qué", syllables: "qué", glossEN: "what", glossES: 'palabra que usas para preguntar algo.', sentenceES: "¿Qué quieres?", sentenceEN: "What do you want?", category: 'questions', level: 2, usefulness: 'mid', orthography: { accented: true, accentedVowels: ['é'] }, notes: 'Monosílabo tónico; se usa casi siempre en preguntas — idoneidad como vocabulario de letra Q a criterio del instructor.', stage: 'published' },
  { id: "q-quien", letter: "Q", word: "quien", syllables: "quien", glossEN: "who", glossES: 'palabra que usas para preguntar por una persona.', sentenceES: "¿Quién es?", sentenceEN: "Who is it?", category: 'questions', level: 2, usefulness: 'mid', notes: 'La frase usa la forma tónica "quién" (con acento); la entrada muestra la forma base "quien".', stage: 'published' },
];

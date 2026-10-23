// Letter L — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "l-libro", letter: "L", word: "libro", syllables: "li-bro", glossEN: "book", glossES: 'conjunto de hojas escritas que se leen.', sentenceES: "Leo un libro.", sentenceEN: "I read a book.", category: 'school', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "l-lengua", letter: "L", word: "lengua", syllables: "len-gua", glossEN: "language", glossES: 'sistema de palabras que usa un país para hablar.', sentenceES: "Hablo dos lenguas.", sentenceEN: "I speak two languages.", category: 'misc', level: 1, usefulness: 'high', stage: 'published' },
  { id: "l-luna", letter: "L", word: "luna", syllables: "lu-na", glossEN: "moon", glossES: 'planeta que gira alrededor de la tierra.', sentenceES: "La luna es grande.", sentenceEN: "The moon is big.", category: 'nature', level: 2, usefulness: 'mid', stage: 'published' },
];

// Letter M — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "m-madre", letter: "M", word: "madre", syllables: "ma-dre", glossEN: "mother", glossES: 'persona que es madre de otra persona.', sentenceES: "Mi madre es amable.", sentenceEN: "My mother is kind.", category: 'family', level: 1, usefulness: 'high', stage: 'published' },
  { id: "m-mesa", letter: "M", word: "mesa", syllables: "me-sa", glossEN: "table", glossES: 'mueble con una superficie plana y patas.', sentenceES: "Pongo el libro en la mesa.", sentenceEN: "I put the book on the table.", category: 'home', level: 1, usefulness: 'high', orthography: { accented: false }, stage: 'published' },
  { id: "m-musica", letter: "M", word: "música", syllables: "mú-si-ca", glossEN: "music", glossES: 'arte de los sonidos y las canciones.', sentenceES: "La música es bonita.", sentenceEN: "The music is beautiful.", category: 'music', level: 1, usefulness: 'high', orthography: { accented: true, accentedVowels: ['ú'] }, stage: 'published' },
];

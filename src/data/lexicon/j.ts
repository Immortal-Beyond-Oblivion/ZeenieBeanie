// Letter J — reviewed vocabulary.
//
// stage: 'published' = instructor-approved (see
// content/lexicon/APPROVAL-LEDGER.md).
// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:
// grandfathered for runtime reachability, NEVER instructor-approved,
// draft pending instructor review (exact 81-id set enforced by V16).

import type { LexiconEntry } from './types';

export const entries: LexiconEntry[] = [
  { id: "j-jamon", letter: "J", word: "jamón", syllables: "ja-món", glossEN: "ham", glossES: 'carne curada de cerdo, salada y sabrosa.', sentenceES: "Me gusta el jamón.", sentenceEN: "I like ham.", category: 'food', level: 2, usefulness: 'mid', orthography: { accented: true, accentedVowels: ['ó'] }, stage: 'published' },
  { id: "j-juego", letter: "J", word: "juego", syllables: "jue-go", glossEN: "game", glossES: 'acción de jugar o de divertirse.', sentenceES: "El juego de fútbol es divertido.", sentenceEN: "The football game is fun.", category: 'actions', level: 1, usefulness: 'high', orthography: { accented: false }, notes: 'La frase del prototipo usaba la forma verbal de «jugar» («Juego al fútbol los sábados»); se reescribió para ilustrar el sustantivo «juego» (gloss: game). El instructor confirma la frase preferida.', stage: 'published' },
  { id: "j-jugo", letter: "J", word: "jugo", syllables: "ju-go", glossEN: "juice", glossES: 'bebida de fruta que se bebe con un vaso.', sentenceES: "Quiero jugo de naranja.", sentenceEN: "I want orange juice.", category: 'food', level: 2, usefulness: 'mid', notes: 'Variante regional: en España se dice "zumo".', stage: 'published' },
];

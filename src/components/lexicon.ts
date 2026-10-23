// ============================================================
// Word Detective — lexicon loader contract (Slice 004b, R3/R5;
// seam re-pointed by Slice 004c, spec §10)
//
// The game never imports the lexicon directly. It calls this
// contract instead, so:
//
//  * The lexicon reaches the game ONLY through dynamic import() —
//    per-letter modules land in async chunks, never in the initial
//    bundle (R3). `import('../data/lexicon/index')` loads only the
//    LETTER→thunk map; the letter payload loads on first use of
//    that letter.
//  * Results are memoized per call site — after the first draw
//    everything resolves synchronously from cache (R3).
//  * EXPORTED SIGNATURES ARE FROZEN [Locked — U5]:
//    `loadLetter` / `loadAllCases` / `loadGlossPool` /
//    `loadEntriesByIds` keep their exact names, parameter shapes,
//    and return types — no game-code change is ever required by
//    this slice (R5).
//  * Distractor glosses come from a compact GENERATED index (004d,
//    U5 half A): `loadGlossPool()` lazy-imports
//    `../data/lexicon/gloss-index` instead of deriving the pool from
//    every letter module, so a draw fetches the index rather than the
//    whole lexicon. The pool is still GLOBAL and still built from the
//    same runtime-reachable entries (validator V21 proves the
//    committed index equals the independent derivation).
//    **U5 half B — free-draw full-entry acquisition via
//    `loadAllCases()` — remains intentionally deferred** (004d
//    §16-D2): the free-draw deck still full-loads once per session,
//    exactly as before. This change is not that optimization.
//
// Runtime gating (004c, spec §10/V20): the loader only exposes
// `published` + the grandfathered `prototype-live` entries.
// `candidate`/`reviewed` content is filtered out here as defense
// in depth — it must never be reachable [Locked — U3+T1].
//
// Adapter: maps the native schema (LexiconEntry) onto the stable
// `VocabEntry` interface the game consumes:
//   gloss   = glossEN · sentence = sentenceES
//   syllables carried as the hyphenated string [Locked — U1]
//   orthography taken from the entry, else derived from the word
//   glossES / sentenceEN pass through; the learning panel renders
//   them only when present (prototype-live entries lack them).
//
// ⚠️ All prototype-live content remains draft-pending-instructor-
//    review — never instructor-approved.
// ============================================================

import type { LexiconEntry } from '../data/lexicon/types';

/** Orthography flags — drive the §8 micro-lesson, never keys (R14). */
export interface OrthographyFlags {
  /** á é í ó ú present — accented form of an existing vowel */
  accented?: boolean;
  /** ü present — diacritic (DPD "diéresis"), not a letter */
  diaeresis?: boolean;
  /** ñ present — its own letter of the 27-letter alphabet */
  enye?: boolean;
}

/** Stable interface the game consumes (spec §7.1, prototype subset). */
export interface VocabEntry {
  /** Stable slug, e.g. 'a-arbol' — record key for the casebook */
  id: string;
  /** A..Z | Ñ */
  letter: string;
  word: string;
  /** Syllable breakdown ("ár-bol") — hyphenated string [U1] */
  syllables: string;
  /** English translation (schema: glossEN) */
  gloss: string;
  sentence: string;
  /** Spanish gloss — filled at `published` (schema: glossES) */
  glossES?: string;
  /** English sentence translation — filled at `published` */
  sentenceEN?: string;
  orthography?: OrthographyFlags;
  reviewStatus: 'draft-pending-instructor-review';
  notes?: string;
}

/** The 27-letter Spanish alphabet (R14) — Ñ sits between N and O.
 *  Static on purpose: keycaps and casebook pages must render
 *  before any lexicon is loaded. */
export const LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;

/** Letter a record id belongs to ('ñ-ñame' → 'Ñ'). */
export function letterOfId(id: string): string {
  return id.slice(0, id.indexOf('-')).toUpperCase();
}

function orthographyOf(word: string): OrthographyFlags | undefined {
  const flags: OrthographyFlags = {};
  if (/[áéíóúÁÉÍÓÚ]/.test(word)) flags.accented = true;
  if (/ü/.test(word)) flags.diaeresis = true;
  if (/[ñÑ]/.test(word)) flags.enye = true;
  return flags.accented || flags.diaeresis || flags.enye ? flags : undefined;
}

/**
 * V20 runtime gate [Locked — U3+T1]: only `published` and the
 * grandfathered `prototype-live` entries may reach the game.
 * `candidate`/`reviewed`/`instructor-approved` never do (staging
 * lives outside the shipped import graph; this filter is the
 * belt-and-braces check inside the loader).
 */
function isRuntimeReachable(entry: LexiconEntry): boolean {
  return entry.stage === 'published' || entry.stage === 'prototype-live';
}

/** Native schema → the stable game-facing shape (M3: adapter reads
 *  native fields; id/syllables come straight from the entry). */
function toVocab(entry: LexiconEntry): VocabEntry {
  return {
    id: entry.id,
    letter: entry.letter,
    word: entry.word,
    syllables: entry.syllables,
    gloss: entry.glossEN,
    sentence: entry.sentenceES,
    glossES: entry.glossES,
    sentenceEN: entry.sentenceEN,
    orthography: entry.orthography ?? orthographyOf(entry.word),
    // Legacy literal preserved during migration (004c §5): the
    // general pipeline folds this into `stage`. Every currently
    // reachable entry is `prototype-live` (draft); when the first
    // `published` batch lands, this mapping is revisited with the
    // batch (no published entries exist yet).
    reviewStatus: 'draft-pending-instructor-review',
    notes: entry.notes,
  };
}

// ------------------------------------------------------------
// Lazy data access + memoization. Nothing here runs until the
// first draw; the LETTER→thunk map module is the only statically
// reachable lexicon code (it contains no entry payloads).
// A failed import clears its promise so the next draw retries
// (spec §7.2: failure degrades gracefully, never stalls the loop).
// ------------------------------------------------------------
type LexiconIndex = typeof import('../data/lexicon/index');

let indexPromise: Promise<LexiconIndex> | null = null;

function loadIndex(): Promise<LexiconIndex> {
  if (!indexPromise) {
    indexPromise = import('../data/lexicon/index').catch((error: unknown) => {
      indexPromise = null;
      throw error;
    });
  }
  return indexPromise;
}

const letterCache = new Map<string, VocabEntry[]>();
const letterPromises = new Map<string, Promise<VocabEntry[]>>();
let allCasesCache: VocabEntry[] | null = null;
let glossPoolCache: string[] | null = null;

/** Entries for one letter — memoized per letter (R3). */
export async function loadLetter(letter: string): Promise<VocabEntry[]> {
  const cached = letterCache.get(letter);
  if (cached) return cached;
  let promise = letterPromises.get(letter);
  if (!promise) {
    promise = (async () => {
      const index = await loadIndex();
      const thunk = index.LETTER_MODULES[letter];
      if (!thunk) return []; // unknown letter → empty (same as before)
      const { entries } = await thunk();
      return entries.filter(isRuntimeReachable).map(toVocab);
    })().catch((error: unknown) => {
      letterPromises.delete(letter); // failed import clears + retries (§7.2)
      throw error;
    });
    letterPromises.set(letter, promise);
  }
  const entries = await promise;
  letterCache.set(letter, entries);
  return entries;
}

/** Every entry, flattened — memoized (free-draw pool). */
export async function loadAllCases(): Promise<VocabEntry[]> {
  if (allCasesCache) return allCasesCache;
  const index = await loadIndex();
  const lists = await Promise.all(
    Object.keys(index.LETTER_MODULES).map((letter) => loadLetter(letter)),
  );
  allCasesCache = lists.flat();
  return allCasesCache;
}

// The generated global gloss index (004d §4.4/§4.5) — the ONLY
// lexicon module the distractor pool needs. Its promise is memoized
// exactly like `indexPromise`; a rejected import clears it so the
// next draw retries (§7.2 pattern). `glossPoolCache` below stays a
// separate, independently-written memo: it is never populated on
// failure.
type GlossIndex = typeof import('../data/lexicon/gloss-index');

let glossIndexPromise: Promise<GlossIndex> | null = null;

/** Distinct glosses — memoized GLOBAL distractor pool (004a behavior
 *  kept; never letter-scoped — Locked U11).
 *
 *  004d (U5 half A): the pool is read from the generated
 *  `GLOSS_POOL` index instead of being derived from every letter
 *  module via `loadAllCases()`. Membership, cardinality, and order
 *  are unchanged — the index is a mechanical build-time derivation
 *  of the same runtime-reachable entries (validator V21) — so
 *  `buildSlips` sees exactly the pool it saw before, and the
 *  correct-gloss exclusion stays draw-time game-side logic.
 *
 *  Failure stays loud and honest: there is deliberately NO fallback
 *  to the old all-letters derivation, so a broken or short index
 *  surfaces through the existing graceful draw path ("The case files
 *  could not be loaded — try drawing again.") instead of silently
 *  re-adding the cost this change removes. */
export async function loadGlossPool(): Promise<string[]> {
  if (glossPoolCache) return glossPoolCache;
  if (!glossIndexPromise) {
    glossIndexPromise = import('../data/lexicon/gloss-index').catch((error: unknown) => {
      glossIndexPromise = null;
      throw error;
    });
  }
  const { GLOSS_POOL } = await glossIndexPromise;
  // Corruption guard (004d §4.8): with fewer than 3 distinct
  // glosses some correct answer could not keep two DISTINCT
  // distractors. Unreachable in any verified build (V22 errors on
  // it) — this is the runtime belt-and-braces.
  if (!Array.isArray(GLOSS_POOL) || GLOSS_POOL.length < 3) {
    throw new Error(
      `gloss index unusable — ${Array.isArray(GLOSS_POOL) ? GLOSS_POOL.length : 'not an array'} gloss(es); ≥ 3 required [004d §4.8]`,
    );
  }
  glossPoolCache = GLOSS_POOL;
  return glossPoolCache;
}

/** Entries for specific record ids (casebook rows, mystery slots,
 *  the CASE CLOSED evidence page) — resolved through the per-letter
 *  loader, so only the touched letters are ever fetched. */
export async function loadEntriesByIds(ids: string[]): Promise<VocabEntry[]> {
  const letters = [...new Set(ids.map(letterOfId))];
  const lists = await Promise.all(letters.map((letter) => loadLetter(letter)));
  const wanted = new Set(ids);
  return lists.flat().filter((entry) => wanted.has(entry.id));
}

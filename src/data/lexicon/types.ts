// ============================================================
// Lexicon schema (Slice 004c — spec §5)
//
// Types only: this module has NO runtime content. It is erased at
// compile time and never pulls a payload into any bundle chunk.
//
// Pipeline states (spec §7):
//   candidate → reviewed → instructor-approved → published
//   prototype-live ···transitions through···► reviewed → …
//
// ⚠️ `prototype-live` is a GRANDFATHERED MIGRATION STATE for the
//    exact 81 existing prototype entries and nothing else
//    [Locked — U3+T1]. It confers NO approval of any kind and must
//    never be described as instructor-approved. New content is
//    never authored directly as it; the validator enforces the
//    id set exactly (V16) and forbids it growing.
//
// Fields marked "required before `published`" are optional in this
// type during migration (spec §13 M1 leaves them unset for the
// grandfathered entries) and are REQUIRED at publication by
// scripts/validate-lexicon.mjs (V4/V5/V18) — a validation
// property, enforced by the validator rather than the type.
// ============================================================

/**
 * Editorial lifecycle of one entry [Locked — U2: on-entry field].
 * Four editorial states + ONE narrowly scoped transitional state.
 */
export type LexiconStage =
  /** authored/gathered; machine-drafted content lives here by rule */
  | 'candidate'
  /** passed validation + human editorial review — NOT instructor approval */
  | 'reviewed'
  /** instructor personally signed off, recorded in the approval ledger */
  | 'instructor-approved'
  /** shipped in runtime chunks, drawable */
  | 'published'
  /**
   * TRANSITIONAL ONLY [Locked — U3+T1]: grandfathered migration
   * state for the EXISTING 81-entry prototype dataset and nothing
   * else. Not an editorial approval state; runtime may load it
   * during the transition (V20 exception); no new ids after
   * migration (V16); retired via the normal workflow.
   */
  | 'prototype-live';

/** Beginner → intermediate band (provisional taxonomy — Open U6). */
export type Level = 1 | 2 | 3;

/** Curated frequency proxy (editor-assigned; never a number — U9). */
export type Usefulness = 'high' | 'mid' | 'low';

/**
 * Thematic category (PROVISIONAL draft enum — Open U6: stays
 * provisional until instructor input before the first expansion
 * batch). Internal metadata only, never player-facing [R13].
 */
export type CategoryKey =
  | 'food' | 'animals' | 'home' | 'family' | 'body' | 'clothing'
  | 'time' | 'nature' | 'school' | 'work' | 'travel' | 'city'
  | 'feelings' | 'actions' | 'colors' | 'numbers' | 'weather'
  | 'sports' | 'music' | 'questions' | 'adjectives' | 'misc';

/** The 27-letter Spanish alphabet key [R14] — no Ch/Ll. */
export type LetterKey =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
  | 'K' | 'L' | 'M' | 'N' | 'Ñ' | 'O' | 'P' | 'Q' | 'R' | 'S'
  | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

/** Orthography facts — micro-lesson hooks, never keys [R10/R14]. */
export interface OrthographyInfo {
  /** á/é/í/ó/ú present — stress marks, not letters [R14] */
  accented?: boolean;
  /** which accented vowels appear, e.g. ['á','ó'] — micro-lesson hook */
  accentedVowels?: string[];
  /** ü present — diacritic in gue/gui, not a letter [R14] */
  diaeresis?: boolean;
  /** ñ present — its own letter of the 27 [R14] */
  enye?: boolean;
  /** word begins with a ch/ll digraph (still keyed under C/L) [R14] */
  digraph?: 'ch' | 'll';
  /** stress class: aguda / llana / esdrújula — future micro-lesson */
  stress?: 'aguda' | 'llana' | 'esdrújula';
}

export interface LexiconEntry {
  // --- identity [Locked — U12: IMMUTABLE once published] ---
  // Frozen format '{letter}-{slug}'; freely editable BEFORE
  // publication, never renamed after (letterOfId + wd-casebook-v1).
  /** e.g. 'a-arbol' — REQUIRED by letterOfId() */
  id: string;
  /** derived + validated; 27 keys only, no Ch/Ll [R14] */
  letter: LetterKey;
  /** 'árbol' — NFC, verified to exist in a reference dictionary */
  word: string;

  // --- learning content (all REQUIRED before `published`) ---
  /** 'ár-bol' — hyphenated string [Locked — U1: no string[]] */
  syllables: string;
  /** English translation of the word — required at published (V4) */
  glossEN: string;
  /** example sentence (Spanish) — required at published (V5) */
  sentenceES: string;
  /** concise Spanish meaning/definition — required at published (V4) */
  glossES?: string;
  /** English translation of the sentence — required at published (V4) */
  sentenceEN?: string;

  // --- internal metadata (never player-facing in v1) [Locked — R13] ---
  // PROVISIONAL [Open — U6]: draft enum + editor-curated usefulness
  // until instructor input before the first expansion batch.
  // Required at published (V18); unset for prototype-live (§13 M1).
  category?: CategoryKey;
  level?: Level;
  usefulness?: Usefulness;

  // --- orthography ---
  orthography?: OrthographyInfo;

  // --- pipeline bookkeeping [Locked — U2: on-entry field] ---
  stage: LexiconStage;
  /** Present only while draft: uncertainty / variant / regional flag. */
  notes?: string;
}

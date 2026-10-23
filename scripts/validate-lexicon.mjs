#!/usr/bin/env node
// ============================================================
// validate-lexicon.mjs — V1..V22 for the Slice 004c/004c+004d lexicon
// (NEW script — spec §6; runs against BOTH trees)
//
//   V1–V20  — Slice 004c, UNCHANGED by 004d.
//   V21/V22 — ADDED by Slice 004d for the generated global gloss index
//             (src/data/lexicon/gloss-index.ts). V21 re-derives the
//             expected pool from THIS script's own entry scan and
//             compares (anti-circular freshness check against
//             scripts/build-gloss-index.mjs's independent parse);
//             V22 asserts the array-of-strings shape, no duplicates,
//             ≥ 3 members, and deterministic key order.
//             No 004c rule was relaxed, renumbered, or removed.
//
//   src/data/lexicon/     runtime tree  (published + prototype-live only)
//   content/lexicon/      staging tree  (candidate/reviewed/
//                         instructor-approved; never shipped)
//
// LINEAGE [Locked — U4+U10] — documented per §6:
//   PORTED from scripts/validate-dataset.mjs (Slice 002):
//     27-key ordering with Ñ between N and O (now asserted on the
//     index.ts thunk-map key order), no Ch/Ll keys, NFC
//     normalization, ¿/¡/? balance, duplicate word/sentence
//     detection, required-field presence, draft-status marking
//     (now the `stage` field), wrong-initial-letter.
//   NEW (004c): stage machine (V16/V20), exact grandfathered
//     prototype-live id set (V16), mystery id join (V17), id format
//     contract (V14), orthography consistency (V15), metadata enums
//     (V18), gloss collisions (V13), sentence/translation joins
//     (V5/V12), punctuation/capitalization style (V7/V10),
//     syllable-string structure (V3), severity model.
//   RETIRED with the old script [R11]: the exactly-3-per-letter /
//     exactly-81 TOTAL count assertions — replaced for the
//     transition by V16's exact-id-set check on `prototype-live`
//     (identity of a known fixed set, not a per-letter quota).
//     scripts/validate-dataset.mjs itself is preserved untouched
//     as a historical record; its execution ends when its input
//     src/components/data.ts is deleted at M4 (recorded honestly,
//     not silently "fixed").
//
// SEVERITY (spec §6):
//   ERROR   — blocks (exit 1); must be fixed.
//   WARNING — printed; needs a human glance; never blocks (V13:
//             duplicate English glosses are ALWAYS a warning — U8).
//   FLAG    — routes the entry to human/editorial review; never
//             blocks, never auto-fixed, never auto-approved.
//   INFO    — printed; never a failure (V19 counts — R11).
//
// DOCUMENTED INTERPRETATIONS (spec wording vs data, resolved
// without changing any locked decision):
//   1. V7 "starts ¿ iff ends ?" is implemented as the ported
//      *balance* rule (count('¿')===count('?'), likewise ¡/!), plus
//      "starts ¿ ⇒ ends ?". The converse is not an error: the
//      grandfathered sentence "Hola, ¿cómo estás?" legitimately
//      ends in ? without starting with ¿ (its ¿/? pair balances).
//   2. V14's regex is `^(?:[a-z]|ñ)-[a-z0-9-]+$`: the spec's
//      `^[a-z]-…` omits ñ, which would fail all three grandfathered
//      Ñ ids — the frozen contract is {letter}-{slug} over the
//      27-letter alphabet [U12/R14], and letterOfId routing
//      requires the ñ prefix.
//   3. V16 "set equality — no extra ids, none missing" is enforced
//      as: prototype-live ⊆ known-81 ALWAYS (the state can never
//      grow), and every known-81 id must be present as
//      prototype-live OR legitimately retired (present as
//      `published` with a ledger sign-off). This preserves the
//      spec's retirement path (§7/§15) while freezing the set.
//   4. V11's frequency-list and profanity mechanisms are wired but
//      content-free: no frequency corpus is loaded (zero-dependency
//      by design — Open U9) and BLOCKLIST starts empty (this slice
//      generates no vocabulary/content).
//   5. V1/V2/V13 scope their duplicate checks BY TREE. The staging
//      tree and the runtime tree are two pipeline stages of the SAME
//      word (004c §7): a `candidate` entry in content/lexicon/
//      re-authors a `prototype-live` draft that still lives in
//      src/data/lexicon/ until promotion copies it across. Such a
//      pair is a RE-AUTHORING PAIR and is the only cross-tree
//      duplication the pipeline allows:
//
//        same id  AND  runtime.stage === 'prototype-live'
//                   AND  staging.stage ∈ {candidate, reviewed}
//
//      Nothing else is relaxed: a duplicate id or word WITHIN a tree
//      is still an error, a staging entry may not shadow a
//      `published` runtime entry (shipped content is immutable — it is
//      replaced by promotion, never shadowed from staging), and a
//      staging word colliding with a DIFFERENT runtime word is still
//      an error. This is a scoping correction, not a relaxation: the
//      old cross-tree rule made the documented prototype-live →
//      candidate transition impossible to express.
//
// Usage:
//   node scripts/validate-lexicon.mjs            → validate (default)
//   node scripts/validate-lexicon.mjs --review   → validate + print the
//        reviewer worksheet: every runtime-reachable entry that carries
//        a `notes` field, grouped by letter, with a count and the
//        instructions for recording a decision. `--review` runs EVERY
//        rule above unchanged and does not alter the exit code.
// ============================================================

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ------------------------------------------------------------
// CLI
// ------------------------------------------------------------
const ARGS = process.argv.slice(2);
const REVIEW_MODE = ARGS.includes('--review');
const UNKNOWN_ARGS = ARGS.filter((a) => a !== '--review');
if (UNKNOWN_ARGS.length) {
  console.error(`validate-lexicon: unknown argument(s): ${UNKNOWN_ARGS.join(', ')}`);
  console.error('usage: node scripts/validate-lexicon.mjs [--review]');
  process.exit(2);
}

const LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];
const STAGES = [
  'candidate', 'reviewed', 'instructor-approved', 'published', 'prototype-live',
];
const RUNTIME_STAGES = new Set(['published', 'prototype-live']); // V20
const LEDGER = join(ROOT, 'content/lexicon/APPROVAL-LEDGER.md');

// V16 — the frozen known migrated 81-entry id set (004c §13 M1).
// Never edited after migration: new prototype-live ids are an error.
const KNOWN_PROTOTYPE_IDS = new Set([
  'a-agua', 'a-amiga', 'a-arbol', 'b-barco', 'b-beso', 'b-bueno',
  'c-casa', 'c-cielo', 'c-comida', 'd-dedo', 'd-dia', 'd-dos',
  'e-escuela', 'e-espanol', 'e-estrella', 'f-flor', 'f-fruta', 'f-fuego',
  'g-gato', 'g-gracias', 'g-guitarra', 'h-hambre', 'h-hoja', 'h-hola',
  'i-idea', 'i-invierno', 'i-isla', 'j-jamon', 'j-juego', 'j-jugo',
  'k-kilo', 'k-kiosco', 'k-kiwi', 'l-lengua', 'l-libro', 'l-luna',
  'm-madre', 'm-mesa', 'm-musica', 'n-nino', 'n-nombre', 'n-nube',
  'o-ojo', 'o-oro', 'o-oveja', 'p-pan', 'p-perro', 'p-playa',
  'q-que', 'q-queso', 'q-quien', 'r-raton', 'r-reloj', 'r-rosa',
  's-semana', 's-silla', 's-sol', 't-tarde', 't-taza', 't-tiempo',
  'u-uniforme', 'u-universo', 'u-uva', 'v-vaso', 'v-verde', 'v-viaje',
  'w-whisky', 'w-wifi', 'w-wok', 'x-xenofobia', 'x-xilofono',
  'x-xirimoia', 'y-yo', 'y-yoga', 'y-yogur', 'z-zapato', 'z-zona',
  'z-zorro', 'ñ-name', 'ñ-nandu', 'ñ-nora',
]);

const CATEGORIES = new Set([
  'food', 'animals', 'home', 'family', 'body', 'clothing',
  'time', 'nature', 'school', 'work', 'travel', 'city',
  'feelings', 'actions', 'colors', 'numbers', 'weather',
  'sports', 'music', 'questions', 'adjectives', 'misc',
]);
const LEVELS = new Set([1, 2, 3]);
const USEFULNESS = new Set(['high', 'mid', 'low']);
// V11 mechanism; empty on purpose — this slice authors no content.
const BLOCKLIST = [];

// ------------------------------------------------------------
// severity buckets
// ------------------------------------------------------------
const errors = [];
const warnings = [];
const flags = [];
const infos = [];
const error = (rule, msg) => errors.push(`[${rule}] ${msg}`);
const warning = (rule, msg) => warnings.push(`[${rule}] ${msg}`);
const flag = (rule, msg) => flags.push(`[FLAG ${rule}] ${msg}`);
const info = (rule, msg) => infos.push(`[${rule}] ${msg}`);

// ------------------------------------------------------------
// tiny TS-module evaluator (same technique as validate-dataset.mjs:
// strip comments/imports/type annotations, then eval)
// ------------------------------------------------------------
function evalEntryArray(file, label) {
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch (e) {
    error('LOAD', `${label}: unreadable — ${e.message}`);
    return [];
  }
  const cleaned = src
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*import[^\n]*$/gm, '');
  const m = cleaned.match(/export\s+const\s+\w+\s*(?::[^=]+)?=\s*([\s\S]*?)\s*;?\s*$/);
  if (!m) {
    error('LOAD', `${label}: no "export const … = [ … ]" entry array found`);
    return [];
  }
  try {
    const value = new Function(`return (${m[1]});`)();
    if (!Array.isArray(value)) throw new Error('not an array');
    return value;
  } catch (e) {
    error('LOAD', `${label}: unparseable — ${e.message}`);
    return [];
  }
}

function readText(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}

// ------------------------------------------------------------
// load both trees
// ------------------------------------------------------------
const runtimeDir = join(ROOT, 'src/data/lexicon');
const stagingDir = join(ROOT, 'content/lexicon');

/** @type {{letter: string, entry: any}[]} */
const runtime = [];
const staging = [];

for (const letter of LETTERS) {
  const file = join(runtimeDir, `${letter.toLowerCase()}.ts`);
  if (!existsSync(file)) {
    error('LOAD', `runtime letter module missing: ${letter.toLowerCase()}.ts`);
    continue;
  }
  evalEntryArray(file, `src/data/lexicon/${letter.toLowerCase()}.ts`)
    .forEach((entry) => runtime.push({ letter, entry }));
}
if (existsSync(stagingDir)) {
  for (const name of readdirSync(stagingDir).sort()) {
    if (!/^[a-zñ]\.ts$/.test(name)) continue;
    const letter = name[0].toUpperCase();
    evalEntryArray(join(stagingDir, name), `content/lexicon/${name}`)
      .forEach((entry) => staging.push({ letter, entry }));
  }
}

const all = [...runtime, ...staging];
const ledgerText = readText(LEDGER);

// ------------------------------------------------------------
// structural pre-checks (ported: 27 keys, order, no Ch/Ll)
// ------------------------------------------------------------
const indexSrc = readText(join(runtimeDir, 'index.ts')) ?? '';
const mapKeys = [...indexSrc.matchAll(/^\s*('?)([A-ZÑ])\1\s*:\s*\(\)\s*=>\s*import/gm)]
  .map((m) => m[2]);
if (mapKeys.length !== LETTERS.length) {
  error('V-index', `index.ts thunk map: expected ${LETTERS.length} keys, got ${mapKeys.length}`);
} else if (JSON.stringify(mapKeys) !== JSON.stringify(LETTERS)) {
  error('V-index', `index.ts key order mismatch.\n  expected: ${LETTERS.join(' ')}\n  actual:   ${mapKeys.join(' ')}`);
}
for (const bad of ['Ch', 'Ll', 'LL', 'ch', 'll']) {
  if (mapKeys.includes(bad)) error('V9', `standalone "${bad}" key present (not allowed)`);
}

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------
const nfc = (s) => s.normalize('NFC');
const normKey = (s) => nfc(s).toLowerCase();
const stripAccents = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const softNorm = (s) => stripAccents(nfc(s)).toLowerCase();
const TEXT_FIELDS = ['id', 'word', 'syllables', 'glossEN', 'sentenceES', 'glossES', 'sentenceEN', 'notes'];
const letterOfId = (id) => id.slice(0, id.indexOf('-')).toUpperCase();

// ------------------------------------------------------------
// V1 duplicate ids · V2 duplicate words — scoped BY TREE
//
// See header interpretation 5: a staging entry may RE-AUTHOR a
// runtime `prototype-live` draft (same id) — that pair is one word
// seen at two pipeline stages, not a duplicate. Every other
// duplication is still an error.
// ------------------------------------------------------------
const runtimeById = new Map();
for (const { entry } of runtime) {
  if (!runtimeById.has(entry.id)) runtimeById.set(entry.id, entry);
}

const REAUTHORING_STAGES = new Set(['candidate', 'reviewed']);
const reAuthoringIds = new Set();
for (const { letter, entry } of staging) {
  if (typeof entry.id !== 'string') continue;
  const runtimeEntry = runtimeById.get(entry.id);
  if (!runtimeEntry) continue;
  const where = `${letter}/${entry.id}`;
  if (runtimeEntry.stage === 'prototype-live' && REAUTHORING_STAGES.has(entry.stage)) {
    reAuthoringIds.add(entry.id);
  } else {
    error(
      'V1',
      `${where}: staging id "${entry.id}" shadows a runtime entry at stage "${runtimeEntry.stage}" — ` +
        'only a prototype-live draft may be re-authored from staging; published content is replaced by promotion, never shadowed [U3+T1]',
    );
  }
}

const ids = new Map();
const words = new Map();
for (const [tree, list] of [['runtime', runtime], ['staging', staging]]) {
  for (const { letter, entry } of list) {
    const where = `${letter}/${entry.id ?? entry.word ?? '?'}`;
    if (typeof entry.id === 'string') {
      const key = `${tree}::${entry.id}`;
      if (ids.has(key)) error('V1', `duplicate id "${entry.id}" (${ids.get(key)} and ${where})`);
      else ids.set(key, where);
    }
    if (typeof entry.word === 'string') {
      const key = `${tree}::${normKey(entry.word)}`;
      if (words.has(key)) error('V2', `duplicate word "${entry.word}" (${words.get(key)} and ${where})`);
      else words.set(key, where);
    }
  }
}
// cross-tree word collisions: allowed ONLY for a re-authoring pair
for (const { letter, entry } of staging) {
  if (typeof entry.word !== 'string') continue;
  const key = normKey(entry.word);
  for (const { letter: rLetter, entry: rEntry } of runtime) {
    if (typeof rEntry.word !== 'string' || normKey(rEntry.word) !== key) continue;
    if (rEntry.id !== entry.id || !reAuthoringIds.has(entry.id)) {
      error(
        'V2',
        `duplicate word "${entry.word}" (${rLetter}/${rEntry.id} and ${letter}/${entry.id}) — ` +
          'a staged word may only repeat a runtime word when it is a re-authoring pair (same id, prototype-live → candidate/reviewed)',
      );
    }
  }
}

// ------------------------------------------------------------
// per-entry content rules
// ------------------------------------------------------------
for (const { letter, entry } of all) {
  const where = `${letter}/${entry.id ?? entry.word ?? '<unknown>'}`;
  const isPublished = entry.stage === 'published';

  // --- required-field presence (ported + V4/V5/V18 at published) ---
  for (const field of ['id', 'letter', 'word', 'syllables', 'glossEN', 'sentenceES', 'stage']) {
    const v = entry[field];
    if (typeof v !== 'string' || v.trim() === '') {
      error('V4', `${where}: required field "${field}" missing/empty`);
    }
  }
  if (isPublished) {
    for (const field of ['glossES', 'sentenceEN']) {
      const v = entry[field];
      if (typeof v !== 'string' || v.trim() === '') {
        error('V4', `${where}: published entry missing "${field}"`);
      }
    }
    for (const field of ['category', 'level', 'usefulness']) {
      if (entry[field] === undefined) {
        error('V18', `${where}: published entry missing required metadata "${field}"`);
      }
    }
  }

  // --- V3 syllable structure [U1: hyphenated string] ---
  const syl = entry.syllables;
  if (typeof syl === 'string' && syl.trim() !== '') {
    if (syl !== nfc(syl)) error('V6', `${where}: syllables not NFC`);
    if (syl.includes(' ')) error('V3', `${where}: syllables contains a space: "${syl}"`);
    const segs = syl.split('-');
    if (segs.length < 1 || segs.some((s) => s === '')) {
      error('V3', `${where}: empty syllable segment in "${syl}"`);
    }
    if (typeof entry.word === 'string') {
      const w = nfc(entry.word);
      const wordChars = new Set([...w]);
      const bad = [...new Set([...nfc(syl)].filter((c) => c !== '-' && !wordChars.has(c)))];
      if (bad.length) error('V3', `${where}: syllables "${syl}" uses chars absent from word "${w}": ${bad.join(' ')}`);
      const accented = (s) => [...s].filter((c) => 'áéíóú'.includes(c)).sort().join('');
      if (accented(syl) !== accented(w)) {
        error('V3', `${where}: accented-vowel multiset differs — word "${w}" vs syllables "${syl}"`);
      }
    }
  }

  // --- V6 NFC on every text field; stray combining marks in word/syllables ---
  for (const f of TEXT_FIELDS) {
    const v = entry[f];
    if (typeof v === 'string' && v !== nfc(v)) {
      error('V6', `${where}: field "${f}" is not NFC-normalized`);
    }
  }
  for (const f of ['word', 'syllables']) {
    const v = entry[f];
    if (typeof v === 'string' && /[\u0300-\u036f]/.test(nfc(v))) {
      error('V6', `${where}: stray combining mark in "${f}"`);
    }
  }

  // --- V7 punctuation / balance (see interpretation 1 in header) ---
  const sent = entry.sentenceES;
  if (typeof sent === 'string' && sent !== '') {
    const count = (ch) => [...sent].filter((c) => c === ch).length;
    if (count('¿') !== count('?')) error('V7', `${where}: ¿/? unbalanced in "${sent}"`);
    if (count('¡') !== count('!')) error('V7', `${where}: ¡/! unbalanced in "${sent}"`);
    if (sent.startsWith('¿') && !sent.endsWith('?')) {
      error('V7', `${where}: starts with ¿ but does not end with ?`);
    }
    if (sent.startsWith('¡') && !sent.endsWith('!')) {
      error('V7', `${where}: starts with ¡ but does not end with !`);
    }
    for (const [open, close] of [['«', '»'], ['“', '”']]) {
      if (count(open) !== count(close)) error('V7', `${where}: unbalanced ${open}${close} quotes`);
    }
    if (/\s$/.test(sent)) error('V7', `${where}: trailing whitespace`);
    if (/  /.test(sent)) error('V7', `${where}: double space`);
    if (!/[.?!…]$/.test(sent)) error('V7', `${where}: sentence lacks terminal punctuation`);
  }

  // --- V8 wrong initial letter (case-folded; accents fold to their
  //     base vowel, ñ stays its own letter [R14]) ---
  if (typeof entry.word === 'string' && typeof entry.letter === 'string') {
    const fold = (c) => c.toLowerCase().replace(/[áéíóú]/g, (m) =>
      ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }[m]));
    const first = fold(nfc(entry.word)[0]);
    if (first !== entry.letter.toLowerCase()) {
      error('V8', `${where}: word "${entry.word}" starts with "${first}", declared letter "${entry.letter}"`);
    }
  }

  // --- V9 ch/ll assignment + id prefix ---
  if (typeof entry.word === 'string') {
    const w = normKey(entry.word);
    if (w.startsWith('ch') && letter !== 'C') error('V9', `${where}: "ch…" word not under C`);
    if (w.startsWith('ll') && letter !== 'L') error('V9', `${where}: "ll…" word not under L`);
    if (typeof entry.id === 'string' && /^(ch|ll)-/.test(entry.id)) {
      error('V9', `${where}: id uses forbidden ch-/ll- prefix`);
    }
  }

  // --- V10 capitalization (gloss exceptions are FLAGs — see header) ---
  if (typeof entry.word === 'string' && entry.word !== normKey(entry.word) &&
      entry.word !== entry.word.toLocaleLowerCase('es')) {
    flag('V10', `${where}: word "${entry.word}" is not lowercase (proper noun? confirm)`);
  }
  if (typeof sent === 'string' && sent !== '') {
    const firstLetter = nfc(sent).replace(/^[¿¡“«"' ]*/, '')[0];
    if (firstLetter && firstLetter !== firstLetter.toUpperCase()) {
      error('V10', `${where}: sentence does not start with an uppercase letter: "${sent}"`);
    }
  }
  for (const f of ['glossES', 'glossEN']) {
    const v = entry[f];
    if (typeof v === 'string' && v !== '' && /[A-ZÁÉÍÓÚÑ]/.test(v[0])) {
      flag('V10', `${where}: ${f} "${v}" starts uppercase (style exception? confirm)`);
    }
  }

  // --- V11 mechanical proxies (no corpus — see header) ---
  if (entry.level === 1 && entry.usefulness === 'low') {
    flag('V11', `${where}: level 1 with usefulness low — confirm`);
  }
  if (typeof entry.word === 'string') {
    for (const term of BLOCKLIST) {
      if (normKey(entry.word) === term) flag('V11', `${where}: blocklist hit "${term}"`);
    }
  }

  // --- V12 sentence/translation joins (entries that HAVE sentenceEN) ---
  if (typeof entry.sentenceEN === 'string' && entry.sentenceEN !== '' && typeof sent === 'string') {
    const digitsES = sent.match(/\d+/g) ?? [];
    const digitsEN = entry.sentenceEN.match(/\d+/g) ?? [];
    for (const d of digitsES) {
      if (!digitsEN.includes(d)) error('V12', `${where}: numeral ${d} missing from sentenceEN`);
    }
    // proper nouns: capitalized tokens AFTER the sentence opener —
    // sentence-initial words are capitalized by rule, not proper.
    const midSent = nfc(sent).replace(/^[¿¡]?\s*[A-ZÁÉÍÓÚÑ][\wáéíóúñ]*/, '');
    const properES = midSent.match(/[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+/g) ?? [];
    for (const p of properES) {
      if (!softNorm(entry.sentenceEN).includes(softNorm(p))) {
        error('V12', `${where}: proper noun "${p}" missing from sentenceEN`);
      }
    }
    const ratio = nfc(sent).length / Math.max(1, nfc(entry.sentenceEN).length);
    if (ratio < 0.5 || ratio > 2.2) {
      flag('V12', `${where}: ES/EN length ratio ${ratio.toFixed(2)} outside sanity band`);
    }
  }

  // --- V13 duplicate English glosses — WARNING always [Locked — U8] ---
  // (collected below, grouped)

  // --- V14 id format [Locked — U12, frozen contract] ---
  if (typeof entry.id === 'string') {
    if (!/^(?:[a-z]|ñ)-[a-z0-9-]+$/.test(entry.id)) {
      error('V14', `${where}: id "${entry.id}" fails {letter}-{slug} format`);
    } else if (letterOfId(entry.id) !== letter) {
      error('V14', `${where}: letterOfId("${entry.id}") = "${letterOfId(entry.id)}" ≠ file letter "${letter}"`);
    }
  }

  // --- V15 orthography consistency (only when authored) ---
  if (entry.orthography && typeof entry.word === 'string') {
    const o = entry.orthography;
    const word = nfc(entry.word);
    const accentedVowels = [...new Set([...word].filter((c) => 'áéíóú'.includes(c)))];
    if (Boolean(o.accented) !== (accentedVowels.length > 0)) {
      error('V15', `${where}: accented flag inconsistent with word "${word}"`);
    }
    if (o.accentedVowels && JSON.stringify([...o.accentedVowels].sort()) !== JSON.stringify(accentedVowels.sort())) {
      error('V15', `${where}: accentedVowels mismatch`);
    }
    if (Boolean(o.diaeresis) !== word.includes('ü')) error('V15', `${where}: diaeresis flag inconsistent`);
    if (Boolean(o.enye) !== word.includes('ñ')) error('V15', `${where}: enye flag inconsistent`);
    if (o.digraph) {
      const w = normKey(word);
      if (!w.startsWith(o.digraph)) error('V15', `${where}: digraph "${o.digraph}" inconsistent with word start`);
    }
  }

  // --- V16 stage validity + prototype-live rules + ledger join ---
  if (!STAGES.includes(entry.stage)) {
    error('V16', `${where}: invalid stage "${entry.stage}"`);
  }
  if (entry.stage === 'prototype-live') {
    if (!KNOWN_PROTOTYPE_IDS.has(entry.id)) {
      error('V16', `${where}: prototype-live id "${entry.id}" NOT in the grandfathered set — no new prototype-live ids [U3+T1]`);
    }
    if (staging.some((s) => s.entry === entry)) {
      error('V16', `${where}: prototype-live may not live in staging — grandfathered runtime set only`);
    }
  }
  if (entry.stage === 'instructor-approved' || isPublished) {
    if (ledgerText === null) {
      error('V16', `${where}: stage "${entry.stage}" but approval ledger file is missing`);
    } else if (!ledgerText.includes(entry.id)) {
      error('V16', `${where}: stage "${entry.stage}" but ledger does not record id "${entry.id}"`);
    }
  }
}

// V16 "none missing": every known id is still prototype-live or
// legitimately retired (published, with ledger — checked above).
// runtimeById is built above (V1/V2 section).
for (const id of KNOWN_PROTOTYPE_IDS) {
  const entry = runtimeById.get(id);
  if (!entry) {
    error('V16', `grandfathered id "${id}" missing from the runtime tree`);
  } else if (entry.stage !== 'prototype-live' && entry.stage !== 'published') {
    error('V16', `grandfathered id "${id}" has stage "${entry.stage}" — may only retire via promotion to published [U3+T1]`);
  }
}

// ------------------------------------------------------------
// V13 grouped gloss collisions — WARNING [Locked — U8]
//
// Scoped like V1/V2: a gloss shared by a RE-AUTHORING PAIR is one
// word at two pipeline stages, not a distractor ambiguity, so it is
// not reported. Every other shared gloss still is (it becomes an
// ambiguous distractor the moment the staged entry is promoted).
// ------------------------------------------------------------
const glossGroups = new Map();
const addGloss = (gloss, id, tree) => {
  if (typeof gloss !== 'string' || gloss === '') return;
  if (!glossGroups.has(gloss)) glossGroups.set(gloss, []);
  glossGroups.get(gloss).push({ id, tree });
};
for (const { entry } of runtime) addGloss(entry.glossEN, entry.id, 'runtime');
for (const { entry } of staging) addGloss(entry.glossEN, entry.id, 'staging');
for (const [gloss, members] of glossGroups) {
  if (members.length < 2) continue;
  const runtimeMembers = members.filter((m) => m.tree === 'runtime');
  const stagingMembers = members.filter((m) => m.tree === 'staging');
  const idList = members.map((m) => m.id);
  if (runtimeMembers.length > 1 || stagingMembers.length > 1) {
    warning('V13', `duplicate glossEN "${gloss}" shared by ${idList.join(', ')} (distractor ambiguity — human glance, never an error)`);
  } else if (runtimeMembers[0].id !== stagingMembers[0].id || !reAuthoringIds.has(runtimeMembers[0].id)) {
    warning('V13', `duplicate glossEN "${gloss}" shared by ${idList.join(', ')} (distractor ambiguity — human glance, never an error)`);
  }
}

// ------------------------------------------------------------
// V17 mystery id integrity — every caseIds entry resolves to a
// runtime-reachable (published or prototype-live) entry
// ------------------------------------------------------------
const mysterySrc = readText(join(ROOT, 'src/components/mysteries.ts'));
if (mysterySrc === null) {
  error('V17', 'src/components/mysteries.ts missing');
} else {
  /* Every dossier's caseIds block, not just the first. The previous
     single-match form only validated one mystery, so a typo in any
     other dossier's ids would ship a blank slot unnoticed. */
  const blocks = [...mysterySrc.matchAll(/caseIds:\s*\[([^\]]*)\]/gs)];
  if (blocks.length === 0) error('V17', 'no caseIds found in mysteries.ts');

  let total = 0;
  blocks.forEach((block, i) => {
    const ids = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    if (ids.length === 0) error('V17', `dossier ${i + 1} has an empty caseIds list`);
    for (const id of ids) {
      const entry = runtimeById.get(id);
      if (!entry) error('V17', `dossier ${i + 1}: mystery id "${id}" does not resolve to any runtime entry`);
      else if (!RUNTIME_STAGES.has(entry.stage)) {
        error('V17', `dossier ${i + 1}: mystery id "${id}" has non-runnable stage "${entry.stage}"`);
      }
    }
    total += ids.length;
  });

  info('V17', `${total} mystery ids across ${blocks.length} dossier(s) resolve (published or prototype-live)`);
}

// ------------------------------------------------------------
// V19 per-letter counts — INFO only [R11: never a failure]
// ------------------------------------------------------------
for (const letter of LETTERS) {
  const r = runtime.filter((e) => e.letter === letter).length;
  const s = staging.filter((e) => e.letter === letter).length;
  if (r || s) info('V19', `${letter}: runtime ${r}, staging ${s}`);
}
const protoCount = runtime.filter((e) => e.entry.stage === 'prototype-live').length;
info('V19', `totals — runtime ${runtime.length}, staging ${staging.length}, prototype-live backlog ${protoCount}`);

// ------------------------------------------------------------
// V20 draft exposure — no candidate/reviewed (or instructor-approved)
// content in the shipped tree; staging never imported by src/
// ------------------------------------------------------------
for (const { letter, entry } of runtime) {
  if (!RUNTIME_STAGES.has(entry.stage)) {
    error('V20', `src/data/lexicon/${letter.toLowerCase()}.ts: stage "${entry.stage}" (${entry.id}) is runtime-exposed — only published + prototype-live may ship [U3+T1]`);
  }
}
// import-graph scan: nothing under src/ may reference content/
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) out.push(p);
  }
  return out;
}
for (const file of walk(join(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf8');
  const specs = [...text.matchAll(/(?:from\s+|import\s*\(?\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
  for (const spec of specs) {
    if (spec.includes('content/')) {
      error('V20', `${file}: imports staging path "${spec}" — staging must stay outside the shipped import graph [U3+T1]`);
    }
  }
}
info('V20', `runtime stages present: ${[...new Set(runtime.map((e) => e.entry.stage))].join(', ') || '(none)'}`);

// ------------------------------------------------------------
// V21/V22 — 004d: the generated global gloss index must equal the
// pool derived from this script's OWN scan of the runtime entries
// (independent of scripts/build-gloss-index.mjs, which parses the
// letter modules with its own copy of the technique) — a stale or
// hand-edited index cannot pass.
// ------------------------------------------------------------
const GLOSS_INDEX_FILE = join(runtimeDir, 'gloss-index.ts');

// Expected pool: runtime entries in letter-key order, file order
// within a letter, V20 stage filter, dedupe by first appearance —
// the same membership the runtime derivation produced.
const expectedPool = [];
{
  const seenGloss = new Set();
  for (const { entry } of runtime) {
    if (!RUNTIME_STAGES.has(entry.stage)) continue;
    const gloss = entry.glossEN;
    if (typeof gloss !== 'string' || gloss === '') continue;
    if (!seenGloss.has(gloss)) {
      seenGloss.add(gloss);
      expectedPool.push(gloss);
    }
  }
}

let indexPool = null;
if (!existsSync(GLOSS_INDEX_FILE)) {
  error('V21', 'src/data/lexicon/gloss-index.ts is missing — generate it with: node scripts/build-gloss-index.mjs');
} else {
  const parsed = evalEntryArray(GLOSS_INDEX_FILE, 'src/data/lexicon/gloss-index.ts');
  if (!Array.isArray(parsed) || parsed.length === 0) {
    error('V21', 'gloss-index.ts did not yield a non-empty GLOSS_POOL array');
  } else {
    indexPool = parsed;
    // --- V22 shape/semantics ---
    if (!indexPool.every((value) => typeof value === 'string')) {
      error('V22', 'gloss-index.ts contains a non-string element (strings only — buildSlips samples by gloss text alone)');
    }
    const duplicates = indexPool.filter((value, i) => indexPool.indexOf(value) !== i);
    if (duplicates.length) {
      error('V22', `gloss-index.ts contains duplicate gloss(es): ${[...new Set(duplicates)].join(', ')} (buildSlips needs two DISTINCT distractors) [004d §4.7]`);
    }
    if (indexPool.length < 3) {
      error('V22', `gloss-index.ts has ${indexPool.length} gloss(es); ≥ 3 required so any correct gloss still leaves 2 distinct distractors [004d §4.8]`);
    }
    // --- V21 freshness + deterministic order ---
    if (JSON.stringify(indexPool) !== JSON.stringify(expectedPool)) {
      const sameMembers =
        indexPool.length === expectedPool.length &&
        indexPool.every((value) => expectedPool.includes(value));
      if (sameMembers) {
        error('V22', 'gloss-index.ts has the right members in the WRONG order — deterministic key order (A…N, Ñ, O…Z) is required [004d §4.1]');
      } else {
        const missing = expectedPool.filter((value) => !indexPool.includes(value));
        const extra = indexPool.filter((value) => !expectedPool.includes(value));
        error('V21', `gloss-index.ts is stale or hand-edited — regenerate with: node scripts/build-gloss-index.mjs (missing: ${missing.slice(0, 6).join(', ') || 'none'}; unexpected: ${extra.slice(0, 6).join(', ') || 'none'})`);
      }
    }
  }
}
info('V21', `gloss index: committed ${indexPool ? indexPool.length : 'n/a'} gloss(es); independently derived ${expectedPool.length}`);

// ------------------------------------------------------------
// --review — the reviewer worksheet generator
//
// Prints every RUNTIME-REACHABLE entry that carries a `notes` field,
// grouped by letter: word, id, letter, English gloss, note. Staging
// entries are not listed — a staged candidate is not yet part of the
// shipped vocabulary and its own notes belong to the staged batch.
// ------------------------------------------------------------
function printReviewWorksheet() {
  const flagged = runtime.filter(
    ({ entry }) =>
      RUNTIME_STAGES.has(entry.stage) &&
      typeof entry.notes === 'string' &&
      entry.notes.trim() !== '',
  );
  const rule = '═'.repeat(72);
  console.log('');
  console.log(rule);
  console.log(' REVIEW WORKSHEET — runtime entries carrying a `notes` field');
  console.log(rule);
  console.log(
    ` ${flagged.length} of ${runtime.length} runtime-reachable entries are flagged for human review.`,
  );
  console.log(' Grouped by letter — word · id · letter · English gloss · note.');
  console.log('');
  for (const letter of LETTERS) {
    const rows = flagged.filter((r) => r.letter === letter);
    if (rows.length === 0) continue;
    console.log(`── ${letter} ${'─'.repeat(60)} ${rows.length} flagged`);
    for (const { entry } of rows) {
      console.log(
        `   ${String(entry.word).padEnd(14)} ${String(entry.id).padEnd(14)} ${letter.padEnd(3)} ${entry.glossEN}`,
      );
      console.log(`       note: ${entry.notes}`);
    }
    console.log('');
  }
  console.log(`TOTAL: ${flagged.length} runtime-reachable entries carry a \`notes\` field.`);
  console.log('');
  console.log(' HOW TO RECORD A DECISION');
  console.log('   1. Open content/lexicon/LEGACY-81-ENTRIES-REVIEW.md and find the row');
  console.log('      for the word (the worksheet lists all 81 grandfathered entries,');
  console.log('      grouped by letter).');
  console.log('   2. Fill in that row\'s *Decision* column with exactly one of:');
  console.log('        keep            — the entry stays as it is');
  console.log('        drop            — the entry is retired (it leaves the lexicon only');
  console.log('                         through the approval ledger)');
  console.log('        change: <text>  — the entry is edited; describe the change');
  console.log('   3. Leave the Word / Gloss / Pronunciation / Example-sentence columns');
  console.log('      alone — they are the record of what the prototype build shipped.');
  console.log('   4. Do NOT edit any script, and do NOT clear the `notes` field in');
  console.log('      src/data/lexicon/. The worksheet is free-form by design: the');
  console.log('      bundle gate checks its STRUCTURE (27 letter sections, the same 81');
  console.log('      words under the same letters, the uncertainty notes still');
  console.log('      present, decisions drawn from the list above) — not its bytes.');
  console.log('   5. Re-run `node scripts/validate-lexicon.mjs --review` to see what is');
  console.log('      still flagged. An entry stays on this list until its uncertainty is');
  console.log('      resolved AND its decision is recorded in the worksheet.');
  console.log('');
}

// ------------------------------------------------------------
// report
// ------------------------------------------------------------
console.log(`validate-lexicon: runtime ${runtime.length}, staging ${staging.length} (V1–V22)`);
for (const line of infos) console.log(`  INFO   ${line}`);
for (const line of warnings) console.log(`  WARN   ${line}`);
for (const line of flags) console.log(`  FLAG   ${line}`);
if (REVIEW_MODE) printReviewWorksheet();
if (errors.length) {
  for (const line of errors) console.error(`  ERROR  ${line}`);
  console.error(`FAIL — ${errors.length} error(s).`);
  process.exit(1);
}
console.log(
  `PASS — 0 errors (${warnings.length} warning(s), ${flags.length} flag(s)). ` +
  'Validation does NOT imply linguistic correctness; approval is a human act (004c §7).',
);

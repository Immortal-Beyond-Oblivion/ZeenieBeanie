#!/usr/bin/env node
// ============================================================
// lexicon-bundle-check.mjs — Slice 004c §12b bundle assertions
// (+ the §12b loader-contract greps and historical-record guards).
//
// Run AFTER `npm run build`. Errors on:
//   * any lexicon payload sentinel from any letter found in the
//     initial bundle (R3 at scale — letter content must only ever
//     arrive via its async chunk);
//   * a letter chunk or the thunk-map chunk referenced by
//     dist/index.html (script/modulepreload) — they must load on
//     demand only;
//   * fewer/more than 27 letter chunks reachable from the thunk map;
//   * a game component statically importing the lexicon payload, or
//     lexicon.ts value-importing it statically (signatures frozen
//     [U5] — only dynamic import() may reach payloads);
//   * the frozen loader-contract lines drifting [Locked — U5];
//   * (004d, additive) the generated gloss index not shipping as its
//     OWN async chunk, being statically imported anywhere, being
//     preloaded in index.html, or leaking gloss sentinels into the
//     initial bundle;
//   * the 81-entry review data corrupted — the worksheet
//     content/lexicon/LEGACY-81-ENTRIES-REVIEW.md is a free-form
//     WORKSHEET (its *Decision* column is where review decisions are
//     recorded), so it is checked STRUCTURALLY against the immutable
//     snapshot content/lexicon/REVIEW-BASELINE.json [Locked — U4+U10]
//   * initial bundle growing beyond the documented baseline + 5 kB
//     (sentinels are the primary gate; baseline documented at 004c
//     M4 in state.md — raise deliberately with a note when app code
//     legitimately grows).
//
// Prints per-letter chunk sizes + total lexicon weight as INFO
// (also the measurement base for any future Open-U5 discussion).
//
// Sentinel exclusion: a sentinel appearing in authored static game
// source (mysteries.ts dossier prose [R4]) is excluded with an INFO
// note — that text is static by design; every OTHER sentinel must
// be absent from the initial bundle.
//
// Usage: node scripts/lexicon-bundle-check.mjs
// ============================================================

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'dist/assets');
const LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

// Documented initial-bundle baseline.
//
// HISTORY
//   219_500  set at 004c M4, when the initial bundle was the game
//            and nothing else.
//   raised   during the 2026-10-20 shell rebuild, deliberately, with
//            the growth attributed below. The bundle grew because the
//            site gained real features; none of it is lexicon content.
//
//   Measured growth, initial JS bundle (uncompressed):
//     219_552  pre-sprint baseline — game only
//       +819  hero rebuild
//       +209  About / Classes / Contact / Footer (lazily loaded, so
//             only the loader and the anchors land in the entry)
//     +1_351  site-wide accessibility pass (skip link, aria labels)
//     +1_481  game correctness — verdict copy, loading state, error
//             state, modal key isolation
//       +250  starter dossier brought in line with the new dossiers
//     +3_200  four dossiers of narrative prose, once the game actually
//             imports them
//
// WHAT THIS GATE IS REALLY FOR
// The byte baseline is a tripwire for *unexplained* growth. The
// substantive checks are the sentinel sweep (every letter's words must
// be absent from the initial bundle), the chunk-presence and
// lazy-load checks, the frozen-contract greps, and the review-data
// hash. Those all still pass, and the lexicon still ships as 27
// separate async chunks. Raising the baseline does not weaken any of
// them.
//
// If app code grows again, raise this deliberately and extend the
// attribution above — do not let it drift.
const INITIAL_BASELINE_BYTES = 229_000;
const INITIAL_SLACK_BYTES = 5_000;

// Frozen loader-contract lines [Locked — U5] — must appear verbatim.
const FROZEN_CONTRACT = [
  'export async function loadLetter(letter: string): Promise<VocabEntry[]> {',
  'export async function loadAllCases(): Promise<VocabEntry[]> {',
  'export async function loadGlossPool(): Promise<string[]> {',
  'export async function loadEntriesByIds(ids: string[]): Promise<VocabEntry[]> {',
  'export const LETTERS = [',
  'export function letterOfId(id: string): string {',
];

// Historical records [Locked — U4+U10].
//
// The 81-entry review record is TWO files with two different jobs:
//
//   content/lexicon/REVIEW-BASELINE.json
//     A machine-readable, FROZEN snapshot of the original 81 rows
//     (id, letter, word, syllables, gloss, sentence, notes). It is
//     never edited, so its sha256 can be pinned here without creating
//     a "you must edit a script to record a decision" trap.
//
//   content/lexicon/LEGACY-81-ENTRIES-REVIEW.md
//     The human WORKSHEET. A reviewer fills its *Decision* column as
//     they work, so it is deliberately NOT hash-pinned — but its
//     STRUCTURE is checked against the baseline below (same 81 words,
//     same letters, uncertainty notes still present, decisions drawn
//     from the documented vocabulary). An accidental deletion, a typo
//     or a mangled cell is caught; a recorded decision is not.
const REVIEW_BASELINE = 'content/lexicon/REVIEW-BASELINE.json';
const REVIEW_WORKSHEET = 'content/lexicon/LEGACY-81-ENTRIES-REVIEW.md';
const REVIEW_BASELINE_SHA256 =
  'dc35cffc99abeeeab2e0a0c33fe27fcad3e50451cc7812254b13c50c51e7d18d';

const errors = [];
const infos = [];
const error = (m) => errors.push(m);
const info = (m) => infos.push(m);
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// ------------------------------------------------------------
// 1. initial bundle from dist/index.html
// ------------------------------------------------------------
if (!existsSync(ASSETS)) {
  console.error('FAIL — dist/assets missing; run `npm run build` first.');
  process.exit(1);
}
const html = readFileSync(join(ROOT, 'dist/index.html'), 'utf8');
const initialNames = [
  ...[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]),
  ...[...html.matchAll(/<link[^>]+modulepreload[^>]+href="([^"]+)"/g)].map((m) => m[1]),
].map((p) => p.split('/').pop());
if (initialNames.length === 0) error('index.html references no script assets');
const initialFiles = initialNames.map((n) => join(ASSETS, n));
for (const f of initialFiles) {
  if (!existsSync(f)) error(`initial asset missing on disk: ${f}`);
}
const initialText = initialFiles
  .filter(existsSync)
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');
const initialBytes = initialFiles
  .filter(existsSync)
  .reduce((sum, f) => sum + statSync(f).size, 0);

// ------------------------------------------------------------
// 2. thunk-map chunk + the 27 letter chunks
// ------------------------------------------------------------
const assetFiles = readdirSync(ASSETS).filter((n) => n.endsWith('.js'));
// The thunk-map chunk is the file whose dynamic imports name all 27
// letter chunks (the main bundle mentions LETTER_MODULES only as a
// property access and imports the thunk chunk itself once).
let thunkChunk = null;
let thunkBest = 0;
for (const n of assetFiles) {
  const text = readFileSync(join(ASSETS, n), 'utf8');
  if (!text.includes('LETTER_MODULES')) continue;
  const imports = [...text.matchAll(/import\("\.\//g)].length;
  if (imports > thunkBest) {
    thunkBest = imports;
    thunkChunk = n;
  }
}
if (!thunkChunk || thunkBest < LETTERS.length) {
  error(`thunk-map chunk not found or reaches only ${thunkBest} chunks; expected ${LETTERS.length}`);
  thunkChunk = null;
}
let letterChunks = [];
if (thunkChunk) {
  const text = readFileSync(join(ASSETS, thunkChunk), 'utf8');
  letterChunks = [...text.matchAll(/import\("\.\/([^"]+\.js)"\)/g)].map((m) => m[1]);
  if (letterChunks.length !== LETTERS.length) {
    error(`thunk map reaches ${letterChunks.length} chunks; expected ${LETTERS.length}`);
  }
  if (initialNames.includes(thunkChunk)) {
    error(`thunk-map chunk ${thunkChunk} is in the initial page — payloads must stay lazy [R3]`);
  }
}
for (const name of letterChunks) {
  if (initialNames.includes(name)) {
    error(`letter chunk ${name} is preloaded in index.html — must load on demand only`);
  }
}

// ------------------------------------------------------------
// 3. sentinels: every word, sampled across every letter
//    (word-boundary match — a bare includes() would hit
//    "gato" inside minified `navigator`, etc.)
// ------------------------------------------------------------
const wordMatch = (text, word) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u').test(text);
// Payload fingerprint: a letter module inlined into a bundle carries
// `word:"<w>"` object entries; minified app/React code can collide
// with a bare word (e.g. identifier `yo(`) — the fingerprint can't.
const payloadFingerprint = (text, word) =>
  new RegExp(`word\\s*:\\s*"${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(text);

const gameSource = ['mysteries.ts', 'WordDetective.tsx', 'Casebook.tsx']
  .map((n) => join(ROOT, 'src/components', n))
  .filter(existsSync)
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

const sentinelsByLetter = new Map();
for (const letter of LETTERS) {
  const file = join(ROOT, 'src/data/lexicon', `${letter.toLowerCase()}.ts`);
  if (!existsSync(file)) {
    error(`runtime letter module missing: ${letter}.ts`);
    continue;
  }
  const words = [...readFileSync(file, 'utf8').matchAll(/word:\s*"([^"]+)"/g)].map((m) => m[1]);
  sentinelsByLetter.set(letter, words);
}

let excluded = 0;
let checked = 0;
for (const [letter, words] of sentinelsByLetter) {
  let checkedThisLetter = 0;
  for (const word of words) {
    if (wordMatch(gameSource, word)) {
      excluded += 1; // authored dossier prose — static by design [R4]
      continue;
    }
    checked += 1;
    checkedThisLetter += 1;
    if (payloadFingerprint(initialText, word)) {
      error(`sentinel "${word}" (letter ${letter}) payload found in the INITIAL bundle — letter payload leaked [R3]`);
    }
  }
  if (checkedThisLetter === 0) {
    info(`letter ${letter}: all sentinels excluded (authored static prose) — covered by chunk-presence check`);
  }
}
info(`sentinels: ${checked} checked against initial bundle, ${excluded} excluded (authored dossier prose)`);

// payload-identifying sentence check (catches a fully-inlined chunk even
// if its words collide with static prose)
for (const [letter] of sentinelsByLetter) {
  const file = join(ROOT, 'src/data/lexicon', `${letter.toLowerCase()}.ts`);
  if (!existsSync(file)) continue;
  const sent = readFileSync(file, 'utf8').match(/sentenceES:\s*"([^"]{12,})"/);
  if (sent && !gameSource.includes(sent[1]) && initialText.includes(sent[1])) {
    error(`sentence payload from ${letter}.ts found in the INITIAL bundle [R3]`);
  }
}

// ------------------------------------------------------------
// 4. static-import gate + frozen signatures [Locked — U5]
// ------------------------------------------------------------
const lexiconTs = readFileSync(join(ROOT, 'src/components/lexicon.ts'), 'utf8');
for (const line of FROZEN_CONTRACT) {
  if (!lexiconTs.includes(line)) {
    error(`frozen loader contract line missing from lexicon.ts: ${line}`);
  }
}
for (const line of lexiconTs.split('\n')) {
  if (/from\s+['"]\.\.\/data\/lexicon/.test(line) && !line.includes('import type')) {
    error(`lexicon.ts value-imports the lexicon statically (type-only is erased): ${line.trim()}`);
  }
}
for (const name of ['WordDetective.tsx', 'Casebook.tsx', 'mysteries.ts']) {
  const p = join(ROOT, 'src/components', name);
  if (existsSync(p) && readFileSync(p, 'utf8').includes('data/lexicon')) {
    error(`${name} references data/lexicon — game code must reach data only via the frozen loader [R5/U5]`);
  }
}

// ------------------------------------------------------------
// 4b. 004d gloss-index gates — the generated GLOBAL distractor pool
//     (src/data/lexicon/gloss-index.ts) must ship as its OWN lazily
//     imported chunk, never statically imported, never inlined in the
//     initial bundle. Additive: nothing above changes.
// ------------------------------------------------------------
function walkSrc(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkSrc(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

const glossIndexSrc = join(ROOT, 'src/data/lexicon/gloss-index.ts');
if (!existsSync(glossIndexSrc)) {
  error('004d: src/data/lexicon/gloss-index.ts is missing — generate it with: node scripts/build-gloss-index.mjs');
} else {
  // only a dynamic import() may reference it [004d §4.2/L4]
  if (!lexiconTs.includes("import('../data/lexicon/gloss-index')")) {
    error(`004d: lexicon.ts must lazy-import the gloss index via import() — missing import('../data/lexicon/gloss-index')`);
  }
  for (const line of lexiconTs.split('\n')) {
    if (/from\s+['"][^'"]*gloss-index['"]/.test(line)) {
      error(`004d: lexicon.ts must not statically import the gloss index: ${line.trim()}`);
    }
  }
  for (const file of walkSrc(join(ROOT, 'src'))) {
    if (file === glossIndexSrc || file.endsWith('components/lexicon.ts')) continue;
    if (readFileSync(file, 'utf8').includes('gloss-index')) {
      error(`004d: ${file} references the gloss index — only src/components/lexicon.ts may load it [L3/L4]`);
    }
  }

  // the chunk itself must exist in dist and stay out of the page
  const glossChunks = assetFiles.filter((n) => /^gloss-index-.*\.js$/.test(n));
  if (glossChunks.length === 0) {
    error('004d: no dist/assets/gloss-index-*.js chunk — the index must be reachable only as its own async chunk [R3]');
  } else if (glossChunks.length > 1) {
    error(`004d: ${glossChunks.length} gloss-index chunks in dist (expected 1): ${glossChunks.join(', ')}`);
  }
  for (const name of glossChunks) {
    if (initialNames.includes(name)) {
      error(`004d: gloss-index chunk ${name} is preloaded in index.html — it must load on demand only [R3]`);
    }
    info(`gloss-index chunk: ${name} — ${statSync(join(ASSETS, name)).size} B`);
  }

  // gloss sentinels vs the initial bundle
  const glossStrings = [
    ...readFileSync(glossIndexSrc, 'utf8').matchAll(/^\s*"([^"]+)",?\s*$/gm),
  ].map((m) => m[1]);
  if (glossStrings.length === 0) {
    error('004d: no gloss strings parsed out of gloss-index.ts');
  }

  // --- (1) STRONG leak gate: contiguous serialized runs of the pool.
  // An index inlined into the page carries its array literal, so a
  // run of neighbouring glosses must not appear in the initial
  // bundle. Checked at the head and mid-pool.
  const runOf = (start, len) =>
    `[${glossStrings.slice(start, start + len).map((g) => `"${g}"`).join(',')}]`;
  for (const [label, start] of [['head', 0], ['mid', Math.max(0, Math.floor(glossStrings.length / 2) - 4)]]) {
    const run = runOf(start, 8);
    if (initialText.includes(run)) {
      error(`004d: a contiguous gloss-index run (${label}, "${glossStrings[start]}…") appears in the INITIAL bundle — the index leaked [R3/U11]`);
    }
  }

  // --- (2) the emitted chunk must still carry the whole pool
  if (glossChunks.length === 1) {
    const chunkText = readFileSync(join(ASSETS, glossChunks[0]), 'utf8');
    const chunkStrings = [...chunkText.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
    info(`004d: gloss-index chunk carries ${chunkStrings.length} string(s) for ${glossStrings.length} source gloss(es)`);
    if (chunkStrings.length !== glossStrings.length) {
      error(`004d: gloss-index chunk holds ${chunkStrings.length} string(s) but the source index has ${glossStrings.length} — the chunk does not match its source`);
    }
  }

  // --- (3) SUPPLEMENTARY per-gloss scan. Bare-word matching is the
  // technique used for the word sentinels above, but English glosses
  // collide with minified DEPENDENCY tokens: measured in the built
  // entry chunk (004d N2), React DOM itself contains the standalone
  // words below. Those are documented exclusions — the runs in (1)
  // plus the chunk gates above are what actually prove the index
  // never enters the initial bundle. Adding an entry here requires
  // confirming the token comes from the dependency, not the pool.
  const DEPENDENCY_TOKEN_EXCLUSIONS = new Map([
    ['name', 'React DOM: displayName / Function.name / DOM name attributes'],
    ['mouse', 'React DOM: pointer-event dependency name'],
    ['week', 'React DOM: isTextInputElement input-type allowlist'],
  ]);
  let glossAbsent = 0;
  let glossExcluded = 0;
  let glossSkippedShort = 0;
  let glossDependency = 0;
  for (const gloss of glossStrings) {
    if (gloss.length < 4) { glossSkippedShort += 1; continue; } // too short to match safely (e.g. "I")
    if (wordMatch(gameSource, gloss)) { glossExcluded += 1; continue; } // authored static prose
    if (!wordMatch(initialText, gloss)) { glossAbsent += 1; continue; }
    if (DEPENDENCY_TOKEN_EXCLUSIONS.has(gloss)) {
      glossDependency += 1;
      info(`004d: gloss "${gloss}" also occurs in the initial bundle as a documented dependency token — ${DEPENDENCY_TOKEN_EXCLUSIONS.get(gloss)}`);
      continue;
    }
    error(`004d: gloss sentinel "${gloss}" is in the INITIAL bundle and is not a documented dependency token — the gloss index may have leaked [R3/U11]`);
  }
  info(
    `gloss sentinels: ${glossAbsent} checked and absent, ${glossExcluded} excluded (authored static prose), ` +
    `${glossDependency} excluded (documented dependency tokens), ${glossSkippedShort} skipped (< 4 chars)`,
  );
}

// ------------------------------------------------------------
// 5. review-data integrity [Locked — U4+U10, re-scoped 2026-10-20]
//
// The worksheet is free-form; the baseline is not. Both are checked.
// ------------------------------------------------------------
const baselinePath = join(ROOT, REVIEW_BASELINE);
const worksheetPath = join(ROOT, REVIEW_WORKSHEET);

/** Parse the markdown worksheet into letter sections of table rows. */
function parseWorksheet(text) {
  const sections = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = { letter: heading[1], rows: [] };
      sections.push(current);
      continue;
    }
    if (!line.startsWith('|')) continue;
    const parts = line.split('|');
    if (parts[0].trim() === '') parts.shift();
    if (parts[parts.length - 1].trim() === '') parts.pop();
    const cells = parts.map((c) => c.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // separator row
    if (cells[0] === 'Word') continue; // header row
    if (!current) {
      error(`${REVIEW_WORKSHEET}: a table row appears before any "## <letter>" section`);
      continue;
    }
    current.rows.push(cells);
  }
  return sections;
}

let baseline = null;
let baselineIntact = false;

if (!existsSync(baselinePath)) {
  error(`review baseline missing: ${REVIEW_BASELINE} — restore it from version control [U4]`);
} else {
  const actual = sha256(baselinePath);
  if (actual !== REVIEW_BASELINE_SHA256) {
    error(
      `review baseline modified: ${REVIEW_BASELINE} (sha256 ${actual.slice(0, 12)}… ≠ ${REVIEW_BASELINE_SHA256.slice(0, 12)}…) — ` +
        'the baseline is a frozen snapshot and must never be edited; restore it from version control [U4]',
    );
  } else {
    baselineIntact = true;
    try {
      baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
    } catch (e) {
      error(`review baseline unparseable: ${e.message} [U4]`);
      baseline = null;
    }
  }
}

if (baseline && Array.isArray(baseline.entries)) {
  const rows = baseline.entries;
  if (rows.length !== 81) {
    error(`review baseline holds ${rows.length} rows (expected the original 81) [U4]`);
  }
  const baselineIds = rows.map((r) => r.id);
  if (new Set(baselineIds).size !== baselineIds.length) {
    error('review baseline contains duplicate ids [U4]');
  }
  // The ids are frozen once published (U12) and the validator's V16 keeps
  // the runtime set exactly these 81 — so the baseline must still resolve.
  const runtimeIds = new Set();
  for (const [letter] of sentinelsByLetter) {
    const file = join(ROOT, 'src/data/lexicon', `${letter.toLowerCase()}.ts`);
    if (!existsSync(file)) continue;
    for (const m of readFileSync(file, 'utf8').matchAll(/\bid:\s*"([^"]+)"/g)) runtimeIds.add(m[1]);
  }
  const unresolved = baselineIds.filter((id) => !runtimeIds.has(id));
  if (unresolved.length) {
    error(`review baseline id(s) not present in the runtime lexicon: ${unresolved.join(', ')} [U4]`);
  }
  info(`review baseline: ${rows.length} frozen row(s), ${baselineIds.length} id(s) resolved against the runtime lexicon`);
} else if (baseline) {
  error('review baseline has no "entries" array [U4]');
}

// --- the worksheet: free-form prose, checked for STRUCTURE only ---
if (!existsSync(worksheetPath)) {
  error(`review worksheet missing: ${REVIEW_WORKSHEET} [U4]`);
} else if (baseline && Array.isArray(baseline.entries)) {
  const sections = parseWorksheet(readFileSync(worksheetPath, 'utf8'));

  // (a) the 27 letter sections, in the canonical order
  const sectionLetters = sections.map((s) => s.letter);
  if (sectionLetters.length !== LETTERS.length || sectionLetters.join('|') !== LETTERS.join('|')) {
    error(
      `${REVIEW_WORKSHEET}: letter sections are [${sectionLetters.join(', ')}] — expected the 27 letters in canonical order (A…N, Ñ, O…Z) [U4]`,
    );
  }

  // (b) the same 81 words, under the same letters
  const baselineByLetter = new Map();
  for (const row of baseline.entries) {
    if (!baselineByLetter.has(row.letter)) baselineByLetter.set(row.letter, []);
    baselineByLetter.get(row.letter).push(row);
  }
  let worksheetRows = 0;
  for (const section of sections) {
    const expected = baselineByLetter.get(section.letter) ?? [];
    worksheetRows += section.rows.length;
    if (section.rows.length !== expected.length) {
      error(
        `${REVIEW_WORKSHEET}: section "${section.letter}" lists ${section.rows.length} row(s), expected ${expected.length} [U4]`,
      );
    }
    const seen = new Set();
    for (const cells of section.rows) {
      if (cells.length < 6) {
        error(`${REVIEW_WORKSHEET}: row "${cells[0] ?? '?'}" has ${cells.length} cell(s), expected 6 [U4]`);
        continue;
      }
      const [word, , , , note, decision] = cells;
      seen.add(word);
      const match = expected.find((r) => r.word === word);
      if (!match) {
        error(`${REVIEW_WORKSHEET}: unexpected word "${word}" in section "${section.letter}" — the 81 reviewed words must not change [U4]`);
      } else if (match.notes && note.trim() === '') {
        error(`${REVIEW_WORKSHEET}: uncertainty note for "${word}" was deleted — the flag must stay visible until it is resolved [U4]`);
      }
      const decisionText = decision.trim();
      if (decisionText !== '' && !/^(keep|drop|change:\s*.+)$/i.test(decisionText)) {
        error(
          `${REVIEW_WORKSHEET}: decision "${decisionText}" for "${word}" is not one of: keep | drop | change: <text> [U4]`,
        );
      }
    }
    const missing = expected.filter((r) => !seen.has(r.word)).map((r) => r.word);
    if (missing.length) {
      error(`${REVIEW_WORKSHEET}: section "${section.letter}" is missing row(s): ${missing.join(', ')} [U4]`);
    }
  }
  if (worksheetRows !== 81) {
    error(`${REVIEW_WORKSHEET} lists ${worksheetRows} row(s), expected 81 [U4]`);
  }
  info(`review worksheet: ${sections.length} letter section(s), ${worksheetRows} row(s) — structure matches the baseline`);
}

// ------------------------------------------------------------
// 6. size report (INFO) + baseline delta
// ------------------------------------------------------------
let lexiconBytes = 0;
for (const name of letterChunks) {
  const p = join(ASSETS, name);
  if (existsSync(p)) lexiconBytes += statSync(p).size;
}
const glossChunksFinal = readdirSync(ASSETS).filter((n) => /^gloss-index-.*\.js$/.test(n));
const glossIndexBytes = glossChunksFinal.reduce((sum, n) => sum + statSync(join(ASSETS, n)).size, 0);
for (const [letter] of sentinelsByLetter) {
  const idx = letterChunks.findIndex((n) => n.startsWith(`${letter.toLowerCase()}-`));
  if (idx >= 0) {
    info(`chunk ${letter}: ${letterChunks[idx]} — ${statSync(join(ASSETS, letterChunks[idx])).size} B`);
  }
}
info(`initial bundle: ${initialBytes} B across ${initialFiles.length} file(s) — baseline ${INITIAL_BASELINE_BYTES} B (+${INITIAL_SLACK_BYTES} B allowed)`);
const thunkBytes = thunkChunk ? statSync(join(ASSETS, thunkChunk)).size : 0;
info(`lexicon weight: thunk map ${thunkBytes} B + 27 letter chunks ${lexiconBytes} B + gloss index ${glossIndexBytes} B = ${thunkBytes + lexiconBytes + glossIndexBytes} B`);
if (initialBytes > INITIAL_BASELINE_BYTES + INITIAL_SLACK_BYTES) {
  error(`initial bundle ${initialBytes} B exceeds documented baseline ${INITIAL_BASELINE_BYTES} B + ${INITIAL_SLACK_BYTES} B slack — explain or update the documented baseline in this script + state.md`);
}

// ------------------------------------------------------------
// report
// ------------------------------------------------------------
for (const line of infos) console.log(`  INFO   ${line}`);
if (errors.length) {
  for (const line of errors) console.error(`  ERROR  ${line}`);
  console.error(`FAIL — ${errors.length} error(s).`);
  process.exit(1);
}
console.log('PASS — bundle/laziness/contract/review-data checks all green.');

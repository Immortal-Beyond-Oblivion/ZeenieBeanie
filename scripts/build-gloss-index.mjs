#!/usr/bin/env node
// ============================================================
// build-gloss-index.mjs — GENERATOR for
// src/data/lexicon/gloss-index.ts (Slice 004d §4.3)
//
// Why: 004c measured (spec §0) that `loadGlossPool()` derived the
// GLOBAL distractor pool from `loadAllCases()`, so the first armed
// draw fetched all 27 letter modules (29 payloads instead of 3).
// Distractor selection only ever consumes gloss STRINGS, so the pool
// is precomputed here as a flat, deduplicated string array that
// `loadGlossPool()` lazy-imports [004d §4.1/§4.4].
//
// This is U5 half A ONLY. It does NOT touch `loadAllCases()`, the
// free-draw deck, or any game code — U5 half B (free-draw
// full-entry acquisition) stays intentionally deferred (004d §16-D2).
//
// ZERO dependencies; invoked as `node scripts/…` like 004c's
// verifiers. No npm script is added [004d §4.3].
//
// The parse is a deliberate SECOND, independent implementation of
// the eval technique used by validate-lexicon.mjs (004c's
// converter/checker independence pattern): the builder derives the
// pool here, and validate-lexicon.mjs re-derives it from its own
// entry scan (V21). Disagreement is a hard failure, not drift.
//
// Loud failures only [§4.3.7]: an unreadable file, a missing entry
// array, zero runtime-reachable entries, or zero distinct glosses
// exits non-zero and NEVER writes a partial/empty index.
//
// Usage:
//   node scripts/build-gloss-index.mjs           # write the index
//   node scripts/build-gloss-index.mjs --check   # staleness check
//                                                 (no write, non-zero
//                                                  on any difference)
// ============================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME_DIR = join(ROOT, 'src/data/lexicon');
const TARGET = join(RUNTIME_DIR, 'gloss-index.ts');

// Letter-module key order — A…N, Ñ, O…Z (identical to the thunk map,
// src/data/lexicon/index.ts:8-36, and to validate-lexicon.mjs).
const LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

// V20 runtime predicate — byte-parity with lexicon.ts's
// isRuntimeReachable() and validate-lexicon.mjs's RUNTIME_STAGES
// [Locked — U3+T1].
const RUNTIME_STAGES = new Set(['published', 'prototype-live']);

function fail(msg) {
  console.error(`build-gloss-index: FAIL — ${msg}`);
  process.exit(1);
}

// ------------------------------------------------------------
// tiny TS-module evaluator (comments/imports stripped, then eval)
// — the proven technique from validate-dataset.mjs /
// validate-lexicon.mjs, reimplemented independently here.
// ------------------------------------------------------------
function evalEntryArray(file, label) {
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch (e) {
    fail(`${label}: unreadable — ${e.message}`);
  }
  const cleaned = src
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*import[^\n]*$/gm, '');
  const m = cleaned.match(/export\s+const\s+\w+\s*(?::[^=]+)?=\s*([\s\S]*?)\s*;?\s*$/);
  if (!m) fail(`${label}: no "export const … = [ … ]" entry array found`);
  try {
    const value = new Function(`return (${m[1]});`)();
    if (!Array.isArray(value)) throw new Error('not an array');
    return value;
  } catch (e) {
    fail(`${label}: unparseable — ${e.message}`);
  }
}

// ------------------------------------------------------------
// derive the pool: key order → file order → Set (first wins)
// — the same membership and cardinality the runtime
// `[...new Set(cases.map(e => e.gloss))]` produced [004d §4.7].
// ------------------------------------------------------------
const seen = new Set();
const pool = [];
let runtimeEntries = 0;

for (const letter of LETTERS) {
  const name = `${letter.toLowerCase()}.ts`;
  const file = join(RUNTIME_DIR, name);
  if (!existsSync(file)) fail(`runtime letter module missing: ${name}`);
  const entries = evalEntryArray(file, `src/data/lexicon/${name}`);
  for (const entry of entries) {
    if (!RUNTIME_STAGES.has(entry?.stage)) continue; // V20 gate
    runtimeEntries += 1;
    const gloss = entry.glossEN;
    if (typeof gloss !== 'string' || gloss === '') {
      fail(`${name}: entry "${entry?.id ?? '?'}" has no usable glossEN`);
    }
    if (!seen.has(gloss)) {
      seen.add(gloss);
      pool.push(gloss);
    }
  }
}

if (runtimeEntries === 0) fail('no runtime-reachable entries derived — refusing to write an empty index');
if (pool.length === 0) fail('zero distinct glosses derived — refusing to write an empty index');

// ------------------------------------------------------------
// render deterministically (JSON.stringify per string: double
// quotes, literal Unicode — matches the letter-module style)
// ------------------------------------------------------------
const HEADER = `// src/data/lexicon/gloss-index.ts
// GENERATED by scripts/build-gloss-index.mjs — DO NOT EDIT BY HAND.
// Source of truth: the 27 letter modules (a.ts … ñ.ts).
// Freshness + semantics enforced by validate-lexicon.mjs V21/V22.
// Regenerate after any letter-module edit:
//     node scripts/build-gloss-index.mjs
// Check staleness without writing:
//     node scripts/build-gloss-index.mjs --check

/**
 * GLOBAL distractor gloss pool [004d §4.1; preserves 004c U11]:
 * every distinct \`glossEN\` of every runtime-reachable entry
 * (stage 'published' | 'prototype-live'), deduplicated
 * (first occurrence wins), ordered by letter-module key order
 * (A…N, Ñ, O…Z), first appearance within each letter.
 * Strings only — \`buildSlips\` samples by gloss text alone.
 * ~81 distinct values at migration time (exact-81 grandfathered set).
 */`;

const generated =
  `${HEADER}\nexport const GLOSS_POOL: string[] = [\n` +
  `${pool.map((g) => `  ${JSON.stringify(g)},`).join('\n')}\n];\n`;

const args = process.argv.slice(2);
for (const arg of args) {
  if (arg !== '--check') fail(`unknown argument "${arg}" — usage: node scripts/build-gloss-index.mjs [--check]`);
}

if (args.includes('--check')) {
  if (!existsSync(TARGET)) {
    fail(`--check: src/data/lexicon/gloss-index.ts is missing — run: node scripts/build-gloss-index.mjs`);
  }
  const current = readFileSync(TARGET, 'utf8');
  if (current !== generated) {
    console.error('build-gloss-index: FAIL — committed index is STALE or hand-edited.');
    console.error('  Regenerate with: node scripts/build-gloss-index.mjs');
    process.exit(1);
  }
  console.log(
    `build-gloss-index: OK — index is fresh (${pool.length} distinct glosses ` +
    `from ${runtimeEntries} runtime-reachable entries). Nothing written.`,
  );
} else {
  writeFileSync(TARGET, generated);
  console.log(
    `build-gloss-index: wrote src/data/lexicon/gloss-index.ts ` +
    `(${pool.length} distinct glosses from ${runtimeEntries} runtime-reachable entries).`,
  );
}
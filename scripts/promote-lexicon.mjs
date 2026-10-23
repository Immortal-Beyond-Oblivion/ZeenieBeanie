#!/usr/bin/env node
/* ============================================================
   Promote the approved staging batch into the runtime tree.

   Usage: node scripts/promote-lexicon.mjs

   Reads content/lexicon/<letter>.ts (staging), and for every
   entry whose id also exists in src/data/lexicon/<letter>.ts,
   replaces the runtime entry with the staged one at
   stage: 'published'. Entries with no runtime counterpart are
   appended to their letter file.

   The staged entry must already be signed off — the validator
   (V16) fails any 'published' entry whose id is not recorded in
   content/lexicon/APPROVAL-LEDGER.md. This script does not
   check that; the validator does, and it runs after this.
   ============================================================ */

import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STAGING = join(ROOT, 'content/lexicon');
const RUNTIME = join(ROOT, 'src/data/lexicon');

const STAGE = 'published';

/* Parse the staged entries: capture each `{ ... }` object literal
   inside the entries array, keeping its fields verbatim. */
function parseStaged(src) {
  const start = src.indexOf('export const entries');
  if (start === -1) return [];
  const open = src.indexOf('[', start);
  const close = src.indexOf('];', open);
  const body = src.slice(open + 1, close);

  const out = [];
  let depth = 0;
  let buf = '';
  let inStr = null;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inStr) {
      buf += c;
      if (c === inStr && body[i - 1] !== '\\') inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = c; buf += c; continue; }
    if (c === '{') { depth++; if (depth === 1) { buf = ''; continue; } }
    if (c === '}') {
      depth--;
      if (depth === 0) { out.push(buf.trim()); buf = ''; continue; }
    }
    if (depth >= 1) buf += c;
  }
  return out.map(normalise);
}

/* Normalise a captured object literal into a single-line runtime
   entry with the fields in the runtime file's own order. */
function normalise(raw) {
  const field = (name) => {
    const m = raw.match(new RegExp('\\b' + name + ':\\s*(\\{[^{}]*\\}|\\[[^\\]]*\\]|\'[^\']*\'|"[^"]*"|[^,\\n]+)'));
    return m ? m[1].trim() : null;
  };
  const ortho = field('orthography');
  const id = field('id').replace(/^['"]|['"]$/g, '');
  const letter = field('letter').replace(/^['"]|['"]$/g, '');
  const word = field('word').replace(/^['"]|['"]$/g, '');
  const syllables = field('syllables').replace(/^['"]|['"]$/g, '');
  const glossEN = field('glossEN').replace(/^['"]|['"]$/g, '');
  const glossES = field('glossES');
  const sentenceES = field('sentenceES').replace(/^['"]|['"]$/g, '');
  const sentenceEN = field('sentenceEN').replace(/^['"]|['"]$/g, '');
  const category = field('category').replace(/^['"]|['"]$/g, '');
  const level = field('level');
  const usefulness = field('usefulness').replace(/^['"]|['"]$/g, '');
  const notes = field('notes');

  let line = `  { id: "${id}", letter: "${letter}", word: "${word}", syllables: "${syllables}", glossEN: "${glossEN}"`;
  if (glossES) line += `, glossES: ${glossES}`;
  line += `, sentenceES: "${sentenceES}"`;
  if (sentenceEN) line += `, sentenceEN: "${sentenceEN}"`;
  line += `, category: '${category}', level: ${level}, usefulness: '${usefulness}'`;
  if (ortho) line += `, orthography: ${ortho}`;
  if (notes) line += `, notes: ${notes}`;
  line += `, stage: '${STAGE}' },`;
  return { id, line };
}

const stagedFiles = readdirSync(STAGING).filter(
  (f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts' && f !== 'gloss-index.ts'
);

let promoted = 0;
const promotedIds = [];

for (const file of stagedFiles) {
  const letter = file.replace(/\.ts$/, '');
  const stagedPath = join(STAGING, file);
  const stagedSrc = readFileSync(stagedPath, 'utf8');
  const entries = parseStaged(stagedSrc);
  if (!entries.length) continue;

  const runtimePath = join(RUNTIME, file);
  let runtimeSrc = readFileSync(runtimePath, 'utf8');

  for (const entry of entries) {
    const re = new RegExp(
      '^\\s*\\{[^\\n]*id:\\s*["\']' + entry.id.replace(/[-]/g, '\\-') + '["\'][^\\n]*\\},\\s*$',
      'm'
    );
    if (re.test(runtimeSrc)) {
      runtimeSrc = runtimeSrc.replace(re, entry.line);
    } else {
      /* no runtime counterpart — append before the closing bracket */
      runtimeSrc = runtimeSrc.replace(/\n\];\s*$/, `\n${entry.line}\n];\n`);
    }
    promoted += 1;
    promotedIds.push(entry.id);
  }

  /* the file header must no longer claim every entry is a draft */
  const header = runtimeSrc.split('\n').slice(0, 8).join('\n');
  if (header.includes('prototype-live')) {
    runtimeSrc = runtimeSrc.replace(
      /^\/\/ Letter ([A-ZÑ]) — .*\n(?:^\/\/.*\n)*/m,
      `// Letter $1 — reviewed vocabulary.\n` +
        "//\n" +
        "// stage: 'published' = instructor-approved (see\n" +
        "// content/lexicon/APPROVAL-LEDGER.md).\n" +
        "// stage: 'prototype-live' = MIGRATION STATE ONLY [Locked — U3+T1]:\n" +
        "// grandfathered for runtime reachability, NEVER instructor-approved,\n" +
        "// draft pending instructor review (exact 81-id set enforced by V16).\n"
    );
  }

  writeFileSync(runtimePath, runtimeSrc, 'utf8');

  /* The staged entry has now been promoted, so it must LEAVE the
     staging tree. Staging is a work queue: once an entry is
     published it lives in the runtime tree only. Leaving it in
     place would make it shadow the published runtime entry, which
     V1/V2 reject (the re-authoring-pair exemption only covers a
     runtime entry that is still 'prototype-live'). */
  let remaining = stagedSrc;
  for (const entry of entries) {
    remaining = removeEntry(remaining, entry.id);
  }

  const stillHasEntries = /export const entries: LexiconEntry\[\] = \[\s*\{/.test(remaining);
  if (stillHasEntries) {
    writeFileSync(stagedPath, remaining, 'utf8');
  } else {
    /* no empty scaffolding — remove the file entirely */
    rmSync(stagedPath);
  }
}

/* Remove one object literal from the entries array by matching
   braces, so nested objects (orthography) are handled. */
function removeEntry(src, id) {
  const idNeedle = "id: '" + id + "'";
  const idNeedle2 = 'id: "' + id + '"';
  const at = src.indexOf(idNeedle) !== -1 ? src.indexOf(idNeedle) : src.indexOf(idNeedle2);
  if (at === -1) return src;

  /* walk back to the opening brace of this object */
  let open = at;
  while (open > 0 && src[open] !== '{') open -= 1;

  /* walk forward to the matching closing brace */
  let depth = 0;
  let close = -1;
  let inStr = null;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === inStr && src[i - 1] !== '\\') inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) { close = i; break; }
    }
  }
  if (close === -1) return src;

  /* swallow the trailing comma and the line break */
  let end = close + 1;
  while (src[end] === ' ' || src[end] === '\t') end += 1;
  if (src[end] === ',') end += 1;
  while (src[end] === ' ' || src[end] === '\t') end += 1;
  if (src[end] === '\n') end += 1;

  /* and any leading indentation on the object's own line */
  let start = open;
  while (start > 0 && (src[start - 1] === ' ' || src[start - 1] === '\t')) start -= 1;

  return src.slice(0, start) + src.slice(end);
}

console.log(`promoted ${promoted} entries across ${stagedFiles.length} letter file(s)`);
console.log(promotedIds.join('\n'));

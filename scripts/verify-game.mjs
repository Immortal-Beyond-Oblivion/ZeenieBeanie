#!/usr/bin/env node
/* ============================================================
   Game smoke test — drives the Word Detective loop through
   Browser Control and asserts the core behaviour.

   WHY THIS EXISTS
   The project has no automated test suite. This script is the
   repeatable check for the game's critical path, so a change to
   the game can be verified in one command instead of re-deriving
   the manual Playwright pass every time.

   USAGE
     1. npm run dev                      (in another terminal)
     2. node scripts/verify-game.mjs

   It uses the globally installed `browser-control` CLI, so it
   adds no dependency to this project. It drives a real browser
   against a real dev server — nothing here is simulated.

   EXIT CODE
     0 = every check passed
     1 = at least one check failed
   ============================================================ */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const exec = promisify(execFile);

const URL = process.env.SITE_URL ?? 'http://127.0.0.1:5173/';
const SESSION = process.env.BC_SESSION ?? 'spain-v2';

/* The in-page half of the test. It runs inside the real page. */
const PAGE_SCRIPT = `
const SITE_URL = ${JSON.stringify(URL)};
const results = [];
const check = (name, pass, detail) => results.push({ name, pass: !!pass, detail });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* --- 0. load the site -------------------------------------- */
await page.setViewportSize({ width: 1280, height: 1000 });
await page.goto(SITE_URL, { waitUntil: 'load' });
await page.waitForSelector('.word-detective', { timeout: 20000 });
await sleep(1200);
/* start from a clean casebook so the record assertions are meaningful */
await page.evaluate(() => localStorage.removeItem('wd-casebook-v1'));
await page.reload({ waitUntil: 'load' });
await page.waitForSelector('.word-detective', { timeout: 20000 });
await sleep(1200);

/* --- helpers ------------------------------------------------ */
const count = (sel) => page.locator(sel).count();

const drawCase = async (letter) => {
  const arm = letter
    ? page.getByRole('button', { name: new RegExp('Arm the next case for letter ' + letter + '$', 'i') })
    : null;
  if (arm) { await arm.click(); await sleep(250); }
  await page.getByRole('button', { name: /Draw a case/i }).first().click();
  /* the loader may fetch chunks; wait for a slip to appear */
  await page.locator('.wd-slip').first().waitFor({ state: 'visible', timeout: 15000 });
  await sleep(300);
  return page.evaluate(() => ({
    word: document.querySelector('.wd-word')?.innerText?.trim() ?? null,
    glosses: Array.from(document.querySelectorAll('.wd-slip-text')).map(e => e.innerText.trim()),
    question: document.querySelector('.wd-question')?.innerText?.trim() ?? null
  }));
};

/* --- 1. the page loads and the game is present --------------- */
check('game section present', await count('.word-detective') === 1);
check('deck button present', await count('.wd-deck') === 1);
check('27 keycaps present', await count('.wd-tab') === 27);
check('casebook present', await count('.wd-casebook') === 1);
check('single live region', await count('[role=status][aria-live=polite]') === 1);
check('exactly one h1 on the page', await count('h1') === 1);

/* --- 2. drawing a case -------------------------------------- */
const drawn = await drawCase('M');
check('a case was drawn', !!drawn.word, drawn.word);
check('three evidence slips', drawn.glosses.length === 3, JSON.stringify(drawn.glosses));
check('question asks for a meaning', /mean/i.test(drawn.question ?? ''), drawn.question);
check('the word is on the desk', !!(await count('.wd-word')));

/* --- 3. a wrong answer must not read as success ------------- */
/* The correct slip is not knowable from the DOM before answering, so
   keep drawing until we land a genuine wrong answer. Each case is one
   correct slip and two wrong ones, so this converges fast. */
const readRecord = () => page.evaluate(() => {
  const raw = localStorage.getItem('wd-casebook-v1');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
});

let verdict = null;
let isRedHerring = false;
let attempts = 0;

for (; attempts < 8; attempts++) {
  if (attempts > 0) {
    /* advance to the next case */
    const next = page.getByRole('button', { name: /Draw the next case/i });
    if (await next.count()) { await next.click(); await sleep(700); }
    else { await drawCase(null); }
  }

  const before = Object.keys(await readRecord());
  await page.locator('.wd-slip').first().click();
  await sleep(900);

  const after = await readRecord();
  const newKeys = Object.keys(after).filter(k => !before.includes(k));
  const state = newKeys.length ? after[newKeys[0]] : null;

  if (state === 'red-herring') {
    isRedHerring = true;
    verdict = await page.evaluate(() => ({
      announcement: document.querySelector('[role=status]')?.textContent?.trim() ?? '',
      kicker: document.querySelector('.wd-learn-kicker')?.innerText?.trim() ?? '',
      flourish: document.querySelector('.wd-learn-flourish')?.innerText?.trim() ?? '',
      learnVisible: !!document.querySelector('.wd-learn'),
      nextCase: !!document.querySelector('.wd-next')
    }));
    break;
  }
}

check('learning panel appears after a guess', !!verdict?.learnVisible, 'after ' + (attempts + 1) + ' attempt(s)');
check('a "next case" control appears', !!verdict?.nextCase);

if (isRedHerring) {
  check('a wrong answer does not say "case closed" (announcement)',
    !/case closed/i.test(verdict.announcement), verdict.announcement);
  check('a wrong answer does not say "case closed" (flourish)',
    !/case closed/i.test(verdict.flourish), verdict.flourish);
  check('a wrong answer does not say "clue upgraded"',
    !/clue upgraded/i.test(verdict.kicker), verdict.kicker);
} else {
  results.push({ name: 'wrong-answer copy (skipped: no red herring in 8 attempts)', pass: false, detail: 'the wrong-answer path was never exercised' });
}

/* --- 4. the case is recorded -------------------------------- */
const record = await readRecord();
const stampValues = Object.values(record);
check('the case was recorded in the casebook', stampValues.length > 0, JSON.stringify(stampValues));

/* --- 5. the casebook shows the state ----------------------- */
const cb = await page.evaluate(() => ({
  mystery: !!document.querySelector('.cb-mystery'),
  slots: document.querySelectorAll('.cb-slot').length,
  legend: (document.querySelector('.cb-legend')?.innerText ?? '').toLowerCase(),
  lettersView: !!document.querySelector('.cb-views')
}));
check('the mystery board is present', cb.mystery);
check('the mystery has 8 slots', cb.slots === 8, String(cb.slots));
check('the legend names all three states',
  cb.legend.includes('solved') && cb.legend.includes('red herring') && cb.legend.includes('converted'),
  cb.legend);

/* --- 6. no timers drive state changes ----------------------- */
const before = await page.evaluate(() => document.querySelector('.wd-desk')?.innerHTML.length ?? 0);
await sleep(1500);
const after = await page.evaluate(() => document.querySelector('.wd-desk')?.innerHTML.length ?? 0);
check('the desk does not change on a timer', before === after, before + ' -> ' + after);

/* --- 7. nothing covers the game ----------------------------- */
const overlap = await page.evaluate(() => {
  /* A fixed element is fine only if it is out of the way — the skip
     link is fixed and off-screen until focused. Anything fixed that
     actually sits over the desk would hide live game content. */
  const desk = document.querySelector('.wd-desk');
  const r = desk?.getBoundingClientRect();
  return Array.from(document.querySelectorAll('body *'))
    .filter(e => getComputedStyle(e).position === 'fixed')
    .filter(e => {
      if (!r) return false;
      const b = e.getBoundingClientRect();
      const onScreen = b.bottom > 0 && b.top < window.innerHeight && b.width > 0 && b.height > 0;
      if (!onScreen) return false;
      return !(b.right < r.left || b.left > r.right || b.bottom < r.top || b.top > r.bottom);
    })
    .map(e => String(e.className || e.tagName));
});
check('no fixed element covers the game', overlap.length === 0, overlap.join(', '));

return results;
`;

/* --- the CLI half ------------------------------------------- */
async function run() {
  /* browser-control takes the page script via --file */
  const tmp = await mkdtemp(join(tmpdir(), 'verify-game-'));
  const scriptPath = join(tmp, 'page-script.js');
  await writeFile(scriptPath, PAGE_SCRIPT, 'utf8');

  let stdout;
  try {
    const res = await exec(
      'browser-control',
      ['execute', '--session', SESSION, '--file', scriptPath, '--json'],
      { maxBuffer: 8 * 1024 * 1024 }
    );
    stdout = res.stdout;
  } catch (err) {
    console.error('browser-control execute failed:', err.stderr || err.message);
    process.exit(1);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }

  let payload;
  try {
    payload = JSON.parse(stdout);
  } catch {
    console.error('could not parse browser-control output:\n', stdout);
    process.exit(1);
  }

  if (payload.ok === false) {
    console.error('browser-control reported an error:');
    console.error(payload.error?.message ?? payload.text);
    process.exit(1);
  }

  const results = payload.value ?? [];
  if (!Array.isArray(results) || results.length === 0) {
    console.error('no results returned');
    process.exit(1);
  }

  let failed = 0;
  for (const r of results) {
    const mark = r.pass ? 'PASS' : 'FAIL';
    if (!r.pass) failed += 1;
    const detail = r.detail ? `  (${r.detail})` : '';
    console.log(`${mark}  ${r.name}${detail}`);
  }

  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed === 0 ? 0 : 1);
}

await run();

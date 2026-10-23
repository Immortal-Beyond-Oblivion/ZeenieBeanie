#!/usr/bin/env node
/* ============================================================
   Responsive + a11y sweep across Chromium, WebKit and Firefox.

   This is a FALLBACK for when the Browser Control extension is
   unavailable. The project's canonical game check is
   `npm run verify:game`, which needs no dependency.

   Playwright is not a dependency of this project. If it is not
   resolvable, install it temporarily and re-run:

     npm i -D playwright && npx playwright install chromium webkit
     node scripts/sweep.mjs

   Usage: node scripts/sweep.mjs
   ============================================================ */

let chromium, webkit, firefox;
try {
  ({ chromium, webkit, firefox } = await import('playwright'));
} catch {
  console.error(
    'This script needs Playwright, which is not a project dependency.\n' +
    '  npm i -D playwright && npx playwright install chromium webkit\n' +
    "Or use the project's own check, which needs nothing extra:\n" +
    '  npm run dev        (in another terminal)\n' +
    '  npm run verify:game'
  );
  process.exit(2);
}

const URL = process.env.SITE_URL ?? 'http://127.0.0.1:5173/';
const WIDTHS = [320, 375, 768, 1024, 1280];

const probe = async (page, w) => {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  return page.evaluate(() => {
    const de = document.documentElement;
    const links = Array.from(document.querySelectorAll('a'));
    const small = links
      .filter(a => {
        const r = a.getBoundingClientRect();
        return r.height > 0 && (r.height < 44 || r.width < 44);
      })
      .map(a => a.getAttribute('href'));
    const noName = links
      .filter(a => !(a.getAttribute('aria-label') || a.innerText || '').trim())
      .map(a => a.getAttribute('href'));
    const heads = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h => h.tagName);
    let jump = null;
    for (let i = 1; i < heads.length; i++) {
      if (Number(heads[i][1]) - Number(heads[i - 1][1]) > 1) {
        jump = heads[i - 1] + ' -> ' + heads[i];
        break;
      }
    }
    return {
      overflow: de.scrollWidth - de.clientWidth,
      h1Count: document.querySelectorAll('h1').length,
      linkCount: links.length,
      linksUnder44: small,
      linksWithoutName: noName,
      headingJump: jump,
      sections: Array.from(document.querySelectorAll('section[id]')).map(s => s.id),
      mascotPresent: !!document.querySelector('.hero-mascot'),
      externalImages: Array.from(document.querySelectorAll('img'))
        .filter(i => !i.getAttribute('src')?.startsWith('/')).length,
    };
  });
};

(async () => {
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit], ['firefox', firefox]]) {
    let browser;
    try {
      browser = await engine.launch();
    } catch (e) {
      console.log(`${name.toUpperCase()}: SKIPPED — ${e.message.split('\n')[0].slice(0, 70)}`);
      continue;
    }
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('pageerror', e => consoleErrors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

    const problems = [];
    for (const w of WIDTHS) {
      const r = await probe(page, w);
      const issues = [];
      if (r.overflow) issues.push(`overflow ${r.overflow}px`);
      if (r.h1Count !== 1) issues.push(`h1=${r.h1Count}`);
      if (r.linksUnder44.length) issues.push(`small links: ${r.linksUnder44.join(',')}`);
      if (r.linksWithoutName.length) issues.push(`unnamed links: ${r.linksWithoutName.join(',')}`);
      if (r.headingJump) issues.push(`heading jump ${r.headingJump}`);
      if (r.sections.length < 3) issues.push(`sections=${r.sections.length}`);
      if (r.externalImages) issues.push(`${r.externalImages} external image(s)`);
      if (issues.length) problems.push(`${w}px: ${issues.join('; ')}`);
    }
    console.log(
      `${name.toUpperCase()}: ${problems.length ? problems.join(' | ') : `CLEAN at ${WIDTHS.join('/')}`}`
    );
    if (consoleErrors.length) console.log(`  console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
    await browser.close();
  }
})();

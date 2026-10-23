#!/usr/bin/env node
/* ============================================================
   Render public/illustrations/og-art.svg to public/og-image.png
   (1200x630), using a real browser canvas so the artwork is
   rasterised exactly as it will appear.

   No rasteriser is installed on this machine (no rsvg-convert, no
   magick, no cairosvg), so the render goes through the browser that
   Browser Control is already driving.

   Usage:
     npm run dev                    (in another terminal)
     node scripts/render-og.mjs
   ============================================================ */

import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = process.env.SITE_URL ?? 'http://127.0.0.1:5173/';
const SESSION = process.env.BC_SESSION ?? 'spain-v2';

const PAGE = `
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(SITE_URL + '_og-render.html', { waitUntil: 'load' });
await page.waitForFunction(() => typeof window.renderOg === 'function', { timeout: 15000 });
const dataUrl = await page.evaluate(() => window.renderOg(1200, 630));
/* Write the file from inside the browser-control process: the PNG
   is far too large to return through the JSON payload. The \`fs\`
   alias is callback-style node:fs, so use fs.promises. */
const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
await fs.promises.writeFile(OUT_PATH, buf);
return { bytes: buf.length };
`;

/* A tiny page that fetches the SVG and paints it to a canvas. */
const HTML = `<!doctype html><html><head><style>html,body{margin:0;background:#fdf3dd}</style></head><body>
<script>
window.renderOg = async function (w, h) {
  const svg = await fetch('/illustrations/og-art.svg').then(r => r.text());
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fdf3dd';
  ctx.fillRect(0, 0, w, h);
  const sr = img.width / img.height, dr = w / h;
  let sw, sh, sx, sy;
  if (sr > dr) { sh = img.height; sw = sh * dr; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / dr; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  return c.toDataURL('image/png');
};
</script></body></html>`;

const tmp = await mkdtemp(join(tmpdir(), 'render-og-'));
const pagePath = join(tmp, 'page.js');
const htmlPath = join(ROOT, 'public/_og-render.html');
const outPath = join(ROOT, 'public/og-image.png');
await writeFile(
  pagePath,
  PAGE
    .replace('OUT_PATH', JSON.stringify(outPath))
    .replace('SITE_URL', JSON.stringify(SITE)),
  'utf8'
);
await writeFile(htmlPath, HTML, 'utf8');

try {
  const res = await exec(
    'browser-control',
    ['execute', '--session', SESSION, '--file', pagePath, '--json'],
    { maxBuffer: 16 * 1024 * 1024 }
  );
  const payload = JSON.parse(res.stdout);
  if (payload.ok === false) {
    console.error(payload.error?.message ?? payload.text);
    process.exit(1);
  }
  const { size } = await stat(outPath);
  console.log(`wrote public/og-image.png (${size} bytes)`);
} finally {
  await rm(htmlPath, { force: true });
  await rm(tmp, { recursive: true, force: true });
}

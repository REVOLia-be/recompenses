// Génère les PNG (192, 512, apple-touch 180, maskable 512) à partir de public/icons/icon.svg.
// Utilise Playwright (Chromium) déjà présent sur la machine : `npm run icons`.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
const svg = readFileSync(join(root, 'icon.svg'), 'utf8');

const targets = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0 },
  // maskable : contenu dans la zone sûre (80 %)
  { file: 'icon-maskable-512.png', size: 512, pad: 0.1 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  const inner = Math.round(t.size * (1 - 2 * t.pad));
  const off = Math.round(t.size * t.pad);
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:#ffc2dc">` +
      `<div style="position:absolute;left:${off}px;top:${off}px;width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>` +
      `</body></html>`,
  );
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: t.size, height: t.size } });
  writeFileSync(join(root, t.file), buf);
  console.log('✓', t.file);
}
await browser.close();

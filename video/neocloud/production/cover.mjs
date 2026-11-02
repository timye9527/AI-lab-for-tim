// 封面：两套文案 × 三种比例 → out/final/cover-{a,b}-{wide,card,tall}.png
import { mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const ROOT = new URL('../', import.meta.url).pathname;
const { chromium } = createRequire(ROOT + 'out/package.json')('playwright-core');
const b = await chromium.launch({ executablePath: process.env.CHROME || ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => existsSync(p)) });
mkdirSync(ROOT + 'out/final', { recursive: true });
for (const cv of ['a', 'b']) for (const [v, w, h] of [['wide', 1920, 1080], ['card', 1080, 1440], ['tall', 1080, 1920]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(`file://${ROOT}production/cover.html?v=${v}&c=${cv}`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${ROOT}out/final/cover-${cv}-${v}.png` });
}
await b.close();
console.log('covers done');

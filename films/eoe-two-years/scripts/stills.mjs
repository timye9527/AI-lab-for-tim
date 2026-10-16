// 审片静帧：node scripts/stills.mjs 0.5 2.4 5.6 → review/t0.50.png …（SUBS=0 不带字幕）
import { writeFile, mkdir } from 'node:fs/promises';
import { serve } from './serve.mjs';
import { launch } from './browser.mjs';

const times = process.argv.slice(2).map(Number);
await mkdir(new URL('../review/', import.meta.url), { recursive: true });
const server = await serve(5177);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('[console]', m.text()));
await page.goto(`http://localhost:5177/src/render.html${process.env.SUBS === '0' ? '?subs=0' : ''}`);
await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
for (const t of times) {
  const b64 = await page.evaluate((x) => window.grab(x, 'image/jpeg', 0.85), t);
  const name = `${process.env.SET ? process.env.SET + '-' : ''}t${t.toFixed(2)}.jpg`;
  await writeFile(new URL(`../review/${name}`, import.meta.url), Buffer.from(b64, 'base64'));
  console.log('review/' + name);
}
await browser.close();
server.close();

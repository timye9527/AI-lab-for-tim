// 第四版审片静帧：node scripts/stills4.mjs 0.9 3.0 … → review/v4-t*.jpg
import { writeFile, mkdir } from 'node:fs/promises';
import { serve } from './serve.mjs';
import { launch } from './browser.mjs';
const times = process.argv.slice(2).map(Number);
await mkdir(new URL('../review/', import.meta.url), { recursive: true });
const server = await serve(5178);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto(`http://localhost:5178/${process.env.PAGE || 'src/v4/sample4.html'}`);
await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
for (const t of times) {
  const b64 = await page.evaluate((x) => window.grab(x, 'image/jpeg', 0.85), t);
  await writeFile(new URL(`../review/v4-t${t.toFixed(2)}.jpg`, import.meta.url), Buffer.from(b64, 'base64'));
}
await browser.close();
server.close();
console.log('ok', times.length);

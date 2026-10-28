// 逐帧渲染：无头 Chromium 跑 film/src/render.html，输出 JPEG 到 out/film/frames/
// FROM / TO 只渲染某一段（秒，只重渲受影响的段）；WORKERS 并行数（4 核机器默认 3）；SUBS=0 无字幕版
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { serve } from './serve.mjs';
import { launch } from './browser.mjs';

const nosub = process.env.SUBS === '0';
const out = new URL(`../../out/film/${nosub ? 'frames-nosub' : 'frames'}/`, import.meta.url);
const server = await serve();
const url = `http://localhost:${server.address().port}/film/src/render.html${nosub ? '?subs=0' : ''}`;
const browser = await launch();
const probe = await browser.newPage(); await probe.goto(url); await probe.waitForFunction('window.ready === true', null, { timeout: 60000 });
const DUR = await probe.evaluate(() => window.duration); await probe.close();
const FPS = 30, from = Number(process.env.FROM || 0), to = Number(process.env.TO || DUR);
const frames = [];
for (let i = 0; i < Math.round(DUR * FPS); i++) if (i / FPS >= from && i / FPS < to) frames.push(i);
if (!process.env.FROM && !process.env.TO) await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const workers = Number(process.env.WORKERS || 3);
let next = 0, done = 0; const t0 = Date.now();
async function worker() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.log('[error]', e.message));
  await page.goto(url); await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
  while (next < frames.length) {
    const i = frames[next++];
    const b64 = await page.evaluate((t) => window.grab(t, 'image/jpeg', 0.93), i / FPS);
    await writeFile(new URL(`f${String(i).padStart(5, '0')}.jpg`, out), Buffer.from(b64, 'base64'));
    if (++done % 300 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${done}/${frames.length}  ${(done / el).toFixed(1)} 帧/秒  剩约 ${((frames.length - done) / (done / el) / 60).toFixed(1)} 分钟`); }
  }
  await page.close();
}
await Promise.all(Array.from({ length: workers }, worker));
await browser.close(); server.close();
console.log(`完成 ${frames.length} 帧，${((Date.now() - t0) / 60000).toFixed(1)} 分钟`);

// 逐格渲染：用無頭 Chromium 執行 src/render.html，輸出 PNG 到 .frames/
// 選項：FPS=60 node scripts/render-frames.mjs；FROM / TO 只渲染某段（秒）
import { chromium } from 'playwright-core';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { cpus } from 'node:os';
import { serve } from './serve.mjs';
import { FPS as BASE_FPS, DURATION } from '../src/timeline.js';

const FPS = Number(process.env.FPS || BASE_FPS);
const from = Number(process.env.FROM || 0);
const to = Number(process.env.TO || DURATION);
const total = Math.round(DURATION * FPS);
const frames = [];
for (let i = 0; i < total; i++) if (i / FPS >= from && i / FPS < to) frames.push(i);
const out = new URL('../.frames/', import.meta.url);
if (!process.env.FROM && !process.env.TO) await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const server = await serve(5175);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--disable-gpu'] });
const workers = Number(process.env.WORKERS || Math.max(1, Math.min(6, cpus().length)));
let next = 0;
let done = 0;
const t0 = Date.now();
async function worker() {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[error]', e.message));
  await page.goto('http://localhost:5175/src/render.html');
  await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
  while (next < frames.length) {
    const i = frames[next++];
    // 以格的中點取樣時間
    const b64 = await page.evaluate((t) => window.grab(t, 'image/png'), i / FPS);
    await writeFile(new URL(`f${String(i).padStart(5, '0')}.png`, out), Buffer.from(b64, 'base64'));
    done++;
    if (done % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${frames.length}  ${(done / el).toFixed(1)} fps  剩約 ${((frames.length - done) / (done / el)).toFixed(0)}s`);
    }
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: workers }, worker));
await browser.close();
server.close();
console.log(`完成 ${frames.length} 格，${((Date.now() - t0) / 1000).toFixed(0)}s`);

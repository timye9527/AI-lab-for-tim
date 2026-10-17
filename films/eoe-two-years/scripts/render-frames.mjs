// 逐帧渲染：无头 Chromium 运行 src/render.html，输出 PNG 到 .frames/（SUBS=0 → .frames-nosub/）
// 选项：FPS=60；FROM / TO 只渲染某一段（秒）；WORKERS 并行数
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { cpus } from 'node:os';
import { serve } from './serve.mjs';
import { launch } from './browser.mjs';
import { FPS as BASE_FPS, DURATION } from '../src/timeline.js';

const FPS = Number(process.env.FPS || BASE_FPS);
// PAGE：要渲染的页面；DUR：总时长；FRAMES_DIR：输出目录（第三版动作测试等用）
const PAGE = process.env.PAGE || 'src/render.html';
const DUR = Number(process.env.DUR || DURATION);
const nosub = process.env.SUBS === '0';
const from = Number(process.env.FROM || 0);
const to = Number(process.env.TO || DUR);
const total = Math.round(DUR * FPS);
const frames = [];
for (let i = 0; i < total; i++) if (i / FPS >= from && i / FPS < to) frames.push(i);
const out = new URL(process.env.FRAMES_DIR ? `../${process.env.FRAMES_DIR}/` : nosub ? '../.frames-nosub/' : '../.frames/', import.meta.url);
if (!process.env.FROM && !process.env.TO) await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const server = await serve(5175);
const browser = await launch();
const workers = Number(process.env.WORKERS || Math.max(1, Math.min(4, cpus().length)));
let next = 0;
let done = 0;
const t0 = Date.now();
async function worker() {
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[error]', e.message));
  await page.goto(`http://localhost:5175/${PAGE}${nosub ? (PAGE.includes('?') ? '&' : '?') + 'subs=0' : ''}`);
  await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
  while (next < frames.length) {
    const i = frames[next++];
    const b64 = await page.evaluate((t) => window.grab(t, 'image/png'), i / FPS);
    await writeFile(new URL(`f${String(i).padStart(5, '0')}.png`, out), Buffer.from(b64, 'base64'));
    done++;
    if (done % 30 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${frames.length}  ${(done / el).toFixed(1)} fps  剩约 ${((frames.length - done) / (done / el)).toFixed(0)}s`);
    }
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: workers }, worker));
await browser.close();
server.close();
console.log(`完成 ${frames.length} 帧，${((Date.now() - t0) / 1000).toFixed(0)}s`);

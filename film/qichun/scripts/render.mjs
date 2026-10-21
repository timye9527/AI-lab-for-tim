// 逐帧渲染：无头 Chromium 打开场景页，每帧截图喂给 ffmpeg
// 用法：node scripts/render.mjs [--from 秒] [--to 秒] [--scale 0.5] [--fps 30] [--out out/film.mp4] [--still 秒,秒]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const scale = Number(arg('scale', 1));
const port = 8791 + Math.floor(Math.random() * 100);
const server = await serve(port);
const exe = process.env.CHROME || (fs.existsSync('/opt/pw-browsers/chromium') ? undefined : undefined);
const browser = await chromium.launch({
  executablePath: exe,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => document.body.dataset.ready || document.body.dataset.error, null, { timeout: 300000 });
const err = await page.evaluate(() => document.body.dataset.error);
if (err) { console.error(err); process.exit(1); }
const { fps: dfps, duration } = await page.evaluate(() => ({ fps: window.film.fps, duration: window.film.duration }));

const shot = async (t) => {
  await page.evaluate((t) => window.film.frame(t), t);
  return page.screenshot({ type: 'jpeg', quality: 94 });
};

const still = arg('still');
if (still) {
  fs.mkdirSync('out/stills', { recursive: true });
  for (const t of still.split(',').map(Number)) {
    fs.writeFileSync(`out/stills/t${String(t).padStart(5, '0')}.jpg`, await shot(t));
    console.log('still', t);
  }
} else {
  const fps = Number(arg('fps', dfps));
  const from = Number(arg('from', 0)), to = Number(arg('to', duration));
  const out = arg('out', 'out/film.mp4');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((to - from) * fps);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await shot(from + i / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 30 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`frame ${i}/${n}  ${(el / (i + 1)).toFixed(2)}s/帧  剩余约 ${Math.round(el / (i + 1) * (n - i) / 60)} 分钟`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('done', out);
}
await browser.close();
server.close();

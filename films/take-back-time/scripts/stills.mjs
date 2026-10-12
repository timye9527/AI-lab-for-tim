// 審片用：輸出指定時間點的靜幀與聯絡表
// node scripts/stills.mjs 0.5 2 4.6 ...   （不給參數則每秒一張）
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { serve } from './serve.mjs';

const times = process.argv.slice(2).map(Number);
if (!times.length) for (let t = 0.5; t < 32; t += 1) times.push(t);
const SET = process.env.SET || 'latest';
const out = new URL(`../review/${SET}/`, import.meta.url);
await mkdir(out, { recursive: true });
const server = await serve(5174);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined,  args: ['--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://localhost:5174/src/render.html');
await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
for (const t of times) {
  const b64 = await page.evaluate((t) => window.grab(t, 'image/jpeg', 0.9), t);
  const name = `t${t.toFixed(2).padStart(5, '0')}.jpg`;
  await writeFile(new URL(name, out), Buffer.from(b64, 'base64'));
  console.log(name);
}
await browser.close();
server.close();
// 聯絡表：3 欄
const { spawnSync } = await import('node:child_process');
const rows = Math.ceil(times.length / 3);
spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-pattern_type', 'glob', '-i', 't*.jpg', '-vf', `scale=640:-1,tile=3x${rows}:padding=4`, '-frames:v', '1', '../' + SET + '-sheet.jpg'], { cwd: out, stdio: 'inherit' });

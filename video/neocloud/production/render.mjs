// 画面渲染：按配音时间轴逐帧截图，直接喂给 ffmpeg
// 用法：
//   node production/render.mjs                       全片 → out/video/picture.mp4
//   node production/render.mjs --stills 3,95,200     抽帧检查 → out/stills/
//   node production/render.mjs --from 90 --to 120    渲染一段
//   --estimate  没有配音时按 270 字/分钟估算时间轴（只用于预览）
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname;
const require = createRequire(ROOT + 'out/package.json');
const { chromium } = require('playwright-core');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
const FPS = Number(opt('fps', 25));
const CHROME = process.env.CHROME || ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => existsSync(p));

function estimate() {
  const md = readFileSync(ROOT + '02-脚本-10分钟.md', 'utf8');
  let sec = -1, title = '', t = 0.6, prev = null; const lines = [];
  for (const raw of md.split('\n')) {
    if (raw.startsWith('## ')) { sec++; title = raw.slice(3).trim(); continue; }
    if (sec >= 0 && raw.startsWith('@pause')) { const p = Number(raw.split(/\s+/)[1]); t += 0.3; lines.push({ sec, title, text: '', pause: p, start: +t.toFixed(3), end: +(t + p).toFixed(3) }); t += p + 0.3; prev = sec; continue; }
    if (sec < 0 || !raw.startsWith('> ')) continue;
    const text = raw.slice(2).replace(/\s*\[F\d+\]\s*/g, '').trim();
    t += prev === null ? 0 : prev !== sec ? 0.9 : 0.2;
    if (/^第[一二三四五]刀/.test(text)) t += 0.6;
    const d = (text.match(/[\p{Script=Han}A-Za-z0-9]/gu) || []).length / 270 * 60;
    lines.push({ sec, title, text, start: +t.toFixed(3), end: +(t + d).toFixed(3) }); t += d; prev = sec;
  }
  const keep = opt('secs') ? opt('secs').split(',').map(Number) : null;
  return { duration: t + 2, lines: keep ? lines.filter(l => keep.includes(l.sec)) : lines };
}

const AUDIO = opt('audio', ROOT + 'out/audio') + '/';
const tlPath = AUDIO + 'timeline.json';
const TL = args.includes('--estimate') || !existsSync(tlPath) ? estimate() : JSON.parse(readFileSync(tlPath, 'utf8'));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => { console.error('页面错误：', e.message); process.exitCode = 1; });
await page.goto('file://' + ROOT + 'production/scenes.html');
await page.evaluate(tl => window.setup(tl), TL);

if (opt('stills')) {
  const SD = ROOT + 'out/stills/' + opt('tag', 'run') + '/'; mkdirSync(SD, { recursive: true });
  for (const s of opt('stills').split(',').map(Number)) {
    await page.evaluate(t => window.render(t), s);
    await page.screenshot({ path: `${SD}t${String(s).padStart(4, '0')}.png` });
  }
  console.log('stills done');
} else {
  const from = Number(opt('from', 0)), to = Number(opt('to', TL.duration));
  mkdirSync(ROOT + 'out/video', { recursive: true });
  const out = opt('out', ROOT + (from === 0 && to === TL.duration ? 'out/video/picture.mp4' : `out/video/part_${from}_${to}.mp4`));
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round((to - from) * FPS);
  const t0 = Date.now();
  for (let f = 0; f < N; f++) {
    await page.evaluate(t => window.render(t), from + f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % (FPS * 20) === 0) console.log(`${(from + f / FPS).toFixed(0)}s / ${to.toFixed(0)}s · ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  writeFileSync(ROOT + 'out/video/picture.meta.json', JSON.stringify({ fps: FPS, from, to, frames: N }));
  console.log('done', out);
}
await browser.close();

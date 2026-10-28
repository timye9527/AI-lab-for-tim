// 关键帧拼图（G5）：不渲染视频，只截静帧拼成 3×3
// node film/scripts/stills.mjs C01-C09 [取镜头内哪个位置 0..1，默认 0.6] → out/film/stills/C01-C09.png
// 也可以写具体时间：node film/scripts/stills.mjs t=12.5,40,80
import { writeFileSync, mkdirSync } from 'node:fs';
import { serve } from './serve.mjs';
import { launch } from './browser.mjs';
const [range = 'C01-C09', posArg = '0.6'] = process.argv.slice(2);
const server = await serve();
const b = await launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', (e) => console.log('[error]', e.message));
await p.goto(`http://localhost:${server.address().port}/film/src/render.html`);
await p.waitForFunction('window.ready === true', null, { timeout: 60000 });
const shots = await p.evaluate(() => window.shots);
let times;
if (range.startsWith('t=')) times = range.slice(2).split(',').map(Number).map((t) => [t.toFixed(1) + 's', t]);
else {
  const [lo, hi] = range.split('-'); const list = shots.filter((s) => s.id >= lo && s.id <= (hi || lo));
  times = list.flatMap((s) => posArg.split(',').map((f) => [s.id + (posArg.includes(',') ? '@' + f : ''), s.start + (s.end - s.start) * +f]));
}
const shotsPng = [];
for (const [name, t] of times) shotsPng.push([name, await p.evaluate((t) => window.grab(t, 'image/jpeg', 0.85), t)]);
// 拼图
const cols = 3, w = 640, h = 360, rows = Math.ceil(shotsPng.length / cols);
await p.setViewportSize({ width: cols * w, height: rows * h });
await p.setContent(`<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${w}px)">${shotsPng.map(([n, d]) => `<div style="position:relative;width:${w}px;height:${h}px"><img src="data:image/jpeg;base64,${d}" style="width:${w}px;height:${h}px"><span style="position:absolute;left:6px;top:4px;color:#fff;background:#000a;font:20px sans-serif;padding:0 6px">${n}</span></div>`).join('')}</body>`);
mkdirSync(new URL('../../out/film/stills/', import.meta.url), { recursive: true });
const out = new URL(`../../out/film/stills/${range.replace(/[^\w.-]/g, '_')}.png`, import.meta.url).pathname;
await p.screenshot({ path: out, fullPage: true });
await b.close(); server.close();
console.log('→', out);

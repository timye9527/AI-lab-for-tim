// 小红书图文卡片：黑底颗粒 + 荧光黄标签 + 撕纸卡片 + 蓝条，3:4（1080×1440）
// 用法：npm run xhs -- <稿件名>      读 xhs/posts/<稿件名>.mjs，输出到 out/xhs/<稿件名>/
// 字体：首次运行自动从 Google Fonts 下载思源黑体到 out/fonts/；浏览器同 npm run notes
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { lintText } from './lint-words.mjs';

const slug = process.argv[2];
if (!slug) { console.error('用法：npm run xhs -- <稿件名>'); process.exit(1); }
const post = (await import(pathToFileURL(resolve(`xhs/posts/${slug}.mjs`)).href)).default;

// —— 字体 ——
const fontDir = resolve('out/fonts');
mkdirSync(fontDir, { recursive: true });
const WEIGHTS = [500, 700, 900];
for (const w of WEIGHTS) {
  const file = `${fontDir}/NotoSansSC-${w}.ttf`;
  if (existsSync(file)) continue;
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@${w}`, { headers: { 'user-agent': 'curl/8' } })).text();
    const url = css.match(/url\((https:[^)]+)\)/)?.[1];
    writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
    console.log(`已下载字体 ${w}`);
  } catch { console.warn(`字体 ${w} 下载失败，改用系统字体`); }
}
const fontFace = WEIGHTS.filter((w) => existsSync(`${fontDir}/NotoSansSC-${w}.ttf`))
  .map((w) => `@font-face{font-family:"XHS";font-weight:${w};src:url("${pathToFileURL(`${fontDir}/NotoSansSC-${w}.ttf`).href}")}`).join('\n');

// —— 样式 ——
const C = { bg: '#141414', lime: '#e3f53c', blue: '#2f5cff', paper: '#f1ece0', ink: '#1d1d1d', white: '#f7f7f2', muted: '#8d8d86' };
const noise = (freq, op, oct = 3) => `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1440'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${oct}' seed='7' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='${op}'/></svg>`)}")`;
const CSS = `${fontFace}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1440px;overflow:hidden;background-color:${C.bg};background-image:${noise(0.9, 0.16)},${noise(0.012, 0.13, 4)};
  color:${C.white};font-family:"XHS","PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif;font-weight:700}
.page{position:absolute;inset:0;padding:56px 64px 64px;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px}
.tag{background:${C.lime};color:${C.ink};font-weight:900;font-size:38px;padding:8px 26px 10px;transform:rotate(-.6deg)}
.corner{color:${C.lime};font-size:30px;font-weight:900;padding-top:12px}
.title div{font-weight:900;line-height:1.14;letter-spacing:-.02em}
.white{color:${C.white}} .lime{color:${C.lime}}
.uline{display:inline-block;background:linear-gradient(${C.blue},${C.blue}) no-repeat 0 92%/100% 12px;padding-bottom:6px}
.torn{background:${C.paper};color:${C.ink};padding:40px 50px;margin-top:36px;box-shadow:0 10px 30px #0008}
.torn .kick{font-size:30px;color:#6b6b62;font-weight:700;margin-bottom:14px}
.torn .big{font-size:58px;font-weight:900;line-height:1.35}
.torn .big em{font-style:normal;background:${C.lime};padding:0 6px}
.row{display:grid;grid-template-columns:120px 1fr auto;align-items:center;gap:20px;font-size:44px;padding:22px 0;border-top:3px dashed #c9c3b3}
.row:first-of-type{border-top:0}
.row .y{color:#6b6b62;font-size:34px} .row b{font-weight:900} .row i{font-style:normal;font-size:34px;color:#6b6b62}
.bar{background:${C.blue};color:#fff;font-size:42px;font-weight:900;padding:20px 34px;margin-top:36px;align-self:flex-start;transform:rotate(-.4deg)}
.chip{background:${C.paper};color:${C.ink};font-size:30px;font-weight:900;padding:8px 20px;align-self:flex-start;margin-top:36px}
.notes{display:flex;flex-direction:column;gap:22px;margin-top:32px}
.note{background:${C.paper};color:${C.ink};padding:30px 40px 34px}
.note .lab{display:inline-block;background:${C.lime};font-size:30px;font-weight:900;padding:4px 14px;margin-bottom:12px}
.note p{font-size:44px;font-weight:500;line-height:1.55}
.say{margin-top:auto;padding-top:32px}
.say div{font-weight:900;line-height:1.3}
.ask{margin-top:auto;display:flex;align-items:center;gap:22px;color:${C.lime};font-size:46px;font-weight:900}
.push{margin-top:auto}
.src{margin-top:auto;padding-top:20px;color:${C.muted};font-size:26px;font-weight:500}
`;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// *星号* 包住的词在撕纸卡上加荧光底
const mark = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
const squiggle = `<svg width="70" height="40" viewBox="0 0 70 40"><path d="M4 30 C14 6 22 34 33 12 S52 30 66 6" fill="none" stroke="${C.lime}" stroke-width="6" stroke-linecap="round"/></svg>`;

const block = (b) => {
  switch (b.type) {
    case 'title': return `<div class="title">${b.lines.map((l) => `<div class="${l.c || 'white'}" style="font-size:${l.size || 120}px"><span class="${l.uline ? 'uline' : ''}">${esc(l.t)}</span></div>`).join('')}</div>`;
    case 'torn': return `<div class="torn">${b.kick ? `<div class="kick">${esc(b.kick)}</div>` : ''}${b.text ? `<div class="big"${b.size ? ` style="font-size:${b.size}px"` : ''}>${mark(b.text)}</div>` : ''}${(b.rows || []).map((r) => `<div class="row"><span class="y">${esc(r[0])}</span><b>${esc(r[1])}</b><i>${esc(r[2])}</i></div>`).join('')}</div>`;
    case 'bar': return `<div class="bar"${b.size ? ` style="font-size:${b.size}px"` : ''}>${esc(b.text)}</div>`;
    case 'chip': return `<div class="chip">${esc(b.text)}</div>`;
    case 'notes': return `<div class="notes">${b.items.map((n) => `<div class="note"><span class="lab">${esc(n.label)}</span><p>${mark(n.text)}</p></div>`).join('')}</div>`;
    case 'say': return `<div class="say">${b.lines.map((l) => `<div class="${l.c || 'white'}" style="font-size:${l.size || 64}px">${esc(l.t)}</div>`).join('')}</div>`;
    case 'ask': return `<div class="ask">${esc(b.text)}${squiggle}</div>`;
    case 'src': return `<div class="src">${esc(b.text)}</div>`;
    default: throw new Error(`未知块：${b.type}`);
  }
};

// 撕纸边：按元素实际尺寸生成锯齿 clip-path（固定种子，每次一样）
const TORN_JS = `(() => { let s = 11; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (const el of document.querySelectorAll('.torn,.note')) {
    const w = el.offsetWidth, h = el.offsetHeight, a = 7, p = [];
    for (let x = 0; x < w; x += 9 + r() * 12) p.push([x, r() * a]);
    for (let y = 0; y < h; y += 9 + r() * 12) p.push([w - r() * a, y]);
    for (let x = w; x > 0; x -= 9 + r() * 12) p.push([x, h - r() * a]);
    for (let y = h; y > 0; y -= 9 + r() * 12) p.push([r() * a, y]);
    el.style.clipPath = 'polygon(' + p.map(([x, y]) => x.toFixed(1) + 'px ' + y.toFixed(1) + 'px').join(',') + ')';
  } })();`;

const html = (pg) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="page"><div class="top"><span class="tag">${esc(post.series)}</span><span class="corner">${esc(pg.corner || '')}</span></div>
${pg.blocks.map(block).join('\n')}</div><script>${TORN_JS}</script></body></html>`;

// —— 合规扫描 ——
const allText = JSON.stringify(post);
const hits = lintText(allText);

// —— 截图 ——
const { chromium } = await import('playwright-core');
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LINUX_PW = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const executablePath = process.env.CHROME_PATH || [MAC_CHROME, LINUX_PW].find((p) => existsSync(p));
const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' });
const tab = await browser.newPage({ viewport: { width: 1080, height: 1440 } });
const dir = resolve(`out/xhs/${slug}`);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
for (const [i, pg] of post.pages.entries()) {
  await tab.setContent(html(pg), { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  // 内容超出画布就报错，别悄悄截掉
  const over = await tab.evaluate(() => document.querySelector('.page').scrollHeight > 1440);
  if (over) console.warn(`⚠️ 第 ${i + 1} 页内容超出画布`);
  await tab.screenshot({ path: `${dir}/${String(i + 1).padStart(2, '0')}.png` });
}
await browser.close();

writeFileSync(`${dir}/文案.txt`, `${post.title}\n\n${post.body}\n\n${post.tags.map((t) => `#${t}`).join(' ')}\n`);
console.log(`已生成 ${post.pages.length} 张图 → out/xhs/${slug}/`);
console.log(hits.length ? `⚠️ 高危词：${hits.join('、')}（发布前人工确认）` : '高危词：0 命中');

// 一期视频的完整生产：脚本文档 → 配音 → 字幕 → 逐帧渲染 → 合成 mp4。
// 用法：node factory/video/build.mjs <期目录> [--check] [--stills] [--no-video]
//   --check     配音后用语音识别回听，列出可能读错的句子
//   --stills    只导出几张关键帧，用来快速看版式
//   --no-video  只出配音、字幕和脚本文档
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const args = process.argv.slice(2);
const epDir = resolve(args.find((a) => !a.startsWith('--')) || '');
const flag = (f) => args.includes(f);
const FPS = 25;
const W = 1080, H = 1920;

const ep = (await import(pathToFileURL(join(epDir, 'episode.mjs')))).default;
const out = join(ROOT, 'out', 'video', ep.id);
mkdirSync(out, { recursive: true });

// 1. 拍子展开，交给配音
const beats = [];
ep.scenes.forEach((s, si) => s.beats.forEach((b, bi) => {
  const o = typeof b === 'string' ? { say: b } : b;
  const last = bi === s.beats.length - 1;
  beats.push({ si, bi, say: o.say, text: o.tts || o.say, gap: last ? (s.gap ?? 0.7) : 0.34 });
}));
writeFileSync(join(out, 'beats.json'), JSON.stringify({ voice: ep.voice, beats }, null, 1));
const py = spawnSync('python3', [join(HERE, 'tts.py'), join(out, 'beats.json'), out, ...(flag('--check') ? ['--check'] : [])], { stdio: 'inherit' });
if (py.status !== 0) process.exit(1);
const tl = JSON.parse(readFileSync(join(out, 'timeline.json'), 'utf8'));
tl.beats.forEach((t, i) => Object.assign(beats[i], t));

// 2. 页面和章节的时间
const scenes = ep.scenes.map((s, si) => ({ beats: beats.filter((b) => b.si === si) }));
scenes.forEach((sc, i) => {
  const prev = scenes[i - 1];
  sc.start = i === 0 ? 0 : (prev.beats.at(-1).end + sc.beats[0].start) / 2 - 0.1;
});
scenes.forEach((sc, i) => { sc.end = i < scenes.length - 1 ? scenes[i + 1].start : tl.duration + 1.5; });
const duration = scenes.at(-1).end;
const chapters = ep.chapters.map((_, c) => {
  const first = ep.scenes.findIndex((s) => s.chapter === c);
  const next = ep.scenes.findIndex((s) => s.chapter != null && s.chapter > c);
  return { start: scenes[first].start, end: next < 0 ? duration : scenes[next].start };
});

// 3. 字幕：按标点切块，每块不超过 18 字，按字数分配时长
function chunks(say) {
  const parts = say.split(/(?<=[，。！？；：])/).map((x) => x.trim()).filter(Boolean);
  const res = [];
  for (const p of parts) {
    const clean = p.replace(/[，。；：]$/, '');
    // 英文和数字整体不拆；超长时在接近均分的位置断开，顿号处优先
    const units = clean.match(/[A-Za-z0-9.%–]+|./gu);
    const n = Math.ceil([...clean].length / 18);
    const size = [...clean].length / n;
    let buf = '', cut = 0;
    units.forEach((u, i) => {
      buf += u;
      const len = [...buf].length;
      const atComma = u === '、' && len >= size * 0.6;
      if (cut < n - 1 && i < units.length - 1 && (len >= size || atComma)) { res.push(buf.replace(/、$/, '')); buf = ''; cut++; }
    });
    if (buf) res.push(buf);
  }
  // 太短的块并到后一块
  for (let i = 0; i < res.length - 1; i++) {
    if ([...res[i]].length <= 3 && [...res[i] + res[i + 1]].length <= 18) { res[i + 1] = res[i] + ' ' + res[i + 1]; res.splice(i, 1); i--; }
  }
  return res;
}
const subs = [];
for (const b of beats) {
  const cs = chunks(b.say);
  const weights = cs.map((c) => [...c].length + 2);
  const total = weights.reduce((a, x) => a + x, 0);
  let t = b.start;
  cs.forEach((c, i) => {
    const d = (b.end - b.start) * weights[i] / total;
    subs.push({ start: +t.toFixed(3), end: +(i === cs.length - 1 ? b.end + Math.min(b.gap, 0.25) : t + d).toFixed(3), text: c });
    t += d;
  });
}
const ts = (x) => {
  const ms = Math.round(x * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
writeFileSync(join(out, 'subs.srt'), subs.map((s, i) => `${i + 1}\n${ts(s.start)} --> ${ts(s.end)}\n${s.text}\n`).join('\n'));

// 4. 脚本文档（提交进仓库，给人看和改）
const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
const desc = (el) => {
  switch (el.t) {
    case 'quote': return `大字引文「${el.lines.join(' / ')}」${el.red ? `，标红：${el.red.join('、')}` : ''}`;
    case 'lead': return `引导语「${el.text}」`;
    case 'h': return `大标题「${el.text}」`;
    case 'p': case 'tag': return `小字「${el.text}」`;
    case 'note': return `解读卡「${el.text}」`;
    case 'agenda': return `章节预告：${el.items.map((x) => x.n + ' ' + x.title).join('，')}（随口播逐个点亮，顶部章节栏同步高亮）`;
    case 'profile': return `人物卡「${el.name}｜${el.role}」：${el.items.map((x) => x.y + ' ' + x.text).join('；')}`;
    case 'stats': return `数据卡：${el.items.map((x) => x.value + ' ' + x.label).join('；')}`;
    case 'grid': return `卡片网格（当前一条红框）：${el.items.map((x) => x.n + '. ' + x.title + (x.from ? `（${x.from}）` : '')).join('；')}`;
    case 'ladder': return `阶梯图：${el.items.map((x) => x.title).join(' → ')}`;
    case 'fork': return `分叉图：造神的故事 → ${el.left.title} / ${el.right.title}`;
    case 'compare': return `左右对比：${el.left.title}（${el.left.items.join('，')}） vs ${el.right.title}（${el.right.items.join('，')}）`;
    case 'flow': return `流向图：${el.left} →（${el.mid}）→ ${el.right}`;
    case 'bars': return '柱状示意：少数头部公司高高在上，大量企业被冷落';
    case 'chips': return `地区卡片（筷子图标）：${el.items.join('、')}`;
    case 'zero': return '等式动画：+赚 ＋ −亏 ≈ 0';
    case 'church': return '图解：教堂（创造价值）+ 旁边的赌场（附带的成本）';
    case 'wall': return `金句墙 12 格，随口播逐条点亮`;
    case 'sources': return '来源和免责声明';
  }
  return el.t;
};
let md = `# ${ep.id} · ${ep.title.text}\n\n> 由 \`episode.mjs\` 生成，改内容请改 episode.mjs 后重跑 \`npm run video -- ${basename(epDir)}\`。\n> 总时长 ${mmss(duration)}，${ep.scenes.length} 页，口播 ${beats.reduce((a, b) => a + [...b.say].length, 0)} 字。\n\n`;
let lastCh;
ep.scenes.forEach((s, si) => {
  if (s.chapter !== lastCh) {
    lastCh = s.chapter;
    md += `\n## ${s.chapter == null ? '00 开场钩子' : s.chapter < ep.chapters.length ? String(s.chapter + 1).padStart(2, '0') + ' ' + ep.chapters[s.chapter] : '收尾 · 12 条金句'}\n\n`;
  }
  md += `### ${si + 1}. ${s.label} 〔${mmss(scenes[si].start)}–${mmss(scenes[si].end)}〕\n\n**画面**\n\n${s.els.map((e) => `- ${desc(e)}`).join('\n')}\n\n**口播**\n\n${scenes[si].beats.map((b) => `- ${b.say}`).join('\n')}\n\n`;
});
md += `\n## 来源\n\n${ep.sources.map((x) => `- ${x}`).join('\n')}\n\n${ep.disclaimer}\n`;
writeFileSync(join(epDir, '脚本.md'), md);
console.log(`脚本：${join(epDir, '脚本.md')}\n字幕：${join(out, 'subs.srt')}\n时长：${mmss(duration)}`);
if (flag('--no-video')) process.exit(0);

// 5. 渲染
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(pathToFileURL(join(HERE, 'player.html')).href);
const data = { ep: { ...ep }, scenes: scenes.map((s) => ({ start: s.start, end: s.end, beats: s.beats.map((b) => ({ start: b.start, end: b.end })) })), chapters, subs, duration };
await page.evaluate((d) => window.init(d), data);
await page.evaluate(async () => {
  for (const w of [400, 500, 700]) await document.fonts.load(`${w} 40px Sans`, '中');
  for (const w of [700, 900]) await document.fonts.load(`${w} 40px Serif`, '中');
  await document.fonts.ready;
});

if (flag('--stills')) {
  // 每页取中间一帧，拼成一张总览图
  const dir = join(out, 'stills');
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < scenes.length; i++) {
    const t = scenes[i].end - 0.4;
    await page.evaluate((x) => window.render(x), t);
    await page.screenshot({ path: join(dir, `${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 85 });
  }
  await browser.close();
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', join(dir, '*.jpg'),
    '-vf', 'scale=270:480,tile=8x3:padding=6:color=white', '-frames:v', '1', join(out, 'stills.jpg')], { stdio: 'inherit' });
  console.log(`关键帧：${dir}\n总览：${join(out, 'stills.jpg')}`);
  process.exit(0);
}

const mp4 = join(out, `${ep.id}.mp4`);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-i', join(out, 'voice.wav'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '160k', '-af', 'apad', '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
const frames = Math.ceil(duration * FPS);
let lastSig = null, lastBuf = null, shots = 0;
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const t = i / FPS;
  const sig = await page.evaluate((x) => window.render(x), t);
  if (sig !== lastSig) {
    lastBuf = await page.screenshot({ type: 'jpeg', quality: 92 });
    lastSig = sig;
    shots++;
  }
  if (!ff.stdin.write(lastBuf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % (FPS * 30) === 0) console.log(`渲染 ${mmss(t)} / ${mmss(duration)}，截图 ${shots} 张，用时 ${Math.round((Date.now() - t0) / 1000)} 秒`);
  // 顺手留封面和金句长图
  if (i === Math.round(3.2 * FPS)) writeFileSync(join(out, 'cover.jpg'), lastBuf);
}
const wall = ep.scenes.findIndex((s) => s.els.some((e) => e.t === 'wall'));
if (wall >= 0) {
  await page.evaluate((x) => window.render(x), scenes[wall].end - 0.3);
  await page.screenshot({ path: join(out, 'quotes.jpg'), type: 'jpeg', quality: 92 });
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log(`完成：${mp4}（${mmss(duration)}，截图 ${shots} 张，用时 ${Math.round((Date.now() - t0) / 1000)} 秒）`);

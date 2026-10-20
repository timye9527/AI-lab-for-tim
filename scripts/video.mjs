// 渲染一集视频：长视频（16:9）+ Shorts（9:16）+ 封面 + 字幕 + YouTube 说明文字
// 用法：npm run video -- <集id> [--preview] [--only long,shorts,thumb] [--fps 30] [--no-tts]
// 输出到 out/video/<集id>/；需要 ffmpeg 和 Chrome / Chromium（同 npm run notes）
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { IMAGE_STYLE, REQUIRED, TEMPLATES, resolveTheme, sceneHTML, thumbHTML } from '../video/engine/scenes.js';

const argv = process.argv.slice(2);
const flag = (k) => argv.includes(`--${k}`);
const opt = (k, def) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def;
};
const id = argv.find((a, i) => !a.startsWith('--') && !argv[i - 1]?.match(/^--(only|fps)$/)) || 'demo';
const preview = flag('preview');
const FPS = Number(opt('fps', preview ? 15 : 30));
const only = opt('only', 'long,shorts,thumb').split(',');
const SRC = `video/episodes/${id}`;
const OUT = `out/video/${id}`;
const ep = (await import(`../${SRC}/episode.js`)).default;
const th = resolveTheme(ep.theme || 'dark');
mkdirSync(`${OUT}/tts`, { recursive: true });

// —— 1. 校验 + 合规词 ——
// 港澳 / YouTube 财经内容的高危说法：命中不一定违规，但发布前必须人工看一眼
const RISKY = ['必升', '必跌', '穩賺', '稳赚', '保證回報', '保证回报', '保本', '包賺', '目標價', '目标价', '即刻買', '快啲買', '入貨', '沽貨', '翻倍', '十倍股', '內幕', '跟單', '貼士', '推介'];
let bad = 0;
const fail = (m) => (bad++, console.log('  ✗ ' + m));
ep.scenes.forEach((s, i) => {
  const at = `第 ${i + 1} 個場景（${s.type}）`;
  if (!TEMPLATES[s.type]) return fail(`${at} 未知類型`);
  for (const f of REQUIRED[s.type]) if (s[f] == null) fail(`${at} 缺 ${f}`);
  if (!s.say) fail(`${at} 缺口播稿 say`);
  if (s.short && !ep.shorts?.[s.short]) fail(`${at} 用咗未定義嘅 short「${s.short}」`);
});
for (const f of ['brand', 'title', 'thumb', 'disclaimer']) if (!ep[f]) fail(`缺 ${f}`);
if (!th) fail(`未知主題 ${ep.theme}`);

// 图片素材转成 data URL 塞进页面：插画放 img/，主持人两张图（闭嘴 / 张嘴）
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };
const asset = (name) => {
  const f = /\.\w+$/.test(name) ? `${SRC}/${name}` : Object.keys(MIME).map((x) => `${SRC}/${name}.${x}`).find(existsSync);
  if (!f || !existsSync(f)) return null;
  return `data:${MIME[f.split('.').pop().toLowerCase()]};base64,${readFileSync(f).toString('base64')}`;
};
// 插画提示词清单：交给文生图模型出图，存成 img/<名>.png
const sketches = ep.scenes.filter((s) => s.type === 'sketch');
if (sketches.length) {
  writeFileSync(`${OUT}/image-prompts.txt`, sketches.map((s) => `【${s.img}】→ ${SRC}/img/${s.img}.png\n${IMAGE_STYLE} ${s.prompt || '（未寫 prompt）'}\n`).join('\n'));
}
for (const [i, s] of ep.scenes.entries()) {
  if (s.type !== 'sketch') continue;
  s._src = asset(`img/${s.img}`);
  if (!s._src) fail(`第 ${i + 1} 個場景搵唔到插畫 ${SRC}/img/${s.img}.*（提示詞見 ${OUT}/image-prompts.txt）`);
}
let host = null;
if (ep.host) {
  host = { closed: asset(ep.host.closed), open: asset(ep.host.open), height: ep.host.height || 380 };
  if (!host.closed || !host.open) fail(`搵唔到主持人圖 ${ep.host.closed} / ${ep.host.open}`);
}
if (bad) process.exit(1);
const allText = JSON.stringify(ep);
const hits = RISKY.filter((w) => allText.includes(w));
if (hits.length) console.log(`⚠️ 含高危說法：${hits.join('、')}（發布前人工確認）`);
if (allText.includes('發布前核對')) console.log('⚠️ 有數據標住「發布前核對」，出街前要逐個核實');

// —— 2. 配音：真人录音 > edge-tts > 按字数估时长（静音）——
const probe = (f) => parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout) || 0;
const hasTTS = !flag('no-tts') && !spawnSync('edge-tts', ['--help'], { stdio: 'ignore' }).error;
const PUNC = /[，。！？；：、,.!?;:「」『』（）()…—\s]/;
const speechChars = (s) => [...s].filter((c) => !PUNC.test(c)).length;
// 粤语口播大约每秒 5 个字，每个标点停顿 0.2 秒
const estimate = (s) => speechChars(s) / 5 + ([...s].filter((c) => /[，。！？；：,.!?;:]/.test(c)).length * 0.2);
let ttsWarned = false;

const timeline = [];
let clock = 0;
for (const [i, s] of ep.scenes.entries()) {
  const key = s.id || String(i + 1).padStart(2, '0');
  let audio = ['wav', 'mp3', 'm4a'].map((x) => `${SRC}/audio/${key}.${x}`).find(existsSync);
  if (!audio && hasTTS) {
    const h = createHash('md5').update(`${ep.voice}|${ep.rate}|${s.say}`).digest('hex').slice(0, 8);
    const f = `${OUT}/tts/${key}-${h}.mp3`;
    if (!existsSync(f)) {
      const r = spawnSync('edge-tts', ['--voice', ep.voice || 'zh-HK-WanLungNeural', `--rate=${ep.rate || '+0%'}`, '--text', s.say, '--write-media', f], { stdio: 'pipe' });
      if (r.status !== 0) console.log(`⚠️ 第 ${key} 段配音失敗：${String(r.stderr).trim().split('\n').pop()}`);
    }
    if (existsSync(f) && probe(f) > 0) audio = f;
  }
  if (!audio && !ttsWarned) {
    ttsWarned = true;
    console.log(hasTTS ? '⚠️ 部分場景冇配音，用估算時長' : 'ℹ️ 冇真人錄音，亦未裝 edge-tts（pip install edge-tts），先出無聲版，時長按字數估算');
  }
  const speech = audio ? probe(audio) : estimate(s.say);
  const lead = i === 0 ? 0.15 : 0.35;
  const tail = s.type === 'chapter' ? 0.7 : 0.5;
  const dur = Math.max(s.min || 2.5, lead + speech + tail);
  // 画面停太久容易流失：逐个出现元素的场景放宽到 20 秒
  const maxDur = s.type === 'hook' ? 13 : ['bullets', 'flow', 'compare', 'bars', 'sketch'].includes(s.type) ? 20 : 12;
  if (dur > maxDur) console.log(`⚠️ 第 ${key} 段（${s.type}）有 ${dur.toFixed(0)} 秒，建議拆開或者刪減口播`);
  timeline.push({ s, key, audio, speech, lead, dur, start: clock });
  clock += dur;
}
const TOTAL = clock;

// —— 3. 字幕：按标点切句，每句不超过 maxLen 字，时长按字数分配 ——
function cuesFor(item, maxLen) {
  const parts = [];
  for (const seg of item.s.say.split(/(?<=[，。！？；：,!?;:])/)) {
    let txt = seg.replace(/[，。！？；：,!?;:]$/, '').trim();
    if (!txt) continue;
    // 太长就切开：优先切在「嘅、咗」之后或「同、但、就」之前，不切断数字和英文
    while ([...txt].length > maxLen) {
      const arr = [...txt];
      const ideal = Math.ceil(arr.length / Math.ceil(arr.length / maxLen));
      const ok = (c) => c > 1 && c < arr.length - 1 && !(/[\w零一二三四五六七八九十百千萬億]/.test(arr[c - 1]) && /[\w零一二三四五六七八九十百千萬億]/.test(arr[c]));
      const nice = (c) => ok(c) && (/[嘅咗吓]/.test(arr[c - 1]) || /[同但就再又將而即]/.test(arr[c]));
      let cut = ideal;
      for (let off = 0; off <= 5; off++) {
        const hit = [ideal - off, ideal + off].find((c) => c <= maxLen && nice(c));
        if (hit) { cut = hit; break; }
      }
      if (!nice(cut)) for (let off = 0; off <= 5; off++) { const hit = [ideal - off, ideal + off].find((c) => c <= maxLen && ok(c)); if (hit) { cut = hit; break; } }
      parts.push(arr.slice(0, cut).join(''));
      txt = arr.slice(cut).join('');
    }
    parts.push(txt);
  }
  // 太短的并到上一句
  const merged = [];
  for (const p of parts) {
    const prev = merged[merged.length - 1];
    if (prev && [...p].length <= 3 && [...prev].length + [...p].length + 1 <= maxLen) merged[merged.length - 1] = `${prev} ${p}`;
    else merged.push(p);
  }
  const w = merged.map((p) => speechChars(p) + 1);
  const sum = w.reduce((a, b) => a + b, 0);
  let t = item.lead;
  return merged.map((text, k) => {
    const len = (w[k] / sum) * item.speech;
    const c = { start: +t.toFixed(3), end: +(t + len).toFixed(3), text: text.replace(/[、，]/g, ' ') };
    t += len;
    return c;
  });
}

// 场景所属章节（长视频右上角显示）
let chap = null;
for (const it of timeline) {
  if (it.s.type === 'chapter') chap = { no: it.s.no, title: it.s.title };
  it.chapter = chap;
}

// 主持人嘴型：有配音就按每帧音量，音量超过响段的 35% 算张嘴；没有配音就在说话时段里按固定节奏假装
function mouthTrack(it, n) {
  const out = new Array(n).fill('0');
  if (it.audio) {
    const SR = 16000;
    const buf = spawnSync('ffmpeg', ['-v', 'error', '-i', it.audio, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 }).stdout;
    const pcm = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length - (buf.length % 4)));
    const win = SR / FPS;
    const rms = out.map((_, f) => {
      const a = Math.floor((f / FPS - it.lead) * SR);
      if (a < 0 || a >= pcm.length) return 0;
      let sum = 0, c = 0;
      for (let k = a; k < Math.min(pcm.length, a + win); k++, c++) sum += pcm[k] * pcm[k];
      return Math.sqrt(sum / Math.max(1, c));
    });
    const loud = rms.filter((x) => x > 0).sort((a, b) => a - b);
    const ref = loud[Math.floor(loud.length * 0.9)] || 0;
    rms.forEach((v, f) => (out[f] = ref && v > ref * 0.35 ? '1' : '0'));
  } else {
    for (let f = 0; f < n; f++) {
      const t = f / FPS - it.lead;
      if (t >= 0 && t < it.speech) out[f] = (f * 7) % 11 < 6 ? '1' : '0';
    }
  }
  // 去掉只闪一帧的开合
  for (let f = 1; f < n - 1; f++) if (out[f] !== out[f - 1] && out[f] !== out[f + 1]) out[f] = out[f - 1];
  return out.join('');
}

// —— 4. 画面：逐帧拨动动画并截图，管道送进 ffmpeg ——
let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.log('缺少 playwright-core，先運行 npm install');
  process.exit(1);
}
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const exe = process.env.CHROME_PATH || (existsSync(MAC_CHROME) ? MAC_CHROME : undefined);
const browser = await chromium.launch(exe ? { executablePath: exe } : {}).catch(() => chromium.launch({ channel: 'chrome' }));

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, no) => p.on('close', (c) => (c === 0 ? ok() : no(new Error(`ffmpeg 退出码 ${c}`)))));
  return { p, done };
}

async function renderFrames(items, { portrait, file, shortTitle }) {
  const [W, H] = portrait ? [1080, 1920] : [1920, 1080];
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: preview ? 0.5 : 1 });
  const page = await ctx.newPage();
  const ff = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', preview ? 'ultrafast' : 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', file]);
  const total = items.reduce((a, it) => a + it.dur, 0);
  let g = 0;
  let shots = 0;
  let frames = 0;
  for (const it of items) {
    const cues = cuesFor(it, portrait ? 11 : 18);
    // 帧数按累计时间取整，保证音画不漂
    const n = Math.round((g + it.dur) * FPS) - Math.round(g * FPS);
    const mouth = host ? mouthTrack(it, n) : '';
    await page.setContent(sceneHTML(ep, th, it.s, it, { portrait, cues, chapter: portrait ? null : it.chapter, globalStart: g, total, shortTitle, host, mouth, fps: FPS }), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const animEnd = await page.evaluate(() => window.__animEnd);
    let lastKey = null;
    let buf = null;
    for (let f = 0; f < n; f++) {
      const t = (f / FPS) * 1000;
      const k = await page.evaluate((t) => window.__seek(t), t);
      // 入场动画结束后，只有字幕或进度条变了才重新截图
      const key = t <= animEnd + 40 ? `a${f}` : `s${k}`;
      if (key !== lastKey) {
        buf = await page.screenshot({ type: 'jpeg', quality: 90 });
        lastKey = key;
        shots++;
      }
      if (!ff.p.stdin.write(buf)) await once(ff.p.stdin, 'drain');
      frames++;
    }
    g += it.dur;
    process.stdout.write(`\r  ${file.split('/').pop()}：${Math.round((g / total) * 100)}%`);
  }
  ff.p.stdin.end();
  await ff.done;
  await ctx.close();
  process.stdout.write(`（${frames} 幀，實際截圖 ${shots} 張）\n`);
  return { cuesList: items.map((it) => cuesFor(it, portrait ? 11 : 18)) };
}

// —— 5. 音轨：每段配音按场景对齐，可选背景音乐自动闪避，响度统一到 -14 LUFS（YouTube 标准）——
async function renderAudio(items, file) {
  const args = [];
  const fl = [];
  let n = 0;
  items.forEach((it, k) => {
    if (it.audio) {
      args.push('-i', it.audio);
      const lead = Math.round(it.lead * 1000);
      fl.push(`[${n++}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${lead}|${lead},apad,atrim=0:${it.dur.toFixed(3)}[a${k}]`);
    } else {
      fl.push(`anullsrc=r=48000:cl=stereo,atrim=0:${it.dur.toFixed(3)}[a${k}]`);
    }
  });
  fl.push(`${items.map((_, k) => `[a${k}]`).join('')}concat=n=${items.length}:v=0:a=1[voice]`);
  const total = items.reduce((a, it) => a + it.dur, 0);
  const bgm = ['mp3', 'm4a', 'wav'].map((x) => `${SRC}/bgm.${x}`).find(existsSync);
  let last = 'voice';
  if (bgm) {
    args.push('-stream_loop', '-1', '-i', bgm);
    fl.push(`[${n++}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${ep.bgmVolume ?? 0.15},atrim=0:${total.toFixed(3)}[bg]`,
      '[voice]asplit[v1][v2]', '[bg][v2]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[bgd]',
      '[v1][bgd]amix=inputs=2:duration=first:normalize=0[mix]');
    last = 'mix';
  }
  if (items.some((it) => it.audio) || bgm) {
    fl.push(`[${last}]loudnorm=I=-14:TP=-1.5:LRA=11[out]`);
    last = 'out';
  }
  const ff = ffmpeg([...args, '-filter_complex', fl.join(';'), '-map', `[${last}]`, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', file]);
  ff.p.stdin.end();
  await ff.done;
}

async function mux(v, a, file) {
  const ff = ffmpeg(['-i', v, '-i', a, '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', file]);
  ff.p.stdin.end();
  await ff.done;
}

const tc = (s, srt) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (srt) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(Math.round((s % 1) * 1000)).padStart(3, '0')}`;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};

// —— 长视频 ——
if (only.includes('long')) {
  console.log(`【${ep.title}】${timeline.length} 個場景，共 ${tc(TOTAL)}`);
  const { cuesList } = await renderFrames(timeline, { portrait: false, file: `${OUT}/_video.mp4` });
  await renderAudio(timeline, `${OUT}/_audio.m4a`);
  await mux(`${OUT}/_video.mp4`, `${OUT}/_audio.m4a`, `${OUT}/long.mp4`);

  // 字幕文件：上传 YouTube 当 CC 字幕，利于搜索
  let srt = '';
  let k = 0;
  timeline.forEach((it, i) => cuesList[i].forEach((c) => (srt += `${++k}\n${tc(it.start + c.start, true)} --> ${tc(it.start + c.end, true)}\n${c.text}\n\n`)));
  writeFileSync(`${OUT}/long.srt`, srt);

  // 章节：YouTube 要求第一个是 0:00，至少 3 个，每个不短于 10 秒
  const chapters = [{ t: 0, title: '開場' }, ...timeline.filter((it) => it.s.type === 'chapter').map((it) => ({ t: it.start, title: it.s.title }))];
  const tooShort = chapters.some((c, i) => (chapters[i + 1]?.t ?? TOTAL) - c.t < 10);
  if (chapters.length < 3 || tooShort) console.log('⚠️ 章節少過 3 個或者有章節短過 10 秒，YouTube 唔會顯示章節');
  const tags = ep.tags || [];
  writeFileSync(`${OUT}/youtube.txt`, `【標題】（${[...ep.title].length} 字，建議 40 字內，關鍵詞放最前）
${ep.title}

【說明】
${ep.description || ''}

${chapters.map((c) => `${tc(c.t)} ${c.title}`).join('\n')}

${tags.slice(0, 3).map((t) => `#${t}`).join(' ')}

${ep.disclaimer}

【標籤】
${tags.join(',')}
`);
  writeFileSync(`${OUT}/timeline.json`, JSON.stringify(timeline.map((it) => ({ key: it.key, type: it.s.type, start: +it.start.toFixed(2), dur: +it.dur.toFixed(2), voice: it.audio || '估算' })), null, 2));
}

// —— Shorts ——
if (only.includes('shorts')) {
  for (const [name, cfg] of Object.entries(ep.shorts || {})) {
    const items = timeline.filter((it) => it.s.short === name);
    if (!items.length) continue;
    const len = items.reduce((a, it) => a + it.dur, 0);
    if (len > 60) console.log(`⚠️ Short ${name} 有 ${len.toFixed(0)} 秒，超過 60 秒完播率會跌`);
    await renderFrames(items, { portrait: true, file: `${OUT}/_short-${name}.mp4`, shortTitle: cfg.title });
    await renderAudio(items, `${OUT}/_short-${name}.m4a`);
    await mux(`${OUT}/_short-${name}.mp4`, `${OUT}/_short-${name}.m4a`, `${OUT}/short-${name}.mp4`);
  }
}

// —— 封面 ——
if (only.includes('thumb')) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const ph = ['png', 'webp'].map((x) => `${SRC}/host.${x}`).find(existsSync);
  const photo = ph && `data:image/${ph.split('.').pop()};base64,${readFileSync(ph).toString('base64')}`;
  await page.setContent(thumbHTML(ep, th, photo, ep.thumb.img && asset(`img/${ep.thumb.img}`)), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/thumb.png` });
  await ctx.close();
}

await browser.close();
console.log(`完成 → ${OUT}/`);

// 成片体检：规格、响度、黑屏、静音、画面长时间不动、字幕，外加一张抽帧拼图
// 用法：node scripts/video-final.mjs <成片.mp4> [--platform douyin|xhs|shipinhao|bilibili|youtube|shorts] [--srt 字幕.srt] [--sheet 拼图.jpg]
// 只依赖系统里的 ffmpeg / ffprobe；整片解码一遍，8 分钟的 1080p 片约 1～2 分钟
import { execFileSync, spawnSync } from 'node:child_process';
import { openSync, readSync, closeSync, statSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const platform = opt('--platform');
const srt = opt('--srt');
const sheet = opt('--sheet');
if (!file) {
  console.log('用法：node scripts/video-final.mjs <成片.mp4> [--platform douyin|xhs|shipinhao|bilibili|youtube|shorts] [--srt 字幕.srt] [--sheet 拼图.jpg]');
  process.exit(2);
}

// 平台要求：画幅、最长时长（秒）。时长上限各平台常调整，超了只提醒
const PLATFORMS = {
  douyin: { ratio: '9:16', name: '抖音' },
  xhs: { ratio: '9:16', name: '小红书' },
  shipinhao: { ratio: '9:16', name: '视频号' },
  shorts: { ratio: '9:16', name: 'YouTube Shorts', max: 180 },
  bilibili: { ratio: '16:9', name: 'B 站' },
  youtube: { ratio: '16:9', name: 'YouTube' },
};

const out = { '✗': [], '△': [], '✓': [] };
const add = (lv, msg) => out[lv].push(msg);
const t0 = Date.now();

// ── 规格 ──
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).toString());
const v = probe.streams.find((s) => s.codec_type === 'video');
const a = probe.streams.find((s) => s.codec_type === 'audio');
const dur = Number(probe.format.duration);
const size = statSync(file).size;
const fps = (r) => { const [n, d] = String(r).split('/').map(Number); return d ? n / d : n; };
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

if (!v) add('✗', '没有视频流');
else {
  const { width: w, height: h } = v;
  if (!['h264', 'hevc'].includes(v.codec_name)) add('✗', `视频编码是 ${v.codec_name}，平台和手机最稳的是 h264（-c:v libx264）`);
  if (v.pix_fmt !== 'yuv420p') add('✗', `像素格式是 ${v.pix_fmt}，手机和微信可能放不了或发绿，导出加 -pix_fmt yuv420p`);
  if (w % 2 || h % 2) add('✗', `分辨率 ${w}×${h} 有奇数边，h264 会报错或被裁`);
  if (Math.min(w, h) < 1080) add('△', `分辨率 ${w}×${h}，短边不到 1080，平台会判成低清`);
  const r = fps(v.avg_frame_rate), rr = fps(v.r_frame_rate);
  if (Math.abs(r - rr) > 0.5) add('△', `帧率不恒定（平均 ${r.toFixed(2)}，标称 ${rr.toFixed(2)}），剪辑软件里可能音画不同步`);
  if (r < 23.5 || r > 60.5) add('△', `帧率 ${r.toFixed(2)}，常用 25 / 30`);
  const p = PLATFORMS[platform];
  if (p) {
    const want = p.ratio === '9:16' ? 9 / 16 : 16 / 9;
    if (Math.abs(w / h - want) > 0.02) add('✗', `${p.name} 要 ${p.ratio}，这条是 ${w}×${h}`);
    if (p.max && dur > p.max) add('△', `${p.name} 超过 ${p.max} 秒（${dur.toFixed(1)} 秒）`);
  }
  add('✓', `画面 ${w}×${h}，${v.codec_name} ${v.pix_fmt}，${r.toFixed(2)} 帧/秒，时长 ${mmss(dur)}（${dur.toFixed(1)} 秒），${(size / 1048576).toFixed(1)} MB`);
}
if (!a) add('✗', '没有音频流');
else {
  if (a.codec_name !== 'aac') add('△', `音频编码 ${a.codec_name}，平台最稳的是 aac`);
  if (Number(a.sample_rate) < 44100) add('△', `音频采样率 ${a.sample_rate} Hz，导出时升到 48000（-ar 48000），否则平台重采样可能发闷`);
  add('✓', `声音 ${a.codec_name} ${a.sample_rate} Hz ${a.channels} 声道`);
  if (v && Math.abs(Number(a.duration || dur) - Number(v.duration || dur)) > 0.5) add('△', `音频和画面长度差 ${Math.abs(a.duration - v.duration).toFixed(2)} 秒，结尾会突然断或黑屏`);
}

// faststart：moov 在 mdat 前面，网页和小程序才能边下边播
function moovFirst(path) {
  const fd = openSync(path, 'r');
  const buf = Buffer.alloc(8);
  let pos = 0;
  try {
    while (pos < size) {
      if (readSync(fd, buf, 0, 8, pos) < 8) break;
      let len = buf.readUInt32BE(0);
      const type = buf.toString('latin1', 4, 8);
      if (type === 'moov') return true;
      if (type === 'mdat') return false;
      if (len === 1) { const b = Buffer.alloc(8); readSync(fd, b, 0, 8, pos + 8); len = Number(b.readBigUInt64BE(0)); }
      if (len < 8) break;
      pos += len;
    }
  } finally { closeSync(fd); }
  return null;
}
if (/\.(mp4|mov|m4v)$/i.test(file) && moovFirst(file) === false) add('△', '没有 faststart，网页 / 小程序里要整片下完才能播。导出加 -movflags +faststart');

// ── 一遍解码：响度、静音、黑屏、画面不动 ──
const vf = 'scale=320:-2,blackdetect=d=0.4:pix_th=0.10,freezedetect=n=0.003:d=6';
const af = 'ebur128=peak=true,silencedetect=n=-45dB:d=1.5';
const run = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, ...(v ? ['-vf', vf] : []), ...(a ? ['-af', af] : []), '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
const log = run.stderr || '';

if (a) {
  const I = Number(log.match(/Integrated loudness:\s+I:\s+(-?[\d.]+)/)?.[1]);
  const TP = Number(log.match(/True peak:\s+Peak:\s+(-?[\d.]+)/)?.[1]);
  if (Number.isFinite(I)) {
    if (I < -20 || I > -10) add('✗', `响度 ${I} LUFS，差得太远（短视频和 YouTube 都按 -14 左右）。用 loudnorm=I=-14:TP=-1.5 重新混音`);
    else if (Math.abs(I + 14) > 2) add('△', `响度 ${I} LUFS，建议 -14 ± 2`);
    else add('✓', `响度 ${I} LUFS`);
  }
  if (Number.isFinite(TP) && TP > -1) add('△', `真峰值 ${TP} dBTP，超过 -1，平台转码后可能爆音`);
  const sil = [...log.matchAll(/silence_start: (-?[\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => [Math.max(0, +m[1]), +m[2]]);
  const head = sil.find(([s]) => s < 0.2);
  if (head && head[1] > 0.8) add('△', `开头 ${head[1].toFixed(1)} 秒没有声音，前 3 秒决定留存，确认是故意的`);
  const mid = sil.filter(([s, e]) => s >= 0.2 && e < dur - 0.5);
  if (mid.length) add('△', `中间有 ${mid.length} 段 1.5 秒以上的静音：${mid.slice(0, 5).map(([s, e]) => `${mmss(s)}（${(e - s).toFixed(1)} 秒）`).join('、')}。确认是设计好的停顿，不是配音丢句`);
}
if (v) {
  const black = [...log.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
  if (black.some(([s]) => s < 0.1)) add('△', '第一帧是黑屏：很多平台默认拿首帧当封面，也最容易被划走');
  const midB = black.filter(([s, e]) => s >= 0.1 && e < dur - 1.5);
  if (midB.length) add('△', `中间有黑屏：${midB.slice(0, 5).map(([s, e]) => `${mmss(s)}（${(e - s).toFixed(1)} 秒）`).join('、')}`);
  const fr = [...log.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_end: ([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
  if (fr.length) add('△', `画面 6 秒以上完全不动 ${fr.length} 处：${fr.slice(0, 5).map(([s, e]) => `${mmss(s)}（${(e - s).toFixed(0)} 秒）`).join('、')}。观众容易在这里划走，加元素或拆页`);
}

// ── 字幕 ──
if (srt) {
  const ts = (x) => { const [h, m, s] = x.replace(',', '.').split(':'); return +h * 3600 + +m * 60 + +s; };
  const cues = readFileSync(srt, 'utf8').trim().split(/\r?\n\r?\n+/).map((b) => {
    const ls = b.split(/\r?\n/);
    const i = ls.findIndex((l) => l.includes('-->'));
    if (i < 0) return null;
    const [s, e] = ls[i].split('-->').map((x) => ts(x.trim()));
    return { s, e, text: ls.slice(i + 1).join('\n') };
  }).filter(Boolean);
  const vertical = v && v.height > v.width;
  const maxLen = vertical ? 16 : 24;
  const long = cues.filter((c) => c.text.split('\n').some((l) => l.replace(/\s/g, '').length > maxLen));
  const multi = cues.filter((c) => c.text.includes('\n'));
  const overlap = cues.filter((c, i) => i && c.s < cues[i - 1].e - 0.01);
  const quick = cues.filter((c) => c.e - c.s < 0.6);
  const split = cues.filter((c, i) => i && /[A-Za-z0-9]$/.test(cues[i - 1].text) && /^[A-Za-z0-9]/.test(c.text));
  const late = cues.filter((c) => c.e > dur + 0.2);
  if (overlap.length) add('✗', `字幕时间重叠 ${overlap.length} 条，第一条在 ${mmss(overlap[0].s)}`);
  if (late.length) add('✗', `字幕超出片长 ${late.length} 条`);
  if (split.length) add('✗', `英文或数字被拆到两条字幕 ${split.length} 处，例如「${split[0].text.slice(0, 12)}」`);
  if (long.length) add('△', `字幕一行超过 ${maxLen} 字 ${long.length} 条，例如「${long[0].text.slice(0, 20)}」，${vertical ? '竖屏' : '横屏'}会挤或换行`);
  if (multi.length) add('△', `两行字幕 ${multi.length} 条，口播稿里加逗号让它单行`);
  if (quick.length) add('△', `停留不到 0.6 秒的字幕 ${quick.length} 条，看不完`);
  add('✓', `字幕 ${cues.length} 条`);
}

// ── 抽帧拼图：一张 3×3 图看全片版面，比看 9 张单图省得多 ──
if (sheet && v) {
  const step = dur / 9;
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', `fps=1/${step.toFixed(3)},scale=${v.height > v.width ? 240 : 400}:-2,tile=3x3:padding=4:color=white`, '-frames:v', '1', '-update', '1', sheet]);
  add('✓', `抽帧拼图 ${sheet}（从 0 秒起每 ${step.toFixed(1)} 秒一帧，第一格就是首帧）`);
}

// ── 报告 ──
console.log(`成片体检：${file}${platform ? `（${PLATFORMS[platform]?.name || platform}）` : ''}，用时 ${((Date.now() - t0) / 1000).toFixed(0)} 秒`);
for (const lv of ['✗', '△', '✓']) for (const m of out[lv]) console.log(`${lv} ${m}`);
if (!out['✗'].length && !out['△'].length) console.log('全部通过');
console.log('自动体检查不出：读音声调、多音字、内容事实、画面审美。这些按 video-qa 的人工清单过');
if (out['✗'].length) process.exit(1);

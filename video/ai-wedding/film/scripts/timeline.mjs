// 成片时间轴：按实际配音时长排镜头（配音 out/vo/timeline.json + 分镜 hold）→ out/film/timeline.json
// 画面、混音、字幕都读这一份
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SHOTS, ACTS, TITLE } from '../../storyboard.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const vo = JSON.parse(readFileSync(join(ROOT, 'out/vo/timeline.json'), 'utf8')).lines;
const LEAD = 0.5, IN = 0.1, TAIL = 0.2;

let t = 0, k = 0;
const shots = SHOTS.map((s, si) => {
  const start = t;
  let c = start + (si === 0 ? LEAD : IN);
  const lines = s.vo.map((text, j) => {
    const v = vo[k++];
    if (v.text !== text) throw new Error(`配音和分镜对不上：${v.text} / ${text}（先重跑 tts.py）`);
    if (j) c += /[。！？”]$/.test(s.vo[j - 1]) ? 0.18 : 0.08;
    const len = v.end - v.start;
    const l = { text, start: +c.toFixed(3), end: +(c + len).toFixed(3), wav: v.wav };
    c += len;
    return l;
  });
  const end = (lines.length ? c : start) + (s.hold || 0) + TAIL;
  t = end;
  return { id: s.id, act: s.act, start: +start.toFixed(3), end: +end.toFixed(3), tag: s.tag || [], lines };
});
if (k !== vo.length) throw new Error('配音行数和分镜不一致');
const out = { title: TITLE, duration: +t.toFixed(3), fps: 30, w: 1920, h: 1080, acts: ACTS, shots };
mkdirSync(join(ROOT, 'out/film'), { recursive: true });
writeFileSync(join(ROOT, 'out/film/timeline.json'), JSON.stringify(out, null, 1));
// 字幕：按标点切成一行不超过 20 字的小段，时长按字数分（字幕一行放得下，竖屏转发也不折行）
const len = (x) => x.replace(/[，。！？、；：“”…\s]/g, '').length;
function cues(l) {
  const parts = l.text.match(/[^，。！？、；：]+[，。！？、；：]*/g) || [l.text];
  const out = [];
  for (const p of parts) {
    const last = out.at(-1);
    if (last && len(last + p) <= 20) out[out.length - 1] = last + p; else out.push(p);
  }
  const total = out.reduce((a, x) => a + Math.max(1, len(x)), 0);
  let c = l.start;
  return out.map((x) => { const d = (l.end - l.start) * Math.max(1, len(x)) / total; const r = { text: x.replace(/[“”]/g, '').replace(/[，、；：]$/, ''), start: +c.toFixed(3), end: +(c + d).toFixed(3) }; c += d; return r; });
}
for (const s of shots) for (const l of s.lines) l.cues = cues(l);
writeFileSync(join(ROOT, 'out/film/timeline.json'), JSON.stringify(out, null, 1));
const ts = (x) => { const ms = Math.round(x * 1000); const p = (n, w = 2) => String(n).padStart(w, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
let srt = '', n = 0;
for (const s of shots) for (const l of s.lines) for (const q of l.cues) srt += `${++n}\n${ts(q.start)} --> ${ts(q.end)}\n${q.text}\n\n`;
const long = shots.flatMap((s) => s.lines.flatMap((l) => l.cues)).filter((q) => len(q.text) > 20);
if (long.length) console.log('△ 字幕超过 20 字：', long.map((q) => q.text));
writeFileSync(join(ROOT, 'out/film/subtitles.srt'), srt);
console.log(`成片 ${Math.floor(t / 60)} 分 ${(t % 60).toFixed(1)} 秒，${shots.length} 镜，字幕 ${n} 条`);

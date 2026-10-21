// 按配音时长把 story.js 的分段排成绝对时间轴。浏览器和 Node（混音脚本）共用。
import * as S from './story.js';

// vo：配音元数据 [{id, dur}]；lines：voiceover.json 的 lines（字幕、出处）
export function build(vo, lines) {
  const dur = Object.fromEntries(vo.map((v) => [v.id, v.dur]));
  const info = Object.fromEntries(lines.map((l) => [l.id, l]));
  let t = 0;
  const segs = [];
  for (const seg of S.segments) {
    const start = t;
    let cur = start + (seg.lead ?? 0.8);
    const items = [];
    for (const id of seg.vo) {
      if (!(id in dur)) throw new Error(`缺少配音：${id}`);
      items.push({ id, start: cur, end: cur + dur[id], sub: info[id].sub, en: info[id].en, src: info[id].src || '' });
      cur += dur[id] + S.GAP;
    }
    let end = (items.length ? cur - S.GAP : cur) + (seg.tail ?? 1);
    end = Math.max(end, start + (seg.min || 0));
    const o = { ...seg, start, end, dur: end - start, items };
    if (seg.stampAt) o.stampT = items.find((i) => i.id === seg.stampAt).start - start;
    segs.push(o);
    t = end;
  }
  // 相邻的同模式分段算作一个连续镜头（不交叉淡化）
  segs.forEach((s, i) => {
    s.joinPrev = i > 0 && segs[i - 1].mode === s.mode && s.mode === 'map';
    s.joinNext = i < segs.length - 1 && segs[i + 1].mode === s.mode && s.mode === 'map';
  });
  return { segments: segs, duration: Math.ceil(t * S.FPS) / S.FPS };
}

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

// 某一段在时刻 t 的画面权重（交叉淡化）
export function weight(seg, t, total) {
  const h = S.XFADE / 2;
  const a = seg.start <= 0 || seg.joinPrev ? (t >= seg.start - (seg.joinPrev ? 0 : h) ? 1 : 0) : smooth(seg.start - h, seg.start + h, t);
  const lastEnd = seg.end >= total - 1e-6;
  const b = seg.joinNext ? (t < seg.end ? 1 : 0) : lastEnd ? 1 - smooth(seg.end - 1.6, seg.end, t) : 1 - smooth(seg.end - h, seg.end + h, t);
  return Math.min(a, b);
}

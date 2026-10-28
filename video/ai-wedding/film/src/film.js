// 成片调度：读 out/film/timeline.json，按时间找到镜头、画镜头、叠字幕和全片控件、做后期
import { W, H, layer, clamp, rng, makeCanvas, ph } from './util.js';
import { loadBackgrounds } from './scenes.js';
import { DRAW } from './shots.js';
import * as T from './text.js';

const LETTERBOX = new Set(['C07', 'C54', 'C64']);

export async function createFilm(canvas, opt = {}) {
  const tl = await (await fetch('../../out/film/timeline.json', { cache: 'no-store' })).json();
  await loadBackgrounds();
  for (const f of ['700 40px "Noto Sans SC"', '900 40px "Noto Sans SC"', '500 40px "Noto Sans SC"', '40px "ZCOOL KuaiLe"']) await document.fonts.load(f, '测试囍¥0123456789');
  await document.fonts.ready;
  const ctx = canvas.getContext('2d');
  const shots = tl.shots;
  const actName = Object.fromEntries(tl.acts.map((a) => [a.id, a.name]));
  const firstOfAct = new Set(shots.filter((s, i) => i === 0 || shots[i - 1].act !== s.act).map((s) => s.id));
  // 三次反转的亮灯时刻：反转镜头最后一句口播的 70% 处
  const revAt = ['rev1', 'rev2', 'rev3'].map((r) => { const s = shots.find((x) => x.tag.includes(r)); const l = s.lines.at(-1); return l.start + (l.end - l.start) * 0.7; });
  const trackerFrom = shots.find((s) => s.id === 'C08').end - 2.0;
  // 尾声总结链之后不再显示（四环里已经接上了三次反转）
  const trackerUntil = shots.find((s) => s.id === 'C61').start;
  // 颗粒
  const grain = makeCanvas(512, 512);
  { const g = grain.getContext('2d'), d = g.createImageData(512, 512), r = rng(9); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }

  function shotAt(t) { let i = shots.findIndex((s) => t < s.end); if (i < 0) i = shots.length - 1; return i; }
  function ctxOf(s) {
    return { d: s.end - s.start, L: s.lines.map((l) => ({ s: l.start - s.start, e: l.end - s.start, text: l.text })), id: s.id };
  }
  function drawShot(c, s, t) {
    const fn = DRAW[s.id];
    c.save();
    if (fn) fn(c, t - s.start, ctxOf(s)); else { c.fillStyle = '#333'; c.fillRect(0, 0, W, H); T.label(c, s.id, W / 2, H / 2, { size: 80, color: '#fff' }); }
    c.restore();
  }

  function render(t) {
    const i = shotAt(t), s = shots[i], lt = t - s.start;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    drawShot(ctx, s, t);
    // 换幕时短溶解
    if (i > 0 && firstOfAct.has(s.id) && lt < 0.3) {
      const [pc, px] = layer('prev'); drawShot(px, shots[i - 1], shots[i - 1].end - 0.001);
      ctx.globalAlpha = 1 - lt / 0.3; ctx.drawImage(pc, 0, 0); ctx.globalAlpha = 1;
    }
    // 后期：暗角 + 颗粒
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,15,10,0.38)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = 'overlay';
    const f = Math.floor(t * 30), ox = (f * 137) % 512, oy = (f * 251) % 512;
    for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) ctx.drawImage(grain, x, y);
    ctx.restore();
    // 电影黑边（关键镜头）
    if (LETTERBOX.has(s.id)) { const k = clamp(Math.min(lt / 0.4, (s.end - s.start - lt) / 0.3)); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 120 * k); ctx.fillRect(0, H - 120 * k, W, 120 * k); }
    // 全片控件
    if (t >= trackerFrom && t < trackerUntil + 0.4) T.tracker(ctx, revAt.map((r) => (t >= r ? 1 : 0)), clamp(Math.min((t - trackerFrom) / 0.5, (trackerUntil + 0.4 - t) / 0.4)), revAt.map((r) => ph(t, r, r + 0.5)));
    if (s.tag.includes('hypo')) T.hypo(ctx, clamp(Math.min(lt / 0.3, (s.end - s.start - lt) / 0.3)), s.id === 'C38' ? '示意' : '假设');
    if (firstOfAct.has(s.id) && s.act !== 'A0') T.actChip(ctx, actName[s.act], lt);
    if (opt.subtitles !== false) {
      for (const l of s.lines) for (const q of l.cues) if (t >= q.start && t < q.end) T.subtitle(ctx, q.text);
    }
  }
  return { render, duration: tl.duration, shots };
}

// 画面文字：全部由代码写（不用 AI 画的字）。标签、大数字、字幕、反转进度条、「假设」角标、幕名
import { W, H, rr, FONT, clamp, eout, back, ph } from './util.js';

export function label(c, text, x, y, o = {}) {
  const size = o.size || 56, font = o.font || FONT.body, weight = o.weight || 700;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.translate(x, y); if (o.scale != null) c.scale(o.scale, o.scale); if (o.rot) c.rotate(o.rot);
  c.font = `${weight} ${size}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(text).width, pad = o.pad ?? size * 0.45;
  if (o.bg) {
    rr(c, -w / 2 - pad, -size * 0.7, w + pad * 2, size * 1.4, o.radius ?? size * 0.3);
    c.fillStyle = o.bg; c.fill();
    if (o.border) { c.lineWidth = o.borderW || 4; c.strokeStyle = o.border; if (o.dash) c.setLineDash(o.dash); c.stroke(); c.setLineDash([]); }
  }
  if (o.stroke) { c.lineWidth = o.strokeW || size * 0.16; c.strokeStyle = o.stroke; c.lineJoin = 'round'; c.strokeText(text, 0, size * 0.04); }
  c.fillStyle = o.color || '#2B2630'; c.fillText(text, 0, size * 0.04);
  c.restore();
  return w;
}

// 大数字：粗描边，砸进画面
export function big(c, text, x, y, size, color = '#C8343A', o = {}) {
  return label(c, text, x, y, { size, font: o.font || FONT.body, weight: 900, color, stroke: o.stroke ?? '#FFFDF5', strokeW: size * 0.12, ...o });
}

// 字幕：底部居中一行，白字深描边
export function subtitle(c, text) {
  if (!text) return;
  label(c, text, W / 2, H - 78, { size: 54, weight: 700, color: '#FFFFFF', stroke: 'rgba(30,20,25,0.92)', strokeW: 10 });
}

// 反转进度条：右上角三格；lit = [0..1, 0..1, 0..1]
const REV = ['效率提升', '降价竞争', '模式转型'];
export function tracker(c, lit, alpha = 1, flash = [0, 0, 0]) {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha = alpha;
  const x0 = W - 60 - 3 * 168, y = 196;
  label(c, '三次反转', x0 - 74, y, { size: 26, font: FONT.fun, weight: 400, color: '#FFFDF5', stroke: 'rgba(40,25,30,0.8)', strokeW: 6 });
  for (let i = 0; i < 3; i++) {
    const x = x0 + i * 168 + 80, on = lit[i];
    c.save(); c.translate(x, y); const s = 1 + 0.25 * Math.sin(Math.PI * clamp(flash[i])); c.scale(s, s);
    rr(c, -76, -24, 152, 48, 24);
    c.fillStyle = on > 0 ? `rgba(200,52,58,${0.35 + 0.6 * on})` : 'rgba(255,253,245,0.55)'; c.fill();
    c.lineWidth = 3; c.strokeStyle = on > 0 ? '#FFE7B0' : 'rgba(60,40,40,0.5)'; c.setLineDash(on > 0 ? [] : [6, 5]); c.stroke(); c.setLineDash([]);
    c.font = `400 26px ${FONT.fun}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = on > 0 ? '#FFFDF5' : 'rgba(60,40,40,0.7)'; c.fillText(`${'①②③'[i]}${REV[i]}`, 0, 2);
    c.restore();
  }
  c.restore();
}

// 「假设」角标：虚线框，凡是画面出现假设数字自动挂（G24）
export function hypo(c, alpha = 1, text = '假设') {
  if (alpha <= 0) return;
  label(c, text, W - 120, 262, { size: 30, weight: 700, color: '#8A6D3B', bg: 'rgba(255,250,235,0.92)', border: '#8A6D3B', dash: [7, 5], borderW: 3, alpha, pad: 16 });
}

// 幕名小签：左上，1.6 秒淡出
export function actChip(c, name, t) {
  const a = clamp(Math.min(t / 0.3, (1.9 - t) / 0.4));
  if (a <= 0) return;
  const [n1, n2] = name.split(' · ');
  c.save(); c.globalAlpha = a; c.translate(-30 * (1 - eout(clamp(t / 0.4))), 0);
  c.font = `700 32px ${FONT.body}`;
  const w = c.measureText(`${n1}  ${n2 || ''}`).width;
  label(c, `${n1}  ${n2 || ''}`, 60 + 22 + w / 2, 196, { size: 32, weight: 700, color: '#FFFDF5', bg: 'rgba(142,42,51,0.88)', pad: 22, font: FONT.body });
  c.restore();
}

export function titleCard(c, title, k, o = {}) {
  // 标题卡：红色剪纸底 + 两行大字；k 是出场进度
  const s = back(clamp(k));
  c.save(); c.translate(W / 2, o.y ?? H / 2 - 40); c.scale(s, s);
  rr(c, -560, -190, 1120, 380, 40); c.fillStyle = '#B5323A'; c.fill();
  c.lineWidth = 10; c.strokeStyle = '#E8B04B'; c.stroke();
  rr(c, -530, -160, 1060, 320, 28); c.lineWidth = 3; c.strokeStyle = 'rgba(232,176,75,0.7)'; c.setLineDash([12, 10]); c.stroke(); c.setLineDash([]);
  const [a, b] = title.split('，');
  label(c, a + '，', 0, -62, { size: 104, font: FONT.fun, weight: 400, color: '#FFF3D6' });
  label(c, b, 0, 70, { size: 104, font: FONT.fun, weight: 400, color: '#F7C948' });
  c.restore();
}

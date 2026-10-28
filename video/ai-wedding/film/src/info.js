// 信息图组件和动漫符号：和角色同一套颜色，粗圆角线条
import { W, H, rr, shade, clamp, ph, eout, back, rng, FONT } from './util.js';
import { label } from './text.js';

const INK = '#3b2a26';
export const C = { red: '#C8343A', gold: '#E8B04B', teal: '#2BB3A8', green: '#4B8A6C', ai: '#4FD8F0', ink: '#2B2630', paper: '#FBF3E4', cream: '#FFF8EA', grey: '#9AA0A8', orange: '#F06A3C' };

function o(c, w = 4) { c.lineWidth = w; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }

// 金币（只画 ¥ 符号，不画票面）
export function coin(c, x, y, r = 30, spin = 0, text = '¥') {
  const sx = Math.max(0.15, Math.abs(Math.cos(spin)));
  c.save(); c.translate(x, y); c.scale(sx, 1);
  c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = '#F2C14E'; c.fill(); o(c, 3);
  c.beginPath(); c.arc(0, 0, r * 0.74, 0, 7); c.strokeStyle = '#D69A2A'; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#B9771A'; c.font = `900 ${r * (text.length > 2 ? 0.55 : 1.0)}px ${FONT.body}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, r * 0.05);
  c.restore();
}

// 工时条：n 个小时方块，eaten 个被吃掉（从右往左消失）
export function hourBar(c, x, y, n, eaten, o2 = {}) {
  const bw = o2.bw || 44, gap = 8, total = n * bw + (n - 1) * gap;
  const x0 = x - total / 2;
  for (let i = 0; i < n; i++) {
    const k = clamp(eaten - (n - 1 - i));
    const s = 1 - k;
    if (s <= 0.01) continue;
    c.save(); c.translate(x0 + i * (bw + gap) + bw / 2, y); c.scale(s, s);
    rr(c, -bw / 2, -bw * 0.7, bw, bw * 1.4, 8); c.fillStyle = i % 5 === 4 ? '#E59A4A' : '#F2B66A'; c.fill(); o(c, 3);
    c.restore();
  }
  return x0 + (n - eaten) * (bw + gap);
}

// 利润煎饼：thick 0..1（1 = 厚实）
export function pancake(c, x, y, rw, thick, o2 = {}) {
  const th = 10 + 50 * thick;
  c.save(); c.translate(x, y);
  c.beginPath(); c.ellipse(0, th / 2, rw, rw * 0.32, 0, 0, Math.PI); c.lineTo(-rw, -th / 2); c.ellipse(0, -th / 2, rw, rw * 0.32, 0, Math.PI, 0, true); c.closePath();
  c.fillStyle = '#D9973F'; c.fill(); o(c, 4);
  c.beginPath(); c.ellipse(0, -th / 2, rw, rw * 0.32, 0, 0, 7); c.fillStyle = '#F2C27A'; c.fill(); o(c, 4);
  const r = rng(3); c.fillStyle = '#C98432';
  for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse((r() - 0.5) * rw * 1.4, -th / 2 + (r() - 0.5) * rw * 0.4, 10, 5, 0, 0, 7); c.fill(); }
  if (o2.label) label(c, o2.label, 0, -th / 2 - rw * 0.32 - 50, { size: 44, color: '#8E2A33', bg: 'rgba(255,248,234,0.9)', pad: 18 });
  c.restore();
}

export function priceTag(c, x, y, text, color, s = 1, rot = 0, o2 = {}) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath(); c.moveTo(-170, -80); c.lineTo(130, -80); c.lineTo(190, 0); c.lineTo(130, 80); c.lineTo(-170, 80); c.closePath();
  c.fillStyle = color; c.fill(); o(c, 5);
  c.beginPath(); c.arc(140, 0, 14, 0, 7); c.fillStyle = '#FFF8EA'; c.fill(); o(c, 3);
  label(c, text, -20, 0, { size: o2.size || 76, weight: 900, color: '#FFFDF5' });
  if (o2.who) label(c, o2.who, -20, -122, { size: 40, color: color, bg: 'rgba(255,253,245,0.95)', pad: 16 });
  if (o2.slash) { c.beginPath(); c.moveTo(-160, 40); c.lineTo(-160 + 300 * o2.slash, 40 - 90 * o2.slash); c.lineWidth = 12; c.strokeStyle = '#FFFDF5'; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#D11F2A'; c.stroke(); }
  c.restore();
}

export function check(c, x, y, k, s = 1) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(s * back(k), s * back(k));
  c.beginPath(); c.arc(0, 0, 34, 0, 7); c.fillStyle = '#3FA66B'; c.fill(); o(c, 3);
  c.beginPath(); c.moveTo(-15, 0); c.lineTo(-4, 12); c.lineTo(17, -12); c.lineWidth = 8; c.strokeStyle = '#FFFFFF'; c.stroke();
  c.restore();
}

export function arrow(c, x1, y1, x2, y2, color = C.red, w = 14, k = 1) {
  const x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k, a = Math.atan2(y - y1, x - x1);
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x - Math.cos(a) * w, y - Math.sin(a) * w);
  c.lineWidth = w + 6; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke(); c.lineWidth = w; c.strokeStyle = color; c.stroke();
  c.save(); c.translate(x, y); c.rotate(a);
  c.beginPath(); c.moveTo(w * 1.6, 0); c.lineTo(-w * 1.2, -w * 1.6); c.lineTo(-w * 1.2, w * 1.6); c.closePath(); c.fillStyle = color; c.fill(); o(c, 3);
  c.restore();
}

// 动漫集中线
export function speedLines(c, cx, cy, k, t, color = 'rgba(255,255,255,0.85)') {
  if (k <= 0) return;
  const r = rng(Math.floor(t * 12));
  c.save(); c.globalAlpha *= k; c.fillStyle = color;
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, r1 = 420 + r() * 200, r2 = 1500, w = 0.006 + r() * 0.012;
    c.beginPath(); c.moveTo(cx + Math.cos(a - w) * r2, cy + Math.sin(a - w) * r2); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.lineTo(cx + Math.cos(a + w) * r2, cy + Math.sin(a + w) * r2); c.fill();
  }
  c.restore();
}

export function confetti(c, k, t, seed = 1) {
  if (k <= 0) return;
  const r = rng(seed);
  for (let i = 0; i < 90; i++) {
    const x = r() * W, sp = 200 + r() * 300, y = -40 + ((r() * 300 + t * sp) % (H + 80)), a = t * 4 + i;
    c.save(); c.globalAlpha = k; c.translate(x + Math.sin(t * 2 + i) * 20, y); c.rotate(a);
    c.fillStyle = ['#E8485A', '#F7C948', '#4FD8F0', '#FFFFFF', '#F59AAE'][i % 5]; c.fillRect(-8, -4, 16, 8); c.restore();
  }
}

export function bubble(c, x, y, w, h, k, tailX, tailY) {
  // 想象泡泡（云朵形）
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(back(k), back(k));
  c.beginPath();
  const n = 12;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; c.moveTo(Math.cos(a) * w / 2 + 50, Math.sin(a) * h / 2); c.arc(Math.cos(a) * w / 2, Math.sin(a) * h / 2, 60, 0, 7); }
  c.fillStyle = '#FFFDF7'; c.fill();
  c.beginPath(); c.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); c.fill();
  c.restore();
  if (tailX != null) for (let i = 1; i <= 3; i++) { const kk = i / 4; c.beginPath(); c.arc(x + (tailX - x) * (0.55 + kk * 0.4), y + (tailY - y) * (0.55 + kk * 0.4), 18 - i * 4, 0, 7); c.fillStyle = '#FFFDF7'; c.fill(); }
}

export function panel(c, x, y, w, h, k, fn) {
  // 漫画格：k 控制点亮
  if (k <= 0) return;
  c.save(); c.globalAlpha *= clamp(k * 1.5);
  rr(c, x, y, w, h, 14); c.fillStyle = '#FFF8EA'; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
  c.save(); rr(c, x, y, w, h, 14); c.clip(); c.translate(x, y); fn(c); c.restore();
  c.restore();
}

export function question(c, x, y, s, k) {
  if (k <= 0) return;
  label(c, '?', x, y, { size: 200 * s, weight: 900, color: '#F7C948', stroke: INK, strokeW: 14 * s, scale: back(k) });
}

export function stamp(c, text, x, y, k, color = C.red, size = 80, rot = -0.18) {
  if (k <= 0) return;
  const s = 1 + 1.6 * (1 - eout(k));
  c.save(); c.globalAlpha *= clamp(k * 2); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.font = `900 ${size}px ${FONT.body}`; const w = c.measureText(text).width;
  rr(c, -w / 2 - 30, -size * 0.75, w + 60, size * 1.5, 12); c.lineWidth = 8; c.strokeStyle = color; c.stroke();
  c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, size * 0.05);
  c.restore();
}

// 店铺小图标（地图、网格用）
export function shopIcon(c, x, y, s = 1, color = '#E7D3B4', lit = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (lit > 0) { const g = c.createRadialGradient(0, -20, 4, 0, -20, 70); g.addColorStop(0, `rgba(255,220,120,${0.7 * lit})`); g.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, -20, 70, 0, 7); c.fill(); }
  c.fillStyle = color; rr(c, -30, -36, 60, 44, 4); c.fill(); o(c, 3);
  c.beginPath(); c.moveTo(-38, -34); c.lineTo(0, -62); c.lineTo(38, -34); c.closePath(); c.fillStyle = shade(color, -0.25); c.fill(); o(c, 3);
  c.fillStyle = lit > 0 ? '#FFE9A8' : '#FFF8EA'; c.fillRect(-12, -24, 24, 22);
  c.restore();
}

export function cloud(c, x, y, s = 1, k = 1) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(s * back(k), s * back(k));
  c.beginPath(); c.arc(-18, 0, 18, 0, 7); c.arc(4, -10, 22, 0, 7); c.arc(24, 2, 16, 0, 7); c.fillStyle = '#8C93A3'; c.fill();
  c.strokeStyle = '#6E7FA8'; c.lineWidth = 3; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 14, 22); c.lineTo(i * 14 - 5, 36); c.stroke(); }
  c.restore();
}

// 扑克牌：flip 0..1（0 背面，1 正面）
export function card(c, x, y, w, h, flip, title, color, fn, rot = 0) {
  const sx = Math.cos(Math.PI * (1 - clamp(flip)));
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(Math.abs(sx) < 0.02 ? 0.02 : Math.abs(sx), 1);
  rr(c, -w / 2, -h / 2, w, h, 26);
  if (sx < 0) {
    c.fillStyle = '#8E2A33'; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
    rr(c, -w / 2 + 20, -h / 2 + 20, w - 40, h - 40, 16); c.lineWidth = 4; c.strokeStyle = '#E8B04B'; c.stroke();
    label(c, '囍', 0, 0, { size: w * 0.4, weight: 900, color: '#E8B04B' });
  } else {
    c.fillStyle = '#FFF8EA'; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
    rr(c, -w / 2, -h / 2, w, 110, 26); c.fillStyle = color; c.fill(); c.lineWidth = 8; c.stroke();
    label(c, title, 0, -h / 2 + 56, { size: 46, weight: 900, color: '#FFFDF5' });
    c.save(); c.translate(0, 40); fn && fn(c); c.restore();
  }
  c.restore();
}

export function domino(c, x, y, w, h, ang, color = '#FFF8EA', text = '', icon) {
  c.save(); c.translate(x, y); c.rotate(ang);
  rr(c, -w / 2, -h, w, h, 10); c.fillStyle = color; c.fill(); o(c, 4);
  if (text) label(c, text, 0, -h / 2, { size: Math.min(44, w * 0.3), weight: 900, color: '#8E2A33', rot: 0 });
  if (icon) icon(c, -h / 2);
  c.restore();
}

export function funnel(c, x, y, s, t, k = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(-200, -160); c.lineTo(200, -160); c.lineTo(36, 40); c.lineTo(36, 150); c.lineTo(-36, 150); c.lineTo(-36, 40); c.closePath();
  c.fillStyle = 'rgba(79,216,240,0.25)'; c.fill(); o(c, 6);
  const r = rng(2);
  for (let i = 0; i < 26; i++) { const x0 = (r() - 0.5) * 340, y0 = -220 - ((r() * 200 + t * 140) % 200); c.beginPath(); c.arc(x0, y0, 14, 0, 7); c.fillStyle = '#F2B66A'; c.fill(); o(c, 2); }
  for (let i = 0; i < 2; i++) { const yy = 160 + ((t * 70 + i * 60) % 140); c.beginPath(); c.arc(0, yy, 14, 0, 7); c.fillStyle = '#3FA66B'; c.fill(); o(c, 2); }
  c.restore();
}

export function badge(c, x, y, text, k, color = C.gold) {
  if (k <= 0) return;
  c.save(); c.translate(x, y - 40 * (1 - eout(k))); c.globalAlpha *= clamp(k * 2);
  c.beginPath();
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? 140 : 156; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  c.closePath(); c.fillStyle = color; c.fill(); o(c, 5);
  c.beginPath(); c.arc(0, 0, 118, 0, 7); c.fillStyle = '#FFF8EA'; c.fill(); o(c, 4);
  const lines = text.length > 4 ? [text.slice(0, Math.ceil(text.length / 2)), text.slice(Math.ceil(text.length / 2))] : [text];
  lines.forEach((ln, i) => label(c, ln, 0, (i - (lines.length - 1) / 2) * 56, { size: 50, weight: 900, color: '#8E2A33' }));
  c.restore();
}

export function door(c, x, y, k, front, backText) {
  // 双面门牌：k 0..1 翻转
  const sx = Math.cos(Math.PI * clamp(k));
  c.save(); c.translate(x, y); c.scale(Math.max(0.02, Math.abs(sx)), 1);
  rr(c, -300, -90, 600, 180, 18); c.fillStyle = sx >= 0 ? '#2F7F77' : '#F2B940'; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
  label(c, sx >= 0 ? front : backText, 0, 0, { size: 64, weight: 900, color: sx >= 0 ? '#F4FBF8' : '#3b2a26', font: FONT.body });
  c.restore();
  c.beginPath(); c.moveTo(x - 120, y - 90); c.lineTo(x, y - 170); c.lineTo(x + 120, y - 90); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.arc(x, y - 170, 8, 0, 7); c.fillStyle = INK; c.fill();
}

export function abacus(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rr(c, -220, -110, 440, 220, 14); c.fillStyle = '#8A5E3E'; c.fill(); o(c, 5);
  rr(c, -200, -92, 400, 184, 8); c.fillStyle = '#F2E3CA'; c.fill();
  c.fillStyle = '#5A3A26'; c.fillRect(-200, -40, 400, 8);
  for (let i = 0; i < 9; i++) {
    const x0 = -176 + i * 44;
    c.fillStyle = '#5A3A26'; c.fillRect(x0 - 2, -92, 4, 184);
    const up = Math.sin(t * 9 + i * 1.7) > 0.3;
    for (let j = 0; j < 4; j++) { c.beginPath(); c.ellipse(x0, (up && j === 0 ? -20 : 0) + 10 + j * 22, 18, 10, 0, 0, 7); c.fillStyle = '#C8343A'; c.fill(); o(c, 2); }
    c.beginPath(); c.ellipse(x0, -66 + (up ? 12 : 0), 18, 10, 0, 0, 7); c.fillStyle = '#C8343A'; c.fill(); o(c, 2);
  }
  c.restore();
}

export function dashboard(c, x, y, w, h, t, k = [1, 1, 1]) {
  rr(c, x, y, w, h, 18); c.fillStyle = '#1F2A33'; c.fill(); o(c, 6);
  const names = ['营销内容', '客户线索', '跟进提醒'];
  names.forEach((n, i) => {
    const bx = x + 30 + i * (w - 60) / 3, bw = (w - 60) / 3 - 20, a = clamp(k[i]);
    c.save(); c.globalAlpha *= 0.25 + 0.75 * a;
    rr(c, bx, y + 30, bw, h - 60, 12); c.fillStyle = ['#2B4A5A', '#2B5A4E', '#5A4A2B'][i]; c.fill();
    label(c, n, bx + bw / 2, y + 80, { size: 40, color: '#FFFDF5' });
    for (let j = 0; j < 4; j++) { rr(c, bx + 24, y + 130 + j * 46, (bw - 48) * (0.5 + 0.5 * Math.abs(Math.sin(t * 2 + i + j))), 22, 10); c.fillStyle = ['#4FD8F0', '#7FE0B0', '#F7C948'][i]; c.fill(); }
    c.restore();
  });
}

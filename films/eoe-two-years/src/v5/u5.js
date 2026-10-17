// 完整版共用的小工具：插值、镜头、离屏画布、漫画字、聊天气泡
import { K, outline, rect } from '../v2/frames.js';
import { INK } from '../v3/stick.js';

export const W = 1080;
export const H = 1920;
export const SANS = '"Noto Sans SC", sans-serif';
export const FUN = '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
export const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn = (x) => Math.pow(clamp(x), 3);
export const easeBack = (x) => {
  x = clamp(x) - 1;
  return x * x * (2.6 * x + 1.6) + 1;
};
export const noise = (t, s) => Math.sin(t * 12.9 + s) * 0.5 + Math.sin(t * 7.3 + s * 2) * 0.3 + Math.sin(t * 23.1 + s * 3) * 0.2;

export function kf(t, keys, e = ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, e((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
}

export function cam(ctx, z, cx, cy, fn, sx = 0, sy = 0, rot = 0) {
  ctx.save();
  ctx.translate(W / 2 + sx, H / 2 + sy);
  ctx.rotate(rot);
  ctx.scale(z, z);
  ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}

export function layer(draw, w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'));
  return c;
}

// 漫画字：奶油色填充 + 藏青描边，带弹出缩放
export function pop(ctx, text, x, y, k, { size = 96, rot = 0, fill = K.cream, stroke = K.navyDeep, font = FUN } = {}) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const s = easeBack(k);
  ctx.scale(s, s);
  ctx.font = `${font === FUN ? '' : '900 '}${size}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// 聊天气泡（第四幕群消息）
export function bubble(ctx, text, x, y, k, color = '#FFFFFF') {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  const s = easeBack(k);
  ctx.scale(s, s);
  ctx.font = `700 46px ${SANS}`;
  const w = ctx.measureText(text).width + 60;
  outline(ctx, rect(-w / 2, -50, w, 100, 30), color, 6);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 40, 44);
  ctx.lineTo(-w / 2 + 20, 80);
  ctx.lineTo(-w / 2 + 76, 46);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 40, 50);
  ctx.lineTo(-w / 2 + 20, 80);
  ctx.lineTo(-w / 2 + 76, 50);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 2);
  ctx.restore();
}

// 地面阴影
export function shadow(ctx, x, y, w, a = 0.25) {
  ctx.fillStyle = `rgba(20,16,24,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
}

// 一串小彩灯
export function stringLights(ctx, x0, y0, x1, y1, sag, t, n = 14) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1);
  ctx.stroke();
  const cols = [K.yellow, K.orange, K.peri, K.red, K.cream];
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * ((x0 + x1) / 2) + u * u * x1;
    const y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * ((y0 + y1) / 2 + sag) + u * u * y1;
    const on = 0.65 + 0.35 * Math.sin(t * 4 + i * 1.7);
    const g = ctx.createRadialGradient(x, y + 14, 0, x, y + 14, 40);
    g.addColorStop(0, `rgba(255,225,160,${0.35 * on})`);
    g.addColorStop(1, 'rgba(255,225,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 40, y - 26, 80, 80);
    ctx.fillStyle = cols[i % cols.length];
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 9, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

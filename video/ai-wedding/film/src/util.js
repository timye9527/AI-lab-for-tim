// 通用小工具：缓动、插值、随机数、离屏画布
export const W = 1920, H = 1080;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
// 进度：t 在 [a, b] 之间从 0 走到 1
export const ph = (t, a, b) => clamp((t - a) / (b - a));
export const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const eout = (x) => 1 - Math.pow(1 - x, 3);
export const ein = (x) => x * x * x;
// 弹出：先冲过头再回来
export const back = (x) => { const c = 1.9; return x <= 0 ? 0 : x >= 1 ? 1 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const pop = (t, a, d = 0.35) => back(ph(t, a, a + d));
export const wave = (t, f = 1, a = 1) => Math.sin(t * Math.PI * 2 * f) * a;
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
export function makeCanvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
const pool = {};
export function layer(name, w = W, h = H) {
  let c = pool[name];
  if (!c || c.width !== w || c.height !== h) c = pool[name] = makeCanvas(w, h);
  const x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none';
  x.clearRect(0, 0, w, h);
  return [c, x];
}
// 圆角矩形路径
export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function shade(hex, k) {
  // k<0 变暗，k>0 变亮
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  r = f(r); g = f(g); b = f(b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
export const FONT = { body: '"Noto Sans SC", sans-serif', fun: '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif' };

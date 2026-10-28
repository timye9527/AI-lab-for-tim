// 镜头共用的小工具：各幕镜头文件都从这里拿
import { W, H, clamp, lerp, ph, ease, eout, back, pop, wave, rng, rr, FONT, shade } from './util.js';
import { figure, orb, CHEN, LI, STAFF, BRIDE, GROOM, PARTNER, GREY, person } from './chars.js';
import * as S from './scenes.js';
import * as I from './info.js';
import { label, big, titleCard } from './text.js';

export const TITLE = 'AI省下的钱，被谁赚走了？';
export const blink = (t, seed = 0) => ((t + seed) % 3.1 < 0.12 ? 1 : 0);
export const breathe = (t, a = 3) => Math.sin(t * 2.2) * a;
export const camK = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) });
export const fade = (c, a, color = '#000') => { if (a <= 0) return; c.save(); c.globalAlpha = clamp(a); c.fillStyle = color; c.fillRect(0, 0, W, H); c.restore(); };
export const beat = (X, i) => (X.L[i] ? X.L[i].s : X.d);

// 「你」箭头（G1）
export function youArrow(c, x, y, k, t) {
  if (k <= 0) return;
  c.save(); c.translate(x + wave(t, 1.2, 8), y - 30 * (1 - eout(k))); c.globalAlpha *= clamp(k * 2);
  I.arrow(c, 120, -120, 20, -20, '#F7C948', 16);
  label(c, '你', 150, -150, { size: 64, font: FONT.fun, weight: 400, color: '#8E2A33', bg: '#FFF8EA', border: '#3b2a26', borderW: 4, pad: 18 });
  c.restore();
}

// 店内的五个员工
export function staffAt(c, t, xs, y, s, o = {}) {
  STAFF.forEach((C, i) => { if (xs[i] == null) return; figure(c, C, { x: xs[i], y, s, blink: blink(t, i * 0.7), expr: o.expr?.[i] || 'smile', bob: breathe(t + i, 2), ...(o.pose?.[i] || {}) }); });
}


export const ein = (x) => x * x * x;
export { W, H, clamp, lerp, ph, ease, eout, back, pop, wave, rng, rr, FONT, shade, figure, orb, CHEN, LI, STAFF, BRIDE, GROOM, PARTNER, GREY, person, S, I, label, big, titleCard };

// 14–32 秒：海、天空、暖光；取景框、舞台的一束光
import { T, warmPicks } from './timeline.js';
import { clamp, lerp, inv, smooth, rng, noise1, fbm1, easeOutCubic, makeCanvas, hash } from './util.js';
import { HORIZON_Y, drawHorizonLine } from './string.js';

const HY = HORIZON_Y;
let GLINTS = null;
let CLOUDS = null;
let MOTES = null;
let PICKS = null;

export function initSea() {
  const R = rng(77);
  GLINTS = [];
  for (let i = 0; i < 1600; i++) {
    const v = Math.pow(R(), 1.35);
    const gauss = (R() + R() + R() - 1.5) / 1.5;
    GLINTS.push({
      v,
      xo: gauss,
      len: 0.4 + R(),
      w: R() * 6.28,
      f: 1.5 + R() * 3.5,
      h: R(),
    });
  }
  // 雲：畫一次，之後緩慢平移
  CLOUDS = makeCanvas(2600, 520);
  const x = CLOUDS.getContext('2d');
  x.filter = 'blur(14px)';
  for (let i = 0; i < 26; i++) {
    const cx = R() * 2600;
    const cy = 120 + R() * 320;
    const w = 220 + R() * 620;
    const h = 8 + R() * 22;
    const gr = x.createLinearGradient(0, cy - h, 0, cy + h);
    gr.addColorStop(0, 'rgba(70,80,120,0.35)');
    gr.addColorStop(0.6, 'rgba(255,190,140,0.32)');
    gr.addColorStop(1, 'rgba(255,215,170,0.12)');
    x.fillStyle = gr;
    x.beginPath();
    x.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
    x.fill();
  }
  MOTES = [];
  for (let i = 0; i < 90; i++) MOTES.push({ x: R() * 2200, y: R() * 1080, s: 0.6 + R() * 1.6, sp: 18 + R() * 40, h: R() });
  PICKS = warmPicks().map((p, i) => ({ ...p, x: 960 + (hash(i * 3.1) - 0.5) * 1300 }));
}

// 天空隨時間變暖、變深（夕陽緩緩下沉）
function skyStops(t) {
  const late = smooth(22, 31, t);
  return [
    [0, `rgb(${lerp(18, 22, late)},${lerp(44, 34, late)},${lerp(72, 62, late)})`],
    [0.42, `rgb(${lerp(44, 58, late)},${lerp(72, 62, late)},${lerp(104, 96, late)})`],
    [0.72, `rgb(${lerp(150, 176, late)},${lerp(120, 112, late)},${lerp(130, 116, late)})`],
    [0.9, `rgb(${lerp(236, 240, late)},${lerp(168, 150, late)},${lerp(118, 98, late)})`],
    [1, `rgb(255,${lerp(216, 202, late)},${lerp(160, 140, late)})`],
  ];
}

export function sunPos(t) {
  return { x: 960, y: HY - 26 + Math.max(0, t - 15) * 1.1, r: 44 };
}

// 主函式：畫在 (ctx, g) 上，可以是離屏畫布（對焦轉場用）
export function drawSea(ctx, g, t, opt = {}) {
  const sun = sunPos(t);
  const dim = opt.dim ?? 0;
  // 天空
  const sky = ctx.createLinearGradient(0, 0, 0, HY);
  for (const [o, c] of skyStops(t)) sky.addColorStop(o, c);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1920, HY + 1);
  // 太陽的大光暈
  let rg = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, 900);
  rg.addColorStop(0, 'rgba(255,214,150,0.55)');
  rg.addColorStop(0.25, 'rgba(255,170,110,0.18)');
  rg.addColorStop(1, 'rgba(255,150,100,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, 1920, HY);
  // 雲
  const cx = -((t * 6) % 680);
  ctx.globalAlpha = 0.9;
  ctx.drawImage(CLOUDS, cx - 200, HY - 500);
  ctx.globalAlpha = 1;
  // 太陽本體（在海平面之上的部分）
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1920, HY);
  ctx.clip();
  g.save();
  g.beginPath();
  g.rect(0, 0, 1920, HY);
  g.clip();
  g.globalCompositeOperation = 'lighter';
  rg = g.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, 190);
  rg.addColorStop(0, 'rgba(255,248,230,0.95)');
  rg.addColorStop(0.22, 'rgba(255,236,200,0.9)');
  rg.addColorStop(0.26, 'rgba(255,200,130,0.35)');
  rg.addColorStop(1, 'rgba(255,170,100,0)');
  g.fillStyle = rg;
  g.fillRect(sun.x - 200, sun.y - 200, 400, 400);
  g.restore();
  ctx.restore();

  // 海
  const sea = ctx.createLinearGradient(0, HY, 0, 1080);
  sea.addColorStop(0, '#8a7470');
  sea.addColorStop(0.06, '#4b5a6c');
  sea.addColorStop(0.35, '#1d3a52');
  sea.addColorStop(1, '#0a1c2c');
  ctx.fillStyle = sea;
  ctx.fillRect(0, HY, 1920, 1080 - HY);
  // 太陽倒影的柔光柱
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const col = ctx.createRadialGradient(sun.x, HY, 0, sun.x, HY, 520);
  col.addColorStop(0, 'rgba(255,190,120,0.45)');
  col.addColorStop(1, 'rgba(255,160,100,0)');
  ctx.setTransform(1, 0, 0, 1.0, 0, 0);
  ctx.translate(sun.x, HY);
  ctx.scale(0.55, 1);
  ctx.translate(-sun.x, -HY);
  ctx.fillStyle = col;
  ctx.fillRect(sun.x - 600, HY, 1200, 600);
  ctx.restore();

  // 波紋線（近大遠小，緩緩推向鏡頭）
  ctx.save();
  const N = 46;
  const drift = (t * 0.06) % 1;
  for (let i = 0; i < N; i++) {
    const v = (i + drift) / N;
    const y = HY + (1080 - HY) * Math.pow(v, 1.9);
    const s = 0.2 + v * 2.2;
    ctx.beginPath();
    for (let x = -20; x <= 1940; x += 24) {
      const yy = y + s * 3.2 * fbm1(x / (160 * s) + t * 0.25 + i * 7.3, i, 2);
      x === -20 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    const nearSun = 1;
    ctx.strokeStyle = `rgba(200,215,230,${(0.05 + 0.07 * (1 - v)) * nearSun})`;
    ctx.lineWidth = 0.8 + s * 0.6;
    ctx.stroke();
    ctx.translate(0, s * 2.4);
    ctx.strokeStyle = `rgba(5,15,28,${0.12 + 0.12 * v})`;
    ctx.stroke();
    ctx.translate(0, -s * 2.4);
  }
  ctx.restore();

  // 金色碎光
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  for (const p of GLINTS) {
    const y = HY + 2 + (1080 - HY) * p.v;
    const spread = 70 + 520 * p.v;
    const x = sun.x + p.xo * spread + 14 * Math.sin(t * 0.5 + p.h * 20);
    const tw = Math.max(0, Math.sin(t * p.f + p.w + Math.sin(t * 0.7 + p.h * 9) * 2));
    const b = Math.pow(tw, 6) * (1 - Math.abs(p.xo) * 0.8) * (0.4 + 0.6 * (1 - p.v * 0.5));
    if (b < 0.02) continue;
    const s = 0.25 + p.v * 1.8;
    g.strokeStyle = `rgba(255,${200 + 40 * (1 - p.v)},${150 + 60 * (1 - p.v)},${b})`;
    g.lineWidth = 1 + s * 0.9;
    g.beginPath();
    g.moveTo(x - p.len * 8 * s, y);
    g.lineTo(x + p.len * 8 * s, y);
    g.stroke();
  }
  g.restore();

  // 前景沙灘與浪花
  drawShore(ctx, g, t);

  // 風：漂浮的微光
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const m of MOTES) {
    const x = ((m.x + t * m.sp) % 2200) - 140;
    const y = m.y + 20 * Math.sin(t * 0.6 + m.h * 10);
    const a = 0.12 + 0.12 * Math.sin(t * 1.3 + m.h * 30);
    g.fillStyle = `rgba(255,225,180,${a})`;
    g.beginPath();
    g.arc(x, y, m.s, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // 海平線上的光線
  const pulses = [];
  for (const p of PICKS) {
    const u = t - p.t;
    if (u < 0 || u > 1.1) continue;
    pulses.push({ x: p.x, w: 40 + u * 260, a: 0.55 * p.vel * (1 - u / 1.1) });
  }
  if (!opt.noHorizon) drawHorizonLine(g, 1 + (opt.horizonBoost || 0), pulses, HY, opt.horizonAlpha ?? 1);

  if (dim > 0) {
    ctx.fillStyle = `rgba(4,6,12,${dim})`;
    ctx.fillRect(0, 0, 1920, 1080);
  }
}

// 浪花週期：與音效同步（浪湧上岸的時間）
export const WASH_TIMES = [17.2, 21.9, 26.6, 31.0];
function washAt(t) {
  let best = 0;
  for (const w of WASH_TIMES) {
    const u = t - w + 1.4; // 1.4 秒湧上，2.6 秒退去
    if (u < 0 || u > 4) continue;
    const k = u < 1.4 ? easeOutCubic(u / 1.4) : 1 - smooth(1.4, 4, u);
    best = Math.max(best, k);
  }
  return best;
}
const SHORE_Y = 975;
function shoreY(x) {
  return SHORE_Y + 22 * Math.sin(x / 520 + 0.6) + 8 * noise1(x / 90, 4);
}
function drawShore(ctx, g, t) {
  // 沙
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 1080);
  for (let x = 0; x <= 1920; x += 20) ctx.lineTo(x, shoreY(x));
  ctx.lineTo(1920, 1080);
  ctx.closePath();
  const sand = ctx.createLinearGradient(0, SHORE_Y - 30, 0, 1080);
  sand.addColorStop(0, '#5a4636');
  sand.addColorStop(1, '#2a2019');
  ctx.fillStyle = sand;
  ctx.fill();
  ctx.clip();
  // 濕沙反光
  const wet = ctx.createRadialGradient(960, SHORE_Y, 0, 960, SHORE_Y, 700);
  wet.addColorStop(0, 'rgba(255,190,130,0.22)');
  wet.addColorStop(1, 'rgba(255,190,130,0)');
  ctx.fillStyle = wet;
  ctx.fillRect(0, SHORE_Y - 40, 1920, 200);
  ctx.restore();
  // 浪：泡沫邊緣湧上沙灘
  const k = washAt(t);
  const reach = 12 + 70 * k;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, shoreY(0) - 30);
  for (let x = 0; x <= 1920; x += 16) ctx.lineTo(x, shoreY(x) - 30);
  for (let x = 1920; x >= 0; x -= 16) ctx.lineTo(x, shoreY(x) + reach + 10 * noise1(x / 60 + t * 0.4, 9));
  ctx.closePath();
  const wash = ctx.createLinearGradient(0, SHORE_Y - 30, 0, SHORE_Y + reach + 20);
  wash.addColorStop(0, 'rgba(40,70,92,0.9)');
  wash.addColorStop(0.75, 'rgba(120,140,150,0.35)');
  wash.addColorStop(1, 'rgba(160,170,170,0.1)');
  ctx.fillStyle = wash;
  ctx.fill();
  ctx.restore();
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.beginPath();
  for (let x = 0; x <= 1920; x += 10) {
    const y = shoreY(x) + reach + 10 * noise1(x / 60 + t * 0.4, 9);
    x ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.strokeStyle = `rgba(255,236,210,${0.28 + 0.2 * k})`;
  g.lineWidth = 2.2;
  g.stroke();
  g.strokeStyle = 'rgba(255,220,180,0.08)';
  g.lineWidth = 9;
  g.stroke();
  g.restore();
}

// 取景框（攝影）
export function drawViewfinder(K, t) {
  const t0 = T.viewfinder;
  if (t < t0 || t > T.shutter + 0.9) return;
  const { g, ctx } = K;
  const inA = smooth(t0, t0 + 0.35, t);
  const outA = 1 - smooth(T.shutter + 0.35, T.shutter + 0.85, t);
  const a = inA * outA;
  const k = 1 + 0.14 * (1 - easeOutCubic(inv(t0, t0 + 0.7, t)));
  const cx = 960;
  const cy = 520;
  const w = 760 * k;
  const h = 428 * k;
  const L = 52;
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = `rgba(255,248,236,${0.85 * a})`;
  g.lineWidth = 2.4;
  g.lineCap = 'square';
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = cx + (sx * w) / 2;
    const y = cy + (sy * h) / 2;
    g.beginPath();
    g.moveTo(x, y - sy * L);
    g.lineTo(x, y);
    g.lineTo(x - sx * L, y);
    g.stroke();
  }
  // 對焦點：先閃，鎖定後穩定
  const lock = t > t0 + 0.75;
  const blink = lock ? 1 : 0.4 + 0.6 * (Math.sin(t * 40) > 0 ? 1 : 0);
  const fs = lock ? 22 : 22 + 10 * (1 - inv(t0 + 0.3, t0 + 0.75, t));
  g.strokeStyle = `rgba(255,248,236,${0.8 * a * blink})`;
  g.lineWidth = 1.8;
  g.strokeRect(cx - fs, cy - fs * 0.7, fs * 2, fs * 1.4);
  g.restore();
  // 快門：極短的暗場
  const sh = t - T.shutter;
  if (sh > 0 && sh < 0.16) {
    const d = sh < 0.05 ? sh / 0.05 : 1 - (sh - 0.05) / 0.11;
    ctx.fillStyle = `rgba(0,0,0,${0.8 * d})`;
    ctx.fillRect(0, 0, 1920, 1080);
  }
}

// 舞台的一束光（演講）
export const BEAM_X = 1430;
export function drawBeam(K, t) {
  const t0 = T.beam;
  if (t < t0 || t > T.lift + 0.9) return;
  const { ctx, g } = K;
  // 開燈時輕微閃一下，像真的聚光燈
  let a = smooth(t0, t0 + 0.06, t) * (0.75 + 0.25 * smooth(t0 + 0.1, t0 + 0.35, t));
  if (t > t0 + 0.07 && t < t0 + 0.12) a *= 0.55;
  a *= 1 - smooth(T.lift - 0.2, T.lift + 0.8, t);
  const by = 1005;
  const topW = 26;
  const botW = 175;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cone = ctx.createLinearGradient(0, -40, 0, by);
  cone.addColorStop(0, `rgba(255,236,200,${0.26 * a})`);
  cone.addColorStop(1, `rgba(255,226,180,${0.12 * a})`);
  for (const [k, al] of [[1.2, 0.35], [1, 0.7], [0.75, 0.6]]) {
    ctx.globalAlpha = al;
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(BEAM_X - topW * k, -40);
    ctx.lineTo(BEAM_X + topW * k, -40);
    ctx.lineTo(BEAM_X + botW * k, by);
    ctx.lineTo(BEAM_X - botW * k, by);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // 地上的光圈
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.translate(BEAM_X, by);
  g.scale(1, 0.17);
  const rg = g.createRadialGradient(0, 0, 0, 0, 0, botW * 1.15);
  rg.addColorStop(0, `rgba(255,240,215,${0.75 * a})`);
  rg.addColorStop(0.7, `rgba(255,220,170,${0.35 * a})`);
  rg.addColorStop(1, 'rgba(255,200,150,0)');
  g.fillStyle = rg;
  g.beginPath();
  g.arc(0, 0, botW * 1.15, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // 光束裡的塵埃
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) {
    const v = (hash(i * 1.7) + t * 0.03 * (0.5 + hash(i))) % 1;
    const y = -40 + v * (by + 40);
    const wv = lerp(topW, botW, (y + 40) / (by + 40));
    const x = BEAM_X + (hash(i * 9.1) * 2 - 1) * wv * 0.8 + 6 * Math.sin(t + i);
    g.fillStyle = `rgba(255,240,210,${0.5 * a * hash(i * 3.3)})`;
    g.beginPath();
    g.arc(x, y, 1.3, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}
export { clamp };

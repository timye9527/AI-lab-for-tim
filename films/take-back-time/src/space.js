// 0–12 秒：游標 → 時間軸 → 創作空間 → 組裝 → 擁擠 → 停頓
import { T, camX, camSpeed, FLYBYS, CROWD_WORDS, CROWD_TIMES } from './timeline.js';
import { clamp, lerp, inv, smooth, rng, easeOutCubic, easeInCubic, easeOutExpo, easeOutBack, easeInOutCubic, roundRect, noise1 } from './util.js';
import { drawSprite, pill, GLYPHS, SANS } from './sprites.js';

const F0 = 1000;
const DLINE = 1.5; // 光線所在的景深
export const LINE_Y = 540;

export const focal = (t) => F0 * (1 + 0.85 * (1 - easeOutCubic(inv(T.open, T.open + 1.5, t))));
// 11 秒前空間逐漸收窄
export const squeeze = (t) => 1 - 0.62 * Math.pow(inv(7.9, T.stop, Math.min(t, T.stop)), 1.6);
const tf = (t) => Math.min(t, T.stop); // 停頓後時間凍結

let ELS = null;
let DUST = null;
let CROWD = null;
let BIG = null;

export function initSpace(S) {
  const R = rng(11);
  const kinds = ['doc', 'doc', 'wave', 'timeline', 'data', 'thumb', 'glyph', 'doc', 'thumb', 'wave', 'timeline'];
  ELS = [];
  for (let i = 0; i < 200; i++) {
    const d = 0.8 + Math.pow(R(), 0.85) * 5.6;
    const kind = kinds[Math.floor(R() * kinds.length)];
    const side = R() < 0.5 ? -1 : 1;
    ELS.push({
      x: -6 + R() * 32,
      y: side * (0.1 + Math.pow(R(), 0.75) * 0.46) * d,
      d,
      kind,
      v: Math.floor(R() * S[kind].length),
      size: 0.55 + R() * 0.55,
      h: R(),
      rot: (R() - 0.5) * 0.1,
    });
  }
  for (const f of FLYBYS) {
    ELS.push({
      x: camX(f.t),
      y: f.y * 0.54 * f.z,
      d: f.z,
      kind: f.kind,
      v: f.kind === 'glyph' ? GLYPHS.indexOf(f.ch) : Math.floor(R() * S[f.kind].length),
      size: f.kind === 'glyph' ? 0.75 : 0.9,
      h: R(),
      rot: 0,
      fly: true,
    });
  }
  ELS.sort((a, b) => b.d - a.d);

  DUST = [];
  for (let i = 0; i < 320; i++) {
    const d = 0.3 + Math.pow(R(), 0.7) * 7;
    DUST.push({ x: -6 + R() * 34, y: (R() * 2 - 1) * 0.6 * d, d, s: 0.5 + R(), h: R() });
  }

  // 擁擠段：大標籤 + 一堆小通知
  BIG = CROWD_WORDS.map((w, i) => ({
    s: pill(w, ['12', '4', '', '→'][i] || ''),
    t: CROWD_TIMES[i],
    x: [600, 1360, 1290, 640][i],
    y: [300, 270, 760, 790][i],
  }));
  CROWD = makeCrowd(S.small.length);
}

// 擁擠段的小通知：獨立亂數，配樂也用同一份時間表
export function makeCrowd(nSmall) {
  const R = rng(23);
  const out = [];
  for (let i = 0; i < 70; i++) {
    const top = R() < 0.5;
    const t0 = 8.25 + Math.pow(R(), 0.7) * 2.6;
    out.push({
      v: Math.floor(R() * nSmall),
      t: t0,
      x: 80 + R() * 1760,
      y: top ? 120 + R() * 330 : 630 + R() * 330,
      from: R() < 0.5 ? (R() < 0.5 ? -1 : 1) : 0, // 從左右或上下飛入
      sc: 0.7 + R() * 0.55,
      blur: R() < 0.3 ? 0.6 + R() * 0.4 : 0,
      h: R(),
    });
  }
  return out.sort((a, b) => b.blur - a.blur);
}

// 背景：深藍黑，帶一點遠處的冷光霧
export function drawSpaceBg(K, t) {
  const { ctx } = K;
  const dark = smooth(11.2, 12.0, t) * (1 - smooth(13.2, 15.5, t));
  const g = ctx.createRadialGradient(960, 560, 50, 960, 540, 1250);
  g.addColorStop(0, `rgb(${lerp(14, 6, dark)},${lerp(24, 9, dark)},${lerp(44, 16, dark)})`);
  g.addColorStop(1, `rgb(${lerp(3, 2, dark)},${lerp(5, 3, dark)},${lerp(11, 6, dark)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1920, 1080);
  if (t > T.open && t < 12.2) {
    // 遠景冷光霧，緩慢視差
    const a = smooth(T.open, T.open + 1, t) * (1 - smooth(11.2, 12, t));
    const cx = camX(t);
    for (let i = 0; i < 4; i++) {
      const fx = ((((i * 0.61 + 0.2) * 2400 - cx * 60) % 2600) + 2600) % 2600 - 340;
      const fy = i % 2 ? 330 : 760;
      const rg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 520);
      rg.addColorStop(0, `rgba(40,120,170,${0.13 * a})`);
      rg.addColorStop(1, 'rgba(40,120,170,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(fx - 520, fy - 520, 1040, 1040);
    }
  }
}

function elAlpha(e, t) {
  let a = clamp(1.15 - e.d / 6.6) * clamp((e.d - 0.16) / 0.25);
  if (e.fly) a = 0.85;
  // 從光線向外展開
  const yn = Math.min(1, Math.abs(e.y) / (0.54 * e.d));
  const r0 = T.open + 0.04 + 0.5 * yn + 0.12 * e.h;
  const p = easeOutExpo(inv(r0, r0 + 0.85, t));
  // 停頓後退去
  const rp = smooth(T.stop + 0.2 + 0.25 * e.h, T.stop + 0.75 + 0.25 * e.h, t);
  return { a: a * Math.min(1, p * 1.6) * (1 - rp), p, rp };
}

export function drawSpace(K, t) {
  if (t < T.open || t > 12.3) return;
  const { ctx, g, S } = K;
  const F = focal(t);
  const cx = camX(t);
  const sp = camSpeed(t);
  const sq = squeeze(t);

  // 灰塵：高速時拉成光絲
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  for (const p of DUST) {
    const { a, rp } = elAlpha(p, t);
    if (a <= 0.01) continue;
    const d = p.d * (1 + 0.3 * rp);
    const sx = 960 + (p.x - cx) * (F / d);
    const sy = LINE_Y - p.y * sq * (F / d);
    const streak = (sp * F) / d / 50;
    if (sx < -streak - 50 || sx > 1970) continue;
    const r = (p.s * 2.2 * F) / 1000 / Math.sqrt(d);
    const near = clamp((1.2 - d) / 0.9);
    g.strokeStyle = `rgba(170,220,255,${a * (0.35 - near * 0.2) * (0.6 + 0.4 * Math.sin(t * 3 + p.h * 9))})`;
    g.lineWidth = r * (1 + near * 3);
    g.beginPath();
    g.moveTo(sx - streak / 2, sy);
    g.lineTo(sx + streak / 2 + 0.01, sy);
    g.stroke();
  }
  g.restore();

  for (const e of ELS) {
    const { a, rp, p } = elAlpha(e, t);
    if (a <= 0.004) continue;
    const d = e.d * (1 + 0.35 * rp);
    const s = S[e.kind][e.v];
    const scale = (F / d / 1000) * e.size;
    const sx = 960 + (e.x - cx) * (F / d);
    const sy = LINE_Y - e.y * p * sq * (F / d);
    const half = (s.w * scale) / 2 + 40;
    const streak = (sp * F) / d / 60; // 半快門動態模糊
    if (sx + half + streak < 0 || sx - half - streak > 1920) continue;
    const blurMix = e.fly ? 1 : clamp(Math.max((1.05 - d) / 0.5, (d - 2.2) / 3.2));
    const n = streak > 5 ? Math.min(7, Math.ceil(streak / 9)) : 1;
    for (let k = 0; k < n; k++) {
      const off = n === 1 ? 0 : (k / (n - 1) - 0.5) * streak;
      drawSprite(ctx, s, sx + off, sy, scale, n === 1 ? a : (a * 1.5) / n, blurMix, e.rot);
    }
  }
}

// 時間軸刻度、播放頭
export function drawRuler(K, t) {
  if (t < T.stretch + 0.05 || t > T.stop + 0.6) return;
  const { g } = K;
  const F = focal(t);
  const cx = camX(t);
  const a = smooth(T.stretch + 0.1, T.open, t) * (1 - 0.65 * smooth(7.5, 10.5, t)) * (1 - smooth(T.stop + 0.15, T.stop + 0.6, t));
  const step = 0.1;
  const px = (step * F) / DLINE;
  const first = Math.floor((cx - (960 * DLINE) / F) / step) - 1;
  const last = Math.ceil((cx + (960 * DLINE) / F) / step) + 1;
  const streak = Math.min(px * 0.9, (camSpeed(t) * F) / DLINE / 60);
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = first; i <= last; i++) {
    const sx = 960 + (i * step - cx) * (F / DLINE);
    const major = i % 10 === 0;
    // 從中央往兩側展開
    const reveal = easeOutExpo(inv(T.stretch + 0.05, T.stretch + 0.35, t)) * 1100;
    if (Math.abs(sx - 960) > reveal) continue;
    g.fillStyle = `rgba(200,230,255,${a * (major ? 0.55 : 0.28)})`;
    g.fillRect(sx - 0.6 - streak / 2, LINE_Y + 8, 1.2 + streak, major ? 16 : 7);
    if (major && streak < 30) {
      g.font = `300 17px ${SANS}`;
      g.fillStyle = `rgba(200,230,255,${a * 0.45 * (1 - streak / 30)})`;
      g.fillText('00:' + String(Math.max(0, i / 10)).padStart(2, '0'), sx + 6, LINE_Y + 42);
    }
  }
  g.restore();
}

// 游標閃爍 → 播放頭
export function drawCursor(K, t) {
  const { g } = K;
  let on = 0;
  if (t >= T.blink1 && t < T.blink1 + 0.26) on = 1;
  if (t >= T.blink2 && t < T.blink2 + 0.26) on = 1;
  if (t >= T.stretch) on = 1 - smooth(2.4, 3.4, t);
  if (on <= 0) return;
  const k = easeOutCubic(inv(T.stretch, T.stretch + 0.25, t));
  const hgt = lerp(64, 30, k);
  const w = lerp(5, 2.2, k);
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = `rgba(120,210,255,${0.22 * on})`;
  g.fillRect(960 - w * 3, LINE_Y - hgt / 2 - 6, w * 6, hgt + 12);
  g.fillStyle = `rgba(240,248,255,${on})`;
  g.fillRect(960 - w / 2, LINE_Y - hgt / 2, w, hgt);
  g.restore();
}

// 打開瞬間的光帶
export function drawOpenFlash(K, t) {
  const p = inv(T.open, T.open + 0.9, t);
  if (p <= 0 || p >= 1) return;
  const { g } = K;
  const e = easeOutExpo(p);
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const dir of [-1, 1]) {
    const y = LINE_Y + dir * e * 600;
    const gr = g.createLinearGradient(0, y - 60, 0, y + 60);
    const a = 0.22 * (1 - p);
    gr.addColorStop(0, 'rgba(90,200,255,0)');
    gr.addColorStop(0.5, `rgba(150,220,255,${a})`);
    gr.addColorStop(1, 'rgba(90,200,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, y - 60, 1920, 120);
  }
  g.restore();
}

// ---------- 三段組裝 ----------
const STROKE = (a) => `rgba(236,244,255,${a})`;

function glowStroke(g, a, w = 2.5, color = [236, 244, 255]) {
  const [r, gg, b] = color;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = `rgba(110,200,255,${0.16 * a})`;
  g.lineWidth = w * 5;
  g.stroke();
  g.strokeStyle = `rgba(${r},${gg},${b},${a})`;
  g.lineWidth = w;
  g.stroke();
}

function exitTf(u, start, end) {
  const k = easeInCubic(inv(start, end, u));
  return { dx: -k * 1500, s: 1 - 0.2 * k, a: 1 - smooth(start + (end - start) * 0.5, end, u) };
}

// 1. 一段文字變成影片
function asm1(K, t) {
  const u = t - T.asm1;
  if (u < 0 || u > 1.5) return;
  const { ctx, g } = K;
  const ex = exitTf(u, 1.0, 1.45);
  const fx = 960;
  const fy = 340;
  const fw = 440;
  const fh = 248;
  const L = fx - fw / 2;
  const Rr = fx + fw / 2;
  const Tt = fy - fh / 2;
  const B = fy + fh / 2;
  const starts = [
    [780, 286, 1080, 286],
    [780, 318, 1150, 318],
    [780, 350, 1110, 350],
    [780, 382, 1130, 382],
    [780, 414, 990, 414],
  ];
  const ends = [
    [L, Tt, Rr, Tt],
    [Rr, Tt, Rr, B],
    [Rr, B, L, B],
    [L, B, L, Tt],
    [L, B + 34, Rr, B + 34],
  ];
  g.save();
  ctx.save();
  for (const c of [g, ctx]) {
    c.translate(960 + ex.dx, 400);
    c.scale(ex.s, ex.s);
    c.translate(-960, -400);
  }
  const done = smooth(0.78, 0.86, u);
  // 影片畫面內容：淡淡的地平線預告後段
  if (done > 0) {
    const gr = ctx.createLinearGradient(0, Tt, 0, B);
    gr.addColorStop(0, `rgba(16,30,56,${0.9 * done * ex.a})`);
    gr.addColorStop(0.62, `rgba(40,70,110,${0.9 * done * ex.a})`);
    gr.addColorStop(1, `rgba(10,18,34,${0.9 * done * ex.a})`);
    ctx.fillStyle = gr;
    ctx.fillRect(L, Tt, fw, fh);
    ctx.fillStyle = `rgba(255,214,160,${0.5 * done * ex.a})`;
    ctx.fillRect(L, Tt + fh * 0.62, fw, 1.5);
  }
  for (let i = 0; i < 5; i++) {
    const typ = clamp((u - i * 0.04) / 0.18);
    const mk = easeInOutCubic(inv(0.32 + i * 0.04, 0.72 + i * 0.03, u));
    const s = starts[i];
    const e = ends[i];
    const x0 = lerp(s[0], e[0], mk);
    const y0 = lerp(s[1], e[1], mk);
    let x1 = lerp(s[2], e[2], mk);
    let y1 = lerp(s[3], e[3], mk);
    x1 = lerp(x0, x1, typ);
    y1 = lerp(y0, y1, typ);
    const w = lerp(9, i === 4 ? 4 : 2.6, mk);
    if (i === 0 && mk < 0.15) {
      // 第一行是真的字
      const ta = (1 - mk / 0.15) * typ;
      ctx.font = `500 34px ${SANS}`;
      ctx.fillStyle = `rgba(240,246,255,${ta * ex.a})`;
      ctx.fillText('一段文字', 780, 298);
      if (mk === 0) continue;
    }
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    glowStroke(g, (i === 0 ? smooth(0, 0.15, mk) : 0.75 + 0.25 * mk) * ex.a, w);
  }
  if (done > 0) {
    // 播放鍵
    const pk = easeOutBack(inv(0.8, 0.95, u));
    g.beginPath();
    g.moveTo(fx - 22 * pk, fy - 28 * pk);
    g.lineTo(fx + 30 * pk, fy);
    g.lineTo(fx - 22 * pk, fy + 28 * pk);
    g.closePath();
    g.fillStyle = `rgba(240,248,255,${0.9 * ex.a})`;
    g.fill();
    // 播放頭跑過時間軸
    const ph = lerp(L, Rr, clamp((u - 0.85) / 0.6));
    g.fillStyle = `rgba(95,216,255,${ex.a})`;
    g.fillRect(ph - 1.5, B + 22, 3, 24);
    // 完成閃光
    const fl = Math.max(0, 1 - Math.abs(u - 0.82) / 0.12);
    if (fl > 0) {
      g.strokeStyle = `rgba(160,225,255,${0.5 * fl})`;
      g.lineWidth = 14;
      g.strokeRect(L, Tt, fw, fh);
    }
  }
  ctx.restore();
  g.restore();
}

// 2. 一個想法變成舞台
function asm2(K, t) {
  const u = t - T.asm2;
  if (u < 0 || u > 1.5) return;
  const { g } = K;
  const ex = exitTf(u, 1.0, 1.45);
  g.save();
  g.translate(960 + ex.dx, 420);
  g.scale(ex.s, ex.s);
  g.translate(-960, -420);
  const sx = 960;
  const sy = 250;
  const pop = easeOutBack(inv(0, 0.14, u), 2.2);
  const pulse = 1 + 0.15 * Math.sin(u * 18) * (1 - clamp(u / 0.6));
  // 火花
  const rg = g.createRadialGradient(sx, sy, 0, sx, sy, 60 * pop);
  rg.addColorStop(0, `rgba(255,255,255,${ex.a})`);
  rg.addColorStop(0.15, `rgba(170,230,255,${0.7 * ex.a})`);
  rg.addColorStop(1, 'rgba(90,200,255,0)');
  g.fillStyle = rg;
  g.beginPath();
  g.arc(sx, sy, 60 * pop * pulse, 0, Math.PI * 2);
  g.fill();
  // 光錐
  const ck = easeOutCubic(inv(0.15, 0.55, u));
  const bw = 175;
  if (ck > 0) {
    const cone = g.createLinearGradient(0, sy, 0, LINE_Y);
    cone.addColorStop(0, `rgba(150,215,255,${0.2 * ex.a * ck})`);
    cone.addColorStop(1, `rgba(150,215,255,${0.06 * ex.a * ck})`);
    g.fillStyle = cone;
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx - bw * ck, lerp(sy, LINE_Y, ck));
    g.lineTo(sx + bw * ck, lerp(sy, LINE_Y, ck));
    g.closePath();
    g.fill();
    for (const dir of [-1, 1]) {
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(sx + dir * bw * ck, lerp(sy, LINE_Y, ck));
      glowStroke(g, 0.8 * ex.a, 2);
    }
  }
  // 舞台橢圓
  const ek = easeInOutCubic(inv(0.4, 0.72, u));
  if (ek > 0) {
    g.beginPath();
    g.ellipse(sx, LINE_Y, bw, 34, 0, Math.PI, Math.PI + Math.PI * 2 * ek, false);
    glowStroke(g, 0.9 * ex.a, 2.4);
  }
  // 麥克風架
  const mk = easeOutCubic(inv(0.55, 0.78, u));
  if (mk > 0) {
    g.beginPath();
    g.moveTo(sx, LINE_Y);
    g.lineTo(sx, LINE_Y - 120 * mk);
    glowStroke(g, ex.a, 2.2);
    g.beginPath();
    g.ellipse(sx, LINE_Y - 120 * mk - 10, 7, 12, 0, 0, Math.PI * 2);
    g.fillStyle = `rgba(236,244,255,${ex.a * mk})`;
    g.fill();
  }
  const fl = Math.max(0, 1 - Math.abs(u - 0.72) / 0.12);
  if (fl > 0) {
    g.beginPath();
    g.ellipse(sx, LINE_Y, bw + 10, 40, 0, 0, Math.PI * 2);
    g.strokeStyle = `rgba(160,225,255,${0.45 * fl})`;
    g.lineWidth = 12;
    g.stroke();
  }
  g.restore();
}

// 3. 一條音波變成作品：主線上冒出波形，捲成唱片
const WSEG = 560;
const waveShape = (s, seed = 3) => Math.sin(Math.PI * s) ** 2 * (0.6 * Math.sin(s * 44) + 0.4 * Math.sin(s * 97 + 1.3) * noise1(s * 9, seed));
export function lineWaveDisp(x, t) {
  // 給主線用：6.8–7.15 秒中央段在震盪
  const u = t - T.asm3;
  if (u < 0 || u > 0.4) return 0;
  const s = (x - (960 - WSEG / 2)) / WSEG;
  if (s < 0 || s > 1) return 0;
  const amp = 46 * smooth(0, 0.12, u) * (1 - smooth(0.3, 0.38, u));
  return -amp * waveShape(s) * (0.7 + 0.3 * Math.sin(u * 60 + s * 20));
}
function asm3(K, t) {
  const u = t - T.asm3;
  if (u < 0.3 || u > 1.25) return;
  const { g } = K;
  const ex = exitTf(u, 0.9, 1.22);
  const k = easeInOutCubic(inv(0.32, 0.72, u));
  const r = WSEG / (2 * Math.PI);
  const cy = lerp(LINE_Y, 330 + r, k); // 圓的最下點
  const kap = (k * 2 * Math.PI) / WSEG;
  const rot = easeInCubic(inv(0.7, 1.2, u)) * 4 + (k > 0.99 ? (u - 0.72) * 2 : 0);
  const ccx = 960;
  const ccy = cy - r;
  g.save();
  g.translate(960 + ex.dx, 400);
  g.scale(ex.s, ex.s);
  g.translate(-960, -400);
  const disc = smooth(0.68, 0.82, u);
  if (disc > 0) {
    // 唱片紋路
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.arc(ccx, ccy, 22 + i * 7.5, rot + i * 0.7, rot + i * 0.7 + Math.PI * 1.5);
      g.strokeStyle = `rgba(190,225,255,${0.22 * disc * ex.a})`;
      g.lineWidth = 1.2;
      g.stroke();
    }
    const lg = g.createRadialGradient(ccx, ccy, 0, ccx, ccy, 18);
    lg.addColorStop(0, `rgba(255,255,255,${disc * ex.a})`);
    lg.addColorStop(1, `rgba(95,216,255,${0.3 * disc * ex.a})`);
    g.fillStyle = lg;
    g.beginPath();
    g.arc(ccx, ccy, 16, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  const amp = 46 * (1 - 0.8 * k);
  for (let i = 0; i <= 200; i++) {
    const s = i / 200;
    const us = (s - 0.5) * WSEG;
    let px;
    let py;
    let nx;
    let ny;
    if (kap < 1e-5) {
      px = us;
      py = 0;
      nx = 0;
      ny = 1;
    } else {
      const th = us * kap;
      px = Math.sin(th) / kap;
      py = -(1 - Math.cos(th)) / kap;
      nx = Math.sin(th);
      ny = Math.cos(th);
    }
    const w = amp * waveShape(s);
    let X = ccx + 0 + px - nx * w;
    let Y = cy + py - ny * w;
    // 繞圓心旋轉
    if (rot) {
      const dx = X - ccx;
      const dy = Y - ccy;
      X = ccx + dx * Math.cos(rot) - dy * Math.sin(rot);
      Y = ccy + dx * Math.sin(rot) + dy * Math.cos(rot);
    }
    i ? g.lineTo(X, Y) : g.moveTo(X, Y);
  }
  glowStroke(g, ex.a, 2.2);
  const fl = Math.max(0, 1 - Math.abs(u - 0.74) / 0.12);
  if (fl > 0) {
    g.beginPath();
    g.arc(ccx, ccy, r + 30, 0, Math.PI * 2);
    g.strokeStyle = `rgba(160,225,255,${0.4 * fl})`;
    g.lineWidth = 12;
    g.stroke();
  }
  g.restore();
}

export function drawAssembly(K, t) {
  asm1(K, t);
  asm2(K, t);
  asm3(K, t);
}

// ---------- 擁擠 ----------
export function drawCrowd(K, t) {
  if (t < T.crowd || t > 12.2) return;
  const { ctx, S } = K;
  const t2 = tf(t);
  const sq = squeeze(t);
  const fade = 1 - smooth(T.stop + 0.2, T.stop + 0.8, t);
  const shrink = 1 - 0.05 * smooth(T.stop + 0.2, T.stop + 0.8, t);
  const press = (y) => LINE_Y + (y - LINE_Y) * lerp(1, 0.55, 1 - sq) ;
  for (const c of CROWD) {
    const p = easeOutCubic(inv(c.t, c.t + 0.35, t2));
    if (p <= 0) continue;
    const s = S.small[c.v];
    let x = c.x;
    let y = press(c.y);
    if (c.from) x += c.from * (1 - p) * 1300;
    else y += (c.y < LINE_Y ? -1 : 1) * (1 - p) * 700;
    const jit = smooth(9.5, 11, t2) * 3;
    x += noise1(t2 * 8 + c.h * 50) * jit;
    y += noise1(t2 * 8 + c.h * 90) * jit;
    drawSprite(ctx, s, x, y, c.sc * (0.9 + 0.1 * p) * shrink, 0.85 * fade * Math.min(1, p * 2), c.blur);
  }
  for (const b of BIG) {
    const p = inv(b.t, b.t + 0.3, t2);
    if (p <= 0) continue;
    const sc = easeOutBack(p, 2) * (1 + 0.04 * smooth(9.5, 11, t2)) * shrink;
    const jit = smooth(9.6, 11, t2) * 4;
    const x = b.x + noise1(t2 * 10 + b.t) * jit;
    const y = press(b.y) + noise1(t2 * 10 + b.t * 3) * jit;
    drawSprite(ctx, b.s, x, y, sc, fade, 0);
  }
}

// 上下壓迫的暗場：空間越來越窄
export function drawWalls(K, t) {
  const k = smooth(7.9, T.stop, Math.min(t, T.stop)) * (1 - smooth(T.stop + 0.25, T.stop + 1.0, t));
  if (k <= 0) return;
  const { ctx } = K;
  const h = 1080 * 0.4 * k;
  for (const top of [true, false]) {
    const y0 = top ? 0 : 1080;
    const y1 = top ? h : 1080 - h;
    const gr = ctx.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, `rgba(1,2,5,${0.92 * k})`);
    gr.addColorStop(0.6, `rgba(1,2,5,${0.6 * k})`);
    gr.addColorStop(1, 'rgba(1,2,5,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, Math.min(y0, y1), 1920, Math.abs(y1 - y0));
  }
}

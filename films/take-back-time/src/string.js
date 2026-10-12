// 貫穿全片的光線：時間軸（緊繃）→ 停頓 → 撥弦 → 貼近琴弦 → 海平線
import { T } from './timeline.js';
import { clamp, lerp, inv, smooth, easeOutExpo, easeInOutCubic, noise1, hex, mixc, rgba } from './util.js';
import { LINE_Y, lineWaveDisp } from './space.js';

export const HORIZON_Y = 600;
const COLD = hex('#eef6ff');
const COLD_GLOW = hex('#7fd4ff');
export const WARM = hex('#fff1d6');
export const WARM_GLOW = hex('#ffb866');

const PLUCK_X = 1180;
const SPAN0 = -260;
const SPAN1 = 2180;
const VIS_F = 5.2; // 畫面上的振動頻率（慢動作）
const AMP = 64; // 撥弦拉開的像素

// 撥弦後的位移：以撥弦點為三角形初始形狀的模態疊加
function pluckDisp(x, t) {
  const up = (PLUCK_X - SPAN0) / (SPAN1 - SPAN0);
  const u = (x - SPAN0) / (SPAN1 - SPAN0);
  if (t < T.pluck) {
    // 手指按住，慢慢拉開
    const pull = AMP * easeInOutCubic(inv(T.pluck - 0.32, T.pluck, t));
    return -(u < up ? (u / up) * pull : ((1 - u) / (1 - up)) * pull);
  }
  const tau = t - T.pluck;
  let y = 0;
  for (let n = 1; n <= 6; n++) {
    const an = (2 / (n * n * Math.PI * Math.PI * up * (1 - up))) * Math.sin(n * Math.PI * up);
    const dec = Math.exp(-tau * (0.7 + 0.35 * n));
    y += an * Math.sin(n * Math.PI * u) * Math.cos(2 * Math.PI * VIS_F * n * tau * (1 + 0.002 * n * n)) * dec;
  }
  return -AMP * y;
}
function pluckEnv(x, t) {
  const tau = t - T.pluck;
  if (tau < 0) return 0;
  const up = (PLUCK_X - SPAN0) / (SPAN1 - SPAN0);
  const u = (x - SPAN0) / (SPAN1 - SPAN0);
  let e = 0;
  for (let n = 1; n <= 4; n++) {
    const an = (2 / (n * n * Math.PI * Math.PI * up * (1 - up))) * Math.sin(n * Math.PI * up);
    e += Math.abs(an * Math.sin(n * Math.PI * u)) * Math.exp(-tau * (0.7 + 0.35 * n));
  }
  return AMP * e;
}

// 推近鏡頭的倍率與錨點
export function zoomAt(t) {
  const zin = easeInOutCubic(inv(T.closeUp, T.horizon, t));
  const zout = easeInOutCubic(inv(T.horizon, T.horizon + 1.25, t));
  const Z = Math.exp(Math.log(14) * zin * (1 - zout));
  const y = lerp(LINE_Y, HORIZON_Y, zout);
  return { Z, y, zout };
}

// 光線狀態
export function lineState(t) {
  const tension = smooth(7.8, T.stop, Math.min(t, T.stop));
  const after = smooth(T.stop + 0.3, T.stop + 1.0, t);
  let width = lerp(2.0, 1.35, tension);
  width = lerp(width, 2.4, smooth(T.pluck, T.closeUp + 0.8, t));
  let inten = lerp(0.85, 1.15, tension);
  inten = lerp(inten, 0.9, after);
  // 撥弦瞬間變亮
  const pl = t > T.pluck ? Math.exp(-(t - T.pluck) * 2.2) : 0;
  inten += 0.45 * pl;
  const warm = smooth(T.pluck, T.horizon - 0.3, t);
  return { width, inten, tension, warm };
}

// 主線（16.8 秒之前）
export function drawHeroLine(K, t) {
  if (t < T.stretch || t > T.horizon + 1.4) return;
  const { g, ctx } = K;
  const st = lineState(t);
  const { Z, y: ay, zout } = zoomAt(t);
  const half = easeOutExpo(inv(T.stretch, T.stretch + 0.32, t)) * 1150;
  const col = mixc(COLD, WARM, st.warm);
  const gcol = mixc(COLD_GLOW, WARM_GLOW, st.warm);
  const t2 = Math.min(t, T.stop);
  const jitA = st.tension * (t < T.stop ? 1 : 0) * 1.6;

  // 線上每點的位移（世界座標，未縮放）
  const disp = (x) => {
    let d = lineWaveDisp(x, t);
    if (jitA > 0) d += jitA * (Math.sin(x * 0.11 + t2 * 140) * 0.6 + noise1(x * 0.02 + t2 * 30) * 0.8);
    if (t > T.pluck - 0.35) d += pluckDisp(x, t);
    return d;
  };
  // 推近：x 以 960 為中心縮放，y 以錨點縮放
  const X = (x) => 960 + (x - 960) * Z;
  const Y = (y) => ay + (y - LINE_Y) * Z;
  const x0w = 960 - Math.min(half, 960 / Z + 40);
  const x1w = 960 + Math.min(half, 960 / Z + 40);
  const step = Math.max(0.5, 5 / Z);

  const path = (c, off = 0) => {
    c.beginPath();
    for (let x = x0w; x <= x1w + step; x += step) {
      const sx = X(x);
      const sy = Y(LINE_Y + disp(x) + off);
      x === x0w ? c.moveTo(sx, sy) : c.lineTo(sx, sy);
    }
  };

  const w = st.width * Z;
  const tex = smooth(2.5, 6, Z) * (1 - zout * 0.0);
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  g.lineJoin = 'round';

  // 振動包絡（像真實照片裡琴弦的殘影）
  if (t > T.pluck) {
    g.beginPath();
    for (let x = x0w; x <= x1w; x += step * 2) g.lineTo(X(x), Y(LINE_Y - pluckEnv(x, t)));
    for (let x = x1w; x >= x0w; x -= step * 2) g.lineTo(X(x), Y(LINE_Y + pluckEnv(x, t)));
    g.closePath();
    g.fillStyle = rgba(gcol, 0.13 * st.inten * (1 - tex * 0.6));
    g.fill();
    // 殘影
    for (let k = 1; k <= 3; k++) {
      const tt = t - k * 0.011;
      g.beginPath();
      for (let x = x0w; x <= x1w + step; x += step) g.lineTo(X(x), Y(LINE_Y + pluckDisp(x, tt)));
      g.strokeStyle = rgba(col, (0.35 / k) * st.inten * (1 - tex));
      g.lineWidth = Math.max(1, w);
      g.stroke();
    }
  }

  const hand = 1 - smooth(T.horizon + 0.9, T.horizon + 1.25, t); // 交棒給海平線
  const ia = st.inten * (1 - tex * 0.9) * hand;
  if (ia > 0.01) {
    path(g);
    g.strokeStyle = rgba(gcol, 0.05 * ia);
    g.lineWidth = w * 14 + 10;
    g.stroke();
    g.strokeStyle = rgba(gcol, 0.2 * ia);
    g.lineWidth = w * 4.5 + 2;
    g.stroke();
    g.strokeStyle = rgba(col, 0.75 * ia);
    g.lineWidth = w * 1.7;
    g.stroke();
    g.strokeStyle = rgba([255, 255, 255], Math.min(1, ia));
    g.lineWidth = Math.max(0.8, w * 0.8);
    g.stroke();
  }
  g.restore();

  // 貼近時：纏繞的銅弦材質
  if (tex > 0.01 && hand > 0) drawWoundString(ctx, g, t, path, w * 1.7, tex, X, Y, x0w, x1w, step, disp);

  // 手指碰到弦的一點光
  const touch = smooth(T.pluck - 0.35, T.pluck - 0.25, t) * (1 - smooth(T.pluck, T.pluck + 0.12, t));
  if (touch > 0) {
    const px = X(PLUCK_X);
    const py = Y(LINE_Y + pluckDisp(PLUCK_X, t));
    const rg = g.createRadialGradient(px, py, 0, px, py, 26);
    rg.addColorStop(0, `rgba(255,236,200,${0.9 * touch})`);
    rg.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = rg;
    g.fillRect(px - 30, py - 30, 60, 60);
  }
}

function drawWoundString(ctx, g, t, path, w, tex, X, Y, x0w, x1w, step, disp) {
  // 以位移後的中心線為基準畫一條帶狀材質
  const top = [];
  const bot = [];
  for (let x = x0w; x <= x1w + step; x += step) {
    const sx = X(x);
    const sy = Y(LINE_Y + disp(x));
    top.push([sx, sy - w / 2]);
    bot.push([sx, sy + w / 2]);
  }
  ctx.save();
  ctx.globalAlpha = tex;
  ctx.beginPath();
  top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
  ctx.closePath();
  ctx.clip();
  const midY = (top[Math.floor(top.length / 2)][1] + bot[Math.floor(bot.length / 2)][1]) / 2;
  const gr = ctx.createLinearGradient(0, midY - w / 2, 0, midY + w / 2);
  gr.addColorStop(0, '#3a2412');
  gr.addColorStop(0.22, '#b88446');
  gr.addColorStop(0.34, '#ffe7b8');
  gr.addColorStop(0.5, '#c58a45');
  gr.addColorStop(0.85, '#4a2c12');
  gr.addColorStop(1, '#1e1208');
  ctx.fillStyle = gr;
  ctx.fillRect(0, midY - w, 1920, w * 2);
  // 纏繞紋路：斜線週期約等於弦粗
  const period = w * 0.55;
  const off = (t * 40) % period;
  ctx.lineWidth = Math.max(1, period * 0.16);
  for (let x = -w - off; x < 1920 + w; x += period) {
    ctx.strokeStyle = 'rgba(40,22,8,0.55)';
    ctx.beginPath();
    ctx.moveTo(x, midY - w);
    ctx.lineTo(x + w * 0.42, midY + w);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,180,0.25)';
    ctx.beginPath();
    ctx.moveTo(x + period * 0.28, midY - w);
    ctx.lineTo(x + period * 0.28 + w * 0.42, midY + w);
    ctx.stroke();
  }
  ctx.restore();
  // 高光進入發光層
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.beginPath();
  top.forEach((p, i) => {
    const y = p[1] + w * 0.33;
    i ? g.lineTo(p[0], y) : g.moveTo(p[0], y);
  });
  g.strokeStyle = `rgba(255,226,170,${0.5 * tex})`;
  g.lineWidth = Math.max(1, w * 0.08);
  g.stroke();
  g.strokeStyle = `rgba(255,190,110,${0.12 * tex})`;
  g.lineWidth = w * 0.9;
  g.stroke();
  g.restore();
}

// 海平線上的光線（16 秒後由海景負責繪製，外觀與主線收尾一致）
export function drawHorizonLine(g, inten = 1, pulses = [], y = HORIZON_Y, alpha = 1) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  const passes = [
    [WARM_GLOW, 0.06, 26],
    [WARM_GLOW, 0.2, 9],
    [WARM, 0.7, 3.2],
    [[255, 255, 255], 0.85, 1.4],
  ];
  for (const [c, a, lw] of passes) {
    g.strokeStyle = rgba(c, a * inten * alpha);
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-20, y);
    g.lineTo(1940, y);
    g.stroke();
  }
  // 吉他每一個音，海平線上一道光脈衝
  for (const p of pulses) {
    const gr = g.createLinearGradient(p.x - p.w, 0, p.x + p.w, 0);
    gr.addColorStop(0, 'rgba(255,220,160,0)');
    gr.addColorStop(0.5, `rgba(255,236,200,${p.a * alpha})`);
    gr.addColorStop(1, 'rgba(255,220,160,0)');
    g.fillStyle = gr;
    g.fillRect(p.x - p.w, y - 3, p.w * 2, 6);
  }
  g.restore();
}
export { clamp };

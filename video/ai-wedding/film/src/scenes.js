// 场景背景：先用代码画（国漫电影感的暖色平涂 + 渐变），主理人的 AI 背景图放进 assets/bg/ 后优先用图
// 每个场景都按「世界坐标 1920×1080」画，镜头由 cam = { x, y, z }（焦点和缩放）控制，远景视差小
import { W, H, rr, shade, FONT, rng, clamp, layer } from './util.js';
export const layerOf = (n) => layer(n);

const LIGHTS = {
  dawn: { sky: ['#F8D9A8', '#F5B98A', '#E9A27C'], sun: '#FFE7B0', tint: 'rgba(255,190,120,0.10)', shadow: 'rgba(90,50,30,0.25)' },
  day: { sky: ['#BFE3F2', '#E6F2EC', '#F7E8CF'], sun: '#FFF6DC', tint: 'rgba(255,240,210,0.05)', shadow: 'rgba(60,50,40,0.22)' },
  dusk: { sky: ['#F6C9A0', '#F2A57E', '#C9787A'], sun: '#FFD59A', tint: 'rgba(255,150,90,0.14)', shadow: 'rgba(80,40,40,0.3)' },
  night: { sky: ['#1A2440', '#2A3558', '#3E4468'], sun: '#FFE9B0', tint: 'rgba(40,60,120,0.25)', shadow: 'rgba(10,10,30,0.4)' },
};

// 主理人背景图（可选）：assets/bg/K4.jpg 等，存在就用
const BG = {};
export async function loadBackgrounds() {
  for (const k of ['K4', 'K5', 'K6', 'K7', 'K8']) {
    for (const ext of ['jpg', 'png', 'webp']) {
      const img = new Image();
      img.src = `../../assets/bg/${k}.${ext}`;
      try { await img.decode(); BG[k] = img; break; } catch { /* 没有这张图就用代码画 */ }
    }
  }
}
function imageBG(ctx, k) {
  const img = BG[k];
  if (!img) return false;
  const s = Math.max(W / img.width, H / img.height);
  ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
  return true;
}

export function withCam(ctx, cam, depth, fn) {
  // depth：0 = 无限远（不动），1 = 主体平面
  const z = 1 + ((cam.z ?? 1) - 1) * depth;
  const cx = W / 2 + ((cam.x ?? W / 2) - W / 2) * depth, cy = H / 2 + ((cam.y ?? H / 2) - H / 2) * depth;
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}

function sky(ctx, L) {
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.7);
  g.addColorStop(0, L.sky[0]); g.addColorStop(0.6, L.sky[1]); g.addColorStop(1, L.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
}

function lantern(ctx, x, y, s, on = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#5A2A1E'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -16); ctx.stroke();
  if (on) { const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 60); g.addColorStop(0, 'rgba(255,190,110,0.55)'); g.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 60, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0, 0, 18, 16, 0, 0, 7); ctx.fillStyle = '#D9342B'; ctx.fill(); ctx.strokeStyle = '#7A1E18'; ctx.stroke();
  ctx.fillStyle = '#E8B04B'; ctx.fillRect(-8, -18, 16, 4); ctx.fillRect(-8, 14, 16, 4);
  ctx.strokeStyle = '#E8B04B'; ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, 32); ctx.stroke();
  ctx.restore();
}

function sign(ctx, x, y, w, h, bg, fg, text, size, font = FONT.fun) {
  rr(ctx, x, y, w, h, 8); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = shade(bg, -0.35); ctx.stroke();
  if (!text) return;
  ctx.fillStyle = fg; ctx.font = `${size}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + size * 0.05);
}

function xi(ctx, x, y, s, color = '#E8B04B') {
  // 「囍」字剪纸（代码写，不用 AI 画字）
  ctx.save(); ctx.fillStyle = color; ctx.font = `${s}px ${FONT.body}`; ctx.font = `900 ${s}px ${FONT.body}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('囍', x, y); ctx.restore();
}

// ── 婚庆一条街：左边小陈的红色婚庆店，右边小李的青绿色工作室 ──
export function street(ctx, o = {}) {
  const L = LIGHTS[o.light || 'day'], cam = o.cam || {}, t = o.t || 0;
  const night = o.light === 'night';
  withCam(ctx, cam, 0.15, () => {
    if (imageBG(ctx, 'K4')) return;
    sky(ctx, L);
    // 太阳 / 月亮
    const g = ctx.createRadialGradient(960, 470, 10, 960, 470, 360);
    g.addColorStop(0, L.sun); g.addColorStop(1, 'rgba(255,230,180,0)');
    ctx.fillStyle = g; ctx.fillRect(500, 100, 920, 700);
    // 远山
    ctx.fillStyle = night ? '#2E3656' : shade(L.sky[2], -0.12);
    ctx.beginPath(); ctx.moveTo(-200, 560);
    for (let x = -200; x <= 2200; x += 120) ctx.lineTo(x, 470 + Math.sin(x * 0.006) * 40 + Math.sin(x * 0.017) * 18);
    ctx.lineTo(2200, 700); ctx.lineTo(-200, 700); ctx.fill();
    if (night) { const r = rng(7); ctx.fillStyle = 'rgba(255,255,230,0.8)'; for (let i = 0; i < 60; i++) ctx.fillRect(r() * W, r() * 380, 2, 2); }
  });
  if (BG.K4) return streetSigns(ctx, o);
  withCam(ctx, cam, 0.6, () => {
    // 远处两排店铺（一点透视，消失点在中间）
    const vx = 960, vy = 540;
    for (const side of [-1, 1]) {
      for (let i = 9; i >= 0; i--) {
        const k = i / 9, near = 1 - k;
        const x0 = vx + side * (90 + near * 520), w = 30 + near * 150, top = vy - 40 - near * 260, bot = vy + 30 + near * 220;
        const c = (i + (side > 0 ? 1 : 0)) % 3 === 0 ? '#B8443B' : (i % 3 === 1 ? '#C9A27A' : '#A86F55');
        ctx.fillStyle = night ? shade(c, -0.55) : shade(c, -0.05 * k);
        const xa = side > 0 ? x0 : x0 - w;
        ctx.fillRect(xa, top, w, bot - top);
        // 屋檐
        ctx.fillStyle = night ? '#1E1E2C' : '#4A3A38';
        ctx.beginPath(); ctx.moveTo(xa - 8, top); ctx.lineTo(xa + w + 8, top); ctx.lineTo(xa + w, top - 14 - near * 12); ctx.lineTo(xa, top - 14 - near * 12); ctx.fill();
        // 窗灯
        ctx.fillStyle = night ? 'rgba(255,205,130,0.85)' : 'rgba(255,240,210,0.55)';
        ctx.fillRect(xa + w * 0.2, top + (bot - top) * 0.45, w * 0.6, (bot - top) * 0.3);
        if (i % 2 === 0) lantern(ctx, side > 0 ? xa + 6 : xa + w - 6, top + 26, 0.3 + near * 0.6, night ? 1 : 0.4);
      }
    }
    // 远处牌坊「婚庆一条街」
    ctx.fillStyle = '#8E2A33'; ctx.fillRect(870, 470, 8, 70); ctx.fillRect(1042, 470, 8, 70);
    sign(ctx, 860, 448, 200, 36, '#C8343A', '#FBE7B5', '婚庆一条街', 24);
  });
  withCam(ctx, cam, 1, () => {
    // 地面：石板路透视
    const g2 = ctx.createLinearGradient(0, 560, 0, H);
    g2.addColorStop(0, night ? '#4A4458' : '#D9B596'); g2.addColorStop(1, night ? '#2C2836' : '#B58E72');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(-300, H + 200); ctx.lineTo(880, 560); ctx.lineTo(1040, 560); ctx.lineTo(2220, H + 200); ctx.fill();
    ctx.strokeStyle = night ? 'rgba(0,0,0,0.25)' : 'rgba(110,70,50,0.25)'; ctx.lineWidth = 2;
    for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 10, 560); ctx.lineTo(960 + i * 260, H + 200); ctx.stroke(); }
    for (let k = 0; k < 14; k++) { const y = 560 + Math.pow(k / 14, 2) * 720; ctx.beginPath(); ctx.moveTo(-300, y); ctx.lineTo(2220, y); ctx.stroke(); }
    shopChen(ctx, night, t);
    shopLi(ctx, night, t, o.liLit);
  });
  ctx.fillStyle = L.tint; ctx.fillRect(0, 0, W, H);
}

function streetSigns() { /* 主理人背景图到位后在这里叠店招文字 */ }

function shopChen(ctx, night, t) {
  // 左侧近景：红色婚庆店（小陈婚庆）
  ctx.fillStyle = night ? '#5A1E22' : '#B5323A';
  ctx.beginPath(); ctx.moveTo(-40, 40); ctx.lineTo(560, 200); ctx.lineTo(560, 820); ctx.lineTo(-40, 1040); ctx.fill();
  ctx.fillStyle = night ? '#3E1418' : '#8E2A33';
  ctx.beginPath(); ctx.moveTo(-40, 40); ctx.lineTo(560, 200); ctx.lineTo(560, 236); ctx.lineTo(-40, 96); ctx.fill();
  // 招牌
  ctx.save(); ctx.transform(1, 0.25, 0, 1, 0, 0);
  sign(ctx, 40, 130 - 10, 470, 120, night ? '#6A1C22' : '#9E2530', '#F6D28A', '小陈婚庆', 76);
  xi(ctx, 80, 182, 0, '#F6D28A');
  ctx.restore();
  // 橱窗（暖光 + 婚纱剪影）
  ctx.save(); ctx.transform(1, 0.22, 0, 1, 0, 0);
  const wx = 60, wy = 300, ww = 420, wh = 360;
  rr(ctx, wx, wy, ww, wh, 10);
  const g = ctx.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, night ? '#F7C77E' : '#FCE6C4'); g.addColorStop(1, night ? '#D98E5A' : '#F2C9A0');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#E8B04B'; ctx.stroke();
  for (const dx of [120, 300]) {
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(wx + dx, wy + 110, 22, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(wx + dx - 26, wy + 140); ctx.lineTo(wx + dx + 26, wy + 140); ctx.lineTo(wx + dx + 70, wy + 330); ctx.lineTo(wx + dx - 70, wy + 330); ctx.fill();
  }
  xi(ctx, wx + ww / 2, wy + 60, 70, '#D9342B');
  ctx.restore();
  // 红绸花球
  for (const [x, y] of [[40, 270], [520, 380]]) { ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.fillStyle = '#D9342B'; ctx.fill(); ctx.strokeStyle = '#8E1E1E'; ctx.lineWidth = 3; ctx.stroke(); }
  // 花篮
  for (const x of [30, 520]) flowers(ctx, x, 860 - (x > 100 ? 60 : 0), 1);
  lantern(ctx, 600, 300, 1.3, night ? 1 : 0.5);
}

function shopLi(ctx, night, t, lit = 0) {
  // 右侧近景：青绿色小工作室（小李工作室）
  ctx.fillStyle = night ? '#1E4A48' : '#3E9C92';
  ctx.beginPath(); ctx.moveTo(1980, 60); ctx.lineTo(1400, 230); ctx.lineTo(1400, 800); ctx.lineTo(1980, 1020); ctx.fill();
  ctx.save(); ctx.transform(1, -0.27, 0, 1, 0, 0);
  sign(ctx, 1430, 650 - 300 + 120, 470, 110, night ? '#1A3E3C' : '#2F7F77', '#F4FBF8', '小李工作室', 64);
  ctx.restore();
  ctx.save(); ctx.transform(1, -0.25, 0, 1, 0, 0);
  const wx = 1450, wy = 690 - 300 + 260, ww = 400, wh = 330;
  rr(ctx, wx, wy - 120, ww, wh, 10);
  ctx.fillStyle = night ? `rgba(120,230,255,${0.45 + 0.4 * lit})` : '#DDEFEA'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#F4FBF8'; ctx.stroke();
  // 百叶窗
  ctx.strokeStyle = night ? 'rgba(20,60,70,0.4)' : 'rgba(60,110,100,0.35)'; ctx.lineWidth = 3;
  for (let y = wy - 110; y < wy - 120 + wh; y += 22) { ctx.beginPath(); ctx.moveTo(wx + 8, y); ctx.lineTo(wx + ww - 8, y); ctx.stroke(); }
  ctx.restore();
  // 绿植
  for (const x of [1430, 1880]) plant(ctx, x, 900);
}

function flowers(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#9E4A2E'; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.lineTo(30, 70); ctx.lineTo(-30, 70); ctx.fill();
  const r = rng(x | 0);
  for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc((r() - 0.5) * 90, -r() * 70, 12 + r() * 6, 0, 7); ctx.fillStyle = ['#E8485A', '#F59AAE', '#FFFFFF', '#D9342B'][i % 4]; ctx.fill(); }
  ctx.restore();
}
function plant(ctx, x, y) {
  ctx.fillStyle = '#E8E4DA'; ctx.fillRect(x - 30, y, 60, 70);
  for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(x, y); ctx.rotate(-1.2 + i * 0.4); ctx.beginPath(); ctx.ellipse(0, -50, 14, 48, 0, 0, 7); ctx.fillStyle = i % 2 ? '#4E8A4C' : '#3C7340'; ctx.fill(); ctx.restore(); }
}

// ── 小陈店内：前台、工位、婚纱照墙；白天暖 / 深夜冷；窗外可换季节 ──
export function shop(ctx, o = {}) {
  const night = o.light === 'night', cam = o.cam || {};
  withCam(ctx, cam, 0.85, () => {
    if (imageBG(ctx, 'K5')) return;
    ctx.fillStyle = night ? '#3A2E3E' : '#F2DCC2'; ctx.fillRect(-200, -200, W + 400, 800);
    // 护墙板
    ctx.fillStyle = night ? '#4A2A30' : '#B5414A'; ctx.fillRect(-200, 520, W + 400, 120);
    // 窗（季节）
    const season = o.season ?? -1;
    rr(ctx, 1260, 110, 520, 330, 12); ctx.fillStyle = night ? '#1E2A48' : ['#F8D8E0', '#BFE3F2', '#F2C98E', '#E8EEF4'][Math.max(0, season)] ?? '#BFE3F2'; ctx.fill();
    ctx.lineWidth = 14; ctx.strokeStyle = night ? '#2A2028' : '#FFFFFF'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1520, 110); ctx.lineTo(1520, 440); ctx.moveTo(1260, 275); ctx.lineTo(1780, 275); ctx.lineWidth = 8; ctx.stroke();
    if (season >= 0) seasonFx(ctx, season, o.t || 0);
    // 婚纱照墙（相框里是抽象色块）
    const cols = ['#F6D5C9', '#E9C7D8', '#D7E2EE', '#F3E2B8', '#E2D3F0', '#F8E0E6'];
    for (let i = 0; i < 6; i++) {
      const x = 160 + (i % 3) * 230, y = 90 + Math.floor(i / 3) * 200;
      ctx.fillStyle = '#E8B04B'; ctx.fillRect(x - 10, y - 10, 190, 160);
      ctx.fillStyle = night ? shade(cols[i], -0.5) : cols[i]; ctx.fillRect(x, y, 170, 140);
      ctx.fillStyle = night ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(x + 70, y + 60, 18, 0, 7); ctx.arc(x + 105, y + 62, 18, 0, 7); ctx.fill();
    }
    xi(ctx, 940, 220, 150, night ? '#7A3036' : '#D9342B');
    // 地面
    ctx.fillStyle = night ? '#2A2230' : '#D8B48E'; ctx.fillRect(-200, 640, W + 400, 700);
    ctx.strokeStyle = night ? 'rgba(0,0,0,0.2)' : 'rgba(120,80,50,0.18)'; ctx.lineWidth = 2;
    for (let x = -200; x < W + 400; x += 160) { ctx.beginPath(); ctx.moveTo(x, 640); ctx.lineTo(x - 300, 1300); ctx.stroke(); }
    if (o.desk !== false) {
      // 工位
      for (let i = 0; i < 3; i++) desk(ctx, 260 + i * 470, 760, night);
    }
  });
  if (night) { const g = ctx.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H * 0.5, 1200); g.addColorStop(0, 'rgba(60,90,160,0.05)'); g.addColorStop(1, 'rgba(10,15,40,0.45)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
}

function seasonFx(ctx, season, t) {
  ctx.save(); rr(ctx, 1260, 110, 520, 330, 12); ctx.clip();
  const r = rng(season + 3);
  if (season === 0) for (let i = 0; i < 26; i++) { ctx.fillStyle = '#F59AAE'; ctx.beginPath(); ctx.ellipse(1260 + r() * 520, 110 + ((r() * 330 + t * 60) % 330), 8, 5, r() * 3, 0, 7); ctx.fill(); }
  if (season === 1) { ctx.fillStyle = '#FFF2B0'; ctx.beginPath(); ctx.arc(1660, 180, 50, 0, 7); ctx.fill(); }
  if (season === 2) for (let i = 0; i < 20; i++) { ctx.fillStyle = '#D98A3A'; ctx.beginPath(); ctx.ellipse(1260 + r() * 520, 110 + ((r() * 330 + t * 50) % 330), 10, 6, r() * 3, 0, 7); ctx.fill(); }
  if (season === 3) for (let i = 0; i < 40; i++) { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(1260 + r() * 520, 110 + ((r() * 330 + t * 40) % 330), 4, 0, 7); ctx.fill(); }
  ctx.restore();
}

export function desk(ctx, x, y, night) {
  ctx.fillStyle = night ? '#4A3A34' : '#A8754E'; ctx.fillRect(x - 170, y, 340, 26);
  ctx.fillStyle = night ? '#3A2C28' : '#8A5E3E'; ctx.fillRect(x - 160, y + 26, 18, 140); ctx.fillRect(x + 142, y + 26, 18, 140);
  // 显示器
  ctx.fillStyle = '#2E3038'; rr(ctx, x - 80, y - 120, 160, 100, 8); ctx.fill();
  ctx.fillStyle = night ? '#7FD8F0' : '#CFE6F0'; rr(ctx, x - 72, y - 112, 144, 84, 4); ctx.fill();
  ctx.fillStyle = '#2E3038'; ctx.fillRect(x - 8, y - 20, 16, 20);
}

// ── 婚礼宴会厅：舞台拱门、花艺、灯串；mode = 'party' 热闹 / 'candle' 烛光 ──
export function banquet(ctx, o = {}) {
  const cam = o.cam || {}, candle = o.mode === 'candle', t = o.t || 0;
  withCam(ctx, cam, 0.9, () => {
    if (imageBG(ctx, 'K6')) return;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, candle ? '#3A2430' : '#F6D8D2'); g.addColorStop(1, candle ? '#1E141C' : '#E9B9AE');
    ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400);
    // 灯串
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = 'rgba(80,50,40,0.4)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = -100; x <= W + 100; x += 40) { const y = 80 + k * 50 + Math.sin(x / 300 + k) * 30; x === -100 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      for (let x = -100; x <= W + 100; x += 80) { const y = 80 + k * 50 + Math.sin(x / 300 + k) * 30; const tw = 0.6 + 0.4 * Math.sin(t * 3 + x); ctx.fillStyle = `rgba(255,220,150,${tw})`; ctx.beginPath(); ctx.arc(x, y + 6, 6, 0, 7); ctx.fill(); }
    }
    // 舞台和拱门
    ctx.fillStyle = candle ? '#4A2A34' : '#FFFFFF'; ctx.fillRect(460, 720, 1000, 60);
    ctx.lineWidth = 34; ctx.strokeStyle = candle ? '#E9C9A0' : '#FDF4EE'; ctx.beginPath(); ctx.arc(960, 720, 360, Math.PI, 0); ctx.stroke();
    const r = rng(5);
    for (let a = Math.PI; a <= Math.PI * 2.001; a += 0.09) { ctx.beginPath(); ctx.arc(960 + Math.cos(a) * 360, 720 + Math.sin(a) * 360, 16 + r() * 10, 0, 7); ctx.fillStyle = ['#E8485A', '#F59AAE', '#FFFFFF', '#F3C6CF'][(a * 10 | 0) % 4]; ctx.fill(); }
    if (candle) for (let i = 0; i < 9; i++) { const x = 520 + i * 110; ctx.fillStyle = '#FFF4DE'; ctx.fillRect(x - 6, 690, 12, 30); const gl = ctx.createRadialGradient(x, 682, 2, x, 682, 60); gl.addColorStop(0, 'rgba(255,200,110,0.9)'); gl.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, 682, 60, 0, 7); ctx.fill(); }
    // 宾客桌
    for (const x of [200, 1720]) { ctx.fillStyle = candle ? '#5A3A44' : '#FFFFFF'; ctx.beginPath(); ctx.ellipse(x, 900, 200, 60, 0, 0, 7); ctx.fill(); flowers(ctx, x, 860, 0.8); }
    ctx.fillStyle = candle ? '#2A1A22' : '#D9A79A'; ctx.fillRect(-200, 780, W + 400, 400);
  });
}

// ── 小李工作室：极简、两张桌、补光灯、百叶窗、双面门牌 ──
export function studio(ctx, o = {}) {
  const cam = o.cam || {}, t = o.t || 0;
  withCam(ctx, cam, 0.85, () => {
    if (imageBG(ctx, 'K7')) return;
    ctx.fillStyle = '#EEF5F2'; ctx.fillRect(-200, -200, W + 400, 840);
    ctx.fillStyle = '#3E9C92'; ctx.fillRect(-200, 560, W + 400, 80);
    // 百叶窗（晨光斜射）
    rr(ctx, 180, 100, 560, 380, 8); ctx.fillStyle = '#FFF6E0'; ctx.fill();
    ctx.strokeStyle = '#C9D9D4'; ctx.lineWidth = 6;
    for (let y = 112; y < 470; y += 26) { ctx.beginPath(); ctx.moveTo(190, y); ctx.lineTo(730, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,230,170,0.25)'; ctx.beginPath(); ctx.moveTo(180, 480); ctx.lineTo(740, 480); ctx.lineTo(1100, 1080); ctx.lineTo(500, 1080); ctx.fill();
    if (o.screen) {
      // 第五幕：墙上多一块屏
      rr(ctx, 1020, 120, 700, 380, 14); ctx.fillStyle = '#1F2A33'; ctx.fill();
    }
    ctx.fillStyle = '#E2D6C4'; ctx.fillRect(-200, 640, W + 400, 600);
    plant(ctx, 120, 560); plant(ctx, 1840, 560);
    // 补光灯
    ctx.strokeStyle = '#3A3A40'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(1620, 640); ctx.lineTo(1620, 380); ctx.stroke();
    ctx.lineWidth = 14; ctx.strokeStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(1620, 340, 60, 0, 7); ctx.stroke();
    if (o.desk !== false) desk(ctx, 960, 700, false);
  });
}

// ── 纸板模型：整条街变成桌上的纸房子 ──
export function diorama(ctx, o = {}) {
  const cam = o.cam || {};
  withCam(ctx, cam, 1, () => {
    if (imageBG(ctx, 'K8')) return;
    const g = ctx.createRadialGradient(960, 300, 100, 960, 500, 1300); g.addColorStop(0, '#E9C79C'); g.addColorStop(1, '#8A5E3E');
    ctx.fillStyle = g; ctx.fillRect(-2000, -2000, 6000, 6000);
    // 木纹
    ctx.strokeStyle = 'rgba(90,50,30,0.15)'; ctx.lineWidth = 3;
    for (let y = -400; y < 1600; y += 46) { ctx.beginPath(); ctx.moveTo(-1000, y); ctx.bezierCurveTo(400, y + 20, 1400, y - 20, 3000, y + 10); ctx.stroke(); }
    // 纸板街（俯视斜角）
    ctx.fillStyle = '#F1E4CC'; ctx.beginPath(); ctx.moveTo(560, 420); ctx.lineTo(1360, 420); ctx.lineTo(1500, 760); ctx.lineTo(420, 760); ctx.fill();
    for (let i = 0; i < 5; i++) {
      paperHouse(ctx, 470 + i * 70, 440 + i * 64, i === 4 ? '#C8343A' : '#E7D3B4', 0.7 + i * 0.08);
      paperHouse(ctx, 1450 - i * 70, 440 + i * 64, i === 4 ? '#3E9C92' : '#E7D3B4', 0.7 + i * 0.08);
    }
  });
}
function paperHouse(ctx, x, y, c, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(60,30,20,0.2)'; ctx.fillRect(-56, 6, 120, 18);
  ctx.fillStyle = c; ctx.fillRect(-60, -80, 120, 86); ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 3; ctx.strokeRect(-60, -80, 120, 86);
  ctx.fillStyle = shade(c, -0.2); ctx.beginPath(); ctx.moveTo(-70, -80); ctx.lineTo(0, -126); ctx.lineTo(70, -80); ctx.fill();
  ctx.fillStyle = '#FFF4DE'; ctx.fillRect(-30, -50, 60, 34);
  ctx.restore();
}

// ── 信息图底：纸张底纹 + 县城剪影 ──
export function paper(ctx, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.dark ? '#2A2630' : '#FBF3E4'); g.addColorStop(1, o.dark ? '#1E1B22' : '#F2E3CA');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = rng(11); ctx.fillStyle = o.dark ? 'rgba(255,255,255,0.025)' : 'rgba(120,80,40,0.05)';
  for (let i = 0; i < 500; i++) ctx.fillRect(r() * W, r() * H, 2 + r() * 3, 1.5);
  if (o.skyline !== false) {
    ctx.fillStyle = o.dark ? 'rgba(255,255,255,0.05)' : 'rgba(190,120,80,0.12)';
    ctx.beginPath(); ctx.moveTo(0, H);
    let x = 0; const rr2 = rng(4);
    while (x < W) { const w = 60 + rr2() * 90, h = 60 + rr2() * 120; ctx.lineTo(x, H - 30 - h); ctx.lineTo(x + w * 0.5, H - 50 - h); ctx.lineTo(x + w, H - 30 - h); x += w; }
    ctx.lineTo(W, H); ctx.fill();
  }
}

export { LIGHTS, lantern, sign, xi, flowers, plant };

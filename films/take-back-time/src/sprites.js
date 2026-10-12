// 創作空間裡的元素：開場先畫成貼圖，之後每格只做縮放與位移
import { makeCanvas, roundRect, rng } from './util.js';

export const SANS = '"TBT Sans", "Noto Sans TC", "PingFang TC", sans-serif';
export const SERIF = '"TBT Serif", "Noto Serif TC", "Songti TC", serif';
export const GLYPHS = ['想', '拍', '寫', '說', '唱'];

const WHITE = 'rgba(232,240,255,';
const CYAN = 'rgba(95,216,255,';

// 每個貼圖附一張模糊版，用來做景深
function finish(c, blurPx = 10) {
  const pad = blurPx * 3;
  const b = makeCanvas(Math.ceil((c.width + pad * 2) / 2), Math.ceil((c.height + pad * 2) / 2));
  const x = b.getContext('2d');
  x.filter = `blur(${blurPx / 2}px)`;
  x.drawImage(c, pad / 2, pad / 2, c.width / 2, c.height / 2);
  return { img: c, blur: b, pad, w: c.width, h: c.height };
}

function glass(x, w, h, r = 18) {
  const gr = x.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(150,190,255,0.13)');
  gr.addColorStop(1, 'rgba(110,150,220,0.05)');
  roundRect(x, 1, 1, w - 2, h - 2, r);
  x.fillStyle = gr;
  x.fill();
  x.strokeStyle = WHITE + '0.26)';
  x.lineWidth = 1.5;
  x.stroke();
  // 玻璃上緣的反光
  const hl = x.createLinearGradient(0, 0, w * 0.6, 0);
  hl.addColorStop(0, 'rgba(255,255,255,0)');
  hl.addColorStop(0.3, 'rgba(255,255,255,0.45)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  x.strokeStyle = hl;
  x.beginPath();
  x.moveTo(r, 1.5);
  x.lineTo(w * 0.6, 1.5);
  x.stroke();
}

function bar(x, X, Y, w, h, color) {
  roundRect(x, X, Y, w, h, h / 2);
  x.fillStyle = color;
  x.fill();
}

const DOC_TITLES = ['腳本', '講稿', '標題', '分鏡', '草稿', '素材', '排期', '封面', '字幕', '錄音', '混音', '靈感'];
function doc(R, title) {
  const w = 420;
  const h = 270;
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  glass(x, w, h);
  x.font = `500 30px ${SANS}`;
  x.fillStyle = WHITE + '0.92)';
  x.textBaseline = 'alphabetic';
  x.fillText(title, 30, 56);
  x.beginPath();
  x.arc(w - 36, 46, 6, 0, Math.PI * 2);
  x.fillStyle = CYAN + '0.9)';
  x.fill();
  const hi = Math.floor(R() * 5);
  for (let i = 0; i < 5; i++) {
    const bw = 140 + R() * 220;
    bar(x, 30, 90 + i * 32, bw, 9, i === hi ? CYAN + '0.55)' : WHITE + '0.22)');
  }
  return finish(c);
}

function wave(R) {
  const w = 620;
  const h = 130;
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, WHITE + '0.15)');
  gr.addColorStop(0.5, WHITE + '0.9)');
  gr.addColorStop(1, CYAN + '0.5)');
  x.fillStyle = gr;
  let a = 0.5;
  for (let i = 0; i < w; i += 6) {
    a += (R() - 0.5) * 0.35;
    a = Math.max(0.08, Math.min(1, a));
    const env = Math.sin((i / w) * Math.PI) ** 0.6;
    const amp = (h / 2 - 4) * a * env * (0.6 + R() * 0.4);
    x.fillRect(i, h / 2 - amp, 3, amp * 2);
  }
  x.fillStyle = CYAN + '0.6)';
  x.fillRect(0, h / 2 - 0.5, w, 1);
  return finish(c);
}

function timeline(R) {
  const w = 720;
  const h = 180;
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  glass(x, w, h, 14);
  // 刻度
  x.fillStyle = WHITE + '0.35)';
  for (let i = 0; i < 40; i++) x.fillRect(20 + i * 17, 14, 1, i % 5 === 0 ? 12 : 6);
  const cols = ['rgba(44,74,122,0.9)', 'rgba(53,97,143,0.9)', 'rgba(31,127,154,0.85)', 'rgba(95,216,255,0.55)'];
  for (let r = 0; r < 3; r++) {
    let X = 20 + R() * 30;
    while (X < w - 60) {
      const cw = 60 + R() * 170;
      const ww = Math.min(cw, w - 20 - X);
      roundRect(x, X, 42 + r * 42, ww, 32, 6);
      x.fillStyle = cols[Math.floor(R() * cols.length)];
      x.fill();
      x.strokeStyle = WHITE + '0.18)';
      x.lineWidth = 1;
      x.stroke();
      if (r === 2) {
        // 音軌裡的小波形
        x.fillStyle = WHITE + '0.35)';
        for (let k = X + 4; k < X + ww - 4; k += 4) {
          const a = 2 + R() * 11;
          x.fillRect(k, 58 + r * 42 - a, 2, a * 2);
        }
      } else {
        x.fillStyle = WHITE + '0.12)';
        for (let k = X + 30; k < X + ww; k += 30) x.fillRect(k, 44 + r * 42, 1, 28);
      }
      X += cw + 6 + R() * 12;
    }
  }
  const ph = 120 + R() * 460;
  x.fillStyle = CYAN + '0.95)';
  x.fillRect(ph, 10, 2, h - 20);
  x.beginPath();
  x.moveTo(ph - 7, 10);
  x.lineTo(ph + 9, 10);
  x.lineTo(ph + 1, 20);
  x.fill();
  return finish(c);
}

function glyph(ch) {
  const s = 380;
  const c = makeCanvas(s, s);
  const x = c.getContext('2d');
  x.font = `600 300px ${SERIF}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const gr = x.createLinearGradient(0, 40, 0, s - 40);
  gr.addColorStop(0, 'rgba(245,250,255,0.95)');
  gr.addColorStop(1, 'rgba(150,200,255,0.55)');
  x.fillStyle = gr;
  x.fillText(ch, s / 2, s / 2 + 10);
  return finish(c, 14);
}

function data(R) {
  const w = 460;
  const h = 260;
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  x.strokeStyle = WHITE + '0.08)';
  x.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    x.beginPath();
    x.moveTo(20, 40 + i * 48);
    x.lineTo(w - 20, 40 + i * 48);
    x.stroke();
  }
  const pts = [];
  let v = 0.5;
  for (let i = 0; i <= 18; i++) {
    v += (R() - 0.45) * 0.25;
    v = Math.max(0.1, Math.min(0.95, v));
    pts.push([20 + (i / 18) * (w - 40), 232 - v * 190]);
  }
  const area = x.createLinearGradient(0, 40, 0, 232);
  area.addColorStop(0, CYAN + '0.22)');
  area.addColorStop(1, CYAN + '0)');
  x.beginPath();
  x.moveTo(pts[0][0], 232);
  for (const p of pts) x.lineTo(p[0], p[1]);
  x.lineTo(pts[pts.length - 1][0], 232);
  x.fillStyle = area;
  x.fill();
  x.beginPath();
  pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])));
  x.strokeStyle = WHITE + '0.85)';
  x.lineWidth = 2.2;
  x.stroke();
  x.fillStyle = CYAN + '1)';
  for (let i = 0; i < pts.length; i += 3) {
    x.beginPath();
    x.arc(pts[i][0], pts[i][1], 3.5, 0, Math.PI * 2);
    x.fill();
  }
  x.font = `300 20px ${SANS}`;
  x.fillStyle = WHITE + '0.55)';
  x.fillText(R() < 0.5 ? '直播 20:00' : '00:12:04', 22, 26);
  return finish(c);
}

function thumb(R) {
  const w = 260;
  const h = 146;
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  roundRect(x, 0, 0, w, h, 10);
  x.save();
  x.clip();
  const gr = x.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#0d1a33');
  gr.addColorStop(0.55, '#1d3f66');
  gr.addColorStop(1, '#0a1428');
  x.fillStyle = gr;
  x.fillRect(0, 0, w, h);
  // 抽象畫面：一條地平線與光點
  x.fillStyle = 'rgba(200,230,255,0.5)';
  x.fillRect(0, h * (0.5 + R() * 0.15), w, 1.5);
  x.beginPath();
  x.arc(w * (0.3 + R() * 0.4), h * 0.4, 10 + R() * 14, 0, Math.PI * 2);
  x.fillStyle = 'rgba(160,220,255,0.35)';
  x.fill();
  x.restore();
  x.strokeStyle = WHITE + '0.3)';
  x.lineWidth = 1.5;
  roundRect(x, 1, 1, w - 2, h - 2, 10);
  x.stroke();
  x.beginPath();
  x.moveTo(w / 2 - 9, h / 2 - 12);
  x.lineTo(w / 2 + 13, h / 2);
  x.lineTo(w / 2 - 9, h / 2 + 12);
  x.closePath();
  x.fillStyle = WHITE + '0.85)';
  x.fill();
  x.font = `300 16px ${SANS}`;
  x.fillStyle = WHITE + '0.7)';
  x.fillText('00:' + String(10 + Math.floor(R() * 49)), w - 52, h - 12);
  return finish(c);
}

// 「待辦、修改、上線、下一個」標籤
export function pill(text, badge, big = true) {
  const fs = big ? 46 : 28;
  const ctx = makeCanvas(10, 10).getContext('2d');
  ctx.font = `500 ${fs}px ${SANS}`;
  const tw = ctx.measureText(text).width;
  const ph = big ? 88 : 54;
  const w = Math.ceil(tw + ph * 0.9 + (big ? 40 : 24));
  const h = ph + (big ? 24 : 14);
  const c = makeCanvas(w + 30, h + 10);
  const x = c.getContext('2d');
  x.translate(4, 14);
  roundRect(x, 0, 0, w, ph, ph / 2);
  x.fillStyle = 'rgba(14,22,40,0.86)';
  x.fill();
  x.strokeStyle = WHITE + (big ? '0.75)' : '0.4)');
  x.lineWidth = big ? 2 : 1.5;
  x.stroke();
  x.beginPath();
  x.arc(ph * 0.5, ph / 2, big ? 9 : 6, 0, Math.PI * 2);
  x.fillStyle = CYAN + '0.95)';
  x.fill();
  x.font = `500 ${fs}px ${SANS}`;
  x.textBaseline = 'middle';
  x.fillStyle = WHITE + '0.96)';
  x.fillText(text, ph * 0.5 + (big ? 26 : 16), ph / 2 + 2);
  if (badge) {
    x.font = `500 ${big ? 24 : 17}px ${SANS}`;
    const bw = Math.max(big ? 38 : 28, x.measureText(badge).width + 18);
    const bh = big ? 34 : 26;
    roundRect(x, w - bw * 0.6, -bh * 0.45, bw, bh, bh / 2);
    x.fillStyle = '#ff6b6b';
    x.fill();
    x.fillStyle = '#fff';
    x.textAlign = 'center';
    x.fillText(badge, w - bw * 0.6 + bw / 2, -bh * 0.45 + bh / 2 + 1);
  }
  return finish(c, 8);
}

const NOTE_WORDS = ['通知', '留言', '回覆', '截止', '會議', '再改', '最終版', '今晚', '明早', '開播', '彩排', '未讀', '待辦', '修改', '上線', '下一個'];
const BADGES = ['3', '12', '99+', '', '7', '', '24', '1'];

export function makeSprites() {
  const R = rng(2026);
  const S = {
    doc: DOC_TITLES.map((t) => doc(R, t)),
    wave: [0, 1, 2, 3].map(() => wave(R)),
    timeline: [0, 1, 2, 3].map(() => timeline(R)),
    glyph: GLYPHS.map((g) => glyph(g)),
    data: [0, 1, 2].map(() => data(R)),
    thumb: [0, 1, 2, 3, 4].map(() => thumb(R)),
    card: [],
    small: NOTE_WORDS.map((w, i) => pill(w, BADGES[i % BADGES.length], false)),
  };
  S.card = S.doc;
  // 柔光圓點（灰塵、散景）
  const d = makeCanvas(64, 64);
  const x = d.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  S.dot = d;
  return S;
}

// 依景深在清晰與模糊版之間混合
export function drawSprite(ctx, s, cx, cy, scale, alpha, blurMix, rot = 0) {
  if (alpha <= 0.003) return;
  const w = s.w * scale;
  const h = s.h * scale;
  ctx.save();
  ctx.translate(cx, cy);
  if (rot) ctx.rotate(rot);
  if (blurMix < 0.98) {
    ctx.globalAlpha = alpha * (1 - blurMix);
    ctx.drawImage(s.img, -w / 2, -h / 2, w, h);
  }
  if (blurMix > 0.02) {
    const p = s.pad * scale;
    ctx.globalAlpha = alpha * Math.min(1, blurMix * 1.15);
    ctx.drawImage(s.blur, -w / 2 - p, -h / 2 - p, w + p * 2, h + p * 2);
  }
  ctx.restore();
}

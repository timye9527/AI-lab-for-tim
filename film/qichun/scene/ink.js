// 二维画面：水墨山水、干栏木屋、竹林、本草线描、书页、四宝、人物卡。
// 全部程序绘制，随机数固定种子，同一时刻画出来的画面每次一样（逐帧渲染要求）。
import { VERTICAL, W as OW, H as OH } from './format.js';
// 下面的山水画面按横版 1920×1080 的虚拟坐标画，竖版时整体缩放、居中裁切
const W = 1920, H = 1080;
const INK = (a) => `rgba(24,20,16,${a})`;
const RED = '#b5332a';
const SERIF = '"Noto Serif SC", serif';
const SERIF_TC = '"Noto Serif TC", "Noto Serif SC", serif';
const BRUSH = '"Ma Shan Zheng", "Noto Serif SC", serif';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const ease = (u) => 1 - Math.pow(1 - clamp(u), 3);

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// 一维分形噪声
function noise1(seed) {
  const r = rng(seed), v = Array.from({ length: 512 }, r);
  const n = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return v[i & 511] * (1 - u) + v[(i + 1) & 511] * u; };
  return (x, oct = 5) => { let s = 0, a = 0.5, f = 1; for (let o = 0; o < oct; o++) { s += a * n(x * f); a *= 0.5; f *= 2.03; } return s; };
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- 宣纸 ----------
function makePaper(seed = 1, tone = [233, 223, 200]) {
  const c = canvas(W, H), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = `rgb(${tone})`; g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8; }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.05; g.strokeStyle = '#6b5a40';
  for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI; g.lineWidth = 0.5 + r(); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 20, y + Math.sin(a) * 20 + 6, x + Math.cos(a) * 40, y + Math.sin(a) * 40); g.stroke(); }
  g.globalAlpha = 1;
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, 'rgba(120,95,60,0)'); v.addColorStop(1, 'rgba(120,95,60,.28)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

// ---------- 山 ----------
function makeRange(seed, { base, amp, freq, dark, depth, blur, width = 2600 }) {
  const c = canvas(width, H), g = c.getContext('2d'), n = noise1(seed), r = rng(seed + 9);
  const ridge = (x) => base - amp * (Math.pow(n(x * freq), 1.6) * 1.8 - 0.2);
  g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= width; x += 4) g.lineTo(x, ridge(x));
  g.lineTo(width, H); g.closePath();
  // 山脊处墨重，往下化成雾
  let top = base - amp * 1.6;
  const grd = g.createLinearGradient(0, top, 0, base + depth);
  grd.addColorStop(0, INK(dark)); grd.addColorStop(0.45, INK(dark * 0.7)); grd.addColorStop(1, INK(0));
  g.filter = `blur(${blur}px)`; g.fillStyle = grd; g.fill(); g.filter = 'none';
  // 皴笔：沿山坡的短竖笔触
  g.save(); g.clip();
  for (let i = 0; i < width / 5; i++) {
    const x = r() * width, y0 = ridge(x) + r() * depth * 0.6, len = 10 + r() * 50;
    g.strokeStyle = INK(dark * (0.25 + r() * 0.35)); g.lineWidth = 0.6 + r() * 1.6;
    g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + (r() - 0.5) * 10, y0 + len * 0.5, x + (r() - 0.5) * 16, y0 + len); g.stroke();
  }
  g.restore();
  return c;
}

function mist(g, t, y, alpha, seed) {
  const r = rng(seed);
  for (let i = 0; i < 6; i++) {
    const x = ((r() * 2400 + t * (12 + r() * 10)) % 2600) - 340, w = 500 + r() * 600, h = 60 + r() * 70;
    const grd = g.createRadialGradient(x, y + r() * 60, 0, x, y, w / 2);
    grd.addColorStop(0, `rgba(240,233,216,${alpha})`); grd.addColorStop(1, 'rgba(240,233,216,0)');
    g.save(); g.scale(1, h / w); g.fillStyle = grd; g.beginPath(); g.arc(x, (y + r() * 60) * w / h, w / 2, 0, 7); g.fill(); g.restore();
  }
}

function seal(g, x, y, text, size = 64) {
  g.save(); g.translate(x, y);
  g.fillStyle = RED; g.globalAlpha = 0.88;
  g.beginPath(); g.roundRect(0, 0, size * 1.0, size * (text.length > 1 ? 1.6 : 1.0), 6); g.fill();
  g.fillStyle = '#f3e6cf'; g.globalAlpha = 1;
  g.font = `${size * 0.62}px ${BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  [...text].forEach((ch, i) => g.fillText(ch, size / 2, size * (text.length > 1 ? 0.45 + i * 0.7 : 0.52)));
  g.restore();
}

function vtext(g, text, x, y, size, color, font = BRUSH, gap = 1.12) {
  g.fillStyle = color; g.font = `${size}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'top';
  [...text].forEach((ch, i) => g.fillText(ch, x, y + i * size * gap));
}

// ---------- 线描植物（本草） ----------
function plantStrokes(seed, kind, x0, y0, scale) {
  const r = rng(seed), lines = [];
  const stemH = 520 * scale;
  const stem = []; const sway = (r() - 0.5) * 40 * scale;
  for (let i = 0; i <= 30; i++) { const u = i / 30; stem.push([x0 + sway * u * u, y0 - stemH * u]); }
  lines.push({ pts: stem, w: 2.2, at: 0 });
  const nLeaves = kind === 'ai' ? 9 : 7;
  for (let k = 0; k < nLeaves; k++) {
    const u = 0.12 + 0.8 * (k / nLeaves), [sx, sy] = stem[Math.round(u * 30)];
    const side = k % 2 ? 1 : -1, len = (kind === 'ai' ? 150 : 120) * scale * (1.1 - u * 0.6);
    const ang = -0.5 * side + (side > 0 ? 0.2 : Math.PI - 0.2);
    // 艾叶：羽状深裂，左右各两三个裂片
    const out = [], back = [];
    const lobes = kind === 'ai' ? 3 : 1;
    for (let i = 0; i <= 24; i++) {
      const v = i / 24, wv = Math.sin(Math.PI * v) * (0.28 + (kind === 'ai' ? 0.22 * Math.abs(Math.sin(v * Math.PI * lobes * 2)) : 0.05));
      const px = sx + Math.cos(ang) * len * v, py = sy + Math.sin(ang) * len * v - Math.sin(Math.PI * v) * 10 * scale;
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      out.push([px + nx * wv * len * 0.5, py + ny * wv * len * 0.5]);
      back.unshift([px - nx * wv * len * 0.5, py - ny * wv * len * 0.5]);
    }
    lines.push({ pts: [...out, ...back], w: 1.4, at: u * 0.7 + 0.1, fill: true });
    lines.push({ pts: [[sx, sy], [sx + Math.cos(ang) * len * 0.95, sy + Math.sin(ang) * len * 0.95 - 6 * scale]], w: 0.9, at: u * 0.7 + 0.12 });
  }
  if (kind === 'flower') {
    const [tx, ty] = stem[30];
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; lines.push({ pts: [[tx, ty], [tx + Math.cos(a) * 46 * scale, ty + Math.sin(a) * 30 * scale]], w: 1.6, at: 0.85 }); }
  }
  // 根须
  for (let k = 0; k < 6; k++) { const a = Math.PI / 2 + (r() - 0.5) * 1.6; const pts = []; for (let i = 0; i <= 8; i++) pts.push([x0 + Math.cos(a) * i * 9 * scale + (r() - 0.5) * 4, y0 + Math.sin(a) * i * 9 * scale]); lines.push({ pts, w: 1, at: 0.02 }); }
  return lines;
}

function drawPlant(g, lines, prog, alpha = 1) {
  for (const l of lines) {
    const u = clamp((prog - l.at) / 0.25);
    if (u <= 0) continue;
    const n = Math.max(2, Math.ceil(l.pts.length * u));
    g.beginPath(); g.moveTo(...l.pts[0]);
    for (let i = 1; i < n; i++) g.lineTo(...l.pts[i]);
    if (l.fill && u >= 1) { g.closePath(); g.fillStyle = `rgba(92,110,80,${0.16 * alpha})`; g.fill(); }
    g.strokeStyle = INK(0.82 * alpha); g.lineWidth = l.w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  }
}

// ---------- 各画面 ----------
export function createInk(cv) {
  const g = cv.getContext('2d');
  const paper = makePaper(3), paperDark = makePaper(5, [226, 214, 188]);
  const ranges = [
    makeRange(11, { base: 560, amp: 230, freq: 0.0021, dark: 0.22, depth: 260, blur: 3 }),
    makeRange(12, { base: 690, amp: 220, freq: 0.0028, dark: 0.42, depth: 240, blur: 1.6 }),
    makeRange(13, { base: 860, amp: 200, freq: 0.0036, dark: 0.7, depth: 220, blur: 0.6 }),
  ];
  const bamboo = (() => { const r = rng(77); return Array.from({ length: 26 }, (_, i) => ({ x: r() * 2100 - 90, w: 10 + r() * 22, depth: r(), ph: r() * 6, lean: (r() - 0.5) * 0.08, leaves: Array.from({ length: 14 }, () => [r(), r(), r(), r()]) })).sort((a, b) => a.depth - b.depth); })();
  const herbs = VERTICAL
    ? [plantStrokes(21, 'ai', 250, 1470, 1.05), plantStrokes(22, 'flower', 560, 1490, 0.95), plantStrokes(23, 'herb', 850, 1480, 1.0)]
    : [plantStrokes(21, 'ai', 600, 900, 1.05), plantStrokes(22, 'flower', 1000, 920, 0.9), plantStrokes(23, 'herb', 1360, 910, 0.95)];
  const bookPlant = plantStrokes(21, 'ai', 600, 900, 1.05);

  function landscape(t, opts = {}) {
    g.drawImage(paper, 0, 0);
    if (opts.sun) { g.fillStyle = 'rgba(181,51,42,.55)'; g.beginPath(); g.arc(1560, 560, 46, 0, 7); g.fill(); }
    ranges.forEach((c, i) => { g.drawImage(c, -200 - t * (4 + i * 6), (opts.lift || 0) * (i + 1)); if (i < 2) mist(g, t, 600 + i * 140, 0.75, 40 + i); });
  }

  function birds(t) {
    const r = rng(5);
    for (let i = 0; i < 5; i++) {
      const x = 300 + r() * 500 + t * (30 + r() * 10), y = 330 + r() * 120 + Math.sin(t * 2 + i) * 6, s = 8 + r() * 6, f = Math.sin(t * 7 + i * 2) * 0.5;
      g.strokeStyle = INK(0.7); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - s, y - s * f); g.quadraticCurveTo(x - s / 2, y - s * 0.3, x, y); g.quadraticCurveTo(x + s / 2, y - s * 0.3, x + s, y - s * f); g.stroke();
    }
  }

  function boat(x, y, a = 0.85) {
    g.strokeStyle = INK(a); g.fillStyle = INK(a); g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - 60, y); g.quadraticCurveTo(x, y + 16, x + 64, y - 4); g.lineTo(x + 50, y + 4); g.quadraticCurveTo(x, y + 12, x - 50, y + 4); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x + 10, y - 2); g.lineTo(x + 14, y - 30); g.stroke();      // 人
    g.beginPath(); g.arc(x + 14, y - 34, 5, 0, 7); g.fill();
    g.beginPath(); g.moveTo(x + 14, y - 26); g.lineTo(x + 70, y + 26); g.lineWidth = 1.4; g.stroke(); // 篙
  }

  function water(t, y0) {
    const grd = g.createLinearGradient(0, y0, 0, H);
    grd.addColorStop(0, 'rgba(210,200,178,.0)'); grd.addColorStop(1, 'rgba(150,140,120,.25)');
    g.fillStyle = grd; g.fillRect(0, y0, W, H - y0);
    const r = rng(9);
    for (let i = 0; i < 70; i++) {
      const y = y0 + 20 + r() * (H - y0), x = ((r() * 2400 + t * (8 + r() * 14)) % 2400) - 240, w = 30 + r() * 140;
      g.strokeStyle = INK(0.12 + r() * 0.14); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y + 2, x + w, y); g.stroke();
    }
  }

  // 干栏式木构：立柱、平台、板壁、坡顶
  function stiltHouse(x, y, s, a, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = INK(a); g.fillStyle = INK(a * 0.85); g.lineWidth = 2.4;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-90 + i * 36, 0); g.lineTo(-92 + i * 36, 120); g.stroke(); }
    g.fillRect(-110, -8, 220, 10);
    g.lineWidth = 1.6; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(-84 + i * 15, -8); g.lineTo(-84 + i * 15, -88); g.stroke(); }
    g.beginPath(); g.moveTo(-150, -80); g.lineTo(-96, -150); g.lineTo(96, -150); g.lineTo(150, -80); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(233,223,200,.3)'; g.lineWidth = 1;
    for (let i = 0; i < 22; i++) { const x = -140 + i * 13.3; g.beginPath(); g.moveTo(x, -82); g.lineTo(x * 0.66, -148); g.stroke(); }
    g.strokeStyle = INK(a); g.lineWidth = 3; g.beginPath(); g.moveTo(-104, -152); g.lineTo(104, -152); g.stroke();
    // 倒影
    g.globalAlpha = 0.22; g.scale(1, -0.6); g.translate(0, -230);
    g.fillStyle = INK(a * 0.6); g.fillRect(-110, -8, 220, 10);
    g.beginPath(); g.moveTo(-150, -80 + Math.sin(t) * 3); g.lineTo(-96, -150); g.lineTo(96, -150); g.lineTo(150, -80); g.closePath(); g.fill();
    g.restore();
  }

  function bambooGrove(t) {
    g.drawImage(paper, 0, 0);
    for (const b of bamboo) {
      const a = 0.08 + b.depth * 0.78, sway = Math.sin(t * 0.7 + b.ph) * 0.012 + b.lean;
      const x0 = b.x - t * (4 + b.depth * 14), w = b.w * (0.5 + b.depth * 0.8);
      g.save(); g.translate(x0, H + 20); g.rotate(sway);
      let y = 0;
      for (let k = 0; k < 9; k++) {
        const segH = 120 + (k % 3) * 18;
        g.fillStyle = INK(a); g.fillRect(-w / 2, y - segH + 6, w, segH - 8);
        g.fillStyle = INK(a * 1.25); g.fillRect(-w / 2 - 2, y - 6, w + 4, 4);
        // 叶：在节上抽出的细枝末端成簇
        if (k > 3) for (const [p, q, rr, s2] of b.leaves.slice(0, 3)) {
          const side = p > 0.5 ? 1 : -1, bx = side * (w / 2 + 40 + q * 60), by = y - 30 - rr * 40;
          g.strokeStyle = INK(a * 0.9); g.lineWidth = 1.4; g.beginPath(); g.moveTo(side * w / 2, y - 4); g.lineTo(bx, by); g.stroke();
          for (let j = 0; j < 4; j++) {
            const ang = side * (0.5 + j * 0.35 + s2 * 0.3) + Math.sin(t * 1.3 + j + b.ph) * 0.06, L = 70 + j * 12;
            g.save(); g.translate(bx, by); g.rotate(ang + Math.PI / 2 * (side > 0 ? 0 : 0));
            g.fillStyle = INK(a * 0.95); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.4, -8, L, 2); g.quadraticCurveTo(L * 0.4, 6, 0, 0); g.fill(); g.restore();
          }
        }
        y -= segH;
      }
      g.restore();
    }
    mist(g, t, 820, 0.55, 60);
  }

  // 竖版与横版各自的版式（单位：输出像素）
  const LAY = VERTICAL ? {
    herbLabels: [[150, 900], [460, 920], [750, 900]],
    page: [60, 210, 960, 1290], cols: { x0: 920, top: 270, w: 92 }, plant: { dx: -340, dy: 540, s: 0.95 }, plantLabel: [130, 980], stamp: [700, 1300],
    tre: [[300, 560], [780, 560], [300, 1110], [780, 1110]], treChar: 210, treName: 175,
    ppl: [[540, 520], [540, 1110]], pplR: 175, pplName: 145, pplText: 232,
    seal: [930, 220], poem: [900, 300, 84], poemBy: [790, 760], note: [70, 1490],
  } : {
    herbLabels: [[470, 300], [900, 300], [1250, 300]],
    page: [140, 90, W - 280, H - 180], cols: { x0: W - 300, top: 200, w: 86 }, plant: { dx: -140, dy: 20, s: 0.95 }, plantLabel: [300, 200], stamp: [760, 660],
    tre: [[330, 470], [750, 470], [1170, 470], [1590, 470]], treChar: 250, treName: 250,
    ppl: [[640, 470], [1280, 470]], pplR: 210, pplName: 200, pplText: 290,
    seal: [1720, 180], poem: [1560, 240, 92], poemBy: [1440, 640], note: [140, H - 170],
  };

  function herbsPage(t, dur) {
    g.drawImage(paperDark, 0, 0, OW, OH);
    herbs.forEach((h, i) => drawPlant(g, h, ease((t - 0.4 - i * 1.4) / (dur * 0.55))));
    ['艾', '菊', '薄荷'].forEach((s, i) => vtext(g, s, LAY.herbLabels[i][0], LAY.herbLabels[i][1], 34, INK(0.7 * smooth(1.5 + i * 1.4, 2.5 + i * 1.4, t)), SERIF_TC));
  }

  function bookPage(t, dur, stampT) {
    g.fillStyle = '#20180f'; g.fillRect(0, 0, OW, OH);
    const k = 1 + 0.06 * ease(t / dur);
    const [px, py, pw, ph] = LAY.page;
    g.save(); g.translate(OW / 2, OH / 2); g.scale(k, k); g.rotate(-0.012); g.translate(-OW / 2, -OH / 2);
    g.drawImage(paper, px, py, pw, ph);
    g.strokeStyle = INK(0.85); g.lineWidth = 5; g.strokeRect(px + 80, py + 60, pw - 160, ph - 120);
    g.lineWidth = 1.5; g.strokeRect(px + 92, py + 72, pw - 184, ph - 144);
    // 界栏和竖排正文（右起）
    const cols = ['艾', '【集解】時珍曰', '……自成化以來', '則以蘄州者為勝', '用充方物', '天下重之', '謂之蘄艾', '……'];
    const { x0, top, w: colW } = LAY.cols;
    cols.forEach((c, i) => {
      const x = x0 - i * colW;
      g.strokeStyle = INK(0.35); g.lineWidth = 1; g.beginPath(); g.moveTo(x - colW / 2, py + 72); g.lineTo(x - colW / 2, py + ph - 72); g.stroke();
      const a = smooth(0.3 + i * 0.35, 0.8 + i * 0.35, t);
      vtext(g, c, x, top, i === 0 ? 64 : 48, INK(0.9 * a), SERIF_TC, 1.18);
      // 重点句旁加红色圈点
      if (i >= 2 && i <= 6) {
        const n = [...c].length, b = smooth(2.2 + i * 0.5, 3.2 + i * 0.5, t);
        g.fillStyle = `rgba(181,51,42,${0.85 * b})`;
        for (let j = 0; j < n; j++) { g.beginPath(); g.arc(x + 34, top + 26 + j * 48 * 1.18, 4, 0, 7); g.fill(); }
      }
    });
    const P = LAY.plant;
    drawPlant(g, bookPlant.map((l) => ({ ...l, pts: l.pts.map(([x, y]) => [x * P.s + P.dx, y * P.s + P.dy]) })), ease((t - 0.5) / 3.5));
    vtext(g, '蘄艾', LAY.plantLabel[0], LAY.plantLabel[1], 40, INK(0.75 * smooth(1, 2, t)), SERIF_TC);
    g.restore();
    // 盖章：入选世界记忆名录
    if (stampT != null && t > stampT) {
      const u = smooth(stampT, stampT + 0.25, t), sc = 1.4 - 0.4 * u;
      g.save(); g.translate(...LAY.stamp); g.rotate(-0.08); g.scale(sc, sc); g.globalAlpha = u * 0.9;
      g.strokeStyle = RED; g.lineWidth = 7; g.strokeRect(-130, -130, 260, 260); g.lineWidth = 2; g.strokeRect(-116, -116, 232, 232);
      g.fillStyle = RED; g.font = `52px ${BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('世界记忆', 0, -40); g.fillText('名 录', 0, 22); g.font = `34px ${SERIF}`; g.fillText('2011', 0, 82);
      g.restore();
    }
  }

  function treasures(t) {
    g.drawImage(paper, 0, 0, OW, OH);
    const items = [['艾', '蕲艾', 'Qi mugwort'], ['竹', '蕲竹', 'Qi bamboo'], ['蛇', '蕲蛇', 'Qi snake'], ['龟', '蕲龟', 'Qi turtle']];
    items.forEach(([ch, name, en], i) => {
      const [x, y] = LAY.tre[i], a = smooth(1.2 + i * 0.75, 1.9 + i * 0.75, t), S = LAY.treChar;
      const blob = g.createRadialGradient(x, y, 10, x, y, S * 0.85);
      blob.addColorStop(0, INK(0.12 * a)); blob.addColorStop(1, INK(0));
      g.fillStyle = blob; g.beginPath(); g.arc(x, y, S * 0.9, 0, 7); g.fill();
      g.save(); g.translate(x, y); g.scale(0.92 + 0.08 * a, 0.92 + 0.08 * a);
      g.fillStyle = INK(0.9 * a); g.font = `${S}px ${BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 0, -10);
      g.restore();
      g.fillStyle = INK(0.8 * a); g.font = `40px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(name, x, y + LAY.treName);
      g.fillStyle = INK(0.5 * a); g.font = `22px ${SERIF}`; g.fillText(en, x, y + LAY.treName + 45);
    });
    seal(g, LAY.seal[0] - 20, LAY.seal[1], '四宝', 70);
  }

  function portraits(t, people) {
    g.drawImage(paperDark, 0, 0, OW, OH);
    people.forEach((p, i) => {
      const [x, y] = LAY.ppl[i], a = smooth(0.8 + i * 1.6, 1.8 + i * 1.6, t), R = LAY.pplR;
      // 一笔圆相
      g.strokeStyle = INK(0.55 * a); g.lineWidth = 24; g.lineCap = 'round';
      g.beginPath(); g.arc(x, y, R, -2.4, -2.4 + Math.PI * 1.85 * ease((t - 0.6 - i * 1.6) / 1.4)); g.stroke();
      g.fillStyle = INK(0.92 * a); g.font = `${LAY.pplName}px ${BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.name, x, y - 10);
      const ty = y + LAY.pplText;
      g.font = `36px ${SERIF}`; g.fillStyle = INK(0.8 * a); g.textBaseline = 'alphabetic'; g.fillText(p.years, x, ty);
      g.font = `30px ${SERIF}`; g.fillStyle = INK(0.65 * a); g.fillText(p.role, x, ty + 52);
      g.font = `22px ${SERIF}`; g.fillStyle = INK(0.45 * a); g.fillText(p.en, x, ty + 92);
    });
  }

  // 「流行」段：跟着鼓点跳动的字，暗底金字
  function pop(t, seg) {
    const beat = 60 / seg.bpm, bt = (t - seg.beat0) / beat;
    const ph = bt - Math.floor(bt), kick = bt > 0 ? Math.exp(-ph * 6) : 0;
    g.fillStyle = '#0d0907'; g.fillRect(0, 0, OW, OH);
    const cx = OW / 2, cy = VERTICAL ? 720 : 450;
    const glow = g.createRadialGradient(cx, cy, 20, cx, cy, OH * 0.6);
    glow.addColorStop(0, `rgba(190,60,40,${0.32 + 0.25 * kick})`); glow.addColorStop(0.5, 'rgba(120,40,25,.12)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow; g.fillRect(0, 0, OW, OH);
    // 节奏光条
    const nb = VERTICAL ? 24 : 48, bw = OW / nb, base = VERTICAL ? 1500 : 944, bh = VERTICAL ? 120 : 80;
    for (let i = 0; i < nb; i++) {
      const v = 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + Math.floor(bt * 2) * 2.3)) * (0.4 + 0.6 * kick) * smooth(0, 1.5, t - seg.start);
      g.fillStyle = `rgba(255,${190 + (i % 3) * 15},120,${0.18 + 0.3 * v})`;
      g.fillRect(i * bw + 3, base - v * bh, bw - 6, v * bh);
    }
    // 书名
    const a = smooth(seg.start + 0.3, seg.start + 1.2, t), sc = 1 + 0.035 * kick;
    g.save(); g.translate(cx, cy); g.scale(sc, sc);
    g.fillStyle = `rgba(255,224,170,${a})`; g.shadowColor = 'rgba(255,170,80,.6)'; g.shadowBlur = 30;
    g.font = `${VERTICAL ? 190 : 210}px ${BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (VERTICAL) { g.fillText('本草', 0, -110); g.fillText('纲目', 0, 110); } else g.fillText('本草纲目', 0, 0);
    g.restore(); g.shadowBlur = 0;
    // 药名在节拍上一个个弹出来（都是《本草纲目》里收录的药）
    const herbsN = ['艾叶', '菊花', '薄荷', '人参', '当归', '枸杞', '甘草', '黄芪'];
    herbsN.forEach((h, i) => {
      const on = seg.beat0 + (2 + i) * beat, u = smooth(on, on + 0.18, t);
      if (u <= 0) return;
      const ang = (i / herbsN.length) * Math.PI * 2 - Math.PI / 2, R = VERTICAL ? [380, 430] : [620, 250];
      const x = cx + Math.cos(ang) * R[0], y = cy + Math.sin(ang) * R[1] + (VERTICAL ? 0 : 10);
      g.save(); g.translate(x, y); g.scale(0.6 + 0.4 * u + 0.08 * kick, 0.6 + 0.4 * u + 0.08 * kick);
      g.fillStyle = `rgba(255,236,200,${0.85 * u})`; g.font = `44px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(h, 0, 0);
      g.restore();
    });
    // 年份线：1596 金陵本 → 2006 歌曲 → 2022 健身操
    const yrs = [['1596', '金陵本刊行'], ['2006', '同名流行歌'], ['2022', '全网健身操']];
    yrs.forEach(([y, d], i) => {
      const on = seg.items[0] ? seg.items[0].start + i * 1.6 : seg.start, u = smooth(on, on + 0.4, t);
      const x = VERTICAL ? 200 + i * 340 : cx - 560 + i * 560, yy = VERTICAL ? 1300 : 790;
      g.fillStyle = `rgba(255,216,154,${u})`; g.font = `600 40px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(y, x, yy);
      g.fillStyle = `rgba(244,231,207,${0.7 * u})`; g.font = `24px ${SERIF}`; g.fillText(d, x, yy + 38);
    });
  }

  // 主入口：按分段的 variant 画
  return function draw(seg, t, alpha) {
    const dpr = window.devicePixelRatio;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalAlpha = 1;
    const lt = t - seg.start;
    const kind = seg.mode === 'ink' ? seg.variant : seg.mode;
    const scenic = kind === 'title' || kind === 'stilts' || kind === 'bamboo';
    if (scenic && VERTICAL) {
      // 竖版：先铺满宣纸，再把横版山水缩放后贴进画面区
      g.drawImage(paper, 0, 0, OW, OH);
      const s = 1.24; g.setTransform(dpr * s, 0, 0, dpr * s, dpr * (OW - W * s) / 2, dpr * 180);
    }
    switch (kind) {
      case 'title': landscape(lt, { sun: true }); birds(lt); boat(700 + lt * 14, 905); break;
      case 'stilts': {
        landscape(lt * 0.6, { lift: 30 }); water(lt, 800);
        [[520, 770, 0.9], [860, 760, 1.1], [1230, 775, 0.95], [1520, 790, 0.7], [300, 795, 0.6]].forEach(([x, y, s], i) => stiltHouse(x - lt * 6, y, s, smooth(0.3 + i * 0.4, 1.4 + i * 0.4, lt) * 0.82, lt));
        mist(g, lt, 880, 0.5, 71);
        break;
      }
      case 'bamboo': bambooGrove(lt); break;
      case 'herbs': herbsPage(lt, seg.dur); break;
      case 'book': bookPage(lt, seg.dur, seg.stampT); break;
      case 'treasures': treasures(lt); break;
      case 'portrait': portraits(lt, seg.people); break;
      case 'pop': pop(t, seg); break;
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 段内的章名印章和题诗
    if (seg.seal) seal(g, LAY.seal[0] - 20, LAY.seal[1], seg.seal, 72);
    if (seg.poem) {
      const a = smooth(2, 3, lt), [px, py, ps] = LAY.poem;
      const pad = g.createRadialGradient(px - 60, py + 240, 20, px - 60, py + 240, 340);
      pad.addColorStop(0, `rgba(236,226,204,${0.92 * a})`); pad.addColorStop(1, 'rgba(236,226,204,0)');
      g.fillStyle = pad; g.fillRect(px - 460, py - 100, 800, 700);
      vtext(g, seg.poem, px, py, ps, INK(0.9 * a));
      vtext(g, `— ${seg.poemBy}`, LAY.poemBy[0], LAY.poemBy[1], 30, INK(0.6 * a), SERIF);
    }
    if (seg.note) { g.font = `20px ${SERIF}`; g.fillStyle = INK(0.45); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(seg.note, LAY.note[0], LAY.note[1]); }
  };
}

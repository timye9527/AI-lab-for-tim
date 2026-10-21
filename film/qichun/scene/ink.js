// 二维画面：水墨山水、干栏木屋、竹林、本草线描、书页、四宝、人物卡。
// 全部程序绘制，随机数固定种子，同一时刻画出来的画面每次一样（逐帧渲染要求）。
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
  const herbs = [plantStrokes(21, 'ai', 600, 900, 1.05), plantStrokes(22, 'flower', 1000, 920, 0.9), plantStrokes(23, 'herb', 1360, 910, 0.95)];

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

  function herbsPage(t, dur) {
    g.drawImage(paperDark, 0, 0);
    herbs.forEach((h, i) => drawPlant(g, h, ease((t - 0.4 - i * 1.4) / (dur * 0.55))));
    g.font = `34px ${SERIF_TC}`; g.fillStyle = INK(0.7 * smooth(2, 3, t)); g.textAlign = 'center';
    ['艾', '菊', '薄荷'].forEach((s, i) => vtext(g, s, [470, 900, 1250][i] , 300, 34, INK(0.7 * smooth(1.5 + i * 1.4, 2.5 + i * 1.4, t)), SERIF_TC));
  }

  function bookPage(t, dur, stampT) {
    g.fillStyle = '#20180f'; g.fillRect(0, 0, W, H);
    const k = 1 + 0.06 * ease(t / dur);
    g.save(); g.translate(W / 2, H / 2); g.scale(k, k); g.rotate(-0.012); g.translate(-W / 2, -H / 2);
    g.drawImage(paper, 140, 90, W - 280, H - 180);
    g.strokeStyle = INK(0.85); g.lineWidth = 5; g.strokeRect(220, 150, W - 440, H - 300);
    g.lineWidth = 1.5; g.strokeRect(232, 162, W - 464, H - 324);
    // 界栏和竖排正文（右起）
    const cols = ['艾', '【集解】時珍曰', '……自成化以來', '則以蘄州者為勝', '用充方物', '天下重之', '謂之蘄艾', '……'];
    const colW = 86, x0 = W - 300;
    cols.forEach((c, i) => {
      const x = x0 - i * colW;
      g.strokeStyle = INK(0.35); g.lineWidth = 1; g.beginPath(); g.moveTo(x - colW / 2, 162); g.lineTo(x - colW / 2, H - 162); g.stroke();
      const a = smooth(0.3 + i * 0.35, 0.8 + i * 0.35, t);
      vtext(g, c, x, 200, i === 0 ? 64 : 48, INK(0.9 * a), SERIF_TC, 1.18);
      // 重点句旁加红色圈点
      if (i >= 2 && i <= 6) {
        const n = [...c].length, b = smooth(2.2 + i * 0.5, 3.2 + i * 0.5, t);
        g.fillStyle = `rgba(181,51,42,${0.85 * b})`;
        for (let j = 0; j < n; j++) { g.beginPath(); g.arc(x + 34, 226 + j * 48 * 1.18, 4, 0, 7); g.fill(); }
      }
    });
    // 左半页：艾的线描
    drawPlant(g, herbs[0].map((l) => ({ ...l, pts: l.pts.map(([x, y]) => [x * 0.95 - 140, y * 0.95 + 20]) })), ease((t - 0.5) / 3.5));
    vtext(g, '蘄艾', 300, 200, 40, INK(0.75 * smooth(1, 2, t)), SERIF_TC);
    g.restore();
    // 盖章：入选世界记忆名录
    if (stampT != null && t > stampT) {
      const u = smooth(stampT, stampT + 0.25, t), s = 1.4 - 0.4 * u;
      g.save(); g.translate(760, 660); g.rotate(-0.08); g.scale(s, s); g.globalAlpha = u * 0.9;
      g.strokeStyle = RED; g.lineWidth = 7; g.strokeRect(-130, -130, 260, 260); g.lineWidth = 2; g.strokeRect(-116, -116, 232, 232);
      g.fillStyle = RED; g.font = `52px ${BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('世界记忆', 0, -40); g.fillText('名 录', 0, 22); g.font = `34px ${SERIF}`; g.fillText('2011', 0, 82);
      g.restore();
    }
  }

  function treasures(t) {
    g.drawImage(paper, 0, 0);
    const items = [['艾', '蕲艾', 'Qi mugwort'], ['竹', '蕲竹', 'Qi bamboo'], ['蛇', '蕲蛇', 'Qi snake'], ['龟', '蕲龟', 'Qi turtle']];
    items.forEach(([ch, name, en], i) => {
      const x = 330 + i * 420, a = smooth(1.2 + i * 0.75, 1.9 + i * 0.75, t);
      const blob = g.createRadialGradient(x, 470, 10, x, 470, 210);
      blob.addColorStop(0, INK(0.12 * a)); blob.addColorStop(1, INK(0));
      g.fillStyle = blob; g.beginPath(); g.arc(x, 470, 220, 0, 7); g.fill();
      g.save(); g.translate(x, 470); g.scale(0.92 + 0.08 * a, 0.92 + 0.08 * a);
      g.fillStyle = INK(0.9 * a); g.font = `250px ${BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 0, -10);
      g.restore();
      g.fillStyle = INK(0.8 * a); g.font = `40px ${SERIF}`; g.textAlign = 'center'; g.fillText(name, x, 720);
      g.fillStyle = INK(0.5 * a); g.font = `22px ${SERIF}`; g.fillText(en, x, 765);
      if (i < 3) { g.strokeStyle = INK(0.18 * a); g.lineWidth = 1; g.beginPath(); g.moveTo(x + 210, 320); g.lineTo(x + 210, 760); g.stroke(); }
    });
    seal(g, 1700, 200, '四宝', 70);
  }

  function portraits(t, people) {
    g.drawImage(paperDark, 0, 0);
    people.forEach((p, i) => {
      const x = 640 + i * 640, a = smooth(0.8 + i * 1.6, 1.8 + i * 1.6, t);
      // 一笔圆相
      g.strokeStyle = INK(0.55 * a); g.lineWidth = 26; g.lineCap = 'round';
      g.beginPath(); g.arc(x, 470, 210, -2.4, -2.4 + Math.PI * 1.85 * ease((t - 0.6 - i * 1.6) / 1.4)); g.stroke();
      g.fillStyle = INK(0.92 * a); g.font = `200px ${BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.name, x, 460);
      g.font = `36px ${SERIF}`; g.fillStyle = INK(0.8 * a); g.textBaseline = 'alphabetic'; g.fillText(p.years, x, 760);
      g.font = `30px ${SERIF}`; g.fillStyle = INK(0.65 * a); g.fillText(p.role, x, 812);
      g.font = `22px ${SERIF}`; g.fillStyle = INK(0.45 * a); g.fillText(p.en, x, 852);
    });
  }

  // 主入口：按分段的 variant 画
  return function draw(seg, t, alpha) {
    g.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    g.globalAlpha = 1;
    const lt = t - seg.start;
    switch (seg.mode === 'ink' ? seg.variant : seg.mode) {
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
    }
    // 段内的章名印章和题诗
    if (seg.seal) seal(g, 1720, 180, seg.seal, 72);
    if (seg.poem) {
      const a = smooth(2, 3, lt);
      const pad = g.createRadialGradient(1500, 480, 20, 1500, 480, 340);
      pad.addColorStop(0, `rgba(236,226,204,${0.92 * a})`); pad.addColorStop(1, 'rgba(236,226,204,0)');
      g.fillStyle = pad; g.fillRect(1100, 140, 800, 700);
      vtext(g, seg.poem, 1560, 240, 92, INK(0.9 * a));
      g.font = `30px ${SERIF}`; g.fillStyle = INK(0.6 * a); g.textAlign = 'center'; vtext(g, `— ${seg.poemBy}`, 1440, 640, 30, INK(0.6 * a), SERIF);
    }
    if (seg.note) { g.font = `20px ${SERIF}`; g.fillStyle = INK(0.45); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(seg.note, 140, H - 170); }
  };
}

// 23–32 秒：海平線化成光線，串起影像、音樂、舞台，最後寫出 Tim
import { T, beat2Time } from './timeline.js';
import { clamp, lerp, inv, smooth, easeInOutSine, easeInOutCubic, easeOutCubic, bezierPath, resample, hash } from './util.js';
import { HORIZON_Y } from './string.js';

const GOLD = [255, 214, 150];
const GOLD_CORE = [255, 246, 226];

// 幾何小工具：產生折線點
const line = (a, b) => [a, b];
function arc(cx, cy, rx, ry, a0, a1, n = 90) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n);
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}
function rrect(cx, cy, w, h, r) {
  // 從上邊左側開始，順時針一圈，再多走一段上邊
  const L = cx - w / 2;
  const R = cx + w / 2;
  const Tp = cy - h / 2;
  const B = cy + h / 2;
  return [
    ...line([L + r, Tp], [R - r, Tp]),
    ...arc(R - r, Tp + r, r, r, -Math.PI / 2, 0, 12),
    ...line([R, Tp + r], [R, B - r]),
    ...arc(R - r, B - r, r, r, 0, Math.PI / 2, 12),
    ...line([R - r, B], [L + r, B]),
    ...arc(L + r, B - r, r, r, Math.PI / 2, Math.PI, 12),
    ...line([L, B - r], [L, Tp + r]),
    ...arc(L + r, Tp + r, r, r, Math.PI, Math.PI * 1.5, 12),
    ...line([L + r, Tp], [R - r, Tp]),
  ];
}

// 三個母題的位置（與 4–8 秒的組裝呼應）
export const M1 = { x: 500, y: 330, w: 300, h: 170, r: 16 };
export const M2 = { x: 960, y: 300, r: 95 };
export const M3 = { x: 1420, apex: 190, by: 460, rx: 110, ry: 26 };

// Tim 的一筆書寫（螢幕座標）
export const TIM = [
  [[690, 262], [736, 216], [858, 208], [1000, 226]],
  [[1000, 226], [1034, 230], [1016, 256], [952, 253]],
  [[952, 253], [902, 251], [872, 262], [864, 294]],
  [[864, 294], [854, 344], [842, 408], [814, 422]],
  [[814, 422], [792, 432], [778, 412], [800, 399]],
  [[800, 399], [850, 380], [906, 354], [930, 334]],
  [[930, 334], [924, 362], [916, 406], [936, 416]],
  [[936, 416], [956, 422], [968, 380], [974, 342]],
  [[974, 342], [984, 320], [1012, 320], [1016, 354]],
  [[1016, 354], [1018, 380], [1018, 400], [1019, 416]],
  [[1019, 416], [1021, 372], [1032, 328], [1058, 328]],
  [[1058, 328], [1084, 328], [1088, 362], [1088, 414]],
  [[1088, 414], [1092, 430], [1116, 426], [1140, 408]],
];
export const I_DOT = [940, 300];
export const CARET = { x: 1170, y0: 346, y1: 424 };

let SEGS = null;
export function initFinale() {
  const c1 = M1;
  const L1 = c1.x - c1.w / 2;
  const T1 = c1.y - c1.h / 2;
  const R1 = c1.x + c1.w / 2;
  const segs = [
    { t0: T.lift, t1: T.motif1 + 0.05, kind: 'link', pts: bezierPath([[[960, HORIZON_Y], [950, 470], [250, 150], [L1 + c1.r, T1]]]), ease: easeInOutSine },
    { t0: T.motif1 + 0.05, t1: 24.85, kind: 'm1', pts: resample(rrect(c1.x, c1.y, c1.w, c1.h, c1.r), 2), ease: easeInOutCubic },
    { t0: 24.85, t1: 25.15, kind: 'link', pts: bezierPath([[[R1 - c1.r, T1], [730, T1], [800, M2.y], [M2.x - M2.r, M2.y]]]), ease: (u) => u },
    { t0: 25.15, t1: 25.9, kind: 'm2', pts: resample(arc(M2.x, M2.y, M2.r, M2.r, Math.PI, Math.PI * 3.5, 240), 2), ease: easeInOutSine },
    { t0: 25.9, t1: 26.15, kind: 'link', pts: bezierPath([[[M2.x, M2.y - M2.r], [1100, M2.y - M2.r], [1300, 150], [M3.x, M3.apex]]]), ease: (u) => u },
    {
      t0: 26.15,
      t1: 26.95,
      kind: 'm3',
      pts: resample(
        [
          ...line([M3.x, M3.apex], [M3.x - M3.rx, M3.by]),
          ...arc(M3.x, M3.by, M3.rx, M3.ry, Math.PI, -Math.PI * 2, 200),
          ...line([M3.x + M3.rx, M3.by], [M3.x, M3.apex]),
        ],
        2
      ),
      ease: easeInOutSine,
    },
    { t0: 26.95, t1: T.write, kind: 'link', pts: bezierPath([[[M3.x, M3.apex], [1600, 360], [980, 600], TIM[0][0]]]), ease: easeInOutSine },
    { t0: T.write, t1: 28.7, kind: 'tim', pts: bezierPath(TIM, 1.5), ease: (u) => easeInOutSine(u) * 0.85 + u * 0.15 },
  ];
  SEGS = segs;
}

function headAt(t) {
  for (const s of SEGS) {
    if (t >= s.t0 && t < s.t1) {
      const u = s.ease((t - s.t0) / (s.t1 - s.t0));
      return { seg: s, idx: Math.floor(u * (s.pts.length - 1)) };
    }
  }
  return null;
}

function groupAlpha(kind, t) {
  const dis = 1 - smooth(27.25, 27.95, t);
  if (kind === 'link') return 0.42 * dis;
  if (kind === 'tim') return 1;
  return dis;
}

function strokeThread(g, pts, a, wMul = 1) {
  if (pts.length < 2 || a <= 0.005) return;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokeStyle = `rgba(${GOLD},${0.07 * a})`;
  g.lineWidth = 18 * wMul;
  g.stroke();
  g.strokeStyle = `rgba(${GOLD},${0.3 * a})`;
  g.lineWidth = 6 * wMul;
  g.stroke();
  g.strokeStyle = `rgba(${GOLD_CORE},${0.95 * a})`;
  g.lineWidth = 2.2 * wMul;
  g.stroke();
}

export function drawFinale(K, t) {
  if (t < T.lift) return;
  const { g, ctx } = K;
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  g.lineJoin = 'round';

  // 母題的內部：影像畫面、音樂波紋、舞台光錐
  motifFills(g, t);

  const head = headAt(t);
  for (const s of SEGS) {
    if (t < s.t0) break;
    const a = groupAlpha(s.kind, t);
    const end = t >= s.t1 ? s.pts.length : head && head.seg === s ? head.idx + 1 : 0;
    strokeThread(g, s.pts.slice(0, end), a, s.kind === 'tim' ? 1.25 : 1);
  }
  // 光頭：移動中的亮點
  if (head) {
    const p = head.seg.pts[head.idx];
    const rg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], 46);
    rg.addColorStop(0, 'rgba(255,250,235,0.95)');
    rg.addColorStop(0.18, 'rgba(255,220,160,0.5)');
    rg.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = rg;
    g.fillRect(p[0] - 50, p[1] - 50, 100, 100);
    g.fillStyle = 'rgba(255,236,200,0.35)';
    g.fillRect(p[0] - 60, p[1] - 0.8, 120, 1.6);
  }
  // 母題散成光點上升
  dissolveSparks(g, t);

  // i 的點
  const dk = inv(T.dot, T.dot + 0.12, t);
  if (dk > 0) {
    const y = lerp(I_DOT[1] - 90, I_DOT[1], easeOutCubic(dk));
    const fl = Math.exp(-(t - T.dot - 0.12) * 6) * (dk >= 1 ? 1 : 0);
    const rg = g.createRadialGradient(I_DOT[0], y, 0, I_DOT[0], y, 30 + 30 * fl);
    rg.addColorStop(0, 'rgba(255,250,235,1)');
    rg.addColorStop(0.25, `rgba(255,220,160,${0.6 + 0.3 * fl})`);
    rg.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(I_DOT[0], y, 30 + 30 * fl, 0, Math.PI * 2);
    g.fill();
  }
  // 游標回收：開場的游標，在結尾以暖色再閃一次
  let on = 0;
  if (t >= T.caret && t < T.caret + 0.3) on = 1;
  if (t >= T.caret + 0.55 && t < T.caret + 0.85) on = 1;
  if (t >= T.caret + 1.1) on = 0;
  if (on) {
    g.fillStyle = 'rgba(255,200,130,0.25)';
    g.fillRect(CARET.x - 8, CARET.y0 - 6, 16, CARET.y1 - CARET.y0 + 12);
    g.fillStyle = 'rgba(255,246,228,1)';
    g.fillRect(CARET.x - 2, CARET.y0, 4, CARET.y1 - CARET.y0);
  }
  g.restore();
  void ctx;
}

function motifFills(g, t) {
  const dis = 1 - smooth(27.25, 27.95, t);
  // 影像：畫框裡亮起，出現播放鍵
  let k = smooth(24.8, 25.2, t) * dis;
  if (k > 0) {
    const { x, y, w, h } = M1;
    const gr = g.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    gr.addColorStop(0, `rgba(255,200,140,${0.05 * k})`);
    gr.addColorStop(0.6, `rgba(255,214,160,${0.16 * k})`);
    gr.addColorStop(1, `rgba(255,200,140,${0.05 * k})`);
    g.fillStyle = gr;
    g.fillRect(x - w / 2, y - h / 2, w, h);
    g.fillStyle = `rgba(255,236,206,${0.4 * k})`;
    g.fillRect(x - w / 2, y + h * 0.12, w, 1.4);
    const pk = easeOutCubic(inv(24.85, 25.15, t));
    g.beginPath();
    g.moveTo(x - 14 * pk, y - 18 * pk);
    g.lineTo(x + 20 * pk, y);
    g.lineTo(x - 14 * pk, y + 18 * pk);
    g.closePath();
    g.fillStyle = `rgba(255,240,215,${0.85 * k})`;
    g.fill();
  }
  // 音樂：圓上的波紋隨節拍擴散
  k = smooth(25.8, 26.1, t) * dis;
  if (k > 0) {
    for (let b = 5; b <= 9; b++) {
      const bt = beat2Time(b);
      const u = t - bt;
      if (u < 0 || u > 1.2) continue;
      g.beginPath();
      g.arc(M2.x, M2.y, M2.r + u * 90, 0, Math.PI * 2);
      g.strokeStyle = `rgba(255,214,150,${0.35 * (1 - u / 1.2) * k})`;
      g.lineWidth = 1.5;
      g.stroke();
    }
    g.beginPath();
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      const r = M2.r * 0.62 + 10 * Math.sin(a * 9 + t * 5) * Math.sin(a * 3 - t * 2) * (0.6 + 0.4 * Math.sin(t * 12.566));
      const X = M2.x + r * Math.cos(a);
      const Y = M2.y + r * Math.sin(a);
      i ? g.lineTo(X, Y) : g.moveTo(X, Y);
    }
    g.strokeStyle = `rgba(255,226,180,${0.55 * k})`;
    g.lineWidth = 1.6;
    g.stroke();
  }
  // 舞台：光錐與光圈
  k = smooth(26.9, 27.2, t) * dis;
  if (k > 0) {
    const cone = g.createLinearGradient(0, M3.apex, 0, M3.by);
    cone.addColorStop(0, `rgba(255,230,190,${0.22 * k})`);
    cone.addColorStop(1, `rgba(255,214,160,${0.08 * k})`);
    g.fillStyle = cone;
    g.beginPath();
    g.moveTo(M3.x, M3.apex);
    g.lineTo(M3.x - M3.rx, M3.by);
    g.ellipse(M3.x, M3.by, M3.rx, M3.ry, 0, Math.PI, 0, true);
    g.closePath();
    g.fill();
  }
}

function dissolveSparks(g, t) {
  const u = inv(27.2, 28.6, t);
  if (u <= 0 || u >= 1) return;
  for (const s of SEGS) {
    if (s.kind !== 'm1' && s.kind !== 'm2' && s.kind !== 'm3') continue;
    for (let i = 0; i < s.pts.length; i += 14) {
      const h = hash(i * 1.37 + s.t0);
      const p = s.pts[i];
      const d = clamp((u - h * 0.25) / 0.75);
      if (d <= 0 || d >= 1) continue;
      const x = p[0] + Math.sin(h * 30 + d * 3) * 18 * d;
      const y = p[1] - d * (50 + 90 * h);
      g.fillStyle = `rgba(255,226,180,${0.8 * (1 - d) * (0.5 + 0.5 * h)})`;
      g.beginPath();
      g.arc(x, y, 1.2 + 1.5 * h, 0, Math.PI * 2);
      g.fill();
    }
  }
}
export { easeOutCubic };

// 給配樂用：光頭的位置與速度（寫字的聲音跟著速度走）
export function threadHead(t) {
  const h = headAt(t);
  if (!h) return null;
  const p = h.seg.pts[h.idx];
  const q = headAt(t + 0.005);
  const p2 = q ? q.seg.pts[q.idx] : p;
  return { x: p[0], y: p[1], speed: Math.hypot(p2[0] - p[0], p2[1] - p[1]) / 0.005, kind: h.seg.kind };
}

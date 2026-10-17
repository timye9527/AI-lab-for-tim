// Tim 第二版：俱乐部插画风（粗描边 + 平涂 + 一层赛璐璐暗部），按本人照片设计
// 特征：两侧推短、顶部略长往上抓的黑短发，小麦色皮肤，笑起来露牙，偏瘦；米色宽松 T 恤 + 藏青外套 + 双肩包
// 单位：头高 200（头心为原点）；全身 1200（6 头身，脚底中心为原点），y 向下为正

export const C = {
  line: '#1E1A22',
  skin: '#EDB892', skinSh: '#D2906A', blush: '#E57F6B',
  hair: '#1C1B22', hairHi: '#4B5372', buzz: '#3C3F4D',
  white: '#FFFFFF', iris: '#4A2A1A', pupil: '#1A100C',
  mouth: '#7E2A2B', tongue: '#E2736A', teeth: '#FFFFFF',
  tee: '#EEE2CA', teeSh: '#D3C1A0',
  jacket: '#22416C', jacketSh: '#172E4F',
  pants: '#A39C8E', pantsSh: '#857E72',
  shoe: '#2C2E36', sole: '#ECE6DA',
  pack: '#25282F', packSh: '#1A1C22',
  sweat: '#CFEAFF',
};

const LW = 6.5; // 主描边宽度（头高 200 时）

function fillStroke(ctx, p, fill, lw = LW) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(p);
  }
  if (lw) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = C.line;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(p);
  }
}
function line(ctx, d, w = LW, color = C.line) {
  ctx.lineWidth = w;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(d));
}
// 在某个形状里面画暗部（赛璐璐）
function shade(ctx, clipPath, d, color) {
  ctx.save();
  ctx.clip(clipPath);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(d));
  ctx.restore();
}

export function expr(o = {}) {
  return { eyes: 'open', look: [0, 0], brows: 'neutral', mouth: 'smile', blush: 0, sweat: 0, sweatY: 0, t: 0, ...o };
}

// ---------------- 正面头 ----------------
const FACE_F = new Path2D('M 0,-94 C 46,-94 79,-62 79,-16 C 79,16 75,38 64,58 C 54,76 42,90 26,98 Q 0,108 -26,98 C -42,90 -54,76 -64,58 C -75,38 -79,16 -79,-16 C -79,-62 -46,-94 0,-94 Z');
const HAIR_F = new Path2D(
  'M -80,-36 C -86,-70 -70,-100 -46,-112 Q -42,-126 -28,-130 Q -24,-120 -18,-118 Q -10,-140 8,-140 Q 10,-128 14,-124 ' +
  'Q 26,-140 42,-134 Q 40,-122 44,-118 Q 60,-124 68,-112 Q 64,-104 64,-98 C 80,-84 86,-62 80,-36 ' +
  'L 72,-40 Q 62,-56 44,-60 Q 30,-66 14,-62 Q 0,-70 -14,-62 Q -30,-66 -44,-60 Q -62,-56 -72,-40 Z',
);
// 两侧推短：贴着头皮的窄条
const BUZZ_F = [
  new Path2D('M -80,-38 C -83,-20 -82,-6 -79,4 L -72,2 C -73,-10 -73,-24 -72,-42 Z'),
  new Path2D('M 80,-38 C 83,-20 82,-6 79,4 L 72,2 C 73,-10 73,-24 72,-42 Z'),
];

function eye(ctx, x, y, sx, e) {
  // sx = 1 右眼（画面右侧），-1 左眼；外眼角朝外
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx * 1.12, 1.12);
  const [lx, ly] = e.look;
  if (e.eyes === 'happy') {
    line(ctx, 'M -15,5 Q 0,-9 15,5', 5);
  } else if (e.eyes === 'closed') {
    line(ctx, 'M -15,0 Q 0,10 15,0', 4.5);
  } else if (e.eyes === 'shock') {
    const p = new Path2D('M 0,-15 C 9,-15 14,-8 14,0 C 14,9 8,15 0,15 C -8,15 -14,9 -14,0 C -14,-8 -9,-15 0,-15 Z');
    fillStroke(ctx, p, C.white, 3.5);
    ctx.fillStyle = C.pupil;
    ctx.beginPath();
    ctx.arc(lx * 4 * sx, ly * 4, 3.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const half = e.eyes === 'half';
    const alm = new Path2D('M -17,3 Q -6,-11 16,-3 Q 9,11 -3,11 Q -14,10 -17,3 Z');
    ctx.fillStyle = C.white;
    ctx.fill(alm);
    ctx.save();
    ctx.clip(alm);
    const ix = lx * 5 * sx + 1;
    const iy = 2 + ly * 3;
    ctx.fillStyle = C.iris;
    ctx.beginPath();
    ctx.ellipse(ix, iy, 8.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.pupil;
    ctx.beginPath();
    ctx.ellipse(ix, iy - 1, 4.6, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // 上眼睑投影
    ctx.fillStyle = 'rgba(40,20,20,0.35)';
    ctx.fillRect(-20, -14, 40, 7);
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(ix - 3 * sx, iy - 4, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ix + 3 * sx, iy + 4, 1.3, 0, Math.PI * 2);
    ctx.fill();
    if (half) {
      ctx.fillStyle = C.skin;
      ctx.fillRect(-20, -14, 40, 13);
    }
    ctx.restore();
    // 上眼线（粗）+ 外眼角
    if (half) line(ctx, 'M -17,0 Q -4,-3 16,0', 4.8);
    else line(ctx, 'M -18,3 Q -6,-12 16,-4 L 19,-1', 4.8);
    line(ctx, 'M 4,11 Q 10,9 13,5', 2.2);
  }
  ctx.restore();
}

function brow(ctx, x, y, sx, kind) {
  const B = {
    neutral: [[-14, -19], [2, -22], [18, -20]],
    worry: [[-14, -27], [2, -24], [18, -17]],
    up: [[-14, -29], [2, -33], [18, -28]],
    angry: [[-14, -14], [2, -20], [18, -24]],
  }[kind] || [[-14, -19], [2, -22], [18, -20]];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  const [a, b, c] = B;
  // 粗眉：两笔叠出变粗的形状
  line(ctx, `M ${a[0]},${a[1]} Q ${b[0]},${b[1] - 2} ${c[0]},${c[1]}`, 6.5);
  line(ctx, `M ${a[0] + 1},${a[1] + 1.5} L ${b[0]},${b[1] + 1}`, 6);
  ctx.restore();
}

function mouth(ctx, x, y, e, sx = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  const m = e.mouth;
  if (m === 'grin' || m === 'scream') {
    const p = m === 'grin'
      ? new Path2D('M -30,-4 Q 0,6 30,-4 Q 24,24 0,27 Q -24,24 -30,-4 Z')
      : new Path2D('M -20,-8 Q 0,-14 20,-8 Q 26,22 0,38 Q -26,22 -20,-8 Z');
    ctx.fillStyle = C.mouth;
    ctx.fill(p);
    ctx.save();
    ctx.clip(p);
    ctx.fillStyle = C.teeth;
    ctx.fillRect(-32, -16, 64, m === 'grin' ? 17 : 12);
    ctx.fillStyle = C.tongue;
    ctx.beginPath();
    ctx.ellipse(0, m === 'grin' ? 27 : 36, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    fillStroke(ctx, p, null, 4);
  } else if (m === 'smile') {
    line(ctx, 'M -22,-2 Q 0,14 22,-2', 4.2);
    line(ctx, 'M -25,-5 L -21,0', 3);
    line(ctx, 'M 25,-5 L 21,0', 3);
  } else if (m === 'flat') {
    line(ctx, 'M -11,4 Q 0,6 11,4', 4);
  } else if (m === 'awk') {
    // 尴尬笑：嘴角一边上扬，嘴线发颤
    const w = Math.sin(e.t * 30) * 1.5;
    line(ctx, `M -20,6 Q -12,${-1 + w} -4,5 Q 4,${11 - w} 12,3 Q 18,-1 22,-4`, 4);
  } else if (m === 'o') {
    const p = new Path2D('M 0,-8 C 7,-8 9,-2 9,4 C 9,11 5,14 0,14 C -5,14 -9,11 -9,4 C -9,-2 -7,-8 0,-8 Z');
    fillStroke(ctx, p, C.mouth, 4);
  } else if (m === 'gulp') {
    line(ctx, 'M -10,4 Q -5,0 0,4 Q 5,8 10,4', 4);
  }
  ctx.restore();
}

function sweat(ctx, x, y, s) {
  if (s <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const p = new Path2D('M 0,-16 C 6,-6 10,0 10,6 C 10,12 5,16 0,16 C -5,16 -10,12 -10,6 C -10,0 -6,-6 0,-16 Z');
  fillStroke(ctx, p, C.sweat, 3.5);
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.ellipse(-3, 6, 2.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function blush(ctx, x, y, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  for (const dx of [-8, 0, 8]) line(ctx, `M ${x + dx - 3},${y + 5} L ${x + dx + 3},${y - 5}`, 3, C.blush);
  ctx.restore();
}

// 配角发型：back 画在脸后面，front 画在脸上面
const HAIRS = {
  long: {
    back: 'M -92,-40 C -104,40 -100,150 -72,196 L 72,196 C 100,150 104,40 92,-40 Z',
    front: 'M -86,-6 C -96,-84 -52,-120 0,-120 C 52,-120 96,-84 86,-6 L 78,-14 C 72,-48 44,-62 8,-60 L 0,-42 L -10,-62 C -48,-60 -72,-46 -78,-14 Z',
  },
  bob: {
    back: 'M -94,-30 C -104,30 -100,74 -88,100 L 88,100 C 100,74 104,30 94,-30 Z',
    front: 'M -88,2 C -96,-82 -52,-120 0,-120 C 52,-120 96,-82 88,2 L 80,-2 C 78,-28 74,-42 68,-48 L -68,-48 C -74,-42 -78,-28 -80,-2 Z',
  },
  side: {
    front: 'M -84,-16 C -90,-82 -48,-120 4,-118 C 58,-116 92,-78 84,-16 L 77,-20 C 72,-44 60,-56 42,-60 C 12,-64 -18,-50 -40,-58 C -60,-54 -72,-40 -77,-18 Z',
  },
  curly: {
    back: (() => {
      let d = '';
      const n = 14;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * 0.95 + (i / n) * Math.PI * 1.1 - 0.05;
        const r = 128 + (i % 2) * 14;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 1.02 + 6;
        d += (i ? ' Q ' + (Math.cos(a - 0.12) * (r + 30)).toFixed(1) + ',' + (Math.sin(a - 0.12) * (r + 30) + 6).toFixed(1) + ' ' : 'M ') + x.toFixed(1) + ',' + y.toFixed(1);
      }
      return d + ' L 100,120 Q 0,150 -100,120 Z';
    })(),
    front: 'M -86,-10 Q -92,-60 -66,-90 Q -60,-70 -44,-74 Q -40,-100 -16,-104 Q -10,-82 6,-84 Q 18,-108 40,-100 Q 40,-80 56,-78 Q 70,-96 84,-70 Q 92,-40 86,-10 L 78,-18 Q 70,-44 54,-54 Q 40,-46 28,-56 Q 14,-46 0,-56 Q -14,-46 -28,-56 Q -42,-46 -54,-54 Q -70,-44 -78,-18 Z',
  },
  bun: {
    back: 'M -40,-150 C -40,-196 40,-196 40,-150 C 40,-120 -40,-120 -40,-150 Z',
    front: 'M -84,-10 C -92,-82 -50,-118 0,-118 C 50,-118 92,-82 84,-10 L 76,-16 C 70,-46 44,-58 0,-56 C -44,-58 -70,-46 -76,-16 Z',
  },
};

function glasses(ctx) {
  for (const s of [-1, 1]) {
    const p = new Path2D(`M ${s * 30 - 20},6 C ${s * 30 - 20},-12 ${s * 30 + 20},-12 ${s * 30 + 20},6 C ${s * 30 + 20},24 ${s * 30 - 20},24 ${s * 30 - 20},6 Z`);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill(p);
    fillStroke(ctx, p, null, 4.5);
  }
  line(ctx, 'M -10,2 Q 0,-4 10,2', 4.5);
}

export function drawHeadFront(ctx, e = expr()) {
  const hv = HAIRS[e.hair];
  if (hv && hv.back) fillStroke(ctx, new Path2D(hv.back), C.hair);
  // 耳朵
  for (const s of [-1, 1]) {
    const p = new Path2D(`M ${s * 74},-8 C ${s * 96},-14 ${s * 98},28 ${s * 72},34`);
    fillStroke(ctx, p, C.skin);
    line(ctx, `M ${s * 80},2 C ${s * 88},4 ${s * 88},18 ${s * 78},22`, 3, C.skinSh);
  }
  fillStroke(ctx, FACE_F, C.skin);
  // 赛璐璐暗部：刘海投影 + 下颌一侧
  shade(ctx, FACE_F, 'M -90,-80 L 90,-80 L 90,-44 Q 62,-44 44,-50 Q 28,-56 14,-52 Q 0,-60 -14,-52 Q -28,-56 -44,-50 Q -62,-44 -90,-44 Z', C.skinSh);
  shade(ctx, FACE_F, 'M 79,-10 C 70,40 50,80 0,103 L 90,110 Z', 'rgba(210,144,106,0.55)');
  // 头发
  if (hv) {
    fillStroke(ctx, new Path2D(hv.front), C.hair);
  } else {
    for (const b of BUZZ_F) fillStroke(ctx, b, C.buzz, LW * 0.6);
    fillStroke(ctx, HAIR_F, C.hair);
  }
  // 头发高光（几道短线）
  if (!hv) {
    line(ctx, 'M -34,-108 Q -22,-118 -6,-122', 3.5, C.hairHi);
    line(ctx, 'M 16,-120 Q 30,-122 44,-114', 3.5, C.hairHi);
    fillStroke(ctx, HAIR_F, null, LW);
  }
  // 五官
  brow(ctx, -30, 2, -1, e.brows);
  brow(ctx, 30, 2, 1, e.brows);
  eye(ctx, -30, 8, -1, e);
  eye(ctx, 30, 8, 1, e);
  line(ctx, 'M 4,24 Q 9,36 2,42', 3.2, C.skinSh);
  blush(ctx, -46, 38, e.blush);
  blush(ctx, 46, 38, e.blush);
  mouth(ctx, 0, 60, e);
  if (e.glasses) glasses(ctx);
  sweat(ctx, 70, -36 + e.sweatY * 40, e.sweat);
}

// ---------------- 3/4 侧脸（朝画面右侧） ----------------
const FACE_Q = new Path2D('M -6,-94 C 42,-96 76,-64 78,-22 C 79,-6 79,4 80,12 L 89,31 Q 91,37 81,39 C 80,50 74,64 62,80 C 48,96 30,104 12,103 C -18,100 -44,84 -62,60 C -80,36 -86,2 -82,-30 C -76,-72 -48,-94 -6,-94 Z');
const HAIR_Q = new Path2D(
  'M -84,-30 C -90,-70 -72,-100 -48,-112 Q -42,-126 -26,-128 Q -22,-118 -16,-116 Q -6,-138 12,-136 Q 14,-124 18,-120 ' +
  'Q 30,-134 46,-128 Q 44,-116 48,-112 Q 62,-116 72,-104 Q 66,-98 66,-92 C 78,-78 82,-58 78,-36 ' +
  'L 70,-40 Q 62,-54 48,-58 Q 34,-64 20,-60 Q 6,-66 -6,-58 Q -20,-62 -32,-54 Q -44,-48 -52,-34 Z',
);
const BUZZ_Q = new Path2D('M -84,-32 C -88,-10 -86,8 -80,22 L -70,16 C -70,0 -66,-18 -54,-36 Z');
export function drawHeadQuarter(ctx, e = expr()) {
  // 耳朵在左边
  fillStroke(ctx, FACE_Q, C.skin);
  shade(ctx, FACE_Q, 'M -90,-80 L 90,-80 L 90,-42 Q 64,-46 48,-50 Q 30,-56 18,-52 Q 4,-58 -8,-50 Q -24,-52 -36,-46 L -90,-26 Z', C.skinSh);
  shade(ctx, FACE_Q, 'M -82,-10 C -70,40 -40,80 10,103 L -100,110 Z', 'rgba(210,144,106,0.55)');
  fillStroke(ctx, BUZZ_Q, C.buzz, LW * 0.6);
  fillStroke(ctx, HAIR_Q, C.hair);
  line(ctx, 'M -26,-108 Q -12,-118 4,-120', 3.5, C.hairHi);
  line(ctx, 'M 24,-118 Q 38,-120 52,-110', 3.5, C.hairHi);
  // 耳朵（在推短的鬓角前面）
  fillStroke(ctx, new Path2D('M -50,-6 C -66,-18 -84,4 -72,24 C -66,34 -56,34 -50,28'), C.skin, LW * 0.8);
  line(ctx, 'M -58,2 C -70,0 -72,16 -62,20', 3, C.skinSh);
  fillStroke(ctx, HAIR_Q, null, LW);
  // 近眼（左）正常大小，远眼（右）压窄
  brow(ctx, -6, 2, -1, e.brows);
  ctx.save();
  ctx.translate(54, 2);
  ctx.scale(0.72, 1);
  brow(ctx, 0, 0, 1, e.brows);
  ctx.restore();
  eye(ctx, -6, 8, -1, e);
  ctx.save();
  ctx.translate(54, 8);
  ctx.scale(0.72, 1);
  eye(ctx, 0, 0, 1, e);
  ctx.restore();
  // 鼻孔
  line(ctx, 'M 74,37 Q 78,41 82,39', 2.6);
  blush(ctx, -16, 40, e.blush);
  blush(ctx, 60, 38, e.blush * 0.8);
  mouth(ctx, 40, 64, e, 0.85);
  sweat(ctx, -48, -40 + e.sweatY * 40, e.sweat);
}

// ---------------- 身体 ----------------
// 带描边的「面条」肢体：先画所有描边，再画所有填色，关节处没有接缝
function noodles(ctx, segs) {
  for (const sg of segs) {
    ctx.lineCap = sg.cap || 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = C.line;
    ctx.lineWidth = sg.w + LW * 2;
    ctx.beginPath();
    ctx.moveTo(sg.p[0][0], sg.p[0][1]);
    for (let i = 1; i < sg.p.length; i++) ctx.lineTo(sg.p[i][0], sg.p[i][1]);
    ctx.stroke();
  }
  for (const sg of segs) {
    ctx.lineCap = sg.cap || 'round';
    ctx.strokeStyle = sg.c;
    ctx.lineWidth = sg.w;
    ctx.beginPath();
    ctx.moveTo(sg.p[0][0], sg.p[0][1]);
    for (let i = 1; i < sg.p.length; i++) ctx.lineTo(sg.p[i][0], sg.p[i][1]);
    ctx.stroke();
  }
}
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// 手：手腕在原点，手指朝 +y
const HANDS = {
  relax: ['M -19,0 C -25,22 -24,48 -12,62 C -3,72 14,70 18,57 C 22,42 22,20 16,0 Z', 'M -17,12 C -32,22 -30,40 -16,42'],
  fist: ['M -21,0 C -27,18 -26,40 -12,48 C 0,54 16,50 20,38 C 24,24 22,10 18,0 Z', 'M -18,14 C -28,22 -24,34 -10,32'],
  point: ['M -21,0 C -27,18 -26,40 -12,48 C 0,54 16,50 20,38 C 24,24 22,10 18,0 Z M 4,40 L 4,84 Q 4,94 12,94 Q 20,94 20,84 L 20,36 Z', 'M -18,14 C -28,22 -24,34 -10,32'],
  open: ['M -22,0 C -30,16 -28,36 -18,44 L -30,74 Q -30,82 -24,80 L -8,52 L -10,88 Q -8,96 0,92 L 4,54 L 12,88 Q 16,94 22,88 L 16,50 L 30,74 Q 36,78 36,70 L 22,38 C 28,24 24,8 18,0 Z', 'M -20,10 C -38,10 -46,26 -36,30'],
};
function hand(ctx, x, y, ang, type, flip = 1) {
  const [body, thumb] = HANDS[type] || HANDS.relax;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(flip * 1.55, 1.55);
  const t = new Path2D(thumb);
  fillStroke(ctx, new Path2D(body), C.skin, LW * 0.55);
  fillStroke(ctx, t, null, LW * 0.55);
  ctx.restore();
}

export function pose(o = {}) {
  return {
    x: 0, y: 0, s: 0.5, flip: 1, lean: 0, bob: 0, jump: 0, tuck: 0, spread: 0, sq: 1,
    jacket: true, pack: true, head: 'front', headFlip: 1, tilt: 0, hunch: 0,
    armL: { a: 0.12, b: 0.1, hand: 'relax' }, armR: { a: 0.12, b: 0.1, hand: 'relax' },
    tremble: 0, t: 0, e: expr(), ...o,
  };
}

function armSegs(sh, sgn, arm, p) {
  const tr = p.tremble ? Math.sin(p.t * 63 + sgn) * 0.05 * p.tremble : 0;
  const L1 = 245;
  const L2 = 215;
  let a0 = arm.a;
  let b0 = arm.b;
  if (arm.target) {
    // 目标点（身体局部坐标，躯干已平移）→ 求大臂、小臂角度，手肘向下弯
    const dx = (arm.target[0] - sh[0]) * sgn;
    const dy = arm.target[1] - sh[1];
    const d = Math.min(L1 + L2 - 1, Math.hypot(dx, dy));
    const base = Math.atan2(dx, dy);
    const k = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    const bend = arm.bend ?? 1;
    a0 = base + k * bend;
    const elx = Math.sin(a0) * L1;
    const ely = Math.cos(a0) * L1;
    b0 = Math.atan2(dx - elx, dy - ely) - a0;
  }
  const a = a0 + tr;
  const b = b0 + tr;
  const el = [sh[0] + sgn * Math.sin(a) * L1, sh[1] + Math.cos(a) * L1];
  const wr = [el[0] + sgn * Math.sin(a + b) * L2, el[1] + Math.cos(a + b) * L2];
  return { el, wr, ang: Math.atan2(wr[1] - el[1], wr[0] - el[0]) - Math.PI / 2 };
}

function drawArm(ctx, sh, sgn, arm, p) {
  const { el, wr, ang } = armSegs(sh, sgn, arm, p);
  if (p.jacket) {
    noodles(ctx, [
      { p: [sh, el], w: 68, c: C.jacket },
      { p: [el, lerp2(el, wr, 0.9)], w: 58, c: C.jacket },
    ]);
    // 袖口
    noodles(ctx, [{ p: [lerp2(el, wr, 0.82), lerp2(el, wr, 0.92)], w: 58, c: C.jacketSh, cap: 'butt' }]);
  } else {
    noodles(ctx, [{ p: [sh, el], w: 50, c: C.skin }, { p: [el, wr], w: 44, c: C.skin }]);
  }
  hand(ctx, wr[0], wr[1], ang, arm.hand, -sgn);
}

// 短袖：从肩线伸出的梯形，靠躯干那一边不描边
function sleeve(ctx, sh, sgn, arm, p) {
  const { el } = armSegs(sh, sgn, arm, p);
  const end = lerp2(sh, el, 0.5);
  const dx = end[0] - sh[0];
  const dy = end[1] - sh[1];
  const n = Math.hypot(dx, dy) || 1;
  const nx = -dy / n;
  const ny = dx / n;
  const w0 = 50;
  const w1 = 44;
  const A = [sh[0] + nx * w0, sh[1] + ny * w0];
  const B = [sh[0] - nx * w0, sh[1] - ny * w0];
  const D = [end[0] + nx * w1, end[1] + ny * w1];
  const Cc = [end[0] - nx * w1, end[1] - ny * w1];
  ctx.fillStyle = C.tee;
  ctx.beginPath();
  ctx.moveTo(...A);
  ctx.lineTo(...D);
  ctx.lineTo(...Cc);
  ctx.lineTo(...B);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = LW;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(...A);
  ctx.lineTo(...D);
  ctx.lineTo(...Cc);
  ctx.lineTo(...B);
  ctx.stroke();
}

export function drawTimFront(ctx, p) {
  const saved = { ...C };
  Object.assign(C, p.pal || {});
  try {
    drawFront(ctx, p);
  } finally {
    Object.assign(C, saved);
  }
}

function drawFront(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.s * p.flip, p.s * p.sq);
  const jy = -p.jump * 300;
  ctx.translate(0, jy);
  // 腿
  const hipY = -600 + p.tuck * 120;
  const legs = [];
  const feet = [];
  for (const sgn of [-1, 1]) {
    const hip = [sgn * 60, hipY];
    const ft = [sgn * (64 + p.spread * 60 + p.tuck * 30), -84 - p.tuck * 160];
    const kn = [(hip[0] + ft[0]) / 2 + sgn * p.tuck * 90, (hip[1] + ft[1]) / 2 - p.tuck * 40];
    legs.push({ p: [hip, kn], w: 112, c: C.pants }, { p: [kn, ft], w: 92, c: C.pants });
    feet.push([ft, sgn]);
  }
  noodles(ctx, legs);
  for (const [ft, sgn] of feet) {
    ctx.save();
    ctx.translate(ft[0], ft[1] + 46);
    ctx.scale(sgn, 1);
    fillStroke(ctx, new Path2D('M -40,10 Q -52,-30 -14,-42 L 24,-42 Q 58,-30 54,10 Z'), C.shoe);
    fillStroke(ctx, new Path2D('M -46,2 L 58,2 Q 62,22 50,26 L -42,26 Q -52,22 -46,2 Z'), C.sole, LW * 0.8);
    ctx.restore();
  }
  fillStroke(ctx, new Path2D(`M -150,${hipY - 30} L 150,${hipY - 30} L 128,${hipY + 70} L -128,${hipY + 70} Z`), C.pants);
  // 上半身
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(p.lean);
  ctx.translate(0, 600 + p.hunch * 14);
  if (p.pack) fillStroke(ctx, new Path2D('M -172,-930 Q -182,-640 -156,-630 L 156,-630 Q 182,-640 172,-930 Q 0,-990 -172,-930 Z'), C.pack);
  if (!p.armR.front) drawArm(ctx, [-106, -918], -1, p.armR, p);
  if (!p.armL.front) drawArm(ctx, [106, -918], 1, p.armL, p);
  const tee = new Path2D('M -42,-968 Q 0,-952 42,-968 L 122,-952 Q 144,-940 148,-900 L 156,-552 Q 0,-536 -156,-552 L -148,-900 Q -144,-940 -122,-952 Z');
  fillStroke(ctx, tee, C.tee);
  shade(ctx, tee, 'M 80,-960 L 200,-960 L 200,-560 L 96,-560 Q 110,-760 80,-960 Z', C.teeSh);
  line(ctx, 'M -44,-966 Q 0,-936 44,-966', LW * 0.8);
  if (p.jacket) {
    for (const sgn of [-1, 1]) {
      ctx.save();
      ctx.scale(sgn, 1);
      const jk = new Path2D('M 44,-970 L 122,-954 Q 146,-942 150,-900 L 162,-534 L 52,-530 Q 40,-760 56,-880 Z');
      fillStroke(ctx, jk, C.jacket);
      shade(ctx, jk, 'M 112,-960 L 200,-960 L 200,-560 L 122,-560 Q 134,-760 112,-960 Z', C.jacketSh);
      // 翻领
      fillStroke(ctx, new Path2D('M 44,-970 L 96,-958 L 70,-860 L 54,-880 Z'), C.jacketSh, LW * 0.8);
      ctx.restore();
    }
  }
  if (!p.jacket) {
    sleeve(ctx, [-106, -918], -1, p.armR, p);
    sleeve(ctx, [106, -918], 1, p.armL, p);
  }
  if (p.pack) {
    for (const sgn of [-1, 1]) {
      noodles(ctx, [{ p: [[sgn * 84, -962], [sgn * 92, -880], [sgn * 98, -760]], w: 26, c: C.pack, cap: 'butt' }]);
    }
  }
  // 脖子
  fillStroke(ctx, new Path2D('M -24,-1010 L -26,-960 Q 0,-948 26,-960 L 24,-1010 Z'), C.skinSh, LW * 0.8);
  // 手臂
  if (p.armR.front) drawArm(ctx, [-106, -918], -1, p.armR, p);
  if (p.armL.front) drawArm(ctx, [106, -918], 1, p.armL, p);
  // 头
  ctx.save();
  ctx.translate(0, -1110 + p.bob + p.hunch * 20);
  ctx.scale(1.1, 1.1);
  ctx.rotate(p.tilt + (p.tremble ? Math.sin(p.t * 50) * 0.01 * p.tremble : 0));
  ctx.scale(p.headFlip, 1);
  const e = p.e;
  if (p.head === 'q') drawHeadQuarter(ctx, e);
  else drawHeadFront(ctx, e);
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

// 配角：同一套画法，换发型、肤色、衣服
export const FRIENDS = [
  { hair: 'curly', pal: { skin: '#F4CDB0', skinSh: '#DDA587', tee: '#E8763A', teeSh: '#C65E27', pants: '#1E1E24', pantsSh: '#111' } },
  { hair: 'side', glasses: true, pal: { skin: '#E3A57E', skinSh: '#C4845E', tee: '#B2C3F7', teeSh: '#8EA0DA', pants: '#22416C', pantsSh: '#172E4F' } },
  { hair: 'bob', pal: { skin: '#F1C3A0', skinSh: '#D69E7C', tee: '#C15145', teeSh: '#9C3A31', pants: '#3A3F4D', pantsSh: '#2A2E39', hair: '#3B2A22' } },
  { hair: 'bun', pal: { skin: '#EDB892', skinSh: '#D2906A', tee: '#F4C04E', teeSh: '#D49E2A', pants: '#5B6A8C', pantsSh: '#46536F' } },
  { hair: 'long', pal: { skin: '#F6D3B8', skinSh: '#E0AE8F', tee: '#FAF3D7', teeSh: '#E0D6B4', pants: '#C15145', pantsSh: '#9C3A31' } },
  { hair: 'side', pal: { skin: '#C98B62', skinSh: '#A96E48', tee: '#1E9BE9', teeSh: '#147BBC', pants: '#E9E1CF', pantsSh: '#CFC5AF', hair: '#2A2420' } },
];
export function friendPose(i, o = {}) {
  const f = FRIENDS[i % FRIENDS.length];
  return pose({ jacket: false, pack: false, pal: f.pal, ...o, e: expr({ hair: f.hair, glasses: f.glasses, ...(o.e || {}) }) });
}

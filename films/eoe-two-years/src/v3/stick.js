// 第三版角色：极简火柴人。所有人同一副身板（白脸圆头 + 黑线条），不分肤色发型
// Tim 靠头发认出来；两年里的变化靠姿态、发型、领带、墨镜、话筒表现
// 单位：身高约 600（脚底中心为原点），y 向下为正

export const INK = '#1E1A22';
export const FACE = '#FFFDF6';
const LW = 10;

const rad = (d) => (d * Math.PI) / 180;
function seg(ctx, pts, w = LW, color = INK) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}
function curve(ctx, a, c, b, w = LW, color = INK) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]);
  ctx.stroke();
}
function dot(ctx, x, y, r, color = INK) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// 两节肢体：给角度（度，0 = 竖直向下，正值朝 +x）或者给目标点
function limb(root, L1, L2, spec) {
  if (spec.to) {
    const dx = spec.to[0] - root[0];
    const dy = spec.to[1] - root[1];
    const d = Math.min(L1 + L2 - 0.5, Math.hypot(dx, dy));
    const base = Math.atan2(dx, dy);
    const k = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    const a1 = base + k * (spec.bend ?? 1);
    const mid = [root[0] + Math.sin(a1) * L1, root[1] + Math.cos(a1) * L1];
    const a2 = Math.atan2(dx - (mid[0] - root[0]), dy - (mid[1] - root[1]));
    return [root, mid, [mid[0] + Math.sin(a2) * L2, mid[1] + Math.cos(a2) * L2]];
  }
  const a1 = rad(spec.a);
  const a2 = a1 + rad(spec.b || 0);
  const mid = [root[0] + Math.sin(a1) * L1, root[1] + Math.cos(a1) * L1];
  return [root, mid, [mid[0] + Math.sin(a2) * L2, mid[1] + Math.cos(a2) * L2]];
}

export function stick(o = {}) {
  return {
    x: 0, y: 0, s: 1, face: 0, // face：-1 朝左看，1 朝右看，0 正面
    lean: 0, hunch: 0, bob: 0, jump: 0, squash: 1, tremble: 0, t: 0,
    // 手脚：角度或目标点（身体局部坐标）
    armL: { a: 18, b: 8 }, armR: { a: -18, b: -8 }, // L = 画面右边那只
    legL: { a: 8, b: 0 }, legR: { a: -8, b: 0 },
    // 表情
    eyes: 'dot', brows: 'none', mouth: 'smile', sweat: 0, blush: 0, look: [0, 0],
    // 造型
    hair: null, tie: null, glasses: null, pack: false, cap: null, scarf: null, bow: null, headphones: null, crown: 0,
    prop: null, // { type: 'mic' | 'paper' | 'phone' | 'box' | 'cup', hand: 'L' | 'R' }
    ...o,
  };
}

const HEAD_R = 58;

function drawHair(ctx, kind, f) {
  if (kind === 'messy') {
    // 刚来时：几撮没打理的短毛
    for (const [x, a] of [[-26, -30], [-8, -10], [10, 12], [28, 32]]) {
      const bx = x + f * 4;
      const by = -Math.sqrt(Math.max(0, HEAD_R * HEAD_R - x * x)) + 2;
      seg(ctx, [[bx, by], [bx + Math.sin(rad(a)) * 22, by - Math.cos(rad(a)) * 22]], 8);
    }
  } else if (kind === 'neat') {
    // 后来：往上抓、打理过的发型（一块利落的黑色）
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(-52 + f * 4, -24);
    ctx.bezierCurveTo(-60, -66, -20, -92, 18 + f * 6, -84);
    ctx.bezierCurveTo(40, -96, 64 + f * 6, -78, 60 + f * 4, -52);
    ctx.bezierCurveTo(40, -62, 10, -58, -10, -50);
    ctx.bezierCurveTo(-30, -46, -44, -38, -52 + f * 4, -24);
    ctx.fill();
  }
}

function drawFace(ctx, p) {
  const f = p.face;
  const fx = f * 18 + p.look[0] * 4;
  const fy = p.look[1] * 3;
  const ex = [fx - 18 + (f > 0 ? 6 : 0), fx + 18 - (f < 0 ? 6 : 0)];
  // 眉毛
  // [内侧, 外侧] 的高度偏移，负数往上：担心 = 内侧上扬
  const B = { none: null, worry: [-9, 4], up: [-9, -9], angry: [6, -6], flat: [0, 0] }[p.brows];
  if (B) {
    for (const [i, x] of ex.entries()) {
      const [inner, outer] = B;
      const left = i === 0 ? outer : inner;
      const right = i === 0 ? inner : outer;
      seg(ctx, [[x - 9, -24 + fy + left * 0.7], [x + 9, -24 + fy + right * 0.7]], 6);
    }
  }
  // 眼睛
  for (const x of ex) {
    if (p.eyes === 'dot') dot(ctx, x, -4 + fy, 6.5);
    else if (p.eyes === 'happy') curve(ctx, [x - 9, -2 + fy], [x, -14 + fy], [x + 9, -2 + fy], 5.5);
    else if (p.eyes === 'shock') {
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = INK;
      ctx.fillStyle = FACE;
      ctx.beginPath();
      ctx.arc(x, -6 + fy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      dot(ctx, x + p.look[0] * 3, -6 + fy, 3.2);
    } else if (p.eyes === 'closed') curve(ctx, [x - 9, -6 + fy], [x, 4 + fy], [x + 9, -6 + fy], 5.5);
    else if (p.eyes === 'line') seg(ctx, [[x - 8, -4 + fy], [x + 8, -4 + fy]], 5.5);
  }
  // 嘴
  const mx = fx;
  const my = 24 + fy;
  const m = p.mouth;
  if (m === 'smile') curve(ctx, [mx - 16, my - 2], [mx, my + 12], [mx + 16, my - 2], 5.5);
  else if (m === 'grin') {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(mx - 20, my - 4);
    ctx.quadraticCurveTo(mx, my + 2, mx + 20, my - 4);
    ctx.quadraticCurveTo(mx, my + 26, mx - 20, my - 4);
    ctx.fill();
    ctx.fillStyle = FACE;
    ctx.fillRect(mx - 14, my - 3, 28, 5);
  } else if (m === 'flat') seg(ctx, [[mx - 10, my + 2], [mx + 10, my + 2]], 5.5);
  else if (m === 'wobble') {
    const w = Math.sin(p.t * 30) * 2;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(mx - 16, my + 2);
    ctx.quadraticCurveTo(mx - 8, my - 4 + w, mx, my + 2);
    ctx.quadraticCurveTo(mx + 8, my + 8 - w, mx + 16, my);
    ctx.stroke();
  } else if (m === 'scream' || m === 'o' || m === 'sing') {
    const r = m === 'scream' ? [14, 20] : m === 'sing' ? [11, 13] : [7, 9];
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(mx, my + 4, r[0], r[1], 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 腮红：三道斜线
  if (p.blush > 0) {
    ctx.save();
    ctx.globalAlpha = p.blush;
    for (const x of ex) for (const d of [-7, 0, 7]) seg(ctx, [[x + d - 3, 14], [x + d + 3, 6]], 3.5, '#E57F6B');
    ctx.restore();
  }
}

export function drawStick(ctx, p0) {
  const p = p0;
  const tr = p.tremble ? Math.sin(p.t * 70) * p.tremble : 0;
  ctx.save();
  ctx.translate(p.x + tr * 2, p.y);
  ctx.scale(p.s, p.s * p.squash);
  ctx.translate(0, -p.jump * 200 + p.bob);
  const hip = [0, -250];
  // 身体：驼背时往前弯
  ctx.save();
  ctx.translate(hip[0], hip[1]);
  ctx.rotate(rad(p.lean));
  const neck = [p.face * p.hunch * 26, -200 + p.hunch * 18];
  const shoulder = [neck[0] * 0.85, neck[1] + 26];
  const headC = [neck[0] + p.face * p.hunch * 14, neck[1] - HEAD_R - 8 + p.hunch * 8];
  // 背包在背后
  if (p.pack) {
    const bx = -p.face * 44 - (p.face === 0 ? 0 : 0);
    ctx.fillStyle = '#3A4256';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(bx - 34 + (p.face === 0 ? 0 : 0), -170 + p.hunch * 10, 68, 120, 18);
    if (p.face !== 0) {
      ctx.fill();
      ctx.stroke();
    }
  }
  // 腿（相对胯部）
  const legR = limb([0, 0], 130, 125, p.legR);
  const legL = limb([0, 0], 130, 125, p.legL);
  ctx.restore();
  const toWorld = (pt) => {
    const c = Math.cos(rad(p.lean));
    const s = Math.sin(rad(p.lean));
    return [hip[0] + pt[0] * c - pt[1] * s, hip[1] + pt[0] * s + pt[1] * c];
  };
  // 腿不跟着上身倾斜：直接画
  for (const L of [legR, legL]) {
    const pts = L.map((q) => [hip[0] + q[0], hip[1] + q[1]]);
    seg(ctx, pts);
    // 小脚
    const ft = pts[2];
    const dir = p.face === 0 ? (L === legL ? 1 : -1) : p.face;
    seg(ctx, [ft, [ft[0] + dir * 22, ft[1] + 2]], LW);
  }
  // 上身
  const N = toWorld(neck);
  const S = toWorld(shoulder);
  const H = toWorld(headC);
  const spineMid = toWorld([neck[0] * 0.5 + p.face * p.hunch * 14, -100]);
  curve(ctx, hip, spineMid, N);
  // 领带 / 围巾
  if (p.tie) {
    ctx.fillStyle = p.tie;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(S[0] - 7, S[1] - 6);
    ctx.lineTo(S[0] + 7, S[1] - 6);
    ctx.lineTo(S[0] + 10, S[1] + 70);
    ctx.lineTo(S[0], S[1] + 86);
    ctx.lineTo(S[0] - 10, S[1] + 70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (p.scarf) {
    seg(ctx, [[N[0] - 26, N[1] + 2], [N[0] + 26, N[1] + 2]], 18, p.scarf);
    seg(ctx, [[N[0] + 16, N[1] + 4], [N[0] + 26, N[1] + 52]], 14, p.scarf);
  }
  // 手臂
  const armR = limb(S, 120, 112, p.armR);
  const armL = limb(S, 120, 112, p.armL);
  for (const A of [armR, armL]) {
    const pts = A.map((q, i) => (i === 0 ? q : [q[0] + (A === armL ? tr : -tr) * 3, q[1]]));
    seg(ctx, pts);
  }
  // 道具
  if (p.prop) drawProp(ctx, p.prop, p.prop.hand === 'R' ? armR[2] : armL[2], p);
  // 正面时背包肩带
  if (p.pack && p.face === 0) {
    seg(ctx, [[S[0] - 22, S[1] - 4], [S[0] - 26, S[1] + 70]], 8, '#3A4256');
    seg(ctx, [[S[0] + 22, S[1] - 4], [S[0] + 26, S[1] + 70]], 8, '#3A4256');
  }
  // 头
  ctx.save();
  ctx.translate(H[0], H[1] + tr * 0.5);
  ctx.rotate(rad(p.lean * 0.5 + (p.tilt || 0)));
  if (p.headphones) {
    seg(ctx, [[-HEAD_R - 4, 0], [-HEAD_R + 2, -HEAD_R + 6], [HEAD_R - 2, -HEAD_R + 6], [HEAD_R + 4, 0]], 9, p.headphones);
  }
  ctx.fillStyle = FACE;
  ctx.strokeStyle = INK;
  ctx.lineWidth = LW;
  ctx.beginPath();
  ctx.arc(0, 0, HEAD_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (p.headphones) {
    for (const s of [-1, 1]) {
      ctx.fillStyle = p.headphones;
      ctx.beginPath();
      ctx.roundRect(s * HEAD_R - 12, -18, 24, 40, 10);
      ctx.fill();
      ctx.stroke();
    }
  }
  drawHair(ctx, p.hair, p.face);
  if (p.cap) {
    ctx.fillStyle = p.cap;
    ctx.beginPath();
    ctx.arc(0, -10, HEAD_R + 2, Math.PI * 1.05, Math.PI * 1.95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(p.face >= 0 ? 10 : -76, -22, 66, 14, 7);
    ctx.fill();
    ctx.stroke();
  }
  if (p.bow) {
    ctx.fillStyle = p.bow;
    ctx.beginPath();
    ctx.moveTo(30, -56);
    ctx.lineTo(10, -78);
    ctx.lineTo(10, -40);
    ctx.closePath();
    ctx.moveTo(30, -56);
    ctx.lineTo(54, -78);
    ctx.lineTo(54, -38);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  drawFace(ctx, p);
  if (p.glasses) {
    const fx = p.face * 18;
    ctx.lineWidth = 5;
    ctx.strokeStyle = INK;
    if (p.glasses === 'sun') {
      ctx.fillStyle = INK;
      for (const x of [fx - 18, fx + 18]) {
        ctx.beginPath();
        ctx.roundRect(x - 15, -16, 30, 20, 8);
        ctx.fill();
      }
      seg(ctx, [[fx - 3, -10], [fx + 3, -10]], 5);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(fx - 26, -12, 6, 3);
      ctx.fillRect(fx + 10, -12, 6, 3);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0)';
      for (const x of [fx - 18, fx + 18]) {
        ctx.strokeStyle = p.glasses;
        ctx.beginPath();
        ctx.arc(x, -4, 14, 0, Math.PI * 2);
        ctx.stroke();
      }
      seg(ctx, [[fx - 4, -6], [fx + 4, -6]], 5, p.glasses);
    }
  }
  if (p.sweat > 0) {
    ctx.save();
    ctx.translate(HEAD_R * 0.8 * (p.face <= 0 ? 1 : -1), -30 + (p.sweatY || 0) * 40);
    ctx.scale(p.sweat, p.sweat);
    ctx.fillStyle = '#9FD2FF';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.bezierCurveTo(7, -6, 10, 0, 10, 6);
    ctx.arc(0, 6, 10, 0, Math.PI);
    ctx.bezierCurveTo(-10, 0, -7, -6, 0, -16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if (p.crown > 0) drawCrown(ctx, p.crown);
  ctx.restore();
  ctx.restore();
}

function drawCrown(ctx, k) {
  // k：1 正常戴着，>1 越大越夸张（第五幕盖住眼睛的大皇冠）
  ctx.save();
  ctx.translate(0, -HEAD_R + 4 + (k - 1) * 30);
  ctx.scale(k, k);
  ctx.fillStyle = '#FDB813';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6 / k;
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(-46, -46);
  ctx.lineTo(-22, -22);
  ctx.lineTo(0, -56);
  ctx.lineTo(22, -22);
  ctx.lineTo(46, -46);
  ctx.lineTo(40, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const x of [-46, 0, 46]) dot(ctx, x, x === 0 ? -58 : -48, 6, '#C15145');
  ctx.restore();
}

function drawProp(ctx, prop, hand, p) {
  const [x, y] = hand;
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  if (prop.type === 'mic') {
    ctx.rotate(rad(prop.angle ?? -20));
    ctx.fillStyle = '#3A3F4D';
    ctx.beginPath();
    ctx.roundRect(-7, -60, 14, 64, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#C9CFDD';
    ctx.beginPath();
    ctx.arc(0, -70, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (prop.type === 'paper') {
    // 演讲稿：shake 越大抖得越厉害
    const sh = prop.shake || 0;
    ctx.rotate(rad(-8 + Math.sin(p.t * 90) * 10 * sh));
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.rect(-6, -70, 66, 86);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) seg(ctx, [[4, -56 + i * 14], [50 - (i % 2) * 12, -56 + i * 14]], 3, '#9A948C');
    if (sh > 0.3) {
      // 抖动线
      for (const s of [-1, 1]) {
        seg(ctx, [[s > 0 ? 72 : -18, -60], [s > 0 ? 84 : -30, -50]], 4);
        seg(ctx, [[s > 0 ? 74 : -20, -30], [s > 0 ? 88 : -34, -26]], 4);
      }
    }
  } else if (prop.type === 'cup') {
    ctx.fillStyle = '#FDB813';
    ctx.beginPath();
    ctx.moveTo(-14, -40);
    ctx.lineTo(14, -40);
    ctx.lineTo(10, 4);
    ctx.lineTo(-10, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (prop.type === 'phone') {
    ctx.fillStyle = '#1E1A22';
    ctx.beginPath();
    ctx.roundRect(-14, -46, 28, 50, 6);
    ctx.fill();
    ctx.fillStyle = '#8FD3FF';
    ctx.fillRect(-9, -40, 18, 34);
  } else if (prop.type === 'camera') {
    ctx.fillStyle = '#3A3F4D';
    ctx.beginPath();
    ctx.roundRect(-30, -40, 60, 40, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#C9CFDD';
    ctx.beginPath();
    ctx.arc(0, -20, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// Tim 的四个阶段：一眼看出变化（姿态、发型、领带、墨镜）
export const TIM_STAGES = {
  before: { hair: 'messy', pack: true, hunch: 1, brows: 'worry', mouth: 'flat', sweat: 1, armL: { a: 8, b: 20 }, armR: { a: -8, b: -20 } },
  first: { hair: 'messy', hunch: 0.6, brows: 'worry', mouth: 'wobble', eyes: 'dot' },
  president: { hair: 'neat', hunch: 0.2, brows: 'flat', mouth: 'smile' },
  now: { hair: 'neat', tie: '#C15145', hunch: 0, mouth: 'grin', eyes: 'happy' },
};
export function tim(stage, o = {}) {
  return stick({ ...TIM_STAGES[stage], ...o });
}

// 伙伴：同一副身板，每人一个彩色小配件，方便认人
export const PALS = [
  { glasses: '#1E9BE9' },
  { cap: '#C15145' },
  { scarf: '#E8763A' },
  { headphones: '#B2C3F7' },
  { bow: '#FDB813' },
  { tie: '#1B355C' },
];
export function pal(i, o = {}) {
  return stick({ ...PALS[i % PALS.length], ...o });
}

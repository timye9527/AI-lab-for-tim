// 主角 Tim 的参数化角色：正面、侧面、手部特写共用同一套配色和比例
// 全片只用这一份定义，保证每个镜头里的 Tim 长得一样
// 坐标单位：脚底中心为原点，身高约 470，y 向下为正
import { clamp, lerp } from './util.js';

export const PAL = {
  skin: '#F1C6A0', skinShade: '#D59B78', skinDeep: '#B97B5E', blush: '#EE8F86',
  hair: '#1B1A22', hairHi: '#4A5274',
  jacket: '#E2A63A', jacketShade: '#B97D22', jacketDeep: '#8E5C16',
  tee: '#F4F0E7', jeans: '#2E3B5A', jeansShade: '#212A42',
  shoe: '#F3F2EE', sole: '#BFC3CC', pack: '#3B404C', packShade: '#2A2E37', zip: '#F2773A',
  eye: '#24191A', white: '#FFFFFF', mouth: '#6E2A2C', tongue: '#E07470', teeth: '#FFFDF8',
  sweat: '#BFE7FF',
};

// 默认姿态：略驼背、眼神有点躲
export function pose(o = {}) {
  return {
    x: 0, y: 0, s: 1, flip: 1, bob: 0, sq: 1, lean: 0, hunch: 0.6,
    tilt: 0, turn: 0, lookX: 0, lookY: 0, open: 1, pupil: 0.85, blink: 0,
    browY: 0, worry: 0.5, mouth: 'flat', mouthW: 1, mouthOpen: 0, smile: 0, wobble: 0,
    sweat: 0, sweatSlide: 0, blush: 0, spike: 0, cowlick: 0,
    armL: { a: 0.1, b: 0.12, hand: 'relax' }, armR: { a: 0.1, b: 0.12, hand: 'relax' },
    tremble: 0, t: 0, jump: 0, tuck: 0, spread: 0,
    // 侧面专用
    phase: 0, stride: 0, point: 0, lookBack: 0, dash: 0,
    ...o,
  };
}

const TAU = Math.PI * 2;
function ell(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU);
}
function stroke(ctx, color, w, pts, cap = 'round') {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = cap;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}
// 发抖：高频小幅度抖动
const shake = (t, f, seed) => Math.sin(t * f + seed) * 0.6 + Math.sin(t * f * 1.73 + seed * 2.1) * 0.4;

// ---------------- 头（正面） ----------------
function facePath(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.bezierCurveTo(34, -60, 52, -38, 52, -6);
  ctx.bezierCurveTo(52, 22, 40, 46, 22, 56);
  ctx.bezierCurveTo(12, 62, -12, 62, -22, 56);
  ctx.bezierCurveTo(-40, 46, -52, 22, -52, -6);
  ctx.bezierCurveTo(-52, -38, -34, -60, 0, -60);
  ctx.closePath();
}
// 刘海下沿（从右鬓角到左鬓角），turn 让刘海整体偏移
function hairPath(ctx, p) {
  const tx = p.turn * 6;
  const sp = p.spike;
  ctx.beginPath();
  ctx.moveTo(-56, -2);
  // 头顶：尖叫时炸成锯齿
  if (sp > 0.01) {
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + (i / n) * Math.PI;
      const r = 66 + (i % 2 ? 26 * sp : 0);
      ctx.lineTo(Math.cos(a) * (58 + (i % 2 ? 14 * sp : 0)), -8 + Math.sin(a) * r);
    }
  } else {
    ctx.bezierCurveTo(-62, -42, -38, -74, 2, -73);
    ctx.bezierCurveTo(42, -72, 62, -42, 56, -2);
  }
  // 刘海：向左扫的几缕
  const pts = [[56, -2], [47, -26], [37, -12], [27, -34], [15, -17], [3, -36], [-9, -21], [-21, -37], [-33, -24], [-44, -36], [-56, -2]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const yl = (v) => v - sp * 10; // 炸毛时刘海也往上翘
    ctx.quadraticCurveTo(x0 + tx, yl(y0), (x0 + x1) / 2 + tx, yl((y0 + y1) / 2));
  }
  ctx.closePath();
}

export function drawHeadFront(ctx, p) {
  const tx = p.turn * 13;
  // 耳朵
  for (const sgn of [-1, 1]) {
    const ex = sgn * (49 - sgn * p.turn * 5);
    ctx.fillStyle = PAL.skin;
    ell(ctx, ex, 4, 9, 14, sgn * 0.15);
    ctx.fill();
    ctx.fillStyle = PAL.skinShade;
    ell(ctx, ex + sgn * 1.5, 5, 4.5, 8, sgn * 0.15);
    ctx.fill();
  }
  // 脸
  ctx.fillStyle = PAL.skin;
  facePath(ctx);
  ctx.fill();
  // 刘海在额头上的阴影 + 下巴暗部
  ctx.save();
  facePath(ctx);
  ctx.clip();
  ctx.save();
  ctx.translate(2, 8);
  ctx.fillStyle = 'rgba(185,110,85,0.45)';
  hairPath(ctx, p);
  ctx.fill();
  ctx.restore();
  const vg = ctx.createRadialGradient(tx * 0.6 - 8, -4, 18, 0, 0, 64);
  vg.addColorStop(0, 'rgba(255,236,215,0.35)');
  vg.addColorStop(0.6, 'rgba(255,236,215,0)');
  vg.addColorStop(1, 'rgba(190,110,85,0.32)');
  ctx.fillStyle = vg;
  ctx.fillRect(-60, -70, 120, 140);
  const g = ctx.createLinearGradient(0, 20, 0, 62);
  g.addColorStop(0, 'rgba(200,120,90,0)');
  g.addColorStop(1, 'rgba(200,120,90,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(-60, 20, 120, 50);
  ctx.restore();

  // 腮红
  if (p.blush > 0) {
    ctx.fillStyle = `rgba(238,143,134,${0.55 * p.blush})`;
    for (const sgn of [-1, 1]) {
      ell(ctx, sgn * 31 + tx * 0.8, 24, 10, 6);
      ctx.fill();
    }
  }
  // 眼睛
  const open = Math.max(0, p.open * (1 - p.blink));
  for (const sgn of [-1, 1]) {
    const ex = sgn * 19 + tx;
    const ey = 5;
    const ry = 13 * open;
    if (ry < 2) {
      // 闭眼：一条弧线
      stroke(ctx, PAL.eye, 3.5, [[ex - 10, ey], [ex - 4, ey + 3], [ex + 4, ey + 3], [ex + 10, ey]]);
      continue;
    }
    const rx = 11 * (open > 1 ? 1 + (open - 1) * 0.5 : 1);
    ctx.fillStyle = PAL.white;
    ell(ctx, ex, ey, rx, ry);
    ctx.fill();
    ctx.save();
    ell(ctx, ex, ey, rx, ry);
    ctx.clip();
    const px = ex + p.lookX * 5;
    const py = ey + p.lookY * 4 + 1;
    ctx.fillStyle = PAL.eye;
    ell(ctx, px, py, 7.5 * p.pupil, 9 * p.pupil);
    ctx.fill();
    ctx.fillStyle = PAL.white;
    ell(ctx, px - 2.5 * p.pupil, py - 3.5 * p.pupil, 2.4 * Math.max(0.6, p.pupil), 2.4 * Math.max(0.6, p.pupil));
    ctx.fill();
    // 上眼睑阴影
    ctx.fillStyle = 'rgba(120,70,60,0.18)';
    ell(ctx, ex, ey - ry * 0.95, rx * 1.1, ry * 0.45);
    ctx.fill();
    ctx.restore();
    // 上眼线
    ctx.strokeStyle = PAL.eye;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(ex, ey, rx, ry, 0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }
  // 眉毛：worry 让内侧上扬
  for (const sgn of [-1, 1]) {
    const by = -16 - p.browY * 7 - (p.open > 1.2 ? 6 : 0);
    const outer = [sgn * 29 + tx, by + p.worry * 3];
    const inner = [sgn * 11 + tx, by - p.worry * 5];
    stroke(ctx, PAL.hair, 5.5, [outer, [lerp(outer[0], inner[0], 0.5), (outer[1] + inner[1]) / 2 - 2], inner]);
  }
  // 鼻子
  stroke(ctx, PAL.skinDeep, 3, [[tx * 1.15 - 3, 17], [tx * 1.15 + 1, 23], [tx * 1.15 + 5, 21]]);
  // 嘴
  drawMouth(ctx, p, tx * 1.05, 38);
  // 汗珠
  if (p.sweat > 0) {
    const sy = -26 + p.sweatSlide * 34;
    ctx.save();
    ctx.translate(47, sy);
    ctx.scale(p.sweat, p.sweat);
    ctx.fillStyle = PAL.sweat;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.bezierCurveTo(5, -4, 8, 1, 8, 5);
    ctx.arc(0, 5, 8, 0, Math.PI);
    ctx.bezierCurveTo(-8, 1, -5, -4, 0, -13);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ell(ctx, -2.5, 4, 2, 3);
    ctx.fill();
    ctx.restore();
  }
  // 头发
  ctx.fillStyle = PAL.hair;
  hairPath(ctx, p);
  ctx.fill();
  // 头发高光
  ctx.save();
  hairPath(ctx, p);
  ctx.clip();
  ctx.strokeStyle = PAL.hairHi;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(-4 + p.turn * 6, -36, 40, 26, 0, Math.PI * 1.15, Math.PI * 1.7);
  ctx.stroke();
  ctx.restore();
  // 呆毛：情绪指示器（-1 耷拉，1 竖起）
  drawCowlick(ctx, p, 6 + p.turn * 4, -71 - p.spike * 20);
}

function drawCowlick(ctx, p, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.35 - p.cowlick * 0.55 + Math.sin(p.t * 9) * 0.04 * (1 + p.tremble * 3));
  const up = 1 + Math.max(0, p.cowlick) * 0.35;
  ctx.fillStyle = PAL.hair;
  ctx.beginPath();
  ctx.moveTo(-5, 4);
  ctx.bezierCurveTo(-4, -18 * up, 10, -30 * up, 24, -26 * up + Math.max(0, -p.cowlick) * 22);
  ctx.bezierCurveTo(12, -22 * up, 4, -12 * up, 5, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMouth(ctx, p, x, y) {
  const w = 12 * p.mouthW;
  ctx.save();
  ctx.translate(x, y);
  if (p.mouth === 'scream') {
    const o = p.mouthOpen;
    ctx.fillStyle = PAL.mouth;
    ctx.beginPath();
    ctx.moveTo(-16, -6);
    ctx.quadraticCurveTo(0, -12, 16, -6);
    ctx.quadraticCurveTo(20, 10 + 18 * o, 0, 14 + 22 * o);
    ctx.quadraticCurveTo(-20, 10 + 18 * o, -16, -6);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = PAL.teeth;
    ctx.fillRect(-18, -12, 36, 7);
    ctx.fillStyle = PAL.tongue;
    ell(ctx, 0, 14 + 22 * o, 12, 9);
    ctx.fill();
    ctx.restore();
  } else if (p.mouth === 'o') {
    ctx.fillStyle = PAL.mouth;
    ell(ctx, 0, 2, 5 + 2 * p.mouthOpen, 4 + 7 * p.mouthOpen);
    ctx.fill();
  } else if (p.mouth === 'gulp') {
    // 抿嘴 + 鼓腮
    stroke(ctx, PAL.mouth, 3.2, [[-7, 0], [-3, 2], [3, 0], [7, 2]]);
  } else {
    // flat / smile / awk：smile 控制弧度，wobble 让嘴角发颤（尴尬笑）
    const pts = [];
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const xx = (u - 0.5) * 2 * w * (1 + p.smile * 0.3);
      const curve = -p.smile * 7 * (1 - Math.pow((u - 0.5) * 2, 2)) * -1;
      const wob = p.wobble * 2.2 * Math.sin(u * Math.PI * 3 + p.t * 30);
      const lift = p.smile * 4 * Math.pow((u - 0.5) * 2, 2);
      pts.push([xx, curve - lift + wob]);
    }
    if (p.mouthOpen > 0.05) {
      ctx.fillStyle = PAL.mouth;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const q of pts) ctx.lineTo(q[0], q[1]);
      for (let i = n; i >= 0; i--) ctx.lineTo(pts[i][0] * 0.8, pts[i][1] + 10 * p.mouthOpen * Math.sin((i / n) * Math.PI));
      ctx.fill();
    }
    stroke(ctx, PAL.mouth, 3.4, pts);
  }
  ctx.restore();
}

// ---------------- 手 ----------------
function drawHandSmall(ctx, x, y, ang, type, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(scale, scale);
  ctx.fillStyle = PAL.skin;
  if (type === 'open') {
    // 张开五指（尖叫时）
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.roundRect(-3.2, 4, 6.4, 18 - Math.abs(i - 2) * 2, 3.2);
      ctx.fill();
      ctx.restore();
    }
    ell(ctx, 0, 6, 12, 11);
    ctx.fill();
  } else if (type === 'point') {
    ell(ctx, 0, 6, 11, 11);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-3.6, 8, 7.2, 24, 3.6);
    ctx.fill();
  } else {
    ell(ctx, 0, 7, 11, 13);
    ctx.fill();
    ctx.fillStyle = PAL.skinShade;
    ell(ctx, 3, 12, 6, 6);
    ctx.fill();
  }
  ctx.restore();
}

// 正面的手臂：a 是大臂离开竖直向下的角度（向外为正），b 是小臂相对大臂的弯曲
function armFront(ctx, sx, sy, sgn, arm, p) {
  const tr = p.tremble * shake(p.t, 70, sgn * 3) * 0.08;
  const a = arm.a + tr;
  const b = arm.b + tr * 1.5;
  const L1 = 68;
  const L2 = 62;
  const ex = sx + sgn * Math.sin(a) * L1;
  const ey = sy + Math.cos(a) * L1;
  const wx = ex + sgn * Math.sin(a + b) * L2;
  const wy = ey + Math.cos(a + b) * L2;
  // 衣袖
  stroke(ctx, PAL.jacketShade, 27, [[sx, sy], [ex, ey], [wx, wy]]);
  stroke(ctx, PAL.jacket, 23, [[sx, sy], [ex, ey], [lerp(ex, wx, 0.86), lerp(ey, wy, 0.86)]]);
  // 袖口罗纹
  stroke(ctx, PAL.jacketDeep, 20, [[lerp(ex, wx, 0.84), lerp(ey, wy, 0.84)], [lerp(ex, wx, 0.96), lerp(ey, wy, 0.96)]], 'butt');
  const ang = Math.atan2(wy - ey, wx - ex) - Math.PI / 2;
  drawHandSmall(ctx, wx, wy, ang, arm.hand);
}

// ---------------- 全身（正面） ----------------
export function drawTimFront(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.s * p.flip, p.s);
  const jy = -p.jump * 120;
  const tuck = p.tuck;
  // 腿
  const hipY = -190 + tuck * 40 + jy;
  for (const sgn of [-1, 1]) {
    const hx = sgn * 18;
    const fx = sgn * (22 + p.spread * 18 + tuck * 10);
    const fy = -14 + jy - tuck * 30;
    const kx = (hx + fx) / 2 + sgn * tuck * 26;
    const ky = (hipY + fy) / 2 - tuck * 6;
    stroke(ctx, PAL.jeansShade, 36, [[hx, hipY], [kx, ky], [fx, fy]]);
    stroke(ctx, PAL.jeans, 31, [[hx - sgn * 1.5, hipY], [kx - sgn * 1.5, ky], [fx - sgn * 1.5, fy - 4]]);
    // 鞋
    ctx.fillStyle = PAL.sole;
    ctx.beginPath();
    ctx.roundRect(fx - 24 + sgn * 4, fy - 4, 48, 18, 9);
    ctx.fill();
    ctx.fillStyle = PAL.shoe;
    ctx.beginPath();
    ctx.roundRect(fx - 23 + sgn * 4, fy - 12, 46, 20, [12, 12, 6, 6]);
    ctx.fill();
  }
  // 上半身：绕胯部旋转（lean），驼背让肩膀上耸、头往前低
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(p.lean + p.tremble * shake(p.t, 40, 1) * 0.008);
  ctx.scale(1 / p.sq ** 0.5, p.sq);
  const shY = -128 + p.hunch * 6;
  // 背包肩带后面的包身（从两侧露一点）
  ctx.fillStyle = PAL.packShade;
  ctx.beginPath();
  ctx.roundRect(-70, shY + 14, 140, 100, 24);
  ctx.fill();
  // 躯干（外套）
  ctx.fillStyle = PAL.jacket;
  ctx.beginPath();
  ctx.moveTo(-50, shY + 2);
  ctx.quadraticCurveTo(-64, shY + 4, -64, shY + 22);
  ctx.lineTo(-58, -4);
  ctx.quadraticCurveTo(-56, 6, -44, 6);
  ctx.lineTo(44, 6);
  ctx.quadraticCurveTo(56, 6, 58, -4);
  ctx.lineTo(64, shY + 22);
  ctx.quadraticCurveTo(64, shY + 4, 50, shY + 2);
  ctx.quadraticCurveTo(0, shY - 10, -50, shY + 2);
  ctx.fill();
  // 敞开的拉链露出白 T
  ctx.fillStyle = PAL.tee;
  ctx.beginPath();
  ctx.moveTo(-14, shY - 2);
  ctx.lineTo(14, shY - 2);
  ctx.lineTo(9, 2);
  ctx.lineTo(-9, 2);
  ctx.fill();
  stroke(ctx, PAL.jacketDeep, 3, [[-13, shY], [-9, 2]]);
  stroke(ctx, PAL.jacketDeep, 3, [[13, shY], [9, 2]]);
  // 下摆罗纹
  ctx.fillStyle = PAL.jacketShade;
  ctx.fillRect(-58, -10, 116, 16);
  ctx.fillStyle = PAL.tee;
  ctx.fillRect(-9, -10, 18, 16);
  // 领口
  ctx.fillStyle = PAL.jacketShade;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sgn * 14, shY - 2);
    ctx.lineTo(sgn * 34, shY + 2);
    ctx.lineTo(sgn * 18, shY + 26);
    ctx.fill();
  }
  // 背包肩带
  for (const sgn of [-1, 1]) {
    stroke(ctx, PAL.pack, 13, [[sgn * 40, shY + 1], [sgn * 37, shY + 50], [sgn * 33, shY + 92]], 'butt');
    ctx.fillStyle = '#20232A';
    ctx.fillRect(sgn * 35 - 8, shY + 52, 16, 8);
  }
  // 拉链头
  ctx.fillStyle = PAL.zip;
  ctx.fillRect(-46, shY + 92, 8, 12);
  // 脖子
  const neckY = shY - 8 + p.hunch * 6;
  ctx.fillStyle = PAL.skinShade;
  ctx.fillRect(-11, neckY - 18, 22, 26);
  // 手臂
  if (!p.hideR) armFront(ctx, -58, shY + 14, -1, p.armR, p);
  armFront(ctx, 58, shY + 14, 1, p.armL, p);
  // 头
  ctx.save();
  ctx.translate(0, neckY - 74 + p.hunch * 8 + p.bob);
  ctx.rotate(p.tilt + p.tremble * shake(p.t, 55, 2) * 0.01);
  // 下巴投在脖子上的阴影
  ctx.fillStyle = 'rgba(185,123,94,0.55)';
  ell(ctx, 0, 60, 16, 8);
  ctx.fill();
  drawHeadFront(ctx, p);
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

// ---------------- 侧面（朝 +x） ----------------
function headSidePath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-6, -62);
  ctx.bezierCurveTo(30, -64, 48, -40, 48, -14);
  ctx.lineTo(50, -3);
  ctx.bezierCurveTo(57, 4, 59, 11, 52, 14);
  ctx.bezierCurveTo(49, 16, 48, 19, 48, 23);
  ctx.bezierCurveTo(48, 31, 46, 37, 43, 41);
  ctx.bezierCurveTo(40, 51, 33, 60, 18, 62);
  ctx.bezierCurveTo(2, 64, -10, 56, -16, 46);
  ctx.bezierCurveTo(-40, 40, -54, 14, -52, -14);
  ctx.bezierCurveTo(-50, -44, -30, -62, -6, -62);
  ctx.closePath();
}
function hairSidePath(ctx, p) {
  ctx.beginPath();
  ctx.moveTo(51, -20);
  ctx.quadraticCurveTo(54, -52, 22, -67);
  ctx.bezierCurveTo(-12, -78, -52, -58, -57, -16);
  ctx.bezierCurveTo(-59, 4, -52, 22, -42, 30);
  ctx.lineTo(-30, 24);
  ctx.bezierCurveTo(-30, 8, -22, -6, -8, -10);
  ctx.lineTo(4, -21);
  ctx.quadraticCurveTo(16, -30, 27, -24);
  ctx.quadraticCurveTo(35, -35, 41, -26);
  ctx.quadraticCurveTo(47, -31, 51, -20);
  ctx.closePath();
  void p;
}
export function drawHeadSide(ctx, p) {
  ctx.fillStyle = PAL.skin;
  headSidePath(ctx);
  ctx.fill();
  ctx.save();
  headSidePath(ctx);
  ctx.clip();
  ctx.save();
  ctx.translate(3, 7);
  ctx.fillStyle = 'rgba(185,110,85,0.45)';
  hairSidePath(ctx, p);
  ctx.fill();
  ctx.restore();
  ctx.restore();
  // 耳朵
  ctx.fillStyle = PAL.skin;
  ell(ctx, -8, 4, 9, 13, -0.1);
  ctx.fill();
  ctx.fillStyle = PAL.skinShade;
  ell(ctx, -7, 5, 4.5, 8, -0.1);
  ctx.fill();
  if (p.blush > 0) {
    ctx.fillStyle = `rgba(238,143,134,${0.55 * p.blush})`;
    ell(ctx, 24, 22, 10, 6);
    ctx.fill();
  }
  // 眼睛
  const open = Math.max(0, p.open * (1 - p.blink));
  if (open * 10 < 2) {
    stroke(ctx, PAL.eye, 3.4, [[27, -2], [32, 1], [37, -1]]);
  } else {
    ctx.fillStyle = PAL.white;
    ell(ctx, 33, -3, 6.5, 10 * open);
    ctx.fill();
    ctx.fillStyle = PAL.eye;
    ell(ctx, 35 + p.lookX * 1.5, -2 + p.lookY * 2, 5 * p.pupil, 7.5 * p.pupil);
    ctx.fill();
    ctx.fillStyle = PAL.white;
    ell(ctx, 34, -5, 1.8, 1.8);
    ctx.fill();
    stroke(ctx, PAL.eye, 3, [[27, -3 - 9 * open], [34, -4 - 10.5 * open], [39, -1 - 9 * open]]);
  }
  // 眉毛
  const by = -18 - p.browY * 7;
  stroke(ctx, PAL.hair, 5, [[26, by + p.worry * 1], [38, by - p.worry * 4]]);
  // 嘴
  const sm = p.smile;
  const wob = p.wobble * 1.8 * Math.sin(p.t * 30);
  if (p.mouth === 'scream') {
    ctx.fillStyle = PAL.mouth;
    ell(ctx, 40, 36, 8, 12);
    ctx.fill();
  } else {
    stroke(ctx, PAL.mouth, 3.2, [[33, 35 - sm * 4 + wob], [38, 36 + wob * -1], [43, 33 + sm * 1]]);
  }
  if (p.sweat > 0) {
    ctx.save();
    ctx.translate(-26, -30 + p.sweatSlide * 30);
    ctx.scale(p.sweat, p.sweat);
    ctx.fillStyle = PAL.sweat;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.bezierCurveTo(5, -4, 7, 1, 7, 4);
    ctx.arc(0, 4, 7, 0, Math.PI);
    ctx.bezierCurveTo(-7, 1, -5, -4, 0, -12);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = PAL.hair;
  hairSidePath(ctx, p);
  ctx.fill();
  ctx.save();
  hairSidePath(ctx, p);
  ctx.clip();
  ctx.strokeStyle = PAL.hairHi;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(-2, -30, 40, 28, 0, Math.PI * 1.1, Math.PI * 1.65);
  ctx.stroke();
  ctx.restore();
  drawCowlick(ctx, p, -4, -70);
}

// 侧面走路：phase 是步态相位，stride 是步幅（0 站立，1 走，1.6 小跑）
function legSide(ctx, hip, ph, stride, far, p) {
  const A = 0.42 * stride;
  const th1 = A * Math.sin(ph);
  const flex = (0.9 * stride + p.tuck) * Math.pow(Math.max(0, Math.cos(ph)), 1.4) + p.tuck * 0.6;
  const th2 = th1 - flex;
  const L1 = 96;
  const L2 = 92;
  const kx = hip[0] + Math.sin(th1) * L1;
  const ky = hip[1] + Math.cos(th1) * L1;
  const ax = kx + Math.sin(th2) * L2;
  const ay = ky + Math.cos(th2) * L2;
  const c = far ? PAL.jeansShade : PAL.jeans;
  stroke(ctx, far ? '#1A2134' : PAL.jeansShade, 34, [hip, [kx, ky], [ax, ay]]);
  stroke(ctx, c, 29, [[hip[0] + 1, hip[1]], [kx + 1, ky], [ax + 1, ay - 2]]);
  // 鞋：脚尖朝前
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(Math.max(-0.5, Math.min(0.6, -th2 * 0.6 + (flex > 0.3 ? 0.25 : 0))));
  ctx.fillStyle = far ? '#A9ADB6' : PAL.sole;
  ctx.beginPath();
  ctx.roundRect(-14, 6, 52, 12, 6);
  ctx.fill();
  ctx.fillStyle = far ? '#D5D6D8' : PAL.shoe;
  ctx.beginPath();
  ctx.roundRect(-15, -8, 50, 20, [8, 14, 6, 6]);
  ctx.fill();
  ctx.restore();
}

function armSide(ctx, sh, ang, bend, far, hand, p) {
  const tr = p.tremble * shake(p.t, 70, far ? 5 : 2) * 0.06;
  const a1 = ang + tr;
  const a2 = a1 + bend;
  const L1 = 68;
  const L2 = 62;
  // 角度 0 竖直向下，正值朝前（+x）
  const ex = sh[0] + Math.sin(a1) * L1;
  const ey = sh[1] + Math.cos(a1) * L1;
  const wx = ex + Math.sin(a2) * L2;
  const wy = ey + Math.cos(a2) * L2;
  stroke(ctx, far ? PAL.jacketDeep : PAL.jacketShade, 26, [sh, [ex, ey], [wx, wy]]);
  stroke(ctx, far ? PAL.jacketShade : PAL.jacket, 22, [sh, [ex, ey], [lerp(ex, wx, 0.86), lerp(ey, wy, 0.86)]]);
  stroke(ctx, PAL.jacketDeep, 20, [[lerp(ex, wx, 0.84), lerp(ey, wy, 0.84)], [lerp(ex, wx, 0.96), lerp(ey, wy, 0.96)]], 'butt');
  const hang = Math.atan2(wy - ey, wx - ex) - Math.PI / 2;
  if (far) ctx.filter = 'brightness(0.8)';
  drawHandSmall(ctx, wx, wy, hang, hand);
  ctx.filter = 'none';
  return [wx, wy];
}

export function drawTimSide(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.s * p.flip, p.s);
  const st = p.stride;
  const ph = p.phase;
  const bounce = -Math.abs(Math.cos(ph)) * 8 * st + 4 * st;
  const jy = -p.jump * 120;
  const hip = [0, -190 + bounce + jy + p.tuck * 30];
  const lean = p.lean + p.dash * 0.22;
  // 远侧腿、远侧手臂
  legSide(ctx, [hip[0] - 4, hip[1]], ph + Math.PI, st, true, p);
  ctx.save();
  ctx.translate(hip[0], hip[1]);
  ctx.rotate(lean);
  const shY = -126 + p.hunch * 6;
  const shX = 6 + p.hunch * 10;
  const swing = 0.55 * st;
  armSide(ctx, [shX - 4, shY + 12], -swing * Math.sin(ph + Math.PI) - p.dash * 0.4, 0.35 + p.dash * 1.0, true, 'relax', p);
  ctx.restore();
  // 近侧腿
  legSide(ctx, hip, ph, st, false, p);
  // 躯干
  ctx.save();
  ctx.translate(hip[0], hip[1]);
  ctx.rotate(lean);
  // 外套（侧面）：驼背时背部更圆
  ctx.fillStyle = PAL.jacket;
  ctx.beginPath();
  ctx.moveTo(-26, 6);
  ctx.lineTo(28, 6);
  ctx.quadraticCurveTo(34, -50, 30 + p.hunch * 6, shY + 16);
  ctx.quadraticCurveTo(26 + p.hunch * 8, shY - 4, shX, shY - 4);
  ctx.quadraticCurveTo(-26 - p.hunch * 10, shY - 2, -30 - p.hunch * 6, shY + 26);
  ctx.quadraticCurveTo(-34, -50, -26, 6);
  ctx.fill();
  ctx.fillStyle = PAL.jacketShade;
  ctx.fillRect(-28, -10, 58, 16);
  stroke(ctx, PAL.jacketDeep, 3, [[30, -8], [30 + p.hunch * 4, shY + 20]]);
  // 背包
  ctx.fillStyle = PAL.packShade;
  ctx.beginPath();
  ctx.roundRect(-74 - p.hunch * 6, shY + 6, 52, 122, 20);
  ctx.fill();
  ctx.fillStyle = PAL.pack;
  ctx.beginPath();
  ctx.roundRect(-70 - p.hunch * 6, shY + 4, 46, 118, 18);
  ctx.fill();
  ctx.fillStyle = PAL.packShade;
  ctx.beginPath();
  ctx.roundRect(-80 - p.hunch * 6, shY + 56, 20, 56, 9);
  ctx.fill();
  // 拉链头（橙色，随走路晃）
  ctx.save();
  ctx.translate(-72 - p.hunch * 6, shY + 60);
  ctx.rotate(Math.sin(ph * 2) * 0.4 * st + p.dash * 0.6);
  ctx.fillStyle = PAL.zip;
  ctx.fillRect(-3, 0, 6, 16);
  ctx.restore();
  // 肩带
  stroke(ctx, PAL.pack, 11, [[-24, shY + 4], [shX + 2, shY + 2], [shX + 16, shY + 40], [18, shY + 96]], 'butt');
  // 脖子 + 头
  ctx.fillStyle = PAL.skinShade;
  ctx.fillRect(shX - 4, shY - 24, 20, 30);
  ctx.save();
  ctx.translate(shX + 10 + p.hunch * 10, shY - 76 + p.hunch * 8 + p.bob);
  ctx.rotate(p.tilt + p.dash * 0.1);
  if (p.lookBack > 0.5) ctx.scale(-1, 1);
  drawHeadSide(ctx, p);
  ctx.restore();
  // 近侧手臂（指向时抬起）
  const ptA = lerp(-swing * Math.sin(ph) - p.dash * 0.5, 1.6, p.point);
  const ptB = lerp(0.3 + p.dash * 1.1 + 0.25 * st * Math.max(0, -Math.sin(ph)), 0.05, p.point);
  armSide(ctx, [shX, shY + 12], ptA, ptB, false, p.point > 0.5 ? 'point' : 'relax', p);
  ctx.restore();
  ctx.restore();
}

// ---------------- 手部特写（朝 +x，手腕在原点） ----------------
// press：指尖弯曲程度；curl 0..1 手指缩回
export function drawHandCU(ctx, h) {
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.rot || 0);
  ctx.scale(h.s, h.s);
  // 外套袖子 + 罗纹袖口
  ctx.fillStyle = PAL.jacketShade;
  ctx.beginPath();
  ctx.moveTo(-620, -120);
  ctx.lineTo(-40, -82);
  ctx.quadraticCurveTo(-18, -10, -40, 78);
  ctx.lineTo(-620, 140);
  ctx.fill();
  ctx.fillStyle = PAL.jacket;
  ctx.beginPath();
  ctx.moveTo(-620, -112);
  ctx.lineTo(-80, -86);
  ctx.quadraticCurveTo(-60, -10, -80, 74);
  ctx.lineTo(-620, 100);
  ctx.fill();
  // 罗纹
  ctx.fillStyle = PAL.jacketDeep;
  ctx.beginPath();
  ctx.roundRect(-92, -86, 62, 166, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-86 + i * 10, -80);
    ctx.lineTo(-86 + i * 10, 74);
    ctx.stroke();
  }
  // 手背
  const fx = 1 - (h.curl || 0) * 0.5;
  ctx.fillStyle = PAL.skin;
  ctx.beginPath();
  ctx.moveTo(-36, -64);
  ctx.bezierCurveTo(20, -78, 80, -60, 98, -38);
  ctx.bezierCurveTo(112, -12, 104, 40, 70, 60);
  ctx.bezierCurveTo(30, 82, -20, 72, -36, 56);
  ctx.closePath();
  ctx.fill();
  // 弯曲的三根手指（握拳部分）
  ctx.fillStyle = PAL.skin;
  for (let i = 0; i < 3; i++) {
    ell(ctx, 96 - i * 6, 2 + i * 22, 22, 13, 0.15);
    ctx.fill();
  }
  ctx.strokeStyle = PAL.skinShade;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(96 - i * 6, 2 + i * 22, 20, -0.4, 1.3);
    ctx.stroke();
  }
  // 食指：发抖、可以弯一点
  const pr = h.press || 0;
  ctx.save();
  ctx.translate(92, -40);
  ctx.rotate(pr * 0.2);
  const len = 150 * fx;
  ctx.fillStyle = PAL.skin;
  ctx.beginPath();
  ctx.roundRect(-14, -19, len + 14, 38, 19);
  ctx.fill();
  // 指甲
  ctx.fillStyle = '#F7D9CB';
  ctx.beginPath();
  ctx.roundRect(len - 36, -19, 30, 14, 7);
  ctx.fill();
  // 指节纹路
  ctx.strokeStyle = PAL.skinShade;
  ctx.lineWidth = 2.5;
  for (const k of [0.35, 0.68]) {
    ctx.beginPath();
    ctx.moveTo(len * k, -12);
    ctx.quadraticCurveTo(len * k + 4, 0, len * k, 10);
    ctx.stroke();
  }
  // 指腹暗部
  ctx.fillStyle = 'rgba(190,120,95,0.35)';
  ctx.beginPath();
  ctx.roundRect(-10, 6, len + 6, 13, 7);
  ctx.fill();
  ctx.restore();
  // 大拇指
  ctx.fillStyle = PAL.skin;
  ctx.beginPath();
  ctx.moveTo(10, -50);
  ctx.bezierCurveTo(40, -40, 76, -30, 84, -16);
  ctx.bezierCurveTo(88, -6, 76, 0, 64, -2);
  ctx.bezierCurveTo(40, -6, 16, -16, 4, -26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PAL.skinShade;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, -30);
  ctx.bezierCurveTo(50, -20, 70, -12, 80, -14);
  ctx.stroke();
  // 手背指节
  ctx.fillStyle = 'rgba(190,120,95,0.25)';
  for (let i = 0; i < 3; i++) {
    ell(ctx, 70 - i * 4, -44 + i * 3, 8, 5);
    ctx.fill();
  }
  ctx.restore();
}

// 正面指向镜头的手（前景，会加景深模糊）：R 为指尖半径，(sx, sy) 为肩膀
export function drawFingerAtCam(ctx, x, y, R, sx, sy) {
  const fx = x - R * 1.05;
  const fy = y + R * 1.1;
  // 袖子：从肩膀伸过来，越近越粗
  const dx = fx - sx;
  const dy = fy - sy;
  const n = Math.hypot(dx, dy) || 1;
  const nx = -dy / n;
  const ny = dx / n;
  const r0 = 30;
  const r1 = R * 1.25;
  const ex = fx - dx * 0.12;
  const ey = fy - dy * 0.12;
  ctx.fillStyle = PAL.jacket;
  ctx.beginPath();
  ctx.moveTo(sx + nx * r0, sy + ny * r0);
  ctx.lineTo(ex + nx * r1, ey + ny * r1);
  ctx.lineTo(ex - nx * r1, ey - ny * r1);
  ctx.lineTo(sx - nx * r0, sy - ny * r0);
  ctx.fill();
  ctx.fillStyle = PAL.jacketDeep;
  ell(ctx, ex, ey, r1, r1 * 0.55, Math.atan2(ny, nx));
  ctx.fill();
  // 拳头：圆角方块 + 三道弯曲的手指
  ctx.save();
  ctx.translate(fx, fy);
  ctx.rotate(-0.5);
  ctx.fillStyle = PAL.skinShade;
  ctx.beginPath();
  ctx.roundRect(-R * 1.05, -R * 0.85, R * 2.1, R * 1.9, R * 0.6);
  ctx.fill();
  ctx.fillStyle = PAL.skin;
  ctx.beginPath();
  ctx.roundRect(-R * 1.0, -R * 0.9, R * 2.0, R * 1.75, R * 0.55);
  ctx.fill();
  ctx.strokeStyle = PAL.skinDeep;
  ctx.lineWidth = Math.max(2, R * 0.06);
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const yy = -R * 0.15 + i * R * 0.36;
    ctx.beginPath();
    ctx.moveTo(-R * 0.75, yy);
    ctx.quadraticCurveTo(-R * 0.1, yy + R * 0.12, R * 0.55, yy);
    ctx.stroke();
  }
  // 大拇指压在弯曲的手指上
  ctx.fillStyle = PAL.skin;
  ctx.beginPath();
  ctx.roundRect(-R * 0.9, -R * 0.55, R * 1.3, R * 0.42, R * 0.21);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // 食指：透视缩短的圆柱，指尖最大
  const bx = fx + R * 0.35;
  const by = fy - R * 0.55;
  const ang = Math.atan2(y - by, x - bx);
  const px = -Math.sin(ang);
  const py = Math.cos(ang);
  const rb = R * 0.55;
  ctx.fillStyle = PAL.skinShade;
  ctx.beginPath();
  ctx.moveTo(bx + px * rb, by + py * rb);
  ctx.lineTo(x + px * R, y + py * R);
  ctx.lineTo(x - px * R, y - py * R);
  ctx.lineTo(bx - px * rb, by - py * rb);
  ctx.fill();
  const g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.35, R * 0.1, x, y, R * 1.05);
  g.addColorStop(0, '#FCDCC2');
  g.addColorStop(0.7, PAL.skin);
  g.addColorStop(1, PAL.skinShade);
  ctx.fillStyle = g;
  ell(ctx, x, y, R, R);
  ctx.fill();
  // 指甲在指尖上方
  ctx.fillStyle = '#F8DDD0';
  ell(ctx, x + Math.cos(ang) * -R * 0.05, y - R * 0.55, R * 0.55, R * 0.3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(185,123,94,0.6)';
  ctx.lineWidth = Math.max(1.5, R * 0.04);
  ctx.stroke();
}

export { clamp };

// 第三版关键帧：火柴人 + 俱乐部配色。门口和片尾沿用第二版背景，舞台和展厅会议室是新的
import { drawStick, tim, pal, INK } from './stick.js';
import { K, sparkle, eoeLogo, outline, rect, glow, subtitle, grain, frameDoor, frameWarm } from '../v2/frames.js';

const W = 1080;
const H = 1920;
const SANS = '"Noto Sans SC", sans-serif';

// 抖动线：角色身边的「)))」
export function shakeMarks(ctx, x, y, h, s = 1) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const xx = x + side * (60 + i * 18) * s;
      ctx.beginPath();
      ctx.arc(xx - side * 40 * s, y, 40 * s, side > 0 ? -0.5 : Math.PI - 0.5, side > 0 ? 0.5 : Math.PI + 0.5);
      ctx.stroke();
    }
  }
  void h;
}
export function notes(ctx, pts) {
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  for (const [x, y, s] of pts) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 10, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12, -4);
    ctx.lineTo(12, -54);
    ctx.lineTo(34, -44);
    ctx.stroke();
    ctx.restore();
  }
}
function clapMarks(ctx, x, y) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const a of [-2.2, -1.57, -0.9]) {
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26);
    ctx.lineTo(x + Math.cos(a) * 44, y + Math.sin(a) * 44);
    ctx.stroke();
  }
}

export function audience(ctx, t, clapping) {
  for (let i = 0; i < 6; i++) {
    const x = 90 + i * 180;
    const y = 1800 + (i % 2) * 30 + Math.sin(t * 3 + i) * 4;
    ctx.fillStyle = K.cream;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(x, y, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const up = clapping ? true : i % 2 === 0;
    if (up) {
      const k = clapping ? Math.abs(Math.sin(t * 18 + i)) : 0.6;
      ctx.beginPath();
      ctx.moveTo(x + 40, y + 40);
      ctx.lineTo(x + 60 + k * 10, y - 110);
      ctx.moveTo(x - 40, y + 40);
      if (clapping) ctx.lineTo(x + 40 - k * 10, y - 110);
      ctx.stroke();
      if (clapping && k > 0.7) clapMarks(ctx, x + 50, y - 125);
      if (!clapping) clapMarks(ctx, x + 72, y - 120);
    }
  }
}

// ---------------- 1 门前：火柴人 Tim ----------------
export function doorStick(ctx) {
  frameDoor(ctx, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(760, 1588, 120, 18, 0, 0, Math.PI * 2);
    c.fill();
    const s = 1.25;
    // 手指伸向密码锁（身体局部坐标）
    const target = [(512 - 760) / s, (935 - 1588) / s + 0];
    drawStick(c, tim('before', { x: 760, y: 1588, s, face: -1, t: 0.21, tremble: 0.6, armR: { to: target, bend: -1 }, armL: { a: 10, b: 30 } }));
    shakeMarks(c, 760, 1060, 0, 0.9);
  });
  subtitle(ctx, '两年前，Tim 第一次来到 EOE。');
}

// ---------------- 2 第一次上台：稿子抖得比声音还响 ----------------
export function stageBG(ctx) {
  ctx.fillStyle = '#2A1416';
  ctx.fillRect(0, 0, W, H);
  // 红幕
  for (let i = 0; i < 9; i++) {
    const x = i * 130 - 40;
    const g = ctx.createLinearGradient(x, 0, x + 130, 0);
    g.addColorStop(0, K.redDeep);
    g.addColorStop(0.5, K.red);
    g.addColorStop(1, K.redDeep);
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 132, 1380);
  }
  outline(ctx, new Path2D('M -20,-20 L 1100,-20 L 1100,170 Q 980,230 860,170 Q 740,230 620,170 Q 500,230 380,170 Q 260,230 140,170 Q 60,215 -20,170 Z'), K.redDeep, 6);
  // 舞台
  outline(ctx, rect(-20, 1360, W + 40, 120), '#7A4A2E', 6);
  outline(ctx, rect(-20, 1470, W + 40, 500), '#1A1012', 0.01);
  // 聚光灯
  const cone = ctx.createLinearGradient(0, 0, 0, 1400);
  cone.addColorStop(0, 'rgba(250,243,215,0.55)');
  cone.addColorStop(1, 'rgba(250,243,215,0.25)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(470, -10);
  ctx.lineTo(610, -10);
  ctx.lineTo(820, 1400);
  ctx.lineTo(260, 1400);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(250,243,215,0.5)';
  ctx.beginPath();
  ctx.ellipse(540, 1400, 290, 46, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function stageFirst(ctx) {
  stageBG(ctx);
  // 发抖的 Tim：膝盖内扣，稿子狂抖
  drawStick(ctx, tim('first', {
    x: 540, y: 1400, s: 1.45, t: 0.37, tremble: 1, sweat: 1, eyes: 'shock', brows: 'worry', mouth: 'wobble',
    armL: { to: [20, -330], bend: 1 }, armR: { to: [-24, -322], bend: -1 },
    prop: { type: 'paper', hand: 'L', shake: 1 },
    legL: { a: 6, b: -22 }, legR: { a: -6, b: 22 },
  }));
  shakeMarks(ctx, 540, 1180, 0, 1.2);
  ctx.fillStyle = K.cream;
  ctx.font = `900 64px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(250, 560);
  ctx.rotate(-0.15);
  ctx.fillText('抖', 0, 0);
  ctx.restore();
  ctx.save();
  ctx.translate(840, 520);
  ctx.rotate(0.15);
  ctx.fillText('抖', 0, 0);
  ctx.restore();
  audience(ctx, 0, false);
  subtitle(ctx, '第一次上台，稿子抖得比声音还响。', 1560);
  grain(ctx, 0.05);
}

// ---------------- 3 后来：高端展厅会议室里，松弛到唱跳 ----------------
function car(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const body = new Path2D('M -300,40 L -300,0 Q -290,-30 -230,-40 L -140,-50 Q -80,-110 20,-112 Q 120,-112 190,-56 L 270,-44 Q 310,-36 310,0 L 310,40 Z');
  outline(ctx, body, '#2F3A52', 6);
  outline(ctx, new Path2D('M -120,-52 Q -70,-98 10,-100 L 14,-52 Z'), '#9FB3D9', 5);
  outline(ctx, new Path2D('M 34,-100 Q 110,-98 170,-54 L 34,-52 Z'), '#9FB3D9', 5);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-260, -14);
  ctx.lineTo(280, -14);
  ctx.stroke();
  for (const wx of [-170, 190]) {
    outline(ctx, new Path2D(`M ${wx},40 m -52,0 a 52,52 0 1,0 104,0 a 52,52 0 1,0 -104,0`), INK, 5);
    outline(ctx, new Path2D(`M ${wx},40 m -26,0 a 26,26 0 1,0 52,0 a 26,26 0 1,0 -52,0`), '#C9CFDD', 4);
  }
  ctx.restore();
}

export function showroomBG(ctx) {
  // 墙
  const wall = ctx.createLinearGradient(0, 0, 0, 1400);
  wall.addColorStop(0, '#E9E2D2');
  wall.addColorStop(1, '#D8CEB8');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);
  // 天花板 + 线形吊灯
  outline(ctx, rect(-20, -20, W + 40, 170), '#2B2F3A', 0.01);
  for (const x of [120, 420, 720]) {
    ctx.strokeStyle = '#1E1A22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 120, 150);
    ctx.lineTo(x + 120, 230);
    ctx.stroke();
    outline(ctx, rect(x, 228, 240, 14, 7), '#F7F1E0', 4);
    glow(ctx, x + 120, 250, 220, '255,236,190', 0.35);
  }
  // 玻璃墙：外面是展厅，停着一辆车
  outline(ctx, rect(60, 330, 960, 640, 6), '#DCE5FA', 6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(60, 330, 960, 640);
  ctx.clip();
  ctx.fillStyle = '#C9D4EE';
  ctx.fillRect(60, 790, 960, 180);
  car(ctx, 560, 820, 1.25);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (const x of [140, 600]) {
    ctx.beginPath();
    ctx.moveTo(x, 330);
    ctx.lineTo(x + 90, 330);
    ctx.lineTo(x - 110, 970);
    ctx.lineTo(x - 200, 970);
    ctx.fill();
  }
  ctx.restore();
  for (const x of [380, 700]) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, 330);
    ctx.lineTo(x, 970);
    ctx.stroke();
  }
  // 地板：亮面，有倒影
  outline(ctx, rect(-20, 1050, W + 40, 900), '#5B4636', 6);
  ctx.fillStyle = 'rgba(255,240,210,0.12)';
  for (let i = 0; i < 6; i++) ctx.fillRect(80 + i * 170, 1060, 40, 860);
  // 大屏
  outline(ctx, rect(110, 1000, 360, 30, 6), '#2B2F3A', 5);
  // 长会议桌（后面）
  outline(ctx, rect(600, 1100, 440, 30, 10), '#F1EADA', 5);
  outline(ctx, rect(630, 1130, 16, 90), '#F1EADA', 4);
  outline(ctx, rect(990, 1130, 16, 90), '#F1EADA', 4);
}

export function showroom(ctx) {
  showroomBG(ctx);
  // 伙伴们：拍照、鼓掌、跟着跳
  drawStick(ctx, pal(1, { x: 130, y: 1400, s: 0.75, face: 1, eyes: 'happy', mouth: 'grin', armL: { a: 150, b: 10 }, armR: { a: -150, b: -10 } }));
  drawStick(ctx, pal(4, { x: 290, y: 1360, s: 0.68, face: 1, prop: { type: 'phone', hand: 'L' }, armL: { a: 120, b: 40 }, mouth: 'grin' }));
  drawStick(ctx, pal(0, { x: 800, y: 1360, s: 0.68, face: -1, mouth: 'grin', armL: { a: 160, b: 0 }, armR: { a: -130, b: 30 }, jump: 0.2, legL: { a: 20, b: -40 } }));
  drawStick(ctx, pal(2, { x: 960, y: 1410, s: 0.75, face: -1, eyes: 'happy', mouth: 'grin', prop: { type: 'camera', hand: 'R' }, armR: { a: -120, b: -50 } }));
  // Tim：墨镜、领带、话筒，跳起来唱
  ctx.fillStyle = 'rgba(30,26,34,0.25)';
  ctx.beginPath();
  ctx.ellipse(540, 1640, 150, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  drawStick(ctx, tim('now', {
    x: 540, y: 1640, s: 1.3, face: 1, jump: 0.35, glasses: 'sun', mouth: 'sing', eyes: 'dot', lean: -8,
    prop: { type: 'mic', hand: 'R', angle: -40 }, armR: { to: [56, -430], bend: -1 }, armL: { a: 150, b: 20 },
    legL: { a: 40, b: -70 }, legR: { a: -14, b: 6 },
  }));
  notes(ctx, [[760, 1020, 1.1], [880, 930, 0.8], [300, 1010, 0.9]]);
  for (const [x, y, r] of [[200, 1150, 26], [900, 1080, 34], [480, 1080, 18]]) sparkle(ctx, x, y, r, K.yellow, 4);
  subtitle(ctx, '但他开始学着承担，也学着放松。', 1800);
  grain(ctx, 0.04);
}

// ---------------- 4 片尾：门开了，大家都在 ----------------
export function warmStick(ctx) {
  frameWarm(ctx, (c) => {
    const pals = [
      pal(0, { x: 150, y: 1650, s: 0.95, face: 1, eyes: 'happy', mouth: 'grin', armL: { a: 160, b: 0 } }),
      pal(3, { x: 330, y: 1590, s: 0.9, face: 1, mouth: 'grin', armR: { a: -60, b: -100 } }),
      pal(1, { x: 760, y: 1590, s: 0.9, face: -1, eyes: 'happy', mouth: 'grin', armL: { a: 150, b: 20 } }),
      pal(5, { x: 940, y: 1650, s: 0.95, face: -1, mouth: 'grin', prop: { type: 'camera', hand: 'R' }, armR: { a: -110, b: -60 } }),
    ];
    for (const p of pals) drawStick(c, p);
    c.fillStyle = 'rgba(30,26,34,0.18)';
    c.beginPath();
    c.ellipse(545, 1740, 150, 22, 0, 0, Math.PI * 2);
    c.fill();
    drawStick(c, tim('now', { x: 545, y: 1740, s: 1.15, eyes: 'happy', mouth: 'grin', blush: 0.6, armL: { a: 140, b: 30 }, armR: { a: -140, b: -30 } }));
  });
}

// ---------------- 两年的变化（1920×1080） ----------------
export function growth(ctx) {
  ctx.fillStyle = K.cream;
  ctx.fillRect(0, 0, 1920, 1080);
  outline(ctx, rect(0, 0, 1920, 150), K.red, 0.01);
  ctx.fillStyle = K.cream;
  ctx.font = `900 60px ${SANS}`;
  ctx.fillText('Tim 的两年', 70, 98);
  ctx.font = `500 26px ${SANS}`;
  ctx.fillText('同一个火柴人，靠姿态、动作和打扮看出变化', 420, 96);
  const stages = [
    ['两年前', '驼背、背包、一直冒汗', tim('before', { face: -1, t: 0.2, tremble: 0.5 })],
    ['第一次上台', '腿软、稿子抖', tim('first', { t: 0.37, tremble: 1, sweat: 1, eyes: 'shock', armL: { to: [20, -330], bend: 1 }, armR: { to: [-24, -322], bend: -1 }, prop: { type: 'paper', hand: 'L', shake: 1 }, legL: { a: 6, b: -22 }, legR: { a: -6, b: 22 } })],
    ['当上会长', '头发打理了，站直了', tim('president', { crown: 1, armL: { a: 40, b: 100 }, armR: { a: -40, b: -100 } })],
    ['现在', '领带、墨镜、话筒，越来越享受舞台', tim('now', { face: 1, glasses: 'sun', mouth: 'sing', eyes: 'dot', prop: { type: 'mic', hand: 'R', angle: -40 }, armR: { to: [56, -430], bend: -1 }, armL: { a: 150, b: 20 }, legL: { a: 35, b: -60 }, lean: -8 })],
  ];
  stages.forEach(([title, sub, p], i) => {
    const x = 260 + i * 470;
    p.x = x;
    p.y = 900;
    p.s = 1.0;
    drawStick(ctx, p);
    ctx.fillStyle = K.navy;
    ctx.textAlign = 'center';
    ctx.font = `900 34px ${SANS}`;
    ctx.fillText(title, x, 980);
    ctx.font = `500 24px ${SANS}`;
    ctx.fillStyle = '#5F5A55';
    ctx.fillText(sub, x, 1022);
    ctx.textAlign = 'left';
    if (i < 3) {
      ctx.strokeStyle = K.red;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + 170, 600);
      ctx.lineTo(x + 280, 600);
      ctx.lineTo(x + 256, 580);
      ctx.moveTo(x + 280, 600);
      ctx.lineTo(x + 256, 620);
      ctx.stroke();
    }
  });
  // 伙伴们
  void eoeLogo;
}

export const FRAMES3 = { door: doorStick, stage: stageFirst, showroom, warm: warmStick, growth };

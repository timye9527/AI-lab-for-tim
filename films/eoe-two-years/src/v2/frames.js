// 风格定稿用的三张关键帧（1080×1920）+ 角色阵容图
import { drawTimFront, pose, expr, friendPose, C as TC } from './tim2.js';

export const K = {
  navy: '#1B355C', navyDeep: '#0F1F3D', navyMid: '#2B4573', peri: '#B2C3F7',
  red: '#C15145', redDeep: '#9E3E35', cream: '#FAF3D7', orange: '#E8763A',
  blue: '#1E9BE9', yellow: '#FDB813', logoRed: '#D9421C', ink: '#1E1A22',
};
const W = 1080;
const H = 1920;
const SANS = '"Noto Sans SC", sans-serif';

export function outline(ctx, path, fill, lw = 5) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(path);
  }
  ctx.lineWidth = lw;
  ctx.strokeStyle = K.ink;
  ctx.lineJoin = 'round';
  ctx.stroke(path);
}
export function rect(x, y, w, h, r = 0) {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}
// 俱乐部 PPT 里的四角星
export function sparkle(ctx, x, y, r, color, lw = 0) {
  const p = new Path2D();
  p.moveTo(x, y - r);
  p.quadraticCurveTo(x + r * 0.12, y - r * 0.12, x + r, y);
  p.quadraticCurveTo(x + r * 0.12, y + r * 0.12, x, y + r);
  p.quadraticCurveTo(x - r * 0.12, y + r * 0.12, x - r, y);
  p.quadraticCurveTo(x - r * 0.12, y - r * 0.12, x, y - r);
  ctx.fillStyle = color;
  ctx.fill(p);
  if (lw) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = K.ink;
    ctx.stroke(p);
  }
}
export function glow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// EOE 标志：三个圆润的小写字母
export function eoeLogo(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  const e = (cx, col) => {
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.arc(cx, 0, 24, 0, 0.8, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 23, 0);
    ctx.lineTo(cx + 24, 0);
    ctx.stroke();
  };
  e(-58, K.blue);
  ctx.strokeStyle = K.yellow;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.stroke();
  e(58, K.logoRed);
  ctx.restore();
}
export function subtitle(ctx, text, y = 1580) {
  ctx.save();
  ctx.font = `700 54px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 12;
  ctx.strokeStyle = K.navyDeep;
  ctx.strokeText(text, W / 2, y);
  ctx.fillStyle = K.cream;
  ctx.fillText(text, W / 2, y);
  ctx.restore();
}
export function crow(ctx, x, y, s, flip = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * flip, s);
  const body = new Path2D('M -40,-30 C -40,-62 0,-74 26,-58 C 40,-50 44,-36 40,-22 L 70,-6 L 36,-6 C 20,4 -20,4 -40,-30 Z');
  outline(ctx, body, '#15151C', 4);
  const head = new Path2D('M 14,-60 C 14,-86 50,-90 56,-66 C 58,-56 50,-50 40,-50 Z');
  outline(ctx, head, '#15151C', 4);
  outline(ctx, new Path2D('M 54,-74 L 80,-68 L 54,-62 Z'), '#4A4C58', 3.5);
  ctx.fillStyle = K.cream;
  ctx.beginPath();
  ctx.arc(42, -70, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = K.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.lineTo(-6, 14);
  ctx.moveTo(8, -2);
  ctx.lineTo(8, 14);
  ctx.stroke();
  ctx.restore();
}
export function grain(ctx, amt = 0.05) {
  const c = document.createElement('canvas');
  c.width = 270;
  c.height = 480;
  const g = c.getContext('2d');
  const img = g.createImageData(270, 480);
  let a = 7;
  for (let i = 0; i < img.data.length; i += 4) {
    a = (a * 16807) % 2147483647;
    const v = a % 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = amt;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(c, 0, 0, W, H);
  ctx.restore();
}

// ---------------- 关键帧 1：密码门前（夜，藏青） ----------------
export function frameDoor(ctx, cast) {
  const sky = ctx.createLinearGradient(0, 0, 0, 560);
  sky.addColorStop(0, K.navyDeep);
  sky.addColorStop(1, K.navy);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // 月亮 + 四角星
  outline(ctx, new Path2D('M 900,170 m -80,0 a 80,80 0 1,0 160,0 a 80,80 0 1,0 -160,0'), K.cream, 5);
  outline(ctx, new Path2D('M 900,170 m -38,-30 a 26,26 0 1,0 1,0'), '#EFE3BC', 0.01);
  for (const [x, y, r] of [[120, 120, 22], [300, 60, 12], [560, 150, 16], [700, 60, 10], [210, 300, 10], [1010, 360, 12]]) sparkle(ctx, x, y, r, K.cream);
  // 楼
  outline(ctx, rect(-20, 420, W + 40, 1180), K.navyMid, 6);
  for (let y = 560; y < 1500; y += 230) {
    ctx.strokeStyle = 'rgba(15,31,61,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // 窗：两扇亮着
  const wins = [[60, 470], [330, 470], [600, 470], [870, 470]];
  wins.forEach(([x, y], i) => {
    const lit = i === 1 || i === 3;
    outline(ctx, rect(x, y, 170, 150, 10), lit ? K.yellow : K.navyDeep, 5);
    if (lit) {
      ctx.fillStyle = K.orange;
      ctx.fillRect(x + 6, y + 100, 158, 44);
      ctx.fillStyle = 'rgba(158,62,53,0.6)';
      ctx.beginPath();
      ctx.arc(x + 55, y + 80, 18, 0, Math.PI * 2);
      ctx.arc(x + 118, y + 86, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = K.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 85, y);
    ctx.lineTo(x + 85, y + 150);
    ctx.stroke();
  });
  // 门
  outline(ctx, rect(30, 700, 380, 870, 8), '#14264A', 6);
  for (const x0 of [52, 226]) {
    const g = ctx.createLinearGradient(0, 720, 0, 1560);
    g.addColorStop(0, '#20406B');
    g.addColorStop(0.75, '#22406A');
    g.addColorStop(1, K.orange);
    outline(ctx, rect(x0, 722, 162, 830, 4), g, 4);
    ctx.fillStyle = 'rgba(178,195,247,0.22)';
    ctx.beginPath();
    ctx.moveTo(x0 + 20, 1000);
    ctx.lineTo(x0 + 80, 740);
    ctx.lineTo(x0 + 110, 740);
    ctx.lineTo(x0 + 20, 1120);
    ctx.fill();
  }
  glow(ctx, 220, 1560, 320, '232,118,58', 0.45);
  // 门上的 EOE 牌子
  outline(ctx, rect(140, 950, 160, 110, 14), K.navy, 4);
  eoeLogo(ctx, 220, 992, 0.62);
  ctx.fillStyle = K.cream;
  ctx.font = `500 15px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText('eloquence of the elites', 220, 1040);
  // 把手
  outline(ctx, rect(196, 1080, 14, 200, 7), '#C9CFDD', 3.5);
  outline(ctx, rect(232, 1080, 14, 200, 7), '#C9CFDD', 3.5);
  // 密码锁（EOE 蓝）
  glow(ctx, 470, 940, 260, '30,155,233', 0.45);
  outline(ctx, rect(462, 860, 78, 150, 12), '#0B1426', 5);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = '#8FD3FF';
      ctx.beginPath();
      ctx.arc(480 + c * 21, 905 + r * 25, 6.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#8FD3FF';
  ctx.fillRect(476, 874, 50, 9);
  // 地面
  outline(ctx, rect(-20, 1560, W + 40, 400), '#16294D', 6);
  ctx.strokeStyle = 'rgba(178,195,247,0.18)';
  ctx.lineWidth = 4;
  for (let x = -200; x < W + 200; x += 180) {
    ctx.beginPath();
    ctx.moveTo(x, 1560);
    ctx.lineTo(x - 140, H);
    ctx.stroke();
  }
  // 路灯 + 乌鸦
  outline(ctx, rect(975, 380, 26, 1600), '#0E1A33', 5);
  outline(ctx, new Path2D('M 988,400 Q 988,330 900,330 L 880,330'), null, 18);
  ctx.strokeStyle = '#0E1A33';
  ctx.lineWidth = 10;
  ctx.stroke(new Path2D('M 988,400 Q 988,330 900,330 L 880,330'));
  outline(ctx, rect(820, 320, 110, 30, 12), '#0E1A33', 5);
  glow(ctx, 875, 360, 200, '250,243,215', 0.35);
  crow(ctx, 870, 322, 1.1, -1);
  if (cast) cast(ctx);
  else {
  // Tim：转头看密码锁，伸出手指
  const p = pose({
    x: 760, y: 1590, s: 0.72, head: 'q', headFlip: -1, hunch: 1,
    e: expr({ mouth: 'flat', brows: 'worry', sweat: 1, look: [0.8, 0] }),
    armR: { target: [(510 - 760) / 0.72, (930 - 1590) / 0.72], bend: -1, hand: 'point', front: true },
    armL: { a: 0.15, b: 0.35, hand: 'fist' },
  });
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(760, 1590, 150, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  drawTimFront(ctx, p);
  }
  // 蓝光照到 Tim 身上的一侧
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  glow(ctx, 470, 940, 520, '30,155,233', 0.55);
  ctx.restore();
  if (!cast) subtitle(ctx, '两年前，Tim 第一次来到 EOE。');
  grain(ctx);
}

// ---------------- 关键帧 2：警报幻想（砖红） ----------------
export function frameAlarm(ctx) {
  ctx.fillStyle = K.red;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, 1150);
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? K.redDeep : K.red;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 2400, (i / 16) * Math.PI * 2, ((i + 1) / 16) * Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  glow(ctx, W / 2, 1150, 700, '250,243,215', 0.35);
  for (const [x, y, r] of [[120, 760, 50], [960, 900, 64], [150, 1500, 40], [930, 1620, 54], [880, 640, 26]]) sparkle(ctx, x, y, r, K.cream, 5);
  // 警灯
  for (const x of [130, 950]) {
    outline(ctx, rect(x - 80, 200, 160, 44, 10), K.ink, 5);
    outline(ctx, new Path2D(`M ${x - 64},202 Q ${x - 64},110 ${x},110 Q ${x + 64},110 ${x + 64},202 Z`), '#FF4A3D', 5);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(x - 22, 150, 12, 22, -0.4, 0, Math.PI * 2);
    ctx.fill();
    glow(ctx, x, 160, 260, '255,240,200', 0.4);
  }
  // 警示牌
  ctx.save();
  ctx.translate(W / 2, 400);
  ctx.rotate(-0.05);
  ctx.strokeStyle = K.ink;
  ctx.lineWidth = 8;
  for (const sx of [-300, 300]) {
    ctx.beginPath();
    ctx.moveTo(sx, -170);
    ctx.lineTo(sx * 0.7, -600);
    ctx.stroke();
  }
  const board = rect(-400, -175, 800, 350, 30);
  ctx.save();
  ctx.clip(board);
  ctx.fillStyle = K.yellow;
  ctx.fillRect(-420, -200, 840, 400);
  ctx.fillStyle = K.ink;
  for (let i = -16; i < 16; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 60, -200);
    ctx.lineTo(i * 60 + 30, -200);
    ctx.lineTo(i * 60 + 430, 200);
    ctx.lineTo(i * 60 + 400, 200);
    ctx.fill();
  }
  ctx.restore();
  outline(ctx, board, null, 7);
  outline(ctx, rect(-350, -125, 700, 250, 18), K.cream, 5);
  ctx.fillStyle = K.red;
  ctx.font = `900 112px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('非法闯入？！', 0, 6);
  ctx.restore();
  // Tim：吓得跳起来
  const p = pose({
    x: 540, y: 1780, s: 0.78, jump: 0.45, tuck: 0.7,
    e: expr({ eyes: 'shock', mouth: 'scream', brows: 'up', sweat: 1 }),
    armL: { a: 2.2, b: 0.5, hand: 'open' }, armR: { a: 2.2, b: 0.5, hand: 'open' },
  });
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(540, 1800, 200, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  drawTimFront(ctx, p);
  // 惊吓线
  ctx.strokeStyle = K.ink;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (const [a, r0] of [[-2.4, 230], [-2.0, 250], [-1.15, 250], [-0.75, 230]]) {
    const cx = 540;
    const cy = 1040;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * (r0 + 60), cy + Math.sin(a) * (r0 + 60));
    ctx.stroke();
  }
  grain(ctx);
}

// ---------------- 关键帧 3：门开了，大家都在（暖，奶油 + 砖红） ----------------
export function frameWarm(ctx, cast) {
  ctx.fillStyle = K.cream;
  ctx.fillRect(0, 0, W, H);
  // 顶部砖红块：片尾字幕
  outline(ctx, rect(-20, -20, W + 40, 640), K.red, 0.01);
  outline(ctx, rect(0, 0, 250, 250), K.navy, 0.01);
  eoeLogo(ctx, 125, 105, 1.1);
  ctx.fillStyle = K.cream;
  ctx.font = `500 22px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText('eloquence of the elites', 125, 175);
  ctx.textAlign = 'left';
  ctx.font = `900 76px ${SANS}`;
  ctx.fillText('EOE 中文演讲俱乐部', 80, 380);
  ctx.font = `700 44px ${SANS}`;
  ctx.fillText('自由开放 · 趣味奇葩', 80, 460);
  ctx.font = `700 40px ${SANS}`;
  ctx.fillStyle = K.yellow;
  ctx.fillText('第三年，继续一起玩！', 80, 540);
  sparkle(ctx, 940, 120, 48, K.ink);
  sparkle(ctx, 860, 420, 30, K.cream);
  // 长椭圆（PPT 里的长春花蓝）
  ctx.save();
  ctx.translate(560, 1260);
  ctx.rotate(-0.42);
  ctx.fillStyle = K.peri;
  ctx.beginPath();
  ctx.ellipse(0, 0, 640, 300, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 暖光
  glow(ctx, 540, 1000, 700, '232,118,58', 0.3);
  for (const [x, y, r] of [[110, 760, 40], [980, 820, 54], [960, 1500, 34], [90, 1420, 28]]) sparkle(ctx, x, y, r, K.ink);
  if (cast) cast(ctx);
  else {
  // 伙伴们：围着 Tim
  const fr = [
    friendPose(0, { x: 170, y: 1660, s: 0.58, lean: -0.06, tilt: -0.1, e: expr({ mouth: 'grin', eyes: 'happy' }), armL: { a: 2.5, b: 0.4, hand: 'open' }, armR: { a: 0.2, b: 0.2, hand: 'relax' } }),
    friendPose(1, { x: 380, y: 1600, s: 0.6, tilt: 0.08, e: expr({ mouth: 'smile', look: [0.5, 0] }), armR: { a: 0.3, b: 1.9, hand: 'fist' } }),
    friendPose(2, { x: 720, y: 1610, s: 0.6, lean: 0.05, tilt: 0.12, e: expr({ mouth: 'grin' }), armL: { a: 2.3, b: 0.2, hand: 'open' } }),
    friendPose(3, { x: 925, y: 1670, s: 0.56, lean: 0.07, tilt: 0.06, e: expr({ mouth: 'smile', eyes: 'happy', blush: 0.6 }), armR: { a: 2.6, b: 0.3, hand: 'open' } }),
  ];
  for (const f of fr) drawTimFront(ctx, f);
  const p = pose({
    x: 545, y: 1760, s: 0.66, jacket: false, pack: false,
    e: expr({ mouth: 'grin', eyes: 'happy', blush: 0.5 }),
    armL: { a: 0.5, b: 2.3, hand: 'relax' }, armR: { a: 0.35, b: 0.3, hand: 'relax' },
  });
  ctx.fillStyle = 'rgba(30,26,34,0.18)';
  ctx.beginPath();
  ctx.ellipse(545, 1765, 190, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  drawTimFront(ctx, p);
  }
  subtitle(ctx, '这里，已经有了他舍不得的人。', 1840);
  grain(ctx, 0.04);
}

// ---------------- 角色阵容（1920×1080） ----------------
export function lineup(ctx) {
  ctx.fillStyle = K.cream;
  ctx.fillRect(0, 0, 1920, 1080);
  outline(ctx, rect(0, 0, 1920, 150), K.red, 0.01);
  ctx.fillStyle = K.cream;
  ctx.font = `900 64px ${SANS}`;
  ctx.fillText('角色设定 · 第二版', 70, 98);
  ctx.font = `500 26px ${SANS}`;
  ctx.fillText('按本人照片设计 · 俱乐部插画风：粗描边 + 平涂 + 一层暗部', 640, 96);
  const label = (t, x, y) => {
    ctx.fillStyle = K.navy;
    ctx.font = `700 26px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText(t, x, y);
    ctx.textAlign = 'left';
  };
  const Y = 960;
  drawTimFront(ctx, pose({ x: 190, y: Y, s: 0.62, e: expr({ mouth: 'flat', brows: 'worry', look: [-0.6, 0] }), hunch: 1 }));
  label('Tim · 开头（紧张）', 190, 1040);
  drawTimFront(ctx, pose({ x: 480, y: Y, s: 0.62, jacket: false, pack: false, e: expr({ mouth: 'grin' }), armL: { a: 0.3, b: 2.4, hand: 'relax' } }));
  label('Tim · 后来（松弛）', 480, 1040);
  for (let i = 0; i < 6; i++) {
    const x = 770 + i * 190;
    drawTimFront(ctx, friendPose(i, { x, y: Y, s: 0.54, e: expr({ mouth: i % 2 ? 'smile' : 'grin', eyes: i === 3 ? 'happy' : 'open' }) }));
  }
  label('伙伴们（同一套画法，换发型和衣服）', 1240, 1040);
}

export const FRAMES = { door: frameDoor, alarm: frameAlarm, warm: frameWarm, lineup };
void TC;

// 正式样片：火柴人版第一幕「密码门前的逃兵」
import { SHOTS, shotAt, T, HEARTBEATS, VO, DURATION, W, H } from './timeline4.js';
import { drawStick, tim, INK, FACE } from '../v3/stick.js';
import { shakeMarks } from '../v3/frames3.js';
import { K, sparkle, outline, rect, glow, subtitle, frameDoor } from '../v2/frames.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeIn = (x) => Math.pow(clamp(x), 3);
const SANS = '"Noto Sans SC", sans-serif';
const FUN = '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif';

// 关键帧插值
function kf(t, keys, e = ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, e((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
}
function heart(t) {
  let v = 0;
  for (const h of HEARTBEATS) {
    if (t >= h) v += Math.exp(-(t - h) / 0.07);
    if (t >= h + 0.17) v += 0.6 * Math.exp(-(t - h - 0.17) / 0.07);
  }
  return v;
}
const noise = (t, s) => Math.sin(t * 12.9 + s) * 0.5 + Math.sin(t * 7.3 + s * 2) * 0.3 + Math.sin(t * 23.1 + s * 3) * 0.2;

function cam(ctx, z, cx, cy, fn, sx = 0, sy = 0, rot = 0) {
  ctx.save();
  ctx.translate(W / 2 + sx, H / 2 + sy);
  ctx.rotate(rot);
  ctx.scale(z, z);
  ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}
function layer(draw) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  draw(c.getContext('2d'));
  return c;
}

// ---------- 背景（预先画好） ----------
let BG = null;
function keypadBG(ctx) {
  ctx.fillStyle = K.navyMid;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(15,31,61,0.5)';
  ctx.lineWidth = 6;
  for (let y = 200; y < H; y += 420) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  glow(ctx, 540, 960, 900, '30,155,233', 0.45);
  outline(ctx, rect(200, 330, 680, 1180, 70), '#0B1426', 12);
  outline(ctx, rect(250, 400, 580, 150, 26), '#0E2A44', 7);
  ctx.fillStyle = '#9FDCFF';
  ctx.font = `700 64px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('请输入密码', 540, 476);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const x = 365 + c * 175;
      const y = 700 + r * 200;
      glow(ctx, x, y, 120, '30,155,233', 0.35);
      ctx.strokeStyle = '#8FD3FF';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(x, y, 66, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#CDEBFF';
      ctx.font = `900 72px ${SANS}`;
      ctx.fillText(keys[r * 3 + c], x, y + 4);
    }
  }
  ctx.fillStyle = '#FF5A4E';
  ctx.beginPath();
  ctx.arc(540, 372, 12, 0, Math.PI * 2);
  ctx.fill();
}
function faceBG(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, K.navyDeep);
  g.addColorStop(1, K.navy);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 夜色里的光斑（俱乐部配色）
  const dots = [[140, 380, 90, '178,195,247'], [880, 300, 70, '253,184,19'], [960, 760, 110, '178,195,247'], [100, 980, 80, '232,118,58'], [760, 1240, 120, '178,195,247'], [260, 1500, 100, '253,184,19'], [980, 1600, 80, '232,118,58']];
  for (const [x, y, r, c] of dots) glow(ctx, x, y, r * 1.6, c, 0.35);
  for (const [x, y, r] of [[200, 200, 18], [880, 520, 14], [150, 1300, 16], [930, 1100, 20]]) sparkle(ctx, x, y, r, K.cream);
}
function alarmBG(ctx, t) {
  ctx.fillStyle = K.red;
  ctx.fillRect(-300, -300, W + 600, H + 600);
  ctx.save();
  ctx.translate(W / 2, 1150);
  ctx.rotate(t * 0.8);
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? K.redDeep : K.red;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 2600, (i / 16) * Math.PI * 2, ((i + 1) / 16) * Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  glow(ctx, W / 2, 1150, 700, '250,243,215', 0.3);
  const tw = 0.8 + 0.2 * Math.sin(t * 9);
  for (const [x, y, r] of [[120, 760, 50], [960, 900, 64], [150, 1500, 40], [930, 1620, 54], [880, 640, 26]]) sparkle(ctx, x, y, r * tw, K.cream, 5);
}
function beacons(ctx, t) {
  for (const [x, ph] of [[130, 0], [950, Math.PI]]) {
    const a = t * Math.PI * 2 * 1.4 + ph;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(x, 160);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, 1300, 0);
    g.addColorStop(0, 'rgba(255,220,180,0.55)');
    g.addColorStop(1, 'rgba(255,220,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1300, -200);
    ctx.lineTo(1300, 200);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    outline(ctx, rect(x - 80, 200, 160, 44, 10), INK, 5);
    outline(ctx, new Path2D(`M ${x - 64},202 Q ${x - 64},110 ${x},110 Q ${x + 64},110 ${x + 64},202 Z`), '#FF4A3D', 5);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(x - 22, 150, 12, 22, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
function sign(ctx, y, t) {
  ctx.save();
  ctx.translate(W / 2, y);
  ctx.rotate(-0.05 + Math.sin(t * 8) * 0.015);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  for (const sx of [-300, 300]) {
    ctx.beginPath();
    ctx.moveTo(sx, -170);
    ctx.lineTo(sx * 0.7, -900);
    ctx.stroke();
  }
  const board = rect(-400, -175, 800, 350, 30);
  ctx.save();
  ctx.clip(board);
  ctx.fillStyle = K.yellow;
  ctx.fillRect(-420, -200, 840, 400);
  ctx.fillStyle = INK;
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
}
function dust(ctx, x, y, age, n = 10, scale = 1, color = '250,243,215') {
  if (age < 0 || age > 1.1) return;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI;
    const sp = (80 + ((i * 37) % 60)) * scale;
    const px = x + Math.cos(a) * sp * Math.sqrt(age) * 1.5;
    const py = y + Math.sin(a) * sp * Math.sqrt(age) * 0.45 - age * 30;
    ctx.fillStyle = `rgba(${color},${0.6 * (1 - age / 1.1)})`;
    ctx.strokeStyle = `rgba(30,26,34,${0.6 * (1 - age / 1.1)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(px, py, (22 + (i % 3) * 8) * scale * (0.6 + age), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
function speedLines(ctx, x, y, k, dir = 1) {
  if (k <= 0) return;
  ctx.strokeStyle = `rgba(250,243,215,${0.9 * k})`;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const yy = y - 520 + i * 70 + (i % 2) * 20;
    const l = 160 + ((i * 53) % 120);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - dir * 90, yy);
    ctx.lineTo(x - dir * (90 + l), yy);
    ctx.stroke();
  }
}

// ---------- 镜头 ----------
// 门口全景里 Tim 的位置（和第七幕同一机位）
const TX = 760;
const TY = 1588;
const TS = 1.25;
const KEY = [512, 935];
const WIDE = { z: 1.0, x: 540, y: 960 };

function shotKeypad(ctx, t) {
  const p = heart(t);
  const z = lerp(1.0, 1.14, ease(t / 1.8)) * (1 + p * 0.01);
  cam(ctx, z, lerp(540, 520, t / 1.8), lerp(960, 940, t / 1.8), () => {
    ctx.drawImage(BG.keypad, 0, 0);
    // 火柴人的手臂：一根粗线从画外伸进来，指尖停在「5」前面发抖
    const near = kf(t, [[0.3, -700], [1.0, -60], [1.4, -22], [1.8, -50]], easeOut);
    const tr = Math.sin(t * 60) * 7 + Math.sin(t * 97) * 4;
    const tip = [540 + near + tr, 900 + tr * 0.5];
    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.moveTo(-80, 1500);
    ctx.quadraticCurveTo(tip[0] - 260, tip[1] + 260, tip[0], tip[1]);
    ctx.stroke();
    if (t > 0.9) shakeMarks(ctx, tip[0] - 30, tip[1], 0, 0.8);
  }, 0, 0, lerp(-0.02, -0.05, t / 1.8));
  return { vig: 0.45 + p * 0.06 };
}

function timAtDoor(t, extra) {
  return tim('before', { x: TX, y: TY, s: TS, face: -1, t, tremble: 0.7, armR: { to: [(KEY[0] - TX) / TS, (KEY[1] - TY) / TS], bend: -1 }, armL: { a: 10, b: 30 }, ...extra });
}
function shotWide1(ctx, t) {
  const lt = t - 1.8;
  const e = ease(lt / 2.35);
  const z = lerp(1.0, 1.12, e);
  // 左顾右盼：头朝向来回切
  const face = t > T.look1 && t < T.look1 + 0.35 ? 1 : t > T.look2 && t < T.look2 + 0.28 ? 1 : -1;
  cam(ctx, z, lerp(540, 640, e), lerp(960, 1100, e), () => {
    ctx.drawImage(BG.door, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(TX, TY, 120, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    const p = timAtDoor(t, { face, sweatY: (lt % 1.2) / 1.2, lean: kf(t, [[3.5, 0], [4.1, -6]]) });
    if (face === 1) p.armR = { to: [(KEY[0] - TX) / TS, (KEY[1] - TY) / TS], bend: 1 };
    drawStick(ctx, p);
    shakeMarks(ctx, TX + Math.sin(t * 40) * 3, 1060, 0, 0.9);
    // 回头时的「嗖」线
    if (face === 1) {
      ctx.strokeStyle = K.cream;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      for (const dy of [-30, 0, 30]) {
        ctx.beginPath();
        ctx.moveTo(TX + 120, 1060 + dy);
        ctx.lineTo(TX + 190, 1060 + dy);
        ctx.stroke();
      }
    }
  });
  return { vig: 0.4 };
}

const FX = 540;
const FY = 2300;
const FS = 3.4;
function faceTim(t, extra) {
  return tim('before', { x: FX, y: FY, s: FS, face: 0, t, pack: true, armL: { a: 8, b: 10 }, armR: { a: -8, b: -10 }, ...extra });
}
function shotFace(ctx, t) {
  const lt = t - 4.15;
  const p = heart(t);
  const z = lerp(1.0, 1.22, easeIn(lt / 2.15)) * (1 + p * 0.012);
  const darts = t < T.gulp ? (Math.floor(lt / 0.2) % 2 ? 1 : -1) : 0;
  const gulp = t > T.gulp && t < T.gulp + 0.35;
  cam(ctx, z, 540, lerp(1000, 880, ease(lt / 2.15)), () => {
    ctx.drawImage(BG.face, 0, 0);
    drawStick(ctx, faceTim(t, {
      tremble: 0.5, look: [darts, gulp ? -0.5 : 0], eyes: t > T.gulp + 0.3 ? 'shock' : 'dot', brows: 'worry',
      mouth: gulp ? 'o' : 'flat', sweat: 1, sweatY: clamp(lt / 2.15), bob: gulp ? Math.sin(((t - T.gulp) / 0.35) * Math.PI) * 6 : 0,
    }));
    if (gulp) {
      ctx.fillStyle = K.cream;
      ctx.font = `64px ${FUN}`;
      ctx.textAlign = 'center';
      ctx.fillText('咕嘟', 820, 760);
    }
  }, noise(t * 3, 1) * 4, noise(t * 3, 2) * 4);
  return { vig: 0.5 + p * 0.08 };
}

function shotAlarm(ctx, t0) {
  const t = Math.min(t0, T.brake);
  const lt = t - T.alarm;
  const impact = T.sign + 0.24;
  const shake = (t > impact ? 26 * Math.exp(-(t - impact) / 0.25) : 0) + 5;
  const jump = t < T.scream ? 0 : t < T.scream + 0.2 ? easeOut((t - T.scream) / 0.2) : t < T.brake - 0.32 ? 1 + Math.sin((t - T.scream) * 6) * 0.05 : t < T.brake - 0.15 ? 1 - easeIn((t - (T.brake - 0.32)) / 0.17) : 0;
  const flail = Math.sin(t * 26);
  cam(ctx, lerp(1.1, 1.0, easeOut(lt / 0.5)), 540, 1000, () => {
    alarmBG(ctx, t);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(540, 1830, 200 * (1 - jump * 0.3), 30, 0, 0, Math.PI * 2);
    ctx.fill();
    drawStick(ctx, tim('before', {
      x: 540, y: 1830, s: 1.75, face: 0, t, pack: true, jump: jump * 0.55, tremble: 1.2,
      eyes: 'shock', mouth: 'scream', brows: 'up', sweat: 1,
      armL: { a: 150 + flail * 18, b: 20 - flail * 20 }, armR: { a: -150 + flail * 18, b: -20 - flail * 20 },
      legL: { a: 30 * jump, b: -70 * jump }, legR: { a: -30 * jump, b: 70 * jump },
    }));
    beacons(ctx, t);
    const drop = t < T.sign ? 0 : clamp((t - T.sign) / 0.24);
    const y = drop < 1 ? lerp(-500, 330, easeIn(drop)) : 330 - Math.abs(Math.sin((t - impact) * 14)) * 18 * Math.exp(-(t - impact) / 0.2);
    if (t > T.sign) sign(ctx, y, t);
    dust(ctx, 540, 515, t - impact, 12, 1.1);
  }, noise(t * 20, 3) * shake, noise(t * 20, 4) * shake, noise(t * 5, 5) * 0.02);
  const flash = t0 < T.alarm + 0.07 ? 0.8 : t > impact && t < impact + 0.05 ? 0.35 : 0;
  if (flash) {
    ctx.fillStyle = `rgba(255,255,255,${flash})`;
    ctx.fillRect(0, 0, W, H);
  }
  return { vig: 0.5, desat: t0 > T.brake ? clamp((t0 - T.brake) / 0.08) * 0.9 : 0 };
}

function shotReality(ctx, t) {
  const lt = t - T.quiet;
  const crowed = t > T.crow1 + 0.05;
  cam(ctx, 1.15, 540, 900, () => {
    ctx.drawImage(BG.face, 0, 0);
    drawStick(ctx, faceTim(t, {
      tremble: 0.2, eyes: crowed ? 'dot' : 'shock', look: [kf(t, [[T.crow1, 0], [T.crow1 + 0.12, 1]]), 0],
      brows: 'worry', mouth: t > T.smile ? 'wobble' : 'flat', blush: kf(t, [[T.smile, 0], [T.smile + 0.3, 0.9]]),
      sweat: 1, sweatY: kf(t, [[T.smile, 0.1], [T.quiet + 0.95, 0.7]], (u) => u),
    }));
    if (t > T.crow1) {
      const k = clamp((t - T.crow1) / 0.12);
      ctx.save();
      ctx.translate(820, 330);
      ctx.rotate(0.1 + Math.sin(t * 20) * 0.02);
      const sc = 0.6 + 0.4 * easeOut(k);
      ctx.scale(sc, sc);
      ctx.font = `120px ${FUN}`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 14;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = K.navyDeep;
      ctx.strokeText('嘎——', 0, 0);
      ctx.fillStyle = K.cream;
      ctx.fillText('嘎——', 0, 0);
      ctx.restore();
    }
  });
  void lt;
  return { vig: 0.5 };
}

function shotWide2(ctx, t) {
  // 收手 → 转身 → 僵硬地走 → 一溜烟跑掉
  let x = TX;
  let ph = 0;
  let stride = 0;
  let dash = 0;
  if (t > T.walk) {
    const w = Math.min(t, T.dash) - T.walk;
    x += w * 220;
    ph = w * Math.PI * 2 * 2.2;
    stride = clamp((t - T.walk) / 0.1);
  }
  if (t > T.dash) {
    const d = t - T.dash;
    const wind = d < 0.12 ? -Math.sin((d / 0.12) * Math.PI) * 24 : 0;
    const go = d > 0.12 ? Math.pow(d - 0.12, 2) * 3200 + (d - 0.12) * 1000 : 0;
    x += wind + go;
    ph += d * Math.PI * 2 * 7;
    stride = 1.6;
    dash = d < 0.12 ? -1 : 1;
  }
  const face = t < T.turn ? -1 : 1;
  const retract = clamp((t - T.retract) / 0.18);
  const swing = Math.sin(ph) * 32 * stride;
  const follow = 0;
  cam(ctx, WIDE.z, WIDE.x + follow, WIDE.y, () => {
    ctx.drawImage(BG.door, 0, 0);
    if (x < 1400) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(x, TY, 120, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      if (dash > 0) speedLines(ctx, x, TY - 100, clamp((t - T.dash - 0.12) / 0.08), 1);
      const p = tim('before', {
        x, y: TY, s: TS, face, t, tremble: t < T.turn ? 0.3 : 0,
        mouth: t < T.turn ? 'wobble' : 'flat', blush: 0.7, sweat: 1, sweatY: 0.5,
        lean: dash > 0 ? 18 : dash < 0 ? -10 : 0,
        bob: t > T.retract + 0.2 && t < T.turn ? -Math.abs(Math.sin((t - T.retract - 0.2) * 9)) * 10 : 0,
        legL: { a: swing, b: stride > 0 ? -Math.max(0, Math.cos(ph)) * 50 * stride : 0 },
        legR: { a: -swing, b: stride > 0 ? -Math.max(0, -Math.cos(ph)) * 50 * stride : 0 },
      });
      if (t < T.turn) {
        const reach = { to: [(KEY[0] - TX) / TS, (KEY[1] - TY) / TS], bend: -1 };
        p.armR = retract < 1 ? reach : { a: -10, b: -30 };
        if (retract > 0 && retract < 1) p.armR = { a: lerp(-110, -10, retract), b: lerp(0, -30, retract) };
      } else {
        p.armL = { a: -swing * 1.2 + (dash > 0 ? -60 : 0), b: 30 };
        p.armR = { a: swing * 1.2 + (dash > 0 ? -60 : 0), b: 30 };
      }
      drawStick(ctx, p);
    }
    dust(ctx, TX + 160, TY - 20, t - T.dash - 0.1, 10, 1.2);
    // 乌鸦第二声
    if (t > T.crow2 && t < T.crow2 + 0.6) {
      ctx.fillStyle = K.cream;
      ctx.font = `56px ${FUN}`;
      ctx.textAlign = 'center';
      ctx.fillText('嘎', 790, 260);
    }
  });
  // 印章：第 1 次尝试 · 撤退！
  if (t > T.stamp) {
    const k = clamp((t - T.stamp) / 0.14);
    const sc = lerp(2.6, 1, easeIn(k));
    ctx.save();
    ctx.translate(540, 720);
    ctx.rotate(-0.14);
    ctx.scale(sc, sc);
    ctx.globalAlpha = clamp(k * 3);
    ctx.strokeStyle = K.red;
    ctx.fillStyle = 'rgba(250,243,215,0.92)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(-330, -110, 660, 220, 22);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-310, -90, 620, 180, 14);
    ctx.stroke();
    ctx.fillStyle = K.red;
    ctx.textAlign = 'center';
    ctx.font = `700 36px ${SANS}`;
    ctx.fillText('第 1 次尝试', 0, -30);
    ctx.font = `900 96px ${SANS}`;
    ctx.fillText('撤退！', 0, 64);
    ctx.restore();
  }
  return { vig: 0.4, shake: t > T.stamp + 0.1 && t < T.stamp + 0.3 ? 10 * (1 - (t - T.stamp - 0.1) / 0.2) : 0 };
}

const FN = { keypad: shotKeypad, wide1: shotWide1, face: shotFace, alarm: shotAlarm, reality: shotReality, wide2: shotWide2 };

export async function createSample(canvas, { subtitles = true, fadeOut = true } = {}) {
  const ctx = canvas.getContext('2d');
  await Promise.all([
    document.fonts.load(`900 112px "Noto Sans SC"`, '非法闯入？！请输入密码0123456789*#撤退第次尝试1'),
    document.fonts.load(`700 54px "Noto Sans SC"`, '两年前，Tim 第一次来到 EOE。因为不敢按密码……于是他跑了'),
    document.fonts.load(`120px "ZCOOL KuaiLe"`, '嘎——咕嘟'),
    document.fonts.load(`500 15px "Noto Sans SC"`, 'eloquence of the elites'),
  ]);
  let durs = {};
  try {
    durs = await (await fetch(new URL('../../assets/vo-tim/full/durations.json', import.meta.url))).json();
  } catch {
    durs = {};
  }
  BG = { keypad: layer(keypadBG), face: layer(faceBG), door: layer((c) => frameDoor(c, () => {})) };
  const [scene, sc] = (() => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return [c, c.getContext('2d')];
  })();
  return {
    render(t) {
      const shot = shotAt(t);
      sc.fillStyle = '#000';
      sc.fillRect(0, 0, W, H);
      const post = FN[shot.id](sc, t) || {};
      ctx.save();
      ctx.filter = post.desat ? `saturate(${1 - post.desat})` : 'none';
      if (post.shake) ctx.translate(noise(t * 40, 1) * post.shake, noise(t * 40, 2) * post.shake);
      ctx.drawImage(scene, 0, 0);
      ctx.restore();
      // 暗角
      const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H / 2, H * 0.75);
      g.addColorStop(0, 'rgba(10,15,30,0)');
      g.addColorStop(1, `rgba(10,15,30,${post.vig ?? 0.4})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      if (subtitles) {
        VO.forEach((v, i) => {
          const next = VO[i + 1] ? VO[i + 1].start - 0.06 : Infinity;
          const end = Math.min(next, v.start + (durs[v.id] ?? 2) + 0.25);
          if (t >= v.start - 0.03 && t <= end) {
            ctx.save();
            ctx.globalAlpha = clamp((t - v.start + 0.03) / 0.1) * clamp((end - t) / 0.1);
            subtitle(ctx, v.text, 1580);
            ctx.restore();
          }
        });
      }
      const fade = t < 0.2 ? 1 - t / 0.2 : fadeOut && t > DURATION - 0.35 ? (t - (DURATION - 0.35)) / 0.35 : 0;
      if (fade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${clamp(fade)})`;
        ctx.fillRect(0, 0, W, H);
      }
    },
  };
}
void SHOTS;
void FACE;

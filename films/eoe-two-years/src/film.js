// 开场样片：镜头调度、角色表演、打光、后期、字幕
import { W, H, T, SHOTS, shotAt, HEARTBEATS, VO, VO_EST } from './timeline.js';
import { clamp, lerp, inv, easeInOutCubic, easeOutCubic, easeInCubic, easeOutBack, noise1 } from './util.js';
import { drawTimFront, drawTimSide, drawHandCU, drawFingerAtCam, pose } from './tim.js';
import { layer, light, tint, bloom, vignette, grain, chroma, glow, cone } from './fx.js';
import {
  drawFacade, drawLamp, drawCrow, drawStreet, drawKeypadCU, keyCenter, KEYPAD, LAMP,
  drawAlarmBG, drawBeacons, drawWarningSign, drawDust, drawSpeedLines, FONT_FUN,
} from './scenes.js';

// 关键帧插值：keys = [[t, v], ...]
function kf(t, keys, ease = easeInOutCubic) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, ease(inv(t0, t1, t)));
  }
  return keys[keys.length - 1][1];
}
const step = (t, keys) => {
  let v = keys[0][1];
  for (const [k, x] of keys) if (t >= k) v = x;
  return v;
};
// 心跳：每一下「咚-咚」
function heart(t) {
  let v = 0;
  for (const h of HEARTBEATS) {
    if (t >= h) v += Math.exp(-(t - h) / 0.07);
    if (t >= h + 0.17) v += 0.6 * Math.exp(-(t - h - 0.17) / 0.07);
  }
  return v;
}
// 手持感
const handheld = (t, amt) => [noise1(t * 0.9, 1) * amt, noise1(t * 0.8, 7) * amt, noise1(t * 0.6, 3) * amt * 0.0015];

function withCam(ctx, cam, fn) {
  ctx.save();
  ctx.translate(W / 2 + (cam.sx || 0), H / 2 + (cam.sy || 0));
  ctx.rotate(cam.rot || 0);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.x, -cam.y);
  fn(ctx);
  ctx.restore();
}

// 把角色画到独立图层、打光、再合成
function character(ctx, cam, draw, lights, box) {
  const [c, cc] = layer('char');
  withCam(cc, cam, draw);
  // box 是世界坐标，换算到屏幕
  const toScreen = ([x, y]) => [W / 2 + (x - cam.x) * cam.z, H / 2 + (y - cam.y) * cam.z];
  const [a0, a1] = toScreen([box[0], box[1]]);
  const [b0, b1] = toScreen([box[2], box[3]]);
  const sbox = [a0, a1, b0, b1];
  let rim = null;
  for (const L of lights) {
    if (L.tint) {
      const [x0, y0] = toScreen(L.tint.from);
      const [x1, y1] = toScreen(L.tint.to);
      tint(c, x0, y0, x1, y1, L.tint.color, L.tint.alpha);
    } else {
      rim = light(c, { ...L, box: sbox }) || rim;
    }
  }
  ctx.drawImage(c, 0, 0);
  if (rim) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.6;
    ctx.filter = 'blur(6px)';
    ctx.drawImage(rim, 0, 0);
    ctx.restore();
  }
}

// ---------------- 镜头 1：密码锁特写 ----------------
function shotKeypad(ctx, t) {
  const pulse = heart(t);
  const [hx, hy, hr] = handheld(t, 6);
  const z = lerp(1.0, 1.13, easeInOutCubic(t / 1.75)) * (1 + pulse * 0.008);
  const cam = { x: lerp(540, 575, t / 1.75) + hx, y: lerp(960, 990, t / 1.75) + hy, z, rot: lerp(-0.02, -0.06, t / 1.75) + hr };
  withCam(ctx, cam, (c) => drawKeypadCU(c, t, { lit: 1 }));
  // 手指：滑入 → 慢慢靠近 → 犹豫缩回
  const [kx, ky] = keyCenter(1, 1);
  const s = 1.7;
  const tipOff = (92 + 150) * s;
  const near = kf(t, [[0.35, -900], [1.0, -95], [1.42, -38], [1.75, -78]], easeOutCubic);
  const trem = Math.sin(t * 62) * 3 + Math.sin(t * 97) * 2;
  const hand = { x: kx - tipOff + near + trem, y: ky + 40 * s + trem * 0.6, s, rot: -0.05 + Math.sin(t * 71) * 0.006, press: kf(t, [[1.3, 0], [1.45, 0.12], [1.6, 0]]) };
  character(ctx, cam, (c) => drawHandCU(c, hand), [
    { amb: '#C9D6F0' },
    { dir: [1, -0.15], shade: '#3B4E7E' },
    { dir: [1, -0.1], rim: '#9FF4FF', rimW: 7, rimA: 0.95 },
  ], [hand.x - 700, hand.y - 300, hand.x + 400, hand.y + 300]);
  return { bloom: 0.5, grade: [40, 90, 170, 0.16], vig: 0.6 + pulse * 0.08 };
}

// ---------------- 门口全景（镜头 2、6 共用） ----------------
// 门口全景的固定机位：开场和结尾用同一个
const WIDE = { x: 650, y: 1180, z: 1.3 };
const TIM_X = 832;
const TIM_Y = 1566;
const TIM_S = 1.12;
const wideLights = (x) => [
  { amb: '#B4C2E6' },
  { dir: [-1, -0.1], shade: '#2F3D6C' },
  { tint: { from: [KEYPAD.x, KEYPAD.y + 60], to: [x + 120, KEYPAD.y + 60], color: '90,225,255', alpha: 0.22 } },
  { dir: [0.55, -0.85], rim: '#D2E2FF', rimW: 5, rimA: 0.85 },
];

function shotWide1(ctx, t) {
  const lt = t - 1.75;
  const [hx, hy] = handheld(t, 3);
  const e = easeInOutCubic(lt / 1.95);
  const cam = { x: lerp(WIDE.x, 690, e) + hx, y: lerp(WIDE.y, 1210, e) + hy, z: lerp(WIDE.z, 1.4, e) };
  withCam(ctx, cam, (c) => drawFacade(c, t));
  const look = step(t, [[0, 0], [T.look1, 1], [T.look1 + 0.38, 0], [T.look2, 1], [T.look2 + 0.25, 0]]);
  const p = pose({
    x: TIM_X, y: TIM_Y, s: TIM_S, flip: -1, t,
    point: 1, hunch: 0.9, worry: 0.9, sweat: 0.7, tremble: 0.8, lookBack: look,
    lean: kf(t, [[3.2, 0], [3.65, 0.07]]), pupil: 0.65,
    blink: t > 2.2 && t < 2.28 ? 1 : 0,
    cowlick: -0.2,
  });
  withCam(ctx, cam, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath();
    c.ellipse(TIM_X, TIM_Y + 4, 70, 14, 0, 0, Math.PI * 2);
    c.fill();
  });
  character(ctx, cam, (c) => drawTimSide(c, p), wideLights(TIM_X), [TIM_X - 120, TIM_Y - 540, TIM_X + 120, TIM_Y]);
  withCam(ctx, cam, (c) => {
    drawLamp(c, t);
    drawCrow(c, LAMP.headX, LAMP.headY - 14, 1.15, { facing: -1, look: -1, bob: Math.sin(t * 3) * 1.5 });
  });
  return { bloom: 0.4, grade: [40, 80, 170, 0.16], vig: 0.55 };
}

function shotWide2(ctx, t) {
  const lt = t - 8.3;
  const [hx, hy] = handheld(t, 2);
  const follow = 150 * easeInOutCubic(clamp((t - T.walk + 0.1) / 0.7));
  const cam = { x: WIDE.x + follow + hx, y: WIDE.y + hy, z: WIDE.z };
  withCam(ctx, cam, (c) => drawFacade(c, t));
  // 转身：flip 从 -1 经过 0 到 1（中间压扁）
  const flip = t < T.turn ? -1 : t > T.turn + 0.12 ? 1 : lerp(-1, 1, easeInOutCubic((t - T.turn) / 0.12));
  // 走路与开溜
  let x = TIM_X;
  let phase = 0;
  let stride = 0;
  let dash = 0;
  if (t > T.walk) {
    const w = Math.min(t, T.dash) - T.walk;
    x += w * 230;
    phase = w * Math.PI * 2 * 2.1;
    stride = clamp((t - T.walk) / 0.12) * 0.9;
  }
  if (t > T.dash) {
    const d = t - T.dash;
    // 先往后一缩（预备），再弹射出去
    const wind = d < 0.12 ? -Math.sin((d / 0.12) * Math.PI) * 20 : 0;
    const go = d > 0.12 ? Math.pow(d - 0.12, 2) * 2600 + (d - 0.12) * 900 : 0;
    x += wind + go;
    phase += d * Math.PI * 2 * 7;
    stride = 1.7;
    dash = d < 0.12 ? -0.6 : 1;
  }
  const p = pose({
    x, y: TIM_Y, s: TIM_S, flip: Math.abs(flip) < 0.02 ? 0.02 : flip, t,
    point: kf(t, [[T.retract, 1], [T.retract + 0.18, 0]]),
    hunch: 0.9, worry: 0.8, sweat: 0.8, sweatSlide: kf(t, [[8.3, 0.2], [9.15, 0.8]]),
    smile: 0.7, wobble: 1, blush: 0.6, pupil: 0.7,
    bob: t > T.retract + 0.2 && t < T.turn ? -Math.abs(Math.sin((t - T.retract - 0.2) * 9)) * 8 : 0,
    tilt: kf(t, [[8.7, 0], [8.9, -0.12], [9.1, 0]]),
    phase, stride, dash, lean: t > T.walk && t < T.dash ? -0.02 : 0,
    sq: t > T.turn && t < T.turn + 0.12 ? 1.06 : 1,
  });
  // 地面阴影
  withCam(ctx, cam, (c) => {
    if (x < 1500) {
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.beginPath();
      c.ellipse(x, TIM_Y + 4, 70 + stride * 10, 14, 0, 0, Math.PI * 2);
      c.fill();
    }
  });
  if (x < 1550) {
    character(ctx, cam, (c) => {
      // 开溜时的速度线和残影
      if (dash > 0) {
        const k = clamp((t - T.dash - 0.12) / 0.1);
        drawSpeedLines(c, x - 40, TIM_Y - 80, 420, k);
      }
      drawTimSide(c, p);
    }, wideLights(x), [x - 130, TIM_Y - 540, x + 130, TIM_Y]);
  }
  withCam(ctx, cam, (c) => {
    // 起跑扬尘
    drawDust(c, TIM_X + 150, TIM_Y - 10, t - T.dash - 0.1, 12, 4, 1.2);
    drawLamp(c, t);
    const turned = t > T.crow2 - 0.15;
    const caw = t > T.crow2 && t < T.crow2 + 0.35 ? Math.sin(((t - T.crow2) / 0.35) * Math.PI) : 0;
    drawCrow(c, LAMP.headX, LAMP.headY - 14, 1.15, { facing: -1, look: turned ? 1 : -1, caw, bob: Math.sin(t * 3) * 1.5 + (caw > 0 ? -3 * caw : 0), ruffle: caw });
  });
  // 印章：「第 1 次尝试：撤退」
  if (t > T.stamp) {
    const k = clamp((t - T.stamp) / 0.14);
    const sc = lerp(2.8, 1.25, easeInCubic(k));
    ctx.save();
    ctx.translate(540, 640);
    ctx.rotate(-0.14);
    ctx.scale(sc, sc);
    ctx.globalAlpha = clamp(k * 3) * 0.92;
    ctx.strokeStyle = '#E8403A';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.roundRect(-330, -95, 660, 190, 18);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-312, -78, 624, 156, 12);
    ctx.stroke();
    ctx.fillStyle = '#E8403A';
    ctx.font = `30px ${FONT_FUN}`;
    ctx.textAlign = 'center';
    ctx.fillText('第 1 次尝试', 0, -30);
    ctx.font = `92px ${FONT_FUN}`;
    ctx.fillText('撤 退 ！', 0, 62);
    ctx.restore();
  }
  return { bloom: 0.4, grade: [40, 80, 170, 0.16], vig: 0.55, shake: t > T.stamp && t < T.stamp + 0.2 ? (1 - (t - T.stamp) / 0.2) * 10 : 0 };
}

// ---------------- 反打近景（镜头 3、5 共用） ----------------
const F_X = 540;
const F_Y = 1936;
const F_S = 3.0;
const faceLights = [
  { amb: '#B9C6EA' },
  { dir: [-0.4, 0.92], shade: '#2D3866' },
  { tint: { from: [300, 1500], to: [700, 600], color: '90,225,255', alpha: 0.3 } },
  { dir: [0.7, -0.7], rim: '#C9DBFF', rimW: 7, rimA: 0.9 },
];
function fingerFG(ctx, cam, R, x, y, t, blur) {
  const [c, cc] = layer('fg');
  // 肩膀位置（世界坐标 → 屏幕）
  const sx = W / 2 + (F_X - 58 * F_S - cam.x) * cam.z;
  const sy = H / 2 + (F_Y - 190 * F_S - 116 * F_S - cam.y) * cam.z;
  const tr = Math.sin(t * 60) * R * 0.04;
  drawFingerAtCam(cc, x + tr, y + tr * 0.5, R, sx, sy);
  light(c, { amb: '#BFCBEB' });
  tint(c, 200, 1900, 700, 1100, '90,225,255', 0.35);
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(c, 0, 0);
  ctx.restore();
}

function shotFace(ctx, t) {
  const lt = t - 3.7;
  const pulse = heart(t);
  const [hx, hy, hr] = handheld(t, 5);
  const z = lerp(1.0, 1.28, easeInCubic(lt / 1.65)) * (1 + pulse * 0.01);
  const cam = { x: 540 + hx, y: lerp(900, 790, easeInOutCubic(lt / 1.65)) + hy, z, rot: hr };
  drawStreet(ctx, -lt * 30, 0, 1 + lt * 0.03);
  const darts = Math.floor(lt / 0.2) % 2 ? 0.85 : -0.85;
  const gulp = t > T.gulp && t < T.gulp + 0.35;
  const p = pose({
    x: F_X, y: F_Y, s: F_S, t, hideR: true,
    worry: 1, pupil: lerp(0.7, 0.45, lt / 1.65), lookX: t < T.gulp ? darts : 0, lookY: t > T.gulp + 0.35 ? 0.3 : 0,
    sweat: 1, sweatSlide: kf(t, [[3.7, 0], [5.35, 0.9]], (u) => u), open: t > T.gulp + 0.3 ? 1.2 : 1,
    mouth: gulp ? 'gulp' : 'flat', mouthW: 0.7, browY: gulp ? 0.6 : 0.2,
    bob: gulp ? Math.sin(((t - T.gulp) / 0.35) * Math.PI) * 5 : 0,
    tremble: 0.6, hunch: 1, cowlick: -0.5, blink: t > 3.95 && t < 4.02 ? 1 : 0,
    armL: { a: 0.12, b: 0.2, hand: 'relax' },
  });
  character(ctx, cam, (c) => drawTimFront(c, p), faceLights, [F_X - 210, F_Y - 1450, F_X + 210, F_Y - 300]);
  // 前景：自己的手指伸向镜头（越来越近、越来越虚）
  const k = easeInCubic(lt / 1.65);
  const R = lerp(62, 130, k);
  fingerFG(ctx, cam, R, lerp(470, 500, k), lerp(1250, 1120, k), t, lerp(1.5, 6, k));
  return { bloom: 0.35, grade: [40, 80, 170, 0.14], vig: 0.6 + pulse * 0.1 };
}

function shotReality(ctx, t) {
  const lt = t - 7.35;
  const [hx, hy, hr] = handheld(t, 2);
  const cam = { x: 540 + hx, y: 840 + hy, z: 1.16, rot: hr };
  drawStreet(ctx, -36, 0, 1.03);
  const settle = Math.exp(-lt / 0.12);
  const crowed = t > T.crow1 + 0.05;
  const p = pose({
    x: F_X, y: F_Y, s: F_S, t, hideR: true,
    open: crowed ? 1.0 : 1.35, pupil: crowed ? 0.7 : 0.4,
    spike: 0.7 * settle, cowlick: 0.8 * settle * Math.cos(lt * 40) - 0.2,
    worry: 0.9, browY: crowed ? 0.3 : 0.9,
    lookX: kf(t, [[T.crow1 + 0.02, 0], [T.crow1 + 0.14, 0.9]]),
    blink: t > 7.57 && t < 7.67 ? 1 : 0,
    smile: kf(t, [[T.smile, 0], [T.smile + 0.15, 0.75]]), wobble: t > T.smile ? 1 : 0,
    blush: kf(t, [[T.smile, 0], [T.smile + 0.3, 0.8]]),
    sweat: 1, sweatSlide: kf(t, [[T.smile, 0.1], [8.3, 0.6]], (u) => u),
    hunch: 1, tremble: 0.3,
  });
  character(ctx, cam, (c) => drawTimFront(c, p), faceLights, [F_X - 210, F_Y - 1450, F_X + 210, F_Y - 300]);
  fingerFG(ctx, cam, 100, 480, 1200, t * 0.15, 4);
  // 拟声字「嘎——」
  if (t > T.crow1) {
    const k = clamp((t - T.crow1) / 0.12);
    ctx.save();
    ctx.translate(840, 330);
    ctx.rotate(0.12 + Math.sin(t * 20) * 0.02);
    ctx.scale(easeOutBack(k), easeOutBack(k));
    ctx.font = `120px ${FONT_FUN}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(10,14,30,0.85)';
    ctx.strokeText('嘎——', 0, 0);
    ctx.fillStyle = '#E8ECF5';
    ctx.fillText('嘎——', 0, 0);
    ctx.restore();
  }
  return { bloom: 0.3, grade: [60, 80, 140, 0.2], vig: 0.6, desat: 0.25 };
}

// ---------------- 镜头 4：警报幻想 ----------------
function shotAlarm(ctx, t0) {
  // 刹车：最后几帧画面定住
  const t = Math.min(t0, T.brake);
  const lt = t - T.alarm;
  const impact = T.sign + 0.24;
  const shakeAmt = (t > impact ? 26 * Math.exp(-(t - impact) / 0.25) : 0) + 6;
  const sx = noise1(t * 30, 2) * shakeAmt;
  const sy = noise1(t * 30, 5) * shakeAmt;
  const cam = { x: 540, y: lerp(1010, 960, easeOutCubic(lt / 0.5)), z: lerp(1.12, 1.0, easeOutCubic(lt / 0.5)), sx, sy, rot: noise1(t * 8, 9) * 0.02 };
  withCam(ctx, cam, (c) => drawAlarmBG(c, t, 1));
  // 顶光：抓到你了
  cone(ctx, W / 2, -50, 0, 0.3, 2000, '255,235,220', 0.22 + 0.06 * Math.sin(t * 25));
  // 跳起 → 悬空发抖 → 落地
  const jump = t < T.scream ? 0 : t < T.scream + 0.22 ? easeOutCubic((t - T.scream) / 0.22) : t < 6.9 ? 1 + Math.sin((t - T.scream) * 5) * 0.04 : t < 7.1 ? 1 - easeInCubic((t - 6.9) / 0.2) : 0;
  const land = t > 7.1 ? Math.exp(-(t - 7.1) / 0.08) : 0;
  const flail = Math.sin(t * 28);
  const p = pose({
    x: 540, y: 1790, s: 1.75, t,
    jump: jump * 1.1, tuck: jump * 0.7, sq: 1 - land * 0.18 + jump * 0.04,
    mouth: 'scream', mouthOpen: 0.7 + 0.3 * Math.sin(t * 40) ** 2, open: 1.6, pupil: 0.55, browY: 1, worry: 1,
    spike: clamp((t - T.scream) / 0.08), cowlick: 1, tremble: 1.5, hunch: 0,
    armL: { a: 2.55 + flail * 0.25, b: 0.4 - flail * 0.3, hand: 'open' },
    armR: { a: 2.55 - flail * 0.25, b: 0.4 + flail * 0.3, hand: 'open' },
  });
  withCam(ctx, cam, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.beginPath();
    c.ellipse(540, 1794, 130 * (1 - jump * 0.35), 24, 0, 0, Math.PI * 2);
    c.fill();
    glow(c, 540, 1794, 300, '255,230,210', 0.25);
  });
  character(ctx, cam, (c) => drawTimFront(c, p), [
    { amb: '#FFB0A0' },
    { dir: [0, -1], shade: '#6A0A14' },
    { dir: [0.2, -1], rim: '#FFF1E8', rimW: 9, rimA: 1 },
  ], [540 - 260, 1790 - 1050, 540 + 260, 1790]);
  withCam(ctx, cam, (c) => {
    drawBeacons(c, t);
    const drop = t < T.sign ? 0 : clamp((t - T.sign) / 0.24);
    // 砸下来后弹两下
    const bounce = drop < 1 ? easeInCubic(drop) : 1 - Math.abs(Math.sin((t - impact) * 14)) * 0.05 * Math.exp(-(t - impact) / 0.2);
    if (t > T.sign) drawWarningSign(c, t, bounce);
    drawDust(c, 540, 560, t - impact, 14, 9, 1.6, '255,190,160');
  });
  // 撞击闪白（只有一两帧，避免频闪）
  const flash = t0 < T.alarm + 0.07 ? 0.85 : t > impact && t < impact + 0.05 ? 0.35 : 0;
  if (flash) {
    ctx.fillStyle = `rgba(255,255,255,${flash})`;
    ctx.fillRect(0, 0, W, H);
  }
  const braking = t0 > T.brake ? clamp((t0 - T.brake) / 0.08) : 0;
  return { bloom: 0.3, vig: 0.7, chroma: 6 + shakeAmt * 0.3, desat: braking * 0.9, grade: null };
}

// ---------------- 合成 ----------------
const SHOT_FN = { keypad: shotKeypad, wide1: shotWide1, face: shotFace, alarm: shotAlarm, reality: shotReality, wide2: shotWide2 };

function drawSubtitle(ctx, t, durs) {
  VO.forEach((v, i) => {
    // 字幕比配音多停 0.25 秒，但不能压到下一句
    const next = VO[i + 1] ? VO[i + 1].start - 0.06 : Infinity;
    const end = Math.min(next, v.start + (durs[v.id] ?? VO_EST[v.id]) + 0.25);
    if (t < v.start - 0.05 || t > end) return;
    const a = clamp((t - v.start + 0.05) / 0.12) * clamp((end - t) / 0.12);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `700 58px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(8,10,20,0.75)';
    ctx.strokeText(v.text, W / 2, 1540);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(v.text, W / 2, 1540);
    ctx.restore();
  });
}

export async function createFilm(canvas, { subtitles = true } = {}) {
  const ctx = canvas.getContext('2d');
  let durs = {};
  try {
    durs = await (await fetch(new URL('../assets/vo/durations.json', import.meta.url))).json();
  } catch {
    durs = {};
  }
  await Promise.all([
    document.fonts.load('700 58px "Noto Sans SC"', '两年前第一次来到因为不敢按密码于是他跑了请输入'),
    document.fonts.load('500 52px "Noto Sans SC"', '请输入密码0123456789*#'),
    document.fonts.load(`120px "ZCOOL KuaiLe"`, '非法闯入？！嘎——第次尝试撤退1'),
  ]);
  const [scene, sc] = layer('scene');
  void scene;
  return {
    render(t) {
      const shot = shotAt(t);
      sc.fillStyle = '#000';
      sc.fillRect(0, 0, W, H);
      const post = SHOT_FN[shot.id](sc, t) || {};
      // 后期
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = post.desat ? `saturate(${1 - post.desat})` : 'none';
      if (post.shake) ctx.translate(noise1(t * 40, 1) * post.shake, noise1(t * 40, 2) * post.shake);
      ctx.drawImage(scene, 0, 0);
      ctx.filter = 'none';
      ctx.restore();
      if (post.chroma) chroma(ctx, scene, post.chroma);
      if (post.bloom) bloom(ctx, scene, { blur: 40, alpha: post.bloom, threshold: 0.35 });
      if (post.grade) {
        const [r, g, b, a] = post.grade;
        ctx.save();
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = `rgba(${r},${g},${b},${a * 2})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      vignette(ctx, post.vig ?? 0.5);
      grain(ctx, t, 0.07);
      if (subtitles) drawSubtitle(ctx, t, durs);
      // 片头 0.25 秒从黑淡入
      if (t < 0.25) {
        ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.25})`;
        ctx.fillRect(0, 0, W, H);
      }
      // 片尾淡出
      const endFade = clamp((t - (SHOTS[SHOTS.length - 1].end - 0.35)) / 0.35);
      if (endFade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${endFade})`;
        ctx.fillRect(0, 0, W, H);
      }
    },
  };
}

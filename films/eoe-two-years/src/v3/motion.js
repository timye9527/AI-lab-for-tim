// 第三版动作测试（约 9 秒）：紧张上台 → 松弛唱跳，看火柴人动起来的感觉
import { drawStick, tim, pal } from './stick.js';
import { stageBG, showroomBG, audience, shakeMarks, notes } from './frames3.js';
import { K, sparkle, subtitle, grain } from '../v2/frames.js';

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 9.0;
export const M = {
  cut: 4.4, // 切到展厅
  clap: 3.3, // 台下开始鼓掌
  beat0: 4.4, // 120 BPM 起点
  end: 9.0,
};
export const VO3 = [
  { id: 'm1', start: 0.3, text: '第一次上台，稿子抖得比声音还响。' },
  { id: 'm2', start: 4.75, text: '但他开始学着承担，也学着放松。' },
];

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};

function cache(draw) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  draw(c.getContext('2d'));
  return c;
}
let BG = null;

function withCam(ctx, z, cx, cy, fn) {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(z, z);
  ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}

function stage(ctx, t) {
  const z = 1 + 0.12 * ease(t / M.cut);
  withCam(ctx, z, 540, 1050, () => {
    ctx.drawImage(BG.stage, 0, 0);
    const calm = clamp((t - M.clap - 0.3) / 0.8);
    const knock = Math.sin(t * 22) * 8;
    drawStick(ctx, tim('first', {
      x: 540, y: 1400, s: 1.45, t, tremble: 1 - calm * 0.55, sweat: 1, sweatY: (t % 1.6) / 1.6,
      eyes: calm > 0.5 ? 'dot' : 'shock', brows: 'worry', mouth: calm > 0.5 ? 'wobble' : 'flat', blush: calm * 0.8,
      armL: { to: [20, -330], bend: 1 }, armR: { to: [-24, -322], bend: -1 },
      prop: { type: 'paper', hand: 'L', shake: 1 - calm * 0.6 },
      legL: { a: 6, b: -22 + knock }, legR: { a: -6, b: 22 - knock },
    }));
    if (calm < 0.6) shakeMarks(ctx, 540 + Math.sin(t * 40) * 4, 1180, 0, 1.2);
    // 「抖」字跟着抖
    ctx.fillStyle = K.cream;
    ctx.font = '900 64px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1 - calm;
    for (const [x, y, r] of [[250, 560, -0.15], [840, 520, 0.15]]) {
      ctx.save();
      ctx.translate(x + Math.sin(t * 50 + x) * 6, y + Math.cos(t * 47 + y) * 6);
      ctx.rotate(r);
      ctx.fillText('抖', 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    audience(ctx, t, t > M.clap);
  });
}

function room(ctx, t) {
  const lt = t - M.cut;
  const beat = (t - M.beat0) / 0.5;
  const onBeat = Math.abs(Math.sin(Math.PI * beat));
  const sway = Math.sin(lt * 0.9) * 10;
  withCam(ctx, 1.02, 540 + sway, 960, () => {
    ctx.drawImage(BG.room, 0, 0);
    // 伙伴们跟着节拍点头、拍手
    const pals = [
      [1, 130, 1400, 0.75, 1],
      [4, 290, 1360, 0.68, 1],
      [0, 800, 1360, 0.68, -1],
      [2, 960, 1410, 0.75, -1],
    ];
    pals.forEach(([i, x, y, s, f], k) => {
      const up = Math.floor(beat + k * 0.5) % 2 === 0;
      drawStick(ctx, pal(i, {
        x, y, s, face: f, t, bob: -onBeat * 14, eyes: 'happy', mouth: 'grin',
        armL: up ? { a: 150, b: 10 } : { a: 60, b: 80 }, armR: up ? { a: -150, b: -10 } : { a: -60, b: -80 },
      }));
    });
    // Tim：在台前来回走、跟着拍子跳，话筒在嘴边
    const x = 540 + Math.sin((lt / 4.4) * Math.PI * 2) * 190;
    const vx = Math.cos((lt / 4.4) * Math.PI * 2);
    const face = vx >= 0 ? 1 : -1;
    const kick = Math.floor(beat) % 2 === 0;
    ctx.fillStyle = 'rgba(30,26,34,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, 1640, 140 - onBeat * 30, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    drawStick(ctx, tim('now', {
      x, y: 1640, s: 1.3, face, t, jump: onBeat * 0.3, glasses: 'sun', mouth: onBeat > 0.5 ? 'sing' : 'grin', eyes: 'dot',
      lean: -face * 6, squash: 1 - (1 - onBeat) * 0.04,
      prop: { type: 'mic', hand: 'R', angle: -40 * face }, armR: { to: [56 * face, -430], bend: -face },
      armL: { a: (kick ? 150 : 120) * -face * -1, b: 20 * face },
      legL: kick ? { a: 40 * face, b: -70 * face } : { a: 10, b: 0 }, legR: kick ? { a: -10, b: 0 } : { a: -40 * face, b: 70 * face },
    }));
    const ny = (lt * 120) % 300;
    notes(ctx, [[x + 200 * face, 1060 - ny, 1], [x + 280 * face, 980 - ((ny + 150) % 300), 0.75]]);
    const tw = 0.6 + 0.4 * Math.sin(t * 6);
    for (const [sx, sy, r] of [[200, 1150, 26], [900, 1080, 34], [480, 1080, 18]]) sparkle(ctx, sx, sy, r * tw, K.yellow, 4);
  });
}

export async function createMotion(canvas, { subtitles = true } = {}) {
  const ctx = canvas.getContext('2d');
  await document.fonts.load('900 64px "Noto Sans SC"', '抖第一次上台稿子得比声音还响但他开始学着承担也放松');
  await document.fonts.load('700 54px "Noto Sans SC"', '第一次上台稿子抖得比声音还响但他开始学着承担也放松，。');
  let durs = {};
  try {
    durs = await (await fetch(new URL('../../assets/vo-v3/durations.json', import.meta.url))).json();
  } catch {
    durs = {};
  }
  BG = { stage: cache(stageBG), room: cache(showroomBG) };
  return {
    render(t) {
      ctx.save();
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      if (t < M.cut) stage(ctx, t);
      else room(ctx, t);
      if (subtitles) {
        for (const v of VO3) {
          const end = v.start + (durs[v.id] || 3.5) + 0.2;
          if (t >= v.start && t <= end) subtitle(ctx, v.text, t < M.cut ? 1560 : 1800);
        }
      }
      grain(ctx, 0.04);
      const fade = t < 0.2 ? 1 - t / 0.2 : t > M.end - 0.35 ? (t - (M.end - 0.35)) / 0.35 : 0;
      if (fade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${clamp(fade)})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    },
  };
}

// 完整版第二至七幕：每幕一个函数，参数是本幕内的时间（秒）
import { drawStick, tim, pal, stick, INK } from '../v3/stick.js';
import { stageBG, showroomBG, audience, shakeMarks, notes } from '../v3/frames3.js';
import { K, sparkle, outline, rect, glow, eoeLogo, frameDoor, frameWarm } from '../v2/frames.js';
import { W, H, SANS, FUN, clamp, lerp, ease, easeOut, easeIn, kf, cam, layer, pop, bubble, shadow, stringLights, noise } from './u5.js';
import { ACT2, ACT3, ACT4, ACT5, ACT6, ACT7 } from './timeline5.js';

// ---------------- 背景 ----------------
let BG = null;
const DOOR_KEY = [512, 935];
const TX = 760;
const TY = 1588;

function clubBG(ctx) {
  // 最早的活动室：奶油色墙、小彩灯、EOE 横幅、讲台
  ctx.fillStyle = K.cream;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(540, 700, 100, 540, 800, 1100);
  g.addColorStop(0, 'rgba(232,118,58,0.25)');
  g.addColorStop(1, 'rgba(232,118,58,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 横幅
  outline(ctx, rect(170, 300, 740, 190, 18), K.navy, 6);
  eoeLogo(ctx, 340, 395, 1.2);
  ctx.fillStyle = K.cream;
  ctx.font = `900 54px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.fillText('中文演讲俱乐部', 470, 415);
  // 地面
  outline(ctx, rect(-20, 1320, W + 40, 640), '#E2C9A0', 6);
  ctx.strokeStyle = 'rgba(30,26,34,0.15)';
  ctx.lineWidth = 4;
  for (let x = -100; x < W + 100; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, 1320);
    ctx.lineTo(x - 120, H);
    ctx.stroke();
  }
  // 讲台
  outline(ctx, new Path2D('M 780,1330 L 960,1330 L 940,1080 L 800,1080 Z'), '#B98B57', 6);
  outline(ctx, rect(770, 1060, 200, 30, 8), '#9C7244', 5);
  for (const [x, y, r] of [[120, 650, 30], [960, 600, 24], [90, 1180, 20]]) sparkle(ctx, x, y, r, K.red, 4);
}
function officeBG(ctx) {
  // 写字楼门口（灰）
  ctx.fillStyle = '#C9CCD3';
  ctx.fillRect(0, 0, W, H);
  outline(ctx, rect(80, 140, 920, 1240), '#9FA6B2', 6);
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 4; c++) outline(ctx, rect(130 + c * 220, 190 + r * 150, 170, 110, 4), '#7E8796', 4);
  }
  outline(ctx, rect(380, 1150, 320, 230, 4), '#5F6774', 5);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(540, 1150);
  ctx.lineTo(540, 1380);
  ctx.stroke();
  outline(ctx, rect(-20, 1380, W + 40, 600), '#A7ABB3', 6);
}
function parkBG(ctx) {
  ctx.fillStyle = '#BFC7D6';
  ctx.fillRect(0, 0, W, H);
  // 云
  for (const [x, y, s] of [[240, 360, 1], [760, 260, 0.8], [880, 560, 0.6]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    outline(ctx, new Path2D('M -140,40 Q -150,-20 -90,-30 Q -70,-90 0,-80 Q 60,-110 100,-50 Q 160,-50 150,40 Z'), '#F2F2F0', 5);
    ctx.restore();
  }
  outline(ctx, rect(-20, 1300, W + 40, 700), '#9AA59B', 6);
  // 树
  outline(ctx, rect(860, 900, 50, 420), '#7C6A5C', 5);
  outline(ctx, new Path2D('M 885,640 m -170,0 a 170,150 0 1,0 340,0 a 170,150 0 1,0 -340,0'), '#7F9183', 6);
  // 长椅
  outline(ctx, rect(240, 1260, 560, 34, 8), '#8E7B66', 5);
  outline(ctx, rect(240, 1170, 560, 30, 8), '#8E7B66', 5);
  outline(ctx, rect(280, 1294, 24, 90), '#5E5248', 4);
  outline(ctx, rect(736, 1294, 24, 90), '#5E5248', 4);
}
function mountainBG(ctx) {
  ctx.fillStyle = '#BFD6F2';
  ctx.fillRect(0, 0, W, H);
  outline(ctx, new Path2D('M -50,1300 L 300,600 L 560,1100 L 760,760 L 1130,1300 Z'), '#7FA48C', 6);
  outline(ctx, new Path2D('M 250,700 L 300,600 L 350,700 Z'), '#FFFFFF', 4);
  outline(ctx, rect(-20, 1290, W + 40, 700), '#9DBB7E', 6);
  outline(ctx, new Path2D('M 640,1300 L 780,1110 L 920,1300 Z'), K.orange, 6);
}
function halloweenBG(ctx) {
  ctx.fillStyle = '#2B1E3B';
  ctx.fillRect(0, 0, W, H);
  outline(ctx, new Path2D('M 900,260 m -110,0 a 110,110 0 1,0 220,0 a 110,110 0 1,0 -220,0'), '#F4D35E', 5);
  outline(ctx, rect(-20, 1300, W + 40, 700), '#3D2C52', 6);
  for (const x of [140, 940]) {
    outline(ctx, new Path2D(`M ${x},1310 m -70,0 a 70,56 0 1,0 140,0 a 70,56 0 1,0 -140,0`), K.orange, 6);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(x - 34, 1296);
    ctx.lineTo(x - 14, 1296);
    ctx.lineTo(x - 24, 1280);
    ctx.moveTo(x + 14, 1296);
    ctx.lineTo(x + 34, 1296);
    ctx.lineTo(x + 24, 1280);
    ctx.fill();
  }
}
function dinnerBG(ctx) {
  ctx.fillStyle = '#F3E3C3';
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 540, 600, 800, '232,118,58', 0.35);
  stringLights(ctx, -40, 380, 1120, 380, 140, 0);
  outline(ctx, rect(-20, 1420, W + 40, 560), '#B98B57', 6);
  outline(ctx, rect(60, 1250, 960, 60, 16), '#FAF3D7', 6);
  for (const x of [200, 420, 660, 880]) {
    outline(ctx, new Path2D(`M ${x},1250 m -50,0 a 50,16 0 1,0 100,0 a 50,16 0 1,0 -100,0`), '#FFFFFF', 4);
  }
}
function decoratedShowroom(ctx) {
  showroomBG(ctx);
  // 两周年装饰：横幅 + 彩灯 + 气球
  outline(ctx, rect(170, 1000, 420, 30, 6), '#2B2F3A', 5);
  stringLights(ctx, 40, 270, 1040, 270, 90, 0, 18);
  outline(ctx, rect(250, 300, 580, 150, 20), K.red, 6);
  ctx.fillStyle = K.cream;
  ctx.font = `900 70px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText('EOE 两周年', 540, 400);
  for (const [x, y, c] of [[110, 520, K.yellow], [170, 600, K.peri], [960, 540, K.orange], [900, 620, K.red]]) {
    outline(ctx, new Path2D(`M ${x},${y} m -40,0 a 40,50 0 1,0 80,0 a 40,50 0 1,0 -80,0`), c, 5);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 50);
    ctx.quadraticCurveTo(x + 14, y + 120, x, y + 190);
    ctx.stroke();
  }
}

export function initActs() {
  BG = {
    door: layer((c) => frameDoor(c, () => {})),
    club: layer(clubBG),
    stage: layer(stageBG),
    office: layer(officeBG),
    park: layer(parkBG),
    room: layer(showroomBG),
    party: layer(decoratedShowroom),
    mountain: layer(mountainBG),
    halloween: layer(halloweenBG),
    dinner: layer(dinnerBG),
    end: layer((c) => frameWarm(c, () => {})),
  };
}

// 门口的「嘀嘀嘀」小字
function beeps(ctx, lt, t0, n = 4) {
  for (let i = 0; i < n; i++) {
    const tt = lt - (t0 + i * 0.16);
    if (tt > 0 && tt < 0.5) pop(ctx, '嘀', 430 + i * 50, 800 - tt * 80, clamp(tt / 0.1), { size: 46, rot: -0.1 });
  }
}

// ======================= 第二幕：第二次，混进去 =======================
export function act2(ctx, lt) {
  const B = ACT2.beats;
  if (lt < B.open) {
    // 门口：伙伴熟练地按密码，Tim 像特工一样踮脚跟在后面
    cam(ctx, lerp(1.0, 1.08, ease(lt / B.open)), 560, 1000, () => {
      ctx.drawImage(BG.door, 0, 0);
      pop(ctx, '几天后', 200, 220, clamp(lt / 0.2), { size: 60, rot: -0.08 });
      const px = kf(lt, [[0, 1200], [0.6, 640]], (u) => u);
      shadow(ctx, px, TY, 110);
      drawStick(ctx, pal(1, {
        x: px, y: TY, s: 1.25, face: -1, t: lt, mouth: 'smile',
        armR: lt > B.typeAt && lt < B.typeAt + 0.9 ? { to: [(DOOR_KEY[0] - px) / 1.25, (DOOR_KEY[1] - TY) / 1.25], bend: -1 } : { a: -10, b: -20 },
        legL: { a: lt < 0.6 ? Math.sin(lt * 18) * 25 : 0 }, legR: { a: lt < 0.6 ? -Math.sin(lt * 18) * 25 : 0 },
      }));
      beeps(ctx, lt, B.typeAt + 0.1);
      // Tim：从右边踮脚溜进来，膝盖高抬、身体压低
      const tx = kf(lt, [[0.4, 1250], [2.6, 900], [3.4, 820]], (u) => u);
      const ph = lt * 9;
      shadow(ctx, tx, TY, 100);
      drawStick(ctx, tim('before', {
        x: tx, y: TY + 10, s: 1.2, face: -1, t: lt, hunch: 1, lean: -14, squash: 0.92,
        eyes: 'dot', look: [-1, 0], brows: 'flat', mouth: 'flat',
        armL: { a: 70, b: 80 }, armR: { a: -40, b: -110 },
        legL: { a: 30 + Math.sin(ph) * 30, b: -80 }, legR: { a: -20 - Math.sin(ph) * 30, b: 40 },
      }));
      if (lt > 1.2) pop(ctx, '嘘——', tx - 60, 1060, clamp((lt - 1.2) / 0.15), { size: 52, rot: 0.1 });
    });
    return { vig: 0.4 };
  }
  // 门一开：暖光、笑声、掌声涌出来
  const ot = lt - B.open;
  const burst = clamp(ot / 0.35);
  cam(ctx, lerp(1.15, 1.0, easeOut(ot / 1.2)), 540, 980, () => {
    ctx.drawImage(BG.club, 0, 0);
    stringLights(ctx, -40, 160, 1120, 160, 120, lt, 16);
    const cheer = Math.abs(Math.sin(lt * 7));
    const pals = [[0, 150, 1520, 0.9, 1], [2, 330, 1460, 0.82, 1], [3, 770, 1460, 0.82, -1], [4, 940, 1520, 0.9, -1]];
    for (const [i, x, y, s, f] of pals) {
      drawStick(ctx, pal(i, {
        x, y, s, face: f, t: lt, eyes: 'happy', mouth: 'grin', bob: -cheer * 10,
        armL: { a: 150 + cheer * 15, b: 10 }, armR: { a: -150 - cheer * 15, b: -10 },
      }));
    }
    // Tim 在门口愣住，然后笑了
    const smile = lt > B.open + 1.0;
    shadow(ctx, 540, 1700, 130);
    drawStick(ctx, tim('before', {
      x: 540, y: 1700, s: 1.3, face: 0, t: lt, hunch: smile ? 0.4 : 0.8,
      eyes: smile ? 'happy' : 'shock', mouth: smile ? 'grin' : 'o', brows: smile ? 'none' : 'up', blush: smile ? 0.7 : 0,
      armL: smile ? { a: 30, b: 60 } : { a: 10, b: 10 }, armR: smile ? { a: -30, b: -60 } : { a: -10, b: -10 },
    }));
    if (lt > B.levelUp) {
      const k = clamp((lt - B.levelUp) / 0.2);
      for (const [x, y, r] of [[200, 820, 40], [880, 760, 50], [540, 640, 30]]) sparkle(ctx, x, y, r * k, K.yellow, 5);
      pop(ctx, '当场入会！', 540, 720, k, { size: 120, rot: -0.06, fill: K.yellow, stroke: K.red, font: SANS });
    }
  });
  // 开门那一下的暖光闪
  if (ot < 0.35) {
    ctx.fillStyle = `rgba(255,236,190,${0.9 * (1 - burst)})`;
    ctx.fillRect(0, 0, W, H);
  }
  return { vig: 0.25 };
}

// ======================= 第三幕：颤抖的第一次 =======================
export function act3(ctx, lt) {
  const B = ACT3.beats;
  if (lt < B.second) {
    const calm = clamp((lt - B.clap - 0.4) / 1.4);
    cam(ctx, 1 + 0.1 * ease(lt / B.second), 540, 1060, () => {
      ctx.drawImage(BG.stage, 0, 0);
      const knock = Math.sin(lt * 22) * 8 * (1 - calm);
      drawStick(ctx, tim('first', {
        x: 540, y: 1400, s: 1.45, t: lt, tremble: 1 - calm * 0.7, sweat: 1 - calm * 0.5, sweatY: (lt % 1.6) / 1.6,
        eyes: calm > 0.5 ? 'dot' : 'shock', brows: 'worry', mouth: calm > 0.6 ? 'smile' : 'wobble', blush: calm * 0.7,
        armL: { to: [20, -330], bend: 1 }, armR: { to: [-24, -322], bend: -1 },
        prop: { type: 'paper', hand: 'L', shake: 1 - calm * 0.8 },
        legL: { a: 6, b: -22 + knock }, legR: { a: -6, b: 22 - knock },
      }));
      if (calm < 0.5) shakeMarks(ctx, 540 + Math.sin(lt * 40) * 4, 1180, 0, 1.2);
      ctx.globalAlpha = 1 - calm;
      ctx.fillStyle = K.cream;
      ctx.font = `900 64px ${SANS}`;
      ctx.textAlign = 'center';
      for (const [x, y, r] of [[250, 560, -0.15], [840, 520, 0.15]]) {
        ctx.save();
        ctx.translate(x + Math.sin(lt * 50 + x) * 6, y + Math.cos(lt * 47 + y) * 6);
        ctx.rotate(r);
        ctx.fillText('抖', 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      // 台下有人憋笑，后来都在鼓掌
      audience(ctx, lt, lt > B.clap);
      if (lt > 1.6 && lt < B.clap) pop(ctx, '噗…', 260, 1640, clamp((lt - 1.6) / 0.15), { size: 50, rot: -0.1 });
    });
    return { vig: 0.45 };
  }
  // 第二次、第三次：站得越来越直
  const third = lt > B.third;
  const k = third ? lt - B.third : lt - B.second;
  cam(ctx, 1.05, 540, 1060, () => {
    ctx.drawImage(BG.stage, 0, 0);
    drawStick(ctx, tim('first', third
      ? { x: 540, y: 1400, s: 1.45, t: lt, hunch: 0, eyes: 'dot', mouth: 'grin', brows: 'none', armL: { a: 120, b: 30 }, armR: { a: -40, b: -60 }, prop: { type: 'paper', hand: 'R' } }
      : { x: 540, y: 1400, s: 1.45, t: lt, hunch: 0.3, tremble: 0.25, eyes: 'dot', mouth: 'smile', brows: 'flat', armL: { to: [30, -330], bend: 1 }, armR: { a: -20, b: -10 }, prop: { type: 'paper', hand: 'L' } }));
    audience(ctx, lt, true);
    pop(ctx, third ? '第 3 次' : '第 2 次', 820, 360, clamp(k / 0.15), { size: 72, rot: 0.08, fill: K.yellow, stroke: K.navyDeep, font: SANS });
  });
  return { vig: 0.4 };
}

// ======================= 第四幕：人生按下暂停键 =======================
export function act4(ctx, lt) {
  const B = ACT4.beats;
  let grey = 1;
  if (lt < B.bench) {
    // 抱着纸箱站在写字楼门口
    cam(ctx, 1.0 + 0.04 * ease(lt / B.bench), 540, 1000, () => {
      ctx.drawImage(BG.office, 0, 0);
      shadow(ctx, 540, 1600, 120);
      drawStick(ctx, tim('first', {
        x: 540, y: 1600, s: 1.3, t: lt, hunch: 0.7, eyes: 'line', mouth: 'flat', brows: 'worry',
        armL: { to: [40, -300], bend: 1 }, armR: { to: [-40, -300], bend: -1 }, prop: { type: 'box', hand: 'L' },
      }));
      pop(ctx, '工作没了。', 540, 500, clamp((lt - 0.4) / 0.2), { size: 96, rot: -0.04, fill: '#FFFFFF', stroke: '#3A3F4D', font: SANS });
    });
  } else if (lt < B.phone) {
    // 公园长椅上发呆
    cam(ctx, 1.0, 540, 1000, () => {
      ctx.drawImage(BG.park, 0, 0);
      drawStick(ctx, tim('first', {
        x: 520, y: 1520, s: 1.1, t: lt, eyes: 'dot', look: [0, -1], mouth: 'flat', brows: 'flat',
        legL: { a: 85, b: -85 }, legR: { a: 80, b: -80 }, armL: { a: 20, b: 20 }, armR: { a: -20, b: -20 },
      }));
      pop(ctx, '人生 GAP 3 个月', 540, 500, clamp((lt - B.bench - 0.2) / 0.2), { size: 84, rot: 0.03, fill: '#FFFFFF', stroke: '#3A3F4D', font: SANS });
      // 飘过的「...」
      ctx.fillStyle = INK;
      for (let i = 0; i < 3; i++) {
        if ((lt - B.bench) * 3 > i) {
          ctx.beginPath();
          ctx.arc(620 + i * 34, 900 - i * 10, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  } else {
    // 手机狂弹群消息 → 巨手把他拽走 → 颜色回来
    const pt = lt - B.phone;
    const yank = lt > B.hand ? lt - B.hand : 0;
    grey = lt > B.hand + 0.25 ? clamp(1 - (lt - B.hand - 0.25) / 0.4) : 1;
    cam(ctx, 1.0, 540, 1000, () => {
      ctx.drawImage(BG.park, 0, 0);
      const flyY = yank > 0 ? -easeIn(yank / 0.5) * 1600 : 0;
      drawStick(ctx, tim('first', {
        x: 520 + (yank > 0 ? easeIn(yank / 0.5) * 300 : 0), y: 1520 + flyY, s: 1.1, t: lt, eyes: yank > 0 ? 'shock' : 'dot',
        mouth: yank > 0 ? 'o' : 'flat', brows: yank > 0 ? 'up' : 'worry',
        legL: { a: 85, b: -85 }, legR: { a: 80, b: -80 },
        armL: yank > 0 ? { a: 170, b: 0 } : { a: 60, b: 70 }, armR: yank > 0 ? { a: -60, b: -40 } : { a: -60, b: -70 },
        prop: yank > 0 ? null : { type: 'phone', hand: 'L' },
      }));
      // 无奈地摊手
      if (pt > 1.6 && yank === 0) pop(ctx, '…', 680, 900, 1, { size: 80 });
      const msgs = [['周四来不来？', 300, 700, 0.15], ['缺个主持！', 700, 520, 0.55], ['活动谁来搞？', 380, 360, 0.95]];
      for (const [m, x, y, d] of msgs) bubble(ctx, m, x, y - (yank > 0 ? yank * 1200 : 0), clamp((pt - d) / 0.18));
      if (lt > B.hand - 0.25) {
        // 巨大的卡通手从上面伸下来
        const reach = lt < B.hand ? easeOut((lt - (B.hand - 0.25)) / 0.25) : 1;
        const hy = lerp(-600, 900, reach) + flyY;
        ctx.save();
        ctx.translate(640, hy);
        outline(ctx, rect(-60, -900, 120, 860, 0), '#FFFFFF', 7);
        outline(ctx, new Path2D('M -110,-60 Q -130,80 -40,120 L 60,120 Q 140,80 120,-60 Z'), '#FFFFFF', 7);
        for (const dx of [-80, -30, 20, 70]) outline(ctx, rect(dx - 18, 60, 36, 110, 18), '#FFFFFF', 6);
        ctx.restore();
      }
    });
  }
  return { vig: 0.35, desat: grey * 0.85 };
}

// ======================= 第五幕：不太靠谱的会长 =======================
const MONTAGE = ['plan', 'forget', 'single', 'bill', 'hike', 'halloween'];
export function act5(ctx, lt) {
  const B = ACT5.beats;
  if (lt < B.montage) {
    // 展厅会议室，天上掉下一顶大皇冠，盖住眼睛
    cam(ctx, 1.04, 540, 1000, () => {
      ctx.drawImage(BG.room, 0, 0);
      const drop = clamp((lt - B.crown) / 0.35);
      const land = lt > B.crown + 0.35;
      const fix = clamp((lt - 2.2) / 0.5);
      for (const [i, x, f] of [[0, 170, 1], [2, 910, -1]]) {
        drawStick(ctx, pal(i, { x, y: 1450, s: 0.85, face: f, t: lt, eyes: 'happy', mouth: 'grin', armL: { a: 120, b: 40 }, armR: { a: -120, b: -40 } }));
      }
      shadow(ctx, 540, 1640, 130);
      const p = tim('president', {
        x: 540, y: 1640, s: 1.3, t: lt, squash: land && lt < B.crown + 0.6 ? 0.9 : 1,
        crown: land ? lerp(2.2, 1.0, ease(fix)) : 0, eyes: fix > 0.8 ? 'dot' : 'line', mouth: fix > 0.8 ? 'smile' : 'o',
        armL: fix < 1 && land ? { a: 150, b: 40 } : { a: 40, b: 100 }, armR: fix < 1 && land ? { a: -150, b: -40 } : { a: -40, b: -100 },
      });
      drawStick(ctx, p);
      if (!land && lt > B.crown) {
        // 皇冠还在空中
        ctx.save();
        ctx.translate(540, lerp(-200, 900, easeIn(drop)));
        ctx.scale(2.6, 2.6);
        outline(ctx, new Path2D('M -40,0 L -46,-46 L -22,-22 L 0,-56 L 22,-22 L 46,-46 L 40,0 Z'), K.yellow, 3);
        ctx.restore();
      }
      if (land && lt < B.crown + 0.8) pop(ctx, '咚！', 780, 760, clamp((lt - B.crown - 0.35) / 0.1), { size: 90, rot: 0.1, fill: K.yellow, stroke: INK });
    });
    return { vig: 0.3 };
  }
  if (lt < B.dance) {
    // 快速蒙太奇：每格约 0.6 秒，打在鼓点上
    const span = (B.dance - B.montage) / MONTAGE.length;
    const i = Math.min(MONTAGE.length - 1, Math.floor((lt - B.montage) / span));
    const k = lt - B.montage - i * span;
    montage(ctx, MONTAGE[i], k, lt);
    return { vig: 0.3, shake: k < 0.08 ? 8 : 0 };
  }
  // 松弛：在会议室里跟着节拍唱跳
  dance(ctx, lt - B.dance, lt);
  return { vig: 0.3 };
}

function montage(ctx, kind, k, t) {
  const panel = { plan: K.peri, forget: K.cream, single: '#F7C6C0', bill: K.cream, hike: null, halloween: null }[kind];
  if (kind === 'hike') ctx.drawImage(BG.mountain, 0, 0);
  else if (kind === 'halloween') ctx.drawImage(BG.halloween, 0, 0);
  else {
    ctx.fillStyle = panel;
    ctx.fillRect(0, 0, W, H);
    for (const [x, y, r] of [[140, 300, 34], [940, 420, 28], [880, 1500, 40], [160, 1400, 24]]) sparkle(ctx, x, y, r, K.navy, 0);
  }
  const zoom = 1 + k * 0.08;
  cam(ctx, zoom, 540, 1050, () => {
    const base = { x: 540, y: 1640, s: 1.4, t, hair: 'neat' };
    if (kind === 'plan') {
      drawStick(ctx, tim('president', { ...base, face: 1, mouth: 'o', armL: { a: 100, b: -20 }, prop: { type: 'clipboard', hand: 'R' }, armR: { a: -50, b: -80 }, legL: { a: 25, b: 0 }, legR: { a: -25, b: 0 } }));
      pop(ctx, '这个你来！', 640, 600, clamp(k / 0.1), { size: 80, rot: -0.05, font: SANS, fill: K.navy, stroke: K.cream });
    } else if (kind === 'forget') {
      drawStick(ctx, tim('president', { ...base, eyes: 'dot', look: [0, -1], mouth: 'flat', armL: { a: 160, b: 60 }, armR: { a: -10, b: -10 } }));
      pop(ctx, '？？？', 540, 560, clamp(k / 0.1), { size: 120, font: SANS, fill: K.red, stroke: K.cream });
    } else if (kind === 'single') {
      drawStick(ctx, pal(1, { x: 260, y: 1600, s: 1.0, face: 1, eyes: 'happy', mouth: 'grin', armL: { a: 100, b: 0 } }));
      drawStick(ctx, tim('president', { ...base, x: 640, face: -1, mouth: 'flat', eyes: 'line', armL: { a: 70, b: 60 }, armR: { a: -70, b: -60 } }));
      pop(ctx, '还单身？', 380, 700, clamp(k / 0.1), { size: 80, rot: -0.06, font: SANS, fill: K.red, stroke: K.cream });
    } else if (kind === 'bill') {
      outline(ctx, rect(140, 1250, 800, 50, 14), '#FFFFFF', 6);
      drawStick(ctx, tim('president', { ...base, y: 1660, face: 1, eyes: 'dot', look: [1, 1], mouth: 'flat', brows: 'worry', sweat: 1 }));
      ctx.save();
      ctx.translate(800, 1200);
      ctx.rotate(0.1);
      outline(ctx, rect(-70, -100, 140, 170, 6), '#FFFFFF', 5);
      ctx.fillStyle = K.red;
      ctx.font = `900 64px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText('¥', 0, 0);
      ctx.restore();
      pop(ctx, '（偷瞄）', 540, 640, clamp(k / 0.1), { size: 70, font: SANS, fill: K.navy, stroke: K.cream });
    } else if (kind === 'hike') {
      drawStick(ctx, tim('president', { ...base, x: 420, y: 1560, s: 1.1, face: 1, eyes: 'happy', mouth: 'grin', armL: { a: 160, b: 0 }, legL: { a: 30, b: -40 } }));
      drawStick(ctx, pal(2, { x: 300, y: 1600, s: 0.9, face: 1, eyes: 'happy', mouth: 'grin', armR: { a: -150, b: 0 } }));
    } else {
      drawStick(ctx, tim('president', { ...base, x: 540, face: 0, eyes: 'happy', mouth: 'grin', cap: '#3D2C52', armL: { a: 140, b: 30 }, armR: { a: -140, b: -30 } }));
      drawStick(ctx, pal(4, { x: 260, y: 1600, s: 1.0, face: 1, mouth: 'scream', eyes: 'shock' }));
      drawStick(ctx, pal(0, { x: 830, y: 1600, s: 1.0, face: -1, mouth: 'grin', eyes: 'happy', armL: { a: 150, b: 0 } }));
    }
  });
}

function dance(ctx, dt, t) {
  const beat = dt / 0.5;
  const onBeat = Math.abs(Math.sin(Math.PI * beat));
  cam(ctx, 1.02, 540 + Math.sin(dt * 0.9) * 10, 960, () => {
    ctx.drawImage(BG.room, 0, 0);
    [[1, 130, 1400, 0.75, 1], [4, 290, 1360, 0.68, 1], [0, 800, 1360, 0.68, -1], [2, 960, 1410, 0.75, -1]].forEach(([i, x, y, s, f], k) => {
      const up = Math.floor(beat + k * 0.5) % 2 === 0;
      drawStick(ctx, pal(i, { x, y, s, face: f, t, bob: -onBeat * 14, eyes: 'happy', mouth: 'grin', armL: up ? { a: 150, b: 10 } : { a: 60, b: 80 }, armR: up ? { a: -150, b: -10 } : { a: -60, b: -80 } }));
    });
    const x = 540 + Math.sin((dt / 4.2) * Math.PI * 2) * 190;
    const face = Math.cos((dt / 4.2) * Math.PI * 2) >= 0 ? 1 : -1;
    const kick = Math.floor(beat) % 2 === 0;
    shadow(ctx, x, 1640, 140 - onBeat * 30);
    drawStick(ctx, tim('now', {
      x, y: 1640, s: 1.3, face, t, jump: onBeat * 0.3, glasses: 'sun', mouth: onBeat > 0.5 ? 'sing' : 'grin', eyes: 'dot', lean: -face * 6,
      prop: { type: 'mic', hand: 'R', angle: -40 * face }, armR: { to: [56 * face, -430], bend: -face }, armL: { a: (kick ? 150 : 120) * face, b: 20 * face },
      legL: kick ? { a: 40 * face, b: -70 * face } : { a: 10, b: 0 }, legR: kick ? { a: -10, b: 0 } : { a: -40 * face, b: 70 * face },
    }));
    const ny = (dt * 120) % 300;
    notes(ctx, [[x + 200 * face, 1060 - ny, 1], [x + 280 * face, 980 - ((ny + 150) % 300), 0.75]]);
    for (const [sx, sy, r] of [[200, 1150, 26], [900, 1080, 34], [480, 1080, 18]]) sparkle(ctx, sx, sy, r * (0.6 + 0.4 * Math.sin(t * 6)), K.yellow, 4);
  });
}

// ======================= 第六幕：一起搞了场大的 =======================
export function act6(ctx, lt) {
  const B = ACT6.beats;
  if (lt < B.show) {
    // 筹备：做海报、搬物料、搭舞台、调音响，Tim 跑来跑去
    cam(ctx, 1.0, 540, 980, () => {
      ctx.drawImage(BG.party, 0, 0);
      drawStick(ctx, pal(4, { x: 170, y: 1450, s: 0.85, face: 1, t: lt, mouth: 'smile', prop: { type: 'poster', hand: 'L' }, armL: { a: 120, b: 40 } }));
      const carry = kf(lt, [[0, 1100], [2.8, 760]], (u) => u);
      drawStick(ctx, pal(3, { x: carry, y: 1440, s: 0.85, face: -1, t: lt, mouth: 'smile', prop: { type: 'box', hand: 'R' }, armR: { to: [-40, -300], bend: -1 }, armL: { to: [40, -300], bend: 1 }, legL: { a: Math.sin(lt * 10) * 25 }, legR: { a: -Math.sin(lt * 10) * 25 } }));
      drawStick(ctx, pal(5, { x: 330, y: 1380, s: 0.78, face: 1, t: lt, mouth: 'smile', prop: { type: 'speaker', hand: 'L' }, armL: { a: 60, b: 30 } }));
      const tx = 540 + Math.sin(lt * 2.4) * 260;
      const f = Math.cos(lt * 2.4) >= 0 ? 1 : -1;
      shadow(ctx, tx, 1640, 120);
      drawStick(ctx, tim('now', { x: tx, y: 1640, s: 1.2, face: f, t: lt, mouth: 'grin', eyes: 'dot', lean: f * 10, prop: { type: 'clipboard', hand: 'L' }, armL: { a: 100 * f, b: -30 * f }, legL: { a: Math.sin(lt * 14) * 35 }, legR: { a: -Math.sin(lt * 14) * 35 } }));
    });
    return { vig: 0.3 };
  }
  if (lt < B.dinner) {
    // 舞台灯亮起；然后 Tim 从聚光灯中央让开，把伙伴们拉进光里
    const aside = lt > B.aside;
    const at = lt - B.aside;
    cam(ctx, 1.0, 540, 980, () => {
      ctx.drawImage(BG.party, 0, 0);
      ctx.fillStyle = 'rgba(20,16,30,0.45)';
      ctx.fillRect(0, 0, W, H);
      // 聚光灯
      const spotX = aside ? lerp(540, 540, at) : 540;
      const g = ctx.createLinearGradient(0, 0, 0, 1700);
      g.addColorStop(0, 'rgba(255,240,200,0.55)');
      g.addColorStop(1, 'rgba(255,240,200,0.2)');
      ctx.fillStyle = g;
      const wide = aside ? lerp(1, 2.2, ease(at / 0.8)) : 1;
      ctx.beginPath();
      ctx.moveTo(spotX - 70, 0);
      ctx.lineTo(spotX + 70, 0);
      ctx.lineTo(spotX + 220 * wide, 1700);
      ctx.lineTo(spotX - 220 * wide, 1700);
      ctx.closePath();
      ctx.fill();
      const cheer = Math.abs(Math.sin(lt * 7));
      if (!aside) {
        drawStick(ctx, tim('now', { x: 540, y: 1640, s: 1.3, face: 0, t: lt, mouth: 'grin', eyes: 'happy', armL: { a: 150, b: 10 }, armR: { a: -150, b: -10 } }));
      } else {
        // Tim 往旁边让，伙伴们走进光里
        const step = ease(at / 0.8);
        const pals = [[0, lerp(-100, 380, step)], [2, lerp(1180, 700, step)], [4, lerp(-200, 220, step)], [3, lerp(1300, 860, step)]];
        for (const [i, x] of pals) drawStick(ctx, pal(i, { x, y: 1620, s: 1.0, face: x < 540 ? 1 : -1, t: lt, eyes: 'happy', mouth: 'grin', bob: -cheer * 8, armL: { a: 150, b: 10 }, armR: { a: -150, b: -10 } }));
        drawStick(ctx, tim('now', { x: lerp(540, 560, step), y: 1660, s: 1.25, face: 0, t: lt, mouth: 'smile', eyes: 'happy', blush: 0.5, armL: { a: 60, b: 70 }, armR: { a: -100, b: 10 } }));
      }
      // 台下鼓掌
      for (let i = 0; i < 6; i++) {
        const x = 90 + i * 180;
        const y = 1830 + (i % 2) * 30;
        ctx.fillStyle = K.cream;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(x, y, 64, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      for (const [x, y, r] of [[160, 700, 30], [920, 640, 40], [760, 900, 22]]) sparkle(ctx, x, y, r * (0.7 + 0.3 * Math.sin(lt * 8 + x)), K.yellow, 4);
    });
    return { vig: 0.35 };
  }
  // 聚餐举杯，镜头慢慢推近 Tim 的脸
  const dt = lt - B.dinner;
  const z = lerp(1.0, 1.9, ease((dt - 0.8) / 3.2));
  cam(ctx, z, 540, lerp(1100, 820, ease((dt - 0.8) / 3.2)), () => {
    ctx.drawImage(BG.dinner, 0, 0);
    const up = dt > 0.6 && dt < 2.4;
    const seats = [[1, 180, -1], [4, 360, -1], [2, 720, 1], [5, 900, 1]];
    for (const [i, x] of seats) drawStick(ctx, pal(i, { x, y: 1300, s: 0.8, face: x < 540 ? 1 : -1, t: lt, eyes: 'happy', mouth: 'grin', armL: up ? { a: 150, b: 10 } : { a: 40, b: 60 }, prop: up ? { type: 'cup', hand: 'L' } : null }));
    drawStick(ctx, tim('now', { x: 540, y: 1310, s: 0.9, face: 0, t: lt, eyes: dt > 2.4 ? 'dot' : 'happy', mouth: dt > 2.4 ? 'smile' : 'grin', blush: 0.4, armL: up ? { a: 150, b: 10 } : { a: 40, b: 60 }, armR: { a: -20, b: -20 }, prop: up ? { type: 'cup', hand: 'L' } : null }));
    // 桌子画在人前面，看起来是坐在桌后
    outline(ctx, rect(40, 1150, 1000, 70, 18), '#FAF3D7', 6);
    outline(ctx, rect(70, 1220, 940, 220, 10), '#E9DCC0', 6);
    for (const x of [200, 420, 660, 880]) outline(ctx, new Path2D(`M ${x},1170 m -46,0 a 46,14 0 1,0 92,0 a 46,14 0 1,0 -92,0`), '#FFFFFF', 4);
    if (up && dt < 1.2) pop(ctx, '叮！', 540, 720, clamp((dt - 0.6) / 0.1), { size: 70, fill: K.yellow, stroke: INK });
  });
  return { vig: 0.35 + ease((dt - 1) / 3) * 0.15 };
}

// ======================= 第七幕：那扇门，终于不再陌生 =======================
export function act7(ctx, lt) {
  const B = ACT7.beats;
  if (lt < B.open) {
    // 同一扇门、同一个机位：Tim 走过来，没犹豫，直接按密码
    cam(ctx, 1.0, 540, 960, () => {
      ctx.drawImage(BG.door, 0, 0);
      const x = kf(lt, [[0, 1200], [1.8, TX]], (u) => u);
      const walking = lt < 1.8;
      shadow(ctx, x, TY, 120);
      drawStick(ctx, tim('now', {
        x, y: TY, s: 1.25, face: -1, t: lt, mouth: 'smile', eyes: 'dot',
        armR: lt > B.type ? { to: [(DOOR_KEY[0] - TX) / 1.25, (DOOR_KEY[1] - TY) / 1.25], bend: -1 } : { a: walking ? Math.sin(lt * 9) * 30 : -10, b: -20 },
        armL: { a: walking ? -Math.sin(lt * 9) * 30 : 10, b: 20 },
        legL: { a: walking ? Math.sin(lt * 9) * 28 : 6, b: 0 }, legR: { a: walking ? -Math.sin(lt * 9) * 28 : -6, b: 0 },
      }));
      beeps(ctx, lt, B.type + 0.15, 4);
    });
    return { vig: 0.4 };
  }
  if (lt < B.end) {
    // 门开了：暖光，伙伴们在门后招手；然后大家聚在一起拍合照
    const ot = lt - B.open;
    const photo = lt > B.photo;
    cam(ctx, photo ? lerp(1.0, 1.12, ease((lt - B.photo) / 1.2)) : lerp(1.2, 1.0, easeOut(ot / 1.4)), 540, photo ? 1030 : 980, () => {
      ctx.drawImage(BG.club, 0, 0);
      stringLights(ctx, -40, 160, 1120, 160, 120, lt, 16);
      const wave = Math.sin(lt * 8);
      const gather = ease((lt - B.walkIn) / 1.6);
      const spots = [[0, lerp(120, 250, gather), 1500], [1, lerp(300, 390, gather), 1450], [2, lerp(960, 830, gather), 1500], [3, lerp(800, 690, gather), 1450], [4, lerp(60, 160, gather), 1560], [5, lerp(1020, 920, gather), 1560]];
      for (const [i, x, y] of spots) {
        drawStick(ctx, pal(i, {
          x, y, s: 0.9, face: x < 540 ? 1 : -1, t: lt, eyes: 'happy', mouth: 'grin',
          armL: photo ? { a: 150, b: 10 } : { a: 140 + wave * 20, b: 30 }, armR: photo ? { a: -150, b: -10 } : { a: -30, b: -20 },
          prop: i === 5 && !photo ? { type: 'camera', hand: 'R' } : null,
        }));
      }
      const tx = lerp(540, 540, gather);
      const ty = lerp(1900, 1660, ease(ot / 1.5));
      shadow(ctx, tx, ty, 130);
      drawStick(ctx, tim('now', { x: tx, y: ty, s: 1.3, face: 0, t: lt, eyes: 'happy', mouth: 'grin', blush: 0.5, armL: photo ? { a: 150, b: 10 } : { a: 40, b: 60 }, armR: photo ? { a: -150, b: -10 } : { a: -40, b: -60 } }));
      if (lt > B.walkIn - 0.6 && lt < B.walkIn + 0.6) pop(ctx, '来啦！', 300, 900, clamp((lt - B.walkIn + 0.6) / 0.15), { size: 80, rot: -0.1, fill: K.yellow, stroke: K.red, font: SANS });
    });
    if (ot < 0.35) {
      ctx.fillStyle = `rgba(255,236,190,${0.9 * (1 - ot / 0.35)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (photo) {
      const pt = lt - B.photo;
      if (pt < 0.15) {
        ctx.fillStyle = `rgba(255,255,255,${1 - pt / 0.15})`;
        ctx.fillRect(0, 0, W, H);
      }
      // 合照相框
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 36;
      ctx.strokeRect(30, 30, W - 60, H - 60);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.strokeRect(48, 48, W - 96, H - 96);
    }
    return { vig: 0.25, freeze: photo };
  }
  // 片尾：砖红字幕条 + 大家在下面
  const et = lt - B.end;
  ctx.drawImage(BG.end, 0, 0);
  const fr = [[0, 150, 1650, 1], [3, 330, 1590, 1], [1, 760, 1590, -1], [5, 940, 1650, -1]];
  const cheer = Math.abs(Math.sin(lt * 5));
  for (const [i, x, y, f] of fr) drawStick(ctx, pal(i, { x, y, s: 0.95, face: f, t: lt, eyes: 'happy', mouth: 'grin', bob: -cheer * 6, armL: { a: 150, b: 10 }, armR: { a: -30, b: -20 } }));
  shadow(ctx, 545, 1740, 150);
  drawStick(ctx, tim('now', { x: 545, y: 1740, s: 1.15, face: 0, t: lt, eyes: 'happy', mouth: 'grin', blush: 0.6, armL: { a: 140, b: 30 }, armR: { a: -140, b: -30 } }));
  void et;
  return { vig: 0.2 };
}

void noise;
void stick;
void easeIn;

// 场景：夜晚门口（全景）、反打街景、密码锁特写、警报幻想、乌鸦
import { W, H } from './timeline.js';
import { rng, clamp, lerp, makeCanvas, roundRect } from './util.js';
import { glow, cone } from './fx.js';

const TAU = Math.PI * 2;
const FONT_UI = '"Noto Sans SC", sans-serif';
export const FONT_FUN = '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif';

// ---------------- 门口全景 ----------------
// 世界坐标与 1080×1920 画面一致（镜头 zoom=1 时完全对齐）
export const DOOR = { x0: 250, x1: 610, y0: 800, y1: 1520 };
export const KEYPAD = { x: 640, y: 1150, w: 78, h: 124 };
export const GROUND = 1520;
export const LAMP = { x: 968, top: 600, headX: 880, headY: 628 };
const FW = W + 460; // 场景宽度：右边多出一截，镜头跟拍时用

let facadeCache = null;
function buildFacade() {
  const c = makeCanvas(FW, H);
  const ctx = c.getContext('2d');
  const r = rng(7);
  // 天空
  const sky = ctx.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, '#070D24');
  sky.addColorStop(1, '#17264B');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FW, 330);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(220,230,255,${0.2 + r() * 0.6})`;
    const s = r() < 0.9 ? 1.5 : 2.6;
    ctx.fillRect(r() * FW, r() * 280, s, s);
  }
  // 楼体
  const wall = ctx.createLinearGradient(0, 240, 0, GROUND);
  wall.addColorStop(0, '#1C2640');
  wall.addColorStop(0.55, '#24304D');
  wall.addColorStop(1, '#2A3756');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 250, FW, GROUND - 250);
  // 楼顶檐口
  ctx.fillStyle = '#141B2E';
  ctx.fillRect(0, 238, FW, 22);
  // 墙面分格
  ctx.strokeStyle = 'rgba(8,12,24,0.35)';
  ctx.lineWidth = 3;
  for (let x = 0; x <= FW; x += 135) {
    ctx.beginPath();
    ctx.moveTo(x, 260);
    ctx.lineTo(x, GROUND);
    ctx.stroke();
  }
  for (let y = 260; y < GROUND; y += 160) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FW, y);
    ctx.stroke();
  }
  // 楼上窗户：大多数黑着，两扇亮暖光（屋里有人）
  const wins = [[70, 330], [340, 330], [610, 330], [880, 330], [1150, 330], [70, 530], [340, 530], [610, 530], [880, 530], [1150, 530]];
  wins.forEach(([x, y], i) => {
    const lit = i === 7 || i === 2;
    ctx.fillStyle = '#0E1527';
    roundRect(ctx, x - 6, y - 6, 142, 132, 6);
    ctx.fill();
    const g = ctx.createLinearGradient(x, y, x, y + 120);
    if (lit) {
      g.addColorStop(0, '#F7B567');
      g.addColorStop(1, '#C7703A');
    } else {
      g.addColorStop(0, '#16223D');
      g.addColorStop(1, '#0F182C');
    }
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 130, 120);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x + 63, y, 4, 120);
    if (lit) {
      // 窗里隐约的人影
      ctx.fillStyle = 'rgba(90,40,20,0.45)';
      ctx.beginPath();
      ctx.arc(x + 34, y + 70, 13, 0, TAU);
      ctx.fill();
      ctx.fillRect(x + 20, y + 84, 28, 36);
      ctx.beginPath();
      ctx.arc(x + 98, y + 76, 11, 0, TAU);
      ctx.fill();
      ctx.fillRect(x + 86, y + 88, 24, 32);
    } else {
      ctx.fillStyle = 'rgba(140,170,230,0.07)';
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 120);
      ctx.lineTo(x + 50, y);
      ctx.lineTo(x + 70, y);
      ctx.lineTo(x + 30, y + 120);
      ctx.fill();
    }
  });
  // 门洞（内凹）
  ctx.fillStyle = '#121A2C';
  ctx.fillRect(DOOR.x0 - 30, DOOR.y0 - 30, DOOR.x1 - DOOR.x0 + 60, GROUND - DOOR.y0 + 30);
  // 雨棚
  ctx.fillStyle = '#0F1424';
  ctx.fillRect(DOOR.x0 - 70, DOOR.y0 - 70, DOOR.x1 - DOOR.x0 + 140, 30);
  ctx.fillStyle = '#2D3858';
  ctx.fillRect(DOOR.x0 - 70, DOOR.y0 - 42, DOOR.x1 - DOOR.x0 + 140, 5);
  // 门框 + 玻璃
  ctx.fillStyle = '#0B1120';
  ctx.fillRect(DOOR.x0, DOOR.y0, DOOR.x1 - DOOR.x0, DOOR.y1 - DOOR.y0);
  const mid = (DOOR.x0 + DOOR.x1) / 2;
  for (const [a, b] of [[DOOR.x0 + 16, mid - 6], [mid + 6, DOOR.x1 - 16]]) {
    const g = ctx.createLinearGradient(0, DOOR.y0, 0, DOOR.y1);
    g.addColorStop(0, '#0F2533');
    g.addColorStop(0.7, '#14313F');
    g.addColorStop(1, '#3A3326');
    ctx.fillStyle = g;
    ctx.fillRect(a, DOOR.y0 + 16, b - a, DOOR.y1 - DOOR.y0 - 30);
    // 门里透出来的暖光（伏笔）
    const w = ctx.createLinearGradient(0, DOOR.y1 - 260, 0, DOOR.y1);
    w.addColorStop(0, 'rgba(255,170,90,0)');
    w.addColorStop(1, 'rgba(255,170,90,0.32)');
    ctx.fillStyle = w;
    ctx.fillRect(a, DOOR.y1 - 260, b - a, 246);
    // 玻璃反光
    ctx.fillStyle = 'rgba(170,210,255,0.07)';
    ctx.beginPath();
    ctx.moveTo(a, DOOR.y0 + 260);
    ctx.lineTo(a + 70, DOOR.y0 + 16);
    ctx.lineTo(a + 110, DOOR.y0 + 16);
    ctx.lineTo(a, DOOR.y0 + 400);
    ctx.fill();
    ctx.fillStyle = 'rgba(170,210,255,0.04)';
    ctx.beginPath();
    ctx.moveTo(a + 40, DOOR.y1 - 14);
    ctx.lineTo(b, DOOR.y0 + 330);
    ctx.lineTo(b, DOOR.y0 + 420);
    ctx.lineTo(a + 110, DOOR.y1 - 14);
    ctx.fill();
  }
  // 门把手（竖长条）
  for (const x of [mid - 34, mid + 22]) {
    const g = ctx.createLinearGradient(x, 0, x + 12, 0);
    g.addColorStop(0, '#9AA6BC');
    g.addColorStop(1, '#4B566E');
    ctx.fillStyle = g;
    roundRect(ctx, x, 1040, 12, 230, 6);
    ctx.fill();
  }
  // 门上贴的纸：EOE
  ctx.save();
  ctx.translate(mid + 70, 1110);
  ctx.rotate(0.03);
  ctx.fillStyle = '#C9CCD3';
  ctx.fillRect(-44, -58, 88, 112);
  ctx.fillStyle = '#2B3550';
  ctx.font = `bold 30px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.fillText('EOE', 0, -14);
  ctx.fillStyle = '#7E8596';
  for (let i = 0; i < 4; i++) ctx.fillRect(-30, 4 + i * 11, 60 - (i % 2) * 18, 4);
  ctx.restore();
  // 门槛
  ctx.fillStyle = '#3A4562';
  ctx.fillRect(DOOR.x0 - 30, DOOR.y1 - 6, DOOR.x1 - DOOR.x0 + 60, 8);
  // 墙角水管
  ctx.fillStyle = '#18203A';
  ctx.fillRect(1010, 260, 18, GROUND - 260);
  ctx.fillStyle = 'rgba(120,140,190,0.18)';
  ctx.fillRect(1012, 260, 4, GROUND - 260);
  // 右侧：隔壁关着的卷帘门
  ctx.fillStyle = '#1A2238';
  ctx.fillRect(1120, 960, 360, GROUND - 960);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 3;
  for (let y = 975; y < GROUND; y += 18) {
    ctx.beginPath();
    ctx.moveTo(1120, y);
    ctx.lineTo(1480, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#0F1424';
  ctx.fillRect(1100, 930, 400, 30);
  // 地面
  const gr = ctx.createLinearGradient(0, GROUND, 0, H);
  gr.addColorStop(0, '#202A43');
  gr.addColorStop(1, '#10162A');
  ctx.fillStyle = gr;
  ctx.fillRect(0, GROUND, FW, H - GROUND);
  ctx.fillStyle = '#39456A';
  ctx.fillRect(0, GROUND, FW, 5);
  // 地砖透视线
  ctx.strokeStyle = 'rgba(5,8,18,0.5)';
  ctx.lineWidth = 2.5;
  let y = GROUND + 30;
  let step = 30;
  while (y < H) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FW, y);
    ctx.stroke();
    step *= 1.32;
    y += step;
  }
  for (let i = -8; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(540 + i * 110, GROUND);
    ctx.lineTo(540 + i * 330, H);
    ctx.stroke();
  }
  // 路缘
  ctx.fillStyle = '#0B0F1C';
  ctx.fillRect(0, 1850, FW, 70);
  ctx.fillStyle = '#4A5676';
  ctx.fillRect(0, 1846, FW, 6);
  // 左边的盆栽
  ctx.fillStyle = '#1A2135';
  roundRect(ctx, 70, 1380, 130, 140, 14);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,140,190,0.15)';
  ctx.fillRect(80, 1390, 10, 120);
  const leaves = rng(3);
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI / 2 + (leaves() - 0.5) * 2.4;
    const l = 70 + leaves() * 90;
    ctx.fillStyle = i % 3 ? '#12291F' : '#1C3B2C';
    ctx.save();
    ctx.translate(135, 1390);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, -l / 2, 13, l / 2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  return c;
}

// 密码锁（小，全景用）
function drawKeypadSmall(ctx, t, glowAmt = 1) {
  const { x, y, w, h } = KEYPAD;
  glow(ctx, x + w / 2, y + h / 2, 260, '80,225,255', 0.28 * glowAmt);
  ctx.fillStyle = '#5E6A82';
  roundRect(ctx, x - 5, y - 5, w + 10, h + 10, 12);
  ctx.fill();
  ctx.fillStyle = '#05080F';
  roundRect(ctx, x, y, w, h, 9);
  ctx.fill();
  // 小屏
  ctx.fillStyle = 'rgba(90,230,255,0.55)';
  ctx.fillRect(x + 12, y + 12, w - 24, 10);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const kx = x + 18 + c * 21;
      const ky = y + 40 + r * 20;
      ctx.fillStyle = `rgba(110,240,255,${0.65 + 0.2 * Math.sin(t * 2 + r + c)})`;
      ctx.beginPath();
      ctx.arc(kx, ky, 6, 0, TAU);
      ctx.fill();
    }
  }
}

export function drawFacade(ctx, t, opt = {}) {
  if (!facadeCache) facadeCache = buildFacade();
  ctx.drawImage(facadeCache, 0, 0);
  // 雨棚下的灯光
  cone(ctx, 430, 760, 0, 0.42, 820, '170,200,255', 0.16);
  glow(ctx, 430, 768, 60, '210,230,255', 0.7);
  ctx.fillStyle = 'rgba(150,180,240,0.12)';
  ctx.beginPath();
  ctx.ellipse(430, 1560, 300, 60, 0, 0, TAU);
  ctx.fill();
  drawKeypadSmall(ctx, t, opt.keypadGlow ?? 1);
  // 地面倒影：密码锁的青光、门缝的暖光
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(14px)';
  ctx.fillStyle = 'rgba(80,220,255,0.18)';
  ctx.fillRect(KEYPAD.x + 10, GROUND + 10, KEYPAD.w - 20, 200);
  ctx.fillStyle = 'rgba(255,160,80,0.12)';
  ctx.fillRect(DOOR.x0 + 20, GROUND + 8, DOOR.x1 - DOOR.x0 - 40, 120);
  ctx.restore();
}

// 前景路灯 + 灯头（灯光照到地面）
export function drawLamp(ctx, t) {
  const { x, top, headX, headY } = LAMP;
  cone(ctx, headX, headY + 16, 0.08, 0.36, 1250, '190,215,255', 0.13);
  ctx.fillStyle = 'rgba(160,190,250,0.1)';
  ctx.beginPath();
  ctx.ellipse(headX + 80, 1700, 330, 80, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0B0F1A';
  ctx.fillRect(x - 12, top, 24, H - top);
  ctx.fillStyle = 'rgba(140,170,230,0.25)';
  ctx.fillRect(x - 10, top, 5, H - top);
  ctx.strokeStyle = '#0B0F1A';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(x, top + 10);
  ctx.quadraticCurveTo(x, top - 30, headX + 30, headY - 10);
  ctx.stroke();
  ctx.fillStyle = '#121725';
  roundRect(ctx, headX - 50, headY - 14, 100, 28, 12);
  ctx.fill();
  ctx.fillStyle = '#E9F1FF';
  roundRect(ctx, headX - 40, headY + 6, 80, 9, 4);
  ctx.fill();
  glow(ctx, headX, headY + 14, 120, '200,225,255', 0.6);
  void t;
}

// ---------------- 乌鸦 ----------------
// facing: 1 朝右，-1 朝左；caw 0..1 张嘴；look: 头的朝向（-1..1，可以和身体相反）
export function drawCrow(ctx, x, y, s, { facing = -1, caw = 0, look = facing, bob = 0, ruffle = 0 } = {}) {
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(s, s);
  // 爪子
  ctx.strokeStyle = '#3A3A44';
  ctx.lineWidth = 3;
  for (const dx of [-6, 6]) {
    ctx.beginPath();
    ctx.moveTo(dx, -10);
    ctx.lineTo(dx, 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.scale(facing, 1);
  // 尾巴
  ctx.fillStyle = '#0C0D14';
  ctx.beginPath();
  ctx.moveTo(-14, -22);
  ctx.lineTo(-52, -6);
  ctx.lineTo(-46, 4);
  ctx.lineTo(-8, -10);
  ctx.fill();
  // 身体
  ctx.beginPath();
  ctx.ellipse(0, -30 - ruffle * 3, 28 + ruffle * 4, 22 + ruffle * 4, -0.25, 0, TAU);
  ctx.fill();
  // 翅膀光泽
  ctx.fillStyle = 'rgba(80,100,170,0.45)';
  ctx.beginPath();
  ctx.ellipse(-4, -32, 18, 9, -0.35, 0, TAU);
  ctx.fill();
  ctx.restore();
  // 头
  ctx.save();
  ctx.translate(facing * 18, -54);
  ctx.scale(look >= 0 ? 1 : -1, 1);
  ctx.fillStyle = '#0C0D14';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, TAU);
  ctx.fill();
  // 喙：上下两片，叫的时候张开
  ctx.fillStyle = '#3B3D48';
  ctx.beginPath();
  ctx.moveTo(10, -6);
  ctx.lineTo(34, -2 - caw * 6);
  ctx.lineTo(12, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, 3);
  ctx.lineTo(30, 5 + caw * 10);
  ctx.lineTo(10, 8);
  ctx.fill();
  // 眼睛
  ctx.fillStyle = '#F5F2E6';
  ctx.beginPath();
  ctx.arc(5, -4, 3.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(6, -4, 1.8, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// ---------------- 反打街景（虚化背景） ----------------
let streetCache = null;
function buildStreet() {
  const PAD = 200;
  const c = makeCanvas(W + PAD * 2, H + PAD * 2);
  const ctx = c.getContext('2d');
  const r = rng(11);
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, '#060B1E');
  g.addColorStop(0.45, '#14214A');
  g.addColorStop(0.75, '#1C2C55');
  g.addColorStop(1, '#0D1428');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  // 远处楼群
  ctx.filter = 'blur(10px)';
  let x = 0;
  while (x < c.width) {
    const bw = 120 + r() * 200;
    const bh = 500 + r() * 700;
    ctx.fillStyle = `rgb(${12 + r() * 10},${18 + r() * 12},${38 + r() * 18})`;
    ctx.fillRect(x, 1250 - bh, bw, bh + 600);
    for (let wy = 1250 - bh + 30; wy < 1200; wy += 60) {
      for (let wx = x + 20; wx < x + bw - 30; wx += 46) {
        if (r() < 0.22) {
          ctx.fillStyle = r() < 0.3 ? 'rgba(255,190,120,0.6)' : 'rgba(150,190,255,0.4)';
          ctx.fillRect(wx, wy, 22, 30);
        }
      }
    }
    x += bw + 10;
  }
  ctx.filter = 'none';
  // 散景光斑
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {
    const bx = r() * c.width;
    const by = 900 + r() * 900;
    const br = 26 + r() * 70;
    const warm = r() < 0.25;
    const col = warm ? '255,170,90' : r() < 0.5 ? '120,190,255' : '200,220,255';
    const a = 0.12 + r() * 0.22;
    const rg = ctx.createRadialGradient(bx, by, br * 0.6, bx, by, br);
    rg.addColorStop(0, `rgba(${col},${a})`);
    rg.addColorStop(0.85, `rgba(${col},${a * 1.15})`);
    rg.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  return { c, PAD };
}
// dx, dy：视差偏移；zoom：随镜头推近一点点
export function drawStreet(ctx, dx = 0, dy = 0, zoom = 1) {
  if (!streetCache) streetCache = buildStreet();
  const { c, PAD } = streetCache;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.drawImage(c, -W / 2 - PAD + dx, -H / 2 - PAD + dy);
  ctx.restore();
}

// ---------------- 密码锁特写 ----------------
export const KP = { x: 190, y: 380, w: 700, h: 1080 };
export function keyCenter(r, c) {
  return [KP.x + 175 + c * 175, KP.y + 380 + r * 165];
}
export function drawKeypadCU(ctx, t, { lit = 1, pressKey = null, cursor = true } = {}) {
  // 墙面（虚化、被青光照亮）
  const wall = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100);
  wall.addColorStop(0, '#1F4458');
  wall.addColorStop(0.5, '#15233E');
  wall.addColorStop(1, '#080C1A');
  ctx.fillStyle = wall;
  ctx.fillRect(-200, -200, W + 400, H + 400);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 6;
  for (let y = -200; y < H + 200; y += 320) {
    ctx.beginPath();
    ctx.moveTo(-200, y);
    ctx.lineTo(W + 200, y);
    ctx.stroke();
  }
  const { x, y, w, h } = KP;
  glow(ctx, x + w / 2, y + h / 2, 900, '70,220,255', 0.22 * lit);
  // 金属边框
  const bz = ctx.createLinearGradient(x, y, x + w, y + h);
  bz.addColorStop(0, '#A8B3C7');
  bz.addColorStop(0.5, '#4E596F');
  bz.addColorStop(1, '#8D98AE');
  ctx.fillStyle = bz;
  roundRect(ctx, x - 22, y - 22, w + 44, h + 44, 70);
  ctx.fill();
  ctx.fillStyle = '#04070D';
  roundRect(ctx, x, y, w, h, 54);
  ctx.fill();
  // 玻璃反光
  ctx.save();
  roundRect(ctx, x, y, w, h, 54);
  ctx.clip();
  const rf = ctx.createLinearGradient(x, y, x + w, y + h * 0.6);
  rf.addColorStop(0, 'rgba(160,200,255,0.12)');
  rf.addColorStop(0.4, 'rgba(160,200,255,0)');
  ctx.fillStyle = rf;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // 指示灯
  ctx.fillStyle = '#FF4E5A';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 70, 11, 0, TAU);
  ctx.fill();
  glow(ctx, x + w / 2, y + 70, 60, '255,80,90', 0.5);
  // 小屏：请输入密码
  ctx.fillStyle = '#071A22';
  roundRect(ctx, x + 90, y + 130, w - 180, 120, 20);
  ctx.fill();
  ctx.fillStyle = `rgba(110,240,255,${0.9 * lit})`;
  ctx.font = `500 52px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('请输入密码', x + w / 2 - 14, y + 192);
  if (cursor && Math.floor(t * 2.2) % 2 === 0) ctx.fillRect(x + w / 2 + 128, y + 168, 6, 48);
  // 按键
  const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const [kx, ky] = keyCenter(r, c);
      const k = labels[r * 3 + c];
      const pressed = pressKey === k;
      glow(ctx, kx, ky, 120, '70,220,255', (pressed ? 0.6 : 0.2) * lit);
      ctx.strokeStyle = `rgba(110,240,255,${(pressed ? 1 : 0.75) * lit})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(kx, ky, 62, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = `rgba(150,245,255,${0.95 * lit})`;
      ctx.font = `700 64px ${FONT_UI}`;
      ctx.fillText(k, kx, ky + 3);
    }
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ---------------- 警报幻想 ----------------
// 旋转的红色光束背景
export function drawAlarmBG(ctx, t, k) {
  ctx.fillStyle = '#3A0006';
  ctx.fillRect(-300, -300, W + 600, H + 600);
  const cx = W / 2;
  const cy = H * 0.52;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.9);
  const n = 14;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(230,20,30,0.5)' : 'rgba(90,0,8,0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 2200, (i / n) * TAU, ((i + 1) / n) * TAU);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  const rg = ctx.createRadialGradient(cx, cy, 50, cx, cy, 1100);
  rg.addColorStop(0, `rgba(255,90,70,${0.22 * k})`);
  rg.addColorStop(1, 'rgba(60,0,0,0.6)');
  ctx.fillStyle = rg;
  ctx.fillRect(-300, -300, W + 600, H + 600);
}

// 两个警灯：灯罩 + 扫过的光束
export function drawBeacons(ctx, t) {
  for (const [x, ph] of [[150, 0], [W - 150, Math.PI]]) {
    const a = t * TAU * 1.6 + ph;
    const y = 120;
    // 光束
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(x, y);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, 1400, 0);
    g.addColorStop(0, 'rgba(255,60,50,0.75)');
    g.addColorStop(1, 'rgba(255,60,50,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1400, -220);
    ctx.lineTo(1400, 220);
    ctx.closePath();
    ctx.filter = 'blur(8px)';
    ctx.fill();
    ctx.restore();
    // 灯罩
    ctx.fillStyle = '#20232B';
    roundRect(ctx, x - 70, y + 40, 140, 36, 10);
    ctx.fill();
    const dome = ctx.createRadialGradient(x - 15, y - 10, 5, x, y + 10, 75);
    dome.addColorStop(0, '#FFD0C8');
    dome.addColorStop(0.4, '#FF3B30');
    dome.addColorStop(1, '#8A0A0A');
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.ellipse(x, y + 40, 60, 80, 0, Math.PI, 0);
    ctx.fill();
    glow(ctx, x, y + 10, 220, '255,70,60', 0.7 + 0.3 * Math.cos(a));
  }
}

// 「非法闯入？！」警示牌，drop 0..1 从天上砸下来
export function drawWarningSign(ctx, t, drop) {
  const y = lerp(-700, 330, drop);
  ctx.save();
  ctx.translate(W / 2, y);
  ctx.rotate(-0.04 + Math.sin(t * 9) * 0.012);
  // 吊绳
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 8;
  for (const sx of [-330, 330]) {
    ctx.beginPath();
    ctx.moveTo(sx, -230);
    ctx.lineTo(sx * 0.8, -900);
    ctx.stroke();
  }
  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, -455, -205, 930, 450, 40);
  ctx.fill();
  // 黄黑斜纹边框
  ctx.save();
  roundRect(ctx, -470, -225, 940, 450, 40);
  ctx.clip();
  ctx.fillStyle = '#FFD12E';
  ctx.fillRect(-480, -240, 960, 480);
  ctx.fillStyle = '#16161A';
  for (let i = -20; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 70, -240);
    ctx.lineTo(i * 70 + 35, -240);
    ctx.lineTo(i * 70 + 35 + 480, 240);
    ctx.lineTo(i * 70 + 480, 240);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#FFD12E';
  roundRect(ctx, -420, -175, 840, 350, 26);
  ctx.fill();
  // 红色警告三角
  ctx.save();
  ctx.translate(-275, 0);
  ctx.fillStyle = '#E8231C';
  ctx.beginPath();
  ctx.moveTo(0, -110);
  ctx.lineTo(110, 85);
  ctx.lineTo(-110, 85);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 24;
  ctx.strokeStyle = '#E8231C';
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.font = `900 150px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.fillText('!', 0, 72);
  ctx.restore();
  // 文字
  ctx.fillStyle = '#16161A';
  ctx.font = `128px ${FONT_FUN}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('非法', 110, -62);
  ctx.fillText('闯入？！', 120, 78);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// 砸地扬起的灰尘 / 开溜时的烟尘
export function drawDust(ctx, x, y, age, n = 10, seed = 1, scale = 1, color = '200,210,235') {
  if (age < 0 || age > 1.2) return;
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = Math.PI + r() * Math.PI;
    const sp = (60 + r() * 140) * scale;
    const px = x + Math.cos(a) * sp * Math.pow(age, 0.5) * 1.6;
    const py = y + Math.sin(a) * sp * Math.pow(age, 0.5) * 0.5 - age * 30 * scale;
    const rad = (18 + r() * 26) * scale * (0.6 + age);
    ctx.fillStyle = `rgba(${color},${0.35 * clamp(1 - age / 1.2)})`;
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, TAU);
    ctx.fill();
  }
}

// 速度线
export function drawSpeedLines(ctx, x, y, len, k, seed = 2) {
  if (k <= 0) return;
  const r = rng(seed);
  ctx.strokeStyle = `rgba(220,230,255,${0.6 * k})`;
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const yy = y - 420 + r() * 420;
    const l = len * (0.5 + r() * 0.5);
    ctx.lineWidth = 3 + r() * 4;
    ctx.beginPath();
    ctx.moveTo(x - 40 - r() * 60, yy);
    ctx.lineTo(x - 40 - l, yy);
    ctx.stroke();
  }
}

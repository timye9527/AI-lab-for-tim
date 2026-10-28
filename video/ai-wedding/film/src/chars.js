// 参数化角色：全片只用这一份定义，保证每个镜头长得一样
// 坐标：脚底中心为原点，y 向上为负；s=1 时身高约 470px；造型照 ref/style-A.webp
import { shade } from './util.js';

const LINE = '#3b2a26';
const SKIN = '#F5CDA8', SKIN_S = '#E2A983', BLUSH = 'rgba(240,120,110,0.35)';

// 角色配置：颜色值和 制作方案.md 第四节一致
export const CHEN = {
  skin: SKIN, hair: '#1E1B22', hairStyle: 'chen', height: 1, headY: -398, headR: 62, faceW: 1.08,
  shoulder: 66, waist: 74, hip: 66, neck: 8,
  shirt: '#FBF7F0', vest: '#8E2A33', top: '#FBF7F0', sleeve: '#FBF7F0', forearm: SKIN,
  bottom: '#45474F', shoe: '#7A4A2C', bow: '#E8B04B', flower: '#D63A3A', brows: 'thick',
};
export const LI = {
  skin: SKIN, hair: '#17151B', hairStyle: 'li', height: 1.07, headY: -404, headR: 56, faceW: 0.98,
  shoulder: 54, waist: 46, hip: 48, neck: 12,
  top: '#4B8A6C', sleeve: '#4B8A6C', forearm: '#4B8A6C', hood: true,
  bottom: '#C4C7CC', shoe: '#F4F4F2', glasses: true, backpack: '#F2B940', brows: 'thin',
};
// 通用人：同一套身体换发型和配色（员工、路人、客户、合伙人）
export function person(o = {}) {
  return {
    skin: SKIN, hair: '#2A2420', hairStyle: 'short', height: 0.97, headY: -396, headR: 56, faceW: 1,
    shoulder: 52, waist: 48, hip: 50, neck: 10, top: '#7D8FA8', sleeve: '#7D8FA8', forearm: SKIN,
    bottom: '#3E4452', shoe: '#2E2E33', brows: 'thin', ...o,
  };
}
export const BRIDE = person({ hairStyle: 'bob', hair: '#2B211D', top: '#F3C6CF', sleeve: '#F3C6CF', bottom: '#F3C6CF', skirt: true, pearl: true, height: 0.94, shoulder: 46, waist: 40, hip: 54 });
export const GROOM = person({ hairStyle: 'buzz', top: '#2F3E63', sleeve: '#2F3E63', forearm: '#2F3E63', bottom: '#2A2F3A', height: 1.0 });
export const STAFF = [
  person({ hairStyle: 'pony', hair: '#3A2A22', top: '#E9DCC8', sleeve: '#E9DCC8', bottom: '#5B4A44', lanyard: true }), // 策划
  person({ hairStyle: 'bob', hair: '#1E1A1A', top: '#C9D7E6', sleeve: '#C9D7E6', bottom: '#3D4656', lanyard: true }), // 设计
  person({ hairStyle: 'short', hair: '#231F1D', top: '#7A8B6A', sleeve: '#7A8B6A', bottom: '#33373F', lanyard: true, cap: '#4E5A3E' }), // 摄影
  person({ hairStyle: 'spike', hair: '#191717', top: '#5C6E8C', sleeve: '#5C6E8C', bottom: '#2E333D', lanyard: true }), // 摄像
  person({ hairStyle: 'long', hair: '#2C1E1A', top: '#F0B8A8', sleeve: '#F0B8A8', bottom: '#4A4250', lanyard: true, headset: true }), // 剪辑兼前台
];
export const PARTNER = person({ hairStyle: 'pony', hair: '#262222', top: '#9AA0A8', sleeve: '#9AA0A8', bottom: '#4B5058', hood: true });
export const GREY = (k = 0) => person({ hairStyle: ['short', 'bob', 'buzz', 'long'][k % 4], top: ['#9C9488', '#8F98A3', '#A39A8E', '#8A8F86'][k % 4], sleeve: ['#9C9488', '#8F98A3', '#A39A8E', '#8A8F86'][k % 4], bottom: '#5E6068' });

export function pose(o = {}) {
  return { x: 0, y: 0, s: 1, flip: 1, bob: 0, lean: 0, armL: [0.15, 0.1], armR: [0.15, 0.1], handL: 'open', handR: 'open',
    expr: 'smile', blink: 0, look: 0, walk: -1, sweat: 0, glint: 0, jump: 0, squash: 1, alpha: 1, sil: 0, ...o };
}

function outline(ctx, w = 3) { ctx.lineWidth = w; ctx.strokeStyle = LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
function fillO(ctx, c, w) { ctx.fillStyle = c; ctx.fill(); outline(ctx, w); }

function limb(ctx, x, y, a, len, w, color, end) {
  // 一节肢体：从 (x,y) 按角度 a（0 = 竖直向下，正值向外）伸出
  const ex = x + Math.sin(a) * len, ey = y + Math.cos(a) * len;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey);
  ctx.lineWidth = w + 6; ctx.strokeStyle = LINE; ctx.lineCap = 'round'; ctx.stroke();
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke();
  return [ex, ey];
}

function arm(ctx, C, side, ang, hand) {
  const sx = side * (C.shoulder - 6), sy = -322;
  const [a1, a2] = ang;
  const [ex, ey] = limb(ctx, sx, sy, side * a1, 70, 30, C.sleeve);
  const [hx, hy] = limb(ctx, ex, ey, side * (a1 + a2), 64, 25, C.forearm === SKIN ? SKIN : C.forearm);
  if (C.forearm !== SKIN && C.sleeve === C.forearm) {
    // 袖口
    ctx.beginPath(); ctx.arc(hx, hy, 12, 0, 7); fillO(ctx, shade(C.sleeve, -0.15), 3);
  }
  // 手
  ctx.beginPath();
  if (hand === 'fist') ctx.arc(hx + side * 2, hy + 6, 14, 0, 7);
  else ctx.ellipse(hx + side * 2, hy + 8, 13, 16, side * (a1 + a2) * 0.5, 0, 7);
  fillO(ctx, C.skin, 3);
  if (hand === 'point') {
    ctx.beginPath(); ctx.moveTo(hx, hy + 8); ctx.lineTo(hx + side * 26, hy + 22);
    ctx.lineWidth = 9; ctx.strokeStyle = LINE; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = C.skin; ctx.stroke();
  }
  return [hx + side * 2, hy + 8];
}

function legs(ctx, C, p) {
  const hipY = -206, footY = -16;
  const sw = p.walk >= 0 ? Math.sin(p.walk * Math.PI * 2) * 0.32 : 0;
  for (const side of [-1, 1]) {
    const a = side * sw;
    const x0 = side * (C.hip * 0.42);
    const len = footY - hipY;
    const ex = x0 + Math.sin(a) * len, ey = hipY + Math.cos(a) * len;
    // 裤腿
    ctx.beginPath();
    ctx.moveTo(x0 - 21, hipY); ctx.lineTo(ex - 19, ey); ctx.lineTo(ex + 19, ey); ctx.lineTo(x0 + 21, hipY); ctx.closePath();
    fillO(ctx, C.bottom, 3);
    // 鞋
    ctx.beginPath(); ctx.ellipse(ex + 8, ey + 4, 30, 15, 0, Math.PI, 0); ctx.lineTo(ex + 38, ey + 12); ctx.lineTo(ex - 22, ey + 12); ctx.closePath();
    fillO(ctx, C.shoe, 3);
    if (C.shoe === '#F4F4F2') { ctx.beginPath(); ctx.moveTo(ex - 20, ey + 8); ctx.lineTo(ex + 36, ey + 8); ctx.strokeStyle = '#C9CCD2'; ctx.lineWidth = 3; ctx.stroke(); }
  }
}

function torso(ctx, C) {
  const top = -336, bot = -196, sw = C.shoulder, ww = C.waist, hw = C.hip;
  if (C.backpack) {
    rrect(ctx, -sw - 8, top + 20, 2 * sw + 16, 120, 26); fillO(ctx, C.backpack, 3);
  }
  ctx.beginPath();
  ctx.moveTo(-sw, top + 12);
  ctx.quadraticCurveTo(-sw - 4, top, -sw + 18, top - 4);
  ctx.lineTo(sw - 18, top - 4);
  ctx.quadraticCurveTo(sw + 4, top, sw, top + 12);
  ctx.quadraticCurveTo(ww + 8, (top + bot) / 2 + 10, hw, bot);
  ctx.lineTo(-hw, bot);
  ctx.quadraticCurveTo(-ww - 8, (top + bot) / 2 + 10, -sw, top + 12);
  ctx.closePath();
  fillO(ctx, C.skirt ? C.top : (C.shirt || C.top), 3);
  if (C.skirt) {
    ctx.beginPath(); ctx.moveTo(-hw + 4, bot - 6); ctx.lineTo(hw - 4, bot - 6); ctx.lineTo(hw + 26, bot + 96); ctx.lineTo(-hw - 26, bot + 96); ctx.closePath();
    fillO(ctx, C.bottom, 3);
  }
  // 暗部：右侧一条（光从左上来）
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(80,40,30,0.13)'; ctx.fillRect(sw * 0.35, top - 10, 200, 260);
  ctx.restore();
  if (C.vest) {
    // 马甲：前襟开 V 露衬衫
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * (sw - 2), top + 8);
      ctx.lineTo(side * 18, top - 2);
      ctx.lineTo(side * 4, top + 74);
      ctx.lineTo(side * 4, bot + 6);
      ctx.lineTo(side * hw, bot + 6);
      ctx.quadraticCurveTo(side * (ww + 8), (top + bot) / 2 + 10, side * sw, top + 12);
      ctx.closePath();
      fillO(ctx, side > 0 ? shade(C.vest, -0.14) : C.vest, 3);
    }
    for (const yy of [top + 92, top + 118]) { ctx.beginPath(); ctx.arc(-10, yy, 4, 0, 7); ctx.fillStyle = '#E8B04B'; ctx.fill(); }
  }
  if (C.hood) {
    // 帽兜和抽绳
    ctx.beginPath(); ctx.ellipse(0, top + 4, sw * 0.75, 22, 0, 0, Math.PI); fillO(ctx, shade(C.top, -0.12), 3);
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 12, top + 20); ctx.lineTo(side * 14, top + 72); ctx.strokeStyle = '#EDEDE6'; ctx.lineWidth = 4; ctx.stroke(); }
    // 口袋
    ctx.beginPath(); ctx.moveTo(-sw * 0.6, bot - 40); ctx.lineTo(sw * 0.6, bot - 40); ctx.strokeStyle = shade(C.top, -0.25); ctx.lineWidth = 3; ctx.stroke();
  }
  if (C.backpack) {
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * (sw - 14), top + 2); ctx.lineTo(side * (sw - 20), top + 110); ctx.lineWidth = 11; ctx.strokeStyle = LINE; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = C.backpack; ctx.stroke(); }
  }
  if (C.lanyard) {
    ctx.beginPath(); ctx.moveTo(-14, top); ctx.lineTo(0, top + 60); ctx.lineTo(14, top); ctx.strokeStyle = '#8E2A33'; ctx.lineWidth = 4; ctx.stroke();
    rrect(ctx, -11, top + 58, 22, 28, 4); fillO(ctx, '#FFFFFF', 2);
  }
  if (C.flower) {
    ctx.save(); ctx.translate(-sw * 0.5, top + 40);
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(Math.cos(i * 1.26) * 7, Math.sin(i * 1.26) * 7, 7, 7, 0, 0, 7); ctx.fillStyle = C.flower; ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fillStyle = '#F7D36A'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, 10, 8, 4, 0.6, 0, 7); ctx.fillStyle = '#4E8A4C'; ctx.fill();
    ctx.restore();
  }
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function hairBack(ctx, C, hy, r) {
  if (C.hairStyle === 'long' || C.hairStyle === 'bob') {
    ctx.beginPath();
    const L = C.hairStyle === 'long' ? 1.9 : 1.15;
    ctx.moveTo(-r * 1.08, hy - r * 0.2);
    ctx.quadraticCurveTo(-r * 1.25, hy + r * L * 0.7, -r * 0.9, hy + r * L);
    ctx.lineTo(r * 0.9, hy + r * L);
    ctx.quadraticCurveTo(r * 1.25, hy + r * L * 0.7, r * 1.08, hy - r * 0.2);
    ctx.closePath(); fillO(ctx, C.hair, 3);
  }
  if (C.hairStyle === 'pony') {
    ctx.beginPath(); ctx.ellipse(r * 0.95, hy - r * 0.2, r * 0.32, r * 0.7, -0.5, 0, 7); fillO(ctx, C.hair, 3);
  }
}

function hairFront(ctx, C, hy, r, t) {
  const H = C.hair;
  ctx.beginPath();
  if (C.hairStyle === 'chen') {
    // 三七分短发 + 头顶一撮翘毛
    ctx.moveTo(-r * 1.02, hy + r * 0.05);
    ctx.quadraticCurveTo(-r * 1.12, hy - r * 1.05, -r * 0.1, hy - r * 1.12);
    ctx.quadraticCurveTo(r * 1.0, hy - r * 1.12, r * 1.04, hy + r * 0.02);
    ctx.quadraticCurveTo(r * 0.92, hy - r * 0.42, r * 0.52, hy - r * 0.55);
    ctx.quadraticCurveTo(-r * 0.15, hy - r * 0.62, -r * 0.42, hy - r * 0.85); // 分线
    ctx.quadraticCurveTo(-r * 0.7, hy - r * 0.45, -r * 1.02, hy + r * 0.05);
    ctx.closePath(); fillO(ctx, H, 3);
    ctx.beginPath(); ctx.moveTo(-r * 0.05, hy - r * 1.1);
    ctx.bezierCurveTo(-r * 0.1, hy - r * 1.55, r * 0.45, hy - r * 1.5, r * 0.25, hy - r * 1.28);
    ctx.lineWidth = 9; ctx.strokeStyle = LINE; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = H; ctx.stroke();
    // 高光
    ctx.beginPath(); ctx.ellipse(-r * 0.45, hy - r * 0.86, r * 0.22, r * 0.07, -0.4, 0, 7); ctx.fillStyle = 'rgba(140,150,190,0.55)'; ctx.fill();
    return;
  }
  if (C.hairStyle === 'li') {
    // 蓬松短发 + 刘海
    ctx.moveTo(-r * 1.08, hy + r * 0.15);
    ctx.quadraticCurveTo(-r * 1.3, hy - r * 1.0, -r * 0.3, hy - r * 1.22);
    ctx.quadraticCurveTo(r * 0.5, hy - r * 1.42, r * 1.1, hy - r * 0.75);
    ctx.quadraticCurveTo(r * 1.25, hy - r * 0.2, r * 1.06, hy + r * 0.2);
    ctx.lineTo(r * 0.82, hy - r * 0.28);
    ctx.lineTo(r * 0.6, hy - r * 0.18); ctx.lineTo(r * 0.45, hy - r * 0.5);
    ctx.lineTo(r * 0.18, hy - r * 0.22); ctx.lineTo(r * 0.0, hy - r * 0.55);
    ctx.lineTo(-r * 0.3, hy - r * 0.2); ctx.lineTo(-r * 0.45, hy - r * 0.52);
    ctx.lineTo(-r * 0.75, hy - r * 0.25); ctx.lineTo(-r * 0.9, hy - r * 0.05);
    ctx.closePath(); fillO(ctx, H, 3);
    ctx.beginPath(); ctx.ellipse(r * 0.1, hy - r * 1.0, r * 0.3, r * 0.08, -0.2, 0, 7); ctx.fillStyle = 'rgba(140,150,190,0.5)'; ctx.fill();
    return;
  }
  const st = C.hairStyle;
  const fringe = st === 'buzz' ? 0.55 : st === 'spike' ? 0.4 : 0.45;
  ctx.moveTo(-r * 1.04, hy + r * (st === 'buzz' ? -0.2 : 0.1));
  ctx.quadraticCurveTo(-r * 1.1, hy - r * 1.1, 0, hy - r * 1.12);
  ctx.quadraticCurveTo(r * 1.1, hy - r * 1.1, r * 1.04, hy + r * (st === 'buzz' ? -0.2 : 0.1));
  if (st === 'spike') { for (let i = 4; i >= -4; i--) ctx.lineTo(i * r * 0.24, hy - r * (i % 2 ? fringe : fringe + 0.25)); }
  else ctx.quadraticCurveTo(0, hy - r * fringe - r * 0.25, -r * 1.04, hy + r * (st === 'buzz' ? -0.2 : 0.1));
  ctx.closePath(); fillO(ctx, H, 3);
  if (C.cap) { ctx.beginPath(); ctx.ellipse(0, hy - r * 0.85, r * 1.05, r * 0.45, 0, Math.PI, 0); fillO(ctx, C.cap, 3); ctx.beginPath(); ctx.ellipse(r * 0.6, hy - r * 0.62, r * 0.6, r * 0.12, 0, 0, 7); fillO(ctx, shade(C.cap, -0.2), 3); }
  if (C.pearl) { ctx.beginPath(); ctx.arc(r * 0.62, hy - r * 0.5, 6, 0, 7); fillO(ctx, '#FFFDF5', 2); }
}

function eyes(ctx, C, p, hy, r) {
  const ey = hy + r * 0.12, ex = r * 0.38, lx = p.look * r * 0.08;
  const e = p.expr;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const x = side * ex + lx;
    if (p.blink > 0.5 || e === 'happy' || e === 'grin') {
      // 眯眼笑：倒 U
      ctx.beginPath(); ctx.arc(x, ey + 4, r * 0.16, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 5; ctx.strokeStyle = LINE; ctx.stroke();
      continue;
    }
    if (e === 'star') {
      ctx.save(); ctx.translate(x, ey); ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.08 : r * 0.2; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
      ctx.closePath(); ctx.fillStyle = '#F7C948'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = LINE; ctx.stroke(); ctx.restore();
      continue;
    }
    const big = e === 'shock' ? 1.25 : 1;
    ctx.beginPath(); ctx.ellipse(x, ey, r * 0.15 * big, r * 0.2 * big, 0, 0, 7); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke();
    const pr = e === 'shock' ? 0.06 : 0.11;
    ctx.beginPath(); ctx.ellipse(x + lx * 0.5, ey + r * 0.02, r * pr, r * (pr + 0.04), 0, 0, 7); ctx.fillStyle = '#2B1D1A'; ctx.fill();
    ctx.beginPath(); ctx.arc(x + lx * 0.5 - r * 0.04, ey - r * 0.05, r * 0.04, 0, 7); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  }
  // 眉毛
  const bw = C.brows === 'thick' ? 8 : 4.5;
  for (const side of [-1, 1]) {
    const x = side * ex + lx;
    let tilt = 0, up = 0;
    if (e === 'worry' || e === 'pout') tilt = -0.35;
    if (e === 'shock') up = -6;
    if (e === 'brow') { tilt = side > 0 ? 0.3 : -0.1; up = side > 0 ? -8 : 0; }
    if (e === 'confident') tilt = 0.15;
    ctx.save(); ctx.translate(x, ey - r * 0.36 + up); ctx.rotate(side * tilt);
    ctx.beginPath(); ctx.moveTo(-r * 0.16, 0); ctx.quadraticCurveTo(0, -r * 0.06, r * 0.16, 0);
    ctx.lineWidth = bw; ctx.strokeStyle = C.hair; ctx.stroke(); ctx.restore();
  }
  if (C.glasses) {
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * ex + lx, ey, r * 0.27, 0, 7); ctx.lineWidth = 4.5; ctx.strokeStyle = '#1C1A1E'; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-ex + r * 0.27 + lx, ey); ctx.lineTo(ex - r * 0.27 + lx, ey); ctx.stroke();
    if (p.glint > 0) {
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * ex + lx, ey, r * 0.25, 0, 7); ctx.fillStyle = `rgba(255,255,255,${0.85 * p.glint})`; ctx.fill(); }
    }
  }
}

function mouth(ctx, p, hy, r) {
  const my = hy + r * 0.55, e = p.expr;
  ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.lineCap = 'round';
  ctx.beginPath();
  if (e === 'grin' || e === 'star' || e === 'shock') {
    const h = e === 'shock' ? r * 0.2 : r * 0.17;
    if (e === 'shock') ctx.ellipse(0, my, r * 0.12, h, 0, 0, 7);
    else { ctx.moveTo(-r * 0.22, my - 3); ctx.quadraticCurveTo(0, my + h * 1.6, r * 0.22, my - 3); ctx.closePath(); }
    ctx.fillStyle = '#7A2E2E'; ctx.fill(); ctx.stroke();
    return;
  }
  if (e === 'worry' || e === 'pout') { ctx.moveTo(-r * 0.14, my + 4); ctx.quadraticCurveTo(0, my - 6, r * 0.14, my + 4); ctx.stroke(); return; }
  if (e === 'stiff') { ctx.moveTo(-r * 0.2, my); for (let i = 1; i <= 6; i++) ctx.lineTo(-r * 0.2 + i * r * 0.4 / 6, my + (i % 2 ? -3 : 3)); ctx.stroke(); return; }
  if (e === 'flat' || e === 'think') { ctx.moveTo(-r * 0.12, my); ctx.lineTo(r * 0.12, my); ctx.stroke(); return; }
  // smile / happy / confident / brow
  ctx.moveTo(-r * 0.18, my - 3); ctx.quadraticCurveTo(0, my + r * 0.16, r * 0.18, my - 3); ctx.stroke();
}

function head(ctx, C, p) {
  const hy = C.headY, r = C.headR, fw = C.faceW;
  hairBack(ctx, C, hy, r);
  // 脖子
  ctx.beginPath(); ctx.rect(-r * 0.22, hy + r * 0.7, r * 0.44, C.neck + 24); fillO(ctx, SKIN_S, 3);
  // 耳朵
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * r * fw * 0.98, hy + r * 0.12, r * 0.16, r * 0.22, 0, 0, 7); fillO(ctx, C.skin, 3); }
  // 脸：下巴略收
  ctx.beginPath();
  ctx.moveTo(-r * fw, hy);
  ctx.bezierCurveTo(-r * fw, hy - r * 1.3, r * fw, hy - r * 1.3, r * fw, hy);
  ctx.bezierCurveTo(r * fw, hy + r * 0.75, r * 0.4, hy + r * 1.0, 0, hy + r * 1.0);
  ctx.bezierCurveTo(-r * 0.4, hy + r * 1.0, -r * fw, hy + r * 0.75, -r * fw, hy);
  ctx.closePath(); fillO(ctx, C.skin, 3);
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(200,120,90,0.14)'; ctx.beginPath(); ctx.ellipse(r * 0.95, hy + r * 0.2, r * 0.5, r * 1.2, 0, 0, 7); ctx.fill(); ctx.restore();
  // 腮红
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * r * 0.55, hy + r * 0.42, r * 0.15, r * 0.08, 0, 0, 7); ctx.fillStyle = BLUSH; ctx.fill(); }
  eyes(ctx, C, p, hy, r);
  mouth(ctx, p, hy, r);
  hairFront(ctx, C, hy, r);
  if (C.headset) { ctx.beginPath(); ctx.arc(0, hy - r * 0.1, r * 1.08, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 6; ctx.strokeStyle = '#2E2E33'; ctx.stroke(); ctx.beginPath(); ctx.arc(-r * 1.05, hy + r * 0.15, 10, 0, 7); fillO(ctx, '#2E2E33', 2); }
  if (p.sweat > 0) {
    ctx.save(); ctx.globalAlpha = p.sweat; ctx.translate(r * 0.95, hy - r * 0.5 + (1 - p.sweat) * 10);
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(10, 4, 0, 8); ctx.quadraticCurveTo(-10, 4, 0, -14); fillO(ctx, '#BFE7FF', 2.5); ctx.restore();
  }
}

// 画一个角色
export function figure(ctx, C, P) {
  const p = pose(P);
  if (p.alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= p.alpha;
  ctx.translate(p.x, p.y - p.bob - p.jump);
  ctx.scale(p.s * p.flip * C.height, p.s * C.height * p.squash);
  ctx.rotate(p.lean);
  // 地面影子
  ctx.save(); ctx.scale(1, 1 / p.squash); ctx.beginPath(); ctx.ellipse(0, (p.jump + p.bob) / (p.s * C.height), 90, 16, 0, 0, 7); ctx.fillStyle = 'rgba(40,20,10,0.18)'; ctx.fill(); ctx.restore();
  legs(ctx, C, p);
  torso(ctx, C);
  head(ctx, C, p);
  if (C.bow) {
    ctx.save(); ctx.translate(0, -328);
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(side * 24, -12); ctx.lineTo(side * 24, 12); ctx.closePath(); fillO(ctx, C.bow, 2.5); }
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); fillO(ctx, shade(C.bow, -0.15), 2.5); ctx.restore();
  }
  arm(ctx, C, -1, p.armL, p.handL);
  arm(ctx, C, 1, p.armR, p.handR);
  ctx.restore();
  if (p.sil > 0) {
    // 剪影：整个角色压成深色（逆光）
  }
}

// AI 小光球：全片 AI 的唯一形象
export function orb(ctx, x, y, s = 1, t = 0, o = {}) {
  const r = 30 * s;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  // 星点尾巴
  if (o.trail) {
    for (let i = 0; i < 8; i++) {
      const k = i / 8, tx = x - o.trail[0] * k * 120 * s, ty = y - o.trail[1] * k * 120 * s + Math.sin(t * 9 + i) * 6 * s;
      ctx.beginPath(); ctx.arc(tx, ty, (1 - k) * 6 * s, 0, 7); ctx.fillStyle = `rgba(160,240,255,${0.7 * (1 - k)})`; ctx.fill();
    }
  }
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
  g.addColorStop(0, 'rgba(120,230,255,0.55)'); g.addColorStop(1, 'rgba(120,230,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, 7); ctx.fill();
  const g2 = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g2.addColorStop(0, '#F2FEFF'); g2.addColorStop(0.45, '#7FE4F7'); g2.addColorStop(1, '#2BA9CF');
  ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.lineWidth = 2.5 * s; ctx.strokeStyle = 'rgba(30,110,150,0.7)'; ctx.stroke();
  // 眼睛（会眨）
  const bl = (Math.sin(t * 1.7) > 0.97) ? 0.2 : 1;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + side * r * 0.32, y + r * 0.02, r * 0.11, r * 0.15 * bl, 0, 0, 7); ctx.fillStyle = '#FFFFFF'; ctx.fill(); }
  // 闪光
  const sp = 0.6 + 0.4 * Math.sin(t * 5);
  ctx.strokeStyle = `rgba(255,255,255,${sp})`; ctx.lineWidth = 2.5 * s;
  for (const [dx, dy, L] of [[1.15, -1.0, 10], [-1.3, 0.6, 7]]) {
    const cx = x + dx * r, cy = y + dy * r;
    ctx.beginPath(); ctx.moveTo(cx - L * s, cy); ctx.lineTo(cx + L * s, cy); ctx.moveTo(cx, cy - L * s); ctx.lineTo(cx, cy + L * s); ctx.stroke();
  }
  ctx.restore();
}

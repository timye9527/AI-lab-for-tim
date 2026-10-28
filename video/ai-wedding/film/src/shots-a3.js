// 第三幕：街对面来了个更狠的（C28–C38，反转② 在 C35）
import { W, H, clamp, lerp, ph, ease, eout, back, pop, wave, rng, rr, FONT, figure, orb, CHEN, LI, STAFF, BRIDE, GROOM, PARTNER, person, S, I, label, big, blink, breathe, camK, fade, beat } from './kit.js';

const PHOTO = person({ hairStyle: 'short', cap: '#4E5A3E', top: '#7A8B6A', sleeve: '#7A8B6A' });
const MAKEUP = person({ hairStyle: 'long', hair: '#3A2A22', top: '#E9A0B0', sleeve: '#E9A0B0' });
const DECOR = person({ hairStyle: 'buzz', top: '#C98A4A', sleeve: '#C98A4A' });

function avatar(c, C, x, y, k, name) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(back(k), back(k));
  c.beginPath(); c.arc(0, 0, 90, 0, 7); c.fillStyle = '#FFF8EA'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#3b2a26'; c.stroke();
  c.save(); c.beginPath(); c.arc(0, 0, 86, 0, 7); c.clip(); figure(c, C, { x: 0, y: 330, s: 0.78, expr: 'smile' }); c.restore();
  c.restore();
  label(c, name, x, y + 130, { size: 40, color: '#3b2a26', bg: '#FFF8EA', pad: 16, alpha: k });
}

export const A3 = {
  C28(c, t, X) {
    const k = ease(ph(t, 0, X.d * 0.6));
    S.studio(c, { cam: camK({ x: 600, y: 520, z: 1.3 }, { x: 900, y: 540, z: 1.05 }, k) });
    const pose = t > X.d * 0.55 ? { armR: [2.7 + wave(t, 2.5, 0.25), 0.4], expr: 'confident' } : { armR: [2.4, 1.2], expr: 'smile' };
    figure(c, LI, { x: 900, y: 1060, s: 1.25, blink: blink(t), ...pose, bob: breathe(t) });
    // 亮相定格：放射线 + 名牌
    const f = ph(t, X.d * 0.55, X.d * 0.55 + 0.3);
    if (f > 0) { I.speedLines(c, 900, 500, 0.5 * f, 1, 'rgba(79,216,240,0.35)'); label(c, '小李 · 工作室', 900, 300, { size: 52, color: '#FFFDF5', bg: '#2F7F77', pad: 24, scale: back(f) }); }
  },
  C29(c, t, X) {
    S.paper(c);
    c.fillStyle = 'rgba(200,52,58,0.08)'; c.fillRect(0, 0, W / 2, H); c.fillStyle = 'rgba(43,179,168,0.08)'; c.fillRect(W / 2, 0, W / 2, H);
    figure(c, CHEN, { x: 300, y: 900, s: 0.9, expr: 'confident' });
    [0, 1, 2, 3, 4].forEach((i) => figure(c, STAFF[i], { x: 160 + i * 70 + (i > 1 ? 200 : 0), y: 760, s: 0.48, expr: 'smile' }));
    figure(c, LI, { x: 1500, y: 900, s: 0.9, expr: 'smile' }); figure(c, PARTNER, { x: 1700, y: 900, s: 0.85 });
    label(c, '6 人', 400, 330, { size: 70, weight: 900, color: '#C8343A' }); label(c, '2 人', 1600, 330, { size: 70, weight: 900, color: '#2F7F77' });
    // 天平：以前往小陈这边沉（旧照片色）
    const b = beat(X, 1), a = -0.2 * ease(ph(t, b, b + 0.8));
    c.save(); c.translate(960, 600);
    c.fillStyle = '#8A5E3E'; c.fillRect(-10, -220, 20, 360); c.rotate(a);
    rr(c, -300, -230, 600, 18, 8); c.fill();
    for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 290, -220); c.lineTo(sx * 290 - 70, -100); c.lineTo(sx * 290 + 70, -100); c.closePath(); c.strokeStyle = '#3b2a26'; c.lineWidth = 4; c.stroke(); c.beginPath(); c.ellipse(sx * 290, -100, 80, 16, 0, 0, 7); c.fillStyle = sx < 0 ? '#C8343A' : '#2BB3A8'; c.fill(); c.stroke(); }
    c.restore();
    if (t > b) { c.save(); c.globalCompositeOperation = 'color'; c.fillStyle = `rgba(168,138,98,${0.7 * ph(t, b, b + 0.4)})`; c.fillRect(0, 0, W, H); c.restore(); label(c, '以前', 960, 160, { size: 52, color: '#FFFDF5', bg: '#6E5A44', pad: 20, alpha: ph(t, b, b + 0.3) }); }
  },
  C30(c, t, X) {
    const b = beat(X, 1), k = ease(ph(t, b - 0.3, b + 0.6));
    S.studio(c, { cam: camK({ x: 960, y: 600, z: 1.3 }, { x: 960, y: 540, z: 0.85 }, k) });
    figure(c, LI, { x: 780, y: 1080, s: 1.1, expr: 'confident', armR: [1.5, 0.9], blink: blink(t) });
    orb(c, 960, 520, 1.2, t);
    ['设计', '策划', '宣传'].forEach((s2, i) => { const bb = X.d * 0.12 + i * 0.5; const p = pop(t, bb); if (p > 0) label(c, s2, 760 + i * 200, 360, { size: 46, color: '#FFFDF5', bg: '#2BA9CF', pad: 18, scale: p }); });
    // 合作伙伴：虚线连出去
    const parts = [[PHOTO, 1450, 300, '摄影'], [MAKEUP, 1650, 600, '化妆'], [DECOR, 1400, 860, '布置']];
    parts.forEach(([C, x, y, n], i) => {
      const kk = ph(t, b + i * 0.4, b + i * 0.4 + 0.4);
      if (kk <= 0) return;
      c.save(); c.setLineDash([16, 12]); c.lineDashOffset = -t * 40; c.beginPath(); c.moveTo(1000, 520); c.lineTo(lerp(1000, x, kk), lerp(520, y, kk)); c.lineWidth = 6; c.strokeStyle = '#2BA9CF'; c.stroke(); c.restore();
      avatar(c, C, x, y, ph(t, b + i * 0.4 + 0.3, b + i * 0.4 + 0.7), n);
    });
  },
  C31(c, t, X) {
    S.street(c, { light: 'day', t, cam: { x: 960 + t * 30, y: 640, z: 1.2 } });
    // 赛跑：小陈背大背篓，小李背小书包
    const run = t * 1.6;
    c.save(); c.translate(0, 0);
    // 背篓
    const cx = 640 + t * 40, lx = 1000 + t * 120;
    figure(c, CHEN, { x: cx, y: 1000, s: 1.0, walk: run * 0.7, expr: 'worry', sweat: 1, lean: 0.12, armL: [0.6, 0.6], armR: [0.6, 0.6], bob: Math.abs(Math.sin(run * 2.2)) * 4 });
    c.save(); c.translate(cx - 90, 560); rr(c, -110, -80, 220, 240, 30); c.fillStyle = '#A8754E'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#3b2a26'; c.stroke();
    for (let j = 0; j < 5; j++) { c.beginPath(); c.moveTo(-110, -40 + j * 44); c.lineTo(110, -40 + j * 44); c.strokeStyle = '#7A5236'; c.lineWidth = 3; c.stroke(); }
    label(c, '工资', 0, -10, { size: 46, weight: 900, color: '#FFFDF5', bg: '#C8343A', pad: 12 }); label(c, '房租', 0, 80, { size: 46, weight: 900, color: '#FFFDF5', bg: '#C8343A', pad: 12 }); c.restore();
    figure(c, LI, { x: lx, y: 1000, s: 1.0, walk: run, expr: 'happy', lean: 0.06, armL: [0.4 + Math.sin(run * 6.28) * 0.5, 0.6], armR: [0.4 - Math.sin(run * 6.28) * 0.5, 0.6], bob: Math.abs(Math.sin(run * 3.14)) * 14 });
    c.restore();
  },
  C32(c, t, X) {
    S.paper(c);
    const L = X.L[0];
    const k1 = ph(t, L.s + 0.2, L.s + 0.6), k2 = ph(t, L.s + (L.e - L.s) * 0.62, L.s + (L.e - L.s) * 0.62 + 0.4);
    if (k1 > 0) I.priceTag(c, 560, 120 + 420 * back(k1), '¥10000', '#C8343A', 1.25, wave(t, 0.8, 0.05) * (1 - ph(t, L.e, L.e + 1)), { who: '小陈', size: 84 });
    if (k2 > 0) I.priceTag(c, 1380, 120 + 420 * back(k2), '¥7000', '#2F7F77', 1.25, -wave(t, 0.8, 0.05) * (1 - ph(t, L.e, L.e + 1)), { who: '小李', size: 84 });
  },
  C33(c, t, X) {
    S.shop(c, { cam: { x: 960, y: 600, z: 1.25 } });
    figure(c, GROOM, { x: 760, y: 1120, s: 1.2, expr: 'think', look: wave(t, 0.7, 1), blink: blink(t) });
    figure(c, BRIDE, { x: 1160, y: 1120, s: 1.15, expr: 'think', look: -wave(t, 0.7, 1), blink: blink(t, 1) });
    // 两本册子
    for (const [x, col] of [[640, '#C8343A'], [1290, '#2F7F77']]) { c.save(); c.translate(x, 760); c.rotate(x < 960 ? -0.15 : 0.15); rr(c, -90, -120, 180, 240, 10); c.fillStyle = col; c.fill(); c.lineWidth = 5; c.strokeStyle = '#3b2a26'; c.stroke(); c.beginPath(); c.arc(0, -20, 50, Math.PI, 0); c.strokeStyle = '#FFF3D6'; c.lineWidth = 10; c.stroke(); c.restore(); }
    const b = beat(X, 1);
    big(c, '−3000', 960, 300, 110, '#C8343A', { scale: pop(t, X.L[1].e - 1.2) });
  },
  C34(c, t, X) {
    const k = ease(ph(t, 0, X.d));
    S.street(c, { light: 'day', t, cam: camK({ x: 500, y: 560, z: 1.25 }, { x: 1420, y: 560, z: 1.25 }, k) });
    S.withCam(c, camK({ x: 500, y: 560, z: 1.25 }, { x: 1420, y: 560, z: 1.25 }, k), 1, () => {
      for (let i = 0; i < 7; i++) {
        const f = ph(t, i * 0.18, i * 0.18 + 1.4);
        const x = lerp(380, 1600, ease(f)), y = 560 - Math.sin(f * Math.PI) * 240 + i * 14;
        c.save(); c.translate(x, y); c.rotate(f * 6 + i); rr(c, -40, -50, 80, 100, 8); c.fillStyle = ['#F6D5C9', '#D7E2EE', '#F3E2B8'][i % 3]; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3b2a26'; c.stroke(); c.restore();
      }
    });
  },
  C35(c, t, X) {
    S.paper(c);
    const L = X.L[0];
    I.priceTag(c, 900, 520, '¥10000', '#C8343A', 1.5, -0.05, { size: 84, slash: ph(t, L.s + 0.2, L.s + 0.9) });
    I.arrow(c, 1340, 360, 1340, 360 + 360 * eout(ph(t, L.s + 0.8, L.e)), '#3b2a26', 24);
    // 不情愿的手
    c.save(); c.translate(lerp(560, 1100, ph(t, L.s + 0.2, L.s + 0.9)), 640); c.rotate(-0.4);
    rr(c, -30, -16, 260, 40, 16); c.fillStyle = '#C8343A'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3b2a26'; c.stroke();
    c.beginPath(); c.ellipse(-40, 4, 50, 40, 0, 0, 7); c.fillStyle = '#F5CDA8'; c.fill(); c.stroke(); c.restore();
    fade(c, 0.45 * (ph(t, L.e - 0.25, L.e - 0.15) - ph(t, L.e - 0.1, L.e + 0.2)), '#FFFDF0');
  },
  C36(c, t, X) {
    S.paper(c);
    const L = X.L[0];
    const press = ease(ph(t, L.s, L.e));
    // 上板「价格」往下压，下板「成本」不动
    const top = lerp(200, 430, press);
    rr(c, 460, top - 70, 1000, 70, 14); c.fillStyle = '#C8343A'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#3b2a26'; c.stroke();
    label(c, '价格', 960, top - 35, { size: 46, weight: 900, color: '#FFFDF5' });
    I.arrow(c, 960, top - 200, 960, top - 90, '#3b2a26', 14);
    rr(c, 460, 640, 1000, 90, 14); c.fillStyle = '#5A4A44'; c.fill(); c.stroke();
    label(c, '工资 · 房租 · 经营成本', 960, 685, { size: 46, weight: 900, color: '#FFFDF5' });
    I.pancake(c, 960, 600 - (1 - press) * 40, 420, clamp(1 - press * 0.95));
    figure(c, CHEN, { x: 1650, y: 1000, s: 0.8, expr: 'worry', sweat: 1 });
  },
  C37(c, t, X) {
    S.paper(c);
    const b = beat(X, 1);
    // 玻璃罐「AI 省下的钱」
    c.save(); c.translate(760, 560);
    const tilt = -0.6 * ease(ph(t, b, b + 0.8));
    c.rotate(tilt);
    rr(c, -170, -260, 340, 440, 40); c.fillStyle = 'rgba(220,240,250,0.55)'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#3b2a26'; c.stroke();
    for (let i = 0; i < 22; i++) { const fly = ph(t, b + 0.6 + i * 0.04, b + 1.4 + i * 0.04); if (fly > 0) continue; I.coin(c, -110 + (i % 5) * 55, 140 - Math.floor(i / 5) * 46, 26, i); }
    c.restore();
    label(c, 'AI 省下的钱', 760, 220, { size: 52, color: '#FFFDF5', bg: '#2BA9CF', pad: 20 });
    // 金币流：只有一部分进小陈口袋
    for (let i = 0; i < 22; i++) {
      const f = ph(t, b + 0.6 + i * 0.04, b + 1.4 + i * 0.04);
      if (f <= 0) continue;
      const toChen = i % 4 === 0;
      const x = lerp(900, toChen ? 1420 : 1500 + (i % 3) * 120, ease(f)), y = lerp(500, toChen ? 760 : 1200, ein(f));
      I.coin(c, x, y, 26, t * 5 + i);
    }
    figure(c, CHEN, { x: 1420, y: 1080, s: 1.0, expr: t > b + 1.2 ? 'worry' : 'smile', armL: [0.9, 1.4], armR: [0.9, 1.4] });
  },
  C38(c, t, X) {
    S.paper(c);
    const b1 = beat(X, 1);
    // 三股金币流：粗细示意
    const streams = [
      { to: [400, 700], w: 26, name: '留给小陈', k: ph(t, 0, 0.8) },
      { to: [960, 720], w: 60, name: '客户低价', k: ph(t, 0.4, 1.4) },
      { to: [1520, 700], w: 46, name: '新竞争者', k: ph(t, b1, b1 + 1.0) },
    ];
    c.save(); c.translate(960, 220);
    rr(c, -150, -90, 300, 160, 30); c.fillStyle = 'rgba(220,240,250,0.8)'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#3b2a26'; c.stroke();
    c.restore();
    label(c, 'AI 省下的钱', 960, 210, { size: 46, color: '#2B6A80' });
    streams.forEach((s2, i) => {
      if (s2.k <= 0) return;
      const [x, y] = s2.to, ex = lerp(960, x, s2.k), ey = lerp(310, y - 150, s2.k);
      c.beginPath(); c.moveTo(960, 310); c.quadraticCurveTo((960 + x) / 2, 360, ex, ey);
      c.lineWidth = s2.w + 8; c.strokeStyle = '#3b2a26'; c.lineCap = 'round'; c.stroke(); c.lineWidth = s2.w; c.strokeStyle = '#F2C14E'; c.stroke();
      if (s2.k >= 1) label(c, s2.name, x, 880, { size: 48, color: '#FFFDF5', bg: ['#C8343A', '#E8485A', '#2F7F77'][i], pad: 20 });
    });
    if (streams[0].k >= 1) figure(c, CHEN, { x: 400, y: 820, s: 0.5, expr: 'worry' });
    if (streams[1].k >= 1) { figure(c, GROOM, { x: 900, y: 820, s: 0.5, expr: 'happy' }); figure(c, BRIDE, { x: 1020, y: 820, s: 0.48, expr: 'happy' }); }
    if (streams[2].k >= 1) { const o = ph(t, b1 + 1.0, b1 + 1.6); c.save(); c.translate(1520, 800); rr(c, -90, -200, 180, 200, 10); c.fillStyle = '#5A4A44'; c.fill(); c.save(); c.scale(Math.max(0.02, 1 - o), 1); rr(c, -90, -200, 180, 200, 10); c.fillStyle = '#A8754E'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3b2a26'; c.stroke(); c.restore(); if (o > 0.4) I.shopIcon(c, 0, -40, 1.6 * clamp((o - 0.4) * 2), '#BFE3DE', 1); c.restore(); }
  },
};
const ein = (x) => x * x * x;

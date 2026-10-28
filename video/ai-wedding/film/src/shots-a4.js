// 第四幕：整个行业重新洗牌（C39–C45）
import { W, H, clamp, lerp, ph, ease, eout, back, pop, wave, rng, rr, FONT, figure, orb, CHEN, BRIDE, GREY, person, S, I, label, big, blink, camK, fade, beat } from './kit.js';

const PLANNER = person({ hairStyle: 'pony', hair: '#3A2A22', top: '#9C9488', sleeve: '#9C9488', bottom: '#5E6068' });
const TYPES = [['低价标准化', '#5A6A80'], ['高端定制', '#B5323A'], ['资源平台', '#2F7F77']];

function threeCards(c, t, X, focus, k) {
  // 三张牌落成三列；focus 那张放大翻开
  TYPES.forEach(([n, col], i) => {
    const isF = i === focus;
    const x = isF ? lerp(420 + i * 540, 960, ease(k)) : 420 + i * 540;
    const y = isF ? lerp(560, 540, ease(k)) : 560;
    const s = isF ? lerp(0.55, 1, ease(k)) : 0.55;
    if (!isF && focus >= 0) { c.save(); c.globalAlpha = 1 - 0.7 * k; }
    c.save(); c.translate(x, y); c.scale(s, s);
    I.card(c, 0, 0, 700, 880, isF ? ph(t, 0.2, 0.7) : (focus > i ? 1 : 0), n, col);
    c.restore();
    if (!isF && focus >= 0) c.restore();
  });
}

export const A4 = {
  C39(c, t, X) {
    S.paper(c);
    // 地图 + 洗牌
    rr(c, 260, 160, 1400, 760, 30); c.fillStyle = '#EAD9BC'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#B79A72'; c.stroke();
    const r = rng(3); for (let i = 0; i < 18; i++) I.shopIcon(c, 340 + r() * 1240, 260 + r() * 600, 0.8, '#E7D3B4');
    const shuffle = ph(t, 0, X.d * 0.55), land = ph(t, X.d * 0.55, X.d * 0.9);
    for (let i = 0; i < 9; i++) {
      const col = i % 3, a = shuffle * Math.PI * 4 + i * 0.7;
      const x0 = 960 + Math.cos(a) * 260 * Math.sin(shuffle * Math.PI), y0 = 540 + Math.sin(a) * 120 * Math.sin(shuffle * Math.PI);
      const x = lerp(x0, 480 + col * 480, ease(land)), y = lerp(y0, 420 + Math.floor(i / 3) * 40, ease(land));
      c.save(); c.translate(x, y); c.rotate((1 - land) * (a % 1.2 - 0.6)); c.scale(0.32, 0.32); I.card(c, 0, 0, 700, 880, 0, '', TYPES[col][1]); c.restore();
    }
  },
  C40(c, t, X) {
    S.paper(c);
    const k = ph(t, 0, 0.6);
    c.save(); c.translate(960, 580); c.scale(0.86, 0.86);
    I.card(c, 0, 0, 1500, 820, ph(t, 0.1, 0.6), TYPES[0][0], TYPES[0][1], (cc) => {
      // 流水线盖章：一模一样的拱门
      rr(cc, -640, 120, 1280, 30, 14); cc.fillStyle = '#5A4A44'; cc.fill();
      const n = Math.floor(ph(t, 0.6, X.d) * 6);
      for (let i = 0; i < 6; i++) { if (i > n) continue; const x = -560 + i * 220; cc.beginPath(); cc.arc(x, 110, 80, Math.PI, 0); cc.lineWidth = 18; cc.strokeStyle = '#F59AAE'; cc.stroke(); }
      const b = beat(X, 1);
      [['AI', null], ['模板', null], ['外包', null]].forEach(([s2], i) => { const p = pop(t, b + i * 0.5); if (p > 0) label(cc, s2, -400 + i * 400, -180, { size: 60, color: '#FFFDF5', bg: i === 0 ? '#2BA9CF' : '#5A6A80', pad: 24, scale: p }); });
      if (pop(t, b) > 0) orb(cc, -520, -180, 0.8, t);
    });
    c.restore();
  },
  C41(c, t, X) {
    const open = ph(t, 0.1, 0.6);
    if (open < 1) { S.paper(c); c.save(); c.translate(960, 520); I.card(c, 0, 0, 1500, 820, open, TYPES[1][0], TYPES[1][1]); c.restore(); return; }
    S.banquet(c, { mode: 'candle', t, cam: { x: 960 + wave(t, 0.08, 80), y: 560, z: 1.15 } });
    figure(c, BRIDE, { x: 1060, y: 1010, s: 1.15, expr: 'happy', blink: blink(t) });
    figure(c, PLANNER, { x: 820, y: 1040, s: 1.0, expr: 'smile', lean: 0.18, armR: [2.0, 0.6], blink: blink(t, 1) });
    label(c, '高端定制', 960, 240, { size: 60, color: '#FFFDF5', bg: '#B5323A', pad: 24 });
    const b = beat(X, 1);
    ['创意', '审美', '体验', '服务'].forEach((s2, i) => { const bb = b + (X.L[1].e - b) * (0.45 + i * 0.13); const p = pop(t, bb); if (p > 0) label(c, s2, 360 + i * 400, 400, { size: 56, color: '#8E2A33', bg: '#FFF3D6', border: '#E8B04B', pad: 24, scale: p }); });
  },
  C42(c, t, X) {
    S.paper(c);
    const open = ph(t, 0.1, 0.6);
    if (open < 1) { c.save(); c.translate(960, 520); I.card(c, 0, 0, 1500, 820, open, TYPES[2][0], TYPES[2][1]); c.restore(); return; }
    label(c, '资源平台', 960, 200, { size: 60, color: '#FFFDF5', bg: '#2F7F77', pad: 24 });
    const nodes = [['摄影师', 520, 420], ['化妆师', 1400, 420], ['场地', 520, 780], ['婚庆公司', 1400, 780]];
    const b = beat(X, 1);
    c.beginPath(); c.arc(960, 600, 90, 0, 7); c.fillStyle = '#2F7F77'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#3b2a26'; c.stroke();
    label(c, '平台', 960, 600, { size: 50, weight: 900, color: '#FFFDF5' });
    nodes.forEach(([n, x, y], i) => {
      const bb = b + (X.L[1].e - b) * (0.35 + i * 0.14), k = ph(t, bb, bb + 0.4);
      if (k <= 0) return;
      c.save(); c.setLineDash([16, 12]); c.lineDashOffset = -t * 40; c.beginPath(); c.moveTo(960, 600); c.lineTo(lerp(960, x, k), lerp(600, y, k)); c.lineWidth = 7; c.strokeStyle = '#2BB3A8'; c.stroke(); c.restore();
      if (k >= 1) { if (i === 3) I.shopIcon(c, x, y + 30, 1.4, '#F2C9A0', 1); else { c.beginPath(); c.arc(x, y, 70, 0, 7); c.fillStyle = '#FFF8EA'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#3b2a26'; c.stroke(); } label(c, n, x, y + 110, { size: 46, color: '#3b2a26', bg: '#FFF8EA', pad: 18 }); }
      if (k >= 1 && i < 3) {
        // 图标：相机 / 化妆刷 / 场地
        c.save(); c.translate(x, y);
        if (i === 0) { rr(c, -40, -26, 80, 52, 10); c.fillStyle = '#2E3038'; c.fill(); c.beginPath(); c.arc(0, 0, 18, 0, 7); c.fillStyle = '#8FD3E8'; c.fill(); }
        if (i === 1) { c.rotate(0.6); rr(c, -8, -40, 16, 60, 6); c.fillStyle = '#C98A4A'; c.fill(); c.beginPath(); c.ellipse(0, -48, 16, 22, 0, 0, 7); c.fillStyle = '#F59AAE'; c.fill(); }
        if (i === 2) { c.beginPath(); c.moveTo(-44, -10); c.lineTo(0, -40); c.lineTo(44, -10); c.closePath(); c.fillStyle = '#B5323A'; c.fill(); for (let j = -1; j <= 1; j++) c.fillRect(j * 26 - 5, -8, 10, 40); }
        c.restore();
      }
    });
  },
  C43(c, t, X) {
    S.shop(c, { cam: { x: 960, y: 480, z: 1.6 + 0.4 * eout(ph(t, 0, 0.35)) } });
    figure(c, CHEN, { x: 960, y: 1260, s: 2.0, expr: 'brow', look: 0, blink: 0 });
    label(c, '!', 1250, 300, { size: 140, weight: 900, color: '#F7C948', stroke: '#3b2a26', strokeW: 12, scale: pop(t, 0.15) });
  },
  C44(c, t, X) {
    S.diorama(c, { cam: { x: 960, y: 700, z: 2.2 } });
    c.save(); c.filter = 'blur(6px)'; c.fillStyle = 'rgba(80,50,30,0.3)'; c.fillRect(0, 0, W, 300); c.restore();
    // 两块小骨牌
    const tap = Math.sin(clamp(ph(t, X.d - 1.0, X.d - 0.6)) * Math.PI) * 0.12;
    I.domino(c, 820, 780, 150, 300, -tap, '#FFF8EA', '', (cc, y) => { rr(cc, -50, y - 50, 100, 90, 6); cc.fillStyle = '#F59AAE'; cc.fill(); cc.beginPath(); cc.arc(0, y + 20, 30, Math.PI, 0); cc.lineWidth = 8; cc.strokeStyle = '#B5323A'; cc.stroke(); });
    I.domino(c, 1100, 780, 150, 300, 0, '#FFF8EA', '', (cc, y) => { cc.beginPath(); cc.moveTo(-30, y - 40); cc.lineTo(40, y); cc.lineTo(-30, y + 40); cc.closePath(); cc.fillStyle = '#C8343A'; cc.fill(); });
    label(c, '设计图', 820, 850, { size: 40, color: '#3b2a26', bg: '#FFF8EA', pad: 14 }); label(c, '视频', 1100, 850, { size: 40, color: '#3b2a26', bg: '#FFF8EA', pad: 14 });
  },
  C45(c, t, X) {
    S.paper(c);
    const k = ease(ph(t, 0, X.d));
    const z = lerp(1.6, 0.85, k);
    c.save(); c.translate(260, 840); c.scale(z, z); c.translate(-260, -840);
    const items = [[260, 120, 200, ''], [460, 160, 280, ''], [720, 260, 420, '进入门槛'], [1120, 300, 480, '竞争方式'], [1600, 340, 540, '赚钱模式']];
    items.forEach(([x, w, h, n], i) => {
      const fall = ease(ph(t, 0.5 + i * (X.d * 0.16), 0.5 + i * (X.d * 0.16) + 0.5));
      I.domino(c, x, 840, w, h, fall * 1.15, i < 2 ? '#FFF8EA' : ['#F3E2B8', '#F6D5C9', '#D7E2EE'][i - 2], '');
      if (n) label(c, n, x + Math.sin(fall * 1.15) * h * 0.5, 840 - Math.cos(fall * 1.15) * h * 0.5, { size: 50, weight: 900, color: '#8E2A33', rot: fall * 1.15 });
    });
    c.restore();
  },
};

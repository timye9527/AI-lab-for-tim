// 第五幕：最后的赢家换了门生意（C46–C54，反转③ 在 C51）
import { W, H, clamp, lerp, ph, ease, eout, back, pop, wave, rng, rr, FONT, figure, orb, CHEN, LI, GREY, S, I, label, big, blink, breathe, camK, fade, beat } from './kit.js';

// 县城店铺地图（G16）：n 家店，可挂乌云、可点亮、可连线
const PINS = (() => { const r = rng(21), out = []; for (let i = 0; i < 36; i++) out.push([260 + r() * 1400, 230 + r() * 560]); return out; })();
function townMap(c, o = {}) {
  rr(c, 180, 150, 1560, 720, 30); c.fillStyle = '#EAD9BC'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#B79A72'; c.stroke();
  c.strokeStyle = 'rgba(160,130,90,0.35)'; c.lineWidth = 14; c.beginPath(); c.moveTo(180, 520); c.bezierCurveTo(700, 420, 1200, 640, 1740, 500); c.moveTo(900, 150); c.lineTo(980, 870); c.stroke();
  PINS.forEach(([x, y], i) => {
    if (o.n != null && i >= o.n) return;
    const lit = o.lit ? clamp(o.lit(i)) : 0;
    if (o.link && o.link(i) > 0) { const k = clamp(o.link(i)); c.save(); c.setLineDash([10, 10]); c.beginPath(); c.moveTo(960, 520); c.lineTo(lerp(960, x, k), lerp(520, y - 20, k)); c.lineWidth = 3; c.strokeStyle = 'rgba(43,169,207,0.7)'; c.stroke(); c.restore(); }
    I.shopIcon(c, x, y, 0.75 * (o.pop ? o.pop(i) : 1), '#E7D3B4', lit);
    if (o.cloud) I.cloud(c, x + 6, y - 78, 0.9, o.cloud(i));
  });
}

export const A5 = {
  C46(c, t, X) {
    S.studio(c, { cam: { x: 960, y: 540, z: 1.05 + 0.15 * ease(ph(t, 0, X.d)) } });
    // 墙上日历翻页
    c.save(); c.translate(1300, 320); rr(c, -110, -110, 220, 230, 12); c.fillStyle = '#FFF8EA'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#3b2a26'; c.stroke();
    rr(c, -110, -110, 220, 60, 12); c.fillStyle = '#C8343A'; c.fill();
    const n = Math.floor(ph(t, 0.2, X.d) * 4);
    label(c, `${[3, 6, 9, 12][n] || 12} 月`, 0, 40, { size: 70, weight: 900, color: '#3b2a26' }); c.restore();
    figure(c, LI, { x: 760, y: 1060, s: 1.15, expr: 'think', blink: blink(t), armR: [2.6, 1.6], handR: 'open' });
  },
  C47(c, t, X) {
    const b = beat(X, 1);
    if (t < b) {
      S.street(c, { light: 'dusk', t, cam: { x: 1300, y: 500, z: 1.3 } });
      figure(c, LI, { x: 1500, y: 1020, s: 1.2, expr: 'think', look: -1, blink: blink(t) });
      // 头顶灯泡
      const k = pop(t, b * 0.6);
      if (k > 0) { c.save(); c.translate(1500, 360); c.scale(k, k); const g = c.createRadialGradient(0, 0, 10, 0, 0, 120); g.addColorStop(0, 'rgba(255,240,150,0.9)'); g.addColorStop(1, 'rgba(255,240,150,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 120, 0, 7); c.fill(); c.beginPath(); c.arc(0, 0, 44, 0, 7); c.fillStyle = '#FFE36A'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#3b2a26'; c.stroke(); rr(c, -18, 40, 36, 30, 6); c.fillStyle = '#9AA0A8'; c.fill(); c.stroke(); c.restore(); }
    } else {
      S.paper(c);
      const lt = t - b;
      townMap(c, { pop: (i) => pop(lt, i * 0.04), cloud: (i) => ph(lt, 0.8 + i * 0.03, 1.2 + i * 0.03) });
    }
  },
  C48(c, t, X) {
    S.paper(c, { skyline: false });
    const bs = [0, beat(X, 1), beat(X, 2)];
    I.panel(c, 70, 250, 570, 660, ph(t, bs[0], bs[0] + 0.3), (cc) => {
      cc.fillStyle = '#EEF2F6'; cc.fillRect(0, 0, 570, 700);
      rr(cc, 300, 120, 210, 360, 26); cc.fillStyle = '#2E3038'; cc.fill(); rr(cc, 314, 140, 182, 320, 14); cc.fillStyle = '#FFFFFF'; cc.fill();
      label(cc, '发布', 405, 420, { size: 34, color: '#FFFFFF', bg: '#BFC5CC', pad: 14 });
      figure(cc, GREY(0), { x: 170, y: 780, s: 1.0, expr: 'flat', blink: blink(t) });
      label(cc, '？', 160, 180, { size: 90, weight: 900, color: '#8C93A3' });
    });
    I.panel(c, 675, 250, 570, 660, ph(t, bs[1], bs[1] + 0.3), (cc) => {
      cc.fillStyle = '#F2F6EE'; cc.fillRect(0, 0, 570, 700);
      const n = Math.floor(ph(t, bs[1], bs[2]) * 12) + 3;
      for (let i = 0; i < n; i++) { const x = 60 + (i * 137) % 420, y = 60 + (i * 89) % 420; rr(cc, x, y, 130, 60, 26); cc.fillStyle = i % 2 ? '#BDE6C9' : '#FFFFFF'; cc.fill(); cc.lineWidth = 3; cc.strokeStyle = '#3b2a26'; cc.stroke(); }
      figure(cc, GREY(1), { x: 290, y: 820, s: 1.0, expr: 'worry', sweat: 1, blink: blink(t, 1) });
    });
    I.panel(c, 1280, 250, 570, 660, ph(t, bs[2], bs[2] + 0.3), (cc) => {
      cc.fillStyle = '#F8F0E6'; cc.fillRect(0, 0, 570, 700);
      I.funnel(cc, 285, 300, 0.95, t);
      label(cc, '咨询多', 120, 80, { size: 40, color: '#8E2A33' }); label(cc, '成交少', 420, 560, { size: 40, color: '#8E2A33' });
    });
  },
  C49(c, t, X) {
    S.studio(c, { cam: { x: 960, y: 500, z: 1.0 } });
    figure(c, LI, { x: 420, y: 1060, s: 1.1, expr: 'confident', armR: [2.0, 0.6], handR: 'open', blink: blink(t) });
    const b = beat(X, 1);
    I.door(c, 1140, 520, ease(ph(t, b - 0.4, b + 0.3)), '婚庆工作室', '婚庆营销服务');
  },
  C50(c, t, X) {
    const b = beat(X, 1), cut = b + 0.2;
    if (t < cut) {
      S.studio(c, { screen: true, cam: { x: 1370, y: 320, z: 1.0 + 0.5 * ease(ph(t, 0, cut)) } });
      S.withCam(c, { x: 1370, y: 320, z: 1.0 + 0.5 * ease(ph(t, 0, cut)) }, 0.85, () => {
        I.dashboard(c, 1030, 130, 680, 360, t, [0, 1, 2].map((i) => ph(t, 0.4 + i * (cut - 0.4) / 3, 0.7 + i * (cut - 0.4) / 3)));
      });
      orb(c, 1500, 640, 1.2, t);
    } else {
      S.paper(c);
      const lt = t - cut;
      townMap(c, { link: (i) => ph(lt, i * 0.03, i * 0.03 + 0.5) });
      orb(c, 960, 520, 1.3, t);
      PINS.forEach(([x, y], i) => { const f = ph(lt, i * 0.03, i * 0.03 + 0.6); if (f > 0 && f < 1) orb(c, lerp(960, x, ease(f)), lerp(520, y - 30, ease(f)), 0.4, t + i); else if (f >= 1) orb(c, x + 26, y - 56, 0.3, t + i); });
    }
  },
  C51(c, t, X) {
    S.paper(c);
    const L0 = X.L[0], L1 = X.L[1];
    // 5×10 店铺网格，一个个亮起，吐出 ¥1000
    const lightUp = (i) => ph(t, L0.s + 0.3 + Math.pow(i / 50, 0.7) * (L1.s + 1.6 - L0.s - 0.3), L0.s + 0.5 + Math.pow(i / 50, 0.7) * (L1.s + 1.6 - L0.s - 0.3));
    for (let i = 0; i < 50; i++) { const x = 300 + (i % 10) * 145, y = 280 + Math.floor(i / 10) * 100; I.shopIcon(c, x, y + 30, 0.72, '#E7D3B4', lightUp(i)); }
    // 第一家吐出 ¥1000
    const k1 = ph(t, L0.s + 0.6, L0.e);
    if (k1 > 0 && t < L1.s + 0.5) { I.coin(c, 300, 270 - 40 * eout(k1), 48, t * 3, '1000'); label(c, '每家每月 ¥1000', 640, 160, { size: 52, color: '#8E2A33', bg: '#FFF8EA', pad: 20, alpha: k1 }); }
    // 计数器
    const cnt = Math.round(50 * clamp(ph(t, L1.s + 0.3, L1.s + 1.8)));
    if (t > L1.s) {
      const land = ph(t, L1.e - 1.2, L1.e - 0.7), z = land > 0 ? 1 + 0.35 * (1 - back(land)) : 1;
      c.save(); c.translate(W / 2, 850); c.scale(z, z);
      rr(c, -560, -80, 1120, 160, 40); c.fillStyle = 'rgba(255,248,234,0.96)'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#3b2a26'; c.stroke();
      big(c, `${cnt} 家 × ¥1000 = ¥${(cnt * 1000).toLocaleString('en-US').replace(',', '')}`, 0, -6, 84, cnt === 50 ? '#C8343A' : '#3b2a26', { stroke: 'rgba(0,0,0,0)' });
      c.restore();
      if (cnt === 50) label(c, '每月服务收入', W / 2, 718, { size: 44, color: '#FFFDF5', bg: '#2F7F77', pad: 18, alpha: land });
    }
    fade(c, 0.45 * (ph(t, L1.e - 0.25, L1.e - 0.15) - ph(t, L1.e - 0.1, L1.e + 0.2)), '#FFFDF0');
  },
  C52(c, t, X) {
    S.paper(c);
    const L = X.L[0];
    // 「¥50000」被咬掉三口：获客 / 系统 / 服务
    // 金币画在单独图层上再咬（直接在主画布上挖会挖出黑洞）
    const [lc, lx] = S.layerOf('bite');
    lx.translate(760, 520);
    lx.beginPath(); lx.arc(0, 0, 300, 0, 7); lx.fillStyle = '#F2C14E'; lx.fill(); lx.lineWidth = 8; lx.strokeStyle = '#3b2a26'; lx.stroke();
    label(lx, '¥50000', 0, 0, { size: 110, weight: 900, color: '#8A5A12' });
    const bites = [['获客', -0.7], ['系统', 0.35], ['服务', -2.3]];
    bites.forEach(([n, a], i) => {
      const k = ph(t, L.s + (L.e - L.s) * (0.45 + i * 0.16), L.s + (L.e - L.s) * (0.45 + i * 0.16) + 0.25);
      if (k <= 0) return;
      lx.save(); lx.globalCompositeOperation = 'destination-out'; lx.beginPath(); lx.arc(Math.cos(a) * 300, Math.sin(a) * 300, 90 * back(k), 0, 7); lx.fill(); lx.restore();
    });
    c.drawImage(lc, 0, 0);
    bites.forEach(([n, a], i) => {
      const k = ph(t, L.s + (L.e - L.s) * (0.45 + i * 0.16), L.s + (L.e - L.s) * (0.45 + i * 0.16) + 0.25);
      if (k > 0) label(c, n, 760 + Math.cos(a) * 470, 520 + Math.sin(a) * 400, { size: 52, color: '#FFFDF5', bg: '#5A4A44', pad: 20, scale: back(k) });
    });
    label(c, '收入 ≠ 利润', 1460, 520, { size: 72, weight: 900, color: '#C8343A', bg: '#FFF8EA', border: '#3b2a26', pad: 30, alpha: ph(t, L.s + 0.4, L.s + 0.8) });
  },
  C53(c, t, X) {
    S.paper(c);
    const b1 = beat(X, 1), b2 = beat(X, 2);
    const split = ph(t, b1 - 0.2, b1 + 0.3);
    // 左：过去
    c.save(); rr(c, 60, 240, 880, 660, 24); c.clip();
    S.banquet(c, { mode: 'party', t, cam: { x: 960, y: 540, z: 1.0 } });
    figure(c, LI, { x: lerp(300, 700, (Math.sin(t * 2.4) + 1) / 2), y: 900, s: 0.85, walk: t * 2, expr: 'worry', sweat: 1, flip: Math.cos(t * 2.4) > 0 ? 1 : -1 });
    c.restore(); rr(c, 60, 240, 880, 660, 24); c.lineWidth = 8; c.strokeStyle = '#3b2a26'; c.stroke();
    label(c, '过去', 500, 300, { size: 56, color: '#FFFDF5', bg: '#6E5A44', pad: 22, alpha: split });
    // 右：现在
    const k2 = ph(t, b2 - 0.2, b2 + 0.4);
    c.save(); c.globalAlpha = Math.max(0.15, k2); rr(c, 980, 240, 880, 660, 24); c.clip();
    c.fillStyle = '#EEF5F2'; c.fillRect(980, 240, 880, 660);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, x = 1420 + Math.cos(a) * 320, y = 520 + Math.sin(a) * 260; c.beginPath(); c.moveTo(1420, 560); c.lineTo(x, y); c.lineWidth = 3; c.strokeStyle = '#2BA9CF'; c.setLineDash([8, 8]); c.stroke(); c.setLineDash([]); I.shopIcon(c, x, y + 20, 0.7, '#E7D3B4', 1); }
    rr(c, 1300, 600, 240, 30, 10); c.fillStyle = '#5A4A44'; c.fill();
    figure(c, LI, { x: 1420, y: 820, s: 0.62, expr: 'confident', armL: [1.5, 0.6], armR: [1.5, 0.6] });
    c.restore(); rr(c, 980, 240, 880, 660, 24); c.lineWidth = 8; c.strokeStyle = '#3b2a26'; c.stroke();
    label(c, '现在', 1420, 300, { size: 56, color: '#FFFDF5', bg: '#2F7F77', pad: 22, alpha: k2 });
  },
  C54(c, t, X) {
    // 仰拍英雄镜头：朝阳逆光，光球展开成流程蓝图
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#F6B47A'); g.addColorStop(0.6, '#F8D9A8'); g.addColorStop(1, '#E9A27C');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const sun = c.createRadialGradient(1300, 760, 20, 1300, 760, 700); sun.addColorStop(0, 'rgba(255,250,220,1)'); sun.addColorStop(1, 'rgba(255,230,180,0)'); c.fillStyle = sun; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i++) { c.save(); c.translate(1300, 760); c.rotate(i / 14 * Math.PI * 2 + t * 0.05); c.fillStyle = 'rgba(255,245,210,0.18)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(1600, -80); c.lineTo(1600, 80); c.fill(); c.restore(); }
    const z = 1 + 0.08 * ease(ph(t, 0, X.d));
    c.save(); c.translate(W / 2, H); c.scale(z, z); c.translate(-W / 2, -H);
    figure(c, LI, { x: 760, y: 1240, s: 1.9, expr: 'confident', armR: [2.3, 0.3], handR: 'open', blink: blink(t) });
    // 蓝图
    const k = ease(ph(t, 0.4, 1.6));
    const bx = 1100, by = 520;
    c.save(); c.globalAlpha = k; rr(c, bx, by - 220 * k, 640 * k, 440 * k, 16); c.fillStyle = 'rgba(30,90,140,0.85)'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#BFF2FF'; c.stroke();
    if (k > 0.8) {
      const steps = ['接单', '营销', '线索', '跟进', '成交'];
      steps.forEach((s2, i) => { const x = bx + 80 + i * 120, y = by + (i % 2 ? 60 : -60); rr(c, x - 50, y - 30, 100, 60, 10); c.strokeStyle = '#BFF2FF'; c.lineWidth = 3; c.stroke(); label(c, s2, x, y, { size: 30, color: '#E6FBFF' }); if (i) { c.beginPath(); c.moveTo(x - 70, y + (i % 2 ? -60 : 60)); c.lineTo(x - 50, y); c.stroke(); } });
    }
    c.restore();
    orb(c, lerp(1010, bx, k * 0.3), lerp(470, by, k * 0.3), 1.6, t);
    c.restore();
  },
};

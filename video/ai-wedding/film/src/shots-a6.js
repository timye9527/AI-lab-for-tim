// 尾声：从县城到整个社会（C55–C65）
import { W, H, clamp, lerp, ph, ease, eout, back, pop, wave, rng, rr, FONT, figure, orb, CHEN, LI, GREY, person, S, I, label, big, titleCard, TITLE, blink, camK, fade, beat, youArrow } from './kit.js';

// 四环总结链（G21）：第 n 环亮起；第一环用和反转进度条一样的「效率提升」
function chain(c, t, X, upto, focus) {
  S.paper(c);
  const xs = [300, 740, 1180, 1620];
  for (let i = 0; i < 4; i++) {
    const on = i < upto ? 1 : i === upto ? ph(t, 0.2, 0.7) : 0;
    if (i > 0) { c.beginPath(); c.moveTo(xs[i - 1] + 150, 520); c.lineTo(lerp(xs[i - 1] + 150, xs[i] - 150, clamp(on * 1.5)), 520); c.lineWidth = 14; c.strokeStyle = on > 0 ? '#C8343A' : '#D9CBB4'; c.lineCap = 'round'; c.stroke(); }
    c.save(); c.translate(xs[i], 520); const s = i === focus ? 1 + 0.08 * back(on) : 0.92; c.scale(s, s);
    c.beginPath(); c.arc(0, 0, 150, 0, 7); c.fillStyle = on > 0 ? '#FFF8EA' : '#EFE5D3'; c.fill(); c.lineWidth = 8; c.strokeStyle = on > 0 ? '#C8343A' : '#C9B89A'; c.stroke();
    label(c, `${'①②③④'[i]}`, 0, -90, { size: 44, weight: 900, color: on > 0 ? '#C8343A' : '#B8A88E' });
    const lines = [['效率提升'], ['新竞争者', '进入'], ['价格 · 岗位', '组织方式'], ['新生意']][i];
    lines.forEach((ln, j) => label(c, ln, 0, 10 + (j - (lines.length - 1) / 2) * 52, { size: 44, weight: 900, color: on > 0 ? '#3b2a26' : '#B8A88E' }));
    c.restore();
  }
}

export const A6 = {
  C55(c, t, X) {
    const k = ease(ph(t, 0, X.d * 0.55));
    if (k < 0.5) {
      S.street(c, { light: 'dusk', t, cam: { x: 960, y: 540, z: lerp(1.1, 0.6, k * 2) } });
      S.withCam(c, { x: 960, y: 540, z: lerp(1.1, 0.6, k * 2) }, 1, () => { figure(c, CHEN, { x: 470, y: 980, s: 1.0 }); figure(c, LI, { x: 1500, y: 980, s: 0.95, flip: -1 }); });
      fade(c, (k - 0.3) * 5, '#C99A6E');
    } else {
      S.diorama(c, { cam: { x: 960, y: 560, z: lerp(1.3, 1.0, (k - 0.5) * 2) } });
      // 两个立牌
      for (const [C, x, col] of [[CHEN, 760, '#C8343A'], [LI, 1160, '#2F7F77']]) {
        c.save(); c.translate(x, 700); rr(c, -80, -10, 160, 26, 6); c.fillStyle = '#8A5E3E'; c.fill(); c.restore();
        figure(c, C, { x, y: 700, s: 0.55, expr: 'smile' });
      }
      I.stamp(c, '虚构人物', 960, 380, ph(t, X.L[0].e - 0.8, X.L[0].e - 0.4), '#C8343A', 90);
    }
  },
  C56(c, t, X) {
    const b = beat(X, 1);
    S.diorama(c, { cam: { x: 960, y: 560, z: lerp(1.0, 0.6, ease(ph(t, 0, b + 0.6))) } });
    const names = ['广告', '教育', '金融', '会计', '电商', '工厂'];
    const cols = ['#F2B66A', '#9FD3C7', '#C9B6E4', '#F6D5C9', '#BFE3F2', '#C9A27A'];
    names.forEach((n, i) => {
      const L = X.L[1], bb = L.s + (L.e - L.s) * (i / 6) * 0.95, p = pop(t, bb);
      if (p <= 0) return;
      const a = -Math.PI * 0.9 + i * Math.PI * 0.36, x = 960 + Math.cos(a) * 680, y = 560 + Math.sin(a) * 330 + (i > 2 ? 60 : 0);
      c.save(); c.translate(x, y); c.scale(p, p);
      rr(c, -120, -90, 240, 180, 18); c.fillStyle = cols[i]; c.fill(); c.lineWidth = 6; c.strokeStyle = '#3b2a26'; c.stroke();
      label(c, n, 0, 0, { size: 60, weight: 900, color: '#3b2a26' });
      c.restore();
    });
  },
  C57(c, t, X) {
    chain(c, t, X, 0, 0);
    // 「专业能力」价签从大缩小
    const L = X.L[0], k = ease(ph(t, L.s + 0.4, L.s + (L.e - L.s) * 0.6));
    I.priceTag(c, 300, 840, '专业能力', '#B5323A', lerp(0.9, 0.5, k), -0.05, { size: 56 });
  },
  C58(c, t, X) {
    chain(c, t, X, 1, 1);
    const k = ph(t, 0.3, 1.0);
    for (let i = 0; i < 3; i++) figure(c, GREY(i), { x: 640 + i * 90, y: 860 + 30 * (1 - k), s: 0.42, alpha: ph(t, 0.4 + i * 0.15, 0.7 + i * 0.15), walk: t * 2 + i });
  },
  C59(c, t, X) {
    chain(c, t, X, 2, 2);
    const k = ph(t, 0.4, 1.4);
    ['价签', '工牌', '组织图'].forEach((n, i) => { c.save(); c.translate(1040 + i * 140, 830); c.rotate(wave(t, 1.2, 0.15 * k) * (i % 2 ? 1 : -1)); rr(c, -55, -40, 110, 80, 10); c.fillStyle = ['#F2C14E', '#FFFFFF', '#D7E2EE'][i]; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3b2a26'; c.stroke(); label(c, n, 0, 0, { size: 28, weight: 700 }); c.restore(); });
  },
  C60(c, t, X) {
    chain(c, t, X, 3, 3);
    // 新芽长成一间没见过的小店
    const k = ph(t, 0.4, 1.4);
    c.save(); c.translate(1620, 900);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -60 * k, 0, -110 * k); c.lineWidth = 8; c.strokeStyle = '#4E8A4C'; c.stroke();
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 26 * k, -70 * k, 26 * k, 12 * k, s * 0.5, 0, 7); c.fillStyle = '#6FB86A'; c.fill(); }
    c.restore();
    if (k >= 1) I.shopIcon(c, 1620, 790, 1.2 * pop(t, 1.4), '#BFE3DE', 1);
    // 四环整体亮一次
    const fl = ph(t, X.d - 1.0, X.d - 0.6) - ph(t, X.d - 0.5, X.d - 0.2);
    if (fl > 0) { c.save(); c.globalAlpha = fl * 0.35; c.fillStyle = '#FFE7B0'; c.fillRect(0, 300, W, 440); c.restore(); }
  },
  C61(c, t, X) {
    S.paper(c, { dark: true });
    // 普通人背影
    c.save(); c.translate(960, 1180); c.scale(1.5, 1.5);
    c.beginPath(); c.arc(0, -420, 66, 0, 7); c.fillStyle = '#1E1B22'; c.fill();
    c.beginPath(); c.moveTo(-90, -330); c.quadraticCurveTo(0, -360, 90, -330); c.lineTo(110, -100); c.lineTo(-110, -100); c.closePath(); c.fillStyle = '#4A5468'; c.fill();
    c.restore();
    youArrow(c, 1100, 420, ph(t, 0.2, 0.7), t);
    const b = beat(X, 1), k = ph(t, b, b + 0.4);
    label(c, 'AI 会不会取代我？', 960, 300, { size: 84, weight: 900, color: '#FFFDF5', bg: 'rgba(255,255,255,0.08)', pad: 40, scale: back(k), alpha: k });
    // 轻轻划掉一半
    const sk = ph(t, X.L[1].e + 0.1, X.L[1].e + 0.6);
    if (sk > 0) { c.beginPath(); c.moveTo(620, 300); c.lineTo(620 + 340 * sk, 300); c.lineWidth = 8; c.strokeStyle = 'rgba(232,104,107,0.9)'; c.stroke(); }
  },
  C62(c, t, X) {
    S.paper(c, { dark: true });
    const k = ease(ph(t, 0, X.d * 0.7));
    const z = lerp(0.9, 1.7, k);
    c.save(); c.translate(960, 640); c.scale(z, z); c.translate(-960, -640);
    const r = rng(12);
    for (let i = 0; i < 42; i++) {
      const x = 160 + (i % 14) * 115 + (Math.floor(i / 14) % 2) * 55, y = 560 + Math.floor(i / 14) * 130, me = i === 20;
      c.save(); c.translate(x, y); c.scale(0.5, 0.5);
      c.beginPath(); c.arc(0, -150, 46, 0, 7); c.fillStyle = me ? '#F2C14E' : '#2E2A36'; c.fill();
      c.beginPath(); c.moveTo(-60, -90); c.quadraticCurveTo(0, -110, 60, -90); c.lineTo(76, 60); c.lineTo(-76, 60); c.closePath(); c.fillStyle = me ? '#F7C948' : '#3E4658'; c.fill();
      c.restore();
      orb(c, x + 40, y - 120 + Math.sin(t * 2 + i) * 6, 0.32, t + r() * 9, { alpha: me ? 1 : 0.8 });
      if (me) { const g = c.createRadialGradient(x, y - 60, 10, x, y - 60, 160); g.addColorStop(0, `rgba(255,230,140,${0.5 * ph(t, 0.6, 1.4)})`); g.addColorStop(1, 'rgba(255,230,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 60, 160, 0, 7); c.fill(); }
    }
    c.restore();
    const L = X.L[0], q = ph(t, L.s + (L.e - L.s) * 0.25, L.s + (L.e - L.s) * 0.25 + 0.4);
    rr(c, 160, 110, 1600, 250, 30); c.fillStyle = `rgba(30,25,35,${0.75 * q})`; c.fill();
    label(c, '当所有人都能使用 AI 工具，', 960, 180, { size: 70, weight: 900, color: '#FFFDF5', alpha: q });
    label(c, '我究竟还能为别人创造什么独特价值？', 960, 290, { size: 70, weight: 900, color: '#F7C948', alpha: q });
  },
  C63(c, t, X) {
    S.paper(c);
    const b = beat(X, 1);
    // 价签纷纷往下掉
    if (t < b + 0.6) { const r = rng(5); for (let i = 0; i < 12; i++) { const x = 160 + r() * 1600, f = ph(t, r() * 1.2, r() * 1.2 + 1.6); c.save(); c.globalAlpha = 1 - ph(t, b, b + 0.6); I.priceTag(c, x, lerp(-100, 1200, f * f), '¥', '#C9A27A', 0.4, r() - 0.5, { size: 70 }); c.restore(); } }
    ['懂客户', '懂行业', '解决真实问题'].forEach((n, i) => { const L = X.L[1], bb = L.s + (L.e - L.s) * (0.05 + i * 0.22); I.badge(c, 520 + i * 440, 520, n, ph(t, bb, bb + 0.5), ['#E8B04B', '#2BB3A8', '#C8343A'][i]); });
  },
  C64(c, t, X) {
    const k = ease(ph(t, 0, X.d));
    S.street(c, { light: 'dusk', t, cam: { x: 960, y: lerp(560, 300, k), z: lerp(1.05, 1.15, k) } });
    S.withCam(c, { x: 960, y: lerp(560, 300, k), z: lerp(1.05, 1.15, k) }, 1, () => { figure(c, CHEN, { x: 470, y: 980, s: 1.0, expr: 'smile', blink: blink(t) }); figure(c, LI, { x: 1500, y: 980, s: 0.95, flip: -1, expr: 'smile', blink: blink(t, 1) }); });
    const tk = ph(t, X.d - 2.2, X.d - 1.4);
    if (tk > 0) { fade(c, 0.35 * tk, '#3a1a1a'); titleCard(c, TITLE, tk, { y: 460 }); }
  },
  C65(c, t, X) {
    S.paper(c, { dark: true, skyline: false });
    const a = ph(t, 0, 0.5);
    c.save(); c.globalAlpha = a;
    c.save(); c.translate(0, -60); c.scale(1, 1); titleCard(c, TITLE, 1, { y: 360 }); c.restore();
    label(c, '本片人物、店铺和数字均为虚构或假设，只用于解释经济原理，', 960, 760, { size: 38, weight: 500, color: '#E9E1D6' });
    label(c, '不代表真实统计，不构成任何投资或经营建议。', 960, 820, { size: 38, weight: 500, color: '#E9E1D6' });
    label(c, '内容由 AI 辅助生成', 960, 920, { size: 34, weight: 500, color: '#A79FAA' });
    c.restore();
  },
};

// 第二幕：AI 改变了游戏规则（C16–C27，反转① 在 C23）
import { W, H, clamp, lerp, ph, ease, eout, back, pop, wave, rng, rr, FONT, figure, orb, CHEN, STAFF, BRIDE, GROOM, GREY, S, I, label, big, blink, breathe, camK, fade, beat, ein } from './kit.js';

export const A2 = {
  C16(c, t, X) {
    S.shop(c, { light: 'night', cam: { x: 960, y: 560, z: 1.15 + 0.12 * ease(ph(t, 0, X.d)) } });
    // 笔记本
    c.save(); c.translate(1080, 820); rr(c, -150, -110, 300, 190, 12); c.fillStyle = '#2E3038'; c.fill(); rr(c, -136, -96, 272, 162, 6); c.fillStyle = t > 0.4 ? '#9FE8F7' : '#3A4050'; c.fill(); rr(c, -180, 80, 360, 20, 8); c.fillStyle = '#4A4E58'; c.fill(); c.restore();
    figure(c, CHEN, { x: 760, y: 1120, s: 1.3, expr: t > 1.2 ? 'shock' : 'smile', look: 1, blink: blink(t), armR: [1.4, 0.9] });
    const k = ph(t, 0.8, X.d);
    if (k > 0) { const a = k * Math.PI * 3; orb(c, 900 + Math.cos(a) * 300, 520 + Math.sin(a) * 90 - 60 * k, 1.3, t, { trail: [-Math.sin(a), Math.cos(a) * 0.3] }); }
    // 屋里被照成青蓝色
    c.save(); c.globalCompositeOperation = 'screen'; const g = c.createRadialGradient(1080, 720, 50, 1080, 720, 900); g.addColorStop(0, `rgba(80,200,240,${0.35 * ph(t, 0.4, 1.2)})`); g.addColorStop(1, 'rgba(80,200,240,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
  },
  C17(c, t, X) {
    S.shop(c, { cam: { x: 960, y: 560, z: 1.12 } });
    // 前台
    rr(c, 300, 760, 1320, 120, 16); c.fillStyle = '#B5414A'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3b2a26'; c.stroke();
    figure(c, STAFF[4], { x: 1380, y: 1040, s: 1.0, flip: -1, expr: 'smile', blink: blink(t) });
    figure(c, GROOM, { x: 520, y: 1060, s: 1.05, expr: 'smile', blink: blink(t, 1) });
    figure(c, BRIDE, { x: 720, y: 1060, s: 1.0, expr: 'happy', armL: [1.0, 0.8] });
    const k = ph(t, 0.3, 0.8);
    I.bubble(c, 700, 330, 700, 360, k, 640, 560);
    if (k > 0.6) {
      c.save(); c.globalAlpha = clamp((k - 0.6) * 2.5);
      // 港风：霓虹灯牌（无字，只画形）、旧式电话、胶片
      c.shadowColor = '#FF4FA0'; c.shadowBlur = 24; rr(c, 480, 250, 220, 120, 20); c.lineWidth = 10; c.strokeStyle = '#FF6FB5'; c.stroke();
      c.beginPath(); c.arc(590, 310, 30, 0, 7); c.strokeStyle = '#7FF0FF'; c.shadowColor = '#7FF0FF'; c.stroke(); c.shadowBlur = 0;
      rr(c, 760, 270, 110, 80, 12); c.fillStyle = '#C8343A'; c.fill(); c.beginPath(); c.arc(815, 310, 22, 0, 7); c.fillStyle = '#F2E3CA'; c.fill();
      for (let i = 0; i < 4; i++) { rr(c, 880 + i * 34 - 60, 380, 30, 40, 4); c.fillStyle = '#E8B04B'; c.fill(); }
      c.restore();
    }
  },
  C18(c, t, X) {
    S.shop(c, { cam: { x: 960, y: 600, z: 1.3 } });
    // 纸团越堆越高、钟飞转
    const n = Math.floor(ph(t, 0, X.d) * 20);
    const r = rng(4);
    for (let i = 0; i < n; i++) { c.beginPath(); c.arc(1100 + (r() - 0.5) * 360, 980 - Math.floor(i / 5) * 40 - r() * 20, 28, 0, 7); c.fillStyle = '#F5EEE0'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#9A8E7A'; c.stroke(); }
    figure(c, STAFF[1], { x: 720, y: 1100, s: 1.25, expr: 'worry', armR: [1.7 + wave(t, 3, 0.2), 0.9], sweat: 0.7, blink: blink(t) });
    c.save(); c.translate(1500, 260); c.beginPath(); c.arc(0, 0, 90, 0, 7); c.fillStyle = '#FFF8EA'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#3b2a26'; c.stroke();
    c.rotate(t * 12); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -70); c.lineWidth = 6; c.stroke(); c.rotate(-t * 11); c.beginPath(); c.moveTo(0, 0); c.lineTo(45, 0); c.stroke(); c.restore();
    // 回忆滤镜（旧照片色 + 颗粒）
    c.save(); c.globalCompositeOperation = 'color'; c.fillStyle = '#A88A62'; c.fillRect(0, 0, W, H); c.restore();
    fade(c, 0.12, '#5A3A20');
    label(c, '过去', 150, 320, { size: 56, color: '#FFFDF5', bg: '#6E5A44', pad: 22 });
  },
  C19(c, t, X) {
    S.shop(c, { cam: { x: 960, y: 600, z: 1.3 } });
    figure(c, STAFF[1], { x: 520, y: 1100, s: 1.25, expr: t > 1.0 ? 'shock' : 'smile', blink: blink(t) });
    orb(c, 960, 420, 1.3, t);
    const k = eout(ph(t, 0.5, 1.3));
    const cols = [['#2A1E3A', '#FF6FB5'], ['#B5323A', '#E8B04B'], ['#5A4A3A', '#E8D8B8']];
    cols.forEach(([bg, fg], i) => {
      const a = (i - 1) * 0.35 * k;
      c.save(); c.translate(1220 + (i - 1) * 260 * k, 700); c.rotate(a);
      rr(c, -140, -200, 280, 360, 18); c.fillStyle = '#FFF8EA'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#3b2a26'; c.stroke();
      rr(c, -120, -180, 240, 240, 10); c.fillStyle = bg; c.fill();
      c.beginPath(); c.arc(0, -10, 80, Math.PI, 0); c.lineWidth = 16; c.strokeStyle = fg; c.stroke();
      label(c, ['霓虹', '红金', '胶片'][i], 0, 110, { size: 40, color: '#3b2a26' });
      c.restore();
    });
    label(c, '现在', 150, 320, { size: 56, color: '#FFFDF5', bg: '#2BA9CF', pad: 22 });
  },
  C20(c, t, X) {
    S.shop(c, { cam: { x: 960, y: 600 - 160 * ease(ph(t, 0, X.d)), z: 1.0 } });
    const r = rng(8);
    for (let i = 0; i < 90; i++) {
      const row = Math.floor(Math.sqrt(i * 2)), y = 1000 - row * 60, x = 960 + (r() - 0.5) * (900 - row * 60);
      rr(c, x - 50, y - 30, 100, 60, 8); c.fillStyle = ['#3A4A60', '#4A5A70', '#2E3A4E'][i % 3]; c.fill(); c.lineWidth = 3; c.strokeStyle = '#1a1a22'; c.stroke();
      c.beginPath(); c.moveTo(x - 10, y - 12); c.lineTo(x + 14, y); c.lineTo(x - 10, y + 12); c.fillStyle = '#9FE8F7'; c.fill();
    }
    figure(c, STAFF[4], { x: 400, y: 1080, s: 0.75, expr: 'shock', blink: 0, sweat: 1 });
  },
  C21(c, t, X) {
    S.paper(c, { dark: true });
    const k = ph(t, 0.2, X.d * 0.6);
    // 时间线轨道
    rr(c, 260, 640, 1400, 90, 14); c.fillStyle = '#2E3440'; c.fill();
    const r = rng(2);
    for (let i = 0; i < 40; i++) {
      const sorted = clamp(k * 1.4 - i / 40);
      const x0 = 300 + r() * 1300, y0 = 200 + r() * 300;
      const x1 = 280 + (i % 14) * 98, y1 = 650 + 0;
      if (i >= 14 && sorted > 0.8) continue;
      const x = lerp(x0, i < 14 ? x1 : 960, ease(sorted)), y = lerp(y0, i < 14 ? y1 : 560, ease(sorted));
      c.save(); c.globalAlpha = i < 14 ? 1 : 1 - sorted;
      rr(c, x, y, 90, 60, 8); c.fillStyle = ['#3A6A80', '#4A7A70', '#6A5A80'][i % 3]; c.fill(); c.restore();
    }
    orb(c, 960, 560, 1.4, t);
    // 字幕条
    const sk = ph(t, X.d * 0.55, X.d * 0.75);
    rr(c, 260, 760, 1400 * sk, 40, 10); c.fillStyle = '#F7C948'; c.fill();
    ['筛选', '粗剪', '字幕'].forEach((s2, i) => { const b = X.d * (0.25 + i * 0.22); I.check(c, 520 + i * 440, 900, ph(t, b, b + 0.3)); label(c, s2, 620 + i * 440, 900, { size: 46, color: '#FFFDF5', alpha: ph(t, b, b + 0.3) }); });
  },
  C22(c, t, X) {
    S.paper(c);
    I.speedLines(c, 300, 540, 0.6, t, 'rgba(200,52,58,0.25)');
    const items = [
      (cc) => { rr(cc, -110, -170, 220, 340, 24); cc.fillStyle = '#2E3038'; cc.fill(); rr(cc, -96, -150, 192, 300, 12); cc.fillStyle = '#FFF8EA'; cc.fill(); for (let j = 0; j < 3; j++) { rr(cc, -80, -130 + j * 96, 160, 80, 8); cc.fillStyle = ['#F6D5C9', '#D7E2EE', '#F3E2B8'][j]; cc.fill(); } },
      (cc) => { rr(cc, -150, -110, 300, 220, 10); cc.fillStyle = '#C8343A'; cc.fill(); cc.lineWidth = 5; cc.strokeStyle = '#3b2a26'; cc.stroke(); label(cc, '方案', 0, 0, { size: 56, color: '#FFF3D6', weight: 900 }); },
      (cc) => { rr(cc, -130, -180, 260, 360, 10); cc.fillStyle = '#F7C948'; cc.fill(); cc.lineWidth = 5; cc.strokeStyle = '#3b2a26'; cc.stroke(); cc.beginPath(); cc.arc(0, -30, 70, 0, 7); cc.fillStyle = '#E8485A'; cc.fill(); label(cc, '海报', 0, 120, { size: 44, color: '#3b2a26', weight: 900 }); },
    ];
    items.forEach((fn, i) => {
      const b = X.d * i / 3.2, k = eout(ph(t, b, b + 0.5));
      c.save(); c.translate(lerp(200, 520 + i * 450, k), 520); c.rotate((1 - k) * -0.6); fn(c); c.restore();
    });
  },
  C23(c, t, X) {
    S.paper(c);
    label(c, '一场婚礼的幕后工作', W / 2, 250, { size: 64, color: '#8E2A33' });
    const L = X.L[0], eat = 18 * ease(ph(t, L.s + 0.6, L.e - 0.3));
    const xe = I.hourBar(c, W / 2, 470, 30, eat, { bw: 46 });
    orb(c, xe + 34, 470, 1.4, t, { trail: [-1, 0] });
    const land = ph(t, L.e - 0.6, L.e - 0.2);
    const z = land > 0 ? 1 + 0.4 * (1 - back(land)) : 1;
    c.save(); c.translate(W / 2, 720); c.scale(z, z);
    big(c, '30 小时', -420, 0, 130, '#5A4A44');
    I.arrow(c, -150, 0, 60, 0, '#C8343A', 18, eout(ph(t, L.s + 0.8, L.s + 1.4)));
    big(c, '12 小时', 360, 0, 150, '#C8343A', { alpha: ph(t, L.s + 1.4, L.s + 1.8) });
    c.restore();
    // 反转定格：闪白一下
    fade(c, 0.5 * (ph(t, L.e - 0.25, L.e - 0.15) - ph(t, L.e - 0.1, L.e + 0.2)), '#FFFDF0');
  },
  C24(c, t, X) {
    S.shop(c, { cam: { x: 960, y: 600, z: 1.2 } });
    figure(c, CHEN, { x: 560, y: 1120, s: 1.3, expr: 'happy', armL: [1.2, 1.0], armR: [1.2, 1.0], blink: blink(t) });
    I.abacus(c, 640, 760, 0.8, t);
    const b = beat(X, 1);
    label(c, '成本', 1300, 380, { size: 60, color: '#8E2A33', bg: '#FFF8EA', pad: 22, alpha: ph(t, b, b + 0.3) });
    I.arrow(c, 1450, 300, 1450, 300 + 260 * eout(ph(t, b + 0.2, b + 0.8)), '#3FA66B', 22);
    // 招聘启事收进抽屉
    const k = ph(t, b + 1.0, b + 1.8);
    c.save(); c.translate(1300, 600 + 300 * ease(k)); c.globalAlpha = 1 - k; rr(c, -120, -80, 240, 160, 8); c.fillStyle = '#FFF8EA'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3b2a26'; c.stroke(); label(c, '招聘', 0, 0, { size: 60, weight: 900, color: '#C8343A' }); c.restore();
    rr(c, 1120, 880, 360, 120, 10); c.fillStyle = '#A8754E'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3b2a26'; c.stroke();
  },
  C25(c, t, X) {
    S.shop(c, { season: 0, t, cam: { x: 960, y: 560, z: 1.25 - 0.15 * ease(ph(t, 0, X.d)) } });
    // 桃花瓣飘进屋
    const r = rng(6);
    for (let i = 0; i < 40; i++) { const x = (r() * W + t * 120) % W, y = (r() * H + t * 80 + Math.sin(t + i) * 30) % H; c.fillStyle = '#F59AAE'; c.beginPath(); c.ellipse(x, y, 10, 6, t + i, 0, 7); c.fill(); }
    figure(c, CHEN, { x: 900, y: 1060, s: 1.2, expr: 'happy', lean: -0.08, armL: [2.4, 1.6], armR: [2.4, 1.6], handL: 'fist', handR: 'fist', bob: wave(t, 0.8, 6) });
    c.save(); c.globalCompositeOperation = 'screen'; const g = c.createRadialGradient(1500, 250, 50, 1500, 250, 1200); g.addColorStop(0, 'rgba(255,220,160,0.35)'); g.addColorStop(1, 'rgba(255,220,160,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    for (let i = 0; i < 3; i++) label(c, '♪', 1060 + i * 60, 520 - ((t * 60 + i * 40) % 160), { size: 50, color: '#8E2A33', alpha: 0.8 });
  },
  C26(c, t, X) {
    // 定格：花瓣停在半空，画面褪色
    const z = 1.1 + 0.08 * ease(ph(t, 0, X.d));
    S.shop(c, { season: 0, t: 0.3, cam: { x: 960, y: 560, z } });
    const r = rng(6);
    for (let i = 0; i < 40; i++) { const x = (r() * W + 0.3 * 120) % W, y = (r() * H + 0.3 * 80) % H; c.fillStyle = '#F59AAE'; c.beginPath(); c.ellipse(x, y, 10, 6, i, 0, 7); c.fill(); }
    figure(c, CHEN, { x: 900, y: 1060, s: 1.2 * z / 1.1, expr: 'stiff', lean: -0.08, armL: [2.4, 1.6], armR: [2.4, 1.6], handL: 'fist', handR: 'fist' });
    c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = `rgba(128,128,128,${0.85 * ph(t, 0, 0.4)})`; c.fillRect(0, 0, W, H); c.restore();
  },
  C27(c, t, X) {
    const k = ease(ph(t, 0, X.d * 0.8));
    const cam = camK({ x: 400, y: 500, z: 1.6 }, { x: 1300, y: 540, z: 1.0 }, k);
    S.street(c, { light: 'night', t, liLit: ph(t, X.d * 0.6, X.d * 0.8), cam });
    // 整条街的窗户依次亮起小光球（跟着远景层一起动）
    const pts = [[700, 500], [760, 470], [1180, 480], [1240, 500], [640, 540], [1300, 540], [820, 450], [1120, 450], [600, 460], [1340, 470]];
    S.withCam(c, cam, 0.6, () => pts.forEach(([x, y], i) => { const b = 0.4 + i * 0.25; if (t > b) orb(c, x, y, 0.35 * pop(t, b), t + i); }));
    if (t > X.d * 0.6) S.withCam(c, cam, 1, () => orb(c, 1640, 600, 1.0 * pop(t, X.d * 0.6), t));
  },
};

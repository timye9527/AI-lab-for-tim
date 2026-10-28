// 开场和第一幕（C01–C15）
import { W, H, clamp, lerp, ph, ease, eout, back, pop, wave, rng, rr, FONT, shade, figure, orb, CHEN, LI, STAFF, BRIDE, GROOM, PARTNER, GREY, person, S, I, label, big, titleCard, TITLE, blink, breathe, camK, fade, beat, youArrow, staffAt, ein } from './kit.js';

export const A01 = {
  // ── 开场 ──
  C01(c, t, X) {
    const k = ease(ph(t, 0, X.d));
    S.street(c, { light: 'dawn', t, cam: camK({ x: 960, y: 560, z: 1.25 }, { x: 760, y: 600, z: 1.05 }, k) });
    // 卷帘门拉起 → 小陈出场
    const up = eout(ph(t, 0.2, 1.4));
    figure(c, CHEN, { x: 470, y: 980, s: 1.12, expr: up > 0.9 ? 'smile' : 'flat', blink: blink(t), armL: [2.7 - up * 2.4, 0.2], armR: [2.7 - up * 2.4, 0.2], bob: breathe(t) });
    youArrow(c, 470, 400, ph(t, 1.2, 1.7), t);
  },
  C02(c, t, X) {
    const cut = 2.3;
    if (t < cut) {
      S.shop(c, { cam: { x: 960, y: 520, z: 1.5 + t * 0.08 } });
      figure(c, CHEN, { x: 900, y: 1180, s: 1.6, expr: t > 0.8 ? 'shock' : 'smile', armR: [2.2, 1.0], handR: 'open', blink: blink(t), look: 1 });
      // 手机
      c.save(); c.translate(1130, 640); c.rotate(-0.2); rr(c, -45, -80, 90, 160, 14); c.fillStyle = '#2E3038'; c.fill(); rr(c, -38, -70, 76, 140, 8); c.fillStyle = t > 0.4 ? '#BFF2FF' : '#556'; c.fill(); c.restore();
      const k = ph(t, 0.6, 1.6);
      if (k > 0) orb(c, 1130 + Math.sin(k * 6) * 120 * k, 620 - k * 180, 1.4 * eout(k), t, { trail: [Math.cos(k * 6), 0.5] });
    } else {
      const lt = t - cut;
      S.paper(c);
      label(c, '一场婚礼的幕后工作', W / 2, 260, { size: 60, color: '#8E2A33' });
      const eat = 18 * ease(ph(lt, 0.6, X.d - cut - 0.6));
      const xe = I.hourBar(c, W / 2, 540, 30, eat);
      orb(c, xe + 30, 540, 1.3, t, { trail: [-1, 0] });
      const n = Math.round(30 - eat);
      I.C && big(c, `${n} 小时`, W / 2, 760, 120, n <= 12 ? '#C8343A' : '#3b2a26');
    }
  },
  C03(c, t, X) {
    S.shop(c, { cam: { x: 960, y: 560, z: 1.35 } });
    I.speedLines(c, 960, 520, ph(t, 0, 0.2), t, 'rgba(255,240,200,0.9)');
    const j = Math.sin(clamp(t / 0.6) * Math.PI) * 120;
    const sh = t < 0.25 ? wave(t, 20, 8) : 0;
    c.save(); c.translate(sh, 0);
    figure(c, CHEN, { x: 960, y: 1130, s: 1.6, expr: 'star', jump: j, armL: [2.8, 0.2], armR: [2.8, 0.2], handL: 'fist', handR: 'fist' });
    c.restore();
    I.confetti(c, ph(t, 0.1, 0.4), t, 3);
  },
  C04(c, t, X) {
    S.shop(c, { cam: { x: 760, y: 560, z: 1.15 } });
    figure(c, CHEN, { x: 420, y: 1060, s: 1.3, expr: 'happy', armR: [2.4, 0.9], handR: 'fist', look: 1, bob: breathe(t) });
    const k = ph(t, 0.1, 0.6);
    I.bubble(c, 1200, 420, 900, 520, k, 620, 600);
    if (k > 0.5) {
      c.save(); c.globalAlpha = clamp((k - 0.5) * 2);
      for (let i = 0; i < 14; i++) I.coin(c, 1000 + (i % 7) * 60, 560 - Math.floor(i / 7) * 40, 32, t * 3 + i);
      figure(c, CHEN, { x: 1180, y: 540, s: 0.5, expr: 'happy', armL: [2.5, 0.3], armR: [2.5, 0.3] });
      const items = ['员工不加', '成本降', '赚翻'];
      items.forEach((s2, i) => { const b = beat(X, 0) + 0.9 + i * 0.9; I.check(c, 1440, 320 + i * 100, ph(t, b, b + 0.3), 0.9); label(c, s2, 1570, 320 + i * 100, { size: 44, alpha: ph(t, b, b + 0.3), color: '#8E2A33' }); });
      c.restore();
    }
  },
  C05(c, t, X) {
    const season = Math.min(3, Math.floor(ph(t, 0.4, X.d - 0.3) * 4));
    S.shop(c, { season, t, cam: { x: 1300, y: 420, z: 1.2 } });
    figure(c, CHEN, { x: 760, y: 1060, s: 1.25, expr: season >= 3 ? 'flat' : 'smile', look: 1, blink: blink(t) });
    // 泡泡破
    const k = ph(t, 0, 0.25); if (k < 1) { c.save(); c.globalAlpha = 1 - k; c.beginPath(); c.arc(1200, 420, 300 + k * 200, 0, 7); c.lineWidth = 8; c.strokeStyle = '#FFFFFF'; c.stroke(); c.restore(); }
    // 窗内光线变冷
    fade(c, 0.25 * ph(t, 0.5, X.d), '#2A3A66');
  },
  C06(c, t, X) {
    const d3 = X.d / 3, i = Math.min(2, Math.floor(t / d3)), lt = t - i * d3;
    S.paper(c, { skyline: false });
    const z = 1 + 0.08 * eout(clamp(lt / 0.4));
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
    if (i === 0) {
      // 预约板上的客户卡一张张掉
      rr(c, 560, 180, 800, 620, 20); c.fillStyle = '#8A5E3E'; c.fill(); rr(c, 590, 210, 740, 560, 12); c.fillStyle = '#F2E3CA'; c.fill();
      label(c, '预约', 960, 260, { size: 50, color: '#8E2A33' });
      for (let k = 0; k < 8; k++) {
        const fall = ph(lt, 0.15 + k * 0.12, 0.6 + k * 0.12);
        if (k > 2 && fall >= 1) continue;
        const x = 660 + (k % 4) * 170, y = 360 + Math.floor(k / 4) * 190 + (k > 2 ? ein(fall) * 700 : 0);
        c.save(); c.translate(x + 60, y + 60); c.rotate(k > 2 ? fall * 1.4 : 0);
        rr(c, -60, -70, 130, 150, 10); c.fillStyle = ['#F6D5C9', '#E9C7D8', '#D7E2EE', '#F3E2B8'][k % 4]; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3b2a26'; c.stroke();
        c.restore();
      }
    } else if (i === 1) {
      I.priceTag(c, 960, 480, '婚礼套餐', '#C8343A', 1.4, -0.06, { size: 64, slash: ph(lt, 0.2, 0.6) });
      I.arrow(c, 1330, 360, 1330, 360 + 300 * eout(ph(lt, 0.5, 0.9)), '#3b2a26', 22);
    } else {
      I.pancake(c, 960, 560, 360, 1 - 0.85 * ease(ph(lt, 0.1, d3 - 0.2)), { label: '利润' });
    }
    c.restore();
  },
  C07(c, t, X) {
    S.street(c, { light: 'night', t, liLit: 1, cam: camK({ x: 1500, y: 560, z: 1.35 }, { x: 1560, y: 560, z: 1.6 }, ease(ph(t, 0, X.d))) });
    // 逆光剪影：只露眼镜反光
    c.save(); c.filter = 'brightness(0.05)';
    figure(c, LI, { x: 1610, y: 860, s: 0.95, expr: 'flat', armR: [1.2, 1.4], armL: [0.9, 1.3] });
    c.restore();
    const gl = ph(t, X.d * 0.5, X.d * 0.5 + 0.2) - ph(t, X.d * 0.5 + 0.3, X.d * 0.5 + 0.6);
    if (gl > 0) { for (const dx of [-21, 21]) { const g = c.createRadialGradient(1610 + dx, 860 - 404 * 1.07 * 0.95 + 7, 2, 1610 + dx, 860 - 404 * 1.07 * 0.95 + 7, 40); g.addColorStop(0, `rgba(255,255,255,${gl})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(1500, 300, 220, 200); } }
    for (let i = 0; i < 4; i++) I.coin(c, 1690, 700 - i * 14, 22, t * 4 + i);
  },
  C08(c, t, X) {
    const tq = X.L[0].e;
    if (t < tq + 0.2) {
      S.shop(c, { cam: { x: 960, y: 520, z: 1.4 + t * 0.05 } });
      figure(c, CHEN, { x: 960, y: 1150, s: 1.6, expr: 'worry', armR: [2.9, 1.3], handR: 'open', sweat: ph(t, 0.3, 0.6) });
      I.question(c, 1260, 300, 1, ph(t, 0.2, 0.6));
    } else {
      const k = ph(t, tq + 0.2, tq + 0.8);
      S.street(c, { light: 'dusk', t, cam: { x: 960, y: 540, z: 1.0 } });
      fade(c, 0.35, '#3a1a1a');
      for (let i = 0; i < 10; i++) I.coin(c, 300 + i * 150, 900 - Math.sin(t * 2 + i) * 30, 26, t * 3 + i);
      titleCard(c, TITLE, k);
    }
  },

  // ── 第一幕 ──
  C09(c, t, X) {
    S.street(c, { light: 'day', t, cam: camK({ x: 760, y: 520, z: 1.1 }, { x: 1160, y: 520, z: 1.1 }, ease(ph(t, 0, X.d))) });
    // 扎花婚车开过
    const x = lerp(-300, 2300, ph(t, 0.2, X.d));
    c.save(); c.translate(x, 900); rr(c, -160, -70, 320, 90, 30); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3b2a26'; c.stroke();
    rr(c, -90, -120, 180, 60, 20); c.fillStyle = '#DDEFF6'; c.fill(); c.stroke();
    for (const wx of [-100, 100]) { c.beginPath(); c.arc(wx, 22, 30, 0, 7); c.fillStyle = '#2E2E33'; c.fill(); }
    c.beginPath(); c.arc(0, -130, 26, 0, 7); c.fillStyle = '#E8485A'; c.fill(); c.restore();
  },
  C10(c, t, X) {
    const k = ease(ph(t, 0, X.d * 0.7));
    S.shop(c, { cam: camK({ x: 960, y: 520, z: 1.35 }, { x: 960, y: 560, z: 1.0 }, k) });
    const xs = [330, 560, 1360, 1590, 1800];
    STAFF.forEach((C, i) => { const b = 0.5 + i * 0.35; const p2 = pop(t, b); if (p2 <= 0) return; figure(c, C, { x: xs[i], y: 990, s: 0.95 * p2, blink: blink(t, i), expr: 'smile' }); });
    figure(c, CHEN, { x: 960, y: 1010, s: 1.1, expr: 'happy', blink: blink(t), armL: [0.5, 0.6], armR: [0.5, 0.6] });
    label(c, '小陈 · 老板', 960, 400, { size: 44, color: '#FFFDF5', bg: '#8E2A33', pad: 20, alpha: ph(t, 0.3, 0.6) });
    fade(c, 0.9 * (ph(t, X.d - 0.35, X.d - 0.25) - ph(t, X.d - 0.2, X.d)), '#FFFFFF'); // 快门
  },
  C11(c, t, X) {
    S.paper(c, { skyline: false });
    const roles = ['策划', '设计', '拍视频', '剪辑 · 接待'];
    const at = [0, 0.25, 0.5, 0.72].map((f) => X.d * f);
    const props = [
      (cc) => { rr(cc, 300, 120, 300, 200, 8); cc.fillStyle = '#FFFFFF'; cc.fill(); cc.lineWidth = 4; cc.strokeStyle = '#3b2a26'; cc.stroke(); for (let j = 0; j < 4; j++) { cc.beginPath(); cc.moveTo(330, 160 + j * 40); cc.lineTo(330 + 160 + (j % 2) * 60, 160 + j * 40); cc.stroke(); } },
      (cc) => { rr(cc, 330, 220, 260, 160, 10); cc.fillStyle = '#2E3038'; cc.fill(); cc.beginPath(); cc.arc(460, 300, 50, 0, 7); cc.fillStyle = '#F59AAE'; cc.fill(); },
      (cc) => { rr(cc, 330, 160, 180, 110, 14); cc.fillStyle = '#2E3038'; cc.fill(); cc.beginPath(); cc.arc(560, 215, 44, 0, 7); cc.fillStyle = '#4A5A70'; cc.fill(); cc.lineWidth = 8; cc.strokeStyle = '#2E3038'; cc.stroke(); },
      (cc) => { rr(cc, 340, 220, 240, 150, 10); cc.fillStyle = '#2E3038'; cc.fill(); rr(cc, 352, 232, 216, 126, 6); cc.fillStyle = '#8FD3E8'; cc.fill(); cc.beginPath(); cc.arc(560, 140, 30, 0, 7); cc.fillStyle = '#C8343A'; cc.fill(); },
    ];
    for (let i = 0; i < 4; i++) {
      const x = 90 + (i % 2) * 880, y = 70 + Math.floor(i / 2) * 470, k = ph(t, at[i], at[i] + 0.3);
      I.panel(c, x, y, 860, 440, k, (cc) => {
        cc.fillStyle = ['#FDEBD6', '#E6F0F5', '#EAF2E4', '#F8E4E4'][i]; cc.fillRect(0, 0, 860, 440);
        props[i](cc);
        figure(cc, STAFF[i === 3 ? 4 : i === 2 ? 3 : i], { x: 170, y: 520, s: 0.95, expr: 'smile', blink: blink(t, i), armR: [1.6 + wave(t, 1.5, 0.15), 0.8], handR: 'open' });
        label(cc, roles[i], 690, 380, { size: 50, color: '#FFFDF5', bg: '#8E2A33', pad: 20 });
      });
    }
  },
  C12(c, t, X) {
    S.paper(c);
    const stations = ['方案', '效果图', '照片', '视频'];
    c.fillStyle = '#5A4A44'; rr(c, 80, 640, 1760, 50, 25); c.fill();
    for (let x = 100; x < 1840; x += 60) { c.beginPath(); c.arc(x + ((t * 120) % 60), 665, 10, 0, 7); c.fillStyle = '#8A7A74'; c.fill(); }
    stations.forEach((s2, i) => {
      const x = 330 + i * 420, act = ph(t, i * X.d / 4.6, i * X.d / 4.6 + 0.3);
      rr(c, x - 120, 380, 240, 200, 20); c.fillStyle = act > 0 ? '#FFF8EA' : '#EDE3D0'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#3b2a26'; c.stroke();
      label(c, s2, x, 300, { size: 52, color: '#FFFDF5', bg: '#8E2A33', pad: 20, scale: 0.8 + 0.2 * back(act) });
      [() => { for (let j = 0; j < 3; j++) { c.fillStyle = '#C9B89A'; c.fillRect(x - 70, 420 + j * 40, 140 - j * 30, 16); } },
       () => { c.beginPath(); c.arc(x, 480, 70, Math.PI, 0); c.lineWidth = 14; c.strokeStyle = '#F59AAE'; c.stroke(); },
       () => { rr(c, x - 70, 420, 140, 110, 6); c.fillStyle = '#D7E2EE'; c.fill(); c.beginPath(); c.arc(x - 20, 470, 16, 0, 7); c.arc(x + 20, 472, 16, 0, 7); c.fillStyle = '#FFFFFF'; c.fill(); },
       () => { c.beginPath(); c.moveTo(x - 30, 430); c.lineTo(x + 45, 480); c.lineTo(x - 30, 530); c.closePath(); c.fillStyle = '#C8343A'; c.fill(); }][i]();
    });
    // 礼盒沿传送带走
    const bx = lerp(150, 1800, ph(t, 0, X.d - 0.2));
    c.save(); c.translate(bx, 600); rr(c, -60, -60, 120, 100, 10); c.fillStyle = '#C8343A'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3b2a26'; c.stroke(); c.fillStyle = '#E8B04B'; c.fillRect(-10, -60, 20, 100); c.fillRect(-60, -18, 120, 16); c.restore();
  },
  C13(c, t, X) {
    const flip = ph(t, X.d * 0.42, X.d * 0.42 + 0.5);
    if (flip < 0.5) {
      S.banquet(c, { mode: 'party', t, cam: { x: 960, y: 560, z: 1.08 } });
      figure(c, GROOM, { x: 860, y: 900, s: 0.95, expr: 'happy', armR: [1.2, 0.5] });
      figure(c, BRIDE, { x: 1060, y: 900, s: 0.95, expr: 'happy', armL: [1.2, 0.5] });
      I.confetti(c, 1, t, 5);
    } else {
      S.shop(c, { light: 'night', cam: { x: 960, y: 560, z: 1.1 } });
      // 纸堆和硬盘
      for (const [x, h] of [[420, 260], [960, 330], [1500, 230]]) { for (let j = 0; j < h / 14; j++) { c.fillStyle = j % 2 ? '#F5EEE0' : '#E8DFCC'; c.fillRect(x - 110 + Math.sin(j) * 6, 760 - j * 14, 220, 12); } }
      staffAt(c, t, [420, null, 960, null, 1500], 1080, 1.0, { expr: ['flat', 0, 'stiff', 0, 'worry'], pose: [{ armL: [2.6, 0.6], armR: [0.3, 1.2] }, 0, { armR: [2.9, 1.5], handR: 'open' }, 0, { sweat: 0.8 }] });
    }
    // 翻页：横向压扁
    const sx = Math.abs(Math.cos(flip * Math.PI));
    if (flip > 0 && flip < 1) { const [L, lx] = [null, null]; c.save(); c.globalAlpha = 1 - sx; c.fillStyle = '#F2E3CA'; c.fillRect(W / 2 - (W / 2) * (1 - sx), 0, W * (1 - sx), H); c.restore(); }
  },
  C14(c, t, X) {
    S.paper(c);
    const b1 = beat(X, 1), half = (X.L[1].e - b1) / 2;
    // 跷跷板：前半句压左（订单少），后半句压右（订单多）
    const a = t < b1 + half ? -0.16 * ease(ph(t, b1, b1 + 0.6)) : lerp(-0.16, 0.16, ease(ph(t, b1 + half, b1 + half + 0.6)));
    c.save(); c.translate(960, 760);
    c.beginPath(); c.moveTo(-60, 120); c.lineTo(60, 120); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#8A5E3E'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3b2a26'; c.stroke();
    c.rotate(a); rr(c, -700, -24, 1400, 30, 12); c.fillStyle = '#C9A27A'; c.fill(); c.stroke();
    // 左：订单卡少，工资袋飞走；右：订单堆成山
    for (let i = 0; i < 2; i++) { rr(c, -600 + i * 70, -110, 60, 80, 6); c.fillStyle = '#F6D5C9'; c.fill(); c.stroke(); }
    for (let i = 0; i < 16; i++) { rr(c, 380 + (i % 4) * 60, -110 - Math.floor(i / 4) * 70, 56, 66, 6); c.fillStyle = ['#F6D5C9', '#D7E2EE', '#F3E2B8'][i % 3]; c.fill(); c.stroke(); }
    c.restore();
    label(c, '订单少', 360, 520, { size: 52, color: '#8E2A33', bg: '#FFF8EA', pad: 20, alpha: ph(t, b1, b1 + 0.3) });
    label(c, '订单多', 1560, 400, { size: 52, color: '#8E2A33', bg: '#FFF8EA', pad: 20, alpha: ph(t, b1 + half, b1 + half + 0.3) });
    if (t < b1 + half + 0.3) for (let i = 0; i < 3; i++) { const k = ph(t, b1 + 0.4 + i * 0.25, b1 + 1.6 + i * 0.25); if (k > 0 && k < 1) I.coin(c, 420 - k * 300, 640 - k * 500 - i * 40, 26, t * 5); }
    figure(c, CHEN, { x: 960, y: 760 - 40, s: 0.62, expr: 'worry', armL: [1.5, 0.2], armR: [1.5, 0.2], sweat: 0.9, lean: a * 0.6 });
    if (t > b1 + half) for (let i = 0; i < 3; i++) figure(c, STAFF[i], { x: 1560 + i * 90, y: 1000, s: 0.55, expr: 'stiff', sweat: 1 });
  },
  C15(c, t, X) {
    S.shop(c, { cam: { x: 960, y: 560, z: 1.05 + 0.1 * ease(ph(t, 0, X.d)) } });
    figure(c, CHEN, { x: 480, y: 1040, s: 1.2, expr: 'worry', armL: [2.5, 0.2], armR: [2.5, 0.2] });
    // 招聘启事
    c.save(); c.translate(480, 360); rr(c, -150, -100, 300, 200, 10); c.fillStyle = '#FFF8EA'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#3b2a26'; c.stroke();
    label(c, '招聘', 0, -10, { size: 80, weight: 900, color: '#C8343A' }); c.restore();
    // 多一个人 → 金币流走
    const n = Math.min(5, Math.floor(ph(t, 0.4, X.d - 0.3) * 6));
    for (let i = 0; i < n; i++) figure(c, GREY(i), { x: 900 + i * 180, y: 900, s: 0.62, expr: 'smile' });
    for (let i = 0; i < n * 2; i++) { const k = (t * 0.8 + i * 0.13) % 1; I.coin(c, 1000 + (i % 5) * 160, 980 + k * 140, 22, t * 4 + i); }
    label(c, '多赚钱 = 多招人', 1300, 280, { size: 64, weight: 900, color: '#8E2A33', bg: '#FFF8EA', border: '#3b2a26', pad: 26, alpha: ph(t, 0.6, 1.0) });
  },
};


// 配樂與音效編排：所有時間點都來自 timeline.js，和畫面共用
import { DURATION, T, FLYBYS, CROWD_TIMES, WARM_CHORDS, warmPicks, beatTime, BEAT, GRID0, beat2Time, camSpeed } from '../timeline.js';
import { SR, Bus, render, pluck, noteFreq as nf, Biquad, noiseGen, env, reverb, limit } from './synth.js';
import { makeCrowd } from '../space.js';
import { WASH_TIMES } from '../sea.js';
import { initFinale, threadHead } from '../finale.js';

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const saw = (p) => 2 * (p - Math.floor(p)) - 1;

// ---------- 音色 ----------
function kick({ f0 = 150, f1 = 45, dec = 0.3, click = 0.25, vel = 1 } = {}) {
  let ph = 0;
  return render(dec * 2.2, (t) => {
    const f = f1 + (f0 - f1) * Math.exp(-t / 0.032);
    ph += (TAU * f) / SR;
    const a = Math.exp(-t / dec) * Math.min(1, t / 0.0015);
    const c = t < 0.005 ? (1 - t / 0.005) * click * Math.sin(t * TAU * 2800) : 0;
    return (Math.sin(ph) * a + c) * vel;
  });
}
function hat(dec = 0.035, seed = 1, vel = 1) {
  const r = noiseGen(seed);
  const hp = new Biquad('hp', 7500, 0.8);
  const bp = new Biquad('bp', 10000, 1.2);
  return render(dec * 5, (t) => {
    const x = r();
    return (hp.run(x) * 0.6 + bp.run(x) * 0.6) * Math.exp(-t / dec) * Math.min(1, t / 0.0008) * vel;
  });
}
function clap(seed = 3, vel = 1) {
  const r = noiseGen(seed);
  const bp = new Biquad('bp', 1500, 1.1);
  return render(0.3, (t) => {
    let e = Math.exp(-t / 0.09);
    for (const o of [0, 0.011, 0.022]) if (t >= o && t < o + 0.01) e = Math.max(e, 1 - (t - o) / 0.01);
    return bp.run(r()) * e * 1.8 * vel;
  });
}
function shaker(seed = 5, vel = 1) {
  const r = noiseGen(seed);
  const bp = new Biquad('bp', 6500, 1.5);
  return render(0.09, (t) => bp.run(r()) * Math.sin(Math.PI * clamp(t / 0.07)) ** 2 * vel);
}
function arpNote(freq, cutoff, dur = 0.2, vel = 1) {
  const lp = new Biquad('lp', cutoff, 1.4);
  let p1 = 0;
  let p2 = 0.3;
  return render(dur + 0.05, (t) => {
    p1 += (freq * 1.003) / SR;
    p2 += (freq * 0.997) / SR;
    const e = env(t, 0.002, dur * 0.45, dur + 0.05, 0.03);
    lp.set(cutoff * (0.5 + 1.2 * Math.exp(-t / 0.05)), 1.4);
    return lp.run(0.5 * saw(p1) + 0.5 * (saw(p2) > 0 ? 0.6 : -0.6)) * e * vel;
  });
}
function bassNote(freq, dur, vel = 1, cutoff = 420) {
  const lp = new Biquad('lp', cutoff, 0.9);
  let p = 0;
  return render(dur + 0.05, (t) => {
    p += freq / SR;
    const e = env(t, 0.004, dur * 0.7, dur + 0.05, 0.04);
    return (lp.run(saw(p)) * 0.7 + Math.sin(TAU * p) * 0.6) * e * vel;
  });
}
function padNote(freq, dur, { att = 0.8, rel = 1.0, cutoff = 1100, vel = 1, seed = 1 } = {}) {
  const lp = new Biquad('lp', cutoff, 0.7);
  const ph = [0, 0.33, 0.71];
  const det = [1, 1.0035, 0.9965];
  return render(dur, (t) => {
    let x = 0;
    for (let k = 0; k < 3; k++) {
      ph[k] += (freq * det[k]) / SR;
      x += saw(ph[k]);
    }
    lp.set(cutoff * (1 + 0.15 * Math.sin(t * 0.7 + seed)), 0.7);
    const a = Math.min(1, t / att) * Math.min(1, Math.max(0, (dur - t) / rel));
    return lp.run(x / 3) * a * vel;
  });
}
function bell(freq, dur = 2.2, vel = 1, ratio = 3.5, index = 2.4) {
  return render(dur, (t) => {
    const I = index * Math.exp(-t / 0.25);
    const a = Math.exp(-t / (dur * 0.35)) * Math.min(1, t / 0.002);
    return Math.sin(TAU * freq * t + I * Math.sin(TAU * freq * ratio * t)) * a * vel;
  });
}
function blip(freq, dur = 0.06, vel = 1, glide = 1) {
  return render(dur + 0.01, (t) => {
    const f = freq * (1 + (glide - 1) * clamp(t / dur));
    return Math.sin(TAU * f * t) * Math.sin(Math.PI * clamp(t / dur)) ** 1.5 * vel;
  });
}
function noiseSweep(dur, f0, f1, shape, seed = 7, q = 1.2) {
  const r = noiseGen(seed);
  const bp = new Biquad('bp', f0, q);
  return render(dur, (t) => {
    const u = t / dur;
    bp.set(f0 * Math.pow(f1 / f0, u), q);
    return bp.run(r()) * shape(u);
  });
}
// 帶聲像移動的掠過聲
function whoosh(bus, t, dur, gain, pan0, pan1, f0 = 400, f1 = 2400, seed = 11) {
  const peak = 0.55;
  const m = noiseSweep(dur, f0, f1, (u) => (u < peak ? Math.pow(u / peak, 2) : Math.pow(1 - (u - peak) / (1 - peak), 1.5)), seed, 0.9);
  const L = new Float32Array(m.length);
  const R = new Float32Array(m.length);
  for (let i = 0; i < m.length; i++) {
    const p = pan0 + (pan1 - pan0) * (i / m.length);
    const a = ((p + 1) * Math.PI) / 4;
    L[i] = m[i] * Math.cos(a) * 1.4;
    R[i] = m[i] * Math.sin(a) * 1.4;
  }
  bus.addStereo(L, R, t - dur * peak, gain);
}

// ---------- 編排 ----------
export function buildScore() {
  initFinale();
  const D = DURATION;
  const front = new Bus(D); // 0–11 秒，會在停頓點被切斷（含殘響）
  const frontRev = new Bus(D);
  const back = new Bus(D);
  const backRev = new Bus(D);
  const F = (m, t, g, pan = 0, s = 0) => {
    front.add(m, t, g, pan);
    if (s) frontRev.add(m, t, g * s, pan);
  };
  const B = (m, t, g, pan = 0, s = 0) => {
    back.add(m, t, g, pan);
    if (s) backRev.add(m, t, g * s, pan);
  };

  // ===== 0–1.25 游標與拉開 =====
  F(blip(1760, 0.05), T.blink1, 0.09, 0, 0.6);
  F(blip(1760, 0.05), T.blink2, 0.09, 0, 0.6);
  // 游標拉成時間軸：細亮的「嘶」
  F(noiseSweep(0.4, 1500, 9000, (u) => Math.sin(Math.PI * u) ** 2, 21, 2), T.stretch, 0.1, 0, 0.5);
  F(blip(520, 0.4, 1, 3), T.stretch, 0.05, 0, 0.6);
  // 打開前的倒吸氣
  F(noiseSweep(0.35, 300, 3000, (u) => u * u, 22, 0.8), T.open - 0.35, 0.18, 0, 0.3);
  // 打開：低頻與空氣
  F(kick({ f0: 90, f1: 32, dec: 0.7, click: 0.1 }), T.open, 0.55, 0, 0.4);
  whoosh(front, T.open + 0.25, 1.1, 0.16, -0.6, 0.6, 200, 1600, 23);

  // ===== 1.25–11 電子節奏逐步加密 =====
  const chords = [
    ['D3', 'F3', 'A3', 'C4'],
    ['Bb2', 'D3', 'F3', 'A3'],
    ['G2', 'Bb2', 'D3', 'F3'],
    ['F2', 'A2', 'C3', 'E3'],
    ['A2', 'C#3', 'E3', 'G3'],
  ];
  const roots = ['D2', 'Bb1', 'G1', 'F1', 'A1'];
  for (let bar = 0; bar < 5; bar++) {
    const b0 = bar * 4;
    // 大鼓
    for (let q = 0; q < 4; q++) {
      if (bar === 0 && q % 2) continue;
      F(kick({ vel: 1 }), beatTime(b0 + q), bar === 0 ? 0.45 : 0.55);
    }
    if (bar === 4) for (let k = 1; k < 4; k++) F(kick({ dec: 0.15 }), beatTime(b0 + 3 + k / 4), 0.28 + k * 0.05);
    // 腳踏鈸
    const hatDiv = bar === 0 ? 0 : bar < 3 ? 2 : 4;
    for (let k = 0; k < 4 * hatDiv; k++) {
      if (hatDiv === 2 && k % 2 === 0 && bar === 1) continue;
      const acc = k % hatDiv === hatDiv / 2 ? 1 : 0.55;
      F(hat(0.03, bar * 100 + k, acc), beatTime(b0 + k / hatDiv), 0.07 + 0.02 * bar, k % 2 ? 0.25 : -0.15);
    }
    // 拍手
    if (bar >= 2) for (const q of [1, 3]) F(clap(bar * 10 + q), beatTime(b0 + q), 0.16, 0.05, 0.25);
    // 琶音：前兩小節八分音符，之後十六分
    const div = bar < 2 ? 2 : 4;
    for (let k = 0; k < 4 * div; k++) {
      const t = beatTime(b0 + k / div);
      const idx = k % 8;
      const n = chords[bar][idx % 4];
      const oct = idx >= 4 ? 4 : 2;
      const freq = nf(n) * oct;
      const prog = (t - GRID0) / (T.stop - GRID0);
      const cutoff = 700 * Math.pow(7, prog);
      F(arpNote(freq, cutoff, div === 2 ? 0.22 : 0.13), t, 0.1 + 0.03 * prog, k % 2 ? 0.35 : -0.35, 0.3);
    }
    // 低音：第三小節起
    if (bar >= 2) for (let k = 0; k < 8; k++) F(bassNote(nf(roots[bar]) * 2, BEAT / 2 - 0.03, 1, 380 + bar * 60), beatTime(b0 + k / 2) + 0.01, 0.22);
    // 和弦長音：底層的冷色鋪墊
    for (const n of chords[bar]) F(padNote(nf(n), BEAT * 4 + 0.3, { att: 0.3, rel: 0.25, cutoff: 900 + bar * 250, seed: bar }), beatTime(b0), 0.045, 0, 0.5);
    // 第四小節起：時鐘般的滴答
    if (bar >= 3) {
      for (let k = 0; k < 16; k++) {
        const r = noiseGen(500 + bar * 16 + k);
        const bp = new Biquad('bp', 3200, 6);
        const tick = render(0.03, (t) => bp.run(r()) * Math.exp(-t / 0.006));
        F(tick, beatTime(b0 + k / 4) + 0.005, 0.1 + 0.06 * (bar - 3), 0.5 * (k % 2 ? 1 : -1));
      }
    }
  }
  // 掠過鏡頭的元素
  FLYBYS.forEach((f, i) => {
    const sp = camSpeed(f.t);
    const dur = clamp(1.4 / (1 + sp * 0.9), 0.25, 1.3);
    whoosh(front, f.t, dur, 0.13 + 0.03 * Math.min(sp, 3), 0.85, -0.85, 300 + 80 * sp, 2500 + 600 * sp, 40 + i);
  });

  // 組裝 1：打字、卡位、完成
  for (let i = 0; i < 5; i++) F(blip(2400 + i * 120, 0.018), T.asm1 + i * 0.04, 0.05, -0.2 + i * 0.1);
  for (let i = 0; i < 5; i++) F(kick({ f0: 900, f1: 300, dec: 0.012, click: 0.4 }), T.asm1 + 0.72 + i * 0.03, 0.12, -0.3 + i * 0.15);
  F(bell(nf('A5'), 1.6, 1, 2, 1.5), T.asm1 + 0.82, 0.09, 0, 0.5);
  whoosh(front, T.asm1 + 1.3, 0.5, 0.08, 0.1, -0.9, 500, 3000, 61);
  // 組裝 2：火花、光錐、舞台
  F(blip(1200, 0.08, 1, 2.2), T.asm2, 0.1, 0, 0.5);
  F(noiseSweep(0.45, 800, 5000, (u) => Math.sin(Math.PI * u) * 0.8, 62, 3), T.asm2 + 0.15, 0.06, 0, 0.4);
  F(bell(nf('C#6'), 1.6, 1, 2, 1.5), T.asm2 + 0.72, 0.08, 0.1, 0.5);
  whoosh(front, T.asm2 + 1.3, 0.5, 0.08, 0.1, -0.9, 500, 3000, 63);
  // 組裝 3：主線變成音波，捲成唱片
  {
    let ph = 0;
    const wob = render(0.38, (t) => {
      ph += (TAU * 330 * (1 + 0.25 * Math.sin(TAU * 11 * t))) / SR;
      return Math.sin(ph + 0.6 * Math.sin(ph * 2)) * Math.sin(Math.PI * clamp(t / 0.38));
    });
    F(wob, T.asm3, 0.08, 0, 0.4);
    F(noiseSweep(0.4, 600, 4000, (u) => u * (1 - u) * 4, 64, 2), T.asm3 + 0.32, 0.07, 0, 0.4);
    F(bell(nf('E6'), 1.6, 1, 2, 1.5), T.asm3 + 0.74, 0.08, -0.1, 0.5);
    whoosh(front, T.asm3 + 1.05, 0.45, 0.08, 0.1, -0.9, 500, 3000, 65);
  }
  // 擁擠：大標籤與一堆通知
  CROWD_TIMES.forEach((t, i) => {
    const pan = [-0.4, 0.45, 0.35, -0.35][i];
    F(blip(988 + i * 60, 0.05), t, 0.11, pan, 0.3);
    F(blip(1480 + i * 90, 0.06), t + 0.06, 0.1, pan, 0.3);
  });
  for (const c of makeCrowd(16)) {
    const f = 1300 + (c.h * 7 | 0) * 180;
    F(blip(f, 0.03), c.t + 0.1, 0.03 + 0.02 * c.sc, (c.x - 960) / 1100);
  }
  // 緊繃：上升的噪音與細高音（音量克制）
  F(noiseSweep(2.4, 400, 7000, (u) => u * u * 0.9, 66, 1.4), T.stop - 2.4, 0.12, 0, 0.2);
  {
    let ph = 0;
    const tense = render(2.0, (t) => {
      ph += (TAU * (880 + 520 * (t / 2) ** 2)) / SR;
      return Math.sin(ph) * (t / 2) ** 2 * (0.7 + 0.3 * Math.sin(TAU * (4 + 10 * t) * t));
    });
    F(tense, T.stop - 2.0, 0.035);
  }

  // ===== 11.0 停頓：前段（含殘響）在此切斷 =====
  const fr = reverb(frontRev, { room: 0.8, damp: 0.35 });
  front.mix(fr, 0.9);
  // 前段漸強：越到後面越密、越響
  for (let i = 0; i < front.n; i++) {
    const t = i / SR;
    const g = t < GRID0 ? 0.8 : 0.5 + 0.5 * Math.pow(clamp((t - GRID0) / (T.stop - GRID0)), 1.3);
    front.L[i] *= g;
    front.R[i] *= g;
  }
  const cut = Math.round(T.stop * SR);
  const fadeN = Math.round(0.012 * SR);
  for (let i = cut - fadeN; i < front.n; i++) {
    const g = i < cut ? (cut - i) / fadeN : 0;
    front.L[i] *= g;
    front.R[i] *= g;
  }

  // ===== 12.25 撥弦 =====
  {
    // 手指碰弦：極輕的摩擦
    const r = noiseGen(77);
    const bp = new Biquad('bp', 2600, 4);
    B(render(0.25, (t) => bp.run(r()) * Math.sin(Math.PI * clamp(t / 0.25)) ** 2), T.pluck - 0.3, 0.012);
    const d3 = pluck(nf('D3'), 7, { bright: 0.62, decay: 5.5, pos: 0.2, seed: 3, body: 0.5 });
    B(d3, T.pluck, 0.5, 0, 0.55);
    const d2 = pluck(nf('D2'), 6, { bright: 0.3, decay: 4, pos: 0.3, seed: 4, body: 0.3 });
    B(d2, T.pluck + 0.002, 0.16, 0, 0.3);
    // 低頻的呼吸
    B(render(3.5, (t) => Math.sin(TAU * nf('D2') * t) * Math.sin(Math.PI * clamp(t / 3.5)) ** 2), T.pluck + 0.3, 0.05);
  }

  // ===== 13–23 溫暖段落 =====
  // 鋪底和弦
  B(padNote(nf('D3'), 3.4, { att: 1.6, rel: 1.2, cutoff: 900 }), 13.0, 0.05, -0.2, 0.5);
  B(padNote(nf('A3'), 3.4, { att: 1.6, rel: 1.2, cutoff: 900, seed: 2 }), 13.0, 0.045, 0.2, 0.5);
  B(padNote(nf('E4'), 3.4, { att: 1.8, rel: 1.2, cutoff: 900, seed: 3 }), 13.0, 0.03, 0, 0.5);
  WARM_CHORDS.forEach((c, i) => {
    const dur = (i === WARM_CHORDS.length - 1 ? 1.4 : 2) + 0.9;
    c.notes.slice(0, 4).forEach((n, k) => B(padNote(nf(n), dur, { att: 0.7, rel: 0.8, cutoff: 1200, seed: i * 4 + k }), c.t - 0.2, 0.04, -0.3 + k * 0.2, 0.5));
  });
  // 指彈分解
  warmPicks().forEach((p, i) => {
    const m = pluck(nf(p.note), 3, { bright: 0.38, decay: 2.6, pos: 0.16 + (i % 3) * 0.03, seed: 100 + i, body: 0.4 });
    B(m, p.t, 0.3 * p.vel, ((i % 5) - 2) * 0.15, 0.35);
  });
  // 海浪與風（一直延續到片尾）
  {
    const rL = noiseGen(301);
    const rR = noiseGen(302);
    // 海浪：寬頻的「沙沙」聲為主，低頻只留一點，避免轟鳴
    const lpL = new Biquad('lp', 900, 0.6);
    const lpR = new Biquad('lp', 900, 0.6);
    const hpL = new Biquad('hp', 160, 0.6);
    const hpR = new Biquad('hp', 160, 0.6);
    const hiss = new Biquad('hp', 2500, 0.7);
    const wind = new Biquad('bp', 600, 2.5);
    let bL = 0;
    let bR = 0;
    const t0 = 14.2;
    const n = Math.ceil((D - t0) * SR);
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = t0 + i / SR;
      // 粉紅傾向的雜訊：白雜訊與緩慢積分混合
      const wl = rL();
      const wr = rR();
      bL = bL * 0.97 + wl * 0.12;
      bR = bR * 0.97 + wr * 0.12;
      let wash = 0;
      for (const w of WASH_TIMES) {
        const u = t - w + 1.4;
        if (u > 0 && u < 4) wash = Math.max(wash, u < 1.4 ? (u / 1.4) ** 2 : Math.exp(-(u - 1.4) / 0.9));
      }
      const swell = 0.45 + 0.25 * Math.sin((TAU * t) / 6.3) + 0.7 * wash;
      if (i % 32 === 0) {
        lpL.set(800 + 2200 * wash, 0.6);
        lpR.set(850 + 2200 * wash, 0.6);
        wind.set(500 + 300 * Math.sin(t * 0.4) + 150 * Math.sin(t * 1.3), 2.5);
      }
      const fade = clamp((t - t0) / 1.8) * (1 - clamp((t - 31) / 1));
      const h = hiss.run(wl) * 0.1 * wash;
      const wd = wind.run(wr) * 0.1 * (0.6 + 0.4 * Math.sin(t * 0.37));
      L[i] = (hpL.run(lpL.run(bL + wl * 0.15)) * swell + h + wd * 0.8) * fade;
      R[i] = (hpR.run(lpR.run(bR + wr * 0.15)) * swell + h * 0.8 + wd) * fade;
    }
    back.addStereo(L, R, t0, 0.5);
  }
  // 取景框：對焦提示音、快門
  B(blip(2600, 0.04), T.viewfinder + 0.75, 0.035, 0);
  B(blip(2600, 0.04), T.viewfinder + 0.83, 0.035, 0);
  {
    const r = noiseGen(88);
    const hp = new Biquad('hp', 1800, 0.7);
    const click = (dec, f) => render(0.05, (t) => (hp.run(r()) * 0.8 + Math.sin(TAU * f * t) * 0.5) * Math.exp(-t / dec));
    B(click(0.006, 1900), T.shutter, 0.2, 0, 0.2);
    B(click(0.01, 1300), T.shutter + 0.075, 0.16, 0, 0.2);
  }
  // 聚光燈：開燈的悶響與一點溫暖的嗡聲
  B(kick({ f0: 120, f1: 60, dec: 0.12, click: 0.3 }), T.beam, 0.28, 0.4, 0.4);
  {
    const r = noiseGen(91);
    const lp = new Biquad('lp', 500, 0.7);
    B(render(0.12, (t) => lp.run(r()) * Math.exp(-t / 0.03)), T.beam, 0.25, 0.4, 0.3);
    B(render(2.6, (t) => (Math.sin(TAU * 120 * t) * 0.6 + Math.sin(TAU * 240 * t) * 0.3) * Math.min(1, t / 0.4) * Math.min(1, (2.6 - t) / 1)), T.beam, 0.012, 0.4);
  }

  // ===== 23–29 再次上升：開闊而從容 =====
  // 光線離開海平線：向上的撥弦琶音
  ['D4', 'F#4', 'A4', 'D5', 'E5', 'F#5'].forEach((n, i) => B(pluck(nf(n), 2.5, { bright: 0.5, decay: 2.2, seed: 400 + i }), T.lift + i * 0.09, 0.22, -0.4 + i * 0.16, 0.5));
  const late = [
    { t: 23, dur: 2, notes: ['D3', 'A3', 'D4', 'F#4', 'A4', 'E5'], root: 'D2' },
    { t: 25, dur: 2, notes: ['B2', 'F#3', 'B3', 'D4', 'F#4', 'C#5'], root: 'B1' },
    { t: 27, dur: 1, notes: ['G2', 'D3', 'G3', 'B3', 'D4', 'A4'], root: 'G1' },
    { t: 28, dur: 0.5, notes: ['A2', 'E3', 'A3', 'D4', 'E4', 'A4'], root: 'A1' },
  ];
  late.forEach((c, ci) => {
    c.notes.slice(0, 4).forEach((n, k) => B(padNote(nf(n), c.dur + 0.8, { att: 0.4, rel: 0.6, cutoff: 1500, seed: 50 + ci * 4 + k }), c.t - 0.1, 0.035, -0.3 + k * 0.2, 0.5));
    const steps = Math.round(c.dur / 0.25);
    const pat = [0, 2, 1, 3, 4, 3, 2, 5];
    for (let k = 0; k < steps; k++) {
      const n = c.notes[pat[k % 8]];
      const t = c.t + k * 0.25 + (k % 2 ? 0.02 : 0);
      B(pluck(nf(n), 2, { bright: 0.48, decay: 1.8, seed: 600 + ci * 20 + k, body: 0.35 }), t, (k % 4 === 0 ? 0.26 : 0.19), ((k % 4) - 1.5) * 0.25, 0.3);
    }
    for (let q = 0; q < c.dur / 0.5; q++) B(bassNote(nf(c.root) * 2, 0.45, 1, 300), c.t + q * 0.5, 0.14, 0, 0);
  });
  for (let b = 0; b < 11; b++) {
    const t = beat2Time(b);
    if (b < 4 && b % 2) continue;
    B(kick({ f0: 110, f1: 48, dec: 0.22, click: 0.08 }), t, 0.32);
    if (b >= 4 && b % 2) {
      const r = noiseGen(700 + b);
      const bp = new Biquad('bp', 2200, 1.4);
      B(render(0.08, (tt) => bp.run(r()) * Math.exp(-tt / 0.018) * 1.5), t, 0.12, 0.1, 0.35);
    }
  }
  for (let k = 0; k < 18; k++) B(shaker(800 + k, k % 2 ? 1 : 0.55), beat2Time(2) + k * 0.25, 0.05, 0.3);
  // 光線串起三個母題：每完成一個，一聲鐘琴
  B(bell(nf('F#5'), 2, 1, 2, 1.2), 24.85, 0.08, -0.45, 0.6);
  B(bell(nf('A5'), 2, 1, 2, 1.2), 25.9, 0.08, 0, 0.6);
  B(bell(nf('D6'), 2.2, 1, 2, 1.2), 26.95, 0.075, 0.45, 0.6);
  // 母題散成光點
  for (let i = 0; i < 9; i++) {
    const n = ['D6', 'E6', 'F#6', 'A6', 'B6'][i % 5];
    B(bell(nf(n), 1.2, 1, 3, 0.8), 27.25 + i * 0.07 + (i % 2) * 0.02, 0.025, ((i % 5) - 2) * 0.3, 0.7);
  }
  // 寫字的聲音：跟著光頭速度
  {
    const r = noiseGen(950);
    const bp = new Biquad('bp', 4000, 1.5);
    const t0 = T.lift;
    const n = Math.ceil((28.75 - t0) * SR);
    const out = new Float32Array(n);
    let sp = 0;
    let target = 0;
    for (let i = 0; i < n; i++) {
      const t = t0 + i / SR;
      if (i % 96 === 0) {
        const h = threadHead(t);
        target = h ? clamp(h.speed / 2600) * (h.kind === 'tim' ? 1.3 : 0.8) : 0;
        bp.set(2500 + 3500 * target, 1.5);
      }
      sp += (target - sp) * 0.002;
      out[i] = bp.run(r()) * sp;
    }
    B(out, t0, 0.07, 0, 0.5);
  }

  // ===== 28.7–32 結尾 =====
  B(bell(nf('A6'), 1.5, 1, 3, 1), T.dot + 0.12, 0.05, -0.05, 0.6);
  // 游標回收：開場那聲「滴」，以更溫暖、低八度的音色再出現
  B(blip(880, 0.07), T.caret, 0.06, 0.15, 0.7);
  B(blip(880, 0.07), T.caret + 0.55, 0.045, 0.15, 0.7);
  // 最後的和弦：輕掃，長長的尾音
  ['D2', 'A2', 'D3', 'A3', 'E4', 'F#4', 'A4'].forEach((n, i) => B(pluck(nf(n), 3.5, { bright: 0.45, decay: 3.2, seed: 990 + i, body: 0.45 }), T.caret + 0.05 + i * 0.022, 0.24, -0.3 + i * 0.1, 0.6));
  B(bell(nf('D5'), 3, 1, 2, 0.8), T.caret + 0.1, 0.05, 0, 0.8);
  B(bell(nf('A5'), 3, 1, 2, 0.6), T.caret + 0.45, 0.035, 0.2, 0.8);
  ['D3', 'A3', 'E4', 'F#4'].forEach((n, k) => B(padNote(nf(n), 32 - T.caret, { att: 0.6, rel: 2.2, cutoff: 1000, seed: 90 + k }), T.caret, 0.04, -0.3 + k * 0.2, 0.6));

  const br = reverb(backRev, { room: 0.88, damp: 0.28 });
  back.mix(br, 1.0);

  // ===== 混音 =====
  const master = new Bus(D);
  master.mix(front, 1);
  master.mix(back, 1);
  // 高通去掉次低頻
  for (const ch of [master.L, master.R]) {
    const hp = new Biquad('hp', 28, 0.7);
    for (let i = 0; i < ch.length; i++) ch[i] = hp.run(ch[i]);
  }
  // 片尾淡出
  const f0 = Math.round(31.2 * SR);
  for (let i = f0; i < master.n; i++) {
    const g = Math.max(0, 1 - (i - f0) / (master.n - f0)) ** 1.5;
    master.L[i] *= g;
    master.R[i] *= g;
  }
  return master;
}

export { limit };

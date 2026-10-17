// 常用乐器和音效（完整版配乐用），都基于 synth.js
import { SR, render, pluck, noteFreq as nf, Biquad, noiseGen } from './synth.js';

const TAU = Math.PI * 2;
export const saw = (p) => 2 * (p - Math.floor(p)) - 1;
export const sq = (p) => (p - Math.floor(p) < 0.5 ? 1 : -1);
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

export function kick(v = 1) {
  let ph = 0;
  return render(0.4, (t) => {
    ph += (TAU * (45 + 110 * Math.exp(-t / 0.03))) / SR;
    return Math.sin(ph) * Math.exp(-t / 0.15) * v;
  });
}
export function clap(seed = 1, v = 1) {
  const r = noiseGen(seed);
  const bp = new Biquad('bp', 1600, 1.1);
  return render(0.25, (t) => {
    let e = Math.exp(-t / 0.07);
    for (const o of [0, 0.01, 0.02]) if (t >= o && t < o + 0.008) e = Math.max(e, 1 - (t - o) / 0.008);
    return bp.run(r()) * e * 1.6 * v;
  });
}
export function hat(seed = 1, v = 1, dec = 0.03) {
  const r = noiseGen(seed);
  const hp = new Biquad('hp', 8000, 0.8);
  return render(dec * 5, (t) => hp.run(r()) * Math.exp(-t / dec) * v);
}
export function shaker(seed = 1, v = 1) {
  const r = noiseGen(seed);
  const bp = new Biquad('bp', 6500, 1.5);
  return render(0.09, (t) => bp.run(r()) * Math.sin(Math.PI * clamp(t / 0.07)) ** 2 * v);
}
export function bass(n, dur, v = 1) {
  const lp = new Biquad('lp', 500, 0.9);
  let p = 0;
  return render(dur, (t) => {
    p += nf(n) / SR;
    return (lp.run(saw(p)) * 0.6 + Math.sin(TAU * p) * 0.5) * Math.exp(-t / (dur * 0.8)) * Math.min(1, t / 0.005) * Math.min(1, (dur - t) / 0.02) * v;
  });
}
export const pick = (n, v = 1, seed = 1, decay = 1.2, bright = 0.5) => pluck(nf(n), decay + 0.3, { bright, decay, seed }).map((x) => x * v);
export const pizz = (n, v = 1, seed = 1) => pluck(nf(n), 0.5, { bright: 0.45, decay: 0.3, body: 0.5, seed }).map((x) => x * v);
export function bell(n, dur = 2, v = 1, ratio = 3.5, index = 2) {
  const f = nf(n);
  return render(dur, (t) => Math.sin(TAU * f * t + index * Math.exp(-t / 0.25) * Math.sin(TAU * f * ratio * t)) * Math.exp(-t / (dur * 0.35)) * Math.min(1, t / 0.002) * v);
}
// 「钢琴感」：FM 低指数 + 快衰减
export const keys = (n, dur = 1.6, v = 1) => bell(n, dur, v, 1, 0.9);
export function pad(notes, dur, v = 1, att = 0.6, rel = 0.8, cutoff = 1400) {
  const lps = notes.map(() => new Biquad('lp', cutoff, 0.7));
  const ph = notes.map(() => [0, 0.33, 0.7]);
  return render(dur, (t) => {
    let x = 0;
    notes.forEach((n, i) => {
      const f = nf(n);
      let s = 0;
      for (let k = 0; k < 3; k++) {
        ph[i][k] += (f * [1, 1.004, 0.996][k]) / SR;
        s += saw(ph[i][k]);
      }
      x += lps[i].run(s / 3);
    });
    return (x / notes.length) * Math.min(1, t / att) * Math.min(1, Math.max(0, (dur - t) / rel)) * v;
  });
}
export function tremolo(n, dur, v = 1) {
  const lp = new Biquad('lp', 900, 0.7);
  let p1 = 0;
  let p2 = 0.4;
  return render(dur, (t) => {
    p1 += (nf(n) * 0.997) / SR;
    p2 += (nf(n) * 1.003) / SR;
    return lp.run((saw(p1) + saw(p2)) / 2) * (0.55 + 0.45 * Math.sin(TAU * 13 * t)) * Math.min(1, t / 0.4) * Math.min(1, (dur - t) / 0.1) * v;
  });
}
export function beep(f = 1250, dur = 0.07, v = 1) {
  return render(dur, (t) => Math.sin(TAU * f * t) * Math.sin(Math.PI * clamp(t / dur)) * v);
}
export function ding(v = 1) {
  // 手机通知：两个音
  return render(0.5, (t) => {
    const f = t < 0.09 ? 1568 : 2093;
    return Math.sin(TAU * f * t) * Math.exp(-(t < 0.09 ? t : t - 0.09) / 0.12) * v;
  });
}
export function swish(dur, f0, f1, v = 1, seed = 3) {
  const r = noiseGen(seed);
  const bp = new Biquad('bp', f0, 1.4);
  return render(dur, (t) => {
    const u = t / dur;
    bp.set(f0 * Math.pow(f1 / f0, u), 1.4);
    return bp.run(r()) * Math.sin(Math.PI * u) ** 1.5 * v * 2.2;
  });
}
export function slide(dur, f0, f1, v = 1) {
  let ph = 0;
  return render(dur, (t) => {
    const u = t / dur;
    ph += (TAU * f0 * Math.pow(f1 / f0, u) * (1 + 0.02 * Math.sin(TAU * 7 * t))) / SR;
    return Math.sin(ph) * Math.sin(Math.PI * u) ** 0.6 * v;
  });
}
export function thud(v = 1, f0 = 110) {
  let ph = 0;
  const r = noiseGen(9);
  const lp = new Biquad('lp', 700, 0.7);
  return render(0.5, (t) => {
    ph += (TAU * (f0 * 0.4 + f0 * Math.exp(-t / 0.04))) / SR;
    return (Math.sin(ph) * Math.exp(-t / 0.12) + lp.run(r()) * Math.exp(-t / 0.03) * 0.5) * v;
  });
}
export function clang(v = 1) {
  const parts = [[523, 1], [1312, 0.6], [2093, 0.4], [3170, 0.3]];
  return render(1.2, (t) => {
    let x = 0;
    for (const [f, a] of parts) x += Math.sin(TAU * f * t) * a * Math.exp(-t / (0.45 / Math.sqrt(f / 523)));
    return x * 0.4 * Math.min(1, t / 0.001) * v;
  });
}
export function boing(v = 1) {
  let ph = 0;
  return render(0.45, (t) => {
    ph += (TAU * (160 + 120 * Math.sin(TAU * 13 * t) * Math.exp(-t / 0.15) + 220 * t)) / SR;
    return Math.sin(ph) * Math.exp(-t / 0.16) * v;
  });
}
export function shutter(v = 1) {
  const r = noiseGen(31);
  const hp = new Biquad('hp', 2500, 0.7);
  return render(0.18, (t) => hp.run(r()) * (Math.exp(-t / 0.012) + (t > 0.07 ? Math.exp(-(t - 0.07) / 0.02) * 0.7 : 0)) * v);
}
export function clink(v = 1) {
  return render(1.0, (t) => (Math.sin(TAU * 2637 * t) * 0.6 + Math.sin(TAU * 3951 * t) * 0.4 + Math.sin(TAU * 5274 * t) * 0.25) * Math.exp(-t / 0.25) * v);
}
export function crowd(dur, v = 1, seed = 41) {
  // 人群欢呼：几条带通噪声，音高往上扬
  const r = noiseGen(seed);
  const bps = [new Biquad('bp', 500, 3), new Biquad('bp', 900, 3), new Biquad('bp', 1400, 3)];
  return render(dur, (t) => {
    const u = t / dur;
    const x = r();
    let y = 0;
    bps.forEach((b, i) => {
      b.set((500 + i * 450) * (1 + 0.25 * Math.sin(u * Math.PI)), 3);
      y += b.run(x);
    });
    return y * Math.sin(Math.PI * clamp(u * 1.4)) * v * 1.5;
  });
}
export function applause(dur, v = 1, seed = 77) {
  const out = new Float32Array(Math.ceil(dur * SR));
  const r = noiseGen(seed);
  for (let i = 0; i < dur * 70; i++) {
    const c = clap(i + seed, 0.4 + 0.6 * Math.abs(r()));
    const at = Math.floor(Math.abs(r()) * (dur - 0.3) * SR);
    for (let k = 0; k < c.length && at + k < out.length; k++) out[at + k] += c[k];
  }
  for (let i = 0; i < out.length; i++) out[i] *= Math.min(1, i / (SR * 0.3)) * Math.min(1, (out.length - i) / (SR * 0.5)) * v;
  return out;
}
export function rustle(dur, v = 1) {
  const r = noiseGen(3);
  const hp = new Biquad('hp', 3000, 0.7);
  return render(dur, (t) => hp.run(r()) * (0.5 + 0.5 * Math.sin(TAU * 30 * t)) ** 3 * Math.min(1, (dur - t) / 0.3) * v);
}
export function wind(dur, v = 1) {
  const r = noiseGen(55);
  const lp = new Biquad('lp', 400, 0.6);
  return render(dur, (t) => lp.run(r()) * (0.6 + 0.4 * Math.sin(t * 0.8)) * Math.min(1, t / 0.5) * Math.min(1, (dur - t) / 0.5) * v);
}
export function levelUp(v = 1) {
  // 游戏通关：方波琶音往上
  const notes = ['C5', 'E5', 'G5', 'C6', 'E6'];
  const lp = new Biquad('lp', 5000, 0.7);
  let ph = 0;
  return render(0.75, (t) => {
    const i = Math.min(notes.length - 1, Math.floor(t / 0.07));
    ph += nf(notes[i]) / SR;
    const e = i === notes.length - 1 ? Math.exp(-(t - 0.28) / 0.2) : 1;
    return lp.run(sq(ph) * 0.4) * e * v;
  });
}
export function thump(v = 1) {
  let ph = 0;
  return render(0.25, (t) => {
    ph += (TAU * (42 + 38 * Math.exp(-t / 0.03))) / SR;
    return Math.sin(ph) * Math.exp(-t / 0.07) * Math.min(1, t / 0.004) * v;
  });
}

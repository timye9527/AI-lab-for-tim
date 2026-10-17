// 第三版动作测试的配乐：紧张段（颤音 + 心跳 + 稿纸抖动声 + 掌声）→ 松弛段（120 BPM 律动）+ 配音
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { SR, Bus, render, pluck, noteFreq as nf, Biquad, noiseGen, reverb, limit, toWav } from '../src/audio/synth.js';

const DUR = 9.0;
const CUT = 4.4;
const TAU = Math.PI * 2;
const saw = (p) => 2 * (p - Math.floor(p)) - 1;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

function thump(v = 1) {
  let ph = 0;
  return render(0.25, (t) => {
    ph += (TAU * (42 + 38 * Math.exp(-t / 0.03))) / SR;
    return Math.sin(ph) * Math.exp(-t / 0.07) * Math.min(1, t / 0.004) * v;
  });
}
function kick(v = 1) {
  let ph = 0;
  return render(0.4, (t) => {
    ph += (TAU * (45 + 110 * Math.exp(-t / 0.03))) / SR;
    return Math.sin(ph) * Math.exp(-t / 0.15) * v;
  });
}
function clap(seed, v = 1) {
  const r = noiseGen(seed);
  const bp = new Biquad('bp', 1600, 1.1);
  return render(0.25, (t) => {
    let e = Math.exp(-t / 0.07);
    for (const o of [0, 0.01, 0.02]) if (t >= o && t < o + 0.008) e = Math.max(e, 1 - (t - o) / 0.008);
    return bp.run(r()) * e * 1.6 * v;
  });
}
function tremolo(n, dur, v = 1) {
  const lp = new Biquad('lp', 900, 0.7);
  let p1 = 0;
  let p2 = 0.4;
  return render(dur, (t) => {
    p1 += (nf(n) * 0.997) / SR;
    p2 += (nf(n) * 1.003) / SR;
    const tr = 0.55 + 0.45 * Math.sin(TAU * 13 * t);
    return lp.run((saw(p1) + saw(p2)) / 2) * tr * Math.min(1, t / 0.4) * Math.min(1, (dur - t) / 0.05) * v;
  });
}
function rustle(dur, v = 1) {
  // 稿纸抖动：高频噪声，以 30Hz 断续
  const r = noiseGen(3);
  const hp = new Biquad('hp', 3000, 0.7);
  return render(dur, (t) => hp.run(r()) * (0.5 + 0.5 * Math.sin(TAU * 30 * t)) ** 3 * Math.min(1, (dur - t) / 0.3) * v);
}
function applause(dur, v = 1) {
  const out = new Float32Array(Math.ceil(dur * SR));
  const r = noiseGen(77);
  for (let i = 0; i < 90; i++) {
    const c = clap(i + 10, 0.4 + 0.6 * Math.abs(r()));
    const at = Math.floor(Math.abs(r()) * (dur - 0.3) * SR);
    for (let k = 0; k < c.length && at + k < out.length; k++) out[at + k] += c[k];
  }
  for (let i = 0; i < out.length; i++) out[i] *= Math.min(1, i / (SR * 0.3)) * Math.min(1, (out.length - i) / (SR * 0.4)) * v;
  return out;
}
function bass(n, dur, v = 1) {
  const lp = new Biquad('lp', 500, 0.9);
  let p = 0;
  return render(dur, (t) => {
    p += nf(n) / SR;
    return (lp.run(saw(p)) * 0.6 + Math.sin(TAU * p) * 0.5) * Math.exp(-t / (dur * 0.8)) * Math.min(1, t / 0.005) * v;
  });
}
function readVO(id) {
  const buf = readFileSync(new URL(`../assets/vo-v3/${id}.wav`, import.meta.url));
  let off = 12;
  let sr = 24000;
  let data;
  while (off < buf.length) {
    const tag = buf.toString('ascii', off, off + 4);
    const len = buf.readUInt32LE(off + 4);
    if (tag === 'fmt ') sr = buf.readUInt32LE(off + 12);
    if (tag === 'data') data = buf.subarray(off + 8, off + 8 + len);
    off += 8 + len + (len % 2);
  }
  const n = data.length / 2;
  const ratio = sr / SR;
  const out = new Float32Array(Math.floor(n / ratio));
  for (let i = 0; i < out.length; i++) {
    const x = i * ratio;
    const k = Math.floor(x);
    const f = x - k;
    const a = data.readInt16LE(Math.min(n - 1, k) * 2) / 32768;
    const b = data.readInt16LE(Math.min(n - 1, k + 1) * 2) / 32768;
    out[i] = a + (b - a) * f;
  }
  return out;
}

const music = new Bus(DUR);
const sfx = new Bus(DUR);
const vo = new Bus(DUR);
// 紧张段
music.add(tremolo('D3', CUT, 0.5), 0, 0.3, -0.3);
music.add(tremolo('G#3', CUT, 0.5), 0.1, 0.25, 0.3);
for (const h of [0.2, 0.9, 1.6, 2.2, 2.75, 3.25]) {
  sfx.add(thump(0.8), h, 0.9);
  sfx.add(thump(0.5), h + 0.17, 0.9);
}
sfx.add(rustle(3.6, 1), 0.1, 0.06, 0.2);
sfx.add(applause(1.2, 1), 3.3, 0.35, 0);
// 松弛段：120 BPM，C 大调
const B = 0.5;
for (let i = 0; i < 9; i++) {
  const t = CUT + i * B;
  music.add(kick(1), t, 0.8);
  if (i % 2 === 1) music.add(clap(i, 1), t, 0.35, 0.1);
  music.add(bass(['C2', 'C2', 'A1', 'A1', 'F1', 'F1', 'G1', 'G1', 'C2'][i], B * 0.9, 1), t, 0.45);
  const ch = [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4']][Math.floor(i / 2)];
  for (const [k, n] of ch.entries()) music.add(pluck(nf(n), 0.6, { bright: 0.6, decay: 0.6, seed: i * 3 + k }), t + B / 2 + k * 0.015, 0.25, k - 1);
}
// 配音
const VO = [['m1', 0.3], ['m2', 4.75]];
const spans = [];
for (const [id, at] of VO) {
  const x = readVO(id);
  vo.add(x, at, 1.2);
  spans.push([at, at + x.length / SR]);
}
const out = new Bus(DUR);
for (let i = 0; i < out.n; i++) {
  const t = i / SR;
  const duck = spans.some(([a, b]) => t > a - 0.05 && t < b + 0.1) ? 0.55 : 1;
  out.L[i] = music.L[i] * duck + sfx.L[i] + vo.L[i];
  out.R[i] = music.R[i] * duck + sfx.R[i] + vo.R[i];
}
const send = new Bus(DUR);
send.mix(music, 0.5);
out.mix(reverb(send, { room: 0.8 }), 0.25);
for (let i = 0; i < out.n; i++) {
  const g = clamp((DUR - i / SR) / 0.35) * clamp(i / SR / 0.1);
  out.L[i] *= g * 0.78;
  out.R[i] *= g * 0.78;
}
limit(out, 0.89);
mkdirSync(new URL('../dist/v3/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist/v3/motion.wav', import.meta.url), toWav(out));
console.log('dist/v3/motion.wav');

// 配乐、音效、配音混音：时间点全部来自 timeline.js
import { readFileSync } from 'node:fs';
import { DURATION, T, HEARTBEATS, VO } from '../timeline.js';
import { SR, Bus, render, pluck, noteFreq as nf, Biquad, noiseGen, reverb } from './synth.js';

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const saw = (p) => 2 * (p - Math.floor(p)) - 1;
const sq = (p) => (p - Math.floor(p) < 0.5 ? 1 : -1);

// ---------- 音色 ----------
// 拨弦（偷偷摸摸的拨奏）
const pizz = (n, vel = 1, seed = 1) => pluck(nf(n), 0.6, { bright: 0.45, decay: 0.35, body: 0.5, seed }).map((x) => x * vel);
// 心跳：低频闷响，音高下滑
function thump(vel = 1) {
  let ph = 0;
  return render(0.25, (t) => {
    const f = 42 + 38 * Math.exp(-t / 0.03);
    ph += (TAU * f) / SR;
    return Math.sin(ph) * Math.exp(-t / 0.07) * Math.min(1, t / 0.004) * vel;
  });
}
// 木鱼：眼珠乱转的「嗒嗒」
function block(f = 1100, vel = 1) {
  return render(0.08, (t) => (Math.sin(TAU * f * t) * 0.8 + Math.sin(TAU * f * 2.7 * t) * 0.25) * Math.exp(-t / 0.012) * vel);
}
// 嗖：带通噪声扫频
function swish(dur, f0, f1, vel = 1, seed = 3) {
  const r = noiseGen(seed);
  const bp = new Biquad('bp', f0, 1.4);
  return render(dur, (t) => {
    const u = t / dur;
    bp.set(f0 * Math.pow(f1 / f0, u), 1.4);
    return bp.run(r()) * Math.sin(Math.PI * u) ** 1.5 * vel * 2.2;
  });
}
// 咽口水：「咕嘟」
function gulp(vel = 1) {
  let ph = 0;
  const bp = new Biquad('bp', 700, 3);
  return render(0.22, (t) => {
    const f = t < 0.07 ? 260 + 4000 * t : 540 * Math.exp(-(t - 0.07) / 0.06) + 140;
    ph += (TAU * f) / SR;
    const e = Math.sin(Math.PI * clamp(t / 0.22)) ** 0.8;
    const x = Math.sin(ph) * 0.7 + saw(ph / TAU) * 0.3;
    return (bp.run(x) * 2 + x * 0.3) * e * vel;
  });
}
// 低音大鼓 / 冲击
function boom(vel = 1, f0 = 120, f1 = 34, dec = 0.6) {
  let ph = 0;
  const r = noiseGen(17);
  const lp = new Biquad('lp', 900, 0.7);
  return render(dec * 2.5, (t) => {
    const f = f1 + (f0 - f1) * Math.exp(-t / 0.05);
    ph += (TAU * f) / SR;
    const n = lp.run(r()) * Math.exp(-t / 0.08) * 0.6;
    return (Math.sin(ph) * Math.exp(-t / dec) + n) * Math.min(1, t / 0.002) * vel;
  });
}
// 管弦齐奏的「当！」：几层锯齿波和弦，快起慢收
function stab(notes, vel = 1, dur = 1.2) {
  const lps = notes.map(() => new Biquad('lp', 3000, 0.8));
  const ph = notes.map(() => [0, 0.3, 0.6]);
  return render(dur, (t) => {
    let x = 0;
    notes.forEach((n, i) => {
      const f = nf(n);
      let s = 0;
      for (let k = 0; k < 3; k++) {
        ph[i][k] += (f * (1 + (k - 1) * 0.004)) / SR;
        s += saw(ph[i][k]);
      }
      lps[i].set(600 + 3000 * Math.exp(-t / 0.15), 0.8);
      x += lps[i].run(s / 3);
    });
    return (x / notes.length) * Math.exp(-t / (dur * 0.35)) * Math.min(1, t / 0.006) * vel;
  });
}
// 警笛：锯齿波在两个音高之间来回滑
function siren(dur, vel = 1) {
  let ph = 0;
  const bp = new Biquad('bp', 1000, 0.9);
  return render(dur, (t) => {
    const f = 760 + 380 * Math.sin(TAU * t * 1.25 - Math.PI / 2);
    ph += f / SR;
    bp.set(f * 1.4, 0.9);
    const e = Math.min(1, t / 0.05) * Math.min(1, (dur - t) / 0.04);
    return (bp.run(saw(ph)) * 1.6 + Math.sin(TAU * ph) * 0.3) * e * vel;
  });
}
// 滑哨（跳起来）
function slideWhistle(dur, f0, f1, vel = 1) {
  let ph = 0;
  return render(dur, (t) => {
    const u = t / dur;
    const f = f0 * Math.pow(f1 / f0, u) * (1 + 0.02 * Math.sin(TAU * 7 * t));
    ph += (TAU * f) / SR;
    return Math.sin(ph) * Math.sin(Math.PI * u) ** 0.6 * vel;
  });
}
// 金属牌砸下来：非谐波泛音
function clang(vel = 1) {
  const parts = [[180, 1], [492, 0.6], [831, 0.45], [1270, 0.35], [1810, 0.25]];
  return render(1.4, (t) => {
    let x = 0;
    for (const [f, a] of parts) x += Math.sin(TAU * f * t + 2 * Math.sin(TAU * f * 1.41 * t) * Math.exp(-t / 0.1)) * a * Math.exp(-t / (0.5 / Math.sqrt(f / 180)));
    return x * 0.4 * Math.min(1, t / 0.001) * vel;
  });
}
// 定音鼓式的低音鼓点
function tom(f = 90, vel = 1) {
  let ph = 0;
  return render(0.5, (t) => {
    ph += (TAU * f * (1 + 0.6 * Math.exp(-t / 0.03))) / SR;
    return Math.sin(ph) * Math.exp(-t / 0.18) * vel;
  });
}
// 唱片刮擦
function scratch(vel = 1) {
  const r = noiseGen(23);
  const bp = new Biquad('bp', 1500, 2);
  return render(0.22, (t) => {
    const u = t / 0.22;
    bp.set(2600 * Math.pow(0.15, u), 2);
    return bp.run(r()) * Math.sin(Math.PI * u) * vel * 3;
  });
}
// 蟋蟀：三连短鸣
function cricket(vel = 1) {
  return render(0.12, (t) => {
    const k = Math.floor(t / 0.032);
    const lt = t - k * 0.032;
    return k < 3 ? Math.sin(TAU * 4600 * t) * Math.sin(Math.PI * clamp(lt / 0.018)) * vel : 0;
  });
}
// 乌鸦「嘎——」：粗糙的锯齿波 + 两个共振峰，音高下滑
function caw(dur = 0.42, vel = 1, seed = 5) {
  let ph = 0;
  const r = noiseGen(seed);
  const f1 = new Biquad('bp', 1150, 4);
  const f2 = new Biquad('bp', 2400, 5);
  const hp = new Biquad('hp', 400, 0.7);
  return render(dur, (t) => {
    const u = t / dur;
    const f = 520 - 110 * u + 25 * Math.sin(TAU * 30 * t);
    ph += f / SR;
    const rough = 1 + 0.5 * r();
    const src = saw(ph) * rough;
    const e = Math.min(1, t / 0.02) * Math.pow(1 - u, 0.6);
    return hp.run(f1.run(src) * 1.4 + f2.run(src) * 0.9) * e * vel * 2.2;
  });
}
// 脚步：短促的闷响
function step(vel = 1, seed = 1) {
  const r = noiseGen(seed);
  const lp = new Biquad('lp', 1400, 0.7);
  return render(0.09, (t) => (lp.run(r()) * 0.8 + Math.sin(TAU * 110 * t) * 0.5) * Math.exp(-t / 0.018) * vel);
}
// 弹簧「嘣」：起跑前的蓄力
function boing(vel = 1) {
  let ph = 0;
  return render(0.4, (t) => {
    const f = 180 + 120 * Math.sin(TAU * 14 * t) * Math.exp(-t / 0.15) + 200 * t;
    ph += (TAU * f) / SR;
    return Math.sin(ph) * Math.exp(-t / 0.15) * vel;
  });
}
// 8-bit 失败音效：方波下行
function failJingle(vel = 1) {
  const notes = [['G4', 0.11], ['F#4', 0.11], ['F4', 0.11], ['E4', 0.42]];
  let total = 0;
  for (const [, d] of notes) total += d;
  const lp = new Biquad('lp', 3500, 0.7);
  let ph = 0;
  return render(total + 0.05, (t) => {
    let acc = 0;
    let idx = 0;
    while (idx < notes.length - 1 && t > acc + notes[idx][1]) acc += notes[idx++][1];
    const [n, d] = notes[idx];
    const lt = t - acc;
    const vib = idx === notes.length - 1 ? 1 + 0.03 * Math.sin(TAU * 6 * lt) * clamp(lt / 0.1) : 1;
    ph += (nf(n) * vib) / SR;
    const e = Math.min(1, lt / 0.004) * (idx === notes.length - 1 ? Math.max(0, 1 - lt / d) : lt < d - 0.015 ? 1 : 0.2);
    return lp.run(sq(ph) * 0.5) * e * vel;
  });
}
// 颤音弦乐铺底（紧张感）
function tremolo(n, dur, vel = 1, rise = true) {
  const lp = new Biquad('lp', 900, 0.7);
  const ph = [0, 0.4];
  return render(dur, (t) => {
    let x = 0;
    for (let k = 0; k < 2; k++) {
      ph[k] += (nf(n) * (1 + (k ? 0.005 : -0.005))) / SR;
      x += saw(ph[k]);
    }
    const trem = 0.55 + 0.45 * Math.sin(TAU * 13 * t);
    const a = rise ? Math.pow(t / dur, 1.6) : 1;
    lp.set(500 + 1400 * (rise ? t / dur : 0.5), 0.7);
    return lp.run(x / 2) * trem * a * Math.min(1, (dur - t) / 0.03) * vel;
  });
}
// 渐强噪声（冲向警报）
function riser(dur, vel = 1) {
  const r = noiseGen(31);
  const bp = new Biquad('bp', 300, 1.2);
  return render(dur, (t) => {
    const u = t / dur;
    bp.set(300 * Math.pow(12, u), 1.2);
    return bp.run(r()) * Math.pow(u, 2.2) * vel * 2;
  });
}
// 夜晚环境声：风 + 远处车流
function ambience(dur, seed = 41) {
  const r = noiseGen(seed);
  const lp = new Biquad('lp', 260, 0.6);
  const bp = new Biquad('bp', 140, 0.8);
  return render(dur, (t) => {
    const x = r();
    const wind = lp.run(x) * (0.7 + 0.3 * Math.sin(t * 0.7));
    const traffic = bp.run(x) * 0.5 * (0.8 + 0.2 * Math.sin(t * 0.31 + 1));
    return (wind + traffic) * 0.9;
  });
}

// 读 16-bit 单声道 WAV，重采样到 48k
function readVO(id) {
  const buf = readFileSync(new URL(`../../assets/vo/${id}.wav`, import.meta.url));
  let off = 12;
  let sr = 24000;
  let data = null;
  while (off < buf.length) {
    const tag = buf.toString('ascii', off, off + 4);
    const len = buf.readUInt32LE(off + 4);
    if (tag === 'fmt ') sr = buf.readUInt32LE(off + 12);
    if (tag === 'data') data = buf.subarray(off + 8, off + 8 + len);
    off += 8 + len + (len % 2);
  }
  const n = data.length / 2;
  const src = new Float32Array(n);
  for (let i = 0; i < n; i++) src[i] = data.readInt16LE(i * 2) / 32768;
  const ratio = sr / SR;
  const out = new Float32Array(Math.floor(n / ratio));
  for (let i = 0; i < out.length; i++) {
    const x = i * ratio;
    const k = Math.floor(x);
    const f = x - k;
    // 三次插值
    const p0 = src[Math.max(0, k - 1)];
    const p1 = src[k];
    const p2 = src[Math.min(n - 1, k + 1)];
    const p3 = src[Math.min(n - 1, k + 2)];
    out[i] = p1 + 0.5 * f * (p2 - p0 + f * (2 * p0 - 5 * p1 + 4 * p2 - p3 + f * (3 * (p1 - p2) + p3 - p0)));
  }
  // 人声：切低频、轻压缩
  const hp = new Biquad('hp', 90, 0.7);
  let envl = 0;
  for (let i = 0; i < out.length; i++) {
    let x = hp.run(out[i]);
    envl = Math.max(Math.abs(x), envl * 0.9995);
    const g = envl > 0.3 ? Math.pow(0.3 / envl, 0.5) : 1;
    out[i] = x * g;
  }
  return out;
}

// 磁带停转：把一段音频在 [t0, t1] 内逐渐减速到停
function tapeStop(bus, t0, t1) {
  const i0 = Math.round(t0 * SR);
  const i1 = Math.round(t1 * SR);
  for (const ch of [bus.L, bus.R]) {
    const src = ch.slice(i0, i0 + (i1 - i0) * 2);
    let pos = 0;
    for (let i = i0; i < bus.n; i++) {
      const u = (i - i0) / (i1 - i0);
      if (u >= 1) {
        ch[i] = 0;
        continue;
      }
      const k = Math.floor(pos);
      ch[i] = (src[k] || 0) * (1 - u * 0.3);
      pos += 1 - u;
    }
  }
}

// ---------- 编排 ----------
export function buildScore() {
  const music = new Bus(DURATION);
  const sfx = new Bus(DURATION);
  const alarm = new Bus(DURATION);
  const vo = new Bus(DURATION);

  // 环境声：警报和「现实」开头那一下静默时拿掉
  const amb = ambience(DURATION);
  for (let i = 0; i < amb.length; i++) {
    const t = i / SR;
    let g = 0.05;
    if (t > T.alarm - 0.08 && t < T.quiet + 0.25) g = 0;
    if (t >= T.quiet + 0.25 && t < 8.3) g = 0.035 * clamp((t - T.quiet - 0.25) / 0.3);
    amb[i] *= g;
  }
  sfx.add(amb, 0, 1, 0);

  // 密码锁的电流嗡嗡声（特写镜头）
  sfx.add(render(1.8, (t) => (Math.sin(TAU * 100 * t) * 0.5 + Math.sin(TAU * 7400 * t) * 0.08) * Math.min(1, t / 0.2) * Math.min(1, (1.8 - t) / 0.1) * 0.03), 0, 1, 0.1);

  // 偷偷摸摸的拨奏：112 BPM，D 小调，到 3.9 秒变稀
  const B = 60 / 112;
  const t0 = 0.25;
  const bass = ['D2', 'A1', 'D2', 'A1', 'D2', 'G#1', 'A1', 'C#2'];
  bass.forEach((n, i) => {
    const t = t0 + i * B;
    if (t < 3.65) music.add(pizz(n, 0.9, i + 1), t, 0.9, -0.15);
  });
  const hi = [['F4', 1.5], ['E4', 3.5], ['D4', 5.5], ['C#4', 6.5]];
  hi.forEach(([n, b], i) => music.add(pizz(n, 0.7, 20 + i), t0 + b * B, 0.55, 0.35));
  // 紧张铺底：三全音颤音，越来越响
  music.add(tremolo('D3', T.alarm - 1.85, 0.5), 1.75, 0.35, -0.3);
  music.add(tremolo('G#3', T.alarm - 2.05, 0.5), 1.95, 0.3, 0.3);
  music.add(riser(1.15, 0.6), T.alarm - 1.3, 0.5, 0);

  // 心跳：越来越响
  HEARTBEATS.forEach((h, i) => {
    const v = 0.55 + 0.45 * (i / (HEARTBEATS.length - 1));
    sfx.add(thump(v), h, 1.0, 0);
    sfx.add(thump(v * 0.6), h + 0.17, 1.0, 0);
  });
  // 左顾右盼：嗖嗖
  for (const t of [T.look1, T.look1 + 0.38, T.look2, T.look2 + 0.25]) sfx.add(swish(0.14, 900, 3000, 0.5, Math.round(t * 10)), t - 0.03, 0.5, 0.3);
  // 眼珠乱转：木鱼嗒嗒
  for (let t = 3.75; t < T.gulp; t += 0.2) sfx.add(block(t % 0.4 < 0.2 ? 1150 : 950, 0.6), t, 0.4, (t * 10) % 2 ? -0.4 : 0.4);
  sfx.add(gulp(0.9), T.gulp, 0.6, 0);

  // ---- 警报幻想（单独一条总线，最后磁带停转） ----
  alarm.add(boom(1, 140, 32, 0.7), T.alarm, 0.95, 0);
  alarm.add(stab(['D3', 'A3', 'D4', 'F4', 'G#4'], 1, 1.4), T.alarm, 0.55, 0);
  const sr = siren(T.brake - T.alarm - 0.02, 1);
  alarm.add(sr, T.alarm + 0.02, 0.32, -0.35);
  alarm.add(siren(T.brake - T.alarm - 0.3, 1).map((x, i, a) => a[Math.min(a.length - 1, i + 2400)]), T.alarm + 0.3, 0.22, 0.35);
  alarm.add(slideWhistle(0.24, 500, 1900, 1), T.scream, 0.35, 0);
  const impact = T.sign + 0.24;
  alarm.add(swish(0.25, 300, 1400, 0.8, 9), T.sign, 0.6, 0);
  alarm.add(clang(1), impact, 0.55, 0);
  alarm.add(boom(1, 90, 30, 0.5), impact, 0.85, 0);
  // 鼓点：每拍一下，越来越密
  for (let t = T.alarm + 0.43, k = 0; t < T.brake - 0.05; t += 0.215, k++) alarm.add(tom(k % 4 === 0 ? 70 : 95, k % 2 ? 0.55 : 0.85), t, 0.5, k % 2 ? 0.2 : -0.2);
  alarm.add(stab(['D3', 'A3', 'D4', 'F4'], 0.8, 0.8), impact, 0.4, 0);
  tapeStop(alarm, T.brake - 0.12, T.quiet);
  sfx.add(scratch(0.8), T.brake - 0.06, 0.4, 0);

  // ---- 现实：蟋蟀、乌鸦 ----
  for (let t = T.quiet + 0.2; t < 8.3; t += 0.42) sfx.add(cricket(0.5), t, 0.12, 0.6);
  sfx.add(caw(0.42, 1, 5), T.crow1, 0.5, 0.45);

  // ---- 开溜 ----
  sfx.add(swish(0.12, 1200, 3200, 0.6, 12), T.retract, 0.35, 0.2);
  sfx.add(swish(0.14, 700, 2600, 0.6, 13), T.turn, 0.45, 0.25);
  // 走路：每一步配一个下行的拨奏音
  const sneak = ['D4', 'C4', 'A#3', 'A3'];
  let k = 0;
  for (let t = T.walk + 0.06; t < T.dash; t += 1 / (2 * 2.1), k++) {
    sfx.add(step(0.6, k + 3), t, 0.35, 0.3 + k * 0.05);
    music.add(pizz(sneak[k % 4], 0.8, 40 + k), t, 0.6, 0.2);
  }
  music.add(pizz('D2', 0.9, 60), T.walk + 0.06, 0.8, 0);
  sfx.add(boing(0.8), T.dash, 0.4, 0.4);
  sfx.add(swish(0.45, 400, 3000, 1, 14), T.dash + 0.12, 0.8, 0.6);
  for (let t = T.dash + 0.12; t < T.exit; t += 0.045) sfx.add(step(0.5, Math.round(t * 100)), t, 0.3, 0.6 + (t - T.dash) * 0.8);
  sfx.add(caw(0.36, 0.9, 8), T.crow2, 0.45, 0.6);
  // 印章 + 失败音效
  sfx.add(boom(0.8, 160, 60, 0.12), T.stamp + 0.12, 0.6, 0);
  sfx.add(failJingle(1), T.stamp + 0.14, 0.18, 0);

  // ---- 配音 ----
  const voTimes = [];
  for (const v of VO) {
    const x = readVO(v.id);
    vo.add(x, v.start, 1.25, 0);
    voTimes.push([v.start, v.start + x.length / SR]);
  }

  // 配音出现时音乐和音效让位（-6dB 左右，平滑过渡）
  const duck = new Float32Array(music.n);
  let g = 1;
  for (let i = 0; i < music.n; i++) {
    const t = i / SR;
    const on = voTimes.some(([a, b]) => t > a - 0.08 && t < b + 0.1);
    const target = on ? 0.5 : 1;
    g += (target - g) * (on ? 0.0008 : 0.0002);
    duck[i] = g;
  }
  const out = new Bus(DURATION);
  for (let i = 0; i < out.n; i++) {
    out.L[i] = music.L[i] * duck[i] + sfx.L[i] * (0.4 + 0.6 * duck[i]) + alarm.L[i] * 0.6 * (0.55 + 0.45 * duck[i]) + vo.L[i];
    out.R[i] = music.R[i] * duck[i] + sfx.R[i] * (0.4 + 0.6 * duck[i]) + alarm.R[i] * 0.6 * (0.55 + 0.45 * duck[i]) + vo.R[i];
  }
  // 混响：音乐和警报多一点，配音少一点
  const send = new Bus(DURATION);
  send.mix(music, 0.5);
  send.mix(alarm, 0.4);
  send.mix(vo, 0.06);
  out.mix(reverb(send, { room: 0.8, damp: 0.35 }), 0.28);
  return out;
}

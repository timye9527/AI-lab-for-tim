// 完整版配乐 + 音效 + 配音：dist/full/audio.wav
// 第一幕沿用样片的配乐（buildScore + timeline4，不含配音），第二至七幕在这里编排；配音统一加，音乐自动让位
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { SR, Bus, reverb, limit, toWav, Biquad } from '../src/audio/synth.js';
import { buildScore } from '../src/audio/score.js';
import * as A1 from '../src/v4/timeline4.js';
import { ACTS, DURATION, VO_ALL, VODIR, ACT2, ACT3, ACT4, ACTT, ACT5, ACT6, ACT7 } from '../src/v5/timeline5.js';
import * as k from '../src/audio/kit.js';

const at = (id) => ACTS.find((a) => a.id === id).start;
const music = new Bus(DURATION);
const sfx = new Bus(DURATION);

// ---------- 第一幕：样片配乐（不含配音） ----------
const a1 = buildScore({ ...A1, VO: [] });
for (let i = 0; i < a1.n && i < sfx.n; i++) {
  sfx.L[i] += a1.L[i];
  sfx.R[i] += a1.R[i];
}

// ---------- 第二幕：踮脚潜行 → 门开暖光 → 当场入会 ----------
{
  const t0 = at('a2');
  const B = ACT2.beats;
  const beat = 60 / 132;
  const line = ['D3', 'F3', 'A3', 'F3', 'D3', 'E3', 'G3', 'E3'];
  for (let i = 0; i * beat < B.open - 0.1; i++) music.add(k.pizz(line[i % 8], 0.9, i + 3), t0 + 0.2 + i * beat, 0.5, (i % 2 ? 0.3 : -0.3));
  for (let i = 0; i < 4; i++) sfx.add(k.beep(1250, 0.07, 1), t0 + B.typeAt + 0.1 + i * 0.16, 0.18, -0.2);
  sfx.add(k.thud(0.6, 160), t0 + B.open - 0.15, 0.4);
  sfx.add(k.swish(0.5, 300, 2400, 1, 5), t0 + B.open - 0.1, 0.5);
  music.add(k.pad(['C3', 'G3', 'C4', 'E4'], 4.6, 1, 0.3, 1.2), t0 + B.open, 0.35);
  sfx.add(k.applause(2.4, 1, 21), t0 + B.open + 0.1, 0.32);
  sfx.add(k.crowd(1.6, 1, 22), t0 + B.open + 0.05, 0.18);
  sfx.add(k.levelUp(1), t0 + B.levelUp, 0.22);
  for (const [n, d] of [['C6', 0], ['G6', 0.08], ['E6', 0.16]]) sfx.add(k.bell(n, 1.2, 1), t0 + B.levelUp + 0.3 + d, 0.08, 0.3);
  const ch = [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4']];
  for (let i = 0; i < 6; i++) ch[i % 4].forEach((n, j) => music.add(k.pick(n, 0.8, i * 5 + j, 1.0, 0.6), t0 + B.open + 0.6 + i * 0.6 + j * 0.02, 0.22, j - 1));
}

// ---------- 第三幕：发抖 → 掌声 → 温暖的钢琴 ----------
{
  const t0 = at('a3');
  const B = ACT3.beats;
  music.add(k.tremolo('D3', B.clap + 0.3, 0.5), t0, 0.18, -0.3);
  for (const h of [0.2, 0.9, 1.6, 2.3, 2.9, 3.5]) sfx.add(k.thump(0.7), t0 + h, 0.7);
  sfx.add(k.rustle(B.clap - 0.2, 1), t0 + 0.1, 0.05, 0.2);
  sfx.add(k.swish(0.15, 2000, 3000, 0.5, 8), t0 + 1.6, 0.25, -0.4);
  sfx.add(k.applause(3.5, 1, 31), t0 + B.clap, 0.3);
  const prog = [['F3', 'A3', 'C4', 'F4'], ['C3', 'G3', 'C4', 'E4'], ['G2', 'D3', 'G3', 'B3'], ['A2', 'E3', 'A3', 'C4']];
  const b = 60 / 92;
  for (let i = 0; i * b < ACT3.dur - B.clap; i++) {
    const c = prog[Math.floor(i / 2) % 4];
    const tt = t0 + B.clap + 0.3 + i * b;
    music.add(k.keys(c[0], 1.6, 1), tt, 0.25, -0.2);
    music.add(k.keys(c[(i % 3) + 1], 1.2, 1), tt + b / 2, 0.18, 0.2);
  }
  for (let n = 0; n < 4; n++) {
    sfx.add(k.boing(0.5), t0 + B.everyone + n * 0.3, 0.12, n % 2 ? 0.4 : -0.4);
    sfx.add(k.rustle(0.6, 1), t0 + B.everyone + n * 0.3, 0.04, n % 2 ? 0.4 : -0.4);
  }
  for (const s of [B.second, B.third]) {
    sfx.add(k.swish(0.3, 500, 3000, 0.9, 12), t0 + s - 0.12, 0.35);
    sfx.add(k.bell('A5', 0.8, 1), t0 + s + 0.05, 0.1);
  }
}

// ---------- 第四幕：变灰、安静 → 群消息 → 巨手 ----------
{
  const t0 = at('a4');
  const B = ACT4.beats;
  sfx.add(k.wind(B.hand + 0.4, 1), t0, 0.16);
  for (const [n, d] of [['A2', 0.2], ['E3', 1.6], ['C3', 3.0], ['A2', 4.4], ['G2', 5.8]]) music.add(k.keys(n, 2.4, 1), t0 + d, 0.28);
  sfx.add(k.thud(0.6, 90), t0 + 0.45, 0.35);
  for (const d of [0.15, 0.55, 0.95]) sfx.add(k.ding(1), t0 + B.phone + d, 0.22, 0.3);
  sfx.add(k.boing(0.6), t0 + B.phone + 1.6, 0.18);
  sfx.add(k.swish(0.3, 300, 1500, 1, 14), t0 + B.hand - 0.25, 0.5);
  sfx.add(k.slide(0.5, 400, 1800, 1), t0 + B.hand, 0.3);
  sfx.add(k.swish(0.4, 600, 4000, 1, 15), t0 + B.hand + 0.05, 0.5, 0.4);
}

// ---------- 新增：周四（轻快的拨弦律动；翻日历、笑声、嗦粉、滋滋声、电量充满） ----------
{
  const t0 = at('at');
  const B = ACTT.beats;
  const beat = 60 / 104;
  const ch = [['G3', 'B3', 'D4'], ['E3', 'G3', 'B3'], ['C3', 'E3', 'G3'], ['D3', 'F#3', 'A3']];
  for (let i = 0; i * beat < B.energy; i++) {
    const tt = t0 + i * beat;
    music.add(k.kick(0.7), tt, 0.4);
    music.add(k.shaker(i, 1), tt + beat / 2, 0.08, 0.3);
    ch[Math.floor(i / 2) % 4].forEach((n, j) => music.add(k.pick(n, 0.7, i * 3 + j + 200, 0.6, 0.6), tt + beat / 2 + j * 0.02, 0.2, j - 1));
    music.add(k.bass(['G1', 'G1', 'E1', 'E1', 'C2', 'C2', 'D2', 'D2'][i % 8], beat * 0.9, 1), tt, 0.32);
  }
  for (const d of [0, 0.45, 0.9]) sfx.add(k.swish(0.18, 2500, 6000, 0.7, 210 + d * 10), t0 + d + 0.3, 0.25);
  sfx.add(k.crowd(1.0, 1, 211), t0 + B.meet + 0.2, 0.2);
  sfx.add(k.swish(0.5, 400, 160, 0.9, 212), t0 + B.fen + 0.2, 0.35);
  sfx.add(k.rustle(0.9, 1), t0 + B.pot, 0.05);
  sfx.add(k.rustle(0.9, 1), t0 + B.bbq, 0.07);
  sfx.add(k.crowd(1.8, 1, 213), t0 + B.tease + 0.1, 0.22);
  sfx.add(k.bell('E6', 0.8, 1), t0 + B.learn + 0.5, 0.1);
  // 能量场：电量往上冲 + 通关音 + 节奏加满
  sfx.add(k.slide(1.6, 300, 1500, 1), t0 + B.energy + 0.3, 0.18);
  sfx.add(k.levelUp(1), t0 + B.energy + 1.9, 0.22);
  for (let i = 0; i * 0.5 < ACTT.dur - B.energy; i++) {
    const tt = t0 + B.energy + i * 0.5;
    music.add(k.kick(1), tt, 0.6);
    if (i % 2) music.add(k.clap(i + 300, 1), tt, 0.3);
    music.add(k.hat(i + 300, 1), tt + 0.25, 0.12);
  }
  music.add(k.pad(['G3', 'D4', 'G4', 'B4'], ACTT.dur - B.energy, 1, 0.3, 0.5, 2200), t0 + B.energy, 0.3);
}

// ---------- 第五幕：120 BPM 律动；皇冠、蒙太奇、唱跳 ----------
{
  const t0 = at('a5');
  const B = ACT5.beats;
  const beat = 0.5;
  const bassLine = ['C2', 'C2', 'A1', 'A1', 'F1', 'F1', 'G1', 'G1'];
  const ch = [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']];
  for (let i = 0; i * beat < ACT5.dur - 0.1; i++) {
    const tt = t0 + i * beat;
    const full = tt > t0 + B.montage;
    music.add(k.kick(1), tt, 0.65);
    if (i % 2 === 1) music.add(k.clap(i, 1), tt, 0.3, 0.1);
    music.add(k.bass(bassLine[i % 8], beat * 0.9, 1), tt, 0.4);
    if (full) {
      music.add(k.hat(i, 1), tt + beat / 2, 0.12, 0.4);
      music.add(k.shaker(i, 1), tt + beat / 4, 0.08, -0.4);
    }
    ch[Math.floor(i / 2) % 4].forEach((n, j) => music.add(k.pick(n, 0.7, i * 3 + j, 0.5, 0.6), tt + beat / 2 + j * 0.015, 0.2, j - 1));
  }
  sfx.add(k.slide(0.35, 1800, 400, 1), t0 + B.crown, 0.25);
  sfx.add(k.clang(1), t0 + B.crown + 0.35, 0.35);
  sfx.add(k.thud(1, 120), t0 + B.crown + 0.35, 0.5);
  sfx.add(k.boing(0.8), t0 + B.crown + 0.4, 0.25);
  const span = (B.dance - B.montage) / 6;
  for (let i = 0; i < 6; i++) sfx.add(k.swish(0.18, 800, 3500, 0.8, 30 + i), t0 + B.montage + i * span - 0.05, 0.3, i % 2 ? 0.3 : -0.3);
  sfx.add(k.applause(2.5, 1, 51), t0 + B.dance + 0.5, 0.18);
}

// ---------- 第六幕：忙前忙后 → 舞台 → 让出中央 → 举杯 ----------
{
  const t0 = at('a6');
  const B = ACT6.beats;
  for (let i = 0; i * 0.125 < B.aside; i++) music.add(k.shaker(i, 1), t0 + i * 0.125, 0.1, i % 2 ? 0.3 : -0.3);
  for (let i = 0; i * 0.5 < B.aside; i++) {
    music.add(k.kick(0.8), t0 + i * 0.5, 0.45);
    music.add(k.bass(['D2', 'D2', 'B1', 'B1', 'G1', 'G1', 'A1', 'A1'][i % 8], 0.45, 1), t0 + i * 0.5, 0.35);
  }
  // 魔术：一声「噗」+ 闪光
  sfx.add(k.swish(0.35, 300, 3000, 1, 61), t0 + B.magic, 0.4);
  ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => sfx.add(k.bell(n, 0.8, 1), t0 + B.magic + 0.1 + i * 0.05, 0.08));
  sfx.add(k.crowd(0.8, 1, 62), t0 + B.magic + 0.3, 0.18);
  // 脱口秀：笑声 + 「咚哒嚓」
  sfx.add(k.crowd(1.0, 1, 63), t0 + B.standup + 0.1, 0.3);
  sfx.add(k.thud(0.8, 140), t0 + B.standup + 0.6, 0.3);
  sfx.add(k.thud(0.8, 110), t0 + B.standup + 0.72, 0.3);
  sfx.add(k.hat(64, 1, 0.12), t0 + B.standup + 0.84, 0.3);
  // 演讲：掌声
  sfx.add(k.applause(1.0, 1, 65), t0 + B.speech + 0.2, 0.25);
  // 抽奖：鼓点滚奏 → 叮 → 欢呼
  for (let i = 0; i < 14; i++) sfx.add(k.hat(70 + i, 1, 0.02), t0 + B.lottery + i * 0.032, 0.2 + i * 0.01);
  sfx.add(k.ding(1), t0 + B.lottery + 0.45, 0.3);
  sfx.add(k.crowd(1.2, 1, 66), t0 + B.lottery + 0.5, 0.3);
  // 让出中央：长和弦 + 掌声
  music.add(k.pad(['D3', 'A3', 'D4', 'F#4'], 2.5, 1, 0.2, 1.2, 2000), t0 + B.aside, 0.3);
  sfx.add(k.applause(2.4, 1, 67), t0 + B.aside + 0.1, 0.26);
  // 温暖的吉他分解：D - Bm - G - A
  const prog = [['D3', 'A3', 'D4', 'F#4', 'A4'], ['B2', 'F#3', 'B3', 'D4', 'F#4'], ['G2', 'D3', 'G3', 'B3', 'D4'], ['A2', 'E3', 'A3', 'C#4', 'E4']];
  const pat = [0, 2, 3, 4, 3, 2, 1, 3];
  const e8 = 60 / 84 / 2;
  for (let i = 0; i * e8 < ACT6.dur - B.aside + 2.0; i++) {
    const c = prog[Math.floor(i / 8) % 4];
    music.add(k.pick(c[pat[i % 8]], i % 8 === 0 ? 0.9 : 0.6, i + 7, 1.6, 0.45), t0 + B.aside + i * e8 + (i % 2 ? 0.02 : 0), 0.28, (pat[i % 8] - 2) * 0.2);
  }
  music.add(k.pad(['D3', 'A3', 'D4'], ACT6.dur - B.dinner + 2, 1, 1.5, 1.5, 1200), t0 + B.dinner, 0.22);
  sfx.add(k.clink(1), t0 + B.dinner + 0.62, 0.3, 0.1);
  sfx.add(k.clink(0.8), t0 + B.dinner + 0.7, 0.22, -0.2);
}

// ---------- 第七幕：同一扇门，大调的开门动机 → 合照 → 片尾 ----------
{
  const t0 = at('a7');
  const B = ACT7.beats;
  const motif = ['D5', 'F#5', 'A5', 'F#5', 'E5', 'D5'];
  motif.forEach((n, i) => music.add(k.keys(n, 1.8, 1), t0 + 0.3 + i * 0.5, 0.22, 0.1));
  music.add(k.pad(['D3', 'A3', 'F#4'], B.open + 0.5, 1, 1.0, 0.5, 1000), t0, 0.18);
  for (let i = 0; i < 4; i++) sfx.add(k.beep(1250 * Math.pow(2, i / 12 * 4), 0.07, 1), t0 + B.type + 0.15 + i * 0.16, 0.18, -0.2);
  sfx.add(k.beep(1870, 0.18, 1), t0 + B.type + 0.9, 0.16, -0.2);
  sfx.add(k.thud(0.6, 160), t0 + B.open - 0.12, 0.35);
  sfx.add(k.swish(0.6, 300, 2400, 1, 71), t0 + B.open - 0.1, 0.5);
  music.add(k.pad(['D3', 'A3', 'D4', 'F#4', 'A4'], B.end - B.open + 0.6, 1, 0.2, 0.8, 2200), t0 + B.open, 0.32);
  sfx.add(k.applause(3, 1, 72), t0 + B.open + 0.1, 0.3);
  sfx.add(k.crowd(1.5, 1, 73), t0 + B.walkIn - 0.6, 0.2);
  const prog = [['D3', 'A3', 'D4', 'F#4', 'A4'], ['G2', 'D3', 'G3', 'B3', 'D4'], ['B2', 'F#3', 'B3', 'D4', 'F#4'], ['A2', 'E3', 'A3', 'C#4', 'E4']];
  const e8 = 60 / 84 / 2;
  for (let i = 0; i * e8 < B.end - B.open; i++) {
    const c = prog[Math.floor(i / 8) % 4];
    music.add(k.pick(c[[0, 2, 3, 4, 3, 2, 1, 3][i % 8]], 0.7, i + 90, 1.6, 0.5), t0 + B.open + 0.3 + i * e8, 0.26);
  }
  sfx.add(k.shutter(1), t0 + B.photo, 0.45);
  // 片尾：一个长长的大调和弦 + 钟琴
  const endDur = ACT7.dur - B.end + 0.2;
  music.add(k.pad(['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], endDur, 1, 0.4, endDur * 0.8, 1600), t0 + B.end, 0.42);
  ['D5', 'A5', 'F#5', 'D6'].forEach((n, i) => music.add(k.bell(n, 2.5, 1), t0 + B.end + 0.1 + i * 0.35, 0.12, (i - 1.5) * 0.3));
  music.add(k.pick('D3', 1, 99, 3, 0.4), t0 + B.end, 0.4);
}

// ---------- 配音 ----------
function readVO(id) {
  const buf = readFileSync(new URL(`../assets/${VODIR}/${id}.wav`, import.meta.url));
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
    const j = Math.floor(x);
    const f = x - j;
    const a = data.readInt16LE(Math.min(n - 1, j) * 2) / 32768;
    const b = data.readInt16LE(Math.min(n - 1, j + 1) * 2) / 32768;
    out[i] = a + (b - a) * f;
  }
  const hp = new Biquad('hp', 80, 0.7);
  for (let i = 0; i < out.length; i++) out[i] = hp.run(out[i]);
  return out;
}
const vo = new Bus(DURATION);
const spans = [];
// STEM=music：只输出音乐 + 音效（不含配音）
for (const v of process.env.STEM === 'music' ? [] : VO_ALL) {
  const x = readVO(v.id);
  vo.add(x, v.start, 1.15);
  spans.push([v.start, v.start + x.length / SR]);
}
// 有配音时音乐让位（平滑），音效让一点
const out = new Bus(DURATION);
let g = 1;
for (let i = 0; i < out.n; i++) {
  const t = i / SR;
  const on = spans.some(([a, b]) => t > a - 0.08 && t < b + 0.12);
  g += ((on ? 0.5 : 1) - g) * (on ? 0.0008 : 0.0002);
  out.L[i] = music.L[i] * g + sfx.L[i] * (0.45 + 0.55 * g) + vo.L[i];
  out.R[i] = music.R[i] * g + sfx.R[i] * (0.45 + 0.55 * g) + vo.R[i];
}
const send = new Bus(DURATION);
send.mix(music, 0.5);
send.mix(vo, 0.05);
out.mix(reverb(send, { room: 0.82, damp: 0.35 }), 0.26);
const GAIN = Number(process.env.GAIN || 0.9);
for (let i = 0; i < out.n; i++) {
  const t = i / SR;
  const fade = Math.min(1, Math.max(0, (DURATION - t) / 0.8));
  out.L[i] *= GAIN * fade;
  out.R[i] *= GAIN * fade;
}
limit(out, 0.89);
mkdirSync(new URL('../dist/full/', import.meta.url), { recursive: true });
writeFileSync(new URL(process.env.STEM === 'music' ? '../dist/full/配乐与音效（无配音）.wav' : '../dist/full/audio.wav', import.meta.url), toWav(out));
console.log('dist/full/audio.wav', DURATION.toFixed(2) + 's');

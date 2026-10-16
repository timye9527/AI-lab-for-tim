// 零依賴的小型合成器：振盪器、濾波器、撥弦、殘響、限制器
export const SR = 48000;

export function noteFreq(n) {
  const m = n.match(/^([A-G])(#|b)?(-?\d)$/);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const midi = 12 * (Number(m[3]) + 1) + base + acc;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// 可重現的雜訊
export function noiseGen(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

// RBJ 雙二階濾波器，可逐樣本改截止頻率
export class Biquad {
  constructor(type = 'lp', f = 1000, q = 0.707) {
    this.type = type;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(f, q);
  }
  set(f, q = this.q) {
    this.f = f;
    this.q = q;
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const sn = Math.sin(w);
    const al = sn / (2 * q);
    let b0, b1, b2, a0, a1, a2;
    if (this.type === 'lp') {
      b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2;
    } else if (this.type === 'hp') {
      b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2;
    } else {
      b0 = al; b1 = 0; b2 = -al; // 帶通（峰值增益 1）
    }
    a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

// 立體聲匯流排
export class Bus {
  constructor(seconds) {
    this.n = Math.ceil(seconds * SR);
    this.L = new Float32Array(this.n);
    this.R = new Float32Array(this.n);
  }
  // 把單聲道訊號放到時間 t，pan -1..1（等功率）
  add(mono, t, gain = 1, pan = 0) {
    const i0 = Math.round(t * SR);
    const a = ((pan + 1) * Math.PI) / 4;
    const gl = Math.cos(a) * gain * Math.SQRT2;
    const gr = Math.sin(a) * gain * Math.SQRT2;
    for (let i = 0; i < mono.length; i++) {
      const j = i0 + i;
      if (j < 0) continue;
      if (j >= this.n) break;
      this.L[j] += mono[i] * gl;
      this.R[j] += mono[i] * gr;
    }
  }
  addStereo(L, R, t, gain = 1) {
    const i0 = Math.round(t * SR);
    for (let i = 0; i < L.length; i++) {
      const j = i0 + i;
      if (j < 0) continue;
      if (j >= this.n) break;
      this.L[j] += L[i] * gain;
      this.R[j] += R[i] * gain;
    }
  }
  mix(other, gain = 1) {
    for (let i = 0; i < this.n; i++) {
      this.L[i] += other.L[i] * gain;
      this.R[i] += other.R[i] * gain;
    }
  }
}

// 以函式產生一段單聲道訊號
export function render(dur, fn) {
  const n = Math.ceil(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i);
  return out;
}

export const expDecay = (t, tau) => Math.exp(-t / tau);
export function env(t, a, d, dur, rel = 0.05) {
  // 起音 a、衰減到 0 的時間常數 d、總長 dur（最後 rel 秒淡出）
  const att = t < a ? t / a : 1;
  const dec = Math.exp(-Math.max(0, t - a) / d);
  const r = t > dur - rel ? Math.max(0, (dur - t) / rel) : 1;
  return att * dec * r;
}

// Karplus-Strong 撥弦，含撥弦位置梳狀濾波與琴身共鳴
export function pluck(freq, dur, { bright = 0.5, decay = 4, pos = 0.18, seed = 1, body = 0.35 } = {}) {
  const n = Math.ceil(dur * SR);
  const out = new Float32Array(n);
  const P = SR / freq;
  const N = Math.floor(P);
  const frac = P - N;
  const buf = new Float32Array(N + 2);
  const rnd = noiseGen(seed);
  // 初始激發：濾過的雜訊
  let lp = 0;
  const k = 0.15 + bright * 0.8;
  for (let i = 0; i < N + 2; i++) {
    lp += (rnd() - lp) * k;
    buf[i] = lp;
  }
  // 撥弦位置：減去延遲後的自己
  const d = Math.max(1, Math.floor(N * pos));
  const exc = buf.slice();
  for (let i = 0; i < N + 2; i++) buf[i] = exc[i] - 0.9 * exc[(i + d) % (N + 2)];
  // 每週期的損耗，對應衰減時間
  const loss = Math.pow(0.001, 1 / (decay * freq));
  let idx = 0;
  let prev = 0;
  // 分數延遲用一階全通
  const ap = (1 - frac) / (1 + frac);
  let apX = 0;
  let apY = 0;
  const damp = 0.5 - bright * 0.04;
  for (let i = 0; i < n; i++) {
    const cur = buf[idx];
    const nxt = buf[(idx + 1) % N];
    let y = (cur * (1 - damp) + nxt * damp) * loss;
    const yy = ap * y + apX - ap * apY;
    apX = y;
    apY = yy;
    y = yy;
    buf[idx] = y;
    idx = (idx + 1) % N;
    out[i] = cur;
    prev = cur;
  }
  void prev;
  // 琴身：幾個低頻共鳴峰
  if (body > 0) {
    const peaks = [new Biquad('bp', 110, 6), new Biquad('bp', 210, 5), new Biquad('bp', 420, 4)];
    const hp = new Biquad('hp', 70, 0.7);
    for (let i = 0; i < n; i++) {
      const x = out[i];
      let b = 0;
      for (const p of peaks) b += p.run(x);
      out[i] = hp.run(x + b * body);
    }
  }
  // 起音前 1ms 淡入，避免爆音
  for (let i = 0; i < 48 && i < n; i++) out[i] *= i / 48;
  const tail = Math.min(n, SR * 0.05);
  for (let i = 0; i < tail; i++) out[n - 1 - i] *= i / tail;
  return out;
}

// Freeverb 殘響
export function reverb(bus, { room = 0.84, damp = 0.3, wet = 1, width = 1, pre = 0.012 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((x) => Math.round((x * SR) / 44100));
  const alls = [556, 441, 341, 225].map((x) => Math.round((x * SR) / 44100));
  const spread = Math.round((23 * SR) / 44100);
  const outL = new Float32Array(bus.n);
  const outR = new Float32Array(bus.n);
  const preN = Math.round(pre * SR);
  for (const [ch, off, out] of [[bus.L, 0, outL], [bus.R, spread, outR]]) {
    const cb = combs.map((l) => ({ b: new Float32Array(l + off), i: 0, f: 0 }));
    const ab = alls.map((l) => ({ b: new Float32Array(l + off), i: 0 }));
    for (let n = 0; n < bus.n; n++) {
      const x = (n >= preN ? (bus.L[n - preN] + bus.R[n - preN]) * 0.5 : 0) * 0.03;
      let y = 0;
      for (const c of cb) {
        const o = c.b[c.i];
        c.f = o * (1 - damp) + c.f * damp;
        c.b[c.i] = x + c.f * room;
        c.i = (c.i + 1) % c.b.length;
        y += o;
      }
      for (const a of ab) {
        const o = a.b[a.i];
        const v = -y + o;
        a.b[a.i] = y + o * 0.5;
        a.i = (a.i + 1) % a.b.length;
        y = v;
      }
      out[n] = y;
    }
    void ch;
  }
  const w1 = wet * (width / 2 + 0.5);
  const w2 = wet * ((1 - width) / 2);
  const res = new Bus(bus.n / SR);
  for (let n = 0; n < bus.n; n++) {
    res.L[n] = outL[n] * w1 + outR[n] * w2;
    res.R[n] = outR[n] * w1 + outL[n] * w2;
  }
  return res;
}

// 前視峰值限制器
export function limit(bus, ceiling = 0.89, look = 0.004, release = 0.12) {
  const la = Math.round(look * SR);
  const rel = Math.exp(-1 / (release * SR));
  let g = 1;
  const n = bus.n;
  const peak = new Float32Array(n);
  for (let i = 0; i < n; i++) peak[i] = Math.max(Math.abs(bus.L[i]), Math.abs(bus.R[i]));
  // 前視視窗內的最大值
  const win = new Float32Array(n);
  const dq = [];
  for (let i = n - 1; i >= 0; i--) {
    while (dq.length && peak[dq[dq.length - 1]] <= peak[i]) dq.pop();
    dq.push(i);
    while (dq[0] > i + la) dq.shift();
    win[i] = peak[dq[0]];
  }
  for (let i = 0; i < n; i++) {
    const target = win[i] > ceiling ? ceiling / win[i] : 1;
    g = target < g ? target : target + (g - target) * rel;
    bus.L[i] *= g;
    bus.R[i] *= g;
  }
}

export function toWav(bus) {
  const n = bus.n;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  // TPDF 抖動後量化成 16-bit
  const r = noiseGen(9);
  for (let i = 0; i < n; i++) {
    for (const [k, ch] of [[0, bus.L], [1, bus.R]]) {
      const d = (r() + r()) * 0.5;
      const v = Math.max(-32768, Math.min(32767, Math.round(ch[i] * 32767 + d)));
      buf.writeInt16LE(v, 44 + i * 4 + k * 2);
    }
  }
  return buf;
}

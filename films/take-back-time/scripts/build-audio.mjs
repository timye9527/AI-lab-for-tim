// 產生配樂與音效：dist/audio.wav
import { writeFile, mkdir } from 'node:fs/promises';
import { buildScore } from '../src/audio/score.js';
import { limit, toWav, SR } from '../src/audio/synth.js';

const GAIN = Number(process.env.GAIN || 1.05); // 整體增益（目標約 -16 LUFS）
const t0 = Date.now();
const bus = buildScore();
for (let i = 0; i < bus.n; i++) {
  bus.L[i] *= GAIN;
  bus.R[i] *= GAIN;
}
limit(bus, 0.85);
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/audio.wav', import.meta.url), toWav(bus));
// 每秒的響度概覽，方便檢查停頓與破音
let line = '';
for (let s = 0; s < bus.n / SR; s++) {
  let pk = 0;
  let sum = 0;
  for (let i = s * SR; i < Math.min(bus.n, (s + 1) * SR); i++) {
    const v = Math.max(Math.abs(bus.L[i]), Math.abs(bus.R[i]));
    pk = Math.max(pk, v);
    sum += bus.L[i] * bus.L[i];
  }
  const rms = Math.sqrt(sum / SR);
  line += `${String(s).padStart(2)}s rms ${(20 * Math.log10(rms + 1e-9)).toFixed(1).padStart(6)} pk ${(20 * Math.log10(pk + 1e-9)).toFixed(1).padStart(6)}\n`;
}
console.log(line);
console.log('完成', ((Date.now() - t0) / 1000).toFixed(1) + 's');

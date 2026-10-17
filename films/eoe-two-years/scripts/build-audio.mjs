// 生成配乐 + 音效 + 配音混音：dist/audio.wav
import { writeFile, mkdir } from 'node:fs/promises';
import { buildScore } from '../src/audio/score.js';

// TL=src/v4/timeline4.js 可以换时间轴；OUT 指定输出文件
import { limit, toWav, SR } from '../src/audio/synth.js';

const GAIN = Number(process.env.GAIN || 1.0);
const t0 = Date.now();
const tl = process.env.TL ? await import(new URL(`../${process.env.TL}`, import.meta.url)) : undefined;
const bus = buildScore(tl);
for (let i = 0; i < bus.n; i++) {
  bus.L[i] *= GAIN;
  bus.R[i] *= GAIN;
}
limit(bus, 0.89);
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
const outFile = new URL(`../${process.env.OUT || 'dist/audio.wav'}`, import.meta.url);
await mkdir(new URL('./', outFile), { recursive: true });
await writeFile(outFile, toWav(bus));
// 每半秒的响度概览，检查静默和破音
let line = '';
const step = SR / 2;
for (let s = 0; s * step < bus.n; s++) {
  let pk = 0;
  let sum = 0;
  for (let i = s * step; i < Math.min(bus.n, (s + 1) * step); i++) {
    pk = Math.max(pk, Math.abs(bus.L[i]), Math.abs(bus.R[i]));
    sum += bus.L[i] * bus.L[i];
  }
  const rms = Math.sqrt(sum / step);
  line += `${(s / 2).toFixed(1).padStart(4)}s rms ${(20 * Math.log10(rms + 1e-9)).toFixed(1).padStart(6)} pk ${(20 * Math.log10(pk + 1e-9)).toFixed(1).padStart(6)}\n`;
}
console.log(line);
console.log('完成', ((Date.now() - t0) / 1000).toFixed(1) + 's');

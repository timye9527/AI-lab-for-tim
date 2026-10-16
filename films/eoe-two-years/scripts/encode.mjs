// 合成成片：.frames/*.png + dist/audio.wav → dist/opening-sample.mp4
// SUBS=0 时用 .frames-nosub/ 输出无字幕版
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FPS as BASE_FPS } from '../src/timeline.js';

const FPS = Number(process.env.FPS || BASE_FPS);
const nosub = process.env.SUBS === '0';
const root = fileURLToPath(new URL('../', import.meta.url));
const outName = process.env.OUT || (nosub ? 'dist/opening-sample-nosub.mp4' : 'dist/opening-sample.mp4');
const args = [
  '-y', '-loglevel', 'error',
  '-framerate', String(FPS), '-i', nosub ? '.frames-nosub/f%05d.png' : '.frames/f%05d.png',
  '-i', 'dist/audio.wav',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF || '18', '-tune', 'animation', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-level', '4.2',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest',
  '-metadata', 'title=一个社恐的两年奇遇记 · 开场样片',
  outName,
];
const r = spawnSync('ffmpeg', args, { cwd: root, stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status);
// 封面候选：警报那一帧最抓眼
if (!nosub) spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', process.env.POSTER_AT || '6.3', '-i', outName, '-frames:v', '1', '-q:v', '2', 'dist/poster.jpg'], { cwd: root, stdio: 'inherit' });
console.log('输出', outName);

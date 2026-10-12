// 合成成片：.frames/*.png + dist/audio.wav → dist/take-back-time.mp4
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FPS as BASE_FPS } from '../src/timeline.js';

const FPS = Number(process.env.FPS || BASE_FPS);
const root = fileURLToPath(new URL('../', import.meta.url));
const outName = process.env.OUT || 'dist/take-back-time.mp4';
const args = [
  '-y', '-loglevel', 'error',
  '-framerate', String(FPS), '-i', '.frames/f%05d.png',
  '-i', 'dist/audio.wav',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF || '20', '-tune', 'film', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-level', '4.2',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest',
  '-metadata', 'title=把時間拿回來',
  outName,
];
const r = spawnSync('ffmpeg', args, { cwd: root, stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status);
// 海報圖：取結尾的一格
spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '30.2', '-i', outName, '-frames:v', '1', '-q:v', '3', 'dist/poster.jpg'], { cwd: root, stdio: 'inherit' });
console.log('輸出', outName);

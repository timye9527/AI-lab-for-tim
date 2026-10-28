// 合成成片：out/film/frames/*.jpg + out/film/audio.wav → out/film/成片.mp4（SUBS=0 → 无字幕版）
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const nosub = process.env.SUBS === '0';
const outName = process.env.OUT || `out/film/${nosub ? 'AI省下的钱被谁赚走了-无字幕' : 'AI省下的钱被谁赚走了'}.mp4`;
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', `out/film/${nosub ? 'frames-nosub' : 'frames'}/f%05d.jpg`, '-i', 'out/film/audio.wav',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest',
  '-metadata', 'title=AI省下的钱，被谁赚走了？', '-metadata', 'comment=内容由 AI 辅助生成', outName], { cwd: root, stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status);
console.log('输出', outName);

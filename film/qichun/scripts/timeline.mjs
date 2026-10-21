// 生成绝对时间轴（配音起止、各段起止），给混音脚本用
import fs from 'node:fs';
import { build } from '../scene/timeline.js';
const [voPath, linesPath, out] = process.argv.slice(2);
const TL = build(JSON.parse(fs.readFileSync(voPath)), JSON.parse(fs.readFileSync(linesPath)).lines);
fs.writeFileSync(out, JSON.stringify(TL, null, 1));
console.log('duration', TL.duration.toFixed(2), 'segments', TL.segments.length);
for (const s of TL.segments) console.log(s.id.padEnd(10), s.mode.padEnd(10), s.start.toFixed(1), '→', s.end.toFixed(1));

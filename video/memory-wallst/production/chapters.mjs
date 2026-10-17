// 按配音时间轴生成章节时间戳，写进 07-发布包.md
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const tl = JSON.parse(readFileSync(ROOT + 'out/audio/timeline.json', 'utf8'));
const seen = new Set(), rows = [];
for (const l of tl.lines) {
  if (seen.has(l.sec)) continue; seen.add(l.sec);
  const s = l.sec === 0 ? 0 : Math.floor(l.start - 0.5);
  const name = l.title.replace(/^\[[^\]]*\]\s*/, '');
  rows.push(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')} ${name}`);
}
const block = '<!-- CHAPTERS -->\n```\n' + rows.join('\n') + '\n```\n<!-- /CHAPTERS -->';
const p = ROOT + '07-发布包.md';
let md = readFileSync(p, 'utf8');
md = md.includes('<!-- /CHAPTERS -->') ? md.replace(/<!-- CHAPTERS -->[\s\S]*?<!-- \/CHAPTERS -->/, block) : md.replace('<!-- CHAPTERS -->', block);
writeFileSync(p, md);
console.log(rows.join('\n'), `\n总长 ${Math.floor(tl.duration / 60)}:${String(Math.round(tl.duration % 60)).padStart(2, '0')}`);

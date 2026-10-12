// 從 Google Fonts 下載只含片中用字的子集字型（SIL OFL 授權）
// 改了字幕或畫面裡的字之後重跑：npm run fonts
import { writeFile, readFile } from 'node:fs/promises';
import { SUBTITLES, TAGLINE, CROWD_WORDS } from '../src/timeline.js';

const root = new URL('../', import.meta.url);
// 畫面裡用到的其他字（卡片、浮動字元等）
const extra = await readFile(new URL('src/glyphs.txt', root), 'utf8');
const text = [...new Set([...SUBTITLES.map((s) => s.text).join(''), ...TAGLINE, ...CROWD_WORDS.join(''), ...extra.replace(/\s/g, ''), ...'0123456789:.+-×→Timv'])].join('');

const fonts = [
  { family: 'Noto Sans TC', weight: 500, file: 'NotoSansTC-Medium.woff2' },
  { family: 'Noto Sans TC', weight: 300, file: 'NotoSansTC-Light.woff2' },
  { family: 'Noto Serif TC', weight: 600, file: 'NotoSerifTC-SemiBold.woff2' },
];
// 新版瀏覽器 UA 才會拿到 woff2
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

for (const f of fonts) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.family)}:wght@${f.weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const m = css.match(/url\((https:[^)]+)\)/);
  if (!m) throw new Error('找不到字型網址：' + css.slice(0, 200));
  const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer());
  await writeFile(new URL('assets/fonts/' + f.file, root), buf);
  console.log(f.file, (buf.length / 1024).toFixed(1) + ' KB');
}
console.log('字數', text.length);

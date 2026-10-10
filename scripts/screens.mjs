// 用真实页面截图做「结果实拍」笔记 + 商品详情图
// 用法：先 npm run preview，再 npm run screens [-- 测试id]
// 输出：out/notes/<id>/01-结果实拍/（6 张 + 文案.txt）、out/notes/<id>/商品素材/05.png 06.png
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { lintText } from './lint-words.mjs';

const id = process.argv[2] || 'jiucai';
const base = process.env.BASE || 'http://localhost:8788';
const test = (await import(`../public/tests/${id}/config.js`)).default;
const th = test.theme;
const N = test.notes;
const QN = test.questions.length;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const { chromium } = await import('playwright-core');
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.CHROME_PATH || (existsSync(MAC_CHROME) ? MAC_CHROME : undefined);
const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' });

// 1. 走一遍真实流程，截元素图
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await phone.goto(`${base}/${id}/#intro`, { waitUntil: 'networkidle' });
await phone.evaluate(() => localStorage.clear());
await phone.goto(`${base}/${id}/#intro`, { waitUntil: 'networkidle' });
await phone.click('[data-act="start"]');
const shot = async (sel) => (await (await phone.$(sel)).screenshot()).toString('base64');
const quiz = await shot('.quiz');
// 固定一组作答，结果稳定可复现
const PICKS = (process.env.PICKS || '1').split(',').map(Number);
for (let i = 0; await phone.$('[data-pick]'); i++) {
  const opts = await phone.$$('[data-pick]');
  await opts[PICKS[i % PICKS.length] % opts.length].click();
  await phone.waitForTimeout(250);
}
await phone.fill('#nick', '匿名韭菜');
const tierCard = await shot('.tier-card');
await phone.fill('[data-unlock] input', 'DEMO');
await phone.click('[data-unlock] button');
await phone.waitForSelector('.report');
const secs = [];
for (const el of await phone.$$('.report .sec')) secs.push((await el.screenshot()).toString('base64'));
const tierName = await phone.$eval('.tc-name', (e) => e.textContent);
const persona = await phone.$eval('.persona-name', (e) => e.textContent);

// 2. 拼成 3:4 配图
const CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 1080px; height: 1440px; overflow: hidden; color: ${th.text};
  font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", sans-serif;
  background: radial-gradient(120% 70% at 50% 0%, #22301f, ${th.bg} 70%); display: flex; flex-direction: column; align-items: center; padding: 72px 64px; }
h1 { font-size: 76px; font-weight: 900; text-align: center; line-height: 1.25; }
h1 em { font-style: normal; color: ${th.gold}; }
.sub { font-size: 34px; color: ${th.muted}; margin-top: 18px; text-align: center; }
.shots { margin-top: 40px; display: flex; flex-direction: column; gap: 24px; align-items: center; }
.shots img { display: block; border-radius: 28px; border: 3px solid ${th.gold}55; box-shadow: 0 20px 60px #0008; width: auto; height: auto; max-width: 940px; }
.foot { font-size: 26px; color: ${th.muted}; margin-top: auto; padding-top: 24px; }`;
// 可用高度约 990px，按图片张数平分，保证不溢出
const img = (b64, n) => `<img style="max-height:${Math.floor((990 - 24 * (n - 1)) / n)}px" src="data:image/png;base64,${b64}">`;
const slide = (title, sub, imgs, foot = `${test.brand} · 页面实拍`) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<h1>${title}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}<div class="shots">${imgs.map((b) => img(b, imgs.length)).join('')}</div><p class="foot">${esc(foot)}</p></body></html>`;

const slides = [
  slide(`韭菜段位测试<br><em>结果长这样</em>`, `${QN} 道题 · 6 档段位 · 16 位历史人物`, [tierCard]),
  slide('题目是这种画风', `分 ${test.chapters?.length || 1} 章，你选哪个？评论区见`, [quiz]),
  slide('完整报告 ①', '四维人格图谱 + 人物自画像', [secs[0], secs[1]]),
  slide('完整报告 ②', '财商六维 + 你与 TA 的共同底色', [secs[2], secs[3]]),
  slide('完整报告 ③', 'TA 的真实故事 + 盲点与提醒', [secs[4], secs[5]]),
  slide('完整报告 ④', '搭子与天敌：拉朋友来测', [secs[6]], `${N.cta}　纯属娱乐，不构成任何投资建议`),
];

const page = await browser.newPage({ viewport: { width: 1080, height: 1440 } });
const dir = `out/notes/${id}/01-结果实拍`;
mkdirSync(dir, { recursive: true });
for (let i = 0; i < slides.length; i++) {
  await page.setContent(slides[i]);
  await page.screenshot({ path: `${dir}/${String(i + 1).padStart(2, '0')}.png` });
}
const title = '测出来是这个段位，我笑了';
const body = `做了一套「炒股人格」测试，结果页长这样👆\n\n${QN} 道真实情境题：追涨、抄底、小道消息、年终奖、爸妈问理财……\n测出 6 档韭菜段位（从韭菜盒子到镰刀绝缘体），再匹配 16 位历史人物里和你同一种人格底色的那位。\n截图里这份是「${tierName} · ${persona}」。\n\n你觉得自己是哪一档？评论区报段位～\n${N.cta}\n（纯属娱乐，非专业测评，不构成任何投资建议）`;
writeFileSync(`${dir}/文案.txt`, `【标题】\n${title}\n\n【正文】\n${body}\n\n【话题】\n${N.tags.join(' ')}\n`);

// 3. 商品详情图：真实结果截图
const shopDir = `out/notes/${id}/商品素材`;
mkdirSync(shopDir, { recursive: true });
for (const [n, html] of [
  ['05', slide('免费段位卡', '测完就能保存，发群里认领段位', [tierCard], '页面实拍 · 实际结果因人而异')],
  ['06', slide('完整报告 7 个部分', '人物自画像 · 财商六维 · 真实故事 · 搭子天敌……', [secs[2], secs[6]], '页面实拍 · 实际结果因人而异')],
]) {
  await page.setContent(html);
  await page.screenshot({ path: `${shopDir}/${n}.png` });
}
await browser.close();

const hit = lintText(title + body);
if ([...title].length > 20) console.log(`⚠️ 标题超过 20 字：${title}`);
if (hit.length) console.log(`⚠️ 含高危词：${hit.join('、')}`);
console.log(`已生成 ${dir}/（${slides.length} 张）和 ${shopDir}/05.png、06.png · 截图结果：${tierName} · ${persona}`);

// 提示词页：从 prompts.mjs 生成 提示词.md（入库）和 out/prompts.html（发 Artifact，手机上一键复制）
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STYLES, TEST_SCENE, PROMPTS, NEG } from '../prompts.mjs';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const fill = (p, s) => p.replace('{S}', s.words);
const test = (s) => `${TEST_SCENE}，${s.words}`;

// 自检：提示词里不能出现会让图里长字的要求、真实品牌
for (const g of PROMPTS) for (const it of g.items) {
  if (!it.p.includes('{S}')) throw new Error(`${it.id} 缺少风格占位 {S}`);
  if (/写着|标语|招牌上|文字为/.test(it.p)) throw new Error(`${it.id} 会让图里出现字`);
}

// ── 提示词.md ──
let md = '# 提示词 ·《AI省下的钱，被谁赚走了？》\n\n';
md += '> 由 `scripts/prompts.mjs` 从 `prompts.mjs` 生成，别手改。\n';
md += '> 用法：即梦、豆包、可灵、通义万相都行，比例选 16:9，每条出 4 张挑 1 张。负面词有单独输入框就填，没有就省略。\n\n';
md += '## 第一步：比画风（同一个场景，三种画风各出一次）\n\n';
for (const s of STYLES) md += `### ${s.id}. ${s.name}\n\n${s.note}。\n\n\`\`\`\n${test(s)}\n\`\`\`\n\n`;
md += `负面词：\n\n\`\`\`\n${NEG}\n\`\`\`\n\n`;
md += '## 第二步：全套提示词（以下按 A 国漫电影感写好；选了别的画风，把每条末尾的风格词换成对应那组）\n\n';
for (const g of PROMPTS) {
  md += `### ${g.group}\n\n`;
  for (const it of g.items) md += `**${it.id} ${it.use}**\n\n\`\`\`\n${fill(it.p, STYLES[0])}\n\`\`\`\n\n`;
}
writeFileSync(join(DIR, '提示词.md'), md);

// ── out/prompts.html ──
mkdirSync(join(DIR, 'out'), { recursive: true });
const data = JSON.stringify({ STYLES, TEST_SCENE, PROMPTS, NEG }).replace(/</g, '\\u003c');
const html = `<title>婚庆片画风提示词</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Noto+Sans+SC:wght@400;500;700&display=swap">
<style>
/* 版式：和分镜审阅页同一本「订单簿」：纸色底，每条提示词一张可复制的卡 */
:root {
  --paper: #F7F1E6; --card: #FFFDF8; --ink: #2B2630; --muted: #6E6672; --line: #E4D9C6;
  --red: #C8343A; --gold: #B98A2E; --teal: #1F9A90; --codebg: #F1EADC; --goldSoft: #F3E6C9;
  --display: 'ZCOOL KuaiLe', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --body: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --paper: #1C191F; --card: #26222A; --ink: #F1EBE2; --muted: #A79FAA; --line: #3A3440;
  --red: #E8686B; --gold: #D9B25E; --teal: #4FC2B7; --codebg: #1F1C23; --goldSoft: #3A311F; color-scheme: dark } }
:root[data-theme="dark"] {
  --paper: #1C191F; --card: #26222A; --ink: #F1EBE2; --muted: #A79FAA; --line: #3A3440;
  --red: #E8686B; --gold: #D9B25E; --teal: #4FC2B7; --codebg: #1F1C23; --goldSoft: #3A311F; color-scheme: dark }
* { box-sizing: border-box }
body { background: var(--paper); color: var(--ink); font: 15px/1.7 var(--body);
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 0 48px }
.wrap { max-width: 860px; margin: 0 auto; display: grid; gap: 28px }
header { padding-top: 28px; display: grid; gap: 10px }
.eyebrow { color: var(--muted); font-size: 13px; letter-spacing: .08em }
h1 { font: 400 clamp(28px, 6.5vw, 44px)/1.2 var(--display); margin: 0; color: var(--red); text-wrap: balance }
h2 { font: 400 22px/1.3 var(--display); margin: 0 0 4px; text-wrap: balance }
h3 { font: 400 18px/1.3 var(--display); margin: 8px 0 0 }
p { margin: 0 } .muted { color: var(--muted); font-size: 14px }
section { display: grid; gap: 12px }
.how { background: var(--card); border: 1px solid var(--line); border-left: 4px solid var(--gold); border-radius: 6px; padding: 14px 16px }
.how ol, .how ul { margin: 0; padding-left: 1.3em; display: grid; gap: 4px }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 14px 16px; display: grid; gap: 8px; min-width: 0 }
.head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap }
.head b { font: 400 18px var(--display) }
.tagline { font-size: 13px; color: var(--muted) }
.txt { background: var(--codebg); border-radius: 4px; padding: 10px 12px; font-size: 14px; line-height: 1.75; white-space: pre-wrap; word-break: break-all; user-select: all }
button { font: 500 14px var(--body); color: var(--card); background: var(--teal); border: 0; border-radius: 4px; padding: 6px 14px; cursor: pointer; justify-self: start }
button:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px }
button.done { background: var(--gold) }
.styles { display: flex; gap: 8px; flex-wrap: wrap }
.styles label { display: inline-flex; align-items: center; gap: 6px; background: var(--card); border: 1px solid var(--line); border-radius: 4px; padding: 6px 12px; cursor: pointer }
.styles input { accent-color: var(--red) }
.styles label:has(input:checked) { border-color: var(--red); background: var(--goldSoft) }
</style>
<div class="wrap">
  <header>
    <div class="eyebrow">AI省下的钱，被谁赚走了？ · 画风确认</div>
    <h1>先比三种画风，再定画面路线</h1>
    <p class="muted">每条提示词都已经写全，点「复制」粘贴到即梦、豆包、可灵或通义万相就能用。比例选 16:9，每条出 4 张挑最好的 1 张。</p>
  </header>

  <section class="how">
    <h2>怎么看</h2>
    <ol>
      <li>第一步的三条只换了画风，场景一样。三张放一起比，挑你最想要的感觉。</li>
      <li><b>C 扁平科普动画</b>最接近纯代码绘制的实际效果（0 元、我全部跑完）。选 A 或 B，背景要你用 AI 出图，角色仍由代码画，保证每个镜头长得一样。</li>
      <li>顺便看三件事：人物亲不亲切、老人小孩看不看得懂；小陈红、小李青分不分得清；颜色是不是太花。</li>
      <li>图里出现的字、招牌不用管，最后都由代码重新写。</li>
    </ol>
  </section>

  <section>
    <h2>第一步：比画风</h2>
    <div id="test" style="display:grid;gap:12px"></div>
  </section>

  <section>
    <h2>负面词</h2>
    <p class="muted">工具有「不希望出现」之类的输入框就填这个，没有就省略。</p>
    <div id="neg"></div>
  </section>

  <section>
    <h2>第二步：全套提示词</h2>
    <p class="muted">定了画风再出这些。选了哪种，下面每条的风格词就自动换成哪种。</p>
    <div class="styles" id="pick" role="radiogroup" aria-label="画风"></div>
    <div id="all" style="display:grid;gap:12px"></div>
  </section>
</div>
<script>
const D = ${data};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const card = (key, title, sub, text) => '<div class="card"><div class="head"><b>' + esc(title) + '</b><span class="tagline">' + esc(sub) + '</span></div><div class="txt" id="t-' + key + '">' + esc(text) + '</div><button type="button" data-copy="' + key + '">复制</button></div>';
document.getElementById('test').innerHTML = D.STYLES.map((s) => card('test' + s.id, s.id + '. ' + s.name, s.note, D.TEST_SCENE + '，' + s.words)).join('');
document.getElementById('neg').innerHTML = card('neg', '负面词', '所有提示词通用', D.NEG);
let style = 'A';
try { style = localStorage.getItem('style') || 'A' } catch (e) {}
document.getElementById('pick').innerHTML = D.STYLES.map((s) => '<label><input type="radio" name="style" id="style-' + s.id + '" value="' + s.id + '"' + (s.id === style ? ' checked' : '') + '>' + s.id + ' ' + esc(s.name) + '</label>').join('');
function renderAll() {
  const s = D.STYLES.find((x) => x.id === style) || D.STYLES[0];
  document.getElementById('all').innerHTML = D.PROMPTS.map((g) => '<h3>' + esc(g.group) + '</h3>' + g.items.map((it) => card(it.id, it.id + ' ' + it.use, s.name, it.p.replace('{S}', s.words))).join('')).join('');
}
document.getElementById('pick').addEventListener('change', (e) => { style = e.target.value; try { localStorage.setItem('style', style) } catch (x) {} renderAll(); });
renderAll();
document.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-copy]'); if (!b) return;
  const el = document.getElementById('t-' + b.dataset.copy);
  const ok = () => { b.textContent = '已复制'; b.classList.add('done'); setTimeout(() => { b.textContent = '复制'; b.classList.remove('done'); }, 1500); };
  const sel = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = '已选中，长按复制'; };
  try { navigator.clipboard.writeText(el.textContent).then(ok, sel); } catch (x) { sel(); }
});
</script>
`;
writeFileSync(join(DIR, 'out/prompts.html'), html);
console.log('写好 提示词.md 和 out/prompts.html');

// 审片页：读 out/board.json，生成 out/board.html（单文件，发成 Artifact 给主理人在手机上审）
// 先跑 board.mjs 再跑这个
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(DIR, 'out/board.json'), 'utf8'));
const json = JSON.stringify(data).replace(/</g, '\\u003c');

const html = `<title>婚庆片分镜审阅</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Noto+Sans+SC:wght@400;500;700&display=swap">
<style>
/* 版式：像一本婚庆店的订单簿——红金封面条、纸色底、每个镜头一张订单卡 */
:root {
  --paper: #F7F1E6; --card: #FFFDF8; --ink: #2B2630; --muted: #6E6672; --line: #E4D9C6;
  --red: #C8343A; --gold: #B98A2E; --teal: #1F9A90; --ai: #2AA9C9; --hypo: #8A6D3B;
  --redSoft: #F6DEDB; --tealSoft: #D8EFEC; --goldSoft: #F3E6C9;
  --display: 'ZCOOL KuaiLe', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --body: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --paper: #1C191F; --card: #26222A; --ink: #F1EBE2; --muted: #A79FAA; --line: #3A3440;
  --red: #E8686B; --gold: #D9B25E; --teal: #4FC2B7; --ai: #5CCBE6; --hypo: #CDB07A;
  --redSoft: #3E2427; --tealSoft: #1D3634; --goldSoft: #3A311F; color-scheme: dark } }
:root[data-theme="dark"] {
  --paper: #1C191F; --card: #26222A; --ink: #F1EBE2; --muted: #A79FAA; --line: #3A3440;
  --red: #E8686B; --gold: #D9B25E; --teal: #4FC2B7; --ai: #5CCBE6; --hypo: #CDB07A;
  --redSoft: #3E2427; --tealSoft: #1D3634; --goldSoft: #3A311F; color-scheme: dark }
* { box-sizing: border-box }
body { background: var(--paper); color: var(--ink); font: 15px/1.7 var(--body);
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 0 48px }
.wrap { max-width: 980px; margin: 0 auto; display: grid; gap: 28px }
header { padding-top: 28px; display: grid; gap: 10px }
.eyebrow { color: var(--muted); font-size: 13px; letter-spacing: .08em }
h1 { font: 400 clamp(30px, 7vw, 52px)/1.15 var(--display); margin: 0; color: var(--red); text-wrap: balance }
h2 { font: 400 24px/1.3 var(--display); margin: 0 0 12px; text-wrap: balance }
.lede { margin: 0; max-width: 62ch; color: var(--muted) }
.facts { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 14px }
.facts b { font-variant-numeric: tabular-nums }
.ask { background: var(--card); border: 1px solid var(--line); border-left: 4px solid var(--gold); border-radius: 6px; padding: 16px 18px }
.ask ol { margin: 0; padding-left: 1.3em; display: grid; gap: 8px }
.ask small { color: var(--muted) }
/* 时间轴 */
.tl { display: grid; gap: 8px }
.bar { position: relative; display: flex; height: 38px; border-radius: 4px; overflow: hidden; border: 1px solid var(--line) }
.bar button { all: unset; cursor: pointer; display: grid; place-items: center; font-size: 12px; color: var(--ink); border-right: 1px solid var(--line); min-width: 0; overflow: hidden; white-space: nowrap }
.bar button:nth-child(odd) { background: var(--goldSoft) } .bar button:nth-child(even) { background: var(--card) }
.bar button[aria-pressed="true"] { background: var(--red); color: var(--card) }
.bar button:focus-visible { outline: 2px solid var(--teal); outline-offset: -2px }
.revs { position: relative; height: 22px; font-size: 12px }
.revs span { position: absolute; transform: translateX(-50%); white-space: nowrap; color: var(--red); font-weight: 700 }
.revs em { font-style: normal }
.revs span::before { content: ''; display: block; width: 2px; height: 8px; background: var(--red); margin: 0 auto 2px }
.legend { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13px; color: var(--muted) }
/* 镜头卡 */
.act { display: grid; gap: 12px }
.act > h3 { font: 400 20px/1.3 var(--display); margin: 8px 0 0; display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap }
.act > h3 small { font: 13px var(--body); color: var(--muted) }
.shot { background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 14px 16px; display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 4px 16px }
.shot.rev { border-color: var(--red); box-shadow: 0 0 0 1px var(--red) inset }
.meta { display: grid; align-content: start; gap: 2px; font-variant-numeric: tabular-nums }
.meta .id { font: 400 22px/1 var(--display) }
.meta .tc { font-size: 13px; color: var(--muted) }
.chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px }
.chip { font-size: 11px; line-height: 1; padding: 4px 6px; border-radius: 3px; white-space: nowrap }
.chip.rev { background: var(--red); color: var(--card) } .chip.key { background: var(--goldSoft); color: var(--ink) }
.chip.hypo { border: 1px dashed var(--hypo); color: var(--hypo) }
.body { display: grid; gap: 6px; min-width: 0 }
.vo { margin: 0; font-size: 16px; font-weight: 500; border-left: 3px solid var(--teal); padding-left: 10px }
.vo.none { color: var(--muted); font-weight: 400 }
dl { margin: 0; display: grid; grid-template-columns: 4.5em minmax(0, 1fr); gap: 2px 10px; font-size: 14px }
dt { color: var(--muted) } dd { margin: 0 }
.assets { font-size: 12px; color: var(--muted); letter-spacing: .02em }
/* 角色 */
.cast { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px }
.who { background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 16px; display: grid; gap: 8px }
.who h3 { margin: 0; font: 400 22px var(--display) }
.who p { margin: 0; font-size: 14px }
.sw { display: flex; gap: 6px; flex-wrap: wrap }
.sw i { display: inline-flex; align-items: center; gap: 6px; font-style: normal; font-size: 12px; color: var(--muted) }
.sw i::before { content: ''; width: 18px; height: 18px; border-radius: 50%; background: var(--c); border: 1px solid var(--line) }
.note { font-size: 13px; color: var(--muted); margin: 0 }
@media (max-width: 560px) {
  .shot { grid-template-columns: minmax(0, 1fr) }
  .meta { grid-auto-flow: column; justify-content: start; align-items: baseline; gap: 10px }
  .revs em { display: none }
  .bar button { font-size: 0 } .bar button::after { content: attr(data-short); font-size: 11px }
}
@media (prefers-reduced-motion: no-preference) { .shot { transition: box-shadow .2s } }
</style>

<div class="wrap">
  <header>
    <div class="eyebrow">二维动画经济科普 · 横版 16:9 · 1920×1080 · 分镜审阅稿</div>
    <h1>AI省下的钱，<br>被谁赚走了？</h1>
    <p class="lede">一家县城婚庆公司的故事。旁白一字不加，只为配音安全改了几处说法，意思不变。下面是逐镜头分镜：时间码按估算语速算，配音做完后按实际时长重排。还没有生成任何视频。</p>
    <div class="facts" id="facts"></div>
  </header>

  <section class="ask" aria-labelledby="ask-h">
    <h2 id="ask-h">已定和待定</h2>
    <ol>
      <li><b>标题</b>：《AI省下的钱，被谁赚走了？》<small>已确认</small></li>
      <li><b>时长</b>：正常 5 分钟，不删句 <small>已确认</small></li>
      <li><b>声音</b>：AI 女声 <small>已确认；三个音色样片待你挑</small></li>
      <li><b>画面</b>：A 国漫电影感 <small>已确认；背景用 AI 出空景，角色、信息图、文字由代码画</small></li>
    </ol>
  </section>

  <section class="tl" aria-labelledby="tl-h">
    <h2 id="tl-h">结构和三次反转</h2>
    <div class="bar" id="bar" role="group" aria-label="按幕筛选"></div>
    <div class="revs" id="revs"></div>
    <div class="legend"><span>点一幕只看这一幕，再点一次看全部</span><span>红框 = 反转镜头</span><span>虚线角标 = 画面有假设数字</span></div>
  </section>

  <section aria-labelledby="cast-h">
    <h2 id="cast-h">两个主角（全片锁定）</h2>
    <div class="cast">
      <div class="who">
        <h3 style="color:var(--red)">小陈 · 婚庆公司老板</h3>
        <p>38 岁左右，圆脸微胖，三七分短发头顶一撮翘毛。酒红马甲、白衬衫挽袖、金色领结、胸口小红花。爱拨算盘，表情大、动作重。</p>
        <div class="sw"><i style="--c:#B8323A">马甲</i><i style="--c:#E8B04B">领结</i><i style="--c:#3A3F4B">西裤</i></div>
      </div>
      <div class="who">
        <h3 style="color:var(--teal)">小李 · 街对面工作室</h3>
        <p>28 岁左右，瘦高，蓬松短发、黑色圆框眼镜（会反光）。青绿卫衣、浅灰长裤、白球鞋、黄色小书包。冷静、点子多，动作轻。</p>
        <div class="sw"><i style="--c:#2BB3A8">卫衣</i><i style="--c:#F2C14E">书包</i><i style="--c:#C9CDD4">长裤</i></div>
      </div>
      <div class="who">
        <h3 style="color:var(--ai)">AI 小光球</h3>
        <p>全片 AI 只有这一个形象：青蓝发光圆球，两颗小白点当眼睛，会飞、会吃方块、会分裂。不用机器人，不出现任何真实产品。</p>
        <div class="sw"><i style="--c:#4FD8F0">光球</i></div>
      </div>
    </div>
    <p class="note" style="margin-top:10px">一圆一长、一红一青，只看剪影或颜色就分得清。角色由代码定义一次，每个镜头调用同一份，所以不会走样。</p>
  </section>

  <section aria-labelledby="shots-h">
    <h2 id="shots-h">逐镜头分镜</h2>
    <div id="shots" style="display:grid;gap:20px"></div>
  </section>

  <p class="note">本片人物、店铺和数字均为虚构或假设，只用于解释经济原理，不代表真实统计。完整文档在仓库 video/ai-wedding/：制作方案.md、分镜表.md、资产清单.md、口播稿.md。</p>
</div>

<script>
const D = ${json};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const total = D.shots.reduce((k, s) => k + s.dur, 0);
document.getElementById('facts').innerHTML =
  '<span>估算时长 <b>约 ' + Math.floor(total / 60) + ' 分 ' + Math.round(total % 60) + ' 秒</b></span><span>镜头 <b>' + D.count + '</b> 个</span><span>资产 <b>' + D.assets.length + '</b> 项</span><span>反转 <b>3</b> 次</span>';

const SHORT = { A0: '开场', A1: '一', A2: '二', A3: '三', A4: '四', A5: '五', A6: '尾声' };
let pick = null;
try { pick = localStorage.getItem('act') } catch (e) {}
const bar = document.getElementById('bar');
bar.innerHTML = D.acts.map((a) => '<button type="button" data-act="' + a.id + '" data-short="' + SHORT[a.id] + '" style="flex:' + a.secs + '" aria-pressed="false" title="' + esc(a.name) + '">' + esc(a.name.split(' · ')[1] || a.name) + '</button>').join('');
const revs = D.shots.filter((s) => s.tag.some((t) => t.startsWith('rev')));
document.getElementById('revs').innerHTML = revs.map((s) => '<span style="left:' + ((s.start + s.dur / 2) / total * 100).toFixed(2) + '%"><b>' + esc(s.tagText.split('、')[0].slice(0, 3)) + '</b><em>' + esc(s.tagText.split('、')[0].slice(3)) + '</em></span>').join('');

const CHIP = { rev1: ['rev', '反转①'], rev2: ['rev', '反转②'], rev3: ['rev', '反转③'], key: ['key', '关键画面'], hypo: ['hypo', '假设数字'] };
function render() {
  bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.act === pick)));
  document.getElementById('shots').innerHTML = D.acts.filter((a) => !pick || a.id === pick).map((a) => {
    const ss = D.shots.filter((s) => s.act === a.id);
    return '<div class="act"><h3>' + esc(a.name) + '<small>' + a.start + ' 起 · 约 ' + a.secs + ' 秒 · ' + ss.length + ' 镜</small></h3>' + ss.map((s) => {
      const rev = s.tag.some((t) => t.startsWith('rev'));
      return '<article class="shot' + (rev ? ' rev' : '') + '"><div class="meta"><span class="id">' + s.id + '</span><span class="tc">' + s.tc + '</span><span class="tc">' + s.dur + ' 秒</span>' +
        '<div class="chips">' + s.tag.map((t) => '<span class="chip ' + CHIP[t][0] + '">' + CHIP[t][1] + '</span>').join('') + '</div></div>' +
        '<div class="body"><p class="vo' + (s.vo ? '' : ' none') + '">' + esc(s.vo || '（无旁白）') + '</p><dl>' +
        '<dt>画面</dt><dd>' + esc(s.visual) + '</dd><dt>镜头</dt><dd>' + esc(s.size) + ' · ' + esc(s.camera) + '</dd>' +
        '<dt>声音</dt><dd>' + esc(s.sfx) + '</dd><dt>屏幕字</dt><dd>' + esc(s.text) + '</dd></dl>' +
        '<div class="assets">资产 ' + s.assets.join(' · ') + '</div></div></article>';
    }).join('') + '</div>';
  }).join('');
}
bar.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  pick = pick === b.dataset.act ? null : b.dataset.act;
  try { pick ? localStorage.setItem('act', pick) : localStorage.removeItem('act') } catch (e) {}
  render();
});
render();
</script>
`;
writeFileSync(join(DIR, 'out/board.html'), html);
console.log('写好 out/board.html');

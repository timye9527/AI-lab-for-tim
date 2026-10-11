// 生成小红书笔记素材：每篇一组 3:4 配图（1080×1440）+ 文案.txt
// 用法：npm run notes [-- 测试id]         输出到 out/notes/<测试id>/
// 需要 Chrome / Chromium：默认找本机 Chrome；也可以设 CHROME_PATH 指定路径
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tierIcon } from '../public/engine/icons.js';
import { flip } from '../public/engine/score.js';
import { lintText } from './lint-words.mjs';

const id = process.argv[2] || 'jiucai';
const test = (await import(`../public/tests/${id}/config.js`)).default;
const th = test.theme;
const N = test.notes;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const icon = (name, size = 200) => tierIcon(name, th.accent, th.gold).replace('width="120" height="120"', `width="${size}" height="${size}"`);
const tiersDesc = [...test.tiers].sort((a, b) => b.level - a.level);
const typeEntries = Object.entries(test.types);

// —— 配图模板 ——
const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 1080px; height: 1440px; overflow: hidden; color: ${th.text};
  font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", sans-serif;
  background: radial-gradient(120% 70% at 50% 0%, #22301f, ${th.bg} 70%); }
.frame { position: absolute; inset: 40px; border: 2px solid ${th.gold}55; border-radius: 40px; padding: 80px 72px;
  display: flex; flex-direction: column; }
.head { display: flex; justify-content: space-between; color: ${th.accent}; font-size: 30px; letter-spacing: 6px; }
.head span:last-child { color: ${th.muted}; letter-spacing: 0; }
.foot { margin-top: auto; text-align: center; color: ${th.muted}; font-size: 26px; }
.center { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
.big { font-size: 112px; font-weight: 900; line-height: 1.22; }
.big em { font-style: normal; color: ${th.gold}; }
.sub { margin-top: 36px; font-size: 38px; color: ${th.muted}; }
.title { font-size: 64px; font-weight: 900; margin: 56px 0 36px; }
.card { background: #ffffff0a; border: 2px solid ${th.gold}44; border-radius: 32px; padding: 44px; }
.p { font-size: 40px; line-height: 1.75; color: #dfe6e1; }
.name { font-size: 120px; font-weight: 900; }
.era { font-size: 34px; color: ${th.muted}; margin-top: 8px; }
.tags { display: flex; gap: 20px; justify-content: center; margin: 36px 0; }
.tags span { border: 2px solid ${th.gold}88; color: ${th.gold}; border-radius: 999px; padding: 10px 32px; font-size: 34px; }
.quote { font-size: 44px; color: ${th.accent}; margin: 12px 0 40px; }
.ring { width: 280px; height: 280px; border-radius: 50%; display: grid; place-items: center;
  background: radial-gradient(circle, #4d4128, #221c12 75%); border: 2px solid ${th.gold}66; }
.ladder { display: grid; gap: 18px; margin-top: 20px; }
.rung { display: flex; align-items: center; gap: 28px; padding: 16px 28px; border-radius: 24px; border: 2px solid ${th.line}; background: #ffffff06; }
.rung.on { border-color: ${th.gold}; background: ${th.gold}1f; }
.rung .lv { font-size: 30px; color: ${th.gold}; width: 80px; }
.rung b { font-size: 42px; }
.rung small { display: block; font-size: 28px; color: ${th.muted}; }
.opt { display: flex; gap: 24px; align-items: center; border: 2px solid ${th.line}; border-radius: 26px; padding: 26px 30px; font-size: 38px; margin-top: 22px; }
.opt i { font-style: normal; width: 64px; height: 64px; border-radius: 16px; display: grid; place-items: center; background: ${th.accent}2a; color: ${th.accent}; font-weight: 800; flex: none; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; }
.cell { border: 2px solid ${th.line}; border-radius: 20px; padding: 10px 22px; }
.cell b { font-size: 36px; }
.cell small { display: block; font-size: 24px; color: ${th.muted}; }
.rels { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.rels .card { text-align: center; }
.rels .lab { font-size: 32px; color: ${th.muted}; }
.rels .who { font-size: 64px; font-weight: 900; margin: 16px 0 8px; }
.rels .ali { font-size: 32px; color: ${th.gold}; }
.cta { font-size: 56px; font-weight: 900; color: ${th.accent}; margin-top: 36px; }
.small { font-size: 26px; color: ${th.muted}; margin-top: 28px; line-height: 1.6; }
`;

const page = (body, idx, total) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="frame"><div class="head"><span>${esc(test.brand)}</span><span>${idx}/${total}</span></div>${body}
<div class="foot">${esc(test.brand)} · ${esc(N.series)}</div></div></body></html>`;

const S = {
  // 字号按最长一行自适应，保证不折行
  cover: (l1, l2, sub) => {
    const size = Math.min(112, Math.floor(800 / Math.max([...l1].length, [...l2].length)));
    return `<div class="center"><div class="big" style="font-size:${size}px">${esc(l1)}<br><em>${esc(l2)}</em></div><div class="sub">${esc(sub)}</div></div>`;
  },
  persona: (t) => `<div class="center"><div class="name">${esc(t.name)}</div><div class="era">${esc(t.era)} · ${esc(t.alias)}</div>
    <div class="tags">${t.tags.map((x) => `<span>${esc(x)}</span>`).join('')}</div><div class="quote">“${esc(t.quote)}”</div>
    <div class="card p" style="text-align:left">${esc(t.portrait)}</div></div>`,
  text: (title, text) => `<div class="center" style="align-items:stretch;text-align:left"><div class="title" style="margin-top:0">${esc(title)}</div><div class="card p" style="font-size:48px">${esc(text)}</div></div>`,
  rels: (t, buddy, rival) => `<div class="center" style="align-items:stretch;text-align:left"><div class="title" style="margin-top:0">${esc(t.name)}型的搭子和天敌</div><div class="rels">
    <div class="card"><div class="lab">${esc(test.relations.buddy.label)}</div><div class="who">${esc(buddy.name)}</div><div class="ali">${esc(buddy.alias)}</div></div>
    <div class="card"><div class="lab">${esc(test.relations.rival.label)}</div><div class="who">${esc(rival.name)}</div><div class="ali">${esc(rival.alias)}</div></div></div>
    <div class="p" style="margin-top:44px">${esc(test.relations.buddy.why)}</div><div class="p" style="margin-top:20px">${esc(test.relations.rival.why)}</div></div>`,
  ladder: (on) => `<div class="title">韭菜段位天梯</div><div class="ladder">${tiersDesc
    .map((t) => `<div class="rung${t.level === on ? ' on' : ''}"><span class="lv">Lv.${t.level}</span>${icon(t.icon, 72)}<div><b>${esc(t.name)}</b><small>「${esc(t.sub)}」</small></div></div>`)
    .join('')}</div>`,
  tier: (t) => `<div class="center"><div class="ring">${icon(t.icon, 200)}</div><div class="era" style="color:${th.gold};margin-top:36px">Lv.${t.level}</div>
    <div class="name" style="font-size:96px">${esc(t.name)}</div><div class="quote" style="color:${th.gold}">「${esc(t.sub)}」</div><div class="card p" style="text-align:left">${esc(t.desc)}</div></div>`,
  question: (q) => `<div class="title">先来一道题</div><div class="p" style="font-weight:700;color:${th.text}">${esc(q.q)}</div>
    ${q.options.map((o, i) => `<div class="opt"><i>${'ABCD'[i]}</i>${esc(o.t)}</div>`).join('')}<div class="small">你选哪个？评论区见</div>`,
  grid: () => `<div class="title" style="margin:40px 0 24px">${esc(N.series)}</div><div class="grid">${typeEntries
    .map(([c, t]) => `<div class="cell"><b>${esc(t.name)}</b><small>${esc(t.alias)} · ${esc(c)}</small></div>`)
    .join('')}</div>`,
  cta: () => `<div class="center"><div class="big" style="font-size:84px">你是哪种韭菜？<br><em>又是哪一位？</em></div>
    <div class="p" style="margin-top:48px">12 道盘面情境题<br>测出你的韭菜段位 + 人格底色<br>不用登录，不收集任何个人信息</div>
    <div class="cta">${esc(N.cta)}</div><div class="small">纯属娱乐，非专业测评，不构成任何投资建议</div></div>`,
};

// —— 笔记清单 ——
const notes = [];
notes.push({
  slug: '00-总览',
  title: `${N.series}，你是哪一位？`,
  body: `把炒股的样子，对应到 16 位历史人物身上：\n${typeEntries.slice(0, 6).map(([, t]) => `· ${t.name}型：${t.hook}`).join('\n')}\n……\n\n12 道盘面情境题，测出你的韭菜段位和人格底色。\n${N.cta}\n（纯属娱乐，非专业测评，不构成任何投资建议）`,
  slides: [S.cover(N.series, '你是哪一位？', '曹操、诸葛亮、司马懿、李白、刘禅……'), S.grid(), S.ladder(0), S.cta()],
});
for (const [code, t] of typeEntries) {
  const buddy = test.types[flip(test, code, test.relations.buddy.flip)];
  const rival = test.types[flip(test, code, test.relations.rival.flip)];
  notes.push({
    slug: `人格-${t.name}`,
    title: `测出${t.name}型的人，都${t.hook}`,
    body: `${t.era.split(' · ')[0]}的${t.name}，放到今天的股市里，大概是这样的：\n\n${t.portrait}\n\nTA 的盲点也很真实：${t.moment}\n\n搭子是${buddy.name}型，天敌是${rival.name}型。\n12 道盘面情境题，测测你和哪位历史人物同一种「人格底色」。\n${N.cta}\n（纯属娱乐，非专业测评，不构成任何投资建议）`,
    slides: [S.cover(`测出${t.name}型的人`, `都${t.hook}`, `${t.era} · ${t.alias}`), S.persona(t), S.text(`${t.name}型的盲点`, t.moment), S.rels(t, buddy, rival), S.ladder(0), S.cta()],
  });
}
for (const t of tiersDesc) {
  notes.push({
    slug: `段位-Lv${t.level}-${t.name}`,
    title: `${t.name}，是怎么炼成的`,
    body: `韭菜段位 Lv.${t.level}：${t.name}「${t.sub}」\n\n${t.desc}\n\n6 档段位，从韭菜盒子到镰刀绝缘体，你在第几档？\n${N.cta}\n（纯属娱乐，非专业测评，不构成任何投资建议）`,
    slides: [S.cover(t.name, '是怎么炼成的', `韭菜段位 Lv.${t.level}`), S.tier(t), S.ladder(t.level), S.question(test.questions[N.sampleQuestion]), S.cta()],
  });
}

// —— 商品素材（主图 + 详情图 + 上架文案）——
const SH = test.shop;
const perks = test.paywall.perks;
const shopSlides = [
  `<div class="center"><div class="ring">${icon('crown', 200)}</div><div class="big" style="font-size:96px;margin-top:48px">${esc(test.brand)}</div>
    <div class="quote" style="color:${th.gold};margin-top:24px">${esc(N.series)} · 完整人格报告</div><div class="sub">兑换码 · 自动发货 · 不用登录</div></div>`,
  `<div class="title">完整报告里有什么</div><div class="ladder">${perks.map((x, i) => `<div class="rung"><span class="lv">0${i}</span><div><b>${esc(x)}</b></div></div>`).join('')}</div>`,
  `<div class="title">怎么使用</div><div class="ladder">${[
    ['1', '下单后自动收到兑换码和使用说明'],
    ['2', '按说明用手机浏览器打开测试页'],
    ['3', '做完 12 道题，免费领段位卡'],
    ['4', '输入兑换码，解锁完整人格报告'],
  ].map(([n, x]) => `<div class="rung"><span class="lv">${n}</span><div><b style="font-size:38px">${esc(x)}</b></div></div>`).join('')}</div>
    <div class="small">一个兑换码可在 ${SH.maxDevices} 台设备上使用</div>`,
  `<div class="title">购买须知</div><div class="card p" style="font-size:38px">· 娱乐向人格测试，非专业心理测评<br>· 不构成任何投资建议<br>· 不需要登录，不收集任何个人信息<br>· 虚拟商品，兑换码发出后不支持无理由退款<br>· 遇到问题请私信店铺客服</div>`,
];
const shopCopy = `【商品标题】
${SH.title}

【价格】
${SH.price} 元

【商品详情文案】
12 道盘面情境题，测出你的「韭菜段位」，再从 ${N.series}里找到和你同一种人格底色的历史人物。
完整报告包含：${perks.join('、')}。
下单后自动发送兑换码和使用说明，用手机浏览器打开即可，不用登录，不收集个人信息。
娱乐向人格测试，非专业心理测评，不构成任何投资建议。

【自动发货内容（卡券模板，{卡密} 处由系统填入兑换码）】
感谢购买🌱
你的兑换码：{卡密}

使用方法：
1. 复制网址，用手机浏览器打开：${SH.url}
2. 做完 12 道题，在结果页底部输入兑换码
3. 解锁完整人格报告（一个兑换码可在 ${SH.maxDevices} 台设备上使用）

打不开或兑换失败，直接私信店铺～

【客服快捷回复】
Q 兑换码提示无效？
A 请检查有没有多复制空格，兑换码格式是 ${test.paywall.placeholder.replace(/^.*如 /, '')}。还不行把兑换码发给我，帮你查～

Q 提示次数用完？
A 一个码可在 ${SH.maxDevices} 台设备使用。把兑换码发我，帮你加一次～（后台：mm extend 兑换码）

Q 网页打不开？
A 请用手机自带浏览器（Safari / Chrome 等）打开发货消息里的地址；或者切换一下 Wi-Fi / 流量试试。

Q 测得不准？
A 这是娱乐向的人格测试，结果只反映你这 12 道题的作答风格～换个心情再测一次也可以。

Q 可以退款吗？
A 虚拟商品兑换码发出后一般不支持无理由退款；如果码还没使用过，可以联系我处理。（后台：mm check 兑换码，看 uses 是否为 0，再用 mm revoke 作废后退款）
`;

// —— 检查文案 ——
let warn = 0;
for (const n of notes) {
  const len = [...n.title].length;
  if (len > 20) (warn++, console.log(`⚠️ 标题超过 20 字（${len}）：${n.title}`));
  const hit = lintText(n.title + n.body + n.slides.join(''));
  if (hit.length) (warn++, console.log(`⚠️ ${n.slug} 含高危词：${hit.join('、')}`));
}

{
  // 自动发货内容只有付款后才能看到，网址只能出现在这里；其余公开文案都要干净
  const publicCopy = shopCopy.replace(/【自动发货内容[\s\S]*?【客服快捷回复】/, '');
  const hit = lintText(publicCopy + shopSlides.join(''));
  if (hit.length) (warn++, console.log(`⚠️ 商品素材含高危词：${hit.join('、')}`));
  if (SH.url.includes('你的域名')) (warn++, console.log('⚠️ config.shop.url 还是占位网址，部署后改成真实域名再生成一次'));
}

// —— 截图 ——
let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.log('缺少 playwright-core，先运行 npm install');
  process.exit(1);
}
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.CHROME_PATH || (existsSync(MAC_CHROME) ? MAC_CHROME : undefined);
const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' });
const tab = await browser.newPage({ viewport: { width: 1080, height: 1440 } });
const outRoot = `out/notes/${id}`;
rmSync(outRoot, { recursive: true, force: true });
for (const n of notes) {
  const dir = `${outRoot}/${n.slug}`;
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < n.slides.length; i++) {
    await tab.setContent(page(n.slides[i], i + 1, n.slides.length));
    await tab.screenshot({ path: `${dir}/${String(i + 1).padStart(2, '0')}.png` });
  }
  writeFileSync(`${dir}/文案.txt`, `【标题】\n${n.title}\n\n【正文】\n${n.body}\n\n【话题】\n${N.tags.join(' ')}\n`);
}
mkdirSync(`${outRoot}/商品素材`, { recursive: true });
for (let i = 0; i < shopSlides.length; i++) {
  await tab.setContent(page(shopSlides[i], i + 1, shopSlides.length));
  await tab.screenshot({ path: `${outRoot}/商品素材/${String(i + 1).padStart(2, '0')}.png` });
}
writeFileSync(`${outRoot}/商品素材/上架文案.txt`, shopCopy);
await browser.close();
console.log(`已生成 ${notes.length} 篇笔记素材 → ${outRoot}/${warn ? `（${warn} 条提醒，见上方）` : ''}`);

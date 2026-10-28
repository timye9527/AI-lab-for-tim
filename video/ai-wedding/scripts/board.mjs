// 分镜表生成 + 自检：node video/ai-wedding/scripts/board.mjs
// 输出 分镜表.md、资产清单.md（入库）和 out/board.json（审片页数据，不入库）
// 时长按估算语速算；配音做完后改成读实际配音时长，时间码以实际为准
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHOTS, ACTS, TITLE } from '../storyboard.mjs';
import { ASSETS } from '../assets.mjs';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const RATE = 5.0; // 每秒音节数（约每分钟 300 字，B 站知识区常见语速），G3 样片实测后回填
const TAIL = 0.15; // 每个镜头口播后的气口

// 音节数：汉字 1 个算 1，AI 算 2，数字按中文读法
const NUM = { '30': 2, '12': 2 };
const syl = (s) => (s.match(/[一-龥]/g) || []).length
  + (s.match(/AI/g) || []).length * 2
  + (s.match(/\d+/g) || []).reduce((n, d) => n + (NUM[d] ?? d.length), 0);

const errs = [], warns = [];

// 1. 口播和口播稿逐字一致
// 和 video:lint 一样：第一个「## 」之前是说明，不算口播
const raw = readFileSync(join(DIR, '口播稿.md'), 'utf8');
const script = raw.slice(raw.indexOf('\n## ')).split('\n').filter((l) => l.startsWith('> ')).map((l) => l.slice(2).trim());
const vo = SHOTS.flatMap((s) => s.vo);
if (script.join('|') !== vo.join('|')) {
  const i = script.findIndex((l, k) => l !== vo[k]);
  errs.push(`口播和口播稿.md 第 ${i + 1} 行不一致：「${script[i]}」vs「${vo[i]}」`);
}

// 2. 资产编号都存在
const ids = new Set(ASSETS.map((a) => a.id));
for (const s of SHOTS) for (const a of s.assets) if (!ids.has(a.split('-')[0])) errs.push(`${s.id} 引用了不存在的资产 ${a}`);

// 3. 假设数字必须挂角标；三次反转按顺序各一次
for (const s of SHOTS) {
  const t = s.tag || [];
  if (t.includes('hypo') && !/假设|示意/.test(s.text)) errs.push(`${s.id} 有假设数字但屏幕文字没写「假设」角标`);
  if (/\d{2,}/.test(s.text) && !t.includes('hypo') && !/人|格|×/.test(s.text)) warns.push(`${s.id} 屏幕上有数字，确认是不是假设数字`);
}
const revs = SHOTS.flatMap((s) => (s.tag || []).filter((x) => /^rev/.test(x)));
if (revs.join() !== 'rev1,rev2,rev3') errs.push(`三次反转顺序不对：${revs.join()}`);

// 4. 时间码
let t = 0;
const rows = SHOTS.map((s) => {
  const n = s.vo.reduce((k, v) => k + syl(v), 0);
  const dur = Math.round((n / RATE + (s.vo.length ? TAIL : 0) + (s.hold || 0)) * 10) / 10;
  const r = { ...s, start: t, dur, n };
  t += dur;
  // 长镜头要在画面描述里写出多个变化节点
  if (dur > 6.5 && !/→|；|依次|一个个|一块块|一张张|三格|四格|分屏|三连/.test(s.visual)) warns.push(`${s.id} ${dur} 秒：画面里要有 2 个以上的变化节点（防 6 秒不动）`);
  return r;
});
const total = t;

const tc = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${(x % 60).toFixed(1).padStart(4, '0')}`;
const actName = Object.fromEntries(ACTS.map((a) => [a.id, a.name]));
const REV = { rev1: '反转① 效率提升', rev2: '反转② 降价竞争', rev3: '反转③ 模式转型' };
const tagText = (s) => (s.tag || []).map((x) => REV[x] || { key: '关键画面', hypo: '假设数字' }[x]).join('、');

// ── 分镜表.md ──
const esc = (x) => String(x).replace(/\|/g, '｜');
let md = `# 分镜表 ·《${TITLE}》\n\n`;
md += `> 由 \`scripts/board.mjs\` 从 \`storyboard.mjs\` 生成，别手改。16:9，1920×1080，30fps。\n`;
md += `> 时间码按估算语速（每秒 ${RATE} 个音节）算，**全片约 ${tc(total)}**，${SHOTS.length} 个镜头；配音做完后按实际时长重算。\n`;
md += `> 标记：★ 关键画面；①②③ 三次反转；【假设】画面出现假设数字（必须挂角标）。\n\n`;
for (const a of ACTS) {
  const rs = rows.filter((r) => r.act === a.id);
  const end = rs.at(-1).start + rs.at(-1).dur;
  md += `## ${a.name}（${tc(rs[0].start)}–${tc(end)}，${(end - rs[0].start).toFixed(0)} 秒）\n\n`;
  md += '| 镜号 | 时间码 | 秒 | 旁白 | 画面 | 景别 · 镜头运动 | 音效 · 音乐 | 屏幕文字 | 资产 |\n|---|---|---|---|---|---|---|---|---|\n';
  for (const r of rs) {
    const mark = (r.tag || []).map((x) => ({ rev1: '①', rev2: '②', rev3: '③', key: '★', hypo: '【假设】' }[x])).join('');
    md += `| ${r.id}${mark ? ' ' + mark : ''} | ${tc(r.start)} | ${r.dur} | ${esc(r.vo.join('') || '（无旁白）')} | ${esc(r.visual)} | ${esc(r.size)} · ${esc(r.camera)} | ${esc(r.sfx)} | ${esc(r.text)} | ${r.assets.join(' ')} |\n`;
  }
  md += '\n';
}
writeFileSync(join(DIR, '分镜表.md'), md);

// ── 资产清单.md：每样资产被哪些镜头用到（复用次数越多越要先做、做精）──
const used = Object.fromEntries(ASSETS.map((a) => [a.id, []]));
for (const s of SHOTS) for (const a of new Set(s.assets.map((x) => x.split('-')[0]))) used[a].push(s.id);
let am = `# 资产清单 ·《${TITLE}》\n\n> 由 \`scripts/board.mjs\` 从 \`assets.mjs\` 和 \`storyboard.mjs\` 生成，别手改。共 ${ASSETS.length} 项。\n\n`;
for (const type of [...new Set(ASSETS.map((a) => a.type))]) {
  am += `## ${type}\n\n| 编号 | 名称 | 说明 | 用到的镜头 | 次数 |\n|---|---|---|---|---|\n`;
  for (const a of ASSETS.filter((x) => x.type === type)) am += `| ${a.id} | ${a.name} | ${esc(a.desc)} | ${used[a.id].join(' ') || '（片中未用）'} | ${used[a.id].length} |\n`;
  am += '\n';
}
writeFileSync(join(DIR, '资产清单.md'), am);
for (const a of ASSETS) if (!used[a.id].length) warns.push(`资产 ${a.id} ${a.name} 没有镜头用到`);

// ── 审片页数据（out/board.json，给 board.html 用）──
mkdirSync(join(DIR, 'out'), { recursive: true });
const data = {
  title: TITLE, total: tc(total), rate: RATE, count: SHOTS.length,
  acts: ACTS.map((a) => {
    const rs = rows.filter((r) => r.act === a.id);
    return { ...a, start: tc(rs[0].start), secs: Math.round(rs.reduce((k, r) => k + r.dur, 0)) };
  }),
  shots: rows.map((r) => ({ id: r.id, act: r.act, actName: actName[r.act], tc: tc(r.start), start: r.start, dur: r.dur, vo: r.vo.join(''), visual: r.visual, size: r.size, camera: r.camera, sfx: r.sfx, text: r.text, assets: r.assets, tag: r.tag || [], tagText: tagText(r) })),
  assets: ASSETS.map((a) => ({ ...a, used: used[a.id] })),
};
writeFileSync(join(DIR, 'out/board.json'), JSON.stringify(data));

console.log(`镜头 ${SHOTS.length} 个，口播 ${vo.length} 行 / ${rows.reduce((k, r) => k + r.n, 0)} 音节，估算全片 ${tc(total)}`);
for (const a of data.acts) console.log(`  ${a.start} ${a.name}  ${a.secs} 秒`);
for (const w of warns) console.log('△ ' + w);
for (const e of errs) console.log('✗ ' + e);
if (errs.length) process.exit(1);
console.log('✓ 自检通过');

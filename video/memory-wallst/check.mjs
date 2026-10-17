// 存储视频自检：事实保鲜 + 脚本引用 + 时长 + 违禁词（零依赖）
// 用法：node video/memory-wallst/check.mjs [YYYY-MM-DD]
import { readFileSync } from 'node:fs';

const dir = new URL('./', import.meta.url);
const today = process.argv[2] || new Date().toISOString().slice(0, 10);
const RATE = 270; // 口播字/分钟
const SOON = 14; // 多少天内要更新算「即将到期」

// 简单 CSV 解析，支持双引号
function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...data] = rows.filter(r => r.some(Boolean));
  return data.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const facts = parseCSV(readFileSync(new URL('facts.csv', dir), 'utf8'));
const byId = Object.fromEntries(facts.map(f => [f.id, f]));
const script = readFileSync(new URL('02-脚本-10分钟.md', dir), 'utf8');
const days = d => Math.round((Date.parse(d) - Date.parse(today)) / 864e5);
const errors = [], warns = [];

// 1. 分段估时
const toSec = s => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };
let total = 0;
console.log(`\n== 分段时长（${RATE} 字/分钟）==`);
const used = new Set();
for (const block of script.split(/^## /m).slice(1)) {
  const title = block.split('\n')[0];
  const lines = block.split('\n').filter(l => l.startsWith('> '));
  const text = lines.join('');
  for (const m of text.matchAll(/\[(F\d+)\]/g)) used.add(m[1]);
  const words = (text.replace(/\[F\d+\]|【[^】]*】/g, '').match(/[\p{Script=Han}A-Za-z0-9]/gu) || []).length;
  const sec = Math.round(words / RATE * 60);
  total += sec;
  const win = title.match(/\[(\d+:\d+)-(\d+:\d+)\]/);
  const plan = win ? toSec(win[2]) - toSec(win[1]) : 0;
  const flag = plan && Math.abs(sec - plan) > Math.max(10, plan * 0.2) ? '  ← 偏差大' : '';
  console.log(`${String(words).padStart(4)} 字 ≈ ${String(sec).padStart(3)} 秒（计划 ${plan} 秒）${title}${flag}`);
  if (/冷开场/.test(title) && sec > 30) warns.push(`冷开场估时 ${sec} 秒，超过 30 秒`);
  for (const l of lines) {
    const n = (l.replace(/\[F\d+\]/g, '').match(/[\p{Script=Han}A-Za-z0-9]/gu) || []).length;
    if (n > 30) warns.push(`单句过长（${n} 字）：${l.slice(2, 26)}…`);
  }
}
console.log(`合计约 ${Math.floor(total / 60)} 分 ${total % 60} 秒`);

// 2. 脚本引用的事实
console.log('\n== 脚本引用的事实 ==');
for (const id of [...used].sort()) {
  const f = byId[id];
  if (!f) { errors.push(`${id} 不在 facts.csv 里`); continue; }
  if (f.verify === '不上屏' || f.verify === '过期') errors.push(`${id} 标记为「${f.verify}」，不能进脚本`);
  else if (f.verify !== '已核') warns.push(`${id}【${f.verify}·${f.tier}】${f.fact.slice(0, 30)}`);
  if (f.stale_after && days(f.stale_after) < 0) errors.push(`${id} 已过保鲜期（${f.stale_after}），录制前必须更新：${f.fact.slice(0, 30)}`);
}
console.log(`共 ${used.size} 条；已核 ${[...used].filter(id => byId[id]?.verify === '已核').length} 条`);

// 3. 全台账保鲜：过期 + 即将有新数据
console.log(`\n== 保鲜提醒（今天 ${today}）==`);
for (const f of facts) {
  if (f.stale_after && days(f.stale_after) < 0 && !used.has(f.id)) console.log(`过期    ${f.id} ${f.fact.slice(0, 36)}`);
  if (f.refresh_on) {
    const d = days(f.refresh_on);
    if (d < 0) console.log(`待更新  ${f.id} 新数据已在 ${f.refresh_on} 发布，去更新：${f.fact.slice(0, 30)}`);
    else if (d <= SOON) console.log(`${d} 天后  ${f.id} ${f.refresh_on} 有新数据：${f.fact.slice(0, 30)}`);
  }
}

// 4. 合规违禁词（只查口播）
const body = script.slice(script.search(/^## /m));
const spoken = body.split('\n').filter(l => l.startsWith('> ')).join('\n');
for (const w of ['买入', '卖出', '稳赚', '必涨', '目标价', '抄底', '满仓', '推荐', '保本', '翻倍', '风险测评', '代码']) {
  if (spoken.includes(w)) errors.push(`口播出现违禁词「${w}」`);
}
if (!/不构成任何投资建议/.test(spoken)) errors.push('口播缺少免责声明');

if (warns.length) console.log(`\n== 提醒（${warns.length}）==\n` + warns.map(w => '· ' + w).join('\n'));
if (errors.length) {
  console.log(`\n== 必须处理（${errors.length}）==\n` + errors.map(e => '✗ ' + e).join('\n'));
  process.exit(1);
}
console.log('\n通过：没有阻断项。');

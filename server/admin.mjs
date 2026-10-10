// 管理工具（在服务器上运行）
//   node server/admin.mjs gen <测试id> <数量> [--prefix JC] [--max 3]   生成兑换码，写入数据库 + 导出 CSV 给店铺
//   node server/admin.mjs import <csv文件> <测试id> [--max 3]           把已有的码导入数据库
//   node server/admin.mjs add <统一码> <测试id> [--max 1000000]        建一个所有买家共用的统一码（配合店铺固定发货文案）
//   node server/admin.mjs stats [--days 14] [--test jiucai]             每日转化漏斗 + 兑换码库存
//   node server/admin.mjs check <兑换码>                                客服：查一个码的使用情况
//   node server/admin.mjs extend <兑换码> [次数]                         客服：给一个码加次数（默认 +1）
//   node server/admin.mjs revoke <兑换码>                               作废一个码（如退款）
//   node server/admin.mjs backup                                       备份数据库到 backup/（建议每天定时跑）
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { openDb, makeCodes, insertCodes, EVENTS } from './db.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const flags = {};
const args = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) flags[rest[i].slice(2)] = rest[++i];
  else args.push(rest[i]);
}
const db = openDb();
const stamp = () => new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');

function usage() {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(1);
}

if (cmd === 'gen') {
  const [test, countArg] = args;
  const count = Number(countArg);
  const max = Number(flags.max || 3);
  if (!test || !(count > 0)) usage();
  const batch = `${test}-${stamp()}`;
  const codes = makeCodes(count, flags.prefix || 'MM');
  const n = insertCodes(db, codes, test, max, batch);
  mkdirSync('codes', { recursive: true });
  writeFileSync(`codes/${batch}.csv`, codes.join('\n') + '\n');
  console.log(`已生成并入库 ${n} 个兑换码（每个最多 ${max} 台设备）\n导出文件：codes/${batch}.csv（一行一个，直接上传到店铺卡券库存）`);
} else if (cmd === 'import') {
  const [file, test] = args;
  if (!file || !test) usage();
  const codes = readFileSync(file, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && s !== 'code');
  const n = insertCodes(db, codes, test, Number(flags.max || 3), `${test}-import-${stamp()}`);
  console.log(`导入 ${n} 个（跳过重复 ${codes.length - n} 个）`);
} else if (cmd === 'add') {
  const [code, test] = args;
  if (!code || !test || !/^[A-Za-z0-9-]{6,32}$/.test(code)) {
    console.log('统一码要求 6～32 位字母、数字或短横线，如 JC2026');
    usage();
  }
  const n = insertCodes(db, [code], test, Number(flags.max || 1000000), `${test}-shared-${stamp()}`);
  console.log(n ? `已建统一码 ${code.toUpperCase()}（可用 ${flags.max || 1000000} 次）。泄露了就 revoke 它，再 add 一个新的，并同步改店铺发货文案。` : '这个码已存在');
} else if (cmd === 'stats') {
  const days = Number(flags.days || 14);
  const where = flags.test ? 'AND test = ?' : '';
  const params = flags.test ? [flags.test] : [];
  const rows = db.prepare(`SELECT day, ev, SUM(n) AS n FROM events WHERE day >= date('now', '+8 hours', ?) ${where} GROUP BY day, ev ORDER BY day`).all(`-${days} days`, ...params);
  const byDay = {};
  for (const r of rows) (byDay[r.day] ||= {})[r.ev] = r.n;
  const redeemed = db.prepare(`SELECT date(first_used_at, '+8 hours') AS day, COUNT(*) AS n FROM codes WHERE first_used_at IS NOT NULL ${where} GROUP BY day`).all(...params);
  const red = Object.fromEntries(redeemed.map((r) => [r.day, r.n]));
  const label = { view: '打开', start: '开测', finish: '测完', poster: '存卡', unlock: '解锁' };
  console.log(['日期      ', ...EVENTS.map((e) => label[e]), '新码使用', '测完率', '解锁率'].join('\t'));
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '-');
  for (const day of Object.keys({ ...byDay, ...red }).sort()) {
    const d = byDay[day] || {};
    console.log([day, ...EVENTS.map((e) => d[e] || 0), red[day] || 0, pct(d.finish || 0, d.start || 0), pct(d.unlock || 0, d.finish || 0)].join('\t'));
  }
  const inv = db.prepare(`SELECT test, COUNT(*) AS total, SUM(uses > 0) AS used FROM codes WHERE 1 ${where} GROUP BY test`).all(...params);
  console.log('\n兑换码库存：');
  for (const r of inv) console.log(`  ${r.test}：共 ${r.total}，已使用 ${r.used}，未使用 ${r.total - r.used}${r.total - r.used < 50 ? '  ← 快不够了，记得补货' : ''}`);
} else if (cmd === 'check') {
  const row = db.prepare('SELECT * FROM codes WHERE code = ?').get(String(args[0] || '').toUpperCase());
  console.log(row || '查无此码');
} else if (cmd === 'extend') {
  const r = db.prepare('UPDATE codes SET max_uses = max_uses + ? WHERE code = ?').run(Number(args[1] || 1), String(args[0] || '').toUpperCase());
  console.log(r.changes ? '已加次数' : '查无此码');
} else if (cmd === 'revoke') {
  const r = db.prepare('UPDATE codes SET max_uses = uses WHERE code = ?').run(String(args[0] || '').toUpperCase());
  console.log(r.changes ? '已作废（已解锁的设备不受影响）' : '查无此码');
} else if (cmd === 'backup') {
  mkdirSync('backup', { recursive: true });
  const file = `backup/app-${stamp()}.db`;
  db.exec(`VACUUM INTO '${file}'`);
  console.log(`已备份到 ${file}`);
} else usage();

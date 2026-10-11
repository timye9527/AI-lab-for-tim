// 不用服务器的兑换码：生成一批码，明文 CSV 留在本地（上传店铺用），哈希写进网站的码表
// 用法：npm run codes:static -- <测试id> <数量> [--prefix JC]
//   输出：codes/<批次>.csv（明文，不要提交、不要外传）
//         public/tests/<测试id>/codes.json（只有哈希，随网站一起部署）
// 追加新批次会保留旧码；作废某个码：从 codes.json 里删掉它的哈希（npm run codes:static -- hash <测试id> <兑换码> 可算出哈希）
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { makeCodes } from '../server/db.mjs';

const hash = (test, code) => createHash('sha256').update(`${test}:${code.trim().toUpperCase()}`).digest('hex').slice(0, 12);
const args = process.argv.slice(2);

if (args[0] === 'hash') {
  console.log(hash(args[1], args[2]));
  process.exit(0);
}

const [test, countArg] = args;
const prefix = args.includes('--prefix') ? args[args.indexOf('--prefix') + 1] : 'MM';
const count = Number(countArg);
if (!test || !(count > 0) || !existsSync(`public/tests/${test}`)) {
  console.log('用法：npm run codes:static -- <测试id> <数量> [--prefix JC]');
  process.exit(1);
}

const file = `public/tests/${test}/codes.json`;
const table = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { hashes: [] };
const codes = makeCodes(count, prefix);
const batch = `${test}-static-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`;
mkdirSync('codes', { recursive: true });
writeFileSync(`codes/${batch}.csv`, codes.join('\n') + '\n');
table.hashes = [...new Set([...table.hashes, ...codes.map((c) => hash(test, c))])];
writeFileSync(file, JSON.stringify(table) + '\n');
console.log(`已生成 ${count} 个兑换码：codes/${batch}.csv（明文，上传店铺用）\n码表 ${file} 现共 ${table.hashes.length} 个，重新部署网站后生效`);

// 生成一批兑换码
// 用法：node scripts/gen-codes.mjs <测试id> <数量> [前缀] [每码可用设备数]
//   例：node scripts/gen-codes.mjs jiucai 500 JC 3
// 输出到 codes/（已被 .gitignore 忽略，不要提交）：
//   *.csv  → 上传到店铺做卡密 / 自动发货
//   *.sql  → npx wrangler d1 execute make-money-test --remote --file=codes/xxx.sql
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';

const [test, countArg, prefix = 'MM', maxArg = '3'] = process.argv.slice(2);
const count = Number(countArg);
const maxUses = Number(maxArg);
if (!test || !(count > 0) || !(maxUses > 0)) {
  console.log('用法：node scripts/gen-codes.mjs <测试id> <数量> [前缀] [每码可用设备数]');
  process.exit(1);
}

// 去掉 0/O/1/I/L 这类容易看错的字符
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const part = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
const codes = new Set();
while (codes.size < count) codes.add(`${prefix}-${part()}-${part()}`);

const batch = `${test}-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`;
mkdirSync('codes', { recursive: true });
const list = [...codes];
writeFileSync(`codes/${batch}.csv`, 'code\n' + list.join('\n') + '\n');
writeFileSync(
  `codes/${batch}.sql`,
  list.map((c) => `INSERT INTO codes (code, test, max_uses, batch) VALUES ('${c}', '${test}', ${maxUses}, '${batch}');`).join('\n') + '\n',
);
console.log(`已生成 ${count} 个兑换码：codes/${batch}.csv / .sql`);

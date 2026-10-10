// 校验测试配置 + 模拟作答看分布
// 用法：node scripts/check.mjs [测试id]   默认检查 public/tests 下全部
import { readdirSync } from 'node:fs';
import { score, flip } from '../public/engine/score.js';
import { lintText } from './lint-words.mjs';

const ids = process.argv[2] ? [process.argv[2]] : readdirSync(new URL('../public/tests/', import.meta.url));
let failed = false;
const fail = (msg) => {
  failed = true;
  console.log('  ✗ ' + msg);
};

for (const id of ids) {
  const test = (await import(`../public/tests/${id}/config.js`)).default;
  console.log(`\n【${test.title}】${id}`);

  // 1. 结构检查
  const codes = test.dims.reduce((acc, d) => acc.flatMap((c) => [c + d.pos, c + d.neg]), ['']);
  for (const c of codes) if (!test.types[c]) fail(`缺少类型 ${c}`);
  for (const c of Object.keys(test.types)) if (!codes.includes(c)) fail(`多余类型 ${c}`);
  for (const [c, t] of Object.entries(test.types)) {
    for (const f of ['name', 'alias', 'era', 'quote', 'portrait', 'fact', 'moment']) if (!t[f]) fail(`${c} 缺 ${f}`);
    if (t.tags?.length !== 3) fail(`${c} 标签应为 3 个`);
    if (t.tips?.length !== 3) fail(`${c} 反割建议应为 3 条`);
  }
  const dimKeys = test.dims.map((d) => d.key);
  test.questions.forEach((q, i) => {
    q.options.forEach((o, j) => {
      for (const k of Object.keys(o.s || {})) if (!dimKeys.includes(k)) fail(`第${i + 1}题选项${j + 1} 未知维度 ${k}`);
      for (const k of Object.keys(o.m || {})) if (!test.meters[k]) fail(`第${i + 1}题选项${j + 1} 未知仪表 ${k}`);
    });
  });
  for (const d of test.dims) if (!d.posTrait || !d.negTrait) fail(`维度 ${d.label} 缺 posTrait / negTrait`);
  for (const r of Object.values(test.relations || {})) {
    if (!test.types[flip(test, codes[0], r.flip)]) fail(`关系 ${r.label} 推不出有效类型`);
  }

  // 合规词：段位、人物会出现在段位卡和笔记里，必须干净（题目是虚构情境，不扫）
  for (const t of test.tiers) {
    const hit = lintText(JSON.stringify(t));
    if (hit.length) fail(`段位 ${t.name} 含高危词：${hit.join('、')}`);
  }
  for (const [c, t] of Object.entries(test.types)) {
    const hit = lintText(JSON.stringify(t));
    if (hit.length) fail(`人格 ${c}（${t.name}）含高危词：${hit.join('、')}`);
  }

  // 2. 维度两极是否大致对称（每个维度正负分加总）
  for (const d of test.dims) {
    let pos = 0, neg = 0;
    for (const q of test.questions) for (const o of q.options) {
      const v = o.s?.[d.key] || 0;
      if (v > 0) pos += v; else neg -= v;
    }
    console.log(`  维度 ${d.label}：${d.pos} +${pos} / ${d.neg} -${neg}`);
  }

  // 3. 模拟随机作答
  const N = 20000;
  const typeCount = {}, tierCount = {};
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let n = 0; n < N; n++) {
    const answers = test.questions.map((q) => Math.floor(rand() * q.options.length));
    const r = score(test, answers);
    typeCount[r.code] = (typeCount[r.code] || 0) + 1;
    tierCount[r.tier.name] = (tierCount[r.tier.name] || 0) + 1;
  }
  console.log('  随机作答 · 类型分布：');
  for (const c of codes) {
    const p = ((typeCount[c] || 0) / N) * 100;
    console.log(`    ${c} ${test.types[c]?.name.padEnd(5, '　')} ${p.toFixed(1).padStart(5)}% ${'▇'.repeat(Math.round(p))}`);
    if (!typeCount[c]) fail(`类型 ${c} 随机作答从未出现`);
  }
  console.log('  随机作答 · 段位分布：');
  for (const t of [...test.tiers].sort((a, b) => a.min - b.min)) {
    const p = ((tierCount[t.name] || 0) / N) * 100;
    console.log(`    ${t.name.padEnd(10, '　')} ${p.toFixed(1).padStart(5)}% ${'▇'.repeat(Math.round(p))}`);
  }

  // 4. 极端作答：全选最佳 / 全选最差，段位应在两头
  const pick = (fn) => test.questions.map((q) => q.options.reduce((best, o, i) => (fn(o) > fn(q.options[best]) ? i : best), 0));
  const best = score(test, pick((o) => (o.m?.disc || 0) - (o.m?.heat || 0)));
  const worst = score(test, pick((o) => (o.m?.heat || 0) - (o.m?.disc || 0)));
  console.log(`  全选最稳：${best.tier.name} · ${best.type.name}（${best.match}%）`);
  console.log(`  全选最上头：${worst.tier.name} · ${worst.type.name}（${worst.match}%）`);
  if (best.tier.level !== Math.max(...test.tiers.map((t) => t.level))) fail('全选最稳没拿到最高段位');
  if (worst.tier.level !== Math.min(...test.tiers.map((t) => t.level))) fail('全选最上头没落到最低段位');
}

console.log(failed ? '\n有问题，见上方 ✗' : '\n全部通过');
process.exit(failed ? 1 : 0);

// 纯计分逻辑：浏览器和 node 校验脚本共用，不碰 DOM

// answers: 每题选中的选项下标数组
export function score(test, answers) {
  const dimSum = Object.fromEntries(test.dims.map((d) => [d.key, 0]));
  const dimMax = Object.fromEntries(test.dims.map((d) => [d.key, 0]));
  const meterSum = Object.fromEntries(Object.keys(test.meters).map((k) => [k, 0]));
  const meterMax = Object.fromEntries(Object.keys(test.meters).map((k) => [k, 0]));

  test.questions.forEach((q, qi) => {
    // 每题各维度能拿到的最大绝对值，用于归一化
    for (const d of test.dims) {
      dimMax[d.key] += Math.max(...q.options.map((o) => Math.abs(o.s?.[d.key] || 0)));
    }
    for (const k of Object.keys(test.meters)) {
      meterMax[k] += Math.max(...q.options.map((o) => o.m?.[k] || 0));
    }
    const opt = q.options[answers[qi]];
    if (!opt) return;
    for (const [k, v] of Object.entries(opt.s || {})) dimSum[k] += v;
    for (const [k, v] of Object.entries(opt.m || {})) meterSum[k] += v;
  });

  // 每个维度取一极，拼成类型代码
  const poles = test.dims.map((d) => {
    const v = dimSum[d.key];
    if (v > 0) return d.pos;
    if (v < 0) return d.neg;
    return d.tie === 'pos' ? d.pos : d.neg;
  });
  const code = poles.join('');

  // 各维度偏向强度 0~1
  const strength = Object.fromEntries(
    test.dims.map((d) => [d.key, dimMax[d.key] ? Math.abs(dimSum[d.key]) / dimMax[d.key] : 0]),
  );
  // 偏向 pos 的程度 0~100，50 为中间
  const lean = Object.fromEntries(
    test.dims.map((d) => [d.key, dimMax[d.key] ? Math.round(50 + (dimSum[d.key] / dimMax[d.key]) * 50) : 50]),
  );
  // 按偏向强度排序，第一个就是「主导维度」
  const ranked = test.dims
    .map((d, i) => ({ dim: d, pole: poles[i], isPos: poles[i] === d.pos, strength: strength[d.key] }))
    .sort((a, b) => b.strength - a.strength);
  const avg = Object.values(strength).reduce((a, b) => a + b, 0) / test.dims.length;
  const [lo, hi] = test.matchRange || [76, 97];
  const match = Math.round(lo + avg * (hi - lo));

  const meters = Object.fromEntries(
    Object.keys(test.meters).map((k) => [k, meterMax[k] ? Math.round((meterSum[k] / meterMax[k]) * 100) : 0]),
  );

  const tierValue = test.tierBy(meters);
  // tiers 按 min 从高到低排，取第一个满足的
  const tier = [...test.tiers].sort((a, b) => b.min - a.min).find((t) => tierValue >= t.min) || test.tiers[0];

  return { code, type: test.types[code], dimSum, dimMax, strength, lean, ranked, match, meters, tier };
}

// 搭子 / 天敌：按 test.relations 里的翻转规则推出来
export function flip(test, code, keys) {
  const chars = [...code];
  test.dims.forEach((d, i) => {
    if (keys.includes(d.key)) chars[i] = chars[i] === d.pos ? d.neg : d.pos;
  });
  return chars.join('');
}

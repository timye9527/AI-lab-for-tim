// 出片前质检：配音回听结果、画面越界和孤字、字幕换行、高危词，汇总成质检报告。
// 必须修的问题（hard）没清零之前不出片，除非加 --force。
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { lintText } from '../../scripts/lint-words.mjs';

// 在页面里检查某一页全部元素出现后的版面
function inspectScene() {
  const sc = [...document.querySelectorAll('.scene')].find((n) => n.style.display !== 'none' && +n.style.opacity > 0.99);
  if (!sc) return ['找不到当前页'];
  const issues = [];
  const name = (el) => (el.textContent || el.className.baseVal || el.className || el.tagName).toString().replace(/\s+/g, '').slice(0, 14);
  const content = sc.querySelector('.content');
  for (const el of [sc.querySelector('.label'), ...content.querySelectorAll('*')]) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (r.left < 30 || r.right > 1050) issues.push(`「${name(el)}」左右超出画面`);
    if (r.bottom > 1550) issues.push(`「${name(el)}」压到字幕区`);
    if (r.top < 350) issues.push(`「${name(el)}」顶到章节栏`);
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') issues.push(`「${name(el)}」文字被裁掉`);
  }
  // 逐字取位置（文字可以分散在多个行内元素里，比如带红色强调词的引文）
  const charTops = (el) => {
    const tops = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent;
      for (let i = 0; i < t.length; i++) {
        if (/\s/.test(t[i])) continue;
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + 1);
        const b = r.getBoundingClientRect();
        if (b.height) tops.push({ ch: t[i], top: b.top, bottom: b.bottom, left: b.left });
      }
    }
    return tops;
  };
  // 文字块：自己有文字、里面没有块级元素
  const blocks = [...content.querySelectorAll('div, span, li, b')].filter((el) => !el.closest('svg') && el.textContent.trim()
    && [...el.children].every((c) => getComputedStyle(c).display.startsWith('inline')));
  for (const el of blocks) {
    if (el.parentElement && blocks.includes(el.parentElement)) continue;
    const tops = charTops(el);
    if (!tops.length) continue;
    const text = tops.map((x) => x.ch).join('');
    // 换行 = 字回到左边并且往下走。不按上下是否重叠判断：字号不同时顶边不齐，行高很紧时上下两行的字框会重叠
    const lineOf = [];
    let line = 0;
    tops.forEach((x, i) => {
      if (i && x.left < tops[i - 1].left - 1 && x.top > tops[i - 1].top + 1) line++;
      lineOf.push(line);
    });
    const lines = line + 1;
    // 短标签（6 个字以内）不该折行
    if (text.length <= 6 && lines > 1) {
      issues.push(`短标签「${text}」被折成了 ${lines} 行`);
      continue;
    }
    // 孤字：最后一行只剩一个字（标点不算字）
    let last = tops.length - 1;
    while (last > 0 && /[，。！？；：、）」』,.!?%]/.test(tops[last].ch)) last--;
    if (tops.length >= 4 && last > 0 && lineOf[last] !== lineOf[last - 1]) issues.push(`「${text.slice(0, 14)}」最后一行只剩「${text.slice(last)}」`);
  }
  return [...new Set(issues)];
}

// 每条字幕是否单行
function inspectSubs(texts) {
  const sub = document.getElementById('sub');
  const keep = sub.textContent;
  const bad = [];
  for (const t of texts) {
    sub.textContent = t;
    if (sub.getBoundingClientRect().height > 70) bad.push(t);
  }
  sub.textContent = keep;
  return bad;
}

export async function runQC({ page, ep, scenes, subs, beats, out, epDir }) {
  const hard = [], soft = [];
  const sec = [];

  // 1. 配音回听
  const v = JSON.parse(readFileSync(join(out, 'qc-voice.json'), 'utf8'));
  sec.push('## 1. 配音回听（自动）', '',
    `两个识别模型逐音节比对：${v.total} 句中 ${v.total - v.fails.length} 句通过，其中 ${v.retried} 句是重读后才通过的。`,
    '注意：识别模型输出的是汉字，同一个字的不同读音（得 de / děi）它分不出来，所以多音字读得对不对，回听不能作数。模型发不出的音节另由「弱音节」规则拦截。', '');
  for (const w of v.weak || []) {
    hard.push(`模型弱音节：${w}`);
    sec.push(`- ✗ 模型弱音节：${w}`);
  }
  for (const f of v.fails) {
    hard.push(`配音第 ${f.beat} 句：${f.issues.join('；')}`);
    sec.push(`- ✗ 第 ${f.beat} 句（${f.by} 听到：${f.heard}）：${f.issues.join('；')}`);
  }
  for (const m of v.minor) {
    soft.push(`配音第 ${m.beat} 句：${m.minor.join('；')}`);
    sec.push(`- △ 第 ${m.beat} 句：${m.minor.join('；')}（轻声虚词，人工听一下是否吞字）`);
  }
  if (!v.fails.length && !v.minor.length && !(v.weak || []).length) sec.push('- 全部通过');
  sec.push('');

  // 2. 读音（声调要人工）
  const sheet = join(epDir, '读音表.md');
  const sheetText = existsSync(sheet) ? readFileSync(sheet, 'utf8') : '';
  const risky = sheetText.match(/^- 第 \d+ 句：.*$/gm) || [];
  const disputed = (sheetText.split('## 需要拍板')[1] || '').split('\n## ')[0].match(/^- .*$/gm) || [];
  sec.push('## 2. 读音声调和多音字（人工）', '',
    `识别模型听不出声调，也判断不了多音字在语境里该读哪个音。打开 \`读音表.md\`：`, '',
    `- 「重点审」${risky.length} 句：逐个按语境判断，读对了把词写进 \`pron.txt\` 的「人工审过」，读错了改拼音。`,
    `- 「需要拍板」${disputed.length} 处争议读音：词典读法和日常听感可能不一致，由主理人决定。`, '');
  for (const d of disputed) {
    soft.push(`争议读音待拍板：${d.slice(2)}`);
    sec.push(`  - △ ${d.slice(2)}`);
  }
  if (risky.length) soft.push(`读音表有 ${risky.length} 句多音字待按语境审`);
  // 没有单位的数：可能是代号或日期简称（924 读「九二四」），确认前不算干净
  const numUnsure = sheetText.match(/^- ⚠ 句 \d+：.*$/gm) || [];
  sec.push(`- 「数字读法待确认」${numUnsure.length} 处：没有单位的三位以上整数，按含义定逐位读还是按数值读，确认后写进 \`read.txt\`。`);
  for (const d of numUnsure) {
    soft.push(`数字读法待确认：${d.slice(4)}`);
    sec.push(`  - △ ${d.slice(4)}`);
  }
  sec.push('');

  // 3. 画面
  sec.push('## 3. 画面（自动）', '');
  let layoutBad = 0;
  for (let i = 0; i < scenes.length; i++) {
    await page.evaluate((x) => window.render(x), scenes[i].end - 0.3);
    const issues = await page.evaluate(inspectScene);
    for (const x of issues) {
      hard.push(`第 ${i + 1} 页「${ep.scenes[i].label}」：${x}`);
      sec.push(`- ✗ 第 ${i + 1} 页「${ep.scenes[i].label}」：${x}`);
      layoutBad++;
    }
  }
  if (!layoutBad) sec.push('- 没有越界、遮挡、裁字和孤字');
  sec.push('');

  // 4. 字幕
  sec.push('## 4. 字幕（自动）', '');
  const wrap = await page.evaluate(inspectSubs, [...new Set(subs.map((s) => s.text))]);
  for (const t of wrap) {
    hard.push(`字幕超过一行：${t}`);
    sec.push(`- ✗ 超过一行：${t}`);
  }
  const joined = subs.map((s) => s.text.replace(/\s/g, '')).join('');
  const said = beats.map((b) => b.say.replace(/[，。！？；：、\s]/g, '')).join('');
  if (joined.replace(/[，。！？；：、]/g, '') !== said) {
    hard.push('字幕和口播稿对不上');
    sec.push('- ✗ 字幕拼起来和口播稿对不上');
  }
  if (!wrap.length && joined.replace(/[，。！？；：、]/g, '') === said) sec.push('- 全部单行，和口播稿一致');
  sec.push('');

  // 5. 高危词
  sec.push('## 5. 合规高危词（自动）', '');
  const texts = [...beats.map((b) => b.say), ...ep.scenes.flatMap((s) => JSON.stringify(s.els).match(/"(?:text|title|sub|label|value|mid|left|right)":"[^"]*"/g) || [])];
  const hits = [...new Set(texts.flatMap((t) => lintText(t)))];
  if (hits.length) {
    hard.push(`高危词：${hits.join('、')}`);
    sec.push(`- ✗ 命中：${hits.join('、')}。发布前必须改写或确认语境无害`);
  } else sec.push('- 没有命中');
  if (!ep.disclaimer || !beats.some((b) => b.say.includes('不构成任何投资建议'))) {
    hard.push('片尾没有口播免责声明');
    sec.push('- ✗ 片尾缺免责声明');
  }
  sec.push('');

  const head = ['# 质检报告', '', `> 自动生成。${hard.length ? `**不通过：${hard.length} 项必须修**` : '**自动检查全部通过**'}，${soft.length} 项提醒。`,
    '> 自动检查之外，发布前还要人工过一遍文末清单。', ''];
  const tail = ['## 6. 人工清单', '',
    '- [ ] 戴耳机听前 30 秒和每章开头：有没有怪音、重复、吞字',
    '- [ ] `读音表.md`「重点审」逐条按语境确认声调，「需要拍板」的争议读音已决定',
    '- [ ] 原话和数字对照出处（拆解卡里标了「待核实」的）',
    '- [ ] 封面、标题不出现个股、收益、点位', ''];
  return { hard, soft, report: [...head, ...sec, ...tail].join('\n') };
}

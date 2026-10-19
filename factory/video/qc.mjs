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
  // 孤字：一段文字的最后一行只剩一个字（标点不算字）
  const leaves = [...content.querySelectorAll('div, span, li, b')].filter((el) => !el.closest('svg') && [...el.childNodes].every((c) => c.nodeType === 3) && el.textContent.trim().length >= 4);
  for (const el of leaves) {
    const node = el.childNodes[0];
    const txt = node.textContent.replace(/\s+$/, '');
    const chars = [...txt];
    if (chars.length < 4) continue;
    const pos = (i) => {
      const r = document.createRange();
      const off = [...txt].slice(0, i).join('').length;
      r.setStart(node, off);
      r.setEnd(node, off + chars[i].length);
      return r.getBoundingClientRect().top;
    };
    let last = chars.length - 1;
    while (last > 0 && /[，。！？；：、）」』,.!?%]/.test(chars[last])) last--;
    if (last > 0 && pos(last) - pos(last - 1) > 5) issues.push(`「${txt.slice(0, 14)}」最后一行只剩「${chars.slice(last).join('')}」`);
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
    `两个识别模型逐音节比对：${v.total} 句中 ${v.total - v.fails.length} 句通过，其中 ${v.retried} 句是重读后才通过的。`, '');
  for (const f of v.fails) {
    hard.push(`配音第 ${f.beat} 句：${f.issues.join('；')}`);
    sec.push(`- ✗ 第 ${f.beat} 句（${f.by} 听到：${f.heard}）：${f.issues.join('；')}`);
  }
  for (const m of v.minor) {
    soft.push(`配音第 ${m.beat} 句：${m.minor.join('；')}`);
    sec.push(`- △ 第 ${m.beat} 句：${m.minor.join('；')}（轻声虚词，人工听一下是否吞字）`);
  }
  if (!v.fails.length && !v.minor.length) sec.push('- 全部通过');
  sec.push('');

  // 2. 读音（声调要人工）
  const sheet = join(epDir, '读音表.md');
  const risky = existsSync(sheet) ? (readFileSync(sheet, 'utf8').match(/^- 第 \d+ 句：.*$/gm) || []) : [];
  sec.push('## 2. 读音声调（人工）', '', `识别模型听不出声调。打开 \`读音表.md\`，先看「重点审」的 ${risky.length} 句，确认括号里的拼音没错。`, '');

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
    '- [ ] `读音表.md`「重点审」逐条确认声调',
    '- [ ] 原话和数字对照出处（拆解卡里标了「待核实」的）',
    '- [ ] 封面、标题不出现个股、收益、点位', ''];
  return { hard, soft, report: [...head, ...sec, ...tail].join('\n') };
}

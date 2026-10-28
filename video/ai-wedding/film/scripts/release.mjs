// 发布包：章节按实际时间轴生成（不按估算，存储视频踩过的坑）→ 发布包.md
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../../', import.meta.url);
const tl = JSON.parse(readFileSync(new URL('out/film/timeline.json', ROOT), 'utf8'));
const mmss = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
const first = (act) => tl.shots.find((s) => s.act === act).start;
// 章节名用观众听得懂的话，不用内部叫法
const NAMES = { A0: '开场：用上 AI，为什么反而赚得少？', A1: '五个人的小公司', A2: '反转一：AI 让效率大涨', A3: '反转二：街对面来了个更便宜的', A4: '行业洗牌：三种公司', A5: '反转三：赢家换了门生意', A6: '从县城到所有行业' };
const ch = tl.acts.map((a) => `${mmss(a.id === 'A0' ? 0 : first(a.id))} ${NAMES[a.id]}`).join('\n');
const md = `# 发布包 ·《${tl.title}》

> 由 \`film/scripts/release.mjs\` 按成片时间轴生成。成片 ${mmss(tl.duration)}，16:9，1920×1080。

## 标题

- 片内 / 封面：AI省下的钱，被谁赚走了？
- 平台标题（B 站 / 视频号横屏）：AI省下的钱，被谁赚走了？一家县城婚庆公司的故事

## 封面

\`out/film/封面.png\`（1920×1080）：「AI 省下的钱 / 被谁赚走了？」两行大字，小陈、小李隔街对望，金币飘向街对面。图上不放账号名、链接、二维码。

## 简介

县城婚庆公司老板小陈用上了 AI，30 小时的活 12 小时就干完了。可一年后，客户少了、套餐降价了，利润越来越薄，最后赚到钱的人居然不做婚庆了。
用一个故事讲清楚：当一项昂贵的能力突然变便宜，省下来的钱会流向哪里，行业会怎么洗牌，新的生意从哪里冒出来。

本片人物、店铺和数字均为虚构或假设，只用于解释经济原理，不代表真实统计，不构成任何投资或经营建议。

## 章节

\`\`\`
${ch}
\`\`\`

## 标签

AI、经济学、科普、动画、商业模式、县城、婚庆、效率、竞争、知识

## 发布时勾选

- 「内容由 AI 生成 / AI 辅助创作」标识（《人工智能生成合成内容标识办法》2025-09-01 施行）。片尾也写了「内容由 AI 辅助生成」。
- 上传字幕文件 \`out/film/subtitles.srt\`（B 站、YouTube 利于搜索）。
- 画面、简介、评论置顶都不放链接、二维码、微信。
`;
writeFileSync(new URL('发布包.md', ROOT), md);
console.log(ch);

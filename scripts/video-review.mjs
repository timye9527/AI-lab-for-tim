// 用 YouTube 后台数据复盘：看问题出在点击、开头还是中段，落到具体场景和场景类型
// 用法：
//   npm run video:review -- channel <Studio 导出的表格.csv>   各条视频对比频道中位数
//   npm run video:review -- retention <集id>                  这一集的留存曲线落到每个场景
//   npm run video:review -- scenes                            所有集合起来：哪种场景类型最掉人
// 留存数据放在 video/episodes/<集id>/stats/retention.csv（两列：时间，留存%），已被 git 忽略
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const [mode, arg] = process.argv.slice(2);
mkdirSync('out/review', { recursive: true });
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const median = (a) => {
  const s = [...a].filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
};
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

function csv(file) {
  const text = readFileSync(file, 'utf8').replace(/^﻿/, '');
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') (cell += '"', i++);
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',' || c === '\t') (row.push(cell), (cell = ''));
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell), rows.push(row), (row = []), (cell = '');
    } else cell += c;
  }
  if (cell || row.length) (row.push(cell), rows.push(row));
  return rows.filter((r) => r.some((x) => x.trim()));
}
// 时间：秒、m:ss，或者「视频位置 %」（要乘总时长）
const toSec = (v, dur, isPos) => {
  v = String(v).trim();
  if (v.includes(':')) return v.split(':').reduce((a, x) => a * 60 + parseFloat(x), 0);
  const n = parseFloat(v);
  return isPos ? (n > 1 ? n / 100 : n) * dur : n;
};
const toRatio = (v) => {
  const n = parseFloat(String(v).replace('%', ''));
  return n > 1.5 ? n / 100 : n;
};

// —— 频道总表 ——
if (mode === 'channel') {
  if (!arg || !existsSync(arg)) {
    console.log('用法：npm run video:review -- channel <表格.csv>\nYouTube Studio → 数据分析 → 进阶模式 → 内容 → 导出 → CSV（「表格数据」那个文件）');
    process.exit(1);
  }
  const [head, ...rows] = csv(arg);
  const col = (...re) => head.findIndex((h) => re.some((r) => r.test(h)));
  const C = {
    title: col(/title|標題|标题/i),
    imp: col(/^impressions$|曝光次數|曝光次数|展示次数/i),
    ctr: col(/click-through|點閱率|点击率|ctr/i),
    views: col(/^views$|觀看次數|观看次数/i),
    avd: col(/average view duration|平均觀看時間長度|平均观看时长|平均觀看時長/i),
    apv: col(/average percentage viewed|平均觀看百分比|平均观看百分比/i),
  };
  const miss = Object.entries(C).filter(([, i]) => i < 0).map(([k]) => k);
  if (miss.length) console.log(`⚠️ 搵唔到呢幾列：${miss.join('、')}（表頭：${head.join(' | ')}）`);
  const num = (r, i) => (i < 0 ? NaN : parseFloat(String(r[i]).replace(/[,%]/g, '')));
  const vids = rows
    .filter((r) => !/^total|總計|总计/i.test(r[0]) && r[C.title])
    .map((r) => ({ title: r[C.title], imp: num(r, C.imp), ctr: num(r, C.ctr), views: num(r, C.views), avd: r[C.avd], apv: num(r, C.apv) }));
  const mCtr = median(vids.map((v) => v.ctr));
  const mApv = median(vids.map((v) => v.apv));
  const diag = (v) => {
    const out = [];
    if (v.ctr < mCtr * 0.8) out.push('點擊低 → 改封面 / 標題');
    if (v.apv < mApv * 0.85) out.push('留存低 → 睇留存曲線，揾掉人嘅場景');
    if (v.ctr >= mCtr * 1.2 && v.apv < mApv) out.push('點擊高但留唔住 → 標題封面同開頭唔對版');
    if (v.ctr >= mCtr * 1.2 && v.apv >= mApv) out.push('✅ 兩樣都好 → 拆解佢，做同類選題');
    return out.join('；') || '—';
  };
  const md = `# 頻道複盤

> 中位數：點擊率 ${mCtr.toFixed(2)}%，平均觀看百分比 ${mApv.toFixed(1)}%。用中位數做基準，比同其他頻道比更準。

| 影片 | 曝光 | 點擊率 | 觀看 | 平均觀看 | 觀看 % | 判斷 |
|---|---|---|---|---|---|---|
${vids.map((v) => `| ${v.title.slice(0, 30)} | ${v.imp || '—'} | ${Number.isFinite(v.ctr) ? v.ctr.toFixed(2) + '%' : '—'} | ${v.views || '—'} | ${v.avd || '—'} | ${Number.isFinite(v.apv) ? v.apv.toFixed(1) + '%' : '—'} | ${diag(v)} |`).join('\n')}

**點樣讀：**
- 曝光少：演算法未肯推，通常係舊片表現拖累，先睇點擊同留存。
- 點擊率低過中位數兩成：問題喺包裝，下一集用「測試與比較」測 3 張封面。
- 觀看 % 低：問題喺內容節奏，用 \`npm run video:review -- retention <集id>\` 揾邊個場景掉人。
`;
  writeFileSync('out/review/channel.md', md);
  console.log(md);
}

// —— 单集留存：每个场景掉了多少 ——
function loadEpisode(id) {
  const tl = `out/video/${id}/timeline.json`;
  const rf = `video/episodes/${id}/stats/retention.csv`;
  if (!existsSync(tl) || !existsSync(rf)) return null;
  const timeline = JSON.parse(readFileSync(tl, 'utf8'));
  const dur = timeline.at(-1).start + timeline.at(-1).dur;
  const [head, ...rows] = csv(rf);
  const isPos = /%|position|位置/i.test(head[0]);
  const pts = rows.map((r) => [toSec(r[0], dur, isPos), toRatio(r[1])]).filter(([t, v]) => Number.isFinite(t) && Number.isFinite(v)).sort((a, b) => a[0] - b[0]);
  // 线性插值
  const at = (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1], [t1, v1] = pts[i];
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0 || 1);
    }
    return pts.at(-1)[1];
  };
  const scenes = timeline.map((s) => {
    const a = at(s.start), b = at(s.start + s.dur);
    return { ...s, from: a, to: b, lost: a - b, perSec: (a - b) / s.dur };
  });
  return { id, dur, at, scenes };
}

if (mode === 'retention') {
  const E = arg && loadEpisode(arg);
  if (!E) {
    console.log(`用法：npm run video:review -- retention <集id>
需要：out/video/<集id>/timeline.json（出片時自動生成，要用出街嗰版）
      video/episodes/<集id>/stats/retention.csv，兩列：時間（秒或 m:ss，或者「影片位置 %」）、留存 %
後台導唔出嘅話，喺留存曲線上每 10 秒讀一個數，手填都得。`);
    process.exit(1);
  }
  // 第一个场景的跌幅主要看包装（标题封面和开头是否对版），不算
  const worst = E.scenes.slice(1).sort((a, b) => b.perSec - a.perSec).slice(0, 3);
  const md = `# 留存複盤：${E.id}

| 指標 | 數值 | 參考 |
|---|---|---|
| 30 秒仲喺度（Intro） | **${pct(E.at(30))}** | 第三方經驗值：60～70% 算好；最準係同自己頻道比 |
| 1 分鐘 | ${pct(E.at(60))} | — |
| 片尾 | ${pct(E.at(E.dur - 1))} | — |

## 每個場景
| # | 類型 | 時間 | 入場 → 離場 | 每秒掉 |
|---|---|---|---|---|
${E.scenes.map((s) => `| ${s.key} | ${s.type} | ${fmtT(s.start)} | ${pct(s.from)} → ${pct(s.to)} | ${(s.perSec * 100).toFixed(2)}% |`).join('\n')}

## 掉人最快嘅 3 個場景
${worst.map((s) => `- **${s.key}（${s.type}）** ${fmtT(s.start)} 起，每秒掉 ${(s.perSec * 100).toFixed(2)}%：睇下呢段係咪太長、冇新資訊，或者開咗一個觀眾唔關心嘅話題`).join('\n')}

> 曲線向上嘅位置係有人重看，通常係最有價值嘅一段，可以剪成 Short。
`;
  writeFileSync(`out/review/retention-${E.id}.md`, md);
  console.log(md);
}

// —— 跨集：每种场景类型平均每秒掉多少，决定以后多用 / 少用哪种 ——
if (mode === 'scenes') {
  const ids = existsSync('video/episodes') ? readdirSync('video/episodes') : [];
  const eps = ids.map(loadEpisode).filter(Boolean);
  if (!eps.length) {
    console.log('仲未有任何一集有 stats/retention.csv，先用 retention 模式補數據');
    process.exit(1);
  }
  const by = {};
  for (const e of eps) for (const s of e.scenes.slice(1)) (by[s.type] ??= []).push(s.perSec);
  const rows = Object.entries(by).map(([t, a]) => [t, a.reduce((x, y) => x + y, 0) / a.length, a.length]).sort((a, b) => a[1] - b[1]);
  const md = `# 場景類型表現（${eps.length} 集）

每秒平均掉幾多觀眾（愈低愈好，第一個場景唔計，因為開頭跌幅主要睇包裝）：

| 類型 | 每秒掉 | 樣本數 |
|---|---|---|
${rows.map(([t, v, n]) => `| ${t} | ${(v * 100).toFixed(3)}% | ${n} |`).join('\n')}

> 樣本少過 5 個嘅類型唔好急住下結論。改稿規則（video/prompts/draft.md）可以按呢張表調整：表現好嘅多用，差嘅限制長度。
`;
  writeFileSync('out/review/scenes.md', md);
  console.log(md);
}

if (!['channel', 'retention', 'scenes'].includes(mode)) {
  console.log('用法：npm run video:review -- channel <表格.csv> | retention <集id> | scenes');
}

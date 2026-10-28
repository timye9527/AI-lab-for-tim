// 配音前稿件预检：把以前踩过的坑变成规则，配音之前先扫一遍
// 用法：node scripts/video-lint.mjs <稿件> [--tts] [--all]
//   稿件：.md/.txt（有「> 」开头的行就只取这些行当口播）、.json、.mjs/.js（取 say/beats/vo 等字段）、.srt
//   --tts：输入就是送进配音模型的最终文本，数字、符号直接算必须修
//   --all：每条规则列出全部命中（默认每条最多 6 处，省篇幅）
// 新踩的坑：加到下面的 TRAPS 或 RULES，并记进 .claude/skills/video-qa/错误档案.md
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BANNED } from './lint-words.mjs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const TTS = args.includes('--tts');
const ALL = args.includes('--all');
if (!file) {
  console.log('用法：node scripts/video-lint.mjs <稿件> [--tts] [--all]');
  process.exit(2);
}

// ── 读稿：取出口播句子 ──
const SPOKEN = ['say', 'beats', 'vo', 'VO', 'narration', 'voiceover', 'speech'];
const SHOWN = ['text', 'TEXT'];

function walk(o, keys, out, inKey = false) {
  if (typeof o === 'string') { if (inKey) out.push(o); return; }
  if (Array.isArray(o)) { for (const x of o) walk(x, keys, out, inKey); return; }
  if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) walk(v, keys, out, inKey || keys.includes(k));
  }
}

async function load(path) {
  const ext = extname(path).toLowerCase();
  const raw = readFileSync(path, 'utf8');
  if (ext === '.srt') {
    return raw.split(/\r?\n/).filter((l) => l.trim() && !/^\d+$/.test(l.trim()) && !l.includes('-->'));
  }
  if (ext === '.json' || ext === '.mjs' || ext === '.js') {
    const data = ext === '.json' ? JSON.parse(raw) : await import(pathToFileURL(resolve(path)).href);
    const out = [];
    walk(data, SPOKEN, out);
    if (!out.length) walk(data, SHOWN, out);
    return out;
  }
  // 有「## 」分段时，第一个分段之前算说明，不算口播（存储视频的脚本格式）
  let lines = raw.split(/\r?\n/);
  const first = lines.findIndex((l) => l.startsWith('## '));
  const body = first >= 0 ? lines.slice(first) : lines;
  const quoted = body.filter((l) => l.startsWith('> ')).map((l) => l.slice(2));
  if (quoted.length) return quoted;
  let code = false;
  return lines.filter((l) => {
    if (l.startsWith('```')) { code = !code; return false; }
    return !code && l.trim() && !/^\s*(#|\||-{3,}|<!--)/.test(l);
  });
}

// ── 已知坑词：模型或词典实际读错过的词，写明正确读音 ──
// [词, 正确读音, 出处]。合成后到读音表里确认读对了；读对的写进项目的读音覆盖表
const TRAPS = [
  ['冲着', 'chòng zhe', '001 期读成 chōng'],
  ['运转', 'yùn zhuǎn', '001 期读成 zhuàn'],
  ['去量', 'qù liáng', '001 期动词「量」读成 liàng'],
  ['量完', 'liáng wán', '同上'],
  ['付了', 'fù le', '001 期「了」读成 liǎo'],
  ['地进入', 'de', '001 期「稳固地」的「地」读成 dì'],
  ['视频为', 'wéi', '001 期「本视频为」读成 wèi'],
  ['一场', 'yì chǎng', '001 期读成 cháng'],
  ['撑得住', 'chēng de zhù', '002 期「得」读成 dé'],
  ['传得', 'de', '001 期读成 dé'],
  ['涨得', 'de', '001 期读成 dé'],
  ['长约', 'cháng yuē', '存储视频：工具默认 zhǎng'],
  ['长鑫', 'cháng xīn', '存储视频：工具默认 zhǎng'],
  ['长单', 'cháng dān', '存储视频'],
  ['长协', 'cháng xié', '存储视频'],
  ['上调', 'shàng tiáo', '存储视频：工具默认 diào'],
  ['下调', 'xià tiáo', '存储视频：工具默认 diào'],
  ['剪刀差', 'jiǎn dāo chā', '存储视频：工具默认 chà'],
  ['行长', 'háng zhǎng', '模型对比测试读成 xíng cháng'],
  ['调研', 'diào yán', '常见错读 tiáo'],
  ['重仓', 'zhòng cāng', '常见错读 chóng'],
  ['供给', 'gōng jǐ', '存储视频'],
  ['率先', 'shuài xiān', '存储视频'],
  ['良率', 'liáng lǜ', '存储视频'],
  ['周一只', 'zhōu yī zhǐ', '存储视频：会被切成「周 / 一只」'],
  ['跑了', 'pǎo le', '微电影：单独念「他跑了」成了「他跑累」'],
  ['到不了', 'dào bù liǎo', '「了」表示能不能，读 liǎo'],
  ['受不了', 'shòu bù liǎo', '同上'],
];

// 少见音才对的搭配（来自内容工厂 pron.py 的语境规则）
const CONTEXT = [
  [/还(?=了?[钱债款贷账])/, 'huán', '还钱、还债'],
  [/(?<=[归偿退])还/, 'huán', '归还、偿还'],
  [/(?<=[几一两三四五六七八九十多每])只(?=[股票基鸡鸟船手])/, 'zhī', '量词「几只股票」'],
  [/中(?=[奖标毒弹签])/, 'zhòng', '中奖、中标'],
  [/(?<=[打命猜])中/, 'zhòng', '打中、命中'],
  [/好(?=[奇学客胜色战])/, 'hào', '好奇、好学'],
  [/(?<=[爱喜嗜偏])好/, 'hào', '爱好、偏好'],
  [/应(?=[用对付聘答变激邀])/, 'yìng', '应用、应对'],
  [/(?<=[回响反适供相呼答])应/, 'yìng', '回应、供应'],
  [/(?<=[灾遇患苦落逃避发责劫])难/, 'nàn', '灾难、遇难'],
  [/少(?=[年女将爷])/, 'shào', '少年'],
  [/种(?=[植地树田菜])/, 'zhòng', '种植'],
  [/相(?=[机貌声片册])/, 'xiàng', '相机、相貌'],
  [/(?<=[真首宰丞照面亮])相/, 'xiàng', '真相、首相'],
  [/背(?=[包负着起])/, 'bēi', '背包、背负'],
  [/(?<=[头理])发|发(?=[型廊丝])/, 'fà', '头发、发型'],
  [/(?<=[主配])角|角(?=[色逐斗])/, 'jué', '主角、角色'],
  [/朝(?=[阳气晖夕])/, 'zhāo', '朝阳'],
  [/(?<=[单稀刻])薄/, 'bó', '单薄、稀薄'],
];

// 高风险多音字：只做统计，提醒去看合成的读音表
const RISKY = '得了着量冲转还行长重调差数处为地和便降空给传应曾朝种相将少好中当发角结系场只背薄难参血塞累折露';

// ── 规则：[级别, 名称, 检查函数(句子) → 命中片段数组, 修法] ──
// ✗ 必须修  ⚠ 高危，逐条判断  △ 提醒
const ZH = '\\u4e00-\\u9fa5';
const reAll = (re, s) => [...s.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))].map((m) => m[0]);
const DIGIT_LV = TTS ? '✗' : '△';

const RULES = [
  ['⚠', '必须义的「得」（děi）',
    // 第二支：名词后面的「得」紧跟动作（设计师得找参考），婚庆片稿件预检漏过
    (s) => reAll(/(?:总|就|还|都|也|可|非|你|我|他|她|它|们|谁)得(?![到了住起过上下来去益罪逞失分奖意病])|(?<![觉记懂值获取使显免难舍晓认赢心所变弄搞闹见])得(?=[找做写改拍剪买交学花等靠先重从把跟去赶请])/, s),
    '本地开源模型实测发不出 děi，会读成 dé（001 期 5 句全错）。是「必须」义就改写：总得 → 必须 / 一定要，就得 → 就要，还得 → 还要；直接引语也改。不是必须义可忽略'],
  ['⚠', 'AI 在句末或紧贴「学」',
    (s) => reAll(/学\s*AI|AI(?=\s*[。！？…”」]|\s*$)/, s),
    '002 期「聊 AI。」「学 AI」里的 AI 被吞或读成「爱」「艾」。后面接一个词（AI 的事、AI 热潮），或改说「人工智能」'],
  ['⚠', '含 L / Z 的英文缩写',
    (s) => reAll(/\b[A-Z]*[LZ][A-Z]*\b/, s).filter((w) => w.length >= 2 && w.length <= 6),
    'Matcha 模型实测 L、Z 怎么写都读不准（MBA 也 0/3）。改写成中文（LLM → 大语言模型）；换了模型要重新验证'],
  ['⚠', '「约是」紧挨',
    (s) => reAll(/约是/, s),
    '002 期「大约是 65 倍」读成「大约是是」。去掉「是」：大约 65 倍'],
  ['⚠', '「一X一X」叠用',
    (s) => reAll(new RegExp(`一([${ZH}])一\\1`), s),
    '001 期「一层一层」读成「一层层层」。换说法（逐层、一层又一层）'],
  ['⚠', '模型容易读错的语境',
    (s) => CONTEXT.flatMap(([re, py, why]) => reAll(re, s).map((m) => `${m}→${py}（${why}）`)),
    '少见音才对的搭配。合成后在读音表确认读成了箭头后的音，没读对就进读音覆盖表'],
  ['⚠', '已知坑词',
    (s) => TRAPS.filter(([w]) => s.includes(w)).map(([w, py, why]) => `${w}→${py}（${why}）`),
    '以前实际读错过的词。合成前写进读音覆盖表，合成后在读音表确认'],
  ['⚠', '合规高危词',
    (s) => BANNED.filter((w) => s.includes(w) && !s.includes('不构成任何投资建议')),
    '财经内容：不荐股、不承诺收益、不导流。改写'],
  [DIGIT_LV, '阿拉伯数字',
    (s) => reAll(/\d[\d,.]*\s*(?:%|年|万|亿|倍)?/, s).map((m) => `${m.trim()}→${readNum(m.trim())}`),
    '送进配音模型前转成中文读法（模型自带的数字规则不可靠：2025 读成两千零二十五、10% 读成十 percent）。年份逐位读，千万亿前的 2 读「两」。箭头后是建议读法，核对一下'],
  [TTS ? '✗' : '△', '会被读出来或吞掉的符号',
    (s) => reAll(/[×→←~～\/／&#@+=＋＝·•|²³]/, s),
    '口播里写成中文（× → 和 / 乘，→ 到，/ → 或）；「·」「《》」由程序去掉'],
  ['△', '英文缩写（需验证读法）',
    (s) => reAll(/\b[A-Z]{2,6}\d*\b/, s).filter((w) => !/[LZ]/.test(w)),
    '每个缩写第一次用都要验证（逐字母读还是整词读，合成后听写对不对）；能换中文就换'],
  ['△', '英文单词',
    (s) => reAll(/\b[A-Za-z]*[a-z][A-Za-z]{2,}\b/, s),
    '中文模型读英文单词不稳。能用中文就用中文（《证券分析》而不是 Security Analysis）；人名品牌保留的，合成后重点听'],
  ['△', '儿化',
    (s) => reAll(new RegExp(`[${ZH}]儿(?![子女童歌科])`), s).filter((m) => !/^[婴孤健幼胎女混宠]/.test(m)),
    '模型儿化不稳，口播不写儿化（一会儿 → 一会）'],
  ['△', '句子太长',
    (s) => s.split(/[。！？!?]/).filter((x) => x.replace(/\s/g, '').length > 40).map((x) => x.slice(0, 14) + '…'),
    '超过 40 字的句子更容易出重复音节和吞字，字幕也难断。拆成两句'],
  ['△', '一口气太长（字幕超一行）',
    (s) => s.split(/[，。！？、；：,!?;:…—]/).filter((x) => x.replace(/\s/g, '').length > 20).map((x) => x.slice(0, 14) + '…'),
    '两个标点之间超过 20 字，字幕没地方断，竖屏会超一行。加逗号'],
  ['△', '太短的单句',
    (s) => s.split(/[。！？!?]/).map((x) => x.replace(/[，、\s…“”"「」]/g, '')).filter((x) => x.length > 0 && x.length <= 3),
    '3 个字以内的句子单独合成容易读怪（「他跑了」→「他跑累」），和前后句合并'],
  ['△', '句末没有标点',
    (s) => (/[。！？!?…」”）)，,：:；;、—]\s*$/.test(s) ? [] : [s.slice(-10)]),
    '每句末尾要有标点，配音的停顿和字幕断行都靠它'],
];

// ── 数字读法建议 ──
const CN = '零一二三四五六七八九';
function intCn(n) {
  if (n === 0) return '零';
  const four = (x) => {
    const u = ['', '十', '百', '千'];
    let s = '', zero = false;
    for (let i = 3; i >= 0; i--) {
      const d = Math.floor(x / 10 ** i) % 10;
      if (d === 0) { zero = s !== ''; continue; }
      if (zero) { s += '零'; zero = false; }
      s += (d === 2 && i >= 2 ? '两' : CN[d]) + u[i];
    }
    return s.replace(/^一十/, '十');
  };
  const parts = [[1e8, '亿'], [1e4, '万'], [1, '']];
  let s = '', rest = n;
  for (const [b, u] of parts) {
    const q = Math.floor(rest / b);
    rest %= b;
    if (q) {
      if (s && q < 1000) s += '零';
      s += four(q) + u;
    }
  }
  return s.replace(/零+/g, '零').replace(/零$/, '');
}
function readNum(tok) {
  const m = tok.match(/^([\d,]+)(?:\.(\d+))?\s*(%|年|万|亿|倍)?$/);
  if (!m) return '?';
  const [, int, dec, unit] = m;
  const n = Number(int.replace(/,/g, ''));
  if (unit === '年' && /^\d{4}$/.test(int)) return [...int].map((d) => CN[d]).join('') + '年';
  let s = intCn(n) + (dec ? '点' + [...dec].map((d) => CN[d]).join('') : '');
  if (!unit && !dec && /^(19|20)\d\d$/.test(int)) return `${[...int].map((d) => CN[d]).join('')}（年份）/ ${s}（数值）`;
  if (unit === '%') return '百分之' + s;
  return s + (unit || '');
}

// ── 跑 ──
// 去掉事实编号 [F12]、剪辑标注【】、markdown 加粗和行内代码
const clean = (l) => String(l).replace(/\[F\d+\]|【[^】]*】|\*\*|`/g, '').trim();
const lines = (await load(file)).map(clean).filter(Boolean);
const text = lines.join('\n');
const hits = RULES.map(() => []);
lines.forEach((s, i) => {
  RULES.forEach(([, , fn], k) => {
    for (const m of fn(s)) hits[k].push({ i: i + 1, m, s });
  });
});

const han = (text.match(new RegExp(`[${ZH}]`, 'g')) || []).length;
const risky = lines.filter((s) => [...s].some((c) => RISKY.includes(c))).length;
const count = { '✗': 0, '⚠': 0, '△': 0 };
RULES.forEach(([lv], k) => { count[lv] += hits[k].length; });

console.log(`稿件预检：${file}${TTS ? '（配音文本模式）' : ''}`);
console.log(`口播 ${lines.length} 句，约 ${han} 字；按每秒 4～4.5 字估，约 ${(han / 4.5 / 60).toFixed(1)}～${(han / 4 / 60).toFixed(1)} 分钟`);
console.log(`✗ 必须修 ${count['✗']}  ⚠ 逐条判断 ${count['⚠']}  △ 提醒 ${count['△']}`);

const LIMIT = ALL ? Infinity : 6;
RULES.forEach(([lv, name, , fix], k) => {
  const h = hits[k];
  if (!h.length) return;
  console.log(`\n${lv} ${name}（${h.length}）：${fix}`);
  for (const { i, m, s } of h.slice(0, LIMIT)) {
    const ctx = s.length > 30 ? s.slice(Math.max(0, s.indexOf(m.split('→')[0]) - 8), Math.max(0, s.indexOf(m.split('→')[0]) - 8) + 30) : s;
    console.log(`  第 ${i} 句 ${m}　「${ctx}」`);
  }
  if (h.length > LIMIT) console.log(`  …另 ${h.length - LIMIT} 处（加 --all 看全部）`);
});

const money = /股|基金|投资|ETF|涨|跌|仓|理财/.test(text);
if (money && !/不构成/.test(text)) {
  console.log('\n⚠ 财经内容没找到免责声明：结尾口播和画面都要有「不构成任何投资建议」');
  count['⚠']++;
}
console.log(`\n含高风险多音字的句子 ${risky} 句：自动预检看不出读音，合成后必须看读音表（逐句拼音）`);
if (count['✗']) process.exit(1);

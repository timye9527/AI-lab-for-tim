// 拆解一条现成视频：剪辑节奏、画面切换、响度、停顿、语速、开头 30 秒，输出报告和缩略图墙
// 用法：npm run video:teardown -- <视频.mp4> [字幕.vtt|.srt]
// 先在能上 YouTube 的电脑下载（需要 yt-dlp）：
//   yt-dlp -f "bv*[height<=1080]+ba/b" --merge-output-format mp4 --write-auto-subs --write-subs --sub-langs "yue.*,zh.*,en.*" -o "%(id)s.%(ext)s" <链接>
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';

const [file, subFile] = process.argv.slice(2);
if (!file || !existsSync(file)) {
  console.log('用法：npm run video:teardown -- <视频.mp4> [字幕.vtt|.srt]');
  process.exit(1);
}
const name = basename(file, extname(file));
const OUT = `out/teardown/${name}`;
mkdirSync(OUT, { recursive: true });
const run = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr || '';
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const r1 = (x) => Math.round(x * 10) / 10;

// —— 基本信息 ——
const info = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], { encoding: 'utf8' }).stdout);
const dur = parseFloat(info.format.duration);
const v = info.streams.find((s) => s.codec_type === 'video');
const [fn, fd] = (v?.avg_frame_rate || '0/1').split('/').map(Number);
const fps = fd ? fn / fd : 0;
console.log(`拆解 ${name}：${fmtT(dur)}，${v?.width}×${v?.height}，${r1(fps)} fps`);

// —— 画面变化：硬切（换镜头 / 换素材）和画面信息变化（新元素出现、换页）分开算 ——
// 深色背景的动画页之间，场景分数通常只有 0.05～0.1，按拍摄素材的阈值会一次都测不到
console.log('  分析剪辑节奏…');
const sceneLog = run(['-i', file, '-an', '-vf', "scale=320:-2,select='gt(scene,0.035)',metadata=print", '-f', 'null', '-']);
const events = [...sceneLog.matchAll(/pts_time:([\d.]+)[\s\S]*?scene_score=([\d.]+)/g)].map((m) => ({ t: +m[1], score: +m[2] }));
const dedupe = (list, gap) => list.filter((e, i, a) => i === 0 || e.t - a[i - 1].t > gap).map((e) => e.t);
const hardCuts = dedupe(events.filter((e) => e.score > 0.3), 0.25);
const cuts = dedupe(events.filter((e) => e.score > 0.04), 0.6);
const bounds = [0, ...cuts, dur];
const shots = bounds.slice(1).map((t, i) => t - bounds[i]);
const sorted = [...shots].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)] || dur;
const avg = dur / shots.length;
const long8 = shots.filter((s) => s > 8).length;
// 每分钟画面变化次数（看节奏曲线：开头快不快、中段有没有塌）
const perMin = Array.from({ length: Math.ceil(dur / 60) }, (_, m) => cuts.filter((t) => t >= m * 60 && t < (m + 1) * 60).length);
writeFileSync(`${OUT}/cuts.csv`, 'start,end,length\n' + shots.map((s, i) => `${r1(bounds[i])},${r1(bounds[i + 1])},${r1(s)}`).join('\n'));

// —— 声音：整体响度、停顿 ——
console.log('  分析声音…');
const loud = run(['-i', file, '-vn', '-af', 'ebur128', '-f', 'null', '-']);
const lufs = +(loud.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)?.[0] ?? NaN);
const sil = run(['-i', file, '-vn', '-af', 'silencedetect=n=-35dB:d=0.5', '-f', 'null', '-']);
const silences = [...sil.matchAll(/silence_duration: ([\d.]+)/g)].map((m) => +m[1]);
const silTotal = silences.reduce((a, b) => a + b, 0);
const longSil = silences.filter((s) => s > 1.5).length;

// —— 缩略图墙：每 10 秒一张；开头 30 秒每 2 秒一张（看钩子怎么做的）——
console.log('  生成缩略图墙…');
run(['-y', '-i', file, '-vf', 'fps=1/10,scale=384:-2,tile=5x4', '-q:v', '4', `${OUT}/sheet-%02d.jpg`]);
run(['-y', '-t', '30', '-i', file, '-vf', 'fps=1/2,scale=384:-2,tile=5x3', '-frames:v', '1', '-q:v', '3', `${OUT}/hook-30s.jpg`]);
// 每个镜头的首帧，方便逐个看转场和版式
run(['-y', '-i', file, '-vf', `select='eq(n,0)+gt(scene,0.28)',scale=384:-2,tile=6x5`, '-fps_mode', 'vfr', '-q:v', '4', `${OUT}/shots-%02d.jpg`]);

// —— 字幕：语速、开头 30 秒说了什么、全文 ——
let subPart = '（没有提供字幕文件。用上面的 yt-dlp 命令下载自动字幕，可以多出语速和开头钩子的分析）';
if (subFile && existsSync(subFile)) {
  const raw = readFileSync(subFile, 'utf8').replace(/\r/g, '');
  const toS = (h, m, s) => +h * 3600 + +m * 60 + parseFloat(s.replace(',', '.'));
  const cues = [];
  for (const block of raw.split(/\n\n+/)) {
    const m = block.match(/(?:(\d+):)?(\d+):([\d.,]+)\s+-->\s+(?:(\d+):)?(\d+):([\d.,]+)/);
    if (!m) continue;
    const text = block.split('\n').slice(block.split('\n').findIndex((l) => l.includes('-->')) + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (text) cues.push({ start: toS(m[1] || 0, m[2], m[3]), end: toS(m[4] || 0, m[5], m[6]), text });
  }
  // YouTube 自动字幕是滚动的，相邻两条会重复，去重
  const lines = [];
  for (const c of cues) {
    const prev = lines[lines.length - 1];
    if (prev && (prev.text === c.text || prev.text.endsWith(c.text))) continue;
    if (prev && c.text.startsWith(prev.text)) { prev.text = c.text; prev.end = c.end; continue; }
    lines.push({ ...c });
  }
  const chars = (s) => [...s].filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length + (s.match(/[A-Za-z]+/g)?.length || 0);
  const total = lines.reduce((a, l) => a + chars(l.text), 0);
  // 全程几乎无声（比如无配音的预览片）就按总时长算
  const speakMin = silTotal / dur > 0.8 ? dur / 60 : (dur - silTotal) / 60;
  const hook = lines.filter((l) => l.start < 30).map((l) => l.text).join(' ');
  writeFileSync(`${OUT}/transcript.txt`, lines.map((l) => `[${fmtT(l.start)}] ${l.text}`).join('\n'));
  subPart = `- 字数（中文字 + 英文词）：${total}
- 语速：约 **${Math.round(total / speakMin)} 字/分钟**（按去掉停顿后的说话时间算；整条平均 ${Math.round(total / (dur / 60))} 字/分钟）
- 开头 30 秒说了什么：
  > ${hook || '（开头 30 秒没有字幕）'}
- 全文带时间码：\`transcript.txt\`（拿去给 AI 拆结构：钩子、论点顺序、每段多长、在哪里埋问题）`;
}

const report = `# 拆解报告：${name}

> 由 \`npm run video:teardown\` 生成。数字是机器测的，「参考」一栏是做讲解类视频的常见经验值，不是硬标准。

## 基本信息
- 时长 **${fmtT(dur)}**，${v?.width}×${v?.height}，${r1(fps)} fps

## 剪辑节奏
| 指标 | 本片 | 参考 |
|---|---|---|
| 硬切（换镜头 / 换素材） | ${hardCuts.length} 次 | 纯动画页的节目可以接近 0 |
| 画面信息变化 | ${cuts.length} 次 | — |
| 平均每次变化间隔 | **${r1(avg)} 秒** | 讲解类 3～6 秒换一次画面信息 |
| 中位数 | ${r1(median)} 秒 | — |
| 超过 8 秒没变化 | ${long8} 个（${Math.round((long8 / shots.length) * 100)}%） | 越少越好；长画面要靠动画或字幕高亮撑住 |
| 每分钟变化次数 | ${perMin.join(' / ')} | 开头 1 分钟应该是全片最密的 |

最长的 5 个画面（最容易流失的地方，对照 YouTube 后台「观众留存」曲线看）：
${shots.map((s, i) => ({ s, t: bounds[i] })).sort((a, b) => b.s - a.s).slice(0, 5).map((x) => `- ${fmtT(x.t)} 起，停留 ${r1(x.s)} 秒`).join('\n')}

## 声音
| 指标 | 本片 | 参考 |
|---|---|---|
| 整体响度 | **${isNaN(lufs) ? '未测到' : lufs + ' LUFS'}** | YouTube 会把响度统一到约 -14 LUFS，太小声的片会显得没力 |
| 停顿（低于 -35dB 超过 0.5 秒） | ${silences.length} 次，共 ${r1(silTotal)} 秒（${Math.round((silTotal / dur) * 100)}%） | AI 配音常见问题是句与句之间停太久 |
| 超过 1.5 秒的停顿 | ${longSil} 次 | 多了就剪掉 |

## 口播
${subPart}

## 素材
- \`hook-30s.jpg\`：开头 30 秒每 2 秒一帧，看钩子画面
- \`shots-*.jpg\`：每个画面的首帧，看版式和转场
- \`sheet-*.jpg\`：全片每 10 秒一帧
- \`cuts.csv\`：每个画面的起止时间

## 人工要看的问题（对照 docs/VIDEO-TEARDOWN.md 的诊断清单）
1. 开头 5 秒内有没有一个具体数字、冲突或者问题？还是先自我介绍？
2. 标题、封面、开头 30 秒，三者讲的是不是同一件事？
3. 主持人有没有出镜？画面是 PPT 式静态页，还是有图表在「动」？
4. 每一章有没有一句「所以呢」，告诉观众这件事跟他的钱有什么关系？
5. 结尾有没有留一个问题引导留言，还是直接结束？
`;
writeFileSync(`${OUT}/report.md`, report);
console.log(`完成 → ${OUT}/report.md`);

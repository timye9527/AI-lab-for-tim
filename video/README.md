# 粤语财经视频流水线（财经浩谈）

把分析师的一篇稿子，变成一集 YouTube 长视频 + 2 条 Shorts + 封面 + 字幕 + 上传文案。画面、配音、字幕、嘴型全部由脚本生成，人只做两件事：**审稿**和**出插画**。

为什么这样做、现有节目的问题和优化方向，见 [`docs/VIDEO-TEARDOWN.md`](../docs/VIDEO-TEARDOWN.md)。

## 一次性准备

| 要装的 | 做什么 | 怎么装 |
|---|---|---|
| Node 22.13+ | 跑脚本 | 和仓库其他部分一样 |
| ffmpeg | 合成视频、音频处理 | Mac：`brew install ffmpeg` |
| Chrome | 渲染画面 | 本机装了 Chrome 就行；也可以设 `CHROME_PATH` |
| `npm install` | 装 playwright-core 和 Anthropic SDK | 在仓库根目录跑 |
| edge-tts（可选） | 免费的粤语 AI 配音 | `pip install edge-tts` |
| `ANTHROPIC_API_KEY`（可选） | AI 改编稿件 | 不用这一步的话，手写 episode.js 也行 |

节目形象（一次做好，以后每集复用）：

- **主持人两张图**：同一个角色，一张闭嘴、一张张嘴，其他地方完全一样，透明背景 PNG，放到 `video/episodes/<集id>/host/`。脚本按配音音量逐帧切换，就是「对口型」的效果。
- **主题**：`theme: 'paper'` 是纸面手绘风（和现在的节目一致），`'dark'` 是深色数据卡风。也可以写 `{ base: 'paper', accent: '#c92a2a' }` 改个别颜色。

## 每集流程

```bash
# 1. AI 把原稿改编成分镜脚本（粤语口播 + 画面 + 插画提示词）
npm run video:draft -- 稿件/1016.md 1016

# 2. 人工审 video/episodes/1016/episode.js（清单见下）

# 3. 出插画：提示词在 out/video/1016/image-prompts.txt，用任意文生图模型出图，存成 video/episodes/1016/img/<名>.png
#    第一次跑 npm run video 时没有图会停下来，并生成这个文件

# 4. 预览（半分辨率、15 帧，3 分钟的片大约 1～2 分钟出）
npm run video -- 1016 --preview

# 5. 正式出片
npm run video -- 1016
```

产出在 `out/video/<集id>/`：

| 文件 | 用途 |
|---|---|
| `long.mp4` | 横屏长视频，1920×1080，响度统一到 -14 LUFS |
| `short-a.mp4`、`short-b.mp4` | 竖屏 Shorts，1080×1920 |
| `thumb.png` | 封面，1280×720 |
| `youtube.txt` | 标题、说明（带章节时间码）、标签，直接复制 |
| `long.srt` | 字幕文件，上传到 YouTube 当 CC 字幕（有利搜索） |
| `image-prompts.txt` | 这一集插画的提示词 |
| `timeline.json` | 每个场景的起止时间，排查用 |

只出其中一部分：`--only long`、`--only shorts`、`--only thumb`，可以用逗号组合。

### 审稿清单（第 2 步）

1. **数字和出处**：每个标「发布前核对」的地方，回原始来源核一遍，核完删掉这几个字。
2. **观点**：口播有没有说出原稿没有的判断。
3. **粤语**：读一遍 `say`，像不像香港人讲嘢；英文名、数字读法对不对（数字要写成中文，配音才读得准）。
4. **合规**：没有买卖建议、目标价、「必升」「稳赚」；脚本会扫一遍高危说法，但最终要人看。持牌机构的节目，按公司合规流程过一遍。
5. **钩子**：开头第一句是不是数字、冲突或问题。

## 配音

优先级：**真人录音 > edge-tts > 按字数估时长（无声）**。

- 真人录音：每个场景一段，按顺序命名 `01.wav`、`02.wav`……（或者给场景写 `id`，用 `<id>.wav`），放到 `video/episodes/<集id>/audio/`。有录音的场景，画面时长自动跟着录音走。
- edge-tts：装好就自动用，声线在 `episode.js` 的 `voice` 改：`zh-HK-WanLungNeural`（男）、`zh-HK-HiuMaanNeural`（女）、`zh-HK-HiuGaaiNeural`（女）。生成的配音缓存在 `out/video/<集id>/tts/`，改了哪段只重新生成哪段。
- 背景音乐：放一个 `bgm.mp3` 到集目录，会自动循环，人说话时自动压低。

## 分镜格式（episode.js）

完整示范：[`episodes/demo/episode.js`](episodes/demo/episode.js)。每个场景都有 `say`（粤语口播），有数据的要写 `source`。画面字里用 `*星号*` 包住的会高亮，`\n` 换行。

| type | 画面 | 主要字段 |
|---|---|---|
| `hook` | 开场大字 | `big`、`kicker`、`lead` |
| `title` | 节目标题卡 | `title`、`lead` |
| `chapter` | 章节分隔，同时生成 YouTube 章节 | `no`、`title` |
| `bullets` | 2～3 个要点，跟着口播逐个出现 | `heading`、`items` |
| `number` | 一个大数字，从 0 数上去 | `label`、`value`、`unit`、`note` |
| `bars` | 横向柱状对比 | `heading`、`items[{label, value, show, hi}]`、`unit` |
| `line` | 折线走势 | `heading`、`points[[标签, 数值]]`、`mark{at, text}` |
| `compare` | 两栏对比 | `heading`、`left{title, items}`、`right{title, items}` |
| `flow` | 资金流 / 因果链，`loop: true` 围成圈 | `heading`、`nodes[{name, note}]` |
| `sketch` | 手绘插画：线稿 → 上色 → 镜头推移 | `img`、`prompt`、`labels`、`focus` |
| `quote` | 金句 | `text`、`by` |
| `outro` | 结尾互动 + 免责声明 | `cta`、`lead` |

**元素什么时候出现**：引擎在 `say` 里找每个要点的开头几个字，口播说到哪个就出哪个；找不到就均匀错开。对不准时，用 `beats: [0.05, 0.5, 0.8]` 手动指定（0～1，口播进度）。

**sketch 场景**：

- `labels`：叠在插画上的文字，`x`、`y` 是 0～100 的百分比位置，`key` 是口播里的词，说到才出现。
- `focus`：镜头，口播说到 `key` 就推到 `(x, y)`，`zoom` 建议 1.4～1.8；最后一个 `zoom: 1` 拉回全景。
- 插画里**不要有字**：AI 画的中文经常是错字，公司 logo 有商标风险。文字全部用 `labels` 叠，错了改一行就行。

**Shorts**：给场景加 `short: 'a'`，同一个字母的场景按顺序剪成一条竖屏短片；在 `shorts` 里给每条写标题。每条控制在 55 秒内。

**节目级字段**：`brand`、`title`、`description`、`tags`、`thumb{tag, l1, l2, num, img}`、`theme`、`date`（显示「稿件日期」）、`disclaimerBar`（底部常驻免责条）、`host{closed, open, height}`、`voice`、`rate`、`disclaimer`。

## 渲染脚本会提醒的事

- 某个场景太长（数据卡超过 12 秒、逐个出现的场景超过 20 秒）：观众容易在这里走掉，建议拆开。
- 章节少于 3 个或有章节短于 10 秒：YouTube 不会显示章节。
- 标题超过 40 字、Short 超过 60 秒。
- 命中高危说法、还有没核对的数据。

## 拆解别人的视频

```bash
# 在能上 YouTube 的电脑上下载视频和自动字幕
yt-dlp -f "bv*[height<=1080]+ba/b" --merge-output-format mp4 --write-auto-subs --write-subs --sub-langs "yue.*,zh.*,en.*" -o "%(id)s.%(ext)s" <链接>

npm run video:teardown -- <视频id>.mp4 <视频id>.yue.vtt
```

输出到 `out/teardown/<视频id>/`：剪辑节奏（多久换一次画面、哪里停太久）、响度、停顿、语速、开头 30 秒说了什么、缩略图墙。拿自己的片和对标的片各跑一次，对比就知道差在哪。

## 性能

渲染是逐帧截图，入场动画结束后只有字幕、嘴型、进度条变化时才重新截图。在云端容器里实测：3 分钟的示范片，预览模式约 1～2 分钟出片。正式模式（1080p、30 帧）的实测时间见 `docs/VIDEO-TEARDOWN.md`。

## 后续可以升级的地方

- **真对口型**：现在是张嘴 / 闭嘴两张图切换。要更自然，可以把 `_audio.m4a` 交给对口型工具（商用的如 HeyGen、Hedra，开源的如 LivePortrait、MuseTalk、LatentSync）生成绿幕角色视频，再用 ffmpeg `colorkey` + `overlay` 叠到 `long.mp4` 上。
- **更多嘴型**：加一张「半张嘴」图，按音量分三档，会顺很多。

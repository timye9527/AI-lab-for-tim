# 视频工厂 · 一份脚本数据生成一条中视频

一期视频只写一个文件 `episodes/<期>/episode.mjs`：每一页的画面元素和对应口播写在一起。一条命令生成脚本文档、配音、字幕和 mp4。

```bash
npm run video -- factory/episodes/001-lilu-columbia            # 完整出片
npm run video -- factory/episodes/001-lilu-columbia --stills   # 只出每页关键帧和总览图，改版式时用
npm run video -- factory/episodes/001-lilu-columbia --no-video --check   # 只出配音和字幕，并用语音识别回听查读错
```

产物在 `out/video/<期>/`（不提交）：

| 文件 | 用途 |
|---|---|
| `<期>.mp4` | 1080×1920 竖屏成片，25 帧 |
| `subs.srt` | 字幕，可以导进剪映再加工 |
| `voice.wav` | 整条配音，换配乐时用 |
| `cover.jpg` | 封面候选（开场钩子页） |
| `quotes.jpg` | 12 条金句长图，可单独发图文 |
| `stills.jpg` | 每页关键帧总览 |

脚本文档 `episodes/<期>/脚本.md` 会自动生成并提交，给人审稿用。

## 怎么做的

| 环节 | 实现 |
|---|---|
| 版式 | `video/player.html`：米色底、粗宋体大字、红色强调词、顶部「主钩子 + 五章节栏」、左上页面标签、底部字幕，按「多棱镜」原片截图还原 |
| 动画 | `video/player.js`：画面完全由时间点决定，元素按口播节拍逐个浮现，当前项红框高亮，章节栏下有进度条 |
| 配音 | `video/tts.py`：本地离线合成（sherpa-onnx + Kokoro 中文男声），逐句缓存，改一句只重配一句 |
| 读音检查 | `--check` 用 Paraformer 语音识别把配音转写回来，列出字错率最高的句子 |
| 渲染 | `video/build.mjs`：Chromium 逐帧截图，画面没变化的帧直接复用，ffmpeg 合成 h264 + aac |

## 新做一期

1. 复制 `episodes/001-lilu-columbia/`，改 `episode.mjs` 里的标题、章节、页面和口播。
2. 元素类型见 `player.js` 的 `build()`：`lead` 引导语、`quote` 大字引文、`note` 解读卡、`profile` 人物卡、`stats` 数据卡、`grid` 卡片网格、`compare` 左右对比、`fork` 分叉图、`ladder` 阶梯图、`flow` 流向图、`bars` 柱状示意、`chips` 地区卡、`zero` 等式、`church` 教堂赌场图、`wall` 金句墙、`sources` 来源。
3. 英文缩写在 `tts` 里拆开写（`I P O`），否则会被读成单词。
4. 先跑 `--stills` 看版式，再跑 `--check` 听读音，最后出片。

## 第一次在新机器上跑

需要 Node 22、Python 3、ffmpeg、Chromium（`CHROME_PATH` 可指定）。字体和模型约 1.6 GB，下载到 `factory/.cache/`（不提交）：

```bash
python3 -m pip install sherpa-onnx soundfile numpy librosa
mkdir -p factory/.cache/fonts factory/.cache/models
# 字体：Google Fonts 的 Noto Serif SC 700/900、Noto Sans SC 400/500/700，存成 serif-900.ttf 等
for spec in "Noto+Serif+SC:wght@900 serif-900" "Noto+Serif+SC:wght@700 serif-700" "Noto+Sans+SC:wght@400 sans-400" "Noto+Sans+SC:wght@500 sans-500" "Noto+Sans+SC:wght@700 sans-700"; do
  set -- $spec; curl -sS -o factory/.cache/fonts/$2.ttf "$(curl -sS "https://fonts.googleapis.com/css2?family=$1" | grep -o 'https://[^)]*\.ttf')"
done
# 模型：配音 Kokoro，读音检查 Paraformer
cd factory/.cache/models
B=https://github.com/k2-fsa/sherpa-onnx/releases/download
curl -sSL $B/tts-models/kokoro-multi-lang-v1_1.tar.bz2 | tar xj
curl -sSL $B/asr-models/sherpa-onnx-paraformer-zh-2024-03-09.tar.bz2 | tar xj
```

## 已知的不足

- **配音是离线开源模型**，清晰但偏平，情绪起伏不如剪映或付费配音。最省事的升级：用 `subs.srt` 和 `voice.wav` 当参考，在剪映里换成付费音色重配；或者把 `tts.py` 换成云端配音接口。
- **没有配乐。** 原片有背景音乐，可以在剪映里加一条轻音乐，音量压到 -25 dB 左右。
- 一期 9 分钟的片子，渲染大约 15～20 分钟（4 核机器）。

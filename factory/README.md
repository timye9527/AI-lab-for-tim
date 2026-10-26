# 视频工厂 · 一份脚本数据生成一条中视频

一期视频只写一个文件 `episodes/<期>/episode.mjs`：每一页的画面元素和对应口播写在一起。一条命令生成脚本文档、配音、字幕和 mp4。

```bash
npm run video -- factory/episodes/001-lilu-columbia            # 完整出片
npm run video -- factory/episodes/001-lilu-columbia --stills   # 只出每页关键帧和总览图，改版式时用
npm run video -- factory/episodes/001-lilu-columbia --no-video   # 只出配音、字幕和质检报告，不渲染
npm run video:letters -- AI IPO                                  # 验证英文缩写读得准不准
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

脚本文档 `脚本.md`、读音表 `读音表.md`、质检报告 `质检报告.md` 都在 `episodes/<期>/` 下自动生成并提交，给人审稿用。

## 怎么做的

| 环节 | 实现 |
|---|---|
| 版式 | `video/player.html`：米色底、粗宋体大字、红色强调词、顶部「主钩子 + 五章节栏」、左上页面标签、底部字幕，按「多棱镜」原片截图还原 |
| 动画 | `video/player.js`：画面完全由时间点决定，元素按口播节拍逐个浮现，当前项红框高亮，章节栏下有进度条 |
| 读音 | `video/pron.py` + `pron.txt` + `read.txt`：读音由我们决定——多音字按词取音并用覆盖表兜底，「一」「不」变调，数字、英文缩写转成实际读法；每期生成 `读音表.md` 给人审。规则见 [`读音规范.md`](读音规范.md)，踩过的坑见 [`错误档案.md`](错误档案.md) |
| 配音 | `video/tts.py`：本地离线合成（sherpa-onnx + Matcha 中英双语模型，标准普通话），按读音模块生成的附加词典逐字照读；逐句缓存，改一句只重配一句 |
| 配音质检 | 每句合成后用 SenseVoice 和 Paraformer 两个识别模型回听，按不带声调的拼音逐音节比对；多字、漏字、串音就换手法重读（原样 → 微调语速 → 拆短句，最多 8 次） |
| 出片质检 | `video/qc.mjs`：配音结果、画面越界和孤字、字幕单行、高危词、免责声明，写成 `质检报告.md`；有必须修的项就不出片。流程见 `.claude/skills/video-qc/SKILL.md` |
| 渲染 | `video/build.mjs`：Chromium 逐帧截图，画面没变化的帧直接复用，ffmpeg 合成 h264 + aac |

## 新做一期

1. 复制 `episodes/001-lilu-columbia/`，改 `episode.mjs` 里的标题、章节、页面和口播。
2. 元素类型见 `player.js` 的 `build()`：`lead` 引导语、`quote` 大字引文、`note` 解读卡、`profile` 人物卡、`timeline` 时间线、`house` 房子房价图、`debt` 借钱买的资产跌穿借款线、`stats` 数据卡、`grid` 卡片网格、`compare` 左右对比、`fork` 分叉图、`ladder` 阶梯图、`flow` 流向图、`bars` 柱状示意、`chips` 地区卡、`zero` 等式、`church` 教堂赌场图、`wall` 金句墙、`sources` 来源。
3. 口播稿照常写汉字、数字、英文缩写，读音交给读音模块。
4. 先跑 `--stills` 看版式，再跑 `--no-video` 修到质检全部通过、审完 `读音表.md`，最后出片。详细流程见 `.claude/skills/video-qc/SKILL.md`。
5. 脚本结构按 [`../docs/content-factory/爆款结构.md`](../docs/content-factory/爆款结构.md)，写稿流程见 `.claude/skills/viral-script/SKILL.md`。
6. 动画类型：`in` 浮现、`grow` 长高、`sweep` 红字下划线扫过、`count` 数字滚动、`draw` 线条描画、`pop` 弹出；`house` 元素是房子加房价下行曲线，`debt` 是价格线跌穿借款虚线（示意）。

## 第一次在新机器上跑

需要 Node 22、Python 3、ffmpeg、Chromium（`CHROME_PATH` 可指定）。字体和模型约 1.6 GB，下载到 `factory/.cache/`（不提交）：

```bash
python3 -m pip install sherpa-onnx soundfile numpy librosa pypinyin
mkdir -p factory/.cache/fonts factory/.cache/models
# 字体：Google Fonts 的 Noto Serif SC 700/900、Noto Sans SC 400/500/700，存成 serif-900.ttf 等
for spec in "Noto+Serif+SC:wght@900 serif-900" "Noto+Serif+SC:wght@700 serif-700" "Noto+Sans+SC:wght@400 sans-400" "Noto+Sans+SC:wght@500 sans-500" "Noto+Sans+SC:wght@700 sans-700"; do
  set -- $spec; curl -sS -o factory/.cache/fonts/$2.ttf "$(curl -sS "https://fonts.googleapis.com/css2?family=$1" | grep -o 'https://[^)]*\.ttf')"
done
# 模型：配音 Matcha 中英 + 16k 声码器，回听质检 SenseVoice + Paraformer
cd factory/.cache/models
B=https://github.com/k2-fsa/sherpa-onnx/releases/download
curl -sSL $B/tts-models/matcha-icefall-zh-en.tar.bz2 | tar xj
curl -sSL -o vocos-16khz-univ.onnx $B/vocoder-models/vocos-16khz-univ.onnx
curl -sSL $B/asr-models/sherpa-onnx-paraformer-zh-2024-03-09.tar.bz2 | tar xj
curl -sSL $B/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17.tar.bz2 | tar xj
```

## 已知的不足

- **配音是离线开源模型**：标准普通话女声，读音可控，但采样率 16 kHz、情绪起伏一般。升级办法见 [`读音规范.md`](读音规范.md) 最后一节。
- **没有配乐。** 原片有背景音乐，可以在剪映里加一条轻音乐，音量压到 -25 dB 左右。
- 一期 8～9 分钟的片子，渲染大约 4 分钟（4 核机器）。

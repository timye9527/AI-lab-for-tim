# 制作流水线：脚本 → 配音 → 画面 → 混音 → 成片

改了 `02-脚本-10分钟.md` 之后，按顺序重跑下面 5 步，画面会自动对齐新的配音（场景按口播关键词定位，不按固定秒数）。

```bash
cd video/memory-wallst
# 0. 一次性准备（装到 out/，不进仓库、不进 package.json）
pip install sherpa-onnx soundfile numpy
npm i --prefix out --no-save playwright-core@1.56 @fontsource/noto-sans-sc@5 @fontsource/jetbrains-mono@5
echo '{"type":"module"}' > out/package.json
# 配音模型（约 147MB）：sherpa-onnx 的 tts-models 发布页 → kokoro-int8-multi-lang-v1_1.tar.bz2，解压后用 KOKORO_DIR 指过去

npm run video:check                       # 1. 自检：事实、时长、违禁词
python3 production/tts.py --sid 65 --speed 1.08   # 2. 配音 → out/audio/voice.wav、timeline.json、subtitles.srt（约 1.5 倍实时）
node production/render.mjs                # 3. 画面 → out/video/picture.mp4（1080p 25fps，约 20–30 分钟）
python3 production/mix.py                 # 4. 配乐 + 音效 + 混音 → out/final/存储复盘-一周五刀.mp4
node production/cover.mjs                 # 5. 封面两套文案 × 三种比例 → out/final/cover-{a,b}-*.png
node production/preview.mjs               #    发布预览整图 → out/sample/发布预览.png
node production/chapters.mjs              #    章节时间戳写进 07-发布包.md
```

抽帧检查：`node production/render.mjs --stills 10,60,120 --tag check`（输出到 `out/stills/check/`）；没有配音时加 `--estimate` 按字数估时间轴。

## 各文件

| 文件 | 做什么 |
|---|---|
| `tts.py` | 逐句合成口播；`SAY` 表管英文缩写和符号的读法（只影响配音，不影响字幕） |
| `scenes.html` | 画面引擎：8 段场景、字幕、顶栏、竖排免责声明；`cue(段, '口播关键词')` 定位每个动画 |
| `render.mjs` | 用无头 Chromium 逐帧截图，直接管道给 ffmpeg 编码 |
| `mix.py` | 代码合成配乐（前半段紧张脉冲、后半段冷静和弦）、每一刀前的冲击音、人声压低配乐，再和画面合成 |
| `cover.html` / `cover.mjs` | 封面三种比例 |
| `chapters.mjs` | 章节时间戳 |

## 换声音 / 加主播

- **频道声音（待确认）**：男声，和上一期保持一致。候选 4 个：sid65 温暖低沉（推荐，语速偏慢，用 `--speed 1.08`）、sid60 沉稳清晰、sid100 明亮干练、sid58 年轻利落。男声在 sid 58–102 之间（按基频筛出），女声如 sid 3。
- **做样片**：`tts.py --secs 0,1 --out out/sample_audio` 只合成前两段，再 `render.mjs --audio out/sample_audio --out ...`、`mix.py --audio out/sample_audio --picture ... --out ...`。
- **用自己的声音**：照提词器 `05-提词器版.md` 录一条整轨，按 `timeline.json` 的格式标出每句起止（或者用剪映自动字幕导出的时间），替换 `out/audio/voice.wav` 和 `timeline.json` 后，从第 3 步重跑。仓库 `claude/clever-meitner-l6m2ck` 分支里有「本人声音合成管线」，也可以接进来。
- **加 AI 主播**：这一版是「数据画面 + 旁白」的无脸版本。要加主播，在剪辑软件里把主播镜头插在这几个点：开场后（0:21）、长鑫段开头、终局结论「周期搬了家」、收尾；每段 3–6 秒，画面引擎那几秒是大字卡，盖住不影响信息。

## 已知限制

- 配音是开源 TTS，自然度不如真人；英文专有名词（Rosenblatt、Counterpoint）偶尔读得生硬，发布前听一遍，必要时在 `SAY` 表里改写法。
- 配乐和音效是代码合成的，干净但朴素；想更有质感，剪辑时换成有授权的曲库音乐即可（混音比例保持人声为主）。`mix.py --no-music` 出纯人声版。
- 2026-10-17 修复：第一版配乐的底鼓用「频率 × 绝对时间」算相位，每拍产生一次扫频，听起来是持续的「吱吱 / biu biu」电波声。现在底鼓按单拍积分相位、去掉噪声滴答、整条配乐过低通，混音改为 24kHz 原生采样、编码时用 ffmpeg 升到 48kHz。
- 图表除标明「示意」的以外，数字都来自 `facts.csv`；改数字要先改台账再改 `scenes.html`。

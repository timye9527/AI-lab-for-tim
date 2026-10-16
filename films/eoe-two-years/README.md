# 一个社恐的两年奇遇记

副标题：误入一家奇葩俱乐部之后……
9:16 竖屏 AI 动画微电影，1080×1920，30fps。

当前进度：**第一阶段：开场样片（约 11 秒）**。完整方案、成本和分镜见 [`docs/制作方案.md`](docs/制作方案.md)。

## 直接看

| 文件 | 内容 |
|---|---|
| `dist/opening-sample.mp4` | 开场样片（带字幕） |
| `dist/opening-sample-nosub.mp4` | 开场样片（无字幕） |
| `dist/poster.jpg` | 封面候选（警报那一帧） |
| `dist/character-sheet.png` | Tim 角色设定图：转面、表情、配色 |

## 技术路线（一句话）

**程序化动画**：角色、场景、镜头、光影全部用代码在 Canvas 上逐帧绘制，用无头 Chromium 渲染成 PNG，ffmpeg 合成。
配乐和音效由自写的合成器生成（沿用《把時間拿回來》的 `synth.js`），配音用离线开源 TTS（Kokoro v1.1-zh）。
不是 AI 视频模型生成，也没有用静态图片缩放。不需要付费 API。

## 目录

```
src/timeline.js     时间轴：镜头表、关键节点、心跳、配音和字幕（画面和声音共用）
src/tim.js          Tim 的参数化角色：正面 / 侧面 / 手部特写，表情和姿态都是参数
src/scenes.js       场景：门口全景、反打街景、密码锁特写、警报幻想、乌鸦
src/fx.js           光影和后期：角色打光（暗部 + 轮廓光）、泛光、颗粒、暗角、色差
src/film.js         镜头调度和表演：每个镜头的机位、动作、打光、字幕
src/audio/          合成器（synth.js）和配乐 / 音效 / 配音混音（score.js）
src/sheet.html      角色设定图
assets/vo/          配音 wav（scripts/vo.py 生成）
scripts/            配音、渲染、合成、静帧审片
```

## 常用命令

需要 Node 20+、ffmpeg（含 libx264）、Chromium（或用 `CHROME=/path/to/chrome` 指定）。

```bash
npm install                          # 只装 playwright-core 和两个字体包
npm run build                        # 配乐 → 逐帧渲染 → 合成，约 2 分钟（4 核）
SUBS=0 npm run frames && SUBS=0 npm run encode   # 无字幕版
node scripts/stills.mjs 2.6 6.3      # 审片静帧，输出到 review/
node scripts/snap.mjs src/sheet.html dist/character-sheet.png 1920 1200   # 角色设定图
```

改配音：编辑 `src/timeline.js` 里的 `VO`，再跑

```bash
pip install sherpa-onnx soundfile
# 模型：https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_1.tar.bz2
KOKORO=/path/to/kokoro-multi-lang-v1_1 python3 scripts/vo.py
```

换成真人配音：把录音剪成 `assets/vo/l1.wav` 等（单声道 16-bit，任意采样率），更新 `durations.json` 里的时长即可，其他不用改。

## 怎么改

| 想改的东西 | 文件 |
|---|---|
| 镜头时长、节奏、配音和字幕文字 | `src/timeline.js` |
| Tim 的长相、衣服颜色、表情 | `src/tim.js`（`PAL` 是配色） |
| 某个镜头的动作和机位 | `src/film.js` 里对应的 `shotXxx` 函数 |
| 场景美术 | `src/scenes.js` |
| 音乐和音效 | `src/audio/score.js` |

## 素材来源与授权

- 画面：全部 Canvas 2D 程序绘制，没有外部图片，没有使用真人照片。
- 声音：自写合成器，没有采样素材。
- 配音：Kokoro-82M v1.1-zh（Apache-2.0），经 sherpa-onnx 离线运行。
- 字体：Noto Sans SC、站酷快乐体（SIL OFL 1.1，npm `@fontsource`）。

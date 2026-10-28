# AI省下的钱，被谁赚走了？

4–5 分钟横版二维动画经济科普（16:9，1920×1080，30fps）。主角是两个虚构人物：县城婚庆公司老板小陈、街对面工作室的小李。

**当前进度：G1 已过，G3 声音样片准备中；画面路线等主理人比完画风（[提示词.md](提示词.md)）再定。** 还没有生成任何视频。

## 文件

| 文件 | 内容 |
|---|---|
| [制作方案.md](制作方案.md) | 结论、标题、三次反转、角色设定、视觉风格、提示词、复用方案、剪辑节奏、合规、接下来的步骤 |
| [分镜表.md](分镜表.md) | 65 个镜头：时间码、旁白、画面、景别和镜头运动、音效音乐、屏幕文字、资产（生成文件） |
| [资产清单.md](资产清单.md) | 49 项角色、场景、道具、信息图，以及各自用在哪几镜（生成文件） |
| [提示词.md](提示词.md) | 三种画风对比 + 12 条全套文生图提示词（生成文件，数据在 `prompts.mjs`） |
| [口播稿.md](口播稿.md) | 配音用定稿候选：相对原稿的 4 处改动、读音覆盖表草稿 |
| `storyboard.mjs` | 分镜数据，**唯一来源**；以后直接当时间轴用 |
| `assets.mjs` | 资产数据 |
| `scripts/board.mjs` | 从数据生成分镜表、资产清单和审片页数据，并自检 |

## 改分镜

```bash
# 改 storyboard.mjs / assets.mjs，改了口播要同步改 口播稿.md
node video/ai-wedding/scripts/board.mjs          # 重新生成 + 自检（口播逐字对应、资产编号、假设角标、三次反转顺序、长镜头）
npm run video:lint -- video/ai-wedding/口播稿.md  # 稿件预检
```

## 定稿参数

已定（2026-10-28 主理人确认）：

| 项 | 定稿 |
|---|---|
| 标题 | AI省下的钱，被谁赚走了？ |
| 时长 | 约 5 分钟，不删句 |
| 声音 | AI 女声（具体音色、语速待 G3 样片确认） |
| 画面路线 | 待定：A 国漫电影感 / B 温暖绘本感 / C 扁平科普动画（纯代码） |

## 配音（production/）

沿用存储视频 `video/memory-wallst/production/` 的管线：`numcn.py`（数字转中文）、`pronounce.py`（读音核对表）、`asr_check.py`（回听）原样搬来，只改了路径；`asr_check.py` 补了「英文缩写必须听得到」。

```bash
pip install sherpa-onnx soundfile numpy pypinyin
mkdir -p out/models && (cd out/models && bash ../../production/dl-models.sh)  # 模型都从 sherpa-onnx 的 GitHub 发布页下载，约 1 GB，放在 out/models/（不入库）
python3 production/pronounce.py                    # 读音核对表.md；「待确认」必须为 0
python3 production/voices.py screen                # Kokoro 55 个中文女声初筛（只当 ZipVoice 的音色参考）
python3 production/voices.py ref 23                # 生成参考音色 out/voice-ref/f23/
python3 production/tts.py --engine zipvoice --ref out/voice-ref/f23 --shots C49-C54 --out out/sample/f23
python3 production/tts.py --engine matcha --shots C49-C54 --out out/sample/matcha
```

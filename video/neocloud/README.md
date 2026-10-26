# 看懂AI主线 · CoreWeave 一个月跌掉 37%：AI 的第一张骨牌，倒在了债上

第二期，接存储那期的结论「周期从价格搬到了融资上」。横屏 16:9，目标 YouTube / B 站；口播约 8 分钟，全片不超过 10 分钟。

一句话主线：**订单不是现金。新云是借钱买铲子、再把铲子租出去的「二房东」：租金跑赢利息，是好生意；利息一涨，就是第一张骨牌。**
主钩子（常驻顶栏）：**新云，是 AI 的卖铲人，还是背债人？**

## 选题由来

| 线索 | 用法 |
|---|---|
| CoreWeave 十月股债双杀（股价 −37%、债券收益率 15%+、CDS 约 1200 基点） | 冷开场 + 一分钟「四刀」快剪；**说清楚大盘不是它一家拖下去的**（通胀、Meta 开支也在），它是「第一个被债市点名的」 |
| 马斯克 10/25：200+ 新云会「孔雀鱼式死亡和整合」 | 争议二，配「利益相关」打折卡和正反证据 |
| 段永平：算力租赁「短期有竞争力，三五年后大概率同质化，像光伏，只是门槛高很多」 | 争议三（全片约 2/3 处，最出圈的一段）。和内容工厂 003 期同一条素材，这里只讲他怎么看生意，**不提持仓** |
| 英伟达对新云约 1715 亿美元敞口、朗讯北电的供应商融资 | 争议三的「圈」，回扣存储那期 |

## 结构（沿用存储 v3，已过稿的爆款结构）

冷开场（结果 → 反转「订单越多，股价越跌」→ 三个问题）→ 5 秒片头 → 一分钟四刀 → 争议一：订单一千亿为什么还缺钱 → 争议二：马斯克说的大倒闭会成真吗 → 争议三：这笔账落在谁头上 → 多空总账 → 三个开关 → 回扣二选一（评论区打「铲」/「债」）+ 免责声明。

## 文件

| 文件 | 内容 |
|---|---|
| [02-脚本-10分钟.md](02-脚本-10分钟.md) | 口播稿，每个数字挂事实编号 |
| [facts.csv](facts.csv) | 事实台账 24 条，带出处、可信级别、保鲜期 |
| [07-发布包.md](07-发布包.md) | 标题、简介、章节、标签、封面、合规自查 |
| [08-读音核对表.md](08-读音核对表.md) | 全稿多音字（自动生成） |
| `production/` | 从存储分支复制的流水线，改了：场景、封面、英文读法、逐句缓存和重读、英文复听 |

## 定稿参数（声音沿用存储期 2026-10-19 定稿，不再改）

| 项 | 值 |
|---|---|
| 声音 | Kokoro v1.1 int8 男声 sid60 做参考（`make_ref.py --sid 60`），ZipVoice 全精度 16 步生成，1.08 倍速 |
| 配音库 | **sherpa-onnx 1.13.8**（2.0.0 会跳过所有英文词，`tts.py` 会拒绝） |
| 英文读法 | CoreWeave → Core Weave，OpenAI → Open A I，AI → A I，SpaceX → Space X（只改配音，字幕照写） |
| 画面 | 存储期「交易终端 × 战报」画风，红涨绿跌；1920×1080 25 帧 |
| 响度 | −14 LUFS（混音时 loudnorm） |

## 出片

```bash
cd video/neocloud
pip install sherpa-onnx==1.13.8 soundfile numpy pypinyin
npm i --prefix out --no-save playwright-core@1.56 @fontsource/noto-sans-sc@5 @fontsource/jetbrains-mono@5 && echo '{"type":"module"}' > out/package.json
# 模型放在仓库根 .cache/models（不提交）：zipvoice 两个、vocos_24khz、kokoro-int8-multi-lang-v1_1、paraformer-zh-small、sense-voice
source production/env.sh
node check.mjs                               # 事实、时长、合规
python3 production/make_ref.py --sid 60      # 频道音色参考
python3 production/tts.py                    # 配音：逐句缓存，回检不过自动重读（最多 4 次）
python3 production/sv_check.py --only 英文    # 英文句复听
node production/render.mjs                   # 画面，约 30–40 分钟
python3 production/mix.py                    # 配乐、音效、响度 → out/final/新云-CoreWeave.mp4
node production/cover.mjs && node production/chapters.mjs
node ../../scripts/video-final.mjs out/final/新云-CoreWeave.mp4 --platform youtube --srt out/audio/subtitles.srt --sheet out/final/sheet.jpg
```

## 合规

- 公司只作为行业事实出现；不说「买」「看好」「目标价」，不念股票代码，不推荐基金或板块；分析师评级只说「上调了评级」，不提目标价。
- 段永平只讲观点（据媒体转述，非原话），不提持仓。马斯克的话标「大意」，并标出利益相关。
- 口播结尾和全片竖排都有「不构成投资建议」；画面、简介不放链接、二维码、微信。

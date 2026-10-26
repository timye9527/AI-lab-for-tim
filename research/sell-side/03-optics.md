# 光模块：卖方观点（截至 2026-10-26）

> 标记：✅ 一手文件或多源一致　⚠️ 单一二手来源或口径冲突
> 背景：英伟达 2026 年在光子学上投了约 $65 亿（Lumentum、Coherent 各 $20 亿等），见 [../01-nvidia-investment-map.md](../01-nvidia-investment-map.md)。

## 行业级预测（最值得记进台账的数字）

| 券商 | 日期 | 预测 | 理由 | 可信度 |
|---|---|---|---|---|
| **高盛** | 2026-09 | 1.6T 及以上出货预期，2026 / 2027 / 2028 年分别**上调 29% / 61% / 50%**；全球光模块总出货上调 21% / 31% / 31% | 机架级服务器和 ASIC 服务器带来更多出货；每颗 GPU 对应的光模块用量增加；规格升级加速。核心器件趋紧、技术门槛提高，龙头份额会继续提升 | ⚠️ |
| 高盛（同一系列） | 2026-09 | 中际旭创 2026–28 年收入预测上调 57% / 100% / 118%，净利润上调 65% / 108% / 119%；首次覆盖 H 股 | 产能扩张快于预期（2026 年产能翻倍以上）；**200G EML 短缺可能限制 Fabrinet 的 1.6T 出货**，中际旭创主要走硅光、不依赖 EML，反而受益 | ⚠️ |
| 高盛（转述） | 2026-09 | 1.6T 单价维持在 $700 以上，没有恶性价格战 | — | ⚠️ 单一自媒体 |
| **大摩** | 约 2026-05 | 1.6T 出货：2027 年从 2400 万只**上调到 7900 万只**，2028 年从 2700 万只上调到 8700 万只；AI 光收发器市场 2028 年 $1020 亿（2025 年 $180 亿） | 引用 Lumentum CEO：美国大厂对光器件的需求仍在加速 | ⚠️ |
| **伯恩斯坦** | 10/19 | 光模块回调**不改变基本面**；亚洲供应链调研：1.6T 可插拔和 3.2T CPO 的单位带宽价格基本持平；预计 Coherent 收入超共识 | 维持 Lumentum、Coherent 跑赢大市 | ⚠️ |
| 国内券商中报回顾（同花顺转述，券商未注明） | 2026-07 | 行业处在 1.6T 上行周期中段，3.2T 预计 2028 年起量；瓶颈在 DSP 芯片、高速 EML 芯片、磷化铟衬底 | 上半年光模块 / 光器件 / 光芯片板块累计涨约 87.6%，是最拥挤的赛道之一 | ⚠️ |

## 两大争论

### 1. CPO（共封装光学）什么时候量产？

| 观点 | 谁 | 说法 | 可信度 |
|---|---|---|---|
| **晚** | SemiAnalysis Dylan Patel | 真正量产要到 **2028 年底–2029 年**，现在良率和供应链都没准备好；英伟达 Rubin、Feynman 还会用铜，中短期利好铜连接供应商 | ⚠️（访谈日期不明） |
| **担忧被夸大** | 摩根大通 Samik Chatterjee | 6/12：光通信降温是买入优质标的的机会（重点 Coherent）；当时 Coherent、Lumentum 分别跌约 17%、15%，原因是夏季缺催化剂和担心 CPO 推迟；他认为英伟达的 CPO 推出会缓解担忧，「CPO 采用的担忧似乎被夸大」 | ⚠️ |
| 风险提示 | 大摩（8 月 Lumentum 报告） | 主要风险：AI 估值转向、磷化铟（InP）产能约束、下一代 GPU 架构推迟、**NPO（近封装光学）采用推迟** | ⚠️ |

**我的读法**：CPO 早晚决定可插拔光模块的生命周期。Patel 的「晚」对中际旭创、Fabrinet 这类可插拔龙头是利好；对押 CPO 的激光器 / 光引擎厂商是利空。两边都值得记进台账，2027 年 GTC 对账。

### 2. 美国会不会限制中国光模块？

- 8 月 Reuters 报道：特朗普政府在起草 FCC 措施，禁止中国**新型号**光模块进入美国，理由是防恶意软件和数据窃取。中际旭创当天深圳跌 7.3%、香港跌 6.7%，新易盛跌 5.3%。⚠️
- 后续 SCMP 报道：FCC 更新规则时**没有覆盖光模块**，中国厂商暂时躲过。⚠️（日期和范围要核实）
- 10 月：一份大摩客户报告（Benzinga 称未核实）认为限制如果来，**最先针对 3.2T**，分阶段实施。当天 Coherent 涨 11%、Lumentum 涨 7.7%。Futurum 的 Shay Boloor 观点一致：不影响当前 800G 和 1.6T 的建设。⚠️
- **分歧**：杰富瑞认为禁令落地概率低，更像谈判筹码；Counterpoint 的 Neil Shah 认为西方厂商一两年内吸收不了中际旭创和新易盛的产量。⚠️
- 事实背景：中际旭创约占全球数据中心光模块 27% 份额；6 月被列入五角大楼 1260H 清单（政府承包商不能采购）；新易盛约 96% 收入来自海外。⚠️

## Lumentum LITE

| 券商 / 分析师 | 日期 | 评级 / PT | 核心观点 | 可信度 |
|---|---|---|---|---|
| **杰富瑞 Blayne Curtis** | 10/20 | 买入 / 1,200→1,250 | 1.6T 敞口；在谷歌 **光路交换（OCS）** 需求里可能拿到的份额 | ⚠️ |
| 花旗 | 10 月 | 买入 / 1,200→**1,400** | — | ⚠️ |
| 伯恩斯坦 | 10 月 | 首次覆盖跑赢 / 1,220 | 见上方行业判断 | ⚠️ |
| Stifel | — | 1,100→1,232 | — | ⚠️ |
| 大摩 | 8 月 | 上调 PT | 利润率前景改善；风险见上 | ⚠️ |
| Zacks | 10/14 | 强烈买入→持有 | 量化评级，不是卖方研究 | ⚠️ |

- 共识平均 PT 约 $1,079（MarketBeat 23 家，10/14）到 $1,179（26 家）。⚠️
- 股价：10/12 跌约 9.8%（没有明确催化剂），10/22 再跌（板块走弱、财报前谨慎、内部人卖出）。**11/5 发 FQ1 FY27 财报。**

## Coherent COHR

**业绩底稿** ⚠️：FQ4 FY26 营收 $20.5 亿；数据中心与通信业务利润同比增近 60%；客户订单排到 2028 年，长协签到这个十年末；1.6T 初期由 EML 和硅光平台主导，200G VCSEL 方案的 1.6T 在 2026 下半年放量；管理层预计 1.6T 毛利率高于 800G。

| 券商 / 分析师 | 日期 | 评级 / PT | 核心观点 | 可信度 |
|---|---|---|---|---|
| 伯恩斯坦 | 10/19 | 跑赢 / 350 | 回调不改基本面，预计收入超共识 | ⚠️ |
| Susquehanna | 10/21 | 正面 / 425→350 | 下调目标价，维持评级 | ⚠️ |
| Rosenblatt | 9 月 | **500**（街头最高） | — | ⚠️ |
| Raymond James | 2–5 个月前 | 强烈买入 / 371→435 | — | ⚠️ 偏旧 |
| 美银 | 2–5 个月前 | 中性 / 365→400 | — | ⚠️ 偏旧 |
| 摩根大通 Samik Chatterjee | 6/12 | 增持 | 见上方 CPO 争论 | ⚠️ |

- 9 月的下跌主要因为 **$20 亿增发** 和板块获利了结，不是基本面变差。⚠️
- 平均 PT 约 $395–416。**11/4 发财报。**

## Fabrinet FN（代工，英伟达是大客户）

- 8 月 FQ4：业绩全面超预期，但数据通信业务环比 -1%，股价盘前跌超 11%。**英伟达给 Fabrinet 的收入 FY26 下降 21% 到 $7.42 亿**。⚠️
- B. Riley：中性，8 月 635→598，10/14 再降到 **431**（理由：数据通信疲弱、英伟达收入下滑）。⚠️
- Susquehanna：10/22 给出 $600。巴克莱 $739、摩根大通 $695（8 月，下跌时仍上调）。⚠️
- 高盛：200G EML 短缺可能限制 Fabrinet 的 1.6T 出货。⚠️
- 共识平均约 $651（10 家，区间 $431–800）。⚠️

## Ciena CIEN

- Evercore ISI 上调评级，PT 375→550，认为是有吸引力的光网络标的。⚠️
- 区间：摩根大通 $605（最高）到 B. Riley $347（最低），12 家平均约 $488，75% 买入。⚠️
- 有报道称 10 月某日 Ciena、Lumentum 跌约 10%，Coherent 跌近 8%。⚠️

## 缺口

- **Credo（CRDO，有源电缆）**：没找到 2026 年 10 月具名卖方观点（搜到的多是 2025 年的目标价），下次补。Patel 的「Rubin / Feynman 继续用铜」对 Credo 是利好论据。
- **Astera Labs、Corning、AAOI**：本次未覆盖。
- 新易盛：只有公司表态（1.6T 放量 Q3 / Q4 加速），没有大行目标价。

---

## 来源

- 高盛：格隆汇 / 同花顺 <https://news.10jqka.com.cn/20260912/c679847132.shtml>、<https://news.10jqka.com.cn/20260912/c679847226.shtml>；虎嗅 <https://www.huxiu.com/article/4896774.html>；搜狐 <https://www.sohu.com/a/1091879728_122062530>；华尔街见闻 <https://wallstreetcn.com/articles/3759819>
- 大摩：网易 <https://www.163.com/dy/article/KU33O50G05568W0A.html>
- 伯恩斯坦：TechFlow <https://www.techflowpost.com/en-US/article/34749>、<https://www.techflowpost.com/en-US/newsletter/140743>
- 中报回顾：同花顺 <https://stock.10jqka.com.cn/20260709/c678078259.shtml>；第一财经 <https://www.yicai.com/news/103284141.html>
- CPO：Dylan Patel（TechFlow）<https://www.techflowpost.com/en-US/article/31981>；摩根大通（GuruFocus）<https://www.gurufocus.com/news/8914309/coherent-cohr-and-lumentum-lite-present-investment-opportunities-says-jpmorgan-analyst>；大摩（Investing.com）<https://www.investing.com/news/analyst-ratings/morgan-stanley-raises-lumentum-stock-price-target-on-margin-outlook-93CH-4854129>
- 美国限制：Benzinga <https://www.benzinga.com/trading-ideas/movers/26/10/62117250/lumentum-coherent-rip-higher-as-washington-targets-chinese-optical-transceivers>；SCMP <https://scmp.com/tech/article/3363079/chinese-optical-module-stocks-rebound-analysts-downplay-mild-ai-curbs-proposed-us>、<https://www.scmp.com/tech/big-tech/article/3367219/chinese-optical-transceiver-makers-dodge-us-ban-now-fcc-updates-rules>；Fierce Network <https://www.fierce-network.com/broadband/proposed-us-ban-chinese-optical-transceivers-threatens-ai-data-center-boom>
- Lumentum：ad-hoc-news（杰富瑞）<https://www.ad-hoc-news.de/boerse/news/vorboerse/lumentum-stock-jefferies-lifts-target-to-usd-1-250-pre-market/70391333>；ad-hoc-news（共识）<https://www.ad-hoc-news.de/boerse/news/corporate-news/23-analysts-set-usd-1-078-75-target-for-lumentum-stock/70330657>；stockanalysis <https://stockanalysis.com/stocks/lite/>；Quiver <https://www.quiverquant.com/news/Lumentum+Holdings+Shares+Fall+as+AI+Optics+Pullback+Continues+Ahead+of+Earnings>
- Coherent：Futurum <https://futurumgroup.com/insights/coherent-q4-fy-2026-earnings-1-6t-transceivers-ramp-cpo-revenue-approaches/>；SDxCentral <https://www.sdxcentral.com/news/nvidia-backed-coherent-posts-record-quarter-as-ai-infrastructure-buildout-accelerates-optics-demand/>；247 Wall St. <https://247wallst.com/investing/2026/09/03/coherent-fell-hard-over-3-months-it-will-nearly-double-according-to-these-analysts/>；TradingView <https://www.tradingview.com/news/invezz:9e4350190094b:0-coherent-lumentum-stocks-continues-surge-how-high-can-the-ai-trade-go/>
- Fabrinet：Insider Monkey <https://www.insidermonkey.com/blog/fabrinet-fn-beat-every-estimate-its-stock-still-fell-11-1822230/>；MarketBeat <https://www.marketbeat.com/stocks/NYSE/FN/forecast/>；Defense World <https://www.defenseworld.net/2026/10/22/fabrinet-nysefn-given-new-600-00-price-target-at-susquehanna.html>
- Ciena：Yahoo（Evercore）<https://finance.yahoo.com/markets/stocks/articles/evercore-cien-target-implies-58-133608586.html>；HeyGoTrade <https://www.heygotrade.com/en/us-stock/cien/>；TIKR <https://www.tikr.com/blog/coherent-stock-falls-nearly-8-as-ciena-and-lumentum-drop-about-10-heres-where-the-stock-could-go-by-2031>

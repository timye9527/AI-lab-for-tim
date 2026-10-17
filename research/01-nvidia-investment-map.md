# 英伟达投资版图与产业布局逻辑（截至 2026-10-08）

> 先说清楚可信度：英伟达**不公布**完整投资清单。下面的数据来自 SEC 文件（10-Q / 13F / 8-K）和各家媒体报道，不同来源的口径经常冲突。
> 标记：✅ = 一手文件或多个来源一致　⚠️ = 只有单一二手来源，或口径有冲突，引用前要核实

---

## 0. 一句话结论

英伟达已经从“卖铲子的人”变成了 **“AI 时代的产业资本配置者”**。它用资产负债表做三件事：

1. **给下游托底**：投资那些买它 GPU 的客户（新云厂商、模型实验室），再配上产能回购或担保，让信用不够的买家也能融到钱、下得了单；
2. **在上游锁瓶颈**：光互联、EDA、x86 生态、推理芯片，提前锁住下一代架构（Rubin → Feynman）需要的关键产能和技术；
3. **在新场景占位**：物理 AI/机器人、自动驾驶、生物/材料、量子、6G、主权 AI。每个新场景都是 CUDA 新的需求来源。

框架用黄仁勋自己的 **“AI 五层蛋糕”**：能源 → 芯片 → 基础设施 → 模型 → 应用（NVIDIA 官方博客《AI Is a 5-Layer Cake》，2026-03-10）。英伟达的投资几乎把这五层全部覆盖了。

---

## 1. 规模：先分清口径

| 口径 | 数字 | 时间 | 来源 | 可信度 |
|---|---|---|---|---|
| 股权投资总额（10-Q） | **约 $990 亿**，约为一年前的 10 倍 | 2026-07-26（Q2 FY27） | CNBC 2026-09-04，引 10-Q | ✅ |
| 其中可交易与不可交易的拆分 | 不同报道分别给出 $428 亿 / $512 亿，以及约 $480 亿 / $480 亿 | 同上 | 二手解读 | ⚠️ |
| 另有未出资的股权投资承诺 | 约 $250 亿 | 同上 | 二手 | ⚠️ |
| 不可交易股权（私有公司） | $222.5 亿（一年前只有 $33.9 亿） | 2026-01 底 | FY26 10-K | ✅ |
| FY26 投向私有公司和基础设施基金 | $175 亿 | FY26 | 公司文件 | ✅ |
| 2026 年前 4 个月新增股权承诺 | > $400 亿 | 2026-05 | CNBC 2026-05-09 | ✅ |
| CFO 口径：投向前沿 AI 实验室 | “近 $500 亿” | 2026 | Colette Kress | ✅ |
| 13F 公开持仓市值 | $634.4 亿（2026-06-30）→ 约 $464.3 亿（9 月初） | 2026 Q2 | Dow Jones 数据 | ✅ |
| 2025 年风投交易笔数 | 约 67 笔（2024 年 54 笔，PitchBook） | 2025 | TechCrunch | ✅ |
| NVentures（风投部门）2025 年笔数 | 21 笔或 30 笔，说法不一 | 2025 | 二手 | ⚠️ |

**投资主体分两层**：最大的战略投资由 **Corporate Development（企业发展部）** 负责，例如 OpenAI、Anthropic、Intel、Synopsys、CoreWeave、Nebius、xAI；**NVentures** 负责更广泛的创业公司早期下注（据报道只是一个两人团队，2021 年以来孵出约 20 家独角兽）。

---

## 2. 按“五层蛋糕”拆解投资版图

### L1 能源（黄仁勋：“能源是 AI 的第一性约束”）
| 标的 | 动作 | 时间 | 可信度 |
|---|---|---|---|
| Emerald AI | A 轮（让数据中心能灵活响应电网调度） | 2026-08 | ⚠️ |
| Commonwealth Fusion Systems（核聚变） | NVentures 参投 | 2025（据报道） | ⚠️ 待核实 |
| TerraPower（小型核电） | NVentures 参投 | 2025（据报道） | ⚠️ 待核实 |
| 与 Apollo、BlackRock、Blackstone、Brookfield、高盛、KKR 搭建融资平台 | 号称可撬动 > $5000 亿 | 2026 | ⚠️ |

> 观察：英伟达在能源层的**直接股权**很少，主要靠“讲故事加拉合作伙伴”。能源是英伟达自己不做、但最卡它脖子的一层，所以是**我们最值得延伸研究的触角之一**（见 06 文件）。

### L2 芯片与半导体供应链（锁瓶颈）
| 标的 | 动作 | 时间 | 逻辑 | 可信度 |
|---|---|---|---|---|
| **Intel** | $50 亿股权；双方合作开发 NVLink 定制 x86 数据中心和 PC 产品 | 2025-12 完成 | x86 生态加上美国本土制造；6/30 市值约 $300 亿，8 月底约 $192 亿 | ✅ |
| **Synopsys** | $20 亿 | 2025-12 | EDA 加上 GPU 加速仿真 | ✅ |
| **Groq** | 约 $200 亿，“资产收购 + 非独家授权 + 创始人 Jonathan Ross 等加入” | 2025-12 | 推理专用 LPU；GTC 2026 发布了 **Groq 3 LPU**，已写入 Feynman 时代路线图 | ✅（交易结构有争议） |
| **Enfabrica** | 超过 $9 亿，“授权加招揽团队” | 2025-09 | 网络与内存互联 | ✅ |
| **Lumentum / Coherent** | 各 $20 亿股权，加多年采购承诺和优先产能 | 2026-03-02 | 光器件：铜缆换成光 | ✅ |
| **Marvell** | $20 亿，联合开发硅光和定制 XPU | 2026-03 | 光互联架构 | ✅（具体日期说法不一） |
| **Corning** | $5 亿认股权证加采购协议，合计最高 $32 亿 | 2026 | 光纤产能 | ⚠️ 金额口径不一 |
| **Ayar Labs** | 参投 $5 亿 E 轮 | 2026 | 光 I/O 芯片（CPO） | ✅ |
| **Nokia** | $10 亿 | 2025-10 | AI-RAN / 6G | ✅ |
| Arm | 13F 长期持仓 | — | 历史持仓（2022 年收购 Arm 失败） | ✅ |

> **2026 年最集中的主题就是光子学**：3 月以来至少投了约 $65 亿，覆盖光器件、互联架构、光 I/O 和光纤。有报道称这可能锁住全球高端激光器件到 2027 年的产能 ⚠️。
> **交易结构值得注意**：Groq 和 Enfabrica 都用“授权加人才”而不是直接收购，被普遍解读为**绕开反垄断审查**（英伟达 2022 年 $400 亿收购 Arm 就是被监管否决的）。

### L3 基础设施 / 新云 / 主权 AI（给需求托底）
| 标的 | 动作 | 时间 | 可信度 |
|---|---|---|---|
| **CoreWeave** | 2023 年起持股；2026-01 再投 $20 亿；另有约 $63 亿“兜底购买未售出算力”协议，到 2032-04 | 2023–2026 | ✅ |
| **Nebius** | $20 亿（预融资认股权证，所以暂不出现在 13F），目标 2030 年前 5GW | 2026-03 | ✅ |
| **IREN** | 最高 $21 亿，最多 5GW 容量 | 2026 | ✅ |
| Crusoe | F 轮 | 2026-09 | ⚠️ |
| Nscale | 参与 pre-IPO 可转债（报道规模 $33.6 亿） | 2026-09 | ⚠️ |
| Lambda、Firmus、Applied Digital（13F）、Together AI、Fireworks AI | 多轮 | 2025–2026 | ✅/⚠️ |
| 德国电信 Industrial AI Cloud | 约 €10 亿合作，约 1 万张 GPU，2026-02-04 在慕尼黑启用，SAP 参与打造 “Germany Stack” | 2026 | ✅ |
| 沙特 Humain | 5 年内建设最多 500MW 的 AI 工厂，数十万张 GPU | 2025-05 起 | ✅ |

> 2026-08 财报电话会上，黄仁勋**主动为“托底融资”辩护**：很多算力公司不是投资级信用，没有足够的财务记录，没法低成本融资。也就是说，英伟达在用自己的 AA- 信用，替下游客户扩大购买力。

### L4 模型（“所有基础模型公司我们都想投”）
| 标的 | 动作 | 时间 | 可信度 |
|---|---|---|---|
| **OpenAI** | $300 亿（约 $1100 亿那一轮，估值约 $7300 亿）；最初的意向是“最高 $1000 亿加至少 10GW 部署” | 2026-02 落地 | ✅ |
| **Anthropic** | 最高 $100 亿；Anthropic 承诺采购 Grace Blackwell / Vera Rubin 系统 | 2025-11 | ✅ |
| **xAI → SpaceX** | 投资 xAI（报道金额从 $20 亿到 $100 亿不等），xAI 2026-02 并入 SpaceX 后转为 SpaceX 股份；6/30 13F 显示约 $210 亿 | 2025–2026 | ✅ 持仓 / ⚠️ 原始金额 |
| Safe Superintelligence | $50 亿 | 2026 | ⚠️ 单一来源 |
| Mistral | €17 亿 C 轮（2025-09），D 轮（2026-09） | 2025–2026 | ✅ |
| Reflection AI、Poolside（最高 $10 亿，报道中）、Prime Intellect、World Labs | 多轮 | 2025–2026 | ✅/⚠️ |
| 科学类模型：Generate Biomedicines（2026-02 IPO）、Basecamp Research、Genesis Therapeutics、Recursion（13F）、Orbital Materials | 多轮 | — | ✅ |

> ⚠️ 有矛盾：2026-03 有报道称黄仁勋表示 OpenAI 和 Anthropic “大概是最后一笔大额股权投资”，但 4 月他又说 “There are so many great foundation model companies, and we try to invest in all of them.” 要回到原始讲话核对。

### L5 应用 / 物理 AI / 前沿
| 方向 | 代表标的 |
|---|---|
| 开发者与企业应用 | Cursor、Perplexity、Synthesia、Runway、Lovable、Legora（法律，估值 $56 亿）、Aidoc（医疗，$1.5 亿轮）、XBOW（安全）、Tensormesh、Weka |
| **机器人与物理 AI** | Figure（C 轮估值 $390 亿）、Neura Robotics（2026-06，C 轮最高 $14 亿 ⚠️）、Generalist AI、World Labs |
| 自动驾驶 | Wayve、Oxa（2026-03，$1.03 亿轮）、WeRide（13F） |
| 量子 | PsiQuantum、Quantinuum（2026-06 在 Nasdaq 上市）、Alice & Bob |

---

## 3. 投资逻辑提炼（我们自己的归纳）

| # | 逻辑 | 证据 | 对我们的含义 |
|---|---|---|---|
| 1 | **需求托底 / 循环融资**：投资客户，客户再买 GPU | CoreWeave $63 亿兜底；Nebius、IREN 的 GW 级部署承诺；Q2 电话会上黄仁勋的辩护 | 新云厂商的**信用风险**最终由英伟达部分承担，要盯住新云的融资成本和 GPU 抵押贷款 |
| 2 | **锁上游瓶颈**：哪里卡脖子就投哪里 | 2026 年约 $65 亿投光子学；Intel、Synopsys | **英伟达投什么，往往说明下一个瓶颈在哪**。现在指向光互联、先进封装、电力和存储 |
| 3 | **用“授权加人才”吸收技术，同时防守** | Groq $200 亿、Enfabrica $9 亿 | 推理专用芯片这条路，英伟达已经把最强的对手“收编”了 |
| 4 | **不押单一赢家，押整个 token 产量** | OpenAI、Anthropic、xAI、Mistral、SSI、Reflection…… | 模型层谁赢都行，只要 token 需求涨。核心指标是 **token 产量和推理需求** |
| 5 | **用新场景创造新需求** | 机器人、自动驾驶、生物、量子、6G、主权 AI | 每个“新垂直领域”都是 CUDA-X 库加上一批被投公司，可以跟着 GTC 的发布顺藤摸瓜 |
| 6 | **资产负债表成为武器** | Q2 FY27 营收 $962 亿、净利 $597 亿；Q3 指引 $1080 亿 | 投资规模相对现金流可以承受，但 13F 市值波动开始影响利润表（Intel 持仓已从 $300 亿跌到约 $192 亿） |

**黄仁勋 2026 年的核心叙事关键词**（用来校准上面的逻辑）：

- “**AI factory / token factory**”：数据中心是生产智能的工厂，token 是产品；
- “**Compute is revenue**”（2026-08 财报）：AI 已到拐点，token 本身有生产力、能赚钱；
- “**Inference inflection**”加 **agentic AI → physical AI**；
- **到 2027 年 Blackwell + Rubin 的订单能见度至少 $1 万亿**（GTC 2026，比一年前给的 $5000 亿翻倍）；
- 一年一代的路线图：**Vera Rubin（2026 下半年量产）→ Rubin Ultra / Kyber 机架（2027）→ Feynman + Rosa CPU + 光 NVLink + Groq LPU（2028）**；
- 指引 FY28 营收增速约 70%（分析师原先预期 44%，具体是黄仁勋还是 CFO 说的，报道不一致 ⚠️）；
- 中国：Q3 指引里**假设中国数据中心计算收入为 0**。

---

## 4. 风险与反方观点（必须同时看）

- **循环融资和泡沫论**：Ed Zitron 把英伟达类比成 GE Capital；Bloomberg 专门做了 “AI Circular Deals” 图解。
- **披露缺口**：哪些被投公司同时是客户、有没有优先供货或价格优惠，目前都看不到。据报道 SEC 和华尔街已开始问询 ⚠️。
- **13F 市值波动**直接影响 GAAP 利润。
- **Situational Awareness LP**（Leopold Aschenbrenner 的基金）2026 Q1 持有约 900 万股 NVDA 看跌期权，约占组合 11%。这是反向信号，值得跟踪。
- **大客户自研芯片**：Google TPU、亚马逊 Trainium、OpenAI 和 Broadcom 合作，以及马斯克的 Terafab（见 03 文件）。

---

## 5. 附：AMD（第二优先级，先存档）

- **OpenAI 交易（2025-10）**：6GW Instinct GPU，2026 下半年开始首批 1GW MI450；AMD 给 OpenAI **最多 1.6 亿股、行权价 $0.01 的认股权证**，按部署量和股价里程碑（最高一档 $600/股）分批解锁，全部行权后 OpenAI 约持有 AMD 的 10%。这是**反向的循环融资**：英伟达是“我投你，你买我”，AMD 是“你买我，我送你股份”。
- **ZT Systems**：$49 亿收购（2025-03 完成），保留约 1000 人的机架级设计团队，把制造部分以 $30 亿卖给 Sanmina。
- **AMD Ventures**：50 多家活跃被投公司，AI 方向投入超过 $10 亿，目标是推动 ROCm 普及和 Instinct GPU 的需求；被投公司包括 World Labs、Runway、Cohere 等。
- **沙特 Humain**：最高 $100 亿、500MW。
- 有报道称 AMD 和 MediaTek 也联合投资了 Ayar Labs，在光子学上和英伟达形成对冲 ⚠️。

---

## 来源（按重要性排序）

- SEC EDGAR – NVIDIA（CIK 1045810）：<https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810>（Q2 FY27 10-Q：`nvda-20260726.htm`；Q3 FY26 8-K）
- CNBC – Nvidia's investments grow to $99 billion（2026-09-04）：<https://www.cnbc.com/2026/09/04/nvidia-ai-investments-99-billion.html>
- CNBC – Nvidia embraces AI investor, topping $40 billion（2026-05-09）：<https://www.cnbc.com/2026/05/09/nvidia-embraces-ai-investor-topping-40-billion-in-equity-bets-2026.html>
- TechCrunch – Nvidia's AI empire: top startup investments（2026-01-02 版）：<https://techcrunch.com/2026/01/02/nvidias-ai-empire-a-look-at-its-top-startup-investments/>
- Bloomberg – AI Circular Deals（图解）：<https://www.bloomberg.com/graphics/2026-ai-circular-deals/>
- NVIDIA Blog – AI Is a 5-Layer Cake：<https://blogs.nvidia.com/blog/ai-5-layer-cake>
- Motley Fool – Companies in Nvidia's $99B portfolio：<https://www.fool.com/investing/2026/09/13/here-are-all-the-companies-in-nvidias-99-billion/>
- TechSpot – Nvidia's $63B stock portfolio is a map of its own supply chain：<https://www.techspot.com/news/113672-nvidia-63-billion-stock-portfolio-map-own-supply.html>
- TNW – Nvidia $6.5B photonics：<https://thenextweb.com/news/nvidia-photonics-investment-copper-bottleneck-ai-data-centre>
- The Next Platform – Is Nvidia assembling its next inference platform（Groq / Enfabrica）：<https://www.nextplatform.com/2026/01/16/is-nvidia-assembling-the-parts-for-its-next-inference-platform/>
- io-fund – Nvidia, CoreWeave, Nebius circular financing：<https://io-fund.com/ai-stocks/nvidia-coreweave-nebius-circular-financing-gpu-boom>
- Network World – Nvidia's next move? Financing AI：<https://networkworld.com/article/4204543/nvidias-next-move-financing-ai.html>
- The Forward View – NVIDIA's $99B Equity Web and the Disclosure Gap：<https://theforwardview.com/essays/both-sides-of-the-ledger-vendor-equity-disclosure-gap>
- CNBC – European startups Nvidia backed in 2025：<https://www.cnbc.com/2026/01/26/nvidia-ai-startup-investments-europe-chips-jensen-huang.html>
- 投资追踪站：Tracxn NVentures <https://tracxn.com/d/venture-capital/nventures/__72RT_CJsiqrpcbOFu1VPO7osCvnURipMIhIWwLFtajg>、valueaddvc <https://valueaddvc.com/vc/nvidia-ventures>、aifundingtracker <https://aifundingtracker.com/nvidia-startup-investments/>、vcbacked <https://www.vcbacked.co/directory/investors/nvidia>
- Q2 FY27 财报：Outlook Business <https://www.outlookbusiness.com/corporate/nvidia-quarter-results-revenue-profits-data-centre-chips-jensen-huang-ai-investment-risk>
- GTC 2026：Jon Peddie <https://www.jonpeddie.com/news/nvidia-gtc-2026-keynote/>、NVIDIA blog <https://blogs.nvidia.com/blog/gtc-2026-news/>
- AMD × OpenAI：<https://newsroom.amd.com/news/amd-and-openai-announce-strategic-partnership-to-d/>
- 中文综述：证券时报 <https://www.stcn.com/article/detail/3903484.html>、36Kr <https://eu.36kr.com/en/p/3716969592927621>

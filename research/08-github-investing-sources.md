# GitHub 上的“聪明投资者”和高质量投研资源

> 检索时间：2026-10-08。★ 是检索当天的星数。打 📖 的是我克隆下来读过 README 或源码的。
> **先打预防针**：
> ① 星数不等于质量，2026 年 AI 投研类仓库的热度有很大的炒作成分；
> ② AI 生成的研究报告**都要回到原始文件核对**；
> ③ 仓库作者**自己报的收益率都没有经过验证**；
> ④ 以下都是研究工具，不是投资建议。

---

## 🥇 最推荐先看的 5 个

| # | 仓库 | ★ | 一句话 | 为什么跟我们的事直接相关 |
|---|---|---|---|---|
| 1 | 📖 [xbtlin/ai-berkshire](https://github.com/xbtlin/ai-berkshire) | 16.7k | 把巴菲特、芒格、段永平、李录四位大师的方法做成 Claude Code / Codex Skill，多个 Agent 从不同视角对抗分析 | **它已经做完了一整套“AI 五层蛋糕”研究**：总览、每一层的深度研究、50 家卡脖子公司筛选、光通信与存储、电力漏斗；还有《看懂英伟达》系列、CUDA 护城河三问、特斯拉和 Marvell 报告。共 2399 份报告、112 家公司。**可以直接拿来和我们的 01 文件对照、找分歧** |
| 2 | 📖 [muxuuu/serenity-skill](https://github.com/muxuuu/serenity-skill) | 4.1k | 把 X 博主 **Serenity（[@aleabitoreddit](https://x.com/aleabitoreddit)）** 的“供应链瓶颈”投研方法做成 Skill：从热点出发，拆产业链，找最难扩产、最难替代的环节，筛候选公司，再核对公告、财报、客户和产能 | **就是“英伟达投哪里，瓶颈就在哪里”的系统化版本**。Serenity 本人也值得加进观察名单（长期研究 AI、半导体、光通信、机器人供应链） |
| 3 | 📖 [byteseek/Mira](https://github.com/byteseek/Mira) | 275 | “可追溯、可复核、可持续刷新”的投资论点系统：每个判断都写明证据、成立的时间点、什么情况会证伪它、之后怎么监控 | **正好是我们“主张台账”的方法论模板**，把黄仁勋和马斯克的话变成可以证伪的论点 |
| 4 | [ZhuLinsen/daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis) | 66k | LLM 驱动的多市场股票分析：多源行情、实时新闻、决策看板、**自动推送、零成本定时运行** | 相当于 **follow-builders 的“股票版”**，fork 数高达 5.5 万，说明大量的人在自己跑它；它的推送管线可以参考 |
| 5 | 📖 [virattt/ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) | 63.9k | “AI 对冲基金团队”：一群投资大师 Agent 各自给出信号，再加回测和模拟盘（有防篡改的交易记录） | 大师覆盖最全：巴菲特、芒格、格雷厄姆、彼得·林奇、费雪、**德鲁肯米勒**、**迈克尔·伯里**、**木头姐**、阿克曼、达摩达兰、帕伯莱、塔勒布、Jhunjhunwala。适合拿同一条新闻看“不同大脑怎么想” |

---

## 一、聪明投资者的方法论（“借谁的脑子想”）

| 仓库 | ★ | 说明 |
|---|---|---|
| 📖 [BruceLanLan/augur](https://github.com/BruceLanLan/augur) | 627 | 18 位投资大师的“本地研究记忆系统”：每条证据带上**业务发生时间、可以获得的时间、实际获取的时间**；每次运行都存成不可修改的快照，三个月后可以回查“我当时知道什么” |
| [kangarooking/buffett-letters-skill](https://github.com/kangarooking/buffett-letters-skill) | 102 | 从巴菲特 60 多年的股东信里提炼出的价值投资、资本配置和行为纪律 Skill |
| [ReeceHarding/buffett-letters](https://github.com/ReeceHarding/buffett-letters) | 12 | **原始语料**：1977–2024 年 48 封巴菲特股东信，Markdown 格式 |
| [yuhuawu/howard_marks_memos](https://github.com/yuhuawu/howard_marks_memos) | 25 | 抓取霍华德·马克斯的备忘录，合并成带目录的 PDF（周期和风险思维的一手原文） |
| [jiaxinmmhh/duan-yongping-investing](https://github.com/jiaxinmmhh/duan-yongping-investing) | 1 | 把《大道：段永平投资问答录》蒸馏成投资判断框架 |
| [nuwa-skills/awesome-nuwa](https://github.com/nuwa-skills/awesome-nuwa) | 402 | 女娲人物 Skill 合集：巴菲特、芒格、段永平、达利欧、索罗斯、林奇、马克斯、蒂尔……（04 文件已列） |

## 二、研究工作流 / 不骗自己（“怎么想得对”）

| 仓库 | ★ | 说明 |
|---|---|---|
| 📖 [zhangxiaoqiang1991/luopan](https://github.com/zhangxiaoqiang1991/luopan)（罗盘） | 388 | 行业和公司研究的路由器：“看清行业的钱与权力”；数据来自腾讯自选股接口（A 股、港股覆盖深）；每条信息标信源等级 A/B/C |
| [quant-sentiment-ai/claude-equity-research](https://github.com/quant-sentiment-ai/claude-equity-research) | 726 | Claude Code 插件，机构风格的个股研究报告 |
| [LLMQuant/skills](https://github.com/LLMQuant/skills) | 229 | 投研 Skill 合集（个股、ETF、宏观、期权、风控） |
| [monarchjuno/tradingcodex](https://github.com/monarchjuno/tradingcodex) | 373 | 把 Codex 变成一个投研工作流团队 |
| [helsome/folio](https://github.com/helsome/folio) | 269 | 本地优先的 AI 投研工作台：深度调研、有证据支撑的投资论点、组合风险 |

## 三、每日信息流 / 投研驾驶舱（“follow-builders 的投资版”）

| 仓库 | ★ | 说明 |
|---|---|---|
| [ZhuLinsen/daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis) | 66k | 见上 |
| [simonlin1212/Vibe-Research](https://github.com/simonlin1212/Vibe-Research) | 2.6k | 个人投研 Agent（A 股、美股、港股）：每日复盘、**资讯雷达**、持仓、研究记录、回测 |
| [ginobefun/BestBlogs](https://github.com/ginobefun/BestBlogs) | 4k | bestblogs.dev：汇集编程、AI、产品和科技文章，**由大模型给文章摘要和打分**。“给信息打质量分”的做法可以借鉴 |
| [agentpit-io/hunter-community](https://github.com/agentpit-io/hunter-community) | 570 | 多智能体投研终端（A 股、港股、美股），本地运行 |

## 四、数据底座

| 仓库 | ★ | 说明 |
|---|---|---|
| [openbq-org/OpenBB](https://github.com/openbq-org/OpenBB) | 74k | 开源金融数据平台（面向分析师、量化和 AI Agent） |
| [Fincept-Corporation/FinceptTerminal](https://github.com/Fincept-Corporation/FinceptTerminal) | 32k | 开源的“彭博终端”式应用 |
| [simonlin1212/a-stock-data](https://github.com/simonlin1212/a-stock-data) | 10.7k | A 股全栈数据：87 个接口、34 个数据源，大部分不需要 Key |
| [JerBouma/FinanceToolkit](https://github.com/JerBouma/FinanceToolkit) | 5.4k | 透明的财务指标和估值计算，带 MCP Server |
| [dgunning/edgartools](https://github.com/dgunning/edgartools) | 2.8k | SEC 文件（04 文件已列） |
| [vibeyclaw/awesome-sec-filings](https://github.com/vibeyclaw/awesome-sec-filings) | 40 | SEC 文件（13F、10-K、10-Q、8-K）相关工具清单 |
| [dfdezdom/investdaytip](https://github.com/dfdezdom/investdaytip) | 27 | 含“超级投资人 13F 共识”选股池 |

## 五、资源清单（找更多东西的入口）

| 仓库 | ★ | 说明 |
|---|---|---|
| [mr-karan/awesome-investing](https://github.com/mr-karan/awesome-investing) | 2.5k | 经典投资资源清单（已归档，不再更新） |
| [Jera-Value/awesome-investing-tools-and-software-directory](https://github.com/Jera-Value/awesome-investing-tools-and-software-directory) | 98 | 361 个投资工具、数据集和社区 |
| [wilsonfreitas/awesome-quant](https://github.com/wilsonfreitas/awesome-quant) | 30k | 量化资源大全（偏量化，优先级低） |
| [hugo2046/QuantsPlaybook](https://github.com/hugo2046/QuantsPlaybook) | 6.4k | 复现券商金融工程研报（偏量化） |

---

## 从这些仓库里“顺藤摸瓜”找到的人和信息源

| 人 / 信息源 | 来自哪里 | 为什么值得加入观察 |
|---|---|---|
| **Serenity（@aleabitoreddit）** | serenity-skill | AI 供应链瓶颈研究，和“英伟达投哪里”的逻辑同源 |
| 公众号「复利炼丹炉」 | ai-berkshire 作者 | 五层蛋糕和英伟达的中文深度研究；⚠️ 收益截图是作者自己报的，有引流成分 |
| 德鲁肯米勒、迈克尔·伯里、木头姐的 13F | ai-hedge-fund 里的人物 | “聪明钱”实际的持仓变化，可以和英伟达的 13F 一起看 |
| SemiAnalysis InferenceX | GitHub 上的第三方抓取器 | 公开的推理性能基准数据（跨芯片对比） |

## 怎么用（建议）

1. **先读 ai-berkshire 的《AI 五层蛋糕》系列和《看懂英伟达》**，和我们的 01 文件对照，把分歧点列出来。分歧就是研究的起点。
2. 用 **serenity-skill 的方法**过一遍英伟达今年重点投资的方向（光子学、电力），看瓶颈判断是不是一致。
3. 用 **Mira 的格式**设计“主张台账”（论点、证据、时间点、证伪条件、刷新条件）。
4. 真要动手做推送时，参考 **follow-builders 和 daily_stock_analysis** 两条管线。

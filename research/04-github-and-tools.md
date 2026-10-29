# GitHub 与工具地图：别人已经造好的“轮子”

> 搜索时间：2026-10-08。星数是检索当天的数据。
> 结论先行：**没有现成项目专门追踪“黄仁勋 + 马斯克”**。但可复用的零件都已经有了：抓取（RSSHub）、汇总（follow-builders）、SEC 数据（edgartools）、人物思维模型（女娲.skill 系列）。我们可以把它们拼起来（见 06 文件）。

---

## 1. ⭐ 最值得参考的模板：信息汇总

| 仓库 | ★ | 是什么 | 对我们的价值 |
|---|---|---|---|
| [zarazhangrui/follow-builders](https://github.com/zarazhangrui/follow-builders) | 6.8k | “Follow builders, not influencers”：每天抓 26 个 AI builder 的 X 帖子、6 个播客的 YouTube 字幕和官方博客，用 Agent 整理成中文或英文摘要，推送到 Telegram、Discord 或邮件 | **几乎就是我们要的东西**，只是它没收录黄仁勋和马斯克。可以 fork 后把信息源换成“两个人加两家公司” |
| [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) | 46k | “万物皆可 RSS”：支持 X、YouTube、B 站、微信公众号、微博等 | 抓取层的基础设施 |
| [DIYgod/RSSHub-Radar](https://github.com/DIYgod/RSSHub-Radar) | 7.3k | 浏览器插件，自动发现当前页面的 RSS | 配合使用 |
| [JackyST0/awesome-rsshub-routes](https://github.com/JackyST0/awesome-rsshub-routes) | 887 | 精选 RSSHub 路由 | 找现成路由 |

## 2. 一手文本和转录

| 仓库 | ★ | 内容 |
|---|---|---|
| [c7b/CS153-Frontier-Systems-Transcripts](https://github.com/c7b/CS153-Frontier-Systems-Transcripts) | 1 | 斯坦福 CS153 “Frontier Systems” 课程的干净转录，带时间戳，嘉宾包括黄仁勋、Nadella、Altman、Ben Horowitz 等，作者说明“专门做成可以喂给 AI Agent 的格式” |
| [Princeu3/yc-startup-school-2026-notes](https://github.com/Princeu3/yc-startup-school-2026-notes) | 3 | YC Startup School 2026 现场笔记（黄仁勋、Boris Cherny、Jeff Dean），每条观点都标了来源 |

## 3. 人物“思维蒸馏”（把他们的思考方式变成可调用的 Skill）

| 仓库 | ★ | 说明 |
|---|---|---|
| [alchaincyf/nuwa-skill](https://github.com/alchaincyf/nuwa-skill) | 33.7k | **女娲.skill**：蒸馏任何人的心智模型、决策启发式和表达方式。可以用它基于我们收集的一手材料**自己蒸馏**“黄仁勋”和“马斯克” |
| [alchaincyf/elon-musk-skill](https://github.com/alchaincyf/elon-musk-skill) | 533 | 用女娲蒸馏出的马斯克.skill |
| [nuwa-skills/huangrenxun-skill](https://github.com/nuwa-skills/huangrenxun-skill) | 0 | 黄仁勋.skill（算力革命、加速计算、长期押注） |
| [zhanpengumich/jensen-huang-skill](https://github.com/zhanpengumich/jensen-huang-skill) | 1 | Claude Code Skill：用黄仁勋的视角分析技术、战略和产业问题 |
| [xelastarburst/virtual-jensen](https://github.com/xelastarburst/virtual-jensen) | 1 | 模拟黄仁勋做产品和技术决策，带“战略会议模式” |
| [wezendy/elon-musk-algorithm-skills](https://github.com/wezendy/elon-musk-algorithm-skills) | 11 | 把马斯克“五步算法”做成 Agent Skill |
| [justinz183/elon-skill](https://github.com/justinz183/elon-skill) | 34 | /elon 第一性原理导师 |
| [nuwa-skills/awesome-nuwa](https://github.com/nuwa-skills/awesome-nuwa) | 402 | 女娲人物合集，**投资人系列**：巴菲特、芒格、段永平、达利欧、索罗斯、彼得·林奇、霍华德·马克斯、彼得·蒂尔等 |

> ⚠️ 这些 Skill 都是“对公开材料的二次加工”，适合做**思考框架和推演**，不能当作事实来源。事实以 02 和 03 文件列出的一手渠道为准。

## 4. 产业链 / 投资研究

| 仓库 | ★ | 说明 |
|---|---|---|
| [zhongyuqianlaw-alt/ashare-ai-chokepoint](https://github.com/zhongyuqianlaw-alt/ashare-ai-chokepoint) | 1 | **用黄仁勋的五层框架整理 A 股 AI 产业链的“卡脖子”环节**，事件驱动选股（基于 akshare，研究和教学用途）。和我们的思路高度契合 |
| [bradenrbuchanan-ship-it/Ai-infra-supplychain---stockscreen](https://github.com/bradenrbuchanan-ship-it/Ai-infra-supplychain---stockscreen) | 0 | 英伟达芯片模型、2023–2030 年 AI 瓶颈分析、HBM、电力和电网分析、AI 供应链选股器 |

## 5. SEC / 财报数据（追踪“英伟达投了谁”）

| 仓库 | ★ | 说明 |
|---|---|---|
| [dgunning/edgartools](https://github.com/dgunning/edgartools) | 2.8k | **首选**。Python 读取 10-K、10-Q、8-K、13F 和 Form 4，MIT 协议 |
| [sareegpt/edgartools-mcp](https://github.com/sareegpt/edgartools-mcp) | 16 | edgartools 的 MCP Server，可以直接给 Claude 用 |
| [SEC-API-io/sec-api-python](https://github.com/SEC-API-io/sec-api-python) | 322 | 商业 API，覆盖全文搜索、13F 和实时流 |
| [codeastar/bplus_investor](https://github.com/codeastar/bplus_investor) | 0 | 追踪任意基金 13F 的季度变化，可以改成追踪英伟达 |

## 6. 网页端追踪器（非 GitHub）

| 名称 | 地址 | 用途 |
|---|---|---|
| Tracxn – NVentures | <https://tracxn.com/d/venture-capital/nventures/__72RT_CJsiqrpcbOFu1VPO7osCvnURipMIhIWwLFtajg> | NVentures 投资列表 |
| valueaddvc – NVentures | <https://valueaddvc.com/vc/nvidia-ventures> | 按时间排列的投资动态（更新最快） |
| AI Funding Tracker | <https://aifundingtracker.com/nvidia-startup-investments/> | 英伟达投资的创业公司 |
| FeedTheAI – NVentures 2026 Tracker | <https://www.feedtheai.com/nventures-portfolio-ai-startups-backed-by-nvidia/> | 同上 |
| FourWeekMBA – NVIDIA Portfolio Map | <https://fourweekmba.com/the-nvidia-portfolio-map-38-strategic-ai-investments/> | 按层级画的版图 |
| Keenable AI 投资流向台账 | <https://select.keenable.ai/r/ai-company-to-company-investment-flows/9TzAikorT4viMST6iPrllA> | AI 公司之间的资金流向 |
| Bloomberg AI Circular Deals | <https://www.bloomberg.com/graphics/2026-ai-circular-deals/> | 循环交易图解 |
| Hudson Labs 马斯克预测 | <https://www.hudson-labs.com/research/elon-musk-predictions-tsla> | 151 条预测的兑现情况 |
| Polymarket X 发帖计数 | <https://xtracker.polymarket.com> | 马斯克发帖统计 |

---

## 检索方法备忘（方便以后扩展）

- GitHub 搜索：`elon musk skill`、`jensen huang`、`nuwa skill`、`edgartools`、`follow-builders`、`RSSHub`、`13F SEC EDGAR`
- 低价值结果：“Elon Musk tweets dataset” 一类大多是 2021–2022 年的 Kaggle 作业，数据过时，不推荐使用。

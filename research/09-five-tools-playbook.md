# 五件套使用手册：怎么分类、怎么装、怎么用

> 首次实战案例：[迈威尔（MRVL）会是下一个万亿美金公司吗？](cases/2026-10-marvell-1t/README.md)

## 一、分类：一条投研流水线上的 5 个工位

```
 ① 发现          ② 判断             ③ 对抗              ④ 记录             ⑤ 盯盘
 往哪看？        值不值？            谁会反对？           怎么不骗自己？      有没有变？
 serenity-skill → ai-berkshire     → ai-hedge-fund     → Mira            → daily_stock_analysis
 供应链瓶颈法      四大师投研团队       多位大师独立打分     论点 + 证伪条件      每日自动分析推送
```

| 工位 | 工具 | 解决的问题 | 输入 | 输出 | 什么时候用 |
|---|---|---|---|---|---|
| ① 发现 | [serenity-skill](https://github.com/muxuuu/serenity-skill) | 一个热点 / 一句大话，**真正的瓶颈在哪一层**？这家公司是不是真的卡在瓶颈上？ | 主题或公司加一个说法（比如“X 是 CPO 核心供应商”） | 产业链分层、逐条核对主张、研究优先级（高 / 中 / 低）、下一步要查什么 | 听到黄仁勋或马斯克的一句话、看到一个热点时，**第一个用** |
| ② 判断 | [ai-berkshire](https://github.com/xbtlin/ai-berkshire) | 生意好不好、护城河、管理层、估值，**值不值这个价**？ | 公司名 | 四大师评分、看多和看空逻辑、三情景估值、分层操作区间 | 确认值得深挖之后；它的 `/quality-screen` 可以先做快速排除 |
| ③ 对抗 | [ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) | 换一批脑子来看：成长派、价值派、趋势派会不会得出不一样的结论？ | 基本面数据快照 | 每位大师一个信号（看多 / 中性 / 看空）、置信度和理由 | 结论太顺的时候，专门拿来唱反调 |
| ④ 记录 | [Mira](https://github.com/byteseek/Mira) | 结论写下来，**什么情况算我错了**？什么时候必须重看？ | 前三步的结论 | 论点卡、证据日志、过期时间（stale_after）、强制重看条件（must_refresh_if） | 每个结论都要落一张卡，进入主张台账 |
| ⑤ 盯盘 | [daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis) | 每天自动看一眼，**有变化就推送给我** | 自选股列表、LLM Key、推送渠道 | 每日“决策仪表盘”推送到企业微信、飞书、Telegram 或邮件 | 论点卡建好之后长期挂着跑 |

## 二、安装方式（在你自己的电脑上用 Claude Code）

| 工具 | 安装 | 调用 | 需要的 Key / 成本 |
|---|---|---|---|
| serenity-skill | `git clone https://github.com/muxuuu/serenity-skill.git && cd serenity-skill && mkdir -p ~/.claude/skills/serenity-skill && cp -R SKILL.md LICENSE references assets examples agents ~/.claude/skills/serenity-skill/` | `/serenity-skill 挑战“迈威尔是 AI 瓶颈供应商”的说法` | 只需要 Claude Code 能联网搜索，不需要额外的 Key |
| ai-berkshire | `git clone https://github.com/xbtlin/ai-berkshire.git && cd ai-berkshire && ./scripts/install-claude-commands.sh` | `/investment-team 迈威尔`（4 个 Agent 并行）、`/quality-screen`、`/thesis-tracker`、`/bottleneck-hunter` | 不需要额外的 Key，但**很费 token**。要先在 `.claude/settings.local.json` 里放行 WebSearch，否则后台 Agent 会静默断网，变成只凭训练知识作答 |
| ai-hedge-fund | `git clone https://github.com/virattt/ai-hedge-fund.git`，按 README 用 poetry 安装 | 命令行 / TUI 运行，支持回测和模拟盘 | **需要一个 LLM API Key**（Anthropic、OpenAI、DeepSeek 等）**加金融数据 API** |
| Mira | `git clone https://github.com/byteseek/Mira.git`，在仓库目录里启动 Claude Code | `Mira, 研究 MRVL`，或者用完整任务卡（见它的 START_HERE.md） | 不需要额外的 Key |
| daily_stock_analysis | Fork 仓库 → Settings → Secrets 里填 `STOCK_LIST`、LLM Key 和推送 Webhook → 启用 Actions | 每个工作日北京时间 18:00 自动运行（UTC 10:00） | **需要 LLM Key 加推送渠道**；跑在 GitHub Actions 上，基本免费 |

> ⚠️ 这个云端会话里**没有任何 LLM 或数据 API Key**，所以本次案例中 ai-hedge-fund 和 daily_stock_analysis 的代码**没有真正跑起来**：
> - ai-hedge-fund：我**原样使用了它源码里 5 位大师的 system prompt**（巴菲特、芒格、林奇、格雷厄姆、德鲁肯米勒），喂入同一份数据快照，按它规定的 JSON 格式输出；
> - daily_stock_analysis：只写好了配置方案，部署要等你提供 Key；
> - ai-berkshire 的 `/investment-team` 原设计是 4 个 Agent 并行。这次是我在一个上下文里**依次扮演** 4 个角色，独立性比真正的并行弱；它的计算工具 `financial_rigor.py` 是真实运行的。
> - serenity-skill 和 Mira 是纯方法论，我按它们的 SKILL.md、证据规则和模板执行。

## 三、标准用法（以后每个案例都照这个顺序走）

1. **立题**：把一句话变成**可检验的问题**（例如“下一个万亿公司”拆成规模、利润、估值、时间四个子问题）。
2. **① serenity**：先定产业链位置和瓶颈质量，把主张逐条核对。**这一步不通过就不往下走。**
3. **② ai-berkshire**：四大师判断，加上估值验算（必须用工具算，不准心算）。
4. **③ ai-hedge-fund**：拿同一份快照让不同的大师打分，重点看**谁反对、为什么**。
5. **④ Mira**：落一张论点卡，写清证伪条件和必须重看的时间；同时把原始说法记进 `claims-ledger.csv`（主张台账）。
6. **⑤ daily_stock_analysis**：把标的和它的产业链伙伴加进自选股，每天自动盯。
7. **复盘**：到了 stale_after 日期，或者触发了 must_refresh_if，就回到第 2 步更新。

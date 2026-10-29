# ⑤ 盯盘 · daily_stock_analysis：每日自动跟踪方案（待部署）

> 方法来源：[ZhuLinsen/daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis)（支持 A 股、港股、美股、台股；用 GitHub Actions 每个工作日 UTC 10:00 运行，即北京时间 18:00）
> 状态：**只写了方案，还没部署**。需要你提供 LLM API Key 和推送渠道。

## 自选股：不只盯迈威尔，还要盯它的“产业链邻居”

| 角色 | 代码 | 为什么要一起盯 |
|---|---|---|
| 标的 | `MRVL` | — |
| 生态 / 股东 | `NVDA` | 英伟达入股 $20 亿，NVLink Fusion，黄仁勋的说法 |
| 定制芯片头号对手 | `AVGO` | 份额此消彼长 |
| 定制芯片对手（台湾） | `3661.TW`（世芯 Alchip）、`2454.TW`（联发科） | AWS 和 Google 份额争夺 |
| 代工 | `2330.TW`（台积电） | 先进制程和 CoWoS 产能 |
| 光模块（DSP 的客户） | `COHR`、`LITE`、`300308`（中际旭创）、`300502`（新易盛） | 1.6T 放量和 LPO 路线 |
| 大客户 | `GOOGL`、`AMZN`、`MSFT` | 资本开支指引 |

```bash
# GitHub 仓库 Settings → Secrets and variables → Actions
STOCK_LIST=MRVL,NVDA,AVGO,3661.TW,2454.TW,2330.TW,COHR,LITE,300308,300502,GOOGL,AMZN,MSFT
ANTHROPIC_API_KEY=...        # 或 GEMINI_API_KEY / DEEPSEEK_API_KEY（三选一）
FEISHU_WEBHOOK_URL=...       # 或 WECHAT_WEBHOOK_URL / TELEGRAM_BOT_TOKEN+TELEGRAM_CHAT_ID / 邮箱
```

## 部署步骤（5 分钟）

1. Fork `ZhuLinsen/daily_stock_analysis` 到你自己的 GitHub 账号。
2. 在 Settings → Secrets 里填上面三类变量（自选股、LLM Key、推送渠道）。
3. 在 Actions 页面启用 workflow `00-daily-analysis.yml`，先手动跑一次（workflow_dispatch）验证。
4. 之后每个工作日 18:00（北京时间）自动推送。

## 它和 Mira 论点卡的分工

- daily_stock_analysis 负责发现**“今天有什么变化”**（价格、新闻、技术面）；
- Mira 论点卡里的 **must_refresh_if** 负责判断**“这个变化是不是重要到要重新研究”**；
- 后续可以加一个小脚本：把每日推送和 must_refresh_if 关键词（AWS、Trainium、毛利率、博通、NVLink Fusion）做匹配，命中就单独提醒。

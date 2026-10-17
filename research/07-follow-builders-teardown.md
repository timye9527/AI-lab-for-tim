# follow-builders 拆解：它盯的是谁，为什么它的结构值得我们抄

> 仓库：[zarazhangrui/follow-builders](https://github.com/zarazhangrui/follow-builders)（★6.8k，MIT）。2026-10-08 克隆源码阅读。
> 人物背景：优先用仓库 `feed-x.json` 里抓到的 X 简介（2026-10-07）；简介缺失的，用公开资料补充，并标注“待核实”。

---

## 一、它重点看的 26 个 X 账号 + 6 个播客

### A 组：三大前沿实验室的“内部人”（13 个，占一半）

| 人 | 身份 | 为什么值得听 |
|---|---|---|
| **Sam Altman** | OpenAI CEO | 模型层最大玩家的战略口径 |
| **Boris Cherny** | Anthropic，Claude Code 负责人/创造者 | AI 编程 Agent 的第一手产品信号 |
| **Thariq** | Anthropic Claude Code；曾在 YC W20、South Park Commons、MIT Media Lab | 同上 |
| **Cat Wu** | Anthropic，Claude Code 产品负责人 | 同上 |
| **Alex Albert** | Anthropic，Claude Relations（开发者关系） | 新功能和用法最早的出口 |
| **Amanda Askell** | Anthropic，哲学家，负责 Claude 的性格和行为设计 | 模型“怎么想”的设计者 |
| Claude（官方账号） | Anthropic | 产品公告 |
| **Thibault Sottiaux** | OpenAI，Codex 和 ChatGPT | OpenAI 编程 Agent 的负责人之一 |
| **Nan Yu** | OpenAI Codex 产品；曾任 Linear 产品负责人 | 同上 |
| **Peter Steinberger** | OpenClaw（开源个人 Agent）作者，现加入 OpenAI；早年创办 PSPDFKit | 个人 Agent 方向的风向标 |
| **Josh Woodward** | Google VP，负责 Google Labs、Gemini App 和 AI Studio | 谷歌消费级 AI 产品 |
| Madhu Guru | 谷歌 AI 产品方向（待核实） | — |
| Google Labs（官方账号） | 谷歌 | 实验产品 |

### B 组：AI 原生公司的创始人/CEO（应用层）

| 人 | 身份 |
|---|---|
| **Amjad Masad** | Replit CEO（AI 写应用） |
| **Guillermo Rauch** | Vercel CEO（v0，前端和 AI 部署） |
| **Aaron Levie** | Box CEO（企业内容加 AI，代表“传统 SaaS 如何转 AI”） |
| **Dan Shipper** | Every CEO，AI & I 播客主持人 |
| **Ryo Lu** | Cursor 设计负责人（曾在 Notion、Stripe） |

### C 组：投资人（看钱往哪流）

| 人 | 身份 |
|---|---|
| **Garry Tan** | Y Combinator 总裁兼 CEO |
| **Matt Turck** | FirstMark Capital 合伙人，每年发布 “MAD Landscape” 图谱，MAD 播客主持人 |
| **Nikunj Kothari** | FPV Ventures 合伙人（种子轮和 A 轮） |
| **Aditya Agarwal** | South Park Commons 普通合伙人；Facebook 早期工程师、Dropbox 前 CTO |

### D 组：研究者 / 布道者

| 人 | 身份 |
|---|---|
| **Andrej Karpathy** | OpenAI 创始成员、**前特斯拉 AI 总监（Autopilot）**、Eureka Labs 创始人，“vibe coding” 一词的提出者。**也是这份名单和马斯克唯一的交集** |
| **Swyx** | Latent Space 播客主持人、AI Engineer 大会组织者，和 Cognition 有关联 |
| Peter Yang | AI 实操教程和访谈博主 |
| Zara Zhang | 仓库作者本人，Builder，哈佛 2017 届 |

### 6 个播客

| 播客 | 背后是谁 | 特点 |
|---|---|---|
| Latent Space | swyx 和 Alessio Fanelli | AI 工程师视角，最技术 |
| Training Data | **红杉资本** | 顶级 VC 和创始人对谈 |
| No Priors | Sarah Guo（Conviction）和 Elad Gil | 两位知名 AI 投资人 |
| Unsupervised Learning | **Redpoint Ventures** | VC 视角 |
| The MAD Podcast | Matt Turck（FirstMark） | 数据和 AI 全景 |
| AI & I | Dan Shipper（Every） | 应用和使用者视角 |

### 这份名单的“偏向”（对投资的含义）

1. **一半是三大实验室的内部人，而且高度集中在 AI 编程 Agent**（Claude Code、Codex、Cursor、Replit、v0）。这是 2026 年 AI 商业化最热的地方。
2. **投资人和 VC 播客约占三分之一**，能看到一级市场的钱往哪流。
3. **完全没有**：半导体、能源、数据中心、硬件、机器人、资本市场，没有黄仁勋和马斯克，也没有中国的 Builder。
4. 换成我们的话说：它看的是**五层蛋糕的上两层（模型层和应用层）**，我们的“双核观察”看的是**下三层（能源、芯片、基础设施）加上马斯克的物理 AI**。**两者正好互补**。
5. 和投资的连接点：应用层的“用量信号”（例如编程 Agent 爆发）会变成 token 需求，再变成 GPU 需求。这正是黄仁勋说的 “compute is revenue”。follow-builders 可以当作**需求侧的先行指标**。

---

## 二、它的结构（从源码看）

```
① 信息源清单            ② 中心化抓取（零服务器）               ③ 本地 Skill 加工           ④ 推送
config/                 GitHub Actions 每天 06:17 UTC           SKILL.md（Claude Code /      Telegram /
default-sources.json →  scripts/generate-feed.js            →   OpenClaw）一次 HTTP 取 JSON → 邮件 / 聊天窗口
 · x_accounts（26）       · X 官方 API（Bearer Token）            prompts/*.md 决定怎么总结     每日或每周
 · podcasts（6，RSS）     · 播客转文字（pod2txt / Supadata）       ~/.follow-builders/          中文 / 英文 / 双语
 · blogs（2，网页抓取）   · 博客抓取                               config.json 保存个人偏好
                         → 提交 feed-x.json / feed-podcasts.json
                           / feed-blogs.json / state-feed.json（去重）
```

**几个聪明的设计**：

- **把抓取和加工拆开**：抓取在 GitHub Actions 上集中跑一次，生成公开的 JSON；每个用户的 Agent 只负责“读 JSON 加按自己口味总结”。用户不需要任何 API Key，**整个系统没有服务器**。
- **提示词是纯文本文件**（`prompts/`），不是写死在代码里。想调摘要风格，改文件或者跟 Agent 说一句就行。
- **提示词的过滤原则写得好**（可以直接借鉴）：
  - 先介绍作者的全名和身份（“Replit CEO Amjad Masad”），不能只写账号；
  - 只留原创观点、产品发布、技术讨论和行业分析，**跳过**日常、无评论转发、广告和客套；
  - **大胆预测或反共识观点放在最前面**；
  - 没有实质内容就写 “No notable posts”，**不准凑字数**；
  - 播客压缩成 200–400 字：一句话 Takeaway、讲者背景、反直觉洞见、至少一句原话引用。

## 三、为什么说它的结构是我们想要的（以及要改什么）

先修正一下上次的说法：更准确的是**“架构可以直接复用，但信息源和提示词要全部换掉，并且要加两种新的信息源类型和一个历史库”**。

| 我们的需求 | follow-builders 已有 | 需要改或补 |
|---|---|---|
| “只关注最牛的人”的过滤哲学 | ✅ “Follow builders, not influencers” | 名单换成黄仁勋、马斯克和两家公司 |
| 每天自动抓、零运维 | ✅ GitHub Actions 定时任务 | 照搬 |
| 播客和长访谈转文字 | ✅ RSS 加转写服务 | 加上 YouTube 上的 Keynote（GTC、财报会、发布会） |
| X 帖子 | ✅ X API | **马斯克每天几十到上百条，政治和闲聊很多**，要加主题过滤（AI、算力、特斯拉、SpaceX）和互动量门槛 |
| **黄仁勋** | ❌ 他没有活跃的个人 X 账号 | 新增信息源类型：NVIDIA Newsroom 和博客、YouTube Keynote 字幕、财报电话会文字稿 |
| **资本动作** | ❌ | 新增信息源类型：**SEC EDGAR**（8-K 重大交易、13F 持仓、10-Q 投资总额、Form 4 内部人交易），用 edgartools 实现 |
| 中文输出、推送 | ✅ 中英双语，Telegram/邮件 | 可以加微信或飞书 |
| 投资视角的总结 | ❌ 它的提示词是“给忙碌的从业者看” | 重写提示词：属于五层蛋糕哪一层？对谁的收入有影响？是新事实还是重复？要不要记进主张台账？ |
| **历史归档 / 主张台账** | ❌ 只保留最新一份 feed 加去重状态 | 要能长期存档和检索，才能回头核对“他说过的话兑现没有” |
| 成本 | X API 要付费，转写服务要 Key | 先估算：只盯少数账号的话，费用很低 |

**一句话**：它解决了“抓取 → 筛选 → 总结 → 推送”这条流水线最麻烦的工程部分；我们要做的是**换掉信息源、重写提示词、加上 SEC 和财报这两类信息源，再加一个历史库**。

> 状态：按你的意思，先观察，不动手。真要做的时候，可以 fork 一份改，或者只借鉴架构自己写。

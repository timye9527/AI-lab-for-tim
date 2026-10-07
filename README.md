# make-money-test · 轻量付费测试引擎

一套能反复复用的「趣味测试 + 兑换码解锁」小产品：做一次引擎，之后**只换一份内容配置就是一个新商品**。

第一套内容是 **韭菜段位测试**：12 道盘面情境题，测出 6 档韭菜段位（玩梗），再按 MBTI 式的四个维度，匹配 16 位大家都熟悉的历史人物（曹操、诸葛亮、司马懿、李白、刘禅……）作为「人格底色」。

- 段位卡免费，负责被晒、被转发
- 完整人格报告用兑换码解锁，负责赚钱：四维图谱、人物自画像、财商六维、共同底色、真实故事、盲点与反割建议、搭子与天敌
- 兑换码在小红书等平台作为虚拟商品售卖

运营打法（怎么发笔记、怎么定价、看什么数据）见 [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md)。

## 目录

```
public/                     ← 网站根目录（静态文件，无构建步骤）
  engine/                   ← 引擎，所有测试共用
    app.js                  ← 页面流程：开场 → 答题 → 结果 → 解锁
    score.js                ← 纯计分逻辑（网页和校验脚本共用）
    poster.js               ← canvas 生成 3:4 段位海报
    icons.js                ← 段位图标
    style.css
  tests/jiucai/config.js    ← 韭菜段位测试的全部内容（题目、段位、人物、文案、付费墙）
  jiucai/index.html         ← 测试入口页，访问路径 /jiucai/
  index.html                ← 测试合集首页
functions/api/redeem.js     ← 兑换接口（Cloudflare Pages Functions + D1）
db/schema.sql               ← 兑换码表
scripts/
  check.mjs                 ← 校验配置 + 模拟作答看分布
  gen-codes.mjs             ← 批量生成兑换码
  serve.mjs                 ← 本地预览
```

## 本地预览

只需要 Node 18 及以上，不用安装任何依赖。

```bash
npm run preview          # 打开 http://localhost:8788/jiucai/
npm run check            # 改完内容必跑：检查缺字段、看人格 / 段位分布
```

本地预览时兑换码填 `DEMO` 即可解锁（只在 localhost 生效）。

## 计分规则

- 每个选项给 4 个维度加减分（`s`），再给两个仪表加分（`m`：上头指数、纪律值）。
- **人格**：4 个维度各取一极，拼成代码，比如「冲独快断」，对应 16 位人物之一。
- **主导维度 / 共同底色**：按各维度的偏向强度排序，最强的是主导维度，前三个分别作为「第一底色 / 隐藏天赋 / 长期优势」。
- **财商六维**：由维度偏向和两个仪表换算，公式在 `config.abilities`。
- **段位**：由 `纪律值 - 上头指数` 决定，阈值写在 `tiers[].min`。
- **匹配度**：取四个维度的偏向强度，映射到 76%～97%。
- **搭子 / 天敌**：搭子是把「风险」和「节奏」两个维度翻转后的人格，天敌是四个维度全部翻转。

每道题在每个维度上的加减分是正负抵消的，所以人格和段位基本互不影响。改题目后跑 `npm run check`：每个人格的随机出现率最好在 2% 以上。

## 部署

> ⚠️ **面向中国大陆用户时，不要用 `*.pages.dev`**：它在大陆多地无法访问。部署方案的选择，以及小红书开店、类目、合规的调研，见 [`docs/LAUNCH-CN.md`](docs/LAUNCH-CN.md)。
> 下面的 Cloudflare 步骤适合本地验证，或面向海外用户。

### Cloudflare Pages（免费额度够用）

1. **建项目**：Cloudflare 控制台 → Workers & Pages → Create → Pages → 连接这个 GitHub 仓库。
   构建命令留空，输出目录填 `public`。`functions/` 目录会被自动识别成接口。
2. **建兑换码数据库**：
   ```bash
   npx wrangler login
   npx wrangler d1 create make-money-test                      # 记下 database_id
   npx wrangler d1 execute make-money-test --remote --file=db/schema.sql
   ```
   把 `wrangler.toml` 里 D1 那一段取消注释，填上 `database_id`，提交后会自动重新部署。
3. **生成并导入兑换码**：
   ```bash
   npm run codes -- jiucai 500 JC 3     # 500 个码，前缀 JC，每个码最多 3 台设备
   npx wrangler d1 execute make-money-test --remote --file=codes/<批次>.sql
   ```
   `codes/*.csv` 用来上传到店铺做自动发货。**`codes/` 已被 git 忽略，不要提交。**
4. 打开 `https://<项目名>.pages.dev/jiucai/`，用一个刚导入的码测一遍解锁。

需要在本地带接口调试时：先运行 `npx wrangler d1 execute make-money-test --local --file=db/schema.sql`，再运行 `npm run dev`。

## 出一套新测试（资产化的关键）

1. 复制 `public/tests/jiucai/` 为 `public/tests/<新id>/`，改 `config.js` 的内容。
2. 复制 `public/jiucai/index.html` 为 `public/<新id>/index.html`，把 `data-test` 改成新 id，再改标题。
3. 在 `public/index.html` 加一张卡片。
4. 运行 `npm run check`，再用 `npm run preview` 在手机宽度下走一遍。
5. 生成新前缀的兑换码，上架新商品。

题量、选项数、维度数、段位数都可以改，引擎按配置自适应。人格数量 = 2 的维度数次方，每一种都要写全。

## 已知取舍

- 报告内容在前端，懂开发者工具的人可以绕过付费墙。0.99 元的产品不值得为此加服务端渲染。真要防的话，可以把 `types` 挪进 `functions/` 由接口返回。
- 解锁状态存在本机浏览器里。换设备时重新输一次码，所以每个码默认可用 3 次。

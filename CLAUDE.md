# 项目规则（给 AI 编程助手）

先读 `README.md`、`docs/GAME-DESIGN.md` 和 `docs/LAUNCH-CN.md`。

1. **内容和引擎分开。** 只改内容时只动 `public/tests/<id>/config.js`，不碰 `public/engine/`。
2. **改完内容必跑 `npm run check`。** 每个人格的随机出现率不低于 2%；全选最稳的选项要拿到最高段位，全选最上头的要落到最低段位。
3. **移动端优先。** 在 390px 宽度下检查，不能出现横向滚动。
4. **合规。** 不出现具体股票、基金或板块推荐，不承诺收益，不自称「风险测评」。底部免责声明不能删。
5. **史实要真。** 人物的 `fact` 必须是有出处的史实，并标注出处；`quote` 是编写的「人物心声」，不能冒充原话。
6. **兑换码和数据不提交。** `codes/`、`data/`、`backup/`、`out/` 都已被忽略。
7. **网站和服务端保持零依赖。** 网站是原生 HTML / CSS / ES Module，服务端只用 Node 内置模块。`playwright-core` 只用于 `npm run notes` 生成素材。
9. **大陆合规优先。** 笔记、商品页、段位卡上不放链接、二维码、微信；网址只能出现在付款后的自动发货内容里。改了文案要跑 `npm run notes`，看高危词提醒。
10. **数据结构变更**要同时改 `db/schema.sql`、`server/db.mjs` 和 `server/admin.mjs`。
8. 文案用中文，代码注释简短、用中文。

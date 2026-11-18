# 内容中台

按「每一期」记账的内容看板：每期内容做到哪一步、发没发布、卡在哪、下一步是什么。做任何视频之前先查这里，免得重做别人（或 Tim 自己）已经发布的一期。

## 和成果中台的区别

| | 成果中台 `hub/` | 内容中台 `content-hub/` |
|---|---|---|
| 单位 | 项目 | 每一期 |
| 记到哪 | 交付成果（成片为止） | 成片之后的发布状态 |
| 回答 | 有哪些成果、存进 GitHub 没有 | 这期发没发布、谁在做、卡在哪 |

## 文件

- `data.json`：手工维护的唯一数据源
- `build.py`：只用标准库，读 data.json 写 `index.html`（Artifact 片段，无外部资源）
- `index.html`：生成物，不要手改

## 五类用途

页面按「用途」分五类，每类一句话说明这个方向怎么评判（不是每期都要发布）：

1. `publish` 财经内容 · 要上线：看懂AI主线、存力研究所、内容工厂、投研中枢；要发、要看数据。
2. `career` 职业 · 粤语与 Finance 930：看频道和栏目，不只是单期。
3. `express` 个人表达 · 短片、音乐、演讲：发不发看心情和场合。
4. `account` 账号运营 · 小红书：主要在 Codex 推进，这里只记录。
5. `practice` 能力验证 · 跑流程：练制作、验证流程，默认标「仅验证」。

## 四种标记

每期可以在页面顶部「勾一下」表格里一键标：已发布 / 暂不发布 / 仅验证 / 待定；没标过的显示「未标」。

- 存放：页面的 artifact db，集合 `marks`，文档 id = 期的 `id`，内容 `{state, url, at}`。只有页面主人能写，其他人只读。
- 生效状态 = 页面上的勾选 ?? 该期的 `default_mark` ?? 未标。离线或打不开 db 时只显示默认状态。
- Claude 每周把页面上的勾选同步回 `data.json`（期的 `mark` 字段，发布链接写进 `publish_url`）。

## 数据结构

```
{ asof, groups:[ {id, name, why, lines:[ {id, name, format, platform, cadence,
    status(运行中/暂停/封存), source, note,
    episodes:[ {id, no, title, stage, published, default_mark?, mark?, publish_url, date, blocker, next, links:[{label,url}]} ]} ]} ],
  shared:[ {name, what, path} ], rules:[...] }
```

- `id`：`<线id>-<序号>`，ascii 小写，唯一且不改（它是 db 文档 id）
- `stage`：选题 / 稿件 / 配音 / 画面 / 成片 / 已发布
- `published`：是 / 否 / 未核实。仓库里没有明确记录就写「未核实」，不要猜
- `default_mark`：页面还没勾选时的默认标记（已发布的期为「已发布」，能力验证组为「仅验证」）
- `mark`：每周从页面同步回来的勾选结果
- 「勾一下」表格列出所有 stage 为成片或已发布的期，默认只看未标

## 怎么更新

1. 改 `content-hub/data.json`（新增期要给唯一 `id`）
2. 跑 `python3 content-hub/build.py`
3. 把 `index.html` 的内容发布到同一个页面（声明 db 的 `marks` 集合和 user 能力）

## 开工规则

1. 做任何一期之前先查这里。
2. 发布后当天把 published 改成「是」并贴链接。
3. 状态不明先问 Tim，不重做。
4. 别的会话或 Codex 做的内容同样登记。

小红书、粤语周报 W43 起等主要在 Codex / 本机推进的内容，这里只记录。

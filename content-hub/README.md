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

## 数据结构

```
{ asof, groups:[ {id, name, why, lines:[ {id, name, format, platform, cadence,
    status(运行中/暂停/封存), source, note,
    episodes:[ {no, title, stage, published, publish_url, date, blocker, next, links:[{label,url}]} ]} ]} ],
  shared:[ {name, what, path} ], rules:[...] }
```

- `stage`：选题 / 稿件 / 配音 / 画面 / 成片 / 已发布
- `published`：是 / 否 / 未核实。仓库里没有明确记录就写「未核实」，不要猜
- 页面顶部「等你确认」自动列出：未核实且已有成片的期，以及卡点里提到过稿、验收、确认、选版本的期

## 怎么更新

1. 改 `content-hub/data.json`（发布后把 `published` 改成「是」，贴 `publish_url`，`stage` 改成「已发布」）
2. 跑 `python3 content-hub/build.py`
3. 把 `index.html` 的内容发布到同一个页面（需要时）

## 开工规则

1. 做任何一期之前先查这里。
2. 发布后当天把 published 改成「是」并贴链接。
3. 状态不明先问 Tim，不重做。
4. 别的会话或 Codex 做的内容同样登记。

小红书、粤语周报 W43 起等主要在 Codex / 本机推进的内容，这里只记录。

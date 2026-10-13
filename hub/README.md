# 成果中台

所有项目的交付成果登记在一个私有页面里，按类型分册。

- **页面（私有，只有自己能打开）**：https://claude.ai/artifact/HREAi1nCbVZNNFjuwFZiEc
- **页面源码**：`hub/index.html`
- **数据**：存在页面自带的数据集 `items` 里（只有本人可写），`hub/items.json` 是备份

## 收录规则

| 收 | 不收 |
|---|---|
| 能打开的页面、看板、网站 | 只做了搜索、资料整理，没有落成文件的对话 |
| 成型的研究报告、案例库 | 中间过程、草稿片段、调试记录 |
| 能用的产品、工具、游戏 | 空仓库、没开工的会话 |
| 可直接发布的内容素材、出图模板 | 已经并入其他成果的旧版本 |
| 视频、短片、PPT 讲稿 | |

## 五种类型（`cat` 字段）

| cat | 名称 | 放什么 |
|---|---|---|
| `invest` | 投研系统 | 持续更新的看板和投研工具 |
| `report` | 研究报告 | 一次成型的报告和案例 |
| `product` | 产品与工具 | 能用、能卖、能玩的东西 |
| `content` | 内容运营 | 账号、周报、笔记素材 |
| `media` | 影像与演示 | 短片、视频流程、PPT |

新增类型：改 `hub/index.html` 顶部的 `CATS`，然后重新发布到同一个网址。

## 登记一条新成果（给 AI 助手）

项目交付后（有页面、报告、产品、素材、视频或 PPT 落地），往数据集写一条：

```
ArtifactData set
  url:        https://claude.ai/artifact/HREAi1nCbVZNNFjuwFZiEc
  collection: items
  doc_id:     英文短名，如 jiucai-test
  data: {
    "title":   "标题",
    "cat":     "invest | report | product | content | media",
    "status":  "运行中 | 已上线 | 已交付 | 待完善",
    "date":    "YYYY-MM-DD（交付或最近更新日期）",
    "summary": "一两句话，说清是什么、核心产出",
    "tags":    ["最多三个"],
    "source":  "仓库名 或 仓库 · 分支",
    "links":   [{"label": "打开页面", "url": "https://..."}]
  }
```

- 同一个项目更新了，就更新原条目（先读出 `version` 再写），不要新开一条
- 写完后把同样内容补进 `hub/items.json`，一起提交
- 只做了检索、没有交付物的会话不登记

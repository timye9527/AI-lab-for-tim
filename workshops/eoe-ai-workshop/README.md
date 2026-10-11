# EOE AI 实战工作坊 PPT：《动动嘴，让 AI 把活干了！》

30 分钟工作坊，面向普通职场人。PPT 正文 29 页，另有 1 页附录（备份成果）。

## 文件

| 文件 | 说明 |
|---|---|
| `output/动动嘴让AI把活干了.pptx` | 可编辑 PPT（每页备注栏里有讲稿提示） |
| `output/动动嘴让AI把活干了.pdf` | 预览 / 兜底用 PDF |
| `output/缩略图总览.jpg`、`output/pages/` | 全部页面缩略图、逐页图片 |
| `演讲备注.md` | 30 分钟逐页演讲备注 + 时间轴 |
| `素材清单.md` | 每张素材用在哪页、怎么处理的 |
| `现场Agent演示任务.md` | 现场派活任务（占位，可替换）、提示词、彩排表 |
| `待补充素材.md` | 还缺的素材和需要确认的问题 |

> 仓库是公开的。`materials/`（原始照片截图）、`assets/`（处理后的图片）、`output/`（成品）含成员肖像和姓名，已加入 `.gitignore`，**不提交**。仓库里只有生成脚本和文档。

## 重新生成

脚本在 `build/`，有自己的 `package.json`，不影响网站和服务端的零依赖。

```bash
cd workshops/eoe-ai-workshop/build
npm install
npm run assets   # 裁切真实素材 + 绘制辣条插画（需要 Python Pillow）
npm run deck     # 生成 PPTX + 导出演讲备注.md
python3 -I render.py ../output/动动嘴让AI把活干了.pptx <soffice 包装脚本>   # 导出 PDF 和缩略图
```

- 内容（每页文字和布局）：`build/build_deck.js`
- 演讲备注：`build/notes.js`（PPT 备注栏和 `演讲备注.md` 都从这里来）
- 素材裁切坐标：`build/prepare_assets.py`

## 设计约定

- 16:9 宽屏，字体为微软雅黑；深色页（开场、转场、结尾）和浅色内容页交替
- 主色「辣条红」，辅色黄、蓝、绿、紫；反复出现的元素是对话气泡和辣条
- 截图都做了局部放大或高亮，表格只保留观众需要看的列

# 《蕲水长流》· 蕲春宣传片实验

参考 @EianLu 用 Claude 写代码渲染的成都片《一座城的年轮》，给蕲春做的一支 156 秒的数据宣传片：
真实地形 + 十万栋建筑白模 + 水系，从西周走到今天，每句字幕都标出处。

- 脚本、分镜、事实核对表：[`SCRIPT.md`](SCRIPT.md)
- 改内容（字幕、镜头、标签、时间轴）只动 [`scene/story.js`](scene/story.js)
- 引擎：[`scene/film.js`](scene/film.js)（three.js），样式 [`scene/style.css`](scene/style.css)

## 怎么做出来的

```
Overture Maps（公开 S3）──┐
  县界 / 水系 / 道路 / 铁路 / 建筑  │  scripts/fetch_overture.py
AWS Terrain Tiles ─────────┤  scripts/fetch_terrain.py
                           ▼
          scripts/build_assets.py   投影到米制坐标，烘焙底图（山体阴影 + 水 + 路 + 县界），
                           │        蕲州、县城两块高清贴片，建筑轮廓拉伸成网格
                           ▼
          scene/  （three.js 网页）  按时间 t 摆镜头、画高亮线、出字幕和标签
                           │
          scripts/render.mjs        无头 Chromium 逐帧截图 → ffmpeg 编码
          scripts/music.py          程序合成五声音阶配乐
```

## 跑起来

需要 Node 22、Python 3.11+、ffmpeg，能访问 `overturemaps-us-west-2.s3.amazonaws.com` 和 `s3.amazonaws.com`。

```bash
cd film/qichun
npm install
pip install -r requirements.txt
npm run data        # 下载原始数据到 data/raw（约 340MB，2 分钟）
npm run assets      # 加工成渲染素材到 data/assets（约 2 分钟）
npm run serve       # 浏览器打开 http://127.0.0.1:8790/?t=90 看某一秒；?play 实时播放
npm run stills      # 抽 13 张关键帧到 out/stills/
npm run render      # 全片 1080p30，3 路并行，约 1 小时（软件渲染），输出 out/qichun.mp4
```

`data/` 和 `out/` 不进仓库。

## 数据和署名

片尾已经带上，发布时请保留：

- 建筑轮廓：Shi Q. et al. (2023), *A first high-quality vector data of buildings in East Asian countries*, [doi:10.5281/zenodo.8174931](https://doi.org/10.5281/zenodo.8174931)，CC BY 4.0，经 Overture Maps 2026-09-23 版
- 县界、水系、道路、铁路：Overture Maps，© OpenStreetMap contributors（ODbL）
- 地形：AWS Terrain Tiles（Mapzen，SRTM 等）
- 字体：Noto Serif SC / Noto Sans SC（SIL OFL）

建筑数据没有高度，片中统一按 6 米示意；地形竖向夸张 1.6 倍。

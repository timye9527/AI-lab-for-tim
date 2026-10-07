# E01-v3 审核包

- 发布文案：post.md（标题、正文、Tag）
- 质检与来源：QC.md
- 上传图：upload/01–06（1086×1448，3:4）
- 手机缩略预览：preview_phone.jpg
- 原生字幕拼图原尺寸：native/

## 重建（从 xiaohongshu/ 目录执行，需先放回交接包的 assets/ 与 skill/）

```sh
python3 skill/scripts/native_subtitle_stitch.py render assets/source.mp4 \
  --manifest assets/manifest-E01-v3.json --out-dir review/E01-v3/native \
  --band-top 0.74 --band-bottom 0.81
mkdir -p review/E01-v3/build
python3 tools/cover_fix.py assets/cover.png /tmp/cover_step1.png
python3 tools/cover_caption.py /tmp/cover_step1.png review/E01-v3/build/P1.png "画面来源：中新视频｜AI辅助设计封面"
python3 tools/card.py native "review/E01-v3/native/01_P2-原片起点-读完就忘与读书目的.jpg" --style-ref assets/practice.png \
  --out review/E01-v3/build/P2.png --label "原片字幕 ① 起点" --sub "视频 0:00–0:07｜提问与读书目的"
python3 tools/card.py native "review/E01-v3/native/02_P3-原片结论-不需要记住精彩段落.jpg" --style-ref assets/practice.png \
  --out review/E01-v3/build/P3.png --label "原片字幕 ② 结论" --sub "视频 0:17–0:27｜中段吃饭类比见下页"
python3 tools/card.py text review/E01-v3/specs/P4-本号解读.json --style-ref assets/practice.png --out review/E01-v3/build/P4.png
python3 tools/card.py text review/E01-v3/specs/P5-场景示范.json --style-ref assets/practice.png --out review/E01-v3/build/P5.png
cp assets/practice.png review/E01-v3/build/P6.png
python3 tools/package.py review/E01-v3/build review/E01-v3 review/E01-v3/specs/order.json "读完就忘，是白读了吗？罗翔这样回答"
python3 tools/glyph_check.py review/E01-v3/specs/P4-本号解读.json review/E01-v3/specs/P5-场景示范.json
```

`tools/card.py` 是后续各期文字页的复用排版：写一个 JSON（headline / chip / blocks: note、item、lines、banner / footnote）即可出图。

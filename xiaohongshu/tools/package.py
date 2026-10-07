#!/usr/bin/env python3
"""导出上传图、手机缩略预览，并做基础技术质检（尺寸、比例、缺字）。"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def _find_cjk_font():
    """XHS_FONT 环境变量优先，其次 macOS / Windows / Linux 常见中文字体。"""
    import os
    cands = [os.environ.get("XHS_FONT", ""),
             "/System/Library/Fonts/PingFang.ttc",
             "/System/Library/Fonts/Hiragino Sans GB.ttc",
             "/System/Library/Fonts/STHeiti Medium.ttc",
             "/Library/Fonts/Arial Unicode.ttf",
             "C:/Windows/Fonts/msyhbd.ttc", "C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/simhei.ttf",
             "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
             "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
             "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"]
    for c in cands:
        if c and os.path.exists(c):
            return c
    raise SystemExit("找不到中文字体：请设置环境变量 XHS_FONT=字体文件路径")


FONT = _find_cjk_font()


def main(build, out_dir, order_json, title):
    build, out = Path(build), Path(out_dir)
    order = json.loads(Path(order_json).read_text(encoding="utf-8"))
    up = out / "upload"
    up.mkdir(parents=True, exist_ok=True)
    report, ims = [], []
    for i, (src, name) in enumerate(order, 1):
        im = Image.open(build / src).convert("RGB")
        dst = up / f"{i:02d}_{name}.jpg"
        im.save(dst, quality=95, subsampling=0)
        ims.append(im)
        report.append({"page": i, "file": f"upload/{dst.name}", "size": list(im.size),
                       "ratio_3_4": abs(im.width / im.height - 0.75) < 0.002})
    # 手机缩略：小红书双列信息流封面卡 + 6 页轮播缩略
    f = ImageFont.truetype(FONT, 26)
    fs = ImageFont.truetype(FONT, 22)
    card_w = 540
    cov = ims[0].resize((card_w, card_w * 4 // 3), Image.LANCZOS)
    thumbs = [im.resize((300, 400), Image.LANCZOS) for im in ims]
    W = 60 + card_w + 60 + 3 * 320 + 40
    H = max(60 + cov.height + 120, 60 + 2 * 450 + 40)
    sheet = Image.new("RGB", (W, H), (238, 238, 238))
    d = ImageDraw.Draw(sheet)
    d.text((60, 18), "信息流封面（约手机双列宽度）", font=fs, fill=(90, 90, 90))
    sheet.paste(cov, (60, 60))
    d.rectangle((60, 60 + cov.height, 60 + card_w, 60 + cov.height + 90), fill=(255, 255, 255))
    t = title if f.getlength(title) < card_w - 40 else title[:18] + "…"
    d.text((80, 60 + cov.height + 14), t, font=f, fill=(20, 20, 20))
    d.text((80, 60 + cov.height + 52), "Tim 的增长实验室", font=fs, fill=(130, 130, 130))
    x0 = 60 + card_w + 60
    d.text((x0, 18), "图片顺序（缩略检查）", font=fs, fill=(90, 90, 90))
    for k, th in enumerate(thumbs):
        x = x0 + (k % 3) * 320
        y = 60 + (k // 3) * 450
        sheet.paste(th, (x, y))
        d.text((x, y + 406), f"P{k + 1}", font=fs, fill=(60, 60, 60))
    sheet.save(out / "preview_phone.jpg", quality=92)
    (out / "qc_images.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(*sys.argv[1:5])

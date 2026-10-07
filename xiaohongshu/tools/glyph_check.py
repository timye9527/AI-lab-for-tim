#!/usr/bin/env python3
"""检查文字页用到的每个字符在字体中有字形（与缺字方框比对）。"""
import json
import sys
from PIL import ImageFont

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


f = ImageFont.truetype(_find_cjk_font(), 40)
tofu = bytes(f.getmask("\U000f0000"))  # 私用区字符必为缺字方框


def strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, list):
        for x in o:
            yield from strings(x)
    elif isinstance(o, dict):
        for v in o.values():
            yield from strings(v)


bad = {}
for p in sys.argv[1:]:
    try:
        texts = list(strings(json.load(open(p, encoding="utf-8"))))
    except json.JSONDecodeError:
        texts = [open(p, encoding="utf-8").read()]
    for ch in set("".join(texts)):
        if ch.isspace():
            continue
        if bytes(f.getmask(ch)) == tofu:
            bad.setdefault(p.split("/")[-1], []).append(ch)
print(json.dumps({"missing_glyphs": bad}, ensure_ascii=False))
sys.exit(1 if bad else 0)

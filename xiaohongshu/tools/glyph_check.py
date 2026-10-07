#!/usr/bin/env python3
"""检查文字页用到的每个字符在字体中有字形（与缺字方框比对）。"""
import json
import sys
from PIL import ImageFont

f = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", 40)
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

#!/usr/bin/env python3
"""把封面右下角来源小字改为明确的设计图说明；只动小字区域。"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

src, out, text = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert("RGB")
box = (735, 1380, 1060, 1418)          # 原小字区域
reg = im.crop(box)
patch = im.crop((box[0], box[1] + 30, box[2], box[3] + 30))  # 正下方的干净暗纹
m = Image.new("L", reg.size, 0)
rp, mp = reg.load(), m.load()
for y in range(reg.height):
    for x in range(reg.width):
        if max(rp[x, y]) > 90:
            mp[x, y] = 255
m = m.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2))
reg.paste(patch, (0, 0), m)
im.paste(reg, box[:2])
f = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", 23)
d = ImageDraw.Draw(im)
d.text((1045 - f.getlength(text), 1387), text, font=f, fill=(206, 204, 200))
im.save(out)

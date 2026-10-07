#!/usr/bin/env python3
"""可复用的文字页排版：黑底拼贴 + 荧光黄绿 + 少量蓝色，3:4 画布。

用法：
  python3 tools/card.py text   SPEC.json  --style-ref assets/practice.png --out OUT.png
  python3 tools/card.py native NATIVE.jpg --style-ref assets/practice.png --out OUT.png \
      --label "原片字幕 ①" --sub "0:00–0:07｜画面与字幕未改动"

页眉“表达基本功 01”和页脚“Tim 的增长实验室”直接取自已认可练习卡的像素；
其余底纹、纸片和笔触由程序绘制，固定随机种子，重复运行结果一致。
"""
import argparse
import json
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1086, 1448
FONT = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
INK = (14, 14, 14)
PAPER = (244, 239, 227)
CREAM = (246, 240, 228)
LIME = (222, 251, 48)
BLUE = (28, 74, 255)
DARK = (20, 19, 19)
GREY = (150, 146, 140)

# 已认可练习卡上的可复用像素（练习卡 1086×1448 坐标）
HEADER_BOX = (30, 28, 570, 110)
FOOTER_BOX = (30, 1368, 345, 1430)


def font(size):
    return ImageFont.truetype(FONT, size)


def feather_mask(size, r=10):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rectangle((r, r, size[0] - r, size[1] - r), fill=255)
    return m.filter(ImageFilter.GaussianBlur(r / 2))


def background(seed=7):
    rng = np.random.default_rng(seed)
    base = np.zeros((H, W, 3), np.float32) + np.array(DARK, np.float32)
    low = rng.normal(0, 1, (H // 48 + 1, W // 48 + 1)).astype(np.float32)
    low = np.array(Image.fromarray(low).resize((W, H), Image.BICUBIC))
    base += low[..., None] * 5
    base += rng.normal(0, 7, (H, W, 1)).astype(np.float32)
    speck = rng.random((H, W)) > 0.9985
    base[speck] += 70
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    r = random.Random(seed)
    for _ in range(26):  # 细划痕
        x, y = r.randrange(W), r.randrange(H)
        d.line((x, y, x + r.randint(-60, 60), y + r.randint(-8, 8)), fill=(58, 56, 55), width=1)
    return img


def torn_poly(box, rng, amp=7, step=14):
    x0, y0, x1, y1 = box
    pts = []
    for x in range(x0, x1, step):
        pts.append((x, y0 + rng.uniform(-amp, amp)))
    for y in range(y0, y1, step):
        pts.append((x1 + rng.uniform(-amp * 0.4, amp * 0.4), y))
    for x in range(x1, x0, -step):
        pts.append((x, y1 + rng.uniform(-amp, amp)))
    for y in range(y1, y0, -step):
        pts.append((x0 + rng.uniform(-amp * 0.4, amp * 0.4), y))
    return pts


def paper(img, box, seed, color=PAPER, amp=7):
    """在画面上贴一张带撕边、纸纹和阴影的纸片。"""
    rng = random.Random(seed)
    poly = torn_poly(box, rng, amp)
    shadow = Image.new("L", img.size, 0)
    ImageDraw.Draw(shadow).polygon([(x + 6, y + 8) for x, y in poly], fill=150)
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    img.paste(Image.new("RGB", img.size, (0, 0, 0)), (0, 0), shadow)
    nrng = np.random.default_rng(seed)
    tex = np.zeros((H, W, 3), np.float32) + np.array(color, np.float32)
    tex += nrng.normal(0, 5, (H, W, 1)).astype(np.float32)
    lowp = nrng.normal(0, 1, (H // 60 + 1, W // 60 + 1)).astype(np.float32)
    tex += np.array(Image.fromarray(lowp).resize((W, H), Image.BICUBIC))[..., None] * 4
    tex = Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8))
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    # 撕边的白色纤维
    edge = Image.new("L", img.size, 0)
    ImageDraw.Draw(edge).line(poly + [poly[0]], fill=200, width=3)
    img.paste(tex, (0, 0), m)
    img.paste(Image.new("RGB", img.size, (252, 250, 244)), (0, 0), edge.filter(ImageFilter.GaussianBlur(0.8)))


def marker(draw, x0, y0, x1, y1, color=LIME, seed=1):
    """手绘感荧光笔高亮。"""
    rng = random.Random(seed)
    pts = [(x0 + rng.uniform(-4, 4), y0 + rng.uniform(-3, 3)),
           (x1 + rng.uniform(-4, 6), y0 + rng.uniform(-4, 2)),
           (x1 + rng.uniform(-2, 8), y1 + rng.uniform(-2, 4)),
           (x0 + rng.uniform(-6, 2), y1 + rng.uniform(-3, 3))]
    draw.polygon(pts, fill=color)


def zigzag(draw, x0, x1, y, color=BLUE, width=9, seed=2):
    rng = random.Random(seed)
    pts, x = [], x0
    while x < x1:
        pts.append((x, y + rng.uniform(-6, 6)))
        x += rng.randint(50, 110)
    pts.append((x1, y + rng.uniform(-4, 4)))
    draw.line(pts, fill=color, width=width, joint="curve")
    draw.line([(p[0] + 20, p[1] + 13) for p in pts[:-1]], fill=color, width=max(3, width // 2), joint="curve")


def ticks(draw, x, y, color=LIME, seed=3, n=3, length=36, width=7):
    """练习卡同款放射短线。"""
    rng = random.Random(seed)
    for i in range(n):
        ang = -0.9 + i * 0.6 + rng.uniform(-0.08, 0.08)
        dx, dy = np.cos(ang), np.sin(ang)
        draw.line((x + dx * 12, y + dy * 12, x + dx * (12 + length), y + dy * (12 + length)), fill=color, width=width)


def text_bold(draw, xy, s, size, fill, stroke=None, sw=None):
    sw = max(1, size // 30) if sw is None else sw
    draw.text(xy, s, font=font(size), fill=fill, stroke_width=sw, stroke_fill=stroke or fill)


def wrap(s, f, max_w):
    no_start = set("，。、；：？！）」』”’…—,.;:?!)")
    lines, cur = [], ""
    for ch in s:
        if ch == "\n":
            lines.append(cur)
            cur = ""
            continue
        if f.getlength(cur + ch) <= max_w or not cur:
            cur += ch
        elif ch in no_start:
            cur += ch
        else:
            lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


def para(draw, xy, s, size, fill, max_w, leading=1.45, bold=0):
    f = font(size)
    x, y = xy
    for line in wrap(s, f, max_w):
        draw.text((x, y), line, font=f, fill=fill, stroke_width=bold, stroke_fill=fill)
        y += int(size * leading)
    return y


def italic_number(s, size, color):
    f = font(size)
    l, t, r, b = f.getbbox(s, stroke_width=size // 14)
    layer = Image.new("RGBA", (r - l + size // 2, b - t + 10), (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((-l + 4, -t + 4), s, font=f, fill=color,
                               stroke_width=size // 14, stroke_fill=color)
    shear = 0.18
    return layer.transform((layer.width + int(layer.height * shear), layer.height), Image.AFFINE,
                           (1, shear, -layer.height * shear, 0, 1, 0), Image.BICUBIC)


def paste_sprite(img, ref, box, at):
    sp = ref.crop(box)
    img.paste(sp, at, feather_mask(sp.size, 8))


BRAND = True  # 页脚账号名；--no-brand 关闭（冷启动期不带账号名）


def frame(ref):
    img = background()
    paste_sprite(img, ref, HEADER_BOX, (HEADER_BOX[0], HEADER_BOX[1]))
    if BRAND:
        paste_sprite(img, ref, FOOTER_BOX, (FOOTER_BOX[0], FOOTER_BOX[1]))
    return img


def footer_note(draw, s):
    if not s:
        return
    f = font(22)
    draw.text((W - 44 - f.getlength(s), 1392), s, font=f, fill=(196, 192, 186))


# ---------------------------------------------------------------- 文字页
def render_text(spec, ref):
    for blk in spec["blocks"]:  # JSON 列表颜色转元组
        for key in ("color", "label_color"):
            if key in blk:
                blk[key] = tuple(blk[key])
    img = frame(ref)
    d = ImageDraw.Draw(img)
    y = 128
    # 标题两行：第一行米白，第二行荧光黄绿
    for i, line in enumerate(spec["headline"]):
        size = spec.get("headline_size", 112)
        text_bold(d, (62, y), line, size, CREAM if i == 0 else LIME, sw=4)
        y += int(size * 1.14)
    zigzag(d, 60, 60 + min(900, int(font(spec.get("headline_size", 112)).getlength(spec["headline"][-1])) + 30), y + 6)
    ticks(d, W - 120, 150, seed=5)
    y += 40
    # 小标签纸片
    chip = spec["chip"]
    cf = font(34)
    cw = int(cf.getlength(chip)) + 56
    paper(img, (62, y, 62 + cw, y + 70), seed=11, amp=4)
    d = ImageDraw.Draw(img)
    text_bold(d, (90, y + 16), chip, 34, INK, sw=1)
    y += 104

    for k, blk in enumerate(spec["blocks"]):
        kind = blk["type"]
        if kind == "note":
            h = blk.get("height", 200)
            paper(img, (62, y, W - 62, y + h), seed=20 + k, color=blk.get("color", PAPER))
            d = ImageDraw.Draw(img)
            lab = blk["label"]
            lf = font(28)
            marker(d, 92, y + 26, 92 + lf.getlength(lab) + 20, y + 68, color=blk.get("label_color", LIME), seed=k)
            d.text((102, y + 31), lab, font=lf, fill=INK if blk.get("label_color", LIME) == LIME else (255, 255, 255),
                   stroke_width=1, stroke_fill=INK if blk.get("label_color", LIME) == LIME else (255, 255, 255))
            para(d, (98, y + 88), blk["text"], blk.get("size", 36), INK, W - 62 - 98 - 36, bold=blk.get("bold", 0))
            y += h + blk.get("gap", 26)
        elif kind == "item":
            h = blk.get("height", 190)
            num = italic_number(blk["num"], 132, LIME)
            img.paste(num, (34, y + (h - num.height) // 2 - 4), num)
            paper(img, (206, y, W - 62, y + h), seed=40 + k)
            d = ImageDraw.Draw(img)
            tf = font(46)
            title = blk["title"]
            marker(d, 232, y + 62, 232 + tf.getlength(title) + 8, y + 78, seed=60 + k)
            text_bold(d, (236, y + 20), title, 46, INK, sw=2)
            para(d, (238, y + 92), blk["text"], 30, (40, 40, 40), W - 62 - 238 - 30, leading=1.4)
            y += h + blk.get("gap", 22)
        elif kind == "lines":  # 标签 + 台词，示范页
            h = blk.get("height", 380)
            paper(img, (62, y, W - 62, y + h), seed=70 + k, color=blk.get("color", PAPER))
            d = ImageDraw.Draw(img)
            lab = blk["label"]
            lf = font(30)
            marker(d, 92, y + 26, 92 + lf.getlength(lab) + 20, y + 70, color=blk.get("label_color", LIME), seed=80 + k)
            lc = INK if blk.get("label_color", LIME) == LIME else (255, 255, 255)
            d.text((102, y + 31), lab, font=lf, fill=lc, stroke_width=1, stroke_fill=lc)
            yy = y + 96
            for tag, line in blk["rows"]:
                if tag:
                    tfw = font(28)
                    tw = tfw.getlength(tag) + 22
                    d.rounded_rectangle((98, yy + 2, 98 + tw, yy + 44), radius=6, fill=INK)
                    d.text((109, yy + 7), tag, font=tfw, fill=LIME)
                    yy = para(d, (98 + tw + 16, yy + 2), line, 32, INK, W - 62 - (98 + tw + 16) - 30, leading=1.42)
                else:
                    yy = para(d, (98, yy), line, 32, (70, 70, 70), W - 62 - 98 - 30, leading=1.42)
                yy += 14
            y += h + blk.get("gap", 26)
        elif kind == "banner":
            h = blk.get("height", 92)
            rng = random.Random(90 + k)
            poly = torn_poly((92, y, W - 92, y + h), rng, amp=6)
            d.polygon(poly, fill=BLUE)
            bf = font(38)
            s = blk["text"]
            text_bold(d, ((W - bf.getlength(s)) // 2, y + (h - 46) // 2), s, 38, (255, 255, 255), sw=1)
            ticks(d, 70, y + h // 2 - 20, color=BLUE, seed=91, n=2, length=26, width=6)
            y += h + blk.get("gap", 20)
    footer_note(d, spec.get("footnote", ""))
    if y > 1360:
        print(f"警告：内容底部 y={y} 已压到页脚", file=sys.stderr)
    return img


# ---------------------------------------------------------------- 原生拼图页
def render_native(path, ref, label, sub):
    """原生字幕拼图整图等比缩放后居中放入 3:4 画布；不裁切、不改动拼图像素。"""
    img = frame(ref)
    d = ImageDraw.Draw(img)
    col = Image.open(path).convert("RGB")
    top, bottom = 132, 1356
    avail_h = bottom - top
    scale = min(avail_h / col.height, (W - 120) / col.width)
    nw, nh = round(col.width * scale), round(col.height * scale)
    col = col.resize((nw, nh), Image.LANCZOS)
    x = (W - nw) // 2
    # 纸片衬底（只在拼图外沿），不覆盖拼图
    paper(img, (x - 16, top - 12, x + nw + 16, top + nh + 14), seed=99, color=(232, 228, 218), amp=5)
    img.paste(col, (x, top))
    d = ImageDraw.Draw(img)
    # 右上角横排标签（拼图外，不压画面）
    lf = font(36)
    text_bold(d, (W - 44 - lf.getlength(label), 30 if sub else 50), label, 36, LIME, sw=1)
    if sub:
        sf = font(24)
        d.text((W - 44 - sf.getlength(sub), 76), sub, font=sf, fill=(205, 201, 195))
    return img, scale, (x, top, nw, nh)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("text")
    a.add_argument("spec")
    a.add_argument("--style-ref", required=True)
    a.add_argument("--out", required=True)
    b = sub.add_parser("native")
    b.add_argument("image")
    b.add_argument("--style-ref", required=True)
    b.add_argument("--out", required=True)
    b.add_argument("--label", required=True)
    b.add_argument("--sub", default="")
    for p in (a, b):
        p.add_argument("--no-brand", action="store_true", help="不贴页脚账号名")
    args = ap.parse_args()
    global BRAND
    BRAND = not args.no_brand
    ref = Image.open(args.style_ref).convert("RGB")
    if ref.size != (W, H):
        sys.exit("style-ref 应为 1086×1448 的已认可练习卡")
    out = Path(args.out)
    if out.exists():
        sys.exit(f"已存在，不覆盖：{out.name}")
    if args.cmd == "text":
        spec = json.loads(Path(args.spec).read_text(encoding="utf-8"))
        render_text(spec, ref).save(out, quality=95)
    else:
        img, scale, box = render_native(args.image, ref, args.label, args.sub)
        img.save(out, quality=95)
        print(json.dumps({"scale": round(scale, 4), "box": box}, ensure_ascii=False))


if __name__ == "__main__":
    main()

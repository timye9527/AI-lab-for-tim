#!/usr/bin/env python3
"""擦除图片中的文字/笔触（白字、荧光色、蓝色），用周围背景的色调与颗粒补底。

python3 tools/erase.py SRC OUT --box x0 y0 x1 y1 [--box ...] [--white 215]
"""
import argparse
import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("out")
ap.add_argument("--box", nargs=4, type=int, action="append", required=True)
ap.add_argument("--white", type=int, default=215, help="高于此亮度视为文字")
ap.add_argument("--seed", type=int, default=3)
a = ap.parse_args()
im = Image.open(a.src).convert("RGB")
arr = np.asarray(im).astype(np.float32)
H, W = arr.shape[:2]
rng = np.random.default_rng(a.seed)
for x0, y0, x1, y1 in a.box:
    pad = 40
    X0, Y0, X1, Y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
    reg = arr[Y0:Y1, X0:X1]
    mx, mn = reg.max(2), reg.min(2)
    text = (mx > a.white) | ((mx - mn) > 60)
    inbox = np.zeros_like(text)
    inbox[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
    m = Image.fromarray(((text & inbox) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(11))
    hole = np.asarray(m) > 0
    valid = (~hole) & (~text)
    # 归一化卷积：用周围有效像素的模糊均值估计底色
    def blur(x, r=12):
        # 三次盒式模糊近似高斯
        x = x.astype(np.float64)
        for _ in range(3):
            for ax in (0, 1):
                c = np.cumsum(np.pad(x, [(r + 1, r) if i == ax else (0, 0) for i in range(2)], mode="edge"), axis=ax)
                x = (np.take(c, range(2 * r + 1, c.shape[ax]), axis=ax) - np.take(c, range(0, c.shape[ax] - 2 * r - 1), axis=ax)) / (2 * r + 1)
        return x
    v = valid.astype(np.float32)
    est = np.stack([blur(reg[..., c] * v) / np.maximum(blur(v), 1e-3) for c in range(3)], 2)
    # 局部颗粒：取有效像素的标准差
    std = reg[valid].std(0) if valid.any() else np.array([8, 8, 8])
    grain = rng.normal(0, 1, reg.shape[:2])[..., None] * std * 0.8
    filled = np.clip(est + grain, 0, 255)
    alpha = np.asarray(m.filter(ImageFilter.GaussianBlur(2))).astype(np.float32)[..., None] / 255
    arr[Y0:Y1, X0:X1] = reg * (1 - alpha) + filled * alpha
Image.fromarray(arr.astype(np.uint8)).save(a.out)

#!/usr/bin/env python3
"""10 秒开头钩子样片：复刻「温馨客厅主播 + CRT 质感 B-roll + 黄色故障大字 + 双语字幕」的剪辑风格。

画面全部用代码生成（没有用任何外部素材）。主播镜头默认是一个"占位构图"
（暗色客厅 + 台灯 + 挂画 + 扶手椅 + 主播剪影）；用 AI 生成好主播定妆照后，
通过 --host-image 传进来，就会替换成真实主播画面并自动加推镜。

用法：
    python3 tools/hook_demo.py --out out/hook_10s.mp4
    python3 tools/hook_demo.py --out out/hook_10s.mp4 --host-image host.png

依赖：Pillow、numpy、系统 ffmpeg。
"""
import argparse
import math
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1920, 1080, 30
DURATION = 10.0
SR = 48000
FONT_PATHS = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    "/System/Library/Fonts/PingFang.ttc",
    "C:/Windows/Fonts/msjhbd.ttc",
]
FONT_PATH = next((p for p in FONT_PATHS if os.path.exists(p)), None)

# 分镜：(开始秒, 结束秒, 场景, 中文字幕, 英文字幕)
SHOTS = [
    (0.0, 2.6, "host", "週三下午兩點的華盛頓", "Washington, Wednesday, 2 PM"),
    (2.6, 5.0, "hud", "美聯儲宣布降息", "The Fed cuts rates"),
    (5.0, 7.6, "chart", "可你的房貸利率 幾乎沒動", "Yet your mortgage rate barely moved"),
    (7.6, 10.0, "host2", "但真正離譜的 還在後面", "But the craziest part is yet to come"),
]
DISCLAIMER = ("本影片內容僅供參考及教育用途，不構成任何投資建議或要約", "過往表現不代表未來走勢")
YELLOW = (255, 226, 0)
GREEN = (57, 255, 106)


def font(size):
    if FONT_PATH is None:
        sys.exit("没找到中文字体，请安装 Noto Sans CJK 或文泉驿正黑")
    return ImageFont.truetype(FONT_PATH, size)


# ---------- 文字图层 ----------

def text_layer(text, size, fill, stroke=0, stroke_fill=(0, 0, 0), italic=0.0, shadow=0):
    f = font(size)
    l, t, r, b = f.getbbox(text, stroke_width=stroke)
    pad = stroke + shadow * 3 + 4
    w, h = r - l + pad * 2, b - t + pad * 2
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((pad - l + shadow, pad - t + shadow), text, font=f, fill=(0, 0, 0, 200),
                                stroke_width=stroke, stroke_fill=(0, 0, 0, 200))
        img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(shadow)))
    ImageDraw.Draw(img).text((pad - l, pad - t), text, font=f, fill=fill,
                             stroke_width=stroke, stroke_fill=stroke_fill)
    if italic:
        nw = int(w + italic * h)
        img = img.transform((nw, h), Image.AFFINE, (1, italic, -italic * h, 0, 1, 0), Image.BICUBIC)
    return img


def paste_center(base, layer, cx, cy, alpha=1.0):
    if alpha < 1.0:
        a = np.asarray(layer).copy()
        a[..., 3] = (a[..., 3] * alpha).astype(np.uint8)
        layer = Image.fromarray(a)
    base.alpha_composite(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)))


def vertical_disclaimer():
    """左侧竖排免责声明（参考视频全程常驻）。"""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    f = font(27)
    for col, (line, x) in enumerate(zip(DISCLAIMER, (100, 62))):
        y = 170 if col == 0 else 420
        for ch in line:
            d.text((x, y), ch, font=f, fill=(235, 235, 235, 220), anchor="mt",
                   stroke_width=2, stroke_fill=(0, 0, 0, 160))
            y += 31
    return layer


def subtitle_layers(zh, en):
    return (text_layer(zh, 78, (255, 255, 255), stroke=3, stroke_fill=(30, 30, 30), italic=0.18, shadow=4),
            text_layer(en, 46, (255, 255, 255), stroke=2, stroke_fill=(30, 30, 30), shadow=3))


# ---------- 画面后期效果（numpy） ----------

_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_r = np.sqrt(((_xx - W / 2) / (W / 2)) ** 2 + ((_yy - H / 2) / (H / 2)) ** 2)
VIGNETTE = np.clip(1.15 - 0.55 * _r ** 2, 0.25, 1.0)[..., None]
SCAN = np.where((np.arange(H) % 4) < 2, 1.0, 0.72).astype(np.float32)[:, None, None]


def crt(a, rng, shift=4, scan=True, noise=10, warm=False):
    """CRT/录像带质感：色差错位 + 扫描线 + 颗粒 + 暗角，可选暖色调。"""
    out = a.copy()
    if shift:
        out[..., 0] = np.roll(a[..., 0], -shift, axis=1)
        out[..., 2] = np.roll(a[..., 2], shift, axis=1)
    if warm:
        out = out * np.array([1.12, 0.92, 0.72], np.float32) + np.array([18, 6, 0], np.float32)
    if scan:
        out = out * SCAN
    if noise:
        out = out + rng.normal(0, noise, (H, W, 1)).astype(np.float32)
    return np.clip(out * VIGNETTE, 0, 255)


def glitch_slices(img_rgba, rng, strength):
    """把图层切成横条随机错位，做故障字效果。"""
    a = np.asarray(img_rgba).copy()
    h = a.shape[0]
    y = 0
    while y < h:
        band = int(rng.integers(6, 28))
        if rng.random() < 0.45:
            a[y:y + band] = np.roll(a[y:y + band], int(rng.integers(-strength, strength + 1)), axis=1)
        y += band
    return Image.fromarray(a)


# ---------- 场景 ----------

def build_host_set():
    """占位主播镜头：暗色木墙客厅、左侧台灯、右上挂画、中间扶手椅 + 主播剪影。"""
    s = 1.12  # 画大一点，留出推镜空间
    w, h = int(W * s), int(H * s)
    bg = Image.new("RGB", (w, h), (20, 27, 40))
    d = ImageDraw.Draw(bg)
    for x in range(0, w, 150):  # 木墙竖条
        d.rectangle([x, 0, x + 4, h], fill=(14, 19, 30))
    d.rectangle([int(w * .70), int(h * .03), int(w * .99), int(h * .26)], fill=(206, 196, 178))  # 画框
    painting = Image.linear_gradient("L").resize((int(w * .27), int(h * .19))).rotate(35, expand=False)
    pc = Image.merge("RGB", [painting.point(lambda v: 120 + v // 2), painting.point(lambda v: 70 + v // 3),
                             painting.point(lambda v: 60 + v // 5)])
    bg.paste(pc, (int(w * .71), int(h * .045)))
    glow = Image.new("L", (w, h), 0)  # 台灯暖光
    ImageDraw.Draw(glow).ellipse([int(w * .02), int(h * .0), int(w * .36), int(h * .55)], fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    warm = Image.new("RGB", (w, h), (255, 190, 120))
    bg = Image.composite(warm, bg, glow.point(lambda v: int(v * 0.35)))
    d = ImageDraw.Draw(bg)
    d.polygon([(int(w * .11), int(h * .12)), (int(w * .22), int(h * .12)),
               (int(w * .25), int(h * .34)), (int(w * .08), int(h * .34))], fill=(240, 236, 228))  # 灯罩
    d.rectangle([int(w * .145), int(h * .34), int(w * .185), int(h * .58)], fill=(150, 120, 70))  # 灯座
    d.ellipse([int(w * .0), int(h * .55), int(w * .30), int(h * .66)], fill=(70, 70, 74))  # 边几
    d.ellipse([int(w * .07), int(h * .52), int(w * .13), int(h * .58)], fill=(235, 235, 235))  # 咖啡杯
    bg = bg.filter(ImageFilter.GaussianBlur(6))  # 背景虚化
    d = ImageDraw.Draw(bg)
    chair = Image.fromarray(np.random.default_rng(1).integers(60, 110, (h, w, 3), dtype=np.uint8))
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([int(w * .30), int(h * .50), int(w * .70), int(h * 1.05)], 90, fill=255)
    md.rounded_rectangle([int(w * .26), int(h * .72), int(w * .74), int(h * 1.05)], 70, fill=255)
    bg.paste(chair, (0, 0), mask)
    host = Image.new("RGBA", (w, h), (0, 0, 0, 0))  # 主播剪影
    hd = ImageDraw.Draw(host)
    hd.ellipse([int(w * .455), int(h * .20), int(w * .545), int(h * .40)], fill=(170, 195, 230, 150))
    hd.rounded_rectangle([int(w * .38), int(h * .42), int(w * .62), int(h * 1.05)], 120, fill=(170, 195, 230, 150))
    bg = bg.convert("RGBA")
    bg.alpha_composite(host)
    label = text_layer("AI 主播鏡頭（替換此層）", 40, (255, 255, 255, 230), stroke=2)
    bg.alpha_composite(label, (int(w / 2 - label.width / 2), int(h * .58)))
    return bg.convert("RGB")


def load_host_image(path):
    img = Image.open(path).convert("RGB")
    s = max(W * 1.12 / img.width, H * 1.12 / img.height)
    img = img.resize((int(img.width * s), int(img.height * s)), Image.LANCZOS)
    l, t = (img.width - int(W * 1.12)) // 2, (img.height - int(H * 1.12)) // 2
    return img.crop((l, t, l + int(W * 1.12), t + int(H * 1.12)))


def host_frame(src, zoom):
    """从放大的底图里按 zoom 裁一块，做推镜。zoom=1 是全景，越大越近。"""
    cw, ch = int(src.width / zoom), int(src.height / zoom)
    l, t = (src.width - cw) // 2, (src.height - ch) // 2
    return src.crop((l, t, l + cw, t + ch)).resize((W, H), Image.BILINEAR)


def build_hud_base():
    """绿色终端 HUD 画面：电路线、十六进制代码、线框球、通道刻度。画得比屏幕大，方便平移。"""
    rng = np.random.default_rng(7)
    w, h = int(W * 1.25), int(H * 1.25)
    img = Image.new("RGB", (w, h), (4, 8, 6))
    d = ImageDraw.Draw(img)
    f_small, f_mid = font(30), font(48)
    for _ in range(70):  # 电路走线
        x, y = int(rng.integers(w * .35, w)), int(rng.integers(0, h * .55))
        for _ in range(4):
            nx = x + int(rng.integers(-160, 160)) if rng.random() < .5 else x
            ny = y + int(rng.integers(-120, 120)) if nx == x else y
            d.line([x, y, nx, ny], fill=(30, 150, 70), width=2)
            x, y = nx, ny
    for i in range(18):
        code = "".join(rng.choice(list("0123456789ABCDEF/"), 9))
        d.text((int(w * .32), int(h * .30) + i * 46), code, font=f_mid, fill=(40, 200, 90))
        d.rectangle([int(w * .26), int(h * .31) + i * 46, int(w * .30), int(h * .33) + i * 46], fill=(40, 200, 90))
    for i in range(24):  # 通道刻度 V01..V24
        d.text((int(w * .30) + i * 95, int(h * .74)), f"V{i + 1:02d}", font=f_small, fill=(60, 220, 110))
    for word, (x, y) in [("OFF-LINE", (.55, .80)), ("SYNC", (.80, .70)), ("NODE_7", (.85, .20))]:
        d.text((int(w * x), int(h * y)), word, font=f_small, fill=(60, 220, 110))
    cx, cy, r = int(w * .40), int(h * .15), 150  # 线框球
    for k in range(-4, 5):
        rr = int(r * math.cos(k * math.pi / 10))
        d.ellipse([cx - rr, cy + int(r * math.sin(k * math.pi / 10)) - 6, cx + rr,
                   cy + int(r * math.sin(k * math.pi / 10)) + 6], outline=(50, 200, 90), width=2)
    for k in range(6):
        rx = int(r * abs(math.cos(k * math.pi / 6)))
        d.ellipse([cx - rx, cy - r, cx + rx, cy + r], outline=(50, 200, 90), width=2)
    return img.filter(ImageFilter.GaussianBlur(1.2))


def build_dot_grid():
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for y in range(20, H, 46):
        for x in range(20, W, 46):
            d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(230, 230, 230, 120))
    return layer


def chart_frame(p):
    """示意图：联邦基金利率阶梯式下降，30 年房贷利率几乎走平。p 为绘制进度 0-1。"""
    img = Image.new("RGB", (W, H), (28, 16, 10))
    d = ImageDraw.Draw(img)
    x0, x1, y0, y1 = 300, 1650, 220, 760
    for i in range(5):
        y = y0 + i * (y1 - y0) / 4
        d.line([x0, y, x1, y], fill=(70, 45, 30), width=2)
    n = 120
    xs = np.linspace(x0, x1, n)
    fed = np.where(np.arange(n) < 40, 0.30, np.where(np.arange(n) < 80, 0.48, 0.66))
    mort = 0.18 + 0.015 * np.sin(np.arange(n) / 7)
    k = max(2, int(n * p))
    for series, color, label in ((fed, (255, 170, 60), "聯邦基金利率"), (mort, (255, 70, 60), "30年房貸利率")):
        pts = [(float(xs[i]), y0 + float(series[i]) * (y1 - y0)) for i in range(k)]
        d.line(pts, fill=color, width=8, joint="curve")
        lx, ly = pts[-1]
        d.ellipse([lx - 12, ly - 12, lx + 12, ly + 12], fill=color)
        if p > .35:
            img_l = text_layer(label, 40, color + (255,), stroke=2)
            img.paste(img_l, (int(min(lx + 20, x1 - 120)), int(ly - 30)), img_l)
    note = text_layer("示意圖，非真實數據", 26, (200, 170, 150, 255))
    img.paste(note, (x1 - note.width, y1 + 20), note)
    return img


# ---------- 音效（全部合成） ----------

def synth_audio(path):
    n = int(SR * DURATION)
    t = np.arange(n) / SR
    rng = np.random.default_rng(3)
    mix = np.zeros(n, np.float32)

    def env(start, attack, decay):
        e = np.zeros(n, np.float32)
        i0 = int(start * SR)
        ta = np.arange(n - i0) / SR
        e[i0:] = np.where(ta < attack, ta / max(attack, 1e-4), np.exp(-(ta - attack) / decay))
        return e

    def lowpass(x, a):
        y = np.empty_like(x)
        acc = 0.0
        for i, v in enumerate(x):  # 一阶低通，10 秒音频足够快
            acc += a * (v - acc)
            y[i] = acc
        return y

    drone = 0.10 * np.sin(2 * np.pi * 55 * t) + 0.06 * np.sin(2 * np.pi * 82.4 * t)
    mix += drone * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t))
    noise = rng.normal(0, 1, n).astype(np.float32)
    dark_noise = lowpass(noise, 0.02)
    mix += 0.25 * dark_noise
    # 0-2.6s 上升音（riser）
    riser = np.clip((t - 0.2) / 2.4, 0, 1) * (t < 2.6)
    mix += 0.12 * riser ** 2 * np.sin(2 * np.pi * (200 + 900 * riser ** 2) * t)
    mix += 0.20 * riser ** 2 * (noise - dark_noise)
    # 低频冲击（boom）：转场和大字砸下
    for start, amp in ((2.6, 0.9), (2.8, 0.7), (5.0, 0.5), (7.6, 0.6)):
        e = env(start, 0.005, 0.35)
        sweep = np.sin(2 * np.pi * (45 + 60 * np.exp(-(t - start).clip(0) * 8)) * t)
        mix += amp * e * sweep
    # 转场前的嗖声（whoosh）
    for start in (2.35, 4.75, 7.35):
        e = np.exp(-((t - start - 0.15) / 0.09) ** 2)
        mix += 0.35 * e * (noise - lowpass(noise, 0.15))
    # 故障字的电子噪点
    for start in np.arange(3.0, 4.9, 0.37):
        e = env(start, 0.001, 0.03)
        mix += 0.15 * e * np.sign(np.sin(2 * np.pi * 1800 * t))
    mix *= np.clip((DURATION - t) / 0.4, 0, 1)  # 结尾淡出
    mix = mix / np.max(np.abs(mix)) * 0.89
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((mix * 32767).astype(np.int16).tobytes())


# ---------- 主流程 ----------

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="out/hook_10s.mp4")
    ap.add_argument("--host-image", help="AI 生成的主播定妆照（16:9 或更大），替换占位镜头")
    args = ap.parse_args()

    rng = np.random.default_rng(42)
    host_src = load_host_image(args.host_image) if args.host_image else build_host_set()
    hud = build_hud_base()
    dots = build_dot_grid()
    disclaimer = vertical_disclaimer()
    subs = [subtitle_layers(zh, en) for *_, zh, en in SHOTS]
    big = text_layer("美聯儲降息", 250, YELLOW + (255,), stroke=4, stroke_fill=(120, 100, 0))
    ai_tag = text_layer("AI 虛擬主播", 26, (255, 255, 255, 200), stroke=2)
    cut_times = [s[0] for s in SHOTS[1:]]

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    tmp = tempfile.mkdtemp()
    video_tmp, audio_tmp = os.path.join(tmp, "v.mp4"), os.path.join(tmp, "a.wav")
    ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                           "-crf", "18", "-preset", "medium", video_tmp], stdin=subprocess.PIPE)

    for f in range(int(DURATION * FPS)):
        t = f / FPS
        idx = next(i for i, s in enumerate(SHOTS) if s[0] <= t < s[1] or i == len(SHOTS) - 1)
        start, end, kind, *_ = SHOTS[idx]
        lt = t - start
        p = lt / (end - start)

        if kind == "host":
            frame = host_frame(host_src, 1.0 + 0.06 * p)  # 缓慢推镜
            a = crt(np.asarray(frame, np.float32), rng, shift=0, scan=False, noise=4)
        elif kind == "host2":
            zoom = 1.04 if lt < 0.5 else 1.10  # 0.5 秒处跳切推近，强调反问
            frame = host_frame(host_src, zoom + 0.01 * p)
            a = crt(np.asarray(frame, np.float32), rng, shift=0, scan=False, noise=4)
        elif kind == "hud":
            ox, oy = int(80 + 120 * p), int(60 + 40 * p)  # 镜头平移
            frame = hud.crop((ox, oy, ox + W, oy + H)).convert("RGBA")
            frame.alpha_composite(dots)
            if lt >= 0.2:  # 0.2 秒时大字砸进来：放大 + 模糊 → 定住 + 间歇故障
                k = min((lt - 0.2) / 0.2, 1.0)
                scale = 1.6 - 0.6 * k
                layer = big.resize((int(big.width * scale), int(big.height * scale)), Image.BILINEAR)
                if k < 1:
                    layer = layer.filter(ImageFilter.GaussianBlur(12 * (1 - k)))
                if (f // 3) % 4 == 0 or k < 1:
                    layer = glitch_slices(layer, rng, 40)
                paste_center(frame, layer, W / 2, H * 0.36, alpha=min(1.0, 0.3 + k))
            a = crt(np.asarray(frame.convert("RGB"), np.float32), rng, shift=5, noise=12)
        else:  # chart
            frame = chart_frame(min(1.0, 0.15 + p * 1.2))
            a = crt(np.asarray(frame, np.float32), rng, shift=4, noise=14, warm=True)

        # 剪切点前后各 1 帧：闪白 + 强色差
        if any(abs(t - c) < 1.5 / FPS for c in cut_times):
            a = crt(np.clip(a * 1.6 + 40, 0, 255), rng, shift=18, scan=False, noise=0)

        out = Image.fromarray(a.astype(np.uint8)).convert("RGBA")
        out.alpha_composite(disclaimer)
        if kind.startswith("host"):
            out.alpha_composite(ai_tag, (W - ai_tag.width - 40, 36))
        zh, en = subs[idx]
        sub_alpha = min(1.0, lt / 0.12)
        paste_center(out, zh, W / 2, 880, sub_alpha)
        paste_center(out, en, W / 2, 965, sub_alpha)
        ff.stdin.write(out.convert("RGB").tobytes())

    ff.stdin.close()
    if ff.wait() != 0:
        sys.exit("ffmpeg 视频编码失败")

    synth_audio(audio_tmp)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", video_tmp, "-i", audio_tmp,
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", args.out], check=True)
    print(f"已生成 {args.out}（{W}x{H}，{DURATION:.0f} 秒）")


if __name__ == "__main__":
    main()

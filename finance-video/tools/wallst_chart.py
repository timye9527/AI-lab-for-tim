#!/usr/bin/env python3
"""把 CSV 时间序列渲染成华尔街终端风格的动态折线图 MP4。

效果：深色背景，线条从左到右画出（缓出），末端发光点，右上角数字计数器，
涨跌自动变色（绿涨红跌），左上标题 + 琥珀色强调条，右下角来源标注。

输入 CSV 两列：date,value（date 为 YYYY-MM-DD 或 YYYY-MM）。

用法：
    python3 tools/wallst_chart.py examples/sample_series.csv \
        --title "10 年期美债收益率" --unit "%" --source "FRED，截至 2026-09-30" \
        --out out/chart.mp4 [--vertical] [--seconds 6] [--hold 2] [--fps 30]

依赖：matplotlib、numpy、系统 ffmpeg。
"""
import argparse
import csv
import logging
import os
import sys
from datetime import datetime

import matplotlib

matplotlib.use("Agg")
import matplotlib.dates as mdates  # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from matplotlib import font_manager  # noqa: E402
from matplotlib.animation import FFMpegWriter  # noqa: E402

BG = "#0B1220"
UP = "#00C853"
DOWN = "#FF3B30"
ACCENT = "#FF9F1C"
TEXT = "#E6EDF3"
MUTED = "#7D8590"
GRID = "#1C2636"

CJK_FONTS = ["Noto Sans CJK SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei",
             "WenQuanYi Zen Hei", "SimHei"]
MONO_FONTS = ["JetBrains Mono", "Roboto Mono", "IBM Plex Mono", "DejaVu Sans Mono"]


def pick_font(candidates):
    installed = {f.name for f in font_manager.fontManager.ttflist}
    return next((c for c in candidates if c in installed), None)


def read_series(path):
    dates, values = [], []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            d = row["date"].strip()
            dates.append(datetime.strptime(d, "%Y-%m-%d" if len(d) > 7 else "%Y-%m"))
            values.append(float(row["value"]))
    if len(values) < 2:
        sys.exit("至少需要 2 个数据点")
    return np.array(mdates.date2num(dates)), np.array(values)


def ease_out_cubic(t):
    return 1 - (1 - t) ** 3


def partial_series(x, y, progress):
    """返回画到 progress(0-1) 处的折线，末端在两个点之间插值，让线条平滑前进。"""
    pos = progress * (len(x) - 1)
    i = int(pos)
    if i >= len(x) - 1:
        return x, y
    frac = pos - i
    xe = x[i] + (x[i + 1] - x[i]) * frac
    ye = y[i] + (y[i + 1] - y[i]) * frac
    return np.append(x[: i + 1], xe), np.append(y[: i + 1], ye)


def fmt_value(v, unit, decimals):
    return f"{v:,.{decimals}f}{unit}"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv")
    ap.add_argument("--title", required=True)
    ap.add_argument("--subtitle", default="")
    ap.add_argument("--unit", default="")
    ap.add_argument("--source", required=True, help="来源标注，例如「FRED，截至 2026-09-30」")
    ap.add_argument("--out", default="out/chart.mp4")
    ap.add_argument("--vertical", action="store_true", help="竖屏 1080x1920（默认横屏 1920x1080）")
    ap.add_argument("--seconds", type=float, default=6.0, help="画线动画时长")
    ap.add_argument("--hold", type=float, default=2.0, help="画完后停留时长")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--decimals", type=int, default=2)
    args = ap.parse_args()

    x, y = read_series(args.csv)

    cjk = pick_font(CJK_FONTS)
    mono = pick_font(MONO_FONTS)
    if cjk:
        plt.rcParams["font.sans-serif"] = [cjk, "DejaVu Sans"]
    else:
        print("警告：没找到中文字体，中文可能显示为方框", file=sys.stderr)
    logging.getLogger("matplotlib.font_manager").setLevel(logging.ERROR)
    # 数字用等宽字体，等宽字体里没有的中文字符回退到中文字体
    mono_kw = {"family": [f for f in (mono, cjk) if f]} if mono else {}

    w, h = (1080, 1920) if args.vertical else (1920, 1080)
    dpi = 100
    fig = plt.figure(figsize=(w / dpi, h / dpi), dpi=dpi, facecolor=BG)

    # 竖屏时图表放在中间偏上，给字幕和平台 UI 留出下方空间
    if args.vertical:
        ax_rect = [0.10, 0.30, 0.82, 0.34]
        title_y, value_y, size_title, size_value = 0.86, 0.79, 44, 72
    else:
        ax_rect = [0.06, 0.14, 0.88, 0.60]
        title_y, value_y, size_title, size_value = 0.90, 0.84, 40, 64

    ax = fig.add_axes(ax_rect, facecolor=BG)
    pad = (y.max() - y.min()) * 0.12 or 1
    ax.set_xlim(x[0], x[-1])
    ax.set_ylim(y.min() - pad, y.max() + pad)
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(GRID)
    ax.grid(axis="y", color=GRID, linewidth=1)
    ax.tick_params(colors=MUTED, labelsize=18 if args.vertical else 16, length=0, pad=10)
    ax.yaxis.tick_right()
    months = (x[-1] - x[0]) / 30.4
    want = 4 if args.vertical else 7
    step = next((n for n in (1, 2, 3, 6, 12, 24, 60) if months / n <= want), 120)
    if step >= 12:
        ax.xaxis.set_major_locator(mdates.YearLocator(step // 12))
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
    else:
        ax.xaxis.set_major_locator(mdates.MonthLocator(interval=step))
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))
    for lbl in ax.get_yticklabels() + ax.get_xticklabels():
        if mono:
            lbl.set_fontfamily(mono)

    # 标题区
    fig.patches.append(plt.Rectangle((0.06 if not args.vertical else 0.10, title_y - 0.005), 0.006, 0.05,
                                     transform=fig.transFigure, color=ACCENT))
    left = 0.075 if not args.vertical else 0.12
    fig.text(left, title_y, args.title, color=TEXT, fontsize=size_title, fontweight="bold", va="bottom")
    if args.subtitle:
        fig.text(left, title_y - 0.03, args.subtitle, color=MUTED, fontsize=size_title * 0.5, va="bottom")
    fig.text(0.94 if not args.vertical else 0.92, 0.04 if not args.vertical else 0.25,
             f"来源：{args.source}", color=MUTED, fontsize=16, ha="right")

    value_txt = fig.text(left, value_y - 0.07, "", color=TEXT, fontsize=size_value,
                         fontweight="bold", va="bottom", **mono_kw)
    change_txt = fig.text(left, value_y - 0.105, "", fontsize=size_value * 0.42, va="bottom", **mono_kw)

    (line,) = ax.plot([], [], linewidth=4, solid_capstyle="round", clip_on=False)
    fill = [None]
    glow = [ax.scatter([], [], s=s, alpha=a, zorder=5, linewidths=0, clip_on=False)
            for s, a in ((1600, 0.08), (700, 0.15), (250, 0.35), (80, 1.0))]

    anim_frames = max(int(args.seconds * args.fps), 2)
    total_frames = anim_frames + int(args.hold * args.fps)

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    writer = FFMpegWriter(fps=args.fps, codec="libx264",
                          extra_args=["-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium"])
    with writer.saving(fig, args.out, dpi):
        for f in range(total_frames):
            progress = ease_out_cubic(min(f / (anim_frames - 1), 1.0))
            px, py = partial_series(x, y, progress)
            color = UP if py[-1] >= y[0] else DOWN

            line.set_data(px, py)
            line.set_color(color)
            if fill[0] is not None:
                fill[0].remove()
            fill[0] = ax.fill_between(px, py, ax.get_ylim()[0], color=color, alpha=0.10, linewidth=0)
            for g in glow:
                g.set_offsets([[px[-1], py[-1]]])
                g.set_color(color)

            change = py[-1] - y[0]
            arrow = "▲" if change >= 0 else "▼"
            if args.unit == "%":
                # 利率类数据的变化按华尔街习惯用基点（bp）表示，不算百分比的百分比
                delta = f"{change * 100:+,.0f}bp"
            else:
                pct = change / abs(y[0]) * 100 if y[0] else 0.0
                delta = f"{change:+,.{args.decimals}f}{args.unit}  ({pct:+.1f}%)"
            value_txt.set_text(fmt_value(py[-1], args.unit, args.decimals))
            change_txt.set_text(f"{arrow} {delta}  自 {mdates.num2date(x[0]).strftime('%Y-%m')}")
            change_txt.set_color(color)
            writer.grab_frame(facecolor=BG)

    print(f"已生成 {args.out}（{w}x{h}，{total_frames / args.fps:.1f} 秒）")


if __name__ == "__main__":
    main()

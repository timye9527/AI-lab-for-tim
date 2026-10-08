#!/usr/bin/env python3
"""按评分表给候选选题排序。

输入 CSV 列：topic,type,wallet,surprise,timeliness,visual,verifiable,saturation[,notes]
各维度 1-5 分，含义见 01-选题与信息过滤.md。saturation 越高说明做的人越多，会扣分。

用法：
    python3 tools/topic_score.py examples/topics.csv
    python3 tools/topic_score.py examples/topics.csv --top 3 --min-verifiable 3
"""
import argparse
import csv
import sys

WEIGHTS = {
    "wallet": 0.25,
    "surprise": 0.20,
    "timeliness": 0.20,
    "visual": 0.15,
    "verifiable": 0.15,
    "saturation": -0.05,
}


def score(row):
    return sum(w * float(row[k]) for k, w in WEIGHTS.items())


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv")
    ap.add_argument("--top", type=int, default=0, help="只显示前 N 个（默认全部）")
    ap.add_argument("--min-verifiable", type=float, default=3,
                    help="可验证性低于此值的选题直接淘汰（默认 3）")
    args = ap.parse_args()

    with open(args.csv, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    missing = [k for k in ("topic", *WEIGHTS) if rows and k not in rows[0]]
    if missing:
        sys.exit(f"CSV 缺少列：{', '.join(missing)}")

    kept, dropped = [], []
    for r in rows:
        for k in WEIGHTS:
            v = float(r[k])
            if not 1 <= v <= 5:
                sys.exit(f"「{r['topic']}」的 {k}={v} 不在 1-5 范围内")
        (kept if float(r["verifiable"]) >= args.min_verifiable else dropped).append(r)

    kept.sort(key=score, reverse=True)
    if args.top:
        kept = kept[: args.top]

    max_score = sum(w * 5 for w in WEIGHTS.values() if w > 0) + WEIGHTS["saturation"] * 1
    print(f"{'#':>2}  {'得分':>5}  {'类型':<6}  选题")
    for i, r in enumerate(kept, 1):
        print(f"{i:>2}  {score(r):>5.2f}  {r.get('type', ''):<6}  {r['topic']}")
    print(f"\n满分约 {max_score:.2f}（各项 5 分、饱和度 1 分）")

    if dropped:
        print(f"\n因可验证性 < {args.min_verifiable:g} 淘汰：")
        for r in dropped:
            print(f"    - {r['topic']}（verifiable={r['verifiable']}）")


if __name__ == "__main__":
    main()

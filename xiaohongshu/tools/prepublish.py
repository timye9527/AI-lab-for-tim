#!/usr/bin/env python3
"""发布前最后一遍：打印将要发布的标题、正文、Tag、图片顺序与校验值，并检查是否已发布过（防重复）。

用法（在 xiaohongshu/ 目录）：python3 tools/prepublish.py E01-v3
"""
import hashlib
import json
import sys
from pathlib import Path

ver = sys.argv[1]
root = Path(__file__).resolve().parent.parent
prog = json.loads((root / "progress.json").read_text(encoding="utf-8"))
approved = {a["id"] if isinstance(a, dict) else a for a in prog.get("approved_versions", [])}
published = {p.get("id") for p in prog.get("published_posts", []) if isinstance(p, dict)}
if ver not in approved:
    sys.exit(f"停止：{ver} 不在 approved_versions 中")
if ver in published:
    sys.exit(f"停止：{ver} 已在 published_posts 中，禁止重复发布")
d = root / "review" / ver
md = (d / "post.md").read_text(encoding="utf-8")
title = md.split("## 标题")[1].split("\n", 1)[1].split("##")[0].strip()
body = md.split("## 正文")[1].split("## Tag")[0].strip()
tags = md.split("## Tag")[1].split("\n", 1)[1].strip()
imgs = sorted((d / "upload").glob("*.jpg"))
if not imgs:
    sys.exit("停止：upload/ 下没有图片（媒体不在公开仓库，需从素材包放回）")
assert len(title) <= 20 and len(body) <= 1000, "标题或正文超长"
print(f"== {ver} 待发布内容 ==\n标题（{len(title)}字）：{title}\n\n正文（{len(body)}字）：\n{body}\n\nTag：{tags}\n\n图片顺序：")
for i, p in enumerate(imgs, 1):
    print(f"  {i}. {p.name}  sha256:{hashlib.sha256(p.read_bytes()).hexdigest()[:12]}")
print("\n以上内容须由委托方在本次会话中回复“确认发布”后，才能点击发布。")

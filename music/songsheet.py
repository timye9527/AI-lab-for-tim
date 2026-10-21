#!/usr/bin/env python3
"""歌谱文本（song.txt）解析 + 琴谱网页生成。伴奏脚本和琴谱网页共用这一份格式，格式说明见 README.md。

用法：python3 music/songsheet.py music/battle-song/song.txt [输出.html] [--bare]
不写输出路径时生成到歌谱同目录的 out/琴谱.html；--bare 输出不带 <html> 外壳的版本（发布 Artifact 用）。
"""
from pathlib import Path
import re
import sys

STYLES = "重扫|轻扫|分解|扫|闷|切|响|停"
CHORD_RE = re.compile(r"(?:[A-G][#b]?(?:maj7|m7|m|7|sus2|sus4|add9|dim|aug|6|9)?(?:/[A-G][#b]?)?|-)")
STYLE_RE = re.compile(rf"({STYLES})((?:·\S+)*)")
META_KEYS = ("标题", "说明", "速度", "夹品", "拍号")
VIEWER = Path(__file__).resolve().parent / "songsheet.html"


def parse(text):
    """返回 {"meta": {...}, "items": [...]}；items 里是 section / note / line 三种。"""
    meta = {"标题": "未命名", "说明": "", "速度": "90", "夹品": "0", "拍号": "4/4"}
    items, section = [], ""
    for n, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if m := re.fullmatch(r"【(.+)】", line):
            section = m[1]
            items.append({"type": "section", "name": section})
            continue
        if line.startswith(">"):
            items.append({"type": "note", "text": line[1:].strip()})
            continue
        parts = line.split()
        k = 0
        while k < len(parts) and CHORD_RE.fullmatch(parts[k]):
            k += 1
        if not k:
            m = re.fullmatch(r"(\S+?)[：:]\s*(.*)", line)
            if not (m and m[1] in META_KEYS):
                raise ValueError(f"song.txt 第 {n} 行看不懂：{line}")
            meta[m[1]] = m[2]
            continue
        rest = re.sub(r"^(?:\S+\s+){%d}" % k, "", line + " ").strip()
        row = {"type": "line", "line_no": n, "section": section, "chords": parts[:k],
               "style": "扫", "vol": 1.0, "rest": 0, "ramp": None, "lyric": rest}
        tok = rest.split()[0] if rest else ""
        if m := STYLE_RE.fullmatch(tok):
            row["style"], row["lyric"] = m[1], rest[len(tok):].strip()
            for mod in filter(None, m[2].split("·")):
                if r := re.fullmatch(r"末(\d)拍停", mod):
                    row["rest"] = int(r[1])
                elif r := re.fullmatch(r"音量([\d.]+)", mod):
                    row["vol"] = float(r[1])
                elif r := re.fullmatch(r"渐强([\d.]+)-([\d.]+)", mod):
                    row["ramp"] = (float(r[1]), float(r[2]))
                else:
                    raise ValueError(f"song.txt 第 {n} 行修饰看不懂：{mod}")
        items.append(row)
    return {"meta": meta, "items": items}


def plain_lyric(lyric):
    """给表演者看的纯文本：去掉 [和弦] 标记，{提示} 换成（提示）。"""
    return re.sub(r"\{([^}]*)\}", r"（\1）", re.sub(r"\[[^\]]+\]", "", lyric))


def build_html(text, bare=False):
    title = parse(text)["meta"]["标题"]  # 顺便校验格式
    assert "</script" not in text.lower()
    page = VIEWER.read_text(encoding="utf-8")
    page = page.replace("<title>琴谱</title>", f"<title>{title}</title>", 1)
    page = page.replace("<!--SONG-->", text, 1)
    if bare:
        return page
    return ('<!doctype html>\n<html lang="zh-CN">\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + page + "\n</html>\n")


def main():
    args = [a for a in sys.argv[1:] if a != "--bare"]
    if not args:
        sys.exit(__doc__)
    src = Path(args[0])
    out = Path(args[1]) if len(args) > 1 else src.parent / "out" / "琴谱.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build_html(src.read_text(encoding="utf-8"), "--bare" in sys.argv), encoding="utf-8")
    print(f"琴谱已生成：{out}")


if __name__ == "__main__":
    main()

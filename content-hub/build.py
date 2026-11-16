#!/usr/bin/env python3
"""内容中台：读 data.json，生成 index.html（Artifact 片段，无外部资源）。"""
import json, re, html
from pathlib import Path

HERE = Path(__file__).parent
STAGES = ["选题", "稿件", "配音", "画面", "成片", "已发布"]
ASK_RE = re.compile(r"过稿|验收|确认|选版本")
e = lambda s: html.escape(str(s), quote=True)

def safe_url(u):
    return u if re.match(r"^https?://", u or "") else ""

def stepper(stage):
    i = STAGES.index(stage) if stage in STAGES else -1
    segs = "".join('<i class="%s"></i>' % ("on" if k <= i else "") for k in range(6))
    return '<div class="step"><span class="bar" aria-hidden="true">%s</span><span class="stg">%s</span></div>' % (segs, e(stage))

def chip_pub(p):
    cls = {"是": "yes", "否": "no", "未核实": "unk"}.get(p, "no")
    return '<span class="chip %s">%s</span>' % (cls, e(p))

def links(ep):
    out = []
    if safe_url(ep.get("publish_url")):
        out.append('<a href="%s" rel="noopener">发布页</a>' % e(ep["publish_url"]))
    for l in ep.get("links", []):
        u = safe_url(l.get("url"))
        out.append('<a href="%s" rel="noopener">%s</a>' % (e(u), e(l.get("label", "链接"))) if u else e(l.get("label", "")))
    return " · ".join(out) or '<span class="mute">—</span>'

def ep_table(eps):
    rows = []
    for ep in eps:
        bn = []
        if ep.get("blocker"):
            bn.append('<div><b>卡：</b>%s</div>' % e(ep["blocker"]))
        if ep.get("next"):
            bn.append('<div><b>下一步：</b>%s</div>' % e(ep["next"]))
        date = '<div class="mute">%s</div>' % e(ep["date"]) if ep.get("date") else ""
        rows.append(
            "<tr><td class=\"no\">%s</td><td class=\"ttl\">%s%s</td><td>%s</td><td>%s</td><td class=\"bn\">%s</td><td class=\"lk\">%s</td></tr>"
            % (e(ep["no"]), e(ep["title"]), date, stepper(ep["stage"]), chip_pub(ep["published"]), "".join(bn) or '<span class="mute">—</span>', links(ep)))
    return ('<div class="tw"><table><thead><tr><th>期</th><th>题目</th><th>进度</th><th>发布</th><th>卡在哪 / 下一步</th><th>链接</th></tr></thead><tbody>%s</tbody></table></div>' % "".join(rows))

def line_card(ln):
    st = ln["status"]
    scls = {"运行中": "run", "暂停": "pause", "封存": "arch"}.get(st, "pause")
    return ('<article class="line"><header><h3>%s</h3><span class="chip %s">%s</span></header>'
            '<p class="meta">%s · %s · %s</p><p class="note">%s</p><p class="src">源：%s</p>%s</article>'
            % (e(ln["name"]), scls, e(st), e(ln["format"]), e(ln["platform"]), e(ln["cadence"]), e(ln["note"]), e(ln["source"]), ep_table(ln["episodes"])))

def main():
    d = json.loads((HERE / "data.json").read_text(encoding="utf-8"))
    # 等你确认
    ask = []
    n_pub = n_unk = n_wip = n_off = 0
    for g in d["groups"]:
        for ln in g["lines"]:
            if ln["status"] != "运行中":
                n_off += 1
            for ep in ln["episodes"]:
                why = []
                if ep["published"] == "未核实" and ep["stage"] in ("成片", "已发布"):
                    why.append("已有成片，发没发布？" if ep["stage"] == "成片" else "标为已发布，但没核实")
                if ASK_RE.search(ep.get("blocker", "")):
                    why.append("要你拍板：" + ep["blocker"])
                if why:
                    ask.append((ln["name"], ep, "；".join(why)))
                if ep["published"] == "是":
                    n_pub += 1
                elif ep["published"] == "未核实" and ep["stage"] == "成片":
                    n_unk += 1
                elif ln["status"] == "运行中" and ep["stage"] in STAGES[:4]:
                    n_wip += 1
    ask_html = "".join('<li><b>%s</b> · %s <span class="mute">%s</span><div class="why">%s</div></li>'
                       % (e(n), e(ep["no"] + " " + ep["title"]), e(ep.get("date", "")), e(w)) for n, ep, w in ask)
    out = ['<title>内容中台</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>', CSS, "</style>", '<div class="wrap">']
    out.append('<header class="top"><h1>内容中台</h1><p class="sub">更新于 %s</p><p>按「每一期」记账：做到哪一步、发没发布、卡在哪。</p></header>' % e(d["asof"]))
    out.append('<section class="ask"><h2>等你确认 <span class="cnt">%d</span></h2><p class="lead">这几期已有成片，发没发布？</p><ul>%s</ul></section>' % (len(ask), ask_html))
    out.append('<section class="sum"><div><b>%d</b><span>已发布</span></div><div><b>%d</b><span>成片未核实</span></div><div><b>%d</b><span>制作中</span></div><div><b>%d</b><span>暂停或封存的线</span></div></section>' % (n_pub, n_unk, n_wip, n_off))
    for g in d["groups"]:
        out.append('<section class="grp"><h2>%s</h2><p class="why-g">%s</p>' % (e(g["name"]), e(g["why"])))
        live = [l for l in g["lines"] if l["status"] == "运行中"]
        off = [l for l in g["lines"] if l["status"] != "运行中"]
        out.extend(line_card(l) for l in live)
        if off:
            out.append('<details class="off"><summary>暂停 / 封存（%d）</summary>%s</details>' % (len(off), "".join(line_card(l) for l in off)))
        out.append("</section>")
    out.append('<section class="grp"><h2>共用能力</h2><ul class="plain">%s</ul></section>' % "".join(
        '<li><b>%s</b>：%s <span class="mute">%s</span></li>' % (e(s["name"]), e(s["what"]),
            ('<a href="%s" rel="noopener">打开</a>' % e(s["path"])) if safe_url(s["path"]) else e(s["path"])) for s in d["shared"]))
    out.append('<section class="grp"><h2>开工规则</h2><ol class="plain">%s</ol></section>' % "".join("<li>%s</li>" % e(r) for r in d["rules"]))
    out.append('<footer>源数据 content-hub/data.json，改完跑 python3 content-hub/build.py</footer></div>')
    (HERE / "index.html").write_text("\n".join(out) + "\n", encoding="utf-8")
    print("ok: %d 条待确认" % len(ask))

CSS = """
:root{--bg:#f3f1ec;--card:#fbfaf7;--fg:#24231f;--mute:#6f6c63;--line:#dedad0;--acc:#0f5f63;--acc-bg:#e2eeee;
--yes:#1f6b3a;--yes-bg:#dff0e4;--unk:#8a5a00;--unk-bg:#f8ebc9;--no:#55524a;--no-bg:#e7e4dc;--dot:#cfcabd}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#171715;--card:#201f1c;--fg:#ebe8e0;--mute:#9a968a;--line:#35332d;--acc:#5cb8bc;--acc-bg:#1d3637;
--yes:#7fd39a;--yes-bg:#1d3526;--unk:#e6bb5c;--unk-bg:#3a2f14;--no:#b3afa3;--no-bg:#2c2a25;--dot:#3f3c35}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#171715;--card:#201f1c;--fg:#ebe8e0;--mute:#9a968a;--line:#35332d;--acc:#5cb8bc;--acc-bg:#1d3637;
--yes:#7fd39a;--yes-bg:#1d3526;--unk:#e6bb5c;--unk-bg:#3a2f14;--no:#b3afa3;--no-bg:#2c2a25;--dot:#3f3c35}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 "PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif}
.wrap{max-width:1080px;margin:0 auto;padding:24px max(16px,env(safe-area-inset-right,0px)) 40px max(16px,env(safe-area-inset-left,0px))}
h1{margin:0;font-size:28px;color:var(--acc)}h2{font-size:19px;margin:0 0 6px}h3{font-size:16px;margin:0}
.sub{margin:2px 0;color:var(--mute);font-size:13px}.top p{margin:4px 0}
.mute{color:var(--mute);font-size:12px}
.ask{margin:18px 0;padding:14px 16px;border:2px solid var(--acc);border-radius:8px;background:var(--card)}
.ask .cnt{display:inline-block;min-width:26px;padding:0 8px;border-radius:13px;background:var(--acc);color:var(--bg);font-size:14px;text-align:center}
.ask .lead{margin:2px 0 8px;color:var(--mute)}.ask ul{margin:0;padding-left:18px}.ask li{margin:7px 0}.why{font-size:13px;color:var(--mute)}
.sum{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:22px}
.sum div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 12px}
.sum b{display:block;font-size:24px;color:var(--acc)}.sum span{font-size:12px;color:var(--mute)}
.grp{margin:28px 0}.why-g{margin:0 0 10px;color:var(--mute);font-size:13px}
.line{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px;margin:12px 0}
.line header{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.meta{margin:4px 0;color:var(--fg);font-size:13px}.note{margin:4px 0;font-size:13px}.src{margin:4px 0 8px;font-size:12px;color:var(--mute)}
.chip{display:inline-block;padding:1px 9px;border-radius:10px;font-size:12px;white-space:nowrap}
.chip.yes{background:var(--yes-bg);color:var(--yes)}.chip.unk{background:var(--unk-bg);color:var(--unk)}
.chip.no,.chip.pause,.chip.arch{background:var(--no-bg);color:var(--no)}.chip.run{background:var(--acc-bg);color:var(--acc)}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%;min-width:720px;font-size:13px}
th,td{text-align:left;vertical-align:top;padding:8px 8px;border-top:1px solid var(--line)}th{color:var(--mute);font-weight:500;border-top:0}
td.no{white-space:nowrap}td.ttl{min-width:150px}td.bn{min-width:200px}td.lk{min-width:70px}
.step{display:flex;flex-direction:column;gap:3px;min-width:96px}.bar{display:flex;gap:2px}
.bar i{width:14px;height:5px;border-radius:2px;background:var(--dot);display:block}.bar i.on{background:var(--acc)}.stg{font-size:12px}
a{color:var(--acc)}
details.off{margin-top:10px}summary{cursor:pointer;color:var(--mute);padding:6px 0}
.plain{padding-left:20px}.plain li{margin:6px 0}
footer{margin-top:30px;padding-top:12px;border-top:1px solid var(--line);color:var(--mute);font-size:12px}
@media (max-width:520px){.sum{grid-template-columns:repeat(2,1fr)}}
"""
if __name__ == "__main__":
    main()

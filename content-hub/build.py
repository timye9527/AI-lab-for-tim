#!/usr/bin/env python3
"""内容中台：读 data.json，生成 index.html（Artifact 片段，无外部资源）。"""
import json, re, html
from pathlib import Path

HERE = Path(__file__).parent
STAGES = ["选题", "稿件", "配音", "画面", "成片", "已发布"]
e = lambda s: html.escape(str(s), quote=True)

def safe_url(u):
    return u if re.match(r"^https?://", u or "") else ""

def stepper(stage):
    i = STAGES.index(stage) if stage in STAGES else -1
    segs = "".join('<i class="%s"></i>' % ("on" if k <= i else "") for k in range(6))
    return '<div class="step"><span class="bar" aria-hidden="true">%s</span><span class="stg">%s</span></div>' % (segs, e(stage))

MARKS = ["已发布", "暂不发布", "仅验证", "待定"]
MCLS = {"已发布": "yes", "暂不发布": "no", "仅验证": "blu", "待定": "unk", "未标": "out"}

def eff_default(ep):
    return ep.get("default_mark") or "未标"

def chip_mark(ep):
    m = eff_default(ep)
    return '<span class="chip mk %s" data-ep="%s">%s</span>' % (MCLS[m], e(ep["id"]), e(m))

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
            % (e(ep["no"]), e(ep["title"]), date, stepper(ep["stage"]), chip_mark(ep), "".join(bn) or '<span class="mute">—</span>', links(ep)))
    return ('<div class="tw"><table><thead><tr><th>期</th><th>题目</th><th>进度</th><th>标记</th><th>卡在哪 / 下一步</th><th>链接</th></tr></thead><tbody>%s</tbody></table></div>' % "".join(rows))

def line_card(ln):
    st = ln["status"]
    scls = {"运行中": "run", "暂停": "pause", "封存": "arch"}.get(st, "pause")
    return ('<article class="line"><header><h3>%s</h3><span class="chip %s">%s</span></header>'
            '<p class="meta">%s · %s · %s</p><p class="note">%s</p><p class="src">源：%s</p>%s</article>'
            % (e(ln["name"]), scls, e(st), e(ln["format"]), e(ln["platform"]), e(ln["cadence"]), e(ln["note"]), e(ln["source"]), ep_table(ln["episodes"])))

def tick_table(d):
    rows = []
    for g in d["groups"]:
        items = [(ln, ep) for ln in g["lines"] for ep in ln["episodes"] if ep["stage"] in ("成片", "已发布")]
        if not items:
            continue
        rows.append('<tr class="gh" data-g="%s"><td colspan="4">%s</td></tr>' % (e(g["id"]), e(g["name"])))
        for ln, ep in items:
            btns = "".join('<button type="button" data-s="%s" aria-pressed="false">%s</button>' % (m, m) for m in MARKS)
            rows.append(
                '<tr class="tk" data-id="%s" data-g="%s"><td class="ttl"><b>%s</b> · %s</td><td class="mute">%s</td>'
                '<td class="now"><span class="chip mk out">未标</span> <span class="saved" aria-live="polite"></span>'
                '<input type="text" class="url" placeholder="发布链接，可不填" aria-label="发布链接" hidden></td>'
                '<td><div class="seg" role="group" aria-label="标记">%s</div></td></tr>'
                % (e(ep["id"]), e(g["id"]), e(ep["no"]), e(ep["title"]), e(ln["name"]), btns))
    return ('<div class="tw"><table class="tick"><thead><tr><th>期 · 题目</th><th>类别线</th><th>现在</th><th>标记</th></tr></thead>'
            '<tbody>%s</tbody></table></div><p class="empty" hidden>没有未标的了。</p>' % "".join(rows))

def main():
    d = json.loads((HERE / "data.json").read_text(encoding="utf-8"))
    eps, n_off = [], 0
    for g in d["groups"]:
        for ln in g["lines"]:
            if ln["status"] != "运行中":
                n_off += 1
            for ep in ln["episodes"]:
                eps.append({"id": ep["id"], "g": g["id"], "def": eff_default(ep), "tick": ep["stage"] in ("成片", "已发布")})
    cnt = {m: 0 for m in MARKS + ["未标"]}
    for x in eps:
        cnt[x["def"]] += 1
    blob = json.dumps(eps, ensure_ascii=False).replace("</", "<\\/").replace("<!--", "<\\!--")
    out = ['<title>内容中台</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>', CSS, "</style>", '<div class="wrap">']
    out.append('<header class="top"><h1>内容中台</h1><p class="sub">更新于 %s</p><p>按「每一期」记账：做到哪一步、发没发布、卡在哪。不是每期都要发布，勾一下就行。</p></header>' % e(d["asof"]))
    out.append('<section class="sum" id="sum">%s</section>' % "".join(
        '<div><b data-c="%s">%d</b><span>%s</span></div>' % (k, v, k) for k, v in cnt.items()))
    out.append('<section class="ask"><h2>勾一下</h2><p class="lead">已有成片的每一期：发了、暂不发、只是验证，还是待定？</p>'
               '<p class="note-w" id="wnote" hidden></p>'
               '<div class="bar2"><span id="tcnt" class="mute"></span><label class="flt"><input type="checkbox" id="onlyun" checked> 只看未标</label></div>%s</section>' % tick_table(d))
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
    out.append('<script type="application/json" id="eps">%s</script>' % blob)
    out.append("<script>%s</script>" % JS)
    (HERE / "index.html").write_text("\n".join(out) + "\n", encoding="utf-8")
    print("ok: %d 期" % len(eps))

JS = r"""
(async()=>{
const EPS=JSON.parse(document.getElementById("eps").textContent);
const STATES=["已发布","暂不发布","仅验证","待定"];
const CLS={"已发布":"yes","暂不发布":"no","仅验证":"blu","待定":"unk","未标":"out"};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let marks={}, pending={}, canWrite=false, db=null, got=false, offline=false;
const eff=x=>pending[x.id]||(marks[x.id]&&marks[x.id].state)||x.def||"未标";
const byId=Object.fromEntries(EPS.map(x=>[x.id,x]));
const note=$("#wnote");
function showNote(){
  const t=[];
  if(offline||!db)t.push("离线：显示的是默认状态");
  if(!canWrite)t.push("只有你本人能勾选");
  note.textContent=t.join("；");note.hidden=!t.length;
}
function render(){
  const only=$("#onlyun").checked, c={};
  [...STATES,"未标"].forEach(k=>c[k]=0);
  EPS.forEach(x=>{c[eff(x)]++});
  $$("#sum [data-c]").forEach(b=>{b.textContent=c[b.dataset.c]});
  $$(".chip.mk[data-ep]").forEach(ch=>{const s=eff(byId[ch.dataset.ep]);ch.textContent=s;ch.className="chip mk "+CLS[s]});
  let shown=0, tc={};
  const vis={};
  $$("tr.tk").forEach(tr=>{
    const x=byId[tr.dataset.id], s=eff(x), busy=!!tr.dataset.busy;
    tc[s]=(tc[s]||0)+1;
    const ch=tr.querySelector(".now .chip");ch.textContent=s;ch.className="chip mk "+CLS[s];
    tr.querySelectorAll(".seg button").forEach(b=>{
      b.setAttribute("aria-pressed",String(b.dataset.s===s));b.disabled=!canWrite||busy;
    });
    const u=tr.querySelector(".url");u.hidden=s!=="已发布";u.disabled=!canWrite||busy;
    if(document.activeElement!==u)u.value=(marks[x.id]&&marks[x.id].url)||"";
    const hide=only&&s!=="未标"&&!busy&&!tr.dataset.keep;
    tr.hidden=hide;if(!hide){shown++;vis[tr.dataset.g]=1}
  });
  $$("tr.gh").forEach(r=>{r.hidden=!vis[r.dataset.g]});
  $(".tw:has(.tick)").hidden=!shown;$(".empty").hidden=!!shown;
  $("#tcnt").textContent=STATES.concat("未标").map(k=>k+" "+(tc[k]||0)).join(" · ");
  showNote();
}
function flash(tr,t){const el=tr.querySelector(".saved");el.textContent=t;clearTimeout(tr._t);tr._t=setTimeout(()=>{el.textContent=""},t==="已保存"?1500:4000)}
async function write(tr,state,urlOnly){
  const id=tr.dataset.id, old=marks[id], url=(urlOnly??(old&&old.url))||"";
  tr.dataset.busy="1";tr.dataset.keep="1";if(!urlOnly)pending[id]=state;render();
  try{
    const ref=db.doc("marks/"+id);
    if(urlOnly!==undefined&&old)await ref.update({url});
    else await ref.set({state:urlOnly!==undefined?"已发布":state,url,at:new Date().toISOString()});
    marks[id]={state:urlOnly!==undefined?(old?old.state:"已发布"):state,url,at:new Date().toISOString()};
    flash(tr,"已保存");
  }catch(err){flash(tr,"没保存上："+((err&&err.code)||"error"))}
  delete pending[id];delete tr.dataset.busy;render();
  setTimeout(()=>{delete tr.dataset.keep;render()},1500);
}
$$("tr.tk").forEach(tr=>{
  tr.querySelectorAll(".seg button").forEach(b=>b.addEventListener("click",()=>{if(db&&canWrite)write(tr,b.dataset.s)}));
  tr.querySelector(".url").addEventListener("change",ev=>{if(db&&canWrite)write(tr,"已发布",ev.target.value.trim())});
});
$("#onlyun").addEventListener("change",render);
render();
try{
  db=window.claude?.use?await window.claude.use("db"):null;
  if(db){const u=await window.claude.use("user");canWrite=!!(u&&await u.isOwner())}
}catch(err){db=null}
render();
if(db){
  const timer=setTimeout(()=>{if(!got){offline=true;render()}},10000);
  try{
    db.collection("marks").onSnapshot(snap=>{
      got=true;offline=false;clearTimeout(timer);marks={};
      snap.docs.forEach(d=>{const v=d.data();if(d.exists&&v)marks[d.id]=v});
      render();
    },()=>{offline=true;render()});
  }catch(err){offline=true;render()}
}
})();
"""

CSS = """
:root{--bg:#f3f1ec;--card:#fbfaf7;--fg:#24231f;--mute:#6f6c63;--line:#dedad0;--acc:#0f5f63;--acc-bg:#e2eeee;
--yes:#1f6b3a;--yes-bg:#dff0e4;--unk:#8a5a00;--unk-bg:#f8ebc9;--no:#55524a;--no-bg:#e7e4dc;--dot:#cfcabd;--blu:#3d5a73;--blu-bg:#e0e8ef}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#171715;--card:#201f1c;--fg:#ebe8e0;--mute:#9a968a;--line:#35332d;--acc:#5cb8bc;--acc-bg:#1d3637;
--yes:#7fd39a;--yes-bg:#1d3526;--unk:#e6bb5c;--unk-bg:#3a2f14;--no:#b3afa3;--no-bg:#2c2a25;--dot:#3f3c35;--blu:#9db9d1;--blu-bg:#222f3b}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#171715;--card:#201f1c;--fg:#ebe8e0;--mute:#9a968a;--line:#35332d;--acc:#5cb8bc;--acc-bg:#1d3637;
--yes:#7fd39a;--yes-bg:#1d3526;--unk:#e6bb5c;--unk-bg:#3a2f14;--no:#b3afa3;--no-bg:#2c2a25;--dot:#3f3c35;--blu:#9db9d1;--blu-bg:#222f3b}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 "PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif}
.wrap{max-width:1080px;margin:0 auto;padding:24px max(16px,env(safe-area-inset-right,0px)) 40px max(16px,env(safe-area-inset-left,0px))}
h1{margin:0;font-size:28px;color:var(--acc)}h2{font-size:19px;margin:0 0 6px}h3{font-size:16px;margin:0}
.sub{margin:2px 0;color:var(--mute);font-size:13px}.top p{margin:4px 0}
.mute{color:var(--mute);font-size:12px}
.ask{margin:18px 0;padding:14px 16px;border:2px solid var(--acc);border-radius:8px;background:var(--card)}
.ask .cnt{display:inline-block;min-width:26px;padding:0 8px;border-radius:13px;background:var(--acc);color:var(--bg);font-size:14px;text-align:center}
.ask .lead{margin:2px 0 8px;color:var(--mute)}.note-w{margin:4px 0;font-size:12px;color:var(--mute)}
.bar2{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0}
.flt{display:inline-flex;align-items:center;gap:6px;min-height:32px;cursor:pointer}.flt input{width:18px;height:18px}
table.tick{min-width:640px}tr.gh td{background:var(--acc-bg);color:var(--acc);font-weight:600;border-top:1px solid var(--line)}
tr[hidden]{display:none}td.now{min-width:150px}.saved{font-size:12px;color:var(--yes)}
.url{display:block;width:100%;margin-top:4px;min-height:32px;padding:2px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;font-size:12px}
.url[hidden]{display:none}
.seg{display:inline-flex;border:1px solid var(--acc);border-radius:8px;overflow:hidden}
.seg button{min-height:32px;padding:2px 10px;border:0;border-right:1px solid var(--acc);background:transparent;color:var(--acc);font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}
.seg button:last-child{border-right:0}.seg button[aria-pressed="true"]{background:var(--acc);color:var(--bg)}
.seg button:disabled{opacity:.55;cursor:default}
button:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.empty{color:var(--mute)}
.sum{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:22px}
.sum div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 12px}
.sum b{display:block;font-size:24px;color:var(--acc)}.sum span{font-size:12px;color:var(--mute)}
.grp{margin:28px 0}.why-g{margin:0 0 10px;color:var(--mute);font-size:13px}
.line{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px;margin:12px 0}
.line header{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.meta{margin:4px 0;color:var(--fg);font-size:13px}.note{margin:4px 0;font-size:13px}.src{margin:4px 0 8px;font-size:12px;color:var(--mute)}
.chip{display:inline-block;padding:1px 9px;border-radius:10px;font-size:12px;white-space:nowrap}
.chip.yes{background:var(--yes-bg);color:var(--yes)}.chip.unk{background:var(--unk-bg);color:var(--unk)}
.chip.blu{background:var(--blu-bg);color:var(--blu)}.chip.out{border:1px solid var(--line);color:var(--mute)}
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
@media (max-width:520px){.sum{grid-template-columns:repeat(3,1fr)}}
"""
if __name__ == "__main__":
    main()

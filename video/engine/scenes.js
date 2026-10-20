// 视频场景模板：每种场景输出一段 HTML，动画全部用 CSS 写，渲染时按帧拨动时间
// 同一套模板同时支持横屏（16:9 长视频）和竖屏（9:16 Shorts），竖屏由 body.portrait 切换布局

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// 文本里用 *重点* 标高亮，\n 换行
const rich = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
const ms = (s) => Math.round(s * 1000);
const fmt = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const FONT = '"PingFang HK", "Noto Sans TC", "Noto Sans CJK TC", "Source Han Sans TC", "Microsoft JhengHei", "WenQuanYi Zen Hei", sans-serif';

// 两套主题：dark 是深色数据卡；paper 是纸面手绘风（对标「白板动画」类节目），episode.theme 写名字或者覆盖个别颜色
export const THEMES = {
  dark: {
    bg: '#0a1020', bg2: '#1b2a4d', panel: '#121b30', line: '#24324f', text: '#eef2f8', muted: '#8d99b0', accent: '#f5b942',
    // 港股习惯：绿升红跌
    up: '#22c55e', down: '#ef4444', paper: false, font: FONT,
  },
  paper: {
    bg: '#efe9dc', bg2: '#f8f4ea', panel: '#fffdf7', line: '#cbbfa8', text: '#24262b', muted: '#6e675a', accent: '#e8590c',
    up: '#2f9e44', down: '#e03131', paper: true, font: FONT,
  },
};
export const DEFAULT_THEME = THEMES.dark;
export const resolveTheme = (t) => (typeof t === 'string' ? THEMES[t] : { ...THEMES[t?.base || 'dark'], ...t });

export function css(th) {
  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; overflow: hidden; }
body { background: radial-gradient(120% 90% at 85% 0%, ${th.bg2} 0%, ${th.bg} 60%); color: ${th.text}; font-family: ${th.font};
  --pad: 120px; font-size: 44px; --accent: ${th.accent}; --text: ${th.text}; }
body.portrait { --pad: 72px; font-size: 52px; }
em { font-style: normal; color: ${th.accent}; }
.grid-bg { position: absolute; inset: 0; opacity: .25;
  background-image: linear-gradient(${th.line} 1px, transparent 1px), linear-gradient(90deg, ${th.line} 1px, transparent 1px);
  background-size: 80px 80px; mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%); }
.stage { position: absolute; left: var(--pad); right: var(--pad); top: 150px; bottom: 230px; display: flex; flex-direction: column; justify-content: center; }
body.portrait .stage { top: 440px; bottom: 560px; }
.top { position: absolute; left: var(--pad); right: var(--pad); top: 56px; display: flex; justify-content: space-between; align-items: center;
  font-size: 30px; color: ${th.muted}; letter-spacing: 2px; }
.brand { display: flex; align-items: center; gap: 16px; color: ${th.text}; font-weight: 800; letter-spacing: 4px; }
.brand i { width: 14px; height: 40px; background: ${th.accent}; border-radius: 3px; display: block; }
body.portrait .top { top: 110px; font-size: 34px; }
.chap { border: 2px solid ${th.line}; border-radius: 999px; padding: 6px 22px; }
.chap b { color: ${th.accent}; margin-right: 10px; }
.src { position: absolute; left: var(--pad); bottom: 200px; font-size: 24px; color: ${th.muted}; }
body.portrait .src { bottom: 500px; font-size: 28px; }
.sub { position: absolute; left: 0; right: 0; bottom: 70px; text-align: center; font-size: 54px; font-weight: 700; line-height: 1.3;
  color: #fff; text-shadow: 0 3px 0 #000, 0 0 18px #000c; padding: 0 160px; z-index: 5; }
.sub span { background: #000a; padding: 6px 22px; border-radius: 12px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
/* 纸面主题：白字粗黑描边，不要底框 */
body.paper .sub { font-size: 60px; font-weight: 900; -webkit-text-stroke: 10px ${th.text}; paint-order: stroke fill; text-shadow: 0 4px 0 ${th.text}; }
body.paper .sub span { background: none; padding: 0; }
body.bar .sub { bottom: 96px; }
body.portrait.bar .sub { bottom: 330px; }
/* 常驻免责声明条 */
.dbar { position: absolute; left: 0; right: 0; bottom: 0; height: 64px; background: ${th.panel}; border-top: 2px solid ${th.line};
  display: flex; align-items: center; gap: 26px; padding: 0 30px; font-size: 26px; color: ${th.text}; z-index: 6; white-space: nowrap; overflow: hidden; }
.dbar b { flex: none; white-space: nowrap; background: ${th.accent}; color: #fff; padding: 4px 18px; border-radius: 8px; font-size: 24px; }
body.portrait .dbar { height: auto; bottom: 0; padding: 18px 40px 120px; white-space: normal; font-size: 28px; line-height: 1.5; align-items: flex-start; }
/* 纸面主题的手绘边框 */
.frame { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
/* 主持人形象：按音量切换张嘴 / 闭嘴两张图 */
.host { position: absolute; left: 10px; bottom: 0; z-index: 4; }
body.bar .host { bottom: 64px; }
.host img { position: absolute; left: 0; bottom: 0; height: 100%; }
.host .o { visibility: hidden; }
.host.talk .o { visibility: visible; }
.host.talk .c { visibility: hidden; }
.date { color: ${th.text}; font-weight: 800; letter-spacing: 1px; }
/* 有主持人时，数据卡往右让出位置；竖屏把主持人放右上角，标题让开 */
body.hosted:not(.portrait) .stage, body.hosted:not(.portrait) .src { left: calc(var(--hostw) + 40px); }
body.portrait .host { left: auto; right: 30px; top: 150px; bottom: auto; }
body.portrait.hosted .ptitle { right: calc(var(--hostw) + 40px); }
body.portrait .sub { bottom: 330px; font-size: 64px; padding: 0 60px; }
.prog { position: absolute; left: 0; bottom: 0; height: 8px; background: ${th.accent}; z-index: 7; }
.ptitle { display: none; }
body.portrait .ptitle { display: block; position: absolute; left: var(--pad); right: var(--pad); top: 180px; font-size: 72px; font-weight: 900; line-height: 1.2; }

/* 动画：入场时间由 style="animation-delay" 指定 */
.a { opacity: 0; animation: .6s cubic-bezier(.2,.8,.2,1) both; }
.up { animation-name: up; } .pop { animation-name: pop; } .fade { animation-name: fade; } .left { animation-name: left; }
@keyframes up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
@keyframes pop { 0% { opacity: 0; transform: scale(.6); } 70% { opacity: 1; transform: scale(1.06); } 100% { opacity: 1; transform: none; } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes left { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: none; } }
.grow { opacity: 1; transform-origin: left center; animation: grow 1s cubic-bezier(.2,.8,.2,1) both; }
@keyframes grow { from { transform: scaleX(0); } to { transform: none; } }
.draw { animation: draw 1.6s ease-out both; }
@keyframes draw { from { stroke-dashoffset: var(--len); } to { stroke-dashoffset: 0; } }

.kicker { font-size: 34px; color: ${th.accent}; letter-spacing: 6px; margin-bottom: 28px; }
.big { font-size: 150px; font-weight: 900; line-height: 1.12; }
body.portrait .big { font-size: 128px; }
.lead { font-size: 52px; color: ${th.muted}; margin-top: 36px; line-height: 1.5; }
.h { font-size: 76px; font-weight: 900; margin-bottom: 56px; line-height: 1.25; }
body.portrait .h { font-size: 72px; }
.center { align-items: center; text-align: center; }

.items { display: grid; gap: 30px; }
.item { display: flex; gap: 30px; align-items: flex-start; background: ${th.panel}; border: 2px solid ${th.line}; border-radius: 24px; padding: 30px 40px; font-size: 54px; line-height: 1.4; }
.item b { flex: none; width: 64px; height: 64px; border-radius: 16px; background: ${th.accent}; color: ${th.bg}; display: grid; place-items: center; font-size: 36px; }

.num { font-size: 230px; font-weight: 900; color: ${th.accent}; line-height: 1; font-variant-numeric: tabular-nums; }
body.portrait .num { font-size: 180px; }
.num small { font-size: .38em; color: ${th.text}; margin-left: 12px; }
.label { font-size: 48px; color: ${th.muted}; margin-bottom: 30px; }

.bars { display: grid; gap: 34px; }
.bar { display: grid; grid-template-columns: 300px 1fr; align-items: center; gap: 30px; font-size: 42px; }
body.portrait .bar { grid-template-columns: 1fr; gap: 12px; }
.bar .track { position: relative; height: 72px; }
.bar .fill { height: 100%; border-radius: 12px; background: ${th.line}; display: flex; align-items: center; justify-content: flex-end; padding-right: 20px; font-weight: 800; }
.bar.hi .fill { background: ${th.accent}; color: ${th.bg}; }

.chart { width: 100%; height: 520px; }
body.portrait .chart { height: 760px; }
.chart text { fill: ${th.muted}; font-size: 30px; font-family: ${th.font}; }

.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
body.portrait .cols { grid-template-columns: 1fr; gap: 36px; }
.col { background: ${th.panel}; border: 2px solid ${th.line}; border-radius: 28px; padding: 40px 44px; }
.col.hi { border-color: ${th.accent}; }
.col h3 { font-size: 52px; margin-bottom: 26px; color: ${th.accent}; }
.col p { font-size: 42px; line-height: 1.55; margin-top: 12px; }

.flow { position: relative; height: 600px; }
body.portrait .flow { height: 760px; }
body.portrait .node { font-size: 40px; padding: 18px 26px; }
.node { position: absolute; transform: translate(-50%, -50%); background: ${th.panel}; border: 3px solid ${th.accent}; border-radius: 24px;
  padding: 22px 34px; font-size: 42px; font-weight: 800; white-space: nowrap; text-align: center; }
.node small { display: block; font-size: 28px; color: ${th.muted}; font-weight: 400; margin-top: 6px; }
.flow svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }

.quote { font-size: 84px; font-weight: 900; line-height: 1.4; border-left: 14px solid ${th.accent}; padding-left: 56px; }
body.portrait .quote { font-size: 80px; }
.by { font-size: 40px; color: ${th.muted}; margin-top: 40px; padding-left: 70px; }

.cta { font-size: 96px; font-weight: 900; }
.disc { font-size: 30px; color: ${th.muted}; margin-top: 60px; line-height: 1.6; }
`;
}

// 某段文字在口播里第一次出现的位置（0～1），用来让画面跟着口播出现
function cuePos(say, text) {
  const plain = String(text).replace(/\*/g, '');
  for (const len of [6, 4, 3, 2]) {
    const key = [...plain].slice(0, len).join('');
    if (key.length < 2) continue;
    const i = say.indexOf(key);
    if (i >= 0) return i / Math.max(1, say.length);
  }
  return -1;
}

// 依次出现的元素：优先按口播位置对齐，找不到就均匀错开；保证单调递增
function beats(scene, texts, t) {
  const n = texts.length;
  const out = [];
  let last = t.lead;
  texts.forEach((x, i) => {
    let at = scene.beats?.[i] ?? cuePos(scene.say || '', x);
    at = at >= 0 ? t.lead + at * t.speech : t.lead + (i / n) * t.speech * 0.8;
    at = Math.max(at, i === 0 ? t.lead * 0.5 : last + 0.35);
    out.push(at);
    last = at;
  });
  return out;
}

const d = (s) => `style="animation-delay:${ms(s)}ms"`;

// 每个模板：(场景, 时间信息) => HTML
export const TEMPLATES = {
  hook: (s, t) => `<div class="stage">
    ${s.kicker ? `<div class="kicker a fade" ${d(0.1)}>${esc(s.kicker)}</div>` : ''}
    <div class="big a pop" ${d(0.25)}>${rich(s.big)}</div>
    ${s.lead ? `<div class="lead a up" ${d(Math.min(1.4, t.dur * 0.3))}>${rich(s.lead)}</div>` : ''}</div>`,

  title: (s) => `<div class="stage center">
    <div class="kicker a fade" ${d(0.1)}>${esc(s.kicker || '')}</div>
    <div class="big a up" ${d(0.3)} style="font-size:120px">${rich(s.title)}</div>
    ${s.lead ? `<div class="lead a up" ${d(0.9)}>${rich(s.lead)}</div>` : ''}</div>`,

  chapter: (s) => `<div class="stage">
    <div class="kicker a left" ${d(0.1)}>CHAPTER ${esc(String(s.no).padStart(2, '0'))}</div>
    <div class="big a left" ${d(0.3)}>${rich(s.title)}</div>
    ${s.lead ? `<div class="lead a up" ${d(0.8)}>${rich(s.lead)}</div>` : ''}</div>`,

  bullets: (s, t) => {
    const at = beats(s, s.items, t);
    return `<div class="stage"><div class="h a up" ${d(0.1)}>${rich(s.heading)}</div><div class="items">
      ${s.items.map((x, i) => `<div class="item a left" ${d(at[i])}><b>${i + 1}</b><div>${rich(x)}</div></div>`).join('')}</div></div>`;
  },

  number: (s, t) => {
    const start = Math.max(0.3, t.lead);
    return `<div class="stage center">
      <div class="label a fade" ${d(0.1)}>${rich(s.label)}</div>
      <div class="num a pop" ${d(start)}>${esc(s.prefix || '')}<span data-count data-to="${s.value}" data-from="${s.from ?? 0}" data-start="${ms(start)}" data-dur="1400" data-dec="${s.decimals ?? 0}">${fmt(s.value, s.decimals ?? 0)}</span><small>${esc(s.unit || '')}</small></div>
      ${s.note ? `<div class="lead a up" ${d(start + 1.2)}>${rich(s.note)}</div>` : ''}</div>`;
  },

  bars: (s, t) => {
    const max = Math.max(...s.items.map((x) => x.value));
    const at = beats(s, s.items.map((x) => x.label), t);
    return `<div class="stage"><div class="h a up" ${d(0.1)}>${rich(s.heading)}</div><div class="bars">
      ${s.items.map((x, i) => `<div class="bar${x.hi ? ' hi' : ''}"><div class="a fade" ${d(at[i])}>${esc(x.label)}</div>
        <div class="track"><div class="fill grow" style="width:${Math.max(8, (x.value / max) * 100)}%;animation-delay:${ms(at[i])}ms">${esc(x.show ?? fmt(x.value, s.decimals ?? 0))}${esc(s.unit || '')}</div></div></div>`).join('')}
      </div></div>`;
  },

  line: (s, t) => {
    const W = 1600, H = 500, P = 60;
    const vals = s.points.map((p) => p[1]);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const x = (i) => P + (i / (s.points.length - 1)) * (W - 2 * P);
    const y = (v) => H - P - ((v - lo) / (hi - lo || 1)) * (H - 2 * P);
    const pts = s.points.map((p, i) => `${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
    let len = 0;
    for (let i = 1; i < s.points.length; i++) len += Math.hypot(x(i) - x(i - 1), y(vals[i]) - y(vals[i - 1]));
    const start = Math.max(0.4, t.lead);
    const m = s.mark;
    return `<div class="stage"><div class="h a up" ${d(0.1)}>${rich(s.heading)}</div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <polyline points="${pts}" fill="none" stroke="${s.color || 'var(--accent)'}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"
          class="draw" style="--len:${len.toFixed(0)};stroke-dasharray:${len.toFixed(0)};animation-delay:${ms(start)}ms"/>
        ${s.points.map((p, i) => (i === 0 || i === s.points.length - 1 || s.labelsAll ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(p[0])}</text>` : '')).join('')}
        ${m ? `<g class="a fade" ${d(start + 1.6)}><circle cx="${x(m.at)}" cy="${y(vals[m.at])}" r="16" style="fill:var(--accent)"/>
          <text x="${x(m.at)}" y="${y(vals[m.at]) - 34}" text-anchor="middle" style="fill:var(--text);font-size:40px;font-weight:800">${esc(m.text)}</text></g>` : ''}
      </svg></div>`;
  },

  compare: (s, t) => {
    const at = beats(s, [s.left.title, s.right.title], t);
    const col = (c, hi, a) => `<div class="col${hi ? ' hi' : ''} a up" ${d(a)}><h3>${esc(c.title)}</h3>${c.items.map((x) => `<p>${rich(x)}</p>`).join('')}</div>`;
    return `<div class="stage"><div class="h a up" ${d(0.1)}>${rich(s.heading)}</div><div class="cols">${col(s.left, false, at[0])}${col(s.right, true, at[1])}</div></div>`;
  },

  // 资金流向 / 因果链：节点围成一圈（loop）或排成一行，依次出现
  flow: (s, t, portrait) => {
    const n = s.nodes.length;
    const at = beats(s, s.nodes.map((x) => (typeof x === 'string' ? x : x.name)), t);
    const pos = s.nodes.map((_, i) => {
      if (s.loop) {
        const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
        return [50 + Math.cos(ang) * (portrait ? 24 : 34), 50 + Math.sin(ang) * (portrait ? 36 : 38)];
      }
      return portrait ? [50, 10 + (i / (n - 1)) * 80] : [8 + (i / (n - 1)) * 84, 50];
    });
    const edges = s.nodes.map((_, i) => [i, i + 1]).filter(([, j]) => s.loop || j < n).map(([i, j]) => [i, j % n]);
    // 闭合回第一个节点的箭头最后出现
    const arrows = edges.map(([i, j]) => {
      const [x1, y1] = pos[i], [x2, y2] = pos[j];
      // 箭头缩短，避开节点框
      const sh = (a, b, f) => a + (b - a) * f;
      return `<line x1="${sh(x1, x2, 0.22)}%" y1="${sh(y1, y2, 0.22)}%" x2="${sh(x1, x2, 0.78)}%" y2="${sh(y1, y2, 0.78)}%"
        style="stroke:var(--accent)" stroke-width="5" marker-end="url(#ar)" class="a fade" ${d(j === 0 ? at[n - 1] + 0.4 : at[j])}/>`;
    });
    return `<div class="stage"><div class="h a up" ${d(0.1)}>${rich(s.heading)}</div><div class="flow">
      <svg><defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" style="fill:var(--accent)"/></marker></defs>${arrows.join('')}</svg>
      ${s.nodes.map((x, i) => {
        const o = typeof x === 'string' ? { name: x } : x;
        return `<div class="node a pop" style="left:${pos[i][0]}%;top:${pos[i][1]}%;animation-delay:${ms(at[i])}ms">${esc(o.name)}${o.note ? `<small>${esc(o.note)}</small>` : ''}</div>`;
      }).join('')}</div></div>`;
  },

  // 手绘插画：先出线稿、再上色，画笔跟着走；镜头按口播推到插画的某一块，文字由引擎叠上去（AI 出图别带字）
  sketch: (s, t, portrait, ep) => {
    const T = Math.max(t.dur, 1);
    const draw = Math.min(4, Math.max(1.5, T * 0.3));
    const c0 = 0.15, c1 = c0 + draw;
    const color = Math.min(2.5, Math.max(1, T * 0.2));
    const pct = (x) => `${Math.min(100, Math.max(0, (x / T) * 100)).toFixed(2)}%`;
    // 画笔：线稿阶段来回扫 6 次，上色阶段 4 次，然后离场
    const zig = (from, len, n, kf) => {
      for (let k = 0; k <= n; k++) kf.push(`${pct(from + (k / n) * len)} { left: ${(k / n) * 100}%; top: ${k % 2 ? 78 : 22}%; opacity: 1; }`);
    };
    const pen = [`0% { left: 0; top: 22%; opacity: 0; }`, `${pct(c0 - 0.01)} { left: 0; top: 22%; opacity: 0; }`];
    zig(c0, draw, 6, pen);
    zig(c1, color, 4, pen);
    pen.push(`${pct(c1 + color + 0.4)} { left: 108%; top: 60%; opacity: 0; }`, `100% { left: 108%; top: 60%; opacity: 0; }`);
    // 镜头：focus 里每个点在口播说到 key 时推过去，0.9 秒到位；没有 key 就按 at（0～1）
    const cam = ['0% { transform: none; }'];
    let lastTf = 'none';
    for (const f of s.focus || []) {
      const p = f.key ? cuePos(s.say || '', f.key) : f.at ?? 0;
      const at = t.lead + Math.max(0, p) * t.speech;
      const z = f.zoom || 1.6;
      const lim = 50 * (1 - 1 / z);
      const tx = Math.max(-lim, Math.min(lim, 50 - f.x)), ty = Math.max(-lim, Math.min(lim, 50 - f.y));
      const tf = z === 1 ? 'none' : `scale(${z}) translate(${tx.toFixed(1)}%, ${ty.toFixed(1)}%)`;
      cam.push(`${pct(at)} { transform: ${lastTf}; }`, `${pct(at + 0.9)} { transform: ${tf}; }`);
      lastTf = tf;
    }
    cam.push(`100% { transform: ${lastTf}; }`);
    const labels = (s.labels || []).map((l) => {
      const p = l.key ? cuePos(s.say || '', l.key) : l.at ?? -1;
      const at = p >= 0 ? t.lead + p * t.speech : c1;
      return `<div class="lab" style="left:${l.x}%;top:${l.y}%;font-size:${l.size || 64}px;color:${l.color || 'var(--accent)'};--r:${l.rotate ?? -4}deg"><div class="a pop" ${d(at)}>${rich(l.text)}</div></div>`;
    });
    return `<style>
      @keyframes pen { ${pen.join(' ')} }
      @keyframes cam { ${cam.join(' ')} }
      @keyframes wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
      .sk { position: absolute; left: 50%; top: 120px; height: 780px; aspect-ratio: 16 / 9; transform: translateX(-50%); border: 4px solid var(--text);
        border-radius: 48px; overflow: hidden; background: #fffdf7; }
      body.portrait .sk { top: 520px; height: auto; width: calc(100% - 2 * var(--pad)); }
      .sk .cam { position: absolute; inset: 0; transform-origin: 50% 50%; animation: cam ${ms(T)}ms linear both; }
      .sk img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .sk .ln { filter: url(#pencil); clip-path: inset(0 100% 0 0); animation: wipe ${ms(draw)}ms linear ${ms(c0)}ms both; }
      .sk .co { clip-path: inset(0 100% 0 0); animation: wipe ${ms(color)}ms ease-in-out ${ms(c1)}ms both; }
      .sk .lab { position: absolute; transform: translate(-50%, -50%) rotate(var(--r)); font-weight: 900; white-space: nowrap;
        -webkit-text-stroke: 8px #fffdf7; paint-order: stroke fill; }
      .pen { position: absolute; width: 0; height: 0; animation: pen ${ms(T)}ms linear both; z-index: 3; }
      .pen svg { position: absolute; left: -6px; top: -6px; width: 300px; height: 300px; overflow: visible; }
    </style>
    <svg width="0" height="0" style="position:absolute"><filter id="pencil" color-interpolation-filters="sRGB">
      <feColorMatrix type="saturate" values="0"/>
      <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true"/>
      <feComponentTransfer><feFuncR type="linear" slope="-3" intercept="1"/><feFuncG type="linear" slope="-3" intercept="1"/><feFuncB type="linear" slope="-3" intercept="1"/></feComponentTransfer>
    </filter></svg>
    <div class="sk"><div class="cam">
      <img class="ln" src="${s._src}"><img class="co" src="${s._src}">${labels.join('')}
      <div class="pen"><svg viewBox="0 0 300 300"><g transform="rotate(-38 0 0)">
        <path d="M0,0 L18,-10 L18,10 Z" fill="var(--text)"/><rect x="18" y="-16" width="40" height="32" rx="4" fill="#9a3412"/>
        <rect x="58" y="-22" width="230" height="44" rx="10" fill="#fff" stroke="var(--text)" stroke-width="4"/>
        <text x="80" y="12" font-size="30" font-weight="800" fill="var(--text)">${esc(ep.brand)}</text></g></svg></div>
    </div></div>`;
  },

  quote: (s) => `<div class="stage"><div class="quote a left" ${d(0.2)}>${rich(s.text)}</div>${s.by ? `<div class="by a fade" ${d(0.9)}>${esc(s.by)}</div>` : ''}</div>`,

  outro: (s, t, portrait, ep) => `<div class="stage center">
    <div class="cta a pop" ${d(0.2)}>${rich(s.cta)}</div>
    ${s.lead ? `<div class="lead a up" ${d(0.8)}>${rich(s.lead)}</div>` : ''}
    <div class="disc a fade" ${d(1.2)}>${esc(ep.disclaimer)}</div></div>`,
};

// 插画统一风格（英文提示词对多数文生图模型效果更稳）；每张图再接上场景自己的 prompt
export const IMAGE_STYLE = 'Hand-drawn whiteboard sketch illustration, clean black ink outlines, light flat marker coloring, cream paper background, friendly editorial cartoon style, simple shapes, generous white space, 16:9 landscape. Absolutely no text, no letters, no numbers, no logos, no watermark.';

// 场景必填字段，渲染前校验
export const REQUIRED = {
  hook: ['big'], title: ['title'], chapter: ['no', 'title'], bullets: ['heading', 'items'], number: ['label', 'value'],
  bars: ['heading', 'items'], line: ['heading', 'points'], compare: ['heading', 'left', 'right'], flow: ['heading', 'nodes'],
  quote: ['text'], outro: ['cta'], sketch: ['img'],
};

// 封面图（1280×720）：两行大字 + 角标 + 大数字；有主持人抠图（photo）就放右边，人脸封面点击率通常更高；art 是插画，放右半边
export function thumbHTML(ep, th, photo, art) {
  const T = ep.thumb;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(th)}
  body { font-size: 40px; }
  .t { position: absolute; left: 70px; top: 64px; width: ${photo || art ? 760 : 1140}px; z-index: 1; }
  .t .tag { display: inline-block; background: ${th.down}; color: #fff; font-weight: 900; font-size: 46px; padding: 8px 26px; border-radius: 10px; }
  .t .l1, .t .l2 { font-size: 128px; font-weight: 900; line-height: 1.1; text-shadow: ${th.paper ? 'none' : '0 6px 0 #000'}; white-space: nowrap; }
  .t .l1 { margin-top: 26px; } .t .l2 { color: ${th.accent}; }
  .tn { position: absolute; right: 70px; bottom: 56px; font-size: 120px; font-weight: 900; color: #fff; background: ${th.down}; padding: 0 30px; border-radius: 16px; transform: rotate(-3deg); }
  .ph { position: absolute; right: 0; bottom: 0; height: 100%; }
  .chart { position: absolute; right: 40px; top: 60px; width: 520px; height: 420px; opacity: .55; }
  .foot { position: absolute; left: 70px; bottom: 56px; font-size: 40px; }
  .art { position: absolute; right: 40px; top: 40px; width: 600px; height: 640px; object-fit: cover; border: 5px solid ${th.text}; border-radius: 36px; background: #fffdf7; }
  </style></head><body${th.paper ? ' class="paper"' : ''}><div class="grid-bg"></div>
  ${art ? `<img class="art" src="${art}">` : ''}
  ${photo ? `<img class="ph" src="${photo}">` : art ? '' : `<svg class="chart" viewBox="0 0 520 420"><polyline points="0,380 90,330 160,350 240,250 300,270 380,140 430,170 520,20" fill="none" stroke="${th.up}" stroke-width="14" stroke-linejoin="round"/></svg>`}
  <div class="t">${T.tag ? `<span class="tag">${esc(T.tag)}</span>` : ''}<div class="l1">${esc(T.l1)}</div><div class="l2">${esc(T.l2)}</div></div>
  ${T.num ? `<div class="tn">${esc(T.num)}</div>` : ''}
  <div class="foot"><span class="brand"><i></i>${esc(ep.brand)}</span></div></body></html>`;
}

// 一个场景的完整页面；window.__seek(毫秒) 把画面拨到指定时间
// host：{ closed, open, height } 两张图的 data URL；mouth：每帧张不张嘴（0/1 字符串）
export function sceneHTML(ep, th, scene, t, { portrait, cues, chapter, globalStart, total, shortTitle, host, mouth, fps }) {
  const body = TEMPLATES[scene.type](scene, t, portrait, ep);
  const cls = [portrait && 'portrait', th.paper && 'paper', ep.disclaimerBar && 'bar', host && 'hosted'].filter(Boolean).join(' ');
  const frame = th.paper
    ? `<svg class="frame"><filter id="wob"><feTurbulence baseFrequency="0.03" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="7"/></filter>
      <rect x="22" y="22" style="width:calc(100% - 44px);height:calc(100% - 44px)" rx="14" fill="none" stroke="${th.text}" stroke-width="4" filter="url(#wob)"/>
      <rect x="34" y="30" style="width:calc(100% - 64px);height:calc(100% - 58px)" rx="18" fill="none" stroke="${th.text}" stroke-width="2" opacity=".5" filter="url(#wob)"/></svg>`
    : '<div class="grid-bg"></div>';
  const hh = host ? host.height * (portrait ? 0.75 : 1) : 0;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(th)}</style></head>
<body class="${cls}" style="--hostw:${hh}px">${frame}
<div class="top"><span class="brand"><i></i>${esc(ep.brand)}</span><span>${chapter ? `<span class="chap"><b>${String(chapter.no).padStart(2, '0')}</b>${esc(chapter.title)}</span>` : ''}${ep.date && !portrait ? ` <span class="date">稿件日期：${esc(ep.date)}</span>` : ''}</span></div>
${shortTitle ? `<div class="ptitle">${rich(shortTitle)}</div>` : ''}
${body}
${scene.source ? `<div class="src">資料來源：${esc(scene.source)}</div>` : ''}
${host ? `<div class="host" id="host" style="height:${hh}px;width:${hh}px"><img class="c" src="${host.closed}"><img class="o" src="${host.open}"></div>` : ''}
<div class="sub" id="sub"></div>
${ep.disclaimerBar ? `<div class="dbar"><b>風險及免責聲明</b>${esc(ep.disclaimer)}</div>` : ''}
<div class="prog" id="prog"></div>
<script>
// setContent 会复用同一个 JS 环境，全部包在闭包里，避免变量重复声明
(() => {
const CUES = ${JSON.stringify(cues)};
const MOUTH = ${JSON.stringify(mouth || '')}, FPS = ${fps || 30};
const G0 = ${globalStart}, TOTAL = ${total};
const W = innerWidth;
const counters = [...document.querySelectorAll('[data-count]')];
const host = document.getElementById('host');
const fmt = (v, d) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const anims = document.getAnimations();
anims.forEach((a) => a.pause());
// 所有入场动画结束的时间，之后画面只随字幕、嘴型、进度条变化
window.__animEnd = Math.max(0, ...anims.map((a) => { const tm = a.effect.getComputedTiming(); return tm.endTime; }),
  ...counters.map((c) => +c.dataset.start + +c.dataset.dur));
window.__seek = (t) => {
  for (const a of anims) a.currentTime = t;
  for (const c of counters) {
    const p = Math.min(1, Math.max(0, (t - c.dataset.start) / c.dataset.dur));
    const e = 1 - Math.pow(1 - p, 3);
    c.textContent = fmt(+c.dataset.from + (c.dataset.to - c.dataset.from) * e, +c.dataset.dec);
  }
  const s = t / 1000;
  const i = CUES.findIndex((c) => s >= c.start && s < c.end);
  const sub = document.getElementById('sub');
  const txt = i >= 0 ? CUES[i].text : '';
  if (sub.dataset.t !== txt) { sub.dataset.t = txt; sub.innerHTML = txt ? '<span>' + txt.replace(/[&<>]/g, '') + '</span>' : ''; }
  const m = MOUTH[Math.round(s * FPS)] === '1';
  if (host) host.classList.toggle('talk', m);
  const px = Math.round(((G0 + s) / TOTAL) * W / 8) * 8;
  document.getElementById('prog').style.width = px + 'px';
  return i + '|' + px + '|' + (m ? 1 : 0);
};
})();
</script></body></html>`;
}

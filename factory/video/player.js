// 播放器：画面完全由时间 t 决定，逐帧渲染时调用 render(t)。
(() => {
  const $ = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  // 把指定词标红
  const hl = (text, red = []) => {
    let h = esc(text);
    for (const w of red) h = h.split(esc(w)).join(`<span class="red hl">${esc(w)}</span>`);
    return h;
  };
  const ease = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
  const clamp = (x) => Math.min(Math.max(x, 0), 1);

  let D, scenes = [], tabs = [], subNode;

  // 简单的线条图标
  const svg = {
    chopsticks: `<svg width="120" height="70" viewBox="0 0 120 70"><g stroke="#b0281f" stroke-width="7" stroke-linecap="round">
      <line x1="8" y1="58" x2="112" y2="14"/><line x1="8" y1="66" x2="112" y2="36"/></g></svg>`,
    arrowDown: `<svg width="420" height="120" viewBox="0 0 420 120"><g fill="none" stroke="#9a948c" stroke-width="5">
      <path d="M210 0 V40 M210 40 H70 V112 M210 40 H350 V112"/></g></svg>`,
    arrowRight: `<svg width="260" height="40" viewBox="0 0 260 40"><g fill="none" stroke="#b0281f" stroke-width="6" stroke-linecap="round">
      <path d="M10 20 H240 M222 6 L244 20 L222 34"/></g></svg>`,
    church: `<svg width="300" height="330" viewBox="0 0 300 330"><g fill="none" stroke="#1c1916" stroke-width="7" stroke-linejoin="round">
      <path d="M150 10 V60 M128 32 H172"/><path d="M90 140 L150 70 L210 140"/><rect x="100" y="140" width="100" height="70"/>
      <path d="M40 330 V210 H260 V330"/><path d="M130 330 V280 A20 20 0 0 1 170 280 V330"/><circle cx="150" cy="172" r="16"/>
      <path d="M75 240 v40 M225 240 v40"/></g></svg>`,
    house: `<svg width="920" height="300" viewBox="0 0 920 300">
      <g class="home" fill="none" stroke="#1c1916" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
        <path d="M30 150 L145 55 L260 150"/><path d="M60 140 V280 H230 V140"/><path d="M125 280 V215 H165 V280"/><path d="M200 75 V112"/></g>
      <g class="axis" fill="none" stroke="#cfc6b9" stroke-width="4"><path d="M330 40 V270 H890"/></g>
      <g class="ref" style="opacity:0"><path data-keep d="M340 78 H880" stroke="#9a948c" stroke-width="3" stroke-dasharray="10 10" fill="none"/>
        <text x="350" y="62" font-size="26" fill="#6f6a63" font-family="Sans">高点</text></g>
      <g class="price" fill="none" stroke="#b0281f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="345,96 410,84 470,78 530,86 590,118 650,150 720,178 790,196 860,214"/></g>
      <g class="drop" style="opacity:0"><text x="650" y="128" font-size="56" font-weight="900" fill="#b0281f" font-family="Serif">约 −40%</text></g>
    </svg>`,
    casino: `<svg width="260" height="260" viewBox="0 0 260 260"><g fill="none" stroke="#b0281f" stroke-width="7" stroke-linejoin="round">
      <rect x="20" y="80" width="220" height="176"/><rect x="40" y="30" width="180" height="50"/>
      <rect x="62" y="130" width="56" height="56" rx="8"/><rect x="142" y="130" width="56" height="56" rx="8"/>
      <path d="M110 256 V214 H150 V256"/></g><g fill="#b0281f"><circle cx="80" cy="148" r="5"/><circle cx="100" cy="168" r="5"/>
      <circle cx="160" cy="148" r="5"/><circle cx="180" cy="168" r="5"/><circle cx="170" cy="158" r="5"/></g></svg>`,
  };

  // 给 SVG 的线条加 pathLength，渲染时用虚线偏移做「一笔画出来」
  const drawable = (markup) => markup.replace(/<(path|line|rect|circle|polyline)(?=[\s>])(?![^>]*data-keep)/g, '<$1 pathLength="1"');

  function build(el, sc, T, units, actives, firstQuote) {
    // kind：in 浮现、grow 长高、sweep 下划线扫过、count 数字滚动、draw 线条描画、pop 弹出
    const unit = (node, at, kind = 'in', dur = 0.5) => {
      node.classList.add('u');
      const u = { node, at, kind, dur };
      if (kind === 'count') u.tpl = node.textContent;
      if (kind === 'draw') {
        u.parts = [...node.querySelectorAll('[pathLength]')];
        for (const p of u.parts) p.style.strokeDasharray = '1 1';
      }
      units.push(u);
      return node;
    };
    // 元素里的线条描画、红字下划线一并登记
    const draws = (node, at, dur = 1.1) => { if (node.querySelector('svg')) unit(node.querySelector('svg'), at, 'draw', dur); return node; };
    const sweeps = (node, at) => { node.querySelectorAll('.hl').forEach((x) => unit(x, at, 'sweep', 0.6)); return node; };
    const t0 = T(el.at || 0);
    switch (el.t) {
      case 'lead': return unit($('div', 'lead', esc(el.text)), t0);
      case 'p': return unit($('div', 'p', esc(el.text)), t0);
      case 'h': return unit($('div', 'h', hl(el.text, el.red)), t0);
      case 'tag': return unit($('div', 'tag', esc(el.text)), t0);
      case 'note': return unit($('div', 'note', esc(el.text)), t0);
      case 'quote': {
        const w = $('div', 'qwrap' + (firstQuote ? ' m' : ''));
        if (firstQuote) w.appendChild(unit($('div', 'qmark', '“'), t0));
        el.lines.forEach((line, i) => w.appendChild(sweeps(unit($('div', 'quote' + (el.size === 'xl' ? ' xl' : ''), hl(line, el.red)), t0 + i * 0.18), t0 + i * 0.18 + 0.5)));
        return w;
      }
      case 'agenda': {
        const w = $('div', 'agenda');
        el.items.forEach((it, i) => {
          const r = $('div', 'row', `<span class="num">${it.n}</span><span class="ti">${esc(it.title)}</span><span class="su">${esc(it.sub)}</span>`);
          const ti = T(it.at);
          w.appendChild(unit(r, ti));
          const next = el.items[i + 1];
          actives.push({ node: r, from: ti, to: next ? T(next.at) : sc.end });
          sc.preview.push({ tab: i, from: ti, to: next ? T(next.at) : sc.end });
        });
        return w;
      }
      case 'profile': {
        const w = $('div', 'profile');
        w.appendChild(unit($('div', 'head', `<span class="name">${esc(el.name)}</span><span class="role">${esc(el.role)}</span>`), t0));
        let prev = -1, k = 0;
        for (const it of el.items) {
          k = it.at === prev ? k + 1 : 0;
          prev = it.at;
          w.appendChild(unit($('div', 'row', `<span class="y">${esc(it.y)}</span><span class="tx">${esc(it.text)}</span>`), T(it.at) + k * 0.3));
        }
        return w;
      }
      case 'timeline': {
        const w = $('div', 'profile timeline');
        for (const it of el.items) w.appendChild(unit($('div', 'row', `<span class="y">${esc(it.y)}</span><span class="tx">${esc(it.text)}</span>`), T(it.at)));
        return w;
      }
      case 'stats': {
        const w = $('div', 'stats' + (el.big ? ' big' : ''));
        for (const it of el.items) {
          const row = unit($('div', 'it', `<span class="v">${esc(it.value)}</span><span class="l">${esc(it.label)}</span>`), T(it.at));
          unit(row.querySelector('.v'), T(it.at) + 0.1, 'count', 0.9);
          w.appendChild(row);
        }
        return w;
      }
      case 'grid': {
        const w = $('div', 'grid');
        w.style.gridTemplateColumns = `repeat(${el.cols || 2}, 1fr)`;
        el.items.forEach((it, i) => {
          const c = $('div', 'cell', `<div class="n">${esc(it.n)}</div><div class="ti">${esc(it.title)}</div><div class="su">${esc(it.sub)}</div>` +
            (it.from ? `<div class="from">${esc(it.from)}</div>` : ''));
          const ti = T(it.at);
          w.appendChild(unit(c, ti));
          const next = el.items[i + 1];
          actives.push({ node: c, from: ti, to: next ? T(next.at) : sc.end });
        });
        return w;
      }
      case 'ladder': {
        const w = $('div', 'ladder');
        el.items.forEach((it, i) => w.appendChild(unit($('div', 'st', `<span class="ti">${esc(it.title)}</span><span class="su">${esc(it.sub)}</span>`), t0 + i * 0.9)));
        return w;
      }
      case 'fork': {
        const w = $('div', 'fork');
        w.appendChild(unit($('div', 'root', esc(el.root || '造神的故事')), T(0)));
        w.appendChild(draws(unit($('div', '', drawable(svg.arrowDown)), T(0) + 0.3), T(0) + 0.3, 0.8));
        const legs = $('div', 'legs');
        legs.appendChild(unit($('div', 'leg', `<div class="ti">${esc(el.left.title)}</div><div class="su">${esc(el.left.sub)}</div>`), t0));
        legs.appendChild(unit($('div', 'leg', `<div class="ti">${esc(el.right.title)}</div><div class="su">${esc(el.right.sub)}</div>`), T(el.rightAt)));
        w.appendChild(legs);
        return w;
      }
      case 'compare': {
        const w = $('div', 'compare' + (el.accent ? ' accent' : ''));
        for (const [side, cls] of [[el.left, 'l'], [el.right, 'r']]) {
          const col = $('div', 'col ' + cls);
          col.appendChild($('div', 'hd', esc(side.title)));
          const ul = $('ul');
          side.items.forEach((x, i) => ul.appendChild(unit($('li', '', esc(x)), T(side.at) + 0.25 + i * 0.25)));
          col.appendChild(ul);
          w.appendChild(unit(col, T(side.at)));
        }
        return w;
      }
      case 'flow': {
        const w = $('div', 'flow');
        w.appendChild(unit($('div', 'box', esc(el.left)), t0));
        w.appendChild(draws(unit($('div', 'mid', `<b>${esc(el.mid)}</b>${drawable(svg.arrowRight)}`), t0 + 0.8), t0 + 0.8, 0.7));
        w.appendChild(unit($('div', 'box r', esc(el.right)), t0 + 1.4));
        return w;
      }
      case 'bars': {
        const w = $('div', 'bars');
        const hs = [96, 88, 80, 34, 30, 28, 26, 24, 22, 21, 20, 18, 17, 16];
        hs.forEach((h, i) => {
          const b = $('i', i < 3 ? 'top' : '');
          b.style.height = h + '%';
          w.appendChild(unit(b, t0 + i * 0.07, 'grow'));
        });
        w.appendChild(unit($('div', 'cap', '<span>少数头部公司</span><span>大量被冷落的企业（示意）</span>'), t0 + 1));
        return w;
      }
      case 'chips': {
        const w = $('div', 'chips');
        el.items.forEach((x, i) => w.appendChild(draws(unit($('div', 'c', `${drawable(svg.chopsticks)}<b>${esc(x)}</b>`), t0 + i * 0.45), t0 + i * 0.45 + 0.1, 0.6)));
        return w;
      }
      case 'zero': {
        const w = $('div', 'zero');
        const parts = [['chip', '+ 赚'], ['op', '＋'], ['chip minus', '− 亏'], ['op', '≈'], ['res', '0']];
        parts.forEach(([c, x], i) => w.appendChild(unit($('div', c, x), t0 + i * 0.35, c === 'res' ? 'pop' : 'in')));
        return w;
      }
      case 'church': {
        const w = $('div', 'church');
        w.appendChild(draws(unit($('div', 'b', `${drawable(svg.church)}<div class="ti">教堂</div><div class="su">创造价值的地方</div>`), t0), t0, 1.6));
        w.appendChild(draws(unit($('div', 'b', `${drawable(svg.casino)}<div class="ti red">赌场</div><div class="su">附带的成本</div>`), T(el.casinoAt)), T(el.casinoAt), 1.2));
        return w;
      }
      case 'house': {
        // 房子 + 一路下行的房价线
        const w = $('div', 'house', drawable(svg.house));
        const g = (sel) => w.querySelector(sel);
        unit(w, t0);
        unit(g('.home'), t0, 'draw', 1.2);
        unit(g('.axis'), t0 + 0.4, 'draw', 0.8);
        unit(g('.price'), T(el.lineAt), 'draw', 1.6);
        unit(g('.ref'), T(el.lineAt) + 1.2, 'in', 0.5);
        unit(g('.drop'), T(el.lineAt) + 1.5, 'pop', 0.5);
        return w;
      }
      case 'vs': {
        // 柱状对比：柱子长高，数字滚动
        const w = $('div', 'vs');
        const max = Math.max(...el.items.map((x) => x.value));
        el.items.forEach((it, i) => {
          const col = $('div', 'col' + (i === el.items.length - 1 ? ' last' : ''));
          const num = $('div', 'num', `<span>${it.value}</span><small>${esc(el.unit || '')}</small>`);
          const bar = $('i');
          bar.style.height = Math.round((it.value / max) * 100) + '%';
          col.append(num, $('div', 'track'), $('div', 'lb', esc(it.label)));
          col.querySelector('.track').appendChild(bar);
          w.appendChild(unit(col, T(it.at)));
          unit(bar, T(it.at) + 0.1, 'grow', 0.9);
          unit(num.querySelector('span'), T(it.at) + 0.1, 'count', 0.9);
        });
        return w;
      }
      case 'wall': {
        const w = $('div', 'wall');
        let prev = -1, k = 0;
        el.items.forEach((it, i) => {
          k = it.at === prev ? k + 1 : 0;
          prev = it.at;
          const c = $('div', 'w', `<i>${String(i + 1).padStart(2, '0')}</i><span>${esc(it.text)}</span>`);
          w.appendChild(unit(c, T(it.at) + k * 0.4));
        });
        return w;
      }
      case 'sources': {
        const w = $('div', 'sources', `<b>来源</b><br>${D.ep.sources.map(esc).join('<br>')}<br><br>${esc(D.ep.disclaimer)}`);
        return unit(w, t0);
      }
    }
    throw new Error('未知元素 ' + el.t);
  }

  window.init = (data) => {
    D = data;
    const title = document.getElementById('title');
    title.innerHTML = hl(D.ep.title.text, D.ep.title.red);
    const tabsNode = document.getElementById('tabs');
    tabs = D.ep.chapters.map((name, i) => {
      const n = $('div', 'tab', `<div class="mark"></div><div class="n">${String(i + 1).padStart(2, '0')}</div><div class="name">${esc(name)}</div><div class="bar"><i></i></div>`);
      tabsNode.appendChild(n);
      return n;
    });
    subNode = document.getElementById('sub');
    const stage = document.getElementById('stage');
    scenes = D.ep.scenes.map((s, si) => {
      const tm = D.scenes[si];
      const sc = { ...s, ...tm, units: [], actives: [], preview: [] };
      const T = (k) => (k === 0 ? sc.start + 0.25 : sc.beats[k].start - 0.12);
      const node = $('div', 'scene');
      node.appendChild($('div', 'label', esc(s.label)));
      const content = $('div', 'content');
      let firstQuote = !s.end;
      for (const el of s.els) {
        content.appendChild(build(el, sc, T, sc.units, sc.actives, el.t === 'quote' && firstQuote));
        if (el.t === 'quote') firstQuote = false;
      }
      node.appendChild(content);
      stage.appendChild(node);
      sc.node = node;
      return sc;
    });
  };

  window.render = (t) => {
    const sig = [];
    const F = 0.28;
    let cur = scenes[0];
    for (const sc of scenes) {
      const o = Math.min(clamp((t - sc.start) / F), clamp((sc.end + F - t) / F));
      sc.node.style.opacity = o;
      sc.node.style.display = o > 0 ? '' : 'none';
      if (t >= sc.start) cur = sc;
      if (o <= 0) continue;
      sig.push(o.toFixed(2));
      for (const u of sc.units) {
        const e = ease((t - u.at) / u.dur);
        if (u.kind === 'grow') u.node.style.transform = `scaleY(${e})`;
        else if (u.kind === 'sweep') u.node.style.backgroundSize = `${(e * 100).toFixed(1)}% 0.3em`;
        else if (u.kind === 'count') u.node.textContent = u.tpl.replace(/\d+/g, (n) => Math.round(n * e));
        else if (u.kind === 'draw') for (const p of u.parts) p.style.strokeDashoffset = (1 - e).toFixed(3);
        else if (u.kind === 'pop') {
          u.node.style.opacity = e;
          u.node.style.transform = `scale(${(0.6 + 0.4 * e).toFixed(3)})`;
        } else {
          u.node.style.opacity = e;
          u.node.style.transform = `translateY(${((1 - e) * 30).toFixed(1)}px)`;
        }
        sig.push(e.toFixed(3));
      }
      for (const a of sc.actives) {
        const on = t >= a.from && t < a.to;
        a.node.classList.toggle('active', on);
        sig.push(on ? 1 : 0);
      }
    }
    // 章节栏
    const ch = cur.chapter;
    const pv = cur.preview.find((p) => t >= p.from && t < p.to);
    tabs.forEach((tab, i) => {
      const on = ch === i || (pv && pv.tab === i);
      tab.classList.toggle('on', !!on);
      tab.classList.toggle('done', ch != null && i < ch);
      let w = 0;
      if (ch === i) {
        const c = D.chapters[i];
        w = Math.round(clamp((t - c.start) / (c.end - c.start)) * 100);
      }
      tab.querySelector('.bar i').style.width = w + '%';
      sig.push(on ? 1 : 0, w);
    });
    // 字幕
    const s = D.subs.find((x) => t >= x.start && t < x.end);
    const text = s ? s.text : '';
    if (subNode.textContent !== text) subNode.textContent = text;
    sig.push(text);
    return sig.join('|');
  };
})();

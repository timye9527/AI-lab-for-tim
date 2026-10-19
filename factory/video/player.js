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
    for (const w of red) h = h.split(esc(w)).join(`<span class="red">${esc(w)}</span>`);
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
    casino: `<svg width="260" height="260" viewBox="0 0 260 260"><g fill="none" stroke="#b0281f" stroke-width="7" stroke-linejoin="round">
      <rect x="20" y="80" width="220" height="176"/><rect x="40" y="30" width="180" height="50"/>
      <rect x="62" y="130" width="56" height="56" rx="8"/><rect x="142" y="130" width="56" height="56" rx="8"/>
      <path d="M110 256 V214 H150 V256"/></g><g fill="#b0281f"><circle cx="80" cy="148" r="5"/><circle cx="100" cy="168" r="5"/>
      <circle cx="160" cy="148" r="5"/><circle cx="180" cy="168" r="5"/><circle cx="170" cy="158" r="5"/></g></svg>`,
  };

  function build(el, sc, T, units, actives, firstQuote) {
    const unit = (node, at, kind = 'in') => { node.classList.add('u'); units.push({ node, at, kind }); return node; };
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
        el.lines.forEach((line, i) => w.appendChild(unit($('div', 'quote' + (el.size === 'xl' ? ' xl' : ''), hl(line, el.red)), t0 + i * 0.18)));
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
      case 'stats': {
        const w = $('div', 'stats' + (el.big ? ' big' : ''));
        for (const it of el.items) w.appendChild(unit($('div', 'it', `<span class="v">${esc(it.value)}</span><span class="l">${esc(it.label)}</span>`), T(it.at)));
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
        w.appendChild(unit($('div', 'root', '造神的故事'), T(0)));
        w.appendChild(unit($('div', '', svg.arrowDown), T(0) + 0.3));
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
        w.appendChild(unit($('div', 'mid', `<b>${esc(el.mid)}</b>${svg.arrowRight}`), t0 + 0.8));
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
        el.items.forEach((x, i) => w.appendChild(unit($('div', 'c', `${svg.chopsticks}<b>${esc(x)}</b>`), t0 + i * 0.45)));
        return w;
      }
      case 'zero': {
        const w = $('div', 'zero');
        const parts = [['chip', '+ 赚'], ['op', '＋'], ['chip minus', '− 亏'], ['op', '≈'], ['res', '0']];
        parts.forEach(([c, x], i) => w.appendChild(unit($('div', c, x), t0 + i * 0.35)));
        return w;
      }
      case 'church': {
        const w = $('div', 'church');
        w.appendChild(unit($('div', 'b', `${svg.church}<div class="ti">教堂</div><div class="su">创造价值的地方</div>`), t0));
        w.appendChild(unit($('div', 'b', `${svg.casino}<div class="ti red">赌场</div><div class="su">附带的成本</div>`), T(el.casinoAt)));
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
        const e = ease((t - u.at) / 0.5);
        if (u.kind === 'grow') u.node.style.transform = `scaleY(${e})`;
        else {
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

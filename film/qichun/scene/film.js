// 总调度：按配音排好时间轴，每一帧决定哪些画面层可见、交叉淡化，并摆好字幕和文字层。
import * as S from './story.js';
import { build, weight } from './timeline.js';
import { createMap } from './map.js';
import { createInk } from './ink.js';
import { createSmoke, createField, createPottery } from './aux3d.js';

const $ = (s) => document.querySelector(s);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const fade = (t, from, to, r = 0.6) => Math.min(smooth(from, from + r, t), 1 - smooth(to - r, to, t));
function setText(sel, txt) { const e = $(sel); if (e.textContent !== txt) e.textContent = txt; }
function show(el, a) { (typeof el === 'string' ? $(el) : el).style.opacity = a.toFixed(3); }

// 画布上要用到的字（字体按 unicode-range 分片，必须先加载）
const EXTRA = '艾菊薄荷蘄艾【集解】時珍曰……自成化以來則以蘄州者為勝用充方物天下重之謂之蘄艾世界记忆名录2011四宝竹蛇龟蕲艾蕲竹蕲蛇蕲龟笛竹出蘄春白居易—西周唐本草木构建筑为示意，依据毛家咀遗址发掘报告';

async function preloadFonts(all) {
  const fams = ['600 20px "Noto Serif SC"', '400 20px "Noto Serif SC"', '400 20px "Noto Serif TC"', '400 20px "Ma Shan Zheng"', '400 20px "Noto Sans SC"', '500 20px "Noto Sans SC"'];
  await Promise.all(fams.map((f) => document.fonts.load(f, all)));
  await document.fonts.ready;
}

async function main() {
  const [vo, vlines] = await Promise.all([
    fetch('/data/audio/vo/vo.json').then((r) => r.json()),
    fetch('/scene/voiceover.json').then((r) => r.json()),
  ]);
  const TL = build(vo, vlines.lines);
  const items = TL.segments.flatMap((s) => s.items);

  // 画面层：每种模式一块画布
  const stage = $('#layers');
  const mk = (id, ctx2d) => { const c = document.createElement('canvas'); c.id = id; c.width = 1920 * devicePixelRatio; c.height = 1080 * devicePixelRatio; stage.appendChild(c); return c; };
  const L = {
    map: { c: mk('c-map') }, smoke: { c: mk('c-smoke') }, field: { c: mk('c-field') }, pottery: { c: mk('c-pottery') },
    ink: { c: mk('c-ink') }, book: { c: mk('c-book') }, treasures: { c: mk('c-treasures') }, portrait: { c: mk('c-portrait') },
  };
  const mapR = await createMap(L.map.c, $('#labels'), TL);
  L.map.draw = (seg, t, a) => (L.map.out = mapR.render(t, a));
  L.smoke.draw = createSmoke(L.smoke.c);
  L.field.draw = createField(L.field.c);
  L.pottery.draw = createPottery(L.pottery.c);
  for (const k of ['ink', 'book', 'treasures', 'portrait']) L[k].draw = createInk(L[k].c);

  // 文字层
  $('#title h1').textContent = S.title.zh; $('#title h2').textContent = S.title.en;
  $('#title p').textContent = S.title.sub; $('#title p.en').textContent = S.title.subEn;
  $('#credits').innerHTML = S.credits.map((c) => `<div>${c}</div>`).join('');
  $('#eras').innerHTML = S.eras.map((e) => `<span>${e}</span>`).join('');
  const eraEls = [...document.querySelectorAll('#eras span')];
  await preloadFonts(JSON.stringify(S) + JSON.stringify(vlines) + EXTRA + '0123456789,');

  // 胶片颗粒：一张噪声图，每帧换位置
  const grain = $('#grain');
  {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'), img = g.createImageData(512, 512);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rnd() - 0.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    grain.style.backgroundImage = `url(${c.toDataURL()})`;
  }

  function frame(t) {
    // 各层权重
    const active = [];
    for (const [mode, layer] of Object.entries(L)) {
      let best = null, bw = 0;
      for (const s of TL.segments) if (s.mode === mode) { const w = weight(s, t, TL.duration); if (w > bw) { bw = w; best = s; } }
      layer.c.style.display = bw > 0 ? 'block' : 'none';
      layer.c.style.opacity = bw.toFixed(3);
      layer.out = null;
      if (bw > 0) { layer.draw(best, t, bw); active.push([best, bw]); }
      else if (mode === 'map') mapR.render(t, 0);
    }
    // 叠放顺序：权重小的（正在淡入的）放上面
    active.sort((a, b) => b[1] - a[1]).forEach(([s], i) => { L[s.mode].c.style.zIndex = String(i + 1); });
    const cur = TL.segments.find((s) => t >= s.start && t < s.end) || TL.segments[TL.segments.length - 1];
    const cw = weight(cur, t, TL.duration);

    // 字幕：跟配音走
    const it = items.find((i) => t >= i.start - 0.15 && t <= i.end + 0.4);
    if (it) {
      setText('#sub .zh', it.sub); setText('#sub .en', it.en); setText('#sub .src', it.src ? `出处 · ${it.src}` : '');
      show('#sub', fade(t, it.start - 0.15, it.end + 0.4, 0.25));
    } else show('#sub', 0);

    // 片名 / 片尾
    const titleA = Math.max(...TL.segments.filter((s) => s.showTitle).map((s) => fade(t, s.start + 0.6, s.end + 0.6, 1.0) * weight(s, t, TL.duration)));
    show('#title', titleA);
    const creditSeg = TL.segments.find((s) => s.credits);
    const credA = creditSeg ? fade(t, creditSeg.start + 3.2, creditSeg.end + 1, 1.0) : 0;
    show('#credits', credA);
    $('#title').classList.toggle('up', !!creditSeg && t >= creditSeg.start - 1);

    // 顶部：地名和时代刻度
    show('#header', cur.header ? cw : 0);
    const era = cur.era;
    show('#eras', era != null ? 1 : 0);
    eraEls.forEach((e, i) => e.classList.toggle('on', i === era));

    // 地图上的年份、计数器
    const mo = L.map.out || {};
    if (mo.year && mo.year.a > 0) { setText('#year b', mo.year.zh); setText('#year span', mo.year.en); show('#year', mo.year.a * (L.map.c.style.opacity * 1)); } else show('#year', 0);
    if (mo.counter && mo.counter.a > 0) { setText('#counter b', mo.counter.n.toLocaleString('en-US')); show('#counter', mo.counter.a); } else show('#counter', 0);

    const fr = Math.round(t * S.FPS);
    grain.style.backgroundPosition = `${(fr * 137) % 512}px ${(fr * 251) % 512}px`;
    return true;
  }

  window.film = { frame, fps: S.FPS, duration: TL.duration, timeline: TL };
  const q = new URLSearchParams(location.search);
  if (q.has('t')) frame(Number(q.get('t')));
  if (q.has('play')) {
    const t0 = performance.now() - Number(q.get('play') || 0) * 1000;
    const loop = () => { frame((performance.now() - t0) / 1000 % TL.duration); requestAnimationFrame(loop); };
    loop();
  }
  document.body.dataset.ready = '1';
}

main().catch((e) => { document.body.dataset.error = String(e && e.stack || e); console.error(e); });

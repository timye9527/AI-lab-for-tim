// 测试引擎：读取 tests/<id>/config.js，渲染 开场 → 答题 → 结果
import { score, flip } from './score.js';
import { tierIcon } from './icons.js';
import { drawPoster } from './poster.js';

// 测试 id 写在页面任意元素的 data-test 上（一般是 body）
const id = document.querySelector('[data-test]')?.dataset.test;
const test = (await import(`../tests/${id}/config.js`)).default;
const app = document.getElementById('app');

// —— 本地存储（隐私模式下可能抛错，一律兜底）——
const KEY = (k) => `mmt:${id}:${k}`;
const store = {
  get(k, fallback = null) {
    try {
      const v = localStorage.getItem(KEY(k));
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(KEY(k), JSON.stringify(v));
    } catch {
      /* 存不了就算了 */
    }
  },
  del(k) {
    try {
      localStorage.removeItem(KEY(k));
    } catch {
      /* 同上 */
    }
  },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

const fill = (tpl, map) => String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => map[k] ?? '');

// 网络请求一律加超时：有的托管环境请求会一直挂着，不能让页面卡在「验证中」
const withTimeout = (p, ms, fallback) => Promise.race([p.catch(() => fallback), new Promise((r) => setTimeout(() => r(fallback), ms))]);

// 有没有兑换服务：正式服务器的 /healthz 返回 ok；静态托管（预览）没有
const backend = withTimeout(
  fetch('/healthz', { cache: 'no-store' })
    .then((r) => (r.ok ? r.text() : ''))
    .then((t) => t.trim() === 'ok'),
  2500,
  false,
);

// 漏斗计数：只发「哪个测试 + 哪一步」，不带任何个人信息；没有后端就不发
function track(ev) {
  backend.then((ok) => {
    try {
      if (ok) navigator.sendBeacon?.('/api/event', JSON.stringify({ test: test.id, ev }));
    } catch {
      /* 忽略 */
    }
  });
}

// 主题色写进 CSS 变量
for (const [k, v] of Object.entries(test.theme)) document.documentElement.style.setProperty(`--${k}`, v);
document.title = test.title;

const state = {
  answers: store.get('answers', []),
  unlocked: test.paywall.mode === 'none' || !!store.get('unlock'),
};

// 好友邀请：链接带 ?vs=<人格序号(36进制)><段位等级>&n=花名，例如 ?vs=a2，保持链接短
const typeCodes = Object.keys(test.types);
const vsParam = (code, level) => `${typeCodes.indexOf(code).toString(36)}${level}`;
const vs = (() => {
  try {
    const params = new URLSearchParams(location.search);
    // 也接受 #vs51 这种锚点（有的托管环境不传查询参数）
    const raw = String(params.get('vs') || (location.hash.match(/^#vs([0-9a-z]{2,3})$/) || [])[1] || '');
    const code = typeCodes[parseInt(raw.slice(0, 1), 36)];
    const lv = raw.slice(1);
    if (raw && code) {
      const v = { code, level: Number(lv) || 0, nick: (params.get('n') || '').trim().slice(0, 12) || (params.get('vs') ? test.result.anonymous : '你的好友') };
      store.set('vs', v);
      return v;
    }
  } catch {
    /* 参数坏了就当没有 */
  }
  return store.get('vs');
})();
const tierOf = (level) => test.tiers.find((t) => t.level === level);
const vsMap = () => {
  const t = test.types[vs.code];
  return { nick: vs.nick, tier: tierOf(vs.level)?.name || '', name: t.name, alias: t.alias };
};

function go(screen) {
  window.scrollTo(0, 0);
  if (screen === 'intro') renderIntro();
  if (screen === 'quiz') renderQuiz();
  if (screen === 'result') renderResult();
}

// —— 开场 ——
function renderIntro() {
  const needCodeFirst = test.paywall.mode === 'start' && !state.unlocked;
  const hasResult = state.answers.length === test.questions.length;
  app.innerHTML = `
    <section class="intro">
      <p class="kicker">${esc(test.intro.kicker)}</p>
      <h1>${esc(test.intro.headline)}</h1>
      ${vs && test.compare ? `<p class="invite-banner">${esc(fill(test.compare.banner, vsMap()))}</p>` : ''}
      <p class="sub">${esc(test.intro.sub).replace(/\n/g, '<br>')}</p>
      <div class="intro-icons">
        ${[1, 2, 4, 6].map((lv) => `<span class="icon-ring sm">${tierIcon(test.tiers.find((t) => t.level === lv)?.icon, test.theme.accent, test.theme.gold)}</span>`).join('')}
      </div>
      ${needCodeFirst ? `<p class="start-title">${esc(test.paywall.startTitle || test.paywall.title)}</p>${unlockBox()}` : `<button class="btn primary" data-act="start">${esc(test.intro.cta)}</button>`}
      <p class="meta">${esc(test.intro.meta)}</p>
      ${hasResult ? '<button class="btn ghost" data-act="last">查看上次结果</button>' : ''}
      <p class="disclaimer">${esc(test.disclaimer)}</p>
    </section>`;
  // 先付费模式：输对码直接开始答题，少点一次
  bindUnlock(startQuiz);
}

function startQuiz() {
  track('start');
  state.answers = [];
  qi = 0;
  go('quiz');
}

// —— 答题 ——
let qi = 0;
function renderQuiz() {
  const q = test.questions[qi];
  const n = test.questions.length;
  app.innerHTML = `
    <section class="card quiz">
      <div class="quiz-top">
        <span class="brand">${esc(test.brand)}</span>
        <span class="count">${qi + 1}/${n}</span>
      </div>
      <div class="progress"><i style="width:${((qi + 1) / n) * 100}%"></i></div>
      <h2 class="question">${esc(q.q)}</h2>
      <div class="options">
        ${q.options
          .map(
            (o, i) => `
          <button class="option${state.answers[qi] === i ? ' picked' : ''}" data-pick="${i}">
            <span class="letter">${'ABCDEFG'[i]}</span><span>${esc(o.t)}</span>
          </button>`,
          )
          .join('')}
      </div>
      ${qi > 0 ? '<button class="back" data-act="prev">← 上一题</button>' : ''}
    </section>`;
}

// —— 结果 ——
function renderResult() {
  const r = score(test, state.answers);
  const { tier, type } = r;
  const nick = store.get('nick', '');
  const today = new Date();
  const dateText = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  app.innerHTML = `
    <section class="result">
      <p class="kicker">${esc(test.result.kicker)}</p>
      <h1>${esc(test.result.title)}</h1>

      <label class="nick-label" for="nick">${esc(test.result.nicknameLabel)}</label>
      <input id="nick" class="nick" maxlength="12" placeholder="${esc(test.result.nicknamePlaceholder)}" value="${esc(nick)}">
      <div class="chips">${test.result.nicknameChips.map((c) => `<button class="chip" data-chip="${esc(c)}">${esc(c)}</button>`).join('')}</div>

      <article class="tier-card">
        <p class="tc-head">${esc(test.poster.header)}</p>
        <div class="icon-ring">${tierIcon(tier.icon, test.theme.accent, test.theme.gold)}</div>
        <p class="tc-level">Lv.${tier.level}</p>
        <h2 class="tc-name">${esc(tier.name)}</h2>
        <p class="tc-sub">「${esc(tier.sub)}」</p>
        <p class="tc-desc">${esc(tier.desc)}</p>
        <div class="persona">
          <p class="persona-meta">人格底色 ${esc(r.code)} · 匹配度 <b>${r.match}%</b></p>
          <p class="persona-name">${esc(type.name)} · ${esc(type.alias)}</p>
          <p class="persona-era">${esc(type.era)}</p>
          <div class="tags">${type.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
          <p class="lead-dim">主导维度：${esc(r.ranked[0].pole)} · ${esc(r.ranked[0].isPos ? r.ranked[0].dim.posText : r.ranked[0].dim.negText)}</p>
          <p class="persona-quote">“${esc(type.quote)}”</p>
        </div>
        <div class="meters">
          ${Object.entries(test.meters)
            .map(
              ([k, m]) => `
            <div class="meter"><div class="meter-top"><span>${esc(m.label)}</span><b>${r.meters[k]}</b></div>
            <div class="bar"><i style="width:${r.meters[k]}%"></i></div></div>`,
            )
            .join('')}
        </div>
        <div class="tc-foot">
          <p class="tc-nick" id="tc-nick">${esc(nick || test.result.anonymous)}</p>
          <p class="tc-date">${dateText} · ${esc(test.brand)}</p>
        </div>
      </article>

      <p class="tip">${esc(test.result.saveTip)}</p>
      <button class="btn primary" data-act="poster">保存段位卡</button>
      ${test.compare ? `<button class="btn invite" data-act="invite">${esc(test.compare.inviteTitle)}<small>${esc(test.compare.inviteSub)}</small></button>` : ''}

      ${compareBlock(r)}
      ${reportHtml(r)}

      <button class="btn ghost" data-act="retry">重新测一次</button>
      <p class="disclaimer">${esc(test.disclaimer)}</p>
    </section>
    <div class="modal" id="modal" hidden>
      <div class="modal-body">
        <p class="modal-tip">长按图片保存到相册</p>
        <img id="poster-img" alt="段位卡">
        <a class="btn primary" id="poster-dl" download="${esc(test.id)}-段位卡.png">下载图片</a>
        <button class="btn ghost" data-act="close">关闭</button>
      </div>
    </div>
    <div class="modal" id="copy-modal" hidden>
      <div class="modal-body">
        <p class="modal-tip" id="copy-tip">长按全选复制，发给微信好友或群</p>
        <textarea id="copy-text" readonly></textarea>
        <button class="btn ghost" data-act="close">关闭</button>
      </div>
    </div>`;

  app.querySelector('[data-act="invite"]')?.addEventListener('click', () => {
    const nickNow = store.get('nick', '') || test.result.anonymous;
    const link = `${location.origin}${location.pathname}?vs=${vsParam(r.code, tier.level)}&n=${encodeURIComponent(nickNow)}`;
    const text = fill(test.compare.inviteText, { nick: nickNow, tier: tier.name, name: type.name, alias: type.alias, link });
    shareText(text);
    track('invite');
  });

  const nickInput = document.getElementById('nick');
  const setNick = (v) => {
    store.set('nick', v);
    document.getElementById('tc-nick').textContent = v || test.result.anonymous;
  };
  nickInput.addEventListener('input', () => setNick(nickInput.value.trim()));
  app.querySelectorAll('[data-chip]').forEach((b) =>
    b.addEventListener('click', () => {
      nickInput.value = b.dataset.chip;
      setNick(b.dataset.chip);
    }),
  );

  app.querySelector('[data-act="poster"]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = '生成中…';
    try {
      const url = await drawPoster(test, r, store.get('nick', '') || test.result.anonymous, `${dateText} · ${test.brand}`);
      document.getElementById('poster-img').src = url;
      document.getElementById('poster-dl').href = url;
      document.getElementById('modal').hidden = false;
      track('poster');
    } catch (err) {
      console.error(err);
      alert('生成失败，可以直接截图保存');
    }
    btn.disabled = false;
    btn.textContent = '保存段位卡';
  });

  bindUnlock(() => go('result'));
}

// 完整报告：拆成板块，paywall.free 里的免费展示，其余解锁后可见
function sections(r) {
  const { type } = r;
  const trait = (x) => (x.isPos ? x.dim.posTrait : x.dim.negTrait);
  const dims = test.dims
    .map((d) => {
      const pos = r.lean[d.key];
      const left = Math.min(96, Math.max(4, pos));
      return `
      <div class="dim">
        <div class="dim-top"><span>${esc(d.label)}</span></div>
        <div class="dim-row">
          <span class="pole${pos < 50 ? ' on' : ''}">${esc(d.neg)}<small>${esc(d.negText)}</small></span>
          <div class="dim-bar"><i style="left:${left}%"></i></div>
          <span class="pole${pos >= 50 ? ' on' : ''}">${esc(d.pos)}<small>${esc(d.posText)}</small></span>
        </div>
      </div>`;
    })
    .join('');
  const abilities = (test.abilities || [])
    .map((a) => {
      const v = Math.min(98, Math.max(5, Math.round(a.value(r))));
      return `<div class="ab"><span>${esc(a.label)}</span><div class="ab-bar"><i style="width:${v}%"></i></div><b>${v}</b></div>`;
    })
    .join('');
  const layers = ['第一底色', '隐藏天赋', '长期优势']
    .map((title, i) => {
      const x = r.ranked[i];
      if (!x || !trait(x)) return '';
      const t = trait(x);
      const tail = i === 0 ? `这也是你与${esc(type.name)}最接近的一层底色。` : '';
      return `<div class="sub-card"><h4>${title} · ${esc(t.name)}</h4><p>${esc(t.desc)}${tail}</p></div>`;
    })
    .join('');
  const rel = Object.values(test.relations || {})
    .map((rl) => {
      const t = test.types[flip(test, r.code, rl.flip)];
      return `<div class="rel"><p class="rel-label">${esc(rl.label)}</p><p class="rel-name">${esc(t.name)} · ${esc(t.alias)}</p><p class="rel-why">${esc(rl.why)}</p></div>`;
    })
    .join('');
  return [
    { id: 'dims', html: `<div class="card sec"><h3>00 · 四维人格图谱 <span class="code">${esc(r.code)}</span></h3>${dims}</div>` },
    { id: 'portrait', html: `<div class="card sec"><h3>01 · 人物自画像</h3><p>${esc(type.portrait)}</p></div>` },
    abilities && { id: 'abilities', html: `<div class="card sec"><h3>02 · 财商六维</h3><div class="abs">${abilities}</div></div>` },
    { id: 'layers', html: `<div class="card sec"><h3>03 · 你与 TA 的共同底色</h3>${layers}</div>` },
    { id: 'fact', html: `<div class="card sec"><h3>04 · TA 的真实故事</h3><p class="fact">${esc(type.fact)}</p></div>` },
    {
      id: 'blind',
      html: `<div class="card sec"><h3>05 · 盲点与反割建议</h3>
        <div class="sub-card"><h4>可能的盲点</h4><p>${esc(type.moment)}</p></div>
        <div class="sub-card"><h4>反割三条</h4><ol>${type.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></div></div>`,
    },
    { id: 'relations', html: `<div class="card sec"><h3>06 · 搭子与天敌</h3><div class="rels">${rel}</div><p class="hint">点上面「${esc(test.compare?.inviteTitle || '邀请好友来测')}」，看看谁是你的搭子。</p></div>` },
  ].filter(Boolean);
}

function reportHtml(r) {
  const free = test.paywall.free || [];
  const all = sections(r);
  const shown = state.unlocked ? all : all.filter((x) => free.includes(x.id));
  return `${shown.length ? `<section class="report">${shown.map((x) => x.html).join('')}</section>` : ''}${state.unlocked ? '' : locked()}`;
}

// 好友对比（免费，裂变用）
function compareBlock(r) {
  if (!vs || !test.compare) return '';
  const C = test.compare;
  const other = test.types[vs.code];
  const mine = [...r.code];
  const same = [...vs.code].filter((ch, i) => ch === mine[i]).length;
  const buddy = test.relations?.buddy && flip(test, r.code, test.relations.buddy.flip) === vs.code;
  const lv = C.bySame[test.dims.length - same] || C.bySame[C.bySame.length - 1];
  const label = buddy ? test.relations.buddy.label : lv.label;
  const line = buddy ? C.buddyLine : lv.line;
  const diff = vs.level ? r.tier.level - vs.level : null;
  const tierLine = diff === null ? '' : diff > 0 ? fill(C.tierHigher, { n: diff }) : diff < 0 ? fill(C.tierLower, { n: -diff }) : C.tierSame;
  return `
    <section class="card compare">
      <h3>${esc(fill(C.title, { nick: vs.nick }))}</h3>
      <div class="vs-row">
        <div><p class="vs-who">你</p><p class="vs-name">${esc(r.type.name)}</p><p class="vs-code">${esc(r.code)}</p></div>
        <div class="vs-mid"><span>${esc(label)}</span></div>
        <div><p class="vs-who">${esc(vs.nick)}</p><p class="vs-name">${esc(other.name)}</p><p class="vs-code">${esc(vs.code)}</p></div>
      </div>
      <p class="vs-line">${esc(line)}</p>
      ${tierLine ? `<p class="vs-line gold">${esc(tierLine)}</p>` : ''}
    </section>`;
}

// 悬念页：逐条滚动几句梗，再揭晓结果
function renderLoading(done) {
  const lines = test.result.loading || [];
  if (!lines.length) return done();
  window.scrollTo(0, 0);
  app.innerHTML = `
    <section class="loading">
      <div class="icon-ring">${tierIcon('spark', test.theme.accent, test.theme.gold)}</div>
      <p class="loading-line" id="loading-line">${esc(lines[0])}</p>
      <div class="progress"><i id="loading-bar" style="width:0"></i></div>
    </section>`;
  const bar = document.getElementById('loading-bar');
  const text = document.getElementById('loading-line');
  requestAnimationFrame(() => (bar.style.width = '100%'));
  let i = 0;
  const timer = setInterval(() => {
    i++;
    if (i >= lines.length) {
      clearInterval(timer);
      done();
      return;
    }
    text.textContent = lines[i];
  }, 450);
}

// 分享文字：优先系统分享，其次复制，都不行就弹出文本框让用户手动复制
async function shareText(text) {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
  } catch (err) {
    if (err?.name === 'AbortError') return;
  }
  const modal = document.getElementById('copy-modal');
  document.getElementById('copy-text').value = text;
  try {
    await navigator.clipboard.writeText(text);
    document.getElementById('copy-tip').textContent = '已复制，去微信粘贴给好友或群吧';
  } catch {
    document.getElementById('copy-tip').textContent = '长按全选复制，发给微信好友或群';
  }
  modal.hidden = false;
}

function locked() {
  return `
    <section class="card locked">
      <h3>${esc(test.paywall.title)}</h3>
      <ul class="perks">${test.paywall.perks.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      <div class="blurred" aria-hidden="true"><p></p><p></p><p></p></div>
      ${unlockBox()}
    </section>`;
}

function unlockBox() {
  return `
    <form class="unlock" data-unlock>
      <input name="code" autocomplete="off" autocapitalize="characters" placeholder="${esc(test.paywall.placeholder)}">
      <button class="btn primary" type="submit">解锁</button>
      <p class="unlock-msg" data-msg></p>
      <p class="unlock-hint">${esc(test.paywall.hint)}</p>
      <p class="unlock-preview" data-preview hidden>预览版：输入 DEMO 即可体验完整报告</p>
    </form>`;
}

// 静态验码：codesFile 里存的是「测试id:兑换码」SHA-256 的前 12 位，没有服务器也能校验
// 返回 true / false；文件不存在（还没生成码，比如预览）返回 null
let codesPromise;
async function verifyStatic(code) {
  if (!test.paywall.codesFile) return null;
  codesPromise ||= withTimeout(
    fetch(new URL(`../tests/${id}/${test.paywall.codesFile}`, import.meta.url), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (Array.isArray(d?.hashes) ? new Set(d.hashes) : null)),
    4000,
    null,
  );
  const set = await codesPromise;
  if (!set || !crypto?.subtle) return null;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${test.id}:${code}`));
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return set.has(hex.slice(0, 12));
}

function bindUnlock(onDone) {
  const form = app.querySelector('[data-unlock]');
  if (!form) return;
  // 既没有服务器也没有码表，才是预览环境
  Promise.all([backend, verifyStatic('')]).then(([live, table]) => {
    if (isLocal || (!live && table === null)) form.querySelector('[data-preview]').hidden = false;
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = form.code.value.trim().toUpperCase();
    const msg = form.querySelector('[data-msg]');
    if (!code) return;
    msg.textContent = '验证中…';
    try {
      // 校验顺序：服务器接口 → 静态码表 → 预览环境的 DEMO
      const live = await backend;
      const table = live ? null : await verifyStatic(code);
      let ok = (code === 'DEMO' && (isLocal || (!live && table === null))) || table === true;
      if (!ok && !live) {
        msg.textContent = table === false ? '兑换码无效，请检查后再试' : '预览版没有连接兑换服务，输入 DEMO 体验完整报告';
        return;
      }
      if (!ok) {
        const res = await fetch('/api/redeem', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code, test: test.id }),
        });
        const data = await res.json().catch(() => ({}));
        ok = res.ok && data.ok;
        if (!ok) {
          msg.textContent = data.message || '兑换码无效，请检查后再试';
          return;
        }
      }
      store.set('unlock', code);
      track('unlock');
      state.unlocked = true;
      onDone();
    } catch {
      msg.textContent = '网络开小差了，请稍后再试';
    }
  });
}

// —— 全局事件 ——
app.addEventListener('click', (e) => {
  const pick = e.target.closest('[data-pick]');
  if (pick) {
    state.answers[qi] = Number(pick.dataset.pick);
    pick.classList.add('picked');
    setTimeout(() => {
      if (qi < test.questions.length - 1) {
        qi++;
        renderQuiz();
      } else {
        state.answers = state.answers.slice(0, test.questions.length);
        store.set('answers', state.answers);
        track('finish');
        renderLoading(() => go('result'));
      }
    }, 180);
    return;
  }
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'start') startQuiz();
  else if (act === 'prev') {
    qi = Math.max(0, qi - 1);
    renderQuiz();
  } else if (act === 'last') go('result');
  else if (act === 'retry') {
    store.del('answers');
    state.answers = [];
    go('intro');
  } else if (act === 'close') e.target.closest('.modal').hidden = true;
});

track('view');
// 带着好友邀请来的人先看开场页的邀请横幅
go(state.answers.length === test.questions.length && location.hash !== '#intro' && !/^#vs/.test(location.hash) ? 'result' : 'intro');

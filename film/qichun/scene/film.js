// 渲染引擎：读素材、搭场景，按时间 t（秒）摆好镜头和文字。内容全在 story.js。
import * as THREE from 'three';
import * as S from './story.js';

const W = 1920, H = 1080;
const EXAG = 1.6;          // 地形竖向夸张
const BUILDING_H = 6;      // 建筑高度缺失，统一示意（米）
const BG = new THREE.Color('#0c0a08');
const $ = (s) => document.querySelector(s);

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
// 在 [from, to] 内淡入淡出
const fade = (t, from, to, r = 0.6) => Math.min(smooth(from, from + r, t), 1 - smooth(to - r, to, t));

async function load() {
  const [meta, hbuf, bbuf, cbuf] = await Promise.all([
    fetch('/assets/meta.json').then((r) => r.json()),
    fetch('/assets/terrain_h.bin').then((r) => r.arrayBuffer()),
    fetch('/assets/buildings.bin').then((r) => r.arrayBuffer()),
    fetch('/assets/bcent.bin').then((r) => r.arrayBuffer()),
  ]);
  const tl = new THREE.TextureLoader();
  const names = ['terrain', ...Object.keys(meta.patches)];
  const texs = await Promise.all(names.flatMap((n) => [`/assets/${n}_tex.jpg`, `/assets/${n}_mask.png`]).map((u) => tl.loadAsync(u)));
  for (const t of texs) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.minFilter = THREE.LinearMipmapLinearFilter; }
  const patches = names.slice(1).map((n, i) => ({ ext: meta.patches[n], tex: texs[2 + i * 2], mask: texs[3 + i * 2] }));
  return { meta, heights: new Float32Array(hbuf), bbuf, cent: new Float32Array(cbuf), tex: texs[0], mask: texs[1], patches };
}

// 各材质共用的雾和调色
const common = /* glsl */`
  uniform vec3 uBg; uniform float uFogNear; uniform float uFogFar; uniform float uSepia;
  vec3 finish(vec3 col, float d) {
    vec3 sep = vec3(dot(col, vec3(.299, .587, .114))) * vec3(1.08, .96, .78);
    col = mix(col, sep, uSepia);
    return mix(col, uBg, smoothstep(uFogNear, uFogFar, d));
  }`;

function makeTerrain(A, U) {
  const [gw, gh] = A.meta.grid;
  const [X0, Z0, X1, Z1] = A.meta.extent;
  const step = 2; // 隔点取样，控制面数
  const w = Math.floor((gw - 1) / step) + 1, h = Math.floor((gh - 1) / step) + 1;
  const pos = new Float32Array(w * h * 3), uv = new Float32Array(w * h * 2);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i, gi = i * step, gj = j * step;
    pos[k * 3] = X0 + (X1 - X0) * gi / (gw - 1);
    pos[k * 3 + 1] = A.heights[gj * gw + gi];
    pos[k * 3 + 2] = Z0 + (Z1 - Z0) * gj / (gh - 1);
    uv[k * 2] = gi / (gw - 1); uv[k * 2 + 1] = 1 - gj / (gh - 1);
  }
  const idx = new Uint32Array((w - 1) * (h - 1) * 6);
  let n = 0;
  for (let j = 0; j < h - 1; j++) for (let i = 0; i < w - 1; i++) {
    const a = j * w + i, b = a + 1, c = a + w, d = c + 1;
    idx.set([a, c, b, b, c, d], n); n += 6;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: Object.assign(U, {
      uTex: { value: A.tex }, uMask: { value: A.mask },
      uP0: { value: A.patches[0].tex }, uP0m: { value: A.patches[0].mask }, uP0e: { value: new THREE.Vector4(...A.patches[0].ext) },
      uP1: { value: A.patches[1].tex }, uP1m: { value: A.patches[1].mask }, uP1e: { value: new THREE.Vector4(...A.patches[1].ext) },
    }),
    vertexShader: /* glsl */`
      uniform float uExag; varying vec2 vUv; varying vec3 vW;
      void main() {
        vUv = uv; vec3 p = position; p.y *= uExag; vW = p;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uTex; uniform sampler2D uMask; uniform float uTime;
      uniform sampler2D uP0; uniform sampler2D uP0m; uniform vec4 uP0e;
      uniform sampler2D uP1; uniform sampler2D uP1m; uniform vec4 uP1e;
      // 细节贴片：范围内用高清底图，边缘羽化
      void applyPatch(inout vec3 col, inout float wm, sampler2D t, sampler2D m, vec4 e, vec2 p) {
        vec2 q = (p - e.xy) / (e.zw - e.xy);
        float w = smoothstep(0., .12, q.x) * smoothstep(1., .88, q.x) * smoothstep(0., .12, q.y) * smoothstep(1., .88, q.y);
        if (w <= 0.) return;
        q.y = 1. - q.y;
        col = mix(col, texture2D(t, q).rgb, w);
        wm = mix(wm, texture2D(m, q).r, w);
      }
      uniform vec3 uFocus; uniform float uFocusR; uniform float uFocusAmt; uniform float uGround;
      varying vec2 vUv; varying vec3 vW;
      ${common}
      void main() {
        vec3 col = texture2D(uTex, vUv).rgb;
        float wm = texture2D(uMask, vUv).r;
        applyPatch(col, wm, uP0, uP0m, uP0e, vW.xz);
        applyPatch(col, wm, uP1, uP1m, uP1e, vW.xz);
        col *= uGround;
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1. - clamp(V.y, 0., 1.), 3.);
        float ripple = .5 + .5 * sin(vW.x * .004 + vW.z * .003 + uTime * .8) * sin(vW.z * .0021 - uTime * .5);
        col += wm * (vec3(.20, .42, .62) * (.18 + .5 * fres) + vec3(.05, .09, .13) * ripple);
        float fd = distance(vW.xz, uFocus.xz);
        col += vec3(1., .78, .45) * uFocusAmt * (1. - smoothstep(0., uFocusR, fd)) * .22;
        float edge = smoothstep(0., .04, vUv.x) * smoothstep(1., .96, vUv.x) * smoothstep(0., .04, vUv.y) * smoothstep(1., .96, vUv.y);
        col = mix(uBg, col, edge);
        gl_FragColor = vec4(finish(col, distance(cameraPosition, vW)), 1.);
      }`,
  });
  return new THREE.Mesh(g, m);
}

function makeBuildings(A, U) {
  const head = new Uint32Array(A.bbuf, 0, 3);
  const nv = head[0], ni = head[1];
  let off = 12;
  const pos = new Float32Array(A.bbuf, off, nv * 3); off += nv * 12;
  const attr = new Float32Array(A.bbuf, off, nv * 2); off += nv * 8;
  const idx = new Uint32Array(A.bbuf, off, ni);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aB', new THREE.BufferAttribute(attr, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const m = new THREE.ShaderMaterial({
    uniforms: U,
    extensions: { derivatives: true },
    vertexShader: /* glsl */`
      uniform float uExag; uniform float uBH; uniform float uGhostH; uniform float uGrow;
      uniform vec2 uGrowC; uniform float uGrowR;
      attribute vec2 aB; varying vec3 vW; varying float vG; varying float vTop;
      void main() {
        float rr = distance(position.xz, uGrowC) / uGrowR * .85 + fract(aB.y * 137.13) * .15;
        float g = smoothstep(rr, rr + .06, uGrow * 1.06);
        vec3 p = position; p.y = p.y * uExag + 5. + aB.x * mix(uGhostH, uBH, g);
        vW = p; vG = g; vTop = aB.x;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uGhost; varying vec3 vW; varying float vG; varying float vTop;
      ${common}
      void main() {
        vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
        vec3 sun = normalize(vec3(-.5, .8, -.35));
        float l = .45 + .55 * max(dot(n, sun), 0.);
        vec3 white = vec3(.97, .88, .72) * l;
        vec3 ghost = vec3(.86, .76, .60) * l;
        vec3 col = mix(ghost, white, vG);
        col += vec3(1., .75, .4) * vG * (1. - vG) * 2.2;
        float a = mix(uGhost, 1., vG);
        gl_FragColor = vec4(finish(col, distance(cameraPosition, vW)), a);
      }`,
    transparent: true, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  return mesh;
}

function makePoints(A, U) {
  const c = A.cent, n = c.length / 4;
  const g = new THREE.BufferGeometry();
  g.setAttribute('aC', new THREE.BufferAttribute(c, 4));
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uDot: { value: 0 }, uPx: { value: 1 } }, U),
    vertexShader: /* glsl */`
      uniform float uExag; uniform float uGrow; uniform vec2 uGrowC; uniform float uGrowR; uniform float uPx;
      attribute vec4 aC; varying float vG; varying float vD;
      void main() {
        vec4 p4 = vec4(aC.x, aC.y * uExag + 12., aC.z, 1.);
        float r = aC.w;
        float rr = distance(aC.xz, uGrowC) / uGrowR * .85 + fract(r * 137.13) * .15;
        vG = smoothstep(rr, rr + .06, uGrow * 1.06);
        vec4 mv = viewMatrix * p4; vD = -mv.z;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 2.6 * uPx;
      }`,
    fragmentShader: /* glsl */`
      uniform float uDot; uniform float uGhost; varying float vG; varying float vD;
      void main() {
        vec2 q = gl_PointCoord - .5; float a = 1. - smoothstep(.2, .5, length(q));
        float lv = mix(uGhost * .5, 1., vG);
        gl_FragColor = vec4(vec3(1., .82, .55) * a * lv * uDot, 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.renderOrder = 5;
  return pts;
}

function makeLine(paths, color) {
  const P = [], D = [], Sd = [], Uu = [], I = [];
  let base = 0;
  for (const path of paths) {
    let total = 0; const cum = [0];
    for (let i = 1; i < path.length; i++) { total += Math.hypot(path[i][0] - path[i - 1][0], path[i][2] - path[i - 1][2]); cum.push(total); }
    for (let i = 0; i < path.length; i++) {
      const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
      let dx = b[0] - a[0], dz = b[2] - a[2]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
      for (const s of [-1, 1]) { P.push(...path[i]); D.push(dx, dz); Sd.push(s); Uu.push(cum[i]); }
      if (i < path.length - 1) { const k = base + i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    base += path.length * 2;
  }
  // u 统一成全线累计长度 0..1，多段折线一起画
  const maxU = Math.max(...Uu) || 1;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aDir', new THREE.Float32BufferAttribute(D, 2));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(Sd, 1));
  g.setAttribute('aU', new THREE.Float32BufferAttribute(Uu.map((u) => u / maxU), 1));
  g.setIndex(I);
  const m = new THREE.ShaderMaterial({
    uniforms: { uExag: { value: EXAG }, uWidth: { value: 100 }, uProg: { value: 0 }, uAlpha: { value: 0 }, uColor: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */`
      uniform float uExag; uniform float uWidth; attribute vec2 aDir; attribute float aSide; attribute float aU;
      varying float vS; varying float vU;
      void main() {
        vec3 p = position; p.y = p.y * uExag + 30.;
        p.xz += vec2(-aDir.y, aDir.x) * aSide * uWidth * .5;
        vS = aSide; vU = aU;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uProg; uniform float uAlpha; uniform vec3 uColor; varying float vS; varying float vU;
      void main() {
        if (vU > uProg) discard;
        float core = 1. - abs(vS);
        float head = smoothstep(uProg - .03, uProg, vU) * step(uProg, .999);
        vec3 c = uColor * (.55 + .9 * core) + vec3(1.) * head * .8;
        gl_FragColor = vec4(c, uAlpha * (.35 + .65 * core));
      }`,
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  return mesh;
}

// 非均匀 Catmull-Rom：按时间插值镜头参数，速度连续
function interp(keys, t, get) {
  if (t <= keys[0].t) return get(keys[0]);
  const n = keys.length;
  if (t >= keys[n - 1].t) return get(keys[n - 1]);
  let i = 0; while (keys[i + 1].t < t) i++;
  const k0 = keys[i], k1 = keys[i + 1];
  const p0 = get(k0), p1 = get(k1);
  const tan = (j) => {
    if (j <= 0 || j >= n - 1) return p0.map(() => 0);
    const a = get(keys[j - 1]), b = get(keys[j]), c = get(keys[j + 1]);
    return b.map((_, q) => ((c[q] - b[q]) / (keys[j + 1].t - keys[j].t) + (b[q] - a[q]) / (keys[j].t - keys[j - 1].t)) / 2);
  };
  const m0 = tan(i), m1 = tan(i + 1);
  const dt = k1.t - k0.t, u = (t - k0.t) / dt, u2 = u * u, u3 = u2 * u;
  return p0.map((_, q) => (2 * u3 - 3 * u2 + 1) * p0[q] + (u3 - 2 * u2 + u) * dt * m0[q] + (-2 * u3 + 3 * u2) * p1[q] + (u3 - u2) * dt * m1[q]);
}

function camAt(t) {
  const v = interp(S.camera, t, (k) => [k.target[0], k.target[1], k.target[2], Math.log(k.dist), k.az, k.el]);
  const [tx, ty, tz, ld, az, el] = v;
  const d = Math.exp(ld), a = az * Math.PI / 180, e = el * Math.PI / 180;
  return { target: new THREE.Vector3(tx, ty * EXAG, tz), eye: new THREE.Vector3(tx + d * Math.cos(e) * Math.sin(a), ty * EXAG + d * Math.sin(e), tz + d * Math.cos(e) * Math.cos(a)), dist: d };
}

// ---------- 文字层 ----------
function buildDom(meta) {
  $('#header b').textContent = S.header.zh;
  $('#header span').textContent = S.header.en;
  $('#title h1').textContent = S.title.zh;
  $('#title h2').textContent = S.title.en;
  $('#title p').textContent = S.title.sub;
  $('#title p.en').textContent = S.title.subEn;
  $('#credits').innerHTML = S.credits.map((c) => `<div>${c}</div>`).join('');
  $('#timeline .marks').innerHTML = S.eras.map((e, i) => `<span style="left:${(i + .5) / S.eras.length * 100}%">${e.zh}<br>${e.en}</span>`).join('');
  const box = $('#labels');
  const labs = S.labels.map((l) => {
    const el = document.createElement('div');
    el.className = 'lab';
    el.innerHTML = `<i class="stem"></i><i class="dot"></i><div class="box"><b>${l.zh}</b><span>${l.en}</span></div>`;
    box.appendChild(el);
    const p = typeof l.p === 'string' ? meta.points[l.p] : l.p;
    return { ...l, el, v: new THREE.Vector3(p[0], p[1] * EXAG, p[2]) };
  });
  // 预载所有用到的字形（字体按 unicode-range 分片懒加载）
  const all = JSON.stringify(S) + '0123456789,';
  const pre = document.createElement('div');
  pre.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;';
  pre.innerHTML = ['600 20px "Noto Serif SC"', '400 20px "Noto Sans SC"', '500 20px "Noto Sans SC"'].map((f) => `<span style="font:${f}">${all.replace(/[<>&]/g, '')}</span>`).join('');
  document.body.appendChild(pre);
  return labs;
}

function setText(sel, txt) { const e = $(sel); if (e.textContent !== txt) e.textContent = txt; }
function show(sel, a) { $(sel).style.opacity = a.toFixed(3); }

async function main() {
  const A = await load();
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H, false);
  renderer.setClearColor(BG);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, W / H, 10, 1e6);

  const U = {
    uBg: { value: BG }, uFogNear: { value: 1e5 }, uFogFar: { value: 3e5 }, uSepia: { value: 0 },
    uExag: { value: EXAG }, uTime: { value: 0 },
    uFocus: { value: new THREE.Vector3() }, uFocusR: { value: 3000 }, uFocusAmt: { value: 0 }, uGround: { value: 1 },
    uBH: { value: BUILDING_H * EXAG }, uGhostH: { value: 3.0 }, uGrow: { value: 0 }, uGhost: { value: S.buildings.ghost },
    uGrowC: { value: new THREE.Vector2(A.meta.points.caohe[0], A.meta.points.caohe[2]) }, uGrowR: { value: 60000 },
  };
  const terrain = makeTerrain(A, U);
  scene.add(terrain);
  const bld = makeBuildings(A, U);
  bld.renderOrder = 2;
  scene.add(bld);
  const dots = makePoints(A, U);
  scene.add(dots);
  const lines = S.lines.map((l) => { const m = makeLine(A.meta.lines[l.id], l.color); scene.add(m); return { ...l, m }; });
  const labs = buildDom(A.meta);
  await document.fonts.ready;

  const ndc = new THREE.Vector3();
  const total = A.meta.buildings;

  function frame(t) {
    const c = camAt(t);
    cam.position.copy(c.eye); cam.lookAt(c.target);
    cam.near = Math.max(5, c.dist * 0.02); cam.far = c.dist * 10 + 2e5;
    cam.updateProjectionMatrix();
    U.uTime.value = t;
    U.uFogNear.value = c.dist * 1.1; U.uFogFar.value = c.dist * 3.2;
    // 历史段略带旧色，到「今天」恢复
    U.uSepia.value = 0.28 * smooth(25, 29, t) * (1 - smooth(121, 125, t));
    U.uGrow.value = smooth(S.buildings.growFrom, S.buildings.growTo, t);
    U.uGhost.value = S.buildings.ghost;
    // 远景（>2 万米）建筑太小，用光点代替；近景淡出
    dots.material.uniforms.uDot.value = smooth(12000, 40000, c.dist) * 0.9;
    dots.material.uniforms.uPx.value = window.devicePixelRatio;
    // 李时珍段落：雨湖一带微微提亮
    U.uFocus.value.set(-21700, 0, 30900);
    U.uFocusR.value = 2600; U.uFocusAmt.value = fade(t, 80, 109, 2);

    const pxW = c.dist * 2 * Math.tan(cam.fov * Math.PI / 360) / H; // 每像素对应的米数
    for (const l of lines) {
      l.m.material.uniforms.uProg.value = smooth(l.from, l.to, t) * 1.0001;
      const near = l.id === 'border' ? 0.15 + 0.85 * smooth(8000, 30000, c.dist) : 1;
      l.m.material.uniforms.uAlpha.value = fade(t, l.from, l.hold, 1.0) * 0.95 * near;
      l.m.material.uniforms.uWidth.value = l.width * pxW;
    }
    renderer.render(scene, cam);

    // 标签
    for (const l of labs) {
      const a = fade(t, l.from, l.to, 0.7);
      ndc.copy(l.v).project(cam);
      const vis = a > 0.001 && ndc.z < 1;
      l.el.style.display = vis ? 'block' : 'none';
      if (!vis) continue;
      l.el.style.opacity = a.toFixed(3);
      l.el.style.transform = `translate(${((ndc.x + 1) / 2 * W).toFixed(1)}px, ${((1 - ndc.y) / 2 * H).toFixed(1)}px)`;
    }

    // 字幕
    const sub = S.subs.find((s) => t >= s.from - 0.01 && t <= s.to + 0.01);
    if (sub) {
      setText('#sub .zh', sub.zh); setText('#sub .en', sub.en);
      setText('#sub .src', sub.src ? `出处 · ${sub.src}` : '');
      show('#sub', fade(t, sub.from, sub.to, 0.45));
    } else show('#sub', 0);

    // 标题和片尾
    const tIn = fade(t, 2, 8.6, 1.0), tEnd = fade(t, 146, 156.5, 1.2);
    show('#title', Math.max(tIn, tEnd));
    $('#title').style.top = tEnd > 0 ? '250px' : '330px';
    show('#credits', tEnd);
    show('#header', fade(t, 9.5, 145, 1.0));
    show('#datatag', 1 - tEnd);

    // 年份
    const y = S.years.find((s) => t >= s.from && t <= s.to);
    if (y) { setText('#year b', y.zh); setText('#year span', y.en); show('#year', fade(t, y.from, y.to, 0.5)); } else show('#year', 0);

    // 时间轴：游标在时代之间平滑移动
    let pos = 0;
    S.eras.forEach((e, i) => { pos += smooth(e.from - 0.6, e.from + 0.6, t) * (i === 0 ? 0 : 1); });
    const tlA = fade(t, 25, 145, 1.0);
    show('#timeline', tlA);
    $('#timeline .cursor').style.left = `${(pos + .5) / S.eras.length * 100}%`;
    const cur = S.eras[Math.round(pos)] || S.eras[0];
    setText('#timeline .cursor b', cur.zh);

    // 计数器
    const ca = fade(t, S.counter.from, S.counter.to + 3, 0.6);
    show('#counter', ca);
    if (ca > 0) {
      const u = smooth(S.counter.from, S.counter.to, t);
      setText('#counter b', Math.round(total * (1 - Math.pow(1 - u, 3))).toLocaleString('en-US'));
      setText('#counter span', S.counter.label);
    }
    return true;
  }

  window.film = { frame, fps: S.FPS, duration: S.DURATION, U };
  const q = new URLSearchParams(location.search);
  if (q.has('t')) frame(Number(q.get('t')));
  if (q.has('play')) {
    const t0 = performance.now() - Number(q.get('play') || 0) * 1000;
    const loop = () => { frame((performance.now() - t0) / 1000 % S.DURATION); requestAnimationFrame(loop); };
    loop();
  }
  document.body.dataset.ready = '1';
}

main().catch((e) => { document.body.dataset.error = String(e && e.stack || e); console.error(e); });

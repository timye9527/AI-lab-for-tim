// 三个非地图的三维/着色器画面：艾条青烟、黄昏艾田、管窑拉坯。各自一块画布。
import * as THREE from 'three';

import { W, H, VERTICAL } from './format.js';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

function makeRenderer(canvas, clear) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(window.devicePixelRatio); r.setSize(W, H, false); r.setClearColor(clear);
  return r;
}

const NOISE = /* glsl */`
  float hash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 1.7; a *= .5; } return s; }`;

// ---------- 艾条与青烟（全屏着色器） ----------
export function createSmoke(canvas) {
  const renderer = makeRenderer(canvas, '#000');
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const U = { uT: { value: 0 }, uRes: { value: new THREE.Vector2(W * devicePixelRatio, H * devicePixelRatio) }, uV: { value: 0 }, uFade: { value: 1 }, uVert: { value: VERTICAL ? 1 : 0 } };
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: U, vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: /* glsl */`
      uniform float uT; uniform vec2 uRes; uniform float uV; uniform float uFade; uniform float uVert;
      ${NOISE}
      float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h); }
      void main() {
        vec2 p = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
        // 开场：艾条竖在画面下方；艾灸：斜着从右下伸进来
        vec2 tip = mix(vec2(.02, -.2), vec2(-.06, -.12), uV);
        vec2 tail = mix(vec2(.02, -.9), vec2(.75, -.62), uV);
        if (uVert > .5) { tip = mix(vec2(.0, -.12), vec2(-.04, -.08), uV); tail = mix(vec2(.12, -.62), vec2(.3, -.5), uV); }
        vec3 col = mix(vec3(.035, .028, .022), vec3(.07, .05, .035), smoothstep(-.6, .5, -p.y)) * (1. - .5 * length(p));
        // 烟：从艾条头上升，用流动噪声扭出卷曲的烟丝
        vec2 q = p - tip;
        float h = q.y;
        if (h > -.02) {
          float t = uT;
          vec3 w = vec3(q.x * 3.2, q.y * 2.2 - t * .42, t * .12);
          float warp = fbm(w + fbm(w * 1.7 + vec3(0, -t * .3, 0)));
          float x = q.x + (warp - .5) * (.06 + h * .7) + sin(h * 6. - t * 1.3) * .03 * h;
          float width = .012 + h * .19;
          float core = exp(-x * x / (width * width));
          float wisps = smoothstep(.35, .8, fbm(vec3(x * 18., h * 7. - t * .9, t * .2)));
          float d = core * (.35 + .9 * wisps) * smoothstep(-.02, .04, h) * (1. - smoothstep(.55, 1.25, h));
          vec3 smokeCol = mix(vec3(.95, .72, .45), vec3(.62, .64, .66), smoothstep(0., .35, h));
          col += smokeCol * d * .55;
        }
        // 艾条：纸卷，前端烧成灰
        float ds = sdSeg(p, tip, tail) - .028;
        float along = clamp(dot(p - tip, normalize(tail - tip)) / length(tail - tip), 0., 1.);
        vec3 paper = mix(vec3(.78, .70, .55), vec3(.62, .55, .42), noise(vec3(p * 90., 1.)));
        vec3 stickCol = mix(vec3(.18, .17, .16), paper, smoothstep(.02, .05, along));
        stickCol *= .55 + .45 * smoothstep(.03, -.03, ds + .01);
        col = mix(col, stickCol, smoothstep(.004, -.004, ds));
        // 火头：暗红到橙，忽明忽暗
        float flick = .75 + .25 * noise(vec3(uT * 3., 0., 0.));
        float e = length(p - tip);
        col += vec3(1., .32, .08) * exp(-e * e / .00025) * 1.3 * flick + vec3(1., .45, .18) * exp(-e * 14.) * .12 * flick;
        // 火星
        for (int i = 0; i < 6; i++) {
          float fi = float(i), life = fract(uT * .35 + fi * .173);
          vec2 sp = tip + vec2(sin(fi * 7.1 + uT) * .05 * life, life * .35);
          col += vec3(1., .6, .25) * exp(-length(p - sp) * 260.) * (1. - life) * 1.2;
        }
        col *= uFade;
        gl_FragColor = vec4(pow(col, vec3(.95)), 1.);
      }`,
  })));
  return (seg, t) => {
    U.uT.value = t - seg.start + 3; U.uV.value = seg.variant === 'moxa' ? 1 : 0.55;
    U.uFade.value = seg.variant === 'open' ? smooth(seg.start, seg.start + 2.5, t) : 1;
    renderer.render(scene, cam);
  };
}

// ---------- 黄昏艾田：几株艾的逆光特写，背景是失焦的光斑 ----------
export function createField(canvas) {
  const renderer = makeRenderer(canvas, '#000');
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(VERTICAL ? 44 : 32, W / H, 0.02, 50);
  const sunDir = new THREE.Vector3(0.25, 0.18, -1).normalize();
  const U = { uT: { value: 0 }, uSun: { value: sunDir }, uRes: { value: new THREE.Vector2(W * devicePixelRatio, H * devicePixelRatio) } };

  // 背景：暖色天光 + 失焦光斑 + 远处虚化的艾丛
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false, uniforms: U,
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, .999, 1.); }',
    fragmentShader: /* glsl */`
      uniform float uT; uniform vec2 uRes;
      ${NOISE}
      void main() {
        vec2 uv = gl_FragCoord.xy / uRes, p = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
        vec3 c = mix(vec3(.93, .68, .38), vec3(.55, .50, .56), smoothstep(.35, 1.1, uv.y));
        vec2 sun = vec2(.35, .12);
        float d = length(p - sun);
        c += vec3(1., .85, .55) * (exp(-d * 9.) * .9 + exp(-d * 2.5) * .25);
        // 远处艾丛：低频噪声做成的暗色剪影，已经失焦
        float bush = smoothstep(.02, -.06, p.y + .05 - .16 * fbm(vec3(p.x * 2.2 + uT * .02, 2., 0.)));
        c = mix(c, vec3(.36, .33, .22) + vec3(.35, .22, .08) * exp(-d * 3.), bush * .85);
        // 光斑
        for (int i = 0; i < 28; i++) {
          float fi = float(i);
          vec2 q = vec2(fract(sin(fi * 12.9) * 437.5) * 2. - 1., fract(sin(fi * 78.2) * 917.3) * .7 - .35);
          q.x = mod(q.x * .9 + uT * (.006 + .004 * fract(fi * .37)) + 1., 2.) - 1.;
          q.y += sin(uT * .2 + fi) * .02;
          float r = .02 + .05 * fract(fi * .618);
          float b = smoothstep(r, r * .8, length(p - q));
          c += vec3(1., .8, .5) * b * (.06 + .08 * fract(fi * .31)) * (1. - smoothstep(.0, .9, length(q - sun)) * .3);
        }
        gl_FragColor = vec4(c, 1.);
      }`,
  }));
  bg.renderOrder = -1; scene.add(bg);

  // 艾叶：羽状深裂，叶背灰白
  const env = (v) => Math.sin(Math.PI * Math.pow(v, 0.8));
  const lobe = (v) => 1 - 0.82 * Math.exp(-(((v - 0.42) / 0.035) ** 2)) - 0.78 * Math.exp(-(((v - 0.68) / 0.03) ** 2));
  const outline = [];
  for (let i = 0; i <= 60; i++) { const v = i / 60; outline.push([v, env(v) * 0.36 * lobe(v)]); }
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); outline.forEach(([v, w]) => shape.lineTo(v, w)); [...outline].reverse().forEach(([v, w]) => shape.lineTo(v, -w));
  const leafGeo = new THREE.ShapeGeometry(shape, 1);
  { // 叶片沿主脉微微下垂、两侧略卷
    const pa = leafGeo.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setZ(i, -0.25 * x * x + 0.5 * y * y); }
    leafGeo.rotateX(-Math.PI / 2); leafGeo.computeVertexNormals();
  }
  const rnd = (() => { let s = 41; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  const plants = [];
  for (let i = 0; i < 26; i++) plants.push([(rnd() - 0.5) * 3.2, 0.3 - rnd() * 2.4, 0.75 + rnd() * 0.4]);
  const perPlant = 34, n = plants.length * perPlant;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: U,
    vertexShader: /* glsl */`
      uniform float uT; attribute vec4 aP; attribute vec4 aL; varying vec3 vW; varying vec3 vN; varying float vH;
      void main() {
        float hh = aL.x * aP.z;
        float sway = sin(uT * .8 + aP.x * 1.7) * .035 + sin(uT * 1.9 + aP.w) * .012;
        vec3 base = vec3(aP.x + sway * hh * hh, hh, aP.y);
        float ca = cos(aL.y), sa = sin(aL.y), cu = cos(aL.w), su = sin(aL.w);
        vec3 p = position * aL.z; vec3 nn = normal;
        p = vec3(p.x * cu - p.y * su, p.x * su + p.y * cu, p.z); nn = vec3(nn.x * cu - nn.y * su, nn.x * su + nn.y * cu, nn.z);
        p = vec3(p.x * ca - p.z * sa, p.y, p.x * sa + p.z * ca); nn = vec3(nn.x * ca - nn.z * sa, nn.y, nn.x * sa + nn.z * ca);
        p.y += sin(uT * 2.6 + aP.w + aL.x * 7.) * .004;
        vec4 w = modelMatrix * vec4(base + p, 1.);
        vW = w.xyz; vH = aL.x; vN = normalize(nn);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun; varying vec3 vW; varying vec3 vN; varying float vH;
      void main() {
        vec3 V = normalize(cameraPosition - vW);
        vec3 N = gl_FrontFacing ? vN : -vN;
        vec3 top = mix(vec3(.17, .24, .14), vec3(.30, .38, .22), vH);
        vec3 back = vec3(.58, .60, .52);
        vec3 c = (N.y > 0. ? top : back);
        float l = .45 + .55 * max(dot(N, normalize(vec3(-.3, .8, .4))), 0.);
        float trans = pow(max(dot(-V, uSun), 0.), 3.);
        float rim = pow(1. - abs(dot(N, V)), 3.);
        c = c * l + vec3(1., .74, .38) * (trans * .32 + rim * .22);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const leaves = new THREE.InstancedMesh(leafGeo, mat, n);
  const aP = new Float32Array(n * 4), aL = new Float32Array(n * 4);
  plants.forEach(([x, z, h], i) => { const ph = rnd() * 6.28; for (let k = 0; k < perPlant; k++) { const j = i * perPlant + k, u = 0.12 + 0.86 * (k / perPlant); aP.set([x, z, h, ph], j * 4); aL.set([u, k * 2.39996 + ph, 0.2 * (1.25 - u * 0.85) * (0.85 + rnd() * 0.3), 0.15 + u * 0.6], j * 4); } });
  leaves.geometry.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4));
  leaves.geometry.setAttribute('aL', new THREE.InstancedBufferAttribute(aL, 4));
  for (let i = 0; i < n; i++) leaves.setMatrixAt(i, new THREE.Matrix4());
  leaves.frustumCulled = false; scene.add(leaves);
  // 茎
  const stemMat = new THREE.MeshBasicMaterial({ color: "#56553a" });
  for (const [x, z, h] of plants) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.006, h * 0.97, 6), stemMat); st.position.set(x, h * 0.97 / 2, z); scene.add(st); }

  return (seg, t) => {
    const lt = t - seg.start, u = lt / seg.dur;
    U.uT.value = lt + 4;
    if (VERTICAL) { cam.position.set(0.05 + u * 0.4, 1.0, 2.1); cam.lookAt(0.05 + u * 0.4, 0.62, -2.5); }
    else { cam.position.set(-0.7 + u * 0.9, 0.95, 1.25); cam.lookAt(-0.3 + u * 0.7, 0.7, -2.5); }
    renderer.render(scene, cam);
  };
}

// ---------- 管窑拉坯 ----------
export function createPottery(canvas) {
  const renderer = makeRenderer(canvas, '#0d0a08');
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.01, 50);
  const U = { uT: { value: 0 }, uSpin: { value: 0 } };
  // 背景：暗色作坊里一束暖光
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy, .999, 1.); }',
    fragmentShader: 'varying vec2 vU; void main(){ float d = length((vU - vec2(.62, .62)) * vec2(1.6, 1.)); vec3 c = mix(vec3(.30, .19, .11), vec3(.03, .025, .02), smoothstep(0., .9, d)); gl_FragColor = vec4(c, 1.); }',
  }));
  bg.renderOrder = -1; scene.add(bg);

  const clayMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'varying vec3 vN; varying vec3 vW; varying vec2 vU; void main(){ vN = normalize(normalMatrix * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vU = uv; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */`
      uniform float uT; uniform float uSpin; varying vec3 vN; varying vec3 vW; varying vec2 vU;
      ${NOISE}
      void main() {
        vec3 N = normalize(vN);
        // 拉坯留下的一圈圈指痕
        float ring = sin(vW.y * 260. + sin(vU.x * 6.283) * .5) * .5 + .5;
        N = normalize(N + vec3(0., (ring - .5) * .35, 0.));
        vec3 V = normalize(cameraPosition - vW);
        vec3 L1 = normalize(vec3(.6, .7, .5)), L2 = normalize(vec3(-.8, .3, -.6));
        float streak = noise(vec3(vU.x * 40. + uSpin, vW.y * 30., 1.));
        vec3 base = mix(vec3(.42, .22, .12), vec3(.56, .32, .19), streak * .6 + ring * .2);
        float diff = max(dot(N, L1), 0.) * .9 + .12;
        float spec = pow(max(dot(N, normalize(L1 + V)), 0.), 60.) * .9;
        float rim = pow(1. - max(dot(N, V), 0.), 3.) * .6;
        vec3 c = base * diff + vec3(1., .86, .7) * spec + vec3(1., .7, .45) * rim * max(dot(N, L2) + .5, 0.);
        gl_FragColor = vec4(pow(c, vec3(.92)), 1.);
      }`,
  });
  let pot = new THREE.Mesh(new THREE.BufferGeometry(), clayMat);
  scene.add(pot);
  // 轮盘
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.33, 0.04, 96), new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'varying vec3 vP; varying vec3 vN; void main(){ vP = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uSpin; varying vec3 vP; varying vec3 vN; void main(){ float a = atan(vP.z, vP.x) + uSpin; float r = length(vP.xz); float m = .5 + .5 * sin(a * 3.) * smoothstep(.1, .3, r); vec3 c = mix(vec3(.18,.12,.08), vec3(.32,.2,.12), m * .4) * (vN.y > .5 ? 1. : .5); gl_FragColor = vec4(c, 1.); }',
  }));
  wheel.position.y = -0.02; scene.add(wheel);

  // 器形：从一团泥慢慢拉成罐
  function profile(u) {
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const v = i / 48;
      const lump = 0.16 * Math.sqrt(Math.max(0, 1 - Math.pow(v * 1.05, 2)) ) + 0.02;
      const jar = 0.075 + 0.07 * Math.sin(Math.PI * Math.min(1, v * 1.1)) - 0.04 * smooth(0.75, 0.9, v) + 0.035 * smooth(0.9, 1, v);
      const r = lump * (1 - u) + jar * u;
      const h = (0.12 * (1 - u) + 0.34 * u) * v;
      pts.push(new THREE.Vector2(Math.max(0.004, r), h));
    }
    // 内壁
    const inner = [];
    for (let i = 48; i >= 4; i--) { const p = pts[i]; inner.push(new THREE.Vector2(Math.max(0.002, p.x - 0.008 - 0.06 * (1 - u)), Math.max(0.01, p.y - 0.005))); }
    return [...pts, ...inner];
  }

  return (seg, t) => {
    const lt = t - seg.start, u = smooth(0.5, seg.dur * 0.85, lt);
    U.uT.value = lt; U.uSpin.value = lt * 9;
    pot.geometry.dispose();
    pot.geometry = new THREE.LatheGeometry(profile(u), 96);
    pot.rotation.y = -lt * 9;
    const a = 0.25 + lt * 0.03;
    const R = VERTICAL ? 1.45 : 0.95;
    cam.position.set(Math.sin(a) * R, (VERTICAL ? 0.42 : 0.34) - lt * 0.006, Math.cos(a) * R);
    cam.lookAt(0, 0.13, 0);
    renderer.render(scene, cam);
  };
}

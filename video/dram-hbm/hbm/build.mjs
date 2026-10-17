// Fig 1：一颗 AI 芯片上的 HBM —— 8 颗 HBM4 围着两颗计算芯片，最近的一颗拆成 12 层 DRAM + 1 层逻辑底座
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../../.claude/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 600;
const HEIGHT = 405;

// 世界单位：水平约 1 单位 = 0.5 mm 级别的示意，纵向放大
const PLATE = { x: -124, y: -112, w: 248, d: 236, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const FRAME_OUT = { x: -96, y: -88, w: 192, d: 176, r: 3 };
const FRAME_H = 7;
const SUB = { x: -86, y: -78, w: 172, d: 156, r: 2 };
const SUB_H = 5;
const STIFF = k.insetPlan(SUB, 3);
const STIFF_W = 8;
const STIFF_H = 4;
const INTER = { x: -62, y: -57, w: 124, d: 114, r: 1 };
const INTER_TOP = SUB_H + 3;
const BASE_H = 3;
const LAYER_T = 1.5;
const LAYERS = 12;
const STACK_TOP = INTER_TOP + BASE_H + LAYERS * LAYER_T;
const DIES = [{ x: -58, y: -33, w: 56, d: 66, r: 0.8 }, { x: 2, y: -33, w: 56, d: 66, r: 0.8 }];
const STACK_X = [-58, -28, 2, 32];
const STACK_W = 26;
const STACK_D = 19;
const ROWS = [-55, 36];
const PICK = { x: 32, y: 36, w: STACK_W, d: STACK_D, r: 0.6 };
const GAP = 9.6;
// 数据：按英伟达 Rubin 公布的 8 颗 HBM4、共 288 GB；12 层堆叠时每层 24 Gb
const GB_TOTAL = 288;
const STACKS = 8;
const GB_STACK = GB_TOTAL / STACKS;
const GBIT_LAYER = (GB_STACK * 8) / LAYERS;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PICK.x, PICK.y, STACK_TOP + LAYERS * GAP + 2], [PICK.x + PICK.w, PICK.y + PICK.d, STACK_TOP + LAYERS * GAP + 2]],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 58 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depthXY = (x, y, z = 0) => k.depthOf([x, y, z], P);
const byDepth = (list, centre) => [...list].sort((a, b) => depthXY(...centre(a)) - depthXY(...centre(b)));

function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22), (p) => p)) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(PLATE, -PLATE_H + 3, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // 刻度尺
  const strip = { x: -48, y: 104, w: 150, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // 铭牌
  const label = { x: -104, y: 98, w: 44, d: 14, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(L([[label.x + 5, 30], [label.x + 5, 22], [label.x + 5, 26]].map(([x, len], i) => k.lineOnTop([x, label.y + 4 + i * 3], [x + len, label.y + 4 + i * 3], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + label.w - 3.4, label.y + 3.4, 0.8]), at([label.x + label.w - 3.4, label.y + label.d - 3.4, 0.8])], { size: 0.45 }));
  return out.join("");
}

// 插座框：四根边条，远的先画、近的后画
const FRAME_BARS = {
  back: { x: FRAME_OUT.x, y: FRAME_OUT.y, w: FRAME_OUT.w, d: SUB.y - FRAME_OUT.y, r: 1 },
  left: { x: FRAME_OUT.x, y: SUB.y, w: SUB.x - FRAME_OUT.x, d: SUB.d, r: 0.5 },
  right: { x: SUB.x + SUB.w, y: SUB.y, w: FRAME_OUT.x + FRAME_OUT.w - SUB.x - SUB.w, d: SUB.d, r: 0.5 },
  front: { x: FRAME_OUT.x, y: SUB.y + SUB.d, w: FRAME_OUT.w, d: FRAME_OUT.y + FRAME_OUT.d - SUB.y - SUB.d, r: 1 },
};
function frameBar(name) {
  const plan = FRAME_BARS[name];
  const out = [S(k.slabOf(plan, 0, FRAME_H, P, 3, 0.5), { tone: "mid" })];
  const long = plan.w > plan.d;
  const mid = long ? [plan.x + plan.w / 2, plan.y + plan.d / 2] : [plan.x + plan.w / 2, plan.y + plan.d / 2];
  const holes = long ? [-60, -20, 20, 60].map((dx) => [mid[0] + dx, mid[1]]) : [-50, 0, 50].map((dy) => [mid[0], mid[1] + dy]);
  out.push(L(holes.map(([x, y]) => k.ring(x, y, 1.6, FRAME_H, P, 14)).join(""), { tone: "lo" }));
  out.push(D(holes.map(([x, y]) => at([x, y, FRAME_H])), { size: 0.42 }));
  return out.join("");
}
// 四角压块 + 滚花螺丝
function clamp([x, y]) {
  const out = [S(k.slabOf({ x: x - 8, y: y - 8, w: 16, d: 16, r: 2 }, FRAME_H, 4, P, 4, 0.5), { tone: "mid" })];
  out.push(S(k.cylinder(x, y, 4, FRAME_H + 4, 3.6, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 4, FRAME_H + 4, FRAME_H + 7.6, 30, P), { tone: "lo" }));
  out.push(L(k.ring(x, y, 1.6, FRAME_H + 7.6, P, 14), { tone: "lo" }));
  return out.join("");
}
const CLAMPS = [[-91, -83], [91, -83], [-91, 83], [91, 83]];

function substrate() {
  const out = [S(k.slabOf(SUB, 0, SUB_H, P, 3, 0.6), { tone: "mid" })];
  return out.join("");
}
const STIFF_BARS = {
  back: { x: STIFF.x, y: STIFF.y, w: STIFF.w, d: STIFF_W, r: 0.8 },
  left: { x: STIFF.x, y: STIFF.y + STIFF_W, w: STIFF_W, d: STIFF.d - 2 * STIFF_W, r: 0.3 },
  right: { x: STIFF.x + STIFF.w - STIFF_W, y: STIFF.y + STIFF_W, w: STIFF_W, d: STIFF.d - 2 * STIFF_W, r: 0.3 },
  front: { x: STIFF.x, y: STIFF.y + STIFF.d - STIFF_W, w: STIFF.w, d: STIFF_W, r: 0.8 },
};
const stiffBar = (name) => S(k.slabOf(STIFF_BARS[name], SUB_H, STIFF_H, P, 3, 0.4), { tone: "mid" });

// 去耦电容：两端金属、中间陶瓷
const CAPS = [];
for (let x = -54; x <= 54; x += 12) CAPS.push({ x, y: -61.5, along: "x" }, { x, y: 61.5, along: "x" });
for (let y = -46; y <= 46; y += 11.5) CAPS.push({ x: -68.5, y, along: "y" }, { x: 68.5, y, along: "y" });
function cap({ x, y, along }) {
  const [L0, W0, H0] = [6, 3, 1.8];
  const plan = (from, to) => (along === "x" ? { x: x - L0 / 2 + from, y: y - W0 / 2, w: to - from, d: W0, r: 0.3 } : { x: x - W0 / 2, y: y - L0 / 2 + from, w: W0, d: to - from, r: 0.3 });
  const parts = [[0, 1.2, "hi"], [1.2, L0 - 1.2, "lo"], [L0 - 1.2, L0, "hi"]];
  // 远端先画
  const ordered = along === "x" ? parts : parts;
  return ordered.map(([a, b, tone]) => S(k.slabOf(plan(a, b), SUB_H, H0, P, 2), { tone, crease: "none" })).join("");
}

function interposer() {
  const out = [S(k.slabOf(INTER, SUB_H, INTER_TOP - SUB_H, P, 3, 0.5), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(INTER, 1.6), INTER_TOP, P, 3), { tone: "faint" }));
  return out.join("");
}

function computeDie(plan) {
  const top = STACK_TOP;
  const out = [S(k.slabOf(plan, INTER_TOP, top - INTER_TOP, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(plan, INTER_TOP + 2, P, 3), { tone: "faint" }) })];
  out.push(L(k.planOutline(k.insetPlan(plan, 3), top, P, 3), { tone: "faint" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 5), top, P, 3), { tone: "faint" }));
  out.push(D(k.corners(plan, 7).map(([x, y]) => at([x, y, top])), { size: 0.45, tone: "lo" }));
  return out.join("");
}

// 一颗静止的 HBM 堆栈：逻辑底座 + 12 层 DRAM（侧面每层一道缝）
function stack(plan) {
  const out = [S(k.slabOf(plan, INTER_TOP, BASE_H, P, 2, 0.3), { tone: "mid", crease: "lo" })];
  const seams = [];
  for (let i = 1; i < LAYERS; i++) seams.push(k.sideSeam(plan, INTER_TOP + BASE_H + i * LAYER_T, P, 2));
  out.push(S(k.slabOf(plan, INTER_TOP + BASE_H, LAYERS * LAYER_T, P, 2, 0.4), { tone: "hi", crease: "lo", inner: L(seams.join(""), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(plan, 2.4), STACK_TOP, P, 2), { tone: "faint" }));
  return out.join("");
}

// 被拆开的那一颗：每层一个 <g>，live 代码只改 transform
const BUMPS = (z) => k.dotGrid(PICK.x + 3.4, PICK.y + PICK.d / 2 - 2.4, 9, 3, 2.4, z, P);
function pickBase() {
  const out = [S(k.slabOf(PICK, INTER_TOP, BASE_H, P, 2, 0.3), { tone: "mid", crease: "lo" })];
  out.push(D(BUMPS(INTER_TOP + BASE_H), { size: 0.42, tone: "mid" }));
  return out.join("");
}
function pickLayer(i) {
  const z = INTER_TOP + BASE_H + (i - 1) * LAYER_T;
  const top = z + LAYER_T;
  const out = [S(k.slabOf(PICK, z, LAYER_T, P, 2, 0.3), { tone: "hi", crease: "lo", lit: true })];
  if (i < LAYERS) out.push(D(BUMPS(top), { size: 0.42, tone: "mid" }));
  else out.push(L(k.planOutline(k.insetPlan(PICK, 2.4), top, P, 2), { tone: "faint" }));
  return out.join("");
}

const others = [];
for (const y of ROWS) for (const x of STACK_X) if (!(x === PICK.x && y === PICK.y)) others.push({ kind: "stack", plan: { x, y, w: STACK_W, d: STACK_D, r: 0.6 } });
const onInterposer = byDepth([...others, ...DIES.map((plan) => ({ kind: "die", plan }))], (item) => [item.plan.x + item.plan.w / 2, item.plan.y + item.plan.d / 2]);

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "一颗 AI 加速器封装放在测试台上：中间两颗计算芯片，两侧共 8 颗 HBM 内存堆栈，都立在同一块硅中介层上。最近的一颗 HBM 可以拆开：底下是一层逻辑底座，上面叠着 12 层 DRAM 芯片，层与层之间靠一排排微凸点和硅通孔连接。",
  body: [
    bench(),
    frameBar("back"),
    frameBar("left"),
    substrate(),
    stiffBar("back"),
    stiffBar("left"),
    byDepth(CAPS, (c) => [c.x, c.y]).map(cap).join(""),
    interposer(),
    onInterposer.map((item) => (item.kind === "die" ? computeDie(item.plan) : stack(item.plan))).join(""),
    stiffBar("right"),
    stiffBar("front"),
    frameBar("right"),
    frameBar("front"),
    byDepth(CLAMPS, (p) => p).map(clamp).join(""),
    `<g data-part="base">${pickBase()}</g>`,
    Array.from({ length: LAYERS }, (_, n) => `<g data-layer="${n + 1}">${pickLayer(n + 1)}</g>`).join(""),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const LAYERS = ${LAYERS}, GAP = ${GAP}, GB_TOTAL = ${GB_TOTAL}, STACKS = ${STACKS}, GB_STACK = ${GB_STACK}, GBIT_LAYER = ${GBIT_LAYER};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const layers = [...svg.querySelectorAll("[data-layer]")];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
// 每层一个弹簧；拆开时上层先走，合拢时下层先走，层序永不交错
const springs = layers.map(() => ({ at: 0, rate: 0, target: 0, wait: 0 }));
let open = false, frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idleTimer = 0, said = "";
const STAGGER = 0.045;
function setOpen(next) {
  if (next === open) return;
  open = next;
  springs.forEach((s, i) => { s.target = open ? 1 : 0; s.wait = (open ? LAYERS - 1 - i : i) * STAGGER; });
  stage.setAttribute("aria-valuetext", open ? "已拆开：12 层 DRAM 加 1 层逻辑底座" : "合拢：8 颗 HBM4");
  stage.setAttribute("aria-valuenow", open ? "1" : "0");
  run();
}
function textOf() {
  const moving = springs.some((s) => s.at !== s.target);
  if (moving) return open ? "拆开中…" : "合拢中…";
  if (open) return "1 颗 = " + LAYERS + " 层 × " + GBIT_LAYER + " Gb = " + GB_STACK + " GB";
  return STACKS + " 颗 HBM4 · 共 " + GB_TOTAL + " GB";
}
function draw() {
  springs.forEach((s, i) => layers[i].setAttribute("transform", translateAlong(P, [0, 0, (i + 1) * GAP * s.at])));
  const text = textOf();
  if (text !== said) { readout.textContent = text; said = text; }
}
const tourAt = (t) => (t % 6.4) < 3.2;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { clock += dt; setOpen(clock > 1.4 && tourAt(clock - 1.4)); }
  let settled = true;
  for (const s of springs) {
    if (calm) { s.at = s.target; s.rate = 0; s.wait = 0; continue; }
    if (s.wait > 0) { s.wait -= dt; settled = false; continue; }
    const stiff = 90, drag = 2 * Math.sqrt(90);
    for (let n = 0; n < 4; n++) { s.rate += ((s.target - s.at) * stiff - s.rate * drag) * dt / 4; s.at += s.rate * dt / 4; }
    if (Math.abs(s.target - s.at) < 5e-4 && Math.abs(s.rate) < 5e-4) { s.at = s.target; s.rate = 0; } else settled = false;
  }
  draw();
  frame = visible && !(settled && !touring) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; setOpen(next); clearTimeout(idleTimer); idleTimer = setTimeout(() => { touring = !still.matches; clock = 1.4; run(); }, 3600); run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointerenter", () => steer(true));
stage.addEventListener("pointerleave", () => steer(false));
stage.addEventListener("pointerdown", () => steer(!open));
stage.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") { event.preventDefault(); steer(!open); }
  if (event.key === "Escape") steer(false);
});
window.__hbm = { setOpen: (v) => { touring = false; setOpen(v); }, tour: () => { touring = true; clock = 0; run(); } };
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "HBM：叠起来的内存",
  hint: "悬停或按空格拆开",
  readout: `${STACKS} 颗 HBM4 · 共 ${GB_TOTAL} GB`,
  keys: [
    { mark: "lit", label: `拆开的这一颗：${LAYERS} 层 DRAM 芯片垂直叠在一起` },
    { mark: "raised", label: "其余 7 颗 HBM 与两颗计算芯片，同在一块硅中介层上" },
    { mark: "dotted", label: "微凸点：层与层之间的电气连接，配合硅通孔（TSV）穿过每层芯片" },
  ],
  caption:
    "示意图，纵向放大。按英伟达 Rubin 公布的配置绘制：8 颗 HBM4 共 288 GB，以 12 层堆叠计，每颗 36 GB、每层 24 Gb。最底下一层是逻辑底座（base die），HBM4 起它可以用晶圆代工厂的逻辑工艺来做。",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="HBM 拆解：悬停、点按或空格键拆开与合拢" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" aria-valuetext="合拢：8 颗 HBM4" style="touch-action:pan-y">${svg}</div>`,
});

const file = theme === "light" ? "hbm-light.html" : "hbm.html";
writeFileSync(join(HERE, file), k.pageHtml({ title: "HBM 拆解", theme, body, script: kitScript() + live }).replace('<html lang="en">', '<html lang="zh-CN">'));
console.log("wrote", file);

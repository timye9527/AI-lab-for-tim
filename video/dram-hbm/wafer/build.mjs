// Fig 2：一盒晶圆，两种去向 —— 拨动分隔块，把顶上的 k 片晶圆分给 HBM，右边两摞托盘按位元量增减
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../../.claude/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 600;
const HEIGHT = 405;

// 模型：同样多的位元，HBM 吃掉的晶圆约是 DDR5 的 3 倍（美光 2025 年财报会：HBM3E 约 3:1，之后几代更高）
const WAFERS = 25;
const RATIO = 3;
const STEPS = [0, 3, 6, 9, 12];

const PLATE = { x: -122, y: -60, w: 252, d: 124, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const CX = -62;
const CY = 2;
const R = 34;
const W_T = 0.9;
const PITCH = 3.2;
const Z0 = 6;
const zOf = (i) => Z0 + i * PITCH; // i = 0 最底下
const WALL_TOP = zOf(WAFERS - 1) + W_T + 3;
const BACK = { x: CX - R - 6, y: CY - R - 6, w: 2 * R + 9, d: 3, r: 0.6 };
const LEFT = { x: CX - R - 6, y: CY - R - 3, w: 3, d: 2 * R + 5, r: 0.6 };
const RAIL = { x: CX - R - 7, y: CY + R + 2, w: 5, d: 5, r: 1 };
const TRAY_H = 2.6;
const DDR_AT = { x: 2, y: -24, w: 46, d: 34, r: 1.6 };
const HBM_AT = { x: 70, y: -24, w: 46, d: 34, r: 1.6 };
const PALLET_H = 3;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [BACK.x, BACK.y, WALL_TOP], [DDR_AT.x, DDR_AT.y, PALLET_H + WAFERS * TRAY_H + 2], [DDR_AT.x + DDR_AT.w, DDR_AT.y, PALLET_H + WAFERS * TRAY_H + 2]],
  WIDTH,
  HEIGHT,
  { pad: 24, azimuth: 58 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(PLATE, -PLATE_H + 3, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: -10, y: PLATE.y + PLATE.d - 15, w: 128, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  return out.join("");
}

// 片盒：后墙和左墙，内侧每片晶圆一道槽
function walls() {
  const out = [];
  out.push(S(k.slabOf(BACK, 0, WALL_TOP, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: BACK.x, y: BACK.y - 4, w: BACK.w, d: 4, r: 0.6 }, 0, 4, P, 3, 0.4), { tone: "lo" }));
  const face = BACK.y + BACK.d;
  const slotsBack = [];
  // 槽线绕过右端面的转角，落在墙的轮廓上
  for (let i = 0; i < WAFERS; i++) slotsBack.push(k.segment([BACK.x + 3, face, zOf(i)], [BACK.x + BACK.w, face, zOf(i)], P), k.segment([BACK.x + BACK.w, face, zOf(i)], [BACK.x + BACK.w, BACK.y, zOf(i)], P));
  out.push(L(slotsBack.join(""), { tone: "faint" }));
  out.push(S(k.slabOf(LEFT, 0, WALL_TOP, P, 3, 0.5), { tone: "mid" }));
  const side = LEFT.x + LEFT.w;
  const slotsLeft = [];
  for (let i = 0; i < WAFERS; i++) slotsLeft.push(k.segment([side, LEFT.y, zOf(i)], [side, LEFT.y + LEFT.d, zOf(i)], P), k.segment([side, LEFT.y + LEFT.d, zOf(i)], [LEFT.x, LEFT.y + LEFT.d, zOf(i)], P));
  out.push(L(slotsLeft.join(""), { tone: "faint" }));
  // 顶部把手横梁
  out.push(S(k.slabOf({ x: LEFT.x - 1, y: BACK.y, w: 5, d: 2 * R + 8, r: 1 }, WALL_TOP, 3, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([LEFT.x + 1.5, BACK.y + 5, WALL_TOP + 3]), at([LEFT.x + 1.5, BACK.y + 2 * R + 3, WALL_TOP + 3])], { size: 0.45 }));
  return out.join("");
}

// 晶圆顶面的切割道：弦线两端都落在晶圆边上
function grid(z, pitch) {
  const lines = [];
  for (let u = -R + pitch / 2; u < R; u += pitch) {
    const h = Math.sqrt(R * R - u * u) - 0.4;
    if (h < 2) continue;
    lines.push(k.lineOnTop([CX + u, CY - h], [CX + u, CY + h], z, P), k.lineOnTop([CX - h, CY + u], [CX + h, CY + u], z, P));
  }
  return lines.join("");
}
function wafer(i, kind) {
  const z = zOf(i);
  const hbm = kind === "hbm";
  const out = [S(k.cylinder(CX, CY, R, z, W_T, P, 96, 0.4), hbm ? { tone: "hi", crease: "lo", lit: true } : { tone: "mid" })];
  if (i === WAFERS - 1) {
    out.push(L(grid(z + W_T, hbm ? 7.5 : 4.6), { tone: "faint" }));
    out.push(L(k.ring(CX, CY, R - 1.6, z + W_T, P, 96), { tone: "lo" }));
  }
  return out.join("");
}

// 分隔块：在前立柱上滑动，压在 DDR 和 HBM 的分界处
function rail() {
  const out = [S(k.slabOf(RAIL, 0, WALL_TOP + 3, P, 3, 0.4), { tone: "mid" })];
  const ticks = [];
  for (let i = 0; i <= WAFERS; i += 3) ticks.push(k.segment([RAIL.x + RAIL.w, RAIL.y + RAIL.d, zOf(WAFERS - i) - 1.15], [RAIL.x + RAIL.w, RAIL.y + RAIL.d - 2.4, zOf(WAFERS - i) - 1.15], P));
  out.push(L(ticks.join(""), { tone: "lo" }));
  return out.join("");
}
const TAB_BASE = 0;
function tab() {
  const plan = { x: RAIL.x - 1, y: RAIL.y - 1, w: RAIL.w + 2, d: RAIL.d + 2, r: 1.2 };
  const out = [S(k.slabOf(plan, TAB_BASE - 1.5, 3, P, 3, 0.4), { tone: "mid" })];
  out.push(S(k.slabOf({ x: plan.x + plan.w, y: RAIL.y + 1, w: 3, d: 3, r: 0.6 }, TAB_BASE - 0.8, 1.6, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(plan.x + plan.w + 5, RAIL.y + 2.5, 2.6, TAB_BASE - 2, 4, P, 20), { tone: "hi" }));
  out.push(L(k.knurl(plan.x + plan.w + 5, RAIL.y + 2.5, 2.6, TAB_BASE - 2, TAB_BASE + 2, 18, P), { tone: "lo" }));
  return out.join("");
}
const boundaryZ = (n) => zOf(WAFERS - n) - 1.15;

// 托盘：DDR 盘里小格子多，HBM 盘里大格子少；每一盘代表同样多的位元
function tray(plan, z, kind) {
  const out = [S(k.slabOf(plan, z, TRAY_H, P, 3, 0.4), { tone: kind === "hbm" ? "hi" : "mid", crease: "lo", lit: kind === "hbm" })];
  const [cols, rows] = kind === "hbm" ? [3, 2] : [6, 4];
  const gx = (plan.w - 6) / cols, gy = (plan.d - 6) / rows;
  const pockets = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) pockets.push(k.planOutline({ x: plan.x + 3 + c * gx + 0.8, y: plan.y + 3 + r * gy + 0.8, w: gx - 1.6, d: gy - 1.6, r: 0.6 }, z + TRAY_H, P, 2));
  out.push(L(pockets.join(""), { tone: "faint" }));
  return out.join("");
}
function pallet(plan) {
  const base = k.insetPlan(plan, -2);
  return S(k.slabOf(base, 0, PALLET_H, P, 3, 0.5), { tone: "lo" }) + D(k.corners(base, 3).map(([x, y]) => at([x, y, PALLET_H])), { size: 0.42 });
}

const HBM_MAX = STEPS[STEPS.length - 1] / RATIO;
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "一个装着 25 片晶圆的片盒，旁边是两摞托盘。拨动片盒前面的分隔块，顶上的几片晶圆就分给 HBM。左边一摞是通用 DRAM 托盘，每少一片晶圆就少一盘；右边一摞是 HBM 托盘，每三片晶圆才多出一盘，因为同样多的容量，HBM 要多用约三倍的晶圆。",
  body: [
    bench(),
    walls(),
    Array.from({ length: WAFERS }, (_, i) => `<g data-wafer="${i}"><g data-kind="ddr">${wafer(i, "ddr")}</g><g data-kind="hbm" style="display:none">${wafer(i, "hbm")}</g></g>`).join(""),
    rail(),
    `<g data-part="tab" transform="${k.translateAlong(P, [0, 0, boundaryZ(0)])}">${tab()}</g>`,
    pallet(DDR_AT),
    Array.from({ length: WAFERS }, (_, n) => `<g data-ddr="${n}">${tray(DDR_AT, PALLET_H + n * TRAY_H, "ddr")}</g>`).join(""),
    pallet(HBM_AT),
    Array.from({ length: HBM_MAX }, (_, n) => `<g data-hbm="${n}" style="opacity:0">${tray(HBM_AT, PALLET_H + n * TRAY_H, "hbm")}</g>`).join(""),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const WAFERS = ${WAFERS}, RATIO = ${RATIO}, STEPS = ${JSON.stringify(STEPS)};
const Z0 = ${Z0}, PITCH = ${PITCH};
const boundaryZ = (n) => Z0 + (WAFERS - n) * PITCH - 1.15;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const wafers = [...svg.querySelectorAll("[data-wafer]")].map((g) => [g.querySelector('[data-kind="ddr"]'), g.querySelector('[data-kind="hbm"]')]);
const ddr = [...svg.querySelectorAll("[data-ddr]")];
const hbm = [...svg.querySelectorAll("[data-hbm]")];
const tabEl = svg.querySelector('[data-part="tab"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let n = 0, target = 0, frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idleTimer = 0, said = "", shown = -1;
function textOf(flipped) {
  const left = WAFERS - flipped, made = flipped / RATIO, total = left + made;
  if (!flipped) return "25 片全做通用 DRAM · 位元 25 盘";
  return "HBM 分走 " + flipped + " 片 · 通用 DRAM −" + Math.round(flipped / WAFERS * 100) + "% · 总位元 −" + Math.round((1 - total / WAFERS) * 100) + "%";
}
function draw() {
  tabEl.setAttribute("transform", translateAlong(P, [0, 0, boundaryZ(n)]));
  // 分隔块经过哪片，哪片就翻成 HBM（从顶上数）
  const flipped = Math.max(0, Math.min(WAFERS, Math.round(n)));
  if (flipped !== shown) {
    shown = flipped;
    wafers.forEach(([a, b], i) => { const on = i >= WAFERS - flipped; a.style.display = on ? "none" : ""; b.style.display = on ? "" : "none"; });
    ddr.forEach((g, i) => { g.style.display = i < WAFERS - flipped ? "" : "none"; });
    hbm.forEach((g, i) => { const part = Math.max(0, Math.min(1, flipped / RATIO - i)); g.style.opacity = part >= 1 ? "1" : part > 0 ? String(0.18 + 0.3 * part) : "0"; });
    stage.setAttribute("aria-valuenow", String(flipped));
  }
  const text = textOf(flipped);
  if (text !== said) { readout.textContent = text; said = text; stage.setAttribute("aria-valuetext", text); }
}
const tourAt = (t) => { const seq = [0, 3, 6, 9, 12, 12, 0]; return seq[Math.floor(t / 1.8) % seq.length]; };
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { clock += dt; target = tourAt(clock); }
  n = calm ? target : n + (target - n) * (1 - Math.exp(-dt / 0.32));
  if (Math.abs(target - n) < 0.004) n = target;
  draw();
  frame = visible && !(!touring && n === target) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = next; clearTimeout(idleTimer); idleTimer = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 3600); run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.min(1, Math.max(0, ((event.clientX - box.left) / box.width - 0.15) / 0.7));
  steer(STEPS[Math.round(share * (STEPS.length - 1))]);
});
stage.addEventListener("keydown", (event) => {
  const here = STEPS.indexOf(target);
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = Math.min(STEPS.length - 1, here + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = Math.max(0, here - 1);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = STEPS.length - 1;
  if (to === null) return;
  event.preventDefault();
  steer(STEPS[to]);
});
window.__wafer = { set: (v) => { touring = false; target = v; run(); }, tour: () => { touring = true; clock = 0; run(); } };
draw();
`;

const body = k.plateHtml({
  fig: "Fig 2",
  title: "一盒晶圆，两种去向",
  hint: "左右移动分配晶圆",
  readout: "25 片全做通用 DRAM · 位元 25 盘",
  keys: [
    { mark: "lit", label: "分给 HBM 的晶圆，和它们做出的 HBM 托盘" },
    { mark: "raised", label: "做通用 DRAM（DDR5、LPDDR5）的晶圆和托盘" },
    { mark: "flat", label: "每一盘托盘代表同样多的容量（位元）" },
  ],
  caption:
    "示意模型。美光 2025 年 3 月财报会表示：同样多的位元，HBM3E 要用的晶圆约是 DDR5 的 3 倍，HBM4 之后还会更高。这里按 3:1 计：每 3 片晶圆从通用 DRAM 转去做 HBM，通用 DRAM 少 3 盘，HBM 只多 1 盘，整个行业能卖的位元总量变少。",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="晶圆分配：左右方向键每次多分或少分 3 片晶圆给 HBM" aria-valuemin="0" aria-valuemax="12" aria-valuenow="0" style="touch-action:pan-y">${svg}</div>`,
});

const file = theme === "light" ? "wafer-light.html" : "wafer.html";
writeFileSync(join(HERE, file), k.pageHtml({ title: "晶圆分配", theme, body, script: kitScript() + live }).replace('<html lang="en">', '<html lang="zh-CN">'));
console.log("wrote", file);

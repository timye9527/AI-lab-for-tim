// 把图解页面逐帧录成 mp4：接管 requestAnimationFrame，用虚拟时钟每帧推进 1/fps 秒，画面稳定不掉帧
// 用法：node record.mjs <page.html> <out.mp4> <秒数> <开场脚本> [--fps 30] [--scale 2]
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [page, out, seconds, start = ""] = process.argv.slice(2);
const flag = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? Number(process.argv[i + 1]) : fallback; };
const FPS = flag("--fps", 30);
const SCALE = flag("--scale", 2);
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const VIRTUAL = `(() => {
  let t = 0; const queue = [];
  window.requestAnimationFrame = (cb) => { queue.push(cb); return queue.length; };
  window.cancelAnimationFrame = () => {};
  performance.now = () => t;
  window.__step = (ms) => { t += ms; queue.splice(0).forEach((cb) => cb(t)); };
})();`;

const profile = mkdtempSync(join(tmpdir(), "rec-"));
const frames = mkdtempSync(join(tmpdir(), "frames-"));
const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--hide-scrollbars", "--allow-file-access-from-files", "about:blank"]);
const port = await new Promise((done) => chrome.stderr.on("data", (d) => { const m = /DevTools listening on ws:\/\/[^:]+:(\d+)/.exec(String(d)); if (m) done(m[1]); }));
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((done) => ws.addEventListener("open", done));
let id = 0;
const waiting = new Map();
ws.addEventListener("message", (e) => { const msg = JSON.parse(e.data); if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); } });
const send = (method, params = {}) => new Promise((done) => { id += 1; waiting.set(id, done); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: SCALE, mobile: false });
await send("Page.addScriptToEvaluateOnNewDocument", { source: VIRTUAL });
await send("Page.navigate", { url: pathToFileURL(resolve(page)).href });
await sleep(1500);
await run("window.__step(16)");
if (start) await run(start);
const box = await run(`(() => { const r = document.querySelector('.iso-plate').getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height }; })()`);
// x264 要偶数尺寸
box.width = Math.floor((box.width * SCALE) / 2) * 2 / SCALE;
box.height = Math.floor((box.height * SCALE) / 2) * 2 / SCALE;
const count = Math.round(Number(seconds) * FPS);
for (let n = 0; n < count; n++) {
  await run(`window.__step(${1000 / FPS})`);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { ...box, scale: 1 }, captureBeyondViewport: true });
  writeFileSync(join(frames, `f${String(n).padStart(5, "0")}.png`), Buffer.from(shot.result.data, "base64"));
}
ws.close();
chrome.kill();
const ff = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(frames, "f%05d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", "-movflags", "+faststart", out], { stdio: "inherit" });
rmSync(frames, { recursive: true, force: true });
rmSync(profile, { recursive: true, force: true });
console.log(ff.status === 0 ? `wrote ${out} · ${count} frames · ${Math.round(box.width * SCALE)}×${Math.round(box.height * SCALE)}` : "ffmpeg failed");

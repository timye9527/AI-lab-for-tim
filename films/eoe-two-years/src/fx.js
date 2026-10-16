// 光影与后期：角色打光（体积暗部 + 轮廓光）、泛光、景深、颗粒、暗角
import { makeCanvas, rng } from './util.js';
import { W, H } from './timeline.js';

const pool = {};
// 复用的离屏画布
export function layer(name, w = W, h = H) {
  let c = pool[name];
  if (!c || c.width !== w || c.height !== h) {
    c = pool[name] = makeCanvas(w, h);
  }
  const ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.clearRect(0, 0, w, h);
  return [c, ctx];
}

// 给画好的角色图层打光
// L = { dir: [dx, dy] 光从哪个方向来（单位向量）, shade: 背光侧颜色, amb: 整体环境色,
//       rim: 轮廓光颜色, rimW: 轮廓光宽度(px), rimA: 强度, box: [x0,y0,x1,y1] 角色范围 }
export function light(src, L) {
  const [m, mc] = layer('lt-mask');
  // 环境色（正片叠底）
  if (L.amb) {
    mc.drawImage(src, 0, 0);
    mc.globalCompositeOperation = 'source-in';
    mc.fillStyle = L.amb;
    mc.fillRect(0, 0, W, H);
    const sc = src.getContext('2d');
    sc.globalCompositeOperation = 'multiply';
    sc.drawImage(m, 0, 0);
    sc.globalCompositeOperation = 'source-over';
  }
  // 方向暗部：从受光侧到背光侧的渐变
  if (L.shade) {
    const [x0, y0, x1, y1] = L.box;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const r = Math.hypot(x1 - x0, y1 - y0) / 2;
    const [dx, dy] = L.dir;
    mc.globalCompositeOperation = 'source-over';
    mc.clearRect(0, 0, W, H);
    mc.drawImage(src, 0, 0);
    mc.globalCompositeOperation = 'source-in';
    const g = mc.createLinearGradient(cx + dx * r * 0.6, cy + dy * r * 0.6, cx - dx * r * 0.9, cy - dy * r * 0.9);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, '#ffffff');
    g.addColorStop(1, L.shade);
    mc.fillStyle = g;
    mc.fillRect(0, 0, W, H);
    const sc = src.getContext('2d');
    sc.globalCompositeOperation = 'multiply';
    sc.drawImage(m, 0, 0);
    sc.globalCompositeOperation = 'source-over';
  }
  // 轮廓光：剪影减去朝光源反方向平移的剪影
  if (L.rim) {
    const [dx, dy] = L.dir;
    const w = L.rimW || 6;
    const [r, rc] = layer('lt-rim');
    rc.drawImage(src, 0, 0);
    rc.globalCompositeOperation = 'source-in';
    rc.fillStyle = L.rim;
    rc.fillRect(0, 0, W, H);
    rc.globalCompositeOperation = 'destination-out';
    rc.drawImage(src, -dx * w, -dy * w);
    const sc = src.getContext('2d');
    sc.globalAlpha = L.rimA ?? 0.9;
    sc.globalCompositeOperation = 'source-atop';
    sc.filter = 'blur(1.2px)';
    sc.drawImage(r, 0, 0);
    sc.filter = 'none';
    sc.globalAlpha = 1;
    sc.globalCompositeOperation = 'source-over';
    return r; // 轮廓层留给泛光用
  }
  return null;
}

// 泛光：把亮部模糊后叠加
export function bloom(ctx, src, { blur = 24, alpha = 0.5, threshold = 0 } = {}) {
  const [b, bc] = layer('bloom', W / 4, H / 4);
  bc.filter = threshold ? `brightness(${1 - threshold}) contrast(${1 + threshold * 3})` : 'none';
  bc.drawImage(src, 0, 0, W / 4, H / 4);
  bc.filter = 'none';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.filter = `blur(${blur / 4}px)`;
  ctx.drawImage(b, 0, 0, W, H);
  ctx.restore();
}

// 暗角
export function vignette(ctx, strength = 0.55, color = '0,0,0') {
  const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H * 0.5, H * 0.72);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(1, `rgba(${color},${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// 胶片颗粒：预生成几张噪点图轮换
let grains = null;
export function grain(ctx, t, amount = 0.06) {
  if (!grains) {
    grains = [];
    const r = rng(42);
    for (let k = 0; k < 4; k++) {
      const c = makeCanvas(270, 480);
      const g = c.getContext('2d');
      const img = g.createImageData(270, 480);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (r() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      grains.push(c);
    }
  }
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grains[Math.floor(t * 24) % 4], 0, 0, W, H);
  ctx.restore();
}

// 色差（幻想段用）
export function chroma(ctx, src, px) {
  if (px < 0.5) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.35;
  ctx.filter = 'sepia(1) saturate(8) hue-rotate(-50deg)';
  ctx.drawImage(src, -px, 0);
  ctx.filter = 'sepia(1) saturate(8) hue-rotate(150deg)';
  ctx.drawImage(src, px, 0);
  ctx.restore();
}

// 柔和光锥（体积光）
export function cone(ctx, x, y, ang, spread, len, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, 0, 0, len);
  g.addColorStop(0, `rgba(${color},${alpha})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.lineTo(Math.tan(spread) * len, len);
  ctx.lineTo(-Math.tan(spread) * len, len);
  ctx.closePath();
  ctx.filter = 'blur(10px)';
  ctx.fill();
  ctx.restore();
}

// 柔光点（光晕）
export function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${color},${alpha})`);
  g.addColorStop(0.35, `rgba(${color},${alpha * 0.35})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// 角色局部染色：从 (x0,y0) 的 color 渐变到 (x1,y1) 透明（模拟一侧的有色主光）
export function tint(src, x0, y0, x1, y1, color, alpha) {
  const sc = src.getContext('2d');
  sc.save();
  sc.globalCompositeOperation = 'source-atop';
  const g = sc.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, `rgba(${color},${alpha})`);
  g.addColorStop(1, `rgba(${color},0)`);
  sc.fillStyle = g;
  sc.fillRect(0, 0, W, H);
  sc.restore();
}

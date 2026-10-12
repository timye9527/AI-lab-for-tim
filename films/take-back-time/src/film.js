// 合成：背景 → 場景 → 光線 → 發光層與泛光 → 字幕 → 顆粒與暗角
import { W, H, T, SUBTITLES, TAGLINE, GRID2, BEAT2 } from './timeline.js';
import { clamp, lerp, inv, smooth, easeOutCubic, makeCanvas, hash, rng } from './util.js';
import { makeSprites, SANS, SERIF } from './sprites.js';
import { initSpace, drawSpaceBg, drawSpace, drawRuler, drawCursor, drawOpenFlash, drawAssembly, drawCrowd, drawWalls } from './space.js';
import { drawHeroLine } from './string.js';
import { initSea, drawSea, drawViewfinder, drawBeam } from './sea.js';
import { initFinale, drawFinale } from './finale.js';

export async function loadFonts() {
  if (typeof document === 'undefined') return;
  await Promise.all([document.fonts.load(`500 40px ${SANS}`, '我'), document.fonts.load(`300 40px ${SANS}`, '我'), document.fonts.load(`600 40px ${SERIF}`, '我')]);
}

export async function createFilm(canvas) {
  await loadFonts();
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const glow = makeCanvas(W, H);
  const g = glow.getContext('2d');
  const b1 = makeCanvas(480, 270);
  const b2 = makeCanvas(160, 90);
  const seaC = makeCanvas(W, H);
  const seaG = makeCanvas(W, H);
  const S = makeSprites();
  initSpace(S);
  initSea();
  initFinale();

  // 暗角
  const vig = makeCanvas(W, H);
  {
    const x = vig.getContext('2d');
    const gr = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,0.55)');
    x.fillStyle = gr;
    x.fillRect(0, 0, W, H);
  }
  // 底片顆粒
  const grains = [0, 1, 2, 3].map((i) => {
    const c = makeCanvas(256, 256);
    const x = c.getContext('2d');
    const img = x.createImageData(256, 256);
    const R = rng(100 + i);
    for (let p = 0; p < img.data.length; p += 4) {
      const v = (R() * 255) | 0;
      img.data[p] = img.data[p + 1] = img.data[p + 2] = v;
      img.data[p + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return ctx.createPattern(c, 'repeat');
  });

  const K = { ctx, g, S };

  function render(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    g.clearRect(0, 0, W, H);

    // ---- 背景 ----
    if (t < 16.8) drawSpaceBg(K, t);

    // ---- 海（對焦轉場：先是散景，再清晰）----
    if (t >= 14.4) {
      const appear = smooth(14.4, 15.9, t);
      const blur = lerp(40, 0, smooth(15.1, 16.6, t));
      const beatBoost = t > T.lift && t < 27.6 ? beatPulse(t) * 0.3 : 0;
      const liftBoost = t > T.lift ? 0.9 * Math.exp(-(t - T.lift) * 2.5) : 0;
      const opt = {
        noHorizon: t < 16.3,
        horizonAlpha: smooth(16.3, 16.65, t),
        horizonBoost: beatBoost + liftBoost,
        dim: 0.22 * smooth(27.3, 28.8, t),
      };
      if (blur > 0.3 || appear < 1) {
        const sc = seaC.getContext('2d');
        const sg = seaG.getContext('2d');
        sc.clearRect(0, 0, W, H);
        sg.clearRect(0, 0, W, H);
        drawSea(sc, sg, t, opt);
        ctx.globalAlpha = appear;
        ctx.filter = blur > 0.3 ? `blur(${blur}px)` : 'none';
        ctx.drawImage(seaC, 0, 0);
        g.globalAlpha = appear;
        g.filter = blur > 0.3 ? `blur(${blur * 0.8}px)` : 'none';
        g.drawImage(seaG, 0, 0);
        ctx.filter = 'none';
        g.filter = 'none';
        ctx.globalAlpha = 1;
        g.globalAlpha = 1;
      } else {
        drawSea(ctx, g, t, opt);
      }
    }

    // ---- 創作空間 ----
    if (t < 12.4) {
      drawSpace(K, t);
      drawWalls(K, t);
      drawCrowd(K, t);
      drawAssembly(K, t);
      drawRuler(K, t);
      drawOpenFlash(K, t);
    }
    drawCursor(K, t);

    // ---- 光線 ----
    drawHeroLine(K, t);

    // ---- 生活的片段 ----
    drawViewfinder(K, t);
    drawBeam(K, t);
    drawFinale(K, t);

    // ---- 發光層 + 泛光 ----
    const b1x = b1.getContext('2d');
    const b2x = b2.getContext('2d');
    b1x.clearRect(0, 0, 480, 270);
    b1x.filter = 'blur(2.5px)';
    b1x.drawImage(glow, 0, 0, 480, 270);
    b1x.filter = 'none';
    b2x.clearRect(0, 0, 160, 90);
    b2x.filter = 'blur(3px)';
    b2x.drawImage(b1, 0, 0, 160, 90);
    b2x.filter = 'none';
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glow, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = 0.85;
    ctx.drawImage(b1, 0, 0, W, H);
    ctx.globalAlpha = 0.7;
    ctx.drawImage(b2, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // ---- 字幕 ----
    drawSubtitles(ctx, t);
    drawTagline(ctx, t);

    // ---- 暗角、顆粒、收尾淡出 ----
    ctx.drawImage(vig, 0, 0);
    const fi = Math.floor(t * 30) % 4;
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.05;
    ctx.translate(-((hash(t * 30) * 256) | 0), -((hash(t * 31 + 7) * 256) | 0));
    ctx.fillStyle = grains[fi];
    ctx.fillRect(0, 0, W + 256, H + 256);
    ctx.restore();
    const fo = smooth(T.fadeOut, 32, t);
    if (fo > 0) {
      ctx.fillStyle = `rgba(0,0,0,${fo})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }
  return { render };
}

// 23–27.5 秒的節拍：海平線輕輕跟著跳
function beatPulse(t) {
  const u = (t - GRID2) % BEAT2;
  return Math.exp(-u * 7);
}

function drawSubtitles(ctx, t) {
  for (const s of SUBTITLES) {
    if (t < s.start || t > s.end) continue;
    const ain = smooth(s.start, s.start + 0.35, t);
    const a = ain * (1 - smooth(s.end - 0.3, s.end, t));
    const warm = s.start > 14;
    const y = 884 + 10 * (1 - easeOutCubic(ain));
    ctx.save();
    ctx.font = `500 66px ${SANS}`;
    ctx.letterSpacing = '5px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(s.text).width;
    // 字幕後方一層很淡的暗影，保證任何畫面上都讀得到
    const gr = ctx.createRadialGradient(960, y, 0, 960, y, tw * 0.75);
    gr.addColorStop(0, `rgba(2,4,10,${0.42 * a})`);
    gr.addColorStop(1, 'rgba(2,4,10,0)');
    ctx.save();
    ctx.translate(960, y);
    ctx.scale(1, 0.24);
    ctx.translate(-960, -y);
    ctx.fillStyle = gr;
    ctx.fillRect(960 - tw, y - tw, tw * 2, tw * 2);
    ctx.restore();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = warm ? `rgba(255,248,236,${a})` : `rgba(242,247,255,${a})`;
    ctx.fillText(s.text, 960, y);
    ctx.restore();
  }
}

function drawTagline(ctx, t) {
  if (t < T.tagline) return;
  const chars = [...TAGLINE];
  ctx.save();
  ctx.font = `600 54px ${SERIF}`;
  ctx.textBaseline = 'middle';
  const sp = 10;
  const widths = chars.map((c) => ctx.measureText(c).width + sp);
  const total = widths.reduce((a, b) => a + b, 0) - sp;
  let x = 960 - total / 2;
  // 標語後方淡淡的暗影，避開海面碎光的干擾
  const sa = smooth(T.tagline, T.tagline + 0.6, t);
  const gr = ctx.createRadialGradient(960, 772, 0, 960, 772, total * 0.7);
  gr.addColorStop(0, `rgba(2,6,14,${0.5 * sa})`);
  gr.addColorStop(1, 'rgba(2,6,14,0)');
  ctx.save();
  ctx.translate(960, 772);
  ctx.scale(1, 0.22);
  ctx.translate(-960, -772);
  ctx.fillStyle = gr;
  ctx.fillRect(960 - total, 772 - total, total * 2, total * 2);
  ctx.restore();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 16;
  chars.forEach((c, i) => {
    const k = clamp((t - T.tagline - i * 0.045) / 0.5);
    const e = easeOutCubic(k);
    ctx.fillStyle = `rgba(255,244,226,${e})`;
    ctx.fillText(c, x, 772 + 10 * (1 - e));
    x += widths[i];
  });
  ctx.restore();
}
export { inv };

// 用 canvas 画 3:4 段位海报（1080×1440，适合小红书），返回 PNG dataURL
// 不依赖 html2canvas，微信 / 小红书内置浏览器里也能稳定出图
import { tierIcon } from './icons.js';

const FONT = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
const W = 1080;
const H = 1440;

function loadSvg(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

// 中文按字折行
function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      // 标点不放行首
      if (/[，。、；：！？」』）]/.test(ch)) {
        line += ch;
        lines.push(line);
        line = '';
        continue;
      }
      lines.push(line);
      line = ch;
    } else line += ch;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function drawPoster(test, result, nickname, dateText) {
  const th = test.theme;
  const { tier, type, match, meters } = result;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a2416');
  bg.addColorStop(0.45, '#17140d');
  bg.addColorStop(1, '#0f0e0a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 金色内框
  ctx.strokeStyle = th.gold + '88';
  ctx.lineWidth = 3;
  roundRect(ctx, 48, 48, W - 96, H - 96, 36);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // 页眉
  ctx.fillStyle = '#b9b2a2';
  ctx.font = `600 34px ${FONT}`;
  ctx.letterSpacing = '8px';
  ctx.fillText(test.poster.header, W / 2, 140);
  ctx.letterSpacing = '0px';

  // 图标光圈
  const cx = W / 2, cy = 280, r = 110;
  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
  glow.addColorStop(0, '#5a4a2a');
  glow.addColorStop(1, '#221c12');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = th.gold + '66';
  ctx.lineWidth = 2;
  ctx.stroke();
  try {
    const icon = await loadSvg(tierIcon(tier.icon, th.accent, th.gold));
    ctx.drawImage(icon, cx - 84, cy - 84, 168, 168);
  } catch {
    /* 图标画不出来不影响海报 */
  }

  // 段位
  ctx.fillStyle = th.gold;
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText(`Lv.${tier.level}`, W / 2, 440);
  ctx.fillStyle = '#ffffff';
  let size = 84;
  ctx.font = `800 ${size}px ${FONT}`;
  while (ctx.measureText(tier.name).width > W - 200 && size > 52) {
    size -= 4;
    ctx.font = `800 ${size}px ${FONT}`;
  }
  ctx.fillText(tier.name, W / 2, 525);
  ctx.fillStyle = th.gold;
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText(`「${tier.sub}」`, W / 2, 592);

  // 段位描述
  ctx.fillStyle = '#d6d0c4';
  ctx.font = `400 34px ${FONT}`;
  let y = 660;
  for (const line of wrap(ctx, tier.desc, W - 240).slice(0, 3)) {
    ctx.fillText(line, W / 2, y);
    y += 50;
  }

  // 人格底色块
  y += 10;
  roundRect(ctx, 120, y, W - 240, 200, 24);
  ctx.fillStyle = '#ffffff0d';
  ctx.fill();
  ctx.strokeStyle = th.gold + '44';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#b9b2a2';
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(`人格底色 · 匹配度 ${match}%`, W / 2, y + 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 52px ${FONT}`;
  ctx.fillText(`${type.name} · ${type.alias}`, W / 2, y + 116);
  ctx.fillStyle = th.accent;
  ctx.font = `500 32px ${FONT}`;
  ctx.fillText(`“${type.quote}”`, W / 2, y + 170);
  y += 260;

  // 仪表
  const keys = Object.keys(test.meters);
  const colW = (W - 240 - 60) / keys.length;
  keys.forEach((k, i) => {
    const x0 = 120 + i * (colW + 60);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d6d0c4';
    ctx.font = `500 30px ${FONT}`;
    ctx.fillText(test.meters[k].label, x0, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = th.gold;
    ctx.font = `700 32px ${FONT}`;
    ctx.fillText(String(meters[k]), x0 + colW, y);
    roundRect(ctx, x0, y + 20, colW, 12, 6);
    ctx.fillStyle = '#ffffff1f';
    ctx.fill();
    roundRect(ctx, x0, y + 20, Math.max(12, (colW * meters[k]) / 100), 12, 6);
    ctx.fillStyle = th.gold;
    ctx.fill();
  });
  ctx.textAlign = 'center';
  y += 85;

  // 分隔线 + 署名
  ctx.strokeStyle = '#ffffff22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, y);
  ctx.lineTo(W - 120, y);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText(nickname, W / 2, y + 65);
  ctx.fillStyle = '#8f897c';
  ctx.font = `400 28px ${FONT}`;
  ctx.fillText(dateText, W / 2, y + 110);

  // 页脚：引导别人来测
  ctx.fillStyle = th.accent;
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText(test.poster.footer, W / 2, H - 90);

  return canvas.toDataURL('image/png');
}

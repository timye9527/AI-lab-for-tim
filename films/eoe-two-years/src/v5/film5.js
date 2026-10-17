// 完整版合成：第一幕用正式样片，其余各幕来自 acts.js；字幕、暗角、淡出统一在这里处理
import { ACTS, actAt, VO_ALL, DURATION, W, H } from './timeline5.js';
import { createSample } from '../v4/sample4.js';
import { initActs, act2, act3, act4, actT, act5, act6, act7 } from './acts.js';
import { subtitle } from '../v2/frames.js';

// 字幕太长时在标点处断成两行（找最靠近中间的标点）
function subtitleWrap(ctx, text, y) {
  ctx.save();
  ctx.font = '700 54px "Noto Sans SC", sans-serif';
  const w = ctx.measureText(text).width;
  ctx.restore();
  if (w <= 940) return subtitle(ctx, text, y);
  let best = -1;
  for (let i = 1; i < text.length - 1; i++) {
    if ('，、……'.includes(text[i]) && !'，、…'.includes(text[i + 1])) {
      if (best < 0 || Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2)) best = i;
    }
  }
  if (best < 0) best = Math.floor(text.length / 2) - 1;
  subtitle(ctx, text.slice(0, best + 1), y - 36);
  subtitle(ctx, text.slice(best + 1), y + 36);
}
import { clamp, noise } from './u5.js';

const FN = { a2: act2, a3: act3, a4: act4, at: actT, a5: act5, a6: act6, a7: act7 };

export async function createFilm5(canvas, { subtitles = true } = {}) {
  const ctx = canvas.getContext('2d');
  const a1 = await createSample(canvas, { subtitles: false, fadeOut: false });
  await Promise.all([
    document.fonts.load('900 120px "Noto Sans SC"', '当场入会！第 2 3 次工作没了。人生 GAP 3 个月这个你来！？？？还单身？（偷瞄）EOE 两周年来啦！中文演讲俱乐部自由开放趣味奇葩第三年继续一起玩第一次周四每周螺蛳粉火锅撸串真香我也笑学到了开场先自嘲停顿比说话难别背稿讲人话魔术脱口秀演讲抽奖中了哈%0123456789'),
    document.fonts.load('700 54px "Noto Sans SC"', VO_ALL.map((v) => v.text).join('') + '周四来不来？缺个主持！活动谁来搞？'),
    document.fonts.load('96px "ZCOOL KuaiLe"', '几天后嘘——嘀噗…咚！叮！…真香哇哈'),
  ]);
  let durs = {};
  try {
    durs = await (await fetch(new URL('../../assets/vo-tim/full/durations.json', import.meta.url))).json();
  } catch {
    durs = {};
  }
  initActs();
  const scene = document.createElement('canvas');
  scene.width = W;
  scene.height = H;
  const sc = scene.getContext('2d');
  let frozen = null;
  return {
    render(t) {
      const act = actAt(t);
      const lt = t - act.start;
      if (act.id === 'a1') {
        a1.render(lt);
      } else {
        sc.setTransform(1, 0, 0, 1, 0, 0);
        sc.fillStyle = '#000';
        sc.fillRect(0, 0, W, H);
        const post = FN[act.id](sc, lt) || {};
        ctx.save();
        ctx.filter = post.desat ? `saturate(${1 - post.desat})` : 'none';
        if (post.shake) ctx.translate(noise(t * 40, 1) * post.shake, noise(t * 40, 2) * post.shake);
        ctx.drawImage(scene, 0, 0);
        ctx.restore();
        const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H / 2, H * 0.75);
        g.addColorStop(0, 'rgba(10,15,30,0)');
        g.addColorStop(1, `rgba(10,15,30,${post.vig ?? 0.35})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        void frozen;
      }
      if (subtitles) {
        VO_ALL.forEach((v, i) => {
          const next = VO_ALL[i + 1] ? VO_ALL[i + 1].start - 0.06 : Infinity;
          const end = Math.min(next, v.start + (durs[v.id] ?? 2.5) + 0.3);
          if (t >= v.start - 0.03 && t <= end) {
            ctx.save();
            ctx.globalAlpha = clamp((t - v.start + 0.03) / 0.1) * clamp((end - t) / 0.1);
            subtitleWrap(ctx, v.text, 1580);
            ctx.restore();
          }
        });
      }
      const fade = t > DURATION - 0.8 ? (t - (DURATION - 0.8)) / 0.8 : 0;
      if (fade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${clamp(fade)})`;
        ctx.fillRect(0, 0, W, H);
      }
    },
  };
}
void ACTS;

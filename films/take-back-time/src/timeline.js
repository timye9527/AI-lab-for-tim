// 全片時間軸：畫面與聲音共用的唯一來源（單位：秒）
export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const DURATION = 32;

// 音樂網格（前段）：從 1.25 秒「空間打開」起算，五小節正好在 11.0 秒停住
export const GRID0 = 1.25;
export const BAR = (11.0 - GRID0) / 5; // 1.95 秒
export const BEAT = BAR / 4;
export const BPM = 60 / BEAT;
export const beatTime = (b) => GRID0 + b * BEAT;
// 後段網格：120 BPM，從 23 秒（海平線化成光線）起算
export const GRID2 = 23.0;
export const BEAT2 = 0.5;
export const beat2Time = (b) => GRID2 + b * BEAT2;

// 關鍵節點
export const T = {
  blink1: 0.15,
  blink2: 0.55,
  stretch: 0.9, // 游標拉成時間軸
  open: 1.25, // 創作空間打開
  asm1: 4.0, // 文字 → 影片
  asm2: 5.4, // 想法 → 舞台
  asm3: 6.8, // 音波 → 作品
  crowd: 8.0, // 待辦、修改、上線、下一個
  stop: 11.0, // 全片停頓
  pluck: 12.25, // 撥弦
  closeUp: 13.6, // 貼近琴弦
  horizon: 15.4, // 弦化成海平線
  viewfinder: 18.0,
  shutter: 19.45,
  beam: 20.3, // 舞台上一束光
  lift: 23.0, // 海平線重新化成光線
  motif1: 24.0,
  motif2: 25.0,
  motif3: 26.0,
  write: 27.4, // 光線寫出 Tim
  dot: 28.75, // i 的點
  caret: 28.95, // 游標回收
  tagline: 29.1,
  fadeOut: 31.4,
};

// 字幕：每次只出現一句
export const SUBTITLES = [
  { start: 1.35, end: 3.85, text: '我學會了加速。' },
  { start: 8.25, end: 10.85, text: '也差點忘了，為什麼出發。' },
  { start: 16.6, end: 21.6, text: '留一點時間，給喜歡的事。' },
  { start: 23.55, end: 25.35, text: '讓想法成真。' },
  { start: 25.6, end: 27.45, text: '讓生活有光。' },
];
export const TAGLINE = '快慢之間，我有自己的節奏。';
export const CROWD_WORDS = ['待辦', '修改', '上線', '下一個'];
export const CROWD_TIMES = [8.05, 8.55, 9.05, 9.5];

// 相機在創作空間裡的橫向位置（世界單位），0–11 秒逐步加速
// 速度曲線：開場靜止 → 起步 → 加速 → 最高速 → 11 秒急停
export function camSpeed(t) {
  if (t < T.open) return 0;
  if (t >= T.stop) return 0;
  const a = Math.min(1, (t - T.open) / (T.stop - T.open));
  return 0.35 + 4.2 * Math.pow(a, 1.7);
}
// 速度積分（解析近似：數值積分後快取）
const camTable = (() => {
  const dt = 1 / 600;
  const arr = [0];
  let x = 0;
  for (let i = 1; i <= DURATION * 600; i++) {
    x += camSpeed((i - 0.5) * dt) * dt;
    arr.push(x);
  }
  return arr;
})();
export function camX(t) {
  const f = Math.max(0, Math.min(DURATION, t)) * 600;
  const i = Math.floor(f);
  const r = f - i;
  const a = camTable[i];
  const b = camTable[Math.min(camTable.length - 1, i + 1)];
  return a + (b - a) * r;
}

// 掠過鏡頭的前景元素：在指定時間穿過畫面中央，音效據此同步
export const FLYBYS = [
  { t: 1.9, y: 0.55, z: 0.35, kind: 'glyph', ch: '想' },
  { t: 2.55, y: -0.6, z: 0.3, kind: 'wave' },
  { t: 3.15, y: 0.45, z: 0.28, kind: 'timeline' },
  { t: 3.6, y: -0.5, z: 0.32, kind: 'glyph', ch: '拍' },
  { t: 7.75, y: 0.62, z: 0.3, kind: 'glyph', ch: '寫' },
  { t: 8.9, y: -0.55, z: 0.26, kind: 'card' },
  { t: 9.75, y: 0.5, z: 0.25, kind: 'timeline' },
  { t: 10.4, y: -0.45, z: 0.24, kind: 'card' },
];

// 撥弦後的吉他分解（23 秒前的溫暖段落），畫面在海平線上用光脈衝回應
export const WARM_CHORDS = [
  { t: 14.0, notes: ['D3', 'A3', 'E4', 'F#4', 'A4'] },
  { t: 16.0, notes: ['G2', 'D3', 'B3', 'F#4', 'A4'] },
  { t: 18.0, notes: ['B2', 'F#3', 'D4', 'A4', 'C#5'] },
  { t: 20.0, notes: ['G2', 'D3', 'B3', 'F#4', 'B4'] },
  { t: 22.0, notes: ['A2', 'E3', 'D4', 'E4', 'A4'] },
];
// 分解和弦指法：每拍的音索引（-1 為休止），每個和弦一小節八個八分音符
export const PICK_PATTERN = [0, 3, 1, 4, 2, 3, 1, -1];
export function warmPicks() {
  const out = [];
  for (const ch of WARM_CHORDS) {
    const len = ch.t === 22.0 ? 4 : 8; // 最後一個和弦只彈半小節，交給上升段
    for (let i = 0; i < len; i++) {
      const idx = PICK_PATTERN[i];
      if (idx < 0) continue;
      // 輕微搖擺，像真人彈
      const swing = i % 2 === 1 ? 0.035 : 0;
      out.push({ t: ch.t + i * (BEAT2 / 2) + swing, note: ch.notes[idx], vel: i === 0 ? 0.9 : 0.55 + 0.1 * ((i * 7) % 3) });
    }
  }
  return out;
}

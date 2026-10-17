// 正式样片（火柴人版第一幕）时间轴：画面和声音共用；配音是 Tim 本人声音（合成）
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 12.15;
export const VODIR = 'vo-tim/full';

export const SHOTS = [
  { id: 'keypad', start: 0.0, end: 1.8 }, // 特写：密码锁 + 发抖的手指
  { id: 'wide1', start: 1.8, end: 4.15 }, // 全景：门口，左顾右盼
  { id: 'face', start: 4.15, end: 6.3 }, // 近景：眼珠乱转、咽口水
  { id: 'alarm', start: 6.3, end: 8.2 }, // 幻想：警报、非法闯入
  { id: 'reality', start: 8.2, end: 9.15 }, // 切回现实：乌鸦、尴尬笑
  { id: 'wide2', start: 9.15, end: 12.15 }, // 全景（结尾呼应机位）：开溜
];
export const shotAt = (t) => SHOTS.find((s) => t >= s.start && t < s.end) || SHOTS[SHOTS.length - 1];
export const FACE0 = 4.2; // 眼珠乱转的木鱼声从这里开始
export const WIDE2 = 9.15;

export const T = {
  look1: 2.55,
  look2: 3.2,
  gulp: 5.45,
  alarm: 6.30,
  scream: 6.42,
  sign: 6.52,
  brake: 8.12,
  quiet: 8.20,
  crow1: 8.60,
  smile: 8.73,
  retract: 9.40,
  turn: 9.85,
  walk: 10.00,
  dash: 10.55,
  exit: 11.00,
  crow2: 10.85,
  stamp: 11.15,
};

export const HEARTBEATS = [0.15, 0.95, 1.7, 2.45, 3.15, 3.75, 4.25, 4.75, 5.2, 5.6, 5.88, 6.1];

export const VO = [
  { id: 'l1', start: 0.25, text: '两年前，Tim 第一次来到 EOE。' },
  { id: 'l2', start: 4.42, text: '因为不敢按密码……' },
  { id: 'l3', start: 9.45, text: '于是，他跑了。' },
];

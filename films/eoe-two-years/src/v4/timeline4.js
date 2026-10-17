// 正式样片（火柴人版第一幕）时间轴：画面和声音共用；配音是 Tim 本人声音（合成）
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 11.6;
export const VODIR = 'vo-tim';

export const SHOTS = [
  { id: 'keypad', start: 0.0, end: 1.8 }, // 特写：密码锁 + 发抖的手指
  { id: 'wide1', start: 1.8, end: 4.15 }, // 全景：门口，左顾右盼
  { id: 'face', start: 4.15, end: 5.75 }, // 近景：眼珠乱转、咽口水
  { id: 'alarm', start: 5.75, end: 7.65 }, // 幻想：警报、非法闯入
  { id: 'reality', start: 7.65, end: 8.6 }, // 切回现实：乌鸦、尴尬笑
  { id: 'wide2', start: 8.6, end: 11.6 }, // 全景（结尾呼应机位）：开溜
];
export const shotAt = (t) => SHOTS.find((s) => t >= s.start && t < s.end) || SHOTS[SHOTS.length - 1];
export const FACE0 = 4.2; // 眼珠乱转的木鱼声从这里开始
export const WIDE2 = 8.6;

export const T = {
  look1: 2.55,
  look2: 3.2,
  gulp: 5.0,
  alarm: 5.75,
  scream: 5.87,
  sign: 5.97,
  brake: 7.57,
  quiet: 7.65,
  crow1: 8.05,
  smile: 8.18,
  retract: 8.85,
  turn: 9.3,
  walk: 9.45,
  dash: 10.0,
  exit: 10.45,
  crow2: 10.3,
  stamp: 10.6,
};

export const HEARTBEATS = [0.15, 0.95, 1.7, 2.45, 3.15, 3.75, 4.25, 4.7, 5.05, 5.32, 5.55];

export const VO = [
  { id: 'l1', start: 0.25, text: '两年前，Tim 第一次来到 EOE。' },
  { id: 'l2', start: 4.3, text: '因为不敢按密码……' },
  { id: 'l3', start: 8.9, text: '于是，他跑了。' },
];

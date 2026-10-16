// 开场样片时间轴：画面和声音共用的唯一来源（单位：秒）
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 10.95;

// 镜头表：每个镜头一个时间段，film.js 按 id 分派绘制
export const SHOTS = [
  { id: 'keypad', start: 0.0, end: 1.75 }, // 特写：密码锁 + 发抖的手指
  { id: 'wide1', start: 1.75, end: 3.7 }, // 全景：门口，左顾右盼
  { id: 'face', start: 3.7, end: 5.35 }, // 近景：反打，手指逼近镜头
  { id: 'alarm', start: 5.35, end: 7.35 }, // 幻想：警报、红灯、非法闯入
  { id: 'reality', start: 7.35, end: 8.3 }, // 切回现实：安静，乌鸦
  { id: 'wide2', start: 8.3, end: 10.95 }, // 全景（结尾呼应机位）：转身开溜
];
export const shotAt = (t) => SHOTS.find((s) => t >= s.start && t < s.end) || SHOTS[SHOTS.length - 1];

// 关键节点
export const T = {
  finger: 0.35, // 手指入画
  look1: 2.35, // 左看
  look2: 2.95, // 右看
  gulp: 4.4, // 咽口水
  alarm: 5.35, // 幻想开始
  sign: 5.57, // 「非法闯入？！」砸下来
  scream: 5.47, // 尖叫跳起
  brake: 7.27, // 唱片刹车
  quiet: 7.35, // 切回现实
  crow1: 7.77, // 第一声乌鸦
  smile: 7.9, // 尴尬笑
  retract: 8.5, // 收回手指
  turn: 9.1, // 转身
  walk: 9.3, // 开始走
  dash: 9.8, // 开溜加速
  exit: 10.3, // 出画
  crow2: 10.15,
  stamp: 10.33, // 「第 1 次尝试：撤退！」
};

// 心跳：越来越快，到幻想时最密
export const HEARTBEATS = [0.15, 0.95, 1.7, 2.4, 3.05, 3.6, 4.05, 4.5, 4.85, 5.08, 5.27];

// 配音（文件由 scripts/vo.py 生成）；字幕和配音同一份文字
export const VO = [
  { id: 'l1', start: 0.3, text: '两年前，Tim 第一次来到 EOE。' },
  { id: 'l2', start: 3.7, text: '因为不敢按密码……' },
  { id: 'l3', start: 8.8, text: '于是，他跑了。' },
];
// 字幕显示时长：由 assets/vo/durations.json 回填，没有时用估计值
export const VO_EST = { l1: 3.0, l2: 1.7, l3: 1.3 };

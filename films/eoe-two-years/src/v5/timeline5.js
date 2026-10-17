// 完整版时间轴（约 90 秒）：每幕时长、旁白位置、节点；画面和声音共用
// 第一幕沿用正式样片（src/v4/timeline4.js）
import * as A1 from '../v4/timeline4.js';

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const VODIR = 'vo-tim/full';

export const ACT2 = {
  dur: 7.9,
  vo: [['a2_1', 0.3], ['a2_2', 3.9]],
  beats: { typeAt: 0.7, open: 3.7, levelUp: 5.6 },
};
export const ACT3 = {
  dur: 12.2,
  vo: [['a3_1', 0.3], ['a3_2', 4.2], ['a3_3', 9.5]],
  beats: { clap: 4.0, everyone: 5.7, second: 9.4, third: 10.8 },
};
export const ACT4 = {
  dur: 9.0,
  vo: [['a4_1', 0.4], ['a4_2', 4.4]],
  beats: { bench: 2.3, phone: 4.3, hand: 7.6 },
};
// 新增：周四（开会、嗦粉火锅撸串、互损互学、能量场）
export const ACTT = {
  dur: 13.2,
  vo: [['t_1', 0.3], ['t_2', 5.8], ['t_3', 9.8]],
  beats: { meet: 1.4, fen: 2.6, pot: 3.6, bbq: 4.5, tease: 5.6, learn: 7.6, energy: 9.6 },
};
export const ACT5 = {
  dur: 11.4,
  vo: [['a5_1', 0.3], ['a5_2', 3.8], ['a5_3', 7.3]],
  beats: { crown: 0.6, montage: 3.6, dance: 7.2 },
};
export const ACT6 = {
  dur: 16.2,
  vo: [['a6_1', 0.3], ['a6_2', 5.6], ['a6_3', 11.9]],
  beats: { magic: 1.2, standup: 2.2, speech: 3.2, lottery: 4.2, aside: 5.5, dinner: 10.4 },
};
export const ACT7 = {
  dur: 12.45,
  vo: [['a7_1', 0.5], ['a7_2', 4.6]],
  beats: { type: 2.4, open: 3.9, walkIn: 5.6, photo: 8.2, end: 9.8 },
};

export const ACTS = [
  { id: 'a1', dur: A1.DURATION, vo: A1.VO.map((v) => [v.id, v.start]) },
  { id: 'a2', ...ACT2 },
  { id: 'a3', ...ACT3 },
  { id: 'a4', ...ACT4 },
  { id: 'at', ...ACTT },
  { id: 'a5', ...ACT5 },
  { id: 'a6', ...ACT6 },
  { id: 'a7', ...ACT7 },
];
let acc = 0;
for (const a of ACTS) {
  a.start = acc;
  acc += a.dur;
}
export const DURATION = acc;
export const actAt = (t) => ACTS.find((a) => t >= a.start && t < a.start + a.dur) || ACTS[ACTS.length - 1];

// 字幕文字（和配音同一份，配音念法另写在合成脚本里）
export const TEXT = {
  l1: '两年前，Tim 第一次来到 EOE。', l2: '因为不敢按密码……', l3: '于是，他跑了。',
  a2_1: '第二次，他终于混进去了。', a2_2: '没想到……这一混，就是两年。',
  a3_1: '第一次上台，稿子抖得比声音还响。', a3_2: '台下有人在憋笑……后来才知道，谁第一次都这么抖。', a3_3: '抖着抖着，也就不抖了。',
  a4_1: '后来，生活给他来了个急转弯。', a4_2: '工作没了，周四的会，一次也没落下。',
  t_1: '每周四开会，开完一起嗦螺蛳粉、涮火锅、撸串。', t_2: '互相损，互相学，顺便学会了自嘲。', t_3: '周四，成了大家的能量场。',
  a5_1: '阴差阳错，他还当上了会长。', a5_2: '虽然依然忘词、抠门、单身……', a5_3: '活儿越揽越多，人却越来越松弛。',
  a6_1: '两周年庆：魔术、脱口秀、演讲、抽奖，一样不少。', a6_2: '忙完才发现，比自己上台更爽的，是一起把事办成。', a6_3: '付出这件事，最赚的，其实是自己。',
  a7_1: '两年前，他连这扇门都不敢打开。', a7_2: '两年后……这里，有了一群温暖、并肩作战的伙伴。',
};
// 全片旁白（绝对时间）
export const VO_ALL = ACTS.flatMap((a) => a.vo.map(([id, at]) => ({ id, start: a.start + at, text: TEXT[id] })));

// 完整版时间轴（约 70+ 秒）：每幕时长、旁白位置、节点；画面和声音共用
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
  dur: 10.45,
  vo: [['a3_1', 0.3], ['a3_2', 4.3], ['a3_3', 7.9]],
  beats: { clap: 4.2, second: 7.8, third: 9.2 },
};
export const ACT4 = {
  dur: 8.5,
  vo: [['a4_1', 0.4], ['a4_2', 4.6]],
  beats: { bench: 2.3, phone: 4.4, hand: 7.2 },
};
export const ACT5 = {
  dur: 11.4,
  vo: [['a5_1', 0.3], ['a5_2', 3.8], ['a5_3', 7.3]],
  beats: { crown: 0.6, montage: 3.6, dance: 7.2 },
};
export const ACT6 = {
  dur: 12.15,
  vo: [['a6_1', 0.3], ['a6_2', 2.9], ['a6_3', 5.85], ['a6_4', 8.45]],
  beats: { show: 2.8, aside: 5.8, dinner: 8.3 },
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
  a3_1: '第一次上台，稿子抖得比声音还响。', a3_2: '可这里的人，从来不嫌他笨拙。', a3_3: '他们只是一次次鼓掌。',
  a4_1: '后来，生活给他来了个急转弯。', a4_2: '但这群人，好像没打算让他闲着。',
  a5_1: '阴差阳错，他还当上了会长。', a5_2: '虽然依然忘词、抠门、单身……', a5_3: '但他开始学着承担，也学着放松。',
  a6_1: '直到那场两周年庆……', a6_2: '他才发现，最开心的事，', a6_3: '不是自己站在舞台中央。', a6_4: '而是和大家一起，把一件事做成。',
  a7_1: '两年前，他连这扇门都不敢打开。', a7_2: '两年后……这里，有了一群温暖、并肩作战的伙伴。',
};
// 全片旁白（绝对时间）
export const VO_ALL = ACTS.flatMap((a) => a.vo.map(([id, at]) => ({ id, start: a.start + at, text: TEXT[id] })));

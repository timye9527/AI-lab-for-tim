// 画幅：默认横版 1920×1080；网址带 ?fmt=v 时出竖版 1080×1920（手机）
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const VERTICAL = q.get('fmt') === 'v';
export const W = VERTICAL ? 1080 : 1920;
export const H = VERTICAL ? 1920 : 1080;
// 竖版上下黑边之间的画面区域（字幕放在下黑边里）
export const PIC = VERTICAL ? { top: 180, bottom: 1520 } : { top: 132, bottom: 948 };

// 65 个镜头的画面：每个镜头 (c, t, X) → t 是镜头内时间，X.d 镜头时长，X.L[i].s / .e 第 i 句口播的起止
// 内容一一对应 storyboard.mjs 的 visual / camera 描述；按幕分文件
import { A01 } from './shots-a01.js';
import { A2 } from './shots-a2.js';
import { A3 } from './shots-a3.js';
import { A4 } from './shots-a4.js';
import { A5 } from './shots-a5.js';
import { A6 } from './shots-a6.js';
export const DRAW = { ...A01, ...A2, ...A3, ...A4, ...A5, ...A6 };

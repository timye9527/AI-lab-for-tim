// 段位图标：几根韭菜 + 一个点题的小道具，纯 SVG，网页和海报共用

const leaves = (c) => `
  <path d="M44 96 C42 72 36 52 24 40" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M56 98 C56 70 54 46 50 26" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M66 96 C68 74 74 56 84 44" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>`;

const props = {
  // 韭菜盒子：被包进去了
  dumpling: (c, g) => `
    ${leaves(c)}
    <path d="M18 84 Q60 46 102 84 Q60 104 18 84 Z" fill="${g}" opacity=".92"/>
    <path d="M30 80 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0" stroke="#7a5a26" stroke-width="2.5" fill="none"/>`,
  // 渡劫失败：上炷香
  incense: (c) => `
    ${leaves(c)}
    <line x1="92" y1="98" x2="92" y2="46" stroke="#cfcfcf" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="92" cy="44" r="4" fill="#f08a5d"/>
    <path d="M92 38 C86 30 98 24 92 14" stroke="#9a9a9a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  // 割了又长：齐刷刷的茬 + 新芽
  regrow: (c, g) => `
    <path d="M38 98 L38 62" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
    <path d="M52 98 L52 58" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
    <path d="M66 98 L66 60" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
    <path d="M80 98 C80 76 84 60 94 48" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M30 56 L74 56" stroke="${g}" stroke-width="2" stroke-dasharray="4 4"/>`,
  // 清醒：睁着眼
  eye: (c, g) => `
    ${leaves(c)}
    <path d="M30 24 Q60 2 90 24 Q60 46 30 24 Z" fill="none" stroke="${g}" stroke-width="3"/>
    <circle cx="60" cy="24" r="7" fill="${g}"/>`,
  // 成精：冒光
  spark: (c, g) => `
    ${leaves(c)}
    <path d="M92 14 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z" fill="${g}"/>
    <path d="M24 16 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" fill="${g}" opacity=".8"/>`,
  // 绝缘体：戴王冠
  crown: (c, g) => `
    ${leaves(c)}
    <path d="M36 22 L44 8 L52 18 L60 4 L68 18 L76 8 L84 22 Z" fill="${g}"/>
    <rect x="36" y="22" width="48" height="6" rx="2" fill="${g}"/>`,
};

export function tierIcon(name, accent, gold) {
  const draw = props[name] || ((c) => leaves(c));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">${draw(accent, gold)}</svg>`;
}

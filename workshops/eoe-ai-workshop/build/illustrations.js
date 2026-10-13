// 辣条故事插画：手写 SVG → PNG（透明底）
// 风格跟 EOE 会员闪光录一致：黑色粗描边 + 砖红/橙/浅蓝/奶油色
// 用法：node illustrations.js <assets目录>
const sharp = require("sharp");
const path = require("path");

const OUT = process.argv[2] || "../assets";
const C = {
  line: "#1A1A1A", navy: "#173659", brick: "#C15145", brickDark: "#9E3E34",
  orange: "#E77738", yel: "#F5B21B", blue: "#B2C3F7", blueLight: "#D6E0FB",
  cream: "#FAF3D7", white: "#FFFFFF", skin: "#F6C9A4", skinDark: "#E3AD86", hair: "#1A1A1A",
};
const FONT = "Noto Sans CJK SC, Microsoft YaHei, sans-serif";
const LW = 7; // 描边粗细
const STYLE = `<style>.o{stroke:${C.line};stroke-width:${LW};stroke-linejoin:round}</style>`;

// 带黑描边的粗线条四肢
const limb = (pts, color, w) => {
  const p = pts.map((q) => q.join(",")).join(" ");
  const base = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  return `<polyline points="${p}" ${base} stroke="${C.line}" stroke-width="${w + LW * 2}"/>
    <polyline points="${p}" ${base} stroke="${color}" stroke-width="${w}"/>`;
};
const speed = (pts) => pts.map(([x1, y, x2]) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${C.line}" stroke-width="8" stroke-linecap="round"/>`).join("");

// 辣条包装（插画用，非真实品牌）
function latiaoPack(x, y, s = 1, rot = 0) {
  let d = "M10 30 ";
  for (let i = 0; i <= 10; i++) d += `L${10 + i * 18} ${i % 2 ? 18 : 30} `;
  d += "L190 290 ";
  for (let i = 10; i >= 0; i--) d += `L${10 + i * 18} ${i % 2 ? 302 : 290} `;
  d += "Z";
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path class="o" d="${d}" fill="${C.brick}"/>
    <rect x="22" y="52" width="16" height="216" rx="8" fill="#FFFFFF" opacity="0.25"/>
    <ellipse class="o" cx="100" cy="160" rx="66" ry="76" fill="${C.cream}"/>
    <path d="M78 110 C 104 100, 132 116, 126 144 C 120 172, 96 186, 82 196 C 86 168, 64 138, 78 110 Z" fill="${C.brick}"/>
    <path d="M90 96 C 102 86, 120 90, 126 104 C 114 100, 100 100, 90 96 Z" fill="#3A9E6F"/>
    <text x="100" y="228" font-family="${FONT}" font-weight="900" font-size="40" fill="${C.brick}" text-anchor="middle">辣条</text>
  </g>`;
}

const svgs = {};

// 1. 沙发上翘二郎腿的哥哥
svgs.brother_sofa = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="640" viewBox="0 0 900 640">${STYLE}
  <ellipse cx="430" cy="604" rx="380" ry="20" fill="#000" opacity="0.08"/>
  <rect class="o" x="150" y="540" width="26" height="46" rx="8" fill="${C.navy}"/>
  <rect class="o" x="690" y="540" width="26" height="46" rx="8" fill="${C.navy}"/>
  <rect class="o" x="120" y="230" width="620" height="230" rx="56" fill="${C.blue}"/>
  <rect class="o" x="120" y="400" width="620" height="140" rx="44" fill="${C.blueLight}"/>
  <rect class="o" x="70" y="300" width="120" height="250" rx="52" fill="${C.blue}"/>
  <rect class="o" x="670" y="300" width="120" height="250" rx="52" fill="${C.blue}"/>
  <rect class="o" x="140" y="290" width="110" height="96" rx="30" fill="${C.yel}" transform="rotate(-10 195 338)"/>
  ${limb([[370, 450], [510, 450], [520, 566]], C.navy, 50)}
  <ellipse class="o" cx="540" cy="578" rx="40" ry="16" fill="${C.white}"/>
  ${limb([[350, 440], [450, 360], [560, 420]], C.navy, 50)}
  <ellipse class="o" cx="598" cy="410" rx="40" ry="17" fill="${C.white}" transform="rotate(-25 598 410)"/>
  <rect class="o" x="290" y="250" width="150" height="210" rx="64" fill="${C.orange}"/>
  ${limb([[420, 290], [520, 250], [596, 262]], C.orange, 38)}
  <circle class="o" cx="608" cy="262" r="20" fill="${C.skin}"/>
  ${limb([[310, 300], [272, 380], [326, 400]], C.orange, 38)}
  <rect class="o" x="320" y="370" width="66" height="26" rx="10" fill="${C.navy}" transform="rotate(-18 350 383)"/>
  <circle class="o" cx="335" cy="400" r="20" fill="${C.skin}"/>
  <rect class="o" x="347" y="214" width="36" height="40" rx="12" fill="${C.skinDark}"/>
  <circle class="o" cx="365" cy="170" r="72" fill="${C.skin}"/>
  <path d="M290 162 C 288 96, 360 76, 412 96 C 442 108, 448 140, 440 158 C 420 130, 380 124, 352 138 C 330 128, 300 140, 290 162 Z" fill="${C.hair}"/>
  <path d="M332 176 q 14 -10 28 0" stroke="${C.line}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M384 176 q 14 -10 28 0" stroke="${C.line}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M348 208 q 28 18 54 -4" stroke="${C.line}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <circle cx="328" cy="200" r="11" fill="${C.orange}" opacity="0.45"/>
  <circle cx="422" cy="200" r="11" fill="${C.orange}" opacity="0.45"/>
</svg>`;

// 2. 拿着钱一路小跑的我
svgs.kid_run = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="560" viewBox="0 0 460 560">${STYLE}
  <ellipse cx="230" cy="538" rx="140" ry="13" fill="#000" opacity="0.08"/>
  ${speed([[40, 250, 110], [20, 300, 100], [50, 350, 110]])}
  ${limb([[225, 360], [170, 430], [112, 448]], C.navy, 32)}
  ${limb([[235, 360], [290, 440], [272, 510]], C.navy, 32)}
  <ellipse class="o" cx="292" cy="520" rx="34" ry="14" fill="${C.white}"/>
  <ellipse class="o" cx="96" cy="446" rx="30" ry="13" fill="${C.white}" transform="rotate(-20 96 446)"/>
  ${limb([[220, 250], [160, 300], [132, 272]], C.yel, 26)}
  <rect class="o" x="180" y="210" width="100" height="160" rx="44" fill="${C.yel}" transform="rotate(14 230 290)"/>
  ${limb([[260, 250], [320, 290], [356, 254]], C.yel, 26)}
  <circle class="o" cx="364" cy="244" r="17" fill="${C.skin}"/>
  <circle class="o" cx="388" cy="218" r="22" fill="${C.yel}"/>
  <text x="388" y="226" font-family="${FONT}" font-weight="900" font-size="22" fill="${C.line}" text-anchor="middle">¥</text>
  <circle class="o" cx="266" cy="150" r="62" fill="${C.skin}"/>
  <path d="M204 142 C 204 86, 270 68, 314 96 C 332 108, 332 128, 328 140 C 300 116, 260 116, 240 126 C 226 118, 210 126, 204 142 Z" fill="${C.hair}"/>
  <circle cx="262" cy="156" r="7" fill="${C.line}"/>
  <circle cx="300" cy="156" r="7" fill="${C.line}"/>
  <path d="M268 184 q 18 12 34 -2" stroke="${C.line}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M192 118 q -10 -18 6 -30" stroke="${C.navy}" stroke-width="7" fill="none" stroke-linecap="round"/>
</svg>`;

// 3. 跑腿的 AI 小机器人（手里拿着辣条）
svgs.robot_run = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="560" viewBox="0 0 520 560">${STYLE}
  <ellipse cx="260" cy="538" rx="160" ry="13" fill="#000" opacity="0.08"/>
  ${speed([[30, 260, 110], [10, 310, 96], [40, 360, 110]])}
  ${limb([[240, 380], [180, 450], [120, 464]], C.navy, 30)}
  ${limb([[262, 380], [320, 450], [302, 512]], C.navy, 30)}
  <rect class="o" x="268" y="504" width="70" height="26" rx="12" fill="${C.white}"/>
  <rect class="o" x="78" y="452" width="62" height="26" rx="12" fill="${C.white}" transform="rotate(-18 110 465)"/>
  ${limb([[220, 280], [160, 330], [132, 302]], C.orange, 24)}
  <rect class="o" x="180" y="230" width="150" height="170" rx="44" fill="${C.orange}"/>
  <circle class="o" cx="255" cy="310" r="26" fill="${C.cream}"/>
  <path d="M243 310 l8 9 l16 -18" stroke="${C.line}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  ${limb([[300, 280], [360, 300], [390, 264]], C.orange, 24)}
  ${latiaoPack(360, 150, 0.42, 14)}
  <line x1="268" y1="58" x2="268" y2="26" stroke="${C.line}" stroke-width="8" stroke-linecap="round"/>
  <circle class="o" cx="268" cy="22" r="14" fill="${C.yel}"/>
  <rect class="o" x="176" y="56" width="184" height="160" rx="48" fill="${C.cream}"/>
  <rect class="o" x="200" y="88" width="136" height="88" rx="30" fill="${C.navy}"/>
  <rect x="226" y="112" width="20" height="34" rx="10" fill="${C.blue}"/>
  <rect x="290" y="112" width="20" height="34" rx="10" fill="${C.blue}"/>
  <path d="M248 160 q 20 12 40 0" stroke="${C.blue}" stroke-width="7" fill="none" stroke-linecap="round"/>
</svg>`;

// 4. 对面的小卖部
const stripes = Array.from({ length: 8 }, (_, i) =>
  `<path class="o" d="M${60 + i * 65} 120 h65 v80 a32.5 26 0 0 1 -65 0 Z" fill="${i % 2 ? C.cream : C.brick}"/>`).join("");
const packs = [0, 1, 2, 3, 4].map((i) => latiaoPack(352 + i * 30, 296, 0.14, (i % 2 ? 6 : -6))).join("");
svgs.shop = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="560" viewBox="0 0 640 560">${STYLE}
  <ellipse cx="320" cy="542" rx="300" ry="13" fill="#000" opacity="0.08"/>
  <rect class="o" x="60" y="150" width="520" height="380" fill="${C.white}"/>
  <rect class="o" x="80" y="40" width="480" height="90" rx="16" fill="${C.navy}"/>
  <text x="320" y="106" font-family="${FONT}" font-weight="900" font-size="58" fill="${C.cream}" text-anchor="middle">小卖部</text>
  ${stripes}
  <rect class="o" x="100" y="270" width="160" height="260" rx="10" fill="${C.blue}"/>
  <circle cx="236" cy="404" r="9" fill="${C.line}"/>
  <rect class="o" x="320" y="270" width="220" height="160" rx="10" fill="${C.blueLight}"/>
  <line x1="320" y1="344" x2="540" y2="344" stroke="${C.line}" stroke-width="6"/>
  ${packs}
  <rect class="o" x="332" y="370" width="32" height="40" rx="6" fill="${C.yel}"/>
  <rect class="o" x="372" y="362" width="26" height="48" rx="6" fill="${C.orange}"/>
  <rect class="o" x="406" y="374" width="40" height="36" rx="6" fill="${C.navy}"/>
  <rect class="o" x="454" y="366" width="30" height="44" rx="6" fill="${C.brick}"/>
  <rect class="o" x="492" y="372" width="36" height="38" rx="6" fill="${C.yel}"/>
  <rect class="o" x="320" y="450" width="220" height="80" rx="8" fill="${C.orange}"/>
</svg>`;

// 5. 电视
svgs.tv = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="300" viewBox="0 0 360 300">${STYLE}
  <path d="M150 220 L130 270 M210 220 L230 270" stroke="${C.line}" stroke-width="14" stroke-linecap="round"/>
  <rect class="o" x="100" y="262" width="160" height="16" rx="8" fill="${C.navy}"/>
  <rect class="o" x="20" y="20" width="320" height="200" rx="22" fill="${C.navy}"/>
  <rect class="o" x="40" y="40" width="280" height="160" rx="12" fill="${C.blue}"/>
  <circle class="o" cx="120" cy="108" r="30" fill="${C.yel}"/>
  <path class="o" d="M40 176 L120 126 L190 172 L250 134 L320 180 L320 200 L40 200 Z" fill="${C.orange}"/>
</svg>`;

(async () => {
  for (const [name, svg] of Object.entries(svgs)) {
    const out = path.join(OUT, `ill_${name}.png`);
    await sharp(Buffer.from(svg), { density: 216 }).png().toFile(out);
    console.log(out);
  }
})();

// 辣条故事插画：手写 SVG → PNG（透明底）
// 用法：node illustrations.js <assets目录>
const sharp = require("sharp");
const path = require("path");

const OUT = process.argv[2] || "../assets";
const C = {
  ink: "#1E1B2E", ink2: "#2B2742", red: "#E8452C", redDark: "#B8321D",
  yel: "#FFB81C", blue: "#4C6FFF", blueDark: "#2F4BD6", teal: "#14A38B",
  skin: "#F6C9A4", skinDark: "#E3AD86", hair: "#2B2233", white: "#FFFFFF",
  sofa: "#3E4C8F", sofaLight: "#5062B0", wall: "#F1ECE8",
};
const FONT = "Noto Sans CJK SC, Microsoft YaHei, sans-serif";

// 粗线条四肢
const limb = (pts, color, w) =>
  `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// 辣条包装，可复用
function latiaoPack(x, y, s = 1, rot = 0) {
  // 锯齿封口的包装外形
  let d = "M10 30 ";
  for (let i = 0; i <= 10; i++) d += `L${10 + i * 18} ${i % 2 ? 18 : 30} `;
  d += "L190 290 ";
  for (let i = 10; i >= 0; i--) d += `L${10 + i * 18} ${i % 2 ? 302 : 290} `;
  d += "Z";
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="${d}" fill="${C.redDark}"/>
    <rect x="10" y="44" width="180" height="232" fill="${C.red}"/>
    <rect x="22" y="52" width="18" height="216" rx="9" fill="#FFFFFF" opacity="0.2"/>
    <ellipse cx="100" cy="160" rx="70" ry="80" fill="#FFFFFF"/>
    <path d="M86 92 C 100 80, 122 86, 128 104 C 114 98, 98 98, 86 92 Z" fill="${C.teal}"/>
    <path d="M76 106 C 102 98, 132 112, 128 140 C 122 170, 96 186, 80 196 C 84 168, 62 136, 76 106 Z" fill="${C.red}"/>
    <text x="100" y="230" font-family="${FONT}" font-weight="900" font-size="44" fill="${C.red}" text-anchor="middle">辣条</text>
  </g>`;
}

const svgs = {};

// 1. 沙发上翘二郎腿的哥哥
svgs.brother_sofa = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="640" viewBox="0 0 900 640">
  <ellipse cx="430" cy="600" rx="380" ry="22" fill="#000" opacity="0.10"/>
  <rect x="120" y="230" width="620" height="230" rx="56" fill="${C.sofa}"/>
  <rect x="120" y="400" width="620" height="140" rx="44" fill="${C.sofaLight}"/>
  <rect x="70" y="300" width="120" height="250" rx="52" fill="${C.sofa}"/>
  <rect x="670" y="300" width="120" height="250" rx="52" fill="${C.sofa}"/>
  <rect x="150" y="540" width="26" height="46" rx="8" fill="${C.ink2}"/>
  <rect x="690" y="540" width="26" height="46" rx="8" fill="${C.ink2}"/>
  <rect x="140" y="290" width="110" height="96" rx="30" fill="${C.teal}" transform="rotate(-10 195 338)"/>
  <!-- 腿：一条着地，一条翘成二郎腿 -->
  ${limb([[370, 450], [510, 450], [520, 570]], C.ink2, 52)}
  <ellipse cx="540" cy="578" rx="40" ry="16" fill="${C.ink}"/>
  ${limb([[350, 440], [450, 360], [560, 420]], C.ink, 52)}
  <ellipse cx="596" cy="410" rx="40" ry="17" fill="${C.white}" transform="rotate(-25 596 410)"/>
  <!-- 身体 -->
  <rect x="290" y="250" width="150" height="210" rx="64" fill="${C.yel}"/>
  <!-- 手臂：一只搭沙发背，一只拿遥控器 -->
  ${limb([[420, 290], [520, 250], [600, 262]], C.yel, 40)}
  <circle cx="606" cy="262" r="20" fill="${C.skin}"/>
  ${limb([[310, 300], [270, 380], [330, 400]], C.yel, 40)}
  <rect x="320" y="372" width="66" height="26" rx="10" fill="${C.ink}" transform="rotate(-18 350 385)"/>
  <circle cx="335" cy="398" r="20" fill="${C.skin}"/>
  <!-- 头 -->
  <rect x="347" y="214" width="36" height="40" rx="12" fill="${C.skinDark}"/>
  <circle cx="365" cy="170" r="72" fill="${C.skin}"/>
  <path d="M292 160 C 292 96, 360 78, 410 96 C 440 108, 446 140, 438 156 C 420 130, 380 124, 352 138 C 330 128, 300 140, 292 160 Z" fill="${C.hair}"/>
  <path d="M332 176 q 14 -10 28 0" stroke="${C.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M384 176 q 14 -10 28 0" stroke="${C.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M350 210 q 26 16 50 -4" stroke="${C.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="330" cy="200" r="10" fill="#F29C8A" opacity="0.6"/>
  <circle cx="420" cy="200" r="10" fill="#F29C8A" opacity="0.6"/>
</svg>`;

// 2. 拿着钱一路小跑的我
svgs.kid_run = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="560" viewBox="0 0 460 560">
  <ellipse cx="230" cy="535" rx="140" ry="14" fill="#000" opacity="0.10"/>
  ${limb([[40, 250], [110, 250]], C.ink, 8)}${limb([[20, 300], [100, 300]], C.ink, 8)}${limb([[50, 350], [110, 350]], C.ink, 8)}
  ${limb([[225, 360], [170, 430], [110, 450]], C.ink2, 34)}
  ${limb([[235, 360], [290, 440], [270, 515]], C.ink2, 34)}
  <ellipse cx="292" cy="520" rx="34" ry="14" fill="${C.ink}"/>
  <ellipse cx="96" cy="446" rx="30" ry="13" fill="${C.ink}" transform="rotate(-20 96 446)"/>
  ${limb([[220, 250], [160, 300], [130, 270]], C.teal, 28)}
  <rect x="180" y="210" width="100" height="160" rx="44" fill="${C.teal}" transform="rotate(14 230 290)"/>
  ${limb([[260, 250], [320, 290], [360, 250]], C.teal, 28)}
  <circle cx="364" cy="244" r="17" fill="${C.skin}"/>
  <circle cx="384" cy="222" r="22" fill="${C.yel}" stroke="#D99400" stroke-width="5"/>
  <text x="384" y="230" font-family="${FONT}" font-weight="900" font-size="22" fill="#A86E00" text-anchor="middle">¥</text>
  <circle cx="266" cy="150" r="62" fill="${C.skin}"/>
  <path d="M206 140 C 206 86, 270 70, 312 96 C 330 108, 330 128, 326 138 C 300 116, 260 116, 240 126 C 226 118, 210 126, 206 140 Z" fill="${C.hair}"/>
  <circle cx="262" cy="156" r="7" fill="${C.ink}"/>
  <circle cx="300" cy="156" r="7" fill="${C.ink}"/>
  <path d="M268 184 q 18 12 34 -2" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M196 120 q -10 -18 6 -30" stroke="#7FB5FF" stroke-width="6" fill="none" stroke-linecap="round"/>
</svg>`;

// 3. 跑腿的 AI 机器人（手里拿着辣条）
svgs.robot_run = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="560" viewBox="0 0 520 560">
  <ellipse cx="260" cy="535" rx="160" ry="14" fill="#000" opacity="0.10"/>
  ${limb([[30, 260], [110, 260]], C.blue, 8)}${limb([[10, 310], [96, 310]], C.blue, 8)}${limb([[40, 360], [110, 360]], C.blue, 8)}
  ${limb([[240, 380], [180, 450], [118, 466]], C.blueDark, 32)}
  ${limb([[262, 380], [320, 450], [300, 518]], C.blueDark, 32)}
  <rect x="268" y="504" width="70" height="26" rx="12" fill="${C.ink}"/>
  <rect x="78" y="452" width="62" height="26" rx="12" fill="${C.ink}" transform="rotate(-18 110 465)"/>
  ${limb([[220, 280], [160, 330], [130, 300]], C.blueDark, 26)}
  <rect x="180" y="230" width="150" height="170" rx="44" fill="${C.blue}"/>
  <circle cx="255" cy="310" r="26" fill="${C.yel}"/>
  <path d="M243 310 l8 9 l16 -18" stroke="${C.ink}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  ${limb([[300, 280], [360, 300], [392, 262]], C.blueDark, 26)}
  ${latiaoPack(360, 150, 0.42, 14)}
  <line x1="268" y1="58" x2="268" y2="24" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="268" cy="20" r="14" fill="${C.yel}"/>
  <rect x="176" y="56" width="184" height="160" rx="48" fill="${C.white}" stroke="${C.blue}" stroke-width="10"/>
  <rect x="200" y="88" width="136" height="88" rx="30" fill="${C.ink}"/>
  <rect x="226" y="112" width="20" height="34" rx="10" fill="#7DF0D6"/>
  <rect x="290" y="112" width="20" height="34" rx="10" fill="#7DF0D6"/>
  <path d="M248 160 q 20 12 40 0" stroke="#7DF0D6" stroke-width="6" fill="none" stroke-linecap="round"/>
</svg>`;

// 4. 一包辣条
svgs.latiao = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="340" viewBox="0 0 240 340">
  ${latiaoPack(20, 10, 1, 0)}
</svg>`;

// 5. 对面的小卖部
const stripes = Array.from({ length: 8 }, (_, i) =>
  `<rect x="${40 + i * 65}" y="120" width="65" height="80" fill="${i % 2 ? C.white : C.red}"/>
   <path d="M${40 + i * 65} 200 a32.5 26 0 0 0 65 0 Z" fill="${i % 2 ? C.white : C.red}"/>`).join("");
const packs = [0, 1, 2, 3, 4].map((i) => latiaoPack(352 + i * 30, 300, 0.14, (i % 2 ? 6 : -6))).join("");
svgs.shop = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="560" viewBox="0 0 640 560">
  <ellipse cx="320" cy="540" rx="300" ry="14" fill="#000" opacity="0.10"/>
  <rect x="60" y="150" width="520" height="380" fill="${C.wall}"/>
  <rect x="80" y="40" width="480" height="90" rx="16" fill="${C.ink}"/>
  <text x="320" y="106" font-family="${FONT}" font-weight="900" font-size="58" fill="${C.yel}" text-anchor="middle">小卖部</text>
  ${stripes}
  <rect x="100" y="270" width="160" height="260" rx="10" fill="${C.sofa}"/>
  <circle cx="236" cy="404" r="8" fill="${C.yel}"/>
  <rect x="320" y="270" width="220" height="160" rx="10" fill="#CFE3FF"/>
  <rect x="320" y="340" width="220" height="8" fill="${C.ink2}" opacity="0.5"/>
  <rect x="320" y="410" width="220" height="8" fill="${C.ink2}" opacity="0.5"/>
  ${packs}
  <rect x="330" y="372" width="34" height="36" rx="6" fill="${C.yel}"/>
  <rect x="372" y="364" width="26" height="44" rx="6" fill="${C.teal}"/>
  <rect x="406" y="376" width="40" height="32" rx="6" fill="${C.blue}"/>
  <rect x="454" y="368" width="30" height="40" rx="6" fill="${C.red}"/>
  <rect x="492" y="374" width="36" height="34" rx="6" fill="${C.yel}"/>
  <rect x="320" y="450" width="220" height="80" rx="8" fill="${C.ink2}"/>
</svg>`;

// 6. 电视
svgs.tv = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="300" viewBox="0 0 360 300">
  <rect x="20" y="20" width="320" height="200" rx="22" fill="${C.ink}"/>
  <rect x="38" y="38" width="284" height="164" rx="12" fill="${C.blue}"/>
  <circle cx="120" cy="110" r="34" fill="${C.yel}"/>
  <path d="M38 170 L120 120 L190 170 L250 130 L322 180 L322 202 L38 202 Z" fill="${C.teal}"/>
  <path d="M150 220 L130 270 M210 220 L230 270" stroke="${C.ink}" stroke-width="12" stroke-linecap="round"/>
  <rect x="100" y="264" width="160" height="14" rx="7" fill="${C.ink}"/>
</svg>`;

(async () => {
  for (const [name, svg] of Object.entries(svgs)) {
    const out = path.join(OUT, `ill_${name}.png`);
    await sharp(Buffer.from(svg), { density: 216 }).png().toFile(out);
    console.log(out);
  }
})();

// 《动动嘴，让 AI 把活干了！》工作坊 PPT 生成脚本
// 用法：node build_deck.js   （先跑 prepare_assets.py 和 illustrations.js）
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const Fa = require("react-icons/fa6");
const { applyTheme } = require("./apply_theme.js");
const { SLIDES_NOTES } = require("./notes.js");

const ROOT = path.resolve(__dirname, "..");
const ASSET = (f) => path.join(ROOT, "assets", f);
const OUT_DIR = path.join(ROOT, "output");
const OUT = path.join(OUT_DIR, "动动嘴让AI把活干了.pptx");

// ---------- 主题 ----------
const HEX = {
  ink: "1E1B2E", ink2: "2B2742", white: "FFFFFF", mist: "F4F3F8",
  red: "E8452C", yel: "FFB81C", blue: "4C6FFF", teal: "14A38B", purple: "7B61FF", gray: "8B8A99",
  muted: "6B6A7A", line: "DCDAE5",
};
const THEME = {
  name: "Latiao Runner",
  headFontFace: "Microsoft YaHei",
  bodyFontFace: "Microsoft YaHei",
  colors: {
    dk1: HEX.ink, lt1: HEX.white, dk2: HEX.ink2, lt2: HEX.mist,
    accent1: HEX.red, accent2: HEX.yel, accent3: HEX.blue, accent4: HEX.teal,
    accent5: HEX.purple, accent6: HEX.gray, hlink: HEX.blue, folHlink: HEX.purple,
  },
};

const W = 13.333, H = 7.5, MX = 0.6;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "动动嘴，让 AI 把活干了！";
  pres.subject = "EOE 中文 Toastmasters AI 实战工作坊";
  pres.author = "EOE AI 实战工作坊";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const SH = pres.ShapeType;

  // 图片尺寸缓存
  const dims = {};
  for (const f of fs.readdirSync(path.join(ROOT, "assets"))) {
    const m = await sharp(ASSET(f)).metadata();
    dims[f] = { w: m.width, h: m.height };
  }
  const ratio = (f) => dims[f].w / dims[f].h;

  // 图标：react-icons → PNG
  const iconCache = {};
  async function icon(name, color = "#FFFFFF", size = 256) {
    const key = name + color;
    if (iconCache[key]) return iconCache[key];
    const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Fa[name], { color, size: String(size) }));
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    return (iconCache[key] = "image/png;base64," + buf.toString("base64"));
  }

  // ---------- 布局 ----------
  const footer = (color) => ({
    text: { text: "动动嘴，让 AI 把活干了！", options: { x: MX, y: 7.02, w: 6, h: 0.3, fontSize: 10, color, margin: 0 } },
  });
  pres.defineSlideMaster({
    title: "LIGHT",
    background: { color: HEX.white },
    objects: [
      footer(HEX.gray),
      { placeholder: { options: { name: "kicker", type: "body", x: MX, y: 0.32, w: 8.4, h: 0.34, fontSize: 13, bold: true, color: HEX.red, margin: 0, valign: "middle" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: MX, y: 0.66, w: 12.1, h: 0.8, fontSize: 32, bold: true, color: HEX.ink, margin: 0, valign: "middle", align: "left" }, text: "" } },
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.32, fontSize: 10, color: HEX.gray, align: "right" },
  });
  pres.defineSlideMaster({
    title: "DARK",
    background: { color: HEX.ink },
    objects: [
      footer("77758A"),
      { placeholder: { options: { name: "kicker", type: "body", x: MX, y: 0.32, w: 8.4, h: 0.34, fontSize: 13, bold: true, color: HEX.yel, margin: 0, valign: "middle" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: MX, y: 0.66, w: 12.1, h: 0.8, fontSize: 32, bold: true, color: HEX.white, margin: 0, valign: "middle", align: "left" }, text: "" } },
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.32, fontSize: 10, color: "77758A", align: "right" },
  });
  pres.defineSlideMaster({
    title: "STAGE",
    background: { color: HEX.ink },
    objects: [],
    slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.32, fontSize: 10, color: "77758A", align: "right" },
  });
  pres.defineSlideMaster({ title: "PHOTO", background: { color: HEX.ink }, objects: [] });

  // ---------- 小工具 ----------
  let curSection = "";
  let slideNo = 0;
  function newSlide(master, section) {
    if (section !== curSection) {
      pres.addSection({ title: section });
      curSection = section;
    }
    slideNo++;
    const s = pres.addSlide({ masterName: master, sectionTitle: section });
    const n = SLIDES_NOTES[slideNo - 1];
    if (n) s.addNotes(n.text);
    return s;
  }
  const heads = (s, kicker, title) => {
    if (kicker) s.addText(kicker, { placeholder: "kicker" });
    s.addText(title, { placeholder: "title" });
  };
  const txt = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, valign: "top", ...o });
  const card = (s, x, y, w, h, o = {}) =>
    s.addShape(SH.roundRect, {
      x, y, w, h, rectRadius: o.r ?? 0.18,
      fill: { color: o.fill ?? C.background2, transparency: o.transparency ?? 0 },
      line: o.line ? { color: o.line, width: o.lineW ?? 1.5, dashType: o.dash } : { type: "none" },
      shadow: o.shadow ? { type: "outer", color: "000000", opacity: 0.18, blur: 10, offset: 3, angle: 90 } : undefined,
      objectName: o.name,
    });
  const pill = (s, text, x, y, w, o = {}) =>
    s.addText(text, {
      shape: SH.roundRect, rectRadius: 0.17, x, y, w, h: o.h ?? 0.36,
      fill: { color: o.fill ?? C.accent1 }, line: { type: "none" },
      color: o.color ?? C.background1, fontSize: o.fontSize ?? 12, bold: true,
      align: "center", valign: "middle", margin: 0, objectName: o.name,
    });
  const bubble = (s, text, x, y, w, h, o = {}) =>
    s.addText(text, {
      shape: SH.wedgeRoundRectCallout, x, y, w, h, flipH: !!o.flipH,
      fill: { color: o.fill ?? C.background1 }, line: o.line ? { color: o.line, width: 2 } : { type: "none" },
      color: o.color ?? C.text1, fontSize: o.fontSize ?? 20, bold: o.bold ?? true,
      align: o.align ?? "center", valign: "middle", margin: 0.12, objectName: o.name,
      shadow: o.shadow ? { type: "outer", color: "000000", opacity: 0.2, blur: 8, offset: 3, angle: 90 } : undefined,
    });
  // 按比例放进框里（contain）
  function img(s, f, x, y, w, h, o = {}) {
    const r = ratio(f);
    let iw = w, ih = w / r;
    if (ih > h) { ih = h; iw = h * r; }
    const ix = x + (o.alignX === "left" ? 0 : o.alignX === "right" ? w - iw : (w - iw) / 2);
    const iy = y + (o.alignY === "top" ? 0 : o.alignY === "bottom" ? h - ih : (h - ih) / 2);
    if (o.frame) card(s, ix - o.frame, iy - o.frame, iw + 2 * o.frame, ih + 2 * o.frame, { fill: o.frameFill ?? C.background1, r: 0.12, shadow: true });
    s.addImage({ path: ASSET(f), x: ix, y: iy, w: iw, h: ih, altText: o.alt ?? f, objectName: o.name });
    return { x: ix, y: iy, w: iw, h: ih };
  }
  // 截图上的高亮框（相对图片的比例坐标）
  function mark(s, box, fx, fy, fw, fh, label, o = {}) {
    const x = box.x + fx * box.w, y = box.y + fy * box.h, w = fw * box.w, h = fh * box.h;
    s.addShape(SH.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { type: "none" }, line: { color: o.color ?? C.accent2, width: 3 } });
    if (label) {
      const lw = o.lw ?? 0.3 + label.length * 0.2;
      const lx = o.lx ?? x, ly = o.ly ?? y - 0.42;
      pill(s, label, lx, ly, lw, { fill: o.color ?? C.accent2, color: o.labelColor ?? C.text1, fontSize: 13 });
    }
  }
  async function iconCircle(s, name, x, y, d, o = {}) {
    s.addShape(SH.ellipse, { x, y, w: d, h: d, fill: { color: o.fill ?? C.accent1 }, line: { type: "none" } });
    const p = d * 0.27;
    s.addImage({ data: await icon(name, o.color ?? "#FFFFFF"), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  }
  const ill = (s, name, x, y, h, o = {}) => {
    const f = `ill_${name}.png`;
    const w = h * ratio(f);
    s.addImage({ path: ASSET(f), x, y, w, h, flipH: !!o.flipH, altText: o.alt ?? name });
    return { x, y, w, h };
  };

  // =====================================================================
  // 开场
  // =====================================================================
  // 1 封面
  {
    const s = newSlide("STAGE", "开场：辣条故事");
    txt(s, "EOE 中文 Toastmasters · AI 实战工作坊", { x: MX + 0.1, y: 0.9, w: 7, h: 0.4, fontSize: 16, color: C.accent2, bold: true });
    txt(s, [
      { text: "动动嘴，", options: { breakLine: true } },
      { text: "让 AI 把活干了！", options: {} },
    ], { x: MX + 0.1, y: 1.55, w: 7.6, h: 2.6, fontSize: 60, bold: true, color: C.background1, valign: "middle", lineSpacingMultiple: 1.05 });
    txt(s, "从聊天到做事，普通人的 AI 实战指南", { x: MX + 0.1, y: 4.3, w: 7.4, h: 0.5, fontSize: 22, color: "C9C7D6" });
    txt(s, "分享人：Tim", { x: MX + 0.1, y: 5.85, w: 5, h: 0.4, fontSize: 16, color: "9A98AB" });
    s.addShape(SH.ellipse, { x: 8.35, y: 1.15, w: 4.5, h: 4.5, fill: { color: C.accent3, transparency: 82 }, line: { type: "none" } });
    ill(s, "robot_run", 8.55, 1.55, 4.4);
    bubble(s, "收到！马上去办", 8.25, 0.6, 2.6, 0.75, { fill: C.accent2, fontSize: 18, flipH: false });
  }

  // 2 周末的沙发
  {
    const s = newSlide("STAGE", "开场：辣条故事");
    txt(s, "小时候的周末", { x: MX, y: 0.45, w: 6, h: 0.5, fontSize: 18, bold: true, color: C.accent2 });
    s.addShape(SH.rect, { x: 0, y: 6.2, w: W, h: 1.3, fill: { color: HEX.ink2 }, line: { type: "none" } });
    ill(s, "tv", 0.5, 3.35, 1.9);
    ill(s, "brother_sofa", 2.2, 2.6, 3.7);
    bubble(s, "去，帮我买包辣条。\n零钱在桌上。", 3.55, 0.95, 3.4, 1.35, { fill: C.background1, fontSize: 20 });
    ill(s, "kid_run", 7.35, 3.45, 2.75);
    ill(s, "shop", 9.85, 2.85, 3.3);
    txt(s, "哥哥：动动嘴", { x: 2.9, y: 6.45, w: 3.2, h: 0.5, fontSize: 20, bold: true, color: C.background1, align: "center" });
    txt(s, "我：跑腿", { x: 7.3, y: 6.45, w: 2.8, h: 0.5, fontSize: 20, bold: true, color: C.accent2, align: "center" });
  }

  // 3 反转
  {
    const s = newSlide("STAGE", "开场：辣条故事");
    txt(s, "小时候我以为：他就是懒。", { x: MX + 0.2, y: 1.35, w: 8, h: 0.7, fontSize: 28, color: "9A98AB" });
    txt(s, "长大后才发现——", { x: MX + 0.2, y: 2.35, w: 8, h: 0.6, fontSize: 24, color: "C9C7D6" });
    txt(s, [
      { text: "这哪是懒啊？", options: { breakLine: true, color: C.background1 } },
      { text: "这是管理能力！", options: { color: C.accent2 } },
    ], { x: MX + 0.2, y: 3.1, w: 8.2, h: 2.6, fontSize: 54, bold: true, valign: "middle" });
    ill(s, "brother_sofa", 8.3, 3.1, 3.2);
    pill(s, "提要求  ·  给预算  ·  等结果", 8.55, 2.35, 4.0, { fill: C.accent2, color: C.text1, fontSize: 15, h: 0.46 });
  }


  // 4 以前 vs 现在
  {
    const s = newSlide("STAGE", "开场：辣条故事");
    const rows = [
      { tag: "以前", who: "哥哥动动嘴", run: "我跑腿", b: "kid_run", y: 0.6, hi: false },
      { tag: "现在", who: "我动动嘴", run: "AI 跑腿", b: "robot_run", y: 3.5, hi: true },
    ];
    for (const r of rows) {
      card(s, MX, r.y, W - 2 * MX, 2.65, { fill: r.hi ? C.accent2 : C.background1, transparency: r.hi ? 86 : 93, r: 0.25 });
      pill(s, r.tag, MX + 0.35, r.y + 0.3, 1.0, { fill: r.hi ? C.accent2 : "5A576E", color: r.hi ? C.text1 : C.background1, fontSize: 15 });
      ill(s, "brother_sofa", MX + 0.3, r.y + 0.75, 1.75);
      txt(s, r.who, { x: 3.4, y: r.y + 0.8, w: 3.3, h: 1.0, fontSize: 32, bold: true, color: C.background1, valign: "middle" });
      s.addImage({ data: await icon("FaArrowRight", r.hi ? "#FFB81C" : "#8B8A99"), x: 6.85, y: r.y + 1.05, w: 0.55, h: 0.5 });
      ill(s, r.b, 7.75, r.y + 0.22, 2.25);
      txt(s, r.run, { x: 10.15, y: r.y + 0.8, w: 2.5, h: 1.0, fontSize: 32, bold: true, color: r.hi ? C.accent2 : C.background1, valign: "middle" });
    }
    txt(s, "今天聊的就是：怎么当一个会派活的“哥哥”", { x: MX, y: 6.38, w: 12.1, h: 0.45, fontSize: 18, color: "C9C7D6", align: "center" });
  }

  // =====================================================================
  // 互动
  // =====================================================================
  // 5 举手调查
  {
    const s = newSlide("LIGHT", "互动：你用 AI 干什么");
    heads(s, "现场小调查 · 举手就行，可以多选", "大家平时主要拿 AI 干什么？");
    const items = [
      { n: "1", t: "当搜索引擎用", d: "查资料、问问题、\n做旅游攻略", ic: "FaMagnifyingGlass", c: C.accent3 },
      { n: "2", t: "帮我省时间", d: "写东西、整理资料、\n少做重复的活", ic: "FaClock", c: C.accent4 },
      { n: "3", t: "帮我找灵感", d: "想点子、做设计、\n头脑风暴", ic: "FaLightbulb", c: C.accent2 },
      { n: "4", t: "做好玩的事", d: "写歌、做视频、\n小游戏、兴趣项目", ic: "FaGamepad", c: C.accent5 },
    ];
    for (let i = 0; i < 4; i++) {
      const it = items[i], x = MX + i * (2.85 + 0.243), y = 1.85;
      card(s, x, y, 2.85, 4.2, { fill: it.c, transparency: 88, r: 0.22 });
      txt(s, it.n, { x: x + 0.3, y: y + 0.2, w: 1, h: 0.8, fontSize: 40, bold: true, color: it.c });
      await iconCircle(s, it.ic, x + 1.6, y + 0.3, 0.95, { fill: it.c });
      txt(s, it.t, { x: x + 0.3, y: y + 1.55, w: 2.4, h: 0.55, fontSize: 22, bold: true, color: C.text1 });
      txt(s, it.d, { x: x + 0.3, y: y + 2.2, w: 2.4, h: 1.0, fontSize: 16, color: HEX.muted });
      s.addImage({ data: await icon("FaHand", "#6B6A7A"), x: x + 0.3, y: y + 3.5, w: 0.32, h: 0.36 });
      txt(s, "举手", { x: x + 0.72, y: y + 3.5, w: 1.2, h: 0.36, fontSize: 14, color: HEX.muted, valign: "middle" });
    }
    txt(s, "允许多选 · 不用上台", { x: MX, y: 6.35, w: 6, h: 0.35, fontSize: 14, color: HEX.gray });
  }

  // 6 聊天 vs 做事
  {
    const s = newSlide("LIGHT", "互动：你用 AI 干什么");
    heads(s, "再追问一个", "有人让 AI 从头到尾，帮你办完过一件事吗？");
    const cols = [
      { x: MX, t: "AI 聊天", sub: "你问一句，它答一句", ic: "FaComments", c: C.accent6, q: "辣条在哪儿买？", a: "楼下小卖部，五毛一包。", end: "最后跑腿的，还是你。", tint: 90 },
      { x: 7.03, t: "AI 做事", sub: "你交代清楚，它跑完全程", ic: "FaPersonRunning", c: C.accent1, q: "帮我买包辣条，五块以内。", a: "买好了，找您四块五，请验收。", end: "你只负责验收。", tint: 88 },
    ];
    for (const k of cols) {
      const y = 1.8;
      card(s, k.x, y, 5.7, 4.75, { fill: k.c, transparency: k.tint, r: 0.22 });
      await iconCircle(s, k.ic, k.x + 0.4, y + 0.4, 0.85, { fill: k.c });
      txt(s, k.t, { x: k.x + 1.45, y: y + 0.38, w: 4, h: 0.55, fontSize: 28, bold: true, color: C.text1 });
      txt(s, k.sub, { x: k.x + 1.45, y: y + 0.92, w: 4, h: 0.4, fontSize: 16, color: HEX.muted });
      bubble(s, k.q, k.x + 2.3, y + 1.65, 3.0, 0.75, { fill: C.background1, fontSize: 16, flipH: true, bold: false, shadow: true });
      bubble(s, k.a, k.x + 0.4, y + 2.6, 3.4, 0.75, { fill: k.c, color: C.background1, fontSize: 16, bold: false, shadow: true });
      txt(s, k.end, { x: k.x + 0.4, y: y + 3.75, w: 5, h: 0.6, fontSize: 22, bold: true, color: k.c });
    }
    s.addImage({ data: await icon("FaArrowRight", "#E8452C"), x: 6.42, y: 3.95, w: 0.5, h: 0.45 });
  }

  // =====================================================================
  // AI 正在改变什么
  // =====================================================================
  // 7 门槛
  {
    const s = newSlide("LIGHT", "AI 正在改变什么");
    heads(s, "AI 正在改变什么", "门槛低了：从“我不会”到“我先做出来”");
    bubble(s, "我不会，所以做不了。", MX, 1.8, 5.2, 1.05, { fill: C.background2, color: HEX.muted, fontSize: 24 });
    s.addImage({ data: await icon("FaArrowRight", "#E8452C"), x: 6.1, y: 2.05, w: 0.6, h: 0.5 });
    bubble(s, "我可以先做出来，再慢慢改。", 7.0, 1.8, 5.73, 1.05, { fill: C.accent1, color: C.background1, fontSize: 24, flipH: true });
    const rows = [
      ["知识工作", "先自己查资料、学方法", "让 AI 先起草，我来改"],
      ["内容制作", "得先学会设计软件", "说清楚想要什么，先出一版"],
      ["软件开发", "得先学会写代码", "描述需求，先做出能用的小工具"],
    ];
    txt(s, "以前", { x: 3.15, y: 3.15, w: 3, h: 0.35, fontSize: 14, bold: true, color: HEX.gray });
    txt(s, "现在", { x: 7.75, y: 3.15, w: 3, h: 0.35, fontSize: 14, bold: true, color: C.accent1 });
    rows.forEach((r, i) => {
      const y = 3.55 + i * 0.98;
      card(s, MX, y, 12.13, 0.82, { fill: C.background2, r: 0.14 });
      txt(s, r[0], { x: MX + 0.35, y, w: 2.2, h: 0.82, fontSize: 20, bold: true, color: C.text1, valign: "middle" });
      txt(s, r[1], { x: 3.15, y, w: 4.2, h: 0.82, fontSize: 17, color: HEX.muted, valign: "middle" });
      txt(s, r[2], { x: 7.75, y, w: 4.8, h: 0.82, fontSize: 17, bold: true, color: C.text1, valign: "middle" });
    });
    txt(s, "降低的是起步门槛，不是专业的天花板。", { x: MX, y: 6.5, w: 12, h: 0.4, fontSize: 15, italic: true, color: HEX.muted });
  }

  // 8 人的价值
  {
    const s = newSlide("LIGHT", "AI 正在改变什么");
    heads(s, "跑腿的换了", "当“哥哥”的，还得是你");
    card(s, MX, 1.8, 4.3, 4.55, { fill: C.text1, r: 0.22 });
    await iconCircle(s, "FaRobot", MX + 0.35, 2.1, 0.75, { fill: C.accent3 });
    txt(s, "AI 擅长跑腿", { x: MX + 1.3, y: 2.17, w: 2.9, h: 0.6, fontSize: 22, bold: true, color: C.background1, valign: "middle" });
    txt(s, ["查找和整理", "起草初稿", "写代码、做网页", "做图、排版", "不知疲倦地重复"].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })),
      { x: MX + 0.4, y: 3.15, w: 3.6, h: 2.9, fontSize: 18, color: "DCDAE5", paraSpaceAfter: 8 });
    txt(s, "人仍然负责", { x: 5.25, y: 1.8, w: 5, h: 0.5, fontSize: 22, bold: true, color: C.accent1 });
    const vals = ["发现问题", "提出目标", "判断与取舍", "理解现实中的人和环境", "协调资源", "检查成果", "承担责任"];
    vals.forEach((v, i) => {
      const x = 5.25 + (i % 2) * 3.8, y = 2.42 + Math.floor(i / 2) * 0.78;
      card(s, x, y, 3.6, 0.64, { fill: C.accent1, transparency: 90, r: 0.14 });
      txt(s, String(i + 1), { x: x + 0.2, y, w: 0.4, h: 0.64, fontSize: 18, bold: true, color: C.accent1, valign: "middle" });
      txt(s, v, { x: x + 0.62, y, w: 2.9, h: 0.64, fontSize: 17, bold: true, color: C.text1, valign: "middle" });
    });
    card(s, 9.05, 4.76, 3.6, 0.64, { fill: C.accent2, transparency: 75, r: 0.14 });
    txt(s, "超级个体？", { x: 9.25, y: 4.76, w: 3.3, h: 0.64, fontSize: 17, bold: true, color: C.text1, valign: "middle" });
    txt(s, [
      { text: "超级个体 ≠ 一个人顶几十个人。", options: { bold: true, breakLine: true } },
      { text: "而是一个人加上 AI，能把更多想法推进到“看得见、摸得着”——依然需要团队。", options: {} },
    ], { x: 5.25, y: 5.6, w: 7.45, h: 0.95, fontSize: 15, color: HEX.muted });
  }

  // =====================================================================
  // 现场派活
  // =====================================================================
  // 9 任务卡
  {
    const s = newSlide("LIGHT", "现场派活");
    heads(s, "现场派活 · 我现在就当一回“哥哥”", "现场任务：即兴演讲抽题器");
    pill(s, "占位任务 · 可替换", 10.55, 0.36, 2.15, { fill: C.accent2, color: C.text1, fontSize: 13 });
    const q = [
      { t: "我要做什么", d: "一个「即兴演讲抽题 + 计时」网页，投影上直接能用。", ic: "FaBullseye", c: C.accent1 },
      { t: "提供什么信息", d: "20 道即兴题目；计时规则：1 分钟绿灯、1 分 30 秒黄灯、2 分钟红灯。", ic: "FaFileLines", c: C.accent3 },
      { t: "有哪些限制", d: "一个网页文件，断网也能打开；中文、大字号；不收集任何个人信息。", ic: "FaShieldHalved", c: C.accent5 },
      { t: "怎么算完成", d: "① 点一下随机抽题，不重复\n② 计时到点自动变色\n③ 手机和投影都看得清", ic: "FaFlagCheckered", c: C.accent4 },
    ];
    for (let i = 0; i < 4; i++) {
      const it = q[i], x = MX + (i % 2) * 6.18, y = 1.8 + Math.floor(i / 2) * 2.5;
      card(s, x, y, 5.95, 2.3, { fill: it.c, transparency: 90, r: 0.2, line: i === 3 ? HEX.teal : undefined, lineW: 2.5 });
      await iconCircle(s, it.ic, x + 0.3, y + 0.3, 0.66, { fill: it.c });
      txt(s, it.t, { x: x + 1.15, y: y + 0.3, w: 4.5, h: 0.66, fontSize: 22, bold: true, color: C.text1, valign: "middle" });
      txt(s, it.d, { x: x + 1.15, y: y + 1.05, w: 4.55, h: 1.15, fontSize: 16, color: C.text1 });
    }
  }

  // 10 转场：AI 出门了
  {
    const s = newSlide("STAGE", "真实案例实战秀");
    pill(s, "约 10 分钟后回来验收", MX, 0.7, 2.7, { fill: C.accent2, color: C.text1, fontSize: 14, h: 0.42 });
    txt(s, "AI 已经出门跑腿了", { x: MX, y: 1.4, w: 8.5, h: 1.1, fontSize: 50, bold: true, color: C.background1, valign: "middle" });
    txt(s, "趁它跑腿，我们看看 4 个真实案例", { x: MX, y: 2.55, w: 8.5, h: 0.6, fontSize: 24, color: "C9C7D6" });
    const acts = [["第一幕", "EOE 两周年庆"], ["第二幕", "财经内容 Skills"], ["第三幕", "自己做工具"], ["第四幕", "音乐与创意"]];
    acts.forEach((a, i) => {
      const x = MX + i * 2.05, y = 4.15;
      card(s, x, y, 1.9, 1.55, { fill: C.background1, transparency: 91, r: 0.18 });
      txt(s, a[0], { x: x + 0.22, y: y + 0.25, w: 1.5, h: 0.4, fontSize: 15, bold: true, color: C.accent2 });
      txt(s, a[1], { x: x + 0.22, y: y + 0.7, w: 1.55, h: 0.7, fontSize: 17, bold: true, color: C.background1 });
    });
    ill(s, "robot_run", 9.0, 1.4, 4.2);
    ill(s, "shop", 11.35, 4.35, 1.6);
  }

  // =====================================================================
  // 第一幕：EOE 两周年庆
  // =====================================================================
  const tracker = (s, active) => {
    ["A 想清楚", "B 做出来", "C 真落地"].forEach((t, i) => {
      const on = i === active;
      s.addText(t, {
        shape: SH.roundRect, rectRadius: 0.17, x: 9.2 + i * 1.18, y: 0.32, w: 1.1, h: 0.36,
        fill: { color: on ? C.accent1 : C.background2 }, line: { type: "none" },
        color: on ? C.background1 : HEX.gray, fontSize: 12, bold: true, align: "center", valign: "middle", margin: 0,
      });
    });
  };

  // 11 先想清楚
  {
    const s = newSlide("LIGHT", "真实案例实战秀");
    heads(s, "第一幕 · EOE 两周年庆总策划", "第一步不是做图，而是把事情想清楚");
    tracker(s, 0);
    card(s, MX, 1.75, 5.35, 3.95, { fill: C.text1, r: 0.22 });
    txt(s, "一开始脑子里：", { x: MX + 0.35, y: 1.95, w: 4, h: 0.4, fontSize: 15, color: "9A98AB" });
    const qs = [["请谁来？", 0.4, 2.55], ["几点开始？", 2.6, 2.45], ["谁来主持？", 1.3, 3.2], ["要几个节目？", 3.1, 3.3], ["抽奖怎么抽？", 0.35, 3.95], ["物料谁来做？", 2.45, 4.1], ["现场会冷场吗？", 1.1, 4.8]];
    qs.forEach(([t, dx, y], i) => pill(s, t, MX + dx, y, 0.45 + t.length * 0.24, { fill: [C.accent1, C.accent2, C.accent3, C.accent5][i % 4], color: i % 4 === 1 ? C.text1 : C.background1, fontSize: 15, h: 0.46 }));
    s.addImage({ data: await icon("FaArrowRight", "#E8452C"), x: 6.15, y: 3.45, w: 0.55, h: 0.5 });
    txt(s, "和 AI 聊了很多轮之后：", { x: 6.95, y: 1.75, w: 5.7, h: 0.4, fontSize: 15, color: HEX.muted });
    const steps = ["活动目标", "人员与分工", "任务拆解", "倒排时间节点", "活动 Agenda", "现场流程", "物料、PPT 与抽奖网页"];
    steps.forEach((t, i) => {
      const y = 2.2 + i * 0.5;
      card(s, 6.95, y, 5.78, 0.42, { fill: C.background2, r: 0.1 });
      txt(s, String(i + 1).padStart(2, "0"), { x: 7.1, y, w: 0.5, h: 0.42, fontSize: 14, bold: true, color: C.accent1, valign: "middle" });
      txt(s, t, { x: 7.65, y, w: 4.9, h: 0.42, fontSize: 16, bold: true, color: C.text1, valign: "middle" });
    });
    bubble(s, "AI 最先帮我的不是做图，而是让我把一件模糊的事情逐渐想清楚。", MX, 5.95, 12.13, 0.82, { fill: C.accent1, color: C.background1, fontSize: 20 });
  }

  // 12 分工
  {
    const s = newSlide("LIGHT", "真实案例实战秀");
    heads(s, "第一幕 · A 想清楚", "每件事，都落到具体的人");
    tracker(s, 0);
    const full = img(s, "staff_table.jpg", MX + 0.08, 1.85, 3.3, 4.85, { frame: 0.08, alignX: "left", alt: "两周年庆筹备分工表全貌（功能、环节、执行人三列）" });
    mark(s, full, 0, 0.705, 1, 0.295, null);
    txt(s, "全貌", { x: full.x, y: full.y + full.h + 0.1, w: 2, h: 0.3, fontSize: 12, color: HEX.gray });
    const z = img(s, "staff_zoom.jpg", 4.15, 1.85, 8.55, 4.4, { frame: 0.08, alignX: "left", alignY: "top", alt: "放大：设计组和节目组的分工" });
    mark(s, z, 0.505, 0.09, 0.49, 0.9, "负责人", { lx: z.x + z.w * 0.855, ly: z.y + 0.05, lw: 1.05 });
    s.addShape(SH.line, { x: full.x + full.w + 0.02, y: full.y + full.h * 0.705, w: z.x - full.x - full.w - 0.1, h: -(full.y + full.h * 0.705 - z.y - z.h), line: { color: C.accent2, width: 1.5, dashType: "dash" } });
    txt(s, [
      { text: "按功能分组：", options: { bold: true, color: C.accent1 } },
      { text: "邀约 · 主持 · 后勤 · 设计组 · 节目组；", options: {} },
      { text: "一件事，一个负责人", options: { bold: true } },
    ], { x: 4.15, y: z.y + z.h + 0.2, w: 8.6, h: 0.45, fontSize: 16, color: C.text1, valign: "middle" });
  }

  // 13 日程
  {
    const s = newSlide("LIGHT", "真实案例实战秀");
    heads(s, "第一幕 · A 想清楚", "倒排时间：一个下午，拆成四个板块");
    tracker(s, 0);
    const b = img(s, "schedule.jpg", MX, 2.05, 12.13, 4.75, { frame: 0.08, alt: "两周年庆活动日程表" });
    mark(s, b, 0.002, 0.117, 0.104, 0.88, "四个板块", { ly: 1.58, lw: 1.35 });
    mark(s, b, 0.108, 0.117, 0.208, 0.88, "时间段", { ly: 1.58, lw: 1.1, lx: b.x + b.w * 0.108 + 0.3 });
    mark(s, b, 0.766, 0.117, 0.232, 0.88, "每段都有负责人", { ly: 1.58, lw: 2.0, lx: b.x + b.w * 0.766 + 0.2 });
  }

  // 14 邀请长图
  {
    const s = newSlide("LIGHT", "真实案例实战秀");
    heads(s, "第一幕 · B 做出来", "一张邀请长图，拆开来看");
    tracker(s, 1);
    const strip = img(s, "invite_full.jpg", 0.75, 1.8, 0.8, 5.0, { frame: 0.05, alignX: "left", alt: "邀请函长图全貌" });
    const segs = [[0, 292], [680, 1010], [1275, 1660]];
    segs.forEach(([a, b2], i) => {
      mark(s, strip, -0.04, a / 2048, 1.08, (b2 - a) / 2048, null, { color: C.accent1 });
      pill(s, String(i + 1), strip.x + strip.w + 0.12, strip.y + strip.h * (a / 2048), 0.36, { fontSize: 13 });
    });
    const panels = [
      ["invite_head.jpg", "主视觉：三位嘉宾 + 一句口号"],
      ["invite_photos.jpg", "回忆墙：这两年一起做过的事"],
      ["invite_agenda.jpg", "Agenda：一眼看懂下午怎么过"],
    ];
    let x = 2.15;
    const ph = 4.15;
    panels.forEach(([f, cap], i) => {
      const w = ph * ratio(f);
      const b = img(s, f, x, 1.85, w, ph, { frame: 0.06, alt: cap });
      pill(s, String(i + 1), b.x + 0.12, b.y + 0.12, 0.36, { fontSize: 13 });
      txt(s, cap, { x: b.x, y: 6.18, w: b.w, h: 0.6, fontSize: 15, color: C.text1 });
      x += w + 0.32;
    });
  }

  // 15 大屏 + 手举牌
  {
    const s = newSlide("LIGHT", "真实案例实战秀");
    heads(s, "第一幕 · B 做出来", "从大屏到手举牌：设计稿真的走进了现场");
    tracker(s, 1);
    const b = img(s, "ppt_overview.jpg", MX + 0.08, 1.9, 7.2, 4.55, { frame: 0.08, alignX: "left", alignY: "top", alt: "周年庆现场大屏 PPT 22 页总览" });
    txt(s, "现场大屏 PPT · 全 22 页，一个环节一页", { x: b.x, y: b.y + b.h + 0.18, w: 7.2, h: 0.35, fontSize: 15, color: C.text1 });
    const pairs = [["sign_design_mom.jpg", "sign_live_mom.jpg"], ["sign_design_bucket.jpg", "sign_live_bucket.jpg"]];
    pairs.forEach(([d, l], i) => {
      const y = 2.25 + i * 2.05;
      txt(s, "设计稿", { x: 8.3, y: y - 0.38, w: 1.5, h: 0.3, fontSize: 13, bold: true, color: HEX.gray });
      txt(s, "现场", { x: 10.45, y: y - 0.38, w: 1.5, h: 0.3, fontSize: 13, bold: true, color: C.accent1 });
      img(s, d, 8.3, y, 1.95, 1.45, { frame: 0.05, alignX: "left", alt: "手举牌设计稿" });
      img(s, l, 10.45, y, 2.28, 1.45, { frame: 0.05, alignX: "left", alt: "大合照中举起的手举牌" });
    });
    txt(s, "手举牌：设计稿 → 大合照里举起来", { x: 8.3, y: 6.0, w: 4.45, h: 0.35, fontSize: 15, color: C.text1 });
  }

  // 16 抽奖网页
  {
    const s = newSlide("LIGHT", "真实案例实战秀");
    heads(s, "第一幕 · B 做出来", "抽奖网页：我只负责把要求说清楚");
    tracker(s, 1);
    const b = img(s, "lottery.jpg", MX + 0.08, 1.9, 7.0, 4.85, { frame: 0.08, alignX: "left", alignY: "top", alt: "用 Codex 开发周年庆抽奖网页：左侧对话，右侧网页" });
    mark(s, b, 0.138, 0.075, 0.268, 0.192, "我的要求", { lx: b.x + b.w * 0.42 - 1.3, ly: b.y + b.h * 0.275, lw: 1.3 });
    txt(s, [
      { text: "“以数字为主吧……干脆就不要头像了；", options: { breakLine: true } },
      { text: "给我网页链接，可以分享的那种。”", options: {} },
    ], { x: 8.05, y: 1.9, w: 4.68, h: 1.0, fontSize: 16, italic: true, color: C.text1 });
    const facts = [
      ["FaStopwatch", "Codex 连续工作约 12 分钟"],
      ["FaWandMagicSparkles", "改成纯号码抽奖，去掉头像上传"],
      ["FaPaperPlane", "直接发布成可分享的网页"],
    ];
    for (let i = 0; i < facts.length; i++) {
      const y = 3.1 + i * 0.62;
      await iconCircle(s, facts[i][0], 8.05, y, 0.46, { fill: C.accent1 });
      txt(s, facts[i][1], { x: 8.65, y, w: 4.1, h: 0.46, fontSize: 16, color: C.text1, valign: "middle" });
    }
    bubble(s, "AI 让我这种有想法、但以前执行起来比较费劲的人，大大提高了执行力。", 8.05, 5.15, 4.68, 1.5, { fill: C.accent2, color: C.text1, fontSize: 17, align: "left" });
  }

  // 17 大合照
  {
    const s = newSlide("PHOTO", "真实案例实战秀");
    s.addImage({ path: ASSET("group_photo_fade.jpg"), x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H }, altText: "EOE 中文两周年庆大合照" });
    pill(s, "C 真正落地 · 2026.09.19", MX, 5.55, 3.1, { fill: C.accent1, fontSize: 14, h: 0.42 });
    txt(s, "真正重要的不是做出几张海报，而是把一场复杂的活动办成。", { x: MX, y: 6.08, w: 12.2, h: 0.75, fontSize: 30, bold: true, color: C.background1, valign: "middle" });
  }

  // =====================================================================
  // 第二幕：财经内容 Skills
  // =====================================================================
  // 18 流程
  {
    const s = newSlide("LIGHT", "真实案例实战秀");
    heads(s, "第二幕 · 财经内容 Skills", "一条财经视频，上线前要过多少道关？");
    const steps = ["选题", "字幕校对", "高光片段", "前彩", "章节时间轴", "封面\nSEO 标题", "描述\n关键词标签", "发布"];
    steps.forEach((t, i) => {
      const x = MX + i * (1.4 + 0.133), y = 1.85;
      card(s, x, y, 1.4, 1.3, { fill: i % 2 ? C.accent3 : C.accent1, transparency: 88, r: 0.16 });
      txt(s, String(i + 1), { x: x + 0.15, y: y + 0.1, w: 0.5, h: 0.4, fontSize: 16, bold: true, color: i % 2 ? C.accent3 : C.accent1 });
      txt(s, t, { x: x + 0.1, y: y + 0.45, w: 1.2, h: 0.75, fontSize: 15, bold: true, color: C.text1, align: "center", valign: "middle" });
    });
    const b = img(s, "ref_video_cards.jpg", MX + 0.08, 3.65, 7.25, 2.6, { frame: 0.08, alignX: "left", alignY: "top", alt: "第三方频道视频页示例（非本人作品）" });
    mark(s, b, 0.005, 0.01, 0.48, 0.81, "封面", { lx: b.x + 0.15, ly: b.y + 0.15, lw: 0.8 });
    mark(s, b, 0.005, 0.83, 0.48, 0.16, "标题", { lx: b.x + b.w * 0.5 - 0.95, ly: b.y + b.h * 0.83 - 0.45, lw: 0.8 });
    txt(s, "参考：第三方频道「小Lin说」的公开视频页（非本人作品），用来说明一条视频最后交给观众的是什么。", { x: b.x, y: b.y + b.h + 0.15, w: 7.3, h: 0.45, fontSize: 11, color: HEX.gray });
    card(s, 8.25, 3.57, 4.48, 2.76, { fill: C.accent1, transparency: 90, r: 0.2 });
    txt(s, "每一期，都要重来一遍", { x: 8.55, y: 3.8, w: 4, h: 0.55, fontSize: 22, bold: true, color: C.accent1 });
    txt(s, "同样的步骤做多了，我开始问自己：能不能把做法固定下来，让 AI 照着做？", { x: 8.55, y: 4.5, w: 3.95, h: 1.6, fontSize: 17, color: C.text1 });
  }

  // 19 Skills 说明书
  {
    const s = newSlide("LIGHT", "真实案例实战秀");
    heads(s, "第二幕 · 财经内容 Skills", "Skills：我写给 AI 的工作说明书");
    const b = img(s, "skills_table.jpg", MX + 0.08, 1.85, 4.3, 4.95, { frame: 0.08, alignX: "left", alt: "财经视频 Skills 工作流表（EP63 版本改动）" });
    const marks = [[0.192, 0.093, "总控：先做哪步、为什么"], [0.512, 0.092, "顺序是试出来的"], [0.77, 0.13, "规则是踩坑踩出来的"]];
    marks.forEach(([fy, fh, t]) => {
      mark(s, b, 0.04, fy, 0.94, fh, null, { color: C.accent1 });
      pill(s, t, b.x + b.w + 0.2, b.y + b.h * (fy + fh / 2) - 0.2, 0.4 + t.length * 0.21, { fill: C.accent1, fontSize: 14, h: 0.4 });
    });
    const steps = [["做很多遍", "一期一期做，记下每次卡住的地方"], ["找出固定步骤", "哪些步骤每次都一样？顺序怎么排？"], ["写成说明书", "把做法和规则写下来，这就是 Skills"], ["AI 照着做", "下次直接按说明书执行，我来验收"]];
    steps.forEach(([t, d], i) => {
      const y = 1.85 + i * 1.05;
      card(s, 8.15, y, 4.58, 0.9, { fill: C.background2, r: 0.14 });
      txt(s, String(i + 1), { x: 8.35, y, w: 0.45, h: 0.9, fontSize: 24, bold: true, color: C.accent1, valign: "middle" });
      txt(s, t, { x: 8.85, y: y + 0.1, w: 3.7, h: 0.38, fontSize: 17, bold: true, color: C.text1 });
      txt(s, d, { x: 8.85, y: y + 0.48, w: 3.75, h: 0.36, fontSize: 13, color: HEX.muted });
    });
    bubble(s, "工作流不是凭空设计的，是一次次做出来的。", 8.15, 6.12, 4.58, 0.7, { fill: C.accent2, color: C.text1, fontSize: 15 });
  }

  // =====================================================================
  // 第三幕：自己做工具
  // =====================================================================
  // 20 粤语
  {
    const s = newSlide("LIGHT", "真实案例实战秀");
    heads(s, "第三幕 · 自己做工具 A", "粤语学习工具：现成的不合口味，就自己做一个");
    const b = img(s, "cantonese.jpg", MX + 0.08, 1.85, 7.0, 4.9, { frame: 0.08, alignX: "left", alignY: "top", alt: "用 Codex 开发粤语学习网页：左侧对话，右侧网页" });
    mark(s, b, 0.13, 0.08, 0.28, 0.115, null);
    pill(s, "左：我用大白话提要求", b.x + 0.1, b.y + b.h * 0.22, 2.5, { fill: C.accent2, color: C.text1, fontSize: 13 });
    pill(s, "右：AI 做出来的网页", b.x + b.w * 0.45, b.y + b.h * 0.36, 2.4, { fill: C.accent2, color: C.text1, fontSize: 13 });
    const rows = [
      ["起因", "现成的学习 App：内容重复、不够好玩，不贴合我自己的需要。"],
      ["做法", "直接跟 Codex 说：“帮我整理一些搞笑、有点损人的经典粤语俚语，开一节。”"],
      ["结果", "一节一节加，已经做到第 19 章。"],
    ];
    rows.forEach(([k, v], i) => {
      const y = 1.85 + i * 1.12;
      pill(s, k, 8.05, y + 0.05, 0.8, { fill: C.text1, fontSize: 13 });
      txt(s, v, { x: 9.0, y, w: 3.73, h: 1.0, fontSize: 15, color: C.text1 });
    });
    bubble(s, "我不会开发软件，\n但我知道自己想要什么。", 8.05, 5.4, 4.68, 1.3, { fill: C.accent1, color: C.background1, fontSize: 19 });
  }

  // 21 SOXL
  {
    const s = newSlide("LIGHT", "真实案例实战秀");
    heads(s, "第三幕 · 自己做工具 B", "SOXL 云端监测：让系统替我盯着");
    const b = img(s, "soxl_page.jpg", MX + 0.08, 1.85, 7.65, 2.7, { frame: 0.08, alignX: "left", alignY: "top", alt: "SOXL 监测系统页面" });
    mark(s, b, 0.315, 0.62, 0.3, 0.075, "已接入 Discord 推送", { lx: b.x + b.w * 0.315, ly: b.y + b.h * 0.72, lw: 2.3 });
    const d = img(s, "soxl_discord.jpg", 8.75, 1.85, 3.95, 4.9, { frame: 0.08, alignX: "right", alignY: "top", alt: "Discord 自动推送截图（敏感信息已打码）" });
    pill(s, "条件满足 → 手机收到提醒", d.x + 0.15, d.y + d.h - 0.55, 2.7, { fill: C.accent2, color: C.text1, fontSize: 13, h: 0.4 });
    bubble(s, "AI 不只是帮我做一次事情，我还可以让自己建立的系统，持续帮我处理一部分工作。", MX, 4.95, 7.8, 1.15, { fill: C.accent3, color: C.background1, fontSize: 18 });
    txt(s, "个人学习与提醒工具：只读监听，不连券商，不自动下单；截图中敏感信息已打码。不构成任何投资建议，也不保证收益。", { x: MX, y: 6.35, w: 7.9, h: 0.45, fontSize: 12, color: HEX.gray });
  }

  // =====================================================================
  // 第四幕：音乐
  // =====================================================================
  // 22 音乐
  {
    const s = newSlide("DARK", "真实案例实战秀");
    heads(s, "第四幕 · 音乐与创意", "AI 也帮我把脑海里的旋律做了出来");
    card(s, 1.9, 1.85, 9.5, 2.65, { fill: C.background1, transparency: 91, r: 0.3, name: "音频播放器（把 mp3 插入到这里）" });
    await iconCircle(s, "FaPlay", 2.3, 2.45, 1.45, { fill: C.accent1 });
    txt(s, "《曲名待补充》", { x: 4.1, y: 2.2, w: 5, h: 0.6, fontSize: 26, bold: true, color: C.background1 });
    txt(s, "原创 · AI 辅助制作 · 现场播放 30–45 秒", { x: 4.1, y: 2.85, w: 6.5, h: 0.4, fontSize: 15, color: "C9C7D6" });
    for (let i = 0; i < 40; i++) {
      const h = 0.12 + 0.55 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21));
      s.addShape(SH.roundRect, { x: 4.1 + i * 0.165, y: 3.95 - h / 2, w: 0.09, h, rectRadius: 0.04, fill: { color: i < 14 ? C.accent2 : "5A576E" }, line: { type: "none" } });
    }
    pill(s, "音频待插入", 9.85, 2.05, 1.35, { fill: C.accent2, color: C.text1, fontSize: 12 });
    txt(s, "AI 不只是帮我节省时间，也帮我把一些原本停留在脑海中的创意做出来。", { x: 1.9, y: 4.9, w: 9.5, h: 1.0, fontSize: 24, bold: true, color: C.background1, align: "center", valign: "middle" });
    txt(s, "视频剪辑、社交账号运营也在用 AI——今天就不展开了", { x: 1.9, y: 6.0, w: 9.5, h: 0.4, fontSize: 14, color: "9A98AB", align: "center" });
  }

  // =====================================================================
  // 验收
  // =====================================================================
  // 23 三种结果
  {
    const s = newSlide("DARK", "回来验收");
    heads(s, "回来验收", "AI 有没有把辣条买对？");
    ill(s, "latiao", 11.45, 0.25, 1.35);
    const cs = [
      { t: "买对了", d: "打开成果，按「怎么算完成」逐条验一遍", ic: "FaCircleCheck", c: C.accent4 },
      { t: "买了一半", d: "展示做好的部分，指出缺什么，再交代一句让它补", ic: "FaCircleHalfStroke", c: C.accent2 },
      { t: "买错了", d: "打开提前准备的备份成果：AI 也需要检查和迭代", ic: "FaCircleXmark", c: C.accent1 },
    ];
    for (let i = 0; i < 3; i++) {
      const it = cs[i], x = MX + i * 4.12, y = 1.95;
      card(s, x, y, 3.85, 3.75, { fill: C.background1, transparency: 91, r: 0.22 });
      await iconCircle(s, it.ic, x + 0.35, y + 0.4, 0.95, { fill: it.c });
      txt(s, it.t, { x: x + 0.35, y: y + 1.6, w: 3.2, h: 0.6, fontSize: 28, bold: true, color: C.background1 });
      txt(s, it.d, { x: x + 0.35, y: y + 2.35, w: 3.2, h: 1.2, fontSize: 17, color: "C9C7D6" });
    }
    txt(s, "不管哪种结果——验收，都是人的活。", { x: MX, y: 6.05, w: 12, h: 0.5, fontSize: 20, bold: true, color: C.accent2 });
  }

  // 24 现场验收
  {
    const s = newSlide("LIGHT", "回来验收");
    heads(s, "回来验收", "现场验收：按「怎么算完成」逐条打勾");
    card(s, MX, 1.8, 7.55, 4.95, { fill: C.background2, r: 0.2, line: HEX.gray, lineW: 1.5, dash: "dash", name: "成果截图占位" });
    s.addImage({ data: await icon("FaEye", "#8B8A99"), x: MX + 3.4, y: 3.2, w: 0.75, h: 0.6 });
    txt(s, "切换到 Agent 窗口\n或把成果截图粘贴到这里", { x: MX, y: 3.95, w: 7.55, h: 0.9, fontSize: 18, color: HEX.gray, align: "center" });
    card(s, 8.45, 1.8, 4.28, 2.95, { fill: C.accent4, transparency: 90, r: 0.2 });
    txt(s, "验收清单", { x: 8.75, y: 1.98, w: 3.5, h: 0.45, fontSize: 18, bold: true, color: C.accent4 });
    ["随机抽题，不重复", "计时到点自动变色", "手机和投影都看得清", "断网也能打开"].forEach((t, i) => {
      const y = 2.58 + i * 0.5;
      s.addShape(SH.roundRect, { x: 8.78, y: y + 0.07, w: 0.3, h: 0.3, rectRadius: 0.05, fill: { color: C.background1 }, line: { color: HEX.teal, width: 2 } });
      txt(s, t, { x: 9.25, y, w: 3.4, h: 0.44, fontSize: 16, color: C.text1, valign: "middle" });
    });
    bubble(s, "彩蛋：今天这份 PPT，也是我跟 AI 一轮轮聊出来的——想法、取舍和验收是我的，大量具体执行交给了 AI。", 8.45, 5.0, 4.28, 1.75, { fill: C.accent2, color: C.text1, fontSize: 15, align: "left" });
  }

  // =====================================================================
  // 普通人如何开始
  // =====================================================================
  // 25 六个词
  {
    const s = newSlide("LIGHT", "普通人如何开始");
    heads(s, "普通人如何开始", "六个词，用“跑腿”就能讲明白");
    const g = [
      { t: "AI 聊天", d: "你问「辣条在哪买？」它告诉你。腿，还是你自己跑。", ic: "FaComments", c: C.accent3 },
      { t: "AI 完成任务", d: "你说「帮我买包辣条」，它跑一趟，把东西带回来。", ic: "FaPersonRunning", c: C.accent1 },
      { t: "工作流", d: "固定的跑腿路线：先去哪、再去哪、最后检查什么。", ic: "FaRoute", c: C.accent4 },
      { t: "Skills", d: "写好的跑腿说明书：买哪种、预算多少、没货怎么办。下次照做。", ic: "FaBookOpen", c: C.accent2 },
      { t: "Agent", d: "会自己想办法的跑腿小哥：这家没货，自己换一家。", ic: "FaRobot", c: C.accent5 },
      { t: "自动化", d: "不用喊：每周六下午三点，辣条自动送到沙发。", ic: "FaRepeat", c: C.text1 },
    ];
    for (let i = 0; i < 6; i++) {
      const it = g[i], x = MX + (i % 3) * 4.115, y = 1.8 + Math.floor(i / 3) * 2.55;
      card(s, x, y, 3.9, 2.35, { fill: C.background2, r: 0.2 });
      await iconCircle(s, it.ic, x + 0.3, y + 0.3, 0.62, { fill: it.c });
      txt(s, it.t, { x: x + 1.1, y: y + 0.3, w: 2.7, h: 0.62, fontSize: 22, bold: true, color: C.text1, valign: "middle" });
      txt(s, it.d, { x: x + 0.3, y: y + 1.1, w: 3.35, h: 1.15, fontSize: 15, color: HEX.muted });
    }
  }

  // 26 两条路线
  {
    const s = newSlide("LIGHT", "普通人如何开始");
    heads(s, "普通人如何开始", "两条起步路线：先用起来，再谈付费");
    const routes = [
      { x: MX, t: "国内路线", c: C.accent1, items: [["豆包", "字节跳动的 AI 助手：聊天、写作、识图，上手快"], ["DeepSeek", "擅长推理和长文本问答"], ["千问", "阿里的 AI 助手，已接入淘宝、支付宝、高德等，能帮你“办事”"], ["WorkBuddy", "腾讯的办公智能体，能在电脑上帮你处理文件和文档"]] },
      { x: 6.78, t: "国际路线", c: C.accent3, items: [["ChatGPT", "OpenAI 的综合型 AI 助手"], ["Claude", "Anthropic 的 AI 助手，擅长长文写作与分析"], ["Claude Code", "能直接写代码、做网页的编程 Agent"], ["Codex", "OpenAI 的编程 Agent：今天的抽奖网页和粤语工具都出自它"]] },
    ];
    for (const r of routes) {
      card(s, r.x, 1.75, 5.95, 3.4, { fill: r.c, transparency: 91, r: 0.2 });
      txt(s, r.t, { x: r.x + 0.3, y: 1.9, w: 3, h: 0.5, fontSize: 20, bold: true, color: r.c });
      r.items.forEach(([n, d], i) => {
        const y = 2.5 + i * 0.64;
        txt(s, n, { x: r.x + 0.3, y, w: 1.65, h: 0.56, fontSize: 16, bold: true, color: C.text1, valign: "middle" });
        txt(s, d, { x: r.x + 1.95, y, w: 3.85, h: 0.56, fontSize: 13, color: HEX.muted, valign: "middle" });
      });
    }
    const flow = ["先用免费或已有工具\n解决一个真实问题", "遇到明确限制\n额度 · 功能 · 质量 · 交付", "再评估要不要付费"];
    flow.forEach((t, i) => {
      s.addText(t, {
        shape: SH.chevron, x: MX + i * 4.06, y: 5.35, w: 4.0, h: 0.85,
        fill: { color: i === 2 ? C.accent2 : C.background2 }, line: { type: "none" },
        color: C.text1, fontSize: 14, bold: true, align: "center", valign: "middle", margin: [0, 0.45, 0, 0.45],
      });
    });
    txt(s, "产品功能、可用地区和价格变化很快，请以官网为准（信息核对于 2026 年 10 月）。国际产品多数未在中国大陆提供官方服务。", { x: MX, y: 6.42, w: 12.1, h: 0.4, fontSize: 11, color: HEX.gray });
  }

  // =====================================================================
  // 总结与行动
  // =====================================================================
  // 27 四步法
  {
    const s = newSlide("LIGHT", "总结与行动");
    heads(s, "带走一个方法", "派活四步：想清楚、说清楚、放手跑、回来验");
    const st = [
      ["想清楚要什么", "要哪种辣条？买给谁吃？", C.accent1],
      ["把任务交代清楚", "给多少钱、去哪买、几点前回来", C.accent2],
      ["让 AI 执行", "放手让它跑，别一直盯着", C.accent3],
      ["检查并不断调整", "买错了？说清楚，再跑一趟", C.accent4],
    ];
    st.forEach(([t, d, c], i) => {
      const x = MX + i * 3.093, y = 1.85;
      card(s, x, y, 2.85, 4.1, { fill: c, transparency: 89, r: 0.22 });
      txt(s, String(i + 1), { x: x + 0.3, y: y + 0.2, w: 1.2, h: 1.1, fontSize: 60, bold: true, color: c });
      txt(s, t, { x: x + 0.3, y: y + 1.45, w: 2.4, h: 0.95, fontSize: 21, bold: true, color: C.text1 });
      txt(s, "买辣条版：", { x: x + 0.3, y: y + 2.55, w: 2.4, h: 0.35, fontSize: 13, bold: true, color: HEX.gray });
      txt(s, d, { x: x + 0.3, y: y + 2.9, w: 2.35, h: 1.0, fontSize: 15, color: HEX.muted });
    });
    txt(s, "第 4 步不是终点：调整完，再来一轮。", { x: MX, y: 6.25, w: 12, h: 0.45, fontSize: 17, bold: true, color: C.text1 });
  }

  // 28 行动 + 工具包
  {
    const s = newSlide("LIGHT", "总结与行动");
    heads(s, "今晚就试", "从身边一件小事开始");
    const ps = [
      ["职场人", "把一段会议记录交给 AI，整理成「谁、做什么、哪天交」的待办表。", "FaBriefcase", C.accent3],
      ["销售 / 管理者", "让 AI 把你最常回答的客户问题，整理成一份团队话术手册。", "FaUserTie", C.accent1],
      ["家长", "和 AI 一起，给孩子做一个背单词或算术的小游戏。", "FaChildReaching", C.accent4],
      ["演讲爱好者", "把演讲稿交给 AI：按 5–7 分钟改稿，再挑出三处可以更好笑的地方。", "FaMicrophone", C.accent5],
    ];
    for (let i = 0; i < 4; i++) {
      const [t, d, ic, c] = ps[i];
      const x = MX + (i % 2) * 4.12, y = 1.8 + Math.floor(i / 2) * 2.5;
      card(s, x, y, 3.92, 2.3, { fill: C.background2, r: 0.2 });
      await iconCircle(s, ic, x + 0.3, y + 0.3, 0.6, { fill: c });
      txt(s, t, { x: x + 1.05, y: y + 0.3, w: 2.7, h: 0.6, fontSize: 20, bold: true, color: C.text1, valign: "middle" });
      txt(s, d, { x: x + 0.3, y: y + 1.05, w: 3.4, h: 1.15, fontSize: 15, color: HEX.muted });
    }
    card(s, 9.0, 1.8, 3.73, 4.8, { fill: C.text1, r: 0.22 });
    card(s, 9.62, 2.2, 2.5, 2.5, { fill: C.background1, r: 0.12, line: HEX.gray, dash: "dash", name: "课后工具包二维码占位" });
    s.addImage({ data: await icon("FaQrcode", "#8B8A99"), x: 10.47, y: 2.8, w: 0.8, h: 0.8 });
    txt(s, "二维码待补充", { x: 9.62, y: 3.75, w: 2.5, h: 0.4, fontSize: 13, color: HEX.gray, align: "center" });
    txt(s, "课后工具包", { x: 9.2, y: 4.95, w: 3.33, h: 0.5, fontSize: 22, bold: true, color: C.background1, align: "center" });
    txt(s, "提示词模板 · 工具清单", { x: 9.2, y: 5.5, w: 3.33, h: 0.4, fontSize: 14, color: "C9C7D6", align: "center" });
  }

  // 29 结尾
  {
    const s = newSlide("STAGE", "总结与行动");
    txt(s, [
      { text: "AI 让我有能力做更多的事，", options: { breakLine: true } },
      { text: "而我真正要学会的，", options: { breakLine: true } },
      { text: "是选择那些值得做的事。", options: { color: C.accent2 } },
    ], { x: MX + 0.3, y: 1.0, w: 9.6, h: 3.6, fontSize: 44, bold: true, color: C.background1, valign: "middle", lineSpacingMultiple: 1.15 });
    ill(s, "latiao", 10.55, 1.35, 2.9);
    txt(s, "我哥当年最厉害的，不是会使唤人——\n是他清楚自己要哪一包辣条。", { x: MX + 0.3, y: 4.95, w: 9.5, h: 1.0, fontSize: 19, color: "9A98AB" });
    txt(s, "谢谢大家", { x: MX + 0.3, y: 6.15, w: 5, h: 0.6, fontSize: 26, bold: true, color: C.background1 });
  }

  // =====================================================================
  // 附录
  // =====================================================================
  // 30 备份成果
  {
    const s = newSlide("LIGHT", "附录");
    heads(s, "附录 · 现场任务没跑完时使用", "备份成果：提前跑好的同款任务");
    const fr = ["Claude Code 版", "Codex 版", "国内 Agent 版（如 WorkBuddy）"];
    fr.forEach((t, i) => {
      const x = MX + i * 4.12;
      card(s, x, 1.85, 3.88, 3.6, { fill: C.background2, r: 0.18, line: HEX.gray, dash: "dash", name: `${t}截图占位` });
      txt(s, "成果截图待补充", { x, y: 3.35, w: 3.88, h: 0.5, fontSize: 16, color: HEX.gray, align: "center" });
      txt(s, t, { x, y: 5.6, w: 3.88, h: 0.45, fontSize: 17, bold: true, color: C.text1, align: "center" });
    });
    txt(s, "讲法：展示成果 → 对照验收清单指出差距 → 说明 AI 也需要检查和迭代", { x: MX, y: 6.3, w: 12, h: 0.45, fontSize: 15, color: HEX.muted });
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  await patchEastAsianFont(OUT, THEME.headFontFace);
  console.log("written", OUT, "slides:", slideNo);
}

// 主题里的中文字体（ea）默认是空的，补上
async function patchEastAsianFont(file, font) {
  const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const part = "ppt/theme/theme1.xml";
  let xml = await zip.file(part).async("string");
  xml = xml.replace(/<a:ea typeface=""\/>/g, `<a:ea typeface="${font}"/>`)
    .replace(/<a:font script="Hans" typeface="[^"]*"\/>/g, `<a:font script="Hans" typeface="${font}"/>`);
  zip.file(part, xml);
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

main().catch((e) => { console.error(e); process.exit(1); });

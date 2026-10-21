// 《蕲水长流》v2 的全部内容：分段、画面模式、镜头、标签。改内容只动这个文件和 voiceover.json。
// 每段的时长由配音决定：lead（配音前留白）+ 各句配音 + 句间 gap + tail（配音后留白），不少于 min。
// 地图镜头用 p（0..1，段内进度）定位关键帧。坐标单位米，原点 115.57°E, 30.33°N；x 向东，z 向南。

export const FPS = 30;
export const GAP = 0.7;        // 同一段内两句配音之间的停顿（秒）
export const XFADE = 1.2;      // 段与段之间的交叉淡化（秒）

export const title = {
  zh: '蕲水长流', en: 'The Qi River Flows On',
  sub: '湖北 · 蕲春', subEn: 'Qichun, Hubei',
};

export const credits = [
  '数据与素材 Sources',
  '建筑轮廓：Shi Q. et al. (2023), CC BY 4.0, via Overture Maps 2026-09-23 · 行政边界 / 水系 / 道路：© OpenStreetMap contributors',
  '地形：AWS Terrain Tiles · 配音：标贝语料 Tacotron2（zhtts，MIT）本地合成 · 配乐：原创编曲，GeneralUser GS 音色库',
  '画面全部由 Claude 写代码渲染 · 水墨与书页为示意 · 建筑高度缺失，统一按 6 米示意',
];

// 顶部时代刻度
export const eras = ['西周', '西汉', '唐', '明', '近代', '今天'];

const QZ = [-22000, 15, 30200];      // 蕲州镇老城
const YH = [-21700, 15, 30900];      // 老城与雨湖之间
const CAOHE = [-13160, 26, 10279];   // 漕河（县城）

export const segments = [
  { id: 'open', mode: 'smoke', variant: 'open', vo: ['hook1', 'hook2'], lead: 1.6, tail: 0.6 },
  { id: 'title', mode: 'ink', variant: 'title', vo: [], min: 5.5, showTitle: true },

  { id: 'geo', mode: 'map', vo: ['geo1', 'geo2'], lead: 0.8, tail: 1.2, header: true,
    camera: [
      { p: 0, target: [-6000, 0, 8000], dist: 150000, az: -8, el: 62 },
      { p: 0.42, target: [-2000, 0, 4000], dist: 98000, az: 0, el: 50 },
      { p: 0.62, target: [14000, 400, -6000], dist: 46000, az: 22, el: 32 },
      { p: 1, target: [-4000, 50, 6000], dist: 48000, az: -12, el: 40 },
    ],
    lines: [{ id: 'border', from: 0.02, to: 0.3, width: 3 }, { id: 'qishui', from: 0.66, to: 0.98, width: 6 }],
    labels: [
      { p: 'peak', from: 0.5, to: 0.72, zh: '县内最高点 约 1230 米', en: 'Highest point ≈1,230 m (DEM)' },
      { p: [-2500, 40, 1500], from: 0.78, to: 1, zh: '蕲水', en: 'Qi River' },
    ] },

  { id: 'zhou', mode: 'ink', variant: 'stilts', era: 0, vo: ['zhou1', 'zhou2'], lead: 1.0, tail: 1.0,
    seal: '西周', note: '木构建筑为示意，依据毛家咀遗址发掘报告' },

  { id: 'han', mode: 'map', era: 1, vo: ['han1'], lead: 0.6, tail: 1.0, sepia: 0.3, header: true,
    camera: [
      { p: 0, target: [0, 0, 0], dist: 125000, az: -6, el: 58 },
      { p: 1, target: [0, 0, 2000], dist: 110000, az: 6, el: 60 },
    ],
    lines: [{ id: 'border', from: 0, to: 0.5, width: 4 }],
    year: { zh: '西汉', en: '202 BCE – 8 CE' } },

  { id: 'tang', mode: 'ink', variant: 'bamboo', era: 2, vo: ['tang1', 'tang2'], lead: 0.8, tail: 1.2,
    seal: '唐', poem: '笛竹出蘄春', poemBy: '白居易' },

  { id: 'qizhou', mode: 'map', era: 3, vo: ['qz1', 'qz2'], lead: 0.6, tail: 0.8, sepia: 0.3, header: true,
    camera: [
      { p: 0, target: [-20000, 15, 29500], dist: 32000, az: -55, el: 40 },
      { p: 0.55, target: QZ, dist: 10000, az: -40, el: 34 },
      { p: 1, target: QZ, dist: 6800, az: -15, el: 33 },
    ],
    lines: [{ id: 'yangtze', from: 0, to: 0.4, width: 7, hold: 0.7 }, { id: 'border', from: 0, to: 0.01, width: 3 }],
    labels: [
      { p: [-24300, 12, 30800], from: 0.12, to: 0.5, zh: '长江', en: 'Yangtze' },
      { p: [-22300, 20, 29700], from: 0.4, to: 1, zh: '蕲州镇', en: 'Qizhou · old prefectural seat' },
    ],
    year: { zh: '1445', en: '明 正统十年', from: 0.5 } },

  { id: 'li', mode: 'map', era: 3, vo: ['li1'], lead: 0.4, tail: 0.6, sepia: 0.3, header: true, focus: [-21700, 30900],
    camera: [
      { p: 0, target: YH, dist: 6000, az: 0, el: 34 },
      { p: 1, target: YH, dist: 5000, az: 28, el: 36 },
    ],
    lines: [{ id: 'border', from: 0, to: 0.01, width: 3 }],
    labels: [
      { p: 'yuhu', from: 0.05, to: 1, zh: '雨湖', en: 'Yu Lake' },
      { p: 'lishizhen_museum', from: 0.1, to: 1, zh: '李时珍纪念馆', en: 'Li Shizhen Memorial' },
      { p: 'lishizhen_tomb', from: 0.15, to: 1, zh: '李时珍墓', en: 'Tomb of Li Shizhen' },
    ],
    year: { zh: '1518', en: '明 正德十三年' } },

  { id: 'herbs', mode: 'ink', variant: 'herbs', era: 3, vo: ['li2', 'li3'], lead: 0.6, tail: 1.0, seal: '本草' },
  { id: 'book', mode: 'book', era: 3, vo: ['li4', 'li5'], lead: 0.8, tail: 1.0, stampAt: 'li5' },
  // 流行：书名成了同名流行歌。配乐是原创的中国风节拍，不使用原曲
  { id: 'pop', mode: 'pop', era: 5, vo: ['pop1'], lead: 1.3, tail: 1.6, bpm: 96 },

  { id: 'treasures', mode: 'treasures', era: 5, vo: ['folk1'], lead: 0.6, tail: 1.0 },
  { id: 'field', mode: 'field', era: 5, vo: ['folk2'], lead: 1.4, tail: 1.6 },
  { id: 'moxa', mode: 'smoke', variant: 'moxa', era: 5, vo: ['folk3'], lead: 1.0, tail: 1.2 },
  { id: 'pottery', mode: 'pottery', era: 5, vo: ['folk4'], lead: 1.0, tail: 1.4 },
  { id: 'people', mode: 'portrait', era: 4, vo: ['ppl1'], lead: 0.6, tail: 1.8,
    people: [
      { name: '黄侃', years: '1886–1935', role: '国学大师 · 章黄学派', en: 'Huang Kan · philologist' },
      { name: '胡风', years: '1902–1985', role: '文艺理论家 · 诗人', en: 'Hu Feng · literary theorist' },
    ] },

  { id: 'now', mode: 'map', era: 5, vo: ['now1', 'now2', 'now3'], lead: 0.8, tail: 1.0, header: true,
    grow: [0.05, 0.6], train: [0.02, 0.35], counter: [0.72, 0.95],
    camera: [
      { p: 0, target: CAOHE, dist: 18000, az: 20, el: 36 },
      { p: 0.4, target: CAOHE, dist: 9000, az: -20, el: 34 },
      { p: 0.72, target: [0, 0, 2000], dist: 100000, az: 0, el: 52 },
      { p: 1, target: [0, 0, 2000], dist: 108000, az: 6, el: 54 },
    ],
    lines: [{ id: 'hsr', from: 0.05, to: 0.35, width: 5 }, { id: 'border', from: 0, to: 0.01, width: 3 }],
    labels: [{ p: 'caohe', from: 0.04, to: 0.45, zh: '漕河 · 县城', en: 'Caohe · county seat' }],
    year: { zh: '2022', en: '黄黄高铁开通', to: 0.4 } },

  { id: 'end', mode: 'map', vo: ['end1'], lead: 0.4, tail: 0.8, grow: [0, 0], growDone: true, header: false,
    camera: [
      { p: 0, target: [0, 0, 2000], dist: 108000, az: 6, el: 54 },
      { p: 1, target: [0, 0, 2000], dist: 135000, az: 12, el: 60 },
    ],
    lines: [{ id: 'border', from: 0, to: 0.01, width: 3 }, { id: 'hsr', from: 0, to: 0.01, width: 5 }] },
  { id: 'outro', mode: 'ink', variant: 'title', vo: ['end2'], lead: 1.0, tail: 6.5, showTitle: true, credits: true },
];

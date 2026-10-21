// 《蕲水长流》的全部内容：镜头、字幕、标签、时间轴。改内容只动这个文件。
// 坐标单位是米，原点在 115.57°E, 30.33°N；x 向东，z 向南，y 向上。
// 镜头参数：target 看向的点，dist 距离，az 方位角（0 = 从南往北看），el 俯角。

export const FPS = 30;
export const DURATION = 156;

export const title = {
  zh: '蕲水长流',
  en: 'The Qi River Flows On',
  sub: '湖北 · 蕲春 · 从西周到今天',
  subEn: 'Qichun, Hubei · from the Western Zhou to today',
};

export const header = {
  zh: '蕲春 · 大别山南麓 · 长江北岸',
  en: 'Qichun County · terrain ×1.6 · building footprints',
};

export const credits = [
  '数据来源 Data',
  '建筑轮廓：Shi Q. et al., East Asian building footprints (2023), CC BY 4.0, via Overture Maps 2026-09-23',
  '行政边界 / 水系 / 道路 / 铁路：Overture Maps 2026-09-23 · © OpenStreetMap contributors',
  '地形：AWS Terrain Tiles（Mapzen / SRTM 等）',
  '画面全部由 Claude 写代码渲染 · 建筑高度数据缺失，统一按 6 米示意',
];

// 时间轴：每个时代在顶部刻度上的位置，from/to 是这一段在片子里的秒数
export const eras = [
  { zh: '西周', en: 'W. Zhou', from: 26, to: 40 },
  { zh: '西汉', en: 'W. Han', from: 40, to: 52 },
  { zh: '唐', en: 'Tang', from: 52, to: 68 },
  { zh: '明', en: 'Ming', from: 68, to: 110 },
  { zh: '近代', en: 'Modern', from: 110, to: 122 },
  { zh: '今天', en: 'Today', from: 122, to: 156 },
];

// 镜头关键帧（按时间排序，中间平滑插值）
const QZ = [-22000, 15, 30200];      // 蕲州镇老城一带
const YH = [-21700, 15, 30900];      // 老城与雨湖之间
const CAOHE = [-13160, 26, 10279];   // 漕河（县城）
export const camera = [
  { t: 0, target: [-6000, 0, 8000], dist: 150000, az: -8, el: 62 },
  { t: 9, target: [-2000, 0, 4000], dist: 100000, az: 0, el: 50 },
  { t: 16, target: [16000, 500, -6000], dist: 42000, az: 25, el: 30 },
  { t: 22, target: [4000, 100, 2000], dist: 52000, az: 10, el: 38 },
  { t: 28, target: [-4000, 50, 6000], dist: 46000, az: -15, el: 40 },
  { t: 38, target: [-8000, 30, 10000], dist: 40000, az: -30, el: 42 },
  { t: 44, target: [0, 0, 0], dist: 120000, az: -5, el: 58 },
  { t: 51, target: [0, 0, 2000], dist: 112000, az: 5, el: 60 },
  { t: 58, target: [-20000, 15, 29500], dist: 20000, az: -55, el: 36 },
  { t: 67, target: QZ, dist: 9500, az: -40, el: 34 },
  { t: 77, target: QZ, dist: 6000, az: -15, el: 33 },
  { t: 86, target: YH, dist: 5600, az: 10, el: 34 },
  { t: 98, target: YH, dist: 5200, az: 32, el: 36 },
  { t: 108, target: YH, dist: 8000, az: 40, el: 40 },
  { t: 116, target: [-6000, 0, 8000], dist: 70000, az: 30, el: 48 },
  { t: 124, target: CAOHE, dist: 16000, az: 20, el: 36 },
  { t: 134, target: CAOHE, dist: 9000, az: -20, el: 34 },
  { t: 144, target: [0, 0, 2000], dist: 105000, az: 0, el: 52 },
  { t: 156, target: [0, 0, 2000], dist: 125000, az: 8, el: 58 },
];

// 高亮折线：在 [from, to] 秒内从 0 画到 1，hold 之前保持亮，之后淡出；width 是屏幕像素
export const lines = [
  { id: 'border', from: 2, to: 9, hold: 156, width: 3, color: '#ffd89a' },
  { id: 'qishui', from: 18, to: 26, hold: 42, width: 6, color: '#7fd0ff' },
  { id: 'yangtze', from: 53, to: 60, hold: 70, width: 7, color: '#7fd0ff' },
  { id: 'hsr', from: 127, to: 134, hold: 156, width: 5, color: '#ffe2b0' },
];

// 建筑：history 段只显示低矮暗影；growFrom..growTo 秒内从县城向外长高
export const buildings = { growFrom: 123, growTo: 140, ghost: 0.6 };

// 地面标签：p 可以是 meta.points 里的名字，也可以直接给坐标
export const labels = [
  { p: 'peak', from: 13, to: 22, zh: '县内最高点 约 1230 米', en: 'Highest point ≈1,230 m (DEM)' },
  { p: [-2500, 40, 1500], from: 21, to: 27, zh: '蕲水', en: 'Qi River' },
  { p: [-24300, 12, 30800], from: 56, to: 68, zh: '长江', en: 'Yangtze' },
  { p: 'yuhu', from: 82, to: 108, zh: '雨湖', en: 'Yu Lake' },
  { p: 'lishizhen_museum', from: 84, to: 108, zh: '李时珍纪念馆', en: 'Li Shizhen Memorial' },
  { p: 'lishizhen_tomb', from: 86, to: 108, zh: '李时珍墓', en: 'Tomb of Li Shizhen' },
  { p: [-22300, 20, 29700], from: 66, to: 80, zh: '蕲州镇', en: 'Qizhou town · old prefectural seat' },
  { p: 'chidonghu', from: 61, to: 68, zh: '赤东湖', en: 'Chidong Lake' },
  { p: 'caohe', from: 125, to: 142, zh: '漕河 · 县城', en: 'Caohe · county seat' },
];

// 大号年份（左侧）
export const years = [
  { from: 27, to: 40, zh: '西周', en: 'c. 11th–8th c. BCE' },
  { from: 41, to: 52, zh: '西汉', en: '202 BCE – 8 CE' },
  { from: 61, to: 68, zh: '唐', en: '618 – 907' },
  { from: 69, to: 78, zh: '1445', en: '明 正统十年' },
  { from: 79, to: 87, zh: '1518', en: '明 正德十三年' },
  { from: 87, to: 96, zh: '1578', en: '' },
  { from: 96, to: 102, zh: '1596', en: '' },
  { from: 102, to: 109, zh: '2011', en: '' },
  { from: 111, to: 122, zh: '1886–1985', en: '' },
  { from: 124, to: 134, zh: '2022', en: '' },
  { from: 134, to: 145, zh: '今天', en: 'Today' },
];

// 字幕：src 是这句话的出处，片中以小字显示
export const subs = [
  { from: 1.5, to: 8.5, zh: '长江中游北岸，大别山南麓。', en: 'The north bank of the middle Yangtze, at the southern foot of the Dabie Mountains.' },
  { from: 9, to: 14.5, zh: '这里是湖北蕲春，面积约 2398 平方公里。', en: 'This is Qichun, Hubei — about 2,398 square kilometres.', src: '生态环境部，2023-01' },
  { from: 15, to: 20.5, zh: '北部是山，县内最高处海拔一千二百多米。', en: 'Mountains rise in the north, topping 1,200 metres.', src: '高程：AWS Terrain Tiles 计算' },
  { from: 21, to: 26, zh: '蕲水自东北向西南，穿过全境，汇入长江。', en: 'The Qi River runs north-east to south-west, into the Yangtze.', src: 'Overture Maps 水系' },
  { from: 27, to: 32.5, zh: '三千年前的西周，蕲水流域已有成片的木构建筑。', en: 'Three thousand years ago, in the Western Zhou, timber buildings stood along the Qi.', src: '《考古》1962 年第 1 期：湖北蕲春毛家咀西周木构建筑' },
  { from: 33, to: 39.5, zh: '株林镇毛家咀遗址，2013 年列为全国重点文物保护单位。', en: 'The Maojiazui site was listed as a National Key Cultural Relic in 2013.', src: '第七批全国重点文物保护单位，2013' },
  { from: 41, to: 46, zh: '西汉，《汉书·地理志》江夏郡下，已有「蕲春」。', en: 'By the Western Han, the Book of Han lists Qichun as a county of Jiangxia.', src: '《汉书·地理志》江夏郡' },
  { from: 46.5, to: 51.5, zh: '「蘄，艸也。」江夏有蕲春亭。——《说文解字》', en: '"Qi is a herb… Jiangxia has the Qichun pavilion." — Shuowen Jiezi', src: '《说文解字·艸部》' },
  { from: 53, to: 59.5, zh: '此后一千多年，长江边的蕲州，一直是这片土地的州治。', en: 'For over a thousand years, Qizhou on the Yangtze was the seat of the prefecture.', src: '蕲州：6 世纪至 1912 年' },
  { from: 60, to: 67, zh: '唐代，韩愈收到友人从蕲州寄来的竹席，写下《郑群赠簟》。', en: 'In the Tang, Han Yu wrote a poem on a bamboo mat sent from Qizhou.', src: '韩愈《郑群赠簟》' },
  { from: 69, to: 77, zh: '明正统十年（1445 年），荆王府由江西建昌迁到蕲州。', en: 'In 1445, the Prince of Jing moved his court from Jianchang to Qizhou.', src: '《明英宗实录》；CBDB；ctext' },
  { from: 79, to: 86, zh: '1518 年，李时珍生于蕲州。', en: 'In 1518, Li Shizhen was born in Qizhou.', src: 'UNESCO 世界记忆项目' },
  { from: 87, to: 95.5, zh: '他用 27 年，写成《本草纲目》：52 卷，收药 1892 种。', en: 'Over 27 years he compiled the Bencao Gangmu: 52 volumes, 1,892 medicinal substances.', src: 'UNESCO；通行统计' },
  { from: 96, to: 101.5, zh: '1593 年他去世；三年后，金陵本《本草纲目》刊行。', en: 'He died in 1593; three years later the Jinling edition was printed.', src: '金陵胡承龙刻本，1596' },
  { from: 102, to: 108.5, zh: '2011 年，《本草纲目》入选联合国教科文组织《世界记忆名录》。', en: 'In 2011, it entered UNESCO’s Memory of the World Register.', src: 'UNESCO Memory of the World, 2011' },
  { from: 111, to: 116, zh: '近代，这里走出了国学大师黄侃（1886–1935），', en: 'In modern times, Qichun produced the philologist Huang Kan (1886–1935)', src: 'Wikipedia「Huang Kan」' },
  { from: 116.5, to: 121.5, zh: '和文艺理论家胡风（1902–1985）。', en: 'and the literary theorist Hu Feng (1902–1985).', src: '汉典「胡风」' },
  { from: 124, to: 133, zh: '2022 年 4 月 22 日，黄黄高铁开通，蕲春南站迎来第一班车。', en: 'On 22 April 2022 the Huanggang–Huangmei high-speed line opened, with a stop at Qichun South.', src: '中新网，2022-04-22' },
  { from: 134, to: 144, zh: '卫星影像里，蕲春有 105,329 栋建筑。', en: 'Satellite imagery maps 105,329 buildings across Qichun.', src: 'Shi et al. 2023 / Overture Maps，蕲春县界内统计' },
  { from: 146, to: 154, zh: '从西周的木构，到今天的高铁。蕲水长流。', en: 'From Zhou timber halls to high-speed rail — the Qi flows on.' },
];

// 右下角计数器：today 段把建筑数从 0 数到总数
export const counter = { from: 134, to: 142, label: '栋建筑 buildings' };

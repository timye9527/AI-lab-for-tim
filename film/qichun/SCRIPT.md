# 《蕲水长流》脚本 v0.1

> 湖北蕲春 · 从西周到今天 · 156 秒 · 1920×1080 · 30fps
> 风格参考 @EianLu《一座城的年轮》：暖色白模 + 蓝色水系 + 顶部时间轴 + 中英双语字幕 + 地标引线标签。
> 画面全部由代码渲染（three.js + 无头 Chromium 逐帧截图 + ffmpeg）。

## 一、设计思路

- **主线**：沿蕲水，从地理到历史，再到今天。片名「蕲水长流」：蕲水是贯穿全县的河，也串起三千年。
- **从蕲州扩到蕲春**：蕲州镇是古蕲州州治、李时珍故里，是情感核心；但西周遗址、县城、高铁都在县域其他地方，所以镜头以全县为舞台，在蕲州做最长的特写。
- **数据可检验**：每句字幕下方都有一行小字出处。数字只用两类：① 有公开出处的史实与官方数字；② 用公开数据集自己算出来的数（建筑数量、海拔、面积），写明是怎么算的。
- **不编造**：没有可靠坐标的地点（如毛家咀遗址），不在地图上打点，只高亮它所在的蕲水流域。没有高度数据的建筑统一按 6 米示意，片尾注明。

## 二、分镜与字幕

| 时间 | 章节 | 画面 | 中文字幕 | 英文字幕 | 出处 |
|---|---|---|---|---|---|
| 0–9s | 开场 | 高空俯瞰，县界金线描出轮廓；片名「蕲水长流」 | 长江中游北岸，大别山南麓。 | The north bank of the middle Yangtze, at the southern foot of the Dabie Mountains. | — |
| 9–15s | 地理 | 镜头下压 | 这里是湖北蕲春，面积约 2398 平方公里。 | This is Qichun, Hubei — about 2,398 km². | 生态环境部 2023-01；用 Overture 县界复算约 2392 km² |
| 15–21s | 地理 | 飞向东北山区，标注最高点 | 北部是山，县内最高处海拔一千二百多米。 | Mountains rise in the north, topping 1,200 m. | AWS Terrain Tiles 计算（县界内最大值约 1230 m） |
| 21–26s | 地理 | 蕲水蓝线从东北画到西南 | 蕲水自东北向西南，穿过全境，汇入长江。 | The Qi River runs north-east to south-west, into the Yangtze. | Overture Maps 水系 |
| 27–33s | 西周 | 时间轴走到「西周」，画面转旧色 | 三千年前的西周，蕲水流域已有成片的木构建筑。 | Three thousand years ago... timber buildings stood along the Qi. | 《考古》1962 年第 1 期《湖北蕲春毛家咀西周木构建筑》 |
| 33–40s | 西周 | 同上 | 株林镇毛家咀遗址，2013 年列为全国重点文物保护单位。 | ...listed as a National Key Cultural Relic in 2013. | 第七批全国重点文物保护单位（2013） |
| 41–46s | 西汉 | 拉到全县，县界高亮 | 西汉，《汉书·地理志》江夏郡下，已有「蕲春」。 | By the Western Han, the Book of Han lists Qichun as a county of Jiangxia. | 《汉书·地理志》江夏郡条 |
| 46–52s | 西汉 | 同上 | 「蘄，艸也。」江夏有蕲春亭。——《说文解字》 | "Qi is a herb… Jiangxia has the Qichun pavilion." | 《说文解字·艸部》 |
| 53–60s | 唐 | 长江蓝线亮起，飞向蕲州 | 此后一千多年，长江边的蕲州，一直是这片土地的州治。 | For over a thousand years, Qizhou on the Yangtze was the seat of the prefecture. | 蕲州作为州名：6 世纪至 1912 年 |
| 60–67s | 唐 | 蕲州近景，赤东湖 | 唐代，韩愈收到友人从蕲州寄来的竹席，写下《郑群赠簟》。 | In the Tang, Han Yu wrote a poem on a bamboo mat sent from Qizhou. | 韩愈《郑群赠簟》 |
| 69–77s | 明 | 蕲州，年份「1445」 | 明正统十年（1445 年），荆王府由江西建昌迁到蕲州。 | In 1445, the Prince of Jing moved his court from Jianchang to Qizhou. | 《明英宗实录》；CBDB；ctext「朱瞻堈」 |
| 79–86s | 明 | 雨湖、李时珍纪念馆、李时珍墓标签 | 1518 年，李时珍生于蕲州。 | In 1518, Li Shizhen was born in Qizhou. | UNESCO 世界记忆项目 |
| 87–95s | 明 | 环绕雨湖 | 他用 27 年，写成《本草纲目》：52 卷，收药 1892 种。 | Over 27 years... 52 volumes, 1,892 medicinal substances. | UNESCO；通行统计 |
| 96–101s | 明 | 同上，年份「1596」 | 1593 年他去世；三年后，金陵本《本草纲目》刊行。 | He died in 1593; three years later the Jinling edition was printed. | 金陵胡承龙刻本（1596） |
| 102–108s | 明 | 同上，年份「2011」 | 2011 年，《本草纲目》入选联合国教科文组织《世界记忆名录》。 | In 2011, it entered UNESCO's Memory of the World Register. | UNESCO Memory of the World |
| 111–116s | 近代 | 拉远到全县 | 近代，这里走出了国学大师黄侃（1886–1935）， | ...the philologist Huang Kan (1886–1935) | Wikipedia「Huang Kan」 |
| 116–122s | 近代 | 同上 | 和文艺理论家胡风（1902–1985）。 | and the literary theorist Hu Feng (1902–1985). | 汉典「胡风」；Wikipedia「Hu Feng」 |
| 124–133s | 今天 | 旧色褪去；县城漕河，建筑从县城向外长出来；高铁线亮起 | 2022 年 4 月 22 日，黄黄高铁开通，蕲春南站迎来第一班车。 | On 22 April 2022 the Huanggang–Huangmei high-speed line opened... | 中新网 2022-04-22 |
| 134–144s | 今天 | 拉到全县，十万个光点；计数器数到 105,329 | 卫星影像里，蕲春有 105,329 栋建筑。 | Satellite imagery maps 105,329 buildings across Qichun. | Shi et al. 2023 / Overture Maps，蕲春县界内统计 |
| 146–156s | 片尾 | 片名 + 数据来源 | 从西周的木构，到今天的高铁。蕲水长流。 | From Zhou timber halls to high-speed rail — the Qi flows on. | — |

## 三、事实核对表

「状态」：✅ 已找到出处并互相印证；⚠️ 有出处但只查到二手转述，正式发布前请核对原文。

| # | 说法 | 出处 | 状态 |
|---|---|---|---|
| 1 | 蕲春面积约 2398 km² | [生态环境部 2023-01](https://www.mee.gov.cn/ywgz/zrstbh/swdyxbh/202301/t20230117_1013564.shtml)；Overture 县界复算 2392 km² | ✅ |
| 2 | 县内最高约 1230 m | AWS Terrain Tiles z12，去噪后取县界内最大值（DEM 精度约 30 m，取整说「一千二百多米」） | ✅（自算） |
| 3 | 毛家咀西周木构建筑；1958 年发掘 | 《考古》1962 年第 1 期发掘报告；百度百科转述 | ⚠️ 核对报告原文 |
| 4 | 毛家咀 2013 年第七批国保 | 百度百科转述 | ⚠️ 查国务院第七批名单 |
| 5 | 2025 年度发掘确认晚商—西周早期城址，城圈近 20 万 m²（片中暂未用，可做加长版素材） | 湖北省文物局 2026 年 1 月公布（只看到检索摘要的转述） | ⚠️ |
| 6 | 《汉书·地理志》江夏郡下有蕲春县 | [维基文库《汉书》卷 28](https://zh.wikisource.org/zh-hans/%E6%BC%A2%E6%9B%B8/%E5%8D%B7028) | ⚠️ 原文请对一下（我有把握，但这次没能直接打开网页） |
| 7 | 《说文》「蘄，艸也……江夏有蘄春亭」 | 《说文解字·艸部》，[dong-chinese 转引](https://www.dong-chinese.com/wiki/蕲) | ✅ |
| 8 | 蕲州作为州名从 6 世纪沿用到 1912 年 | Wikipedia「Qi Prefecture (Hubei)」 | ⚠️ 可补《隋书》《新唐书·地理志》 |
| 9 | 韩愈《郑群赠簟》咏蕲州竹簟 | [汉典「蕲簟」](https://www.zdic.net/hant/蕲簟) | ✅ 注意：首句各本作「蕲州笛竹天下知」或「蕲州竹簟天下知」，片中不直接引这一句 |
| 10 | 1445 年荆王由建昌迁蕲州 | [ctext 朱瞻堈](https://data.ctext.org/entity/227029)、[CBDB](https://cbdb.fas.harvard.edu/cbdbapi/person.php?id=0067490) | ✅ |
| 11 | 李时珍 1518–1593，蕲州人；27 年；1578 年完稿 | [UNESCO 丝路·本草纲目](https://en.unesco.org/silkroad/silk-road-themes/documentary-heritage/ben-cao-gang-mu-bencaogangmu-compendium-materia-medica) | ✅ |
| 12 | 52 卷、1892 种药 | 通行统计（汉典等）。另有「新增 374 种、附方 11096、插图 1100 余幅」，各本数字略有出入，片中只用最稳的两个 | ✅ |
| 13 | 1596 年金陵本刊行 | 多方一致（胡承龙刻本，万历二十四年） | ✅ |
| 14 | 2011 年入选《世界记忆名录》 | UNESCO（与《黄帝内经》同年） | ✅ |
| 15 | 黄侃 1886–1935，蕲春人 | Wikipedia「Huang Kan」；注意爱思想网把卒年误写成 1959 | ✅ |
| 16 | 胡风 1902–1985，原名张光人，蕲春人 | [汉典「胡风」](https://www.zdic.net/hans/胡風)、Wikipedia「Hu Feng」 | ✅ |
| 17 | 黄黄高铁 2022-04-22 开通，设蕲春南站 | [中新网 2022-04-22](https://www.chinanews.com.cn/cj/2022/04-22/9736284.shtml) | ✅ |
| 18 | 蕲春县界内 105,329 栋建筑 | 自算：Overture Maps 2026-09-23 建筑层，质心落在蕲春县界内的数量；数据源 Shi et al. 2023（[Zenodo 8174931](https://doi.org/10.5281/zenodo.8174931)）。由卫星影像识别，影像年份约 2020 年前后，不等于今天的实际数量 | ✅（自算） |

**还没用、但可以加的料**（需先补出处）：蕲春四宝（蕲竹、蕲艾、蕲蛇、蕲龟）；蕲艾国家地理标志（2021 年 9 月获批筹建地理标志示范区）；棋盘洲长江公路大桥（2015 年国家发改委批复，通车时间待核）；管窑陶器；常住人口（只找到媒体转述的约 76 万，没有找到统计公报原文，所以没用）。

## 四、数据与授权

| 图层 | 来源 | 授权 |
|---|---|---|
| 建筑轮廓 | Shi Q. et al. (2023) *A first high-quality vector data of buildings in East Asian countries*，经 Overture Maps 2026-09-23 | CC BY 4.0 |
| 县界、水系、道路、铁路 | Overture Maps 2026-09-23（底层是 OpenStreetMap） | ODbL，需署名 © OpenStreetMap contributors |
| 地形 | AWS Terrain Tiles（Mapzen；SRTM 等） | 公开数据，需署名 |
| 字体 | Noto Serif SC / Noto Sans SC | SIL OFL |
| 配乐 | `scripts/music.py` 程序合成 | 自有 |

## 五、下一版可以做的

1. **配音**：现在只有字幕和合成配乐；可以按上表的中文字幕录一条旁白，每段时长已经对好。
2. **蕲州古城**：如果能找到明清蕲州城墙的史料图（比如《蕲州志》的城图），可以像成都那版一样把古城轮廓叠在今天的白模上。这一版没有找到可靠的矢量轮廓，所以没画。
3. **毛家咀遗址的位置**：拿到准确坐标后，可以在西周段落打点。
4. **建筑高度**：可以换 CMAB 这类带高度的数据（清华的成都那版就是用的它），县城会更有立体感。

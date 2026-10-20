// 示範稿 v2：同 demo 一樣嘅事實，按 docs/VIDEO-PLAYBOOK.md 嘅打法重寫，用嚟同 v1 做對照。
// 由 AI 根據公開新聞編寫，只用嚟跑通流程，唔代表分析師觀點；標「發布前核對」嘅數字出街前要再核。
//
// 同 v1 嘅分別（每一項都對應 playbook 入面一條原則）：
// 0. v2.1：按渲染脚本嘅「畫面空檔」報告，將 12 秒嘅開場拆成兩段（同你有咩關係 / 懸念），結尾加 A / B 選項
// 1. 冇標題卡：開場直接用同封面 A 一樣嘅插畫 + 數字，兌現觀眾點擊時嘅期待
// 2. 開場埋一個「開放式懸念」（片尾 3 個訊號），喺最後一章兌現
// 3. 章節變成問題，章與章之間用「但係 / 所以」接，唔係「然後」
// 4. 第二個場景就講「同你有咩關係」（強積金 / 基金）
// 5. 結尾拋 A / B 選擇題引留言，並預告下集會回應留言
// 6. 3 個標題 + 3 張封面，交畀 YouTube「測試與比較」揀
// 7. 畫面一直有微推、入場有音效、字幕數字同重點詞高亮（引擎 motion / sfx 預設開）

export default {
  id: 'demo-v2',
  brand: '財經浩談',
  // 署名：真節目寫分析師名（要本人同公司同意），等觀眾知道係邊個嘅觀點
  byline: '示範稿 · 非分析師觀點',
  theme: 'paper',
  date: '10.16',
  disclaimerBar: true,
  host: { closed: '@/host/closed.svg', open: '@/host/open.svg', height: 340 },
  motion: true,
  sfx: true,

  titles: [
    '輝達借 5,000 億起算力：AI 會唔會係 1999 泡沫重演？｜財經浩談',
    'AI 算力變按揭！5,000 億循環融資，最危險係邊個？｜財經浩談',
    '1999 泡沫重演？3 個訊號睇 AI 爆唔爆｜財經浩談',
  ],
  thumbs: [
    { tag: '循環融資', l1: 'AI 算力', l2: '變按揭？', num: '$5,000億', img: 'loop' },
    { tag: '1999 重演？', l1: 'AI 泡沫', l2: '第幾局？', num: 'CAPE 41x', host: 'open' },
    { tag: 'GPU 做抵押', l1: '借錢買晶片', l2: '撐得幾耐？', chart: 'down' },
  ],
  voice: 'zh-HK-WanLungNeural',
  rate: '+8%',
  tags: ['財經浩談', '輝達', 'AI泡沫', '循環融資', '美股', '宏觀經濟', '粵語財經', '強積金'],
  description: '輝達聯同六大金融機構，計劃集資逾 5,000 億美元投入 AI 基建，主要靠借。錢點樣兜一個圈？同 1999 年電訊泡沫有幾似？片尾講 3 個最早響嘅訊號。',
  disclaimer: '以上內容只供參考，不構成任何投資建議。投資涉及風險，過往表現不代表將來。',

  scenes: [
    {
      // 開場 = 封面 A 嘅畫面：觀眾一入嚟就見到佢點擊嗰樣嘢
      type: 'sketch', img: 'loop', short: 'a',
      prompt: 'A circular flow diagram as a cartoon: on the left a big green computer chip, at the top center a classical bank building, on the right a tall blue server rack with a small grey storm cloud above it, at the bottom center a money bag; thick orange curved arrows connect them clockwise into a loop. Keep the middle area empty for a big number.',
      labels: [{ text: '*5,000 億美元*', x: 50, y: 58, size: 118, key: '五千億', rotate: -3 }],
      focus: [{ key: '借返嚟', x: 50, y: 45, zoom: 1.25 }, { key: '按揭', x: 50, y: 50, zoom: 1 }],
      say: '五千億美元。唔係輝達賺返嚟，係借返嚟。AI 算力，開始好似樓咁可以按揭。',
    },
    {
      // 同觀眾有咩關係
      type: 'hook', kicker: '同你有咩關係',
      big: '強積金、基金\n有冇*美股科技股*？', lead: '有嘅話，呢件事同你有關',
      say: '如果你嘅強積金或者基金有美股科技股，呢件事同你有關。',
    },
    {
      // 開放式懸念：最後一章兌現
      type: 'hook', kicker: '片尾揭曉',
      big: '*3 個訊號*\n邊個最早響？', lead: '響咗，就知道個圈轉唔轉得落去',
      say: '片尾我會講三個訊號，邊個最早響，就知道個圈仲轉唔轉得落去。',
    },

    { type: 'chapter', no: 1, title: '錢喺邊度嚟？', say: '首先，錢喺邊度嚟？' },
    {
      type: 'bullets', heading: '8 月 10 日 輝達宣布',
      items: ['聯同 *6 間金融巨頭* 簽備忘錄', '目標集資 *逾 5,000 億美元*', '以 *債務融資* 為主'],
      beats: [0.05, 0.62, 0.85],
      source: '聯合報、鉅亨網 2026-08（發布前核對）',
      say: '八月十日，輝達聯同阿波羅、黑石、貝萊德、布魯克菲爾德、高盛同 KKR 簽咗備忘錄，目標集資超過五千億美元，主要靠借。',
    },
    {
      type: 'quote', text: '唔係輝達自己出錢，\n而係將*算力*變成\n可以借錢嘅資產。', by: '所以呢',
      say: '所以，呢個唔係輝達自己掏錢，而係將算力變成一種可以拎去借錢嘅資產。',
    },

    // 「但係」：用一個新問題重新勾住觀眾（re-engagement）
    { type: 'chapter', no: 2, title: '但係，錢會唔會兜返轉頭？', lead: '所謂「循環融資」', say: '但係問題嚟喇：呢啲錢，最後會唔會兜返去輝達度？' },
    {
      type: 'flow', short: 'a', heading: '循環融資：錢點樣兜一個圈', loop: true,
      nodes: [
        { name: '輝達', note: '投資 / 協助融資' },
        { name: 'AI 雲端公司', note: '例如 CoreWeave' },
        { name: '借貸市場', note: '用 GPU 做抵押' },
        { name: '買輝達 GPU', note: '變返輝達收入' },
      ],
      beats: [0.02, 0.18, 0.45, 0.68],
      source: '公開報道整理',
      say: '個圈係咁轉：輝達投資，或者幫 AI 雲端公司搵錢，例如 CoreWeave；佢哋拎 GPU 做抵押，去借貸市場借錢；借返嚟嘅錢再買輝達 GPU，變返輝達嘅收入。個圈轉得愈快，帳面愈靚。',
    },
    {
      type: 'number', label: '輝達過去兩年自由現金流', value: 1910, unit: '億美元',
      note: '手上現金及有價證券約 *810 億美元*',
      beats: [0.5],
      source: 'LSEG 估算，經鉅亨網（發布前核對）',
      say: '但係公平啲講，輝達唔係冇錢。LSEG 估算，佢兩年賺咗大約一千九百一十億美元自由現金流，手上仲有八百幾億現金。',
    },
    {
      type: 'compare', heading: '所以真正要睇嘅係邊個？',
      left: { title: '輝達', items: ['現金流充裕', '借錢嘅唔係佢'] },
      right: { title: 'AI 雲端公司', items: ['*借錢* 買 GPU', '靠租出算力還債'] },
      beats: [0.05, 0.45],
      say: '所以問題唔喺輝達，而係佢啲客戶：借錢買晶片，再靠租出算力去還債。',
    },

    { type: 'chapter', no: 3, title: '咁同 1999 有幾似？', say: '借錢搞基建，好自然令人諗起一九九九年。' },
    {
      type: 'compare', short: 'b', heading: '1999 vs 2026',
      left: { title: '1999 電訊泡沫', items: ['電訊商 *借錢* 鋪光纖', '需求預期跑贏真實用量', '最後得益：*輕資產* 網絡平台'] },
      right: { title: '2026 AI 基建', items: ['雲端公司 *借錢* 買 GPU', '用 GPU 本身做抵押', '出錢嘅，正係上次嘅得益者'] },
      beats: [0.02, 0.55],
      source: '美銀研究，經豐雲學堂（發布前核對）',
      say: '九十年代末，電訊商大舉借錢鋪光纖，結果泡沫爆咗，得益嘅反而係後來嘅網絡平台。今次出錢起 AI 基建嘅，正正係上次嘅得益者。',
    },
    {
      type: 'bars', short: 'b', heading: '席勒市盈率（CAPE）', unit: ' 倍',
      items: [
        { label: '長期平均', value: 17, show: '約 17' },
        { label: '1999 年高位', value: 44 },
        { label: '而家', value: 41, hi: true, show: '約 41' },
      ],
      source: 'Yahoo 財經、豐雲學堂 2026（發布前核對）',
      say: '估值方面，席勒市盈率長期平均大約十七倍，一九九九年高位四十四倍，而家大約四十一倍。但係，估值高唔等於即刻爆。',
    },

    { type: 'chapter', no: 4, title: '所以，最驚係乜？', say: '所以，真正要驚嘅係咩？' },
    {
      type: 'bullets', heading: 'GPU 做抵押品嘅三個問題',
      items: ['*折舊快*：新晶片一出，舊卡即刻貶值', '*估值難*：二手市場細，唔似樓價咁透明', '*連鎖性*：抵押品同借款人靠同一個需求'],
      say: '將 GPU 當樓咁抵押，有三個問題。第一，折舊快，新晶片一出，舊卡即刻貶值。第二，估值難，二手市場細。第三，連鎖性，一跌就一齊跌。',
    },
    {
      // 兌現開場嘅懸念
      type: 'bullets', heading: '片頭講嘅 *3 個訊號*',
      items: ['AI 雲端公司嘅 *債券孳息*', '科技巨頭 *自由現金流* 有冇轉弱', 'GPU *租用價格* 走勢'],
      say: '返到片頭嘅三個訊號：第一，AI 雲端公司嘅債券孳息有冇繼續上；第二，科技巨頭嘅自由現金流有冇轉弱；第三，GPU 租用價格。呢三樣，好可能比股價更早話你知。',
    },
    {
      type: 'quote', short: 'a', text: 'AI 唔一定係泡沫，\n但*用借返嚟嘅錢*去追，\n就要計清楚個利息。', by: '今集小結',
      say: '所以 AI 唔一定係泡沫，但係用借返嚟嘅錢去追，就一定要計清楚個利息。',
    },
    {
      type: 'outro', cta: '你點睇？', options: ['A 泡沫', 'B 新時代'], lead: '留言揀 A 或者 B，下集回應',
      say: '你覺得今次係泡沫，定係新時代？留言揀 A 或者 B，下集我揀幾個最有意思嘅留言回應。',
    },
  ],

  shorts: {
    a: { title: 'AI 算力\n*變按揭*？' },
    b: { title: '1999 泡沫\n*重演*？' },
  },
};

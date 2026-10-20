// 示範稿：由 AI 根據公開新聞編寫，只用嚟跑通製作流程，唔代表分析師觀點。
// 正式出片時用分析師原稿，經 npm run video:draft 轉成呢個格式，再人工逐句睇過。
// 數字同出處標咗「發布前核對」嘅，一定要用原始來源再核一次。
//
// 格式說明見 video/README.md。口播稿（say）用粵語口語、繁體字；畫面字（big / items 等）用書面語，*星號* 包住嘅字會高亮。

export default {
  id: 'demo',
  brand: '財經浩談',
  // 主題：paper = 紙面手繪風（同現有節目一致），dark = 深色數據卡
  theme: 'paper',
  date: '10.16',
  // 底部常駐免責聲明條（持牌機構嘅節目通常要求）
  disclaimerBar: true,
  // 主持人形象：閉嘴 / 張嘴兩張圖，按配音音量自動切換（假對口型）
  host: { closed: 'host/closed.svg', open: 'host/open.svg', height: 340 },
  title: 'AI 算力變按揭？輝達 5,000 億融資 vs 1999 電訊泡沫｜財經浩談',
  // 封面：兩行大字 + 角標 + 大數字，手機上要一眼睇得清
  // img 用 img/ 入面嘅插畫做封面右半邊
  thumb: { tag: '循環融資', l1: 'AI 算力', l2: '變按揭？', num: '$5,000億', img: 'loop' },
  // 配音：edge-tts 嘅香港粵語聲線（zh-HK-WanLungNeural 男 / zh-HK-HiuMaanNeural 女）；有真人錄音就放入 audio/ 目錄，會優先用
  voice: 'zh-HK-WanLungNeural',
  rate: '+8%',
  tags: ['財經浩談', '輝達', 'AI泡沫', '循環融資', '美股', '宏觀經濟', '粵語財經'],
  description: '輝達聯同六大金融機構，計劃集資逾 5,000 億美元投入 AI 基建。呢套「算力資產化」玩法，同 1999 年電訊商借錢鋪光纖有幾似？今集拆解循環融資、GPU 做抵押品嘅風險，同埋之後要留意嘅三個訊號。',
  disclaimer: '以上內容只供參考，不構成任何投資建議。投資涉及風險，過往表現不代表將來。',

  scenes: [
    {
      type: 'hook', short: 'a', kicker: '今日重點',
      big: '*5,000 億美元*\n借錢起算力', lead: 'AI 算力，開始可以好似樓咁按揭',
      say: '五千億美元。呢筆錢唔係輝達賺返嚟，而係聯同六間華爾街巨頭，準備借返嚟起 AI 數據中心。AI 算力，開始好似樓咁可以按揭。',
    },
    {
      type: 'title', kicker: '財經浩談', title: 'AI 算力變按揭？', lead: '輝達融資平台 vs 1999 電訊泡沫',
      say: '今集拆解下，呢套玩法同一九九九年電訊泡沫有幾似。歡迎收睇財經浩談。',
    },

    { type: 'chapter', no: 1, title: '發生咩事', say: '首先睇下發生咗咩事。' },
    {
      type: 'bullets', heading: '8 月 10 日 輝達宣布',
      items: ['聯同 *6 間金融巨頭* 簽備忘錄', '目標集資 *逾 5,000 億美元*', '以 *債務融資* 為主'],
      beats: [0.05, 0.62, 0.85],
      source: '聯合報、鉅亨網 2026-08（發布前核對）',
      say: '八月十日，輝達聯同阿波羅、黑石、貝萊德、布魯克菲爾德、高盛同 KKR 簽咗備忘錄，目標集資超過五千億美元，主要靠借。',
    },
    {
      type: 'quote', text: '唔係輝達自己出錢，\n而係將*算力*變成\n可以借錢嘅資產。', by: '所以呢',
      say: '所以呢，呢個唔係輝達自己掏錢，而係將算力變成一種可以拎去借錢嘅資產。',
    },

    { type: 'chapter', no: 2, title: '錢點樣兜一個圈', lead: '所謂「循環融資」', say: '市場最擔心嘅，係一個叫循環融資嘅圈。' },
    {
      // 手繪插畫：先出線稿再上色，鏡頭跟住口播推到唔同位置；圖入面冇字，文字用 labels 疊上去
      type: 'sketch', img: 'loop',
      prompt: 'A circular flow diagram as a cartoon: on the left a big green computer chip, at the top center a classical bank building, on the right a tall blue server rack with a small grey storm cloud above it, at the bottom center a money bag; thick orange curved arrows connect them clockwise into a loop.',
      labels: [
        { text: '輝達晶片', x: 21, y: 80, key: '晶片' },
        { text: '華爾街資金', x: 50, y: 56, key: '銀行' },
        { text: 'AI 雲端', x: 80, y: 82, key: '伺服器' },
        { text: '需求轉弱？', x: 82, y: 10, key: '需求', color: '#e03131', rotate: 4 },
      ],
      focus: [
        { key: '晶片', x: 21, y: 50, zoom: 1.6 },
        { key: '銀行', x: 50, y: 35, zoom: 1.6 },
        { key: '伺服器', x: 80, y: 50, zoom: 1.6 },
        { key: '成個圈', x: 50, y: 50, zoom: 1 },
      ],
      say: '想像成一個圈：輝達賣晶片，銀行同基金借錢出嚟，雲端公司用錢買伺服器，再拎伺服器做抵押借更多。成個圈，靠嘅係 AI 需求一路增長。',
    },
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
      source: 'LSEG 估算，經鉅亨網（發布前核對）',
      say: '公平啲講，輝達唔係冇錢。LSEG 估算，佢兩年賺咗大約一千九百一十億美元自由現金流，手上仲有八百幾億現金。',
    },
    {
      type: 'compare', heading: '真正要睇嘅係邊個？',
      left: { title: '輝達', items: ['現金流充裕', '借錢嘅唔係佢'] },
      right: { title: 'AI 雲端公司', items: ['*借錢* 買 GPU', '靠租出算力還債'] },
      beats: [0.05, 0.45],
      say: '所以問題唔係輝達，而係佢啲客戶：借錢買晶片，再靠租出算力去還債。',
    },

    { type: 'chapter', no: 3, title: '1999 年發生過咩', say: '咁點解成日有人拎一九九九年嚟比較？' },
    {
      type: 'compare', short: 'b', heading: '1999 vs 2026',
      left: { title: '1999 電訊泡沫', items: ['電訊商 *借錢* 鋪光纖', '需求預期跑贏真實用量', '最後得益：*輕資產* 網絡平台'] },
      right: { title: '2026 AI 基建', items: ['雲端公司 *借錢* 買 GPU', '用 GPU 本身做抵押', '出錢嘅，正係上次嘅得益者'] },
      beats: [0.02, 0.55],
      source: '美銀研究，經豐雲學堂（發布前核對）',
      say: '九十年代末，電訊商大舉借錢鋪光纖，以為需求會無限增長，結果泡沫爆咗，真正得益嘅反而係後來輕資產嘅網絡平台。今次唔同嘅係，出錢起 AI 基建嘅，正正就係上次嘅得益者，即係嗰班科技巨頭。',
    },
    {
      type: 'bars', short: 'b', heading: '席勒市盈率（CAPE）', unit: ' 倍',
      items: [
        { label: '長期平均', value: 17, show: '約 17' },
        { label: '1999 年高位', value: 44 },
        { label: '而家', value: 41, hi: true, show: '約 41' },
      ],
      source: 'Yahoo 財經、豐雲學堂 2026（發布前核對）',
      say: '估值方面，席勒市盈率長期平均大約十七倍，一九九九年高位係四十四倍，而家大約四十一倍，距離歷史高位只差一步。',
    },

    { type: 'chapter', no: 4, title: 'GPU 可唔可以做抵押', say: '最後一個問題：GPU 可唔可以好似樓咁做抵押？' },
    {
      type: 'bullets', heading: 'GPU 做抵押品嘅三個問題',
      items: ['*折舊快*：新一代晶片一出，舊卡即刻貶值', '*估值難*：二手市場細，唔似樓價咁透明', '*連鎖性*：抵押品同借款人靠同一個需求'],
      say: '將 GPU 當樓咁抵押，有三個問題。第一，折舊快，新晶片一出，舊卡即刻貶值。第二，估值難，二手市場細，唔似樓價咁透明。第三，連鎖性，抵押品同借款人都靠同一個 AI 需求，一跌就一齊跌。',
    },
    {
      type: 'quote', short: 'a', text: 'AI 唔一定係泡沫，\n但*用借返嚟嘅錢*去追，\n就要計清楚個利息。', by: '今集小結',
      say: '所以 AI 唔一定係泡沫，但係用借返嚟嘅錢去追，就一定要計清楚個利息同埋還款期。',
    },
    {
      type: 'bullets', heading: '之後要留意嘅三個訊號',
      items: ['AI 雲端公司嘅 *債券孳息*', '科技巨頭 *自由現金流* 有冇轉弱', 'GPU *租用價格* 走勢'],
      say: '之後可以留意三個訊號：第一，AI 雲端公司嘅債券孳息有冇繼續上；第二，科技巨頭嘅自由現金流有冇轉弱；第三，GPU 租用價格嘅走勢。呢三樣嘢，好可能會比股價更早話你知，個圈仲轉唔轉得落去。',
    },
    {
      type: 'outro', cta: '你點睇？留言話我知', lead: '覺得有用，記得訂閱同分享',
      say: '你覺得今次 AI 熱潮，同一九九九年有幾似？留言話我知。覺得有用嘅，記得訂閱同分享，我哋下集再見。',
    },
  ],

  // Shorts：同一個 short 標記嘅場景會剪成一條 9:16 短片
  shorts: {
    a: { title: 'AI 算力\n*變按揭*？' },
    b: { title: '1999 泡沫\n*重演*？' },
  },
};

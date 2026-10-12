# 把時間拿回來

約 32 秒的原創短片，1920×1080、30fps，有音樂和音效。畫面和聲音全部由程式生成，沒有用到任何外部圖片、影片或音訊素材。

一根光線串起全片：游標 → 時間軸（越繃越緊）→ 停頓 → 吉他弦 → 海平線 → 串起影像、音樂、舞台的金線 → 寫出「Tim」。

## 直接看

- 成片：`dist/take-back-time.mp4`
- 播放器：直接用瀏覽器打開 `preview.html`，可以播放、暫停、重播、拖動進度、按章節跳轉（空白鍵播放或暫停，`,` `.` 逐格）

## 分鏡對照

| 時間 | 畫面 | 聲音 |
|---|---|---|
| 0–1.25 | 游標閃兩下，拉成時間軸 | 兩聲「滴」、一聲亮的「嘶」 |
| 1.25–4 | 空間從光線向上下展開，鏡頭加速穿過文字、音波、時間軸｜「我學會了加速。」 | 低頻打開，電子節奏開始 |
| 4–8 | 文字變成影片、想法變成舞台、音波捲成唱片 | 每次組裝完成都有卡位聲和一聲鐘音 |
| 8–11 | 「待辦、修改、上線、下一個」湧進來，空間收窄，光線繃緊｜「也差點忘了，為什麼出發。」 | 十六分音符、滴答聲、通知聲越來越密 |
| **11.0** | **畫面凍結，所有元素退去，只剩光線** | **連同殘響一起切斷，完全安靜** |
| 12.25 | 手指拉住弦後放開，光線振動 | 一聲 D 弦撥弦 |
| 13.6–16.6 | 鏡頭推近成纏繞的銅弦，再拉遠，弦變成海平線（失焦的散景對焦成海面碎光） | 溫暖的長音鋪底，浪聲進來 |
| 16.6–23 | 夕陽、海浪、風；取景框和快門（攝影）、舞台上的一束光（演講）｜「留一點時間，給喜歡的事。」 | 指彈分解和弦；每個音都讓海平線上亮起一道光脈衝；對焦提示音、快門、開燈聲、浪湧上岸 |
| 23–27.4 | 海平線上升成金線，依序畫出影像、音樂、舞台三個圖案（呼應 4–8 秒的組裝）｜「讓想法成真。」「讓生活有光。」 | 節奏再次上升但更開闊；每畫完一個圖案一聲鐘琴 |
| 27.4–32 | 金線寫出「Tim」，i 的點落下，開場的游標換成暖色再閃兩下｜「快慢之間，我有自己的節奏。」 | 寫字聲跟著光頭速度走；開場那聲「滴」低八度再出現，最後一個和弦慢慢收尾 |

## 怎麼修改

所有時間點只寫在一個地方：`src/timeline.js`。畫面和聲音都從這裡讀，改了時間兩邊會一起移動。

| 想改的東西 | 檔案 |
|---|---|
| 字幕文字、出現時間、節點 | `src/timeline.js` |
| 0–12 秒：創作空間、組裝、擁擠、停頓 | `src/space.js`、`src/sprites.js` |
| 光線本身：緊繃、撥弦振動、銅弦特寫 | `src/string.js` |
| 海景、取景框、聚光燈 | `src/sea.js` |
| 金線、三個圖案、Tim 的筆畫、結尾游標 | `src/finale.js`（`TIM` 是 Tim 的貝茲曲線） |
| 合成、泛光、字幕樣式、顆粒、淡出 | `src/film.js` |
| 配樂與音效 | `src/audio/score.js`（音色和效果器在 `src/audio/synth.js`） |

改了字幕或畫面裡的字之後要重新下載字型子集：`npm run fonts`。

### 邊改邊看

```bash
npm install          # 只裝 playwright-core（渲染用）
npm run audio        # 先產生 dist/audio.wav
npm run studio       # 打開 http://localhost:5173/studio.html
```

工作台用和成片同一份程式碼即時渲染，可以拖動時間軸，聲音同步。

### 輸出成片

```bash
npm run build        # = audio → frames → encode，約 6–7 分鐘（4 核心）
```

- 需要：Node 20+、ffmpeg（含 libx264）、Chromium。Chromium 可以用 `npx playwright install chromium` 安裝，或用 `CHROME=/path/to/chrome` 指定本機的 Chrome。
- 只重算某一段畫面：`FROM=11 TO=16 npm run frames`，再跑 `npm run encode`。
- 想要 60fps：`FPS=60 npm run frames && FPS=60 npm run encode`（渲染時間加倍）。
- 畫質：`CRF=18 npm run encode`（數字越小畫質越高、檔案越大，預設 20，約 21 MB）。
- 審片靜幀：`SET=名稱 node scripts/stills.mjs 11.0 12.3 15.4`，輸出到 `review/`（不會提交進 git）。

## 目錄

```
preview.html        成片播放器
studio.html         即時工作台
src/                畫面與聲音的原始碼（原生 ES Module，零依賴）
src/audio/          合成器與配樂編排（只用 Node 內建模組）
scripts/            渲染、合成、字型下載、靜態伺服器
assets/fonts/       Noto Sans TC / Noto Serif TC 子集（SIL OFL 1.1，見 OFL.txt）
dist/               成片 mp4 與海報圖（audio.wav 可重新產生，不提交）
```

## 素材來源

- 畫面：Canvas 2D 程式繪製。
- 聲音：自寫的合成器（Karplus-Strong 撥弦、FM 鐘音、減法合成、Freeverb 殘響），沒有取樣素材。
- 字型：Google Fonts 的 Noto Sans TC、Noto Serif TC，SIL Open Font License 1.1。

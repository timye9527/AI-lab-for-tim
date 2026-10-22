// 渲染 3:4 封面（1080×1440）：node scripts/cover.mjs
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';
const server = await serve(0); const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1440 } });
for (const v of ['a', 'b']) {
  await page.goto(`http://127.0.0.1:${port}/cover/index.html?v=${v}`);
  await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 60000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `out/cover/封面${v.toUpperCase()}_3x4.png` });
  console.log('cover', v);
}
await browser.close(); server.close();

// 静态页面截图：node scripts/snap.mjs src/sheet.html dist/character-sheet.png 1920 1200
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';
const [page0, out, w = 1920, h = 1080] = process.argv.slice(2);
const server = await serve(5176);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
page.on('pageerror', (e) => console.log('[error]', e.message));
page.on('console', (m) => console.log('[console]', m.text()));
await page.goto(`http://localhost:5176/${page0}`);
await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
await page.screenshot({ path: out });
await browser.close();
server.close();
console.log('输出', out);

// 发布预览整图 → out/sample/发布预览.png
import { createRequire } from 'node:module';
const ROOT = new URL('../', import.meta.url).pathname;
const { chromium } = createRequire(ROOT + 'out/package.json')('playwright-core');
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 2400, height: 1000 } });
await p.goto(`file://${ROOT}production/preview.html`);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: `${ROOT}out/sample/发布预览.png`, fullPage: true });
await b.close();
console.log('preview done');

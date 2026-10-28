// 截一张页面：node scripts/snap.mjs film/src/sheet.html out/film/sheet.png [宽 高]
import { serve } from './serve.mjs';
import { launch } from './browser.mjs';
const [page, out, w = 1920, h = 1080] = process.argv.slice(2);
const server = await serve();
const b = await launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on('pageerror', (e) => console.log('[error]', e.message));
p.on('console', (m) => m.type() === 'error' && console.log('[console]', m.text()));
await p.goto(`http://localhost:${server.address().port}/${page}`);
await p.waitForFunction('window.ready === true', null, { timeout: 60000 });
await p.screenshot({ path: new URL(`../../${out}`, import.meta.url).pathname });
await b.close(); server.close();
console.log('→', out);

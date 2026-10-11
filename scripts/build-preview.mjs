// 打包一个静态预览版到 out/preview/（样式内联，页面不带 html/head/body，适合 claude.ai 等托管）
// 用法：node scripts/build-preview.mjs [测试id]
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const id = process.argv[2] || 'jiucai';
const test = (await import(`../public/tests/${id}/config.js`)).default;
const out = 'out/preview';
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/tests/${id}`, { recursive: true });
cpSync('public/engine', `${out}/engine`, { recursive: true });
cpSync(`public/tests/${id}/config.js`, `${out}/tests/${id}/config.js`);
const css = readFileSync('public/engine/style.css', 'utf8');
writeFileSync(
  `${out}/index.html`,
  `<title>${test.title}</title>
<style>
${css}
</style>
<main id="app" data-test="${id}"><p style="text-align:center;color:#9aa59e;padding-top:40vh">加载中…</p></main>
<script type="module" src="engine/app.js"></script>
`,
);
console.log(`预览包已生成：${out}/`);

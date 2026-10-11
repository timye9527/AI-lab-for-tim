// 打包一个静态预览版到 out/preview/（样式内联，页面不带 html/head/body，适合 claude.ai 等托管）
// 用法：npm run build:preview -- [测试id] [--mode start|report|none] [--out 目录]
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const id = args[0] && !args[0].startsWith('--') ? args[0] : 'jiucai';
const mode = flag('--mode');
const test = (await import(`../public/tests/${id}/config.js`)).default;
const out = flag('--out') || 'out/preview';
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/tests/${id}`, { recursive: true });
cpSync('public/engine', `${out}/engine`, { recursive: true });
// 指定 --mode 时，用一个包装文件覆盖付费方式，原配置不动
if (mode) {
  cpSync(`public/tests/${id}/config.js`, `${out}/tests/${id}/base.js`);
  writeFileSync(
    `${out}/tests/${id}/config.js`,
    `import base from './base.js';\nexport default { ...base, paywall: { ...base.paywall, mode: '${mode}' } };\n`,
  );
} else {
  cpSync(`public/tests/${id}/config.js`, `${out}/tests/${id}/config.js`);
}
const css = readFileSync('public/engine/style.css', 'utf8');
writeFileSync(
  `${out}/index.html`,
  `<title>${test.title}${mode ? `（${{ start: '先付费', report: '先玩后付', none: '免费' }[mode] || mode}）` : ''}</title>
<style>
${css}
</style>
<main id="app" data-test="${id}"><p style="text-align:center;color:#9aa59e;padding-top:40vh">加载中…</p></main>
<script type="module" src="engine/app.js"></script>
`,
);
console.log(`预览包已生成：${out}/${mode ? `（付费方式：${mode}）` : ''}`);

// 把分析师原稿改编成分镜脚本 video/episodes/<集id>/episode.js（AI 整理，出片前必须人工逐句审）
// 用法：npm run video:draft -- <原稿.md|.txt> <集id> [--byline 署名] [--force]
// 需要 Anthropic API 密钥：export ANTHROPIC_API_KEY=...
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { REQUIRED } from '../video/engine/scenes.js';

const argv = process.argv.slice(2);
const byIdx = argv.indexOf('--byline');
const byline = byIdx >= 0 ? argv[byIdx + 1] : '';
const args = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--byline');
const [src, id] = args;
if (!src || !id || !existsSync(src)) {
  console.log('用法：npm run video:draft -- <原稿.md|.txt> <集id> [--byline 署名] [--force]');
  process.exit(1);
}
const dir = `video/episodes/${id}`;
const out = `${dir}/episode.js`;
if (existsSync(out) && !process.argv.includes('--force')) {
  console.log(`${out} 已存在，加 --force 覆盖`);
  process.exit(1);
}

// 系统提示词固定不变（规矩 + 示范集 v2），开启缓存，连续改编多篇时便宜很多
const system = readFileSync('video/prompts/draft.md', 'utf8').replace('{{EXAMPLE}}', '```js\n' + readFileSync('video/episodes/demo-v2/episode.js', 'utf8') + '\n```');
const article = readFileSync(src, 'utf8');

const client = new Anthropic();
console.log(`改编 ${src} → ${out} …（长稿要一两分钟）`);
let msg;
try {
  const stream = client.beta.messages.stream({
    model: 'claude-opus-5-5',
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    // 被安全分类器拒绝时，服务端自动换模型重试
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `集 id：${id}\n署名：${byline || '（未提供）'}\n\n原稿：\n\n${article}` }],
  });
  msg = await stream.finalMessage();
} catch (e) {
  if (e instanceof Anthropic.AuthenticationError) console.log('API 密钥无效，检查 ANTHROPIC_API_KEY');
  else if (e instanceof Anthropic.RateLimitError) console.log('请求太频繁，等一会再试');
  else if (e instanceof Anthropic.APIError) console.log(`API 出错 ${e.status}：${e.message}`);
  else console.log(`连不上 API：${e.message}`);
  process.exit(1);
}
if (msg.stop_reason === 'refusal') {
  console.log('模型拒绝了这篇稿，检查原稿内容');
  process.exit(1);
}
if (msg.stop_reason === 'max_tokens') console.log('⚠️ 输出被截断，稿件可能太长，考虑分两集');

const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
const code = text.match(/```(?:js|javascript)?\n([\s\S]*?)```/)?.[1] ?? text;
mkdirSync(dir, { recursive: true });
writeFileSync(out, `// 由 npm run video:draft 根据 ${src} 生成，出片前人工逐句审过再删掉这行\n${code.trim()}\n`);

// 能不能正常载入、场景字段齐不齐
try {
  const ep = (await import(`../${out}?t=${Date.now()}`)).default;
  const bad = ep.scenes.filter((s) => !REQUIRED[s.type] || REQUIRED[s.type].some((f) => s[f] == null) || !s.say);
  const words = ep.scenes.reduce((a, s) => a + [...s.say].length, 0);
  console.log(`完成：${ep.scenes.length} 个场景，口播约 ${words} 字（约 ${Math.round(words / 5 / 60)} 分钟）${bad.length ? `，⚠️ ${bad.length} 个场景字段不全` : ''}`);
} catch (e) {
  console.log(`⚠️ 生成的文件载入失败，要手动修：${e.message}`);
}
const u = msg.usage;
console.log(`用量：输入 ${u.input_tokens}（缓存命中 ${u.cache_read_input_tokens ?? 0}），输出 ${u.output_tokens}`);
console.log(`下一步：人工审 ${out} → npm run video -- ${id} --preview`);

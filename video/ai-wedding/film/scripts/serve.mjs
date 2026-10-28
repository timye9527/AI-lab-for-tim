// 零依赖静态服务器，根目录是 video/ai-wedding（画面要读 out/film/timeline.json 和 assets/）
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json' };
export function serve(port = 0) {
  const server = createServer(async (req, res) => {
    try {
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = normalize(join(root, p));
      if (!file.startsWith(root)) throw new Error('forbidden');
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  // 端口由系统分配，避免冲突（蕲春项目踩过）
  return new Promise((r) => server.listen(port, () => r(server)));
}

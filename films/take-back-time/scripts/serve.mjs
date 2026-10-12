// 零依賴靜態伺服器：npm run studio 後打開 http://localhost:5173/studio.html
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };

export function serve(port = 5173) {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p === '/') p = '/preview.html';
      const file = normalize(join(root, p));
      if (!file.startsWith(root)) throw new Error('forbidden');
      const st = await stat(file);
      const type = TYPES[extname(file)] || 'application/octet-stream';
      // 影音支援 Range，瀏覽器才能拖動進度
      const range = req.headers.range;
      const data = await readFile(file);
      if (range) {
        const [a, b] = range.replace('bytes=', '').split('-');
        const start = Number(a);
        const end = b ? Number(b) : st.size - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
        res.end(data.subarray(start, end + 1));
      } else {
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
        res.end(data);
      }
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 5173);
  await serve(port);
  console.log(`成片播放器  http://localhost:${port}/preview.html`);
  console.log(`即時工作台  http://localhost:${port}/studio.html`);
}
